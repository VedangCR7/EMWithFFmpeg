import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/mobile/transactions
 * Create new transaction
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      mobileUserId,
      transactionId,
      orderId,
      amount,
      currency = 'INR',
      plan,
      planName,
      description,
      paymentMethod = 'razorpay',
      paymentId,
      metadata
    } = req.body;

    if (!mobileUserId || !transactionId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Mobile user ID, transaction ID, and amount are required'
      });
    }

    // Check if user exists
    const user = await prisma.mobileUser.findUnique({
      where: { id: mobileUserId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Mobile user not found'
      });
    }

    // Create transaction
    const transaction = await prisma.mobileTransaction.create({
      data: {
        mobileUserId,
        transactionId,
        orderId,
        amount: parseFloat(amount),
        currency,
        status: 'PENDING',
        plan,
        planName,
        description,
        paymentMethod,
        paymentId,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction'
    });
  }
});

/**
 * GET /api/mobile/transactions/user/:userId
 * Get user's transactions
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, page = '1', limit = '20' } = req.query;

    const where: any = { mobileUserId: userId };
    if (status) where.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      prisma.mobileTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.mobileTransaction.count({ where })
    ]);

    res.json({
      success: true,
      message: 'User transactions fetched successfully',
      data: {
        transactions,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });

  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user transactions'
    });
  }
});

/**
 * GET /api/mobile/transactions/:id
 * Get transaction details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.mobileTransaction.findUnique({
      where: { id }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction details fetched successfully',
      data: transaction
    });

  } catch (error) {
    console.error('Get transaction details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction details'
    });
  }
});

/**
 * PUT /api/mobile/transactions/:id/status
 * Update transaction status
 */
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentId, metadata } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Check if transaction exists
    const existingTransaction = await prisma.mobileTransaction.findUnique({
      where: { id }
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Update transaction
    const updatedTransaction = await prisma.mobileTransaction.update({
      where: { id },
      data: {
        status,
        paymentId: paymentId || existingTransaction.paymentId,
        metadata: metadata ? JSON.stringify(metadata) : existingTransaction.metadata
      }
    });

    res.json({
      success: true,
      message: 'Transaction status updated successfully',
      data: updatedTransaction
    });

  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update transaction status'
    });
  }
});

/**
 * GET /api/mobile/transactions/transaction/:transactionId
 * Get transaction by transaction ID
 */
router.get('/transaction/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const transaction = await prisma.mobileTransaction.findUnique({
      where: { transactionId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction fetched successfully',
      data: transaction
    });

  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction'
    });
  }
});

/**
 * GET /api/mobile/transactions/user/:userId/summary
 * Get user's transaction summary
 */
router.get('/user/:userId/summary', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get transaction statistics
    const [
      totalTransactions,
      successfulTransactions,
      pendingTransactions,
      failedTransactions,
      totalAmount,
      successfulAmount
    ] = await Promise.all([
      prisma.mobileTransaction.count({
        where: { mobileUserId: userId }
      }),
      prisma.mobileTransaction.count({
        where: { mobileUserId: userId, status: 'SUCCESS' }
      }),
      prisma.mobileTransaction.count({
        where: { mobileUserId: userId, status: 'PENDING' }
      }),
      prisma.mobileTransaction.count({
        where: { mobileUserId: userId, status: 'FAILED' }
      }),
      prisma.mobileTransaction.aggregate({
        where: { mobileUserId: userId },
        _sum: { amount: true }
      }),
      prisma.mobileTransaction.aggregate({
        where: { mobileUserId: userId, status: 'SUCCESS' },
        _sum: { amount: true }
      })
    ]);

    const summary = {
      totalTransactions,
      successfulTransactions,
      pendingTransactions,
      failedTransactions,
      totalAmount: totalAmount._sum.amount || 0,
      successfulAmount: successfulAmount._sum.amount || 0,
      successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0
    };

    res.json({
      success: true,
      message: 'Transaction summary fetched successfully',
      data: summary
    });

  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction summary'
    });
  }
});

/**
 * GET /api/mobile/transactions/user/:userId/recent
 * Get user's recent transactions
 */
router.get('/user/:userId/recent', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '5' } = req.query;

    const transactions = await prisma.mobileTransaction.findMany({
      where: { mobileUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      message: 'Recent transactions fetched successfully',
      data: transactions
    });

  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent transactions'
    });
  }
});

export default router;
