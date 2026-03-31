import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

// Django Backend Overlay Types
export interface TextOverlay {
  type: 'text';
  text: string;
  x: number;
  y: number;
  fontsize?: number;
  color?: string;
  start?: number;
  end?: number;
  fontfile?: string;
}

export interface ImageOverlay {
  type: 'image';
  path: string; // Required for Django - server-side image path
  x: number;
  y: number;
  start?: number;
  end?: number;
}

export type Overlay = TextOverlay | ImageOverlay;

export interface CompositionOptions {
  overlays?: Overlay[];
  outputName?: string;
}

export interface CompositionProgress {
  stage: 'uploading' | 'processing' | 'downloading' | 'complete';
  progress: number;
  message: string;
}

export interface CompositionResult {
  success: boolean;
  videoPath?: string;
  error?: string;
  jobId?: string;
  processingTime?: number;
}

// Django API Response Types
interface DjangoJobResponse {
  message: string;
  job_id: string;
  status: string;
  job: {
    id: string;
    status: string;
    created_at: string;
    completed_at?: string;
    processing_time?: number;
    error_message?: string;
  };
}

interface DjangoJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input_video: string;
  output_video?: string;
  created_at: string;
  completed_at?: string;
  processing_time?: number;
  error_message?: string;
  overlays: any[];
  logs: any[];
}

class VideoCompositionService {
  private baseUrl: string;
  private uploadProgressCallback?: (progress: number) => void;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    console.log('🎬 CloudVideoCompositionService initialized with Django backend:', baseUrl);
    console.log('🔍 DEBUG: Base URL set to:', this.baseUrl);
    console.log('🔍 DEBUG: Full health check URL will be:', `${this.baseUrl}/api/health/`);
  }

  /**
   * Set upload progress callback
   */
  setUploadProgressCallback(callback: (progress: number) => void) {
    this.uploadProgressCallback = callback;
  }

  /**
   * Compose video with overlays - Django Backend API
   */
  async composeVideo(
    videoPath: string,
    overlays: Overlay[],
    options: CompositionOptions = {},
    onProgress?: (progress: CompositionProgress) => void
  ): Promise<CompositionResult> {
    const jobId = this.generateJobId();
    
    try {
      console.log('🌐 Starting Django cloud video composition...');
      console.log('📹 Video:', videoPath);
      console.log('🖼️ Overlays:', overlays.length);
      console.log('🖼️ Overlay array:', overlays);
      console.log('⚙️ Options:', options);
      console.log('🔍 Job ID:', jobId);

      // Stage 1: Upload files and start processing
      onProgress?.({
        stage: 'uploading',
        progress: 10,
        message: 'Uploading files to Django server...'
      });

      const uploadResult = await this.startVideoProcessing(videoPath, overlays, options);
      
      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error,
          jobId
        };
      }

      const djangoJobId = uploadResult.jobId!;
      console.log('✅ Processing started, Django Job ID:', djangoJobId);

      // Stage 2: Poll for completion
      onProgress?.({
        stage: 'processing',
        progress: 30,
        message: 'Processing video on server...'
      });

      const processingResult = await this.pollJobStatus(djangoJobId, onProgress);
      
      if (!processingResult.success) {
        return {
          success: false,
          error: processingResult.error,
          jobId: djangoJobId
        };
      }

      // Stage 3: Download result
      onProgress?.({
        stage: 'downloading',
        progress: 90,
        message: 'Downloading processed video...'
      });

      const downloadResult = await this.downloadProcessedVideo(djangoJobId);
      
      if (!downloadResult.success) {
        return {
          success: false,
          error: downloadResult.error,
          jobId: djangoJobId
        };
      }

      // Stage 4: Complete
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Video composition complete!'
      });

      return {
        success: true,
        videoPath: downloadResult.videoPath,
        jobId: djangoJobId,
        processingTime: processingResult.processingTime
      };

    } catch (error) {
      console.error('❌ Cloud composition error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId
      };
    }
  }

  /**
   * Start video processing on Django backend
   */
  private async startVideoProcessing(
    videoPath: string,
    overlays: Overlay[],
    options: CompositionOptions
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      const formData = new FormData();

      // Add video URL/path - Django API format
      formData.append('video', videoPath);

      // Add overlays as JSON string - Django API format
      console.log(`🔍 Processing ${overlays.length} overlays`);
      console.log('🖼️ Overlay data:', overlays);
      
      const overlaysJson = JSON.stringify(overlays);
      console.log('📝 Overlays JSON string:', overlaysJson);
      
      formData.append('overlays', overlaysJson);

      // Add output name if provided
      if (options.outputName) {
        formData.append('output_name', options.outputName);
      } else {
        formData.append('output_name', `result_${Date.now()}.mp4`);
      }

      // Add canvas dimensions if provided
      if (options.canvasWidth) {
        formData.append('canvas_width', options.canvasWidth.toString());
      }
      if (options.canvasHeight) {
        formData.append('canvas_height', options.canvasHeight.toString());
      }

      console.log('📤 Uploading to Django server...');
      console.log('📤 Base URL:', this.baseUrl);
      console.log('📤 Full URL:', `${this.baseUrl}/api/process/`);
      console.log('🔍 DEBUG: FormData contents:');
      console.log('🔍 DEBUG: - Video URL:', videoPath);
      console.log('🔍 DEBUG: - Overlays JSON:', overlaysJson);
      console.log('🔍 DEBUG: - Output name:', options.outputName || `result_${Date.now()}.mp4`);
    console.log('🔍 DEBUG: - Canvas width:', options.canvasWidth, typeof options.canvasWidth);
    console.log('🔍 DEBUG: - Canvas height:', options.canvasHeight, typeof options.canvasHeight);
      console.log('🔍 DEBUG: About to make fetch request...');
      
      // Add timeout to prevent hanging (increased for video processing)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('🔍 DEBUG: Fetch request timeout (60 seconds)');
        controller.abort();
      }, 60000); // 60 second timeout
      
      // First, let's test a simple GET request to see if the server is reachable
      console.log('🔍 DEBUG: Testing server connectivity with health check...');
      try {
        const healthResponse = await fetch(`${this.baseUrl}/api/health/`, {
          method: 'GET',
          signal: controller.signal,
        });
        console.log('🔍 DEBUG: Health check response status:', healthResponse.status);
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('🔍 DEBUG: Health check successful:', healthData);
        } else {
          console.log('🔍 DEBUG: Health check failed:', healthResponse.status);
        }
      } catch (healthError) {
        console.log('🔍 DEBUG: Health check error:', healthError);
        throw new Error(`Server not reachable: ${healthError.message}`);
      }

      const response = await fetch(`${this.baseUrl}/api/process/`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - let React Native handle it with proper boundaries
      });

      clearTimeout(timeoutId);

      console.log('📤 Response status:', response.status);
      console.log('📤 Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('🔍 DEBUG: Response ok:', response.ok);
      console.log('🔍 DEBUG: Response status text:', response.statusText);

      if (!response.ok) {
        console.log('🔍 DEBUG: Response not ok, trying to get error data...');
        const errorData = await response.json().catch(() => ({}));
        console.log('🔍 DEBUG: Error data:', errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      console.log('🔍 DEBUG: Response ok, parsing JSON...');
      const result: DjangoJobResponse = await response.json();
      console.log('🔍 DEBUG: Parsed result:', result);
      console.log('✅ Django processing started:', result);

      return {
        success: true,
        jobId: result.job_id
      };

    } catch (error) {
      console.log('🔍 DEBUG: Start processing error details:');
      console.log('🔍 DEBUG: Error type:', typeof error);
      console.log('🔍 DEBUG: Error message:', (error as Error).message);
      console.log('🔍 DEBUG: Error name:', (error as Error).name);
      console.log('🔍 DEBUG: Error stack:', (error as Error).stack);
      
      if ((error as Error).name === 'AbortError') {
        console.log('🔍 DEBUG: Request was aborted due to timeout');
        return {
          success: false,
          error: 'Request timeout - server took too long to respond'
        };
      }
      
      console.error('❌ Start processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start processing'
      };
    }
  }

  /**
   * Poll Django job status until completion
   */
  private async pollJobStatus(
    jobId: string,
    onProgress?: (progress: CompositionProgress) => void
  ): Promise<{ success: boolean; processingTime?: number; error?: string }> {
    const maxAttempts = 60; // 5 minutes max (5 second intervals) - reduced for smaller video
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        console.log(`🔍 Polling job status (attempt ${attempts + 1}/${maxAttempts}):`, jobId);
        
        const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}/`);
        
        if (!response.ok) {
          throw new Error(`Failed to get job status: ${response.status}`);
        }

        const jobStatus: DjangoJobStatus = await response.json();
        console.log('📊 Job status:', jobStatus.status);

        // Update progress based on job status
        const progressPercent = 30 + (attempts / maxAttempts) * 50; // 30% to 80%
        onProgress?.({
          stage: 'processing',
          progress: Math.min(progressPercent, 80),
          message: `Processing video... (${jobStatus.status})`
        });

        switch (jobStatus.status) {
          case 'completed':
            console.log('✅ Job completed successfully');
            return {
              success: true,
              processingTime: jobStatus.processing_time
            };
          
          case 'failed':
            console.error('❌ Job failed:', jobStatus.error_message);
            return {
              success: false,
              error: jobStatus.error_message || 'Job processing failed'
            };
          
          case 'pending':
          case 'processing':
            // Continue polling
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            attempts++;
            break;
          
          default:
            console.warn('⚠️ Unknown job status:', jobStatus.status);
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        }

      } catch (error) {
        console.error('❌ Polling error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    return {
      success: false,
      error: 'Job processing timed out'
    };
  }
  /**
   * Download processed video from Django server
   */
  private async downloadProcessedVideo(
    jobId: string
  ): Promise<{ success: boolean; videoPath?: string; error?: string }> {
    try {
      console.log('📥 Downloading processed video for job:', jobId);
      
      const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}/download/`);
      
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
      }

      // Create local file path
      const fileName = `composed_${jobId}.mp4`;
      const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

      console.log('📁 Saving to:', localPath);

      // Get the response body as a blob
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;
      // Remove data URL prefix (data:video/mp4;base64,)
      const base64Content = base64Data.split(',')[1];
      
      // Write base64 content to file
      await RNFS.writeFile(localPath, base64Content, 'base64');

      // Verify file exists and has content
      const fileExists = await RNFS.exists(localPath);
      if (!fileExists) {
        throw new Error('Downloaded file does not exist');
      }

      const stats = await RNFS.stat(localPath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      console.log('✅ Video downloaded successfully:', localPath);
      console.log('📊 File size:', stats.size, 'bytes');

      return {
        success: true,
        videoPath: `file://${localPath}`
      };

    } catch (error) {
      console.error('❌ Download error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Get MIME type for image file
   */
  private getImageMimeType(filePath: string): string {
    const extension = this.getImageExtension(filePath).toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Get file extension
   */
  private getImageExtension(filePath: string): string {
    // Remove query parameters and fragments from URL
    const cleanPath = filePath.split('?')[0].split('#')[0];
    const extension = cleanPath.split('.').pop() || 'jpg';
    
    // Ensure we have a valid image extension
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return validExtensions.includes(extension.toLowerCase()) ? extension.toLowerCase() : 'jpg';
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check Django server health
   */
  async checkServerHealth(): Promise<boolean> {
    try {
      console.log('🔍 DEBUG: Starting server health check...');
      console.log('🔍 DEBUG: Health check URL:', `${this.baseUrl}/api/health/`);
      console.log('🏥 Checking Django server health...');
      
      const response = await fetch(`${this.baseUrl}/api/health/`, {
        method: 'GET',
      });

      console.log('🔍 DEBUG: Health check response status:', response.status);
      console.log('🔍 DEBUG: Health check response ok:', response.ok);
      console.log('🔍 DEBUG: Health check response headers:', response.headers);

      if (response.ok) {
        const healthData = await response.json();
        console.log('🔍 DEBUG: Health check response data:', healthData);
        console.log('✅ Server is healthy:', healthData);
        return healthData.status === 'healthy';
      } else {
        console.log('🔍 DEBUG: Health check failed - status:', response.status);
        console.log('🔍 DEBUG: Response text:', await response.text());
        console.warn('⚠️ Server health check failed:', response.status);
        return false;
      }
    } catch (error) {
      console.log('🔍 DEBUG: Health check error details:');
      console.log('🔍 DEBUG: Error type:', typeof error);
      console.log('🔍 DEBUG: Error message:', (error as Error).message);
      console.log('🔍 DEBUG: Error name:', (error as Error).name);
      console.log('🔍 DEBUG: Error stack:', (error as Error).stack);
      console.error('❌ Server health check error:', error);
      return false;
    }
  }

  /**
   * Get server info
   */
  async getServerInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('❌ Server info request failed:', error);
      return null;
    }
  }
}

export default VideoCompositionService;
