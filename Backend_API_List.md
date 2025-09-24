# Backend API List for EventMarketers Project

## Base URL
```
https://daily-banner-app.onrender.com/api
```

## 1. Authentication & User Management

### 1.1 User Registration
```
POST /api/auth/register
```
**Purpose**: Register new users
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "companyName": "Event Company",
  "phoneNumber": "+1234567890"
}
```

### 1.2 User Login
```
POST /api/auth/login
```
**Purpose**: Authenticate users and get access token
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 1.3 Google OAuth Login
```
POST /api/auth/google
```
**Purpose**: Authenticate users via Google OAuth
**Request Body**:
```json
{
  "idToken": "google_id_token",
  "accessToken": "google_access_token"
}
```

### 1.4 Get User Profile
```
GET /api/auth/profile
```
**Purpose**: Get current user profile information
**Headers**: `Authorization: Bearer <token>`

### 1.5 Update User Profile
```
PUT /api/auth/profile
```
**Purpose**: Update user profile information
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "companyName": "Updated Company Name",
  "phoneNumber": "+1234567890",
  "logo": "base64_encoded_logo",
  "photo": "base64_encoded_photo"
}
```

### 1.6 Logout
```
POST /api/auth/logout
```
**Purpose**: Logout user and invalidate token
**Headers**: `Authorization: Bearer <token>`

## 2. Subscription & Billing

### 2.1 Get Subscription Plans
```
GET /api/subscription/plans
```
**Purpose**: Get available subscription plans
**Headers**: `Authorization: Bearer <token>`

### 2.2 Subscribe to Plan
```
POST /api/subscription/subscribe
```
**Purpose**: Subscribe to a subscription plan
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "planId": "pro",
  "paymentMethod": "stripe",
  "autoRenew": true
}
```

### 2.3 Get Subscription Status
```
GET /api/subscription/status
```
**Purpose**: Get current user subscription status
**Headers**: `Authorization: Bearer <token>`

### 2.4 Renew Subscription
```
POST /api/subscription/renew
```
**Purpose**: Renew current subscription
**Headers**: `Authorization: Bearer <token>`

### 2.5 Get Subscription History
```
GET /api/subscription/history
```
**Purpose**: Get user's subscription and payment history
**Headers**: `Authorization: Bearer <token>`

### 2.6 Cancel Subscription
```
POST /api/subscription/cancel
```
**Purpose**: Cancel current subscription
**Headers**: `Authorization: Bearer <token>`

## 3. Templates & Banners

### 3.1 Get Templates
```
GET /api/templates
```
**Purpose**: Get available banner templates
**Headers**: `Authorization: Bearer <token>`
**Query Parameters**:
- `type`: daily, festival, special, all
- `category`: free, premium, all
- `language`: en, hi, mr, all
- `search`: search term
- `page`: page number
- `limit`: items per page

### 3.2 Get Template by ID
```
GET /api/templates/{id}
```
**Purpose**: Get specific template details
**Headers**: `Authorization: Bearer <token>`

### 3.3 Get Available Languages
```
GET /api/templates/languages
```
**Purpose**: Get available languages for templates
**Headers**: `Authorization: Bearer <token>`

### 3.4 Create Banner
```
POST /api/banners
```
**Purpose**: Create a new banner using template
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "templateId": "template_id",
  "title": "Banner Title",
  "description": "Banner Description",
  "customizations": {
    "text": "Custom Text",
    "colors": ["#ff0000", "#00ff00"],
    "fonts": "Arial",
    "images": ["image_url_1", "image_url_2"]
  },
  "language": "en"
}
```

### 3.5 Update Banner
```
PUT /api/banners/{id}
```
**Purpose**: Update banner details
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated Description",
  "customizations": {},
  "status": "draft"
}
```

### 3.6 Get User Banners
```
GET /api/banners/my
```
**Purpose**: Get all banners created by user
**Headers**: `Authorization: Bearer <token>`
**Query Parameters**:
- `status`: draft, published, archived, all
- `page`: page number
- `limit`: items per page

### 3.7 Get Banner by ID
```
GET /api/banners/{id}
```
**Purpose**: Get specific banner details
**Headers**: `Authorization: Bearer <token>`

### 3.8 Delete Banner
```
DELETE /api/banners/{id}
```
**Purpose**: Delete user's banner
**Headers**: `Authorization: Bearer <token>`

### 3.9 Publish Banner
```
POST /api/banners/{id}/publish
```
**Purpose**: Publish banner
**Headers**: `Authorization: Bearer <token>`

### 3.10 Archive Banner
```
POST /api/banners/{id}/archive
```
**Purpose**: Archive banner
**Headers**: `Authorization: Bearer <token>`

### 3.11 Export Banner
```
GET /api/banners/{id}/export
```
**Purpose**: Export banner as image
**Headers**: `Authorization: Bearer <token>`
**Query Parameters**:
- `format`: png, jpg, pdf
- `quality`: 1-100

### 3.12 Share Banner
```
POST /api/banners/{id}/share
```
**Purpose**: Share banner
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "platform": "social",
  "message": "Check out my banner!"
}
```

## 4. Media Management

### 4.1 Get Media Assets
```
GET /api/media
```
**Purpose**: Get user's uploaded media assets
**Headers**: `Authorization: Bearer <token>`
**Query Parameters**:
- `type`: image, video, all
- `page`: page number
- `limit`: items per page

### 4.2 Upload Media
```
POST /api/media/upload
```
**Purpose**: Upload new media asset
**Headers**: `Authorization: Bearer <token>`
**Request Body**: `multipart/form-data`
- `file`: media file
- `tags`: array of tags
- `description`: media description

### 4.3 Delete Media
```
DELETE /api/media/{id}
```
**Purpose**: Delete media asset
**Headers**: `Authorization: Bearer <token>`

### 4.4 Get Media by ID
```
GET /api/media/{id}
```
**Purpose**: Get specific media asset details
**Headers**: `Authorization: Bearer <token>`

### 4.5 Update Media Metadata
```
PUT /api/media/{id}
```
**Purpose**: Update media asset metadata
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "name": "Updated Name",
  "tags": ["tag1", "tag2"],
  "description": "Updated description"
}
```

### 4.6 Get Media by Type
```
GET /api/media/type/{type}
```
**Purpose**: Get media assets by type (image/video)
**Headers**: `Authorization: Bearer <token>`

### 4.7 Search Media by Tags
```
GET /api/media/search
```
**Purpose**: Search media assets by tags
**Headers**: `Authorization: Bearer <token>`
**Query Parameters**:
- `tags`: comma-separated tags
- `page`: page number
- `limit`: items per page

### 4.8 Get Media Statistics
```
GET /api/media/stats
```
**Purpose**: Get media usage statistics
**Headers**: `Authorization: Bearer <token>`

## 5. Dashboard & Analytics

### 5.1 Get Dashboard Data
```
GET /api/dashboard
```
**Purpose**: Get dashboard overview data
**Headers**: `Authorization: Bearer <token>`

### 5.2 Get Banner Statistics
```
GET /api/dashboard/banners/stats
```
**Purpose**: Get banner creation and usage statistics
**Headers**: `Authorization: Bearer <token>`

### 5.3 Get Template Usage
```
GET /api/dashboard/templates/usage
```
**Purpose**: Get template usage statistics
**Headers**: `Authorization: Bearer <token>`

### 5.4 Get Recent Activity
```
GET /api/dashboard/activity
```
**Purpose**: Get recent user activity
**Headers**: `Authorization: Bearer <token>`
**Query Parameters**:
- `limit`: number of activities to return

## 6. Template Interactions

### 6.1 Like Template
```
POST /api/templates/{id}/like
```
**Purpose**: Like/unlike a template
**Headers**: `Authorization: Bearer <token>`

### 6.2 Download Template
```
POST /api/templates/{id}/download
```
**Purpose**: Download template
**Headers**: `Authorization: Bearer <token>`

### 6.3 Get Template Categories
```
GET /api/templates/categories
```
**Purpose**: Get available template categories
**Headers**: `Authorization: Bearer <token>`

## 7. Error Responses

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

## 8. Success Responses

All APIs return consistent success responses:

```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

## 9. Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

## 10. Rate Limiting

- **Public endpoints**: 100 requests per hour
- **Authenticated endpoints**: 1000 requests per hour
- **File uploads**: 50 requests per hour

## 11. File Upload Limits

- **Images**: Max 10MB, formats: JPG, PNG, GIF, WebP
- **Videos**: Max 100MB, formats: MP4, MOV, AVI
- **Documents**: Max 25MB, formats: PDF, DOC, DOCX

---

**Total Required APIs: 35 endpoints**

This covers all the functionality needed for the EventMarketers project including user management, subscription handling, template and banner creation, media management, and analytics.
