# Audit deploy Cloudflare Pages + Workers Mami_Docs
# Citeste status deployments + verifica endpoint health + verifica env vars baked.
# Rulare: powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/audit-deploy.ps1

$ErrorActionPreference = 'Continue'

$accountId = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID", "User")
$token     = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")

if (-not $accountId -or -not $token) {
    Write-Host "ERROR: CLOUDFLARE_ACCOUNT_ID sau CLOUDFLARE_API_TOKEN lipsesc"
    exit 1
}

$headers = @{ Authorization = "Bearer " + $token }

Write-Host "=== Cloudflare Pages - ultimele 3 deployments production ==="
try {
    $uri = "https://api.cloudflare.com/client/v4/accounts/" + $accountId + "/pages/projects/mami-docs/deployments?env=production"
    $r = Invoke-RestMethod -Uri $uri -Headers $headers
    $first3 = $r.result | Select-Object -First 3
    foreach ($d in $first3) {
        Write-Host ("Deployment: " + $d.id.Substring(0, 8))
        Write-Host ("  Created:  " + $d.created_on)
        Write-Host ("  URL:      " + $d.url)
        Write-Host ("  Stage:    " + $d.latest_stage.name + " (status: " + $d.latest_stage.status + ")")
        $msg = $d.deployment_trigger.metadata.commit_message
        if ($msg) {
            $firstLine = ($msg -split [char]10)[0]
            Write-Host ("  Commit:   " + $firstLine)
        }
        Write-Host ""
    }
} catch {
    Write-Host ("ERROR list deployments: " + $_.Exception.Message)
}

Write-Host "=== Endpoint health checks ==="
$endpoints = @(
    @{ name = "PWA homepage";       url = "https://mami-docs.pages.dev/" }
    @{ name = "Manifest";           url = "https://mami-docs.pages.dev/manifest.json" }
    @{ name = "Icon 192 SVG";       url = "https://mami-docs.pages.dev/icons/icon-192.svg" }
    @{ name = "Icon 512 SVG";       url = "https://mami-docs.pages.dev/icons/icon-512.svg" }
    @{ name = "Icon 512 maskable";  url = "https://mami-docs.pages.dev/icons/icon-512-maskable.svg" }
    @{ name = "AI Gateway /health"; url = "https://mami-docs-ai.petrilarolly.workers.dev/health" }
    @{ name = "Keepalive worker";   url = "https://mami-docs-keepalive.petrilarolly.workers.dev/" }
)

foreach ($ep in $endpoints) {
    try {
        $resp = Invoke-WebRequest -Uri $ep.url -UseBasicParsing -Method Head -TimeoutSec 10
        $ct = $resp.Headers['Content-Type']
        Write-Host ("[OK] " + $ep.name + " HTTP " + $resp.StatusCode + " (Content-Type: " + $ct + ")")
    } catch {
        $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "ERR" }
        Write-Host ("[FAIL] " + $ep.name + " " + $code + " " + $_.Exception.Message)
    }
}

Write-Host ""
Write-Host "=== Bundle env vars check ==="
try {
    $html = (Invoke-WebRequest -Uri "https://mami-docs.pages.dev/" -UseBasicParsing).Content
    $m = [regex]::Match($html, 'src="(/assets/index-[^"]+\.js)"')
    if ($m.Success) {
        $bundleUrl = "https://mami-docs.pages.dev" + $m.Groups[1].Value
        Write-Host ("Bundle: " + $bundleUrl)
        $bundle = (Invoke-WebRequest -Uri $bundleUrl -UseBasicParsing).Content
        $hasSupabase = $bundle -match 'supabase'
        $hasNtfy     = $bundle -match 'mami-docs-2026-roland'
        $hasGateway  = $bundle -match 'mami-docs-ai\.petrilarolly'
        Write-Host ("VITE_SUPABASE_URL baked: " + (if ($hasSupabase) { 'YES' } else { 'NO' }))
        Write-Host ("VITE_NTFY_TOPIC baked:    " + (if ($hasNtfy)     { 'YES' } else { 'NO (poate in alt chunk)' }))
        Write-Host ("VITE_AI_GATEWAY_URL baked: " + (if ($hasGateway)  { 'YES' } else { 'NO (poate in alt chunk)' }))
    } else {
        Write-Host "[WARN] Bundle JS path nu a putut fi extras din index.html"
    }
} catch {
    Write-Host ("[ERROR] Bundle check failed: " + $_.Exception.Message)
}
