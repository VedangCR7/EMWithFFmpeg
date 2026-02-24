import api from './api';

// Types for templates and banners
export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  thumbnailUrl?: string; // Add thumbnailUrl for better compatibility
  imageUrl: string;
  category: 'free' | 'premium';
  type: 'daily' | 'festival' | 'special';
  language: string;
  tags: string[];
  downloads: number;
  createdAt: string;
}

export interface TemplateFilters {
  type?: 'daily' | 'festival' | 'special' | 'all';
  category?: 'free' | 'premium' | 'all';
  language?: string;
  search?: string;
  page?: number;
  limit?: number;
  categoryId?: string;
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
  private readonly BASE_URL = 'https://eventmarketersbackend.onrender.com';

  /**
   * Convert relative image URLs to absolute URLs
   */
  private convertToAbsoluteUrl(url: string | undefined | null): string | undefined {
    if (!url) {
      return undefined;
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

  // Get templates (optimized logging)
  async getTemplates(filters?: TemplateFilters): Promise<TemplatesResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.language) params.append('language', filters.language);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.categoryId) params.append('categoryId', filters.categoryId);

      console.log('📡 [TEMPLATES API] Fetching templates...');
      const response = await api.get(`/api/mobile/templates?${params.toString()}`);
      
      if (response.data.success) {
        // Map backend response to frontend format and convert URLs (optimized - no per-item logging)
        const mappedTemplates = response.data.data.templates.map((backendTemplate: any) => {
          const absoluteUrl = this.convertToAbsoluteUrl(backendTemplate.imageUrl);
          
          // Handle tags - backend returns array, not string
          let tags: string[] = [];
          if (Array.isArray(backendTemplate.tags)) {
            tags = backendTemplate.tags;
          } else if (typeof backendTemplate.tags === 'string') {
            try {
              tags = JSON.parse(backendTemplate.tags);
            } catch (e) {
              tags = [];
            }
          }
          
          return {
            id: backendTemplate.id,
            name: backendTemplate.title,
            description: backendTemplate.description || '',
            thumbnail: absoluteUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop',
            imageUrl: absoluteUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
            category: (backendTemplate.isPremium ? 'premium' : 'free') as 'free' | 'premium',
            type: backendTemplate.type || 'daily',
            language: backendTemplate.language || 'English',
            tags: tags,
            downloads: backendTemplate.downloads || 0,
            createdAt: backendTemplate.createdAt,
          };
        });

        console.log(`✅ [TEMPLATES API] Fetched ${mappedTemplates.length} templates`);

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
      console.error('❌ [TEMPLATES API] Error:', error);
      console.log('⚠️ [TEMPLATES API] Using mock templates');
      return this.getMockTemplates(filters);
    }
  }

  // Get template by ID (mock data only - API endpoint removed)
  async getTemplateById(id: string): Promise<TemplateResponse> {
    console.log('📡 [TEMPLATE BY ID] Using mock data (API endpoint removed)');
    return this.getMockTemplateById(id);
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

  // Get template categories (mock data only - API endpoint removed)
  async getTemplateCategories(): Promise<{ success: boolean; data: string[]; message: string }> {
    console.log('📡 [TEMPLATE CATEGORIES] Using mock data (API endpoint removed)');
    return this.getMockTemplateCategories();
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

        downloads: 189,
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

        downloads: 234,
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

        downloads: 156,
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

        downloads: 189,
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

        downloads: 234,
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
