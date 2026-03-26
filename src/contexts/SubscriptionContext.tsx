import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import transactionHistoryService, { Transaction } from '../services/transactionHistory';
import subscriptionApi, { SubscriptionStatus } from '../services/subscriptionApi';
import authService from '../services/auth';

interface AutopayState {
  isAutopayActive: boolean;
  nextBillingDate: string | null;
  autopayLoading: boolean;
}

interface SubscriptionContextType {
  isSubscribed: boolean;
  setIsSubscribed: (value: boolean) => void;
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  plans: any[]; // Add plans state
  transactions: Transaction[];
  transactionStats: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    totalAmount: number;
    quarterlySubscriptions: number;
    yearlySubscriptions: number;
  };
  refreshSubscription: (force?: boolean) => Promise<void>;
  refreshPlans: () => Promise<void>; // Add refresh plans method
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<Transaction>;
  clearTransactions: () => Promise<void>;
  clearSubscriptionData: () => void;
  checkPremiumAccess: (feature: string) => boolean;
  // Autopay specific methods
  autopayState: AutopayState;
  enableAutopay: (planId: string) => Promise<void>;
  disableAutopay: () => Promise<void>;
  refreshAutopayStatus: () => Promise<void>;
  // Business Profile Subscriptions
  businessProfileSubscriptions: Record<string, SubscriptionStatus>;
  getBusinessProfileSubscription: (profileId: string) => SubscriptionStatus | undefined;
  refreshBusinessProfileSubscription: (profileId: string) => Promise<void>;
  // CRITICAL: Payment lock to prevent subscription updates during payment
  setPaymentInProgress: (inProgress: boolean) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  console.log('🏗️ [SubscriptionProvider] Rendering...');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]); // Add plans state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    totalAmount: 0,
    quarterlySubscriptions: 0,
    yearlySubscriptions: 0,
  });
  
  // CRITICAL: Payment lock to prevent subscription updates during payment
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  
  // Autopay state
  const [autopayState, setAutopayState] = useState<AutopayState>({
    isAutopayActive: false,
    nextBillingDate: null,
    autopayLoading: false,
  });

  // Monitor user changes and reset subscription state when user changes
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    const newUserId = currentUser?.id || null;
    
    console.log('👤 SubscriptionContext - User check:', {
      previousUserId: currentUserId,
      newUserId: newUserId,
      userChanged: currentUserId !== newUserId
    });
    
    // If user changed (login, logout, or switch user), reset all state
    if (currentUserId !== newUserId) {
      console.log('🔄 User changed, resetting subscription state...');
      
      // Clear all subscription state
      setIsSubscribed(false);
      setSubscriptionStatus(null);
      setPlans([]); // Clear plans
      setTransactions([]);
      setTransactionStats({
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        totalAmount: 0,
        quarterlySubscriptions: 0,
        yearlySubscriptions: 0,
      });
      
      // Clear Autopay state
      setAutopayState({
        isAutopayActive: false,
        nextBillingDate: null,
        autopayLoading: false,
      });

      // Clear Business Profile Subscriptions
      setBusinessProfileSubscriptions({});
      
      // Update current user ID
      setCurrentUserId(newUserId);
      
      // If there's a new user, fetch their subscription data
      if (newUserId) {
        console.log('✅ New user detected, fetching subscription data for:', newUserId);
        refreshSubscription();
        refreshPlans(); // Fetch plans
        refreshTransactions();
        refreshAutopayStatus(); // Fetch Autopay status
      } else {
        console.log('⚠️ User logged out, subscription state cleared');
      }
    }
  }, [currentUserId]);

  // Initial load on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setCurrentUserId(currentUser?.id || null);
    
    if (currentUser?.id) {
      refreshSubscription();
      refreshPlans(); // Fetch plans
      refreshTransactions();
      refreshAutopayStatus(); // Fetch Autopay status
    }
  }, []);

  // Listen for auth state changes (login, logout, user switch)
  useEffect(() => {
    const handleAuthStateChange = (user: any) => {
      const newUserId = user?.id || null;
      console.log('🔔 Auth state changed, new user ID:', newUserId);
      
      // Trigger user change detection
      setCurrentUserId(newUserId);
    };
    
    // Subscribe to auth state changes
    authService.onAuthStateChanged(handleAuthStateChange);
    
    // Cleanup subscription on unmount
    return () => {
      // authService doesn't have an unsubscribe method, but that's okay
      console.log('🧹 SubscriptionContext unmounting');
    };
  }, []);

  // Refresh subscription status from backend
  const refreshSubscription = useCallback(async (force = false) => {
    try {
      // CRITICAL: Do not refresh subscription if payment is in progress
      if (paymentInProgress) {
        console.log('🚫 PAYMENT LOCK: Subscription refresh blocked - payment in progress');
        return;
      }
      
      // Prevent duplicate API calls - use cached data if refreshed within last 5 seconds
      const now = Date.now();
      const cacheValidityMs = 5000; // 5 seconds
      
      if (isRefreshingRef.current) {
        console.log('⏭️ Subscription refresh already in progress, skipping...');
        return;
      }
      
      if (!force && now - lastRefreshTimeRef.current < cacheValidityMs) {
        console.log('📦 Using cached subscription data (refreshed', Math.round((now - lastRefreshTimeRef.current) / 1000), 'seconds ago)');
        return;
      }
      
      isRefreshingRef.current = true;
      setIsLoading(true);
      console.log('🔄 SUBSCRIPTION_STATUS_FETCH - Refreshing subscription status...');
      
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      console.log('🔍 Current user for subscription check:', userId);
      
      if (!userId) {
        console.log('⚠️ No user ID available, clearing subscription state');
        setIsSubscribed(false);
        setSubscriptionStatus(null);
        setPlans([]); // Clear plans
        setTransactions([]);
        setTransactionStats({
          total: 0,
          successful: 0,
          failed: 0,
          pending: 0,
          totalAmount: 0,
          quarterlySubscriptions: 0,
          yearlySubscriptions: 0,
        });
        lastRefreshTimeRef.current = now;
        return;
      }

      const response = await subscriptionApi.getStatus();
      
      if (response.success) {
        const status = response.data ?? response;
        console.log("SUBSCRIPTION_CONTEXT_INPUT", status);
        console.log('✅ Subscription status fetched:', JSON.stringify(status, null, 2));
        
        console.log("SUBSCRIPTION_CONTEXT_STATUS", status);
        console.log("SUBSCRIPTION_CONTEXT_FIELDS", {
          isActive: status?.isActive,
          planId: status?.planId,
          planName: status?.planName,
          expiryDate: status?.expiryDate
        });
        
        // Check if subscription is active and not expired
        // Make status check case-insensitive
        const normalizedStatus = status.status?.toLowerCase();
        const isNotExpired = status.expiryDate ? new Date(status.expiryDate) > new Date() : 
                            status.endDate ? new Date(status.endDate) > new Date() : true;
        
        console.log('SUBSCRIPTION_CONTEXT_PARSING:', {
          'status.isActive': status.isActive,
          'status.status': status.status,
          'normalizedStatus': normalizedStatus,
          'status.expiryDate': status.expiryDate,
          'status.endDate': status.endDate,
          'isNotExpired': isNotExpired,
          'status.planId': status.planId,
          'status.planName': status.planName,
          'status.razorpaySubscriptionId': status?.razorpaySubscriptionId,
          'status.paymentId': status?.paymentId
        });
        
        // Evaluate access based on backend isActive flag or explicit active status.
        // For Autopay and webhooks, paymentId may not always be populated side-by-side with isActive.
        const accessGranted = status?.isActive === true || normalizedStatus === 'active';
        
        console.log('🔍 CRITICAL ACCESS CHECK - Payment Verified:', {
          'status.status': status?.status,
          'razorpaySubscriptionId': status?.razorpaySubscriptionId,
          'paymentId': status?.paymentId,
          'accessGranted': accessGranted,
          'REASON': accessGranted ? 'PAYMENT VERIFIED' : 'PAYMENT NOT VERIFIED'
        });
        
        setIsSubscribed(Boolean(accessGranted));
        setSubscriptionStatus(status);
        lastRefreshTimeRef.current = now;
        
        console.log('✅ SUBSCRIPTION_UPDATED - Subscription status updated:', {
          isActive: Boolean(accessGranted),
          normalizedStatus,
          isNotExpired,
          planId: status.planId,
          planName: status.planName,
          expiryDate: status.expiryDate,
          endDate: status.endDate
        });
        
        console.log('🔐 Subscription access:', accessGranted ? 'GRANTED ✅' : 'DENIED ❌');
        console.log('🔍 Status details:', {
          isActive: status.isActive,
          normalizedStatus,
          isNotExpired,
          planId: status.planId,
          planName: status.planName,
          expiryDate: status.expiryDate,
          endDate: status.endDate
        });
      } else {
        console.log('⚠️ Failed to fetch subscription status, defaulting to not subscribed');
        setIsSubscribed(false);
        setSubscriptionStatus(null);
      }
    } catch (error: any) {
      // Silently handle 404 errors for unimplemented subscription endpoints
      if (error?.response?.status === 404) {
        console.log('ℹ️ Subscription endpoint not implemented yet, defaulting to free tier');
      } else {
        console.error('❌ Error refreshing subscription status:', error);
      }
      setIsSubscribed(false);
      setSubscriptionStatus(null);
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
      lastRefreshTimeRef.current = Date.now();
    }
  }, [paymentInProgress]);

  // Polling mechanism for pending subscriptions
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    // Check if the current subscription status is literally 'pending'
    const isPending = subscriptionStatus?.status?.toLowerCase() === 'pending';
    
    if (isPending && currentUserId && !paymentInProgress) {
      console.log('⏳ Subscription is PENDING. Starting active polling every 5 seconds...');
      intervalId = setInterval(() => {
        console.log('🔄 Checking if PENDING subscription has been activated...');
        refreshSubscription(true); // Force bypass cache
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('⏹️ Stopped subscription polling loop.');
      }
    };
  }, [subscriptionStatus?.status, currentUserId, paymentInProgress, refreshSubscription]);

  // Refresh plans from backend
  const refreshPlans = useCallback(async () => {
    try {
      console.log('🔄 Refreshing subscription plans...');
      const response = await subscriptionApi.getPlans();
      
      if (response.success) {
        setPlans(response.data || []);
        console.log('✅ Plans refreshed successfully:', response.data?.length || 0, 'plans');
      } else {
        console.log('⚠️ Failed to fetch plans, using empty array');
        setPlans([]);
      }
    } catch (error) {
      console.error('❌ Error refreshing plans:', error);
      setPlans([]);
    }
  }, []);

  // Refresh transactions and stats
  const refreshTransactions = useCallback(async () => {
    try {
      console.log('');
      console.log('🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦');
      console.log('🔄 SubscriptionContext - STARTING TRANSACTION REFRESH');
      console.log('🔄 About to call API endpoints...');
      console.log('🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦');
      console.log('');
      
      const [transactionsData, statsData] = await Promise.all([
        transactionHistoryService.getTransactions(),
        transactionHistoryService.getTransactionStats(),
      ]);
      
      console.log('');
      console.log('🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦');
      console.log('📊 SubscriptionContext - API CALLS COMPLETED');
      console.log('📊 SubscriptionContext - Transactions fetched:', transactionsData.length);
      console.log('📊 SubscriptionContext - Transactions data:', JSON.stringify(transactionsData, null, 2));
      console.log('📊 SubscriptionContext - Stats fetched:', statsData);
      console.log('🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦');
      console.log('');
      
      setTransactions(transactionsData);
      setTransactionStats(statsData);
      
      console.log('✅ SubscriptionContext - State updated with transactions');
    } catch (error) {
      console.error('❌ SubscriptionContext - Error refreshing transactions:', error);
    }
  }, []);

  // Track previous status to detect transitions from PENDING to ACTIVE
  const previousStatusRef = useRef<string | null>(null);

  // Effect to watch for transitions from pending to active to automatically refresh transactions
  useEffect(() => {
    const currentNormalizedStatus = subscriptionStatus?.status?.toLowerCase() || null;
    const previousStatus = previousStatusRef.current;
    
    if (previousStatus === 'pending' && currentNormalizedStatus === 'active') {
      console.log('🔄 Subscription transitioned from PENDING to ACTIVE. Automatically refreshing transactions...');
      refreshTransactions();
    }
    
    // Update the ref for next render
    previousStatusRef.current = currentNormalizedStatus;
  }, [subscriptionStatus?.status, refreshTransactions]);

  // Add a new transaction
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    try {
      const newTransaction = await transactionHistoryService.addTransaction(transaction);
      await refreshTransactions(); // Refresh to get updated data
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }, [refreshTransactions]);


  // Clear all transactions
  const clearTransactions = useCallback(async () => {
    try {
      await transactionHistoryService.clearTransactions();
      await refreshTransactions();
    } catch (error) {
      console.error('Error clearing transactions:', error);
    }
  }, [refreshTransactions]);

  // Clear all subscription data (called on logout)
  const clearSubscriptionData = useCallback(() => {
    console.log('🧹 Clearing all subscription data...');
    setIsSubscribed(false);
    setSubscriptionStatus(null);
    setPlans([]); // Clear plans
    setTransactions([]);
    setTransactionStats({
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0,
      totalAmount: 0,
      quarterlySubscriptions: 0,
      yearlySubscriptions: 0,
    });
    
    // Clear Autopay state
    setAutopayState({
      isAutopayActive: false,
      nextBillingDate: null,
      autopayLoading: false,
    });

    // Clear Business Profile Subscriptions
    setBusinessProfileSubscriptions({});
    
    setCurrentUserId(null);
    console.log('✅ All subscription data cleared');
  }, []);

  // Check if user has premium access for a specific feature
  const checkPremiumAccess = useCallback((feature: string): boolean => {
    console.log(`PREMIUM_ACCESS_CHECK - Feature: ${feature}`, {
      'isSubscribed': isSubscribed,
      'subscriptionStatus': subscriptionStatus,
      'hasSubscriptionStatus': !!subscriptionStatus
    });

    if (!isSubscribed || !subscriptionStatus) {
      console.log(`🔒 Premium access denied for feature: ${feature} (not subscribed)`);
      return false;
    }

    // Check if subscription is expired (check both expiryDate and endDate)
    const expiryDate = subscriptionStatus.expiryDate || subscriptionStatus.endDate;
    const isExpired = expiryDate && new Date(expiryDate) <= new Date();
    
    console.log(`PREMIUM_ACCESS_EXPIRY_CHECK - Feature: ${feature}`, {
      'expiryDate': expiryDate,
      'currentDate': new Date(),
      'isExpired': isExpired,
      'expiryCheck': expiryDate ? `${new Date(expiryDate)} <= ${new Date()}` : 'no expiry date'
    });

    if (isExpired) {
      console.log(`🔒 Premium access denied for feature: ${feature} (subscription expired on ${expiryDate})`);
      return false;
    }

    // Check if subscription status is active (case-insensitive)
    const normalizedStatus = subscriptionStatus.status?.toLowerCase();
    
    console.log(`PREMIUM_ACCESS_STATUS_CHECK - Feature: ${feature}`, {
      'subscriptionStatus.isActive': subscriptionStatus.isActive,
      'subscriptionStatus.status': subscriptionStatus.status,
      'normalizedStatus': normalizedStatus,
      'isActiveCheck': subscriptionStatus.isActive === true,
      'statusCheck': normalizedStatus === 'active'
    });
    
    // Ensure isActive === true OR status === 'active'
    if (subscriptionStatus.isActive !== true && normalizedStatus !== 'active') {
      console.log(`🔒 Premium access denied for feature: ${feature} (subscription status: isActive=${subscriptionStatus.isActive}, status=${normalizedStatus})`);
      return false;
    }

    console.log(`✅ Premium access granted for feature: ${feature}`);
    return true;
  }, [isSubscribed, subscriptionStatus]);

  // Autopay methods
  const enableAutopay = useCallback(async (planId: string) => {
    try {
      setAutopayState(prev => ({ ...prev, autopayLoading: true }));
      
      console.log('🔄 Enabling Autopay for plan:', planId);
      
      // ONLY call API and return response - NO state updates
      const autopayDetails = await subscriptionApi.createAutopay(planId);
      
      console.log('✅ Autopay setup created:', autopayDetails);
      
      return autopayDetails;
    } catch (error) {
      console.error('❌ Error enabling Autopay:', error);
      throw error;
    } finally {
      setAutopayState(prev => ({ ...prev, autopayLoading: false }));
    }
  }, []);

  const disableAutopay = useCallback(async () => {
    try {
      setAutopayState(prev => ({ ...prev, autopayLoading: true }));
      
      console.log('🔄 Disabling Autopay');
      
      await subscriptionApi.cancelAutopay();
      
      // Update local state
      setAutopayState({
        isAutopayActive: false,
        nextBillingDate: null,
        autopayLoading: false,
      });
      
      console.log('✅ Autopay disabled successfully');
    } catch (error) {
      console.error('❌ Error disabling Autopay:', error);
      throw error;
    } finally {
      setAutopayState(prev => ({ ...prev, autopayLoading: false }));
    }
  }, []);

  const refreshAutopayStatus = useCallback(async () => {
    try {
      console.log('🔄 Refreshing Autopay status');
      
      const autopayStatus = await subscriptionApi.getAutopayStatus();
      
      setAutopayState({
        isAutopayActive: autopayStatus.isActive || false,
        nextBillingDate: autopayStatus.nextBillingDate || null,
        autopayLoading: false,
      });
      
      console.log('✅ Autopay status refreshed:', autopayStatus);
    } catch (error) {
      console.error('❌ Error refreshing Autopay status:', error);
      // Reset to inactive state on error
      setAutopayState({
        isAutopayActive: false,
        nextBillingDate: null,
        autopayLoading: false,
      });
    }
  }, []);

  // Business Profile Subscription Methods
  const [businessProfileSubscriptions, setBusinessProfileSubscriptions] = useState<Record<string, SubscriptionStatus>>({});

  const getBusinessProfileSubscription = useCallback((profileId: string) => {
    return businessProfileSubscriptions[profileId];
  }, [businessProfileSubscriptions]);

  const refreshBusinessProfileSubscription = useCallback(async (profileId: string) => {
    try {
      console.log('🔄 Refreshing subscription for business profile:', profileId);
      const response = await subscriptionApi.getBusinessProfileSubscriptionStatus(profileId);
      
      if (response.success) {
        setBusinessProfileSubscriptions(prev => ({
          ...prev,
          [profileId]: response.data
        }));
        console.log(`✅ Subscription for profile ${profileId} refreshed`);
      }
    } catch (error) {
      console.error(`❌ Error refreshing subscription for profile ${profileId}:`, error);
    }
  }, []);

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      setIsSubscribed,
      subscriptionStatus,
      isLoading,
      plans, // Add plans
      transactions,
      transactionStats,
      refreshSubscription,
      refreshPlans, // Add refreshPlans
      refreshTransactions,
      addTransaction,
      clearTransactions,
      clearSubscriptionData,
      checkPremiumAccess,
      // Autopay properties and methods
      autopayState,
      enableAutopay,
      disableAutopay,
      refreshAutopayStatus,
      // Business Profile Subscriptions
      businessProfileSubscriptions,
      getBusinessProfileSubscription,
      refreshBusinessProfileSubscription,
      // CRITICAL: Payment lock to prevent subscription updates during payment
      setPaymentInProgress,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    console.error('❌ [useSubscription] Context is undefined! Must be used within a SubscriptionProvider.');
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
