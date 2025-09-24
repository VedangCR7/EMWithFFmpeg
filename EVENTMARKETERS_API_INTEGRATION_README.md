# EventMarketers API Integration

This document provides comprehensive documentation for all the EventMarketers APIs that have been integrated into the React Native application.

## 📋 Overview

All APIs from the `API_COLLECTION.md` file have been successfully integrated with proper error handling, caching, and fallback mechanisms. The integration includes:

- ✅ Health Check API
- ✅ Business Categories API
- ✅ Installed Users Registration & Management
- ✅ User Activity Tracking
- ✅ Customer Content Management
- ✅ Business Profile Creation
- ✅ Authentication (Admin/Subadmin)
- ✅ Admin Management
- ✅ Content Management

## 🚀 Quick Start

### Import Services

```typescript
import {
  healthService,
  businessCategoriesService,
  installedUsersService,
  userActivityService,
  customerContentService,
  eventMarketersBusinessProfileService,
  eventMarketersAuthService,
  adminManagementService,
  contentManagementService,
} from './services/eventMarketersServices';
```

### Basic Usage

```typescript
// Check backend health
const health = await healthService.getHealthCheck();

// Get business categories
const categories = await businessCategoriesService.getBusinessCategories();

// Register a user
const user = await installedUsersService.registerCurrentDeviceUser({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890'
});
```

## 📚 API Services Documentation

### 1. Health Service (`healthService`)

**Purpose**: Monitor backend health and connectivity

**Methods**:
- `getHealthCheck()` - Get detailed health information
- `isBackendReachable()` - Check if backend is accessible

**Example**:
```typescript
const health = await healthService.getHealthCheck();
console.log('Status:', health.status); // "healthy"
console.log('Version:', health.version); // "1.0.0"
```

### 2. Business Categories Service (`businessCategoriesService`)

**Purpose**: Manage business categories for content organization

**Methods**:
- `getBusinessCategories()` - Get all categories
- `getCategories()` - Alias endpoint
- `getCategoryById(id)` - Get specific category
- `searchCategories(query)` - Search categories

**Example**:
```typescript
const response = await businessCategoriesService.getBusinessCategories();
const categories = response.categories; // Array of BusinessCategory objects
```

### 3. Installed Users Service (`installedUsersService`)

**Purpose**: Manage user registration and profiles for installed app users

**Methods**:
- `registerUser(userData)` - Register new user
- `getUserProfile(deviceId)` - Get user profile
- `updateUserProfile(deviceId, data)` - Update user profile
- `getCurrentUser()` - Get current user from storage
- `registerCurrentDeviceUser(userInfo)` - Register current device user
- `isUserRegistered()` - Check registration status

**Example**:
```typescript
const user = await installedUsersService.registerCurrentDeviceUser({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890'
});
```

### 4. User Activity Service (`userActivityService`)

**Purpose**: Track user interactions and activities

**Methods**:
- `recordActivity(activityData)` - Record any activity
- `recordView(deviceId, resourceType, resourceId)` - Record view
- `recordDownload(deviceId, resourceType, resourceId)` - Record download
- `recordShare(deviceId, resourceType, resourceId)` - Record share
- `recordTimeSpent(deviceId, resourceType, resourceId, duration)` - Record time spent
- `recordSearch(deviceId, query, resultsCount)` - Record search
- `getActivityAnalytics(deviceId)` - Get analytics

**Example**:
```typescript
await userActivityService.recordView(deviceId, 'image', 'image-123');
await userActivityService.recordDownload(deviceId, 'video', 'video-456');
```

### 5. Customer Content Service (`customerContentService`)

**Purpose**: Manage customer content (images, videos) and profiles

**Methods**:
- `getCustomerContent(customerId, filters)` - Get customer content
- `getCustomerProfile(customerId)` - Get customer profile
- `getContent(customerId, filters)` - Alias endpoint
- `getProfile(customerId)` - Alias endpoint
- `searchContent(customerId, query)` - Search content
- `getContentByCategory(customerId, category)` - Filter by category

**Example**:
```typescript
const content = await customerContentService.getCustomerContent('customer-123', {
  category: 'Restaurant',
  page: 1,
  limit: 20
});
```

### 6. Business Profile Service (`eventMarketersBusinessProfileService`)

**Purpose**: Create and manage business profiles for subscriptions

**Methods**:
- `createBusinessProfile(profileData)` - Create business profile
- `uploadBusinessLogo(logoFile)` - Upload business logo
- `createBusinessProfileWithValidation(data)` - Create with validation
- `uploadBusinessLogoWithValidation(file)` - Upload with validation
- `getBusinessCategories()` - Get available categories

**Example**:
```typescript
const profile = await eventMarketersBusinessProfileService.createBusinessProfileWithValidation({
  businessName: 'John\'s Restaurant',
  businessEmail: 'info@johnsrestaurant.com',
  businessPhone: '+1234567890',
  businessAddress: '123 Main St, City, State',
  businessDescription: 'Fine dining restaurant',
  businessCategory: 'Restaurant'
});
```

### 7. Authentication Service (`eventMarketersAuthService`)

**Purpose**: Handle admin and subadmin authentication

**Methods**:
- `adminLogin(loginData)` - Admin login
- `subadminLogin(loginData)` - Subadmin login
- `getCurrentUser()` - Get current authenticated user
- `logout()` - Logout user
- `isAuthenticated()` - Check authentication status
- `hasPermission(permission)` - Check specific permission
- `isAdmin()` - Check if user is admin
- `isSubadmin()` - Check if user is subadmin

**Example**:
```typescript
const user = await eventMarketersAuthService.adminLoginWithValidation({
  email: 'admin@example.com',
  password: 'password123'
});
```

### 8. Admin Management Service (`adminManagementService`)

**Purpose**: Manage subadmins and admin operations

**Methods**:
- `getSubadmins()` - Get all subadmins
- `createSubadmin(subadminData)` - Create new subadmin
- `updateSubadmin(id, data)` - Update subadmin
- `deleteSubadmin(id)` - Delete subadmin
- `searchSubadmins(query)` - Search subadmins
- `getSubadminsByRole(role)` - Filter by role
- `getSubadminsByStatus(status)` - Filter by status

**Example**:
```typescript
const subadmin = await adminManagementService.createSubadminWithValidation({
  name: 'New Subadmin',
  email: 'subadmin@example.com',
  password: 'password123',
  role: 'Content Manager',
  permissions: ['Images', 'Videos'],
  assignedCategories: ['Restaurant']
});
```

### 9. Content Management Service (`contentManagementService`)

**Purpose**: Manage content uploads and approvals

**Methods**:
- `getPendingApprovals()` - Get pending content approvals
- `uploadImage(imageData)` - Upload image
- `uploadVideo(videoData)` - Upload video
- `approveContent(id, type)` - Approve content
- `rejectContent(id, type, reason)` - Reject content
- `uploadImageWithValidation(data)` - Upload with validation
- `uploadVideoWithValidation(data)` - Upload with validation

**Example**:
```typescript
const image = await contentManagementService.uploadImageWithValidation({
  image: imageFile,
  title: 'Restaurant Interior',
  description: 'Beautiful restaurant interior design',
  category: 'BUSINESS',
  businessCategoryId: 'restaurant-1',
  tags: 'restaurant,interior,design'
});
```

## 🔧 Configuration

### Base URL
All services use the EventMarketers backend URL: `https://eventmarketersbackend.onrender.com`

### Authentication
- Admin/Subadmin endpoints require JWT tokens
- Tokens are automatically managed by the services
- Tokens are stored in AsyncStorage

### Caching
- Business categories: 10 minutes cache
- Customer content: 5 minutes cache
- User profiles: 5 minutes cache
- Pending approvals: 2 minutes cache

### Error Handling
- All services include comprehensive error handling
- Fallback to cached data when available
- Mock data fallback for development
- Detailed error logging

## 📱 Usage Examples

### Complete User Onboarding
```typescript
import { completeWorkflowExamples } from './services/eventMarketersApiExamples';

const onboarding = await completeWorkflowExamples.userOnboardingWorkflow({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890'
});
```

### Business Profile Creation
```typescript
const profile = await completeWorkflowExamples.businessProfileCreationWorkflow({
  businessName: 'John\'s Restaurant',
  businessEmail: 'info@johnsrestaurant.com',
  businessPhone: '+1234567890',
  businessAddress: '123 Main St, City, State',
  businessDescription: 'Fine dining restaurant',
  businessCategory: 'Restaurant'
}, logoFile);
```

### Content Browsing
```typescript
const browsing = await completeWorkflowExamples.contentBrowsingWorkflow('customer-123', {
  category: 'Restaurant',
  search: 'interior design'
});
```

## 🛠️ Development

### Testing APIs
Use the example file `eventMarketersApiExamples.ts` for testing individual API calls:

```typescript
import { healthCheckExamples } from './services/eventMarketersApiExamples';

// Test health check
const health = await healthCheckExamples.checkBackendHealth();
```

### Error Debugging
All services include detailed console logging:
- ✅ Success operations
- ❌ Error operations
- ⚠️ Fallback operations

### Mock Data
When APIs are unavailable, services automatically fall back to mock data for development.

## 📊 API Endpoints Summary

| Service | Endpoints | Purpose |
|---------|-----------|---------|
| Health | `/health` | Backend monitoring |
| Categories | `/api/mobile/business-categories`, `/api/v1/categories` | Business categories |
| Users | `/api/installed-users/*` | User management |
| Activity | `/api/installed-users/activity` | Activity tracking |
| Content | `/api/mobile/content/*`, `/api/v1/content/*` | Customer content |
| Profile | `/api/mobile/profile/*`, `/api/v1/profile/*` | Customer profiles |
| Business | `/api/business-profile/*` | Business profiles |
| Auth | `/api/auth/*` | Authentication |
| Admin | `/api/admin/*` | Admin management |
| Content Mgmt | `/api/content/*` | Content management |

## 🔒 Security Features

- JWT token authentication
- Automatic token refresh
- Secure token storage
- Request/response interceptors
- Error handling for auth failures
- Permission-based access control

## 📈 Performance Features

- Intelligent caching
- Request deduplication
- Offline fallback
- Background queue processing
- Optimized data structures

## 🚨 Error Handling

All services implement comprehensive error handling:

1. **Network Errors**: Automatic retry with exponential backoff
2. **Authentication Errors**: Automatic token refresh and re-authentication
3. **Server Errors**: Graceful degradation with cached data
4. **Validation Errors**: Detailed error messages with field-specific feedback
5. **Timeout Errors**: Configurable timeouts with fallback mechanisms

## 📝 Notes

- All services are fully typed with TypeScript
- Comprehensive error handling and logging
- Automatic caching and offline support
- Mock data fallback for development
- Complete API coverage from API_COLLECTION.md
- Ready for production use

For more detailed examples, see `src/services/eventMarketersApiExamples.ts`.
