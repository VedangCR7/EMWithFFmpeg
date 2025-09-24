

export interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  size: number; // in bytes
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number; // for videos, in seconds
  uploadedAt: string;
  tags?: string[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class MediaService {
  // Get user's media assets (mock data)
  async getMediaAssets(): Promise<MediaAsset[]> {
    return [];
  }

  // Upload new media asset (mock implementation)
  async uploadMedia(
    file: any,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaAsset> {
    // Simulate upload progress
    if (onProgress) {
      setTimeout(() => onProgress({ loaded: 50, total: 100, percentage: 50 }), 500);
      setTimeout(() => onProgress({ loaded: 100, total: 100, percentage: 100 }), 1000);
    }

    const mockAsset: MediaAsset = {
      id: 'media-' + Date.now(),
      name: file.name || 'uploaded-file',
      type: file.type?.includes('image') ? 'image' : 'video',
      url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=100&fit=crop',
      size: file.size || 1024 * 1024,
      mimeType: file.type || 'image/jpeg',
      width: 800,
      height: 600,
      uploadedAt: new Date().toISOString(),
      tags: ['uploaded'],
    };

    return mockAsset;
  }

  // Delete media asset (mock implementation)
  async deleteMedia(mediaId: string): Promise<void> {
    console.log('Mock media deleted:', mediaId);
  }

  // Get media asset by ID (mock data)
  async getMediaById(mediaId: string): Promise<MediaAsset | null> {
    return null;
  }

  // Update media asset metadata (mock implementation)
  async updateMediaMetadata(
    mediaId: string,
    updates: {
      name?: string;
      tags?: string[];
    }
  ): Promise<MediaAsset> {
    const mockAsset: MediaAsset = {
      id: mediaId,
      name: updates.name || 'updated-media',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=100&fit=crop',
      size: 1024 * 1024,
      mimeType: 'image/jpeg',
      width: 800,
      height: 600,
      uploadedAt: new Date().toISOString(),
      tags: updates.tags || ['updated'],
    };

    return mockAsset;
  }

  // Upload image from camera or gallery
  async uploadImage(
    imageUri: string,
    imageName?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaAsset> {
    try {
      // Create file object from image URI
      const file = {
        uri: imageUri,
        type: 'image/jpeg',
        name: imageName || `image_${Date.now()}.jpg`,
      };

      return await this.uploadMedia(file, onProgress);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Upload video from camera or gallery
  async uploadVideo(
    videoUri: string,
    videoName?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaAsset> {
    try {
      // Create file object from video URI
      const file = {
        uri: videoUri,
        type: 'video/mp4',
        name: videoName || `video_${Date.now()}.mp4`,
      };

      return await this.uploadMedia(file, onProgress);
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  // Get media assets by type (mock data)
  async getMediaByType(type: 'image' | 'video'): Promise<MediaAsset[]> {
    return [];
  }

  // Search media assets by tags (mock data)
  async searchMediaByTags(tags: string[]): Promise<MediaAsset[]> {
    return [];
  }

  // Get media usage statistics (mock data)
  async getMediaStats(): Promise<{
    totalAssets: number;
    totalSize: number;
    imageCount: number;
    videoCount: number;
    storageUsed: number;
    storageLimit: number;
  }> {
    return {
      totalAssets: 0,
      totalSize: 0,
      imageCount: 0,
      videoCount: 0,
      storageUsed: 0,
      storageLimit: 1024 * 1024 * 1024, // 1GB
    };
  }

  // Validate file before upload
  validateFile(file: any): { isValid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv'];

    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (file.size && file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 50MB limit' };
    }

    const fileType = file.type || file.mimeType;
    if (!allowedImageTypes.includes(fileType) && !allowedVideoTypes.includes(fileType)) {
      return { isValid: false, error: 'Unsupported file type' };
    }

    return { isValid: true };
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file extension from filename
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  // Check if file is an image
  isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = this.getFileExtension(filename);
    return imageExtensions.includes(extension);
  }

  // Check if file is a video
  isVideoFile(filename: string): boolean {
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    const extension = this.getFileExtension(filename);
    return videoExtensions.includes(extension);
  }
}

export default new MediaService();
