import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import authApi, { type RegisterRequest, type LoginRequest, type GoogleAuthRequest } from './authApi';

// Authentication service with API-only integration (no local fallback)
class AuthService {
  private currentUser: any = null;
  private authStateListeners: ((user: any) => void)[] = [];
  private isInitialized: boolean = false; // Track if initial load is complete

  constructor() {
    // Note: Constructor cannot be async, so we call loadStoredUser without await
    // The initialize() method should be called by the app to ensure proper async initialization
    this.loadStoredUser();
    
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: '1037985236626-im6lbdis9q5g1bptng6g22ods7mf4bjh.apps.googleusercontent.com', // From your google-services.json
      offlineAccess: true,
    });
  }

  // Load stored user from AsyncStorage
  private async loadStoredUser() {
    try {
      console.log('Loading stored user from AsyncStorage...');
      
      // Check for regular user only
      const storedUser = await AsyncStorage.getItem('currentUser');
      const authToken = await AsyncStorage.getItem('authToken');
      
      console.log('AsyncStorage check - User:', storedUser ? 'Found' : 'Not found');
      if (__DEV__) {
        console.log('AsyncStorage check - Token:', authToken ? 'Found' : 'Not found');
      }
      
      // Print the full token for debugging
      if (authToken) {
        if (__DEV__) {
          console.log('FULL AUTH TOKEN:', authToken);
          console.log('TOKEN LENGTH:', authToken.length);
        }
      }
      
      // STRICT VALIDATION: Only restore session if BOTH valid token AND valid user exist
      if (storedUser && authToken && authToken.length > 10) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Additional validation: Ensure user has required fields
          if (parsedUser && parsedUser.email && parsedUser.id) {
            this.currentUser = parsedUser;
            console.log('Loaded stored user:', this.currentUser.id || this.currentUser.uid);
            console.log('User email:', this.currentUser.email);
            if (__DEV__) {
              console.log('Token length:', authToken.length);
            }
            
            // Mark as initialized and notify auth state listeners
            this.isInitialized = true;
            this.notifyAuthStateListeners(this.currentUser);
            return;
          } else {
            console.log('Invalid user data structure - clearing and requiring login');
          }
        } catch (parseError) {
          console.log('Failed to parse stored user data - clearing and requiring login');
        }
      }
      
      // If we reach here, either data is invalid or missing
      console.log('No valid stored user or token found - user needs to login');
      
      // Clear any invalid data to prevent future issues
      if (storedUser || authToken) {
        console.log('Clearing invalid auth data');
        await AsyncStorage.multiRemove(['currentUser', 'authToken', 'refreshToken', 'userData']);
      }
      
      // Mark as initialized and notify with null to indicate no user
      this.isInitialized = true;
      this.notifyAuthStateListeners(null);
      
    } catch (error) {
      console.error('Error loading stored user:', error);
      
      // Clear any potentially corrupted data
      try {
        await AsyncStorage.multiRemove(['currentUser', 'authToken', 'refreshToken', 'userData']);
      } catch (clearError) {
        console.error('Error clearing corrupted data:', clearError);
      }
      
      // Mark as initialized and notify with null on error to show login screen
      this.isInitialized = true;
      this.notifyAuthStateListeners(null);
    }
  }


  // Save user to AsyncStorage
  async saveUserToStorage(user: any, token?: string) {
    try {
      console.log('💾 Saving user to AsyncStorage...', user.id);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      if (token) {
        if (__DEV__) {
          console.log('🔐 Saving auth token to AsyncStorage...');
        }
        await AsyncStorage.setItem('authToken', token);
        if (__DEV__) {
          console.log('✅ Auth token saved successfully');
        }
        
        // Verify token was saved
        const savedToken = await AsyncStorage.getItem('authToken');
        if (__DEV__) {
          console.log('🔍 Verified token in storage:', savedToken ? 'YES' : 'NO');
        }
      }
      console.log('✅ User data saved to AsyncStorage successfully');
    } catch (error) {
      console.error('❌ Error saving user to storage:', error);
    }
  }


  // Register new user (API only)
  async registerUser(userData: any): Promise<any> {
    try {
      console.log('Registering new user with API...');
      
      // Clear all service caches before registration to ensure fresh start
      console.log('🗑️ Clearing all service caches before registration...');
      await this.clearAllCaches();
      
      // Prepare registration data with all available fields
      const registerData: RegisterRequest = {
        email: userData.email,
        password: userData.password,
        companyName: userData.companyName,
        phoneNumber: userData.phoneNumber,
        description: userData.description,
        category: userData.category,
        address: userData.address,
        website: userData.website,
        alternatePhone: userData.alternatePhone,
        companyLogo: userData.companyLogo,
        displayName: userData.displayName,
      };
      
      const response = await authApi.register(registerData);
      
      if (response.success) {
        // Save user and token, protect ALL registration fields from future contamination
        const userData = {
          ...response.data.user,
          // Store original values to protect from business profile contamination
          _originalCompanyName: response.data.user.companyName,
          _originalAddress: response.data.user.address || registerData.address || '',
          _originalWebsite: response.data.user.website || registerData.website || '',
          _originalCategory: response.data.user.category || registerData.category || '',
          _originalDescription: response.data.user.description || registerData.description || '',
          _originalAlternatePhone: response.data.user.alternatePhone || registerData.alternatePhone || '',
        };
        
        console.log('✅ User registration successful via API:', userData.id);
        console.log('🔒 Protected original registration values:');
        console.log('   - _originalAddress:', userData._originalAddress);
        console.log('   - _originalWebsite:', userData._originalWebsite);
        console.log('   - _originalCategory:', userData._originalCategory);
        console.log('   - _originalDescription:', userData._originalDescription);
        console.log('   - _originalAlternatePhone:', userData._originalAlternatePhone);
        
        this.currentUser = userData;
        await this.saveUserToStorage(userData, response.data.token);
        this.notifyAuthStateListeners(this.currentUser);
        
        return { success: true, user: userData };
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('API registration failed:', error);
      throw error;
    }
  }


  // Email/Password sign-in (API only)
  async signInWithEmail(email: string, password: string): Promise<any> {
    try {
      console.log('Email sign-in with API...');
      
      // Clear all service caches before login to ensure fresh data for new user
      console.log('🗑️ Clearing all service caches before login...');
      await this.clearAllCaches();
      
      const loginData: LoginRequest = {
        email,
        password,
      };
      
      const response = await authApi.login(loginData);
      
      if (response.success) {
        // Save user and token, ensure _original* fields are preserved if they exist
        const userData = {
          ...response.data.user,
          // Preserve or create _original* fields to protect from contamination
          _originalCompanyName: response.data.user._originalCompanyName || response.data.user.companyName,
          _originalAddress: response.data.user._originalAddress || response.data.user.address || '',
          _originalWebsite: response.data.user._originalWebsite || response.data.user.website || '',
          _originalCategory: response.data.user._originalCategory || response.data.user.category || '',
          _originalDescription: response.data.user._originalDescription || response.data.user.description || '',
          _originalAlternatePhone: response.data.user._originalAlternatePhone || response.data.user.alternatePhone || '',
        };
        
        this.currentUser = userData;
        await this.saveUserToStorage(userData, response.data.token);
        this.notifyAuthStateListeners(this.currentUser);
        
        console.log('✅ Email sign-in successful via API:', userData.id);
        console.log('🔒 Protected values preserved:', {
          _originalAddress: userData._originalAddress,
          _originalWebsite: userData._originalWebsite,
          _originalCategory: userData._originalCategory
        });
        console.log('═══════════════════════════════════════════════════════════');
        if (__DEV__) {
          console.log('🔑 AUTH TOKEN (auth.ts):');
          console.log('Token:', response.data.token);
          console.log('Token Length:', response.data.token?.length || 0);
          console.log('Token Preview:', response.data.token?.substring(0, 50) + '...');
        }
        console.log('═══════════════════════════════════════════════════════════');
        return { success: true, user: userData };
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('API sign-in failed:', error);
      throw error;
    }
  }


  // Google Sign-In implementation (API only)
  async signInWithGoogle(): Promise<any> {
    try {
      console.log('Google Sign-In started...');
      
      // Clear all service caches before login to ensure fresh data for new user
      console.log('🗑️ Clearing all service caches before login...');
      await this.clearAllCaches();
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      console.log('Google Sign-In user info:', userInfo);
      
      const googleAuthData: GoogleAuthRequest = {
        idToken: userInfo.data?.idToken || '',
        accessToken: userInfo.data?.serverAuthCode || '',
      };
      
      const response = await authApi.googleLogin(googleAuthData);
      
      if (response.success) {
        // Save user and token, ensure _original* fields are preserved if they exist
        const userData = {
          ...response.data.user,
          // Preserve or create _original* fields to protect from contamination
          _originalCompanyName: response.data.user._originalCompanyName || response.data.user.companyName,
          _originalAddress: response.data.user._originalAddress || response.data.user.address || '',
          _originalWebsite: response.data.user._originalWebsite || response.data.user.website || '',
          _originalCategory: response.data.user._originalCategory || response.data.user.category || '',
          _originalDescription: response.data.user._originalDescription || response.data.user.description || '',
          _originalAlternatePhone: response.data.user._originalAlternatePhone || response.data.user.alternatePhone || '',
        };
        
        this.currentUser = userData;
        await this.saveUserToStorage(userData, response.data.token);
        this.notifyAuthStateListeners(this.currentUser);
        
        console.log('✅ Google sign-in successful via API:', userData.id);
        console.log('🔒 Protected values preserved:', {
          _originalAddress: userData._originalAddress,
          _originalWebsite: userData._originalWebsite,
          _originalCategory: userData._originalCategory
        });
        console.log('═══════════════════════════════════════════════════════════');
        if (__DEV__) {
          console.log('🔑 GOOGLE AUTH TOKEN (auth.ts):');
          console.log('Token:', response.data.token);
          console.log('Token Length:', response.data.token?.length || 0);
          console.log('Token Preview:', response.data.token?.substring(0, 50) + '...');
        }
        console.log('═══════════════════════════════════════════════════════════');
        return { success: true, user: userData };
      } else {
        throw new Error('Google login failed');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      // Handle specific Google Sign-In errors
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Sign in was cancelled by user');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available');
      } else if (error.code === 'SIGN_IN_REQUIRED') {
        throw new Error('Sign in required');
      } else {
        throw new Error('Google Sign-In failed. Please try again.');
      }
    }
  }


  // Anonymous sign-in (removed - API only)
  async signInAnonymously(): Promise<any> {
    throw new Error('Anonymous sign-in is not supported. Please use email/password or Google sign-in.');
  }

  // Sign out (API only)
  async signOut(): Promise<void> {
    try {
      console.log('Signing out user...');
      
      // STEP 1: Capture auth token BEFORE clearing (needed for API logout)
      const authToken = await AsyncStorage.getItem('authToken');
      const isGoogleUser = this.currentUser?.providerId === 'google';
      
      // STEP 2: Ensure full Google logout to prevent auto-login
      if (isGoogleUser) {
        try {
          await GoogleSignin.signOut();
          await GoogleSignin.revokeAccess();
          console.log('✅ Google sign out completed');
        } catch (googleError) {
          console.error('❌ Error during Google sign out:', googleError);
        }
      }
      
      // STEP 3: Clear critical local data FIRST for instant UI update
      this.currentUser = null;
      
      // STEP 4: Clear ALL auth state properly
      const keysToRemove = [
        'currentUser',
        'authToken',
        'refreshToken',
        'userData',
        'user',
        'isDemoUser',
        'user_likes',
        'transaction_history',
        'user_business_profiles',
        'user_preferences',
        'profile_cache_timestamp',
        'profile_data',
        'poster_stats',
        'business_stats',
        'download_stats',
        'profile_cache_data',
        'profile_cache_download_stats',
        'profile_cache_business_stats',
        'profile_cache_last_update',
        'profile_cache_user_id',
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      
      // STEP 5: Notify listeners AFTER clearing storage to prevent race conditions
      this.notifyAuthStateListeners(null);
      
      // STEP 6: Background cleanup (API logout with token, cache clearing)
      // Don't await these - let them run in background
      this.performBackgroundCleanup(authToken);
      
      console.log('✅ Sign out completed - user navigated to login');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Even if there's an error, we should clear local data
      try {
        this.currentUser = null;
        const keysToRemove = ['currentUser', 'authToken', 'user', 'isDemoUser'];
        await AsyncStorage.multiRemove(keysToRemove);
        this.notifyAuthStateListeners(null);
        console.log('✅ Local cleanup completed despite error');
      } catch (cleanupError) {
        console.error('❌ Error during cleanup:', cleanupError);
      }
      throw error;
    }
  }

  // Perform background cleanup after sign out (non-blocking)
  private performBackgroundCleanup(authToken: string | null): void {
    // Run in background without awaiting - user already navigated away
    setTimeout(async () => {
      try {
        const cleanupTasks = [];
        
        // API logout with the captured token
        if (authToken) {
          cleanupTasks.push(
            (async () => {
              try {
                // Temporarily restore token for logout API call
                await AsyncStorage.setItem('authToken', authToken);
                await authApi.logout();
                // Remove it again after logout
                await AsyncStorage.removeItem('authToken');
              } catch (error) {
                // Silent fail - user already logged out locally
              }
            })()
          );
        }
        
        // Clear all service caches
        cleanupTasks.push(this.clearAllCaches().catch(() => {}));
        
        // Execute all cleanup tasks in parallel
        await Promise.all(cleanupTasks);
        
        console.log('✅ Background cleanup completed');
      } catch (error) {
        // Silent fail - user already logged out locally
      }
    }, 0);
  }

  // Get current user profile (API only)
  async getUserProfile(): Promise<any> {
    try {
      const response = await authApi.getProfile();
      if (response.success) {
        this.currentUser = response.data;
        await this.saveUserToStorage(response.data);
        return response.data;
      }
      throw new Error('Failed to get user profile');
    } catch (error) {
      console.error('API get profile failed:', error);
      throw error;
    }
  }

  // Update user profile (API only)
  async updateUserProfile(profileData: any): Promise<any> {
    try {
      const response = await authApi.updateProfile(profileData);
      if (response.success) {
        this.currentUser = response.data;
        await this.saveUserToStorage(response.data);
        return response.data;
      }
      throw new Error('Failed to update user profile');
    } catch (error) {
      console.error('API update profile failed:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): any {
    return this.currentUser;
  }

  // Set current user (for external services)
  setCurrentUser(user: any) {
    this.currentUser = user;
    // Persist to AsyncStorage to ensure consistency
    this.saveUserToStorage(user).catch(error => {
      console.error('❌ Failed to persist user to storage:', error);
    });
    // Explicitly notify listeners so React components update immediately
    this.notifyAuthStateListeners(user);
  }

  // Centralized check for subscription status
  isSubscriptionActive(): boolean {
    const status = this.currentUser?.subscriptionStatus;
    return status === 'Active' || status === 'ACTIVE' || status === 'active';
  }

  // Debug helper: Check AsyncStorage status
  async debugAsyncStorage(): Promise<void> {
    try {
      console.log('🐛 ===== AsyncStorage Debug Info =====');
      
      const currentUser = await AsyncStorage.getItem('currentUser');
      const authToken = await AsyncStorage.getItem('authToken');
      
      console.log('📦 currentUser in AsyncStorage:', currentUser ? 'EXISTS' : 'NOT FOUND');
      if (currentUser) {
        const parsed = JSON.parse(currentUser);
        console.log('   - User ID:', parsed.id || parsed.uid);
        console.log('   - User Email:', parsed.email);
        console.log('   - User Name:', parsed.companyName || parsed.displayName);
      }
      
      if (__DEV__) {
        console.log('🔑 authToken in AsyncStorage:', authToken ? 'EXISTS' : 'NOT FOUND');
        if (authToken) {
          console.log('🔑 FULL AUTH TOKEN:', authToken);
          console.log('   - Token Length:', authToken.length);
          console.log('   - Token Preview:', authToken.substring(0, 30) + '...');
        }
      }
      
      console.log('👤 currentUser in memory:', this.currentUser ? 'EXISTS' : 'NOT FOUND');
      if (this.currentUser) {
        console.log('   - User ID:', this.currentUser.id || this.currentUser.uid);
        console.log('   - User Email:', this.currentUser.email);
      }
      
      console.log('🔧 Is Initialized:', this.isInitialized);
      console.log('👂 Auth State Listeners:', this.authStateListeners.length);
      console.log('🐛 ===================================');
    } catch (error) {
      console.error('❌ Error debugging AsyncStorage:', error);
    }
  }


  // Get current Google user info
  async getCurrentGoogleUser(): Promise<any> {
    try {
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      console.error('Error getting current Google user:', error);
      return null;
    }
  }

  // Initialize auth service (load stored user only)
  async initialize(): Promise<void> {
    try {
      console.log('🔧 Initializing auth service...');
      
      // Ensure stored user is loaded (this may be called after constructor)
      await this.loadStoredUser();
      
      console.log('✅ Auth service initialized successfully');
      console.log('Current user:', this.currentUser ? `${this.currentUser.email} (${this.currentUser.id})` : 'None');
      
      // DISABLED: Auto Google session restore to prevent unintended login
      // Users must explicitly click Google Sign-In to authenticate
      // This prevents automatic login after sign out
      console.log('ℹ️ Google auto-restore disabled - users must explicitly sign in');
    } catch (error) {
      console.error('❌ Error initializing auth service:', error);
      throw error; // Re-throw to let AppNavigator handle it
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: any) => void) {
    this.authStateListeners.push(callback);
    
    // Immediately call the callback with current state if initialization is complete
    // This ensures listeners get the current state even if they subscribe after initialization
    if (this.isInitialized) {
      const userState = this.currentUser ? 'logged in' : 'logged out';
      console.log(`🔔 onAuthStateChanged: Immediately notifying new listener (user ${userState})`);
      try {
        callback(this.currentUser);
      } catch (error) {
        console.error('Error in immediate auth state callback:', error);
      }
    } else {
      console.log('⏳ onAuthStateChanged: Listener added, waiting for initialization to complete');
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Notify all auth state listeners
  notifyAuthStateListeners(user: any) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  // Helper method to clear all service caches
  private async clearAllCaches(): Promise<void> {
    // Clear all service caches in parallel for better performance
    const cachePromises = [
      // Business profile cache
      (async () => {
        try {
          const businessProfileService = require('./businessProfile').default;
          await businessProfileService.clearCache();
        } catch (error) {
          // Silent fail
        }
      })(),
      
      // Business category posters cache
      (async () => {
        try {
          const businessCategoryPostersApi = require('./businessCategoryPostersApi').default;
          await businessCategoryPostersApi.clearCache();
        } catch (error) {
          // Silent fail
        }
      })(),
      
      // Home API cache
      (async () => {
        try {
          const homeApi = require('./homeApi').default;
          await homeApi.clearCache();
        } catch (error) {
          // Silent fail
        }
      })(),
      
      // Templates cache
      (async () => {
        try {
          const templatesService = require('./templates').default;
          await templatesService.clearCache();
        } catch (error) {
          // Silent fail
        }
      })(),
      
      // Business categories cache
      (async () => {
        try {
          const businessCategoriesService = require('./businessCategoriesService').default;
          await businessCategoriesService.clearCache();
        } catch (error) {
          // Silent fail
        }
      })(),
      
      // Greeting templates cache
      (async () => {
        try {
          const greetingTemplatesService = require('./greetingTemplates').default;
          greetingTemplatesService.clearCache();
        } catch (error) {
          // Silent fail
        }
      })(),
      
      // Profile-related AsyncStorage in batch
      (async () => {
        try {
          const profileCacheKeys = [
            'profile_cache_timestamp',
            'profile_data',
            'poster_stats',
            'business_stats',
            'download_stats',
            'profile_cache_data',
            'profile_cache_download_stats',
            'profile_cache_business_stats',
            'profile_cache_last_update',
            'profile_cache_user_id',
          ];
          await AsyncStorage.multiRemove(profileCacheKeys);
        } catch (error) {
          // Silent fail
        }
      })(),
    ];
    
    // Execute all in parallel
    await Promise.all(cachePromises);
  }
}

export default new AuthService(); 