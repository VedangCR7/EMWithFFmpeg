import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

export interface DownloadedPoster {
  id: string;
  title: string;
  description?: string;
  imageUri: string;
  thumbnailUri?: string;
  downloadDate: string;
  templateId?: string;
  category?: string;
  tags?: string[];
  userId?: string; // Add user ID to make downloads user-specific
  size?: {
    width: number;
    height: number;
  };
}

class DownloadedPostersService {
  private readonly STORAGE_KEY = 'downloaded_posters';

  // Save poster information to local storage with user ID
  async savePosterInfo(poster: Omit<DownloadedPoster, 'id' | 'downloadDate' | 'userId'>, userId?: string): Promise<DownloadedPoster> {
    try {
      const existingPosters = await this.getAllDownloadedPosters();
      
      const newPoster: DownloadedPoster = {
        ...poster,
        id: Date.now().toString(),
        downloadDate: new Date().toISOString(),
        userId: userId || 'anonymous', // Add user ID
      };

      const updatedPosters = [...existingPosters, newPoster];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPosters));

      console.log('✅ Downloaded poster saved for user:', userId);
      return newPoster;
    } catch (error) {
      console.error('Error saving poster info:', error);
      throw new Error('Failed to save poster information');
    }
  }

  // Get all downloaded posters (internal method - no filtering)
  private async getAllDownloadedPosters(): Promise<DownloadedPoster[]> {
    try {
      const postersJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!postersJson) {
        return [];
      }
      return JSON.parse(postersJson);
    } catch (error) {
      console.error('Error getting all downloaded posters:', error);
      return [];
    }
  }

  // Get downloaded posters for specific user
  async getDownloadedPosters(userId?: string): Promise<DownloadedPoster[]> {
    try {
      const allPosters = await this.getAllDownloadedPosters();
      
      // Filter by user ID if provided
      const userPosters = userId 
        ? allPosters.filter(poster => poster.userId === userId)
        : allPosters.filter(poster => !poster.userId || poster.userId === 'anonymous');
      
      // Sort by download date (newest first)
      return userPosters.sort((a, b) => new Date(b.downloadDate).getTime() - new Date(a.downloadDate).getTime());
    } catch (error) {
      console.error('Error getting downloaded posters for user:', error);
      return [];
    }
  }

  // Get poster by ID for specific user
  async getPosterById(id: string, userId?: string): Promise<DownloadedPoster | null> {
    try {
      const posters = await this.getDownloadedPosters(userId);
      return posters.find(poster => poster.id === id) || null;
    } catch (error) {
      console.error('Error getting poster by ID:', error);
      return null;
    }
  }

  // Delete poster by ID for specific user
  async deletePoster(id: string, userId?: string): Promise<boolean> {
    try {
      const allPosters = await this.getAllDownloadedPosters();
      
      // Remove only the poster that belongs to the current user
      const updatedPosters = allPosters.filter(poster => 
        !(poster.id === id && poster.userId === userId)
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPosters));
      console.log('✅ Poster deleted for user:', userId);
      return true;
    } catch (error) {
      console.error('Error deleting poster:', error);
      return false;
    }
  }

  // Get posters by category for specific user
  async getPostersByCategory(category: string, userId?: string): Promise<DownloadedPoster[]> {
    try {
      const posters = await this.getDownloadedPosters(userId);
      return posters.filter(poster => poster.category === category);
    } catch (error) {
      console.error('Error getting posters by category:', error);
      return [];
    }
  }

  // Search posters by title or description for specific user
  async searchPosters(query: string, userId?: string): Promise<DownloadedPoster[]> {
    try {
      const posters = await this.getDownloadedPosters(userId);
      const lowercaseQuery = query.toLowerCase();
      
      return posters.filter(poster => 
        poster.title.toLowerCase().includes(lowercaseQuery) ||
        (poster.description && poster.description.toLowerCase().includes(lowercaseQuery)) ||
        (poster.tags && poster.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
      );
    } catch (error) {
      console.error('Error searching posters:', error);
      return [];
    }
  }

  // Get recent posters (last 10) for specific user
  async getRecentPosters(limit: number = 10, userId?: string): Promise<DownloadedPoster[]> {
    try {
      const posters = await this.getDownloadedPosters(userId);
      return posters
        .sort((a, b) => new Date(b.downloadDate).getTime() - new Date(a.downloadDate).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent posters:', error);
      return [];
    }
  }

  // Get poster statistics for specific user
  async getPosterStats(userId?: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    recentCount: number;
  }> {
    try {
      const posters = await this.getDownloadedPosters(userId);
      const byCategory: Record<string, number> = {};
      
      posters.forEach(poster => {
        const category = poster.category || 'Uncategorized';
        byCategory[category] = (byCategory[category] || 0) + 1;
      });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentCount = posters.filter(poster => 
        new Date(poster.downloadDate) > oneWeekAgo
      ).length;

      return {
        total: posters.length,
        byCategory,
        recentCount,
      };
    } catch (error) {
      console.error('Error getting poster stats:', error);
      return {
        total: 0,
        byCategory: {},
        recentCount: 0,
      };
    }
  }

  // Check if poster exists in downloads for specific user
  async isPosterDownloaded(templateId: string, userId?: string): Promise<boolean> {
    try {
      const posters = await this.getDownloadedPosters(userId);
      return posters.some(poster => poster.templateId === templateId);
    } catch (error) {
      console.error('Error checking if poster is downloaded:', error);
      return false;
    }
  }

  // Clear all downloaded poster data for specific user
  async clearAllPosters(userId?: string): Promise<boolean> {
    try {
      if (userId) {
        // Clear only user-specific posters
        const allPosters = await this.getAllDownloadedPosters();
        const otherUsersPosters = allPosters.filter(poster => poster.userId !== userId);
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(otherUsersPosters));
        console.log('✅ Cleared all posters for user:', userId);
      } else {
        // Clear all posters (for anonymous users)
        const allPosters = await this.getAllDownloadedPosters();
        const nonAnonymousPosters = allPosters.filter(poster => poster.userId && poster.userId !== 'anonymous');
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(nonAnonymousPosters));
        console.log('✅ Cleared all anonymous posters');
      }
      return true;
    } catch (error) {
      console.error('Error clearing all posters:', error);
      return false;
    }
  }
}

export default new DownloadedPostersService();
