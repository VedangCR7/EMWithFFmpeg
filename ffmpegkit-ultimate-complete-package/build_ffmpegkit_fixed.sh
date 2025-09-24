#!/bin/bash
set -e

echo "=========================================="
echo "FFmpegKit Build Script (Fixed Version)"
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

# Function to setup Android SDK and NDK
setup_android() {
    print_status "Setting up Android SDK and NDK..."
    
    # Set Android environment variables
    export ANDROID_HOME="$HOME/Android/Sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
    
    print_success "Android SDK already set up at: $ANDROID_HOME"
}

# Function to clone FFmpegKit
clone_ffmpegkit() {
    print_status "Setting up FFmpegKit..."
    
    cd "$HOME"
    
    if [ ! -d "ffmpeg-kit" ]; then
        print_status "FFmpegKit repository not found. Cloning..."
        if git clone https://github.com/arthenica/ffmpeg-kit.git; then
            print_success "FFmpegKit repository cloned successfully"
        else
            print_error "Failed to clone FFmpegKit repository"
            exit 1
        fi
    else
        print_success "FFmpegKit repository already exists"
    fi
    
    cd ffmpeg-kit
    
    # Check if the build script exists
    if [ ! -f "android.sh" ]; then
        print_error "android.sh script not found in ffmpeg-kit directory"
        exit 1
    fi
    
    # Make the build script executable
    chmod +x android.sh
    
    print_success "FFmpegKit setup complete"
}

# Function to build FFmpegKit
build_ffmpegkit() {
    print_status "Building FFmpegKit with stable configuration..."
    
    # Ensure environment variables are set for FFmpegKit build
    export ANDROID_HOME="$HOME/Android/Sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk/23.2.8568313"
    export ANDROID_NDK_HOME="$ANDROID_HOME/ndk/23.2.8568313"
    export NDK="$ANDROID_HOME/ndk/23.2.8568313"
    
    print_status "Environment variables for FFmpegKit build:"
    echo "ANDROID_HOME: $ANDROID_HOME"
    echo "ANDROID_NDK_ROOT: $ANDROID_NDK_ROOT"
    
    # Clean up any previous failed builds
    print_status "Cleaning up previous build artifacts..."
    rm -rf src/libiconv android
    
    # Build FFmpegKit with stable libraries only
    print_status "Starting FFmpegKit build with stable features..."
    print_status "This may take 60-90 minutes depending on your system..."
    print_status "Building for architectures: arm-v7a, arm64-v8a, x86, x86_64"
    
    # Run the build with stable libraries only (no libiconv)
    if ./android.sh \
        --lts \
        --enable-gpl \
        --enable-freetype \
        --enable-fribidi \
        --enable-libwebp; then
        
        print_success "FFmpegKit build completed successfully!"
        
        # Show the output directory contents
        if [ -d "android/libs" ]; then
            print_success "Generated libraries:"
            ls -la android/libs/
            
            print_success "=========================================="
            print_success "BUILD COMPLETED SUCCESSFULLY!"
            print_success "=========================================="
            print_success "The .so libraries are located in:"
            print_success "$(pwd)/android/libs/"
            print_success ""
            print_success "Architectures built:"
            print_success "- armeabi-v7a (32-bit ARM)"
            print_success "- arm64-v8a (64-bit ARM)"
            print_success "- x86 (32-bit Intel)"
            print_success "- x86_64 (64-bit Intel)"
            print_success ""
            print_success "Features enabled:"
            print_success "- GPL libraries (for advanced filters)"
            print_success "- FreeType (for custom fonts and drawtext)"
            print_success "- FriBidi (for RTL languages)"
            print_success "- WebP (for image overlays)"
            print_success ""
            print_success "You can now use these libraries in your React Native project!"
            print_success "=========================================="
        else
            print_error "Build completed but android/libs directory not found"
            exit 1
        fi
    else
        print_error "FFmpegKit build failed"
        print_error "Check the build.log file for details"
        exit 1
    fi
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
    local key_libs=("libffmpegkit.so" "libavcodec.so" "libavformat.so" "libavfilter.so")
    for lib in "${key_libs[@]}"; do
        if find "$libs_dir" -name "$lib" | grep -q .; then
            print_success "Key library $lib found"
        else
            print_warning "Key library $lib not found"
        fi
    done
}

# Main execution
main() {
    print_status "Starting FFmpegKit build process..."
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root"
        exit 1
    fi
    
    # Setup Android SDK and NDK
    setup_android
    
    # Clone FFmpegKit
    clone_ffmpegkit
    
    # Build FFmpegKit
    build_ffmpegkit
    
    # Verify build
    verify_build
    
    print_success "FFmpegKit build script completed successfully!"
    print_success "You can now integrate the built libraries into your React Native project."
}

# Run main function
main "$@"



