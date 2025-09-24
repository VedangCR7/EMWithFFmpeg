@echo off
echo Quick APK Build - Avoiding 65%% hang issue...

echo Step 1: Create assets directory...
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"

echo Step 2: Bundle JavaScript...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

echo Step 3: Build APK with timeout protection...
cd android
timeout /t 300 /nobreak > nul & call gradlew assembleDebug --no-daemon --max-workers=1 --no-parallel --stacktrace

echo Step 4: Check for APK...
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ========================================
    echo SUCCESS! APK created successfully!
    echo ========================================
    echo Location: app\build\outputs\apk\debug\app-debug.apk
    echo.
    dir "app\build\outputs\apk\debug\app-debug.apk"
    echo.
    echo Copying to project root...
    copy "app\build\outputs\apk\debug\app-debug.apk" "..\EventMarketers-Quick-APK.apk"
    echo APK copied to: EventMarketers-Quick-APK.apk
) else (
    echo.
    echo ========================================
    echo ERROR: APK not found!
    echo ========================================
    echo The build may have timed out or failed.
    echo Trying alternative build method...
    call gradlew assembleDebug --no-daemon --max-workers=1 --no-parallel
)

cd ..
echo Build completed!
pause










