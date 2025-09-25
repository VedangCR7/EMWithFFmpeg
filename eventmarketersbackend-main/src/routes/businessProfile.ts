import express, { Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateCustomer } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all business profile routes
router.use(authenticateCustomer);

// ============================================
// BUSINESS PROFILE MANAGEMENT
// ============================================

// Multer configuration for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const logoDir = path.join(process.env.UPLOAD_DIR || 'uploads', 'logos');
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
    }
    cb(null, logoDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `logo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get business profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        businessPhone: true,
        businessEmail: true,
        businessWebsite: true,
        businessAddress: true,
        businessLogo: true,
        businessDescription: true,
        businessCategory: true,
        selectedBusinessCategoryId: true,
        selectedBusinessCategory: {
          select: { name: true, icon: true }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      profile: customer
    });

  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get business profile'
    });
  }
});

// Update business profile
router.put('/profile', [
  body('businessName').optional().isLength({ min: 2 }).withMessage('Business name must be at least 2 characters'),
  body('businessPhone').optional().isLength({ min: 10 }).withMessage('Valid business phone required'),
  body('businessEmail').optional().isEmail().withMessage('Valid business email required'),
  body('businessWebsite').optional().isURL().withMessage('Valid website URL required'),
  body('businessAddress').optional().isLength({ min: 5 }).withMessage('Business address must be at least 5 characters'),
  body('businessDescription').optional().isLength({ max: 500 }).withMessage('Description too long'),
  body('businessCategory').optional().isString(),
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

    const {
      businessName,
      businessPhone,
      businessEmail,
      businessWebsite,
      businessAddress,
      businessDescription,
      businessCategory
    } = req.body;

    const updatedCustomer = await prisma.customer.update({
      where: { id: req.user!.id },
      data: {
        ...(businessName && { businessName }),
        ...(businessPhone && { businessPhone }),
        ...(businessEmail && { businessEmail }),
        ...(businessWebsite && { businessWebsite }),
        ...(businessAddress && { businessAddress }),
        ...(businessDescription && { businessDescription }),
        ...(businessCategory && { businessCategory }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        businessName: true,
        businessPhone: true,
        businessEmail: true,
        businessWebsite: true,
        businessAddress: true,
        businessLogo: true,
        businessDescription: true,
        businessCategory: true
      }
    });

    // Log profile update
    await prisma.auditLog.create({
      data: {
        customerId: req.user!.id,
        userType: 'CUSTOMER',
        action: 'UPDATE',
        resource: 'BUSINESS_PROFILE',
        details: `Updated business profile for ${businessName || 'business'}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: 'Business profile updated successfully',
      profile: updatedCustomer
    });

  } catch (error) {
    console.error('Update business profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update business profile'
    });
  }
});

// Upload business logo
router.post('/upload-logo', upload.single('logo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Logo file is required'
      });
    }

    // Optimize and resize logo
    const optimizedPath = path.join(path.dirname(req.file.path), `optimized-${req.file.filename}`);
    
    await sharp(req.file.path)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toFile(optimizedPath);

    // Delete original file
    fs.unlinkSync(req.file.path);

    const logoUrl = `/uploads/logos/optimized-${req.file.filename}`;

    // Update customer with new logo
    const updatedCustomer = await prisma.customer.update({
      where: { id: req.user!.id },
      data: { businessLogo: logoUrl },
      select: {
        id: true,
        businessName: true,
        businessLogo: true
      }
    });

    // Log logo upload
    await prisma.auditLog.create({
      data: {
        customerId: req.user!.id,
        userType: 'CUSTOMER',
        action: 'UPLOAD',
        resource: 'BUSINESS_LOGO',
        details: `Uploaded business logo`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl,
      profile: updatedCustomer
    });

  } catch (error) {
    console.error('Upload logo error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload logo'
    });
  }
});

// Delete business logo
router.delete('/logo', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.user!.id },
      select: { businessLogo: true }
    });

    if (!customer?.businessLogo) {
      return res.status(404).json({
        success: false,
        error: 'No logo found'
      });
    }

    // Delete physical file
    const logoPath = path.join(process.env.UPLOAD_DIR || 'uploads', customer.businessLogo.replace('/uploads/', ''));
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }

    // Update customer to remove logo
    await prisma.customer.update({
      where: { id: req.user!.id },
      data: { businessLogo: null }
    });

    // Log logo deletion
    await prisma.auditLog.create({
      data: {
        customerId: req.user!.id,
        userType: 'CUSTOMER',
        action: 'DELETE',
        resource: 'BUSINESS_LOGO',
        details: `Deleted business logo`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: 'Logo deleted successfully'
    });

  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete logo'
    });
  }
});

// Generate business card preview (for frame integration)
router.post('/generate-preview', [
  body('frameId').notEmpty().withMessage('Frame ID is required'),
  body('templateId').notEmpty().withMessage('Template ID is required'),
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

    const { frameId, templateId } = req.body;

    // Get customer business profile
    const customer = await prisma.customer.findUnique({
      where: { id: req.user!.id },
      select: {
        businessName: true,
        businessPhone: true,
        businessEmail: true,
        businessWebsite: true,
        businessAddress: true,
        businessLogo: true,
        businessDescription: true
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Get template details
    const template = await prisma.image.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        title: true,
        url: true,
        thumbnailUrl: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Return preview data (actual image generation would be done on mobile app)
    res.json({
      success: true,
      preview: {
        frameId,
        template,
        businessData: {
          name: customer.businessName,
          phone: customer.businessPhone,
          email: customer.businessEmail,
          website: customer.businessWebsite,
          address: customer.businessAddress,
          logo: customer.businessLogo,
          description: customer.businessDescription
        },
        previewUrl: `${template.url}?frame=${frameId}&business=${req.user!.id}` // Mock preview URL
      }
    });

  } catch (error) {
    console.error('Generate preview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview'
    });
  }
});

export default router;


