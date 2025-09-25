import express, { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { generateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Admin Login
router.post('/admin/login', loginValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find admin user
    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true
      }
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or account inactive'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: admin.id,
      email: admin.email,
      userType: 'ADMIN'
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        userType: 'ADMIN',
        action: 'LOGIN',
        resource: 'AUTH',
        details: 'Admin login successful',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        userType: 'ADMIN'
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Subadmin Login
router.post('/subadmin/login', loginValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find subadmin user
    const subadmin = await prisma.subadmin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        status: true,
        permissions: true,
        assignedCategories: true
      }
    });

    if (!subadmin || subadmin.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or account inactive'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, subadmin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await prisma.subadmin.update({
      where: { id: subadmin.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = generateToken({
      id: subadmin.id,
      email: subadmin.email,
      userType: 'SUBADMIN'
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        subadminId: subadmin.id,
        userType: 'SUBADMIN',
        action: 'LOGIN',
        resource: 'AUTH',
        details: 'Subadmin login successful',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: subadmin.id,
        email: subadmin.email,
        name: subadmin.name,
        role: subadmin.role,
        userType: 'SUBADMIN',
        permissions: subadmin.permissions,
        assignedCategories: subadmin.assignedCategories
      }
    });

  } catch (error) {
    console.error('Subadmin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Logout (invalidate token - in real app, you'd maintain a blacklist)
router.post('/logout', async (req, res) => {
  try {
    // In a production app, you would:
    // 1. Add token to blacklist
    // 2. Clear session if using sessions
    // 3. Log the logout activity

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    let user = null;
    if (decoded.userType === 'ADMIN') {
      user = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true, isActive: true }
      });
    } else if (decoded.userType === 'SUBADMIN') {
      user = await prisma.subadmin.findUnique({
        where: { id: decoded.id },
        select: { 
          id: true, 
          email: true, 
          name: true, 
          role: true, 
          status: true, 
          permissions: true,
          assignedCategories: true
        }
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        ...user,
        userType: decoded.userType
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

export default router;
