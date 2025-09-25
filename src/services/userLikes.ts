import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLike {
  id: string;
  contentId: string;
  contentType: 'template' | 'video' | 'poster' | 'business-profile';
  userId: string;
  createdAt: string;
}

export interface LikeStats {
  total: number;
  byType: {
    template: number;
    video: number;
    poster: number;
    businessProfile: number;
  };
  recentCount: number;
}

class UserLikesService {
  private readonly STORAGE_KEY = 'user_likes';

  // Like content for specific user
  async likeContent(contentId: string, contentType: 'template' | 'video' | 'poster' | 'business-profile', userId?: string): Promise<boolean> {
    try {
      const allLikes = await this.getAllLikes();
      
      // Check if already liked
      const existingLike = allLikes.find(like => 
        like.contentId === contentId && 
        like.contentType === contentType && 
        like.userId === userId
      );
      
      if (existingLike) {
        console.log('⚠️ Content already liked by user:', userId);
        return false;
      }
      
      // Add new like
      const newLike: UserLike = {
        id: Date.now().toString(),
        contentId,
        contentType,
        userId: userId || 'anonymous',
        createdAt: new Date().toISOString(),
      };
      
      const updatedLikes = [...allLikes, newLike];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedLikes));
      
      console.log('✅ Content liked by user:', userId, 'Content:', contentId);
      return true;
    } catch (error) {
      console.error('Error liking content:', error);
      return false;
    }
  }

  // Unlike content for specific user
  async unlikeContent(contentId: string, contentType: 'template' | 'video' | 'poster' | 'business-profile', userId?: string): Promise<boolean> {
    try {
      const allLikes = await this.getAllLikes();
      
      // Remove the like
      const updatedLikes = allLikes.filter(like => 
        !(like.contentId === contentId && 
          like.contentType === contentType && 
          like.userId === userId)
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedLikes));
      
      console.log('✅ Content unliked by user:', userId, 'Content:', contentId);
      return true;
    } catch (error) {
      console.error('Error unliking content:', error);
      return false;
    }
  }

  // Toggle like status for specific user
  async toggleLike(contentId: string, contentType: 'template' | 'video' | 'poster' | 'business-profile', userId?: string): Promise<boolean> {
    try {
      const isLiked = await this.isContentLiked(contentId, contentType, userId);
      
      if (isLiked) {
        return await this.unlikeContent(contentId, contentType, userId);
      } else {
        return await this.likeContent(contentId, contentType, userId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      return false;
    }
  }

  // Check if content is liked by specific user
  async isContentLiked(contentId: string, contentType: 'template' | 'video' | 'poster' | 'business-profile', userId?: string): Promise<boolean> {
    try {
      const userLikes = await this.getUserLikes(userId);
      return userLikes.some(like => 
        like.contentId === contentId && like.contentType === contentType
      );
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  }

  // Get all likes (internal method - no filtering)
  private async getAllLikes(): Promise<UserLike[]> {
    try {
      const likesJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!likesJson) {
        return [];
      }
      return JSON.parse(likesJson);
    } catch (error) {
      console.error('Error getting all likes:', error);
      return [];
    }
  }

  // Get likes for specific user
  async getUserLikes(userId?: string): Promise<UserLike[]> {
    try {
      const allLikes = await this.getAllLikes();
      
      // Filter by user ID if provided
      const userLikes = userId 
        ? allLikes.filter(like => like.userId === userId)
        : allLikes.filter(like => !like.userId || like.userId === 'anonymous');
      
      // Sort by creation date (newest first)
      return userLikes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting user likes:', error);
      return [];
    }
  }

  // Get likes by content type for specific user
  async getLikesByType(contentType: 'template' | 'video' | 'poster' | 'business-profile', userId?: string): Promise<UserLike[]> {
    try {
      const userLikes = await this.getUserLikes(userId);
      return userLikes.filter(like => like.contentType === contentType);
    } catch (error) {
      console.error('Error getting likes by type:', error);
      return [];
    }
  }

  // Get recent likes for specific user
  async getRecentLikes(limit: number = 10, userId?: string): Promise<UserLike[]> {
    try {
      const userLikes = await this.getUserLikes(userId);
      return userLikes.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent likes:', error);
      return [];
    }
  }

  // Get like statistics for specific user
  async getLikeStats(userId?: string): Promise<LikeStats> {
    try {
      const userLikes = await this.getUserLikes(userId);
      
      const byType = {
        template: 0,
        video: 0,
        poster: 0,
        businessProfile: 0,
      };
      
      userLikes.forEach(like => {
        switch (like.contentType) {
          case 'template':
            byType.template++;
            break;
          case 'video':
            byType.video++;
            break;
          case 'poster':
            byType.poster++;
            break;
          case 'business-profile':
            byType.businessProfile++;
            break;
        }
      });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentCount = userLikes.filter(like => 
        new Date(like.createdAt) > oneWeekAgo
      ).length;

      return {
        total: userLikes.length,
        byType,
        recentCount,
      };
    } catch (error) {
      console.error('Error getting like stats:', error);
      return {
        total: 0,
        byType: { template: 0, video: 0, poster: 0, businessProfile: 0 },
        recentCount: 0,
      };
    }
  }

  // Clear all likes for specific user
  async clearAllLikes(userId?: string): Promise<boolean> {
    try {
      if (userId) {
        // Clear only user-specific likes
        const allLikes = await this.getAllLikes();
        const otherUsersLikes = allLikes.filter(like => like.userId !== userId);
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(otherUsersLikes));
        console.log('✅ Cleared all likes for user:', userId);
      } else {
        // Clear all likes (for anonymous users)
        const allLikes = await this.getAllLikes();
        const nonAnonymousLikes = allLikes.filter(like => like.userId && like.userId !== 'anonymous');
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(nonAnonymousLikes));
        console.log('✅ Cleared all anonymous likes');
      }
      return true;
    } catch (error) {
      console.error('Error clearing all likes:', error);
      return false;
    }
  }

  // Get liked content IDs for specific user and content type
  async getLikedContentIds(contentType: 'template' | 'video' | 'poster' | 'business-profile', userId?: string): Promise<string[]> {
    try {
      const likesByType = await this.getLikesByType(contentType, userId);
      return likesByType.map(like => like.contentId);
    } catch (error) {
      console.error('Error getting liked content IDs:', error);
      return [];
    }
  }

  // Apply like status to content array
  async applyLikeStatusToContent<T extends { id: string }>(
    content: T[], 
    contentType: 'template' | 'video' | 'poster' | 'business-profile', 
    userId?: string
  ): Promise<(T & { isLiked: boolean })[]> {
    try {
      const likedContentIds = await this.getLikedContentIds(contentType, userId);
      
      return content.map(item => ({
        ...item,
        isLiked: likedContentIds.includes(item.id)
      }));
    } catch (error) {
      console.error('Error applying like status to content:', error);
      return content.map(item => ({ ...item, isLiked: false }));
    }
  }
}

export default new UserLikesService();
