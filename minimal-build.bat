@echo off
echo Minimal APK Build - Creating basic APK...

echo Step 1: Backup original package.json...
copy package.json package.json.backup

echo Step 2: Create minimal package.json with all required dependencies...
echo {> package-minimal.json
echo   "name": "EventMarketers",>> package-minimal.json
echo   "version": "0.0.1",>> package-minimal.json
echo   "private": true,>> package-minimal.json
echo   "scripts": {>> package-minimal.json
echo     "android": "react-native run-android",>> package-minimal.json
echo     "ios": "react-native run-ios",>> package-minimal.json
echo     "start": "react-native start",>> package-minimal.json
echo     "lint": "eslint .",>> package-minimal.json
echo     "test": "jest">> package-minimal.json
echo   },>> package-minimal.json
echo   "dependencies": {>> package-minimal.json
echo     "@react-native-async-storage/async-storage": "^1.24.0",>> package-minimal.json
echo     "@react-native-firebase/app": "^22.4.0",>> package-minimal.json
echo     "@react-native-firebase/auth": "^22.4.0",>> package-minimal.json
echo     "@react-native-firebase/messaging": "^22.4.0",>> package-minimal.json
echo     "@react-native-google-signin/google-signin": "^15.0.0",>> package-minimal.json
echo     "@react-native/new-app-screen": "0.80.2",>> package-minimal.json
echo     "@react-navigation/bottom-tabs": "^7.4.5",>> package-minimal.json
echo     "@react-navigation/native": "^7.1.17",>> package-minimal.json
echo     "@react-navigation/stack": "^7.4.5",>> package-minimal.json
echo     "axios": "^1.11.0",>> package-minimal.json
echo     "react": "19.1.0",>> package-minimal.json
echo     "react-native": "0.80.2",>> package-minimal.json
echo     "react-native-gesture-handler": "^2.27.2",>> package-minimal.json
echo     "react-native-image-picker": "^8.2.1",>> package-minimal.json
echo     "react-native-linear-gradient": "^2.8.3",>> package-minimal.json
echo     "react-native-otp-verify": "^1.1.8",>> package-minimal.json
echo     "react-native-permissions": "^5.4.2",>> package-minimal.json
echo     "react-native-razorpay": "^2.3.0",>> package-minimal.json
echo     "react-native-safe-area-context": "^5.5.2",>> package-minimal.json
echo     "react-native-screens": "^4.13.1",>> package-minimal.json
echo     "react-native-vector-icons": "^10.3.0">> package-minimal.json
echo   },>> package-minimal.json
echo   "devDependencies": {>> package-minimal.json
echo     "@babel/core": "^7.25.2",>> package-minimal.json
echo     "@babel/preset-env": "^7.25.3",>> package-minimal.json
echo     "@babel/runtime": "^7.25.0",>> package-minimal.json
echo     "@react-native-community/cli": "^19.1.1",>> package-minimal.json
echo     "@react-native-community/cli-platform-android": "19.1.1",>> package-minimal.json
echo     "@react-native-community/cli-platform-ios": "19.1.1",>> package-minimal.json
echo     "@react-native/babel-preset": "0.80.2",>> package-minimal.json
echo     "@react-native/eslint-config": "0.80.2",>> package-minimal.json
echo     "@react-native/metro-config": "0.80.2",>> package-minimal.json
echo     "@react-native/typescript-config": "0.80.2",>> package-minimal.json
echo     "@types/jest": "^29.5.13",>> package-minimal.json
echo     "@types/react": "^19.1.0",>> package-minimal.json
echo     "@types/react-native-vector-icons": "^6.4.18",>> package-minimal.json
echo     "@types/react-test-renderer": "^19.1.0",>> package-minimal.json
echo     "eslint": "^8.19.0",>> package-minimal.json
echo     "jest": "^29.6.3",>> package-minimal.json
echo     "prettier": "2.8.8",>> package-minimal.json
echo     "react-test-renderer": "19.1.0",>> package-minimal.json
echo     "typescript": "5.0.4">> package-minimal.json
echo   },>> package-minimal.json
echo   "engines": {>> package-minimal.json
echo     "node": ">=18">> package-minimal.json
echo   }>> package-minimal.json
echo }>> package-minimal.json

echo Step 3: Replace package.json with minimal version...
copy package-minimal.json package.json

echo Step 4: Clean and install minimal dependencies...
call npm install

echo Step 5: Create assets directory...
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"

echo Step 6: Bundle JavaScript...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

echo Step 7: Build APK...
cd android
call gradlew clean
call gradlew assembleDebug --no-daemon --max-workers=1

echo Step 8: Check for APK...
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ========================================
    echo SUCCESS! Minimal APK created!
    echo ========================================
    echo Location: app\build\outputs\apk\debug\app-debug.apk
    echo.
    dir "app\build\outputs\apk\debug\app-debug.apk"
    echo.
    echo Copying to project root...
    copy "app\build\outputs\apk\debug\app-debug.apk" "..\EventMarketers-Minimal-APK.apk"
    echo APK copied to: EventMarketers-Minimal-APK.apk
) else (
    echo ERROR: APK not found!
)

echo Step 9: Restore original package.json...
cd ..
copy package.json.backup package.json
del package-minimal.json

echo Build completed!
pause
