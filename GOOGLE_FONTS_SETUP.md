# Google Fonts Integration for React Native

This guide explains how to properly integrate Google Fonts into your React Native app.

## Current Implementation

The app now includes a font service (`src/services/fontService.ts`) that provides:

- **24 Google Fonts** across 5 categories:
  - Sans-serif: Roboto, Open Sans, Lato, Poppins, Montserrat, Inter, Nunito, Ubuntu
  - Serif: Playfair Display, Merriweather, Lora, Source Serif Pro
  - Display: Oswald, Bebas Neue, Anton, Righteous
  - Handwriting: Dancing Script, Pacifico, Great Vibes, Satisfy
  - Monospace: Roboto Mono, Source Code Pro, Fira Code, JetBrains Mono

- **System fonts** as fallback: System, serif, monospace, cursive, fantasy

## How to Use

### 1. Font Selection in UI
The font modal now displays:
- System fonts at the top
- Google Fonts organized by category
- Preview text showing the font style

### 2. Font Application
Fonts are applied using the `getFontFamily()` function which:
- Returns the actual font name for system fonts
- Returns the web font name for Google Fonts
- Falls back to system font if not found

## Complete Google Fonts Setup (Recommended)

For full Google Fonts support, you need to:

### Step 1: Install React Native Vector Icons (Optional)
```bash
npm install react-native-vector-icons
```

### Step 2: Download Font Files
1. Download the font files from Google Fonts
2. Place them in `src/assets/fonts/`
3. Update the font service to use local font files

### Step 3: Link Fonts (iOS)
1. Add font files to your Xcode project
2. Add font names to `Info.plist`:
```xml
<key>UIAppFonts</key>
<array>
    <string>Roboto-Regular.ttf</string>
    <string>OpenSans-Regular.ttf</string>
    <!-- Add all font files -->
</array>
```

### Step 4: Link Fonts (Android)
1. Place font files in `android/app/src/main/assets/fonts/`
2. Create `react-native.config.js` in project root:
```javascript
module.exports = {
  assets: ['./src/assets/fonts/']
};
```
3. Run: `npx react-native-asset`

### Step 5: Update Font Service
Update `src/services/fontService.ts` to use local font files:

```typescript
// Update the getFontFamily function
export const getFontFamily = (fontName: string): string => {
  // Check if it's a system font
  if (Object.values(SYSTEM_FONTS).includes(fontName)) {
    return fontName;
  }
  
  // Check if it's a Google Font
  const googleFont = GOOGLE_FONTS.find(font => font.name === fontName);
  if (googleFont) {
    // Use the font name directly (without file extension)
    return googleFont.name;
  }
  
  // Fallback to system font
  return SYSTEM_FONTS.default;
};
```

## Alternative: Web-based Font Loading

For a simpler approach, you can use web-based font loading:

### Step 1: Install Expo Font (if using Expo)
```bash
expo install expo-font
```

### Step 2: Load Fonts from Web
```typescript
import * as Font from 'expo-font';

const loadFonts = async () => {
  await Font.loadAsync({
    'Roboto': require('./assets/fonts/Roboto-Regular.ttf'),
    'OpenSans': require('./assets/fonts/OpenSans-Regular.ttf'),
    // Add all fonts
  });
};
```

## Current Status

✅ **Font Service Created**: Complete font management system
✅ **UI Integration**: Font modal with Google Fonts
✅ **Font Categories**: Organized by type (sans-serif, serif, display, etc.)
✅ **Fallback System**: Graceful degradation to system fonts

⚠️ **Font Files**: Need to be downloaded and linked for full functionality
⚠️ **Platform Setup**: iOS/Android configuration required for local fonts

## Testing

1. Open the poster editor
2. Select a text layer
3. Open the font style modal
4. Try different fonts to see the preview
5. Apply fonts to see them in the poster

## Troubleshooting

### Fonts Not Loading
- Check if font files are properly linked
- Verify font names in `Info.plist` (iOS)
- Ensure fonts are in the correct directory (Android)

### Font Names Not Working
- Use the exact font name from the font service
- Check for typos in font family names
- Verify the font is included in the GOOGLE_FONTS array

### Performance Issues
- Consider loading fonts asynchronously
- Use font subsets for better performance
- Implement font caching if needed

## Next Steps

1. Download the actual font files
2. Set up platform-specific font linking
3. Test fonts on both iOS and Android
4. Optimize font loading performance
5. Add more Google Fonts as needed
