import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Middleware to extract user ID from JWT token (placeholder for mobile users)
const extractUserId = (req: Request, res: Response, next: any) => {
  // TODO: Implement actual JWT verification for mobile users
  // For now, we'll use a placeholder user ID
  req.userId = 'demo-mobile-user-id';
  next();
};

// Extend Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * POST /api/mobile/transactions
 * Create new transaction
 */
router.post('/', extractUserId, async (req: Request, res: Response) => {
  try {
    const {
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

    const mobileUserId = req.userId;

    if (!transactionId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID and amount are required'
      });
    }

    if (!mobileUserId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
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
router.get('/user/:userId', extractUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, page = '1', limit = '20' } = req.query;
    const authenticatedUserId = req.userId;

    // Ensure user can only access their own transactions
    if (authenticatedUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own transactions.'
      });
    }

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
router.get('/:id', extractUserId, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authenticatedUserId = req.userId;

    const transaction = await prisma.mobileTransaction.findUnique({
      where: { id }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Ensure user can only access their own transactions
    if (transaction.mobileUserId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own transactions.'
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
router.put('/:id/status', extractUserId, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentId, metadata } = req.body;
    const authenticatedUserId = req.userId;

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

    // Ensure user can only update their own transactions
    if (existingTransaction.mobileUserId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own transactions.'
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
router.get('/transaction/:transactionId', extractUserId, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const authenticatedUserId = req.userId;

    const transaction = await prisma.mobileTransaction.findUnique({
      where: { transactionId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Ensure user can only access their own transactions
    if (transaction.mobileUserId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own transactions.'
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
router.get('/user/:userId/summary', extractUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.userId;

    // Ensure user can only access their own transaction summary
    if (authenticatedUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own transaction summary.'
      });
    }

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
router.get('/user/:userId/recent', extractUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '5' } = req.query;
    const authenticatedUserId = req.userId;

    // Ensure user can only access their own recent transactions
    if (authenticatedUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own recent transactions.'
      });
    }

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
