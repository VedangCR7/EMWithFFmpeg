import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabBarStyle, getTabBarItemStyle, getTabBarLabelStyle } from '../utils/notchUtils';
import authService from '../services/auth';
import DebugInfo from '../components/DebugInfo';
import { useTheme } from '../context/ThemeContext';

// Define navigation types
export type RootStackParamList = {
  MainApp: undefined;
  Login: undefined;
  Registration: undefined;
  Splash: undefined;
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
  };
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
  LikedItems: undefined;
  ApiTest: undefined;
  FFmpegTest: undefined;
};

export type TabParamList = {
  Home: undefined;
  Templates: undefined;
  Greetings: undefined;
  Profile: undefined;
};

// Import screens (you'll create these)
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventsScreen from '../screens/EventsScreen';
import BusinessProfilesScreen from '../screens/BusinessProfilesScreen';
import TestScreen from '../screens/TestScreen';
import SimpleTestScreen from '../screens/SimpleTestScreen';
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
import LikedItemsScreen from '../screens/LikedItemsScreen';
import ApiTestScreen from '../screens/ApiTestScreen';
import FFmpegTestScreen from '../screens/FFmpegTestScreen';

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
        name="LikedItems" 
        component={LikedItemsScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="ApiTest" 
        component={ApiTestScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="FFmpegTest" 
        component={FFmpegTestScreen}
        options={{ headerShown: false }}
      />
    </MainStack.Navigator>
  );
};

// Main tab navigator
const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  
  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: 8,
          paddingBottom: Math.max(12, insets.bottom + 4),
          height: 60 + insets.bottom + 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
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
        name="Greetings" 
        component={GreetingTemplatesScreen}
        options={{
          title: 'Greetings',
          tabBarIcon: ({ color, size }) => (
            <Icon name="celebration" size={size} color={color} />
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

  useEffect(() => {
    console.log('AppNavigator: Starting initialization');
    
    // Simple timeout to ensure we don't get stuck
    const timeout = setTimeout(() => {
      console.log('AppNavigator: Timeout reached, setting loading to false');
      setIsLoading(false);
    }, 3000);

    // Listen to authentication state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log('AppNavigator: Auth state changed:', user ? 'User logged in' : 'User logged out');
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  console.log('AppNavigator: Rendering with isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  // Show splash screen while loading
  if (isLoading) {
    console.log('AppNavigator: Showing splash screen');
    return (
      <NavigationContainer>
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
  console.log('AppNavigator: Showing main navigation, isAuthenticated:', isAuthenticated);
  
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          // Authenticated user - show main app
          <Stack.Screen 
            name="MainApp" 
            component={TabNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          // Not authenticated - show auth screens
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Registration" 
              component={RegistrationScreen}
              options={{ 
                headerShown: false
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 