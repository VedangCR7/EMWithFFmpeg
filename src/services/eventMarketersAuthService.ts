import eventMarketersApi from './eventMarketersApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
  assignedCategories?: string[];
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CurrentUserResponse {
  success: boolean;
  user: AuthUser;
}

class EventMarketersAuthService {
  private currentUser: AuthUser | null = null;
  private authToken: string | null = null;

  // Admin Login
  async adminLogin(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('Admin login attempt for:', loginData.email);
      const response = await eventMarketersApi.post('/api/auth/admin/login', loginData);
      
      if (response.data.success) {
        this.currentUser = response.data.user;
        this.authToken = response.data.token;
        
        // Save to storage
        await this.saveAuthData(response.data.user, response.data.token);
        
        console.log('✅ Admin login successful:', response.data.user.name);
        return response.data;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('❌ Admin login failed:', error);
      throw error;
    }
  }

  // Subadmin Login
  async subadminLogin(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('Subadmin login attempt for:', loginData.email);
      const response = await eventMarketersApi.post('/api/auth/subadmin/login', loginData);
      
      if (response.data.success) {
        this.currentUser = response.data.user;
        this.authToken = response.data.token;
        
        // Save to storage
        await this.saveAuthData(response.data.user, response.data.token);
        
        console.log('✅ Subadmin login successful:', response.data.user.name);
        return response.data;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('❌ Subadmin login failed:', error);
      throw error;
    }
  }

  // Get Current User
  async getCurrentUser(): Promise<CurrentUserResponse> {
    try {
      console.log('Fetching current user...');
      const response = await eventMarketersApi.get('/api/auth/me');
      
      if (response.data.success) {
        this.currentUser = response.data.user;
        console.log('✅ Current user loaded:', response.data.user.name);
        return response.data;
      } else {
        throw new Error('Failed to get current user');
      }
    } catch (error) {
      console.error('❌ Failed to get current user:', error);
      throw error;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      console.log('Logging out user...');
      
      // Clear local data
      this.currentUser = null;
      this.authToken = null;
      
      // Clear storage
      await this.clearAuthData();
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      if (this.currentUser && this.authToken) {
        return true;
      }

      // Try to load from storage
      const storedUser = await AsyncStorage.getItem('eventMarketersUser');
      const storedToken = await AsyncStorage.getItem('eventMarketersToken');
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.authToken = storedToken;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      return false;
    }
  }

  // Get current user from memory
  getCurrentUserFromMemory(): AuthUser | null {
    return this.currentUser;
  }

  // Get auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    if (!this.currentUser?.permissions) {
      return false;
    }
    return this.currentUser.permissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: string[]): boolean {
    if (!this.currentUser?.permissions) {
      return false;
    }
    return permissions.some(permission => this.currentUser!.permissions!.includes(permission));
  }

  // Check if user has all specified permissions
  hasAllPermissions(permissions: string[]): boolean {
    if (!this.currentUser?.permissions) {
      return false;
    }
    return permissions.every(permission => this.currentUser!.permissions!.includes(permission));
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  // Check if user is subadmin
  isSubadmin(): boolean {
    return this.currentUser?.role === 'Content Manager' || this.currentUser?.role === 'SUBADMIN';
  }

  // Check if user has access to specific category
  hasCategoryAccess(category: string): boolean {
    if (!this.currentUser?.assignedCategories) {
      return true; // Admin has access to all categories
    }
    return this.currentUser.assignedCategories.includes(category);
  }

  // Initialize auth service (load from storage)
  async initialize(): Promise<void> {
    try {
      const storedUser = await AsyncStorage.getItem('eventMarketersUser');
      const storedToken = await AsyncStorage.getItem('eventMarketersToken');
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.authToken = storedToken;
        console.log('✅ Auth service initialized with stored user:', this.currentUser.name);
      } else {
        console.log('No stored auth data found');
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
    }
  }

  // Save auth data to storage
  private async saveAuthData(user: AuthUser, token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('eventMarketersUser', JSON.stringify(user));
      await AsyncStorage.setItem('eventMarketersToken', token);
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  }

  // Clear auth data from storage
  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('eventMarketersUser');
      await AsyncStorage.removeItem('eventMarketersToken');
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  // Validate login data
  validateLoginData(loginData: LoginRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!loginData.email?.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(loginData.email)) {
      errors.push('Invalid email format');
    }

    if (!loginData.password?.trim()) {
      errors.push('Password is required');
    } else if (loginData.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Login with validation
  async adminLoginWithValidation(loginData: LoginRequest): Promise<AuthResponse> {
    const validation = this.validateLoginData(loginData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return await this.adminLogin(loginData);
  }

  // Subadmin login with validation
  async subadminLoginWithValidation(loginData: LoginRequest): Promise<AuthResponse> {
    const validation = this.validateLoginData(loginData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return await this.subadminLogin(loginData);
  }

  // Refresh user data
  async refreshUserData(): Promise<void> {
    try {
      if (await this.isAuthenticated()) {
        await this.getCurrentUser();
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, clear auth data
      await this.logout();
    }
  }
}

export default new EventMarketersAuthService();
