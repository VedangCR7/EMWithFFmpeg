import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireStaff } from '../middleware/auth';
import { query, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all search routes
router.use(authenticateToken);
router.use(requireStaff);

// ============================================
// SEARCH ENDPOINTS
// ============================================

// Search images
router.get('/images', [
  query('q').optional().isString().withMessage('Search query must be a string'),
  query('category').optional().isIn(['BUSINESS', 'FESTIVAL', 'GENERAL']).withMessage('Invalid category'),
  query('businessCategoryId').optional().isString().withMessage('Business category ID must be a string'),
  query('tags').optional().isString().withMessage('Tags must be a string'),
  query('approvalStatus').optional().isIn(['APPROVED', 'PENDING', 'REJECTED']).withMessage('Invalid approval status'),
  query('uploaderType').optional().isIn(['ADMIN', 'SUBADMIN']).withMessage('Invalid uploader type'),
  query('sortBy').optional().isIn(['title', 'createdAt', 'downloads', 'views', 'fileSize']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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
      q,
      category,
      businessCategoryId,
      tags,
      approvalStatus,
      uploaderType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build where clause
    const where: any = {};

    // Text search
    if (q) {
      where.OR = [
        { title: { contains: q as string } },
        { description: { contains: q as string } },
        { tags: { has: q as string } }
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Business category filter
    if (businessCategoryId) {
      where.businessCategoryId = businessCategoryId;
    }

    // Tags filter
    if (tags) {
      const tagArray = (tags as string).split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagArray };
    }

    // Approval status filter
    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }

    // Uploader type filter
    if (uploaderType) {
      where.uploaderType = uploaderType;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    // Execute search
    const [images, totalCount] = await Promise.all([
      prisma.image.findMany({
        where,
        orderBy,
        skip,
        take: Number(limit),
        include: {
          businessCategory: {
            select: { id: true, name: true }
          },
          adminUploader: {
            select: { id: true, name: true, email: true }
          },
          subadminUploader: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.image.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    res.json({
      success: true,
      data: {
        images,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount,
          limit: Number(limit),
          hasNextPage,
          hasPrevPage
        },
        filters: {
          query: q,
          category,
          businessCategoryId,
          tags,
          approvalStatus,
          uploaderType,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Search images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search images'
    });
  }
});

// Search videos
router.get('/videos', [
  query('q').optional().isString().withMessage('Search query must be a string'),
  query('category').optional().isIn(['BUSINESS', 'FESTIVAL', 'GENERAL']).withMessage('Invalid category'),
  query('businessCategoryId').optional().isString().withMessage('Business category ID must be a string'),
  query('tags').optional().isString().withMessage('Tags must be a string'),
  query('approvalStatus').optional().isIn(['APPROVED', 'PENDING', 'REJECTED']).withMessage('Invalid approval status'),
  query('uploaderType').optional().isIn(['ADMIN', 'SUBADMIN']).withMessage('Invalid uploader type'),
  query('sortBy').optional().isIn(['title', 'createdAt', 'downloads', 'views', 'fileSize', 'duration']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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
      q,
      category,
      businessCategoryId,
      tags,
      approvalStatus,
      uploaderType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build where clause
    const where: any = {};

    // Text search
    if (q) {
      where.OR = [
        { title: { contains: q as string } },
        { description: { contains: q as string } },
        { tags: { has: q as string } }
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Business category filter
    if (businessCategoryId) {
      where.businessCategoryId = businessCategoryId;
    }

    // Tags filter
    if (tags) {
      const tagArray = (tags as string).split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagArray };
    }

    // Approval status filter
    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }

    // Uploader type filter
    if (uploaderType) {
      where.uploaderType = uploaderType;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    // Execute search
    const [videos, totalCount] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take: Number(limit),
        include: {
          businessCategory: {
            select: { id: true, name: true }
          },
          adminUploader: {
            select: { id: true, name: true, email: true }
          },
          subadminUploader: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.video.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount,
          limit: Number(limit),
          hasNextPage,
          hasPrevPage
        },
        filters: {
          query: q,
          category,
          businessCategoryId,
          tags,
          approvalStatus,
          uploaderType,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Search videos error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search videos'
    });
  }
});

// Search all content (images and videos)
router.get('/content', [
  query('q').optional().isString().withMessage('Search query must be a string'),
  query('category').optional().isIn(['BUSINESS', 'FESTIVAL', 'GENERAL']).withMessage('Invalid category'),
  query('businessCategoryId').optional().isString().withMessage('Business category ID must be a string'),
  query('tags').optional().isString().withMessage('Tags must be a string'),
  query('approvalStatus').optional().isIn(['APPROVED', 'PENDING', 'REJECTED']).withMessage('Invalid approval status'),
  query('uploaderType').optional().isIn(['ADMIN', 'SUBADMIN']).withMessage('Invalid uploader type'),
  query('contentType').optional().isIn(['images', 'videos', 'all']).withMessage('Content type must be images, videos, or all'),
  query('sortBy').optional().isIn(['title', 'createdAt', 'downloads', 'views', 'fileSize']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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
      q,
      category,
      businessCategoryId,
      tags,
      approvalStatus,
      uploaderType,
      contentType = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build where clause for both images and videos
    const where: any = {};

    // Text search
    if (q) {
      where.OR = [
        { title: { contains: q as string } },
        { description: { contains: q as string } },
        { tags: { has: q as string } }
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Business category filter
    if (businessCategoryId) {
      where.businessCategoryId = businessCategoryId;
    }

    // Tags filter
    if (tags) {
      const tagArray = (tags as string).split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagArray };
    }

    // Approval status filter
    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }

    // Uploader type filter
    if (uploaderType) {
      where.uploaderType = uploaderType;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    let images: any[] = [];
    let videos: any[] = [];
    let totalCount = 0;

    // Search based on content type
    if (contentType === 'images' || contentType === 'all') {
      const [imageResults, imageCount] = await Promise.all([
        prisma.image.findMany({
          where,
          orderBy,
          skip: contentType === 'images' ? skip : 0,
          take: contentType === 'images' ? Number(limit) : Number(limit) / 2,
          include: {
            businessCategory: {
              select: { id: true, name: true }
            },
            adminUploader: {
              select: { id: true, name: true, email: true }
            },
            subadminUploader: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        prisma.image.count({ where })
      ]);
      images = imageResults;
      totalCount += imageCount;
    }

    if (contentType === 'videos' || contentType === 'all') {
      const [videoResults, videoCount] = await Promise.all([
        prisma.video.findMany({
          where,
          orderBy,
          skip: contentType === 'videos' ? skip : 0,
          take: contentType === 'videos' ? Number(limit) : Number(limit) / 2,
          include: {
            businessCategory: {
              select: { id: true, name: true }
            },
            adminUploader: {
              select: { id: true, name: true, email: true }
            },
            subadminUploader: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        prisma.video.count({ where })
      ]);
      videos = videoResults;
      totalCount += videoCount;
    }

    // Combine and sort results if searching all content
    let combinedResults: any[] = [];
    if (contentType === 'all') {
      combinedResults = [...images, ...videos];
      // Sort combined results
      combinedResults.sort((a, b) => {
        const aValue = a[sortBy as string];
        const bValue = b[sortBy as string];
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      // Apply pagination to combined results
      const startIndex = skip;
      const endIndex = startIndex + Number(limit);
      combinedResults = combinedResults.slice(startIndex, endIndex);
    } else {
      combinedResults = contentType === 'images' ? images : videos;
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    res.json({
      success: true,
      data: {
        content: combinedResults,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount,
          limit: Number(limit),
          hasNextPage,
          hasPrevPage
        },
        filters: {
          query: q,
          category,
          businessCategoryId,
          tags,
          approvalStatus,
          uploaderType,
          contentType,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Search content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search content'
    });
  }
});

// Get search suggestions
router.get('/suggestions', [
  query('q').isString().withMessage('Search query is required'),
  query('type').optional().isIn(['images', 'videos', 'all']).withMessage('Type must be images, videos, or all')
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

    const { q, type = 'all' } = req.query;
    const query = q as string;

    let suggestions: any[] = [];

    // Get title suggestions
    if (type === 'images' || type === 'all') {
      const imageTitles = await prisma.image.findMany({
        where: {
          title: { contains: query }
        },
        select: { title: true },
        take: 5
      });
      suggestions.push(...imageTitles.map(img => ({ text: img.title, type: 'image' })));
    }

    if (type === 'videos' || type === 'all') {
      const videoTitles = await prisma.video.findMany({
        where: {
          title: { contains: query }
        },
        select: { title: true },
        take: 5
      });
      suggestions.push(...videoTitles.map(vid => ({ text: vid.title, type: 'video' })));
    }

    // Get tag suggestions
    const allImages = await prisma.image.findMany({
      select: { tags: true }
    });

    const allVideos = await prisma.video.findMany({
      select: { tags: true }
    });

    const allTags = [...allImages, ...allVideos]
      .flatMap(item => item.tags)
      .filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);

    suggestions.push(...allTags.map(tag => ({ text: tag, type: 'tag' })));

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .slice(0, 10);

    res.json({
      success: true,
      suggestions: uniqueSuggestions
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search suggestions'
    });
  }
});

// Get search statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalImages,
      totalVideos,
      totalTags,
      mostUsedTags,
      categoryStats
    ] = await Promise.all([
      prisma.image.count(),
      prisma.video.count(),
      prisma.image.aggregate({ _sum: { views: true } }),
      prisma.video.aggregate({ _sum: { views: true } }),
      prisma.image.groupBy({
        by: ['category'],
        _count: { category: true }
      })
    ]);

    // Get unique tags count
    const allImages = await prisma.image.findMany({ select: { tags: true } });
    const allVideos = await prisma.video.findMany({ select: { tags: true } });
    const allTags = [...allImages, ...allVideos].flatMap(item => item.tags);
    const uniqueTags = [...new Set(allTags)].length;

    res.json({
      success: true,
      stats: {
        totalContent: {
          images: totalImages,
          videos: totalVideos,
          total: totalImages + totalVideos
        },
        totalTags: uniqueTags,
        totalViews: (totalTags._sum.views || 0) + (mostUsedTags._sum.views || 0),
        categoryDistribution: categoryStats
      }
    });

  } catch (error) {
    console.error('Search stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search statistics'
    });
  }
});

export default router;
