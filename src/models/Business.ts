export interface BusinessContact {
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  contact: BusinessContact;
  logo?: string;
  banner?: string;
  isVerified: boolean;
  isActive: boolean;
  subscriptionStatus: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export class BusinessModel implements Business {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  contact: BusinessContact;
  logo?: string;
  banner?: string;
  isVerified: boolean;
  isActive: boolean;
  subscriptionStatus: 'active' | 'inactive' | 'suspended';

  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    userId: string,
    name: string,
    category: string,
    contact: BusinessContact = {},
    description?: string,
    logo?: string,
    banner?: string,
    isVerified: boolean = false,
    isActive: boolean = true,
    subscriptionStatus: 'active' | 'inactive' | 'suspended' = 'inactive',
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.description = description;
    this.category = category;
    this.contact = contact;
    this.logo = logo;
    this.banner = banner;
    this.isVerified = isVerified;
    this.isActive = isActive;
    this.subscriptionStatus = subscriptionStatus;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  // Validation methods
  isValid(): boolean {
    return !!(this.name && this.name.length > 0 && this.category && this.category.length > 0);
  }

  // Business operations
  verify(): void {
    this.isVerified = true;
    this.updatedAt = new Date().toISOString();
  }

  suspend(): void {
    this.subscriptionStatus = 'suspended';
    this.updatedAt = new Date().toISOString();
  }

  activate(): void {
    this.subscriptionStatus = 'active';
    this.isActive = true;
    this.updatedAt = new Date().toISOString();
  }

  deactivate(): void {
    this.subscriptionStatus = 'inactive';
    this.isActive = false;
    this.updatedAt = new Date().toISOString();
  }

  updateContact(newContact: Partial<BusinessContact>): void {
    this.contact = { ...this.contact, ...newContact };
    this.updatedAt = new Date().toISOString();
  }
}