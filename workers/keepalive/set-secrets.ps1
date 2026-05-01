$ErrorActionPreference = 'Stop'

$secrets = @('SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY')

foreach ($name in $secrets) {
    $value = [Environment]::GetEnvironmentVariable($name, 'User')
    if (-not $value) {
        Write-Host "[SKIP] $name not in User env vars" -ForegroundColor Yellow
        continue
    }
    Write-Host "[..] Setting secret $name (length $($value.Length))" -ForegroundColor Cyan
    $value | npx wrangler secret put $name 2>&1 | ForEach-Object { Write-Host "    $_" }
}

Write-Host ""
Write-Host "Done. Listing secrets:" -ForegroundColor Green
npx wrangler secret list 2>&1
