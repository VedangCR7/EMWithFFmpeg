import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        userType: 'ADMIN' | 'SUBADMIN' | 'CUSTOMER';
        permissions?: string; // JSON string
        assignedCategories?: string; // JSON string
        selectedBusinessCategory?: string;
        subscriptionStatus?: string;
        subscriptionExpiry?: Date;
      };
    }
  }
}

// JWT Token utilities
export const generateToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

// Authentication middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }

    const decoded = verifyToken(token);
    
    // Fetch user details based on user type
    let user = null;
    if (decoded.userType === 'ADMIN') {
      user = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true, isActive: true }
      });
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Admin account not found or inactive'
        });
      }
    } else if (decoded.userType === 'SUBADMIN') {
      user = await prisma.subadmin.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true, status: true, permissions: true }
      });
      
      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({
          success: false,
          error: 'Subadmin account not found or inactive'
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      userType: decoded.userType
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Admin-only middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.userType !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

// Subadmin-only middleware
export const requireSubadmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.userType !== 'SUBADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Subadmin access required'
    });
  }
  next();
};

// Admin or Subadmin middleware
export const requireStaff = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !['ADMIN', 'SUBADMIN'].includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      error: 'Staff access required'
    });
  }
  next();
};

// Permission-based middleware
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Admins have all permissions
    if (req.user.userType === 'ADMIN') {
      return next();
    }

    // Check subadmin permissions
    if (req.user.userType === 'SUBADMIN') {
      const subadmin = await prisma.subadmin.findUnique({
        where: { id: req.user.id },
        select: { permissions: true }
      });

      if (!subadmin || !subadmin.permissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          error: `Permission '${permission}' required`
        });
      }
    }

    next();
  };
};

// Middleware to authenticate customers (mobile app users)
export const authenticateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Access denied. No token provided.'
        }
      });
    }

    const decoded = verifyToken(token) as any;
    
    if (decoded.userType !== 'CUSTOMER') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Access denied. Customer access required.'
        }
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        selectedBusinessCategoryId: true,
        subscriptionStatus: true,
        subscriptionEndDate: true
      }
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token. Customer not found.'
        }
      });
    }

    req.user = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      role: 'CUSTOMER',
      userType: 'CUSTOMER',
      selectedBusinessCategory: customer.selectedBusinessCategoryId || undefined,
      subscriptionStatus: customer.subscriptionStatus,
      subscriptionExpiry: customer.subscriptionEndDate || undefined
    };

    next();
  } catch (error) {
    console.error('Customer authentication error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token.'
      }
    });
  }
};
