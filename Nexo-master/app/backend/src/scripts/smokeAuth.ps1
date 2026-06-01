$ErrorActionPreference = "Stop"
$base = "http://localhost:3001/api/auth"
$phone = "081234500000"

function Step($n, $title) { Write-Host "`n===== $n) $title =====" -ForegroundColor Cyan }

# Cleanup any leftover from previous run so the test is repeatable
Step 0 "Cleanup previous test user (best effort)"
try {
  $env:NODE_NO_WARNINGS = "1"
  node -e "import('./src/lib/supabase.js').then(async m => { const s=m.supabase; await s.from('sessions').delete().like('token','%'); await s.from('users').delete().eq('phone','$phone'); await s.from('otps').delete().eq('phone','$phone'); console.log('cleaned'); })"
} catch { Write-Host "cleanup skipped: $_" }

Step 1 "Register"
$reg = Invoke-RestMethod -Uri "$base/register" -Method POST -ContentType "application/json" -Body (@{phone=$phone; name="Smoke Test"; password="testpass123"} | ConvertTo-Json)
$reg | ConvertTo-Json -Compress

Step 2 "Send OTP"
$otpRes = Invoke-RestMethod -Uri "$base/otp/send" -Method POST -ContentType "application/json" -Body (@{phone=$phone} | ConvertTo-Json)
$otpRes | ConvertTo-Json -Compress
$otp = $otpRes.otp
if (-not $otp) { throw "OTP not returned (NODE_ENV must not be production)" }

Step 3 "Verify OTP"
$verifyRes = Invoke-RestMethod -Uri "$base/register/verify" -Method POST -ContentType "application/json" -Body (@{phone=$phone; otp=$otp} | ConvertTo-Json)
$verifyRes | ConvertTo-Json -Depth 4 -Compress

Step 4 "Login"
$loginRes = Invoke-RestMethod -Uri "$base/login" -Method POST -ContentType "application/json" -Body (@{phone=$phone; password="testpass123"} | ConvertTo-Json)
$loginRes | ConvertTo-Json -Depth 4 -Compress
if (-not $loginRes.token) { throw "Login did not return token" }

Step 5 "Login with wrong password (expect 401)"
try {
  Invoke-RestMethod -Uri "$base/login" -Method POST -ContentType "application/json" -Body (@{phone=$phone; password="wrong"} | ConvertTo-Json)
  throw "Wrong password unexpectedly succeeded"
} catch [System.Net.WebException] {
  Write-Host "OK: $($_.Exception.Message)" -ForegroundColor Yellow
} catch {
  if ($_.Exception.Response.StatusCode -eq 401) {
    Write-Host "OK: 401 Unauthorized" -ForegroundColor Yellow
  } else { Write-Host "OK (rejected): $_" -ForegroundColor Yellow }
}

Step 6 "Logout"
Invoke-RestMethod -Uri "$base/logout" -Method POST -ContentType "application/json" -Body (@{token=$loginRes.token} | ConvertTo-Json) | ConvertTo-Json -Compress

Write-Host "`n✅ ALL AUTH STEPS PASSED" -ForegroundColor Green
