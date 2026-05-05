param(
    [Parameter(Mandatory)] [string] $Key1,
    [Parameter(Mandatory)] [string] $Key2
)
$ErrorActionPreference = "Continue"

# Test multiple service types pe diverse nume de resursa
$resources = @(
    "traduceriroland",
    "traduceri-roland",
    "petrilarolly",
    "rolandpetrila"
)

# Tipuri servicii Cognitive Services + endpoint-uri
$tests = @(
    @{ name = "Document Intelligence"; path = "/documentintelligence/documentModels?api-version=2024-11-30" },
    @{ name = "Form Recognizer (legacy)"; path = "/formrecognizer/v3.0/info" },
    @{ name = "Computer Vision"; path = "/vision/v3.2/models" },
    @{ name = "OpenAI"; path = "/openai/deployments?api-version=2024-02-15-preview" }
)

# Translator (special endpoint)
foreach ($k in @(@{n="key1";v=$Key1}, @{n="key2";v=$Key2})) {
    try {
        $body = '[{"Text":"hello"}]'
        $r = Invoke-WebRequest -Method POST -Uri "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=ro" `
            -Headers @{ "Ocp-Apim-Subscription-Key" = $k.v; "Ocp-Apim-Subscription-Region" = "westeurope"; "Content-Type" = "application/json" } `
            -Body $body -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        Write-Host "[VALID] Translator (westeurope) | $($k.n) | HTTP $($r.StatusCode)" -ForegroundColor Green
    } catch {
        $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "?" }
        Write-Host "Translator (westeurope) | $($k.n) | $code" -ForegroundColor DarkGray
    }
}

# Pentru fiecare resource + service type, test
foreach ($res in $resources) {
    foreach ($t in $tests) {
        foreach ($k in @(@{n="key1";v=$Key1}, @{n="key2";v=$Key2})) {
            $url = "https://$res.cognitiveservices.azure.com$($t.path)"
            try {
                $r = Invoke-WebRequest -Method GET -Uri $url `
                    -Headers @{ "Ocp-Apim-Subscription-Key" = $k.v; "api-key" = $k.v } `
                    -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
                Write-Host "[VALID] $res / $($t.name) / $($k.n) -> HTTP $($r.StatusCode)" -ForegroundColor Green
                return
            } catch {
                if ($_.Exception.Response) {
                    $code = [int]$_.Exception.Response.StatusCode
                    if ($code -ne 401 -and $code -ne 404) {
                        Write-Host "[$code] $res / $($t.name) / $($k.n)" -ForegroundColor Yellow
                    }
                }
            }
        }
    }
}

# Verify storage account is alive (sanity)
Write-Host "`n--- Storage account sanity check ---" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "https://traduceriroland.blob.core.windows.net/?comp=list" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[OK] Storage account exists: HTTP $($r.StatusCode)"
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "?" }
    if ($code -eq 403) { Write-Host "[OK] Storage account exists (403 = needs auth)" } else { Write-Host "Storage: $code" }
}
