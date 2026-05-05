$ErrorActionPreference = "Continue"
try {
    $r = Invoke-WebRequest -Uri 'https://mami-docs.pages.dev/' -UseBasicParsing -TimeoutSec 15
    Write-Host "Site: $($r.StatusCode) | Length: $($r.RawContentLength) bytes"
} catch { Write-Host "Site FAIL: $($_.Exception.Message)" -ForegroundColor Red }

try {
    $r2 = Invoke-WebRequest -Uri 'https://mami-docs.pages.dev/audio/tenderness.mp3' -Method HEAD -UseBasicParsing -TimeoutSec 15
    $sz = $r2.Headers['Content-Length']
    Write-Host "tenderness.mp3: $($r2.StatusCode) | Size: $sz bytes ($([math]::Round([int]$sz / 1024, 0)) KB)"
} catch { Write-Host "Audio FAIL: $($_.Exception.Message)" -ForegroundColor Red }

try {
    $r3 = Invoke-WebRequest -Uri 'https://mami-docs.pages.dev/version.json' -UseBasicParsing -TimeoutSec 15
    Write-Host "version.json: $($r3.StatusCode) | Body: $($r3.Content)"
} catch { Write-Host "Version FAIL: $($_.Exception.Message)" -ForegroundColor Red }
