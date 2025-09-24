import eventMarketersApi from './eventMarketersApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InstalledUser {
  id: string;
  deviceId: string;
  name: string;
  email: string;
  phone?: string;
  installDate: string;
  totalViews?: number;
  downloadAttempts?: number;
  isConverted?: boolean;
  lastActiveAt?: string;
}

export interface RegisterUserRequest {
  deviceId: string;
  name: string;
  email: string;
  phone: string;
  appVersion: string;
}

export interface RegisterUserResponse {
  success: boolean;
  user: InstalledUser;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface UserProfileResponse {
  success: boolean;
  user: InstalledUser;
}

class InstalledUsersService {
  private currentUser: InstalledUser | null = null;

  // Register a new installed user
  async registerUser(userData: RegisterUserRequest): Promise<RegisterUserResponse> {
    try {
      console.log('Registering installed user:', userData.email);
      const response = await eventMarketersApi.post('/api/installed-users/register', userData);
      
      if (response.data.success) {
        this.currentUser = response.data.user;
        await this.saveUserToStorage(response.data.user);
        console.log('✅ User registered successfully:', response.data.user.id);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to register user:', error);
      throw error;
    }
  }

  // Get user profile by device ID
  async getUserProfile(deviceId: string): Promise<UserProfileResponse> {
    try {
      console.log('Fetching user profile for device:', deviceId);
      const response = await eventMarketersApi.get(`/api/installed-users/profile/${deviceId}`);
      
      if (response.data.success) {
        this.currentUser = response.data.user;
        await this.saveUserToStorage(response.data.user);
        console.log('✅ User profile loaded:', response.data.user.name);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(deviceId: string, userData: UpdateUserRequest): Promise<UserProfileResponse> {
    try {
      console.log('Updating user profile for device:', deviceId);
      const response = await eventMarketersApi.put(`/api/installed-users/profile/${deviceId}`, userData);
      
      if (response.data.success) {
        this.currentUser = response.data.user;
        await this.saveUserToStorage(response.data.user);
        console.log('✅ User profile updated:', response.data.user.name);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      throw error;
    }
  }

  // Get current user from storage
  async getCurrentUser(): Promise<InstalledUser | null> {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }

      const storedUser = await AsyncStorage.getItem('installedUser');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        return this.currentUser;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Save user to storage
  private async saveUserToStorage(user: InstalledUser): Promise<void> {
    try {
      await AsyncStorage.setItem('installedUser', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  }

  // Clear user from storage
  async clearUser(): Promise<void> {
    try {
      this.currentUser = null;
      await AsyncStorage.removeItem('installedUser');
      console.log('User data cleared from storage');
    } catch (error) {
      console.error('Failed to clear user from storage:', error);
    }
  }

  // Check if user is registered
  async isUserRegistered(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      console.error('Failed to check if user is registered:', error);
      return false;
    }
  }

  // Get device ID (you might want to implement this using a device ID library)
  async getDeviceId(): Promise<string> {
    try {
      // Try to get from storage first
      let deviceId = await AsyncStorage.getItem('deviceId');
      
      if (!deviceId) {
        // Generate a new device ID (in a real app, you'd use a proper device ID library)
        deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('deviceId', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Failed to get device ID:', error);
      // Fallback device ID
      return 'device-' + Date.now();
    }
  }

  // Get app version (you might want to implement this using a proper version library)
  getAppVersion(): string {
    // This should be replaced with actual app version from package.json or native modules
    return '1.0.0';
  }

  // Register current device user
  async registerCurrentDeviceUser(userInfo: {
    name: string;
    email: string;
    phone: string;
  }): Promise<RegisterUserResponse> {
    try {
      const deviceId = await this.getDeviceId();
      const appVersion = this.getAppVersion();
      
      const userData: RegisterUserRequest = {
        deviceId,
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        appVersion
      };
      
      return await this.registerUser(userData);
    } catch (error) {
      console.error('Failed to register current device user:', error);
      throw error;
    }
  }

  // Update current user profile
  async updateCurrentUserProfile(userData: UpdateUserRequest): Promise<UserProfileResponse> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user found');
      }
      
      return await this.updateUserProfile(currentUser.deviceId, userData);
    } catch (error) {
      console.error('Failed to update current user profile:', error);
      throw error;
    }
  }
}

export default new InstalledUsersService();
