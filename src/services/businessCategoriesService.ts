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
  parentCategoryName?: string; // Backend returns this field name
  subCategories?: any[]; // Array of subcategory objects
  slug?: string;
  color?: string;
  posterCount?: number;
  videoCount?: number;
  totalContent?: number;
  mainCategory?: string;
  childCategoryNames?: any;
  sortOrder?: number;
  createdAt?: string;
  isParent?: boolean;
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
        
        // Print the full response
        console.log('📋 [BUSINESS CATEGORIES] Full Response:', JSON.stringify(response.data, null, 2));
        
        // Handle new response structure: categories are in response.data.data.categories
        const categories = response.data.data?.categories || response.data.categories || [];
        logger.log(`✅ [CATEGORY API] ${categories.length} categories fetched`);
        
        // Log parent category information for debugging
        if (categories.length > 0) {
          console.log('📋 [BUSINESS CATEGORIES] Total Categories:', categories.length);
          
          // Check all categories for parentCategoryName
          const categoriesWithParent = categories.filter((cat: any) => cat.parentCategoryName);
          const categoriesWithoutParent = categories.filter((cat: any) => !cat.parentCategoryName);
          
          console.log(`📋 [BUSINESS CATEGORIES] Categories WITH parentCategoryName: ${categoriesWithParent.length}`);
          console.log(`📋 [BUSINESS CATEGORIES] Categories WITHOUT parentCategoryName: ${categoriesWithoutParent.length}`);
          
          // Show sample categories
          const sampleCategories = categories.slice(0, 3);
          sampleCategories.forEach((category: any, index: number) => {
            console.log(`📋 [BUSINESS CATEGORIES] Category ${index + 1} (${category.name}):`, {
              id: category.id,
              name: category.name,
              parentCategoryName: category.parentCategoryName,
              hasParentCategoryName: 'parentCategoryName' in category,
              parentCategoryNameType: typeof category.parentCategoryName,
              allKeys: Object.keys(category)
            });
          });
          
          // If any category has parentCategoryName, show it
          if (categoriesWithParent.length > 0) {
            console.log('📋 [BUSINESS CATEGORIES] Sample category WITH parentCategoryName:', JSON.stringify(categoriesWithParent[0], null, 2));
          }
          if (categoriesWithoutParent.length > 0) {
            console.log('📋 [BUSINESS CATEGORIES] Sample category WITHOUT parentCategoryName:', JSON.stringify(categoriesWithoutParent[0], null, 2));
          }
        }
        
        // Return in expected format - backend returns parentCategoryName
        return {
          success: response.data.success || true,
          categories: categories // Backend already returns parentCategoryName field
        };
      },
      10 * 60 * 1000, // 10 minutes TTL (categories rarely change)
      true // Allow stale data
    ).catch(error => {
      logger.error('❌ [CATEGORY API] Error:', error);
      
      // Re-throw the error instead of returning mock data
      throw error;
    });
  }

  // Get business categories for home screen
  async getHomeBusinessCategories(): Promise<BusinessCategoriesResponse> {
    const cacheKey = 'home_business_categories';
    
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        logger.log('📡 [CATEGORY API HOME] Calling: /api/mobile/business-categories/home');
        const response = await api.get('/api/mobile/business-categories/home');
        
        // Print the full response
        console.log('📋 [HOME BUSINESS CATEGORIES] Full Response:', JSON.stringify(response.data, null, 2));
        
        // Handle response structure: categories are in response.data.data.categories
        const categories = response.data.data?.categories || response.data.categories || [];
        logger.log(`✅ [CATEGORY API HOME] ${categories.length} categories fetched`);
        
        // Return in expected format
        return {
          success: response.data.success || true,
          categories: categories
        };
      },
      10 * 60 * 1000, // 10 minutes TTL
      true // Allow stale data
    ).catch(error => {
      logger.error('❌ [CATEGORY API HOME] Error:', error);
      logger.log('🔄 [CATEGORY API HOME] Falling back to main endpoint');
      
      // Fallback to main endpoint
      return this.getBusinessCategories();
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
}

export default new BusinessCategoriesService();
