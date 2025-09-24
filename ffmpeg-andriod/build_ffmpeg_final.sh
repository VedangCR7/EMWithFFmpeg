#!/bin/bash
# Final FFmpeg Build Script for Android with NDK r27c
set -e

FFMPEG_VERSION="6.1.1"
BUILD_DIR="ffmpeg-build"
OUTPUT_DIR="android/app/src/main/jniLibs"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  FFmpeg ${FFMPEG_VERSION} Android Build${NC}"
echo -e "${BLUE}  NDK r27c Compatible${NC}"
echo -e "${BLUE}========================================${NC}"

# Set Android NDK path
export ANDROID_NDK_ROOT="$HOME/Android/Sdk/ndk"
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

if [ ! -d "$ANDROID_NDK_ROOT" ]; then
    echo -e "${RED}❌ Android NDK not found at: $ANDROID_NDK_ROOT${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Android NDK found at: $ANDROID_NDK_ROOT${NC}"

# Host system detection
HOST_SYSTEM=$(uname -s | tr '[:upper:]' '[:lower:]')
HOST_ARCH=$(uname -m)
if [[ "$HOST_SYSTEM" == "linux" ]]; then
    TOOLCHAIN_HOST="linux-x86_64"
elif [[ "$HOST_SYSTEM" == "darwin" ]]; then
    TOOLCHAIN_HOST="darwin-x86_64"
else
    echo -e "${RED}❌ Unsupported host: $HOST_SYSTEM${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Detected host system: $HOST_SYSTEM-$HOST_ARCH${NC}"
echo -e "${GREEN}✅ Using toolchain: $TOOLCHAIN_HOST${NC}"

# Create build directory
echo -e "${YELLOW}📁 Creating build directory...${NC}"
mkdir -p $BUILD_DIR
cd $BUILD_DIR

# Download FFmpeg source
if [ ! -d "ffmpeg-${FFMPEG_VERSION}" ]; then
    echo -e "${YELLOW}📥 Downloading FFmpeg ${FFMPEG_VERSION}...${NC}"
    if ! wget https://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.xz; then
        echo -e "${RED}❌ Failed to download FFmpeg source${NC}"
        exit 1
    fi
    tar -xf ffmpeg-${FFMPEG_VERSION}.tar.xz
    echo -e "${GREEN}✅ FFmpeg source extracted${NC}"
else
    echo -e "${GREEN}✅ FFmpeg source already exists${NC}"
fi

cd ffmpeg-${FFMPEG_VERSION}

# Function to build FFmpeg for each architecture
build_ffmpeg() {
    local ARCH=$1
    local TARGET=$2
    local CPU=$3
    local API=$4
    
    echo -e "${BLUE}🔨 Building FFmpeg for ${ARCH} (API ${API})...${NC}"
    
    # Clean previous build
    make clean 2>/dev/null || true
    
    # Configure FFmpeg
    echo -e "${YELLOW}🔧 Configuring FFmpeg for ${ARCH}...${NC}"
    
    ./configure \
        --prefix=./android/${ARCH} \
        --enable-cross-compile \
        --target-os=android \
        --arch=${CPU} \
        --cross-prefix=${ANDROID_NDK_ROOT}/toolchains/llvm/prebuilt/${TOOLCHAIN_HOST}/bin/${TARGET}${API}- \
        --sysroot=${ANDROID_NDK_ROOT}/toolchains/llvm/prebuilt/${TOOLCHAIN_HOST}/sysroot \
        --extra-cflags="-O3 -fpic -DANDROID" \
        --extra-ldflags="-Wl,-soname,libavcodec.so" \
        --enable-shared \
        --disable-static \
        --disable-doc \
        --disable-ffmpeg \
        --disable-ffplay \
        --disable-ffprobe \
        --disable-avdevice \
        --enable-avformat \
        --enable-avcodec \
        --enable-swresample \
        --enable-swscale \
        --enable-avfilter \
        --enable-network \
        --enable-protocol=file \
        --enable-protocol=pipe \
        --enable-protocol=http \
        --enable-protocol=https \
        --enable-protocol=tcp \
        --enable-protocol=udp \
        --enable-gpl \
        --enable-nonfree \
        --enable-filter=overlay \
        --enable-filter=drawtext \
        --enable-filter=lut \
        --enable-filter=curves \
        --enable-filter=color \
        --enable-filter=eq \
        --enable-filter=hue \
        --enable-filter=saturation \
        --enable-filter=brightness \
        --enable-filter=contrast \
        --enable-filter=scale \
        --enable-filter=crop \
        --enable-filter=rotate \
        --enable-filter=transpose \
        --enable-filter=vflip \
        --enable-filter=hflip \
        --enable-small \
        --enable-optimizations \
        --enable-hardcoded-tables \
        --disable-debug \
        --disable-stripping \
        --enable-pic \
        --disable-vulkan
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ FFmpeg configuration failed for ${ARCH}${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ FFmpeg configured successfully for ${ARCH}${NC}"
    
    # Build
    echo -e "${YELLOW}⚙️ Compiling FFmpeg for ${ARCH}...${NC}"
    if ! make -j$(nproc); then
        echo -e "${YELLOW}⚠️ Parallel build failed, trying single-threaded build...${NC}"
        if ! make -j1; then
            echo -e "${RED}❌ Build failed for ${ARCH}${NC}"
            exit 1
        fi
    fi
    
    echo -e "${YELLOW}📦 Installing FFmpeg for ${ARCH}...${NC}"
    if ! make install; then
        echo -e "${RED}❌ Installation failed for ${ARCH}${NC}"
        exit 1
    fi
    
    # Verify installation
    if [ -d "./android/${ARCH}/lib" ] && [ "$(ls -A ./android/${ARCH}/lib/*.so 2>/dev/null)" ]; then
        echo -e "${GREEN}✅ Build completed for ${ARCH}${NC}"
        echo -e "${GREEN}📋 Libraries created:${NC}"
        ls -la ./android/${ARCH}/lib/*.so | awk '{print " " $9 " (" $5 " bytes)"}'
    else
        echo -e "${RED}❌ Build failed for ${ARCH} - no libraries found${NC}"
        exit 1
    fi
}

# Build for arm64-v8a (API 21+)
echo -e "${BLUE}🏗️ Starting ARM64 build...${NC}"
build_ffmpeg "arm64-v8a" "aarch64-linux-android" "arm64" "21"

# Build for armeabi-v7a (API 21+)
echo -e "${BLUE}🏗️ Starting ARMv7 build...${NC}"
build_ffmpeg "armeabi-v7a" "armv7a-linux-androideabi" "arm" "21"

# Copy libraries to output directory
echo -e "${YELLOW}📋 Copying libraries to output directory...${NC}"
mkdir -p ../../${OUTPUT_DIR}

# Copy arm64-v8a libraries
echo -e "${YELLOW}📁 Copying ARM64 libraries...${NC}"
mkdir -p ../../${OUTPUT_DIR}/arm64-v8a
if cp android/arm64-v8a/lib/*.so ../../${OUTPUT_DIR}/arm64-v8a/; then
    echo -e "${GREEN}✅ ARM64 libraries copied successfully${NC}"
    ls -la ../../${OUTPUT_DIR}/arm64-v8a/*.so | awk '{print " " $9 " (" $5 " bytes)"}'
else
    echo -e "${RED}❌ Failed to copy ARM64 libraries${NC}"
    exit 1
fi

# Copy armeabi-v7a libraries
echo -e "${YELLOW}📁 Copying ARMv7 libraries...${NC}"
mkdir -p ../../${OUTPUT_DIR}/armeabi-v7a
if cp android/armeabi-v7a/lib/*.so ../../${OUTPUT_DIR}/armeabi-v7a/; then
    echo -e "${GREEN}✅ ARMv7 libraries copied successfully${NC}"
    ls -la ../../${OUTPUT_DIR}/armeabi-v7a/*.so | awk '{print " " $9 " (" $5 " bytes)"}'
else
    echo -e "${RED}❌ Failed to copy ARMv7 libraries${NC}"
    exit 1
fi

# Verify final output
echo -e "${BLUE}🔍 Verifying final output...${NC}"
TOTAL_LIBS=$(find ../../${OUTPUT_DIR} -name "*.so" | wc -l)
echo -e "${GREEN}✅ Total libraries created: ${TOTAL_LIBS}${NC}"

if [ $TOTAL_LIBS -lt 16 ]; then
    echo -e "${RED}❌ Expected at least 16 libraries, found ${TOTAL_LIBS}${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 FFmpeg build completed successfully!${NC}"
echo -e "${GREEN}📁 Libraries copied to: ${OUTPUT_DIR}${NC}"

# Show library sizes
echo -e "${BLUE}📊 Library sizes:${NC}"
du -sh ../../${OUTPUT_DIR}/*

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up build directory...${NC}"
cd ../..
rm -rf $BUILD_DIR

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 Build process completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${YELLOW}1. Clean and rebuild your Android project${NC}"
echo -e "${YELLOW}2. Test on both ARM64 and ARMv7 devices${NC}"
echo -e "${YELLOW}3. Use FFmpegService for video overlay functionality${NC}"
echo -e "${BLUE}========================================${NC}"
