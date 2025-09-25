# 🌐 Web App API Collection - EventMarketers Admin Dashboard

## 📋 **Overview**
This API collection is specifically designed for the **Web Application** (Admin/Subadmin Dashboard) of EventMarketers. It includes all the APIs needed for content management, user management, and business operations.

---

## 🔐 **Authentication**

### **Base URL:** `https://eventmarketersbackend.onrender.com`

### **Admin Login**
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "email": "admin@eventmarketers.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmfxpupnb0000orvz9poe1a5b",
    "email": "admin@eventmarketers.com",
    "name": "System Administrator",
    "role": "ADMIN",
    "userType": "ADMIN"
  }
}
```

### **Subadmin Login**
```http
POST /api/auth/subadmin/login
Content-Type: application/json

{
  "email": "subadmin@eventmarketers.com",
  "password": "subadmin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmfxpuroh0002orvzx440tvan",
    "email": "subadmin@eventmarketers.com",
    "name": "Content Manager",
    "role": "Content Manager",
    "userType": "SUBADMIN"
  }
}
```

---

## 📊 **Admin APIs**

### **1. Subadmin Management**

#### **Get All Subadmins**
```http
GET /api/admin/subadmins
Authorization: Bearer <admin_token>
```

#### **Create Subadmin**
```http
POST /api/admin/subadmins
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "New Subadmin",
  "email": "new.subadmin@example.com",
  "password": "SecurePassword123",
  "mobileNumber": "+1234567890",
  "role": "Content Manager",
  "permissions": ["Images", "Videos", "Categories"],
  "assignedCategories": ["Restaurant", "Wedding Planning"]
}
```

#### **Update Subadmin**
```http
PUT /api/admin/subadmins/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Updated Subadmin",
  "email": "updated@example.com",
  "role": "Content Manager",
  "permissions": ["Images", "Videos"],
  "assignedCategories": ["Restaurant"]
}
```

#### **Delete Subadmin**
```http
DELETE /api/admin/subadmins/:id
Authorization: Bearer <admin_token>
```

### **2. Business Categories Management**

#### **Get All Business Categories**
```http
GET /api/admin/business-categories
Authorization: Bearer <admin_token>
```

#### **Create Business Category**
```http
POST /api/admin/business-categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "New Category",
  "description": "Category description",
  "icon": "🏢",
  "sortOrder": 6
}
```

### **Current Business Categories:**
| # | Category Name | Icon | Description | Sort Order |
|---|---------------|------|-------------|------------|
| 1 | **Event Planners** | 🎉 | Event planning and coordination services | 1 |
| 2 | **Decorators** | 🎨 | Event decoration and design services | 2 |
| 3 | **Sound Suppliers** | 🔊 | Audio equipment and sound services | 3 |
| 4 | **Light Suppliers** | 💡 | Lighting equipment and services | 4 |
| 5 | **General** | 🏢 | General business services and content | 5 |

### **3. Customer Subscription Management**

#### **Activate Customer Subscription**
```http
POST /api/admin/customers/:customerId/activate-subscription
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "plan": "YEARLY",
  "amount": 299.99,
  "currency": "USD",
  "paymentMethod": "Credit Card",
  "paymentId": "payment_123"
}
```

#### **Deactivate Customer Subscription**
```http
POST /api/admin/customers/:customerId/deactivate-subscription
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Customer request"
}
```

#### **Get Customer Subscription**
```http
GET /api/admin/customers/:customerId/subscription
Authorization: Bearer <admin_token>
```

---

## 🖼️ **Content Management APIs**

### **1. Image Management**

#### **Get All Images**
```http
GET /api/content/images?category=BUSINESS&status=APPROVED&page=1&limit=10
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `category`: BUSINESS, FESTIVAL, GENERAL
- `status`: PENDING, APPROVED, REJECTED
- `businessCategory`: Business category ID
- `uploaderType`: ADMIN, SUBADMIN
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### **Upload Image**
```http
POST /api/content/images/upload
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Form Data:
- image: [file] (required)
- title: "Image Title" (required, min 2 chars)
- category: "BUSINESS" (required: BUSINESS, FESTIVAL, GENERAL)
- description: "Image description" (optional)
- businessCategoryId: "category_id" (optional, for BUSINESS category)
- tags: "tag1,tag2,tag3" (optional, comma-separated)
```

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "image": {
    "id": "cmfxwcdbx00036x025w84xvc8",
    "title": "Image Title",
    "description": "Image description",
    "url": "/uploads/images/1758713053415-945401574.png",
    "thumbnailUrl": "/uploads/thumbnails/thumb_1758713053415-945401574.png",
    "category": "BUSINESS",
    "businessCategoryId": null,
    "tags": null,
    "fileSize": 70,
    "dimensions": "1x1",
    "format": "png",
    "uploaderType": "ADMIN",
    "approvalStatus": "APPROVED",
    "downloads": 0,
    "views": 0,
    "createdAt": "2025-09-24T11:24:13.821Z"
  }
}
```

#### **Approve/Reject Image**
```http
PUT /api/content/images/:id/approval
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "APPROVED", // or "REJECTED"
  "reason": "Rejection reason" // optional, for rejections
}
```

### **2. Video Management**

#### **Get All Videos**
```http
GET /api/content/videos?category=BUSINESS&status=APPROVED&page=1&limit=10
Authorization: Bearer <admin_token>
```

#### **Upload Video**
```http
POST /api/content/videos/upload
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Form Data:
- video: [file] (required)
- title: "Video Title" (required, min 2 chars)
- category: "BUSINESS" (required: BUSINESS, FESTIVAL, GENERAL)
- description: "Video description" (optional)
- businessCategoryId: "category_id" (optional, for BUSINESS category)
- tags: "tag1,tag2,tag3" (optional, comma-separated)
- duration: 120 (optional, in seconds)
```

#### **Approve/Reject Video**
```http
PUT /api/content/videos/:id/approval
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "APPROVED", // or "REJECTED"
  "reason": "Rejection reason" // optional, for rejections
}
```

---

## 📈 **Analytics APIs**

### **1. User Analytics**
```http
GET /api/analytics/users
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "totalUsers": 150,
  "totalCustomers": 45,
  "activeCustomers": 32,
  "usersByMonth": [...]
}
```

### **2. Content Analytics**
```http
GET /api/analytics/content
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "totalImages": 250,
  "totalVideos": 80,
  "pendingImages": 15,
  "approvedImages": 200,
  "rejectedImages": 35,
  "pendingVideos": 8,
  "approvedVideos": 65,
  "rejectedVideos": 7,
  "contentByCategory": [...]
}
```

### **3. Download Analytics**
```http
GET /api/analytics/downloads
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "totalImageDownloads": 1250,
  "totalVideoDownloads": 450,
  "topImages": [...],
  "topVideos": [...]
}
```

### **4. Dashboard Analytics**
```http
GET /api/analytics/dashboard
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "totalUsers": 150,
  "totalCustomers": 45,
  "totalContent": 330,
  "totalImages": 250,
  "totalVideos": 80,
  "totalDownloads": 1700,
  "activeSubscriptions": 32,
  "pendingContent": 23
}
```

---

## 🔍 **Search APIs**

### **1. Search Images**
```http
GET /api/search/images?q=search_term&category=BUSINESS&page=1&limit=10
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `q`: Search query
- `category`: BUSINESS, FESTIVAL, GENERAL
- `businessCategoryId`: Business category ID
- `tags`: Comma-separated tags
- `approvalStatus`: PENDING, APPROVED, REJECTED
- `uploaderType`: ADMIN, SUBADMIN
- `sortBy`: title, downloads, views, fileSize, createdAt
- `sortOrder`: asc, desc
- `page`: Page number
- `limit`: Items per page

### **2. Search Videos**
```http
GET /api/search/videos?q=search_term&category=BUSINESS&page=1&limit=10
Authorization: Bearer <admin_token>
```

### **3. Search All Content**
```http
GET /api/search/content?q=search_term&category=BUSINESS&page=1&limit=10
Authorization: Bearer <admin_token>
```

### **4. Search Suggestions**
```http
GET /api/search/suggestions?query=search_term&type=all
Authorization: Bearer <admin_token>
```

### **5. Search Statistics**
```http
GET /api/search/stats
Authorization: Bearer <admin_token>
```

---

## 📁 **File Management APIs**

### **1. Upload Directory Status**
```http
GET /api/file-management/status
Authorization: Bearer <admin_token>
```

### **2. Supported File Types**
```http
GET /api/file-management/file-types
Authorization: Bearer <admin_token>
```

### **3. File Statistics**
```http
GET /api/file-management/stats
Authorization: Bearer <admin_token>
```

### **4. Directory Setup**
```http
POST /api/file-management/setup
Authorization: Bearer <admin_token>
```

### **5. Cleanup Orphaned Files**
```http
POST /api/file-management/cleanup
Authorization: Bearer <admin_token>
```

### **6. Get File Info**
```http
GET /api/file-management/file-info?path=uploads/images/filename.png
Authorization: Bearer <admin_token>
```

---

## 🔄 **Content Sync APIs**

### **1. Sync Images to Mobile**
```http
POST /api/content-sync/images
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "imageIds": ["image_id_1", "image_id_2"],
  "force": false
}
```

### **2. Sync Videos to Mobile**
```http
POST /api/content-sync/videos
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "videoIds": ["video_id_1", "video_id_2"],
  "force": false
}
```

### **3. Get Sync Status**
```http
GET /api/content-sync/status
Authorization: Bearer <admin_token>
```

### **4. Bulk Sync All Content**
```http
POST /api/content-sync/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "contentType": "all", // or "images", "videos"
  "force": false
}
```

---

## 👥 **User Management APIs**

### **1. Get Installed Users**
```http
GET /api/installed-users?page=1&limit=10&isConverted=false
Authorization: Bearer <admin_token>
```

### **2. Get Customers**
```http
GET /api/installed-users/customers?page=1&limit=10&status=ACTIVE
Authorization: Bearer <admin_token>
```

### **3. Get User Details**
```http
GET /api/installed-users/:id
Authorization: Bearer <admin_token>
```

### **4. Update User Status**
```http
PUT /api/installed-users/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isConverted": true,
  "convertedToCustomerId": "customer_id"
}
```

---

## 🏢 **Business Profile APIs**

### **1. Get Business Profiles**
```http
GET /api/business-profile?page=1&limit=10
Authorization: Bearer <admin_token>
```

### **2. Get Business Profile Details**
```http
GET /api/business-profile/:id
Authorization: Bearer <admin_token>
```

### **3. Update Business Profile**
```http
PUT /api/business-profile/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

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

---

## 🔧 **Health Check**

### **System Health**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-24T11:24:13.821Z",
  "version": "1.0.0",
  "environment": "production"
}
```

---

## 📝 **Error Handling**

### **Common Error Responses**

#### **401 Unauthorized**
```json
{
  "success": false,
  "error": "Access token is required"
}
```

#### **403 Forbidden**
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

#### **400 Bad Request (Validation Error)**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "type": "field",
      "msg": "Title must be at least 2 characters",
      "path": "title",
      "location": "body"
    }
  ]
}
```

#### **500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

---

## 🔑 **Authentication Headers**

All authenticated requests must include:
```http
Authorization: Bearer <jwt_token>
```

**Token Expiration:** 7 days

---

## 📊 **Pagination**

Most list endpoints support pagination:
```http
GET /api/endpoint?page=1&limit=10
```

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

---

## 🎯 **Quick Start for Web App**

1. **Login as Admin:**
   ```javascript
   const response = await fetch('/api/auth/admin/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'admin@eventmarketers.com',
       password: 'admin123'
     })
   });
   const { token } = await response.json();
   ```

2. **Store Token:**
   ```javascript
   localStorage.setItem('adminToken', token);
   ```

3. **Use Token in Requests:**
   ```javascript
   const token = localStorage.getItem('adminToken');
   const response = await fetch('/api/content/images', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   ```

4. **Upload Image:**
   ```javascript
   const formData = new FormData();
   formData.append('image', imageFile);
   formData.append('title', 'My Image');
   formData.append('category', 'BUSINESS');
   
   const response = await fetch('/api/content/images/upload', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token}` },
     body: formData
   });
   ```

---

**📅 Last Updated:** September 24, 2024  
**🌐 Base URL:** `https://eventmarketersbackend.onrender.com`  
**🔐 Authentication:** JWT Bearer Token  
**📱 Compatible with:** Web Admin Dashboard, Subadmin Panel
