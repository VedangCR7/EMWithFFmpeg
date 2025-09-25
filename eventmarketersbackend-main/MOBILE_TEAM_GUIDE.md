# 📱 EventMarketers Mobile App Integration Guide

## 🚀 Quick Start

**Base URL:** `https://eventmarketersbackend.onrender.com`

### Essential Endpoints for Mobile App:

1. **Health Check:** `GET /health`
2. **Business Categories:** `GET /api/mobile/business-categories`
3. **User Registration:** `POST /api/installed-users/register`
4. **User Profile:** `GET /api/installed-users/profile/{deviceId}`
5. **User Activity:** `POST /api/installed-users/activity`
6. **Customer Content:** `GET /api/mobile/content/{customerId}`

---

## 📋 Integration Checklist

### ✅ Phase 1: Basic Integration
- [ ] Test health endpoint
- [ ] Fetch business categories
- [ ] Implement user registration
- [ ] Get user profile
- [ ] Record user activity

### ✅ Phase 2: Content Integration
- [ ] Fetch customer content
- [ ] Handle pagination
- [ ] Implement content filtering
- [ ] Add content download tracking

### ✅ Phase 3: Business Features
- [ ] Business profile creation
- [ ] Logo upload functionality
- [ ] Subscription management
- [ ] Payment integration

---

## 🔧 Implementation Examples

### React Native / JavaScript

```javascript
// 1. Health Check
const checkAPIHealth = async () => {
  const response = await fetch('https://eventmarketersbackend.onrender.com/health');
  const data = await response.json();
  console.log('API Status:', data.status);
};

// 2. Get Business Categories
const getCategories = async () => {
  const response = await fetch('https://eventmarketersbackend.onrender.com/api/mobile/business-categories');
  const data = await response.json();
  return data.categories;
};

// 3. Register User
const registerUser = async (deviceId, name, email, phone) => {
  const response = await fetch('https://eventmarketersbackend.onrender.com/api/installed-users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId,
      name,
      email,
      phone,
      appVersion: '1.0.0'
    })
  });
  return await response.json();
};

// 4. Record User Activity
const trackUserActivity = async (deviceId, action, resourceType, resourceId) => {
  const response = await fetch('https://eventmarketersbackend.onrender.com/api/installed-users/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId,
      action,
      resourceType,
      resourceId,
      metadata: { timestamp: new Date().toISOString() }
    })
  });
  return await response.json();
};
```

### Swift (iOS)

```swift
// 1. Health Check
func checkAPIHealth() async throws -> HealthResponse {
    let url = URL(string: "https://eventmarketersbackend.onrender.com/health")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(HealthResponse.self, from: data)
}

// 2. Get Business Categories
func getBusinessCategories() async throws -> CategoriesResponse {
    let url = URL(string: "https://eventmarketersbackend.onrender.com/api/mobile/business-categories")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(CategoriesResponse.self, from: data)
}

// 3. Register User
func registerUser(deviceId: String, name: String, email: String, phone: String) async throws -> UserResponse {
    let url = URL(string: "https://eventmarketersbackend.onrender.com/api/installed-users/register")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let userData = UserRegistration(deviceId: deviceId, name: name, email: email, phone: phone, appVersion: "1.0.0")
    request.httpBody = try JSONEncoder().encode(userData)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(UserResponse.self, from: data)
}
```

### Kotlin (Android)

```kotlin
// 1. Health Check
suspend fun checkAPIHealth(): HealthResponse {
    val response = httpClient.get("https://eventmarketersbackend.onrender.com/health")
    return response.body()
}

// 2. Get Business Categories
suspend fun getBusinessCategories(): CategoriesResponse {
    val response = httpClient.get("https://eventmarketersbackend.onrender.com/api/mobile/business-categories")
    return response.body()
}

// 3. Register User
suspend fun registerUser(deviceId: String, name: String, email: String, phone: String): UserResponse {
    val userData = UserRegistration(deviceId, name, email, phone, "1.0.0")
    val response = httpClient.post("https://eventmarketersbackend.onrender.com/api/installed-users/register") {
        contentType(ContentType.Application.Json)
        setBody(userData)
    }
    return response.body()
}
```

---

## 📊 Data Models

### User Registration
```json
{
  "deviceId": "unique-device-identifier",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "appVersion": "1.0.0"
}
```

### User Activity
```json
{
  "deviceId": "unique-device-identifier",
  "action": "view",
  "resourceType": "image",
  "resourceId": "content-id",
  "metadata": {
    "category": "Restaurant",
    "duration": 30
  }
}
```

### Business Category
```json
{
  "id": "1",
  "name": "Restaurant",
  "description": "Food and dining business content",
  "icon": "🍽️"
}
```

### Content Item
```json
{
  "id": "content-id",
  "title": "Restaurant Interior",
  "description": "Beautiful restaurant interior design",
  "url": "https://eventmarketersbackend.onrender.com/uploads/image.jpg",
  "thumbnailUrl": "https://eventmarketersbackend.onrender.com/uploads/thumb_image.jpg",
  "category": "BUSINESS",
  "tags": ["restaurant", "interior", "design"],
  "downloads": 45,
  "views": 120
}
```

---

## 🔒 Authentication

### For Admin/Content Management Features:
1. **Login:** `POST /api/auth/admin/login` or `POST /api/auth/subadmin/login`
2. **Get Token:** Extract `token` from login response
3. **Use Token:** Add `Authorization: Bearer {token}` header to protected requests

### Example:
```javascript
// Login
const loginResponse = await fetch('https://eventmarketersbackend.onrender.com/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: 'password' })
});
const { token } = await loginResponse.json();

// Use token for protected requests
const protectedResponse = await fetch('https://eventmarketersbackend.onrender.com/api/admin/subadmins', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📱 Mobile App Flow

### 1. App Launch
```javascript
// Check API health
await checkAPIHealth();

// Get business categories for UI
const categories = await getCategories();
```

### 2. User Onboarding
```javascript
// Register user on first launch
const deviceId = await getDeviceId(); // Get unique device identifier
const userData = await registerUser(deviceId, userName, userEmail, userPhone);

// Store user data locally
await storeUserData(userData);
```

### 3. Content Browsing
```javascript
// Track user viewing content
await trackUserActivity(deviceId, 'view', 'image', contentId);

// Track user downloading content
await trackUserActivity(deviceId, 'download', 'image', contentId);
```

### 4. Business Profile (For Subscribed Users)
```javascript
// Create business profile
const businessProfile = await createBusinessProfile({
  businessName: 'My Restaurant',
  businessEmail: 'info@myrestaurant.com',
  businessPhone: '+1234567890',
  businessCategory: 'Restaurant'
});
```

---

## 🚨 Error Handling

### Common Error Responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Error Handling Example:
```javascript
const handleAPIError = (error, response) => {
  if (response.status === 401) {
    // Handle authentication error
    redirectToLogin();
  } else if (response.status === 400) {
    // Handle validation error
    showValidationError(error.message);
  } else {
    // Handle general error
    showGenericError('Something went wrong. Please try again.');
  }
};
```

---

## 🔧 Testing

### 1. Use Postman Collection
Import `EventMarketers_API_Collection.postman_collection.json` into Postman for easy testing.

### 2. Use Test Script
Run `api_test_examples.js` in your browser console or Node.js environment.

### 3. Manual Testing
```bash
# Health check
curl https://eventmarketersbackend.onrender.com/health

# Get categories
curl https://eventmarketersbackend.onrender.com/api/mobile/business-categories

# Register user
curl -X POST https://eventmarketersbackend.onrender.com/api/installed-users/register \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-device","name":"Test User","email":"test@example.com","phone":"+1234567890","appVersion":"1.0.0"}'
```

---

## 📞 Support & Resources

### Documentation Files:
- `API_COLLECTION.md` - Complete API documentation
- `EventMarketers_API_Collection.postman_collection.json` - Postman collection
- `api_test_examples.js` - JavaScript testing examples

### Repository:
- **GitHub:** `https://github.com/rahulwaghole14/eventmarketersbackend.git`
- **Live API:** `https://eventmarketersbackend.onrender.com`

### Contact:
For API support or questions, contact the backend team.

---

## 🎯 Next Steps

1. **Import Postman Collection** for easy API testing
2. **Implement basic endpoints** (health, categories, user registration)
3. **Add error handling** for network requests
4. **Implement user activity tracking**
5. **Add content browsing functionality**
6. **Test with real device IDs** and user data

---

## 📝 Notes

- **Rate Limiting:** API has rate limiting (100 requests per 15 minutes)
- **File Uploads:** Maximum file size is 50MB
- **HTTPS:** All requests must use HTTPS in production
- **CORS:** API is configured for cross-origin requests
- **Device ID:** Generate unique device identifiers for each app installation

Happy coding! 🚀
