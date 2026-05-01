$ErrorActionPreference = 'Continue'

$url = [Environment]::GetEnvironmentVariable('SUPABASE_URL', 'User')
$anonKey = [Environment]::GetEnvironmentVariable('SUPABASE_ANON_KEY', 'User')

Write-Host "=== Test 1: Supabase REST root reachable ===" -ForegroundColor Cyan
$headers = @{ apikey = $anonKey; Authorization = "Bearer $anonKey" }
try {
    $resp = Invoke-WebRequest -Uri "$url/rest/v1/" -Headers $headers -UseBasicParsing -TimeoutSec 10
    Write-Host "[OK] Status: $($resp.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[ERR] $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test 2: ping() RPC (verificat ca exista in SQL schema) ===" -ForegroundColor Cyan
try {
    $resp = Invoke-WebRequest -Uri "$url/rest/v1/rpc/ping" -Method POST -Headers $headers -ContentType "application/json" -Body "{}" -UseBasicParsing -TimeoutSec 10
    Write-Host "[OK] Status: $($resp.StatusCode), Body: $($resp.Content)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "[INFO] Status: $statusCode (asteptat 404 daca SQL schema nu e inca rulat)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Test 3: tabelele wellness ===" -ForegroundColor Cyan
foreach ($table in @('hydration', 'vitals', 'emotion', 'sleep', 'photos_meta')) {
    try {
        $resp = Invoke-WebRequest -Uri "$url/rest/v1/$table?select=count" -Headers $headers -UseBasicParsing -TimeoutSec 5 -Method HEAD
        Write-Host "[OK] ${table}: HTTP $($resp.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "[INFO] ${table}: HTTP $statusCode (404=tabel inexistent, 200=OK)" -ForegroundColor Yellow
    }
}
