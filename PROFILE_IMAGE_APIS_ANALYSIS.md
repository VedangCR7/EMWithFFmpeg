# Profile Image APIs Analysis - Complete Summary

## Profile Image API Endpoints Found

### 1. **Upload Profile Image API**
**Method:** `authApi.uploadProfileImage(userId, imageUri)`  
**Endpoint:** `POST /api/mobile/users/${userId}/upload-logo`  
**Purpose:** Upload new profile image file  
**Usage:** When user selects new profile image in ProfileScreen

**Code Location:** `src/services/authApi.ts` (Lines 203-267)

**Request Format:**
```typescript
// FormData with file
const formData = new FormData();
formData.append('logo', {
  uri: imageUri,
  type: mimeType, // image/jpeg, image/png, etc.
  name: filename,
});

POST /api/mobile/users/{userId}/upload-logo
Content-Type: multipart/form-data
```

**Response Fields:**
```typescript
// Multiple response formats supported
interface ProfileResponse {
  success: boolean;
  data?: {
    user?: UserProfile;
    profile?: UserProfile;
    logo?: string;        // Primary logo field
    companyLogo?: string;  // Backward compatibility
    photoURL?: string;     // Alternative field
    profileImage?: string;  // Alternative field
  };
}
```

### 2. **Get Profile API**
**Method:** `authApi.getProfile(userId?)`  
**Endpoint:** `GET /api/mobile/auth/me`  
**Purpose:** Retrieve user profile data including profile image  
**Usage:** After login, profile refresh, app initialization

**Code Location:** `src/services/authApi.ts` (Lines 125-170)

**Request Format:**
```typescript
GET /api/mobile/auth/me
// No parameters needed (uses auth token)
```

**Response Fields:**
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  logo?: string;          // Primary profile image URL
  companyLogo?: string;    // Business logo (backward compatibility)
  photoURL?: string;       // Photo URL (alternative)
  profileImage?: string;   // Profile image (alternative)
  // ... other user fields
}
```

### 3. **Update Profile API**
**Method:** `authApi.updateProfile(data, userId)`  
**Endpoint:** `PUT /api/mobile/users/${userId}`  
**Purpose:** Update user profile data (not for image upload)  
**Usage:** When updating profile text fields

**Code Location:** `src/services/authApi.ts` (Lines 270-302)

## Profile Image Field Mapping

### Multiple Image Fields Supported
The app uses multiple field names for profile images for backward compatibility:

```typescript
// Primary fields
logo: string;           // Main profile image
companyLogo: string;    // Business logo (backward compatibility)

// Alternative fields  
photoURL: string;        // Photo URL
profileImage: string;    // Profile image
```

### Field Priority in UI
```typescript
// ProfileScreen.tsx - Line 250-252
const [profileImageUri, setProfileImageUri] = useState<string | null>(
  currentUser?.logo || currentUser?.companyLogo || null
);

// ProfileScreen.tsx - Line 258 (useEffect dependency)
[profileImageUri, currentUser?.logo, currentUser?.companyLogo, currentUser?.photoURL, currentUser?.profileImage]
```

## Profile Image Flow Analysis

### 1. **After Login Flow**
```
Login → ProfileScreen.loadUserProfile() → authApi.getProfile() → 
GET /api/mobile/auth/me → 
Response with logo/companyLogo → 
setProfileImageUri() → UI displays image
```

### 2. **After Profile Image Update Flow**
```
User selects image → ProfileScreen.handleImageSelected() → 
authApi.uploadProfileImage() → 
POST /api/mobile/users/{userId}/upload-logo → 
Response with new logo URL → 
authService.setCurrentUser() → 
setProfileImageUri() → UI displays new image
```

### 3. **Profile Refresh Flow**
```
ProfileScreen.refreshProfile() → authApi.getProfile() → 
GET /api/mobile/auth/me → 
Updated logo URL → 
setProfileImageUri() → UI updates
```

## Key Implementation Details

### Image Upload Process
1. **File Handling:** Extracts filename, extension, MIME type
2. **FormData:** Creates proper multipart/form-data request
3. **Endpoint:** Uses user-specific upload endpoint
4. **Response Handling:** Supports multiple response formats
5. **Error Handling:** Fallback mechanisms for different response shapes

### Profile Image Retrieval
1. **Primary Endpoint:** `/api/mobile/auth/me` (authenticated user)
2. **Field Priority:** `logo` → `companyLogo` → `photoURL` → `profileImage`
3. **Caching:** Results cached in AsyncStorage via authService
4. **UI Updates:** React state updates trigger re-renders

### Security & Validation
1. **Local Path Check:** Prevents saving local file paths as URLs
2. **File Type Validation:** Supports JPEG, PNG, GIF, WebP
3. **User Authentication:** Uses auth tokens for API access
4. **Error Handling:** Comprehensive error logging and fallbacks

## API Response Examples

### Upload Response Example
```json
{
  "success": true,
  "data": {
    "logo": "https://example.com/uploads/user-logo-123.jpg",
    "companyLogo": "https://example.com/uploads/user-logo-123.jpg",
    "photoURL": "https://example.com/uploads/user-logo-123.jpg",
    "profileImage": "https://example.com/uploads/user-logo-123.jpg"
  }
}
```

### Get Profile Response Example
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "logo": "https://example.com/uploads/user-logo-123.jpg",
    "companyLogo": "https://example.com/uploads/user-logo-123.jpg",
    "photoURL": "https://example.com/uploads/user-logo-123.jpg",
    "profileImage": "https://example.com/uploads/user-logo-123.jpg"
  }
}
```

## Files Involved in Profile Image Management

### Core API Files
- **`src/services/authApi.ts`** - API endpoints and requests
- **`src/services/auth.ts`** - User state management and caching

### UI Components
- **`src/screens/ProfileScreen.tsx`** - Profile image upload and display
- **`src/screens/HomeScreen.tsx`** - Profile image display in avatar
- **`src/screens/BusinessProfilesScreen.tsx`** - Business profile images

### Supporting Files
- **`src/context/BusinessProfileContext.tsx`** - Business profile state
- **`src/services/businessProfile.ts`** - Business profile API

## Summary

The profile image system uses:
1. **Upload API:** `POST /api/mobile/users/{userId}/upload-logo`
2. **Get API:** `GET /api/mobile/auth/me`
3. **Update API:** `PUT /api/mobile/users/{userId}` (for text fields only)
4. **Multiple Fields:** logo, companyLogo, photoURL, profileImage
5. **Comprehensive Flow:** Upload → Cache → Display → Refresh

This provides a robust profile image management system with proper error handling, caching, and backward compatibility.
