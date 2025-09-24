import express, { Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireStaff } from '../middleware/auth';

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

[uploadDir, imagesDir, videosDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, imagesDir);
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, videosDir);
    } else {
      cb(new Error('Invalid file type'), '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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
// Upload image (simplified endpoint for frontend compatibility)
router.post('/images', upload.single('image'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').notEmpty().withMessage('Category is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
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
        error: 'No image file provided'
      });
    }

    const { title, description, category, tags } = req.body;

    // Create image record
    const image = await prisma.image.create({
      data: {
        title,
        description: description || '',
        category,
        tags: tags ? JSON.stringify(JSON.parse(tags)) : JSON.stringify([]),
        url: req.file.path,
        thumbnailUrl: req.file.path, // Using same path for thumbnail
        fileSize: req.file.size,
        format: req.file.mimetype,
        adminUploaderId: req.user!.id,
        uploaderType: 'ADMIN',
        approvalStatus: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      image: {
        id: image.id,
        title: image.title,
        description: image.description,
        url: image.url,
        thumbnailUrl: image.thumbnailUrl,
        category: image.category,
        tags: image.tags,
        fileSize: image.fileSize,
        format: image.format,
        approvalStatus: image.approvalStatus,
        createdAt: image.createdAt
      }
    });

  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

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

    // Generate thumbnail for image
    const thumbnailFilename = 'thumb_' + req.file.filename;
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
    
    await sharp(req.file.path)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Get image dimensions
    const metadata = await sharp(req.file.path).metadata();
    const dimensions = `${metadata.width}x${metadata.height}`;

    // Create image record
    const imageData: any = {
      title,
      description,
      url: `/uploads/images/${req.file.filename}`,
      thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
      category,
      businessCategoryId: category === 'BUSINESS' ? businessCategoryId : null,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      fileSize: req.file.size,
      dimensions,
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
    console.error('Upload image error:', error);
    
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
// Upload video (simplified endpoint for frontend compatibility)
router.post('/videos', upload.single('video'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').notEmpty().withMessage('Category is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
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
        error: 'No video file provided'
      });
    }

    const { title, description, category, tags } = req.body;

    // Create video record
    const video = await prisma.video.create({
      data: {
        title,
        description: description || '',
        category,
        tags: tags ? JSON.stringify(JSON.parse(tags)) : JSON.stringify([]),
        url: req.file.path,
        thumbnailUrl: req.file.path, // Using same path for thumbnail
        fileSize: req.file.size,
        format: req.file.mimetype,
        adminUploaderId: req.user!.id,
        uploaderType: 'ADMIN',
        approvalStatus: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        url: video.url,
        thumbnailUrl: video.thumbnailUrl,
        category: video.category,
        tags: video.tags,
        fileSize: video.fileSize,
        format: video.format,
        approvalStatus: video.approvalStatus,
        createdAt: video.createdAt
      }
    });

  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload video'
    });
  }
});

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
      businessCategoryId: category === 'BUSINESS' ? businessCategoryId : null,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
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
