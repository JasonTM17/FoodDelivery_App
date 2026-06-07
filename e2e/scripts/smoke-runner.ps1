<#
.SYNOPSIS
  FoodFlow integration smoke gate — PowerShell equivalent of smoke-runner.sh.

.DESCRIPTION
  Orchestrates all test gates in order:
    0. docker compose up + health wait
    1. DB seed
    2. Playwright E2E tests
    3. k6 load test
    4. Lighthouse CI
    5. AI scenario assertions

  Exits 0 if all gates pass, 1 if any fail.

.PARAMETER SkipK6
  Skip the k6 load test gate.

.PARAMETER SkipLighthouse
  Skip the Lighthouse CI gate.

.PARAMETER SkipPlaywright
  Skip the Playwright E2E gate.

.PARAMETER SkipAiScenarios
  Skip the AI scenarios gate.

.PARAMETER ApiUrl
  Backend API base URL (default: http://localhost:3001/api).

.EXAMPLE
  .\e2e\scripts\smoke-runner.ps1
  .\e2e\scripts\smoke-runner.ps1 -SkipK6 -SkipLighthouse
#>

param(
  [switch]$SkipK6,
  [switch]$SkipLighthouse,
  [switch]$SkipPlaywright,
  [switch]$SkipAiScenarios,
  [string]$ApiUrl = ($env:API_URL ?? 'http://localhost:3001/api'),
  [string]$AdminUrl = ($env:ADMIN_URL ?? 'http://localhost:3000'),
  [string]$RestaurantUrl = ($env:RESTAURANT_URL ?? 'http://localhost:3002')
)

$ErrorActionPreference = 'Continue'  # collect failures, don't abort on first

$RepoRoot = Resolve-Path "$PSScriptRoot\..\.."
$ReportDir = "$RepoRoot\e2e\reports"
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

$AiEndpoint = $env:AI_ENDPOINT ?? "$ApiUrl/ai/chat"
$GateStatus = @{}

function Log { param([string]$Msg) Write-Host "[smoke] $Msg" }
function PassGate { param([string]$Name) $script:GateStatus[$Name] = $true; Log "PASSED: $Name" }
function FailGate { param([string]$Name) $script:GateStatus[$Name] = $false; Log "FAILED: $Name" }

# ---------------------------------------------------------------------------
# Gate 0 — Docker Compose stack
# ---------------------------------------------------------------------------
Log "=== Gate 0: Docker Compose stack ==="
Set-Location $RepoRoot
docker compose up -d postgres redis minio backend

Log "Waiting for backend health..."
$healthy = $false
for ($i = 1; $i -le 40; $i++) {
  try {
    $resp = Invoke-WebRequest -Uri "$($ApiUrl -replace '/api$','')/api/healthz" -UseBasicParsing -ErrorAction Stop
    if ($resp.StatusCode -eq 200) { Log "Backend healthy after ${i}x5s"; $healthy = $true; break }
  } catch { }
  Start-Sleep -Seconds 5
}
if (-not $healthy) { FailGate "stack_health"; Log "Backend unhealthy — aborting"; exit 1 }
PassGate "stack_health"

# ---------------------------------------------------------------------------
# Gate 1 — DB seed
# ---------------------------------------------------------------------------
Log "=== Gate 1: DB seed ==="
Push-Location "$RepoRoot\backend"
try {
  pnpm install --frozen-lockfile --silent
  pnpm db:big-seed
  PassGate "db_seed"
} catch {
  FailGate "db_seed"
  Log "DB seed failed: $_"
} finally {
  Pop-Location
}

# ---------------------------------------------------------------------------
# Gate 2 — Playwright E2E
# ---------------------------------------------------------------------------
if (-not $SkipPlaywright) {
  Log "=== Gate 2: Playwright E2E ==="
  $adminJob = Start-Job -ScriptBlock {
    param($dir) Set-Location $dir; npx next dev --port 3000
  } -ArgumentList "$RepoRoot\web\apps\admin"

  $restJob = Start-Job -ScriptBlock {
    param($dir) Set-Location $dir; npx next dev --port 3002
  } -ArgumentList "$RepoRoot\web\apps\restaurant"

  try {
    npx wait-on $AdminUrl $RestaurantUrl --timeout 90000 2>$null
    $env:CI = 'true'
    $env:ADMIN_URL = $AdminUrl
    $env:RESTAURANT_URL = $RestaurantUrl
    $env:API_URL = $ApiUrl
    Push-Location "$RepoRoot\web"
    $out = pnpm test:e2e --project=chromium --reporter=html 2>&1
    $out | Tee-Object "$ReportDir\playwright.log"
    if ($LASTEXITCODE -eq 0) { PassGate "playwright" } else { FailGate "playwright" }
    Pop-Location
  } catch {
    FailGate "playwright"
    Log "Playwright gate error: $_"
  } finally {
    Stop-Job $adminJob, $restJob -ErrorAction SilentlyContinue
    Remove-Job $adminJob, $restJob -Force -ErrorAction SilentlyContinue
  }
} else {
  Log "=== Gate 2: Playwright — SKIPPED ==="
  $GateStatus["playwright"] = $true
}

# ---------------------------------------------------------------------------
# Gate 3 — k6 load test
# ---------------------------------------------------------------------------
if (-not $SkipK6) {
  Log "=== Gate 3: k6 load test (100 RPS x 5 min) ==="
  if (Get-Command k6 -ErrorAction SilentlyContinue) {
    $k6Out = k6 run `
      --env API_URL="$ApiUrl" `
      --out "json=$ReportDir\k6-results.json" `
      "$RepoRoot\infra\loadtest\k6-mixed.js" 2>&1
    $k6Out | Tee-Object "$ReportDir\k6.log"
    if ($LASTEXITCODE -eq 0) { PassGate "k6_load" } else { FailGate "k6_load" }
  } else {
    Log "k6 not found — skipping (install: https://k6.io/docs/getting-started/installation)"
    $GateStatus["k6_load"] = $true
  }
} else {
  Log "=== Gate 3: k6 — SKIPPED ==="
  $GateStatus["k6_load"] = $true
}

# ---------------------------------------------------------------------------
# Gate 4 — Lighthouse CI
# ---------------------------------------------------------------------------
if (-not $SkipLighthouse) {
  Log "=== Gate 4: Lighthouse CI ==="
  Push-Location "$RepoRoot\web"
  try {
    $env:ADMIN_URL = $AdminUrl
    $env:RESTAURANT_URL = $RestaurantUrl
    $lhOut = npx lhci autorun --config="$RepoRoot\infra\lighthouse\lighthouserc.cjs" 2>&1
    $lhOut | Tee-Object "$ReportDir\lighthouse.log"
    if ($LASTEXITCODE -eq 0) { PassGate "lighthouse" } else { FailGate "lighthouse" }
  } catch {
    FailGate "lighthouse"; Log "Lighthouse error: $_"
  } finally {
    Pop-Location
  }
} else {
  Log "=== Gate 4: Lighthouse — SKIPPED ==="
  $GateStatus["lighthouse"] = $true
}

# ---------------------------------------------------------------------------
# Gate 5 — AI scenarios
# ---------------------------------------------------------------------------
if (-not $SkipAiScenarios) {
  Log "=== Gate 5: AI scenarios ==="
  $aiOut = npx tsx "$RepoRoot\e2e\ai-scenarios\run-ai-scenarios.ts" `
    --endpoint $AiEndpoint `
    --fixtures "$RepoRoot\e2e\ai-scenarios\canonical-conversations.json" 2>&1
  $aiOut | Tee-Object "$ReportDir\ai-scenarios.log"
  if ($LASTEXITCODE -eq 0) { PassGate "ai_scenarios" } else { FailGate "ai_scenarios" }
} else {
  Log "=== Gate 5: AI scenarios — SKIPPED ==="
  $GateStatus["ai_scenarios"] = $true
}

# ---------------------------------------------------------------------------
# Teardown
# ---------------------------------------------------------------------------
Log "Tearing down Docker Compose stack..."
docker compose down 2>$null

# ---------------------------------------------------------------------------
# Aggregate report
# ---------------------------------------------------------------------------
Log ""
Log "==============================="
Log "  SMOKE GATE SUMMARY"
Log "==============================="
$overall = $true
foreach ($gate in @('stack_health','db_seed','playwright','k6_load','lighthouse','ai_scenarios')) {
  $passed = $GateStatus[$gate] -ne $false
  $label  = if ($passed) { 'PASS' } else { 'FAIL' }
  Log "  $label  $gate"
  if (-not $passed) { $overall = $false }
}
Log "==============================="

if ($overall) {
  Log "ALL GATES PASSED — soft launch ready"
  exit 0
} else {
  Log "ONE OR MORE GATES FAILED — resolve before launch"
  exit 1
}
