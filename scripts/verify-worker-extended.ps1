$ErrorActionPreference = "Continue"
$origin = "https://mami-docs.pages.dev"
$base = "https://mami-docs-ai.petrilarolly.workers.dev"

# 1. Health
Write-Host "--- /health ---" -ForegroundColor Cyan
$h = Invoke-RestMethod -Uri "$base/health" -TimeoutSec 10
$h | ConvertTo-Json -Depth 5

# 2. Chat (cu Origin header)
Write-Host "`n--- /chat ---" -ForegroundColor Cyan
$body = @{ messages = @(@{ role = "user"; content = "Reply OK" }) } | ConvertTo-Json
$sw = [Diagnostics.Stopwatch]::StartNew()
$r = Invoke-RestMethod -Method POST -Uri "$base/chat" `
    -Headers @{ "Content-Type" = "application/json"; Origin = $origin } `
    -Body $body -TimeoutSec 30
$sw.Stop()
Write-Host "Chat response: $($r.choices[0].message.content) ($($sw.ElapsedMilliseconds)ms)" -ForegroundColor Green

# 3. OCR-document - test with empty body (validate route exists + returns 400 cleanly)
Write-Host "`n--- /ocr-document (route registered?) ---" -ForegroundColor Cyan
try {
    $r2 = Invoke-WebRequest -Method POST -Uri "$base/ocr-document" `
        -Headers @{ "Content-Type" = "application/json"; Origin = $origin } `
        -Body "{}" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "Response: $($r2.StatusCode) $($r2.Content)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response) {
        $code = [int]$_.Exception.Response.StatusCode
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Status: $code | Body: $body" -ForegroundColor $(if ($code -eq 400) { 'Green' } else { 'Yellow' })
    } else {
        Write-Host "ERR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 4. OCR-document with small valid base64 PNG (1x1 pixel transparent PNG)
Write-Host "`n--- /ocr-document (real call) ---" -ForegroundColor Cyan
# 1x1 transparent PNG (valid format)
$pngB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
$body3 = @{ fileBase64 = $pngB64; model = "prebuilt-document" } | ConvertTo-Json
$sw3 = [Diagnostics.Stopwatch]::StartNew()
try {
    $r3 = Invoke-RestMethod -Method POST -Uri "$base/ocr-document" `
        -Headers @{ "Content-Type" = "application/json"; Origin = $origin } `
        -Body $body3 -TimeoutSec 60
    $sw3.Stop()
    Write-Host "OCR response: $($sw3.ElapsedMilliseconds)ms | content=`"$($r3.content)`" | polls=$($r3.polls)" -ForegroundColor Green
} catch {
    $sw3.Stop()
    if ($_.Exception.Response) {
        $code = [int]$_.Exception.Response.StatusCode
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "OCR status: $code ($($sw3.ElapsedMilliseconds)ms) | Body: $body" -ForegroundColor Yellow
    }
}
