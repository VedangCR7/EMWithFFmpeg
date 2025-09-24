# Download and Integrate Official FFmpegKit Package
# This script downloads the official FFmpegKit and integrates it with your project

Write-Host "📥 Downloading Official FFmpegKit Package..." -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue

# Create download directory
$downloadDir = "ffmpegkit-official"
if (Test-Path $downloadDir) {
    Remove-Item -Path $downloadDir -Recurse -Force
}
New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null

# FFmpegKit GitHub releases URL
$releasesUrl = "https://api.github.com/repos/arthenica/ffmpeg-kit/releases/latest"

Write-Host "🔍 Fetching latest FFmpegKit release information..." -ForegroundColor Yellow

try {
    # Get latest release info
    $releaseInfo = Invoke-RestMethod -Uri $releasesUrl
    $latestVersion = $releaseInfo.tag_name
    Write-Host "✅ Latest FFmpegKit version: $latestVersion" -ForegroundColor Green
    
    # Find the Android AAR asset
    $aarAsset = $releaseInfo.assets | Where-Object { $_.name -like "*android*" -and $_.name -like "*.aar" }
    
    if ($aarAsset) {
        Write-Host "📦 Found Android AAR: $($aarAsset.name)" -ForegroundColor Green
        Write-Host "📥 Downloading AAR file..." -ForegroundColor Yellow
        
        # Download the AAR file
        $aarPath = "$downloadDir/$($aarAsset.name)"
        Invoke-WebRequest -Uri $aarAsset.browser_download_url -OutFile $aarPath
        
        Write-Host "✅ AAR downloaded successfully: $aarPath" -ForegroundColor Green
        
        # Extract AAR file
        Write-Host "📦 Extracting AAR file..." -ForegroundColor Yellow
        $extractDir = "$downloadDir/extracted"
        New-Item -ItemType Directory -Path $extractDir -Force | Out-Null
        
        Expand-Archive -Path $aarPath -DestinationPath $extractDir -Force
        
        Write-Host "✅ AAR extracted successfully" -ForegroundColor Green
        
        # Analyze extracted contents
        Write-Host "🔍 Analyzing extracted AAR contents..." -ForegroundColor Blue
        
        # Check for JNI libraries
        $jniPath = "$extractDir/jni"
        if (Test-Path $jniPath) {
            Write-Host "✅ Found JNI libraries directory" -ForegroundColor Green
            
            # List architectures
            $architectures = Get-ChildItem -Path $jniPath -Directory
            Write-Host "📊 Available architectures:" -ForegroundColor Cyan
            foreach ($arch in $architectures) {
                $libCount = (Get-ChildItem -Path $arch.FullName -Filter "*.so" | Measure-Object).Count
                Write-Host "  🏗️ $($arch.Name): $libCount libraries" -ForegroundColor White
                
                # List key libraries
                $keyLibs = Get-ChildItem -Path $arch.FullName -Filter "*.so" | Where-Object { 
                    $_.Name -like "*ffmpegkit*" -or $_.Name -like "*avcodec*" -or $_.Name -like "*avfilter*" 
                }
                foreach ($lib in $keyLibs) {
                    Write-Host "    📄 $($lib.Name)" -ForegroundColor Gray
                }
            }
            
            # Check for FFmpegKit wrapper libraries
            $ffmpegkitLibs = Get-ChildItem -Path $jniPath -Recurse -Filter "*ffmpegkit*.so"
            if ($ffmpegkitLibs.Count -gt 0) {
                Write-Host "✅ Found FFmpegKit wrapper libraries!" -ForegroundColor Green
                foreach ($lib in $ffmpegkitLibs) {
                    Write-Host "  📄 $($lib.Name) in $($lib.Directory.Name)" -ForegroundColor White
                }
            } else {
                Write-Host "❌ FFmpegKit wrapper libraries not found" -ForegroundColor Red
            }
            
        } else {
            Write-Host "❌ JNI libraries directory not found" -ForegroundColor Red
        }
        
        # Check for classes.jar
        $classesJar = "$extractDir/classes.jar"
        if (Test-Path $classesJar) {
            Write-Host "✅ Found classes.jar (Java classes)" -ForegroundColor Green
        } else {
            Write-Host "❌ classes.jar not found" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "OFFICIAL FFMPEGKIT DOWNLOAD COMPLETED!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Cyan
        Write-Host "1. Review the extracted contents above" -ForegroundColor White
        Write-Host "2. If FFmpegKit wrappers are found, integrate them" -ForegroundColor White
        Write-Host "3. Combine with your custom FFmpeg libraries" -ForegroundColor White
        Write-Host ""
        Write-Host "🎯 This should give you the complete FFmpegKit package!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Android AAR asset not found in release" -ForegroundColor Red
        Write-Host "Available assets:" -ForegroundColor Yellow
        foreach ($asset in $releaseInfo.assets) {
            Write-Host "  📄 $($asset.name)" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ Failed to fetch release information: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔄 Alternative approach:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://github.com/arthenica/ffmpeg-kit/releases" -ForegroundColor White
    Write-Host "2. Download the latest Android AAR file manually" -ForegroundColor White
    Write-Host "3. Place it in the $downloadDir directory" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
}
