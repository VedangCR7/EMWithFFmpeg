# Search API and Response Details
## APIs Used During Search and Their Response Structures

---

## 🔍 **PRIMARY SEARCH APIs**

### **1. Business Category Posters API**

**Service**: `businessCategoryPostersApi.getPostersByCategory()`

**API Endpoint**:
```
GET /api/mobile/posters/category/{category}?limit={limit}&categoryId={categoryId}&search={searchQuery}
```

**Usage in Search**:
```typescript
const apiResponse = await businessCategoryPostersApi.getPostersByCategory(
  matchedCategory.name, 
  50, 
  false, 
  undefined, 
  searchQuery  // Enhanced with search query
);
```

**Response Structure**:

#### **Child Category Response (Flat)**:
```json
{
  "success": true,
  "data": {
    "posters": [
      {
        "id": "poster_123",
        "title": "Social Media Template",
        "description": "Professional social media post",
        "category": "Social Media Marketing",
        "thumbnailUrl": "/thumbnails/social-media-thumb.jpg",
        "imageUrl": "/images/social-media-full.jpg",
        "downloadUrl": "/downloads/social-media.jpg"
      }
    ],
    "category": "Social Media Marketing",
    "total": 45,
    "isHierarchical": false
  }
}
```

#### **Parent Category Response (Hierarchical)**:
```json
{
  "success": true,
  "data": {
    "isHierarchical": true,
    "parentCategory": "Business Marketing",
    "parentPosters": [
      {
        "id": "parent_poster_1",
        "title": "Business Marketing Template",
        "description": "General marketing template",
        "category": "Business Marketing",
        "thumbnailUrl": "/thumbnails/business-marketing-thumb.jpg",
        "imageUrl": "/images/business-marketing-full.jpg",
        "downloadUrl": "/downloads/business-marketing.jpg"
      }
    ],
    "categories": [
      {
        "name": "Social Media Marketing",
        "posters": [
          {
            "id": "child_poster_1",
            "title": "Facebook Post",
            "description": "Facebook marketing template",
            "category": "Social Media Marketing",
            "thumbnailUrl": "/thumbnails/facebook-thumb.jpg",
            "imageUrl": "/images/facebook-full.jpg",
            "downloadUrl": "/downloads/facebook.jpg"
          }
        ]
      },
      {
        "name": "Email Marketing",
        "posters": [
          {
            "id": "child_poster_2",
            "title": "Email Template",
            "description": "Email marketing template",
            "category": "Email Marketing",
            "thumbnailUrl": "/thumbnails/email-thumb.jpg",
            "imageUrl": "/images/email-full.jpg",
            "downloadUrl": "/downloads/email.jpg"
          }
        ]
      }
    ],
    "totalPosters": 68
  }
}
```

**Frontend Processing**:
```typescript
if (apiResponse.data.isHierarchical && apiResponse.data.categories) {
  // Extract parent category data
  if (apiResponse.data.parentCategory && apiResponse.data.parentPosters) {
    parentCategoryResults = apiResponse.data.parentPosters.map(poster => ({
      ...poster,
      category: apiResponse.data.parentCategory
    }));
  }
  
  // Extract child category data
  const childCategoryResults = apiResponse.data.categories.flatMap(cat => 
    (cat.posters || cat.images || []).map(template => ({
      ...template,
      category: cat.name
    }))
  );
  
  // Combine parent and child results
  apiResults = [...parentCategoryResults, ...childCategoryResults];
} else if (apiResponse.data.posters) {
  // Flat response (child category)
  apiResults = apiResponse.data.posters;
}
```

---

### **2. Greeting Templates Search API**

**Service**: `greetingTemplatesService.searchTemplates()`

**API Endpoint**:
```
GET /api/mobile/greetings/templates?search={query}&language={language}&limit={limit}
```

**Usage in Search**:
```typescript
const categoryTemplates = await greetingTemplatesService.searchTemplates(category.name);
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "greeting_123",
        "title": "Birthday Wishes",
        "description": "Happy birthday greeting",
        "category": "Birthday",
        "thumbnailUrl": "/thumbnails/birthday-thumb.jpg",
        "imageUrl": "/images/birthday-full.jpg",
        "downloadUrl": "/downloads/birthday.jpg",
        "tags": ["birthday", "celebration", "wishes"],
        "language": "english"
      }
    ],
    "total": 25
  }
}
```

---

## 🧩 **SUPPORTING APIS**

### **3. Business Categories API**

**Service**: `businessCategoriesService.getBusinessCategories()`

**API Endpoint**:
```
GET /api/mobile/business-categories/business
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_1",
        "name": "Social Media Marketing",
        "parentCategoryName": "Business Marketing",
        "parent": "Business Marketing",
        "posterCount": 45
      },
      {
        "id": "cat_2", 
        "name": "Email Marketing",
        "parentCategoryName": "Business Marketing",
        "parent": "Business Marketing",
        "posterCount": 23
      },
      {
        "id": "cat_3",
        "name": "Business Marketing",
        "parentCategoryName": null,
        "parent": null,
        "posterCount": 15
      }
    ]
  }
}
```

### **4. Greeting Categories API**

**Service**: `greetingTemplatesService.getGreetingCategories()`

**API Endpoint**:
```
GET /api/mobile/greetings/categories
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "greeting_cat_1",
        "name": "Birthday",
        "parentCategoryName": "Celebrations",
        "parent": "Celebrations",
        "templateCount": 50
      },
      {
        "id": "greeting_cat_2",
        "name": "Daily Greetings",
        "parentCategoryName": null,
        "parent": null,
        "templateCount": 30
      }
    ]
  }
}
```

---

## 🎯 **SEARCH FLOW WITH API RESPONSES**

### **1. Category Matching**
```typescript
// Match categories by name OR parent field
const matchingCategories = filteredGreetingCategoriesList.filter(category =>
  category.name.toLowerCase().includes(searchLower) ||
  (category.parent && category.parent.toLowerCase().includes(searchLower))
);
```

### **2. API Enhancement**
```typescript
// For each matched category, fetch API results
const businessCategoryResultsPromises = allMatchingCategories.map(async (category) => {
  const apiResponse = await businessCategoryPostersApi.getPostersByCategory(
    category.name, 
    50, 
    false, 
    undefined, 
    searchQuery
  );
  return apiResponse.success && apiResponse.data?.posters ? 
    apiResponse.data.posters : [];
});
```

### **3. Response Processing**
```typescript
// Handle hierarchical response (parent category)
if (apiResponse.data.isHierarchical && apiResponse.data.categories) {
  // Extract parent + child results
  const parentResults = apiResponse.data.parentPosters || [];
  const childResults = apiResponse.data.categories.flatMap(cat => cat.posters || []);
  apiResults = [...parentResults, ...childResults];
}
// Handle flat response (child category)
else if (apiResponse.data.posters) {
  apiResults = apiResponse.data.posters;
}
```

### **4. Result Merging**
```typescript
// Merge local + API results without duplicates
const mergedResults = mergeResults(localResults, apiResults);
```

---

## 🚀 **CACHING STRATEGY**

### **Business Category Posters**:
- **Cache Duration**: 10 minutes
- **Cache Key**: `category_{categoryName}`
- **Cache Hit**: Returns cached posters with limit applied
- **Cache Miss**: Fetches from API and stores in cache

### **Greeting Templates**:
- **Search Cache**: 2 minutes TTL
- **Cache Key**: `greeting_search_{query}_{language}_{limit}`
- **Fast Search**: 5 minutes TTL for previews (limit ≤ 20)

### **Categories**:
- **Business Categories**: 10 minutes TTL
- **Greeting Categories**: 10 minutes TTL
- **Cache Key**: `business_categories` / `greeting_categories`

---

## 📊 **RESPONSE TRANSFORMATION**

### **URL Processing**:
```typescript
const baseUrl = 'https://eventmarketersbackend.onrender.com';
const postersWithAbsoluteUrls = posters.map((poster: any) => {
  const thumbnailUrl = poster.thumbnailUrl || poster.thumbnail;
  return {
    id: poster.id,
    title: poster.title,
    description: poster.description,
    category: poster.category,
    thumbnail: thumbnailUrl && !thumbnailUrl.startsWith('http')
      ? `${baseUrl}${thumbnailUrl}`
      : thumbnailUrl,
    imageUrl: imageUrl && !imageUrl.startsWith('http')
      ? `${baseUrl}${imageUrl}`
      : imageUrl,
    downloadUrl: downloadUrl && !downloadUrl.startsWith('http')
      ? `${baseUrl}${downloadUrl}`
      : downloadUrl
  };
});
```

### **Data Normalization**:
- Backend `thumbnailUrl` → Frontend `thumbnail`
- Relative URLs → Absolute URLs with base URL
- Category assignment from hierarchical response
- Duplicate removal based on ID

---

## 🎯 **KEY API FEATURES**

### **Enhanced Category API**:
- **Search Parameter**: `?search={query}` for enhanced search
- **Hierarchical Support**: Returns parent + child data for parent categories
- **Backward Compatibility**: Flat responses for child categories
- **Flexible Limits**: Configurable result limits per category

### **Multi-Variant Search**:
- **Original Query**: Exact search term
- **Normalized Query**: Lowercase, trimmed
- **Partial Matching**: `includes()` for flexible matching
- **Parent Field Support**: Match by parent category name

### **Performance Optimization**:
- **Parallel Execution**: Multiple API calls run simultaneously
- **Intelligent Caching**: Different TTL for different use cases
- **Batch Processing**: Efficient data transformation
- **Lazy Loading**: Load more results on demand
