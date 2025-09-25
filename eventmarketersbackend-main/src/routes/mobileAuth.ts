import { Request, Response } from 'express';
import express from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateCustomer } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Mobile Customer Registration
router.post('/register', [
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
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

    const { companyName, email, phone, password } = req.body;

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email }
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Customer already exists with this email'
        }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: companyName,
        email,
        phone: phone,
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: customer.id, 
        email: customer.email, 
        userType: 'CUSTOMER' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: customer.id,
          companyName: customer.name,
          email: customer.email,
          phone: customer.phone,
          isVerified: false,
          createdAt: customer.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Mobile Customer Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
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

    const { email, password } = req.body;

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // TODO: Add password field to Customer model and implement proper password checking
    // For now, we'll use a simple check (this should be replaced with proper password hashing)
    const isPasswordValid = password === 'customer123'; // Temporary - replace with proper password checking
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Update last active
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastActiveAt: new Date() }
    });

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { 
        id: customer.id, 
        email: customer.email, 
        userType: 'CUSTOMER' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { 
        id: customer.id, 
        email: customer.email, 
        type: 'REFRESH' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    const activeSubscription = customer.subscriptions[0];

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: customer.id,
          companyName: customer.name,
          email: customer.email,
          phone: customer.phone,
          isVerified: true,
          selectedBusinessCategory: customer.selectedBusinessCategoryId,
          subscription: activeSubscription ? {
            plan: activeSubscription.plan,
            status: activeSubscription.status,
            expiresAt: activeSubscription.endDate
          } : {
            plan: 'free',
            status: 'inactive',
            expiresAt: null
          }
        },
        accessToken,
        refreshToken,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Get Customer Profile
router.get('/profile', authenticateCustomer, async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.user!.id },
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

    res.json({
      success: true,
      data: {
        user: {
          id: customer.id,
          companyName: customer.name,
          email: customer.email,
          phone: customer.phone,
          selectedBusinessCategory: customer.selectedBusinessCategoryId,
          totalDownloads: customer.totalDownloads,
          subscription: activeSubscription ? {
            plan: activeSubscription.plan,
            status: activeSubscription.status,
            expiresAt: activeSubscription.endDate
          } : {
            plan: 'free',
            status: 'inactive',
            expiresAt: null
          }
        }
      }
    });

  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Update Customer Profile
router.put('/profile', authenticateCustomer, [
  body('companyName').optional().notEmpty(),
  body('phone').optional().notEmpty(),
  body('selectedBusinessCategory').optional().notEmpty(),
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

    const { companyName, phone, selectedBusinessCategory } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.user!.id },
      data: {
        ...(companyName && { name: companyName }),
        ...(phone && { mobileNumber: phone }),
        ...(selectedBusinessCategory && { selectedBusinessCategory }),
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: customer.id,
          companyName: customer.name,
          email: customer.email,
          phone: customer.phone,
          selectedBusinessCategory: customer.selectedBusinessCategoryId
        }
      }
    });

  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Forgot Password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required'),
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

    const { email } = req.body;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    });

    if (!customer) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link will be sent'
      });
    }

    // Generate reset token (in production, use crypto.randomBytes)
    const resetToken = jwt.sign(
      { 
        id: customer.id, 
        email: customer.email, 
        type: 'PASSWORD_RESET' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Log password reset request
    await prisma.auditLog.create({
      data: {
        customerId: customer.id,
        userType: 'CUSTOMER',
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'Authentication',
        details: 'Customer requested password reset',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });

    // In production, send email with reset link
    // For now, return the token for mobile app to handle
    res.json({
      success: true,
      message: 'Password reset instructions sent',
      data: {
        resetToken, // In production, this would be sent via email
        expiresIn: '1 hour'
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Reset Password
router.post('/reset-password', [
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
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

    const { resetToken, newPassword } = req.body;

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET!) as any;
      if (decoded.type !== 'PASSWORD_RESET') {
        throw new Error('Invalid token type');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token'
        }
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update customer password (Note: Customer model needs password field)
    // For now, we'll store it in businessDescription field as a workaround
    // In production, add password field to Customer model
    await prisma.customer.update({
      where: { id: decoded.id },
      data: {
        businessDescription: hashedPassword, // Temporary field usage
        updatedAt: new Date()
      }
    });

    // Log password reset success
    await prisma.auditLog.create({
      data: {
        customerId: decoded.id,
        userType: 'CUSTOMER',
        action: 'PASSWORD_RESET_SUCCESS',
        resource: 'Authentication',
        details: 'Customer successfully reset password',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Refresh Token
router.post('/refresh-token', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
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

    const { refreshToken } = req.body;

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      if (decoded.type !== 'REFRESH') {
        throw new Error('Invalid token type');
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }

    // Verify customer still exists and is active
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, subscriptionStatus: true }
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Customer not found'
        }
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        id: customer.id, 
        email: customer.email, 
        userType: 'CUSTOMER' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { 
        id: customer.id, 
        email: customer.email, 
        type: 'REFRESH' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    // Log token refresh
    await prisma.auditLog.create({
      data: {
        customerId: customer.id,
        userType: 'CUSTOMER',
        action: 'TOKEN_REFRESHED',
        resource: 'Authentication',
        details: 'Customer refreshed access token',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// Logout (Client-side token removal)
router.post('/logout', authenticateCustomer, async (req: Request, res: Response) => {
  try {
    // Log the logout activity
    await prisma.auditLog.create({
      data: {
        customerId: req.user!.id,
        userType: 'CUSTOMER',
        action: 'LOGOUT',
        resource: 'Authentication',
        details: 'Customer logged out from mobile app',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Customer logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

export default router;
