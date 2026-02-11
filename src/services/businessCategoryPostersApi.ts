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
   * Clear cache for a specific category or all cache
   */
  clearCategoryCache(category?: string): void {
    if (category) {
      const baseCacheKey = `category_${category}`;
      if (this.postersCache.has(baseCacheKey)) {
        this.postersCache.delete(baseCacheKey);
        logger.log(`🗑️ [CACHE] Cleared cache for category: ${category}`);
      }
    } else {
      // Clear all cache
      const cacheSize = this.postersCache.size;
      this.postersCache.clear();
      logger.log(`🗑️ [CACHE] Cleared all cache (${cacheSize} entries)`);
    }
  }

  /**
   * Get posters for a specific business category
   */
  async getPostersByCategory(category: string, limit?: number, isRefresh: boolean = false): Promise<BusinessCategoryPostersResponse> {
    try {
      const cacheKey = `category_${category}`;
      const now = Date.now();
      
      const requestLimit = limit || 200;
      
      // Check cache first (use base cache key without limit for flexibility)
      const baseCacheKey = `category_${category}`;
      if (this.postersCache.has(baseCacheKey) && !isRefresh) {
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
      logger.log(`📡 [CATEGORY POSTERS API] Fetching posters for: ${category} (limit: ${requestLimit}, refresh: ${isRefresh})`);
      
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
        // API returned unsuccessful response - might be no posters for this category
        // This is normal, return empty array instead of throwing error
        const errorMessage = response.data.message || response.data.error || 'No posters available for this category';
        if (__DEV__) {
          logger.log(`ℹ️ [CATEGORY POSTERS API] No posters found for category: ${category} - ${errorMessage}`);
        }
        
        // Return empty response instead of throwing error
        return {
          success: false,
          data: {
            posters: [],
            category,
            total: 0
          },
          message: errorMessage
        } as BusinessCategoryPostersResponse;
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
  async getUserCategoryPosters(isRefresh: boolean = false): Promise<BusinessCategoryPostersResponse> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        logger.warn('⚠️ [USER CATEGORY POSTERS] No user ID, using General category');
        return this.getPostersByCategory('General');
      }

      // FIRST: Try to get category from selected business profile (priority)
      logger.log('� [USER CATEGORY POSTERS] Checking selected business profile first...');
      
      const preferredProfileId = await AsyncStorage.getItem('selectedBusinessProfileId');
      const preferredCategory = await AsyncStorage.getItem('selectedBusinessProfileCategory');
      
      // DEBUG: Show what's being read from storage
      logger.log(`🔍 [USER CATEGORY POSTERS] Stored data - ProfileID: ${preferredProfileId}, Category: ${preferredCategory}`);

      // Get user's business profiles to determine category
      const businessProfileService = (await import('./businessProfile')).default;
      const userProfiles = await businessProfileService.getUserBusinessProfiles(userId);

      logger.log(`🔍 [USER CATEGORY POSTERS] Found ${userProfiles.length} business profiles`);
      userProfiles.forEach((profile, index) => {
        logger.log(`📋 [USER CATEGORY POSTERS] Profile ${index + 1}:`, {
          id: profile.id,
          name: profile.name,
          category: profile.category,
          subCategory: profile.subCategory || profile.subcategory,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        });
      });

      logger.log(`🎯 [USER CATEGORY POSTERS] Preferred profile ID: ${preferredProfileId}`);
      logger.log(`🎯 [USER CATEGORY POSTERS] Preferred category: ${preferredCategory}`);

      if (userProfiles.length > 0) {
        let profileToUse = userProfiles[0];
        
        // If preferredProfileId is set, try to find that profile
        if (preferredProfileId) {
          const matchedProfile = userProfiles.find(profile => profile.id === preferredProfileId);
          if (matchedProfile) {
            profileToUse = matchedProfile;
            logger.log(`✅ [USER CATEGORY POSTERS] Found preferred profile: ${matchedProfile.name}`);
          } else {
            logger.log(`⚠️ [USER CATEGORY POSTERS] Preferred profile ID ${preferredProfileId} not found, using first profile`);
          }
        } else {
          // If no preferred profile is set, try to find the most recently created profile
          // This ensures the registration profile is used if available
          const sortedProfiles = [...userProfiles].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.updatedAt || 0);
            const dateB = new Date(b.createdAt || b.updatedAt || 0);
            return dateB.getTime() - dateA.getTime(); // Most recent first
          });
          profileToUse = sortedProfiles[0];
          logger.log(`📋 [USER CATEGORY POSTERS] No preferred profile, using most recent: ${profileToUse.name}`);
        }
        
        const primaryCategory = profileToUse.category;
        const subCategory = profileToUse.subCategory || profileToUse.subcategory;
        
        // DEBUG: Show the profile details
        logger.log(`📋 [USER CATEGORY POSTERS] Selected profile details:`, {
          id: profileToUse.id,
          name: profileToUse.name,
          category: primaryCategory,
          subCategory: subCategory
        });
        
        // Use subcategory if available, otherwise use main category
        const targetCategory = subCategory || primaryCategory;
        const categoryType = subCategory ? 'subcategory (from business profile)' : 'main category (from business profile)';
        
        logger.log(`✅ [USER CATEGORY POSTERS] Using ${categoryType} from profile ${profileToUse.name}: ${targetCategory}`);
        if (subCategory) {
          logger.log(`📋 [USER CATEGORY POSTERS] Subcategory: ${subCategory}, Main category: ${primaryCategory}`);
        }
        
        // DEBUG: Show what we're actually using for the API call
        logger.log(`🎯 [USER CATEGORY POSTERS] API CALL - Fetching posters for category: "${targetCategory}"`);
        
        return this.getPostersByCategory(targetCategory, 200, isRefresh);
      }

      // FALLBACK: Try to get the original category from user's registration data
      logger.log('🔄 [USER CATEGORY POSTERS] No business profiles found, checking registration data...');
      
      const user = authService.getCurrentUser();
      const originalCategory = user?._originalCategory || user?.category;
      const originalSubCategory = user?.subCategory || user?.subcategory;

      if (originalCategory || originalSubCategory) {
        const targetCategory = originalSubCategory || originalCategory;
        const categoryType = originalSubCategory ? 'subcategory (from registration)' : 'main category (from registration)';
        
        logger.log(`✅ [USER CATEGORY POSTERS] Using ${categoryType}: ${targetCategory}`);
        if (originalSubCategory) {
          logger.log(`📋 [USER CATEGORY POSTERS] Subcategory: ${originalSubCategory}, Main category: ${originalCategory}`);
        }
        return this.getPostersByCategory(targetCategory, 200, isRefresh); // Always request 200 to get all posters
      }

      // FINAL FALLBACK: Use General category
      logger.warn('⚠️ [USER CATEGORY POSTERS] No category found, using General category');
      return this.getPostersByCategory('General', 200, isRefresh);
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
