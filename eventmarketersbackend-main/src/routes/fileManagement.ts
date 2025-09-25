import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireStaff } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all file management routes
router.use(authenticateToken);
router.use(requireStaff);

// ============================================
// FILE MANAGEMENT ENDPOINTS
// ============================================

// Get upload directory status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const imagesDir = path.join(uploadDir, 'images');
    const videosDir = path.join(uploadDir, 'videos');
    const thumbnailsDir = path.join(uploadDir, 'thumbnails');

    // Check if directories exist
    const directories = {
      upload: {
        path: uploadDir,
        exists: fs.existsSync(uploadDir),
        writable: false
      },
      images: {
        path: imagesDir,
        exists: fs.existsSync(imagesDir),
        writable: false
      },
      videos: {
        path: videosDir,
        exists: fs.existsSync(videosDir),
        writable: false
      },
      thumbnails: {
        path: thumbnailsDir,
        exists: fs.existsSync(thumbnailsDir),
        writable: false
      }
    };

    // Check write permissions
    Object.keys(directories).forEach(key => {
      const dir = directories[key as keyof typeof directories];
      if (dir.exists) {
        try {
          const testFile = path.join(dir.path, 'test-write.tmp');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          dir.writable = true;
        } catch (error) {
          dir.writable = false;
        }
      }
    });

    // Get directory sizes
    const getDirectorySize = (dirPath: string): number => {
      if (!fs.existsSync(dirPath)) return 0;
      
      let totalSize = 0;
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          totalSize += getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      });
      
      return totalSize;
    };

    const sizes = {
      upload: getDirectorySize(uploadDir),
      images: getDirectorySize(imagesDir),
      videos: getDirectorySize(videosDir),
      thumbnails: getDirectorySize(thumbnailsDir)
    };

    // Get file counts
    const getFileCount = (dirPath: string): number => {
      if (!fs.existsSync(dirPath)) return 0;
      
      let count = 0;
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          count++;
        } else if (stats.isDirectory()) {
          count += getFileCount(filePath);
        }
      });
      
      return count;
    };

    const fileCounts = {
      upload: getFileCount(uploadDir),
      images: getFileCount(imagesDir),
      videos: getFileCount(videosDir),
      thumbnails: getFileCount(thumbnailsDir)
    };

    // Format sizes
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    res.json({
      success: true,
      status: {
        directories,
        sizes: {
          raw: sizes,
          formatted: {
            upload: formatBytes(sizes.upload),
            images: formatBytes(sizes.images),
            videos: formatBytes(sizes.videos),
            thumbnails: formatBytes(sizes.thumbnails)
          }
        },
        fileCounts,
        totalSize: {
          raw: sizes.upload,
          formatted: formatBytes(sizes.upload)
        },
        health: {
          allDirectoriesExist: Object.values(directories).every(dir => dir.exists),
          allDirectoriesWritable: Object.values(directories).every(dir => dir.writable),
          status: Object.values(directories).every(dir => dir.exists && dir.writable) ? 'HEALTHY' : 'ISSUES'
        }
      }
    });

  } catch (error) {
    console.error('Get upload status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upload directory status'
    });
  }
});

// Get supported file types
router.get('/types', async (req: Request, res: Response) => {
  try {
    const allowedImageTypes = (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,webp,gif').split(',');
    const allowedVideoTypes = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,mov,avi,mkv').split(',');
    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '50000000');

    const fileTypes = {
      images: {
        allowed: allowedImageTypes,
        mimeTypes: allowedImageTypes.map(type => `image/${type}`),
        maxSize: maxFileSize,
        maxSizeFormatted: formatBytes(maxFileSize)
      },
      videos: {
        allowed: allowedVideoTypes,
        mimeTypes: allowedVideoTypes.map(type => `video/${type}`),
        maxSize: maxFileSize,
        maxSizeFormatted: formatBytes(maxFileSize)
      }
    };

    res.json({
      success: true,
      fileTypes,
      limits: {
        maxFileSize,
        maxFileSizeFormatted: formatBytes(maxFileSize)
      }
    });

  } catch (error) {
    console.error('Get file types error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file types information'
    });
  }
});

// Clean up orphaned files
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const imagesDir = path.join(uploadDir, 'images');
    const videosDir = path.join(uploadDir, 'videos');
    const thumbnailsDir = path.join(uploadDir, 'thumbnails');

    // Get all files in database
    const [dbImages, dbVideos] = await Promise.all([
      prisma.image.findMany({ select: { url: true } }),
      prisma.video.findMany({ select: { url: true } })
    ]);

    const dbFiles = new Set([
      ...dbImages.map(img => img.url.replace('/uploads/', '')),
      ...dbVideos.map(vid => vid.url.replace('/uploads/', ''))
    ]);

    // Get all files on disk
    const getFilesOnDisk = (dirPath: string): string[] => {
      if (!fs.existsSync(dirPath)) return [];
      
      const files: string[] = [];
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isFile()) {
          files.push(path.relative(uploadDir, itemPath).replace(/\\/g, '/'));
        } else if (stats.isDirectory()) {
          files.push(...getFilesOnDisk(itemPath));
        }
      });
      
      return files;
    };

    const diskFiles = getFilesOnDisk(uploadDir);

    // Find orphaned files
    const orphanedFiles = diskFiles.filter(file => !dbFiles.has(file));

    // Clean up orphaned files
    let cleanedCount = 0;
    let cleanedSize = 0;
    const errors: string[] = [];

    for (const file of orphanedFiles) {
      try {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        cleanedSize += stats.size;
        fs.unlinkSync(filePath);
        cleanedCount++;
      } catch (error) {
        errors.push(`Failed to delete ${file}: ${error}`);
      }
    }

    res.json({
      success: true,
      cleanup: {
        orphanedFilesFound: orphanedFiles.length,
        filesCleaned: cleanedCount,
        spaceFreed: {
          raw: cleanedSize,
          formatted: formatBytes(cleanedSize)
        },
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Cleanup files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup files'
    });
  }
});

// Get file statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const imagesDir = path.join(uploadDir, 'images');
    const videosDir = path.join(uploadDir, 'videos');
    const thumbnailsDir = path.join(uploadDir, 'thumbnails');

    // Get database statistics
    const [totalImages, totalVideos, totalImageSize, totalVideoSize] = await Promise.all([
      prisma.image.count(),
      prisma.video.count(),
      prisma.image.aggregate({ _sum: { fileSize: true } }),
      prisma.video.aggregate({ _sum: { fileSize: true } })
    ]);

    // Get disk statistics
    const getDirectoryStats = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) {
        return { fileCount: 0, totalSize: 0, files: [] };
      }

      let fileCount = 0;
      let totalSize = 0;
      const files: any[] = [];

      const items = fs.readdirSync(dirPath);
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isFile()) {
          fileCount++;
          totalSize += stats.size;
          files.push({
            name: item,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          });
        } else if (stats.isDirectory()) {
          const subStats = getDirectoryStats(itemPath);
          fileCount += subStats.fileCount;
          totalSize += subStats.totalSize;
          files.push(...subStats.files);
        }
      });

      return { fileCount, totalSize, files };
    };

    const diskStats = {
      images: getDirectoryStats(imagesDir),
      videos: getDirectoryStats(videosDir),
      thumbnails: getDirectoryStats(thumbnailsDir)
    };

    const totalDiskFiles = diskStats.images.fileCount + diskStats.videos.fileCount + diskStats.thumbnails.fileCount;
    const totalDiskSize = diskStats.images.totalSize + diskStats.videos.totalSize + diskStats.thumbnails.totalSize;

    res.json({
      success: true,
      stats: {
        database: {
          totalImages,
          totalVideos,
          totalContent: totalImages + totalVideos,
          totalImageSize: totalImageSize._sum.fileSize || 0,
          totalVideoSize: totalVideoSize._sum.fileSize || 0,
          totalSize: (totalImageSize._sum.fileSize || 0) + (totalVideoSize._sum.fileSize || 0)
        },
        disk: {
          totalFiles: totalDiskFiles,
          totalSize: totalDiskSize,
          totalSizeFormatted: formatBytes(totalDiskSize),
          breakdown: {
            images: {
              fileCount: diskStats.images.fileCount,
              totalSize: diskStats.images.totalSize,
              totalSizeFormatted: formatBytes(diskStats.images.totalSize)
            },
            videos: {
              fileCount: diskStats.videos.fileCount,
              totalSize: diskStats.videos.totalSize,
              totalSizeFormatted: formatBytes(diskStats.videos.totalSize)
            },
            thumbnails: {
              fileCount: diskStats.thumbnails.fileCount,
              totalSize: diskStats.thumbnails.totalSize,
              totalSizeFormatted: formatBytes(diskStats.thumbnails.totalSize)
            }
          }
        },
        comparison: {
          databaseVsDisk: {
            files: {
              database: totalImages + totalVideos,
              disk: totalDiskFiles,
              difference: totalDiskFiles - (totalImages + totalVideos)
            },
            size: {
              database: (totalImageSize._sum.fileSize || 0) + (totalVideoSize._sum.fileSize || 0),
              disk: totalDiskSize,
              difference: totalDiskSize - ((totalImageSize._sum.fileSize || 0) + (totalVideoSize._sum.fileSize || 0))
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('Get file stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file statistics'
    });
  }
});

// Create upload directories
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const imagesDir = path.join(uploadDir, 'images');
    const videosDir = path.join(uploadDir, 'videos');
    const thumbnailsDir = path.join(uploadDir, 'thumbnails');

    const directories = [uploadDir, imagesDir, videosDir, thumbnailsDir];
    const results: any[] = [];

    for (const dir of directories) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          results.push({
            path: dir,
            action: 'created',
            success: true
          });
        } else {
          results.push({
            path: dir,
            action: 'already exists',
            success: true
          });
        }
      } catch (error) {
        results.push({
          path: dir,
          action: 'failed to create',
          success: false,
          error: error
        });
      }
    }

    const allSuccessful = results.every(r => r.success);

    res.status(allSuccessful ? 200 : 500).json({
      success: allSuccessful,
      setup: {
        directories: results,
        allSuccessful
      }
    });

  } catch (error) {
    console.error('Setup directories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup upload directories'
    });
  }
});

// Get file information
router.get('/info/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    
    // Search for file in all subdirectories
    const searchFile = (dir: string, targetFile: string): string | null => {
      if (!fs.existsSync(dir)) return null;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isFile() && item === targetFile) {
          return itemPath;
        } else if (stats.isDirectory()) {
          const found = searchFile(itemPath, targetFile);
          if (found) return found;
        }
      }
      return null;
    };

    const filePath = searchFile(uploadDir, filename);
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const stats = fs.statSync(filePath);
    const relativePath = path.relative(uploadDir, filePath).replace(/\\/g, '/');

    // Check if file exists in database
    const [imageRecord, videoRecord] = await Promise.all([
      prisma.image.findFirst({ where: { url: `/${relativePath}` } }),
      prisma.video.findFirst({ where: { url: `/${relativePath}` } })
    ]);

    res.json({
      success: true,
      file: {
        filename,
        path: filePath,
        relativePath: `/${relativePath}`,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        accessedAt: stats.atime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        inDatabase: !!(imageRecord || videoRecord),
        recordType: imageRecord ? 'image' : videoRecord ? 'video' : null,
        databaseRecord: imageRecord || videoRecord || null
      }
    });

  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file information'
    });
  }
});

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
