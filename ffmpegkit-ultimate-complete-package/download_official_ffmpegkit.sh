#!/bin/bash

# Download and Integrate Official FFmpegKit Package
# This script downloads the official FFmpegKit and integrates it with your project

set -e

echo "📥 Downloading Official FFmpegKit Package..."
echo "============================================="

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

# Create download directory
download_dir="ffmpegkit-official"
if [[ -d "$download_dir" ]]; then
    rm -rf "$download_dir"
fi
mkdir -p "$download_dir"

# FFmpegKit GitHub releases URL
releases_url="https://api.github.com/repos/arthenica/ffmpeg-kit/releases/latest"

print_status "Fetching latest FFmpegKit release information..."

# Check if curl is available
if ! command -v curl &> /dev/null; then
    print_error "curl is required but not installed"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    print_warning "jq not found, will use alternative method"
    use_jq=false
else
    use_jq=true
fi

if [[ "$use_jq" == "true" ]]; then
    # Get latest release info using jq
    print_status "Using jq to parse release information..."
    release_info=$(curl -s "$releases_url")
    latest_version=$(echo "$release_info" | jq -r '.tag_name')
    print_success "Latest FFmpegKit version: $latest_version"
    
    # Find the Android AAR asset
    aar_url=$(echo "$release_info" | jq -r '.assets[] | select(.name | contains("android") and contains(".aar")) | .browser_download_url' | head -1)
    aar_name=$(echo "$release_info" | jq -r '.assets[] | select(.name | contains("android") and contains(".aar")) | .name' | head -1)
    
    if [[ -n "$aar_url" && -n "$aar_name" ]]; then
        print_success "Found Android AAR: $aar_name"
        print_status "Downloading AAR file..."
        
        # Download the AAR file
        aar_path="$download_dir/$aar_name"
        curl -L -o "$aar_path" "$aar_url"
        
        print_success "AAR downloaded successfully: $aar_path"
    else
        print_error "Android AAR asset not found in release"
        exit 1
    fi
else
    # Alternative method without jq
    print_status "Using alternative method to get release information..."
    
    # Get the latest release page
    latest_version=$(curl -s "$releases_url" | grep -o '"tag_name": "[^"]*' | head -1 | cut -d'"' -f4)
    print_success "Latest FFmpegKit version: $latest_version"
    
    # Download the first Android AAR we find
    print_status "Looking for Android AAR files..."
    
    # Get the release page HTML
    release_page=$(curl -s "https://github.com/arthenica/ffmpeg-kit/releases/tag/$latest_version")
    
    # Extract AAR download links
    aar_links=$(echo "$release_page" | grep -o 'href="[^"]*\.aar"' | head -1 | cut -d'"' -f2)
    
    if [[ -n "$aar_links" && "$aar_links" == *"android"* ]]; then
        aar_name=$(basename "$aar_links")
        aar_url="https://github.com$aar_links"
        
        print_success "Found Android AAR: $aar_name"
        print_status "Downloading AAR file..."
        
        # Download the AAR file
        aar_path="$download_dir/$aar_name"
        curl -L -o "$aar_path" "$aar_url"
        
        print_success "AAR downloaded successfully: $aar_path"
    else
        print_error "Android AAR asset not found in release"
        print_warning "Please download manually from: https://github.com/arthenica/ffmpeg-kit/releases/tag/$latest_version"
        exit 1
    fi
fi

# Extract AAR file
print_status "Extracting AAR file..."
extract_dir="$download_dir/extracted"
mkdir -p "$extract_dir"

if unzip -q "$aar_path" -d "$extract_dir"; then
    print_success "AAR extracted successfully"
else
    print_error "Failed to extract AAR file"
    exit 1
fi

# Analyze extracted contents
print_status "Analyzing extracted AAR contents..."

# Check for JNI libraries
jni_path="$extract_dir/jni"
if [[ -d "$jni_path" ]]; then
    print_success "Found JNI libraries directory"
    
    # List architectures
    print_success "Available architectures:"
    for arch_dir in "$jni_path"/*; do
        if [[ -d "$arch_dir" ]]; then
            arch_name=$(basename "$arch_dir")
            lib_count=$(find "$arch_dir" -name "*.so" | wc -l)
            echo -e "${WHITE}  🏗️ $arch_name: $lib_count libraries${NC}"
            
            # List key libraries
            key_libs=$(find "$arch_dir" -name "*.so" | grep -E "(ffmpegkit|avcodec|avfilter)" | head -3)
            if [[ -n "$key_libs" ]]; then
                echo "$key_libs" | while read -r lib; do
                    lib_name=$(basename "$lib")
                    echo -e "${GRAY}    📄 $lib_name${NC}"
                done
            fi
        fi
    done
    
    # Check for FFmpegKit wrapper libraries
    ffmpegkit_libs=$(find "$jni_path" -name "*ffmpegkit*.so")
    if [[ -n "$ffmpegkit_libs" ]]; then
        print_success "Found FFmpegKit wrapper libraries!"
        echo "$ffmpegkit_libs" | while read -r lib; do
            lib_name=$(basename "$lib")
            arch_name=$(basename "$(dirname "$lib")")
            echo -e "${WHITE}  📄 $lib_name in $arch_name${NC}"
        done
    else
        print_error "FFmpegKit wrapper libraries not found"
    fi
    
else
    print_error "JNI libraries directory not found"
fi

# Check for classes.jar
classes_jar="$extract_dir/classes.jar"
if [[ -f "$classes_jar" ]]; then
    print_success "Found classes.jar (Java classes)"
else
    print_error "classes.jar not found"
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}OFFICIAL FFMPEGKIT DOWNLOAD COMPLETED!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "${CYAN}📋 Next steps:${NC}"
echo -e "${WHITE}1. Review the extracted contents above${NC}"
echo -e "${WHITE}2. If FFmpegKit wrappers are found, integrate them${NC}"
echo -e "${WHITE}3. Combine with your custom FFmpeg libraries${NC}"
echo ""
echo -e "${GREEN}🎯 This should give you the complete FFmpegKit package!${NC}"
echo -e "${GREEN}==========================================${NC}"
