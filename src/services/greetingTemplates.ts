import api from './api';
import cacheService from './cacheService';

export interface GreetingTemplate {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  categoryId?: string; // Optional category ID for better filtering
  content: {
    text?: string;
    background?: string;
    stickers?: string[];
    emojis?: string[];
    layout?: 'vertical' | 'horizontal' | 'square';
  };
  downloads: number;
  isDownloaded: boolean;
  isPremium: boolean;
}

export interface GreetingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentCategoryName?: string; // Backend returns this field name
}

export interface GreetingFilters {
  category?: string;
  language?: string;
  isPremium?: boolean;
  search?: string;
  limit?: number;
}

class GreetingTemplatesService {
  private readonly BASE_URL = 'https://eventmarketersbackend.onrender.com';
  private readonly FALLBACK_THUMBNAIL =
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop&q=60&auto=format';

  /**
   * Convert relative image URLs to absolute URLs with quality parameters (optimized - minimal logging)
   */
  private convertToAbsoluteUrl(url: string | undefined | null, addQuality: boolean = false): string | undefined {
    if (!url) {
      return undefined;
    }
    
    // Already absolute URL (including Cloudinary URLs)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Add quality parameters for higher resolution if requested and not Unsplash
      if (addQuality && !url.includes('unsplash') && !url.includes('cloudinary')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}quality=high&width=1200`;
      }
      return url;
    }
    
    // Handle URLs that don't start with /
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    const absoluteUrl = `${this.BASE_URL}${normalizedUrl}`;
    
    // Add quality parameters for higher resolution if requested
    if (addQuality) {
      return `${absoluteUrl}?quality=high&width=1200`;
    }
    
    return absoluteUrl;
  }

  private applyImageTransform(
    url: string | undefined,
    qualityPreset: 'best' | 'balanced' | 'eco',
    maxWidth: number,
  ): string | undefined {
    if (!url) {
      return undefined;
    }

    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      try {
        const [prefix, remainder] = url.split('/upload/');
        if (!remainder) {
          return url;
        }
        const transformMap: Record<typeof qualityPreset, string> = {
          best: `f_auto,q_auto:best,c_limit,w_${maxWidth}`,
          balanced: `f_auto,q_auto,c_limit,w_${maxWidth}`,
          eco: `f_auto,q_auto:eco,c_limit,w_${maxWidth}`,
        };
        return `${prefix}/upload/${transformMap[qualityPreset]}/${remainder}`;
      } catch {
        return url;
      }
    }

    const [base, existingQuery] = url.split('?');
    const params = new URLSearchParams(existingQuery || '');
    params.set('auto', 'format');
    params.set('fit', 'crop');
    params.set('w', maxWidth.toString());
    const qualityValue = qualityPreset === 'best' ? '90' : qualityPreset === 'balanced' ? '80' : '60';
    params.set('q', qualityValue);
    return `${base}?${params.toString()}`;
  }

  private getOptimizedImageUrls(
    rawImageUrl?: string | null,
    rawThumbnailUrl?: string | null,
  ): { thumbnail: string; background: string } {
    const absoluteImage = this.convertToAbsoluteUrl(rawImageUrl, true);
    const absoluteThumbnail = this.convertToAbsoluteUrl(rawThumbnailUrl, true);

    const background =
      this.applyImageTransform(absoluteImage || absoluteThumbnail, 'best', 1400) || this.FALLBACK_THUMBNAIL;
    const thumbnail =
      this.applyImageTransform(absoluteThumbnail || absoluteImage, 'eco', 420) ||
      background ||
      this.FALLBACK_THUMBNAIL;

    return {
      thumbnail,
      background: background || thumbnail,
    };
  }

  // Clear cache
  clearCache(): void {
    cacheService.clear('greeting_categories');
    cacheService.clearPattern('greeting_templates_');
    cacheService.clearPattern('greeting_search_'); // Clear search results cache (includes greeting_search_fast_)
    cacheService.clearPattern('greeting_search_fast_'); // Explicitly clear fast search cache
  }

  // Get all greeting categories
  async getCategories(): Promise<GreetingCategory[]> {
    const cacheKey = 'greeting_categories';
    
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        const response = await api.get('/api/mobile/greetings/categories');
        
        // Print the full response for debugging
        console.log('📋 [GREETING CATEGORIES] Full Response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
          // Extract categories array - backend returns { data: { categories: [...] } }
          const categoriesArray = response.data.data.categories || response.data.data;
          
          if (!Array.isArray(categoriesArray)) {
            throw new Error('Invalid categories format');
          }
          
          console.log(`📋 [GREETING CATEGORIES] Total Categories: ${categoriesArray.length}`);
          
          // Log parent category information for debugging - check ALL categories
          if (categoriesArray.length > 0) {
            // Check how many categories have parentCategoryName
            const categoriesWithParent = categoriesArray.filter((cat: any) => cat.parentCategoryName);
            const categoriesWithoutParent = categoriesArray.filter((cat: any) => !cat.parentCategoryName);
            
            console.log(`📋 [GREETING CATEGORIES] Categories WITH parentCategoryName: ${categoriesWithParent.length}`);
            console.log(`📋 [GREETING CATEGORIES] Categories WITHOUT parentCategoryName: ${categoriesWithoutParent.length}`);
            
            // Show sample categories
            const sampleCategories = categoriesArray.slice(0, 3);
            sampleCategories.forEach((category: any, index: number) => {
              console.log(`📋 [GREETING CATEGORIES] Category ${index + 1} (${category.name}):`, {
                id: category.id,
                name: category.name,
                parentCategoryName: category.parentCategoryName,
                hasParentCategoryName: 'parentCategoryName' in category,
                parentCategoryNameType: typeof category.parentCategoryName,
                allKeys: Object.keys(category)
              });
            });
            
            // If any category has parentCategoryName, show it
            if (categoriesWithParent.length > 0) {
              console.log('📋 [GREETING CATEGORIES] Sample category WITH parentCategoryName:', JSON.stringify(categoriesWithParent[0], null, 2));
            }
            if (categoriesWithoutParent.length > 0) {
              console.log('📋 [GREETING CATEGORIES] Sample category WITHOUT parentCategoryName:', JSON.stringify(categoriesWithoutParent[0], null, 2));
            }
          }
          
          // Map backend response to frontend format and filter out deleted categories
          const mappedCategories = categoriesArray
            .filter((backendCategory: any) => {
              // Filter out deleted categories (check for various possible deleted flags)
              // Also filter out categories with no content (count: 0) as these are likely deleted
              return !backendCategory.deleted && 
                     !backendCategory.isDeleted && 
                     backendCategory.id && 
                     backendCategory.name &&
                     (backendCategory.count > 0 || backendCategory.imageCount > 0 || backendCategory.videoCount > 0); // Only include categories with content
            })
            .map((backendCategory: any) => ({
              id: backendCategory.id || backendCategory.name, // Use name as id if id not provided
              name: backendCategory.name,
              icon: backendCategory.icon || '📄',
              color: backendCategory.color || '#4A90E2',
              parentCategoryName: backendCategory.parentCategoryName // Backend returns this field name
            }));
          
          return mappedCategories;
        } else {
          // API returned unsuccessful response - might be no categories, return empty array (same as calendarApi pattern)
          return [];
        }
      },
      5 * 60 * 1000, // 5 minutes TTL
      false // Don't allow stale data - we want fresh categories to ensure deleted ones are removed
    ).catch(error => {
      console.error('Error fetching greeting categories:', error);
      return []; // Return empty array on error
    });
  }

  // Force refresh categories by clearing cache and fetching fresh data
  async refreshCategories(): Promise<GreetingCategory[]> {
    // Clear all caches before fetching to ensure fresh data
    this.clearCache();
    return this.getCategories();
  }

  // Get greeting templates by category
  async getTemplatesByCategory(category: string, limit: number = 200): Promise<GreetingTemplate[]> {
    try {
      const response = await api.get(`/api/mobile/greetings/templates?category=${category}&limit=${limit}`);
      
      if (response.data.success) {
        // When category is provided, backend only returns templates (no businessCategoryImages)
        // Always use templates for category-specific requests to ensure correct category matching
        const templates = response.data.data?.templates || [];
        const businessCategoryImages = response.data.data?.businessCategoryImages || [];
        
        // For category-specific requests, ONLY use templates and filter to ensure category matches exactly
        // Never use businessCategoryImages for category-specific requests
        let dataToMap = templates;
        
        // Additional safety: Filter templates to ensure they match the requested category EXACTLY
        // This prevents templates from other categories (like business categories) from being returned
        if (templates.length > 0 && category) {
          const normalizedRequestedCategory = category.toLowerCase().trim();
          dataToMap = templates.filter((template: any) => {
            // ONLY check template.category field - ignore business_categories completely
            const templateCategory = (template.category || '').toLowerCase().trim();
            const matches = templateCategory === normalizedRequestedCategory;
            
            // Log mismatches for debugging
            if (!matches && __DEV__) {
              console.warn(`[getTemplatesByCategory] Template ${template.id} category mismatch:`, {
                requested: normalizedRequestedCategory,
                templateCategory: templateCategory,
                templateTitle: template.title
              });
            }
            
            return matches;
          });
        }
        
        // If no matching templates found, return empty array (don't fall back to businessCategoryImages)
        if (dataToMap.length === 0) {
          return [];
        }
        
        // Map backend response to frontend format with URL conversion
        const mappedTemplates = dataToMap.map((backendTemplate: any) => {
          const imageUrl = backendTemplate.url || backendTemplate.imageUrl || backendTemplate.thumbnail;
          const thumbnailUrl = backendTemplate.thumbnailUrl || backendTemplate.url || backendTemplate.imageUrl;
          const optimized = this.getOptimizedImageUrls(imageUrl, thumbnailUrl);

          return {
            id: backendTemplate.id,
            name: backendTemplate.title,
            thumbnail: optimized.thumbnail,
            // CRITICAL: Always use template.category field only - never use business_categories.name
            // This ensures templates are correctly associated with their greeting category
            category: backendTemplate.category || 'General',
            categoryId: undefined, // Don't use business category ID for greeting templates
            content: {
              text: backendTemplate.description || '',
              background: optimized.background,
              layout: 'vertical' as const
            },
            downloads: backendTemplate.downloads || 0,
            isDownloaded: false,
            isPremium: backendTemplate.isPremium || false,
            tags: Array.isArray(backendTemplate.tags) ? backendTemplate.tags : [],
          };
        });
        
        return mappedTemplates;
      } else {
        // API returned unsuccessful response - might be no templates for this category, return empty array (same as calendarApi pattern)
        return [];
      }
    } catch (error) {
      // Only log actual errors (network issues, etc.), not "no templates" scenarios
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('No templates') && !errorMessage.includes('No results')) {
        console.error('Error fetching greeting templates by category:', error);
      }
      return []; // Return empty array instead of mock data
    }
  }

  // Get all greeting templates with filters
  async getTemplates(filters?: GreetingFilters): Promise<GreetingTemplate[]> {
    // Generate cache key based on filters
    const filtersKey = filters ? JSON.stringify(filters) : 'default';
    const cacheKey = `greeting_templates_${filtersKey}`;
    
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.language) params.append('language', filters.language);
        if (filters?.isPremium !== undefined) params.append('isPremium', filters.isPremium.toString());
        if (filters?.search) params.append('search', filters.search);
        // Use limit 200 for category requests if no limit specified (for General Categories)
        const limit = filters?.limit || (filters?.category ? 200 : undefined);
        if (limit) params.append('limit', limit.toString());

        const endpoint = `/api/mobile/greetings/templates?${params.toString()}`;
        const response = await api.get(endpoint);
        
        if (response.data.success) {
          const templates = response.data.data?.templates || [];
          const businessCategoryImages = response.data.data?.businessCategoryImages || [];
          
          let dataToMap: any[] = [];
          
          if (filters?.category) {
            // Category filter: ONLY use templates and ensure they match the category exactly
            // Never use businessCategoryImages when category filter is applied
            const normalizedRequestedCategory = filters.category.toLowerCase().trim();
            dataToMap = templates.filter((template: any) => {
              // ONLY check template.category field - ignore business_categories completely
              const templateCategory = (template.category || '').toLowerCase().trim();
              const matches = templateCategory === normalizedRequestedCategory;
              
              // Log mismatches for debugging
              if (!matches && __DEV__) {
                console.warn(`[getTemplates] Template ${template.id} category mismatch:`, {
                  requested: normalizedRequestedCategory,
                  templateCategory: templateCategory,
                  templateTitle: template.title
                });
              }
              
              return matches;
            });
          } else {
            // No category filter: use businessCategoryImages if available, otherwise templates
            dataToMap = businessCategoryImages.length > 0 ? businessCategoryImages : templates;
          }
          
          if (dataToMap.length === 0) {
            return [];
          }
          
          // Map backend response to frontend format with URL conversion
          const mappedTemplates = dataToMap.map((backendTemplate: any) => {
            const imageUrl = backendTemplate.url || backendTemplate.imageUrl || backendTemplate.thumbnail;
            const thumbnailUrl = backendTemplate.thumbnailUrl || backendTemplate.url || backendTemplate.imageUrl;
            const optimized = this.getOptimizedImageUrls(imageUrl, thumbnailUrl);

            return {
              id: backendTemplate.id,
              name: backendTemplate.title,
              thumbnail: optimized.thumbnail,
              // CRITICAL: Always use template.category field only - never use business_categories.name
              // This ensures templates are correctly associated with their greeting category
              category: backendTemplate.category || 'General',
              categoryId: undefined, // Don't use business category ID for greeting templates
              content: {
                text: backendTemplate.description || '',
                background: optimized.background,
                layout: 'vertical' as const
              },
              downloads: backendTemplate.downloads || 0,
              isDownloaded: false,
              isPremium: backendTemplate.isPremium || false,
              tags: Array.isArray(backendTemplate.tags) ? backendTemplate.tags : [],
            };
          });
          
          return mappedTemplates;
        } else {
          // API returned unsuccessful response - might be no templates, return empty array (same as calendarApi pattern)
          return [];
        }
      },
      5 * 60 * 1000, // 5 minutes TTL
      true // Allow stale data
    ).catch(error => {
      console.error('Error fetching greeting templates:', error);
      return []; // Return empty array on error
    });
  }

  // Fast search for thumbnail/preview fetching (optimized with lower limit)
  async searchTemplatesFast(query: string, language?: string, limit: number = 12): Promise<GreetingTemplate[]> {
    // Create cache key from query, language, and limit
    const searchKey = `greeting_search_fast_${query}_${language || 'all'}_${limit}`;
    const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for fast search results (longer cache for previews)

    return await cacheService.getOrFetch(
      searchKey,
      async () => {
        const params = new URLSearchParams();
        params.append('search', encodeURIComponent(query));
        if (language) {
          params.append('language', language);
        }
        params.append('limit', limit.toString()); // Use smaller limit for faster response
        
        const response = await api.get(`/api/mobile/greetings/templates?${params.toString()}`);
      
        if (response.data.success) {
          const templates = response.data.data?.templates || [];
          const businessCategoryImages = response.data.data?.businessCategoryImages || [];
          
          // For search queries, prefer templates over businessCategoryImages to ensure category accuracy
          // Backend may return businessCategoryImages for search, but we prioritize templates for better category matching
          const dataToMap = templates.length > 0 ? templates : businessCategoryImages;
          
          if (dataToMap.length === 0) {
            return [];
          }
          
          // Map backend response to frontend format (optimized - only map what we need)
          const mappedTemplates = dataToMap.slice(0, limit).map((backendTemplate: any) => {
            const fullUrl =
              backendTemplate.url ||
              backendTemplate.imageUrl ||
              backendTemplate.thumbnailUrl ||
              backendTemplate.thumbnail ||
              backendTemplate.image;
            const thumbnailUrl =
              backendTemplate.thumbnailUrl ||
              backendTemplate.url ||
              backendTemplate.imageUrl ||
              backendTemplate.thumbnail ||
              backendTemplate.image;

            const optimized = this.getOptimizedImageUrls(fullUrl, thumbnailUrl);

            return {
              id: backendTemplate.id,
              name: backendTemplate.title,
              thumbnail: optimized.thumbnail,
              // CRITICAL: Always use template.category field only - never use business_categories.name
              category: backendTemplate.category || 'General',
              content: {
                text: backendTemplate.description || '',
                background: optimized.background,
                layout: 'vertical' as const
              },
              downloads: backendTemplate.downloads || 0,
              isDownloaded: false,
              isPremium: backendTemplate.isPremium || false,
              tags: Array.isArray(backendTemplate.tags) ? backendTemplate.tags : [],
            };
          });
          
          return mappedTemplates;
        } else {
          // API returned unsuccessful response - might be no results, return empty array
          return [];
        }
      },
      SEARCH_CACHE_TTL,
      true // Allow stale data
    ).catch((error) => {
      // Only log actual errors (network issues, etc.), not "no results" scenarios
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('No templates') && !errorMessage.includes('No results')) {
        console.error('Error searching greeting templates (fast):', error);
      }
      return []; // Return empty array instead of mock data
    });
  }

  // Search greeting templates (with caching - 2 min TTL for search results)
  async searchTemplates(query: string, language?: string, limit?: number): Promise<GreetingTemplate[]> {
    // Use fast search if no limit specified or limit is small (for previews)
    if (!limit || limit <= 20) {
      return this.searchTemplatesFast(query, language, limit || 12);
    }

    // Create cache key from query and language
    const searchKey = `greeting_search_${query}_${language || 'all'}_${limit || '200'}`;
    const SEARCH_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for search results

    return await cacheService.getOrFetch(
      searchKey,
      async () => {
        const params = new URLSearchParams();
        params.append('search', encodeURIComponent(query));
        if (language) {
          params.append('language', language);
        }
        params.append('limit', (limit || 200).toString());
        
        const response = await api.get(`/api/mobile/greetings/templates?${params.toString()}`);
      
        if (response.data.success) {
          const templates = response.data.data?.templates || [];
          const businessCategoryImages = response.data.data?.businessCategoryImages || [];
          
          // For search queries, prefer templates over businessCategoryImages to ensure category accuracy
          // Backend may return businessCategoryImages for search, but we prioritize templates for better category matching
          const dataToMap = templates.length > 0 ? templates : businessCategoryImages;
          
          if (dataToMap.length === 0) {
            return [];
          }
          
          // Map backend response to frontend format
          const mappedTemplates = dataToMap.map((backendTemplate: any) => {
            const fullUrl =
              backendTemplate.url ||
              backendTemplate.imageUrl ||
              backendTemplate.thumbnailUrl ||
              backendTemplate.thumbnail ||
              backendTemplate.image;
            const thumbnailUrl =
              backendTemplate.thumbnailUrl ||
              backendTemplate.url ||
              backendTemplate.imageUrl ||
              backendTemplate.thumbnail ||
              backendTemplate.image;

            const optimized = this.getOptimizedImageUrls(fullUrl, thumbnailUrl);

            return {
              id: backendTemplate.id,
              name: backendTemplate.title,
              thumbnail: optimized.thumbnail,
              // CRITICAL: Always use template.category field only - never use business_categories.name
              category: backendTemplate.category || 'General',
              content: {
                text: backendTemplate.description || '',
                background: optimized.background,
                layout: 'vertical' as const
              },
              downloads: backendTemplate.downloads || 0,
              isDownloaded: false,
              isPremium: backendTemplate.isPremium || false,
              tags: Array.isArray(backendTemplate.tags) ? backendTemplate.tags : [],
            };
          });
          
          return mappedTemplates;
        } else {
          // API returned unsuccessful response - might be no results, return empty array (same as calendarApi pattern)
          return [];
        }
      },
      SEARCH_CACHE_TTL,
      true // Allow stale data
    ).catch((error) => {
      // Only log actual errors (network issues, etc.), not "no results" scenarios
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('No templates') && !errorMessage.includes('No results')) {
        console.error('Error searching greeting templates:', error);
      }
      return []; // Return empty array instead of mock data
    });
  }

  // Download a template
  async downloadTemplate(templateId: string): Promise<boolean> {
    try {
      const response = await api.post(`/api/mobile/greetings/templates/${templateId}/download`);
      
      if (response.data.success) {
        return true;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      return false;
    }
  }

  // Get available stickers (mock data only - API endpoint removed)
  async getStickers(): Promise<string[]> {
    return this.getMockStickers();
  }

  // Get available emojis (mock data only - API endpoint removed)
  async getEmojis(): Promise<string[]> {
    return this.getMockEmojis();
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
          downloads: 189,
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
          downloads: 156,
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
          downloads: 234,
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
          downloads: 145,
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
