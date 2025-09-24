import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all home routes
router.use(authenticateToken);

// ============================================
// HOME SCREEN API ENDPOINTS
// ============================================

// ============================================
// 1. FEATURED CONTENT
// ============================================
// GET /api/home/featured
// Returns featured banners, promotions, and highlights for home screen
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const { limit = 10, type = 'all', active = 'true' } = req.query;

    const where: any = {
      isActive: active === 'true'
    };

    if (type !== 'all') {
      where.type = type;
    }

    const featuredContent = await prisma.featuredContent.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit as string),
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        videoUrl: true,
        link: true,
        type: true,
        priority: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: featuredContent,
      message: 'Featured content retrieved successfully',
      pagination: {
        page: 1,
        limit: parseInt(limit as string),
        total: featuredContent.length,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Get featured content error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to retrieve featured content'
    });
  }
});

// ============================================
// 2. UPCOMING EVENTS
// ============================================
// GET /api/home/upcoming-events
// Returns upcoming events for home screen
router.get('/upcoming-events', async (req: Request, res: Response) => {
  try {
    const { 
      limit = 20, 
      category, 
      location, 
      dateFrom, 
      dateTo, 
      isFree 
    } = req.query;

    const where: any = {
      date: {
        gte: new Date() // Only future events
      }
    };

    if (category) {
      where.category = category;
    }

    if (location) {
      where.location = {
        contains: location as string,
        mode: 'insensitive'
      };
    }

    if (dateFrom) {
      where.date.gte = new Date(dateFrom as string);
    }

    if (dateTo) {
      where.date.lte = new Date(dateTo as string);
    }

    if (isFree !== undefined) {
      where.isFree = isFree === 'true';
    }

    const upcomingEvents = await prisma.event.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ],
      take: parseInt(limit as string),
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        time: true,
        location: true,
        organizer: true,
        organizerId: true,
        imageUrl: true,
        category: true,
        price: true,
        isFree: true,
        attendees: true,
        maxAttendees: true,
        tags: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: upcomingEvents,
      message: 'Upcoming events retrieved successfully',
      pagination: {
        page: 1,
        limit: parseInt(limit as string),
        total: upcomingEvents.length,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to retrieve upcoming events'
    });
  }
});

// ============================================
// 3. PROFESSIONAL TEMPLATES
// ============================================
// GET /api/home/templates
// Returns professional templates for home screen
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { 
      limit = 20, 
      category, 
      subcategory, 
      isPremium, 
      sortBy = 'popular',
      tags 
    } = req.query;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (subcategory) {
      where.subcategory = subcategory;
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium === 'true';
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = {
        hasSome: tagArray
      };
    }

    let orderBy: any = {};
    switch (sortBy) {
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'likes':
        orderBy = { likes: 'desc' };
        break;
      case 'downloads':
        orderBy = { downloads: 'desc' };
        break;
      case 'popular':
      default:
        orderBy = [
          { views: 'desc' },
          { likes: 'desc' },
          { downloads: 'desc' }
        ];
        break;
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy,
      take: parseInt(limit as string),
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        previewUrl: true,
        category: true,
        subcategory: true,
        downloads: true,
        views: true,
        tags: true,
        fileSize: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Add user-specific data (isLiked, isDownloaded)
    const userId = req.user?.id;
    const templatesWithUserData = await Promise.all(
      templates.map(async (template) => {
        const isLiked = userId ? await prisma.templateLike.findFirst({
          where: { templateId: template.id, userId }
        }) : false;

        const isDownloaded = userId ? await prisma.templateDownload.findFirst({
          where: { templateId: template.id, userId }
        }) : false;

        return {
          ...template,
          isLiked: !!isLiked,
          isDownloaded: !!isDownloaded
        };
      })
    );

    res.json({
      success: true,
      data: templatesWithUserData,
      message: 'Professional templates retrieved successfully',
      pagination: {
        page: 1,
        limit: parseInt(limit as string),
        total: templatesWithUserData.length,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Get professional templates error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to retrieve professional templates'
    });
  }
});

// ============================================
// 4. VIDEO CONTENT
// ============================================
// GET /api/home/video-content
// Returns video templates and content for home screen
router.get('/video-content', async (req: Request, res: Response) => {
  try {
    const { 
      limit = 20, 
      category, 
      language, 
      isPremium, 
      sortBy = 'popular',
      duration,
      tags 
    } = req.query;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (language) {
      where.language = language;
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium === 'true';
    }

    if (duration) {
      const durationMap = {
        'short': { lt: 60 }, // Less than 1 minute
        'medium': { gte: 60, lt: 300 }, // 1-5 minutes
        'long': { gte: 300 } // 5+ minutes
      };
      where.duration = durationMap[duration as keyof typeof durationMap];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = {
        hasSome: tagArray
      };
    }

    let orderBy: any = {};
    switch (sortBy) {
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'likes':
        orderBy = { likes: 'desc' };
        break;
      case 'views':
        orderBy = { views: 'desc' };
        break;
      case 'downloads':
        orderBy = { downloads: 'desc' };
        break;
      case 'popular':
      default:
        orderBy = [
          { views: 'desc' },
          { likes: 'desc' },
          { downloads: 'desc' }
        ];
        break;
    }

    const videos = await prisma.video.findMany({
      where,
      orderBy,
      take: parseInt(limit as string),
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        duration: true,
        category: true,
        views: true,
        downloads: true,
        tags: true,
        fileSize: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Add user-specific data (isLiked, isDownloaded)
    const userId = req.user?.id;
    const videosWithUserData = await Promise.all(
      videos.map(async (video) => {
        const isLiked = userId ? await prisma.videoLike.findFirst({
          where: { videoId: video.id, userId }
        }) : false;

        const isDownloaded = userId ? await prisma.videoDownload.findFirst({
          where: { videoId: video.id, userId }
        }) : false;

        return {
          ...video,
          isLiked: !!isLiked,
          isDownloaded: !!isDownloaded
        };
      })
    );

    res.json({
      success: true,
      data: videosWithUserData,
      message: 'Video content retrieved successfully',
      pagination: {
        page: 1,
        limit: parseInt(limit as string),
        total: videosWithUserData.length,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Get video content error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to retrieve video content'
    });
  }
});

// ============================================
// 5. SEARCH CONTENT
// ============================================
// GET /api/home/search
// Search across templates, videos, and events
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q: query, type = 'all', limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchResults = {
      templates: [],
      videos: [],
      events: []
    };

    const searchLimit = Math.ceil(parseInt(limit as string) / 3); // Divide limit among content types

    // Search templates
    if (type === 'all' || type === 'templates') {
      const templates = await prisma.template.findMany({
        where: {
          OR: [
            { name: { contains: query as string, mode: 'insensitive' } },
            { description: { contains: query as string, mode: 'insensitive' } },
            { tags: { hasSome: [query as string] } }
          ]
        },
        take: searchLimit,
        select: {
          id: true,
          name: true,
          description: true,
          thumbnail: true,
          category: true,
          downloads: true,
          views: true,
          tags: true,
          createdAt: true
        }
      });
      searchResults.templates = templates;
    }

    // Search videos
    if (type === 'all' || type === 'videos') {
      const videos = await prisma.video.findMany({
        where: {
          OR: [
            { title: { contains: query as string, mode: 'insensitive' } },
            { description: { contains: query as string, mode: 'insensitive' } },
            { tags: { contains: query as string, mode: 'insensitive' } }
          ]
        },
        take: searchLimit,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          duration: true,
          views: true,
          downloads: true,
          tags: true,
          createdAt: true
        }
      });
      searchResults.videos = videos;
    }

    // Search events
    if (type === 'all' || type === 'events') {
      const events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query as string, mode: 'insensitive' } },
            { description: { contains: query as string, mode: 'insensitive' } },
            { location: { contains: query as string, mode: 'insensitive' } },
            { tags: { hasSome: [query as string] } }
          ]
        },
        take: searchLimit,
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          time: true,
          location: true,
          category: true,
          price: true,
          isFree: true,
          attendees: true,
          tags: true,
          createdAt: true
        }
      });
      searchResults.events = events;
    }

    res.json({
      success: true,
      data: searchResults,
      message: 'Search completed successfully',
      pagination: {
        page: 1,
        limit: parseInt(limit as string),
        total: searchResults.templates.length + searchResults.videos.length + searchResults.events.length,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Search content error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// ============================================
// 6. LIKE/UNLIKE TEMPLATES
// ============================================
router.post('/templates/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if already liked
    const existingLike = await prisma.templateLike.findFirst({
      where: { templateId: id, userId }
    });

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'Template already liked'
      });
    }

    // Create like
    await prisma.templateLike.create({
      data: { templateId: id, userId }
    });

    // Update template likes count
    await prisma.template.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    res.json({
      success: true,
      message: 'Template liked successfully'
    });

  } catch (error) {
    console.error('Like template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like template'
    });
  }
});

router.delete('/templates/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Remove like
    const deletedLike = await prisma.templateLike.deleteMany({
      where: { templateId: id, userId }
    });

    if (deletedLike.count === 0) {
      return res.status(400).json({
        success: false,
        message: 'Template not liked'
      });
    }

    // Update template likes count
    await prisma.template.update({
      where: { id },
      data: { views: { decrement: 1 } }
    });

    res.json({
      success: true,
      message: 'Template unliked successfully'
    });

  } catch (error) {
    console.error('Unlike template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike template'
    });
  }
});

// ============================================
// 7. LIKE/UNLIKE VIDEOS
// ============================================
router.post('/videos/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if already liked
    const existingLike = await prisma.videoLike.findFirst({
      where: { videoId: id, userId }
    });

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'Video already liked'
      });
    }

    // Create like
    await prisma.videoLike.create({
      data: { videoId: id, userId }
    });

    // Update video likes count
    await prisma.video.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    res.json({
      success: true,
      message: 'Video liked successfully'
    });

  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like video'
    });
  }
});

router.delete('/videos/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Remove like
    const deletedLike = await prisma.videoLike.deleteMany({
      where: { videoId: id, userId }
    });

    if (deletedLike.count === 0) {
      return res.status(400).json({
        success: false,
        message: 'Video not liked'
      });
    }

    // Update video likes count
    await prisma.video.update({
      where: { id },
      data: { views: { decrement: 1 } }
    });

    res.json({
      success: true,
      message: 'Video unliked successfully'
    });

  } catch (error) {
    console.error('Unlike video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike video'
    });
  }
});

// ============================================
// 8. DOWNLOAD TEMPLATES
// ============================================
router.post('/templates/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if already downloaded
    const existingDownload = await prisma.templateDownload.findFirst({
      where: { templateId: id, userId }
    });

    if (existingDownload) {
      return res.status(400).json({
        success: false,
        message: 'Template already downloaded'
      });
    }

    // Create download record
    await prisma.templateDownload.create({
      data: { templateId: id, userId }
    });

    // Update template downloads count
    await prisma.template.update({
      where: { id },
      data: { downloads: { increment: 1 } }
    });

    res.json({
      success: true,
      message: 'Template downloaded successfully'
    });

  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download template'
    });
  }
});

// ============================================
// 9. DOWNLOAD VIDEOS
// ============================================
router.post('/videos/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if already downloaded
    const existingDownload = await prisma.videoDownload.findFirst({
      where: { videoId: id, userId }
    });

    if (existingDownload) {
      return res.status(400).json({
        success: false,
        message: 'Video already downloaded'
      });
    }

    // Create download record
    await prisma.videoDownload.create({
      data: { videoId: id, userId }
    });

    // Update video downloads count
    await prisma.video.update({
      where: { id },
      data: { downloads: { increment: 1 } }
    });

    res.json({
      success: true,
      message: 'Video downloaded successfully'
    });

  } catch (error) {
    console.error('Download video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download video'
    });
  }
});

// ============================================
// 10. GET CONTENT DETAILS
// ============================================
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        previewUrl: true,
        category: true,
        subcategory: true,
        downloads: true,
        views: true,
        tags: true,
        fileSize: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Add user-specific data
    const userId = req.user?.id;
    const isLiked = userId ? await prisma.templateLike.findFirst({
      where: { templateId: id, userId }
    }) : false;

    const isDownloaded = userId ? await prisma.templateDownload.findFirst({
      where: { templateId: id, userId }
    }) : false;

    const templateWithUserData = {
      ...template,
      isLiked: !!isLiked,
      isDownloaded: !!isDownloaded
    };

    res.json({
      success: true,
      data: templateWithUserData,
      message: 'Template details retrieved successfully'
    });

  } catch (error) {
    console.error('Get template details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve template details'
    });
  }
});

router.get('/videos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        duration: true,
        category: true,
        views: true,
        downloads: true,
        tags: true,
        fileSize: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Add user-specific data
    const userId = req.user?.id;
    const isLiked = userId ? await prisma.videoLike.findFirst({
      where: { videoId: id, userId }
    }) : false;

    const isDownloaded = userId ? await prisma.videoDownload.findFirst({
      where: { videoId: id, userId }
    }) : false;

    const videoWithUserData = {
      ...video,
      isLiked: !!isLiked,
      isDownloaded: !!isDownloaded
    };

    res.json({
      success: true,
      data: videoWithUserData,
      message: 'Video details retrieved successfully'
    });

  } catch (error) {
    console.error('Get video details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve video details'
    });
  }
});

router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        time: true,
        location: true,
        organizer: true,
        organizerId: true,
        imageUrl: true,
        category: true,
        price: true,
        isFree: true,
        attendees: true,
        maxAttendees: true,
        tags: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event,
      message: 'Event details retrieved successfully'
    });

  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event details'
    });
  }
});

export default router;
