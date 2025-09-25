import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Middleware to extract user ID from JWT token (placeholder)
const extractUserId = (req: Request, res: Response, next: any) => {
  // TODO: Implement actual JWT verification
  // For now, we'll use a placeholder user ID
  req.userId = 'demo-user-id';
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
 * GET /api/mobile/subscription/plans
 * Get available subscription plans (frontend endpoint)
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    // For now, return mock plans since we don't have subscription plans in the database
    const mockPlans = [
      {
        id: 'monthly_pro',
        name: 'Monthly Pro',
        description: 'Monthly subscription with premium features',
        price: 299,
        currency: 'INR',
        duration: 'monthly',
        features: [
          'Unlimited poster creation',
          'Premium templates',
          'No watermarks',
          'High-resolution exports',
          'Priority support',
          'Custom branding',
          'Advanced editing tools',
          'Cloud storage'
        ],
        isPopular: false
      },
      {
        id: 'yearly_pro',
        name: 'Yearly Pro',
        description: 'Yearly subscription with premium features and savings',
        price: 1999,
        currency: 'INR',
        duration: 'yearly',
        features: [
          'Everything in Monthly Pro',
          '2 months free',
          'Early access to new features',
          'Exclusive templates',
          'API access',
          'White-label solution',
          'Team collaboration',
          'Analytics dashboard'
        ],
        isPopular: true
      }
    ];

    res.json({
      success: true,
      message: 'Subscription plans fetched successfully',
      data: mockPlans
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
 * GET /api/mobile/subscription/status
 * Get current user's subscription status (frontend endpoint)
 */
router.get('/status', extractUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user has an active subscription
    const activeSubscription = await prisma.mobileSubscription.findFirst({
      where: {
        mobileUserId: userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      },
      include: {
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (activeSubscription) {
      res.json({
        success: true,
        message: 'Subscription status fetched successfully',
        data: {
          isActive: true,
          plan: activeSubscription.plan,
          planId: activeSubscription.planId,
          planName: activeSubscription.plan?.name,
          startDate: activeSubscription.startDate.toISOString(),
          endDate: activeSubscription.endDate.toISOString(),
          expiryDate: activeSubscription.endDate.toISOString(),
          autoRenew: activeSubscription.autoRenew,
          status: 'active'
        }
      });
    } else {
      res.json({
        success: true,
        message: 'No active subscription found',
        data: {
          isActive: false,
          plan: null,
          planId: null,
          planName: null,
          startDate: null,
          endDate: null,
          expiryDate: null,
          autoRenew: false,
          status: 'inactive'
        }
      });
    }

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription status'
    });
  }
});

/**
 * POST /api/mobile/subscription/subscribe
 * Subscribe to a plan (frontend endpoint)
 */
router.post('/subscribe', extractUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { planId, paymentMethod = 'razorpay', autoRenew = true } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    // Mock plan data
    const mockPlans = {
      'monthly_pro': { price: 299, period: 'month' },
      'yearly_pro': { price: 1999, period: 'year' }
    };

    const plan = mockPlans[planId as keyof typeof mockPlans];
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }

    // Check if user exists
    const user = await prisma.mobileUser.findFirst({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (plan.period === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.period === 'year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription
    const subscription = await prisma.mobileSubscription.create({
      data: {
        mobileUserId: userId,
        planId: planId,
        status: 'ACTIVE',
        startDate,
        endDate,
        amount: plan.price,
        paymentId: `pay_${Date.now()}`,
        paymentMethod,
        autoRenew
      }
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        isActive: true,
        planId: planId,
        planName: planId === 'monthly_pro' ? 'Monthly Pro' : 'Yearly Pro',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        expiryDate: endDate.toISOString(),
        autoRenew,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription'
    });
  }
});

/**
 * POST /api/mobile/subscription/renew
 * Renew subscription (frontend endpoint)
 */
router.post('/renew', extractUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Find active subscription
    const subscription = await prisma.mobileSubscription.findFirst({
      where: {
        mobileUserId: userId,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    // Extend subscription by the same period
    const newEndDate = new Date(subscription.endDate);
    if (subscription.planId === 'monthly_pro') {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else if (subscription.planId === 'yearly_pro') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    // Update subscription
    const updatedSubscription = await prisma.mobileSubscription.update({
      where: { id: subscription.id },
      data: {
        endDate: newEndDate,
        status: 'ACTIVE'
      }
    });

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: {
        isActive: true,
        planId: updatedSubscription.planId,
        endDate: updatedSubscription.endDate.toISOString(),
        expiryDate: updatedSubscription.endDate.toISOString(),
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to renew subscription'
    });
  }
});

/**
 * GET /api/mobile/subscription/history
 * Get subscription history (frontend endpoint)
 */
router.get('/history', extractUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const subscriptions = await prisma.mobileSubscription.findMany({
      where: { mobileUserId: userId },
      orderBy: { createdAt: 'desc' }
    });

    const history = subscriptions.map(sub => ({
      id: sub.id,
      planId: sub.planId,
      planName: sub.planId === 'monthly_pro' ? 'Monthly Pro' : 'Yearly Pro',
      amount: sub.amount,
      currency: 'INR',
      status: sub.status.toLowerCase(),
      createdAt: sub.createdAt.toISOString(),
      paymentMethod: sub.paymentMethod
    }));

    res.json({
      success: true,
      message: 'Subscription history fetched successfully',
      data: history
    });

  } catch (error) {
    console.error('Get subscription history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription history'
    });
  }
});

/**
 * POST /api/mobile/subscription/cancel
 * Cancel subscription (frontend endpoint)
 */
router.post('/cancel', extractUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Find active subscription
    const subscription = await prisma.mobileSubscription.findFirst({
      where: {
        mobileUserId: userId,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    // Cancel subscription
    await prisma.mobileSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        autoRenew: false
      }
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
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
