@echo off
REM App Icon Generator Script for EventMarketers (Windows)
REM This script generates app icons for Android and iOS from the main logo

echo 🎨 EventMarketers App Icon Generator
echo ==================================

REM Check if ImageMagick is installed
magick -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ImageMagick is not installed. Please install it first:
    echo    Download from https://imagemagick.org/script/download.php#windows
    pause
    exit /b 1
)

REM Source logo path
set SOURCE_LOGO=src\assets\MainLogo\main_logo.png

REM Check if source logo exists
if not exist "%SOURCE_LOGO%" (
    echo ❌ Source logo not found at: %SOURCE_LOGO%
    pause
    exit /b 1
)

echo ✅ Source logo found: %SOURCE_LOGO%

REM Create output directories
if not exist "android\app\src\main\res\mipmap-mdpi" mkdir "android\app\src\main\res\mipmap-mdpi"
if not exist "android\app\src\main\res\mipmap-hdpi" mkdir "android\app\src\main\res\mipmap-hdpi"
if not exist "android\app\src\main\res\mipmap-xhdpi" mkdir "android\app\src\main\res\mipmap-xhdpi"
if not exist "android\app\src\main\res\mipmap-xxhdpi" mkdir "android\app\src\main\res\mipmap-xxhdpi"
if not exist "android\app\src\main\res\mipmap-xxxhdpi" mkdir "android\app\src\main\res\mipmap-xxxhdpi"
if not exist "ios\EventMarketers\Images.xcassets\AppIcon.appiconset" mkdir "ios\EventMarketers\Images.xcassets\AppIcon.appiconset"

echo 📁 Created output directories

echo 🤖 Generating Android app icons...

REM Generate Android icons
magick "%SOURCE_LOGO%" -resize 48x48 "android\app\src\main\res\mipmap-mdpi\ic_launcher.png"
magick "%SOURCE_LOGO%" -resize 48x48 "android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png"

magick "%SOURCE_LOGO%" -resize 72x72 "android\app\src\main\res\mipmap-hdpi\ic_launcher.png"
magick "%SOURCE_LOGO%" -resize 72x72 "android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png"

magick "%SOURCE_LOGO%" -resize 96x96 "android\app\src\main\res\mipmap-xhdpi\ic_launcher.png"
magick "%SOURCE_LOGO%" -resize 96x96 "android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png"

magick "%SOURCE_LOGO%" -resize 144x144 "android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png"
magick "%SOURCE_LOGO%" -resize 144x144 "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png"

magick "%SOURCE_LOGO%" -resize 192x192 "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"
magick "%SOURCE_LOGO%" -resize 192x192 "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png"

echo ✅ Android app icons generated successfully!

echo 🍎 Generating iOS app icons...

REM Generate iOS icons
magick "%SOURCE_LOGO%" -resize 20x20 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-20.png"
magick "%SOURCE_LOGO%" -resize 29x29 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-29.png"
magick "%SOURCE_LOGO%" -resize 40x40 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-40.png"
magick "%SOURCE_LOGO%" -resize 58x58 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-58.png"
magick "%SOURCE_LOGO%" -resize 60x60 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-60.png"
magick "%SOURCE_LOGO%" -resize 76x76 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-76.png"
magick "%SOURCE_LOGO%" -resize 80x80 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-80.png"
magick "%SOURCE_LOGO%" -resize 87x87 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-87.png"
magick "%SOURCE_LOGO%" -resize 120x120 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-120.png"
magick "%SOURCE_LOGO%" -resize 152x152 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-152.png"
magick "%SOURCE_LOGO%" -resize 167x167 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-167.png"
magick "%SOURCE_LOGO%" -resize 180x180 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-180.png"
magick "%SOURCE_LOGO%" -resize 1024x1024 "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\icon-1024.png"

echo ✅ iOS app icons generated successfully!

REM Create iOS Contents.json file
echo { > "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo   "images" : [ >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-20.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "iphone", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "2x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "20x20" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-20.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "iphone", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "3x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "20x20" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-29.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "iphone", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "2x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "29x29" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-29.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "iphone", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "3x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "29x29" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-40.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "iphone", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "2x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "40x40" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-40.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "iphone", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "3x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "40x40" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-60.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "iphone", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "2x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "60x60" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-60.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "iphone", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "3x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "60x60" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-20.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "ipad", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "1x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "20x20" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-20.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "ipad", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "2x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "20x20" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-29.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "ipad", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "1x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "29x29" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-29.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "ipad", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "2x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "29x29" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-40.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "ipad", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "1x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "40x40" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-40.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "ipad", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "2x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "40x40" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-76.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "ipad", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "1x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "76x76" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-76.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "ipad", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "2x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "76x76" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-83.5.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "ipad", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "2x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "83.5x83.5" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     }, >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "filename" : "icon-1024.png", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "idiom" : "ios-marketing", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "scale" : "1x", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo       "size" : "1024x1024" >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     } >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo   ], >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo   "info" : { >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     "author" : "xcode", >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo     "version" : 1 >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo   } >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"
echo } >> "ios\EventMarketers\Images.xcassets\AppIcon.appiconset\Contents.json"

echo ✅ iOS Contents.json created successfully!

REM Create splash screen icon (512x512 for high quality)
magick "%SOURCE_LOGO%" -resize 512x512 splash-icon.png

echo ✅ Splash screen icon generated (512x512)

echo.
echo 🎉 App icon generation completed successfully!
echo.
echo 📱 Generated icons:
echo    Android: All density folders (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
echo    iOS: All required sizes for iPhone and iPad
echo    Splash: 512x512 high-quality icon
echo.
echo 📝 Next steps:
echo    1. Build your app to see the new icons
echo    2. Test on both Android and iOS devices
echo    3. Update splash screen if needed
echo.
echo ✨ Your EventMarketers app now has a professional logo!

pause
