#!/bin/bash
set -e

echo "=========================================="
echo "FFmpegKit Build Script for Advanced Video Editing"
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

# Function to check and install dependencies
install_dependencies() {
    print_status "Checking and installing system dependencies..."
    
    # Check if we need to update package list
    if [ ! -f "/var/lib/apt/lists/lock" ] || [ ! -s "/var/lib/apt/lists/lock" ]; then
        print_status "Updating package list..."
        if sudo -n apt-get update -y 2>/dev/null; then
            print_success "Package list updated successfully"
        else
            print_warning "Cannot update package list automatically (sudo requires password)"
            print_status "Please run manually: sudo apt-get update"
        fi
    else
        print_success "Package list is up to date"
    fi
    
    # Install essential dependencies
    local deps=(
        "git"
        "wget" 
        "unzip"
        "openjdk-11-jdk"
        "python3"
        "python3-pip"
        "build-essential"
        "cmake"
        "ninja-build"
        "pkg-config"
        "autoconf"
        "automake"
        "libtool"
        "yasm"
        "nasm"
        "libssl-dev"
        "zlib1g-dev"
        "libbz2-dev"
        "libreadline-dev"
        "libsqlite3-dev"
        "libncurses5-dev"
        "libncursesw5-dev"
        "xz-utils"
        "tk-dev"
        "libffi-dev"
        "liblzma-dev"
        "libfreetype6-dev"
        "libfontconfig1-dev"
        "libfribidi-dev"
        "libharfbuzz-dev"
        "libass-dev"
        "libpng-dev"
        "libjpeg-dev"
        "libtiff-dev"
        "libwebp-dev"
    )
    
    local missing_deps=()
    
    # Check which dependencies are missing
    for dep in "${deps[@]}"; do
        if ! dpkg -l | grep -q "^ii  $dep "; then
            missing_deps+=("$dep")
        fi
    done
    
    # Install missing dependencies if any
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_status "Installing missing dependencies: ${missing_deps[*]}"
        if sudo -n apt-get install -y "${missing_deps[@]}" 2>/dev/null; then
            print_success "Missing dependencies installed successfully"
        else
            print_warning "Cannot install dependencies automatically (sudo requires password)"
            print_status "Please run manually:"
            echo "sudo apt-get install -y ${missing_deps[*]}"
            print_error "Script cannot continue without dependencies. Please install them manually and run again."
            exit 1
        fi
    else
        print_success "All system dependencies are already installed"
    fi
}

# Function to setup Android SDK and NDK
setup_android() {
    print_status "Setting up Android SDK and NDK..."
    
    # Set Android environment variables
    export ANDROID_HOME="$HOME/Android/Sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
    
    # Create Android SDK directory
    mkdir -p "$ANDROID_HOME"
    
    # Check if Android command line tools are already installed
    if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
        print_status "Android command line tools not found. Downloading..."
        mkdir -p "$ANDROID_HOME/cmdline-tools"
        cd "$ANDROID_HOME/cmdline-tools"
        
        # Download command line tools
        print_status "Downloading Android command line tools..."
        if wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O cmdline-tools.zip; then
            # Extract command line tools
            unzip -q cmdline-tools.zip -d latest
            rm cmdline-tools.zip
            print_success "Android command line tools installed successfully"
        else
            print_error "Failed to download Android command line tools"
            exit 1
        fi
    else
        print_success "Android command line tools already installed"
    fi
    
    # Set SDK root environment variable
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    
    # Check if SDK components are installed
    cd "$ANDROID_HOME/cmdline-tools/latest/cmdline-tools/bin"
    
    # Accept all licenses (only if needed)
    print_status "Accepting Android SDK licenses..."
    yes | ./sdkmanager --sdk_root="$ANDROID_HOME" --licenses
    
    # Check and install required SDK components
    print_status "Checking and installing Android SDK components..."
    
    local components_to_install=()
    
    # Check platform-tools
    if [ ! -d "$ANDROID_HOME/platform-tools" ]; then
        components_to_install+=("platform-tools")
    fi
    
    # Check platforms
    if [ ! -d "$ANDROID_HOME/platforms/android-31" ]; then
        components_to_install+=("platforms;android-31")
    fi
    if [ ! -d "$ANDROID_HOME/platforms/android-33" ]; then
        components_to_install+=("platforms;android-33")
    fi
    
    # Check NDK
    if [ ! -d "$ANDROID_HOME/ndk/23.2.8568313" ]; then
        components_to_install+=("ndk;23.2.8568313")
    fi
    
    # Check CMake
    if [ ! -d "$ANDROID_HOME/cmake/3.22.1" ]; then
        components_to_install+=("cmake;3.22.1")
    fi
    
    # Check build-tools
    if [ ! -d "$ANDROID_HOME/build-tools/31.0.0" ]; then
        components_to_install+=("build-tools;31.0.0")
    fi
    if [ ! -d "$ANDROID_HOME/build-tools/33.0.0" ]; then
        components_to_install+=("build-tools;33.0.0")
    fi
    
    # Install missing components
    if [ ${#components_to_install[@]} -gt 0 ]; then
        print_status "Installing missing SDK components: ${components_to_install[*]}"
        ./sdkmanager --sdk_root="$ANDROID_HOME" "${components_to_install[@]}"
        print_success "Missing SDK components installed successfully"
    else
        print_success "All required SDK components are already installed"
    fi
    
    # Set NDK environment variables
    export NDK="$ANDROID_HOME/ndk/23.2.8568313"
    export ANDROID_NDK_ROOT="$NDK"
    export ANDROID_NDK_HOME="$NDK"
    
    print_success "Android SDK setup complete. NDK path: $NDK"
    
    # Verify NDK installation
    if [ -f "$NDK/source.properties" ]; then
        local ndk_version=$(grep -Eo "Revision.*" "$NDK/source.properties" | sed 's/Revision//g;s/=//g;s/ //g')
        print_success "NDK version: $ndk_version"
    else
        print_error "NDK installation verification failed"
        exit 1
    fi
}

# Function to clone FFmpegKit
clone_ffmpegkit() {
    print_status "Setting up FFmpegKit..."
    
    cd "$HOME"
    
    # Check if FFmpegKit directory exists
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
        print_status "Updating FFmpegKit repository..."
        cd ffmpeg-kit
        if git pull origin main; then
            print_success "FFmpegKit repository updated successfully"
        else
            print_warning "Failed to update FFmpegKit repository, continuing with existing version"
        fi
        cd ..
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

# Function to check if build already exists
check_existing_build() {
    print_status "Checking for existing FFmpegKit build..."
    
    local libs_dir="android/libs"
    local architectures=("armeabi-v7a" "arm64-v8a" "x86" "x86_64")
    local build_exists=true
    
    for arch in "${architectures[@]}"; do
        if [ ! -d "$libs_dir/$arch" ] || [ ! "$(ls -A "$libs_dir/$arch" 2>/dev/null)" ]; then
            build_exists=false
            break
        fi
    done
    
    if [ "$build_exists" = true ]; then
        print_success "Existing FFmpegKit build found!"
        print_status "Libraries found in: $(pwd)/$libs_dir"
        ls -la "$libs_dir"
        return 0
    else
        print_status "No existing build found, will proceed with new build"
        return 1
    fi
}

# Function to build FFmpegKit
build_ffmpegkit() {
    print_status "Building FFmpegKit with advanced video editing capabilities..."
    
    # Check if build already exists
    if check_existing_build; then
        print_success "Using existing FFmpegKit build"
        return 0
    fi
    
    # Ensure environment variables are set for FFmpegKit build
    export ANDROID_HOME="$ANDROID_HOME"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk/23.2.8568313"
    export ANDROID_NDK_HOME="$ANDROID_HOME/ndk/23.2.8568313"
    export NDK="$ANDROID_HOME/ndk/23.2.8568313"
    
    print_status "Environment variables for FFmpegKit build:"
    echo "ANDROID_HOME: $ANDROID_HOME"
    echo "ANDROID_NDK_ROOT: $ANDROID_NDK_ROOT"
    
    # Build FFmpegKit with all required libraries for advanced video editing
    print_status "Starting FFmpegKit build with advanced features..."
    print_status "This may take 60-90 minutes depending on your system..."
    print_status "Building for architectures: arm-v7a, arm64-v8a, x86, x86_64"
    
    # Run the build with all required flags for advanced video editing
    if ./android.sh \
        --lts \
        --enable-gpl \
        --enable-freetype \
        --enable-libass \
        --enable-fribidi \
        --enable-libwebp \
        --enable-fontconfig; then
        
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
                    print_success "- libass (for subtitles and emoji overlays)"
                    print_success "- FriBidi (for RTL languages)"
                    print_success "- WebP (for image overlays)"
                    print_success "- FontConfig (for font management)"
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
    
    # Check if sudo is available
    if ! command_exists sudo; then
        print_error "sudo is required but not available"
        exit 1
    fi
    
    # Install dependencies
    install_dependencies
    
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
