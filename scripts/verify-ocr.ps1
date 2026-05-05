$ErrorActionPreference = "Continue"
$origin = "https://mami-docs.pages.dev"
$base = "https://mami-docs-ai.petrilarolly.workers.dev"

# Test 1: empty body validation (route registered)
Write-Host "--- Test 1: empty body (expect 400 'fileBase64 required') ---" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Method POST -Uri "$base/ocr-document" `
        -Headers @{ "Content-Type" = "application/json"; Origin = $origin } `
        -Body "{}" -SkipHttpErrorCheck -TimeoutSec 10
    Write-Host "Status: $($r.StatusCode) | Body: $($r.Content)"
} catch {
    Write-Host "ERR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: real PNG submission
Write-Host "`n--- Test 2: 1x1 transparent PNG (Azure Doc Intel may reject too small) ---" -ForegroundColor Cyan
$pngB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
$body = @{ fileBase64 = $pngB64; model = "prebuilt-document" } | ConvertTo-Json
$sw = [Diagnostics.Stopwatch]::StartNew()
$r = Invoke-WebRequest -Method POST -Uri "$base/ocr-document" `
    -Headers @{ "Content-Type" = "application/json"; Origin = $origin } `
    -Body $body -SkipHttpErrorCheck -TimeoutSec 60
$sw.Stop()
Write-Host "Status: $($r.StatusCode) ($($sw.ElapsedMilliseconds)ms)"
Write-Host "Body: $($r.Content)"
