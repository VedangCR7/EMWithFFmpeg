import api from './api';
import cacheService from './cacheService';
import logger from '../utils/logger';

// ============================================================================
// CALENDAR API SERVICE
// ============================================================================
// This service handles fetching calendar posters/images for specific dates.
// Backend team should implement these endpoints.
// ============================================================================

export interface CalendarPoster {
  id: string;
  name: string;
  title?: string;
  description?: string;
  thumbnail: string;
  imageUrl?: string;
  category: string;
  downloads: number;
  isDownloaded: boolean;
  tags: string[];
  date: string; // ISO date string (YYYY-MM-DD)
  festivalName?: string;
  festivalEmoji?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarPostersResponse {
  success: boolean;
  data: {
    posters: CalendarPoster[];
    date: string;
    total: number;
  };
  message: string;
}

export interface CalendarMonthPostersResponse {
  success: boolean;
  data: {
    posters: { [date: string]: CalendarPoster[] };
    month: number;
    year: number;
    total: number;
  };
  message: string;
}

class CalendarApiService {
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache (reduced from 10 minutes for faster updates)

  /**
   * Get posters for a specific date (with centralized caching)
   * @param date - Date string in format YYYY-MM-DD
   * @param forceRefresh - If true, bypasses cache and fetches fresh data
   * @returns CalendarPostersResponse
   */
  async getPostersByDate(date: string, forceRefresh: boolean = false): Promise<CalendarPostersResponse> {
    const cacheKey = `calendar_posters_date_${date}`;

    // If force refresh, clear cache first and wait a bit to ensure it's cleared
    if (forceRefresh) {
      await cacheService.clear(cacheKey);
      logger.log(`🔄 [CALENDAR API] Force refreshing posters for date: ${date} (cache cleared)`);
    }

    // If force refresh, bypass cache entirely and fetch directly
    if (forceRefresh) {
      try {
        // Fetch directly without using cache
        logger.log(`📡 [CALENDAR API] Fetching fresh data (bypassing cache) for date: ${date}`);
        const response = await api.get(`/api/mobile/calendar/posters/${date}`);

        if (response.data.success) {
          const posters = response.data.data?.posters || response.data.posters || [];
          logger.log(`✅ [CALENDAR API] ${posters.length} poster(s) fetched for ${date}`);

          // Convert backend response to frontend format and fix URLs
          const baseUrl = 'https://eventmarketersbackend.onrender.com';
          const postersWithAbsoluteUrls = posters.map((poster: any) => {
            const thumbnailUrl = poster.thumbnailUrl || poster.thumbnail || poster.imageUrl;
            const imageUrl = poster.imageUrl || poster.thumbnailUrl || poster.thumbnail;

            return {
              id: poster.id,
              name: poster.name || poster.title || 'Calendar Poster',
              title: poster.title || poster.name,
              description: poster.description || '',
              thumbnail:
                thumbnailUrl && !thumbnailUrl.startsWith('http')
                  ? `${baseUrl}${thumbnailUrl}`
                  : thumbnailUrl,
              imageUrl:
                imageUrl && !imageUrl.startsWith('http') ? `${baseUrl}${imageUrl}` : imageUrl,
              category: poster.category || 'Festival',
              downloads: poster.downloads || 0,
              isDownloaded: poster.isDownloaded || false,
              tags: poster.tags || [],
              date: poster.date || date,
              festivalName: poster.festivalName || poster.festival?.name,
              festivalEmoji: poster.festivalEmoji || poster.festival?.emoji,
              createdAt: poster.createdAt,
              updatedAt: poster.updatedAt || poster.createdAt,
            } as CalendarPoster;
          });

          // Update cache with fresh data
          await cacheService.set(cacheKey, {
            success: true,
            data: {
              posters: postersWithAbsoluteUrls,
              date,
              total: postersWithAbsoluteUrls.length,
            },
            message: 'Posters fetched successfully',
          }, this.CACHE_TTL);

          return {
            success: true,
            data: {
              posters: postersWithAbsoluteUrls,
              date,
              total: postersWithAbsoluteUrls.length,
            },
            message: 'Posters fetched successfully',
          };
        } else {
          logger.warn('⚠️ [CALENDAR API] Response Success = false (force refresh)');
          logger.warn('⚠️ Error from API:', response.data.error || response.data.message);
          throw new Error(response.data.error || response.data.message || 'Failed to fetch posters');
        }
      } catch (forceRefreshError) {
        logger.error('❌ [CALENDAR API] Error during force refresh:', forceRefreshError);
        throw forceRefreshError;
      }
    }

    // Normal cached fetch path (when forceRefresh is false)
    try {
      const cachedData = await cacheService.getOrFetch(
        cacheKey,
        async () => {
          logger.log(`📡 [CALENDAR API] Fetching posters for date: ${date}`);

          const response = await api.get(`/api/mobile/calendar/posters/${date}`);

          if (response.data.success) {
            const posters = response.data.data?.posters || response.data.posters || [];
            logger.log(`✅ [CALENDAR API] ${posters.length} poster(s) fetched for ${date}`);

            // Convert backend response to frontend format and fix URLs
            const baseUrl = 'https://eventmarketersbackend.onrender.com';
            const postersWithAbsoluteUrls = posters.map((poster: any) => {
              const thumbnailUrl = poster.thumbnailUrl || poster.thumbnail || poster.imageUrl;
              const imageUrl = poster.imageUrl || poster.thumbnailUrl || poster.thumbnail;

              return {
                id: poster.id,
                name: poster.name || poster.title || 'Calendar Poster',
                title: poster.title || poster.name,
                description: poster.description || '',
                thumbnail:
                  thumbnailUrl && !thumbnailUrl.startsWith('http')
                    ? `${baseUrl}${thumbnailUrl}`
                    : thumbnailUrl,
                imageUrl:
                  imageUrl && !imageUrl.startsWith('http') ? `${baseUrl}${imageUrl}` : imageUrl,
                category: poster.category || 'Festival',
                downloads: poster.downloads || 0,
                isDownloaded: poster.isDownloaded || false,
                tags: poster.tags || [],
                date: poster.date || date,
                festivalName: poster.festivalName || poster.festival?.name,
                festivalEmoji: poster.festivalEmoji || poster.festival?.emoji,
                createdAt: poster.createdAt,
                updatedAt: poster.updatedAt || poster.createdAt,
              } as CalendarPoster;
            });

            logger.log(`✅ [CALENDAR API] Cached ${postersWithAbsoluteUrls.length} poster(s) for date: ${date}`);

            return {
              success: true,
              data: {
                posters: postersWithAbsoluteUrls,
                date,
                total: postersWithAbsoluteUrls.length,
              },
              message: 'Posters fetched successfully',
            };
          } else {
            logger.warn('⚠️ [CALENDAR API] Response Success = false');
            logger.warn('⚠️ Error from API:', response.data.error || response.data.message);
            throw new Error(response.data.error || response.data.message || 'Failed to fetch posters');
          }
        },
        this.CACHE_TTL,
        true // Allow stale data
      );

      return cachedData;
    } catch (error: any) {
      logger.error('❌ [CALENDAR API] Error fetching posters:', error.message);
      if (error.response) {
        logger.error('   ↳ Status:', error.response.status);
        logger.error('   ↳ Message:', error.response.data?.message);
      }

      // Return empty data when API fails (graceful degradation)
      return {
        success: false,
        data: {
          posters: [],
          date,
          total: 0,
        },
        message: error.response?.data?.message || 'No posters available for this date',
      };
    }
  }

  /**
   * Get posters for an entire month (with centralized caching)
   * @param year - Year (e.g., 2025)
   * @param month - Month (1-12)
   * @returns CalendarMonthPostersResponse
   */
  async getPostersByMonth(
    year: number,
    month: number,
  ): Promise<CalendarMonthPostersResponse> {
    const cacheKey = `calendar_posters_month_${year}_${month}`;

    try {
      const cachedData = await cacheService.getOrFetch(
        cacheKey,
        async () => {
          logger.log(`📡 [CALENDAR API] Fetching posters for month: ${year}-${month}`);

          const response = await api.get(`/api/mobile/calendar/posters/month/${year}/${month}`);

          if (response.data.success) {
            const posters = response.data.data?.posters || response.data.posters || [];
            logger.log(`✅ [CALENDAR API] ${posters.length} poster(s) fetched for month ${year}-${month}`);

            // Convert backend response to frontend format
            const baseUrl = 'https://eventmarketersbackend.onrender.com';
            const postersWithAbsoluteUrls = posters.map((poster: any) => {
              const thumbnailUrl = poster.thumbnailUrl || poster.thumbnail || poster.imageUrl;
              const imageUrl = poster.imageUrl || poster.thumbnailUrl || poster.thumbnail;

              return {
                id: poster.id,
                name: poster.name || poster.title || 'Calendar Poster',
                title: poster.title || poster.name,
                description: poster.description || '',
                thumbnail:
                  thumbnailUrl && !thumbnailUrl.startsWith('http')
                    ? `${baseUrl}${thumbnailUrl}`
                    : thumbnailUrl,
                imageUrl:
                  imageUrl && !imageUrl.startsWith('http') ? `${baseUrl}${imageUrl}` : imageUrl,
                category: poster.category || 'Festival',
                downloads: poster.downloads || 0,
                isDownloaded: poster.isDownloaded || false,
                tags: poster.tags || [],
                date: poster.date,
                festivalName: poster.festivalName || poster.festival?.name,
                festivalEmoji: poster.festivalEmoji || poster.festival?.emoji,
                createdAt: poster.createdAt,
                updatedAt: poster.updatedAt || poster.createdAt,
              } as CalendarPoster;
            });

            // Group posters by date
            const postersByDate: { [date: string]: CalendarPoster[] } = {};
            postersWithAbsoluteUrls.forEach((poster) => {
              if (!postersByDate[poster.date]) {
                postersByDate[poster.date] = [];
              }
              postersByDate[poster.date].push(poster);
            });

            return {
              success: true,
              data: {
                posters: postersByDate,
                month,
                year,
                total: postersWithAbsoluteUrls.length,
              },
              message: 'Posters fetched successfully',
            };
          } else {
            throw new Error(response.data.error || response.data.message || 'Failed to fetch posters');
          }
        },
        this.CACHE_TTL,
        true // Allow stale data
      );

      return cachedData;
    } catch (error: any) {
      logger.error('❌ [CALENDAR API] Error fetching month posters:', error.message);
      return {
        success: false,
        data: {
          posters: {},
          month,
          year,
          total: 0,
        },
        message: error.response?.data?.message || 'No posters available for this month',
      };
    }
  }

  /**
   * Clear cache for a specific date or all cache
   */
  clearCache(date?: string): void {
    if (date) {
      cacheService.clear(`calendar_posters_date_${date}`);
      logger.log(`🗑️ [CALENDAR API] Cleared cache for date: ${date}`);
    } else {
      // Clear all calendar poster caches
      cacheService.clearPattern('calendar_posters_');
      logger.log('🗑️ [CALENDAR API] Cleared all cache');
    }
  }
}

export default new CalendarApiService();

