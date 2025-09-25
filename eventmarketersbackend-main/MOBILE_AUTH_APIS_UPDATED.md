# 📱 Mobile Authentication APIs - Updated with Business Categories

## 📊 **Updated Mobile Authentication APIs (7 endpoints)**

### **Base URL:** `/api/mobile/auth`

| # | Method | Endpoint | Auth Required | Description | Response |
|---|--------|----------|---------------|-------------|----------|
| 1 | `POST` | `/api/mobile/auth/register` | ❌ | Register mobile user with business info | JWT token + user data + business profile |
| 2 | `POST` | `/api/mobile/auth/login` | ❌ | Login mobile user with device ID | JWT token + user data |
| 3 | `GET` | `/api/mobile/auth/me` | ✅ | Get current mobile user info | User profile + subscriptions + business profile |
| 4 | `POST` | `/api/mobile/auth/forgot-password` | ❌ | Send password reset email | Success message |
| 5 | `POST` | `/api/mobile/auth/reset-password` | ❌ | Reset password using token | Success message |
| 6 | `POST` | `/api/mobile/auth/verify-email` | ❌ | Verify user's email address | Success message |
| 7 | `POST` | `/api/mobile/auth/logout` | ✅ | Logout mobile user | Success message |

---

## **📝 Updated Request Examples:**

### **1. Mobile User Registration (Enhanced)**
```javascript
POST /api/mobile/auth/register
{
  "deviceId": "unique_device_id_123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "appVersion": "1.0.0",
  "platform": "android",
  "fcmToken": "firebase_token",
  // Business Information (from LOGIN_APIs_BACKEND_GUIDE.md)
  "companyName": "My Event Company",
  "description": "Professional event planning services",
  "category": "Event Planners",
  "address": "123 Main St, City, State",
  "alternatePhone": "+0987654321",
  "website": "https://mycompany.com",
  "companyLogo": "https://example.com/logo.png",
  "displayName": "My Event Company"
}

// Response
{
  "success": true,
  "message": "Mobile user registered successfully",
  "data": {
    "user": {
      "id": "mobile_user_id",
      "deviceId": "unique_device_id_123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "platform": "android",
      "isActive": true,
      "businessProfile": {
        "id": "business_profile_id",
        "businessName": "My Event Company",
        "ownerName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "address": "123 Main St, City, State",
        "category": "Event Planners",
        "logo": "https://example.com/logo.png",
        "description": "Professional event planning services",
        "website": "https://mycompany.com",
        "isActive": true
      }
    },
    "token": "jwt_token_here",
    "refreshToken": null,
    "expiresIn": 604800
  }
}
```

### **2. Mobile User Login (Enhanced)**
```javascript
POST /api/mobile/auth/login
{
  "deviceId": "unique_device_id_123"
}

// Response
{
  "success": true,
  "message": "Mobile user login successful",
  "data": {
    "user": {
      "id": "mobile_user_id",
      "deviceId": "unique_device_id_123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "platform": "android",
      "isActive": true,
      "lastActiveAt": "2025-09-24T09:45:00.000Z"
    },
    "token": "jwt_token_here",
    "refreshToken": null,
    "expiresIn": 604800
  }
}
```

### **3. Get Mobile User Info (Enhanced)**
```javascript
GET /api/mobile/auth/me
Authorization: Bearer <jwt_token>

// Response
{
  "success": true,
  "message": "Mobile user info retrieved successfully",
  "data": {
    "user": {
      "id": "mobile_user_id",
      "deviceId": "unique_device_id_123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "platform": "android",
      "isActive": true,
      "lastActiveAt": "2025-09-24T09:45:00.000Z",
      "businessProfiles": [
        {
          "id": "business_profile_id",
          "businessName": "My Event Company",
          "ownerName": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "address": "123 Main St, City, State",
          "category": "Event Planners",
          "logo": "https://example.com/logo.png",
          "description": "Professional event planning services",
          "website": "https://mycompany.com",
          "isActive": true
        }
      ],
      "subscriptions": [
        {
          "id": "subscription_id",
          "status": "ACTIVE",
          "plan": {
            "name": "Monthly Pro",
            "price": 299,
            "currency": "INR"
          }
        }
      ]
    }
  }
}
```

### **4. Forgot Password**
```javascript
POST /api/mobile/auth/forgot-password
{
  "email": "john@example.com"
}

// Response
{
  "success": true,
  "message": "Password reset instructions sent to your email",
  "data": {
    "resetToken": "reset_token_here" // Remove in production
  }
}
```

### **5. Reset Password**
```javascript
POST /api/mobile/auth/reset-password
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePassword123",
  "confirmPassword": "NewSecurePassword123"
}

// Response
{
  "success": true,
  "message": "Password reset successfully"
}
```

### **6. Verify Email**
```javascript
POST /api/mobile/auth/verify-email
{
  "token": "verification_token_here"
}

// Response
{
  "success": true,
  "message": "Email verified successfully"
}
```

### **7. Logout**
```javascript
POST /api/mobile/auth/logout
Authorization: Bearer <jwt_token>

// Response
{
  "success": true,
  "message": "Logout successful"
}
```

---

## **🏢 Business Categories (from LOGIN_APIs_BACKEND_GUIDE.md)**

The registration form supports these predefined business categories:
- **"Event Planners"** - Event planning and coordination services
- **"Decorators"** - Event decoration and design services  
- **"Sound Suppliers"** - Audio equipment and sound services
- **"Light Suppliers"** - Lighting equipment and services
- **"General"** - Default category for other business types

---

## **🔑 Enhanced Authentication Flow**

### **First Time User with Business Info:**
1. **Register:** `POST /api/mobile/auth/register` with device ID + business information
2. **Auto-create Business Profile:** If companyName or category provided
3. **Receive:** JWT token + user data + business profile
4. **Store:** Token securely in mobile app
5. **Use:** Token for all authenticated requests

### **Returning User:**
1. **Login:** `POST /api/mobile/auth/login` with device ID
2. **Receive:** JWT token + user data
3. **Store:** Token securely in mobile app
4. **Use:** Token for all authenticated requests

### **Getting Complete User Info:**
1. **Request:** `GET /api/mobile/auth/me` with Authorization header
2. **Receive:** Complete user profile + business profiles + subscriptions

---

## **🛡️ Enhanced Security Features**

- **Device-Based Auth:** Uses unique device ID instead of password
- **Business Profile Integration:** Automatic business profile creation
- **JWT Tokens:** 7-day expiration
- **Platform Tracking:** iOS/Android support
- **FCM Integration:** Push notification tokens
- **Email Verification:** Optional email verification system
- **Password Reset:** For users with email addresses
- **Auto-login:** Based on device ID recognition

---

## **📱 Mobile App Integration Examples**

### **Registration with Business Info:**
```typescript
const handleRegister = async (formData) => {
  try {
    const response = await fetch('/api/mobile/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: await getDeviceId(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        appVersion: '1.0.0',
        platform: Platform.OS,
        fcmToken: await getFCMToken(),
        // Business Information
        companyName: formData.companyName,
        description: formData.description,
        category: formData.category, // "Event Planners", "Decorators", etc.
        address: formData.address,
        alternatePhone: formData.alternatePhone,
        website: formData.website,
        companyLogo: formData.companyLogo,
        displayName: formData.displayName
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token and business info
      await AsyncStorage.setItem('authToken', data.data.token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(data.data.user));
      await AsyncStorage.setItem('businessProfile', JSON.stringify(data.data.user.businessProfile));
      
      navigation.navigate('Dashboard');
    }
  } catch (error) {
    Alert.alert('Registration Failed', error.message);
  }
};
```

### **Login:**
```typescript
const handleLogin = async () => {
  try {
    const deviceId = await getDeviceId();
    
    const response = await fetch('/api/mobile/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      await AsyncStorage.setItem('authToken', data.data.token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(data.data.user));
      navigation.navigate('Dashboard');
    }
  } catch (error) {
    Alert.alert('Login Failed', error.message);
  }
};
```

---

## **🌐 Test URLs:**

- **Production:** `https://eventmarketersbackend.onrender.com/api/mobile/auth/`
- **Local:** `http://localhost:3001/api/mobile/auth/`

---

## **📊 Updated API Status**

| Endpoint | Status | Features |
|----------|--------|----------|
| **Register** | ✅ Enhanced | Business profile creation, category support |
| **Login** | ✅ Enhanced | Device-based auth, improved response |
| **Get User Info** | ✅ Enhanced | Business profiles, subscriptions included |
| **Forgot Password** | ✅ New | Email-based password reset |
| **Reset Password** | ✅ New | Token-based password reset |
| **Verify Email** | ✅ New | Email verification system |
| **Logout** | ✅ New | Proper logout with token validation |

---

## **🎯 Key Improvements:**

1. **Business Category Support:** Full integration with business categories from LOGIN_APIs_BACKEND_GUIDE.md
2. **Automatic Business Profile:** Creates business profile during registration
3. **Enhanced Responses:** Includes business profile and subscription data
4. **Password Management:** Forgot password and reset functionality
5. **Email Verification:** Optional email verification system
6. **Proper Logout:** Token validation and cleanup
7. **Consistent Format:** Matches the response format from LOGIN_APIs_BACKEND_GUIDE.md

**All 7 mobile authentication APIs are now enhanced and ready for mobile app integration with business category support!** 🚀

---

**📅 Updated:** September 24, 2024  
**🔐 Status:** All APIs Enhanced with Business Categories  
**👥 Ready for:** Mobile App Development with Business Features
