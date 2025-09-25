import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import authService from './authService';

export interface Transaction {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  plan: 'monthly' | 'yearly';
  planName: string;
  timestamp: number;
  description: string;
  method: 'razorpay' | 'demo';
  receiptUrl?: string;
  metadata?: {
    email?: string;
    contact?: string;
    name?: string;
  };
}

class TransactionHistoryService {
  private readonly STORAGE_KEY = 'transaction_history';

  // Get all transactions (with backend integration)
  async getTransactions(): Promise<Transaction[]> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        console.log('⚠️ No user ID available, using local storage');
        return await this.getLocalTransactions();
      }

      // Try to get transactions from backend first
      try {
        const response = await api.get(`/api/mobile/transactions/user/${userId}`);
        
        if (response.data.success) {
          const backendTransactions = response.data.data.transactions;
          
          // Transform backend transactions to frontend format
          const transformedTransactions = backendTransactions.map((txn: any) => ({
            id: txn.id,
            paymentId: txn.paymentId || txn.transactionId,
            orderId: txn.orderId || txn.transactionId,
            amount: txn.amount,
            currency: txn.currency || 'INR',
            status: txn.status.toLowerCase(),
            plan: txn.plan === 'monthly_pro' ? 'monthly' : 'yearly',
            planName: txn.planName || (txn.plan === 'monthly_pro' ? 'Monthly Pro' : 'Yearly Pro'),
            timestamp: new Date(txn.createdAt).getTime(),
            description: txn.description || `${txn.planName} Subscription`,
            method: txn.paymentMethod === 'razorpay' ? 'razorpay' : 'demo',
            metadata: txn.metadata ? JSON.parse(txn.metadata) : undefined
          }));

          console.log('✅ Retrieved transactions from backend:', transformedTransactions.length);
          return transformedTransactions;
        }
      } catch (error) {
        console.log('⚠️ Failed to get transactions from backend, using local storage:', error);
      }

      // Fallback to local storage
      return await this.getLocalTransactions();
    } catch (error) {
      console.error('Error getting transactions:', error);
      return await this.getLocalTransactions();
    }
  }

  // Get transactions from local storage
  private async getLocalTransactions(): Promise<Transaction[]> {
    try {
      const transactionsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (transactionsJson) {
        const transactions = JSON.parse(transactionsJson);
        return Array.isArray(transactions) ? transactions : [];
      }
      return [];
    } catch (error) {
      console.error('Error getting local transactions:', error);
      return [];
    }
  }

  // Add a new transaction (with backend integration)
  async addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      const newTransaction: Transaction = {
        ...transaction,
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      // Try to save to backend first
      if (userId) {
        try {
          const backendData = {
            transactionId: newTransaction.paymentId,
            orderId: newTransaction.orderId,
            amount: newTransaction.amount,
            currency: newTransaction.currency,
            plan: newTransaction.plan === 'monthly' ? 'monthly_pro' : 'yearly_pro',
            planName: newTransaction.planName,
            description: newTransaction.description,
            paymentMethod: newTransaction.method,
            paymentId: newTransaction.paymentId,
            metadata: newTransaction.metadata
          };

          const response = await api.post('/api/mobile/transactions', backendData);
          
          if (response.data.success) {
            console.log('✅ Transaction saved to backend:', response.data.data.id);
            // Update the transaction ID with backend ID
            newTransaction.id = response.data.data.id;
          }
        } catch (error) {
          console.log('⚠️ Failed to save transaction to backend, using local storage:', error);
        }
      }

      // Always save to local storage as backup
      const existingTransactions = await this.getLocalTransactions();
      const updatedTransactions = [newTransaction, ...existingTransactions];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTransactions));
      
      console.log('Transaction added:', newTransaction);
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  // Get transaction by ID
  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const transactions = await this.getTransactions();
      return transactions.find(txn => txn.id === id) || null;
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      return null;
    }
  }

  // Update transaction status (with backend integration)
  async updateTransactionStatus(id: string, status: Transaction['status']): Promise<boolean> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      // Try to update in backend first
      if (userId) {
        try {
          const response = await api.put(`/api/mobile/transactions/${id}/status`, {
            status: status.toUpperCase()
          });
          
          if (response.data.success) {
            console.log('✅ Transaction status updated in backend');
          }
        } catch (error) {
          console.log('⚠️ Failed to update transaction status in backend:', error);
        }
      }

      // Update in local storage
      const transactions = await this.getLocalTransactions();
      const transactionIndex = transactions.findIndex(txn => txn.id === id);
      
      if (transactionIndex !== -1) {
        transactions[transactionIndex].status = status;
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return false;
    }
  }

  // Get transactions by status
  async getTransactionsByStatus(status: Transaction['status']): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactions();
      return transactions.filter(txn => txn.status === status);
    } catch (error) {
      console.error('Error getting transactions by status:', error);
      return [];
    }
  }

  // Get transactions by date range
  async getTransactionsByDateRange(startDate: number, endDate: number): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactions();
      return transactions.filter(txn => 
        txn.timestamp >= startDate && txn.timestamp <= endDate
      );
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      return [];
    }
  }

  // Clear all transactions (for testing/reset)
  async clearTransactions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('All transactions cleared');
    } catch (error) {
      console.error('Error clearing transactions:', error);
      throw error;
    }
  }

  // Get transaction statistics (with backend integration)
  async getTransactionStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
    pending: number;
    totalAmount: number;
    monthlySubscriptions: number;
    yearlySubscriptions: number;
  }> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        console.log('⚠️ No user ID available, using local storage stats');
        return await this.getLocalTransactionStats();
      }

      // Try to get stats from backend first
      try {
        const response = await api.get(`/api/mobile/transactions/user/${userId}/summary`);
        
        if (response.data.success) {
          const backendStats = response.data.data;
          
          const transformedStats = {
            total: backendStats.totalTransactions,
            successful: backendStats.successfulTransactions,
            failed: backendStats.failedTransactions,
            pending: backendStats.pendingTransactions,
            totalAmount: backendStats.successfulAmount,
            monthlySubscriptions: 0, // Will be calculated from transactions
            yearlySubscriptions: 0, // Will be calculated from transactions
          };

          console.log('✅ Retrieved transaction stats from backend');
          return transformedStats;
        }
      } catch (error) {
        console.log('⚠️ Failed to get transaction stats from backend, using local storage:', error);
      }

      // Fallback to local storage calculation
      return await this.getLocalTransactionStats();
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      return await this.getLocalTransactionStats();
    }
  }

  // Get transaction stats from local storage
  private async getLocalTransactionStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
    pending: number;
    totalAmount: number;
    monthlySubscriptions: number;
    yearlySubscriptions: number;
  }> {
    try {
      const transactions = await this.getLocalTransactions();
      
      const stats = {
        total: transactions.length,
        successful: transactions.filter(txn => txn.status === 'success').length,
        failed: transactions.filter(txn => txn.status === 'failed').length,
        pending: transactions.filter(txn => txn.status === 'pending').length,
        totalAmount: transactions
          .filter(txn => txn.status === 'success')
          .reduce((sum, txn) => sum + txn.amount, 0),
        monthlySubscriptions: transactions.filter(txn => 
          txn.status === 'success' && txn.plan === 'monthly'
        ).length,
        yearlySubscriptions: transactions.filter(txn => 
          txn.status === 'success' && txn.plan === 'yearly'
        ).length,
      };

      return stats;
    } catch (error) {
      console.error('Error getting local transaction stats:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        totalAmount: 0,
        monthlySubscriptions: 0,
        yearlySubscriptions: 0,
      };
    }
  }

  // Generate demo transactions for testing
  async generateDemoTransactions(): Promise<void> {
    const demoTransactions: Omit<Transaction, 'id' | 'timestamp'>[] = [
      {
        paymentId: 'pay_demo_001',
        orderId: 'order_demo_001',
        amount: 299,
        currency: 'INR',
        status: 'success',
        plan: 'monthly',
        planName: 'Monthly Pro',
        description: 'Monthly Pro Subscription',
        method: 'demo',
        metadata: {
          email: 'user@example.com',
          contact: '9999999999',
          name: 'Demo User',
        },
      },
      {
        paymentId: 'pay_demo_002',
        orderId: 'order_demo_002',
        amount: 1999,
        currency: 'INR',
        status: 'success',
        plan: 'yearly',
        planName: 'Yearly Pro',
        description: 'Yearly Pro Subscription',
        method: 'demo',
        metadata: {
          email: 'user@example.com',
          contact: '9999999999',
          name: 'Demo User',
        },
      },
      {
        paymentId: 'pay_demo_003',
        orderId: 'order_demo_003',
        amount: 299,
        currency: 'INR',
        status: 'failed',
        plan: 'monthly',
        planName: 'Monthly Pro',
        description: 'Monthly Pro Subscription',
        method: 'demo',
        metadata: {
          email: 'user@example.com',
          contact: '9999999999',
          name: 'Demo User',
        },
      },
    ];

    for (const transaction of demoTransactions) {
      await this.addTransaction(transaction);
    }
  }
}

export default new TransactionHistoryService();
