import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Screen size breakpoints
export const isSmallScreen = screenWidth < 375;
export const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
export const isLargeScreen = screenWidth >= 414;
export const isTablet = screenWidth >= 768;
export const isLandscape = screenWidth > screenHeight;

// Responsive spacing system
export const responsiveSpacing = {
  xs: isSmallScreen ? 4 : isMediumScreen ? 6 : 8,
  sm: isSmallScreen ? 8 : isMediumScreen ? 12 : 16,
  md: isSmallScreen ? 12 : isMediumScreen ? 16 : 20,
  lg: isSmallScreen ? 16 : isMediumScreen ? 20 : 24,
  xl: isSmallScreen ? 20 : isMediumScreen ? 24 : 32,
  xxl: isSmallScreen ? 24 : isMediumScreen ? 32 : 40,
};

// Responsive font sizes
export const responsiveFontSize = {
  xs: isSmallScreen ? 10 : isMediumScreen ? 12 : 14,
  sm: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
  md: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
  lg: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
  xl: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  xxl: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
  xxxl: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
};

// Responsive sizing utilities
export const responsiveSize = {
  // Button sizes
  buttonHeight: Math.max(44, screenHeight * 0.055),
  buttonPaddingHorizontal: Math.max(16, screenWidth * 0.04),
  buttonPaddingVertical: Math.max(12, screenHeight * 0.015),
  buttonBorderRadius: Math.max(8, screenWidth * 0.02),
  
  // Input sizes
  inputHeight: Math.max(48, screenHeight * 0.06),
  inputPaddingHorizontal: Math.max(16, screenWidth * 0.04),
  inputBorderRadius: Math.max(12, screenWidth * 0.03),
  
  // Card sizes
  cardPadding: Math.max(16, screenWidth * 0.04),
  cardBorderRadius: Math.max(12, screenWidth * 0.03),
  cardMarginBottom: Math.max(12, screenHeight * 0.015),
  
  // Icon sizes
  iconSmall: Math.max(16, screenWidth * 0.04),
  iconMedium: Math.max(20, screenWidth * 0.05),
  iconLarge: Math.max(24, screenWidth * 0.06),
  iconXLarge: Math.max(32, screenWidth * 0.08),
  
  // Avatar sizes
  avatarSmall: Math.max(32, screenWidth * 0.08),
  avatarMedium: Math.max(48, screenWidth * 0.12),
  avatarLarge: Math.max(64, screenWidth * 0.16),
  avatarXLarge: Math.max(80, screenWidth * 0.2),
};

// Responsive layout utilities
export const responsiveLayout = {
  // Container padding
  containerPaddingHorizontal: Math.max(16, screenWidth * 0.04),
  containerPaddingVertical: Math.max(16, screenHeight * 0.02),
  
  // Header heights
  headerHeight: Math.max(56, screenHeight * 0.07),
  headerPaddingHorizontal: Math.max(16, screenWidth * 0.04),
  
  // Section spacing
  sectionMarginBottom: Math.max(24, screenHeight * 0.03),
  sectionPaddingHorizontal: Math.max(16, screenWidth * 0.04),
  
  // List spacing
  listItemPadding: Math.max(16, screenWidth * 0.04),
  listItemMarginBottom: Math.max(8, screenHeight * 0.01),
};

// Responsive shadow utilities
export const responsiveShadow = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: Math.max(2, screenWidth * 0.005),
    elevation: Math.max(2, screenWidth * 0.005),
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: Math.max(4, screenWidth * 0.01),
    elevation: Math.max(4, screenWidth * 0.01),
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: Math.max(8, screenWidth * 0.02),
    elevation: Math.max(8, screenWidth * 0.02),
  },
};

// Responsive text utilities
export const responsiveText = {
  // Font sizes with responsive scaling
  title: Math.max(responsiveFontSize.xxxl, Math.min(32, screenWidth * 0.08)),
  heading: Math.max(responsiveFontSize.xxl, Math.min(24, screenWidth * 0.06)),
  subheading: Math.max(responsiveFontSize.xl, Math.min(20, screenWidth * 0.05)),
  body: Math.max(responsiveFontSize.md, Math.min(16, screenWidth * 0.04)),
  caption: Math.max(responsiveFontSize.sm, Math.min(14, screenWidth * 0.035)),
  small: Math.max(responsiveFontSize.xs, Math.min(12, screenWidth * 0.03)),
  
  // Line heights
  lineHeightTight: 1.2,
  lineHeightNormal: 1.4,
  lineHeightRelaxed: 1.6,
  
  // Letter spacing
  letterSpacingTight: -0.5,
  letterSpacingNormal: 0,
  letterSpacingWide: 0.5,
};

// Responsive grid utilities
export const responsiveGrid = {
  // Column counts based on screen size - always show 3 columns
  columns: 3,
  
  // Gap sizes
  gap: Math.max(12, screenWidth * 0.03),
  
  // Item widths - calculate for 3 columns
  itemWidth: (screenWidth - (responsiveLayout.containerPaddingHorizontal * 2) - (Math.max(12, screenWidth * 0.03) * 2)) / 3,
};

// Responsive modal utilities
export const responsiveModal = {
  // Modal dimensions
  width: Math.min(screenWidth * 0.9, 400),
  maxHeight: screenHeight * 0.8,
  
  // Modal padding
  padding: Math.max(20, screenWidth * 0.05),
  
  // Modal border radius
  borderRadius: Math.max(16, screenWidth * 0.04),
};

// Responsive button utilities
export const responsiveButton = {
  // Primary button
  primary: {
    height: responsiveSize.buttonHeight,
    paddingHorizontal: responsiveSize.buttonPaddingHorizontal,
    paddingVertical: responsiveSize.buttonPaddingVertical,
    borderRadius: responsiveSize.buttonBorderRadius,
    ...responsiveShadow.medium,
  },
  
  // Secondary button
  secondary: {
    height: responsiveSize.buttonHeight,
    paddingHorizontal: responsiveSize.buttonPaddingHorizontal,
    paddingVertical: responsiveSize.buttonPaddingVertical,
    borderRadius: responsiveSize.buttonBorderRadius,
    borderWidth: 1,
    ...responsiveShadow.small,
  },
  
  // Icon button
  icon: {
    width: Math.max(44, screenWidth * 0.11),
    height: Math.max(44, screenWidth * 0.11),
    borderRadius: Math.max(22, screenWidth * 0.055),
    ...responsiveShadow.small,
  },
};

// Responsive input utilities
export const responsiveInput = {
  // Text input
  text: {
    height: responsiveSize.inputHeight,
    paddingHorizontal: responsiveSize.inputPaddingHorizontal,
    borderRadius: responsiveSize.inputBorderRadius,
    fontSize: responsiveText.body,
    ...responsiveShadow.small,
  },
  
  // Search input
  search: {
    height: Math.max(40, screenHeight * 0.05),
    paddingHorizontal: Math.max(12, screenWidth * 0.03),
    borderRadius: Math.max(20, screenWidth * 0.05),
    fontSize: responsiveText.body,
    ...responsiveShadow.small,
  },
};

// Responsive card utilities
export const responsiveCard = {
  // Basic card
  basic: {
    padding: responsiveSize.cardPadding,
    borderRadius: responsiveSize.cardBorderRadius,
    marginBottom: responsiveSize.cardMarginBottom,
    ...responsiveShadow.medium,
  },
  
  // Elevated card
  elevated: {
    padding: responsiveSize.cardPadding,
    borderRadius: responsiveSize.cardBorderRadius,
    marginBottom: responsiveSize.cardMarginBottom,
    ...responsiveShadow.large,
  },
  
  // Compact card
  compact: {
    padding: Math.max(12, screenWidth * 0.03),
    borderRadius: Math.max(8, screenWidth * 0.02),
    marginBottom: Math.max(8, screenHeight * 0.01),
    ...responsiveShadow.small,
  },
};

// Platform-specific adjustments
export const platformSpecific = {
  ios: {
    ...Platform.select({
      ios: {
        // iOS-specific adjustments
        buttonBorderRadius: Math.max(8, screenWidth * 0.02),
        inputBorderRadius: Math.max(8, screenWidth * 0.02),
        cardBorderRadius: Math.max(8, screenWidth * 0.02),
      },
    }),
  },
  android: {
    ...Platform.select({
      android: {
        // Android-specific adjustments
        buttonBorderRadius: Math.max(4, screenWidth * 0.01),
        inputBorderRadius: Math.max(4, screenWidth * 0.01),
        cardBorderRadius: Math.max(4, screenWidth * 0.01),
      },
    }),
  },
};

// Orientation-specific adjustments
export const orientationSpecific = {
  portrait: {
    // Portrait mode adjustments
    containerPaddingHorizontal: Math.max(16, screenWidth * 0.04),
    gridColumns: isTablet ? 3 : 2,
  },
  landscape: {
    // Landscape mode adjustments
    containerPaddingHorizontal: Math.max(20, screenWidth * 0.03),
    gridColumns: isTablet ? 4 : 3,
  },
};

// Export all utilities
export default {
  // Screen size helpers
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  isTablet,
  isLandscape,
  
  // Responsive systems
  responsiveSpacing,
  responsiveFontSize,
  responsiveSize,
  responsiveLayout,
  responsiveShadow,
  responsiveText,
  responsiveGrid,
  responsiveModal,
  responsiveButton,
  responsiveInput,
  responsiveCard,
  
  // Platform and orientation specific
  platformSpecific,
  orientationSpecific,
  
  // Screen dimensions
  screenWidth,
  screenHeight,
};
