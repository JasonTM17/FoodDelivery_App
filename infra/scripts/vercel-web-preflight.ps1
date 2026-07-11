# FoodFlow Vercel production preflight.
# Verifies API/Admin/Restaurant project and production env readiness without printing
# environment variable values or deploying.
$ErrorActionPreference = 'Stop'

$apiProject = if ($env:API_VERCEL_PROJECT) { $env:API_VERCEL_PROJECT } else { 'foodflow-api' }
$adminProject = if ($env:ADMIN_VERCEL_PROJECT) { $env:ADMIN_VERCEL_PROJECT } else { 'food-delivery-app' }
$restaurantProject = if ($env:RESTAURANT_VERCEL_PROJECT) {
  $env:RESTAURANT_VERCEL_PROJECT
} elseif ($env:RESTAURANT_VERCEL_PROJECT_ID) {
  $env:RESTAURANT_VERCEL_PROJECT_ID
} else {
  'foodflow-restaurant'
}

$apiRequiredEnv = @(
  'NODE_ENV',
  'DATABASE_URL',
  'DIRECT_URL',
  'REDIS_URL',
  'REALTIME_PROVIDER',
  'STORAGE_PROVIDER',
  'QUEUE_PROVIDER',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_STORAGE_BUCKET',
  'SUPABASE_KYC_BUCKET',
  'DRIVER_KYC_MAX_UPLOAD_MB',
  'DRIVER_KYC_RETRY_LIMIT',
  'CRON_SECRET',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'PASSWORD_RESET_URL_BASE',
  'CORS_ORIGINS',
  'DELIVERY_BASE_FEE_VND',
  'GOOGLE_MAPS_API_KEY',
  'OSRM_URL',
  'DEEPSEEK_API_KEY',
  'SEPAY_API_KEY',
  'SEPAY_ACCOUNT_NUMBER',
  'SEPAY_WEBHOOK_SECRET',
  'WEBHOOK_SECRET',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'FCM_SERVER_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER'
)

$adminRequiredEnv = @(
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_ADMIN_URL',
  'NEXT_PUBLIC_GOOGLE_MAPS_KEY',
  'NEXT_PUBLIC_REALTIME_PROVIDER',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
)

$restaurantRequiredEnv = @(
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_RESTAURANT_URL',
  'NEXT_PUBLIC_GOOGLE_MAPS_KEY',
  'NEXT_PUBLIC_REALTIME_PROVIDER',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
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

Invoke-PreflightCheck 'Vercel CLI availability/auth' {
  Invoke-NativeCapture vercel --version | Out-Null
}

Invoke-PreflightCheck 'Vercel API project settings' {
  Write-Host "Checking Vercel API project settings for $apiProject..."
  $apiInspect = Invoke-NativeCapture vercel project inspect $apiProject --no-color
  Assert-ContainsLineValue $apiInspect 'Root Directory' 'backend'
  Assert-ContainsLineValue $apiInspect 'Framework Preset' 'Other'
  Assert-ContainsLineValue $apiInspect 'Build Command' 'pnpm prisma generate && pnpm build'
  Assert-ContainsLineValue $apiInspect 'Install Command' 'pnpm install --frozen-lockfile'
}

Invoke-PreflightCheck 'Vercel API production env names' {
  Write-Host 'Checking Vercel API production env names...'
  $apiEnvRaw = Invoke-NativeCapture vercel api "/v9/projects/$apiProject/env?target=production" --raw
  $apiEnv = Extract-JsonObject ($apiEnvRaw -join "`n")
  Assert-EnvNames $apiEnv $apiRequiredEnv 'API Vercel project'
}

Invoke-PreflightCheck 'Vercel Admin project settings' {
  Write-Host "Checking Vercel Admin project settings for $adminProject..."
  $adminInspect = Invoke-NativeCapture vercel project inspect $adminProject --no-color
  Assert-ContainsLineValue $adminInspect 'Root Directory' 'web/apps/admin'
  Assert-ContainsLineValue $adminInspect 'Framework Preset' 'Next.js'
  Assert-ContainsLineValue $adminInspect 'Build Command' 'cd ../.. && pnpm --filter foodflow-admin build'
  Assert-ContainsLineValue $adminInspect 'Install Command' 'cd ../.. && pnpm install --frozen-lockfile'
  Assert-ContainsLineValue $adminInspect 'Output Directory' '.next'
}

Invoke-PreflightCheck 'Vercel Admin production env names' {
  Write-Host 'Checking Vercel Admin production env names...'
  $adminEnvRaw = Invoke-NativeCapture vercel api "/v9/projects/$adminProject/env?target=production" --raw
  $adminEnv = Extract-JsonObject ($adminEnvRaw -join "`n")
  Assert-EnvNames $adminEnv $adminRequiredEnv 'Admin Vercel project'
}

Invoke-PreflightCheck 'Vercel Restaurant project settings' {
  Write-Host "Checking Vercel Restaurant project settings for $restaurantProject..."
  $restaurantInspect = Invoke-NativeCapture vercel project inspect $restaurantProject --no-color
  Assert-ContainsLineValue $restaurantInspect 'Root Directory' 'web/apps/restaurant'
  Assert-ContainsLineValue $restaurantInspect 'Framework Preset' 'Next.js'
  Assert-ContainsLineValue $restaurantInspect 'Build Command' 'cd ../.. && pnpm --filter restaurant build'
  Assert-ContainsLineValue $restaurantInspect 'Install Command' 'cd ../.. && pnpm install --frozen-lockfile'
  Assert-ContainsLineValue $restaurantInspect 'Output Directory' '.next'
}

Invoke-PreflightCheck 'Vercel Restaurant production env names' {
  Write-Host "Checking Vercel Restaurant production env names for $restaurantProject..."
  $restaurantEnvRaw = Invoke-NativeCapture vercel api "/v9/projects/$restaurantProject/env?target=production" --raw
  $restaurantEnv = Extract-JsonObject ($restaurantEnvRaw -join "`n")
  Assert-EnvNames $restaurantEnv $restaurantRequiredEnv 'Restaurant Vercel project'
}

if ($preflightIssues.Count -gt 0) {
  $message = "Vercel production preflight failed:`n  - " + ($preflightIssues -join "`n  - ")
  throw $message
}

Write-Host 'Vercel web preflight passed. Next gated step: deploy only saved, tested versions.'
