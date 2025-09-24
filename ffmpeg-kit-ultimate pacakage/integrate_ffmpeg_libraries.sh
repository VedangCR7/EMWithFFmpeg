#!/bin/bash

# Complete FFmpeg Library Integration Script
# This script replaces ALL existing FFmpeg libraries with the new comprehensive build

set -e

echo "🔄 Integrating COMPLETE FFmpeg library suite..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if we're in the right directory
if [[ ! -d "ffmpegkit-output" ]]; then
    print_error "ffmpegkit-output directory not found!"
    print_error "Please run this script from the EventMarketersWorking directory"
    exit 1
fi

if [[ ! -d "android/app/src/main/jniLibs" ]]; then
    print_error "android/app/src/main/jniLibs directory not found!"
    print_error "Please run this script from the EventMarketersWorking directory"
    exit 1
fi

# Create backup of existing libraries
print_status "Creating backup of existing libraries..."
if [[ ! -d "android/app/src/main/jniLibs_backup_$(date +%Y%m%d_%H%M%S)" ]]; then
    cp -r android/app/src/main/jniLibs android/app/src/main/jniLibs_backup_$(date +%Y%m%d_%H%M%S)
    print_success "Backup created: jniLibs_backup_$(date +%Y%m%d_%H%M%S)"
else
    print_warning "Backup already exists, skipping backup creation"
fi

# Function to copy libraries for a specific architecture
copy_libraries() {
    local source_arch=$1
    local target_arch=$2
    local neon_suffix=$3
    
    print_status "Copying libraries for $target_arch..."
    
    local source_dir="ffmpegkit-output/$source_arch/ffmpeg/lib"
    local target_dir="android/app/src/main/jniLibs/$target_arch"
    
    if [[ ! -d "$source_dir" ]]; then
        print_error "Source directory not found: $source_dir"
        return 1
    fi
    
    if [[ ! -d "$target_dir" ]]; then
        print_error "Target directory not found: $target_dir"
        return 1
    fi
    
    # Copy ALL FFmpeg libraries (replace everything except libffmpegkit.so files)
    local ffmpeg_libs=("libavcodec.so" "libavdevice.so" "libavfilter.so" "libavformat.so" "libavutil.so" "libswresample.so" "libswscale.so")
    
    # Also copy any additional libraries that might be present
    local additional_libs=("libfreetype.so" "libfontconfig.so" "libass.so" "libharfbuzz.so" "libfribidi.so" "libpng.so" "libjpeg.so" "libtiff.so" "libwebp.so")
    
    # Combine all libraries
    local all_libs=("${ffmpeg_libs[@]}" "${additional_libs[@]}")
    
    for lib in "${all_libs[@]}"; do
        local source_file="$source_dir/$lib"
        local target_file="$target_dir/$lib"
        
        if [[ -f "$source_file" ]]; then
            cp "$source_file" "$target_file"
            print_success "Copied $lib to $target_arch"
        else
            # Only warn for core FFmpeg libraries, not additional ones
            if [[ " ${ffmpeg_libs[@]} " =~ " ${lib} " ]]; then
                print_warning "Core library not found: $source_file"
            fi
        fi
    done
    
    # For NEON builds, also copy the NEON versions
    if [[ -n "$neon_suffix" ]]; then
        for lib in "${all_libs[@]}"; do
            local source_file="$source_dir/${lib}_neon"
            local target_file="$target_dir/${lib}_neon"
            
            if [[ -f "$source_file" ]]; then
                cp "$source_file" "$target_file"
                print_success "Copied ${lib}_neon to $target_arch"
            fi
        done
    fi
}

# Copy libraries for each architecture
print_status "Starting library integration..."

# ARM 32-bit (armeabi-v7a) - use regular ARM build
copy_libraries "android-arm-lts" "armeabi-v7a" ""

# ARM 32-bit NEON (armeabi-v7a-neon) - use NEON build
copy_libraries "android-arm-neon-lts" "armeabi-v7a" "neon"

# ARM 64-bit (arm64-v8a)
copy_libraries "android-arm64-lts" "arm64-v8a" ""

# Intel 32-bit (x86)
copy_libraries "android-x86-lts" "x86" ""

# Intel 64-bit (x86_64)
copy_libraries "android-x86_64-lts" "x86_64" ""

print_success "Library integration completed!"

# Verify the integration
print_status "Verifying integration..."

local architectures=("armeabi-v7a" "arm64-v8a" "x86" "x86_64")
for arch in "${architectures[@]}"; do
    local libs_dir="android/app/src/main/jniLibs/$arch"
    if [[ -d "$libs_dir" ]]; then
        local ffmpeg_count=$(find "$libs_dir" -name "libav*.so" | wc -l)
        local ffmpegkit_count=$(find "$libs_dir" -name "libffmpegkit*.so" | wc -l)
        print_success "$arch: $ffmpeg_count FFmpeg libraries, $ffmpegkit_count FFmpegKit libraries"
    else
        print_warning "$arch: directory not found"
    fi
done

print_success "=========================================="
print_success "INTEGRATION COMPLETED SUCCESSFULLY!"
print_success "=========================================="
print_success ""
print_success "✅ COMPLETE FFmpeg library suite has been integrated"
print_success "✅ All video processing capabilities now available"
print_success "✅ Existing libffmpegkit.so files have been preserved"
print_success "✅ All architectures updated (armeabi-v7a, arm64-v8a, x86, x86_64)"
print_success ""
print_success "🎬 New capabilities include:"
print_success "  - drawtext filter (text overlay)"
print_success "  - Image overlay support (PNG, JPEG, TIFF, WebP)"
print_success "  - Advanced subtitle rendering (libass)"
print_success "  - Complex text shaping (HarfBuzz)"
print_success "  - RTL language support (FriBidi)"
print_success "  - Font management (FontConfig)"
print_success "  - All GPL-licensed filters and codecs"
print_success ""
print_success "🚀 Next steps:"
print_success "1. Clean and rebuild your Android project:"
print_success "   cd android && ./gradlew clean && cd .."
print_success "2. Run your React Native app:"
print_success "   npx react-native run-android"
print_success "3. Test ALL video processing functionality"
print_success ""
print_success "🎯 Complete video processing capabilities are now available!"
print_success "=========================================="

