# FoodFlow Supabase production preflight.
# Verifies CLI/auth/project/env/migration readiness without printing secrets or
# deploying schema changes.
$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

function Require-Env {
  param([Parameter(Mandatory = $true)][string]$Name)
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Missing required environment variable: $Name"
  }
}

function Reject-LocalUrl {
  param([Parameter(Mandatory = $true)][string]$Name)
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ($value -match 'localhost|127\.0\.0\.1|0\.0\.0\.0') {
    throw "$Name must point at the production Supabase Postgres endpoint, not a local database."
  }
}

Write-Host 'Checking Supabase CLI availability...'
npx supabase --version | Out-Null

Require-Env SUPABASE_ACCESS_TOKEN
Require-Env SUPABASE_PROJECT_REF
Require-Env DATABASE_URL
Require-Env DIRECT_URL
Reject-LocalUrl DATABASE_URL
Reject-LocalUrl DIRECT_URL

Write-Host 'Checking Supabase account/project access...'
$projectsJson = npx supabase projects list --output json
if ($LASTEXITCODE -ne 0) {
  throw 'Supabase project listing failed. Run supabase login or set SUPABASE_ACCESS_TOKEN.'
}

$projects = $projectsJson | ConvertFrom-Json
if (-not ($projects | Where-Object { $_.id -eq $env:SUPABASE_PROJECT_REF })) {
  throw 'SUPABASE_PROJECT_REF is not visible to the authenticated Supabase account.'
}

Write-Host 'Validating Prisma schema against configured production URLs...'
Push-Location (Join-Path $repoRoot 'backend')
try {
  pnpm exec prisma validate --schema prisma/schema.prisma
} finally {
  Pop-Location
}

Write-Host 'Supabase preflight passed. Next gated step: pnpm db:migrate:prod'
