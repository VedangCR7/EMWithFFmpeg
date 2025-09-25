import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance for EventMarketers backend
const eventMarketersApi = axios.create({
  baseURL: 'http://localhost:3001', // Local development server
  // baseURL: 'https://eventmarketersbackend.onrender.com', // Production backend server
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
eventMarketersApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
eventMarketersApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log('API request timed out');
      return Promise.reject(new Error('TIMEOUT'));
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('Authentication failed, clearing tokens');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.data);
      return Promise.reject(new Error('SERVER_ERROR'));
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('NETWORK_ERROR'));
    }
    
    return Promise.reject(error);
  }
);

// API Service Functions for EventMarketers

// Health Check
export const checkAPIHealth = async () => {
  try {
    const response = await eventMarketersApi.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// Business Categories
export const getBusinessCategories = async () => {
  try {
    const response = await eventMarketersApi.get('/api/mobile/business-categories');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch business categories:', error);
    throw error;
  }
};

// User Registration (Installed Users)
export const registerUser = async (userData: {
  deviceId: string;
  name: string;
  email: string;
  phone: string;
  appVersion?: string;
}) => {
  try {
    const response = await eventMarketersApi.post('/api/installed-users/register', {
      ...userData,
      appVersion: userData.appVersion || '1.0.0'
    });
    return response.data;
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
};

// Get User Profile
export const getUserProfile = async (deviceId: string) => {
  try {
    const response = await eventMarketersApi.get(`/api/installed-users/profile/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};

// Update User Profile
export const updateUserProfile = async (deviceId: string, profileData: {
  name?: string;
  email?: string;
  phone?: string;
}) => {
  try {
    const response = await eventMarketersApi.put(`/api/installed-users/profile/${deviceId}`, profileData);
    return response.data;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
};

// Record User Activity
export const recordUserActivity = async (activityData: {
  deviceId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: any;
}) => {
  try {
    const response = await eventMarketersApi.post('/api/installed-users/activity', activityData);
    return response.data;
  } catch (error) {
    console.error('Failed to record user activity:', error);
    throw error;
  }
};

// Get Customer Content (for subscribed users)
export const getCustomerContent = async (customerId: string, options?: {
  category?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const queryString = params.toString();
    const url = `/api/mobile/content/${customerId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await eventMarketersApi.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch customer content:', error);
    throw error;
  }
};

// Get Customer Profile (for subscribed users)
export const getCustomerProfile = async (customerId: string) => {
  try {
    const response = await eventMarketersApi.get(`/api/mobile/profile/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch customer profile:', error);
    throw error;
  }
};

// Business Profile Creation
export const createBusinessProfile = async (profileData: {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessWebsite?: string;
  businessAddress?: string;
  businessDescription?: string;
  businessCategory: string;
}) => {
  try {
    const response = await eventMarketersApi.post('/api/business-profile/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Failed to create business profile:', error);
    throw error;
  }
};

// Upload Business Logo
export const uploadBusinessLogo = async (logoFile: any) => {
  try {
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    const response = await eventMarketersApi.post('/api/business-profile/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to upload business logo:', error);
    throw error;
  }
};

// Authentication Functions

// Admin Login
export const adminLogin = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await eventMarketersApi.post('/api/auth/admin/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Admin login failed:', error);
    throw error;
  }
};

// Subadmin Login
export const subadminLogin = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await eventMarketersApi.post('/api/auth/subadmin/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Subadmin login failed:', error);
    throw error;
  }
};

// Get Current User
export const getCurrentUser = async () => {
  try {
    const response = await eventMarketersApi.get('/api/auth/me');
    return response.data;
  } catch (error) {
    console.error('Failed to get current user:', error);
    throw error;
  }
};

// Content Management Functions

// Upload Image
export const uploadImage = async (imageData: {
  image: any;
  title: string;
  description: string;
  category: string;
  businessCategoryId: string;
  tags: string;
}) => {
  try {
    const formData = new FormData();
    formData.append('image', imageData.image);
    formData.append('title', imageData.title);
    formData.append('description', imageData.description);
    formData.append('category', imageData.category);
    formData.append('businessCategoryId', imageData.businessCategoryId);
    formData.append('tags', imageData.tags);
    
    const response = await eventMarketersApi.post('/api/content/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
};

// Upload Video
export const uploadVideo = async (videoData: {
  video: any;
  title: string;
  description: string;
  category: string;
  businessCategoryId: string;
  tags: string;
}) => {
  try {
    const formData = new FormData();
    formData.append('video', videoData.video);
    formData.append('title', videoData.title);
    formData.append('description', videoData.description);
    formData.append('category', videoData.category);
    formData.append('businessCategoryId', videoData.businessCategoryId);
    formData.append('tags', videoData.tags);
    
    const response = await eventMarketersApi.post('/api/content/videos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to upload video:', error);
    throw error;
  }
};

// Get Pending Approvals
export const getPendingApprovals = async () => {
  try {
    const response = await eventMarketersApi.get('/api/content/pending-approvals');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch pending approvals:', error);
    throw error;
  }
};

// Admin Management Functions

// Get Subadmins
export const getSubadmins = async () => {
  try {
    const response = await eventMarketersApi.get('/api/admin/subadmins');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch subadmins:', error);
    throw error;
  }
};

// Create Subadmin
export const createSubadmin = async (subadminData: {
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
  assignedCategories: string[];
}) => {
  try {
    const response = await eventMarketersApi.post('/api/admin/subadmins', subadminData);
    return response.data;
  } catch (error) {
    console.error('Failed to create subadmin:', error);
    throw error;
  }
};

export default eventMarketersApi;