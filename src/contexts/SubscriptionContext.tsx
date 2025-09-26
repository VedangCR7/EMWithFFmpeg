import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import transactionHistoryService, { Transaction } from '../services/transactionHistory';
import subscriptionApi, { SubscriptionStatus } from '../services/subscriptionApi';
import authService from '../services/auth';

interface SubscriptionContextType {
  isSubscribed: boolean;
  setIsSubscribed: (value: boolean) => void;
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  transactions: Transaction[];
  transactionStats: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    totalAmount: number;
    monthlySubscriptions: number;
    yearlySubscriptions: number;
  };
  refreshSubscription: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<Transaction>;
  generateDemoTransactions: () => Promise<void>;
  clearTransactions: () => Promise<void>;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    totalAmount: 0,
    monthlySubscriptions: 0,
    yearlySubscriptions: 0,
  });

  // Load subscription status and transactions on mount
  useEffect(() => {
    refreshSubscription();
    refreshTransactions();
  }, []);

  // Refresh subscription status from backend
  const refreshSubscription = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Refreshing subscription status...');
      
      const currentUser = authService.getCurrentUser();
      if (!currentUser?.id) {
        console.log('⚠️ No user ID available, setting default subscription status');
        setIsSubscribed(false);
        setSubscriptionStatus(null);
        return;
      }

      const response = await subscriptionApi.getStatus();
      
      if (response.success) {
        const status = response.data;
        console.log('✅ Subscription status fetched:', status);
        
        // Check if subscription is active and not expired
        const isActive = status.isActive && 
          status.status === 'active' && 
          (status.expiryDate ? new Date(status.expiryDate) > new Date() : true);
        
        setIsSubscribed(isActive);
        setSubscriptionStatus(status);
        
        console.log('🔐 Subscription access:', isActive ? 'GRANTED' : 'DENIED');
      } else {
        console.log('⚠️ Failed to fetch subscription status, defaulting to not subscribed');
        setIsSubscribed(false);
        setSubscriptionStatus(null);
      }
    } catch (error) {
      console.error('❌ Error refreshing subscription status:', error);
      setIsSubscribed(false);
      setSubscriptionStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh transactions and stats
  const refreshTransactions = async () => {
    try {
      const [transactionsData, statsData] = await Promise.all([
        transactionHistoryService.getTransactions(),
        transactionHistoryService.getTransactionStats(),
      ]);
      
      setTransactions(transactionsData);
      setTransactionStats(statsData);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  };

  // Add a new transaction
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    try {
      const newTransaction = await transactionHistoryService.addTransaction(transaction);
      await refreshTransactions(); // Refresh to get updated data
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  // Generate demo transactions
  const generateDemoTransactions = async () => {
    try {
      await transactionHistoryService.generateDemoTransactions();
      await refreshTransactions();
    } catch (error) {
      console.error('Error generating demo transactions:', error);
    }
  };

  // Clear all transactions
  const clearTransactions = async () => {
    try {
      await transactionHistoryService.clearTransactions();
      await refreshTransactions();
    } catch (error) {
      console.error('Error clearing transactions:', error);
    }
  };

  // Check if user has premium access for a specific feature
  const checkPremiumAccess = (feature: string): boolean => {
    if (!isSubscribed || !subscriptionStatus) {
      console.log(`🔒 Premium access denied for feature: ${feature} (not subscribed)`);
      return false;
    }

    // Check if subscription is expired
    if (subscriptionStatus.expiryDate && new Date(subscriptionStatus.expiryDate) <= new Date()) {
      console.log(`🔒 Premium access denied for feature: ${feature} (subscription expired)`);
      return false;
    }

    // Check if subscription status is active
    if (subscriptionStatus.status !== 'active') {
      console.log(`🔒 Premium access denied for feature: ${feature} (subscription not active)`);
      return false;
    }

    console.log(`✅ Premium access granted for feature: ${feature}`);
    return true;
  };

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      setIsSubscribed,
      subscriptionStatus,
      isLoading,
      transactions,
      transactionStats,
      refreshSubscription,
      refreshTransactions,
      addTransaction,
      generateDemoTransactions,
      clearTransactions,
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
