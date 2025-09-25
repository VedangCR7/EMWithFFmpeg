import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all analytics routes
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

// Get user analytics
router.get('/users', async (req: Request, res: Response) => {
  try {
    // Get total users count
    const totalUsers = await prisma.installedUser.count();
    const totalCustomers = await prisma.customer.count();
    const totalAdmins = await prisma.admin.count();
    const totalSubadmins = await prisma.subadmin.count();

    // Get user conversion rate
    const convertedUsers = await prisma.installedUser.count({
      where: { isConverted: true }
    });

    // Get user activity in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await prisma.installedUser.count({
      where: {
        lastActiveAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get user registration trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRegistrations = await prisma.installedUser.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Get customer subscription stats
    const activeSubscriptions = await prisma.customer.count({
      where: { subscriptionStatus: 'ACTIVE' }
    });

    const inactiveSubscriptions = await prisma.customer.count({
      where: { subscriptionStatus: 'INACTIVE' }
    });

    const conversionRate = totalUsers > 0 ? (convertedUsers / totalUsers) * 100 : 0;
    const activityRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    res.json({
      success: true,
      analytics: {
        totalUsers: {
          installedUsers: totalUsers,
          customers: totalCustomers,
          admins: totalAdmins,
          subadmins: totalSubadmins,
          total: totalUsers + totalCustomers + totalAdmins + totalSubadmins
        },
        conversion: {
          convertedUsers,
          conversionRate: Math.round(conversionRate * 100) / 100,
          activeSubscriptions,
          inactiveSubscriptions
        },
        activity: {
          activeUsers,
          activityRate: Math.round(activityRate * 100) / 100,
          recentRegistrations
        },
        period: {
          start: thirtyDaysAgo,
          end: new Date()
        }
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics'
    });
  }
});

// Get content analytics
router.get('/content', async (req: Request, res: Response) => {
  try {
    // Get total content counts
    const totalImages = await prisma.image.count();
    const totalVideos = await prisma.video.count();
    const approvedImages = await prisma.image.count({
      where: { approvalStatus: 'APPROVED' }
    });
    const approvedVideos = await prisma.video.count({
      where: { approvalStatus: 'APPROVED' }
    });
    const pendingImages = await prisma.image.count({
      where: { approvalStatus: 'PENDING' }
    });
    const pendingVideos = await prisma.video.count({
      where: { approvalStatus: 'PENDING' }
    });

    // Get content by category
    const imagesByCategory = await prisma.image.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    const videosByCategory = await prisma.video.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    // Get content by business category
    const imagesByBusinessCategory = await prisma.image.groupBy({
      by: ['businessCategoryId'],
      _count: { businessCategoryId: true },
      where: {
        businessCategoryId: { not: null }
      }
    });

    // Get total views and downloads
    const totalImageViews = await prisma.image.aggregate({
      _sum: { views: true }
    });

    const totalVideoViews = await prisma.video.aggregate({
      _sum: { views: true }
    });

    const totalImageDownloads = await prisma.image.aggregate({
      _sum: { downloads: true }
    });

    const totalVideoDownloads = await prisma.video.aggregate({
      _sum: { downloads: true }
    });

    // Get content upload trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentImageUploads = await prisma.image.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    const recentVideoUploads = await prisma.video.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    res.json({
      success: true,
      analytics: {
        totalContent: {
          images: totalImages,
          videos: totalVideos,
          total: totalImages + totalVideos
        },
        approvalStatus: {
          approved: {
            images: approvedImages,
            videos: approvedVideos,
            total: approvedImages + approvedVideos
          },
          pending: {
            images: pendingImages,
            videos: pendingVideos,
            total: pendingImages + pendingVideos
          }
        },
        categories: {
          images: imagesByCategory,
          videos: videosByCategory
        },
        businessCategories: {
          images: imagesByBusinessCategory
        },
        engagement: {
          totalViews: (totalImageViews._sum.views || 0) + (totalVideoViews._sum.views || 0),
          totalDownloads: (totalImageDownloads._sum.downloads || 0) + (totalVideoDownloads._sum.downloads || 0),
          imageViews: totalImageViews._sum.views || 0,
          videoViews: totalVideoViews._sum.views || 0,
          imageDownloads: totalImageDownloads._sum.downloads || 0,
          videoDownloads: totalVideoDownloads._sum.downloads || 0
        },
        trends: {
          recentImageUploads,
          recentVideoUploads,
          period: {
            start: thirtyDaysAgo,
            end: new Date()
          }
        }
      }
    });

  } catch (error) {
    console.error('Content analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content analytics'
    });
  }
});

// Get download analytics
router.get('/downloads', async (req: Request, res: Response) => {
  try {
    // Get total downloads
    const totalImageDownloads = await prisma.image.aggregate({
      _sum: { downloads: true }
    });

    const totalVideoDownloads = await prisma.video.aggregate({
      _sum: { downloads: true }
    });

    // Get downloads by category
    const imageDownloadsByCategory = await prisma.image.groupBy({
      by: ['category'],
      _sum: { downloads: true },
      _count: { category: true }
    });

    const videoDownloadsByCategory = await prisma.video.groupBy({
      by: ['category'],
      _sum: { downloads: true },
      _count: { category: true }
    });

    // Get downloads by business category
    const imageDownloadsByBusinessCategory = await prisma.image.groupBy({
      by: ['businessCategoryId'],
      _sum: { downloads: true },
      _count: { businessCategoryId: true },
      where: {
        businessCategoryId: { not: null }
      }
    });

    // Get most downloaded content
    const topDownloadedImages = await prisma.image.findMany({
      orderBy: { downloads: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        category: true,
        downloads: true,
        views: true,
        createdAt: true
      }
    });

    const topDownloadedVideos = await prisma.video.findMany({
      orderBy: { downloads: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        category: true,
        downloads: true,
        views: true,
        createdAt: true
      }
    });

    // Get download trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get customer download stats
    const customerDownloads = await prisma.customer.aggregate({
      _sum: { totalDownloads: true },
      _avg: { totalDownloads: true }
    });

    // Get download distribution
    const downloadDistribution = {
      images: totalImageDownloads._sum.downloads || 0,
      videos: totalVideoDownloads._sum.downloads || 0,
      total: (totalImageDownloads._sum.downloads || 0) + (totalVideoDownloads._sum.downloads || 0)
    };

    const imageDownloadPercentage = downloadDistribution.total > 0 
      ? Math.round(((totalImageDownloads._sum.downloads || 0) / downloadDistribution.total) * 100)
      : 0;

    const videoDownloadPercentage = downloadDistribution.total > 0 
      ? Math.round(((totalVideoDownloads._sum.downloads || 0) / downloadDistribution.total) * 100)
      : 0;

    res.json({
      success: true,
      analytics: {
        totalDownloads: downloadDistribution,
        distribution: {
          images: {
            count: totalImageDownloads._sum.downloads || 0,
            percentage: imageDownloadPercentage
          },
          videos: {
            count: totalVideoDownloads._sum.downloads || 0,
            percentage: videoDownloadPercentage
          }
        },
        byCategory: {
          images: imageDownloadsByCategory,
          videos: videoDownloadsByCategory
        },
        byBusinessCategory: {
          images: imageDownloadsByBusinessCategory
        },
        topContent: {
          images: topDownloadedImages,
          videos: topDownloadedVideos
        },
        customerStats: {
          totalCustomerDownloads: customerDownloads._sum.totalDownloads || 0,
          averageDownloadsPerCustomer: Math.round((customerDownloads._avg.totalDownloads || 0) * 100) / 100
        },
        period: {
          start: thirtyDaysAgo,
          end: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Download analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch download analytics'
    });
  }
});

// Get comprehensive analytics dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    // Get all analytics in one call
    const [
      totalUsers,
      totalCustomers,
      totalImages,
      totalVideos,
      totalImageDownloads,
      totalVideoDownloads,
      activeSubscriptions,
      pendingImages,
      pendingVideos
    ] = await Promise.all([
      prisma.installedUser.count(),
      prisma.customer.count(),
      prisma.image.count(),
      prisma.video.count(),
      prisma.image.aggregate({ _sum: { downloads: true } }),
      prisma.video.aggregate({ _sum: { downloads: true } }),
      prisma.customer.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      prisma.image.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.video.count({ where: { approvalStatus: 'PENDING' } })
    ]);

    const pendingContent = pendingImages + pendingVideos;

    const totalDownloads = (totalImageDownloads._sum.downloads || 0) + (totalVideoDownloads._sum.downloads || 0);
    const totalContent = totalImages + totalVideos;

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalUsers: totalUsers + totalCustomers,
          totalContent,
          totalDownloads,
          activeSubscriptions,
          pendingContent
        },
        breakdown: {
          users: {
            installed: totalUsers,
            customers: totalCustomers
          },
          content: {
            images: totalImages,
            videos: totalVideos
          },
          downloads: {
            images: totalImageDownloads._sum.downloads || 0,
            videos: totalVideoDownloads._sum.downloads || 0
          }
        },
        metrics: {
          conversionRate: totalUsers > 0 ? Math.round((totalCustomers / totalUsers) * 100) : 0,
          contentApprovalRate: totalContent > 0 ? Math.round(((totalContent - pendingContent) / totalContent) * 100) : 0,
          averageDownloadsPerContent: totalContent > 0 ? Math.round((totalDownloads / totalContent) * 100) / 100 : 0
        }
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics'
    });
  }
});

export default router;
