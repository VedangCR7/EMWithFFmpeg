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

      const response = await api.get(`/templates?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Get templates error:', error);
      throw error;
    }
  }

  // Get template by ID
  async getTemplateById(id: string): Promise<TemplateResponse> {
    try {
      const response = await api.get(`/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get template by ID error:', error);
      throw error;
    }
  }

  // Get available languages
  async getLanguages(): Promise<LanguagesResponse> {
    try {
      const response = await api.get('/templates/languages');
      return response.data;
    } catch (error) {
      console.error('Get languages error:', error);
      throw error;
    }
  }

  // Create banner
  async createBanner(data: CreateBannerRequest): Promise<BannerResponse> {
    try {
      const response = await api.post('/banners', data);
      return response.data;
    } catch (error) {
      console.error('Create banner error:', error);
      throw error;
    }
  }

  // Update banner
  async updateBanner(id: string, data: UpdateBannerRequest): Promise<BannerResponse> {
    try {
      const response = await api.put(`/banners/${id}`, data);
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

      const response = await api.get(`/banners/my?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Get user banners error:', error);
      throw error;
    }
  }

  // Get banner by ID
  async getBannerById(id: string): Promise<BannerResponse> {
    try {
      const response = await api.get(`/banners/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get banner by ID error:', error);
      throw error;
    }
  }

  // Delete banner
  async deleteBanner(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/banners/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete banner error:', error);
      throw error;
    }
  }

  // Publish banner
  async publishBanner(id: string): Promise<BannerResponse> {
    try {
      const response = await api.post(`/banners/${id}/publish`);
      return response.data;
    } catch (error) {
      console.error('Publish banner error:', error);
      throw error;
    }
  }

  // Archive banner
  async archiveBanner(id: string): Promise<BannerResponse> {
    try {
      const response = await api.post(`/banners/${id}/archive`);
      return response.data;
    } catch (error) {
      console.error('Archive banner error:', error);
      throw error;
    }
  }

  // Export banner
  async exportBanner(id: string, format: 'png' | 'jpg' | 'pdf' = 'png', quality: number = 90): Promise<Blob> {
    try {
      const response = await api.get(`/banners/${id}/export`, {
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
      const response = await api.post(`/banners/${id}/share`, data);
      return response.data;
    } catch (error) {
      console.error('Share banner error:', error);
      throw error;
    }
  }

  // Like template
  async likeTemplate(id: string): Promise<{ success: boolean; message: string; isLiked: boolean }> {
    try {
      const response = await api.post(`/templates/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Like template error:', error);
      throw error;
    }
  }

  // Download template
  async downloadTemplate(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/templates/${id}/download`);
      return response.data;
    } catch (error) {
      console.error('Download template error:', error);
      throw error;
    }
  }

  // Get template categories
  async getTemplateCategories(): Promise<{ success: boolean; data: string[]; message: string }> {
    try {
      const response = await api.get('/templates/categories');
      return response.data;
    } catch (error) {
      console.error('Get template categories error:', error);
      throw error;
    }
  }
}

export default new TemplatesBannersApiService();
