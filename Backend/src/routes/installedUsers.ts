import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// INSTALLED USER REGISTRATION & MANAGEMENT
// ============================================

// Register new installed user (app install)
router.post('/register', [
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Valid phone number required'),
  body('appVersion').optional().isString(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { deviceId, name, email, phone, appVersion } = req.body;

    // Check if device already registered
    const existingUser = await prisma.installedUser.findUnique({
      where: { deviceId }
    });

    if (existingUser) {
      // Update last active time
      const updatedUser = await prisma.installedUser.update({
        where: { deviceId },
        data: { 
          lastActiveAt: new Date(),
          ...(name && { name }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(appVersion && { appVersion })
        }
      });

      return res.json({
        success: true,
        message: 'User already registered, updated info',
        user: {
          id: updatedUser.id,
          deviceId: updatedUser.deviceId,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          userType: 'INSTALLED_USER',
          canDownload: false,
          totalViews: updatedUser.totalViews,
          downloadAttempts: updatedUser.downloadAttempts
        }
      });
    }

    // Create new installed user
    const installedUser = await prisma.installedUser.create({
      data: {
        deviceId,
        name,
        email,
        phone,
        appVersion,
        installDate: new Date(),
        lastActiveAt: new Date()
      }
    });

    // Log installation
    await prisma.auditLog.create({
      data: {
        installedUserId: installedUser.id,
        userType: 'INSTALLED_USER',
        action: 'INSTALL',
        resource: 'APP',
        details: `App installed on device: ${deviceId}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Installed user registered successfully',
      user: {
        id: installedUser.id,
        deviceId: installedUser.deviceId,
        name: installedUser.name,
        email: installedUser.email,
        phone: installedUser.phone,
        userType: 'INSTALLED_USER',
        canDownload: false,
        totalViews: installedUser.totalViews,
        downloadAttempts: installedUser.downloadAttempts
      }
    });

  } catch (error) {
    console.error('Installed user registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register installed user'
    });
  }
});

// Get installed user profile
router.get('/profile/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const installedUser = await prisma.installedUser.findUnique({
      where: { deviceId }
    });

    if (!installedUser) {
      return res.status(404).json({
        success: false,
        error: 'Installed user not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: installedUser.id,
        deviceId: installedUser.deviceId,
        name: installedUser.name,
        email: installedUser.email,
        phone: installedUser.phone,
        userType: 'INSTALLED_USER',
        canDownload: false,
        totalViews: installedUser.totalViews,
        downloadAttempts: installedUser.downloadAttempts,
        installDate: installedUser.installDate,
        lastActiveAt: installedUser.lastActiveAt
      }
    });

  } catch (error) {
    console.error('Get installed user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Update installed user profile
router.put('/profile/:deviceId', [
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Valid phone number required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { deviceId } = req.params;
    const { name, email, phone } = req.body;

    const updatedUser = await prisma.installedUser.update({
      where: { deviceId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        lastActiveAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        deviceId: updatedUser.deviceId,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        userType: 'INSTALLED_USER',
        canDownload: false
      }
    });

  } catch (error) {
    console.error('Update installed user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Track content view (for installed users)
router.post('/track-view', [
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('contentId').notEmpty().withMessage('Content ID is required'),
  body('contentType').isIn(['IMAGE', 'VIDEO']).withMessage('Content type must be IMAGE or VIDEO'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { deviceId, contentId, contentType } = req.body;

    // Update view count for installed user
    await prisma.installedUser.update({
      where: { deviceId },
      data: { 
        totalViews: { increment: 1 },
        lastActiveAt: new Date()
      }
    });

    // Update content view count
    if (contentType === 'IMAGE') {
      await prisma.image.update({
        where: { id: contentId },
        data: { views: { increment: 1 } }
      });
    } else {
      await prisma.video.update({
        where: { id: contentId },
        data: { views: { increment: 1 } }
      });
    }

    res.json({
      success: true,
      message: 'View tracked successfully'
    });

  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track view'
    });
  }
});

// Track download attempt (should trigger subscription prompt)
router.post('/track-download-attempt', [
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('contentId').notEmpty().withMessage('Content ID is required'),
  body('contentType').isIn(['IMAGE', 'VIDEO']).withMessage('Content type must be IMAGE or VIDEO'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { deviceId, contentId, contentType } = req.body;

    // Update download attempt count
    const installedUser = await prisma.installedUser.update({
      where: { deviceId },
      data: { 
        downloadAttempts: { increment: 1 },
        lastActiveAt: new Date()
      }
    });

    // Log download attempt
    await prisma.auditLog.create({
      data: {
        installedUserId: installedUser.id,
        userType: 'INSTALLED_USER',
        action: 'DOWNLOAD_ATTEMPT',
        resource: contentType,
        resourceId: contentId,
        details: `Download attempt blocked - subscription required`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'BLOCKED'
      }
    });

    res.json({
      success: false,
      error: 'SUBSCRIPTION_REQUIRED',
      message: 'Subscription required to download content',
      data: {
        downloadAttempts: installedUser.downloadAttempts,
        showSubscriptionPrompt: true,
        subscriptionPlans: [
          {
            id: 'yearly_pro',
            name: 'Yearly Pro',
            price: 1999,
            period: 'year',
            savings: '67% OFF'
          }
        ]
      }
    });

  } catch (error) {
    console.error('Track download attempt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track download attempt'
    });
  }
});

// Convert installed user to customer (after subscription)
router.post('/convert-to-customer', [
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('subscriptionData').notEmpty().withMessage('Subscription data is required'),
  body('businessProfile').notEmpty().withMessage('Business profile is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { deviceId, subscriptionData, businessProfile } = req.body;

    // Find installed user
    const installedUser = await prisma.installedUser.findUnique({
      where: { deviceId }
    });

    if (!installedUser) {
      return res.status(404).json({
        success: false,
        error: 'Installed user not found'
      });
    }

    if (installedUser.isConverted) {
      return res.status(400).json({
        success: false,
        error: 'User already converted to customer'
      });
    }

    // Create customer from installed user
    const customer = await prisma.customer.create({
      data: {
        name: businessProfile.businessName || installedUser.name || 'Business User',
        email: installedUser.email || businessProfile.businessEmail,
        phone: installedUser.phone || businessProfile.businessPhone,
        deviceId: installedUser.deviceId,
        selectedBusinessCategoryId: subscriptionData.selectedBusinessCategoryId,
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        subscriptionAmount: subscriptionData.amount,
        paymentMethod: subscriptionData.paymentMethod,
        appVersion: installedUser.appVersion,
        
        // Business Profile
        businessName: businessProfile.businessName,
        businessPhone: businessProfile.businessPhone,
        businessEmail: businessProfile.businessEmail,
        businessWebsite: businessProfile.businessWebsite,
        businessAddress: businessProfile.businessAddress,
        businessLogo: businessProfile.businessLogo,
        businessDescription: businessProfile.businessDescription,
        businessCategory: businessProfile.businessCategory,
        
        convertedFromInstalledUserId: installedUser.id
      }
    });

    // Create subscription record
    await prisma.subscription.create({
      data: {
        customerId: customer.id,
        plan: 'YEARLY',
        status: 'ACTIVE',
        amount: subscriptionData.amount,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        paymentId: subscriptionData.paymentId,
        paymentMethod: subscriptionData.paymentMethod
      }
    });

    // Mark installed user as converted
    await prisma.installedUser.update({
      where: { deviceId },
      data: {
        isConverted: true,
        convertedAt: new Date(),
        convertedToCustomerId: customer.id
      }
    });

    // Log conversion
    await prisma.auditLog.create({
      data: {
        customerId: customer.id,
        userType: 'CUSTOMER',
        action: 'CONVERSION',
        resource: 'SUBSCRIPTION',
        details: `Installed user converted to customer - ${businessProfile.businessName}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully converted to customer',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        businessName: customer.businessName,
        subscriptionStatus: customer.subscriptionStatus,
        subscriptionEndDate: customer.subscriptionEndDate,
        userType: 'CUSTOMER',
        canDownload: true
      }
    });

  } catch (error) {
    console.error('Convert to customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert to customer'
    });
  }
});

// ============================================
// USER ACTIVITY TRACKING
// ============================================

// Track user activity
router.post('/activity', [
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('action').notEmpty().withMessage('Action is required'),
  body('resourceType').notEmpty().withMessage('Resource type is required'),
  body('resourceId').notEmpty().withMessage('Resource ID is required'),
  body('metadata').optional().isObject(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { deviceId, action, resourceType, resourceId, metadata } = req.body;

    // Find the installed user
    const user = await prisma.installedUser.findUnique({
      where: { deviceId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create activity record
    const activity = await prisma.userActivity.create({
      data: {
        deviceId,
        action,
        resourceType,
        resourceId,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Activity recorded successfully',
      activity: {
        id: activity.id,
        deviceId: activity.deviceId,
        action: activity.action,
        resourceType: activity.resourceType,
        resourceId: activity.resourceId,
        metadata: activity.metadata,
        createdAt: activity.createdAt
      }
    });

  } catch (error) {
    console.error('Track user activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record activity'
    });
  }
});

export default router;







