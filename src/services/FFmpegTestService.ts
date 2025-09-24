import { FFmpegKit } from 'ffmpeg-kit-react-native';

export interface FFmpegTestResult {
  success: boolean;
  version?: string;
  error?: string;
}

export class FFmpegTestService {
  /**
   * Test basic FFmpeg functionality
   */
  static async testFFmpeg(): Promise<FFmpegTestResult> {
    try {
      console.log('🧪 Testing FFmpeg Kit integration...');
      
      // Test basic FFmpeg command
      const result = await FFmpegKit.execute('-version');
      
      if (result.getReturnCode().isValueSuccess()) {
        const version = result.getOutput();
        console.log('✅ FFmpeg Kit is working!');
        console.log('📋 FFmpeg version:', version);
        
        return {
          success: true,
          version: version
        };
      } else {
        const error = result.getFailStackTrace();
        console.error('❌ FFmpeg Kit test failed:', error);
        
        return {
          success: false,
          error: error || 'Unknown error'
        };
      }
    } catch (error) {
      console.error('❌ FFmpeg Kit error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test video processing capabilities
   */
  static async testVideoProcessing(): Promise<FFmpegTestResult> {
    try {
      console.log('🎬 Testing video processing capabilities...');
      
      // Test if we can get codec information
      const result = await FFmpegKit.execute('-codecs');
      
      if (result.getReturnCode().isValueSuccess()) {
        console.log('✅ Video processing capabilities available');
        
        return {
          success: true,
          version: 'Video processing supported'
        };
      } else {
        const error = result.getFailStackTrace();
        console.error('❌ Video processing test failed:', error);
        
        return {
          success: false,
          error: error || 'Video processing not available'
        };
      }
    } catch (error) {
      console.error('❌ Video processing error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video processing error'
      };
    }
  }

  /**
   * Test specific codec support
   */
  static async testCodecSupport(codec: string): Promise<FFmpegTestResult> {
    try {
      console.log(`🔍 Testing ${codec} codec support...`);
      
      const result = await FFmpegKit.execute(`-codecs | grep ${codec}`);
      
      if (result.getReturnCode().isValueSuccess()) {
        const output = result.getOutput();
        console.log(`✅ ${codec} codec is supported`);
        
        return {
          success: true,
          version: `${codec} codec available`
        };
      } else {
        console.log(`⚠️ ${codec} codec not found or not supported`);
        
        return {
          success: false,
          error: `${codec} codec not supported`
        };
      }
    } catch (error) {
      console.error(`❌ ${codec} codec test error:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : `${codec} codec test error`
      };
    }
  }

  /**
   * Run comprehensive FFmpeg tests
   */
  static async runComprehensiveTest(): Promise<{
    basic: FFmpegTestResult;
    video: FFmpegTestResult;
    h264: FFmpegTestResult;
    mp4: FFmpegTestResult;
  }> {
    console.log('🚀 Running comprehensive FFmpeg tests...');
    
    const [basic, video, h264, mp4] = await Promise.all([
      this.testFFmpeg(),
      this.testVideoProcessing(),
      this.testCodecSupport('h264'),
      this.testCodecSupport('mp4')
    ]);

    const allPassed = basic.success && video.success && h264.success && mp4.success;
    
    console.log('📊 Test Results Summary:');
    console.log(`  Basic FFmpeg: ${basic.success ? '✅' : '❌'}`);
    console.log(`  Video Processing: ${video.success ? '✅' : '❌'}`);
    console.log(`  H.264 Codec: ${h264.success ? '✅' : '❌'}`);
    console.log(`  MP4 Format: ${mp4.success ? '✅' : '❌'}`);
    console.log(`  Overall: ${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`);

    return { basic, video, h264, mp4 };
  }
}

export default FFmpegTestService;
