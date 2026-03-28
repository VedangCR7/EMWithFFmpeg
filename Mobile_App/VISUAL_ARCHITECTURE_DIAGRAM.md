# MarketBrand Mobile App - Visual Architecture Diagram

## 1. MOBILE APP LAYER ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            MARKETBRAND MOBILE APP                              │
│                           (React Native 0.80.2)                              │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   SCREENS       │  │   COMPONENTS    │  │   NAVIGATION    │                │
│  │                 │  │                 │  │                 │                │
│  │ • HomeScreen    │  │ • Business      │  │ • Stack Nav     │                │
│  │ • LoginScreen   │  │   ProfileForm   │  │ • Tab Nav       │                │
│  │ • Registration  │  │ • ImagePicker   │  │ • Modal Nav     │                │
│  │ • PosterEditor  │  │ • TokenHandler  │  │                 │                │
│  │ • VideoEditor   │  │ • FloatingInput │  │                 │                │
│  │ • Templates     │  │ • LoadingModal  │  │                 │                │
│  │ • Profile       │  │                 │  │                 │                │
│  │ • Subscription  │  │                 │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                             STATE MANAGEMENT LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                        REACT QUERY (@tanstack)                             │  │
│  │  • Server State Management   • Caching (5-30min TTL)                     │  │
│  │  • Background Updates       • Retry Logic                                 │  │
│  │  • Offline Support          • Error Boundaries                            │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                          REACT CONTEXT                                   │  │
│  │  • ThemeContext (Light/Dark Mode)                                       │  │
│  │  • SubscriptionContext (User Subscription State)                          │  │
│  │  • AuthContext (User Authentication State)                               │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BUSINESS LOGIC LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   SERVICES      │  │     UTILS       │  │     HOOKS       │                │
│  │                 │  │                 │  │                 │                │
│  │ • auth.ts       │  │ • logger.ts     │  │ • useAuth       │                │
│  │ • api.ts        │  │ • notchUtils    │  │ • useTheme      │                │
│  │ • business      │  │ • cacheService  │  │ • useQuery      │                │
│  │   Profile.ts    │  │ • imageUtils    │  │ • useForm       │                │
│  │ • templates.ts  │  │ • validators    │  │                 │                │
│  │ • subscription  │  │ • helpers       │  │                 │                │
│  │   Api.ts       │  │                 │  │                 │                │
│  │ • calendarApi   │  │                 │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           DATA PERSISTENCE LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                        ASYNC STORAGE                                      │  │
│  │  • User Authentication Tokens                                            │  │
│  │  • User Profile Data                                                      │  │
│  │  • App Preferences                                                       │  │
│  │  • Cached API Responses                                                   │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                         FILE SYSTEM                                       │  │
│  │  • Downloaded Posters/Images                                            │  │
│  │  • Temporary Upload Files                                                │  │
│  │  • Cached Media Files                                                    │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 2. API INTEGRATION LAYER ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           API INTEGRATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                          AXIOS CONFIGURATION                               │  │
│  │  • Base URL: https://eventmarketersbackend.onrender.com                   │  │
│  │  • Timeout: 30 seconds                                                  │  │
│  │  • Content-Type: application/json                                        │  │
│  │  • Request/Response Interceptors                                         │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                      AUTHENTICATION INTERCEPTOR                           │  │
│  │  ┌─────────────────┐    ┌─────────────────┐                            │  │
│  │  │   REQUEST      │    │    RESPONSE     │                            │  │
│  │  │                 │    │                 │                            │  │
│  │  │ • Add JWT      │    │ • Cache GET     │                            │  │
│  │  │   Token        │    │   Responses     │                            │  │
│  │  │ • Log Requests │    │ • Handle 401    │                            │  │
│  │  │ • Error        │    │   Errors        │                            │  │
│  │  │   Handling     │    │ • Retry Logic    │                            │  │
│  │  └─────────────────┘    └─────────────────┘                            │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                         CACHING STRATEGY                                  │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │  │
│  │  │   REACT QUERY  │  │  ASYNC STORAGE  │  │   MEMORY CACHE  │        │  │
│  │  │                 │  │                 │  │                 │        │  │
│  │  │ • 5min TTL     │  │ • Persistent    │  │ • Fast Access   │        │  │
│  │  │ • Background    │  │   Storage       │  │ • Temporary     │        │  │
│  │  │   Updates      │  │ • Offline Data  │  │   Data          │        │  │
│  │  │ • Auto Retry   │  │ • User Prefs    │  │ • Session Data  │        │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API SERVER                                │
│  https://eventmarketersbackend.onrender.com                                   │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   AUTH API      │  │  BUSINESS API   │  │  CONTENT API    │                │
│  │                 │  │                 │  │                 │                │
│  │ • Login         │  │ • Profiles      │  │ • Templates     │                │
│  │ • Register      │  │ • Categories    │  │ • Posters       │                │
│  │ • Google OAuth  │  │ • Subscriptions │  │ • Videos        │                │
│  │ • Password      │  │ • Payments      │  │ • Calendar      │                │
│  │   Reset         │  │                 │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 3. AUTHENTICATION FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW DIAGRAM                             │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   USER ACTION   │    │   LOGIN SCREEN  │    │   AUTH SERVICE  │
│                 │    │                 │    │                 │
│ • Email/Password│───▶│ • Input Fields  │───▶│ • Validation    │
│ • Google OAuth  │    │ • Google Button │    │ • API Call      │
│ • Registration   │    │ • Error Display │    │ • Token Storage │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AUTH API      │    │   ASYNC STORAGE│    │   APP STATE    │
│                 │    │                 │    │                 │
│ POST /auth/login│    │ • authToken     │    │ • currentUser   │
│ POST /auth/google│   │ • currentUser   │    │ • isAuthenticated│
│ POST /auth/register│ │ • userPrefs     │    │ • navigation   │
│                 │    │                 │    │   state        │
│ Returns:        │    │                 │    │                 │
│ {user, token}   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        NAVIGATION REDIRECTION                                 │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   IF AUTH       │    │   IF NOT AUTH   │    │   APP NAVIGATOR │         │
│  │                 │    │                 │    │                 │         │
│  │ • MainApp      │    │ • AuthStack     │    │ • Stack Nav     │         │
│  │ • Tab Nav      │    │ • Login Screen  │    │ • Tab Nav       │         │
│  │ • Home Screen  │    │ • Registration  │    │ • Modal Nav     │         │
│  │ • Profile      │    │ • Forgot Pass   │    │ • Protected     │         │
│  │                 │    │                 │    │   Routes        │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        TOKEN EXPIRATION HANDLING                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  API Request ──▶ 401 Response ──▶ TokenExpirationHandler                     │
│       │                                      │                               │
│       │                                      ▼                               │
│       │                            ┌─────────────────┐                         │
│       │                            │   SHOW MODAL    │                         │
│       │                            │                 │                         │
│       │                            │ • "Session      │                         │
│       │                            │   Expired"      │                         │
│       │                            │ • Re-login      │                         │
│       │                            │   Option        │                         │
│       │                            │ • Stay Logged   │                         │
│       │                            │   In (until     │                         │
│       │                            │   explicit      │                         │
│       │                            │   logout)       │                         │
│       │                            └─────────────────┘                         │
│       │                                      │                               │
│       │                                      ▼                               │
│       │                            ┌─────────────────┐                         │
│       │                            │ USER ACTION     │                         │
│       │                            │                 │                         │
│       │                            │ • Re-login      │                         │
│       │                            │ • Continue      │                         │
│       │                            │ • Logout        │                         │
│       │                            └─────────────────┘                         │
│       │                                      │                               │
│       └──────────────────────────────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 4. DATA FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           END-TO-END DATA FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         USER LOGIN DATA FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Input ──▶ LoginScreen ──▶ auth.loginUser() ──▶ authApi.login()        │
│       │                │                │                │                      │
│       │                │                │                │                      │
│       ▼                ▼                ▼                ▼                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   CREDENTIALS   │ │   VALIDATION   │ │   HTTP POST    │               │
│  │                 │ │                 │ │                 │               │
│  │ • Email         │ │ • Format Check  │ │ /auth/login     │               │
│  │ • Password      │ │ • Required      │ │ Headers:        │               │
│  │ • Remember Me   │ │   Fields       │ │ Content-Type    │               │
│  │                 │ │ • Sanitization │ │ Authorization   │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                             │
│  Backend Response ──▶ {user, token} ──▶ AsyncStorage ──▶ App State          │
│       │                    │                │                │                  │
│       │                    │                │                │                  │
│       ▼                    ▼                ▼                ▼                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   JWT TOKEN     │ │   USER DATA    │ │   NAVIGATION   │               │
│  │                 │ │                 │ │                 │               │
│  │ • Bearer Token  │ │ • Profile Info  │ │ • MainApp       │               │
│  │ • Expiration    │ │ • Preferences   │ │ • Tab Nav       │               │
│  │ • Refresh       │ │ • Permissions   │ │ • Home Screen   │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        POSTER FETCHING DATA FLOW                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  HomeScreen Load ──▶ useQuery() ──▶ React Query Cache ──▶ API Call          │
│         │                │                │                │                    │
│         │                │                │                │                    │
│         ▼                ▼                ▼                ▼                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   CACHE CHECK   │ │   NETWORK       │ │   BACKEND       │               │
│  │                 │ │   REQUEST      │ │   PROCESSING    │               │
│  │ • Fresh Data?   │ │ • Axios Config  │ │ • Database      │               │
│  │ • TTL Valid?    │ │ • Auth Header   │ │ • Query         │               │
│  │ • Stale Data?   │ │ • Error Handle  │ │ • Response      │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                             │
│  API Response ──▶ React Query ──▶ Component Re-render ──▶ UI Update           │
│       │                │                │                │                    │
│       │                │                │                │                    │
│       ▼                ▼                ▼                ▼                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   CACHE STORE   │ │   STATE UPDATE  │ │   UI RENDER     │               │
│  │                 │ │                 │ │                 │               │
│  │ • 5min TTL      │ │ • Loading State │ │ • Poster Grid   │               │
│  │ • Background    │ │ • Data Update   │ │ • Lazy Loading  │               │
│  │   Refresh       │ │ • Error Handle  │ │ • Pull Refresh  │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       IMAGE UPLOAD DATA FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Action ──▶ ImagePicker ──▶ File Selection ──▶ FormData Creation      │
│       │               │               │                │                      │
│       │               │               │                │                      │
│       ▼               ▼               ▼                ▼                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   FILE ACCESS  │ │   FILE METADATA │ │   FORM DATA    │               │
│  │                 │ │                 │ │                 │               │
│  │ • Camera/Gallery│ │ • URI           │ │ • multipart/form│               │
│  │ • Permissions  │ │ • MIME Type     │ │   data          │               │
│  │ • File Size     │ │ • Name          │ │ • Base64/URI    │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                             │
│  Upload Request ──▶ API Service ──▶ Backend Process ──▶ Storage & Response    │
│         │               │               │                │                      │
│         │               │               │                │                      │
│         ▼               ▼               ▼                ▼                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   HTTP POST    │ │   SERVER       │ │   CLOUD        │               │
│  │                 │ │   PROCESSING    │ │   STORAGE      │               │
│  │ • Progress      │ │ • Validation    │ │ • Image Store  │               │
│  │ • Headers      │ │ • Resize        │ │ • URL Generation│               │
│  │ • Error Handle  │ │ • Compression   │ │ • CDN Setup    │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                             │
│  Upload Response ──▶ Component State ──▶ UI Update ──▶ User Feedback        │
│         │                  │               │                │                    │
│         │                  │               │                │                    │
│         ▼                  ▼               ▼                ▼                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   SUCCESS/ERROR │ │   STATE UPDATE  │ │   VISUAL       │               │
│  │                 │ │                 │ │   FEEDBACK     │               │
│  │ • File URL      │ │ • Loading State │ │ • Progress Bar  │               │
│  │ • Metadata      │ │ • Error Message │ │ • Success Toast │               │
│  │ • Status Code   │ │ • Data Refresh  │ │ • Error Alert   │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                     PAYMENT PROCESSING DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Subscription Screen ──▶ Razorpay SDK ──▶ Payment Process ──▶ Backend Verify   │
│          │                  │               │                │                     │
│          │                  │               │                │                     │
│          ▼                  ▼               ▼                ▼                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   PLAN SELECT  │ │   PAYMENT      │ │   TRANSACTION   │               │
│  │                 │ │   GATEWAY      │ │   PROCESSING    │               │
│  │ • Features      │ │                 │ │                 │               │
│  │ • Pricing       │ │ • Razorpay UI   │ │ • Payment ID    │               │
│  │ • Duration      │ │ • Card/UPI      │ │ • Validation    │               │
│  │ • Comparison    │ │ • Net Banking   │ │ • Subscription  │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                             │
│  Payment Success ──▶ Subscription Update ──▶ Context Update ──▶ Premium Features  │
│         │                  │                  │                │                    │
│         │                  │                  │                │                    │
│         ▼                  ▼                  ▼                ▼                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   USER ACCESS  │ │   APP STATE    │ │   FEATURE       │               │
│  │                 │ │                 │ │   UNLOCK        │               │
│  │ • Premium Plans │ │ • Subscription  │ │ • Advanced      │               │
│  │ • Valid Until  │ │   Context       │ │   Templates     │               │
│  │ • Auto Renew   │ │ • User Profile  │ │ • No Ads        │               │
│  │ • Cancel Option│ │ • Preferences   │ │ • Priority      │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 5. SCREEN NAVIGATION FLOW

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SCREEN NAVIGATION ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              APP STARTUP                                      │
│                                                                             │
│  App.tsx ──▶ ErrorBoundary ──▶ QueryClientProvider ──▶ SafeAreaProvider     │
│       │                │                │                │                      │
│       │                │                │                │                      │
│       ▼                ▼                ▼                ▼                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │ ThemeProvider   │ │SubscriptionCtx  │ │ AppNavigator   │               │
│  │                 │ │                 │ │                 │               │
│  │ • Light/Dark   │ │ • User Plans    │ │ • Auth Check    │               │
│  │ • Colors       │ │ • Status        │ │ • Route Logic   │               │
│  │ • Fonts        │ │ • Features      │ │ • Deep Links    │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                             │
│  Auth Check ──▶ isAuthenticated ? MainApp : AuthStack                           │
│       │                                                                   │
│       ▼                                                                   │
│  ┌─────────────────┐ ┌─────────────────┐                                   │
│  │   MAIN APP     │ │   AUTH STACK    │                                   │
│  │                 │ │                 │                                   │
│  │ • Tab Nav      │ │ • Splash Screen  │                                   │
│  │ • Home Screen  │ │ • Login Screen   │                                   │
│  │ • Templates    │ │ • Registration  │                                   │
│  │ • Profile      │ │ • Forgot Pass   │                                   │
│  └─────────────────┘ └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        TAB NAVIGATION STRUCTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                        BOTTOM TAB NAVIGATOR                              │  │
│  │                                                                     │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │  │
│  │  │    HOME     │ │  TEMPLATES  │ │ POSTER      │ │  GREETINGS  │  │  │
│  │  │             │ │             │ │ PLAYER      │ │             │  │  │
│  │  │ • Featured  │ │ • Gallery   │ │ • Floating  │ │ • Festival  │  │  │
│  │  │ • Events    │ │ • Categories│ │   Button    │ │ • Custom    │  │  │
│  │  │ • Calendar  │ │ • Search    │ │ • Quick     │ │ • Share     │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │  │
│  │                                                                     │  │
│  │  ┌─────────────┐                                                    │  │
│  │  │   PROFILE   │                                                    │  │
│  │  │             │                                                    │  │
│  │  │ • User Info │                                                    │  │
│  │  │ • Settings  │                                                    │  │
│  │  │ • Business  │                                                    │  │
│  │  │ • Logout    │                                                    │  │
│  │  └─────────────┘                                                    │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  MODAL NAVIGATION (Stack Navigator)                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │ Poster Editor   │ │ Video Editor    │ │ Business       │               │
│  │                 │ │                 │ │ Profiles        │               │
│  │ • Template      │ │ • Timeline      │ │ • Create/Edit   │               │
│  │ • Text/Effects  │ │ • Transitions   │ │ • Logo Upload   │               │
│  │ • Export        │ │ • Export        │ │ • Categories    │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │ Subscription    │ │ Help & Support  │ │ Settings       │               │
│  │                 │ │                 │ │                 │               │
│  │ • Plans         │ │ • FAQ           │ │ • Preferences   │               │
│  │ • Payment       │ │ • Contact       │ │ • Theme         │               │
│  │ • History       │ │ • About         │ │ • Notifications │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 6. ERROR HANDLING & RECOVERY FLOW

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       ERROR HANDLING ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  API Request ──▶ Error Interceptor ──▶ Error Classification ──▶ Recovery Strategy │
│       │                    │                    │                    │            │
│       │                    │                    │                    │            │
│       ▼                    ▼                    ▼                    ▼            │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   ERROR TYPES  │ │   ERROR HANDLER │ │   RECOVERY     │               │
│  │                 │ │                 │ │                 │               │
│  │ • Network      │ │ • 401 → Token   │ │ • Auto Retry    │               │
│  │ • Timeout      │ │   Expiration    │ │ • Fallback Data │               │
│  │ • Server (5xx) │ │ • 5xx → Server  │ │ • Cached Data   │               │
│  │ • Client (4xx) │ │   Error Modal   │ │ • User Action   │               │
│  │ • SSL/Cert     │ │ • Network       │ │ • Offline Mode  │               │
│  │   Errors       │ │   Error Toast  │ │ • Refresh       │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                             │
│  User Feedback ──▶ UI Update ──▶ State Recovery ──▶ Continue Operation      │
│         │               │               │                │                    │
│         │               │               │                │                    │
│         ▼               ▼               ▼                ▼                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   VISUAL       │ │   STATE        │ │   APP          │               │
│  │   FEEDBACK     │ │   MANAGEMENT   │ │   CONTINUITY    │               │
│  │                 │ │                 │ │                 │               │
│  │ • Error Modal   │ │ • Error State   │ │ • Graceful      │               │
│  │ • Toast        │ │ • Loading State │ │   Degradation   │               │
│  │ • Retry Button │ │ • Data Refresh  │ │ • Offline       │               │
│  │ • Fallback UI  │ │ • Cache Update  │ │   Support       │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## SUMMARY

This visual architecture diagram illustrates the complete MarketBrand mobile app structure with:

### **Key Architectural Layers**:
1. **Presentation Layer**: Screens, Components, Navigation
2. **State Management**: React Query + React Context
3. **Business Logic**: Services, Utils, Custom Hooks
4. **Data Persistence**: AsyncStorage + File System

### **API Integration**:
- Axios-based HTTP client with interceptors
- Multi-level caching strategy
- Comprehensive error handling
- Token-based authentication

### **Data Flow Patterns**:
- User authentication flow with JWT tokens
- Content fetching with React Query caching
- File upload with progress tracking
- Payment processing with Razorpay integration

### **Navigation Structure**:
- Conditional routing based on auth state
- Bottom tab navigation for main features
- Modal stack for overlays and editors
- Deep linking support

The architecture demonstrates a scalable, maintainable, and production-ready React Native application with proper separation of concerns and robust error handling.
