$ErrorActionPreference = 'Stop'

$mappings = @(
    @{ EnvVar = 'SUPABASE_URL'; PagesVar = 'VITE_SUPABASE_URL' },
    @{ EnvVar = 'SUPABASE_ANON_KEY'; PagesVar = 'VITE_SUPABASE_ANON_KEY' }
)

foreach ($m in $mappings) {
    $value = [Environment]::GetEnvironmentVariable($m.EnvVar, 'User')
    if (-not $value) {
        Write-Host "[SKIP] $($m.EnvVar) not in User env vars" -ForegroundColor Yellow
        continue
    }
    Write-Host "[..] Setting Pages secret $($m.PagesVar) (length $($value.Length))" -ForegroundColor Cyan
    $value | npx wrangler pages secret put $m.PagesVar --project-name=mami-docs 2>&1 | ForEach-Object { Write-Host "    $_" }
}

Write-Host ""
Write-Host "Done. Listing Pages secrets:" -ForegroundColor Green
npx wrangler pages secret list --project-name=mami-docs 2>&1
