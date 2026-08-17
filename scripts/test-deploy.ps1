param(
  [Parameter(Mandatory=$true)][string]$BaseUrl,
  [Parameter(Mandatory=$true)][string]$ProxyToken
)

# Test script for EduQuery deployment (PowerShell)
# Usage: .\\scripts\\test-deploy.ps1 -BaseUrl "https://your-project.vercel.app" -ProxyToken "<PROXY_API_TOKEN>"

Set-StrictMode -Version Latest

function Fail($msg){ Write-Host "[FAIL] $msg" -ForegroundColor Red; exit 1 }
function Ok($msg){ Write-Host "[OK]  $msg" -ForegroundColor Green }

# Normalize base url
if ($BaseUrl.EndsWith('/')) { $BaseUrl = $BaseUrl.TrimEnd('/') }

Write-Host "Checking site root: $BaseUrl/..."
try {
  $r = Invoke-RestMethod -Uri "$BaseUrl/" -Method Get -ErrorAction Stop
  Ok "Root returned (HTTP 200)."
} catch {
  Fail "Root request failed: $_"
}

# Test proxy endpoint
$proxyUrl = "$BaseUrl/api/llm-proxy"
Write-Host "Testing proxy: $proxyUrl"
$body = @{ prompt = "CI smoke test"; max_tokens = 16 } | ConvertTo-Json
try {
  $resp = Invoke-RestMethod -Uri $proxyUrl -Method Post -Body $body -ContentType 'application/json' -Headers @{ Authorization = "Bearer $ProxyToken" } -ErrorAction Stop
  Ok "/api/llm-proxy returned JSON"
  Write-Host "Response (trimmed):"
  $respStr = ($resp | ConvertTo-Json -Depth 2)
  if ($respStr.Length -gt 500) { $respStr = $respStr.Substring(0,500) + '... (truncated)' }
  Write-Host $respStr
} catch {
  Fail "/api/llm-proxy test failed: $_"
}

Ok "All checks passed."
