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
  hourlyViews: number[];
  dailyViews: number[];
  peakViewingHours: number[];
  bounceRate: number;
  averageViewDuration: number;
  clickThroughRate: number;
  shareRate: number;
  saveRate: number;
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
      hourlyViews: new Array(24).fill(0),
      dailyViews: new Array(7).fill(0),
      peakViewingHours: [],
      bounceRate: 0,
      averageViewDuration: 0,
      clickThroughRate: 0,
      shareRate: 0,
      saveRate: 0,
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

  recordView(deviceType?: string, country?: string, source?: string, watchDuration?: number, currentHour?: number, currentDay?: number): void {
    this.incrementViews();

    // Update basic stats
    if (deviceType) {
      this.analytics.deviceStats[deviceType] = (this.analytics.deviceStats[deviceType] || 0) + 1;
    }

    if (country) {
      this.analytics.geographicViews[country] = (this.analytics.geographicViews[country] || 0) + 1;
    }

    if (source) {
      this.analytics.trafficSources[source] = (this.analytics.trafficSources[source] || 0) + 1;
    }

    // Update time-based analytics
    if (currentHour !== undefined && currentHour >= 0 && currentHour < 24) {
      this.analytics.hourlyViews[currentHour] += 1;
    }

    if (currentDay !== undefined && currentDay >= 0 && currentDay < 7) {
      this.analytics.dailyViews[currentDay] += 1;
    }

    // Update watch time analytics
    if (watchDuration !== undefined) {
      this.analytics.watchTime += watchDuration;
      this.analytics.averageViewDuration = this.analytics.watchTime / this.views;

      // Calculate completion rate
      const completedViews = Math.floor((this.analytics.watchTime / this.duration) / this.views);
      this.analytics.completionRate = Math.min(100, completedViews * 100);
    }
  }

  calculatePeakHours(): void {
    const threshold = Math.max(...this.analytics.hourlyViews) * 0.8; // Top 20% of max views
    this.analytics.peakViewingHours = this.analytics.hourlyViews
      .map((views, hour) => ({ views, hour }))
      .filter(item => item.views >= threshold)
      .sort((a, b) => b.views - a.views)
      .slice(0, 3)
      .map(item => item.hour);
  }

  updateEngagementRates(): void {
    if (this.views === 0) return;

    this.analytics.shareRate = (this.shares / this.views) * 100;
    this.analytics.saveRate = (this.saves / this.views) * 100;
    this.analytics.bounceRate = ((this.views - (this.likes + this.shares + this.comments + this.saves)) / this.views) * 100;
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

  // Performance metrics
  getVideoScore(): number {
    // Calculate overall video performance score (0-100)
    const engagementScore = Math.min(this.getEngagementRate() * 2, 40);
    const completionScore = Math.min(this.analytics.completionRate * 0.6, 30);
    const retentionScore = this.analytics.audienceRetention.length > 0
      ? (this.analytics.audienceRetention.reduce((a, b) => a + b, 0) / this.analytics.audienceRetention.length) * 0.3
      : 0;

    return Math.round(engagementScore + completionScore + retentionScore);
  }

  getTrendingScore(): number {
    // Calculate trending potential based on recent engagement velocity
    const recentViews = this.views; // In a real app, this would be recent views
    const engagementVelocity = this.getEngagementRate();
    const shareVelocity = this.analytics.shareRate;

    return recentViews * 0.001 + engagementVelocity * 0.5 + shareVelocity * 2;
  }

  getMonetizationPotential(): 'high' | 'medium' | 'low' {
    const score = this.getVideoScore();
    const views = this.views;

    if (score >= 70 && views >= 10000) return 'high';
    if (score >= 50 && views >= 1000) return 'medium';
    return 'low';
  }

  predictViewGrowth(days: number = 30): number {
    // Simple linear regression based on current growth patterns
    if (this.views < 100) return this.views * 1.1; // Conservative growth for new videos

    const dailyGrowthRate = Math.max(0.001, this.getEngagementRate() / 10000); // Convert to decimal
    return Math.round(this.views * Math.pow(1 + dailyGrowthRate, days));
  }

  getOptimalPostingTime(): number {
    // Return the hour with highest average views
    if (this.analytics.peakViewingHours.length === 0) {
      this.calculatePeakHours();
    }

    return this.analytics.peakViewingHours[0] || 12; // Default to noon if no data
  }
}