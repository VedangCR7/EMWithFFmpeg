# Simple Templates & Greetings API Requirements

## Overview
Only **2 simple endpoints** are needed for the Templates and Greetings screens to work with real data.

## Required Endpoints

### 1. Templates Endpoint
**`GET /api/templates`**

**Purpose:** Get all professional templates for TemplateGalleryScreen

**Query Parameters:**
- `category` (optional): 'free', 'premium', or 'all'
- `language` (optional): 'English', 'Hindi', 'Marathi', etc.
- `type` (optional): 'daily', 'festival', 'special', or 'all'
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": [
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
      "isLiked": false,
      "isDownloaded": false,
      "isPremium": true,
      "createdAt": "ISO date string"
    }
  ],
  "message": "string"
}
```

---

### 2. Greetings Endpoint
**`GET /api/greeting-templates`**

**Purpose:** Get all greeting templates for GreetingTemplatesScreen

**Query Parameters:**
- `category` (optional): 'good-morning', 'birthday', 'quotes', etc.
- `language` (optional): 'English', 'Hindi', 'Marathi', etc.
- `isPremium` (optional): true/false
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "thumbnail": "string",
      "category": "string",
      "content": {
        "text": "string",
        "background": "string",
        "layout": "vertical|horizontal|square"
      },
      "likes": 245,
      "downloads": 189,
      "isLiked": false,
      "isDownloaded": false,
      "isPremium": false,
      "createdAt": "ISO date string"
    }
  ],
  "message": "string"
}
```

## Authentication
- Both endpoints require Bearer token authentication
- User-specific data (isLiked, isDownloaded) based on authenticated user

## Error Handling
- Return: `{ "success": false, "message": "string", "data": null }`
- Use appropriate HTTP status codes

## Current Status
- ✅ Frontend ready with mock data fallback
- ❌ Backend endpoints need implementation

## Summary
**Total APIs Needed: 2**
1. `GET /api/templates` - For TemplateGalleryScreen
2. `GET /api/greeting-templates` - For GreetingTemplatesScreen

That's it! Both screens will work perfectly with just these 2 endpoints.
