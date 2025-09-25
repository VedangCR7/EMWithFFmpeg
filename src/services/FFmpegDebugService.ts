import { FFmpegKit, ReturnCode, FFmpegSession } from 'ffmpeg-kit-react-native';

export interface FFmpegDebugResult {
  version: string;
  filters: string[];
  hasDrawtext: boolean;
  buildInfo: string;
  libraries: string[];
}

export class FFmpegDebugService {
  /**
   * Comprehensive FFmpeg debugging method
   */
  static async debugFFmpeg(): Promise<FFmpegDebugResult> {
    console.log("=== FFmpeg Debug Service Starting ===");
    
    const result: FFmpegDebugResult = {
      version: '',
      filters: [],
      hasDrawtext: false,
      buildInfo: '',
      libraries: []
    };

    try {
      // 0. Test basic FFmpeg loading
      console.log("🔍 Testing basic FFmpeg loading...");
      try {
        const testSession = await FFmpegKit.executeAsync("-version");
        console.log("✅ FFmpeg basic test - Return Code:", testSession.getReturnCode());
        console.log("✅ FFmpeg basic test - Output:", testSession.getAllLogsAsString());
      } catch (error) {
        console.log("❌ FFmpeg basic test failed:", error);
      }

      // 1. Get FFmpeg version
      console.log("🔍 Checking FFmpeg version...");
      const versionSession = await FFmpegKit.executeAsync("-version");
      const versionOutput = versionSession.getAllLogsAsString();
      
      console.log("📋 FFmpeg Version Session Info:");
      console.log("Return Code:", versionSession.getReturnCode());
      console.log("Output:", versionOutput);
      console.log("Output Type:", typeof versionOutput);
      
      result.version = versionOutput || 'No output';
      result.buildInfo = versionOutput || 'No output';

      // 2. Get available filters
      console.log("🔍 Checking FFmpeg filters...");
      const filtersSession = await FFmpegKit.executeAsync("-filters");
      const filtersOutput = filtersSession.getAllLogsAsString();
      
      console.log("🎬 FFmpeg Filters Session Info:");
      console.log("Return Code:", filtersSession.getReturnCode());
      console.log("Output:", filtersOutput);
      console.log("Output Type:", typeof filtersOutput);
      
      // Parse filters from output
      let filterLines: string[] = [];
      let filters: string[] = [];
      
      if (filtersOutput && typeof filtersOutput === 'string') {
        filterLines = filtersOutput.split('\n');
        
        for (const line of filterLines) {
          if (line.includes('drawtext')) {
            result.hasDrawtext = true;
          }
          if (line.trim() && !line.includes('Filter') && !line.includes('---')) {
            const filterName = line.trim().split(/\s+/)[0];
            if (filterName && filterName.length > 0) {
              filters.push(filterName);
            }
          }
        }
      } else {
        console.log("⚠️ Filters output is not a string:", filtersOutput);
      }
      
      result.filters = filters;
      
      console.log(`📊 Total filters found: ${filters.length}`);
      console.log(`✅ Drawtext filter available: ${result.hasDrawtext}`);

      // 3. Get codec information
      console.log("🔍 Checking FFmpeg codecs...");
      const codecsSession = await FFmpegKit.executeAsync("-codecs");
      const codecsOutput = codecsSession.getAllLogsAsString();
      
      console.log("🎵 FFmpeg Codecs Output:");
      console.log(codecsOutput);

      // 4. Test drawtext filter specifically
      if (result.hasDrawtext) {
        console.log("🧪 Testing drawtext filter...");
        try {
          const testSession = await FFmpegKit.executeAsync(
            "-f lavfi -i testsrc=duration=1:size=320x240:rate=1 -vf \"drawtext=text='Test':x=10:y=10:fontsize=24:color=white\" -t 1 -f null -"
          );
          const testOutput = testSession.getAllLogsAsString();
          console.log("✅ Drawtext test successful!");
          console.log("Test output:", testOutput);
        } catch (error) {
          console.log("❌ Drawtext test failed:", error);
        }
      }

      // 5. Get library information
      console.log("🔍 Checking FFmpeg libraries...");
      const libsSession = await FFmpegKit.executeAsync("-protocols");
      const libsOutput = libsSession.getAllLogsAsString();
      
      console.log("📚 FFmpeg Protocols/Libraries:");
      console.log(libsOutput);

      // 6. Get build configuration
      console.log("🔍 Checking FFmpeg build configuration...");
      const configSession = await FFmpegKit.executeAsync("-buildconf");
      const configOutput = configSession.getAllLogsAsString();
      
      console.log("⚙️ FFmpeg Build Configuration:");
      console.log(configOutput);

      console.log("=== FFmpeg Debug Service Complete ===");
      
    } catch (error) {
      console.error("❌ FFmpeg Debug Error:", error);
    }

    return result;
  }

  /**
   * Quick drawtext availability check
   */
  static async checkDrawtextAvailability(): Promise<boolean> {
    try {
      console.log("🔍 Quick drawtext check...");
      const session = await FFmpegKit.executeAsync("-filters");
      const output = session.getAllLogsAsString();
      const hasDrawtext = output.includes('drawtext');
      
      console.log(`Drawtext available: ${hasDrawtext}`);
      return hasDrawtext;
    } catch (error) {
      console.error("❌ Drawtext check error:", error);
      return false;
    }
  }

  /**
   * Get FFmpeg version string
   */
  static async getFFmpegVersion(): Promise<string> {
    try {
      const session = await FFmpegKit.executeAsync("-version");
      const output = session.getAllLogsAsString();
      const versionMatch = output.match(/ffmpeg version ([^\s]+)/);
      return versionMatch ? versionMatch[1] : 'Unknown';
    } catch (error) {
      console.error("❌ Version check error:", error);
      return 'Error';
    }
  }

  /**
   * Test basic FFmpeg functionality
   */
  static async testBasicFunctionality(): Promise<boolean> {
    try {
      console.log("🧪 Testing basic FFmpeg functionality...");
      const session = await FFmpegKit.executeAsync("-version");
      const output = session.getAllLogsAsString();
      const success = output.includes('ffmpeg version');
      
      console.log(`Basic functionality test: ${success ? '✅ PASSED' : '❌ FAILED'}`);
      return success;
    } catch (error) {
      console.error("❌ Basic functionality test failed:", error);
      return false;
    }
  }
}

export default FFmpegDebugService;
