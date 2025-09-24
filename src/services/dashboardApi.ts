import api from './api';

// Types for dashboard and analytics
export interface DashboardData {
  totalBanners: number;
  publishedBanners: number;
  draftBanners: number;
  archivedBanners: number;
  totalTemplatesUsed: number;
  recentActivity: Activity[];
  subscriptionStatus: {
    isActive: boolean;
    planName: string;
    expiresAt?: string;
  };
}

export interface BannerStats {
  totalCreated: number;
  totalPublished: number;
  totalDownloads: number;
  totalShares: number;
  monthlyStats: {
    month: string;
    created: number;
    published: number;
  }[];
  popularTemplates: {
    templateId: string;
    templateName: string;
    usageCount: number;
  }[];
}

export interface TemplateUsage {
  templateId: string;
  templateName: string;
  usageCount: number;
  lastUsed: string;
  category: string;
}

export interface Activity {
  id: string;
  type: 'banner_created' | 'banner_published' | 'banner_shared' | 'template_used' | 'subscription_renewed';
  description: string;
  timestamp: string;
  metadata?: {
    bannerId?: string;
    templateId?: string;
    bannerTitle?: string;
    templateName?: string;
  };
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  message: string;
}

export interface BannerStatsResponse {
  success: boolean;
  data: BannerStats;
  message: string;
}

export interface TemplateUsageResponse {
  success: boolean;
  data: TemplateUsage[];
  message: string;
}

export interface ActivityResponse {
  success: boolean;
  data: Activity[];
  message: string;
}

// Dashboard and Analytics API service
class DashboardApiService {
  // Get dashboard data
  async getDashboardData(): Promise<DashboardResponse> {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Get dashboard data error:', error);
      throw error;
    }
  }

  // Get banner statistics
  async getBannerStats(): Promise<BannerStatsResponse> {
    try {
      const response = await api.get('/dashboard/banners/stats');
      return response.data;
    } catch (error) {
      console.error('Get banner stats error:', error);
      throw error;
    }
  }

  // Get template usage statistics
  async getTemplateUsage(): Promise<TemplateUsageResponse> {
    try {
      const response = await api.get('/dashboard/templates/usage');
      return response.data;
    } catch (error) {
      console.error('Get template usage error:', error);
      throw error;
    }
  }

  // Get recent activity
  async getRecentActivity(limit?: number): Promise<ActivityResponse> {
    try {
      const params = new URLSearchParams();
      if (limit) {
        params.append('limit', limit.toString());
      }

      const response = await api.get(`/dashboard/activity?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Get recent activity error:', error);
      throw error;
    }
  }
}

export default new DashboardApiService();
