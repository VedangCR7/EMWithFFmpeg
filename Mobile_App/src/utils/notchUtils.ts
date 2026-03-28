import { Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets, Edge } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Notch detection utilities
export const hasNotch = (): boolean => {
  if (Platform.OS === 'ios') {
    // iPhone X and newer have notches
    const notchDevices = [
      'iPhone10,3', 'iPhone10,6', // iPhone X
      'iPhone11,2', 'iPhone11,4', 'iPhone11,6', 'iPhone11,8', // iPhone XS, XS Max, XR
      'iPhone12,1', 'iPhone12,3', 'iPhone12,5', 'iPhone12,8', // iPhone 11, 11 Pro, 11 Pro Max, SE 2nd gen
      'iPhone13,1', 'iPhone13,2', 'iPhone13,3', 'iPhone13,4', // iPhone 12, 12 Pro, 12 Pro Max, 12 mini
      'iPhone14,2', 'iPhone14,3', 'iPhone14,4', 'iPhone14,5', 'iPhone14,6', 'iPhone14,7', 'iPhone14,8', // iPhone 13 series
      'iPhone15,2', 'iPhone15,3', 'iPhone15,4', 'iPhone15,5', // iPhone 14 series
      'iPhone16,1', 'iPhone16,2', // iPhone 15 series
    ];
    
    // For now, we'll use screen dimensions as a fallback
    // In a real app, you might want to use a library like react-native-device-info
    return screenHeight >= 812; // iPhone X height
  }
  
  if (Platform.OS === 'android') {
    // Android devices with notches typically have aspect ratios > 2
    const aspectRatio = screenHeight / screenWidth;
    return aspectRatio > 2;
  }
  
  return false;
};

// Safe area edge configurations for different screen types
export const getSafeAreaEdges = (screenType: 'full' | 'top' | 'bottom' | 'none' = 'full'): Edge[] => {
  switch (screenType) {
    case 'top':
      return ['top', 'left', 'right'];
    case 'bottom':
      return ['bottom', 'left', 'right'];
    case 'none':
      return [];
    case 'full':
    default:
      return ['top', 'left', 'right', 'bottom'];
  }
};

// Hook for getting safe area insets with notch awareness
export const useNotchAwareInsets = () => {
  const insets = useSafeAreaInsets();
  
  return {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    hasNotch: hasNotch(),
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
  };
};

// Status bar configuration for different screen types
export const getStatusBarConfig = (screenType: 'light' | 'dark' | 'auto' = 'light') => {
  return {
    barStyle: screenType === 'light' ? 'light-content' : 
              screenType === 'dark' ? 'dark-content' : 'default',
    backgroundColor: 'transparent',
    translucent: true,
  };
};

// Common padding values for notch-aware layouts
export const getNotchAwarePadding = (basePadding: number = 20) => {
  const notchPadding = hasNotch() ? 10 : 0;
  return {
    horizontal: basePadding,
    top: basePadding + notchPadding,
    bottom: basePadding,
  };
};

// Screen dimensions with notch awareness
export const getScreenDimensions = () => {
  return {
    width: screenWidth,
    height: screenHeight,
    hasNotch: hasNotch(),
    aspectRatio: screenHeight / screenWidth,
  };
};

// Tab bar styling utilities
export const getTabBarStyle = (insets: any, baseHeight: number = 60) => {
  const totalHeight = baseHeight + insets.bottom + 8;
  return {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingTop: 8,
    paddingBottom: Math.max(12, insets.bottom + 4),
    height: totalHeight,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    // Ensure tab bar is above system navigation
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    // Prevent tab bar from affecting content layout
    marginTop: 0,
    // Ensure proper spacing
    minHeight: totalHeight,
    // Add bottom margin to prevent content overlap
    marginBottom: 0,
  };
};

// Tab bar item styling
export const getTabBarItemStyle = () => {
  return {
    paddingVertical: 4,
  };
};

// Tab bar label styling
export const getTabBarLabelStyle = () => {
  return {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  };
}; 