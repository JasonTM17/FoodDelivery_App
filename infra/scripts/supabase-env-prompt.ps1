# FoodFlow Supabase production env session helper.
# Safe default: prints required release-shell env names and command shape without
# reading, printing, or writing secret values. This script does not deploy.
#
# To verify a real production shell without committing .env files:
#   powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\supabase-env-prompt.ps1 -RunPreflight
$ErrorActionPreference = 'Stop'

$RunPreflight = $false

for ($i = 0; $i -lt $args.Count; $i++) {
  switch ($args[$i]) {
    '-RunPreflight' {
      $RunPreflight = $true
      continue
    }
    default {
      throw "Unknown argument: $($args[$i])"
    }
  }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$preflightScript = Join-Path $PSScriptRoot 'supabase-preflight.ps1'

$requiredEnv = @(
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_PROJECT_REF',
  'DATABASE_URL',
  'DIRECT_URL'
)

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

function Set-SessionEnvFromPrompt {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [switch]$Secret
  )

  if ($Secret) {
    $secureValue = Read-Host "Enter $Name for this release shell" -AsSecureString
    $value = ConvertFrom-SecureStringToPlainText $secureValue
  } else {
    $value = Read-Host "Enter $Name for this release shell"
  }

  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "$Name cannot be empty."
  }

  [Environment]::SetEnvironmentVariable($Name, $value, 'Process')
  $value = $null
}

Write-Output 'Supabase production release-shell env names:'
$requiredEnv | ForEach-Object { Write-Output "  - $_" }

Write-Output ''
Write-Output 'Manual PowerShell shape:'
Write-Output '  $env:SUPABASE_ACCESS_TOKEN = "<rotated-supabase-access-token>"'
Write-Output '  $env:SUPABASE_PROJECT_REF = "lvanszgszzfopusboich"'
Write-Output '  $env:DATABASE_URL = "<supabase pooled transaction-mode postgres URL>"'
Write-Output '  $env:DIRECT_URL = "<supabase direct/session-mode postgres URL>"'
Write-Output '  powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\supabase-preflight.ps1'

if (-not $RunPreflight) {
  Write-Output ''
  Write-Output 'Run with -RunPreflight to enter values through local prompts and execute supabase-preflight.ps1 in this process.'
  exit 0
}

Set-SessionEnvFromPrompt 'SUPABASE_ACCESS_TOKEN' -Secret
Set-SessionEnvFromPrompt 'SUPABASE_PROJECT_REF'
Set-SessionEnvFromPrompt 'DATABASE_URL' -Secret
Set-SessionEnvFromPrompt 'DIRECT_URL' -Secret

try {
  & powershell -NoProfile -ExecutionPolicy Bypass -File $preflightScript
  if ($LASTEXITCODE -ne 0) {
    throw "Supabase preflight failed with exit code $LASTEXITCODE"
  }
} finally {
  foreach ($name in $requiredEnv) {
    [Environment]::SetEnvironmentVariable($name, $null, 'Process')
  }
}

Write-Output 'Supabase preflight passed in this prompted release shell. Next gated step remains backend Prisma migrate deploy only after all release gates are green.'
