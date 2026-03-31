import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPreferences {
  userId: string;
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  defaultViewMode: 'grid' | 'list';
  preferredCategories: string[];
  language: string;
  autoSave: boolean;
  highQualityDownloads: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceUpdate {
  notificationsEnabled?: boolean;
  darkModeEnabled?: boolean;
  defaultViewMode?: 'grid' | 'list';
  preferredCategories?: string[];
  language?: string;
  autoSave?: boolean;
  highQualityDownloads?: boolean;
}

class UserPreferencesService {
  private readonly STORAGE_KEY_PREFIX = 'user_preferences_';

  // Get user-specific storage key
  private getUserStorageKey(userId?: string): string {
    return `${this.STORAGE_KEY_PREFIX}${userId || 'anonymous'}`;
  }

  // Get user preferences
  async getUserPreferences(userId?: string): Promise<UserPreferences | null> {
    try {
      const storageKey = this.getUserStorageKey(userId);
      const preferencesJson = await AsyncStorage.getItem(storageKey);
      
      if (preferencesJson) {
        const userPrefs = JSON.parse(preferencesJson);
        console.log('✅ Found user preferences for user:', userId);
        return userPrefs;
      }
      
      // Return default preferences if user not found
      return this.getDefaultPreferences(userId || 'anonymous');
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences(userId || 'anonymous');
    }
  }

  // Save user preferences
  async saveUserPreferences(userId: string, preferences: PreferenceUpdate): Promise<UserPreferences> {
    try {
      const storageKey = this.getUserStorageKey(userId);
      const existingPrefs = await this.getUserPreferences(userId);
      
      const now = new Date().toISOString();
      
      const updatedPreferences: UserPreferences = {
        ...(existingPrefs || this.getDefaultPreferences(userId)),
        ...preferences,
        userId,
        updatedAt: now,
      };
      
      // If creating new preferences, set createdAt
      if (!existingPrefs) {
        updatedPreferences.createdAt = now;
      }
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedPreferences));
      
      console.log('✅ Saved user preferences for user:', userId);
      return updatedPreferences;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  // Update specific preference
  async updatePreference(userId: string, key: keyof PreferenceUpdate, value: any): Promise<UserPreferences> {
    try {
      const currentPrefs = await this.getUserPreferences(userId);
      if (!currentPrefs) {
        throw new Error('User preferences not found');
      }
      
      const update: PreferenceUpdate = { [key]: value };
      return await this.saveUserPreferences(userId, update);
    } catch (error) {
      console.error('Error updating preference:', error);
      throw error;
    }
  }


  // Get default preferences
  private getDefaultPreferences(userId: string): UserPreferences {
    const now = new Date().toISOString();
    return {
      userId,
      notificationsEnabled: true,
      darkModeEnabled: false,
      defaultViewMode: 'grid',
      preferredCategories: [],
      language: 'en',
      autoSave: true,
      highQualityDownloads: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Clear user preferences
  async clearUserPreferences(userId: string): Promise<boolean> {
    try {
      const storageKey = this.getUserStorageKey(userId);
      await AsyncStorage.removeItem(storageKey);
      console.log('✅ Cleared preferences for user:', userId);
      return true;
    } catch (error) {
      console.error('Error clearing user preferences:', error);
      return false;
    }
  }

  // Get preference statistics (no longer supported with user-specific storage)
  async getPreferenceStats(): Promise<{
    totalUsers: number;
    notificationsEnabled: number;
    darkModeEnabled: number;
    gridViewUsers: number;
    listViewUsers: number;
  }> {
    console.log('⚠️ getPreferenceStats is no longer supported with user-specific storage');
    return {
      totalUsers: 0,
      notificationsEnabled: 0,
      darkModeEnabled: 0,
      gridViewUsers: 0,
      listViewUsers: 0,
    };
  }

  // Export user preferences (for backup)
  async exportUserPreferences(userId: string): Promise<string> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) {
        throw new Error('User preferences not found');
      }
      
      return JSON.stringify(preferences, null, 2);
    } catch (error) {
      console.error('Error exporting user preferences:', error);
      throw error;
    }
  }

  // Import user preferences (for restore)
  async importUserPreferences(userId: string, preferencesJson: string): Promise<UserPreferences> {
    try {
      const preferences: UserPreferences = JSON.parse(preferencesJson);
      
      // Validate the preferences structure
      if (!preferences.userId || !preferences.createdAt || !preferences.updatedAt) {
        throw new Error('Invalid preferences format');
      }
      
      // Update userId to match current user
      preferences.userId = userId;
      preferences.updatedAt = new Date().toISOString();
      
      return await this.saveUserPreferences(userId, preferences);
    } catch (error) {
      console.error('Error importing user preferences:', error);
      throw error;
    }
  }

  // Reset to default preferences
  async resetToDefaults(userId: string): Promise<UserPreferences> {
    try {
      const defaultPrefs = this.getDefaultPreferences(userId);
      return await this.saveUserPreferences(userId, defaultPrefs);
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      throw error;
    }
  }
}

export default new UserPreferencesService();
