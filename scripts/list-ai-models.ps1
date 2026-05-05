# Listeaza modelele disponibile pentru providerii care au /v1/models endpoint
$ErrorActionPreference = "Continue"
function Get-EnvVar($n) {
    $v = [Environment]::GetEnvironmentVariable($n, "User")
    if (-not $v) { $v = [Environment]::GetEnvironmentVariable($n, "Process") }
    return $v
}

function List-Models {
    param($name, $url, $headers, $limit = 8)
    Write-Host "`n=== $name ===" -ForegroundColor Cyan
    try {
        $r = Invoke-RestMethod -Method GET -Uri $url -Headers $headers -TimeoutSec 20
        if ($r.data) {
            $r.data | Select-Object -First $limit | ForEach-Object {
                Write-Host "  $($_.id)"
            }
            Write-Host "  ... ($($r.data.Count) total)"
        } else {
            Write-Host ($r | ConvertTo-Json -Depth 2)
        }
    } catch {
        Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# SambaNova
List-Models "SambaNova" "https://api.sambanova.ai/v1/models" @{
    Authorization = "Bearer $(Get-EnvVar 'SAMBANOVA_API_KEY')"
} 12

# Fireworks
List-Models "Fireworks" "https://api.fireworks.ai/inference/v1/models" @{
    Authorization = "Bearer $(Get-EnvVar 'FIREWORKS_API_KEY')"
} 15

# Hyperbolic
List-Models "Hyperbolic" "https://api.hyperbolic.xyz/v1/models" @{
    Authorization = "Bearer $(Get-EnvVar 'HYPERBOLIC_API_KEY')"
}

# GitHub Models
List-Models "GitHub Models (azure)" "https://models.inference.ai.azure.com/models" @{
    Authorization = "Bearer $(Get-EnvVar 'GITHUB_TOKEN')"
} 15

# NVIDIA
List-Models "NVIDIA NIM" "https://integrate.api.nvidia.com/v1/models" @{
    Authorization = "Bearer $(Get-EnvVar 'NVIDIA_API_KEY')"
} 15

# Cerebras
List-Models "Cerebras (already integrated)" "https://api.cerebras.ai/v1/models" @{
    Authorization = "Bearer $(Get-EnvVar 'CEREBRAS_API_KEY')"
}

# Cloudflare AI - test with simpler /run model
Write-Host "`n=== Cloudflare AI scope test ===" -ForegroundColor Cyan
try {
    $token = Get-EnvVar "CLOUDFLARE_API_TOKEN"
    $r = Invoke-RestMethod -Method GET -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" `
        -Headers @{ Authorization = "Bearer $token" } -TimeoutSec 15
    Write-Host "Token status: $($r.result.status)"
    Write-Host "Token id: $($r.result.id)"
} catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
