# Test endpoint cognitive services cu numele "traduceriroland" + cheile noi (din parametri)
param(
    [Parameter(Mandatory)] [string] $Key1,
    [Parameter(Mandatory)] [string] $Key2
)
$ErrorActionPreference = "Continue"

$endpoints = @(
    "https://traduceriroland.cognitiveservices.azure.com",
    "https://traduceri-roland.cognitiveservices.azure.com",
    "https://traduceriroland-docintel.cognitiveservices.azure.com",
    "https://traduceriroland-di.cognitiveservices.azure.com"
)
$apiPath = "/documentintelligence/documentModels?api-version=2024-11-30"

foreach ($ep in $endpoints) {
    foreach ($k in @(@{n="key1";v=$Key1}, @{n="key2";v=$Key2})) {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $r = Invoke-RestMethod -Method GET -Uri "$ep$apiPath" `
                -Headers @{ "Ocp-Apim-Subscription-Key" = $k.v } `
                -TimeoutSec 10 -ErrorAction Stop
            $sw.Stop()
            Write-Host "[VALID] $ep | $($k.n) | $($sw.ElapsedMilliseconds)ms | models=$($r.value.Count)" -ForegroundColor Green
            return @{ endpoint = $ep; keyName = $k.n; models = $r.value.Count }
        } catch {
            $sw.Stop()
            $msg = $_.Exception.Message
            $code = if ($msg -match '\((\d+)\)') { $matches[1] } else { "?" }
            Write-Host "[$code] $ep | $($k.n) | $($sw.ElapsedMilliseconds)ms" -ForegroundColor DarkGray
        }
    }
}
Write-Host "`nNICIO COMBINATIE VALIDA" -ForegroundColor Red
