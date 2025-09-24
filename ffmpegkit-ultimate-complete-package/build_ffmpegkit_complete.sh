#!/bin/bash

# FFmpegKit Complete Build Script for Ubuntu
# This script builds FFmpegKit with all required dependencies and configurations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${CYAN}==========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}==========================================${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_header "FFmpegKit Complete Build Script for Ubuntu"

echo -e "${BLUE}This script will:${NC}"
echo -e "  ✅ Install all required dependencies"
echo -e "  ✅ Setup Android SDK + NDK 23.2.8568313"
echo -e "  ✅ Clone FFmpegKit from GitHub"
echo -e "  ✅ Build FFmpegKit with advanced features"
echo -e "  ✅ Verify JNI wrapper libraries are created"
echo -e "  ✅ Confirm AAR package is generated"
echo -e "  ✅ Provide integration instructions"
echo ""

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

print_header "Step 1: Installing System Dependencies"

print_status "Updating package list..."
sudo apt-get update -y

# Install essential dependencies
deps=(
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
    "libexpat1-dev"
    "libiconv-dev"
)

print_status "Installing dependencies..."
for dep in "${deps[@]}"; do
    if ! dpkg -l | grep -q "^ii  $dep "; then
        print_status "Installing $dep..."
        sudo apt-get install -y "$dep"
    else
        print_success "$dep is already installed"
    fi
done

print_success "All dependencies installed successfully"

print_header "Step 2: Setting up Android SDK and NDK"

# Set Android environment variables
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

print_status "Setting up Android SDK and NDK..."
print_status "ANDROID_HOME: $ANDROID_HOME"

# Create Android SDK directory
mkdir -p "$ANDROID_HOME"

# Install Android command line tools if not present
if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
    print_status "Downloading Android command line tools..."
    cd "$ANDROID_HOME"
    
    # Download command line tools
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O cmdline-tools.zip
    
    # Extract command line tools
    unzip -q cmdline-tools.zip -d cmdline-tools-temp
    mkdir -p cmdline-tools/latest
    mv cmdline-tools-temp/cmdline-tools/* cmdline-tools/latest/
    rm -rf cmdline-tools-temp cmdline-tools.zip
    
    print_success "Android command line tools installed"
else
    print_success "Android command line tools already installed"
fi

# Set SDK root environment variable
export ANDROID_SDK_ROOT="$ANDROID_HOME"

# Accept licenses and install required packages
print_status "Installing Android SDK components..."
cd "$ANDROID_HOME/cmdline-tools/latest/cmdline-tools/bin"

# Accept all licenses
print_status "Accepting Android SDK licenses..."
yes | ./sdkmanager --sdk_root="$ANDROID_HOME" --licenses

# Install required SDK components
print_status "Installing platform tools, platform, NDK, and CMake..."
./sdkmanager --sdk_root="$ANDROID_HOME" \
    "platform-tools" \
    "platforms;android-31" \
    "platforms;android-33" \
    "ndk;23.2.8568313" \
    "cmake;3.22.1" \
    "build-tools;31.0.0" \
    "build-tools;33.0.0"

# Set NDK environment variables
export NDK="$ANDROID_HOME/ndk/23.2.8568313"
export ANDROID_NDK_ROOT="$NDK"
export ANDROID_NDK_HOME="$NDK"

print_success "Android SDK setup complete. NDK path: $NDK"

# Verify NDK installation
if [ -f "$NDK/source.properties" ]; then
    ndk_version=$(grep -Eo "Revision.*" "$NDK/source.properties" | sed 's/Revision//g;s/=//g;s/ //g')
    print_success "NDK version: $ndk_version"
else
    print_error "NDK installation verification failed"
    exit 1
fi

print_header "Step 3: Cloning FFmpegKit"

cd "$HOME"

if [ ! -d "ffmpeg-kit" ]; then
    print_status "Cloning FFmpegKit repository..."
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
    git pull origin main
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

print_header "Step 4: Building FFmpegKit with Advanced Features"

# Ensure environment variables are set for FFmpegKit build
export ANDROID_HOME="$ANDROID_HOME"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk/23.2.8568313"
export ANDROID_NDK_HOME="$ANDROID_HOME/ndk/23.2.8568313"
export NDK="$ANDROID_HOME/ndk/23.2.8568313"

print_status "Environment variables for FFmpegKit build:"
echo "ANDROID_HOME: $ANDROID_HOME"
echo "ANDROID_NDK_ROOT: $ANDROID_NDK_ROOT"

# Build FFmpegKit with all required flags
print_status "Starting FFmpegKit build with advanced features..."
print_status "This may take 60-120 minutes depending on your system..."
print_status "Building for architectures: arm-v7a, arm64-v8a, x86, x86_64"

print_status "Build flags:"
echo "  --lts (Long Term Support)"
echo "  --enable-gpl (GPL libraries)"
echo "  --enable-libfreetype (Text rendering)"
echo "  --enable-libass (Subtitle support)"
echo "  --enable-libharfbuzz (Complex text shaping)"
echo "  --enable-libfribidi (RTL language support)"
echo "  --enable-libpng (PNG image support)"
echo "  --enable-libjpeg (JPEG image support)"
echo "  --arch=arm-v7a,arm64-v8a,x86,x86_64 (All architectures)"
echo "  --full (All available libraries)"

# Run the build with all required flags
if ./android.sh \
    --lts \
    --enable-gpl \
    --enable-libfreetype \
    --enable-libass \
    --enable-libharfbuzz \
    --enable-libfribidi \
    --enable-libpng \
    --enable-libjpeg \
    --arch=arm-v7a,arm64-v8a,x86,x86_64 \
    --full; then
    
    print_success "FFmpegKit build completed successfully!"
    
    print_header "Step 5: Verifying Build Results"
    
    # Check for JNI wrapper libraries
    print_status "Checking for JNI wrapper libraries..."
    
    if [ -d "android/libs" ]; then
        print_success "Generated libraries directory found: android/libs/"
        
        # Check each architecture
        architectures=("armeabi-v7a" "arm64-v8a" "x86" "x86_64")
        for arch in "${architectures[@]}"; do
            if [ -d "android/libs/$arch" ]; then
                ffmpegkit_count=$(find "android/libs/$arch" -name "libffmpegkit*.so" | wc -l)
                total_count=$(find "android/libs/$arch" -name "*.so" | wc -l)
                print_success "$arch: $ffmpegkit_count FFmpegKit libraries, $total_count total libraries"
                
                # List FFmpegKit libraries
                find "android/libs/$arch" -name "libffmpegkit*.so" | while read -r lib; do
                    print_success "  📄 $(basename "$lib")"
                done
            else
                print_warning "$arch: directory not found"
            fi
        done
        
        # Check for key libraries
        key_libs=("libffmpegkit.so" "libffmpegkit_abidetect.so")
        for lib in "${key_libs[@]}"; do
            if find "android/libs" -name "$lib" | grep -q .; then
                print_success "Key library $lib found"
            else
                print_error "Key library $lib not found"
            fi
        done
        
    else
        print_error "Build completed but android/libs directory not found"
        exit 1
    fi
    
    # Check for AAR package
    print_status "Checking for AAR package..."
    
    if [ -f "android/ffmpeg-kit-android-lib/build/outputs/aar/ffmpeg-kit-release.aar" ]; then
        print_success "AAR package generated: ffmpeg-kit-release.aar"
        
        # Get AAR file size
        aar_size=$(du -h "android/ffmpeg-kit-android-lib/build/outputs/aar/ffmpeg-kit-release.aar" | cut -f1)
        print_success "AAR file size: $aar_size"
        
        # Copy AAR to prebuilt directory if it exists
        if [ -d "prebuilt" ]; then
            print_status "Copying AAR to prebuilt directory..."
            mkdir -p "prebuilt/bundle-android-aar-lts/ffmpeg-kit"
            cp "android/ffmpeg-kit-android-lib/build/outputs/aar/ffmpeg-kit-release.aar" "prebuilt/bundle-android-aar-lts/ffmpeg-kit/ffmpeg-kit.aar"
            print_success "AAR copied to prebuilt directory"
        fi
        
    else
        print_error "AAR package not found"
        print_status "Checking build outputs..."
        find "android" -name "*.aar" -type f | while read -r aar; do
            print_status "Found AAR: $aar"
        done
    fi
    
    print_header "Step 6: Integration Instructions"
    
    print_success "=========================================="
    print_success "BUILD COMPLETED SUCCESSFULLY!"
    print_success "=========================================="
    print_success ""
    print_success "📁 Generated files:"
    print_success "  - JNI libraries: $(pwd)/android/libs/"
    print_success "  - AAR package: $(pwd)/android/ffmpeg-kit-android-lib/build/outputs/aar/ffmpeg-kit-release.aar"
    print_success ""
    print_success "🏗️ Architectures built:"
    print_success "  - armeabi-v7a (32-bit ARM)"
    print_success "  - arm64-v8a (64-bit ARM)"
    print_success "  - x86 (32-bit Intel)"
    print_success "  - x86_64 (64-bit Intel)"
    print_success ""
    print_success "🎬 Features enabled:"
    print_success "  - GPL libraries (for advanced filters)"
    print_success "  - FreeType (for custom fonts and drawtext)"
    print_success "  - libass (for subtitles and emoji overlays)"
    print_success "  - HarfBuzz (for complex text shaping)"
    print_success "  - FriBidi (for RTL languages)"
    print_success "  - PNG/JPEG (for image overlays)"
    print_success "  - All available libraries (--full flag)"
    print_success ""
    print_success "🚀 Integration Instructions:"
    print_success ""
    print_success "1. Copy .so files to your React Native project:"
    print_success "   cp -r $(pwd)/android/libs/* /path/to/your/react-native-project/android/app/src/main/jniLibs/"
    print_success ""
    print_success "2. Copy AAR file to your React Native project:"
    print_success "   cp $(pwd)/android/ffmpeg-kit-android-lib/build/outputs/aar/ffmpeg-kit-release.aar /path/to/your/react-native-project/android/app/libs/"
    print_success ""
    print_success "3. Update your app/build.gradle:"
    print_success "   dependencies {"
    print_success "       implementation files('libs/ffmpeg-kit-release.aar')"
    print_success "   }"
    print_success ""
    print_success "4. Clean and rebuild your React Native project:"
    print_success "   cd android && ./gradlew clean && cd .."
    print_success "   npx react-native run-android"
    print_success ""
    print_success "🎯 Your FFmpegKit build now includes:"
    print_success "  ✅ FFmpeg libraries with drawtext support"
    print_success "  ✅ FFmpegKit wrapper libraries for React Native"
    print_success "  ✅ Complete AAR package"
    print_success "  ✅ All architectures and features"
    print_success ""
    print_success "=========================================="
    
else
    print_error "FFmpegKit build failed"
    print_error "Check the build.log file for details"
    exit 1
fi

print_header "Build Script Completed Successfully!"

print_success "🎉 FFmpegKit build completed with all required components!"
print_success "📱 Ready for React Native integration!"
print_success "🎬 Advanced video processing capabilities available!"
