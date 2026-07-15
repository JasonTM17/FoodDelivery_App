# FoodFlow Vercel dashboard preflight.
# Verifies the Admin and Restaurant projects and production env names without
# printing environment variable values or deploying. The API runs on Railway.
$ErrorActionPreference = 'Stop'

# Windows npm shims call `exit`, which can terminate the entire preflight after
# `vercel --version`. Invoke the installed CLI entrypoint with Node directly on
# Windows; other platforms use the normal executable.
$vercelCommand = 'vercel'
$vercelPrefix = @()
if ($env:OS -eq 'Windows_NT') {
  $vercelShim = Get-Command vercel.cmd -ErrorAction Stop
  $vercelCli = Join-Path (Split-Path $vercelShim.Source) 'node_modules\vercel\dist\vc.js'
  if (-not (Test-Path $vercelCli)) {
    throw "Unable to locate the Vercel CLI entrypoint beside $($vercelShim.Source)."
  }
  $vercelCommand = (Get-Command node -ErrorAction Stop).Source
  $vercelPrefix = @($vercelCli)
}

$adminProject = if ($env:ADMIN_VERCEL_PROJECT) { $env:ADMIN_VERCEL_PROJECT } else { 'food-delivery-app' }
$restaurantProject = if ($env:RESTAURANT_VERCEL_PROJECT) {
  $env:RESTAURANT_VERCEL_PROJECT
} elseif ($env:RESTAURANT_VERCEL_PROJECT_ID) {
  $env:RESTAURANT_VERCEL_PROJECT_ID
} else {
  'foodflow-restaurant'
}

$adminRequiredEnv = @(
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_ADMIN_URL',
  'NEXT_PUBLIC_MAP_PROVIDER',
  'NEXT_PUBLIC_MAP_STYLE_URL',
  'NEXT_PUBLIC_REALTIME_PROVIDER',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
)

$restaurantRequiredEnv = @(
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_RESTAURANT_URL',
  'NEXT_PUBLIC_MAP_PROVIDER',
  'NEXT_PUBLIC_MAP_STYLE_URL',
  'NEXT_PUBLIC_REALTIME_PROVIDER',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
)

$preflightIssues = New-Object System.Collections.Generic.List[string]

function Add-PreflightIssue {
  param([Parameter(Mandatory = $true)][string]$Message)
  $preflightIssues.Add($Message) | Out-Null
}

function Invoke-PreflightCheck {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][scriptblock]$Script
  )
  try {
    & $Script
  } catch {
    Add-PreflightIssue ("{0}: {1}" -f $Label, $_.Exception.Message)
  }
}

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
  $matchingLines = @(
    $Text -split "`r?`n" |
      Where-Object {
        $_ -match [regex]::Escape($Label) -and
        $_ -match [regex]::Escape($Expected)
      }
  )
  if ($matchingLines.Count -eq 0) {
    throw "Vercel project setting mismatch: expected $Label = $Expected"
  }
}

function Assert-EnvNames {
  param(
    [Parameter(Mandatory = $true)]$Payload,
    [Parameter(Mandatory = $true)][string[]]$Required,
    [Parameter(Mandatory = $true)][string]$ProjectLabel
  )
  $entries = @()
  if ($Payload.envs) {
    $entries = @($Payload.envs)
  }
  $names = @($entries | ForEach-Object { $_.key })
  $missing = @($Required | Where-Object { $names -notcontains $_ })
  if ($missing.Count -gt 0) {
    throw "$ProjectLabel is missing production env vars: $($missing -join ', ')"
  }

  # NEXT_PUBLIC_* values are baked into browser bundles and are not secrets.
  # Vercel sensitive values cannot be read back by the release preflight, which
  # lets stale localhost/tunnel endpoints pass on name alone. Require an
  # auditable env type so the saved value can be verified before deployment.
  $nonAuditable = @(
    $entries |
      Where-Object { $_.key -in $Required -and $_.type -eq 'sensitive' } |
      ForEach-Object { $_.key }
  )
  if ($nonAuditable.Count -gt 0) {
    throw "$ProjectLabel stores public build vars as non-auditable sensitive values: $($nonAuditable -join ', ')"
  }
}

Invoke-PreflightCheck 'Vercel CLI availability/auth' {
  Invoke-NativeCapture $vercelCommand @vercelPrefix --version | Out-Null
}

Invoke-PreflightCheck 'Vercel Admin project settings' {
  Write-Host "Checking Vercel Admin project settings for $adminProject..."
  $adminInspect = Invoke-NativeCapture $vercelCommand @vercelPrefix project inspect $adminProject --no-color
  Assert-ContainsLineValue $adminInspect 'Root Directory' 'web/apps/admin'
  Assert-ContainsLineValue $adminInspect 'Framework Preset' 'Next.js'
  Assert-ContainsLineValue $adminInspect 'Build Command' 'cd ../.. && pnpm --filter foodflow-admin build'
  Assert-ContainsLineValue $adminInspect 'Install Command' 'cd ../.. && pnpm install --frozen-lockfile'
  Assert-ContainsLineValue $adminInspect 'Output Directory' '.next'
}

Invoke-PreflightCheck 'Vercel Admin production env names' {
  Write-Host 'Checking Vercel Admin production env names...'
  $adminEnvRaw = Invoke-NativeCapture $vercelCommand @vercelPrefix api "/v9/projects/$adminProject/env?target=production" --raw
  $adminEnv = Extract-JsonObject ($adminEnvRaw -join "`n")
  Assert-EnvNames $adminEnv $adminRequiredEnv 'Admin Vercel project'
}

Invoke-PreflightCheck 'Vercel Restaurant project settings' {
  Write-Host "Checking Vercel Restaurant project settings for $restaurantProject..."
  $restaurantInspect = Invoke-NativeCapture $vercelCommand @vercelPrefix project inspect $restaurantProject --no-color
  Assert-ContainsLineValue $restaurantInspect 'Root Directory' 'web/apps/restaurant'
  Assert-ContainsLineValue $restaurantInspect 'Framework Preset' 'Next.js'
  Assert-ContainsLineValue $restaurantInspect 'Build Command' 'cd ../.. && pnpm --filter restaurant build'
  Assert-ContainsLineValue $restaurantInspect 'Install Command' 'cd ../.. && pnpm install --frozen-lockfile'
  Assert-ContainsLineValue $restaurantInspect 'Output Directory' '.next'
}

Invoke-PreflightCheck 'Vercel Restaurant production env names' {
  Write-Host "Checking Vercel Restaurant production env names for $restaurantProject..."
  $restaurantEnvRaw = Invoke-NativeCapture $vercelCommand @vercelPrefix api "/v9/projects/$restaurantProject/env?target=production" --raw
  $restaurantEnv = Extract-JsonObject ($restaurantEnvRaw -join "`n")
  Assert-EnvNames $restaurantEnv $restaurantRequiredEnv 'Restaurant Vercel project'
}

if ($preflightIssues.Count -gt 0) {
  $message = "Vercel production preflight failed:`n  - " + ($preflightIssues -join "`n  - ")
  throw $message
}

Write-Host 'Vercel web preflight passed. Next gated step: deploy only saved, tested versions.'
