# 16 KB Page Size Compliance - Complete Patching Guide

## Analysis Results

Based on the AAB analysis, your app contains the following native libraries:

### Libraries Found (arm64-v8a):
1. `libc++_shared.so` - C++ standard library
2. `libdatastore_shared_counter.so` - Firebase/Google DataStore
3. `libfbjni.so` - Facebook JNI library (React Native)
4. `libhermes.so` - Hermes JavaScript engine (React Native)
5. `libhermestooling.so` - Hermes tooling library
6. `libimage_processing_util_jni.so` - Image processing (likely react-native-image-crop-picker)
7. `libimagepipeline.so` - Fresco image pipeline
8. `libjsi.so` - JavaScript Interface (React Native)
9. `libnative-filters.so` - Native filters
10. `libnative-imagetranscoder.so` - Image transcoder
11. `libreactnative.so` - React Native core
12. `librnscreens.so` - React Native Screens

## Step-by-Step Patching Plan

### Step 1: Update Android Gradle Plugin (AGP) ✅ Already Done

Your `android/build.gradle` already has:
```groovy
classpath("com.android.tools.build:gradle:8.7.3")
```

**Status**: ✅ AGP 8.5.1+ automatically aligns libraries for 16 KB pages.

### Step 2: Update NDK Version

**Current**: NDK r25 (`25.1.8937393`)  
**Required**: NDK r28+ for better 16 KB support

**Action**: Update `android/build.gradle`:

```groovy
ext {
    // ... other settings
    // NDK r28+ aligns libraries to 16 KB by default
    ndkVersion = "28.0.12674087"  // or latest r28+
}
```

**Note**: React Native 0.80.2 may have compatibility issues with NDK r28. Test thoroughly or consider upgrading React Native.

### Step 3: Add Linker Flags for Native Builds

Add the following to your `android/app/build.gradle`:

```groovy
android {
    // ... existing configuration
    
    defaultConfig {
        // ... existing config
        
        externalNativeBuild {
            cmake {
                // Add 16 KB page size support
                arguments "-DANDROID_PLATFORM=android-24"
                cppFlags "-Wl,-z,max-page-size=16384"
            }
        }
        
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a"
        }
    }
    
    // For any CMake builds
    externalNativeBuild {
        cmake {
            // Ensure 16 KB alignment
            arguments "-DCMAKE_CXX_FLAGS=-Wl,-z,max-page-size=16384"
            arguments "-DCMAKE_C_FLAGS=-Wl,-z,max-page-size=16384"
        }
    }
}
```

### Step 4: Update React Native

**Current**: React Native 0.80.2  
**Recommended**: React Native 0.81+ (better 16 KB support)

**Action**:
```bash
npm install react-native@latest
cd android
./gradlew clean
```

**Note**: This is a major upgrade. Test thoroughly and check for breaking changes.

### Step 5: Update All Native Dependencies

Update packages that include native code:

```bash
# Core React Native packages
npm update react-native-video
npm update react-native-image-crop-picker
npm update react-native-image-picker
npm update react-native-screens
npm update react-native-gesture-handler

# Firebase packages
npm update @react-native-firebase/app
npm update @react-native-firebase/auth
npm update @react-native-firebase/messaging

# Other native packages
npm update react-native-razorpay
npm update @react-native-google-signin/google-signin
npm update react-native-fs
npm update react-native-view-shot
npm update react-native-permissions
npm update @react-native-camera-roll/camera-roll
npm update react-native-share
```

### Step 6: Configure CMake for Custom Native Code

If you have any custom native code (CMakeLists.txt), add:

```cmake
# In your CMakeLists.txt
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wl,-z,max-page-size=16384")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wl,-z,max-page-size=16384")

# For each target
target_link_options(your_target PRIVATE -Wl,-z,max-page-size=16384)
```

### Step 7: Update Gradle Configuration for React Native

Add to `android/app/build.gradle`:

```groovy
android {
    // ... existing config
    
    packagingOptions {
        jniLibs {
            useLegacyPackaging = false
        }
        // ... existing pickFirst rules
        
        // Ensure proper alignment
        doNotStrip "**/*.so"
    }
    
    // Ensure 16 KB alignment in build
    buildTypes {
        release {
            // ... existing config
            
            // Add linker flags for 16 KB support
            ndk {
                debugSymbolLevel 'FULL'
            }
        }
    }
}
```

### Step 8: Rebuild and Verify

```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

Then verify using:
- Play Console Bundle Explorer
- Android Studio APK Analyzer
- The analysis scripts provided

## Specific Library Fixes

### React Native Core Libraries
- **libhermes.so**, **libreactnative.so**, **libfbjni.so**, **libjsi.so**
  - **Fix**: Upgrade React Native to 0.81+ or ensure AGP 8.5.1+ is used
  - **Status**: Should be fixed by AGP 8.7.3

### Image Processing Libraries
- **libimage_processing_util_jni.so**, **libnative-imagetranscoder.so**, **libimagepipeline.so**
  - **Fix**: Update `react-native-image-crop-picker` to latest version
  - **Action**: `npm update react-native-image-crop-picker`

### Firebase/Google Libraries
- **libdatastore_shared_counter.so**
  - **Fix**: Update Firebase packages to latest versions
  - **Action**: `npm update @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/messaging`

### React Native Screens
- **librnscreens.so**
  - **Fix**: Update `react-native-screens` to latest version
  - **Action**: `npm update react-native-screens`

## Verification Checklist

After applying fixes:

- [ ] AGP 8.5.1+ confirmed (✅ Already 8.7.3)
- [ ] NDK r28+ installed and configured
- [ ] All native dependencies updated
- [ ] Linker flags added (`-Wl,-z,max-page-size=16384`)
- [ ] Clean rebuild performed
- [ ] AAB analyzed and all libraries show 16 KB alignment
- [ ] Play Console Bundle Explorer shows compliance
- [ ] Tested on Android 15+ device/emulator

## Testing

1. **Build AAB**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. **Analyze AAB**:
   ```bash
   python analyze_elf_16kb.py <path-to-so-file>
   # Or use the PowerShell script
   .\analyze_all_libs.ps1
   ```

3. **Upload to Play Console**:
   - Upload to internal testing track
   - Check Bundle Explorer for "Memory page size compliance" section
   - Verify all libraries are compliant

4. **Test on Device**:
   - Use Android 15+ device or emulator with 16 KB page size
   - Verify app runs without crashes

## Troubleshooting

### Libraries Still Non-Compliant After Updates

1. **Check if library is pre-built**:
   - Some libraries ship pre-built binaries
   - Contact library maintainers for 16 KB support
   - Check library GitHub issues

2. **Rebuild from source**:
   - If library is open source, rebuild with 16 KB flags
   - Add `-Wl,-z,max-page-size=16384` to build configuration

3. **Use alternative library**:
   - If library doesn't support 16 KB, consider alternatives
   - Check if newer version supports it

### Build Errors After NDK Update

1. **React Native compatibility**:
   - RN 0.80.2 may not fully support NDK r28
   - Consider upgrading React Native first
   - Or stick with NDK r25 and rely on AGP 8.5.1+ alignment

2. **CMake version**:
   - Ensure CMake 3.22+ is used
   - Update in `android/build.gradle` if needed

## Expected Outcome

After applying all fixes:
- ✅ All `.so` files have LOAD segment alignment ≥ 16384 bytes
- ✅ AAB passes Play Console validation
- ✅ App works on Android 15+ devices with 16 KB page sizes
- ✅ No crashes related to page size

## Additional Resources

- [Google Play 16 KB Page Size Requirements](https://developer.android.com/guide/practices/page-sizes)
- [Android Gradle Plugin Release Notes](https://developer.android.com/build/releases/gradle-plugin)
- [NDK Release Notes](https://developer.android.com/ndk/downloads/revision_history)
- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)

