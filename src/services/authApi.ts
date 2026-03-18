import api from './api';

// Types for authentication
export interface RegisterRequest {
  email: string;
  password: string;
  companyName: string;
  phoneNumber: string;
  description?: string;
  category?: string;
  address?: string;
  website?: string;
  alternatePhone?: string;
  companyLogo?: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
  accessToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  companyName: string; // Registered company name (from registration)
  phoneNumber: string;
  logo?: string;
  photo?: string;
  companyLogo?: string;
  displayName?: string;
  name?: string;
  phone?: string;
  bio?: string;
  description?: string;
  category?: string;
  address?: string;
  alternatePhone?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  // Protected original values from registration (never overwritten)
  _originalCompanyName?: string;
  _originalAddress?: string;
  _originalWebsite?: string;
  _originalCategory?: string;
  _originalDescription?: string;
  _originalAlternatePhone?: string;
  // Note: businessProfiles array removed - should not be part of user object
  // Business profiles should be fetched separately via businessProfileService
}

export interface UpdateProfileRequest {
  name?: string;              // Company/user name
  companyName?: string;       // Alias for name
  email?: string;             // Email address
  phone?: string;             // Phone number
  phoneNumber?: string;       // Alias for phone
  logo?: string;              // Logo URL
  photo?: string;             // Photo URL
  companyLogo?: string;       // Alias for logo
  description?: string;       // Company/business description
  category?: string;          // Business category
  address?: string;           // Business address
  alternatePhone?: string;    // Alternate phone number
  website?: string;           // Website URL
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: UserProfile;
    token: string;
  };
  message: string;
}

export interface ProfileResponse {
  success: boolean;
  data: UserProfile;
  message: string;
}

// Authentication API service
class AuthApiService {
  // Register new user
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/mobile/auth/register', data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // User login
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/mobile/auth/login', data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Google OAuth login
  async googleLogin(data: GoogleAuthRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/mobile/auth/google', data);
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  // Get user profile
  async getProfile(userId?: string): Promise<ProfileResponse> {
    try {
      // Use the correct endpoint that we know works
      const endpoints = ['/api/mobile/auth/me'];
      
      console.log('🔍 Trying profile endpoints:', endpoints);
      
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Attempting profile endpoint: ${endpoint}`);
          const response = await api.get(endpoint);
          console.log(`✅ Profile endpoint ${endpoint} succeeded`);
          
          // Print detailed response for /api/mobile/auth/me
          console.log('═══════════════════════════════════════════════════════════');
          console.log('📥 /api/mobile/auth/me RESPONSE - START');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('📦 Full Response Object:', JSON.stringify(response, null, 2));
          console.log('─────────────────────────────────────────────────────────');
          console.log('✅ Response Status:', response?.status || 'N/A');
          console.log('✅ Response Status Text:', response?.statusText || 'N/A');
          console.log('─────────────────────────────────────────────────────────');
          console.log('📋 Response Data:', JSON.stringify(response?.data, null, 2));
          console.log('─────────────────────────────────────────────────────────');
          console.log('📊 Data Fields Present:', Object.keys(response?.data || {}));
          console.log('─────────────────────────────────────────────────────────');
          console.log('🔍 Individual Field Values:');
          const data = response?.data as any;
          console.log('   - id:', data?.id || '(not set)');
          console.log('   - email:', data?.email || '(not set)');
          console.log('   - companyName:', data?.companyName || '(not set)');
          console.log('   - phoneNumber:', data?.phoneNumber || '(not set)');
          console.log('   - description:', data?.description || '(not set)');
          console.log('   - category:', data?.category || '(not set)');
          console.log('   - address:', data?.address || '(not set)');
          console.log('   - alternatePhone:', data?.alternatePhone || '(not set)');
          console.log('   - website:', data?.website || '(not set)');
          console.log('   - logo:', data?.logo || '(not set)');
          console.log('   - photo:', data?.photo || '(not set)');
          console.log('   - totalViews:', data?.totalViews || 0);
          console.log('   - isConverted:', data?.isConverted || false);
          console.log('   - createdAt:', data?.createdAt || '(not set)');
          console.log('   - updatedAt:', data?.updatedAt || '(not set)');
          console.log('─────────────────────────────────────────────────────────');
          console.log('⚠️ WARNING - CONTAMINATION CHECK:');
          console.log('   These fields should NOT come from business profiles:');
          console.log('   - companyName:', data?.companyName || '(empty)');
          console.log('   - address:', data?.address || '(empty)');
          console.log('   - website:', data?.website || '(empty)');
          console.log('   - category:', data?.category || '(empty)');
          console.log('   - description:', data?.description || '(empty)');
          console.log('   - alternatePhone:', data?.alternatePhone || '(empty)');
          console.log('─────────────────────────────────────────────────────────');
          if (data?.businessProfiles) {
            console.log('🏢 Business Profiles in Response:', data.businessProfiles.length || 0);
            console.log('📋 Business Profiles Data:', JSON.stringify(data.businessProfiles, null, 2));
          } else {
            console.log('🏢 Business Profiles in Response: None');
          }
          console.log('═══════════════════════════════════════════════════════════');
          console.log('📥 /api/mobile/auth/me RESPONSE - END');
          console.log('═══════════════════════════════════════════════════════════');
          
          return response.data;
        } catch (error: any) {
          console.log(`❌ Profile endpoint ${endpoint} failed:`, error.response?.status || error.message);
          // Continue to next endpoint
        }
      }
      
      throw new Error('All profile endpoints failed');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Upload profile image (proper file upload using FormData)
  async uploadProfileImage(userId: string, imageUri: string): Promise<ProfileResponse> {
    try {
      console.log('📤 [UPLOAD] Starting profile image upload...');
      console.log('📍 [UPLOAD] User ID:', userId);
      console.log('📍 [UPLOAD] Image URI:', imageUri);
      
      // Extract filename from URI
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';
      
      // Determine MIME type based on extension
      let mimeType = 'image/jpeg';
      if (fileExtension === 'png') mimeType = 'image/png';
      else if (fileExtension === 'gif') mimeType = 'image/gif';
      else if (fileExtension === 'webp') mimeType = 'image/webp';
      
      console.log('📋 [UPLOAD] File info:', { filename, fileExtension, mimeType });
      
      // Create FormData
      const formData = new FormData();
      formData.append('logo', {
        uri: imageUri,
        type: mimeType,
        name: filename,
      } as any);
      
      console.log('📦 [UPLOAD] FormData created');
      
      // Try the new upload endpoint first
      const uploadEndpoint = `/api/mobile/users/${userId}/upload-logo`;
      
      try {
        console.log('📡 [UPLOAD] Attempting upload endpoint:', uploadEndpoint);
        const response = await api.post(uploadEndpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log('✅ [UPLOAD] Image uploaded successfully via upload endpoint');
        console.log('📥 [UPLOAD] Response:', response.data);
        return response.data;
      } catch (uploadError: any) {
        const status = uploadError.response?.status;
        const errorMessage = uploadError.response?.data?.message || uploadError.message;
        
        console.log('⚠️ [UPLOAD] Upload endpoint failed:', status, errorMessage);
        
        // If endpoint doesn't exist (404), provide helpful error
        if (status === 404) {
          throw new Error(
            'Backend upload endpoint not implemented yet. ' +
            'Please ask the backend team to implement POST /api/mobile/users/:userId/upload-logo. ' +
            'See BACKEND_LOGO_UPLOAD_FIX_REQUIRED.txt for implementation guide.'
          );
        }
        
        // Re-throw other errors
        throw new Error(`Upload failed: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('❌ [UPLOAD] Profile image upload error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileRequest, userId?: string): Promise<ProfileResponse> {
    try {
      if (!userId) {
        throw new Error('User ID is required for profile update');
      }
      
      // Validate that logo/companyLogo are not local file paths
      if (data.logo && this.isLocalFilePath(data.logo)) {
        console.error('❌ [UPDATE] Attempting to save local file path as logo:', data.logo);
        throw new Error(
          'Cannot save local file path. Please use uploadProfileImage() to upload the image file first.'
        );
      }
      if (data.companyLogo && this.isLocalFilePath(data.companyLogo)) {
        console.error('❌ [UPDATE] Attempting to save local file path as companyLogo:', data.companyLogo);
        throw new Error(
          'Cannot save local file path. Please use uploadProfileImage() to upload the image file first.'
        );
      }
      
      // Use the correct update endpoint with user ID
      const endpoint = `/api/mobile/users/${userId}`;
      
      console.log('📡 Updating profile using endpoint:', endpoint);
      console.log('📤 Update data:', data);
      const response = await api.put(endpoint, data);
      console.log('✅ Profile updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Update profile error:', error);
      throw error;
    }
  }

  // Helper: Check if a URL is a local file path
  private isLocalFilePath(url: string): boolean {
    if (!url) return false;
    return (
      url.startsWith('file://') ||
      url.startsWith('content://') ||
      url.startsWith('/storage/') ||
      url.startsWith('/data/') ||
      url.includes('\\') // Windows paths
    );
  }

  // Logout user
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/api/mobile/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Delete user account
  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/api/mobile/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }
}

export default new AuthApiService();
