param(
  [string]$BaseUrl = "http://localhost:3001",
  [int]$TimeoutSec = 25,
  [int]$MinimumTrends = 431,
  [int]$MinimumContents = 70
)

$ErrorActionPreference = "Stop"

function Step($title) {
  Write-Host "`n===== $title =====" -ForegroundColor Cyan
}

function Invoke-Json($Method, $Path, $Body = $null) {
  $uri = "$BaseUrl$Path"
  if ($null -eq $Body) {
    return Invoke-RestMethod -Uri $uri -Method $Method -TimeoutSec $TimeoutSec
  }

  return Invoke-RestMethod `
    -Uri $uri `
    -Method $Method `
    -TimeoutSec $TimeoutSec `
    -ContentType "application/json" `
    -Body ($Body | ConvertTo-Json -Depth 10 -Compress)
}

function Assert($Condition, $Message) {
  if (-not $Condition) {
    throw $Message
  }
}

function Count-Items($Value) {
  if ($null -eq $Value) { return 0 }
  if ($Value -is [array]) { return $Value.Count }
  return @($Value).Count
}

function Assert-R2Url($Value, $Label) {
  Assert ($Value -match "r2\.dev") "$Label is not using R2 public URL"
}

Step "Health"
$health = Invoke-Json GET "/health"
Assert ($health.status -eq "ok") "Backend health failed"

Step "AI runtime"
$aiHealth = Invoke-Json GET "/api/ai/health"
$runtime = $aiHealth.runtime
Assert ($runtime.aiTraceProvider -eq "supabase-ai-trace") "AI trace provider must be supabase-ai-trace"
Assert ($runtime.researchLakeProvider -eq "r2-research-lake") "Research lake provider must be r2-research-lake"
Assert (($runtime.activeProvider -eq "openai") -or ($runtime.activeProvider -eq "azure_openai") -or ($runtime.activeProvider -eq "rules")) "Unexpected AI provider"

Step "Trends database"
$trends = Invoke-Json GET "/api/trends?limit=20"
Assert ($trends.sourceStatus -eq "database") "/api/trends must use database"
Assert ($trends.total -ge $MinimumTrends) "/api/trends total is below expected count"
Assert ((Count-Items $trends.data) -ge 1) "/api/trends returned no data"
foreach ($item in $trends.data) {
  Assert-R2Url $item.thumbnail "trend thumbnail"
}
$trendId = $trends.data[0].id

Step "Trending content database"
$contents = Invoke-Json GET "/api/trending-content?limit=20"
Assert ($contents.sourceStatus -eq "database") "/api/trending-content must use database"
Assert ($contents.total -ge $MinimumContents) "/api/trending-content total is below expected count"
Assert ((Count-Items $contents.data) -ge 1) "/api/trending-content returned no data"
foreach ($item in $contents.data) {
  Assert-R2Url $item.thumbnail "content thumbnail"
  Assert-R2Url $item.videoUrl "content video"
}
$contentId = $contents.data[0].id

Step "Dashboard and saturation"
$dashboardRealtime = Invoke-Json GET "/api/dashboard/realtime"
Assert ($dashboardRealtime.data.metrics) "/api/dashboard/realtime missing metrics"
Assert ($dashboardRealtime.data.sourceStatus -eq "database") "/api/dashboard/realtime must use database"

$saturation = Invoke-Json GET "/api/saturation/summary"
Assert ($saturation.data) "/api/saturation/summary missing data"
Assert ($saturation.sourceStatus -eq "database") "/api/saturation/summary must use database"

Step "Notifications"
$notifications = Invoke-Json GET "/api/notifications"
Assert ($notifications.sourceStatus -eq "database") "/api/notifications must use database"
Assert ($null -ne $notifications.data) "/api/notifications missing data"

Step "AI endpoints"
$initialRuns = Invoke-Json GET "/api/ai/runs"
$initialRunCount = Count-Items $initialRuns.data

$dashboard = Invoke-Json POST "/api/ai/insights/dashboard"
Assert ($dashboard.data.runId) "Dashboard AI response must include runId"

$trend = Invoke-Json GET "/api/ai/trends/$trendId/recommendation"
Assert ($trend.data.trend.id -eq $trendId) "Trend AI response must use selected trend"

$content = Invoke-Json GET "/api/ai/content/$contentId/analysis"
Assert ($content.data.content.id -eq $contentId) "Content AI response must use selected content"

$chat = Invoke-Json POST "/api/ai/chat" @{ message = "Berapa modal awal yang aman?"; trendId = $trendId }
Assert ($chat.data.runId) "Chat AI response must include runId"

$runs = Invoke-Json GET "/api/ai/runs"
$runCount = Count-Items $runs.data
Assert ($runCount -ge $initialRunCount) "AI runs endpoint did not return trace data"

$lake = Invoke-Json GET "/api/ai/lakehouse/summary"
Assert ($lake.data.provider -eq "r2-research-lake") "Research lake provider mismatch"
Assert ($lake.data.layers.gold.metrics) "Research lake metrics missing"

Step "Chat stream"
$chatBody = @{ message = "Berapa modal awal yang aman?"; trendId = $trendId; userId = "smoke-test" } | ConvertTo-Json -Compress
$stream = Invoke-WebRequest `
  -Uri "$BaseUrl/api/chat" `
  -Method POST `
  -TimeoutSec $TimeoutSec `
  -ContentType "application/json" `
  -Body $chatBody `
  -UseBasicParsing

Assert ($stream.StatusCode -eq 200) "/api/chat did not return HTTP 200"
Assert (($stream.Headers["Content-Type"] -join ",") -match "text/event-stream") "/api/chat is not text/event-stream"
Assert ($stream.Content -match "\[DONE\]") "/api/chat stream did not finish"
Assert ($stream.Content -notmatch '"error"') "/api/chat stream returned an error event"

Step "Source keyword scan"
$blocked = @(
  ("mo" + "ck"),
  ("dum" + "my"),
  ("pic" + "sum"),
  ("flower" + ".mp4"),
  (("de" + "mo") + "Data"),
  (("de" + "mo") + "RealtimeStore"),
  (("de" + "mo") + "LakehouseStore"),
  (("de" + "mo") + "-foundry-trace"),
  (("de" + "mo") + "-medallion"),
  ("nexo" + "-" + ("de" + "mo") + "-rules")
)
$pattern = ($blocked | ForEach-Object { [regex]::Escape($_) }) -join "|"
$scanTargets = @("app/backend/src", "app/.env.example", "app/backend/package.json")
$repoRoot = Resolve-Path "$PSScriptRoot/../../../.."
Push-Location $repoRoot
try {
  $matches = rg -n $pattern $scanTargets 2>$null
  Assert (-not $matches) "Blocked keyword found:`n$matches"
} finally {
  Pop-Location
}

Write-Host "`nALL BACKEND SMOKE TESTS PASSED" -ForegroundColor Green
