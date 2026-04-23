<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$config = require __DIR__ . '/../config/supabase.php';

const SURVEY_SLUG = 'mary-kay-management-survey';

function json_response(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function supabase_request(string $method, string $path, ?array $body = null): array
{
    global $config;

    $url = rtrim($config['url'], '/') . '/rest/v1/' . ltrim($path, '/');
    $headers = [
        'apikey: ' . $config['key'],
        'Authorization: Bearer ' . $config['key'],
        'Content-Type: application/json',
        'Accept: application/json',
        'Prefer: return=representation',
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
    ]);

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
    }

    $responseBody = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($responseBody === false) {
        throw new RuntimeException('Erro de conexão com Supabase: ' . $error);
    }

    $decoded = json_decode($responseBody, true);

    if ($status < 200 || $status >= 300) {
        $message = is_array($decoded) && isset($decoded['message']) ? $decoded['message'] : $responseBody;
        throw new RuntimeException('Supabase retornou erro: ' . $message);
    }

    return is_array($decoded) ? $decoded : [];
}

function normalize_values(mixed $value): array
{
    if ($value === null || $value === '') {
        return [];
    }

    return is_array($value) ? array_values($value) : [$value];
}

function load_survey_definition(string $surveyId): array
{
    $sectionRows = supabase_request(
        'GET',
        'survey_sections?survey_id=eq.' . rawurlencode($surveyId) . '&is_active=eq.true&select=id,section_key,display_order'
    );
    $sectionIds = array_column($sectionRows, 'id');

    if ($sectionIds === []) {
        return [];
    }

    $questionRows = supabase_request(
        'GET',
        'questions?section_id=in.(' . implode(',', array_map('rawurlencode', $sectionIds)) . ')&is_active=eq.true&select=id,question_key,question_type,is_required,min_selections,max_selections'
    );
    $questionIds = array_column($questionRows, 'id');
    $optionRows = [];

    if ($questionIds !== []) {
        $optionRows = supabase_request(
            'GET',
            'question_options?question_id=in.(' . implode(',', array_map('rawurlencode', $questionIds)) . ')&is_active=eq.true&select=question_id,option_value,allows_free_text'
        );
    }

    $optionsByQuestion = [];

    foreach ($optionRows as $option) {
        $optionsByQuestion[$option['question_id']][$option['option_value']] = $option;
    }

    $questions = [];

    foreach ($questionRows as $question) {
        $question['options'] = $optionsByQuestion[$question['id']] ?? [];
        $questions[$question['question_key']] = $question;
    }

    return $questions;
}

function build_response_payload(array $responses, array $questions): array
{
    $payload = [];

    foreach ($questions as $questionKey => $question) {
        $type = $question['question_type'];
        $isRequired = (bool) $question['is_required'];
        $values = normalize_values($responses[$questionKey] ?? null);

        if ($isRequired && $values === []) {
            json_response(422, [
                'success' => false,
                'message' => 'Existem perguntas obrigatórias sem resposta.',
            ]);
        }

        if ($values === []) {
            continue;
        }

        if ($type === 'multiple_choice') {
            $min = (int) ($question['min_selections'] ?? 0);
            $max = (int) ($question['max_selections'] ?? 0);

            if ($min > 0 && count($values) < $min) {
                json_response(422, [
                    'success' => false,
                    'message' => 'Selecione pelo menos ' . $min . ' opção(ões).',
                ]);
            }

            if ($max > 0 && count($values) > $max) {
                json_response(422, [
                    'success' => false,
                    'message' => 'Selecione no máximo ' . $max . ' opção(ões).',
                ]);
            }

            $answer = [
                'selected' => $values,
            ];

            foreach ($values as $value) {
                $option = $question['options'][$value] ?? null;

                if (!empty($option['allows_free_text'])) {
                    $freeText = trim((string) ($responses[$questionKey . '_other'] ?? ''));

                    if ($freeText === '') {
                        json_response(422, [
                            'success' => false,
                            'message' => 'Informe o campo "Qual?" para a opção Outra.',
                        ]);
                    }

                    $answer['other'] = $freeText;
                }
            }

            $payload[$questionKey] = $answer;
            continue;
        }

        $payload[$questionKey] = $values[0];
    }

    return $payload;
}

try {
    if (($config['url'] ?? '') === '' || ($config['key'] ?? '') === '') {
        json_response(500, [
            'success' => false,
            'message' => 'Configuração do Supabase incompleta.',
        ]);
    }

    $input = json_decode((string) file_get_contents('php://input'), true);
    $responses = $input['responses'] ?? null;

    if (!is_array($responses)) {
        json_response(400, [
            'success' => false,
            'message' => 'Respostas inválidas.',
        ]);
    }

    $surveyRows = supabase_request(
        'GET',
        'surveys?slug=eq.' . rawurlencode(SURVEY_SLUG) . '&is_active=eq.true&select=id,slug'
    );

    if ($surveyRows === []) {
        json_response(404, [
            'success' => false,
            'message' => 'Pesquisa não encontrada no Supabase.',
        ]);
    }

    $survey = $surveyRows[0];
    $questions = load_survey_definition($survey['id']);
    $payload = build_response_payload($responses, $questions);

    $insertedRows = supabase_request('POST', 'survey_responses', [[
        'survey_id' => $survey['id'],
        'survey_slug' => $survey['slug'],
        'responses' => $payload,
        'metadata' => [
            'source' => 'pinkbox-web-survey',
            'schema' => 'single-row-jsonb',
        ],
    ]]);

    json_response(200, [
        'success' => true,
        'response_id' => $insertedRows[0]['id'] ?? null,
    ]);
} catch (Throwable $exception) {
    json_response(500, [
        'success' => false,
        'message' => $exception->getMessage(),
    ]);
}
