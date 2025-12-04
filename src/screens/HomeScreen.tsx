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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import dashboardService, { Banner, Template } from '../services/dashboard';
import homeApi, { 
  FeaturedContent, 
  UpcomingEvent, 
  ProfessionalTemplate, 
  VideoContent 
} from '../services/homeApi';
import greetingTemplatesService from '../services/greetingTemplates';
import businessCategoryPostersApi from '../services/businessCategoryPostersApi';
import businessCategoriesService, { BusinessCategory } from '../services/businessCategoriesService';
import businessProfileService, { BusinessProfile } from '../services/businessProfile';
import calendarApi, { CalendarPoster } from '../services/calendarApi';
import { useTheme } from '../context/ThemeContext';
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

const devWarn = __DEV__ ? console.warn : () => {};
const devError = __DEV__ ? console.error : () => {};

// Memoized Template Card Component to avoid recreating Animated.Value on every render
interface TemplateCardProps {
  item: Template;
  cardWidth: number;
  theme: any;
  onPress: (item: Template) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = React.memo(({ item, cardWidth, theme, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

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
                {item.icon ? <Text style={styles.businessCategoryIcon}>{item.icon}</Text> : null}
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

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

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
  onPress: (item: { id: string; name: string; icon: string; color?: string }) => void;
}

const GreetingCategoryCard: React.FC<GreetingCategoryCardProps> = React.memo(({ item, cardWidth, theme, categoryImage, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

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
              {item.icon ? (
                <Text style={styles.businessCategoryIcon}>
                  {item.icon}
                </Text>
              ) : null}
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
        devError('❌ [GREETING CARD] Invalid item:', item);
      }
      return;
    }
    
    // Navigate immediately - related templates already computed
    navigation.navigate('PosterPlayer', {
      selectedPoster: item,
      relatedPosters: relatedTemplates,
      searchQuery: searchQuery || '',
      templateSource: 'greeting',
    });
    
    // Call onCardPress after navigation to avoid blocking
    if (onCardPress) {
      requestAnimationFrame(() => {
        onCardPress(item);
      });
    }
  }, [item, relatedTemplates, searchQuery, navigation, onCardPress]);

  if (!item || !item.thumbnail) {
    return null;
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

  return {
    id: poster.id,
    name: poster.title || poster.name || `${categoryName} Poster`,
    thumbnail: poster.imageUrl || poster.thumbnail || '',
    category: poster.category || categoryName,
    downloads: poster.downloads || 0,
    isDownloaded: false,
    tags: normalizedTags,
  };
};

const HomeScreen: React.FC = React.memo(() => {
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  
  // Get current user info
  const userProfileSectionRef = useRef<View>(null);
  const [userProfile, setUserProfile] = useState(() => authService.getCurrentUser());
  const [userBusinessProfiles, setUserBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [businessProfilesLoadingState, setBusinessProfilesLoadingState] = useState(false);
  const [selectedBusinessProfileId, setSelectedBusinessProfileId] = useState<string | null>(null);
  const [isBusinessProfileDropdownVisible, setIsBusinessProfileDropdownVisible] = useState(false);
  const [businessProfileDropdownPosition, setBusinessProfileDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(user => {
      setUserProfile(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadBusinessProfiles = async () => {
      const currentUserId = userProfile?.id || authService.getCurrentUser()?.id;
      if (!currentUserId) {
        return;
      }
      setBusinessProfilesLoadingState(true);
      try {
        const profiles = await businessProfileService.getUserBusinessProfiles(currentUserId);
        if (!isMounted) {
          return;
        }
        setUserBusinessProfiles(profiles);
        const storedProfileId = await AsyncStorage.getItem('selectedBusinessProfileId');
        let resolvedProfileId: string | null = null;
        if (storedProfileId && profiles.some(profile => profile.id === storedProfileId)) {
          resolvedProfileId = storedProfileId;
        } else if (profiles.length > 0) {
          resolvedProfileId = profiles[0].id;
        }
        if (resolvedProfileId) {
          setSelectedBusinessProfileId(resolvedProfileId);
        }
      } catch (error) {
        if (__DEV__) {
          devError('Error loading business profiles for dropdown:', error);
        }
      } finally {
        if (isMounted) {
          setBusinessProfilesLoadingState(false);
        }
      }
    };

    loadBusinessProfiles();
    return () => {
      isMounted = false;
    };
  }, [userProfile?.id]);

  const userName = useMemo(() => {
    return (
      userProfile?.displayName ||
      userProfile?.name ||
      userProfile?.companyName ||
      userProfile?.username ||
      'User'
    );
  }, [userProfile]);
  const selectedBusinessProfile = useMemo(
    () => userBusinessProfiles.find(profile => profile.id === selectedBusinessProfileId) || null,
    [userBusinessProfiles, selectedBusinessProfileId]
  );
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
    return (
      userProfile?.photo ||
      userProfile?.photoURL ||
      userProfile?.logo ||
      userProfile?.companyLogo ||
      userProfile?.avatar ||
      null
    );
  }, [userProfile]);
  useEffect(() => {
    if (selectedBusinessProfileId) {
      AsyncStorage.setItem('selectedBusinessProfileId', selectedBusinessProfileId).catch(() => {});
    }
    if (selectedBusinessProfile?.category) {
      AsyncStorage.setItem('selectedBusinessProfileCategory', selectedBusinessProfile.category).catch(() => {});
    }
  }, [selectedBusinessProfileId, selectedBusinessProfile?.category]);
  
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

  const closeBusinessCategoriesModal = useCallback(() => {
    setIsBusinessCategoriesModalVisible(false);
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


  const [activeTab, setActiveTab] = useState('trending');
  const [selectedCategory, setSelectedCategory] = useState<'business' | 'general'>('business');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const [greetingCategories, setGreetingCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const categoryFadeAnim = useRef(new Animated.Value(1)).current;
  
  // Business categories state
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([]);
  const [businessCategoriesLoading, setBusinessCategoriesLoading] = useState(false);
  const [businessCategoryPreviews, setBusinessCategoryPreviews] = useState<Record<string, Template[]>>({});
  // Rotating business categories for button display
  const [rotatingBusinessCategories, setRotatingBusinessCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [currentBusinessCategoryIndex, setCurrentBusinessCategoryIndex] = useState(0);
  const businessCategoryFadeAnim = useRef(new Animated.Value(1)).current;
  // Highlight state for business categories section
  const [isBusinessCategoriesHighlighted, setIsBusinessCategoriesHighlighted] = useState(false);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Greeting categories state
  const [greetingCategoriesList, setGreetingCategoriesList] = useState<Array<{ id: string; name: string; icon: string; color?: string; imageUrl?: string }>>([]);
  const [greetingCategoriesLoading, setGreetingCategoriesLoading] = useState(false);
  const [greetingCategoryImages, setGreetingCategoryImages] = useState<Record<string, string>>({});
  const memoizedGreetingCategoryImages = useMemo(() => greetingCategoryImages, [greetingCategoryImages]);
  
  // Filter greeting categories to only show those with images
  const filteredGreetingCategoriesList = useMemo(() => {
    return greetingCategoriesList.filter(category => {
      // Check if category has an image in greetingCategoryImages
      const hasMemoizedImage = Boolean(memoizedGreetingCategoryImages[category.id]);
      // Check if category has an inline imageUrl
      const hasInlineImage = Boolean(category.imageUrl);
      // Only include categories that have at least one image
      return hasMemoizedImage || hasInlineImage;
    });
  }, [greetingCategoriesList, memoizedGreetingCategoryImages]);
  
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
  const greetingModalPrefetchInProgressRef = useRef(false);
  const businessCategoriesLoadedRef = useRef(false);

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
  const [banners, setBanners] = useState<Banner[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(0);
  const [disableBackgroundUpdates, setDisableBackgroundUpdates] = useState(false);
  const [isUpcomingEventsModalVisible, setIsUpcomingEventsModalVisible] = useState(false);
  const [isBusinessCategoriesModalVisible, setIsBusinessCategoriesModalVisible] = useState(false);
  const [isVideosModalVisible, setIsVideosModalVisible] = useState(false);
  const [showVideoComingSoonModal, setShowVideoComingSoonModal] = useState(false);
  const [isCustomerSupportModalVisible, setIsCustomerSupportModalVisible] = useState(false);
  
  // Greeting section modal states
  const [isMotivationModalVisible, setIsMotivationModalVisible] = useState(false);
  const [isGoodMorningModalVisible, setIsGoodMorningModalVisible] = useState(false);
  const [isBusinessEthicsModalVisible, setIsBusinessEthicsModalVisible] = useState(false);
  const [isDevotionalModalVisible, setIsDevotionalModalVisible] = useState(false);
  const [isLeaderQuotesModalVisible, setIsLeaderQuotesModalVisible] = useState(false);
  const [isAtmanirbharBharatModalVisible, setIsAtmanirbharBharatModalVisible] = useState(false);
  const [isGoodThoughtsModalVisible, setIsGoodThoughtsModalVisible] = useState(false);
  const [isTrendingModalVisible, setIsTrendingModalVisible] = useState(false);
  const [isBhagvatGitaModalVisible, setIsBhagvatGitaModalVisible] = useState(false);
  const [isBooksModalVisible, setIsBooksModalVisible] = useState(false);
  const [isCelebratesMomentsModalVisible, setIsCelebratesMomentsModalVisible] = useState(false);
  const [isFeaturedContentModalVisible, setIsFeaturedContentModalVisible] = useState(false);
  const [isGeneralCategoriesModalVisible, setIsGeneralCategoriesModalVisible] = useState(false);

  // New API data states
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [professionalTemplates, setProfessionalTemplates] = useState<ProfessionalTemplate[]>([]);
  const [videoContent, setVideoContent] = useState<VideoContent[]>([]);
  const [calendarPosters, setCalendarPosters] = useState<Template[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Greeting sections data states
  const [motivationTemplates, setMotivationTemplates] = useState<any[]>([]);
  const [motivationTemplatesRaw, setMotivationTemplatesRaw] = useState<any[]>([]);
  const [goodMorningTemplates, setGoodMorningTemplates] = useState<any[]>([]);
  const [goodMorningTemplatesRaw, setGoodMorningTemplatesRaw] = useState<any[]>([]);
  const [businessEthicsTemplates, setBusinessEthicsTemplates] = useState<any[]>([]);
  const [businessEthicsTemplatesRaw, setBusinessEthicsTemplatesRaw] = useState<any[]>([]);
  const [devotionalTemplates, setDevotionalTemplates] = useState<any[]>([]);
  const [devotionalTemplatesRaw, setDevotionalTemplatesRaw] = useState<any[]>([]);
  const [leaderQuotesTemplates, setLeaderQuotesTemplates] = useState<any[]>([]);
  const [leaderQuotesTemplatesRaw, setLeaderQuotesTemplatesRaw] = useState<any[]>([]);
  const [atmanirbharBharatTemplates, setAtmanirbharBharatTemplates] = useState<any[]>([]);
  const [atmanirbharBharatTemplatesRaw, setAtmanirbharBharatTemplatesRaw] = useState<any[]>([]);
  const [goodThoughtsTemplates, setGoodThoughtsTemplates] = useState<any[]>([]);
  const [goodThoughtsTemplatesRaw, setGoodThoughtsTemplatesRaw] = useState<any[]>([]);
  const [trendingTemplates, setTrendingTemplates] = useState<any[]>([]);
  const [trendingTemplatesRaw, setTrendingTemplatesRaw] = useState<any[]>([]);
  const [bhagvatGitaTemplates, setBhagvatGitaTemplates] = useState<any[]>([]);
  const [bhagvatGitaTemplatesRaw, setBhagvatGitaTemplatesRaw] = useState<any[]>([]);
  const [booksTemplates, setBooksTemplates] = useState<any[]>([]);
  const [booksTemplatesRaw, setBooksTemplatesRaw] = useState<any[]>([]);
  const [celebratesMomentsTemplates, setCelebratesMomentsTemplates] = useState<any[]>([]);
  const [celebratesMomentsTemplatesRaw, setCelebratesMomentsTemplatesRaw] = useState<any[]>([]);
  
  // Load data from APIs with caching for instant loads and request deduplication
  const loadApiData = useCallback(async (isRefresh: boolean = false) => {
    return performanceMonitor.measureAsync('loadApiData', async () => {
      setApiLoading(true);
      setApiError(null);
      
      try {
        if (__DEV__) {
        }
        
        // Track success count for error handling
        let totalMainRequests = 4;
        const networkErrors: string[] = [];
        
        // Load all 4 APIs in parallel with progressive state updates
        // Update UI as each API completes instead of waiting for all
        // Reduced initial limits for faster loading - can load more on demand
        const apiPromises = [
          requestDeduplication.deduplicate(
            RequestDeduplication.generateKey('featuredContent', { limit: 10 }),
            () => homeApi.getFeaturedContent({ limit: 10 })
          ).then(response => {
            // Update featured content immediately when ready
            if (response.success) {
              React.startTransition(() => {
                setFeaturedContent(response.data);
                const convertedBanners: Banner[] = response.data.map(item => ({
                  id: item.id,
                  title: item.title,
                  imageUrl: item.imageUrl,
                  link: item.link,
                }));
                setBanners(convertedBanners);
              });
            } else {
              React.startTransition(() => {
                setFeaturedContent([]);
                setBanners([]);
              });
            }
            return { type: 'featured', response, success: response.success };
          }).catch(err => {
            if (err?.message === 'NETWORK_ERROR' || err?.message === 'TIMEOUT') {
              networkErrors.push('featured');
            }
            React.startTransition(() => {
              setFeaturedContent([]);
              setBanners([]);
            });
            return { type: 'featured', response: null, success: false };
          }),
          
          requestDeduplication.deduplicate(
            RequestDeduplication.generateKey('upcomingEvents', { limit: 50 }),
            () => homeApi.getUpcomingEvents({ limit: 50 })
          ).then(response => {
            // Update events immediately when ready
            if (response.success) {
              React.startTransition(() => {
                setUpcomingEvents(response.data);
              });
            } else {
              React.startTransition(() => {
                setUpcomingEvents([]);
              });
            }
            return { type: 'events', response, success: response.success };
          }).catch(err => {
            if (err?.message === 'NETWORK_ERROR' || err?.message === 'TIMEOUT') {
              networkErrors.push('events');
            }
            React.startTransition(() => {
              setUpcomingEvents([]);
            });
            return { type: 'events', response: null, success: false };
          }),
          
          requestDeduplication.deduplicate(
            RequestDeduplication.generateKey('professionalTemplates', { limit: 50 }),
            () => homeApi.getProfessionalTemplates({ limit: 50 })
          ).then(response => {
            // Update templates immediately when ready
            if (response.success) {
              React.startTransition(() => {
                setProfessionalTemplates(response.data);
                if (!disableBackgroundUpdates) {
                  setTemplates(response.data);
                }
              });
            } else {
              React.startTransition(() => {
                setProfessionalTemplates([]);
                if (!disableBackgroundUpdates) {
                  setTemplates([]);
                }
              });
            }
            return { type: 'templates', response, success: response.success };
          }).catch(err => {
            if (err?.message === 'NETWORK_ERROR' || err?.message === 'TIMEOUT') {
              networkErrors.push('templates');
            }
            React.startTransition(() => {
              setProfessionalTemplates([]);
              if (!disableBackgroundUpdates) {
                setTemplates([]);
              }
            });
            return { type: 'templates', response: null, success: false };
          }),
          
          requestDeduplication.deduplicate(
            RequestDeduplication.generateKey('videoContent', { limit: 20 }),
            () => homeApi.getVideoContent({ limit: 20 })
          ).then(response => {
            // Update videos immediately when ready
            if (response.success) {
              React.startTransition(() => {
                setVideoContent(response.data);
              });
            } else {
              React.startTransition(() => {
                setVideoContent([]);
              });
            }
            return { type: 'videos', response, success: response.success };
          }).catch(err => {
            if (err?.message === 'NETWORK_ERROR' || err?.message === 'TIMEOUT') {
              networkErrors.push('videos');
            }
            React.startTransition(() => {
              setVideoContent([]);
            });
            return { type: 'videos', response: null, success: false };
          }),
        ];

        // Wait for all APIs but UI updates progressively as each completes
        const results = await Promise.allSettled(apiPromises);
        
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
          setApiError('Network connection issue. Please check your internet and try again.');
        } else {
          // Some network errors, some other errors - still show network issue
          setApiError('Network connection issue. Please check your internet and try again.');
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

      // Load greeting sections lazily in background (don't block main content)
      // This allows the UI to show main content immediately while greeting sections load
      InteractionManager.runAfterInteractions(() => {
        Promise.allSettled([
          greetingTemplatesService.searchTemplates('motivational').catch(() => []),
          greetingTemplatesService.searchTemplates('good morning').catch(() => []),
          greetingTemplatesService.searchTemplates('business ethics').catch(() => []),
          greetingTemplatesService.searchTemplates('devotional').catch(() => []),
          greetingTemplatesService.searchTemplates('leader quotes').catch(() => []),
          greetingTemplatesService.searchTemplates('atmanirbhar bharat').catch(() => []),
          greetingTemplatesService.searchTemplates('good thoughts').catch(() => []),
          greetingTemplatesService.searchTemplates('trending').catch(() => []),
          greetingTemplatesService.searchTemplates('bhagvat gita').catch(() => []),
          greetingTemplatesService.searchTemplates('books').catch(() => []),
          greetingTemplatesService.searchTemplates('celebrates the moments').catch(() => [])
        ]).then(([
          motivationResponse,
          goodMorningResponse,
          businessEthicsResponse,
          devotionalResponse,
          leaderQuotesResponse,
          atmanirbharResponse,
          goodThoughtsResponse,
          trendingResponse,
          bhagvatGitaResponse,
          booksResponse,
          celebratesResponse
        ]) => {
          // Handle greeting sections responses - Batch state updates for better performance
          const greetingUpdates = {
            motivation: motivationResponse.status === 'fulfilled' && motivationResponse.value.length > 0
              ? { display: motivationResponse.value.slice(0, 10), raw: motivationResponse.value }
              : { display: [], raw: [] },
            goodMorning: goodMorningResponse.status === 'fulfilled' && goodMorningResponse.value.length > 0
              ? { display: goodMorningResponse.value.slice(0, 10), raw: goodMorningResponse.value }
              : { display: [], raw: [] },
            businessEthics: businessEthicsResponse.status === 'fulfilled' && businessEthicsResponse.value.length > 0
              ? { display: businessEthicsResponse.value.slice(0, 10), raw: businessEthicsResponse.value }
              : { display: [], raw: [] },
            devotional: devotionalResponse.status === 'fulfilled' && devotionalResponse.value.length > 0
              ? { display: devotionalResponse.value.slice(0, 10), raw: devotionalResponse.value }
              : { display: [], raw: [] },
            leaderQuotes: leaderQuotesResponse.status === 'fulfilled' && leaderQuotesResponse.value.length > 0
              ? { display: leaderQuotesResponse.value.slice(0, 10), raw: leaderQuotesResponse.value }
              : { display: [], raw: [] },
            atmanirbharBharat: atmanirbharResponse.status === 'fulfilled' && atmanirbharResponse.value.length > 0
              ? { display: atmanirbharResponse.value.slice(0, 10), raw: atmanirbharResponse.value }
              : { display: [], raw: [] },
            goodThoughts: goodThoughtsResponse.status === 'fulfilled' && goodThoughtsResponse.value.length > 0
              ? { display: goodThoughtsResponse.value.slice(0, 10), raw: goodThoughtsResponse.value }
              : { display: [], raw: [] },
            trending: trendingResponse.status === 'fulfilled' && trendingResponse.value.length > 0
              ? { display: trendingResponse.value.slice(0, 10), raw: trendingResponse.value }
              : { display: [], raw: [] },
            bhagvatGita: bhagvatGitaResponse.status === 'fulfilled' && bhagvatGitaResponse.value.length > 0
              ? { display: bhagvatGitaResponse.value.slice(0, 10), raw: bhagvatGitaResponse.value }
              : { display: [], raw: [] },
            books: booksResponse.status === 'fulfilled' && booksResponse.value.length > 0
              ? { display: booksResponse.value.slice(0, 10), raw: booksResponse.value }
              : { display: [], raw: [] },
            celebratesMoments: celebratesResponse.status === 'fulfilled' && celebratesResponse.value.length > 0
              ? { display: celebratesResponse.value.slice(0, 10), raw: celebratesResponse.value }
              : { display: [], raw: [] },
          };

          // Batch all state updates together using React.startTransition for non-urgent updates
          React.startTransition(() => {
            setMotivationTemplates(greetingUpdates.motivation.display);
            setMotivationTemplatesRaw(greetingUpdates.motivation.raw);
            setGoodMorningTemplates(greetingUpdates.goodMorning.display);
            setGoodMorningTemplatesRaw(greetingUpdates.goodMorning.raw);
            setBusinessEthicsTemplates(greetingUpdates.businessEthics.display);
            setBusinessEthicsTemplatesRaw(greetingUpdates.businessEthics.raw);
            setDevotionalTemplates(greetingUpdates.devotional.display);
            setDevotionalTemplatesRaw(greetingUpdates.devotional.raw);
            setLeaderQuotesTemplates(greetingUpdates.leaderQuotes.display);
            setLeaderQuotesTemplatesRaw(greetingUpdates.leaderQuotes.raw);
            setAtmanirbharBharatTemplates(greetingUpdates.atmanirbharBharat.display);
            setAtmanirbharBharatTemplatesRaw(greetingUpdates.atmanirbharBharat.raw);
            setGoodThoughtsTemplates(greetingUpdates.goodThoughts.display);
            setGoodThoughtsTemplatesRaw(greetingUpdates.goodThoughts.raw);
            setTrendingTemplates(greetingUpdates.trending.display);
            setTrendingTemplatesRaw(greetingUpdates.trending.raw);
            setBhagvatGitaTemplates(greetingUpdates.bhagvatGita.display);
            setBhagvatGitaTemplatesRaw(greetingUpdates.bhagvatGita.raw);
            setBooksTemplates(greetingUpdates.books.display);
            setBooksTemplatesRaw(greetingUpdates.books.raw);
            setCelebratesMomentsTemplates(greetingUpdates.celebratesMoments.display);
            setCelebratesMomentsTemplatesRaw(greetingUpdates.celebratesMoments.raw);
          });
        }).catch((error) => {
          if (__DEV__) {
            devError('Error loading greeting sections:', error);
          }
        });
      }); // Load greeting sections after main interactions complete

    } catch (error) {
      // Only catch unexpected errors (like state setting errors or promise.allSettled issues)
      // Expected API errors are already handled above
      if (__DEV__) {
        devError('Unexpected error loading API data:', error);
      }
      // Don't set apiError here unless it's a truly unexpected error
      // Most errors should be handled by Promise.allSettled above
    } finally {
      setApiLoading(false);
    }
    });
  }, []);

  // Load calendar posters for upcoming dates
  const loadCalendarPosters = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Fetch posters for next 15 days (same as calendar component)
      const datePromises: Promise<Template[]>[] = [];
      for (let i = 0; i <= 15; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        datePromises.push(
          calendarApi.getPostersByDate(dateString)
            .then(response => {
              if (response.success && response.data.posters.length > 0) {
                // Convert CalendarPoster to Template format
                return response.data.posters.map((poster: CalendarPoster) => ({
                  id: poster.id,
                  name: poster.name || poster.title || 'Calendar Poster',
                  thumbnail: poster.thumbnail || poster.imageUrl || '',
                  category: poster.category || 'Festival',
                  downloads: poster.downloads || 0,
                  isDownloaded: poster.isDownloaded || false,
                  tags: poster.tags || [],
                  description: poster.description || '',
                  date: poster.date,
                  festivalName: poster.festivalName,
                }));
              }
              return [];
            })
            .catch(() => [])
        );
      }
      
      const results = await Promise.all(datePromises);
      const allCalendarPosters = results.flat();
      
      // Remove duplicates based on id
      const uniquePosters = Array.from(
        new Map(allCalendarPosters.map(poster => [poster.id, poster])).values()
      );
      
      setCalendarPosters(uniquePosters);
    } catch (error) {
      if (__DEV__) {
        devError('Error loading calendar posters:', error);
      }
    }
  }, []);

  // Load API data once on component mount only (with ref guard to prevent duplicates)
  useEffect(() => {
    // Prevent duplicate calls even in React Strict Mode
    if (apiDataLoadedRef.current) {
      return;
    }
    apiDataLoadedRef.current = true;
    
    let isMounted = true;
    
    const loadInitialData = async () => {

      try {
        // Load data from APIs only - no mock data
        if (isMounted) {
          await loadApiData();
          // Load calendar posters in parallel
          await loadCalendarPosters();
        }
      } catch (error) {
        if (__DEV__) {
        }
      }
    };
    
    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, [loadApiData, loadCalendarPosters]); // Include loadCalendarPosters in dependencies

  // Load greeting categories - consolidated with greetingCategoriesList loading below


  const fetchBusinessCategoryPreviewImages = useCallback(async (categories: BusinessCategory[]) => {
    if (!categories || categories.length === 0) {
      return;
    }

    try {
      const imageEntries = await Promise.all(
        categories.map(async category => {
          try {
            const response = await businessCategoryPostersApi.getPostersByCategory(category.name, 6);
            const posters = response.data?.posters || [];
            const templates = posters
              .map((poster: any) => convertBusinessPosterToTemplate(poster, category.name))
              .filter((template: Template) => !!template.thumbnail)
              .slice(0, 6);
            if (templates.length > 0) {
              return [category.id, templates] as const;
            }
          } catch (error) {
            if (__DEV__) {
              devWarn(`⚠️ Failed to fetch preview for category ${category.name}:`, error);
            }
          }
          return [category.id, undefined] as const;
        })
      );

      const nextPreviews: Record<string, Template[]> = {};
      imageEntries.forEach(([categoryId, templates]) => {
        if (templates && templates.length > 0) {
          nextPreviews[categoryId] = templates;
        }
      });

      setBusinessCategoryPreviews(prev => ({ ...prev, ...nextPreviews }));
    } catch (error) {
      if (__DEV__) {
        devError('Error fetching business category preview images:', error);
      }
    }
  }, []);

  const fetchGreetingCategoryPreviewImages = useCallback(async (categories: Array<{ id: string; name: string; icon?: string; imageUrl?: string }>) => {
    if (!categories || categories.length === 0) {
      return;
    }

    try {
      const imageEntries = await Promise.all(
        categories.map(async category => {
          try {
            // Use searchTemplates to search by category name in tags
            // This ensures we get templates that have the category name in their tags
            const templates = await greetingTemplatesService.searchTemplates(category.name);
            
            // Filter to find templates that have the category name in their tags
            // The search already filters by tags, but we'll verify the match
            const matchingTemplate = templates.find(template => {
              // Access tags from the template (tags may not be in interface but exist in API response)
              const templateAny = template as any;
              const templateTags = Array.isArray(templateAny.tags) ? templateAny.tags : [];
              
              // Check if any tag contains the category name (case-insensitive)
              const tagMatch = templateTags.some((tag: string) => 
                typeof tag === 'string' && tag.toLowerCase().includes(category.name.toLowerCase())
              );
              
              // Also check if category name matches
              const categoryMatch = template.category?.toLowerCase().includes(category.name.toLowerCase());
              
              return tagMatch || categoryMatch;
            });
            
            // Use the matching template or fall back to first result (search already filters by tags)
            const selectedTemplate = matchingTemplate || templates?.[0];
            const previewUrl = selectedTemplate?.thumbnail || selectedTemplate?.content?.background;
            
            if (previewUrl) {
              if (__DEV__) {
                const templateAny = selectedTemplate as any;
              }
              return [category.id, previewUrl] as const;
            }
          } catch (error) {
            if (__DEV__) {
              devWarn(`⚠️ Failed to fetch preview for greeting category ${category.name}:`, error);
            }
          }
          return [category.id, category.imageUrl] as const;
        })
      );

      const nextImages: Record<string, string> = {};
      imageEntries.forEach(([categoryId, imageUrl]) => {
        if (imageUrl) {
          nextImages[categoryId] = imageUrl;
        }
      });

      setGreetingCategoryImages(prev => ({ ...prev, ...nextImages }));
    } catch (error) {
      if (__DEV__) {
        devError('Error fetching greeting category preview images:', error);
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
            imageUrl: (category as any).imageUrl || (category as any).image || (category as any).thumbnail || ''
          }));

          // Set both states from single API call
          setGreetingCategoriesList(mappedCategories);
          setGreetingCategories(mappedCategories.map(({ id, name, icon }) => ({ id, name, icon }))); // Also set for rotating categories
          fetchGreetingCategoryPreviewImages(mappedCategories);
          
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
    fetchGreetingCategoryPreviewImages(missingCategories)
      .catch(error => {
        if (__DEV__) {
          devWarn('⚠️ [GENERAL CATEGORIES MODAL] Failed to preload thumbnails:', error);
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
    // Prevent duplicate calls even in React Strict Mode
    if (businessCategoriesLoadedRef.current) {
      return;
    }
    businessCategoriesLoadedRef.current = true;
    
    let isMounted = true;
    
    const loadBusinessCategories = async () => {
      setBusinessCategoriesLoading(true);
      try {
        const response = await businessCategoriesService.getBusinessCategories();
        if (isMounted && response && response.success) {
          // Get all categories from response (for rotation)
          // Handle both response structures: response.categories or response.data?.categories
          const allCategories = response.categories || (response as any).data?.categories || [];
          
          if (!allCategories || allCategories.length === 0) {
            if (__DEV__) {
              devWarn('⚠️ [BUSINESS CATEGORIES] No categories in response:', response);
            }
            return;
          }
          
          // Get current user's business category
          const currentUser = authService.getCurrentUser();
          const userCategory = currentUser?.category || currentUser?._originalCategory || '';
          
          // Filter out user's own business category (for section display only)
          const filteredCategories = allCategories.filter((category: BusinessCategory) => {
            const categoryName = category.name?.trim() || '';
            const userCategoryName = userCategory?.trim() || '';
            // Compare both name and ID to ensure we filter correctly
            return categoryName.toLowerCase() !== userCategoryName.toLowerCase() &&
                   category.id !== userCategory;
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
            if (__DEV__) {
            }
          } else {
            if (__DEV__) {
              devWarn('⚠️ [ROTATING BUSINESS CATEGORIES] No valid categories found');
            }
          }
          
          fetchBusinessCategoryPreviewImages(filteredCategories);
          
          if (__DEV__) {
          }
        } else {
          if (__DEV__) {
            devWarn('⚠️ [BUSINESS CATEGORIES] No categories in API response');
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
  }, []); // Empty dependency array - only run once on mount (fetchBusinessCategoryPreviewImages is stable)

  // Rotate categories every 3 seconds - optimized for immediate rendering
  useEffect(() => {
    if (greetingCategories.length === 0) return;
    
    // Start rotation immediately when categories are available
    const interval = setInterval(() => {
      animateCategoryChange();
      setCurrentCategoryIndex((prevIndex) => (prevIndex + 1) % greetingCategories.length);
    }, 3000); // Change every 3 seconds
    
    return () => clearInterval(interval);
  }, [greetingCategories, animateCategoryChange]);

  // Rotate business categories every 3 seconds - optimized for immediate rendering
  useEffect(() => {
    if (rotatingBusinessCategories.length === 0) return;
    
    // Start rotation immediately when categories are available
    const interval = setInterval(() => {
      animateBusinessCategoryChange();
      setCurrentBusinessCategoryIndex((prevIndex) => (prevIndex + 1) % rotatingBusinessCategories.length);
    }, 3000); // Change every 3 seconds
    
    return () => clearInterval(interval);
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
      motivationTemplatesRaw.length,
      goodMorningTemplatesRaw.length,
      businessEthicsTemplatesRaw.length,
      devotionalTemplatesRaw.length,
      leaderQuotesTemplatesRaw.length,
      atmanirbharBharatTemplatesRaw.length,
      goodThoughtsTemplatesRaw.length,
      trendingTemplatesRaw.length,
      bhagvatGitaTemplatesRaw.length,
      booksTemplatesRaw.length,
      celebratesMomentsTemplatesRaw.length,
    ].join(',');
    
    // If lengths haven't changed, return cached result (optimization)
    if (greetingTemplatesCacheRef.current.lengthsSignature === currentLengthsSignature && 
        greetingTemplatesCacheRef.current.templates.length > 0) {
      return greetingTemplatesCacheRef.current.templates;
    }
    
    const all: any[] = [];
    
    // Collect from all greeting sections (use Raw arrays for complete data)
    if (motivationTemplatesRaw.length > 0) all.push(...motivationTemplatesRaw);
    if (goodMorningTemplatesRaw.length > 0) all.push(...goodMorningTemplatesRaw);
    if (businessEthicsTemplatesRaw.length > 0) all.push(...businessEthicsTemplatesRaw);
    if (devotionalTemplatesRaw.length > 0) all.push(...devotionalTemplatesRaw);
    if (leaderQuotesTemplatesRaw.length > 0) all.push(...leaderQuotesTemplatesRaw);
    if (atmanirbharBharatTemplatesRaw.length > 0) all.push(...atmanirbharBharatTemplatesRaw);
    if (goodThoughtsTemplatesRaw.length > 0) all.push(...goodThoughtsTemplatesRaw);
    if (trendingTemplatesRaw.length > 0) all.push(...trendingTemplatesRaw);
    if (bhagvatGitaTemplatesRaw.length > 0) all.push(...bhagvatGitaTemplatesRaw);
    if (booksTemplatesRaw.length > 0) all.push(...booksTemplatesRaw);
    if (celebratesMomentsTemplatesRaw.length > 0) all.push(...celebratesMomentsTemplatesRaw);
    
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
    
    // Debug: Log Good Morning templates structure (dev only)
    if (__DEV__ && goodMorningTemplatesRaw.length > 0) {
    }
    
    return converted;
  }, [
    motivationTemplatesRaw,
    goodMorningTemplatesRaw,
    businessEthicsTemplatesRaw,
    devotionalTemplatesRaw,
    leaderQuotesTemplatesRaw,
    atmanirbharBharatTemplatesRaw,
    goodThoughtsTemplatesRaw,
    trendingTemplatesRaw,
    bhagvatGitaTemplatesRaw,
    booksTemplatesRaw,
    celebratesMomentsTemplatesRaw,
  ]);

  // Debounced search handler - triggers search after user stops typing
  useEffect(() => {
    // If search query is empty, reset immediately (no debounce delay)
    if (searchQuery.trim() === '') {
      setTemplates(professionalTemplates);
      setIsSearching(false);
      setDisableBackgroundUpdates(false);
      return;
    }

    // For non-empty queries, apply debounce delay
    const timeoutId = setTimeout(() => {
      // Double-check query is still not empty (user might have cleared it during debounce)
      if (searchQuery.trim() === '') {
        setTemplates(professionalTemplates);
        setIsSearching(false);
        setDisableBackgroundUpdates(false);
        return;
      }

      // Trigger search after debounce delay
      const requestId = currentRequestId + 1;
      setCurrentRequestId(requestId);
      setIsSearching(true);
      setDisableBackgroundUpdates(true);
      
      // Combine professional templates, greeting templates, and calendar posters for unified search
      const allTemplates = [...professionalTemplates, ...allGreetingTemplates, ...calendarPosters];
      
      if (__DEV__) {
      }
      
      // Use local search immediately for better performance
      // Search in name, category, description, and tags
      const searchLower = searchQuery.toLowerCase();
      const filtered = allTemplates.filter(template => {
        // Search in name
        if (template.name?.toLowerCase().includes(searchLower)) return true;
        
        // Search in category
        if (template.category?.toLowerCase().includes(searchLower)) return true;
        
        // Search in description
        if (template.description?.toLowerCase().includes(searchLower)) return true;
        
        // Search in tags array (including calendar posters tags)
        if (template.tags && Array.isArray(template.tags)) {
          const tagMatch = template.tags.some((tag: string) => 
            tag?.toLowerCase().includes(searchLower)
          );
          if (tagMatch) return true;
        }
        
        // Search in festival name for calendar posters
        if ((template as any).festivalName && (template as any).festivalName.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        return false;
      });
      
      if (__DEV__) {
        if (filtered.length > 0) {
        }
      }
      
      setTemplates(filtered);
      
      // Try API search in background for professional templates
      setTimeout(async () => {
        if (currentRequestId !== requestId) return;
        try {
          // Search professional templates via API
          const professionalResults = await dashboardService.searchTemplates(searchQuery);
          
          // Search greeting templates via API
          const greetingResults = await greetingTemplatesService.searchTemplates(searchQuery);
          
          // Convert greeting results to Template format
          const convertedGreetingResults = greetingResults.map(greetingTemplate => ({
            id: greetingTemplate.id,
            name: greetingTemplate.name || '',
            thumbnail: greetingTemplate.thumbnail || '',
            category: greetingTemplate.category || 'Greeting',
            downloads: greetingTemplate.downloads || 0,
            isDownloaded: greetingTemplate.isDownloaded || false,
            description: greetingTemplate.content?.text || '',
            tags: (greetingTemplate as any).tags || [],
            isGreeting: true,
            originalTemplate: greetingTemplate,
          }));
          
          // Combine results
          const combinedResults = [...professionalResults, ...convertedGreetingResults];
          
          if (currentRequestId === requestId) {
            setTemplates(combinedResults);
          }
        } catch (error) {
          if (__DEV__) {
            if (__DEV__) {
            devError('Search error:', error);
          }
          }
        }
      }, 100);
    }, 300); // 300ms debounce delay

    // Cleanup timeout on unmount or when searchQuery changes
    return () => clearTimeout(timeoutId);
  }, [searchQuery, professionalTemplates, allGreetingTemplates, calendarPosters, currentRequestId]);

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
    
    // Use API data for different tabs
    try {
      // Filter business events based on tab
      const filteredTemplates = professionalTemplates.filter(template => {
        if (tab === 'daily') return template.category?.toLowerCase().includes('daily');
        if (tab === 'festival') return template.category?.toLowerCase().includes('festival');
        if (tab === 'special') return template.category?.toLowerCase().includes('special');
        return true; // 'all' tab shows all templates
      });
      setTemplates(filteredTemplates);
    } catch (error) {
      if (__DEV__) {
      }
    }
  }, [professionalTemplates]);

  // Like functionality has been removed - templates no longer have like status
  const applyUserLikeStatus = useCallback(async (templates: Template[]) => {
    return templates;
  }, []);


  const handleDownloadTemplate = useCallback(async (templateId: string) => {
    // Update local state immediately for better UX
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isDownloaded: true, downloads: template.downloads + 1 }
        : template
    ));
    
    // Try API call in background
    setTimeout(async () => {
      try {
        await dashboardService.downloadTemplate(templateId);
      } catch (error) {
        if (__DEV__) {
          devError('Error downloading template:', error);
        }
      }
    }, 100);
  }, []);

  const handleSearch = useCallback(async () => {
    const requestId = currentRequestId + 1;
    setCurrentRequestId(requestId);
    
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setDisableBackgroundUpdates(false); // Re-enable background updates when clearing search
      setTemplates(professionalTemplates);
      
      // Try API call in background
      setTimeout(async () => {
        // Check if this is still the current request
        if (currentRequestId !== requestId) return;
        
        try {
          const templatesData = await dashboardService.getTemplatesByTab(activeTab);
          // Only update if this is still the current request
          if (currentRequestId === requestId) {
            setTemplates(templatesData);
          }
        } catch (error) {
          if (__DEV__) {
            devError('Search reset error:', error);
          }
        }
      }, 100);
      return;
    }
    
    setIsSearching(true);
    setDisableBackgroundUpdates(true); // Disable background updates when searching
    // Use local search immediately for better performance with API data
    const filtered = professionalTemplates.filter(template => 
      template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setTemplates(filtered);
    
    // Try API search in background
    setTimeout(async () => {
      // Check if this is still the current request
      if (currentRequestId !== requestId) return;
      
      try {
        const results = await dashboardService.searchTemplates(searchQuery);
        // Only update if this is still the current request and we're still searching
        if (currentRequestId === requestId && isSearching) {
          setTemplates(results);
        }
      } catch (error) {
        devError('Search error:', error);
      }
    }, 100);
  }, [searchQuery, activeTab, professionalTemplates, currentRequestId, isSearching]);

  // Memoized lookup maps for O(1) access instead of O(n) find operations
const videoContentMap = useMemo(() => {
  const map = new Map();
  videoContent.forEach(video => map.set(video.id, video));
  return map;
}, [videoContent]);

const professionalTemplatesMap = useMemo(() => {
  const map = new Map();
  professionalTemplates.forEach(template => map.set(template.id, template));
  return map;
}, [professionalTemplates]);

// Memoize business category previews to prevent unnecessary re-renders
const memoizedBusinessCategoryPreviews = useMemo(() => {
  return businessCategoryPreviews;
}, [businessCategoryPreviews]);

const handleTemplatePress = useCallback((template: Template | VideoContent | any) => {
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

  // Use O(1) lookup instead of O(n) find
  const matchedPoster = professionalTemplatesMap.get(template.id) || template;
  const related = professionalTemplates.filter(poster => poster.id !== template.id);

  navigation.navigate('PosterPlayer', {
    selectedPoster: matchedPoster as Template,
    relatedPosters: related,
  });
}, [videoContentMap, professionalTemplatesMap, videoContent, professionalTemplates, allGreetingTemplates, navigation, searchQuery]);

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
      userProfileSectionRef.current.measureInWindow((x, y, width, height) => {
        setBusinessProfileDropdownPosition({
          top: y + height + moderateScale(4),
          left: x,
          width,
        });
        setIsBusinessProfileDropdownVisible(true);
      });
    }
  }, [userBusinessProfiles.length, isBusinessProfileDropdownVisible, closeBusinessProfileDropdown]);

  const handleBusinessProfileSelect = useCallback((profileId: string) => {
    setSelectedBusinessProfileId(profileId);
    closeBusinessProfileDropdown();
    businessCategoryPostersApi.clearCache();
  }, [closeBusinessProfileDropdown]);

  const handleWhatsAppPress = useCallback(async () => {
    try {
      const phoneNumber = '918551941415'; // Phone number without + sign for WhatsApp (8551941415 with country code 91)
      const message = 'Hello, I need support';
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
        setDisableBackgroundUpdates(false);
        setTemplates(professionalTemplates);
        return false;
      }
    });
  }, [professionalTemplates]);

  const handleViewAllUpcomingEvents = useCallback(() => {
    setIsUpcomingEventsModalVisible(true);
  }, []);

  const closeUpcomingEventsModal = useCallback(() => {
    setIsUpcomingEventsModalVisible(false);
  }, []);


  const handleViewAllVideos = useCallback(() => {
    setIsVideosModalVisible(true);
  }, []);

  const closeVideosModal = useCallback(() => {
    setIsVideosModalVisible(false);
  }, []);

  // Greeting section modal handlers
  const handleViewAllMotivation = useCallback(() => {
    setIsMotivationModalVisible(true);
  }, []);

  const closeMotivationModal = useCallback(() => {
    setIsMotivationModalVisible(false);
  }, []);

  const handleViewAllGoodMorning = useCallback(() => {
    setIsGoodMorningModalVisible(true);
  }, []);

  const closeGoodMorningModal = useCallback(() => {
    setIsGoodMorningModalVisible(false);
  }, []);

  const handleViewAllBusinessEthics = useCallback(() => {
    setIsBusinessEthicsModalVisible(true);
  }, []);

  const closeBusinessEthicsModal = useCallback(() => {
    setIsBusinessEthicsModalVisible(false);
  }, []);

  const handleViewAllDevotional = useCallback(() => {
    setIsDevotionalModalVisible(true);
  }, []);

  const closeDevotionalModal = useCallback(() => {
    setIsDevotionalModalVisible(false);
  }, []);

  const handleViewAllLeaderQuotes = useCallback(() => {
    setIsLeaderQuotesModalVisible(true);
  }, []);

  const closeLeaderQuotesModal = useCallback(() => {
    setIsLeaderQuotesModalVisible(false);
  }, []);

  const handleViewAllAtmanirbharBharat = useCallback(() => {
    setIsAtmanirbharBharatModalVisible(true);
  }, []);

  const closeAtmanirbharBharatModal = useCallback(() => {
    setIsAtmanirbharBharatModalVisible(false);
  }, []);

  const handleViewAllGoodThoughts = useCallback(() => {
    setIsGoodThoughtsModalVisible(true);
  }, []);

  const closeGoodThoughtsModal = useCallback(() => {
    setIsGoodThoughtsModalVisible(false);
  }, []);

  const handleViewAllTrending = useCallback(() => {
    setIsTrendingModalVisible(true);
  }, []);

  const closeTrendingModal = useCallback(() => {
    setIsTrendingModalVisible(false);
  }, []);

  const handleViewAllBhagvatGita = useCallback(() => {
    setIsBhagvatGitaModalVisible(true);
  }, []);

  const closeBhagvatGitaModal = useCallback(() => {
    setIsBhagvatGitaModalVisible(false);
  }, []);

  const handleViewAllBooks = useCallback(() => {
    setIsBooksModalVisible(true);
  }, []);

  const closeBooksModal = useCallback(() => {
    setIsBooksModalVisible(false);
  }, []);

  const handleViewAllCelebratesMoments = useCallback(() => {
    setIsCelebratesMomentsModalVisible(true);
  }, []);

  const closeCelebratesMomentsModal = useCallback(() => {
    setIsCelebratesMomentsModalVisible(false);
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
    // Convert featured content to Template format for navigation
    const convertFeaturedContentToTemplate = (featured: FeaturedContent): Template => ({
      id: featured.id,
      name: featured.title,
      thumbnail: featured.imageUrl,
      category: featured.type || 'Featured Content',
      downloads: 0,
      isDownloaded: false,
      tags: [],
    });

    const handleBannerPress = () => {
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
            uri={item.imageUrl} 
            style={styles.bannerImage}
            resizeMode="cover"
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

                                       

  const renderTemplate = useCallback(({ item }: { item: Template }) => {
    return (
      <TemplateCard
        item={item}
        cardWidth={cardWidth}
        theme={theme}
        onPress={handleTemplatePress}
      />
    );
  }, [handleTemplatePress, theme, cardWidth]);


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

  const featuredCarouselItemWidth = useMemo(() => screenWidth - moderateScale(40), [screenWidth]);
  const featuredCarouselSnapInterval = useMemo(() => featuredCarouselItemWidth + moderateScale(10), [featuredCarouselItemWidth]);

  // Memoized key extractors
  const keyExtractor = useCallback((item: any) => item.id, []);

  // Factory function to create category-specific render functions for greeting cards
  const createGreetingCardRenderer = useCallback((categoryTemplates: any[], searchQuery?: string, onCardPress?: (template: any) => void) => {
    return ({ item }: { item: any }) => {
      return (
        <GreetingCard
          item={item}
          cardWidth={cardWidth}
          theme={theme}
          categoryTemplates={categoryTemplates}
          searchQuery={searchQuery}
          navigation={navigation}
          onCardPress={onCardPress}
        />
      );
    };
  }, [navigation, theme, cardWidth]);



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
      featuredCarouselRef.current?.scrollToOffset({
        offset: info.index * featuredCarouselSnapInterval,
        animated: true,
      });
    });
  }, [featuredCarouselSnapInterval]);

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
    // Use the same calculation method as onScroll for consistency
    const calculatedIndex = scrollOffset / featuredCarouselSnapInterval;
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
  }, [featuredCarouselSnapInterval, featuredContent.length]);

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

  const getFeaturedCarouselItemLayout = useCallback((_: any, index: number) => ({
    length: featuredCarouselSnapInterval,
    offset: featuredCarouselSnapInterval * index,
    index,
  }), [featuredCarouselSnapInterval]);

  const renderFeaturedCarouselItem = useCallback(({ item }: { item: FeaturedContent }) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.85}
      style={[styles.featuredCarouselCard, { width: featuredCarouselItemWidth }]}
      onPress={() => handleFeaturedCarouselPress(item)}
    >
      <OptimizedImage uri={item.imageUrl} style={styles.featuredCarouselImage} resizeMode="cover" />
    </TouchableOpacity>
  ), [handleFeaturedCarouselPress, featuredCarouselItemWidth]);

  const handleBusinessCategoryPress = useCallback(async (category: BusinessCategory) => {
    const cachedTemplates = businessCategoryPreviews[category.id];

    // Navigate immediately if we have cached templates
    if (cachedTemplates && cachedTemplates.length > 0) {
      navigation.navigate('PosterPlayer', {
        selectedPoster: cachedTemplates[0],
        relatedPosters: cachedTemplates.slice(1),
        searchQuery: '',
        templateSource: 'professional',
        businessCategory: category.name,
        posterLimit: 6, // Limit 6 for business categories from HomeScreen
      });
      return;
    }

    // Navigate immediately with loading state, then load data in background
    navigation.navigate('PosterPlayer', {
      selectedPoster: {
        id: 'loading',
        name: category.name,
        thumbnail: '',
        category: category.name,
        downloads: 0,
        isDownloaded: false,
      },
      relatedPosters: [],
      searchQuery: '',
      templateSource: 'professional',
      businessCategory: category.name,
      posterLimit: 6, // Limit 6 for business categories from HomeScreen
    });

    // Load data in background after navigation
    InteractionManager.runAfterInteractions(async () => {
      try {
        const response = await businessCategoryPostersApi.getPostersByCategory(category.name, 6);

        if (response?.success && Array.isArray(response.data?.posters) && response.data.posters.length > 0) {
          const templates = response.data.posters
            .map(poster => convertBusinessPosterToTemplate(poster, category.name))
            .filter(template => template.thumbnail);

          if (templates.length > 0) {
            setBusinessCategoryPreviews(prev => ({
              ...prev,
              [category.id]: templates,
            }));
          }
        }
      } catch (error) {
        if (__DEV__) {
          devError('❌ Error loading category posters:', error);
        }
      }
    });
  }, [businessCategoryPreviews, navigation]);

  // Handler for greeting category press - navigate to PosterPlayerScreen with selected greeting category
  const handleGreetingCategoryPress = useCallback((category: { id: string; name: string }) => {
    navigation.navigate('PosterPlayer', {
      selectedPoster: {
        id: 'loading',
        name: category.name,
        thumbnail: '',
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
                      const profileLogo = profile.logo || profile.companyLogo || profile.banner;
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
                                {profile.category || 'General'}
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
        barStyle="dark-content"
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
            <TouchableOpacity 
              style={styles.userProfileSection}
              activeOpacity={0.7}
              onPress={toggleBusinessProfileDropdown}
              ref={userProfileSectionRef}
            >
              <View style={styles.userAvatarContainer}>
                <View style={[styles.userAvatar, { backgroundColor: theme.colors.primary }]}>
                  {userAvatarUri ? (
                    <OptimizedImage
                      uri={userAvatarUri}
                      style={styles.userAvatarImage}
                      resizeMode="cover"
                      cacheKey="user_avatar"
                    />
                  ) : (
                    <Text style={styles.userAvatarText}>{userInitials}</Text>
                  )}
                </View>
              </View>
              <View style={styles.userInfoContainer}>
                <Text style={[styles.userName, { color: theme.colors.text }]} numberOfLines={1}>
                  {userName}
                </Text>
                {apiError && (
                  <View style={styles.apiStatusIndicator}>
                    <Icon name="wifi-off" size={statusIconSize} color="#ff9800" />
                    <Text style={styles.apiStatusText}>Offline Mode</Text>
                  </View>
                )}
                {userBusinessProfiles.length > 0 && (
                  <TouchableOpacity
                    style={styles.businessProfilePill}
                    onPress={toggleBusinessProfileDropdown}
                    activeOpacity={0.8}
                  >
                    {businessProfilesLoadingState ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <>
                        <Text style={styles.businessProfilePillText} numberOfLines={1}>
                          {selectedBusinessProfile?.name || 'Select business'}
                        </Text>
                        <Icon
                          name={isBusinessProfileDropdownVisible ? 'expand-less' : 'expand-more'}
                          size={moderateScale(14)}
                          color={theme.colors.primary}
                        />
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

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
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                    setDisableBackgroundUpdates(false);
                    setTemplates(professionalTemplates);
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
            <View style={styles.featuredCarouselContainer}>
              <FlatList
                ref={featuredCarouselRef}
                data={featuredContent}
                renderItem={renderFeaturedCarouselItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                snapToAlignment="center"
                snapToInterval={featuredCarouselSnapInterval}
                decelerationRate="fast"
                getItemLayout={getFeaturedCarouselItemLayout}
                onScrollToIndexFailed={handleFeaturedCarouselScrollFailure}
                onScrollBeginDrag={handleFeaturedCarouselScrollBeginDrag}
                onScrollEndDrag={handleFeaturedCarouselScrollEndDrag}
                onMomentumScrollEnd={handleFeaturedCarouselMomentumScrollEnd}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                contentContainerStyle={styles.featuredCarouselList}
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
          {!isSearching && searchQuery.trim() === '' && filteredGreetingCategoriesList.length > 0 && (
            <GeneralCategoriesSection
              greetingCategoriesList={filteredGreetingCategoriesList}
              greetingCategoryImages={memoizedGreetingCategoryImages}
              cardWidth={cardWidth}
              theme={theme}
              getItemLayout={getItemLayout}
              onCategoryPress={handleGreetingCategoryPress}
              onViewAllPress={handleViewAllGeneralCategories}
              renderBrowseAllButton={renderBrowseAllButton}
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


          {/* Upcoming Festivals - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && upcomingEvents.length > 0 && (
            <View style={styles.upcomingEventsSection}>
              <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                Upcoming Festivals
              </Text>
                {renderBrowseAllButton(handleViewAllUpcomingEvents)}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.upcomingEventsList}
                nestedScrollEnabled={true}
              >
                {upcomingEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    activeOpacity={0.8}
                    style={styles.upcomingEventCard}
                    onPress={() => {
                      // Convert upcoming event to template format for navigation
                      const eventTemplate: Template = {
                        id: `event-${event.id}`,
                        name: event.title,
                        thumbnail: event.imageUrl,
                        category: `${event.category} • ${event.date} • ${event.location}`,
                        downloads: 0,
                        isDownloaded: false,
                      };
                      navigation.navigate('PosterPlayer', {
                        selectedPoster: eventTemplate,
                        relatedPosters: professionalTemplates.slice(0, 6),
                      });
                    }}
                  >
                    <View style={styles.upcomingEventImageContainer}>
                      <OptimizedImage 
                        uri={event.imageUrl} 
                        style={styles.upcomingEventImage}
                        resizeMode="cover"
                        fallbackSource={require('../assets/MainLogo/MB.png')}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.upcomingEventOverlay}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Search Results - Shown only when searching */}
          {isSearching && searchQuery.trim() !== '' && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Search Results
                </Text>
              </View>
              {templates.length > 0 ? (
                <FlatList
                  key={`search-results-${templates.length}`}
                  data={templates}
                  renderItem={renderTemplate}
                  keyExtractor={keyExtractor}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={6}
                  windowSize={3}
                  initialNumToRender={6}
                  updateCellsBatchingPeriod={100}
                  getItemLayout={getItemLayout}
                  maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                  contentContainerStyle={styles.horizontalList}
                />
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                    No results found for "{searchQuery}"
                  </Text>
                </View>
              )}
            </View>
          )}

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
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          )}

          {/* Motivation Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && motivationTemplates.length > 0 && (
            <View style={styles.templatesSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                Motivation
              </Text>
              {renderBrowseAllButton(handleViewAllMotivation)}
            </View>
              <FlatList
                data={motivationTemplates}
                renderItem={createGreetingCardRenderer(
                  motivationTemplatesRaw.length > 0 ? motivationTemplatesRaw : motivationTemplates,
                  'motivational'
                )}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
              />
            </View>
          )}

          {/* Good Morning Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && goodMorningTemplates.length > 0 && (
            <View style={styles.templatesSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                Good Morning
              </Text>
              {renderBrowseAllButton(handleViewAllGoodMorning)}
            </View>
              <FlatList
                data={goodMorningTemplates}
                renderItem={createGreetingCardRenderer(
                  goodMorningTemplatesRaw.length > 0 ? goodMorningTemplatesRaw : goodMorningTemplates,
                  'good morning',
                  () => {
                  }
                )}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
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
                renderItem={createGreetingCardRenderer(
                  businessEthicsTemplatesRaw.length > 0 ? businessEthicsTemplatesRaw : businessEthicsTemplates,
                  'business ethics'
                )}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
              />
            </View>
          )}

          {/* Devotional Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && devotionalTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Devotional
                </Text>
                {renderBrowseAllButton(handleViewAllDevotional)}
              </View>
              <FlatList
                data={devotionalTemplates}
                renderItem={createGreetingCardRenderer(
                  devotionalTemplatesRaw.length > 0 ? devotionalTemplatesRaw : devotionalTemplates,
                  'devotional'
                )}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
              />
            </View>
          )}

          {/* Leader Quotes Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && leaderQuotesTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Leader Quotes
                </Text>
                {renderBrowseAllButton(handleViewAllLeaderQuotes)}
              </View>
              <FlatList
                data={leaderQuotesTemplates}
                renderItem={createGreetingCardRenderer(
                  leaderQuotesTemplatesRaw.length > 0 ? leaderQuotesTemplatesRaw : leaderQuotesTemplates,
                  'leader quotes'
                )}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
              />
            </View>
          )}

          {/* Atmanirbhar Bharat Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && atmanirbharBharatTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Atmanirbhar Bharat
                </Text>
                {renderBrowseAllButton(handleViewAllAtmanirbharBharat)}
              </View>
              <FlatList
                data={atmanirbharBharatTemplates}
                renderItem={createGreetingCardRenderer(
                  atmanirbharBharatTemplatesRaw.length > 0 ? atmanirbharBharatTemplatesRaw : atmanirbharBharatTemplates,
                  'atmanirbhar bharat'
                )}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
              />
            </View>
          )}

          {/* Good Thoughts Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && goodThoughtsTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Good Thoughts
                </Text>
                {renderBrowseAllButton(handleViewAllGoodThoughts)}
              </View>
              <FlatList
                data={goodThoughtsTemplates}
                renderItem={createGreetingCardRenderer(
                  goodThoughtsTemplatesRaw.length > 0 ? goodThoughtsTemplatesRaw : goodThoughtsTemplates,
                  'good thoughts'
                )}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
              />
            </View>
          )}

          {/* Trending Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && trendingTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Trending
                </Text>
                {renderBrowseAllButton(handleViewAllTrending)}
              </View>
              <FlatList
                data={trendingTemplates}
                renderItem={createGreetingCardRenderer(
                  trendingTemplatesRaw.length > 0 ? trendingTemplatesRaw : trendingTemplates,
                  'trending'
                )}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
              />
            </View>
          )}

          {/* Bhagvat Gita Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && bhagvatGitaTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Bhagvat Gita
                </Text>
                {renderBrowseAllButton(handleViewAllBhagvatGita)}
              </View>
              <FlatList
                data={bhagvatGitaTemplates}
                renderItem={createGreetingCardRenderer(
                  bhagvatGitaTemplatesRaw.length > 0 ? bhagvatGitaTemplatesRaw : bhagvatGitaTemplates,
                  'bhagvat gita'
                )}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
              />
            </View>
          )}

          {/* Books Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && booksTemplates.length > 0 && (
            <View style={styles.templatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                  Books
                </Text>
                {renderBrowseAllButton(handleViewAllBooks)}
              </View>
              <FlatList
                data={booksTemplates}
                renderItem={createGreetingCardRenderer(
                  booksTemplatesRaw.length > 0 ? booksTemplatesRaw : booksTemplates,
                  'books'
                )}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
              />
            </View>
          )}

          {/* Celebrates the Moments Section - Hidden when searching */}
          {!isSearching && searchQuery.trim() === '' && celebratesMomentsTemplates.length > 0 && (
            <View style={styles.templatesSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
                Celebrates the Moments
              </Text>
              {renderBrowseAllButton(handleViewAllCelebratesMoments)}
            </View>
              <FlatList
                data={celebratesMomentsTemplates}
                renderItem={createGreetingCardRenderer(
                  celebratesMomentsTemplatesRaw.length > 0 ? celebratesMomentsTemplatesRaw : celebratesMomentsTemplates,
                  'celebrates the moments'
                )}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={3}
                initialNumToRender={6}
                updateCellsBatchingPeriod={100}
                getItemLayout={getItemLayout}
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
                 <Text style={styles.closeButtonText}>✕</Text>
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

        {/* Upcoming Festivals Modal */}
        <Modal
          visible={isUpcomingEventsModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeUpcomingEventsModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient
                colors={['#f5f5f5', '#ffffff']}
                style={styles.upcomingEventsModalGradient}
              >
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Upcoming Festivals</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.upcomingEventsCloseButton}
                    onPress={closeUpcomingEventsModal}
                  >
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`upcoming-events-modal-${upcomingEvents.length}`}
                  data={upcomingEvents}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: event, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.upcomingEventModalCard, 
                        { width: modalCardWidth },
                        !isLastInRow && { marginRight: modalCardGap }
                      ]}
                      onPress={() => {
                        // Convert upcoming event to template format for navigation
                        const eventTemplate: Template = {
                          id: `event-${event.id}`,
                          name: event.title,
                          thumbnail: event.imageUrl,
                          category: `${event.category} • ${event.date} • ${event.location}`,
                          downloads: 0,
                          isDownloaded: false,
                        };
                        navigation.navigate('PosterPlayer', {
                          selectedPoster: eventTemplate,
                          relatedPosters: professionalTemplates.slice(0, 6),
                        });
                      }}
                    >
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage 
                          uri={event.imageUrl} 
                          style={styles.upcomingEventModalImage}
                          resizeMode="cover"
                          fallbackSource={require('../assets/MainLogo/MB.png')}
                        />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.8)']}
                          style={styles.upcomingEventModalOverlay}
                        />
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Business Categories Modal */}
        <Modal
          visible={isBusinessCategoriesModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeBusinessCategoriesModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient
                colors={['#f5f5f5', '#ffffff']}
                style={styles.upcomingEventsModalGradient}
              >
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Business Categories</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.upcomingEventsCloseButton}
                    onPress={closeBusinessCategoriesModal}
                  >
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`business-categories-modal-${businessCategories.length}`}
                  data={businessCategories}
                  keyExtractor={(item) => item.id}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item, index }) => {
                    const previewTemplates = businessCategoryPreviews[item.id] || [];
                    const thumbnails = previewTemplates
                      .map(template => template.thumbnail)
                      .filter((uri): uri is string => typeof uri === 'string' && uri.length > 0);
                    
                    // Only use the first image
                    const displayImage = thumbnails[0] || item.imageUrl || item.image || null;
                    const isLastInRow = (index + 1) % modalColumns === 0;

                    return (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                          styles.upcomingEventModalCard, 
                          { width: modalCardWidth },
                          !isLastInRow && { marginRight: modalCardGap }
                        ]}
                        onPress={() => {
                          closeBusinessCategoriesModal();
                          handleBusinessCategoryPress(item);
                        }}
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
                              <Text style={styles.businessCategoryIcon}>{item.icon || item.name?.[0] || 'MB'}</Text>
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
                              {item.name}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
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
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`general-categories-modal-${generalCategoryModalColumns}-${filteredGreetingCategoriesList.length}`}
                  data={filteredGreetingCategoriesList}
                  keyExtractor={(item) => item.id}
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
                          handleGreetingCategoryPress(category);
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
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`videos-modal-${videoContent.length}`}
                  data={videoContent}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: video, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.upcomingEventModalCard, 
                        { width: modalCardWidth },
                        !isLastInRow && { marginRight: modalCardGap }
                      ]}
                      onPress={() => {
                        closeVideosModal();
                        const videoData: Template = {
                          id: video.id,
                          name: video.title,
                          thumbnail: video.thumbnail,
                          category: video.category,
                          downloads: 0,
                          isDownloaded: false,
                        };
                        navigation.navigate('VideoPlayer', {
                          selectedVideo: videoData,
                          relatedVideos: videoContent.slice(0, 6),
                        });
                      }}
                    >
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={video.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.8)']}
                          style={styles.upcomingEventModalOverlay}
                        />
                      </View>
                    </TouchableOpacity>
                    );
                  }}
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
                  <Text style={styles.customerSupportCloseButtonText}>✕</Text>
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

        {/* Motivation Modal */}
        <Modal
          visible={isMotivationModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeMotivationModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient
                colors={['#f5f5f5', '#ffffff']}
                style={styles.upcomingEventsModalGradient}
              >
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Motivation</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.upcomingEventsCloseButton}
                    onPress={closeMotivationModal}
                  >
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`motivation-modal-${motivationTemplatesRaw.length > 0 ? motivationTemplatesRaw.length : motivationTemplates.length}`}
                  data={motivationTemplatesRaw.length > 0 ? motivationTemplatesRaw : motivationTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: template, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.upcomingEventModalCard, 
                        { width: modalCardWidth },
                        !isLastInRow && { marginRight: modalCardGap }
                      ]}
                      onPress={() => {
                        closeMotivationModal();
                        navigation.navigate('PosterPlayer', {
                          selectedPoster: template,
                          relatedPosters: (motivationTemplatesRaw.length > 0 ? motivationTemplatesRaw : motivationTemplates).filter(
                            t => t.id !== template.id
                          ),
                        });
                      }}
                    >
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={template.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.8)']}
                          style={styles.upcomingEventModalOverlay}
                        />
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Good Morning Modal */}
        <Modal
          visible={isGoodMorningModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeGoodMorningModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient
                colors={['#f5f5f5', '#ffffff']}
                style={styles.upcomingEventsModalGradient}
              >
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Good Morning</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.upcomingEventsCloseButton}
                    onPress={closeGoodMorningModal}
                  >
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`goodmorning-modal-${goodMorningTemplatesRaw.length > 0 ? goodMorningTemplatesRaw.length : goodMorningTemplates.length}`}
                  data={goodMorningTemplatesRaw.length > 0 ? goodMorningTemplatesRaw : goodMorningTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: template, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.upcomingEventModalCard, 
                        { width: modalCardWidth },
                        !isLastInRow && { marginRight: modalCardGap }
                      ]}
                      onPress={() => {
                        closeGoodMorningModal();
                        navigation.navigate('PosterPlayer', {
                          selectedPoster: template,
                          relatedPosters: (goodMorningTemplatesRaw.length > 0 ? goodMorningTemplatesRaw : goodMorningTemplates).filter(
                            t => t.id !== template.id
                          ),
                        });
                      }}
                    >
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={template.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.8)']}
                          style={styles.upcomingEventModalOverlay}
                        />
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

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
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`businessethics-modal-${businessEthicsTemplatesRaw.length > 0 ? businessEthicsTemplatesRaw.length : businessEthicsTemplates.length}`}
                  data={businessEthicsTemplatesRaw.length > 0 ? businessEthicsTemplatesRaw : businessEthicsTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: template, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.upcomingEventModalCard, 
                        { width: modalCardWidth },
                        !isLastInRow && { marginRight: modalCardGap }
                      ]}
                      onPress={() => {
                        closeBusinessEthicsModal();
                        navigation.navigate('PosterPlayer', {
                          selectedPoster: template,
                          relatedPosters: (businessEthicsTemplatesRaw.length > 0 ? businessEthicsTemplatesRaw : businessEthicsTemplates).filter(
                            t => t.id !== template.id
                          ),
                        });
                      }}
                    >
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={template.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.8)']}
                          style={styles.upcomingEventModalOverlay}
                        />
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Devotional Modal */}
        <Modal
          visible={isDevotionalModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeDevotionalModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient
                colors={['#f5f5f5', '#ffffff']}
                style={styles.upcomingEventsModalGradient}
              >
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Devotional</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.upcomingEventsCloseButton}
                    onPress={closeDevotionalModal}
                  >
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`devotional-modal-${devotionalTemplatesRaw.length > 0 ? devotionalTemplatesRaw.length : devotionalTemplates.length}`}
                  data={devotionalTemplatesRaw.length > 0 ? devotionalTemplatesRaw : devotionalTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: template, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.upcomingEventModalCard, 
                        { width: modalCardWidth },
                        !isLastInRow && { marginRight: modalCardGap }
                      ]}
                      onPress={() => {
                        closeDevotionalModal();
                        navigation.navigate('PosterPlayer', {
                          selectedPoster: template,
                          relatedPosters: (devotionalTemplatesRaw.length > 0 ? devotionalTemplatesRaw : devotionalTemplates).filter(
                            t => t.id !== template.id
                          ),
                        });
                      }}
                    >
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={template.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.8)']}
                          style={styles.upcomingEventModalOverlay}
                        />
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Leader Quotes Modal */}
        <Modal
          visible={isLeaderQuotesModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeLeaderQuotesModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient
                colors={['#f5f5f5', '#ffffff']}
                style={styles.upcomingEventsModalGradient}
              >
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Leader Quotes</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.upcomingEventsCloseButton}
                    onPress={closeLeaderQuotesModal}
                  >
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`leaderquotes-modal-${leaderQuotesTemplatesRaw.length > 0 ? leaderQuotesTemplatesRaw.length : leaderQuotesTemplates.length}`}
                  data={leaderQuotesTemplatesRaw.length > 0 ? leaderQuotesTemplatesRaw : leaderQuotesTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: template, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.upcomingEventModalCard, 
                        { width: modalCardWidth },
                        !isLastInRow && { marginRight: modalCardGap }
                      ]}
                      onPress={() => {
                        closeLeaderQuotesModal();
                        navigation.navigate('PosterPlayer', {
                          selectedPoster: template,
                          relatedPosters: (leaderQuotesTemplatesRaw.length > 0 ? leaderQuotesTemplatesRaw : leaderQuotesTemplates).filter(
                            t => t.id !== template.id
                          ),
                        });
                      }}
                    >
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={template.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.8)']}
                          style={styles.upcomingEventModalOverlay}
                        />
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Atmanirbhar Bharat Modal */}
        <Modal visible={isAtmanirbharBharatModalVisible} transparent={true} animationType="slide" onRequestClose={closeAtmanirbharBharatModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Atmanirbhar Bharat</Text>
                  </View>
                  <TouchableOpacity style={styles.upcomingEventsCloseButton} onPress={closeAtmanirbharBharatModal}>
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`atmanirbhar-modal-${atmanirbharBharatTemplatesRaw.length > 0 ? atmanirbharBharatTemplatesRaw.length : atmanirbharBharatTemplates.length}`}
                  data={atmanirbharBharatTemplatesRaw.length > 0 ? atmanirbharBharatTemplatesRaw : atmanirbharBharatTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: template, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity activeOpacity={0.8} style={[
                      styles.upcomingEventModalCard, 
                      { width: modalCardWidth },
                      !isLastInRow && { marginRight: modalCardGap }
                    ]} onPress={() => {
                      closeAtmanirbharBharatModal();
                      navigation.navigate('PosterPlayer', { selectedPoster: template, relatedPosters: (atmanirbharBharatTemplatesRaw.length > 0 ? atmanirbharBharatTemplatesRaw : atmanirbharBharatTemplates).filter(t => t.id !== template.id) });
                    }}>
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={template.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.upcomingEventModalOverlay} />
                        <LinearGradient colors={['#4ecdc4', '#44a08d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upcomingEventModalBadge}>
                          <Icon name="star" size={12} color="#ffffff" />
                          <Text style={styles.upcomingEventModalBadgeText}>Free</Text>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Good Thoughts Modal */}
        <Modal visible={isGoodThoughtsModalVisible} transparent={true} animationType="slide" onRequestClose={closeGoodThoughtsModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Good Thoughts</Text>
                  </View>
                  <TouchableOpacity style={styles.upcomingEventsCloseButton} onPress={closeGoodThoughtsModal}>
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`goodthoughts-modal-${goodThoughtsTemplatesRaw.length > 0 ? goodThoughtsTemplatesRaw.length : goodThoughtsTemplates.length}`}
                  data={goodThoughtsTemplatesRaw.length > 0 ? goodThoughtsTemplatesRaw : goodThoughtsTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: template, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity activeOpacity={0.8} style={[
                      styles.upcomingEventModalCard, 
                      { width: modalCardWidth },
                      !isLastInRow && { marginRight: modalCardGap }
                    ]} onPress={() => {
                      closeGoodThoughtsModal();
                      navigation.navigate('PosterPlayer', { selectedPoster: template, relatedPosters: (goodThoughtsTemplatesRaw.length > 0 ? goodThoughtsTemplatesRaw : goodThoughtsTemplates).filter(t => t.id !== template.id) });
                    }}>
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={template.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.upcomingEventModalOverlay} />
                        <LinearGradient colors={['#4ecdc4', '#44a08d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upcomingEventModalBadge}>
                          <Icon name="star" size={12} color="#ffffff" />
                          <Text style={styles.upcomingEventModalBadgeText}>Free</Text>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Trending Modal */}
        <Modal visible={isTrendingModalVisible} transparent={true} animationType="slide" onRequestClose={closeTrendingModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Trending</Text>
                  </View>
                  <TouchableOpacity style={styles.upcomingEventsCloseButton} onPress={closeTrendingModal}>
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`trending-modal-${trendingTemplatesRaw.length > 0 ? trendingTemplatesRaw.length : trendingTemplates.length}`}
                  data={trendingTemplatesRaw.length > 0 ? trendingTemplatesRaw : trendingTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: template, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity activeOpacity={0.8} style={[
                      styles.upcomingEventModalCard, 
                      { width: modalCardWidth },
                      !isLastInRow && { marginRight: modalCardGap }
                    ]} onPress={() => {
                      closeTrendingModal();
                      navigation.navigate('PosterPlayer', { selectedPoster: template, relatedPosters: (trendingTemplatesRaw.length > 0 ? trendingTemplatesRaw : trendingTemplates).filter(t => t.id !== template.id) });
                    }}>
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={template.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.upcomingEventModalOverlay} />
                        <LinearGradient colors={['#4ecdc4', '#44a08d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upcomingEventModalBadge}>
                          <Icon name="star" size={12} color="#ffffff" />
                          <Text style={styles.upcomingEventModalBadgeText}>Free</Text>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Bhagvat Gita Modal */}
        <Modal visible={isBhagvatGitaModalVisible} transparent={true} animationType="slide" onRequestClose={closeBhagvatGitaModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Bhagvat Gita</Text>
                  </View>
                  <TouchableOpacity style={styles.upcomingEventsCloseButton} onPress={closeBhagvatGitaModal}>
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`bhagvatgita-modal-${bhagvatGitaTemplatesRaw.length > 0 ? bhagvatGitaTemplatesRaw.length : bhagvatGitaTemplates.length}`}
                  data={bhagvatGitaTemplatesRaw.length > 0 ? bhagvatGitaTemplatesRaw : bhagvatGitaTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: template, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity activeOpacity={0.8} style={[
                      styles.upcomingEventModalCard, 
                      { width: modalCardWidth },
                      !isLastInRow && { marginRight: modalCardGap }
                    ]} onPress={() => {
                      closeBhagvatGitaModal();
                      navigation.navigate('PosterPlayer', { selectedPoster: template, relatedPosters: (bhagvatGitaTemplatesRaw.length > 0 ? bhagvatGitaTemplatesRaw : bhagvatGitaTemplates).filter(t => t.id !== template.id) });
                    }}>
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={template.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.upcomingEventModalOverlay} />
                        <LinearGradient colors={['#4ecdc4', '#44a08d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upcomingEventModalBadge}>
                          <Icon name="star" size={12} color="#ffffff" />
                          <Text style={styles.upcomingEventModalBadgeText}>Free</Text>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Books Modal */}
        <Modal visible={isBooksModalVisible} transparent={true} animationType="slide" onRequestClose={closeBooksModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Books</Text>
                  </View>
                  <TouchableOpacity style={styles.upcomingEventsCloseButton} onPress={closeBooksModal}>
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`books-modal-${booksTemplatesRaw.length > 0 ? booksTemplatesRaw.length : booksTemplates.length}`}
                  data={booksTemplatesRaw.length > 0 ? booksTemplatesRaw : booksTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: template, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity activeOpacity={0.8} style={[
                      styles.upcomingEventModalCard, 
                      { width: modalCardWidth },
                      !isLastInRow && { marginRight: modalCardGap }
                    ]} onPress={() => {
                      closeBooksModal();
                      navigation.navigate('PosterPlayer', { selectedPoster: template, relatedPosters: (booksTemplatesRaw.length > 0 ? booksTemplatesRaw : booksTemplates).filter(t => t.id !== template.id) });
                    }}>
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={template.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.upcomingEventModalOverlay} />
                        <LinearGradient colors={['#4ecdc4', '#44a08d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upcomingEventModalBadge}>
                          <Icon name="star" size={12} color="#ffffff" />
                          <Text style={styles.upcomingEventModalBadgeText}>Free</Text>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Celebrates the Moments Modal */}
        <Modal visible={isCelebratesMomentsModalVisible} transparent={true} animationType="slide" onRequestClose={closeCelebratesMomentsModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <View style={styles.upcomingEventsModalTitleContainer}>
                    <Text style={styles.upcomingEventsModalTitle}>Celebrates the Moments</Text>
                  </View>
                  <TouchableOpacity style={styles.upcomingEventsCloseButton} onPress={closeCelebratesMomentsModal}>
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`celebrates-modal-${celebratesMomentsTemplatesRaw.length > 0 ? celebratesMomentsTemplatesRaw.length : celebratesMomentsTemplates.length}`}
                  data={celebratesMomentsTemplatesRaw.length > 0 ? celebratesMomentsTemplatesRaw : celebratesMomentsTemplates}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item: template, index }) => {
                    const isLastInRow = (index + 1) % modalColumns === 0;
                    return (
                    <TouchableOpacity activeOpacity={0.8} style={[
                      styles.upcomingEventModalCard, 
                      { width: modalCardWidth },
                      !isLastInRow && { marginRight: modalCardGap }
                    ]} onPress={() => {
                      closeCelebratesMomentsModal();
                      navigation.navigate('PosterPlayer', { selectedPoster: template, relatedPosters: (celebratesMomentsTemplatesRaw.length > 0 ? celebratesMomentsTemplatesRaw : celebratesMomentsTemplates).filter(t => t.id !== template.id) });
                    }}>
                      <View style={styles.upcomingEventModalImageContainer}>
                        <OptimizedImage uri={template.thumbnail} style={styles.upcomingEventModalImage} resizeMode="cover" />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.upcomingEventModalOverlay} />
                        <LinearGradient colors={['#4ecdc4', '#44a08d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upcomingEventModalBadge}>
                          <Icon name="star" size={12} color="#ffffff" />
                          <Text style={styles.upcomingEventModalBadgeText}>Free</Text>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                    );
                  }}
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
                    <Text style={styles.upcomingEventsCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <View style={styles.upcomingEventsModalBody}>
                <FlatList
                  key={`featured-content-modal-${featuredContent.length}`}
                  data={featuredContent}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={modalColumns}
                  columnWrapperStyle={styles.upcomingEventModalRow}
                  contentContainerStyle={styles.upcomingEventsModalScroll}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: featured, index }) => {
                    // Convert featured content to Template format for navigation
                    const convertFeaturedContentToTemplate = (fc: FeaturedContent): Template => ({
                      id: fc.id,
                      name: fc.title,
                      thumbnail: fc.imageUrl,
                      category: fc.type || 'Featured Content',
                      downloads: 0,
                      isDownloaded: false,
                      tags: [],
                    });

                    const selectedTemplate = convertFeaturedContentToTemplate(featured);
                    const relatedTemplates = featuredContent
                      .filter(fc => fc.id !== featured.id)
                      .map(convertFeaturedContentToTemplate);
                    const isLastInRow = (index + 1) % modalColumns === 0;

                    return (
                      <TouchableOpacity 
                        activeOpacity={0.8} 
                        style={[
                          styles.upcomingEventModalCard, 
                          { width: modalCardWidth },
                          !isLastInRow && { marginRight: modalCardGap }
                        ]} 
                        onPress={() => {
                          closeFeaturedContentModal();
                          navigation.navigate('PosterPlayer', {
                            selectedPoster: selectedTemplate,
                            relatedPosters: relatedTemplates,
                          });
                        }}
                      >
                        <View style={styles.upcomingEventModalImageContainer}>
                          <OptimizedImage uri={featured.imageUrl} style={styles.upcomingEventModalImage} resizeMode="cover" />
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.upcomingEventModalOverlay} />
                          {/* <LinearGradient colors={['#4ecdc4', '#44a08d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upcomingEventModalBadge}>
                            <Icon name="star" size={12} color="#ffffff" />
                            <Text style={styles.upcomingEventModalBadgeText}>Featured</Text>
                          </LinearGradient> */}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
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
  clearIcon: {
    marginLeft: moderateScale(4),
    marginRight: moderateScale(4),
    padding: moderateScale(2),
  },
  featuredCarouselContainer: {
    marginTop: moderateScale(10),
    marginBottom: moderateScale(6),
  },
  featuredCarouselList: {
    paddingHorizontal: moderateScale(12),
  },
  featuredCarouselCard: {
    height: verticalScale(110),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    marginRight: moderateScale(10),
    backgroundColor: '#f2f2f2',
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
     paddingHorizontal: moderateScale(10),
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
      backgroundColor: '#ffffff',
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
      color: '#333333',
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
      backgroundColor: '#f8f9fa',
    },
    upcomingEventsModalScroll: {
      paddingHorizontal: 0, // Remove padding from container, add to rows instead
      paddingTop: moderateScale(12),
      paddingBottom: moderateScale(12),
    },
    upcomingEventModalRow: {
      justifyContent: 'flex-start', // Changed from space-between to align items from left
      marginBottom: moderateScale(6),
      paddingLeft: moderateScale(8), // Left padding
      paddingRight: moderateScale(8), // Right padding - equal to left
    },
    upcomingEventModalCard: {
      // Width is set dynamically via inline styles based on modalColumns
      // Note: marginRight is applied conditionally in renderItem to avoid extra space on last card
      backgroundColor: '#ffffff',
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

  });

export default HomeScreen; 