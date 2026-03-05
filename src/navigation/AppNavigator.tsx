import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabBarStyle, getTabBarItemStyle, getTabBarLabelStyle } from '../utils/notchUtils';
import authService from '../services/auth';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { navigationRef, navigate as navigateService } from './NavigationService';
import logger from '../utils/logger';
import {
  Image,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  InteractionManager,
} from 'react-native';

// Responsive scaling functions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Device size helpers
const isSmallDevice = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH >= 768;

// Define navigation types
export type RootStackParamList = {
  MainApp: undefined;
  Login: undefined;
  Registration: undefined;
  ForgotPassword: undefined;
  VerifyResetCode: { email: string };
  ResetPassword: { email: string; code: string };
  EmailVerification: { email: string };
  Splash: undefined;
  PrivacyPolicy: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  PosterEditor: {
    selectedImage: {
      uri: string;
      title?: string;
      description?: string;
    };
    selectedLanguage: string;
    selectedTemplateId: string;
  };
  PosterPlayer: {
    selectedPoster: any;
    relatedPosters: any[];
    searchQuery?: string;
    templateSource?: 'greeting' | 'professional' | 'featured';
    businessCategory?: string | { name: string };
    greetingCategory?: string;
    originScreen?: string;
    posterLimit?: number;
    calendarDate?: string;
  };
  AboutUs: undefined;
  PrivacyPolicy: undefined;
  PosterPreview: {
    capturedImageUri: string;
    selectedImage: {
      uri: string;
      title?: string;
      description?: string;
    };
    selectedLanguage: string;
    selectedTemplateId: string;
    selectedBusinessProfile?: any;
  };
  VideoEditor: {
    selectedVideo: {
      uri: string;
      title?: string;
      description?: string;
    };
    selectedLanguage: string;
    selectedTemplateId: string;
  };
  VideoPlayer: {
    selectedVideo: any;
    relatedVideos: any[];
  };
  VideoPreview: {
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
  BusinessProfiles: undefined;
  Events: undefined;
  Subscription: undefined;
  TransactionHistory: undefined;
  GreetingTemplates: undefined;
  GreetingEditor: {
    template: any;
  };
  MyPosters: undefined;
  HelpSupport: { scrollToFAQ?: boolean } | undefined;
  TodaysPick: undefined;
  Templates: undefined;
  Greetings: undefined;
  Profile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Templates: undefined;
  PosterPlayer: undefined;
  Greetings: undefined;
  Profile: undefined;
};

// Import screens (you'll create these)
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyResetCodeScreen from '../screens/VerifyResetCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventsScreen from '../screens/EventsScreen';
import BusinessProfilesScreen from '../screens/BusinessProfilesScreen';
import TemplateGalleryScreen from '../screens/TemplateGalleryScreen';
import PosterEditorScreen from '../screens/PosterEditorScreen';
import PosterPreviewScreen from '../screens/PosterPreviewScreen';
import VideoEditorScreen from '../screens/VideoEditorScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import PosterPlayerScreen from '../screens/PosterPlayerScreen';
import VideoPreviewScreen from '../screens/VideoPreviewScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import GreetingTemplatesScreen from '../screens/GreetingTemplatesScreen';
import GreetingEditorScreen from '../screens/GreetingEditorScreen';
import MyPostersScreen from '../screens/MyPostersScreen';
import businessCategoryPostersApi from '../services/businessCategoryPostersApi';
import AboutUsScreen from '../screens/AboutUsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import TodaysPickScreen from '../screens/TodaysPickScreen';
import LinearGradient from 'react-native-linear-gradient';

const Stack = createStackNavigator<RootStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Bottom tab navigator for authenticated users
const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <MainStack.Navigator>
      <MainStack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="PosterEditor" 
        component={PosterEditorScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="PosterPlayer" 
        component={PosterPlayerScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="PosterPreview" 
        component={PosterPreviewScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="VideoEditor" 
        component={VideoEditorScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="VideoPlayer" 
        component={VideoPlayerScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="VideoPreview" 
        component={VideoPreviewScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="BusinessProfiles" 
        component={BusinessProfilesScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="Events" 
        component={EventsScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="TransactionHistory" 
        component={TransactionHistoryScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="GreetingTemplates" 
        component={GreetingTemplatesScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="GreetingEditor" 
        component={GreetingEditorScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="MyPosters" 
        component={MyPostersScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="AboutUs" 
        component={AboutUsScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="HelpSupport" 
        component={HelpSupportScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="TodaysPick" 
        component={TodaysPickScreen}
        options={{ headerShown: false }}
      />
    </MainStack.Navigator>
  );
};

// Custom Tab Bar Component with Overlapping Logo - Compact & Responsive
const CustomTabBar = (props: any) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoadingPosters, setIsLoadingPosters] = React.useState(false);
  
  const isPosterPlayerFocused = props.state.routes[props.state.index]?.name === 'PosterPlayer';
  const isHomeFocused = props.state.routes[props.state.index]?.name === 'Home';
  
  // Dynamic dimensions for screen rotation/resize support
  const [dimensions, setDimensions] = React.useState(() => {
    const { width } = Dimensions.get('window');
    return { width };
  });

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width });
    });

    return () => subscription?.remove();
  }, []);

  // Dynamic scaling based on current dimensions
  const currentScale = (size: number) => (dimensions.width / 375) * size;
  const currentModerateScale = (size: number, factor = 0.5) => size + (currentScale(size) - size) * factor;
  const isCurrentlySmall = dimensions.width < 375;
  
  // Ultra-compact responsive sizes - maximally reduced
  const logoSize = currentModerateScale(isCurrentlySmall ? 36 : 42);
  const logoContainerSize = logoSize + currentModerateScale(6);
  const logoTopOffset = -(logoContainerSize / 2);
  const tabBarHeight = currentModerateScale(isCurrentlySmall ? 40 : 44); // Increased for small devices
  const tabBarPaddingTop = currentModerateScale(0);
  const tabBarPaddingBottom = Math.max(currentModerateScale(6), insets.bottom + currentModerateScale(2));  const iconSize = currentModerateScale(isCurrentlySmall ? 24 : 20); // Increased from 22 to 24 for small devices
  const fontSize = currentModerateScale(isCurrentlySmall ? 10 : 8); // Increased from 9 to 10 for small devices
  const borderWidth = currentModerateScale(0.8); // Further reduced from 1
  

  // Default behavior: load posters for user's category
  const loadPostersForUserCategory = React.useCallback(async () => {
    setIsLoadingPosters(true);

    try {
      // Get user's business category and fetch posters with higher limit to work around backend limitation
      const response = await businessCategoryPostersApi.getUserCategoryPosters();

      if (response?.success && response.data?.posters && response.data.posters.length > 0) {
        // Map BusinessCategoryPoster to Template format for PosterPlayerScreen
        const mapPosterToTemplate = (poster: any) => ({
          id: poster.id,
          name: poster.title || 'Poster',
          thumbnail: poster.imageUrl || poster.thumbnail || '',
          category: poster.category || response.data.category || 'General',
          downloads: poster.downloads || 0,
          isDownloaded: false,
          languages: [],
          tags: poster.tags || [],
        });

        const selectedPoster = mapPosterToTemplate(response.data.posters[0]);
        const relatedPosters = response.data.posters.slice(1).map(mapPosterToTemplate);

        // Navigate to PosterPlayerScreen with posters
        const navigationParams = {
          selectedPoster,
          relatedPosters,
          searchQuery: '',
          businessCategory: response.data.category, // Pass the business category to PosterPlayerScreen
          posterLimit: 200, // Add high limit to ensure more posters are loaded
        };

        if (navigationRef.isReady()) {
          navigateService('PosterPlayer', navigationParams);
        } else {
          const parentNavigator = props.navigation.getParent();
          if (parentNavigator) {
            parentNavigator.navigate('PosterPlayer', navigationParams);
          } else {
            props.navigation.navigate('PosterPlayer', navigationParams);
          }
        }
      } else {
        logger.warn('⚠️ [NAVBAR] No posters available for user category');
        Alert.alert(
          'No posters available',
          'We could not find posters for your business category right now. Please try again later.',
        );
      }
    } catch (error) {
      logger.error('❌ [NAVBAR] Error loading user category posters:', error);
      Alert.alert(
        'Unable to load posters',
        'Something went wrong while loading your posters. Please try again later.',
      );
    } finally {
      setIsLoadingPosters(false);
    }
  }, [props.navigation]);

  const handlePosterPlayerShortcut = React.useCallback(async () => {
    await loadPostersForUserCategory();
  }, [loadPostersForUserCategory]);

  const handleTodaysPickPress = React.useCallback(() => {
    const parentNavigator = props.navigation.getParent();
    if (parentNavigator) {
      parentNavigator.navigate('TodaysPick');
    } else {
      props.navigation.navigate('TodaysPick' as any);
    }
  }, [props.navigation]);

  // Animation for floating icon
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const borderAnim = React.useRef(new Animated.Value(0)).current;
  const shadowAnim = React.useRef(new Animated.Value(0)).current;
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const pressAnim = React.useRef(new Animated.Value(1)).current;
  const rippleAnim1 = React.useRef(new Animated.Value(0)).current;
  const rippleAnim2 = React.useRef(new Animated.Value(0)).current;
  const logoRotateAnim = React.useRef(new Animated.Value(0)).current;
  const sparkleAnim = React.useRef(new Animated.Value(0)).current;
  const bgColorAnim = React.useRef(new Animated.Value(0)).current;
  const entranceAnim = React.useRef(new Animated.Value(0)).current;

  // Store animation references to restart them when Home is focused
  const animationRefs = React.useRef<{
    pulseAnimation?: Animated.CompositeAnimation;
    borderAnimation?: Animated.CompositeAnimation;
    shadowAnimation?: Animated.CompositeAnimation;
    floatAnimation?: Animated.CompositeAnimation;
    rippleAnimation1?: Animated.CompositeAnimation;
    rippleAnimation2?: Animated.CompositeAnimation;
    logoRotationAnimation?: Animated.CompositeAnimation;
    sparkleAnimation?: Animated.CompositeAnimation;
    bgColorAnimation?: Animated.CompositeAnimation;
    entranceAnimation?: Animated.CompositeAnimation;
  }>({});

  const startAnimations = React.useCallback(() => {
    // Stop existing animations first (only if they exist and are running)
    Object.values(animationRefs.current).forEach(anim => {
      if (anim) {
        try {
          anim.stop();
        } catch (e) {
          // Animation might already be stopped, ignore error
        }
      }
    });

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Border animation - pulsing border
    const borderAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // Border width/color can't use native driver
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    // Shadow/Glow animation - pulsing shadow
    const shadowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shadowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // Shadow can't use native driver
        }),
        Animated.timing(shadowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    // Floating/Levitating animation - subtle up and down movement
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Ripple effect - expanding circles
    const rippleAnimation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    const rippleAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(rippleAnim2, {
          toValue: 1,
          duration: 3000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    // Logo rotation animation - subtle rotation
    const logoRotationAnimation = Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Sparkle/Shimmer animation
    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Background color pulse animation
    const bgColorAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bgColorAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // Color can't use native driver
        }),
        Animated.timing(bgColorAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    // Entrance bounce animation - runs once on mount
    const entranceAnimation = Animated.sequence([
      Animated.spring(entranceAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    // Store animation references
    animationRefs.current = {
      pulseAnimation,
      borderAnimation,
      shadowAnimation,
      floatAnimation,
      rippleAnimation1,
      rippleAnimation2,
      logoRotationAnimation,
      sparkleAnimation,
      bgColorAnimation,
      entranceAnimation,
    };

    // Start all animations
    pulseAnimation.start();
    borderAnimation.start();
    shadowAnimation.start();
    floatAnimation.start();
    rippleAnimation1.start();
    rippleAnimation2.start();
    logoRotationAnimation.start();
    sparkleAnimation.start();
    bgColorAnimation.start();
    entranceAnimation.start();
  }, [pulseAnim, borderAnim, shadowAnim, floatAnim, rippleAnim1, rippleAnim2, logoRotateAnim, sparkleAnim, bgColorAnim, entranceAnim]);

  // Start animations on mount - start immediately and also after interactions complete
  React.useEffect(() => {
    // Start animations immediately to ensure they begin right away
    const timeoutId = setTimeout(() => {
      startAnimations();
    }, 50);
    
    // Also restart after interactions complete to ensure they continue during loading
    const interaction = InteractionManager.runAfterInteractions(() => {
      startAnimations();
    });

    return () => {
      clearTimeout(timeoutId);
      interaction.cancel();
      Object.values(animationRefs.current).forEach(anim => {
        if (anim) {
          try {
            anim.stop();
          } catch (e) {
            // Ignore errors when stopping
          }
        }
      });
    };
  }, [startAnimations]);

  // Restart animations when Home screen is focused - ensure they continue during loading
  React.useEffect(() => {
    if (isHomeFocused) {
      // Use InteractionManager to ensure smooth restart, but also start immediately
      // This ensures animations start even during loading
      startAnimations();
      const interaction = InteractionManager.runAfterInteractions(() => {
        // Restart to ensure they're running smoothly after interactions complete
        startAnimations();
      });
      return () => {
        interaction.cancel();
      };
    }
  }, [isHomeFocused, startAnimations]);

  const pulseScale = pulseAnim;
  const animatedBorderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 4],
  });
  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.primary, theme.colors.secondary],
  });
  
  // Shadow animation values
  const animatedShadowRadius = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 16],
  });
  const animatedShadowOpacity = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });
  
  // Floating animation - vertical movement
  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  
  // Press animation handler
  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  // Ripple animation values
  const ripple1Scale = rippleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });
  const ripple1Opacity = rippleAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const ripple2Scale = rippleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });
  const ripple2Opacity = rippleAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  // Logo rotation
  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Sparkle opacity
  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  // Background color interpolation
  const animatedBgColor = bgColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', theme.colors.primary + '15'], // Primary color with low opacity
  });

  // Entrance animation
  const entranceScale = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (isPosterPlayerFocused) {
    return null;
  }

  // Calculate FAB position - above the navbar
  const fabSize = currentModerateScale(isCurrentlySmall ? 48 : 56);
  const fabBottomOffset = tabBarHeight + tabBarPaddingBottom + currentModerateScale(16);

  return (
    <View style={{ position: 'relative', width: '100%' }}>
    <View style={{
      backgroundColor: theme.colors.surface,
      borderTopWidth: currentModerateScale(0.3), // Further reduced from 0.5
      borderTopColor: theme.colors.border,
      paddingTop: tabBarPaddingTop,
      paddingBottom: tabBarPaddingBottom,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: currentModerateScale(-0.5) }, // Further reduced from -1
      shadowOpacity: 0.05, // Further reduced from 0.08
      shadowRadius: currentModerateScale(2), // Further reduced from 3
      elevation: 4, // Further reduced from 6
      position: 'relative',
    }}>
      {/* Background overlay to hide any squares behind the circle */}
      <View style={{
        position: 'absolute',
        top: logoTopOffset,
        left: '50%',
        marginLeft: -(logoContainerSize / 2),
        zIndex: 999,
        backgroundColor: theme.colors.surface,
        width: logoContainerSize,
        height: logoContainerSize,
        borderRadius: logoContainerSize / 2,
      }} />
      
      {/* Logo positioned to overlap with screen content - Clickable to navigate to Poster Player */}
      <TouchableOpacity
        onPress={handlePosterPlayerShortcut}
        activeOpacity={0.7}
        style={{
          position: 'absolute',
          top: logoTopOffset,
          left: '50%',
          marginLeft: -(logoContainerSize / 2),
          zIndex: 1000,
          backgroundColor: theme.colors.surface,
          width: logoContainerSize,
          height: logoContainerSize,
          borderRadius: logoContainerSize / 2,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: currentModerateScale(0.5) }, // Further reduced from 1
          shadowOpacity: 0.08, // Further reduced from 0.12
          shadowRadius: currentModerateScale(4), // Further reduced from 6
          elevation: 4, // Further reduced from 6
          borderWidth: borderWidth,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        }}
      >
        <Image
          source={require('../assets/MainLogo/MB.png')}
          style={{
            width: logoSize,
            height: logoSize,
            resizeMode: 'contain',
          }}
        />
      </TouchableOpacity>
      
      {/* Tab Bar */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: tabBarHeight,
        marginTop: currentModerateScale(10), // Add space for the circular overlapping logo
      }}>
        {props.state.routes.map((route: any, index: number) => {
          const { options } = props.descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = props.state.index === index;

          const onPress = () => {
            if (route.name === 'PosterPlayer') {
              handlePosterPlayerShortcut();
              return;
            }

            const event = props.navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              props.navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            props.navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: currentModerateScale(4),
              }}
            >
              {options.tabBarIcon ? (
                options.tabBarIcon({
                  focused: isFocused,
                  color: isFocused ? theme.colors.primary : theme.colors.textSecondary,
                  size: iconSize,
                })
              ) : (
                // Add invisible spacer for tabs without icon to maintain text alignment
                <View style={{ height: iconSize }} />
              )}
              <Text style={{
                fontSize: fontSize,
                fontWeight: '600',
                marginTop: currentModerateScale(0.3), // Further reduced from 0.5
                color: isFocused ? theme.colors.primary : theme.colors.textSecondary,
              }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>

    {/* Loading overlay while fetching user category posters */}
    <Modal transparent animationType="fade" visible={isLoadingPosters}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.35)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surface,
            padding: 20,
            borderRadius: 14,
            width: 220,
            alignItems: 'center',
            gap: 10,
          }}
        >
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: theme.colors.text,
              textAlign: 'center',
            }}
          >
            Loading posters...
          </Text>
        </View>
      </View>
    </Modal>

    {/* Floating Action Button - Today's Pick - Only show on Home screen */}
    {isHomeFocused && (
      <Animated.View
        style={{
          position: 'absolute',
          bottom: fabBottomOffset,
          right: currentModerateScale(16),
          transform: [
            { scale: pulseScale },
            { translateY: floatTranslateY },
            { scale: entranceScale },
          ],
          zIndex: 1001,
        }}
      >
      {/* Ripple Effect 1 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          borderWidth: 2,
          borderColor: theme.colors.primary,
          transform: [{ scale: ripple1Scale }],
          opacity: ripple1Opacity,
        }}
      />
      
      {/* Ripple Effect 2 */}
      <Animated.View
        style={{
          position: 'absolute',
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          borderWidth: 2,
          borderColor: theme.colors.secondary,
          transform: [{ scale: ripple2Scale }],
          opacity: ripple2Opacity,
        }}
      />

      <Animated.View
        style={{
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          borderWidth: animatedBorderWidth,
          borderColor: animatedBorderColor,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: currentModerateScale(4) },
          shadowOpacity: animatedShadowOpacity,
          shadowRadius: animatedShadowRadius,
          elevation: 12,
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale: pressAnim }],
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
            onPress={handleTodaysPickPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: fabSize / 2,
              justifyContent: 'center',
              alignItems: 'center',
              padding: currentModerateScale(4),
              overflow: 'hidden',
            }}
          >
            {/* Yellow-Orange Gradient Background */}
            <LinearGradient
              colors={['#FFD700', '#FF8C00', '#FF6347']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: fabSize / 2,
                zIndex: 1,
              }}
            />
            
            {/* Sparkle/Shimmer overlay - reduced opacity */}
            <Animated.View
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                opacity: sparkleOpacity,
                borderRadius: fabSize / 2,
                zIndex: 2,
              }}
            />
            
            {/* Today's Pick Text */}
            <Animated.View
              style={{
                zIndex: 3,
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: currentModerateScale(9),
                  fontWeight: '700',
                  textAlign: 'center',
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                  letterSpacing: 0.3,
                }}
                numberOfLines={2}
              >
                Today's{'\n'}Pick
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
    )}
    </View>
  );
};

// Main tab navigator
const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  
  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 0 }}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Templates" 
        component={TemplateGalleryScreen}
        options={{
          title: 'Templates',
          tabBarIcon: ({ color, size }) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="PosterPlayer" 
        component={PosterPlayerScreen}
        options={{
          title: 'My Business',
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen 
        name="Greetings" 
        component={GreetingTemplatesScreen}
        options={{
          title: 'Greetings',
          tabBarIcon: ({ color, size }) => (
            <Icon name="auto-awesome" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main app navigator with authentication state
const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { refreshSubscription, refreshTransactions } = useSubscription();

  useEffect(() => {
    logger.log('🚀 AppNavigator: Starting initialization');
    let authStateReceived = false;
    let authUser: any = null;
    const startTime = Date.now();
    const MIN_SPLASH_TIME = 2000; // Reduced to 2 seconds for faster app startup
    
    // Extended timeout to allow intro video to play fully before checking auth state
    const timeout = setTimeout(() => {
      if (!authStateReceived) {
        logger.warn('⚠️ AppNavigator: Timeout reached without auth state - showing login');
        setIsLoading(false);
        setIsAuthenticated(false);
      }
    }, 5000); // Reduced to 5 seconds timeout for auth state

    // Listen to authentication state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      authStateReceived = true;
      authUser = user;
      clearTimeout(timeout); // Clear timeout once we get auth state
      
      logger.log('🔔 AppNavigator: Auth state changed:', user ? '✅ User logged in' : '❌ User logged out');
      if (user) {
        logger.log('👤 User ID:', user.id || user.uid);
        logger.log('📧 User Email:', user.email);
        
        // Preload subscription and transaction data for logged-in users
        logger.log('📡 Preloading subscription and transaction data...');
        refreshSubscription().then(() => {
          logger.log('✅ Subscription data preloaded');
        }).catch((error) => {
          logger.error('❌ Error preloading subscription data:', error);
        });
        
        refreshTransactions().then(() => {
          logger.log('✅ Transaction data preloaded');
        }).catch((error) => {
          logger.error('❌ Error preloading transaction data:', error);
        });
      }
      
      // Calculate remaining time for minimum splash display
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_SPLASH_TIME - elapsedTime);
      
      logger.log(`⏱️ Elapsed: ${elapsedTime}ms, Waiting: ${remainingTime}ms before navigation`);
      
      // Wait for minimum splash time before navigating
      setTimeout(() => {
        setIsAuthenticated(!!authUser);
        setIsLoading(false);
        logger.log('🎬 Minimum splash time reached - navigating now');
      }, remainingTime);
    });

    // Explicitly call initialize to ensure async loading completes
    authService.initialize().catch((error) => {
      logger.error('❌ AppNavigator: Error initializing auth service:', error);
      authStateReceived = true;
      clearTimeout(timeout);
      
      // Still respect minimum time even on error
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_SPLASH_TIME - elapsedTime);
      
      setTimeout(() => {
        setIsLoading(false);
        setIsAuthenticated(false);
      }, remainingTime);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  logger.log('🎨 AppNavigator: Rendering with isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  // Show splash screen while loading
  if (isLoading) {
    logger.log('AppNavigator: Showing splash screen');
    return (
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator>
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Show main navigation
  logger.log('AppNavigator: Showing main navigation, isAuthenticated:', isAuthenticated);
  
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        {isAuthenticated ? (
          <Stack.Screen 
            name="MainApp" 
            component={TabNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Registration" 
              component={RegistrationScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="VerifyResetCode" 
              component={VerifyResetCodeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ResetPassword" 
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="EmailVerification" 
              component={EmailVerificationScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
        {/* Privacy Policy - accessible from both authenticated and unauthenticated states */}
        <Stack.Screen 
          name="PrivacyPolicy" 
          component={PrivacyPolicyScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 