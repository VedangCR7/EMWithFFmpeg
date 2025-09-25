import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/mobile/templates
 * Get templates list with filtering and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      category, 
      language = 'en', 
      type, 
      page = '1', 
      limit = '10',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const where: any = { isActive: true };
    if (category) where.category = category;
    if (language) where.language = language;
    if (type) where.type = type;

    const orderBy: any = {};
    if (sortBy === 'popular') orderBy.downloads = order;
    else if (sortBy === 'likes') orderBy.likes = order;
    else if (sortBy === 'title') orderBy.title = order;
    else orderBy.createdAt = order;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [templates, total] = await Promise.all([
      prisma.mobileTemplate.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          sourceImage: {
            select: {
              id: true,
              title: true,
              businessCategory: {
                select: { name: true }
              }
            }
          }
        }
      }),
      prisma.mobileTemplate.count({ where })
    ]);

    res.json({
      success: true,
      message: 'Templates fetched successfully',
      data: {
        templates,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
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
 * GET /api/mobile/templates/categories
 * Get template categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.templateCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({
      success: true,
      message: 'Template categories fetched successfully',
      data: categories
    });

  } catch (error) {
    console.error('Get template categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template categories'
    });
  }
});

/**
 * GET /api/mobile/templates/languages
 * Get available languages
 */
router.get('/languages', async (req: Request, res: Response) => {
  try {
    const languages = await prisma.templateLanguage.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      message: 'Template languages fetched successfully',
      data: languages
    });

  } catch (error) {
    console.error('Get template languages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template languages'
    });
  }
});

/**
 * GET /api/mobile/templates/search
 * Search templates
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { 
      q, 
      category, 
      language = 'en', 
      type,
      page = '1', 
      limit = '10' 
    } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const where: any = {
      isActive: true,
      OR: [
        { title: { contains: q as string } },
        { description: { contains: q as string } },
        { tags: { contains: q as string } }
      ]
    };

    if (category) where.category = category;
    if (language) where.language = language;
    if (type) where.type = type;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [templates, total] = await Promise.all([
      prisma.mobileTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          sourceImage: {
            select: {
              id: true,
              title: true,
              businessCategory: {
                select: { name: true }
              }
            }
          }
        }
      }),
      prisma.mobileTemplate.count({ where })
    ]);

    res.json({
      success: true,
      message: 'Template search completed successfully',
      data: {
        templates,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });

  } catch (error) {
    console.error('Search templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search templates'
    });
  }
});

/**
 * GET /api/mobile/templates/:id
 * Get template details by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.mobileTemplate.findUnique({
      where: { id },
      include: {
        sourceImage: {
          select: {
            id: true,
            title: true,
            businessCategory: {
              select: { name: true }
            }
          }
        },
        templateLikes: {
          select: {
            id: true,
            mobileUserId: true,
            createdAt: true
          }
        },
        templateDownloads: {
          select: {
            id: true,
            mobileUserId: true,
            createdAt: true
          }
        }
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template details fetched successfully',
      data: template
    });

  } catch (error) {
    console.error('Get template details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template details'
    });
  }
});

/**
 * POST /api/mobile/templates/:id/like
 * Like a template
 */
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

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

    // Check if already liked
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

    // Create like and update template likes count
    const [like, updatedTemplate] = await Promise.all([
      prisma.templateLike.create({
        data: {
          templateId: id,
          mobileUserId: userId
        }
      }),
      prisma.mobileTemplate.update({
        where: { id },
        data: {
          likes: { increment: 1 }
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Template liked successfully',
      isLiked: true
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
 * DELETE /api/mobile/templates/:id/like
 * Unlike a template
 */
router.delete('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;

    // Check if like exists
    const existingLike = await prisma.templateLike.findFirst({
      where: {
        templateId: id,
        mobileUserId: userId
      }
    });

    if (!existingLike) {
      return res.status(404).json({
        success: false,
        error: 'Like not found'
      });
    }

    // Delete like and update template likes count
    const [, updatedTemplate] = await Promise.all([
      prisma.templateLike.delete({
        where: { id: existingLike.id }
      }),
      prisma.mobileTemplate.update({
        where: { id },
        data: {
          likes: { decrement: 1 }
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Template unliked successfully',
      isLiked: false
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
 * POST /api/mobile/templates/:id/download
 * Download a template
 */
router.post('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

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

    // Create download record and update template downloads count
    const [download, updatedTemplate] = await Promise.all([
      prisma.templateDownload.create({
        data: {
          templateId: id,
          mobileUserId: userId
        }
      }),
      prisma.mobileTemplate.update({
        where: { id },
        data: {
          downloads: { increment: 1 }
        }
      })
    ]);

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
      message: 'Template download recorded successfully',
      downloadUrl: template.fileUrl || template.imageUrl
    });

  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record template download'
    });
  }
});

export default router;
