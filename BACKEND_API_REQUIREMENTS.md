# EventMarketers - Backend API Requirements

## Overview
This document outlines all the APIs required for the EventMarketers mobile app backend. The app is a comprehensive event marketing platform that includes user authentication, business profiles, poster creation, subscription management, and payment processing.

## Base Configuration
- **Base URL**: `https://your-api-domain.com/api/v1`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`
- **File Upload**: `multipart/form-data`

---

## 1. Authentication APIs

### 1.1 User Registration
```
POST /auth/register
```
**Request Body:**
```json
{
  "companyName": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "confirmPassword": "string"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "string",
      "companyName": "string",
      "email": "string",
      "phone": "string",
      "isVerified": false,
      "createdAt": "ISO date"
    },
    "token": "JWT token"
  }
}
```

### 1.2 User Login
```
POST /auth/login
```
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "string",
      "companyName": "string",
      "email": "string",
      "phone": "string",
      "isVerified": boolean,
      "subscription": {
        "plan": "free|monthly|yearly",
        "status": "active|expired|cancelled",
        "expiresAt": "ISO date"
      }
    },
    "token": "JWT token"
  }
}
```

### 1.3 Phone OTP Verification
```
POST /auth/send-otp
```
**Request Body:**
```json
{
  "phone": "string"
}
```

```
POST /auth/verify-otp
```
**Request Body:**
```json
{
  "phone": "string",
  "otp": "string"
}
```

### 1.4 Google Sign-In
```
POST /auth/google
```
**Request Body:**
```json
{
  "idToken": "string",
  "accessToken": "string"
}
```

### 1.5 Refresh Token
```
POST /auth/refresh
```
**Request Body:**
```json
{
  "refreshToken": "string"
}
```

### 1.6 Logout
```
POST /auth/logout
```

---

## 2. User Profile Management APIs

### 2.1 Get User Profile
```
GET /user/profile
```

### 2.2 Update User Profile
```
PUT /user/profile
```
**Request Body:**
```json
{
  "companyName": "string",
  "phone": "string",
  "email": "string",
  "profileImage": "file"
}
```

### 2.3 Change Password
```
PUT /user/change-password
```
**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

### 2.4 Delete Account
```
DELETE /user/account
```

---

## 3. Business Profile APIs

### 3.1 Create Business Profile
```
POST /business/profile
```
**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "category": "Event Planners|Decorators|Sound Suppliers|Light Suppliers",
  "address": "string",
  "phone": "string",
  "alternatePhone": "string",
  "email": "string",
  "website": "string",
  "companyLogo": "file",
  "services": ["string"],
  "workingHours": {
    "monday": {"open": "09:00", "close": "18:00", "isOpen": true},
    "tuesday": {"open": "09:00", "close": "18:00", "isOpen": true},
    "wednesday": {"open": "09:00", "close": "18:00", "isOpen": true},
    "thursday": {"open": "09:00", "close": "18:00", "isOpen": true},
    "friday": {"open": "09:00", "close": "18:00", "isOpen": true},
    "saturday": {"open": "10:00", "close": "16:00", "isOpen": true},
    "sunday": {"open": "00:00", "close": "00:00", "isOpen": false}
  },
  "socialMedia": {
    "facebook": "string",
    "instagram": "string",
    "twitter": "string",
    "linkedin": "string"
  }
}
```

### 3.2 Get Business Profile
```
GET /business/profile/{id}
```

### 3.3 Update Business Profile
```
PUT /business/profile/{id}
```

### 3.4 Get All Business Profiles
```
GET /business/profiles
```
**Query Parameters:**
- `category`: Filter by category
- `search`: Search by name/description
- `page`: Page number
- `limit`: Items per page

### 3.5 Delete Business Profile
```
DELETE /business/profile/{id}
```

---

## 4. Template Management APIs

### 4.1 Get Templates
```
GET /templates
```
**Query Parameters:**
- `category`: free|premium
- `language`: english|hindi|marathi
- `search`: Search term
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "imageUrl": "string",
        "category": "free|premium",
        "language": "string",
        "downloads": number,
        "likes": number,
        "isLiked": boolean,
        "isDownloaded": boolean,
        "createdAt": "ISO date"
      }
    ],
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "pages": number
    }
  }
}
```

### 4.2 Get Template Details
```
GET /templates/{id}
```

### 4.3 Like/Unlike Template
```
POST /templates/{id}/like
```

### 4.4 Download Template
```
POST /templates/{id}/download
```

---

## 5. Poster Management APIs

### 5.1 Create Poster
```
POST /posters
```
**Request Body:**
```json
{
  "templateId": "string",
  "title": "string",
  "description": "string",
  "imageData": "base64 string",
  "settings": {
    "font": "string",
    "colors": ["string"],
    "layout": "string"
  }
}
```

### 5.2 Get User Posters
```
GET /posters
```
**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

### 5.3 Get Poster Details
```
GET /posters/{id}
```

### 5.4 Update Poster
```
PUT /posters/{id}
```

### 5.5 Delete Poster
```
DELETE /posters/{id}
```

### 5.6 Share Poster
```
POST /posters/{id}/share
```

---

## 6. Subscription & Payment APIs

### 6.1 Get Subscription Plans
```
GET /subscription/plans
```
**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "string",
        "name": "Monthly Pro",
        "price": 299,
        "originalPrice": 499,
        "savings": "40% OFF",
        "period": "month",
        "features": ["string"]
      },
      {
        "id": "string",
        "name": "Yearly Pro",
        "price": 1999,
        "originalPrice": 5988,
        "savings": "67% OFF",
        "period": "year",
        "features": ["string"]
      }
    ]
  }
}
```

### 6.2 Create Payment Order
```
POST /subscription/create-order
```
**Request Body:**
```json
{
  "planId": "string",
  "amount": number
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "string",
    "amount": number,
    "currency": "INR"
  }
}
```

### 6.3 Verify Payment
```
POST /subscription/verify-payment
```
**Request Body:**
```json
{
  "orderId": "string",
  "paymentId": "string",
  "signature": "string"
}
```

### 6.4 Get Subscription Status
```
GET /subscription/status
```

### 6.5 Cancel Subscription
```
POST /subscription/cancel
```

---

## 7. Font Management APIs

### 7.1 Get Google Fonts
```
GET /fonts
```
**Query Parameters:**
- `search`: Search term
- `category`: serif|sans-serif|display|handwriting|monospace
- `page`: Page number
- `limit`: Items per page

### 7.2 Get Font Details
```
GET /fonts/{family}
```

### 7.3 Download Font
```
GET /fonts/{family}/download
```

---

## 8. Analytics & Usage APIs

### 8.1 Get User Analytics
```
GET /analytics/user
```
**Query Parameters:**
- `period`: daily|weekly|monthly|yearly
- `startDate`: ISO date
- `endDate`: ISO date

### 8.2 Get Poster Analytics
```
GET /analytics/posters
```

### 8.3 Get Template Usage
```
GET /analytics/templates
```

---

## 9. Notification APIs

### 9.1 Register FCM Token
```
POST /notifications/register-token
```
**Request Body:**
```json
{
  "fcmToken": "string",
  "deviceType": "android|ios"
}
```

### 9.2 Get Notifications
```
GET /notifications
```
**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

### 9.3 Mark Notification as Read
```
PUT /notifications/{id}/read
```

### 9.4 Delete Notification
```
DELETE /notifications/{id}
```

---

## 10. File Upload APIs

### 10.1 Upload Image
```
POST /upload/image
```
**Request Body:**
- `file`: multipart/form-data
- `type`: logo|poster|template

### 10.2 Upload Video
```
POST /upload/video
```

### 10.3 Delete File
```
DELETE /upload/{fileId}
```

---

## 11. Search & Discovery APIs

### 11.1 Search Templates
```
GET /search/templates
```
**Query Parameters:**
- `q`: Search query
- `category`: free|premium
- `language`: string
- `page`: Page number
- `limit`: Items per page

### 11.2 Search Business Profiles
```
GET /search/business
```
**Query Parameters:**
- `q`: Search query
- `category`: string
- `location`: string
- `page`: Page number
- `limit`: Items per page

---

## 12. Admin APIs (Optional)

### 12.1 Get System Statistics
```
GET /admin/stats
```

### 12.2 Manage Templates
```
POST /admin/templates
PUT /admin/templates/{id}
DELETE /admin/templates/{id}
```

### 12.3 Manage Users
```
GET /admin/users
PUT /admin/users/{id}
DELETE /admin/users/{id}
```

---

## Error Response Format

All APIs should return errors in this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

## Common Error Codes

- `AUTH_REQUIRED`: Authentication required
- `INVALID_TOKEN`: Invalid or expired token
- `PERMISSION_DENIED`: User doesn't have permission
- `RESOURCE_NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Input validation failed
- `SUBSCRIPTION_REQUIRED`: Premium subscription required
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error

## Rate Limiting

- **Public APIs**: 100 requests per minute
- **Authenticated APIs**: 1000 requests per minute
- **File Upload**: 10 requests per minute

## Security Requirements

1. **JWT Token Expiration**: 24 hours for access token, 7 days for refresh token
2. **Password Requirements**: Minimum 8 characters, must include uppercase, lowercase, number, and special character
3. **File Upload**: Maximum 10MB for images, 100MB for videos
4. **CORS**: Configured for mobile app domains
5. **Rate Limiting**: Implemented for all endpoints
6. **Input Validation**: All inputs validated and sanitized
7. **SQL Injection Protection**: Use parameterized queries
8. **XSS Protection**: Sanitize all user inputs

## Database Schema Requirements

### Core Tables
- `users` - User accounts and authentication
- `business_profiles` - Business profile information
- `templates` - Poster templates
- `posters` - User created posters
- `subscriptions` - User subscription data
- `payments` - Payment transactions
- `notifications` - Push notifications
- `analytics` - Usage analytics

### Supporting Tables
- `fonts` - Google Fonts data
- `categories` - Business categories
- `languages` - Supported languages
- `file_uploads` - File storage metadata

## Deployment Requirements

1. **HTTPS**: All endpoints must use HTTPS
2. **CDN**: For static assets (images, fonts, templates)
3. **Database**: PostgreSQL or MySQL with proper indexing
4. **Caching**: Redis for session management and caching
5. **File Storage**: AWS S3 or similar for file uploads
6. **Monitoring**: Application performance monitoring
7. **Backup**: Automated database backups
8. **SSL Certificate**: Valid SSL certificate for domain

## Third-Party Integrations

1. **Razorpay**: Payment processing
2. **Firebase**: Push notifications (FCM)
3. **Google Fonts API**: Font management
4. **Google Sign-In**: OAuth authentication
5. **AWS S3**: File storage (optional)

This comprehensive API structure will support all the features currently implemented in the EventMarketers mobile app and provide a solid foundation for future enhancements.
