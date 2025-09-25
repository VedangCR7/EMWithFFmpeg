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
  private readonly STORAGE_KEY = 'user_preferences';

  // Get user preferences
  async getUserPreferences(userId?: string): Promise<UserPreferences | null> {
    try {
      const allPreferences = await this.getAllPreferences();
      
      if (userId) {
        const userPrefs = allPreferences.find(prefs => prefs.userId === userId);
        if (userPrefs) {
          console.log('✅ Found user preferences for user:', userId);
          return userPrefs;
        }
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
      const allPreferences = await this.getAllPreferences();
      
      // Check if user preferences exist
      const existingIndex = allPreferences.findIndex(prefs => prefs.userId === userId);
      
      const now = new Date().toISOString();
      
      if (existingIndex >= 0) {
        // Update existing preferences
        const updatedPreferences: UserPreferences = {
          ...allPreferences[existingIndex],
          ...preferences,
          updatedAt: now,
        };
        
        allPreferences[existingIndex] = updatedPreferences;
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(allPreferences));
        
        console.log('✅ Updated user preferences for user:', userId);
        return updatedPreferences;
      } else {
        // Create new preferences
        const newPreferences: UserPreferences = {
          ...this.getDefaultPreferences(userId),
          ...preferences,
          userId,
          createdAt: now,
          updatedAt: now,
        };
        
        const updatedPreferences = [...allPreferences, newPreferences];
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPreferences));
        
        console.log('✅ Created new user preferences for user:', userId);
        return newPreferences;
      }
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

  // Get all preferences (internal method)
  private async getAllPreferences(): Promise<UserPreferences[]> {
    try {
      const preferencesJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!preferencesJson) {
        return [];
      }
      return JSON.parse(preferencesJson);
    } catch (error) {
      console.error('Error getting all preferences:', error);
      return [];
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
      const allPreferences = await this.getAllPreferences();
      const filteredPreferences = allPreferences.filter(prefs => prefs.userId !== userId);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredPreferences));
      console.log('✅ Cleared preferences for user:', userId);
      return true;
    } catch (error) {
      console.error('Error clearing user preferences:', error);
      return false;
    }
  }

  // Get preference statistics
  async getPreferenceStats(): Promise<{
    totalUsers: number;
    notificationsEnabled: number;
    darkModeEnabled: number;
    gridViewUsers: number;
    listViewUsers: number;
  }> {
    try {
      const allPreferences = await this.getAllPreferences();
      
      const stats = {
        totalUsers: allPreferences.length,
        notificationsEnabled: allPreferences.filter(p => p.notificationsEnabled).length,
        darkModeEnabled: allPreferences.filter(p => p.darkModeEnabled).length,
        gridViewUsers: allPreferences.filter(p => p.defaultViewMode === 'grid').length,
        listViewUsers: allPreferences.filter(p => p.defaultViewMode === 'list').length,
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting preference stats:', error);
      return {
        totalUsers: 0,
        notificationsEnabled: 0,
        darkModeEnabled: 0,
        gridViewUsers: 0,
        listViewUsers: 0,
      };
    }
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
