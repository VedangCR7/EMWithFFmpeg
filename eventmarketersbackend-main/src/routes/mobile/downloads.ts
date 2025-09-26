import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/mobile/downloads/track
 * Track a download for analytics and user statistics
 */
router.post('/track', [
  body('mobileUserId').notEmpty().withMessage('Mobile User ID is required'),
  body('resourceId').notEmpty().withMessage('Resource ID is required'),
  body('resourceType').isIn(['TEMPLATE', 'VIDEO', 'GREETING', 'CONTENT']).withMessage('Resource type must be TEMPLATE, VIDEO, GREETING, or CONTENT'),
  body('fileUrl').optional().isString().withMessage('File URL must be a string'),
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

    const { mobileUserId, resourceId, resourceType, fileUrl } = req.body;

    console.log('📥 Download tracking request:', {
      mobileUserId,
      resourceId,
      resourceType,
      fileUrl
    });

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

    // Check if download already exists (to avoid duplicates)
    const existingDownload = await prisma.mobileDownload.findFirst({
      where: {
        mobileUserId: mobileUserId,
        resourceId: resourceId,
        resourceType: resourceType
      }
    });

    if (existingDownload) {
      console.log('📋 Download already tracked, returning existing record');
      return res.json({
        success: true,
        message: 'Download already tracked',
        data: {
          download: existingDownload,
          isNew: false
        }
      });
    }

    // Create new download record
    const download = await prisma.mobileDownload.create({
      data: {
        mobileUserId: mobileUserId,
        resourceId: resourceId,
        resourceType: resourceType,
        fileUrl: fileUrl || `/${resourceType.toLowerCase()}/${resourceId}`
      }
    });

    console.log('✅ Download tracked successfully:', download.id);

    res.json({
      success: true,
      message: 'Download tracked successfully',
      data: {
        download,
        isNew: true
      }
    });

  } catch (error) {
    console.error('❌ Download tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track download'
    });
  }
});

/**
 * GET /api/mobile/downloads/user/:userId
 * Get download statistics for a user
 */
router.get('/user/:mobileUserId', async (req: Request, res: Response) => {
  try {
    const { mobileUserId } = req.params;
    const { page = '1', limit = '20', type } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Build where clause
    let whereClause: any = { mobileUserId: mobileUserId };
    if (type) {
      whereClause.resourceType = (type as string).toUpperCase();
    }

    // Get downloads and total count
    const [downloads, total] = await Promise.all([
      prisma.mobileDownload.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.mobileDownload.count({ where: whereClause })
    ]);

    // Get download statistics by type
    const [templateCount, videoCount, greetingCount, contentCount] = await Promise.all([
      prisma.mobileDownload.count({
        where: { mobileUserId: mobileUserId, resourceType: 'TEMPLATE' }
      }),
      prisma.mobileDownload.count({
        where: { mobileUserId: mobileUserId, resourceType: 'VIDEO' }
      }),
      prisma.mobileDownload.count({
        where: { mobileUserId: mobileUserId, resourceType: 'GREETING' }
      }),
      prisma.mobileDownload.count({
        where: { mobileUserId: mobileUserId, resourceType: 'CONTENT' }
      })
    ]);

    res.json({
      success: true,
      message: 'Download statistics fetched successfully',
      data: {
        downloads,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        },
        statistics: {
          total,
          byType: {
            template: templateCount,
            video: videoCount,
            greeting: greetingCount,
            content: contentCount
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Get download statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch download statistics'
    });
  }
});

export default router;
