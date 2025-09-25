import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './auth';

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
  deviceId?: string; // Required by backend
  // Additional fields from registration form
  description?: string;
  category?: string;
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
  deviceId?: string; // Required by backend
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
  // DEVICE ID MANAGEMENT
  // ========================================
  
  /**
   * Get or generate device ID
   * Device ID is stored in AsyncStorage for persistence
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('deviceId');
      
      if (!deviceId) {
        // Generate a new device ID
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('deviceId', deviceId);
        console.log('Generated new device ID:', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      // Fallback to timestamp-based ID
      return 'device_' + Date.now();
    }
  }
  
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
      
      // Get or generate device ID if not provided
      const deviceId = data.deviceId || await this.getDeviceId();
      
      const response = await api.post('/api/mobile/auth/register', {
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        phone: data.phoneNumber, // Backend expects 'phone', not 'phoneNumber'
        deviceId: deviceId, // Include device ID
        // Additional fields from registration form
        description: data.description,
        category: data.category,
        address: data.address,
        alternatePhone: data.alternatePhone,
        website: data.website,
        companyLogo: data.companyLogo,
        displayName: data.displayName,
      });
      
      if (response.data.success) {
        // Store user data and token in auth service
        const { user, accessToken } = response.data.data;
        
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
        
        // Update auth service with complete user data
        authService.setCurrentUser(completeUserData);
        await authService.saveUserToStorage(completeUserData, accessToken);
        
        // Store complete profile data separately for edit profile access
        await AsyncStorage.setItem('completeProfileData', JSON.stringify(completeUserData));
        
        // Notify auth state listeners (this will trigger navigation)
        authService.notifyAuthStateListeners(completeUserData);
        
        console.log('✅ User registration successful and complete data stored locally');
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
      
      // Get or generate device ID if not provided
      const deviceId = data.deviceId || await this.getDeviceId();
      
      const response = await api.post('/api/mobile/auth/login', {
        email: data.email,
        password: data.password,
        deviceId: deviceId, // Include device ID
        rememberMe: data.rememberMe || false,
      });
      
      if (response.data.success) {
        // Store user data and token in auth service
        const { user, accessToken } = response.data.data;
        
        // Update auth service with user data
        authService.setCurrentUser(user);
        await authService.saveUserToStorage(user, accessToken);
        
        // Notify auth state listeners (this will trigger navigation)
        authService.notifyAuthStateListeners(user);
        
        console.log('✅ User login successful and auth state updated');
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
      console.log('📧 Requesting password reset for:', data.email);
      
      const response = await api.post('/api/mobile/auth/forgot-password', {
        email: data.email,
      });
      
      console.log('✅ Password reset request sent');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Password reset request error:', error.response?.data || error.message);
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
      console.log('🔑 Confirming password reset');
      
      const response = await api.post('/api/mobile/auth/reset-password', {
        token: data.token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      
      console.log('✅ Password reset confirmed');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Password reset confirmation error:', error.response?.data || error.message);
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
      console.log('🔐 Changing password');
      
      const response = await api.put('/api/mobile/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      
      console.log('✅ Password changed successfully');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Change password error:', error.response?.data || error.message);
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
