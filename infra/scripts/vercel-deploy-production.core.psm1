Set-StrictMode -Version Latest

function Assert-ReleaseSha {
  param(
    [Parameter(Mandatory = $true)][string]$SourceSha,
    [Parameter(Mandatory = $true)][string]$HeadSha
  )

  if (-not ($SourceSha -cmatch '^[0-9a-f]{40}$')) {
    throw 'SourceSha must be a full lowercase 40-character commit SHA.'
  }
  if ($SourceSha -ne $HeadSha) {
    throw "SourceSha must equal the checked-out HEAD ($HeadSha)."
  }
}

function Assert-ReleaseProvenance {
  param(
    [Parameter(Mandatory = $true)][string]$SourceSha,
    [Parameter(Mandatory = $true)][string]$RemoteSha,
    [AllowEmptyString()][string]$WorkingTreeStatus
  )

  if (-not [string]::IsNullOrWhiteSpace($WorkingTreeStatus)) {
    throw 'Working tree must be clean before a production deployment.'
  }
  if ($RemoteSha -ne $SourceSha) {
    throw "Remote branch must equal SourceSha before deployment (remote: $RemoteSha)."
  }
}

function New-VercelDeployArguments {
  param(
    [Parameter(Mandatory = $true)][string]$SourceSha,
    [Parameter(Mandatory = $true)][string]$Scope,
    [Parameter(Mandatory = $true)][string]$Branch
  )

  return @(
    'deploy'
    '.'
    '--prod'
    '--yes'
    '--scope'
    $Scope
    '--build-env'
    "BUILD_SHA=$SourceSha"
    '--env'
    "BUILD_SHA=$SourceSha"
    '--meta'
    "githubCommitSha=$SourceSha"
    '--meta'
    "githubCommitRef=$Branch"
  )
}

function Test-ReleaseHealthResponse {
  param(
    [Parameter(Mandatory = $true)]$Response,
    [Parameter(Mandatory = $true)][string]$ExpectedRevision,
    [string]$ExpectedService
  )

  if ($null -eq $Response) {
    return $false
  }

  $status = $Response.PSObject.Properties['status']
  $revision = $Response.PSObject.Properties['revision']
  if ($null -eq $status -or $status.Value -ne 'ok') {
    return $false
  }
  if ($null -eq $revision -or $revision.Value -ne $ExpectedRevision) {
    return $false
  }

  if (-not [string]::IsNullOrWhiteSpace($ExpectedService)) {
    $service = $Response.PSObject.Properties['service']
    if ($null -eq $service -or $service.Value -ne $ExpectedService) {
      return $false
    }
  }
  return $true
}

function Invoke-CheckedNative {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [string[]]$Arguments = @()
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Command failed with exit code $LASTEXITCODE."
  }
}

Export-ModuleMember -Function @(
  'Assert-ReleaseSha'
  'Assert-ReleaseProvenance'
  'New-VercelDeployArguments'
  'Test-ReleaseHealthResponse'
  'Invoke-CheckedNative'
)
