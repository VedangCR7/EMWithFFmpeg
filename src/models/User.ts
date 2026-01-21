export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessId?: string;
  planId?: string;
  avatar?: string;
  isActive: boolean;
  role: 'user' | 'admin' | 'business';
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export class UserModel implements User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessId?: string;
  planId?: string;
  avatar?: string;
  isActive: boolean;
  role: 'user' | 'admin' | 'business';
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    name: string,
    email: string,
    phone?: string,
    businessId?: string,
    planId?: string,
    avatar?: string,
    isActive: boolean = true,
    role: 'user' | 'admin' | 'business' = 'user',
    preferences: UserPreferences = { theme: 'light', notifications: true, language: 'en' },
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.businessId = businessId;
    this.planId = planId;
    this.avatar = avatar;
    this.isActive = isActive;
    this.role = role;
    this.preferences = preferences;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  // Validation methods
  isValid(): boolean {
    return !!(this.email && this.email.includes('@') && this.name && this.name.length > 0);
  }

  // Get display name
  getDisplayName(): string {
    return this.name || this.email;
  }

  // Check if user has admin role
  isAdmin(): boolean {
    return this.role === 'admin';
  }

  // Update user preferences
  updatePreferences(newPreferences: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.updatedAt = new Date().toISOString();
  }

  // Deactivate user
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date().toISOString();
  }

  // Activate user
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date().toISOString();
  }
}