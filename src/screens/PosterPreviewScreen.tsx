import React, { useState, useEffect } from 'react';
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
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
// import RNFS from 'react-native-fs'; // Removed - package uninstalled
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import downloadedPostersService from '../services/downloadedPosters';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

// Enhanced responsive spacing and sizing system
const responsiveSpacing = {
  xs: isUltraSmallScreen ? 2 : isSmallScreen ? 4 : isMediumScreen ? 6 : isLargeScreen ? 8 : 10,
  sm: isUltraSmallScreen ? 4 : isSmallScreen ? 6 : isMediumScreen ? 8 : isLargeScreen ? 10 : 12,
  md: isUltraSmallScreen ? 6 : isSmallScreen ? 8 : isMediumScreen ? 10 : isLargeScreen ? 12 : 14,
  lg: isUltraSmallScreen ? 8 : isSmallScreen ? 10 : isMediumScreen ? 12 : isLargeScreen ? 14 : 16,
  xl: isUltraSmallScreen ? 10 : isSmallScreen ? 12 : isMediumScreen ? 14 : isLargeScreen ? 16 : 18,
  xxl: isUltraSmallScreen ? 12 : isSmallScreen ? 14 : isMediumScreen ? 16 : isLargeScreen ? 18 : 20,
  xxxl: isUltraSmallScreen ? 14 : isSmallScreen ? 16 : isMediumScreen ? 18 : isLargeScreen ? 20 : 24,
};

const responsiveFontSize = {
  xs: isUltraSmallScreen ? 8 : isSmallScreen ? 9 : isMediumScreen ? 10 : isLargeScreen ? 11 : 12,
  sm: isUltraSmallScreen ? 9 : isSmallScreen ? 10 : isMediumScreen ? 11 : isLargeScreen ? 12 : 13,
  md: isUltraSmallScreen ? 10 : isSmallScreen ? 11 : isMediumScreen ? 12 : isLargeScreen ? 13 : 14,
  lg: isUltraSmallScreen ? 11 : isSmallScreen ? 12 : isMediumScreen ? 13 : isLargeScreen ? 14 : 15,
  xl: isUltraSmallScreen ? 12 : isSmallScreen ? 13 : isMediumScreen ? 14 : isLargeScreen ? 15 : 16,
  xxl: isUltraSmallScreen ? 13 : isSmallScreen ? 14 : isMediumScreen ? 15 : isLargeScreen ? 16 : 17,
  xxxl: isUltraSmallScreen ? 14 : isSmallScreen ? 15 : isMediumScreen ? 16 : isLargeScreen ? 17 : 18,
  xxxxl: isUltraSmallScreen ? 15 : isSmallScreen ? 16 : isMediumScreen ? 17 : isLargeScreen ? 18 : 20,
  xxxxxl: isUltraSmallScreen ? 16 : isSmallScreen ? 17 : isMediumScreen ? 18 : isLargeScreen ? 19 : 22,
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
      };
      selectedLanguage: string;
      selectedTemplateId: string;
      selectedBusinessProfile?: any;
      posterLayers?: any[];
      selectedFrame?: any;
      frameContent?: any;
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
  
  // State for orientation changes
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  
  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  // Get responsive dimensions
  const { imageWidth, imageHeight, availableWidth, availableHeight } = getResponsiveDimensions(insets);

  const { 
    capturedImageUri, 
    selectedImage, 
    selectedLanguage, 
    selectedTemplateId, 
    selectedBusinessProfile, 
    posterLayers, 
    selectedFrame, 
    frameContent,
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
    console.log('Captured image URI is data URI:', capturedImageUri.startsWith('data:image'));
    console.log('Captured image URI is file URI:', capturedImageUri.startsWith('file://'));
    console.log('Captured image URI length:', capturedImageUri.length);
    console.log('Full URI type:', typeof capturedImageUri);
  } else {
    console.log('No captured image URI received');
  }

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

  // Share poster
  const sharePoster = async () => {
    if (!capturedImageUri) {
      Alert.alert('Error', 'No poster image available to share');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await Share.share({
        url: capturedImageUri,
        title: selectedImage.title || 'My Event Poster',
        message: `Check out my event poster: ${selectedImage.title || 'Custom Poster'}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log('Shared with activity type:', result.activityType);
        } else {
          // shared
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
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

     try {
       setIsProcessing(true);
       
       console.log('=== DIRECT DOWNLOAD START ===');
       console.log('CapturedImageUri type:', typeof capturedImageUri);
       console.log('CapturedImageUri length:', capturedImageUri?.length);
       console.log('Platform:', Platform.OS);
       
       // Direct save to gallery - CameraRoll handles permissions automatically
       console.log('Saving directly to gallery...');
       await CameraRoll.save(capturedImageUri, {
         type: 'photo',
         album: 'EventMarketers'
       });
       
       console.log('Image saved to gallery successfully');
       
       // Save poster information to local storage
       try {
         await downloadedPostersService.savePosterInfo({
           title: selectedImage.title || 'Custom Poster',
           description: selectedImage.description || 'Event poster created with EventMarketers',
           imageUri: capturedImageUri,
           templateId: selectedTemplateId,
           category: selectedImage.title?.toLowerCase().includes('event') ? 'Events' : 'General',
           tags: ['poster', 'event', 'marketing'],
           size: {
             width: canvasWidth || 1080,
             height: canvasHeight || 1920,
           },
         });
         console.log('Poster information saved successfully');
       } catch (error) {
         console.error('Error saving poster information:', error);
         // Don't fail the download if poster info saving fails
       }
       
       console.log('=== DIRECT DOWNLOAD COMPLETE ===');

       // Show success message for direct download
       if (Platform.OS === 'android') {
         ToastAndroid.show(
           '✅ Poster saved to gallery!', 
           ToastAndroid.LONG
         );
       } else {
         // For iOS, show a more informative alert
         Alert.alert(
           'Success!', 
           'Your poster has been saved to your Photos app.',
           [
             {
               text: 'OK',
               style: 'default'
             }
           ]
         );
       }
     } catch (error: any) {
       console.error('=== DOWNLOAD ERROR ===');
       console.error('Error saving to gallery:', error);
       console.error('Error details:', {
         message: error?.message || 'Unknown error',
         stack: error?.stack,
         capturedImageUri: capturedImageUri?.substring(0, 100) + '...',
         uriType: capturedImageUri?.startsWith('data:image') ? 'base64' : 
                 capturedImageUri?.startsWith('file://') ? 'file' : 'other'
       });
       
       // Show user-friendly error message with helpful suggestions
       const errorMessage = error?.message || 'Unknown error';
       let userFriendlyMessage = 'Failed to save poster to gallery.';
       
       if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
         userFriendlyMessage = 'Permission denied. Please allow storage access in your device settings and try again.';
       } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
         userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
       } else if (errorMessage.includes('storage') || errorMessage.includes('Storage')) {
         userFriendlyMessage = 'Storage error. Please check if you have enough storage space and try again.';
       }
       
       Alert.alert(
         'Download Failed', 
         userFriendlyMessage,
         [
           {
             text: 'OK',
             style: 'default'
           }
         ]
       );
     } finally {
       setIsProcessing(false);
     }
   };

  // Create theme-aware styles
  const getThemeStyles = () => ({
    container: {
      flex: 1,
      backgroundColor: theme?.colors?.background || '#f8f9fa',
    },
    previewContainer: {
      flex: 1,
      padding: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
      backgroundColor: theme?.colors?.background || '#f8f9fa',
    },
    previewTitle: {
      fontSize: isLandscape ? (isTablet ? responsiveFontSize.xxxxl : responsiveFontSize.xxxl) : (isUltraSmallScreen ? responsiveFontSize.lg : isSmallScreen ? responsiveFontSize.xl : isMediumScreen ? responsiveFontSize.xxl : isLargeScreen ? responsiveFontSize.xxxl : responsiveFontSize.xxxxl),
      fontWeight: '700',
      color: theme?.colors?.text || '#333333',
      marginBottom: isLandscape ? (isTablet ? responsiveSpacing.xs : 2) : (isUltraSmallScreen ? 2 : isSmallScreen ? 3 : isMediumScreen ? 4 : isLargeScreen ? 5 : 6),
    },
    previewSubtitle: {
      fontSize: isLandscape ? (isTablet ? responsiveFontSize.md : responsiveFontSize.sm) : (isUltraSmallScreen ? responsiveFontSize.xs : isSmallScreen ? responsiveFontSize.sm : isMediumScreen ? responsiveFontSize.md : isLargeScreen ? responsiveFontSize.lg : responsiveFontSize.xl),
      color: theme?.colors?.textSecondary || '#666666',
      textAlign: 'center',
    },
    imageContainer: {
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: isLandscape ? (isTablet ? 20 : 16) : (isUltraSmallScreen ? 12 : isSmallScreen ? 14 : isMediumScreen ? 16 : isLargeScreen ? 18 : 20),
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: isDarkMode ? 0.3 : 0.15,
      shadowRadius: 16,
      elevation: 12,
      padding: isLandscape ? (isTablet ? responsiveSpacing.xl : responsiveSpacing.lg) : (isUltraSmallScreen ? responsiveSpacing.md : isSmallScreen ? responsiveSpacing.lg : responsiveSpacing.xl),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: theme?.colors?.border || 'transparent',
    },
    actionContainer: {
      paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
      paddingTop: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderTopWidth: 1,
      borderTopColor: theme?.colors?.border || '#e9ecef',
    },
    editButton: {
      paddingVertical: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
      paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
      borderRadius: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      borderWidth: 2,
      borderColor: theme?.colors?.border || '#e9ecef',
      alignItems: 'center',
      minHeight: isLandscape ? (isTablet ? 56 : 48) : (isUltraSmallScreen ? 40 : isSmallScreen ? 44 : isMediumScreen ? 48 : isLargeScreen ? 52 : 56),
    },
    editButtonText: {
      color: theme?.colors?.textSecondary || '#666666',
      fontSize: isLandscape ? (isTablet ? responsiveFontSize.sm : responsiveFontSize.xs) : (isUltraSmallScreen ? responsiveFontSize.xs : isSmallScreen ? responsiveFontSize.sm : isMediumScreen ? responsiveFontSize.md : isLargeScreen ? responsiveFontSize.lg : responsiveFontSize.xl),
      fontWeight: '600',
    },
    loadingText: {
      fontSize: isLandscape ? (isTablet ? responsiveFontSize.lg : responsiveFontSize.md) : (isUltraSmallScreen ? responsiveFontSize.sm : isSmallScreen ? responsiveFontSize.md : isMediumScreen ? responsiveFontSize.lg : isLargeScreen ? responsiveFontSize.xl : responsiveFontSize.xxl),
      color: theme?.colors?.textSecondary || '#666666',
      fontWeight: '500',
    },
    errorText: {
      fontSize: isLandscape ? (isTablet ? responsiveFontSize.lg : responsiveFontSize.md) : (isUltraSmallScreen ? responsiveFontSize.sm : isSmallScreen ? responsiveFontSize.md : isMediumScreen ? responsiveFontSize.lg : isLargeScreen ? responsiveFontSize.xl : responsiveFontSize.xxl),
      fontWeight: '600',
      color: '#ff6b6b',
      marginTop: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
      marginBottom: isLandscape ? (isTablet ? responsiveSpacing.xs : 2) : (isUltraSmallScreen ? 2 : isSmallScreen ? 3 : isMediumScreen ? 4 : isLargeScreen ? 5 : 6),
    },
    errorSubtext: {
      fontSize: isLandscape ? (isTablet ? responsiveFontSize.sm : responsiveFontSize.xs) : (isUltraSmallScreen ? responsiveFontSize.xs : isSmallScreen ? responsiveFontSize.sm : isMediumScreen ? responsiveFontSize.md : isLargeScreen ? responsiveFontSize.lg : responsiveFontSize.xl),
      color: theme?.colors?.textSecondary || '#666666',
      marginBottom: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.md : isSmallScreen ? responsiveSpacing.lg : responsiveSpacing.xl),
    },
  });

  const themeStyles = getThemeStyles();

  return (
    <View style={themeStyles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent={true}
      />
      
             {/* Professional Header */}
       <LinearGradient
         colors={['#667eea', '#764ba2']}
         style={[styles.header, { paddingTop: insets.top + (isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg)) }]}
       >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Preview Poster</Text>
          <Text style={styles.headerSubtitle}>
            Review your poster before saving
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* Poster Preview */}
      <View style={themeStyles.previewContainer}>
        <View style={styles.previewHeader}>
          <Text style={themeStyles.previewTitle}>Your Poster</Text>
          <Text style={themeStyles.previewSubtitle}>
            {selectedImage.title || 'Custom Poster'} • {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}
          </Text>
        </View>
        
        {/* Improved Image Container with Better Alignment */}
        <View style={[
          themeStyles.imageContainer, 
          { 
            width: imageWidth, 
            height: imageHeight,
            alignSelf: 'center',
            marginTop: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
          }
        ]}>
           {!capturedImageUri ? (
             <View style={styles.errorContainer}>
               <Icon name="error" size={48} color="#ff6b6b" />
               <Text style={themeStyles.errorText}>No poster image captured</Text>
               <Text style={themeStyles.errorSubtext}>Using original image</Text>
               <Image
                 source={{ uri: selectedImage.uri }}
                 style={styles.posterImage}
                 resizeMode="contain"
               />
             </View>
           ) : imageLoadError ? (
             <View style={styles.errorContainer}>
               <Icon name="error" size={48} color="#ff6b6b" />
               <Text style={themeStyles.errorText}>Failed to load poster image</Text>
               <Text style={themeStyles.errorSubtext}>Using fallback image</Text>
               <Image
                 source={{ uri: selectedImage.uri }}
                 style={styles.posterImage}
                 resizeMode="contain"
               />
             </View>
                       ) : (
              <View style={styles.imageWrapper}>
                {imageLoading && (
                  <View style={styles.loadingContainer}>
                    <Text style={themeStyles.loadingText}>Loading poster...</Text>
                  </View>
                )}
                <Image
                  source={{ uri: capturedImageUri }}
                  style={styles.posterImage}
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
               </View>
            )}
         </View>
      </View>

             {/* Action Buttons */}
       <View style={[
         themeStyles.actionContainer, 
         { 
           paddingBottom: Math.max(insets.bottom + (isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg)), (isLandscape ? (isTablet ? responsiveSpacing.xl : responsiveSpacing.lg) : (isUltraSmallScreen ? responsiveSpacing.md : isSmallScreen ? responsiveSpacing.lg : responsiveSpacing.xl)))
         }
       ]}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={sharePoster}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={isProcessing ? ['#cccccc', '#999999'] : ['#667eea', '#764ba2']}
              style={styles.shareButtonGradient}
            >
              <Icon name="share" size={24} color="#ffffff" />
              <Text style={styles.shareButtonText}>
                {isProcessing ? 'Sharing...' : 'Share'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={downloadPoster}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={isProcessing ? ['#cccccc', '#999999'] : ['#28a745', '#20c997']}
              style={styles.saveButtonGradient}
            >
              <Icon name="download" size={24} color="#ffffff" />
              <Text style={styles.saveButtonText}>
                {isProcessing ? 'Saving...' : 'Download'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[themeStyles.editButton, { marginBottom: 8 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={themeStyles.editButtonText}>Back to Editor</Text>
        </TouchableOpacity>
      </View>
      
             
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
    paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    paddingVertical: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    borderBottomWidth: 0,
    zIndex: 1000,
    elevation: 10,
  },
  backButton: {
    padding: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    borderRadius: isLandscape ? (isTablet ? 16 : 12) : (isUltraSmallScreen ? 8 : isSmallScreen ? 10 : isMediumScreen ? 12 : isLargeScreen ? 14 : 16),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
  },
  headerTitle: {
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.xxxxl : responsiveFontSize.xxxl) : (isUltraSmallScreen ? responsiveFontSize.lg : isSmallScreen ? responsiveFontSize.xl : isMediumScreen ? responsiveFontSize.xxl : isLargeScreen ? responsiveFontSize.xxxl : responsiveFontSize.xxxxl),
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.md : responsiveFontSize.sm) : (isUltraSmallScreen ? responsiveFontSize.xs : isSmallScreen ? responsiveFontSize.sm : isMediumScreen ? responsiveFontSize.md : isLargeScreen ? responsiveFontSize.lg : responsiveFontSize.xl),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: isLandscape ? (isTablet ? responsiveSpacing.xs : 1) : (isUltraSmallScreen ? 1 : isSmallScreen ? 2 : responsiveSpacing.xs),
  },
  headerSpacer: {
    width: isLandscape ? (isTablet ? 60 : 50) : (isUltraSmallScreen ? 40 : isSmallScreen ? 44 : isMediumScreen ? 48 : isLargeScreen ? 52 : 56),
  },
  previewContainer: {
    flex: 1,
    padding: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
  },
  previewTitle: {
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.xxxxl : responsiveFontSize.xxxl) : (isUltraSmallScreen ? responsiveFontSize.lg : isSmallScreen ? responsiveFontSize.xl : isMediumScreen ? responsiveFontSize.xxl : isLargeScreen ? responsiveFontSize.xxxl : responsiveFontSize.xxxxl),
    fontWeight: '700',
    color: '#333333',
    marginBottom: isLandscape ? (isTablet ? responsiveSpacing.xs : 2) : (isUltraSmallScreen ? 2 : isSmallScreen ? 3 : isMediumScreen ? 4 : isLargeScreen ? 5 : 6),
  },
  previewSubtitle: {
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.md : responsiveFontSize.sm) : (isUltraSmallScreen ? responsiveFontSize.xs : isSmallScreen ? responsiveFontSize.sm : isMediumScreen ? responsiveFontSize.md : isLargeScreen ? responsiveFontSize.lg : responsiveFontSize.xl),
    color: '#666666',
    textAlign: 'center',
  },
  imageContainer: {
    // These will be set dynamically based on responsive dimensions
    backgroundColor: '#ffffff',
    borderRadius: isLandscape ? (isTablet ? 20 : 16) : (isUltraSmallScreen ? 12 : isSmallScreen ? 14 : isMediumScreen ? 16 : isLargeScreen ? 18 : 20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    padding: isLandscape ? (isTablet ? responsiveSpacing.xl : responsiveSpacing.lg) : (isUltraSmallScreen ? responsiveSpacing.md : isSmallScreen ? responsiveSpacing.lg : responsiveSpacing.xl),
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
    borderRadius: isLandscape ? (isTablet ? 12 : 10) : (isUltraSmallScreen ? 8 : isSmallScreen ? 10 : isMediumScreen ? 12 : isLargeScreen ? 14 : 16),
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.lg : responsiveFontSize.md) : (isUltraSmallScreen ? responsiveFontSize.sm : isSmallScreen ? responsiveFontSize.md : isMediumScreen ? responsiveFontSize.lg : isLargeScreen ? responsiveFontSize.xl : responsiveFontSize.xxl),
    color: '#666666',
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.lg : responsiveFontSize.md) : (isUltraSmallScreen ? responsiveFontSize.sm : isSmallScreen ? responsiveFontSize.md : isMediumScreen ? responsiveFontSize.lg : isLargeScreen ? responsiveFontSize.xl : responsiveFontSize.xxl),
    fontWeight: '600',
    color: '#ff6b6b',
    marginTop: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    marginBottom: isLandscape ? (isTablet ? responsiveSpacing.xs : 2) : (isUltraSmallScreen ? 2 : isSmallScreen ? 3 : isMediumScreen ? 4 : isLargeScreen ? 5 : 6),
  },
  errorSubtext: {
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.sm : responsiveFontSize.xs) : (isUltraSmallScreen ? responsiveFontSize.xs : isSmallScreen ? responsiveFontSize.sm : isMediumScreen ? responsiveFontSize.md : isLargeScreen ? responsiveFontSize.lg : responsiveFontSize.xl),
    color: '#666666',
    marginBottom: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.md : isSmallScreen ? responsiveSpacing.lg : responsiveSpacing.xl),
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
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
    paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    paddingTop: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    // paddingBottom will be set dynamically with safe area
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
  },
  actionButton: {
    flex: 1,
    marginHorizontal: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.xs : isSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md),
    borderRadius: isLandscape ? (isTablet ? 16 : 12) : (isUltraSmallScreen ? 8 : isSmallScreen ? 10 : isMediumScreen ? 12 : isLargeScreen ? 14 : 16),
    overflow: 'hidden',
  },
  shareButtonGradient: {
    paddingVertical: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.xl : responsiveSpacing.lg) : (isUltraSmallScreen ? responsiveSpacing.md : isSmallScreen ? responsiveSpacing.lg : responsiveSpacing.xl),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.md : responsiveFontSize.sm) : (isUltraSmallScreen ? responsiveFontSize.xs : isSmallScreen ? responsiveFontSize.sm : isMediumScreen ? responsiveFontSize.md : isLargeScreen ? responsiveFontSize.lg : responsiveFontSize.xl),
    fontWeight: '600',
    marginLeft: isLandscape ? (isTablet ? responsiveSpacing.sm : responsiveSpacing.xs) : (isUltraSmallScreen ? responsiveSpacing.xs : isSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md),
  },
  saveButtonGradient: {
    paddingVertical: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.xl : responsiveSpacing.lg) : (isUltraSmallScreen ? responsiveSpacing.md : isSmallScreen ? responsiveSpacing.lg : responsiveSpacing.xl),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.md : responsiveFontSize.sm) : (isUltraSmallScreen ? responsiveFontSize.xs : isSmallScreen ? responsiveFontSize.sm : isMediumScreen ? responsiveFontSize.md : isLargeScreen ? responsiveFontSize.lg : responsiveFontSize.xl),
    fontWeight: '600',
    marginLeft: isLandscape ? (isTablet ? responsiveSpacing.sm : responsiveSpacing.xs) : (isUltraSmallScreen ? responsiveSpacing.xs : isSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md),
  },
  editButton: {
    paddingVertical: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    borderRadius: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
    minHeight: isLandscape ? (isTablet ? 56 : 48) : (isUltraSmallScreen ? 40 : isSmallScreen ? 44 : isMediumScreen ? 48 : isLargeScreen ? 52 : 56),
  },
  editButtonText: {
    color: '#666666',
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.sm : responsiveFontSize.xs) : (isUltraSmallScreen ? responsiveFontSize.xs : isSmallScreen ? responsiveFontSize.sm : isMediumScreen ? responsiveFontSize.md : isLargeScreen ? responsiveFontSize.lg : responsiveFontSize.xl),
    fontWeight: '600',
  },
});

export default PosterPreviewScreen;
