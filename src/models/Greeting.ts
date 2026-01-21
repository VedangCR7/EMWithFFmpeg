export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export interface GreetingData {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  customization: Record<string, any>;
  category: string;
  tags: string[];
  isPublic: boolean;
  views: number;
  downloads: number;
  rating: number;
}

export interface Greeting {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  content: string;
  mediaUrl?: string;
  customization: Record<string, any>;
  status: 'draft' | 'published' | 'archived';
  category: string;
  tags: string[];
  isPublic: boolean;
  views: number;
  downloads: number;
  rating: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export class GreetingModel implements Greeting {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  content: string;
  mediaUrl?: string;
  customization: Record<string, any>;
  status: 'draft' | 'published' | 'archived';
  category: string;
  tags: string[];
  isPublic: boolean;
  views: number;
  downloads: number;
  rating: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    userId: string,
    templateId: string,
    title: string,
    content: string,
    mediaUrl?: string,
    customization: Record<string, any> = {},
    status: 'draft' | 'published' | 'archived' = 'draft',
    category: string = 'general',
    tags: string[] = [],
    isPublic: boolean = false,
    views: number = 0,
    downloads: number = 0,
    rating: number = 0,
    comments: Comment[] = [],
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.userId = userId;
    this.templateId = templateId;
    this.title = title;
    this.content = content;
    this.mediaUrl = mediaUrl;
    this.customization = customization;
    this.status = status;
    this.category = category;
    this.tags = tags;
    this.isPublic = isPublic;
    this.views = views;
    this.downloads = downloads;
    this.rating = rating;
    this.comments = comments;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  // Validation methods
  isValid(): boolean {
    return !!(this.title && this.title.length > 0 && this.content && this.content.length > 0);
  }

  // Get greeting data
  getGreetingData(): GreetingData {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      mediaUrl: this.mediaUrl,
      customization: this.customization,
      category: this.category,
      tags: this.tags,
      isPublic: this.isPublic,
      views: this.views,
      downloads: this.downloads,
      rating: this.rating
    };
  }

  // Publish greeting
  publish(): void {
    this.status = 'published';
    this.isPublic = true;
    this.updatedAt = new Date().toISOString();
  }

  // Archive greeting
  archive(): void {
    this.status = 'archived';
    this.isPublic = false;
    this.updatedAt = new Date().toISOString();
  }

  // Add comment
  addComment(text: string): void {
    this.comments.push({
      id: Date.now().toString(),
      text,
      createdAt: new Date().toISOString()
    });
    this.updatedAt = new Date().toISOString();
  }

  // Increment views
  incrementViews(): void {
    this.views += 1;
    this.updatedAt = new Date().toISOString();
  }

  // Increment downloads
  incrementDownloads(): void {
    this.downloads += 1;
    this.updatedAt = new Date().toISOString();
  }

  // Update rating
  updateRating(newRating: number): void {
    this.rating = Math.min(5, Math.max(0, newRating));
    this.updatedAt = new Date().toISOString();
  }
}