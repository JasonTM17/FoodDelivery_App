# FoodFlow Railway production preflight.
# Checks CLI auth and the required service topology without listing or printing
# service variables. Railway returns raw values from `variable list`, so this
# script deliberately does not call that command.
param(
  [string]$Project = $env:RAILWAY_PROJECT_ID,
  [string]$Environment = $(if ($env:RAILWAY_ENVIRONMENT) { $env:RAILWAY_ENVIRONMENT } else { 'production' }),
  [string]$ApiService = $(if ($env:RAILWAY_API_SERVICE) { $env:RAILWAY_API_SERVICE } else { 'foodflow-api' }),
  [string]$WorkerService = $(if ($env:RAILWAY_WORKER_SERVICE) { $env:RAILWAY_WORKER_SERVICE } else { 'foodflow-worker' }),
  [string]$MigrateService = $(if ($env:RAILWAY_MIGRATE_SERVICE) { $env:RAILWAY_MIGRATE_SERVICE } else { 'foodflow-migrate' }),
  [string]$RedisService = $(if ($env:RAILWAY_REDIS_SERVICE) { $env:RAILWAY_REDIS_SERVICE } else { 'Redis' })
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

function Invoke-NativeCapture {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
  )

  $previous = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $output = & $Command @Arguments 2>&1 | ForEach-Object { $_.ToString() } | Out-String
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previous
  }

  if ($exitCode -ne 0) {
    throw "$Command $($Arguments -join ' ') failed with exit code $exitCode. $output"
  }
  return $output
}

if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
  throw 'Railway CLI is required. Install it with: npm install --global @railway/cli'
}

$railwayConfig = Join-Path $repoRoot 'backend\railway.toml'
if (-not (Test-Path $railwayConfig)) {
  throw 'Missing backend/railway.toml for the API healthcheck configuration.'
}

Write-Host 'Checking Railway CLI authentication...'
Invoke-NativeCapture railway whoami --json | Out-Null

$scope = @('--environment', $Environment)
if (-not [string]::IsNullOrWhiteSpace($Project)) {
  $scope += @('--project', $Project)
}

Write-Host "Checking Railway project topology in environment '$Environment'..."
Invoke-NativeCapture railway status --json @scope | Out-Null

foreach ($service in @($ApiService, $WorkerService, $MigrateService, $RedisService)) {
  Write-Host "Checking Railway service '$service'..."
  Invoke-NativeCapture railway service status --service $service @scope | Out-Null
}

Write-Host 'Railway preflight passed. Confirm sealed API/worker/migrate variables in the Railway dashboard before deploying.'
