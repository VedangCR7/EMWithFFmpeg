#!/bin/bash

# App Icon Generator Script for EventMarketers
# This script generates app icons for Android and iOS from the main logo

echo "🎨 EventMarketers App Icon Generator"
echo "=================================="

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed. Please install it first:"
    echo "   - Windows: Download from https://imagemagick.org/script/download.php#windows"
    echo "   - macOS: brew install imagemagick"
    echo "   - Linux: sudo apt-get install imagemagick"
    exit 1
fi

# Source logo path
SOURCE_LOGO="src/assets/MainLogo/main_logo.png"

# Check if source logo exists
if [ ! -f "$SOURCE_LOGO" ]; then
    echo "❌ Source logo not found at: $SOURCE_LOGO"
    exit 1
fi

echo "✅ Source logo found: $SOURCE_LOGO"

# Create output directories
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi
mkdir -p ios/EventMarketers/Images.xcassets/AppIcon.appiconset

echo "📁 Created output directories"

# Android Icon Sizes
# mdpi: 48x48
# hdpi: 72x72
# xhdpi: 96x96
# xxhdpi: 144x144
# xxxhdpi: 192x192

echo "🤖 Generating Android app icons..."

# Generate Android icons
convert "$SOURCE_LOGO" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert "$SOURCE_LOGO" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png

convert "$SOURCE_LOGO" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert "$SOURCE_LOGO" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png

convert "$SOURCE_LOGO" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert "$SOURCE_LOGO" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png

convert "$SOURCE_LOGO" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert "$SOURCE_LOGO" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png

convert "$SOURCE_LOGO" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
convert "$SOURCE_LOGO" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

echo "✅ Android app icons generated successfully!"

# iOS Icon Sizes
# 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024

echo "🍎 Generating iOS app icons..."

# Generate iOS icons
convert "$SOURCE_LOGO" -resize 20x20 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-20.png
convert "$SOURCE_LOGO" -resize 29x29 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-29.png
convert "$SOURCE_LOGO" -resize 40x40 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-40.png
convert "$SOURCE_LOGO" -resize 58x58 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-58.png
convert "$SOURCE_LOGO" -resize 60x60 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-60.png
convert "$SOURCE_LOGO" -resize 76x76 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-76.png
convert "$SOURCE_LOGO" -resize 80x80 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-80.png
convert "$SOURCE_LOGO" -resize 87x87 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-87.png
convert "$SOURCE_LOGO" -resize 120x120 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-120.png
convert "$SOURCE_LOGO" -resize 152x152 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-152.png
convert "$SOURCE_LOGO" -resize 167x167 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-167.png
convert "$SOURCE_LOGO" -resize 180x180 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-180.png
convert "$SOURCE_LOGO" -resize 1024x1024 ios/EventMarketers/Images.xcassets/AppIcon.appiconset/icon-1024.png

echo "✅ iOS app icons generated successfully!"

# Create iOS Contents.json file
cat > ios/EventMarketers/Images.xcassets/AppIcon.appiconset/Contents.json << 'EOF'
{
  "images" : [
    {
      "filename" : "icon-20.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "filename" : "icon-20.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20"
    },
    {
      "filename" : "icon-29.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "filename" : "icon-29.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29"
    },
    {
      "filename" : "icon-40.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "filename" : "icon-40.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40"
    },
    {
      "filename" : "icon-60.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60"
    },
    {
      "filename" : "icon-60.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60"
    },
    {
      "filename" : "icon-20.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "20x20"
    },
    {
      "filename" : "icon-20.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "filename" : "icon-29.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "29x29"
    },
    {
      "filename" : "icon-29.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "filename" : "icon-40.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "40x40"
    },
    {
      "filename" : "icon-40.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "filename" : "icon-76.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "76x76"
    },
    {
      "filename" : "icon-76.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "76x76"
    },
    {
      "filename" : "icon-83.5.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "83.5x83.5"
    },
    {
      "filename" : "icon-1024.png",
      "idiom" : "ios-marketing",
      "scale" : "1x",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

echo "✅ iOS Contents.json created successfully!"

# Create splash screen icon (512x512 for high quality)
convert "$SOURCE_LOGO" -resize 512x512 splash-icon.png

echo "✅ Splash screen icon generated (512x512)"

echo ""
echo "🎉 App icon generation completed successfully!"
echo ""
echo "📱 Generated icons:"
echo "   Android: All density folders (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)"
echo "   iOS: All required sizes for iPhone and iPad"
echo "   Splash: 512x512 high-quality icon"
echo ""
echo "📝 Next steps:"
echo "   1. Build your app to see the new icons"
echo "   2. Test on both Android and iOS devices"
echo "   3. Update splash screen if needed"
echo ""
echo "✨ Your EventMarketers app now has a professional logo!"
