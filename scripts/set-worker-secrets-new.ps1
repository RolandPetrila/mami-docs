# Seteaza SAMBANOVA_API_KEY si XAI_API_KEY in worker mami-docs-ai prin pipe stdin
$ErrorActionPreference = "Stop"
Push-Location "C:\Proiecte\Mami_Docs\workers\ai-gateway"

$secrets = @(
    @{ name = "SAMBANOVA_API_KEY"; envVar = "SAMBANOVA_API_KEY" },
    @{ name = "XAI_API_KEY";       envVar = "XAI_API_KEY" }
)

foreach ($s in $secrets) {
    $val = [Environment]::GetEnvironmentVariable($s.envVar, "User")
    if (-not $val) { $val = [Environment]::GetEnvironmentVariable($s.envVar, "Process") }
    if (-not $val) {
        Write-Host "[SKIP] $($s.name) — env var $($s.envVar) MISSING" -ForegroundColor Yellow
        continue
    }
    $val | npx wrangler secret put $s.name
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] $($s.name) set (len=$($val.Length))" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $($s.name) — wrangler exit code $LASTEXITCODE" -ForegroundColor Red
    }
}

Pop-Location
