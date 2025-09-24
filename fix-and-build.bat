@echo off
echo Fix and Build APK - Using existing dependencies with fixes...

echo Step 1: Install missing dependencies...
call npm install react-native-linear-gradient@^2.8.3
call npm install react-native-vector-icons@^10.3.0

echo Step 2: Clean previous builds...
cd android
call gradlew clean
cd ..

echo Step 3: Create assets directory...
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"

echo Step 4: Bundle JavaScript...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

echo Step 5: Build APK...
cd android
call gradlew assembleDebug --no-daemon --max-workers=1 --no-parallel

echo Step 6: Check for APK...
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
    copy "app\build\outputs\apk\debug\app-debug.apk" "..\EventMarketers-Fixed-APK.apk"
    echo APK copied to: EventMarketers-Fixed-APK.apk
) else (
    echo.
    echo ========================================
    echo ERROR: APK not found!
    echo ========================================
    echo The build may have failed.
    echo Check the logs above for errors.
)

cd ..
echo Build completed!
pause









