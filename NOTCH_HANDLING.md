# Notch Handling Implementation

This document explains how notch handling has been implemented in the EventMarketers React Native app.

## Overview

The app now properly handles notches and safe areas on both iOS and Android devices using `react-native-safe-area-context`. This ensures that content is not hidden behind notches, status bars, or navigation bars.

## Implementation Details

### 1. App-Level Setup

The main `App.tsx` is wrapped with `SafeAreaProvider`:

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
```

### 2. Screen-Level Implementation

All screens now use `SafeAreaView` from `react-native-safe-area-context` instead of React Native's built-in `SafeAreaView`:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

// In your screen component
<SafeAreaView 
  style={[styles.container, { backgroundColor: theme.colors.background }]}
  edges={['top', 'left', 'right']}
>
  {/* Your content */}
</SafeAreaView>
```

### 3. Edge Configuration

The `edges` prop controls which edges should respect safe areas:

- `['top', 'left', 'right']` - For screens with bottom tabs (excludes bottom edge)
- `['top', 'left', 'right', 'bottom']` - For full-screen content
- `['bottom', 'left', 'right']` - For screens that need bottom safe area only
- `[]` - No safe area handling

### 4. Status Bar Configuration

All screens now use consistent status bar configuration:

```tsx
<StatusBar 
  barStyle="light-content"
  backgroundColor="transparent" 
  translucent 
/>
```

## Utility Functions

### `src/utils/notchUtils.ts`

This file provides helper functions for notch handling:

- `hasNotch()` - Detects if the device has a notch
- `getSafeAreaEdges()` - Returns appropriate edges for different screen types
- `useNotchAwareInsets()` - Hook for getting safe area insets with notch awareness
- `getStatusBarConfig()` - Returns status bar configuration
- `getNotchAwarePadding()` - Returns padding values that account for notches

### `src/components/SafeAreaWrapper.tsx`

A reusable wrapper component that provides flexible safe area handling:

```tsx
<SafeAreaWrapper 
  screenType="top"
  backgroundColor={theme.colors.background}
>
  {/* Your content */}
</SafeAreaWrapper>
```

## Platform-Specific Configuration

### Android

The `android/app/src/main/res/values/styles.xml` includes:

```xml
<!-- Enable edge-to-edge display for notch support -->
<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
<!-- Enable translucent status bar -->
<item name="android:statusBarColor">@android:color/transparent</item>
<item name="android:navigationBarColor">@android:color/transparent</item>
<!-- Enable translucent system bars -->
<item name="android:windowTranslucentStatus">true</item>
<item name="android:windowTranslucentNavigation">true</item>
```

### iOS

The `ios/EventMarketers/Info.plist` includes:

```xml
<key>UIStatusBarStyle</key>
<string>UIStatusBarStyleLightContent</string>
<key>UIStatusBarHidden</key>
<false/>
<key>UIRequiresFullScreen</key>
<false/>
<key>UIStatusBarOverlaysWebView</key>
<false/>
```

## Updated Screens

The following screens have been updated with proper notch handling:

1. **HomeScreen** - Uses top, left, right edges (excludes bottom for tab bar)
2. **LoginScreen** - Uses top, left, right edges
3. **RegistrationScreen** - Uses top, left, right edges
4. **ProfileScreen** - Uses top, left, right edges
5. **EventsScreen** - Uses top, left, right edges
6. **BusinessProfilesScreen** - Uses top, left, right edges
7. **SplashScreen** - Uses top, left, right edges

## Best Practices

1. **Always use `react-native-safe-area-context`** instead of React Native's built-in `SafeAreaView`
2. **Configure edges appropriately** for each screen type
3. **Use consistent status bar styling** across the app
4. **Test on devices with notches** to ensure proper layout
5. **Use the utility functions** for consistent notch handling

## Testing

To test notch handling:

1. **iOS Simulator**: Use iPhone X or newer simulators
2. **Android Emulator**: Use devices with notches (Pixel 3 XL, etc.)
3. **Physical Devices**: Test on actual devices with notches

## Troubleshooting

If you encounter issues:

1. Ensure `SafeAreaProvider` wraps your entire app
2. Check that you're importing `SafeAreaView` from `react-native-safe-area-context`
3. Verify edge configuration is appropriate for your screen
4. Test on both iOS and Android devices with notches 