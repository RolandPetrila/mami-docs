# Cloudflare Pages project info - debug auto-deploy disconnect
$token     = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")
$accountId = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID", "User")

$uri = "https://api.cloudflare.com/client/v4/accounts/" + $accountId + "/pages/projects/mami-docs"
$headers = @{ Authorization = "Bearer " + $token }

try {
    $r = Invoke-RestMethod -Uri $uri -Headers $headers
    $p = $r.result
    Write-Host "=== Project info ==="
    Write-Host ("Name:          " + $p.name)
    Write-Host ("Subdomain:     " + $p.subdomain)
    Write-Host ("Production:    " + $p.production_branch)
    Write-Host ("Created:       " + $p.created_on)
    Write-Host ""
    Write-Host "=== Source ==="
    if ($p.source) {
        Write-Host ("Type:          " + $p.source.type)
        Write-Host ("Owner:         " + $p.source.config.owner)
        Write-Host ("Repo:          " + $p.source.config.repo_name)
        Write-Host ("Production br: " + $p.source.config.production_branch)
        Write-Host ("Deploy on PR:  " + $p.source.config.deployments_enabled)
    } else {
        Write-Host "NO SOURCE - connection lost (cauza auto-deploy oprit)"
    }
    Write-Host ""
    Write-Host "=== Build config ==="
    if ($p.build_config) {
        Write-Host ("Build cmd:     " + $p.build_config.build_command)
        Write-Host ("Output dir:    " + $p.build_config.destination_dir)
        Write-Host ("Root dir:      " + $p.build_config.root_dir)
    }
    Write-Host ""
    Write-Host "=== Latest deployment ==="
    if ($p.latest_deployment) {
        Write-Host ("ID:            " + $p.latest_deployment.id.Substring(0, 8))
        Write-Host ("Created:       " + $p.latest_deployment.created_on)
        Write-Host ("Branch:        " + $p.latest_deployment.deployment_trigger.metadata.branch)
        $hash = $p.latest_deployment.deployment_trigger.metadata.commit_hash
        if ($hash) { Write-Host ("Commit:        " + $hash.Substring(0, 7)) }
        Write-Host ("Stage:         " + $p.latest_deployment.latest_stage.name + " (" + $p.latest_deployment.latest_stage.status + ")")
    }
} catch {
    Write-Host ("ERROR: " + $_.Exception.Message)
}
