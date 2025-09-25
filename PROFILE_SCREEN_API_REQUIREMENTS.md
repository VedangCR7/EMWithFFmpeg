# ProfileScreen API Requirements Document

## Overview
This document lists all the API endpoints required for the ProfileScreen functionality in the EventMarketers React Native application. The ProfileScreen handles user profile management, statistics display, preferences, and related features.

## Registration Form Field Mapping
The ProfileScreen edit form uses the exact same fields as the registration form. The GET profile API should return the same JSON structure that was submitted during registration.

**Exact JSON Data Sent During Registration:**
```json
{
  "email": "string",
  "password": "string", 
  "companyName": "string",
  "phone": "string",
  "deviceId": "string",
  "description": "string",
  "category": "string", 
  "address": "string",
  "alternatePhone": "string",
  "website": "string",
  "companyLogo": "string",
  "displayName": "string"
}
```

**Registration Form Fields (Frontend to Backend Mapping):**
- `formData.name` → `companyName` (Company Name - Required)
- `formData.email` → `email` (Email Address - Required)
- `formData.phone` → `phone` (Phone Number - Required)
- `formData.description` → `description` (Company Description - Optional)
- `formData.category` → `category` (Business Category - Optional)
- `formData.address` → `address` (Business Address - Optional)
- `formData.alternatePhone` → `alternatePhone` (Alternate Phone - Optional)
- `formData.website` → `website` (Website URL - Optional)
- `logoImage || formData.companyLogo` → `companyLogo` (Company Logo URL - Optional)
- `formData.name` → `displayName` (Display Name - Same as company name)

**Important**: The GET profile API must return all these fields with the same field names so the edit profile form can be pre-populated with the user's registration data.

## Base URL
```
https://eventmarketersbackend.onrender.com
```

## Authentication
All API calls require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. USER PROFILE MANAGEMENT APIs

### 1.1 Get User Profile
**Purpose**: Fetch complete user profile data for edit profile functionality

**Endpoint**: Multiple endpoints will be tried in order:
- `GET /api/mobile/profile/{userId}`
- `GET /api/v1/profile/{userId}` 
- `GET /api/installed-users/profile/{deviceId}`
- `GET /api/mobile/auth/profile` (fallback)

**Request**:
```http
GET /api/mobile/profile/{userId}
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "companyName": "string",
    "phone": "string",
    "deviceId": "string",
    "description": "string",
    "category": "string",
    "address": "string",
    "alternatePhone": "string",
    "website": "string",
    "companyLogo": "string",
    "displayName": "string",
    "isActive": boolean,
    "lastActiveAt": "string",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "message": "string"
}
```

**Note**: The response should contain the exact same fields as sent during registration:
- `email` (Email Address)
- `companyName` (Company Name)
- `phone` (Phone Number) - Note: Backend uses "phone", not "phoneNumber"
- `deviceId` (Device ID)
- `description` (Company Description)
- `category` (Business Category)
- `address` (Business Address)
- `alternatePhone` (Alternate Phone)
- `website` (Website URL)
- `companyLogo` (Company Logo URL)
- `displayName` (Display Name)

### 1.2 Update User Profile
**Purpose**: Update user profile information

**Endpoint**: `PUT /api/mobile/auth/profile`

**Request**:
```http
PUT /api/mobile/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "string",
  "companyName": "string",
  "phone": "string",
  "description": "string",
  "category": "string",
  "address": "string",
  "alternatePhone": "string",
  "website": "string",
  "companyLogo": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "companyName": "string",
    "phone": "string",
    "description": "string",
    "category": "string",
    "address": "string",
    "alternatePhone": "string",
    "website": "string",
    "companyLogo": "string",
    "updatedAt": "string"
  },
  "message": "Profile updated successfully"
}
```

**Note**: The request/response should match the exact registration data structure (excluding displayName):
- `email` (Email Address) - Required
- `companyName` (Company Name) - Required  
- `phone` (Phone Number) - Required - Note: Backend uses "phone", not "phoneNumber"
- `description` (Company Description) - Optional
- `category` (Business Category) - Optional
- `address` (Business Address) - Optional
- `alternatePhone` (Alternate Phone) - Optional
- `website` (Website URL) - Optional
- `companyLogo` (Company Logo URL) - Optional

**Note**: `displayName` is not included in the PUT request as it's typically derived from `companyName` on the backend.

### 1.3 Upload Profile Image/Logo
**Purpose**: Upload company logo or profile image

**Endpoint**: `POST /api/business-profile/upload-logo`

**Request**:
```http
POST /api/business-profile/upload-logo
Authorization: Bearer <token>
Content-Type: multipart/form-data

logo: <file>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "logoUrl": "string",
    "logoId": "string"
  },
  "message": "Logo uploaded successfully"
}
```

---

## 2. USER STATISTICS APIs

### 2.1 Get Downloaded Posters Statistics
**Purpose**: Get user's downloaded posters count and recent activity

**Endpoint**: `GET /api/downloaded-posters/stats/{userId}`

**Request**:
```http
GET /api/downloaded-posters/stats/{userId}
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total": number,
    "recentCount": number,
    "recentDownloads": [
      {
        "id": "string",
        "posterId": "string",
        "posterName": "string",
        "downloadedAt": "string"
      }
    ]
  }
}
```

### 2.2 Get Business Profile Statistics
**Purpose**: Get user's business profiles count and recent activity

**Endpoint**: `GET /api/business-profiles/stats/{userId}`

**Request**:
```http
GET /api/business-profiles/stats/{userId}
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total": number,
    "recentCount": number,
    "recentProfiles": [
      {
        "id": "string",
        "businessName": "string",
        "createdAt": "string"
      }
    ]
  }
}
```

### 2.3 Get User Likes Statistics
**Purpose**: Get user's likes count and breakdown by type

**Endpoint**: `GET /api/user-likes/stats/{userId}`

**Request**:
```http
GET /api/user-likes/stats/{userId}
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total": number,
    "recentCount": number,
    "byType": {
      "template": number,
      "video": number,
      "poster": number,
      "businessProfile": number
    },
    "recentLikes": [
      {
        "id": "string",
        "itemId": "string",
        "itemType": "string",
        "itemName": "string",
        "likedAt": "string"
      }
    ]
  }
}
```

---

## 3. USER PREFERENCES APIs

### 3.1 Get User Preferences
**Purpose**: Get user's app preferences (notifications, dark mode, etc.)

**Endpoint**: `GET /api/user-preferences/{userId}`

**Request**:
```http
GET /api/user-preferences/{userId}
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "notificationsEnabled": boolean,
    "darkModeEnabled": boolean,
    "language": "string",
    "timezone": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### 3.2 Update User Preference
**Purpose**: Update specific user preference

**Endpoint**: `PUT /api/user-preferences/{userId}/preference`

**Request**:
```http
PUT /api/user-preferences/{userId}/preference
Authorization: Bearer <token>
Content-Type: application/json

{
  "preferenceKey": "string",
  "preferenceValue": "any"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "preferenceKey": "string",
    "preferenceValue": "any",
    "updatedAt": "string"
  },
  "message": "Preference updated successfully"
}
```

---

## 4. AUTHENTICATION APIs

### 4.1 User Logout
**Purpose**: Logout user and invalidate session

**Endpoint**: `POST /api/mobile/auth/logout`

**Request**:
```http
POST /api/mobile/auth/logout
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 5. BUSINESS CATEGORIES API

### 5.1 Get Business Categories
**Purpose**: Get list of available business categories for profile form

**Endpoint**: `GET /api/business-categories`

**Request**:
```http
GET /api/business-categories
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "string",
        "name": "string",
        "description": "string"
      }
    ]
  }
}
```

---

## 6. ERROR HANDLING

### Common Error Responses
All APIs should return consistent error responses:

**400 Bad Request**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "error message"
  }
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Authentication failed"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 7. IMPLEMENTATION PRIORITY

### High Priority (Core Profile Functionality)
1. **Get User Profile** - Essential for edit profile
2. **Update User Profile** - Essential for saving changes
3. **User Logout** - Essential for sign out functionality

### Medium Priority (Statistics & Preferences)
4. **Get Downloaded Posters Statistics** - For stats display
5. **Get Business Profile Statistics** - For stats display
6. **Get User Likes Statistics** - For stats display
7. **Get User Preferences** - For preferences management
8. **Update User Preference** - For preferences management

### Low Priority (Additional Features)
9. **Upload Profile Image/Logo** - For image upload
10. **Get Business Categories** - For category dropdown

---

## 8. TESTING ENDPOINTS

### Test Profile Endpoints
```bash
# Test profile retrieval
curl -X GET "https://eventmarketersbackend.onrender.com/api/mobile/profile/{userId}" \
  -H "Authorization: Bearer <token>"

# Test profile update
curl -X PUT "https://eventmarketersbackend.onrender.com/api/mobile/auth/profile" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Test Company", "phoneNumber": "+1234567890"}'
```

### Test Statistics Endpoints
```bash
# Test poster stats
curl -X GET "https://eventmarketersbackend.onrender.com/api/downloaded-posters/stats/{userId}" \
  -H "Authorization: Bearer <token>"

# Test business profile stats
curl -X GET "https://eventmarketersbackend.onrender.com/api/business-profiles/stats/{userId}" \
  -H "Authorization: Bearer <token>"
```

---

## 9. NOTES FOR BACKEND DEVELOPMENT

1. **Profile Data Structure**: Ensure the profile API returns all fields that were collected during registration
2. **Statistics Aggregation**: Implement efficient queries for user statistics
3. **Preference Management**: Use flexible key-value storage for user preferences
4. **Image Upload**: Implement proper file validation and storage for profile images
5. **Error Handling**: Provide detailed error messages for better user experience
6. **Rate Limiting**: Implement appropriate rate limiting for all endpoints
7. **Caching**: Consider caching for frequently accessed data like business categories

---

## 10. FRONTEND INTEGRATION

The ProfileScreen will:
1. Fetch complete profile data on edit profile click
2. Display user statistics on screen load
3. Update preferences when toggles are changed
4. Save profile changes when form is submitted
5. Handle errors gracefully with user-friendly messages

All API calls will include proper error handling and loading states for better user experience.
