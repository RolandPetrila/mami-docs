# Test live al API-urilor AI candidate pentru integrare in Mami_Docs.
# Ruleaza fiecare provider cu un prompt simplu si raporteaza OK/FAIL + latency.
# NU afiseaza valorile cheilor.

$ErrorActionPreference = "Continue"
$prompt = "Salut! Raspunde cu un singur cuvant: OK"
$results = @()

function Test-Endpoint {
    param($name, $sb)
    Write-Host -NoNewline "[$name] "
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $resp = & $sb
        $sw.Stop()
        Write-Host "OK ($($sw.ElapsedMilliseconds)ms) -> $resp" -ForegroundColor Green
        return @{ name = $name; status = "OK"; ms = $sw.ElapsedMilliseconds; sample = $resp }
    } catch {
        $sw.Stop()
        $msg = $_.Exception.Message
        if ($msg.Length -gt 180) { $msg = $msg.Substring(0, 180) + "..." }
        Write-Host "FAIL ($($sw.ElapsedMilliseconds)ms) -> $msg" -ForegroundColor Red
        return @{ name = $name; status = "FAIL"; ms = $sw.ElapsedMilliseconds; error = $msg }
    }
}

function Get-EnvVar($n) {
    $v = [Environment]::GetEnvironmentVariable($n, "User")
    if (-not $v) { $v = [Environment]::GetEnvironmentVariable($n, "Process") }
    return $v
}

# ===== xAI Grok =====
$results += Test-Endpoint "xAI Grok (grok-3-mini)" {
    $key = Get-EnvVar "XAI_API_KEY"
    $body = @{ model = "grok-3-mini"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api.x.ai/v1/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } `
        -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== SambaNova =====
$results += Test-Endpoint "SambaNova (Llama-3.1-405B)" {
    $key = Get-EnvVar "SAMBANOVA_API_KEY"
    $body = @{ model = "Meta-Llama-3.1-405B-Instruct"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api.sambanova.ai/v1/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } `
        -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== NVIDIA NIM =====
$results += Test-Endpoint "NVIDIA NIM (llama-3.1-70b)" {
    $key = Get-EnvVar "NVIDIA_API_KEY"
    $body = @{ model = "meta/llama-3.1-70b-instruct"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://integrate.api.nvidia.com/v1/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } `
        -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== Fireworks AI =====
$results += Test-Endpoint "Fireworks (Llama-3.1-70B)" {
    $key = Get-EnvVar "FIREWORKS_API_KEY"
    $body = @{ model = "accounts/fireworks/models/llama-v3p1-70b-instruct"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api.fireworks.ai/inference/v1/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } `
        -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== Hyperbolic =====
$results += Test-Endpoint "Hyperbolic (Llama-3.1-70B)" {
    $key = Get-EnvVar "HYPERBOLIC_API_KEY"
    $body = @{ model = "meta-llama/Meta-Llama-3.1-70B-Instruct"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api.hyperbolic.xyz/v1/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } `
        -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== GitHub Models =====
$results += Test-Endpoint "GitHub Models (Llama-3.1-70B)" {
    $key = Get-EnvVar "GITHUB_TOKEN"
    $body = @{ model = "meta-llama-3.1-70b-instruct"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://models.inference.ai.azure.com/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } `
        -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== Cloudflare Workers AI =====
$results += Test-Endpoint "Cloudflare AI (Llama-3.1-8B)" {
    $token = Get-EnvVar "CLOUDFLARE_API_TOKEN"
    $acc = Get-EnvVar "CLOUDFLARE_ACCOUNT_ID"
    $body = @{ messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api.cloudflare.com/client/v4/accounts/$acc/ai/run/@cf/meta/llama-3.1-8b-instruct" `
        -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
        -Body $body -TimeoutSec 30
    return $r.result.response.Trim()
}

# ===== Hugging Face Inference =====
$results += Test-Endpoint "HF Inference (Mixtral-8x7B)" {
    $key = Get-EnvVar "HF_TOKEN"
    $body = @{ inputs = $prompt; parameters = @{ max_new_tokens = 10 } } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } `
        -Body $body -TimeoutSec 30
    if ($r -is [array]) { return ($r[0].generated_text -replace $prompt, "").Trim() }
    return ($r.generated_text -replace $prompt, "").Trim()
}

# ===== Replicate =====
$results += Test-Endpoint "Replicate (account check)" {
    $key = Get-EnvVar "REPLICATE_API_TOKEN"
    $r = Invoke-RestMethod -Method GET -Uri "https://api.replicate.com/v1/account" `
        -Headers @{ Authorization = "Bearer $key" } -TimeoutSec 15
    return "user=$($r.username) type=$($r.type)"
}

# ===== Azure Document Intelligence =====
$results += Test-Endpoint "Azure Doc Intel (read model)" {
    $key = Get-EnvVar "AZURE_DOC_INTEL_KEY"
    $r = Invoke-RestMethod -Method GET -Uri "https://mami-docs-doc-intel.cognitiveservices.azure.com/documentintelligence/documentModels?api-version=2024-11-30" `
        -Headers @{ "Ocp-Apim-Subscription-Key" = $key } -TimeoutSec 15
    return "models_count=$($r.value.Count)"
}

# ===== Plant.ID =====
$results += Test-Endpoint "Plant.ID (usage check)" {
    $key = Get-EnvVar "PLANTID_API_KEY"
    $r = Invoke-RestMethod -Method GET -Uri "https://api.plant.id/v3/usage_info" `
        -Headers @{ "Api-Key" = $key } -TimeoutSec 15
    return "credits_left=$($r.active.remaining) total=$($r.active.total)"
}

# ===== PlantNet =====
$results += Test-Endpoint "PlantNet (project list)" {
    $key = Get-EnvVar "PLANTNET_API_KEY"
    $r = Invoke-RestMethod -Method GET -Uri "https://my-api.plantnet.org/v2/projects?api-key=$key&lang=en" -TimeoutSec 15
    return "projects=$($r.Count)"
}

# ===== Adobe PDF Services =====
$results += Test-Endpoint "Adobe PDF Services (auth)" {
    $key = Get-EnvVar "ADOBE_API_KEY"
    $secret = Get-EnvVar "ADOBE_CLIENT_SECRET"
    $body = "client_id=$key&client_secret=$secret&grant_type=client_credentials&scope=openid,AdobeID,DCAPI"
    $r = Invoke-RestMethod -Method POST -Uri "https://pdf-services.adobe.io/token" `
        -Headers @{ "Content-Type" = "application/x-www-form-urlencoded" } `
        -Body $body -TimeoutSec 15
    return "token_type=$($r.token_type) expires_in=$($r.expires_in)"
}

Write-Host "`n========== SUMMARY =========="
$ok = ($results | Where-Object { $_.status -eq "OK" }).Count
$fail = ($results | Where-Object { $_.status -eq "FAIL" }).Count
Write-Host "Total: $($results.Count) | OK: $ok | FAIL: $fail`n" -ForegroundColor Cyan

$results | ForEach-Object {
    $icon = if ($_.status -eq "OK") { "[OK]  " } else { "[FAIL]" }
    Write-Host "$icon $($_.name) ($($_.ms)ms)"
}
