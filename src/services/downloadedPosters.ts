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
  size?: {
    width: number;
    height: number;
  };
}

class DownloadedPostersService {
  private readonly STORAGE_KEY = 'downloaded_posters';

  // Save poster information to local storage
  async savePosterInfo(poster: Omit<DownloadedPoster, 'id' | 'downloadDate'>): Promise<DownloadedPoster> {
    try {
      const existingPosters = await this.getDownloadedPosters();
      
      const newPoster: DownloadedPoster = {
        ...poster,
        id: Date.now().toString(),
        downloadDate: new Date().toISOString(),
      };

      const updatedPosters = [...existingPosters, newPoster];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPosters));

      return newPoster;
    } catch (error) {
      console.error('Error saving poster info:', error);
      throw new Error('Failed to save poster information');
    }
  }

  // Get all downloaded posters
  async getDownloadedPosters(): Promise<DownloadedPoster[]> {
    try {
      const postersJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!postersJson) {
        return [];
      }
      return JSON.parse(postersJson);
    } catch (error) {
      console.error('Error getting downloaded posters:', error);
      return [];
    }
  }

  // Get poster by ID
  async getPosterById(id: string): Promise<DownloadedPoster | null> {
    try {
      const posters = await this.getDownloadedPosters();
      return posters.find(poster => poster.id === id) || null;
    } catch (error) {
      console.error('Error getting poster by ID:', error);
      return null;
    }
  }

  // Delete poster by ID
  async deletePoster(id: string): Promise<boolean> {
    try {
      const posters = await this.getDownloadedPosters();
      const updatedPosters = posters.filter(poster => poster.id !== id);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPosters));
      return true;
    } catch (error) {
      console.error('Error deleting poster:', error);
      return false;
    }
  }

  // Get posters by category
  async getPostersByCategory(category: string): Promise<DownloadedPoster[]> {
    try {
      const posters = await this.getDownloadedPosters();
      return posters.filter(poster => poster.category === category);
    } catch (error) {
      console.error('Error getting posters by category:', error);
      return [];
    }
  }

  // Search posters by title or description
  async searchPosters(query: string): Promise<DownloadedPoster[]> {
    try {
      const posters = await this.getDownloadedPosters();
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

  // Get recent posters (last 10)
  async getRecentPosters(limit: number = 10): Promise<DownloadedPoster[]> {
    try {
      const posters = await this.getDownloadedPosters();
      return posters
        .sort((a, b) => new Date(b.downloadDate).getTime() - new Date(a.downloadDate).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent posters:', error);
      return [];
    }
  }

  // Get poster statistics
  async getPosterStats(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    recentCount: number;
  }> {
    try {
      const posters = await this.getDownloadedPosters();
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

  // Check if poster exists in downloads
  async isPosterDownloaded(templateId: string): Promise<boolean> {
    try {
      const posters = await this.getDownloadedPosters();
      return posters.some(poster => poster.templateId === templateId);
    } catch (error) {
      console.error('Error checking if poster is downloaded:', error);
      return false;
    }
  }

  // Clear all downloaded poster data
  async clearAllPosters(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing all posters:', error);
      return false;
    }
  }
}

export default new DownloadedPostersService();
