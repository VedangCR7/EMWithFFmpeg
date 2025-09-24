# EventMarketers Backend API Collection

**Base URL:** `https://eventmarketersbackend.onrender.com`

## 📱 Mobile App API Endpoints

### 1. Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-09-22T07:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

---

### 2. Business Categories
**GET** `/api/mobile/business-categories`

**Description:** Get all available business categories for content browsing

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "1",
      "name": "Restaurant",
      "description": "Food and dining business content",
      "icon": "🍽️"
    },
    {
      "id": "2", 
      "name": "Wedding Planning",
      "description": "Wedding and event planning content",
      "icon": "💒"
    },
    {
      "id": "3",
      "name": "Electronics", 
      "description": "Electronic products and gadgets",
      "icon": "📱"
    }
  ]
}
```

---

### 3. User Registration (Installed Users)
**POST** `/api/installed-users/register`

**Description:** Register a new user who has installed the app

**Request Body:**
```json
{
  "deviceId": "unique-device-identifier",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "appVersion": "1.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "deviceId": "unique-device-identifier",
    "name": "John Doe",
    "email": "john@example.com",
    "installDate": "2024-09-22T07:00:00.000Z"
  }
}
```

---

### 4. Get User Profile
**GET** `/api/installed-users/profile/{deviceId}`

**Description:** Get user profile by device ID

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "deviceId": "unique-device-identifier",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "totalViews": 150,
    "downloadAttempts": 25,
    "isConverted": false,
    "lastActiveAt": "2024-09-22T07:00:00.000Z"
  }
}
```

---

### 5. Update User Profile
**PUT** `/api/installed-users/profile/{deviceId}`

**Description:** Update user profile information

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "deviceId": "unique-device-identifier",
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "phone": "+1234567890",
    "updatedAt": "2024-09-22T07:00:00.000Z"
  }
}
```

---

### 6. Record User Activity
**POST** `/api/installed-users/activity`

**Description:** Track user interactions with content

**Request Body:**
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

**Response:**
```json
{
  "success": true,
  "activity": {
    "id": "activity-id",
    "deviceId": "unique-device-identifier",
    "action": "view",
    "resourceType": "image",
    "resourceId": "content-id",
    "timestamp": "2024-09-22T07:00:00.000Z"
  }
}
```

---

### 7. Get Customer Content (Subscribed Users)
**GET** `/api/mobile/content/{customerId}`

**Description:** Get content for subscribed customers

**Query Parameters:**
- `category` (optional): Filter by content category
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "content": {
    "images": [
      {
        "id": "image-id",
        "title": "Restaurant Interior",
        "description": "Beautiful restaurant interior design",
        "url": "https://eventmarketersbackend.onrender.com/uploads/image.jpg",
        "thumbnailUrl": "https://eventmarketersbackend.onrender.com/uploads/thumb_image.jpg",
        "category": "BUSINESS",
        "tags": ["restaurant", "interior", "design"],
        "downloads": 45,
        "views": 120
      }
    ],
    "videos": [
      {
        "id": "video-id",
        "title": "Restaurant Promo Video",
        "description": "Promotional video for restaurant",
        "url": "https://eventmarketersbackend.onrender.com/uploads/video.mp4",
        "thumbnailUrl": "https://eventmarketersbackend.onrender.com/uploads/thumb_video.jpg",
        "category": "BUSINESS",
        "duration": 30,
        "downloads": 25,
        "views": 80
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 8. Get Customer Profile (Subscribed Users)
**GET** `/api/mobile/profile/{customerId}`

**Description:** Get customer profile and subscription details

**Response:**
```json
{
  "success": true,
  "customer": {
    "id": "customer-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "businessName": "John's Restaurant",
    "businessCategory": "Restaurant",
    "subscriptionStatus": "ACTIVE",
    "subscriptionStartDate": "2024-09-01T00:00:00.000Z",
    "subscriptionEndDate": "2025-09-01T00:00:00.000Z",
    "totalDownloads": 150,
    "lastActiveAt": "2024-09-22T07:00:00.000Z"
  }
}
```

---

### 9. Business Profile Creation
**POST** `/api/business-profile/profile`

**Description:** Create business profile for subscription

**Request Body:**
```json
{
  "businessName": "John's Restaurant",
  "businessEmail": "info@johnsrestaurant.com",
  "businessPhone": "+1234567890",
  "businessWebsite": "https://johnsrestaurant.com",
  "businessAddress": "123 Main St, City, State",
  "businessDescription": "Fine dining restaurant",
  "businessCategory": "Restaurant"
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "profile-id",
    "businessName": "John's Restaurant",
    "businessEmail": "info@johnsrestaurant.com",
    "businessPhone": "+1234567890",
    "businessWebsite": "https://johnsrestaurant.com",
    "businessAddress": "123 Main St, City, State",
    "businessDescription": "Fine dining restaurant",
    "businessCategory": "Restaurant",
    "createdAt": "2024-09-22T07:00:00.000Z"
  }
}
```

---

### 10. Upload Business Logo
**POST** `/api/business-profile/upload-logo`

**Description:** Upload business logo image

**Request:** Multipart form data with `logo` file

**Response:**
```json
{
  "success": true,
  "logoUrl": "https://eventmarketersbackend.onrender.com/uploads/logo.jpg"
}
```

---

## 🔐 Authentication Endpoints

### 11. Admin Login
**POST** `/api/auth/admin/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "admin-id",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

---

### 12. Subadmin Login
**POST** `/api/auth/subadmin/login`

**Request Body:**
```json
{
  "email": "subadmin@example.com",
  "password": "subadminpassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "subadmin-id",
    "email": "subadmin@example.com",
    "name": "Subadmin User",
    "role": "Content Manager",
    "permissions": ["Images", "Videos"],
    "assignedCategories": ["Restaurant"]
  }
}
```

---

### 13. Get Current User
**GET** `/api/auth/me`

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "ADMIN"
  }
}
```

---

## 📊 Admin Management Endpoints

### 14. Get Subadmins
**GET** `/api/admin/subadmins`

**Headers:** `Authorization: Bearer {admin-token}`

**Response:**
```json
{
  "success": true,
  "subadmins": [
    {
      "id": "subadmin-id",
      "name": "Priya Sharma",
      "email": "priya@marketbrand.com",
      "role": "Content Manager",
      "status": "active",
      "permissions": ["Images", "Videos", "Categories"],
      "assignedCategories": ["Restaurant"],
      "createdAt": "2024-09-22T07:00:00.000Z",
      "lastLogin": "2024-09-22T07:00:00.000Z"
    }
  ]
}
```

---

### 15. Create Subadmin
**POST** `/api/admin/subadmins`

**Headers:** `Authorization: Bearer {admin-token}`

**Request Body:**
```json
{
  "name": "New Subadmin",
  "email": "newsubadmin@example.com",
  "password": "password123",
  "role": "Content Manager",
  "permissions": ["Images", "Videos"],
  "assignedCategories": ["Restaurant"]
}
```

**Response:**
```json
{
  "success": true,
  "subadmin": {
    "id": "new-subadmin-id",
    "name": "New Subadmin",
    "email": "newsubadmin@example.com",
    "role": "Content Manager",
    "status": "active",
    "permissions": ["Images", "Videos"],
    "assignedCategories": ["Restaurant"],
    "createdAt": "2024-09-22T07:00:00.000Z"
  }
}
```

---

## 📝 Content Management Endpoints

### 16. Get Pending Approvals
**GET** `/api/content/pending-approvals`

**Headers:** `Authorization: Bearer {admin-token}`

**Response:**
```json
{
  "success": true,
  "pendingApprovals": [
    {
      "id": "content-id",
      "type": "image",
      "title": "New Restaurant Image",
      "uploadedBy": "subadmin-name",
      "uploadedAt": "2024-09-22T07:00:00.000Z",
      "category": "BUSINESS"
    }
  ]
}
```

---

### 17. Upload Image
**POST** `/api/content/images`

**Headers:** `Authorization: Bearer {subadmin-token}`

**Request:** Multipart form data with:
- `image`: Image file
- `title`: Image title
- `description`: Image description
- `category`: Content category
- `businessCategoryId`: Business category ID
- `tags`: Comma-separated tags

**Response:**
```json
{
  "success": true,
  "image": {
    "id": "image-id",
    "title": "New Restaurant Image",
    "description": "Image description",
    "url": "https://eventmarketersbackend.onrender.com/uploads/image.jpg",
    "category": "BUSINESS",
    "approvalStatus": "PENDING",
    "createdAt": "2024-09-22T07:00:00.000Z"
  }
}
```

---

### 18. Upload Video
**POST** `/api/content/videos`

**Headers:** `Authorization: Bearer {subadmin-token}`

**Request:** Multipart form data with:
- `video`: Video file
- `title`: Video title
- `description`: Video description
- `category`: Content category
- `businessCategoryId`: Business category ID
- `tags`: Comma-separated tags

**Response:**
```json
{
  "success": true,
  "video": {
    "id": "video-id",
    "title": "New Restaurant Video",
    "description": "Video description",
    "url": "https://eventmarketersbackend.onrender.com/uploads/video.mp4",
    "category": "BUSINESS",
    "approvalStatus": "PENDING",
    "createdAt": "2024-09-22T07:00:00.000Z"
  }
}
```

---

## 📱 Mobile API Aliases (Cleaner Paths)

### 19. Get Categories (Alias)
**GET** `/api/v1/categories`

**Response:** Same as `/api/mobile/business-categories`

---

### 20. Get Content (Alias)
**GET** `/api/v1/content/{customerId}`

**Response:** Same as `/api/mobile/content/{customerId}`

---

### 21. Get Profile (Alias)
**GET** `/api/v1/profile/{customerId}`

**Response:** Same as `/api/mobile/profile/{customerId}`

---

## 🔧 Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📋 Request/Response Headers

**Required Headers:**
```
Content-Type: application/json
Authorization: Bearer {token} (for protected endpoints)
```

**Optional Headers:**
```
Accept: application/json
User-Agent: YourApp/1.0.0
```

---

## 🔒 Security Notes

1. **Authentication:** Use JWT tokens for protected endpoints
2. **Rate Limiting:** API has rate limiting (100 requests per 15 minutes)
3. **CORS:** Configured for cross-origin requests
4. **File Uploads:** Maximum file size is 50MB
5. **HTTPS:** All requests must use HTTPS in production

---

## 📞 Support

For API support or questions, contact the backend team or refer to the test suite in the repository for usage examples.

**Repository:** `https://github.com/rahulwaghole14/eventmarketersbackend.git`
**Live API:** `https://eventmarketersbackend.onrender.com`
