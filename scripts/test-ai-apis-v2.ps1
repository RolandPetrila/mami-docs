# Re-test AI APIs cu modele actualizate (2026-05).
# Exclus: DeepSeek (GDPR China), Hyperbolic (402 sold), Plant.ID (0 credit).

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

# ===== xAI Grok (already OK) =====
$results += Test-Endpoint "xAI Grok grok-3-mini" {
    $key = Get-EnvVar "XAI_API_KEY"
    $body = @{ model = "grok-3-mini"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api.x.ai/v1/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== SambaNova - model fixed =====
$results += Test-Endpoint "SambaNova Meta-Llama-3.3-70B" {
    $key = Get-EnvVar "SAMBANOVA_API_KEY"
    $body = @{ model = "Meta-Llama-3.3-70B-Instruct"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api.sambanova.ai/v1/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== SambaNova alt - gpt-oss-120b =====
$results += Test-Endpoint "SambaNova gpt-oss-120b" {
    $key = Get-EnvVar "SAMBANOVA_API_KEY"
    $body = @{ model = "gpt-oss-120b"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api.sambanova.ai/v1/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== NVIDIA NIM - longer timeout for cold start =====
$results += Test-Endpoint "NVIDIA meta/llama-3.3-70b-instruct" {
    $key = Get-EnvVar "NVIDIA_API_KEY"
    $body = @{ model = "meta/llama-3.3-70b-instruct"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://integrate.api.nvidia.com/v1/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } -Body $body -TimeoutSec 90
    return $r.choices[0].message.content.Trim()
}

# ===== GitHub Models - new endpoint format =====
$results += Test-Endpoint "GitHub Models gpt-4o-mini" {
    $key = Get-EnvVar "GITHUB_TOKEN"
    $body = @{ model = "gpt-4o-mini"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://models.github.ai/inference/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== Cloudflare Workers AI - explicit account in URL =====
$results += Test-Endpoint "Cloudflare AI llama-3.1-8b" {
    $token = Get-EnvVar "CLOUDFLARE_API_TOKEN"
    $acc = Get-EnvVar "CLOUDFLARE_ACCOUNT_ID"
    $body = @{ messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json -Depth 5
    $url = "https://api.cloudflare.com/client/v4/accounts/$acc/ai/run/@cf/meta/llama-3.1-8b-instruct"
    $r = Invoke-RestMethod -Method POST -Uri $url `
        -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } -Body $body -TimeoutSec 30
    if ($r.result -and $r.result.response) { return $r.result.response.Trim() }
    return ($r | ConvertTo-Json -Compress -Depth 3).Substring(0, [Math]::Min(80, ($r | ConvertTo-Json -Compress -Depth 3).Length))
}

# ===== Cerebras - check best model available =====
$results += Test-Endpoint "Cerebras gpt-oss-120b" {
    $key = Get-EnvVar "CEREBRAS_API_KEY"
    $body = @{ model = "gpt-oss-120b"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api.cerebras.ai/v1/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== HF Inference - newer model =====
$results += Test-Endpoint "HF Mistral-7B-Instruct-v0.3" {
    $key = Get-EnvVar "HF_TOKEN"
    $body = @{ inputs = $prompt; parameters = @{ max_new_tokens = 10 } } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } -Body $body -TimeoutSec 30
    if ($r -is [array]) { return ($r[0].generated_text -replace [regex]::Escape($prompt), "").Trim() }
    return ($r.generated_text -replace [regex]::Escape($prompt), "").Trim()
}

# ===== Cohere chat (separate from embed) =====
$results += Test-Endpoint "Cohere command-r-plus chat" {
    $key = Get-EnvVar "COHERE_API_KEY"
    $body = @{ message = $prompt; model = "command-r-plus"; max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api.cohere.ai/v1/chat" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } -Body $body -TimeoutSec 30
    return $r.text.Trim()
}

# ===== Mistral chat (large) =====
$results += Test-Endpoint "Mistral mistral-large-latest" {
    $key = Get-EnvVar "MISTRAL_API_KEY"
    $body = @{ model = "mistral-large-latest"; messages = @(@{ role = "user"; content = $prompt }); max_tokens = 10 } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST -Uri "https://api.mistral.ai/v1/chat/completions" `
        -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } -Body $body -TimeoutSec 30
    return $r.choices[0].message.content.Trim()
}

# ===== Replicate (already OK) =====
$results += Test-Endpoint "Replicate account" {
    $key = Get-EnvVar "REPLICATE_API_TOKEN"
    $r = Invoke-RestMethod -Method GET -Uri "https://api.replicate.com/v1/account" `
        -Headers @{ Authorization = "Bearer $key" } -TimeoutSec 15
    return "user=$($r.username) type=$($r.type)"
}

# ===== PlantNet (already OK) =====
$results += Test-Endpoint "PlantNet projects" {
    $key = Get-EnvVar "PLANTNET_API_KEY"
    $r = Invoke-RestMethod -Method GET -Uri "https://my-api.plantnet.org/v2/projects?api-key=$key&lang=en" -TimeoutSec 15
    return "projects=$($r.Count)"
}

Write-Host "`n========== SUMMARY =========="
$ok = ($results | Where-Object { $_.status -eq "OK" }).Count
$fail = ($results | Where-Object { $_.status -eq "FAIL" }).Count
Write-Host "Total: $($results.Count) | OK: $ok | FAIL: $fail`n" -ForegroundColor Cyan

$results | ForEach-Object {
    $icon = if ($_.status -eq "OK") { "[OK]  " } else { "[FAIL]" }
    Write-Host "$icon $($_.name) ($($_.ms)ms)"
}
