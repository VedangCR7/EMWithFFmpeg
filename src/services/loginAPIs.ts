import api, { resetTokenExpirationFlag } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './auth';
import authApi from './authApi';

// ========================================
// LOGIN APIs - Backend Implementation Guide
// ========================================
// This file contains the API specifications for user authentication
// that the backend team needs to implement.

// ========================================
// TYPES & INTERFACES
// ========================================

/**
 * User Registration Request
 * Used in registration page
 * Based on actual RegistrationScreen.tsx form fields
 */
export interface UserRegistrationRequest {
  email: string;
  password: string;
  companyName: string;
  phoneNumber: string;
  // Additional fields from registration form
  description?: string;
  category?: string;
  subCategory?: string; // User's selected subcategory during registration
  subcategory?: string; // Alternative field name for consistency
  address?: string;
  alternatePhone?: string;
  website?: string;
  companyLogo?: string;
  // Optional display name
  displayName?: string;
}

/**
 * User Login Request
 * Used in login page
 */
export interface UserLoginRequest {
  email: string;
  password: string;
  // Optional: Remember me functionality
  rememberMe?: boolean;
}

/**
 * User Profile Data
 * Returned after successful login/registration
 * Based on actual RegistrationScreen.tsx form fields
 */
export interface UserProfile {
  id: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  // Additional profile fields from registration form
  description?: string;
  category?: string;
  subCategory?: string; // User's selected subcategory during registration
  subcategory?: string; // Alternative field name for consistency
  address?: string;
  alternatePhone?: string;
  website?: string;
  companyLogo?: string;
  displayName?: string;
  // System fields
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  subscriptionStatus: 'free' | 'premium' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

/**
 * Authentication Response
 * Standard response format for login/registration
 */
export interface AuthResponse {
  success: boolean;
  data: {
    user: UserProfile;
    token: string;
    refreshToken?: string;
    expiresIn: number; // Token expiration time in seconds
  };
  message: string;
  errors?: string[]; // For validation errors
}

/**
 * Password Reset Request
 * For forgot password functionality
 */
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordCodeVerifyRequest {
  email: string;
  code: string;
}

/**
 * Password Reset Confirm Request
 * For setting new password
 */
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change Password Request
 * For authenticated users changing password
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetWithCodeRequest {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Email Verification Request
 * For verifying email address
 */
export interface EmailVerificationRequest {
  token: string;
}

// ========================================
// API SERVICE CLASS
// ========================================

class LoginAPIsService {
  
  // ========================================
  // REGISTRATION API
  // ========================================
  
  /**
   * Register a new user
   * Endpoint: POST /api/mobile/auth/register
   * Used in: Registration page
   * Based on actual RegistrationScreen.tsx form fields
   */
  async registerUser(data: UserRegistrationRequest): Promise<AuthResponse> {
    try {
      console.log('📝 Registering new user:', data.email);
      
      // Clear all caches before registration to ensure fresh start
      console.log('🗑️ Clearing all caches before registration...');
      await this.clearAllCaches();
      
      const response = await api.post('/api/mobile/auth/register', {
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        phone: data.phoneNumber, // Backend expects 'phone', not 'phoneNumber'
        // Additional fields from registration form
        description: data.description,
        category: data.category,
        subCategory: data.subCategory || data.subcategory,
        address: data.address,
        alternatePhone: data.alternatePhone,
        website: data.website,
        companyLogo: data.companyLogo,
        displayName: data.displayName,
      });
      
      if (response.data.success) {
        // Store user data and token in auth service
        console.log('🔍 Registration response data structure:', JSON.stringify(response.data.data, null, 2));
        const { user, accessToken, token } = response.data.data;
        const authTokenToSave = accessToken || token; // Backend might return 'token' or 'accessToken'
        
        console.log('🔑 accessToken value:', accessToken);
        console.log('🔑 token value:', token);
        console.log('🔑 Extracted token from response:', authTokenToSave ? 'YES' : 'NO');
        console.log('🔑 Token length:', authTokenToSave?.length || 0);
        
        // Create complete user data by merging backend response with registration data
        const completeUserData = {
          ...user,
          // Add all registration fields that might not be returned by backend
          displayName: data.displayName || data.companyName,
          companyName: data.companyName,
          description: data.description,
          category: data.category,
          address: data.address,
          phoneNumber: data.phoneNumber,
          alternatePhone: data.alternatePhone,
          website: data.website,
          companyLogo: data.companyLogo,
        };
        
        // IMPORTANT: Save token to storage FIRST
        await authService.saveUserToStorage(completeUserData, authTokenToSave);
        authService.setCurrentUser(completeUserData);
        
        // Reset token expiration flag on successful login
        resetTokenExpirationFlag();
        
        // Notify auth state listeners (this will trigger navigation)
        authService.notifyAuthStateListeners(completeUserData);
        
        console.log('✅ User registration successful and complete data stored');
      }
      
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Registration error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ========================================
  // LOGIN API
  // ========================================
  
  /**
   * Login existing user
   * Endpoint: POST /api/mobile/auth/login
   * Used in: Login page
   */
  async loginUser(data: UserLoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔐 Logging in user:', data.email);
      
      // Clear all caches before login to ensure fresh data for new user
      console.log('🗑️ Clearing all caches before login...');
      await this.clearAllCaches();
      
      console.log('📡 Making API call to:', '/api/mobile/auth/login');
      console.log('📡 Request data:', { email: data.email, rememberMe: data.rememberMe || false });
      
      const response = await api.post('/api/mobile/auth/login', {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe || false,
      });
      
      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response data:', response.data);
      
      if (response.data.success) {
        // Store user data and token in auth service
        console.log('🔍 Response data structure:', JSON.stringify(response.data.data, null, 2));
        const { user, accessToken, token } = response.data.data;
        const authTokenToSave = accessToken || token; // Backend might return 'token' or 'accessToken'
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔑 LOGIN SUCCESSFUL - AUTH TOKEN (loginAPIs.ts):');
        console.log('accessToken value:', accessToken);
        console.log('token value:', token);
        console.log('Final Token Used:', authTokenToSave);
        console.log('Token Length:', authTokenToSave?.length || 0);
        console.log('Token Preview:', authTokenToSave?.substring(0, 50) + '...');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('👤 USER INFO FROM LOGIN RESPONSE:');
        console.log('User ID:', user.id);
        console.log('Email:', user.email);
        console.log('Company Name:', user.companyName);
        console.log('Display Name:', user.displayName);
        console.log('Name:', user.name);
        console.log('Phone:', user.phoneNumber || user.phone);
        console.log('Category:', user.category);
        console.log('Description:', user.description);
        console.log('═══════════════════════════════════════════════════════════');
        
        // IMPORTANT: Save token to storage FIRST so it's available for subsequent API calls
        await authService.saveUserToStorage(user, authTokenToSave);
        authService.setCurrentUser(user);
        
        // Reset token expiration flag on successful login
        resetTokenExpirationFlag();
        
        // Now fetch complete profile data from API (token is now available in AsyncStorage)
        let completeUserData = user;
        try {
          console.log('🔍 Fetching complete profile data from API after login...');
          
          // Try to get complete profile using user ID
          const profileResponse = await authApi.getProfile(user.id);
          if (profileResponse.success && profileResponse.data) {
            // CRITICAL: Exclude companyName from API to prevent business profile contamination
            const { companyName: apiCompanyName, businessProfiles, ...cleanApiData } = profileResponse.data as any;
            
            // Sync logo from API response (prefer 'logo' field, fallback to 'companyLogo')
            const apiLogo = cleanApiData.logo || cleanApiData.companyLogo || user.logo || user.companyLogo;
            
            completeUserData = {
              ...user,
              ...cleanApiData, // Merge clean profile data (without companyName from API)
              // ALWAYS preserve the companyName from login response, never from getProfile API
              companyName: user.companyName,
              // Sync all logo fields
              logo: apiLogo,
              companyLogo: apiLogo,
              photoURL: apiLogo,
              profileImage: apiLogo,
            };
            console.log('✅ Complete profile data fetched from API and merged (companyName protected)');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🔒 COMPANY NAME PROTECTION:');
            console.log('Original companyName (from login):', user.companyName);
            console.log('API companyName (EXCLUDED):', apiCompanyName);
            console.log('Final companyName (PROTECTED):', completeUserData.companyName);
            console.log('═══════════════════════════════════════════════════════════');
            console.log('👤 FINAL USER DATA AFTER MERGE:');
            console.log('User ID:', completeUserData.id);
            console.log('Email:', completeUserData.email);
            console.log('Company Name:', completeUserData.companyName);
            console.log('Display Name:', completeUserData.displayName);
            console.log('Phone:', completeUserData.phoneNumber || completeUserData.phone);
            console.log('Category:', completeUserData.category);
            console.log('Logo:', completeUserData.logo);
            console.log('═══════════════════════════════════════════════════════════');
            
            // Update storage with complete profile data
            await authService.saveUserToStorage(completeUserData, authTokenToSave);
            authService.setCurrentUser(completeUserData);
          } else {
            console.log('⚠️ Profile API returned no data, using basic user data');
          }
        } catch (profileError: any) {
          console.log('⚠️ Failed to fetch complete profile from API, using basic user data:', profileError.message);
          // Continue with basic user data - the profile will be fetched later when needed
        }
        
        // Notify auth state listeners (this will trigger navigation)
        authService.notifyAuthStateListeners(completeUserData);
        
        console.log('✅ User login successful and complete data stored');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('💾 DATA SAVED TO ASYNC STORAGE:');
        console.log('Saved companyName:', completeUserData.companyName);
        console.log('Saved _originalCompanyName:', completeUserData._originalCompanyName);
        console.log('═══════════════════════════════════════════════════════════');
      } else {
        console.log('❌ Login failed - success=false:', response.data);
        throw new Error(response.data.message || 'Login failed');
      }
      
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Login error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ========================================
  // PASSWORD MANAGEMENT APIs
  // ========================================
  
  /**
   * Request password reset
   * Endpoint: POST /api/mobile/auth/forgot-password
   * Used in: Forgot password page
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<{ success: boolean; message: string }> {
    try {
      if (__DEV__) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📧 FORGET PASSWORD API REQUEST');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📧 Requesting password reset for:', data.email);
        console.log('📤 Request Body:', JSON.stringify({ email: data.email }, null, 2));
        console.log('🌐 API Endpoint: POST /api/mobile/auth/forgot-password');
      }
      
      const response = await api.post('/api/mobile/auth/forgot-password', {
        email: data.email,
      });
      
      if (__DEV__) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ FORGET PASSWORD API RESPONSE (SUCCESS)');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 Response Status:', response.status);
        console.log('📊 Status Text:', response.statusText);
        console.log('🔗 Full URL:', (response.config?.baseURL || '') + (response.config?.url || ''));
        console.log('📋 Response Headers:', JSON.stringify(response.headers, null, 2));
        console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
        console.log('📦 Response Data Type:', typeof response.data);
        console.log('📦 Response Data Keys:', Object.keys(response.data || {}));
        if (response.data?.success !== undefined) {
          console.log('✅ Success Flag:', response.data.success);
        }
        if (response.data?.message) {
          console.log('💬 Message:', response.data.message);
        }
        console.log('═══════════════════════════════════════════════════════════');
      }
      
      return response.data;
      
    } catch (error: any) {
      if (__DEV__) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('❌ FORGET PASSWORD API ERROR');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔴 Error Type:', error.name || 'Unknown');
        console.log('🔴 Error Message:', error.message);
        console.log('🔴 Error Code:', error.code);
        
        if (error.config) {
          console.log('📤 Request Details:');
          console.log('   Method:', error.config.method?.toUpperCase());
          console.log('   URL:', (error.config?.baseURL || '') + (error.config?.url || ''));
          console.log('   Request Headers:', JSON.stringify(error.config.headers, null, 2));
          console.log('   Request Data:', JSON.stringify(error.config.data, null, 2));
        }
        
        if (error.response) {
          console.log('📊 Error Response Status:', error.response.status);
          console.log('📊 Error Status Text:', error.response.statusText);
          console.log('📋 Error Response Headers:', JSON.stringify(error.response.headers, null, 2));
          console.log('📦 Error Response Data:', JSON.stringify(error.response.data, null, 2));
          console.log('📦 Error Response Data Type:', typeof error.response.data);
          if (error.response.data) {
            console.log('📦 Error Response Data Keys:', Object.keys(error.response.data));
          }
        } else {
          console.log('⚠️ No response received from server');
          console.log('   This usually means a network error or server is unreachable');
        }
        
        if (error.request) {
          console.log('📡 Request Object:', error.request);
        }
        
        console.log('🔍 Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.log('═══════════════════════════════════════════════════════════');
      }
      
      throw error;
    }
  }

  /**
   * Confirm password reset
   * Endpoint: POST /api/mobile/auth/reset-password
   * Used in: Reset password page
   */
  async confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<{ success: boolean; message: string }> {
    try {
      if (__DEV__) {
        console.log('🔑 Confirming password reset');
      }
      
      const response = await api.post('/api/mobile/auth/reset-password', {
        token: data.token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      
      if (__DEV__) {
        console.log('✅ Password reset confirmed');
      }
      return response.data;
      
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Password reset confirmation error:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Verify password reset code
   * Endpoint: POST /api/mobile/auth/verify-reset-code
   * Used in: Reset code verification screen
   */
  async verifyResetCode(data: PasswordCodeVerifyRequest): Promise<{ success: boolean; message: string }> {
    try {
      if (__DEV__) {
        console.log('🧩 Verifying password reset code for:', data.email);
      }

      const response = await api.post('/api/mobile/auth/verify-reset-code', {
        email: data.email,
        code: data.code,
      });

      if (__DEV__) {
        console.log('✅ Password reset code verified');
      }
      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Password reset code verification error:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Reset password using email + code
   * Endpoint: POST /api/mobile/auth/reset-password
   * Used in: Create new password screen
   */
  async resetPasswordWithCode(data: PasswordResetWithCodeRequest): Promise<{ success: boolean; message: string }> {
    try {
      if (__DEV__) {
        console.log('🔐 Resetting password with verification code');
      }

      const response = await api.post('/api/mobile/auth/reset-password', {
        email: data.email,
        code: data.code,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      if (__DEV__) {
        console.log('✅ Password updated successfully via code');
      }
      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Password reset with code error:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Change password (authenticated user)
   * Endpoint: PUT /api/mobile/auth/change-password
   * Used in: Profile/Settings page
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    try {
      if (__DEV__) {
        console.log('🔐 Changing password');
      }
      
      const response = await api.put('/api/mobile/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      
      if (__DEV__) {
        console.log('✅ Password changed successfully');
      }
      return response.data;
      
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Change password error:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  // ========================================
  // EMAIL VERIFICATION API
  // ========================================
  
  /**
   * Verify email address
   * Endpoint: POST /api/mobile/auth/verify-email
   * Used in: Email verification page
   */
  async verifyEmail(data: EmailVerificationRequest): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📧 Verifying email address');
      
      const response = await api.post('/api/mobile/auth/verify-email', {
        token: data.token,
      });
      
      console.log('✅ Email verification successful');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Email verification error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Resend email verification
   * Endpoint: POST /api/mobile/auth/resend-verification
   * Used in: Email verification page
   */
  async resendEmailVerification(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📧 Resending email verification');
      
      const response = await api.post('/api/mobile/auth/resend-verification');
      
      console.log('✅ Email verification resent');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Resend verification error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ========================================
  // LOGOUT API
  // ========================================
  
  /**
   * Logout user
   * Endpoint: POST /api/mobile/auth/logout
   * Used in: Throughout the app
   */
  async logoutUser(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚪 Logging out user');
      
      const response = await api.post('/api/mobile/auth/logout');
      
      console.log('✅ User logged out successfully');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Logout error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ========================================
  // TOKEN REFRESH API
  // ========================================
  
  /**
   * Refresh authentication token
   * Endpoint: POST /api/mobile/auth/refresh-token
   * Used in: Token refresh interceptor
   */
  async refreshToken(refreshToken: string): Promise<{ success: boolean; data: { token: string; expiresIn: number } }> {
    try {
      console.log('🔄 Refreshing authentication token');
      
      const response = await api.post('/api/mobile/auth/refresh-token', {
        refreshToken: refreshToken,
      });
      
      console.log('✅ Token refreshed successfully');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Token refresh error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Clear all service caches
   * Used before login/register to ensure fresh data
   */
  private async clearAllCaches(): Promise<void> {
    try {
      const businessProfileService = require('./businessProfile').default;
      businessProfileService.clearCache();
      console.log('✅ Business profile cache cleared');
    } catch (error) {
      console.error('Failed to clear business profile cache:', error);
    }
    
    try {
      const businessCategoryPostersApi = require('./businessCategoryPostersApi').default;
      businessCategoryPostersApi.clearCache();
      console.log('✅ Business category posters cache cleared');
    } catch (error) {
      console.error('Failed to clear business category posters cache:', error);
    }
    
    try {
      const homeApi = require('./homeApi').default;
      homeApi.clearCache();
      console.log('✅ Home API cache cleared');
    } catch (error) {
      console.error('Failed to clear home API cache:', error);
    }
    
    try {
      const templatesService = require('./templates').default;
      templatesService.clearCache();
      console.log('✅ Templates cache cleared');
    } catch (error) {
      console.error('Failed to clear templates cache:', error);
    }
    
    try {
      const businessCategoriesService = require('./businessCategoriesService').default;
      businessCategoriesService.clearCache();
      console.log('✅ Business categories cache cleared');
    } catch (error) {
      console.error('Failed to clear business categories cache:', error);
    }
    
    console.log('✅ All caches cleared successfully');
  }
}

// ========================================
// BACKEND IMPLEMENTATION REQUIREMENTS
// ========================================

/**
 * BACKEND TEAM IMPLEMENTATION GUIDE:
 * 
 * 1. REGISTRATION ENDPOINT (/api/mobile/auth/register)
 *    - Validate email format and uniqueness
 *    - Validate password strength (min 8 chars, special chars, etc.)
 *    - Validate phone number format
 *    - Hash password using bcrypt or similar
 *    - Create user record in database
 *    - Generate JWT token
 *    - Send welcome email (optional)
 *    - Return user profile and token
 * 
 * 2. LOGIN ENDPOINT (/api/mobile/auth/login)
 *    - Validate email and password
 *    - Check if user exists and is active
 *    - Verify password hash
 *    - Generate JWT token
 *    - Update last login timestamp
 *    - Return user profile and token
 * 
 * 3. PASSWORD RESET ENDPOINTS
 *    - /api/mobile/auth/forgot-password: Generate reset token, send email
 *    - /api/mobile/auth/reset-password: Validate token, update password
 *    - /api/mobile/auth/change-password: Verify current password, update to new
 * 
 * 4. EMAIL VERIFICATION ENDPOINTS
 *    - /api/mobile/auth/verify-email: Verify email with token
 *    - /api/mobile/auth/resend-verification: Resend verification email
 * 
 * 5. TOKEN MANAGEMENT
 *    - JWT tokens with expiration
 *    - Refresh token mechanism
 *    - Token blacklisting on logout
 * 
 * 6. SECURITY REQUIREMENTS
 *    - Rate limiting on auth endpoints
 *    - Input validation and sanitization
 *    - Password hashing with salt
 *    - CORS configuration
 *    - HTTPS enforcement
 * 
 * 7. ERROR HANDLING
 *    - Consistent error response format
 *    - Proper HTTP status codes
 *    - Detailed error messages for debugging
 *    - Validation error details
 * 
 * 8. DATABASE SCHEMA SUGGESTIONS
 *    - Users table with all profile fields
 *    - Password reset tokens table
 *    - Email verification tokens table
 *    - User sessions table (optional)
 *    - Audit log table (optional)
 */

export default new LoginAPIsService();
