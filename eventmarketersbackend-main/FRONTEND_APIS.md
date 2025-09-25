# 📱 Frontend APIs Documentation - EventMarketers App

**For Backend Team Integration**

---

## 🔗 API Configuration

**Base URL:** `http://localhost:3001` (Development)  
**Timeout:** 30 seconds  
**Content-Type:** `application/json`  
**Authentication:** Bearer token in Authorization header (where required)  

---

## 📊 API Summary

| Category | Total Endpoints | Auth Required | Mock Fallback |
|----------|----------------|---------------|---------------|
| **Home Screen** | 9 | Yes | ✅ Available |
| **Templates Screen** | 8 | Yes | ✅ Available |
| **Greetings Screen** | 8 | Yes | ✅ Available |
| **User Management** | 6 | No | ✅ Available |
| **Business Profile** | 2 | No | ✅ Available |
| **Content Management** | 3 | Yes | ✅ Available |
| **Subscription Management** | 6 | Yes | ✅ Available |
| **Transaction History** | 7 | No | ✅ Available |
| **Authentication** | 3 | No | ❌ N/A |
| **Health Check** | 1 | No | ❌ N/A |

**Total APIs:** 53 endpoints

---

## 🏠 HOME SCREEN APIs

### 📍 Service File: `src/services/homeApi.ts`

| # | Method | Endpoint | Auth | Description | Mock Fallback |
|---|--------|----------|------|-------------|---------------|
| 1 | `GET` | `/api/home/featured` | ✅ | Featured content/banners | ✅ Sample banners |
| 2 | `GET` | `/api/home/upcoming-events` | ✅ | Upcoming events | ✅ Festival events |
| 3 | `GET` | `/api/home/templates` | ✅ | Professional templates | ✅ Business templates |
| 4 | `GET` | `/api/home/video-content` | ✅ | Video templates | ✅ Video library |
| 5 | `GET` | `/api/home/search` | ✅ | Search all content | ✅ Local search |
| 6 | `POST` | `/api/home/templates/:id/like` | ✅ | Like template | ✅ Local state |
| 7 | `DELETE` | `/api/home/templates/:id/like` | ✅ | Unlike template | ✅ Local state |
| 8 | `POST` | `/api/home/videos/:id/like` | ✅ | Like video | ✅ Local state |
| 9 | `DELETE` | `/api/home/videos/:id/like` | ✅ | Unlike video | ✅ Local state |

### 📝 Request Examples:

```javascript
// Featured Content
GET /api/home/featured?limit=10&type=banner&active=true

// Upcoming Events  
GET /api/home/upcoming-events?limit=20&category=business&location=mumbai

// Professional Templates
GET /api/home/templates?limit=20&category=business&sortBy=popular

// Video Content
GET /api/home/video-content?limit=20&category=tutorial&duration=short

// Search Content
GET /api/home/search?q=business&type=templates&limit=20
```

---

## 📋 TEMPLATES SCREEN APIs

### 📍 Service File: `src/services/templatesBannersApi.ts`

| # | Method | Endpoint | Auth | Description | Mock Fallback |
|---|--------|----------|------|-------------|---------------|
| 1 | `GET` | `/api/templates` | ✅ | Get templates list | ✅ Template gallery |
| 2 | `GET` | `/api/templates/:id` | ✅ | Get template details | ✅ Template info |
| 3 | `GET` | `/api/templates/categories` | ✅ | Template categories | ✅ Category list |
| 4 | `GET` | `/api/templates/languages` | ✅ | Available languages | ✅ Language options |
| 5 | `POST` | `/api/templates/:id/like` | ✅ | Like template | ✅ Local state |
| 6 | `DELETE` | `/api/templates/:id/like` | ✅ | Unlike template | ✅ Local state |
| 7 | `POST` | `/api/templates/:id/download` | ✅ | Download template | ✅ Local tracking |
| 8 | `GET` | `/api/templates/search` | ✅ | Search templates | ✅ Local search |

### 📝 Request Examples:

```javascript
// Get Templates
GET /api/templates?category=business&language=en&type=daily&page=1&limit=10

// Template Categories
GET /api/templates/categories

// Template Languages  
GET /api/templates/languages

// Like Template
POST /api/templates/template-123/like

// Download Template
POST /api/templates/template-123/download
```

---

## 💬 GREETINGS SCREEN APIs

### 📍 Service File: `src/services/greetingTemplates.ts`

| # | Method | Endpoint | Auth | Description | Mock Fallback |
|---|--------|----------|------|-------------|---------------|
| 1 | `GET` | `/api/greeting-categories` | ✅ | Greeting categories | ✅ Category list |
| 2 | `GET` | `/api/greeting-templates` | ✅ | Greeting templates | ✅ Template gallery |
| 3 | `GET` | `/api/greeting-templates/:id` | ✅ | Template details | ✅ Template info |
| 4 | `POST` | `/api/greeting-templates/:id/like` | ✅ | Like template | ✅ Local state |
| 5 | `DELETE` | `/api/greeting-templates/:id/like` | ✅ | Unlike template | ✅ Local state |
| 6 | `POST` | `/api/greeting-templates/:id/download` | ✅ | Download template | ✅ Local tracking |
| 7 | `GET` | `/api/stickers` | ✅ | Get stickers | ✅ Sticker library |
| 8 | `GET` | `/api/emojis` | ✅ | Get emojis | ✅ Emoji library |

### 📝 Request Examples:

```javascript
// Greeting Categories
GET /api/greeting-categories

// Greeting Templates
GET /api/greeting-templates?category=good-morning&language=en&page=1&limit=10

// Search Greetings
GET /api/greeting-templates?search=festival&isPremium=false

// Like Greeting Template
POST /api/greeting-templates/greeting-123/like

// Get Stickers
GET /api/stickers

// Get Emojis
GET /api/emojis
```

---

## 👤 USER MANAGEMENT APIs

### 📍 Service File: `src/services/userService.ts`

| # | Method | Endpoint | Auth | Description | Mock Fallback |
|---|--------|----------|------|-------------|---------------|
| 1 | `POST` | `/api/installed-users/register` | ❌ | Register new user | ✅ Device ID gen |
| 2 | `GET` | `/api/installed-users/profile/:deviceId` | ❌ | Get user profile | ✅ Default profile |
| 3 | `PUT` | `/api/installed-users/profile/:deviceId` | ❌ | Update profile | ✅ Local storage |
| 4 | `POST` | `/api/installed-users/activity` | ❌ | Track user activity | ✅ Local tracking |
| 5 | `GET` | `/api/mobile/business-categories` | ❌ | Business categories | ✅ Category list |
| 6 | `GET` | `/health` | ❌ | API health check | ❌ Direct call |

### 📝 Request Examples:

```javascript
// Register User
POST /api/installed-users/register
{
  "name": "John Doe",
  "email": "john@example.com", 
  "phone": "+1234567890",
  "deviceId": "device-abc123"
}

// Get User Profile
GET /api/installed-users/profile/device-abc123

// Update Profile
PUT /api/installed-users/profile/device-abc123
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}

// Track Activity
POST /api/installed-users/activity
{
  "deviceId": "device-abc123",
  "action": "VIEW",
  "resourceType": "TEMPLATE", 
  "resourceId": "template-123",
  "metadata": {"category": "business"}
}
```

---

## 🏢 BUSINESS PROFILE APIs

### 📍 Service File: `src/services/eventMarketersApi.ts`

| # | Method | Endpoint | Auth | Description | Mock Fallback |
|---|--------|----------|------|-------------|---------------|
| 1 | `POST` | `/api/business-profile/profile` | ❌ | Create business profile | ✅ Local creation |
| 2 | `POST` | `/api/business-profile/upload-logo` | ❌ | Upload business logo | ✅ Local handling |

### 📝 Request Examples:

```javascript
// Create Business Profile
POST /api/business-profile/profile
{
  "businessName": "My Business",
  "ownerName": "Owner Name",
  "email": "business@example.com",
  "phone": "+1234567890", 
  "address": "123 Business St",
  "category": "Technology"
}

// Upload Logo (FormData)
POST /api/business-profile/upload-logo
FormData: { logo: File }
```

---

## 📁 CONTENT MANAGEMENT APIs

### 📍 Service File: `src/services/eventMarketersApi.ts`

| # | Method | Endpoint | Auth | Description | Mock Fallback |
|---|--------|----------|------|-------------|---------------|
| 1 | `GET` | `/api/content/images` | ✅ | Get images | ✅ Sample images |
| 2 | `GET` | `/api/content/videos` | ✅ | Get videos | ✅ Sample videos |
| 3 | `POST` | `/api/content/images` | ✅ | Upload image | ✅ Local handling |

### 📝 Request Examples:

```javascript
// Get Images
GET /api/content/images?category=business&page=1&limit=20

// Get Videos  
GET /api/content/videos?category=tutorial&page=1&limit=20

// Upload Image (FormData)
POST /api/content/images
FormData: { 
  image: File,
  title: "Image Title",
  category: "business",
  tags: '["tag1", "tag2"]'
}
```

---

## 💳 SUBSCRIPTION MANAGEMENT APIs

### 📍 Service File: `src/services/subscriptionApi.ts`

| # | Method | Endpoint | Auth | Description | Mock Fallback |
|---|--------|----------|------|-------------|---------------|
| 1 | `GET` | `/api/mobile/subscription/plans` | ✅ | Get subscription plans | ✅ Plan options |
| 2 | `POST` | `/api/mobile/subscription/subscribe` | ✅ | Subscribe to plan | ✅ Local state |
| 3 | `GET` | `/api/mobile/subscription/status` | ✅ | Get subscription status | ✅ Status simulation |
| 4 | `POST` | `/api/mobile/subscription/renew` | ✅ | Renew subscription | ✅ Local handling |
| 5 | `GET` | `/api/mobile/subscription/history` | ✅ | Get payment history | ✅ Transaction list |
| 6 | `POST` | `/api/mobile/subscription/cancel` | ✅ | Cancel subscription | ✅ Local state |

### 📍 Alternative Transaction Service: `src/services/transactionHistory.ts`

| # | Method | Function | Auth | Description | Storage |
|---|--------|----------|------|-------------|---------|
| 7 | `LOCAL` | `getTransactions()` | ❌ | Get all transactions | AsyncStorage |
| 8 | `LOCAL` | `addTransaction()` | ❌ | Add new transaction | AsyncStorage |
| 9 | `LOCAL` | `getTransactionById()` | ❌ | Get transaction by ID | AsyncStorage |
| 10 | `LOCAL` | `updateTransactionStatus()` | ❌ | Update transaction status | AsyncStorage |
| 11 | `LOCAL` | `getTransactionsByStatus()` | ❌ | Filter by status | AsyncStorage |
| 12 | `LOCAL` | `getTransactionsByDateRange()` | ❌ | Filter by date range | AsyncStorage |
| 13 | `LOCAL` | `getTransactionStats()` | ❌ | Get transaction statistics | AsyncStorage |

### 📝 Request Examples:

```javascript
// Get Subscription Plans
GET /api/mobile/subscription/plans

// Response:
{
  "success": true,
  "data": [
    {
      "id": "monthly_pro",
      "name": "Monthly Pro", 
      "price": 299,
      "originalPrice": 499,
      "savings": "40% OFF",
      "period": "month",
      "features": [
        "Access to all premium business templates",
        "Unlimited downloads",
        "High-resolution content", 
        "Priority customer support"
      ]
    }
  ]
}

// Subscribe to Plan
POST /api/mobile/subscription/subscribe
{
  "planId": "monthly_pro",
  "paymentMethod": "razorpay",
  "autoRenew": true
}

// Get Subscription Status
GET /api/mobile/subscription/status

// Response:
{
  "success": true,
  "data": {
    "isActive": true,
    "planId": "monthly_pro",
    "planName": "Monthly Pro",
    "startDate": "2025-09-01T00:00:00Z",
    "endDate": "2025-10-01T00:00:00Z", 
    "autoRenew": true,
    "status": "active"
  }
}

// Get Payment History
GET /api/mobile/subscription/history?page=1&limit=10

// Response:
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "sub_123",
        "plan": "monthly",
        "status": "ACTIVE",
        "amount": 299,
        "currency": "INR",
        "paymentId": "pay_razorpay_123",
        "paymentMethod": "Razorpay",
        "paidAt": "2025-09-01T00:00:00Z",
        "description": "Monthly Plan Subscription",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    },
    "summary": {
      "totalPayments": 5,
      "totalAmount": 1495,
      "currency": "INR"
    }
  }
}

// Cancel Subscription
POST /api/mobile/subscription/cancel

// Local Transaction Service Examples:
// Get All Transactions
const transactions = await transactionHistoryService.getTransactions();

// Add Transaction
await transactionHistoryService.addTransaction({
  paymentId: 'pay_xyz123',
  orderId: 'order_abc456', 
  amount: 299,
  currency: 'INR',
  status: 'success',
  plan: 'monthly',
  planName: 'Monthly Pro',
  description: 'Monthly subscription payment',
  method: 'razorpay'
});

// Get Transaction Stats
const stats = await transactionHistoryService.getTransactionStats();
```

---

## 🔐 AUTHENTICATION APIs

### 📍 Service File: `src/services/eventMarketersApi.ts`

| # | Method | Endpoint | Auth | Description | Response |
|---|--------|----------|------|-------------|----------|
| 1 | `POST` | `/api/auth/admin/login` | ❌ | Admin login | JWT token |
| 2 | `POST` | `/api/auth/subadmin/login` | ❌ | Subadmin login | JWT token |
| 3 | `GET` | `/api/auth/me` | ✅ | Get current user | User data |

### 📝 Request Examples:

```javascript
// Admin Login
POST /api/auth/admin/login
{
  "email": "admin@example.com",
  "password": "password123"
}

// Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "email": "...", "role": "admin" }
}
```

---

## 🔧 Error Handling & Fallback Strategy

### ✅ **Frontend Resilience:**

1. **API Failure**: Automatically falls back to mock data
2. **Network Issues**: Shows cached data or mock content
3. **Authentication**: Graceful handling of 401/403 errors
4. **Timeout**: 30-second timeout with retry logic

### 📝 **Error Response Format:**
```javascript
// Success Response
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}

// Error Response  
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error info"
}
```

---

## 🚀 Implementation Notes for Backend Team

### ✅ **Current Status:**
- **Health Check**: ✅ Working (`/health`)
- **Authentication Middleware**: ✅ Working (returns 401/403)
- **API Structure**: ✅ Properly organized
- **CORS**: ✅ Configured

### ⚠️ **Database Issue:**
```
Error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`
```

**Solution:** Fix `DATABASE_URL` environment variable in Backend/.env

### 🎯 **Priority Endpoints:**
1. **High Priority**: Home screen APIs (featured, events, templates, videos)
2. **Medium Priority**: Template management (categories, languages, search)
3. **Low Priority**: Advanced features (likes, downloads, analytics)

### 📋 **Request Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>", // For authenticated endpoints
  "Accept": "application/json"
}
```

### 🔄 **Pagination Format:**
```javascript
// Query Parameters
?page=1&limit=10&sortBy=createdAt&order=desc

// Response Format
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10, 
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 📱 Frontend Service Files

| Service File | Purpose | APIs Count |
|-------------|---------|------------|
| `src/services/homeApi.ts` | Home screen content | 9 APIs |
| `src/services/templatesBannersApi.ts` | Template management | 8 APIs |
| `src/services/greetingTemplates.ts` | Greeting templates | 8 APIs |
| `src/services/userService.ts` | User management | 6 APIs |
| `src/services/eventMarketersApi.ts` | Core backend APIs | 11 APIs |
| `src/services/contentService.ts` | Content management | 3 APIs |
| `src/services/subscriptionApi.ts` | Subscription management | 6 APIs |
| `src/services/transactionHistory.ts` | Transaction tracking | 7 APIs |

---

## 🎭 Mock Data Availability

**All frontend services have comprehensive mock data:**

### 🏠 **Home Screen Mock Data:**
- Featured content with images and CTAs
- Upcoming events with dates and locations  
- Professional templates with categories
- Video content with thumbnails and descriptions

### 📋 **Templates Mock Data:**
- Template gallery with various categories
- Language options (English, Hindi, Marathi)
- Template categories (free, premium, business)
- Like/download functionality simulation

### 💬 **Greetings Mock Data:**
- Greeting categories (good morning, festivals, etc.)
- Template collection with preview images
- Sticker and emoji libraries
- Search and filter functionality

### 👤 **User Management Mock Data:**
- Device ID generation
- User profile creation and updates
- Activity tracking simulation
- Business category listings

### 💳 **Subscription Mock Data:**
- Subscription plans (Monthly Pro, Yearly Pro)
- Payment status simulation
- Transaction history with sample data
- Premium feature access control

---

## 🚨 Critical Backend Requirements

### ✅ **Must Implement First:**
1. **Database Connection**: Fix PostgreSQL URL issue
2. **Authentication Middleware**: JWT token validation
3. **CORS Configuration**: Allow frontend domain
4. **Error Handling**: Consistent error response format

### 📋 **API Response Standards:**
```javascript
// Success responses must include:
{
  "success": true,
  "data": {...},
  "message": "Descriptive success message"
}

// Error responses must include:
{
  "success": false, 
  "error": "User-friendly error message",
  "details": "Technical error details"
}
```

### 🔐 **Authentication Flow:**
1. Admin/Subadmin login returns JWT token
2. Frontend stores token in AsyncStorage
3. All authenticated requests include `Authorization: Bearer <token>`
4. Backend validates token and returns 401 if invalid

---

## 🎯 Testing Instructions

### **For Backend Team:**

1. **Start Backend**: `npm run dev` in Backend directory
2. **Health Check**: `curl http://localhost:3001/health`
3. **Test APIs**: Use the provided request examples
4. **Verify Responses**: Check success/error format consistency

### **Integration Testing:**

The frontend has a built-in API test screen accessible via:
- Profile Screen → "Backend API Test" button
- Runs comprehensive tests against all endpoints
- Shows real-time success/failure status
- Displays response data and error messages

---

## 📞 Contact & Support

**Frontend Team:** Ready for integration testing  
**Mock Data:** Fully functional fallback system ensures app works during backend development  
**Testing:** Use React Native app's built-in API test screen for real-time validation  

---

**📝 Last Updated:** September 24, 2025  
**📊 Integration Status:** ✅ Frontend Ready | ⚠️ Backend Database Issue | 🎭 Mock Data Active
