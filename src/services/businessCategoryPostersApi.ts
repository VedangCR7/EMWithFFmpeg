import api from './api';
import authService from './auth';

export interface BusinessCategoryPoster {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  imageUrl: string;
  downloadUrl: string;
  likes: number;
  downloads: number;
  isPremium: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCategoryPostersResponse {
  success: boolean;
  data: {
    posters: BusinessCategoryPoster[];
    category: string;
    total: number;
  };
  message: string;
}

class BusinessCategoryPostersApiService {
  private postersCache: Map<string, { data: BusinessCategoryPoster[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get posters for a specific business category
   */
  async getPostersByCategory(category: string): Promise<BusinessCategoryPostersResponse> {
    try {
      const cacheKey = `category_${category}`;
      const now = Date.now();
      
      // Check cache first
      if (this.postersCache.has(cacheKey)) {
        const cached = this.postersCache.get(cacheKey)!;
        if ((now - cached.timestamp) < this.CACHE_DURATION) {
          console.log('✅ Using cached posters for category:', category);
          return {
            success: true,
            data: {
              posters: cached.data,
              category,
              total: cached.data.length
            },
            message: 'Posters fetched from cache'
          };
        }
      }

      console.log('🔍 Fetching posters for business category:', category);
      const response = await api.get(`/api/mobile/posters/category/${encodeURIComponent(category)}`);
      
      if (response.data.success) {
        const posters = response.data.data.posters;
        
        // Cache the results
        this.postersCache.set(cacheKey, {
          data: posters,
          timestamp: now
        });
        
        console.log('✅ Fetched posters for category:', category, 'Count:', posters.length);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch posters');
      }
    } catch (error: any) {
      console.error('❌ Error fetching posters by category:', error);
      
      // Return mock data for common business categories
      const mockPosters = this.getMockPostersByCategory(category);
      return {
        success: true,
        data: {
          posters: mockPosters,
          category,
          total: mockPosters.length
        },
        message: 'Using mock data due to API error'
      };
    }
  }

  /**
   * Get user's business category and fetch relevant posters
   */
  async getUserCategoryPosters(): Promise<BusinessCategoryPostersResponse> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        console.log('⚠️ No user ID available, returning general posters');
        return this.getPostersByCategory('General');
      }

      // Get user's business profiles to determine category
      const businessProfileService = (await import('./businessProfile')).default;
      const userProfiles = await businessProfileService.getUserBusinessProfiles(userId);
      
      if (userProfiles.length > 0) {
        const primaryCategory = userProfiles[0].category;
        console.log('🎯 User business category:', primaryCategory);
        return this.getPostersByCategory(primaryCategory);
      } else {
        console.log('⚠️ No business profiles found, returning general posters');
        return this.getPostersByCategory('General');
      }
    } catch (error) {
      console.error('❌ Error getting user category posters:', error);
      return this.getPostersByCategory('General');
    }
  }

  /**
   * Like a poster
   */
  async likePoster(posterId: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await api.post(`/api/mobile/likes`, {
        resourceType: 'POSTER',
        resourceId: posterId,
        mobileUserId: userId
      });

      if (response.data.success) {
        console.log('✅ Poster liked successfully:', posterId);
        return { success: true, message: 'Poster liked successfully' };
      } else {
        throw new Error(response.data.error || 'Failed to like poster');
      }
    } catch (error: any) {
      console.error('❌ Error liking poster:', error);
      return { success: false, message: error.message || 'Failed to like poster' };
    }
  }

  /**
   * Unlike a poster
   */
  async unlikePoster(posterId: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await api.delete(`/api/mobile/likes`, {
        data: {
          resourceType: 'POSTER',
          resourceId: posterId,
          mobileUserId: userId
        }
      });

      if (response.data.success) {
        console.log('✅ Poster unliked successfully:', posterId);
        return { success: true, message: 'Poster unliked successfully' };
      } else {
        throw new Error(response.data.error || 'Failed to unlike poster');
      }
    } catch (error: any) {
      console.error('❌ Error unliking poster:', error);
      return { success: false, message: error.message || 'Failed to unlike poster' };
    }
  }

  /**
   * Download a poster
   */
  async downloadPoster(posterId: string): Promise<{ success: boolean; message: string; downloadUrl?: string }> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Track the download
      const downloadResponse = await api.post('/api/mobile/downloads/track', {
        mobileUserId: userId,
        resourceId: posterId,
        resourceType: 'POSTER',
        fileUrl: `https://example.com/posters/${posterId}.jpg`
      });

      if (downloadResponse.data.success) {
        console.log('✅ Poster download tracked successfully:', posterId);
        return { 
          success: true, 
          message: 'Poster download tracked successfully',
          downloadUrl: `https://example.com/posters/${posterId}.jpg`
        };
      } else {
        throw new Error(downloadResponse.data.error || 'Failed to track download');
      }
    } catch (error: any) {
      console.error('❌ Error downloading poster:', error);
      return { success: false, message: error.message || 'Failed to download poster' };
    }
  }

  /**
   * Get mock posters for different business categories
   */
  private getMockPostersByCategory(category: string): BusinessCategoryPoster[] {
    const basePosters: BusinessCategoryPoster[] = [
      {
        id: '1',
        title: `${category} Business Poster 1`,
        description: `Professional ${category.toLowerCase()} business poster design`,
        category,
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1200&fit=crop',
        downloadUrl: 'https://example.com/posters/1.jpg',
        likes: Math.floor(Math.random() * 200) + 50,
        downloads: Math.floor(Math.random() * 100) + 20,
        isPremium: false, // Removed premium posters
        tags: [category.toLowerCase(), 'business', 'professional'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
      },
      {
        id: '2',
        title: `${category} Marketing Poster 2`,
        description: `Creative ${category.toLowerCase()} marketing poster template`,
        category,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=400&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=1200&fit=crop',
        downloadUrl: 'https://example.com/posters/2.jpg',
        likes: Math.floor(Math.random() * 150) + 30,
        downloads: Math.floor(Math.random() * 80) + 15,
        isPremium: false, // Removed premium posters
        tags: [category.toLowerCase(), 'marketing', 'creative'],
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T16:45:00Z'
      },
      {
        id: '3',
        title: `${category} Event Poster 3`,
        description: `Elegant ${category.toLowerCase()} event poster design`,
        category,
        thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300&h=400&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=1200&fit=crop',
        downloadUrl: 'https://example.com/posters/3.jpg',
        likes: Math.floor(Math.random() * 180) + 40,
        downloads: Math.floor(Math.random() * 90) + 25,
        isPremium: false, // Removed premium posters
        tags: [category.toLowerCase(), 'event', 'elegant'],
        createdAt: '2024-01-05T14:30:00Z',
        updatedAt: '2024-01-22T11:20:00Z'
      },
      {
        id: '4',
        title: `${category} Promotional Poster 4`,
        description: `Modern ${category.toLowerCase()} promotional poster template`,
        category,
        thumbnail: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=300&h=400&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=1200&fit=crop',
        downloadUrl: 'https://example.com/posters/4.jpg',
        likes: Math.floor(Math.random() * 220) + 60,
        downloads: Math.floor(Math.random() * 110) + 30,
        isPremium: false, // Removed premium posters
        tags: [category.toLowerCase(), 'promotional', 'modern'],
        createdAt: '2024-01-12T11:15:00Z',
        updatedAt: '2024-01-25T09:30:00Z'
      },
      {
        id: '5',
        title: `${category} Brand Poster 5`,
        description: `Professional ${category.toLowerCase()} brand identity poster`,
        category,
        thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=400&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=1200&fit=crop',
        downloadUrl: 'https://example.com/posters/5.jpg',
        likes: Math.floor(Math.random() * 190) + 45,
        downloads: Math.floor(Math.random() * 95) + 20,
        isPremium: false, // Removed premium posters
        tags: [category.toLowerCase(), 'brand', 'identity'],
        createdAt: '2024-01-08T16:20:00Z',
        updatedAt: '2024-01-19T13:45:00Z'
      },
      {
        id: '6',
        title: `${category} Service Poster 6`,
        description: `Clean ${category.toLowerCase()} service poster design`,
        category,
        thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=400&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=1200&fit=crop',
        downloadUrl: 'https://example.com/posters/6.jpg',
        likes: Math.floor(Math.random() * 160) + 35,
        downloads: Math.floor(Math.random() * 85) + 18,
        isPremium: false, // Removed premium posters
        tags: [category.toLowerCase(), 'service', 'clean'],
        createdAt: '2024-01-14T08:30:00Z',
        updatedAt: '2024-01-21T15:10:00Z'
      }
    ];

    // Return 3-6 random posters for the category
    const shuffled = basePosters.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 4) + 3);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.postersCache.clear();
    console.log('🗑️ Business category posters cache cleared');
  }
}

export default new BusinessCategoryPostersApiService();
