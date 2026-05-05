# Setup Cloudflare Pages environment variables pentru proiectul mami-docs
# Citeste valori din Windows env vars (~/.api-keys/), seteaza in CF via API REST.
# Rulare: powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/setup-cf-pages-env.ps1
# NU contine valori hardcoded - doar referinte la env vars Windows.

$ErrorActionPreference = 'Stop'

$accountId   = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID", "User")
$token       = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")
$projectName = "mami-docs"

if (-not $accountId) { Write-Host "ERROR: CLOUDFLARE_ACCOUNT_ID lipseste"; exit 1 }
if (-not $token)     { Write-Host "ERROR: CLOUDFLARE_API_TOKEN lipseste"; exit 1 }

$supabaseUrl     = [Environment]::GetEnvironmentVariable("SUPABASE_URL", "User")
$supabaseAnonKey = [Environment]::GetEnvironmentVariable("SUPABASE_ANON_KEY", "User")

if (-not $supabaseUrl)     { Write-Host "ERROR: SUPABASE_URL lipseste"; exit 1 }
if (-not $supabaseAnonKey) { Write-Host "ERROR: SUPABASE_ANON_KEY lipseste"; exit 1 }

$ntfyTopic       = "mami-docs-2026-roland"
$aiGatewayUrl    = "https://mami-docs-ai.petrilarolly.workers.dev"

$envVars = @{
    VITE_SUPABASE_URL      = @{ value = $supabaseUrl;     type = "plain_text" }
    VITE_SUPABASE_ANON_KEY = @{ value = $supabaseAnonKey; type = "plain_text" }
    VITE_NTFY_TOPIC        = @{ value = $ntfyTopic;       type = "plain_text" }
    VITE_AI_GATEWAY_URL    = @{ value = $aiGatewayUrl;    type = "plain_text" }
}

$body = @{
    deployment_configs = @{
        production = @{ env_vars = $envVars }
        preview    = @{ env_vars = $envVars }
    }
} | ConvertTo-Json -Depth 10 -Compress

$headers = @{
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
}

$uri = "https://api.cloudflare.com/client/v4/accounts/$accountId/pages/projects/$projectName"

Write-Host "Setare env vars CF Pages pentru proiect '$projectName'..."
Write-Host "Variabile: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_NTFY_TOPIC, VITE_AI_GATEWAY_URL"
Write-Host "Environments: production + preview"

try {
    $response = Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -Body $body
    if ($response.success) {
        Write-Host ""
        Write-Host "OK: env vars setate cu succes."
        Write-Host "Project: $($response.result.name)"
        Write-Host "Subdomain: $($response.result.subdomain)"
        Write-Host ""
        Write-Host "URMATORUL PAS: trigger rebuild Cloudflare Pages (push commit gol sau Dashboard Retry)."
        exit 0
    }
    Write-Host "FAIL: API a returnat success=false"
    $response.errors | ForEach-Object { Write-Host "  - $($_.message) (code $($_.code))" }
    exit 1
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errBody = $reader.ReadToEnd()
            Write-Host "Response body:"
            Write-Host $errBody
        } catch {}
    }
    exit 1
}
