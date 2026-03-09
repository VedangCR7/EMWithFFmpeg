import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import transactionHistoryService, { Transaction } from '../services/transactionHistory';
import subscriptionApi, { SubscriptionStatus } from '../services/subscriptionApi';
import authService from '../services/auth';

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
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);

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
      
      // Update current user ID
      setCurrentUserId(newUserId);
      
      // If there's a new user, fetch their subscription data
      if (newUserId) {
        console.log('✅ New user detected, fetching subscription data for:', newUserId);
        refreshSubscription();
        refreshPlans(); // Fetch plans
        refreshTransactions();
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
          'status.planName': status.planName
        });
        
        // Safer access logic - check isActive and expiry
        const accessGranted =
          Boolean(status?.isActive) &&
          (!status?.expiryDate || new Date(status.expiryDate) > new Date());
        
        console.log("ACCESS_CHECK_RESULT", {
          isActive: status?.isActive,
          expiryDate: status?.expiryDate,
          accessGranted
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
      console.log('✅ Subscription refresh completed');
    }
  }, []);

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
    
    // Ensure both isActive === true AND status === 'active'
    if (subscriptionStatus.isActive !== true || normalizedStatus !== 'active') {
      console.log(`🔒 Premium access denied for feature: ${feature} (subscription status: isActive=${subscriptionStatus.isActive}, status=${normalizedStatus})`);
      return false;
    }

    console.log(`✅ Premium access granted for feature: ${feature}`);
    return true;
  }, [isSubscribed, subscriptionStatus]);

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
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
