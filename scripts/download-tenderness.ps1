# Descarca audio CC0 ambient din archive.org/freepd in public/audio/tenderness.mp3
# Sursa: archive.org/details/freepd (FreePD.com mirror, public domain CC0)
# Track: "Calm Sketch for Piano" (Kevin MacLeod / Public Domain) - 63s, ~2.4 MB

$ErrorActionPreference = "Stop"
$dest = Join-Path $PSScriptRoot "..\public\audio\tenderness.mp3"
$destDir = Split-Path $dest -Parent

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Write-Host "Created dir: $destDir"
}

$url = "https://archive.org/download/freepd/Page2%2FCalm%20Sketch%20for%20Piano.mp3"
Write-Host "Downloading from: $url"
Write-Host "Destination: $dest"

try {
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 60
    $size = (Get-Item $dest).Length
    Write-Host "[OK] Downloaded $([math]::Round($size / 1024, 0)) KB"

    # Verifica MP3 magic bytes (ID3 sau 0xFF FB)
    $bytes = [System.IO.File]::ReadAllBytes($dest)[0..3]
    $hex = ($bytes | ForEach-Object { $_.ToString('X2') }) -join ' '
    Write-Host "First 4 bytes: $hex"
    if ($bytes[0] -eq 0x49 -and $bytes[1] -eq 0x44 -and $bytes[2] -eq 0x33) {
        Write-Host "[OK] Valid ID3 header (MP3 with metadata)"
    } elseif ($bytes[0] -eq 0xFF -and ($bytes[1] -band 0xE0) -eq 0xE0) {
        Write-Host "[OK] Valid MPEG audio frame header"
    } else {
        Write-Host "[WARN] Magic bytes don't match MP3 — may be corrupted"
    }
} catch {
    Write-Host "[FAIL] $($_.Exception.Message)"
    exit 1
}
