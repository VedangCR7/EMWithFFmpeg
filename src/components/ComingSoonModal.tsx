import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface ComingSoonModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  visible,
  onClose,
  title = "Coming Soon",
  subtitle = "This feature is under development and will be available soon!"
}) => {
  const { theme, isDarkMode } = useTheme();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Enhanced responsive design helpers with more granular breakpoints
  const isUltraSmallScreen = screenWidth < 360;
  const isSmallScreen = screenWidth >= 360 && screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
  const isLargeScreen = screenWidth >= 414 && screenWidth < 480;
  const isXLargeScreen = screenWidth >= 480;

  // Device type detection
  const isTablet = Math.min(screenWidth, screenHeight) >= 768;

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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start animations when modal becomes visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      // Reset animations when modal is hidden
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      rotateAnim.setValue(0);
    }
  }, [visible, fadeAnim, scaleAnim, rotateAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              width: Math.min(screenWidth * 0.85, isTablet ? 500 : 350),
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            style={[
              styles.gradientBackground,
              {
                padding: isTablet ? 35 : responsiveSpacing.xxl,
                minHeight: isTablet ? 280 : (isUltraSmallScreen ? 220 : 250),
              }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  width: isTablet ? 40 : (isUltraSmallScreen ? 32 : 36),
                  height: isTablet ? 40 : (isUltraSmallScreen ? 32 : 36),
                  borderRadius: isTablet ? 20 : (isUltraSmallScreen ? 16 : 18),
                }
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon
                name="close"
                size={isTablet ? 24 : (isUltraSmallScreen ? 18 : 20)}
                color="#ffffff"
              />
            </TouchableOpacity>

            {/* Animated Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  width: isTablet ? 90 : (isUltraSmallScreen ? 65 : 80),
                  height: isTablet ? 90 : (isUltraSmallScreen ? 65 : 80),
                  borderRadius: isTablet ? 45 : (isUltraSmallScreen ? 32.5 : 40),
                  marginBottom: responsiveSpacing.lg,
                  transform: [{ rotate: rotateInterpolate }],
                },
              ]}
            >
              <Icon
                name="construction"
                size={isTablet ? 50 : (isUltraSmallScreen ? 32 : 40)}
                color="#ffffff"
              />
            </Animated.View>

            {/* Title */}
            <Text style={[
              styles.title,
              {
                fontSize: isTablet ? 24 : responsiveFontSize.xxxxxl,
                marginBottom: responsiveSpacing.md,
              }
            ]}>{title}</Text>

            {/* Subtitle */}
            <Text style={[
              styles.subtitle,
              {
                fontSize: isTablet ? 18 : responsiveFontSize.xl,
                lineHeight: isTablet ? 26 : responsiveFontSize.xl * 1.5,
                marginBottom: responsiveSpacing.xxl,
                paddingHorizontal: responsiveSpacing.md,
              }
            ]}>{subtitle}</Text>

            {/* OK Button */}
            <TouchableOpacity
              style={[
                styles.okButton,
                {
                  paddingVertical: isTablet ? 14 : responsiveSpacing.md,
                  paddingHorizontal: isTablet ? 35 : responsiveSpacing.xxl,
                  borderRadius: responsiveSpacing.lg,
                }
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.okButtonText,
                {
                  fontSize: isTablet ? 18 : responsiveFontSize.xl,
                }
              ]}>Got it!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  gradientBackground: {
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 250,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  okButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});

export default ComingSoonModal;