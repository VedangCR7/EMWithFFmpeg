// HomeScreen comprehensively optimized for all device sizes with ultra-compact header, search bar, and content sizing
// Performance optimizations: FastImage for better image loading and caching, lazy loading for lists
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  SectionList,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
  Linking,
  Platform,
  InteractionManager,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/types';
import dashboardService, { Banner, Template } from '../services/dashboard';
import homeApi, {
  FeaturedContent,
  VideoContent
} from '../services/homeApi';
import greetingTemplatesService from '../services/greetingTemplates';
import businessCategoryPostersApi from '../services/businessCategoryPostersApi';
import businessCategoriesService, { BusinessCategory } from '../services/businessCategoriesService';
import businessProfileService, { BusinessProfile } from '../services/businessProfile';
import calendarApi, { CalendarPoster } from '../services/calendarApi';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useBusinessProfile } from '../context/BusinessProfileContext';
import authService from '../services/auth';
import { performanceMonitor } from '../utils/performanceMonitor';
import { requestDeduplication } from '../utils/requestDeduplication';
import { RequestDeduplication } from '../utils/requestDeduplication';
// import SimpleFestivalCalendar from '../components/SimpleFestivalCalendar';
import OptimizedImage from '../components/OptimizedImage';
import ComingSoonModal from '../components/ComingSoonModal';
import HorizontalFestivalCalendar from '../components/HorizontalFestivalCalendar';
import BusinessCategoriesSection from '../components/sections/BusinessCategoriesSection';
import GeneralCategoriesSection from '../components/sections/GeneralCategoriesSection';
import responsiveUtils, {
  responsiveSpacing,
  responsiveFontSize,
  responsiveSize,
  responsiveLayout,
  responsiveShadow,
  responsiveText,
  responsiveGrid,
  responsiveButton,
  responsiveInput,
  responsiveCard
} from '../utils/responsiveUtils';

// Compact spacing multiplier to reduce all spacing
const COMPACT_MULTIPLIER = 0.5;

const devWarn = __DEV__ ? console.warn : () => { };
const devError = __DEV__ ? console.error : () => { };

// Memoized Template Card Component to avoid recreating Animated.Value on every render
interface TemplateCardProps {
  item: Template;
  cardWidth: number;
  theme: any;
  onPress: (template: Template) => void;
}

// Search result item interfaces
interface SearchResultCategory {
  type: 'category';
  data: {
    name: string;
    type: 'business' | 'general';
    templates: Template[];
  };
}

interface SearchResultTemplate {
  type: 'template';
  data: Template;
}


// Hierarchical search result interfaces for parent category support
interface ChildCategory {
  name: string;
  images: Template[];
  templates?: Template[];
  id?: string | number;
  icon?: string;
  imageUrl?: string;
  color?: string;
}

interface HierarchicalSearchResult {
  parentCategory: string;
  categories: ChildCategory[];
  total?: number;
}

interface HierarchicalSearchItem {
  type: 'parentCategory' | 'childCategory' | 'template';
  data: any;
}

const TemplateCard: React.FC<TemplateCardProps> = React.memo(({ item, cardWidth, theme, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const animationRef = React.useRef<Animated.CompositeAnimation | null>(null);

  const handlePressIn = useCallback(() => {
    // Stop any ongoing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }
    animationRef.current = Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    });
    animationRef.current.start(() => {
      animationRef.current = null;
    });
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    // Stop any ongoing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }
    animationRef.current = Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    });
    animationRef.current.start(() => {
      animationRef.current = null;
    });
  }, [scaleAnim]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, []);

  const handleCardPress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleCardPress}
      style={styles.templateCardWrapper}
    >
      <Animated.View
        style={[
          styles.templateCard,
          {
            backgroundColor: theme.colors.cardBackground,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={[styles.templateImageContainer, { height: cardWidth }]}>
          <OptimizedImage
            uri={item.thumbnail}
            style={styles.templateImage}
            resizeMode="cover"
            mode="thumbnail"
            cacheKey={`template_${item.id}`}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false if different (re-render)
  if (prevProps === nextProps) return true;

  // Check item ID and thumbnail first (most likely to change)
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.item.thumbnail !== nextProps.item.thumbnail) return false;

  // Check dimensions
  if (prevProps.cardWidth !== nextProps.cardWidth) return false;

  // Check theme colors (not object reference)
  if (prevProps.theme?.colors?.cardBackground !== nextProps.theme?.colors?.cardBackground) return false;

  // All props are equal, skip re-render
  return true;
});

TemplateCard.displayName = 'TemplateCard';

interface BusinessCategoryCardItemProps {
  item: BusinessCategory;
  cardWidth: number;
  theme: any;
  previewTemplates?: Template[];
  onPress: (category: BusinessCategory) => void;
}

const BusinessCategoryCardItem: React.FC<BusinessCategoryCardItemProps> = React.memo(
  ({ item, cardWidth, theme, previewTemplates, onPress }) => {
    const handlePress = useCallback(() => {
      onPress(item);
    }, [item, onPress]);

    const displayImage = useMemo(() => {
      const thumbnails =
        previewTemplates
          ?.map((template) => template.thumbnail)
          .filter((uri): uri is string => typeof uri === 'string' && uri.length > 0) ?? [];

      if (thumbnails.length > 0) {
        return thumbnails[0]; // Only use the first image
      }

      return item.imageUrl || (item as any).image || null;
    }, [previewTemplates, item]);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.businessCategoryCard, { width: cardWidth }]}
        onPress={handlePress}
      >
        <View
          style={[
            styles.businessCategoryCardContent,
            {
              backgroundColor: theme.colors.cardBackground,
              height: cardWidth,
            },
          ]}
        >
          <View style={styles.businessCategoryImageSection}>
            {displayImage ? (
              <OptimizedImage
                uri={displayImage}
                style={styles.businessCategoryImage}
                resizeMode="cover"
                mode="thumbnail"
                cacheKey={`category_${item.id}`}
              />
            ) : (
              <View
                style={[
                  styles.businessCategoryImage,
                  {
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                  },
                ]}
              >
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { justifyContent: 'flex-end', padding: moderateScale(6) },
              ]}
              pointerEvents="none"
            >
              <Text
                style={[styles.businessCategoryName, { color: '#ffffff', textAlign: 'left' }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) => {
    if (prev.cardWidth !== next.cardWidth) return false;
    if (prev.item.id !== next.item.id) return false;
    if (prev.previewTemplates !== next.previewTemplates) return false;
    if (prev.theme?.colors?.cardBackground !== next.theme?.colors?.cardBackground) return false;
    return true;
  }
);

BusinessCategoryCardItem.displayName = 'BusinessCategoryCardItem';

// Memoized Video Template Card Component
interface VideoTemplateCardProps {
  item: VideoContent;
  cardWidth: number;
  theme: any;
  playIconSize: number;
  onPress: () => void;
}

const VideoTemplateCard: React.FC<VideoTemplateCardProps> = React.memo(({ item, cardWidth, theme, playIconSize, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const animationRef = React.useRef<Animated.CompositeAnimation | null>(null);

  const handlePressIn = useCallback(() => {
    // Stop any ongoing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }
    animationRef.current = Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    });
    animationRef.current.start(() => {
      animationRef.current = null;
    });
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    // Stop any ongoing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }
    animationRef.current = Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    });
    animationRef.current.start(() => {
      animationRef.current = null;
    });
  }, [scaleAnim]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, []);

  const handleCardPress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleCardPress}
      style={styles.templateCardWrapper}
    >
      <Animated.View
        style={[
          styles.templateCard,
          {
            backgroundColor: theme.colors.cardBackground,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={[styles.templateImageContainer, { height: cardWidth }]}>
          <OptimizedImage
            uri={item.thumbnail}
            style={styles.templateImage}
            resizeMode="cover"
            mode="thumbnail"
            cacheKey={`video_${item.id}`}
          />
          <View style={styles.videoPlayOverlay}>
            <Icon name="play-arrow" size={playIconSize} color="#ffffff" />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false if different (re-render)
  if (prevProps === nextProps) return true;

  // Check item ID and thumbnail first (most likely to change)
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.item.thumbnail !== nextProps.item.thumbnail) return false;

  // Check dimensions and icon size
  if (prevProps.cardWidth !== nextProps.cardWidth) return false;
  if (prevProps.playIconSize !== nextProps.playIconSize) return false;

  // Check theme colors (not object reference)
  if (prevProps.theme?.colors?.cardBackground !== nextProps.theme?.colors?.cardBackground) return false;

  // All props are equal, skip re-render
  return true;
});

VideoTemplateCard.displayName = 'VideoTemplateCard';

// Memoized Greeting Category Card Component
interface GreetingCategoryCardProps {
  item: { id: string; name: string; icon: string; color?: string };
  cardWidth: number;
  theme: any;
  categoryImage: string | null;
  onPress: (item: { id: string; name: string; icon: string; color?: string }, categoryImage: string | null) => void;
}

const GreetingCategoryCard: React.FC<GreetingCategoryCardProps> = React.memo(({ item, cardWidth, theme, categoryImage, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(item, categoryImage);
  }, [item, categoryImage, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.businessCategoryCard, { width: cardWidth }]}
      onPress={handlePress}
    >
      <View style={[
        styles.businessCategoryCardContent,
        {
          backgroundColor: theme.colors.cardBackground,
          height: cardWidth, // Make cards square
        }
      ]}>
        <View style={styles.businessCategoryImageSection}>
          {categoryImage ? (
            <OptimizedImage
              uri={categoryImage}
              style={styles.businessCategoryImage}
              resizeMode="cover"
              mode="thumbnail"
              cacheKey={`greeting_category_${item.id}`}
            />
          ) : (
            <View
              style={[
                styles.businessCategoryImage,
                { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
              ]}
            >
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { justifyContent: 'flex-end', padding: 6 },
            ]}
            pointerEvents="none"
          >
            <Text
              style={[styles.businessCategoryName, { color: '#ffffff', textAlign: 'left' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  if (prevProps === nextProps) return true;

  // Check item ID and name first
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.item.name !== nextProps.item.name) return false;
  if (prevProps.item.icon !== nextProps.item.icon) return false;

  // Check dimensions
  if (prevProps.cardWidth !== nextProps.cardWidth) return false;

  // Check category image
  if (prevProps.categoryImage !== nextProps.categoryImage) return false;

  // Check theme colors (not object reference)
  if (prevProps.theme?.colors?.cardBackground !== nextProps.theme?.colors?.cardBackground) return false;

  // All props are equal, skip re-render
  return true;
});

GreetingCategoryCard.displayName = 'GreetingCategoryCard';

// Memoized Greeting Card Component
interface GreetingCardProps {
  item: any;
  cardWidth: number;
  theme: any;
  categoryTemplates: any[];
  searchQuery?: string;
  navigation: any;
  onCardPress?: (template: any) => void;
}

const GreetingCard: React.FC<GreetingCardProps> = React.memo(({ item, cardWidth, theme, categoryTemplates, searchQuery, navigation, onCardPress }) => {
  // Pre-compute related templates to avoid filtering on every press
  const relatedTemplates = useMemo(() => {
    return categoryTemplates.filter(t => t.id !== item.id);
  }, [categoryTemplates, item.id]);

  const handlePress = useCallback(() => {
    if (!item || !item.thumbnail) {
      if (__DEV__) {
        devError('G�� [GREETING CARD] Invalid item:', item);
      }
      return;
    }

    // Navigate immediately - related templates already computed
    // Pass greetingCategory derived from searchQuery so PosterPlayerScreen can fetch the correct templates
    navigation.navigate('PosterPlayer', {
      selectedPoster: item,
      relatedPosters: relatedTemplates,
      searchQuery: searchQuery || '',
      templateSource: 'greeting',
      greetingCategory: searchQuery || undefined, // Pass searchQuery as greetingCategory for proper template fetching
    });

    // Call onCardPress after navigation to avoid blocking
    if (onCardPress) {
      requestAnimationFrame(() => {
        onCardPress(item);
      });
    }
  }, [item, relatedTemplates, searchQuery, navigation, onCardPress]);

  if (!item || !item.thumbnail) {
    return (
      <View style={[styles.templateCard, { height: cardWidth, backgroundColor: theme.colors.cardBackground }]}>
        <View style={[styles.templateImageContainer, { height: cardWidth }]}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.loadingIndicator}
          />
          <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={styles.templateCardWrapper}
    >
      <View
        style={[
          styles.templateCard,
          {
            backgroundColor: theme.colors.cardBackground,
          }
        ]}
      >
        <View style={[styles.templateImageContainer, { height: cardWidth }]}>
          <OptimizedImage
            uri={item.thumbnail}
            style={styles.templateImage}
            resizeMode="cover"
            mode="thumbnail"
            cacheKey={`template_${item.id}`}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  if (prevProps === nextProps) return true;

  // Check item ID and thumbnail first
  if (!prevProps.item || !nextProps.item) return false;
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.item.thumbnail !== nextProps.item.thumbnail) return false;

  // Check dimensions
  if (prevProps.cardWidth !== nextProps.cardWidth) return false;

  // Check theme colors (not object reference)
  if (prevProps.theme?.colors?.cardBackground !== nextProps.theme?.colors?.cardBackground) return false;

  // Check searchQuery
  if (prevProps.searchQuery !== nextProps.searchQuery) return false;

  // Check categoryTemplates length (simplified check - templates array reference might change)
  if (prevProps.categoryTemplates.length !== nextProps.categoryTemplates.length) return false;

  // All critical props are equal, skip re-render (ignore callback functions)
  return true;
});

GreetingCard.displayName = 'GreetingCard';

const convertBusinessPosterToTemplate = (poster: any, categoryName: string): Template => {
  let normalizedTags: string[] = [];
  if (Array.isArray(poster.tags)) {
    normalizedTags = poster.tags
      .map((tag: any) => String(tag).trim())
      .filter((tag: string) => tag.length > 0);
  } else if (typeof poster.tags === 'string') {
    normalizedTags = poster.tags
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);
  }

  // Prioritize thumbnail field (already converted to absolute URL by API service)
  const thumbnail = poster.thumbnail || poster.thumbnailUrl || poster.imageUrl || '';

  return {
    id: poster.id,
    name: poster.title || poster.name || `${categoryName} Poster`,
    thumbnail: thumbnail,
    thumbnailUrl: thumbnail, // Set thumbnailUrl for better compatibility with PosterPlayerScreen
    category: poster.category || categoryName,
    downloads: poster.downloads || 0,
    isDownloaded: false,
    tags: normalizedTags,
  };
};

const HomeScreen: React.FC = React.memo(() => {
  const { isDarkMode, theme } = useTheme();
  const { isSubscriptionActive, refreshSubscription } = useSubscription();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();

  // Get current user info
  const userProfileSectionRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const [userProfile, setUserProfile] = useState(() => authService.getCurrentUser());
  const [userBusinessProfiles, setUserBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [businessProfilesLoadingState, setBusinessProfilesLoadingState] = useState(false);
  const { selectedBusinessProfile, setSelectedBusinessProfile, initializeSelectedProfile, isLoading: isContextLoading, setSelectedBusinessCategory } = useBusinessProfile();
  const isActive = isSubscriptionActive;
  const selectedBusinessProfileId = selectedBusinessProfile?.id || null;
  const [isBusinessProfileDropdownVisible, setIsBusinessProfileDropdownVisible] = useState(false);
  const [businessProfileDropdownPosition, setBusinessProfileDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // --- Relocated State and Callbacks to fix hoisting ---
  const [activeTab, setActiveTab] = useState('trending');
  const [selectedCategory, setSelectedCategory] = useState<'business' | 'general'>('business');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchCategoryResult[]>([]);

  // Business categories state
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([]);
  const [businessCategoriesLoading, setBusinessCategoriesLoading] = useState(false);
  const [businessCategoryPreviews, setBusinessCategoryPreviews] = useState<Record<string, Template[]>>({});
  const [isBusinessCategoriesHighlighted, setIsBusinessCategoriesHighlighted] = useState(false);
  const [rotatingBusinessCategories, setRotatingBusinessCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [currentBusinessCategoryIndex, setCurrentBusinessCategoryIndex] = useState(0);
  const businessCategoryFadeAnim = useRef(new Animated.Value(1)).current;

  // Greeting categories state
  const [greetingCategoriesList, setGreetingCategoriesList] = useState<Array<{ id: string; name: string; icon: string; color?: string; imageUrl?: string; parentCategoryName?: string }>>([]);
  const [allGreetingCategories, setAllGreetingCategories] = useState<Array<{ id: string; name: string; icon: string; color?: string; imageUrl?: string; parentCategoryName?: string }>>([]);
  const [displayedCategoriesCount, setDisplayedCategoriesCount] = useState(5);
  const [greetingCategoriesLoading, setGreetingCategoriesLoading] = useState(false);
  const [greetingCategoryImages, setGreetingCategoryImages] = useState<Record<string, string>>({});
  const memoizedGreetingCategoryImages = useMemo(() => greetingCategoryImages, [greetingCategoryImages]);

  const filteredGreetingCategoriesList = useMemo(() => {
    return greetingCategoriesList.slice(0, displayedCategoriesCount);
  }, [greetingCategoriesList, displayedCategoriesCount]);

  // Search and Hierarchical results state
  const [hierarchicalResults, setHierarchicalResults] = useState<{ parentCategory: string; categories: any[] } | null>(null);
  const [generalHierarchicalData, setGeneralHierarchicalData] = useState<any[]>([]);
  const [isHierarchical, setIsHierarchical] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const normalizeCategoryData = useCallback((data: any, categoryType: 'business' | 'general'): HierarchicalSearchResult => {
    return {
      parentCategory: data.parentCategory,
      categories: data.categories.map((category: any) => ({
        name: category.name,
        templates: categoryType === 'business' ? (category.images || []) : (category.templates || []),
        id: category.id,
        icon: category.icon,
        imageUrl: category.imageUrl,
        color: category.color
      }))
    };
  }, []);
  // --- End Relocated Block ---


  // Clear business profile selection when user changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(user => {
      setUserProfile(user);

      if (!user) {
        setUserBusinessProfiles([]);
      }
    });

    return unsubscribe;
  }, []);

  // Setup business profile update listener with proper dependencies
  useEffect(() => {
    let isMounted = true;
    
    const handleBusinessProfileUpdate = (event: any) => {
      if (!isMounted) return;
      
      // Refresh business profiles if this is for current user
      const currentUserId = userProfile?.id || authService.getCurrentUser()?.id;
      if (event.userId === currentUserId) {
        refreshBusinessProfiles();
      }
    };

    // Listen for navigation dispatch events (fallback)
    const handleNavigationDispatch = (event: any) => {
      if (!isMounted) return;
      
      if (event.type === 'SET_BUSINESS_PROFILES_REFRESH') {
        refreshBusinessProfiles();
      }
    };

    try {
      // Use React Native's DeviceEventEmitter for cross-screen communication
      const { DeviceEventEmitter } = require('react-native');
      
      const businessProfileSubscription = DeviceEventEmitter.addListener('businessProfileUpdated', handleBusinessProfileUpdate);
      const navigationSubscription = DeviceEventEmitter.addListener('SET_BUSINESS_PROFILES_REFRESH', handleNavigationDispatch);
      
      return () => {
        isMounted = false;
        businessProfileSubscription?.remove?.();
        navigationSubscription?.remove?.();
      };
    } catch (error) {
      // Silently handle setup error to prevent console spam
    }
  }, [userProfile?.id]);

  // Refresh business profiles when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadProfiles = async () => {
        const currentUserId = userProfile?.id || authService.getCurrentUser()?.id;
        if (!currentUserId) return;

        try {
          const profiles = await businessProfileService.getUserBusinessProfiles(currentUserId);
          if (isMounted) {
            setUserBusinessProfiles(profiles);
            // Let BusinessProfileContext handle auto-selection logic
            await initializeSelectedProfile(profiles);
          }
        } catch (error) {
          if (__DEV__) console.error('Error refreshing business profiles:', error);
        } finally {
          if (isMounted) {
            setBusinessProfilesLoadingState(false);
          }
        }
      };

      loadProfiles();

      return () => {
        isMounted = false;
      };
    }, [userProfile?.id, initializeSelectedProfile])
  );

  const refreshBusinessProfiles = useCallback(async () => {
    const currentUserId = userProfile?.id || authService.getCurrentUser()?.id;
    if (!currentUserId) return;

    try {
      setBusinessProfilesLoadingState(true);
      const profiles = await businessProfileService.getUserBusinessProfiles(currentUserId);

      setUserBusinessProfiles(profiles);

      // Let BusinessProfileContext handle auto-selection logic
      await initializeSelectedProfile(profiles);
    } catch (error) {
      console.error('Error refreshing business profiles:', error);
    } finally {
      setBusinessProfilesLoadingState(false);
    }
  }, [userProfile?.id, initializeSelectedProfile]);

  const userName = useMemo(() => {
    return (
      selectedBusinessProfile?.name ||
      userProfile?.displayName ||
      userProfile?.name ||
      userProfile?.companyName ||
      userProfile?.username ||
      'User'
    );
  }, [userProfile, selectedBusinessProfile]);
  const userInitials = useMemo(() =>
    userName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
    [userName]
  );
  const userAvatarUri = useMemo(() => {
    // If a business profile is selected, ONLY use its associated images
    if (selectedBusinessProfile) {
      return (
        selectedBusinessProfile?.logo ||
        selectedBusinessProfile?.companyLogo ||
        selectedBusinessProfile?.profileLogo ||
        selectedBusinessProfile?.businessLogo ||
        selectedBusinessProfile?.image ||
        selectedBusinessProfile?.photo ||
        selectedBusinessProfile?.banner ||
        null
      );
    }

    // If no business is selected (personal profile), use user profile images
    return (
      userProfile?.photo ||
      userProfile?.photoURL ||
      userProfile?.logo ||
      userProfile?.companyLogo ||
      userProfile?.avatar ||
      null
    );
  }, [userProfile, selectedBusinessProfile]);

  // Dynamic dimensions for responsive layout
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Update dimensions on screen rotation/resize
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const [isBusinessCategoriesModalClosing, setIsBusinessCategoriesModalClosing] = useState(false);

  const closeBusinessCategoriesModal = useCallback(() => {
    // Hide content immediately for instant feedback
    setIsBusinessCategoriesModalClosing(true);
    // Hide modal immediately - no delay
    setIsBusinessCategoriesModalVisible(false);
    // Reset closing state after animation would complete
    requestAnimationFrame(() => {
      setIsBusinessCategoriesModalClosing(false);
    });
  }, []);

  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;

  // Dynamic device detection that updates on rotation
  const isTabletDevice = useMemo(() => screenWidth >= 768, [screenWidth]);
  const isLandscapeMode = useMemo(() => screenWidth > screenHeight, [screenWidth, screenHeight]);

  // Responsive icon sizes
  const getIconSize = useCallback((baseSize: number) => {
    const scale = screenWidth / 375; // Base on iPhone 8 width
    return Math.round(baseSize * scale);
  }, [screenWidth]);

  // Responsive card calculations - dynamically adapts to screen size and rotation
  const getCardWidth = useCallback(() => {
    if (isTabletDevice) {
      return screenWidth * 0.15; // 6-7 cards visible on tablet
    } else if (screenWidth >= 600) {
      return screenWidth * 0.22; // 4 cards on medium phones
    } else if (screenWidth >= 400) {
      return screenWidth * 0.28; // 3 cards on regular phones
    } else {
      return screenWidth * 0.32; // 3 cards on small phones with more spacing
    }
  }, [screenWidth, isTabletDevice]);

  const cardWidth = getCardWidth();

  // Helper function for moderateScale (matches the one defined at bottom of file)
  const getModerateScale = useCallback((size: number, factor = 0.5) => {
    const scale = (s: number) => (screenWidth / 375) * s;
    return size + (scale(size) - size) * factor;
  }, [screenWidth]);


  // Helper function for getResponsiveValue (matches the one defined at bottom of file)
  const getResponsiveValue = useCallback((small: number, medium: number, large: number) => {
    if (screenWidth < 400) return small;
    if (screenWidth < 768) return medium;
    return large;
  }, [screenWidth]);

  // Calculate item spacing for getItemLayout (matches templateCardWrapper marginRight)
  const itemSpacing = useMemo(() => {
    return getModerateScale(3);
  }, [getModerateScale]);

  // Memoized getItemLayout for horizontal FlatLists with fixed card width
  const getItemLayout = useCallback((data: any, index: number) => {
    const itemLength = cardWidth + itemSpacing;
    return {
      length: itemLength,
      offset: itemLength * index,
      index,
    };
  }, [cardWidth, itemSpacing]);

  // Memoized getItemLayout for banner carousel (different width)
  const getBannerItemLayout = useCallback((data: any, index: number) => {
    const bannerWidth = getResponsiveValue(screenWidth * 0.70, screenWidth * 0.65, screenWidth * 0.55);
    const bannerSpacing = getModerateScale(4); // matches bannerContainerWrapper marginRight
    const itemLength = bannerWidth + bannerSpacing;
    return {
      length: itemLength,
      offset: itemLength * index,
      index,
    };
  }, [screenWidth, getResponsiveValue, getModerateScale]);

  // Responsive icon sizes for different UI elements
  const searchIconSize = getIconSize(12);
  const statusIconSize = getIconSize(8);
  const playIconSize = getIconSize(16);

  // Responsive modal columns: 2 for phones, 4 for tablets
  const modalColumns = useMemo(() => isTabletDevice ? 4 : 2, [isTabletDevice]);

  // Responsive modal card width calculation
  const modalCardWidth = useMemo(() => {
    const containerWidth = isTabletDevice ? screenWidth * 0.90 : screenWidth * 0.96;
    const rowPadding = getModerateScale(8) * 2; // Equal padding on both sides of row
    const gap = getModerateScale(3);
    const gapsCount = modalColumns - 1; // Number of gaps between columns
    const totalSpacing = rowPadding + gap * gapsCount;
    const cardWidth = (containerWidth - totalSpacing) / modalColumns;
    return cardWidth;
  }, [isTabletDevice, screenWidth, modalColumns, getModerateScale]);

  // Gap between cards (for spacing)
  const modalCardGap = useMemo(() => getModerateScale(3), [getModerateScale]);



  const [greetingCategories, setGreetingCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const categoryFadeAnim = useRef(new Animated.Value(1)).current;

  // Business categories state


  // Track if animations have been initialized
  const animationsInitializedRef = useRef(false);

  // New category filtering function - matches both name and parentCategoryName
  const filterCategories = useCallback((categories: any[], searchQuery: string) => {
    if (!searchQuery || searchQuery.trim() === '') return [];
    
    const query = searchQuery.toLowerCase().trim();
    
    return categories.filter(category =>
      category?.name?.toLowerCase().includes(query) ||
      category?.parentCategoryName?.toLowerCase().includes(query)
    );
  }, []);

  // Unified search result interface
  interface SearchCategoryResult {
    id: string;
    name: string;
    type: 'general' | 'business';
    posters: any[];
    parentCategoryName?: string;
  }

  // Helper function to group categories by parent category name
  const groupCategoriesByParent = useCallback((categories: SearchCategoryResult[]) => {
    const grouped: Record<string, SearchCategoryResult[]> = {};

    categories.forEach(category => {
      const parent = category.parentCategoryName || "Other";

      if (!grouped[parent]) {
        grouped[parent] = [];
      }

      grouped[parent].push(category);
    });

    return grouped;
  }, []);

  // Performance optimization: Memoize search results
  const memoizedSearchResults = useMemo(() => searchResults, [searchResults]);

  // Group categories by parent category name
  const groupedResults = useMemo(() => {
    return groupCategoriesByParent(memoizedSearchResults);
  }, [memoizedSearchResults, groupCategoriesByParent]);

  // Render search results with category headers and poster grids
  const renderSearchResults = useCallback(() => {
    if (!isSearching && searchQuery.trim() === '') return null;

    if (isSearching) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
            Searching...
          </Text>
        </View>
      );
    }

    if (Object.keys(groupedResults).length === 0) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
            No results found for "{searchQuery}"
          </Text>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {Object.entries(groupedResults).map(([parentName, categories]) => (
          <View key={parentName} style={{ marginBottom: 24 }}>
            {/* Parent Category Header */}
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold', 
              color: theme.colors.text,
              marginTop: 20,
              marginBottom: 16,
              paddingHorizontal: 16,
              textTransform: 'capitalize'
            }}>
              {parentName}
            </Text>

            {/* Child Categories */}
            {categories.map(category => (
              <View key={category.id} style={{ marginBottom: 20 }}>
                {/* Child Category Header */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  marginBottom: 12
                }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: theme.colors.text,
                    marginTop: 10,
                    textTransform: 'capitalize'
                  }}>
                    {category.name}
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase'
                  }}>
                    {category.type}
                  </Text>
                </View>

                {/* Poster Grid */}
                {category.posters.length > 0 ? (
                  <FlatList
                    data={category.posters}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(poster, index) => `${category.id}-${poster.id || index}`}
                    renderItem={({ item: poster }) => {
                      // Use TemplateCard for both business and general posters
                      return (
                        <TemplateCard
                          item={poster}
                          cardWidth={120}
                          theme={theme}
                          onPress={() => {
                            // Handle poster press
                            navigation.navigate('PosterPlayer', {
                              selectedPoster: poster,
                              relatedPosters: [],
                            });
                          }}
                        />
                      );
                    }}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                  />
                ) : (
                  <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                    <Text style={{ 
                      color: theme.colors.textSecondary, 
                      fontSize: 12,
                      fontStyle: 'italic'
                    }}>
                      No posters available
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }, [isSearching, searchQuery, groupedResults, theme, navigation]);

  


  const generalCategoryModalColumns = modalColumns;
  const {
    generalCategoryModalCardWidth,
    generalCategoryModalContentWidth,
    generalCategoryModalGap,
    generalCategoryModalHorizontalPadding,
    generalCategoryModalRowHeight,
  } = useMemo(() => {
    const containerWidth = isTabletDevice ? screenWidth * 0.9 : screenWidth * 0.96;
    const horizontalPadding = getModerateScale(16);
    const gap = getModerateScale(3);
    const totalSpacing = horizontalPadding * 2 + gap * (generalCategoryModalColumns - 1);
    const cardWidth = (containerWidth - totalSpacing) / generalCategoryModalColumns;
    const rowHeight = cardWidth + getModerateScale(12); // card height + spacing

    return {
      generalCategoryModalCardWidth: cardWidth,
      generalCategoryModalContentWidth: containerWidth,
      generalCategoryModalGap: gap,
      generalCategoryModalHorizontalPadding: horizontalPadding,
      generalCategoryModalRowHeight: rowHeight,
    };
  }, [isTabletDevice, screenWidth, getModerateScale]);

  const generalCategoryModalInitialRenderCount = useMemo(() => {
    const defaultCount = generalCategoryModalColumns * 2;
    const listLength = filteredGreetingCategoriesList.length;
    if (listLength === 0) {
      return defaultCount;
    }
    return Math.min(listLength, defaultCount);
  }, [filteredGreetingCategoriesList.length, generalCategoryModalColumns]);

  const getGeneralCategoryModalItemLayout = useCallback((_: any, index: number) => {
    const rowIndex = Math.floor(index / generalCategoryModalColumns);
    const offset = rowIndex * generalCategoryModalRowHeight;
    return {
      length: generalCategoryModalRowHeight,
      offset,
      index,
    };
  }, [generalCategoryModalColumns, generalCategoryModalRowHeight]);

  // Refs to prevent duplicate API calls
  const apiDataLoadedRef = useRef(false);
  const greetingCategoriesLoadedRef = useRef(false);
  // Track if greeting sections have been loaded to prevent them from disappearing
  const greetingSectionsLoadedRef = useRef(false);
  const greetingModalPrefetchInProgressRef = useRef(false);
  const businessCategoriesLoadedRef = useRef(false);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const animateCategoryChange = useCallback(() => {
    Animated.sequence([
      Animated.timing(categoryFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(categoryFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [categoryFadeAnim]);

  const animateBusinessCategoryChange = useCallback(() => {
    Animated.sequence([
      Animated.timing(businessCategoryFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(businessCategoryFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [businessCategoryFadeAnim]);

  const [isBusinessCategoriesModalVisible, setIsBusinessCategoriesModalVisible] = useState(false);
  const [isVideosModalVisible, setIsVideosModalVisible] = useState(false);
  const [showVideoComingSoonModal, setShowVideoComingSoonModal] = useState(false);
  const [isCustomerSupportModalVisible, setIsCustomerSupportModalVisible] = useState(false);

  // Greeting section modal states
  const [isBusinessEthicsModalVisible, setIsBusinessEthicsModalVisible] = useState(false);
  const [isSuccessMindsetModalVisible, setIsSuccessMindsetModalVisible] = useState(false);
  const [isSocialMediaGrowthModalVisible, setIsSocialMediaGrowthModalVisible] = useState(false);
  const [isMoneyAndFinanceModalVisible, setIsMoneyAndFinanceModalVisible] = useState(false);
  const [isBusinessLegendQuoteModalVisible, setIsBusinessLegendQuoteModalVisible] = useState(false);
  const [isBusinessMarketingTipsModalVisible, setIsBusinessMarketingTipsModalVisible] = useState(false);
  const [isBusinessQuotesModalVisible, setIsBusinessQuotesModalVisible] = useState(false);
  const [isFeaturedContentModalVisible, setIsFeaturedContentModalVisible] = useState(false);
  const [isGeneralCategoriesModalVisible, setIsGeneralCategoriesModalVisible] = useState(false);

  // New API data states
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);

  // Helper function to filter out Diwali-related content from featured content
  const filterDiwaliContent = useCallback((content: FeaturedContent[]): FeaturedContent[] => {
    if (!Array.isArray(content)) {
      if (__DEV__) console.warn('[FEATURED CONTENT] filterDiwaliContent received non-array:', content);
      return [];
    }

    const filtered = content.filter(item => {
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const imageUrl = (item.imageUrl || '').toLowerCase();

      // Filter out items that contain "diwali" in title, description, or image URL
      const isDiwali = title.includes('diwali') ||
        description.includes('diwali') ||
        imageUrl.includes('diwali');

      if (isDiwali && __DEV__) {
        console.log('[FEATURED CONTENT] Filtering out Diwali item:', item.id, item.title);
      }

      return !isDiwali;
    });

    if (__DEV__) {
      console.log(`[FEATURED CONTENT] Diwali filter: ${content.length} items -> ${filtered.length} items`);
      if (filtered.length === 0 && content.length > 0) {
        console.warn('[FEATURED CONTENT] All items were filtered out as Diwali content!');
      }
    }

    return filtered;
  }, []);
  const [videoContent, setVideoContent] = useState<VideoContent[]>([]);
  const [calendarPosters, setCalendarPosters] = useState<Template[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Greeting sections data states
  const [businessEthicsTemplates, setBusinessEthicsTemplates] = useState<any[]>([]);
  const [businessEthicsTemplatesRaw, setBusinessEthicsTemplatesRaw] = useState<any[]>([]);
  const [businessEthicsLoading, setBusinessEthicsLoading] = useState(false);
  const [successMindsetTemplates, setSuccessMindsetTemplates] = useState<any[]>([]);
  const [successMindsetTemplatesRaw, setSuccessMindsetTemplatesRaw] = useState<any[]>([]);
  const [successMindsetLoading, setSuccessMindsetLoading] = useState(false);
  const [socialMediaGrowthTemplates, setSocialMediaGrowthTemplates] = useState<any[]>([]);
  const [socialMediaGrowthTemplatesRaw, setSocialMediaGrowthTemplatesRaw] = useState<any[]>([]);
  const [socialMediaGrowthLoading, setSocialMediaGrowthLoading] = useState(false);
  const [moneyAndFinanceTemplates, setMoneyAndFinanceTemplates] = useState<any[]>([]);
  const [moneyAndFinanceTemplatesRaw, setMoneyAndFinanceTemplatesRaw] = useState<any[]>([]);
  const [moneyAndFinanceLoading, setMoneyAndFinanceLoading] = useState(false);
  const [businessLegendQuoteTemplates, setBusinessLegendQuoteTemplates] = useState<any[]>([]);
  const [businessLegendQuoteTemplatesRaw, setBusinessLegendQuoteTemplatesRaw] = useState<any[]>([]);
  const [businessLegendQuoteLoading, setBusinessLegendQuoteLoading] = useState(false);
  const [businessMarketingTipsTemplates, setBusinessMarketingTipsTemplates] = useState<any[]>([]);
  const [businessMarketingTipsTemplatesRaw, setBusinessMarketingTipsTemplatesRaw] = useState<any[]>([]);
  const [businessMarketingTipsLoading, setBusinessMarketingTipsLoading] = useState(false);
  const [businessQuotesTemplates, setBusinessQuotesTemplates] = useState<any[]>([]);
  const [businessQuotesTemplatesRaw, setBusinessQuotesTemplatesRaw] = useState<any[]>([]);
  const [businessQuotesLoading, setBusinessQuotesLoading] = useState(false);

  // Track image preloading progress - must be defined before startProgressiveImagePreloading
  const imagePreloadRef = useRef({ critical: false, high: false, medium: false, low: false });

  // Progressive image preloading system
  // Loads images in batches: Critical G�� High G�� Medium G�� Low priority
  // IMPORTANT: Defined before loadApiData so it can be called from within it
  const startProgressiveImagePreloading = useCallback(() => {
    if (imagePreloadRef.current.critical) {
      return; // Already started
    }
    imagePreloadRef.current.critical = true;

    // Phase 1: CRITICAL - Featured content carousel images (visible immediately)
    const preloadCriticalImages = async () => {
      try {
        const criticalImages: string[] = [];

        // Featured content images (first 3 for carousel)
        featuredContent.slice(0, 3).forEach(item => {
          if (item.imageUrl) criticalImages.push(item.imageUrl);
          if (item.thumbnailUrl) criticalImages.push(item.thumbnailUrl);
        });

        // Preload critical images immediately
        if (criticalImages.length > 0) {
          await Promise.allSettled(
            criticalImages.map(url => Image.prefetch(url).catch(() => { }))
          );
          if (__DEV__) {
            console.log(`[IMAGE PRELOAD] G�� Critical: ${criticalImages.length} images preloaded`);
          }
        }

        // Phase 2: HIGH PRIORITY - Greeting template thumbnails (visible sections)
        setTimeout(() => {
          if (imagePreloadRef.current.high) return;
          imagePreloadRef.current.high = true;

          const highPriorityImages: string[] = [];

          // Greeting template thumbnails (first 3 from each section)
          [
            ...businessEthicsTemplates.slice(0, 3),
            ...successMindsetTemplates.slice(0, 3),
            ...socialMediaGrowthTemplates.slice(0, 3),
            ...moneyAndFinanceTemplates.slice(0, 3),
            ...businessLegendQuoteTemplates.slice(0, 3),
            ...businessMarketingTipsTemplates.slice(0, 3),
            ...businessQuotesTemplates.slice(0, 3),
          ].forEach(template => {
            if (template?.thumbnail) highPriorityImages.push(template.thumbnail);
          });

          // Video content thumbnails (first 3) - commented out, not in use for now
          // videoContent.slice(0, 3).forEach(video => {
          //   if (video.thumbnail) highPriorityImages.push(video.thumbnail);
          // });

          if (highPriorityImages.length > 0) {
            Promise.allSettled(
              highPriorityImages.map(url => Image.prefetch(url).catch(() => { }))
            ).then(() => {
              if (__DEV__) {
                console.log(`[IMAGE PRELOAD] G�� High Priority: ${highPriorityImages.length} images preloaded`);
              }
            });
          }
        }, 500); // Start after 500ms

        // Phase 3: MEDIUM PRIORITY - Business category previews and more greeting templates
        setTimeout(() => {
          if (imagePreloadRef.current.medium) return;
          imagePreloadRef.current.medium = true;

          const mediumPriorityImages: string[] = [];

          // Business category preview images (first image from each category)
          Object.values(businessCategoryPreviews).forEach(templates => {
            if (templates?.[0]?.thumbnail) {
              mediumPriorityImages.push(templates[0].thumbnail);
            }
          });

          // More greeting templates (next 3 from each section)
          [
            ...businessEthicsTemplates.slice(3, 6),
            ...successMindsetTemplates.slice(3, 6),
            ...socialMediaGrowthTemplates.slice(3, 6),
            ...moneyAndFinanceTemplates.slice(3, 6),
            ...businessLegendQuoteTemplates.slice(3, 6),
            ...businessMarketingTipsTemplates.slice(3, 6),
            ...businessQuotesTemplates.slice(3, 6),
          ].forEach(template => {
            if (template?.thumbnail) mediumPriorityImages.push(template.thumbnail);
          });

          // More video content - commented out, not in use for now
          // videoContent.slice(3, 6).forEach(video => {
          //   if (video.thumbnail) mediumPriorityImages.push(video.thumbnail);
          // });

          if (mediumPriorityImages.length > 0) {
            Promise.allSettled(
              mediumPriorityImages.map(url => Image.prefetch(url).catch(() => { }))
            ).then(() => {
              if (__DEV__) {
                console.log(`[IMAGE PRELOAD] G�� Medium Priority: ${mediumPriorityImages.length} images preloaded`);
              }
            });
          }
        }, 1500); // Start after 1.5s

        // Phase 4: LOW PRIORITY - Calendar posters and remaining images
        setTimeout(() => {
          if (imagePreloadRef.current.low) return;
          imagePreloadRef.current.low = true;

          const lowPriorityImages: string[] = [];

          // Calendar poster thumbnails
          calendarPosters.slice(0, 5).forEach(poster => {
            if (poster.thumbnail) lowPriorityImages.push(poster.thumbnail);
          });

          // Remaining featured content
          featuredContent.slice(3).forEach(item => {
            if (item.imageUrl) lowPriorityImages.push(item.imageUrl);
          });

          if (lowPriorityImages.length > 0) {
            Promise.allSettled(
              lowPriorityImages.map(url => Image.prefetch(url).catch(() => { }))
            ).then(() => {
              if (__DEV__) {
                console.log(`[IMAGE PRELOAD] G�� Low Priority: ${lowPriorityImages.length} images preloaded`);
              }
            });
          }
        }, 3000); // Start after 3s
      } catch (error) {
        if (__DEV__) {
          devError('Error in critical image preloading:', error);
        }
      }
    };

    preloadCriticalImages();
  }, [featuredContent, businessEthicsTemplates, successMindsetTemplates, socialMediaGrowthTemplates, moneyAndFinanceTemplates, businessLegendQuoteTemplates, businessMarketingTipsTemplates, businessQuotesTemplates, /* videoContent, */ businessCategoryPreviews, calendarPosters]);

  // Load data from APIs with caching for instant loads and request deduplication
  const loadApiData = useCallback(async (isRefresh: boolean = false) => {
    // Don't block rendering - load cached data first, then fetch fresh
    setApiLoading(true);
    setApiError(null);

    // Step 0: Try to load cached data immediately for instant display
    const loadCachedData = async () => {
      try {
        const cacheService = (await import('../services/cacheService')).default;
        const featuredCacheKey = 'home_featured_' + JSON.stringify({ limit: 1 });
        // Video API commented out - not in use for now
        // const videoCacheKey = 'home_videos_' + JSON.stringify({ limit: 1 });

        // Cache keys for greeting sections (format: greeting_search_${query}_all)
        const greetingCacheKeys = [
          'greeting_search_business ethics_all',
          'greeting_search_success mindset_all',
          'greeting_search_social media growth_all',
          'greeting_search_money and finance_all',
          'greeting_search_business legend quote_all',
          'greeting_search_business marketing tips_all',
          'greeting_search_business quotes_all',
        ];

        const [cachedFeatured, /* cachedVideos, */ ...cachedGreetings] = await Promise.all([
          cacheService.get(featuredCacheKey),
          // cacheService.get(videoCacheKey), // Video API commented out
          ...greetingCacheKeys.map(key => cacheService.get(key)),
        ]);

        if (cachedFeatured && (cachedFeatured as any).data) {
          React.startTransition(() => {
            const filteredData = filterDiwaliContent((cachedFeatured as any).data || []);
            setFeaturedContent(filteredData);
            const convertedBanners: Banner[] = filteredData.map(item => ({
              id: item.id,
              title: item.title,
              imageUrl: item.imageUrl,
              thumbnailUrl: item.thumbnailUrl,
              link: item.link,
            }));
            setBanners(convertedBanners);

            // Trigger progressive preloading when cached featured content loads
            if (filteredData.length > 0) {
              setTimeout(() => {
                startProgressiveImagePreloading();
              }, 150);
            }
          });
        }

        // Video API commented out - not in use for now
        // if (cachedVideos && (cachedVideos as any).data) {
        //   React.startTransition(() => {
        //     setVideoContent((cachedVideos as any).data || []);
        //   });
        // }

        // Load cached greeting sections immediately
        // IMPORTANT: Update state directly (not in startTransition) to ensure sections appear immediately
        // This prevents sections from disappearing when general categories load
        if (cachedGreetings && cachedGreetings.length > 0) {
          const greetingUpdates: any = {
            businessEthics: cachedGreetings[0] && Array.isArray(cachedGreetings[0]) && cachedGreetings[0].length > 0
              ? { display: cachedGreetings[0].slice(0, 3), raw: cachedGreetings[0] }
              : { display: [], raw: [] },
            successMindset: cachedGreetings[1] && Array.isArray(cachedGreetings[1]) && cachedGreetings[1].length > 0
              ? { display: cachedGreetings[1].slice(0, 3), raw: cachedGreetings[1] }
              : { display: [], raw: [] },
            socialMediaGrowth: cachedGreetings[2] && Array.isArray(cachedGreetings[2]) && cachedGreetings[2].length > 0
              ? { display: cachedGreetings[2].slice(0, 3), raw: cachedGreetings[2] }
              : { display: [], raw: [] },
            moneyAndFinance: cachedGreetings[3] && Array.isArray(cachedGreetings[3]) && cachedGreetings[3].length > 0
              ? { display: cachedGreetings[3].slice(0, 3), raw: cachedGreetings[3] }
              : { display: [], raw: [] },
            businessLegendQuote: cachedGreetings[4] && Array.isArray(cachedGreetings[4]) && cachedGreetings[4].length > 0
              ? { display: cachedGreetings[4].slice(0, 3), raw: cachedGreetings[4] }
              : { display: [], raw: [] },
            businessMarketingTips: cachedGreetings[5] && Array.isArray(cachedGreetings[5]) && cachedGreetings[5].length > 0
              ? { display: cachedGreetings[5].slice(0, 3), raw: cachedGreetings[5] }
              : { display: [], raw: [] },
            businessQuotes: cachedGreetings[6] && Array.isArray(cachedGreetings[6]) && cachedGreetings[6].length > 0
              ? { display: cachedGreetings[6].slice(0, 3), raw: cachedGreetings[6] }
              : { display: [], raw: [] },
          };

          // Update state directly to prevent sections from disappearing
          setBusinessEthicsTemplates(greetingUpdates.businessEthics.display);
          setBusinessEthicsTemplatesRaw(greetingUpdates.businessEthics.raw);
          setSuccessMindsetTemplates(greetingUpdates.successMindset.display);
          setSuccessMindsetTemplatesRaw(greetingUpdates.successMindset.raw);
          setSocialMediaGrowthTemplates(greetingUpdates.socialMediaGrowth.display);
          setSocialMediaGrowthTemplatesRaw(greetingUpdates.socialMediaGrowth.raw);
          setMoneyAndFinanceTemplates(greetingUpdates.moneyAndFinance.display);
          setMoneyAndFinanceTemplatesRaw(greetingUpdates.moneyAndFinance.raw);
          setBusinessLegendQuoteTemplates(greetingUpdates.businessLegendQuote.display);
          setBusinessLegendQuoteTemplatesRaw(greetingUpdates.businessLegendQuote.raw);
          setBusinessMarketingTipsTemplates(greetingUpdates.businessMarketingTips.display);
          setBusinessMarketingTipsTemplatesRaw(greetingUpdates.businessMarketingTips.raw);
          setBusinessQuotesTemplates(greetingUpdates.businessQuotes.display);
          setBusinessQuotesTemplatesRaw(greetingUpdates.businessQuotes.raw);

          // Mark greeting sections as loaded to prevent them from disappearing
          greetingSectionsLoadedRef.current = true;

          // Trigger progressive preloading when cached greeting templates load
          setTimeout(() => {
            startProgressiveImagePreloading();
          }, 200);
        }
      } catch (error) {
        // Ignore cache errors, continue with API calls
      }
    };

    // Load cached data immediately (non-blocking)
    loadCachedData();

    // Now fetch fresh data in background
    return performanceMonitor.measureAsync('loadApiData', async () => {
      try {
        if (__DEV__) {
        }

        // Track success count for error handling
        let totalMainRequests = 2;
        const networkErrors: string[] = [];

        // Step 1: Load first 1 item from each main section for INSTANT loading (minimal data)
        const immediateApiPromises = [
          requestDeduplication.deduplicate(
            RequestDeduplication.generateKey('featuredContent', { limit: 1 }),
            () => homeApi.getFeaturedContent({ limit: 1 })
          ).then(response => {
            // Update featured content immediately with first 3 items
            if (__DEV__) {
              console.log('[FEATURED CONTENT] API Response:', {
                success: response.success,
                dataType: typeof response.data,
                isArray: Array.isArray(response.data),
                dataLength: Array.isArray(response.data) ? response.data.length : 'not an array',
                firstItem: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null,
              });
            }

            if (response.success && response.data && Array.isArray(response.data)) {
              React.startTransition(() => {
                // Filter out Diwali content before setting
                const filteredData = filterDiwaliContent(response.data);
                if (__DEV__) {
                  console.log('[FEATURED CONTENT] After Diwali filter:', {
                    original: response.data.length,
                    filtered: filteredData.length,
                    willSet: filteredData.length > 0,
                  });
                }
                setFeaturedContent(filteredData);
                const convertedBanners: Banner[] = filteredData.map(item => ({
                  id: item.id,
                  title: item.title,
                  imageUrl: item.imageUrl,
                  thumbnailUrl: item.thumbnailUrl, // Include thumbnailUrl for faster loading
                  link: item.link,
                }));
                setBanners(convertedBanners);

                // Trigger progressive preloading when featured content loads
                if (filteredData.length > 0) {
                  setTimeout(() => {
                    startProgressiveImagePreloading();
                  }, 100);
                }
              });
              if (__DEV__) {
                console.log('[FEATURED CONTENT] G�� Loaded:', response.data?.length || 0, 'items');
              }
            } else {
              if (__DEV__) {
                console.warn('[FEATURED CONTENT] G��n+� API returned unsuccessful response or invalid data:', {
                  success: response.success,
                  hasData: !!response.data,
                  isArray: Array.isArray(response.data),
                  response: response,
                });
              }
              React.startTransition(() => {
                setFeaturedContent([]);
                setBanners([]);
              });
            }
            return { type: 'featured', response, success: response.success };
          }).catch(err => {
            if (__DEV__) {
              console.error('[FEATURED CONTENT] G�� Error loading:', err?.message || err);
              console.error('[FEATURED CONTENT] Error details:', {
                message: err?.message,
                code: err?.code,
                response: err?.response?.data,
                status: err?.response?.status,
                url: err?.config?.url,
              });
            }
            if (err?.message === 'NETWORK_ERROR' || err?.message === 'TIMEOUT') {
              networkErrors.push('featured');
            }
            React.startTransition(() => {
              setFeaturedContent([]);
              setBanners([]);
            });
            return { type: 'featured', response: null, success: false };
          }),

          // Video API commented out - not in use for now
          // requestDeduplication.deduplicate(
          //   RequestDeduplication.generateKey('videoContent', { limit: 1 }),
          //   () => homeApi.getVideoContent({ limit: 1 })
          // ).then(response => {
          //   // Update videos immediately with first 1 item for instant loading
          //   if (response.success) {
          //     React.startTransition(() => {
          //       setVideoContent(response.data);
          //     });
          //     if (__DEV__) {
          //       console.log('[VIDEO CONTENT] G�� Loaded:', response.data?.length || 0, 'items');
          //     }
          //   } else {
          //     if (__DEV__) {
          //       console.warn('[VIDEO CONTENT] G��n+� API returned unsuccessful response:', response);
          //     }
          //     React.startTransition(() => {
          //       setVideoContent([]);
          //     });
          //   }
          //   return { type: 'videos', response, success: response.success };
          // }).catch(err => {
          //   if (__DEV__) {
          //     console.error('[VIDEO CONTENT] G�� Error loading:', err?.message || err);
          //     console.error('[VIDEO CONTENT] Error details:', {
          //       message: err?.message,
          //       code: err?.code,
          //       response: err?.response?.data,
          //       status: err?.response?.status,
          //       url: err?.config?.url,
          //     });
          //   }
          //   if (err?.message === 'NETWORK_ERROR' || err?.message === 'TIMEOUT') {
          //     networkErrors.push('videos');
          //   }
          //   React.startTransition(() => {
          //     setVideoContent([]);
          //   });
          //   return { type: 'videos', response: null, success: false };
          // }),

          // Return a resolved promise to maintain promise array structure
          Promise.resolve({ type: 'videos', response: null, success: false }),
        ];

        // Don't wait - let promises resolve in background and update UI as they complete
        // This allows UI to render immediately
        Promise.allSettled(immediateApiPromises).then(results => {
          // Count successful responses from results
          const successCount = results.filter(result =>
            result.status === 'fulfilled' && result.value.success
          ).length;

          // Only show network error if ALL main requests failed AND they were network/timeout errors
          // Don't show error if at least one request succeeded (partial success is acceptable)
          if (successCount === 0 && networkErrors.length > 0) {
            // All requests failed and at least some were network errors
            if (networkErrors.length === totalMainRequests) {
              // All were network errors
              React.startTransition(() => {
                setApiError('Network connection issue. Please check your internet and try again.');
              });
            } else {
              // Some network errors, some other errors - still show network issue
              React.startTransition(() => {
                setApiError('Network connection issue. Please check your internet and try again.');
              });
            }
          } else if (successCount === 0 && networkErrors.length === 0) {
            // All failed but not network errors - might be server issue, don't show error immediately
            if (__DEV__) {
            }
            // Only show error after retry fails or if it persists
          } else if (successCount > 0 && successCount < totalMainRequests) {
            // Partial success - don't show error, app is still functional
            if (__DEV__) {
            }
          }

          // Mark loading as complete
          React.startTransition(() => {
            setApiLoading(false);
          });
        }).catch(error => {
          React.startTransition(() => {
            setApiLoading(false);
          });
        });

        // Step 2: Load remaining items in background (non-blocking)
        setTimeout(async () => {
          try {
            // Load full featured content (10 items)
            const fullFeaturedResponse = await requestDeduplication.deduplicate(
              RequestDeduplication.generateKey('featuredContent', { limit: 10 }),
              () => homeApi.getFeaturedContent({ limit: 10 })
            );
            if (fullFeaturedResponse.success && fullFeaturedResponse.data.length > 1) {
              React.startTransition(() => {
                // Filter out Diwali content before setting
                const filteredData = filterDiwaliContent(fullFeaturedResponse.data);
                setFeaturedContent(filteredData);
                const convertedBanners: Banner[] = filteredData.map(item => ({
                  id: item.id,
                  title: item.title,
                  imageUrl: item.imageUrl,
                  thumbnailUrl: item.thumbnailUrl, // Include thumbnailUrl for faster loading
                  link: item.link,
                }));
                setBanners(convertedBanners);
              });
            }

            // Load full video content (20 items) - commented out, not in use for now
            // const fullVideosResponse = await requestDeduplication.deduplicate(
            //   RequestDeduplication.generateKey('videoContent', { limit: 20 }),
            //   () => homeApi.getVideoContent({ limit: 20 })
            // );
            // if (fullVideosResponse.success && fullVideosResponse.data.length > 1) {
            //   React.startTransition(() => {
            //     setVideoContent(fullVideosResponse.data);
            //   });
            // }
          } catch (error) {
            if (__DEV__) {
              devError('Error loading remaining content in background:', error);
            }
          }
        }, 0); // Execute in next event loop tick

        // Load greeting sections immediately (parallel with carousel) - no delay
        // Start loading immediately, don't wait for other promises
        // This ensures greeting sections load as fast as the carousel
        // Fetch full results but only display 3 items initially (pagination will load more on scroll)
        // IMPORTANT: Update state immediately without startTransition to ensure sections appear right away
        (async () => {
          try {
            const greetingPromises = await Promise.allSettled([
              greetingTemplatesService.searchTemplates('business ethics').catch(() => []),
              greetingTemplatesService.searchTemplates('success mindset').catch(() => []),
              greetingTemplatesService.searchTemplates('social media growth').catch(() => []),
              greetingTemplatesService.searchTemplates('money and finance').catch(() => []),
              greetingTemplatesService.searchTemplates('business legend quote').catch(() => []),
              greetingTemplatesService.searchTemplates('business marketing tips').catch(() => []),
              greetingTemplatesService.searchTemplates('business quotes').catch(() => [])
            ]);

            const [
              businessEthicsResponse,
              successMindsetResponse,
              socialMediaGrowthResponse,
              moneyAndFinanceResponse,
              businessLegendQuoteResponse,
              businessMarketingTipsResponse,
              businessQuotesResponse
            ] = greetingPromises;

            // Debug: Log response statuses
            if (__DEV__) {
              console.log('[GREETING SECTIONS] API Response Status:', {
                businessEthics: { status: businessEthicsResponse.status, length: businessEthicsResponse.status === 'fulfilled' ? businessEthicsResponse.value.length : 0 },
                successMindset: { status: successMindsetResponse.status, length: successMindsetResponse.status === 'fulfilled' ? successMindsetResponse.value.length : 0 },
                socialMediaGrowth: { status: socialMediaGrowthResponse.status, length: socialMediaGrowthResponse.status === 'fulfilled' ? socialMediaGrowthResponse.value.length : 0 },
                moneyAndFinance: { status: moneyAndFinanceResponse.status, length: moneyAndFinanceResponse.status === 'fulfilled' ? moneyAndFinanceResponse.value.length : 0 },
                businessLegendQuote: { status: businessLegendQuoteResponse.status, length: businessLegendQuoteResponse.status === 'fulfilled' ? businessLegendQuoteResponse.value.length : 0 },
                businessMarketingTips: { status: businessMarketingTipsResponse.status, length: businessMarketingTipsResponse.status === 'fulfilled' ? businessMarketingTipsResponse.value.length : 0 },
                businessQuotes: { status: businessQuotesResponse.status, length: businessQuotesResponse.status === 'fulfilled' ? businessQuotesResponse.value.length : 0 },
              });

              // Log rejected reasons
              if (businessEthicsResponse.status === 'rejected') {
                console.error('[GREETING SECTIONS] Business Ethics error:', businessEthicsResponse.reason);
              }
              if (successMindsetResponse.status === 'rejected') {
                console.error('[GREETING SECTIONS] Success Mindset error:', successMindsetResponse.reason);
              }
            }

            // Handle greeting sections responses - Set first 3 items immediately
            const greetingUpdates = {
              businessEthics: businessEthicsResponse.status === 'fulfilled' && businessEthicsResponse.value.length > 0
                ? { display: businessEthicsResponse.value.slice(0, 3), raw: businessEthicsResponse.value }
                : { display: [], raw: [] },
              successMindset: successMindsetResponse.status === 'fulfilled' && successMindsetResponse.value.length > 0
                ? { display: successMindsetResponse.value.slice(0, 3), raw: successMindsetResponse.value }
                : { display: [], raw: [] },
              socialMediaGrowth: socialMediaGrowthResponse.status === 'fulfilled' && socialMediaGrowthResponse.value.length > 0
                ? { display: socialMediaGrowthResponse.value.slice(0, 3), raw: socialMediaGrowthResponse.value }
                : { display: [], raw: [] },
              moneyAndFinance: moneyAndFinanceResponse.status === 'fulfilled' && moneyAndFinanceResponse.value.length > 0
                ? { display: moneyAndFinanceResponse.value.slice(0, 3), raw: moneyAndFinanceResponse.value }
                : { display: [], raw: [] },
              businessLegendQuote: businessLegendQuoteResponse.status === 'fulfilled' && businessLegendQuoteResponse.value.length > 0
                ? { display: businessLegendQuoteResponse.value.slice(0, 3), raw: businessLegendQuoteResponse.value }
                : { display: [], raw: [] },
              businessMarketingTips: businessMarketingTipsResponse.status === 'fulfilled' && businessMarketingTipsResponse.value.length > 0
                ? { display: businessMarketingTipsResponse.value.slice(0, 3), raw: businessMarketingTipsResponse.value }
                : { display: [], raw: [] },
              businessQuotes: businessQuotesResponse.status === 'fulfilled' && businessQuotesResponse.value.length > 0
                ? { display: businessQuotesResponse.value.slice(0, 3), raw: businessQuotesResponse.value }
                : { display: [], raw: [] },
            };

            if (__DEV__) {
              console.log('[GREETING SECTIONS] Final Updates:', {
                businessEthics: greetingUpdates.businessEthics.display.length,
                successMindset: greetingUpdates.successMindset.display.length,
                socialMediaGrowth: greetingUpdates.socialMediaGrowth.display.length,
                moneyAndFinance: greetingUpdates.moneyAndFinance.display.length,
                businessLegendQuote: greetingUpdates.businessLegendQuote.display.length,
                businessMarketingTips: greetingUpdates.businessMarketingTips.display.length,
                businessQuotes: greetingUpdates.businessQuotes.display.length,
              });
            }

            // Update state immediately (without startTransition) to ensure sections appear right away
            // This prevents the issue where sections don't show until app refresh
            setBusinessEthicsTemplates(greetingUpdates.businessEthics.display);
            setBusinessEthicsTemplatesRaw(greetingUpdates.businessEthics.raw);
            setSuccessMindsetTemplates(greetingUpdates.successMindset.display);
            setSuccessMindsetTemplatesRaw(greetingUpdates.successMindset.raw);
            setSocialMediaGrowthTemplates(greetingUpdates.socialMediaGrowth.display);
            setSocialMediaGrowthTemplatesRaw(greetingUpdates.socialMediaGrowth.raw);
            setMoneyAndFinanceTemplates(greetingUpdates.moneyAndFinance.display);
            setMoneyAndFinanceTemplatesRaw(greetingUpdates.moneyAndFinance.raw);
            setBusinessLegendQuoteTemplates(greetingUpdates.businessLegendQuote.display);
            setBusinessLegendQuoteTemplatesRaw(greetingUpdates.businessLegendQuote.raw);
            setBusinessMarketingTipsTemplates(greetingUpdates.businessMarketingTips.display);
            setBusinessMarketingTipsTemplatesRaw(greetingUpdates.businessMarketingTips.raw);
            setBusinessQuotesTemplates(greetingUpdates.businessQuotes.display);
            setBusinessQuotesTemplatesRaw(greetingUpdates.businessQuotes.raw);

            // Mark greeting sections as loaded to prevent them from disappearing
            greetingSectionsLoadedRef.current = true;

            // Trigger progressive preloading when greeting templates load
            setTimeout(() => {
              startProgressiveImagePreloading();
            }, 200);

            if (__DEV__) {
              console.log('[GREETING SECTIONS] G�� State updated immediately - sections should be visible now');
            }
          } catch (error) {
            if (__DEV__) {
              devError('Error loading greeting sections:', error);
            }
          }
        })(); // Execute immediately, don't await
      } catch (error) {
        // Only catch unexpected errors (like state setting errors or promise.allSettled issues)
        // Expected API errors are already handled above
        if (__DEV__) {
          devError('Unexpected error loading API data:', error);
        }
        // Don't set apiError here unless it's a truly unexpected error
        // Most errors should be handled by Promise.allSettled above
        React.startTransition(() => {
          setApiLoading(false);
        });
      }
    });
  }, [filterDiwaliContent]);

  // Helper function to convert CalendarPoster to Template format
  const convertCalendarPosterToTemplate = useCallback((poster: CalendarPoster): Template => {
    // Prioritize thumbnailUrl for better performance (smaller, optimized images)
    // CalendarPoster interface already handles thumbnailUrl in calendarApi.ts
    const thumbnail = poster.thumbnail || poster.imageUrl || '';
    const template: any = {
      id: poster.id,
      name: poster.name || poster.title || 'Calendar Poster',
      thumbnail: thumbnail,
      category: poster.category || 'General',
      downloads: poster.downloads || 0,
      isDownloaded: poster.isDownloaded || false,
      tags: poster.tags || [],
    };
    // Add extra properties for calendar posters if needed
    if (poster.description) template.description = poster.description;
    if (poster.date) template.date = poster.date;
    if (poster.festivalName) template.festivalName = poster.festivalName;
    return template as Template;
  }, []);

  // Load calendar posters for upcoming dates
  // Today's poster loads immediately, rest load in background
  const loadCalendarPosters = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Format date string helper
      const formatDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      };

      // Load today's poster immediately
      const todayString = formatDateString(today);
      try {
        const todayResponse = await calendarApi.getPostersByDate(todayString);
        if (todayResponse.success && todayResponse.data.posters.length > 0) {
          const todayPosters = todayResponse.data.posters.map(convertCalendarPosterToTemplate);
          // Set today's posters immediately
          setCalendarPosters(todayPosters);
        }
      } catch (error) {
        if (__DEV__) {
          devError('Error loading today\'s calendar posters:', error);
        }
      }

      // Load rest of the dates (next 15 days) in the background
      // Use setTimeout to ensure it doesn't block the UI
      setTimeout(async () => {
        try {
          const datePromises: Promise<Template[]>[] = [];
          // Start from tomorrow (i = 1) since today is already loaded
          for (let i = 1; i <= 15; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateString = formatDateString(date);

            datePromises.push(
              calendarApi.getPostersByDate(dateString)
                .then(response => {
                  if (response.success && response.data.posters.length > 0) {
                    return response.data.posters.map(convertCalendarPosterToTemplate);
                  }
                  return [];
                })
                .catch(() => [])
            );
          }

          const results = await Promise.all(datePromises);
          const futurePosters = results.flat();

          // Merge with today's posters (remove duplicates)
          setCalendarPosters(prevPosters => {
            const allPosters = [...prevPosters, ...futurePosters];
            const uniquePosters = Array.from(
              new Map(allPosters.map(poster => [poster.id, poster])).values()
            );
            return uniquePosters;
          });
        } catch (error) {
          if (__DEV__) {
            devError('Error loading future calendar posters:', error);
          }
        }
      }, 0); // Execute in next event loop tick

    } catch (error) {
      if (__DEV__) {
        devError('Error loading calendar posters:', error);
      }
    }
  }, [convertCalendarPosterToTemplate]);

  // Load API data once on component mount only (with ref guard to prevent duplicates)
  useEffect(() => {
    // Prevent duplicate calls even in React Strict Mode
    if (apiDataLoadedRef.current) {
      return;
    }
    apiDataLoadedRef.current = true;

    let isMounted = true;

    const loadInitialData = () => {
      // Don't await - make it truly non-blocking for instant UI
      // Load API data in background
      loadApiData().catch(error => {
        if (__DEV__) {
          devError('Error loading API data:', error);
        }
      });

      // Load calendar posters in background after critical content loads
      // Delay calendar loading for instant initial load
      setTimeout(() => {
        if (isMounted) {
          loadCalendarPosters();
        }
      }, 500);
    };

    // Load initial data immediately for faster startup (reduced delay)
    // Use small timeout to ensure UI renders first, but don't wait for all interactions
    setTimeout(() => {
      loadInitialData();
    }, 100); // Reduced delay for faster initial load

    // Start progressive image preloading after initial render
    // This runs in parallel with data loading for optimal performance
    setTimeout(() => {
      startProgressiveImagePreloading();
    }, 200); // Start preloading 200ms after initial render

    return () => {
      isMounted = false;
    };
  }, [loadApiData, loadCalendarPosters, startProgressiveImagePreloading]); // Include startProgressiveImagePreloading in dependencies

  // Load greeting categories - consolidated with greetingCategoriesList loading below


  const fetchBusinessCategoryPreviewImages = useCallback(async (categories: BusinessCategory[], batchSize: number = 3) => {
    if (!categories || categories.length === 0) {
      return;
    }

    // Process in batches for faster initial display
    const processBatch = async (batch: BusinessCategory[]) => {
      try {
        // Use Promise.allSettled to continue even if some fail
        const imageEntries = await Promise.allSettled(
          batch.map(async (category: BusinessCategory) => {
            try {
              const response = await businessCategoryPostersApi.getPostersByCategory(category.name, 200); // Request all posters to show complete collection
              const posters = response.data?.posters || [];

              const templates = posters
                .map((poster: any) => convertBusinessPosterToTemplate(poster, category.name))
                .filter((template: Template) => !!template.thumbnail)
                .slice(0, 6); // Show 6 images for business categories

              if (templates.length > 0) {
                // Prefetch first thumbnail immediately for instant display
                const firstThumbnail = templates[0]?.thumbnail;
                if (firstThumbnail) {
                  Image.prefetch(firstThumbnail).catch(() => { });
                }

                return { categoryId: category.id, templates, success: true };
              }
            } catch (error) {
              if (__DEV__) {
                devWarn(`G��n+� Failed to fetch preview for category ${category.name}:`, error);
              }
            }
            return { categoryId: category.id, templates: undefined, success: false };
          })
        );

        const nextPreviews: Record<string, Template[]> = {};
        imageEntries.forEach((result: PromiseSettledResult<{ categoryId: string; templates?: Template[]; success: boolean }>) => {
          if (result.status === 'fulfilled' && result.value.success && result.value.templates) {
            nextPreviews[result.value.categoryId] = result.value.templates;
          }
        });

        // Update state immediately for each batch (non-blocking)
        if (Object.keys(nextPreviews).length > 0) {
          React.startTransition(() => {
            setBusinessCategoryPreviews(prev => ({ ...prev, ...nextPreviews }));
          });
        }
      } catch (error) {
        if (__DEV__) {
          devError('Error fetching business category preview images:', error);
        }
      }
    };

    // Process first batch immediately (no delay)
    const firstBatch = categories.slice(0, batchSize);
    if (firstBatch.length > 0) {
      processBatch(firstBatch);
    }

    // Process remaining batches progressively
    if (categories.length > batchSize) {
      const remainingBatches = [];
      for (let i = batchSize; i < categories.length; i += batchSize) {
        remainingBatches.push(categories.slice(i, i + batchSize));
      }

      remainingBatches.forEach((batch, index) => {
        setTimeout(() => {
          processBatch(batch);
        }, (index + 1) * 150); // 150ms delay between batches
      });
    }
  }, []);

  const fetchGreetingCategoryPreviewImages = useCallback(async (categories: Array<{ id: string; name: string; icon?: string; imageUrl?: string }>, isInitialLoad: boolean = false) => {
    if (!categories || categories.length === 0) {
      return;
    }

    // Process categories with immediate state updates for instant display
    const processCategories = async (cats: Array<{ id: string; name: string; icon?: string; imageUrl?: string }>) => {
      // Process all categories in parallel, but update state immediately as each completes
      // This allows images to appear progressively instead of waiting for all to complete
      const promises = cats.map(async category => {
        try {
          // Check for direct image first (fastest - instant, no API call)
          const directImage = category.imageUrl;
          if (directImage) {
            // Prefetch and update state immediately
            Image.prefetch(directImage).catch(() => { });
            React.startTransition(() => {
              setGreetingCategoryImages(prev => ({ ...prev, [category.id]: directImage }));
            });
            return { categoryId: category.id, imageUrl: directImage, success: true };
          }

          // Use searchTemplatesFast directly (optimized for small limits, has caching)
          // Limit to 1 for fastest response - we only need one thumbnail
          const templates = await greetingTemplatesService.searchTemplatesFast(category.name, undefined, 1);

          // Use first template (fast search already filters by tags)
          const selectedTemplate = templates?.[0];
          const previewUrl = selectedTemplate?.thumbnail || selectedTemplate?.content?.background;

          if (previewUrl) {
            // Prefetch image immediately
            Image.prefetch(previewUrl).catch(() => { });
            // Update state immediately for this category (progressive display)
            React.startTransition(() => {
              setGreetingCategoryImages(prev => ({ ...prev, [category.id]: previewUrl }));
            });
            return { categoryId: category.id, imageUrl: previewUrl, success: true };
          }
        } catch (error) {
          if (__DEV__) {
            devWarn(`G��n+� Failed to fetch preview for greeting category ${category.name}:`, error);
          }
        }
        return { categoryId: category.id, imageUrl: undefined, success: false };
      });

      // Run all promises in parallel - state updates happen immediately as each completes
      // We don't need to wait for all, but Promise.allSettled ensures all run
      Promise.allSettled(promises).catch(() => {
        // Ignore errors - individual promises handle their own errors
      });
    };

    if (isInitialLoad) {
      // For initial load, process ALL categories in parallel instantly (no batching, no waiting)
      // Each category updates state independently as soon as its image is found
      processCategories(categories);
    } else {
      // For subsequent loads, process in batches
      const batchSize = 3;
      const firstBatch = categories.slice(0, batchSize);
      if (firstBatch.length > 0) {
        processCategories(firstBatch);
      }

      // Process remaining batches progressively
      if (categories.length > batchSize) {
        const remainingBatches = [];
        for (let i = batchSize; i < categories.length; i += batchSize) {
          remainingBatches.push(categories.slice(i, i + batchSize));
        }

        remainingBatches.forEach((batch, index) => {
          setTimeout(() => {
            processCategories(batch);
          }, (index + 1) * 100);
        });
      }
    }
  }, []);

  // Load greeting categories list for the section (consolidated - only called once with ref guard)
  useEffect(() => {
    // Prevent duplicate calls even in React Strict Mode
    if (greetingCategoriesLoadedRef.current) {
      return;
    }
    greetingCategoriesLoadedRef.current = true;

    let isMounted = true;

    const loadGreetingCategoriesList = async () => {
      setGreetingCategoriesLoading(true);
      try {
        const categories = await greetingTemplatesService.getCategories();
        if (isMounted && categories && categories.length > 0) {
          const mappedCategories = categories.map(category => ({
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: (category as any).color,
            imageUrl: (category as any).imageUrl || (category as any).image || (category as any).thumbnail || '',
            parentCategoryName: (category as any).parentCategoryName // Include parentCategoryName
          }));

          // Store all categories for lazy loading
          setAllGreetingCategories(mappedCategories);

          // Set both states from single API call
          // Use startTransition to prevent blocking other sections from rendering
          React.startTransition(() => {
            // Initially show only first 5 categories
            setGreetingCategoriesList(mappedCategories);
            const newGreetingCategories = mappedCategories.map(({ id, name, icon }) => ({ id, name, icon }));
            setGreetingCategories(newGreetingCategories); // Also set for rotating categories

            // Trigger initial animation when categories are first loaded (faster)
            if (newGreetingCategories.length > 0) {
              // Use small timeout instead of InteractionManager for faster animation start
              setTimeout(() => {
                animateCategoryChange();
              }, 50); // Small delay to ensure UI is ready
            }
          });

          // Load greeting category preview images INSTANTLY - all first 5 in parallel
          // Start immediately without any delay - images will appear progressively
          const initialCategories = mappedCategories.slice(0, 5);
          // Process all 5 categories in parallel immediately (no batching, no delay)
          // Each category updates state independently as soon as its image is found
          fetchGreetingCategoryPreviewImages(initialCategories, true); // true = isInitialLoad

          if (__DEV__) {
          }
        }
      } catch (error) {
        if (__DEV__) {
          devError('Error loading greeting categories list:', error);
        }
      } finally {
        if (isMounted) {
          setGreetingCategoriesLoading(false);
        }
      }
    };

    loadGreetingCategoriesList();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount (fetchGreetingCategoryPreviewImages is stable)

  // Lazy-load missing general category thumbnails only when the modal is opened
  useEffect(() => {
    if (!isGeneralCategoriesModalVisible) {
      return;
    }
    if (greetingModalPrefetchInProgressRef.current) {
      return;
    }

    const missingCategories = greetingCategoriesList.filter(category => {
      const hasMemoizedImage = Boolean(memoizedGreetingCategoryImages[category.id]);
      const hasInlineImage = Boolean((category as any).imageUrl);
      return !hasMemoizedImage && !hasInlineImage;
    });

    if (missingCategories.length === 0) {
      return;
    }

    greetingModalPrefetchInProgressRef.current = true;
    fetchGreetingCategoryPreviewImages(missingCategories, false)
      .catch(error => {
        if (__DEV__) {
          devWarn('G��n+� [GENERAL CATEGORIES MODAL] Failed to preload thumbnails:', error);
        }
      })
      .finally(() => {
        greetingModalPrefetchInProgressRef.current = false;
      });
  }, [
    isGeneralCategoriesModalVisible,
    greetingCategoriesList,
    memoizedGreetingCategoryImages,
    fetchGreetingCategoryPreviewImages,
  ]);

  // Load business categories and filter out user's own category (only called once on mount with ref guard)
  useEffect(() => {
    let isMounted = true;

    const loadBusinessCategories = async () => {
      setBusinessCategoriesLoading(true);
      try {
        const response = await businessCategoriesService.getHomeBusinessCategories();
        // Print the full response (only in dev mode, and limit size)
        if (__DEV__ && response && response.success) {
          const categories = response.categories || (response as any).data?.categories || [];
          console.log(`=��� [HOME BUSINESS CATEGORIES] Loaded ${categories.length} categories`);
        }
        if (isMounted && response && response.success) {
          // Get all categories from response (for rotation)
          // Handle both response structures: response.categories or response.data?.categories
          const allCategories = response.categories || (response as any).data?.categories || [];

          if (!allCategories || allCategories.length === 0) {
            if (__DEV__) {
              devWarn('G��n+� [BUSINESS CATEGORIES] No categories in response:', response);
            }
            return;
          }

          // Get current user's business category (subcategory is what user actually selected)
          const currentUser = authService.getCurrentUser();
          const userSubCategory = currentUser?.subCategory || currentUser?.subcategory || '';
          const selectedProfileSubCategory = selectedBusinessProfile?.subCategory || selectedBusinessProfile?.subcategory || '';

          console.log('=��� [BUSINESS CATEGORY FILTER]', {
            userSubCategory: userSubCategory,
            selectedProfileSubCategory: selectedProfileSubCategory,
            currentUser: currentUser
          });

          // Filter out user's own business category and selected business profile's category (for section display only)
          const filteredCategories = allCategories.filter((category: BusinessCategory) => {
            const categoryName = category.name?.trim() || '';
            const userSubCategoryName = userSubCategory?.trim() || '';
            const selectedProfileSubCategoryName = selectedProfileSubCategory?.trim() || '';

            // Check if user's subcategory matches this business category name
            const matchesUserSubCategory = categoryName.toLowerCase() === userSubCategoryName.toLowerCase();

            // Check if selected profile's subcategory matches this business category name
            const matchesSelectedProfileSubCategory = categoryName.toLowerCase() === selectedProfileSubCategoryName.toLowerCase();

            // Check if user's subcategory matches any subcategory within this business category
            const containsUserSubCategory = category.subCategories?.some((subCat: any) => {
              const subCatName = typeof subCat === 'string' ? subCat : subCat?.name;
              return subCatName?.toLowerCase() === userSubCategoryName.toLowerCase();
            }) || false;

            // Check if selected profile's subcategory matches any subcategory within this business category
            const containsSelectedProfileSubCategory = category.subCategories?.some((subCat: any) => {
              const subCatName = typeof subCat === 'string' ? subCat : subCat?.name;
              return subCatName?.toLowerCase() === selectedProfileSubCategoryName.toLowerCase();
            }) || false;

            console.log('=��� [FILTERING CATEGORY]', {
              categoryName: categoryName,
              userSubCategoryName: userSubCategoryName,
              selectedProfileSubCategoryName: selectedProfileSubCategoryName,
              matchesUserSubCategory: matchesUserSubCategory,
              matchesSelectedProfileSubCategory: matchesSelectedProfileSubCategory,
              containsUserSubCategory: containsUserSubCategory,
              containsSelectedProfileSubCategory: containsSelectedProfileSubCategory,
              shouldExclude: matchesUserSubCategory || matchesSelectedProfileSubCategory || containsUserSubCategory || containsSelectedProfileSubCategory
            });

            // Exclude categories that match user's subcategory or selected profile's subcategory
            const shouldExclude = matchesUserSubCategory ||
              matchesSelectedProfileSubCategory ||
              containsUserSubCategory ||
              containsSelectedProfileSubCategory;

            return !shouldExclude;
          });

          setBusinessCategories(filteredCategories);

          // Set rotating business categories for button display (use ALL categories including user's own)
          // This ensures we have categories to rotate through in the button
          const rotatingCategories = allCategories
            .filter((category: BusinessCategory) => category && category.name && category.name.trim())
            .map((category: BusinessCategory) => ({
              id: category.id,
              name: category.name.trim(),
            }));

          if (rotatingCategories.length > 0) {
            setRotatingBusinessCategories(rotatingCategories);
            // Reset index to 0 when categories are loaded
            setCurrentBusinessCategoryIndex(0);

            // Trigger initial animation when categories are first loaded
            InteractionManager.runAfterInteractions(() => {
              animateBusinessCategoryChange();
            });

            if (__DEV__) {
            }
          } else {
            if (__DEV__) {
              devWarn('G��n+� [ROTATING BUSINESS CATEGORIES] No valid categories found');
            }
          }

          // Load business category preview images immediately (no delay)
          // First batch loads instantly, remaining load progressively
          fetchBusinessCategoryPreviewImages(filteredCategories, 3); // Process 3 at a time

          if (__DEV__) {
          }
        } else {
          if (__DEV__) {
            devWarn('G��n+� [BUSINESS CATEGORIES] No categories in API response');
          }
        }
      } catch (error) {
        if (__DEV__) {
          devError('Error loading business categories:', error);
        }
      } finally {
        if (isMounted) {
          setBusinessCategoriesLoading(false);
        }
      }
    };

    loadBusinessCategories();

    return () => {
      isMounted = false;
    };
  }, [selectedBusinessProfile?.id, selectedBusinessProfile?.subcategory, selectedBusinessProfile?.subCategory]);

  // Fetch preview images for categories missing previews when modal opens
  useEffect(() => {
    if (!isBusinessCategoriesModalVisible) {
      return;
    }

    // Find categories that don't have preview images yet
    const categoriesWithoutPreviews = businessCategories.filter(
      category => !businessCategoryPreviews[category.id] || businessCategoryPreviews[category.id].length === 0
    );

    if (categoriesWithoutPreviews.length > 0) {
      // Fetch preview images for missing categories (non-blocking)
      React.startTransition(() => {
        fetchBusinessCategoryPreviewImages(categoriesWithoutPreviews, 3);
      });
    }
  }, [isBusinessCategoriesModalVisible, businessCategories, businessCategoryPreviews, fetchBusinessCategoryPreviewImages]);

  // Initialize animations immediately on mount
  useEffect(() => {
    if (animationsInitializedRef.current) return;

    // Use InteractionManager to start animations after initial render
    const interaction = InteractionManager.runAfterInteractions(() => {
      // Ensure fade animations start at visible state
      categoryFadeAnim.setValue(1);
      businessCategoryFadeAnim.setValue(1);
      animationsInitializedRef.current = true;
    });

    return () => {
      interaction.cancel();
    };
  }, [categoryFadeAnim, businessCategoryFadeAnim]);

  // Rotate categories every 3 seconds - start immediately even if categories are loading
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let interactionHandle: any = null;

    // Start rotation immediately, even if categories are empty (will use fallback)
    const startRotation = () => {
      if (greetingCategories.length > 0) {
        // If categories are loaded, rotate through them
        interval = setInterval(() => {
          animateCategoryChange();
          setCurrentCategoryIndex((prevIndex) => (prevIndex + 1) % greetingCategories.length);
        }, 3000);
      } else {
        // Even if no categories, trigger animation to show it's working
        interval = setInterval(() => {
          animateCategoryChange();
        }, 3000);
      }
    };

    // Start immediately
    startRotation();

    // Also ensure it starts after interactions complete
    interactionHandle = InteractionManager.runAfterInteractions(() => {
      if (interval) {
        clearInterval(interval);
      }
      startRotation();
    });

    return () => {
      if (interactionHandle) {
        interactionHandle.cancel();
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [greetingCategories, animateCategoryChange]);

  // Rotate business categories every 3 seconds - start immediately even if categories are loading
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let interactionHandle: any = null;

    // Start rotation immediately, even if categories are empty (will use fallback)
    const startRotation = () => {
      if (rotatingBusinessCategories.length > 0) {
        // If categories are loaded, rotate through them
        interval = setInterval(() => {
          animateBusinessCategoryChange();
          setCurrentBusinessCategoryIndex((prevIndex) => (prevIndex + 1) % rotatingBusinessCategories.length);
        }, 3000);
      } else {
        // Even if no categories, trigger animation to show it's working
        interval = setInterval(() => {
          animateBusinessCategoryChange();
        }, 3000);
      }
    };

    // Start immediately
    startRotation();

    // Also ensure it starts after interactions complete
    interactionHandle = InteractionManager.runAfterInteractions(() => {
      if (interval) {
        clearInterval(interval);
      }
      startRotation();
    });

    return () => {
      if (interactionHandle) {
        interactionHandle.cancel();
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [rotatingBusinessCategories, animateBusinessCategoryChange]);

  // Cleanup highlight timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  // Optimized: Use ref to cache greeting templates and only recalculate when data lengths change
  const greetingTemplatesCacheRef = useRef<{
    templates: any[];
    lengthsSignature: string; // Serialized lengths for quick comparison
  }>({ templates: [], lengthsSignature: '' });

  // Collect all greeting templates for unified search (optimized with caching)
  const allGreetingTemplates = useMemo(() => {
    // Calculate current lengths signature for quick comparison
    const currentLengthsSignature = [
      businessEthicsTemplatesRaw.length,
      successMindsetTemplatesRaw.length,
      socialMediaGrowthTemplatesRaw.length,
      moneyAndFinanceTemplatesRaw.length,
      businessLegendQuoteTemplatesRaw.length,
      businessMarketingTipsTemplatesRaw.length,
      businessQuotesTemplatesRaw.length,
    ].join(',') + '-v2'; // Added v2 to force cache refresh after logic update

    // If lengths haven't changed, return cached result (optimization)
    if (greetingTemplatesCacheRef.current.lengthsSignature === currentLengthsSignature &&
      greetingTemplatesCacheRef.current.templates.length > 0) {
      return greetingTemplatesCacheRef.current.templates;
    }

    const all: any[] = [];

    // Map with specific category names to ensure correct search grouping
    // We explicitly overwrite the category because templates might have generic 'General' or 'Greeting' from API
    if (businessEthicsTemplatesRaw.length > 0) {
      all.push(...businessEthicsTemplatesRaw.map(t => ({ ...t, category: 'Business Ethics' })));
    }
    if (successMindsetTemplatesRaw.length > 0) {
      all.push(...successMindsetTemplatesRaw.map(t => ({ ...t, category: 'Success Mindset' })));
    }
    if (socialMediaGrowthTemplatesRaw.length > 0) {
      all.push(...socialMediaGrowthTemplatesRaw.map(t => ({ ...t, category: 'Social Media Growth' })));
    }
    if (moneyAndFinanceTemplatesRaw.length > 0) {
      all.push(...moneyAndFinanceTemplatesRaw.map(t => ({ ...t, category: 'Money and Finance' })));
    }
    if (businessLegendQuoteTemplatesRaw.length > 0) {
      all.push(...businessLegendQuoteTemplatesRaw.map(t => ({ ...t, category: 'Business Legend Quote' })));
    }
    if (businessMarketingTipsTemplatesRaw.length > 0) {
      all.push(...businessMarketingTipsTemplatesRaw.map(t => ({ ...t, category: 'Business Marketing Tips' })));
    }
    if (businessQuotesTemplatesRaw.length > 0) {
      all.push(...businessQuotesTemplatesRaw.map(t => ({ ...t, category: 'Business Quotes' })));
    }

    // Convert greeting templates to Template format for unified search
    const converted = all.map(greetingTemplate => ({
      id: greetingTemplate.id,
      name: greetingTemplate.name || greetingTemplate.title || '',
      thumbnail: greetingTemplate.thumbnail || greetingTemplate.imageUrl || '',
      category: greetingTemplate.category || 'Greeting',
      downloads: greetingTemplate.downloads || 0,
      isDownloaded: greetingTemplate.isDownloaded || false,
      description: greetingTemplate.description || greetingTemplate.content?.text || '',
      tags: greetingTemplate.tags || [],
      isGreeting: true, // Flag to identify greeting templates
      originalTemplate: greetingTemplate, // Keep reference to original
    }));

    // Cache the result
    greetingTemplatesCacheRef.current = {
      templates: converted,
      lengthsSignature: currentLengthsSignature,
    };

    return converted;
  }, [
    businessEthicsTemplatesRaw,
    successMindsetTemplatesRaw,
    socialMediaGrowthTemplatesRaw,
    moneyAndFinanceTemplatesRaw,
    businessLegendQuoteTemplatesRaw,
    businessMarketingTipsTemplatesRaw,
    businessQuotesTemplatesRaw,
  ]);

  
  // Lightweight hierarchy resolution for parent category search
  const getChildCategoriesForParent = useCallback((parentCategoryName: string, categories: any[]) => {
    return categories.filter(category => 
      category.parentCategoryName?.toLowerCase() === parentCategoryName.toLowerCase()
    );
  }, []);

  
  /**
   * Helper function to detect if API response contains hierarchical data
   */
  const isHierarchicalResponse = useCallback((response: any): boolean => {
    return response?.data?.parentCategory && Array.isArray(response?.data?.categories);
  }, []);

  /**
   * Unified normalization function for both business and general categories
   * Converts any category data to common HierarchicalSearchResult format
   */
  // normalizeCategoryData moved to top of component to fix hoisting issues


  /**
   * Helper function to convert hierarchical response to renderable format
   * Now works with unified data structure
   */
  const convertHierarchicalToSearchResults = useCallback((hierarchicalData: HierarchicalSearchResult, skipParentCategory: boolean = false): HierarchicalSearchItem[] => {
    const items: HierarchicalSearchItem[] = [];
    const addedParentCategories = new Set<string>();
    
    // Add parent category header (deduplicated) - skip for general categories
    if (!skipParentCategory && !addedParentCategories.has(hierarchicalData.parentCategory)) {
      items.push({
        type: 'parentCategory',
        data: { 
          name: hierarchicalData.parentCategory,
          // Find parent category data for image
          ...(hierarchicalData.categories[0] && {
            id: hierarchicalData.categories[0].id,
            icon: hierarchicalData.categories[0].icon,
            imageUrl: hierarchicalData.categories[0].imageUrl,
            color: hierarchicalData.categories[0].color
          })
        }
      });
      addedParentCategories.add(hierarchicalData.parentCategory);
    }
    
    // Add child categories with their templates
    hierarchicalData.categories.forEach(childCategory => {
      items.push({
        type: 'childCategory',
        data: {
          name: childCategory.name,
          templates: childCategory.templates,
          // Include image fields for rendering
          id: childCategory.id,
          icon: childCategory.icon,
          imageUrl: childCategory.imageUrl,
          color: childCategory.color
        }
      });
    });
    
    return items;
  }, []);

  /**
   * Helper function to flatten hierarchical results for search filtering
   */
  const flattenHierarchicalResults = useCallback((hierarchicalData: HierarchicalSearchResult): Template[] => {
    return hierarchicalData.categories.flatMap(category => category.images);
  }, []);

  // Clean search implementation - single pipeline
  useEffect(() => {
    // Reset immediately if search is empty
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Debounce search execution
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim() === '') return;

      setIsSearching(true);

      try {
        // Filter categories that match the search query
        const matchingBusinessCategories = filterCategories(businessCategories, searchQuery);
        const matchingGeneralCategories = filterCategories(filteredGreetingCategoriesList, searchQuery);

        // Fetch posters for each matched category
        const fetchPostersForCategories = async () => {
          const results: SearchCategoryResult[] = [];

          // Business categories
          for (const category of matchingBusinessCategories) {
            try {
              const response = await businessCategoryPostersApi.getPostersByCategory(category.name, 50);
              const posters = response.success && response.data?.posters ? response.data.posters : [];
              
              results.push({
                id: category.id,
                name: category.name,
                type: 'business',
                posters,
                parentCategoryName: category.parentCategoryName
              });
            } catch (error) {
              if (__DEV__) devWarn(`Failed to fetch business category ${category.name}:`, error);
            }
          }

          // General categories  
          for (const category of matchingGeneralCategories) {
            try {
              const templates = await greetingTemplatesService.searchTemplates(category.name);
              
              results.push({
                id: category.id,
                name: category.name,
                type: 'general',
                posters: templates || [],
                parentCategoryName: category.parentCategoryName
              });
            } catch (error) {
              if (__DEV__) devWarn(`Failed to fetch general category ${category.name}:`, error);
            }
          }

          return results;
        };

        const results = await fetchPostersForCategories();
        setSearchResults(results);

      } catch (error) {
        if (__DEV__) devError('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }

    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, businessCategories, filteredGreetingCategoriesList, filterCategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      // Clear all caches before refreshing
      homeApi.clearCache();
      greetingTemplatesService.clearCache(); // Clear greeting templates cache
      calendarApi.clearCache(); // Clear calendar posters cache to show newly posted images

      // Force refresh calendar component by updating refresh key
      setCalendarRefreshKey(prev => prev + 1);

      // Force refresh categories to ensure deleted categories are removed
      await greetingTemplatesService.refreshCategories();

      // Refresh API data
      await loadApiData(true);
    } catch (error) {
      if (__DEV__) {
        devError('Error refreshing:', error);
      }
    } finally {
      setRefreshing(false);
    }
  }, [loadApiData]);

  const handleTabChange = useCallback(async (tab: string) => {
    setActiveTab(tab);
    setIsSearching(false); // Reset search state
    // Tab functionality removed - no professional templates
  }, []);

  // Like functionality has been removed - templates no longer have like status
  const applyUserLikeStatus = useCallback(async (templates: Template[]) => {
    return templates;
  }, []);


  // const handleDownloadTemplate = useCallback(async (templateId: string) => {
  //   // Update local state immediately for better UX
  //   setTemplates(prev => prev.map(item =>
  //     item.type === 'template' && item.data.id === templateId
  //       ? { 
  //           ...item, 
  //           data: { 
  //             ...item.data, 
  //             isDownloaded: true, 
  //             downloads: item.data.downloads + 1 
  //           } 
  //         }
  //       : item
  //   ));

  //   // Try API call in background
  //   setTimeout(async () => {
  //     try {
  //       await dashboardService.downloadTemplate(templateId);
  //     } catch (error) {
  //       if (__DEV__) {
  //         devError('Error downloading template:', error);
  //       }
  //     }
  //   }, 100);
  // }, []);

  // Memoized lookup maps for O(1) access instead of O(n) find operations
  const videoContentMap = useMemo(() => {
    const map = new Map();
    videoContent.forEach(video => map.set(video.id, video));
    return map;
  }, [videoContent]);


  // Memoize business category previews to prevent unnecessary re-renders
  const memoizedBusinessCategoryPreviews = useMemo(() => {
    return businessCategoryPreviews;
  }, [businessCategoryPreviews]);

  const handleTemplatePress = useCallback((template: Template | VideoContent | any) => {
    // Check for active subscription if a business profile is selected
    if (!isActive && selectedBusinessProfile) {
      Alert.alert(
        "Subscription Required",
        "This profile is currently locked. Please activate your subscription in the Business Profiles screen to use this template.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Activate Now", 
            onPress: () => {
              console.log('🔍 HOME SCREEN - Navigating to Subscription with context');
              navigation.navigate('Subscription' as any, { 
                source: 'BUSINESS_PROFILE_REQUIRED' 
              });
            }
          }
        ]
      );
      return;
    }

    // Navigate immediately using optimized O(1) lookups
    // Check for video match using O(1) lookup
    const matchedVideo = videoContentMap.get(template.id);

    if (matchedVideo) {
      // Pre-filter related videos for faster access
      const related = videoContent.filter(video => video.id !== matchedVideo.id);
      navigation.navigate('VideoPlayer', {
        selectedVideo: matchedVideo,
        relatedVideos: related,
      });
      return;
    }

    // Check if it's a greeting template
    if (template.isGreeting && template.originalTemplate) {
      // Navigate immediately with pre-computed related templates
      const relatedTemplates = allGreetingTemplates.filter(t => t.id !== template.id);
      navigation.navigate('PosterPlayer', {
        selectedPoster: template.originalTemplate,
        relatedPosters: relatedTemplates.map(t => t.originalTemplate || t),
        searchQuery: searchQuery,
        templateSource: 'greeting',
      });
      return;
    }

    // Navigate to PosterPlayer with template
    navigation.navigate('PosterPlayer', {
      selectedPoster: template as Template,
      relatedPosters: [],
    });
  }, [videoContentMap, videoContent, allGreetingTemplates, navigation, searchQuery, isActive, selectedBusinessProfile]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedTemplate(null);
  }, []);

  // Customer Support handlers
  const openCustomerSupportModal = useCallback(() => {
    setIsCustomerSupportModalVisible(true);
  }, []);

  const closeCustomerSupportModal = useCallback(() => {
    setIsCustomerSupportModalVisible(false);
  }, []);

  const closeBusinessProfileDropdown = useCallback(() => {
    setIsBusinessProfileDropdownVisible(false);
    setBusinessProfileDropdownPosition(null);
  }, []);

  const toggleBusinessProfileDropdown = useCallback(() => {
    if (userBusinessProfiles.length === 0) {
      return;
    }
    if (isBusinessProfileDropdownVisible) {
      closeBusinessProfileDropdown();
      return;
    }
    if (userProfileSectionRef.current) {
      userProfileSectionRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        setBusinessProfileDropdownPosition({
          top: y + height + moderateScale(4),
          left: x,
          width,
        });
        setIsBusinessProfileDropdownVisible(true);
      });
    }
  }, [userBusinessProfiles.length, isBusinessProfileDropdownVisible, closeBusinessProfileDropdown]);

  const handleBusinessProfileSelect = useCallback(async (profileId: string) => {
    const profile = userBusinessProfiles.find(p => p.id === profileId) || null;
    
    console.log('🔄 [HOMESCREEN] handleBusinessProfileSelect called:', {
      profileId,
      profileName: profile?.name,
      subscriptionStatus: profile?.subscriptionStatus
    });

    await setSelectedBusinessProfile(profile);
    closeBusinessProfileDropdown();
    businessCategoryPostersApi.clearCache();
  }, [closeBusinessProfileDropdown, userBusinessProfiles, setSelectedBusinessProfile]);

  const handleWhatsAppPress = useCallback(async () => {
    try {
      const phoneNumber = '918551941415'; // Phone number without + sign for WhatsApp (8551941415 with country code 91)
      const message = 'I need support';
      const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web WhatsApp if app is not installed
        const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      if (__DEV__) {
        devError('Error opening WhatsApp:', error);
      }
    }
  }, []);

  const handlePhonePress = useCallback(async () => {
    try {
      const phoneNumber = '8551941415'; // Updated phone number
      const url = `tel:${phoneNumber}`;
      await Linking.openURL(url);
    } catch (error) {
      if (__DEV__) {
        devError('Error opening phone dialer:', error);
      }
    }
  }, []);

  const handleEmailPress = useCallback(async () => {
    try {
      const email = 'support@marketbrand.ai'; // Email from HelpSupportScreen
      const subject = 'Help Request from MarketBrand App';
      const body = 'Hello, I need support with...';
      const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      await Linking.openURL(url);
    } catch (error) {
      if (__DEV__) {
        devError('Error opening email client:', error);
      }
    }
  }, []);

  const toggleSearchBar = useCallback(() => {
    setIsSearchBarVisible(prev => {
      if (!prev) {
        // When opening search, clear any existing search
        return true;
      } else {
        // When closing search, clear search query and reset
        setSearchQuery('');
        setIsSearching(false);
        setSearchResults([]);
        return false;
      }
    });
  }, []);


  const handleViewAllVideos = useCallback(() => {
    setIsVideosModalVisible(true);
  }, []);

  const closeVideosModal = useCallback(() => {
    setIsVideosModalVisible(false);
  }, []);

  // Greeting section modal handlers
  const handleViewAllBusinessEthics = useCallback(() => {
    setIsBusinessEthicsModalVisible(true);
  }, []);

  const closeBusinessEthicsModal = useCallback(() => {
    setIsBusinessEthicsModalVisible(false);
  }, []);

  const handleViewAllSuccessMindset = useCallback(() => {
    setIsSuccessMindsetModalVisible(true);
  }, []);

  const closeSuccessMindsetModal = useCallback(() => {
    setIsSuccessMindsetModalVisible(false);
  }, []);

  const handleViewAllSocialMediaGrowth = useCallback(() => {
    setIsSocialMediaGrowthModalVisible(true);
  }, []);

  const closeSocialMediaGrowthModal = useCallback(() => {
    setIsSocialMediaGrowthModalVisible(false);
  }, []);

  const handleViewAllMoneyAndFinance = useCallback(() => {
    setIsMoneyAndFinanceModalVisible(true);
  }, []);

  const closeMoneyAndFinanceModal = useCallback(() => {
    setIsMoneyAndFinanceModalVisible(false);
  }, []);

  const handleViewAllBusinessLegendQuote = useCallback(() => {
    setIsBusinessLegendQuoteModalVisible(true);
  }, []);

  const closeBusinessLegendQuoteModal = useCallback(() => {
    setIsBusinessLegendQuoteModalVisible(false);
  }, []);

  const handleViewAllBusinessMarketingTips = useCallback(() => {
    setIsBusinessMarketingTipsModalVisible(true);
  }, []);

  const closeBusinessMarketingTipsModal = useCallback(() => {
    setIsBusinessMarketingTipsModalVisible(false);
  }, []);

  const handleViewAllBusinessQuotes = useCallback(() => {
    setIsBusinessQuotesModalVisible(true);
  }, []);

  const closeBusinessQuotesModal = useCallback(() => {
    setIsBusinessQuotesModalVisible(false);
  }, []);

  const handleViewAllFeaturedContent = useCallback(() => {
    setIsFeaturedContentModalVisible(true);
  }, []);

  const closeFeaturedContentModal = useCallback(() => {
    setIsFeaturedContentModalVisible(false);
  }, []);

  const handleViewAllBusinessCategories = useCallback(() => {
    setIsBusinessCategoriesModalVisible(true);
  }, []);

  // Store the Y position of business categories section
  const businessCategoriesSectionY = useRef<number>(0);

  // Memoize onLayout callback for business categories section
  const handleBusinessCategoriesLayout = useCallback(() => {
    // Measure absolute position relative to ScrollView
    if (businessCategoriesSectionRef.current && scrollViewRef.current) {
      businessCategoriesSectionRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          businessCategoriesSectionY.current = y;
        },
        () => {
          // Fallback: store relative position
          businessCategoriesSectionRef.current?.measure((x, y, width, height, pageX, pageY) => {
            businessCategoriesSectionY.current = pageY;
          });
        }
      );
    }
  }, []);

  const handleBusinessButtonPress = useCallback(() => {
    setSelectedCategory('business');

    // Clear any existing highlight timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    // Highlight the business categories section
    setIsBusinessCategoriesHighlighted(true);

    // Clear highlight after 3 seconds
    highlightTimeoutRef.current = setTimeout(() => {
      setIsBusinessCategoriesHighlighted(false);
      highlightTimeoutRef.current = null;
    }, 3000);
  }, []);

  const handleViewAllGeneralCategories = useCallback(() => {
    navigation.navigate('GreetingTemplates');
  }, [navigation]);

  const closeGeneralCategoriesModal = useCallback(() => {
    setIsGeneralCategoriesModalVisible(false);
  }, []);

  // Memoized render functions to prevent unnecessary re-renders
  const renderBanner = useCallback(({ item }: { item: Banner }) => {
    // Find the corresponding featured content to get thumbnailUrl if available
    const featuredItem = featuredContent.find(fc => fc.id === item.id);
    // Prioritize thumbnailUrl for faster loading, fallback to imageUrl
    const bannerImageUrl = featuredItem?.thumbnailUrl || item.imageUrl;

    // Convert featured content to Template format for navigation
    const convertFeaturedContentToTemplate = (featured: FeaturedContent): Template => ({
      id: featured.id,
      name: featured.title,
      thumbnail: featured.thumbnailUrl || featured.imageUrl, // Use thumbnailUrl if available
      category: featured.type || 'Featured Content',
      downloads: 0,
      isDownloaded: false,
      tags: [],
    });

    const handleBannerPress = () => {
      // Check for active subscription if a business profile is selected
      if (!isActive && selectedBusinessProfile) {
        Alert.alert(
          "Subscription Required",
          "This profile is currently locked. Please activate your subscription in the Business Profiles screen to use this feature.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Activate Now", 
              onPress: () => {
                console.log('🔍 HOME SCREEN - Navigating to Subscription with context (banner)');
                navigation.navigate('Subscription' as any, { 
                  source: 'BUSINESS_PROFILE_REQUIRED' 
                });
              }
            }
          ]
        );
        return;
      }

      // Find the clicked featured content item
      const clickedFeaturedContent = featuredContent.find(fc => fc.id === item.id);

      if (!clickedFeaturedContent) {
        // Fallback if featured content not found
        const bannerTemplate: Template = {
          id: item.id || 'banner-template',
          name: item.title,
          thumbnail: item.imageUrl,
          category: 'Featured Content',
          downloads: 0,
          isDownloaded: false,
        };
        navigation.navigate('PosterPlayer', {
          selectedPoster: bannerTemplate,
          relatedPosters: [], // No related if featured content not found
        });
        return;
      }

      // Convert clicked item to template
      const selectedTemplate = convertFeaturedContentToTemplate(clickedFeaturedContent);

      // Get other featured content items (excluding the clicked one) and convert to templates
      const relatedTemplates = featuredContent
        .filter(fc => fc.id !== item.id)
        .map(convertFeaturedContentToTemplate);

      navigation.navigate('PosterPlayer', {
        selectedPoster: selectedTemplate,
        relatedPosters: relatedTemplates, // Show other featured content items
      });
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.bannerContainerWrapper}
        onPress={handleBannerPress}
      >
        <View style={styles.bannerContainer}>
          <OptimizedImage
            uri={bannerImageUrl}
            style={styles.bannerImage}
            resizeMode="cover"
            mode="thumbnail"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.bannerOverlay}
          />
          <View style={styles.bannerContent}>
            {/* Banner title removed as per user request */}
            <TouchableOpacity
              style={[styles.bannerButton, { backgroundColor: theme.colors.cardBackground }]}
              onPress={handleBannerPress}
            >
              <Text style={[styles.bannerButtonText, { color: theme.colors.primary }]}>VIEW</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [theme, navigation, featuredContent]);



  
  // Render function for hierarchical search results
  const renderHierarchicalItem = useCallback(({ item }: { item: HierarchicalSearchItem }) => {
    switch (item.type) {
      case 'parentCategory':
        return (
          <View style={styles.parentCategoryContainer}>
            <Text style={[styles.parentCategoryTitle, { color: theme.colors.text }]}>
              {item.data.name}
            </Text>
          </View>
        );
      
      case 'childCategory':
        return (
          <View style={styles.childCategoryContainer}>
            <Text style={[styles.childCategoryTitle, { color: theme.colors.textSecondary }]}>
              {item.data.name}
            </Text>
            <FlatList
              data={item.data.templates}
              renderItem={({ item: template }) => (
                <TemplateCard
                  item={template}
                  cardWidth={cardWidth}
                  theme={theme}
                  onPress={handleTemplatePress}
                />
              )}
              keyExtractor={(template) => template.id}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              removeClippedSubviews={true}
              maxToRenderPerBatch={3}
              windowSize={2}
              initialNumToRender={3}
              updateCellsBatchingPeriod={150}
              getItemLayout={getItemLayout}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        );
      
      default:
        return null;
    }
  }, [handleTemplatePress, theme, cardWidth, filteredGreetingCategoriesList, businessCategories, memoizedGreetingCategoryImages]);


  const handleVideoCardPress = useCallback(() => {
    setShowVideoComingSoonModal(true);
  }, []);

  const renderVideoTemplate = useCallback(({ item }: { item: VideoContent }) => {
    return (
      <VideoTemplateCard
        item={item}
        cardWidth={cardWidth}
        theme={theme}
        playIconSize={playIconSize}
        onPress={handleVideoCardPress}
      />
    );
  }, [theme, cardWidth, playIconSize, handleVideoCardPress]);

  // Carousel card dimensions with spacing
  const SCREEN_WIDTH = screenWidth;
  const CARD_SPACING = 20;
  const SIDE_PADDING = 20;
  const CARD_WIDTH = SCREEN_WIDTH - (SIDE_PADDING * 2);
  const featuredCarouselItemWidth = CARD_WIDTH;
  const featuredCarouselItemHeight = useMemo(() => featuredCarouselItemWidth / 3, [featuredCarouselItemWidth]); // 3:1 aspect ratio
  const featuredCarouselSnapInterval = useMemo(() => CARD_WIDTH + CARD_SPACING, [CARD_WIDTH, CARD_SPACING]);

  // Memoized key extractors
  const keyExtractor = useCallback((item: any) => item.id, []);

  // Memoized renderItem functions for each category to prevent re-creation
  // These are stable functions that won't change on every render
  // Using useCallback instead of useMemo for better performance

  const businessEthicsCategoryTemplates = useMemo(() =>
    businessEthicsTemplatesRaw.length > 0 ? businessEthicsTemplatesRaw : businessEthicsTemplates,
    [businessEthicsTemplatesRaw, businessEthicsTemplates]
  );
  const renderBusinessEthicsCard = useCallback(({ item }: { item: any }) => (
    <GreetingCard
      item={item}
      cardWidth={cardWidth}
      theme={theme}
      categoryTemplates={businessEthicsCategoryTemplates}
      searchQuery="business ethics"
      navigation={navigation}
    />
  ), [navigation, theme, cardWidth, businessEthicsCategoryTemplates]);

  const successMindsetCategoryTemplates = useMemo(() =>
    successMindsetTemplatesRaw.length > 0 ? successMindsetTemplatesRaw : successMindsetTemplates,
    [successMindsetTemplatesRaw, successMindsetTemplates]
  );
  const renderSuccessMindsetCard = useCallback(({ item }: { item: any }) => (
    <GreetingCard
      item={item}
      cardWidth={cardWidth}
      theme={theme}
      categoryTemplates={successMindsetCategoryTemplates}
      searchQuery="success mindset"
      navigation={navigation}
    />
  ), [navigation, theme, cardWidth, successMindsetCategoryTemplates]);

  const socialMediaGrowthCategoryTemplates = useMemo(() =>
    socialMediaGrowthTemplatesRaw.length > 0 ? socialMediaGrowthTemplatesRaw : socialMediaGrowthTemplates,
    [socialMediaGrowthTemplatesRaw, socialMediaGrowthTemplates]
  );
  const renderSocialMediaGrowthCard = useCallback(({ item }: { item: any }) => (
    <GreetingCard
      item={item}
      cardWidth={cardWidth}
      theme={theme}
      categoryTemplates={socialMediaGrowthCategoryTemplates}
      searchQuery="social media growth"
      navigation={navigation}
    />
  ), [navigation, theme, cardWidth, socialMediaGrowthCategoryTemplates]);

  const moneyAndFinanceCategoryTemplates = useMemo(() =>
    moneyAndFinanceTemplatesRaw.length > 0 ? moneyAndFinanceTemplatesRaw : moneyAndFinanceTemplates,
    [moneyAndFinanceTemplatesRaw, moneyAndFinanceTemplates]
  );
  const renderMoneyAndFinanceCard = useCallback(({ item }: { item: any }) => (
    <GreetingCard
      item={item}
      cardWidth={cardWidth}
      theme={theme}
      categoryTemplates={moneyAndFinanceCategoryTemplates}
      searchQuery="money and finance"
      navigation={navigation}
    />
  ), [navigation, theme, cardWidth, moneyAndFinanceCategoryTemplates]);

  const businessLegendQuoteCategoryTemplates = useMemo(() =>
    businessLegendQuoteTemplatesRaw.length > 0 ? businessLegendQuoteTemplatesRaw : businessLegendQuoteTemplates,
    [businessLegendQuoteTemplatesRaw, businessLegendQuoteTemplates]
  );
  const renderBusinessLegendQuoteCard = useCallback(({ item }: { item: any }) => (
    <GreetingCard
      item={item}
      cardWidth={cardWidth}
      theme={theme}
      categoryTemplates={businessLegendQuoteCategoryTemplates}
      searchQuery="business legend quote"
      navigation={navigation}
    />
  ), [navigation, theme, cardWidth, businessLegendQuoteCategoryTemplates]);

  const businessMarketingTipsCategoryTemplates = useMemo(() =>
    businessMarketingTipsTemplatesRaw.length > 0 ? businessMarketingTipsTemplatesRaw : businessMarketingTipsTemplates,
    [businessMarketingTipsTemplatesRaw, businessMarketingTipsTemplates]
  );
  const renderBusinessMarketingTipsCard = useCallback(({ item }: { item: any }) => (
    <GreetingCard
      item={item}
      cardWidth={cardWidth}
      theme={theme}
      categoryTemplates={businessMarketingTipsCategoryTemplates}
      searchQuery="business marketing tips"
      navigation={navigation}
    />
  ), [navigation, theme, cardWidth, businessMarketingTipsCategoryTemplates]);

  const businessQuotesCategoryTemplates = useMemo(() =>
    businessQuotesTemplatesRaw.length > 0 ? businessQuotesTemplatesRaw : businessQuotesTemplates,
    [businessQuotesTemplatesRaw, businessQuotesTemplates]
  );
  const renderBusinessQuotesCard = useCallback(({ item }: { item: any }) => (
    <GreetingCard
      item={item}
      cardWidth={cardWidth}
      theme={theme}
      categoryTemplates={businessQuotesCategoryTemplates}
      searchQuery="business quotes"
      navigation={navigation}
    />
  ), [navigation, theme, cardWidth, businessQuotesCategoryTemplates]);




  const renderBrowseAllButton = useCallback((onPress: () => void) => (
    <TouchableOpacity
      style={styles.viewAllButton}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[theme.colors.secondary, theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.viewAllButtonGradient}
      >
        <Text style={styles.viewAllButtonText}>View More</Text>
      </LinearGradient>
    </TouchableOpacity>
  ), [theme.colors.primary, theme.colors.secondary]);

  // Pagination handlers for greeting sections - load 3 more items when user scrolls
  const loadMoreBusinessEthics = useCallback(async () => {
    if (businessEthicsLoading || businessEthicsTemplates.length >= businessEthicsTemplatesRaw.length) return;

    setBusinessEthicsLoading(true);
    try {
      // If we have raw templates, use them; otherwise fetch more
      if (businessEthicsTemplatesRaw.length > businessEthicsTemplates.length) {
        const nextBatch = businessEthicsTemplatesRaw.slice(
          businessEthicsTemplates.length,
          businessEthicsTemplates.length + 3
        );
        React.startTransition(() => {
          setBusinessEthicsTemplates(prev => [...prev, ...nextBatch]);
        });
      } else {
        // Fetch more from API
        const results = await greetingTemplatesService.searchTemplates('business ethics');
        const newItems = results.slice(businessEthicsTemplates.length, businessEthicsTemplates.length + 3);
        React.startTransition(() => {
          setBusinessEthicsTemplates(prev => [...prev, ...newItems]);
          setBusinessEthicsTemplatesRaw(results);
        });
      }
    } catch (error) {
      if (__DEV__) {
        devError('Error loading more business ethics:', error);
      }
    } finally {
      setBusinessEthicsLoading(false);
    }
  }, [businessEthicsTemplates, businessEthicsTemplatesRaw, businessEthicsLoading]);

  const loadMoreSuccessMindset = useCallback(async () => {
    if (successMindsetLoading || successMindsetTemplates.length >= successMindsetTemplatesRaw.length) return;

    setSuccessMindsetLoading(true);
    try {
      if (successMindsetTemplatesRaw.length > successMindsetTemplates.length) {
        const nextBatch = successMindsetTemplatesRaw.slice(
          successMindsetTemplates.length,
          successMindsetTemplates.length + 3
        );
        React.startTransition(() => {
          setSuccessMindsetTemplates(prev => [...prev, ...nextBatch]);
        });
      } else {
        const results = await greetingTemplatesService.searchTemplates('success mindset');
        const newItems = results.slice(successMindsetTemplates.length, successMindsetTemplates.length + 3);
        React.startTransition(() => {
          setSuccessMindsetTemplates(prev => [...prev, ...newItems]);
          setSuccessMindsetTemplatesRaw(results);
        });
      }
    } catch (error) {
      if (__DEV__) {
        devError('Error loading more success mindset:', error);
      }
    } finally {
      setSuccessMindsetLoading(false);
    }
  }, [successMindsetTemplates, successMindsetTemplatesRaw, successMindsetLoading]);

  const loadMoreSocialMediaGrowth = useCallback(async () => {
    if (socialMediaGrowthLoading || socialMediaGrowthTemplates.length >= socialMediaGrowthTemplatesRaw.length) return;

    setSocialMediaGrowthLoading(true);
    try {
      if (socialMediaGrowthTemplatesRaw.length > socialMediaGrowthTemplates.length) {
        const nextBatch = socialMediaGrowthTemplatesRaw.slice(
          socialMediaGrowthTemplates.length,
          socialMediaGrowthTemplates.length + 3
        );
        React.startTransition(() => {
          setSocialMediaGrowthTemplates(prev => [...prev, ...nextBatch]);
        });
      } else {
        const results = await greetingTemplatesService.searchTemplates('social media growth');
        const newItems = results.slice(socialMediaGrowthTemplates.length, socialMediaGrowthTemplates.length + 3);
        React.startTransition(() => {
          setSocialMediaGrowthTemplates(prev => [...prev, ...newItems]);
          setSocialMediaGrowthTemplatesRaw(results);
        });
      }
    } catch (error) {
      if (__DEV__) {
        devError('Error loading more social media growth:', error);
      }
    } finally {
      setSocialMediaGrowthLoading(false);
    }
  }, [socialMediaGrowthTemplates, socialMediaGrowthTemplatesRaw, socialMediaGrowthLoading]);

  const loadMoreMoneyAndFinance = useCallback(async () => {
    if (moneyAndFinanceLoading || moneyAndFinanceTemplates.length >= moneyAndFinanceTemplatesRaw.length) return;

    setMoneyAndFinanceLoading(true);
    try {
      if (moneyAndFinanceTemplatesRaw.length > moneyAndFinanceTemplates.length) {
        const nextBatch = moneyAndFinanceTemplatesRaw.slice(
          moneyAndFinanceTemplates.length,
          moneyAndFinanceTemplates.length + 3
        );
        React.startTransition(() => {
          setMoneyAndFinanceTemplates(prev => [...prev, ...nextBatch]);
        });
      } else {
        const results = await greetingTemplatesService.searchTemplates('money and finance');
        const newItems = results.slice(moneyAndFinanceTemplates.length, moneyAndFinanceTemplates.length + 3);
        React.startTransition(() => {
          setMoneyAndFinanceTemplates(prev => [...prev, ...newItems]);
          setMoneyAndFinanceTemplatesRaw(results);
        });
      }
    } catch (error) {
      if (__DEV__) {
        devError('Error loading more money and finance:', error);
      }
    } finally {
      setMoneyAndFinanceLoading(false);
    }
  }, [moneyAndFinanceTemplates, moneyAndFinanceTemplatesRaw, moneyAndFinanceLoading]);

  const loadMoreBusinessLegendQuote = useCallback(async () => {
    if (businessLegendQuoteLoading || businessLegendQuoteTemplates.length >= businessLegendQuoteTemplatesRaw.length) return;

    setBusinessLegendQuoteLoading(true);
    try {
      if (businessLegendQuoteTemplatesRaw.length > businessLegendQuoteTemplates.length) {
        const nextBatch = businessLegendQuoteTemplatesRaw.slice(
          businessLegendQuoteTemplates.length,
          businessLegendQuoteTemplates.length + 3
        );
        React.startTransition(() => {
          setBusinessLegendQuoteTemplates(prev => [...prev, ...nextBatch]);
        });
      } else {
        const results = await greetingTemplatesService.searchTemplates('business legend quote');
        const newItems = results.slice(businessLegendQuoteTemplates.length, businessLegendQuoteTemplates.length + 3);
        React.startTransition(() => {
          setBusinessLegendQuoteTemplates(prev => [...prev, ...newItems]);
          setBusinessLegendQuoteTemplatesRaw(results);
        });
      }
    } catch (error) {
      if (__DEV__) {
        devError('Error loading more business legend quote:', error);
      }
    } finally {
      setBusinessLegendQuoteLoading(false);
    }
  }, [businessLegendQuoteTemplates, businessLegendQuoteTemplatesRaw, businessLegendQuoteLoading]);

  const loadMoreBusinessMarketingTips = useCallback(async () => {
    if (businessMarketingTipsLoading || businessMarketingTipsTemplates.length >= businessMarketingTipsTemplatesRaw.length) return;

    setBusinessMarketingTipsLoading(true);
    try {
      if (businessMarketingTipsTemplatesRaw.length > businessMarketingTipsTemplates.length) {
        const nextBatch = businessMarketingTipsTemplatesRaw.slice(
          businessMarketingTipsTemplates.length,
          businessMarketingTipsTemplates.length + 3
        );
        React.startTransition(() => {
          setBusinessMarketingTipsTemplates(prev => [...prev, ...nextBatch]);
        });
      } else {
        const results = await greetingTemplatesService.searchTemplates('business marketing tips');
        const newItems = results.slice(businessMarketingTipsTemplates.length, businessMarketingTipsTemplates.length + 3);
        React.startTransition(() => {
          setBusinessMarketingTipsTemplates(prev => [...prev, ...newItems]);
          setBusinessMarketingTipsTemplatesRaw(results);
        });
      }
    } catch (error) {
      if (__DEV__) {
        devError('Error loading more business marketing tips:', error);
      }
    } finally {
      setBusinessMarketingTipsLoading(false);
    }
  }, [businessMarketingTipsTemplates, businessMarketingTipsTemplatesRaw, businessMarketingTipsLoading]);

  const loadMoreBusinessQuotes = useCallback(async () => {
    if (businessQuotesLoading || businessQuotesTemplates.length >= businessQuotesTemplatesRaw.length) return;

    setBusinessQuotesLoading(true);
    try {
      if (businessQuotesTemplatesRaw.length > businessQuotesTemplates.length) {
        const nextBatch = businessQuotesTemplatesRaw.slice(
          businessQuotesTemplates.length,
          businessQuotesTemplates.length + 3
        );
        React.startTransition(() => {
          setBusinessQuotesTemplates(prev => [...prev, ...nextBatch]);
        });
      } else {
        const results = await greetingTemplatesService.searchTemplates('business quotes');
        const newItems = results.slice(businessQuotesTemplates.length, businessQuotesTemplates.length + 3);
        React.startTransition(() => {
          setBusinessQuotesTemplates(prev => [...prev, ...newItems]);
          setBusinessQuotesTemplatesRaw(results);
        });
      }
    } catch (error) {
      if (__DEV__) {
        devError('Error loading more business quotes:', error);
      }
    } finally {
      setBusinessQuotesLoading(false);
    }
  }, [businessQuotesTemplates, businessQuotesTemplatesRaw, businessQuotesLoading]);

  // Memoized keyExtractor functions for modals
  const keyExtractorId = useCallback((item: any) => item.id.toString(), []);
  const keyExtractorIdString = useCallback((item: any) => item.id, []);
  const keyExtractorCategory = useCallback((item: any) => `category-${item.id}`, []);

  // Memoized modal item components to avoid recreating on every render
  interface ModalTemplateItemProps {
    template: Template;
    modalCardWidth: number;
    modalCardGap: number;
    modalColumns: number;
    index: number;
    onPress: () => void;
  }

  const ModalTemplateItem: React.FC<ModalTemplateItemProps> = React.memo(({
    template,
    modalCardWidth,
    modalCardGap,
    modalColumns,
    index,
    onPress
  }) => {
    const isLastInRow = (index + 1) % modalColumns === 0;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.upcomingEventModalCard,
          { width: modalCardWidth },
          !isLastInRow && { marginRight: modalCardGap }
        ]}
        onPress={onPress}
      >
        <View style={styles.upcomingEventModalImageContainer}>
          <OptimizedImage
            uri={template.thumbnail}
            style={styles.upcomingEventModalImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.upcomingEventModalOverlay}
          />
        </View>
      </TouchableOpacity>
    );
  }, (prev, next) => {
    return (
      prev.template.id === next.template.id &&
      prev.template.thumbnail === next.template.thumbnail &&
      prev.modalCardWidth === next.modalCardWidth &&
      prev.modalCardGap === next.modalCardGap &&
      prev.modalColumns === next.modalColumns &&
      prev.index === next.index
    );
  });
  ModalTemplateItem.displayName = 'ModalTemplateItem';

  interface ModalVideoItemProps {
    video: VideoContent;
    modalCardWidth: number;
    modalCardGap: number;
    modalColumns: number;
    index: number;
    onPress: () => void;
  }

  const ModalVideoItem: React.FC<ModalVideoItemProps> = React.memo(({
    video,
    modalCardWidth,
    modalCardGap,
    modalColumns,
    index,
    onPress
  }) => {
    const isLastInRow = (index + 1) % modalColumns === 0;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.upcomingEventModalCard,
          { width: modalCardWidth },
          !isLastInRow && { marginRight: modalCardGap }
        ]}
        onPress={onPress}
      >
        <View style={styles.upcomingEventModalImageContainer}>
          <OptimizedImage
            uri={video.thumbnail}
            style={styles.upcomingEventModalImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.upcomingEventModalOverlay}
          />
        </View>
      </TouchableOpacity>
    );
  }, (prev, next) => {
    return (
      prev.video.id === next.video.id &&
      prev.video.thumbnail === next.video.thumbnail &&
      prev.modalCardWidth === next.modalCardWidth &&
      prev.modalCardGap === next.modalCardGap &&
      prev.modalColumns === next.modalColumns &&
      prev.index === next.index
    );
  });
  ModalVideoItem.displayName = 'ModalVideoItem';

  interface ModalFeaturedItemProps {
    featured: FeaturedContent;
    modalCardWidth: number;
    modalCardGap: number;
    modalColumns: number;
    index: number;
    onPress: () => void;
  }

  const ModalFeaturedItem: React.FC<ModalFeaturedItemProps> = React.memo(({
    featured,
    modalCardWidth,
    modalCardGap,
    modalColumns,
    index,
    onPress
  }) => {
    const isLastInRow = (index + 1) % modalColumns === 0;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.upcomingEventModalCard,
          { width: modalCardWidth },
          !isLastInRow && { marginRight: modalCardGap }
        ]}
        onPress={onPress}
      >
        <View style={styles.upcomingEventModalImageContainer}>
          <OptimizedImage
            uri={featured.thumbnailUrl || featured.imageUrl}
            style={styles.upcomingEventModalImage}
            resizeMode="cover"
            mode="thumbnail"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.upcomingEventModalOverlay}
          />
        </View>
      </TouchableOpacity>
    );
  }, (prev, next) => {
    return (
      prev.featured.id === next.featured.id &&
      (prev.featured.thumbnailUrl || prev.featured.imageUrl) === (next.featured.thumbnailUrl || next.featured.imageUrl) &&
      prev.modalCardWidth === next.modalCardWidth &&
      prev.modalCardGap === next.modalCardGap &&
      prev.modalColumns === next.modalColumns &&
      prev.index === next.index
    );
  });
  ModalFeaturedItem.displayName = 'ModalFeaturedItem';

  interface ModalBusinessCategoryItemProps {
    category: BusinessCategory;
    previewTemplates: Template[];
    modalCardWidth: number;
    modalCardGap: number;
    modalColumns: number;
    index: number;
    isLastInRow?: boolean;
    onPress: () => void;
  }

  const ModalBusinessCategoryItem: React.FC<ModalBusinessCategoryItemProps> = React.memo(({
    category,
    previewTemplates,
    modalCardWidth,
    modalCardGap,
    modalColumns,
    index,
    isLastInRow: isLastInRowProp,
    onPress
  }) => {
    const displayImage = useMemo(() => {
      const thumbnails = previewTemplates
        .map(template => template.thumbnail)
        .filter((uri): uri is string => typeof uri === 'string' && uri.length > 0);
      return thumbnails[0] || category.imageUrl || (category as any).image || null;
    }, [previewTemplates, category]);

    const isLastInRow = isLastInRowProp !== undefined ? isLastInRowProp : (index + 1) % modalColumns === 0;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.upcomingEventModalCard,
          { width: modalCardWidth, backgroundColor: theme.colors.cardBackground },
          !isLastInRow && { marginRight: modalCardGap }
        ]}
        onPress={onPress}
      >
        <View style={styles.upcomingEventModalImageContainer}>
          {displayImage ? (
            <OptimizedImage
              uri={displayImage}
              style={styles.upcomingEventModalImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.upcomingEventModalImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' }]}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.upcomingEventModalOverlay}
          />
          <View style={styles.businessCategoryModalNameContainer}>
            <Text
              style={styles.businessCategoryModalName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {category.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, (prev, next) => {
    return (
      prev.category.id === next.category.id &&
      prev.modalCardWidth === next.modalCardWidth &&
      prev.modalCardGap === next.modalCardGap &&
      prev.modalColumns === next.modalColumns &&
      prev.index === next.index &&
      prev.previewTemplates === next.previewTemplates
    );
  });
  ModalBusinessCategoryItem.displayName = 'ModalBusinessCategoryItem';

  // Group business categories by parentCategoryName for sectioned display
  const groupedBusinessCategories = useMemo(() => {
    const groups: Record<string, BusinessCategory[]> = {};

    businessCategories.forEach(category => {
      const parentName = category.parentCategoryName || 'General';
      if (!groups[parentName]) {
        groups[parentName] = [];
      }
      groups[parentName].push(category);
    });

    // Convert to SectionList format with rows for proper grid layout
    const sections = Object.keys(groups)
      .sort() // Sort section names alphabetically
      .map(parentName => {
        const categories = groups[parentName];
        // Group categories into rows based on modalColumns
        const rows: BusinessCategory[][] = [];
        for (let i = 0; i < categories.length; i += modalColumns) {
          const row = categories.slice(i, i + modalColumns);
          rows.push(row);
        }
        return {
          title: parentName,
          data: rows, // Each row is an array of categories
        };
      });

    return sections;
  }, [businessCategories, modalColumns]);

  // Get icon for section type (parentCategoryName) - Business category specific icons
  const getSectionIcon = useCallback((title: string) => {
    const titleLower = title.toLowerCase();

    // Business category specific icons
    if (titleLower.includes('restaurant') || titleLower.includes('food') || titleLower.includes('dining')) return 'restaurant';
    if (titleLower.includes('wedding') || titleLower.includes('event') || titleLower.includes('celebration')) return 'celebration';
    if (titleLower.includes('electronics') || titleLower.includes('tech') || titleLower.includes('gadget')) return 'devices';
    if (titleLower.includes('fashion') || titleLower.includes('clothing') || titleLower.includes('apparel')) return 'checkroom';
    if (titleLower.includes('health') || titleLower.includes('fitness') || titleLower.includes('wellness')) return 'fitness-center';
    if (titleLower.includes('beauty') || titleLower.includes('salon') || titleLower.includes('spa')) return 'spa';
    if (titleLower.includes('education') || titleLower.includes('school') || titleLower.includes('learning')) return 'school';
    if (titleLower.includes('real estate') || titleLower.includes('property') || titleLower.includes('housing')) return 'home';
    if (titleLower.includes('automotive') || titleLower.includes('car') || titleLower.includes('vehicle')) return 'directions-car';
    if (titleLower.includes('travel') || titleLower.includes('tourism') || titleLower.includes('hotel')) return 'flight';
    if (titleLower.includes('finance') || titleLower.includes('bank') || titleLower.includes('money')) return 'account-balance';
    if (titleLower.includes('retail') || titleLower.includes('shop') || titleLower.includes('store')) return 'store';
    if (titleLower.includes('medical') || titleLower.includes('hospital') || titleLower.includes('clinic')) return 'local-hospital';
    if (titleLower.includes('legal') || titleLower.includes('law') || titleLower.includes('attorney')) return 'gavel';
    if (titleLower.includes('construction') || titleLower.includes('building') || titleLower.includes('contractor')) return 'construction';
    if (titleLower.includes('agriculture') || titleLower.includes('farming') || titleLower.includes('farm')) return 'agriculture';
    if (titleLower.includes('entertainment') || titleLower.includes('media') || titleLower.includes('music')) return 'movie';
    if (titleLower.includes('sports') || titleLower.includes('gym') || titleLower.includes('athletic')) return 'sports';
    if (titleLower.includes('pharmacy') || titleLower.includes('drug') || titleLower.includes('medicine')) return 'local-pharmacy';
    if (titleLower.includes('pet') || titleLower.includes('animal') || titleLower.includes('veterinary')) return 'pets';

    // Default business icons
    return 'business-center';
  }, []);

  // Render section header for grouped business categories
  const renderBusinessCategorySectionHeader = useCallback((info: { section: { title: string; data: BusinessCategory[][] } }) => {
    const iconName = getSectionIcon(info.section.title);

    return (
      <View
        style={[
          styles.businessCategorySectionHeaderContainer,
          {
            paddingHorizontal: moderateScale(isTabletDevice ? 16 : 12),
            paddingTop: moderateScale(isTabletDevice ? 16 : 12),
            paddingBottom: moderateScale(isTabletDevice ? 12 : 8),
            marginBottom: moderateScale(isTabletDevice ? 12 : 8),
          }
        ]}
      >
        <View style={styles.businessCategorySectionHeaderWrapper}>
          <LinearGradient
            colors={isDarkMode
              ? [theme.colors.primary + '30', theme.colors.secondary + '20', 'transparent']
              : [theme.colors.primary + '18', theme.colors.secondary + '10', 'transparent']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.businessCategorySectionHeaderGradient}
          >
            <View style={styles.businessCategorySectionHeaderContent}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.businessCategorySectionIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon
                  name={iconName}
                  size={moderateScale(isTabletDevice ? 22 : 20)}
                  color="#ffffff"
                />
              </LinearGradient>
              <View style={styles.businessCategorySectionTitleContainer}>
                <Text style={[
                  styles.businessCategorySectionHeaderText,
                  {
                    color: theme.colors.text,
                    fontSize: responsiveFontSize.lg,
                    fontWeight: '700',
                    marginLeft: moderateScale(10),
                  }
                ]}>
                  {info.section.title}
                </Text>
                <View style={[
                  styles.businessCategorySectionUnderline,
                  {
                    backgroundColor: theme.colors.primary,
                    marginLeft: moderateScale(10),
                    marginTop: moderateScale(2),
                  }
                ]} />
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }, [theme, isDarkMode, isTabletDevice, responsiveFontSize, getSectionIcon]);

  // Memoized renderItem functions for modal FlatLists
  const handleBusinessCategoryPress = useCallback(async (category: BusinessCategory) => {
    console.log('=🏢 [BUSINESS CATEGORY PRESS]', {
      categoryName: category.name,
      settingTemplateSource: true
    });

    // Update global business category state
    await setSelectedBusinessCategory(category.name);

    const cachedTemplates = businessCategoryPreviews[category.id];

    // Navigate immediately if we have cached templates
    if (cachedTemplates && cachedTemplates.length > 0) {
      navigation.navigate('PosterPlayer', {
        selectedPoster: cachedTemplates[0],
        relatedPosters: cachedTemplates.slice(1),
        searchQuery: '',
        templateSource: 'professional', // Show subscription message for direct business category access
        posterLimit: 6, // Limit 6 for business categories from HomeScreen
      });
      return;
    }

    // Navigate immediately with loading state, then load data in background
    // Use loading placeholder since we'll fetch actual data in background
    const firstPoster = null;

    navigation.navigate('PosterPlayer', {
      selectedPoster: firstPoster || {
        id: 'loading',
        name: category.name,
        thumbnail: '',
        category: category.name,
        downloads: 0,
        isDownloaded: false,
      },
      relatedPosters: firstPoster ? [firstPoster] : [],
      searchQuery: '',
      templateSource: 'professional', // Show subscription message for direct business category access
      posterLimit: 200, // Request all posters for business categories from HomeScreen
    });

    // Load data in background after navigation
    InteractionManager.runAfterInteractions(async () => {
      try {
        const response = await businessCategoryPostersApi.getPostersByCategory(category.name, 200);

        if (response?.success && Array.isArray(response.data?.posters) && response.data.posters.length > 0) {
          const templates = response.data.posters
            .map(poster => convertBusinessPosterToTemplate(poster, category.name))
            .filter(template => template.thumbnail);

          // Update preview cache for future use
          setBusinessCategoryPreviews(prev => ({
            ...prev,
            [category.id]: templates,
          }));
        }
      } catch (error) {
        if (__DEV__) {
          devError('Error loading business category posters:', error);
        }
      }
    });
  }, [businessCategoryPreviews, navigation, setSelectedBusinessCategory]);

  const renderBusinessCategoryModalItem = useCallback(({ item, index, section }: { item: BusinessCategory[]; index: number; section: { title: string; data: BusinessCategory[][] } }) => {
    // item is now a row (array of categories)
    // Each row should only contain up to modalColumns items
    return (
      <View style={[styles.upcomingEventModalRow, {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        width: '100%',
      }]}>
        {item.map((category, categoryIndex) => {
          const previewTemplates = businessCategoryPreviews[category.id] || [];
          const handlePress = () => {
            closeBusinessCategoriesModal();
            handleBusinessCategoryPress(category);
          };
          const isLastInRow = categoryIndex === item.length - 1;
          return (
            <ModalBusinessCategoryItem
              key={category.id}
              category={category}
              previewTemplates={previewTemplates}
              modalCardWidth={modalCardWidth}
              modalCardGap={modalCardGap}
              modalColumns={modalColumns}
              index={categoryIndex}
              isLastInRow={isLastInRow}
              onPress={handlePress}
            />
          );
        })}
      </View>
    );
  }, [modalCardWidth, modalCardGap, modalColumns, businessCategoryPreviews, closeBusinessCategoriesModal, handleBusinessCategoryPress]);

  const renderVideoModalItem = useCallback(({ item, index }: { item: VideoContent; index: number }) => {
    const handlePress = () => {
      closeVideosModal();
      const videoData: Template = {
        id: item.id,
        name: item.title,
        thumbnail: item.thumbnail,
        category: item.category,
        downloads: 0,
        isDownloaded: false,
      };
      navigation.navigate('VideoPlayer', {
        selectedVideo: videoData,
        relatedVideos: videoContent.slice(0, 6),
      });
    };
    return (
      <ModalVideoItem
        video={item}
        modalCardWidth={modalCardWidth}
        modalCardGap={modalCardGap}
        modalColumns={modalColumns}
        index={index}
        onPress={handlePress}
      />
    );
  }, [modalCardWidth, modalCardGap, modalColumns, closeVideosModal, navigation, videoContent]);


  const renderBusinessEthicsModalItem = useCallback(({ item, index }: { item: Template; index: number }) => {
    const templates = businessEthicsTemplatesRaw.length > 0 ? businessEthicsTemplatesRaw : businessEthicsTemplates;
    const handlePress = () => {
      closeBusinessEthicsModal();
      navigation.navigate('PosterPlayer', {
        selectedPoster: item,
        relatedPosters: templates.filter(t => t.id !== item.id),
      });
    };
    return (
      <ModalTemplateItem
        template={item}
        modalCardWidth={modalCardWidth}
        modalCardGap={modalCardGap}
        modalColumns={modalColumns}
        index={index}
        onPress={handlePress}
      />
    );
  }, [modalCardWidth, modalCardGap, modalColumns, businessEthicsTemplatesRaw, businessEthicsTemplates, closeBusinessEthicsModal, navigation]);

  const renderSuccessMindsetModalItem = useCallback(({ item, index }: { item: Template; index: number }) => {
    const templates = successMindsetTemplatesRaw.length > 0 ? successMindsetTemplatesRaw : successMindsetTemplates;
    const handlePress = () => {
      closeSuccessMindsetModal();
      navigation.navigate('PosterPlayer', {
        selectedPoster: item,
        relatedPosters: templates.filter(t => t.id !== item.id),
      });
    };
    return (
      <ModalTemplateItem
        template={item}
        modalCardWidth={modalCardWidth}
        modalCardGap={modalCardGap}
        modalColumns={modalColumns}
        index={index}
        onPress={handlePress}
      />
    );
  }, [modalCardWidth, modalCardGap, modalColumns, successMindsetTemplatesRaw, successMindsetTemplates, closeSuccessMindsetModal, navigation]);

  const renderSocialMediaGrowthModalItem = useCallback(({ item, index }: { item: Template; index: number }) => {
    const templates = socialMediaGrowthTemplatesRaw.length > 0 ? socialMediaGrowthTemplatesRaw : socialMediaGrowthTemplates;
    const handlePress = () => {
      closeSocialMediaGrowthModal();
      navigation.navigate('PosterPlayer', {
        selectedPoster: item,
        relatedPosters: templates.filter(t => t.id !== item.id),
      });
    };
    return (
      <ModalTemplateItem
        template={item}
        modalCardWidth={modalCardWidth}
        modalCardGap={modalCardGap}
        modalColumns={modalColumns}
        index={index}
        onPress={handlePress}
      />
    );
  }, [modalCardWidth, modalCardGap, modalColumns, socialMediaGrowthTemplatesRaw, socialMediaGrowthTemplates, closeSocialMediaGrowthModal, navigation]);

  const renderMoneyAndFinanceModalItem = useCallback(({ item, index }: { item: Template; index: number }) => {
    const templates = moneyAndFinanceTemplatesRaw.length > 0 ? moneyAndFinanceTemplatesRaw : moneyAndFinanceTemplates;
    const handlePress = () => {
      closeMoneyAndFinanceModal();
      navigation.navigate('PosterPlayer', {
        selectedPoster: item,
        relatedPosters: templates.filter(t => t.id !== item.id),
      });
    };
    return (
      <ModalTemplateItem
        template={item}
        modalCardWidth={modalCardWidth}
        modalCardGap={modalCardGap}
        modalColumns={modalColumns}
        index={index}
        onPress={handlePress}
      />
    );
  }, [modalCardWidth, modalCardGap, modalColumns, moneyAndFinanceTemplatesRaw, moneyAndFinanceTemplates, closeMoneyAndFinanceModal, navigation]);

  const renderBusinessLegendQuoteModalItem = useCallback(({ item, index }: { item: Template; index: number }) => {
    const templates = businessLegendQuoteTemplatesRaw.length > 0 ? businessLegendQuoteTemplatesRaw : businessLegendQuoteTemplates;
    const handlePress = () => {
      closeBusinessLegendQuoteModal();
      navigation.navigate('PosterPlayer', {
        selectedPoster: item,
        relatedPosters: templates.filter(t => t.id !== item.id),
      });
    };
    return (
      <ModalTemplateItem
        template={item}
        modalCardWidth={modalCardWidth}
        modalCardGap={modalCardGap}
        modalColumns={modalColumns}
        index={index}
        onPress={handlePress}
      />
    );
  }, [modalCardWidth, modalCardGap, modalColumns, businessLegendQuoteTemplatesRaw, businessLegendQuoteTemplates, closeBusinessLegendQuoteModal, navigation]);

  const renderBusinessMarketingTipsModalItem = useCallback(({ item, index }: { item: Template; index: number }) => {
    const templates = businessMarketingTipsTemplatesRaw.length > 0 ? businessMarketingTipsTemplatesRaw : businessMarketingTipsTemplates;
    const handlePress = () => {
      closeBusinessMarketingTipsModal();
      navigation.navigate('PosterPlayer', {
        selectedPoster: item,
        relatedPosters: templates.filter(t => t.id !== item.id),
      });
    };
    return (
      <ModalTemplateItem
        template={item}
        modalCardWidth={modalCardWidth}
        modalCardGap={modalCardGap}
        modalColumns={modalColumns}
        index={index}
        onPress={handlePress}
      />
    );
  }, [modalCardWidth, modalCardGap, modalColumns, businessMarketingTipsTemplatesRaw, businessMarketingTipsTemplates, closeBusinessMarketingTipsModal, navigation]);

  const renderBusinessQuotesModalItem = useCallback(({ item, index }: { item: Template; index: number }) => {
    const templates = businessQuotesTemplatesRaw.length > 0 ? businessQuotesTemplatesRaw : businessQuotesTemplates;
    const handlePress = () => {
      closeBusinessQuotesModal();
      navigation.navigate('PosterPlayer', {
        selectedPoster: item,
        relatedPosters: templates.filter(t => t.id !== item.id),
      });
    };
    return (
      <ModalTemplateItem
        template={item}
        modalCardWidth={modalCardWidth}
        modalCardGap={modalCardGap}
        modalColumns={modalColumns}
        index={index}
        onPress={handlePress}
      />
    );
  }, [modalCardWidth, modalCardGap, modalColumns, businessQuotesTemplatesRaw, businessQuotesTemplates, closeBusinessQuotesModal, navigation]);


  const renderFeaturedContentModalItem = useCallback(({ item, index }: { item: FeaturedContent; index: number }) => {
    const convertFeaturedContentToTemplate = (fc: FeaturedContent): Template => ({
      id: fc.id,
      name: fc.title,
      thumbnail: fc.thumbnailUrl || fc.imageUrl, // Use thumbnailUrl if available for faster loading
      category: fc.type || 'Featured Content',
      downloads: 0,
      isDownloaded: false,
      tags: [],
    });
    const selectedTemplate = convertFeaturedContentToTemplate(item);
    const relatedTemplates = featuredContent
      .filter(fc => fc.id !== item.id)
      .map(convertFeaturedContentToTemplate);
    const handlePress = () => {
      closeFeaturedContentModal();
      navigation.navigate('PosterPlayer', {
        selectedPoster: selectedTemplate,
        relatedPosters: relatedTemplates,
      });
    };
    return (
      <ModalFeaturedItem
        featured={item}
        modalCardWidth={modalCardWidth}
        modalCardGap={modalCardGap}
        modalColumns={modalColumns}
        index={index}
        onPress={handlePress}
      />
    );
  }, [modalCardWidth, modalCardGap, modalColumns, featuredContent, closeFeaturedContentModal, navigation]);

  // Memoized getItemLayout for modal FlatLists
  const getModalItemLayout = useCallback((data: any, index: number) => {
    const rowHeight = modalCardWidth * (screenWidth >= 768 ? 1 : 0.9) + moderateScale(6); // card height + margin
    const rowIndex = Math.floor(index / modalColumns);
    return {
      length: rowHeight,
      offset: rowHeight * rowIndex,
      index,
    };
  }, [modalCardWidth, modalColumns, screenWidth]);

  const featuredCarouselRef = useRef<FlatList<FeaturedContent>>(null);
  const [featuredCarouselIndex, setFeaturedCarouselIndex] = useState(0);
  const featuredCarouselIndexRef = useRef(0); // Ref for immediate updates
  const scrollX = useRef(new Animated.Value(0)).current; // Animated value for scroll position
  const scrollViewRef = useRef<ScrollView>(null);
  const businessCategoriesSectionRef = useRef<View>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUserScrollingRef = useRef(false);

  useEffect(() => {
    if (!featuredContent.length) return;

    // Clear any existing interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }

    // Only start auto-scroll if user is not manually scrolling
    const startAutoScroll = () => {
      if (isUserScrollingRef.current) return;

      autoScrollIntervalRef.current = setInterval(() => {
        if (isUserScrollingRef.current) return;

        setFeaturedCarouselIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % featuredContent.length;
          featuredCarouselIndexRef.current = nextIndex;
          featuredCarouselRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
            viewPosition: 0.5,
          });
          return nextIndex;
        });
      }, 4000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [featuredContent]);

  // Pre-compute related featured templates to avoid filtering on every press
  const relatedFeaturedTemplatesMap = useMemo(() => {
    const map = new Map<string, Template[]>();
    featuredContent.forEach(item => {
      const related = featuredContent
        .filter(fc => fc.id !== item.id)
        .map(fc => ({
          id: fc.id,
          name: fc.title,
          thumbnail: fc.imageUrl,
          category: fc.type || 'Featured Content',
          downloads: 0,
          isDownloaded: false,
          tags: [],
        }));
      map.set(item.id, related);
    });
    return map;
  }, [featuredContent]);

  const handleFeaturedCarouselPress = useCallback((item: FeaturedContent) => {
    // Navigate immediately with pre-computed data
    const selectedTemplate: Template = {
      id: item.id,
      name: item.title,
      thumbnail: item.imageUrl,
      category: item.type || 'Featured Content',
      downloads: 0,
      isDownloaded: false,
      tags: [],
    };

    const relatedTemplates = relatedFeaturedTemplatesMap.get(item.id) || [];

    navigation.navigate('PosterPlayer', {
      selectedPoster: selectedTemplate,
      relatedPosters: relatedTemplates,
    });
  }, [relatedFeaturedTemplatesMap, navigation]);

  const handleFeaturedCarouselScrollFailure = useCallback((info: { index: number }) => {
    requestAnimationFrame(() => {
      // Offset accounts for SIDE_PADDING and spacing between items
      const offset = SIDE_PADDING + (info.index * (CARD_WIDTH + CARD_SPACING));
      featuredCarouselRef.current?.scrollToOffset({
        offset,
        animated: true,
      });
    });
  }, [CARD_WIDTH, CARD_SPACING, SIDE_PADDING]);

  const handleFeaturedCarouselScroll = useCallback((event: any) => {
    // Completely disable onScroll updates - onViewableItemsChanged is the single source of truth
    // This prevents conflicts and jumping dots
    // Only keep this handler for the Animated.Value if needed, but don't update state
  }, []);

  // Use onViewableItemsChanged as the SINGLE source of truth for dot updates
  // This prevents conflicts and jumping dots
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      // Sort by index and get the most forward (highest index) visible item
      const sortedItems = viewableItems
        .map((item: any) => ({ index: item.index, isViewable: item.isViewable }))
        .filter((item: any) => item.index !== undefined && item.index !== null)
        .sort((a: any, b: any) => b.index - a.index); // Sort descending (highest first)

      if (sortedItems.length > 0) {
        // Always use the highest index (most forward item)
        const visibleIndex = sortedItems[0].index;

        // Update immediately if index changed - no backward jump prevention needed
        // since we're always picking the most forward item
        if (visibleIndex !== featuredCarouselIndexRef.current) {
          featuredCarouselIndexRef.current = visibleIndex;
          // Update immediately - this is the ONLY update mechanism
          setFeaturedCarouselIndex(visibleIndex);
        }
      }
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // 50% visible - more stable, prevents flickering
    minimumViewTime: 0, // No minimum view time for immediate updates
    waitForInteraction: false, // Don't wait for interaction to complete
  }).current;

  const handleFeaturedCarouselMomentumScrollEnd = useCallback((event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    // Calculate index accounting for SIDE_PADDING and spacing between items
    const adjustedOffset = scrollOffset - SIDE_PADDING;
    const calculatedIndex = adjustedOffset / (CARD_WIDTH + CARD_SPACING);
    const currentIndex = Math.round(calculatedIndex);

    // Update to final position - this should match what onScroll already set
    if (currentIndex >= 0 && currentIndex < featuredContent.length) {
      featuredCarouselIndexRef.current = currentIndex;
      setFeaturedCarouselIndex(currentIndex);
    }

    // Mark that user scrolling has ended
    isUserScrollingRef.current = false;

    // Restart auto-scroll after a delay
    setTimeout(() => {
      if (!isUserScrollingRef.current && featuredContent.length > 0 && !autoScrollIntervalRef.current) {
        autoScrollIntervalRef.current = setInterval(() => {
          if (isUserScrollingRef.current) return;

          setFeaturedCarouselIndex(prevIndex => {
            const nextIndex = (prevIndex + 1) % featuredContent.length;
            featuredCarouselIndexRef.current = nextIndex;
            featuredCarouselRef.current?.scrollToIndex({
              index: nextIndex,
              animated: true,
              viewPosition: 0.5,
            });
            return nextIndex;
          });
        }, 4000);
      }
    }, 3000);
  }, [CARD_WIDTH, CARD_SPACING, SIDE_PADDING, featuredContent.length]);

  const handleFeaturedCarouselScrollBeginDrag = useCallback(() => {
    // Pause auto-scroll when user starts dragging
    isUserScrollingRef.current = true;
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  const handleFeaturedCarouselScrollEndDrag = useCallback(() => {
    // Keep isUserScrollingRef true until momentum scroll ends
    // Don't restart auto-scroll here - let onMomentumScrollEnd handle it
  }, []);

  const getFeaturedCarouselItemLayout = useCallback((_: any, index: number) => {
    // Each item is CARD_WIDTH, with CARD_SPACING between items (except after last item)
    // Offset accounts for SIDE_PADDING and spacing between items
    return {
      length: CARD_WIDTH,
      offset: SIDE_PADDING + (index * (CARD_WIDTH + CARD_SPACING)),
      index,
    };
  }, [CARD_WIDTH, CARD_SPACING, SIDE_PADDING]);

  // Item separator component for spacing between cards
  const renderItemSeparator = useCallback(() => (
    <View style={{ width: CARD_SPACING }} />
  ), [CARD_SPACING]);

  const renderFeaturedCarouselItem = useCallback(({ item }: { item: FeaturedContent }) => (
    <View
      key={item.id}
      style={{ width: CARD_WIDTH }}
    >
      <View
        style={[styles.featuredCarouselCard, { width: '100%', height: featuredCarouselItemHeight }]}
      >
        <OptimizedImage
          uri={item.imageUrl}
          style={[styles.featuredCarouselImage, { width: '100%', height: '100%' }]}
          resizeMode="cover"
          mode="full"
        />
      </View>
    </View>
  ), [CARD_WIDTH, featuredCarouselItemHeight]);

  // Handler for greeting category press - navigate to PosterPlayerScreen with selected greeting category
  const handleGreetingCategoryPress = useCallback((category: { id: string; name: string; icon: string; color?: string }, categoryImage: string | null) => {
    // Use categoryImage as thumbnail if available, otherwise use empty string
    // PosterPlayerScreen will fetch templates and display the first one, but we want to show the category image initially
    const thumbnail = categoryImage || '';

    navigation.navigate('PosterPlayer', {
      selectedPoster: {
        id: 'loading',
        name: category.name,
        thumbnail: thumbnail, // Pass the category image as thumbnail
        category: category.name,
        downloads: 0,
        isDownloaded: false,
      },
      relatedPosters: [],
      searchQuery: '',
      templateSource: 'greeting',
      greetingCategory: category.name, // Pass the selected greeting category
    });
  }, [navigation]);

  // Render function for search category items
  const renderSearchCategoryItem = useCallback(({ item }: { item: { id: string; name: string; icon: string; color?: string; imageUrl?: string } }) => {
    const categoryImage = memoizedGreetingCategoryImages[item.id] || (item as any).imageUrl || null;
    return (
      <GreetingCategoryCard
        item={item}
        cardWidth={cardWidth}
        theme={theme}
        categoryImage={categoryImage}
        onPress={(category) => handleGreetingCategoryPress(category, categoryImage)}
      />
    );
  }, [cardWidth, theme, memoizedGreetingCategoryImages, handleGreetingCategoryPress]);

  // Memoized category button labels - computed only when dependencies change
  const businessCategoryButtonLabel = useMemo(() => {
    const fallback = 'Business';
    if (rotatingBusinessCategories.length === 0) {
      return fallback;
    }
    const currentCategory = rotatingBusinessCategories[currentBusinessCategoryIndex];
    return currentCategory?.name || fallback;
  }, [rotatingBusinessCategories, currentBusinessCategoryIndex]);

  const greetingCategoryButtonLabel = useMemo(() => {
    const fallback = 'General';
    if (greetingCategories.length === 0) {
      return fallback;
    }
    const currentCategory = greetingCategories[currentCategoryIndex];
    return currentCategory?.name || fallback;
  }, [greetingCategories, currentCategoryIndex]);

  // Render functions moved to extracted components for better performance

  const renderBusinessProfileDropdown = () => {
    if (!isBusinessProfileDropdownVisible || !businessProfileDropdownPosition) {
      return null;
    }

    const desiredWidth = Math.max(moderateScale(220), businessProfileDropdownPosition.width * 0.7);
    const dropdownWidth = Math.min(desiredWidth, screenWidth - moderateScale(32));
    const dropdownLeft = Math.min(
      Math.max(businessProfileDropdownPosition.left, moderateScale(16)),
      screenWidth - dropdownWidth - moderateScale(16),
    );

    return (
      <View pointerEvents="box-none" style={styles.businessProfileDropdownOverlay}>
        <TouchableOpacity
          style={styles.businessProfileDropdownBackdrop}
          activeOpacity={1}
          onPress={closeBusinessProfileDropdown}
        />
        <View
          style={[
            styles.businessProfileDropdownContent,
            {
              top: businessProfileDropdownPosition.top,
              left: dropdownLeft,
              width: dropdownWidth,
            },
          ]}
        >
          {businessProfilesLoadingState ? (
            <View style={styles.businessProfileDropdownLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.businessProfileDropdownLoadingText, { color: theme.colors.textSecondary }]}>
                Loading profiles...
              </Text>
            </View>
          ) : userBusinessProfiles.length === 0 ? (
            <View style={styles.businessProfileDropdownEmpty}>
              <Text style={[styles.businessProfileDropdownEmptyText, { color: theme.colors.textSecondary }]}>
                No business profiles yet.
              </Text>
              <TouchableOpacity
                style={styles.businessProfileDropdownManageButton}
                onPress={() => {
                  closeBusinessProfileDropdown();
                  navigation.navigate('BusinessProfiles');
                }}
              >
                <Text style={styles.businessProfileDropdownManageButtonText}>Create Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.businessProfileDropdownHeader}>
                <Text style={[styles.businessProfileDropdownTitle, { color: theme.colors.text }]}>
                  Select Business Profile
                </Text>
                <TouchableOpacity onPress={closeBusinessProfileDropdown}>
                  <Icon name="close" size={moderateScale(16)} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.businessProfileDropdownList}>
                {userBusinessProfiles.map(profile => {
                  const isActive = profile.id === selectedBusinessProfileId;
                  const profileLogo = profile.logo || profile.companyLogo || profile.profileLogo || profile.businessLogo || profile.image || profile.photo || profile.banner;
                  const initials = profile.name ? profile.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() : 'MB';
                  return (
                    <TouchableOpacity
                      key={profile.id}
                      style={[
                        styles.businessProfileDropdownItem,
                        isActive && styles.businessProfileDropdownItemActive,
                      ]}
                      onPress={() => handleBusinessProfileSelect(profile.id)}
                    >
                      <View style={styles.businessProfileDropdownItemContent}>
                        <View style={styles.businessProfileDropdownAvatar}>
                          {profileLogo ? (
                            <OptimizedImage
                              uri={profileLogo}
                              style={styles.businessProfileDropdownAvatarImage}
                              resizeMode="cover"
                              cacheKey={`business_profile_${profile.id}`}
                            />
                          ) : (
                            <Text style={styles.businessProfileDropdownAvatarText}>{initials}</Text>
                          )}
                        </View>
                        <View style={styles.businessProfileDropdownTextContainer}>
                          <View style={styles.businessProfileDropdownItemHeader}>
                            <Text
                              style={[
                                styles.businessProfileDropdownItemName,
                                { color: theme.colors.text },
                              ]}
                              numberOfLines={1}
                            >
                              {profile.name}
                            </Text>
                            {isActive && (
                              <Icon name="check" size={moderateScale(16)} color={theme.colors.primary} />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.businessProfileDropdownItemCategory,
                              { color: theme.colors.textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            {profile.subcategory || profile.subCategory || profile.category || 'General'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={styles.businessProfileDropdownManageButton}
                onPress={() => {
                  closeBusinessProfileDropdown();
                  navigation.navigate('BusinessProfiles');
                }}
              >
                <Text style={styles.businessProfileDropdownManageButtonText}>Manage Profiles</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.gradient[0] || '#e8e8e8' }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* User Profile Info */}
            <View
              style={styles.userProfileSection}
            >
              <TouchableOpacity
                style={styles.userAvatarContainer}
                onPress={toggleBusinessProfileDropdown}
                ref={userProfileSectionRef}
                activeOpacity={0.7}
              >
                <View style={[styles.userAvatar, { backgroundColor: theme.colors.primary }]}>
                  {userAvatarUri ? (
                    <OptimizedImage
                      uri={userAvatarUri}
                      style={styles.userAvatarImage}
                      resizeMode="cover"
                      cacheKey={`user_avatar_${selectedBusinessProfile?.id || 'personal'}_${userAvatarUri?.slice(-20) || 'default'}`}
                      key={`avatar_${selectedBusinessProfile?.id || 'personal'}_${userAvatarUri?.slice(-20) || 'default'}`}
                    />
                  ) : (
                    <Text style={styles.userAvatarText}>{userInitials}</Text>
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.userInfoContainer}>
                <Text style={[styles.userName, { color: theme.colors.text }]} numberOfLines={1}>
                  {userName}
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                  Post, Promote, Grow
                </Text>
                {apiError && (
                  <View style={styles.apiStatusIndicator}>
                    <Icon name="wifi-off" size={statusIconSize} color="#ff9800" />
                    <Text style={styles.apiStatusText}>Offline Mode</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Header Actions */}
            <View style={styles.headerActions}>
              {apiLoading && (
                <View style={styles.apiLoadingIndicator}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={styles.apiLoadingText}>Loading...</Text>
                </View>
              )}

              {/* Search Button */}
              <TouchableOpacity
                style={[styles.headerActionButton, { backgroundColor: theme.colors.cardBackground }]}
                onPress={toggleSearchBar}
                activeOpacity={0.7}
              >
                <Icon
                  name={isSearchBarVisible ? "close" : "search"}
                  size={moderateScale(20)}
                  color={theme.colors.text}
                />
              </TouchableOpacity>

              {/* Customer Support Button */}
              <TouchableOpacity
                style={[styles.headerActionButton, { backgroundColor: theme.colors.cardBackground }]}
                onPress={openCustomerSupportModal}
                activeOpacity={0.7}
              >
                <Icon name="support-agent" size={moderateScale(20)} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {renderBusinessProfileDropdown()}

        {/* Search Bar */}
        {isSearchBarVisible && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: theme.colors.cardBackground }]}>
              <Icon name="search" size={searchIconSize} color={theme.colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Search"
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
                returnKeyType="search"
                blurOnSubmit={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                    setSearchResults([]);
                  }}
                  style={styles.clearIcon}
                >
                  <Icon name="close" size={searchIconSize} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          removeClippedSubviews={true}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
          bounces={true}
        >
          {/* Category Buttons */}
          {!isSearching && searchQuery.trim() === '' && (
            <View style={styles.categoryButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  styles.categoryButtonBusiness,
                  selectedCategory === 'business' && styles.categoryButtonActive,
                ]}
                onPress={handleBusinessButtonPress}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={selectedCategory === 'business'
                    ? ['#667eea', '#764ba2']
                    : ['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.05)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryButtonGradient}
                >
                  <View style={styles.categoryButtonContent}>
                    <Icon
                      name="business"
                      size={moderateScale(14)}
                      color={selectedCategory === 'business' ? '#ffffff' : '#667eea'}
                      style={styles.categoryButtonIcon}
                    />
                    <Animated.Text style={[
                      styles.categoryButtonText,
                      styles.categoryButtonTextBusiness,
                      {
                        color: selectedCategory === 'business' ? '#ffffff' : '#667eea',
                        opacity: businessCategoryFadeAnim,
                      }
                    ]}>
                      {businessCategoryButtonLabel}
                    </Animated.Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  styles.categoryButtonRotating,
                  selectedCategory === 'general' && styles.categoryButtonActive,
                ]}
                onPress={() => navigation.navigate('GreetingTemplates')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryButtonGradient}
                >
                  <View style={styles.categoryButtonContent}>
                    <Icon
                      name="auto-awesome"
                      size={moderateScale(14)}
                      color="#ffffff"
                      style={styles.categoryButtonIcon}
                    />
                    <Animated.Text
                      style={[
                        styles.categoryButtonText,
                        styles.categoryButtonRotatingText,
                        {
                          color: '#ffffff',
                          opacity: categoryFadeAnim,
                          flexShrink: 1,
                          minWidth: 0,
                        }
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {greetingCategoryButtonLabel}
                    </Animated.Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {!isSearching && searchQuery.trim() === '' && featuredContent.length > 0 && (
            <View style={styles.featuredCarouselWrapper}>
              <View style={styles.featuredCarouselContainer}>
                <FlatList
                  ref={featuredCarouselRef}
                  data={featuredContent}
                  renderItem={renderFeaturedCarouselItem}
                  keyExtractor={keyExtractorIdString}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled={false}
                  snapToInterval={featuredCarouselSnapInterval}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  getItemLayout={getFeaturedCarouselItemLayout}
                  ItemSeparatorComponent={renderItemSeparator}
                  onScrollToIndexFailed={handleFeaturedCarouselScrollFailure}
                  onScrollBeginDrag={handleFeaturedCarouselScrollBeginDrag}
                  onScrollEndDrag={handleFeaturedCarouselScrollEndDrag}
                  onMomentumScrollEnd={handleFeaturedCarouselMomentumScrollEnd}
                  onViewableItemsChanged={handleViewableItemsChanged}
                  viewabilityConfig={viewabilityConfig}
                  contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
                />
                <View style={styles.featuredCarouselIndicators}>
                  {featuredContent.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.featuredCarouselDot,
                        index === featuredCarouselIndex && styles.featuredCarouselDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Festivals Calendar Section */}
          {!isSearching && searchQuery.trim() === '' && (
            <HorizontalFestivalCalendar key={calendarRefreshKey} />
          )}

          {/* Business Categories Section */}
          {!isSearching && searchQuery.trim() === '' && businessCategories.length > 0 && (
            <BusinessCategoriesSection
              businessCategories={businessCategories}
              businessCategoryPreviews={memoizedBusinessCategoryPreviews}
              isHighlighted={isBusinessCategoriesHighlighted}
              cardWidth={cardWidth}
              theme={theme}
              getItemLayout={getItemLayout}
              onCategoryPress={handleBusinessCategoryPress}
              onViewAllPress={handleViewAllBusinessCategories}
              renderBrowseAllButton={renderBrowseAllButton}
              sectionRef={businessCategoriesSectionRef}
              onLayout={handleBusinessCategoriesLayout}
            />
          )}

          {/* General Categories Section */}
          {/* Show section immediately with placeholders - images load progressively */}
          {!isSearching && searchQuery.trim() === '' && greetingCategoriesList.length > 0 && (
            <GeneralCategoriesSection
              greetingCategoriesList={filteredGreetingCategoriesList}
              greetingCategoryImages={memoizedGreetingCategoryImages}
              cardWidth={cardWidth}
              theme={theme}
              getItemLayout={getItemLayout}
              onCategoryPress={(category) => {
                const categoryImage = memoizedGreetingCategoryImages[category.id] || null;
                handleGreetingCategoryPress(category, categoryImage);
              }}
              onViewAllPress={handleViewAllGeneralCategories}
              renderBrowseAllButton={renderBrowseAllButton}
              onLoadMore={() => {
                // Load more categories when user scrolls near the end
                if (displayedCategoriesCount < allGreetingCategories.length) {
                  const nextCount = Math.min(displayedCategoriesCount + 5, allGreetingCategories.length);
                  setDisplayedCategoriesCount(nextCount);

                  // Load preview images for newly displayed categories (batched for non-initial)
                  const newCategories = allGreetingCategories.slice(displayedCategoriesCount, nextCount);
                  if (newCategories.length > 0) {
                    fetchGreetingCategoryPreviewImages(newCategories, false); // false = not initial load
                  }
                }
              }}
              hasMore={displayedCategoriesCount < allGreetingCategories.length}
            />
          )}

          {/* Festival Calendar - Commented out for now */}
          {/* <View style={styles.calendarSection}>
            <SimpleFestivalCalendar />
          </View> */}

          {/* Tabs - All tabs commented out */}
          {/* <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                { backgroundColor: activeTab === 'trending' ? theme.colors.cardBackground : 'rgba(255,255,255,0.2)' }
              ]}
              onPress={() => handleTabChange('trending')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'trending' ? theme.colors.primary : '#ffffff' }
              ]}>
                TRENDING
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                { backgroundColor: activeTab === 'festival' ? theme.colors.cardBackground : 'rgba(255,255,255,0.2)' }
              ]}
              onPress={() => handleTabChange('festival')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'festival' ? theme.colors.primary : '#ffffff' }
              ]}>
                FESTIVAL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                { backgroundColor: activeTab === 'video' ? theme.colors.cardBackground : 'rgba(255,255,255,0.2)' }
              ]}
              onPress={() => handleTabChange('video')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'video' ? theme.colors.primary : '#ffffff' }
              ]}>
                VIDEO
              </Text>
            </TouchableOpacity>
          </View> */}


          
          {/* Unified Search Results - Shown only when searching */}
          {renderSearchResults()}
          
          {/* Video Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && videoContent.length > 0 && (
            <View style={styles.videoSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Video Content
                </Text>
                {renderBrowseAllButton(handleViewAllVideos)}
              </View>
              <FlatList
                key={`video-content-${videoContent.length}`}
                data={videoContent}
                renderItem={renderVideoTemplate}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={2}
                initialNumToRender={3}
                updateCellsBatchingPeriod={150}
                getItemLayout={getItemLayout}
                contentContainerStyle={styles.horizontalList}
                // Performance: disable autoscroll to content size
                maintainVisibleContentPosition={null}
              />
            </View>
          )}


          {/* Business Ethics Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && businessEthicsTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Business Ethics
                </Text>
                {renderBrowseAllButton(handleViewAllBusinessEthics)}
              </View>
              <FlatList
                data={businessEthicsTemplates}
                renderItem={renderBusinessEthicsCard}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={2}
                initialNumToRender={3}
                updateCellsBatchingPeriod={150}
                getItemLayout={getItemLayout}
                onEndReached={loadMoreBusinessEthics}
                onEndReachedThreshold={0.5}
                ListFooterComponent={businessEthicsLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
              />
            </View>
          )}

          {/* Success Mindset Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && (successMindsetTemplates.length > 0 || greetingSectionsLoadedRef.current) && successMindsetTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Success Mindset
                </Text>
                {renderBrowseAllButton(handleViewAllSuccessMindset)}
              </View>
              <FlatList
                data={successMindsetTemplates}
                renderItem={renderSuccessMindsetCard}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={2}
                initialNumToRender={3}
                updateCellsBatchingPeriod={150}
                getItemLayout={getItemLayout}
                onEndReached={loadMoreSuccessMindset}
                onEndReachedThreshold={0.5}
                ListFooterComponent={successMindsetLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
              />
            </View>
          )}

          {/* Social Media Growth Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && socialMediaGrowthTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Social Media Growth
                </Text>
                {renderBrowseAllButton(handleViewAllSocialMediaGrowth)}
              </View>
              <FlatList
                data={socialMediaGrowthTemplates}
                renderItem={renderSocialMediaGrowthCard}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={2}
                initialNumToRender={3}
                updateCellsBatchingPeriod={150}
                getItemLayout={getItemLayout}
                onEndReached={loadMoreSocialMediaGrowth}
                onEndReachedThreshold={0.5}
                ListFooterComponent={socialMediaGrowthLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
              />
            </View>
          )}

          {/* Money and Finance Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && moneyAndFinanceTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Money and Finance
                </Text>
                {renderBrowseAllButton(handleViewAllMoneyAndFinance)}
              </View>
              <FlatList
                data={moneyAndFinanceTemplates}
                renderItem={renderMoneyAndFinanceCard}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={2}
                initialNumToRender={3}
                updateCellsBatchingPeriod={150}
                getItemLayout={getItemLayout}
                onEndReached={loadMoreMoneyAndFinance}
                onEndReachedThreshold={0.5}
                ListFooterComponent={moneyAndFinanceLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
              />
            </View>
          )}

          {/* Business Legend Quote Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && businessLegendQuoteTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Business Legend Quote
                </Text>
                {renderBrowseAllButton(handleViewAllBusinessLegendQuote)}
              </View>
              <FlatList
                data={businessLegendQuoteTemplates}
                renderItem={renderBusinessLegendQuoteCard}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={2}
                initialNumToRender={3}
                updateCellsBatchingPeriod={150}
                getItemLayout={getItemLayout}
                onEndReached={loadMoreBusinessLegendQuote}
                onEndReachedThreshold={0.5}
                ListFooterComponent={businessLegendQuoteLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
              />
            </View>
          )}

          {/* Business Marketing Tips Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && businessMarketingTipsTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Business Marketing Tips
                </Text>
                {renderBrowseAllButton(handleViewAllBusinessMarketingTips)}
              </View>
              <FlatList
                data={businessMarketingTipsTemplates}
                renderItem={renderBusinessMarketingTipsCard}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={2}
                initialNumToRender={3}
                updateCellsBatchingPeriod={150}
                getItemLayout={getItemLayout}
                onEndReached={loadMoreBusinessMarketingTips}
                onEndReachedThreshold={0.5}
                ListFooterComponent={businessMarketingTipsLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
              />
            </View>
          )}

          {/* Business Quotes Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && businessQuotesTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Business Quotes
                </Text>
                {renderBrowseAllButton(handleViewAllBusinessQuotes)}
              </View>
              <FlatList
                data={businessQuotesTemplates}
                renderItem={renderBusinessQuotesCard}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={2}
                initialNumToRender={3}
                updateCellsBatchingPeriod={150}
                getItemLayout={getItemLayout}
                onEndReached={loadMoreBusinessQuotes}
                onEndReachedThreshold={0.5}
                ListFooterComponent={businessQuotesLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
              />
            </View>
          )}

        </ScrollView>
      </LinearGradient>

      {/* Template Preview Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeModal}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>G��</Text>
              </TouchableOpacity>
              {selectedTemplate && (
                <>
                  <View style={styles.modalImageContainer}>
                    <OptimizedImage
                      uri={selectedTemplate.thumbnail}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.3)']}
                      style={styles.modalImageOverlay}
                    />
                  </View>
                  <View style={styles.modalInfoContainer}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{selectedTemplate.name}</Text>
                      <Text style={styles.modalCategory}>{selectedTemplate.category}</Text>
                    </View>
                    <View style={styles.modalStats}>
                      <View style={styles.modalStat}>
                        <Text style={styles.modalStatLabel}>Downloads</Text>
                        <Text style={styles.modalStatValue}>{selectedTemplate.downloads}</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Business Categories Modal */}
      <Modal
        visible={isBusinessCategoriesModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeBusinessCategoriesModal}
      >
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeBusinessCategoriesModal}
          />
          <View style={[styles.upcomingEventsModalContent, { backgroundColor: theme.colors.surface }]}>
            <LinearGradient
              colors={theme.colors.gradient}
              style={styles.upcomingEventsModalGradient}
            >
              <View style={styles.upcomingEventsModalHeader}>
                <View style={styles.upcomingEventsModalTitleContainer}>
                  <Text style={[styles.upcomingEventsModalTitle, { color: theme.colors.text }]}>Business Categories</Text>
                </View>
                <TouchableOpacity
                  style={styles.upcomingEventsCloseButton}
                  onPress={closeBusinessCategoriesModal}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.upcomingEventsCloseButtonText, { color: theme.colors.text }]}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            {!isBusinessCategoriesModalClosing && (
              <View style={[styles.upcomingEventsModalBody, { backgroundColor: theme.colors.background }]}>
                <SectionList
                  key={`business-categories-modal-${businessCategories.length}`}
                  sections={groupedBusinessCategories}
                  keyExtractor={(item, index) => `row-${index}-${item.map(c => c.id).join('-')}`}
                  renderItem={renderBusinessCategoryModalItem}
                  renderSectionHeader={renderBusinessCategorySectionHeader}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  stickySectionHeadersEnabled={false}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* General Categories Modal */}
      <Modal
        visible={isGeneralCategoriesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeGeneralCategoriesModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upcomingEventsModalContent}>
            <LinearGradient
              colors={['#f5f5f5', '#ffffff']}
              style={styles.upcomingEventsModalGradient}
            >
              <View style={styles.upcomingEventsModalHeader}>
                <View style={styles.upcomingEventsModalTitleContainer}>
                  <Text style={styles.upcomingEventsModalTitle}>General Categories</Text>
                </View>
                <TouchableOpacity
                  style={styles.upcomingEventsCloseButton}
                  onPress={closeGeneralCategoriesModal}
                >
                  <Text style={styles.upcomingEventsCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={styles.upcomingEventsModalBody}>
              <FlatList
                key={`general-categories-modal-${generalCategoryModalColumns}-${filteredGreetingCategoriesList.length}`}
                data={filteredGreetingCategoriesList}
                keyExtractor={keyExtractorIdString}
                numColumns={generalCategoryModalColumns}
                columnWrapperStyle={styles.generalCategoryModalRow}
                contentContainerStyle={[
                  styles.generalCategoryModalList,
                  {
                    width: generalCategoryModalContentWidth,
                    paddingHorizontal: generalCategoryModalHorizontalPadding,
                    alignSelf: 'center',
                  },
                ]}
                showsVerticalScrollIndicator={false}
                initialNumToRender={generalCategoryModalInitialRenderCount}
                maxToRenderPerBatch={generalCategoryModalColumns * 2}
                windowSize={5}
                updateCellsBatchingPeriod={80}
                removeClippedSubviews={true}
                getItemLayout={getGeneralCategoryModalItemLayout}
                maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.generalCategoryModalCardWrapper,
                      {
                        width: generalCategoryModalCardWidth,
                        marginRight: (index + 1) % generalCategoryModalColumns === 0 ? 0 : generalCategoryModalGap,
                      },
                    ]}
                  >
                    <GreetingCategoryCard
                      item={item}
                      cardWidth={generalCategoryModalCardWidth}
                      theme={theme}
                      categoryImage={memoizedGreetingCategoryImages[item.id] || item.imageUrl || null}
                      onPress={(category) => {
                        closeGeneralCategoriesModal();
                        const categoryImage = memoizedGreetingCategoryImages[item.id] || item.imageUrl || null;
                        handleGreetingCategoryPress(category, categoryImage);
                      }}
                    />
                  </View>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Content Modal */}
      <Modal
        visible={isVideosModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeVideosModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upcomingEventsModalContent}>
            <LinearGradient
              colors={['#f5f5f5', '#ffffff']}
              style={styles.upcomingEventsModalGradient}
            >
              <View style={styles.upcomingEventsModalHeader}>
                <View style={styles.upcomingEventsModalTitleContainer}>
                  <Text style={styles.upcomingEventsModalTitle}>Video Content</Text>
                </View>
                <TouchableOpacity
                  style={styles.upcomingEventsCloseButton}
                  onPress={closeVideosModal}
                >
                  <Text style={styles.upcomingEventsCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={styles.upcomingEventsModalBody}>
              <FlatList
                key={`videos-modal-${videoContent.length}`}
                data={videoContent}
                keyExtractor={keyExtractorId}
                numColumns={modalColumns}
                columnWrapperStyle={styles.upcomingEventModalRow}
                contentContainerStyle={styles.upcomingEventsModalScroll}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                updateCellsBatchingPeriod={50}
                getItemLayout={getModalItemLayout}
                renderItem={renderVideoModalItem}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Support Modal */}
      <Modal
        visible={isCustomerSupportModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeCustomerSupportModal}
      >
        <View style={styles.customerSupportModalOverlay}>
          <TouchableOpacity
            style={styles.customerSupportModalBackdrop}
            activeOpacity={1}
            onPress={closeCustomerSupportModal}
          >
            <View style={styles.customerSupportModalContent}>
              {/* Customer Support Image - Positioned at top */}
              <View style={styles.customerSupportImageContainer}>
                <Image
                  source={require('../assets/icons/customerSupport.png')}
                  style={styles.customerSupportImage}
                  resizeMode="cover"
                />
              </View>

              {/* Close Button - Overlaps the image */}
              <TouchableOpacity
                style={styles.customerSupportCloseButton}
                onPress={closeCustomerSupportModal}
                activeOpacity={0.7}
              >
                <Text style={styles.customerSupportCloseButtonText}>×</Text>
              </TouchableOpacity>

              {/* Contact Options */}
              <View style={styles.customerSupportOptionsContainer}>
                {/* WhatsApp Option */}
                <TouchableOpacity
                  style={styles.customerSupportOptionButton}
                  onPress={handleWhatsAppPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.customerSupportOptionIconContainer}>
                    <MaterialCommunityIcons name="whatsapp" size={moderateScale(24)} color="#009688" />
                  </View>
                  <Text style={styles.customerSupportOptionText}>WhatsApp Us</Text>
                  <Icon name="chevron-right" size={moderateScale(24)} color="#009688" />
                </TouchableOpacity>

                {/* Phone Option */}
                <TouchableOpacity
                  style={styles.customerSupportOptionButton}
                  onPress={handlePhonePress}
                  activeOpacity={0.7}
                >
                  <View style={styles.customerSupportOptionIconContainer}>
                    <Icon name="phone" size={moderateScale(24)} color="#009688" />
                  </View>
                  <Text style={styles.customerSupportOptionText}>Call Our Team</Text>
                  <Icon name="chevron-right" size={moderateScale(24)} color="#009688" />
                </TouchableOpacity>

                {/* Email Option */}
                <TouchableOpacity
                  style={styles.customerSupportOptionButton}
                  onPress={handleEmailPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.customerSupportOptionIconContainer}>
                    <Icon name="email" size={moderateScale(24)} color="#009688" />
                  </View>
                  <Text style={styles.customerSupportOptionText}>Email Us</Text>
                  <Icon name="chevron-right" size={moderateScale(24)} color="#009688" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      <ComingSoonModal
        visible={showVideoComingSoonModal}
        onClose={() => setShowVideoComingSoonModal(false)}
        title="Video Editor Coming Soon"
        subtitle="We are polishing the video creation experience. Stay tuned for the next update!"
      />


      {/* Business Ethics Modal */}
      <Modal
        visible={isBusinessEthicsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeBusinessEthicsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upcomingEventsModalContent}>
            <LinearGradient
              colors={['#f5f5f5', '#ffffff']}
              style={styles.upcomingEventsModalGradient}
            >
              <View style={styles.upcomingEventsModalHeader}>
                <View style={styles.upcomingEventsModalTitleContainer}>
                  <Text style={styles.upcomingEventsModalTitle}>Business Ethics</Text>
                </View>
                <TouchableOpacity
                  style={styles.upcomingEventsCloseButton}
                  onPress={closeBusinessEthicsModal}
                >
                  <Text style={styles.upcomingEventsCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={styles.upcomingEventsModalBody}>
              <FlatList
                key={`businessethics-modal-${businessEthicsTemplatesRaw.length > 0 ? businessEthicsTemplatesRaw.length : businessEthicsTemplates.length}`}
                data={businessEthicsTemplatesRaw.length > 0 ? businessEthicsTemplatesRaw : businessEthicsTemplates}
                keyExtractor={keyExtractorId}
                numColumns={modalColumns}
                columnWrapperStyle={styles.upcomingEventModalRow}
                contentContainerStyle={styles.upcomingEventsModalScroll}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                updateCellsBatchingPeriod={50}
                getItemLayout={getModalItemLayout}
                renderItem={renderBusinessEthicsModalItem}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Mindset Modal */}
      <Modal
        visible={isSuccessMindsetModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSuccessMindsetModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upcomingEventsModalContent}>
            <LinearGradient
              colors={['#f5f5f5', '#ffffff']}
              style={styles.upcomingEventsModalGradient}
            >
              <View style={styles.upcomingEventsModalHeader}>
                <View style={styles.upcomingEventsModalTitleContainer}>
                  <Text style={styles.upcomingEventsModalTitle}>Success Mindset</Text>
                </View>
                <TouchableOpacity
                  style={styles.upcomingEventsCloseButton}
                  onPress={closeSuccessMindsetModal}
                >
                  <Text style={styles.upcomingEventsCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={styles.upcomingEventsModalBody}>
              <FlatList
                key={`successmindset-modal-${successMindsetTemplatesRaw.length > 0 ? successMindsetTemplatesRaw.length : successMindsetTemplates.length}`}
                data={successMindsetTemplatesRaw.length > 0 ? successMindsetTemplatesRaw : successMindsetTemplates}
                keyExtractor={keyExtractorId}
                numColumns={modalColumns}
                columnWrapperStyle={styles.upcomingEventModalRow}
                contentContainerStyle={styles.upcomingEventsModalScroll}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                updateCellsBatchingPeriod={50}
                getItemLayout={getModalItemLayout}
                renderItem={renderSuccessMindsetModalItem}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Social Media Growth Modal */}
      <Modal
        visible={isSocialMediaGrowthModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSocialMediaGrowthModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upcomingEventsModalContent}>
            <LinearGradient
              colors={['#f5f5f5', '#ffffff']}
              style={styles.upcomingEventsModalGradient}
            >
              <View style={styles.upcomingEventsModalHeader}>
                <View style={styles.upcomingEventsModalTitleContainer}>
                  <Text style={styles.upcomingEventsModalTitle}>Social Media Growth</Text>
                </View>
                <TouchableOpacity
                  style={styles.upcomingEventsCloseButton}
                  onPress={closeSocialMediaGrowthModal}
                >
                  <Text style={styles.upcomingEventsCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={styles.upcomingEventsModalBody}>
              <FlatList
                key={`socialmediagrowth-modal-${socialMediaGrowthTemplatesRaw.length > 0 ? socialMediaGrowthTemplatesRaw.length : socialMediaGrowthTemplates.length}`}
                data={socialMediaGrowthTemplatesRaw.length > 0 ? socialMediaGrowthTemplatesRaw : socialMediaGrowthTemplates}
                keyExtractor={keyExtractorId}
                numColumns={modalColumns}
                columnWrapperStyle={styles.upcomingEventModalRow}
                contentContainerStyle={styles.upcomingEventsModalScroll}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                updateCellsBatchingPeriod={50}
                getItemLayout={getModalItemLayout}
                renderItem={renderSocialMediaGrowthModalItem}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Money and Finance Modal */}
      <Modal
        visible={isMoneyAndFinanceModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeMoneyAndFinanceModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upcomingEventsModalContent}>
            <LinearGradient
              colors={['#f5f5f5', '#ffffff']}
              style={styles.upcomingEventsModalGradient}
            >
              <View style={styles.upcomingEventsModalHeader}>
                <View style={styles.upcomingEventsModalTitleContainer}>
                  <Text style={styles.upcomingEventsModalTitle}>Money and Finance</Text>
                </View>
                <TouchableOpacity
                  style={styles.upcomingEventsCloseButton}
                  onPress={closeMoneyAndFinanceModal}
                >
                  <Text style={styles.upcomingEventsCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={styles.upcomingEventsModalBody}>
              <FlatList
                key={`moneyandfinance-modal-${moneyAndFinanceTemplatesRaw.length > 0 ? moneyAndFinanceTemplatesRaw.length : moneyAndFinanceTemplates.length}`}
                data={moneyAndFinanceTemplatesRaw.length > 0 ? moneyAndFinanceTemplatesRaw : moneyAndFinanceTemplates}
                keyExtractor={keyExtractorId}
                numColumns={modalColumns}
                columnWrapperStyle={styles.upcomingEventModalRow}
                contentContainerStyle={styles.upcomingEventsModalScroll}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                updateCellsBatchingPeriod={50}
                getItemLayout={getModalItemLayout}
                renderItem={renderMoneyAndFinanceModalItem}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Business Legend Quote Modal */}
      <Modal
        visible={isBusinessLegendQuoteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeBusinessLegendQuoteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upcomingEventsModalContent}>
            <LinearGradient
              colors={['#f5f5f5', '#ffffff']}
              style={styles.upcomingEventsModalGradient}
            >
              <View style={styles.upcomingEventsModalHeader}>
                <View style={styles.upcomingEventsModalTitleContainer}>
                  <Text style={styles.upcomingEventsModalTitle}>Business Legend Quote</Text>
                </View>
                <TouchableOpacity
                  style={styles.upcomingEventsCloseButton}
                  onPress={closeBusinessLegendQuoteModal}
                >
                  <Text style={styles.upcomingEventsCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={styles.upcomingEventsModalBody}>
              <FlatList
                key={`businesslegendquote-modal-${businessLegendQuoteTemplatesRaw.length > 0 ? businessLegendQuoteTemplatesRaw.length : businessLegendQuoteTemplates.length}`}
                data={businessLegendQuoteTemplatesRaw.length > 0 ? businessLegendQuoteTemplatesRaw : businessLegendQuoteTemplates}
                keyExtractor={keyExtractorId}
                numColumns={modalColumns}
                columnWrapperStyle={styles.upcomingEventModalRow}
                contentContainerStyle={styles.upcomingEventsModalScroll}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                updateCellsBatchingPeriod={50}
                getItemLayout={getModalItemLayout}
                renderItem={renderBusinessLegendQuoteModalItem}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Business Marketing Tips Modal */}
      <Modal
        visible={isBusinessMarketingTipsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeBusinessMarketingTipsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upcomingEventsModalContent}>
            <LinearGradient
              colors={['#f5f5f5', '#ffffff']}
              style={styles.upcomingEventsModalGradient}
            >
              <View style={styles.upcomingEventsModalHeader}>
                <View style={styles.upcomingEventsModalTitleContainer}>
                  <Text style={styles.upcomingEventsModalTitle}>Business Marketing Tips</Text>
                </View>
                <TouchableOpacity
                  style={styles.upcomingEventsCloseButton}
                  onPress={closeBusinessMarketingTipsModal}
                >
                  <Text style={styles.upcomingEventsCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={styles.upcomingEventsModalBody}>
              <FlatList
                key={`businessmarketingtips-modal-${businessMarketingTipsTemplatesRaw.length > 0 ? businessMarketingTipsTemplatesRaw.length : businessMarketingTipsTemplates.length}`}
                data={businessMarketingTipsTemplatesRaw.length > 0 ? businessMarketingTipsTemplatesRaw : businessMarketingTipsTemplates}
                keyExtractor={keyExtractorId}
                numColumns={modalColumns}
                columnWrapperStyle={styles.upcomingEventModalRow}
                contentContainerStyle={styles.upcomingEventsModalScroll}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                updateCellsBatchingPeriod={50}
                getItemLayout={getModalItemLayout}
                renderItem={renderBusinessMarketingTipsModalItem}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Business Quotes Modal */}
      <Modal
        visible={isBusinessQuotesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeBusinessQuotesModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upcomingEventsModalContent}>
            <LinearGradient
              colors={['#f5f5f5', '#ffffff']}
              style={styles.upcomingEventsModalGradient}
            >
              <View style={styles.upcomingEventsModalHeader}>
                <View style={styles.upcomingEventsModalTitleContainer}>
                  <Text style={styles.upcomingEventsModalTitle}>Business Quotes</Text>
                </View>
                <TouchableOpacity
                  style={styles.upcomingEventsCloseButton}
                  onPress={closeBusinessQuotesModal}
                >
                  <Text style={styles.upcomingEventsCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={styles.upcomingEventsModalBody}>
              <FlatList
                key={`businessquotes-modal-${businessQuotesTemplatesRaw.length > 0 ? businessQuotesTemplatesRaw.length : businessQuotesTemplates.length}`}
                data={businessQuotesTemplatesRaw.length > 0 ? businessQuotesTemplatesRaw : businessQuotesTemplates}
                keyExtractor={keyExtractorId}
                numColumns={modalColumns}
                columnWrapperStyle={styles.upcomingEventModalRow}
                contentContainerStyle={styles.upcomingEventsModalScroll}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                updateCellsBatchingPeriod={50}
                getItemLayout={getModalItemLayout}
                renderItem={renderBusinessQuotesModalItem}
              />
            </View>
          </View>
        </View>
      </Modal>


      {/* Featured Content Modal */}
      <Modal visible={isFeaturedContentModalVisible} transparent={true} animationType="slide" onRequestClose={closeFeaturedContentModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.upcomingEventsModalContent}>
            <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
              <View style={styles.upcomingEventsModalHeader}>
                <View style={styles.upcomingEventsModalTitleContainer}>
                  <Text style={styles.upcomingEventsModalTitle}>Featured Content</Text>
                </View>
                <TouchableOpacity style={styles.upcomingEventsCloseButton} onPress={closeFeaturedContentModal}>
                  <Text style={styles.upcomingEventsCloseButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={styles.upcomingEventsModalBody}>
              <FlatList
                key={`featured-content-modal-${featuredContent.length}`}
                data={featuredContent}
                keyExtractor={keyExtractorId}
                numColumns={modalColumns}
                columnWrapperStyle={styles.upcomingEventModalRow}
                contentContainerStyle={styles.upcomingEventsModalScroll}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                updateCellsBatchingPeriod={50}
                getItemLayout={getModalItemLayout}
                renderItem={renderFeaturedContentModalItem}
              />
            </View>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
});

HomeScreen.displayName = 'HomeScreen';

// Get dynamic screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive helper functions
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive values
const getResponsiveValue = (small: number, medium: number, large: number) => {
  if (SCREEN_WIDTH < 400) return small;
  if (SCREEN_WIDTH < 768) return medium;
  return large;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    paddingTop: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingBottom: moderateScale(8),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: moderateScale(8),
  },
  userAvatarContainer: {
    marginRight: moderateScale(8),
  },
  userAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...responsiveShadow.small,
  },
  userAvatarText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(20),
  },
  userInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  headerActionButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    ...responsiveShadow.small,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: moderateScale(8),
    color: 'rgba(51,51,51,0.7)',
    marginBottom: moderateScale(1.5),
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    marginTop: moderateScale(2),
  },
  userName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: moderateScale(2),
  },
  apiStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(1),
    borderRadius: moderateScale(6),
    marginTop: moderateScale(2),
    gap: moderateScale(2),
  },
  apiStatusText: {
    fontSize: moderateScale(7),
    color: '#ff9800',
    fontWeight: '500',
  },
  apiLoadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    gap: moderateScale(3),
  },
  apiLoadingText: {
    fontSize: moderateScale(7),
    color: '#4CAF50',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Fixed padding for tab bar
  },
  searchContainer: {
    paddingHorizontal: moderateScale(12),
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  calendarSection: {
    marginHorizontal: moderateScale(8),
    marginBottom: moderateScale(6),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    minHeight: moderateScale(36),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginLeft: moderateScale(2),
    marginRight: moderateScale(4),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  searchResultsTextContainer: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    backgroundColor: 'transparent',
  },
  searchResultsTitle: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    marginBottom: moderateScale(4),
    opacity: 0.7,
  },
  searchResultsText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  matchedCategoryNameContainer: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    marginBottom: moderateScale(8),
    backgroundColor: 'transparent',
  },
  matchedCategoryNameText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    lineHeight: moderateScale(22),
    letterSpacing: moderateScale(0.2),
  },
  clearIcon: {
    marginLeft: moderateScale(4),
    marginRight: moderateScale(4),
    padding: moderateScale(2),
  },
  featuredCarouselWrapper: {
    width: '100%',
  },
  featuredCarouselContainer: {
    marginTop: moderateScale(10),
    marginBottom: moderateScale(6),
    // No horizontal padding or margin - spacing comes from FlatList paddingHorizontal
  },
  featuredCarouselList: {
    paddingHorizontal: 20, // 20px padding on each side - spacing comes from container, not card margins
  },
  featuredCarouselCard: {
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
    position: 'relative',
  },
  featuredCarouselImage: {
    width: '100%',
    height: '100%',
  },
  featuredCarouselOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  featuredCarouselContent: {
    position: 'absolute',
    bottom: moderateScale(10),
    left: moderateScale(12),
    right: moderateScale(12),
  },
  featuredCarouselTitle: {
    color: '#ffffff',
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginBottom: moderateScale(4),
  },
  featuredCarouselBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  featuredCarouselBadgeText: {
    color: '#ffffff',
    fontSize: moderateScale(9),
    fontWeight: '600',
  },
  featuredCarouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: moderateScale(6),
    gap: moderateScale(4),
  },
  featuredCarouselDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  featuredCarouselDotActive: {
    width: moderateScale(16),
    backgroundColor: '#667eea',
  },
  categoryButtonsContainer: {
    flexDirection: 'row',
    marginTop: moderateScale(8),
    gap: moderateScale(8),
  },
  categoryButton: {
    flex: 1,
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  categoryButtonBusiness: {
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  categoryButtonRotating: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  categoryButtonGradient: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(42),
  },
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  categoryButtonIcon: {
    marginRight: moderateScale(2),
  },
  categoryButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoryButtonTextBusiness: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  categoryButtonRotatingText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    flexShrink: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(18),
    marginBottom: verticalScale(12),
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(4),
    marginHorizontal: moderateScale(2),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(30),
  },
  tabText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: moderateScale(14),
  },
  bannerSection: {
    marginBottom: verticalScale(10),
    paddingHorizontal: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
    paddingHorizontal: moderateScale(10),
  },
  bannerList: {
    paddingHorizontal: moderateScale(3),
  },
  bannerContainerWrapper: {
    width: getResponsiveValue(SCREEN_WIDTH * 0.70, SCREEN_WIDTH * 0.65, SCREEN_WIDTH * 0.55),
    marginRight: moderateScale(4),
  },
  bannerContainer: {
    width: '100%',
    height: verticalScale(80),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  bannerContent: {
    position: 'absolute',
    bottom: moderateScale(5),
    left: moderateScale(5),
    right: moderateScale(5),
  },
  bannerTitle: {
    fontSize: moderateScale(10),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: moderateScale(3),
  },
  bannerButton: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    fontSize: moderateScale(8),
    fontWeight: '600',
  },
  upcomingEventsSection: {
    marginBottom: verticalScale(10),
    paddingHorizontal: moderateScale(8),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(2),
    marginBottom: verticalScale(4),
  },
  viewAllButton: {
    paddingHorizontal: moderateScale(2),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  viewAllButtonGradient: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: moderateScale(2),
  },
  viewAllButtonText: {
    fontSize: SCREEN_WIDTH < 360 ? moderateScale(10) : moderateScale(9),
    fontWeight: '600',
    color: '#ffffff',
  },
  upcomingEventsList: {
    paddingHorizontal: moderateScale(3),
  },
  upcomingEventCard: {
    width: getResponsiveValue(SCREEN_WIDTH * 0.32, SCREEN_WIDTH * 0.28, SCREEN_WIDTH * 0.18),
    marginRight: moderateScale(3),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    ...responsiveShadow.small,
  },
  upcomingEventImageContainer: {
    height: verticalScale(60),
    position: 'relative',
  },
  upcomingEventImage: {
    width: '100%',
    height: '100%',
  },
  upcomingEventOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  upcomingEventBadge: {
    position: 'absolute',
    top: moderateScale(4),
    left: moderateScale(4),
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  upcomingEventBadgeText: {
    fontSize: moderateScale(7),
    color: '#ffffff',
    fontWeight: '600',
  },
  templatesSection: {
    width: '100%',
    paddingBottom: verticalScale(15),
    paddingHorizontal: moderateScale(8),
  },
  businessCategoriesSection: {
    paddingBottom: verticalScale(15),
    paddingHorizontal: moderateScale(8),
  },
  businessCategoriesSectionHighlighted: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    marginVertical: moderateScale(4),
  },
  businessCategoryCard: {
    marginRight: moderateScale(3),
  },
  businessCategoryCardContent: {
    width: '100%',
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    ...responsiveShadow.small,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  businessCategoryImageSection: {
    flex: 1,
    width: '100%',
  },
  businessCategoryImageGrid: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  businessCategoryImageCell: {
    width: '50%',
    height: '50%',
    padding: 1,
  },
  businessCategoryImageCellFull: {
    width: '100%',
  },
  businessCategoryImageCellImage: {
    width: '100%',
    height: '100%',
  },
  businessCategoryImage: {
    width: '100%',
    height: '100%',
  },
  businessCategoryIcon: {
    fontSize: moderateScale(32),
    color: '#555',
  },
  businessCategoryName: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    textAlign: 'left',
    letterSpacing: 0.2,
  },
  businessCategoryModalNameContainer: {
    position: 'absolute',
    left: moderateScale(6),
    right: moderateScale(6),
    bottom: moderateScale(6),
  },
  businessCategoryModalName: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  businessCategoryModalGrid: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  businessCategoryModalCell: {
    width: '50%',
    height: '50%',
    padding: 1,
  },
  businessCategoryModalCellFull: {
    width: '100%',
  },
  businessCategoryModalCellImage: {
    width: '100%',
    height: '100%',
  },
  videoSection: {
    paddingBottom: verticalScale(15),
    paddingHorizontal: moderateScale(8),
  },
  templateRow: {
    justifyContent: 'flex-start',
    paddingHorizontal: moderateScale(4),
    gap: moderateScale(2),
  },
  horizontalList: {
    paddingHorizontal: moderateScale(3),
  },
  verticalSearchList: {
    paddingVertical: moderateScale(5),
    paddingHorizontal: moderateScale(1),
  },
  verticalTemplateContainer: {
    marginBottom: moderateScale(8),
    alignItems: 'stretch',
  },
  templateCardWrapper: {
    width: getResponsiveValue(SCREEN_WIDTH * 0.32, SCREEN_WIDTH * 0.28, SCREEN_WIDTH * 0.18),
    marginRight: moderateScale(3),
  },
  templateCard: {
    width: '100%',
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    ...responsiveShadow.small,
  },
  templateImageContainer: {
    height: verticalScale(60),
    position: 'relative',
    overflow: 'hidden',
  },
  templateImage: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative' as const,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoPlayOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  templateOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  templateInfo: {
    padding: moderateScale(12),
  },
  templateName: {
    fontSize: responsiveFontSize.sm,
    fontWeight: 'bold',
    marginBottom: responsiveSpacing.xs,
  },
  templateCategory: {
    fontSize: responsiveFontSize.xs,
    marginBottom: responsiveSpacing.xs,
  },
  templateStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: responsiveFontSize.xs,
    fontWeight: '500',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  sectionLoadingIndicator: {
    marginLeft: 8,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(8),
    fontSize: moderateScale(12),
    fontWeight: '500',
    textAlign: 'center',
  },
  templateStat: {
    fontSize: responsiveFontSize.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.92, // Slightly wider
    height: SCREEN_HEIGHT * 0.75, // Reduced from 0.8
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(16), // Reduced from 20
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: moderateScale(10), // Reduced from 15
    right: moderateScale(10),
    width: moderateScale(26), // Reduced from 30
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Lighter
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(14), // Reduced from 16
    fontWeight: 'bold',
  },
  modalImageContainer: {
    height: SCREEN_HEIGHT * 0.35, // Reduced from 0.4
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: moderateScale(40), // Reduced from 60
  },
  modalInfoContainer: {
    flex: 1,
    padding: moderateScale(12), // Reduced from 18
  },
  modalHeader: {
    marginBottom: verticalScale(8), // Reduced from 12
  },
  modalTitle: {
    fontSize: moderateScale(15), // Reduced from 18
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: moderateScale(3), // Reduced from 4
  },
  modalCategory: {
    fontSize: moderateScale(11), // Reduced from 14
    color: '#666666',
    fontWeight: '500',
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: verticalScale(12), // Reduced from 20
    paddingVertical: verticalScale(6), // Reduced from 10
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(10), // Reduced from 15
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: moderateScale(9), // Reduced from 12
    color: '#666666',
    fontWeight: '500',
    marginBottom: moderateScale(2), // Reduced from 4
  },
  modalStatValue: {
    fontSize: moderateScale(13), // Reduced from 16
    fontWeight: 'bold',
    color: '#333333',
  },
  // Upcoming Festivals Modal Styles - Compact & Responsive
  upcomingEventsModalContent: {
    width: SCREEN_WIDTH >= 768 ? SCREEN_WIDTH * 0.90 : SCREEN_WIDTH * 0.96,
    maxWidth: SCREEN_WIDTH >= 768 ? 900 : SCREEN_WIDTH * 0.96,
    height: SCREEN_HEIGHT * 0.85, // Reduced from 0.9
    backgroundColor: '#ffffff', // This will be overridden by theme in the component
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(8), // Reduced from 20
    },
    shadowOpacity: 0.2, // Reduced from 0.3
    shadowRadius: moderateScale(12), // Reduced from 25
    elevation: 10, // Reduced from 15
  },
  upcomingEventsModalGradient: {
    paddingTop: verticalScale(8), // Further reduced from 15
    paddingBottom: verticalScale(4), // Further reduced from 6
  },
  upcomingEventsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Changed from flex-start to center
    paddingHorizontal: moderateScale(12),
  },
  upcomingEventsModalTitleContainer: {
    flex: 1,
    marginRight: moderateScale(6), // Reduced from 8
  },
  upcomingEventsModalTitle: {
    fontSize: SCREEN_WIDTH >= 768 ? moderateScale(15) : moderateScale(13), // Further reduced from 18/16
    fontWeight: 'bold',
    color: '#333333', // This will be overridden by theme in the component
    marginBottom: 0, // No margin needed without subtitle
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 2,
  },
  upcomingEventsModalSubtitle: {
    fontSize: 0, // Hidden
    color: 'rgba(255,255,255,0)',
    fontWeight: '500',
    display: 'none',
  },
  upcomingEventsCloseButton: {
    width: SCREEN_WIDTH >= 768 ? moderateScale(28) : moderateScale(26), // Further reduced from 36/32
    height: SCREEN_WIDTH >= 768 ? moderateScale(28) : moderateScale(26),
    borderRadius: SCREEN_WIDTH >= 768 ? moderateScale(14) : moderateScale(13),
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  upcomingEventsCloseButtonText: {
    fontSize: SCREEN_WIDTH >= 768 ? moderateScale(15) : moderateScale(14), // Further reduced from 18/16
    color: '#333333',
    fontWeight: 'bold',
  },
  upcomingEventsModalBody: {
    flex: 1,
    backgroundColor: '#f8f9fa', // This will be overridden by theme in the component
  },
  upcomingEventsModalScroll: {
    paddingHorizontal: 0, // Remove padding from container, add to rows instead
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(12),
  },
  upcomingEventModalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Changed from space-between to align items from left
    marginBottom: moderateScale(6),
    paddingLeft: moderateScale(8), // Left padding
    paddingRight: moderateScale(8), // Right padding - equal to left
    width: '100%',
  },
  upcomingEventModalCard: {
    // Width is set dynamically via inline styles based on modalColumns
    // Note: marginRight is applied conditionally in renderItem to avoid extra space on last card
    backgroundColor: '#ffffff', // This will be overridden by theme in the component
    borderRadius: moderateScale(8),
    ...responsiveShadow.small,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  upcomingEventModalImageContainer: {
    width: '100%',
    aspectRatio: SCREEN_WIDTH >= 768 ? 1 : 0.9, // More square for compact layout
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
  },
  upcomingEventModalImage: {
    width: '100%',
    height: '100%',
  },
  upcomingEventModalOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_WIDTH >= 768 ? moderateScale(50) : moderateScale(40), // Reduced from 80/60
  },
  upcomingEventModalBadge: {
    position: 'absolute',
    top: moderateScale(6), // Reduced from 12
    left: moderateScale(6),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(6), // Reduced from 10
    paddingVertical: moderateScale(3), // Reduced from 6
    borderRadius: moderateScale(10), // Reduced from 16
    gap: moderateScale(2), // Reduced from 4
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1), // Reduced from 2
    },
    shadowOpacity: 0.15, // Reduced from 0.2
    shadowRadius: moderateScale(3), // Reduced from 4
    elevation: 2, // Reduced from 3
  },
  upcomingEventModalBadgeText: {
    fontSize: moderateScale(7), // Reduced from 10
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3, // Reduced from 0.5
  },
  premiumEventBadge: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  premiumEventBadgeText: {
    color: '#FFD700',
  },
  upcomingEventModalContent: {
    padding: moderateScale(6), // Reduced from responsiveSpacing.sm
  },
  upcomingEventModalTitle: {
    fontSize: SCREEN_WIDTH >= 768 ? moderateScale(13) : moderateScale(12), // Reduced from 16/14
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: moderateScale(2), // Reduced from responsiveSpacing.xs
  },
  upcomingEventModalDetails: {
    gap: moderateScale(2), // Reduced from responsiveSpacing.xs
  },
  upcomingEventModalDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingEventModalDetailLabel: {
    fontSize: SCREEN_WIDTH >= 768 ? moderateScale(11) : moderateScale(10), // Reduced from 14/13
    color: '#666666',
    fontWeight: '500',
  },
  // Customer Support Modal Styles
  customerSupportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerSupportModalBackdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerSupportModalContent: {
    width: SCREEN_WIDTH >= 768 ? SCREEN_WIDTH * 0.6 : SCREEN_WIDTH * 0.85,
    maxWidth: 450,
    minHeight: moderateScale(400), // Increased height to fit all buttons
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    padding: moderateScale(24),
    paddingTop: 0, // No top padding since image is at top
    paddingHorizontal: 0, // No horizontal padding to allow image to stretch
    position: 'relative',
    overflow: 'hidden', // Ensure image respects border radius
    ...responsiveShadow.large,
  },
  customerSupportImageContainer: {
    width: '100%',
    height: moderateScale(200),
    position: 'relative',
    marginTop: 0,
    marginBottom: moderateScale(8),
    marginLeft: 0,
    marginRight: 0,
  },
  customerSupportImage: {
    width: '100%',
    height: '100%',
  },
  customerSupportCloseButton: {
    position: 'absolute',
    top: moderateScale(12),
    right: moderateScale(12),
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20, // Higher z-index to overlap image
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  customerSupportCloseButtonText: {
    fontSize: moderateScale(18),
    color: '#333333',
    fontWeight: 'bold',
  },
  customerSupportOptionsContainer: {
    gap: moderateScale(16),
    marginTop: moderateScale(20),
    width: '100%',
    paddingHorizontal: moderateScale(24), // Add horizontal padding for buttons
  },
  customerSupportOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...responsiveShadow.small,
  },
  customerSupportOptionIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  customerSupportOptionText: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#333333',
  },
  businessProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: moderateScale(4),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
    gap: moderateScale(4),
  },
  businessProfilePillText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#667eea',
    maxWidth: moderateScale(140),
  },
  businessProfileDropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  businessProfileDropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  businessProfileDropdownContent: {
    position: 'absolute',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    ...responsiveShadow.small,
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    backgroundColor: '#ffffff',
    maxHeight: moderateScale(260),
  },
  businessProfileDropdownTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginBottom: moderateScale(10),
  },
  businessProfileDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  businessProfileDropdownList: {
    maxHeight: moderateScale(210),
    marginBottom: moderateScale(12),
  },
  businessProfileDropdownItem: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginBottom: moderateScale(8),
    backgroundColor: '#ffffff',
  },
  businessProfileDropdownItemActive: {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
  },
  businessProfileDropdownItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(4),
  },
  businessProfileDropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  businessProfileDropdownAvatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  businessProfileDropdownAvatarImage: {
    width: '100%',
    height: '100%',
  },
  businessProfileDropdownAvatarText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#667eea',
  },
  businessProfileDropdownTextContainer: {
    flex: 1,
  },
  businessProfileDropdownItemName: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    flex: 1,
    marginRight: moderateScale(6),
  },
  businessProfileDropdownItemCategory: {
    fontSize: moderateScale(10),
    fontWeight: '500',
  },
  businessProfileDropdownManageButton: {
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(24),
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessProfileDropdownManageButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  businessProfileDropdownLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(20),
    gap: moderateScale(6),
  },
  businessProfileDropdownLoadingText: {
    fontSize: moderateScale(10),
    fontWeight: '500',
  },
  businessProfileDropdownEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(20),
    gap: moderateScale(10),
  },
  businessProfileDropdownEmptyText: {
    fontSize: moderateScale(11),
    textAlign: 'center',
    fontWeight: '500',
  },
  generalCategoryModalRow: {
    justifyContent: 'flex-start',
    marginBottom: moderateScale(6),
    paddingHorizontal: 0,
  },
  generalCategoryModalList: {
    paddingHorizontal: moderateScale(8),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(12),
  },
  generalCategoryModalCardWrapper: {
    marginRight: 0,
    marginBottom: moderateScale(6),
  },
  businessCategorySectionHeaderContainer: {
    width: '100%',
  },
  businessCategorySectionHeaderWrapper: {
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },
  businessCategorySectionHeaderGradient: {
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  businessCategorySectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessCategorySectionIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    ...responsiveShadow.small,
  },
  businessCategorySectionTitleContainer: {
    flex: 1,
  },
  businessCategorySectionHeaderText: {
    letterSpacing: 0.4,
  },
  businessCategorySectionUnderline: {
    height: 2,
    width: moderateScale(32),
    borderRadius: moderateScale(1),
  },
  // Search Category Styles
  searchCategoryContainer: {
    width: '100%',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },
  searchCategoryTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: moderateScale(4),
  },
  searchCategorySubtitle: {
    fontSize: moderateScale(11),
    marginBottom: moderateScale(8),
  },
  // Hierarchical Search Styles
  parentCategoryContainer: {
    width: '100%',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  parentCategoryTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: moderateScale(4),
  },
  childCategoryContainer: {
    width: '100%',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    backgroundColor: 'transparent',
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(6),
    marginLeft: moderateScale(8),
  },
  childCategoryTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: moderateScale(6),
  },

});

export default HomeScreen;


