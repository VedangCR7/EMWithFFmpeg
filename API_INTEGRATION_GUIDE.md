# API Integration Guide

This guide documents the complete API integration for the Daily Banner App using the backend at `https://daily-banner-app.onrender.com/api`.

## Base Configuration

The API base URL is configured in `src/services/api.ts`:
```typescript
baseURL: 'https://daily-banner-app.onrender.com/api'
```

## Authentication & User Management

### 1. User Registration
**Endpoint:** `POST /api/register`
```typescript
// Usage in auth.ts
const response = await api.post('/register', {
  email: userData.email,
  password: userData.password,
  companyName: userData.companyName,
  phoneNumber: userData.phoneNumber,
  name: userData.companyName,
});
```

### 2. User Login
**Endpoint:** `POST /api/login`
```typescript
// Usage in auth.ts
const response = await api.post('/login', {
  email,
  password,
});
```

### 3. Google OAuth Login
**Endpoint:** `POST /api/login/google`
```typescript
// Usage in auth.ts
const response = await api.post('/login/google', {
  idToken: userInfo.idToken,
  accessToken: userInfo.serverAuthCode,
});
```

### 4. User Logout
**Endpoint:** `POST /api/logout`
```typescript
// Usage in auth.ts
await api.post('/logout');
```

### 5. Get User Profile
**Endpoint:** `GET /api/user/profile`
```typescript
// Usage in auth.ts
const response = await api.get('/user/profile');
```

### 6. Update User Profile
**Endpoint:** `PUT /api/user/profile`
```typescript
// Usage in auth.ts
const response = await api.put('/user/profile', profileData);
```

## Subscription & Billing

### 1. Get Subscription Plans
**Endpoint:** `GET /api/subscription/plans`
```typescript
// Usage in payment.ts
const response = await api.get('/subscription/plans');
```

### 2. Subscribe to Plan
**Endpoint:** `POST /api/subscription/subscribe`
```typescript
// Usage in payment.ts
const response = await api.post('/subscription/subscribe', {
  planId,
  paymentMethod,
  autoRenew,
});
```

### 3. Get Subscription Status
**Endpoint:** `GET /api/subscription/status`
```typescript
// Usage in payment.ts
const response = await api.get('/subscription/status');
```

### 4. Renew Subscription
**Endpoint:** `POST /api/subscription/renew`
```typescript
// Usage in payment.ts
const response = await api.post('/subscription/renew');
```

### 5. Get Subscription History
**Endpoint:** `GET /api/subscription/history`
```typescript
// Usage in payment.ts
const response = await api.get('/subscription/history');
```

## Banner & Template APIs

### 1. Get Templates
**Endpoint:** `GET /api/templates`
```typescript
// Usage in templates.ts
const response = await api.get(`/templates?${params.toString()}`);
// Supports filters: category, language, search, type
```

### 2. Get Template by ID
**Endpoint:** `GET /api/template/{id}`
```typescript
// Usage in templates.ts
const response = await api.get(`/templates/${id}`);
```

### 3. Create Banner
**Endpoint:** `POST /api/banner/create`
```typescript
// Usage in templates.ts and bannerService.ts
const response = await api.post('/banner/create', {
  templateId,
  title,
  description,
  customizations,
});
```

### 4. Update Banner
**Endpoint:** `PUT /api/banner/{id}/update`
```typescript
// Usage in templates.ts and bannerService.ts
const response = await api.put(`/banner/${bannerId}/update`, updates);
```

### 5. Get User's Banners
**Endpoint:** `GET /api/banner/mine`
```typescript
// Usage in templates.ts and bannerService.ts
const response = await api.get('/banner/mine');
```

### 6. Get Banner Details
**Endpoint:** `GET /api/banner/{id}`
```typescript
// Usage in templates.ts and bannerService.ts
const response = await api.get(`/banner/${bannerId}`);
```

### 7. Delete Banner
**Endpoint:** `DELETE /api/banner/{id}`
```typescript
// Usage in templates.ts and bannerService.ts
await api.delete(`/banner/${bannerId}`);
```

## Media Management

### 1. Get Media Assets
**Endpoint:** `GET /api/media`
```typescript
// Usage in mediaService.ts
const response = await api.get('/media');
```

### 2. Upload Media
**Endpoint:** `POST /api/media/upload`
```typescript
// Usage in mediaService.ts
const formData = new FormData();
formData.append('file', file);
const response = await api.post('/media/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (progressEvent) => {
    // Handle upload progress
  },
});
```

### 3. Delete Media Asset
**Endpoint:** `DELETE /api/media/{id}`
```typescript
// Usage in mediaService.ts
await api.delete(`/media/${mediaId}`);
```

## Service Integration

### Authentication Service (`src/services/auth.ts`)
- Handles user registration, login, logout
- Supports both email/password and Google OAuth
- Manages authentication tokens
- Provides fallback to local storage for offline functionality

### Subscription Service (`src/services/payment.ts`)
- Manages subscription plans and billing
- Handles subscription status and history
- Provides subscription validation methods

### Templates Service (`src/services/templates.ts`)
- Fetches and filters templates
- Manages template categories and types
- Handles banner creation and management
- Provides caching for better performance

### Banner Service (`src/services/bannerService.ts`)
- Comprehensive banner management
- Supports CRUD operations on banners
- Handles banner publishing and archiving
- Provides banner statistics and search

### Media Service (`src/services/mediaService.ts`)
- Handles media upload and management
- Supports image and video uploads
- Provides file validation and progress tracking
- Manages media metadata and organization

## Error Handling

The API service includes comprehensive error handling:

```typescript
// Request interceptor adds auth tokens
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor handles errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle authentication errors
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);
```

## Caching Strategy

Services implement intelligent caching:
- Template data cached for 5 minutes
- User banners cached for 5 minutes
- Cache invalidation on data updates
- Fallback to mock data for development

## Offline Support

The app provides offline functionality:
- Local storage for user data
- Mock data for templates and banners
- Graceful degradation when API is unavailable
- Sync capabilities when connection is restored

## Usage Examples

### Creating a Banner
```typescript
import templatesService from './services/templates';

const banner = await templatesService.createBanner({
  templateId: 'template-123',
  title: 'My Custom Banner',
  description: 'A beautiful banner for my business',
  customizations: {
    text: 'Welcome to our store!',
    colors: ['#ff6b6b', '#4ecdc4'],
    fonts: 'Arial',
    layout: 'centered'
  }
});
```

### Managing Subscriptions
```typescript
import subscriptionService from './services/payment';

// Check subscription status
const hasActiveSubscription = await subscriptionService.hasActiveSubscription();

// Subscribe to a plan
const subscription = await subscriptionService.subscribeToPlan('pro', 'card', true);
```

### Uploading Media
```typescript
import mediaService from './services/mediaService';

const mediaAsset = await mediaService.uploadImage(imageUri, 'my-image.jpg', (progress) => {
  console.log(`Upload progress: ${progress.percentage}%`);
});
```

## Testing

To test the API integration:

1. **Authentication Test:**
   ```typescript
   const authService = require('./services/auth');
   const user = await authService.registerUser({
     email: 'test@example.com',
     password: 'password123',
     companyName: 'Test Company'
   });
   ```

2. **Template Fetching Test:**
   ```typescript
   const templatesService = require('./services/templates');
   const templates = await templatesService.getTemplates({ type: 'daily' });
   ```

3. **Banner Creation Test:**
   ```typescript
   const bannerService = require('./services/bannerService');
   const banner = await bannerService.createBanner({
     templateId: 'template-1',
     title: 'Test Banner',
     customizations: { text: 'Hello World' }
   });
   ```

## Troubleshooting

### Common Issues:

1. **Authentication Errors (401):**
   - Check if auth token is valid
   - Ensure user is logged in
   - Clear stored tokens and re-authenticate

2. **Network Errors:**
   - Check internet connection
   - Verify API base URL
   - Check server status

3. **Upload Failures:**
   - Validate file size and type
   - Check file permissions
   - Ensure proper FormData format

4. **Cache Issues:**
   - Clear service cache
   - Force refresh data
   - Check cache expiration

### Debug Mode:
Enable debug logging by setting:
```typescript
console.log('API Response:', response.data);
console.log('API Error:', error.response?.data);
```

This integration provides a complete, production-ready API layer for the Daily Banner App with proper error handling, caching, and offline support.
