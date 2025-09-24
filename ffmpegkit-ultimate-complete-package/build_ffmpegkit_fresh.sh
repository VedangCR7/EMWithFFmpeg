#!/bin/bash
set -e

echo "=========================================="
echo "FFmpegKit Fresh Build Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to setup environment
setup_environment() {
    print_status "Setting up build environment..."
    
    # Set Android environment variables
    export ANDROID_HOME="$HOME/Android/Sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk/23.2.8568313"
    export ANDROID_NDK_HOME="$ANDROID_HOME/ndk/23.2.8568313"
    export NDK="$ANDROID_HOME/ndk/23.2.8568313"
    export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
    
    print_success "Environment variables set:"
    echo "ANDROID_HOME: $ANDROID_HOME"
    echo "ANDROID_NDK_ROOT: $ANDROID_NDK_ROOT"
    echo "NDK: $NDK"
}

# Function to clone fresh FFmpegKit
clone_fresh_ffmpegkit() {
    print_status "Cloning fresh FFmpegKit repository..."
    
    cd "$HOME"
    
    if [ -d "ffmpeg-kit" ]; then
        print_warning "Removing existing ffmpeg-kit directory..."
        rm -rf ffmpeg-kit
    fi
    
    print_status "Cloning FFmpegKit from GitHub..."
    if git clone --depth 1 https://github.com/arthenica/ffmpeg-kit.git; then
        print_success "FFmpegKit repository cloned successfully"
    else
        print_error "Failed to clone FFmpegKit repository"
        exit 1
    fi
    
    cd ffmpeg-kit
    
    # Make the build script executable
    chmod +x android.sh
    
    print_success "FFmpegKit setup complete"
}

# Function to try different build configurations
try_build_configurations() {
    print_status "Trying different build configurations..."
    
    # Configuration 1: Minimal build
    print_status "Attempting minimal build (LTS only)..."
    if ./android.sh --lts; then
        print_success "Minimal build succeeded!"
        return 0
    fi
    print_warning "Minimal build failed, trying next configuration..."
    
    # Configuration 2: LTS + GPL
    print_status "Attempting LTS + GPL build..."
    if ./android.sh --lts --enable-gpl; then
        print_success "LTS + GPL build succeeded!"
        return 0
    fi
    print_warning "LTS + GPL build failed, trying next configuration..."
    
    # Configuration 3: LTS + GPL + FreeType
    print_status "Attempting LTS + GPL + FreeType build..."
    if ./android.sh --lts --enable-gpl --enable-freetype; then
        print_success "LTS + GPL + FreeType build succeeded!"
        return 0
    fi
    print_warning "LTS + GPL + FreeType build failed, trying next configuration..."
    
    # Configuration 4: LTS + GPL + FreeType + FriBidi
    print_status "Attempting LTS + GPL + FreeType + FriBidi build..."
    if ./android.sh --lts --enable-gpl --enable-freetype --enable-fribidi; then
        print_success "LTS + GPL + FreeType + FriBidi build succeeded!"
        return 0
    fi
    print_warning "LTS + GPL + FreeType + FriBidi build failed"
    
    return 1
}

# Function to verify build
verify_build() {
    print_status "Verifying build..."
    
    local libs_dir="android/libs"
    local architectures=("armeabi-v7a" "arm64-v8a" "x86" "x86_64")
    
    for arch in "${architectures[@]}"; do
        if [ -d "$libs_dir/$arch" ]; then
            local lib_count=$(find "$libs_dir/$arch" -name "*.so" | wc -l)
            print_success "$arch: $lib_count libraries built"
        else
            print_warning "$arch: directory not found"
        fi
    done
    
    # Check for key libraries
    local key_libs=("libffmpegkit.so" "libavcodec.so" "libavformat.so")
    for lib in "${key_libs[@]}"; do
        if find "$libs_dir" -name "$lib" | grep -q .; then
            print_success "Key library $lib found"
        else
            print_warning "Key library $lib not found"
        fi
    done
}

# Function to create output package
create_output_package() {
    print_status "Creating output package..."
    
    if [ -d "android/libs" ]; then
        cd "$HOME"
        
        # Create output directory
        mkdir -p ffmpegkit-output
        
        # Copy libraries
        cp -r ffmpeg-kit/android/libs ffmpegkit-output/
        cp -r ffmpeg-kit/prebuilt ffmpegkit-output/ 2>/dev/null || echo "No prebuilt directory found"
        
        # Create README
        cat > ffmpegkit-output/README.md << EOF
# FFmpegKit Build Output

This package contains the built FFmpegKit libraries for Android.

## Contents
- \`libs/\` - Native libraries (.so files) for different architectures
- \`prebuilt/\` - Prebuilt packages (if available)

## Architectures
- armeabi-v7a (32-bit ARM)
- arm64-v8a (64-bit ARM) 
- x86 (32-bit Intel)
- x86_64 (64-bit Intel)

## Usage
Copy the appropriate .so files from the libs/ directory to your React Native project.

## Build Information
- Build Date: $(date)
- FFmpegKit Version: $(cd ffmpeg-kit && git describe --tags 2>/dev/null || echo "Unknown")
- Android NDK: 23.2.8568313
EOF
        
        print_success "Output package created in: $HOME/ffmpegkit-output/"
        
        # Create zip file
        print_status "Creating zip file..."
        cd ffmpegkit-output
        zip -r ../ffmpegkit-build-output.zip . > /dev/null
        cd ..
        print_success "Zip file created: $HOME/ffmpegkit-build-output.zip"
        
        return 0
    else
        print_error "No build output found to package"
        return 1
    fi
}

# Main execution
main() {
    print_status "Starting fresh FFmpegKit build process..."
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root"
        exit 1
    fi
    
    # Setup environment
    setup_environment
    
    # Clone fresh FFmpegKit
    clone_fresh_ffmpegkit
    
    # Try different build configurations
    if try_build_configurations; then
        print_success "Build completed successfully!"
        
        # Verify build
        verify_build
        
        # Create output package
        create_output_package
        
        print_success "=========================================="
        print_success "FFmpegKit build completed successfully!"
        print_success "=========================================="
        print_success "Output package: $HOME/ffmpegkit-output/"
        print_success "Zip file: $HOME/ffmpegkit-build-output.zip"
        print_success "=========================================="
    else
        print_error "All build configurations failed"
        print_error "Check the build.log file for details"
        exit 1
    fi
}

# Run main function
main "$@"



