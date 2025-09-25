import api from './api';

// Types for API responses
export interface HealthCheckResponse {
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

export interface BusinessCategoriesResponse {
  success: boolean;
  categories: BusinessCategory[];
}

export interface InstalledUser {
  id: string;
  deviceId: string;
  name: string;
  email: string;
  phone?: string;
  installDate: string;
  totalViews?: number;
  downloadAttempts?: number;
  isConverted?: boolean;
  lastActiveAt?: string;
}

export interface RegisterUserRequest {
  deviceId: string;
  name: string;
  email: string;
  phone: string;
  appVersion: string;
}

export interface RegisterUserResponse {
  success: boolean;
  user: InstalledUser;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface UserActivityRequest {
  deviceId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: any;
}

export interface UserActivityResponse {
  success: boolean;
  activity: {
    id: string;
    deviceId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    timestamp: string;
  };
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  downloads: number;
  views: number;
  duration?: number; // For videos
}

export interface CustomerContentResponse {
  success: boolean;
  content: {
    images: ContentItem[];
    videos: ContentItem[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessCategory: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  totalDownloads: number;
  lastActiveAt: string;
}

export interface CustomerProfileResponse {
  success: boolean;
  customer: CustomerProfile;
}

export interface BusinessProfileRequest {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessWebsite?: string;
  businessAddress: string;
  businessDescription: string;
  businessCategory: string;
}

export interface BusinessProfileResponse {
  success: boolean;
  profile: {
    id: string;
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    businessWebsite?: string;
    businessAddress: string;
    businessDescription: string;
    businessCategory: string;
    createdAt: string;
  };
}

export interface LogoUploadResponse {
  success: boolean;
  logoUrl: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
  assignedCategories?: string[];
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SubadminRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
  assignedCategories: string[];
}

export interface SubadminResponse {
  success: boolean;
  subadmin: AuthUser & {
    status: string;
    createdAt: string;
    lastLogin?: string;
  };
}

export interface PendingApproval {
  id: string;
  type: string;
  title: string;
  uploadedBy: string;
  uploadedAt: string;
  category: string;
}

export interface PendingApprovalsResponse {
  success: boolean;
  pendingApprovals: PendingApproval[];
}

export interface ContentUploadResponse {
  success: boolean;
  image?: {
    id: string;
    title: string;
    description: string;
    url: string;
    category: string;
    approvalStatus: string;
    createdAt: string;
  };
  video?: {
    id: string;
    title: string;
    description: string;
    url: string;
    category: string;
    approvalStatus: string;
    createdAt: string;
  };
}

class EventMarketersService {
  // 1. Health Check
  async getHealthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // 2. Business Categories
  async getBusinessCategories(): Promise<BusinessCategoriesResponse> {
    try {
      const response = await api.get('/api/mobile/business-categories');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch business categories:', error);
      throw error;
    }
  }

  // 3. User Registration (Installed Users)
  async registerInstalledUser(userData: RegisterUserRequest): Promise<RegisterUserResponse> {
    try {
      const response = await api.post('/api/installed-users/register', userData);
      return response.data;
    } catch (error) {
      console.error('Failed to register installed user:', error);
      throw error;
    }
  }

  // 4. Get User Profile
  async getUserProfile(deviceId: string): Promise<{ success: boolean; user: InstalledUser }> {
    try {
      const response = await api.get(`/api/installed-users/profile/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  // 5. Update User Profile
  async updateUserProfile(deviceId: string, userData: UpdateUserRequest): Promise<{ success: boolean; user: InstalledUser }> {
    try {
      const response = await api.put(`/api/installed-users/profile/${deviceId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  // 6. Record User Activity
  async recordUserActivity(activityData: UserActivityRequest): Promise<UserActivityResponse> {
    try {
      const response = await api.post('/api/installed-users/activity', activityData);
      return response.data;
    } catch (error) {
      console.error('Failed to record user activity:', error);
      throw error;
    }
  }

  // 7. Get Customer Content
  async getCustomerContent(
    customerId: string, 
    options?: { category?: string; page?: number; limit?: number }
  ): Promise<CustomerContentResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.category) params.append('category', options.category);
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());

      const queryString = params.toString();
      const url = `/api/mobile/content/${customerId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to get customer content:', error);
      throw error;
    }
  }

  // 8. Get Customer Profile
  async getCustomerProfile(customerId: string): Promise<CustomerProfileResponse> {
    try {
      const response = await api.get(`/api/mobile/profile/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get customer profile:', error);
      throw error;
    }
  }

  // 9. Business Profile Creation
  async createBusinessProfile(profileData: BusinessProfileRequest): Promise<BusinessProfileResponse> {
    try {
      const response = await api.post('/api/business-profile/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to create business profile:', error);
      throw error;
    }
  }

  // 10. Upload Business Logo
  async uploadBusinessLogo(logoFile: any): Promise<LogoUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await api.post('/api/business-profile/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload business logo:', error);
      throw error;
    }
  }

  // 11. Admin Login
  async adminLogin(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/auth/admin/login', loginData);
      return response.data;
    } catch (error) {
      console.error('Admin login failed:', error);
      throw error;
    }
  }

  // 12. Subadmin Login
  async subadminLogin(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/auth/subadmin/login', loginData);
      return response.data;
    } catch (error) {
      console.error('Subadmin login failed:', error);
      throw error;
    }
  }

  // 13. Get Current User
  async getCurrentUser(): Promise<{ success: boolean; user: AuthUser }> {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  // 14. Get Subadmins
  async getSubadmins(): Promise<{ success: boolean; subadmins: SubadminResponse['subadmin'][] }> {
    try {
      const response = await api.get('/api/admin/subadmins');
      return response.data;
    } catch (error) {
      console.error('Failed to get subadmins:', error);
      throw error;
    }
  }

  // 15. Create Subadmin
  async createSubadmin(subadminData: SubadminRequest): Promise<SubadminResponse> {
    try {
      const response = await api.post('/api/admin/subadmins', subadminData);
      return response.data;
    } catch (error) {
      console.error('Failed to create subadmin:', error);
      throw error;
    }
  }

  // 16. Get Pending Approvals
  async getPendingApprovals(): Promise<PendingApprovalsResponse> {
    try {
      const response = await api.get('/api/content/pending-approvals');
      return response.data;
    } catch (error) {
      console.error('Failed to get pending approvals:', error);
      throw error;
    }
  }

  // 17. Upload Image
  async uploadImage(imageData: {
    image: any;
    title: string;
    description: string;
    category: string;
    businessCategoryId: string;
    tags: string;
  }): Promise<ContentUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', imageData.image);
      formData.append('title', imageData.title);
      formData.append('description', imageData.description);
      formData.append('category', imageData.category);
      formData.append('businessCategoryId', imageData.businessCategoryId);
      formData.append('tags', imageData.tags);

      const response = await api.post('/api/content/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }

  // 18. Upload Video
  async uploadVideo(videoData: {
    video: any;
    title: string;
    description: string;
    category: string;
    businessCategoryId: string;
    tags: string;
  }): Promise<ContentUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('video', videoData.video);
      formData.append('title', videoData.title);
      formData.append('description', videoData.description);
      formData.append('category', videoData.category);
      formData.append('businessCategoryId', videoData.businessCategoryId);
      formData.append('tags', videoData.tags);

      const response = await api.post('/api/content/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload video:', error);
      throw error;
    }
  }

  // 19. Get Categories (Alias)
  async getCategories(): Promise<BusinessCategoriesResponse> {
    try {
      const response = await api.get('/api/v1/categories');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  }

  // 20. Get Content (Alias)
  async getContent(
    customerId: string, 
    options?: { category?: string; page?: number; limit?: number }
  ): Promise<CustomerContentResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.category) params.append('category', options.category);
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());

      const queryString = params.toString();
      const url = `/api/v1/content/${customerId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to get content:', error);
      throw error;
    }
  }

  // 21. Get Profile (Alias)
  async getProfile(customerId: string): Promise<CustomerProfileResponse> {
    try {
      const response = await api.get(`/api/v1/profile/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }

  // Utility method to save auth token
  async saveAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('eventMarketersToken', token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  // Utility method to get auth token
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('eventMarketersToken');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  // Utility method to clear auth token
  async clearAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('eventMarketersToken');
      await AsyncStorage.removeItem('eventMarketersUser');
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }
}

export default new EventMarketersService();
