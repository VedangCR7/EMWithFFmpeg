

import { templatesBannersApi, type Template as ApiTemplate, type TemplateFilters as ApiTemplateFilters } from './templatesBannersApi';


export interface Template {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: 'free' | 'premium';
  language: string;
  tags: string[];
  type: 'daily' | 'festival' | 'special';
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFilters {
  category?: 'free' | 'premium' | 'all';
  language?: string;
  search?: string;
  type?: 'daily' | 'festival' | 'special' | 'all';
}

export interface Banner {
  id: string;
  title: string;
  description?: string;
  templateId: string;
  template: Template;
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

class TemplateService {
  private cache: { [key: string]: { data: any; timestamp: number } } = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(key: string): boolean {
    const cached = this.cache[key];
    return cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION;
  }

  // Fetch all templates with optional filtering (API first, mock fallback)
  async getTemplates(filters?: TemplateFilters): Promise<Template[]> {
    try {
      // Try API first
      const apiFilters: ApiTemplateFilters = {
        type: filters?.type,
        category: filters?.category,
        language: filters?.language,
        search: filters?.search,
      };
      
      const response = await templatesBannersApi.getTemplates(apiFilters);
      
      if (response.success) {
        // Convert API templates to local format
        const templates: Template[] = response.data.templates.map((apiTemplate: ApiTemplate) => ({
          id: apiTemplate.id,
          title: apiTemplate.name,
          description: apiTemplate.description,
          imageUrl: apiTemplate.imageUrl,
          category: apiTemplate.category,
          language: apiTemplate.language,
          tags: apiTemplate.tags,
          type: apiTemplate.type,
          createdAt: apiTemplate.createdAt,
          updatedAt: apiTemplate.createdAt, // API doesn't have updatedAt
        }));
        
        return templates;
      } else {
        throw new Error('Failed to fetch templates from API');
      }
    } catch (error) {
      console.error('API get templates failed, falling back to mock:', error);
      // Fallback to mock data
      return this.getMockTemplates(filters);
    }
  }

  // Get template by ID (API first, mock fallback)
  async getTemplateById(id: string): Promise<Template | null> {
    try {
      // Try API first
      const response = await templatesBannersApi.getTemplateById(id);
      
      if (response.success) {
        // Convert API template to local format
        const apiTemplate = response.data;
        const template: Template = {
          id: apiTemplate.id,
          title: apiTemplate.name,
          description: apiTemplate.description,
          imageUrl: apiTemplate.imageUrl,
          category: apiTemplate.category,
          language: apiTemplate.language,
          tags: apiTemplate.tags,
          type: apiTemplate.type,
          createdAt: apiTemplate.createdAt,
          updatedAt: apiTemplate.createdAt, // API doesn't have updatedAt
        };
        
        return template;
      } else {
        throw new Error('Failed to fetch template from API');
      }
    } catch (error) {
      console.error('API get template by ID failed, falling back to mock:', error);
      // Fallback to mock data
      const mockTemplates = this.getMockTemplates();
      return mockTemplates.find(template => template.id === id) || null;
    }
  }

  // Get available languages for filtering (API first, mock fallback)
  async getAvailableLanguages(): Promise<string[]> {
    try {
      // Try API first
      const response = await templatesBannersApi.getLanguages();
      
      if (response.success) {
        return response.data.map(lang => lang.name);
      } else {
        throw new Error('Failed to fetch languages from API');
      }
    } catch (error) {
      console.error('API get languages failed, falling back to mock:', error);
      // Fallback to mock data
      return ['English', 'Spanish', 'French', 'German', 'Italian'];
    }
  }

  // Create a new banner (mock implementation)
  async createBanner(bannerData: CreateBannerRequest): Promise<Banner> {
    const mockBanner: Banner = {
      id: 'banner-' + Date.now(),
      title: bannerData.title,
      description: bannerData.description,
      templateId: bannerData.templateId,
      template: this.getMockTemplates().find(t => t.id === bannerData.templateId) || this.getMockTemplates()[0],
      customizations: bannerData.customizations,
      imageUrl: this.getMockTemplates().find(t => t.id === bannerData.templateId)?.imageUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
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
      template: this.getMockTemplates()[0],
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

  // Mock data for development
  private getMockTemplates(filters?: TemplateFilters): Template[] {
    const mockTemplates: Template[] = [
      {
        id: '1',
        title: 'Modern Event Flyer',
        description: 'Clean and professional event flyer template with modern design elements',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=400&fit=crop',
        category: 'free',
        language: 'English',
        type: 'daily',
        tags: ['flyer', 'event', 'modern'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        title: 'Premium Business Card',
        description: 'Elegant business card design for professionals and executives',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300&h=400&fit=crop',
        category: 'premium',
        language: 'English',
        type: 'special',
        tags: ['business', 'card', 'premium'],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
      {
        id: '3',
        title: 'Social Media Post',
        description: 'Eye-catching social media template for brand promotion',
        imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&h=400&fit=crop',
        category: 'free',
        language: 'Spanish',
        type: 'daily',
        tags: ['social', 'media', 'post'],
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      },
      {
        id: '4',
        title: 'Wedding Invitation',
        description: 'Beautiful wedding invitation template with elegant typography',
        imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=300&h=400&fit=crop',
        category: 'premium',
        language: 'English',
        type: 'festival',
        tags: ['wedding', 'invitation', 'elegant'],
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-04T00:00:00Z',
      },
      {
        id: '5',
        title: 'Restaurant Menu',
        description: 'Professional restaurant menu template with food photography',
        imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&h=400&fit=crop',
        category: 'free',
        language: 'French',
        type: 'daily',
        tags: ['restaurant', 'menu', 'food'],
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-01-05T00:00:00Z',
      },
      {
        id: '6',
        title: 'Product Catalog',
        description: 'Comprehensive product catalog template for retail businesses',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=400&fit=crop',
        category: 'premium',
        language: 'German',
        type: 'special',
        tags: ['product', 'catalog', 'retail'],
        createdAt: '2024-01-06T00:00:00Z',
        updatedAt: '2024-01-06T00:00:00Z',
      },
      {
        id: '7',
        title: 'Conference Banner',
        description: 'Professional conference banner template for corporate events',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=400&fit=crop',
        category: 'free',
        language: 'English',
        type: 'special',
        tags: ['conference', 'banner', 'corporate'],
        createdAt: '2024-01-07T00:00:00Z',
        updatedAt: '2024-01-07T00:00:00Z',
      },
      {
        id: '8',
        title: 'Real Estate Flyer',
        description: 'Attractive real estate flyer template for property listings',
        imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300&h=400&fit=crop',
        category: 'premium',
        language: 'English',
        type: 'daily',
        tags: ['real estate', 'property', 'listing'],
        createdAt: '2024-01-08T00:00:00Z',
        updatedAt: '2024-01-08T00:00:00Z',
      },
      {
        id: '9',
        title: 'Music Festival Poster',
        description: 'Vibrant music festival poster template with dynamic design',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=400&fit=crop',
        category: 'free',
        language: 'Spanish',
        type: 'festival',
        tags: ['music', 'festival', 'poster'],
        createdAt: '2024-01-09T00:00:00Z',
        updatedAt: '2024-01-09T00:00:00Z',
      },
      {
        id: '10',
        title: 'Corporate Presentation',
        description: 'Professional corporate presentation template for business meetings',
        imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&h=400&fit=crop',
        category: 'premium',
        language: 'English',
        type: 'special',
        tags: ['corporate', 'presentation', 'business'],
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
      },
      {
        id: '11',
        title: 'Birthday Party Invitation',
        description: 'Fun and colorful birthday party invitation template',
        imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300&h=400&fit=crop',
        category: 'free',
        language: 'French',
        type: 'festival',
        tags: ['birthday', 'party', 'invitation'],
        createdAt: '2024-01-11T00:00:00Z',
        updatedAt: '2024-01-11T00:00:00Z',
      },
      {
        id: '12',
        title: 'Luxury Brand Brochure',
        description: 'Premium luxury brand brochure template with sophisticated design',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=400&fit=crop',
        category: 'premium',
        language: 'Italian',
        type: 'special',
        tags: ['luxury', 'brand', 'brochure'],
        createdAt: '2024-01-12T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z',
      },
    ];

    // Apply filters
    let filteredTemplates = mockTemplates;

    if (filters?.category && filters.category !== 'all') {
      filteredTemplates = filteredTemplates.filter(
        template => template.category === filters.category
      );
    }

    if (filters?.language) {
      filteredTemplates = filteredTemplates.filter(
        template => template.language.toLowerCase().includes(filters.language!.toLowerCase())
      );
    }

    if (filters?.type && filters.type !== 'all') {
      filteredTemplates = filteredTemplates.filter(
        template => template.type === filters.type
      );
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(
        template =>
          template.title.toLowerCase().includes(searchTerm) ||
          template.description.toLowerCase().includes(searchTerm) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return filteredTemplates;
  }

  // Clear cache method
  clearCache(): void {
    this.cache = {};
  }
}

export default new TemplateService(); 