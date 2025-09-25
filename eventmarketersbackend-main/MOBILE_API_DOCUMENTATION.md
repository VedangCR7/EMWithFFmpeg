# EventMarketers Mobile API Documentation

## Overview
This document provides comprehensive documentation for the EventMarketers Mobile API endpoints. The API is designed to support mobile applications with features for business profiles, content management, subscriptions, and user management.

## Base URL
- **Development**: `http://localhost:3001`
- **Production**: `https://your-production-domain.com`

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Authentication (`/api/mobile/auth`)

#### Register User
- **POST** `/api/mobile/auth/register`
- **Description**: Register a new mobile user
- **Body**:
```json
{
  "deviceId": "unique-device-id-123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "alternatePhone": "+0987654321",
  "appVersion": "1.0.0",
  "platform": "android",
  "fcmToken": "fcm-token-here",
  "companyName": "My Company",
  "description": "Company description",
  "category": "Event Planners",
  "address": "123 Main St",
  "website": "https://mycompany.com"
}
```

#### Login User
- **POST** `/api/mobile/auth/login`
- **Description**: Login with device ID and email
- **Body**:
```json
{
  "deviceId": "unique-device-id-123",
  "email": "john@example.com"
}
```

#### Get User Profile
- **GET** `/api/mobile/auth/me`
- **Description**: Get current user profile
- **Headers**: `Authorization: Bearer <token>`

#### Forgot Password
- **POST** `/api/mobile/auth/forgot-password`
- **Description**: Request password reset
- **Body**:
```json
{
  "email": "john@example.com"
}
```

#### Reset Password
- **POST** `/api/mobile/auth/reset-password`
- **Description**: Reset password with token
- **Body**:
```json
{
  "token": "reset-token",
  "newPassword": "newpassword123"
}
```

#### Verify Email
- **POST** `/api/mobile/auth/verify-email`
- **Description**: Verify email address
- **Body**:
```json
{
  "token": "verification-token"
}
```

#### Logout
- **POST** `/api/mobile/auth/logout`
- **Description**: Logout user
- **Headers**: `Authorization: Bearer <token>`

### 2. Business Profiles (`/api/mobile/business-profile`)

#### Get All Business Profiles
- **GET** `/api/mobile/business-profiles`
- **Description**: Get paginated list of all business profiles
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)

#### Get Business Profile by User ID
- **GET** `/api/mobile/business-profile/:userId`
- **Description**: Get business profile for specific user

#### Create Business Profile
- **POST** `/api/mobile/business-profile`
- **Description**: Create new business profile
- **Body**:
```json
{
  "mobileUserId": "user-id-here",
  "businessName": "My Business",
  "ownerName": "John Doe",
  "email": "business@example.com",
  "phone": "+1234567890",
  "address": "123 Business St",
  "category": "Event Planners",
  "description": "Business description",
  "website": "https://mybusiness.com"
}
```

#### Update Business Profile
- **PUT** `/api/mobile/business-profile/:id`
- **Description**: Update existing business profile
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "businessName": "Updated Business Name",
  "ownerName": "Updated Owner",
  "email": "updated@business.com",
  "phone": "+1234567890",
  "address": "Updated Address",
  "category": "Restaurant",
  "description": "Updated description"
}
```

### 3. Home & Featured Content (`/api/mobile/home`)

#### Get Featured Content
- **GET** `/api/mobile/home/featured`
- **Description**: Get featured content for home screen
- **Query Parameters**:
  - `limit` (optional): Number of items (default: 10)
  - `type` (optional): Content type filter
  - `active` (optional): Active status filter (default: true)

#### Get Upcoming Events
- **GET** `/api/mobile/home/upcoming-events`
- **Description**: Get upcoming events
- **Query Parameters**:
  - `limit` (optional): Number of items (default: 20)
  - `category` (optional): Event category filter
  - `location` (optional): Location filter

#### Get Home Templates
- **GET** `/api/mobile/home/templates`
- **Description**: Get templates for home screen
- **Query Parameters**:
  - `limit` (optional): Number of items (default: 10)
  - `category` (optional): Template category filter

#### Get Home Video Content
- **GET** `/api/mobile/home/video-content`
- **Description**: Get video content for home screen
- **Query Parameters**:
  - `limit` (optional): Number of items (default: 10)
  - `category` (optional): Video category filter

#### Search Home Content
- **GET** `/api/mobile/home/search`
- **Description**: Search content on home screen
- **Query Parameters**:
  - `q`: Search query
  - `type` (optional): Content type filter
  - `limit` (optional): Number of results (default: 10)

### 4. Templates (`/api/mobile/templates`)

#### Get Templates List
- **GET** `/api/mobile/templates`
- **Description**: Get paginated list of templates
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `category` (optional): Template category filter
  - `language` (optional): Language filter (default: en)
  - `type` (optional): Template type filter
  - `sortBy` (optional): Sort field (default: createdAt)
  - `order` (optional): Sort order (default: desc)

#### Get Template Details
- **GET** `/api/mobile/templates/:id`
- **Description**: Get detailed information about a template

#### Get Template Categories
- **GET** `/api/mobile/templates/categories`
- **Description**: Get list of available template categories

#### Get Template Languages
- **GET** `/api/mobile/templates/languages`
- **Description**: Get list of available languages

#### Like Template
- **POST** `/api/mobile/templates/:id/like`
- **Description**: Like a template
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "userId": "user-id-here"
}
```

#### Unlike Template
- **DELETE** `/api/mobile/templates/:id/like`
- **Description**: Unlike a template
- **Headers**: `Authorization: Bearer <token>`

#### Download Template
- **POST** `/api/mobile/templates/:id/download`
- **Description**: Download a template
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "userId": "user-id-here"
}
```

#### Search Templates
- **GET** `/api/mobile/templates/search`
- **Description**: Search templates
- **Query Parameters**:
  - `q`: Search query
  - `category` (optional): Category filter
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)

### 5. Content & Videos (`/api/mobile/content`)

#### Get Videos List
- **GET** `/api/mobile/content/videos`
- **Description**: Get paginated list of videos
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `category` (optional): Video category filter

#### Get Video Details
- **GET** `/api/mobile/content/videos/:id`
- **Description**: Get detailed information about a video

#### Like Video
- **POST** `/api/mobile/content/videos/:id/like`
- **Description**: Like a video
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "userId": "user-id-here"
}
```

#### Unlike Video
- **DELETE** `/api/mobile/content/videos/:id/like`
- **Description**: Unlike a video
- **Headers**: `Authorization: Bearer <token>`

#### Download Video
- **POST** `/api/mobile/content/videos/:id/download`
- **Description**: Download a video
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "userId": "user-id-here"
}
```

#### Search Videos
- **GET** `/api/mobile/content/videos/search`
- **Description**: Search videos
- **Query Parameters**:
  - `q`: Search query
  - `category` (optional): Category filter
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)

### 6. Greetings & Stickers (`/api/mobile/greetings`)

#### Get Greeting Categories
- **GET** `/api/mobile/greetings/categories`
- **Description**: Get list of greeting categories

#### Get Greeting Templates
- **GET** `/api/mobile/greetings/templates`
- **Description**: Get paginated list of greeting templates
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `category` (optional): Category filter

#### Get Greeting Template Details
- **GET** `/api/mobile/greetings/templates/:id`
- **Description**: Get detailed information about a greeting template

#### Like Greeting Template
- **POST** `/api/mobile/greetings/templates/:id/like`
- **Description**: Like a greeting template
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "userId": "user-id-here"
}
```

#### Unlike Greeting Template
- **DELETE** `/api/mobile/greetings/templates/:id/like`
- **Description**: Unlike a greeting template
- **Headers**: `Authorization: Bearer <token>`

#### Download Greeting Template
- **POST** `/api/mobile/greetings/templates/:id/download`
- **Description**: Download a greeting template
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "userId": "user-id-here"
}
```

#### Get Stickers
- **GET** `/api/mobile/greetings/stickers`
- **Description**: Get paginated list of stickers
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `category` (optional): Category filter

#### Get Emojis
- **GET** `/api/mobile/greetings/emojis`
- **Description**: Get paginated list of emojis
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 50)
  - `category` (optional): Category filter

### 7. Subscriptions (`/api/mobile/subscriptions`)

#### Get Subscription Plans
- **GET** `/api/mobile/subscriptions/plans`
- **Description**: Get list of available subscription plans

#### Get Subscription Plan Details
- **GET** `/api/mobile/subscriptions/plans/:id`
- **Description**: Get detailed information about a subscription plan

#### Create Subscription
- **POST** `/api/mobile/subscriptions`
- **Description**: Create new subscription
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "userId": "user-id-here",
  "planId": "plan-id-here",
  "paymentMethod": "credit_card",
  "paymentDetails": {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123"
  }
}
```

#### Get User Subscriptions
- **GET** `/api/mobile/subscriptions/user/:userId`
- **Description**: Get user's subscriptions
- **Headers**: `Authorization: Bearer <token>`

#### Cancel Subscription
- **PUT** `/api/mobile/subscriptions/:id/cancel`
- **Description**: Cancel a subscription
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "reason": "No longer needed"
}
```

#### Get Subscription Status
- **GET** `/api/mobile/subscriptions/:id/status`
- **Description**: Get subscription status
- **Headers**: `Authorization: Bearer <token>`

### 8. User Management (`/api/mobile/users`)

#### Get User Profile
- **GET** `/api/mobile/users/:id`
- **Description**: Get user profile information
- **Headers**: `Authorization: Bearer <token>`

#### Update User Profile
- **PUT** `/api/mobile/users/:id`
- **Description**: Update user profile
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "+1234567890",
  "companyName": "Updated Company",
  "description": "Updated description"
}
```

#### Get User Activities
- **GET** `/api/mobile/users/:id/activities`
- **Description**: Get user activity history
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)

#### Create User Activity
- **POST** `/api/mobile/users/:id/activities`
- **Description**: Create new user activity
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "type": "template_download",
  "contentId": "content-id-here",
  "contentType": "template",
  "metadata": {
    "templateName": "Wedding Template",
    "category": "wedding"
  }
}
```

#### Get User Likes
- **GET** `/api/mobile/users/:id/likes`
- **Description**: Get user's liked content
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `type` (optional): Content type filter

#### Get User Downloads
- **GET** `/api/mobile/users/:id/downloads`
- **Description**: Get user's downloaded content
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `type` (optional): Content type filter

### 9. Transactions (`/api/mobile/transactions`)

#### Create Transaction
- **POST** `/api/mobile/transactions`
- **Description**: Create new transaction
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "userId": "user-id-here",
  "subscriptionId": "subscription-id-here",
  "amount": 29.99,
  "currency": "USD",
  "paymentMethod": "credit_card",
  "paymentDetails": {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123"
  }
}
```

#### Get User Transactions
- **GET** `/api/mobile/transactions/user/:userId`
- **Description**: Get user's transaction history
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)

#### Get Transaction Details
- **GET** `/api/mobile/transactions/:id`
- **Description**: Get detailed transaction information
- **Headers**: `Authorization: Bearer <token>`

#### Update Transaction Status
- **PUT** `/api/mobile/transactions/:id/status`
- **Description**: Update transaction status
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "status": "completed",
  "paymentGatewayResponse": {
    "transactionId": "gateway-txn-id",
    "status": "success"
  }
}
```

#### Get Transaction by Gateway ID
- **GET** `/api/mobile/transactions/transaction/:transactionId`
- **Description**: Get transaction by payment gateway ID
- **Headers**: `Authorization: Bearer <token>`

#### Get User Transaction Summary
- **GET** `/api/mobile/transactions/user/:userId/summary`
- **Description**: Get user's transaction summary
- **Headers**: `Authorization: Bearer <token>`

#### Get User Recent Transactions
- **GET** `/api/mobile/transactions/user/:userId/recent`
- **Description**: Get user's recent transactions
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `limit` (optional): Number of transactions (default: 5)

### 10. Health & System

#### Health Check
- **GET** `/health`
- **Description**: Check API health status

#### Mobile API Health
- **GET** `/api/v1/health`
- **Description**: Check mobile API health status

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

## Rate Limiting

- **Rate Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information is included in response headers

## Postman Collection

A complete Postman collection is available at: `EventMarketers_Mobile_API_Collection.postman_collection.json`

## Testing

To test the API endpoints:

1. Import the Postman collection
2. Set the `baseUrl` variable to your API endpoint
3. For authenticated endpoints, first call the login endpoint to get a token
4. Set the `authToken` variable with the received token
5. Test individual endpoints

## Support

For API support and questions, please contact the development team.
