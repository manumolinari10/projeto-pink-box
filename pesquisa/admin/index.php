<?php

declare(strict_types=1);

require __DIR__ . '/../includes/supabase_client.php';
require __DIR__ . '/../includes/admin_auth.php';

const SURVEY_SLUG = 'mary-kay-management-survey';

$config = require __DIR__ . '/../config/supabase.php';
$message = null;
$error = null;

function h(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function type_label(?string $type): string
{
    return [
        'single_choice' => 'Seleção única',
        'multiple_choice' => 'Múltipla escolha',
        'text' => 'Texto curto',
        'textarea' => 'Texto longo',
        'rating' => 'Classificação',
    ][$type ?? ''] ?? (string) $type;
}

function redirect_admin(string $tab = 'form'): never
{
    header('Location: index.php?tab=' . rawurlencode($tab));
    exit;
}

function load_admin_survey(array $config): array
{
    $surveys = supabase_request(
        $config,
        'GET',
        'surveys?slug=eq.' . rawurlencode(SURVEY_SLUG) . '&select=id,slug,public_title,description'
    );

    if ($surveys === []) {
        throw new RuntimeException('Pesquisa não encontrada.');
    }

    $survey = $surveys[0];
    $sections = supabase_request(
        $config,
        'GET',
        'survey_sections?survey_id=eq.' . rawurlencode($survey['id']) . '&select=id,section_key,section_title,section_description,display_order,is_active&order=display_order.asc'
    );

    $sectionIds = array_column($sections, 'id');
    $questions = [];
    $options = [];

    if ($sectionIds !== []) {
        $questions = supabase_request(
            $config,
            'GET',
            'questions?section_id=' . supabase_filter_in($sectionIds) . '&select=id,section_id,question_key,question_title,help_text,question_type,is_required,display_order,placeholder_text,min_selections,max_selections,is_active&order=display_order.asc'
        );
    }

    $questionIds = array_column($questions, 'id');

    if ($questionIds !== []) {
        $options = supabase_request(
            $config,
            'GET',
            'question_options?question_id=' . supabase_filter_in($questionIds) . '&select=id,question_id,option_key,option_label,option_value,numeric_value,display_order,allows_free_text,is_active&order=display_order.asc'
        );
    }

    $optionsByQuestion = [];

    foreach ($options as $option) {
        $optionsByQuestion[$option['question_id']][] = $option;
    }

    $questionsBySection = [];

    foreach ($questions as $question) {
        $question['options'] = $optionsByQuestion[$question['id']] ?? [];
        $questionsBySection[$question['section_id']][] = $question;
    }

    foreach ($sections as &$section) {
        $section['questions'] = $questionsBySection[$section['id']] ?? [];
    }

    unset($section);

    return [
        'survey' => $survey,
        'sections' => $sections,
    ];
}

function load_responses(array $config): array
{
    return supabase_request(
        $config,
        'GET',
        'survey_responses?survey_slug=eq.' . rawurlencode(SURVEY_SLUG) . '&select=id,created_at,responses,metadata&order=created_at.desc&limit=100'
    );
}

function format_answer(mixed $answer): string
{
    if (is_array($answer)) {
        $parts = [];

        if (isset($answer['selected'])) {
            $selected = is_array($answer['selected']) ? $answer['selected'] : [$answer['selected']];
            $parts[] = implode(', ', array_map('strval', $selected));
        }

        if (!empty($answer['other'])) {
            $parts[] = 'Outra: ' . $answer['other'];
        }

        if ($parts !== []) {
            return implode(' | ', $parts);
        }

        return json_encode($answer, JSON_UNESCAPED_UNICODE) ?: '';
    }

    return (string) $answer;
}

function format_datetime_br(string $value): string
{
    $date = new DateTimeImmutable($value);
    return $date->setTimezone(new DateTimeZone('America/Sao_Paulo'))->format('d/m/Y H:i');
}

function render_answer(mixed $answer): string
{
    if (is_array($answer) && isset($answer['selected'])) {
        $selected = is_array($answer['selected']) ? $answer['selected'] : [$answer['selected']];
        $items = '';

        foreach ($selected as $value) {
            if (!empty($answer['other']) && $value === 'Outra') {
                continue;
            }

            $items .= '<li>' . h((string) $value) . '</li>';
        }

        if (!empty($answer['other'])) {
            $items .= '<li><span class="answer-other"><strong>Outra:</strong> ' . h((string) $answer['other']) . '</span></li>';
        }

        return '<ul class="answer-bullets">' . $items . '</ul>';
    }

    return h(format_answer($answer));
}

function build_report(array $sections, array $responses): array
{
    $report = [];

    foreach ($sections as $section) {
        $sectionReport = [
            'title' => $section['section_title'],
            'questions' => [],
        ];

        foreach ($section['questions'] as $question) {
            $key = $question['question_key'];
            $type = $question['question_type'];
            $counts = [];
            $texts = [];
            $total = 0;

            foreach ($responses as $response) {
                $answer = $response['responses'][$key] ?? null;

                if ($answer === null || $answer === '') {
                    continue;
                }

                if (is_array($answer) && isset($answer['selected'])) {
                    $selected = is_array($answer['selected']) ? $answer['selected'] : [$answer['selected']];

                    foreach ($selected as $value) {
                        $label = (string) $value;
                        $counts[$label] = ($counts[$label] ?? 0) + 1;
                        $total++;
                    }

                    continue;
                }

                if ($type === 'text' || $type === 'textarea') {
                    $texts[] = (string) $answer;
                    $total++;
                    continue;
                }

                $label = (string) $answer;
                $counts[$label] = ($counts[$label] ?? 0) + 1;
                $total++;
            }

            arsort($counts);

            $sectionReport['questions'][] = [
                'title' => $question['question_title'],
                'type' => $type,
                'total' => $total,
                'counts' => $counts,
                'texts' => $texts,
            ];
        }

        $report[] = $sectionReport;
    }

    return $report;
}

function donut_gradient(array $counts, int $total): string
{
    if ($total <= 0 || $counts === []) {
        return '#eee7ea 0 360deg';
    }

    $colors = ['#cf0074', '#ef69ad', '#f5a9ca', '#9e0058', '#51343f', '#d9a3b8', '#7a5262'];
    $segments = [];
    $start = 0.0;
    $index = 0;

    foreach ($counts as $count) {
        $degrees = ((int) $count / $total) * 360;
        $end = $start + $degrees;
        $color = $colors[$index % count($colors)];
        $segments[] = $color . ' ' . round($start, 2) . 'deg ' . round($end, 2) . 'deg';
        $start = $end;
        $index++;
    }

    return implode(', ', $segments);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    try {
        if ($action === 'login') {
            if (admin_login($config, trim((string) $_POST['username']), (string) $_POST['password'])) {
                redirect_admin();
            }

            $error = 'Login inválido ou senha administrativa não configurada.';
        } elseif ($action === 'logout') {
            admin_logout();
            redirect_admin();
        } elseif (admin_is_logged_in()) {
            if ($action === 'update_question') {
                $questionId = (string) $_POST['question_id'];
                supabase_request($config, 'PATCH', 'questions?id=eq.' . rawurlencode($questionId), [
                    'question_title' => trim((string) $_POST['question_title']),
                    'help_text' => trim((string) $_POST['help_text']) ?: null,
                    'question_type' => (string) $_POST['question_type'],
                    'is_required' => isset($_POST['is_required']),
                    'display_order' => (int) $_POST['display_order'],
                    'placeholder_text' => trim((string) $_POST['placeholder_text']) ?: null,
                    'min_selections' => $_POST['min_selections'] !== '' ? (int) $_POST['min_selections'] : null,
                    'max_selections' => $_POST['max_selections'] !== '' ? (int) $_POST['max_selections'] : null,
                    'is_active' => isset($_POST['is_active']),
                ]);
                redirect_admin('form');
            }

            if ($action === 'create_question') {
                supabase_request($config, 'POST', 'questions', [[
                    'section_id' => (string) $_POST['section_id'],
                    'question_key' => trim((string) $_POST['question_key']),
                    'question_title' => trim((string) $_POST['question_title']),
                    'question_type' => (string) $_POST['question_type'],
                    'is_required' => isset($_POST['is_required']),
                    'display_order' => (int) $_POST['display_order'],
                    'help_text' => trim((string) $_POST['help_text']) ?: null,
                ]]);
                redirect_admin('form');
            }

            if ($action === 'update_option') {
                $optionId = (string) $_POST['option_id'];
                supabase_request($config, 'PATCH', 'question_options?id=eq.' . rawurlencode($optionId), [
                    'option_label' => trim((string) $_POST['option_label']),
                    'option_value' => trim((string) $_POST['option_value']),
                    'numeric_value' => $_POST['numeric_value'] !== '' ? (float) $_POST['numeric_value'] : null,
                    'display_order' => (int) $_POST['display_order'],
                    'allows_free_text' => isset($_POST['allows_free_text']),
                    'is_active' => isset($_POST['is_active']),
                ]);
                redirect_admin('form');
            }

            if ($action === 'create_option') {
                supabase_request($config, 'POST', 'question_options', [[
                    'question_id' => (string) $_POST['question_id'],
                    'option_key' => trim((string) $_POST['option_key']),
                    'option_label' => trim((string) $_POST['option_label']),
                    'option_value' => trim((string) $_POST['option_value']),
                    'numeric_value' => $_POST['numeric_value'] !== '' ? (float) $_POST['numeric_value'] : null,
                    'display_order' => (int) $_POST['display_order'],
                    'allows_free_text' => isset($_POST['allows_free_text']),
                    'is_active' => true,
                ]]);
                redirect_admin('form');
            }
        }
    } catch (Throwable $exception) {
        $error = $exception->getMessage();
    }
}

$loggedIn = admin_is_logged_in();
$tab = $_GET['tab'] ?? 'form';
$surveyData = null;
$responses = [];
$report = [];

if ($loggedIn) {
    try {
        $surveyData = load_admin_survey($config);
        $responses = in_array($tab, ['responses', 'report'], true) ? load_responses($config) : [];
        $report = $tab === 'report' ? build_report($surveyData['sections'] ?? [], $responses) : [];
    } catch (Throwable $exception) {
        $error = $exception->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel PinkBox</title>
    <style>
        :root {
            --bg: #f8f7f6;
            --card: #ffffff;
            --card-soft: #f4f2f1;
            --edit-bg: #ebe7e6;
            --text: #242021;
            --muted: #75676d;
            --primary: #cf0074;
            --primary-dark: #9e0058;
            --pink-soft: #ffdce9;
            --line: #ece7e5;
            --brown: #51343f;
            --shadow: 0 24px 60px rgba(67, 43, 53, .08);
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            min-height: 100vh;
            font-family: "Sora", "Segoe UI", sans-serif;
            font-weight: 400;
            color: var(--text);
            background: var(--bg);
            -webkit-font-smoothing: antialiased;
            text-rendering: geometricPrecision;
        }

        a { color: inherit; }

        button,
        input,
        select,
        textarea {
            font: inherit;
        }

        .brand-row {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .brand-mark {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            color: #fff;
            background: linear-gradient(180deg, #e40082, #b80066);
            box-shadow: 0 12px 28px rgba(207, 0, 116, .22);
            font-weight: 900;
        }

        .brand-title {
            margin: 0;
            font-size: 1.35rem;
            letter-spacing: -.05em;
            line-height: 1;
            font-weight: 650;
        }

        .brand-subtitle {
            margin: 5px 0 0;
            color: var(--muted);
            font-size: .68rem;
            text-transform: uppercase;
            letter-spacing: .18em;
        }

        .create-button {
            border: 0;
            border-radius: 999px;
            padding: 13px 20px;
            background: linear-gradient(180deg, #d6007a, #bc006a);
            color: #fff;
            font-weight: 650;
            box-shadow: 0 14px 26px rgba(207, 0, 116, .18);
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }

        .logout-button,
        .icon-button {
            border: 0;
            border-radius: 999px;
            padding: 10px 14px;
            background: rgba(255,255,255,.58);
            color: var(--brown);
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 10px 22px rgba(67, 43, 53, .06);
        }

        .main-panel {
            width: min(1180px, calc(100% - 48px));
            margin: 0 auto;
            padding: 26px 0 44px;
        }

        .top-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 56px;
        }

        .product-name {
            margin: 0;
            color: var(--primary);
            font-size: 1.7rem;
            letter-spacing: -.07em;
            font-weight: 650;
        }

        .top-tabs {
            display: flex;
            align-items: center;
            gap: 34px;
        }

        .top-tab {
            padding-bottom: 10px;
            text-decoration: none;
            color: #4d343d;
            font-size: 1.05rem;
            font-weight: 400;
        }

        .top-tab.is-active {
            color: var(--primary);
            border-bottom: 2px solid var(--primary);
        }

        .top-actions {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .public-link {
            border-radius: 999px;
            padding: 12px 18px;
            text-decoration: none;
            color: var(--primary-dark);
            background: rgba(255,255,255,.72);
            box-shadow: 0 10px 22px rgba(67, 43, 53, .06);
            font-weight: 600;
        }

        .hero {
            margin-bottom: 42px;
        }

        .eyebrow {
            margin: 0 0 18px;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: .28em;
            font-size: .78rem;
            font-weight: 700;
        }

        .hero-title {
            margin: 0;
            max-width: 760px;
            font-size: clamp(3rem, 5vw, 5rem);
            line-height: .96;
            letter-spacing: -.08em;
            font-weight: 650;
        }

        .hero-copy {
            max-width: 650px;
            margin: 22px 0 0;
            color: var(--muted);
            font-size: 1.1rem;
            line-height: 1.55;
            font-weight: 350;
        }

        .card {
            background: rgba(255,255,255,.78);
            border-radius: 26px;
            box-shadow: var(--shadow);
            margin-bottom: 64px;
            overflow: hidden;
        }

        .section-heading {
            border-left: 5px solid var(--primary);
            padding-left: 24px;
            margin: 76px 0 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
        }

        .hero + .section-heading {
            margin-top: 0;
        }

        .section-heading h2 {
            margin: 0;
            font-size: 1.55rem;
            letter-spacing: -.04em;
            font-weight: 650;
        }

        .section-heading p {
            margin: 4px 0 0;
            color: var(--muted);
        }

        .question-table {
            width: 100%;
        }

        .table-head,
        .question-row {
            display: grid;
            grid-template-columns: 78px minmax(0, 1fr) 160px 130px 150px;
            gap: 22px;
            align-items: center;
            padding: 24px 32px;
        }

        .table-head {
            background: #f1efee;
            color: #85777d;
            text-transform: uppercase;
            letter-spacing: .18em;
            font-size: .72rem;
            font-weight: 650;
        }

        .question-row {
            border-top: 1px solid var(--line);
            background: rgba(255,255,255,.52);
        }

        .question-title {
            margin: 0;
            font-size: 1.05rem;
            font-weight: 600;
            letter-spacing: -.03em;
        }

        .question-help {
            margin: 5px 0 0;
            color: var(--muted);
            font-size: .82rem;
            font-style: italic;
            font-weight: 350;
        }

        .pill {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            width: fit-content;
            border-radius: 999px;
            padding: 8px 14px;
            background: var(--pink-soft);
            color: #321820;
            font-size: .7rem;
            text-transform: uppercase;
            letter-spacing: .08em;
            font-weight: 650;
        }

        .status-dot {
            width: 44px;
            height: 22px;
            border-radius: 999px;
            display: inline-flex;
            justify-content: flex-end;
            align-items: center;
            padding: 3px;
            background: #f8d9e6;
        }

        .status-dot::after {
            content: "";
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--primary);
        }

        .status-dot.is-off {
            justify-content: flex-start;
            background: #f0e9ec;
        }

        .status-dot.is-off::after {
            background: #fff;
        }

        .inline-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }

        .small-button {
            border: 0;
            border-radius: 999px;
            padding: 10px 15px;
            background: linear-gradient(180deg, #fff, #f7f0f3);
            color: var(--primary);
            cursor: pointer;
            font-size: .74rem;
            font-weight: 650;
            text-transform: uppercase;
            letter-spacing: .08em;
            box-shadow: 0 10px 20px rgba(67, 43, 53, .08);
        }

        .question-card {
            padding: 0 40px;
            background: var(--edit-bg);
            border-top: 1px solid var(--line);
        }

        .accordion-panel {
            max-height: 0;
            opacity: 0;
            overflow: hidden;
            transform: translateY(-8px);
            transition: max-height .36s ease, opacity .24s ease, transform .24s ease, padding-top .24s ease, padding-bottom .24s ease;
        }

        .accordion-panel.is-open {
            max-height: 4200px;
            opacity: 1;
            transform: translateY(0);
            padding-top: 34px;
            padding-bottom: 42px;
        }

        .question-card form {
            display: grid;
            gap: 24px;
        }

        .option-card {
            margin-top: 24px;
            padding: 22px;
            border-radius: 22px;
            background: rgba(255,255,255,.58);
        }

        .option-card strong {
            display: block;
            margin-bottom: 18px;
            font-weight: 650;
            letter-spacing: -.02em;
        }

        .option-create-panel {
            display: none !important;
        }

        .option-create-panel.is-open {
            display: grid !important;
        }

        .option-add-trigger {
            margin-top: 24px;
        }

        label {
            display: grid;
            gap: 10px;
            color: var(--muted);
            font-size: .82rem;
            font-weight: 600;
        }

        input,
        select,
        textarea {
            width: 100%;
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 14px 16px;
            background: rgba(255,255,255,.92);
            color: var(--text);
        }

        textarea { min-height: 96px; }

        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
        .grid-4 { display: grid; grid-template-columns: 1.2fr 1.2fr .7fr .7fr; gap: 20px; }
        .checks { display: flex; gap: 18px; flex-wrap: wrap; align-items: center; margin-top: 6px; }
        .checks label { display: inline-flex; align-items: center; gap: 8px; }
        .checks input { width: auto; }

        button,
        .primary {
            border: 0;
            border-radius: 999px;
            padding: 12px 18px;
            background: linear-gradient(180deg, #fff, #f7f0f3);
            color: var(--primary-dark);
            cursor: pointer;
            font-weight: 650;
            box-shadow: 0 10px 22px rgba(67, 43, 53, .08);
        }

        .primary {
            background: linear-gradient(180deg, #d6007a, #bc006a);
            color: #fff;
        }

        .muted { color: var(--muted); }

        .alert {
            padding: 16px 18px;
            border-radius: 18px;
            margin-bottom: 22px;
            background: #fff0f6;
            color: #7f104b;
        }

        .modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 20;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(36, 32, 33, .32);
            backdrop-filter: blur(8px);
        }

        .modal-backdrop.is-open {
            display: flex;
        }

        .modal-card {
            width: min(760px, 100%);
            max-height: min(760px, calc(100vh - 48px));
            overflow: auto;
            border-radius: 30px;
            background: #f7f4f3;
            box-shadow: 0 30px 90px rgba(36, 32, 33, .22);
            padding: 34px;
        }

        .modal-head {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: flex-start;
            margin-bottom: 24px;
        }

        .modal-head h3 {
            margin: 0;
            font-size: 1.45rem;
            letter-spacing: -.04em;
        }

        .modal-form {
            display: grid;
            gap: 26px;
        }

        .modal-form .grid {
            gap: 28px;
        }

        .modal-form label {
            gap: 8px;
        }

        .modal-form textarea {
            min-height: 64px;
        }

        .modal-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-top: 6px;
        }

        .modal-settings {
            display: flex;
            align-items: center;
            gap: 24px;
            flex-wrap: wrap;
        }

        .modal-footer-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 14px;
        }

        .login-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
        }

        .login-card {
            width: min(460px, 100%);
            border-radius: 30px;
            background: rgba(255,255,255,.9);
            box-shadow: var(--shadow);
            padding: 32px;
        }

        .login-card h1 {
            margin: 0;
            color: var(--primary);
            letter-spacing: -.06em;
        }

        .response-card {
            padding: 26px 32px;
        }

        .response-list {
            display: grid;
            gap: 16px;
        }

        .response-item {
            border-radius: 24px;
            background: rgba(255,255,255,.78);
            box-shadow: var(--shadow);
            overflow: hidden;
        }

        .response-summary {
            width: 100%;
            border: 0;
            background: transparent;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 220px 44px;
            align-items: center;
            gap: 20px;
            padding: 24px 30px;
            color: var(--text);
            cursor: pointer;
            text-align: left;
            box-shadow: none;
        }

        .response-id {
            display: grid;
            gap: 5px;
            min-width: 0;
        }

        .response-id span {
            color: var(--muted);
            font-size: .72rem;
            text-transform: uppercase;
            letter-spacing: .18em;
        }

        .response-id strong {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 600;
            letter-spacing: -.02em;
        }

        .response-date {
            color: var(--muted);
            font-size: .92rem;
            font-weight: 400;
        }

        .response-arrow {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--pink-soft);
            color: var(--primary);
            transition: transform .2s ease;
            position: relative;
            display: inline-block;
        }

        .response-arrow::before {
            content: "";
            position: absolute;
            left: 50%;
            top: 48%;
            width: 8px;
            height: 8px;
            border-right: 2px solid currentColor;
            border-bottom: 2px solid currentColor;
            transform: translate(-50%, -50%) rotate(45deg);
            transform-origin: center;
        }

        .response-item.is-open .response-arrow {
            transform: rotate(180deg);
        }

        .response-details {
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: max-height .35s ease, opacity .2s ease, padding .25s ease;
            padding: 0 30px;
        }

        .response-item.is-open .response-details {
            max-height: 5000px;
            opacity: 1;
            padding: 0 30px 30px;
        }

        .response-category {
            padding-top: 26px;
            margin-top: 22px;
            border-top: 1px solid var(--line);
        }

        .response-category:first-child {
            margin-top: 0;
        }

        .response-category-title {
            margin: 0 0 16px;
            color: var(--primary);
            font-size: .78rem;
            text-transform: uppercase;
            letter-spacing: .2em;
            font-weight: 700;
        }

        .answer-list {
            display: grid;
            gap: 14px;
        }

        .answer-row {
            display: grid;
            grid-template-columns: minmax(220px, .8fr) minmax(0, 1.2fr);
            gap: 22px;
            align-items: start;
            padding: 16px 18px;
            border-radius: 18px;
            background: rgba(248,244,245,.7);
        }

        .answer-question {
            font-weight: 600;
            letter-spacing: -.02em;
        }

        .answer-value {
            color: var(--muted);
            line-height: 1.45;
        }

        .report-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            margin-bottom: 34px;
        }

        .report-card {
            padding: 24px 26px;
            margin-bottom: 0;
        }

        .report-card h3 {
            margin: 0 0 10px;
            font-size: 1.05rem;
            font-weight: 600;
            letter-spacing: -.03em;
            line-height: 1.35;
        }

        .report-meta {
            margin: 0 0 20px;
            color: var(--muted);
            font-size: .82rem;
        }

        .donut-wrap {
            display: grid;
            grid-template-columns: 160px minmax(0, 1fr);
            gap: 24px;
            align-items: center;
        }

        .donut-chart {
            width: 160px;
            height: 160px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            box-shadow: inset 0 0 0 1px rgba(81, 52, 63, .04), 0 18px 32px rgba(67, 43, 53, .08);
        }

        .donut-hole {
            width: 86px;
            height: 86px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: #fff;
            color: var(--primary);
            font-weight: 700;
            letter-spacing: -.03em;
        }

        .chart-legend {
            display: grid;
            gap: 12px;
        }

        .legend-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
            color: var(--muted);
            font-size: .88rem;
        }

        .legend-label {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }

        .legend-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex: 0 0 auto;
            background: var(--primary);
        }

        .legend-label span:last-child {
            overflow-wrap: anywhere;
        }

        .text-samples {
            display: grid;
            gap: 10px;
            margin: 0;
            padding: 0;
            list-style: none;
        }

        .text-samples li {
            padding: 12px 14px;
            border-radius: 14px;
            background: rgba(248,244,245,.78);
            color: var(--muted);
            line-height: 1.45;
        }

        .answer-bullets {
            list-style: none;
            display: grid;
            gap: 8px;
            margin: 0;
            padding: 0;
        }

        .answer-bullets li {
            display: grid;
            grid-template-columns: 10px minmax(0, 1fr);
            align-items: center;
            gap: 12px;
        }

        .answer-other {
            display: inline;
            white-space: normal;
        }

        .answer-bullets li::before {
            content: "";
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--primary);
            box-shadow: 0 0 0 3px rgba(207, 0, 116, .08);
            justify-self: center;
        }

        pre {
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            padding: 16px;
            border-radius: 18px;
            background: #20151b;
            color: #ffe8f2;
            font-size: .86rem;
            font-weight: 350;
        }

        @media (max-width: 980px) {
            .main-panel { width: calc(100% - 36px); padding: 24px 0; }
            .hero { margin-bottom: 28px; }
            .table-head { display: none; }
            .question-row { grid-template-columns: 1fr; gap: 12px; }
            .response-summary,
            .answer-row { grid-template-columns: 1fr; }
            .report-grid { grid-template-columns: 1fr; }
            .donut-wrap { grid-template-columns: 1fr; justify-items: center; }
            .chart-legend { width: 100%; }
            .section-heading { align-items: flex-start; flex-direction: column; }
            .top-nav { flex-direction: column; align-items: flex-start; margin-bottom: 32px; }
            .top-actions { width: 100%; justify-content: space-between; }
            .grid,
            .grid-4 { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <?php if (!$loggedIn): ?>
        <main class="login-page">
            <section class="login-card">
                <div class="brand-row">
                    <div class="brand-mark">P</div>
                    <div>
                        <h1>PinkBox Admin</h1>
                        <p class="brand-subtitle">Painel Administrativo</p>
                    </div>
                </div>
                <p class="muted">Acesse para editar o formulário e visualizar respostas.</p>

                <?php if ($error !== null): ?>
                    <div class="alert"><?= h($error); ?></div>
                <?php endif; ?>

                <form method="post" class="grid">
                    <input type="hidden" name="action" value="login">
                    <label>
                        Usuário
                        <input type="text" name="username" required autocomplete="username">
                    </label>
                    <label>
                        Senha
                        <input type="password" name="password" required autocomplete="current-password">
                    </label>
                    <button class="primary" type="submit">Entrar</button>
                </form>
                <p class="muted">Configure `admin.password_hash` em `config/supabase.local.php` para habilitar o login.</p>
            </section>
        </main>
    <?php else: ?>
        <main>
            <section class="main-panel">
                <header class="top-nav">
                    <div class="top-tabs">
                        <h2 class="product-name">PinkBox Admin</h2>
                        <a class="top-tab <?= $tab === 'form' ? 'is-active' : ''; ?>" href="?tab=form">Formulário</a>
                        <a class="top-tab <?= $tab === 'responses' ? 'is-active' : ''; ?>" href="?tab=responses">Respostas</a>
                        <a class="top-tab <?= $tab === 'report' ? 'is-active' : ''; ?>" href="?tab=report">Relatório</a>
                    </div>
                    <div class="top-actions">
                        <a class="public-link" href="../" target="_blank">Ver página de pesquisa</a>
                        <form method="post">
                            <input type="hidden" name="action" value="logout">
                            <button class="logout-button" type="submit">Sair</button>
                        </form>
                    </div>
                </header>

                <?php if ($error !== null): ?>
                    <div class="alert"><?= h($error); ?></div>
                <?php endif; ?>

                <section class="hero">
                    <div>
                        <p class="eyebrow"><?= $tab === 'responses' || $tab === 'report' ? 'Análise da pesquisa' : 'Editor da pesquisa'; ?></p>
                        <h1 class="hero-title"><?= h($surveyData['survey']['public_title'] ?? 'Pesquisa PinkBox'); ?></h1>
                        <p class="hero-copy"><?= h($surveyData['survey']['description'] ?? 'Administração da pesquisa pública e de suas respostas.'); ?></p>
                    </div>
                </section>

                <?php if ($tab === 'report'): ?>
                    <?php if ($responses === []): ?>
                        <section class="card response-card">
                            <p class="muted">Nenhuma resposta registrada ainda para gerar o relatório.</p>
                        </section>
                    <?php else: ?>
                        <?php foreach ($report as $sectionReport): ?>
                            <section class="section-heading">
                                <div>
                                    <h2><?= h($sectionReport['title']); ?></h2>
                                    <p>Resumo visual das respostas desta categoria.</p>
                                </div>
                            </section>

                            <section class="report-grid">
                                <?php foreach ($sectionReport['questions'] as $questionReport): ?>
                                    <article class="card report-card">
                                        <h3><?= h($questionReport['title']); ?></h3>
                                        <p class="report-meta"><?= h(type_label($questionReport['type'])); ?> · <?= h((string) $questionReport['total']); ?> resposta(s)</p>

                                        <?php if ($questionReport['counts'] !== []): ?>
                                            <?php $legendColors = ['#cf0074', '#ef69ad', '#f5a9ca', '#9e0058', '#51343f', '#d9a3b8', '#7a5262']; ?>
                                            <div class="donut-wrap">
                                                <div class="donut-chart" style="background: conic-gradient(<?= h(donut_gradient($questionReport['counts'], (int) $questionReport['total'])); ?>);">
                                                    <div class="donut-hole"><?= h((string) $questionReport['total']); ?></div>
                                                </div>
                                                <div class="chart-legend">
                                                <?php $legendIndex = 0; ?>
                                                <?php foreach ($questionReport['counts'] as $label => $count): ?>
                                                    <?php $percent = $questionReport['total'] > 0 ? round(($count / $questionReport['total']) * 100) : 0; ?>
                                                    <div class="legend-row">
                                                        <div class="legend-label">
                                                            <span class="legend-dot" style="background: <?= h($legendColors[$legendIndex % count($legendColors)]); ?>;"></span>
                                                            <span><?= h((string) $label); ?></span>
                                                        </div>
                                                        <strong><?= h((string) $count); ?> · <?= h((string) $percent); ?>%</strong>
                                                    </div>
                                                    <?php $legendIndex++; ?>
                                                <?php endforeach; ?>
                                                </div>
                                            </div>
                                        <?php elseif ($questionReport['texts'] !== []): ?>
                                            <ul class="text-samples">
                                                <?php foreach (array_slice($questionReport['texts'], 0, 6) as $text): ?>
                                                    <li><?= h($text); ?></li>
                                                <?php endforeach; ?>
                                            </ul>
                                        <?php else: ?>
                                            <p class="muted">Ainda não há respostas para esta pergunta.</p>
                                        <?php endif; ?>
                                    </article>
                                <?php endforeach; ?>
                            </section>
                        <?php endforeach; ?>
                    <?php endif; ?>
                <?php elseif ($tab === 'responses'): ?>
                    <?php if ($responses !== []): ?>
                        <section class="response-list">
                            <?php foreach ($responses as $response): ?>
                                <article class="response-item">
                                    <button class="response-summary" type="button" data-response-toggle>
                                        <span class="response-id">
                                            <span>ID do registro</span>
                                            <strong><?= h($response['id']); ?></strong>
                                        </span>
                                        <span class="response-date"><?= h(format_datetime_br((string) $response['created_at'])); ?></span>
                                        <span class="response-arrow" aria-hidden="true"></span>
                                    </button>

                                    <div class="response-details">
                                        <?php foreach (($surveyData['sections'] ?? []) as $section): ?>
                                            <section class="response-category">
                                                <h3 class="response-category-title"><?= h($section['section_title']); ?></h3>
                                                <div class="answer-list">
                                                    <?php foreach ($section['questions'] as $question): ?>
                                                        <?php
                                                            $key = $question['question_key'];
                                                            $answer = $response['responses'][$key] ?? null;
                                                        ?>
                                                        <?php if ($answer !== null && $answer !== ''): ?>
                                                            <div class="answer-row">
                                                                <div class="answer-question"><?= h($question['question_title']); ?></div>
                                                                <div class="answer-value"><?= render_answer($answer); ?></div>
                                                            </div>
                                                        <?php endif; ?>
                                                    <?php endforeach; ?>
                                                </div>
                                            </section>
                                        <?php endforeach; ?>
                                    </div>
                                </article>
                            <?php endforeach; ?>
                        </section>
                    <?php else: ?>
                        <section class="card response-card">
                            <p class="muted">Nenhuma resposta registrada ainda.</p>
                        </section>
                    <?php endif; ?>
                <?php else: ?>
                    <?php foreach (($surveyData['sections'] ?? []) as $section): ?>
                        <section class="section-heading">
                            <div>
                                <h2>Parte <?= h((string) $section['display_order']); ?>: <?= h($section['section_title']); ?></h2>
                                <p><?= h($section['section_description']); ?></p>
                            </div>
                            <button class="create-button" type="button" data-modal-open="modal-section-<?= h($section['id']); ?>">+ Adicionar pergunta</button>
                        </section>

                        <section class="card">
                            <div class="question-table">
                                <div class="table-head">
                                    <span>ID</span>
                                    <span>Pergunta</span>
                                    <span>Tipo</span>
                                    <span>Status</span>
                                    <span>Ações</span>
                                </div>

                        <?php foreach ($section['questions'] as $question): ?>
                                <div class="question-row">
                                    <span><?= h(str_pad((string) $question['display_order'], 2, '0', STR_PAD_LEFT)); ?></span>
                                    <div>
                                        <p class="question-title"><?= h($question['question_title']); ?></p>
                                        <p class="question-help"><?= h($question['help_text'] ?: 'Sem texto auxiliar.'); ?></p>
                                    </div>
                                    <span class="pill"><?= h(type_label($question['question_type'])); ?></span>
                                    <span class="status-dot <?= $question['is_active'] ? '' : 'is-off'; ?>" aria-label="<?= $question['is_active'] ? 'Ativa' : 'Inativa'; ?>"></span>
                                    <span class="inline-actions">
                                        <button class="small-button" type="button" data-accordion-target="edit-<?= h($question['id']); ?>">Editar</button>
                                    </span>
                                </div>

                            <article class="question-card accordion-panel" id="edit-<?= h($question['id']); ?>">
                                <form method="post">
                                    <input type="hidden" name="action" value="update_question">
                                    <input type="hidden" name="question_id" value="<?= h($question['id']); ?>">
                                    <div class="grid">
                                        <label>
                                            Pergunta
                                            <textarea name="question_title" required><?= h($question['question_title']); ?></textarea>
                                        </label>
                                        <label>
                                            Texto de ajuda
                                            <textarea name="help_text"><?= h($question['help_text']); ?></textarea>
                                        </label>
                                    </div>
                                    <div class="grid-4">
                                        <label>
                                            Tipo
                                            <select name="question_type">
                                                <?php foreach (['single_choice', 'multiple_choice', 'text', 'textarea', 'rating'] as $type): ?>
                                                    <option value="<?= h($type); ?>" <?= $question['question_type'] === $type ? 'selected' : ''; ?>><?= h(type_label($type)); ?></option>
                                                <?php endforeach; ?>
                                            </select>
                                        </label>
                                        <label>
                                            Placeholder
                                            <input type="text" name="placeholder_text" value="<?= h($question['placeholder_text']); ?>">
                                        </label>
                                        <label>
                                            Ordem
                                            <input type="number" name="display_order" value="<?= h((string) $question['display_order']); ?>" required>
                                        </label>
                                        <label>
                                            Mín/Máx seleção
                                            <span class="grid">
                                                <input type="number" name="min_selections" value="<?= h((string) ($question['min_selections'] ?? '')); ?>" placeholder="Min">
                                                <input type="number" name="max_selections" value="<?= h((string) ($question['max_selections'] ?? '')); ?>" placeholder="Max">
                                            </span>
                                        </label>
                                    </div>
                                    <div class="checks">
                                        <label><input type="checkbox" name="is_required" <?= $question['is_required'] ? 'checked' : ''; ?>> Obrigatória</label>
                                        <label><input type="checkbox" name="is_active" <?= $question['is_active'] ? 'checked' : ''; ?>> Ativa</label>
                                        <button class="primary" type="submit">Salvar pergunta</button>
                                    </div>
                                </form>

                                <?php foreach ($question['options'] as $option): ?>
                                    <form class="option-card" method="post">
                                        <input type="hidden" name="action" value="update_option">
                                        <input type="hidden" name="option_id" value="<?= h($option['id']); ?>">
                                        <div class="grid-4">
                                            <label>
                                                Rótulo
                                                <input type="text" name="option_label" value="<?= h($option['option_label']); ?>" required>
                                            </label>
                                            <label>
                                                Valor salvo
                                                <input type="text" name="option_value" value="<?= h($option['option_value']); ?>" required>
                                            </label>
                                            <label>
                                                Numérico
                                                <input type="number" step="0.01" name="numeric_value" value="<?= h((string) ($option['numeric_value'] ?? '')); ?>">
                                            </label>
                                            <label>
                                                Ordem
                                                <input type="number" name="display_order" value="<?= h((string) $option['display_order']); ?>" required>
                                            </label>
                                        </div>
                                        <div class="checks">
                                            <label><input type="checkbox" name="allows_free_text" <?= $option['allows_free_text'] ? 'checked' : ''; ?>> Exige "Qual?"</label>
                                            <label><input type="checkbox" name="is_active" <?= $option['is_active'] ? 'checked' : ''; ?>> Ativa</label>
                                            <button type="submit">Salvar opção</button>
                                        </div>
                                    </form>
                                <?php endforeach; ?>

                                <button class="small-button option-add-trigger" type="button" data-option-panel="option-create-<?= h($question['id']); ?>">+ Adicionar opção</button>

                                <form class="option-card option-create-panel" method="post" id="option-create-<?= h($question['id']); ?>">
                                    <input type="hidden" name="action" value="create_option">
                                    <input type="hidden" name="question_id" value="<?= h($question['id']); ?>">
                                    <strong>Adicionar opção</strong>
                                    <div class="grid-4">
                                        <label>Chave <input type="text" name="option_key" required placeholder="ex: new_option"></label>
                                        <label>Rótulo <input type="text" name="option_label" required></label>
                                        <label>Valor <input type="text" name="option_value" required></label>
                                        <label>Ordem <input type="number" name="display_order" required></label>
                                    </div>
                                    <div class="checks">
                                        <label><input type="checkbox" name="allows_free_text"> Exige "Qual?"</label>
                                        <label>Valor numérico <input type="number" step="0.01" name="numeric_value"></label>
                                        <button class="primary" type="submit">Salvar opção</button>
                                        <button type="button" data-option-cancel="option-create-<?= h($question['id']); ?>">Cancelar</button>
                                    </div>
                                </form>
                            </article>
                        <?php endforeach; ?>

                            </div>
                        </section>

                        <div class="modal-backdrop" id="modal-section-<?= h($section['id']); ?>" aria-hidden="true">
                            <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title-<?= h($section['id']); ?>">
                                <div class="modal-head">
                                    <div>
                                        <p class="eyebrow">Nova pergunta</p>
                                        <h3 id="modal-title-<?= h($section['id']); ?>">Adicionar pergunta em <?= h($section['section_title']); ?></h3>
                                    </div>
                                    <button class="small-button" type="button" data-modal-close="modal-section-<?= h($section['id']); ?>">Fechar</button>
                                </div>

                                <form class="modal-form" method="post">
                                    <input type="hidden" name="action" value="create_question">
                                    <input type="hidden" name="section_id" value="<?= h($section['id']); ?>">
                                    <div class="grid">
                                        <label>Chave <input type="text" name="question_key" required placeholder="ex: nova_pergunta"></label>
                                        <label>Tipo
                                            <select name="question_type">
                                                <option value="single_choice">Seleção única</option>
                                                <option value="multiple_choice">Múltipla escolha</option>
                                                <option value="text">Texto curto</option>
                                                <option value="textarea">Texto longo</option>
                                                <option value="rating">Classificação</option>
                                            </select>
                                        </label>
                                    </div>
                                    <label>Pergunta <textarea name="question_title" required></textarea></label>
                                    <label>Texto de ajuda <textarea name="help_text"></textarea></label>
                                    <div class="modal-settings">
                                        <label>Ordem <input type="number" name="display_order" required></label>
                                        <label class="checks"><input type="checkbox" name="is_required" checked> Obrigatória</label>
                                    </div>
                                    <div class="modal-footer-actions">
                                        <button class="primary" type="submit">Salvar pergunta</button>
                                        <button type="button" data-modal-close="modal-section-<?= h($section['id']); ?>">Cancelar</button>
                                    </div>
                                </form>
                            </section>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </section>
        </main>
    <?php endif; ?>
    <script>
        document.querySelectorAll('[data-accordion-target]').forEach((button) => {
            button.addEventListener('click', () => {
                const panel = document.getElementById(button.dataset.accordionTarget);

                if (!panel) {
                    return;
                }

                panel.classList.toggle('is-open');
                button.textContent = panel.classList.contains('is-open') ? 'Fechar' : 'Editar';
            });
        });

        document.querySelectorAll('[data-option-panel]').forEach((button) => {
            button.addEventListener('click', () => {
                const panel = document.getElementById(button.dataset.optionPanel);

                if (!panel) {
                    return;
                }

                panel.classList.add('is-open');
                button.hidden = true;
            });
        });

        document.querySelectorAll('[data-option-cancel]').forEach((button) => {
            button.addEventListener('click', () => {
                const panel = document.getElementById(button.dataset.optionCancel);

                if (!panel) {
                    return;
                }

                panel.reset();
                panel.classList.remove('is-open');
                document.querySelector(`[data-option-panel="${button.dataset.optionCancel}"]`)?.removeAttribute('hidden');
            });
        });

        document.querySelectorAll('[data-modal-open]').forEach((button) => {
            button.addEventListener('click', () => {
                document.getElementById(button.dataset.modalOpen)?.classList.add('is-open');
            });
        });

        document.querySelectorAll('[data-modal-close]').forEach((button) => {
            button.addEventListener('click', () => {
                document.getElementById(button.dataset.modalClose)?.classList.remove('is-open');
            });
        });

        document.querySelectorAll('.modal-backdrop').forEach((modal) => {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.classList.remove('is-open');
                }
            });
        });

        document.querySelectorAll('[data-response-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                button.closest('.response-item')?.classList.toggle('is-open');
            });
        });
    </script>
</body>
</html>
