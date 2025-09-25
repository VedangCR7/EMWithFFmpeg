import api from './api';

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

export interface UserStats {
  businessProfiles: {
    total: number;
    recentCount: number;
  };
  likes: {
    total: number;
    recentCount: number;
    byType: {
      template: number;
      video: number;
      greeting: number;
      businessProfile: number;
    };
  };
  downloads: {
    total: number;
    recentCount: number;
  };
}

class UserProfileService {
  // Get user preferences from backend
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      console.log('🔍 Fetching user preferences from backend for user:', userId);
      const response = await api.get(`/api/mobile/users/${userId}/preferences`);
      
      if (response.data.success) {
        console.log('✅ User preferences fetched from backend');
        return response.data.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching user preferences from backend:', error);
      console.log('⚠️ Returning default preferences due to API error');
      
      // Return default preferences
      return {
        userId,
        notificationsEnabled: true,
        darkModeEnabled: false,
        defaultViewMode: 'grid',
        preferredCategories: [],
        language: 'en',
        autoSave: true,
        highQualityDownloads: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Update user preferences in backend
  async updateUserPreferences(userId: string, preferences: PreferenceUpdate): Promise<UserPreferences> {
    try {
      console.log('🔍 Updating user preferences in backend for user:', userId);
      const response = await api.put(`/api/mobile/users/${userId}/preferences`, preferences);
      
      if (response.data.success) {
        console.log('✅ User preferences updated in backend');
        return response.data.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error updating user preferences in backend:', error);
      throw error;
    }
  }

  // Update specific preference
  async updatePreference(userId: string, key: keyof PreferenceUpdate, value: any): Promise<UserPreferences> {
    try {
      const update: PreferenceUpdate = { [key]: value };
      return await this.updateUserPreferences(userId, update);
    } catch (error) {
      console.error('❌ Error updating specific preference:', error);
      throw error;
    }
  }

  // Get user statistics from backend
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      console.log('🔍 Fetching user stats from backend for user:', userId);
      const response = await api.get(`/api/mobile/users/${userId}/stats`);
      
      if (response.data.success) {
        console.log('✅ User stats fetched from backend');
        return response.data.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching user stats from backend:', error);
      console.log('⚠️ Returning default stats due to API error');
      
      // Return default stats
      return {
        businessProfiles: {
          total: 0,
          recentCount: 0
        },
        likes: {
          total: 0,
          recentCount: 0,
          byType: {
            template: 0,
            video: 0,
            greeting: 0,
            businessProfile: 0
          }
        },
        downloads: {
          total: 0,
          recentCount: 0
        }
      };
    }
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

  // Get like stats
  async getLikeStats(userId: string): Promise<{
    total: number;
    recentCount: number;
    byType: {
      template: number;
      video: number;
      poster: number;
      businessProfile: number;
    };
  }> {
    try {
      const stats = await this.getUserStats(userId);
      return {
        total: stats.likes.total,
        recentCount: stats.likes.recentCount,
        byType: {
          template: stats.likes.byType.template,
          video: stats.likes.byType.video,
          poster: stats.likes.byType.greeting, // Map greeting to poster for compatibility
          businessProfile: stats.likes.byType.businessProfile
        }
      };
    } catch (error) {
      console.error('❌ Error getting like stats:', error);
      return {
        total: 0,
        recentCount: 0,
        byType: {
          template: 0,
          video: 0,
          poster: 0,
          businessProfile: 0
        }
      };
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
