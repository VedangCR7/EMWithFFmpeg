@echo off
echo Simple APK Build for EventMarketers...

echo Step 1: Clean previous builds...
cd android
call gradlew clean
cd ..

echo Step 2: Create assets directory...
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"

echo Step 3: Bundle JavaScript...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

echo Step 4: Build APK with minimal configuration...
cd android
call gradlew assembleDebug --no-daemon --max-workers=1

echo Step 5: Check for APK...
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo SUCCESS! APK created successfully!
    echo Location: app\build\outputs\apk\debug\app-debug.apk
    echo Size: 
    dir "app\build\outputs\apk\debug\app-debug.apk"
) else (
    echo ERROR: APK not found. Check the build logs above.
)

cd ..
echo Build completed!
pause

