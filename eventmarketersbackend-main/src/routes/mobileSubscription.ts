import { Request, Response } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateCustomer } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get Subscription Plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    // Define subscription plans (these could be stored in database)
    const plans = [
      {
        id: 'monthly_pro',
        name: 'Monthly Pro',
        price: 299,
        originalPrice: 499,
        savings: '40% OFF',
        period: 'month',
        features: [
          'Access to all premium business templates',
          'Unlimited downloads',
          'High-resolution content',
          'Priority customer support',
          'New templates every week',
          'Commercial usage rights'
        ]
      },
      {
        id: 'yearly_pro',
        name: 'Yearly Pro',
        price: 1999,
        originalPrice: 5988,
        savings: '67% OFF',
        period: 'year',
        features: [
          'Access to all premium business templates',
          'Unlimited downloads',
          'High-resolution content',
          'Priority customer support',
          'New templates every week',
          'Commercial usage rights',
          'Exclusive yearly subscriber content',
          'Advanced editing tools',
          'Bulk download feature'
        ]
      }
    ];

    res.json({
      success: true,
      data: {
        plans
      }
    });

  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch subscription plans'
      }
    });
  }
});

// Create Payment Order (Mock Razorpay Integration)
router.post('/create-order', authenticateCustomer, [
  body('planId').notEmpty().withMessage('Plan ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { planId, amount } = req.body;
    const customerId = req.user!.id;

    // In a real implementation, you would integrate with Razorpay here
    // For now, we'll create a mock order
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log the payment attempt
    await prisma.auditLog.create({
      data: {
        customerId: customerId,
        userType: 'CUSTOMER',
        action: 'PAYMENT_INITIATED',
        resource: 'Subscription',
        details: `Payment order created for plan: ${planId}, amount: ${amount}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });

    res.json({
      success: true,
      data: {
        orderId,
        amount,
        currency: 'INR',
        // In real implementation, include Razorpay key and other details
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
        planId
      }
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create payment order'
      }
    });
  }
});

// Verify Payment (Mock Implementation)
router.post('/verify-payment', authenticateCustomer, [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('signature').notEmpty().withMessage('Signature is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { orderId, paymentId, signature } = req.body;
    const customerId = req.user!.id;

    // In a real implementation, you would verify the payment with Razorpay
    // For now, we'll mock a successful verification

    // Determine subscription duration based on order (this would be stored during order creation)
    const isYearlyPlan = orderId.includes('yearly') || Math.random() > 0.5; // Mock logic
    const startDate = new Date();
    const endDate = new Date();
    
    if (isYearlyPlan) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create subscription record
    const subscription = await prisma.subscription.create({
      data: {
        customerId,
        plan: isYearlyPlan ? 'YEARLY' : 'MONTHLY',
        status: 'ACTIVE',
        startDate,
        endDate,
        amount: isYearlyPlan ? 1999 : 299,
        currency: 'INR'
      }
    });

    // Update customer subscription status
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionEndDate: endDate
      }
    });

    // Log successful payment
    await prisma.auditLog.create({
      data: {
        customerId: customerId,
        userType: 'CUSTOMER',
        action: 'PAYMENT_SUCCESS',
        resource: 'Subscription',
        resourceId: subscription.id,
        details: `Payment verified successfully. Order: ${orderId}, Payment: ${paymentId}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        }
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    
    // Log failed payment
    await prisma.auditLog.create({
      data: {
        customerId: req.user!.id,
        userType: 'CUSTOMER',
        action: 'PAYMENT_FAILED',
        resource: 'Subscription',
        details: `Payment verification failed. Order: ${req.body.orderId}`,
        status: 'FAILED',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    }).catch(console.error);

    res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENT_VERIFICATION_FAILED',
        message: 'Failed to verify payment'
      }
    });
  }
});

// Get Subscription Status
router.get('/status', authenticateCustomer, async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Customer not found'
        }
      });
    }

    const activeSubscription = customer.subscriptions[0];
    const now = new Date();

    // Check if subscription is expired
    if (activeSubscription && activeSubscription.endDate < now) {
      // Update subscription status to expired
      await Promise.all([
        prisma.subscription.update({
          where: { id: activeSubscription.id },
          data: { status: 'EXPIRED' }
        }),
        prisma.customer.update({
          where: { id: customerId },
          data: { subscriptionStatus: 'EXPIRED' }
        })
      ]);
    }

    res.json({
      success: true,
      data: {
        subscription: activeSubscription && activeSubscription.endDate >= now ? {
          id: activeSubscription.id,
          plan: activeSubscription.plan,
          status: activeSubscription.status,
          startDate: activeSubscription.startDate,
          endDate: activeSubscription.endDate,
          daysRemaining: Math.ceil((activeSubscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        } : {
          plan: 'free',
          status: 'inactive',
          startDate: null,
          endDate: null,
          daysRemaining: 0
        }
      }
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch subscription status'
      }
    });
  }
});

// Cancel Subscription
router.post('/cancel', authenticateCustomer, async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        customerId,
        status: 'ACTIVE'
      }
    });

    if (!activeSubscription) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'No active subscription found'
        }
      });
    }

    // Update subscription status
    await Promise.all([
      prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: { status: 'CANCELLED' }
      }),
      prisma.customer.update({
        where: { id: customerId },
        data: { subscriptionStatus: 'CANCELLED' }
      }),
      // Log cancellation
      prisma.auditLog.create({
        data: {
          customerId: customerId,
          userType: 'CUSTOMER',
          action: 'SUBSCRIPTION_CANCELLED',
          resource: 'Subscription',
          resourceId: activeSubscription.id,
          details: 'Customer cancelled subscription',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || 'Unknown'
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscription: {
          id: activeSubscription.id,
          status: 'CANCELLED',
          endDate: activeSubscription.endDate // Still valid until end date
        }
      }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to cancel subscription'
      }
    });
  }
});

// Get Payment History
router.get('/history', authenticateCustomer, async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where: { customerId },
        select: {
          id: true,
          plan: true,
          status: true,
          amount: true,
          currency: true,
          startDate: true,
          endDate: true,
          paymentId: true,
          paymentMethod: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.subscription.count({ where: { customerId } })
    ]);

    const paymentHistory = subscriptions.map(subscription => ({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      amount: subscription.amount,
      currency: subscription.currency,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      paymentId: subscription.paymentId || `mock_${subscription.id.slice(-8)}`,
      paymentMethod: subscription.paymentMethod || 'Razorpay',
      paidAt: subscription.createdAt,
      description: `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1).toLowerCase()} Plan Subscription`,
      isActive: subscription.status === 'ACTIVE' && subscription.endDate > new Date()
    }));

    res.json({
      success: true,
      data: {
        payments: paymentHistory,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          totalPayments: total,
          totalAmount: subscriptions.reduce((sum, sub) => sum + sub.amount, 0),
          currency: subscriptions[0]?.currency || 'INR'
        }
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch payment history'
      }
    });
  }
});

export default router;
