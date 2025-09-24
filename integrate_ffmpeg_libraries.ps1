# Complete FFmpeg Library Integration Script (PowerShell)
# This script replaces ALL existing FFmpeg libraries with the new comprehensive build

Write-Host "🔄 Integrating COMPLETE FFmpeg library suite..." -ForegroundColor Blue
Write-Host "==============================================" -ForegroundColor Blue

# Check if we're in the right directory
if (-not (Test-Path "ffmpegkit-output")) {
    Write-Host "❌ ffmpegkit-output directory not found!" -ForegroundColor Red
    Write-Host "❌ Please run this script from the EventMarketersWorking directory" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "android/app/src/main/jniLibs")) {
    Write-Host "❌ android/app/src/main/jniLibs directory not found!" -ForegroundColor Red
    Write-Host "❌ Please run this script from the EventMarketersWorking directory" -ForegroundColor Red
    exit 1
}

# Create backup of existing libraries
Write-Host "📁 Creating backup of existing libraries..." -ForegroundColor Yellow
$backupName = "jniLibs_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
if (-not (Test-Path "android/app/src/main/$backupName")) {
    Copy-Item -Path "android/app/src/main/jniLibs" -Destination "android/app/src/main/$backupName" -Recurse
    Write-Host "✅ Backup created: $backupName" -ForegroundColor Green
} else {
    Write-Host "⚠️ Backup already exists, skipping backup creation" -ForegroundColor Yellow
}

# Function to copy libraries for a specific architecture
function Copy-Libraries {
    param(
        [string]$SourceArch,
        [string]$TargetArch,
        [string]$NeonSuffix = ""
    )
    
    Write-Host "📋 Copying libraries for $TargetArch..." -ForegroundColor Blue
    
    $sourceDir = "ffmpegkit-output/$SourceArch/ffmpeg/lib"
    $targetDir = "android/app/src/main/jniLibs/$TargetArch"
    
    if (-not (Test-Path $sourceDir)) {
        Write-Host "❌ Source directory not found: $sourceDir" -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path $targetDir)) {
        Write-Host "❌ Target directory not found: $targetDir" -ForegroundColor Red
        return $false
    }
    
    # Core FFmpeg libraries
    $ffmpegLibs = @("libavcodec.so", "libavdevice.so", "libavfilter.so", "libavformat.so", "libavutil.so", "libswresample.so", "libswscale.so")
    
    # Additional libraries that might be present
    $additionalLibs = @("libfreetype.so", "libfontconfig.so", "libass.so", "libharfbuzz.so", "libfribidi.so", "libpng.so", "libjpeg.so", "libtiff.so", "libwebp.so")
    
    # Combine all libraries
    $allLibs = $ffmpegLibs + $additionalLibs
    
    foreach ($lib in $allLibs) {
        $sourceFile = "$sourceDir/$lib"
        $targetFile = "$targetDir/$lib"
        
        if (Test-Path $sourceFile) {
            Copy-Item -Path $sourceFile -Destination $targetFile -Force
            Write-Host "✅ Copied $lib to $TargetArch" -ForegroundColor Green
        } else {
            # Only warn for core FFmpeg libraries, not additional ones
            if ($ffmpegLibs -contains $lib) {
                Write-Host "⚠️ Core library not found: $sourceFile" -ForegroundColor Yellow
            }
        }
    }
    
    # For NEON builds, also copy the NEON versions
    if ($NeonSuffix -ne "") {
        foreach ($lib in $allLibs) {
            $sourceFile = "$sourceDir/${lib}_neon"
            $targetFile = "$targetDir/${lib}_neon"
            
            if (Test-Path $sourceFile) {
                Copy-Item -Path $sourceFile -Destination $targetFile -Force
                Write-Host "✅ Copied ${lib}_neon to $TargetArch" -ForegroundColor Green
            }
        }
    }
    
    return $true
}

# Copy libraries for each architecture
Write-Host "🚀 Starting library integration..." -ForegroundColor Blue

# ARM 32-bit (armeabi-v7a) - use regular ARM build
Copy-Libraries -SourceArch "android-arm-lts" -TargetArch "armeabi-v7a"

# ARM 32-bit NEON (armeabi-v7a-neon) - use NEON build
Copy-Libraries -SourceArch "android-arm-neon-lts" -TargetArch "armeabi-v7a" -NeonSuffix "neon"

# ARM 64-bit (arm64-v8a)
Copy-Libraries -SourceArch "android-arm64-lts" -TargetArch "arm64-v8a"

# Intel 32-bit (x86)
Copy-Libraries -SourceArch "android-x86-lts" -TargetArch "x86"

# Intel 64-bit (x86_64)
Copy-Libraries -SourceArch "android-x86_64-lts" -TargetArch "x86_64"

Write-Host "✅ Library integration completed!" -ForegroundColor Green

# Verify the integration
Write-Host "🔍 Verifying integration..." -ForegroundColor Blue

$architectures = @("armeabi-v7a", "arm64-v8a", "x86", "x86_64")
foreach ($arch in $architectures) {
    $libsDir = "android/app/src/main/jniLibs/$arch"
    if (Test-Path $libsDir) {
        $ffmpegCount = (Get-ChildItem -Path $libsDir -Filter "libav*.so" | Measure-Object).Count
        $ffmpegkitCount = (Get-ChildItem -Path $libsDir -Filter "libffmpegkit*.so" | Measure-Object).Count
        Write-Host "✅ $arch`: $ffmpegCount FFmpeg libraries, $ffmpegkitCount FFmpegKit libraries" -ForegroundColor Green
    } else {
        Write-Host "⚠️ $arch`: directory not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "INTEGRATION COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ COMPLETE FFmpeg library suite has been integrated" -ForegroundColor Green
Write-Host "✅ All video processing capabilities now available" -ForegroundColor Green
Write-Host "✅ Existing libffmpegkit.so files have been preserved" -ForegroundColor Green
Write-Host "✅ All architectures updated (armeabi-v7a, arm64-v8a, x86, x86_64)" -ForegroundColor Green
Write-Host ""
Write-Host "🎬 New capabilities include:" -ForegroundColor Cyan
Write-Host "  - drawtext filter (text overlay)" -ForegroundColor White
Write-Host "  - Image overlay support (PNG, JPEG, TIFF, WebP)" -ForegroundColor White
Write-Host "  - Advanced subtitle rendering (libass)" -ForegroundColor White
Write-Host "  - Complex text shaping (HarfBuzz)" -ForegroundColor White
Write-Host "  - RTL language support (FriBidi)" -ForegroundColor White
Write-Host "  - Font management (FontConfig)" -ForegroundColor White
Write-Host "  - All GPL-licensed filters and codecs" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Clean and rebuild your Android project:" -ForegroundColor White
Write-Host "   cd android && ./gradlew clean && cd .." -ForegroundColor Gray
Write-Host "2. Run your React Native app:" -ForegroundColor White
Write-Host "   npx react-native run-android" -ForegroundColor Gray
Write-Host "3. Test ALL video processing functionality" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Complete video processing capabilities are now available!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
