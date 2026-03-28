import api from './api';
import cacheService from './cacheService';

export interface DownloadedContent {
  id: string;
  resourceType: 'TEMPLATE' | 'VIDEO' | 'GREETING' | 'CONTENT';
  resourceId: string;
  fileUrl: string;
  createdAt: string;
  title?: string;
  thumbnail?: string;
  category?: string;
}

export interface DownloadStats {
  total: number;
  recent: number;
  byType: {
    templates: number;
    videos: number;
    greetings: number;
    content: number;
  };
  mostDownloadedType: string | null;
  mostDownloadedCount: number;
}

export interface DownloadFilters {
  type?: 'TEMPLATE' | 'VIDEO' | 'GREETING' | 'CONTENT';
  page?: number;
  limit?: number;
}

class DownloadTrackingService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  // Get all downloads for a user (with caching)
  async getUserDownloads(userId: string, filters?: DownloadFilters): Promise<{
    downloads: DownloadedContent[];
    statistics: {
      total: number;
      byType: {
        templates: number;
        videos: number;
        greetings: number;
        content: number;
      };
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Create cache key with filters
    const filterKey = filters ? JSON.stringify(filters) : 'all';
    const cacheKey = `user_downloads_${userId}_${filterKey}`;

    return await cacheService.getOrFetch(
      cacheKey,
      async () => {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const response = await api.get(`/api/mobile/users/${userId}/downloads?${params.toString()}`);
        
        if (response.data.success) {
          
          // Map backend response to frontend format
          // Backend now returns: fileUrl, thumbnail, title, category, resourceType, resourceId, createdAt
          const mappedDownloads = response.data.data.downloads.map((download: any) => {
            // Backend returns both 'type' and 'resourceType' for compatibility
            const resourceType = download.resourceType || download.type;
            
            // Backend now provides fileUrl and thumbnail directly
            const fileUrl = download.fileUrl || download.downloadUrl || '';
            const thumbnail = download.thumbnail || fileUrl || '';
            
            // Validate URLs - accept http/https and file:// URLs (for local images)
            const isValidFileUrl = fileUrl && 
              typeof fileUrl === 'string' && 
              fileUrl.trim() !== '' && 
              (fileUrl.startsWith('http://') || 
               fileUrl.startsWith('https://') || 
               fileUrl.startsWith('file://') ||
               fileUrl.startsWith('content://')); // Accept file:// and content:// URLs for local images
            
            const isValidThumbnail = thumbnail && 
              typeof thumbnail === 'string' && 
              thumbnail.trim() !== '' && 
              (thumbnail.startsWith('http://') || 
               thumbnail.startsWith('https://') || 
               thumbnail.startsWith('file://') ||
               thumbnail.startsWith('content://')); // Accept file:// and content:// URLs
            
            return {
              id: download.id,
              resourceType: resourceType,
              resourceId: download.resourceId,
              fileUrl: isValidFileUrl ? fileUrl : '',
              thumbnail: isValidThumbnail ? thumbnail : (isValidFileUrl ? fileUrl : ''),
              createdAt: download.createdAt || download.downloadedAt,
              title: download.title || this.getResourceTitle(resourceType, download.resourceId),
              category: download.category || this.getResourceCategory(resourceType, download.resourceId)
            };
          });

          return {
            downloads: mappedDownloads,
            statistics: response.data.data.statistics,
            pagination: response.data.data.pagination
          };
        } else {
          throw new Error('API returned unsuccessful response');
        }
      },
      this.CACHE_TTL,
      true // Allow stale data
    ).catch((error) => {
      console.log('Using mock downloads due to API error:', error);
      return this.getMockDownloads(filters);
    });
  }

  // Get download statistics for a user
  async getDownloadStats(userId: string): Promise<DownloadStats> {
    try {
      const response = await api.get(`/api/mobile/users/${userId}/downloads/stats`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.log('Using mock download stats due to API error:', error);
      return this.getMockDownloadStats();
    }
  }

  // Track a download (call this whenever user downloads content)
  async trackDownload(
    userId: string, 
    resourceType: 'TEMPLATE' | 'VIDEO' | 'GREETING' | 'POSTER' | 'CONTENT', 
    resourceId: string, 
    fileUrl: string,
    additionalData?: { title?: string; thumbnail?: string; category?: string }
  ): Promise<boolean> {
    try {
      console.log('📥 [TRACK DOWNLOAD] Tracking download:', { userId, resourceType, resourceId });
      
      const response = await api.post('/api/mobile/downloads/track', {
        mobileUserId: userId,
        resourceType: resourceType,
        resourceId,
        fileUrl,
        ...additionalData
      });
      
      if (response.data.success) {
        console.log('✅ [TRACK DOWNLOAD] Download tracked successfully');
        // Clear cache after tracking download
        cacheService.clearPattern(`user_downloads_${userId}_`);
        return true;
      } else {
        console.log('⚠️ [TRACK DOWNLOAD] API returned unsuccessful response');
        return false;
      }
    } catch (error) {
      console.error('❌ [TRACK DOWNLOAD] Error tracking download:', error);
      return false;
    }
  }

  // Check if content is already downloaded by user
  async isContentDownloaded(userId: string, resourceType: string, resourceId: string): Promise<boolean> {
    try {
      const downloads = await this.getUserDownloads(userId, { type: resourceType as any });
      return downloads.downloads.some(download => download.resourceId === resourceId);
    } catch (error) {
      console.error('Error checking if content is downloaded:', error);
      return false;
    }
  }

  // Get recent downloads (last 10)
  async getRecentDownloads(userId: string, limit: number = 10): Promise<DownloadedContent[]> {
    try {
      const downloads = await this.getUserDownloads(userId, { limit });
      return downloads.downloads.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent downloads:', error);
      return [];
    }
  }

  // Get downloads by type
  async getDownloadsByType(userId: string, type: 'TEMPLATE' | 'VIDEO' | 'GREETING' | 'CONTENT'): Promise<DownloadedContent[]> {
    try {
      const downloads = await this.getUserDownloads(userId, { type });
      return downloads.downloads;
    } catch (error) {
      console.error('Error getting downloads by type:', error);
      return [];
    }
  }

  // Fetch actual resource data from respective APIs
  private async fetchResourceData(resourceType: string, resourceId: string): Promise<{ thumbnail: string; title: string; category: string } | null> {
    try {
      // Fetch from respective API based on resource type
      switch (resourceType) {
        case 'POSTER':
        case 'TEMPLATE': {
          // Try to fetch all greeting templates and find by ID
          const response = await api.get('/api/mobile/greetings/templates');
          if (response.data.success) {
            const allImages = [
              ...(response.data.data?.templates || []),
              ...(response.data.data?.businessCategoryImages || [])
            ];
            
            const resource = allImages.find((img: any) => img.id === resourceId);
            if (resource) {
              return {
                thumbnail: resource.thumbnailUrl || resource.url || resource.imageUrl,
                title: resource.title || 'Template',
                category: resource.business_categories?.name || resource.category || 'General'
              };
            }
          }
          break;
        }
        case 'GREETING': {
          // Fetch all greeting templates and find by ID
          const response = await api.get('/api/mobile/greetings/templates');
          if (response.data.success) {
            const allImages = [
              ...(response.data.data?.templates || []),
              ...(response.data.data?.businessCategoryImages || [])
            ];
            
            const resource = allImages.find((img: any) => img.id === resourceId);
            if (resource) {
              return {
                thumbnail: resource.thumbnailUrl || resource.url || resource.imageUrl,
                title: resource.title || 'Greeting',
                category: resource.business_categories?.name || resource.category || 'Greetings'
              };
            }
          }
          break;
        }
        case 'VIDEO': {
          // Try to fetch video data from home API
          try {
            const homeApi = (await import('./homeApi')).default;
            const videosResponse = await homeApi.getVideoContent({ limit: 100 });
            if (videosResponse.success) {
              const video = videosResponse.data.find((v: any) => v.id === resourceId);
              if (video) {
                return {
                  thumbnail: video.thumbnail,
                  title: video.title || 'Video',
                  category: video.category || 'Videos'
                };
              }
            }
          } catch (error) {
            console.error('Error fetching video:', error);
          }
          break;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching resource data:', error);
      return null;
    }
  }

  // Helper methods for resource information
  private getResourceTitle(resourceType: string, resourceId: string): string {
    // This would typically fetch from the respective resource APIs
    // For now, return a generic title
    switch (resourceType) {
      case 'POSTER':
      case 'TEMPLATE':
        return `Template ${resourceId.substring(0, 8)}`;
      case 'VIDEO':
        return `Video ${resourceId.substring(0, 8)}`;
      case 'GREETING':
        return `Greeting ${resourceId.substring(0, 8)}`;
      case 'CONTENT':
        return `Content ${resourceId.substring(0, 8)}`;
      default:
        return `Downloaded ${resourceType}`;
    }
  }

  private getResourceThumbnail(resourceType: string, resourceId: string): string {
    // This would typically fetch from the respective resource APIs
    // For now, return a placeholder
    return 'https://via.placeholder.com/150x200/4A90E2/FFFFFF?text=Download';
  }

  private getResourceCategory(resourceType: string, resourceId: string): string {
    // This would typically fetch from the respective resource APIs
    // For now, return a generic category
    switch (resourceType) {
      case 'POSTER':
      case 'TEMPLATE':
        return 'Templates';
      case 'VIDEO':
        return 'Videos';
      case 'GREETING':
        return 'Greetings';
      case 'CONTENT':
        return 'Content';
      default:
        return 'Other';
    }
  }

  // Mock data methods for fallback
  private getMockDownloads(filters?: DownloadFilters): any {
    const mockDownloads = [
      {
        id: '1',
        resourceType: 'TEMPLATE',
        resourceId: 'template-1',
        fileUrl: 'https://example.com/template1.jpg',
        createdAt: new Date().toISOString(),
        title: 'Business Template',
        thumbnail: 'https://via.placeholder.com/150x200/4A90E2/FFFFFF?text=Template',
        category: 'Business'
      },
      {
        id: '2',
        resourceType: 'VIDEO',
        resourceId: 'video-1',
        fileUrl: 'https://example.com/video1.mp4',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        title: 'Event Video',
        thumbnail: 'https://via.placeholder.com/150x200/E74C3C/FFFFFF?text=Video',
        category: 'Events'
      },
      {
        id: '3',
        resourceType: 'GREETING',
        resourceId: 'greeting-1',
        fileUrl: 'https://example.com/greeting1.jpg',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        title: 'Birthday Greeting',
        thumbnail: 'https://via.placeholder.com/150x200/27AE60/FFFFFF?text=Greeting',
        category: 'Birthday'
      }
    ];

    let filtered = mockDownloads;
    if (filters?.type) {
      filtered = filtered.filter(download => download.resourceType === filters.type);
    }

    return {
      downloads: filtered,
      statistics: {
        total: filtered.length,
        byType: {
          templates: filtered.filter(d => d.resourceType === 'TEMPLATE').length,
          videos: filtered.filter(d => d.resourceType === 'VIDEO').length,
          greetings: filtered.filter(d => d.resourceType === 'GREETING').length,
          content: filtered.filter(d => d.resourceType === 'CONTENT').length
        }
      },
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / (filters?.limit || 20))
      }
    };
  }

  private getMockDownloadStats(): DownloadStats {
    // Return empty stats for new users instead of mock data
    return {
      total: 0,
      recent: 0,
      byType: {
        templates: 0,
        videos: 0,
        greetings: 0,
        content: 0
      },
      mostDownloadedType: null,
      mostDownloadedCount: 0
    };
  }
}

export default new DownloadTrackingService();
