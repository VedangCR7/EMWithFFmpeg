import api from './api';

export interface BackendLike {
  id: string;
  mobileUserId: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
}

export interface BackendLikeResponse {
  success: boolean;
  data: {
    likes: BackendLike[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

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

class UserLikesBackendService {
  // Get user's likes from backend
  async getUserLikes(userId: string): Promise<UserLike[]> {
    try {
      console.log('🔍 Fetching user likes from backend for user:', userId);
      const response = await api.get(`/api/mobile/users/${userId}/likes`);
      
      if (response.data.success) {
        const backendLikes = response.data.data.likes;
        
        // Map backend likes to frontend format
        const mappedLikes = backendLikes.map((like: BackendLike) => ({
          id: like.id,
          contentId: like.resourceId,
          contentType: this.mapResourceTypeToContentType(like.resourceType),
          userId: like.mobileUserId,
          createdAt: like.createdAt
        }));

        console.log('✅ Retrieved likes from backend for user:', userId, 'Count:', mappedLikes.length);
        return mappedLikes;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching user likes from backend:', error);
      return [];
    }
  }

  // Get likes by content type from backend
  async getLikesByType(contentType: 'template' | 'video' | 'poster' | 'business-profile', userId: string): Promise<UserLike[]> {
    try {
      const allLikes = await this.getUserLikes(userId);
      return allLikes.filter(like => like.contentType === contentType);
    } catch (error) {
      console.error('❌ Error getting likes by type:', error);
      return [];
    }
  }

  // Get like statistics from backend
  async getLikeStats(userId: string): Promise<LikeStats> {
    try {
      console.log('🔍 Fetching like stats from backend for user:', userId);
      const response = await api.get(`/api/mobile/users/${userId}/stats`);
      
      if (response.data.success) {
        const backendStats = response.data.data.likes;
        
        return {
          total: backendStats.total,
          recentCount: backendStats.recentCount,
          byType: {
            template: backendStats.byType.template,
            video: backendStats.byType.video,
            poster: backendStats.byType.greeting, // Map greeting to poster for compatibility
            businessProfile: backendStats.byType.businessProfile
          }
        };
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching like stats from backend:', error);
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

  // Check if content is liked by user (from backend)
  async isContentLiked(contentId: string, contentType: 'template' | 'video' | 'poster' | 'business-profile', userId: string): Promise<boolean> {
    try {
      const userLikes = await this.getUserLikes(userId);
      return userLikes.some(like => 
        like.contentId === contentId && like.contentType === contentType
      );
    } catch (error) {
      console.error('❌ Error checking like status:', error);
      return false;
    }
  }

  // Get liked content IDs for specific content type
  async getLikedContentIds(contentType: 'template' | 'video' | 'poster' | 'business-profile', userId: string): Promise<string[]> {
    try {
      const likesByType = await this.getLikesByType(contentType, userId);
      return likesByType.map(like => like.contentId);
    } catch (error) {
      console.error('❌ Error getting liked content IDs:', error);
      return [];
    }
  }

  // Apply like status to content array
  async applyLikeStatusToContent<T extends { id: string }>(
    content: T[], 
    contentType: 'template' | 'video' | 'poster' | 'business-profile', 
    userId: string
  ): Promise<(T & { isLiked: boolean })[]> {
    try {
      const likedContentIds = await this.getLikedContentIds(contentType, userId);
      
      return content.map(item => ({
        ...item,
        isLiked: likedContentIds.includes(item.id)
      }));
    } catch (error) {
      console.error('❌ Error applying like status to content:', error);
      return content.map(item => ({ ...item, isLiked: false }));
    }
  }

  // Map backend resource type to frontend content type
  private mapResourceTypeToContentType(resourceType: string): 'template' | 'video' | 'poster' | 'business-profile' {
    switch (resourceType.toUpperCase()) {
      case 'TEMPLATE':
        return 'template';
      case 'VIDEO':
        return 'video';
      case 'GREETING':
        return 'poster'; // Map greeting to poster for compatibility
      case 'BUSINESS_PROFILE':
        return 'business-profile';
      default:
        return 'template';
    }
  }

  // Get recent likes
  async getRecentLikes(limit: number = 10, userId: string): Promise<UserLike[]> {
    try {
      const userLikes = await this.getUserLikes(userId);
      return userLikes.slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting recent likes:', error);
      return [];
    }
  }
}

export default new UserLikesBackendService();
