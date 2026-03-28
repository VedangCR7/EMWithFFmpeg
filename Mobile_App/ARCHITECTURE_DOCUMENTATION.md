# MarketBrand Mobile App - Complete Architecture Documentation

## 1. HIGH-LEVEL ARCHITECTURE OVERVIEW

### Application Summary
- **App Name**: MarketBrand
- **Framework**: React Native 0.80.2
- **Platform**: Cross-platform mobile application (iOS & Android)
- **Primary Purpose**: Business poster/video creation and marketing platform
- **Architecture Pattern**: Component-based architecture with service layer separation

### Core Features
- User authentication (Email/Google OAuth)
- Business profile management
- Poster and video creation/editing
- Template gallery with categories
- Subscription management
- Calendar-based promotional content
- Multi-language support
- File upload/download management

---

## 2. MOBILE APP TECHNICAL ARCHITECTURE

### 2.1 Framework & Technology Stack

#### Core Framework
- **React Native**: 0.80.2 (Latest stable)
- **TypeScript**: 5.0.4 for type safety
- **React**: 19.1.0

#### Navigation Architecture
- **React Navigation**: v7.x
  - Stack Navigator for main app flow
  - Bottom Tab Navigator for primary navigation
  - Modal navigation for overlays

#### State Management
- **React Query (@tanstack/react-query)**: v5.90.11
  - Server state management
  - Caching and synchronization
  - Background updates and retries
- **React Context**: Local state management
  - ThemeContext: Light/Dark theme management
  - SubscriptionContext: User subscription state

#### UI & Styling
- **React Native Vector Icons**: Material Icons
- **React Native Linear Gradient**: Gradient backgrounds
- **React Native Safe Area Context**: Device compatibility
- **Responsive Design**: Custom scaling utilities

### 2.2 Project Structure Analysis

```
EMWithFFmpeg-master/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── BusinessProfileForm.tsx
│   │   ├── ImagePickerModal.tsx
│   │   ├── TokenExpirationHandler.tsx
│   │   └── [14 more components...]
│   ├── screens/            # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegistrationScreen.tsx
│   │   ├── PosterEditorScreen.tsx
│   │   └── [22 more screens...]
│   ├── services/           # API and business logic
│   │   ├── api.ts         # Base API configuration
│   │   ├── auth.ts        # Authentication service
│   │   ├── authApi.ts     # Authentication API calls
│   │   ├── businessProfile.ts
│   │   ├── templates.ts
│   │   └── [22 more services...]
│   ├── navigation/         # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   └── NavigationService.ts
│   ├── context/           # React Context providers
│   │   ├── ThemeContext.tsx
│   │   └── contexts/
│   │       └── SubscriptionContext.tsx
│   ├── utils/             # Utility functions
│   │   ├── logger.ts
│   │   ├── notchUtils.ts
│   │   └── [7 more utilities...]
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── config/            # Configuration files
│   │   └── queryClient.ts
│   ├── constants/         # App constants
│   └── assets/           # Static assets
├── android/              # Android-specific code
├── ios/                  # iOS-specific code
├── App.tsx              # Application entry point
└── package.json         # Dependencies and scripts
```

### 2.3 Application Entry Point

**App.tsx** serves as the root component with the following provider hierarchy:
```
ErrorBoundary
└── QueryClientProvider
    └── SafeAreaProvider
        └── ThemeProvider
            └── SubscriptionProvider
                └── AppNavigator
                    └── TokenExpirationHandler
```

### 2.4 Navigation System

#### Authentication Flow
1. **SplashScreen** → Initial loading and auth check
2. **LoginScreen** → User authentication
3. **RegistrationScreen** → New user registration
4. **ForgotPasswordScreen** → Password recovery

#### Main App Navigation
- **Stack Navigator**: Root navigation handling auth flow
- **Tab Navigator**: Bottom tabs for authenticated users
  - Home
  - Templates
  - Poster Player (center floating button)
  - Greetings
  - Profile

#### Modal Navigation
- Poster Editor
- Video Editor
- Business Profiles
- Subscription
- Settings screens

---

## 3. API INTEGRATION ARCHITECTURE

### 3.1 Base API Configuration

#### Primary Backend
- **Production URL**: `https://eventmarketersbackend.onrender.com`
- **Development URLs**: Commented local development servers
- **Timeout**: 30 seconds
- **Content Type**: `application/json`

#### Axios Configuration
```typescript
const api = axios.create({
  baseURL: 'https://eventmarketersbackend.onrender.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

### 3.2 Authentication System

#### Token Management
- **Storage**: AsyncStorage for JWT tokens
- **Header**: `Bearer ${token}` added to all requests
- **Expiration Handling**: Token expiration event system

#### Request/Response Interceptors
1. **Request Interceptor**: Automatically adds auth token
2. **Response Interceptor**: 
   - Caching for GET requests
   - Error handling (401, 5xx, network errors)
   - Token expiration detection

### 3.3 Caching Strategy

#### Multi-Level Caching
1. **React Query Cache**: In-memory caching with TTL
2. **AsyncStorage Cache**: Persistent caching for offline support
3. **API Response Cache**: Service-level caching

#### Cache Configuration
- **Business Categories**: 10 minutes
- **Home Content**: 5 minutes
- **Templates**: 5 minutes
- **Subscription Plans**: 15 minutes

### 3.4 Error Handling Strategy

#### Error Classification
- **Network Errors**: Connection issues, timeouts
- **Authentication Errors**: 401 token expiration
- **Server Errors**: 5xx backend issues
- **Client Errors**: 4xx validation issues

#### Error Recovery
- **Automatic Retries**: React Query retry logic
- **Token Refresh**: Automatic token expiration handling
- **Fallback Data**: Cached data for offline scenarios

---

## 4. API ENDPOINT DOCUMENTATION

### 4.1 Authentication Endpoints

#### Login API
- **Endpoint**: `/auth/login`
- **Method**: POST
- **Payload**: `{ email, password }`
- **Response**: `{ user, token }`
- **Used By**: LoginScreen

#### Registration API
- **Endpoint**: `/auth/register`
- **Method**: POST
- **Payload**: `{ email, password, companyName, phoneNumber }`
- **Response**: `{ user, token }`
- **Used By**: RegistrationScreen

#### Google OAuth
- **Endpoint**: `/auth/google`
- **Method**: POST
- **Payload**: Google OAuth token
- **Response**: `{ user, token }`
- **Used By**: LoginScreen

### 4.2 Business Profile Endpoints

#### Get Business Profiles
- **Endpoint**: `/api/business-profiles`
- **Method**: GET
- **Response**: `{ profiles: BusinessProfile[] }`
- **Used By**: BusinessProfilesScreen

#### Create Business Profile
- **Endpoint**: `/api/business-profiles`
- **Method**: POST
- **Payload**: Business profile data with logo
- **Response**: `{ profile }`
- **Used By**: BusinessProfileForm

### 4.3 Template & Content Endpoints

#### Get Templates
- **Endpoint**: `/api/mobile/templates`
- **Method**: GET
- **Query Params**: `{ category, page, limit }`
- **Response**: `{ templates: Template[] }`
- **Used By**: TemplateGalleryScreen

#### Get Home Content
- **Endpoint**: `/api/mobile/home/featured`
- **Method**: GET
- **Response**: `{ featured: Content[] }`
- **Used By**: HomeScreen

#### Get Calendar Posters
- **Endpoint**: `/api/mobile/calendar/posters`
- **Method**: GET
- **Query Params**: `{ date, month, year }`
- **Response**: `{ posters: Poster[] }`
- **Used By**: Calendar components

### 4.4 Business Categories

#### Get Categories
- **Endpoint**: `/api/mobile/business-categories/business`
- **Method**: GET
- **Response**: `{ categories: Category[] }`
- **Used By**: BusinessProfileForm

### 4.5 Subscription Endpoints

#### Get Plans
- **Endpoint**: `/api/mobile/subscriptions/plans`
- **Method**: GET
- **Response**: `{ plans: SubscriptionPlan[] }`
- **Used By**: SubscriptionScreen

#### Process Payment
- **Endpoint**: `/api/mobile/subscriptions/process-payment`
- **Method**: POST
- **Payload**: `{ planId, paymentId }`
- **Response**: `{ subscription }`
- **Used By**: SubscriptionScreen with Razorpay

---

## 5. DATA FLOW ARCHITECTURE

### 5.1 User Login Flow

```
User Action (LoginScreen)
    ↓
auth.loginUser(credentials)
    ↓
authApi.login(credentials) → HTTP POST /auth/login
    ↓
Backend validates credentials → Returns {user, token}
    ↓
auth.saveUserToStorage(user, token)
    ↓
AsyncStorage.setItem('currentUser', JSON.stringify(user))
AsyncStorage.setItem('authToken', token)
    ↓
notifyAuthStateListeners(user)
    ↓
AppNavigator re-renders → MainApp
```

### 5.2 Poster Fetching Flow

```
User Action (HomeScreen)
    ↓
React Query useQuery('home-featured', homeApi.getFeaturedContent)
    ↓
Check cache → If stale, API call
    ↓
HTTP GET /api/mobile/home/featured
    ↓
Backend returns featured content
    ↓
React Query caches response (5min TTL)
    ↓
Component re-renders with data
    ↓
UI displays posters with lazy loading
```

### 5.3 Image Upload Flow

```
User Action (BusinessProfileForm)
    ↓
ImagePicker.launchImageLibrary()
    ↓
User selects image → Local URI
    ↓
FormData.append('logo', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'logo.jpg'
})
    ↓
HTTP POST /api/business-profiles (multipart/form-data)
    ↓
Backend processes and stores image
    ↓
Returns profile with image URL
    ↓
UI updates with new logo
```

### 5.4 Subscription Payment Flow

```
User Action (SubscriptionScreen)
    ↓
Razorpay checkout initialization
    ↓
User completes payment → Razorpay payment ID
    ↓
subscriptionApi.processPayment(planId, paymentId)
    ↓
HTTP POST /api/mobile/subscriptions/process-payment
    ↓
Backend validates payment → Creates subscription
    ↓
Update SubscriptionContext
    ↓
UI reflects new subscription status
```

---

## 6. AUTHENTICATION ARCHITECTURE

### 6.1 Authentication Methods

#### Email/Password Authentication
- Traditional login with email and password
- JWT token-based session management
- Password reset flow via email

#### Google OAuth Integration
- Google Sign-In SDK integration
- OAuth token exchange with backend
- Automatic profile creation

### 6.2 Token Management

#### Storage Strategy
- **AsyncStorage**: Persistent token storage
- **Memory Cache**: Immediate access during app session
- **Auto-refresh**: Token expiration handling

#### Token Lifecycle
1. **Login**: Token stored in AsyncStorage
2. **Request**: Token added to Authorization header
3. **Expiration**: 401 response triggers expiration event
4. **Refresh**: User prompted to re-authenticate
5. **Logout**: Token cleared from storage

### 6.3 Protected Screens Logic

#### Authentication Guard
```typescript
// AppNavigator logic
const isAuthenticated = !!auth.currentUser;
if (!isAuthenticated) {
  return <AuthStack />; // Login, Registration, etc.
}
return <MainStack />; // Authenticated app
```

#### Token Expiration Handler
- **Detection**: 401 response in API interceptor
- **Event Emission**: DeviceEventEmitter emits TOKEN_EXPIRED_EVENT
- **User Notification**: Modal prompts for re-login
- **Graceful Logout**: User stays logged in until explicit action

---

## 7. FILE & IMAGE HANDLING

### 7.1 Image Selection

#### Image Picker Integration
- **react-native-image-picker**: Camera and gallery access
- **react-native-image-crop-picker**: Advanced cropping
- **Permissions**: Camera and storage permissions handled

#### Supported Formats
- **Images**: JPEG, PNG
- **Videos**: MP4, MOV
- **Size Limits**: Configurable per upload type

### 7.2 Upload Process

#### Multipart Form Data
```typescript
const formData = new FormData();
formData.append('file', {
  uri: localUri,
  type: mimeType,
  name: fileName
});
```

#### Progress Tracking
- Upload progress callbacks
- UI progress indicators
- Error handling for network issues

### 7.3 Storage Management

#### Local Storage
- **AsyncStorage**: User data, tokens, preferences
- **React Native FS**: Temporary file handling
- **Cache Management**: Automatic cleanup of old files

#### Cloud Storage
- **Backend URLs**: Absolute URLs constructed for media
- **CDN Integration**: Optimized content delivery
- **Thumbnail Generation**: Server-side image processing

---

## 8. BUILD & DEPLOYMENT ARCHITECTURE

### 8.1 Environment Configuration

#### Environment Variables
```bash
# .env file
RAZORPAY_KEY_ID=rzp_live_S8tV1Xh3vKd1fT
RAZORPAY_KEY_SECRET=pYenS9cC9j8l1J1DhI7WXaZd
```

#### Build Configuration
- **Metro Bundler**: JavaScript bundling
- **TypeScript Compilation**: Type checking and transpilation
- **Asset Optimization**: Image and font optimization

### 8.2 Android Build Setup

#### Gradle Configuration
- **Target SDK**: Latest Android API
- **Min SDK**: Android 5.0 (API 21)
- **ProGuard**: Code obfuscation for release builds

#### Signing Configuration
- **Debug Keystore**: Development builds
- **Release Keystore**: Production signing
- **Google Services**: Firebase integration

### 8.3 iOS Build Setup

#### Xcode Configuration
- **Deployment Target**: iOS 11.0+
- **Bundle Identifier**: Unique app identifier
- **Code Signing**: Apple Developer certificates

#### App Store Configuration
- **Info.plist**: App permissions and capabilities
- **Launch Screen**: App branding
- **App Icons**: Multiple sizes for different devices

### 8.4 Release Pipeline

#### Development Builds
```bash
npm run android    # Android debug build
npm run ios        # iOS debug build
```

#### Production Builds
```bash
# Android
cd android && ./gradlew assembleRelease

# iOS
# Build through Xcode Archive process
```

---

## 9. SECURITY CONSIDERATIONS

### 9.1 Data Protection

#### Sensitive Data
- **API Keys**: Stored in environment variables
- **User Tokens**: Encrypted storage in AsyncStorage
- **Payment Information**: Razorpay secure processing

#### Network Security
- **HTTPS**: All API calls over HTTPS
- **Certificate Pinning**: SSL certificate validation
- **Request Validation**: Input sanitization on client side

### 9.2 Authentication Security

#### Token Management
- **JWT Tokens**: Secure token format
- **Expiration Handling**: Automatic token refresh
- **Session Management**: Secure logout procedures

#### OAuth Integration
- **Google OAuth**: Official SDK integration
- **Scope Limitation**: Minimal requested permissions
- **Token Validation**: Server-side token verification

### 9.3 File Upload Security

#### File Validation
- **Type Checking**: MIME type validation
- **Size Limits**: Maximum file size enforcement
- **Malware Scanning**: Server-side file scanning

#### Permission Handling
- **Camera Permissions**: Runtime permission requests
- **Storage Access**: Granular permission model
- **User Consent**: Clear permission explanations

---

## 10. PERFORMANCE OPTIMIZATIONS

### 10.1 Rendering Optimization

#### React Optimizations
- **React.memo**: Component memoization
- **useMemo**: Expensive calculations caching
- **useCallback**: Function reference stability

#### List Virtualization
- **FlatList**: Efficient list rendering
- **Lazy Loading**: On-demand content loading
- **Image Caching**: Local image cache management

### 10.2 Network Optimization

#### Request Optimization
- **Request Batching**: Multiple requests combined
- **Compression**: GZIP compression enabled
- **Connection Pooling**: Reused HTTP connections

#### Caching Strategy
- **Multi-level Caching**: Memory + disk + network
- **Cache Invalidation**: Smart cache updates
- **Offline Support**: Cached data for offline mode

### 10.3 Memory Management

#### Component Lifecycle
- **Cleanup Functions**: Proper resource cleanup
- **Memory Leaks Prevention**: Subscription management
- **Image Optimization**: Efficient image loading

---

## CONCLUSION

The MarketBrand mobile application demonstrates a well-architected React Native app with:

- **Scalable Architecture**: Clear separation of concerns
- **Robust API Integration**: Comprehensive error handling and caching
- **Secure Authentication**: Multiple auth methods with proper token management
- **Performance Optimization**: Multi-level caching and rendering optimizations
- **Production Ready**: Complete build and deployment pipeline

The architecture supports future enhancements and maintains code quality through TypeScript, proper state management, and comprehensive error handling strategies.

---

**Document Generated**: February 2025  
**Architecture Version**: v1.0  
**React Native Version**: 0.80.2
