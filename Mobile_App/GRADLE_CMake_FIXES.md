# Gradle and CMake Configuration Fixes for 16 KB Compliance

## Current Status

✅ **11 out of 12 libraries are compliant** (91.7%)  
❌ **1 library needs updating**: `librnscreens.so` (react-native-screens)

## Required Changes

### 1. Update react-native-screens (IMMEDIATE FIX)

**Action**: Update the package
```bash
npm update react-native-screens
# Or
npm install react-native-screens@latest
```

**Why**: The current version ships with 4 KB alignment. Latest versions support 16 KB.

---

### 2. Update NDK Version (RECOMMENDED)

**File**: `android/build.gradle`

**Current**:
```groovy
ext {
    // ...
    ndkVersion = "25.1.8937393"  // r25
}
```

**Change to**:
```groovy
ext {
    // ...
    // NDK r28+ aligns libraries to 16 KB by default
    ndkVersion = "28.0.12674087"  // r28+
}
```

**Note**: React Native 0.80.2 may have compatibility issues with NDK r28. Test thoroughly or upgrade React Native first.

---

### 3. Add Linker Flags for Custom Native Code

**File**: `android/app/build.gradle`

**Add to `defaultConfig` block** (around line 96-106):

```groovy
defaultConfig {
    applicationId "com.marketbrand"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 12
    versionName "12"
    
    ndk {
        abiFilters "armeabi-v7a", "arm64-v8a"
    }
    
    // ADD THIS: 16 KB page size support for native builds
    externalNativeBuild {
        cmake {
            arguments "-DANDROID_PLATFORM=android-24"
            cppFlags "-Wl,-z,max-page-size=16384"
            cFlags "-Wl,-z,max-page-size=16384"
        }
    }
}
```

**If you have `externalNativeBuild` block elsewhere**, update it:

```groovy
android {
    // ... existing config
    
    // ADD THIS if you have CMake builds
    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"  // Your CMake path
            version "3.22.1"
            // Add 16 KB alignment flags
            arguments "-DCMAKE_CXX_FLAGS=-Wl,-z,max-page-size=16384"
            arguments "-DCMAKE_C_FLAGS=-Wl,-z,max-page-size=16384"
        }
    }
}
```

---

### 4. Update CMakeLists.txt (If You Have Custom Native Code)

**File**: `android/app/src/main/cpp/CMakeLists.txt` (if exists)

**Add to your CMakeLists.txt**:

```cmake
# Set 16 KB page size alignment
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wl,-z,max-page-size=16384")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wl,-z,max-page-size=16384")

# For each target, add linker options
target_link_options(your_target_name PRIVATE -Wl,-z,max-page-size=16384)
```

**Example complete CMakeLists.txt**:

```cmake
cmake_minimum_required(VERSION 3.22.1)
project("your_project")

# 16 KB page size support
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wl,-z,max-page-size=16384")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wl,-z,max-page-size=16384")

add_library(your_library SHARED
    your_source.cpp
)

target_link_options(your_library PRIVATE -Wl,-z,max-page-size=16384)
```

---

### 5. Update Packaging Options (Already Present ✅)

Your `android/app/build.gradle` already has proper packaging options (lines 154-162):

```groovy
packagingOptions {
    jniLibs {
        useLegacyPackaging = false
    }
    pickFirst '**/libc++_shared.so'
    pickFirst '**/libhermes.so'
    pickFirst '**/libreactnativejni.so'
    pickFirst '**/libfbjni.so'
}
```

**No changes needed** - this is already correct.

---

## Complete Updated build.gradle Sections

### android/build.gradle

```groovy
buildscript {
    ext {
        buildToolsVersion = "35.0.0"
        minSdkVersion = 24
        compileSdkVersion = 35
        targetSdkVersion = 35
        // UPDATE: NDK r28+ for better 16 KB support
        ndkVersion = "28.0.12674087"  // Changed from r25
        kotlinVersion = "1.9.24"
    }
    // ... rest of buildscript
}
```

### android/app/build.gradle

```groovy
android {
    // ... existing config
    
    defaultConfig {
        applicationId "com.marketbrand"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 12
        versionName "12"
        
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a"
        }
        
        // ADD: 16 KB page size support
        externalNativeBuild {
            cmake {
                arguments "-DANDROID_PLATFORM=android-24"
                cppFlags "-Wl,-z,max-page-size=16384"
                cFlags "-Wl,-z,max-page-size=16384"
            }
        }
    }
    
    // ... existing buildTypes, signingConfigs, etc.
    
    // If you have externalNativeBuild block, add:
    externalNativeBuild {
        cmake {
            // Your existing cmake config
            arguments "-DCMAKE_CXX_FLAGS=-Wl,-z,max-page-size=16384"
            arguments "-DCMAKE_C_FLAGS=-Wl,-z,max-page-size=16384"
        }
    }
    
    // ... existing packagingOptions (already correct)
}
```

---

## Step-by-Step Implementation

### Step 1: Update react-native-screens (CRITICAL)
```bash
npm update react-native-screens
cd android
./gradlew clean
./gradlew bundleRelease
```

### Step 2: Verify the Fix
```bash
cd ..
python analyze_elf_16kb.py "aab_16kb_analysis\extracted\base\lib\arm64-v8a\librnscreens.so"
```
Expected: Alignment should be 16384 bytes

### Step 3: Update NDK (Optional but Recommended)
1. Edit `android/build.gradle`
2. Change `ndkVersion` to `"28.0.12674087"`
3. Test build: `cd android && ./gradlew clean && ./gradlew bundleRelease`

### Step 4: Add Linker Flags (If You Have Custom Native Code)
1. Edit `android/app/build.gradle`
2. Add `externalNativeBuild` block to `defaultConfig`
3. Add flags to any existing `externalNativeBuild` blocks
4. Update `CMakeLists.txt` if you have custom native code

### Step 5: Rebuild and Verify
```bash
cd android
./gradlew clean
./gradlew bundleRelease
cd ..
.\analyze_all_libs.ps1
```

All libraries should show 16384 bytes alignment.

---

## Verification

After making changes:

1. **Rebuild AAB**:
   ```bash
   cd android
   ./gradlew clean bundleRelease
   ```

2. **Re-analyze**:
   ```bash
   cd ..
   .\analyze_all_libs.ps1
   ```

3. **Check results**:
   - All 12 libraries should show "COMPLIANT (16384 bytes)"
   - No libraries should show "NON-COMPLIANT"

4. **Upload to Play Console**:
   - Upload AAB to internal testing
   - Check Bundle Explorer → "Memory page size compliance"
   - Should show 100% compliance

---

## Summary of Changes

| File | Change | Priority |
|------|--------|----------|
| `package.json` | Update `react-native-screens` | 🔴 **CRITICAL** |
| `android/build.gradle` | Update `ndkVersion` to r28+ | 🟡 Recommended |
| `android/app/build.gradle` | Add linker flags to `defaultConfig` | 🟡 If custom native code |
| `android/app/src/main/cpp/CMakeLists.txt` | Add linker flags | 🟡 If custom native code |

---

## Expected Outcome

After applying all fixes:
- ✅ All 12 libraries: 16384 bytes alignment
- ✅ 100% compliance rate
- ✅ AAB passes Play Console validation
- ✅ App works on Android 15+ devices

