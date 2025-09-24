#!/bin/bash
# FFmpegKit Native Libraries Build Script for WSL Ubuntu
# This script builds FFmpegKit native libraries for React Native Android

set -e  # Exit on any error

echo "🚀 FFmpegKit Native Libraries Build Script"
echo "=========================================="

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

# Check if running in WSL
if ! grep -q Microsoft /proc/version; then
    print_error "This script must be run in WSL (Windows Subsystem for Linux)"
    exit 1
fi

print_status "Detected WSL environment"

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install build dependencies
print_status "Installing build dependencies..."
sudo apt install -y \
    git \
    cmake \
    ninja-build \
    yasm \
    nasm \
    pkg-config \
    autoconf \
    automake \
    libtool \
    make \
    wget \
    curl \
    unzip \
    openjdk-11-jdk \
    build-essential

print_success "Build dependencies installed"

# Set up Android SDK
print_status "Setting up Android SDK..."

# Create Android SDK directory
ANDROID_HOME="$HOME/Android/Sdk"
mkdir -p "$ANDROID_HOME"

# Download Android command line tools
print_status "Downloading Android command line tools..."
cd /tmp
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q commandlinetools-linux-11076708_latest.zip
mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
mv cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/"
rm -rf cmdline-tools commandlinetools-linux-11076708_latest.zip

# Set environment variables
print_status "Setting up environment variables..."
echo "export ANDROID_HOME=$ANDROID_HOME" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/build-tools" >> ~/.bashrc
echo "export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64" >> ~/.bashrc

# Source bashrc for current session
export ANDROID_HOME="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools"
export JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"

print_success "Environment variables set"

# Accept Android SDK licenses
print_status "Accepting Android SDK licenses..."
yes | sdkmanager --licenses

# Install required Android SDK components
print_status "Installing Android SDK components..."
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0" "ndk;26.1.10909125"

print_success "Android SDK components installed"

# Clone ffmpeg-kit repository
print_status "Cloning ffmpeg-kit repository..."
cd "$HOME"
if [ -d "ffmpeg-kit" ]; then
    print_warning "ffmpeg-kit directory already exists, updating..."
    cd ffmpeg-kit
    git pull
else
    git clone https://github.com/arthenica/ffmpeg-kit.git
    cd ffmpeg-kit
fi

print_success "ffmpeg-kit repository ready"

# Build FFmpegKit for armeabi-v7a
print_status "Building FFmpegKit for armeabi-v7a architecture..."
print_warning "This may take 30-60 minutes depending on your system..."

# Make the script executable
chmod +x android.sh

# Run the build script with specific flags for armeabi-v7a
./android.sh \
    --lts \
    --arch=arm-v7a \
    --enable-gpl \
    --disable-x86 \
    --disable-x86-64 \
    --disable-arm64-v8a \
    --disable-arm64-v8a-neon

if [ $? -eq 0 ]; then
    print_success "FFmpegKit build completed successfully!"
else
    print_error "FFmpegKit build failed!"
    exit 1
fi

# Find the generated libraries
print_status "Locating generated native libraries..."
LIB_DIR=$(find android -name "armeabi-v7a" -type d | head -1)

if [ -z "$LIB_DIR" ]; then
    print_error "Could not find armeabi-v7a directory with built libraries"
    exit 1
fi

print_success "Found libraries in: $LIB_DIR"

# List the generated .so files
print_status "Generated native libraries:"
ls -la "$LIB_DIR"/*.so

# Copy libraries to React Native project
print_status "Copying libraries to React Native project..."

# Navigate to Windows file system (React Native project)
RN_PROJECT_PATH="/mnt/c/EMWithFFmpeg/EventMarketersWorking"
RN_LIB_PATH="$RN_PROJECT_PATH/android/app/src/main/jniLibs/armeabi-v7a"

# Create target directory if it doesn't exist
mkdir -p "$RN_LIB_PATH"

# Copy all .so files
cp "$LIB_DIR"/*.so "$RN_LIB_PATH/"

print_success "Libraries copied to React Native project"

# Verify copied files
print_status "Verifying copied libraries:"
ls -la "$RN_LIB_PATH"/*.so

print_success "FFmpegKit native libraries setup completed!"
print_status "Next steps:"
echo "1. Run 'cd /mnt/c/EMWithFFmpeg/EventMarketersWorking'"
echo "2. Run 'cd android && ./gradlew clean'"
echo "3. Run 'cd .. && npx react-native run-android'"
echo "4. Test FFmpeg functionality in your app"

print_success "Script completed successfully! 🎉"

