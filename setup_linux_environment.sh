#!/bin/bash

# Linux Environment Setup Script for FFmpeg Build
# This script helps you set up the required environment on Linux

echo "🐧 Linux Environment Setup for FFmpeg Build"
echo "============================================"

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
  echo "❌ This script is designed for Linux systems"
  echo "Current OS: $OSTYPE"
  exit 1
fi

echo "✅ Running on Linux: $OSTYPE"

# Check for required tools
echo ""
echo "🔍 Checking for required tools..."

# Check for wget/curl
if command -v wget &> /dev/null; then
  echo "✅ wget found"
elif command -v curl &> /dev/null; then
  echo "✅ curl found"
else
  echo "❌ Neither wget nor curl found. Please install one of them:"
  echo "  Ubuntu/Debian: sudo apt-get install wget"
  echo "  CentOS/RHEL: sudo yum install wget"
  exit 1
fi

# Check for unzip
if command -v unzip &> /dev/null; then
  echo "✅ unzip found"
else
  echo "❌ unzip not found. Please install it:"
  echo "  Ubuntu/Debian: sudo apt-get install unzip"
  echo "  CentOS/RHEL: sudo yum install unzip"
  exit 1
fi

# Check for Java
if command -v java &> /dev/null; then
  echo "✅ Java found: $(java -version 2>&1 | head -1)"
else
  echo "❌ Java not found. Please install OpenJDK 11 or higher:"
  echo "  Ubuntu/Debian: sudo apt-get install openjdk-11-jdk"
  echo "  CentOS/RHEL: sudo yum install java-11-openjdk-devel"
  exit 1
fi

echo ""
echo "📥 Setting up Android SDK and NDK..."

# Create android directory
mkdir -p ~/android

# Download Android SDK command line tools (if not present)
if [[ ! -d "~/android/sdk" ]]; then
  echo "📥 Downloading Android SDK command line tools..."
  cd ~/android
  wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  unzip commandlinetools-linux-11076708_latest.zip
  mkdir -p sdk/cmdline-tools/latest
  mv cmdline-tools/* sdk/cmdline-tools/latest/
  rm -rf cmdline-tools
  rm commandlinetools-linux-11076708_latest.zip
fi

# Set environment variables
echo ""
echo "🔧 Setting up environment variables..."

# Add to ~/.bashrc
cat >> ~/.bashrc << 'EOF'

# Android SDK and NDK paths
export ANDROID_SDK_ROOT=~/android/sdk
export ANDROID_NDK_ROOT=~/android/sdk/ndk/25.2.9519653
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
EOF

# Source the bashrc
source ~/.bashrc

echo "✅ Environment variables added to ~/.bashrc"
echo ""
echo "📋 Next steps:"
echo "1. Install Android SDK components:"
echo "   ~/android/sdk/cmdline-tools/latest/bin/sdkmanager --install 'platform-tools' 'platforms;android-33' 'build-tools;33.0.0' 'ndk;25.2.9519653'"
echo ""
echo "2. Restart your terminal or run: source ~/.bashrc"
echo ""
echo "3. Verify the setup:"
echo "   echo \$ANDROID_SDK_ROOT"
echo "   echo \$ANDROID_NDK_ROOT"
echo ""
echo "4. Run the FFmpeg build script:"
echo "   chmod +x build_ffmpeg_full.sh"
echo "   ./build_ffmpeg_full.sh"
echo ""
echo "🎉 Setup script completed!"
echo "Please follow the next steps above to complete the setup."
