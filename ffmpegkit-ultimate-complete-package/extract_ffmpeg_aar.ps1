# Extract FFmpegKit AAR and Create Complete Integration
# This script extracts the AAR file and creates the complete FFmpegKit integration

Write-Host "🔍 Extracting FFmpegKit AAR for complete integration..." -ForegroundColor Blue
Write-Host "=====================================================" -ForegroundColor Blue

# Check if AAR file exists
$aarFile = "ffmpegkit-output/bundle-android-aar-lts/ffmpeg-kit/ffmpeg-kit.aar"
if (-not (Test-Path $aarFile)) {
    Write-Host "❌ FFmpegKit AAR file not found: $aarFile" -ForegroundColor Red
    Write-Host "❌ Please ensure the build completed successfully" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found FFmpegKit AAR: $aarFile" -ForegroundColor Green

# Create extraction directory
$extractDir = "ffmpeg-kit-aar-extracted"
if (Test-Path $extractDir) {
    Remove-Item -Path $extractDir -Recurse -Force
}
New-Item -ItemType Directory -Path $extractDir -Force | Out-Null

# Extract AAR file (AAR is just a ZIP file)
Write-Host "📦 Extracting AAR file..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $aarFile -DestinationPath $extractDir -Force
    Write-Host "✅ AAR extracted successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to extract AAR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check what was extracted
Write-Host "🔍 Analyzing extracted contents..." -ForegroundColor Blue
Get-ChildItem -Path $extractDir -Recurse | ForEach-Object {
    Write-Host "📁 $($_.FullName.Replace((Get-Location).Path, ''))" -ForegroundColor Gray
}

# Look for JNI libraries
$jniLibsPath = "$extractDir/jni"
if (Test-Path $jniLibsPath) {
    Write-Host "✅ Found JNI libraries directory" -ForegroundColor Green
    
    # Check architectures
    $architectures = Get-ChildItem -Path $jniLibsPath -Directory
    foreach ($arch in $architectures) {
        $libCount = (Get-ChildItem -Path $arch.FullName -Filter "*.so" | Measure-Object).Count
        Write-Host "📊 $($arch.Name): $libCount libraries" -ForegroundColor Cyan
        
        # List the libraries
        Get-ChildItem -Path $arch.FullName -Filter "*.so" | ForEach-Object {
            Write-Host "  📄 $($_.Name)" -ForegroundColor White
        }
    }
} else {
    Write-Host "❌ JNI libraries directory not found in AAR" -ForegroundColor Red
    Write-Host "🔍 Available directories:" -ForegroundColor Yellow
    Get-ChildItem -Path $extractDir -Directory | ForEach-Object {
        Write-Host "  📁 $($_.Name)" -ForegroundColor Gray
    }
}

# Check for AndroidManifest.xml
$manifestPath = "$extractDir/AndroidManifest.xml"
if (Test-Path $manifestPath) {
    Write-Host "✅ Found AndroidManifest.xml" -ForegroundColor Green
} else {
    Write-Host "⚠️ AndroidManifest.xml not found" -ForegroundColor Yellow
}

# Check for classes.jar
$classesJarPath = "$extractDir/classes.jar"
if (Test-Path $classesJarPath) {
    Write-Host "✅ Found classes.jar" -ForegroundColor Green
} else {
    Write-Host "⚠️ classes.jar not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "AAR EXTRACTION ANALYSIS COMPLETED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the extracted contents above" -ForegroundColor White
Write-Host "2. If JNI libraries are found, we can integrate them" -ForegroundColor White
Write-Host "3. If not, we need to rebuild FFmpegKit properly" -ForegroundColor White
Write-Host ""
Write-Host "🎯 The AAR should contain both FFmpeg libraries AND FFmpegKit wrappers!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
