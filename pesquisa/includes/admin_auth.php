<?php

declare(strict_types=1);

function admin_start_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function admin_is_logged_in(): bool
{
    admin_start_session();
    return !empty($_SESSION['pinkbox_admin']);
}

function admin_login(array $config, string $username, string $password): bool
{
    admin_start_session();

    $admin = $config['admin'] ?? [];
    $expectedUsername = (string) ($admin['username'] ?? 'admin');
    $passwordHash = (string) ($admin['password_hash'] ?? '');

    if ($passwordHash === '') {
        return false;
    }

    if (!hash_equals($expectedUsername, $username)) {
        return false;
    }

    if (!password_verify($password, $passwordHash)) {
        return false;
    }

    $_SESSION['pinkbox_admin'] = [
        'username' => $username,
        'logged_at' => time(),
    ];

    return true;
}

function admin_logout(): void
{
    admin_start_session();
    $_SESSION = [];
    session_destroy();
}
