param(
  [double]$WarningFreeGB = 20,
  [double]$BuildMinimumFreeGB = 10,
  [switch]$BlockBuild
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$driveName = ([System.IO.Path]::GetPathRoot($repoRoot.Path)).TrimEnd('\').TrimEnd(':')
$drive = Get-PSDrive -Name $driveName
$freeGB = [math]::Round($drive.Free / 1GB, 2)
$usedGB = [math]::Round($drive.Used / 1GB, 2)

Write-Host "Disk $driveName`: used ${usedGB} GB, free ${freeGB} GB"

if (Get-Command docker -ErrorAction SilentlyContinue) {
  Write-Host 'Docker disk usage:'
  & docker system df
  if ($LASTEXITCODE -ne 0) {
    Write-Warning 'docker system df failed; disk guard continues with filesystem capacity.'
  }
} else {
  Write-Warning 'Docker CLI unavailable; skipped docker system df.'
}

if ($freeGB -lt $WarningFreeGB) {
  Write-Warning "Free space is below the ${WarningFreeGB} GB release target."
}

if ($BlockBuild -and $freeGB -lt $BuildMinimumFreeGB) {
  throw "Build blocked: disk $driveName has ${freeGB} GB free; minimum is ${BuildMinimumFreeGB} GB."
}
