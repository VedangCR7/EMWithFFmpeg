import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import transactionHistoryService, { Transaction } from '../services/transactionHistory';

interface SubscriptionContextType {
  isSubscribed: boolean;
  setIsSubscribed: (value: boolean) => void;
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
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<Transaction>;
  generateDemoTransactions: () => Promise<void>;
  clearTransactions: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState(false); // Default to false (not subscribed) for demo
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

  // Load transactions on mount
  useEffect(() => {
    refreshTransactions();
  }, []);

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

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      setIsSubscribed,
      transactions,
      transactionStats,
      refreshTransactions,
      addTransaction,
      generateDemoTransactions,
      clearTransactions,
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
