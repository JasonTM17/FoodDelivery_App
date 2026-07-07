# FoodFlow Vercel web preflight.
# Verifies Admin/Restaurant project and production env readiness without printing
# environment variable values or deploying.
$ErrorActionPreference = 'Stop'

$adminProject = if ($env:ADMIN_VERCEL_PROJECT) { $env:ADMIN_VERCEL_PROJECT } else { 'food-delivery-app' }
$restaurantProjectId = $env:RESTAURANT_VERCEL_PROJECT_ID

$adminRequiredEnv = @(
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_WS_URL',
  'NEXT_PUBLIC_ADMIN_URL',
  'NEXT_PUBLIC_GOOGLE_MAPS_KEY'
)

$restaurantRequiredEnv = @(
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_WS_URL',
  'NEXT_PUBLIC_RESTAURANT_URL',
  'NEXT_PUBLIC_GOOGLE_MAPS_KEY'
)

function Extract-JsonObject {
  param([Parameter(Mandatory = $true)][string]$Text)
  $start = $Text.IndexOf('{')
  $end = $Text.LastIndexOf('}')
  if ($start -lt 0 -or $end -lt $start) {
    throw 'Expected JSON object in Vercel CLI output.'
  }
  return $Text.Substring($start, $end - $start + 1) | ConvertFrom-Json
}

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
    throw "$Command $($Arguments -join ' ') failed with exit code $exitCode.`n$output"
  }
  return $output
}

function Assert-ContainsLineValue {
  param(
    [Parameter(Mandatory = $true)][string]$Text,
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$Expected
  )
  if ($Text -notmatch [regex]::Escape($Label) -or $Text -notmatch [regex]::Escape($Expected)) {
    throw "Vercel project setting mismatch: expected $Label = $Expected"
  }
}

function Assert-EnvNames {
  param(
    [Parameter(Mandatory = $true)]$Payload,
    [Parameter(Mandatory = $true)][string[]]$Required,
    [Parameter(Mandatory = $true)][string]$ProjectLabel
  )
  $names = @()
  if ($Payload.envs) {
    $names = @($Payload.envs | ForEach-Object { $_.key })
  }
  $missing = @($Required | Where-Object { $names -notcontains $_ })
  if ($missing.Count -gt 0) {
    throw "$ProjectLabel is missing production env vars: $($missing -join ', ')"
  }
}

Write-Host "Checking Vercel Admin project settings for $adminProject..."
$adminInspect = Invoke-NativeCapture vercel project inspect $adminProject --no-color
Assert-ContainsLineValue $adminInspect 'Root Directory' 'web/apps/admin'
Assert-ContainsLineValue $adminInspect 'Framework Preset' 'Next.js'
Assert-ContainsLineValue $adminInspect 'Build Command' 'cd ../.. && pnpm --filter foodflow-admin build'
Assert-ContainsLineValue $adminInspect 'Install Command' 'cd ../.. && pnpm install --frozen-lockfile'
Assert-ContainsLineValue $adminInspect 'Output Directory' '.next'

Write-Host 'Checking Vercel Admin production env names...'
$adminEnvRaw = Invoke-NativeCapture vercel env ls production --format json --no-color
$adminEnv = Extract-JsonObject ($adminEnvRaw -join "`n")
Assert-EnvNames $adminEnv $adminRequiredEnv 'Admin Vercel project'

if ([string]::IsNullOrWhiteSpace($restaurantProjectId)) {
  throw 'Missing RESTAURANT_VERCEL_PROJECT_ID. Create/link a separate Restaurant Vercel project before production deploy.'
}

Write-Host "Checking Vercel Restaurant production env names for $restaurantProjectId..."
$restaurantEnvRaw = Invoke-NativeCapture vercel api "/v9/projects/$restaurantProjectId/env?target=production" --raw
$restaurantEnv = Extract-JsonObject ($restaurantEnvRaw -join "`n")
Assert-EnvNames $restaurantEnv $restaurantRequiredEnv 'Restaurant Vercel project'

Write-Host 'Vercel web preflight passed. Next gated step: deploy only saved, tested versions.'
