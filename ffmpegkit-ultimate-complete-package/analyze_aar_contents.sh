#!/bin/bash

# Extract FFmpegKit AAR and Analyze Contents
# This script extracts the AAR file and analyzes what's inside

set -e

echo "🔍 Extracting FFmpegKit AAR for complete integration..."
echo "====================================================="

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

# Check if AAR file exists
aar_file="ffmpegkit-output/bundle-android-aar-lts/ffmpeg-kit/ffmpeg-kit.aar"
if [[ ! -f "$aar_file" ]]; then
    print_error "FFmpegKit AAR file not found: $aar_file"
    print_error "Please ensure the build completed successfully"
    exit 1
fi

print_success "Found FFmpegKit AAR: $aar_file"

# Create extraction directory
extract_dir="ffmpeg-kit-aar-extracted"
if [[ -d "$extract_dir" ]]; then
    rm -rf "$extract_dir"
fi
mkdir -p "$extract_dir"

# Extract AAR file (AAR is just a ZIP file)
print_status "Extracting AAR file..."
if unzip -q "$aar_file" -d "$extract_dir"; then
    print_success "AAR extracted successfully"
else
    print_error "Failed to extract AAR"
    exit 1
fi

# Check what was extracted
print_status "Analyzing extracted contents..."
find "$extract_dir" -type f | while read -r file; do
    relative_path="${file#$extract_dir/}"
    echo -e "${GRAY}📁 $relative_path${NC}"
done

# Look for JNI libraries
jni_libs_path="$extract_dir/jni"
if [[ -d "$jni_libs_path" ]]; then
    print_success "Found JNI libraries directory"
    
    # Check architectures
    for arch_dir in "$jni_libs_path"/*; do
        if [[ -d "$arch_dir" ]]; then
            arch_name=$(basename "$arch_dir")
            lib_count=$(find "$arch_dir" -name "*.so" | wc -l)
            print_success "$arch_name: $lib_count libraries"
            
            # List the libraries
            find "$arch_dir" -name "*.so" | while read -r lib_file; do
                lib_name=$(basename "$lib_file")
                echo -e "${WHITE}  📄 $lib_name${NC}"
            done
        fi
    done
else
    print_error "JNI libraries directory not found in AAR"
    print_warning "Available directories:"
    find "$extract_dir" -type d -mindepth 1 -maxdepth 1 | while read -r dir; do
        dir_name=$(basename "$dir")
        echo -e "${GRAY}  📁 $dir_name${NC}"
    done
fi

# Check for AndroidManifest.xml
manifest_path="$extract_dir/AndroidManifest.xml"
if [[ -f "$manifest_path" ]]; then
    print_success "Found AndroidManifest.xml"
else
    print_warning "AndroidManifest.xml not found"
fi

# Check for classes.jar
classes_jar_path="$extract_dir/classes.jar"
if [[ -f "$classes_jar_path" ]]; then
    print_success "Found classes.jar"
else
    print_warning "classes.jar not found"
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}AAR EXTRACTION ANALYSIS COMPLETED!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "${CYAN}📋 Next steps:${NC}"
echo -e "${WHITE}1. Review the extracted contents above${NC}"
echo -e "${WHITE}2. If JNI libraries are found, we can integrate them${NC}"
echo -e "${WHITE}3. If not, we need to rebuild FFmpegKit properly${NC}"
echo ""
echo -e "${GREEN}🎯 The AAR should contain both FFmpeg libraries AND FFmpegKit wrappers!${NC}"
echo -e "${GREEN}==========================================${NC}"
