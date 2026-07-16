# Deploy one FoodFlow web application with immutable revision metadata.
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('admin', 'restaurant')]
  [string]$App,
  [string]$Scope = $(if ($env:VERCEL_SCOPE) { $env:VERCEL_SCOPE } else { 'nguyensonbmt06-6377s-projects' }),
  [string]$Branch = 'master',
  [string]$SourceSha,
  [int]$HealthAttempts = 12,
  [int]$HealthDelaySeconds = 5,
  [switch]$PlanOnly
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

$targets = @{
  admin = @{
    Project = 'food-delivery-app'
    HealthUrl = 'https://food-delivery-app-one-liard.vercel.app/api/healthz'
    Service = 'foodflow-admin'
  }
  restaurant = @{
    Project = 'foodflow-restaurant'
    HealthUrl = 'https://foodflow-restaurant.vercel.app/api/healthz'
    Service = 'foodflow-restaurant'
  }
}

function Invoke-Native {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Command failed with exit code $LASTEXITCODE."
  }
}

Push-Location $repoRoot
try {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is required.'
  }
  if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    throw 'Vercel CLI is required.'
  }

  $head = (git rev-parse HEAD).Trim()
  if ([string]::IsNullOrWhiteSpace($SourceSha)) {
    $SourceSha = $head
  }
  if ($SourceSha -notmatch '^[0-9a-f]{40}$') {
    throw 'SourceSha must be a full lowercase 40-character commit SHA.'
  }
  if ($SourceSha -ne $head) {
    throw "SourceSha must equal the checked-out HEAD ($head)."
  }

  $target = $targets[$App]
  $deployArguments = @(
    'deploy',
    '.',
    '--prod',
    '--yes',
    '--scope',
    $Scope,
    '--build-env',
    "BUILD_SHA=$SourceSha",
    '--env',
    "BUILD_SHA=$SourceSha",
    '--meta',
    "githubCommitSha=$SourceSha",
    '--meta',
    "githubCommitRef=$Branch"
  )

  if ($PlanOnly) {
    Write-Output "Project: $($target.Project)"
    Write-Output "Source SHA: $SourceSha"
    Write-Output "Health: $($target.HealthUrl)"
    Write-Output 'PlanOnly: no Vercel state changed.'
    exit 0
  }

  if (-not [string]::IsNullOrWhiteSpace((git status --porcelain))) {
    throw 'Working tree must be clean before a production deployment.'
  }

  Invoke-Native git fetch --quiet origin $Branch
  $remoteHead = (git rev-parse "origin/$Branch").Trim()
  if ($remoteHead -ne $SourceSha) {
    throw "origin/$Branch must equal SourceSha before deployment."
  }

  Invoke-Native vercel link --project $target.Project --scope $Scope --yes
  Invoke-Native vercel @deployArguments

  for ($attempt = 1; $attempt -le $HealthAttempts; $attempt++) {
    try {
      $response = Invoke-RestMethod -Uri $target.HealthUrl -Headers @{
        'Cache-Control' = 'no-cache'
      } -TimeoutSec 20

      if (
        $response.status -eq 'ok' -and
        $response.service -eq $target.Service -and
        $response.revision -eq $SourceSha
      ) {
        Write-Output "Vercel production health verified at $SourceSha."
        exit 0
      }
    } catch {
      if ($attempt -eq $HealthAttempts) {
        throw
      }
    }

    if ($attempt -lt $HealthAttempts) {
      Start-Sleep -Seconds $HealthDelaySeconds
    }
  }

  throw "Vercel health did not report SourceSha $SourceSha."
} finally {
  Pop-Location
}
