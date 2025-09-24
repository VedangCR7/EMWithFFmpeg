# FFmpegKit Native Libraries Build Script for WSL Ubuntu
# Run this script in WSL Ubuntu to build FFmpegKit native libraries

Write-Host "🚀 FFmpegKit Native Libraries Build Script" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue

# Check if WSL is available
try {
    $wslStatus = wsl --list --verbose 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "WSL not available"
    }
    Write-Host "✅ WSL detected" -ForegroundColor Green
} catch {
    Write-Host "❌ WSL not available. Please install WSL first:" -ForegroundColor Red
    Write-Host "   wsl --install" -ForegroundColor Yellow
    exit 1
}

# Check if Ubuntu is installed
$ubuntuInstalled = $wslStatus -match "Ubuntu"
if (-not $ubuntuInstalled) {
    Write-Host "📦 Installing Ubuntu in WSL..." -ForegroundColor Yellow
    wsl --install -d Ubuntu
    Write-Host "⚠️  System restart required. Please restart and run this script again." -ForegroundColor Yellow
    exit 0
}

Write-Host "✅ Ubuntu detected in WSL" -ForegroundColor Green

# Create the build script for WSL
$buildScript = @'
#!/bin/bash
set -e

echo "🚀 Starting FFmpegKit build process..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install build dependencies
echo "🔧 Installing build dependencies..."
sudo apt install -y git cmake ninja-build yasm nasm pkg-config autoconf automake libtool make wget curl unzip openjdk-11-jdk build-essential

# Setup Android SDK
echo "📱 Setting up Android SDK..."
ANDROID_HOME="$HOME/Android/Sdk"
mkdir -p "$ANDROID_HOME"

# Download Android command line tools
cd /tmp
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q commandlinetools-linux-11076708_latest.zip
mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
mv cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/"
rm -rf cmdline-tools commandlinetools-linux-11076708_latest.zip

# Set environment variables
echo "export ANDROID_HOME=$ANDROID_HOME" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/build-tools" >> ~/.bashrc
echo "export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64" >> ~/.bashrc

# Source for current session
export ANDROID_HOME="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools"
export JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"

# Accept licenses
echo "📋 Accepting Android SDK licenses..."
yes | sdkmanager --licenses

# Install SDK components
echo "📦 Installing Android SDK components..."
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0" "ndk;26.1.10909125"

# Clone and build FFmpegKit
echo "🔨 Building FFmpegKit..."
cd "$HOME"
if [ -d "ffmpeg-kit" ]; then
    echo "📁 Updating existing ffmpeg-kit repository..."
    cd ffmpeg-kit
    git pull
else
    echo "📥 Cloning ffmpeg-kit repository..."
    git clone https://github.com/arthenica/ffmpeg-kit.git
    cd ffmpeg-kit
fi

# Make script executable and build
chmod +x android.sh
echo "⏳ Building FFmpegKit for armeabi-v7a (this may take 30-60 minutes)..."
./android.sh --lts --arch=arm-v7a --enable-gpl --disable-x86 --disable-x86-64 --disable-arm64-v8a

# Find and copy libraries
echo "📋 Locating generated libraries..."
LIB_DIR=$(find android -name "armeabi-v7a" -type d | head -1)
if [ -z "$LIB_DIR" ]; then
    echo "❌ Could not find armeabi-v7a directory"
    exit 1
fi

echo "📁 Found libraries in: $LIB_DIR"
ls -la "$LIB_DIR"/*.so

# Copy to React Native project
echo "📋 Copying libraries to React Native project..."
RN_LIB_PATH="/mnt/c/EMWithFFmpeg/EventMarketersWorking/android/app/src/main/jniLibs/armeabi-v7a"
mkdir -p "$RN_LIB_PATH"
cp "$LIB_DIR"/*.so "$RN_LIB_PATH/"

echo "✅ Libraries copied successfully!"
echo "📋 Next steps:"
echo "1. Run: cd /mnt/c/EMWithFFmpeg/EventMarketersWorking"
echo "2. Run: cd android && ./gradlew clean"
echo "3. Run: cd .. && npx react-native run-android"
echo "4. Test FFmpeg functionality in your app"

echo "🎉 FFmpegKit build completed successfully!"
'@

# Write the script to a temporary file
$scriptPath = "build-ffmpeg-wsl.sh"
$buildScript | Out-File -FilePath $scriptPath -Encoding UTF8

Write-Host "📝 Build script created: $scriptPath" -ForegroundColor Green

# Copy script to WSL and execute
Write-Host "🚀 Starting build process in WSL Ubuntu..." -ForegroundColor Yellow
Write-Host "⏳ This process may take 30-60 minutes..." -ForegroundColor Yellow

# Execute the script in WSL
wsl -d Ubuntu bash -c "cd ~ && cat > build-ffmpeg-wsl.sh << 'EOF'
$buildScript
EOF
chmod +x build-ffmpeg-wsl.sh && ./build-ffmpeg-wsl.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ FFmpegKit build completed successfully!" -ForegroundColor Green
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run: cd android && ./gradlew clean" -ForegroundColor White
    Write-Host "2. Run: npx react-native run-android" -ForegroundColor White
    Write-Host "3. Test FFmpeg functionality in your app" -ForegroundColor White
} else {
    Write-Host "❌ Build failed. Check the logs above for errors." -ForegroundColor Red
    Write-Host "💡 Try running the manual steps in FFMPEG_FIX_GUIDE.md" -ForegroundColor Yellow
}

# Clean up
Remove-Item $scriptPath -ErrorAction SilentlyContinue

Write-Host "🎉 Script execution completed!" -ForegroundColor Green

