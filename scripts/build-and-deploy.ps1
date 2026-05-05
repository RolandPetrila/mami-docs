# Build local + deploy manual la Cloudflare Pages
# Foloseste env vars VITE_* derivate din SUPABASE_* (registry).
# Rulare: powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/build-and-deploy.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "=== Setting build-time env vars (process scope) ==="
$env:VITE_SUPABASE_URL      = [Environment]::GetEnvironmentVariable("SUPABASE_URL", "User")
$env:VITE_SUPABASE_ANON_KEY = [Environment]::GetEnvironmentVariable("SUPABASE_ANON_KEY", "User")
$env:VITE_NTFY_TOPIC        = "mami-docs-2026-roland"
$env:VITE_AI_GATEWAY_URL    = "https://mami-docs-ai.petrilarolly.workers.dev"

if (-not $env:VITE_SUPABASE_URL)      { Write-Host "ERROR: SUPABASE_URL lipseste din registry"; exit 1 }
if (-not $env:VITE_SUPABASE_ANON_KEY) { Write-Host "ERROR: SUPABASE_ANON_KEY lipseste din registry"; exit 1 }

Write-Host ("VITE_SUPABASE_URL: SET (length " + $env:VITE_SUPABASE_URL.Length + ")")
Write-Host ("VITE_SUPABASE_ANON_KEY: SET (length " + $env:VITE_SUPABASE_ANON_KEY.Length + ")")
Write-Host ("VITE_NTFY_TOPIC: " + $env:VITE_NTFY_TOPIC)
Write-Host ("VITE_AI_GATEWAY_URL: " + $env:VITE_AI_GATEWAY_URL)

Set-Location $root

Write-Host ""
Write-Host "=== npm run build ==="
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED (exit $LASTEXITCODE)"; exit $LASTEXITCODE }

Write-Host ""
Write-Host "=== Wrangler pages deploy ==="
npx --yes wrangler@3 pages deploy dist --project-name mami-docs --branch main --commit-dirty=true
$deployExit = $LASTEXITCODE
if ($deployExit -ne 0) { Write-Host "DEPLOY FAILED (exit $deployExit)"; exit $deployExit }

Write-Host ""
Write-Host "=== Done ==="
