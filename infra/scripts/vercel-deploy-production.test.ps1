$ErrorActionPreference = 'Stop'
$modulePath = Join-Path $PSScriptRoot 'vercel-deploy-production.core.psm1'
$scriptPath = Join-Path $PSScriptRoot 'vercel-deploy-production.ps1'
Import-Module $modulePath -Force

$script:passed = 0
$script:failed = 0

function Invoke-TestCase {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Test
  )

  try {
    & $Test
    $script:passed += 1
    Write-Output "PASS $Name"
  } catch {
    $script:failed += 1
    Write-Output "FAIL $Name - $($_.Exception.Message)"
  }
}

function Assert-True {
  param([Parameter(Mandatory = $true)][bool]$Value)
  if (-not $Value) {
    throw 'Expected true.'
  }
}

function Assert-Equal {
  param(
    [Parameter(Mandatory = $true)]$Actual,
    [Parameter(Mandatory = $true)]$Expected
  )
  if ($Actual -ne $Expected) {
    throw "Expected '$Expected', received '$Actual'."
  }
}

function Assert-Throws {
  param([Parameter(Mandatory = $true)][scriptblock]$Action)
  try {
    & $Action
  } catch {
    return
  }
  throw 'Expected the action to throw.'
}

$sha = 'a' * 40
$otherSha = 'b' * 40

Invoke-TestCase 'accepts an exact lowercase HEAD SHA' {
  Assert-ReleaseSha -SourceSha $sha -HeadSha $sha
}

Invoke-TestCase 'rejects malformed, uppercase, and stale SHAs' {
  Assert-Throws { Assert-ReleaseSha -SourceSha 'abc' -HeadSha $sha }
  Assert-Throws { Assert-ReleaseSha -SourceSha ('A' * 40) -HeadSha $sha }
  Assert-Throws { Assert-ReleaseSha -SourceSha $otherSha -HeadSha $sha }
}

Invoke-TestCase 'rejects a dirty tree and a stale remote branch' {
  Assert-Throws {
    Assert-ReleaseProvenance `
      -SourceSha $sha `
      -RemoteSha $sha `
      -WorkingTreeStatus ' M tracked-file'
  }
  Assert-Throws {
    Assert-ReleaseProvenance `
      -SourceSha $sha `
      -RemoteSha $otherSha `
      -WorkingTreeStatus ''
  }
}

Invoke-TestCase 'builds immutable Vercel arguments without losing values' {
  $arguments = @(New-VercelDeployArguments `
    -SourceSha $sha `
    -Scope 'scope-name' `
    -Branch 'master')
  Assert-True ($arguments -contains "BUILD_SHA=$sha")
  Assert-True ($arguments -contains "githubCommitSha=$sha")
  Assert-True ($arguments -contains 'githubCommitRef=master')
  Assert-Equal ($arguments[0]) 'deploy'
}

Invoke-TestCase 'accepts only the expected status, service, and revision' {
  $valid = [pscustomobject]@{
    status = 'ok'
    service = 'foodflow-admin'
    revision = $sha
  }
  Assert-True (Test-ReleaseHealthResponse `
    -Response $valid `
    -ExpectedRevision $sha `
    -ExpectedService 'foodflow-admin')
  Assert-True (-not (Test-ReleaseHealthResponse `
    -Response $valid `
    -ExpectedRevision $otherSha `
    -ExpectedService 'foodflow-admin'))
  Assert-True (-not (Test-ReleaseHealthResponse `
    -Response $valid `
    -ExpectedRevision $sha `
    -ExpectedService 'foodflow-restaurant'))
  Assert-True (-not (Test-ReleaseHealthResponse `
    -Response ([pscustomobject]@{ status = 'ok' }) `
    -ExpectedRevision $sha))
  Assert-True (-not (Test-ReleaseHealthResponse `
    -Response ([pscustomobject]@{ status = 'ok'; revision = $sha }) `
    -ExpectedRevision $sha `
    -ExpectedService 'foodflow-admin'))
}

Invoke-TestCase 'propagates a native command failure' {
  $shell = if ($env:OS -eq 'Windows_NT') {
    (Get-Command powershell.exe -ErrorAction Stop).Source
  } else {
    (Get-Command pwsh -ErrorAction Stop).Source
  }
  Assert-Throws {
    Invoke-CheckedNative `
      -Command $shell `
      -Arguments @('-NoProfile', '-Command', 'exit 7')
  }
}

Invoke-TestCase 'prints both application plans without contacting Vercel' {
  $head = (git -C (Join-Path $PSScriptRoot '..\..') rev-parse HEAD).Trim()
  $adminPlan = & $scriptPath -App admin -SourceSha $head -PlanOnly | Out-String
  $restaurantPlan = & $scriptPath -App restaurant -SourceSha $head -PlanOnly | Out-String
  Assert-True ($adminPlan -match 'PlanOnly: no Vercel state changed')
  Assert-True ($restaurantPlan -match 'PlanOnly: no Vercel state changed')
  Assert-True ($adminPlan -match 'Required API revision')
}

Write-Output "RESULT passed=$script:passed failed=$script:failed"
if ($script:failed -gt 0) {
  exit 1
}
