@echo off
echo Final APK Build - Complete solution...

echo Step 1: Ensure all dependencies are installed...
call npm install

echo Step 2: Clean Android build...
cd android
call gradlew clean
cd ..

echo Step 3: Create assets directory...
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"

echo Step 4: Bundle JavaScript...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

echo Step 5: Build APK with optimized settings...
cd android
call gradlew assembleDebug --no-daemon --max-workers=1 --no-parallel --stacktrace

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
    copy "app\build\outputs\apk\debug\app-debug.apk" "..\EventMarketers-Final-APK.apk"
    echo APK copied to: EventMarketers-Final-APK.apk
    echo.
    echo ========================================
    echo APK BUILD COMPLETED SUCCESSFULLY!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR: APK not found!
    echo ========================================
    echo The build may have failed.
    echo Check the logs above for errors.
    echo.
    echo Trying alternative build method...
    call gradlew assembleDebug --no-daemon --max-workers=1
)

cd ..
echo Build process completed!
pause









