import { 
  getBusinessCategories, 
  getCustomerContent, 
  getCustomerProfile,
  checkAPIHealth 
} from './eventMarketersApi';
import { 
  BusinessCategory, 
  CustomerContent, 
  Pagination,
  buildQueryString 
} from '../constants/api';
import userService from './userService';

class ContentService {
  private static instance: ContentService;
  private userCachedCategories: Map<string, { data: BusinessCategory[], timestamp: number }> = new Map();
  private categoriesCacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await checkAPIHealth();
      return response.status === 'healthy';
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  /**
   * Get business categories with caching
   */
  async getBusinessCategories(forceRefresh: boolean = false, userId?: string): Promise<BusinessCategory[]> {
    try {
      const now = Date.now();
      const cacheKey = userId || 'anonymous';
      
      // Return cached categories if not expired and not forcing refresh
      if (!forceRefresh && this.userCachedCategories.has(cacheKey)) {
        const cached = this.userCachedCategories.get(cacheKey)!;
        if ((now - cached.timestamp) < this.categoriesCacheTimeout) {
          console.log('✅ Using cached categories for user:', cacheKey);
          return cached.data;
        }
      }

      const response = await getBusinessCategories();
      
      if (response.success && response.categories) {
        // Cache categories for this user
        this.userCachedCategories.set(cacheKey, {
          data: response.categories,
          timestamp: now,
        });
        console.log('✅ Cached categories for user:', cacheKey);
        return response.categories;
      } else {
        throw new Error(response.error || 'Failed to fetch categories');
      }
    } catch (error) {
      console.log('Using mock business categories due to API error:', error);
      
      // Return cached categories if available, even if expired
      const cacheKey = userId || 'anonymous';
      if (this.userCachedCategories.has(cacheKey)) {
        return this.userCachedCategories.get(cacheKey)!.data;
      }
      
      return this.getMockBusinessCategories();
    }
  }

  /**
   * Get content for a specific customer
   */
  async getCustomerContent(customerId: string, options?: {
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    content: CustomerContent;
    pagination: Pagination;
  }> {
    try {
      const response = await getCustomerContent(customerId, options);
      
      if (response.success && response.content) {
        return {
          content: response.content,
          pagination: response.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        };
      } else {
        throw new Error(response.error || 'Failed to fetch content');
      }
    } catch (error) {
      console.error('Failed to get customer content:', error);
      throw error;
    }
  }

  /**
   * Get customer profile
   */
  async getCustomerProfile(customerId: string) {
    try {
      const response = await getCustomerProfile(customerId);
      
      if (response.success && response.customer) {
        return response.customer;
      } else {
        throw new Error(response.error || 'Failed to fetch customer profile');
      }
    } catch (error) {
      console.error('Failed to get customer profile:', error);
      throw error;
    }
  }

  /**
   * Get content by category
   */
  async getContentByCategory(customerId: string, category: string, page: number = 1, limit: number = 20) {
    return this.getCustomerContent(customerId, {
      category,
      page,
      limit,
    });
  }

  /**
   * Search content
   */
  async searchContent(customerId: string, query: string, page: number = 1, limit: number = 20) {
    // Note: This would need to be implemented in the backend
    // For now, we'll get all content and filter client-side
    try {
      const response = await this.getCustomerContent(customerId, { page, limit });
      
      // Client-side filtering (not ideal, but works for now)
      const filteredContent = {
        images: response.content.images.filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        ),
        videos: response.content.videos.filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        ),
      };

      return {
        content: filteredContent,
        pagination: response.pagination,
      };
    } catch (error) {
      console.error('Failed to search content:', error);
      throw error;
    }
  }

  /**
   * Get featured content (most viewed/downloaded)
   */
  async getFeaturedContent(customerId: string, limit: number = 10) {
    try {
      const response = await this.getCustomerContent(customerId, { limit });
      
      // Sort by views and downloads
      const featuredContent = {
        images: response.content.images
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, limit),
        videos: response.content.videos
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, limit),
      };

      return featuredContent;
    } catch (error) {
      console.error('Failed to get featured content:', error);
      throw error;
    }
  }

  /**
   * Get recent content
   */
  async getRecentContent(customerId: string, limit: number = 10) {
    try {
      const response = await this.getCustomerContent(customerId, { limit });
      
      // Sort by creation date (assuming newer content comes first)
      const recentContent = {
        images: response.content.images.slice(0, limit),
        videos: response.content.videos.slice(0, limit),
      };

      return recentContent;
    } catch (error) {
      console.error('Failed to get recent content:', error);
      throw error;
    }
  }

  /**
   * Track content view
   */
  async trackContentView(contentId: string, contentType: 'image' | 'video', category?: string) {
    try {
      await userService.trackContentView(contentId, contentType, {
        category,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track content view:', error);
    }
  }

  /**
   * Track content download
   */
  async trackContentDownload(contentId: string, contentType: 'image' | 'video', category?: string) {
    try {
      await userService.trackContentDownload(contentId, contentType, {
        category,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track content download:', error);
    }
  }

  /**
   * Get content statistics
   */
  async getContentStats(customerId: string) {
    try {
      const response = await this.getCustomerContent(customerId, { limit: 1000 }); // Get all content
      
      const stats = {
        totalImages: response.content.images.length,
        totalVideos: response.content.videos.length,
        totalViews: response.content.images.reduce((sum, item) => sum + (item.views || 0), 0) +
                   response.content.videos.reduce((sum, item) => sum + (item.views || 0), 0),
        totalDownloads: response.content.images.reduce((sum, item) => sum + (item.downloads || 0), 0) +
                       response.content.videos.reduce((sum, item) => sum + (item.downloads || 0), 0),
        categories: {} as Record<string, number>,
      };

      // Count content by category
      [...response.content.images, ...response.content.videos].forEach(item => {
        stats.categories[item.category] = (stats.categories[item.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get content stats:', error);
      throw error;
    }
  }

  /**
   * Get cached categories for specific user
   */
  getCachedCategories(userId?: string): BusinessCategory[] | null {
    const cacheKey = userId || 'anonymous';
    const cached = this.userCachedCategories.get(cacheKey);
    return cached ? cached.data : null;
  }

  /**
   * Clear cache for specific user
   */
  clearUserCache(userId?: string): void {
    if (userId) {
      this.userCachedCategories.delete(userId);
      console.log('✅ Cleared cache for user:', userId);
    } else {
      this.userCachedCategories.clear();
      console.log('✅ Cleared all user cache');
    }
  }

  // ============================================================================
  // MOCK DATA METHODS (FALLBACK WHEN SERVER IS NOT AVAILABLE)
  // ============================================================================

  private getMockBusinessCategories(): BusinessCategory[] {
    return [
      {
        id: 'cat-1',
        name: 'Business',
        description: 'Professional business templates and content',
        icon: 'business',
        color: '#2196F3',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cat-2',
        name: 'Festival',
        description: 'Festival and celebration templates',
        icon: 'celebration',
        color: '#FF9800',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cat-3',
        name: 'Marketing',
        description: 'Marketing and promotional content',
        icon: 'campaign',
        color: '#4CAF50',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cat-4',
        name: 'Events',
        description: 'Event planning and management templates',
        icon: 'event',
        color: '#9C27B0',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cat-5',
        name: 'Social Media',
        description: 'Social media posts and stories',
        icon: 'share',
        color: '#E91E63',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}

// Export singleton instance
const contentService = ContentService.getInstance();
export default contentService;

