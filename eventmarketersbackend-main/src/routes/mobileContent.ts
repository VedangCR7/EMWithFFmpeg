import { Request, Response } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { query, validationResult } from 'express-validator';
import { authenticateCustomer } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get Templates for Mobile App (Public - for browsing by installed users)
router.get('/browse-templates', [
  query('category').optional().isIn(['free', 'premium', 'festival', 'general', 'business']),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const where: any = {
      approvalStatus: 'APPROVED'
    };

    // Filter by category
    if (category === 'premium' || category === 'business') {
      where.category = 'BUSINESS';
    } else if (category === 'free') {
      where.OR = [
        { category: 'FESTIVAL' },
        { category: 'GENERAL' }
      ];
    } else if (category === 'festival') {
      where.category = 'FESTIVAL';
    } else if (category === 'general') {
      where.category = 'GENERAL';
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } }
      ];
    }

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          url: true,
          thumbnailUrl: true,
          category: true,
          downloads: true,
          views: true,
          tags: true,
          createdAt: true,
          businessCategory: {
            select: {
              name: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.image.count({ where })
    ]);

    const templates = images.map(image => ({
      id: image.id,
      title: image.title,
      description: image.description,
      imageUrl: image.url,
      thumbnailUrl: image.thumbnailUrl,
      category: image.category === 'BUSINESS' ? 'premium' : 'free',
      businessCategory: image.businessCategory?.name,
      downloads: image.downloads,
      views: image.views,
      likes: 0,
      isLiked: false,
      canDownload: false, // Installed users cannot download
      requiresSubscription: image.category === 'BUSINESS',
      tags: image.tags ? JSON.parse(image.tags) : [],
      createdAt: image.createdAt
    }));

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Browse templates error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch templates'
      }
    });
  }
});

// Get Templates for Mobile App (Authenticated - for customers)
router.get('/templates', [
  query('category').optional().isIn(['free', 'premium']),
  query('language').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category as string;
    const language = req.query.language as string;
    const search = req.query.search as string;

    const where: any = {
      approvalStatus: 'APPROVED'
    };

    if (category === 'premium') {
      // Premium templates require active subscription
      where.category = 'BUSINESS';
    } else if (category === 'free') {
      where.OR = [
        { category: 'FESTIVAL' },
        { category: 'GENERAL' }
      ];
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } }
      ];
    }

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          url: true,
          thumbnailUrl: true,
          category: true,
          downloads: true,
          views: true,
          tags: true,
          createdAt: true,
          businessCategory: {
            select: {
              name: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.image.count({ where })
    ]);

    const templates = images.map(image => ({
      id: image.id,
      title: image.title,
      description: image.description,
      imageUrl: image.url,
      thumbnailUrl: image.thumbnailUrl,
      category: image.category === 'BUSINESS' ? 'premium' : 'free',
      language: language || 'english',
      businessCategory: image.businessCategory?.name,
      downloads: image.downloads,
      likes: 0, // TODO: Implement likes system
      isLiked: false, // TODO: Check user likes
      isDownloaded: false, // TODO: Check user downloads
      tags: image.tags ? JSON.parse(image.tags) : [],
      createdAt: image.createdAt
    }));

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch templates'
      }
    });
  }
});

// Get Template Details
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        businessCategory: {
          select: {
            name: true,
            description: true
          }
        },
        adminUploader: {
          select: {
            name: true
          }
        },
        subadminUploader: {
          select: {
            name: true
          }
        }
      }
    });

    if (!image || image.approvalStatus !== 'APPROVED') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found'
        }
      });
    }

    // Increment views
    await prisma.image.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    res.json({
      success: true,
      data: {
        template: {
          id: image.id,
          title: image.title,
          description: image.description,
          imageUrl: image.url,
          thumbnailUrl: image.thumbnailUrl,
          category: image.category === 'BUSINESS' ? 'premium' : 'free',
          businessCategory: image.businessCategory?.name,
          downloads: image.downloads,
          views: image.views + 1,
          likes: 0, // TODO: Implement likes
          isLiked: false, // TODO: Check user likes
          isDownloaded: false, // TODO: Check user downloads
          tags: image.tags ? JSON.parse(image.tags) : [],
          fileSize: image.fileSize,
          uploader: image.adminUploader?.name || image.subadminUploader?.name,
          createdAt: image.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get template details error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch template details'
      }
    });
  }
});

// Download Template with Frame and Business Data
router.post('/templates/:id/download', authenticateCustomer, [
  query('frameId').optional().isString(),
  query('applyBusinessData').optional().isBoolean(),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerId = req.user!.id;
    const frameId = req.query.frameId as string;
    const applyBusinessData = req.query.applyBusinessData === 'true';

    const image = await prisma.image.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        url: true,
        category: true,
        approvalStatus: true,
        downloads: true
      }
    });

    if (!image || image.approvalStatus !== 'APPROVED') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found'
        }
      });
    }

    // Get customer with business profile
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        businessPhone: true,
        businessEmail: true,
        businessWebsite: true,
        businessAddress: true,
        businessLogo: true,
        businessDescription: true,
        subscriptions: {
          where: { 
            status: 'ACTIVE',
            endDate: { gte: new Date() }
          }
        },
        selectedBusinessCategory: {
          select: { name: true, icon: true }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        }
      });
    }

    // Check subscription for premium content
    if (image.category === 'BUSINESS' && !customer.subscriptions.length) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'Premium subscription required to download this template'
        }
      });
    }

    // Prepare business data for frame application
    const businessData = applyBusinessData ? {
      businessName: customer.businessName,
      businessPhone: customer.businessPhone,
      businessEmail: customer.businessEmail,
      businessWebsite: customer.businessWebsite,
      businessAddress: customer.businessAddress,
      businessLogo: customer.businessLogo,
      businessDescription: customer.businessDescription,
      businessCategory: customer.selectedBusinessCategory?.name
    } : null;

    // Update download count and customer stats
    await Promise.all([
      prisma.image.update({
        where: { id },
        data: { downloads: { increment: 1 } }
      }),
      prisma.customer.update({
        where: { id: customerId },
        data: { 
          totalDownloads: { increment: 1 },
          lastActiveAt: new Date()
        }
      }),
      // Log download activity
      prisma.auditLog.create({
        data: {
          customerId: customerId,
          userType: 'CUSTOMER',
          action: 'DOWNLOAD',
          resource: 'TEMPLATE',
          resourceId: id,
          details: `Downloaded template: ${image.title}${frameId ? ` with frame: ${frameId}` : ''}${applyBusinessData ? ' with business data' : ''}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || 'Unknown'
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Template downloaded successfully',
      data: {
        template: {
          id: image.id,
          title: image.title,
          url: image.url
        },
        frameId: frameId || null,
        businessData: businessData,
        downloadUrl: image.url,
        filename: `${customer.businessName || 'business'}_${image.title}.jpg`,
        // Instructions for mobile app to apply frame and business data
        processingInstructions: {
          applyFrame: !!frameId,
          applyBusinessData: !!businessData,
          frameId: frameId,
          businessInfo: businessData
        }
      }
    });

  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to download template'
      }
    });
  }
});

// Get Business Categories for Mobile
router.get('/business-categories', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Testing database connection...');
    
    // First, test basic connection
    const count = await prisma.businessCategory.count();
    console.log('📊 Business categories count:', count);
    
    // Then try the full query
    const categories = await prisma.businessCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true
      },
      orderBy: { name: 'asc' }
    });

    console.log('📋 Found categories:', categories.length);

    res.json({
      success: true,
      data: {
        categories: categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          contentCount: 0 // Simplified for now
        }))
      }
    });

  } catch (error) {
    console.error('❌ Get business categories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch business categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Get Videos for Mobile App
router.get('/videos', [
  query('category').optional().isIn(['free', 'premium']),
  query('businessCategory').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category as string;
    const businessCategory = req.query.businessCategory as string;
    const search = req.query.search as string;

    const where: any = {
      approvalStatus: 'APPROVED'
    };

    if (category === 'premium') {
      where.category = 'BUSINESS';
    } else if (category === 'free') {
      where.OR = [
        { category: 'FESTIVAL' },
        { category: 'GENERAL' }
      ];
    }

    if (businessCategory) {
      where.businessCategoryId = businessCategory;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } }
      ];
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          url: true,
          thumbnailUrl: true,
          category: true,
          duration: true,
          downloads: true,
          views: true,
          tags: true,
          fileSize: true,
          createdAt: true,
          businessCategory: {
            select: {
              name: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.video.count({ where })
    ]);

    const videoList = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      videoUrl: video.url,
      thumbnailUrl: video.thumbnailUrl,
      category: video.category === 'BUSINESS' ? 'premium' : 'free',
      businessCategory: video.businessCategory?.name,
      duration: video.duration,
      downloads: video.downloads,
      views: video.views,
      likes: 0, // TODO: Implement likes system
      isLiked: false, // TODO: Check user likes
      isDownloaded: false, // TODO: Check user downloads
      tags: video.tags ? JSON.parse(video.tags) : [],
      fileSize: video.fileSize,
      createdAt: video.createdAt
    }));

    res.json({
      success: true,
      data: {
        videos: videoList,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch videos'
      }
    });
  }
});

export default router;
