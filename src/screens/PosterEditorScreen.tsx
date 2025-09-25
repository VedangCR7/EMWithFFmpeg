import React, { useState, useRef, useCallback, useEffect } from 'react';
// Optimized for small screen devices with responsive design improvements
// Canvas now gets 70% height on ultra-small screens, 65% on small screens, and 60% on larger screens
// Toolbar is now ultra-compact with responsive button sizes and optimized spacing
// Floating toolbar is optimized for small screens with responsive positioning and sizing
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  
  Image,
  FlatList,
  Animated,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import PosterCanvas from '../components/PosterCanvas';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PanGestureHandler, State, PinchGestureHandler } from 'react-native-gesture-handler';
import businessProfileService, { BusinessProfile } from '../services/businessProfile';
import authService from '../services/auth';
import { frames, Frame, getFramesByCategory } from '../data/frames';
import { mapBusinessProfileToFrameContent, generateLayersFromFrame, getFrameBackgroundSource } from '../utils/frameUtils';
import FrameSelector from '../components/FrameSelector';
import { GOOGLE_FONTS, getFontsByCategory, SYSTEM_FONTS, getFontFamily } from '../services/fontService';
import { useSubscription } from '../contexts/SubscriptionContext';
import Watermark from '../components/Watermark';
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
  
  // Calculate canvas dimensions based on screen size and orientation
  let canvasWidthRatio = 0.95;
  let canvasHeightRatio = 0.6;
  
  if (isLandscape) {
    // Landscape mode - prioritize width
    canvasWidthRatio = isTablet ? 0.7 : 0.8;
    canvasHeightRatio = isTablet ? 0.8 : 0.7;
  } else {
    // Portrait mode - standard ratios
    if (isUltraSmallScreen) {
      canvasWidthRatio = 0.98;
      canvasHeightRatio = 0.7;
    } else if (isSmallScreen) {
      canvasWidthRatio = 0.96;
      canvasHeightRatio = 0.65;
    } else if (isMediumScreen) {
      canvasWidthRatio = 0.94;
      canvasHeightRatio = 0.6;
    } else if (isLargeScreen) {
      canvasWidthRatio = 0.92;
      canvasHeightRatio = 0.55;
    } else {
      canvasWidthRatio = 0.9;
      canvasHeightRatio = 0.5;
    }
  }
  
  const canvasWidth = Math.min(availableWidth * canvasWidthRatio, screenWidth * canvasWidthRatio);
  const canvasHeight = Math.min(availableHeight * canvasHeightRatio, screenHeight * canvasHeightRatio);
  
  return {
    canvasWidth,
    canvasHeight,
    availableWidth,
    availableHeight,
    canvasWidthRatio,
    canvasHeightRatio
  };
};

// Enhanced responsive helpers with orientation and device type support
const getResponsiveSectionHeight = () => {
  if (isLandscape) {
    return isTablet ? 100 : 80;
  }
  return isUltraSmallScreen ? 50 : isSmallScreen ? 65 : isMediumScreen ? 80 : isLargeScreen ? 100 : 120;
};

const getResponsiveButtonSize = () => {
  if (isLandscape) {
    return isTablet ? 60 : 45;
  }
  return isUltraSmallScreen ? 40 : isSmallScreen ? 50 : isMediumScreen ? 60 : isLargeScreen ? 70 : 80;
};

const getResponsiveIconSize = () => {
  if (isLandscape) {
    return isTablet ? 20 : 16;
  }
  return isUltraSmallScreen ? 14 : isSmallScreen ? 16 : isMediumScreen ? 18 : isLargeScreen ? 20 : 22;
};

const getResponsiveSectionPadding = () => {
  if (isLandscape) {
    return isTablet ? 16 : 8;
  }
  return isUltraSmallScreen ? 4 : isSmallScreen ? 6 : isMediumScreen ? 8 : isLargeScreen ? 10 : 12;
};

const getResponsiveSectionMargin = () => {
  if (isLandscape) {
    return isTablet ? 20 : 10;
  }
  return isUltraSmallScreen ? 4 : isSmallScreen ? 6 : isMediumScreen ? 8 : isLargeScreen ? 12 : 15;
};

// Enhanced compact mode helpers
const getUltraCompactSpacing = () => {
  if (isLandscape) {
    return isTablet ? 12 : 6;
  }
  return isUltraSmallScreen ? 2 : isSmallScreen ? 4 : getResponsiveSectionPadding();
};

const getUltraCompactMargin = () => {
  if (isLandscape) {
    return isTablet ? 16 : 8;
  }
  return isUltraSmallScreen ? 2 : isSmallScreen ? 4 : getResponsiveSectionMargin();
};

// Enhanced header-specific responsive helpers
const getHeaderButtonSize = () => {
  if (isLandscape) {
    return isTablet ? 44 : 32;
  }
  return isUltraSmallScreen ? 28 : isSmallScreen ? 32 : isMediumScreen ? 36 : isLargeScreen ? 40 : 44;
};

const getHeaderPadding = () => {
  if (isLandscape) {
    return isTablet ? 12 : 6;
  }
  return isUltraSmallScreen ? 2 : isSmallScreen ? 4 : isMediumScreen ? 6 : isLargeScreen ? 8 : 10;
};

const getHeaderTitleSize = () => {
  if (isLandscape) {
    return isTablet ? 20 : 16;
  }
  return isUltraSmallScreen ? 14 : isSmallScreen ? 16 : isMediumScreen ? 18 : isLargeScreen ? 20 : 22;
};

const getHeaderSubtitleSize = () => {
  if (isLandscape) {
    return isTablet ? 14 : 12;
  }
  return isUltraSmallScreen ? 10 : isSmallScreen ? 11 : isMediumScreen ? 12 : isLargeScreen ? 13 : 14;
};

// Enhanced toolbar-specific responsive helpers
const getToolbarRightPosition = () => {
  if (isLandscape) {
    return isTablet ? 24 : 16;
  }
  return isUltraSmallScreen ? 6 : isSmallScreen ? 8 : isMediumScreen ? 12 : isLargeScreen ? 16 : 20;
};

const getToolbarButtonSize = () => {
  if (isLandscape) {
    return isTablet ? 70 : 55;
  }
  return isUltraSmallScreen ? 40 : isSmallScreen ? 45 : isMediumScreen ? 50 : isLargeScreen ? 55 : 60;
};

const getToolbarButtonTextSize = () => {
  if (isLandscape) {
    return isTablet ? 12 : 10;
  }
  return isUltraSmallScreen ? 8 : isSmallScreen ? 9 : isMediumScreen ? 10 : isLargeScreen ? 11 : 12;
};

interface Layer {
  id: string;
  type: 'text' | 'image' | 'logo';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  zIndex: number;
  fieldType?: string; // Add field type identifier
  style?: {
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    backgroundColor?: string;
  };
}

interface PosterEditorScreenProps {
  route: {
    params: {
      selectedImage: {
        uri: string;
        title?: string;
        description?: string;
      };
      selectedLanguage: string;
      selectedTemplateId: string;
    };
  };
}

const PosterEditorScreen: React.FC<PosterEditorScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { selectedImage, selectedLanguage, selectedTemplateId } = route.params;
  const { isSubscribed } = useSubscription();
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
  const { canvasWidth, canvasHeight, availableWidth, availableHeight } = getResponsiveDimensions(insets);

  // Create theme-aware styles
  const getThemeStyles = () => ({
    container: {
      flex: 1,
      backgroundColor: theme?.colors?.background || '#f8f9fa',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    modalContent: {
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: 20,
      padding: 20,
      width: screenWidth * 0.9,
      maxHeight: screenHeight * 0.7,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: isDarkMode ? 0.4 : 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    fontModalContent: {
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: 20,
      padding: 20,
      width: screenWidth * 0.9,
      height: screenHeight * 0.50,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: isDarkMode ? 0.4 : 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginBottom: 10,
    },
    modalSubtitle: {
      fontSize: 15,
      color: theme?.colors?.textSecondary || '#666666',
      marginBottom: 20,
      fontWeight: '500' as const,
    },
    textInput: {
      borderWidth: 2,
      borderColor: theme?.colors?.border || '#e9ecef',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      marginBottom: 20,
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      color: theme?.colors?.text || '#333333',
    },
    cancelButton: {
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      borderWidth: 2,
      borderColor: theme?.colors?.border || '#e9ecef',
    },
    cancelButtonText: {
      color: theme?.colors?.textSecondary || '#666666',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    profileItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      borderRadius: 12,
      marginBottom: 12,
    },
    profileLogoPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme?.colors?.border || '#e9ecef',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 16,
    },
    profileName: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginBottom: 4,
    },
    profileDescription: {
      fontSize: 13,
      color: theme?.colors?.textSecondary || '#666666',
      lineHeight: 18,
    },
    styleOption: {
      width: 48,
      height: 48,
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      borderRadius: 12,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      margin: 4,
      borderWidth: 2,
      borderColor: theme?.colors?.border || '#e9ecef',
    },
    styleOptionText: {
      fontSize: 14,
      color: theme?.colors?.text || '#333333',
      fontWeight: '600' as const,
    },
    styleSectionTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginBottom: 12,
    },
    fieldToggleSection: {
      width: '100%',
      backgroundColor: theme?.colors?.surface || 'rgba(255, 255, 255, 0.95)',
      borderRadius: 16,
      padding: 12,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: isDarkMode ? 0.2 : 0.1,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e9ecef',
      marginBottom: 15,
      marginHorizontal: 12,
    },
    fieldToggleTitle: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
    },
    fieldToggleSubtitle: {
      fontSize: 10,
      color: theme?.colors?.textSecondary || '#666666',
      marginTop: 1,
    },
    fieldToggleButton: {
      alignItems: 'center' as const,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: theme?.colors?.border || '#e9ecef',
      marginHorizontal: 4,
      flexDirection: 'row' as const,
      minWidth: 85,
      justifyContent: 'center' as const,
    },
    fieldToggleButtonText: {
      fontSize: 12,
      color: theme?.colors?.textSecondary || '#666666',
      marginLeft: 6,
      fontWeight: '500' as const,
    },
    footerStylesSection: {
      width: '100%',
      backgroundColor: theme?.colors?.surface || 'rgba(255, 255, 255, 0.95)',
      borderRadius: 16,
      padding: 12,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: isDarkMode ? 0.2 : 0.1,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e9ecef',
      marginBottom: 15,
      marginHorizontal: 12,
    },
    footerStylesTitle: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
    },
    footerStylesSubtitle: {
      fontSize: 10,
      color: theme?.colors?.textSecondary || '#666666',
      marginTop: 1,
    },
    footerStyleModalButton: {
      width: (screenWidth * 0.85 - 64) / 3 - 12,
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      marginHorizontal: 6,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e9ecef',
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isDarkMode ? 0.15 : 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    footerStyleModalPreview: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: theme?.colors?.border || '#e9ecef',
      overflow: 'hidden',
    },
    footerStyleModalText: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    footerStyleModalDescription: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: theme?.colors?.textSecondary || '#666666',
      textAlign: 'center' as const,
      lineHeight: 14,
      marginTop: 4,
    },
    footerStylePreview: {
      width: 70,
      height: 70,
      borderRadius: 8,
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: theme?.colors?.border || '#e9ecef',
      overflow: 'hidden',
    },
    footerStyleText: {
      fontSize: 10,
      color: theme?.colors?.textSecondary || '#666666',
      fontWeight: '600' as const,
      textAlign: 'center' as const,
      lineHeight: 12,
    },
    fontStyleModalTitle: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: theme?.colors?.text || '#333333',
      textAlign: 'center' as const,
      marginTop: 4,
    },
    fontStyleSectionTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginLeft: 12,
    },
    fontStyleSectionSubtitle: {
      fontSize: 14,
      color: theme?.colors?.textSecondary || '#666666',
      marginBottom: 16,
      marginLeft: 32,
      lineHeight: 20,
    },
    logoModalContent: {
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: 20,
      padding: 20,
      width: screenWidth * 0.9,
      maxHeight: screenHeight * 0.7,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: isDarkMode ? 0.4 : 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    logoModalTitle: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginBottom: 8,
    },
    logoModalSubtitle: {
      fontSize: 15,
      color: theme?.colors?.textSecondary || '#666666',
      marginBottom: 20,
      fontWeight: '500' as const,
    },
    logoModalCloseText: {
      color: theme?.colors?.textSecondary || '#666666',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    instructionsContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -100 }, { translateY: -20 }],
      alignItems: 'center' as const,
      backgroundColor: theme?.colors?.surface || 'rgba(255, 255, 255, 0.95)',
      padding: 20,
      borderRadius: 16,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: isDarkMode ? 0.2 : 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    instructionsText: {
      fontSize: 14,
      color: theme?.colors?.textSecondary || '#666666',
      textAlign: 'center' as const,
      marginTop: 8,
      maxWidth: 200,
      lineHeight: 20,
    },
    loadingContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -50 }, { translateY: -20 }],
      alignItems: 'center' as const,
      backgroundColor: theme?.colors?.surface || 'rgba(255, 255, 255, 0.95)',
      padding: 20,
      borderRadius: 16,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: isDarkMode ? 0.2 : 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    loadingText: {
      fontSize: 14,
      color: theme?.colors?.textSecondary || '#666666',
      textAlign: 'center' as const,
      marginTop: 8,
    },
    toolbar: {
      position: 'absolute',
      right: 20,
      top: '50%',
      transform: [{ translateY: -100 }],
      backgroundColor: theme?.colors?.surface || 'rgba(255, 255, 255, 0.95)',
      borderRadius: 16,
      padding: 12,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: isDarkMode ? 0.2 : 0.15,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 100,
    },
  });

  const themeStyles = getThemeStyles();

  
      // Ref for capturing the poster as image
    const posterRef = useRef<ViewShot>(null);
    const visibleCanvasRef = useRef<ViewShot>(null);
  

  

  


  // State for layers
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showFontStyleModal, setShowFontStyleModal] = useState(false);
  const [showLogoSelectionModal, setShowLogoSelectionModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  
  // State for dragging
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  
  // Animated values for each layer's position (not just translation)
  const layerAnimations = useRef<{ [key: string]: { x: Animated.Value; y: Animated.Value } }>({}).current;
  
  // Translation values for dragging
  const translationValues = useRef<{ [key: string]: { x: Animated.Value; y: Animated.Value } }>({}).current;
  
  // Scale values for zooming
  const scaleValues = useRef<{ [key: string]: Animated.Value }>({}).current;
  
  // State for field visibility
  const [visibleFields, setVisibleFields] = useState<{[key: string]: boolean}>({
    logo: true,
    companyName: true,
    footerCompanyName: true,
    footerBackground: true,
    phone: true,
    email: true,
    website: true,
    category: true,
    address: true,
  });
  
  // Store original layers for frame removal
  const [originalLayers, setOriginalLayers] = useState<Layer[]>([]);

  // State for templates
  const [selectedTemplate, setSelectedTemplate] = useState<string>('business');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // State for business profiles
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<BusinessProfile | null>(null);
  const [showProfileSelectionModal, setShowProfileSelectionModal] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);



  // State for frames
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [showFrameSelector, setShowFrameSelector] = useState(false);
  const [frameContent, setFrameContent] = useState<{[key: string]: string}>({});
  const [applyingFrame, setApplyingFrame] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentPositions, setCurrentPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
  const currentPositionsRef = useRef<{ [key: string]: { x: number; y: number } }>({});

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Canvas dimensions - using responsive dimensions from getResponsiveDimensions

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Fetch business profiles on component mount
  useEffect(() => {
    fetchBusinessProfiles();
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Fetch business profiles - now user-specific
  const fetchBusinessProfiles = async () => {
    try {
      setLoadingProfiles(true);
      
      // Get current user ID
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        console.log('⚠️ No user ID available, using fallback business profiles');
        // Use mock data if no user ID
        const mockProfiles = [
          {
            id: '1',
            name: 'Tech Solutions Inc.',
            description: 'Leading technology solutions provider',
            category: 'Technology',
            address: '123 Innovation Drive, Tech City',
            phone: '+1 (555) 123-4567',
            email: 'contact@techsolutions.com',
            services: ['Custom Software Development', 'Web Development'],
            workingHours: {},
            rating: 4.8,
            reviewCount: 156,
            isVerified: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T14:30:00Z',
          }
        ];
        setBusinessProfiles(mockProfiles);
        setSelectedBusinessProfile(mockProfiles[0]);
        applyBusinessProfileToPoster(mockProfiles[0]);
        return;
      }
      
      console.log('🔍 Fetching user-specific business profiles for user:', userId);
      
      // Fetch user-specific business profiles
      const profiles = await businessProfileService.getUserBusinessProfiles(userId);
      
      if (profiles.length > 0) {
        setBusinessProfiles(profiles);
        console.log('✅ Loaded user-specific business profiles:', profiles.length);
        
        if (profiles.length === 1) {
          // If only one profile, auto-select it
          setSelectedBusinessProfile(profiles[0]);
          applyBusinessProfileToPoster(profiles[0]);
        } else if (profiles.length > 1) {
          // If multiple profiles, show selection modal
          setShowProfileSelectionModal(true);
        }
      } else {
        console.log('⚠️ No user-specific business profiles found, using fallback');
        // Use mock data if no user profiles found
        const mockProfiles = [
          {
            id: '1',
            name: 'Tech Solutions Inc.',
            description: 'Leading technology solutions provider',
            category: 'Technology',
            address: '123 Innovation Drive, Tech City',
            phone: '+1 (555) 123-4567',
            email: 'contact@techsolutions.com',
            services: ['Custom Software Development', 'Web Development'],
            workingHours: {},
            rating: 4.8,
            reviewCount: 156,
            isVerified: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T14:30:00Z',
          }
        ];
        setBusinessProfiles(mockProfiles);
        setSelectedBusinessProfile(mockProfiles[0]);
        applyBusinessProfileToPoster(mockProfiles[0]);
      }
    } catch (error) {
      console.error('Error fetching user-specific business profiles:', error);
      // Use mock data immediately on error
      const mockProfiles = [
        {
          id: '1',
          name: 'Tech Solutions Inc.',
          description: 'Leading technology solutions provider',
          category: 'Technology',
          address: '123 Innovation Drive, Tech City',
          phone: '+1 (555) 123-4567',
          email: 'contact@techsolutions.com',
          services: ['Custom Software Development', 'Web Development'],
          workingHours: {},
          rating: 4.8,
          reviewCount: 156,
          isVerified: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T14:30:00Z',
        }
      ];
      setBusinessProfiles(mockProfiles);
      setSelectedBusinessProfile(mockProfiles[0]);
      applyBusinessProfileToPoster(mockProfiles[0]);
      Alert.alert('Error', 'Failed to load business profiles');
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Apply business profile data to poster
  const applyBusinessProfileToPoster = (profile: BusinessProfile) => {
    setSelectedBusinessProfile(profile);
    setShowProfileSelectionModal(false);
    
    // Auto-set template based on business profile category
    if (profile.category) {
      const categoryToTemplate: { [key: string]: string } = {
        'Restaurant': 'restaurant',
        'Food & Beverage': 'restaurant',
        'Cafe': 'restaurant',
        'Bar': 'restaurant',
        'Hotel': 'business',
        'Event Planning': 'event',
        'Wedding': 'wedding',
        'Fashion': 'fashion',
        'Real Estate': 'real-estate',
        'Education': 'education',
        'Healthcare': 'healthcare',
        'Fitness': 'fitness',
        'Technology': 'tech',
        'Creative': 'creative',
        'Corporate': 'corporate',
        'Luxury': 'luxury',
        'Modern': 'modern',
        'Vintage': 'vintage',
        'Retro': 'retro',
        'Elegant': 'elegant',
        'Bold': 'bold',
        'Nature': 'nature',
        'Ocean': 'ocean',
        'Sunset': 'sunset',
        'Cosmic': 'cosmic',
        'Artistic': 'artistic',
        'Sport': 'sport',
        'Warm': 'warm',
        'Cool': 'cool',
      };
      
      const template = categoryToTemplate[profile.category] || 'business';
      setSelectedTemplate(template);
      console.log(`Auto-setting template to '${template}' based on business category '${profile.category}'`);
    }
    
    // Generate content from business profile
    const content = mapBusinessProfileToFrameContent(profile);
    setFrameContent(content);
    
    // If a frame is selected, apply it with the new content
    if (selectedFrame) {
      const frameLayers = generateLayersFromFrame(selectedFrame, content, canvasWidth, canvasHeight);
      setLayers(frameLayers);
    } else {
      // Create default layers from business profile
      const newLayers: Layer[] = [];

      // Add company logo on top right with responsive sizing
      if (profile.companyLogo || profile.logo) {
        const logoSize = Math.max(40, Math.min(80, canvasWidth * 0.15)); // Responsive logo size
        const logoLayer: Layer = {
          id: generateId(),
          type: 'logo',
          content: profile.companyLogo || profile.logo || 'https://via.placeholder.com/80x80/667eea/ffffff?text=LOGO',
          position: { x: canvasWidth - 100, y: 20 }, // Keep same position
          size: { width: logoSize, height: logoSize }, // Responsive size
          rotation: 0,
          zIndex: 10,
          fieldType: 'logo',
        };
        newLayers.push(logoLayer);
      }

    // Add company name on top left with responsive font size
    if (profile.name) {
      const companyNameSize = Math.max(16, Math.min(24, canvasWidth * 0.06)); // Responsive font size
      const companyNameLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: profile.name,
        position: { x: 20, y: 30 }, // Keep same position
        size: { width: canvasWidth - 140, height: 60 }, // Keep same size
        rotation: 0,
        zIndex: 10,
        fieldType: 'companyName',
        style: {
          fontSize: companyNameSize, // Responsive font size
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '600',
        },
      };
      newLayers.push(companyNameLayer);
    }

    // Create professional footer with contact information
    const footerHeight = 140;
    const footerY = canvasHeight - footerHeight;
    
    // Responsive font sizes for footer elements
    const getResponsiveFooterFontSize = (baseSize: number) => {
      const scaleFactor = Math.min(canvasWidth / 400, canvasHeight / 600); // Scale based on canvas size
      return Math.max(baseSize * scaleFactor, baseSize * 0.8); // Minimum 80% of base size
    };
    
    const footerTitleSize = getResponsiveFooterFontSize(16);
    const footerTextSize = getResponsiveFooterFontSize(10);
    
    // Footer background overlay for better readability
    const footerBackgroundLayer: Layer = {
      id: generateId(),
      type: 'text',
      content: '',
      position: { x: 0, y: footerY },
      size: { width: canvasWidth, height: footerHeight },
      rotation: 0,
      zIndex: 5,
      fieldType: 'footerBackground',
      style: {
        fontSize: 0,
        color: 'transparent',
        fontFamily: 'System',
        fontWeight: '400',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      },
    };
    newLayers.push(footerBackgroundLayer);

    // Company name in footer with responsive font size
    if (profile.name) {
      const footerCompanyNameLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: profile.name,
        position: { x: 20, y: footerY + 15 }, // Keep same position
        size: { width: canvasWidth - 40, height: 25 }, // Keep same size
        rotation: 0,
        zIndex: 10,
        fieldType: 'footerCompanyName',
        style: {
          fontSize: footerTitleSize, // Responsive font size
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '600',
        },
      };
      newLayers.push(footerCompanyNameLayer);
    }

    // Contact information in two columns
    const leftColumnX = 20;
    const rightColumnX = canvasWidth / 2 + 10;
    const contactStartY = footerY + 45;
    const contactLineHeight = 16;

    // Left column - Phone and Email with responsive font sizes
    if (profile.phone) {
      const phoneLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: `📞 ${profile.phone}`,
        position: { x: leftColumnX, y: contactStartY }, // Keep same position
        size: { width: (canvasWidth - 40) / 2, height: contactLineHeight * 2 }, // Increased height for text wrapping
        rotation: 0,
        zIndex: 10,
        fieldType: 'phone',
        style: {
          fontSize: footerTextSize, // Responsive font size
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
      };
      newLayers.push(phoneLayer);
    }

    if (profile.email) {
      const emailLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: `✉️ ${profile.email}`,
        position: { x: leftColumnX, y: contactStartY + contactLineHeight }, // Keep same position
        size: { width: (canvasWidth - 40) / 2, height: contactLineHeight * 2 }, // Increased height for text wrapping
        rotation: 0,
        zIndex: 10,
        fieldType: 'email',
        style: {
          fontSize: footerTextSize, // Responsive font size
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
      };
      newLayers.push(emailLayer);
    }

    // Right column - Website and Category with responsive font sizes
    if (profile.website) {
      const websiteLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: `🌐 ${profile.website}`,
        position: { x: rightColumnX, y: contactStartY }, // Keep same position
        size: { width: (canvasWidth - 40) / 2, height: contactLineHeight * 2 }, // Increased height for text wrapping
        rotation: 0,
        zIndex: 10,
        fieldType: 'website',
        style: {
          fontSize: footerTextSize, // Responsive font size
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
      };
      newLayers.push(websiteLayer);
    }

    if (profile.category) {
      const categoryLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: `🏢 ${profile.category}`,
        position: { x: rightColumnX, y: contactStartY + contactLineHeight }, // Keep same position
        size: { width: (canvasWidth - 40) / 2, height: contactLineHeight * 2 }, // Increased height for text wrapping
        rotation: 0,
        zIndex: 10,
        fieldType: 'category',
        style: {
          fontSize: footerTextSize, // Responsive font size
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
      };
      newLayers.push(categoryLayer);
    }

    // Address on a separate line (full width) with responsive font size
    if (profile.address) {
      const addressLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: `📍 ${profile.address}`,
        position: { x: 20, y: contactStartY + contactLineHeight * 2 + 8 }, // Keep same position
        size: { width: canvasWidth - 40, height: contactLineHeight * 2 }, // Increased height for text wrapping
        rotation: 0,
        zIndex: 10,
        fieldType: 'address',
        style: {
          fontSize: footerTextSize, // Responsive font size
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
      };
      newLayers.push(addressLayer);
    }

    // Services as a tag line with responsive font size
    if (profile.services && profile.services.length > 0) {
      const servicesText = profile.services.slice(0, 3).join(' • ');
      const servicesLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: `🛠️ ${servicesText}${profile.services.length > 3 ? '...' : ''}`,
        position: { x: 20, y: contactStartY + contactLineHeight * 3 + 15 }, // Keep same position
        size: { width: canvasWidth - 40, height: contactLineHeight * 2 }, // Increased height for text wrapping
        rotation: 0,
        zIndex: 10,
        fieldType: 'services',
        style: {
          fontSize: Math.max(8, footerTextSize - 1), // Responsive font size (slightly smaller)
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
      };
      newLayers.push(servicesLayer);
    }

    setLayers(newLayers);
    
    // Initialize animated values for new layers
    newLayers.forEach(layer => {
      if (!layerAnimations[layer.id]) {
        layerAnimations[layer.id] = {
          x: new Animated.Value(layer.position.x),
          y: new Animated.Value(layer.position.y)
        };
      }
      if (!translationValues[layer.id]) {
        translationValues[layer.id] = {
          x: new Animated.Value(0),
          y: new Animated.Value(0)
        };
      }
    });
    }
  };

  // Handle business profile selection
  const handleProfileSelection = (profile: BusinessProfile) => {
    setSelectedBusinessProfile(profile);
    setShowProfileSelectionModal(false);
    applyBusinessProfileToPoster(profile);
  };

  // Toggle field visibility
  const toggleFieldVisibility = (fieldType: string) => {
    setVisibleFields(prev => ({
      ...prev,
      [fieldType]: !prev[fieldType]
    }));
  };

  // Handle pan gesture for dragging layers
  const onPanGestureEvent = useCallback((layerId: string) => {
    // Ensure translation values exist for this layer
    if (!translationValues[layerId]) {
      translationValues[layerId] = {
        x: new Animated.Value(0),
        y: new Animated.Value(0)
      };
    }
    
    return Animated.event(
      [{ nativeEvent: { translationX: translationValues[layerId].x, translationY: translationValues[layerId].y } }],
      { useNativeDriver: true }
    );
  }, [translationValues]);

  // Handle pan gesture state changes
  const onHandlerStateChange = useCallback((layerId: string) => {
    return (event: any) => {
      if (event.nativeEvent.state === State.BEGAN) {
        setDraggedLayer(layerId);
        setSelectedLayer(layerId);
        // Reset translation values when drag begins
        if (translationValues[layerId]) {
          translationValues[layerId].x.setValue(0);
          translationValues[layerId].y.setValue(0);
        }
      } else if (event.nativeEvent.state === State.END) {
        const { translationX, translationY } = event.nativeEvent;
        
        // Get current layer
        const currentLayer = layers.find(layer => layer.id === layerId);
        if (!currentLayer) return;
        
        // Calculate new position with boundaries
        const newX = Math.max(0, Math.min(canvasWidth - currentLayer.size.width, currentLayer.position.x + translationX));
        const newY = Math.max(0, Math.min(canvasHeight - currentLayer.size.height, currentLayer.position.y + translationY));
        
        // Update the animated position values directly
        if (layerAnimations[layerId]) {
          layerAnimations[layerId].x.setValue(newX);
          layerAnimations[layerId].y.setValue(newY);
        }
        
        // Update layer position in state
        setLayers(prev => prev.map(layer => {
          if (layer.id === layerId) {
            return {
              ...layer,
              position: { x: newX, y: newY }
            };
          }
          return layer;
        }));
        
        // Reset translation values to 0 for next drag
        if (translationValues[layerId]) {
          translationValues[layerId].x.setValue(0);
          translationValues[layerId].y.setValue(0);
        }
        
        setDraggedLayer(null);
      }
    };
  }, [layers, canvasWidth, canvasHeight, layerAnimations, translationValues]);

  // Handle pinch gesture for zooming
  const onPinchGestureEvent = useCallback((layerId: string) => {
    // Ensure scale values exist for this layer
    if (!scaleValues[layerId]) {
      scaleValues[layerId] = new Animated.Value(1);
    }
    
    return Animated.event(
      [{ nativeEvent: { scale: scaleValues[layerId] } }],
      { useNativeDriver: true }
    );
  }, [scaleValues]);

  // Handle pinch gesture state changes
  const onPinchHandlerStateChange = useCallback((layerId: string) => {
    return (event: any) => {
      if (event.nativeEvent.state === State.BEGAN) {
        setSelectedLayer(layerId);
        // Reset scale value when pinch begins
        if (scaleValues[layerId]) {
          scaleValues[layerId].setValue(1);
        }
      } else if (event.nativeEvent.state === State.ACTIVE) {
        // Real-time scaling during pinch
        const { scale } = event.nativeEvent;
        
        // Get current layer
        const currentLayer = layers.find(layer => layer.id === layerId);
        if (!currentLayer) return;
        
        // Calculate new size with constraints
        const minScale = 0.2;
        const maxScale = 5.0;
        const constrainedScale = Math.max(minScale, Math.min(maxScale, scale));
        
        const newWidth = currentLayer.size.width * constrainedScale;
        const newHeight = currentLayer.size.height * constrainedScale;
        
        // Check boundaries
        const maxWidth = canvasWidth - currentLayer.position.x;
        const maxHeight = canvasHeight - currentLayer.position.y;
        const finalWidth = Math.min(newWidth, maxWidth);
        const finalHeight = Math.min(newHeight, maxHeight);
        
        // Update layer size in state for real-time feedback
        setLayers(prev => prev.map(layer => {
          if (layer.id === layerId) {
            return {
              ...layer,
              size: { width: finalWidth, height: finalHeight }
            };
          }
          return layer;
        }));
      } else if (event.nativeEvent.state === State.END) {
        // Finalize the scaling
        const { scale } = event.nativeEvent;
        
        // Get current layer
        const currentLayer = layers.find(layer => layer.id === layerId);
        if (!currentLayer) return;
        
        // Calculate new size with constraints
        const minScale = 0.2;
        const maxScale = 5.0;
        const constrainedScale = Math.max(minScale, Math.min(maxScale, scale));
        
        const newWidth = currentLayer.size.width * constrainedScale;
        const newHeight = currentLayer.size.height * constrainedScale;
        
        // Check boundaries
        const maxWidth = canvasWidth - currentLayer.position.x;
        const maxHeight = canvasHeight - currentLayer.position.y;
        const finalWidth = Math.min(newWidth, maxWidth);
        const finalHeight = Math.min(newHeight, maxHeight);
        
        // Update layer size in state
        setLayers(prev => prev.map(layer => {
          if (layer.id === layerId) {
            return {
              ...layer,
              size: { width: finalWidth, height: finalHeight }
            };
          }
          return layer;
        }));
        
        // Reset scale value to 1 for next pinch
        if (scaleValues[layerId]) {
          scaleValues[layerId].setValue(1);
        }
      }
    };
  }, [layers, canvasWidth, canvasHeight, scaleValues]);



  // Add text layer
  const addTextLayer = useCallback(() => {
    if (newText.trim()) {
      const newLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: newText,
        position: { x: canvasWidth / 2 - 50, y: canvasHeight / 2 - 20 },
        size: { width: 100, height: 40 },
        rotation: 0,
        zIndex: layers.length,
        style: {
          fontSize: 16,
          color: '#000000',
          fontFamily: 'System',
          fontWeight: '400',
        },
      };
      setLayers(prev => [...prev, newLayer]);
      setNewText('');
      setShowTextModal(false);
    }
  }, [newText, canvasWidth, canvasHeight, layers.length]);

  // Add image layer
  const addImageLayer = useCallback(() => {
    if (newImageUrl.trim()) {
      const newLayer: Layer = {
        id: generateId(),
        type: 'image',
        content: newImageUrl,
        position: { x: canvasWidth / 2 - 50, y: canvasHeight / 2 - 50 },
        size: { width: 100, height: 100 },
        rotation: 0,
        zIndex: layers.length,
      };
      setLayers(prev => [...prev, newLayer]);
      setNewImageUrl('');
      setShowImageModal(false);
    }
  }, [newImageUrl, canvasWidth, canvasHeight, layers.length]);

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Handle camera access
  const handleCameraAccess = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as const,
    };

    try {
      const result = await launchCamera(options);
      if (result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (imageUri) {
          addLogoLayerFromImage(imageUri);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to access camera. Please try again.');
    }
  };

  // Handle gallery access
  const handleGalleryAccess = async () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as const,
    };

    try {
      const result = await launchImageLibrary(options);
      if (result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (imageUri) {
          addLogoLayerFromImage(imageUri);
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to access gallery. Please try again.');
    }
  };

  // Add logo layer from image
  const addLogoLayerFromImage = useCallback((imageUri: string) => {
    const newLayer: Layer = {
      id: generateId(),
      type: 'logo',
      content: imageUri,
      position: { x: 20, y: 20 },
      size: { width: 80, height: 80 },
      rotation: 0,
      zIndex: layers.length,
    };
    setLayers(prev => [...prev, newLayer]);
  }, [layers.length]);

  // Add logo layer (fallback)
  const addLogoLayer = useCallback(() => {
    const newLayer: Layer = {
      id: generateId(),
      type: 'logo',
      content: 'https://via.placeholder.com/80x80/667eea/ffffff?text=LOGO',
      position: { x: 20, y: 20 },
      size: { width: 80, height: 80 },
      rotation: 0,
      zIndex: layers.length,
    };
    setLayers(prev => [...prev, newLayer]);
  }, [layers.length]);

  // Apply template to poster
  const applyTemplate = useCallback((templateType: string) => {
    setSelectedTemplate(templateType);
    setShowTemplatesModal(false);
    
    // Apply different poster layouts and styles based on template
    setLayers(prev => prev.map(layer => {
      if (layer.fieldType === 'footerBackground') {
        // Template-based footer styles
        const templateStyles = {
          'business': { backgroundColor: 'rgba(102, 126, 234, 0.9)' },
          'event': { backgroundColor: 'rgba(239, 68, 68, 0.9)' },
          'restaurant': { backgroundColor: 'rgba(34, 197, 94, 0.9)' },
          'fashion': { backgroundColor: 'rgba(236, 72, 153, 0.9)' },
          'real-estate': { backgroundColor: 'rgba(245, 158, 11, 0.9)' },
          'education': { backgroundColor: 'rgba(59, 130, 246, 0.9)' },
          'healthcare': { backgroundColor: 'rgba(6, 182, 212, 0.9)' },
          'fitness': { backgroundColor: 'rgba(168, 85, 247, 0.9)' },
          'wedding': { backgroundColor: 'rgba(212, 175, 55, 0.9)' },
          'birthday': { backgroundColor: 'rgba(251, 146, 60, 0.9)' },
          'corporate': { backgroundColor: 'rgba(30, 41, 59, 0.95)' },
          'creative': { backgroundColor: 'rgba(147, 51, 234, 0.9)' },
          'minimal': { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
          'luxury': { backgroundColor: 'rgba(212, 175, 55, 0.95)' },
          'modern': { backgroundColor: 'rgba(102, 126, 234, 0.8)' },
          'vintage': { backgroundColor: 'rgba(120, 113, 108, 0.9)' },
          'retro': { backgroundColor: 'rgba(251, 146, 60, 0.9)' },
          'elegant': { backgroundColor: 'rgba(139, 69, 19, 0.9)' },
          'bold': { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
          'tech': { backgroundColor: 'rgba(30, 41, 59, 0.95)' },
          'nature': { backgroundColor: 'rgba(34, 197, 94, 0.8)' },
          'ocean': { backgroundColor: 'rgba(6, 182, 212, 0.9)' },
          'sunset': { backgroundColor: 'rgba(239, 68, 68, 0.9)' },
          'cosmic': { backgroundColor: 'rgba(30, 41, 59, 0.95)' },
          'artistic': { backgroundColor: 'rgba(168, 85, 247, 0.9)' },
          'sport': { backgroundColor: 'rgba(239, 68, 68, 0.9)' },
          'warm': { backgroundColor: 'rgba(245, 158, 11, 0.9)' },
          'cool': { backgroundColor: 'rgba(59, 130, 246, 0.9)' },
        };
        
        return {
          ...layer,
          style: {
            ...layer.style,
            ...templateStyles[templateType as keyof typeof templateStyles] || templateStyles['business']
          }
        };
      }
      
      // Update text colors for footer elements based on template
      if (['footerCompanyName', 'phone', 'email', 'website', 'category', 'address', 'services'].includes(layer.fieldType || '')) {
        const textColors = {
          'business': '#ffffff',
          'event': '#ffffff',
          'restaurant': '#ffffff',
          'fashion': '#ffffff',
          'real-estate': '#ffffff',
          'education': '#ffffff',
          'healthcare': '#ffffff',
          'fitness': '#ffffff',
          'wedding': '#000000',
          'birthday': '#ffffff',
          'corporate': '#ffffff',
          'creative': '#ffffff',
          'minimal': '#1f2937',
          'luxury': '#000000',
          'modern': '#ffffff',
          'vintage': '#ffffff',
          'retro': '#ffffff',
          'elegant': '#ffffff',
          'bold': '#ffffff',
          'tech': '#00ff00',
          'nature': '#ffffff',
          'ocean': '#ffffff',
          'sunset': '#ffffff',
          'cosmic': '#ffffff',
          'artistic': '#ffffff',
          'sport': '#ffffff',
          'warm': '#ffffff',
          'cool': '#ffffff',
        };
        
        return {
          ...layer,
          style: {
            ...layer.style,
            color: textColors[templateType as keyof typeof textColors] || textColors['business']
          }
        };
      }
      
      return layer;
    }));
  }, []);

  // Update layer position
  const updateLayerPosition = useCallback((layerId: string, position: { x: number; y: number }) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, position } : layer
    ));
  }, []);

  // Update layer style
  const updateLayerStyle = useCallback((layerId: string, style: Partial<NonNullable<Layer['style']>>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, style: { ...layer.style, ...style } } : layer
    ));
  }, []);

  // Delete layer
  const deleteLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    setSelectedLayer(null);
  }, []);



  // Apply frame
  const applyFrame = useCallback((frame: Frame) => {
    setApplyingFrame(true);
    
    // Store current layers as original before applying frame
    setOriginalLayers([...layers]);
    
    setSelectedFrame(frame);
    setShowFrameSelector(false);
    
    // Generate content from business profile
    if (selectedBusinessProfile) {
      const content = mapBusinessProfileToFrameContent(selectedBusinessProfile);
      setFrameContent(content);
      
      // Generate layers from frame
      const frameLayers = generateLayersFromFrame(frame, content, canvasWidth, canvasHeight);
      
      // Replace existing layers with frame layers
      setLayers(frameLayers);
      
      // Make all frame-generated content visible
      const frameFieldTypes = frame.placeholders.map(p => p.key);
      setVisibleFields(prev => {
        const newVisibleFields = { ...prev };
        frameFieldTypes.forEach(fieldType => {
          newVisibleFields[fieldType] = true;
        });
        return newVisibleFields;
      });
    }
    
    // Hide loading after a short delay
    setTimeout(() => {
      setApplyingFrame(false);
    }, 500);
  }, [selectedBusinessProfile, canvasWidth, canvasHeight, layers]);

  // Apply font style
  const applyFontStyle = useCallback((fontFamily: string) => {
    const actualFontFamily = getFontFamily(fontFamily);
    setLayers(prev => prev.map(layer => 
      layer.type === 'text' 
        ? { ...layer, style: { ...layer.style, fontFamily: actualFontFamily } }
        : layer
    ));
    setShowFontStyleModal(false);
  }, []);

  // Render layer
  const renderLayer = useCallback((layer: Layer) => {
    const isSelected = selectedLayer === layer.id;
    
    // Check if layer should be visible based on field type
    if (layer.fieldType && !visibleFields[layer.fieldType]) {
      return null;
    }
    
    // Initialize animated values for this layer if they don't exist
    if (!layerAnimations[layer.id]) {
      layerAnimations[layer.id] = {
        x: new Animated.Value(layer.position.x),
        y: new Animated.Value(layer.position.y)
      };
    }
    
    // Initialize translation values for this layer if they don't exist
    if (!translationValues[layer.id]) {
      translationValues[layer.id] = {
        x: new Animated.Value(0),
        y: new Animated.Value(0)
      };
    }

    const layerStyle = {
      position: 'absolute' as const,
      width: layer.size.width,
      height: layer.size.height,
      zIndex: layer.zIndex,
      transform: [
        { translateX: layerAnimations[layer.id].x },
        { translateY: layerAnimations[layer.id].y },
        { rotate: `${layer.rotation}deg` }
      ],
    };

    const handleLayerPress = () => {
      setSelectedLayer(layer.id);
    };

    switch (layer.type) {
      case 'text':
        // Special handling for footer background
        if (layer.content === '' && layer.fieldType === 'footerBackground') {
          return (
            <Animated.View
              key={layer.id}
              style={[
                styles.layer,
                {
                  position: 'absolute',
                  width: layer.size.width,
                  height: layer.size.height,
                  zIndex: layer.zIndex,
                  backgroundColor: layer.style?.backgroundColor || 'rgba(0, 0, 0, 0.6)',
                  borderRadius: 0,
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  transform: [
                    { translateX: layerAnimations[layer.id].x },
                    { translateY: layerAnimations[layer.id].y }
                  ],
                }
              ]}
            />
          );
        }
        
        return (
          <Animated.View
            style={[
              styles.layer,
              layerStyle,
              isSelected && styles.selectedLayer,
              draggedLayer === layer.id && styles.draggedLayer,
              draggedLayer === layer.id && {
                transform: [
                  { translateX: Animated.add(layerAnimations[layer.id].x, translationValues[layer.id].x) },
                  { translateY: Animated.add(layerAnimations[layer.id].y, translationValues[layer.id].y) },
                  { rotate: `${layer.rotation}deg` }
                ]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.layerTouchable}
              onPress={handleLayerPress}
            >
              <Text style={[styles.layerText, {
                fontSize: layer.style?.fontSize,
                color: layer.style?.color,
                fontFamily: layer.style?.fontFamily,
                fontWeight: layer.style?.fontWeight as any,
              }]} numberOfLines={0}>
                {layer.content}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      case 'image':
      case 'logo':
        return (
          <Animated.View
            style={[
              styles.layer,
              layerStyle,
              isSelected && styles.selectedLayer,
              layer.type === 'logo' && styles.selectedLayerImage,
              draggedLayer === layer.id && styles.draggedLayer,
              draggedLayer === layer.id && {
                transform: [
                  { translateX: Animated.add(layerAnimations[layer.id].x, translationValues[layer.id].x) },
                  { translateY: Animated.add(layerAnimations[layer.id].y, translationValues[layer.id].y) },
                  { rotate: `${layer.rotation}deg` }
                ]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.layerTouchable}
              onPress={handleLayerPress}
            >
              <Image
                source={{ uri: layer.content }}
                style={styles.layerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </Animated.View>
        );
      default:
        return null;
    }
  }, [selectedLayer, visibleFields, draggedLayer, layerAnimations, translationValues]);

  // Render business profile selection item
  const renderProfileItem = ({ item }: { item: BusinessProfile }) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={() => handleProfileSelection(item)}
    >
      <View style={styles.profileItemContent}>
        {item.companyLogo || item.logo ? (
          <Image
            source={{ uri: item.companyLogo || item.logo }}
            style={styles.profileLogo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.profileLogoPlaceholder}>
            <Icon name="business" size={24} color="#667eea" />
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{item.name}</Text>
          <Text style={styles.profileCategory}>{item.category}</Text>
          <Text style={styles.profileDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={24} color="#666666" />
    </TouchableOpacity>
  );

  return (
    <Animated.View 
      style={[
        themeStyles.container, 
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      
      {/* Professional Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.header, { 
          paddingTop: insets.top + (isUltraSmallScreen ? 2 : isSmallScreen ? responsiveSpacing.xs : responsiveSpacing.sm) 
        }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={getResponsiveIconSize()} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Poster Editor</Text>
          <Text style={styles.headerSubtitle}>
            {selectedImage.title || 'Custom Poster'} • {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={async () => {
            // Test capture first
            console.log('=== TESTING VIEWSHOT CAPTURE ===');
            console.log('Canvas dimensions - Hidden:', { width: screenWidth * 0.98, height: screenHeight * 0.65 });
            console.log('Canvas dimensions - Visible:', { width: screenWidth * 0.98, height: screenHeight * 0.65 });
            console.log('Layers count:', layers.length);
            console.log('Selected frame:', selectedFrame?.id);
            console.log('Selected template:', selectedTemplate);
            try {
              if (posterRef.current && posterRef.current.capture) {
                console.log('Testing capture...');
                const testUri = await posterRef.current.capture();
                console.log('Test capture result:', testUri);
                console.log('Test URI type:', typeof testUri);
                console.log('Test URI length:', testUri?.length);
              } else {
                console.log('ViewShot not available for testing');
              }
            } catch (testError) {
              console.error('Test capture failed:', testError);
            }
            console.log('=== END TEST ===');
            
            // Original capture logic
            console.log('Next button pressed - starting capture process');
            console.log('Poster ref available:', !!posterRef.current);
            console.log('Poster ref capture method available:', !!posterRef.current?.capture);
            console.log('Current layers state:', layers.length);
            console.log('Visible fields:', visibleFields);
            
            // Capture current animated positions before taking ViewShot
            const newCurrentPositions: { [key: string]: { x: number; y: number } } = {};
            layers.forEach(layer => {
              if (layerAnimations[layer.id] && translationValues[layer.id]) {
                const baseX = (layerAnimations[layer.id].x as any)._value || 0;
                const translationX = (translationValues[layer.id].x as any)._value || 0;
                const baseY = (layerAnimations[layer.id].y as any)._value || 0;
                const translationY = (translationValues[layer.id].y as any)._value || 0;
                
                newCurrentPositions[layer.id] = {
                  x: baseX + translationX,
                  y: baseY + translationY
                };
                
                console.log(`Layer ${layer.id} current position:`, newCurrentPositions[layer.id]);
              }
            });
            
            // Update both state and ref with current positions
            setCurrentPositions(newCurrentPositions);
            currentPositionsRef.current = newCurrentPositions;
            
            // Log current layer positions for debugging
            console.log('Current layer positions:', newCurrentPositions);
            
            try {
              if (visibleCanvasRef.current && visibleCanvasRef.current.capture) {
                console.log('Attempting to capture visible canvas...');
                
                // Set capturing state to true to show watermark during capture
                setIsCapturing(true);
                
                // Add a delay to ensure the canvas is fully rendered with watermark
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Capture the visible canvas as an image
                const uri = await visibleCanvasRef.current.capture();
                console.log('Visible canvas captured successfully!');
                console.log('Captured URI length:', uri?.length);
                console.log('Captured URI starts with:', uri?.substring(0, 50));
                
                // Set capturing state back to false
                setIsCapturing(false);
                
                // Navigate to preview with the captured image and subscription status
                (navigation as any).navigate('PosterPreview', {
                  capturedImageUri: uri,
                  selectedImage: selectedImage,
                  selectedLanguage: selectedLanguage,
                  selectedTemplateId: selectedTemplateId,
                  selectedBusinessProfile: selectedBusinessProfile,
                  isSubscribed: isSubscribed, // Pass subscription status to preview
                });
              } else {
                console.log('Poster ref not available, using fallback');
                // Set capturing state back to false
                setIsCapturing(false);
                // Fallback to original image if capture fails
                (navigation as any).navigate('PosterPreview', {
                  capturedImageUri: selectedImage.uri,
                  selectedImage: selectedImage,
                  selectedLanguage: selectedLanguage,
                  selectedTemplateId: selectedTemplateId,
                  selectedBusinessProfile: selectedBusinessProfile,
                  isSubscribed: isSubscribed, // Pass subscription status to preview
                });
              }
            } catch (error) {
              console.error('Error capturing poster:', error);
              console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
              // Set capturing state back to false
              setIsCapturing(false);
              // Fallback to original image if capture fails
              (navigation as any).navigate('PosterPreview', {
                capturedImageUri: selectedImage.uri,
                selectedImage: selectedImage,
                selectedLanguage: selectedLanguage,
                selectedTemplateId: selectedTemplateId,
                selectedBusinessProfile: selectedBusinessProfile,
                isSubscribed: isSubscribed, // Pass subscription status to preview
              });
            }
          }}
        >
          <Icon name="arrow-forward" size={getResponsiveIconSize()} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>

                        {/* Canvas Container */}
          <View style={styles.canvasContainer}>
            {/* ViewShot wrapper for capturing the visible canvas */}
            <ViewShot
              ref={visibleCanvasRef}
              style={[styles.viewShotContainer, { width: canvasWidth, height: canvasHeight }]}
              options={{
                format: 'png',
                quality: 1.0,
                result: 'tmpfile'
              }}
            >
              {/* Visible Canvas for editing */}
              <View style={[
                styles.canvas,
                { width: canvasWidth, height: canvasHeight },
                selectedTemplate !== 'business' && styles.canvasWithFrame,
                selectedTemplate === 'business' && styles.businessFrame,
                selectedTemplate === 'event' && styles.eventFrame,
                selectedTemplate === 'restaurant' && styles.restaurantFrame,
                selectedTemplate === 'fashion' && styles.fashionFrame,
                selectedTemplate === 'real-estate' && styles.realEstateFrame,
                selectedTemplate === 'education' && styles.educationFrame,
                selectedTemplate === 'healthcare' && styles.healthcareFrame,
                selectedTemplate === 'fitness' && styles.fitnessFrame,
                selectedTemplate === 'wedding' && styles.weddingFrame,
                selectedTemplate === 'birthday' && styles.birthdayFrame,
                selectedTemplate === 'corporate' && styles.corporateFrame,
                selectedTemplate === 'creative' && styles.creativeFrame,
                selectedTemplate === 'minimal' && styles.minimalFrame,
                selectedTemplate === 'luxury' && styles.luxuryFrame,
                selectedTemplate === 'modern' && styles.modernFrame,
                selectedTemplate === 'vintage' && styles.vintageFrame,
                selectedTemplate === 'retro' && styles.retroFrame,
                selectedTemplate === 'elegant' && styles.elegantFrame,
                selectedTemplate === 'bold' && styles.boldFrame,
                selectedTemplate === 'tech' && styles.techFrame,
                selectedTemplate === 'nature' && styles.natureFrame,
                selectedTemplate === 'ocean' && styles.oceanFrame,
                selectedTemplate === 'sunset' && styles.sunsetFrame,
                selectedTemplate === 'cosmic' && styles.cosmicFrame,
                selectedTemplate === 'artistic' && styles.artisticFrame,
                selectedTemplate === 'sport' && styles.sportFrame,
                selectedTemplate === 'warm' && styles.warmFrame,
                selectedTemplate === 'cool' && styles.coolFrame,
              ]}>
          {/* Background Image (always show the poster image) */}
          <View style={styles.backgroundImageContainer}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.backgroundImage}
            />
          </View>
          
          {/* Frame Overlay (when frame is selected) */}
          {selectedFrame && (
            <View style={styles.frameOverlayContainer}>
              <Image
                source={getFrameBackgroundSource(selectedFrame)}
                style={styles.frameOverlayImage}
                resizeMode="cover"
              />
            </View>
          )}
          
          {/* Frame Application Indicator */}
          {applyingFrame && (
            <View style={styles.frameApplicationOverlay}>
              <View style={styles.frameApplicationIndicator}>
                <Text style={styles.frameApplicationText}>Applying Frame...</Text>
              </View>
            </View>
          )}
          
          {/* Layers */}
          {layers.map(layer => (
            <PinchGestureHandler
              key={layer.id}
              onGestureEvent={onPinchGestureEvent(layer.id)}
              onHandlerStateChange={onPinchHandlerStateChange(layer.id)}
            >
              <Animated.View>
                <PanGestureHandler
                  onGestureEvent={onPanGestureEvent(layer.id)}
                  onHandlerStateChange={onHandlerStateChange(layer.id)}
                >
                  <Animated.View>
                    {renderLayer(layer)}
                  </Animated.View>
                </PanGestureHandler>
              </Animated.View>
            </PinchGestureHandler>
          ))}
          
          {/* Watermark - Only shown during capture if user is not subscribed */}
          {isCapturing && <Watermark isSubscribed={isSubscribed} />}
        </View>
            </ViewShot>
          
          {/* Toolbar on the right side */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setShowTextModal(true)}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.toolbarButtonGradient}
              >
                <Icon name="text-fields" size={getResponsiveIconSize()} color="#ffffff" />
                <Text style={styles.toolbarButtonText}>Text</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setShowLogoModal(true)}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.toolbarButtonGradient}
              >
                <Icon name="account-balance" size={getResponsiveIconSize()} color="#ffffff" />
                <Text style={styles.toolbarButtonText}>Logo</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setShowFontStyleModal(true)}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.toolbarButtonGradient}
              >
                <Icon name="format-size" size={getResponsiveIconSize()} color="#ffffff" />
                <Text style={styles.toolbarButtonText}>Font</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {selectedLayer && (
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => setShowStyleModal(true)}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.toolbarButtonGradient}
                >
                  <Icon name="palette" size={getResponsiveIconSize()} color="#ffffff" />
                  <Text style={styles.toolbarButtonText}>Style</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            

            
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setShowFrameSelector(!showFrameSelector)}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.toolbarButtonGradient}
              >
                <Icon name="crop-square" size={getResponsiveIconSize()} color="#ffffff" />
                <Text style={styles.toolbarButtonText}>Frame</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {selectedFrame && (
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => {
                  Alert.alert(
                    'Remove Frame',
                    'Are you sure you want to remove the current frame?',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => {
                          setSelectedFrame(null);
                          setFrameContent({});
                          // Restore original layers to their original positions
                          if (originalLayers.length > 0) {
                            setLayers(originalLayers);
                            setOriginalLayers([]); // Clear stored original layers
                          } else if (selectedBusinessProfile) {
                            // Fallback to business profile if no original layers stored
                            applyBusinessProfileToPoster(selectedBusinessProfile);
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <LinearGradient
                  colors={['#dc3545', '#c82333']}
                  style={styles.toolbarButtonGradient}
                >
                  <Icon name="delete" size={getResponsiveIconSize()} color="#ffffff" />
                  <Text style={styles.toolbarButtonText}>Remove Frame</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            

            
            {selectedLayer && (
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Element',
                    'Are you sure you want to delete this element?',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteLayer(selectedLayer),
                      },
                    ]
                  );
                }}
              >
                <LinearGradient
                  colors={['#ff4757', '#ff3742']}
                  style={styles.toolbarButtonGradient}
                >
                  <Icon name="delete" size={getResponsiveIconSize()} color="#ffffff" />
                  <Text style={styles.toolbarButtonText}>Delete</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Instructions */}
          {layers.length === 0 && !loadingProfiles && (
            <View style={styles.instructionsContainer}>
              <Icon name="info" size={24} color="#667eea" />
              <Text style={styles.instructionsText}>
                {businessProfiles.length === 0 
                  ? 'No business profiles found. Please create a business profile first.'
                  : 'Business profile data has been applied to your poster'
                }
              </Text>
            </View>
          )}

          {/* Loading indicator */}
          {loadingProfiles && (
            <View style={styles.loadingContainer}>
              <Icon name="hourglass-empty" size={24} color="#667eea" />
              <Text style={styles.loadingText}>Loading business profiles...</Text>
            </View>
          )}
        </View>
        
        {/* Frame Selector */}
        {showFrameSelector && (
          <FrameSelector
            frames={frames}
            selectedFrameId={selectedFrame?.id || ''}
            onFrameSelect={applyFrame}
          />
        )}
        
        {/* Controls Container */}
        <View style={[
          styles.controlsContainer, 
          { 
            paddingBottom: Math.max(insets.bottom + responsiveSpacing.md, responsiveSpacing.lg)
          }
        ]}>
        
        {/* Field Toggle Buttons */}
        <View style={styles.fieldToggleSection}>
          <View style={styles.fieldToggleHeader}>
            <Text style={styles.fieldToggleTitle}>Toggle Fields</Text>
            <Text style={styles.fieldToggleSubtitle}>Click to show/hide elements</Text>
          </View>
          <ScrollView 
            style={styles.fieldToggleContent} 
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.fieldToggleScrollContent}
          >
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.logo && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('logo')}
            >
              <Icon name="account-balance" size={getResponsiveIconSize()} color={visibleFields.logo ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.logo && styles.fieldToggleButtonTextActive]}>
                Logo
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.companyName && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('companyName')}
            >
              <Icon name="title" size={getResponsiveIconSize()} color={visibleFields.companyName ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.companyName && styles.fieldToggleButtonTextActive]}>
                Company Name
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.footerCompanyName && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('footerCompanyName')}
            >
              <Icon name="subtitles" size={getResponsiveIconSize()} color={visibleFields.footerCompanyName ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.footerCompanyName && styles.fieldToggleButtonTextActive]}>
                Footer Name
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.footerBackground && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('footerBackground')}
            >
              <Icon name="format-color-fill" size={getResponsiveIconSize()} color={visibleFields.footerBackground ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.footerBackground && styles.fieldToggleButtonTextActive]}>
                Footer BG
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.phone && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('phone')}
            >
              <Icon name="call" size={getResponsiveIconSize()} color={visibleFields.phone ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.phone && styles.fieldToggleButtonTextActive]}>
                Phone
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.email && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('email')}
            >
              <Icon name="mail" size={getResponsiveIconSize()} color={visibleFields.email ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.email && styles.fieldToggleButtonTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.website && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('website')}
            >
              <Icon name="public" size={getResponsiveIconSize()} color={visibleFields.website ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.website && styles.fieldToggleButtonTextActive]}>
                Website
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.category && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('category')}
            >
              <Icon name="business-center" size={getResponsiveIconSize()} color={visibleFields.category ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.category && styles.fieldToggleButtonTextActive]}>
                Category
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.address && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('address')}
            >
              <Icon name="place" size={getResponsiveIconSize()} color={visibleFields.address ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.address && styles.fieldToggleButtonTextActive]}>
                Address
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.services && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('services')}
            >
              <Icon name="handyman" size={getResponsiveIconSize()} color={visibleFields.services ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.services && styles.fieldToggleButtonTextActive]}>
                Services
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Templates Section */}
        <View style={styles.templatesSection}>
          <View style={styles.templatesHeader}>
            <Text style={styles.templatesTitle}>Templates</Text>
            <Text style={styles.templatesSubtitle}>Choose a poster template design</Text>
          </View>
          <ScrollView 
            style={styles.templatesContent} 
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.templatesScrollContent}
          >
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'business' && styles.templateButtonActive]}
              onPress={() => applyTemplate('business')}
            >
              <View style={[styles.templatePreview, styles.businessTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.businessTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'business' && styles.templateTextActive]}>
                Business
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'event' && styles.templateButtonActive]}
              onPress={() => applyTemplate('event')}
            >
              <View style={[styles.templatePreview, styles.eventTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.eventTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'event' && styles.templateTextActive]}>
                Event
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'restaurant' && styles.templateButtonActive]}
              onPress={() => applyTemplate('restaurant')}
            >
              <View style={[styles.templatePreview, styles.restaurantTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.restaurantTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'restaurant' && styles.templateTextActive]}>
                Restaurant
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'fashion' && styles.templateButtonActive]}
              onPress={() => applyTemplate('fashion')}
            >
              <View style={[styles.templatePreview, styles.fashionTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.fashionTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'fashion' && styles.templateTextActive]}>
                Fashion
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'real-estate' && styles.templateButtonActive]}
              onPress={() => applyTemplate('real-estate')}
            >
              <View style={[styles.templatePreview, styles.realEstateTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.realEstateTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'real-estate' && styles.templateTextActive]}>
                Real Estate
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'education' && styles.templateButtonActive]}
              onPress={() => applyTemplate('education')}
            >
              <View style={[styles.templatePreview, styles.educationTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.educationTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'education' && styles.templateTextActive]}>
                Education
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'healthcare' && styles.templateButtonActive]}
              onPress={() => applyTemplate('healthcare')}
            >
              <View style={[styles.templatePreview, styles.healthcareTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.healthcareTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'healthcare' && styles.templateTextActive]}>
                Healthcare
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'fitness' && styles.templateButtonActive]}
              onPress={() => applyTemplate('fitness')}
            >
              <View style={[styles.templatePreview, styles.fitnessTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.fitnessTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'fitness' && styles.templateTextActive]}>
                Fitness
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'wedding' && styles.templateButtonActive]}
              onPress={() => applyTemplate('wedding')}
            >
              <View style={[styles.templatePreview, styles.weddingTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.weddingTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'wedding' && styles.templateTextActive]}>
                Wedding
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'birthday' && styles.templateButtonActive]}
              onPress={() => applyTemplate('birthday')}
            >
              <View style={[styles.templatePreview, styles.birthdayTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.birthdayTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'birthday' && styles.templateTextActive]}>
                Birthday
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'corporate' && styles.templateButtonActive]}
              onPress={() => applyTemplate('corporate')}
            >
              <View style={[styles.templatePreview, styles.corporateTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.corporateTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'corporate' && styles.templateTextActive]}>
                Corporate
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'creative' && styles.templateButtonActive]}
              onPress={() => applyTemplate('creative')}
            >
              <View style={[styles.templatePreview, styles.creativeTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.creativeTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'creative' && styles.templateTextActive]}>
                Creative
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'minimal' && styles.templateButtonActive]}
              onPress={() => applyTemplate('minimal')}
            >
              <View style={[styles.templatePreview, styles.minimalTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.minimalTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'minimal' && styles.templateTextActive]}>
                Minimal
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'luxury' && styles.templateButtonActive]}
              onPress={() => applyTemplate('luxury')}
            >
              <View style={[styles.templatePreview, styles.luxuryTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.luxuryTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'luxury' && styles.templateTextActive]}>
                Luxury
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'modern' && styles.templateButtonActive]}
              onPress={() => applyTemplate('modern')}
            >
              <View style={[styles.templatePreview, styles.modernTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.modernTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'modern' && styles.templateTextActive]}>
                Modern
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'vintage' && styles.templateButtonActive]}
              onPress={() => applyTemplate('vintage')}
            >
              <View style={[styles.templatePreview, styles.vintageTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.vintageTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'vintage' && styles.templateTextActive]}>
                Vintage
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'retro' && styles.templateButtonActive]}
              onPress={() => applyTemplate('retro')}
            >
              <View style={[styles.templatePreview, styles.retroTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.retroTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'retro' && styles.templateTextActive]}>
                Retro
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'elegant' && styles.templateButtonActive]}
              onPress={() => applyTemplate('elegant')}
            >
              <View style={[styles.templatePreview, styles.elegantTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.elegantTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'elegant' && styles.templateTextActive]}>
                Elegant
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'bold' && styles.templateButtonActive]}
              onPress={() => applyTemplate('bold')}
            >
              <View style={[styles.templatePreview, styles.boldTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.boldTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'bold' && styles.templateTextActive]}>
                Bold
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'tech' && styles.templateButtonActive]}
              onPress={() => applyTemplate('tech')}
            >
              <View style={[styles.templatePreview, styles.techTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.techTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'tech' && styles.templateTextActive]}>
                Tech
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'nature' && styles.templateButtonActive]}
              onPress={() => applyTemplate('nature')}
            >
              <View style={[styles.templatePreview, styles.natureTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.natureTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'nature' && styles.templateTextActive]}>
                Nature
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'ocean' && styles.templateButtonActive]}
              onPress={() => applyTemplate('ocean')}
            >
              <View style={[styles.templatePreview, styles.oceanTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.oceanTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'ocean' && styles.templateTextActive]}>
                Ocean
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'sunset' && styles.templateButtonActive]}
              onPress={() => applyTemplate('sunset')}
            >
              <View style={[styles.templatePreview, styles.sunsetTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.sunsetTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'sunset' && styles.templateTextActive]}>
                Sunset
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'cosmic' && styles.templateButtonActive]}
              onPress={() => applyTemplate('cosmic')}
            >
              <View style={[styles.templatePreview, styles.cosmicTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.cosmicTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'cosmic' && styles.templateTextActive]}>
                Cosmic
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'artistic' && styles.templateButtonActive]}
              onPress={() => applyTemplate('artistic')}
            >
              <View style={[styles.templatePreview, styles.artisticTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.artisticTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'artistic' && styles.templateTextActive]}>
                Artistic
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'sport' && styles.templateButtonActive]}
              onPress={() => applyTemplate('sport')}
            >
              <View style={[styles.templatePreview, styles.sportTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.sportTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'sport' && styles.templateTextActive]}>
                Sport
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'warm' && styles.templateButtonActive]}
              onPress={() => applyTemplate('warm')}
            >
              <View style={[styles.templatePreview, styles.warmTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.warmTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'warm' && styles.templateTextActive]}>
                Warm
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'cool' && styles.templateButtonActive]}
              onPress={() => applyTemplate('cool')}
            >
              <View style={[styles.templatePreview, styles.coolTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.coolTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'cool' && styles.templateTextActive]}>
                Cool
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        </View>

      {/* Business Profile Selection Modal */}
      <Modal
        visible={showProfileSelectionModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // Prevent closing without selection - user must select a profile or go back
          Alert.alert(
            'Selection Required',
            'You must select a business profile to continue. If you want to go back, use the Cancel button.',
            [{ text: 'OK' }]
          );
        }}
      >
        <View style={themeStyles.modalOverlay}>
          <View style={themeStyles.modalContent}>
            <Text style={themeStyles.modalTitle}>Select Business Profile</Text>
            <Text style={themeStyles.modalSubtitle}>
              Choose which business profile to use for your poster. You must select one to continue.
            </Text>
            <FlatList
              data={businessProfiles}
              renderItem={renderProfileItem}
              keyExtractor={(item) => item.id}
              style={styles.profileList}
              showsVerticalScrollIndicator={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, themeStyles.cancelButton]}
                onPress={() => {
                  setShowProfileSelectionModal(false);
                  navigation.goBack(); // Go back to previous screen if user cancels
                }}
              >
                <Text style={themeStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Text Modal */}
      <Modal
        visible={showTextModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTextModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Text</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter text..."
              value={newText}
              onChangeText={setNewText}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTextModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addTextLayer}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Image Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Image</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter image URL..."
              value={newImageUrl}
              onChangeText={setNewImageUrl}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowImageModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addImageLayer}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Logo Modal */}
      <Modal
        visible={showLogoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoModalContent}>
            <View style={styles.logoModalHeader}>
              <Text style={styles.logoModalTitle}>Add Your Logo</Text>
              <Text style={styles.logoModalSubtitle}>Choose how you'd like to add your logo to the poster</Text>
            </View>
            
            <View style={styles.logoOptionsContainer}>
              <TouchableOpacity
                style={styles.logoOption}
                onPress={() => {
                  setShowLogoModal(false);
                  handleCameraAccess();
                }}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.logoOptionGradient}
                >
                  <Icon name="camera-alt" size={32} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.logoOptionTitle}>Take Photo</Text>

              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.logoOption}
                onPress={() => {
                  setShowLogoModal(false);
                  handleGalleryAccess();
                }}
              >
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  style={styles.logoOptionGradient}
                >
                  <Icon name="photo-library" size={32} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.logoOptionTitle}>Choose from Gallery</Text>
                
              </TouchableOpacity>
              

            </View>
            
            <TouchableOpacity
              style={styles.logoModalCloseButton}
              onPress={() => setShowLogoModal(false)}
            >
              <Text style={styles.logoModalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



      {/* Font Style Modal */}
      <Modal
        visible={showFontStyleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFontStyleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.fontModalContent}>
            <Text style={styles.modalTitle}>Choose Font Style</Text>
            <Text style={styles.modalSubtitle}>Select a font style for your text</Text>
            
            <ScrollView 
              style={styles.fontStyleModalContent} 
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.footerStylesModalGrid}>
                {/* System Fonts */}
                <TouchableOpacity
                  style={styles.footerStyleModalButton}
                  onPress={() => applyFontStyle(SYSTEM_FONTS.default)}
                >
                  <Text style={[styles.footerStyleModalText, { fontFamily: SYSTEM_FONTS.default }]}>Aa</Text>
                  <Text style={styles.fontStyleModalTitle}>System</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.footerStyleModalButton}
                  onPress={() => applyFontStyle(SYSTEM_FONTS.serif)}
                >
                  <Text style={[styles.footerStyleModalText, { fontFamily: SYSTEM_FONTS.serif }]}>Aa</Text>
                  <Text style={styles.fontStyleModalTitle}>Serif</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.footerStyleModalButton}
                  onPress={() => applyFontStyle(SYSTEM_FONTS.monospace)}
                >
                  <Text style={[styles.footerStyleModalText, { fontFamily: SYSTEM_FONTS.monospace }]}>Aa</Text>
                  <Text style={styles.fontStyleModalTitle}>Monospace</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.footerStyleModalButton}
                  onPress={() => applyFontStyle(SYSTEM_FONTS.cursive)}
                >
                  <Text style={[styles.footerStyleModalText, { fontFamily: SYSTEM_FONTS.cursive }]}>Aa</Text>
                  <Text style={styles.fontStyleModalTitle}>Cursive</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.footerStyleModalButton}
                  onPress={() => applyFontStyle(SYSTEM_FONTS.fantasy)}
                >
                  <Text style={[styles.footerStyleModalText, { fontFamily: SYSTEM_FONTS.fantasy }]}>Aa</Text>
                  <Text style={styles.fontStyleModalTitle}>Fantasy</Text>
                </TouchableOpacity>
                
                {/* Google Fonts - Sans-serif */}
                {getFontsByCategory('sans-serif').slice(0, 5).map((font) => (
                  <TouchableOpacity
                    key={font.name}
                    style={styles.footerStyleModalButton}
                    onPress={() => applyFontStyle(font.name)}
                  >
                    <Text style={[styles.footerStyleModalText, { fontFamily: getFontFamily(font.name) }]}>Aa</Text>
                    <Text style={styles.fontStyleModalTitle}>{font.displayName}</Text>
                  </TouchableOpacity>
                ))}
                
                {/* Google Fonts - Serif */}
                {getFontsByCategory('serif').slice(0, 3).map((font) => (
                  <TouchableOpacity
                    key={font.name}
                    style={styles.footerStyleModalButton}
                    onPress={() => applyFontStyle(font.name)}
                  >
                    <Text style={[styles.footerStyleModalText, { fontFamily: getFontFamily(font.name) }]}>Aa</Text>
                    <Text style={styles.fontStyleModalTitle}>{font.displayName}</Text>
                  </TouchableOpacity>
                ))}
                
                {/* Google Fonts - Display */}
                {getFontsByCategory('display').slice(0, 3).map((font) => (
                  <TouchableOpacity
                    key={font.name}
                    style={styles.footerStyleModalButton}
                    onPress={() => applyFontStyle(font.name)}
                  >
                    <Text style={[styles.footerStyleModalText, { fontFamily: getFontFamily(font.name) }]}>Aa</Text>
                    <Text style={styles.fontStyleModalTitle}>{font.displayName}</Text>
                  </TouchableOpacity>
                ))}
                
                {/* Google Fonts - Handwriting */}
                {getFontsByCategory('handwriting').slice(0, 3).map((font) => (
                  <TouchableOpacity
                    key={font.name}
                    style={styles.footerStyleModalButton}
                    onPress={() => applyFontStyle(font.name)}
                  >
                    <Text style={[styles.footerStyleModalText, { fontFamily: getFontFamily(font.name) }]}>Aa</Text>
                    <Text style={styles.fontStyleModalTitle}>{font.displayName}</Text>
                  </TouchableOpacity>
                ))}
                
                {/* Google Fonts - Monospace */}
                {getFontsByCategory('monospace').slice(0, 2).map((font) => (
                  <TouchableOpacity
                    key={font.name}
                    style={styles.footerStyleModalButton}
                    onPress={() => applyFontStyle(font.name)}
                  >
                    <Text style={[styles.footerStyleModalText, { fontFamily: getFontFamily(font.name) }]}>Aa</Text>
                    <Text style={styles.fontStyleModalTitle}>{font.displayName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFontStyleModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
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
    paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.xs : isSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md),
    paddingVertical: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.xs : isSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md),
    borderBottomWidth: 0,
    minHeight: isLandscape ? (isTablet ? 60 : 50) : (isUltraSmallScreen ? 44 : isSmallScreen ? 50 : isMediumScreen ? 55 : isLargeScreen ? 60 : 65),
  },
  backButton: {
    padding: getHeaderPadding(),
    borderRadius: isLandscape ? (isTablet ? 12 : 8) : (isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 8),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: getHeaderButtonSize(),
    minHeight: getHeaderButtonSize(),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: isLandscape ? (isTablet ? 16 : 8) : (isUltraSmallScreen ? 4 : isSmallScreen ? 6 : isMediumScreen ? 8 : isLargeScreen ? 12 : 16),
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: getHeaderTitleSize(),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: isLandscape ? (isTablet ? 2 : 1) : (isUltraSmallScreen ? 0 : isSmallScreen ? 1 : 2),
  },
  headerSubtitle: {
    fontSize: getHeaderSubtitleSize(),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: isLandscape ? (isTablet ? 2 : 1) : (isUltraSmallScreen ? 0 : isSmallScreen ? 1 : 2),
    textAlign: 'center',
    lineHeight: isLandscape ? (isTablet ? 16 : 14) : (isUltraSmallScreen ? 12 : isSmallScreen ? 13 : isMediumScreen ? 14 : isLargeScreen ? 15 : 16),
  },
  nextButton: {
    padding: getHeaderPadding(),
    borderRadius: isLandscape ? (isTablet ? 12 : 8) : (isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 8),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: getHeaderButtonSize(),
    minHeight: getHeaderButtonSize(),
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.xs : isSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md),
    paddingBottom: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.xs : isSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md),
    marginBottom: isLandscape ? (isTablet ? responsiveSpacing.sm : responsiveSpacing.xs) : (isUltraSmallScreen ? 0 : isSmallScreen ? responsiveSpacing.xs : responsiveSpacing.sm),
  },
  controlsContainer: {
    paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.xs : isSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md),
    paddingVertical: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? 0 : isSmallScreen ? responsiveSpacing.xs : responsiveSpacing.sm),
  },
  viewShotContainer: {
    // These will be set dynamically based on responsive dimensions
  },
  hiddenCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    // These will be set dynamically based on responsive dimensions
    opacity: 0.01, // Very low opacity but not completely invisible
    zIndex: -1,
    pointerEvents: 'none', // Don't interfere with user interactions
    backgroundColor: 'transparent',
  },
  canvas: {
    // These will be set dynamically based on responsive dimensions
    backgroundColor: '#ffffff',
    borderRadius: isSmallScreen ? 8 : 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    overflow: 'visible',
    marginBottom: isSmallScreen ? 6 : 15,
  },
  instructionsContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -20 }],
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 200,
    lineHeight: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -20 }],
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden', // Hidden to ensure poster fits within canvas
    justifyContent: 'center', // Back to center for proper alignment
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover', // Use cover to fit canvas while maintaining aspect ratio
  },
  layer: {
    position: 'absolute',
  },
  layerText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    flexWrap: 'wrap', // Allow text to wrap
    textAlignVertical: 'center', // Center text vertically
  },
  layerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  selectedLayerImage: {
    borderWidth: 3,
    borderColor: '#667eea',
    borderRadius: 12,
  },
  selectedLayer: {
    borderWidth: 3,
    borderColor: '#667eea',
    borderRadius: 8,
  },
  toolbar: {
    position: 'absolute',
    right: getToolbarRightPosition(),
    top: '50%',
    transform: [{ translateY: -100 }],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: isLandscape ? (isTablet ? 16 : 12) : (isUltraSmallScreen ? 8 : isSmallScreen ? 10 : isMediumScreen ? 12 : isLargeScreen ? 14 : 16),
    padding: isLandscape ? (isTablet ? 16 : 10) : (isUltraSmallScreen ? 4 : isSmallScreen ? 6 : isMediumScreen ? 8 : isLargeScreen ? 10 : 12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  toolbarButton: {
    marginVertical: isLandscape ? (isTablet ? 4 : 3) : (isUltraSmallScreen ? 1 : isSmallScreen ? 2 : isMediumScreen ? 3 : isLargeScreen ? 4 : 5),
  },
  toolbarButtonGradient: {
    alignItems: 'center',
    paddingVertical: isLandscape ? (isTablet ? 14 : 10) : (isUltraSmallScreen ? 6 : isSmallScreen ? 8 : isMediumScreen ? 10 : isLargeScreen ? 12 : 14),
    paddingHorizontal: isLandscape ? (isTablet ? 18 : 12) : (isUltraSmallScreen ? 8 : isSmallScreen ? 10 : isMediumScreen ? 12 : isLargeScreen ? 14 : 16),
    borderRadius: isLandscape ? (isTablet ? 12 : 10) : (isUltraSmallScreen ? 6 : isSmallScreen ? 8 : isMediumScreen ? 10 : isLargeScreen ? 12 : 14),
    minWidth: getToolbarButtonSize(),
  },
  toolbarButtonText: {
    fontSize: getToolbarButtonTextSize(),
    color: '#ffffff',
    marginTop: isLandscape ? (isTablet ? 2 : 1) : (isUltraSmallScreen ? 1 : isSmallScreen ? 2 : isMediumScreen ? 3 : isLargeScreen ? 4 : 5),
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md),
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: isLandscape ? (isTablet ? 24 : 20) : (isUltraSmallScreen ? 16 : isSmallScreen ? 18 : isMediumScreen ? 20 : isLargeScreen ? 22 : 24),
    padding: isLandscape ? (isTablet ? 24 : 20) : (isUltraSmallScreen ? 12 : isSmallScreen ? 16 : isMediumScreen ? 18 : isLargeScreen ? 20 : 22),
    width: isLandscape ? (isTablet ? screenWidth * 0.7 : screenWidth * 0.8) : (isUltraSmallScreen ? screenWidth * 0.95 : isSmallScreen ? screenWidth * 0.92 : isMediumScreen ? screenWidth * 0.9 : isLargeScreen ? screenWidth * 0.88 : screenWidth * 0.85),
    maxHeight: isLandscape ? (isTablet ? screenHeight * 0.8 : screenHeight * 0.7) : (isUltraSmallScreen ? screenHeight * 0.8 : isSmallScreen ? screenHeight * 0.75 : isMediumScreen ? screenHeight * 0.7 : isLargeScreen ? screenHeight * 0.65 : screenHeight * 0.6),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  fontModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: isLandscape ? (isTablet ? 24 : 20) : (isUltraSmallScreen ? 16 : isSmallScreen ? 18 : isMediumScreen ? 20 : isLargeScreen ? 22 : 24),
    padding: isLandscape ? (isTablet ? 24 : 20) : (isUltraSmallScreen ? 12 : isSmallScreen ? 16 : isMediumScreen ? 18 : isLargeScreen ? 20 : 22),
    width: isLandscape ? (isTablet ? screenWidth * 0.7 : screenWidth * 0.8) : (isUltraSmallScreen ? screenWidth * 0.95 : isSmallScreen ? screenWidth * 0.92 : isMediumScreen ? screenWidth * 0.9 : isLargeScreen ? screenWidth * 0.88 : screenWidth * 0.85),
    height: isLandscape ? (isTablet ? screenHeight * 0.6 : screenHeight * 0.5) : (isUltraSmallScreen ? screenHeight * 0.6 : isSmallScreen ? screenHeight * 0.55 : isMediumScreen ? screenHeight * 0.5 : isLargeScreen ? screenHeight * 0.45 : screenHeight * 0.4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 20,
    fontWeight: '500',
  },
  profileList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  profileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  profileLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  profileCategory: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 4,
    fontWeight: '600',
  },
  profileDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  addButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  styleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  styleOption: {
    width: 48,
    height: 48,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  styleOptionText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    margin: 4,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionText: {
    fontSize: 10,
    color: '#333333',
    fontWeight: '600',
    textAlign: 'center',
  },
  styleSection: {
    marginBottom: 20,
  },
  styleSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  layerTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  draggedLayer: {
    zIndex: 100, // Ensure dragged layer is on top
  },
  fieldToggleSection: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: isLandscape ? (isTablet ? 20 : 16) : (isUltraSmallScreen ? 8 : isSmallScreen ? 12 : isMediumScreen ? 14 : isLargeScreen ? 16 : 18),
    padding: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
    marginHorizontal: isLandscape ? (isTablet ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallScreen ? responsiveSpacing.sm : isSmallScreen ? responsiveSpacing.md : responsiveSpacing.lg),
  },
  fieldToggleHeader: {
    alignItems: 'center',
    marginBottom: isLandscape ? (isTablet ? responsiveSpacing.md : responsiveSpacing.sm) : (isUltraSmallScreen ? responsiveSpacing.xs : isSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md),
  },
  fieldToggleTitle: {
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.lg : responsiveFontSize.md) : (isUltraSmallScreen ? responsiveFontSize.sm : isSmallScreen ? responsiveFontSize.md : responsiveFontSize.lg),
    fontWeight: '700',
    color: '#333333',
  },
  fieldToggleSubtitle: {
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.sm : responsiveFontSize.xs) : (isUltraSmallScreen ? responsiveFontSize.xs : isSmallScreen ? responsiveFontSize.sm : responsiveFontSize.md),
    color: '#666666',
    marginTop: isLandscape ? (isTablet ? responsiveSpacing.xs : 1) : (isUltraSmallScreen ? 1 : isSmallScreen ? 2 : responsiveSpacing.xs),
  },
  fieldToggleContent: {
    maxHeight: getResponsiveSectionHeight(),
  },
  fieldToggleScrollContent: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  fieldToggleButton: {
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 6 : 10,
    paddingHorizontal: isSmallScreen ? 8 : 14,
    borderRadius: isSmallScreen ? 8 : 16,
    backgroundColor: '#e9ecef',
    marginHorizontal: isSmallScreen ? 2 : 4,
    flexDirection: 'row',
    minWidth: isSmallScreen ? 60 : 85,
    justifyContent: 'center',
  },
  fieldToggleButtonActive: {
    backgroundColor: '#667eea',
  },
  fieldToggleButtonText: {
    fontSize: isSmallScreen ? 9 : 12,
    color: '#666666',
    marginLeft: isSmallScreen ? 3 : 6,
    fontWeight: '500',
  },
  fieldToggleButtonTextActive: {
    color: '#ffffff',
  },
  closeButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  closeButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  // Enhanced Font Style Modal Styles
  fontStyleModalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 350,
    maxHeight: screenHeight * 0.5,
  },
  fontStyleModalHeader: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fontStyleModalHeaderContent: {
    flex: 1,
  },
  fontStyleModalTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginTop: 4,
  },
  fontStyleModalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  fontStyleCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontStyleModalBody: {
    flex: 1,
    marginBottom: 20,
    maxHeight: 400,
  },
  fontStyleSection: {
    marginBottom: 24,
  },
  fontStyleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fontStyleSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginLeft: 12,
  },
  fontStyleSectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    marginLeft: 32,
    lineHeight: 20,
  },
  fontStyleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fontStyleOption: {
    width: (screenWidth * 0.9 - 80) / 2 - 6,
    marginBottom: 12,
  },
  fontStyleOptionGradient: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  fontStyleOptionText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    textAlign: 'center',
  },
  fontStyleOptionIcon: {
    width: 16,
    height: 16,
  },
  fontStyleModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  fontStyleCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  fontStyleCancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  fontStyleApplyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fontStyleApplyButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontStyleApplyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Logo Selection Modal Styles
  logoSelectionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  logoSelectionOption: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // Professional Logo Modal Styles
  logoModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  logoModalHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoModalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  logoModalSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  logoOptionsContainer: {
    marginBottom: 32,
  },
  logoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoOptionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logoOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  logoOptionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  logoModalCloseButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  logoModalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  // Logo URL Modal Styles
  logoUrlModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  logoUrlInput: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    color: '#333333',
  },
  logoUrlModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoUrlCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  logoUrlCancelText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  logoUrlAddButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoUrlAddText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoSelectionOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoSelectionOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'center',
  },
  logoSelectionOptionSubtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Animation Layers Section Styles
  animationLayersSection: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 15,
    marginHorizontal: 12,
  },
  animationLayersHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  animationLayersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
  },
  animationLayersSubtitle: {
    fontSize: 10,
    color: '#666666',
    marginTop: 1,
  },
  animationLayersContent: {
    maxHeight: 120,
  },
  animationLayersScrollContent: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  animationLayerButton: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 80,
  },
  animationLayerPreview: {
    width: 70,
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  animationLayerText: {
    fontSize: 10,
    color: '#333333',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  cornerAccentPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'absolute',
    top: 15,
    right: 15,
  },
  sideBorderPreview: {
    width: 8,
    height: 70,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  centerAccentPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    position: 'absolute',
    top: 10,
    left: 10,
  },
  cornerLogoFramePreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Animation Layers Modal Styles
  animationLayersModalContent: {
    maxHeight: 400,
    marginBottom: 16,
  },
  animationLayersModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  animationLayerModalButton: {
    width: (screenWidth * 0.9 - 80) / 2 - 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  animationLayerModalPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  animationLayerModalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 4,
  },
  animationLayerModalDescription: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 12,
  },
  cornerAccentModalPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    position: 'absolute',
    top: 15,
    right: 15,
  },
  sideBorderModalPreview: {
    width: 6,
    height: 60,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  centerAccentModalPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'absolute',
    top: 10,
    left: 10,
  },
  cornerLogoFrameModalPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Frame Styles
  canvasWithFrame: {
    borderWidth: 8,
    borderColor: '#333333',
  },
  classicFrame: {
    borderWidth: 12,
    borderColor: '#8B4513',
    borderStyle: 'solid',
  },
  modernFrame: {
    borderWidth: 6,
    borderColor: '#667eea',
    borderStyle: 'solid',
  },
  elegantFrame: {
    borderWidth: 8,
    borderColor: '#D4AF37',
    borderStyle: 'solid',
  },
  boldFrame: {
    borderWidth: 15,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  minimalFrame: {
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderStyle: 'solid',
  },
  ornateFrame: {
    borderWidth: 10,
    borderColor: '#8B4513',
    borderStyle: 'solid',
  },
  cornerFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  borderFrame: {
    borderWidth: 4,
    borderColor: '#333333',
    borderStyle: 'solid',
  },
  // Additional Frame Styles
  businessFrame: {
    borderWidth: 8,
    borderColor: '#667eea',
    borderStyle: 'solid',
  },
  eventFrame: {
    borderWidth: 6,
    borderColor: '#f97316',
    borderStyle: 'solid',
  },
  restaurantFrame: {
    borderWidth: 8,
    borderColor: '#22c55e',
    borderStyle: 'solid',
  },
  fashionFrame: {
    borderWidth: 10,
    borderColor: '#ec4899',
    borderStyle: 'solid',
  },
  realEstateFrame: {
    borderWidth: 6,
    borderColor: '#8b5cf6',
    borderStyle: 'solid',
  },
  educationFrame: {
    borderWidth: 8,
    borderColor: '#3b82f6',
    borderStyle: 'solid',
  },
  healthcareFrame: {
    borderWidth: 6,
    borderColor: '#10b981',
    borderStyle: 'solid',
  },
  fitnessFrame: {
    borderWidth: 8,
    borderColor: '#ef4444',
    borderStyle: 'solid',
  },
  weddingFrame: {
    borderWidth: 12,
    borderColor: '#fbbf24',
    borderStyle: 'solid',
  },
  birthdayFrame: {
    borderWidth: 10,
    borderColor: '#f472b6',
    borderStyle: 'solid',
  },
  corporateFrame: {
    borderWidth: 6,
    borderColor: '#374151',
    borderStyle: 'solid',
  },
  creativeFrame: {
    borderWidth: 8,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  luxuryFrame: {
    borderWidth: 12,
    borderColor: '#d4af37',
    borderStyle: 'solid',
  },
  vintageFrame: {
    borderWidth: 8,
    borderColor: '#78716c',
    borderStyle: 'solid',
  },
  retroFrame: {
    borderWidth: 6,
    borderColor: '#fb923c',
    borderStyle: 'solid',
  },
  techFrame: {
    borderWidth: 8,
    borderColor: '#00ff00',
    borderStyle: 'solid',
  },
  natureFrame: {
    borderWidth: 6,
    borderColor: '#22c55e',
    borderStyle: 'solid',
  },
  oceanFrame: {
    borderWidth: 8,
    borderColor: '#06b6d4',
    borderStyle: 'solid',
  },
  sunsetFrame: {
    borderWidth: 10,
    borderColor: '#f59e0b',
    borderStyle: 'solid',
  },
  cosmicFrame: {
    borderWidth: 8,
    borderColor: '#1e293b',
    borderStyle: 'solid',
  },
  artisticFrame: {
    borderWidth: 8,
    borderColor: '#a855f7',
    borderStyle: 'solid',
  },
  sportFrame: {
    borderWidth: 6,
    borderColor: '#ef4444',
    borderStyle: 'solid',
  },
  warmFrame: {
    borderWidth: 8,
    borderColor: '#f59e0b',
    borderStyle: 'solid',
  },
  coolFrame: {
    borderWidth: 6,
    borderColor: '#3b82f6',
    borderStyle: 'solid',
  },
  // Frames Section Styles
  framesSection: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: isSmallScreen ? 8 : 16,
    padding: getResponsiveSectionPadding(),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: getResponsiveSectionMargin(),
    marginHorizontal: getResponsiveSectionPadding(),
  },
  framesHeader: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 4 : 8,
  },
  framesTitle: {
    fontSize: isSmallScreen ? 11 : 14,
    fontWeight: '700',
    color: '#333333',
  },
  framesSubtitle: {
    fontSize: isSmallScreen ? 8 : 10,
    color: '#666666',
    marginTop: 1,
  },
  framesContent: {
    maxHeight: getResponsiveSectionHeight(),
  },
  framesScrollContent: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  frameButton: {
    alignItems: 'center',
    marginHorizontal: isSmallScreen ? 4 : 8,
    minWidth: isSmallScreen ? 55 : 80,
  },
  frameButtonActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: isSmallScreen ? 6 : 12,
    padding: isSmallScreen ? 4 : 8,
  },
  framePreview: {
    width: getResponsiveButtonSize(),
    height: getResponsiveButtonSize(),
    borderRadius: isSmallScreen ? 6 : 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 4 : 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  framePreviewInner: {
    width: 50,
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  frameText: {
    fontSize: isSmallScreen ? 8 : 10,
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 9 : 12,
  },
  frameTextActive: {
    color: '#667eea',
    fontWeight: '700',
  },
  // Frame Preview Styles
  classicFramePreview: {
    borderWidth: 8,
    borderColor: '#8B4513',
  },
  modernFramePreview: {
    borderWidth: 4,
    borderColor: '#667eea',
  },
  elegantFramePreview: {
    borderWidth: 6,
    borderColor: '#D4AF37',
  },
  boldFramePreview: {
    borderWidth: 10,
    borderColor: '#000000',
  },
  minimalFramePreview: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  ornateFramePreview: {
    borderWidth: 8,
    borderColor: '#8B4513',
  },
  cornerFramePreview: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  borderFramePreview: {
    borderWidth: 3,
    borderColor: '#333333',
  },
  // Frames Modal Styles
  framesModalContent: {
    maxHeight: 400,
    marginBottom: 16,
  },
  framesModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  frameModalButton: {
    width: (screenWidth * 0.9 - 80) / 2 - 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  frameModalPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  frameModalPreviewInner: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  frameModalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 4,
  },
  frameModalDescription: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 12,
  },
  // Frame Modal Preview Styles
  classicFrameModalPreview: {
    borderWidth: 6,
    borderColor: '#8B4513',
  },
  modernFrameModalPreview: {
    borderWidth: 3,
    borderColor: '#667eea',
  },
  elegantFrameModalPreview: {
    borderWidth: 4,
    borderColor: '#D4AF37',
  },
  boldFrameModalPreview: {
    borderWidth: 8,
    borderColor: '#000000',
  },
  minimalFrameModalPreview: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  ornateFrameModalPreview: {
    borderWidth: 6,
    borderColor: '#8B4513',
  },
  cornerFrameModalPreview: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  borderFrameModalPreview: {
    borderWidth: 2,
    borderColor: '#333333',
  },
  // Templates Section Styles
  templatesSection: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: isSmallScreen ? 8 : 16,
    padding: getResponsiveSectionPadding(),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: getResponsiveSectionMargin(),
    marginHorizontal: getResponsiveSectionPadding(),
  },
  templatesHeader: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 4 : 8,
  },
  templatesTitle: {
    fontSize: isSmallScreen ? 11 : 14,
    fontWeight: '700',
    color: '#333333',
  },
  templatesSubtitle: {
    fontSize: isSmallScreen ? 8 : 10,
    color: '#666666',
    marginTop: 1,
  },
  templatesContent: {
    maxHeight: getResponsiveSectionHeight(),
  },
  templatesScrollContent: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  templateButton: {
    alignItems: 'center',
    marginHorizontal: isSmallScreen ? 4 : 8,
    minWidth: isSmallScreen ? 55 : 80,
  },
  templateButtonActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: isSmallScreen ? 6 : 12,
    padding: isSmallScreen ? 4 : 8,
  },
  templatePreview: {
    width: getResponsiveButtonSize(),
    height: getResponsiveButtonSize(),
    borderRadius: isSmallScreen ? 6 : 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 4 : 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  templatePreviewContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  templatePreviewFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  templateText: {
    fontSize: isSmallScreen ? 8 : 10,
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 9 : 12,
  },
  templateTextActive: {
    color: '#667eea',
    fontWeight: '700',
  },
  // Template Preview Styles
  businessTemplatePreview: {
    borderWidth: 3,
    borderColor: '#667eea',
  },
  businessTemplateStyle: {
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
  },
  eventTemplatePreview: {
    borderWidth: 3,
    borderColor: '#f97316',
  },
  eventTemplateStyle: {
    backgroundColor: 'rgba(249, 115, 22, 0.8)',
  },
  restaurantTemplatePreview: {
    borderWidth: 3,
    borderColor: '#22c55e',
  },
  restaurantTemplateStyle: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
  },
  fashionTemplatePreview: {
    borderWidth: 3,
    borderColor: '#ec4899',
  },
  fashionTemplateStyle: {
    backgroundColor: 'rgba(236, 72, 153, 0.8)',
  },
  realEstateTemplatePreview: {
    borderWidth: 3,
    borderColor: '#8b5cf6',
  },
  realEstateTemplateStyle: {
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
  },
  educationTemplatePreview: {
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  educationTemplateStyle: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  healthcareTemplatePreview: {
    borderWidth: 3,
    borderColor: '#10b981',
  },
  healthcareTemplateStyle: {
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
  },
  fitnessTemplatePreview: {
    borderWidth: 3,
    borderColor: '#ef4444',
  },
  fitnessTemplateStyle: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  weddingTemplatePreview: {
    borderWidth: 3,
    borderColor: '#fbbf24',
  },
  weddingTemplateStyle: {
    backgroundColor: 'rgba(251, 191, 36, 0.8)',
  },
  birthdayTemplatePreview: {
    borderWidth: 3,
    borderColor: '#f472b6',
  },
  birthdayTemplateStyle: {
    backgroundColor: 'rgba(244, 114, 182, 0.8)',
  },
  corporateTemplatePreview: {
    borderWidth: 3,
    borderColor: '#374151',
  },
  corporateTemplateStyle: {
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
  },
  creativeTemplatePreview: {
    borderWidth: 3,
    borderColor: '#000000',
  },
  creativeTemplateStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  luxuryTemplatePreview: {
    borderWidth: 3,
    borderColor: '#d4af37',
  },
  luxuryTemplateStyle: {
    backgroundColor: 'rgba(212, 175, 55, 0.8)',
  },
  vintageTemplatePreview: {
    borderWidth: 3,
    borderColor: '#78716c',
  },
  vintageTemplateStyle: {
    backgroundColor: 'rgba(120, 113, 108, 0.8)',
  },
  retroTemplatePreview: {
    borderWidth: 3,
    borderColor: '#fb923c',
  },
  retroTemplateStyle: {
    backgroundColor: 'rgba(251, 146, 60, 0.8)',
  },
  techTemplatePreview: {
    borderWidth: 3,
    borderColor: '#00ff00',
  },
  techTemplateStyle: {
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
  },
  natureTemplatePreview: {
    borderWidth: 3,
    borderColor: '#22c55e',
  },
  natureTemplateStyle: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
  },
  oceanTemplatePreview: {
    borderWidth: 3,
    borderColor: '#06b6d4',
  },
  oceanTemplateStyle: {
    backgroundColor: 'rgba(6, 182, 212, 0.8)',
  },
  sunsetTemplatePreview: {
    borderWidth: 3,
    borderColor: '#f59e0b',
  },
  sunsetTemplateStyle: {
    backgroundColor: 'rgba(245, 158, 11, 0.8)',
  },
  cosmicTemplatePreview: {
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  cosmicTemplateStyle: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  artisticTemplatePreview: {
    borderWidth: 3,
    borderColor: '#a855f7',
  },
  artisticTemplateStyle: {
    backgroundColor: 'rgba(168, 85, 247, 0.8)',
  },
  sportTemplatePreview: {
    borderWidth: 3,
    borderColor: '#ef4444',
  },
  sportTemplateStyle: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  warmTemplatePreview: {
    borderWidth: 3,
    borderColor: '#f59e0b',
  },
  warmTemplateStyle: {
    backgroundColor: 'rgba(245, 158, 11, 0.8)',
  },
  coolTemplatePreview: {
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  coolTemplateStyle: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  // Additional Template Preview Styles
  minimalTemplatePreview: {
    borderWidth: 3,
    borderColor: '#CCCCCC',
  },
  minimalTemplateStyle: {
    backgroundColor: 'rgba(204, 204, 204, 0.8)',
  },
  modernTemplatePreview: {
    borderWidth: 3,
    borderColor: '#667eea',
  },
  modernTemplateStyle: {
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
  },
  elegantTemplatePreview: {
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  elegantTemplateStyle: {
    backgroundColor: 'rgba(212, 175, 55, 0.8)',
  },
  boldTemplatePreview: {
    borderWidth: 3,
    borderColor: '#000000',
  },
  boldTemplateStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },

  glassMorphismFooterPreview: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  glassMorphismFooterStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  neonFooterPreview: {
    borderWidth: 3,
    borderColor: '#00ff00',
  },
  neonFooterStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  luxuryFooterPreview: {
    borderWidth: 4,
    borderColor: '#d4af37',
  },
  luxuryFooterStyle: {
    backgroundColor: 'rgba(212, 175, 55, 0.95)',
  },
  techFooterPreview: {
    borderWidth: 3,
    borderColor: '#00ff00',
  },
  techFooterStyle: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
  },
  artisticFooterPreview: {
    borderWidth: 3,
    borderColor: '#a855f7',
  },
  artisticFooterStyle: {
    backgroundColor: 'rgba(168, 85, 247, 0.9)',
  },
  vintageFooterPreview: {
    borderWidth: 3,
    borderColor: '#78716c',
  },
  vintageFooterStyle: {
    backgroundColor: 'rgba(120, 113, 108, 0.9)',
  },
  retroFooterPreview: {
    borderWidth: 3,
    borderColor: '#fb923c',
  },
  retroFooterStyle: {
    backgroundColor: 'rgba(251, 146, 60, 0.9)',
  },
  futuristicFooterPreview: {
    borderWidth: 3,
    borderColor: '#06b6d4',
  },
  futuristicFooterStyle: {
    backgroundColor: 'rgba(6, 182, 212, 0.9)',
  },
  cosmicFooterPreview: {
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  cosmicFooterStyle: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
  },
  natureFooterPreview: {
    borderWidth: 3,
    borderColor: '#22c55e',
  },
  natureFooterStyle: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
  },
  sportFooterPreview: {
    borderWidth: 3,
    borderColor: '#ef4444',
  },
  sportFooterStyle: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  warmFooterPreview: {
    borderWidth: 3,
    borderColor: '#f59e0b',
  },
  warmFooterStyle: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
  },
  coolFooterPreview: {
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  coolFooterStyle: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
  },
  // Footer Styles Modal Styles
  footerStylesModalContent: {
    maxHeight: 400,
    marginBottom: 16,
  },
  footerStylesModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  footerStyleModalButton: {
    width: (screenWidth * 0.85 - 64) / 3 - 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  footerStyleModalPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  footerStyleModalPreviewContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  footerStyleModalPreviewFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  footerStyleModalText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerStyleModalDescription: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 4,
  },
  // Footer Modal Preview Styles
  classicFooterModalPreview: {
    borderWidth: 4,
    borderColor: '#8B4513',
  },
  classicFooterModalStyle: {
    backgroundColor: 'rgba(139, 69, 19, 0.8)',
  },
  modernFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  modernFooterModalStyle: {
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
  },
  elegantFooterModalPreview: {
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  elegantFooterModalStyle: {
    backgroundColor: 'rgba(212, 175, 55, 0.8)',
  },
  boldFooterModalPreview: {
    borderWidth: 6,
    borderColor: '#000000',
  },
  boldFooterModalStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  minimalFooterModalPreview: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  minimalFooterModalStyle: {
    backgroundColor: 'rgba(204, 204, 204, 0.6)',
  },
  premiumFooterModalPreview: {
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  premiumFooterModalStyle: {
    backgroundColor: 'rgba(212, 175, 55, 0.9)',
  },
  corporateFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  corporateFooterModalStyle: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
  },
  creativeFooterModalPreview: {
    borderWidth: 6,
    borderColor: '#000000',
  },
  creativeFooterModalStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  // Advanced Footer Modal Preview Styles
  gradientBlueFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  gradientBlueFooterModalStyle: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
  },
  gradientPurpleFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#9333ea',
  },
  gradientPurpleFooterModalStyle: {
    backgroundColor: 'rgba(147, 51, 234, 0.9)',
  },
  gradientGreenFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  gradientGreenFooterModalStyle: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
  },
  gradientOrangeFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#f97316',
  },
  gradientOrangeFooterModalStyle: {
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
  },
  gradientPinkFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#ec4899',
  },
  gradientPinkFooterModalStyle: {
    backgroundColor: 'rgba(236, 72, 153, 0.9)',
  },
  glassMorphismFooterModalPreview: {
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  glassMorphismFooterModalStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  neonFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  neonFooterModalStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  luxuryFooterModalPreview: {
    borderWidth: 3,
    borderColor: '#d4af37',
  },
  luxuryFooterModalStyle: {
    backgroundColor: 'rgba(212, 175, 55, 0.95)',
  },
  techFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  techFooterModalStyle: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
  },
  artisticFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  artisticFooterModalStyle: {
    backgroundColor: 'rgba(168, 85, 247, 0.9)',
  },
  vintageFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#78716c',
  },
  vintageFooterModalStyle: {
    backgroundColor: 'rgba(120, 113, 108, 0.9)',
  },
  retroFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#fb923c',
  },
  retroFooterModalStyle: {
    backgroundColor: 'rgba(251, 146, 60, 0.9)',
  },
  futuristicFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#06b6d4',
  },
  futuristicFooterModalStyle: {
    backgroundColor: 'rgba(6, 182, 212, 0.9)',
  },
  cosmicFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  cosmicFooterModalStyle: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
  },
  natureFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  natureFooterModalStyle: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
  },
  sportFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  sportFooterModalStyle: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  warmFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  warmFooterModalStyle: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
  },
  coolFooterModalPreview: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  coolFooterModalStyle: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
  },
  // Footer Style Button Styles
  footerStyleButton: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 80,
  },
  footerStyleButtonActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    padding: 8,
  },
  footerStylePreview: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  footerStylePreviewContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  footerStylePreviewFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  footerStyleText: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  footerStyleTextActive: {
    color: '#667eea',
    fontWeight: '700',
  },
  // Footer Styles Section Styles
  footerStylesSection: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: isSmallScreen ? 8 : 16,
    padding: getResponsiveSectionPadding(),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: getResponsiveSectionMargin(),
    marginHorizontal: getResponsiveSectionPadding(),
  },
  footerStylesHeader: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 4 : 8,
  },
  footerStylesTitle: {
    fontSize: isSmallScreen ? 11 : 14,
    fontWeight: '700',
    color: '#333333',
  },
  footerStylesSubtitle: {
    fontSize: isSmallScreen ? 8 : 10,
    color: '#666666',
    marginTop: 1,
  },
  footerStylesScrollContent: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  frameApplicationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  frameApplicationIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  frameApplicationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
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
    opacity: 0.9, // Slightly transparent to show poster underneath
  },

});

export default PosterEditorScreen; 