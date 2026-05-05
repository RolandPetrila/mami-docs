param(
    [Parameter(Mandatory)] [string] $AzKey,
    [Parameter(Mandatory)] [string] $AzEndpoint,
    [Parameter(Mandatory)] [string] $GhPat
)
$ErrorActionPreference = "Continue"

# Test 1: Azure Doc Intel
Write-Host "--- Azure Doc Intel ---" -ForegroundColor Cyan
$sw = [Diagnostics.Stopwatch]::StartNew()
try {
    $url = "$AzEndpoint/documentintelligence/documentModels?api-version=2024-11-30"
    $r = Invoke-RestMethod -Method GET -Uri $url -Headers @{ "Ocp-Apim-Subscription-Key" = $AzKey } -TimeoutSec 15
    $sw.Stop()
    Write-Host ("[VALID] {0}ms | models: {1}" -f $sw.ElapsedMilliseconds, $r.value.Count) -ForegroundColor Green
    $r.value | Select-Object -First 5 | ForEach-Object {
        Write-Host ("  - {0}" -f $_.modelId)
    }
} catch {
    Write-Host ("[FAIL] {0}" -f $_.Exception.Message) -ForegroundColor Red
}

# Test 2: GitHub Models PAT
Write-Host "`n--- GitHub Models ---" -ForegroundColor Cyan
$sw = [Diagnostics.Stopwatch]::StartNew()
try {
    $body = @{ model = "openai/gpt-4o-mini"; messages = @(@{ role = "user"; content = "Reply OK" }); max_tokens = 5 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://models.github.ai/inference/chat/completions" `
        -Headers @{ Authorization = "Bearer $GhPat"; "Content-Type" = "application/json" } `
        -Body $body -TimeoutSec 30
    $sw.Stop()
    Write-Host ("[VALID] {0}ms | response: {1}" -f $sw.ElapsedMilliseconds, $r.choices[0].message.content) -ForegroundColor Green
} catch {
    Write-Host ("[FAIL] {0}" -f $_.Exception.Message) -ForegroundColor Red
}
