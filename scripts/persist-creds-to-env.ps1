param(
    [Parameter(Mandatory)] [string] $AzKey1,
    [Parameter(Mandatory)] [string] $AzKey2,
    [Parameter(Mandatory)] [string] $AzEndpoint,
    [Parameter(Mandatory)] [string] $GhPat
)
$ErrorActionPreference = "Stop"

# Set Windows User env vars (no values displayed)
[Environment]::SetEnvironmentVariable('AZURE_DOC_INTEL_KEY',      $AzKey1,     'User')
[Environment]::SetEnvironmentVariable('AZURE_DOC_INTEL_KEY_2',    $AzKey2,     'User')
[Environment]::SetEnvironmentVariable('AZURE_DOC_INTEL_ENDPOINT', $AzEndpoint, 'User')
[Environment]::SetEnvironmentVariable('GITHUB_MODELS_TOKEN',      $GhPat,      'User')

# Process scope (so the next worker secret commands see them)
[Environment]::SetEnvironmentVariable('AZURE_DOC_INTEL_KEY',      $AzKey1,     'Process')
[Environment]::SetEnvironmentVariable('AZURE_DOC_INTEL_KEY_2',    $AzKey2,     'Process')
[Environment]::SetEnvironmentVariable('AZURE_DOC_INTEL_ENDPOINT', $AzEndpoint, 'Process')
[Environment]::SetEnvironmentVariable('GITHUB_MODELS_TOKEN',      $GhPat,      'Process')

Write-Host "[OK] AZURE_DOC_INTEL_KEY      set (len=$($AzKey1.Length))"
Write-Host "[OK] AZURE_DOC_INTEL_KEY_2    set (len=$($AzKey2.Length))"
Write-Host "[OK] AZURE_DOC_INTEL_ENDPOINT set (len=$($AzEndpoint.Length))"
Write-Host "[OK] GITHUB_MODELS_TOKEN      set (len=$($GhPat.Length))"

# Set worker secrets
Push-Location "C:\Proiecte\Mami_Docs\workers\ai-gateway"
$secrets = @(
    @{ name = "AZURE_DOC_INTEL_KEY";      value = $AzKey1 },
    @{ name = "AZURE_DOC_INTEL_ENDPOINT"; value = $AzEndpoint },
    @{ name = "GITHUB_MODELS_TOKEN";      value = $GhPat }
)
foreach ($s in $secrets) {
    $s.value | npx wrangler secret put $s.name 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK worker] $($s.name) uploaded" -ForegroundColor Green
    } else {
        Write-Host "[FAIL worker] $($s.name)" -ForegroundColor Red
    }
}
Pop-Location

# Update API keys catalog
$catalog = "C:\Users\ALIENWARE\.api-keys\catalog.md"
$content = Get-Content $catalog -Raw
if ($content -notmatch "AZURE_DOC_INTEL_ENDPOINT") {
    Write-Host "[NOTE] catalog.md needs AZURE_DOC_INTEL_ENDPOINT entry + GITHUB_MODELS_TOKEN entry" -ForegroundColor Yellow
}
