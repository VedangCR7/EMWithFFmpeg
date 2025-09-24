import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all greeting routes
router.use(authenticateToken);

// ============================================
// GREETING TEMPLATES API ENDPOINTS
// ============================================

// ============================================
// 1. GET GREETING CATEGORIES
// ============================================
// GET /api/greeting-categories
// Returns available greeting categories
router.get('/greeting-categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.greetingCategory.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        description: true,
        isActive: true,
        templateCount: true
      }
    });

    res.json({
      success: true,
      data: categories,
      message: 'Greeting categories retrieved successfully'
    });

  } catch (error) {
    console.error('Get greeting categories error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to retrieve greeting categories'
    });
  }
});

// ============================================
// 2. GET GREETING TEMPLATES
// ============================================
// GET /api/greeting-templates
// Returns greeting templates with filtering
router.get('/greeting-templates', async (req: Request, res: Response) => {
  try {
    const { 
      category, 
      language, 
      isPremium, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;

    const where: any = {};

    // Filter by category
    if (category && category !== 'all') {
      where.category = category;
    }

    // Filter by language
    if (language) {
      where.language = language;
    }

    // Filter by premium status
    if (isPremium !== undefined) {
      where.isPremium = isPremium === 'true';
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
        { tags: { hasSome: [search as string] } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [templates, total] = await Promise.all([
      prisma.greetingTemplate.findMany({
        where,
        orderBy: [
          { likes: 'desc' },
          { downloads: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit as string),
        select: {
          id: true,
          name: true,
          thumbnail: true,
          category: true,
          content: true,
          language: true,
          likes: true,
          downloads: true,
          views: true,
          isPremium: true,
          tags: true,
          createdAt: true
        }
      }),
      prisma.greetingTemplate.count({ where })
    ]);

    // Add user-specific data (isLiked, isDownloaded)
    const userId = req.user?.id;
    const templatesWithUserData = await Promise.all(
      templates.map(async (template) => {
        const isLiked = userId ? await prisma.greetingTemplateLike.findFirst({
          where: { templateId: template.id, userId }
        }) : false;

        const isDownloaded = userId ? await prisma.greetingTemplateDownload.findFirst({
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
      message: 'Greeting templates retrieved successfully',
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('Get greeting templates error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to retrieve greeting templates'
    });
  }
});

// ============================================
// 3. SEARCH GREETING TEMPLATES
// ============================================
// GET /api/greeting-templates/search
// Search greeting templates
router.get('/greeting-templates/search', async (req: Request, res: Response) => {
  try {
    const { q: query, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const templates = await prisma.greetingTemplate.findMany({
      where: {
        OR: [
          { name: { contains: query as string, mode: 'insensitive' } },
          { content: { contains: query as string, mode: 'insensitive' } },
          { tags: { hasSome: [query as string] } }
        ]
      },
      take: parseInt(limit as string),
      orderBy: [
        { likes: 'desc' },
        { downloads: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        thumbnail: true,
        category: true,
        content: true,
        language: true,
        likes: true,
        downloads: true,
        views: true,
        isPremium: true,
        tags: true,
        createdAt: true
      }
    });

    // Add user-specific data
    const userId = req.user?.id;
    const templatesWithUserData = await Promise.all(
      templates.map(async (template) => {
        const isLiked = userId ? await prisma.greetingTemplateLike.findFirst({
          where: { templateId: template.id, userId }
        }) : false;

        const isDownloaded = userId ? await prisma.greetingTemplateDownload.findFirst({
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
      message: 'Search completed successfully'
    });

  } catch (error) {
    console.error('Search greeting templates error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: 'Search failed'
    });
  }
});

// ============================================
// 4. GET GREETING TEMPLATE BY ID
// ============================================
// GET /api/greeting-templates/:id
// Returns detailed greeting template information
router.get('/greeting-templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.greetingTemplate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        thumbnail: true,
        category: true,
        content: true,
        language: true,
        likes: true,
        downloads: true,
        views: true,
        isPremium: true,
        tags: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Greeting template not found'
      });
    }

    // Increment view count
    await prisma.greetingTemplate.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    // Add user-specific data
    const userId = req.user?.id;
    const isLiked = userId ? await prisma.greetingTemplateLike.findFirst({
      where: { templateId: id, userId }
    }) : false;

    const isDownloaded = userId ? await prisma.greetingTemplateDownload.findFirst({
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
      message: 'Greeting template details retrieved successfully'
    });

  } catch (error) {
    console.error('Get greeting template by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve greeting template details'
    });
  }
});

// ============================================
// 5. LIKE GREETING TEMPLATE
// ============================================
// POST /api/greeting-templates/:id/like
// Like a greeting template
router.post('/greeting-templates/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if already liked
    const existingLike = await prisma.greetingTemplateLike.findFirst({
      where: { templateId: id, userId }
    });

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'Template already liked',
        isLiked: true
      });
    }

    // Create like
    await prisma.greetingTemplateLike.create({
      data: { templateId: id, userId }
    });

    // Update template likes count
    await prisma.greetingTemplate.update({
      where: { id },
      data: { likes: { increment: 1 } }
    });

    res.json({
      success: true,
      message: 'Template liked successfully',
      isLiked: true
    });

  } catch (error) {
    console.error('Like greeting template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like template',
      isLiked: false
    });
  }
});

// ============================================
// 6. UNLIKE GREETING TEMPLATE
// ============================================
// DELETE /api/greeting-templates/:id/like
// Unlike a greeting template
router.delete('/greeting-templates/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Remove like
    const deletedLike = await prisma.greetingTemplateLike.deleteMany({
      where: { templateId: id, userId }
    });

    if (deletedLike.count === 0) {
      return res.status(400).json({
        success: false,
        message: 'Template not liked',
        isLiked: false
      });
    }

    // Update template likes count
    await prisma.greetingTemplate.update({
      where: { id },
      data: { likes: { decrement: 1 } }
    });

    res.json({
      success: true,
      message: 'Template unliked successfully',
      isLiked: false
    });

  } catch (error) {
    console.error('Unlike greeting template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike template',
      isLiked: true
    });
  }
});

// ============================================
// 7. DOWNLOAD GREETING TEMPLATE
// ============================================
// POST /api/greeting-templates/:id/download
// Download a greeting template
router.post('/greeting-templates/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if template exists
    const template = await prisma.greetingTemplate.findUnique({
      where: { id },
      select: { id: true, isPremium: true }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if already downloaded
    const existingDownload = await prisma.greetingTemplateDownload.findFirst({
      where: { templateId: id, userId }
    });

    if (existingDownload) {
      return res.status(400).json({
        success: false,
        message: 'Template already downloaded'
      });
    }

    // Create download record
    await prisma.greetingTemplateDownload.create({
      data: { templateId: id, userId }
    });

    // Update template downloads count
    await prisma.greetingTemplate.update({
      where: { id },
      data: { downloads: { increment: 1 } }
    });

    res.json({
      success: true,
      message: 'Template downloaded successfully'
    });

  } catch (error) {
    console.error('Download greeting template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download template'
    });
  }
});

// ============================================
// 8. GET STICKERS
// ============================================
// GET /api/stickers
// Returns available stickers
router.get('/stickers', async (req: Request, res: Response) => {
  try {
    const stickers = await prisma.sticker.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        emoji: true,
        category: true,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: stickers.map(sticker => sticker.emoji),
      message: 'Stickers retrieved successfully'
    });

  } catch (error) {
    console.error('Get stickers error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to retrieve stickers'
    });
  }
});

// ============================================
// 9. GET EMOJIS
// ============================================
// GET /api/emojis
// Returns available emojis
router.get('/emojis', async (req: Request, res: Response) => {
  try {
    const emojis = await prisma.emoji.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        emoji: true,
        category: true,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: emojis.map(emoji => emoji.emoji),
      message: 'Emojis retrieved successfully'
    });

  } catch (error) {
    console.error('Get emojis error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to retrieve emojis'
    });
  }
});

// ============================================
// 10. GET USER'S LIKED GREETING TEMPLATES
// ============================================
// GET /api/greeting-templates/liked
// Returns greeting templates liked by the user
router.get('/greeting-templates/liked', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const likedTemplates = await prisma.greetingTemplateLike.findMany({
      where: { userId },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
            category: true,
            content: true,
            language: true,
            likes: true,
            downloads: true,
            views: true,
            isPremium: true,
            tags: true,
            createdAt: true
          }
        }
      }
    });

    const templates = likedTemplates.map(like => ({
      ...like.template,
      isLiked: true,
      likedAt: like.createdAt
    }));

    res.json({
      success: true,
      data: {
        templates,
        total: likedTemplates.length,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      },
      message: 'Liked greeting templates retrieved successfully'
    });

  } catch (error) {
    console.error('Get liked greeting templates error:', error);
    res.status(500).json({
      success: false,
      data: { templates: [], total: 0, page: 1, limit: 20 },
      message: 'Failed to retrieve liked greeting templates'
    });
  }
});

// ============================================
// 11. GET USER'S DOWNLOADED GREETING TEMPLATES
// ============================================
// GET /api/greeting-templates/downloaded
// Returns greeting templates downloaded by the user
router.get('/greeting-templates/downloaded', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const downloadedTemplates = await prisma.greetingTemplateDownload.findMany({
      where: { userId },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
            category: true,
            content: true,
            language: true,
            likes: true,
            downloads: true,
            views: true,
            isPremium: true,
            tags: true,
            createdAt: true
          }
        }
      }
    });

    const templates = downloadedTemplates.map(download => ({
      ...download.template,
      isDownloaded: true,
      downloadedAt: download.createdAt
    }));

    res.json({
      success: true,
      data: {
        templates,
        total: downloadedTemplates.length,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      },
      message: 'Downloaded greeting templates retrieved successfully'
    });

  } catch (error) {
    console.error('Get downloaded greeting templates error:', error);
    res.status(500).json({
      success: false,
      data: { templates: [], total: 0, page: 1, limit: 20 },
      message: 'Failed to retrieve downloaded greeting templates'
    });
  }
});

export default router;
