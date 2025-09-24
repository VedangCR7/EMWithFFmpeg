import api from './api';

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
  likes: number;
  downloads: number;
  views: number;
  isLiked: boolean;
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
  likes: number;
  views: number;
  downloads: number;
  isLiked: boolean;
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
  // ============================================================================
  // API 1: FEATURED CONTENT
  // ============================================================================
  // Endpoint: GET /api/home/featured
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
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
      if (params?.active !== undefined) queryParams.append('active', params.active.toString());
      
      const queryString = queryParams.toString();
      const url = `/home/featured${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.log('Using mock featured content due to API error:', error);
      return this.getMockFeaturedContent(params);
    }
  }

  // ============================================================================
  // API 2: UPCOMING EVENTS
  // ============================================================================
  // Endpoint: GET /api/home/upcoming-events
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
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.category) queryParams.append('category', params.category);
      if (params?.location) queryParams.append('location', params.location);
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params?.isFree !== undefined) queryParams.append('isFree', params.isFree.toString());
      
      const queryString = queryParams.toString();
      const url = `/home/upcoming-events${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.log('Using mock upcoming events due to API error:', error);
      return this.getMockUpcomingEvents(params);
    }
  }

  // ============================================================================
  // API 3: PROFESSIONAL TEMPLATES
  // ============================================================================
  // Endpoint: GET /api/home/templates
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
  }): Promise<ProfessionalTemplatesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.category) queryParams.append('category', params.category);
      if (params?.subcategory) queryParams.append('subcategory', params.subcategory);
      if (params?.isPremium !== undefined) queryParams.append('isPremium', params.isPremium.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.tags && params.tags.length > 0) {
        params.tags.forEach(tag => queryParams.append('tags', tag));
      }
      
      const queryString = queryParams.toString();
      const url = `/home/templates${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.log('Using mock professional templates due to API error:', error);
      return this.getMockProfessionalTemplates(params);
    }
  }

  // ============================================================================
  // API 4: VIDEO CONTENT
  // ============================================================================
  // Endpoint: GET /api/home/video-content
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
    try {
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
      const url = `/home/video-content${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.log('Using mock video content due to API error:', error);
      return this.getMockVideoContent(params);
    }
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
      const url = `/home/search?${queryString}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Search content error:', error);
      throw error;
    }
  }

  // Like content (templates or videos)
  async likeContent(contentId: string, contentType: 'template' | 'video'): Promise<ActionResponse> {
    try {
      const response = await api.post(`/home/${contentType}s/${contentId}/like`);
      return response.data;
    } catch (error) {
      console.error('Like content error:', error);
      throw error;
    }
  }

  // Unlike content (templates or videos)
  async unlikeContent(contentId: string, contentType: 'template' | 'video'): Promise<ActionResponse> {
    try {
      const response = await api.delete(`/home/${contentType}s/${contentId}/like`);
      return response.data;
    } catch (error) {
      console.error('Unlike content error:', error);
      throw error;
    }
  }

  // Download content (templates or videos)
  async downloadContent(contentId: string, contentType: 'template' | 'video'): Promise<ActionResponse> {
    try {
      const response = await api.post(`/home/${contentType}s/${contentId}/download`);
      return response.data;
    } catch (error) {
      console.error('Download content error:', error);
      throw error;
    }
  }

  // Get content details
  async getContentDetails(contentId: string, contentType: 'template' | 'video' | 'event'): Promise<{
    success: boolean;
    data: ProfessionalTemplate | VideoContent | UpcomingEvent;
    message: string;
  }> {
    try {
      const response = await api.get(`/home/${contentType}s/${contentId}`);
      return response.data;
    } catch (error) {
      console.error('Get content details error:', error);
      throw error;
    }
  }

  // ============================================================================
  // MOCK DATA METHODS (FALLBACK WHEN SERVER IS NOT AVAILABLE)
  // ============================================================================

  private getMockFeaturedContent(params?: {
    limit?: number;
    type?: 'banner' | 'promotion' | 'highlight' | 'all';
    active?: boolean;
  }): FeaturedContentResponse {
    const mockData: FeaturedContent[] = [
      {
        id: 'fc-1',
        title: 'Welcome to EventMarketers',
        description: 'Create stunning marketing materials with our professional templates',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
        link: '/templates',
        type: 'banner',
        priority: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'fc-2',
        title: 'Premium Templates Available',
        description: 'Unlock premium templates and advanced features',
        imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop',
        link: '/subscription',
        type: 'promotion',
        priority: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'fc-3',
        title: 'New Video Editor',
        description: 'Create professional videos with our new video editor',
        imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=400&fit=crop',
        link: '/video-editor',
        type: 'highlight',
        priority: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    let filteredData = mockData;

    // Apply filters
    if (params?.type && params.type !== 'all') {
      filteredData = filteredData.filter(item => item.type === params.type);
    }

    if (params?.active !== undefined) {
      filteredData = filteredData.filter(item => item.isActive === params.active);
    }

    // Apply limit
    if (params?.limit) {
      filteredData = filteredData.slice(0, params.limit);
    }

    return {
      success: true,
      data: filteredData,
      message: 'Mock featured content retrieved successfully',
    };
  }

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
        likes: 245,
        downloads: 189,
        views: 1200,
        isLiked: false,
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
        likes: 312,
        downloads: 234,
        views: 1500,
        isLiked: true,
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
          filteredData.sort((a, b) => b.likes - a.likes);
          break;
        case 'downloads':
          filteredData.sort((a, b) => b.downloads - a.downloads);
          break;
        case 'recent':
          filteredData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'popular':
        default:
          filteredData.sort((a, b) => (b.likes + b.downloads) - (a.likes + a.downloads));
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
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        duration: 30,
        category: 'Business',
        language: 'en',
        likes: 189,
        views: 800,
        downloads: 45,
        isLiked: false,
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
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        duration: 60,
        category: 'Events',
        language: 'en',
        likes: 267,
        views: 1200,
        downloads: 78,
        isLiked: true,
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
          filteredData.sort((a, b) => b.likes - a.likes);
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
          filteredData.sort((a, b) => (b.likes + b.views + b.downloads) - (a.likes + a.views + a.downloads));
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
