import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// SUBADMIN MANAGEMENT
// ============================================

// Get all subadmins
router.get('/subadmins', async (req, res) => {
  try {
    const subadmins = await prisma.subadmin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        mobileNumber: true,
        role: true,
        permissions: true,
        status: true,
        assignedCategories: true,
        createdAt: true,
        lastLogin: true,
        admin: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      subadmins
    });

  } catch (error) {
    console.error('Get subadmins error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subadmins'
    });
  }
});

// Create new subadmin
router.post('/subadmins', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').notEmpty().withMessage('Role is required'),
  body('permissions').isArray().withMessage('Permissions must be an array'),
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

    const { email, name, password, mobileNumber, role, permissions, assignedBusinessCategories } = req.body;

    // Check if email already exists
    const existingSubadmin = await prisma.subadmin.findUnique({
      where: { email }
    });

    if (existingSubadmin) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create subadmin
    const subadmin = await prisma.subadmin.create({
      data: {
        email,
        name,
        password: hashedPassword,
        mobileNumber,
        role,
        permissions: JSON.stringify(permissions),
        assignedCategories: JSON.stringify(assignedBusinessCategories || []),
        createdBy: req.user!.id
      },
      select: {
        id: true,
        email: true,
        name: true,
        mobileNumber: true,
        role: true,
        permissions: true,
        status: true,
        assignedCategories: true,
        createdAt: true
      }
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        userType: 'ADMIN',
        action: 'CREATE',
        resource: 'SUBADMIN',
        resourceId: subadmin.id,
        details: `Created subadmin: ${subadmin.name}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Subadmin created successfully',
      subadmin
    });

  } catch (error) {
    console.error('Create subadmin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subadmin'
    });
  }
});

// Update subadmin
router.put('/subadmins/:id', [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
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

    const { id } = req.params;
    const { email, name, password, mobileNumber, role, permissions, assignedBusinessCategories, status } = req.body;

    // Check if subadmin exists
    const existingSubadmin = await prisma.subadmin.findUnique({
      where: { id }
    });

    if (!existingSubadmin) {
      return res.status(404).json({
        success: false,
        error: 'Subadmin not found'
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (assignedBusinessCategories) updateData.assignedBusinessCategories = assignedBusinessCategories;
    if (status) updateData.status = status;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update subadmin
    const updatedSubadmin = await prisma.subadmin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        mobileNumber: true,
        role: true,
        permissions: true,
        status: true,
        assignedCategories: true,
        updatedAt: true
      }
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        userType: 'ADMIN',
        action: 'UPDATE',
        resource: 'SUBADMIN',
        resourceId: id,
        details: `Updated subadmin: ${updatedSubadmin.name}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: 'Subadmin updated successfully',
      subadmin: updatedSubadmin
    });

  } catch (error) {
    console.error('Update subadmin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subadmin'
    });
  }
});

// Delete subadmin
router.delete('/subadmins/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if subadmin exists
    const existingSubadmin = await prisma.subadmin.findUnique({
      where: { id },
      select: { id: true, name: true }
    });

    if (!existingSubadmin) {
      return res.status(404).json({
        success: false,
        error: 'Subadmin not found'
      });
    }

    // Delete subadmin
    await prisma.subadmin.delete({
      where: { id }
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        userType: 'ADMIN',
        action: 'DELETE',
        resource: 'SUBADMIN',
        resourceId: id,
        details: `Deleted subadmin: ${existingSubadmin.name}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: 'Subadmin deleted successfully'
    });

  } catch (error) {
    console.error('Delete subadmin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete subadmin'
    });
  }
});

// ============================================
// BUSINESS CATEGORY MANAGEMENT
// ============================================

// Get all business categories
router.get('/business-categories', async (req, res) => {
  try {
    const categories = await prisma.businessCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        admin: {
          select: { name: true }
        },
        _count: {
          select: {
            images: true,
            videos: true,
            customers: true
          }
        }
      }
    });

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get business categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business categories'
    });
  }
});

// Create business category
router.post('/business-categories', [
  body('name').isLength({ min: 2 }).withMessage('Category name must be at least 2 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
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

    const { name, description, icon } = req.body;

    // Check if category already exists
    const existingCategory = await prisma.businessCategory.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }

    // Create category
    const category = await prisma.businessCategory.create({
      data: {
        name,
        description,
        icon,
        createdBy: req.user!.id
      }
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        userType: 'ADMIN',
        action: 'CREATE',
        resource: 'BUSINESS_CATEGORY',
        resourceId: category.id,
        details: `Created business category: ${category.name}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Business category created successfully',
      category
    });

  } catch (error) {
    console.error('Create business category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create business category'
    });
  }
});

export default router;
