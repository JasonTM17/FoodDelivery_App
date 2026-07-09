# FoodFlow post-deploy production smoke checks.
# Verifies promoted API/Admin/Restaurant deployments plus authenticated Batch 4
# contracts without storing or printing bearer tokens.
param(
  [string]$ApiUrl = $env:API_URL,
  [string]$AdminUrl = $env:ADMIN_URL,
  [string]$RestaurantUrl = $env:RESTAURANT_URL,
  [string]$AdminToken = $env:FOODFLOW_ADMIN_TOKEN,
  [string]$CustomerToken = $env:FOODFLOW_CUSTOMER_TOKEN,
  [string]$RestaurantToken = $env:FOODFLOW_RESTAURANT_TOKEN,
  [string]$DriverToken = $env:FOODFLOW_DRIVER_TOKEN,
  [string]$SmokeOrderId = $env:FOODFLOW_SMOKE_ORDER_ID,
  [string]$SmokeRestaurantId = $env:FOODFLOW_SMOKE_RESTAURANT_ID,
  [string]$Locale = $(if ($env:FOODFLOW_SMOKE_LOCALE) { $env:FOODFLOW_SMOKE_LOCALE } else { 'vi' }),
  [int]$TimeoutSeconds = 20,
  [switch]$AllowHttp,
  [switch]$AllowLocal,
  [switch]$AllowDegradedAi,
  [switch]$CreateExportJob,
  [switch]$RequireAuthenticatedChecks,
  [switch]$RequireRoutePolyline,
  [switch]$SkipHealth,
  [switch]$PlanOnly
)

$ErrorActionPreference = 'Stop'

function Test-HasValue {
  param([AllowNull()][string]$Value)
  return -not [string]::IsNullOrWhiteSpace($Value)
}

function Assert-UrlAllowed {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Url
  )

  if ([string]::IsNullOrWhiteSpace($Url)) {
    throw "$Name URL is required. Set API_URL, ADMIN_URL, and RESTAURANT_URL or pass -ApiUrl/-AdminUrl/-RestaurantUrl."
  }

  $uri = [Uri]$Url
  $isLocal = @('localhost', '127.0.0.1', '0.0.0.0', '::1') -contains $uri.Host -or $uri.Host.EndsWith('.localhost')

  if (-not $AllowHttp -and $uri.Scheme -ne 'https') {
    throw "$Name URL must use https for production smoke checks. Use -AllowHttp only for local smoke checks."
  }
  if (-not $AllowLocal -and $isLocal) {
    throw "$Name URL must not point to localhost for production smoke checks. Use -AllowLocal only for local smoke checks."
  }
}

function Join-FoodFlowUrl {
  param(
    [Parameter(Mandatory = $true)][string]$Base,
    [Parameter(Mandatory = $true)][string]$Path
  )

  return "$($Base.TrimEnd('/'))/$($Path.TrimStart('/'))"
}

function Resolve-ApiBaseUrl {
  param([Parameter(Mandatory = $true)][string]$BaseUrl)

  $trimmed = $BaseUrl.Trim().TrimEnd('/')
  Assert-UrlAllowed 'API' $trimmed
  $uri = [Uri]$trimmed
  if ($uri.AbsolutePath.EndsWith('/api')) {
    return $trimmed
  }
  if ($uri.AbsolutePath.EndsWith('/api/healthz')) {
    return $trimmed.Substring(0, $trimmed.Length - '/healthz'.Length)
  }
  return "$trimmed/api"
}

function Resolve-WebBaseUrl {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$BaseUrl
  )

  $trimmed = $BaseUrl.Trim().TrimEnd('/')
  Assert-UrlAllowed $Name $trimmed
  return $trimmed
}

function Get-PropertyNames {
  param([AllowNull()]$Value)
  if ($null -eq $Value) { return @() }
  return @($Value.PSObject.Properties | ForEach-Object { $_.Name })
}

function Test-HasProperty {
  param(
    [AllowNull()]$Value,
    [Parameter(Mandatory = $true)][string]$Name
  )
  return (Get-PropertyNames $Value) -contains $Name
}

function Unwrap-FoodFlowEnvelope {
  param(
    [AllowNull()]$Payload,
    [Parameter(Mandatory = $true)][string]$Name
  )

  if ($null -eq $Payload) {
    throw "$Name returned an empty JSON body."
  }

  if (Test-HasProperty $Payload 'success') {
    if ($Payload.success -ne $true) {
      throw "$Name returned success=false."
    }
    if (Test-HasProperty $Payload 'data') {
      return $Payload.data
    }
  }

  return $Payload
}

function Invoke-JsonRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Url,
    [hashtable]$Headers = @{},
    [AllowNull()]$Body = $null
  )

  $request = @{
    Uri = $Url
    Method = $Method
    TimeoutSec = $TimeoutSeconds
    Headers = $Headers
  }

  if ($null -ne $Body) {
    $request.Body = ($Body | ConvertTo-Json -Depth 8)
    $request.ContentType = 'application/json'
  }

  $response = Invoke-WebRequest @request
  $statusCode = [int]$response.StatusCode
  if ($statusCode -lt 200 -or $statusCode -ge 300) {
    throw "$Name returned HTTP $statusCode."
  }

  if ([string]::IsNullOrWhiteSpace($response.Content)) {
    return $null
  }

  try {
    return $response.Content | ConvertFrom-Json -ErrorAction Stop
  } catch {
    throw "$Name did not return valid JSON."
  }
}

function Invoke-PageRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Url
  )

  $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSeconds -Headers @{ 'Cache-Control' = 'no-cache' }
  $statusCode = [int]$response.StatusCode
  if ($statusCode -lt 200 -or $statusCode -ge 300) {
    throw "$Name returned HTTP $statusCode."
  }

  $content = [string]$response.Content
  if (
    $content -match '404:\s*NOT_FOUND' -or
    $content -match 'The page could not be found' -or
    $content -match 'This page could not be found'
  ) {
    throw "$Name rendered a Vercel/Next.js 404 shell."
  }
}

function Get-BearerHeaders {
  param([Parameter(Mandatory = $true)][string]$Token)
  return @{ Authorization = "Bearer $Token" }
}

function Skip-Or-Fail {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Reason
  )

  if ($RequireAuthenticatedChecks) {
    throw "$Name cannot run: $Reason"
  }
  Write-Output "SKIP ${Name}: $Reason"
}

function Assert-StringInSet {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [AllowNull()]$Value,
    [Parameter(Mandatory = $true)][string[]]$Allowed
  )

  if ($Allowed -notcontains [string]$Value) {
    throw "$Name returned unexpected value '$Value'."
  }
}

function Invoke-HealthCheck {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$HealthUrl
  )

  $payload = Invoke-JsonRequest "$Name health" 'GET' $HealthUrl
  if ($payload.status -ne 'ok') {
    throw "$Name health status is '$($payload.status)'."
  }
  Write-Output "OK $Name health"
}

function Invoke-RealtimeTokenCheck {
  param([Parameter(Mandatory = $true)][string]$ApiBase)

  $token = $null
  $body = @{}
  $actor = $null

  if ((Test-HasValue $RestaurantToken) -and (Test-HasValue $SmokeRestaurantId)) {
    $token = $RestaurantToken
    $actor = 'restaurant'
    $body.restaurantId = $SmokeRestaurantId
    if (Test-HasValue $SmokeOrderId) { $body.orderId = $SmokeOrderId }
  } elseif (Test-HasValue $CustomerToken) {
    $token = $CustomerToken
    $actor = 'customer'
    if (Test-HasValue $SmokeOrderId) { $body.orderId = $SmokeOrderId }
  } elseif (Test-HasValue $AdminToken) {
    $token = $AdminToken
    $actor = 'admin'
    if (Test-HasValue $SmokeOrderId) { $body.orderId = $SmokeOrderId }
  } elseif (Test-HasValue $DriverToken) {
    $token = $DriverToken
    $actor = 'driver'
    if (Test-HasValue $SmokeOrderId) { $body.orderId = $SmokeOrderId }
  }

  if (-not (Test-HasValue $token)) {
    Skip-Or-Fail 'Realtime token' 'set one of FOODFLOW_CUSTOMER_TOKEN, FOODFLOW_ADMIN_TOKEN, FOODFLOW_RESTAURANT_TOKEN, or FOODFLOW_DRIVER_TOKEN'
    return
  }

  $payload = Invoke-JsonRequest 'Realtime token' 'POST' (Join-FoodFlowUrl $ApiBase '/realtime/token') (Get-BearerHeaders $token) $body
  $data = Unwrap-FoodFlowEnvelope $payload 'Realtime token'

  if ($data.provider -ne 'supabase') {
    throw "Realtime token provider is '$($data.provider)', expected 'supabase'."
  }
  if (-not (Test-HasValue $data.token)) {
    throw 'Realtime token response did not include a token.'
  }
  if ($null -eq $data.channels -or @($data.channels).Count -lt 1) {
    throw 'Realtime token response did not include authorized channels.'
  }
  foreach ($channel in @($data.channels)) {
    if ([string]$channel -notlike 'private:*') {
      throw "Realtime token exposed a non-private channel '$channel'."
    }
  }

  Write-Output "OK Realtime token ($actor, $(@($data.channels).Count) private channel(s))"
}

function Invoke-AiChatCheck {
  param([Parameter(Mandatory = $true)][string]$ApiBase)

  $token = if (Test-HasValue $CustomerToken) { $CustomerToken } elseif (Test-HasValue $AdminToken) { $AdminToken } else { $null }
  if (-not (Test-HasValue $token)) {
    Skip-Or-Fail 'AI chatbot' 'set FOODFLOW_CUSTOMER_TOKEN or FOODFLOW_ADMIN_TOKEN'
    return
  }

  $body = @{
    message = 'My delivery is late and I need FoodFlow support.'
    sessionId = "prod-smoke-ai-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
  }
  if (Test-HasValue $SmokeOrderId) {
    $body.orderId = $SmokeOrderId
  }

  $payload = Invoke-JsonRequest 'AI chatbot' 'POST' (Join-FoodFlowUrl $ApiBase '/ai/chat') (Get-BearerHeaders $token) $body
  $data = Unwrap-FoodFlowEnvelope $payload 'AI chatbot'

  if (-not (Test-HasValue $data.reply)) {
    throw 'AI chatbot returned an empty reply.'
  }
  Assert-StringInSet 'AI chatbot action' $data.action @('answered', 'escalated', 'degraded')
  if ($data.action -eq 'degraded' -and -not $AllowDegradedAi) {
    throw 'AI chatbot returned degraded. Rotate/configure DEEPSEEK_API_KEY or pass -AllowDegradedAi only for non-production drills.'
  }

  Write-Output "OK AI chatbot ($($data.action))"
}

function Invoke-AdminExportCheck {
  param([Parameter(Mandatory = $true)][string]$ApiBase)

  if (-not (Test-HasValue $AdminToken)) {
    Skip-Or-Fail 'Admin export' 'set FOODFLOW_ADMIN_TOKEN'
    return
  }

  $payload = Invoke-JsonRequest 'Admin export list' 'GET' (Join-FoodFlowUrl $ApiBase '/admin/exports?limit=5') (Get-BearerHeaders $AdminToken)
  $data = Unwrap-FoodFlowEnvelope $payload 'Admin export list'
  if (-not (Test-HasProperty $data 'jobs')) {
    throw 'Admin export list did not return a jobs array.'
  }

  $createdJob = $null
  if ($CreateExportJob) {
    $createBody = @{
      resource = 'audit_logs'
      format = 'csv'
      dateFrom = '2026-07-01'
      dateTo = '2026-07-02'
    }
    $createPayload = Invoke-JsonRequest 'Admin export create' 'POST' (Join-FoodFlowUrl $ApiBase '/admin/exports') (Get-BearerHeaders $AdminToken) $createBody
    $createdJob = Unwrap-FoodFlowEnvelope $createPayload 'Admin export create'
    if ($createdJob.status -ne 'completed' -or $createdJob.progress -ne 100) {
      throw "Admin export create returned status '$($createdJob.status)' progress '$($createdJob.progress)'."
    }
    if (-not (Test-HasValue $createdJob.downloadUrl)) {
      throw 'Admin export create did not return a downloadUrl.'
    }
  }

  if ($null -ne $createdJob) {
    Write-Output "OK Admin export (listed and created $($createdJob.format) job)"
  } else {
    Write-Output "OK Admin export (list contract)"
  }
}

function Invoke-TrackingCheck {
  param([Parameter(Mandatory = $true)][string]$ApiBase)

  if (-not (Test-HasValue $SmokeOrderId)) {
    Skip-Or-Fail 'Tracking map route' 'set FOODFLOW_SMOKE_ORDER_ID'
    return
  }

  $token = if (Test-HasValue $CustomerToken) {
    $CustomerToken
  } elseif (Test-HasValue $DriverToken) {
    $DriverToken
  } elseif (Test-HasValue $RestaurantToken) {
    $RestaurantToken
  } elseif (Test-HasValue $AdminToken) {
    $AdminToken
  } else {
    $null
  }

  if (-not (Test-HasValue $token)) {
    Skip-Or-Fail 'Tracking map route' 'set an order participant token or FOODFLOW_ADMIN_TOKEN'
    return
  }

  $trackingUrl = Join-FoodFlowUrl $ApiBase "/orders/$SmokeOrderId/tracking"
  $payload = Invoke-JsonRequest 'Tracking map route' 'GET' $trackingUrl (Get-BearerHeaders $token)
  $data = Unwrap-FoodFlowEnvelope $payload 'Tracking map route'

  if ($data.orderId -ne $SmokeOrderId) {
    throw "Tracking map route returned orderId '$($data.orderId)', expected '$SmokeOrderId'."
  }
  Assert-StringInSet 'Tracking routePhase' $data.routePhase @('pickup', 'dropoff')
  foreach ($field in @('status', 'driverLocation', 'etaMinutes', 'routePolyline')) {
    if (-not (Test-HasProperty $data $field)) {
      throw "Tracking map route is missing '$field'."
    }
  }
  if ($RequireRoutePolyline -and -not (Test-HasValue $data.routePolyline)) {
    throw 'Tracking map route did not include routePolyline. Use a smoke order with assigned driver/provider route geometry.'
  }

  Write-Output "OK Tracking map route ($($data.routePhase), routePolyline=$([bool](Test-HasValue $data.routePolyline)))"
}

$apiBase = Resolve-ApiBaseUrl $ApiUrl
$adminBase = Resolve-WebBaseUrl 'Admin' $AdminUrl
$restaurantBase = Resolve-WebBaseUrl 'Restaurant' $RestaurantUrl

$targets = @(
  @{ Name = 'API health'; Url = Join-FoodFlowUrl $apiBase '/healthz' },
  @{ Name = 'Admin health'; Url = Join-FoodFlowUrl $adminBase '/api/healthz' },
  @{ Name = 'Restaurant health'; Url = Join-FoodFlowUrl $restaurantBase '/api/healthz' },
  @{ Name = 'Admin login page'; Url = Join-FoodFlowUrl $adminBase "/$Locale/login" },
  @{ Name = 'Restaurant login page'; Url = Join-FoodFlowUrl $restaurantBase "/$Locale/login" },
  @{ Name = 'Realtime token'; Url = Join-FoodFlowUrl $apiBase '/realtime/token' },
  @{ Name = 'AI chatbot'; Url = Join-FoodFlowUrl $apiBase '/ai/chat' },
  @{ Name = 'Admin exports'; Url = Join-FoodFlowUrl $apiBase '/admin/exports?limit=5' },
  @{ Name = 'Tracking map route'; Url = if (Test-HasValue $SmokeOrderId) { Join-FoodFlowUrl $apiBase "/orders/$SmokeOrderId/tracking" } else { Join-FoodFlowUrl $apiBase '/orders/<FOODFLOW_SMOKE_ORDER_ID>/tracking' } }
)

Write-Output 'FoodFlow post-deploy smoke targets:'
$targets | ForEach-Object { Write-Output "  - $($_.Name): $($_.Url)" }
Write-Output 'Authenticated checks read bearer tokens only from FOODFLOW_*_TOKEN environment variables and never print them.'

if ($PlanOnly) {
  Write-Output 'PlanOnly mode: no network requests were made.'
  exit 0
}

if (-not $SkipHealth) {
  Invoke-HealthCheck 'API' (Join-FoodFlowUrl $apiBase '/healthz')
  Invoke-HealthCheck 'Admin' (Join-FoodFlowUrl $adminBase '/api/healthz')
  Invoke-HealthCheck 'Restaurant' (Join-FoodFlowUrl $restaurantBase '/api/healthz')
}

Invoke-PageRequest 'Admin login page' (Join-FoodFlowUrl $adminBase "/$Locale/login")
Write-Output 'OK Admin login page'
Invoke-PageRequest 'Restaurant login page' (Join-FoodFlowUrl $restaurantBase "/$Locale/login")
Write-Output 'OK Restaurant login page'

Invoke-RealtimeTokenCheck $apiBase
Invoke-AiChatCheck $apiBase
Invoke-AdminExportCheck $apiBase
Invoke-TrackingCheck $apiBase

Write-Output 'FoodFlow post-deploy smoke passed.'
