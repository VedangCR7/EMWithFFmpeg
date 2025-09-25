import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireStaff } from '../middleware/auth';
import { processImageWithFallback, getImageDimensionsWithFallback } from '../utils/imageProcessor';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all content routes
router.use(authenticateToken);
router.use(requireStaff);

// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const imagesDir = path.join(uploadDir, 'images');
const videosDir = path.join(uploadDir, 'videos');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');

// Create directories with error handling
const createDirectories = () => {
  try {
    [uploadDir, imagesDir, videosDir, thumbnailsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      } else {
        console.log(`✅ Directory exists: ${dir}`);
      }
    });
  } catch (error) {
    console.error('❌ Error creating directories:', error);
  }
};

// Create directories on startup
createDirectories();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Ensure directories exist before saving
      createDirectories();
      
      if (file.mimetype.startsWith('image/')) {
        cb(null, imagesDir);
      } else if (file.mimetype.startsWith('video/')) {
        cb(null, videosDir);
      } else {
        cb(new Error('Invalid file type'), '');
      }
    } catch (error) {
      console.error('❌ Multer destination error:', error);
      cb(error, '');
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    } catch (error) {
      console.error('❌ Multer filename error:', error);
      cb(error, '');
    }
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedImageTypes = (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,webp,gif').split(',');
  const allowedVideoTypes = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,mov,avi,mkv').split(',');
  
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (file.mimetype.startsWith('image/') && allowedImageTypes.includes(fileExtension)) {
    cb(null, true);
  } else if (file.mimetype.startsWith('video/') && allowedVideoTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '50000000') // 50MB default
  }
});

// ============================================
// IMAGE MANAGEMENT
// ============================================

// Get images with filtering
router.get('/images', async (req, res) => {
  try {
    const { category, businessCategory, status, uploaderType } = req.query;

    const where: any = {};
    if (category) where.category = category;
    if (businessCategory) where.businessCategoryId = businessCategory;
    if (status) where.approvalStatus = status;
    if (uploaderType) where.uploaderType = uploaderType;

    const images = await prisma.image.findMany({
      where,
      include: {
        businessCategory: {
          select: { name: true, icon: true }
        },
        adminUploader: {
          select: { name: true, email: true }
        },
        subadminUploader: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      images
    });

  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch images'
    });
  }
});

// Upload image
router.post('/images/upload', upload.single('image'), [
  body('title').isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
  body('category').isIn(['BUSINESS', 'FESTIVAL', 'GENERAL']).withMessage('Invalid category'),
], async (req: Request, res: Response) => {
  try {
    console.log('📤 Image upload request received');
    console.log('📁 File info:', req.file ? {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    } : 'No file');
    console.log('📝 Body data:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      });
    }

    const { title, description, category, businessCategoryId, tags } = req.body;

    // Initialize image data with basic information
    const imageData: any = {
      title,
      description,
      url: `/uploads/images/${req.file.filename}`,
      thumbnailUrl: null,
      category,
      businessCategoryId: category === 'BUSINESS' ? businessCategoryId || null : null,
      tags: tags ? JSON.stringify(tags.split(',').map((tag: string) => tag.trim())) : null,
      fileSize: req.file.size,
      dimensions: null,
      format: path.extname(req.file.filename).substring(1),
      uploaderType: req.user!.userType,
      approvalStatus: req.user!.userType === 'ADMIN' ? 'APPROVED' : 'PENDING'
    };

    // Process image with fallback (Sharp or simple processing)
    try {
      const processingResult = await processImageWithFallback(
        req.file.path,
        thumbnailsDir,
        req.file.filename
      );

      if (processingResult.success) {
        imageData.thumbnailUrl = processingResult.thumbnailUrl;
        imageData.dimensions = processingResult.dimensions;
        console.log('✅ Image processing completed successfully');
      } else {
        console.warn('⚠️ Image processing failed:', processingResult.error);
        // Continue without thumbnail and dimensions - upload will still work
      }
    } catch (processingError) {
      console.warn('⚠️ Image processing error:', processingError);
      // Continue without thumbnail and dimensions - upload will still work
    }

    // Set uploader based on user type
    if (req.user!.userType === 'ADMIN') {
      imageData.adminUploaderId = req.user!.id;
    } else {
      imageData.subadminUploaderId = req.user!.id;
    }

    const image = await prisma.image.create({
      data: imageData,
      include: {
        businessCategory: {
          select: { name: true }
        }
      }
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.userType === 'ADMIN' ? req.user!.id : undefined,
        subadminId: req.user!.userType === 'SUBADMIN' ? req.user!.id : undefined,
        userType: req.user!.userType,
        action: 'UPLOAD',
        resource: 'IMAGE',
        resourceId: image.id,
        details: `Uploaded image: ${image.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      image
    });

  } catch (error) {
    console.error('❌ Upload image error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      file: req.file ? req.file.filename : 'No file'
    });
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('✅ Cleaned up uploaded file');
      } catch (cleanupError) {
        console.error('❌ Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Simple image upload without processing (for testing)
router.post('/images/upload-simple', upload.single('image'), [
  body('title').isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
  body('category').isIn(['BUSINESS', 'FESTIVAL', 'GENERAL']).withMessage('Invalid category'),
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      });
    }

    const { title, description, category, businessCategoryId, tags } = req.body;

    // Create image record without processing
    const imageData: any = {
      title,
      description,
      url: `/uploads/images/${req.file.filename}`,
      thumbnailUrl: null, // No thumbnail for simple upload
      category,
      businessCategoryId: category === 'BUSINESS' ? businessCategoryId || null : null,
      tags: tags ? JSON.stringify(tags.split(',').map((tag: string) => tag.trim())) : null,
      fileSize: req.file.size,
      dimensions: null, // No dimensions for simple upload
      format: path.extname(req.file.filename).substring(1),
      uploaderType: req.user!.userType,
      approvalStatus: req.user!.userType === 'ADMIN' ? 'APPROVED' : 'PENDING'
    };

    // Set uploader based on user type
    if (req.user!.userType === 'ADMIN') {
      imageData.adminUploaderId = req.user!.id;
    } else {
      imageData.subadminUploaderId = req.user!.id;
    }

    const image = await prisma.image.create({
      data: imageData,
      include: {
        businessCategory: {
          select: { name: true }
        }
      }
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.userType === 'ADMIN' ? req.user!.id : undefined,
        subadminId: req.user!.userType === 'SUBADMIN' ? req.user!.id : undefined,
        userType: req.user!.userType,
        action: 'UPLOAD',
        resource: 'IMAGE',
        resourceId: image.id,
        details: `Uploaded image (simple): ${image.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully (simple mode)',
      image
    });

  } catch (error) {
    console.error('Simple upload image error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

// Approve/Reject content (Admin only)
router.put('/images/:id/approval', [
  body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Status must be APPROVED or REJECTED'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason too long'),
], async (req: Request, res: Response) => {
  try {
    if (req.user!.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can approve content'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    const image = await prisma.image.update({
      where: { id },
      data: {
        approvalStatus: status,
        approvedBy: req.user!.id,
        approvedAt: new Date()
      },
      include: {
        subadminUploader: {
          select: { name: true, email: true }
        }
      }
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        userType: 'ADMIN',
        action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
        resource: 'IMAGE',
        resourceId: id,
        details: `${status} image: ${image.title}${reason ? ` - ${reason}` : ''}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: `Image ${status.toLowerCase()} successfully`,
      image
    });

  } catch (error) {
    console.error('Approve image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update image approval status'
    });
  }
});

// ============================================
// VIDEO MANAGEMENT
// ============================================

// Get videos with filtering
router.get('/videos', async (req, res) => {
  try {
    const { category, businessCategory, status, uploaderType } = req.query;

    const where: any = {};
    if (category) where.category = category;
    if (businessCategory) where.businessCategoryId = businessCategory;
    if (status) where.approvalStatus = status;
    if (uploaderType) where.uploaderType = uploaderType;

    const videos = await prisma.video.findMany({
      where,
      include: {
        businessCategory: {
          select: { name: true, icon: true }
        },
        adminUploader: {
          select: { name: true, email: true }
        },
        subadminUploader: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      videos
    });

  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch videos'
    });
  }
});

// Upload video
router.post('/videos/upload', upload.single('video'), [
  body('title').isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
  body('category').isIn(['BUSINESS', 'FESTIVAL', 'GENERAL']).withMessage('Invalid category'),
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required'
      });
    }

    const { title, description, category, businessCategoryId, tags, duration } = req.body;

    // Create video record
    const videoData: any = {
      title,
      description,
      url: `/uploads/videos/${req.file.filename}`,
      category,
      businessCategoryId: category === 'BUSINESS' ? businessCategoryId || null : null,
      tags: tags ? JSON.stringify(tags.split(',').map((tag: string) => tag.trim())) : null,
      fileSize: req.file.size,
      format: path.extname(req.file.filename).substring(1),
      duration: duration ? parseInt(duration) : null,
      uploaderType: req.user!.userType,
      approvalStatus: req.user!.userType === 'ADMIN' ? 'APPROVED' : 'PENDING'
    };

    // Set uploader based on user type
    if (req.user!.userType === 'ADMIN') {
      videoData.adminUploaderId = req.user!.id;
    } else {
      videoData.subadminUploaderId = req.user!.id;
    }

    const video = await prisma.video.create({
      data: videoData,
      include: {
        businessCategory: {
          select: { name: true }
        }
      }
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.userType === 'ADMIN' ? req.user!.id : undefined,
        subadminId: req.user!.userType === 'SUBADMIN' ? req.user!.id : undefined,
        userType: req.user!.userType,
        action: 'UPLOAD',
        resource: 'VIDEO',
        resourceId: video.id,
        details: `Uploaded video: ${video.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video
    });

  } catch (error) {
    console.error('Upload video error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload video'
    });
  }
});

// Simple video upload without processing (for testing)
router.post('/videos/upload-simple', upload.single('video'), [
  body('title').isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
  body('category').isIn(['BUSINESS', 'FESTIVAL', 'GENERAL']).withMessage('Invalid category'),
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required'
      });
    }

    const { title, description, category, businessCategoryId, tags, duration } = req.body;

    // Create video record without processing
    const videoData: any = {
      title,
      description,
      url: `/uploads/videos/${req.file.filename}`,
      category,
      businessCategoryId: category === 'BUSINESS' ? businessCategoryId || null : null,
      tags: tags ? JSON.stringify(tags.split(',').map((tag: string) => tag.trim())) : null,
      fileSize: req.file.size,
      format: path.extname(req.file.filename).substring(1),
      duration: duration ? parseInt(duration) : null,
      uploaderType: req.user!.userType,
      approvalStatus: req.user!.userType === 'ADMIN' ? 'APPROVED' : 'PENDING'
    };

    // Set uploader based on user type
    if (req.user!.userType === 'ADMIN') {
      videoData.adminUploaderId = req.user!.id;
    } else {
      videoData.subadminUploaderId = req.user!.id;
    }

    const video = await prisma.video.create({
      data: videoData,
      include: {
        businessCategory: {
          select: { name: true }
        }
      }
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.userType === 'ADMIN' ? req.user!.id : undefined,
        subadminId: req.user!.userType === 'SUBADMIN' ? req.user!.id : undefined,
        userType: req.user!.userType,
        action: 'UPLOAD',
        resource: 'VIDEO',
        resourceId: video.id,
        details: `Uploaded video (simple): ${video.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully (simple mode)',
      video
    });

  } catch (error) {
    console.error('Simple upload video error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload video'
    });
  }
});

// Get pending approvals (Admin only)
router.get('/pending-approvals', async (req, res) => {
  try {
    if (req.user!.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const [pendingImages, pendingVideos] = await Promise.all([
      prisma.image.findMany({
        where: { approvalStatus: 'PENDING' },
        include: {
          businessCategory: { select: { name: true } },
          subadminUploader: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.video.findMany({
        where: { approvalStatus: 'PENDING' },
        include: {
          businessCategory: { select: { name: true } },
          subadminUploader: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    res.json({
      success: true,
      pendingContent: {
        images: pendingImages,
        videos: pendingVideos,
        total: pendingImages.length + pendingVideos.length
      }
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending approvals'
    });
  }
});

// Bulk approve/reject content
router.post('/bulk-approval', [
  body('contentIds').isArray().withMessage('Content IDs must be an array'),
  body('contentType').isIn(['IMAGE', 'VIDEO']).withMessage('Content type must be IMAGE or VIDEO'),
  body('action').isIn(['APPROVED', 'REJECTED']).withMessage('Action must be APPROVED or REJECTED'),
], async (req: Request, res: Response) => {
  try {
    if (req.user!.userType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { contentIds, contentType, action, reason } = req.body;

    let updatedCount = 0;

    if (contentType === 'IMAGE') {
      const result = await prisma.image.updateMany({
        where: { 
          id: { in: contentIds },
          approvalStatus: 'PENDING'
        },
        data: {
          approvalStatus: action,
          approvedBy: req.user!.id,
          approvedAt: new Date()
        }
      });
      updatedCount = result.count;
    } else {
      const result = await prisma.video.updateMany({
        where: { 
          id: { in: contentIds },
          approvalStatus: 'PENDING'
        },
        data: {
          approvalStatus: action,
          approvedBy: req.user!.id,
          approvedAt: new Date()
        }
      });
      updatedCount = result.count;
    }

    // Log bulk activity
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        userType: 'ADMIN',
        action: `BULK_${action}`,
        resource: contentType,
        details: `Bulk ${action.toLowerCase()} ${updatedCount} ${contentType.toLowerCase()}(s)${reason ? ` - ${reason}` : ''}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: `Successfully ${action.toLowerCase()} ${updatedCount} ${contentType.toLowerCase()}(s)`,
      updatedCount
    });

  } catch (error) {
    console.error('Bulk approval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk approval'
    });
  }
});

// Delete content
router.delete('/:contentType/:id', async (req, res) => {
  try {
    const { contentType, id } = req.params;

    if (!['images', 'videos'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid content type'
      });
    }

    let content: any = null;
    let filePath = '';

    if (contentType === 'images') {
      content = await prisma.image.findUnique({ where: { id } });
      if (content) {
        filePath = path.join(imagesDir, path.basename(content.url));
        await prisma.image.delete({ where: { id } });
      }
    } else {
      content = await prisma.video.findUnique({ where: { id } });
      if (content) {
        filePath = path.join(videosDir, path.basename(content.url));
        await prisma.video.delete({ where: { id } });
      }
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete thumbnail if exists
    if (content.thumbnailUrl) {
      const thumbnailPath = path.join(thumbnailsDir, path.basename(content.thumbnailUrl));
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    // Log activity
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.userType === 'ADMIN' ? req.user!.id : undefined,
        subadminId: req.user!.userType === 'SUBADMIN' ? req.user!.id : undefined,
        userType: req.user!.userType,
        action: 'DELETE',
        resource: contentType.toUpperCase().slice(0, -1), // Remove 's' from 'images'/'videos'
        resourceId: id,
        details: `Deleted ${contentType.slice(0, -1)}: ${content.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: `${contentType.slice(0, -1)} deleted successfully`
    });

  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content'
    });
  }
});

export default router;
