import api from './api';
import authService from './auth';
import cacheService from './cacheService';

// Types for subscription
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string; // quarterly, yearly
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
  razorpaySubscriptionId?: string;
  paymentId?: string;
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

export interface CreatePaymentOrderParams {
  planId: string;
  currency?: string;
}

export interface PaymentOrderDetails {
  orderId: string;
  amount: number;
  amountInPaise?: number;
  currency: string;
  receipt?: string;
  key?: string;
  razorpayKey?: string;
  raw?: any;
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
      
      // Check if response has the expected structure
      const plans = response.data?.data?.plans || response.data?.plans || [];
      
      if (!Array.isArray(plans)) {
        console.warn('Plans data is not an array, returning empty array');
        return {
          success: true,
          data: [],
          message: 'No plans available'
        };
      }
      
      console.log("Subscription plans API response:", response.data);
      
      // Transform the response to match expected format
      const transformedData = plans.map((plan: any) => {
        // Safe parsing of features to handle array, string, or null/undefined
        const parsedFeatures = Array.isArray(plan.features)
          ? plan.features
          : typeof plan.features === "string"
            ? plan.features.split(',').map((f: string) => f.trim()).filter((f: string) => f)
            : [];
        
        return {
          id: plan.id || '',
          name: plan.name || '',
          description: plan.description || parsedFeatures.join(', ') || '',
          price: typeof plan.price === 'number' ? plan.price : 0,
          currency: plan.currency || 'INR',
          duration: plan.period || plan.duration || 'monthly',
          features: parsedFeatures,
          isPopular: plan.originalPrice && plan.originalPrice > plan.price // Popular if has discount
        };
      });
      
      console.log("Parsed subscription plans:", transformedData);

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

  // Create Razorpay order before initiating payment
  async createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderDetails> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const payload: Record<string, any> = {
        planId: params.planId,
        userId,
      };

      if (params.currency) {
        payload.currency = params.currency;
      }

      console.log('🧾 Creating Razorpay order with payload:', payload);

      const response = await api.post('/api/mobile/subscription/create-order', payload);
      const responseData = response.data?.data ?? response.data;
      const data =
        responseData?.order ??
        responseData?.orderDetails ??
        responseData?.razorpayOrder ??
        responseData;
      console.log('✅ Create payment order response:', data);

      const orderId = data?.orderId || data?.order_id || data?.id;
      if (!orderId) {
        throw new Error('Order ID missing from create-order response');
      }

      const amount =
        typeof data?.amount === 'number'
          ? data.amount
          : typeof data?.amount === 'string'
            ? Number(data.amount)
            : 0; // Backend will always provide amount

      const rawAmountInPaise =
        typeof data?.amountInPaise === 'number'
          ? data.amountInPaise
          : typeof data?.amountInPaise === 'string'
            ? Number(data.amountInPaise)
            : typeof data?.amount_paise === 'number'
              ? data.amount_paise
              : typeof data?.amount_paise === 'string'
                ? Number(data.amount_paise)
                : undefined;

      const amountInPaise =
        typeof rawAmountInPaise === 'number' && !Number.isNaN(rawAmountInPaise)
          ? rawAmountInPaise
          : typeof amount === 'number' && amount > 0
            ? Math.round(amount * 100)
            : undefined;

      const currency = data?.currency || params.currency || 'INR';

      const razorpayKey =
        data?.key ||
        data?.key_id ||
        data?.razorpayKey ||
        data?.razorpayKeyId ||
        response.data?.key ||
        response.data?.key_id;

      return {
        orderId,
        amount,
        amountInPaise,
        currency,
        receipt: data?.receipt,
        razorpayKey,
        raw: data,
      };
    } catch (error: any) {
      console.error('❌ Create payment order error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to create payment order';
      throw new Error(message);
    }
  }

  // Clear subscription status cache (call after subscribe/cancel/renew)
  clearStatusCache(userId?: string): void {
    if (userId) {
      cacheService.clear(`subscription_status_${userId}`);
    } else {
      const currentUser = authService.getCurrentUser();
      const currentUserId = currentUser?.id;
      if (currentUserId) {
        cacheService.clear(`subscription_status_${currentUserId}`);
      }
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
      
      // Try to call the backend API first
      try {
        const response = await api.post('/api/mobile/subscription/subscribe', {
          planId: data.planId,
          paymentMethod: data.paymentMethod,
          autoRenew: data.autoRenew,
        });
        
        if (response.data.success) {
          console.log('✅ Subscription created via backend API:', response.data);
          // Clear cache after subscription
          this.clearStatusCache(userId);
          return response.data;
        }
      } catch (backendError: any) {
        console.log('⚠️ Backend subscription API not available, using local activation');
        
        // If backend is not available, we'll still activate the subscription locally
        // This ensures the user gets immediate access to pro features
        if (backendError.response?.status !== 404) {
          console.error('Backend subscription error:', backendError);
        }
      }
      
      // Backend is not available - throw error instead of storing locally
      console.error('❌ Backend subscription API is required but not available');
      throw new Error('Subscription service is unavailable. Please ensure the backend is running.');
    } catch (error) {
      console.error('Subscribe error:', error);
      throw error;
    }
  }

  // Get subscription status (with caching - 3 min TTL)
  async getStatus(): Promise<SubscriptionResponse> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        console.log('⚠️ No user ID available, cannot check subscription status');
        return {
          success: true,
          data: {
            isActive: false,
            plan: null,
            expiryDate: null,
            autoRenew: false,
            status: 'inactive'
          },
          message: 'User not authenticated'
        };
      }

      // Use cache service with user-specific key
      const cacheKey = `subscription_status_${userId}`;
      const CACHE_TTL = 10 * 1000; // 10 seconds

      return await cacheService.getOrFetch(
        cacheKey,
        async () => {
          console.log('🔍 Fetching subscription status for user:', userId);
          
          // Try to get status from backend first
          try {
            const response = await api.get('/api/mobile/subscription/status');
            
            console.log('📊 Subscription API response:', response.data);
            console.log('SUBSCRIPTION_RAW_API_RESPONSE', response.data);
            console.log('🔍 Raw subscription data:', JSON.stringify(response.data, null, 2));
            
            // Check if response has the expected structure
            if (response.data.success) {
              // ISSUE: Backend returns response.data.subscription, not response.data.data
              const subscriptionData = response.data?.subscription ?? response.data?.data ?? null;
              console.log("SUBSCRIPTION_API_PARSING - Checking response structure:", {
                'response.data.subscription': response.data?.subscription,
                'response.data.data': response.data?.data,
                'final_subscriptionData': subscriptionData
              });
              console.log("SUBSCRIPTION_PARSED_DATA", subscriptionData);
              
              if (!subscriptionData) {
                console.warn("SUBSCRIPTION_STATUS_EMPTY_RESPONSE");
              }
              
              console.log("SUBSCRIPTION_FIELDS", {
                planId: subscriptionData?.planId,
                planName: subscriptionData?.planName,
                expiryDate: subscriptionData?.expiryDate,
                isActive: subscriptionData?.isActive
              });
              
              console.log("Parsed subscription:", subscriptionData);
              console.log("Subscription fields check:", {
                hasIsActive: !!subscriptionData?.isActive,
                isActive: subscriptionData?.isActive,
                hasStatus: !!subscriptionData?.status,
                status: subscriptionData?.status,
                hasDaysRemaining: !!subscriptionData?.daysRemaining,
                daysRemaining: subscriptionData?.daysRemaining,
                hasExpiryDate: !!subscriptionData?.expiryDate,
                expiryDate: subscriptionData?.expiryDate,
                hasEndDate: !!subscriptionData?.endDate,
                endDate: subscriptionData?.endDate,
                hasPlan: !!subscriptionData?.plan,
                plan: subscriptionData?.plan,
                hasPlanId: !!subscriptionData?.planId,
                planId: subscriptionData?.planId
              });
              
              // Return default if subscription data is null/undefined
              if (!subscriptionData) {
                return {
                  success: true,
                  data: {
                    isActive: false,
                    plan: null,
                    expiryDate: null,
                    autoRenew: false,
                    status: "inactive"
                  },
                  message: 'No subscription data found'
                };
              }
              
              return {
                success: true,
                data: {
                  isActive: Boolean(subscriptionData?.isActive),
                  planId: subscriptionData?.planId ?? null,
                  planName: subscriptionData?.planName ?? null,
                  expiryDate: subscriptionData?.expiryDate ?? null,
                  autoRenew: Boolean(subscriptionData?.autoRenew),
                  status: subscriptionData?.isActive ? "active" : "inactive"
                },
                message: 'Status fetched successfully'
              };
            }
          } catch (backendError: any) {
            console.log('⚠️ Backend subscription status API error:', backendError.message);
            
            if (backendError.response?.status !== 404) {
              console.error('Backend subscription status error:', backendError);
            }
          }
          
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
        },
        CACHE_TTL,
        true // Allow stale data
      );
    } catch (error: any) {
      console.error('Get subscription status error:', error);
      
      // Return default status instead of throwing
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
  }

  // Get subscription status for a specific business profile
  async getBusinessProfileSubscriptionStatus(businessProfileId: string): Promise<SubscriptionResponse> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const cacheKey = `subscription_status_profile_${businessProfileId}`;
      const CACHE_TTL = 10 * 1000; // 10 seconds

      return await cacheService.getOrFetch(
        cacheKey,
        async () => {
          console.log('🔍 Fetching subscription status for business profile:', businessProfileId);
          
          try {
            const response = await api.get(`/api/mobile/subscription/status`, {
              params: { businessProfileId }
            });
            
            if (response.data.success) {
              const subscriptionData = response.data?.subscription ?? response.data?.data ?? null;
              
              if (!subscriptionData) {
                return {
                  success: true,
                  data: {
                    isActive: false,
                    plan: null,
                    expiryDate: null,
                    autoRenew: false,
                    status: "inactive"
                  },
                  message: 'No subscription data found'
                };
              }
              
              return {
                success: true,
                data: {
                  isActive: Boolean(subscriptionData?.isActive),
                  planId: subscriptionData?.planId ?? null,
                  planName: subscriptionData?.planName ?? null,
                  expiryDate: subscriptionData?.expiryDate ?? null,
                  autoRenew: Boolean(subscriptionData?.autoRenew),
                  status: subscriptionData?.status?.toLowerCase() || (subscriptionData?.isActive ? "active" : "inactive")
                },
                message: 'Status fetched successfully'
              };
            }
          } catch (backendError: any) {
            console.log('⚠️ Backend profile subscription status API error:', backendError.message);
          }
          
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
        },
        CACHE_TTL,
        true // Allow stale data
      );
    } catch (error: any) {
      console.error('Get profile subscription status error:', error);
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
      
      const result: SubscriptionResponse = {
        success: true,
        data: {
          isActive: true,
          planId: undefined, // Will be determined by backend
          planName: undefined, // Will be determined by backend
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          autoRenew: true,
          status: 'active'
        },
        message: 'Subscription renewed successfully'
      };
      
      // Clear cache after renewal
      this.clearStatusCache(userId);
      
      return result;
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
      
      console.log('📡 Subscription history API response:', JSON.stringify(response.data, null, 2));
      
      // Handle different response structures
      let paymentsArray = [];
      if (response.data.data && Array.isArray(response.data.data)) {
        // Direct array in data
        paymentsArray = response.data.data;
        console.log('✅ Using response.data.data as payments array');
      } else if (response.data.data && response.data.data.payments && Array.isArray(response.data.data.payments)) {
        // Nested payments array
        paymentsArray = response.data.data.payments;
        console.log('✅ Using response.data.data.payments as payments array');
      } else {
        console.warn('⚠️ Unexpected response structure for subscription history');
        paymentsArray = [];
      }
      
      // Transform the response to match expected format
      const transformedData = paymentsArray.map((payment: any) => ({
        id: payment.id,
        planId: payment.plan || 'unknown',
        planName: payment.planName || payment.plan || 'Unknown Plan',
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status.toLowerCase(),
        createdAt: payment.paidAt || payment.createdAt,
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
      
      // Clear cache after cancellation
      this.clearStatusCache(userId);
      
      return response.data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  // Verify payment with backend
  async verifyPayment(paymentData: {
    orderId: string;
    paymentId: string;
    signature: string;
    amount?: number;
    amountPaise?: number;
    currency?: string;
    planId?: string;
    email?: string;
    contact?: string;
    subscriptionId?: string;
    isAutopay?: boolean;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Verifying payment with backend:', {
        orderId: paymentData.orderId,
        paymentId: paymentData.paymentId,
      });
      
      const payload: Record<string, any> = {
        orderId: paymentData.orderId,
        paymentId: paymentData.paymentId,
        signature: paymentData.signature,
      };

      if (paymentData.subscriptionId) {
        payload.subscriptionId = paymentData.subscriptionId;
      }

      if (paymentData.isAutopay !== undefined) {
        payload.isAutopay = paymentData.isAutopay;
      }

      if (typeof paymentData.amount === 'number') {
        payload.amount = paymentData.amount;
      }

      if (typeof paymentData.amountPaise === 'number') {
        payload.amountPaise = paymentData.amountPaise;
      }

      if (paymentData.currency) {
        payload.currency = paymentData.currency;
      }

      if (paymentData.planId) {
        payload.planId = paymentData.planId;
      }

      if (paymentData.email) {
        payload.email = paymentData.email;
      }

      if (paymentData.contact) {
        payload.contact = paymentData.contact;
      }

      console.log('📨 Sending verify-payment payload:', payload);

      const response = await api.post('/api/mobile/subscription/verify-payment', payload);
      
      console.log('✅ Payment verified successfully:', response.data);
      
      // Clear subscription status cache after payment verification
      this.clearStatusCache(userId);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Payment verification error:', error);
      
      // Provide more detailed error message
      const errorMessage = error.response?.data?.message || error.message || 'Payment verification failed';
      throw new Error(errorMessage);
    }
  }

  // Create autopay subscription for business profile
  async createBusinessProfileAutopay(params: {
    planId: string;
    businessProfileId: string;
    subscriptionCategory: 'BUSINESS_PROFILE';
    customerEmail?: string;
    customerPhone?: string;
  }) {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('🔄 Creating Business Profile Autopay subscription:', params);

      const payload = {
        ...params,
        userId
      };

      const response = await api.post(
        '/api/mobile/subscription/create-autopay',
        payload
      );

      console.log('📡 Autopay API response:', response.data);
      
      // Prioritize root-level fields from backend response
      const root = response.data || {};
      const nested = root.data || {};

      console.log("🔍 Response structure:", {
        'root.subscriptionId': root.subscriptionId,
        'root.razorpaySubscriptionId': root.razorpaySubscriptionId,
        'nested.razorpaySubscription.subscriptionId': nested?.razorpaySubscription?.subscriptionId,
        'nested.subscription.razorpaySubscriptionId': nested?.subscription?.razorpaySubscriptionId,
        'nested.subscription.subscriptionId': nested?.subscription?.subscriptionId
      });

      // Always prioritize flat fields from backend
      const subscriptionId =
        root.subscriptionId ||
        root.razorpaySubscriptionId ||
        nested?.razorpaySubscription?.subscriptionId ||
        nested?.subscription?.razorpaySubscriptionId ||
        nested?.subscription?.subscriptionId;

      console.log("🎯 Final Razorpay Subscription ID:", subscriptionId);

      if (!subscriptionId || !subscriptionId.startsWith("sub_")) {
        console.error("❌ Invalid subscription ID:", subscriptionId);
        throw new Error("Invalid Razorpay subscription ID received from backend.");
      }

      return {
        ...root,
        subscriptionId
      };

    } catch (error: any) {
      console.error('❌ createBusinessProfileAutopay error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to create subscription mandate'
      );
    }
  }

  // Create Autopay subscription
  async createAutopay(planId: string) {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('🔄 Creating Autopay subscription for user:', userId, 'Plan:', planId);

      const response = await api.post('/api/mobile/subscription/create-autopay', {
        planId,
        userId,
      });

      console.log('✅ Autopay subscription created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Create Autopay error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create Autopay subscription';
      throw new Error(errorMessage);
    }
  }

  // Cancel Autopay subscription
  async cancelAutopay() {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('🔄 Cancelling Autopay subscription for user:', userId);

      const response = await api.post('/api/mobile/subscription/cancel-autopay');

      // Clear subscription status cache after cancellation
      this.clearStatusCache(userId);

      console.log('✅ Autopay subscription cancelled:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Cancel Autopay error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel Autopay subscription';
      throw new Error(errorMessage);
    }
  }

  // Get Autopay status
  async getAutopayStatus() {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Fetching Autopay status for user:', userId);

      const response = await api.get('/api/mobile/subscription/autopay-status');

      console.log('✅ Autopay status fetched:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get Autopay status error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch Autopay status';
      throw new Error(errorMessage);
    }
  }
}

export default new SubscriptionApiService();
