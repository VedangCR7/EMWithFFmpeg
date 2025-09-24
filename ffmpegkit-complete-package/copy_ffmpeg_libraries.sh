#!/bin/bash

# Copy Integrated FFmpeg Libraries to Main Project
# This script copies the integrated FFmpeg libraries to your main React Native project

set -e

echo "🔄 Copying integrated FFmpeg libraries to main project..."
echo "======================================================="

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

# Check if integration directory exists
if [[ ! -d "ffmpeg-kit-integration/android/app/src/main/jniLibs" ]]; then
    print_error "ffmpeg-kit-integration directory not found!"
    print_error "Please run this script from the EventMarketersWorking directory"
    exit 1
fi

# Check if main project jniLibs exists
if [[ ! -d "android/app/src/main/jniLibs" ]]; then
    print_error "Main project jniLibs directory not found!"
    print_error "Please run this script from the EventMarketersWorking directory"
    exit 1
fi

# Create backup of current libraries
print_status "Creating backup of current libraries..."
backup_name="jniLibs_backup_$(date +%Y%m%d_%H%M%S)"
if [[ ! -d "android/app/src/main/$backup_name" ]]; then
    cp -r android/app/src/main/jniLibs android/app/src/main/$backup_name
    print_success "Backup created: $backup_name"
else
    print_warning "Backup already exists, skipping backup creation"
fi

# Copy integrated libraries to main project
print_status "Copying integrated libraries to main project..."

architectures=("arm64-v8a" "armeabi-v7a" "x86" "x86_64")

for arch in "${architectures[@]}"; do
    source_dir="ffmpeg-kit-integration/android/app/src/main/jniLibs/$arch"
    target_dir="android/app/src/main/jniLibs/$arch"
    
    if [[ -d "$source_dir" ]]; then
        if [[ ! -d "$target_dir" ]]; then
            mkdir -p "$target_dir"
        fi
        
        # Copy all .so files from integration to main project
        so_files=$(find "$source_dir" -name "*.so")
        if [[ -n "$so_files" ]]; then
            echo "$so_files" | while read -r file; do
                filename=$(basename "$file")
                cp "$file" "$target_dir/"
                print_success "Copied $filename to $arch"
            done
        fi
        
        # Check if we need to copy libffmpegkit.so files from backup
        backup_dir="android/app/src/main/$backup_name/$arch"
        if [[ -d "$backup_dir" ]]; then
            ffmpegkit_files=$(find "$backup_dir" -name "libffmpegkit*.so")
            if [[ -n "$ffmpegkit_files" ]]; then
                echo "$ffmpegkit_files" | while read -r file; do
                    filename=$(basename "$file")
                    cp "$file" "$target_dir/"
                    print_success "Restored $filename to $arch"
                done
            fi
        fi
        
        lib_count=$(find "$target_dir" -name "*.so" | wc -l)
        print_success "$arch: $lib_count total libraries"
    else
        print_warning "Source directory not found: $source_dir"
    fi
done

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}LIBRARY COPY COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
print_success "New FFmpeg libraries copied to main project"
print_success "FFmpegKit wrapper libraries preserved"
print_success "All architectures updated"
echo ""
echo -e "${CYAN}🚀 Next steps:${NC}"
echo -e "${WHITE}1. Clean and rebuild your Android project:${NC}"
echo -e "${GRAY}   cd android && ./gradlew clean && cd ..${NC}"
echo -e "${WHITE}2. Run your React Native app:${NC}"
echo -e "${GRAY}   npx react-native run-android${NC}"
echo -e "${WHITE}3. Test video processing functionality${NC}"
echo ""
echo -e "${GREEN}🎯 The drawtext filter should now work!${NC}"
echo -e "${GREEN}==========================================${NC}"
