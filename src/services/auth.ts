import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import authApi, { type RegisterRequest, type LoginRequest, type GoogleAuthRequest } from './authApi';

// Authentication service with API-only integration (no local fallback)
class AuthService {
  private currentUser: any = null;
  private authStateListeners: ((user: any) => void)[] = [];

  constructor() {
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
      const storedUser = await AsyncStorage.getItem('currentUser');
      const authToken = await AsyncStorage.getItem('authToken');
      if (storedUser && authToken) {
        this.currentUser = JSON.parse(storedUser);
        this.notifyAuthStateListeners(this.currentUser);
        console.log('Loaded stored user:', this.currentUser.uid);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    }
  }


  // Save user to AsyncStorage
  async saveUserToStorage(user: any, token?: string) {
    try {
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }


  // Register new user (API only)
  async registerUser(userData: any): Promise<any> {
    try {
      console.log('Registering new user with API...');
      
      // Prepare registration data
      const registerData: RegisterRequest = {
        email: userData.email,
        password: userData.password,
        companyName: userData.companyName,
        phoneNumber: userData.phoneNumber,
      };
      
      const response = await authApi.register(registerData);
      
      if (response.success) {
        // Save user and token
        this.currentUser = response.data.user;
        await this.saveUserToStorage(response.data.user, response.data.token);
        this.notifyAuthStateListeners(this.currentUser);
        
        console.log('User registration successful via API:', response.data.user.id);
        return { success: true, user: response.data.user };
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
      
      const loginData: LoginRequest = {
        email,
        password,
      };
      
      const response = await authApi.login(loginData);
      
      if (response.success) {
        // Save user and token
        this.currentUser = response.data.user;
        await this.saveUserToStorage(response.data.user, response.data.token);
        this.notifyAuthStateListeners(this.currentUser);
        
        console.log('Email sign-in successful via API:', response.data.user.id);
        return { success: true, user: response.data.user };
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
        // Save user and token
        this.currentUser = response.data.user;
        await this.saveUserToStorage(response.data.user, response.data.token);
        this.notifyAuthStateListeners(this.currentUser);
        
        console.log('Google sign-in successful via API:', response.data.user.id);
        return { success: true, user: response.data.user };
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
      
      // Try API logout
      try {
        await authApi.logout();
        console.log('API logout successful');
      } catch (apiError) {
        console.error('API logout failed:', apiError);
        // Continue with local cleanup even if API logout fails
      }
      
      // Sign out from Google if user was signed in with Google
      if (this.currentUser?.providerId === 'google') {
        try {
          await GoogleSignin.signOut();
          console.log('Google Sign-Out successful');
        } catch (googleError) {
          console.error('Google Sign-Out error:', googleError);
        }
      }
      
      // Clear local data
      this.currentUser = null;
      await AsyncStorage.removeItem('currentUser');
      await AsyncStorage.removeItem('authToken');
      this.notifyAuthStateListeners(null);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
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
      await this.loadStoredUser();
      
      // Check if user is already signed in with Google
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        const isGoogleSignedIn = !!currentUser;
        if (isGoogleSignedIn && !this.currentUser) {
          console.log('User is signed in with Google but not in local storage, attempting to restore session...');
          try {
            await this.signInWithGoogle();
          } catch (error) {
            console.error('Failed to restore Google session:', error);
          }
        }
      } catch (googleError) {
        console.error('Error checking Google sign-in status:', googleError);
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: any) => void) {
    this.authStateListeners.push(callback);
    
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
}

export default new AuthService(); 