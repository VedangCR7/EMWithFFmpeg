# EventMarketers - React Native App Setup

This React Native app includes Firebase Auth (OTP + Google Sign-In), React Navigation, Axios for API requests, Razorpay SDK, and FCM for push notifications.

## Prerequisites

- Node.js (>=18)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Firebase project
- Google Cloud Console project
- Razorpay account

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **iOS specific setup (macOS only):**
   ```bash
   cd ios && pod install && cd ..
   ```

## Configuration

### 1. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add Android and iOS apps to your Firebase project
3. Download the configuration files:
   - `google-services.json` for Android (place in `android/app/`)
   - `GoogleService-Info.plist` for iOS (place in `ios/EventMarketers/`)

4. Update `src/constants/firebase.ts` with your Firebase configuration:
   ```typescript
   export const FIREBASE_CONFIG = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID"
   };
   ```

### 2. Google Sign-In Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Sign-In API
3. Create OAuth 2.0 credentials
4. Update `src/constants/firebase.ts`:
   ```typescript
   export const GOOGLE_SIGN_IN_CONFIG = {
     webClientId: 'YOUR_WEB_CLIENT_ID',
     offlineAccess: true,
   };
   ```

### 3. Razorpay Setup

1. Create a Razorpay account at [Razorpay](https://razorpay.com/)
2. Get your API keys from the dashboard
3. Update `src/constants/firebase.ts`:
   ```typescript
   export const RAZORPAY_CONFIG = {
     key: 'YOUR_RAZORPAY_KEY',
     currency: 'INR',
     name: 'EventMarketers',
     description: 'Event Marketing Platform',
   };
   ```

### 4. API Configuration

Update `src/services/api.ts` with your backend API endpoint:
```typescript
const api = axios.create({
  baseURL: 'https://your-api-endpoint.com/api',
  // ... other config
});
```

## Platform-Specific Setup

### Android

1. **Google Services:**
   - Place `google-services.json` in `android/app/`
   - Ensure the package name matches your Firebase project

2. **Razorpay:**
   - Add Razorpay repository to `android/build.gradle`:
     ```gradle
     allprojects {
         repositories {
             // ... other repos
             maven { url "https://dl.bintray.com/razorpay/maven" }
         }
     }
     ```

3. **Permissions:**
   - Add required permissions to `android/app/src/main/AndroidManifest.xml`:
     ```xml
     <uses-permission android:name="android.permission.INTERNET" />
     <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
     <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
     <uses-permission android:name="android.permission.VIBRATE" />
     <uses-permission android:name="android.permission.WAKE_LOCK" />
     ```

### iOS

1. **Google Services:**
   - Place `GoogleService-Info.plist` in `ios/EventMarketers/`
   - Add it to your Xcode project

2. **Razorpay:**
   - Add Razorpay pod to `ios/Podfile`:
     ```ruby
     pod 'razorpay-pod'
     ```

3. **URL Schemes:**
   - Add URL schemes in Xcode for Google Sign-In and Razorpay

## Running the App

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## Features

- **Authentication:**
  - Phone number OTP verification
  - Google Sign-In
  - Firebase Auth integration

- **Navigation:**
  - Stack navigation for auth flow
  - Bottom tab navigation for main app
  - Type-safe navigation with TypeScript

- **API Integration:**
  - Axios for HTTP requests
  - Request/response interceptors
  - Error handling

- **Payments:**
  - Razorpay integration
  - Payment flow management
  - Signature verification

- **Notifications:**
  - Firebase Cloud Messaging (FCM)
  - Foreground/background message handling
  - Token management

## Project Structure

```
src/
├── components/          # Reusable UI components
├── constants/           # Configuration constants
├── navigation/          # Navigation setup
├── screens/            # Screen components
├── services/           # API and external services
└── utils/              # Utility functions
```

## Troubleshooting

1. **Metro bundler issues:**
   ```bash
   npx react-native start --reset-cache
   ```

2. **iOS build issues:**
   ```bash
   cd ios && pod deintegrate && pod install && cd ..
   ```

3. **Android build issues:**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

## Next Steps

1. Implement your backend API
2. Add more screens and features
3. Implement proper error handling
4. Add unit tests
5. Configure CI/CD pipeline
6. Add analytics and crash reporting 