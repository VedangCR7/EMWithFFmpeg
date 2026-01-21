import { TransactionModel } from '../Transaction';

describe('TransactionModel', () => {
  const mockItems = [
    {
      id: 'item1',
      type: 'video' as const,
      description: 'Video creation',
      amount: 5.99,
      quantity: 2
    },
    {
      id: 'item2',
      type: 'download' as const,
      description: 'High quality download',
      amount: 2.99,
      quantity: 1
    }
  ];

  test('should create a valid transaction', () => {
    const transaction = new TransactionModel(
      '1',
      'user1',
      'payment',
      14.97,
      'USD',
      mockItems,
      'completed',
      'business1',
      'credit_card',
      'txn_123456',
      { gateway: 'stripe', reference: 'ref_123' }
    );

    expect(transaction.id).toBe('1');
    expect(transaction.userId).toBe('user1');
    expect(transaction.amount).toBe(14.97);
    expect(transaction.isValid()).toBe(true);
    expect(transaction.isCompleted()).toBe(true);
    expect(transaction.getTotalAmount()).toBe(14.97);
    expect(transaction.getItemCount()).toBe(3);
  });

  test('should validate transaction correctly', () => {
    const invalidTransaction = new TransactionModel('', '', 'payment', -10, '');
    expect(invalidTransaction.isValid()).toBe(false);

    const validTransaction = new TransactionModel('1', 'user1', 'payment', 9.99, 'USD');
    expect(validTransaction.isValid()).toBe(true);
  });

  test('should handle transaction status operations', () => {
    const transaction = new TransactionModel('1', 'user1', 'payment', 9.99);

    expect(transaction.status).toBe('pending');
    expect(transaction.isPending()).toBe(true);
    expect(transaction.isCompleted()).toBe(false);

    transaction.complete();
    expect(transaction.status).toBe('completed');
    expect(transaction.isCompleted()).toBe(true);
    expect(transaction.isPending()).toBe(false);
    expect(transaction.completedAt).toBeDefined();

    transaction.fail();
    expect(transaction.status).toBe('failed');
    expect(transaction.isFailed()).toBe(true);

    transaction.cancel();
    expect(transaction.status).toBe('cancelled');
  });

  test('should manage transaction items', () => {
    const transaction = new TransactionModel('1', 'user1', 'payment', 0, 'USD');

    expect(transaction.items).toEqual([]);
    expect(transaction.getTotalAmount()).toBe(0);
    expect(transaction.getItemCount()).toBe(0);

    transaction.addItem(mockItems[0]);
    expect(transaction.items).toHaveLength(1);
    expect(transaction.getTotalAmount()).toBe(11.98); // 5.99 * 2
    expect(transaction.getItemCount()).toBe(2);

    transaction.addItem(mockItems[1]);
    expect(transaction.items).toHaveLength(2);
    expect(transaction.getTotalAmount()).toBe(14.97); // 11.98 + 2.99
    expect(transaction.getItemCount()).toBe(3);

    transaction.removeItem('item1');
    expect(transaction.items).toHaveLength(1);
    expect(transaction.getTotalAmount()).toBe(2.99);
    expect(transaction.getItemCount()).toBe(1);
  });

  test('should check refund eligibility', () => {
    const paymentTransaction = new TransactionModel('1', 'user1', 'payment', 9.99, 'USD', [], 'completed');
    const refundTransaction = new TransactionModel('2', 'user1', 'refund', 9.99, 'USD', [], 'completed');
    const pendingTransaction = new TransactionModel('3', 'user1', 'payment', 9.99, 'USD', [], 'pending');

    expect(paymentTransaction.isRefundable()).toBe(true);
    expect(refundTransaction.isRefundable()).toBe(false);
    expect(pendingTransaction.isRefundable()).toBe(false);
  });

  test('should have default values', () => {
    const transaction = new TransactionModel('1', 'user1', 'payment', 9.99);

    expect(transaction.currency).toBe('USD');
    expect(transaction.status).toBe('pending');
    expect(transaction.items).toEqual([]);
    expect(transaction.type).toBe('payment');
  });

  test('should handle zero amount transactions', () => {
    const freeTransaction = new TransactionModel('1', 'user1', 'credit', 0, 'USD');
    expect(freeTransaction.isValid()).toBe(true);
    expect(freeTransaction.amount).toBe(0);
  });
});