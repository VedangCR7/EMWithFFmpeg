# HomeScreen.tsx - API Endpoints Documentation

This document lists all API endpoints called from `src/screens/HomeScreen.tsx`.

## Base URL
All endpoints use the base URL: `https://eventmarketersbackend.onrender.com`

---

## 1. Home API Service (`homeApi`)

### 1.1. Get Featured Content
- **Endpoint**: `GET /api/mobile/home/featured`
- **Query Parameters**:
  - `limit` (number, optional): Number of items to return (default: all)
  - `type` (string, optional): Filter by type - 'banner' | 'promotion' | 'highlight' | 'all'
  - `active` (boolean, optional): Filter by active status
- **Called in HomeScreen.tsx**:
  - Line 1056: `homeApi.getFeaturedContent({ limit: 3 })` - Initial load (3 items)
  - Line 1125: `homeApi.getFeaturedContent({ limit: 10 })` - Full load (10 items)
- **Cache TTL**: 5 minutes
- **Purpose**: Fetch featured banners, promotions, and highlights for home screen

### 1.2. Get Video Content
- **Endpoint**: `GET /api/mobile/home/video-content`
- **Query Parameters**:
  - `limit` (number, optional): Number of videos to return
  - `category` (string, optional): Filter by category
  - `language` (string, optional): Filter by language
  - `isPremium` (boolean, optional): Filter premium/free videos
  - `sortBy` (string, optional): Sort by - 'popular' | 'recent' | 'likes' | 'views' | 'downloads'
  - `duration` (string, optional): Filter by duration - 'short' | 'medium' | 'long'
  - `tags` (string[], optional): Filter by tags
- **Called in HomeScreen.tsx**:
  - Line 1092: `homeApi.getVideoContent({ limit: 3 })` - Initial load (3 items)
  - Line 1145: `homeApi.getVideoContent({ limit: 20 })` - Full load (20 items)
- **Cache TTL**: 5 minutes
- **Purpose**: Fetch video templates and content for home screen

### 1.3. Get Upcoming Events
- **Endpoint**: `GET /api/mobile/home/upcoming-events`
- **Query Parameters**:
  - `limit` (number, optional): Number of events to return
  - `category` (string, optional): Filter by category
  - `location` (string, optional): Filter by location
  - `dateFrom` (string, optional): Filter events from date
  - `dateTo` (string, optional): Filter events to date
  - `isFree` (boolean, optional): Filter free/paid events
- **Called in HomeScreen.tsx**: Not directly called in current version (may be used in future)
- **Cache TTL**: 2 minutes (time-sensitive)
- **Purpose**: Fetch upcoming events/festivals for home screen

### 1.4. Get Professional Templates
- **Endpoint**: `GET /api/mobile/home/templates`
- **Query Parameters**:
  - `limit` (number, optional): Number of templates to return
  - `category` (string, optional): Filter by template category
  - `subcategory` (string, optional): Filter by subcategory
  - `isPremium` (boolean, optional): Filter premium/free templates
  - `sortBy` (string, optional): Sort by - 'popular' | 'recent' | 'likes' | 'downloads'
  - `tags` (string[], optional): Filter by tags
- **Called in HomeScreen.tsx**: Not directly called in current version (may be used in future)
- **Cache TTL**: 5 minutes
- **Purpose**: Fetch professional templates for home screen

### 1.5. Clear Cache
- **Method**: `homeApi.clearCache()`
- **Called in HomeScreen.tsx**:
  - Line 2189: `homeApi.clearCache()` - On refresh
- **Purpose**: Clear all home screen related cache

---

## 2. Greeting Templates Service (`greetingTemplatesService`)

### 2.1. Search Templates
- **Endpoint**: `GET /api/mobile/greetings/templates`
- **Query Parameters**:
  - `search` (string, required): Search query
  - `language` (string, optional): Filter by language
  - `limit` (number, optional): Number of results (default: 200)
- **Called in HomeScreen.tsx**:
  - Line 1190: `greetingTemplatesService.searchTemplates('business ethics')` - Business ethics section
  - Line 1191: `greetingTemplatesService.searchTemplates('success mindset')` - Success mindset section
  - Line 1192: `greetingTemplatesService.searchTemplates('social media growth')` - Social media growth section
  - Line 1193: `greetingTemplatesService.searchTemplates('money and finance')` - Money and finance section
  - Line 1194: `greetingTemplatesService.searchTemplates('business legend quote')` - Business legend quote section
  - Line 1195: `greetingTemplatesService.searchTemplates('business marketing tips')` - Business marketing tips section
  - Line 1196: `greetingTemplatesService.searchTemplates('business quotes')` - Business quotes section
  - Line 1253-1259: Same searches repeated for full load
  - Line 1524: `greetingTemplatesService.searchTemplates(category.name)` - Category preview images
  - Line 2059: `greetingTemplatesService.searchTemplates(category.name)` - Search by category name
  - Line 2108: `greetingTemplatesService.searchTemplates(searchQuery)` - User search query
  - Line 2120: `greetingTemplatesService.searchTemplates(category.name)` - Search matching categories
  - Line 2280: `greetingTemplatesService.searchTemplates(categoryName)` - Search by category name
- **Cache TTL**: 2 minutes for search results
- **Purpose**: Search greeting templates by query string

### 2.2. Get Categories
- **Endpoint**: `GET /api/mobile/greetings/categories`
- **Query Parameters**: None
- **Called in HomeScreen.tsx**:
  - Line 1591: `greetingTemplatesService.getCategories()` - Load greeting categories list
- **Cache TTL**: 5 minutes
- **Purpose**: Fetch all available greeting categories

### 2.3. Refresh Categories
- **Method**: `greetingTemplatesService.refreshCategories()`
- **Endpoint**: Same as Get Categories (clears cache first)
- **Called in HomeScreen.tsx**:
  - Line 2197: `greetingTemplatesService.refreshCategories()` - On refresh
- **Purpose**: Force refresh categories by clearing cache and fetching fresh data

### 2.4. Get Templates
- **Endpoint**: `GET /api/mobile/greetings/templates`
- **Query Parameters**:
  - `category` (string, optional): Filter by category
  - `language` (string, optional): Filter by language
  - `isPremium` (boolean, optional): Filter premium/free templates
  - `search` (string, optional): Search query
  - `limit` (number, optional): Number of templates (default: 200 for category requests)
- **Called in HomeScreen.tsx**: Not directly called (searchTemplates is used instead)
- **Cache TTL**: 5 minutes
- **Purpose**: Get greeting templates with filters

### 2.5. Clear Cache
- **Method**: `greetingTemplatesService.clearCache()`
- **Called in HomeScreen.tsx**:
  - Line 2190: `greetingTemplatesService.clearCache()` - On refresh
- **Purpose**: Clear greeting templates cache

---

## 3. Calendar API Service (`calendarApi`)

### 3.1. Get Posters By Date
- **Endpoint**: `GET /api/mobile/calendar/posters/{date}`
- **Path Parameters**:
  - `date` (string, required): Date in format YYYY-MM-DD
- **Query Parameters**: None
- **Called in HomeScreen.tsx**:
  - Line 1375: `calendarApi.getPostersByDate(todayString)` - Load today's posters
  - Line 1399: `calendarApi.getPostersByDate(dateString)` - Load posters for next 15 days (in background)
- **Cache TTL**: 2 minutes
- **Purpose**: Fetch calendar/festival posters for a specific date

### 3.2. Clear Cache
- **Method**: `calendarApi.clearCache()`
- **Called in HomeScreen.tsx**:
  - Line 2191: `calendarApi.clearCache()` - On refresh
- **Purpose**: Clear calendar posters cache

---

## 4. Business Category Posters API (`businessCategoryPostersApi`)

### 4.1. Get Posters By Category
- **Endpoint**: `GET /api/mobile/posters/category/{category}`
- **Path Parameters**:
  - `category` (string, required): Category name (URL encoded)
- **Query Parameters**:
  - `limit` (number, optional): Number of posters to return
- **Called in HomeScreen.tsx**:
  - Line 1480: `businessCategoryPostersApi.getPostersByCategory(category.name, 6)` - Fetch preview images for business categories
  - Line 3265: `businessCategoryPostersApi.getPostersByCategory(category.name, 6)` - Load preview after navigation
- **Cache TTL**: Managed internally by service
- **Purpose**: Fetch business category posters

### 4.2. Get User Category Posters
- **Endpoint**: `GET /api/mobile/posters/category/{category}` (called internally)
- **Called in HomeScreen.tsx**: Not directly called
- **Purpose**: Get posters for user's business category

### 4.3. Clear Cache
- **Method**: `businessCategoryPostersApi.clearCache()`
- **Called in HomeScreen.tsx**:
  - Line 2413: `businessCategoryPostersApi.clearCache()` - On refresh
- **Purpose**: Clear business category posters cache

---

## 5. Business Categories Service (`businessCategoriesService`)

### 5.1. Get Business Categories
- **Endpoint**: `GET /api/mobile/business-categories/business`
- **Query Parameters**: None
- **Called in HomeScreen.tsx**:
  - Line 1686: `businessCategoriesService.getBusinessCategories()` - Load business categories
- **Cache TTL**: Managed by cache service
- **Purpose**: Fetch all available business categories

---

## 6. Business Profile Service (`businessProfileService`)

### 6.1. Get User Business Profiles
- **Endpoint**: `GET /api/mobile/business-profile/{userId}`
- **Path Parameters**:
  - `userId` (string, required): User ID
- **Query Parameters**: None
- **Called in HomeScreen.tsx**:
  - Line 641: `businessProfileService.getUserBusinessProfiles(currentUserId)` - Load user's business profiles
- **Cache TTL**: Managed by cache service
- **Purpose**: Fetch business profiles for the current user

---

## 7. Dashboard Service (`dashboardService`)

### 7.1. Search Templates
- **Endpoint**: Not implemented (returns empty array)
- **Called in HomeScreen.tsx**:
  - Line 2275: `dashboardService.searchTemplates(searchQuery)` - Search templates
- **Purpose**: Search templates (currently mock implementation)

### 7.2. Download Template
- **Endpoint**: Not implemented (mock)
- **Called in HomeScreen.tsx**:
  - Line 2233: `dashboardService.downloadTemplate(templateId)` - Download template
- **Purpose**: Download a template (currently mock implementation)

---

## Summary

### Total Endpoints Used: 12 unique endpoints

1. `GET /api/mobile/home/featured` - Featured content
2. `GET /api/mobile/home/video-content` - Video content
3. `GET /api/mobile/home/upcoming-events` - Upcoming events (not actively used)
4. `GET /api/mobile/home/templates` - Professional templates (not actively used)
5. `GET /api/mobile/greetings/templates` - Search/get greeting templates
6. `GET /api/mobile/greetings/categories` - Get greeting categories
7. `GET /api/mobile/calendar/posters/{date}` - Get calendar posters by date
8. `GET /api/mobile/posters/category/{category}` - Get business category posters
9. `GET /api/mobile/business-categories/business` - Get business categories
10. `GET /api/mobile/business-profile/{userId}` - Get user business profiles
11. `GET /health` - Health check (called by businessProfileService)
12. `POST /api/mobile/greetings/templates/{templateId}/download` - Download greeting template (not directly called in HomeScreen)

### Cache Management Methods: 4
- `homeApi.clearCache()`
- `greetingTemplatesService.clearCache()`
- `calendarApi.clearCache()`
- `businessCategoryPostersApi.clearCache()`

---

## Notes

- All endpoints use GET method except download template which uses POST
- Most endpoints support caching with TTL ranging from 2-5 minutes
- Search endpoints have shorter cache TTL (2 minutes) for fresher results
- Calendar endpoints have 2-minute cache due to time-sensitive nature
- Multiple parallel calls are made for greeting template sections (7 different search queries)
- Background loading is used for non-critical data (future dates, full content loads)

