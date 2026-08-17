param(
  [string]$EnvFile = ".env",
  [switch]$Install
)

# Simple helper to prepare, build, and start the EduQuery app on Windows (PowerShell)
# Usage examples:
#  powershell -ExecutionPolicy Bypass -File .\start-local.ps1 -Install
#  pwsh -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1

Set-StrictMode -Version Latest

function Write-Ok($msg){ Write-Host "[OK]  $msg" -ForegroundColor Green }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg){ Write-Host "[ERR]  $msg" -ForegroundColor Red }

# Check for node
try {
  $nodeVer = (node -v) 2>$null
  if (-not $nodeVer) { throw }
  Write-Ok "Node detected: $nodeVer"
} catch {
  Write-Err "Node.js is not found in PATH. Install Node.js (>=18) from https://nodejs.org/ and re-run this script."
  exit 1
}

# Install dependencies if requested or node_modules missing
if ($Install -or -not (Test-Path "node_modules")) {
  Write-Host "Installing npm dependencies..."
  npm install
  if ($LASTEXITCODE -ne 0) { Write-Err "npm install failed."; exit 1 }
  Write-Ok "npm install completed"
}

# Create .env from example if missing
if (-not (Test-Path $EnvFile) -and (Test-Path ".env.example")) {
  Copy-Item ".env.example" $EnvFile -Force
  Write-Warn "Created $EnvFile from .env.example. Edit it to set PROXY_API_TOKEN and HF_API_TOKEN before deploying."
}

# Load env file variables into the process environment (simple KEY=VALUE parsing)
if (Test-Path $EnvFile) {
  Write-Host "Loading environment variables from $EnvFile"
  Get-Content $EnvFile | ForEach-Object {
    $_ = $_.Trim()
    if ($_ -and -not $_.StartsWith('#')) {
      $parts = $_ -split '=', 2
      if ($parts.Count -eq 2) {
        $name = $parts[0].Trim()
        $value = $parts[1].Trim().Trim("'\"")
        if ($name) { $env:$name = $value }
      }
    }
  }
}

# Build the production bundle (esbuild + fingerprinting)
Write-Host "Running build (npm run build)..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Err "Build failed. Fix errors and try again."; exit 1 }
Write-Ok "Build completed. Files are in dist\"

# Start the server (server.js) in a detached process so the script exits while server keeps running
Write-Host "Starting Node server (server.js) in a new process..."
$nodePath = "node"
$startInfo = @{
  FilePath = $nodePath
  ArgumentList = @('server.js')
  WorkingDirectory = (Get-Location)
}
try {
  $proc = Start-Process @startInfo -PassThru
  Write-Ok "Server process started (PID: $($proc.Id))"
} catch {
  Write-Err "Failed to start server process: $_"
  exit 1
}

# Wait briefly for server to come up
Start-Sleep -Seconds 1

$uri = 'http://localhost:3000/'
Write-Host "Opening $uri in default browser..."
Start-Process $uri

Write-Host "Done. If the page does not load, check the server logs."
Write-Host "For local testing of the proxy, set the browser token via the console:"
Write-Host "  localStorage.setItem('eduquery_proxy_token','<PROXY_API_TOKEN>')"

Write-Host "To stop the server, find and stop the Node process (Task Manager) or run:`n  Stop-Process -Id $($proc.Id) -Force`"