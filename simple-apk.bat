@echo off
echo Simple APK Build - Bypassing CMake issues...

echo Step 1: Create assets directory...
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"

echo Step 2: Bundle JavaScript...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

echo Step 3: Build APK...
cd android
call gradlew assembleDebug --no-daemon --max-workers=1 --no-parallel

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
    copy "app\build\outputs\apk\debug\app-debug.apk" "..\EventMarketers-Simple-APK.apk"
    echo APK copied to: EventMarketers-Simple-APK.apk
) else (
    echo ERROR: APK not found!
)

cd ..
echo Build completed!
pause











