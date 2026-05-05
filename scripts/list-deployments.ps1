# List recent CF Pages deployments + status
$token     = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")
$accountId = [Environment]::GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID", "User")

$baseUri = "https://api.cloudflare.com/client/v4/accounts/" + $accountId + "/pages/projects/mami-docs/deployments"
$uri = $baseUri + "?env=production"

$headers = @{ Authorization = "Bearer " + $token }

try {
    $r = Invoke-RestMethod -Uri $uri -Headers $headers
    $first5 = $r.result | Select-Object -First 5
    foreach ($d in $first5) {
        $shortId = $d.id.Substring(0, 8)
        $stage   = $d.latest_stage.name
        $status  = $d.latest_stage.status
        $msg     = $d.deployment_trigger.metadata.commit_message
        $firstLine = if ($msg) { ($msg -split [char]10)[0] } else { "(no msg)" }
        $shortHash = $d.deployment_trigger.metadata.commit_hash.Substring(0, 7)
        Write-Host ($shortId + " | " + $d.created_on + " | " + $shortHash + " | stage=" + $stage + " status=" + $status + " | " + $firstLine)
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host ("Response: " + $reader.ReadToEnd())
    }
}
