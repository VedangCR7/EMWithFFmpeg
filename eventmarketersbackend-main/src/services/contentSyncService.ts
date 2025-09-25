import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ContentSyncService {
  
  /**
   * Sync approved images to mobile templates
   */
  static async syncApprovedImages() {
    try {
      console.log('🔄 Starting image sync...');
      
      // Find approved images that haven't been synced yet
      const approvedImages = await prisma.image.findMany({
        where: {
          approvalStatus: 'APPROVED',
          isMobileSynced: false
        },
        include: {
          businessCategory: true
        }
      });

      console.log(`📊 Found ${approvedImages.length} approved images to sync`);

      let syncedCount = 0;
      let errorCount = 0;

      for (const image of approvedImages) {
        try {
          // Create mobile template from image
          const mobileTemplate = await prisma.mobileTemplate.create({
            data: {
              title: image.title,
              description: image.description,
              imageUrl: image.url,
              fileUrl: image.url, // Same URL for both image and file
              category: this.mapImageCategoryToTemplateCategory(image.category),
              language: 'en', // Default language
              type: this.mapImageCategoryToTemplateType(image.category),
              isPremium: false, // Default to free
              tags: image.tags,
              downloads: image.downloads,
              likes: 0, // Start fresh for mobile
              isActive: true,
              sourceImageId: image.id,
              syncedAt: new Date()
            }
          });

          // Update image sync status
          await prisma.image.update({
            where: { id: image.id },
            data: {
              isMobileSynced: true,
              mobileSyncAt: new Date(),
              mobileTemplateId: mobileTemplate.id
            }
          });

          syncedCount++;
          console.log(`✅ Synced image: ${image.title} → Template: ${mobileTemplate.id}`);

        } catch (error) {
          errorCount++;
          console.error(`❌ Error syncing image ${image.id}:`, error);
        }
      }

      console.log(`🎉 Image sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { syncedCount, errorCount, total: approvedImages.length };

    } catch (error) {
      console.error('❌ Image sync service error:', error);
      throw error;
    }
  }

  /**
   * Sync approved videos to mobile videos
   */
  static async syncApprovedVideos() {
    try {
      console.log('🔄 Starting video sync...');
      
      // Find approved videos that haven't been synced yet
      const approvedVideos = await prisma.video.findMany({
        where: {
          approvalStatus: 'APPROVED',
          isMobileSynced: false
        },
        include: {
          businessCategory: true
        }
      });

      console.log(`📊 Found ${approvedVideos.length} approved videos to sync`);

      let syncedCount = 0;
      let errorCount = 0;

      for (const video of approvedVideos) {
        try {
          // Create mobile video from video
          const mobileVideo = await prisma.mobileVideo.create({
            data: {
              title: video.title,
              description: video.description,
              videoUrl: video.url,
              thumbnailUrl: video.thumbnailUrl,
              category: this.mapVideoCategoryToVideoCategory(video.category),
              language: 'en', // Default language
              type: this.mapVideoCategoryToVideoType(video.category),
              duration: video.duration,
              isPremium: false, // Default to free
              tags: video.tags,
              downloads: video.downloads,
              likes: 0, // Start fresh for mobile
              isActive: true,
              sourceVideoId: video.id,
              syncedAt: new Date()
            }
          });

          // Update video sync status
          await prisma.video.update({
            where: { id: video.id },
            data: {
              isMobileSynced: true,
              mobileSyncAt: new Date(),
              mobileVideoId: mobileVideo.id
            }
          });

          syncedCount++;
          console.log(`✅ Synced video: ${video.title} → Video: ${mobileVideo.id}`);

        } catch (error) {
          errorCount++;
          console.error(`❌ Error syncing video ${video.id}:`, error);
        }
      }

      console.log(`🎉 Video sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { syncedCount, errorCount, total: approvedVideos.length };

    } catch (error) {
      console.error('❌ Video sync service error:', error);
      throw error;
    }
  }

  /**
   * Sync all approved content (images + videos)
   */
  static async syncAllApprovedContent() {
    try {
      console.log('🚀 Starting full content sync...');
      
      const imageResult = await this.syncApprovedImages();
      const videoResult = await this.syncApprovedVideos();
      
      const totalSynced = imageResult.syncedCount + videoResult.syncedCount;
      const totalErrors = imageResult.errorCount + videoResult.errorCount;
      const totalContent = imageResult.total + videoResult.total;
      
      console.log(`🎉 Full sync completed: ${totalSynced} synced, ${totalErrors} errors, ${totalContent} total`);
      
      return {
        images: imageResult,
        videos: videoResult,
        total: {
          synced: totalSynced,
          errors: totalErrors,
          content: totalContent
        }
      };

    } catch (error) {
      console.error('❌ Full content sync error:', error);
      throw error;
    }
  }

  /**
   * Manual sync trigger for specific image
   */
  static async syncSpecificImage(imageId: string) {
    try {
      const image = await prisma.image.findUnique({
        where: { id: imageId },
        include: { businessCategory: true }
      });

      if (!image) {
        throw new Error(`Image with ID ${imageId} not found`);
      }

      if (image.approvalStatus !== 'APPROVED') {
        throw new Error(`Image ${imageId} is not approved for sync`);
      }

      if (image.isMobileSynced) {
        throw new Error(`Image ${imageId} is already synced`);
      }

      // Create mobile template
      const mobileTemplate = await prisma.mobileTemplate.create({
        data: {
          title: image.title,
          description: image.description,
          imageUrl: image.url,
          fileUrl: image.url,
          category: this.mapImageCategoryToTemplateCategory(image.category),
          language: 'en',
          type: this.mapImageCategoryToTemplateType(image.category),
          isPremium: false,
          tags: image.tags,
          downloads: image.downloads,
          likes: 0,
          isActive: true,
          sourceImageId: image.id,
          syncedAt: new Date()
        }
      });

      // Update image sync status
      await prisma.image.update({
        where: { id: image.id },
        data: {
          isMobileSynced: true,
          mobileSyncAt: new Date(),
          mobileTemplateId: mobileTemplate.id
        }
      });

      console.log(`✅ Manually synced image: ${image.title} → Template: ${mobileTemplate.id}`);
      return mobileTemplate;

    } catch (error) {
      console.error(`❌ Manual image sync error for ${imageId}:`, error);
      throw error;
    }
  }

  /**
   * Manual sync trigger for specific video
   */
  static async syncSpecificVideo(videoId: string) {
    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: { businessCategory: true }
      });

      if (!video) {
        throw new Error(`Video with ID ${videoId} not found`);
      }

      if (video.approvalStatus !== 'APPROVED') {
        throw new Error(`Video ${videoId} is not approved for sync`);
      }

      if (video.isMobileSynced) {
        throw new Error(`Video ${videoId} is already synced`);
      }

      // Create mobile video
      const mobileVideo = await prisma.mobileVideo.create({
        data: {
          title: video.title,
          description: video.description,
          videoUrl: video.url,
          thumbnailUrl: video.thumbnailUrl,
          category: this.mapVideoCategoryToVideoCategory(video.category),
          language: 'en',
          type: this.mapVideoCategoryToVideoType(video.category),
          duration: video.duration,
          isPremium: false,
          tags: video.tags,
          downloads: video.downloads,
          likes: 0,
          isActive: true,
          sourceVideoId: video.id,
          syncedAt: new Date()
        }
      });

      // Update video sync status
      await prisma.video.update({
        where: { id: video.id },
        data: {
          isMobileSynced: true,
          mobileSyncAt: new Date(),
          mobileVideoId: mobileVideo.id
        }
      });

      console.log(`✅ Manually synced video: ${video.title} → Video: ${mobileVideo.id}`);
      return mobileVideo;

    } catch (error) {
      console.error(`❌ Manual video sync error for ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Get sync status and statistics
   */
  static async getSyncStatus() {
    try {
      const [
        totalImages,
        syncedImages,
        pendingImages,
        totalVideos,
        syncedVideos,
        pendingVideos,
        totalTemplates,
        totalMobileVideos
      ] = await Promise.all([
        prisma.image.count(),
        prisma.image.count({ where: { isMobileSynced: true } }),
        prisma.image.count({ where: { approvalStatus: 'APPROVED', isMobileSynced: false } }),
        prisma.video.count(),
        prisma.video.count({ where: { isMobileSynced: true } }),
        prisma.video.count({ where: { approvalStatus: 'APPROVED', isMobileSynced: false } }),
        prisma.mobileTemplate.count(),
        prisma.mobileVideo.count()
      ]);

      return {
        images: {
          total: totalImages,
          synced: syncedImages,
          pending: pendingImages,
          syncPercentage: totalImages > 0 ? Math.round((syncedImages / totalImages) * 100) : 0
        },
        videos: {
          total: totalVideos,
          synced: syncedVideos,
          pending: pendingVideos,
          syncPercentage: totalVideos > 0 ? Math.round((syncedVideos / totalVideos) * 100) : 0
        },
        mobile: {
          templates: totalTemplates,
          videos: totalMobileVideos
        }
      };

    } catch (error) {
      console.error('❌ Sync status error:', error);
      throw error;
    }
  }

  // Helper methods for category mapping
  private static mapImageCategoryToTemplateCategory(category: string): string {
    switch (category) {
      case 'BUSINESS': return 'business';
      case 'FESTIVAL': return 'festival';
      case 'GENERAL': return 'general';
      default: return 'general';
    }
  }

  private static mapImageCategoryToTemplateType(category: string): string {
    switch (category) {
      case 'BUSINESS': return 'business';
      case 'FESTIVAL': return 'festival';
      case 'GENERAL': return 'daily';
      default: return 'daily';
    }
  }

  private static mapVideoCategoryToVideoCategory(category: string): string {
    switch (category) {
      case 'BUSINESS': return 'business';
      case 'FESTIVAL': return 'festival';
      case 'GENERAL': return 'general';
      default: return 'general';
    }
  }

  private static mapVideoCategoryToVideoType(category: string): string {
    switch (category) {
      case 'BUSINESS': return 'promotional';
      case 'FESTIVAL': return 'promotional';
      case 'GENERAL': return 'tutorial';
      default: return 'tutorial';
    }
  }
}

export default ContentSyncService;
