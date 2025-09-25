import api from './api';

// Types for subscription
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string; // monthly, yearly
  features: string[];
  isPopular?: boolean;
}

export interface SubscribeRequest {
  planId: string;
  paymentMethod: string;
  autoRenew: boolean;
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan?: SubscriptionPlan | null;
  planId?: string;
  planName?: string;
  startDate?: string;
  endDate?: string;
  expiryDate?: string | null;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'inactive';
}

export interface SubscriptionHistory {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paymentMethod: string;
}

export interface PlansResponse {
  success: boolean;
  data: SubscriptionPlan[];
  message: string;
}

export interface SubscriptionResponse {
  success: boolean;
  data: SubscriptionStatus;
  message: string;
}

export interface HistoryResponse {
  success: boolean;
  data: SubscriptionHistory[];
  message: string;
}

// Subscription API service
class SubscriptionApiService {
  // Get subscription plans
  async getPlans(): Promise<PlansResponse> {
    try {
      const response = await api.get('/api/mobile/subscription/plans');
      return response.data;
    } catch (error) {
      console.error('Get plans error:', error);
      throw error;
    }
  }

  // Subscribe to plan
  async subscribe(data: SubscribeRequest): Promise<SubscriptionResponse> {
    try {
      const response = await api.post('/api/mobile/subscription/subscribe', data);
      return response.data;
    } catch (error) {
      console.error('Subscribe error:', error);
      throw error;
    }
  }

  // Get subscription status
  async getStatus(): Promise<SubscriptionResponse> {
    try {
      const response = await api.get('/api/mobile/subscription/status');
      return response.data;
    } catch (error: any) {
      console.error('Get subscription status error:', error);
      
      // If it's a 401 error, return a default status instead of throwing
      if (error.response?.status === 401) {
        console.log('⚠️ Subscription status requires authentication, returning default status');
        return {
          success: true,
          data: {
            isActive: false,
            plan: null,
            expiryDate: null,
            autoRenew: false,
            status: 'inactive'
          },
          message: 'No active subscription'
        };
      }
      
      throw error;
    }
  }

  // Renew subscription
  async renew(): Promise<SubscriptionResponse> {
    try {
      const response = await api.post('/api/mobile/subscription/renew');
      return response.data;
    } catch (error) {
      console.error('Renew subscription error:', error);
      throw error;
    }
  }

  // Get subscription history
  async getHistory(): Promise<HistoryResponse> {
    try {
      const response = await api.get('/api/mobile/subscription/history');
      return response.data;
    } catch (error) {
      console.error('Get subscription history error:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancel(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/api/mobile/subscription/cancel');
      return response.data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }
}

export default new SubscriptionApiService();
