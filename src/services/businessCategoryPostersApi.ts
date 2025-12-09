import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import authService from './auth';
import logger from '../utils/logger';

export interface BusinessCategoryPoster {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  imageUrl: string;
  downloadUrl: string;

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
  async getPostersByCategory(category: string, limit?: number): Promise<BusinessCategoryPostersResponse> {
    try {
      const cacheKey = `category_${category}`;
      const now = Date.now();
      
      const requestLimit = limit || 200;
      
      // Check cache first (use base cache key without limit for flexibility)
      const baseCacheKey = `category_${category}`;
      if (this.postersCache.has(baseCacheKey)) {
        const cached = this.postersCache.get(baseCacheKey)!;
        const cacheAge = now - cached.timestamp;
        
        if (cacheAge < this.CACHE_DURATION) {
          // Apply limit if requested (for cache hits)
          const limitedPosters = requestLimit ? cached.data.slice(0, requestLimit) : cached.data;
          logger.log(`✅ [CACHE] Returning ${limitedPosters.length} cached posters for: ${category} (limited to ${requestLimit})`);
          return {
            success: true,
            data: {
              posters: limitedPosters,
              category,
              total: limitedPosters.length
            },
            message: 'Posters fetched from cache'
          };
        }
      }
      logger.log(`📡 [CATEGORY POSTERS API] Fetching posters for: ${category} (limit: ${requestLimit})`);
      
      const response = await api.get(
        `/api/mobile/posters/category/${encodeURIComponent(category)}?limit=${requestLimit}`,
      );
      
      if (response.data.success) {
        const posters = response.data.data.posters;
        logger.log(`✅ [CATEGORY POSTERS API] ${posters.length} poster(s) fetched for ${response.data.data.category || category}`);
        
        // Convert backend response to frontend format and fix URLs (optimized - no per-item logging)
        const baseUrl = 'https://eventmarketersbackend.onrender.com';
        const postersWithAbsoluteUrls = posters.map((poster: any) => {
          // Backend returns 'thumbnailUrl', frontend expects 'thumbnail'
          const thumbnailUrl = poster.thumbnailUrl || poster.thumbnail;
          const imageUrl = poster.imageUrl;
          const downloadUrl = poster.downloadUrl;
          
          return {
            id: poster.id,
            title: poster.title,
            description: poster.description,
            category: poster.category,
            thumbnail: thumbnailUrl && !thumbnailUrl.startsWith('http') 
              ? `${baseUrl}${thumbnailUrl}` 
              : thumbnailUrl,
            imageUrl: imageUrl && !imageUrl.startsWith('http')
              ? `${baseUrl}${imageUrl}`
              : imageUrl,
            downloadUrl: downloadUrl && !downloadUrl.startsWith('http')
              ? `${baseUrl}${downloadUrl}`
              : downloadUrl,
            downloads: poster.downloads || 0,
            isPremium: poster.isPremium || false,
            tags: poster.tags || [],
            createdAt: poster.createdAt,
            updatedAt: poster.updatedAt || poster.createdAt,
          } as BusinessCategoryPoster;
        });
        
        // Apply limit if requested (in case API returns more than requested)
        const limitedPosters = requestLimit ? postersWithAbsoluteUrls.slice(0, requestLimit) : postersWithAbsoluteUrls;
        
        // Cache the full results (without limit) so different limits can share cache
        this.postersCache.set(baseCacheKey, {
          data: postersWithAbsoluteUrls,
          timestamp: now
        });
        
        logger.log(`✅ [CATEGORY POSTERS API] Cached ${postersWithAbsoluteUrls.length} poster(s), returning ${limitedPosters.length}`);
        
        return {
          ...response.data,
          data: {
            ...response.data.data,
            posters: limitedPosters,
            total: limitedPosters.length
          }
        };
      } else {
        logger.warn('⚠️ [CATEGORY POSTERS API] Response Success = false');
        logger.warn('⚠️ Error from API:', response.data.error);
        throw new Error(response.data.error || 'Failed to fetch posters');
      }
    } catch (error: any) {
      logger.error('❌ [CATEGORY POSTERS API] Error fetching posters:', error.message);
      if (error.response) {
        logger.error('   ↳ Status:', error.response.status, 'Message:', error.response.data?.message);
      }
      
      // Return empty data when API fails
      return {
        success: false,
        data: {
          posters: [],
          category,
          total: 0
        },
        message: 'No posters available - API endpoint not found'
      };
    }
  }

  /**
   * Get user's business category and fetch relevant posters (optimized logging)
   */
  async getUserCategoryPosters(): Promise<BusinessCategoryPostersResponse> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        logger.warn('⚠️ [USER CATEGORY POSTERS] No user ID, using General category');
        return this.getPostersByCategory('General');
      }

      const preferredProfileId = await AsyncStorage.getItem('selectedBusinessProfileId');
      const preferredCategory = await AsyncStorage.getItem('selectedBusinessProfileCategory');

      // Get user's business profiles to determine category
      const businessProfileService = (await import('./businessProfile')).default;
      const userProfiles = await businessProfileService.getUserBusinessProfiles(userId);

      if (userProfiles.length > 0) {
        let profileToUse = userProfiles[0];
        if (preferredProfileId) {
          const matchedProfile = userProfiles.find(profile => profile.id === preferredProfileId);
          if (matchedProfile) {
            profileToUse = matchedProfile;
          }
        }
        const primaryCategory = profileToUse.category;
        logger.log(`✅ [USER CATEGORY POSTERS] Using category from profile ${profileToUse.name}: ${primaryCategory}`);
        return this.getPostersByCategory(primaryCategory);
      } else {
        if (preferredCategory) {
          logger.warn(`⚠️ [USER CATEGORY POSTERS] No profiles found, using stored category: ${preferredCategory}`);
          return this.getPostersByCategory(preferredCategory);
        }
        logger.warn('⚠️ [USER CATEGORY POSTERS] No profiles found, using General category');
        return this.getPostersByCategory('General');
      }
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message)
          : 'Unknown error';
      logger.error('❌ [USER CATEGORY POSTERS] Error:', errorMessage);
      // Return empty data when there's an error
      return {
        success: false,
        data: {
          posters: [],
          category: 'General',
          total: 0
        },
        message: 'No posters available - unable to determine user category'
      };
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
        logger.log('✅ Poster download tracked successfully:', posterId);
        return { 
          success: true, 
          message: 'Poster download tracked successfully',
          downloadUrl: `https://example.com/posters/${posterId}.jpg`
        };
      } else {
        throw new Error(downloadResponse.data.error || 'Failed to track download');
      }
    } catch (error: any) {
      logger.error('❌ Error downloading poster:', error);
      return { success: false, message: error.message || 'Failed to download poster' };
    }
  }

  /**
   * Get mock posters for different business categories
   */
  // Mock data method removed - using only API data

  /**
   * Clear cache
   */
  clearCache(): void {
    this.postersCache.clear();
    logger.log('🗑️ Business category posters cache cleared');
  }
}

export default new BusinessCategoryPostersApiService();
