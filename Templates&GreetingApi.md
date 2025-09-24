# Templates & Greetings API Requirements

## Overview
This document outlines the API requirements for the **TemplateGalleryScreen** and **GreetingTemplatesScreen**. Both screens need minimal APIs with smart filtering capabilities.

## Required API Endpoints

### 1. Templates API (TemplateGalleryScreen)

#### **Main Endpoint:**
**`GET /api/templates`**

**Purpose:** Get all professional templates with filtering options for the template gallery.

**Query Parameters:**
- `category` (optional, string): Filter by category - 'free', 'premium', or 'all' (default: 'all')
- `language` (optional, string): Filter by language - 'English', 'Hindi', 'Marathi', etc.
- `type` (optional, string): Filter by type - 'daily', 'festival', 'special', or 'all' (default: 'all')
- `search` (optional, string): Search term for template name, description, or tags
- `page` (optional, number): Page number for pagination (default: 1)
- `limit` (optional, number): Number of templates per page (default: 20)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "thumbnail": "string",
        "imageUrl": "string",
        "category": "free|premium",
        "type": "daily|festival|special",
        "language": "string",
        "tags": ["string"],
        "likes": 156,
        "downloads": 89,
        "views": 1200,
        "isLiked": false,
        "isDownloaded": false,
        "isPremium": true,
        "fileSize": 1024000,
        "createdAt": "ISO date string",
        "updatedAt": "ISO date string"
      }
    ],
    "total": 500,
    "page": 1,
    "limit": 20,
    "totalPages": 25
  },
  "message": "string"
}
```

#### **Supporting Endpoints:**

**`POST /api/templates/{id}/like`**
- **Purpose:** Like/unlike a template
- **Response:** `{ "success": true, "message": "string", "isLiked": boolean }`

**`POST /api/templates/{id}/download`**
- **Purpose:** Download a template
- **Response:** `{ "success": true, "message": "string" }`

**`GET /api/templates/languages`**
- **Purpose:** Get available languages for filtering
- **Response:** `{ "success": true, "data": [{"code": "en", "name": "English", "nativeName": "English"}], "message": "string" }`

**`GET /api/templates/categories`**
- **Purpose:** Get available categories
- **Response:** `{ "success": true, "data": ["free", "premium"], "message": "string" }`

---

### 2. Greetings API (GreetingTemplatesScreen)

#### **Main Endpoint:**
**`GET /api/greeting-templates`**

**Purpose:** Get all greeting templates with filtering options for the greeting gallery.

**Query Parameters:**
- `category` (optional, string): Filter by category - 'good-morning', 'birthday', 'quotes', 'anniversary', etc.
- `language` (optional, string): Filter by language - 'English', 'Hindi', 'Marathi', etc.
- `isPremium` (optional, boolean): Filter premium/free templates
- `search` (optional, string): Search term for template name or content
- `page` (optional, number): Page number for pagination (default: 1)
- `limit` (optional, number): Number of templates per page (default: 20)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "string",
        "name": "string",
        "thumbnail": "string",
        "category": "string",
        "content": {
          "text": "string",
          "background": "string",
          "stickers": ["string"],
          "emojis": ["string"],
          "layout": "vertical|horizontal|square"
        },
        "likes": 245,
        "downloads": 189,
        "isLiked": false,
        "isDownloaded": false,
        "isPremium": false,
        "createdAt": "ISO date string",
        "updatedAt": "ISO date string"
      }
    ],
    "total": 300,
    "page": 1,
    "limit": 20,
    "totalPages": 15
  },
  "message": "string"
}
```

#### **Supporting Endpoints:**

**`GET /api/greeting-categories`**
- **Purpose:** Get available greeting categories
- **Response:** 
```json
{
  "success": true,
  "data": [
    {
      "id": "good-morning",
      "name": "Good Morning",
      "icon": "wb-sunny",
      "color": "#FFD700"
    },
    {
      "id": "birthday",
      "name": "Birthday",
      "icon": "cake",
      "color": "#FF69B4"
    }
  ],
  "message": "string"
}
```

**`GET /api/greeting-templates/search`**
- **Purpose:** Search greeting templates
- **Query Parameters:** `q` (required, string) - search query
- **Response:** Same format as main templates endpoint

**`POST /api/greeting-templates/{id}/like`**
- **Purpose:** Like/unlike a greeting template
- **Response:** `{ "success": true, "message": "string", "isLiked": boolean }`

**`POST /api/greeting-templates/{id}/download`**
- **Purpose:** Download a greeting template
- **Response:** `{ "success": true, "message": "string" }`

**`GET /api/stickers`**
- **Purpose:** Get available stickers for greeting templates
- **Response:** `{ "success": true, "data": ["🌟", "✨", "💫", "⭐"], "message": "string" }`

**`GET /api/emojis`**
- **Purpose:** Get available emojis for greeting templates
- **Response:** `{ "success": true, "data": ["😀", "😃", "😄", "😁"], "message": "string" }`

---

## Authentication Requirements

- All endpoints require Bearer token authentication
- User-specific data (isLiked, isDownloaded) should be based on authenticated user
- Premium content access should be checked against user subscription status

## Error Handling

- Return consistent error format: `{ success: false, message: string, data: null }`
- Use appropriate HTTP status codes (400, 401, 403, 404, 500)
- Handle pagination errors gracefully

## Performance Considerations

- Implement pagination for all list endpoints
- Use database indexes on frequently queried fields (category, isPremium, createdAt)
- Consider implementing CDN for images and thumbnails
- Cache frequently accessed data (categories, languages)

## Current Implementation Status

- ✅ **Frontend Integration**: Complete with mock data fallback
- ✅ **API Service**: Created with TypeScript interfaces
- ✅ **Error Handling**: Implemented with offline mode support
- ❌ **Backend Endpoints**: Need to be implemented
- ❌ **Database Schema**: Need to be designed
- ❌ **Authentication**: Need to be integrated

## Testing

Both screens currently work with mock data. Once the APIs are implemented:

1. The screens will automatically try to load data from APIs
2. If APIs fail, they fall back to mock data
3. Console logs will show API success/failure status
4. Users will see appropriate loading states

## Priority Order for Backend Implementation

### **High Priority (Core Functionality):**
1. `GET /api/templates` - Templates main endpoint
2. `GET /api/greeting-templates` - Greetings main endpoint

### **Medium Priority (Enhanced Features):**
3. `GET /api/greeting-categories` - Greeting categories
4. `GET /api/templates/languages` - Available languages
5. `GET /api/templates/categories` - Template categories

### **Low Priority (User Interactions):**
6. `POST /api/templates/{id}/like` - Template likes
7. `POST /api/greeting-templates/{id}/like` - Greeting likes
8. `POST /api/templates/{id}/download` - Template downloads
9. `POST /api/greeting-templates/{id}/download` - Greeting downloads
10. `GET /api/stickers` - Stickers
11. `GET /api/emojis` - Emojis

## Summary

**Total APIs Needed:**
- **Templates Screen**: 1 main + 4 supporting = **5 APIs**
- **Greetings Screen**: 1 main + 6 supporting = **7 APIs**
- **Total**: **12 APIs** (but only 2 are critical for basic functionality)

**Simplified Implementation:**
- Start with the 2 main endpoints for basic functionality
- Add supporting endpoints as needed
- Both screens will work with mock data until APIs are ready

## Next Steps for Backend Team

1. **Design Database Schema** for templates and greeting templates
2. **Implement the 2 main APIs** (`/templates` and `/greeting-templates`)
3. **Add authentication integration**
4. **Test with the mobile app** to ensure data format compatibility
5. **Implement supporting endpoints** as needed
6. **Add caching layer** for better performance
