# FoodFlow high-confidence secret scan.
# Scans tracked files and staged added lines without printing secret values.
param(
  [switch]$TrackedOnly,
  [switch]$StagedOnly
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

if ($TrackedOnly -and $StagedOnly) {
  throw 'Use either -TrackedOnly or -StagedOnly, not both.'
}

$scanTracked = -not $StagedOnly
$scanStaged = -not $TrackedOnly

$patterns = @(
  @{ Name = 'AWS access key'; Regex = 'AKIA[0-9A-Z]{16}' },
  @{ Name = 'GitHub token'; Regex = 'gh[pousr]_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{22,}' },
  @{ Name = 'Stripe live key'; Regex = 'sk_live_[0-9A-Za-z]{24,}|rk_live_[0-9A-Za-z]{24,}' },
  @{ Name = 'Slack token'; Regex = 'xox[baprs]-[0-9A-Za-z-]{10,}' },
  @{ Name = 'Google API key'; Regex = 'AIza[0-9A-Za-z_-]{35}' },
  @{ Name = 'Anthropic API key'; Regex = 'sk-ant-[A-Za-z0-9_-]{40,}' },
  @{ Name = 'OpenAI-style API key'; Regex = 'sk-[A-Za-z0-9_-]{32,}' },
  @{ Name = 'Private key'; Regex = '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----' },
  @{ Name = 'JWT token'; Regex = 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}' }
)

$pathspec = @(
  '--',
  '.',
  ':!backend/node_modules',
  ':!web/node_modules',
  ':!mobile/build',
  ':!backend/coverage',
  ':!web/coverage',
  ':!coverage',
  ':!dist',
  ':!.next',
  ':!build'
)

$hits = New-Object System.Collections.Generic.List[string]

function Add-Hit {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$PatternName,
    [Parameter(Mandatory = $true)][string]$Path
  )

  $hits.Add(('{0}: {1} in {2}' -f $Source, $PatternName, $Path)) | Out-Null
}

if ($scanTracked) {
  foreach ($pattern in $patterns) {
    $files = git -C $repoRoot grep -Il -E -e $pattern.Regex HEAD @pathspec 2>$null
    if ($LASTEXITCODE -eq 0 -and $files) {
      foreach ($file in $files) {
        Add-Hit 'tracked' $pattern.Name $file
      }
    } elseif ($LASTEXITCODE -gt 1) {
      throw "Tracked secret scan failed while checking $($pattern.Name)"
    }
  }
}

if ($scanStaged) {
  $diff = git -C $repoRoot diff --cached -U0 @pathspec
  if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read staged diff for secret scan.'
  }

  $currentPath = $null
  foreach ($line in $diff) {
    if ($line -match '^\+\+\+ b/(.+)$') {
      $currentPath = $Matches[1]
      continue
    }

    if ($line -notmatch '^\+' -or $line -match '^\+\+\+') {
      continue
    }

    foreach ($pattern in $patterns) {
      if ($line -match $pattern.Regex) {
        Add-Hit 'staged' $pattern.Name ($(if ($currentPath) { $currentPath } else { '<unknown>' }))
      }
    }
  }
}

$uniqueHits = @($hits | Sort-Object -Unique)
if ($uniqueHits.Count -gt 0) {
  Write-Error ("Potential high-confidence secret material found:`n  - " + ($uniqueHits -join "`n  - "))
  exit 1
}

Write-Output 'High-confidence tracked/staged secret scan passed.'
