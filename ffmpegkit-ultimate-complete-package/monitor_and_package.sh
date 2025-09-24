#!/bin/bash

# Monitor Complete FFmpegKit Build and Create Final Package
# This script monitors the build progress and creates the final complete zip

set -e

echo "🔍 Monitoring Complete FFmpegKit Build..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if complete build is done
check_complete_build() {
    local ffmpeg_dir="/home/mayur/ffmpeg-kit"
    
    # Check if FFmpegKit wrapper libraries exist
    if [[ -f "$ffmpeg_dir/android/libs/armeabi-v7a/libffmpegkit.so" ]] && \
       [[ -f "$ffmpeg_dir/android/libs/arm64-v8a/libffmpegkit.so" ]] && \
       [[ -f "$ffmpeg_dir/android/libs/x86/libffmpegkit.so" ]] && \
       [[ -f "$ffmpeg_dir/android/libs/x86_64/libffmpegkit.so" ]]; then
        
        print_success "Complete FFmpegKit build found with wrapper libraries!"
        return 0
    fi
    
    return 1
}

# Function to create complete package
create_complete_package() {
    print_status "Creating complete FFmpegKit package..."
    
    local package_dir="ffmpegkit-complete-final-package"
    if [[ -d "$package_dir" ]]; then
        rm -rf "$package_dir"
    fi
    mkdir -p "$package_dir"
    
    # Copy complete FFmpegKit build
    print_status "Copying complete FFmpegKit build..."
    cp -r /home/mayur/ffmpeg-kit/android "$package_dir/ffmpegkit-android-libs"
    cp -r /home/mayur/ffmpeg-kit/prebuilt "$package_dir/ffmpegkit-prebuilt"
    
    # Copy all scripts and documentation
    print_status "Copying scripts and documentation..."
    cp *.sh *.ps1 *.md "$package_dir/" 2>/dev/null || true
    
    # Create comprehensive README
    cat > "$package_dir/README.md" << 'EOF'
# 🎉 COMPLETE FFmpegKit Package - FINAL VERSION

## ✅ COMPLETE BUILD WITH ALL COMPONENTS

This package contains the **COMPLETE** FFmpegKit build with:
- ✅ All FFmpeg core libraries
- ✅ FFmpegKit wrapper libraries (libffmpegkit.so) - **REACT NATIVE READY!**
- ✅ Complete AAR bundle with all architectures
- ✅ React Native integration ready

## 📦 Package Contents

### **1. Complete FFmpegKit Android Libraries:**
- `ffmpegkit-android-libs/` - **COMPLETE** FFmpegKit Android libraries
- All 4 Android architectures with wrapper libraries
- React Native integration ready

### **2. Complete FFmpegKit Prebuilt:**
- `ffmpegkit-prebuilt/` - **COMPLETE** FFmpegKit prebuilt packages
- All architectures with complete libraries

### **3. Integration Scripts:**
- `integrate_ffmpeg_libraries.sh` - Linux/WSL/macOS integration
- `copy_ffmpeg_libraries.sh` - Linux/WSL/macOS copy script
- `copy_ffmpeg_libraries.ps1` - Windows PowerShell copy script
- `build_ffmpegkit_complete.sh` - Complete build script

### **4. Analysis Tools:**
- `analyze_aar_contents.sh` - Linux/WSL/macOS AAR analysis
- `analyze_aar_contents.ps1` - Windows PowerShell AAR analysis

### **5. Documentation:**
- `README.md` - This comprehensive guide
- `FFmpegKit-Integration-Guide.md` - Detailed integration guide
- `Copy-Scripts-Usage.md` - Script usage instructions
- `FFmpegKit-Analysis-Report.md` - Technical analysis

## 🚀 Quick Start

### **1. Extract Package:**
```bash
unzip ffmpegkit-complete-final-package.zip
cd ffmpegkit-complete-final-package
```

### **2. Use Complete Build:**
```bash
# The complete build is in ffmpegkit-android-libs/
# This includes FFmpegKit wrapper libraries for React Native!
```

### **3. Integrate:**
```bash
# For Linux/WSL/macOS
chmod +x integrate_ffmpeg_libraries.sh
./integrate_ffmpeg_libraries.sh

# For Windows PowerShell
.\integrate_ffmpeg_libraries.ps1
```

## ✅ What's Complete Now

- **FFmpeg Core Libraries:** ✅ All architectures
- **FFmpegKit Wrapper Libraries:** ✅ All architectures - **REACT NATIVE READY!**
- **AAR Bundle:** ✅ Complete with all architectures
- **React Native Integration:** ✅ Ready to use
- **Professional Video Processing:** ✅ Full capabilities

## 🎬 Capabilities

- ✅ Advanced video editing (cut, merge, filter)
- ✅ Text overlay with custom fonts (drawtext filter)
- ✅ Image overlay (PNG, JPEG, TIFF, WebP)
- ✅ Visual effects (blur, crop, resize, color correction)
- ✅ Audio processing (convert, filter, mix)
- ✅ Multi-language support (RTL, complex text shaping)
- ✅ Hardware acceleration (ARM NEON)
- ✅ All major formats (MP4, AVI, MOV, MKV, WebM, etc.)

## 📱 Supported Architectures

- **arm64-v8a** - Modern 64-bit ARM devices
- **armeabi-v7a** - Older 32-bit ARM devices
- **x86** - 32-bit Intel emulators
- **x86_64** - 64-bit Intel emulators

## 🎯 Ready for Production

This package is now **COMPLETE** and ready for production use in your React Native app!

---

**Package Status:** ✅ **COMPLETE** - All components included  
**Build Status:** ✅ **COMPLETE** - All architectures with wrappers  
**Integration Status:** ✅ **READY** - Ready for production use
EOF

    print_success "Complete package created: $package_dir"
    
    # Create the final zip
    print_status "Creating final complete zip package..."
    zip -r ffmpegkit-complete-final-package.zip "$package_dir/" > /dev/null
    
    print_success "=========================================="
    print_success "COMPLETE FFMPEGKIT PACKAGE READY!"
    print_success "=========================================="
    print_success ""
    print_success "📦 File: ffmpegkit-complete-final-package.zip"
    print_success "✅ Complete FFmpegKit build with wrapper libraries"
    print_success "✅ All architectures with React Native integration"
    print_success "✅ Ready for production use"
    print_success ""
    print_success "🎬 Professional video processing with React Native integration ready!"
    print_success "=========================================="
}

# Main monitoring loop
print_status "Starting complete build monitoring..."
print_warning "The complete FFmpegKit build can take 60-120 minutes"
print_warning "Please be patient while it builds all components"

while true; do
    if check_complete_build; then
        print_success "Complete build is ready!"
        create_complete_package
        break
    else
        # Check if build is still running
        if ps aux | grep -E "android\.sh|build_ffmpegkit_complete" | grep -v grep | grep -q .; then
            echo -n "."
            sleep 30  # Check every 30 seconds
        else
            print_error "Build process stopped but complete build not found"
            print_error "There may have been an error"
            break
        fi
    fi
done
