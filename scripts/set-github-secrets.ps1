# Sets 4 GitHub secrets in RolandPetrila/mami-docs from Windows env vars.
# NU afiseaza valori. Foloseste stdin pipe la gh secret set.

$ErrorActionPreference = "Stop"
$repo = "RolandPetrila/mami-docs"

$secrets = @(
    @{ name = "CLOUDFLARE_API_TOKEN";  envVar = "CLOUDFLARE_API_TOKEN" },
    @{ name = "CLOUDFLARE_ACCOUNT_ID"; envVar = "CLOUDFLARE_ACCOUNT_ID" },
    @{ name = "VITE_SUPABASE_URL";     envVar = "SUPABASE_URL" },
    @{ name = "VITE_SUPABASE_ANON_KEY"; envVar = "SUPABASE_ANON_KEY" }
)

foreach ($s in $secrets) {
    $val = [Environment]::GetEnvironmentVariable($s.envVar, "User")
    if (-not $val) { $val = [Environment]::GetEnvironmentVariable($s.envVar, "Process") }
    if (-not $val) {
        Write-Host "[SKIP] $($s.name) — env var $($s.envVar) MISSING"
        continue
    }
    $val | gh secret set $s.name --repo $repo
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] $($s.name) set (len=$($val.Length))"
    } else {
        Write-Host "[FAIL] $($s.name) — gh exit code $LASTEXITCODE"
    }
}

Write-Host "`n=== Current secrets ==="
gh secret list --repo $repo
