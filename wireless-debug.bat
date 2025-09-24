@echo off
echo ========================================
echo    Wireless Debugging Setup Script
echo ========================================
echo.

echo Checking ADB availability...
adb version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: ADB is not available. Please install Android SDK and add it to PATH.
    pause
    exit /b 1
)

echo ADB is available.
echo.

echo Step 1: Enable Wireless Debugging on your Android device
echo - Go to Settings > Developer Options > Wireless Debugging
echo - Enable Wireless Debugging
echo - Note the IP address and port shown
echo.

echo Step 2: Connect your device via USB first (if not already connected)
echo Checking for connected devices...
adb devices

echo.
echo Step 3: Enable TCP/IP mode
echo Please enter the IP address and port from your device (e.g., 192.168.1.100:5555):
set /p device_ip_port=

if "%device_ip_port%"=="" (
    echo No IP address provided. Exiting.
    pause
    exit /b 1
)

echo.
echo Step 4: Connecting to device via wireless debugging...
adb tcpip 5555
timeout /t 3 /nobreak >nul

echo Connecting to %device_ip_port%...
adb connect %device_ip_port%

echo.
echo Step 5: Verifying wireless connection...
adb devices

echo.
echo Step 6: Starting Metro bundler...
echo Starting Metro bundler in background...
start "Metro Bundler" cmd /k "npm start"

echo.
echo Step 7: Running the Android app...
echo Waiting 5 seconds for Metro to start...
timeout /t 5 /nobreak >nul

echo Running Android app...
npm run android

echo.
echo Wireless debugging setup complete!
echo You can now disconnect your USB cable.
echo.
pause
