# FoodFlow production health smoke check.
# Verifies deployed API/Admin/Restaurant health endpoints without credentials.
param(
  [string]$ApiUrl = $env:API_URL,
  [string]$AdminUrl = $env:ADMIN_URL,
  [string]$RestaurantUrl = $env:RESTAURANT_URL,
  [int]$Retries = 3,
  [int]$DelaySeconds = 5,
  [int]$TimeoutSeconds = 15,
  [switch]$AllowHttp,
  [switch]$AllowLocal,
  [switch]$PlanOnly
)

$ErrorActionPreference = 'Stop'

function Resolve-HealthUrl {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$BaseUrl
  )

  if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    throw "$Name URL is required. Set API_URL, ADMIN_URL, and RESTAURANT_URL or pass -ApiUrl/-AdminUrl/-RestaurantUrl."
  }

  $trimmed = $BaseUrl.Trim().TrimEnd('/')
  $uri = [Uri]$trimmed
  $isLocal = @('localhost', '127.0.0.1', '0.0.0.0', '::1') -contains $uri.Host -or $uri.Host.EndsWith('.localhost')

  if (-not $AllowHttp -and $uri.Scheme -ne 'https') {
    throw "$Name URL must use https for production health checks. Use -AllowHttp only for local smoke checks."
  }
  if (-not $AllowLocal -and $isLocal) {
    throw "$Name URL must not point to localhost for production health checks. Use -AllowLocal only for local smoke checks."
  }

  if ($uri.AbsolutePath.EndsWith('/healthz')) {
    return $trimmed
  }

  if ($uri.AbsolutePath.EndsWith('/api')) {
    return "$trimmed/healthz"
  }

  return "$trimmed/api/healthz"
}

function Invoke-HealthProbe {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Url
  )

  $lastError = $null
  for ($attempt = 1; $attempt -le $Retries; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSeconds -UseBasicParsing -Headers @{ 'Cache-Control' = 'no-cache' }
      $statusCode = [int]$response.StatusCode
      if ($statusCode -lt 200 -or $statusCode -ge 300) {
        throw "$Name health returned HTTP $statusCode"
      }

      $json = $null
      try {
        $json = $response.Content | ConvertFrom-Json -ErrorAction Stop
      } catch {
        throw "$Name health did not return valid JSON"
      }

      if ($json.status -ne 'ok') {
        throw "$Name health status is '$($json.status)'"
      }

      Write-Output "$Name health OK: $Url"
      return
    } catch {
      $lastError = $_.Exception.Message
      if ($attempt -lt $Retries) {
        Start-Sleep -Seconds $DelaySeconds
      }
    }
  }

  throw "$Name health failed after $Retries attempt(s): $lastError"
}

$targets = @(
  @{ Name = 'API'; Url = Resolve-HealthUrl 'API' $ApiUrl },
  @{ Name = 'Admin'; Url = Resolve-HealthUrl 'Admin' $AdminUrl },
  @{ Name = 'Restaurant'; Url = Resolve-HealthUrl 'Restaurant' $RestaurantUrl }
)

Write-Output 'FoodFlow health targets:'
$targets | ForEach-Object { Write-Output "  - $($_.Name): $($_.Url)" }

if ($PlanOnly) {
  Write-Output 'PlanOnly mode: no network requests were made.'
  exit 0
}

foreach ($target in $targets) {
  Invoke-HealthProbe $target.Name $target.Url
}

Write-Output 'Production health smoke passed.'
