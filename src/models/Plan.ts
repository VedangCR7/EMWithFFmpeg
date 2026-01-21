export interface PlanFeature {
  name: string;
  value: string | number | boolean;
  description?: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly' | 'one-time';
  features: PlanFeature[];
  maxVideos: number;
  maxGreetings: number;
  maxStorage: number; // in GB
  isPopular: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class PlanModel implements Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly' | 'one-time';
  features: PlanFeature[];
  maxVideos: number;
  maxGreetings: number;
  maxStorage: number;
  isPopular: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    name: string,
    description: string,
    price: number,
    currency: string = 'USD',
    interval: 'monthly' | 'yearly' | 'one-time' = 'monthly',
    features: PlanFeature[] = [],
    maxVideos: number = 0,
    maxGreetings: number = 0,
    maxStorage: number = 0,
    isPopular: boolean = false,
    isActive: boolean = true,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.currency = currency;
    this.interval = interval;
    this.features = features;
    this.maxVideos = maxVideos;
    this.maxGreetings = maxGreetings;
    this.maxStorage = maxStorage;
    this.isPopular = isPopular;
    this.isActive = isActive;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  // Validation methods
  isValid(): boolean {
    return !!(this.name && this.name.length > 0 && this.price >= 0);
  }

  // Plan operations
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date().toISOString();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date().toISOString();
  }

  markAsPopular(): void {
    this.isPopular = true;
    this.updatedAt = new Date().toISOString();
  }

  unmarkAsPopular(): void {
    this.isPopular = false;
    this.updatedAt = new Date().toISOString();
  }

  // Calculate pricing
  getYearlyPrice(): number {
    if (this.interval === 'yearly') return this.price;
    return this.price * 12;
  }

  getMonthlyPrice(): number {
    if (this.interval === 'monthly') return this.price;
    return this.price / 12;
  }

  // Check if plan allows certain limits
  canCreateVideo(currentCount: number): boolean {
    return this.maxVideos === 0 || currentCount < this.maxVideos;
  }

  canCreateGreeting(currentCount: number): boolean {
    return this.maxGreetings === 0 || currentCount < this.maxGreetings;
  }

  hasStorageSpace(currentUsage: number): boolean {
    return this.maxStorage === 0 || currentUsage < this.maxStorage;
  }
}