export interface TransactionItem {
  id: string;
  type: 'video' | 'greeting' | 'download' | 'subscription';
  description: string;
  amount: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  userId: string;
  businessId?: string;
  type: 'payment' | 'refund' | 'subscription' | 'credit';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  paymentMethod?: string;
  transactionId?: string; // External payment gateway ID
  items: TransactionItem[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export class TransactionModel implements Transaction {
  id: string;
  userId: string;
  businessId?: string;
  type: 'payment' | 'refund' | 'subscription' | 'credit';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  paymentMethod?: string;
  transactionId?: string;
  items: TransactionItem[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;

  constructor(
    id: string,
    userId: string,
    type: 'payment' | 'refund' | 'subscription' | 'credit',
    amount: number,
    currency: string = 'USD',
    items: TransactionItem[] = [],
    status: 'pending' | 'completed' | 'failed' | 'cancelled' = 'pending',
    businessId?: string,
    paymentMethod?: string,
    transactionId?: string,
    metadata?: Record<string, any>,
    createdAt?: string,
    updatedAt?: string,
    completedAt?: string
  ) {
    this.id = id;
    this.userId = userId;
    this.businessId = businessId;
    this.type = type;
    this.status = status;
    this.amount = amount;
    this.currency = currency;
    this.paymentMethod = paymentMethod;
    this.transactionId = transactionId;
    this.items = items;
    this.metadata = metadata;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
    this.completedAt = completedAt;
  }

  // Validation methods
  isValid(): boolean {
    return !!(this.userId && this.amount >= 0 && this.currency);
  }

  // Transaction operations
  complete(): void {
    this.status = 'completed';
    this.completedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  fail(): void {
    this.status = 'failed';
    this.updatedAt = new Date().toISOString();
  }

  cancel(): void {
    this.status = 'cancelled';
    this.updatedAt = new Date().toISOString();
  }

  // Item management
  addItem(item: TransactionItem): void {
    this.items.push(item);
    this.updatedAt = new Date().toISOString();
  }

  removeItem(itemId: string): void {
    this.items = this.items.filter(item => item.id !== itemId);
    this.updatedAt = new Date().toISOString();
  }

  // Calculate totals
  getTotalAmount(): number {
    return this.items.reduce((total, item) => total + (item.amount * item.quantity), 0);
  }

  getItemCount(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Status checks
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  isRefundable(): boolean {
    return this.isCompleted() && this.type === 'payment';
  }
}