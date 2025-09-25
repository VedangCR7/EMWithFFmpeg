// EventMarketers Backend API Configuration

export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.22:3001', // Local backend for testing (Android compatible)
  TIMEOUT: 30000, // 30 seconds
  VERSION: '1.0.0',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Health Check
  HEALTH: '/health',
  
  // Mobile App Endpoints
  MOBILE: {
    BUSINESS_CATEGORIES: '/api/mobile/business-categories',
    CONTENT: (customerId: string) => `/api/mobile/content/${customerId}`,
    PROFILE: (customerId: string) => `/api/mobile/profile/${customerId}`,
  },
  
  // Installed Users (App Users)
  INSTALLED_USERS: {
    REGISTER: '/api/installed-users/register',
    PROFILE: (deviceId: string) => `/api/installed-users/profile/${deviceId}`,
    ACTIVITY: '/api/installed-users/activity',
  },
  
  // Business Profile
  BUSINESS_PROFILE: {
    CREATE: '/api/business-profile/profile',
    UPLOAD_LOGO: '/api/business-profile/upload-logo',
  },
  
  // Authentication
  AUTH: {
    ADMIN_LOGIN: '/api/auth/admin/login',
    SUBADMIN_LOGIN: '/api/auth/subadmin/login',
    ME: '/api/auth/me',
  },
  
  // Content Management
  CONTENT: {
    IMAGES: '/api/content/images',
    VIDEOS: '/api/content/videos',
    PENDING_APPROVALS: '/api/content/pending-approvals',
  },
  
  // Admin Management
  ADMIN: {
    SUBADMINS: '/api/admin/subadmins',
  },
  
  // API Aliases (Cleaner Paths)
  V1: {
    CATEGORIES: '/api/v1/categories',
    CONTENT: (customerId: string) => `/api/v1/content/${customerId}`,
    PROFILE: (customerId: string) => `/api/v1/profile/${customerId}`,
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
}

export interface BusinessCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface User {
  id: string;
  deviceId: string;
  name: string;
  email: string;
  phone: string;
  installDate?: string;
  totalViews?: number;
  downloadAttempts?: number;
  isConverted?: boolean;
  lastActiveAt?: string;
}

export interface UserActivity {
  deviceId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: any;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  category: string;
  tags: string[];
  downloads?: number;
  views?: number;
  duration?: number; // for videos
}

export interface CustomerContent {
  images: ContentItem[];
  videos: ContentItem[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BusinessProfile {
  id: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessWebsite?: string;
  businessAddress?: string;
  businessDescription?: string;
  businessCategory: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
  assignedCategories?: string[];
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

// Error Types
export const ERROR_TYPES = {
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];

// Request Headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'EventMarketers-Mobile/1.0.0',
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
};

// Rate Limiting
export const RATE_LIMIT = {
  REQUESTS_PER_WINDOW: 100,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
};

// Device ID Generation
export const generateDeviceId = (): string => {
  return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// API Helper Functions
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams.toString();
};

export const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  const baseUrl = API_CONFIG.BASE_URL + endpoint;
  
  if (params) {
    const queryString = buildQueryString(params);
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }
  
  return baseUrl;
};
