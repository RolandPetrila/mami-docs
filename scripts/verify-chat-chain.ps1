# Test live al chain-ului chat pe worker-ul deployat
$ErrorActionPreference = "Continue"
$origin = "https://mami-docs.pages.dev"
$url = "https://mami-docs-ai.petrilarolly.workers.dev/chat"
$body = @{ messages = @(@{ role = "user"; content = "Salut! Raspunde cu 1 cuvant: OK" }) } | ConvertTo-Json

$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $r = Invoke-RestMethod -Method POST -Uri $url `
        -Headers @{ "Content-Type" = "application/json"; Origin = $origin } `
        -Body $body -TimeoutSec 30
    $sw.Stop()
    Write-Host "[OK] $($sw.ElapsedMilliseconds)ms" -ForegroundColor Green
    Write-Host "Response: $($r.choices[0].message.content)"
} catch {
    $sw.Stop()
    Write-Host "[FAIL] $($sw.ElapsedMilliseconds)ms: $($_.Exception.Message)" -ForegroundColor Red
}

# Health check
try {
    $h = Invoke-RestMethod -Uri "https://mami-docs-ai.petrilarolly.workers.dev/health" -TimeoutSec 10
    Write-Host "Health: $($h | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "Health FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
