# Copy Integrated FFmpeg Libraries to Main Project
# This script copies the integrated FFmpeg libraries to your main React Native project

Write-Host "🔄 Copying integrated FFmpeg libraries to main project..." -ForegroundColor Blue
Write-Host "=======================================================" -ForegroundColor Blue

# Check if integration directory exists
if (-not (Test-Path "ffmpeg-kit-integration/android/app/src/main/jniLibs")) {
    Write-Host "❌ ffmpeg-kit-integration directory not found!" -ForegroundColor Red
    Write-Host "❌ Please run this script from the EventMarketersWorking directory" -ForegroundColor Red
    exit 1
}

# Check if main project jniLibs exists
if (-not (Test-Path "android/app/src/main/jniLibs")) {
    Write-Host "❌ Main project jniLibs directory not found!" -ForegroundColor Red
    Write-Host "❌ Please run this script from the EventMarketersWorking directory" -ForegroundColor Red
    exit 1
}

# Create backup of current libraries
Write-Host "📁 Creating backup of current libraries..." -ForegroundColor Yellow
$backupName = "jniLibs_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
if (-not (Test-Path "android/app/src/main/$backupName")) {
    Copy-Item -Path "android/app/src/main/jniLibs" -Destination "android/app/src/main/$backupName" -Recurse
    Write-Host "✅ Backup created: $backupName" -ForegroundColor Green
} else {
    Write-Host "⚠️ Backup already exists, skipping backup creation" -ForegroundColor Yellow
}

# Copy integrated libraries to main project
Write-Host "📋 Copying integrated libraries to main project..." -ForegroundColor Blue

$architectures = @("arm64-v8a", "armeabi-v7a", "x86", "x86_64")

foreach ($arch in $architectures) {
    $sourceDir = "ffmpeg-kit-integration/android/app/src/main/jniLibs/$arch"
    $targetDir = "android/app/src/main/jniLibs/$arch"
    
    if (Test-Path $sourceDir) {
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force
        }
        
        # Copy all .so files from integration to main project
        $soFiles = Get-ChildItem -Path $sourceDir -Filter "*.so"
        foreach ($file in $soFiles) {
            Copy-Item -Path $file.FullName -Destination $targetDir -Force
            Write-Host "✅ Copied $($file.Name) to $arch" -ForegroundColor Green
        }
        
        # Check if we need to copy libffmpegkit.so files from backup
        $backupDir = "android/app/src/main/$backupName/$arch"
        if (Test-Path $backupDir) {
            $ffmpegkitFiles = Get-ChildItem -Path $backupDir -Filter "libffmpegkit*.so"
            foreach ($file in $ffmpegkitFiles) {
                Copy-Item -Path $file.FullName -Destination $targetDir -Force
                Write-Host "✅ Restored $($file.Name) to $arch" -ForegroundColor Green
            }
        }
        
        $libCount = (Get-ChildItem -Path $targetDir -Filter "*.so" | Measure-Object).Count
        Write-Host "📊 $arch`: $libCount total libraries" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ Source directory not found: $sourceDir" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "LIBRARY COPY COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ New FFmpeg libraries copied to main project" -ForegroundColor Green
Write-Host "✅ FFmpegKit wrapper libraries preserved" -ForegroundColor Green
Write-Host "✅ All architectures updated" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Clean and rebuild your Android project:" -ForegroundColor White
Write-Host "   cd android && ./gradlew clean && cd .." -ForegroundColor Gray
Write-Host "2. Run your React Native app:" -ForegroundColor White
Write-Host "   npx react-native run-android" -ForegroundColor Gray
Write-Host "3. Test video processing functionality" -ForegroundColor White
Write-Host ""
Write-Host "🎯 The drawtext filter should now work!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
