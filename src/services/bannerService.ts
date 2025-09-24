import templatesService from './templates';

export interface Banner {
  id: string;
  title: string;
  description?: string;
  templateId: string;
  template: any;
  customizations: any;
  imageUrl: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerRequest {
  templateId: string;
  title: string;
  description?: string;
  customizations: any;
}

export interface UpdateBannerRequest {
  title?: string;
  description?: string;
  customizations?: any;
  status?: 'draft' | 'published' | 'archived';
}

class BannerService {
  private cache: { [key: string]: { data: any; timestamp: number } } = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(key: string): boolean {
    const cached = this.cache[key];
    return cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION;
  }

  // Create a new banner (mock implementation)
  async createBanner(bannerData: CreateBannerRequest): Promise<Banner> {
    const mockBanner: Banner = {
      id: 'banner-' + Date.now(),
      title: bannerData.title,
      description: bannerData.description,
      templateId: bannerData.templateId,
      template: { id: bannerData.templateId, title: 'Mock Template', description: '', imageUrl: '', category: 'free', language: 'English', tags: [], type: 'daily', createdAt: '', updatedAt: '' },
      customizations: bannerData.customizations,
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return mockBanner;
  }

  // Update banner (mock implementation)
  async updateBanner(bannerId: string, updates: UpdateBannerRequest): Promise<Banner> {
    const mockBanner: Banner = {
      id: bannerId,
      title: updates.title || 'Updated Banner',
      description: updates.description,
      templateId: '1',
      template: { id: '1', title: 'Mock Template', description: '', imageUrl: '', category: 'free', language: 'English', tags: [], type: 'daily', createdAt: '', updatedAt: '' },
      customizations: updates.customizations || {},
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
      status: updates.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return mockBanner;
  }

  // Get user's banners (mock data)
  async getUserBanners(): Promise<Banner[]> {
    return [];
  }

  // Get banner by ID (mock data)
  async getBannerById(bannerId: string): Promise<Banner | null> {
    return null;
  }

  // Delete banner (mock implementation)
  async deleteBanner(bannerId: string): Promise<void> {
    console.log('Mock banner deleted:', bannerId);
  }

  // Get banner image URL (mock data)
  async getBannerImage(bannerId: string): Promise<string | null> {
    return 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop';
  }

  // Publish banner (mock implementation)
  async publishBanner(bannerId: string): Promise<Banner> {
    const mockBanner: Banner = {
      id: bannerId,
      title: 'Published Banner',
      description: 'Mock published banner',
      templateId: '1',
      template: { id: '1', title: 'Mock Template', description: '', imageUrl: '', category: 'free', language: 'English', tags: [], type: 'daily', createdAt: '', updatedAt: '' },
      customizations: {},
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return mockBanner;
  }

  // Archive banner (mock implementation)
  async archiveBanner(bannerId: string): Promise<Banner> {
    const mockBanner: Banner = {
      id: bannerId,
      title: 'Archived Banner',
      description: 'Mock archived banner',
      templateId: '1',
      template: { id: '1', title: 'Mock Template', description: '', imageUrl: '', category: 'free', language: 'English', tags: [], type: 'daily', createdAt: '', updatedAt: '' },
      customizations: {},
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
      status: 'archived',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return mockBanner;
  }

  // Duplicate banner
  async duplicateBanner(bannerId: string, newTitle?: string): Promise<Banner> {
    try {
      const originalBanner = await this.getBannerById(bannerId);
      if (!originalBanner) {
        throw new Error('Banner not found');
      }

      const newBannerData: CreateBannerRequest = {
        templateId: originalBanner.templateId,
        title: newTitle || `${originalBanner.title} (Copy)`,
        description: originalBanner.description,
        customizations: originalBanner.customizations,
      };

      return await this.createBanner(newBannerData);
    } catch (error) {
      console.error('Error duplicating banner:', error);
      throw error;
    }
  }

  // Get banners by status
  async getBannersByStatus(status: 'draft' | 'published' | 'archived'): Promise<Banner[]> {
    try {
      const allBanners = await this.getUserBanners();
      return allBanners.filter(banner => banner.status === status);
    } catch (error) {
      console.error('Error fetching banners by status:', error);
      return [];
    }
  }

  // Search banners by title or description
  async searchBanners(searchTerm: string): Promise<Banner[]> {
    try {
      const allBanners = await this.getUserBanners();
      const term = searchTerm.toLowerCase();
      
      return allBanners.filter(banner => 
        banner.title.toLowerCase().includes(term) ||
        (banner.description && banner.description.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error('Error searching banners:', error);
      return [];
    }
  }

  // Get banner statistics
  async getBannerStats(): Promise<{
    total: number;
    drafts: number;
    published: number;
    archived: number;
  }> {
    try {
      const allBanners = await this.getUserBanners();
      
      return {
        total: allBanners.length,
        drafts: allBanners.filter(b => b.status === 'draft').length,
        published: allBanners.filter(b => b.status === 'published').length,
        archived: allBanners.filter(b => b.status === 'archived').length,
      };
    } catch (error) {
      console.error('Error getting banner stats:', error);
      return {
        total: 0,
        drafts: 0,
        published: 0,
        archived: 0,
      };
    }
  }

  // Create banner from template with customizations
  async createBannerFromTemplate(
    templateId: string,
    customizations: any,
    title?: string
  ): Promise<Banner> {
    try {
      // Get template details
      const template = await templatesService.getTemplateById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const bannerData: CreateBannerRequest = {
        templateId,
        title: title || template.title,
        description: template.description,
        customizations,
      };

      return await this.createBanner(bannerData);
    } catch (error) {
      console.error('Error creating banner from template:', error);
      throw error;
    }
  }

  // Export banner as image (mock implementation)
  async exportBannerAsImage(bannerId: string, format: 'png' | 'jpg' | 'pdf' = 'png'): Promise<string> {
    return 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop';
  }

  // Share banner (mock implementation)
  async shareBanner(bannerId: string, shareOptions: {
    platform?: 'social' | 'email' | 'link';
    message?: string;
  }): Promise<{ shareUrl: string; success: boolean }> {
    return {
      shareUrl: 'https://example.com/share/banner-' + bannerId,
      success: true
    };
  }

  // Clear cache method
  clearCache(): void {
    this.cache = {};
  }
}

export default new BannerService(); 