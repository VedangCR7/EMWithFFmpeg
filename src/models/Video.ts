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
  comments: number;
  bitrate: number;
  codec: string;
  aspectRatio: string;
}

export interface VideoAnalytics {
  watchTime: number;
  completionRate: number;
  audienceRetention: number[];
  trafficSources: Record<string, number>;
  deviceStats: Record<string, number>;
  geographicViews: Record<string, number>;
}

export interface Video {
  id: string;
  userId: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed' | 'published' | 'archived';
  tags: string[];
  category: string;
  resolution: string;
  fileSize: number;
  bitrate: number;
  codec: string;
  aspectRatio: string;
  views: number;
  likes: number;
  dislikes: number;
  shares: number;
  comments: number;
  saves: number;
  processingProgress: number;
  isPublic: boolean;
  isMonetized: boolean;
  allowComments: boolean;
  allowDownloads: boolean;
  analytics: VideoAnalytics;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export class VideoModel implements Video {
  id: string;
  userId: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed' | 'published' | 'archived';
  tags: string[];
  category: string;
  resolution: string;
  fileSize: number;
  bitrate: number;
  codec: string;
  aspectRatio: string;
  views: number;
  likes: number;
  dislikes: number;
  shares: number;
  comments: number;
  saves: number;
  processingProgress: number;
  isPublic: boolean;
  isMonetized: boolean;
  allowComments: boolean;
  allowDownloads: boolean;
  analytics: VideoAnalytics;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;

  constructor(
    id: string,
    userId: string,
    title: string,
    description: string,
    url: string,
    category: string = 'general',
    thumbnailUrl?: string,
    duration: number = 0,
    status: 'processing' | 'completed' | 'failed' | 'published' | 'archived' = 'processing',
    tags: string[] = [],
    resolution: string = '1080p',
    fileSize: number = 0,
    bitrate: number = 2500000,
    codec: string = 'h264',
    aspectRatio: string = '16:9',
    views: number = 0,
    likes: number = 0,
    dislikes: number = 0,
    shares: number = 0,
    comments: number = 0,
    saves: number = 0,
    processingProgress: number = 0,
    isPublic: boolean = true,
    isMonetized: boolean = false,
    allowComments: boolean = true,
    allowDownloads: boolean = false,
    analytics?: Partial<VideoAnalytics>,
    createdAt?: string,
    updatedAt?: string,
    publishedAt?: string
  ) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.url = url;
    this.category = category;
    this.thumbnailUrl = thumbnailUrl;
    this.duration = duration;
    this.status = status;
    this.tags = tags;
    this.resolution = resolution;
    this.fileSize = fileSize;
    this.bitrate = bitrate;
    this.codec = codec;
    this.aspectRatio = aspectRatio;
    this.views = views;
    this.likes = likes;
    this.dislikes = dislikes;
    this.shares = shares;
    this.comments = comments;
    this.saves = saves;
    this.processingProgress = processingProgress;
    this.isPublic = isPublic;
    this.isMonetized = isMonetized;
    this.allowComments = allowComments;
    this.allowDownloads = allowDownloads;
    this.analytics = {
      watchTime: 0,
      completionRate: 0,
      audienceRetention: [],
      trafficSources: {},
      deviceStats: {},
      geographicViews: {},
      ...analytics
    };
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
    this.publishedAt = publishedAt;
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
      shares: this.shares,
      comments: this.comments,
      bitrate: this.bitrate,
      codec: this.codec,
      aspectRatio: this.aspectRatio
    };
  }

  // Status checks
  isProcessed(): boolean {
    return this.status === 'completed' || this.status === 'published';
  }

  isPublished(): boolean {
    return this.status === 'published';
  }

  isArchived(): boolean {
    return this.status === 'archived';
  }

  // Status management
  publish(): void {
    this.status = 'published';
    this.publishedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  archive(): void {
    this.status = 'archived';
    this.updatedAt = new Date().toISOString();
  }

  fail(): void {
    this.status = 'failed';
    this.updatedAt = new Date().toISOString();
  }

  // Processing management
  updateProgress(progress: number): void {
    this.processingProgress = Math.min(100, Math.max(0, progress));
    if (this.processingProgress === 100 && this.status === 'processing') {
      this.status = 'completed';
    }
    this.updatedAt = new Date().toISOString();
  }

  // Engagement tracking
  incrementViews(): void {
    this.views += 1;
    this.updatedAt = new Date().toISOString();
  }

  like(): void {
    this.likes += 1;
    this.updatedAt = new Date().toISOString();
  }

  dislike(): void {
    this.dislikes += 1;
    this.updatedAt = new Date().toISOString();
  }

  share(): void {
    this.shares += 1;
    this.updatedAt = new Date().toISOString();
  }

  addComment(): void {
    if (this.allowComments) {
      this.comments += 1;
      this.updatedAt = new Date().toISOString();
    }
  }

  save(): void {
    this.saves += 1;
    this.updatedAt = new Date().toISOString();
  }

  // Privacy and access control
  makePublic(): void {
    this.isPublic = true;
    this.updatedAt = new Date().toISOString();
  }

  makePrivate(): void {
    this.isPublic = false;
    this.updatedAt = new Date().toISOString();
  }

  enableMonetization(): void {
    this.isMonetized = true;
    this.updatedAt = new Date().toISOString();
  }

  disableMonetization(): void {
    this.isMonetized = false;
    this.updatedAt = new Date().toISOString();
  }

  // Settings management
  updateSettings(settings: Partial<Pick<Video, 'allowComments' | 'allowDownloads' | 'isMonetized'>>): void {
    if (settings.allowComments !== undefined) this.allowComments = settings.allowComments;
    if (settings.allowDownloads !== undefined) this.allowDownloads = settings.allowDownloads;
    if (settings.isMonetized !== undefined) this.isMonetized = settings.isMonetized;
    this.updatedAt = new Date().toISOString();
  }

  // Analytics tracking
  updateAnalytics(updates: Partial<VideoAnalytics>): void {
    this.analytics = { ...this.analytics, ...updates };
    this.updatedAt = new Date().toISOString();
  }

  recordView(deviceType?: string, country?: string, source?: string): void {
    this.incrementViews();

    if (deviceType) {
      this.analytics.deviceStats[deviceType] = (this.analytics.deviceStats[deviceType] || 0) + 1;
    }

    if (country) {
      this.analytics.geographicViews[country] = (this.analytics.geographicViews[country] || 0) + 1;
    }

    if (source) {
      this.analytics.trafficSources[source] = (this.analytics.trafficSources[source] || 0) + 1;
    }
  }

  // Utility methods
  getEngagementRate(): number {
    if (this.views === 0) return 0;
    return ((this.likes + this.shares + this.comments + this.saves) / this.views) * 100;
  }

  getLikeRatio(): number {
    const totalVotes = this.likes + this.dislikes;
    if (totalVotes === 0) return 0;
    return (this.likes / totalVotes) * 100;
  }

  getFileSizeMB(): number {
    return this.fileSize / (1024 * 1024);
  }

  getDurationFormatted(): string {
    const minutes = Math.floor(this.duration / 60);
    const seconds = this.duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}