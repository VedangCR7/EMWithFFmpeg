import api from './api';

// Types for media management
export interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  size: number;
  format: string;
  tags: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFilters {
  type?: 'image' | 'video' | 'all';
  page?: number;
  limit?: number;
}

export interface UploadMediaRequest {
  file: File | Blob;
  tags?: string[];
  description?: string;
}

export interface UpdateMediaRequest {
  name?: string;
  tags?: string[];
  description?: string;
}

export interface SearchMediaRequest {
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface MediaStats {
  totalAssets: number;
  totalSize: number;
  imageCount: number;
  videoCount: number;
  recentUploads: number;
}

export interface MediaResponse {
  success: boolean;
  data: MediaAsset;
  message: string;
}

export interface MediaListResponse {
  success: boolean;
  data: {
    assets: MediaAsset[];
    total: number;
    page: number;
    limit: number;
  };
  message: string;
}

export interface MediaStatsResponse {
  success: boolean;
  data: MediaStats;
  message: string;
}

// Media Management API service
class MediaApiService {
  // Get media assets
  async getMediaAssets(filters?: MediaFilters): Promise<MediaListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/api/mobile/media?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Get media assets error:', error);
      throw error;
    }
  }

  // Upload media
  async uploadMedia(data: UploadMediaRequest): Promise<MediaResponse> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      if (data.tags) {
        formData.append('tags', JSON.stringify(data.tags));
      }
      if (data.description) {
        formData.append('description', data.description);
      }

      const response = await api.post('/api/mobile/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Upload media error:', error);
      throw error;
    }
  }

  // Delete media
  async deleteMedia(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/api/mobile/media/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete media error:', error);
      throw error;
    }
  }

  // Get media by ID
  async getMediaById(id: string): Promise<MediaResponse> {
    try {
      const response = await api.get(`/api/mobile/media/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get media by ID error:', error);
      throw error;
    }
  }

  // Update media metadata
  async updateMedia(id: string, data: UpdateMediaRequest): Promise<MediaResponse> {
    try {
      const response = await api.put(`/api/mobile/media/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update media error:', error);
      throw error;
    }
  }

  // Get media by type
  async getMediaByType(type: 'image' | 'video'): Promise<MediaListResponse> {
    try {
      const response = await api.get(`/api/mobile/media/type/${type}`);
      return response.data;
    } catch (error) {
      console.error('Get media by type error:', error);
      throw error;
    }
  }

  // Search media by tags
  async searchMediaByTags(searchData: SearchMediaRequest): Promise<MediaListResponse> {
    try {
      const params = new URLSearchParams();
      if (searchData.tags) {
        params.append('tags', searchData.tags.join(','));
      }
      if (searchData.page) {
        params.append('page', searchData.page.toString());
      }
      if (searchData.limit) {
        params.append('limit', searchData.limit.toString());
      }

      const response = await api.get(`/api/mobile/media/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Search media by tags error:', error);
      throw error;
    }
  }

  // Get media statistics
  async getMediaStats(): Promise<MediaStatsResponse> {
    try {
      const response = await api.get('/api/mobile/media/stats');
      return response.data;
    } catch (error) {
      console.error('Get media stats error:', error);
      throw error;
    }
  }
}

export default new MediaApiService();
