import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/mobile/subscription-plans
 * Get available subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await prisma.mobileSubscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({
      success: true,
      message: 'Subscription plans fetched successfully',
      data: plans
    });

  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans'
    });
  }
});

/**
 * GET /api/mobile/subscription-plans/:id
 * Get subscription plan details
 */
router.get('/plans/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await prisma.mobileSubscriptionPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscription plan details fetched successfully',
      data: plan
    });

  } catch (error) {
    console.error('Get subscription plan details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plan details'
    });
  }
});

/**
 * POST /api/mobile/subscriptions
 * Create new subscription
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      mobileUserId, 
      planId, 
      amount, 
      paymentId, 
      paymentMethod = 'razorpay' 
    } = req.body;

    if (!mobileUserId || !planId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Mobile user ID, plan ID, and amount are required'
      });
    }

    // Check if plan exists
    const plan = await prisma.mobileSubscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
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

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (plan.period === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.period === 'year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (plan.period === 'lifetime') {
      endDate.setFullYear(endDate.getFullYear() + 100); // 100 years = lifetime
    }

    // Create subscription
    const subscription = await prisma.mobileSubscription.create({
      data: {
        mobileUserId,
        planId,
        status: 'ACTIVE',
        startDate,
        endDate,
        amount: parseFloat(amount),
        paymentId,
        paymentMethod,
        autoRenew: true
      },
      include: {
        plan: true,
        mobileUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription'
    });
  }
});

/**
 * GET /api/mobile/subscriptions/user/:userId
 * Get user's subscriptions
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, active = 'true' } = req.query;

    const where: any = { mobileUserId: userId };
    if (status) where.status = status;
    if (active === 'true') {
      where.status = 'ACTIVE';
      where.endDate = { gte: new Date() };
    }

    const subscriptions = await prisma.mobileSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true
      }
    });

    res.json({
      success: true,
      message: 'User subscriptions fetched successfully',
      data: subscriptions
    });

  } catch (error) {
    console.error('Get user subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user subscriptions'
    });
  }
});

/**
 * PUT /api/mobile/subscriptions/:id/cancel
 * Cancel subscription
 */
router.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if subscription exists
    const subscription = await prisma.mobileSubscription.findUnique({
      where: { id }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Only active subscriptions can be cancelled'
      });
    }

    // Update subscription status
    const updatedSubscription = await prisma.mobileSubscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        autoRenew: false
      },
      include: {
        plan: true
      }
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: updatedSubscription
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

/**
 * GET /api/mobile/subscriptions/:id/status
 * Get subscription status
 */
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.mobileSubscription.findUnique({
      where: { id },
      include: {
        plan: true,
        mobileUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Check if subscription is still active
    const isActive = subscription.status === 'ACTIVE' && subscription.endDate > new Date();
    const daysRemaining = isActive ? Math.ceil((subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

    res.json({
      success: true,
      message: 'Subscription status fetched successfully',
      data: {
        ...subscription,
        isActive,
        daysRemaining
      }
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription status'
    });
  }
});

export default router;
