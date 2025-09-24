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
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
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
      const response = await api.get('/subscription/plans');
      return response.data;
    } catch (error) {
      console.error('Get plans error:', error);
      throw error;
    }
  }

  // Subscribe to plan
  async subscribe(data: SubscribeRequest): Promise<SubscriptionResponse> {
    try {
      const response = await api.post('/subscription/subscribe', data);
      return response.data;
    } catch (error) {
      console.error('Subscribe error:', error);
      throw error;
    }
  }

  // Get subscription status
  async getStatus(): Promise<SubscriptionResponse> {
    try {
      const response = await api.get('/subscription/status');
      return response.data;
    } catch (error) {
      console.error('Get subscription status error:', error);
      throw error;
    }
  }

  // Renew subscription
  async renew(): Promise<SubscriptionResponse> {
    try {
      const response = await api.post('/subscription/renew');
      return response.data;
    } catch (error) {
      console.error('Renew subscription error:', error);
      throw error;
    }
  }

  // Get subscription history
  async getHistory(): Promise<HistoryResponse> {
    try {
      const response = await api.get('/subscription/history');
      return response.data;
    } catch (error) {
      console.error('Get subscription history error:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancel(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/subscription/cancel');
      return response.data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }
}

export default new SubscriptionApiService();
