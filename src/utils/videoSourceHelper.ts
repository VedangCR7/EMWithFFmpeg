import { Platform, Image } from 'react-native';
import RNFS from 'react-native-fs';

/**
 * Video Source Helper - Enhanced Version
 * 
 * Key improvements:
 * 1. Fixed fallback URL to use valid MP4: big_buck_bunny_720p_1mb.mp4
 * 2. Removed android.resource:// support from isLocalFile (RNFS.copyFile incompatible)
 * 3. Android always downloads from Metro asset (no more android.resource:// issues)
 * 4. Enhanced error handling with guaranteed fallback to remote download
 * 5. File validation to ensure no empty MP4 files
 */

/**
 * Video source configuration interface
 */
export interface VideoSourceConfig {
  /** Primary video file name (without extension) */
  fileName?: string;
  /** Fallback remote URL if local files are not available */
  fallbackUrl?: string;
  /** Whether to use remote URL as primary source */
  useRemote?: boolean;
}

/**
 * Video source result interface
 */
export interface VideoSourceResult {
  /** The video source URI */
  uri: string;
  /** Whether this is a local file path */
  isLocal: boolean;
  /** Platform-specific source type */
  sourceType: 'android_raw' | 'ios_bundle' | 'remote' | 'metro';
  /** Error message if source resolution failed */
  error?: string;
}

/**
 * Default video source configuration
 */
const DEFAULT_CONFIG: Required<VideoSourceConfig> = {
  fileName: 'test',
  fallbackUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
  useRemote: false,
};

/**
 * Get platform-specific video source
 * 
 * @param config - Video source configuration
 * @returns Promise<VideoSourceResult> - Video source information
 */
export const getVideoSource = async (config: VideoSourceConfig = {}): Promise<VideoSourceResult> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    // If explicitly using remote, return remote URL
    if (finalConfig.useRemote) {
      return {
        uri: finalConfig.fallbackUrl,
        isLocal: false,
        sourceType: 'remote',
      };
    }

    // Platform-specific local file handling
    if (Platform.OS === 'android') {
      return await getAndroidVideoSource(finalConfig.fileName);
    } else if (Platform.OS === 'ios') {
      return await getIOSVideoSource(finalConfig.fileName);
    } else {
      // Fallback for other platforms (web, etc.)
      return {
        uri: finalConfig.fallbackUrl,
        isLocal: false,
        sourceType: 'remote',
        error: `Unsupported platform: ${Platform.OS}`,
      };
    }
  } catch (error) {
    console.error('🚨 Failed to get video source:', error);
    
    // Return fallback remote URL on any error
    return {
      uri: finalConfig.fallbackUrl,
      isLocal: false,
      sourceType: 'remote',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get Android video source from raw resources
 */
const getAndroidVideoSource = async (fileName: string): Promise<VideoSourceResult> => {
  try {
    // Android raw resource path
    const rawResourcePath = `android.resource://com.eventmarketers/raw/${fileName}`;
    
    // Verify the file exists by checking if we can access it
    // Note: We can't directly check raw resources, so we'll assume it exists
    // and let the video player handle any errors
    
    console.log('📱 Using Android raw resource:', rawResourcePath);
    
    return {
      uri: rawResourcePath,
      isLocal: true,
      sourceType: 'android_raw',
    };
  } catch (error) {
    throw new Error(`Failed to get Android video source: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get iOS video source from bundle
 */
const getIOSVideoSource = async (fileName: string): Promise<VideoSourceResult> => {
  try {
    // iOS bundle path
    const bundlePath = `${RNFS.MainBundlePath}/${fileName}.mp4`;
    
    // Check if file exists in bundle
    const fileExists = await RNFS.exists(bundlePath);
    
    if (fileExists) {
      console.log('🍎 Using iOS bundle resource:', bundlePath);
      
      return {
        uri: bundlePath,
        isLocal: true,
        sourceType: 'ios_bundle',
      };
    } else {
      throw new Error(`Video file not found in iOS bundle: ${bundlePath}`);
    }
  } catch (error) {
    throw new Error(`Failed to get iOS video source: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get video source for React Native Video component
 * This returns the source object format expected by react-native-video
 * For Video component, we use Metro assets directly as they work better
 */
export const getVideoComponentSource = async (config: VideoSourceConfig = {}) => {
  try {
    // For Video component, always use Metro asset as it works reliably
    console.log('📹 Getting video component source (using Metro asset)...');
    return require('../assets/video/test.mp4');
  } catch (error) {
    console.error('🚨 Failed to get video component source:', error);
    throw error;
  }
};

/**
 * Get video source for native modules (like VideoComposer)
 * This ensures we ALWAYS have a valid file:// URI for native processing
 * Downloads and copies all sources to local cache directory
 */
export const getNativeVideoSource = async (config: VideoSourceConfig = {}): Promise<string> => {
  try {
    console.log('🎬 Getting native video source for VideoComposer...');
    
    // Always ensure we have a local file:// path for native modules
    const localFilePath = await ensureLocalVideoFile(config);
    
    console.log('✅ Native video source ready:', localFilePath);
    return localFilePath;
  } catch (error) {
    console.error('🚨 Failed to get native video source:', error);
    throw new Error(`Failed to get native video source: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Ensure we have a local video file for native processing
 * Handles all video sources (Android raw, iOS bundle, remote URLs) and converts them to local files
 * Always falls back to remote download if local resolution fails
 */
const ensureLocalVideoFile = async (config: VideoSourceConfig = {}): Promise<string> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const cacheFileName = `tempVideo_${finalConfig.fileName}.mp4`;
  const cachePath = `${RNFS.CachesDirectoryPath}/${cacheFileName}`;
  
  try {
    // Check if we already have a cached version
    const cachedFileExists = await RNFS.exists(cachePath);
    if (cachedFileExists) {
      console.log('📁 Using cached video file:', cachePath);
      return `file://${cachePath}`;
    }
    
    console.log('📁 Cache miss, preparing video file...');
    
    // Try platform-specific local resolution first
    try {
      if (finalConfig.useRemote) {
        // Download remote video
        return await downloadRemoteVideo(finalConfig.fallbackUrl, cachePath);
      } else if (Platform.OS === 'android') {
        // Copy Android raw resource to cache
        return await copyAndroidRawToCache(finalConfig.fileName, cachePath);
      } else if (Platform.OS === 'ios') {
        // Copy iOS bundle resource to cache
        return await copyIOSBundleToCache(finalConfig.fileName, cachePath);
      } else {
        // Unsupported platform, fall back to remote download
        console.log('⚠️ Unsupported platform, falling back to remote download');
        return await downloadRemoteVideo(finalConfig.fallbackUrl, cachePath);
      }
    } catch (localError) {
      // If local resolution fails, always fall back to remote download
      console.warn('⚠️ Local video resolution failed, falling back to remote download:', localError);
      console.log('📥 Downloading fallback video from:', finalConfig.fallbackUrl);
      return await downloadRemoteVideo(finalConfig.fallbackUrl, cachePath);
    }
  } catch (error) {
    console.error('🚨 Failed to ensure local video file:', error);
    throw new Error(`Failed to ensure local video file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Copy Android raw resource to cache directory
 * Note: Always downloads from Metro asset as RNFS.copyFile cannot handle android.resource:// URIs
 */
const copyAndroidRawToCache = async (fileName: string, cachePath: string): Promise<string> => {
  try {
    console.log('📱 Processing Android video source to cache...');
    
    // Always use Metro asset resolution for Android
    // This ensures we get a valid URI that can be downloaded
    const metroAsset = require('../assets/video/test.mp4');
    const resolvedAsset = Image.resolveAssetSource(metroAsset);
    
    if (!resolvedAsset?.uri) {
      throw new Error('Could not resolve Metro asset for Android');
    }
    
    console.log('📁 Metro asset URI:', resolvedAsset.uri);
    
    // Always download from Metro server - this is the most reliable approach
    // RNFS.copyFile cannot handle android.resource:// URIs, so we always download
    console.log('📥 Downloading from Metro server to cache...');
    const downloadResult = await RNFS.downloadFile({
      fromUrl: resolvedAsset.uri,
      toFile: cachePath,
    }).promise;
    
    if (downloadResult.statusCode === 200) {
      console.log('✅ Android video downloaded from Metro server');
      console.log('📁 Local video path:', `file://${cachePath}`);
      return `file://${cachePath}`;
    } else {
      throw new Error(`Metro download failed with status: ${downloadResult.statusCode}`);
    }
  } catch (error) {
    console.error('🚨 Failed to process Android video source:', error);
    throw new Error(`Failed to process Android video source: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Copy iOS bundle resource to cache directory
 * Note: Uses RNFS.copyFile which works reliably with iOS bundle paths
 */
const copyIOSBundleToCache = async (fileName: string, cachePath: string): Promise<string> => {
  try {
    console.log('🍎 Copying iOS bundle resource to cache...');
    
    const bundlePath = `${RNFS.MainBundlePath}/${fileName}.mp4`;
    console.log('📁 Bundle path:', bundlePath);
    
    const fileExists = await RNFS.exists(bundlePath);
    if (!fileExists) {
      throw new Error(`Video file not found in iOS bundle: ${bundlePath}`);
    }
    
    // Copy from bundle to cache - this works reliably on iOS
    await RNFS.copyFile(bundlePath, cachePath);
    console.log('✅ iOS video copied from bundle');
    console.log('📁 Local video path:', `file://${cachePath}`);
    return `file://${cachePath}`;
  } catch (error) {
    console.error('🚨 Failed to copy iOS bundle resource:', error);
    throw new Error(`Failed to copy iOS bundle resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Download remote video to cache directory
 * Note: This is the final fallback to ensure we always have a valid video file
 */
const downloadRemoteVideo = async (remoteUrl: string, cachePath: string): Promise<string> => {
  try {
    console.log('📥 Downloading remote video:', remoteUrl);
    console.log('📁 Cache path:', cachePath);
    
    const downloadResult = await RNFS.downloadFile({
      fromUrl: remoteUrl,
      toFile: cachePath,
    }).promise;
    
    if (downloadResult.statusCode === 200) {
      // Verify the downloaded file exists and has content
      const fileExists = await RNFS.exists(cachePath);
      if (!fileExists) {
        throw new Error('Downloaded file does not exist');
      }
      
      const fileStats = await RNFS.stat(cachePath);
      if (fileStats.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      console.log('✅ Remote video downloaded successfully');
      console.log('📁 File size:', fileStats.size, 'bytes');
      console.log('📁 Local video path:', `file://${cachePath}`);
      return `file://${cachePath}`;
    } else {
      throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
    }
  } catch (error) {
    console.error('🚨 Failed to download remote video:', error);
    throw new Error(`Failed to download remote video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Utility function to check if a URI is a valid local file
 * Note: Removed android.resource:// support as RNFS.copyFile cannot handle these URIs
 */
export const isLocalFile = (uri: string): boolean => {
  return uri.startsWith('file://') || 
         uri.startsWith(RNFS.MainBundlePath);
};

/**
 * Utility function to get file extension from URI
 */
export const getFileExtension = (uri: string): string => {
  const match = uri.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
};

/**
 * Utility function to validate video file format
 */
export const isValidVideoFormat = (uri: string): boolean => {
  const extension = getFileExtension(uri);
  const validExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
  return validExtensions.includes(extension);
};

/**
 * Clear video cache directory
 * Useful for debugging or when you want to force re-download
 */
export const clearVideoCache = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing video cache...');
    const cacheDir = RNFS.CachesDirectoryPath;
    const files = await RNFS.readDir(cacheDir);
    
    const videoFiles = files.filter(file => 
      file.name.startsWith('tempVideo_') && file.name.endsWith('.mp4')
    );
    
    for (const file of videoFiles) {
      await RNFS.unlink(file.path);
      console.log('🗑️ Deleted cached video:', file.name);
    }
    
    console.log('✅ Video cache cleared');
  } catch (error) {
    console.error('🚨 Failed to clear video cache:', error);
    throw new Error(`Failed to clear video cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get video cache info
 */
export const getVideoCacheInfo = async (): Promise<{count: number, totalSize: number, files: string[]}> => {
  try {
    const cacheDir = RNFS.CachesDirectoryPath;
    const files = await RNFS.readDir(cacheDir);
    
    const videoFiles = files.filter(file => 
      file.name.startsWith('tempVideo_') && file.name.endsWith('.mp4')
    );
    
    const totalSize = videoFiles.reduce((sum, file) => sum + file.size, 0);
    const fileNames = videoFiles.map(file => file.name);
    
    return {
      count: videoFiles.length,
      totalSize,
      files: fileNames,
    };
  } catch (error) {
    console.error('🚨 Failed to get video cache info:', error);
    return { count: 0, totalSize: 0, files: [] };
  }
};
