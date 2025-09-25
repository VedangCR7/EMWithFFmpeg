import api from './api';

export interface GreetingTemplate {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  content: {
    text?: string;
    background?: string;
    stickers?: string[];
    emojis?: string[];
    layout?: 'vertical' | 'horizontal' | 'square';
  };
  likes: number;
  downloads: number;
  isLiked: boolean;
  isDownloaded: boolean;
  isPremium: boolean;
}

export interface GreetingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface GreetingFilters {
  category?: string;
  language?: string;
  isPremium?: boolean;
  search?: string;
}

class GreetingTemplatesService {
  // Get all greeting categories
  async getCategories(): Promise<GreetingCategory[]> {
    try {
      const response = await api.get('/api/mobile/greeting-categories');
      return response.data;
    } catch (error) {
      console.log('Using mock greeting categories due to API error:', error);
      return this.getMockCategories();
    }
  }

  // Get greeting templates by category
  async getTemplatesByCategory(category: string): Promise<GreetingTemplate[]> {
    try {
      const response = await api.get(`/api/mobile/greeting-templates?category=${category}`);
      return response.data;
    } catch (error) {
      console.log('Using mock greeting templates due to API error:', error);
      return this.getMockTemplatesByCategory(category);
    }
  }

  // Get all greeting templates with filters
  async getTemplates(filters?: GreetingFilters): Promise<GreetingTemplate[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.language) params.append('language', filters.language);
      if (filters?.isPremium !== undefined) params.append('isPremium', filters.isPremium.toString());
      if (filters?.search) params.append('search', filters.search);

      const response = await api.get(`/api/mobile/greeting-templates?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.log('Using mock greeting templates due to API error:', error);
      return this.getMockTemplates(filters);
    }
  }

  // Search greeting templates
  async searchTemplates(query: string): Promise<GreetingTemplate[]> {
    try {
      const response = await api.get(`/api/mobile/greeting-templates/search?q=${query}`);
      return response.data;
    } catch (error) {
      console.log('Using mock search results due to API error:', error);
      return this.getMockSearchResults(query);
    }
  }

  // Like/unlike a template
  async toggleLike(templateId: string): Promise<boolean> {
    try {
      const response = await api.post(`/api/mobile/greeting-templates/${templateId}/like`);
      return response.data.isLiked;
    } catch (error) {
      console.error('Error toggling like:', error);
      return false;
    }
  }

  // Download a template
  async downloadTemplate(templateId: string): Promise<boolean> {
    try {
      const response = await api.post(`/api/mobile/greeting-templates/${templateId}/download`);
      return response.data.success;
    } catch (error) {
      console.error('Error downloading template:', error);
      return false;
    }
  }

  // Get available stickers
  async getStickers(): Promise<string[]> {
    try {
      const response = await api.get('/api/mobile/stickers');
      return response.data;
    } catch (error) {
      console.log('Using mock stickers due to API error:', error);
      return this.getMockStickers();
    }
  }

  // Get available emojis
  async getEmojis(): Promise<string[]> {
    try {
      const response = await api.get('/api/mobile/emojis');
      return response.data;
    } catch (error) {
      console.log('Using mock emojis due to API error:', error);
      return this.getMockEmojis();
    }
  }

  // Mock data methods
  private getMockCategories(): GreetingCategory[] {
    return [
      { id: 'good-morning', name: 'Good Morning', icon: 'wb-sunny', color: '#FFD700' },
      { id: 'good-night', name: 'Good Night', icon: 'nightlight', color: '#4A90E2' },
      { id: 'quotes', name: 'Quotes', icon: 'format-quote', color: '#E74C3C' },
      { id: 'birthday', name: 'Birthday', icon: 'cake', color: '#FF69B4' },
      { id: 'anniversary', name: 'Anniversary', icon: 'favorite', color: '#FF6B6B' },
      { id: 'congratulations', name: 'Congratulations', icon: 'emoji-events', color: '#FFD700' },
      { id: 'thank-you', name: 'Thank You', icon: 'favorite-border', color: '#4CAF50' },
      { id: 'festival', name: 'Festival', icon: 'celebration', color: '#9C27B0' },
    ];
  }

  private getMockTemplatesByCategory(category: string): GreetingTemplate[] {
    const templates: { [key: string]: GreetingTemplate[] } = {
      'good-morning': [
        {
          id: 'gm-1',
          name: 'Sunrise Greeting',
          thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop',
          category: 'good-morning',
          content: {
            text: 'Good Morning! 🌅',
            background: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
            layout: 'vertical'
          },
          likes: 245,
          downloads: 189,
          isLiked: false,
          isDownloaded: false,
          isPremium: false
        },
        {
          id: 'gm-2',
          name: 'Coffee Morning',
          thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=400&fit=crop',
          category: 'good-morning',
          content: {
            text: 'Rise and shine! ☕',
            background: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=600&fit=crop',
            layout: 'vertical'
          },
          likes: 189,
          downloads: 156,
          isLiked: true,
          isDownloaded: false,
          isPremium: true
        }
      ],
      'quotes': [
        {
          id: 'q-1',
          name: 'Inspirational Quote',
          thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop',
          category: 'quotes',
          content: {
            text: 'The only way to do great work is to love what you do.',
            background: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
            layout: 'vertical'
          },
          likes: 312,
          downloads: 234,
          isLiked: false,
          isDownloaded: false,
          isPremium: false
        }
      ],
      'birthday': [
        {
          id: 'bd-1',
          name: 'Birthday Celebration',
          thumbnail: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&h=400&fit=crop',
          category: 'birthday',
          content: {
            text: 'Happy Birthday! 🎂',
            background: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=600&fit=crop',
            layout: 'vertical'
          },
          likes: 178,
          downloads: 145,
          isLiked: false,
          isDownloaded: false,
          isPremium: false
        }
      ]
    };

    return templates[category] || [];
  }

  private getMockTemplates(filters?: GreetingFilters): GreetingTemplate[] {
    const allTemplates = [
      ...this.getMockTemplatesByCategory('good-morning'),
      ...this.getMockTemplatesByCategory('quotes'),
      ...this.getMockTemplatesByCategory('birthday')
    ];

    let filtered = allTemplates;

    if (filters?.category && filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters?.isPremium !== undefined) {
      filtered = filtered.filter(t => t.isPremium === filters.isPremium);
    }

    if (filters?.search) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        t.content.text?.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    return filtered;
  }

  private getMockSearchResults(query: string): GreetingTemplate[] {
    const allTemplates = this.getMockTemplates();
    return allTemplates.filter(t => 
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.content.text?.toLowerCase().includes(query.toLowerCase())
    );
  }

  private getMockStickers(): string[] {
    return [
      '🌟', '✨', '💫', '⭐', '🎉', '🎊', '🎈', '🎂', '🎁', '💝',
      '💖', '💕', '💗', '💓', '💞', '💘', '💌', '💋', '💍', '💎',
      '🌹', '🌷', '🌸', '🌺', '🌻', '🌼', '🌿', '🍀', '🌱', '🌲',
      '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️',
      '🌈', '☔', '⚡', '❄️', '🔥', '💧', '🌊', '🌍', '🌎', '🌏'
    ];
  }

  private getMockEmojis(): string[] {
    return [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬'
    ];
  }
}

export default new GreetingTemplatesService();
