import api from './api';

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
  // Get all downloads for a user
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
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/api/mobile/users/${userId}/downloads/all?${params.toString()}`);
      
      if (response.data.success) {
        // Map backend response to frontend format
        const mappedDownloads = response.data.data.downloads.map((download: any) => ({
          id: download.id,
          resourceType: download.resourceType,
          resourceId: download.resourceId,
          fileUrl: download.fileUrl,
          createdAt: download.createdAt,
          title: this.getResourceTitle(download.resourceType, download.resourceId),
          thumbnail: this.getResourceThumbnail(download.resourceType, download.resourceId),
          category: this.getResourceCategory(download.resourceType, download.resourceId)
        }));

        return {
          downloads: mappedDownloads,
          statistics: response.data.data.statistics,
          pagination: response.data.data.pagination
        };
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.log('Using mock downloads due to API error:', error);
      return this.getMockDownloads(filters);
    }
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

  // Track a download (this would be called when user downloads content)
  async trackDownload(userId: string, resourceType: string, resourceId: string, fileUrl: string): Promise<boolean> {
    try {
      // This would typically be called automatically by the download APIs
      // But we can also provide a direct tracking method if needed
      const response = await api.post('/api/mobile/downloads/track', {
        mobileUserId: userId,
        resourceType: resourceType.toUpperCase(),
        resourceId,
        fileUrl
      });
      
      return response.data.success;
    } catch (error) {
      console.error('Error tracking download:', error);
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

  // Helper methods for resource information
  private getResourceTitle(resourceType: string, resourceId: string): string {
    // This would typically fetch from the respective resource APIs
    // For now, return a generic title
    switch (resourceType) {
      case 'TEMPLATE':
        return `Template ${resourceId}`;
      case 'VIDEO':
        return `Video ${resourceId}`;
      case 'GREETING':
        return `Greeting ${resourceId}`;
      case 'CONTENT':
        return `Content ${resourceId}`;
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
    return {
      total: 15,
      recent: 3,
      byType: {
        templates: 8,
        videos: 4,
        greetings: 2,
        content: 1
      },
      mostDownloadedType: 'TEMPLATE',
      mostDownloadedCount: 8
    };
  }
}

export default new DownloadTrackingService();
