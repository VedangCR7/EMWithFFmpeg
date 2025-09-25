import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/mobile/home/featured
 * Get featured content for home screen
 */
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const { limit = '10', type, active = 'true' } = req.query;
    
    const where: any = {};
    if (type) where.type = type;
    if (active === 'true') where.isActive = true;

    const featuredContent = await prisma.featuredContent.findMany({
      where,
      orderBy: { priority: 'asc' },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      message: 'Featured content fetched successfully',
      data: featuredContent
    });

  } catch (error) {
    console.error('Get featured content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured content'
    });
  }
});

/**
 * GET /api/mobile/home/upcoming-events
 * Get upcoming events
 */
router.get('/upcoming-events', async (req: Request, res: Response) => {
  try {
    const { limit = '20', category, location } = req.query;
    
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (location) where.location = { contains: location as string };

    const events = await prisma.upcomingEvent.findMany({
      where,
      orderBy: { date: 'asc' },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      message: 'Upcoming events fetched successfully',
      data: events
    });

  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming events'
    });
  }
});

/**
 * GET /api/mobile/home/templates
 * Get professional templates for home screen
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { limit = '20', category, sortBy = 'createdAt' } = req.query;
    
    const where: any = { isActive: true };
    if (category) where.category = category;

    const orderBy: any = {};
    if (sortBy === 'popular') orderBy.downloads = 'desc';
    else if (sortBy === 'likes') orderBy.likes = 'desc';
    else orderBy.createdAt = 'desc';

    const templates = await prisma.mobileTemplate.findMany({
      where,
      orderBy,
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      message: 'Templates fetched successfully',
      data: templates
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

/**
 * GET /api/mobile/home/video-content
 * Get video content for home screen
 */
router.get('/video-content', async (req: Request, res: Response) => {
  try {
    const { limit = '20', category, duration } = req.query;
    
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (duration === 'short') where.duration = { lte: 60 };
    else if (duration === 'medium') where.duration = { gte: 61, lte: 300 };
    else if (duration === 'long') where.duration = { gte: 301 };

    const videos = await prisma.mobileVideo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      message: 'Video content fetched successfully',
      data: videos
    });

  } catch (error) {
    console.error('Get video content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch video content'
    });
  }
});

/**
 * GET /api/mobile/home/search
 * Search all content
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, type, limit = '20' } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchQuery = q as string;
    const results: any = {};

    // Search templates
    if (!type || type === 'templates') {
      results.templates = await prisma.mobileTemplate.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: searchQuery } },
            { description: { contains: searchQuery } },
            { tags: { contains: searchQuery } }
          ]
        },
        take: parseInt(limit as string)
      });
    }

    // Search videos
    if (!type || type === 'videos') {
      results.videos = await prisma.mobileVideo.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: searchQuery } },
            { description: { contains: searchQuery } },
            { tags: { contains: searchQuery } }
          ]
        },
        take: parseInt(limit as string)
      });
    }

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform search'
    });
  }
});

/**
 * POST /api/mobile/home/templates/:id/like
 * Like a template
 */
router.post('/templates/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    // Verify token and get user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

    // Check if template exists
    const template = await prisma.mobileTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Check if user already liked this template
    const existingLike = await prisma.templateLike.findFirst({
      where: {
        templateId: id,
        mobileUserId: userId
      }
    });

    if (existingLike) {
      return res.status(409).json({
        success: false,
        error: 'Template already liked'
      });
    }

    // Create like record
    await prisma.templateLike.create({
      data: {
        templateId: id,
        mobileUserId: userId
      }
    });

    // Update template like count
    await prisma.mobileTemplate.update({
      where: { id },
      data: { likes: { increment: 1 } }
    });

    res.json({
      success: true,
      message: 'Template liked successfully'
    });

  } catch (error) {
    console.error('Like template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like template'
    });
  }
});

/**
 * DELETE /api/mobile/home/templates/:id/like
 * Unlike a template
 */
router.delete('/templates/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    // Verify token and get user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

    // Check if template exists
    const template = await prisma.mobileTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Check if user liked this template
    const existingLike = await prisma.templateLike.findFirst({
      where: {
        templateId: id,
        mobileUserId: userId
      }
    });

    if (!existingLike) {
      return res.status(404).json({
        success: false,
        error: 'Template not liked by user'
      });
    }

    // Remove like record
    await prisma.templateLike.delete({
      where: { id: existingLike.id }
    });

    // Update template like count
    await prisma.mobileTemplate.update({
      where: { id },
      data: { likes: { decrement: 1 } }
    });

    res.json({
      success: true,
      message: 'Template unliked successfully'
    });

  } catch (error) {
    console.error('Unlike template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlike template'
    });
  }
});

/**
 * POST /api/mobile/home/videos/:id/like
 * Like a video
 */
router.post('/videos/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    // Verify token and get user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

    // Check if video exists
    const video = await prisma.mobileVideo.findUnique({
      where: { id }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Check if user already liked this video
    const existingLike = await prisma.videoLike.findFirst({
      where: {
        videoId: id,
        mobileUserId: userId
      }
    });

    if (existingLike) {
      return res.status(409).json({
        success: false,
        error: 'Video already liked'
      });
    }

    // Create like record
    await prisma.videoLike.create({
      data: {
        videoId: id,
        mobileUserId: userId
      }
    });

    // Update video like count
    await prisma.mobileVideo.update({
      where: { id },
      data: { likes: { increment: 1 } }
    });

    res.json({
      success: true,
      message: 'Video liked successfully'
    });

  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like video'
    });
  }
});

/**
 * DELETE /api/mobile/home/videos/:id/like
 * Unlike a video
 */
router.delete('/videos/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    // Verify token and get user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

    // Check if video exists
    const video = await prisma.mobileVideo.findUnique({
      where: { id }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Check if user liked this video
    const existingLike = await prisma.videoLike.findFirst({
      where: {
        videoId: id,
        mobileUserId: userId
      }
    });

    if (!existingLike) {
      return res.status(404).json({
        success: false,
        error: 'Video not liked by user'
      });
    }

    // Remove like record
    await prisma.videoLike.delete({
      where: { id: existingLike.id }
    });

    // Update video like count
    await prisma.mobileVideo.update({
      where: { id },
      data: { likes: { decrement: 1 } }
    });

    res.json({
      success: true,
      message: 'Video unliked successfully'
    });

  } catch (error) {
    console.error('Unlike video error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlike video'
    });
  }
});

/**
 * POST /api/mobile/home/templates/:id/download
 * Download a template
 */
router.post('/templates/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    // Verify token and get user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

    // Check if template exists
    const template = await prisma.mobileTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Check if user already downloaded this template
    const existingDownload = await prisma.templateDownload.findFirst({
      where: {
        templateId: id,
        mobileUserId: userId
      }
    });

    if (existingDownload) {
      return res.status(409).json({
        success: false,
        error: 'Template already downloaded'
      });
    }

    // Create download record
    await prisma.templateDownload.create({
      data: {
        templateId: id,
        mobileUserId: userId
      }
    });

    // Update template download count
    await prisma.mobileTemplate.update({
      where: { id },
      data: { downloads: { increment: 1 } }
    });

    // Also record in unified MobileDownload table
    await prisma.mobileDownload.create({
      data: {
        mobileUserId: userId,
        resourceType: 'TEMPLATE',
        resourceId: id,
        fileUrl: template.fileUrl || template.imageUrl
      }
    });

    res.json({
      success: true,
      message: 'Template downloaded successfully',
      data: {
        downloadUrl: template.fileUrl || template.imageUrl // Return file URL for download
      }
    });

  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download template'
    });
  }
});

/**
 * POST /api/mobile/home/videos/:id/download
 * Download a video
 */
router.post('/videos/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    // Verify token and get user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

    // Check if video exists
    const video = await prisma.mobileVideo.findUnique({
      where: { id }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Check if user already downloaded this video
    const existingDownload = await prisma.videoDownload.findFirst({
      where: {
        videoId: id,
        mobileUserId: userId
      }
    });

    if (existingDownload) {
      return res.status(409).json({
        success: false,
        error: 'Video already downloaded'
      });
    }

    // Create download record
    await prisma.videoDownload.create({
      data: {
        videoId: id,
        mobileUserId: userId
      }
    });

    // Update video download count
    await prisma.mobileVideo.update({
      where: { id },
      data: { downloads: { increment: 1 } }
    });

    // Also record in unified MobileDownload table
    await prisma.mobileDownload.create({
      data: {
        mobileUserId: userId,
        resourceType: 'VIDEO',
        resourceId: id,
        fileUrl: video.videoUrl
      }
    });

    res.json({
      success: true,
      message: 'Video downloaded successfully',
      data: {
        downloadUrl: video.videoUrl // Return video URL for download
      }
    });

  } catch (error) {
    console.error('Download video error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download video'
    });
  }
});

export default router;