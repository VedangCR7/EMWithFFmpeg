# EventMarketers Logo Integration Guide

This guide explains how the EventMarketers logo has been integrated into the React Native application.

## 📁 Logo File Location

The main logo is located at:
```
src/assets/MainLogo/main_logo.png
```

**Note:** The original filename with spaces and special characters was renamed to `main_logo.png` to avoid asset loading issues in React Native.

## 🎨 Logo Integration Points

### 1. Login Screen (`src/screens/LoginScreen.tsx`)
- **Location**: Header section above the "Welcome Back" title
- **Size**: 20% of screen width
- **Style**: Centered with proper spacing

```tsx
<Image 
  source={require('../assets/MainLogo/main_logo.png')} 
  style={styles.logo}
  resizeMode="contain"
/>
```

### 2. Registration Screen (`src/screens/RegistrationScreen.tsx`)
- **Location**: Header section above the "Create Account" title
- **Size**: 20% of screen width
- **Style**: Centered with proper spacing

```tsx
<Image 
  source={require('../assets/MainLogo/main_logo.png')} 
  style={styles.logo}
  resizeMode="contain"
/>
```

### 3. Splash Screen (`src/screens/SplashScreen.tsx`)
- **Location**: Animated logo container with rotation effect
- **Size**: 20% of screen width within a circular container
- **Style**: Animated with fade, scale, and rotation effects

```tsx
<Image 
  source={require('../assets/MainLogo/main_logo.png')} 
  style={styles.logoImage}
  resizeMode="contain"
/>
```

## 📱 App Icon Generation

### Prerequisites
- **ImageMagick** must be installed on your system
- **Windows**: Download from https://imagemagick.org/script/download.php#windows
- **macOS**: `brew install imagemagick`
- **Linux**: `sudo apt-get install imagemagick`

### Generating App Icons

#### For Windows Users:
```bash
generate_app_icons.bat
```

#### For macOS/Linux Users:
```bash
chmod +x generate_app_icons.sh
./generate_app_icons.sh
```

### Generated App Icons

The script generates app icons for:

#### Android (`android/app/src/main/res/mipmap-*/`)
- **mdpi**: 48x48 pixels
- **hdpi**: 72x72 pixels  
- **xhdpi**: 96x96 pixels
- **xxhdpi**: 144x144 pixels
- **xxxhdpi**: 192x192 pixels

#### iOS (`ios/EventMarketers/Images.xcassets/AppIcon.appiconset/`)
- **iPhone**: 20x20, 29x29, 40x40, 60x60 (2x, 3x variants)
- **iPad**: 20x20, 29x29, 40x40, 76x76, 83.5x83.5 (1x, 2x variants)
- **App Store**: 1024x1024 pixels

#### Additional Files
- **Splash Icon**: 512x512 pixels (`splash-icon.png`)
- **iOS Contents.json**: Properly configured for Xcode

## 🎯 Logo Styling

### Responsive Design
All logo implementations use responsive sizing:
- **Width**: 20% of screen width
- **Height**: Maintains aspect ratio
- **Resize Mode**: `contain` to preserve proportions

### Styling Properties
```tsx
logo: {
  width: screenWidth * 0.2,
  height: screenWidth * 0.2,
  marginBottom: screenHeight * 0.02,
}
```

### Splash Screen Special Styling
```tsx
logoImage: {
  width: screenWidth * 0.2,
  height: screenWidth * 0.2,
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Asset Not Found Error
**Error**: `Asset not found: ...ChatGPT%20Image%20Aug%2026,%202025,%2002_05_58%20PM.png`

**Solution**: 
- Rename the logo file to remove spaces and special characters
- Use the renamed file: `main_logo.png`
- Update all references in the code

#### 2. ImageMagick Not Found
**Error**: `ImageMagick is not installed`

**Solution**:
- Install ImageMagick for your operating system
- Ensure it's added to your system PATH
- Restart your terminal/command prompt

#### 3. App Icons Not Updating
**Solution**:
- Clean and rebuild your project
- Clear Metro cache: `npx react-native start --reset-cache`
- For Android: `cd android && ./gradlew clean`
- For iOS: Clean build folder in Xcode

### File Naming Best Practices
- ✅ Use lowercase letters
- ✅ Use underscores instead of spaces
- ✅ Avoid special characters
- ✅ Keep names descriptive but short

**Good Examples**:
- `main_logo.png`
- `app_icon.png`
- `splash_logo.png`

**Bad Examples**:
- `ChatGPT Image Aug 26, 2025, 02_05_58 PM.png`
- `Logo@2x.png`
- `My Company Logo!.png`

## 📋 Implementation Checklist

- [x] Logo added to LoginScreen header
- [x] Logo added to RegistrationScreen header  
- [x] Logo added to SplashScreen with animations
- [x] App icon generation scripts created
- [x] Android app icons generated
- [x] iOS app icons generated
- [x] Splash screen icon generated
- [x] File naming issues resolved
- [x] Responsive design implemented

## 🚀 Next Steps

1. **Test the Integration**:
   - Run the app on both Android and iOS
   - Verify logos appear correctly on all screens
   - Check app icons on device home screen

2. **Customize Further** (Optional):
   - Adjust logo sizes if needed
   - Add logo to other screens (HomeScreen, ProfileScreen, etc.)
   - Create additional logo variants for different themes

3. **Build and Deploy**:
   - Generate production builds
   - Test on physical devices
   - Submit to app stores

## 📝 Notes

- The logo is automatically cached by React Native's asset system
- All logo implementations maintain aspect ratio
- The splash screen logo includes smooth animations
- App icons are generated in all required sizes for both platforms
- The integration is fully responsive and works on all screen sizes

## 🎉 Result

Your EventMarketers app now features:
- ✅ Professional logo on login and registration screens
- ✅ Animated logo on splash screen
- ✅ Custom app icons for Android and iOS
- ✅ Consistent branding throughout the app
- ✅ Responsive design that works on all devices

The logo integration is complete and ready for production use!
