<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$tabela_solicitada = $_GET['tabela'] ?? 'customers';

$tabelas_permitidas = ['customers', 'sales', 'products', 'inventory', 'tasks_reminders', 'users_consultants', 'users_dir']; 

if (!in_array($tabela_solicitada, $tabelas_permitidas)) {
    http_response_code(400); 
    echo json_encode(["status" => "erro", "mensagem" => "Tabela não permitida."]);
    exit; 
}

$url_supabase = "https://chrtvdrvpurctybbftjk.supabase.co/rest/v1/" . $tabela_solicitada . "?select=*&limit=10";

$chave_anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocnR2ZHJ2cHVyY3R5YmJmdGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjE4NzgsImV4cCI6MjA5MDk5Nzg3OH0.3GaoQaOX2O1DJsIWNp4Crb1NTxQ7vaI7YIdHB3EaEaw";


$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url_supabase);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);


curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 


curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $chave_anon",
    "Authorization: Bearer $chave_anon",
    "Content-Type: application/json"
]);


$resultado = curl_exec($ch);
$codigo_http = curl_getinfo($ch, CURLINFO_HTTP_CODE); 
$erro_curl = curl_error($ch);
curl_close($ch);


if ($resultado === false || $codigo_http != 200) {
    http_response_code(500);
    echo json_encode([
        "status" => "erro", 
        "mensagem_php" => $erro_curl, 
        "codigo_supabase" => $codigo_http, 
        "detalhe_supabase" => json_decode($resultado) 
    ]);
} else {
    http_response_code(200);
    echo json_encode([
        "status" => "sucesso",
        "tabela_acessada" => $tabela_solicitada,
        "dados" => json_decode($resultado)
    ]);
}
?>
