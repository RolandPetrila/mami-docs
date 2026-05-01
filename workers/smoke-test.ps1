$ErrorActionPreference = 'Continue'

$url = [Environment]::GetEnvironmentVariable('SUPABASE_URL', 'User')
$anonKey = [Environment]::GetEnvironmentVariable('SUPABASE_ANON_KEY', 'User')
$headers = @{ apikey = $anonKey; Authorization = "Bearer $anonKey" }

Write-Host "=== Test 1: ping() RPC ===" -ForegroundColor Cyan
try {
    $resp = Invoke-WebRequest -Uri "$url/rest/v1/rpc/ping" -Method POST -Headers $headers -ContentType "application/json" -Body "{}" -UseBasicParsing -TimeoutSec 10
    Write-Host "[OK] Status: $($resp.StatusCode), Body: $($resp.Content)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "[ERR] HTTP $statusCode" -ForegroundColor Red
    Write-Host "      Body: $body" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test 2: Tabele wellness (GET cu select=*) ===" -ForegroundColor Cyan
foreach ($table in @('hydration', 'vitals', 'emotion', 'sleep', 'photos_meta')) {
    try {
        $resp = Invoke-WebRequest -Uri "$url/rest/v1/$table?select=*&limit=1" -Headers $headers -UseBasicParsing -TimeoutSec 5
        Write-Host "[OK] ${table}: HTTP $($resp.StatusCode), Body: $($resp.Content)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "[ERR] ${table}: HTTP $statusCode - $body" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test 3: INSERT test (hydration) ===" -ForegroundColor Cyan
$testId = "smoke_$(Get-Date -Format 'yyyyMMddHHmmss')"
$body = @{ id = $testId; amount_ml = 250 } | ConvertTo-Json -Compress
try {
    $insertHeaders = $headers.Clone()
    $insertHeaders['Prefer'] = 'return=representation'
    $resp = Invoke-WebRequest -Uri "$url/rest/v1/hydration" -Method POST -Headers $insertHeaders -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] INSERT Status: $($resp.StatusCode), Body: $($resp.Content)" -ForegroundColor Green

    Write-Host "  Cleanup test row..." -ForegroundColor Gray
    Invoke-WebRequest -Uri "$url/rest/v1/hydration?id=eq.$testId" -Method DELETE -Headers $headers -UseBasicParsing -TimeoutSec 5 | Out-Null
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "[ERR] HTTP $statusCode - $body" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test 4: AI Gateway /chat (Origin Pages) ===" -ForegroundColor Cyan
try {
    $chatHeaders = @{ 'Content-Type' = 'application/json'; 'Origin' = 'https://mami-docs.pages.dev' }
    $chatBody = '{"messages":[{"role":"user","content":"OK?"}],"systemPrompt":"Raspunde doar OK."}'
    $resp = Invoke-WebRequest -Uri "https://mami-docs-ai.petrilarolly.workers.dev/chat" -Method POST -Headers $chatHeaders -Body $chatBody -UseBasicParsing -TimeoutSec 15
    $json = $resp.Content | ConvertFrom-Json
    Write-Host "[OK] Reply: $($json.choices[0].message.content)" -ForegroundColor Green
} catch {
    Write-Host "[ERR] $($_.Exception.Message)" -ForegroundColor Red
}
