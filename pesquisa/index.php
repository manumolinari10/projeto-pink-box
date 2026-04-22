<?php

declare(strict_types=1);

const SURVEY_SLUG = 'mary-kay-management-survey';

$config = require __DIR__ . '/config/supabase.php';

function h(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function supabase_get(string $path): array
{
    global $config;

    if (($config['url'] ?? '') === '' || ($config['key'] ?? '') === '') {
        throw new RuntimeException('Configuração do Supabase incompleta.');
    }

    $url = rtrim($config['url'], '/') . '/rest/v1/' . ltrim($path, '/');
    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_HTTPGET => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $config['key'],
            'Authorization: Bearer ' . $config['key'],
            'Accept: application/json',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
    ]);

    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($body === false) {
        throw new RuntimeException('Erro de conexão com Supabase: ' . $error);
    }

    $decoded = json_decode($body, true);

    if ($status < 200 || $status >= 300) {
        $message = is_array($decoded) && isset($decoded['message']) ? $decoded['message'] : $body;
        throw new RuntimeException('Supabase retornou erro: ' . $message);
    }

    return is_array($decoded) ? $decoded : [];
}

function load_survey(): array
{
    $surveys = supabase_get(
        'surveys?slug=eq.' . rawurlencode(SURVEY_SLUG) . '&is_active=eq.true&select=id,public_title,description'
    );

    if ($surveys === []) {
        throw new RuntimeException('Pesquisa não encontrada ou inativa.');
    }

    $survey = $surveys[0];

    $sections = supabase_get(
        'survey_sections?survey_id=eq.' . rawurlencode($survey['id']) . '&is_active=eq.true&select=id,section_key,section_title,section_description,display_order&order=display_order.asc'
    );

    $sectionIds = array_column($sections, 'id');

    if ($sectionIds === []) {
        return ['survey' => $survey, 'sections' => []];
    }

    $questions = supabase_get(
        'questions?section_id=in.(' . implode(',', array_map('rawurlencode', $sectionIds)) . ')&is_active=eq.true&select=id,section_id,question_key,question_title,help_text,question_type,is_required,display_order,placeholder_text,min_selections,max_selections,min_value,max_value&order=display_order.asc'
    );

    $questionIds = array_column($questions, 'id');
    $options = [];

    if ($questionIds !== []) {
        $options = supabase_get(
            'question_options?question_id=in.(' . implode(',', array_map('rawurlencode', $questionIds)) . ')&is_active=eq.true&select=id,question_id,option_key,option_label,option_value,numeric_value,display_order,allows_free_text&order=display_order.asc'
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

    return ['survey' => $survey, 'sections' => $sections];
}

try {
    $surveyData = load_survey();
    $survey = $surveyData['survey'];
    $sections = $surveyData['sections'];
    $loadError = null;
} catch (Throwable $exception) {
    $survey = ['public_title' => 'Pesquisa PinkBox', 'description' => null];
    $sections = [];
    $loadError = $exception->getMessage();
}

$totalSections = count($sections);
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= h($survey['public_title'] ?? 'Pesquisa 2026'); ?></title>
    <style>
        :root {
            --text: #171517;
            --muted: #6f5860;
            --line: #f0dde4;
            --surface: rgba(255, 251, 252, 0.96);
            --primary: #d10072;
            --primary-dark: #a7005a;
            --soft-pink: #ffd8e4;
            --soft-pink-strong: #f6c7d8;
            --shadow: 0 18px 34px rgba(118, 57, 84, 0.08);
            --shadow-strong: 0 18px 34px rgba(209, 0, 114, 0.16);
            --content-width: 980px;
        }

        * {
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            margin: 0;
            min-height: 100vh;
            font-family: "Sora", "Segoe UI", sans-serif;
            color: var(--text);
            background:
                radial-gradient(circle at top left, rgba(255, 219, 229, 0.76), transparent 28%),
                radial-gradient(circle at bottom right, rgba(255, 228, 236, 0.84), transparent 32%),
                linear-gradient(180deg, #fffafb 0%, #fdf7f8 55%, #fbf1f4 100%);
        }

        button,
        input,
        textarea {
            font: inherit;
        }

        .page-shell {
            width: min(100%, var(--content-width));
            min-height: 100vh;
            margin: 0 auto;
            padding: 34px 34px 42px;
        }

        .screen {
            display: none;
        }

        .screen.is-active {
            display: block;
        }

        .topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }

        .brand {
            margin: 0;
            font-size: clamp(1.2rem, 1.55vw, 1.55rem);
            font-weight: 700;
            letter-spacing: -0.04em;
            line-height: 1;
        }

        .brand-primary {
            color: var(--primary);
        }

        .intro-topbar {
            margin-bottom: 64px;
        }

        .form-topbar {
            margin-bottom: 24px;
        }

        .step-counter {
            font-size: clamp(1rem, 1.2vw, 1.1rem);
            font-weight: 700;
            color: var(--primary);
            letter-spacing: -0.02em;
            white-space: nowrap;
        }

        .eyebrow-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: fit-content;
            padding: 10px 20px;
            border-radius: 999px;
            background: linear-gradient(180deg, var(--soft-pink) 0%, var(--soft-pink-strong) 100%);
            font-size: 0.84rem;
            font-weight: 600;
            letter-spacing: 0.13em;
            text-transform: uppercase;
            color: #34161f;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
        }

        .intro-hero,
        .thank-you-screen {
            display: grid;
            gap: 28px;
        }

        .thank-you-screen {
            align-content: center;
            min-height: calc(100vh - 76px);
            padding-block: 30px;
        }

        .hero-title {
            margin: 0;
            width: 100%;
            font-size: clamp(2.8rem, 5vw, 4.6rem);
            line-height: 1.01;
            letter-spacing: -0.08em;
            font-weight: 700;
        }

        .copy {
            display: grid;
            gap: 22px;
            width: 100%;
        }

        .lead,
        .support {
            margin: 0;
            width: 100%;
            color: var(--muted);
            letter-spacing: -0.04em;
        }

        .lead {
            font-size: clamp(1.1rem, 2.05vw, 1.45rem);
            line-height: 1.7;
        }

        .support {
            font-size: clamp(0.98rem, 1.7vw, 1.16rem);
            line-height: 1.72;
        }

        .thank-you-copy {
            max-width: 34ch;
        }

        .info-row {
            display: flex;
            gap: 14px;
            flex-wrap: wrap;
            margin-top: 10px;
        }

        .info-card {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 132px;
            padding: 13px 18px;
            border-radius: 18px;
            background: rgba(255, 247, 249, 0.82);
            box-shadow: var(--shadow);
            backdrop-filter: blur(18px);
        }

        .info-icon {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #b60067;
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
        }

        .info-label {
            margin: 0;
            font-size: 0.98rem;
            font-weight: 600;
            letter-spacing: -0.04em;
        }

        .action-panel {
            width: 100%;
            margin-top: 24px;
            padding-top: 12px;
        }

        .primary-button,
        .continue-button {
            border: 0;
            border-radius: 999px;
            background: linear-gradient(180deg, #df0079 0%, #c40069 100%);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            cursor: pointer;
            box-shadow: 0 16px 30px rgba(209, 0, 114, 0.28);
            transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }

        .primary-button {
            width: 100%;
            min-height: 76px;
            padding: 18px 28px;
            font-size: clamp(1rem, 1.8vw, 1.25rem);
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
        }

        .primary-button:hover,
        .continue-button:hover {
            transform: translateY(-2px);
            filter: saturate(1.05);
        }

        .primary-button svg,
        .back-button svg,
        .continue-button svg {
            width: 18px;
            height: 18px;
            flex: 0 0 auto;
        }

        .progress {
            width: 100%;
            height: 4px;
            margin-bottom: 42px;
            border-radius: 999px;
            background: var(--line);
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, var(--primary-dark) 0%, var(--primary) 100%);
        }

        .section-eyebrow {
            margin: 0 0 12px;
            color: var(--primary-dark);
            font-size: 0.72rem;
            font-weight: 600;
            letter-spacing: 0.18em;
            text-transform: uppercase;
        }

        .intro-block {
            margin-bottom: 42px;
        }

        .intro-block h2 {
            margin: 0 0 12px;
            font-size: clamp(2.4rem, 4vw, 4rem);
            line-height: 0.98;
            letter-spacing: -0.07em;
            font-weight: 700;
        }

        .accent {
            color: var(--primary);
        }

        .intro-block p {
            margin: 0;
            max-width: 62ch;
            color: var(--muted);
            font-size: clamp(1rem, 1.5vw, 1.18rem);
            line-height: 1.7;
            letter-spacing: -0.03em;
        }

        .survey-form {
            display: grid;
            gap: 34px;
        }

        .question {
            display: grid;
            gap: 18px;
        }

        .question-title {
            margin: 0;
            font-size: clamp(1.18rem, 1.7vw, 1.55rem);
            line-height: 1.35;
            letter-spacing: -0.04em;
            font-weight: 600;
        }

        .question-help {
            margin: -10px 0 0;
            color: var(--muted);
            font-size: 0.95rem;
            line-height: 1.55;
        }

        .options {
            display: grid;
            gap: 14px;
        }

        .option-card {
            position: relative;
            display: flex;
            align-items: center;
            gap: 16px;
            width: 100%;
            padding: 20px;
            border: 1px solid transparent;
            border-radius: 18px;
            background: var(--surface);
            box-shadow: var(--shadow);
            cursor: pointer;
            transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .option-card:hover {
            transform: translateY(-1px);
            border-color: rgba(209, 0, 114, 0.18);
        }

        .option-card input {
            position: absolute;
            opacity: 0;
            pointer-events: none;
        }

        .option-card input[type="checkbox"] + .radio-ui {
            border-radius: 6px;
        }

        .radio-ui {
            width: 18px;
            height: 18px;
            border: 1.7px solid #8a5f70;
            border-radius: 50%;
            flex: 0 0 auto;
            position: relative;
        }

        .radio-ui::after {
            content: "";
            position: absolute;
            inset: 3px;
            border-radius: inherit;
            background: var(--primary);
            transform: scale(0);
            transition: transform 0.18s ease;
        }

        .option-card:has(input:checked) {
            border-color: rgba(209, 0, 114, 0.36);
            background: rgba(255, 247, 250, 1);
            box-shadow: var(--shadow-strong);
        }

        .option-card:has(input:checked) .radio-ui::after {
            transform: scale(1);
        }

        .rating-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 14px;
        }

        .rating-card {
            position: relative;
            display: grid;
            justify-items: center;
            gap: 12px;
            padding: 18px 12px 16px;
            border: 1px solid transparent;
            border-radius: 18px;
            background: var(--surface);
            box-shadow: var(--shadow);
            cursor: pointer;
            transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .rating-card:hover {
            transform: translateY(-1px);
            border-color: rgba(209, 0, 114, 0.18);
        }

        .rating-card input {
            position: absolute;
            opacity: 0;
            pointer-events: none;
        }

        .rating-icon {
            width: 30px;
            height: 30px;
            color: #9a7684;
            transition: transform 0.2s ease, color 0.2s ease;
        }

        .rating-label {
            text-align: center;
            font-size: 0.82rem;
            line-height: 1.35;
            letter-spacing: -0.02em;
            color: var(--muted);
        }

        .rating-card:has(input:checked) {
            border-color: rgba(209, 0, 114, 0.36);
            background: rgba(255, 247, 250, 1);
            box-shadow: var(--shadow-strong);
        }

        .rating-card:has(input:checked) .rating-icon {
            color: var(--primary);
            transform: scale(1.06);
        }

        .option-content {
            display: grid;
            gap: 4px;
        }

        .option-title {
            margin: 0;
            font-size: 1rem;
            line-height: 1.35;
            letter-spacing: -0.03em;
            font-weight: 500;
        }

        .text-input,
        .text-area {
            width: 100%;
            border: 1px solid transparent;
            border-radius: 18px;
            background: var(--surface);
            box-shadow: var(--shadow);
            color: var(--text);
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .text-input {
            min-height: 58px;
            padding: 0 18px;
        }

        .text-area {
            min-height: 150px;
            padding: 18px;
            resize: vertical;
        }

        .text-input::placeholder,
        .text-area::placeholder {
            color: #b0a2a8;
        }

        .text-input:focus,
        .text-area:focus {
            outline: none;
            border-color: rgba(209, 0, 114, 0.28);
            box-shadow: 0 0 0 4px rgba(209, 0, 114, 0.08);
        }

        .conditional-field {
            display: none;
        }

        .conditional-field.is-visible {
            display: block;
        }

        .footer-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-top: 12px;
            padding-top: 8px;
            width: 100%;
        }

        .back-button {
            border: 1px solid rgba(209, 0, 114, 0.14);
            background: rgba(255, 251, 252, 0.92);
            color: #2a2025;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            justify-content: center;
            min-height: 58px;
            padding: 16px 24px;
            border-radius: 999px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            font-size: 0.72rem;
            font-weight: 600;
            box-shadow: 0 10px 24px rgba(118, 57, 84, 0.08);
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .back-button:hover {
            transform: translateY(-2px);
            border-color: rgba(209, 0, 114, 0.26);
            background: rgba(255, 246, 250, 1);
            box-shadow: 0 14px 28px rgba(118, 57, 84, 0.11);
        }

        .continue-button {
            padding: 18px 28px;
            min-width: 220px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-size: 0.82rem;
            font-weight: 700;
        }

        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }

        .fade-in {
            opacity: 0;
            transform: translateY(20px);
            animation: reveal 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        .fade-delay-1 { animation-delay: 0.06s; }
        .fade-delay-2 { animation-delay: 0.12s; }
        .fade-delay-3 { animation-delay: 0.18s; }
        .fade-delay-4 { animation-delay: 0.24s; }

        @keyframes reveal {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 780px) {
            .page-shell {
                padding: 24px 16px 30px;
            }

            .intro-topbar {
                margin-bottom: 54px;
            }

            .form-topbar {
                margin-bottom: 18px;
            }

            .brand {
                font-size: 1.05rem;
            }

            .step-counter {
                font-size: 0.96rem;
            }

            .progress {
                margin-bottom: 34px;
            }

            .intro-block {
                margin-bottom: 34px;
            }

            .rating-grid {
                gap: 10px;
            }

            .footer-actions {
                margin: 8px 0 0;
                padding: 8px 0 0;
                justify-content: center;
            }

            .back-button,
            .continue-button {
                min-width: 0;
                flex: 1 1 50%;
                width: calc(50% - 8px);
                padding-inline: 22px;
            }

            .primary-button {
                min-height: 78px;
                gap: 12px;
                letter-spacing: 0.12em;
            }
        }

        @media (max-width: 520px) {
            .hero-title {
                max-width: 11ch;
                font-size: clamp(2.1rem, 10vw, 3.1rem);
            }

            .intro-block h2 {
                font-size: 2.15rem;
            }

            .question-title {
                font-size: 1.05rem;
            }

            .option-card {
                padding: 18px 16px;
            }

            .footer-actions {
                gap: 12px;
            }

            .back-button {
                gap: 8px;
                font-size: 0.68rem;
                padding-inline: 16px;
            }

            .continue-button {
                font-size: 0.74rem;
                letter-spacing: 0.11em;
                padding-inline: 16px;
            }

            .rating-card {
                padding: 14px 8px 12px;
                gap: 10px;
            }

            .rating-icon {
                width: 24px;
                height: 24px;
            }

            .rating-label {
                font-size: 0.7rem;
            }
        }
    </style>
</head>
<body>
    <main class="page-shell">
        <section class="screen is-active" id="introScreen" aria-labelledby="introTitle">
            <header class="topbar intro-topbar fade-in">
                <h1 class="brand">PinkBox</h1>
            </header>

            <section class="intro-hero" aria-labelledby="introTitle">
                <div class="eyebrow-pill fade-in fade-delay-1">Pesquisa 2026</div>

                <h2 id="introTitle" class="hero-title fade-in fade-delay-2">
                    QUESTIONÁRIO PARA CONSULTORAS INDEPENDENTES MARY KAY
                </h2>

                <div class="copy">
                    <p class="lead fade-in fade-delay-3">
                        O presente questionário tem como objetivo coletar informações sobre a rotina de trabalho das consultoras independentes da Mary Kay, com foco na gestão de vendas, controle de clientes e estoque.
                    </p>
                    <p class="lead fade-in fade-delay-3">
                        Esta jornada levará menos de 5 minutos. As respostas fornecidas são de caráter confidencial e serão utilizadas exclusivamente para fins acadêmicos, no desenvolvimento do Projeto Integrador PinkBox.
                    </p>
                </div>

                <div class="info-row fade-in fade-delay-4" aria-label="Informações da pesquisa">
                    <div class="info-card">
                        <span class="info-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="2.1"/>
                            </svg>
                        </span>
                        <p class="info-label">5 min</p>
                    </div>

                    <div class="info-card">
                        <span class="info-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M8.5 11.8l2.2 2.2 4.8-4.8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 3.8l6.2 2.4v5.5c0 4.1-2.4 7.7-6.2 9-3.8-1.3-6.2-4.9-6.2-9V6.2L12 3.8z" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/>
                            </svg>
                        </span>
                        <p class="info-label">Anônimo</p>
                    </div>
                </div>

                <div class="action-panel fade-in fade-delay-4">
                    <button class="primary-button" type="button" id="startSurvey" <?= $loadError !== null || $totalSections === 0 ? 'disabled' : ''; ?>>
                        Iniciar Pesquisa
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <?php if ($loadError !== null): ?>
                        <p class="support"><?= h($loadError); ?></p>
                    <?php endif; ?>
                </div>
            </section>
        </section>

        <?php foreach ($sections as $index => $section): ?>
            <?php
                $step = $index + 1;
                $screenId = 'sectionScreen' . $step;
                $progress = $totalSections > 0 ? ($step / $totalSections) * 100 : 0;
            ?>
            <section class="screen survey-section-screen" id="<?= h($screenId); ?>" data-step="<?= h((string) $step); ?>" aria-labelledby="<?= h($screenId); ?>Title">
                <header class="topbar form-topbar fade-in">
                    <h2 class="brand brand-primary">PinkBox</h2>
                    <div class="step-counter"><?= str_pad((string) $step, 2, '0', STR_PAD_LEFT); ?> / <?= str_pad((string) $totalSections, 2, '0', STR_PAD_LEFT); ?></div>
                </header>

                <div class="progress fade-in fade-delay-1" aria-hidden="true">
                    <div class="progress-bar" style="width: <?= h((string) $progress); ?>%;"></div>
                </div>

                <section class="intro-block fade-in fade-delay-1">
                    <p class="section-eyebrow">Parte <?= h((string) $step); ?></p>
                    <h2 id="<?= h($screenId); ?>Title"><?= h($section['section_title'] ?? 'Etapa da pesquisa'); ?></h2>
                    <?php if (!empty($section['section_description'])): ?>
                        <p><?= h($section['section_description']); ?></p>
                    <?php endif; ?>
                </section>

                <form class="survey-form" data-step-form data-step="<?= h((string) $step); ?>">
                    <?php foreach ($section['questions'] as $question): ?>
                        <?php
                            $questionKey = $question['question_key'];
                            $questionType = $question['question_type'];
                            $isRequired = (bool) $question['is_required'];
                            $options = $question['options'] ?? [];
                        ?>
                        <section class="question fade-in fade-delay-2">
                            <h3 class="question-title"><?= h($question['question_title']); ?></h3>
                            <?php if (!empty($question['help_text'])): ?>
                                <p class="question-help"><?= h($question['help_text']); ?></p>
                            <?php endif; ?>

                            <?php if ($questionType === 'text'): ?>
                                <input class="text-input" type="text" name="<?= h($questionKey); ?>" placeholder="<?= h($question['placeholder_text'] ?? ''); ?>" <?= $isRequired ? 'required' : ''; ?>>
                            <?php elseif ($questionType === 'textarea'): ?>
                                <textarea class="text-area" name="<?= h($questionKey); ?>" rows="5" placeholder="<?= h($question['placeholder_text'] ?? ''); ?>" <?= $isRequired ? 'required' : ''; ?>></textarea>
                            <?php elseif ($questionType === 'rating'): ?>
                                <div class="rating-grid" role="radiogroup" aria-label="<?= h($question['question_title']); ?>">
                                    <?php foreach ($options as $optionIndex => $option): ?>
                                        <label class="rating-card">
                                            <input type="radio" name="<?= h($questionKey); ?>" value="<?= h($option['option_value']); ?>" <?= $isRequired && $optionIndex === 0 ? 'required' : ''; ?>>
                                            <svg class="rating-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
                                                <path d="M9 9h.01M15 9h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                                                <path d="M8 14.5c1.2 1.3 2.53 1.95 4 1.95s2.8-.65 4-1.95" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                                            </svg>
                                            <span class="rating-label"><?= h($option['option_label']); ?></span>
                                        </label>
                                    <?php endforeach; ?>
                                </div>
                            <?php else: ?>
                                <div
                                    class="options"
                                    role="<?= $questionType === 'multiple_choice' ? 'group' : 'radiogroup'; ?>"
                                    aria-label="<?= h($question['question_title']); ?>"
                                    data-question-key="<?= h($questionKey); ?>"
                                    data-min="<?= h((string) ($question['min_selections'] ?? '')); ?>"
                                    data-max="<?= h((string) ($question['max_selections'] ?? '')); ?>"
                                >
                                    <?php foreach ($options as $optionIndex => $option): ?>
                                        <?php $inputType = $questionType === 'multiple_choice' ? 'checkbox' : 'radio'; ?>
                                        <label class="option-card">
                                            <input
                                                type="<?= h($inputType); ?>"
                                                name="<?= h($questionKey); ?>"
                                                value="<?= h($option['option_value']); ?>"
                                                <?= $isRequired && $inputType === 'radio' && $optionIndex === 0 ? 'required' : ''; ?>
                                                <?= !empty($option['allows_free_text']) ? 'data-free-text-target="' . h($questionKey . '_other') . '"' : ''; ?>
                                            >
                                            <span class="radio-ui" aria-hidden="true"></span>
                                            <span class="option-content">
                                                <span class="option-title"><?= h($option['option_label']); ?></span>
                                            </span>
                                        </label>
                                        <?php if (!empty($option['allows_free_text'])): ?>
                                            <input class="text-input conditional-field" type="text" name="<?= h($questionKey); ?>_other" id="<?= h($questionKey); ?>_other" placeholder="Qual?">
                                        <?php endif; ?>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                        </section>
                    <?php endforeach; ?>

                    <div class="footer-actions fade-in fade-delay-4">
                        <button class="back-button" type="button" data-back-button>
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M15 6l-6 6 6 6M9 12h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Voltar
                        </button>

                        <button class="continue-button" type="submit">
                            <?= $step === $totalSections ? 'Finalizar pesquisa' : 'Salvar e continuar'; ?>
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    <span class="sr-only" aria-live="polite" data-form-status></span>
                </form>
            </section>
        <?php endforeach; ?>

        <section class="screen" id="thanksScreen" aria-labelledby="thanksTitle">
            <section class="thank-you-screen">
                <header class="topbar fade-in">
                    <h1 class="brand">PinkBox</h1>
                </header>

                <div class="eyebrow-pill fade-in fade-delay-1">Pesquisa concluída</div>

                <h2 id="thanksTitle" class="hero-title fade-in fade-delay-2">
                    Agradecemos a sua participação!
                </h2>

                <p class="lead thank-you-copy fade-in fade-delay-3">
                    As suas respostas são fundamentais para o desenvolvimento de uma solução que atenda às reais necessidades das consultoras independentes.
                </p>
            </section>
        </section>
    </main>

    <script>
        const introScreen = document.getElementById('introScreen');
        const thanksScreen = document.getElementById('thanksScreen');
        const startButton = document.getElementById('startSurvey');
        const sectionScreens = Array.from(document.querySelectorAll('.survey-section-screen'));
        const sectionForms = Array.from(document.querySelectorAll('[data-step-form]'));
        const surveyResponses = {};

        function showScreen(screen) {
            introScreen.classList.toggle('is-active', screen === 'intro');
            thanksScreen.classList.toggle('is-active', screen === 'thanks');

            sectionScreens.forEach((sectionScreen, index) => {
                sectionScreen.classList.toggle('is-active', screen === index);
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function formToObject(form) {
            const payload = {};

            for (const [key, value] of new FormData(form).entries()) {
                if (value === '') {
                    continue;
                }

                if (payload[key]) {
                    payload[key] = Array.isArray(payload[key]) ? [...payload[key], value] : [payload[key], value];
                } else {
                    payload[key] = value;
                }
            }

            return payload;
        }

        function mergeResponses(payload) {
            Object.assign(surveyResponses, payload);
        }

        function clearFormResponses(form) {
            const names = new Set();

            form.querySelectorAll('[name]').forEach((field) => {
                names.add(field.name);
            });

            names.forEach((name) => {
                delete surveyResponses[name];
            });
        }

        function validateMultiChoice(form) {
            const groups = form.querySelectorAll('.options[data-question-key]');

            for (const group of groups) {
                const key = group.dataset.questionKey;
                const checkboxes = group.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(key)}"]`);

                if (checkboxes.length === 0) {
                    continue;
                }

                const checked = group.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(key)}"]:checked`);
                const min = Number(group.dataset.min || 0);
                const max = Number(group.dataset.max || 0);

                if (min > 0 && checked.length < min) {
                    alert('Selecione pelo menos ' + min + ' opção(ões).');
                    return false;
                }

                if (max > 0 && checked.length > max) {
                    alert('Selecione no máximo ' + max + ' opção(ões).');
                    return false;
                }
            }

            return true;
        }

        async function submitSurvey(statusNode) {
            const response = await fetch('api/submit-survey.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    responses: surveyResponses
                })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Não foi possível salvar as respostas. Tente novamente.');
            }

            statusNode.textContent = 'Pesquisa concluída com sucesso.';
            return result;
        }

        startButton?.addEventListener('click', () => {
            showScreen(0);
        });

        document.querySelectorAll('[data-free-text-target]').forEach((input) => {
            const target = document.getElementById(input.dataset.freeTextTarget);

            if (!target) {
                return;
            }

            target.disabled = true;

            input.addEventListener('change', () => {
                target.classList.toggle('is-visible', input.checked);
                target.disabled = !input.checked;
                target.required = input.checked;

                if (!input.checked) {
                    target.value = '';
                }
            });
        });

        document.querySelectorAll('.options[data-max]').forEach((group) => {
            const max = Number(group.dataset.max || 0);

            if (max <= 0) {
                return;
            }

            group.querySelectorAll('input[type="checkbox"]').forEach((input) => {
                input.addEventListener('change', () => {
                    const checked = group.querySelectorAll('input[type="checkbox"]:checked');

                    if (checked.length > max) {
                        input.checked = false;
                        alert('Selecione no máximo ' + max + ' opção(ões).');
                    }
                });
            });
        });

        sectionForms.forEach((form, index) => {
            const statusNode = form.querySelector('[data-form-status]');
            const backButton = form.querySelector('[data-back-button]');

            backButton.addEventListener('click', () => {
                showScreen(index === 0 ? 'intro' : index - 1);
            });

            form.addEventListener('submit', async (event) => {
                event.preventDefault();

                if (!validateMultiChoice(form)) {
                    return;
                }

                clearFormResponses(form);
                mergeResponses(formToObject(form));

                if (index < sectionForms.length - 1) {
                    statusNode.textContent = 'Etapa preenchida. Preparando a próxima página da pesquisa.';
                    showScreen(index + 1);
                    return;
                }

                statusNode.textContent = 'Salvando respostas da pesquisa.';

                try {
                    await submitSurvey(statusNode);
                    showScreen('thanks');
                } catch (error) {
                    statusNode.textContent = error.message;
                    alert(error.message);
                }
            });
        });
    </script>
</body>
</html>
