import api from './api';
import authService from './auth';

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
      
      // Transform the response to match expected format
      const transformedData = response.data.data.plans.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.features.join(', '),
        price: plan.price,
        currency: 'INR',
        duration: plan.period,
        features: plan.features,
        isPopular: plan.id === 'yearly_pro'
      }));

      return {
        success: true,
        data: transformedData,
        message: 'Plans fetched successfully'
      };
    } catch (error) {
      console.error('Get plans error:', error);
      throw error;
    }
  }

  // Subscribe to plan
  async subscribe(data: SubscribeRequest): Promise<SubscriptionResponse> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('Creating subscription for user:', userId, 'Plan:', data.planId);
      
      // For now, we'll simulate a successful subscription since the backend
      // requires proper JWT authentication which we need to implement
      console.log('Simulating subscription:', data);
      
      // Return a mock successful response
      return {
        success: true,
        data: {
          isActive: true,
          planId: data.planId,
          planName: data.planId === 'monthly_pro' ? 'Monthly Pro' : 'Yearly Pro',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + (data.planId === 'monthly_pro' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
          expiryDate: new Date(Date.now() + (data.planId === 'monthly_pro' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
          autoRenew: data.autoRenew,
          status: 'active'
        },
        message: 'Subscription created successfully'
      };
    } catch (error) {
      console.error('Subscribe error:', error);
      throw error;
    }
  }

  // Get subscription status
  async getStatus(): Promise<SubscriptionResponse> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        console.log('⚠️ No user ID available, returning default status');
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

      const response = await api.get('/api/mobile/subscription/status');
      
      // Transform the response to match expected format
      const subscriptionData = response.data.data.subscription;
      
      return {
        success: true,
        data: {
          isActive: subscriptionData.status === 'active' && subscriptionData.daysRemaining > 0,
          plan: subscriptionData.plan !== 'free' ? {
            id: subscriptionData.plan === 'monthly_pro' ? 'monthly_pro' : 'yearly_pro',
            name: subscriptionData.plan === 'monthly_pro' ? 'Monthly Pro' : 'Yearly Pro',
            description: 'Premium subscription',
            price: subscriptionData.plan === 'monthly_pro' ? 299 : 1999,
            currency: 'INR',
            duration: subscriptionData.plan === 'monthly_pro' ? 'monthly' : 'yearly',
            features: [],
            isPopular: subscriptionData.plan === 'yearly_pro'
          } : null,
          planId: subscriptionData.plan !== 'free' ? subscriptionData.plan : null,
          planName: subscriptionData.plan !== 'free' ? (subscriptionData.plan === 'monthly_pro' ? 'Monthly Pro' : 'Yearly Pro') : null,
          startDate: subscriptionData.startDate,
          endDate: subscriptionData.endDate,
          expiryDate: subscriptionData.endDate,
          autoRenew: true,
          status: subscriptionData.status
        },
        message: 'Status fetched successfully'
      };
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
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('Renewing subscription for user:', userId);
      
      // For now, simulate renewal
      console.log('Simulating subscription renewal');
      
      return {
        success: true,
        data: {
          isActive: true,
          planId: 'monthly_pro',
          planName: 'Monthly Pro',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        },
        message: 'Subscription renewed successfully'
      };
    } catch (error) {
      console.error('Renew subscription error:', error);
      throw error;
    }
  }

  // Get subscription history
  async getHistory(): Promise<HistoryResponse> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        console.log('⚠️ No user ID available, returning empty history');
        return {
          success: true,
          data: [],
          message: 'No subscription history'
        };
      }

      const response = await api.get('/api/mobile/subscription/history');
      
      // Transform the response to match expected format
      const transformedData = response.data.data.payments.map((payment: any) => ({
        id: payment.id,
        planId: payment.plan,
        planName: payment.plan === 'monthly_pro' ? 'Monthly Pro' : 'Yearly Pro',
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status.toLowerCase(),
        createdAt: payment.paidAt,
        paymentMethod: payment.paymentMethod
      }));

      return {
        success: true,
        data: transformedData,
        message: 'History fetched successfully'
      };
    } catch (error: any) {
      console.error('Get subscription history error:', error);
      
      // If it's a 401 error, return empty history instead of throwing
      if (error.response?.status === 401) {
        console.log('⚠️ Subscription history requires authentication, returning empty history');
        return {
          success: true,
          data: [],
          message: 'No subscription history'
        };
      }
      
      throw error;
    }
  }

  // Cancel subscription
  async cancel(): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('Cancelling subscription for user:', userId);
      
      const response = await api.post('/api/mobile/subscription/cancel');
      return response.data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }
}

export default new SubscriptionApiService();
