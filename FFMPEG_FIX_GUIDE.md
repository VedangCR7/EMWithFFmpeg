# FFmpegKit Native Libraries Fix - Complete Guide
# React Native 0.80.2 + FFmpegKit Crash Resolution

## 🚨 Problem Summary
- **Error**: `UnsatisfiedLinkError: dlopen failed: library "libffmpegkit_abidetect.so" not found`
- **Cause**: FFmpegKit native libraries missing after bundling
- **Device**: Samsung SM-T510 (armeabi-v7a architecture)
- **Root Cause**: FFmpegKit retired (Jan 2025), native libraries not built

## 🛠️ Solution Overview
Build FFmpegKit native libraries from source using WSL Ubuntu, then integrate into React Native project.

---

## 📋 Prerequisites Check

### 1. Verify WSL Installation
```powershell
# Run in PowerShell as Administrator
wsl --list --verbose
```

**Expected Output**: Should show WSL installed but no distributions
```
NAME      STATE           VERSION
* Ubuntu    Stopped         2
```

### 2. Install Ubuntu Distribution
```powershell
# Install Ubuntu in WSL
wsl --install -d Ubuntu
```

**Note**: This will require a system restart. After restart, Ubuntu will launch automatically.

---

## 🚀 Step-by-Step Execution

### Step 1: Launch WSL Ubuntu
```powershell
# From PowerShell
wsl -d Ubuntu
```

### Step 2: Run the Build Script
```bash
# In WSL Ubuntu terminal
cd ~
wget https://raw.githubusercontent.com/your-repo/build-ffmpeg-libs.sh
chmod +x build-ffmpeg-libs.sh
./build-ffmpeg-libs.sh
```

**Or copy-paste the script content directly:**
```bash
# Create the script file
nano build-ffmpeg-libs.sh
# Paste the script content, save with Ctrl+X, Y, Enter
chmod +x build-ffmpeg-libs.sh
./build-ffmpeg-libs.sh
```

### Step 3: Monitor Build Progress
The script will:
- ✅ Update system packages
- ✅ Install build dependencies (git, cmake, ninja-build, yasm, etc.)
- ✅ Download and setup Android SDK + NDK
- ✅ Accept all Android licenses automatically
- ✅ Clone ffmpeg-kit repository
- ✅ Build native libraries for armeabi-v7a (30-60 minutes)
- ✅ Copy .so files to React Native project

**Expected Libraries Generated:**
```
libffmpegkit_abidetect.so
libffmpegkit.so
libavcodec.so
libavformat.so
libavutil.so
libswresample.so
libswscale.so
```

### Step 4: Verify Integration
```bash
# Navigate to React Native project
cd /mnt/c/EMWithFFmpeg/EventMarketersWorking

# Check if libraries were copied
ls -la android/app/src/main/jniLibs/armeabi-v7a/*.so
```

### Step 5: Clean and Rebuild
```bash
# Clean Gradle cache
cd android
./gradlew clean

# Return to project root
cd ..

# Rebuild and run
npx react-native run-android
```

---

## 🔧 Manual Steps (If Script Fails)

### 1. Install Dependencies Manually
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git cmake ninja-build yasm nasm pkg-config autoconf automake libtool make wget curl unzip openjdk-11-jdk build-essential
```

### 2. Setup Android SDK
```bash
# Create Android SDK directory
mkdir -p ~/Android/Sdk
export ANDROID_HOME=~/Android/Sdk

# Download command line tools
cd /tmp
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip
mkdir -p $ANDROID_HOME/cmdline-tools/latest
mv cmdline-tools/* $ANDROID_HOME/cmdline-tools/latest/

# Set environment variables
echo "export ANDROID_HOME=$ANDROID_HOME" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> ~/.bashrc
source ~/.bashrc

# Accept licenses and install components
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0" "ndk;26.1.10909125"
```

### 3. Build FFmpegKit
```bash
cd ~
git clone https://github.com/arthenica/ffmpeg-kit.git
cd ffmpeg-kit
chmod +x android.sh

# Build for armeabi-v7a only
./android.sh --lts --arch=arm-v7a --enable-gpl --disable-x86 --disable-x86-64 --disable-arm64-v8a
```

### 4. Copy Libraries
```bash
# Find the generated libraries
LIB_DIR=$(find android -name "armeabi-v7a" -type d | head -1)

# Copy to React Native project
RN_LIB_PATH="/mnt/c/EMWithFFmpeg/EventMarketersWorking/android/app/src/main/jniLibs/armeabi-v7a"
mkdir -p "$RN_LIB_PATH"
cp "$LIB_DIR"/*.so "$RN_LIB_PATH/"
```

---

## 🧪 Testing & Verification

### 1. Check App Launch
```bash
# Run the app
npx react-native run-android

# Check logs for FFmpegKit
adb logcat | grep FFmpegKit
```

### 2. Test FFmpeg Functionality
1. Open app on device
2. Navigate to Profile tab
3. Tap "FFmpeg Test"
4. Tap "Test FFmpeg Import"
5. Verify success messages

### 3. Expected Success Logs
```
D/FFmpegKit: FFmpegKit package added successfully
D/MainApplication: Application started
I/FFmpegKit: FFmpegKit initialized successfully
```

---

## 🚨 Troubleshooting

### Common Issues:

#### 1. WSL Not Starting
```powershell
# Restart WSL service
wsl --shutdown
wsl -d Ubuntu
```

#### 2. Android SDK License Issues
```bash
# Manually accept licenses
yes | sdkmanager --licenses
```

#### 3. Build Fails with NDK Error
```bash
# Install specific NDK version
sdkmanager "ndk;26.1.10909125"
```

#### 4. Libraries Not Found After Build
```bash
# Search for generated libraries
find ~/ffmpeg-kit -name "*.so" -type f
```

#### 5. Gradle Build Fails
```bash
# Clean everything
cd android
./gradlew clean
rm -rf .gradle
cd ..
rm -rf node_modules
npm install
```

---

## 📁 File Structure After Success

```
EventMarketersWorking/
├── android/
│   └── app/
│       └── src/
│           └── main/
│               └── jniLibs/
│                   └── armeabi-v7a/
│                       ├── libffmpegkit_abidetect.so
│                       ├── libffmpegkit.so
│                       ├── libavcodec.so
│                       ├── libavformat.so
│                       ├── libavutil.so
│                       ├── libswresample.so
│                       └── libswscale.so
└── build-ffmpeg-libs.sh
```

---

## ✅ Success Criteria

- [ ] App launches without crashes
- [ ] No `UnsatisfiedLinkError` in logs
- [ ] FFmpeg Test screen shows success
- [ ] Native libraries present in APK
- [ ] Video processing commands work

---

## 🔄 Alternative Solutions

If building from source fails:

### Option 1: Use Pre-built Libraries
```bash
# Download pre-built libraries (if available)
wget https://github.com/arthenica/ffmpeg-kit/releases/download/v6.0.2/ffmpeg-kit-6.0.2-android-arm-v7a.zip
unzip ffmpeg-kit-6.0.2-android-arm-v7a.zip
```

### Option 2: Switch to Alternative Library
```bash
# Install react-native-video-processing
npm install react-native-video-processing
```

### Option 3: Docker Build (Advanced)
```bash
# Use Docker for consistent build environment
docker run -it --rm -v $(pwd):/workspace ubuntu:20.04 bash
# Then run the build script inside Docker
```

---

## 📞 Support

If you encounter issues:
1. Check the build logs for specific error messages
2. Verify all dependencies are installed correctly
3. Ensure WSL has sufficient disk space (at least 10GB free)
4. Try building with verbose output: `./android.sh --lts --arch=arm-v7a --enable-gpl --disable-x86 --disable-x86-64 --disable-arm64-v8a --verbose`

**Total Build Time**: 30-60 minutes (depending on system specs)
**Required Disk Space**: ~5GB for build process
**Required RAM**: 4GB+ recommended

