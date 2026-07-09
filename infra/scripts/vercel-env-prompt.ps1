# FoodFlow Vercel production env prompt helper.
# Safe default: prints the per-project env contract and exact Vercel CLI commands
# without calling Vercel, printing secret values, writing .env files, or deploying.
#
# To actually add values, first run vercel-web-preflight.ps1, then pass only the
# missing names it reports:
#   powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-env-prompt.ps1 -Project api -Names DATABASE_URL,DIRECT_URL -PromptValues
$ErrorActionPreference = 'Stop'

$LinkProjects = $false
$PromptValues = $false
$Project = @('api', 'admin', 'restaurant')
$Names = @()

for ($i = 0; $i -lt $args.Count; $i++) {
  switch ($args[$i]) {
    '-LinkProjects' {
      $LinkProjects = $true
      continue
    }
    '-PromptValues' {
      $PromptValues = $true
      continue
    }
    '-Project' {
      if ($i + 1 -ge $args.Count) {
        throw '-Project requires one or more comma-separated values: api, admin, restaurant.'
      }
      $i++
      $Project = @($args[$i].Split(',') | ForEach-Object { $_.Trim().ToLowerInvariant() } | Where-Object { $_ })
      continue
    }
    '-Names' {
      if ($i + 1 -ge $args.Count) {
        throw '-Names requires one or more comma-separated environment variable names.'
      }
      $i++
      $Names = @($args[$i].Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
      continue
    }
    default {
      throw "Unknown argument: $($args[$i])"
    }
  }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

$projectDefinitions = @{
  api = @{
    Label = 'API'
    Name = if ($env:API_VERCEL_PROJECT) { $env:API_VERCEL_PROJECT } else { 'foodflow-api' }
    Cwd = Join-Path $repoRoot 'backend'
    Required = @(
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
  }
  admin = @{
    Label = 'Admin'
    Name = if ($env:ADMIN_VERCEL_PROJECT) { $env:ADMIN_VERCEL_PROJECT } else { 'food-delivery-app' }
    Cwd = Join-Path $repoRoot 'web\apps\admin'
    Required = @(
      'NEXT_PUBLIC_API_URL',
      'NEXT_PUBLIC_ADMIN_URL',
      'NEXT_PUBLIC_GOOGLE_MAPS_KEY',
      'NEXT_PUBLIC_REALTIME_PROVIDER',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }
  restaurant = @{
    Label = 'Restaurant'
    Name = if ($env:RESTAURANT_VERCEL_PROJECT) {
      $env:RESTAURANT_VERCEL_PROJECT
    } elseif ($env:RESTAURANT_VERCEL_PROJECT_ID) {
      $env:RESTAURANT_VERCEL_PROJECT_ID
    } else {
      'foodflow-restaurant'
    }
    Cwd = Join-Path $repoRoot 'web\apps\restaurant'
    Required = @(
      'NEXT_PUBLIC_API_URL',
      'NEXT_PUBLIC_RESTAURANT_URL',
      'NEXT_PUBLIC_GOOGLE_MAPS_KEY',
      'NEXT_PUBLIC_REALTIME_PROVIDER',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }
}

$readableEnvNames = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
@(
  'NODE_ENV',
  'REALTIME_PROVIDER',
  'STORAGE_PROVIDER',
  'QUEUE_PROVIDER',
  'SUPABASE_URL',
  'SUPABASE_STORAGE_BUCKET',
  'PASSWORD_RESET_URL_BASE',
  'CORS_ORIGINS',
  'DELIVERY_BASE_FEE_VND',
  'OSRM_URL',
  'SEPAY_ACCOUNT_NUMBER',
  'SMTP_FROM'
) | ForEach-Object { $readableEnvNames.Add($_) | Out-Null }

function Test-ReadableEnv {
  param([Parameter(Mandatory = $true)][string]$Name)
  return $Name.StartsWith('NEXT_PUBLIC_', [System.StringComparison]::Ordinal) -or $readableEnvNames.Contains($Name)
}

function ConvertFrom-SecureStringToPlainText {
  param([Parameter(Mandatory = $true)][securestring]$SecureValue)
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    if ($bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
  }
}

function Invoke-VercelEnvAdd {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$ProjectCwd
  )

  $isReadable = Test-ReadableEnv $Name
  if ($isReadable) {
    $value = Read-Host "Enter public/non-secret production value for $Name"
  } else {
    $secureValue = Read-Host "Enter secret production value for $Name" -AsSecureString
    $value = ConvertFrom-SecureStringToPlainText $secureValue
  }

  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "$Name cannot be empty."
  }

  $vercelCmd = Get-Command vercel.cmd -ErrorAction SilentlyContinue
  if (-not $vercelCmd) {
    $vercelCmd = Get-Command vercel -ErrorAction Stop
  }

  $arguments = @('env', 'add', $Name, 'production', '--cwd', $ProjectCwd, '--yes')
  if ($isReadable) {
    $arguments += '--no-sensitive'
  } else {
    $arguments += '--sensitive'
  }

  try {
    $value | & $vercelCmd.Source @arguments
    if ($LASTEXITCODE -ne 0) {
      throw "vercel env add $Name failed with exit code $LASTEXITCODE"
    }
  } finally {
    $value = $null
  }
}

foreach ($projectKey in $Project) {
  if (@('api', 'admin', 'restaurant') -notcontains $projectKey) {
    throw "Invalid project '$projectKey'. Expected api, admin, or restaurant."
  }
}

foreach ($projectKey in $Project) {
  $definition = $projectDefinitions[$projectKey]
  $label = $definition.Label
  $projectName = $definition.Name
  $cwd = $definition.Cwd
  $targetNames = if ($Names.Count -gt 0) { $Names } else { $definition.Required }

  foreach ($name in $targetNames) {
    if ($definition.Required -notcontains $name) {
      throw "$name is not in the $label production env contract. Check the name or update the preflight contract first."
    }
  }

  Write-Output ""
  Write-Output "$label Vercel project: $projectName"
  Write-Output "Project cwd: $cwd"
  Write-Output "Required production env names in scope:"
  $targetNames | ForEach-Object { Write-Output "  - $_" }

  Write-Output ""
  Write-Output "Safe setup commands:"
  Write-Output "  vercel link --yes --project $projectName --cwd `"$cwd`""
  foreach ($name in $targetNames) {
    $sensitivityFlag = if (Test-ReadableEnv $name) { '--no-sensitive' } else { '--sensitive' }
    Write-Output "  vercel env add $name production --cwd `"$cwd`" --yes $sensitivityFlag"
  }

  if ($LinkProjects) {
    $vercelCmd = Get-Command vercel.cmd -ErrorAction SilentlyContinue
    if (-not $vercelCmd) {
      $vercelCmd = Get-Command vercel -ErrorAction Stop
    }
    & $vercelCmd.Source link --yes --project $projectName --cwd $cwd
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to link Vercel project $projectName at $cwd"
    }
  }

  if ($PromptValues) {
    foreach ($name in $targetNames) {
      Invoke-VercelEnvAdd $name $cwd
    }
  }
}

Write-Output ""
Write-Output "After adding values, rerun: powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-web-preflight.ps1"
