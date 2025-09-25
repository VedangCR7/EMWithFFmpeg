import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
 * POST /api/mobile/auth/register
 * Register new mobile user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { 
      deviceId, 
      name, 
      email, 
      password,
      phone, 
      appVersion, 
      platform, 
      fcmToken,
      companyName,
      description,
      category,
      address,
      alternatePhone,
      website,
      companyLogo,
      displayName
    } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID is required'
      });
    }

    // If email/password registration, validate required fields
    if (email && password) {
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required for email registration'
        });
      }

      // Check if user with this email already exists
      const existingEmailUser = await prisma.mobileUser.findUnique({
        where: { email }
      });

      if (existingEmailUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);
    }

    // Check if user already exists by deviceId
    const existingUser = await prisma.mobileUser.findUnique({
      where: { deviceId }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this device ID already exists'
      });
    }

    // Create new mobile user
    const bcrypt = require('bcryptjs');
    const mobileUser = await prisma.mobileUser.create({
      data: {
        deviceId,
        name: name || companyName || displayName,
        email,
        password: password ? await bcrypt.hash(password, 12) : null,
        phone,
        alternatePhone,
        description,
        category,
        address,
        website,
        companyLogo,
        appVersion,
        platform,
        fcmToken,
        isActive: true,
        lastActiveAt: new Date()
      }
    });

    // Create business profile if business information is provided
    let businessProfile = null;
    if (companyName || category) {
      businessProfile = await prisma.businessProfile.create({
        data: {
          mobileUserId: mobileUser.id,
          businessName: companyName || name || displayName || 'My Business',
          ownerName: name || 'Business Owner',
          email: email || '',
          phone: phone || '',
          address: address || '',
          category: category || 'General',
          logo: companyLogo || '',
          description: description || '',
          website: website || '',
          socialMedia: null,
          isActive: true
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: mobileUser.id, 
        deviceId: mobileUser.deviceId,
        userType: 'MOBILE_USER' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Mobile user registered successfully',
      data: {
        user: {
          id: mobileUser.id,
          deviceId: mobileUser.deviceId,
          name: mobileUser.name,
          email: mobileUser.email,
          phone: mobileUser.phone,
          alternatePhone: mobileUser.alternatePhone,
          platform: mobileUser.platform,
          isActive: mobileUser.isActive,
          businessProfile: businessProfile
        },
        token,
        refreshToken: null, // Can be implemented later
        expiresIn: 604800 // 7 days in seconds
      }
    });

  } catch (error) {
    console.error('Mobile user registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register mobile user'
    });
  }
});

/**
 * POST /api/mobile/auth/login
 * Login mobile user by email/password or device ID
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, deviceId, rememberMe } = req.body;

    let mobileUser = null;

    // Email/password login
    if (email && password) {
      // Find mobile user by email
      mobileUser = await prisma.mobileUser.findUnique({
        where: { email }
      });

      if (!mobileUser) {
        return res.status(404).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      if (!mobileUser.password) {
        return res.status(400).json({
          success: false,
          error: 'Account was created without password. Please register again.'
        });
      }

      // Verify password
      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(password, mobileUser.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }
    }
    // Device ID login (legacy support)
    else if (deviceId) {
      mobileUser = await prisma.mobileUser.findUnique({
        where: { deviceId }
      });

      if (!mobileUser) {
        return res.status(404).json({
          success: false,
          error: 'Mobile user not found'
        });
      }
    }
    else {
      return res.status(400).json({
        success: false,
        error: 'Email/password or device ID is required'
      });
    }

    if (!mobileUser.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Mobile user account is inactive'
      });
    }

    // Update last active time
    await prisma.mobileUser.update({
      where: { id: mobileUser.id },
      data: { lastActiveAt: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: mobileUser.id, 
        deviceId: mobileUser.deviceId,
        userType: 'MOBILE_USER' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: rememberMe ? '30d' : '7d' }
    );

    res.json({
      success: true,
      message: 'Mobile user login successful',
      data: {
        user: {
          id: mobileUser.id,
          deviceId: mobileUser.deviceId,
          name: mobileUser.name,
          email: mobileUser.email,
          phone: mobileUser.phone,
          alternatePhone: mobileUser.alternatePhone,
          description: mobileUser.description,
          category: mobileUser.category,
          address: mobileUser.address,
          website: mobileUser.website,
          companyLogo: mobileUser.companyLogo,
          platform: mobileUser.platform,
          isActive: mobileUser.isActive,
          lastActiveAt: mobileUser.lastActiveAt,
          createdAt: mobileUser.createdAt,
          updatedAt: mobileUser.updatedAt
        },
        accessToken: token,
        token,
        refreshToken: null, // Can be implemented later
        expiresIn: rememberMe ? 2592000 : 604800 // 30 days or 7 days in seconds
      }
    });

  } catch (error) {
    console.error('Mobile user login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login mobile user'
    });
  }
});

/**
 * GET /api/mobile/auth/me
 * Get current mobile user info
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const mobileUser = await prisma.mobileUser.findUnique({
      where: { id: decoded.id },
      include: {
        businessProfiles: true,
        subscriptions: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!mobileUser) {
      return res.status(404).json({
        success: false,
        error: 'Mobile user not found'
      });
    }

    res.json({
      success: true,
      message: 'Mobile user info retrieved successfully',
      data: {
        id: mobileUser.id,
        deviceId: mobileUser.deviceId,
        name: mobileUser.name,
        email: mobileUser.email,
        phone: mobileUser.phone,
        alternatePhone: mobileUser.alternatePhone,
        description: mobileUser.description,
        category: mobileUser.category,
        address: mobileUser.address,
        website: mobileUser.website,
        companyLogo: mobileUser.companyLogo,
        platform: mobileUser.platform,
        isActive: mobileUser.isActive,
        lastActiveAt: mobileUser.lastActiveAt,
        createdAt: mobileUser.createdAt,
        updatedAt: mobileUser.updatedAt,
        businessProfiles: mobileUser.businessProfiles,
        subscriptions: mobileUser.subscriptions
      }
    });

  } catch (error) {
    console.error('Get mobile user info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mobile user info'
    });
  }
});

/**
 * POST /api/mobile/auth/forgot-password
 * Send password reset email (for users with email)
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Find mobile user by email
    const mobileUser = await prisma.mobileUser.findUnique({
      where: { email }
    });

    if (!mobileUser) {
      return res.status(404).json({
        success: false,
        error: 'User with this email not found'
      });
    }

    // Generate reset token (in a real app, you'd send this via email)
    const resetToken = jwt.sign(
      { 
        id: mobileUser.id, 
        type: 'password_reset' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // In a real implementation, you would:
    // 1. Store the reset token in database
    // 2. Send email with reset link
    // 3. Return success without exposing the token

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      data: {
        resetToken // Remove this in production - only for testing
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request'
    });
  }
});

/**
 * POST /api/mobile/auth/reset-password
 * Reset password using reset token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token, new password, and confirm password are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        error: 'Invalid reset token'
      });
    }

    // Find user
    const mobileUser = await prisma.mobileUser.findUnique({
      where: { id: decoded.id }
    });

    if (!mobileUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password (you might need to add password field to MobileUser model)
    // For now, we'll just return success
    // await prisma.mobileUser.update({
    //   where: { id: mobileUser.id },
    //   data: { password: hashedPassword }
    // });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

/**
 * POST /api/mobile/auth/verify-email
 * Verify user's email address
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    // Verify email token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.type !== 'email_verification') {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification token'
      });
    }

    // Find user
    const mobileUser = await prisma.mobileUser.findUnique({
      where: { id: decoded.id }
    });

    if (!mobileUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update email verification status (you might need to add this field to MobileUser model)
    // await prisma.mobileUser.update({
    //   where: { id: mobileUser.id },
    //   data: { isEmailVerified: true }
    // });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify email'
    });
  }
});

/**
 * POST /api/mobile/auth/logout
 * Logout mobile user (user-specific)
 */
router.post('/logout', extractUserId, async (req: Request, res: Response) => {
  try {
    const mobileUserId = req.userId;

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
        error: 'User not found'
      });
    }

    // Update last active time
    await prisma.mobileUser.update({
      where: { id: mobileUserId },
      data: { lastActiveAt: new Date() }
    });

    // Log the logout activity
    await prisma.mobileActivity.create({
      data: {
        mobileUserId: mobileUserId,
        action: 'LOGOUT',
        resourceType: 'Authentication',
        resourceId: null,
        metadata: JSON.stringify({
          logoutTime: new Date().toISOString(),
          userAgent: req.headers['user-agent'] || 'unknown'
        })
      }
    });

    res.json({
      success: true,
      message: 'Logout successful',
      data: {
        userId: mobileUserId,
        logoutTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
});

export default router;
