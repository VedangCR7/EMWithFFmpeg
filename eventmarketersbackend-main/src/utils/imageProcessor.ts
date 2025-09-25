import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface ImageProcessingResult {
  success: boolean;
  thumbnailUrl?: string;
  dimensions?: string;
  error?: string;
}

export class ImageProcessor {
  private static instance: ImageProcessor;
  private sharpAvailable: boolean = false;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): ImageProcessor {
    if (!ImageProcessor.instance) {
      ImageProcessor.instance = new ImageProcessor();
    }
    return ImageProcessor.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Test Sharp availability
      await sharp({
        create: {
          width: 1,
          height: 1,
          channels: 3,
          background: { r: 0, g: 0, b: 0 }
        }
      }).png().toBuffer();
      
      this.sharpAvailable = true;
      console.log('✅ Sharp library is available and working');
    } catch (error) {
      this.sharpAvailable = false;
      console.warn('⚠️ Sharp library is not available:', error);
    }

    this.initialized = true;
  }

  public async processImage(
    inputPath: string,
    outputDir: string,
    filename: string
  ): Promise<ImageProcessingResult> {
    await this.initialize();

    if (!this.sharpAvailable) {
      return {
        success: false,
        error: 'Sharp library is not available'
      };
    }

    try {
      const thumbnailFilename = 'thumb_' + filename;
      const thumbnailPath = path.join(outputDir, thumbnailFilename);

      // Generate thumbnail
      await sharp(inputPath)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Get image dimensions
      const metadata = await sharp(inputPath).metadata();
      const dimensions = `${metadata.width}x${metadata.height}`;

      return {
        success: true,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
        dimensions
      };
    } catch (error) {
      return {
        success: false,
        error: `Image processing failed: ${error}`
      };
    }
  }

  public async getImageDimensions(inputPath: string): Promise<{ width?: number; height?: number }> {
    await this.initialize();

    if (!this.sharpAvailable) {
      return {};
    }

    try {
      const metadata = await sharp(inputPath).metadata();
      return {
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      console.warn('Failed to get image dimensions:', error);
      return {};
    }
  }

  public isSharpAvailable(): boolean {
    return this.sharpAvailable;
  }
}

// Alternative image processing using Node.js built-in modules
export class FallbackImageProcessor {
  public static async processImage(
    inputPath: string,
    outputDir: string,
    filename: string
  ): Promise<ImageProcessingResult> {
    try {
      // For fallback, we'll just copy the original file as thumbnail
      // This is a simple fallback that doesn't require Sharp
      const thumbnailFilename = 'thumb_' + filename;
      const thumbnailPath = path.join(outputDir, thumbnailFilename);

      // Copy the original file as thumbnail (simple fallback)
      fs.copyFileSync(inputPath, thumbnailPath);

      // Try to get basic file info
      const stats = fs.statSync(inputPath);
      
      return {
        success: true,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
        dimensions: 'Unknown' // We can't get dimensions without Sharp
      };
    } catch (error) {
      return {
        success: false,
        error: `Fallback processing failed: ${error}`
      };
    }
  }

  public static async getImageDimensions(inputPath: string): Promise<{ width?: number; height?: number }> {
    // Without Sharp, we can't get image dimensions
    return {};
  }
}

// Main image processing function with fallback
export async function processImageWithFallback(
  inputPath: string,
  outputDir: string,
  filename: string
): Promise<ImageProcessingResult> {
  const processor = ImageProcessor.getInstance();
  
  // Try Sharp first
  const result = await processor.processImage(inputPath, outputDir, filename);
  
  if (result.success) {
    return result;
  }

  // Fallback to simple processing
  console.log('🔄 Falling back to simple image processing');
  return await FallbackImageProcessor.processImage(inputPath, outputDir, filename);
}

// Get image dimensions with fallback
export async function getImageDimensionsWithFallback(
  inputPath: string
): Promise<{ width?: number; height?: number }> {
  const processor = ImageProcessor.getInstance();
  
  if (processor.isSharpAvailable()) {
    return await processor.getImageDimensions(inputPath);
  }

  return await FallbackImageProcessor.getImageDimensions(inputPath);
}
