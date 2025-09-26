import api from './api';

export interface LikeRequest {
  resourceType: 'TEMPLATE' | 'VIDEO' | 'POSTER' | 'GREETING' | 'CONTENT';
  resourceId: string;
}

export interface LikeResponse {
  success: boolean;
  message: string;
  data: {
    like?: any;
    isLiked: boolean;
  };
}

export interface UserLikesResponse {
  success: boolean;
  message: string;
  data: {
    likes: Array<{
      id: string;
      mobileUserId: string;
      resourceType: string;
      resourceId: string;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface LikeStatusResponse {
  success: boolean;
  message: string;
  data: {
    isLiked: boolean;
  };
}

class GenericLikesApiService {
  /**
   * Like any resource
   */
  async likeResource(resourceType: 'TEMPLATE' | 'VIDEO' | 'POSTER' | 'GREETING' | 'CONTENT', resourceId: string): Promise<LikeResponse> {
    try {
      console.log('🔍 Liking resource:', { resourceType, resourceId });
      
      const response = await api.post('/api/mobile/likes', {
        resourceType,
        resourceId
      });
      
      console.log('✅ Like response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error liking resource:', error);
      throw error;
    }
  }

  /**
   * Unlike any resource
   */
  async unlikeResource(resourceType: 'TEMPLATE' | 'VIDEO' | 'POSTER' | 'GREETING' | 'CONTENT', resourceId: string): Promise<LikeResponse> {
    try {
      console.log('🔍 Unliking resource:', { resourceType, resourceId });
      
      const response = await api.delete('/api/mobile/likes', {
        data: {
          resourceType,
          resourceId
        }
      });
      
      console.log('✅ Unlike response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error unliking resource:', error);
      throw error;
    }
  }

  /**
   * Get user's likes by type
   */
  async getUserLikes(userId: string, resourceType?: string, page: number = 1, limit: number = 20): Promise<UserLikesResponse> {
    try {
      console.log('🔍 Getting user likes:', { userId, resourceType, page, limit });
      
      const params = new URLSearchParams();
      if (resourceType) params.append('resourceType', resourceType);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await api.get(`/api/mobile/likes/user/${userId}?${params.toString()}`);
      
      console.log('✅ User likes response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting user likes:', error);
      throw error;
    }
  }

  /**
   * Check if a resource is liked by current user
   */
  async checkLikeStatus(resourceType: string, resourceId: string): Promise<LikeStatusResponse> {
    try {
      console.log('🔍 Checking like status:', { resourceType, resourceId });
      
      const response = await api.get('/api/mobile/likes/check', {
        params: {
          resourceType,
          resourceId
        }
      });
      
      console.log('✅ Like status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error checking like status:', error);
      throw error;
    }
  }

  /**
   * Toggle like status for any resource
   */
  async toggleLike(resourceType: 'TEMPLATE' | 'VIDEO' | 'POSTER' | 'GREETING' | 'CONTENT', resourceId: string): Promise<boolean> {
    try {
      // First check if already liked
      const statusResponse = await this.checkLikeStatus(resourceType, resourceId);
      
      if (statusResponse.data.isLiked) {
        // Unlike the resource
        await this.unlikeResource(resourceType, resourceId);
        return false;
      } else {
        // Like the resource
        await this.likeResource(resourceType, resourceId);
        return true;
      }
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      throw error;
    }
  }
}

export default new GenericLikesApiService();
