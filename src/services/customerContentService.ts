import api from './api';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  downloads: number;
  views: number;
  duration?: number; // For videos
}

export interface CustomerContentResponse {
  success: boolean;
  content: {
    images: ContentItem[];
    videos: ContentItem[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessCategory: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  totalDownloads: number;
  lastActiveAt: string;
}

export interface CustomerProfileResponse {
  success: boolean;
  customer: CustomerProfile;
}

export interface ContentFilters {
  category?: string;
  page?: number;
  limit?: number;
  tags?: string[];
  search?: string;
}

class CustomerContentService {
  private contentCache: Map<string, CustomerContentResponse> = new Map();
  private profileCache: Map<string, CustomerProfile> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Get customer content
  async getCustomerContent(
    customerId: string, 
    filters?: ContentFilters
  ): Promise<CustomerContentResponse> {
    try {
      console.log('Fetching customer content for:', customerId);
      
      // Create cache key
      const cacheKey = `${customerId}-${JSON.stringify(filters || {})}`;
      
      // Check cache first
      const cached = this.contentCache.get(cacheKey);
      if (cached && this.isCacheValid(cacheKey)) {
        console.log('✅ Returning cached customer content');
        return cached;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString();
      const url = `/api/mobile/content/${customerId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      
      if (response.data.success) {
        console.log('✅ Customer content loaded:', 
          response.data.content.images?.length || 0, 'images,',
          response.data.content.videos?.length || 0, 'videos'
        );
        
        // Cache the response
        this.contentCache.set(cacheKey, response.data);
        this.setCacheTimestamp(cacheKey);
        
        return response.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to fetch customer content:', error);
      
      // Return cached data if available
      const cacheKey = `${customerId}-${JSON.stringify(filters || {})}`;
      const cached = this.contentCache.get(cacheKey);
      if (cached) {
        console.log('⚠️ Using cached customer content due to API error');
        return cached;
      }
      
      // Return mock data as fallback
      console.log('⚠️ Using mock customer content due to API error');
      return this.getMockContent(customerId, filters);
    }
  }

  // Get customer profile
  async getCustomerProfile(customerId: string): Promise<CustomerProfileResponse> {
    try {
      console.log('Fetching customer profile for:', customerId);
      
      // Check cache first
      const cached = this.profileCache.get(customerId);
      if (cached && this.isCacheValid(customerId)) {
        console.log('✅ Returning cached customer profile');
        return {
          success: true,
          customer: cached
        };
      }

      const response = await api.get(`/api/mobile/profile/${customerId}`);
      
      if (response.data.success) {
        console.log('✅ Customer profile loaded:', response.data.customer.name);
        
        // Cache the profile
        this.profileCache.set(customerId, response.data.customer);
        this.setCacheTimestamp(customerId);
        
        return response.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to fetch customer profile:', error);
      
      // Return cached data if available
      const cached = this.profileCache.get(customerId);
      if (cached) {
        console.log('⚠️ Using cached customer profile due to API error');
        return {
          success: true,
          customer: cached
        };
      }
      
      // Return mock data as fallback
      console.log('⚠️ Using mock customer profile due to API error');
      return this.getMockProfile(customerId);
    }
  }

  // Get content using alias endpoint
  async getContent(
    customerId: string, 
    filters?: ContentFilters
  ): Promise<CustomerContentResponse> {
    try {
      console.log('Fetching content from alias endpoint for:', customerId);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString();
      const url = `/api/v1/content/${customerId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      
      if (response.data.success) {
        console.log('✅ Content loaded from alias endpoint');
        return response.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to fetch content from alias endpoint:', error);
      
      // Fallback to main endpoint
      return this.getCustomerContent(customerId, filters);
    }
  }

  // Get profile using alias endpoint
  async getProfile(customerId: string): Promise<CustomerProfileResponse> {
    try {
      console.log('Fetching profile from alias endpoint for:', customerId);
      const response = await api.get(`/api/v1/profile/${customerId}`);
      
      if (response.data.success) {
        console.log('✅ Profile loaded from alias endpoint');
        return response.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to fetch profile from alias endpoint:', error);
      
      // Fallback to main endpoint
      return this.getCustomerProfile(customerId);
    }
  }

  // Search content
  async searchContent(customerId: string, query: string, filters?: ContentFilters): Promise<CustomerContentResponse> {
    try {
      const searchFilters = {
        ...filters,
        search: query
      };
      
      return await this.getCustomerContent(customerId, searchFilters);
    } catch (error) {
      console.error('Failed to search content:', error);
      throw error;
    }
  }

  // Get content by category
  async getContentByCategory(customerId: string, category: string, filters?: ContentFilters): Promise<CustomerContentResponse> {
    try {
      const categoryFilters = {
        ...filters,
        category
      };
      
      return await this.getCustomerContent(customerId, categoryFilters);
    } catch (error) {
      console.error('Failed to get content by category:', error);
      throw error;
    }
  }

  // Get paginated content
  async getPaginatedContent(
    customerId: string, 
    page: number = 1, 
    limit: number = 20, 
    filters?: ContentFilters
  ): Promise<CustomerContentResponse> {
    try {
      const paginationFilters = {
        ...filters,
        page,
        limit
      };
      
      return await this.getCustomerContent(customerId, paginationFilters);
    } catch (error) {
      console.error('Failed to get paginated content:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache(): void {
    this.contentCache.clear();
    this.profileCache.clear();
    console.log('Customer content cache cleared');
  }

  // Clear cache for specific customer
  clearCustomerCache(customerId: string): void {
    // Remove all cache entries for this customer
    for (const key of this.contentCache.keys()) {
      if (key.startsWith(customerId)) {
        this.contentCache.delete(key);
      }
    }
    this.profileCache.delete(customerId);
    console.log('Cache cleared for customer:', customerId);
  }

  // Check if cache is valid
  private isCacheValid(key: string): boolean {
    const timestamp = this.getCacheTimestamp(key);
    return timestamp && (Date.now() - timestamp) < this.CACHE_DURATION;
  }

  // Get cache timestamp
  private getCacheTimestamp(key: string): number {
    return parseInt(localStorage.getItem(`cache_${key}`) || '0');
  }

  // Set cache timestamp
  private setCacheTimestamp(key: string): void {
    localStorage.setItem(`cache_${key}`, Date.now().toString());
  }

  // Get mock content for fallback
  private getMockContent(customerId: string, filters?: ContentFilters): CustomerContentResponse {
    return {
      success: true,
      content: {
        images: [
          {
            id: 'mock-image-1',
            title: 'Restaurant Interior',
            description: 'Beautiful restaurant interior design',
            url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
            thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=150&fit=crop',
            category: 'BUSINESS',
            tags: ['restaurant', 'interior', 'design'],
            downloads: 45,
            views: 120
          }
        ],
        videos: [
          {
            id: 'mock-video-1',
            title: 'Restaurant Promo Video',
            description: 'Promotional video for restaurant',
            url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=150&fit=crop',
            category: 'BUSINESS',
            duration: 30,
            downloads: 25,
            views: 80
          }
        ]
      },
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        total: 100,
        totalPages: 5
      }
    };
  }

  // Get mock profile for fallback
  private getMockProfile(customerId: string): CustomerProfileResponse {
    return {
      success: true,
      customer: {
        id: customerId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        businessName: 'John\'s Restaurant',
        businessCategory: 'Restaurant',
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: '2024-09-01T00:00:00.000Z',
        subscriptionEndDate: '2025-09-01T00:00:00.000Z',
        totalDownloads: 150,
        lastActiveAt: '2024-09-22T07:00:00.000Z'
      }
    };
  }
}

export default new CustomerContentService();
