# Native Libraries Analysis for 16 KB Page Size Support

## Overview
This document identifies all native libraries in the app that may be causing the "16 KB memory page size" error from Google Play Store.

## Packages with Native Libraries

### Core React Native
- **react-native (0.80.2)**
  - Includes: Hermes engine, JSC, FbJNI, React Native JNI
  - **Issue**: React Native 0.80.2 may use AGP < 8.5.1 which doesn't auto-align libraries
  - **Status**: ⚠️ POTENTIAL ISSUE

### Media & Video Processing
- **react-native-video (6.16.1)**
  - Uses ExoPlayer native libraries
  - **Status**: ⚠️ CHECK COMPATIBILITY

- **FFmpeg Kit** (if used locally)
  - Large native libraries for video processing
  - **Status**: ⚠️ HIGH RISK - May not be 16 KB aligned

### Image Processing
- **react-native-image-crop-picker (0.51.0)**
  - Native image processing libraries
  - **Status**: ⚠️ CHECK COMPATIBILITY

- **react-native-image-picker (8.2.1)**
  - Native camera/gallery access
  - **Status**: ⚠️ CHECK COMPATIBILITY

### File System
- **react-native-fs (2.20.0)**
  - Native file system operations
  - **Status**: ⚠️ CHECK COMPATIBILITY

### UI & Gestures
- **react-native-gesture-handler (2.27.2)**
  - Native gesture recognition
  - **Status**: ⚠️ CHECK COMPATIBILITY

- **react-native-screens (4.13.1)**
  - Native screen management
  - **Status**: ⚠️ CHECK COMPATIBILITY

- **react-native-linear-gradient (2.8.3)**
  - Native gradient rendering
  - **Status**: ⚠️ CHECK COMPATIBILITY

### Payment & Authentication
- **react-native-razorpay (2.3.0)**
  - Payment gateway native SDK
  - **Status**: ⚠️ CHECK COMPATIBILITY

- **@react-native-google-signin/google-signin (15.0.0)**
  - Google Sign-In native SDK
  - **Status**: ⚠️ CHECK COMPATIBILITY

### Firebase
- **@react-native-firebase/app (22.4.0)**
  - Firebase native libraries
  - **Status**: ⚠️ CHECK COMPATIBILITY

- **@react-native-firebase/auth (22.4.0)**
  - Firebase Auth native
  - **Status**: ⚠️ CHECK COMPATIBILITY

- **@react-native-firebase/messaging (22.4.0)**
  - Firebase Messaging native
  - **Status**: ⚠️ CHECK COMPATIBILITY

### Other Native Libraries
- **react-native-view-shot (4.0.3)**
  - Native screenshot capture
  - **Status**: ⚠️ CHECK COMPATIBILITY

- **react-native-permissions (5.4.2)**
  - Native permissions handling
  - **Status**: ⚠️ CHECK COMPATIBILITY

- **@react-native-camera-roll/camera-roll (7.10.2)**
  - Native media access
  - **Status**: ⚠️ CHECK COMPATIBILITY

- **react-native-share (12.2.1)**
  - Native sharing functionality
  - **Status**: ⚠️ CHECK COMPATIBILITY

## Most Likely Culprits

### 1. React Native Core (HIGH PRIORITY)
- **Issue**: React Native 0.80.2 may not use AGP 8.5.1+
- **Solution**: 
  - Check actual AGP version being used
  - Consider upgrading to React Native 0.81+ which has better 16 KB support
  - Or manually ensure AGP 8.5.1+ is used

### 2. FFmpeg Kit (HIGH PRIORITY)
- **Issue**: If using local FFmpeg build, it may not be 16 KB aligned
- **Solution**:
  - Rebuild FFmpeg with 16 KB alignment
  - Or use a pre-built FFmpeg Kit version that supports 16 KB pages

### 3. Hermes Engine (MEDIUM PRIORITY)
- **Issue**: Hermes needs to be built with 16 KB alignment
- **Solution**: Ensure Hermes is built with proper alignment flags

### 4. Third-party Native Libraries (MEDIUM PRIORITY)
- **Issue**: Older versions may not support 16 KB pages
- **Solution**: Update all native packages to latest versions

## How to Identify Specific Libraries

### Method 1: Analyze AAB with Android Studio
1. Open Android Studio
2. Go to `Build` > `Analyze APK`
3. Open your AAB file
4. Check the `lib` directory for native libraries (.so files)
5. Look for libraries that are not 16 KB aligned

### Method 2: Use bundletool
```bash
java -jar bundletool.jar validate --bundle=MarketBrand.aab
```

### Method 3: Check Build Output
```bash
cd android
./gradlew app:dependencies > deps.txt
```
Then search for native libraries in the dependencies.

## Recommendations

1. **Verify AGP Version**
   - Check what AGP version React Native 0.80.2 actually uses
   - If < 8.5.1, manually set AGP 8.5.1+ in build.gradle

2. **Update React Native**
   - Consider upgrading to React Native 0.81+ or later
   - Newer versions have better 16 KB page size support

3. **Check FFmpeg**
   - If using FFmpeg, ensure it's built with 16 KB alignment
   - Or switch to a version that supports 16 KB pages

4. **Update Dependencies**
   - Update all native packages to their latest versions
   - Check each library's release notes for 16 KB support

5. **Test on 16 KB Emulator**
   - Use Android Emulator with 16 KB page size system image
   - Test the app to identify which libraries cause crashes

6. **Contact Library Maintainers**
   - If a library doesn't support 16 KB pages, contact the maintainers
   - Check GitHub issues for 16 KB support status

## Next Steps

1. Check the actual AGP version being used
2. Identify which specific .so files are causing issues
3. Update or replace problematic libraries
4. Rebuild and test on 16 KB emulator
5. Upload new AAB to Play Store

