import { FFmpegKit, ReturnCode, FFmpegSession } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';

export interface VideoLayer {
  id: string;
  type: 'text' | 'image' | 'logo';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: any;
  fieldType?: string;
}

export interface VideoProcessingOptions {
  addWatermark?: boolean;
  compress?: boolean;
  trim?: { start: number; end: number };
  addAudio?: string;
  canvasImage?: string;
  quality?: 'low' | 'medium' | 'high';
  outputFormat?: 'mp4' | 'mov' | 'avi';
  embedOverlays?: boolean;
}

class RealVideoProcessingService {
  private static instance: RealVideoProcessingService;

  public static getInstance(): RealVideoProcessingService {
    if (!RealVideoProcessingService.instance) {
      RealVideoProcessingService.instance = new RealVideoProcessingService();
    }
    return RealVideoProcessingService.instance;
  }

  /**
   * Process video with real FFmpeg commands
   */
  async processVideo(
    videoUri: string,
    layers: VideoLayer[],
    options: {
      width: number;
      height: number;
      duration?: number;
      frameRate?: number;
      quality?: 'low' | 'medium' | 'high';
    }
  ): Promise<string> {
    try {
      console.log('🎬 Starting real FFmpeg video processing...');
      console.log('📁 Input video:', videoUri);
      console.log('🎨 Layers count:', layers.length);

      // Create output path
      const outputPath = `${RNFS.DocumentDirectoryPath}/processed_video_${Date.now()}.mp4`;
      
      // Build FFmpeg command
      let command = this.buildFFmpegCommand(videoUri, outputPath, layers, options);
      
      console.log('🔧 FFmpeg command:', command);

      // Execute FFmpeg command
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        console.log('✅ Video processing completed successfully');
        console.log('📁 Output path:', outputPath);
        return outputPath;
      } else {
        const output = await session.getOutput();
        const failStackTrace = await session.getFailStackTrace();
        console.error('❌ FFmpeg processing failed');
        console.error('📋 Output:', output);
        console.error('🔍 Stack trace:', failStackTrace);
        throw new Error(`FFmpeg processing failed: ${output}`);
      }
    } catch (error) {
      console.error('❌ Video processing error:', error);
      throw error;
    }
  }

  /**
   * Process video for download with embedded overlays
   */
  async processVideoForDownload(
    videoUri: string,
    layers: VideoLayer[],
    options: VideoProcessingOptions = {}
  ): Promise<string> {
    try {
      console.log('📥 Processing video for download with embedded overlays...');
      
      const outputPath = `${RNFS.DocumentDirectoryPath}/download_video_${Date.now()}.mp4`;
      
      // Build command for download processing
      let command = this.buildDownloadCommand(videoUri, outputPath, layers, options);
      
      console.log('🔧 Download FFmpeg command:', command);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        console.log('✅ Download video processing completed');
        return outputPath;
      } else {
        const output = await session.getOutput();
        throw new Error(`Download processing failed: ${output}`);
      }
    } catch (error) {
      console.error('❌ Download processing error:', error);
      throw error;
    }
  }

  /**
   * Capture frame from video
   */
  async captureFrame(
    videoUri: string,
    timestamp: number,
    layers: VideoLayer[]
  ): Promise<string> {
    try {
      console.log('📸 Capturing frame at timestamp:', timestamp);
      
      const outputPath = `${RNFS.DocumentDirectoryPath}/frame_${timestamp}_${Date.now()}.jpg`;
      
      // Build frame capture command
      const command = `-i "${videoUri}" -ss ${timestamp} -vframes 1 -q:v 2 "${outputPath}"`;
      
      console.log('🔧 Frame capture command:', command);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        console.log('✅ Frame captured successfully');
        return outputPath;
      } else {
        const output = await session.getOutput();
        throw new Error(`Frame capture failed: ${output}`);
      }
    } catch (error) {
      console.error('❌ Frame capture error:', error);
      throw error;
    }
  }

  /**
   * Combine frames into video
   */
  async combineFrames(
    frames: string[],
    outputPath: string,
    options: {
      frameRate: number;
      quality: string;
    }
  ): Promise<string> {
    try {
      console.log('🎞️ Combining frames into video...');
      console.log('📁 Frames count:', frames.length);
      
      // Create input pattern for frames
      const inputPattern = frames.length === 1 
        ? `-loop 1 -i "${frames[0]}"`
        : `-framerate ${options.frameRate} -i "${frames[0]}"`;
      
      // Build command
      const command = `${inputPattern} -c:v libx264 -pix_fmt yuv420p -r ${options.frameRate} "${outputPath}"`;
      
      console.log('🔧 Combine frames command:', command);

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        console.log('✅ Frames combined successfully');
        return outputPath;
      } else {
        const output = await session.getOutput();
        throw new Error(`Frame combination failed: ${output}`);
      }
    } catch (error) {
      console.error('❌ Frame combination error:', error);
      throw error;
    }
  }

  /**
   * Build FFmpeg command for video processing
   */
  private buildFFmpegCommand(
    inputPath: string,
    outputPath: string,
    layers: VideoLayer[],
    options: any
  ): string {
    let command = `-i "${inputPath}"`;
    
    // Add video filters for overlays
    if (layers.length > 0) {
      command += this.buildOverlayFilters(layers);
    }
    
    // Add quality settings
    command += this.buildQualitySettings(options.quality);
    
    // Add output format
    command += ` "${outputPath}"`;
    
    return command;
  }

  /**
   * Build FFmpeg command for download processing
   */
  private buildDownloadCommand(
    inputPath: string,
    outputPath: string,
    layers: VideoLayer[],
    options: VideoProcessingOptions
  ): string {
    let command = `-i "${inputPath}"`;
    
    // Add canvas image if provided
    if (options.canvasImage) {
      command += ` -i "${options.canvasImage}"`;
    }
    
    // Add overlay filters
    if (layers.length > 0) {
      command += this.buildOverlayFilters(layers);
    }
    
    // Add watermark if needed
    if (options.addWatermark) {
      command += this.buildWatermarkFilter();
    }
    
    // Add quality settings
    command += this.buildQualitySettings(options.quality);
    
    // Add output format
    command += ` "${outputPath}"`;
    
    return command;
  }

  /**
   * Build overlay filters for layers
   */
  private buildOverlayFilters(layers: VideoLayer[]): string {
    let filters = '';
    
    layers.forEach((layer, index) => {
      if (layer.type === 'text') {
        filters += this.buildTextOverlayFilter(layer, index);
      } else if (layer.type === 'image' || layer.type === 'logo') {
        filters += this.buildImageOverlayFilter(layer, index);
      }
    });
    
    return filters;
  }

  /**
   * Build text overlay filter
   */
  private buildTextOverlayFilter(layer: VideoLayer, index: number): string {
    const { content, position, size } = layer;
    const fontSize = Math.max(12, Math.min(size.height, 48));
    const color = layer.style?.color || '#FFFFFF';
    
    return ` -vf "drawtext=text='${content}':x=${position.x}:y=${position.y}:fontsize=${fontSize}:color=${color.replace('#', '')}"`;
  }

  /**
   * Build image overlay filter
   */
  private buildImageOverlayFilter(layer: VideoLayer, index: number): string {
    const { content, position, size } = layer;
    
    return ` -vf "movie=${content}:scale=${size.width}:${size.height}[overlay${index}];[0:v][overlay${index}]overlay=${position.x}:${position.y}"`;
  }

  /**
   * Build watermark filter
   */
  private buildWatermarkFilter(): string {
    return ` -vf "drawtext=text='EventMarketers':x=10:y=10:fontsize=20:color=white@0.5"`;
  }

  /**
   * Build quality settings
   */
  private buildQualitySettings(quality?: string): string {
    switch (quality) {
      case 'low':
        return ' -crf 28 -preset fast';
      case 'medium':
        return ' -crf 23 -preset medium';
      case 'high':
      default:
        return ' -crf 18 -preset slow';
    }
  }

  /**
   * Test FFmpeg installation
   */
  async testFFmpeg(): Promise<boolean> {
    try {
      console.log('🧪 Testing FFmpeg installation...');
      
      const session = await FFmpegKit.execute('-version');
      const returnCode = await session.getReturnCode();
      
      if (ReturnCode.isSuccess(returnCode)) {
        const output = await session.getOutput();
        console.log('✅ FFmpeg is working!');
        console.log('📋 Version info:', output.substring(0, 200) + '...');
        return true;
      } else {
        console.error('❌ FFmpeg test failed');
        return false;
      }
    } catch (error) {
      console.error('❌ FFmpeg test error:', error);
      return false;
    }
  }

  /**
   * Get FFmpeg version
   */
  async getFFmpegVersion(): Promise<string> {
    try {
      const session = await FFmpegKit.execute('-version');
      const returnCode = await session.getReturnCode();
      
      if (ReturnCode.isSuccess(returnCode)) {
        const output = await session.getOutput();
        const versionMatch = output.match(/ffmpeg version ([^\s]+)/);
        return versionMatch ? versionMatch[1] : 'Unknown';
      } else {
        return 'Unknown';
      }
    } catch (error) {
      console.error('❌ Error getting FFmpeg version:', error);
      return 'Unknown';
    }
  }
}

const realVideoProcessingService = RealVideoProcessingService.getInstance();
export default realVideoProcessingService;
