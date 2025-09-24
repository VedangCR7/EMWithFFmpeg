import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all template routes
router.use(authenticateToken);

// ============================================
// TEMPLATE GALLERY API ENDPOINTS
// ============================================

// ============================================
// 1. GET TEMPLATES
// ============================================
// GET /api/templates
// Returns templates with filtering and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      type = 'all', 
      category = 'all', 
      language, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;

    const where: any = {};

    // Filter by type
    if (type !== 'all') {
      where.type = type;
    }

    // Filter by category (free/premium)
    if (category !== 'all') {
      where.isPremium = category === 'premium';
    }

    // Filter by language
    if (language) {
      where.language = language;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { hasSome: [search as string] } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        orderBy: [
          { views: 'desc' },
          { likes: 'desc' },
          { downloads: 'desc' }
        ],
        skip,
        take: parseInt(limit as string),
        select: {
          id: true,
          name: true,
          description: true,
          thumbnail: true,
          imageUrl: true,
          category: true,
          type: true,
          language: true,
          tags: true,
          likes: true,
          downloads: true,
          views: true,
          isPremium: true,
          createdAt: true
        }
      }),
      prisma.template.count({ where })
    ]);

    // Add user-specific data (isLiked)
    const userId = req.user?.id;
    const templatesWithUserData = await Promise.all(
      templates.map(async (template) => {
        const isLiked = userId ? await prisma.templateLike.findFirst({
          where: { templateId: template.id, userId }
        }) : false;

        return {
          ...template,
          isLiked: !!isLiked
        };
      })
    );

    res.json({
      success: true,
      data: {
        templates: templatesWithUserData,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      },
      message: 'Templates retrieved successfully'
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      data: { templates: [], total: 0, page: 1, limit: 20 },
      message: 'Failed to retrieve templates'
    });
  }
});

// ============================================
// 2. GET TEMPLATE BY ID
// ============================================
// GET /api/templates/:id
// Returns detailed template information
router.get('/:id', async (req: Request, res: Response) => {
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
        type: true,
        language: true,
        tags: true,
        likes: true,
        downloads: true,
        views: true,
        isPremium: true,
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

    // Increment view count
    await prisma.template.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

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
    console.error('Get template by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve template details'
    });
  }
});

// ============================================
// 3. GET TEMPLATE CATEGORIES
// ============================================
// GET /api/templates/categories
// Returns available template categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.template.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    const categoryData = categories.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }));

    res.json({
      success: true,
      data: categoryData,
      message: 'Template categories retrieved successfully'
    });

  } catch (error) {
    console.error('Get template categories error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to retrieve template categories'
    });
  }
});

// ============================================
// 4. GET TEMPLATE LANGUAGES
// ============================================
// GET /api/templates/languages
// Returns available template languages
router.get('/languages', async (req: Request, res: Response) => {
  try {
    const languages = await prisma.template.groupBy({
      by: ['language'],
      _count: {
        language: true
      },
      orderBy: {
        language: 'asc'
      }
    });

    const languageData = languages.map(lang => ({
      code: lang.language.toLowerCase(),
      name: lang.language,
      nativeName: lang.language,
      count: lang._count.language
    }));

    res.json({
      success: true,
      data: languageData,
      message: 'Template languages retrieved successfully'
    });

  } catch (error) {
    console.error('Get template languages error:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to retrieve template languages'
    });
  }
});

// ============================================
// 5. LIKE TEMPLATE
// ============================================
// POST /api/templates/:id/like
// Like a template
router.post('/:id/like', async (req: Request, res: Response) => {
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
        message: 'Template already liked',
        isLiked: true
      });
    }

    // Create like
    await prisma.templateLike.create({
      data: { templateId: id, userId }
    });

    // Update template likes count
    await prisma.template.update({
      where: { id },
      data: { likes: { increment: 1 } }
    });

    res.json({
      success: true,
      message: 'Template liked successfully',
      isLiked: true
    });

  } catch (error) {
    console.error('Like template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like template',
      isLiked: false
    });
  }
});

// ============================================
// 6. UNLIKE TEMPLATE
// ============================================
// DELETE /api/templates/:id/like
// Unlike a template
router.delete('/:id/like', async (req: Request, res: Response) => {
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
        message: 'Template not liked',
        isLiked: false
      });
    }

    // Update template likes count
    await prisma.template.update({
      where: { id },
      data: { likes: { decrement: 1 } }
    });

    res.json({
      success: true,
      message: 'Template unliked successfully',
      isLiked: false
    });

  } catch (error) {
    console.error('Unlike template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike template',
      isLiked: true
    });
  }
});

// ============================================
// 7. DOWNLOAD TEMPLATE
// ============================================
// POST /api/templates/:id/download
// Download a template
router.post('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if template exists
    const template = await prisma.template.findUnique({
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
// 8. GET USER'S LIKED TEMPLATES
// ============================================
// GET /api/templates/liked
// Returns templates liked by the user
router.get('/liked', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const likedTemplates = await prisma.templateLike.findMany({
      where: { userId },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            thumbnail: true,
            category: true,
            type: true,
            language: true,
            tags: true,
            likes: true,
            downloads: true,
            views: true,
            isPremium: true,
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
      message: 'Liked templates retrieved successfully'
    });

  } catch (error) {
    console.error('Get liked templates error:', error);
    res.status(500).json({
      success: false,
      data: { templates: [], total: 0, page: 1, limit: 20 },
      message: 'Failed to retrieve liked templates'
    });
  }
});

// ============================================
// 9. GET USER'S DOWNLOADED TEMPLATES
// ============================================
// GET /api/templates/downloaded
// Returns templates downloaded by the user
router.get('/downloaded', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const downloadedTemplates = await prisma.templateDownload.findMany({
      where: { userId },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            thumbnail: true,
            category: true,
            type: true,
            language: true,
            tags: true,
            likes: true,
            downloads: true,
            views: true,
            isPremium: true,
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
      message: 'Downloaded templates retrieved successfully'
    });

  } catch (error) {
    console.error('Get downloaded templates error:', error);
    res.status(500).json({
      success: false,
      data: { templates: [], total: 0, page: 1, limit: 20 },
      message: 'Failed to retrieve downloaded templates'
    });
  }
});

export default router;
