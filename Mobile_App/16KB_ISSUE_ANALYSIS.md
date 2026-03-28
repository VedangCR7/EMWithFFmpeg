# 16 KB Page Size Issue - Library Analysis

## Summary
Your app is being rejected by Google Play Store because some native libraries (.so files) are not aligned for 16 KB memory page sizes, which is required for Android 15+ devices.

## Most Likely Problematic Libraries

### 🔴 HIGH PRIORITY - Core React Native Libraries

1. **Hermes Engine** (`libhermes.so`)
   - **Source**: React Native 0.80.2 core
   - **Issue**: May not be built with 16 KB alignment
   - **Solution**: 
     - React Native 0.80.2 may use AGP < 8.5.1
     - Need to ensure Hermes is rebuilt with 16 KB alignment
     - Or upgrade to React Native 0.81+ which has better support

2. **React Native JNI** (`libreactnativejni.so`)
   - **Source**: React Native 0.80.2 core
   - **Issue**: Core native bridge library
   - **Solution**: Same as Hermes - needs proper alignment

3. **FbJNI** (`libfbjni.so`)
   - **Source**: React Native 0.80.2 core
   - **Issue**: Facebook JNI library
   - **Solution**: Needs 16 KB alignment

4. **C++ Shared Library** (`libc++_shared.so`)
   - **Source**: React Native / NDK
   - **Issue**: C++ runtime library
   - **Solution**: Ensure NDK r28+ is used (which aligns to 16 KB by default)

### 🟡 MEDIUM PRIORITY - FFmpeg (If Used)

5. **FFmpeg Libraries** (multiple .so files)
   - **Source**: FFmpeg Kit (if using local build)
   - **Issue**: Large native libraries for video processing
   - **Solution**: 
     - Rebuild FFmpeg with 16 KB alignment flags
     - Or use a pre-built FFmpeg Kit version that supports 16 KB
   - **Note**: Check if you're using FFmpeg from the codebase

### 🟡 MEDIUM PRIORITY - Third-Party Libraries

6. **ExoPlayer Libraries** (from react-native-video)
   - **Source**: react-native-video 6.16.1
   - **Issue**: Video playback native libraries
   - **Solution**: Update to latest version or check compatibility

7. **Image Processing Libraries** (from react-native-image-crop-picker)
   - **Source**: react-native-image-crop-picker 0.51.0
   - **Issue**: Native image manipulation
   - **Solution**: Update to latest version

8. **Firebase Native Libraries**
   - **Source**: @react-native-firebase packages
   - **Issue**: Firebase SDK native components
   - **Solution**: Update to latest versions (22.4.0 should be OK, but verify)

9. **Google Sign-In Native SDK**
   - **Source**: @react-native-google-signin/google-signin 15.0.0
   - **Issue**: Google authentication native libraries
   - **Solution**: Update to latest version

10. **Razorpay Native SDK**
    - **Source**: react-native-razorpay 2.3.0
    - **Issue**: Payment gateway native libraries
    - **Solution**: Check Razorpay documentation for 16 KB support

## How to Identify the Exact Libraries

### Method 1: Use Android Studio (Recommended)
1. Open Android Studio
2. Go to `Build` > `Analyze APK...`
3. Select your AAB file: `android/app/build/outputs/bundle/release/MarketBrand.aab`
4. Navigate to `lib/` folder
5. Check each `.so` file - Android Studio will show alignment info

### Method 2: Extract and Check AAB
```bash
# Extract AAB (it's a zip file)
unzip MarketBrand.aab -d aab_extracted

# Navigate to native libraries
cd aab_extracted/BASE/lib/arm64-v8a

# List all .so files
ls -la *.so
```

### Method 3: Use bundletool
```bash
# Download bundletool from Google
# Then validate the bundle
java -jar bundletool.jar validate --bundle=MarketBrand.aab
```

## Root Cause Analysis

### Primary Issue: React Native 0.80.2
- **AGP Version**: React Native 0.80.2 likely uses AGP < 8.5.1
- **Impact**: AGP 8.5.1+ automatically aligns native libraries for 16 KB pages
- **Solution**: 
  1. Manually set AGP 8.5.1+ in `android/build.gradle`
  2. Or upgrade to React Native 0.81+ which uses newer AGP

### Secondary Issue: Native Library Versions
- Some third-party libraries may not have been updated for 16 KB support
- Need to check each library's compatibility

## Immediate Actions

### 1. Verify AGP Version
Check what AGP version is actually being used:
```bash
cd android
./gradlew app:dependencies --configuration classpath | grep "com.android.tools.build:gradle"
```

### 2. Force AGP 8.5.1+ (If Not Already)
In `android/build.gradle`, explicitly set AGP version:
```groovy
dependencies {
    classpath("com.android.tools.build:gradle:8.7.3")  // Force AGP 8.5.1+
    // ... other dependencies
}
```

### 3. Check NDK Version
Ensure NDK r28+ is used (which aligns to 16 KB by default):
```groovy
// In android/build.gradle
ndkVersion = "25.1.8937393"  // Check if this is r28+
```

### 4. Update All Native Dependencies
Update all packages to latest versions:
```bash
npm update react-native-video
npm update react-native-image-crop-picker
npm update @react-native-firebase/app
npm update @react-native-firebase/auth
npm update @react-native-firebase/messaging
# ... update all native packages
```

### 5. Rebuild with Clean
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

## Testing

### Test on 16 KB Emulator
1. Create Android 15 emulator with 16 KB page size
2. Install and test the app
3. Check for crashes or errors
4. Identify which specific libraries cause issues

## Expected Outcome

After applying fixes:
- All native libraries should be aligned to 16 KB pages
- AAB should pass Google Play Store validation
- App should work on Android 15+ devices with 16 KB page sizes

## Next Steps

1. ✅ Check AGP version (already attempted)
2. ✅ Set AGP 8.7.3 explicitly (already done)
3. ✅ Add manifest metadata (already done)
4. ✅ Set packaging options (already done)
5. ⏳ Identify specific problematic libraries (in progress)
6. ⏳ Update or rebuild problematic libraries
7. ⏳ Test on 16 KB emulator
8. ⏳ Rebuild and upload new AAB

