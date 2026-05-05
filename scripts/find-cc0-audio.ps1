# Cauta in archive.org/freepd un track scurt (60-180s) cu nume relevant pentru tenderness/calm
$ErrorActionPreference = "Stop"

Write-Host "Fetching archive.org metadata for freepd..."
$meta = Invoke-RestMethod -Uri 'https://archive.org/metadata/freepd' -TimeoutSec 30

$pattern = '(?i)tender|calm|peace|lull|relax|ambient|gentle|soft|sleep|moon|dream|warm|hope|love|heart'

$candidates = $meta.files | Where-Object {
    $_.name -like '*.mp3' -and
    $_.name -match $pattern -and
    [double]$_.length -ge 60 -and
    [double]$_.length -le 180
} | Select-Object -First 20 name, length, size

Write-Host "`nCandidate tracks (60-180s):"
$candidates | ForEach-Object {
    $sec = [math]::Round([double]$_.length, 1)
    $kb = [math]::Round([long]$_.size / 1024, 0)
    Write-Host "  [$sec s, $kb KB] $($_.name)"
}

# Pick first candidate
if ($candidates.Count -eq 0) {
    Write-Host "No matches in 60-180s range. Widening to 60-240s..."
    $candidates = $meta.files | Where-Object {
        $_.name -like '*.mp3' -and
        $_.name -match $pattern -and
        [double]$_.length -ge 60 -and
        [double]$_.length -le 240
    } | Select-Object -First 10 name, length, size
}

if ($candidates.Count -gt 0) {
    $pick = $candidates[0]
    $url = "https://archive.org/download/freepd/$([uri]::EscapeDataString($pick.name))"
    Write-Host "`nPicked: $($pick.name)"
    Write-Host "URL: $url"
    Write-Host "Size: $([math]::Round([long]$pick.size / 1024, 0)) KB"
    return $url
}
