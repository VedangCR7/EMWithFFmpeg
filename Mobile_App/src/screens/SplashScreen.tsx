import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// Get responsive dimensions function
const getResponsiveDimensions = () => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Enhanced responsive design helpers with more granular breakpoints
  const isUltraSmallScreen = screenWidth < 360;
  const isSmallScreen = screenWidth >= 360 && screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
  const isLargeScreen = screenWidth >= 414 && screenWidth < 480;
  const isXLargeScreen = screenWidth >= 480 && screenWidth < 768;
  const isTablet = screenWidth >= 768;
  
  // Orientation detection
  const isPortrait = screenHeight > screenWidth;
  const isLandscape = screenWidth > screenHeight;
  
  // Enhanced responsive spacing and sizing
  const responsiveSpacing = {
    xs: isUltraSmallScreen ? 4 : isSmallScreen ? 6 : isMediumScreen ? 8 : isLargeScreen ? 10 : isTablet ? 16 : 12,
    sm: isUltraSmallScreen ? 6 : isSmallScreen ? 8 : isMediumScreen ? 12 : isLargeScreen ? 14 : isTablet ? 20 : 16,
    md: isUltraSmallScreen ? 8 : isSmallScreen ? 12 : isMediumScreen ? 16 : isLargeScreen ? 18 : isTablet ? 24 : 20,
    lg: isUltraSmallScreen ? 12 : isSmallScreen ? 16 : isMediumScreen ? 20 : isLargeScreen ? 22 : isTablet ? 32 : 24,
    xl: isUltraSmallScreen ? 16 : isSmallScreen ? 20 : isMediumScreen ? 24 : isLargeScreen ? 28 : isTablet ? 40 : 32,
    xxl: isUltraSmallScreen ? 20 : isSmallScreen ? 24 : isMediumScreen ? 28 : isLargeScreen ? 32 : isTablet ? 48 : 40,
  };
  
  const responsiveFontSize = {
    xs: isUltraSmallScreen ? 8 : isSmallScreen ? 9 : isMediumScreen ? 10 : isLargeScreen ? 11 : isTablet ? 14 : 12,
    sm: isUltraSmallScreen ? 10 : isSmallScreen ? 11 : isMediumScreen ? 12 : isLargeScreen ? 13 : isTablet ? 16 : 14,
    md: isUltraSmallScreen ? 12 : isSmallScreen ? 13 : isMediumScreen ? 14 : isLargeScreen ? 15 : isTablet ? 18 : 16,
    lg: isUltraSmallScreen ? 14 : isSmallScreen ? 15 : isMediumScreen ? 16 : isLargeScreen ? 17 : isTablet ? 20 : 18,
    xl: isUltraSmallScreen ? 16 : isSmallScreen ? 17 : isMediumScreen ? 18 : isLargeScreen ? 19 : isTablet ? 24 : 20,
    xxl: isUltraSmallScreen ? 18 : isSmallScreen ? 19 : isMediumScreen ? 20 : isLargeScreen ? 21 : isTablet ? 26 : 22,
    xxxl: isUltraSmallScreen ? 20 : isSmallScreen ? 22 : isMediumScreen ? 24 : isLargeScreen ? 26 : isTablet ? 32 : 28,
    xxxxl: isUltraSmallScreen ? 24 : isSmallScreen ? 26 : isMediumScreen ? 28 : isLargeScreen ? 30 : isTablet ? 38 : 32,
  };
  
  return {
    screenWidth,
    screenHeight,
    isUltraSmallScreen,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isXLargeScreen,
    isTablet,
    isPortrait,
    isLandscape,
    responsiveSpacing,
    responsiveFontSize,
  };
};

const SplashScreen: React.FC = () => {
  const { isDarkMode, theme } = useTheme();
  
  // Responsive dimensions state
  const [dimensions, setDimensions] = useState(getResponsiveDimensions());

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getResponsiveDimensions());
    });
    
    return () => subscription?.remove();
  }, []);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const featureAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const backgroundPulse = useRef(new Animated.Value(0)).current;

  const logoSize = useMemo(() => {
    const minDimension = Math.min(dimensions.screenWidth, dimensions.screenHeight);
    if (dimensions.isTablet) {
      return minDimension * 0.25;
    }
    return minDimension * 0.22;
  }, [dimensions]);

  const progressWidth = useMemo(() => progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, dimensions.screenWidth * 0.45],
  }), [progressAnim, dimensions.screenWidth]);

  // Memoized animation sequence
  const startAnimations = useMemo(() => () => {
    // Fade in animation - slower for better impact
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500, // Increased from 1000ms to 1500ms
      useNativeDriver: true,
    }).start();

    // Scale animation - smoother spring effect
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 40, // Reduced for slower, smoother animation
      friction: 8, // Increased for more damping
      useNativeDriver: true,
    }).start();

    // Slide up animation - slower
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 1200, // Increased from 800ms to 1200ms
      useNativeDriver: true,
    }).start();

    // Rotation animation - slower rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000, // Increased from 3000ms to 4000ms for slower rotation
        useNativeDriver: true,
      })
    ).start();

    Animated.timing(featureAnim, {
      toValue: 1,
      duration: 900,
      delay: 600,
      useNativeDriver: true,
    }).start();

    progressAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundPulse, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundPulse, {
          toValue: 0,
          duration: 2800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, scaleAnim, slideAnim, rotateAnim, featureAnim, progressAnim, backgroundPulse]);

  useEffect(() => {
    startAnimations();
  }, [startAnimations]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const haloScale = backgroundPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.1],
  });

  const haloOpacity = backgroundPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.08],
  });

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent" 
        translucent={true}
      />
      
      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.backgroundGlow,
            {
              transform: [{ scale: haloScale }],
              opacity: haloOpacity,
            },
          ]}
        />

        <View style={styles.content}>
          <View style={styles.contentOverlay} />
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim },
                ],
              },
            ]}
          >
            <View style={styles.logoStack}>
              <Animated.View
                style={[
                  styles.logoGlow,
                  {
                    width: logoSize * 1.55,
                    height: logoSize * 1.55,
                    borderRadius: (logoSize * 1.55) / 2,
                    opacity: haloOpacity,
                    transform: [{ scale: haloScale }],
                  },
                ]}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.05)']}
                style={[
                  styles.logoRing,
                  {
                    width: logoSize * 1.25,
                    height: logoSize * 1.25,
                    borderRadius: (logoSize * 1.25) / 2,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.logoCircle,
                  {
                    width: logoSize,
                    height: logoSize,
                    borderRadius: logoSize / 2,
                    padding: logoSize * 0.18,
                    backgroundColor: theme.colors.cardBackground,
                    transform: [{ rotate: spin }],
                  },
                ]}
              >
                <Image 
                  source={require('../assets/MainLogo/main_logo.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.appTitle}>MarketBrand</Text>
            <Text style={styles.appSubtitle}>Enterprise marketing suite for ambitious creators</Text>
            <Text style={styles.appSecondarySubtitle}>Trusted by 2K+ businesses worldwide</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.poweredByContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.poweredByText}>Powered by RSL Solution PVT LTD</Text>
            <Text style={styles.versionText}>Build 1.0.0 • Secure • Encrypted</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 11, 25, 0.38)',
  },
  backgroundGlow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(255,255,255,0.18)',
    top: '18%',
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoStack: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  logoRing: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  logoCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  appTitle: {
    fontWeight: '700',
    color: '#F8FAFF',
    letterSpacing: 3,
    fontSize: 24,
  },
  appSubtitle: {
    color: 'rgba(244,247,255,0.92)',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
    fontSize: 16,
    letterSpacing: 0.55,
  },
  appSecondarySubtitle: {
    marginTop: 6,
    color: 'rgba(226,237,255,0.82)',
    textAlign: 'center',
    fontSize: 13,
    letterSpacing: 0.45,
  },
  poweredByContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: '100%',
    bottom: 32,
  },
  poweredByText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  versionText: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    letterSpacing: 0.6,
  },
});

export default SplashScreen; 