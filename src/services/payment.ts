

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number; // in days
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod?: string;
  amount: number;
  currency: string;
}

export interface PaymentHistory {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
  description: string;
}

class SubscriptionService {
  private cache: { [key: string]: { data: any; timestamp: number } } = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(key: string): boolean {
    const cached = this.cache[key];
    return cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION;
  }

  // Get available subscription plans (mock data only)
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.getMockSubscriptionPlans();
  }

  // Subscribe to a plan (mock implementation)
  async subscribeToPlan(planId: string, paymentMethod: string, autoRenew: boolean = true): Promise<Subscription> {
    // Mock subscription creation
    const mockSubscription: Subscription = {
      id: 'sub-' + Date.now(),
      userId: 'user-' + Date.now(),
      planId,
      plan: this.getMockSubscriptionPlans().find(p => p.id === planId) || this.getMockSubscriptionPlans()[0],
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      autoRenew,
      paymentMethod,
      amount: this.getMockSubscriptionPlans().find(p => p.id === planId)?.price || 9.99,
      currency: 'USD',
    };
    
    return mockSubscription;
  }

  // Get current subscription status (mock data)
  async getSubscriptionStatus(): Promise<Subscription | null> {
    // Return null for no subscription (most common case)
    return null;
  }

  // Renew subscription (mock implementation)
  async renewSubscription(): Promise<Subscription> {
    // Mock subscription renewal
    const mockSubscription: Subscription = {
      id: 'sub-' + Date.now(),
      userId: 'user-' + Date.now(),
      planId: 'pro',
      plan: this.getMockSubscriptionPlans().find(p => p.id === 'pro') || this.getMockSubscriptionPlans()[0],
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      paymentMethod: 'credit_card',
      amount: 19.99,
      currency: 'USD',
    };
    
    return mockSubscription;
  }

  // Get subscription history (mock data)
  async getSubscriptionHistory(): Promise<PaymentHistory[]> {
    return [];
  }

  // Cancel subscription (mock implementation)
  async cancelSubscription(): Promise<void> {
    // Mock subscription cancellation
    console.log('Mock subscription cancelled');
  }

  // Update subscription (mock implementation)
  async updateSubscription(updates: {
    planId?: string;
    paymentMethod?: string;
    autoRenew?: boolean;
  }): Promise<Subscription> {
    // Mock subscription update
    const mockSubscription: Subscription = {
      id: 'sub-' + Date.now(),
      userId: 'user-' + Date.now(),
      planId: updates.planId || 'pro',
      plan: this.getMockSubscriptionPlans().find(p => p.id === (updates.planId || 'pro')) || this.getMockSubscriptionPlans()[0],
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: updates.autoRenew ?? true,
      paymentMethod: updates.paymentMethod || 'credit_card',
      amount: this.getMockSubscriptionPlans().find(p => p.id === (updates.planId || 'pro'))?.price || 19.99,
      currency: 'USD',
    };
    
    return mockSubscription;
  }

  // Check if user has active subscription
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionStatus();
      return subscription?.status === 'active';
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // Get subscription expiry date
  async getSubscriptionExpiryDate(): Promise<string | null> {
    try {
      const subscription = await this.getSubscriptionStatus();
      return subscription?.endDate || null;
    } catch (error) {
      console.error('Error getting subscription expiry date:', error);
      return null;
    }
  }

  // Mock data for development
  private getMockSubscriptionPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'basic',
        name: 'Basic Plan',
        description: 'Perfect for small businesses and startups',
        price: 9.99,
        currency: 'USD',
        duration: 30,
        features: [
          'Up to 50 banner templates',
          'Basic customization options',
          'Email support',
          'Standard resolution exports'
        ],
        isActive: true,
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        description: 'Ideal for growing businesses and marketing teams',
        price: 19.99,
        currency: 'USD',
        duration: 30,
        features: [
          'Unlimited banner templates',
          'Advanced customization options',
          'Priority support',
          'High resolution exports',
          'Custom branding',
          'Analytics dashboard'
        ],
        isPopular: true,
        isActive: true,
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        description: 'For large organizations with advanced needs',
        price: 49.99,
        currency: 'USD',
        duration: 30,
        features: [
          'Everything in Pro',
          'White-label solutions',
          'API access',
          'Dedicated account manager',
          'Custom integrations',
          'Team collaboration tools',
          'Advanced analytics'
        ],
        isActive: true,
      },
    ];
  }

  // Clear cache method
  clearCache(): void {
    this.cache = {};
  }
}

export default new SubscriptionService(); 