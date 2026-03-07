$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path "$PSScriptRoot\.."
$serverJob = Start-Job -ScriptBlock {
  param([string]$root)
  Set-Location $root
  Set-Location (Join-Path $root 'server')
  npm.cmd run start
} -ArgumentList $repoRoot

try {
  $ready = $false
  for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 1
    try {
      $response = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:3001/api/settings/contact' -TimeoutSec 2
      if ($response.StatusCode -ge 200) {
        $ready = $true
        break
      }
    } catch {
      # wait until API starts
    }
  }

  if (-not $ready) {
    throw 'API did not start on port 3001 in time.'
  }

  $bootstrapPayload = @{
    name = 'Owner'
    email = 'owner@reptilehouse.sy'
    password = 'Owner@2026!'
    secret = 'bootstrap_admin_2026'
  } | ConvertTo-Json

  try {
    Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3001/api/auth/bootstrap-admin' -ContentType 'application/json' -Body $bootstrapPayload | Out-Null
  } catch {
    # ignore when the admin already exists
  }

  $env:ADMIN_EMAIL = 'owner@reptilehouse.sy'
  $env:ADMIN_PASSWORD = 'Owner@2026!'
  Set-Location $repoRoot
  node scripts/admin-crud-smoke.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "Smoke test failed with exit code $LASTEXITCODE."
  }
} finally {
  Stop-Job -Job $serverJob -ErrorAction SilentlyContinue | Out-Null
  Receive-Job -Job $serverJob -Keep -ErrorAction SilentlyContinue | Out-Null
  Remove-Job -Job $serverJob -Force -ErrorAction SilentlyContinue | Out-Null
}
