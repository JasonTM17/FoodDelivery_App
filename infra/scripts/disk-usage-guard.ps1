param(
  [double]$WarningFreeGB = 20,
  [double]$BuildMinimumFreeGB = 10,
  [double]$SystemDriveWarningFreeGB = 10,
  [double]$SystemDriveBuildMinimumFreeGB = 5,
  [switch]$BlockBuild
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$driveName = ([System.IO.Path]::GetPathRoot($repoRoot.Path)).TrimEnd('\').TrimEnd(':')
$systemDriveName = $env:SystemDrive.TrimEnd('\').TrimEnd(':')

function Get-DriveSnapshot {
  param([Parameter(Mandatory = $true)][string]$Name)

  $drive = Get-PSDrive -Name $Name
  return [pscustomobject]@{
    Name = $Name
    FreeGB = [math]::Round($drive.Free / 1GB, 2)
    UsedGB = [math]::Round($drive.Used / 1GB, 2)
  }
}

$repoDrive = Get-DriveSnapshot -Name $driveName
$systemDrive = if ($systemDriveName -eq $driveName) { $repoDrive } else { Get-DriveSnapshot -Name $systemDriveName }

Write-Host "Repository disk $($repoDrive.Name): used $($repoDrive.UsedGB) GB, free $($repoDrive.FreeGB) GB"
if ($systemDrive.Name -ne $repoDrive.Name) {
  Write-Host "System/temp disk $($systemDrive.Name): used $($systemDrive.UsedGB) GB, free $($systemDrive.FreeGB) GB"
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
  Write-Host 'Docker disk usage:'
  & docker system df
  if ($LASTEXITCODE -ne 0) {
    Write-Warning 'docker system df failed; disk guard continues with filesystem capacity.'
  }
} else {
  Write-Warning 'Docker CLI unavailable; skipped docker system df.'
}

if ($repoDrive.FreeGB -lt $WarningFreeGB) {
  Write-Warning "Repository disk free space is below the ${WarningFreeGB} GB release target."
}

if ($systemDrive.Name -ne $repoDrive.Name -and $systemDrive.FreeGB -lt $SystemDriveWarningFreeGB) {
  Write-Warning "System/temp disk free space is below the ${SystemDriveWarningFreeGB} GB safety target."
}

if ($BlockBuild -and $repoDrive.FreeGB -lt $BuildMinimumFreeGB) {
  throw "Build blocked: repository disk $driveName has $($repoDrive.FreeGB) GB free; minimum is ${BuildMinimumFreeGB} GB."
}

if ($BlockBuild -and ($systemDrive.Name -ne $repoDrive.Name) -and ($systemDrive.FreeGB -lt $SystemDriveBuildMinimumFreeGB)) {
  throw "Build blocked: system/temp disk $systemDriveName has $($systemDrive.FreeGB) GB free; minimum is ${SystemDriveBuildMinimumFreeGB} GB."
}
