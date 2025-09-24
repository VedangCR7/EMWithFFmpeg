Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Wireless Debugging Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking ADB availability..." -ForegroundColor Yellow
try {
    $adbVersion = adb version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "ADB is available." -ForegroundColor Green
    } else {
        throw "ADB not found"
    }
} catch {
    Write-Host "ERROR: ADB is not available. Please install Android SDK and add it to PATH." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 1: Enable Wireless Debugging on your Android device" -ForegroundColor Yellow
Write-Host "- Go to Settings > Developer Options > Wireless Debugging" -ForegroundColor White
Write-Host "- Enable Wireless Debugging" -ForegroundColor White
Write-Host "- Note the IP address and port shown" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Connect your device via USB first (if not already connected)" -ForegroundColor Yellow
Write-Host "Checking for connected devices..." -ForegroundColor White
adb devices

Write-Host ""
Write-Host "Step 3: Enable TCP/IP mode" -ForegroundColor Yellow
$deviceIpPort = Read-Host "Please enter the IP address and port from your device (e.g., 192.168.1.100:5555)"

if ([string]::IsNullOrEmpty($deviceIpPort)) {
    Write-Host "No IP address provided. Exiting." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 4: Connecting to device via wireless debugging..." -ForegroundColor Yellow
Write-Host "Enabling TCP/IP mode..." -ForegroundColor White
adb tcpip 5555
Start-Sleep -Seconds 3

Write-Host "Connecting to $deviceIpPort..." -ForegroundColor White
adb connect $deviceIpPort

Write-Host ""
Write-Host "Step 5: Verifying wireless connection..." -ForegroundColor Yellow
adb devices

Write-Host ""
Write-Host "Step 6: Starting Metro bundler..." -ForegroundColor Yellow
Write-Host "Starting Metro bundler in background..." -ForegroundColor White
Start-Process -FilePath "cmd" -ArgumentList "/k", "npm start" -WindowStyle Minimized

Write-Host ""
Write-Host "Step 7: Running the Android app..." -ForegroundColor Yellow
Write-Host "Waiting 5 seconds for Metro to start..." -ForegroundColor White
Start-Sleep -Seconds 5

Write-Host "Running Android app..." -ForegroundColor White
npm run android

Write-Host ""
Write-Host "Wireless debugging setup complete!" -ForegroundColor Green
Write-Host "You can now disconnect your USB cable." -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
