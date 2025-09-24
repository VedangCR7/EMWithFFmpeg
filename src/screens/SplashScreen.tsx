import React, { useEffect, useRef, useMemo } from 'react';
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
import Video from 'react-native-video';
import { useTheme } from '../context/ThemeContext';

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

const SplashScreen: React.FC = () => {
  const { isDarkMode, theme } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const videoOpacity = useRef(new Animated.Value(1)).current;
  
  // Video state
  const [showVideo, setShowVideo] = React.useState(true);
  const [videoEnded, setVideoEnded] = React.useState(false);

  // Video event handlers
  const onVideoEnd = () => {
    setVideoEnded(true);
    // Fade out video
    Animated.timing(videoOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowVideo(false);
      startAnimations();
    });
  };

  const onVideoError = (error: any) => {
    console.log('Video error:', error);
    // If video fails to load, show regular splash screen
    setShowVideo(false);
    startAnimations();
  };

  // Memoized animation sequence
  const startAnimations = useMemo(() => () => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, scaleAnim, slideAnim, rotateAnim]);

  useEffect(() => {
    // Start animations only if video is not showing or has ended
    if (!showVideo) {
      startAnimations();
    }
  }, [startAnimations, showVideo]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent" 
        translucent={true}
      />
      
      {/* Video Background */}
      {showVideo && (
        <Animated.View style={[styles.videoContainer, { opacity: videoOpacity }]}>
          <Video
            source={{ uri: 'file:///android_asset/intro.mp4' }}
            style={styles.video}
            resizeMode="cover"
            onEnd={onVideoEnd}
            onError={onVideoError}
            repeat={false}
            muted={false}
            volume={1.0}
          />
        </Animated.View>
      )}
      
      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo Container */}
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
            {/* Animated Logo */}
            <Animated.View
              style={[
                styles.logoCircle,
                {
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
          </Animated.View>

          {/* App Title */}
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
            <Text style={styles.appSubtitle}>Professional Event Marketing Solutions</Text>
          </Animated.View>

          {/* Loading Indicator */}
          <Animated.View
            style={[
              styles.loadingContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={[styles.loadingDots, { backgroundColor: theme.colors.cardBackground }]}>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
            </View>
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
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.05,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: screenHeight * 0.05,
  },
  logoCircle: {
    width: screenWidth * 0.25,
    height: screenWidth * 0.25,
    borderRadius: screenWidth * 0.125,
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
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
  },
  logoText: {
    fontSize: Math.min(screenWidth * 0.08, 32),
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: screenHeight * 0.08,
  },
  appTitle: {
    fontSize: Math.min(screenWidth * 0.08, 32),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: screenHeight * 0.01,
    letterSpacing: 3,
  },
  appSubtitle: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default SplashScreen; 