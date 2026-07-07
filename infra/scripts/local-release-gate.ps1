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
  $patterns = @(
    'sk-[A-Za-z0-9_-]{20,}',
    'AIza[0-9A-Za-z_-]{20,}',
    '-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----',
    'xox[baprs]-[0-9A-Za-z-]{10,}',
    'ghp_[0-9A-Za-z]{36}',
    'github_pat_[0-9A-Za-z_]{20,}',
    'AKIA[0-9A-Z]{16}'
  )

  $hits = New-Object System.Collections.Generic.List[string]
  foreach ($pattern in $patterns) {
    $files = git -C $repoRoot grep -Il -E -e $pattern HEAD -- . ':!backend/node_modules' ':!web/node_modules' ':!mobile/build' ':!backend/coverage' 2>$null
    if ($LASTEXITCODE -eq 0 -and $files) {
      foreach ($file in $files) { $hits.Add($file) }
    } elseif ($LASTEXITCODE -gt 1) {
      throw "Secret scan failed while checking pattern $pattern"
    }

    $stagedFiles = git -C $repoRoot diff --cached --name-only "-G$pattern" 2>$null
    if ($LASTEXITCODE -eq 0 -and $stagedFiles) {
      foreach ($file in $stagedFiles) { $hits.Add("staged:$file") }
    } elseif ($LASTEXITCODE -gt 1) {
      throw "Staged secret scan failed while checking pattern $pattern"
    }
  }

  $uniqueHits = $hits | Sort-Object -Unique
  if ($uniqueHits) {
    throw "Potential secret material found in: $($uniqueHits -join ', ')"
  }
  Write-Host 'High-confidence secret scan passed.'
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
