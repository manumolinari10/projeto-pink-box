<?php

declare(strict_types=1);

function supabase_request(array $config, string $method, string $path, ?array $body = null, string $prefer = 'return=representation'): array
{
    $url = rtrim((string) $config['url'], '/') . '/rest/v1/' . ltrim($path, '/');
    $headers = [
        'apikey: ' . $config['key'],
        'Authorization: Bearer ' . $config['key'],
        'Content-Type: application/json',
        'Accept: application/json',
    ];

    if ($prefer !== '') {
        $headers[] = 'Prefer: ' . $prefer;
    }

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

function supabase_filter_in(array $ids): string
{
    return 'in.(' . implode(',', array_map('rawurlencode', $ids)) . ')';
}
