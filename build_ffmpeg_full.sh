#!/bin/bash

# FFmpeg Full Build Script
# This script builds FFmpeg with ALL available libraries including drawtext support
# Run this script on a Linux system with Android NDK and SDK installed

set -e  # Exit on any error

echo "🎬 Building FFmpeg with FULL library support..."
echo "=============================================="

# Check if required environment variables are set
if [[ -z ${ANDROID_SDK_ROOT} ]]; then
  echo "❌ Error: ANDROID_SDK_ROOT environment variable is not set"
  echo "Please set it to your Android SDK path, e.g.:"
  echo "export ANDROID_SDK_ROOT=/path/to/android-sdk"
  exit 1
fi

if [[ -z ${ANDROID_NDK_ROOT} ]]; then
  echo "❌ Error: ANDROID_NDK_ROOT environment variable is not set"
  echo "Please set it to your Android NDK path, e.g.:"
  echo "export ANDROID_NDK_ROOT=/path/to/android-ndk"
  exit 1
fi

echo "✅ Android SDK: ${ANDROID_SDK_ROOT}"
echo "✅ Android NDK: ${ANDROID_NDK_ROOT}"

# Navigate to ffmpeg-kit-main directory
if [[ ! -d "ffmpeg-kit-main" ]]; then
  echo "❌ Error: ffmpeg-kit-main directory not found"
  echo "Please run this script from the EventMarketersWorking directory"
  exit 1
fi

cd ffmpeg-kit-main

echo ""
echo "🔧 Building FFmpeg with ALL available libraries:"
echo "  - This includes freetype, fontconfig, and all other libraries"
echo "  - The drawtext filter will be fully supported"
echo "  - This is the most comprehensive build possible"
echo ""

# Make the android.sh script executable
chmod +x android.sh

# Build FFmpeg with ALL libraries (this includes everything needed for drawtext)
echo "🚀 Starting FULL FFmpeg build..."
echo "This may take 60-120 minutes depending on your system..."
echo "The build will include ALL available libraries for maximum compatibility"

./android.sh --full --enable-gpl --api-level=24

echo ""
echo "✅ FFmpeg FULL build completed!"

# Check if the build was successful
if [[ -d "prebuilt" ]]; then
  echo ""
  echo "📁 Build artifacts created in:"
  find prebuilt -name "*.aar" -type f | head -5
  
  echo ""
  echo "📋 Next steps:"
  echo "1. Copy the generated .aar files to your Android project"
  echo "2. Update your app/build.gradle to use the new FFmpeg libraries"
  echo "3. Test the drawtext filter functionality"
  
  echo ""
  echo "🔍 This build includes ALL FFmpeg filters and libraries:"
  echo "  - drawtext filter (with freetype + fontconfig)"
  echo "  - All video/audio codecs"
  echo "  - All filters and effects"
  echo "  - Maximum compatibility"
else
  echo "❌ Build failed - prebuilt directory not found"
  echo "Check the build.log file for error details"
  exit 1
fi

echo ""
echo "🎉 Script completed successfully!"
echo "Your FFmpeg build now has FULL functionality including drawtext filter!"
