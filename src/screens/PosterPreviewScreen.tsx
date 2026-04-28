import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  Platform,
  ToastAndroid,
  PermissionsAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import Share from 'react-native-share';
import authService from '../services/auth';
// import RNFS from 'react-native-fs'; // Removed - package uninstalled
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import downloadedPostersService from '../services/downloadedPosters';
import { useTheme } from '../context/ThemeContext';
import { useBusinessProfile } from '../context/BusinessProfileContext';
import { useCentralizedDownload } from '../hooks/useCentralizedDownload';
import { subscribeToShowDownloadLimitModal } from '../utils/downloadLimitEvents';
import DownloadLimitMessage from '../components/DownloadLimitMessage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Universal Storage Permission Handler
 * Handles storage permissions for all Android versions (API 26-34)
 */
const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true; // iOS handles permissions automatically
  }

  try {
    // Android 13+ (API 33+) - Use new media permissions
    if (Platform.Version >= 33) {
      console.log('🔍 [PERMISSION] Android 13+ detected, requesting READ_MEDIA_IMAGES');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        {
          title: 'Storage Permission Required',
          message: 'EventMarketers needs access to your storage to save posters to your gallery.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel', 
          buttonPositive: 'OK',
        }
      );
      
      console.log('📋 [PERMISSION] READ_MEDIA_IMAGES result:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    
    // Android 10-12 (API 29-32) - Scoped Storage era
    if (Platform.Version >= 29) {
      console.log('🔍 [PERMISSION] Android 10-12 detected, requesting WRITE_EXTERNAL_STORAGE');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'EventMarketers needs access to your storage to save posters to your gallery.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      console.log('📋 [PERMISSION] WRITE_EXTERNAL_STORAGE result:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    
    // Android 8-9 (API 26-28) - Legacy storage
    console.log('🔍 [PERMISSION] Android 8-9 detected, requesting WRITE_EXTERNAL_STORAGE');
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission Required',
        message: 'EventMarketers needs access to your storage to save posters to your gallery.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    
    console.log('📋 [PERMISSION] WRITE_EXTERNAL_STORAGE result:', granted);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
    
  } catch (err) {
    console.error('❌ [PERMISSION] Storage permission error:', err);
    return false;
  }
};

/**
 * Check if storage permission is already granted
 */
const checkStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    // Android 13+ (API 33+)
    if (Platform.Version >= 33) {
      const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      console.log('🔍 [PERMISSION] READ_MEDIA_IMAGES check result:', result);
      return result;
    }
    
    // Android 8-12 (API 26-32)
    const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    console.log('🔍 [PERMISSION] WRITE_EXTERNAL_STORAGE check result:', result);
    return result;
    
  } catch (err) {
    console.error('❌ [PERMISSION] Permission check error:', err);
    return false;
  }
};

// Compact spacing multiplier to reduce all spacing (50% reduction)
const COMPACT_MULTIPLIER = 0.5;

// Responsive scaling functions
const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Enhanced responsive design helpers with more granular breakpoints
const isUltraSmallScreen = screenWidth < 360;
const isSmallScreen = screenWidth >= 360 && screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414 && screenWidth < 480;
const isXLargeScreen = screenWidth >= 480;

// Orientation detection
const isPortrait = screenHeight > screenWidth;
const isLandscape = screenWidth > screenHeight;

// Device type detection
const isTablet = Math.min(screenWidth, screenHeight) >= 768;
const isPhone = !isTablet;

// Enhanced responsive spacing and sizing system (with COMPACT_MULTIPLIER applied)
const responsiveSpacing = {
  xs: Math.max(1, (isUltraSmallScreen ? 2 : isSmallScreen ? 4 : isMediumScreen ? 6 : isLargeScreen ? 8 : 10) * COMPACT_MULTIPLIER),
  sm: Math.max(2, (isUltraSmallScreen ? 4 : isSmallScreen ? 6 : isMediumScreen ? 8 : isLargeScreen ? 10 : 12) * COMPACT_MULTIPLIER),
  md: Math.max(3, (isUltraSmallScreen ? 6 : isSmallScreen ? 8 : isMediumScreen ? 10 : isLargeScreen ? 12 : 14) * COMPACT_MULTIPLIER),
  lg: Math.max(4, (isUltraSmallScreen ? 8 : isSmallScreen ? 10 : isMediumScreen ? 12 : isLargeScreen ? 14 : 16) * COMPACT_MULTIPLIER),
  xl: Math.max(5, (isUltraSmallScreen ? 10 : isSmallScreen ? 12 : isMediumScreen ? 14 : isLargeScreen ? 16 : 18) * COMPACT_MULTIPLIER),
  xxl: Math.max(6, (isUltraSmallScreen ? 12 : isSmallScreen ? 14 : isMediumScreen ? 16 : isLargeScreen ? 18 : 20) * COMPACT_MULTIPLIER),
  xxxl: Math.max(7, (isUltraSmallScreen ? 14 : isSmallScreen ? 16 : isMediumScreen ? 18 : isLargeScreen ? 20 : 24) * COMPACT_MULTIPLIER),
};

const responsiveFontSize = {
  xs: Math.max(7, (isUltraSmallScreen ? 8 : isSmallScreen ? 9 : isMediumScreen ? 10 : isLargeScreen ? 11 : 12) * 0.85),
  sm: Math.max(8, (isUltraSmallScreen ? 9 : isSmallScreen ? 10 : isMediumScreen ? 11 : isLargeScreen ? 12 : 13) * 0.85),
  md: Math.max(9, (isUltraSmallScreen ? 10 : isSmallScreen ? 11 : isMediumScreen ? 12 : isLargeScreen ? 13 : 14) * 0.85),
  lg: Math.max(10, (isUltraSmallScreen ? 11 : isSmallScreen ? 12 : isMediumScreen ? 13 : isLargeScreen ? 14 : 15) * 0.85),
  xl: Math.max(11, (isUltraSmallScreen ? 12 : isSmallScreen ? 13 : isMediumScreen ? 14 : isLargeScreen ? 15 : 16) * 0.85),
  xxl: Math.max(12, (isUltraSmallScreen ? 13 : isSmallScreen ? 14 : isMediumScreen ? 15 : isLargeScreen ? 16 : 17) * 0.85),
  xxxl: Math.max(13, (isUltraSmallScreen ? 14 : isSmallScreen ? 15 : isMediumScreen ? 16 : isLargeScreen ? 17 : 18) * 0.85),
  xxxxl: Math.max(14, (isUltraSmallScreen ? 15 : isSmallScreen ? 16 : isMediumScreen ? 17 : isLargeScreen ? 18 : 20) * 0.85),
  xxxxxl: Math.max(15, (isUltraSmallScreen ? 16 : isSmallScreen ? 17 : isMediumScreen ? 18 : isLargeScreen ? 19 : 22) * 0.85),
};

// Enhanced responsive dimensions calculation with orientation support
const getResponsiveDimensions = (insets: any) => {
  const availableWidth = screenWidth - (insets.left + insets.right);
  const availableHeight = screenHeight - (insets.top + insets.bottom);
  
  // Calculate image dimensions based on screen size and orientation
  let imageWidthRatio = 0.9;
  let imageHeightRatio = 0.7;
  
  if (isLandscape) {
    // Landscape mode - prioritize width
    imageWidthRatio = isTablet ? 0.6 : 0.7;
    imageHeightRatio = isTablet ? 0.8 : 0.6;
  } else {
    // Portrait mode - standard ratios
    if (isUltraSmallScreen) {
      imageWidthRatio = 0.95;
      imageHeightRatio = 0.75;
    } else if (isSmallScreen) {
      imageWidthRatio = 0.92;
      imageHeightRatio = 0.7;
    } else if (isMediumScreen) {
      imageWidthRatio = 0.9;
      imageHeightRatio = 0.65;
    } else if (isLargeScreen) {
      imageWidthRatio = 0.88;
      imageHeightRatio = 0.6;
    } else {
      imageWidthRatio = 0.85;
      imageHeightRatio = 0.55;
    }
  }
  
  const imageWidth = Math.min(availableWidth * imageWidthRatio, screenWidth * imageWidthRatio);
  const imageHeight = Math.min(availableHeight * imageHeightRatio, screenHeight * imageHeightRatio);
  
  return {
    imageWidth,
    imageHeight,
    availableWidth,
    availableHeight,
    imageWidthRatio,
    imageHeightRatio
  };
};

interface PosterPreviewScreenProps {
  route: {
    params: {
      capturedImageUri: string;
      selectedImage: {
        uri: string;
        title?: string;
        description?: string;
        id?: string;
        templateId?: string;
      };
      selectedLanguage: string;
      selectedTemplateId: string;
      selectedBusinessProfile?: any;
      posterLayers?: any[];
      selectedTemplate?: string;
      selectedFooterStyle?: string;
      visibleFields?: {[key: string]: boolean};
      canvasWidth?: number;
      canvasHeight?: number;
      isSubscribed?: boolean; // Subscription status passed from editor
    };
  };
}

const PosterPreviewScreen: React.FC<PosterPreviewScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDarkMode, theme } = useTheme();
  const { selectedBusinessProfileId } = useBusinessProfile();
  const { downloadContent, isDownloading: isDownloadProcessing, isLimitReached } = useCentralizedDownload();
  
  // State for dynamic dimensions to handle orientation changes
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  
  // Listen for orientation changes and update dimensions
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });
    
    return () => subscription?.remove();
  }, []);

  // Listen for global download limit modal events
  useEffect(() => {
    const subscription = subscribeToShowDownloadLimitModal(() => {
      setShowDownloadLimitModal(true);
    });

    return () => subscription.remove();
  }, []);
  
  const currentScreenWidth = dimensions.width;
  const currentScreenHeight = dimensions.height;
  
  // Dynamic responsive scaling functions
  const dynamicScale = (size: number) => (currentScreenWidth / 375) * size;
  const dynamicVerticalScale = (size: number) => (currentScreenHeight / 667) * size;
  const dynamicModerateScale = (size: number, factor = 0.5) => size + (dynamicScale(size) - size) * factor;
  
  // Responsive icon sizes (compact - 60% of original)
  const getIconSize = (baseSize: number) => {
    return Math.max(10, Math.round(baseSize * (currentScreenWidth / 375) * 0.6));
  };
  
  // Get responsive dimensions
  const { imageWidth, imageHeight, availableWidth, availableHeight } = getResponsiveDimensions(insets);

  const { 
    capturedImageUri, 
    selectedImage, 
    selectedLanguage, 
    selectedTemplateId, 
    selectedBusinessProfile, 
    posterLayers, 
    selectedTemplate,
    selectedFooterStyle,
    visibleFields,
    canvasWidth,
    canvasHeight,
    isSubscribed = false // Default to false if not provided
  } = route.params;

  const [isUploading, setIsUploading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadLimitModal, setShowDownloadLimitModal] = useState(false);

  // Debug safe area values
  console.log('Safe area insets:', {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
  });

  // Debug: Log the received data
  console.log('PosterPreviewScreen - Received data:', {
    capturedImageUri,
    capturedImageUriLength: capturedImageUri?.length,
    capturedImageUriType: typeof capturedImageUri,
    selectedImage,
    selectedLanguage,
    selectedTemplateId,
    selectedBusinessProfile: selectedBusinessProfile?.id,
  });

  // Additional debugging for image URI
  if (capturedImageUri) {
    console.log('Captured image URI starts with:', capturedImageUri.substring(0, 100));
    console.log('Captured image URI is data URI:', capturedImageUri.startsWith('data:'));
    console.log('Captured image URI is file URI:', capturedImageUri.startsWith('file://'));
    console.log('Captured image URI length:', capturedImageUri.length);
    console.log('Full URI type:', typeof capturedImageUri);
  } else {
    console.log('No captured image URI received');
  }

  // Check if this is a category-based template (not downloadable)
  const isCategoryTemplate = selectedTemplateId?.startsWith('business_category_') || 
                           selectedTemplateId?.startsWith('greeting_category_');
  
  console.log('Template type check:', {
    selectedTemplateId,
    isCategoryTemplate,
    canDownload: !isCategoryTemplate
  });

  // Upload image to backend
  const uploadImage = async () => {
    setIsUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('poster', {
        uri: capturedImageUri,
        type: 'image/png',
        name: 'poster.png',
      } as any);
      formData.append('templateId', selectedTemplateId);
      formData.append('language', selectedLanguage);
      formData.append('businessProfileId', selectedBusinessProfile?.id || '');

      // Upload to backend
      const response = await axios.post('YOUR_BACKEND_URL/api/posters/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Poster saved successfully!', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Poster saved successfully!');
        }
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload poster. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

   // Direct download without permission requests
   // CameraRoll.save() handles permissions automatically on modern devices
   const downloadPosterDirectly = async () => {
     // No permission requests needed - CameraRoll handles this automatically
     return true;
   };

  const getShareablePosterUri = useCallback(async () => {
    if (!capturedImageUri) {
      return null;
    }

    const normalizedUri = (() => {
      if (capturedImageUri.startsWith('file://') || capturedImageUri.startsWith('content://') || capturedImageUri.startsWith('ph://')) {
        return capturedImageUri;
      }

      if (capturedImageUri.startsWith('/')) {
        return `file://${capturedImageUri}`;
      }

      return capturedImageUri;
    })();

    if (normalizedUri.startsWith('file://') || normalizedUri.startsWith('content://') || normalizedUri.startsWith('ph://')) {
      return normalizedUri;
    }

    if (normalizedUri.startsWith('data:image') || normalizedUri.startsWith('http')) {
      try {
        // CHECK STORAGE PERMISSION before saving for sharing
        console.log('???? [PERMISSION] Checking storage permission for sharing...');
        const hasPermission = await checkStoragePermission();
        
        if (!hasPermission) {
          console.log('???? [PERMISSION] Permission not granted for sharing, requesting...');
          const permissionGranted = await requestStoragePermission();
          
          if (!permissionGranted) {
            console.log('???? [PERMISSION] Storage permission denied for sharing');
            return null; // Cannot save for sharing without permission
          }
        }
        
        console.log('???? [PERMISSION] Storage permission granted for sharing, saving...');
        
        const savedUri = await CameraRoll.save(normalizedUri, {
          type: 'photo',
          album: 'EventMarketers',
        });
        console.log('Poster persisted for sharing:', savedUri);
        return savedUri;
      } catch (persistError) {
        console.warn('Unable to persist poster for sharing:', persistError);
        return null;
      }
    }

    console.warn('Unsupported poster URI format for sharing:', normalizedUri);
    return null;
  }, [capturedImageUri]);

  // Share poster
  const sharePoster = async () => {
    if (!capturedImageUri) {
      Alert.alert('Error', 'No poster image available to share');
      return;
    }

    try {
      setIsProcessing(true);
      const shareableUri = await getShareablePosterUri();

      if (!shareableUri) {
        Alert.alert('Error', 'Unable to prepare poster for sharing. Please try downloading it first.');
        return;
      }

      await Share.open({
        url: shareableUri,
        title: 'Share Poster',
        subject: 'Poster',
      });
      console.log('Poster shared via react-native-share');
    } catch (error: any) {
      if (error?.message?.includes('User did not share')) {
        console.log('Share dismissed by user');
        return;
      }
      console.error('Error sharing poster:', error);
      Alert.alert('Error', 'Failed to share poster. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

     // Direct download to gallery without permission requests
   const downloadPoster = async () => {
     if (!capturedImageUri) {
       Alert.alert('Error', 'No poster image available to download');
       return;
     }

     if (isDownloadProcessing) {
       console.log('🔄 Download already in progress, skipping');
       return;
     }

     // Backend-dependent validation: Check if limit is reached from backend response
     if (isLimitReached) {
       setShowDownloadLimitModal(true);
       return;
     }

     try {
       setIsProcessing(true);
       
       console.log('=== CENTRALIZED DOWNLOAD START ===');
       console.log('Business Profile ID:', selectedBusinessProfileId);
       
       // 🔍 CRITICAL: Determine correct resource ID for backend
       console.log('🔍 [RESOURCE ID ANALYSIS]:', {
         selectedTemplateId,
         selectedImageId: selectedImage?.id,
         selectedImageTemplateId: selectedImage?.templateId,
         selectedImageFull: selectedImage,
         routeParams: route.params
       });
       
       // 🎯 CORRECT RESOURCE ID LOGIC:
       // selectedImage.id = actual poster/content ID from backend (MISSING) ❌
       // selectedTemplateId = template ID from editor (HAS THE ID WE NEED) ✅
       // selectedImage.templateId = template ID from image object (MISSING) ❌
       
       // KEY INSIGHT: selectedImage only has uri/title/description, no ID fields
       // We must use selectedTemplateId as the correct resource ID
       const correctResourceId = selectedTemplateId;
       
       // CRITICAL FIX: Handle uploaded templates without resourceId
       if (!correctResourceId) {
         console.log('???? [UPLOADED TEMPLATE] No resourceId found - saving directly to gallery');
         
         // CHECK STORAGE PERMISSION before saving
         console.log('???? [PERMISSION] Checking storage permission for uploaded template...');
         const hasPermission = await checkStoragePermission();
         
         if (!hasPermission) {
           console.log('???? [PERMISSION] Permission not granted, requesting...');
           const permissionGranted = await requestStoragePermission();
           
           if (!permissionGranted) {
             console.log('???? [PERMISSION] Storage permission denied by user');
             Alert.alert(
               'Permission Required',
               'Storage permission is required to save posters to your gallery. Please enable it in your device settings.',
               [{ text: 'OK' }]
             );
             return;
           }
         }
         
         console.log('???? [PERMISSION] Storage permission granted, saving to gallery...');
         
         // Save directly to gallery without calling download API
         await CameraRoll.save(capturedImageUri, {
           type: 'photo',
           album: 'EventMarketers'
         });
         
         console.log('???? [UPLOADED TEMPLATE] Image saved to gallery directly');
         
         // Save poster information to local storage
         try {
           const currentUser = authService.getCurrentUser();
           const userId = currentUser?.id;
           
           await downloadedPostersService.savePosterInfo({
             title: selectedImage.title || 'Custom Poster',
             description: selectedImage.description || 'Event poster created with EventMarketers',
             imageUri: capturedImageUri,
             templateId: 'uploaded_template', // Special ID for uploaded templates
             category: selectedImage.title?.toLowerCase().includes('event') ? 'Events' : 'General',
             tags: ['poster', 'event', 'marketing', 'uploaded'],
           }, userId);
           
           console.log('✅ [UPLOADED TEMPLATE] Poster info saved locally');
         } catch (error) {
           console.error('Error saving poster information:', error);
           // Don't fail the download if poster info saving fails
         }
         
         // Show success message and return
         if (Platform.OS === 'android') {
           ToastAndroid.show(
             '✅ Poster saved to gallery!', 
             ToastAndroid.LONG
           );
         } else {
           Alert.alert(
             'Success!', 
             'Your poster has been saved to your Photos app.',
             [{ text: 'OK' }]
           );
         }
         
         return; // Exit early for uploaded templates
       }
       
       // �🔍 DEBUG: Try different resource types if POSTER fails
       console.log('🚀 [RESOURCE TYPE DEBUG]: Trying POSTER resource type');
       
       console.log('🚀 [FINAL DOWNLOAD PAYLOAD]:', {
         resourceId: correctResourceId,
         resourceType: 'POSTER',
         businessProfileId: selectedBusinessProfileId,
         debugInfo: 'Template ID: ' + correctResourceId + ' | Type: POSTER'
       });
       
       // 🔥 CRITICAL: Call backend download API FIRST (only for server templates)
       const downloadSuccess = await downloadContent({
         resourceId: correctResourceId,
         resourceType: 'POSTER'
       });
       
       if (!downloadSuccess) {
         console.log('❌ Download failed - centralized service returned false');
         return;
       }
       
       const posterTitle = selectedImage.title || 'Custom Poster';
       const posterCategory = selectedImage.title?.toLowerCase().includes('event') ? 'Events' : 'General';
       
       console.log('✅ Download API successful, now saving to gallery...');
       
       // 🔐 CHECK STORAGE PERMISSION before saving
       console.log('🔐 [PERMISSION] Checking storage permission for downloaded poster...');
       const hasPermission = await checkStoragePermission();
       
       if (!hasPermission) {
         console.log('🔐 [PERMISSION] Permission not granted, requesting...');
         const permissionGranted = await requestStoragePermission();
         
         if (!permissionGranted) {
           console.log('❌ [PERMISSION] Storage permission denied by user');
           Alert.alert(
             'Permission Required',
             'Storage permission is required to save posters to your gallery. Please enable it in your device settings.',
             [{ text: 'OK' }]
           );
           return;
         }
       }
       
       console.log('✅ [PERMISSION] Storage permission granted, saving to gallery...');
       
       // AFTER successful API call, save to gallery
       await CameraRoll.save(capturedImageUri, {
         type: 'photo',
         album: 'EventMarketers'
       });
       
       console.log('✅ Image saved to gallery successfully');
       
       // Save poster information to local storage (secondary)
       try {
         const currentUser = authService.getCurrentUser();
         const userId = currentUser?.id;
         
         await downloadedPostersService.savePosterInfo({
           title: posterTitle,
           description: selectedImage.description || 'Event poster created with EventMarketers',
           imageUri: capturedImageUri,
           templateId: correctResourceId, // ✅ Use the correct resource ID
           category: posterCategory,
           tags: ['poster', 'event', 'marketing'],
         }, userId);
         
         console.log('✅ Poster info saved locally');
       } catch (error) {
         console.error('Error saving poster information:', error);
         // Don't fail the download if poster info saving fails
       }
       
       console.log('=== CENTRALIZED DOWNLOAD COMPLETE ===');

       // Show success message
       if (Platform.OS === 'android') {
         ToastAndroid.show(
           '✅ Poster saved to gallery!', 
           ToastAndroid.LONG
         );
       } else {
         Alert.alert(
           'Success!', 
           'Your poster has been saved to your Photos app.',
           [{ text: 'OK' }]
         );
       }
       
     } catch (error) {
       console.error('❌ Download failed:', error);
       Alert.alert(
         'Download Failed',
         'Failed to save poster to gallery. Please try again.',
         [{ text: 'OK' }]
       );
     } finally {
       setIsProcessing(false);
     }
   };

  // Create theme-aware styles (with dynamic responsive scaling)
  const getThemeStyles = () => ({
    container: {
      flex: 1,
      backgroundColor: theme?.colors?.background || '#f8f9fa',
    },
    previewContainer: {
      flex: 1,
      paddingTop: dynamicModerateScale(8),
      paddingBottom: dynamicModerateScale(8),
      paddingHorizontal: dynamicModerateScale(4),
      backgroundColor: theme?.colors?.background || '#f8f9fa',
    },
    previewTitle: {
      fontSize: dynamicModerateScale(16),
      fontWeight: 700 as const,
      color: theme?.colors?.text || '#333333',
      marginBottom: dynamicModerateScale(1.5),
    },
    previewSubtitle: {
      fontSize: dynamicModerateScale(8.5),
      color: theme?.colors?.textSecondary || '#666666',
      textAlign: 'center',
    },
    imageContainer: {
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: dynamicModerateScale(10),
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(2),
      },
      shadowOpacity: isDarkMode ? 0.2 : 0.08,
      shadowRadius: dynamicModerateScale(6),
      elevation: dynamicModerateScale(4),
      padding: dynamicModerateScale(4),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: isDarkMode ? 0.5 : 0,
      borderColor: theme?.colors?.border || 'transparent',
    },
    actionContainer: {
      paddingHorizontal: dynamicModerateScale(4),
      paddingTop: dynamicModerateScale(4),
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderTopWidth: 0.5,
      borderTopColor: theme?.colors?.border || '#e9ecef',
    },
    editButton: {
      paddingVertical: dynamicModerateScale(5),
      paddingHorizontal: dynamicModerateScale(8),
      borderRadius: dynamicModerateScale(6),
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e9ecef',
      alignItems: 'center',
      minHeight: dynamicModerateScale(28),
    },
    editButtonText: {
      color: theme?.colors?.text || '#ffffff',
      fontSize: dynamicModerateScale(8.5),
      fontWeight: '600' as const,
    },
    loadingText: {
      fontSize: dynamicModerateScale(9),
      color: theme?.colors?.textSecondary || '#666666',
      fontWeight: '500' as const,
    },
    errorText: {
      fontSize: dynamicModerateScale(10),
      fontWeight: '600' as const,
      color: '#ff6b6b',
      marginTop: dynamicModerateScale(6),
      marginBottom: dynamicModerateScale(2),
    },
    errorSubtext: {
      fontSize: dynamicModerateScale(8.5),
      color: theme?.colors?.textSecondary || '#666666',
      marginBottom: dynamicModerateScale(8),
    },
  });

  const themeStyles = getThemeStyles();

  return (
    <View style={themeStyles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      
      {/* Modern Premium Header */}
      <View
        style={[styles.header, { 
          paddingTop: insets.top + responsiveSpacing.sm,
          backgroundColor: theme?.colors?.surface || '#ffffff'
        }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.premiumTitleContainer}>
            <Text style={[styles.posterText, { color: theme?.colors?.text || '#1a1a1a' }]}>
              Poster
            </Text>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.studioGradientContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.studioPlusText}>
                Studio
              </Text>
            </LinearGradient>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme?.colors?.textSecondary || '#666666' }]}>
            Design. Share. Inspire.
          </Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Poster Preview */}
      <View style={themeStyles.previewContainer}>
        <View style={styles.previewHeader}>
          {/* <Text style={themeStyles.previewTitle}>Your Poster</Text> */}
        </View>
        
        {/* Direct Image Display without Container */}
        {!capturedImageUri ? (
          <View style={styles.errorContainer}>
            <Icon name="error" size={getIconSize(32)} color="#ff6b6b" />
            <Text style={themeStyles.errorText}>No poster image captured</Text>
            <Text style={themeStyles.errorSubtext}>Using original image</Text>
            <Image
              source={{ uri: selectedImage.uri }}
              style={[styles.directPosterImage, { 
                width: imageWidth, 
                height: imageHeight,
                alignSelf: 'center',
                marginTop: responsiveSpacing.sm,
              }]}
              resizeMode="contain"
            />
          </View>
        ) : imageLoadError ? (
          <View style={styles.errorContainer}>
            <Icon name="error" size={getIconSize(32)} color="#ff6b6b" />
            <Text style={styles.errorText}>Failed to load poster image</Text>
            <Text style={styles.errorSubtext}>Using fallback image</Text>
            <Image
              source={{ uri: selectedImage.uri }}
              style={[styles.directPosterImage, { 
                width: imageWidth, 
                height: imageHeight,
                alignSelf: 'center',
                marginTop: responsiveSpacing.sm,
              }]}
              resizeMode="contain"
            />
          </View>
        ) : (
          <>
            {imageLoading && (
              <View style={[styles.loadingOverlay, { 
                width: imageWidth, 
                height: imageHeight,
                alignSelf: 'center',
                marginTop: responsiveSpacing.sm,
              }]}>
                <Text style={styles.loadingText}>Loading poster...</Text>
              </View>
            )}
            <Image
              source={{ uri: capturedImageUri }}
              style={[styles.directPosterImage, { 
                width: imageWidth, 
                height: imageHeight,
                alignSelf: 'center',
                marginTop: responsiveSpacing.sm,
              }]}
              resizeMode="contain"
              onError={(error) => {
                console.log('Image load error:', error);
                console.log('Error details:', error.nativeEvent);
                console.log('Error message:', error.nativeEvent?.error);
                setImageLoadError(true);
                setImageLoading(false);
              }}
              onLoad={(event) => {
                console.log('Poster image loaded successfully');
                console.log('Image dimensions:', event.nativeEvent);
                setImageLoading(false);
              }}
            />
          </>
        )}
      </View>

             {/* Modern Action Buttons */}
       <View style={[
         styles.modernActionContainer, 
         themeStyles.actionContainer,
         { 
           paddingBottom: Math.max(insets.bottom + responsiveSpacing.lg, responsiveSpacing.xl)
         }
       ]}>
        {/* Premium Share and Download Buttons */}
        <View style={styles.premiumActionButtons}>
          <TouchableOpacity
            style={styles.premiumActionButton}
            onPress={sharePoster}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isProcessing ? ['#cccccc', '#999999'] : ['#667eea', '#764ba2']}
              style={styles.premiumButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="share" size={getIconSize(24)} color="#ffffff" />
              <Text style={styles.premiumButtonText}>
                {isProcessing ? 'Sharing...' : 'Share Poster'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.premiumActionButton}
            onPress={isCategoryTemplate ? () => {
              Alert.alert(
                'Download Not Available',
                'Category templates cannot be downloaded. Please select a specific poster from the category to download.',
                [{ text: 'OK' }]
              );
            } : downloadPoster}
            disabled={isProcessing || isDownloadProcessing || isLimitReached}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isCategoryTemplate ? ['#6c757d', '#5a6268'] : isLimitReached ? ['#dc3545', '#c82333'] : isProcessing ? ['#cccccc', '#999999'] : ['#28a745', '#20c997']}
              style={styles.premiumButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="download" size={getIconSize(24)} color="#ffffff" />
              <Text style={styles.premiumButtonText}>
                {isCategoryTemplate ? 'Select a Poster' : isLimitReached ? 'Limit Reached' : isProcessing ? 'Saving...' : 'Download Poster'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Elegant Back to Editor Button */}
        <TouchableOpacity
          style={[styles.elegantBackButton, { 
            borderColor: theme?.colors?.border || '#e9ecef',
            backgroundColor: theme?.colors?.surface || '#ffffff'
          }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.elegantBackButtonText, { 
            color: theme?.colors?.text || '#333333' 
          }]}>
            Back to Editor
          </Text>
        </TouchableOpacity>
      </View>
      
      <DownloadLimitMessage
        visible={showDownloadLimitModal}
        onClose={() => setShowDownloadLimitModal(false)}
      />
             
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(3),
    borderBottomWidth: 0,
    zIndex: 1000,
    elevation: moderateScale(4),
  },
  backButton: {
    padding: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: moderateScale(4),
  },
  headerTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#333333',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: moderateScale(9),
    color: 'rgba(102, 102, 102, 0.8)',
    marginTop: moderateScale(1),
    letterSpacing: 0.3,
  },
  // Premium Title Styles
  premiumTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterText: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    textShadowRadius: moderateScale(2),
  },
  studioGradientContainer: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    marginLeft: moderateScale(2),
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: moderateScale(2),
    },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(4),
    elevation: moderateScale(3),
  },
  studioPlusText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    textShadowRadius: moderateScale(2),
  },
  headerSpacer: {
    width: moderateScale(26),
  },
  previewContainer: {
    flex: 1,
    padding: moderateScale(4),
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: moderateScale(3),
  },
  previewTitle: {
    fontSize: moderateScale(11),
    fontWeight: 700,
    color: '#333333',
    marginBottom: moderateScale(1.5),
  },
  previewSubtitle: {
    fontSize: moderateScale(8.5),
    color: '#666666',
    textAlign: 'center',
  },
  imageContainer: {
    // These will be set dynamically based on responsive dimensions
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(2),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(6),
    elevation: moderateScale(4),
    padding: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(10),
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  directPosterImage: {
    borderRadius: moderateScale(8),
  },
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    zIndex: 1,
    borderRadius: moderateScale(8),
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  loadingText: {
    fontSize: moderateScale(9),
    color: '#666666',
    fontWeight: 500,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(8),
  },
  errorText: {
    fontSize: moderateScale(10),
    fontWeight: 600,
    color: '#ff6b6b',
    marginTop: moderateScale(6),
    marginBottom: moderateScale(2),
  },
  errorSubtext: {
    fontSize: moderateScale(8.5),
    color: '#666666',
    marginBottom: moderateScale(8),
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(10),
  },
  frameOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  frameOverlayImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  layer: {
    position: 'absolute',
  },
  layerText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  layerImage: {
    width: '100%',
    height: '100%',
  },
  debugInfo: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 8,
    zIndex: 1000,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 5,
  },
  // Template Styles
  canvasWithFrame: {
    borderWidth: 8,
    borderColor: '#667eea',
    borderRadius: 16,
  },
  businessFrame: {
    borderWidth: 10,
    borderColor: '#2c3e50',
    borderRadius: 20,
  },
  eventFrame: {
    borderWidth: 12,
    borderColor: '#e74c3c',
    borderRadius: 24,
  },
  restaurantFrame: {
    borderWidth: 10,
    borderColor: '#f39c12',
    borderRadius: 18,
  },
  fashionFrame: {
    borderWidth: 12,
    borderColor: '#9b59b6',
    borderRadius: 22,
  },
  realEstateFrame: {
    borderWidth: 10,
    borderColor: '#27ae60',
    borderRadius: 16,
  },
  educationFrame: {
    borderWidth: 10,
    borderColor: '#3498db',
    borderRadius: 20,
  },
  healthcareFrame: {
    borderWidth: 10,
    borderColor: '#e74c3c',
    borderRadius: 18,
  },
  fitnessFrame: {
    borderWidth: 12,
    borderColor: '#f39c12',
    borderRadius: 24,
  },
  weddingFrame: {
    borderWidth: 15,
    borderColor: '#e91e63',
    borderRadius: 30,
  },
  birthdayFrame: {
    borderWidth: 12,
    borderColor: '#ff9800',
    borderRadius: 26,
  },
  corporateFrame: {
    borderWidth: 10,
    borderColor: '#34495e',
    borderRadius: 16,
  },
  creativeFrame: {
    borderWidth: 12,
    borderColor: '#9c27b0',
    borderRadius: 28,
  },
  minimalFrame: {
    borderWidth: 4,
    borderColor: '#95a5a6',
    borderRadius: 12,
  },
  luxuryFrame: {
    borderWidth: 15,
    borderColor: '#d4af37',
    borderRadius: 32,
  },
  modernFrame: {
    borderWidth: 8,
    borderColor: '#607d8b',
    borderRadius: 20,
  },
  vintageFrame: {
    borderWidth: 12,
    borderColor: '#8d6e63',
    borderRadius: 24,
  },
  retroFrame: {
    borderWidth: 10,
    borderColor: '#ff5722',
    borderRadius: 18,
  },
  elegantFrame: {
    borderWidth: 12,
    borderColor: '#795548',
    borderRadius: 26,
  },
  boldFrame: {
    borderWidth: 15,
    borderColor: '#000000',
    borderRadius: 30,
  },
  techFrame: {
    borderWidth: 10,
    borderColor: '#00bcd4',
    borderRadius: 20,
  },
  natureFrame: {
    borderWidth: 10,
    borderColor: '#4caf50',
    borderRadius: 18,
  },
  oceanFrame: {
    borderWidth: 10,
    borderColor: '#2196f3',
    borderRadius: 20,
  },
  sunsetFrame: {
    borderWidth: 12,
    borderColor: '#ff9800',
    borderRadius: 24,
  },
  cosmicFrame: {
    borderWidth: 12,
    borderColor: '#673ab7',
    borderRadius: 26,
  },
  artisticFrame: {
    borderWidth: 12,
    borderColor: '#e91e63',
    borderRadius: 28,
  },
  sportFrame: {
    borderWidth: 10,
    borderColor: '#ff5722',
    borderRadius: 20,
  },
  warmFrame: {
    borderWidth: 10,
    borderColor: '#ff7043',
    borderRadius: 18,
  },
  coolFrame: {
    borderWidth: 10,
    borderColor: '#42a5f5',
    borderRadius: 20,
  },
  actionContainer: {
    paddingHorizontal: moderateScale(4),
    paddingTop: moderateScale(4),
    borderTopWidth: 0.5,
    // paddingBottom will be set dynamically with safe area
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(4),
  },
  // Premium Action Button Styles
  modernActionContainer: {
    paddingHorizontal: moderateScale(6),
    paddingTop: moderateScale(6),
    backgroundColor: '#ffffff',
    borderTopWidth: 0.5,
    borderTopColor: '#e9ecef',
  },
  premiumActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(5),
  },
  premiumActionButton: {
    flex: 1,
    marginHorizontal: moderateScale(2),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(3),
    },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(8),
    elevation: moderateScale(6),
  },
  premiumButtonGradient: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(48),
  },
  premiumButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(10.5),
    fontWeight: '600',
    marginLeft: moderateScale(3),
    letterSpacing: 0.3,
  },
  elegantBackButton: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1.5,
    alignItems: 'center',
    minHeight: moderateScale(44),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  elegantBackButtonText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: moderateScale(2),
    borderRadius: moderateScale(6),
    overflow: 'hidden',
  },
  shareButtonGradient: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(9.5),
    fontWeight: 600,
    marginLeft: moderateScale(2.5),
  },
  saveButtonGradient: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(9.5),
    fontWeight: 600,
    marginLeft: moderateScale(2.5),
  },
  editButton: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    alignItems: 'center',
    minHeight: moderateScale(40),
  },
  editButtonText: {
    fontSize: moderateScale(10),
    fontWeight: 600,
  },
});

export default PosterPreviewScreen;
