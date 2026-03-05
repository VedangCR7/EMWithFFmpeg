import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
// Optimized for all screen devices with responsive design improvements
// Canvas height: 38-45% on portrait mode, 65% on landscape (prevents toolbar overlap)
// Toolbar is fixed on screen (no vertical scroll) with horizontal scroll for buttons
// All sections (toolbar, toggle fields, templates) have fixed heights and are fully responsive
// Layout ensures no overlapping between canvas and controls across all screen sizes
// 
// FRAME POSITION LOGIC:
// - Original layer positions are stored ONCE when first frame is applied
// - Original layers are preserved when frame is removed (not cleared)
// - When applying another frame, same original positions are used
// - Original layers are only cleared when: template changes OR business profile changes
// This ensures consistent element positions across multiple frame applications
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
import { GOOGLE_FONTS, getFontsByCategory, SYSTEM_FONTS, getFontFamily } from '../services/fontService';
import { useSubscription } from '../contexts/SubscriptionContext';
import Watermark from '../components/Watermark';
import { useTheme } from '../context/ThemeContext';
import PremiumTemplateModal from '../components/PremiumTemplateModal';



const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Utility: convert color to rgba with custom alpha (supports rgba(), rgb(), #RRGGBB)
const toRgba = (color: string, alpha: number): string => {
  if (!color) return `rgba(0,0,0,${alpha})`;
  const trimmed = color.trim();
  if (trimmed.startsWith('rgba')) {
    const parts = trimmed.replace(/rgba\(|\)/g, '').split(',').map(p => p.trim());
    const r = Number(parts[0]) || 0;
    const g = Number(parts[1]) || 0;
    const b = Number(parts[2]) || 0;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (trimmed.startsWith('rgb')) {
    const parts = trimmed.replace(/rgb\(|\)/g, '').split(',').map(p => p.trim());
    const r = Number(parts[0]) || 0;
    const g = Number(parts[1]) || 0;
    const b = Number(parts[2]) || 0;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (trimmed.startsWith('#')) {
    const hex = trimmed.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return `rgba(0,0,0,${alpha})`;
};

const getOmbreColors = (base: string | undefined) => {
  const baseColor = base || 'rgba(0,0,0,1)';
  return [toRgba(baseColor, 0.6), toRgba(baseColor, 0.3), toRgba(baseColor, 0.0)];
};

// Compact spacing multiplier to reduce all spacing (50% reduction)
const COMPACT_MULTIPLIER = 0.5;
const ALIGNMENT_THRESHOLD = 8;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const TEMPLATE_FOOTER_STYLES: Record<string, { backgroundColor: string; gradient?: string[] }> = {
  business: { backgroundColor: 'rgba(102, 126, 234, 0.9)' },
  event: { backgroundColor: 'rgba(239, 68, 68, 0.9)' },
  restaurant: { backgroundColor: 'rgba(34, 197, 94, 0.9)' },
  fashion: { backgroundColor: 'rgba(236, 72, 153, 0.9)' },
  'real-estate': { backgroundColor: 'rgba(245, 158, 11, 0.9)' },
  education: { backgroundColor: 'rgba(59, 130, 246, 0.9)' },
  healthcare: { backgroundColor: 'rgba(6, 182, 212, 0.9)' },
  fitness: { backgroundColor: 'rgba(168, 85, 247, 0.9)' },
  wedding: { backgroundColor: 'rgba(212, 175, 55, 0.9)' },
  birthday: { backgroundColor: 'rgba(251, 146, 60, 0.9)' },
  corporate: { backgroundColor: 'rgba(30, 41, 59, 0.95)' },
  creative: { backgroundColor: 'rgba(147, 51, 234, 0.9)' },
  minimal: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  luxury: { backgroundColor: 'rgba(212, 175, 55, 0.95)' },
  vintage: { backgroundColor: 'rgba(120, 113, 108, 0.9)' },
  retro: { backgroundColor: 'rgba(251, 146, 60, 0.9)' },
  elegant: { backgroundColor: 'rgba(139, 69, 19, 0.9)' },
  tech: { backgroundColor: 'rgba(30, 41, 59, 0.95)' },
  ocean: { backgroundColor: 'rgba(6, 182, 212, 0.9)' },
  sunset: { backgroundColor: 'rgba(239, 68, 68, 0.9)' },
  artistic: { backgroundColor: 'rgba(168, 85, 247, 0.9)' },
  'ombre-sunset': { backgroundColor: 'rgba(255, 107, 107, 0.9)', gradient: ['#FF6B6B', '#FFA500', '#FFD700'] },
  'ombre-ocean': { backgroundColor: 'rgba(102, 126, 234, 0.9)', gradient: ['#667eea', '#06b6d4', '#22c55e'] },
  'ombre-purple': { backgroundColor: 'rgba(147, 51, 234, 0.9)', gradient: ['#9333ea', '#ec4899', '#f43f5e'] },
  'ombre-forest': { backgroundColor: 'rgba(6, 95, 70, 0.9)', gradient: ['#065f46', '#059669', '#10b981'] },
  'ombre-fire': { backgroundColor: 'rgba(220, 38, 38, 0.9)', gradient: ['#dc2626', '#f59e0b', '#fbbf24'] },
  'ombre-night': { backgroundColor: 'rgba(30, 58, 138, 0.9)', gradient: ['#1e3a8a', '#7c3aed', '#ec4899'] },
  'ombre-tropical': { backgroundColor: 'rgba(244, 114, 182, 0.9)', gradient: ['#f472b6', '#fb923c', '#06b6d4'] },
  'ombre-autumn': { backgroundColor: 'rgba(120, 53, 15, 0.9)', gradient: ['#78350f', '#ea580c', '#dc2626'] },
  'ombre-rose': { backgroundColor: 'rgba(190, 18, 60, 0.9)', gradient: ['#be123c', '#f472b6', '#fda4af'] },
  'ombre-galaxy': { backgroundColor: 'rgba(99, 102, 241, 0.9)', gradient: ['#6366f1', '#8b5cf6', '#06b6d4'] },
};
const TEXT_FIELD_KEYS = ['companyName','phone','email','website','category','address','services'];
const TEMPLATE_OPTIONS = [
  { id: 'business', label: 'Business' },
  { id: 'event', label: 'Event' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'education', label: 'Education' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'creative', label: 'Creative' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'retro', label: 'Retro' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'tech', label: 'Tech' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'artistic', label: 'Artistic' },
  { id: 'ombre-sunset', label: 'Ombre Sunset' },
  { id: 'ombre-ocean', label: 'Ombre Ocean' },
  { id: 'ombre-purple', label: 'Ombre Purple' },
  { id: 'ombre-forest', label: 'Ombre Forest' },
  { id: 'ombre-fire', label: 'Ombre Fire' },
  { id: 'ombre-night', label: 'Ombre Night' },
  { id: 'ombre-tropical', label: 'Ombre Tropical' },
  { id: 'ombre-autumn', label: 'Ombre Autumn' },
  { id: 'ombre-rose', label: 'Ombre Rose' },
  { id: 'ombre-galaxy', label: 'Ombre Galaxy' },
];

// Responsive scaling functions for static styles
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
// Canvas is square (1:1 ratio) to match 1024x1024 image ratio
const getResponsiveDimensions = (insets: any) => {
  const availableWidth = screenWidth - (insets.left + insets.right);
  const availableHeight = screenHeight - (insets.top + insets.bottom);
  
  // Calculate square canvas dimensions based on screen size
  let canvasWidthRatio = 0.95;
  
  if (isLandscape) {
    // Landscape mode - smaller square canvas
    canvasWidthRatio = isTablet ? 0.5 : 0.6;
  } else {
    // Portrait mode - square canvas that fits the screen
    if (isTablet) {
      canvasWidthRatio = 0.7;
    } else if (isUltraSmallScreen) {
      canvasWidthRatio = 0.95;
    } else if (isSmallScreen) {
      canvasWidthRatio = 0.93;
    } else if (isMediumScreen) {
      canvasWidthRatio = 0.92;
    } else if (isLargeScreen) {
      canvasWidthRatio = 0.90;
    } else {
      canvasWidthRatio = 0.88;
    }
  }
  
  // Make canvas square: width = height (1:1 aspect ratio for 1024x1024 images)
  const canvasWidth = Math.min(availableWidth * canvasWidthRatio, screenWidth * canvasWidthRatio);
  const canvasHeight = canvasWidth; // Square canvas!
  
  return {
    canvasWidth,
    canvasHeight,
    availableWidth,
    availableHeight,
    canvasWidthRatio,
    canvasHeightRatio: canvasWidthRatio // Same as width ratio for square
  };
};

// Enhanced responsive helpers with orientation and device type support (compact versions)
const getResponsiveSectionHeight = () => {
  if (isLandscape) {
    return (isTablet ? 100 : 80) * COMPACT_MULTIPLIER;
  }
  return (isUltraSmallScreen ? 50 : isSmallScreen ? 65 : isMediumScreen ? 80 : isLargeScreen ? 100 : 120) * COMPACT_MULTIPLIER;
};

const getResponsiveButtonSize = () => {
  if (isLandscape) {
    return (isTablet ? 60 : 45) * 0.7;
  }
  return (isUltraSmallScreen ? 40 : isSmallScreen ? 50 : isMediumScreen ? 60 : isLargeScreen ? 70 : 80) * 0.7;
};

const getResponsiveIconSize = () => {
  if (isLandscape) {
    return Math.max(12, (isTablet ? 20 : 16) * 0.8);
  }
  return Math.max(11, (isUltraSmallScreen ? 14 : isSmallScreen ? 16 : isMediumScreen ? 18 : isLargeScreen ? 20 : 22) * 0.8);
};

const getResponsiveSectionPadding = () => {
  if (isLandscape) {
    return Math.max(4, (isTablet ? 16 : 8) * COMPACT_MULTIPLIER);
  }
  return Math.max(2, (isUltraSmallScreen ? 4 : isSmallScreen ? 6 : isMediumScreen ? 8 : isLargeScreen ? 10 : 12) * COMPACT_MULTIPLIER);
};

const getResponsiveSectionMargin = () => {
  if (isLandscape) {
    return Math.max(5, (isTablet ? 20 : 10) * COMPACT_MULTIPLIER);
  }
  return Math.max(2, (isUltraSmallScreen ? 4 : isSmallScreen ? 6 : isMediumScreen ? 8 : isLargeScreen ? 12 : 15) * COMPACT_MULTIPLIER);
};

// Enhanced compact mode helpers (with compact multiplier)
const getUltraCompactSpacing = () => {
  if (isLandscape) {
    return Math.max(3, (isTablet ? 12 : 6) * COMPACT_MULTIPLIER);
  }
  return Math.max(1, (isUltraSmallScreen ? 2 : isSmallScreen ? 4 : getResponsiveSectionPadding()) * COMPACT_MULTIPLIER);
};

const getUltraCompactMargin = () => {
  if (isLandscape) {
    return Math.max(4, (isTablet ? 16 : 8) * COMPACT_MULTIPLIER);
  }
  return Math.max(1, (isUltraSmallScreen ? 2 : isSmallScreen ? 4 : getResponsiveSectionMargin()) * COMPACT_MULTIPLIER);
};

// Enhanced header-specific responsive helpers (compact versions)
const getHeaderButtonSize = () => {
  if (isLandscape) {
    return Math.max(24, (isTablet ? 44 : 32) * 0.7);
  }
  return Math.max(20, (isUltraSmallScreen ? 28 : isSmallScreen ? 32 : isMediumScreen ? 36 : isLargeScreen ? 40 : 44) * 0.7);
};

const getHeaderPadding = () => {
  if (isLandscape) {
    return Math.max(3, (isTablet ? 12 : 6) * 0.6);
  }
  return Math.max(1, (isUltraSmallScreen ? 2 : isSmallScreen ? 4 : isMediumScreen ? 6 : isLargeScreen ? 8 : 10) * 0.6);
};

const getHeaderTitleSize = () => {
  if (isLandscape) {
    return Math.max(14, (isTablet ? 20 : 16) * 0.85);
  }
  return Math.max(12, (isUltraSmallScreen ? 14 : isSmallScreen ? 16 : isMediumScreen ? 18 : isLargeScreen ? 20 : 22) * 0.85);
};

const getHeaderSubtitleSize = () => {
  if (isLandscape) {
    return Math.max(10, (isTablet ? 14 : 12) * 0.85);
  }
  return Math.max(9, (isUltraSmallScreen ? 10 : isSmallScreen ? 11 : isMediumScreen ? 12 : isLargeScreen ? 13 : 14) * 0.85);
};

// Enhanced toolbar-specific responsive helpers (for bottom toolbar - compact versions)
const getToolbarButtonSize = () => {
  if (isLandscape) {
    return Math.max(49, (isTablet ? 80 : 70) * 0.7);
  }
  return Math.max(42, (isUltraSmallScreen ? 60 : isSmallScreen ? 65 : isMediumScreen ? 70 : isLargeScreen ? 75 : 80) * 0.7);
};

const getToolbarButtonTextSize = () => {
  if (isLandscape) {
    return Math.max(8, (isTablet ? 12 : 10) * 0.85);
  }
  return Math.max(7, (isUltraSmallScreen ? 8 : isSmallScreen ? 9 : isMediumScreen ? 10 : isLargeScreen ? 11 : 12) * 0.85);
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
  isCircular?: boolean; // Toggle between circle and square for logos
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
        id?: string;
        templateId?: string;
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
  const { isSubscribed, checkPremiumAccess, refreshSubscription } = useSubscription();
  const { isDarkMode, theme } = useTheme();
  
  // Get high quality image URL for editor (replace thumbnail params with high quality)
  const getHighQualityImageUrl = (imageUri: string): string => {
    let url = imageUri;
    
    // Remove any existing quality/size parameters
    url = url.replace(/[?&](quality|width|height|w|h|size)=[^&]*/gi, '');
    
    // Add high quality parameters for editor
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}quality=high&width=2400`;
  };
  
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
  
  const currentScreenWidth = dimensions.width;
  const currentScreenHeight = dimensions.height;
  
  // Dynamic device detection that updates on rotation
  const isTabletDevice = useMemo(() => Math.min(currentScreenWidth, currentScreenHeight) >= 768, [currentScreenWidth, currentScreenHeight]);
  const isLandscapeMode = useMemo(() => currentScreenWidth > currentScreenHeight, [currentScreenWidth, currentScreenHeight]);
  const isPortraitMode = useMemo(() => currentScreenHeight > currentScreenWidth, [currentScreenWidth, currentScreenHeight]);
  
  // Dynamic screen size breakpoints
  const isUltraSmallDevice = useMemo(() => currentScreenWidth < 360, [currentScreenWidth]);
  const isSmallDevice = useMemo(() => currentScreenWidth >= 360 && currentScreenWidth < 375, [currentScreenWidth]);
  const isMediumDevice = useMemo(() => currentScreenWidth >= 375 && currentScreenWidth < 414, [currentScreenWidth]);
  const isLargeDevice = useMemo(() => currentScreenWidth >= 414 && currentScreenWidth < 480, [currentScreenWidth]);
  const isXLargeDevice = useMemo(() => currentScreenWidth >= 480, [currentScreenWidth]);
  
  // Dynamic responsive scaling functions (for theme styles that need to update on orientation change)
  const dynamicScale = (size: number) => (currentScreenWidth / 375) * size;
  const dynamicVerticalScale = (size: number) => (currentScreenHeight / 667) * size;
  const dynamicModerateScale = (size: number, factor = 0.5) => size + (dynamicScale(size) - size) * factor;
  
  // Get responsive dimensions - dynamically calculated based on current screen size
  const responsiveDimensions = useMemo(() => {
    const availableWidth = currentScreenWidth - (insets.left + insets.right);
    const availableHeight = currentScreenHeight - (insets.top + insets.bottom);
    
    // Calculate square canvas dimensions based on screen size
    let canvasWidthRatio = 0.95;
    
    if (isLandscapeMode) {
      // Landscape mode - smaller square canvas
      canvasWidthRatio = isTabletDevice ? 0.5 : 0.6;
    } else {
      // Portrait mode - square canvas that fits the screen
      if (isTabletDevice) {
        canvasWidthRatio = 0.7;
      } else if (isUltraSmallDevice) {
        canvasWidthRatio = 0.95;
      } else if (isSmallDevice) {
        canvasWidthRatio = 0.93;
      } else if (isMediumDevice) {
        canvasWidthRatio = 0.92;
      } else if (isLargeDevice) {
        canvasWidthRatio = 0.90;
      } else {
        canvasWidthRatio = 0.88;
      }
    }
    
    // Make canvas square: width = height (1:1 aspect ratio for 1024x1024 images)
    const canvasWidth = Math.min(availableWidth * canvasWidthRatio, currentScreenWidth * canvasWidthRatio);
    const canvasHeight = canvasWidth; // Square canvas!
    
    return {
      canvasWidth,
      canvasHeight,
      availableWidth,
      availableHeight,
      canvasWidthRatio,
      canvasHeightRatio: canvasWidthRatio // Same as width ratio for square
    };
  }, [currentScreenWidth, currentScreenHeight, isLandscapeMode, isTabletDevice, isUltraSmallDevice, isSmallDevice, isMediumDevice, isLargeDevice, insets]);
  
  const { canvasWidth, canvasHeight, availableWidth, availableHeight } = responsiveDimensions;
  
  // Dynamic responsive helper functions
  const getResponsiveIconSize = useCallback(() => {
    if (isLandscapeMode) {
      return Math.max(12, (isTabletDevice ? 20 : 16) * 0.8);
    }
    return Math.max(11, (isUltraSmallDevice ? 14 : isSmallDevice ? 16 : isMediumDevice ? 18 : isLargeDevice ? 20 : 22) * 0.8);
  }, [isLandscapeMode, isTabletDevice, isUltraSmallDevice, isSmallDevice, isMediumDevice, isLargeDevice]);
  
  const getResponsiveButtonSize = useCallback(() => {
    if (isLandscapeMode) {
      return Math.max(49, (isTabletDevice ? 80 : 70) * 0.7);
    }
    return Math.max(42, (isUltraSmallDevice ? 60 : isSmallDevice ? 65 : isMediumDevice ? 70 : isLargeDevice ? 75 : 80) * 0.7);
  }, [isLandscapeMode, isTabletDevice, isUltraSmallDevice, isSmallDevice, isMediumDevice, isLargeDevice]);
  
  const canvasTopOffset = insets.top + moderateScale(12);
  const canvasBottomY = canvasTopOffset + canvasHeight;
  const fontModalSpacing = moderateScale(24);
  const bottomSafeArea = Math.max(insets.bottom, responsiveSpacing.lg);
  const desiredTop = canvasBottomY + fontModalSpacing;
  const availableBelowCanvas = screenHeight - desiredTop - bottomSafeArea;
  const minFontModalHeight = screenHeight * 0.18;
  const maxFontModalHeight = screenHeight * 0.4;
  const fontModalMaxHeight = availableBelowCanvas >= minFontModalHeight
    ? Math.min(availableBelowCanvas, maxFontModalHeight)
    : maxFontModalHeight;
  const fallbackTop = screenHeight - fontModalMaxHeight - bottomSafeArea;
  const fontModalTopOffset = availableBelowCanvas >= minFontModalHeight
    ? desiredTop
    : Math.max(canvasBottomY - canvasHeight / 2, fallbackTop);
  const fontModalWidth = Math.min(canvasWidth * 0.88, screenWidth * 0.9);

  // Create theme-aware styles (with dynamic responsive scaling)
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
      borderRadius: dynamicModerateScale(14),
      padding: dynamicModerateScale(12),
      width: currentScreenWidth * 0.92,
      maxHeight: currentScreenHeight * 0.7,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(4),
      },
      shadowOpacity: isDarkMode ? 0.3 : 0.2,
      shadowRadius: dynamicModerateScale(10),
      elevation: dynamicModerateScale(8),
    },
    fontModalContent: {
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: dynamicModerateScale(14),
      padding: dynamicModerateScale(12),
      width: currentScreenWidth * 0.92,
      height: currentScreenHeight * 0.50,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(4),
      },
      shadowOpacity: isDarkMode ? 0.3 : 0.2,
      shadowRadius: dynamicModerateScale(10),
      elevation: dynamicModerateScale(8),
    },
    modalTitle: {
      fontSize: dynamicModerateScale(12),
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginBottom: dynamicModerateScale(8),
    },
    modalSubtitle: {
      fontSize: dynamicModerateScale(12),
      color: theme?.colors?.textSecondary || '#666666',
      marginBottom: dynamicModerateScale(12),
      fontWeight: '500' as const,
    },
    textInput: {
      borderWidth: 1.5,
      borderColor: theme?.colors?.border || '#e9ecef',
      borderRadius: dynamicModerateScale(8),
      padding: dynamicModerateScale(10),
      fontSize: dynamicModerateScale(13),
      marginBottom: dynamicModerateScale(12),
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      color: theme?.colors?.text || '#333333',
    },
    cancelButton: {
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      borderWidth: 1.5,
      borderColor: theme?.colors?.border || '#e9ecef',
    },
    cancelButtonText: {
      color: theme?.colors?.textSecondary || '#666666',
      fontSize: dynamicModerateScale(12),
      fontWeight: '600' as const,
    },
    profileItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: dynamicModerateScale(8),
      paddingHorizontal: dynamicModerateScale(10),
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      borderRadius: dynamicModerateScale(8),
      marginBottom: dynamicModerateScale(6),
    },
    profileLogo: {
      width: dynamicModerateScale(35),
      height: dynamicModerateScale(35),
      borderRadius: dynamicModerateScale(17.5),
      marginRight: dynamicModerateScale(8),
    },
    profileLogoPlaceholder: {
      width: dynamicModerateScale(35),
      height: dynamicModerateScale(35),
      borderRadius: dynamicModerateScale(17.5),
      backgroundColor: theme?.colors?.border || '#e9ecef',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: dynamicModerateScale(8),
    },
    profileName: {
      fontSize: dynamicModerateScale(10),
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginBottom: dynamicModerateScale(1.5),
    },
    profileDescription: {
      fontSize: dynamicModerateScale(8.5),
      color: theme?.colors?.textSecondary || '#666666',
      lineHeight: dynamicModerateScale(11),
    },
    profileCategory: {
      fontSize: dynamicModerateScale(8.5),
      color: '#667eea',
      marginBottom: dynamicModerateScale(1.5),
      fontWeight: '600' as const,
    },
    styleOption: {
      width: dynamicModerateScale(36),
      height: dynamicModerateScale(36),
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      borderRadius: dynamicModerateScale(8),
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      margin: dynamicModerateScale(2),
      borderWidth: 1.5,
      borderColor: theme?.colors?.border || '#e9ecef',
    },
    styleOptionText: {
      fontSize: dynamicModerateScale(11),
      color: theme?.colors?.text || '#333333',
      fontWeight: '600' as const,
    },
    styleSectionTitle: {
      fontSize: dynamicModerateScale(13),
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginBottom: dynamicModerateScale(8),
    },
    fieldToggleSection: {
      width: '100%',
      backgroundColor: theme?.colors?.surface || 'rgba(255, 255, 255, 0.95)',
      borderRadius: dynamicModerateScale(10),
      padding: dynamicModerateScale(6),
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(2),
      },
      shadowOpacity: isDarkMode ? 0.15 : 0.08,
      shadowRadius: dynamicModerateScale(6),
      elevation: dynamicModerateScale(4),
      borderWidth: 0.5,
      borderColor: theme?.colors?.border || '#e9ecef',
      marginBottom: dynamicModerateScale(8),
      marginHorizontal: dynamicModerateScale(6),
    },
    fieldToggleTitle: {
      fontSize: dynamicModerateScale(11),
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
    },
    fieldToggleSubtitle: {
      fontSize: dynamicModerateScale(8),
      color: theme?.colors?.textSecondary || '#666666',
      marginTop: dynamicModerateScale(0.5),
    },
    fieldToggleButton: {
      alignItems: 'center' as const,
      paddingVertical: dynamicModerateScale(6),
      paddingHorizontal: dynamicModerateScale(8),
      borderRadius: dynamicModerateScale(10),
      backgroundColor: theme?.colors?.border || '#e9ecef',
      marginHorizontal: dynamicModerateScale(2),
      flexDirection: 'row' as const,
      minWidth: dynamicModerateScale(60),
      justifyContent: 'center' as const,
    },
    fieldToggleButtonText: {
      fontSize: dynamicModerateScale(9),
      color: theme?.colors?.textSecondary || '#666666',
      marginLeft: dynamicModerateScale(3),
      fontWeight: '500' as const,
    },
    footerStylesSection: {
      width: '100%',
      backgroundColor: theme?.colors?.surface || 'rgba(255, 255, 255, 0.95)',
      borderRadius: dynamicModerateScale(10),
      padding: dynamicModerateScale(6),
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(2),
      },
      shadowOpacity: isDarkMode ? 0.15 : 0.08,
      shadowRadius: dynamicModerateScale(6),
      elevation: dynamicModerateScale(4),
      borderWidth: 0.5,
      borderColor: theme?.colors?.border || '#e9ecef',
      marginBottom: dynamicModerateScale(8),
      marginHorizontal: dynamicModerateScale(6),
    },
    footerStylesTitle: {
      fontSize: dynamicModerateScale(11),
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
    },
    footerStylesSubtitle: {
      fontSize: dynamicModerateScale(8),
      color: theme?.colors?.textSecondary || '#666666',
      marginTop: dynamicModerateScale(0.5),
    },
    footerStyleModalButton: {
      width: (currentScreenWidth * 0.85 - dynamicModerateScale(64)) / 3 - dynamicModerateScale(12),
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: dynamicModerateScale(8),
      padding: dynamicModerateScale(10),
      marginBottom: dynamicModerateScale(12),
      marginHorizontal: dynamicModerateScale(4),
      alignItems: 'center' as const,
      borderWidth: 0.5,
      borderColor: theme?.colors?.border || '#e9ecef',
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(1),
      },
      shadowOpacity: isDarkMode ? 0.1 : 0.08,
      shadowRadius: dynamicModerateScale(2),
      elevation: dynamicModerateScale(1),
    },
    footerStyleModalPreview: {
      width: dynamicModerateScale(45),
      height: dynamicModerateScale(45),
      borderRadius: dynamicModerateScale(6),
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: dynamicModerateScale(5),
      borderWidth: 1.5,
      borderColor: theme?.colors?.border || '#e9ecef',
      overflow: 'hidden',
    },
    footerStyleModalText: {
      fontSize: dynamicModerateScale(14),
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      textAlign: 'center' as const,
      marginBottom: dynamicModerateScale(5),
    },
    footerStyleModalDescription: {
      fontSize: dynamicModerateScale(9),
      fontWeight: '600' as const,
      color: theme?.colors?.textSecondary || '#666666',
      textAlign: 'center' as const,
      lineHeight: dynamicModerateScale(11),
      marginTop: dynamicModerateScale(2),
    },
    footerStylePreview: {
      width: dynamicModerateScale(50),
      height: dynamicModerateScale(50),
      borderRadius: dynamicModerateScale(6),
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: dynamicModerateScale(5),
      borderWidth: 1.5,
      borderColor: theme?.colors?.border || '#e9ecef',
      overflow: 'hidden',
    },
    footerStyleText: {
      fontSize: dynamicModerateScale(8),
      color: theme?.colors?.textSecondary || '#666666',
      fontWeight: '600' as const,
      textAlign: 'center' as const,
      lineHeight: dynamicModerateScale(10),
    },
    fontStyleModalTitle: {
      fontSize: dynamicModerateScale(10),
      fontWeight: '600' as const,
      color: theme?.colors?.text || '#333333',
      textAlign: 'center' as const,
      marginTop: dynamicModerateScale(2),
    },
    fontStyleSectionTitle: {
      fontSize: dynamicModerateScale(14),
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginLeft: dynamicModerateScale(8),
    },
    fontStyleSectionSubtitle: {
      fontSize: dynamicModerateScale(11),
      color: theme?.colors?.textSecondary || '#666666',
      marginBottom: dynamicModerateScale(10),
      marginLeft: dynamicModerateScale(20),
      lineHeight: dynamicModerateScale(16),
    },
    logoModalContent: {
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: dynamicModerateScale(14),
      padding: dynamicModerateScale(12),
      width: currentScreenWidth * 0.92,
      maxHeight: currentScreenHeight * 0.7,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(4),
      },
      shadowOpacity: isDarkMode ? 0.3 : 0.2,
      shadowRadius: dynamicModerateScale(10),
      elevation: dynamicModerateScale(8),
    },
    logoModalTitle: {
      fontSize: dynamicModerateScale(16),
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginBottom: dynamicModerateScale(5),
    },
    logoModalSubtitle: {
      fontSize: dynamicModerateScale(12),
      color: theme?.colors?.textSecondary || '#666666',
      marginBottom: dynamicModerateScale(12),
      fontWeight: '500' as const,
    },
    logoModalCloseText: {
      color: theme?.colors?.textSecondary || '#666666',
      fontSize: dynamicModerateScale(13),
      fontWeight: '600' as const,
    },
    instructionsContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -dynamicModerateScale(80) }, { translateY: -dynamicModerateScale(15) }],
      alignItems: 'center' as const,
      backgroundColor: theme?.colors?.surface || 'rgba(255, 255, 255, 0.95)',
      padding: dynamicModerateScale(12),
      borderRadius: dynamicModerateScale(10),
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(2),
      },
      shadowOpacity: isDarkMode ? 0.15 : 0.08,
      shadowRadius: dynamicModerateScale(5),
      elevation: dynamicModerateScale(4),
    },
    instructionsText: {
      fontSize: dynamicModerateScale(11),
      color: theme?.colors?.textSecondary || '#666666',
      textAlign: 'center' as const,
      marginTop: dynamicModerateScale(5),
      maxWidth: dynamicModerateScale(160),
      lineHeight: dynamicModerateScale(16),
    },
    loadingContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -dynamicModerateScale(40) }, { translateY: -dynamicModerateScale(15) }],
      alignItems: 'center' as const,
      backgroundColor: theme?.colors?.surface || 'rgba(255, 255, 255, 0.95)',
      padding: dynamicModerateScale(12),
      borderRadius: dynamicModerateScale(10),
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(2),
      },
      shadowOpacity: isDarkMode ? 0.15 : 0.08,
      shadowRadius: dynamicModerateScale(5),
      elevation: dynamicModerateScale(4),
    },
    loadingText: {
      fontSize: dynamicModerateScale(11),
      color: theme?.colors?.textSecondary || '#666666',
      textAlign: 'center' as const,
      marginTop: dynamicModerateScale(5),
    },
    toolbar: {
      position: 'absolute',
      right: dynamicModerateScale(12),
      top: '50%',
      transform: [{ translateY: -dynamicModerateScale(70) }],
      backgroundColor: theme?.colors?.surface || 'rgba(255, 255, 255, 0.95)',
      borderRadius: dynamicModerateScale(10),
      padding: dynamicModerateScale(6),
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(2),
      },
      shadowOpacity: isDarkMode ? 0.15 : 0.1,
      shadowRadius: dynamicModerateScale(6),
      elevation: dynamicModerateScale(4),
      zIndex: 100,
    },
    // Delete Modal Styles - Fully responsive
    deleteModalContainer: {
      borderRadius: dynamicModerateScale(14),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(4),
      },
      shadowOpacity: isDarkMode ? 0.3 : 0.2,
      shadowRadius: dynamicModerateScale(10),
      elevation: dynamicModerateScale(8),
    },
    deleteModalHeader: {
      alignItems: 'center' as const,
      position: 'relative' as const,
    },
    deleteIconContainer: {
      width: dynamicModerateScale(50),
      height: dynamicModerateScale(50),
      borderRadius: dynamicModerateScale(25),
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    deleteModalTitle: {
      fontSize: dynamicModerateScale(16),
      fontWeight: '700' as const,
      textAlign: 'center' as const,
    },
    closeModalButton: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      width: dynamicModerateScale(26),
      height: dynamicModerateScale(26),
      borderRadius: dynamicModerateScale(13),
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    deleteModalContent: {
      // Dynamic marginBottom handled inline
    },
    deleteModalMessage: {
      textAlign: 'center' as const,
      // Dynamic fontSize and lineHeight handled inline
    },
    deleteModalButtons: {
      flexDirection: 'row' as const,
      gap: dynamicModerateScale(8),
    },
    deleteModalCancelButton: {
      flex: 1,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(1.5),
      },
      shadowOpacity: isDarkMode ? 0.15 : 0.08,
      shadowRadius: dynamicModerateScale(3),
      elevation: dynamicModerateScale(2),
      paddingVertical: dynamicModerateScale(10),
      borderRadius: dynamicModerateScale(8),
    },
    deleteModalCancelText: {
      fontWeight: '600' as const,
      fontSize: dynamicModerateScale(13),
    },
    deleteModalDeleteButton: {
      flex: 1,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: dynamicModerateScale(1.5),
      },
      shadowOpacity: 0.15,
      shadowRadius: dynamicModerateScale(3),
      elevation: dynamicModerateScale(2),
      paddingVertical: dynamicModerateScale(10),
      borderRadius: dynamicModerateScale(8),
    },
    deleteModalDeleteText: {
      fontWeight: '600' as const,
      color: '#ffffff',
      fontSize: dynamicModerateScale(13),
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
  const [selectedFontSize, setSelectedFontSize] = useState<number>(16);
  
  // State for dragging
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  
  // Animated values for each layer's position (not just translation)
  const layerAnimations = useRef<{ [key: string]: { x: Animated.Value; y: Animated.Value } }>({}).current;
  
  // Translation values for dragging
  const translationValues = useRef<{ [key: string]: { x: Animated.Value; y: Animated.Value } }>({}).current;
  
  // Scale values for zooming
  const scaleValues = useRef<{ [key: string]: Animated.Value }>({}).current;
  
  // BorderRadius values for logo shape animation
  const borderRadiusValues = useRef<{ [key: string]: Animated.Value }>({}).current;
  
  // Selection border radius values (borderRadius + 3)
  const selectionBorderRadiusValues = useRef<{ [key: string]: Animated.Value }>({}).current;
  
  // State for field visibility
  // Logo, Company Name, Footer BG, phone (mobile number), email, and website are visible by default
  // All other fields must be manually toggled to show
  const [visibleFields, setVisibleFields] = useState<{[key: string]: boolean}>({
    logo: true,
    companyName: true,
    footerBackground: true,
    phone: true,
    email: true,
    website: true,
    category: false,
    address: false,
    services: false,
  });
  
  // Store original layers for frame removal
  const [originalLayers, setOriginalLayers] = useState<Layer[]>([]);
  const [originalTemplate, setOriginalTemplate] = useState<string>('business');

  const [alignmentGuides, setAlignmentGuides] = useState<{ vertical: number[]; horizontal: number[] }>({
    vertical: [],
    horizontal: []
  });
  const snapOffsets = useRef<{ [key: string]: { x: Animated.Value; y: Animated.Value } }>({}).current;
  const snapOffsetsLatest = useRef<{ [key: string]: { x: number; y: number } }>({});
  const alignmentFrameRef = useRef<number | null>(null);
  const dragTranslationRef = useRef<{ [key: string]: { x: number; y: number } }>({});

  // State for templates
  const [selectedTemplate, setSelectedTemplate] = useState<string>('business');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [initialTemplateApplied, setInitialTemplateApplied] = useState(false);

  // State for business profiles
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<BusinessProfile | null>(null);
  const [showProfileSelectionModal, setShowProfileSelectionModal] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);



  const [isCapturing, setIsCapturing] = useState(false);
  const [forceWatermarkCapture, setForceWatermarkCapture] = useState(false);
  const [currentPositions, setCurrentPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
  const currentPositionsRef = useRef<{ [key: string]: { x: number; y: number } }>({});
  const [showDeleteElementModal, setShowDeleteElementModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showConnectionErrorModal, setShowConnectionErrorModal] = useState(false);

  const ensureSnapOffsets = useCallback((layerId: string) => {
    if (!snapOffsets[layerId]) {
      snapOffsets[layerId] = {
        x: new Animated.Value(0),
        y: new Animated.Value(0)
      };
    }
    if (!snapOffsetsLatest.current[layerId]) {
      snapOffsetsLatest.current[layerId] = { x: 0, y: 0 };
    }
  }, [snapOffsets]);

  const clearAlignmentGuides = useCallback((layerId?: string) => {
    if (alignmentFrameRef.current) {
      cancelAnimationFrame(alignmentFrameRef.current);
      alignmentFrameRef.current = null;
    }
    setAlignmentGuides(prev => {
      if (prev.vertical.length === 0 && prev.horizontal.length === 0) {
        return prev;
      }
      return { vertical: [], horizontal: [] };
    });
    if (layerId) {
      ensureSnapOffsets(layerId);
      snapOffsets[layerId].x.setValue(0);
      snapOffsets[layerId].y.setValue(0);
      snapOffsetsLatest.current[layerId] = { x: 0, y: 0 };
    }
  }, [alignmentFrameRef, ensureSnapOffsets, snapOffsets]);

  const updateAlignmentGuides = useCallback((layerId: string, translationX: number, translationY: number) => {
    const currentLayer = layers.find(layer => layer.id === layerId);
    if (!currentLayer) {
      return;
    }

    const isLayerVisible = (layer: Layer) => {
      if (!layer.fieldType) return true;
      return visibleFields[layer.fieldType] !== false;
    };

    const width = currentLayer.size?.width || 0;
    const height = currentLayer.size?.height || 0;
    const proposedLeft = currentLayer.position.x + translationX;
    const proposedTop = currentLayer.position.y + translationY;

    const movingBounds = {
      left: proposedLeft,
      centerX: proposedLeft + width / 2,
      right: proposedLeft + width,
      top: proposedTop,
      centerY: proposedTop + height / 2,
      bottom: proposedTop + height
    };

    const otherLayers = layers.filter(layer => layer.id !== layerId && isLayerVisible(layer));

    const verticalReferences: number[] = [0, canvasWidth / 2, canvasWidth];
    const horizontalReferences: number[] = [0, canvasHeight / 2, canvasHeight];

    otherLayers.forEach(layer => {
      const layerWidth = layer.size?.width || 0;
      const layerHeight = layer.size?.height || 0;
      verticalReferences.push(layer.position.x, layer.position.x + layerWidth / 2, layer.position.x + layerWidth);
      horizontalReferences.push(layer.position.y, layer.position.y + layerHeight / 2, layer.position.y + layerHeight);
    });

    let bestVerticalPosition: number | null = null;
    let bestVerticalDiff: number | null = null;
    let bestHorizontalPosition: number | null = null;
    let bestHorizontalDiff: number | null = null;

    const movingVerticalEdges = [movingBounds.left, movingBounds.centerX, movingBounds.right];
    const movingHorizontalEdges = [movingBounds.top, movingBounds.centerY, movingBounds.bottom];

    verticalReferences.forEach(ref => {
      movingVerticalEdges.forEach(edge => {
        const diff = ref - edge;
        if (Math.abs(diff) <= ALIGNMENT_THRESHOLD && (bestVerticalDiff === null || Math.abs(diff) < Math.abs(bestVerticalDiff))) {
          bestVerticalPosition = ref;
          bestVerticalDiff = diff;
        }
      });
    });

    horizontalReferences.forEach(ref => {
      movingHorizontalEdges.forEach(edge => {
        const diff = ref - edge;
        if (Math.abs(diff) <= ALIGNMENT_THRESHOLD && (bestHorizontalDiff === null || Math.abs(diff) < Math.abs(bestHorizontalDiff))) {
          bestHorizontalPosition = ref;
          bestHorizontalDiff = diff;
        }
      });
    });

    const verticalGuidePositions: number[] = [];
    const horizontalGuidePositions: number[] = [];
    if (bestVerticalPosition !== null) {
      verticalGuidePositions.push(bestVerticalPosition);
    }
    if (bestHorizontalPosition !== null) {
      horizontalGuidePositions.push(bestHorizontalPosition);
    }
    const nextGuides: { vertical: number[]; horizontal: number[] } = {
      vertical: verticalGuidePositions,
      horizontal: horizontalGuidePositions
    };

    setAlignmentGuides(prev => {
      const verticalChanged = prev.vertical.length !== nextGuides.vertical.length || prev.vertical[0] !== nextGuides.vertical[0];
      const horizontalChanged = prev.horizontal.length !== nextGuides.horizontal.length || prev.horizontal[0] !== nextGuides.horizontal[0];
      if (verticalChanged || horizontalChanged) {
        return nextGuides;
      }
      return prev;
    });

    ensureSnapOffsets(layerId);
    const snapX = bestVerticalDiff ?? 0;
    const snapY = bestHorizontalDiff ?? 0;
    snapOffsets[layerId].x.setValue(snapX);
    snapOffsets[layerId].y.setValue(snapY);
    snapOffsetsLatest.current[layerId] = { x: snapX, y: snapY };
  }, [canvasHeight, canvasWidth, ensureSnapOffsets, layers, snapOffsets, visibleFields]);

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
        console.log('⚠️ No user ID available');
        setShowConnectionErrorModal(true);
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
        console.log('⚠️ No user-specific business profiles found');
        setShowConnectionErrorModal(true);
      }
    } catch (error) {
      console.error('Error fetching user-specific business profiles:', error);
      setShowConnectionErrorModal(true);
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Apply business profile data to poster
  const applyBusinessProfileToPoster = (profile: BusinessProfile) => {
    setSelectedBusinessProfile(profile);
    setShowProfileSelectionModal(false);
    
    // Clear original layers when changing business profile so new positions become the baseline
    setOriginalLayers([]);
    console.log('🔄 [APPLY BUSINESS PROFILE] Cleared original layers for new profile:', profile.name);
    
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
        'Modern': 'business',
        'Vintage': 'vintage',
        'Retro': 'retro',
        'Elegant': 'elegant',
        'Bold': 'creative',
        'Nature': 'restaurant',
        'Ocean': 'ocean',
        'Sunset': 'sunset',
        'Cosmic': 'tech',
        'Artistic': 'artistic',
        'Sport': 'fitness',
        'Warm': 'sunset',
        'Cool': 'education',
      };
      
      const template = categoryToTemplate[profile.category] || 'business';
      setSelectedTemplate(template);
      console.log(`Auto-setting template to '${template}' based on business category '${profile.category}'`);
    }
    
    // Generate content from business profile
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

    // Create professional footer with contact information (3 lines)
    const contactLineHeight = isTabletDevice ? 20 : 16;
    const footerPadding = 10; // Top and bottom padding
    const footerHeight = (contactLineHeight * 3) + (footerPadding * 2); // 3 lines + padding
    const footerY = canvasHeight - footerHeight;
    
    // Responsive font sizes for footer elements
    const getResponsiveFooterFontSize = (baseSize: number) => {
      const scaleFactor = Math.min(canvasWidth / 400, canvasHeight / 600); // Scale based on canvas size
      return Math.max(baseSize * scaleFactor, baseSize * 0.8); // Minimum 80% of base size
    };
    
    const footerTextSize = getResponsiveFooterFontSize(isTabletDevice ? 14 : 11);
    
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

    // Contact information in two columns (positions based on user's manual placement)
    // For 720x487 canvas: scaled positions
    const scaleX = canvasWidth / 720;
    const scaleY = canvasHeight / 487.2;
    
    const leftColumnX = Math.round(20 * scaleX);
    const rightColumnX = Math.round(370 * scaleX);

    // Left column - Phone and Email
    if (profile.phone) {
      const phoneLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: `📞 ${profile.phone}`,
        // Position set to X: 419.2, Y: 501.0 (for 560x560 canvas)
        // Base values: 539.3 for X, 436.0 for Y (calculated from target position)
        position: { x: 539.3 * scaleX, y: 436.0 * scaleY },
        size: { width: (canvasWidth - 40) / 2, height: contactLineHeight },
        rotation: 0,
        zIndex: 10,
        fieldType: 'phone',
        style: {
          fontSize: footerTextSize,
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
        position: { x: leftColumnX, y: Math.round(443 * scaleY) },
        size: { width: (canvasWidth - 40) / 2, height: contactLineHeight },
        rotation: 0,
        zIndex: 10,
        fieldType: 'email',
        style: {
          fontSize: footerTextSize,
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
      };
      newLayers.push(emailLayer);
    }

    // Right column - Website and Category
    if (profile.website) {
      const websiteLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: `🌐 ${profile.website}`,
        position: { x: Math.round(12 * scaleX), y: Math.round(423 * scaleY) },
        size: { width: (canvasWidth - 40) / 2, height: contactLineHeight },
        rotation: 0,
        zIndex: 10,
        fieldType: 'website',
        style: {
          fontSize: footerTextSize,
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
        position: { x: Math.round(225 * scaleX), y: Math.round(446 * scaleY) },
        size: { width: (canvasWidth - 40) / 2, height: contactLineHeight },
        rotation: 0,
        zIndex: 10,
        fieldType: 'category',
        style: {
          fontSize: footerTextSize,
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
      };
      newLayers.push(categoryLayer);
    }

    // Address on line 3
    if (profile.address) {
      const addressLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: `📍 ${profile.address}`,
        position: { x: Math.round(434 * scaleX), y: Math.round(426 * scaleY) },
        size: { width: (canvasWidth - 40) / 2, height: contactLineHeight },
        rotation: 0,
        zIndex: 10,
        fieldType: 'address',
        style: {
          fontSize: footerTextSize,
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
      };
      newLayers.push(addressLayer);
    }

    // Services - positioned below the 3-line footer if needed
    if (profile.services && profile.services.length > 0) {
      const servicesText = profile.services.slice(0, 3).join(' • ');
      const servicesLayer: Layer = {
        id: generateId(),
        type: 'text',
        content: `🛠️ ${servicesText}${profile.services.length > 3 ? '...' : ''}`,
        position: { x: leftColumnX, y: Math.round(464 * scaleY) },
        size: { width: canvasWidth - 40, height: contactLineHeight },
        rotation: 0,
        zIndex: 10,
        fieldType: 'services',
        style: {
          fontSize: Math.max(isTabletDevice ? 12 : 9, footerTextSize),
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
  const getLayerEffectiveSize = useCallback((layer: Layer) => {
    if (layer.type === 'text') {
      const fontSize = layer.style?.fontSize ?? 16;
      const contentLength = layer.content?.length ?? 1;
      const estimatedWidth = Math.min(canvasWidth, Math.max(fontSize, contentLength * fontSize * 0.55));
      const estimatedHeight = Math.min(canvasHeight, fontSize * 1.3);
      return {
        width: estimatedWidth,
        height: estimatedHeight
      };
    }
    return {
      width: layer.size?.width ?? 0,
      height: layer.size?.height ?? 0,
    };
  }, [canvasWidth, canvasHeight]);

  const onPanGestureEvent = useCallback((layerId: string) => {
    // Ensure translation values exist for this layer
    if (!translationValues[layerId]) {
      translationValues[layerId] = {
        x: new Animated.Value(0),
        y: new Animated.Value(0)
      };
    }
    ensureSnapOffsets(layerId);
    
    return Animated.event(
      [{ nativeEvent: { translationX: translationValues[layerId].x, translationY: translationValues[layerId].y } }],
      { 
        useNativeDriver: true,
        listener: (event: any) => {
          const { translationX, translationY } = event.nativeEvent;
          
          // Get current layer
          const currentLayer = layers.find(layer => layer.id === layerId);
          if (!currentLayer) return;
          
          // Get element dimensions
          const { width: elementWidth, height: elementHeight } = getLayerEffectiveSize(currentLayer);
          const effectiveWidth = elementWidth || 0;
          const effectiveHeight = elementHeight || 0;
          
          // Calculate new position (current position + translation)
          let newX = currentLayer.position.x + translationX;
          let newY = currentLayer.position.y + translationY;
          
          // Clamp positions so the entire element remains inside the canvas
          const maxX = Math.max(0, canvasWidth - effectiveWidth);
          const maxY = Math.max(0, canvasHeight - effectiveHeight);
          newX = Math.max(0, Math.min(newX, maxX));
          newY = Math.max(0, Math.min(newY, maxY));
          newX = Number.isFinite(newX) ? newX : 0;
          newY = Number.isFinite(newY) ? newY : 0;
          
          // Calculate clamped translation (new position - original position)
          const clampedTranslationX = newX - currentLayer.position.x;
          const clampedTranslationY = newY - currentLayer.position.y;
          
          // Update animated values with clamped translations
          translationValues[layerId].x.setValue(clampedTranslationX);
          translationValues[layerId].y.setValue(clampedTranslationY);
          dragTranslationRef.current[layerId] = { x: clampedTranslationX, y: clampedTranslationY };
          
          // Update alignment guides with clamped values
          if (alignmentFrameRef.current) {
            cancelAnimationFrame(alignmentFrameRef.current);
          }
          alignmentFrameRef.current = requestAnimationFrame(() => {
            alignmentFrameRef.current = null;
            updateAlignmentGuides(layerId, clampedTranslationX, clampedTranslationY);
          });
        }
      }
    );
  }, [alignmentFrameRef, canvasHeight, canvasWidth, ensureSnapOffsets, getLayerEffectiveSize, layers, translationValues, updateAlignmentGuides]);

  // Handle pan gesture state changes
  const onHandlerStateChange = useCallback((layerId: string) => {
    return (event: any) => {
      if (event.nativeEvent.state === State.BEGAN) {
        ensureSnapOffsets(layerId);
        snapOffsetsLatest.current[layerId] = { x: 0, y: 0 };
        clearAlignmentGuides(layerId);
        setDraggedLayer(layerId);
        setSelectedLayer(layerId);
        // Reset translation values when drag begins
        if (translationValues[layerId]) {
          translationValues[layerId].x.setValue(0);
          translationValues[layerId].y.setValue(0);
        }
      } else if (event.nativeEvent.state === State.END) {
        // Get current layer
        const currentLayer = layers.find(layer => layer.id === layerId);
        if (!currentLayer) return;
        
        // Get clamped translation values (already clamped during drag)
        const clampedTranslation = dragTranslationRef.current[layerId] || { x: 0, y: 0 };
        const clampedTranslationX = clampedTranslation.x;
        const clampedTranslationY = clampedTranslation.y;
        const snapOffset = snapOffsetsLatest.current[layerId] || { x: 0, y: 0 };
        
        // Get element dimensions
        const { width: elementWidth, height: elementHeight } = getLayerEffectiveSize(currentLayer);
        const effectiveWidth = elementWidth || 0;
        const effectiveHeight = elementHeight || 0;
        
        // Calculate new position (current position + clamped translation + snap offset)
        let newX = currentLayer.position.x + clampedTranslationX + snapOffset.x;
        let newY = currentLayer.position.y + clampedTranslationY + snapOffset.y;
        
        // Final clamp to ensure element stays within canvas bounds
        const maxX = Math.max(0, canvasWidth - effectiveWidth);
        const maxY = Math.max(0, canvasHeight - effectiveHeight);
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        newX = Number.isFinite(newX) ? newX : 0;
        newY = Number.isFinite(newY) ? newY : 0;
        
        // Debug: Log the current position and field type
        console.log(`🎯 DEBUG: ${currentLayer.fieldType || 'Unknown Field'} moved to position:`);
        console.log(`   📍 X: ${newX.toFixed(1)}, Y: ${newY.toFixed(1)}`);
        console.log(`   📏 Canvas Size: ${canvasWidth}x${canvasHeight}`);
        console.log(`   🏷️ Field Type: ${currentLayer.fieldType || 'Unknown'}`);
        console.log(`   📝 Content: ${currentLayer.content || 'No content'}`);
        console.log(`   🔧 Position: x: ${newX.toFixed(0)}, y: ${newY.toFixed(0)}`);
        
        // Update the animated position values directly
        if (layerAnimations[layerId]) {
          layerAnimations[layerId].x.setValue(newX);
          layerAnimations[layerId].y.setValue(newY);
        }
        dragTranslationRef.current[layerId] = { x: 0, y: 0 };
        
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
        clearAlignmentGuides(layerId);
        
        setDraggedLayer(null);
      }
    };
  }, [canvasHeight, canvasWidth, clearAlignmentGuides, dragTranslationRef, ensureSnapOffsets, getLayerEffectiveSize, layerAnimations, layers, translationValues]);

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
          color: '#FFFFFF',
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
    try {
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
        saveToPhotos: false,
      };

      const result = await launchCamera(options);
      
      // User cancelled
      if (result.didCancel) {
        console.log('User cancelled camera');
        return;
      }
      
      // Error occurred
      if (result.errorCode) {
        console.error('Camera error code:', result.errorCode);
        Alert.alert('Camera Error', result.errorMessage || 'Failed to access camera');
        return;
      }
      
      // Success - process image
      if (result.assets && result.assets[0] && result.assets[0].uri) {
        const imageUri = result.assets[0].uri;
        console.log('✅ Camera image captured:', imageUri);
        addLogoLayerFromImage(imageUri);
      } else {
        console.warn('No image URI in camera result');
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      Alert.alert('Error', 'Failed to access camera. Please try again.');
    }
  };

  // Handle gallery access
  const handleGalleryAccess = async () => {
    try {
      const options = {
        mediaType: 'photo' as const,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8 as const,
        selectionLimit: 1,
      };

      const result = await launchImageLibrary(options);
      
      // User cancelled
      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      
      // Error occurred
      if (result.errorCode) {
        console.error('Gallery error code:', result.errorCode);
        Alert.alert('Gallery Error', result.errorMessage || 'Failed to access gallery');
        return;
      }
      
      // Success - process image
      if (result.assets && result.assets[0] && result.assets[0].uri) {
        const imageUri = result.assets[0].uri;
        console.log('✅ Gallery image selected:', imageUri);
        addLogoLayerFromImage(imageUri);
      } else {
        console.warn('No image URI in gallery result');
      }
    } catch (error) {
      console.error('❌ Gallery error:', error);
      Alert.alert('Error', 'Failed to access gallery. Please try again.');
    }
  };

  // Add logo layer from image
  const addLogoLayerFromImage = useCallback((imageUri: string) => {
    try {
      const layerId = generateId();
      const newLayer: Layer = {
        id: layerId,
        type: 'logo',
        content: imageUri,
        position: { x: 20, y: 20 },
        size: { width: 80, height: 80 },
        rotation: 0,
        zIndex: layers.length,
        fieldType: 'logo',
      };
      
      // Initialize animated values for the new layer
      if (!layerAnimations[layerId]) {
        layerAnimations[layerId] = {
          x: new Animated.Value(20),
          y: new Animated.Value(20)
        };
      }
      
      if (!translationValues[layerId]) {
        translationValues[layerId] = {
          x: new Animated.Value(0),
          y: new Animated.Value(0)
        };
      }
      
      if (!scaleValues[layerId]) {
        scaleValues[layerId] = new Animated.Value(1);
      }
      
      setLayers(prev => [...prev, newLayer]);
      setShowLogoModal(false);
      console.log('✅ Logo layer added from image:', imageUri);
    } catch (error) {
      console.error('❌ Error adding logo layer:', error);
      Alert.alert('Error', 'Failed to add logo. Please try again.');
    }
  }, [layers.length, layerAnimations, translationValues, scaleValues]);

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

  // Helper to apply template styles to layers
  const applyTemplateStylesToLayers = useCallback((templateType: string, layersToStyle: Layer[]): Layer[] => {
    return layersToStyle.map(layer => {
      if (layer.fieldType === 'footerBackground') {
        const templateStyle = TEMPLATE_FOOTER_STYLES[templateType] || TEMPLATE_FOOTER_STYLES['business'];
        return {
          ...layer,
          style: {
            ...layer.style,
            backgroundColor: templateStyle.backgroundColor
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
          'vintage': '#ffffff',
          'retro': '#ffffff',
          'elegant': '#ffffff',
          'tech': '#00ff00',
          'ocean': '#ffffff',
          'sunset': '#ffffff',
          'artistic': '#ffffff',
          'ombre-sunset': '#ffffff',
          'ombre-ocean': '#ffffff',
          'ombre-purple': '#ffffff',
          'ombre-forest': '#ffffff',
          'ombre-fire': '#ffffff',
          'ombre-night': '#ffffff',
          'ombre-tropical': '#ffffff',
          'ombre-autumn': '#ffffff',
          'ombre-rose': '#ffffff',
          'ombre-galaxy': '#ffffff',
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
    });
  }, []);

  // Apply template to poster
  const applyTemplate = useCallback((templateType: string) => {
    
    setSelectedTemplate(templateType);
    setShowTemplatesModal(false);
    
    // Clear original layers when changing templates so new positions can be stored
    setOriginalLayers([]);
    console.log('🔄 [APPLY TEMPLATE] Cleared original layers for new template:', templateType);
    
    // Apply different poster layouts and styles based on template
    setLayers(prev => applyTemplateStylesToLayers(templateType, prev));
  }, [applyTemplateStylesToLayers]);

  useEffect(() => {
    if (!initialTemplateApplied && layers.length > 0) {
      const defaultTemplate = TEMPLATE_OPTIONS[0]?.id || 'business';
      setInitialTemplateApplied(true);
      applyTemplate(defaultTemplate);
    }
  }, [applyTemplate, initialTemplateApplied, layers.length]);

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
    if (snapOffsets[layerId]) {
      delete snapOffsets[layerId];
    }
    if (snapOffsetsLatest.current[layerId]) {
      delete snapOffsetsLatest.current[layerId];
    }
    setSelectedLayer(null);
  }, [snapOffsets]);

  // Confirm delete element
  const confirmDeleteElement = useCallback(() => {
    if (selectedLayer) {
      deleteLayer(selectedLayer);
      setShowDeleteElementModal(false);
    }
  }, [selectedLayer, deleteLayer]);


  // Apply font style
  const applyFontStyle = useCallback((fontFamily: string) => {
    const actualFontFamily = getFontFamily(fontFamily);
    setLayers(prev => prev.map(layer => {
      // Only apply to selected layer if one is selected, otherwise apply to all text layers
      if (layer.type === 'text') {
        if (selectedLayer && layer.id === selectedLayer) {
          return { ...layer, style: { ...layer.style, fontFamily: actualFontFamily, fontSize: selectedFontSize } };
        } else if (!selectedLayer) {
          return { ...layer, style: { ...layer.style, fontFamily: actualFontFamily } };
        }
      }
      return layer;
    }));
    // Modal stays open so user can continue trying different fonts
  }, [selectedLayer, selectedFontSize, getFontFamily]);
  
  // Apply font size (selected layer or all text when none selected)
  const applyFontSize = useCallback((fontSize: number) => {
    setSelectedFontSize(fontSize);
    setLayers(prev => prev.map(layer => {
      if (layer.type !== 'text') {
        return layer;
      }
      if (selectedLayer) {
        return layer.id === selectedLayer
          ? { ...layer, style: { ...layer.style, fontSize } }
          : layer;
      }
      return { ...layer, style: { ...layer.style, fontSize } };
    }));
  }, [selectedLayer]);
  
  // Update selectedFontSize when a layer is selected
  useEffect(() => {
    if (selectedLayer) {
      const layer = layers.find(l => l.id === selectedLayer);
      if (layer && layer.type === 'text' && layer.style?.fontSize) {
        setSelectedFontSize(layer.style.fontSize);
      }
    }
  }, [selectedLayer, layers]);

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
    
    // Initialize borderRadius animated value for logos
    if (layer.type === 'logo' && !borderRadiusValues[layer.id]) {
      const initialRadius = layer.isCircular 
        ? Math.min(layer.size.width, layer.size.height) / 2 
        : 0;
      borderRadiusValues[layer.id] = new Animated.Value(initialRadius);
      selectionBorderRadiusValues[layer.id] = new Animated.Value(initialRadius + 3);
    }
    
    ensureSnapOffsets(layer.id);

    const baseTransforms = [
      { translateX: Animated.add(Animated.add(layerAnimations[layer.id].x, translationValues[layer.id].x), snapOffsets[layer.id].x) },
      { translateY: Animated.add(Animated.add(layerAnimations[layer.id].y, translationValues[layer.id].y), snapOffsets[layer.id].y) },
      { rotate: `${layer.rotation}deg` }
    ];

    const layerStyle = {
      position: 'absolute' as const,
      width: layer.size.width,
      height: layer.size.height,
      zIndex: layer.zIndex,
      transform: baseTransforms,
    };
    
    // Text layer style without fixed dimensions
    const textLayerStyle = {
      position: 'absolute' as const,
      zIndex: layer.zIndex,
      transform: baseTransforms,
      width: layer.size?.width ?? 'auto',
      minWidth: 10,
      maxWidth: layer.size?.width ?? '100%',
    };

    const handleLayerPress = () => {
      setSelectedLayer(layer.id);
      // Toggle circular/square shape for logos with smooth animation
      if (layer.type === 'logo') {
        const newIsCircular = !layer.isCircular;
        const targetRadius = newIsCircular 
          ? Math.min(layer.size.width, layer.size.height) / 2 
          : 0;
        
        // Initialize borderRadius value if it doesn't exist
        if (!borderRadiusValues[layer.id]) {
          const currentRadius = layer.isCircular 
            ? Math.min(layer.size.width, layer.size.height) / 2 
            : 0;
          borderRadiusValues[layer.id] = new Animated.Value(currentRadius);
          selectionBorderRadiusValues[layer.id] = new Animated.Value(currentRadius + 3);
        }
        
        // Animate the borderRadius change
        const targetSelectionRadius = targetRadius + 3;
        Animated.parallel([
          Animated.timing(borderRadiusValues[layer.id], {
            toValue: targetRadius,
            duration: 300,
            useNativeDriver: false, // borderRadius doesn't support native driver
          }),
          Animated.timing(selectionBorderRadiusValues[layer.id], {
            toValue: targetSelectionRadius,
            duration: 300,
            useNativeDriver: false,
          })
        ]).start();
        
        setLayers(prev => prev.map(l => 
          l.id === layer.id ? { ...l, isCircular: newIsCircular } : l
        ));
      }
    };

    switch (layer.type) {
      case 'text':
        // Special handling for footer background
        if (layer.content === '' && layer.fieldType === 'footerBackground') {
          // Check if it's an ombre template (horizontal gradient)
          const isOmbreTemplate = selectedTemplate?.startsWith('ombre-');
          let gradientColors;
          let gradientStart;
          let gradientEnd;
          
          if (isOmbreTemplate) {
            // Horizontal gradient for ombre templates
            const ombreGradients: { [key: string]: string[] } = {
              'ombre-sunset': ['#FF6B6B', '#FFA500', '#FFD700'],
              'ombre-ocean': ['#667eea', '#06b6d4', '#22c55e'],
              'ombre-purple': ['#9333ea', '#ec4899', '#f43f5e'],
              'ombre-forest': ['#065f46', '#059669', '#10b981'],
              'ombre-fire': ['#dc2626', '#f59e0b', '#fbbf24'],
              'ombre-night': ['#1e3a8a', '#7c3aed', '#ec4899'],
              'ombre-tropical': ['#f472b6', '#fb923c', '#06b6d4'],
              'ombre-autumn': ['#78350f', '#ea580c', '#dc2626'],
              'ombre-rose': ['#be123c', '#f472b6', '#fda4af'],
              'ombre-galaxy': ['#6366f1', '#8b5cf6', '#06b6d4'],
            };
            gradientColors = ombreGradients[selectedTemplate] || getOmbreColors(layer.style?.backgroundColor as string | undefined);
            gradientStart = { x: 0, y: 0 };
            gradientEnd = { x: 1, y: 0 };
          } else {
            // Vertical gradient for non-ombre templates
            gradientColors = getOmbreColors(layer.style?.backgroundColor as string | undefined);
            gradientStart = { x: 0, y: 1 };
            gradientEnd = { x: 0, y: 0 };
          }
          
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
                  borderRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  transform: [
                    { translateX: layerAnimations[layer.id].x },
                    { translateY: layerAnimations[layer.id].y }
                  ],
                }
              ]}
            >
              <LinearGradient
                colors={gradientColors}
                start={gradientStart}
                end={gradientEnd}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
            </Animated.View>
          );
        }
        
        return (
          <Animated.View
            key={layer.id}
            style={[
              textLayerStyle,
              draggedLayer === layer.id && styles.draggedLayer
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleLayerPress}
              style={{ alignSelf: 'flex-start' }}
            >
              <Text style={{
                fontSize: layer.style?.fontSize,
                color: layer.style?.color,
                fontFamily: layer.style?.fontFamily,
                fontWeight: layer.style?.fontWeight as any,
                padding: 0,
                margin: 0,
                flexWrap: 'wrap',
                width: '100%',
              }}>
                {layer.content}
              </Text>
            </TouchableOpacity>
            {isSelected && (
              <View
                style={{
                  position: 'absolute',
                  top: -3,
                  left: -3,
                  right: -3,
                  bottom: -3,
                  borderWidth: 3,
                  borderColor: '#667eea',
                  borderRadius: 8,
                  pointerEvents: 'none',
                }}
              />
            )}
          </Animated.View>
        );
      case 'image':
      case 'logo':
        // Use animated borderRadius for logos, static for images
        const animatedBorderRadius = layer.type === 'logo' && borderRadiusValues[layer.id]
          ? borderRadiusValues[layer.id]
          : 0;
        
        // Selection border radius (borderRadius + 3 for logos)
        const animatedSelectionBorderRadius = layer.type === 'logo' && selectionBorderRadiusValues[layer.id]
          ? selectionBorderRadiusValues[layer.id]
          : 8;
        
        return (
          <Animated.View
            style={[
              styles.layer,
              layerStyle,
              draggedLayer === layer.id && styles.draggedLayer
            ]}
          >
            <Animated.View
              style={[
                styles.layerTouchable,
                { 
                  overflow: 'hidden',
                  borderRadius: layer.type === 'logo' ? animatedBorderRadius : 0
                }
              ]}
            >
              <TouchableOpacity
                style={{ width: '100%', height: '100%' }}
                onPress={handleLayerPress}
                activeOpacity={0.9}
              >
                <Animated.Image
                  source={{ uri: layer.content }}
                  style={[
                    styles.layerImage,
                    { 
                      borderRadius: layer.type === 'logo' ? animatedBorderRadius : 0
                    }
                  ]}
                  resizeMode={layer.type === 'logo' ? "cover" : "contain"}
                />
              </TouchableOpacity>
            </Animated.View>
            {isSelected && (
              <Animated.View
                style={{
                  position: 'absolute',
                  top: -3,
                  left: -3,
                  right: -3,
                  bottom: -3,
                  borderWidth: 3,
                  borderColor: '#667eea',
                  borderRadius: layer.type === 'logo' ? animatedSelectionBorderRadius : 8,
                  pointerEvents: 'none',
                }}
              />
            )}
          </Animated.View>
        );
      default:
        return null;
    }
  }, [selectedLayer, visibleFields, draggedLayer, layerAnimations, translationValues, selectedTemplate, ensureSnapOffsets, snapOffsets]);

  // Render business profile selection item
  const renderProfileItem = ({ item }: { item: BusinessProfile }) => {
    return (
      <TouchableOpacity
        style={themeStyles.profileItem}
        onPress={() => handleProfileSelection(item)}
      >
        <View style={styles.profileItemContent}>
          {item.companyLogo || item.logo ? (
            <Image
              source={{ uri: item.companyLogo || item.logo }}
              style={themeStyles.profileLogo}
              resizeMode="cover"
            />
          ) : (
            <View style={themeStyles.profileLogoPlaceholder}>
              <Icon name="business" size={dynamicModerateScale(16)} color="#667eea" />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={themeStyles.profileName}>{item.name}</Text>
            <Text style={themeStyles.profileCategory}>{item.category}</Text>
            <Text style={themeStyles.profileDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </View>
        <Icon name="chevron-right" size={dynamicModerateScale(16)} color="#666666" />
      </TouchableOpacity>
    );
  };

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
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      
      {/* Professional Header */}
      <View
        style={[styles.header, { 
          paddingTop: insets.top + moderateScale(8),
          backgroundColor: theme?.colors?.surface || '#ffffff'
        }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[theme.colors.secondary, theme.colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.backButtonGradient}
        >
          <Text style={styles.backButtonText}>Back</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.headerContent}>
        </View>
        <TouchableOpacity 
          style={styles.nextButton}
          activeOpacity={0.85}
          onPress={async () => {
            // Check subscription status first
            if (!isSubscribed) {
              console.log('User is not subscribed - showing premium modal');
              setShowPremiumModal(true);
              return;
            }

            // Deselect any selected or dragged layers so borders don't appear in preview
            setSelectedLayer(null);
            setDraggedLayer(null);
            // Allow a brief tick for UI to update before capture
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Test capture first
            console.log('=== TESTING VIEWSHOT CAPTURE ===');
            console.log('Canvas dimensions - Hidden:', { width: screenWidth * 0.98, height: screenHeight * 0.65 });
            console.log('Canvas dimensions - Visible:', { width: screenWidth * 0.98, height: screenHeight * 0.65 });
            console.log('Layers count:', layers.length);
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
            const hasVisibleCustomLayers = layers.some(layer => {
              if (layer.fieldType === 'footerBackground') return false;
              if (layer.fieldType && visibleFields[layer.fieldType] === false) return false;
              return true;
            });
            const visibleTextFields = TEXT_FIELD_KEYS.filter(key => visibleFields[key] !== false);
            const missingTextForVisibleFields = visibleTextFields.length > 0 && visibleTextFields.every(fieldKey => {
              const textLayer = layers.find(layer => 
                layer.type === 'text' &&
                layer.fieldType === fieldKey &&
                visibleFields[fieldKey] !== false &&
                !!layer.content?.trim()
              );
              return !textLayer;
            });
            const shouldForceWatermark = !hasVisibleCustomLayers || missingTextForVisibleFields;
            setForceWatermarkCapture(shouldForceWatermark);
            
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
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Capture the visible canvas as an image
                const uri = await visibleCanvasRef.current.capture();
                console.log('Visible canvas captured successfully!');
                console.log('Captured URI length:', uri?.length);
                console.log('Captured URI starts with:', uri?.substring(0, 50));
                
                // Set capturing state back to false
                setIsCapturing(false);
                setForceWatermarkCapture(false);
                
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
                setForceWatermarkCapture(false);
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
              setForceWatermarkCapture(false);
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
          <LinearGradient
            colors={[theme.colors.secondary, theme.colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

                        {/* Canvas Container */}
          <View style={styles.canvasContainer}>
            {/* ViewShot wrapper for capturing the visible canvas */}
            <ViewShot
              ref={visibleCanvasRef}
              style={[styles.viewShotContainer, { width: canvasWidth, height: canvasHeight, backgroundColor: 'transparent' }]}
              options={{
                format: 'png',
                quality: 1.0,
                result: 'tmpfile'
              }}
            >
              {/* Visible Canvas for editing */}
              <TouchableWithoutFeedback onPress={() => setSelectedLayer(null)}>
              <View style={[
                styles.canvas,
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
                selectedTemplate === 'vintage' && styles.vintageFrame,
                selectedTemplate === 'retro' && styles.retroFrame,
                selectedTemplate === 'elegant' && styles.elegantFrame,
                selectedTemplate === 'tech' && styles.techFrame,
                selectedTemplate === 'ocean' && styles.oceanFrame,
                selectedTemplate === 'sunset' && styles.sunsetFrame,
                selectedTemplate === 'artistic' && styles.artisticFrame,
                selectedTemplate === 'ombre-sunset' && styles.ombreSunsetFrame,
                selectedTemplate === 'ombre-ocean' && styles.ombreOceanFrame,
                selectedTemplate === 'ombre-purple' && styles.ombrePurpleFrame,
                selectedTemplate === 'ombre-forest' && styles.ombreForestFrame,
                selectedTemplate === 'ombre-fire' && styles.ombreFireFrame,
                selectedTemplate === 'ombre-night' && styles.ombreNightFrame,
                selectedTemplate === 'ombre-tropical' && styles.ombreTropicalFrame,
                selectedTemplate === 'ombre-autumn' && styles.ombreAutumnFrame,
                selectedTemplate === 'ombre-rose' && styles.ombreRoseFrame,
                selectedTemplate === 'ombre-galaxy' && styles.ombreGalaxyFrame,
                { 
                  width: canvasWidth, 
                  height: canvasHeight,
                  backgroundColor: '#ffffff'
                },
              ]}
>
          {/* Background Image (always show the poster image) */}
          <View style={styles.backgroundImageContainer}>
            <Image
              source={{ uri: getHighQualityImageUrl(selectedImage.uri), cache: 'force-cache' }}
              style={styles.backgroundImage}
              resizeMode="contain"
            />
          </View>
          
          
          {/* Layers - rendered AFTER frame so they appear on top */}
          {layers.map((layer) => {
            if (layer.fieldType === 'footerBackground') {
              return (
                <View key={layer.id} pointerEvents="none">
                  {renderLayer(layer)}
                </View>
              );
            }
            return (
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
            );
          })}

          {alignmentGuides.vertical.map((xPos, index) => (
            <View
              key={`alignment-vertical-${index}`}
              pointerEvents="none"
              style={[
                styles.alignmentGuideVertical,
                {
                  left: xPos - 0.5,
                  height: canvasHeight
                }
              ]}
            />
          ))}
          
          {alignmentGuides.horizontal.map((yPos, index) => (
            <View
              key={`alignment-horizontal-${index}`}
              pointerEvents="none"
              style={[
                styles.alignmentGuideHorizontal,
                {
                  top: yPos - 0.5,
                  width: canvasWidth
                }
              ]}
            />
          ))}
          
          {/* Watermark Overlay - full screen transparent logo */}
          {isCapturing && (!checkPremiumAccess('poster_export') || forceWatermarkCapture) && (
            <View style={styles.fullscreenWatermarkOverlay}>
              <Image
                source={require('../assets/MainLogo/MB.png')}
                style={styles.fullscreenWatermarkImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
              </TouchableWithoutFeedback>
            </ViewShot>
          
          
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
        
        
        {/* Controls Container - Fixed layout with responsive heights */}
        <View 
          style={[
            styles.controlsContainer, 
            { 
              paddingBottom: isUltraSmallScreen 
                ? insets.bottom + 20 
                : isSmallScreen 
                  ? insets.bottom + 16 
                  : Math.max(insets.bottom + responsiveSpacing.md, responsiveSpacing.lg)
            }
          ]}
        >
        
        {/* Toolbar Below Canvas */}
        <View style={styles.bottomToolbar}>
          <ScrollView 
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarScrollContent}
          >
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
                onPress={() => setShowDeleteElementModal(true)}
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
          </ScrollView>
          </View>
        
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
              style={[styles.fieldToggleButton, visibleFields.footerBackground && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('footerBackground')}
            >
              <Icon name="format-color-fill" size={getResponsiveIconSize()} color={visibleFields.footerBackground ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.footerBackground && styles.fieldToggleButtonTextActive]}>
                Footer BG
              </Text>
            </TouchableOpacity>
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
          </ScrollView>
        </View>
        
        {/* Templates Section */}
        <View style={styles.templatesSection}>
          <View style={styles.templatesHeader}>
            <Text style={styles.templatesTitle}>Templates</Text>
          </View>
          <ScrollView
            style={styles.templatesContent}
            horizontal
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.templatesScrollContent}
          >
            {TEMPLATE_OPTIONS.map(option => {
              const templateStyle = TEMPLATE_FOOTER_STYLES[option.id];
              const isSelected = selectedTemplate === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.templateButton, isSelected && styles.templateButtonActive]}
                  onPress={() => applyTemplate(option.id)}
                >
                  <View style={styles.templatePreview}>
                    <View style={styles.templatePreviewContent}>
                      {templateStyle?.gradient ? (
                        <LinearGradient
                          colors={templateStyle.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.templatePreviewFooter, { backgroundColor: 'transparent' }]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.templatePreviewFooter,
                            { backgroundColor: templateStyle?.backgroundColor || 'rgba(102, 126, 234, 0.9)' }
                          ]}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
              placeholderTextColor="#999999"
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
              placeholderTextColor="#999999"
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
        animationType="fade"
        onRequestClose={() => setShowFontStyleModal(false)}
      >
        <View style={styles.fontModalRoot}>
          <TouchableWithoutFeedback onPress={() => setShowFontStyleModal(false)}>
            <View style={[
              styles.fontModalBackdrop,
              { top: fontModalTopOffset }
            ]} />
          </TouchableWithoutFeedback>
          <View style={[
            styles.fontModalWrapper,
            { top: fontModalTopOffset }
          ]}>
            <View style={[
              styles.fontModalContent,
              {
                width: fontModalWidth,
                height: fontModalMaxHeight
              }
            ]}>
            {/* Modal Header */}
            <View style={styles.fontModalHeader}>
              <View>
                <Text style={styles.modalTitle}>Font & Size</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedLayer ? 'Customize selected text' : 'Choose a font style'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.fontModalCloseButton}
                onPress={() => setShowFontStyleModal(false)}
              >
                <Icon name="close" size={getResponsiveIconSize()} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {/* Scrollable Content Container */}
            <ScrollView 
              style={styles.fontModalScrollView}
              contentContainerStyle={styles.fontModalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {/* Font Size Controls */}
              <View style={styles.fontSizeControlsContainer}>
                <View style={styles.fontSizeHeader}>
                  <Icon name="format-size" size={getResponsiveIconSize()} color="#667eea" />
                  <View style={styles.fontSizeHeaderTextGroup}>
                    <Text style={styles.fontSizeLabel}>Font Size</Text>
                    {!selectedLayer && (
                      <Text style={styles.fontSizeHelperText}>No layer selected — applies to all text</Text>
                    )}
                  </View>
                </View>
                <View style={styles.fontSizeButtons}>
                  {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48].map(size => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.fontSizeButton,
                        selectedFontSize === size && styles.fontSizeButtonActive
                      ]}
                      onPress={() => applyFontSize(size)}
                    >
                      <Text style={[
                        styles.fontSizeButtonText,
                        selectedFontSize === size && styles.fontSizeButtonTextActive
                      ]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Font Family Section */}
              <View style={styles.fontFamilySection}>
                <View style={styles.fontFamilySectionHeader}>
                  <Icon name="font-download" size={getResponsiveIconSize()} color="#667eea" />
                  <Text style={styles.fontFamilySectionTitle}>Font Family</Text>
                </View>
              </View>
              {/* System Fonts Category */}
              <View style={styles.fontCategorySection}>
                <Text style={styles.fontCategoryTitle}>System Fonts</Text>
                <View style={styles.fontCategoryGrid}>
                  <TouchableOpacity
                    style={styles.fontOptionButton}
                    onPress={() => applyFontStyle(SYSTEM_FONTS.default)}
                  >
                    <Text style={[styles.fontPreviewText, { fontFamily: SYSTEM_FONTS.default }]}>Aa</Text>
                    <Text style={styles.fontOptionName}>System</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.fontOptionButton}
                    onPress={() => applyFontStyle(SYSTEM_FONTS.serif)}
                  >
                    <Text style={[styles.fontPreviewText, { fontFamily: SYSTEM_FONTS.serif }]}>Aa</Text>
                    <Text style={styles.fontOptionName}>Serif</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.fontOptionButton}
                    onPress={() => applyFontStyle(SYSTEM_FONTS.monospace)}
                  >
                    <Text style={[styles.fontPreviewText, { fontFamily: SYSTEM_FONTS.monospace }]}>Aa</Text>
                    <Text style={styles.fontOptionName}>Monospace</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.fontOptionButton}
                    onPress={() => applyFontStyle(SYSTEM_FONTS.cursive)}
                  >
                    <Text style={[styles.fontPreviewText, { fontFamily: SYSTEM_FONTS.cursive }]}>Aa</Text>
                    <Text style={styles.fontOptionName}>Cursive</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.fontOptionButton}
                    onPress={() => applyFontStyle(SYSTEM_FONTS.fantasy)}
                  >
                    <Text style={[styles.fontPreviewText, { fontFamily: SYSTEM_FONTS.fantasy }]}>Aa</Text>
                    <Text style={styles.fontOptionName}>Fantasy</Text>
                  </TouchableOpacity>
                </View>
              </View>
                
              {/* Google Fonts - Sans-serif */}
              <View style={styles.fontCategorySection}>
                <Text style={styles.fontCategoryTitle}>Sans-Serif Fonts</Text>
                <View style={styles.fontCategoryGrid}>
                  {getFontsByCategory('sans-serif').slice(0, 6).map((font) => (
                    <TouchableOpacity
                      key={font.name}
                      style={styles.fontOptionButton}
                      onPress={() => applyFontStyle(font.name)}
                    >
                      <Text style={[styles.fontPreviewText, { fontFamily: getFontFamily(font.name) }]}>Aa</Text>
                      <Text style={styles.fontOptionName}>{font.displayName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
                
              {/* Google Fonts - Serif */}
              <View style={styles.fontCategorySection}>
                <Text style={styles.fontCategoryTitle}>Serif Fonts</Text>
                <View style={styles.fontCategoryGrid}>
                  {getFontsByCategory('serif').slice(0, 4).map((font) => (
                    <TouchableOpacity
                      key={font.name}
                      style={styles.fontOptionButton}
                      onPress={() => applyFontStyle(font.name)}
                    >
                      <Text style={[styles.fontPreviewText, { fontFamily: getFontFamily(font.name) }]}>Aa</Text>
                      <Text style={styles.fontOptionName}>{font.displayName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
                
              {/* Google Fonts - Display */}
              <View style={styles.fontCategorySection}>
                <Text style={styles.fontCategoryTitle}>Display Fonts</Text>
                <View style={styles.fontCategoryGrid}>
                  {getFontsByCategory('display').slice(0, 4).map((font) => (
                    <TouchableOpacity
                      key={font.name}
                      style={styles.fontOptionButton}
                      onPress={() => applyFontStyle(font.name)}
                    >
                      <Text style={[styles.fontPreviewText, { fontFamily: getFontFamily(font.name) }]}>Aa</Text>
                      <Text style={styles.fontOptionName}>{font.displayName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
                
              {/* Google Fonts - Handwriting */}
              <View style={styles.fontCategorySection}>
                <Text style={styles.fontCategoryTitle}>Handwriting Fonts</Text>
                <View style={styles.fontCategoryGrid}>
                  {getFontsByCategory('handwriting').slice(0, 4).map((font) => (
                    <TouchableOpacity
                      key={font.name}
                      style={styles.fontOptionButton}
                      onPress={() => applyFontStyle(font.name)}
                    >
                      <Text style={[styles.fontPreviewText, { fontFamily: getFontFamily(font.name) }]}>Aa</Text>
                      <Text style={styles.fontOptionName}>{font.displayName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
                
              {/* Google Fonts - Monospace */}
              <View style={styles.fontCategorySection}>
                <Text style={styles.fontCategoryTitle}>Monospace Fonts</Text>
                <View style={styles.fontCategoryGrid}>
                  {getFontsByCategory('monospace').slice(0, 2).map((font) => (
                    <TouchableOpacity
                      key={font.name}
                      style={styles.fontOptionButton}
                      onPress={() => applyFontStyle(font.name)}
                    >
                      <Text style={[styles.fontPreviewText, { fontFamily: getFontFamily(font.name) }]}>Aa</Text>
                      <Text style={styles.fontOptionName}>{font.displayName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remove Frame Confirmation Modal - DISABLED: Direct removal without confirmation */}
      {/* 
      <Modal
        visible={showRemoveFrameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRemoveFrameModal(false)}
      >
        <View style={[styles.modalOverlay, { paddingHorizontal: isLandscapeMode ? (isTabletDevice ? responsiveSpacing.lg : responsiveSpacing.md) : (isUltraSmallDevice ? responsiveSpacing.sm : responsiveSpacing.md) }]}>
          ... modal content ...
        </View>
      </Modal>
      */}


      {/* Delete Element Confirmation Modal - Responsive across all screen sizes */}
      <Modal
        visible={showDeleteElementModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteElementModal(false)}
        statusBarTranslucent={true}
      >
        <View style={[styles.modalOverlay, { paddingHorizontal: isTabletDevice ? responsiveSpacing.xl : isLandscapeMode ? responsiveSpacing.lg : responsiveSpacing.md }]}>
          <View style={[
            themeStyles.deleteModalContainer,
            {
              backgroundColor: theme.colors.surface,
              width: isTabletDevice 
                ? screenWidth * 0.5 
                : isLandscapeMode 
                  ? screenWidth * 0.6 
                  : isUltraSmallDevice 
                    ? screenWidth * 0.92 
                    : isSmallScreen 
                      ? screenWidth * 0.9 
                      : screenWidth * 0.85,
              maxWidth: isTabletDevice ? 500 : 450,
              paddingHorizontal: isTabletDevice ? responsiveSpacing.xl : isLandscapeMode ? responsiveSpacing.lg : isUltraSmallDevice ? responsiveSpacing.md : responsiveSpacing.lg,
              paddingVertical: isTabletDevice ? responsiveSpacing.xl : isLandscapeMode ? responsiveSpacing.lg : isUltraSmallDevice ? responsiveSpacing.md : responsiveSpacing.lg,
            }
          ]}>
            <View style={themeStyles.deleteModalHeader}>
              <View style={[
                themeStyles.deleteIconContainer, 
                { 
                  backgroundColor: '#ff444420',
                  marginBottom: isTabletDevice ? responsiveSpacing.md : responsiveSpacing.sm
                }
              ]}>
                <Icon 
                  name="warning" 
                  size={isTabletDevice ? 36 : isLandscapeMode ? 32 : isUltraSmallDevice ? 24 : 32} 
                  color="#ff4444" 
                />
              </View>
              <Text 
                style={[
                  themeStyles.deleteModalTitle, 
                  { 
                    color: theme.colors.text,
                    marginBottom: isTabletDevice ? responsiveSpacing.sm : responsiveSpacing.xs
                  }
                ]}
              >
                Delete Element
              </Text>
              <TouchableOpacity 
                style={[
                  themeStyles.closeModalButton, 
                  { backgroundColor: theme.colors.inputBackground }
                ]}
                onPress={() => setShowDeleteElementModal(false)}
                activeOpacity={0.7}
              >
                <Icon 
                  name="close" 
                  size={isTabletDevice ? 24 : isLandscapeMode ? 22 : isUltraSmallDevice ? 18 : 20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={[
              themeStyles.deleteModalContent,
              {
                marginBottom: isTabletDevice ? responsiveSpacing.lg : responsiveSpacing.md,
                paddingHorizontal: isTabletDevice ? responsiveSpacing.md : isUltraSmallDevice ? responsiveSpacing.xs : responsiveSpacing.sm
              }
            ]}>
              <Text style={[
                themeStyles.deleteModalMessage, 
                { 
                  color: theme.colors.text,
                  fontSize: isTabletDevice ? 16 : isLandscapeMode ? 15 : isUltraSmallDevice ? 13 : 15,
                  lineHeight: isTabletDevice ? 24 : isLandscapeMode ? 22 : isUltraSmallDevice ? 18 : 22,
                }
              ]}>
                Are you sure you want to delete this element? This action cannot be undone.
              </Text>
            </View>
            
            <View style={[
              themeStyles.deleteModalButtons,
              {
                gap: isTabletDevice ? responsiveSpacing.md : isLandscapeMode ? responsiveSpacing.sm : isUltraSmallDevice ? responsiveSpacing.xs : responsiveSpacing.sm
              }
            ]}>
              <TouchableOpacity 
                style={[
                  themeStyles.deleteModalCancelButton, 
                  { 
                    backgroundColor: theme.colors.inputBackground,
                    paddingVertical: isTabletDevice ? 16 : isLandscapeMode ? 14 : isUltraSmallDevice ? 12 : 14,
                    borderRadius: isTabletDevice ? 12 : isLandscapeMode ? 10 : isUltraSmallDevice ? 8 : 10,
                  }
                ]}
                onPress={() => setShowDeleteElementModal(false)}
              >
                <Text style={[
                  themeStyles.deleteModalCancelText, 
                  { 
                    color: theme.colors.text,
                    fontSize: isTabletDevice ? 17 : isLandscapeMode ? 16 : isUltraSmallDevice ? 14 : 16,
                  }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  themeStyles.deleteModalDeleteButton, 
                  { 
                    backgroundColor: '#ff4444',
                    paddingVertical: isTabletDevice ? 16 : isLandscapeMode ? 14 : isUltraSmallDevice ? 12 : 14,
                    borderRadius: isTabletDevice ? 12 : isLandscapeMode ? 10 : isUltraSmallDevice ? 8 : 10,
                  }
                ]}
                onPress={confirmDeleteElement}
              >
                <Text style={[
                  themeStyles.deleteModalDeleteText,
                  {
                    fontSize: isTabletDevice ? 17 : isLandscapeMode ? 16 : isUltraSmallDevice ? 14 : 16,
                  }
                ]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Premium Template Modal */}
      <PremiumTemplateModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={async () => {
          setShowPremiumModal(false);
          await refreshSubscription();
          (navigation as any).navigate('Subscription');
        }}
        selectedTemplate={null}
      />

      {/* Connection Error Modal */}
      <Modal
        visible={showConnectionErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowConnectionErrorModal(false);
          navigation.goBack();
        }}
      >
        <View style={[styles.modalOverlay, { paddingHorizontal: responsiveSpacing.md }]}>
          <View style={[
            themeStyles.modalContent,
            {
              width: isTabletDevice 
                ? screenWidth * 0.5 
                : isLandscapeMode 
                  ? screenWidth * 0.6 
                  : isUltraSmallDevice 
                    ? screenWidth * 0.92 
                    : isSmallScreen 
                      ? screenWidth * 0.9 
                      : screenWidth * 0.85,
              maxHeight: screenHeight * 0.4,
            }
          ]}>
            <View style={{ alignItems: 'center', marginBottom: responsiveSpacing.lg }}>
              <View style={{ 
                width: isTabletDevice ? 70 : isUltraSmallScreen ? 50 : 60, 
                height: isTablet ? 70 : isUltraSmallScreen ? 50 : 60, 
                borderRadius: isTablet ? 35 : isUltraSmallScreen ? 25 : 30, 
                backgroundColor: '#fff0f0', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginBottom: responsiveSpacing.md
              }}>
                <Icon 
                  name="wifi-off" 
                  size={isTabletDevice ? 36 : isUltraSmallDevice ? 24 : 32} 
                  color="#ff4444" 
                />
              </View>
              <Text style={[
                themeStyles.modalTitle, 
                { 
                  fontSize: isTabletDevice ? 24 : isUltraSmallDevice ? 18 : 20,
                  marginBottom: responsiveSpacing.sm,
                  textAlign: 'center'
                }
              ]}>
                Connection Error
              </Text>
              <Text style={[
                themeStyles.modalSubtitle, 
                { 
                  fontSize: isTablet ? 15 : isUltraSmallScreen ? 12 : 14,
                  textAlign: 'center',
                  lineHeight: isTablet ? 22 : isUltraSmallScreen ? 16 : 20,
                  paddingHorizontal: responsiveSpacing.sm
                }
              ]}>
                Please check your internet connection and try again.
              </Text>
            </View>
            <View style={[
              styles.modalButtons,
              {
                flexDirection: 'row',
                gap: responsiveSpacing.sm
              }
            ]}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    flex: 1,
                    backgroundColor: '#667eea',
                    paddingVertical: isTabletDevice ? 16 : isUltraSmallDevice ? 12 : 14,
                    borderRadius: isTabletDevice ? 12 : isUltraSmallDevice ? 8 : 10,
                    marginHorizontal: 0
                  }
                ]}
                onPress={() => {
                  setShowConnectionErrorModal(false);
                  fetchBusinessProfiles();
                }}
              >
                <Text style={[
                  styles.addButtonText,
                  {
                    fontSize: isTabletDevice ? 16 : isUltraSmallDevice ? 13 : 15
                  }
                ]}>
                  Retry
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  themeStyles.cancelButton,
                  {
                    flex: 1,
                    paddingVertical: isTabletDevice ? 16 : isUltraSmallDevice ? 12 : 14,
                    borderRadius: isTabletDevice ? 12 : isUltraSmallDevice ? 8 : 10,
                    marginHorizontal: 0
                  }
                ]}
                onPress={() => {
                  setShowConnectionErrorModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={[
                  themeStyles.cancelButtonText,
                  {
                    fontSize: isTabletDevice ? 16 : isUltraSmallDevice ? 13 : 15
                  }
                ]}>
                  Go Back
                </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(8),
    paddingBottom: moderateScale(6),
    borderBottomWidth: 0,
  },
  backButton: {
    borderRadius: moderateScale(6),
    overflow: 'hidden',
  },
  backButtonGradient: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(11),
    fontWeight: '600',
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
    color: '#333333',
    textAlign: 'center',
    marginBottom: isLandscape ? (isTablet ? 2 : 1) : (isUltraSmallScreen ? 0 : isSmallScreen ? 1 : 2),
  },
  headerSubtitle: {
    fontSize: getHeaderSubtitleSize(),
    color: 'rgba(102, 102, 102, 0.8)',
    marginTop: isLandscape ? (isTablet ? 2 : 1) : (isUltraSmallScreen ? 0 : isSmallScreen ? 1 : 2),
    textAlign: 'center',
    lineHeight: isLandscape ? (isTablet ? 16 : 14) : (isUltraSmallScreen ? 12 : isSmallScreen ? 13 : isMediumScreen ? 14 : isLargeScreen ? 15 : 16),
    includeFontPadding: false,
  },
  nextButton: {
    borderRadius: moderateScale(6),
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  canvasContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: isLandscape ? (isTablet ? responsiveSpacing.sm : responsiveSpacing.xs) : (isUltraSmallScreen ? 1 : isSmallScreen ? 2 : responsiveSpacing.xs),
    paddingBottom: isLandscape ? (isTablet ? responsiveSpacing.sm : responsiveSpacing.xs) : (isUltraSmallScreen ? 1 : isSmallScreen ? 2 : responsiveSpacing.xs),
    marginBottom: isTablet ? responsiveSpacing.md : isLandscape ? responsiveSpacing.sm : isUltraSmallScreen ? responsiveSpacing.sm : responsiveSpacing.md,
    maxHeight: isLandscape 
      ? screenHeight * 0.65 
      : isTablet 
        ? screenHeight * 0.50
        : isUltraSmallScreen 
          ? screenHeight * 0.42 
          : isSmallScreen 
            ? screenHeight * 0.44 
            : screenHeight * 0.45,
  },
  controlsContainer: {
    flex: 0, // Don't use flex to prevent expansion
    paddingTop: 0,
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
    borderRadius: 0,
    shadowColor: '#000',
    borderWidth:1,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 0,
  },
  instructionsContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -moderateScale(80) }, { translateY: -moderateScale(15) }],
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(2),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(5),
    elevation: moderateScale(4),
  },
  instructionsText: {
    fontSize: moderateScale(11),
    color: '#666666',
    textAlign: 'center',
    marginTop: moderateScale(5),
    maxWidth: moderateScale(160),
    lineHeight: moderateScale(16),
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -moderateScale(40) }, { translateY: -moderateScale(15) }],
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(2),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(5),
    elevation: moderateScale(4),
  },
  loadingText: {
    fontSize: moderateScale(11),
    color: '#666666',
    textAlign: 'center',
    marginTop: moderateScale(5),
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  layer: {
    position: 'absolute',
  },
  layerText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'left',
    flexWrap: 'wrap', // Allow text to wrap
    textAlignVertical: 'top', // Align text to top
    padding: 0,
    margin: 0,
  },
  layerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  alignmentGuideVertical: {
    position: 'absolute',
    top: 0,
    width: StyleSheet.hairlineWidth || 1,
    backgroundColor: 'rgba(102, 126, 234, 0.85)',
    zIndex: 1000,
  },
  alignmentGuideHorizontal: {
    position: 'absolute',
    left: 0,
    height: StyleSheet.hairlineWidth || 1,
    backgroundColor: 'rgba(102, 126, 234, 0.85)',
    zIndex: 1000,
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
  // Bottom toolbar styles (replacing floating toolbar) - Fully responsive
  bottomToolbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: (Math.min(screenWidth, screenHeight) >= 768) ? 16 : (screenWidth > screenHeight) ? 12 : (screenWidth < 360) ? 6 : (screenWidth >= 360 && screenWidth < 375) ? 8 : 12,
    paddingHorizontal: (Math.min(screenWidth, screenHeight) >= 768) ? 12 : (screenWidth > screenHeight) ? 8 : (screenWidth < 360) ? 4 : (screenWidth >= 360 && screenWidth < 375) ? 6 : 8,
    paddingVertical: (Math.min(screenWidth, screenHeight) >= 768) ? 12 : (screenWidth > screenHeight) ? 8 : (screenWidth < 360) ? 3 : (screenWidth >= 360 && screenWidth < 375) ? 4 : 6,
    marginTop: (Math.min(screenWidth, screenHeight) >= 768) ? 40 : (screenWidth > screenHeight) ? 35 : (screenWidth < 360) ? 25 : (screenWidth >= 360 && screenWidth < 375) ? 30 : 35,
    marginBottom: (Math.min(screenWidth, screenHeight) >= 768) ? 12 : (screenWidth > screenHeight) ? 8 : (screenWidth < 360) ? 4 : (screenWidth >= 360 && screenWidth < 375) ? 5 : 10,
    marginHorizontal: (Math.min(screenWidth, screenHeight) >= 768) ? 12 : (screenWidth > screenHeight) ? 8 : (screenWidth < 360) ? 4 : (screenWidth >= 360 && screenWidth < 375) ? 6 : 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  toolbarScrollContent: {
    paddingHorizontal: isLandscape ? (isTablet ? responsiveSpacing.sm : responsiveSpacing.xs) : (isUltraSmallScreen ? responsiveSpacing.xs : responsiveSpacing.sm),
    alignItems: 'center',
  },
  toolbarButton: {
    marginHorizontal: isLandscape ? (isTablet ? 6 : 4) : (isUltraSmallScreen ? 2 : isSmallScreen ? 3 : isMediumScreen ? 4 : isLargeScreen ? 5 : 6),
    marginVertical: isLandscape ? (isTablet ? 2 : 1) : (isUltraSmallScreen ? 1 : isSmallScreen ? 2 : isMediumScreen ? 3 : isLargeScreen ? 4 : 5),
  },
  toolbarButtonGradient: {
    alignItems: 'center',
    paddingVertical: isLandscape ? (isTablet ? 12 : 10) : (isUltraSmallScreen ? 6 : isSmallScreen ? 8 : isMediumScreen ? 10 : isLargeScreen ? 12 : 14),
    paddingHorizontal: isLandscape ? (isTablet ? 16 : 12) : (isUltraSmallScreen ? 8 : isSmallScreen ? 10 : isMediumScreen ? 12 : isLargeScreen ? 14 : 16),
    borderRadius: isLandscape ? (isTablet ? 12 : 10) : (isUltraSmallScreen ? 6 : isSmallScreen ? 8 : isMediumScreen ? 10 : isLargeScreen ? 12 : 14),
    minWidth: isLandscape ? (isTablet ? 80 : 70) : (isUltraSmallScreen ? 55 : isSmallScreen ? 60 : isMediumScreen ? 65 : isLargeScreen ? 70 : 75),
    minHeight: isLandscape ? (isTablet ? 50 : 45) : (isUltraSmallScreen ? 36 : isSmallScreen ? 38 : isMediumScreen ? 42 : isLargeScreen ? 45 : 48),
  },
  toolbarButtonText: {
    fontSize: getToolbarButtonTextSize(),
    color: '#ffffff',
    marginTop: isLandscape ? (isTablet ? 2 : 1) : (isUltraSmallScreen ? 1 : isSmallScreen ? 2 : isMediumScreen ? 3 : isLargeScreen ? 4 : 5),
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
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
  fontModalRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fontModalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  fontModalWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: moderateScale(6),
  },
  fontModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  fontModalScrollView: {
    flex: 1,
    marginTop: moderateScale(3),
    minHeight: 0,
  },
  fontModalScrollContent: {
    paddingBottom: moderateScale(12),
    paddingHorizontal: moderateScale(2),
  },
  modalTitle: {
    fontSize: isLandscape 
      ? (isTablet ? moderateScale(13) : moderateScale(12)) 
      : (isUltraSmallScreen ? moderateScale(11) : isSmallScreen ? moderateScale(12) : isTablet ? moderateScale(14) : moderateScale(13)),
    fontWeight: '700',
    color: '#333333',
    marginBottom: moderateScale(1),
  },
  modalSubtitle: {
    fontSize: isLandscape 
      ? (isTablet ? moderateScale(9.5) : moderateScale(9)) 
      : (isUltraSmallScreen ? moderateScale(8) : isSmallScreen ? moderateScale(8.5) : isTablet ? moderateScale(10) : moderateScale(9)),
    color: '#666666',
    marginBottom: moderateScale(1),
    fontWeight: '500',
  },
  profileList: {
    maxHeight: verticalScale(320),
    marginBottom: moderateScale(10),
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(6),
  },
  profileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileLogo: {
    width: moderateScale(35),
    height: moderateScale(35),
    borderRadius: moderateScale(17.5),
    marginRight: moderateScale(8),
  },
  profileLogoPlaceholder: {
    width: moderateScale(35),
    height: moderateScale(35),
    borderRadius: moderateScale(17.5),
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(8),
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#333333',
    marginBottom: moderateScale(1.5),
  },
  profileCategory: {
    fontSize: moderateScale(8.5),
    color: '#667eea',
    marginBottom: moderateScale(1.5),
    fontWeight: '600',
  },
  profileDescription: {
    fontSize: moderateScale(8.5),
    color: '#666666',
    lineHeight: moderateScale(11),
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    fontSize: moderateScale(13),
    marginBottom: moderateScale(12),
    backgroundColor: '#f8f9fa',
    color: '#333333', // Dark text color for visibility on white background
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },
  modalButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginHorizontal: moderateScale(4),
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#e9ecef',
  },
  addButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  styleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: moderateScale(12),
  },
  styleOption: {
    width: moderateScale(36),
    height: moderateScale(36),
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    margin: moderateScale(2),
    borderWidth: 1.5,
    borderColor: '#e9ecef',
  },
  styleOptionText: {
    fontSize: moderateScale(11),
    color: '#333333',
    fontWeight: '600',
  },
  colorOption: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    margin: moderateScale(2),
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(2),
    elevation: moderateScale(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionText: {
    fontSize: moderateScale(8),
    color: '#333333',
    fontWeight: '600',
    textAlign: 'center',
  },
  styleSection: {
    marginBottom: moderateScale(12),
  },
  styleSectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#333333',
    marginBottom: moderateScale(8),
  },
  layerTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  draggedLayer: {
    zIndex: 100, // Ensure dragged layer is on top
  },
  fieldToggleSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: isTablet ? 16 : isLandscape ? 12 : isUltraSmallScreen ? 6 : isSmallScreen ? 8 : 12,
    paddingHorizontal: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 8,
    paddingVertical: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 3 : isSmallScreen ? 4 : 6,
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
    marginBottom: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 5 : 10,
    marginHorizontal: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 8,
  },
  fieldToggleHeader: {
    alignItems: 'center',
    marginBottom: isLandscape ? (isTablet ? responsiveSpacing.xs : 0) : (isUltraSmallScreen ? 0 : isSmallScreen ? 0 : 1),
  },
  fieldToggleTitle: {
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.lg : responsiveFontSize.md) : (isUltraSmallScreen ? responsiveFontSize.sm : isSmallScreen ? responsiveFontSize.md : responsiveFontSize.lg),
    fontWeight: '700',
    color: '#333333',
    marginBottom: 0,
    lineHeight: isUltraSmallScreen ? 10 : isSmallScreen ? 11 : 14,
  },
  fieldToggleSubtitle: {
    fontSize: isLandscape ? (isTablet ? responsiveFontSize.sm : responsiveFontSize.xs) : (isUltraSmallScreen ? responsiveFontSize.xs : isSmallScreen ? responsiveFontSize.sm : responsiveFontSize.md),
    color: '#666666',
    marginTop: isLandscape ? (isTablet ? responsiveSpacing.xs : 0) : (isUltraSmallScreen ? 0 : isSmallScreen ? 0 : 1),
  },
  fieldToggleContent: {
    height: isTablet ? 60 : isLandscape ? 55 : isUltraSmallScreen ? 45 : isSmallScreen ? 50 : 55,
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
  // Enhanced Font Style Modal Styles (compact & responsive) - Deprecated, using fontModalScrollView instead
  fontStyleModalHeader: {
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fontStyleModalHeaderContent: {
    flex: 1,
  },
  fontStyleModalTitle: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginTop: moderateScale(2),
  },
  fontStyleModalSubtitle: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  fontStyleCloseButton: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontStyleModalBody: {
    flex: 1,
    marginBottom: moderateScale(12),
    maxHeight: verticalScale(300),
  },
  fontStyleSection: {
    marginBottom: moderateScale(14),
  },
  fontStyleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(5),
  },
  fontStyleSectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#333333',
    marginLeft: moderateScale(8),
  },
  fontStyleSectionSubtitle: {
    fontSize: moderateScale(11),
    color: '#666666',
    marginBottom: moderateScale(10),
    marginLeft: moderateScale(20),
    lineHeight: moderateScale(16),
  },
  fontStyleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(5),
  },
  fontStyleOption: {
    width: (screenWidth * 0.9 - moderateScale(80)) / 2 - moderateScale(6),
    marginBottom: moderateScale(8),
  },
  fontStyleOptionGradient: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  fontStyleOptionText: {
    fontSize: moderateScale(11),
    color: '#333333',
    fontWeight: '600',
    textAlign: 'center',
  },
  fontStyleOptionIcon: {
    width: moderateScale(12),
    height: moderateScale(12),
  },
  fontStyleModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderTopWidth: 0.5,
    borderTopColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  fontStyleCancelButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginRight: moderateScale(8),
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#e9ecef',
  },
  fontStyleCancelButtonText: {
    color: '#666666',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  fontStyleApplyButton: {
    flex: 1,
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  fontStyleApplyButtonGradient: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontStyleApplyButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(13),
    fontWeight: '600',
    marginLeft: moderateScale(5),
  },
  // Logo Selection Modal Styles (compact & responsive)
  logoSelectionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: moderateScale(12),
  },
  logoSelectionOption: {
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(10),
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    minWidth: moderateScale(85),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(2),
  },
  // Professional Logo Modal Styles (compact & responsive)
  logoModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    width: screenWidth * 0.92,
    maxHeight: screenHeight * 0.75,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(6),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(14),
    elevation: moderateScale(10),
  },
  logoModalHeader: {
    alignItems: 'center',
    marginBottom: moderateScale(18),
  },
  logoModalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#333333',
    marginBottom: moderateScale(5),
    textAlign: 'center',
  },
  logoModalSubtitle: {
    fontSize: moderateScale(12),
    color: '#666666',
    textAlign: 'center',
    lineHeight: moderateScale(16),
    paddingHorizontal: moderateScale(12),
  },
  logoOptionsContainer: {
    marginBottom: moderateScale(18),
  },
  logoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    marginBottom: moderateScale(10),
    borderWidth: 0.5,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(2),
    elevation: moderateScale(1),
  },
  logoOptionGradient: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(22.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10),
  },
  logoOptionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333333',
    marginBottom: moderateScale(2),
  },
  logoOptionDescription: {
    fontSize: moderateScale(11),
    color: '#666666',
    lineHeight: moderateScale(14),
  },
  logoModalCloseButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e9ecef',
  },
  logoModalCloseText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#666666',
  },
  // Logo URL Modal Styles (compact & responsive)
  logoUrlModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    width: screenWidth * 0.92,
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(6),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(14),
    elevation: moderateScale(10),
  },
  logoUrlInput: {
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    fontSize: moderateScale(13),
    marginBottom: moderateScale(14),
    backgroundColor: '#f8f9fa',
    color: '#333333',
  },
  logoUrlModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },
  logoUrlCancelButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginRight: moderateScale(4),
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#e9ecef',
  },
  logoUrlCancelText: {
    color: '#666666',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  logoUrlAddButton: {
    flex: 1,
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  logoUrlAddText: {
    color: '#ffffff',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  logoSelectionOptionIcon: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(22.5),
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(2),
    elevation: moderateScale(1),
  },
  logoSelectionOptionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#333333',
    marginBottom: moderateScale(2),
    textAlign: 'center',
  },
  logoSelectionOptionSubtitle: {
    fontSize: moderateScale(10),
    color: '#666666',
    textAlign: 'center',
    lineHeight: moderateScale(13),
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
    borderWidth: 0,
    borderColor: 'transparent',
  },
  classicFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  elegantFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  minimalFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  ornateFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  cornerFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  borderFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  // Additional Frame Styles
  businessFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  eventFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  restaurantFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  fashionFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  realEstateFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  educationFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  healthcareFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  fitnessFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  weddingFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  birthdayFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  corporateFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  creativeFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  luxuryFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  vintageFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  retroFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  techFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  oceanFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  sunsetFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  artisticFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  ombreSunsetFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  ombreOceanFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  ombrePurpleFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  ombreForestFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  ombreFireFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  ombreNightFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  ombreTropicalFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  ombreAutumnFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  ombreRoseFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  ombreGalaxyFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  // Frames Section Styles
  framesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: isTablet ? 16 : isLandscape ? 12 : isUltraSmallScreen ? 6 : isSmallScreen ? 8 : 12,
    paddingHorizontal: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 8,
    paddingVertical: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 3 : isSmallScreen ? 4 : 6,
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
    marginBottom: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 5 : 10,
    marginHorizontal: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 8,
  },
  framesHeader: {
    alignItems: 'center',
    marginBottom: isUltraSmallScreen ? 0 : isSmallScreen ? 0 : 1,
  },
  framesTitle: {
    fontSize: isSmallScreen ? 11 : 14,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 0,
    lineHeight: isUltraSmallScreen ? 12 : isSmallScreen ? 13 : 16,
  },
  framesSubtitle: {
    fontSize: isSmallScreen ? 8 : 10,
    color: '#666666',
    marginTop: 1,
  },
  framesContent: {
    height: isTablet ? 70 : isLandscape ? 65 : isUltraSmallScreen ? 55 : isSmallScreen ? 60 : 65,
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
    width: (() => {
      const isLandscape = screenWidth > screenHeight;
      const isTablet = Math.min(screenWidth, screenHeight) >= 768;
      if (isLandscape) {
        return Math.max(49, (isTablet ? 80 : 70) * 0.7);
      }
      return Math.max(42, (screenWidth < 360 ? 60 : screenWidth >= 360 && screenWidth < 375 ? 65 : screenWidth >= 375 && screenWidth < 414 ? 70 : screenWidth >= 414 && screenWidth < 480 ? 75 : 80) * 0.7);
    })(),
    height: (() => {
      const isLandscape = screenWidth > screenHeight;
      const isTablet = Math.min(screenWidth, screenHeight) >= 768;
      if (isLandscape) {
        return Math.max(49, (isTablet ? 80 : 70) * 0.7);
      }
      return Math.max(42, (screenWidth < 360 ? 60 : screenWidth >= 360 && screenWidth < 375 ? 65 : screenWidth >= 375 && screenWidth < 414 ? 70 : screenWidth >= 414 && screenWidth < 480 ? 75 : 80) * 0.7);
    })(),
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
  // Templates Section Styles - Fixed height, fully responsive
  templatesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: isTablet ? 16 : isLandscape ? 12 : isUltraSmallScreen ? 6 : isSmallScreen ? 8 : 12,
    paddingHorizontal: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 8,
    paddingVertical: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 3 : isSmallScreen ? 4 : 6,
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
    marginBottom: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 5 : 10,
    marginHorizontal: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 8,
  },
  templatesHeader: {
    alignItems: 'center',
    marginBottom: isUltraSmallScreen ? 0 : isSmallScreen ? 0 : 1,
  },
  templatesTitle: {
    fontSize: isSmallScreen ? 11 : 14,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 0,
    lineHeight: isUltraSmallScreen ? 12 : isSmallScreen ? 13 : 16,
  },
  templatesSubtitle: {
    fontSize: isSmallScreen ? 8 : 10,
    color: '#666666',
    marginTop: 1,
  },
  templatesContent: {
    height: isTablet ? 70 : isLandscape ? 65 : isUltraSmallScreen ? 55 : isSmallScreen ? 60 : 65,
  },
  templatesScrollContent: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  templateButton: {
    alignItems: 'center',
    marginHorizontal: isUltraSmallScreen ? 2 : isSmallScreen ? 4 : 8,
    minWidth: isUltraSmallScreen ? 50 : isSmallScreen ? 55 : 80,
  },
  templateButtonActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 12,
    padding: isUltraSmallScreen ? 2 : isSmallScreen ? 4 : 8,
  },
  templatePreview: {
    width: isUltraSmallScreen ? 36 : getResponsiveButtonSize(),
    height: isUltraSmallScreen ? 36 : getResponsiveButtonSize(),
    borderRadius: isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isUltraSmallScreen ? 2 : isSmallScreen ? 4 : 8,
    borderWidth: 0,
    borderColor: 'transparent',
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
    fontSize: isUltraSmallScreen ? 7 : isSmallScreen ? 8 : 10,
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: isUltraSmallScreen ? 8 : isSmallScreen ? 9 : 12,
  },
  templateTextActive: {
    color: '#667eea',
    fontWeight: '700',
  },
  // Additional Template Preview Styles
  minimalTemplatePreview: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  minimalTemplateStyle: {
    backgroundColor: 'rgba(204, 204, 204, 0.8)',
  },
  elegantTemplatePreview: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  elegantTemplateStyle: {
    backgroundColor: 'rgba(212, 175, 55, 0.8)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: isTablet ? 16 : isLandscape ? 12 : isUltraSmallScreen ? 6 : isSmallScreen ? 8 : 12,
    paddingHorizontal: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 8,
    paddingVertical: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 3 : isSmallScreen ? 4 : 6,
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
    marginBottom: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 5 : 10,
    marginHorizontal: isTablet ? 12 : isLandscape ? 8 : isUltraSmallScreen ? 4 : isSmallScreen ? 6 : 8,
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
  // Font Modal Header
  fontModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: isLandscape 
      ? (isTablet ? moderateScale(7) : moderateScale(6)) 
      : (isUltraSmallScreen ? moderateScale(5) : isSmallScreen ? moderateScale(5) : isTablet ? moderateScale(7) : moderateScale(6)),
    paddingBottom: isLandscape 
      ? (isTablet ? moderateScale(6) : moderateScale(5)) 
      : (isUltraSmallScreen ? moderateScale(4) : isSmallScreen ? moderateScale(5) : isTablet ? moderateScale(6) : moderateScale(5)),
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  fontModalCloseButton: {
    padding: moderateScale(3),
    borderRadius: moderateScale(14),
    backgroundColor: '#f8f9fa',
    width: isLandscape 
      ? (isTablet ? moderateScale(28) : moderateScale(26)) 
      : (isUltraSmallScreen ? moderateScale(24) : isSmallScreen ? moderateScale(26) : isTablet ? moderateScale(28) : moderateScale(26)),
    height: isLandscape 
      ? (isTablet ? moderateScale(28) : moderateScale(26)) 
      : (isUltraSmallScreen ? moderateScale(24) : isSmallScreen ? moderateScale(26) : isTablet ? moderateScale(28) : moderateScale(26)),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Font Size Controls
  fontSizeControlsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(6),
    padding: isLandscape 
      ? (isTablet ? moderateScale(10) : moderateScale(8)) 
      : (isUltraSmallScreen ? moderateScale(8) : isSmallScreen ? moderateScale(8) : isTablet ? moderateScale(10) : moderateScale(8)),
    marginBottom: moderateScale(8),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  fontSizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(6),
    gap: moderateScale(4),
  },
  fontSizeHeaderTextGroup: {
    flexDirection: 'column',
  },
  fontSizeLabel: {
    fontSize: isLandscape 
      ? (isTablet ? moderateScale(12) : moderateScale(11)) 
      : (isUltraSmallScreen ? moderateScale(10) : isSmallScreen ? moderateScale(10.5) : isTablet ? moderateScale(12) : moderateScale(11)),
    fontWeight: '700',
    color: '#333333',
  },
  fontSizeHelperText: {
    fontSize: moderateScale(8.5),
    color: '#888888',
  },
  fontSizeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: isUltraSmallScreen ? moderateScale(3) : moderateScale(4),
  },
  fontSizeButton: {
    paddingVertical: isLandscape 
      ? (isTablet ? moderateScale(7) : moderateScale(6)) 
      : (isUltraSmallScreen ? moderateScale(5) : isSmallScreen ? moderateScale(5) : isTablet ? moderateScale(7) : moderateScale(6)),
    paddingHorizontal: isLandscape 
      ? (isTablet ? moderateScale(10) : moderateScale(8)) 
      : (isUltraSmallScreen ? moderateScale(6) : isSmallScreen ? moderateScale(7) : isTablet ? moderateScale(10) : moderateScale(8)),
    borderRadius: moderateScale(5),
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: isUltraSmallScreen ? moderateScale(34) : isSmallScreen ? moderateScale(36) : moderateScale(38),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fontSizeButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  fontSizeButtonText: {
    fontSize: isLandscape 
      ? (isTablet ? moderateScale(11) : moderateScale(10)) 
      : (isUltraSmallScreen ? moderateScale(9) : isSmallScreen ? moderateScale(9.5) : isTablet ? moderateScale(11) : moderateScale(10)),
    fontWeight: '600',
    color: '#666666',
  },
  fontSizeButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  // Font Family Section
  fontFamilySection: {
    marginBottom: moderateScale(5),
  },
  fontFamilySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(3),
    paddingBottom: moderateScale(5),
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  fontFamilySectionTitle: {
    fontSize: isLandscape 
      ? (isTablet ? moderateScale(11) : moderateScale(10)) 
      : (isUltraSmallScreen ? moderateScale(9.5) : isSmallScreen ? moderateScale(10) : isTablet ? moderateScale(11) : moderateScale(10.5)),
    fontWeight: '700',
    color: '#333333',
  },
  // Font Category Section
  fontCategorySection: {
    marginBottom: isLandscape 
      ? (isTablet ? moderateScale(10) : moderateScale(8)) 
      : (isUltraSmallScreen ? moderateScale(6) : isSmallScreen ? moderateScale(7) : isTablet ? moderateScale(10) : moderateScale(8)),
  },
  fontCategoryTitle: {
    fontSize: isLandscape 
      ? (isTablet ? moderateScale(10) : moderateScale(9)) 
      : (isUltraSmallScreen ? moderateScale(8.5) : isSmallScreen ? moderateScale(9) : isTablet ? moderateScale(10) : moderateScale(9.5)),
    fontWeight: '600',
    color: '#667eea',
    marginBottom: moderateScale(5),
    marginLeft: moderateScale(2),
  },
  fontCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isUltraSmallScreen ? moderateScale(2.5) : moderateScale(3),
  },
  // Font Option Button
  fontOptionButton: {
    width: (() => {
      const modalWidth = isLandscape 
        ? (isTablet ? screenWidth * 0.65 : screenWidth * 0.75) 
        : (isUltraSmallScreen ? screenWidth * 0.95 : isSmallScreen ? screenWidth * 0.92 : isMediumScreen ? screenWidth * 0.88 : isLargeScreen ? screenWidth * 0.85 : isTablet ? screenWidth * 0.8 : screenWidth * 0.85);
      const padding = isLandscape 
        ? (isTablet ? 18 : 14) 
        : (isUltraSmallScreen ? 10 : isSmallScreen ? 12 : isMediumScreen ? 14 : isLargeScreen ? 16 : isTablet ? 18 : 16);
      const gapSize = isUltraSmallScreen ? moderateScale(2.5) : moderateScale(3);
      const scrollPadding = moderateScale(2) * 2;
      const availableWidth = modalWidth - (padding * 2) - scrollPadding;
      const columns = isLandscape ? (isTablet ? 4 : 3) : (isUltraSmallScreen ? 2 : isTablet ? 4 : 3);
      return (availableWidth - (gapSize * (columns - 1))) / columns;
    })(),
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(4),
    padding: isLandscape 
      ? (isTablet ? moderateScale(6) : moderateScale(5)) 
      : (isUltraSmallScreen ? moderateScale(4) : isSmallScreen ? moderateScale(4) : isTablet ? moderateScale(6) : moderateScale(5)),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fontPreviewText: {
    fontSize: isLandscape 
      ? (isTablet ? moderateScale(16) : moderateScale(14)) 
      : (isUltraSmallScreen ? moderateScale(13) : isSmallScreen ? moderateScale(14) : isTablet ? moderateScale(18) : moderateScale(15)),
    fontWeight: '400',
    color: '#333333',
    marginBottom: moderateScale(1.5),
  },
  fontOptionName: {
    fontSize: isLandscape 
      ? (isTablet ? moderateScale(7) : moderateScale(6.5)) 
      : (isUltraSmallScreen ? moderateScale(6) : isSmallScreen ? moderateScale(6.5) : isTablet ? moderateScale(7.5) : moderateScale(7)),
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
    lineHeight: isLandscape 
      ? (isTablet ? moderateScale(9) : moderateScale(8)) 
      : (isUltraSmallScreen ? moderateScale(8) : isSmallScreen ? moderateScale(8) : isTablet ? moderateScale(9.5) : moderateScale(9)),
  },
  fullscreenWatermarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  fullscreenWatermarkImage: {
    width: '95%',
    height: '95%',
    tintColor: 'rgba(255, 255, 255, 0.3)',
  },

});

export default PosterEditorScreen; 