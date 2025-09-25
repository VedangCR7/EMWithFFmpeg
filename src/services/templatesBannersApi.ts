import api from './api';

// Types for templates and banners
export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  imageUrl: string;
  category: 'free' | 'premium';
  type: 'daily' | 'festival' | 'special';
  language: string;
  tags: string[];
  likes: number;
  downloads: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface TemplateFilters {
  type?: 'daily' | 'festival' | 'special' | 'all';
  category?: 'free' | 'premium' | 'all';
  language?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface Banner {
  id: string;
  templateId: string;
  title: string;
  description: string;
  customizations: {
    text?: string;
    colors?: string[];
    fonts?: string;
    images?: string[];
  };
  language: string;
  status: 'draft' | 'published' | 'archived';
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerRequest {
  templateId: string;
  title: string;
  description: string;
  customizations: {
    text?: string;
    colors?: string[];
    fonts?: string;
    images?: string[];
  };
  language: string;
}

export interface UpdateBannerRequest {
  title?: string;
  description?: string;
  customizations?: {
    text?: string;
    colors?: string[];
    fonts?: string;
    images?: string[];
  };
  status?: 'draft' | 'published' | 'archived';
}

export interface BannerFilters {
  status?: 'draft' | 'published' | 'archived' | 'all';
  page?: number;
  limit?: number;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface TemplatesResponse {
  success: boolean;
  data: {
    templates: Template[];
    total: number;
    page: number;
    limit: number;
  };
  message: string;
}

export interface TemplateResponse {
  success: boolean;
  data: Template;
  message: string;
}

export interface LanguagesResponse {
  success: boolean;
  data: Language[];
  message: string;
}

export interface BannerResponse {
  success: boolean;
  data: Banner;
  message: string;
}

export interface BannersResponse {
  success: boolean;
  data: {
    banners: Banner[];
    total: number;
    page: number;
    limit: number;
  };
  message: string;
}

export interface ShareRequest {
  platform: string;
  message: string;
}

// Templates and Banners API service
class TemplatesBannersApiService {
  // Get templates
  async getTemplates(filters?: TemplateFilters): Promise<TemplatesResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.language) params.append('language', filters.language);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/api/mobile/templates?${params.toString()}`);
      
      if (response.data.success) {
        // Map backend response to frontend format
        const mappedTemplates = response.data.data.templates.map((backendTemplate: any) => ({
          id: backendTemplate.id,
          name: backendTemplate.title, // Backend uses 'title', frontend expects 'name'
          description: backendTemplate.description || '',
          thumbnail: backendTemplate.imageUrl,
          imageUrl: backendTemplate.imageUrl,
          category: backendTemplate.isPremium ? 'premium' : 'free', // Map isPremium to category
          type: backendTemplate.type,
          language: backendTemplate.language,
          tags: backendTemplate.tags ? JSON.parse(backendTemplate.tags) : [],
          likes: backendTemplate.likes || 0,
          downloads: backendTemplate.downloads || 0,
          isLiked: false, // This would need to be determined by checking user likes
          createdAt: backendTemplate.createdAt,
        }));

        return {
          success: true,
          data: {
            templates: mappedTemplates,
            total: response.data.data.pagination.total,
            page: response.data.data.pagination.page,
            limit: response.data.data.pagination.limit,
          },
          message: response.data.message,
        };
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.log('Using mock templates due to API error:', error);
      return this.getMockTemplates(filters);
    }
  }

  // Get template by ID
  async getTemplateById(id: string): Promise<TemplateResponse> {
    try {
      const response = await api.get(`/api/mobile/templates/${id}`);
      
      if (response.data.success) {
        const backendTemplate = response.data.data;
        const mappedTemplate = {
          id: backendTemplate.id,
          name: backendTemplate.title, // Backend uses 'title', frontend expects 'name'
          description: backendTemplate.description || '',
          thumbnail: backendTemplate.imageUrl,
          imageUrl: backendTemplate.imageUrl,
          category: backendTemplate.isPremium ? 'premium' : 'free', // Map isPremium to category
          type: backendTemplate.type,
          language: backendTemplate.language,
          tags: backendTemplate.tags ? JSON.parse(backendTemplate.tags) : [],
          likes: backendTemplate.likes || 0,
          downloads: backendTemplate.downloads || 0,
          isLiked: false, // This would need to be determined by checking user likes
          createdAt: backendTemplate.createdAt,
        };

        return {
          success: true,
          data: mappedTemplate,
          message: response.data.message,
        };
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.log('Using mock template details due to API error:', error);
      return this.getMockTemplateById(id);
    }
  }

  // Get available languages
  async getLanguages(): Promise<LanguagesResponse> {
    try {
      const response = await api.get('/api/mobile/templates/languages');
      
      if (response.data.success) {
        // Map backend language format to frontend format
        const mappedLanguages = response.data.data.map((backendLang: any) => ({
          code: backendLang.code || backendLang.name?.toLowerCase() || 'en',
          name: backendLang.name || backendLang.code || 'English',
          nativeName: backendLang.nativeName || backendLang.name || 'English',
        }));

        return {
          success: true,
          data: mappedLanguages,
          message: response.data.message,
        };
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.log('Using mock languages due to API error:', error);
      return this.getMockLanguages();
    }
  }

  // Create banner
  async createBanner(data: CreateBannerRequest): Promise<BannerResponse> {
    try {
      const response = await api.post('/api/mobile/banners', data);
      return response.data;
    } catch (error) {
      console.error('Create banner error:', error);
      throw error;
    }
  }

  // Update banner
  async updateBanner(id: string, data: UpdateBannerRequest): Promise<BannerResponse> {
    try {
      const response = await api.put(`/api/mobile/banners/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update banner error:', error);
      throw error;
    }
  }

  // Get user banners
  async getUserBanners(filters?: BannerFilters): Promise<BannersResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/api/mobile/banners/my?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Get user banners error:', error);
      throw error;
    }
  }

  // Get banner by ID
  async getBannerById(id: string): Promise<BannerResponse> {
    try {
      const response = await api.get(`/api/mobile/banners/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get banner by ID error:', error);
      throw error;
    }
  }

  // Delete banner
  async deleteBanner(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/api/mobile/banners/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete banner error:', error);
      throw error;
    }
  }

  // Publish banner
  async publishBanner(id: string): Promise<BannerResponse> {
    try {
      const response = await api.post(`/api/mobile/banners/${id}/publish`);
      return response.data;
    } catch (error) {
      console.error('Publish banner error:', error);
      throw error;
    }
  }

  // Archive banner
  async archiveBanner(id: string): Promise<BannerResponse> {
    try {
      const response = await api.post(`/api/mobile/banners/${id}/archive`);
      return response.data;
    } catch (error) {
      console.error('Archive banner error:', error);
      throw error;
    }
  }

  // Export banner
  async exportBanner(id: string, format: 'png' | 'jpg' | 'pdf' = 'png', quality: number = 90): Promise<Blob> {
    try {
      const response = await api.get(`/api/mobile/banners/${id}/export`, {
        params: { format, quality },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Export banner error:', error);
      throw error;
    }
  }

  // Share banner
  async shareBanner(id: string, data: ShareRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/api/mobile/banners/${id}/share`, data);
      return response.data;
    } catch (error) {
      console.error('Share banner error:', error);
      throw error;
    }
  }

  // Like template
  async likeTemplate(id: string): Promise<{ success: boolean; message: string; isLiked: boolean }> {
    try {
      const response = await api.post(`/api/mobile/templates/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Like template error:', error);
      throw error;
    }
  }

  // Unlike template
  async unlikeTemplate(id: string): Promise<{ success: boolean; message: string; isLiked: boolean }> {
    try {
      const response = await api.delete(`/api/mobile/templates/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Unlike template error:', error);
      throw error;
    }
  }

  // Download template
  async downloadTemplate(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/api/mobile/templates/${id}/download`);
      return response.data;
    } catch (error) {
      console.error('Download template error:', error);
      throw error;
    }
  }

  // Get template categories
  async getTemplateCategories(): Promise<{ success: boolean; data: string[]; message: string }> {
    try {
      const response = await api.get('/api/mobile/templates/categories');
      
      if (response.data.success) {
        // Map backend category format to frontend format (array of category names)
        const mappedCategories = response.data.data.map((backendCategory: any) => 
          backendCategory.name || backendCategory.slug || 'Unknown'
        );

        return {
          success: true,
          data: mappedCategories,
          message: response.data.message,
        };
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.log('Using mock template categories due to API error:', error);
      return this.getMockTemplateCategories();
    }
  }

  // ============================================================================
  // MOCK DATA METHODS (FALLBACK WHEN SERVER IS NOT AVAILABLE)
  // ============================================================================

  private getMockTemplates(filters?: TemplateFilters): TemplatesResponse {
    const mockData: Template[] = [
      {
        id: 'template-1',
        name: 'Daily Greeting Template',
        description: 'Beautiful daily greeting template for social media',
        thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
        category: 'free',
        type: 'daily',
        language: 'en',
        tags: ['greeting', 'daily', 'social'],
        likes: 245,
        downloads: 189,
        isLiked: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'template-2',
        name: 'Festival Celebration',
        description: 'Colorful festival celebration template',
        thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&h=200&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop',
        category: 'premium',
        type: 'festival',
        language: 'en',
        tags: ['festival', 'celebration', 'colorful'],
        likes: 312,
        downloads: 234,
        isLiked: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'template-3',
        name: 'Special Event Banner',
        description: 'Professional banner for special events',
        thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300&h=200&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=400&fit=crop',
        category: 'free',
        type: 'special',
        language: 'en',
        tags: ['event', 'banner', 'professional'],
        likes: 189,
        downloads: 156,
        isLiked: false,
        createdAt: new Date().toISOString(),
      },
    ];

    let filteredData = mockData;

    // Apply filters
    if (filters?.type && filters.type !== 'all') {
      filteredData = filteredData.filter(template => template.type === filters.type);
    }

    if (filters?.category && filters.category !== 'all') {
      filteredData = filteredData.filter(template => template.category === filters.category);
    }

    if (filters?.language) {
      filteredData = filteredData.filter(template => template.language === filters.language);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        templates: paginatedData,
        total: filteredData.length,
        page,
        limit,
      },
      message: 'Mock templates retrieved successfully',
    };
  }

  private getMockTemplateById(id: string): TemplateResponse {
    const mockData: Template[] = [
      {
        id: 'template-1',
        name: 'Daily Greeting Template',
        description: 'Beautiful daily greeting template for social media',
        thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
        category: 'free',
        type: 'daily',
        language: 'en',
        tags: ['greeting', 'daily', 'social'],
        likes: 245,
        downloads: 189,
        isLiked: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'template-2',
        name: 'Festival Celebration',
        description: 'Colorful festival celebration template',
        thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&h=200&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop',
        category: 'premium',
        type: 'festival',
        language: 'en',
        tags: ['festival', 'celebration', 'colorful'],
        likes: 312,
        downloads: 234,
        isLiked: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const template = mockData.find(t => t.id === id);
    
    if (!template) {
      return {
        success: false,
        data: {} as Template,
        message: 'Template not found',
      };
    }

    return {
      success: true,
      data: template,
      message: 'Mock template details retrieved successfully',
    };
  }

  private getMockLanguages(): LanguagesResponse {
    const mockLanguages: Language[] = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    ];

    return {
      success: true,
      data: mockLanguages,
      message: 'Mock languages retrieved successfully',
    };
  }

  private getMockTemplateCategories(): { success: boolean; data: string[]; message: string } {
    const mockCategories = [
      'Business',
      'Festival',
      'Daily',
      'Special',
      'Marketing',
      'Social Media',
      'Events',
      'Celebration',
      'Professional',
      'Creative',
    ];

    return {
      success: true,
      data: mockCategories,
      message: 'Mock template categories retrieved successfully',
    };
  }
}

export default new TemplatesBannersApiService();
