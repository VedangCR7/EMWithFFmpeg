# Home Screen API Requirements

## Overview
The home screen requires **4 main APIs** to display content to users. Currently, the app uses mock data as fallback, but these APIs need to be implemented for full functionality.

## Required API Endpoints

### 1. Featured Content API
**Endpoint:** `GET /api/home/featured`

**Purpose:** Get featured banners, promotions, and highlights for the home screen carousel.

**Query Parameters:**
- `limit` (optional, number): Number of items to return (default: 10)
- `type` (optional, string): Filter by type - 'banner', 'promotion', 'highlight', or 'all' (default: 'all')
- `active` (optional, boolean): Filter by active status (default: true)

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "imageUrl": "string",
      "videoUrl": "string",
      "link": "string",
      "type": "banner|promotion|highlight",
      "priority": 1,
      "isActive": true,
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "message": "string",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 2. Upcoming Events API
**Endpoint:** `GET /api/home/upcoming-events`

**Purpose:** Get upcoming events for the home screen.

**Query Parameters:**
- `limit` (optional, number): Number of events to return (default: 20)
- `category` (optional, string): Filter by event category
- `location` (optional, string): Filter by location
- `dateFrom` (optional, string): ISO date - filter events from this date
- `dateTo` (optional, string): ISO date - filter events until this date
- `isFree` (optional, boolean): Filter free/paid events

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "date": "ISO date string",
      "time": "HH:MM",
      "location": "string",
      "organizer": "string",
      "organizerId": "string",
      "imageUrl": "string",
      "category": "string",
      "price": 50.00,
      "isFree": false,
      "attendees": 150,
      "maxAttendees": 200,
      "tags": ["string"],
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "message": "string",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 3. Professional Templates API
**Endpoint:** `GET /api/home/templates`

**Purpose:** Get professional templates for the home screen gallery.

**Query Parameters:**
- `limit` (optional, number): Number of templates to return (default: 20)
- `category` (optional, string): Filter by template category
- `subcategory` (optional, string): Filter by subcategory
- `isPremium` (optional, boolean): Filter premium/free templates
- `sortBy` (optional, string): Sort by 'popular', 'recent', 'likes', or 'downloads' (default: 'popular')
- `tags` (optional, array): Filter by tags

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "thumbnail": "string",
      "previewUrl": "string",
      "category": "string",
      "subcategory": "string",
      "likes": 156,
      "downloads": 89,
      "views": 1200,
      "isLiked": false,
      "isDownloaded": false,
      "isPremium": true,
      "tags": ["string"],
      "fileSize": 1024000,
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "message": "string",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

### 4. Video Content API
**Endpoint:** `GET /api/home/video-content`

**Purpose:** Get video templates and content for the home screen.

**Query Parameters:**
- `limit` (optional, number): Number of videos to return (default: 20)
- `category` (optional, string): Filter by video category
- `language` (optional, string): Filter by language
- `isPremium` (optional, boolean): Filter premium/free videos
- `sortBy` (optional, string): Sort by 'popular', 'recent', 'likes', 'views', or 'downloads' (default: 'popular')
- `duration` (optional, string): Filter by 'short', 'medium', or 'long'
- `tags` (optional, array): Filter by tags

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "thumbnail": "string",
      "videoUrl": "string",
      "duration": 120,
      "category": "string",
      "language": "en",
      "likes": 89,
      "views": 2500,
      "downloads": 45,
      "isLiked": false,
      "isDownloaded": false,
      "isPremium": false,
      "tags": ["string"],
      "fileSize": 5242880,
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "message": "string",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 300,
    "totalPages": 15
  }
}
```

## Additional APIs

### 5. Search Content API
**Endpoint:** `GET /api/home/search`

**Purpose:** Search across templates, videos, and events.

**Query Parameters:**
- `q` (required, string): Search query
- `type` (optional, string): Filter by 'all', 'templates', 'videos', or 'events' (default: 'all')
- `limit` (optional, number): Number of results per type (default: 10)

### 6. Like/Unlike Content APIs
**Endpoints:**
- `POST /api/home/templates/{id}/like`
- `DELETE /api/home/templates/{id}/like`
- `POST /api/home/videos/{id}/like`
- `DELETE /api/home/videos/{id}/like`

### 7. Download Content APIs
**Endpoints:**
- `POST /api/home/templates/{id}/download`
- `POST /api/home/videos/{id}/download`

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
- Use database indexes on frequently queried fields (category, isActive, createdAt)
- Consider implementing CDN for images and videos
- Cache frequently accessed data (featured content, popular templates)

## Current Implementation Status

- ✅ **Frontend Integration**: Complete with mock data fallback
- ✅ **API Service**: Created with TypeScript interfaces
- ✅ **Error Handling**: Implemented with offline mode support
- ❌ **Backend Endpoints**: Need to be implemented
- ❌ **Database Schema**: Need to be designed
- ❌ **Authentication**: Need to be integrated

## Testing

The app currently works with mock data. Once the APIs are implemented:

1. The app will automatically try to load data from APIs
2. If APIs fail, it falls back to mock data
3. Users will see "Offline Mode" indicator when APIs are unavailable
4. Console logs will show API success/failure status

## Next Steps for Backend Team

1. **Design Database Schema** for featured content, events, templates, and videos
2. **Implement the 4 main APIs** with proper authentication
3. **Add search functionality** across all content types
4. **Implement like/download tracking** for user engagement
5. **Add caching layer** for better performance
6. **Test with the mobile app** to ensure data format compatibility
