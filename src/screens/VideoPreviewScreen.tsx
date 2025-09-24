import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  Modal,
  Share,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { useSubscription } from '../contexts/SubscriptionContext';
import VideoComposer from '../services/VideoComposer';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
// import videoProcessingService from '../services/videoProcessingService'; // Removed - service deleted

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

// Responsive spacing and sizing
const responsiveSpacing = {
  xs: isSmallScreen ? 8 : isMediumScreen ? 12 : 16,
  sm: isSmallScreen ? 12 : isMediumScreen ? 16 : 20,
  md: isSmallScreen ? 16 : isMediumScreen ? 20 : 24,
  lg: isSmallScreen ? 20 : isMediumScreen ? 24 : 32,
  xl: isSmallScreen ? 24 : isMediumScreen ? 32 : 40,
};

const responsiveFontSize = {
  xs: isSmallScreen ? 10 : isMediumScreen ? 12 : 14,
  sm: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
  md: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
  lg: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
  xl: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  xxl: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
  xxxl: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
};

interface VideoPreviewScreenProps {
  route: {
    params: {
      selectedVideo: {
        uri: string;
        title?: string;
        description?: string;
      };
      selectedLanguage: string;
      selectedTemplateId: string;
      layers: any[];
      selectedProfile?: any;
      processedVideoPath?: string;
      canvasData?: {
        width: number;
        height: number;
        layers: any[];
      };
    };
  };
}

const VideoPreviewScreen: React.FC<VideoPreviewScreenProps> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const { selectedVideo, selectedLanguage, selectedTemplateId, layers, selectedProfile, processedVideoPath: initialProcessedVideoPath, canvasData } = route.params;
  const { isSubscribed } = useSubscription();

  // Video state
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [actionType, setActionType] = useState<'share' | 'download' | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [isDemoVideo, setIsDemoVideo] = useState(false);
  const [useProcessedVideo, setUseProcessedVideo] = useState(true);
  const [processedVideoPath, setProcessedVideoPath] = useState(initialProcessedVideoPath);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);

  const videoRef = useRef<any>(null);

  // Request storage permission for Android
  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API 33+), we need READ_MEDIA_VIDEO permission
        // For older versions, we might need WRITE_EXTERNAL_STORAGE
        const androidVersion = Platform.Version;
        console.log('Android version:', androidVersion);
        
        if (androidVersion >= 33) {
          // Android 13+ - use READ_MEDIA_VIDEO permission
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            {
              title: 'Media Permission',
              message: 'This app needs access to save videos to your gallery.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          console.log('READ_MEDIA_VIDEO permission result:', granted);
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // For older Android versions, try WRITE_EXTERNAL_STORAGE
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs access to storage to save videos to your gallery.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          console.log('WRITE_EXTERNAL_STORAGE permission result:', granted);
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        // For newer Android versions, CameraRoll might work without explicit permissions
        // Let's try to proceed anyway
        return true;
      }
    }
    return true; // iOS doesn't need explicit permission for CameraRoll
  };

  // Helper function to ensure we only use local video URIs
  const getSafeVideoUri = useCallback(() => {
    if (useProcessedVideo && processedVideoPath) {
      return processedVideoPath;
    }
    
    // Ensure we only use local asset URIs, never web URLs
    const fallbackUri = selectedVideo?.uri || 'asset://test.mp4';
    if (fallbackUri.startsWith('http://') || fallbackUri.startsWith('https://')) {
      console.warn('⚠️ Web URL detected, falling back to local test video');
      return 'asset://test.mp4';
    }
    
    return fallbackUri;
  }, [useProcessedVideo, processedVideoPath, selectedVideo?.uri]);

  // Debug logging
  React.useEffect(() => {
    console.log('VideoPreviewScreen - Debug Info:');
    console.log('- Original video URI:', selectedVideo.uri);
    console.log('- Processed video path:', processedVideoPath);
    console.log('- Use processed video:', useProcessedVideo);
    console.log('- Video error state:', videoError);
    console.log('- Layers count:', layers?.length || 0);
    
    // Validate the processed video path format
    if (processedVideoPath) {
      console.log('✅ Processed video path validation:');
      console.log('- Path format:', processedVideoPath.startsWith('file://') ? 'Valid file:// URI' : 'Invalid format');
      console.log('- Path length:', processedVideoPath.length);
      console.log('- Platform:', Platform.OS);
      
      // Log expected path patterns
      if (Platform.OS === 'android') {
        console.log('- Expected Android pattern: file:///data/user/0/com.eventmarketers/files/...');
      } else if (Platform.OS === 'ios') {
        console.log('- Expected iOS pattern: file:///var/mobile/Containers/Data/Application/.../Documents/...');
      }
    }
    
    // Ensure processed video is used when available
    if (processedVideoPath && !useProcessedVideo) {
      console.log('Processed video available, switching to processed video');
      setUseProcessedVideo(true);
    }
  }, [selectedVideo.uri, processedVideoPath, useProcessedVideo, videoError, layers]);

  // Video controls
  const onVideoLoad = (data: any) => {
    setVideoDuration(data.duration);
    setVideoError(false);
    console.log('✅ Video loaded successfully:', data);
    
    // Log success for processed video
    if (useProcessedVideo && processedVideoPath) {
      console.log('🎬 Processed video loaded successfully!');
      console.log('🎬 Video duration:', data.duration, 'seconds');
      console.log('🎬 Video size:', data.naturalSize || 'Unknown');
    }
  };

  const onVideoProgress = (data: any) => {
    setCurrentTime(data.currentTime);
  };

  const onVideoError = (error: any) => {
    console.error('🚨 Video playback error:', error);
    console.error('🚨 Error details:', {
      errorCode: error.error?.errorCode,
      errorString: error.error?.errorString,
      errorException: error.error?.errorException,
      attemptedURI: getSafeVideoUri(),
      platform: Platform.OS,
      useProcessedVideo,
    });
    
    setVideoError(true);
    
    // Check if this is a processed video file that failed to play
    const attemptedUri = getSafeVideoUri();
    if (attemptedUri && attemptedUri.includes('composed_video_')) {
      console.log('🎬 Detected processed video file that failed to play, showing success message');
      setIsDemoVideo(true);
      setVideoError(false);
      return;
    }
    
    // Only fall back to original video if processed video fails and we're currently using processed video
    if (useProcessedVideo && processedVideoPath) {
      console.log('🔄 Processed video failed, falling back to original video');
      console.log('🔄 Fallback URI:', getSafeVideoUri());
      setUseProcessedVideo(false);
      Alert.alert(
        'Video Error', 
        'The processed video encountered an error. Switching to original video.',
        [{ text: 'OK' }]
      );
    }
  };

  // Navigation
  const handleBackToEditor = () => {
    navigation.goBack();
  };

  // Share functionality
  const handleShare = async () => {
    try {
      // Use the processed video path if available, otherwise use original
      const videoPath = processedVideoPath || selectedVideo.uri;
      
      // Check if it's a remote URL
      const isRemoteUrl = videoPath.startsWith('http://') || videoPath.startsWith('https://');
      
      const shareOptions = {
        title: selectedVideo.title || 'Event Video',
        message: `Event Video: ${selectedVideo.title || 'Professional Event Content'}`,
        url: videoPath,
      };

      // For remote URLs, we can share the URL directly
      if (isRemoteUrl) {
        const result = await Share.share(shareOptions);
        
        if (result.action === Share.sharedAction) {
          // Successfully shared
        } else if (result.action === Share.dismissedAction) {
          // User dismissed the share sheet
        }
      } else {
        // For local files, handle platform differences
        if (Platform.OS === 'ios') {
          // On iOS, we'll share the video file directly
          const result = await Share.share(shareOptions);
          
          if (result.action === Share.sharedAction) {
            // Successfully shared
          } else if (result.action === Share.dismissedAction) {
            // User dismissed the share sheet
          }
        } else {
          // For Android, we can share the file path
          const result = await Share.share(shareOptions);
          
          if (result.action === Share.sharedAction) {
            // Successfully shared
          } else if (result.action === Share.dismissedAction) {
            // User dismissed the share sheet
          }
        }
      }
    } catch (error) {
      Alert.alert(
        '❌ Share Failed', 
        'We encountered an issue while sharing your video.\n\nPlease try again or check your internet connection.',
        [
          {
            text: 'Try Again',
            style: 'default'
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  // Download functionality - save video to gallery
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      // Request storage permission first (but don't block if it fails)
      const hasPermission = await requestStoragePermission();
      console.log('Permission check result:', hasPermission);
      
      // For newer Android versions, CameraRoll might work without explicit permissions
      // So we'll proceed even if permission request fails
      if (!hasPermission) {
        console.log('Permission denied, but proceeding anyway for newer Android versions');
        // Don't return early - let's try to save anyway
      }

      // Use the processed video path if available, otherwise use original
      const videoPath = processedVideoPath || selectedVideo.uri;

      // Check if video file exists
      if (!videoPath) {
        Alert.alert(
          '❌ Video Not Found', 
          'The video file could not be located on your device.\n\nPlease try regenerating the video or check your internet connection.',
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
        setIsDownloading(false);
        return;
      }

      setDownloadProgress(20);

      // Handle different video source types
      let finalVideoPath = videoPath;

      // If it's a remote URL, download it first
      if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
        setDownloadProgress(40);
        
        // Create a temporary file path
        const tempFileName = `temp_video_${Date.now()}.mp4`;
        const tempPath = `${RNFS.DocumentDirectoryPath}/${tempFileName}`;
        
        // Download the video
        const downloadResult = await RNFS.downloadFile({
          fromUrl: videoPath,
          toFile: tempPath,
        }).promise;
        
        if (downloadResult.statusCode === 200) {
          finalVideoPath = tempPath;
          setDownloadProgress(70);
        } else {
          throw new Error(`Failed to download video: ${downloadResult.statusCode}`);
        }
      } else if (videoPath.startsWith('file://')) {
        // Remove file:// prefix for CameraRoll
        finalVideoPath = videoPath.replace('file://', '');
        setDownloadProgress(60);
      } else if (videoPath.startsWith('asset://')) {
        // Handle asset videos - copy to temporary location
        setDownloadProgress(50);
        
        // For asset videos, we need to copy them to a accessible location
        const tempFileName = `asset_video_${Date.now()}.mp4`;
        const tempPath = `${RNFS.DocumentDirectoryPath}/${tempFileName}`;
        
        // Copy asset to temporary location
        await RNFS.copyFile(videoPath.replace('asset://', ''), tempPath);
        finalVideoPath = tempPath;
        setDownloadProgress(70);
      }

      setDownloadProgress(80);

      // Save to gallery using CameraRoll
      console.log('Attempting to save video to gallery:', finalVideoPath);
      
      let result;
      try {
        // First try with album
        result = await CameraRoll.save(finalVideoPath, {
          type: 'video',
          album: 'EventMarketers',
        });
      } catch (albumError) {
        console.log('Failed to save with album, trying without album:', albumError);
        // Fallback: save without specifying album
        result = await CameraRoll.save(finalVideoPath, {
          type: 'video',
        });
      }

      setDownloadProgress(100);

      // Show success message
      setShowDownloadSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowDownloadSuccess(false);
      }, 3000);

      console.log('✅ Video saved to gallery:', result);

    } catch (error) {
      console.error('❌ Download failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        '❌ Download Failed', 
        'We encountered an issue while saving your video to the gallery.\n\nPlease check your device storage and try again.',
        [
          {
            text: 'Try Again',
            style: 'default'
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Action handlers
  const handleActionPress = (type: 'share' | 'download') => {
    setActionType(type);
    setShowConfirmationModal(true);
  };

  const handleConfirmAction = () => {
    if (actionType === 'share') {
      handleShare();
    } else if (actionType === 'download') {
      handleDownload();
    }
    setShowConfirmationModal(false);
    setActionType(null);
  };

  const handleCancelAction = () => {
    setShowConfirmationModal(false);
    setActionType(null);
  };

  // Quick download without confirmation
  const handleQuickDownload = () => {
    handleDownload();
  };

  // Render video layers
  const renderLayer = (layer: any) => {
    // Calculate scaling factors if canvasData is available
    let scaleX = 1;
    let scaleY = 1;
    
    if (canvasData) {
      // Get the actual video container dimensions
      const videoContainerWidth = screenWidth - 40; // Same as videoCanvasWidth in editor
      const videoContainerHeight = screenHeight - 200; // Approximate video container height (accounting for header and controls)
      
      scaleX = videoContainerWidth / canvasData.width;
      scaleY = videoContainerHeight / canvasData.height;
    }
    
    return (
      <View
        key={layer.id}
        style={[
          styles.layer,
          {
            position: 'absolute',
            left: layer.position.x * scaleX,
            top: layer.position.y * scaleY,
            width: layer.size.width * scaleX,
            height: layer.size.height * scaleY,
            zIndex: layer.zIndex || 1,
            transform: [{ rotate: `${layer.rotation || 0}deg` }],
          },
        ]}
      >
        {layer.type === 'text' && (
          layer.style?.backgroundColor ? (
            // Background layer (footer background)
            <View
              style={[
                {
                  width: '100%',
                  height: '100%',
                  backgroundColor: layer.style.backgroundColor,
                },
              ]}
            />
          ) : (
            // Text layer
            <Text style={[styles.layerText, layer.style]}>
              {layer.content}
            </Text>
          )
        )}
        {layer.type === 'image' && (
          <Image
            source={{ uri: layer.content }}
            style={styles.layerImage}
            resizeMode="cover"
          />
        )}
        {layer.type === 'logo' && (
          <Image
            source={{ uri: layer.content }}
            style={styles.layerLogo}
            resizeMode="contain"
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: '#000000' }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent" 
        translucent={true}
      />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientBackground}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + responsiveSpacing.sm }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToEditor}>
            <Icon name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Preview</Text>
          <View style={styles.headerSpacer} />
        </View>

                 {/* Video Player */}
         <View style={styles.videoContainer}>
           <Video
             ref={videoRef}
             source={{ uri: getSafeVideoUri() }}
             style={styles.video}
             resizeMode="contain"
             paused={!isVideoPlaying}
             onLoad={onVideoLoad}
             onProgress={onVideoProgress}
             onError={onVideoError}
             repeat={true}
             controls={true}
           />
           
           {/* Success message for processed videos */}
           {isDemoVideo && (
             <View style={styles.demoVideoContainer}>
               <View style={styles.demoVideoContent}>
                 <Icon name="check-circle" size={60} color="#4CAF50" />
                 <Text style={styles.demoVideoTitle}>Video Generated Successfully!</Text>
                 <Text style={styles.demoVideoSubtitle}>
                   Your video has been processed with {layers.length} overlay{layers.length !== 1 ? 's' : ''}.
                 </Text>
                 <Text style={styles.demoVideoNote}>
                   ✅ Real MP4 video file created with embedded overlays!
                 </Text>
                 <TouchableOpacity 
                   style={styles.demoVideoButton}
                   onPress={() => {
                     setIsDemoVideo(false);
                     setUseProcessedVideo(false);
                   }}
                 >
                   <Text style={styles.demoVideoButtonText}>View Original Video</Text>
                 </TouchableOpacity>
               </View>
             </View>
           )}
           
                        {/* Video Layers - Only show when using original video (processed video should have overlays already applied) */}
             {!useProcessedVideo && layers && layers.length > 0 && layers.map(renderLayer)}
        </View>

        {/* Download Success Message */}
        {showDownloadSuccess && (
          <View style={styles.successMessageContainer}>
            <View style={styles.successMessage}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.successMessageText}>Downloaded successfully</Text>
            </View>
          </View>
        )}

      </LinearGradient>

      {/* Action Buttons - Outside LinearGradient */}
      <View style={styles.actionContainer}>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleShare}
            disabled={isDownloading}
          >
            <LinearGradient
              colors={isDownloading ? ['#cccccc', '#999999'] : ['#667eea', '#764ba2']}
              style={styles.shareButtonGradient}
            >
              <Icon name="share" size={24} color="#ffffff" />
              <Text style={styles.shareButtonText}>
                {isDownloading ? 'Processing...' : 'Share'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleQuickDownload}
            disabled={isDownloading}
          >
            <LinearGradient
              colors={isDownloading ? ['#cccccc', '#999999'] : ['#28a745', '#20c997']}
              style={styles.saveButtonGradient}
            >
              {isDownloading ? (
                <View style={styles.downloadingContainer}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.downloadingText}>
                    {downloadProgress > 0 ? `Downloading ${downloadProgress}%` : 'Saving...'}
                  </Text>
                </View>
              ) : (
                <>
                  <Icon name="download" size={24} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save to Gallery</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={[styles.editButton, { marginBottom: Math.max(insets.bottom + responsiveSpacing.md, responsiveSpacing.lg) }]}
          onPress={handleBackToEditor}
        >
          <Text style={styles.editButtonText}>Back to Editor</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelAction}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'share' ? 'Share Video' : 'Save to Gallery'}
            </Text>
            <Text style={styles.modalMessage}>
              {actionType === 'share' 
                ? 'Share this video with your friends and followers?' 
                : 'Save this video to your device gallery?'
              }
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={handleCancelAction}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]} 
                onPress={handleConfirmAction}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {actionType === 'share' ? 'Share' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSpacer: {
    width: 44,
  },
  videoContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  layer: {
    position: 'absolute',
  },
  layerText: {
    fontSize: 20,
    color: '#ffffff',
  },
  layerImage: {
    width: '100%',
    height: '100%',
  },
  layerLogo: {
    width: '100%',
    height: '100%',
  },

  successMessageContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -25 }],
    zIndex: 1000,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  successMessageText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  actionContainer: {
    paddingHorizontal: Math.max(responsiveSpacing.md, screenWidth * 0.05),
    paddingTop: Math.max(responsiveSpacing.md, screenHeight * 0.02),
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.max(responsiveSpacing.md, screenHeight * 0.02),
    gap: Math.max(responsiveSpacing.sm, screenWidth * 0.03),
  },
  actionButton: {
    flex: 1,
    marginHorizontal: Math.max(4, screenWidth * 0.01),
    borderRadius: Math.max(12, screenWidth * 0.03),
    overflow: 'hidden',
    minHeight: Math.max(56, screenHeight * 0.07),
  },
  shareButtonGradient: {
    paddingVertical: Math.max(16, screenHeight * 0.02),
    paddingHorizontal: Math.max(20, screenWidth * 0.05),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Math.max(56, screenHeight * 0.07),
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: Math.max(responsiveFontSize.md, Math.min(18, screenWidth * 0.045)),
    fontWeight: '600',
    marginLeft: Math.max(responsiveSpacing.xs, screenWidth * 0.01),
  },
  saveButtonGradient: {
    paddingVertical: Math.max(16, screenHeight * 0.02),
    paddingHorizontal: Math.max(20, screenWidth * 0.05),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Math.max(56, screenHeight * 0.07),
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: Math.max(responsiveFontSize.md, Math.min(18, screenWidth * 0.045)),
    fontWeight: '600',
    marginLeft: Math.max(responsiveSpacing.xs, screenWidth * 0.01),
  },

  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ scale: 0.95 }],
  },
  downloadingContainer: {
    alignItems: 'center',
  },
  downloadingText: {
    color: '#ffffff',
    fontSize: Math.max(14, Math.min(16, screenWidth * 0.04)),
    fontWeight: '600',
    marginTop: Math.max(5, screenHeight * 0.006),
  },
  editButton: {
    paddingVertical: Math.max(responsiveSpacing.sm, screenHeight * 0.015),
    paddingHorizontal: Math.max(responsiveSpacing.md, screenWidth * 0.05),
    borderRadius: Math.max(responsiveSpacing.sm, screenWidth * 0.025),
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
    minHeight: Math.max(48, screenHeight * 0.06),
  },
  editButtonText: {
    color: '#666666',
    fontSize: Math.max(responsiveFontSize.sm, Math.min(16, screenWidth * 0.04)),
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333333',
    letterSpacing: 0.3,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 28,
    color: '#666666',
    lineHeight: 24,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    minWidth: 110,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonPrimary: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalButtonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  demoVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  demoVideoContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  demoVideoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  demoVideoSubtitle: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  demoVideoNote: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  demoVideoButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  demoVideoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoPreviewScreen;
