# Business Profile API Requirements

## Overview
The business profile system requires **4 standard CRUD APIs** for complete functionality. Currently using mock data with API fallback.

## Required API Endpoints

### 1. Get Business Profiles
**`GET /api/business-profiles`**

**Purpose:** Get all business profiles for selection in VideoEditorScreen

**Query Parameters:**
- `category` (optional, string): Filter by business category
- `search` (optional, string): Search by name, description, or category
- `verified` (optional, boolean): Filter verified/unverified profiles

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "string",
      "address": "string",
      "phone": "string",
      "alternatePhone": "string",
      "email": "string",
      "website": "string",
      "logo": "string",
      "companyLogo": "string",
      "banner": "string",
      "rating": 4.8,
      "reviewCount": 156,
      "isVerified": true,
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "message": "string"
}
```

---

### 2. Create Business Profile
**`POST /api/business-profiles`**

**Purpose:** Create a new business profile

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "address": "string",
  "phone": "string",
  "alternatePhone": "string",
  "email": "string",
  "website": "string",
  "companyLogo": "string"
}
```

**Field Descriptions:**
- `name` (required): Company Name
- `description` (optional): Company Description
- `category` (required): Business Category - must be one of: "Event Planners", "Decorators", "Sound Suppliers", "Light Suppliers", "Video Services"
- `address` (required): Company Address
- `phone` (required): Mobile Number
- `alternatePhone` (optional): Alternative Mobile Number
- `email` (required): Email ID
- `website` (optional): Company Website URL
- `companyLogo` (optional): Company Logo (image URL or base64)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "category": "string",
    "address": "string",
    "phone": "string",
    "alternatePhone": "string",
    "email": "string",
    "website": "string",
    "companyLogo": "string",
    "logo": "string",
    "banner": "string",
    "rating": 0,
    "reviewCount": 0,
    "isVerified": false,
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  },
  "message": "Business profile created successfully"
}
```

---

### 3. Update Business Profile
**`PUT /api/business-profiles/{id}`**

**Purpose:** Update an existing business profile

**Request Body:** (Same as create, all fields optional)
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "address": "string",
  "phone": "string",
  "alternatePhone": "string",
  "email": "string",
  "website": "string",
  "companyLogo": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "category": "string",
    "address": "string",
    "phone": "string",
    "alternatePhone": "string",
    "email": "string",
    "website": "string",
    "companyLogo": "string",
    "logo": "string",
    "banner": "string",
    "rating": 4.8,
    "reviewCount": 156,
    "isVerified": true,
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  },
  "message": "Business profile updated successfully"
}
```

---

### 4. Delete Business Profile
**`DELETE /api/business-profiles/{id}`**

**Purpose:** Delete a business profile

**Response:**
```json
{
  "success": true,
  "message": "Business profile deleted successfully"
}
```

## Additional Supporting APIs

### Upload Business Images
**`POST /api/business-profiles/{id}/upload`**

**Purpose:** Upload logo or banner for business profile

**Request:** Multipart form data
- `file`: Image file
- `type`: 'logo' or 'banner'

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "string",
    "type": "logo|banner"
  },
  "message": "Image uploaded successfully"
}
```

### Get Single Business Profile
**`GET /api/business-profiles/{id}`**

**Purpose:** Get specific business profile by ID

**Response:** Same format as single profile in GET /api/business-profiles

## Authentication Requirements

- All endpoints require Bearer token authentication
- Users can only manage their own business profiles
- Admin users can manage all business profiles

## Error Handling

- Return consistent error format: `{ "success": false, "message": "string", "data": null }`
- Use appropriate HTTP status codes (400, 401, 403, 404, 500)
- Handle validation errors gracefully

## Performance Considerations

- Use database indexes on frequently queried fields (category, isVerified, createdAt)
- Consider implementing CDN for images and logos
- Cache frequently accessed data
- Limit response size for large datasets (typically users have 1-3 business profiles)

## Current Implementation Status

- ✅ **Frontend Integration**: Complete with mock data fallback
- ✅ **API Service**: Created with TypeScript interfaces
- ✅ **Error Handling**: Implemented with offline mode support
- ❌ **Backend Endpoints**: Need to be implemented
- ❌ **Database Schema**: Need to be designed
- ❌ **Authentication**: Need to be integrated

## Testing

The VideoEditorScreen currently works with mock data. Once the APIs are implemented:

1. The business profile selection modal will load real data from APIs
2. If APIs fail, it falls back to mock data
3. Console logs will show API success/failure status
4. Users will see appropriate loading states

## Priority Order for Backend Implementation

### **High Priority (Core Functionality):**
1. `GET /api/business-profiles` - Get all business profiles
2. `POST /api/business-profiles` - Create business profile

### **Medium Priority (Management Features):**
3. `PUT /api/business-profiles/{id}` - Update business profile
4. `GET /api/business-profiles/{id}` - Get single profile

### **Low Priority (Advanced Features):**
5. `DELETE /api/business-profiles/{id}` - Delete business profile
6. `POST /api/business-profiles/{id}/upload` - Upload images

## Summary

**Total APIs Needed: 6**
- **Core CRUD**: 4 APIs (GET, POST, PUT, DELETE)
- **Supporting**: 2 APIs (Get single, Upload images)

**Critical for VideoEditorScreen**: Only `GET /api/business-profiles` is needed for the business selection modal to work with real data.

## Exact Form Fields from Registration Screen

The business profile APIs must match these exact fields from the registration form:

1. **Company Name** (`name`) - Required
2. **Company Logo** (`companyLogo`) - Optional
3. **Business Category** (`category`) - Required, must be one of:
   - "Event Planners"
   - "Decorators" 
   - "Sound Suppliers"
   - "Light Suppliers"
   - "Video Services"
4. **Mobile Number** (`phone`) - Required
5. **Alternative Mobile Number** (`alternatePhone`) - Optional
6. **Email ID** (`email`) - Required
7. **Company Website URL** (`website`) - Optional
8. **Company Address** (`address`) - Required
9. **Company Description** (`description`) - Optional

**Note**: The registration form also includes password fields, but these are handled by the authentication system, not the business profile APIs.

## Next Steps for Backend Team

1. **Design Database Schema** for business profiles
2. **Implement the 4 core CRUD APIs**
3. **Add authentication integration**
4. **Test with the mobile app** to ensure data format compatibility
5. **Implement image upload functionality**
6. **Add caching layer** for better performance
