export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  duration: number;
  tags: string[];
  resolution: string;
  fileSize: number;
  views: number;
  likes: number;
  shares: number;
}

export interface Video {
  id: string;
  userId: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed';
  tags: string[];
  resolution: string;
  fileSize: number;
  views: number;
  likes: number;
  shares: number;
  processingProgress: number;
  createdAt: string;
  updatedAt: string;
}

export class VideoModel implements Video {
  id: string;
  userId: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed';
  tags: string[];
  resolution: string;
  fileSize: number;
  views: number;
  likes: number;
  shares: number;
  processingProgress: number;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    userId: string,
    title: string,
    description: string,
    url: string,
    thumbnailUrl?: string,
    duration: number = 0,
    status: 'processing' | 'completed' | 'failed' = 'processing',
    tags: string[] = [],
    resolution: string = '1080p',
    fileSize: number = 0,
    views: number = 0,
    likes: number = 0,
    shares: number = 0,
    processingProgress: number = 0,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.url = url;
    this.thumbnailUrl = thumbnailUrl;
    this.duration = duration;
    this.status = status;
    this.tags = tags;
    this.resolution = resolution;
    this.fileSize = fileSize;
    this.views = views;
    this.likes = likes;
    this.shares = shares;
    this.processingProgress = processingProgress;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  // Validation methods
  isValid(): boolean {
    return !!(this.title && this.title.length > 0 && this.url && this.url.length > 0);
  }

  // Get video metadata
  getMetadata(): VideoMetadata {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      duration: this.duration,
      tags: this.tags,
      resolution: this.resolution,
      fileSize: this.fileSize,
      views: this.views,
      likes: this.likes,
      shares: this.shares
    };
  }

  // Check if video is processed
  isProcessed(): boolean {
    return this.status === 'completed';
  }

  // Update processing progress
  updateProgress(progress: number): void {
    this.processingProgress = Math.min(100, Math.max(0, progress));
    if (this.processingProgress === 100) {
      this.status = 'completed';
    }
    this.updatedAt = new Date().toISOString();
  }

  // Increment view count
  incrementViews(): void {
    this.views += 1;
    this.updatedAt = new Date().toISOString();
  }

  // Like video
  like(): void {
    this.likes += 1;
    this.updatedAt = new Date().toISOString();
  }

  // Share video
  share(): void {
    this.shares += 1;
    this.updatedAt = new Date().toISOString();
  }
}