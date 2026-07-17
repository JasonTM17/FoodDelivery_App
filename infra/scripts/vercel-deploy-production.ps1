# Deploy one FoodFlow web application with immutable revision metadata.
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('admin', 'restaurant')]
  [string]$App,
  [string]$Scope = $(if ($env:VERCEL_SCOPE) { $env:VERCEL_SCOPE } else { 'nguyensonbmt06-6377s-projects' }),
  [string]$Branch = 'master',
  [string]$SourceSha,
  [string]$ApiHealthUrl = 'https://foodflow-api-production.up.railway.app/api/healthz',
  [int]$HealthAttempts = 12,
  [int]$HealthDelaySeconds = 5,
  [switch]$PlanOnly
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Import-Module (Join-Path $PSScriptRoot 'vercel-deploy-production.core.psm1') -Force

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

Push-Location $repoRoot
try {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is required.'
  }
  $head = (git rev-parse HEAD).Trim()
  if ([string]::IsNullOrWhiteSpace($SourceSha)) {
    $SourceSha = $head
  }
  Assert-ReleaseSha -SourceSha $SourceSha -HeadSha $head

  $target = $targets[$App]
  $deployArguments = New-VercelDeployArguments `
    -SourceSha $SourceSha `
    -Scope $Scope `
    -Branch $Branch

  if ($PlanOnly) {
    Write-Output "Project: $($target.Project)"
    Write-Output "Source SHA: $SourceSha"
    Write-Output "API health: $ApiHealthUrl"
    Write-Output "Required API revision: $SourceSha"
    Write-Output "Health: $($target.HealthUrl)"
    Write-Output 'PlanOnly: no Vercel state changed.'
    return
  }

  if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    throw 'Vercel CLI is required.'
  }

  Invoke-CheckedNative -Command git -Arguments @('fetch', '--quiet', 'origin', $Branch)
  $remoteHead = (git rev-parse "origin/$Branch").Trim()
  Assert-ReleaseProvenance `
    -SourceSha $SourceSha `
    -RemoteSha $remoteHead `
    -WorkingTreeStatus (git status --porcelain | Out-String)

  $apiHealth = Invoke-RestMethod -Uri $ApiHealthUrl -Headers @{
    'Cache-Control' = 'no-cache'
  } -TimeoutSec 20
  if (-not (Test-ReleaseHealthResponse `
      -Response $apiHealth `
      -ExpectedRevision $SourceSha)) {
    throw "Railway API health must report SourceSha $SourceSha before Vercel deployment."
  }

  Invoke-CheckedNative -Command vercel -Arguments @(
    'link', '--project', $target.Project, '--scope', $Scope, '--yes'
  )
  Invoke-CheckedNative -Command vercel -Arguments $deployArguments

  for ($attempt = 1; $attempt -le $HealthAttempts; $attempt++) {
    try {
      $response = Invoke-RestMethod -Uri $target.HealthUrl -Headers @{
        'Cache-Control' = 'no-cache'
      } -TimeoutSec 20

      if (Test-ReleaseHealthResponse `
          -Response $response `
          -ExpectedRevision $SourceSha `
          -ExpectedService $target.Service) {
        Write-Output "Vercel production health verified at $SourceSha."
        return
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
