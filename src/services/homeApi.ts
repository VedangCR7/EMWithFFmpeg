import api from './api';
import cacheService from './cacheService';
import logger from '../utils/logger';

// ============================================================================
// HOME SCREEN API SERVICE
// ============================================================================
// This service defines the 4 required APIs for the home screen functionality.
// Backend team should implement these endpoints to replace mock data.
// ============================================================================

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FeaturedContent {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  videoUrl?: string;
  link: string;
  type: 'banner' | 'promotion' | 'highlight';
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  time: string; // HH:MM format
  location: string;
  organizer: string;
  organizerId: string;
  imageUrl: string;
  category: string;
  price?: number;
  isFree: boolean;
  attendees: number;
  maxAttendees?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  previewUrl?: string; // Optional preview image/video
  category: string;
  subcategory?: string;
  downloads: number;
  views: number;
  isDownloaded: boolean;
  isPremium: boolean;
  tags: string[];
  fileSize?: number; // in bytes
  createdAt: string;
  updatedAt: string;
}

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number; // in seconds
  category: string;
  language: string;
  languages?: string[];
  views: number;
  downloads: number;
  isDownloaded: boolean;
  isPremium: boolean;
  tags: string[];
  fileSize?: number; // in bytes
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export interface FeaturedContentResponse {
  success: boolean;
  data: FeaturedContent[];
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpcomingEventsResponse {
  success: boolean;
  data: UpcomingEvent[];
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProfessionalTemplatesResponse {
  success: boolean;
  data: ProfessionalTemplate[];
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VideoContentResponse {
  success: boolean;
  data: VideoContent[];
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchContentResponse {
  success: boolean;
  data: {
    templates: ProfessionalTemplate[];
    videos: VideoContent[];
    events: UpcomingEvent[];
  };
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

// ============================================================================
// HOME API SERVICE CLASS
// ============================================================================

class HomeApiService {
  // Base URL for converting relative paths to absolute URLs
  private readonly BASE_URL = 'https://eventmarketersbackend.onrender.com';

  /**
   * Clear cache for a specific key or all home screen cache
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      cacheService.clear(cacheKey);
      console.log(`🧹 [CACHE] Cleared ${cacheKey} cache`);
    } else {
      // Clear all home screen related cache
      cacheService.clearPattern('home_');
      console.log('🧹 [CACHE] Cleared all home screen cache');
    }
  }

  /**
   * Convert relative image URLs to absolute URLs
   */
  private convertToAbsoluteUrl(url: string | undefined | null): string | undefined {
    if (!url) {
      return undefined;
    }
    
    // Filter out emojis - they are not valid image URLs
    // Emoji regex covers most common emoji ranges
    if (/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{1F300}-\u{1F9FF}]/u.test(url)) {
      console.warn('⚠️ [HOME API] Filtering out emoji as image URL:', url);
      return undefined; // Return undefined so fallback image is used
    }
    
    // Filter out placeholder paths - these don't actually exist on the server
    if (url.includes('/api/placeholder/') || url.includes('placeholder')) {
      console.warn('⚠️ [HOME API] Filtering out placeholder URL:', url);
      return undefined; // Return undefined so fallback image is used
    }
    
    // Already absolute URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Handle URLs that don't start with /
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    const absoluteUrl = `${this.BASE_URL}${normalizedUrl}`;
    
    return absoluteUrl;
  }

  /**
   * Map backend featured content to FeaturedContent interface
   */
  private mapToFeaturedContent(item: any): FeaturedContent {
    return {
      id: item.id,
      title: item.title,
      description: item.description || '',
      imageUrl: item.imageUrl,
      videoUrl: item.videoUrl || undefined,
      link: `/templates/${item.id}`, // Default link to template
      type: item.isFeatured ? 'banner' : 'highlight', // Map based on isFeatured flag
      priority: item.isFeatured ? 1 : 2,
      isActive: true,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt || item.createdAt,
    };
  }

  /**
   * Convert image URLs in featured content
   */
  private convertFeaturedContentUrls(content: any[]): FeaturedContent[] {
    if (!Array.isArray(content)) {
      return [];
    }
    
    return content.map(item => {
      // First map to FeaturedContent interface
      const mappedItem = this.mapToFeaturedContent(item);
      
      // Then convert URLs to absolute
      const convertedImageUrl = this.convertToAbsoluteUrl(mappedItem.imageUrl);
      const convertedVideoUrl = mappedItem.videoUrl ? this.convertToAbsoluteUrl(mappedItem.videoUrl) : mappedItem.videoUrl;
      
      return {
        ...mappedItem,
        imageUrl: convertedImageUrl || mappedItem.imageUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
        videoUrl: convertedVideoUrl || mappedItem.videoUrl,
      };
    });
  }

  /**
   * Convert image URLs in upcoming events
   */
  private convertUpcomingEventsUrls(events: UpcomingEvent[]): UpcomingEvent[] {
    // Safety check: ensure events is an array
    if (!events || !Array.isArray(events)) {
      console.warn('⚠️ [HOME API] convertUpcomingEventsUrls received invalid data:', events);
      return [];
    }
    
    return events.map(event => {
      const convertedUrl = this.convertToAbsoluteUrl(event.imageUrl);
      
      return {
        ...event,
        imageUrl: convertedUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
      };
    });
  }

  /**
   * Convert image URLs in professional templates
   */
  private convertProfessionalTemplatesUrls(templates: ProfessionalTemplate[]): ProfessionalTemplate[] {
    return templates.map(template => {
      // Convert both thumbnail and preview URLs to absolute
      let convertedThumbnail = this.convertToAbsoluteUrl(template.thumbnail);
      let convertedPreview = template.previewUrl ? this.convertToAbsoluteUrl(template.previewUrl) : undefined;
      
      // If no previewUrl, try to derive high-quality URL from thumbnail
      if (!convertedPreview && convertedThumbnail) {
        // Try to convert thumbnail path to full image path
        if (convertedThumbnail.includes('/thumbnailUrl/')) {
          convertedPreview = convertedThumbnail.replace(/\/thumbnailUrl\//g, '/url/');
        } else if (convertedThumbnail.includes('/thumbnail/')) {
          convertedPreview = convertedThumbnail.replace(/\/thumbnail\//g, '/images/');
        }
      }
      
      // Add quality parameters to both URLs if server supports it
      if (convertedThumbnail && !convertedThumbnail.includes('unsplash')) {
        const separator = convertedThumbnail.includes('?') ? '&' : '?';
        convertedThumbnail = `${convertedThumbnail}${separator}quality=high&width=1200`;
      }
      
      if (convertedPreview && !convertedPreview.includes('unsplash') && !convertedPreview.includes('quality=')) {
        const separator = convertedPreview.includes('?') ? '&' : '?';
        convertedPreview = `${convertedPreview}${separator}quality=high&width=2400`;
      }
      
      return {
        ...template,
        thumbnail: convertedThumbnail || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop&q=85',
        previewUrl: convertedPreview || convertedThumbnail, // Use thumbnail as fallback if no preview
      };
    });
  }

  /**
   * Convert image URLs in video content
   */
  private convertVideoContentUrls(videos: VideoContent[]): VideoContent[] {
    return videos.map(video => ({
      ...video,
      thumbnail: this.convertToAbsoluteUrl(video.thumbnail) || 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=300&h=200&fit=crop',
      videoUrl: this.convertToAbsoluteUrl(video.videoUrl) || video.videoUrl,
    }));
  }
  // ============================================================================
  // API 1: FEATURED CONTENT
  // ============================================================================
  // Endpoint: GET /api/mobile/home/featured
  // Purpose: Get featured banners, promotions, and highlights for home screen
  // Query Parameters:
  //   - limit: number (optional, default: 10)
  //   - type: 'banner' | 'promotion' | 'highlight' | 'all' (optional, default: 'all')
  //   - active: boolean (optional, default: true)
  // ============================================================================
  
  async getFeaturedContent(params?: {
    limit?: number;
    type?: 'banner' | 'promotion' | 'highlight' | 'all';
    active?: boolean;
  }): Promise<FeaturedContentResponse> {
    // Generate cache key based on params
    const paramsKey = params ? JSON.stringify(params) : 'default';
    const cacheKey = `home_featured_${paramsKey}`;
    
    // Use cache service with stale-while-revalidate pattern
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        const queryParams = new URLSearchParams();
        
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
        if (params?.active !== undefined) queryParams.append('active', params.active.toString());
        
        const queryString = queryParams.toString();
        const url = `/api/mobile/home/featured${queryString ? `?${queryString}` : ''}`;
        
        const response = await api.get(url);
                
        // Validate response structure
        if (!response.data.success) {
          return {
            success: false,
            data: [],
            message: response.data.message || 'API returned unsuccessful response',
          };
        }
        
        // Check if data exists
        if (!response.data.data) {
          return {
            success: false,
            data: [],
            message: 'No data returned from API',
          };
        }
        
        // Extract featured content array from nested structure
        let featuredData: FeaturedContent[];
        
        if (Array.isArray(response.data.data)) {
          featuredData = response.data.data;
        } else if (response.data.data.featured && Array.isArray(response.data.data.featured)) {
          featuredData = response.data.data.featured;
        } else {
          return {
            success: false,
            data: [],
            message: 'Invalid data format from API',
          };
        }
        
        // Backend already returns FeaturedContent format, just convert URLs to absolute
        // Don't remap the data structure as it's already correct
        const convertedData = featuredData.map(item => {
          // Convert URLs to absolute if needed (backend should already return absolute URLs from Cloudinary)
          const convertedImageUrl = this.convertToAbsoluteUrl(item.imageUrl);
          const convertedVideoUrl = item.videoUrl ? this.convertToAbsoluteUrl(item.videoUrl) : item.videoUrl;
          
          return {
            ...item, // Preserve all original data from backend
            imageUrl: convertedImageUrl || item.imageUrl || '', // Keep original if conversion fails
            videoUrl: convertedVideoUrl || item.videoUrl,
          };
        }).filter(item => {
          // Filter out items without valid imageUrl
          const hasValidImage = item.imageUrl && item.imageUrl.trim() !== '';
          if (!hasValidImage) {
            console.warn('⚠️ [HOME API] Filtering out featured item without valid imageUrl:', item.id);
          }
          return hasValidImage;
        });
        
        console.log('✅ [FEATURED CONTENT API] Response Details:');
        console.log('   - Success:', response.data.success);
        console.log('   - Message:', response.data.message);
        console.log('   - Total Items:', convertedData.length);
        
        // Log first featured item as example
        if (convertedData.length > 0) {
          console.log('📸 [FIRST FEATURED ITEM EXAMPLE]:');
          console.log('   Raw Data:', JSON.stringify(convertedData[0], null, 2));
          console.log('   - ID:', convertedData[0].id);
          console.log('   - Title:', convertedData[0].title);
          console.log('   - Type:', convertedData[0].type);
          console.log('   - Image URL:', convertedData[0].imageUrl);
          console.log('   - Video URL:', convertedData[0].videoUrl);
          console.log('   - Link:', convertedData[0].link);
          console.log('   - Is Active:', convertedData[0].isActive);
          console.log('   - Priority:', convertedData[0].priority);
        }
        
        console.log(`✅ [HOME API] Fetched ${convertedData.length} featured items`);
        
        return {
          success: true,
          data: convertedData,
          message: response.data.message || 'Featured content retrieved successfully',
        };
      },
      5 * 60 * 1000, // 5 minutes TTL
      true // Allow stale data
    ).catch(error => {
      console.error('❌ [HOME API] Featured content error:', error);
      // Return empty response when network fails
      return {
        success: false,
        data: [],
        message: 'Failed to load featured content. Please check your network connection.',
      };
    });
  }

  // ============================================================================
  // API 2: UPCOMING EVENTS
  // ============================================================================
  // Endpoint: GET /api/mobile/home/upcoming-events
  // Purpose: Get upcoming events for home screen
  // Query Parameters:
  //   - limit: number (optional, default: 20)
  //   - category: string (optional, filter by event category)
  //   - location: string (optional, filter by location)
  //   - dateFrom: string (optional, ISO date, filter events from this date)
  //   - dateTo: string (optional, ISO date, filter events until this date)
  //   - isFree: boolean (optional, filter free/paid events)
  // ============================================================================
  
  async getUpcomingEvents(params?: {
    limit?: number;
    category?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
    isFree?: boolean;
  }): Promise<UpcomingEventsResponse> {
    // Generate cache key based on params
    const paramsKey = params ? JSON.stringify(params) : 'default';
    const cacheKey = `home_events_${paramsKey}`;
    
    // Use cache service with stale-while-revalidate pattern (2 min TTL for time-sensitive data)
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        console.log('📡 [HOME API] Fetching upcoming events...');
        
        const queryParams = new URLSearchParams();
        
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.category) queryParams.append('category', params.category);
        if (params?.location) queryParams.append('location', params.location);
        if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
        if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
        if (params?.isFree !== undefined) queryParams.append('isFree', params.isFree.toString());
        
        const queryString = queryParams.toString();
        const url = `/api/mobile/home/upcoming-events${queryString ? `?${queryString}` : ''}`;
        
        const response = await api.get(url);
        
        // Convert relative URLs to absolute URLs
        if (response.data.success && response.data.data) {
          // Ensure data is an array before converting
          if (Array.isArray(response.data.data)) {
            response.data.data = this.convertUpcomingEventsUrls(response.data.data);
            logger.log(`✅ [HOME API] Fetched ${response.data.data.length} events`);
          } else {
            logger.warn('⚠️ [HOME API] Expected array for upcoming events data, got:', typeof response.data.data);
            response.data.data = [];
          }
        }
        
        return response.data;
      },
      2 * 60 * 1000, // 2 minutes TTL (time-sensitive)
      true // Allow stale data
    ).catch(error => {
      logger.error('❌ [HOME API] Upcoming events error:', error);
      // Return empty response when network fails
      return {
        success: false,
        data: [],
        message: 'Failed to load upcoming events. Please check your network connection.',
      };
    });
  }

  // ============================================================================
  // API 3: PROFESSIONAL TEMPLATES
  // ============================================================================
  // Endpoint: GET /api/mobile/home/templates
  // Purpose: Get professional templates for home screen
  // Query Parameters:
  //   - limit: number (optional, default: 20)
  //   - category: string (optional, filter by template category)
  //   - subcategory: string (optional, filter by subcategory)
  //   - isPremium: boolean (optional, filter premium/free templates)
  //   - sortBy: 'popular' | 'recent' | 'likes' | 'downloads' (optional, default: 'popular')
  //   - tags: string[] (optional, filter by tags)
  // ============================================================================
  
  async getProfessionalTemplates(params?: {
    limit?: number;
    category?: string;
    subcategory?: string;
    isPremium?: boolean;
    sortBy?: 'popular' | 'recent' | 'likes' | 'downloads';
    tags?: string[];
    language?: string;
  }): Promise<ProfessionalTemplatesResponse> {
    // Generate cache key based on params
    const paramsKey = params ? JSON.stringify(params) : 'default';
    const cacheKey = `home_templates_${paramsKey}`;
    
    // Use cache service with stale-while-revalidate pattern
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        logger.log('📡 [HOME API] Fetching professional templates...');
        
        const queryParams = new URLSearchParams();
        
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.category) queryParams.append('category', params.category);
        if (params?.subcategory) queryParams.append('subcategory', params.subcategory);
        if (params?.isPremium !== undefined) queryParams.append('isPremium', params.isPremium.toString());
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.tags && params.tags.length > 0) {
          params.tags.forEach(tag => queryParams.append('tags', tag));
        }
        if (params?.language) queryParams.append('language', params.language);
        
        const queryString = queryParams.toString();
        const url = `/api/mobile/home/templates${queryString ? `?${queryString}` : ''}`;
        
        const response = await api.get(url);
        
        // Convert relative URLs to absolute URLs
        if (response.data.success && response.data.data) {
          response.data.data = this.convertProfessionalTemplatesUrls(response.data.data);
          logger.log(`✅ [HOME API] Fetched ${response.data.data.length} templates`);
        }
        
        return response.data;
      },
      5 * 60 * 1000, // 5 minutes TTL
      true // Allow stale data
    ).catch(error => {
      logger.error('❌ [HOME API] Professional templates error:', error);
      // Return empty response when network fails
      return {
        success: false,
        data: [],
        message: 'Failed to load professional templates. Please check your network connection.',
      };
    });
  }

  // ============================================================================
  // API 4: VIDEO CONTENT
  // ============================================================================
  // Endpoint: GET /api/mobile/home/video-content
  // Purpose: Get video templates and content for home screen
  // Query Parameters:
  //   - limit: number (optional, default: 20)
  //   - category: string (optional, filter by video category)
  //   - language: string (optional, filter by language)
  //   - isPremium: boolean (optional, filter premium/free videos)
  //   - sortBy: 'popular' | 'recent' | 'likes' | 'views' | 'downloads' (optional, default: 'popular')
  //   - duration: 'short' | 'medium' | 'long' (optional, filter by duration)
  //   - tags: string[] (optional, filter by tags)
  // ============================================================================
  
  async getVideoContent(params?: {
    limit?: number;
    category?: string;
    language?: string;
    isPremium?: boolean;
    sortBy?: 'popular' | 'recent' | 'likes' | 'views' | 'downloads';
    duration?: 'short' | 'medium' | 'long';
    tags?: string[];
  }): Promise<VideoContentResponse> {
    // Generate cache key based on params
    const paramsKey = params ? JSON.stringify(params) : 'default';
    const cacheKey = `home_videos_${paramsKey}`;
    
    // Use cache service with stale-while-revalidate pattern
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        console.log('📡 [HOME API] Fetching video content...');
        
        const queryParams = new URLSearchParams();
        
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.category) queryParams.append('category', params.category);
        if (params?.language) queryParams.append('language', params.language);
        if (params?.isPremium !== undefined) queryParams.append('isPremium', params.isPremium.toString());
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.duration) queryParams.append('duration', params.duration);
        if (params?.tags && params.tags.length > 0) {
          params.tags.forEach(tag => queryParams.append('tags', tag));
        }
        
        const queryString = queryParams.toString();
        const url = `/api/mobile/home/video-content${queryString ? `?${queryString}` : ''}`;
        
        const response = await api.get(url);
        
        // Convert relative URLs to absolute URLs
        if (response.data.success && response.data.data) {
          response.data.data = this.convertVideoContentUrls(response.data.data);
          console.log(`✅ [HOME API] Fetched ${response.data.data.length} videos`);
        }
        
        return response.data;
      },
      5 * 60 * 1000, // 5 minutes TTL
      true // Allow stale data
    ).catch(error => {
      console.error('❌ [HOME API] Video content error:', error);
      // Return empty response when network fails
      return {
        success: false,
        data: [],
        message: 'Failed to load video content. Please check your network connection.',
      };
    });
  }

  // ============================================================================
  // ADDITIONAL APIS
  // ============================================================================

  // Search across all content types
  async searchContent(params: {
    query: string;
    type?: 'all' | 'templates' | 'videos' | 'events';
    limit?: number;
  }): Promise<SearchContentResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', params.query);
      
      if (params.type && params.type !== 'all') queryParams.append('type', params.type);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const queryString = queryParams.toString();
      const url = `/api/mobile/home/search?${queryString}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Search content error:', error);
      throw error;
    }
  }

  // Download content (templates or videos)
  async downloadContent(contentId: string, contentType: 'template' | 'video'): Promise<ActionResponse> {
    try {
      const response = await api.post(`/api/mobile/home/${contentType}s/${contentId}/download`);
      return response.data;
    } catch (error) {
      console.error('Download content error:', error);
      throw error;
    }
  }

  // Get content details (API endpoint removed)
  async getContentDetails(contentId: string, contentType: 'template' | 'video' | 'event'): Promise<{
    success: boolean;
    data: ProfessionalTemplate | VideoContent | UpcomingEvent;
    message: string;
  }> {
    console.log('⚠️ getContentDetails - API endpoint removed');
    throw new Error('Content details endpoint has been removed. Use list endpoints instead.');
  }

  // ============================================================================
  // MOCK DATA METHODS (FALLBACK WHEN SERVER IS NOT AVAILABLE)
  // ============================================================================

  // Mock data removed - Featured content now loads exclusively from API
  // If API fails, empty response is returned instead of mock data

  private getMockUpcomingEvents(params?: {
    limit?: number;
    category?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
    isFree?: boolean;
  }): UpcomingEventsResponse {
    const mockData: UpcomingEvent[] = [
      {
        id: 'event-1',
        title: 'Digital Marketing Workshop',
        description: 'Learn the latest digital marketing strategies',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '10:00',
        location: 'Online',
        organizer: 'Marketing Pro',
        organizerId: 'org-1',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
        category: 'Workshop',
        price: 99,
        isFree: false,
        attendees: 45,
        maxAttendees: 100,
        tags: ['marketing', 'digital', 'workshop'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'event-2',
        title: 'Free Design Tips Session',
        description: 'Get free design tips from industry experts',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '14:00',
        location: 'Design Hub',
        organizer: 'Design Masters',
        organizerId: 'org-2',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        category: 'Seminar',
        isFree: true,
        attendees: 120,
        maxAttendees: 150,
        tags: ['design', 'free', 'tips'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    let filteredData = mockData;

    // Apply filters
    if (params?.category) {
      filteredData = filteredData.filter(event => event.category === params.category);
    }

    if (params?.location) {
      filteredData = filteredData.filter(event => event.location.toLowerCase().includes(params.location!.toLowerCase()));
    }

    if (params?.isFree !== undefined) {
      filteredData = filteredData.filter(event => event.isFree === params.isFree);
    }

    // Apply limit
    if (params?.limit) {
      filteredData = filteredData.slice(0, params.limit);
    }

    return {
      success: true,
      data: filteredData,
      message: 'Mock upcoming events retrieved successfully',
    };
  }

  private getMockProfessionalTemplates(params?: {
    limit?: number;
    category?: string;
    subcategory?: string;
    isPremium?: boolean;
    sortBy?: 'popular' | 'recent' | 'likes' | 'downloads';
    tags?: string[];
  }): ProfessionalTemplatesResponse {
    const mockData: ProfessionalTemplate[] = [
      {
        id: 'template-1',
        name: 'Business Card Template',
        description: 'Professional business card design',
        thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&h=200&fit=crop',
        category: 'Business',
        subcategory: 'Cards',

        downloads: 189,
        views: 1200,
        isDownloaded: false,
        isPremium: false,
        tags: ['business', 'card', 'professional'],
        fileSize: 1024000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'template-2',
        name: 'Premium Flyer Design',
        description: 'High-quality flyer template for events',
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
        category: 'Marketing',
        subcategory: 'Flyers',

        downloads: 234,
        views: 1500,
        isDownloaded: false,
        isPremium: true,
        tags: ['flyer', 'event', 'premium'],
        fileSize: 2048000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    let filteredData = mockData;

    // Apply filters
    if (params?.category) {
      filteredData = filteredData.filter(template => template.category === params.category);
    }

    if (params?.subcategory) {
      filteredData = filteredData.filter(template => template.subcategory === params.subcategory);
    }

    if (params?.isPremium !== undefined) {
      filteredData = filteredData.filter(template => template.isPremium === params.isPremium);
    }

    if (params?.tags && params.tags.length > 0) {
      filteredData = filteredData.filter(template => 
        params.tags!.some(tag => template.tags.includes(tag))
      );
    }

    // Apply sorting
    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'likes':
          filteredData.sort((a, b) => b.views - a.views);
          break;
        case 'downloads':
          filteredData.sort((a, b) => b.downloads - a.downloads);
          break;
        case 'recent':
          filteredData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'popular':
        default:
          filteredData.sort((a, b) => (b.views + b.downloads) - (a.views + a.downloads));
          break;
      }
    }

    // Apply limit
    if (params?.limit) {
      filteredData = filteredData.slice(0, params.limit);
    }

    return {
      success: true,
      data: filteredData,
      message: 'Mock professional templates retrieved successfully',
    };
  }

  private getMockVideoContent(params?: {
    limit?: number;
    category?: string;
    language?: string;
    isPremium?: boolean;
    sortBy?: 'popular' | 'recent' | 'likes' | 'views' | 'downloads';
    duration?: 'short' | 'medium' | 'long';
    tags?: string[];
  }): VideoContentResponse {
    const mockData: VideoContent[] = [
      {
        id: 'video-1',
        title: 'Product Launch Video',
        description: 'Professional product launch video template',
        thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300&h=200&fit=crop',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        duration: 30,
        category: 'Business',
        language: 'en',
        languages: ['en'],

        views: 800,
        downloads: 45,
        isDownloaded: false,
        isPremium: false,
        tags: ['product', 'launch', 'business'],
        fileSize: 10240000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'video-2',
        title: 'Event Promo Video',
        description: 'Dynamic event promotion video template',
        thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=200&fit=crop',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4',
        duration: 60,
        category: 'Events',
        language: 'en',
        languages: ['en'],

        views: 1200,
        downloads: 78,
        isDownloaded: false,
        isPremium: true,
        tags: ['event', 'promo', 'dynamic'],
        fileSize: 20480000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    let filteredData = mockData;

    // Apply filters
    if (params?.category) {
      filteredData = filteredData.filter(video => video.category === params.category);
    }

    if (params?.language) {
      filteredData = filteredData.filter(video => video.language === params.language);
    }

    if (params?.isPremium !== undefined) {
      filteredData = filteredData.filter(video => video.isPremium === params.isPremium);
    }

    if (params?.duration) {
      const durationMap = { short: 30, medium: 60, long: 120 };
      const maxDuration = durationMap[params.duration];
      filteredData = filteredData.filter(video => video.duration <= maxDuration);
    }

    if (params?.tags && params.tags.length > 0) {
      filteredData = filteredData.filter(video => 
        params.tags!.some(tag => video.tags.includes(tag))
      );
    }

    // Apply sorting
    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'likes':
          filteredData.sort((a, b) => b.views - a.views);
          break;
        case 'views':
          filteredData.sort((a, b) => b.views - a.views);
          break;
        case 'downloads':
          filteredData.sort((a, b) => b.downloads - a.downloads);
          break;
        case 'recent':
          filteredData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'popular':
        default:
          filteredData.sort((a, b) => (b.views + b.downloads) - (a.views + a.downloads));
          break;
      }
    }

    // Apply limit
    if (params?.limit) {
      filteredData = filteredData.slice(0, params.limit);
    }

    return {
      success: true,
      data: filteredData,
      message: 'Mock video content retrieved successfully',
    };
  }
}

// ============================================================================
// BACKEND TEAM NOTES
// ============================================================================
/*
REQUIRED API ENDPOINTS FOR HOME SCREEN:

1. GET /api/home/featured
   - Returns featured banners, promotions, highlights
   - Should be ordered by priority
   - Only return active content (isActive: true)
   - Support pagination

2. GET /api/home/upcoming-events
   - Returns upcoming events
   - Should be ordered by date (soonest first)
   - Support filtering by category, location, date range
   - Support pagination

3. GET /api/home/templates
   - Returns professional templates
   - Should be ordered by popularity by default
   - Support filtering by category, premium status
   - Support pagination

4. GET /api/home/video-content
   - Returns video templates
   - Should be ordered by popularity by default
   - Support filtering by category, language, duration
   - Support pagination

5. GET /api/home/search
   - Search across templates, videos, and events
   - Support filtering by content type
   - Return unified results

6. POST /api/home/templates/{id}/like
7. DELETE /api/home/templates/{id}/like
8. POST /api/home/videos/{id}/like
9. DELETE /api/home/videos/{id}/like
10. POST /api/home/templates/{id}/download
11. POST /api/home/videos/{id}/download

AUTHENTICATION:
- All endpoints require Bearer token authentication
- User-specific data (isLiked, isDownloaded) should be based on authenticated user
- Premium content access should be checked against user subscription

ERROR HANDLING:
- Return consistent error format: { success: false, message: string, data: null }
- Use appropriate HTTP status codes
- Handle pagination errors gracefully

CACHING:
- Consider implementing caching for featured content and templates
- Cache duration: 5-10 minutes for dynamic content
- Cache duration: 1 hour for static content

PERFORMANCE:
- Implement pagination for all list endpoints
- Use database indexes on frequently queried fields
- Consider implementing CDN for images and videos
*/

export default new HomeApiService();
