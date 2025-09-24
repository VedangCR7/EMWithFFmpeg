import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Get all transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      const transactionsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (transactionsJson) {
        const transactions = JSON.parse(transactionsJson);
        return Array.isArray(transactions) ? transactions : [];
      }
      return [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // Add a new transaction
  async addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction> {
    try {
      const newTransaction: Transaction = {
        ...transaction,
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      const existingTransactions = await this.getTransactions();
      const updatedTransactions = [newTransaction, ...existingTransactions]; // Add to beginning for newest first

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

  // Update transaction status
  async updateTransactionStatus(id: string, status: Transaction['status']): Promise<boolean> {
    try {
      const transactions = await this.getTransactions();
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

  // Get transaction statistics
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
      const transactions = await this.getTransactions();
      
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
      console.error('Error getting transaction stats:', error);
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
