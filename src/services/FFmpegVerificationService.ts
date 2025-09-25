import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

export class FFmpegVerificationService {
  /**
   * Verify that FFmpeg 6.1.1 with drawtext is working
   */
  static async verifyCustomFFmpeg(): Promise<{
    version: string;
    hasDrawtext: boolean;
    hasPostproc: boolean;
    hasFreetype: boolean;
    testResult: boolean;
  }> {
    console.log("🔍 === FFmpeg 6.1.1 Verification Starting ===");
    
    const result = {
      version: '',
      hasDrawtext: false,
      hasPostproc: false,
      hasFreetype: false,
      testResult: false
    };

    try {
      // 1. Check FFmpeg version
      console.log("🔍 Checking FFmpeg version...");
      const versionSession = await FFmpegKit.executeAsync("-version");
      const versionOutput = versionSession.getAllLogsAsString();
      
      console.log("📋 FFmpeg Version Output:");
      console.log(versionOutput);
      
      if (versionOutput) {
        const versionMatch = versionOutput.match(/ffmpeg version ([^\s]+)/);
        result.version = versionMatch ? versionMatch[1] : 'Unknown';
        
        console.log("🎯 Detected Version:", result.version);
        console.log("🎯 Is FFmpeg 6.1.1:", result.version.includes('6.1.1'));
        
        // Check build features
        result.hasPostproc = versionOutput.includes('--enable-postproc');
        result.hasFreetype = versionOutput.includes('--enable-libfreetype');
        
        console.log("🔧 Build Features:");
        console.log("  - postproc:", result.hasPostproc ? "✅ ENABLED" : "❌ DISABLED");
        console.log("  - libfreetype:", result.hasFreetype ? "✅ ENABLED" : "❌ DISABLED");
      }

      // 2. Check drawtext availability
      console.log("🔍 Checking drawtext filter...");
      const filtersSession = await FFmpegKit.executeAsync("-filters");
      const filtersOutput = filtersSession.getAllLogsAsString();
      
      if (filtersOutput && filtersOutput.includes('drawtext')) {
        result.hasDrawtext = true;
        console.log("✅ Drawtext filter is AVAILABLE");
      } else {
        console.log("❌ Drawtext filter is NOT available");
        console.log("Filters output:", filtersOutput);
      }

      // 3. Test drawtext functionality
      if (result.hasDrawtext) {
        console.log("🧪 Testing drawtext functionality...");
        try {
          const testCommand = '-f lavfi -i testsrc=duration=1:size=320x240:rate=1 -vf "drawtext=text=\'FFmpeg 6.1.1 Test\':x=10:y=10:fontsize=24:color=white" -t 1 -f null -';
          const testSession = await FFmpegKit.executeAsync(testCommand);
          const testOutput = testSession.getAllLogsAsString();
          const returnCode = testSession.getReturnCode();
          
          console.log("🧪 Drawtext Test:");
          console.log("Return Code:", returnCode);
          console.log("Output:", testOutput);
          
          // Check if test was successful
          result.testResult = this.isReturnCodeSuccess(returnCode);
          console.log("🎯 Drawtext Test Result:", result.testResult ? "✅ SUCCESS" : "❌ FAILED");
          
        } catch (error) {
          console.log("❌ Drawtext test failed:", error);
          result.testResult = false;
        }
      }

      // 4. Summary
      console.log("📊 === Verification Summary ===");
      console.log(`Version: ${result.version}`);
      console.log(`Drawtext Available: ${result.hasDrawtext ? '✅' : '❌'}`);
      console.log(`Postproc Enabled: ${result.hasPostproc ? '✅' : '❌'}`);
      console.log(`Freetype Enabled: ${result.hasFreetype ? '✅' : '❌'}`);
      console.log(`Test Passed: ${result.testResult ? '✅' : '❌'}`);
      
      const isCustomFFmpegWorking = result.version.includes('6.1.1') && 
                                   result.hasDrawtext && 
                                   result.hasPostproc && 
                                   result.testResult;
      
      console.log(`🎯 Custom FFmpeg 6.1.1 Working: ${isCustomFFmpegWorking ? '✅ YES' : '❌ NO'}`);
      
    } catch (error) {
      console.error("❌ FFmpeg verification error:", error);
    }

    return result;
  }

  /**
   * Check if return code indicates success
   */
  private static isReturnCodeSuccess(returnCode: any): boolean {
    try {
      if (ReturnCode.isSuccess) {
        return ReturnCode.isSuccess(returnCode);
      }
      
      if (returnCode && typeof returnCode === 'object') {
        if (returnCode._h !== undefined) {
          return returnCode._h === 0;
        }
        if (returnCode.value !== undefined) {
          return returnCode.value === 0;
        }
      }
      
      if (typeof returnCode === 'number') {
        return returnCode === 0;
      }
      
      return false;
    } catch (error) {
      console.log("⚠️ Error checking return code:", error);
      return false;
    }
  }
}

export default FFmpegVerificationService;

