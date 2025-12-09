import api from './api';
import cacheService from './cacheService';
import logger from '../utils/logger';

export interface BusinessCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl?: string;
  image?: string;
}

export interface BusinessCategoriesResponse {
  success: boolean;
  categories: BusinessCategory[];
}

class BusinessCategoriesService {
  // Get all business categories
  async getBusinessCategories(): Promise<BusinessCategoriesResponse> {
    const cacheKey = 'business_categories';
    
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        logger.log('📡 [CATEGORY API] Calling: /api/mobile/business-categories/business');
        const response = await api.get('/api/mobile/business-categories/business');
        
        // Handle new response structure: categories are in response.data.data.categories
        const categories = response.data.data?.categories || response.data.categories || [];
        logger.log(`✅ [CATEGORY API] ${categories.length} categories fetched`);
        
        // Return in expected format
        return {
          success: response.data.success || true,
          categories: categories
        };
      },
      10 * 60 * 1000, // 10 minutes TTL (categories rarely change)
      true // Allow stale data
    ).catch(error => {
      logger.error('❌ [CATEGORY API] Error:', error);
      
      // Return mock data as fallback if cache also fails
      logger.warn('⚠️ [CATEGORY API] Using mock business categories due to API error');
      return this.getMockCategories();
    });
  }

  // Get categories using alias endpoint
  async getCategories(): Promise<BusinessCategoriesResponse> {
    const cacheKey = 'business_categories_v1';
    
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        logger.log('📡 [CATEGORY API ALIAS] Calling: /api/v1/categories');
        const response = await api.get('/api/v1/categories');
        
        logger.log(`✅ [CATEGORY API ALIAS] ${response.data.categories?.length || 0} categories fetched`);
        
        return response.data;
      },
      10 * 60 * 1000, // 10 minutes TTL
      true // Allow stale data
    ).catch(error => {
      logger.error('❌ [CATEGORY API ALIAS] Error:', error);
      logger.log('🔄 [CATEGORY API ALIAS] Falling back to main endpoint');
      
      // Fallback to main endpoint
      return this.getBusinessCategories();
    });
  }

  // Get category by ID
  async getCategoryById(categoryId: string): Promise<BusinessCategory | null> {
    try {
      const response = await this.getBusinessCategories();
      if (response.success) {
        return response.categories.find(category => category.id === categoryId) || null;
      }
      return null;
    } catch (error) {
      logger.error('Failed to get category by ID:', error);
      return null;
    }
  }

  // Search categories by name
  async searchCategories(query: string): Promise<BusinessCategory[]> {
    try {
      const response = await this.getBusinessCategories();
      if (response.success) {
        return response.categories.filter(category => 
          category.name.toLowerCase().includes(query.toLowerCase()) ||
          category.description.toLowerCase().includes(query.toLowerCase())
        );
      }
      return [];
    } catch (error) {
      logger.error('Failed to search categories:', error);
      return [];
    }
  }

  // Clear cache
  clearCache(): void {
    cacheService.clear('business_categories');
    cacheService.clear('business_categories_v1');
  }

  // Get mock categories for fallback
  private getMockCategories(): BusinessCategoriesResponse {
    return {
      success: true,
      categories: [
        {
          id: '1',
          name: 'Restaurant',
          description: 'Food and dining business content',
          icon: '🍽️'
        },
        {
          id: '2',
          name: 'Wedding Planning',
          description: 'Wedding and event planning content',
          icon: '💒'
        },
        {
          id: '3',
          name: 'Electronics',
          description: 'Electronic products and gadgets',
          icon: '📱'
        },
        {
          id: '4',
          name: 'Fashion',
          description: 'Fashion and clothing business content',
          icon: '👗'
        },
        {
          id: '5',
          name: 'Health & Fitness',
          description: 'Health and fitness related content',
          icon: '💪'
        },
        {
          id: '6',
          name: 'Education',
          description: 'Educational institutions and services',
          icon: '🎓'
        },
        {
          id: '7',
          name: 'Automotive',
          description: 'Automotive and transportation services',
          icon: '🚗'
        },
        {
          id: '8',
          name: 'Real Estate',
          description: 'Real estate and property services',
          icon: '🏠'
        }
      ]
    };
  }
}

export default new BusinessCategoriesService();
