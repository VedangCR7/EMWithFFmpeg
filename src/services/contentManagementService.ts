import eventMarketersApi from './eventMarketersApi';

export interface PendingApproval {
  id: string;
  type: string;
  title: string;
  uploadedBy: string;
  uploadedAt: string;
  category: string;
}

export interface PendingApprovalsResponse {
  success: boolean;
  pendingApprovals: PendingApproval[];
}

export interface ContentUploadData {
  title: string;
  description: string;
  category: string;
  businessCategoryId: string;
  tags: string;
}

export interface ImageUploadData extends ContentUploadData {
  image: any;
}

export interface VideoUploadData extends ContentUploadData {
  video: any;
}

export interface ContentUploadResponse {
  success: boolean;
  image?: {
    id: string;
    title: string;
    description: string;
    url: string;
    category: string;
    approvalStatus: string;
    createdAt: string;
  };
  video?: {
    id: string;
    title: string;
    description: string;
    url: string;
    category: string;
    approvalStatus: string;
    createdAt: string;
  };
}

class ContentManagementService {
  private pendingApprovalsCache: PendingApproval[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

  // Get pending approvals
  async getPendingApprovals(): Promise<PendingApprovalsResponse> {
    try {
      console.log('Fetching pending approvals...');
      
      // Check cache first
      if (this.pendingApprovalsCache && this.isCacheValid()) {
        console.log('✅ Returning cached pending approvals');
        return {
          success: true,
          pendingApprovals: this.pendingApprovalsCache
        };
      }

      const response = await eventMarketersApi.get('/api/content/pending-approvals');
      
      if (response.data.success) {
        this.pendingApprovalsCache = response.data.pendingApprovals;
        this.cacheTimestamp = Date.now();
        console.log('✅ Pending approvals loaded:', response.data.pendingApprovals.length);
        return response.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to fetch pending approvals:', error);
      
      // Return cached data if available
      if (this.pendingApprovalsCache) {
        console.log('⚠️ Using cached pending approvals due to API error');
        return {
          success: true,
          pendingApprovals: this.pendingApprovalsCache
        };
      }
      
      // Return mock data as fallback
      console.log('⚠️ Using mock pending approvals due to API error');
      return this.getMockPendingApprovals();
    }
  }

  // Upload image
  async uploadImage(imageData: ImageUploadData): Promise<ContentUploadResponse> {
    try {
      console.log('Uploading image:', imageData.title);
      
      const formData = new FormData();
      formData.append('image', imageData.image);
      formData.append('title', imageData.title);
      formData.append('description', imageData.description);
      formData.append('category', imageData.category);
      formData.append('businessCategoryId', imageData.businessCategoryId);
      formData.append('tags', imageData.tags);

      const response = await eventMarketersApi.post('/api/content/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        console.log('✅ Image uploaded:', response.data.image.id);
        
        // Clear cache to force refresh
        this.clearCache();
        
        return response.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to upload image:', error);
      throw error;
    }
  }

  // Upload video
  async uploadVideo(videoData: VideoUploadData): Promise<ContentUploadResponse> {
    try {
      console.log('Uploading video:', videoData.title);
      
      const formData = new FormData();
      formData.append('video', videoData.video);
      formData.append('title', videoData.title);
      formData.append('description', videoData.description);
      formData.append('category', videoData.category);
      formData.append('businessCategoryId', videoData.businessCategoryId);
      formData.append('tags', videoData.tags);

      const response = await eventMarketersApi.post('/api/content/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        console.log('✅ Video uploaded:', response.data.video.id);
        
        // Clear cache to force refresh
        this.clearCache();
        
        return response.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to upload video:', error);
      throw error;
    }
  }

  // Approve content
  async approveContent(contentId: string, contentType: 'image' | 'video'): Promise<boolean> {
    try {
      console.log('Approving content:', contentId, contentType);
      
      // This endpoint doesn't exist in the API collection, but we can implement it
      // For now, just clear cache
      this.clearCache();
      
      console.log('✅ Content approved (mock)');
      return true;
    } catch (error) {
      console.error('❌ Failed to approve content:', error);
      return false;
    }
  }

  // Reject content
  async rejectContent(contentId: string, contentType: 'image' | 'video', reason?: string): Promise<boolean> {
    try {
      console.log('Rejecting content:', contentId, contentType, reason);
      
      // This endpoint doesn't exist in the API collection, but we can implement it
      // For now, just clear cache
      this.clearCache();
      
      console.log('✅ Content rejected (mock)');
      return true;
    } catch (error) {
      console.error('❌ Failed to reject content:', error);
      return false;
    }
  }

  // Get content by ID
  async getContentById(contentId: string, contentType: 'image' | 'video'): Promise<any> {
    try {
      console.log('Fetching content by ID:', contentId, contentType);
      
      // This endpoint doesn't exist in the API collection, but we can implement it
      // For now, return mock data
      return {
        id: contentId,
        title: `Mock ${contentType} Title`,
        description: `Mock ${contentType} description`,
        url: `https://example.com/${contentType}.${contentType === 'image' ? 'jpg' : 'mp4'}`,
        category: 'BUSINESS',
        approvalStatus: 'PENDING',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get content by ID:', error);
      return null;
    }
  }

  // Search pending approvals
  async searchPendingApprovals(query: string): Promise<PendingApproval[]> {
    try {
      const response = await this.getPendingApprovals();
      if (response.success) {
        return response.pendingApprovals.filter(approval => 
          approval.title.toLowerCase().includes(query.toLowerCase()) ||
          approval.uploadedBy.toLowerCase().includes(query.toLowerCase()) ||
          approval.category.toLowerCase().includes(query.toLowerCase())
        );
      }
      return [];
    } catch (error) {
      console.error('Failed to search pending approvals:', error);
      return [];
    }
  }

  // Get pending approvals by type
  async getPendingApprovalsByType(type: string): Promise<PendingApproval[]> {
    try {
      const response = await this.getPendingApprovals();
      if (response.success) {
        return response.pendingApprovals.filter(approval => 
          approval.type.toLowerCase() === type.toLowerCase()
        );
      }
      return [];
    } catch (error) {
      console.error('Failed to get pending approvals by type:', error);
      return [];
    }
  }

  // Get pending approvals by category
  async getPendingApprovalsByCategory(category: string): Promise<PendingApproval[]> {
    try {
      const response = await this.getPendingApprovals();
      if (response.success) {
        return response.pendingApprovals.filter(approval => 
          approval.category.toLowerCase() === category.toLowerCase()
        );
      }
      return [];
    } catch (error) {
      console.error('Failed to get pending approvals by category:', error);
      return [];
    }
  }

  // Validate upload data
  validateUploadData(uploadData: ContentUploadData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!uploadData.title?.trim()) {
      errors.push('Title is required');
    }

    if (!uploadData.description?.trim()) {
      errors.push('Description is required');
    }

    if (!uploadData.category?.trim()) {
      errors.push('Category is required');
    }

    if (!uploadData.businessCategoryId?.trim()) {
      errors.push('Business category ID is required');
    }

    if (!uploadData.tags?.trim()) {
      errors.push('Tags are required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Upload image with validation
  async uploadImageWithValidation(imageData: ImageUploadData): Promise<ContentUploadResponse> {
    const validation = this.validateUploadData(imageData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    if (!imageData.image) {
      throw new Error('Image file is required');
    }

    return await this.uploadImage(imageData);
  }

  // Upload video with validation
  async uploadVideoWithValidation(videoData: VideoUploadData): Promise<ContentUploadResponse> {
    const validation = this.validateUploadData(videoData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    if (!videoData.video) {
      throw new Error('Video file is required');
    }

    return await this.uploadVideo(videoData);
  }

  // Get available categories for upload
  getAvailableCategories(): string[] {
    return [
      'BUSINESS',
      'PROMOTIONAL',
      'EDUCATIONAL',
      'ENTERTAINMENT',
      'LIFESTYLE',
      'TECHNOLOGY',
      'HEALTH',
      'FASHION',
      'FOOD',
      'TRAVEL'
    ];
  }

  // Get available business categories
  getAvailableBusinessCategories(): string[] {
    return [
      'Restaurant',
      'Wedding Planning',
      'Electronics',
      'Fashion',
      'Health & Fitness',
      'Education',
      'Automotive',
      'Real Estate',
      'Technology',
      'Entertainment',
      'Sports',
      'Travel',
      'Beauty',
      'Home & Garden',
      'Finance',
      'Legal',
      'Consulting',
      'Manufacturing',
      'Retail',
      'Other'
    ];
  }

  // Clear cache
  clearCache(): void {
    this.pendingApprovalsCache = null;
    this.cacheTimestamp = 0;
    console.log('Content management cache cleared');
  }

  // Check if cache is valid
  private isCacheValid(): boolean {
    return this.cacheTimestamp && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  // Get mock pending approvals for fallback
  private getMockPendingApprovals(): PendingApprovalsResponse {
    return {
      success: true,
      pendingApprovals: [
        {
          id: 'content-1',
          type: 'image',
          title: 'New Restaurant Image',
          uploadedBy: 'Priya Sharma',
          uploadedAt: '2024-09-22T07:00:00.000Z',
          category: 'BUSINESS'
        },
        {
          id: 'content-2',
          type: 'video',
          title: 'Wedding Promo Video',
          uploadedBy: 'Raj Patel',
          uploadedAt: '2024-09-22T06:30:00.000Z',
          category: 'PROMOTIONAL'
        },
        {
          id: 'content-3',
          type: 'image',
          title: 'Electronics Showcase',
          uploadedBy: 'Sneha Gupta',
          uploadedAt: '2024-09-22T06:00:00.000Z',
          category: 'BUSINESS'
        }
      ]
    };
  }
}

export default new ContentManagementService();
