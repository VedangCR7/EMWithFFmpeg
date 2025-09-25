import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/mobile/users/:id
 * Get user profile
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.mobileUser.findUnique({
      where: { id },
      include: {
        businessProfiles: true,
        subscriptions: {
          include: {
            plan: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User profile fetched successfully',
      data: user
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

/**
 * PUT /api/mobile/users/:id
 * Update user profile
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      email, 
      phone, 
      fcmToken,
      description,
      category,
      address,
      alternatePhone,
      website,
      companyLogo
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.mobileUser.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user
    const updatedUser = await prisma.mobileUser.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        fcmToken,
        description,
        category,
        address,
        alternatePhone,
        website,
        companyLogo,
        lastActiveAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'User profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

/**
 * GET /api/mobile/users/:id/activities
 * Get user activities
 */
router.get('/:id/activities', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20', action, resourceType } = req.query;

    const where: any = { mobileUserId: id };
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [activities, total] = await Promise.all([
      prisma.mobileActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.mobileActivity.count({ where })
    ]);

    res.json({
      success: true,
      message: 'User activities fetched successfully',
      data: {
        activities,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });

  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activities'
    });
  }
});

/**
 * POST /api/mobile/users/:id/activities
 * Create user activity
 */
router.post('/:id/activities', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, resourceType, resourceId, metadata } = req.body;

    if (!action || !resourceType) {
      return res.status(400).json({
        success: false,
        error: 'Action and resource type are required'
      });
    }

    // Check if user exists
    const user = await prisma.mobileUser.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create activity
    const activity = await prisma.mobileActivity.create({
      data: {
        mobileUserId: id,
        action,
        resourceType,
        resourceId,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'User activity created successfully',
      data: activity
    });

  } catch (error) {
    console.error('Create user activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user activity'
    });
  }
});

/**
 * GET /api/mobile/users/:id/likes
 * Get user's likes
 */
router.get('/:id/likes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resourceType, page = '1', limit = '20' } = req.query;

    const where: any = { mobileUserId: id };
    if (resourceType) where.resourceType = resourceType;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [likes, total] = await Promise.all([
      prisma.mobileLike.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.mobileLike.count({ where })
    ]);

    res.json({
      success: true,
      message: 'User likes fetched successfully',
      data: {
        likes,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });

  } catch (error) {
    console.error('Get user likes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user likes'
    });
  }
});

/**
 * GET /api/mobile/users/:id/downloads/all
 * Get all user's downloads (templates, videos, greeting templates)
 */
router.get('/:id/downloads/all', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20', type } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Build where clause based on type filter
    let whereClause: any = { mobileUserId: id };
    if (type) {
      whereClause.resourceType = (type as string).toUpperCase();
    }

    // Get downloads from the unified MobileDownload table
    const [downloads, total] = await Promise.all([
      prisma.mobileDownload.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          mobileUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.mobileDownload.count({ where: whereClause })
    ]);

    // Get download statistics
    const stats = await Promise.all([
      prisma.mobileDownload.count({
        where: { mobileUserId: id, resourceType: 'TEMPLATE' }
      }),
      prisma.mobileDownload.count({
        where: { mobileUserId: id, resourceType: 'VIDEO' }
      }),
      prisma.mobileDownload.count({
        where: { mobileUserId: id, resourceType: 'GREETING' }
      }),
      prisma.mobileDownload.count({
        where: { mobileUserId: id, resourceType: 'CONTENT' }
      })
    ]);

    const [templateCount, videoCount, greetingCount, contentCount] = stats;

    res.json({
      success: true,
      message: 'All user downloads fetched successfully',
      data: {
        downloads,
        statistics: {
          total: total,
          byType: {
            templates: templateCount,
            videos: videoCount,
            greetings: greetingCount,
            content: contentCount
          }
        },
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });

  } catch (error) {
    console.error('Get all user downloads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch all user downloads'
    });
  }
});

/**
 * GET /api/mobile/users/:id/downloads/stats
 * Get user's download statistics
 */
router.get('/:id/downloads/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get download statistics by type
    const [templateCount, videoCount, greetingCount, contentCount, totalCount] = await Promise.all([
      prisma.mobileDownload.count({
        where: { mobileUserId: id, resourceType: 'TEMPLATE' }
      }),
      prisma.mobileDownload.count({
        where: { mobileUserId: id, resourceType: 'VIDEO' }
      }),
      prisma.mobileDownload.count({
        where: { mobileUserId: id, resourceType: 'GREETING' }
      }),
      prisma.mobileDownload.count({
        where: { mobileUserId: id, resourceType: 'CONTENT' }
      }),
      prisma.mobileDownload.count({
        where: { mobileUserId: id }
      })
    ]);

    // Get recent downloads (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentCount = await prisma.mobileDownload.count({
      where: {
        mobileUserId: id,
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    // Get most downloaded content types
    const mostDownloadedType = await prisma.mobileDownload.groupBy({
      by: ['resourceType'],
      where: { mobileUserId: id },
      _count: { resourceType: true },
      orderBy: { _count: { resourceType: 'desc' } },
      take: 1
    });

    res.json({
      success: true,
      message: 'User download statistics fetched successfully',
      data: {
        total: totalCount,
        recent: recentCount,
        byType: {
          templates: templateCount,
          videos: videoCount,
          greetings: greetingCount,
          content: contentCount
        },
        mostDownloadedType: mostDownloadedType[0]?.resourceType || null,
        mostDownloadedCount: mostDownloadedType[0]?._count.resourceType || 0
      }
    });

  } catch (error) {
    console.error('Get user download stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user download statistics'
    });
  }
});

/**
 * GET /api/mobile/users/:id/downloads
 * Get user's downloads
 */
router.get('/:id/downloads', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resourceType, page = '1', limit = '20' } = req.query;

    const where: any = { mobileUserId: id };
    if (resourceType) where.resourceType = resourceType;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [downloads, total] = await Promise.all([
      prisma.mobileDownload.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.mobileDownload.count({ where })
    ]);

    res.json({
      success: true,
      message: 'User downloads fetched successfully',
      data: {
        downloads,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });

  } catch (error) {
    console.error('Get user downloads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user downloads'
    });
  }
});

/**
 * GET /api/mobile/users/:id/preferences
 * Get user preferences
 */
router.get('/:id/preferences', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.mobileUser.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return default preferences for now (until UserPreferences model is created)
    const defaultPreferences = {
      userId: id,
      notificationsEnabled: true,
      darkModeEnabled: false,
      defaultViewMode: 'grid',
      preferredCategories: [],
      language: 'en',
      autoSave: true,
      highQualityDownloads: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'User preferences fetched successfully',
      data: defaultPreferences
    });

  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user preferences'
    });
  }
});

/**
 * PUT /api/mobile/users/:id/preferences
 * Update user preferences
 */
router.put('/:id/preferences', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      notificationsEnabled,
      darkModeEnabled,
      defaultViewMode,
      preferredCategories,
      language,
      autoSave,
      highQualityDownloads
    } = req.body;

    // Check if user exists
    const user = await prisma.mobileUser.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return updated preferences for now (until UserPreferences model is created)
    const updatedPreferences = {
      userId: id,
      notificationsEnabled: notificationsEnabled ?? true,
      darkModeEnabled: darkModeEnabled ?? false,
      defaultViewMode: defaultViewMode ?? 'grid',
      preferredCategories: preferredCategories ?? [],
      language: language ?? 'en',
      autoSave: autoSave ?? true,
      highQualityDownloads: highQualityDownloads ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'User preferences updated successfully',
      data: updatedPreferences
    });

  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user preferences'
    });
  }
});

/**
 * GET /api/mobile/users/:id/stats
 * Get user statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.mobileUser.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get various statistics
    const [
      businessProfileCount,
      businessProfileRecentCount,
      templateLikeCount,
      videoLikeCount,
      greetingLikeCount,
      templateLikeRecentCount,
      videoLikeRecentCount,
      greetingLikeRecentCount,
      downloadCount,
      downloadRecentCount
    ] = await Promise.all([
      // Business profiles
      prisma.businessProfile.count({
        where: { mobileUserId: id, isActive: true }
      }),
      prisma.businessProfile.count({
        where: {
          mobileUserId: id,
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      // Likes counts
      prisma.templateLike.count({
        where: { mobileUserId: id }
      }),
      prisma.videoLike.count({
        where: { mobileUserId: id }
      }),
      prisma.greetingLike.count({
        where: { mobileUserId: id }
      }),
      // Recent likes counts
      prisma.templateLike.count({
        where: {
          mobileUserId: id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.videoLike.count({
        where: {
          mobileUserId: id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.greetingLike.count({
        where: {
          mobileUserId: id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Downloads
      prisma.mobileDownload.count({
        where: { mobileUserId: id }
      }),
      // Recent downloads
      prisma.mobileDownload.count({
        where: {
          mobileUserId: id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Calculate totals
    const likeCount = templateLikeCount + videoLikeCount + greetingLikeCount;
    const likeRecentCount = templateLikeRecentCount + videoLikeRecentCount + greetingLikeRecentCount;

    res.json({
      success: true,
      message: 'User statistics fetched successfully',
      data: {
        businessProfiles: {
          total: businessProfileCount,
          recentCount: businessProfileRecentCount
        },
        likes: {
          total: likeCount,
          recentCount: likeRecentCount,
          byType: {
            template: templateLikeCount,
            video: videoLikeCount,
            greeting: greetingLikeCount,
            businessProfile: 0 // Not implemented yet
          }
        },
        downloads: {
          total: downloadCount,
          recentCount: downloadRecentCount
        }
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics'
    });
  }
});

export default router;
