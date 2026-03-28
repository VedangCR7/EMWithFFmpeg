import api from './api';

export interface UserPreferences {
  userId: string;
  notificationsEnabled: boolean;
  // darkModeEnabled: boolean; // REMOVED - Dark mode is now device-specific and stored locally
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
  // darkModeEnabled?: boolean; // REMOVED - Dark mode is now device-specific and stored locally
  defaultViewMode?: 'grid' | 'list';
  preferredCategories?: string[];
  language?: string;
  autoSave?: boolean;
  highQualityDownloads?: boolean;
}

export interface UserStats {
  businessProfiles: {
    total: number;
    recentCount: number;
  };
  downloads: {
    total: number;
    recentCount: number;
  };
}

class UserProfileService {
  // Update user preferences (API endpoint removed - not functional)
  async updateUserPreferences(userId: string, preferences: PreferenceUpdate): Promise<UserPreferences> {
    console.log('⚠️ updateUserPreferences - API endpoint removed');
    console.log('⚠️ User preferences should be stored locally (AsyncStorage)');
    throw new Error('User preferences API endpoint has been removed. Use local storage instead.');
  }

  // Update specific preference (API endpoint removed - not functional)
  async updatePreference(userId: string, key: keyof PreferenceUpdate, value: any): Promise<UserPreferences> {
    console.log('⚠️ updatePreference - API endpoint removed');
    throw new Error('User preferences API endpoint has been removed. Use local storage instead.');
  }

  // Get user statistics (API endpoint removed - returns defaults)
  async getUserStats(userId: string): Promise<UserStats> {
    console.log('⚠️ getUserStats - API endpoint removed, returning default values');
    
    // Return default stats
    return {
      businessProfiles: {
        total: 0,
        recentCount: 0
      },
      downloads: {
        total: 0,
        recentCount: 0
      }
    };
  }

  // Get business profile stats
  async getBusinessProfileStats(userId: string): Promise<{ total: number; recentCount: number }> {
    try {
      const stats = await this.getUserStats(userId);
      return stats.businessProfiles;
    } catch (error) {
      console.error('❌ Error getting business profile stats:', error);
      return { total: 0, recentCount: 0 };
    }
  }

  // Get download stats
  async getDownloadStats(userId: string): Promise<{ total: number; recentCount: number }> {
    try {
      const stats = await this.getUserStats(userId);
      return stats.downloads;
    } catch (error) {
      console.error('❌ Error getting download stats:', error);
      return { total: 0, recentCount: 0 };
    }
  }
}

export default new UserProfileService();
