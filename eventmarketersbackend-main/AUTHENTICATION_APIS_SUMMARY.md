# 🔐 Authentication APIs - Complete List

## 📊 **Authentication APIs Overview**

| System | Endpoints | Purpose | Status |
|--------|-----------|---------|--------|
| **Admin Authentication** | 3 | Admin panel access | ✅ Working |
| **Subadmin Authentication** | 3 | Subadmin panel access | ✅ Working |
| **Mobile Authentication** | 3 | Mobile app access | ✅ Working |
| **Customer Authentication** | 2 | Customer access | ✅ Working |

**Total Authentication APIs:** 11 endpoints

---

## 🔐 **1. ADMIN AUTHENTICATION APIs**

### **Base URL:** `/api/auth/admin`

| # | Method | Endpoint | Auth Required | Description | Response |
|---|--------|----------|---------------|-------------|----------|
| 1 | `POST` | `/api/auth/admin/login` | ❌ | Admin login with email/password | JWT token + admin data |
| 2 | `GET` | `/api/auth/admin/me` | ✅ | Get current admin info | Admin profile data |
| 3 | `POST` | `/api/auth/admin/logout` | ✅ | Admin logout | Success message |

### **📝 Request Examples:**

```javascript
// Admin Login
POST /api/auth/admin/login
{
  "email": "admin@eventmarketers.com",
  "password": "admin123"
}

// Response
{
  "success": true,
  "data": {
    "admin": {
      "id": "admin_id",
      "name": "Admin User",
      "email": "admin@eventmarketers.com",
      "role": "ADMIN"
    },
    "token": "jwt_token_here"
  }
}
```

---

## 👥 **2. SUBADMIN AUTHENTICATION APIs**

### **Base URL:** `/api/auth/subadmin`

| # | Method | Endpoint | Auth Required | Description | Response |
|---|--------|----------|---------------|-------------|----------|
| 1 | `POST` | `/api/auth/subadmin/login` | ❌ | Subadmin login with email/password | JWT token + subadmin data |
| 2 | `GET` | `/api/auth/subadmin/me` | ✅ | Get current subadmin info | Subadmin profile data |
| 3 | `POST` | `/api/auth/subadmin/logout` | ✅ | Subadmin logout | Success message |

### **📝 Request Examples:**

```javascript
// Subadmin Login
POST /api/auth/subadmin/login
{
  "email": "subadmin@eventmarketers.com",
  "password": "subadmin123"
}

// Response
{
  "success": true,
  "data": {
    "subadmin": {
      "id": "subadmin_id",
      "name": "Subadmin User",
      "email": "subadmin@eventmarketers.com",
      "role": "SUBADMIN",
      "permissions": ["manage_content", "view_analytics"]
    },
    "token": "jwt_token_here"
  }
}
```

---

## 📱 **3. MOBILE AUTHENTICATION APIs**

### **Base URL:** `/api/mobile/auth`

| # | Method | Endpoint | Auth Required | Description | Response |
|---|--------|----------|---------------|-------------|----------|
| 1 | `POST` | `/api/mobile/auth/register` | ❌ | Register mobile user with device ID | JWT token + user data |
| 2 | `POST` | `/api/mobile/auth/login` | ❌ | Login mobile user with device ID | JWT token + user data |
| 3 | `GET` | `/api/mobile/auth/me` | ✅ | Get current mobile user info | User profile + subscriptions |

### **📝 Request Examples:**

```javascript
// Mobile User Registration
POST /api/mobile/auth/register
{
  "deviceId": "unique_device_id_123",
  "name": "Mobile User",
  "email": "user@example.com",
  "phone": "+1234567890",
  "appVersion": "1.0.0",
  "platform": "android",
  "fcmToken": "firebase_token"
}

// Mobile User Login
POST /api/mobile/auth/login
{
  "deviceId": "unique_device_id_123"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "mobile_user_id",
      "deviceId": "unique_device_id_123",
      "name": "Mobile User",
      "email": "user@example.com",
      "platform": "android",
      "isActive": true
    },
    "token": "jwt_token_here"
  }
}
```

---

## 👤 **4. CUSTOMER AUTHENTICATION APIs**

### **Base URL:** `/api/customer/auth`

| # | Method | Endpoint | Auth Required | Description | Response |
|---|--------|----------|---------------|-------------|----------|
| 1 | `POST` | `/api/customer/login` | ❌ | Customer login with email/phone | JWT token + customer data |
| 2 | `GET` | `/api/customer/me` | ✅ | Get current customer info | Customer profile + subscription |

### **📝 Request Examples:**

```javascript
// Customer Login
POST /api/customer/login
{
  "email": "customer@example.com",
  "password": "customer123"
}

// Response
{
  "success": true,
  "data": {
    "customer": {
      "id": "customer_id",
      "name": "Customer Name",
      "email": "customer@example.com",
      "subscriptionStatus": "ACTIVE"
    },
    "token": "jwt_token_here"
  }
}
```

---

## 🔑 **Authentication Flow**

### **1. Admin/Subadmin Flow:**
```
1. POST /api/auth/admin/login (or /subadmin/login)
2. Receive JWT token
3. Store token in frontend
4. Include token in all requests: Authorization: Bearer <token>
5. GET /api/auth/admin/me to get user info
```

### **2. Mobile User Flow:**
```
1. POST /api/mobile/auth/register (first time)
2. POST /api/mobile/auth/login (subsequent times)
3. Receive JWT token
4. Store token in mobile app
5. Include token in all requests: Authorization: Bearer <token>
6. GET /api/mobile/auth/me to get user info
```

### **3. Customer Flow:**
```
1. POST /api/customer/login
2. Receive JWT token
3. Store token in frontend
4. Include token in all requests: Authorization: Bearer <token>
5. GET /api/customer/me to get customer info
```

---

## 🛡️ **Security Features**

### **JWT Token Configuration:**
- **Secret:** Configurable via `JWT_SECRET` environment variable
- **Expiration:** 7 days (configurable)
- **Algorithm:** HS256
- **Payload:** User ID, user type, device ID (for mobile)

### **Password Security:**
- **Hashing:** bcrypt with 12 rounds
- **Validation:** Minimum 6 characters
- **Storage:** Hashed passwords only

### **Device-Based Authentication (Mobile):**
- **Unique Device ID:** Required for mobile users
- **Platform Tracking:** iOS/Android
- **FCM Token:** For push notifications
- **Auto-login:** Based on device ID

---

## 🧪 **Testing Authentication APIs**

### **Test URLs:**
- **Local:** `http://localhost:3001`
- **Production:** `https://eventmarketersbackend.onrender.com`

### **Test Commands:**

```bash
# Test Admin Login
curl -X POST https://eventmarketersbackend.onrender.com/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eventmarketers.com","password":"admin123"}'

# Test Mobile Registration
curl -X POST https://eventmarketersbackend.onrender.com/api/mobile/auth/register \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test_device_123","name":"Test User"}'

# Test Mobile Login
curl -X POST https://eventmarketersbackend.onrender.com/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test_device_123"}'
```

---

## 📊 **Authentication Status**

| System | Status | Endpoints Working | Notes |
|--------|--------|------------------|-------|
| **Admin Auth** | ✅ Working | 3/3 | Email/password based |
| **Subadmin Auth** | ✅ Working | 3/3 | Email/password based |
| **Mobile Auth** | ✅ Working | 3/3 | Device ID based |
| **Customer Auth** | ✅ Working | 2/2 | Email/phone based |

---

## 🎯 **For Mobile App Development**

### **Recommended Flow:**
1. **First Launch:** Call `/api/mobile/auth/register` with device ID
2. **Subsequent Launches:** Call `/api/mobile/auth/login` with device ID
3. **Store Token:** Save JWT token securely in app
4. **API Calls:** Include token in Authorization header
5. **User Info:** Call `/api/mobile/auth/me` to get user details

### **Error Handling:**
- **401 Unauthorized:** Token expired or invalid
- **403 Forbidden:** Insufficient permissions
- **409 Conflict:** Device ID already exists (registration)
- **404 Not Found:** User not found (login)

---

**📅 Updated:** September 24, 2024  
**🔐 Status:** All Authentication APIs Working  
**👥 Ready for:** Frontend and Mobile App Integration
