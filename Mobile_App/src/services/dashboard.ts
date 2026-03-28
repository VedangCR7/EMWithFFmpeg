

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string; // Optional thumbnail URL for faster loading
  link: string;
}

export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  thumbnailUrl?: string; // Add thumbnailUrl for better compatibility with PosterPlayerScreen
  videoUrl?: string;
  category: string;
  downloads: number;
  isDownloaded: boolean;
  languages?: string[];
  tags?: string[];
  description?: string;
  isGreeting?: boolean;
  isBusiness?: boolean;
  originalTemplate?: any;
}

export interface Category {
  id: string;
  name: string;
}

export interface DashboardData {
  banners: Banner[];
  templates: Template[];
  categories: Category[];
}

class DashboardService {
  // Get all banners (mock data only)
  async getBanners(): Promise<Banner[]> {
    return this.getMockBanners();
  }

  // Get templates by tab (mock data only)
  async getTemplatesByTab(tab: string): Promise<Template[]> {
    return this.getMockTemplates();
  }

  // Get all categories (mock data only)
  async getCategories(): Promise<Category[]> {
    return this.getMockCategories();
  }

  // Search templates (mock data only)
  async searchTemplates(query: string): Promise<{ data: { parentCategory: string; categories: any[] } } | Template[]> {
    const templates = this.getMockTemplates();
    const searchLower = query.toLowerCase().trim();
    
    if (!searchLower) {
      return [];
    }
    
    const filteredTemplates = templates.filter(template => {
      // Search in name
      if (template.name?.toLowerCase().includes(searchLower)) return true;
      
      // Search in category
      if (template.category?.toLowerCase().includes(searchLower)) return true;
      
      // Search in tags
      if (template.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))) return true;
      
      // Search in description (if available)
      if ((template as any).description?.toLowerCase().includes(searchLower)) return true;
      
      return false;
    });
    
    // For now, return flat array format
    // TODO: Implement hierarchical response format when backend supports it
    return filteredTemplates;
  }

  // Get templates by category (mock data only)
  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return this.getMockTemplates().filter(t => t.category.toLowerCase() === category.toLowerCase());
  }

  // Download template (mock implementation)
  async downloadTemplate(templateId: string): Promise<void> {
    console.log('Mock download template:', templateId);
  }

  // Get dashboard data with timeout handling
  async getDashboardData(tab: string = 'trending'): Promise<DashboardData> {
    try {
      const [banners, templates, categories] = await Promise.all([
        this.getBanners(),
        this.getTemplatesByTab(tab),
        this.getCategories(),
      ]);
      
      return { banners, templates, categories };
    } catch (error) {
      console.log('Using mock dashboard data due to API error:', error);
      return {
        banners: this.getMockBanners(),
        templates: this.getMockTemplates(),
        categories: this.getMockCategories(),
      };
    }
  }

  // Mock data methods
  private getMockBanners(): Banner[] {
    return [
      {
        id: '1',
        title: 'Professional Business Solutions',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
        link: '#',
      },
      {
        id: '2',
        title: 'Creative Design Templates',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=200&fit=crop',
        link: '#',
      },
      {
        id: '3',
        title: 'Marketing Excellence',
        imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=200&fit=crop',
        link: '#',
      },
    ];
  }

  private getMockTemplates(): Template[] {
    return [
      {
        id: '1',
        name: 'Modern Business Card',
        thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop',
        category: 'Business',
        downloads: 89,
        isDownloaded: false,
        tags: ['business', 'professional', 'corporate', 'modern', 'card'],
        description: 'A modern and professional business card design',
      },
      {
        id: '2',
        name: 'Festive Celebration',
        thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300&h=200&fit=crop',
        category: 'Celebration',
        downloads: 167,
        isDownloaded: false,
        tags: ['festival', 'celebration', 'party', 'joy', 'festive'],
        description: 'Colorful festive celebration poster design',
      },
      {
        id: '3',
        name: 'Special Offer',
        thumbnail: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&h=200&fit=crop',
        category: 'Marketing',
        downloads: 45,
        isDownloaded: true,
        tags: ['marketing', 'offer', 'sale', 'discount', 'promotion'],
        description: 'Eye-catching special offer marketing template',
      },
      {
        id: '4',
        name: 'Professional Portfolio',
        thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=200&fit=crop',
        category: 'Portfolio',
        downloads: 198,
        isDownloaded: false,
        tags: ['portfolio', 'professional', 'work', 'showcase', 'creative'],
        description: 'Professional portfolio showcase template',
      },
      {
        id: '5',
        name: 'Event Invitation',
        thumbnail: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=300&h=200&fit=crop',
        category: 'Events',
        downloads: 123,
        isDownloaded: false,
        tags: ['event', 'invitation', 'party', 'celebration', 'gathering'],
        description: 'Elegant event invitation design',
      },
      {
        id: '6',
        name: 'Product Showcase',
        thumbnail: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&h=200&fit=crop',
        category: 'Product',
        downloads: 87,
        isDownloaded: false,
        tags: ['product', 'showcase', 'display', 'marketing', 'presentation'],
        description: 'Modern product showcase template',
      },
    ];
  }

  private getMockCategories(): Category[] {
    return [
      { id: 'all', name: 'All' },
      { id: 'business', name: 'Business' },
      { id: 'celebration', name: 'Celebration' },
      { id: 'marketing', name: 'Marketing' },
      { id: 'portfolio', name: 'Portfolio' },
      { id: 'events', name: 'Events' },
      { id: 'product', name: 'Product' },
    ];
  }
}

export default new DashboardService(); 
