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
  videoCodec?: 'mpeg4' | 'libx264' | 'h264';
  audioCodec?: 'aac' | 'mp3';
  frameRate?: number;
}

class VideoProcessingService {
  private static instance: VideoProcessingService;

  public static getInstance(): VideoProcessingService {
    if (!VideoProcessingService.instance) {
      VideoProcessingService.instance = new VideoProcessingService();
    }
    return VideoProcessingService.instance;
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
      console.log('🎬 Starting FFmpeg video processing...');
      console.log('📁 Input video:', videoUri);
      console.log('🎨 Layers count:', layers.length);
      console.log('📊 Options:', options);

      // Create output path
      const outputPath = `${RNFS.DocumentDirectoryPath}/processed_video_${Date.now()}.mp4`;
      
      // Build FFmpeg command
      let command = this.buildFFmpegCommand(videoUri, outputPath, layers, options);
      
      console.log('🔧 FFmpeg command:', command);
      console.log('🔧 Command length:', command.length);

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
        console.error('📋 Return code:', returnCode.getValue());
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
    // Remove file:// prefix if present for FFmpeg compatibility
    const cleanInputPath = inputPath.replace('file://', '');
    const cleanOutputPath = outputPath.replace('file://', '');
    
    let command = `-i "${cleanInputPath}"`;
    
    // Add video filters for overlays
    if (layers.length > 0) {
      command += this.buildOverlayFilters(layers);
    }
    
    // Add codec specifications for Android compatibility
    const videoCodec = options.videoCodec || 'mpeg4';
    const audioCodec = options.audioCodec || 'aac';
    command += ` -c:v ${videoCodec} -c:a ${audioCodec}`;
    
    // Add quality settings
    command += this.buildQualitySettings(options.quality);
    
    // Add frame rate if specified
    if (options.frameRate) {
      command += ` -r ${options.frameRate}`;
    }
    
    // Add output format and path
    command += ` -f mp4 "${cleanOutputPath}"`;
    
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
    // Remove file:// prefix if present for FFmpeg compatibility
    const cleanInputPath = inputPath.replace('file://', '');
    const cleanOutputPath = outputPath.replace('file://', '');
    
    let command = `-i "${cleanInputPath}"`;
    
    // Add canvas image if provided
    if (options.canvasImage) {
      const cleanCanvasPath = options.canvasImage.replace('file://', '');
      command += ` -i "${cleanCanvasPath}"`;
    }
    
    // Build all filters as a single chain
    const filters: string[] = [];
    
    // Add overlay filters
    layers.forEach((layer, index) => {
      if (layer.type === 'text') {
        filters.push(this.buildTextOverlayFilter(layer, index));
      } else if (layer.type === 'image' || layer.type === 'logo') {
        filters.push(this.buildImageOverlayFilter(layer, index));
      }
    });
    
    // Add watermark if needed
    if (options.addWatermark) {
      filters.push(this.buildWatermarkFilter());
    }
    
    // Combine all filters into a single -vf parameter
    // Filter out empty filters to avoid double commas
    const validFilters = filters.filter(filter => filter && filter.trim() !== '');
    if (validFilters.length > 0) {
      command += ` -vf "${validFilters.join(',')}"`;
    }
    
    // Add codec specifications for Android compatibility
    const videoCodec = options.videoCodec || 'mpeg4';
    const audioCodec = options.audioCodec || 'aac';
    command += ` -c:v ${videoCodec} -c:a ${audioCodec}`;
    
    // Add quality settings
    command += this.buildQualitySettings(options.quality);
    
    // Add frame rate if specified
    if (options.frameRate) {
      command += ` -r ${options.frameRate}`;
    }
    
    // Add output format and path
    command += ` -f mp4 "${cleanOutputPath}"`;
    
    return command;
  }

  /**
   * Build overlay filters for layers
   */
  private buildOverlayFilters(layers: VideoLayer[]): string {
    if (layers.length === 0) {
      return '';
    }
    
    console.log('🔧 Building overlay filters for', layers.length, 'layers');
    
    // Build all filters as a single chain
    const filters: string[] = [];
    
    layers.forEach((layer, index) => {
      console.log(`🔧 Processing layer ${index}:`, layer.type, layer.content?.substring(0, 50) + '...');
      
      if (layer.type === 'text') {
        const filter = this.buildTextOverlayFilter(layer, index);
        console.log(`🔧 Text filter ${index}:`, filter);
        filters.push(filter);
      } else if (layer.type === 'image' || layer.type === 'logo') {
        const filter = this.buildImageOverlayFilter(layer, index);
        console.log(`🔧 Image filter ${index}:`, filter);
        filters.push(filter);
      }
    });
    
    // Combine all filters into a single -vf parameter
    // Filter out empty filters to avoid double commas
    const validFilters = filters.filter(filter => filter && filter.trim() !== '');
    console.log('🔧 Valid filters count:', validFilters.length);
    console.log('🔧 All filters:', validFilters);
    
    if (validFilters.length > 0) {
      const result = ` -vf "${validFilters.join(',')}"`;
      console.log('🔧 Final filter string:', result);
      return result;
    }
    
    return '';
  }

  /**
   * Build text overlay filter with fallback support
   */
  private buildTextOverlayFilter(layer: VideoLayer, index: number): string {
    const { content, position, size } = layer;
    
    console.log(`🔧 Building text filter ${index}:`, {
      content: content?.substring(0, 50) + '...',
      position,
      size
    });
    
    // Skip empty text content
    if (!content || content.trim() === '') {
      console.log(`🔧 Skipping empty text filter ${index}`);
      return '';
    }
    
    const fontSize = Math.max(12, Math.min(size.height, 48));
    const color = layer.style?.color || '#FFFFFF';
    
    // Try drawtext first, with fallback to subtitle filter
    try {
      const escapedContent = this.escapeTextForFFmpeg(content);
      const result = `drawtext=text='${escapedContent}':x=${position.x}:y=${position.y}:fontsize=${fontSize}:color=${color.replace('#', '')}`;
      console.log(`🔧 Text filter ${index} result:`, result);
      return result;
    } catch (error) {
      console.warn(`⚠️ Drawtext not available, using subtitle filter for ${index}`);
      // Fallback to subtitle filter if drawtext is not available
      return this.buildSubtitleFilter(content, position, fontSize, color, index);
    }
  }

  /**
   * Build subtitle filter as fallback for drawtext
   */
  private buildSubtitleFilter(content: string, position: {x: number, y: number}, fontSize: number, color: string, index: number): string {
    // Create a simple subtitle overlay using subtitles filter
    // This requires a subtitle file, so we'll create a minimal one
    const subtitleFile = `${RNFS.DocumentDirectoryPath}/subtitle_${index}.srt`;
    
    // For now, return empty string and log the issue
    console.warn(`⚠️ Subtitle filter fallback not implemented for filter ${index}`);
    return '';
  }

  /**
   * Check if FFmpeg supports drawtext filter
   */
  async checkDrawtextSupport(): Promise<boolean> {
    try {
      console.log('🔍 Checking FFmpeg drawtext filter support...');
      
      // Test with a simple drawtext command
      const testCommand = `-f lavfi -i testsrc=duration=1:size=320x240:rate=1 -vf "drawtext=text='Test':x=10:y=10:fontsize=20:color=white" -c:v mpeg4 -f mp4 "${RNFS.DocumentDirectoryPath}/drawtext_test_${Date.now()}.mp4"`;
      
      const session = await FFmpegKit.execute(testCommand);
      const returnCode = await session.getReturnCode();
      
      if (ReturnCode.isSuccess(returnCode)) {
        console.log('✅ FFmpeg drawtext filter is supported');
        return true;
      } else {
        const output = await session.getOutput();
        console.log('❌ FFmpeg drawtext filter not supported:', output);
        return false;
      }
    } catch (error) {
      console.log('❌ Error checking drawtext support:', error);
      return false;
    }
  }

  /**
   * Escape text content for FFmpeg drawtext filter
   */
  private escapeTextForFFmpeg(text: string): string {
    return text
      .replace(/\\/g, '\\\\')     // Escape backslashes first
      .replace(/'/g, "\\'")       // Escape single quotes
      .replace(/:/g, '\\:')        // Escape colons
      .replace(/\[/g, '\\[')       // Escape square brackets
      .replace(/\]/g, '\\]')       // Escape square brackets
      .replace(/\(/g, '\\(')       // Escape parentheses
      .replace(/\)/g, '\\)')       // Escape parentheses
      .replace(/\{/g, '\\{')       // Escape curly braces
      .replace(/\}/g, '\\}')       // Escape curly braces
      .replace(/\$/g, '\\$')       // Escape dollar signs
      .replace(/`/g, '\\`')        // Escape backticks
      .replace(/\|/g, '\\|')       // Escape pipes
      .replace(/;/g, '\\;')        // Escape semicolons
      .replace(/,/g, '\\,')        // Escape commas
      .replace(/=/g, '\\=')       // Escape equals signs
      .replace(/\?/g, '\\?')      // Escape question marks
      .replace(/!/g, '\\!')       // Escape exclamation marks
      .replace(/@/g, '\\@')       // Escape at symbols
      .replace(/#/g, '\\#')       // Escape hash symbols
      .replace(/%/g, '\\%')       // Escape percent signs
      .replace(/&/g, '\\&')       // Escape ampersands
      .replace(/\*/g, '\\*')      // Escape asterisks
      .replace(/\+/g, '\\+')     // Escape plus signs
      .replace(/\-/g, '\\-')     // Escape minus signs
      .replace(/\./g, '\\.')     // Escape dots
      .replace(/\//g, '\\/')     // Escape forward slashes
      .replace(/</g, '\\<')      // Escape less than
      .replace(/>/g, '\\>')      // Escape greater than
      .replace(/\^/g, '\\^')     // Escape caret
      .replace(/~/g, '\\~')      // Escape tilde
      .replace(/ /g, '\\ ');     // Escape spaces
  }

  /**
   * Build image overlay filter
   */
  private buildImageOverlayFilter(layer: VideoLayer, index: number): string {
    const { content, position, size } = layer;
    
    console.log(`🔧 Building image filter ${index}:`, {
      content: content?.substring(0, 50) + '...',
      position,
      size
    });
    
    // Skip image overlays for now as they require complex handling
    // FFmpeg drawtext doesn't support image overlays directly
    // Images would need to be downloaded and processed separately
    console.log(`🔧 Skipping image filter ${index} - not supported in drawtext`);
    return '';
  }

  /**
   * Build watermark filter
   */
  private buildWatermarkFilter(): string {
    return `drawtext=text='EventMarketers':x=10:y=10:fontsize=20:color=white@0.5`;
  }

  /**
   * Build quality settings
   */
  private buildQualitySettings(quality?: string): string {
    // Remove preset option as it's not supported in this FFmpeg build
    switch (quality) {
      case 'low':
        return ' -q:v 5';
      case 'medium':
        return ' -q:v 3';
      case 'high':
      default:
        return ' -q:v 2';
    }
  }

  /**
   * Test FFmpeg installation with a simple command
   */
  async testFFmpeg(): Promise<boolean> {
    try {
      console.log('🧪 Testing FFmpeg installation...');
      
      // Test with a simple command first
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
   * Test FFmpeg with a simple drawtext command
   */
  async testFFmpegDrawtext(): Promise<boolean> {
    try {
      console.log('🧪 Testing FFmpeg drawtext filter...');
      
      // Create a simple test video with text overlay
      const testOutputPath = `${RNFS.DocumentDirectoryPath}/test_drawtext_${Date.now()}.mp4`;
      const testCommand = `-f lavfi -i testsrc=duration=2:size=320x240:rate=1 -vf "drawtext=text='Test':x=10:y=10:fontsize=20:color=white" -c:v mpeg4 -c:a aac -f mp4 "${testOutputPath}"`;
      
      console.log('🔧 Test command:', testCommand);
      
      const session = await FFmpegKit.execute(testCommand);
      const returnCode = await session.getReturnCode();
      
      if (ReturnCode.isSuccess(returnCode)) {
        console.log('✅ FFmpeg drawtext test successful!');
        console.log('📁 Test output:', testOutputPath);
        return true;
      } else {
        const output = await session.getOutput();
        console.error('❌ FFmpeg drawtext test failed:', output);
        return false;
      }
    } catch (error) {
      console.error('❌ FFmpeg drawtext test error:', error);
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

const videoProcessingService = VideoProcessingService.getInstance();
export default videoProcessingService;
