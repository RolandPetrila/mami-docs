# Testeaza cheile Azure Doc Intel provided cu pattern-uri endpoint comune.
$ErrorActionPreference = "Continue"

function Get-EnvVar($n) {
    $v = [Environment]::GetEnvironmentVariable($n, "User")
    if (-not $v) { $v = [Environment]::GetEnvironmentVariable($n, "Process") }
    return $v
}

# Cheile sunt citite din env vars User (NU hardcodate — GitHub secret scanner blocheaza push)
$keys = @(
    @{ name = "AZURE_DOC_INTEL_KEY";   value = Get-EnvVar "AZURE_DOC_INTEL_KEY" },
    @{ name = "AZURE_DOC_INTEL_KEY_2"; value = Get-EnvVar "AZURE_DOC_INTEL_KEY_2" }
) | Where-Object { $_.value }

if ($keys.Count -eq 0) {
    Write-Host "[FATAL] Niciuna din env vars AZURE_DOC_INTEL_KEY / _2 nu e setata" -ForegroundColor Red
    exit 1
}

# Common resource name guesses
$candidates = @(
    "mami-docs", "mami-docs-ai", "mami-doc-intel", "mamidocs",
    "documentintelligence", "doc-intel", "document-intelligence",
    "petrilarolly", "roland-petrila", "rolandpetrila", "rpetrila",
    "mami", "mama-docs", "ocr", "docintel"
)

# API path pattern (api-version 2024-11-30)
$apiPath = "/documentintelligence/documentModels?api-version=2024-11-30"

foreach ($cand in $candidates) {
    $url = "https://$cand.cognitiveservices.azure.com$apiPath"
    foreach ($k in $keys) {
        try {
            $r = Invoke-RestMethod -Method GET -Uri $url `
                -Headers @{ "Ocp-Apim-Subscription-Key" = $k.value } `
                -TimeoutSec 6 -ErrorAction Stop
            Write-Host "[FOUND] resource=$cand key=$($k.name) models=$($r.value.Count)" -ForegroundColor Green
            Write-Host "        endpoint: https://$cand.cognitiveservices.azure.com" -ForegroundColor Green
            return
        } catch {
            $msg = $_.Exception.Message
            if ($msg -match "401") {
                Write-Host "[$cand] $($k.name): 401 (resource exists, key wrong?)" -ForegroundColor Yellow
            } elseif ($msg -match "403") {
                Write-Host "[$cand] $($k.name): 403 (resource exists, no permission)" -ForegroundColor Yellow
            } elseif ($msg -match "No such host") {
                # silent — resource doesn't exist
            } else {
                Write-Host "[$cand] $($k.name): $($msg.Substring(0, [Math]::Min(80, $msg.Length)))" -ForegroundColor DarkGray
            }
        }
    }
}

Write-Host "`n[NOT FOUND] Niciun resource name comun nu a raspuns. Endpoint-ul trebuie obtinut din Azure Portal." -ForegroundColor Red
Write-Host "Acceseaza: https://portal.azure.com/#@/resource/subscriptions/<SUB>/resourceGroups/<RG>/providers/Microsoft.CognitiveServices/accounts/<NAME>/keys"
