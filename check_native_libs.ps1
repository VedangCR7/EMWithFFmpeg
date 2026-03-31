# Script to identify native libraries in the Android build
# This helps identify which libraries might be causing 16 KB page size issues

Write-Host "=== Native Library Analysis for 16 KB Page Size Support ===" -ForegroundColor Cyan
Write-Host ""

# Check for AAB file
$aabPath = "android\app\build\outputs\bundle\release\MarketBrand.aab"
if (Test-Path $aabPath) {
    Write-Host "✅ Found AAB file: $aabPath" -ForegroundColor Green
    Write-Host "   Last modified: $((Get-Item $aabPath).LastWriteTime)" -ForegroundColor Gray
} else {
    Write-Host "❌ AAB file not found. Please build the AAB first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Packages with Native Libraries ===" -ForegroundColor Yellow
Write-Host ""

$nativePackages = @(
    @{Name="react-native"; Version="0.80.2"; Notes="Core React Native - includes Hermes, JSC, FbJNI"},
    @{Name="react-native-video"; Version="6.16.1"; Notes="Uses ExoPlayer native libraries"},
    @{Name="react-native-image-crop-picker"; Version="0.51.0"; Notes="Native image processing"},
    @{Name="react-native-image-picker"; Version="8.2.1"; Notes="Native camera/gallery access"},
    @{Name="react-native-fs"; Version="2.20.0"; Notes="Native file system operations"},
    @{Name="react-native-gesture-handler"; Version="2.27.2"; Notes="Native gesture recognition"},
    @{Name="react-native-screens"; Version="4.13.1"; Notes="Native screen management"},
    @{Name="react-native-razorpay"; Version="2.3.0"; Notes="Payment gateway native SDK"},
    @{Name="@react-native-firebase/app"; Version="22.4.0"; Notes="Firebase native libraries"},
    @{Name="@react-native-firebase/auth"; Version="22.4.0"; Notes="Firebase Auth native"},
    @{Name="@react-native-firebase/messaging"; Version="22.4.0"; Notes="Firebase Messaging native"},
    @{Name="@react-native-google-signin/google-signin"; Version="15.0.0"; Notes="Google Sign-In native SDK"},
    @{Name="react-native-linear-gradient"; Version="2.8.3"; Notes="Native gradient rendering"},
    @{Name="react-native-view-shot"; Version="4.0.3"; Notes="Native screenshot capture"},
    @{Name="react-native-permissions"; Version="5.4.2"; Notes="Native permissions handling"},
    @{Name="@react-native-camera-roll/camera-roll"; Version="7.10.2"; Notes="Native media access"},
    @{Name="react-native-share"; Version="12.2.1"; Notes="Native sharing functionality"}
)

foreach ($pkg in $nativePackages) {
    Write-Host "📦 $($pkg.Name) v$($pkg.Version)" -ForegroundColor White
    Write-Host "   $($pkg.Notes)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "=== Known 16 KB Page Size Issues ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  React Native 0.80.2:" -ForegroundColor Yellow
Write-Host "   - May use AGP less than 8.5.1 (which doesn't auto-align libraries)" -ForegroundColor Gray
Write-Host "   - Hermes engine needs to be built with 16 KB alignment" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  FFmpeg Kit (if used):" -ForegroundColor Yellow
Write-Host "   - Large native libraries that may not be 16 KB aligned" -ForegroundColor Gray
Write-Host "   - Check if using local FFmpeg build" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Third-party native libraries:" -ForegroundColor Yellow
Write-Host "   - Older versions may not support 16 KB pages" -ForegroundColor Gray
Write-Host "   - Need to check each library's compatibility" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Recommendations ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verify AGP version:" -ForegroundColor White
Write-Host "   Check if React Native 0.80.2 uses AGP 8.5.1+" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update React Native:" -ForegroundColor White
Write-Host "   Consider upgrading to React Native 0.81+ which has better 16 KB support" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check FFmpeg Kit:" -ForegroundColor White
Write-Host "   If using FFmpeg, ensure it's built with 16 KB alignment" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Update native dependencies:" -ForegroundColor White
Write-Host "   Update all native packages to latest versions with 16 KB support" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Use bundletool to analyze:" -ForegroundColor White
Write-Host "   java -jar bundletool.jar validate --bundle=MarketBrand.aab" -ForegroundColor Gray
Write-Host ""

