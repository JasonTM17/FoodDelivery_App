# FoodFlow local release gate.
# Runs non-production validation from the clean worktree without printing secret
# values. Full pre-deploy mode also calls Supabase/Vercel preflight guards, which
# intentionally fail until production env/auth is configured.
param(
  [switch]$AllowDirty,
  [switch]$SkipBackend,
  [switch]$SkipWeb,
  [switch]$SkipMobile,
  [switch]$SkipInstall,
  [switch]$SkipBuild,
  [switch]$SkipOpenApi,
  [switch]$SkipDockerConfig,
  [switch]$RunE2E,
  [switch]$SkipDeployPreflight,
  [string]$AdminPublicUrl = $(if ($env:NEXT_PUBLIC_ADMIN_URL) { $env:NEXT_PUBLIC_ADMIN_URL } else { 'https://food-delivery-app-one-liard.vercel.app' })
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

function Invoke-Native {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][scriptblock]$Script,
    [hashtable]$Environment = @{}
  )

  Write-Host ""
  Write-Host "=== $Name ==="
  $oldValues = @{}
  foreach ($key in $Environment.Keys) {
    $oldValues[$key] = [Environment]::GetEnvironmentVariable($key)
    [Environment]::SetEnvironmentVariable($key, [string]$Environment[$key])
  }

  Push-Location $WorkingDirectory
  try {
    & $Script
  } finally {
    Pop-Location
    foreach ($key in $Environment.Keys) {
      [Environment]::SetEnvironmentVariable($key, $oldValues[$key])
    }
  }
}

function Assert-CleanWorktree {
  if ($AllowDirty) {
    Write-Host 'Dirty worktree allowed for this run.'
    return
  }

  $status = git -C $repoRoot status --porcelain
  if ($status) {
    throw "Worktree must be clean before release gate. Re-run with -AllowDirty only for local script development."
  }
}

function Invoke-SecretScan {
  Invoke-Native powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'secret-scan.ps1')
}

Invoke-Step 'Git hygiene and secret scan' $repoRoot {
  Assert-CleanWorktree
  Invoke-Native git diff --check
  Invoke-Native git diff --cached --check
  Invoke-SecretScan
}

if (-not $SkipBackend) {
  if (-not $SkipInstall) {
    Invoke-Step 'Backend frozen install' (Join-Path $repoRoot 'backend') {
      Invoke-Native pnpm install --frozen-lockfile
    }
  }
  Invoke-Step 'Backend Prisma validate' (Join-Path $repoRoot 'backend') {
    Invoke-Native pnpm exec prisma validate --schema prisma/schema.prisma
  } @{
    DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/foodflow?schema=public'
    DIRECT_URL = 'postgresql://postgres:postgres@localhost:5432/foodflow?schema=public'
  }
  Invoke-Step 'Backend typecheck' (Join-Path $repoRoot 'backend') { Invoke-Native pnpm typecheck }
  Invoke-Step 'Backend lint' (Join-Path $repoRoot 'backend') { Invoke-Native pnpm lint }
  Invoke-Step 'Backend Jest' (Join-Path $repoRoot 'backend') { Invoke-Native pnpm exec jest --runInBand }
  if (-not $SkipBuild) {
    Invoke-Step 'Backend build' (Join-Path $repoRoot 'backend') { Invoke-Native pnpm build }
  }
}

if (-not $SkipWeb) {
  if (-not $SkipInstall) {
    Invoke-Step 'Web frozen install' (Join-Path $repoRoot 'web') {
      Invoke-Native pnpm install --frozen-lockfile
    }
  }
  Invoke-Step 'Web typecheck' (Join-Path $repoRoot 'web') { Invoke-Native pnpm typecheck }
  Invoke-Step 'Web lint' (Join-Path $repoRoot 'web') { Invoke-Native pnpm lint }
  Invoke-Step 'Web Vitest' (Join-Path $repoRoot 'web') { Invoke-Native pnpm test }
  if (-not $SkipBuild) {
    Invoke-Step 'Admin production build' (Join-Path $repoRoot 'web') {
      Invoke-Native pnpm --filter foodflow-admin build
    } @{ NEXT_PUBLIC_ADMIN_URL = $AdminPublicUrl }

    if ([string]::IsNullOrWhiteSpace($env:NEXT_PUBLIC_RESTAURANT_URL)) {
      throw 'NEXT_PUBLIC_RESTAURANT_URL is required before Restaurant production build. Use -SkipBuild only for partial local validation.'
    }
    Invoke-Step 'Restaurant production build' (Join-Path $repoRoot 'web') {
      Invoke-Native pnpm --filter restaurant build
    }
  }
}

if (-not $SkipOpenApi) {
  Invoke-Step 'OpenAPI Spectral lint' $repoRoot {
    Invoke-Native npx -y @stoplight/spectral-cli lint docs/openapi.yaml --ruleset docs/openapi/.spectral.yaml --fail-severity error
  }
}

if (-not $SkipDockerConfig) {
  Invoke-Step 'Docker Compose config' $repoRoot {
    Invoke-Native docker compose -f docker-compose.yml config --quiet
    Invoke-Native docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet
    Invoke-Native docker compose -f docker-compose.yml -f docker-compose.local.yml config --quiet
  } @{
    POSTGRES_PASSWORD = 'compose-config-placeholder'
    REDIS_PASSWORD = 'compose-config-placeholder'
    JWT_SECRET = 'compose-config-only-jwt-secret-32-chars'
    JWT_REFRESH_SECRET = 'compose-config-only-refresh-secret-32-chars'
    PASSWORD_RESET_URL_BASE = 'https://admin.foodflow.test/reset-password'
    MINIO_ROOT_USER = 'compose-config-user'
    MINIO_ROOT_PASSWORD = 'compose-config-password'
    MINIO_ACCESS_KEY = 'compose-config-access'
    MINIO_SECRET_KEY = 'compose-config-secret'
    MINIO_PUBLIC_URL = 'https://storage.foodflow.test'
    GOOGLE_MAPS_API_KEY = 'compose-config-google-maps-key'
    OSRM_URL = 'https://routes.foodflow.test'
    DEEPSEEK_API_KEY = 'compose-config-deepseek-key'
    SEPAY_API_KEY = 'compose-config-sepay-key'
    SEPAY_ACCOUNT_NUMBER = '0000000000'
    SEPAY_WEBHOOK_SECRET = 'compose-config-sepay-webhook-secret'
    WEBHOOK_SECRET = 'compose-config-webhook-secret'
    SMTP_HOST = 'smtp.foodflow.test'
    SMTP_USER = 'compose-config-smtp-user'
    SMTP_PASS = 'compose-config-smtp-password'
    SMTP_FROM = 'FoodFlow <noreply@foodflow.test>'
    FCM_SERVER_KEY = 'compose-config-fcm-key'
    TWILIO_ACCOUNT_SID = 'compose-config-twilio-sid'
    TWILIO_AUTH_TOKEN = 'compose-config-twilio-token'
    TWILIO_FROM_NUMBER = '+10000000000'
  }
}

if ($RunE2E) {
  Invoke-Step 'Playwright Chromium and Firefox' (Join-Path $repoRoot 'web') {
    Invoke-Native pnpm test:e2e --project=chromium --project=firefox
  }
} else {
  Write-Host ''
  Write-Host 'Skipping Playwright E2E. Re-run with -RunE2E when seeded local services are running.'
}

if (-not $SkipMobile) {
  if (-not $SkipInstall) {
    Invoke-Step 'Mobile frozen install' (Join-Path $repoRoot 'mobile') {
      Invoke-Native flutter pub get --enforce-lockfile
    }
  }
  Invoke-Step 'Mobile analyze' (Join-Path $repoRoot 'mobile') { Invoke-Native flutter analyze }
  Invoke-Step 'Mobile test' (Join-Path $repoRoot 'mobile') { Invoke-Native flutter test }
}

if (-not $SkipDeployPreflight) {
  Invoke-Step 'Supabase production preflight' $repoRoot {
    Invoke-Native powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\supabase-preflight.ps1
  }
  Invoke-Step 'Vercel web preflight' $repoRoot {
    Invoke-Native powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-web-preflight.ps1
  }
}

Write-Host ""
Write-Host 'Local release gate completed.'
