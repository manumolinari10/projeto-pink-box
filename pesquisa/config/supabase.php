<?php

declare(strict_types=1);

/**
 * Supabase configuration.
 *
 * Set these variables in Apache/WAMP, Windows environment variables,
 * or a local bootstrap file that is not committed to version control.
 */
function env_value(string $key, ?string $default = null): ?string
{
    $value = getenv($key);

    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
}

$config = [
    'url' => rtrim((string) env_value('SUPABASE_URL', ''), '/'),
    'key' => (string) env_value('SUPABASE_SERVICE_ROLE_KEY', ''),
    'schema' => env_value('SUPABASE_SCHEMA', 'public'),
    'table' => env_value('SUPABASE_RESPONSES_TABLE', 'survey_responses'),
    'admin' => [
        'username' => env_value('ADMIN_USERNAME', 'admin'),
        'password_hash' => env_value('ADMIN_PASSWORD_HASH', ''),
    ],
];

$localConfigPath = __DIR__ . '/supabase.local.php';

if (is_file($localConfigPath)) {
    $localConfig = require $localConfigPath;
    $config = array_replace_recursive($config, $localConfig);
}

return $config;
