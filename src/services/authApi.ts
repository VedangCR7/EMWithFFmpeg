import api from './api';

// Types for authentication
export interface RegisterRequest {
  email: string;
  password: string;
  companyName: string;
  phoneNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
  accessToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  logo?: string;
  photo?: string;
  description?: string;
  category?: string;
  address?: string;
  alternatePhone?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  companyName?: string;
  phoneNumber?: string;
  logo?: string;
  photo?: string;
  description?: string;
  category?: string;
  address?: string;
  alternatePhone?: string;
  website?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: UserProfile;
    token: string;
  };
  message: string;
}

export interface ProfileResponse {
  success: boolean;
  data: UserProfile;
  message: string;
}

// Authentication API service
class AuthApiService {
  // Register new user
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/mobile/auth/register', data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // User login
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/mobile/auth/login', data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Google OAuth login
  async googleLogin(data: GoogleAuthRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/mobile/auth/google', data);
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  // Get user profile
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await api.get('/api/mobile/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
    try {
      const response = await api.put('/api/mobile/auth/profile', data);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/api/mobile/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
}

export default new AuthApiService();
