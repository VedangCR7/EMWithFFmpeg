import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/auth';
import ContentSyncService from '../services/contentSyncService';

const prisma = new PrismaClient();

const router = Router();

// All content sync routes require admin authentication
router.use(requireAdmin);

/**
 * GET /api/content-sync/status
 * Get sync status and statistics
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await ContentSyncService.getSyncStatus();
    
    res.json({
      success: true,
      message: 'Sync status retrieved successfully',
      data: status
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
});

/**
 * POST /api/content-sync/sync-all
 * Sync all approved content to mobile tables
 */
router.post('/sync-all', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Admin triggered full content sync...');
    
    const result = await ContentSyncService.syncAllApprovedContent();
    
    res.json({
      success: true,
      message: 'Content sync completed successfully',
      data: result
    });

  } catch (error) {
    console.error('Full content sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync content'
    });
  }
});

/**
 * POST /api/content-sync/sync-images
 * Sync approved images to mobile templates
 */
router.post('/sync-images', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Admin triggered image sync...');
    
    const result = await ContentSyncService.syncApprovedImages();
    
    res.json({
      success: true,
      message: 'Image sync completed successfully',
      data: result
    });

  } catch (error) {
    console.error('Image sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync images'
    });
  }
});

/**
 * POST /api/content-sync/sync-videos
 * Sync approved videos to mobile videos
 */
router.post('/sync-videos', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Admin triggered video sync...');
    
    const result = await ContentSyncService.syncApprovedVideos();
    
    res.json({
      success: true,
      message: 'Video sync completed successfully',
      data: result
    });

  } catch (error) {
    console.error('Video sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync videos'
    });
  }
});

/**
 * POST /api/content-sync/sync-image/:id
 * Sync specific image to mobile template
 */
router.post('/sync-image/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Admin triggered sync for image: ${id}`);
    
    const result = await ContentSyncService.syncSpecificImage(id);
    
    res.json({
      success: true,
      message: 'Image synced successfully',
      data: result
    });

  } catch (error) {
    console.error('Specific image sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync image'
    });
  }
});

/**
 * POST /api/content-sync/sync-video/:id
 * Sync specific video to mobile video
 */
router.post('/sync-video/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Admin triggered sync for video: ${id}`);
    
    const result = await ContentSyncService.syncSpecificVideo(id);
    
    res.json({
      success: true,
      message: 'Video synced successfully',
      data: result
    });

  } catch (error) {
    console.error('Specific video sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync video'
    });
  }
});

/**
 * GET /api/content-sync/pending
 * Get pending content that needs to be synced
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const [pendingImages, pendingVideos] = await Promise.all([
      prisma.image.findMany({
        where: {
          approvalStatus: 'APPROVED',
          isMobileSynced: false
        },
        select: {
          id: true,
          title: true,
          category: true,
          approvalStatus: true,
          approvedAt: true,
          createdAt: true
        },
        orderBy: { approvedAt: 'desc' }
      }),
      prisma.video.findMany({
        where: {
          approvalStatus: 'APPROVED',
          isMobileSynced: false
        },
        select: {
          id: true,
          title: true,
          category: true,
          approvalStatus: true,
          approvedAt: true,
          createdAt: true
        },
        orderBy: { approvedAt: 'desc' }
      })
    ]);

    res.json({
      success: true,
      message: 'Pending content retrieved successfully',
      data: {
        images: pendingImages,
        videos: pendingVideos,
        total: pendingImages.length + pendingVideos.length
      }
    });

  } catch (error) {
    console.error('Get pending content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending content'
    });
  }
});

export default router;
