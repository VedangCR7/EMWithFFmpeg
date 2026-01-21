export interface TemplateCustomization {
  colors: string[];
  fonts: string[];
  layouts: string[];
  effects: string[];
}

export interface TemplateUsage {
  userId: string;
  count: number;
  lastUsed: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'video' | 'greeting' | 'poster';
  thumbnail: string;
  previewUrl?: string;
  customization: TemplateCustomization;
  tags: string[];
  isPremium: boolean;
  isActive: boolean;
  usageCount: number;
  usageStats: TemplateUsage[];
  createdBy: string; // userId of creator
  createdAt: string;
  updatedAt: string;
}

export class TemplateModel implements Template {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'video' | 'greeting' | 'poster';
  thumbnail: string;
  previewUrl?: string;
  customization: TemplateCustomization;
  tags: string[];
  isPremium: boolean;
  isActive: boolean;
  usageCount: number;
  usageStats: TemplateUsage[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    name: string,
    description: string,
    category: string,
    type: 'video' | 'greeting' | 'poster',
    thumbnail: string,
    createdBy: string,
    customization: TemplateCustomization = { colors: [], fonts: [], layouts: [], effects: [] },
    tags: string[] = [],
    isPremium: boolean = false,
    isActive: boolean = true,
    usageCount: number = 0,
    usageStats: TemplateUsage[] = [],
    previewUrl?: string,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.category = category;
    this.type = type;
    this.thumbnail = thumbnail;
    this.previewUrl = previewUrl;
    this.customization = customization;
    this.tags = tags;
    this.isPremium = isPremium;
    this.isActive = isActive;
    this.usageCount = usageCount;
    this.usageStats = usageStats;
    this.createdBy = createdBy;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  // Validation methods
  isValid(): boolean {
    return !!(
      this.name &&
      this.name.length > 0 &&
      this.category &&
      this.thumbnail &&
      this.createdBy
    );
  }

  // Template operations
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date().toISOString();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date().toISOString();
  }

  markAsPremium(): void {
    this.isPremium = true;
    this.updatedAt = new Date().toISOString();
  }

  markAsFree(): void {
    this.isPremium = false;
    this.updatedAt = new Date().toISOString();
  }

  // Usage tracking
  recordUsage(userId: string): void {
    this.usageCount += 1;

    const existingUsage = this.usageStats.find(stat => stat.userId === userId);
    if (existingUsage) {
      existingUsage.count += 1;
      existingUsage.lastUsed = new Date().toISOString();
    } else {
      this.usageStats.push({
        userId,
        count: 1,
        lastUsed: new Date().toISOString()
      });
    }

    this.updatedAt = new Date().toISOString();
  }

  getUsageByUser(userId: string): TemplateUsage | undefined {
    return this.usageStats.find(stat => stat.userId === userId);
  }

  // Customization helpers
  addColor(color: string): void {
    if (!this.customization.colors.includes(color)) {
      this.customization.colors.push(color);
      this.updatedAt = new Date().toISOString();
    }
  }

  addFont(font: string): void {
    if (!this.customization.fonts.includes(font)) {
      this.customization.fonts.push(font);
      this.updatedAt = new Date().toISOString();
    }
  }

  addLayout(layout: string): void {
    if (!this.customization.layouts.includes(layout)) {
      this.customization.layouts.push(layout);
      this.updatedAt = new Date().toISOString();
    }
  }

  addEffect(effect: string): void {
    if (!this.customization.effects.includes(effect)) {
      this.customization.effects.push(effect);
      this.updatedAt = new Date().toISOString();
    }
  }

  // Tag management
  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date().toISOString();
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
    this.updatedAt = new Date().toISOString();
  }
}