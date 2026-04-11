import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  FlatList,
  ScrollView,
  PanResponder,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackParamList } from '../navigation/types';
import { Template } from '../services/dashboard';
import { useTheme } from '../context/ThemeContext';
import OptimizedImage from '../components/OptimizedImage';
import LazyFullImage from '../components/LazyFullImage';
import businessCategoryPostersApi from '../services/businessCategoryPostersApi';
import greetingTemplatesService from '../services/greetingTemplates';
import calendarApi from '../services/calendarApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/auth';
import { useBusinessProfile } from '../context/BusinessProfileContext';

// Skeleton Animation Component
const SkeletonLoader = ({ width, height, style }: { width: number; height: number; style?: any }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: '#e0e0e0',
          borderRadius: 8,
          opacity: shimmerOpacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton Poster Component
const SkeletonPoster = ({ width, height, style }: { width: number; height: number; style?: any }) => {
  return (
    <View style={[{ width, height }, style]}>
      <SkeletonLoader width={width} height={height * 0.7} />
      <View style={{ marginTop: 8 }}>
        <SkeletonLoader width={width * 0.8} height={12} />
        <SkeletonLoader width={width * 0.6} height={10} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

// Skeleton Section Component
const SkeletonSection = ({ title }: { title: string }) => {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <SkeletonLoader width={30} height={30} style={{ marginRight: 10 }} />
        <SkeletonLoader width={150} height={20} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', paddingRight: 16 }}>
          {[1, 2, 3].map((item) => (
            <SkeletonPoster key={item} width={120} height={160} style={{ marginRight: 12 }} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  english: ['english'],
  marathi: ['marathi'],
  hindi: ['hindi'],
};

const extractLanguagesFromTags = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) {
    return [];
  }

  const normalizedTags = tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map(tag => tag.toLowerCase().trim());

  const matchedLanguages = Object.entries(LANGUAGE_KEYWORDS).reduce<string[]>((acc, [language, keywords]) => {
    // Check if any tag matches a language keyword (full name only)
    // Use word boundary matching to ensure we match whole words only
    const matches = keywords.some(keyword => {
      // Match full language name as whole word only (case-insensitive)
      // This prevents false positives like "Hiring" matching "hi"
      const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i');
      return normalizedTags.some(tag => wordBoundaryRegex.test(tag));
    });

    if (matches) {
      acc.push(language);
    }
    return acc;
  }, []);

  return Array.from(new Set(matchedLanguages));
};

const mergeTemplateLanguages = (template: Template): Template => {
  const existingLanguages = Array.isArray(template.languages)
    ? template.languages
      .filter((language): language is string => typeof language === 'string' && language.trim().length > 0)
      .map(language => language.toLowerCase())
    : [];

  const tags = Array.isArray(template.tags) ? template.tags : [];
  const languagesFromTags = extractLanguagesFromTags(tags);
  const mergedLanguages = Array.from(new Set([...existingLanguages, ...languagesFromTags]));

  return {
    ...template,
    languages: mergedLanguages,
  };
};

const templateContainsLanguage = (template: Template, languageId: string): boolean => {
  if (!languageId || languageId === 'all') {
    return true;
  }

  const normalizedLanguage = languageId.toLowerCase();
  const templateLanguages = Array.isArray(template.languages)
    ? template.languages.map(language => language.toLowerCase())
    : [];

  // Extract tags once so we can reuse them
  const tags = Array.isArray(template.tags) ? template.tags : [];

  // Check if template explicitly matches the language in languages array
  if (templateLanguages.length > 0 && templateLanguages.includes(normalizedLanguage)) {
    return true;
  }

  // Check if template matches the language via tags (full language names only)
  if (tags.length > 0) {
    const normalizedTags = tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map(tag => tag.toLowerCase().trim());
    const keywords = LANGUAGE_KEYWORDS[normalizedLanguage] || [normalizedLanguage];

    // Use word boundary matching to match full language names only
    // This prevents false positives like "Hiring" matching "hi"
    const hasLanguageKeyword = keywords.some(keyword => {
      // Match full language name as whole word only (case-insensitive)
      const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i');
      return normalizedTags.some(tag => wordBoundaryRegex.test(tag));
    });

    if (hasLanguageKeyword) {
      return true;
    }

    // If tags exist but don't contain language keywords, check if we're looking for English
    // Templates without language tags should only show for English (default)
    if (normalizedLanguage === 'english') {
      // Check if tags contain any other language keywords (using strict full-name matching)
      const hasAnyLanguageKeyword = Object.entries(LANGUAGE_KEYWORDS).some(([lang, langKeywords]) => {
        if (lang === 'english') return false; // Skip English itself
        return langKeywords.some(keyword => {
          // Match full language name as whole word only
          const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i');
          return normalizedTags.some(tag => wordBoundaryRegex.test(tag));
        });
      });

      // If no language keywords found at all, show for English (default)
      if (!hasAnyLanguageKeyword) {
        return true;
      }
    }

    // If tags exist but don't match the requested language, don't show
    return false;
  }

  // REMOVED: Universal logic that caused inconsistent filtering
  // Templates with no language metadata should follow the same rules as others
  // This prevents posters from appearing/disappearing unexpectedly

  // Fallback: Default to English if no other match found
  return normalizedLanguage === 'english';
};

const hexToRgba = (hexColor: string, alpha = 1): string => {
  if (!hexColor) {
    return `rgba(0,0,0,${alpha})`;
  }

  let hex = hexColor.replace('#', '');

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(char => char + char)
      .join('');
  }

  if (hex.length !== 6) {
    return `rgba(0,0,0,${alpha})`;
  }

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Memoized poster item component for better performance (moved outside to prevent recreation)
interface RelatedPosterItemProps {
  item: Template;
  cardWidth: number;
  cardHeight: number;
  imageUrl: string;
  onPress: (item: Template) => void;
  isSelected: boolean;
  overlayColors: string[];
}

const RelatedPosterItem: React.FC<RelatedPosterItemProps> = React.memo(({
  item,
  cardWidth,
  cardHeight,
  imageUrl,
  onPress,
  isSelected,
  overlayColors
}) => {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  // Final safety check to ensure valid dimensions before rendering
  const validCardWidth = (typeof cardWidth === 'number' && !isNaN(cardWidth) && isFinite(cardWidth) && cardWidth > 0)
    ? cardWidth
    : 100;
  const validCardHeight = (typeof cardHeight === 'number' && !isNaN(cardHeight) && isFinite(cardHeight) && cardHeight > 0)
    ? cardHeight
    : 60;

  return (
    <TouchableOpacity
      style={[
        styles.relatedPosterCard,
        { width: validCardWidth, height: validCardHeight },
        isSelected && styles.relatedPosterCardSelected
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {isSelected && <View style={styles.selectedPosterGlow} pointerEvents="none" />}
      <OptimizedImage
        uri={imageUrl}
        style={styles.relatedPosterImage}
        resizeMode="cover"
      />
      {isSelected && (
        <LinearGradient
          colors={overlayColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          style={styles.selectedPosterOverlay}
        />
      )}
      {isSelected && (
        <View style={styles.selectedPosterBadge}>
          <Text style={styles.selectedPosterBadgeText}>Previewing</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  // Return true if props are equal (skip re-render), false if different (re-render)

  // Quick reference check first
  if (prevProps === nextProps) return true;

  // Check item ID first (most likely to change)
  if (prevProps.item.id !== nextProps.item.id) return false;

  // Check selection state (changes frequently)
  if (prevProps.isSelected !== nextProps.isSelected) return false;

  // Check dimensions (rarely change)
  if (prevProps.cardWidth !== nextProps.cardWidth || prevProps.cardHeight !== nextProps.cardHeight) return false;

  // Check computed values
  if (prevProps.imageUrl !== nextProps.imageUrl) return false;

  // Check overlay colors array reference (should be stable)
  if (prevProps.overlayColors !== nextProps.overlayColors) {
    // Deep compare if reference changed
    if (prevProps.overlayColors.length !== nextProps.overlayColors.length) return false;
    if (prevProps.overlayColors.some((color, i) => color !== nextProps.overlayColors[i])) return false;
  }

  // All props are equal, skip re-render
  return true;
});

RelatedPosterItem.displayName = 'RelatedPosterItem';

type TodaysPickScreenRouteProp = RouteProp<MainStackParamList, 'TodaysPick'>;
type TodaysPickScreenNavigationProp = StackNavigationProp<MainStackParamList, 'TodaysPick'>;

const TodaysPickScreen: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const themeColors = theme.colors || {};
  const primaryColor = themeColors.primary || '#764ba2';
  const secondaryColor = themeColors.secondary || themeColors.primary || '#667eea';
  const navigation = useNavigation<TodaysPickScreenNavigationProp>();
  const route = useRoute<TodaysPickScreenRouteProp>();
  const insets = useSafeAreaInsets();

  // Track previous initialPoster ID to detect when a different poster is selected
  const prevInitialPosterIdRef = useRef<string | null>(null);
  const previewOverlayColors = useMemo(() => {
    const startColor = secondaryColor || primaryColor;
    const endColor = primaryColor;
    return [
      hexToRgba(startColor, 0.95),
      hexToRgba(endColor, 0.85),
    ];
  }, [primaryColor, secondaryColor]);

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

  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;
  const { selectedBusinessProfile } = useBusinessProfile();

  // Dynamic device detection that updates on rotation
  const isTabletDevice = useMemo(() => screenWidth >= 768, [screenWidth]);
  const isLandscapeMode = useMemo(() => screenWidth > screenHeight, [screenWidth, screenHeight]);

  // Responsive scaling functions with safety checks
  const scale = useCallback((size: number) => {
    if (!screenWidth || isNaN(screenWidth) || screenWidth <= 0) {
      return size; // Fallback to original size if screenWidth is invalid
    }
    return (screenWidth / 375) * size;
  }, [screenWidth]);

  const verticalScale = useCallback((size: number) => {
    if (!screenHeight || isNaN(screenHeight) || screenHeight <= 0) {
      return size; // Fallback to original size if screenHeight is invalid
    }
    return (screenHeight / 667) * size;
  }, [screenHeight]);

  const moderateScale = useCallback((size: number, factor = 0.5) => {
    const scaled = scale(size);
    if (isNaN(scaled) || !isFinite(scaled)) {
      return size; // Fallback to original size if scale returns invalid value
    }
    return size + (scaled - size) * factor;
  }, [scale]);

  // Handle optional route params - TodaysPickScreen doesn't require route params
  // Type assertion needed because TodaysPick route is defined as undefined but may receive PosterPlayer params
  const routeParams = (route.params || {}) as {
    selectedPoster?: Template;
    relatedPosters?: Template[];
    businessCategory?: string;
    greetingCategory?: string;
    originScreen?: string;
    posterLimit?: number;
    calendarDate?: string;
  };
  const {
    selectedPoster: initialPosterParam,
    relatedPosters: initialRelatedPosters = [],
    businessCategory,
    greetingCategory,
    originScreen,
    posterLimit,
    calendarDate,
  } = routeParams;

  // Create a default placeholder poster if none is provided
  const defaultPoster: Template = useMemo(() => ({
    id: 'loading',
    name: 'Loading...',
    thumbnail: '',
    category: 'Today\'s Pick',
    downloads: 0,
    isDownloaded: false,
    tags: [],
  }), []);

  // Ensure initialPoster is always defined
  const initialPoster: Template = initialPosterParam || defaultPoster;

  // Convert initialPoster to Template format if it's a GreetingTemplate
  // GreetingTemplates have content.background which should be used as thumbnail if thumbnail is missing
  const convertedInitialPoster = useMemo(() => {
    // If it's a GreetingTemplate (has content.background), ensure thumbnail is set
    if ((initialPoster as any).content?.background) {
      return {
        ...initialPoster,
        thumbnail: initialPoster.thumbnail || (initialPoster as any).content?.background,
      } as Template;
    }
    return initialPoster;
  }, [initialPoster]);

  // Original TodaysPickScreen state - restore original functionality
  const [todayPosters, setTodayPosters] = useState<Template[]>([]);
  const [sections, setSections] = useState<Array<{ title: string; data: Template[] }>>([]);
  const [loading, setLoading] = useState(true);

  // Keep PosterPlayerScreen state for layout compatibility - sync with todayPosters
  const [currentPoster, setCurrentPoster] = useState<Template>(convertedInitialPoster);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  // Daily shuffle seed based on date (ensures same selection per day, different each day)
  const getDailySeed = useCallback(() => {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    // Create a hash from date string for consistent seeding
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }, []);

  // Seeded random number generator (returns value between 0 and 1)
  const seededRandom = useCallback((seed: number, index: number = 0) => {
    const x = Math.sin((seed + index) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }, []);

  // Select one item from array using daily seed
  const selectDailyItem = useCallback(<T,>(items: T[], seed: number, type: string = ''): T | null => {
    if (!items || items.length === 0) return null;

    // Use type as additional seed variation to ensure different selection for different types
    const typeSeed = type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const finalSeed = seed + typeSeed;

    // Log for debugging daily selection consistency
    console.log(`🎲 [Daily Selection] Type: ${type}, Seed: ${seed}, TypeSeed: ${typeSeed}, FinalSeed: ${finalSeed}, Items: ${items.length}`);

    const randomValue = seededRandom(finalSeed, 0);
    const randomIndex = Math.floor(randomValue * items.length);
    const selectedItem = items[randomIndex];

    console.log(`🎯 [Daily Selection] Selected index: ${randomIndex}, Random value: ${randomValue}`);

    return selectedItem;
  }, [seededRandom]);
  const lastAutoDetectedPosterIdRef = useRef<string | null>(null); // Track which poster triggered auto-detection to prevent duplicate detection
  const userSelectedPosterRef = useRef<string | null>(null); // Track user-selected poster (via swipe or click) to prevent reset
  const userManuallySelectedLanguageRef = useRef<boolean>(false); // Track if user manually selected a language (including "All")
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string | null>(null);
  const [isBusinessProfileReminderVisible, setIsBusinessProfileReminderVisible] = useState(false);
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  // Get high quality image URL for preview (full quality, maximum resolution)
  const getHighQualityImageUrl = (poster: Template): string => {
    // Check if poster has a previewUrl property (cast to any to access)
    const previewUrl = (poster as any).previewUrl;
    if (previewUrl) {
      return previewUrl;
    }

    // Check for content.background (used in greeting templates for full quality image)
    const contentBackground = (poster as any).content?.background;
    if (contentBackground) {
      return contentBackground;
    }

    // Otherwise, enhance the thumbnail URL for maximum quality
    let url = poster.thumbnail;

    if (!url) {
      return '';
    }

    // For Cloudinary URLs, get maximum quality image
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      try {
        const [prefix, remainder] = url.split('/upload/');
        if (!remainder) {
          return url; // Can't parse, return original
        }

        // Split the remainder into parts
        const parts = remainder.split('/');

        // Find the version number (starts with 'v' followed by digits)
        // This is the reliable way to identify the actual image path in Cloudinary URLs
        let versionIndex = -1;
        for (let i = 0; i < parts.length; i++) {
          if (/^v\d+/.test(parts[i])) {
            versionIndex = i;
            break;
          }
        }

        if (versionIndex >= 0) {
          // Extract everything from version onwards (this is the actual image path)
          const versionAndPath = parts.slice(versionIndex).join('/');

          // Get maximum quality image for preview
          // Use 100% quality (q_100) for best possible quality
          // Calculate max width based on screen size (2x for retina/high DPI displays)
          const maxWidth = Math.max(Math.round(screenWidth * 2.5), 2400); // 2.5x for very high quality

          // Use q_100 (100% quality) for maximum quality preview
          // c_limit preserves aspect ratio, w_ sets maximum width
          const highQualityTransform = `q_100,c_limit,w_${maxWidth}`;
          const highQualityUrl = `${prefix}/upload/${highQualityTransform}/${versionAndPath}`;

          // Return high quality transform URL with 100% quality
          return highQualityUrl;
        } else {
          // No version found - this is unusual for Cloudinary URLs
          // Try to extract the image path from the end
          // The image path is usually at the end after transforms
          const lastSegment = parts[parts.length - 1];
          if (lastSegment && (lastSegment.includes('.') || parts.length === 1)) {
            // Might be the image path directly
            const imagePath = lastSegment;
            const maxWidth = Math.max(Math.round(screenWidth * 2.5), 2400);
            const highQualityTransform = `q_100,c_limit,w_${maxWidth}`;
            return `${prefix}/upload/${highQualityTransform}/${imagePath}`;
          }
        }
      } catch (error) {
        console.warn('⚠️ Error parsing Cloudinary URL for high quality:', error);
        // Fall through to default handling
      }
    }

    // If URL already contains 'thumbnailUrl' or 'thumbnail' in path, try to get full URL
    // by replacing /thumbnailUrl/ or /thumbnail/ with /url/ or removing it
    if (url.includes('/thumbnailUrl/') || url.includes('/thumbnail/')) {
      const fullUrl = url.replace(/\/thumbnailUrl\//g, '/url/').replace(/\/thumbnail\//g, '/images/');
      url = fullUrl;
    }

    // For non-Cloudinary URLs, try to enhance quality
    // Remove any existing quality/size parameters first
    const urlWithoutParams = url.split('?')[0];
    const existingParams = url.includes('?') ? url.split('?')[1] : '';
    const params = new URLSearchParams(existingParams);

    // Remove low-quality parameters
    params.delete('quality');
    params.delete('width');
    params.delete('height');
    params.delete('w');
    params.delete('h');
    params.delete('size');

    // Add high quality parameters
    params.set('quality', '100');
    params.set('width', '2400');

    const paramString = params.toString();
    return paramString ? `${urlWithoutParams}?${paramString}` : urlWithoutParams;
  };

  // Language options
  const languages = useMemo(() => [
    { id: 'all', name: 'All', code: 'ALL' },
    { id: 'english', name: 'English', code: 'EN' },
    { id: 'hindi', name: 'Hindi', code: 'HI' },
  ], []);

  // Display ALL posters (filtered by language)
  const serviceFilterKeywords: Record<string, string[]> = useMemo(() => ({
    generator: ['generator'],
    decorators: ['decor', 'decorator', 'stage'],
    sound: ['sound', 'audio', 'dj'],
    mandap: ['mandap']
  }), []);

  const isEventPlannerCategory = useMemo(() => {
    const category = (currentPoster?.category || initialPoster?.category || '').trim().toLowerCase();
    if (!category) return false;
    return category.includes('event planner');
  }, [currentPoster, initialPoster]);

  const templateMatchesServiceFilter = useCallback((template: Template) => {
    if (!isEventPlannerCategory || !selectedServiceFilter) return true;
    const keywords = serviceFilterKeywords[selectedServiceFilter] || [];
    const templateTags = Array.isArray(template.tags)
      ? template.tags
        .filter((tag): tag is string => typeof tag === 'string')
        .map(tag => tag.toLowerCase())
      : [];
    return keywords.some(keyword => templateTags.some(tag => tag.includes(keyword)));
  }, [isEventPlannerCategory, selectedServiceFilter, serviceFilterKeywords]);


  const getRecentDaysBatch = useCallback(async (today: Date, categoryPrefix: string): Promise<string[]> => {
    const keys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const pastDateString = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`;
      keys.push(`daily_${categoryPrefix}_${pastDateString}`);
    }

    // Batch read all keys at once
    const values = await Promise.all(keys.map(key => AsyncStorage.getItem(key)));
    return values.filter((v): v is string => v !== null);
  }, []);

  // Original TodaysPickScreen loadTodayPosters function - OPTIMIZED for fast loading
  const loadTodayPosters = useCallback(async () => {
    try {
      console.log('🚀 [TodaysPickScreen] loadTodayPosters called');
      // Don't set loading to true immediately - load cached data first
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      console.log(`📅 [TodaysPickScreen] Date string: ${dateString}`);

      // Load cached selections for TODAY first - if all exist, use them and skip API calls
      const cacheKey = `todays_pick_${selectedBusinessProfile?.id}_${dateString}`;
      

      const cachedTodayData = await AsyncStorage.getItem(cacheKey).catch(() => null);


      if (cachedTodayData) {
        console.log('💾 [TodaysPickScreen] Found cached data, checking if valid...');
        try {
          const cachedPosters: Template[] = JSON.parse(cachedTodayData);
          if (Array.isArray(cachedPosters) && cachedPosters.length > 0) {
            // Check if cache contains calendar posters (Festive Alerts)
            // If not, it's old cache from before calendar integration - fetch fresh data
            const calendarPosters = cachedPosters.filter(p => p.category === 'Festive Alerts');
            const hasOldWellnessData = cachedPosters.some(p => p.category === 'Wellness Awareness');
            
            // Check if Business Marketing Tips are valid (not empty)
            const marketingTipsPosters = cachedPosters.filter(p => p.category === 'Business Marketing Tips');
            const marketingTipsValid = marketingTipsPosters && marketingTipsPosters.length > 0;

            // Debug cache validation
            console.log('🔍 [TodaysPickScreen] Cache validation', {
              motivational: cachedPosters.filter(p => p.category === 'Motivational').length,
              business: cachedPosters.filter(p => p.category === 'Business').length,
              marketingTips: marketingTipsPosters.length,
              calendar: calendarPosters.length
            });

            // Debug calendar posters
            console.log('📅 [TodaysPickScreen] Calendar posters from cache:', {
              totalPosters: cachedPosters.length,
              calendarPosters: calendarPosters.length,
              calendarPosterDetails: calendarPosters.map(p => ({
                id: p.id,
                name: p.name,
                thumbnail: p.thumbnail,
                category: p.category
              }))
            });

            // Check if all categories have data for cache to be valid
            const motivationalPosters = cachedPosters.filter(p => p.category === 'Motivational');
            const businessPosters = cachedPosters.filter(p => p.category === 'Business');
            
            if (
              cachedPosters &&
              motivationalPosters.length > 0 &&
              businessPosters.length > 0 &&
              calendarPosters.length > 0 &&
              marketingTipsValid
            ) {
              // Use cached data - no API calls needed
              console.log('✅ [TodaysPickScreen] Using valid cached data with all categories including marketing tips');
              const sectionsData: Array<{ title: string; data: Template[] }> = [];

              // Print response of 4 categories from cached data
              console.log('📊 [TodaysPickScreen] 4 Categories Response (CACHED):');
              console.log('📊 [TodaysPickScreen] 1. Motivational Posters:', motivationalPosters.length, motivationalPosters.map(p => ({ id: p.id, name: p.name, thumbnail: p.thumbnail })));
              console.log('📊 [TodaysPickScreen] 2. Business Posters:', businessPosters.length, businessPosters.map(p => ({ id: p.id, name: p.name, thumbnail: p.thumbnail })));
              console.log('📊 [TodaysPickScreen] 3. Business Marketing Tips:', marketingTipsPosters.length, marketingTipsPosters.map(p => ({ id: p.id, name: p.name, thumbnail: p.thumbnail })));
              console.log('📊 [TodaysPickScreen] 4. Festive Alerts:', calendarPosters.length, calendarPosters.map(p => ({ id: p.id, name: p.name, thumbnail: p.thumbnail })));

              if (businessPosters.length > 0) {
                sectionsData.push({ title: 'Today\'s Business Post', data: businessPosters });
              }
              if (marketingTipsPosters.length > 0) {
                // Ensure only 1 poster per day for Business Marketing Tips
                const singleMarketingTip = marketingTipsPosters.slice(0, 1);
                sectionsData.push({ title: 'Today\'s Business Marketing Tips', data: singleMarketingTip });
              }
              if (calendarPosters.length > 0) {
                sectionsData.push({ title: 'Today\'s Festive Alerts', data: calendarPosters });
              }
              if (motivationalPosters.length > 0) {
                sectionsData.push({ title: 'Today\'s Motivation Quotes', data: motivationalPosters });
              }

              setSections(sectionsData);
              const singleMarketingTip = marketingTipsPosters.slice(0, 1);
              const orderedPosters = [...businessPosters, ...singleMarketingTip, ...calendarPosters, ...motivationalPosters];
              setTodayPosters(orderedPosters);

              const templatesWithLanguages = orderedPosters.map((t: Template) => mergeTemplateLanguages(t));
              setAllTemplates(templatesWithLanguages);

              if (templatesWithLanguages.length > 0) {
                setCurrentPoster(templatesWithLanguages[0]);
              }

              setLoading(false);
              return; // Exit early - no API calls needed
            } else {
              // Cache is invalid - either has old wellness data, no calendar posters, or empty marketing tips
              console.log('🔄 [TodaysPickScreen] Cache invalid because marketing tips are empty or missing other categories');
              console.log('🔄 [TodaysPickScreen] Clearing cache and fetching fresh data');
              // Clear the invalid cache
              await AsyncStorage.removeItem(cacheKey).catch(() => { });
              // Fall through to fetch fresh data
            }
          }
        } catch (error) {
          console.warn('Error parsing cached today data:', error);
          // Fall through to fetch fresh data
        }
      }

      // No cache for today - fetch fresh data
      console.log('🔄 [TodaysPickScreen] No cache found, fetching fresh data');
      setLoading(true);
      const dailySeed = getDailySeed();
      console.log(`🎲 [TodaysPickScreen] Daily seed: ${dailySeed}`);

      console.log(`📡 [TodaysPickScreen] Starting API calls for date: ${dateString}`);
      const startTime = Date.now();

      const [
        motivationalTemplates,
        businessResponse,
        marketingTipsByCategory,
        calendarResponse,
      ] = await Promise.allSettled([
        greetingTemplatesService.searchTemplates('motivational'),
        businessCategoryPostersApi.getUserCategoryPosters(false, selectedBusinessProfile?.id),
        greetingTemplatesService.getTemplatesByCategory('Business Marketing Tips', 200).catch(() => null),
        calendarApi.getPostersByDate(dateString),
      ]);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log('✅ [TodaysPickScreen] All API calls completed', {
        totalTime: `${totalTime}ms`,
        motivational: motivationalTemplates.status,
        business: businessResponse.status,
        marketingTips: marketingTipsByCategory.status,
        calendar: calendarResponse.status,
      });

      // Debug calendar response specifically
      console.log('📅 [TodaysPickScreen] Calendar API Response:', {
        status: calendarResponse.status,
        data: calendarResponse.status === 'fulfilled' ? calendarResponse.value : calendarResponse.reason,
        dateString,
      });

      // Print detailed API responses
      console.log('🔍 [TodaysPickScreen] API RESPONSES:');

      // 1. Motivational Templates Response
      console.log('📋 [MOTIVATIONAL API] Response:', {
        status: motivationalTemplates.status,
        data: motivationalTemplates.status === 'fulfilled' ? {
          success: true,
          templateCount: motivationalTemplates.value?.length || 0,
          templates: motivationalTemplates.value?.slice(0, 3) || [], // First 3 templates
          fullResponse: motivationalTemplates.value
        } : {
          success: false,
          reason: motivationalTemplates.status === 'rejected' ? motivationalTemplates.reason : 'Unknown error'
        }
      });

      // 2. Business Category Posters Response
      console.log('📋 [BUSINESS API] Response:', {
        status: businessResponse.status,
        data: businessResponse.status === 'fulfilled' ? {
          success: businessResponse.value?.success,
          category: businessResponse.value?.data?.category,
          posterCount: businessResponse.value?.data?.posters?.length || 0,
          posters: businessResponse.value?.data?.posters?.slice(0, 3) || [], // First 3 posters
          fullResponse: businessResponse.value
        } : {
          success: false,
          reason: businessResponse.status === 'rejected' ? businessResponse.reason : 'Unknown error'
        }
      });

      // 3. Marketing Tips Response
      console.log('📋 [MARKETING TIPS API] Response:', {
        status: marketingTipsByCategory.status,
        data: marketingTipsByCategory.status === 'fulfilled' && marketingTipsByCategory.value ? {
          success: true,
          templateCount: marketingTipsByCategory.value.length || 0,
          templates: marketingTipsByCategory.value.slice(0, 3) || [], // First 3 templates
          fullResponse: marketingTipsByCategory.value
        } : {
          success: false,
          reason: marketingTipsByCategory.status === 'rejected' ? marketingTipsByCategory.reason : 'No data'
        }
      });

      // 4. Calendar API Response
      console.log('📋 [CALENDAR API] Response:', {
        status: calendarResponse.status,
        data: calendarResponse.status === 'fulfilled' ? {
          success: calendarResponse.value?.success,
          date: calendarResponse.value?.data?.date,
          posterCount: calendarResponse.value?.data?.posters?.length || 0,
          posters: calendarResponse.value?.data?.posters?.slice(0, 3) || [], // First 3 posters
          fullResponse: calendarResponse.value
        } : {
          success: false,
          reason: calendarResponse.reason
        }
      });

      const allPosters: Template[] = [];

      // Process all categories in parallel for better performance
      const processingPromises = [
        // 1. Process motivational quote (daily shuffled)
        (async () => {
          if (motivationalTemplates.status === 'fulfilled' && motivationalTemplates.value && motivationalTemplates.value.length > 0) {
            try {
              const recentDays = await getRecentDaysBatch(today, 'motivational');
              const availableTemplates = motivationalTemplates.value.filter(t => !recentDays.includes(t.id));
              const templatesToSelect = availableTemplates.length > 0 ? availableTemplates : motivationalTemplates.value;

              const selectedMotivational = selectDailyItem(templatesToSelect, dailySeed, 'motivational');
              if (selectedMotivational) {
                const storageKey = `daily_motivational_${dateString}`;
                AsyncStorage.setItem(storageKey, selectedMotivational.id).catch(() => { });

                return {
                  id: selectedMotivational.id,
                  name: selectedMotivational.name || 'Motivational Quote',
                  thumbnail: selectedMotivational.thumbnail,
                  category: 'Motivational',
                  downloads: selectedMotivational.downloads || 0,
                  isDownloaded: selectedMotivational.isDownloaded || false,
                  tags: [],
                } as Template;
              }
            } catch (error) {
              console.error('Error processing motivational quotes:', error);
            }
          }
          return null;
        })(),

        // 2. Process business category poster (daily shuffled)
        (async () => {
          if (businessResponse.status === 'fulfilled' && businessResponse.value.success && businessResponse.value.data.posters.length > 0) {
            try {
              const businessPosters = businessResponse.value.data.posters;
              const recentDays = await getRecentDaysBatch(today, 'business');
              const availablePosters = businessPosters.filter(p => !recentDays.includes(p.id));
              const postersToSelect = availablePosters.length > 0 ? availablePosters : businessPosters;

              const selectedBusiness = selectDailyItem(postersToSelect, dailySeed, 'business');
              if (selectedBusiness) {
                const storageKey = `daily_business_${dateString}`;
                AsyncStorage.setItem(storageKey, selectedBusiness.id).catch(() => { });

                return {
                  id: selectedBusiness.id,
                  name: selectedBusiness.title || 'Business Poster',
                  thumbnail: selectedBusiness.imageUrl || selectedBusiness.thumbnail,
                  category: 'Business',
                  downloads: selectedBusiness.downloads || 0,
                  isDownloaded: false,
                  tags: selectedBusiness.tags || [],
                } as Template;
              }
            } catch (error) {
              console.error('Error processing business posters:', error);
            }
          }
          return null;
        })(),

        // 3. Process Business Marketing Tips (daily shuffled)
        (async () => {
          if (marketingTipsByCategory.status === 'fulfilled' && marketingTipsByCategory.value && marketingTipsByCategory.value.length > 0) {
            try {
              const marketingTipsTemplates = marketingTipsByCategory.value;
              console.log(`📦 [Business Marketing Tips] TOTAL FETCHED: ${marketingTipsTemplates.length}`);
              
              // Log each template's actual category for debugging
              marketingTipsTemplates.forEach((template, index) => {
                console.log(`🔍 [Business Marketing Tips] Item ${index + 1}:`, {
                  id: template.id,
                  name: template.name,
                  category: template.category
                });
              });

              const recentDays = await getRecentDaysBatch(today, 'marketing_tips');
              console.log(`📅 [Business Marketing Tips] FILTERED OUT (Recent IDs):`, recentDays);

              const availableTemplates = marketingTipsTemplates.filter(t => !recentDays.includes(t.id));
              let templatesToSelect = availableTemplates;

              if (availableTemplates.length === 0 && marketingTipsTemplates.length > 0) {
                console.log(`⚠️ [Business Marketing Tips] POOL EXHAUSTED. Resetting to use all ${marketingTipsTemplates.length} templates.`);
                templatesToSelect = marketingTipsTemplates;
              }

              console.log(`🎯 [Business Marketing Tips] FINAL AVAILABLE COUNT: ${templatesToSelect.length}`);

              const selectedMarketingTip = selectDailyItem(templatesToSelect, dailySeed, 'marketing_tips');
              if (selectedMarketingTip) {
                console.log(`✅ [Business Marketing Tips] SELECTED FOR TODAY:`, {
                  id: selectedMarketingTip.id,
                  name: selectedMarketingTip.name
                });

                const storageKey = `daily_marketing_tips_${dateString}`;
                AsyncStorage.setItem(storageKey, selectedMarketingTip.id).catch(() => { });

                // TEMPORARY: Verification log for fresh marketing tips fetch
                console.log("📊 Fresh marketing tips fetched:", templatesToSelect.length);

                return {
                  id: selectedMarketingTip.id,
                  name: selectedMarketingTip.name || 'Business Marketing Tip',
                  thumbnail: selectedMarketingTip.thumbnail,
                  category: 'Business Marketing Tips',
                  downloads: selectedMarketingTip.downloads || 0,
                  isDownloaded: selectedMarketingTip.isDownloaded || false,
                  tags: [],
                } as Template;
              } else {
                console.warn(`❌ [Business Marketing Tips] No template selected`);
              }
            } catch (error) {
              console.error('Error processing business marketing tips:', error);
            }
          } else {
            console.log(`⚠️ [Business Marketing Tips] No data available. Status: ${marketingTipsByCategory.status}${marketingTipsByCategory.status === 'fulfilled' ? `, Length: ${marketingTipsByCategory.value?.length || 0}` : ''}`);
          }
          return null;
        })(),

        // 4. Process Calendar/Festive Alerts poster (daily shuffled)
        (async () => {
          if (calendarResponse.status === 'fulfilled' && calendarResponse.value) {
            try {
              const calendarApiResponse = calendarResponse.value;
              console.log('📦 [TodaysPickScreen] Calendar API response:', {
                success: calendarApiResponse.success,
                hasData: !!calendarApiResponse.data,
                dataType: typeof calendarApiResponse.data,
                postersArray: Array.isArray(calendarApiResponse.data?.posters),
                postersLength: calendarApiResponse.data?.posters?.length || 0,
              });

              // Check if response is successful and has posters
              if (calendarApiResponse.success && calendarApiResponse.data && calendarApiResponse.data.posters && calendarApiResponse.data.posters.length > 0) {
                const calendarPosters = calendarApiResponse.data.posters;
                const recentDays = await getRecentDaysBatch(today, 'calendar');
                const availablePosters = calendarPosters.filter(p => !recentDays.includes(p.id));
                const postersToSelect = availablePosters.length > 0 ? availablePosters : calendarPosters;

                const selectedCalendar = selectDailyItem(postersToSelect, dailySeed, 'calendar');
                if (selectedCalendar) {
                  const storageKey = `daily_calendar_${dateString}`;
                  AsyncStorage.setItem(storageKey, selectedCalendar.id).catch(() => { });

                  return {
                    id: selectedCalendar.id,
                    name: selectedCalendar.name || selectedCalendar.title || 'Calendar Poster',
                    thumbnail: selectedCalendar.thumbnail,
                    category: 'Festive Alerts',
                    downloads: selectedCalendar.downloads || 0,
                    isDownloaded: selectedCalendar.isDownloaded || false,
                    tags: selectedCalendar.tags || [],
                  } as Template;
                }
              }
            } catch (error) {
              console.error('❌ [TodaysPickScreen] Error processing calendar posters:', error);
              console.error('❌ [TodaysPickScreen] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            }
          } else if (calendarResponse.status === 'rejected') {
            console.error('❌ [TodaysPickScreen] Calendar API call failed:', calendarResponse.reason);
            console.error('❌ [TodaysPickScreen] Rejection reason:', JSON.stringify(calendarResponse.reason, null, 2));
          } else {
            console.log(`ℹ️ [TodaysPickScreen] Calendar response status: ${calendarResponse.status}`);
          }
          return null;
        })()
      ];

      // Wait for all processing to complete in parallel
      const processedResults = await Promise.all(processingPromises);

      // Filter out null results and add to allPosters
      processedResults.forEach(result => {
        if (result) {
          allPosters.push(result);
        }
      });

      console.log(`✅ [TodaysPickScreen] Processed ${allPosters.length} posters in parallel`);

      // Organize posters into sections
      const motivationalPosters = allPosters.filter(p => p.category === 'Motivational');
      const businessPosters = allPosters.filter(p => p.category === 'Business');
      const marketingTipsPosters = allPosters.filter(p => p.category === 'Business Marketing Tips');
      const calendarPosters = allPosters.filter(p => p.category === 'Festive Alerts');

      // Print response of 4 categories being displayed
      console.log('📊 [TodaysPickScreen] 4 Categories Response:');
      console.log('📊 [TodaysPickScreen] 1. Motivational Posters:', motivationalPosters.length, motivationalPosters.map(p => ({ id: p.id, name: p.name, thumbnail: p.thumbnail })));
      console.log('📊 [TodaysPickScreen] 2. Business Posters:', businessPosters.length, businessPosters.map(p => ({ id: p.id, name: p.name, thumbnail: p.thumbnail })));
      console.log('📊 [TodaysPickScreen] 3. Business Marketing Tips:', marketingTipsPosters.length, marketingTipsPosters.map(p => ({ id: p.id, name: p.name, thumbnail: p.thumbnail })));
      console.log('📊 [TodaysPickScreen] 4. Festive Alerts:', calendarPosters.length, calendarPosters.map(p => ({ id: p.id, name: p.name, thumbnail: p.thumbnail })));

      const sectionsData: Array<{ title: string; data: Template[] }> = [];

      // Add business section first
      if (businessPosters.length > 0) {
        sectionsData.push({
          title: 'Today\'s Business Post',
          data: businessPosters,
        });
      }

      // Add Business Marketing Tips section second
      if (marketingTipsPosters.length > 0) {
        // Ensure only 1 poster per day for Business Marketing Tips
        const singleMarketingTip = marketingTipsPosters.slice(0, 1);
        sectionsData.push({
          title: 'Today\'s Business Marketing Tips',
          data: singleMarketingTip,
        });
      }

      // Add Festive Alerts section third
      if (calendarPosters.length > 0) {
        sectionsData.push({
          title: 'Today\'s Festive Alerts',
          data: calendarPosters,
        });
      }

      // Add motivational section fourth
      if (motivationalPosters.length > 0) {
        sectionsData.push({
          title: 'Today\'s Motivation Quotes',
          data: motivationalPosters,
        });
      }

      setSections(sectionsData);

      // Keep flat list for preloading and sync with allTemplates for layout compatibility
      // Order: Business first, then Business Marketing Tips (single), then Festive Alerts, then Motivational
      const singleMarketingTip = marketingTipsPosters.slice(0, 1);
      const orderedPosters = [...businessPosters, ...singleMarketingTip, ...calendarPosters, ...motivationalPosters];

      // Cache today's selections for future use (persists across app restarts)
      if (orderedPosters.length > 0) {
        const cacheKey = `todays_pick_${selectedBusinessProfile?.id}_${dateString}`;
        AsyncStorage.setItem(cacheKey, JSON.stringify(orderedPosters)).catch(() => { });
      }

      setTodayPosters(orderedPosters);

      // Sync with allTemplates for PosterPlayerScreen layout compatibility
      const templatesWithLanguages = orderedPosters.map((t: Template) => mergeTemplateLanguages(t));
      setAllTemplates(templatesWithLanguages);

      // Set first poster as current poster if available
      if (templatesWithLanguages.length > 0) {
        setCurrentPoster(templatesWithLanguages[0]);
      }
    } catch (error) {
      console.error('Error loading today\'s posters:', error);
    } finally {
      setLoading(false);
    }
  }, [getDailySeed, selectDailyItem, seededRandom, selectedBusinessProfile?.id]);

  // Load today's posters on mount
  useEffect(() => {
    console.log('🔄 [TodaysPickScreen] useEffect triggered, calling loadTodayPosters');
    loadTodayPosters().catch((error) => {
      console.error('❌ [TodaysPickScreen] Error in loadTodayPosters:', error);
    });
  }, [loadTodayPosters]);

  // Reload posters when business profile changes
  useEffect(() => {
    if (selectedBusinessProfile?.id) {
      console.log('🔄 [TodaysPickScreen] Business profile changed, reloading posters for profile:', selectedBusinessProfile.id);
      loadTodayPosters().catch((error) => {
        console.error('❌ [TodaysPickScreen] Error reloading posters after profile change:', error);
      });
    }
  }, [selectedBusinessProfile?.id, loadTodayPosters]);

  // Use todayPosters for filteredPosters instead of allTemplates
  const filteredPosters = useMemo(() => {
    // Ensure all templates have languages merged before filtering
    const templatesWithLanguages = todayPosters.map(t => mergeTemplateLanguages(t));

    // If "All" is selected, return ALL templates without any language filtering
    if (selectedLanguage === 'all') {
      return templatesWithLanguages;
    }

    // CRITICAL FIX: When a specific language is selected, show ALL posters
    // Don't filter by language - this prevents grid from showing only 1 image
    // Language auto-detection is for UI purposes only, not for filtering content
    console.log(`🔄 [LANGUAGE FILTER] Language ${selectedLanguage} selected, showing all posters without filtering`);
    return templatesWithLanguages;
    
    // REMOVED: Aggressive language filtering that caused single image display
    // const languageFiltered = templatesWithLanguages.filter(template => {
    //   const matches = templateContainsLanguage(template, selectedLanguage);
    //   return matches;
    // });

    // CRITICAL FIX: Never return empty array - fallback to all posters
    // This prevents Preview Grid from disappearing during swipe
    // if (languageFiltered.length === 0) {
    //   console.log(`🔄 [LANGUAGE FILTER] No posters found for language: ${selectedLanguage}, showing all posters`);
    //   return templatesWithLanguages;
    // }

    // return languageFiltered;
  }, [todayPosters, selectedLanguage]);

  // Preload images for better scrolling performance
  const preloadImages = useCallback((posters: Template[], startIndex: number = 0, count: number = 20) => {
    const imagesToPreload = posters.slice(startIndex, startIndex + count);
    imagesToPreload.forEach(poster => {
      const imageUrl = poster.thumbnail || (poster as any).previewUrl || (poster as any).content?.background;
      if (imageUrl && !preloadedImagesRef.current.has(imageUrl)) {
        preloadedImagesRef.current.add(imageUrl);
        Image.prefetch(imageUrl).catch(() => {
          // Silently fail if prefetch fails
        });
      }
    });
  }, []);

  // Preload images when filteredPosters change (reduced batch sizes for better performance)
  useEffect(() => {
    if (filteredPosters.length > 0) {
      // Preload first batch immediately (reduced from 20 to 12 for faster initial render)
      preloadImages(filteredPosters, 0, 12);

      // Preload next batch after a delay (reduced batch size)
      const timeoutId = setTimeout(() => {
        if (filteredPosters.length > 12) {
          preloadImages(filteredPosters, 12, 12);
        }
      }, 800); // Increased delay to reduce initial load

      return () => clearTimeout(timeoutId);
    }
  }, [filteredPosters, preloadImages]);

  // Handle viewable items change for progressive image loading (throttled for performance)
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (!viewableItems || viewableItems.length === 0) return;

    // Only preload if we have a significant number of items
    if (filteredPosters.length < 50) return;

    const lastVisibleIndex = Math.max(...viewableItems.map((item: any) => item.index || 0));
    // Preload next batch when user scrolls near the end (reduced from 10 to 5 items threshold)
    if (lastVisibleIndex >= filteredPosters.length - 5 && lastVisibleIndex < filteredPosters.length - 1) {
      const nextBatchStart = Math.min(lastVisibleIndex + 1, filteredPosters.length);
      const batchSize = Math.min(10, filteredPosters.length - nextBatchStart); // Reduced batch size
      if (batchSize > 0) {
        preloadImages(filteredPosters, nextBatchStart, batchSize);
      }
    }
  }, [filteredPosters, preloadImages]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  });

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear preloaded images ref
      preloadedImagesRef.current.clear();
      // Clear image cache if available
      if ((Image as any).clearMemoryCache) {
        (Image as any).clearMemoryCache();
      }
    };
  }, []);

  // Watch for route param changes and update currentPoster when navigation occurs with new poster
  // This runs for ALL cases (including greetingCategory) to ensure immediate update
  useEffect(() => {
    // Use convertedInitialPoster which has thumbnail properly set for GreetingTemplates
    const initialPosterToUse = convertedInitialPoster;
    const initialPosterImage = initialPosterToUse.thumbnail || (initialPosterToUse as any).content?.background || '';

    // Skip if we have a loading placeholder or no image
    if (initialPosterToUse.id === 'loading' || !initialPosterImage) {
      return;
    }

    // Check if initialPoster has changed (different ID means different poster was selected)
    // This handles the case when user navigates back and selects a different image
    const initialPosterId = initialPosterToUse.id;
    const prevId = prevInitialPosterIdRef.current;

    // If initialPoster ID changed, it means a different poster was selected
    // Reset auto-detection tracking so it can work for the new poster
    // Also allow auto-detection again when navigating to a new category/poster
    if (prevId !== null && prevId !== initialPosterId) {
      lastAutoDetectedPosterIdRef.current = null; // Reset auto-detection tracking for new poster
      userSelectedPosterRef.current = null; // Clear user selection when navigating from different screen
      userManuallySelectedLanguageRef.current = false; // Allow auto-detection for new category/poster
      // Clear allTemplates immediately to prevent showing old posters in grid
      setAllTemplates([]);
    }

    // If initialPoster ID changed, update immediately regardless of category type
    if (prevId !== null && prevId !== initialPosterId) {
      // Ensure thumbnail is set from content.background if needed
      let newPoster = mergeTemplateLanguages(initialPosterToUse);
      if (!newPoster.thumbnail && (newPoster as any).content?.background) {
        newPoster = { ...newPoster, thumbnail: (newPoster as any).content?.background };
      }

      if (newPoster.thumbnail || (newPoster as any).content?.background) {
        console.log('🔄 [POSTER PLAYER] New poster selected - updating immediately:', initialPosterId, 'from:', prevId);
        // Update poster immediately
        setCurrentPoster(newPoster);
        setImageDimensions(null); // Reset image dimensions when poster changes
        prevInitialPosterIdRef.current = initialPosterId;
        // Mark this as the new user-selected poster (from navigation)
        userSelectedPosterRef.current = initialPosterId;
        return;
      }
    }

    // Update ref to track current initialPoster ID (first time or when it changes)
    // On first load (prevId is null), reset auto-detection tracking
    if (prevId === null) {
      lastAutoDetectedPosterIdRef.current = null; // Allow auto-detection on initial load
    }

    if (prevInitialPosterIdRef.current !== initialPosterId) {
      prevInitialPosterIdRef.current = initialPosterId;
    }

    // If currentPoster is still the loading placeholder or doesn't match, update it
    // BUT: Don't reset if user manually selected a poster (via swipe or click)
    const isUserSelected = userSelectedPosterRef.current === currentPoster.id;
    if (!isUserSelected && (currentPoster.id === 'loading' ||
      currentPoster.id !== initialPosterId ||
      (!currentPoster.thumbnail && !(currentPoster as any).content?.background))) {
      // Ensure thumbnail is set from content.background if needed
      let newPoster = mergeTemplateLanguages(initialPosterToUse);
      if (!newPoster.thumbnail && (newPoster as any).content?.background) {
        newPoster = { ...newPoster, thumbnail: (newPoster as any).content?.background };
      }

      if (newPoster.thumbnail || (newPoster as any).content?.background) {
        console.log('🔄 [POSTER PLAYER] Updating currentPoster with loaded data:', newPoster.id);
        setCurrentPoster(newPoster);
        // Clear user selection ref when resetting to initial poster
        userSelectedPosterRef.current = null;
      }
    }
  }, [convertedInitialPoster, currentPoster.id, initialPoster]);

  // DISABLED: Using original TodaysPickScreen loadTodayPosters instead
  // Fetch business category posters when businessCategory is provided
  useEffect(() => {
    // Skip - using original TodaysPickScreen functionality
    if (true || !businessCategory) {
      return;
    }

    // Clear allTemplates immediately to prevent showing old posters in grid
    setAllTemplates([]);
    // Reset manual language selection when switching categories to allow auto-detection
    userManuallySelectedLanguageRef.current = false;

    const fetchBusinessCategoryPosters = async () => {
      try {
        const limit = posterLimit || 5; // Default to 5 if not specified, use 200 for "My Business"
        console.log('📡 [POSTER PLAYER] Fetching business category posters for:', businessCategory, 'with limit:', limit);
        const response = await businessCategoryPostersApi.getPostersByCategory(businessCategory!, limit);

        if (response.success && response.data.posters) {
          // Convert BusinessCategoryPoster to Template format (already limited to 5 by API)
          const convertedTemplates: Template[] = response.data.posters.map((poster: any) => {
            // Normalize tags to ensure they're in the correct format
            let normalizedTags: string[] = [];
            if (Array.isArray(poster.tags)) {
              normalizedTags = poster.tags.map((tag: any) => String(tag).trim()).filter((tag: string) => tag.length > 0);
            } else if (typeof poster.tags === 'string') {
              // Handle string tags (comma-separated or single tag)
              normalizedTags = poster.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
            }

            const template: Template = {
              id: poster.id,
              name: poster.title || poster.name || 'Business Poster',
              thumbnail: poster.imageUrl || poster.thumbnail || '',
              category: poster.category || businessCategory,
              downloads: poster.downloads || 0,
              isDownloaded: false,
              tags: normalizedTags,
            };

            if (__DEV__ && normalizedTags.length > 0) {
              console.log(`📋 [POSTER CONVERSION] Poster ${template.id} tags:`, normalizedTags);
            }

            return template;
          });

          if (convertedTemplates.length > 0) {
            // Set first poster as current poster and others as related
            const ensuredTemplates = convertedTemplates.map(t => mergeTemplateLanguages(t));
            setAllTemplates(ensuredTemplates);

            // Try to find the initialPoster (the one that was clicked) in the loaded templates
            // Use the clicked poster if it exists, otherwise use the first one
            const ensuredInitialPoster = mergeTemplateLanguages(initialPoster);
            const matchingPoster = ensuredTemplates.find(t => t.id === ensuredInitialPoster.id && ensuredInitialPoster.thumbnail);
            const posterToSet = matchingPoster || ensuredTemplates[0];
            setCurrentPoster(posterToSet);

            console.log('✅ [POSTER PLAYER] Loaded', ensuredTemplates.length, 'business category posters');
            console.log('📌 [POSTER PLAYER] Using poster:', matchingPoster ? 'clicked poster found' : 'first poster (clicked not found)');
            if (__DEV__ && posterToSet?.tags) {
              console.log('📋 [POSTER PLAYER] Selected poster tags:', posterToSet.tags);
            }
          }
        }
      } catch (error) {
        console.error('❌ [POSTER PLAYER] Error fetching business category posters:', error);
      }
    };

    fetchBusinessCategoryPosters();
  }, [businessCategory, posterLimit]);

  // DISABLED: Using original TodaysPickScreen loadTodayPosters instead
  // Fetch greeting category templates when greetingCategory is provided
  useEffect(() => {
    // Skip - using original TodaysPickScreen functionality
    if (true || !greetingCategory) {
      return;
    }

    // Clear allTemplates immediately to prevent showing old posters in grid
    setAllTemplates([]);
    // Reset manual language selection when switching categories to allow auto-detection
    userManuallySelectedLanguageRef.current = false;

    const fetchGreetingCategoryTemplates = async () => {
      // Use convertedInitialPoster which has thumbnail properly set for GreetingTemplates
      const posterToMatch = convertedInitialPoster;

      // Note: Immediate update is handled by the route param change detection useEffect above
      // This ensures the correct image is shown immediately when a new poster is selected
      try {
        // Normalize category name for search (like HomeScreen does)
        // Convert "Money & Finance" to "money and finance" to match how templates are tagged
        const normalizedCategory = greetingCategory!.toLowerCase()
          .replace(/[&]/g, 'and')
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Use getTemplates with category filter and limit of 200 to get templates
        // Also use searchTemplates with both original and normalized category names
        // This ensures we get all templates that match the category (like HomeScreen does)
        // Both calls use limit: 200 to get all available images for the category
        const [categoryTemplates, searchTemplatesOriginal, searchTemplatesNormalized] = await Promise.all([
          greetingTemplatesService.getTemplates({ category: greetingCategory!, limit: 200 }),
          greetingTemplatesService.searchTemplates(greetingCategory!, undefined),
          greetingTemplatesService.searchTemplates(normalizedCategory!, undefined)
        ]);

        // Combine all search results
        const searchTemplates = [...searchTemplatesOriginal, ...searchTemplatesNormalized];

        // Combine both results and remove duplicates
        const combinedTemplates = [...categoryTemplates, ...searchTemplates];
        const uniqueTemplatesMap = new Map();
        combinedTemplates.forEach(template => {
          if (!uniqueTemplatesMap.has(template.id)) {
            uniqueTemplatesMap.set(template.id, template);
          }
        });
        const allTemplates = Array.from(uniqueTemplatesMap.values());

        // Filter templates to only include those that have the category name in their tags or category
        // Use both original and normalized category names for matching (to match HomeScreen behavior)
        const filteredTemplates = allTemplates.filter(template => {
          const templateAny = template as any;
          const templateTags = Array.isArray(templateAny.tags) ? templateAny.tags : [];
          const normalizedTags = templateTags.map((tag: string) =>
            typeof tag === 'string' ? tag.toLowerCase().replace(/[&]/g, 'and').replace(/[^a-z0-9\s]/g, ' ').trim() : ''
          );

          // Check if any tag contains the original or normalized category name (case-insensitive)
          const hasMatchingTag = templateTags.some((tag: string) => {
            if (typeof tag !== 'string') return false;
            const normalizedTag = tag.toLowerCase().replace(/[&]/g, 'and').replace(/[^a-z0-9\s]/g, ' ').trim();
            return tag.toLowerCase().includes(greetingCategory!.toLowerCase()) ||
              tag.toLowerCase().includes(normalizedCategory) ||
              normalizedTag.includes(normalizedCategory) ||
              normalizedCategory.includes(normalizedTag);
          });

          // Also check if category matches (original or normalized)
          const normalizedTemplateCategory = template.category
            ? template.category.toLowerCase().replace(/[&]/g, 'and').replace(/[^a-z0-9\s]/g, ' ').trim()
            : '';
          const categoryMatch = template.category?.toLowerCase().includes(greetingCategory!.toLowerCase()) ||
            normalizedTemplateCategory.includes(normalizedCategory) ||
            normalizedCategory.includes(normalizedTemplateCategory);

          return hasMatchingTag || categoryMatch;
        });

        // Use filtered templates if available, otherwise use all templates
        // Limit to 200 templates (as requested by user for general categories)
        const templatesToUse = filteredTemplates.length > 0
          ? filteredTemplates.slice(0, 200)
          : allTemplates.slice(0, 200);

        if (templatesToUse.length > 0) {
          // Convert GreetingTemplate to Template format
          const convertedTemplates: Template[] = templatesToUse.map((template: any) => {
            // Normalize tags to ensure they're in the correct format
            let normalizedTags: string[] = [];
            if (Array.isArray(template.tags)) {
              normalizedTags = template.tags.map((tag: any) => String(tag).trim()).filter((tag: string) => tag.length > 0);
            } else if (typeof template.tags === 'string') {
              normalizedTags = template.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
            }

            const convertedTemplate: Template = {
              id: template.id,
              name: template.name || 'Greeting Template',
              thumbnail: template.thumbnail || template.content?.background || '',
              category: template.category || greetingCategory,
              downloads: template.downloads || 0,
              isDownloaded: template.isDownloaded || false,
              tags: normalizedTags,
            };

            return convertedTemplate;
          });

          // Set first template as current poster and others as related
          // Ensure all templates have languages extracted from tags
          const ensuredTemplates = convertedTemplates.map(t => mergeTemplateLanguages(t));

          // Ensure the initially selected poster is present
          // Use convertedInitialPoster which has thumbnail properly set
          const initialPosterWithLanguages = mergeTemplateLanguages(posterToMatch);

          // Log for debugging
          if (__DEV__) {
            console.log('🔍 [POSTER PLAYER] Looking for clicked poster:', {
              id: initialPosterWithLanguages.id,
              thumbnail: initialPosterWithLanguages.thumbnail,
              contentBackground: (initialPosterWithLanguages as any).content?.background,
              totalTemplates: ensuredTemplates.length
            });
          }

          const existingIndex = ensuredTemplates.findIndex(t => t.id === initialPosterWithLanguages.id);
          let nextTemplates = ensuredTemplates;
          if (existingIndex === -1 && initialPosterWithLanguages.thumbnail) {
            nextTemplates = [initialPosterWithLanguages, ...ensuredTemplates];
            if (__DEV__) {
              console.log('➕ [POSTER PLAYER] Added clicked poster to templates (not found in fetched templates)');
            }
          }

          // Try to find the initialPoster (the one that was clicked) in the loaded templates
          // First check by ID, then also check by thumbnail URL to handle cases where IDs might differ
          // For GreetingTemplates, also check content.background as it might be the actual image URL
          const initialPosterThumbnail = initialPosterWithLanguages.thumbnail || (initialPosterWithLanguages as any).content?.background || '';
          const initialPosterBackground = (initialPosterWithLanguages as any).content?.background || '';

          const matchingPosterById = nextTemplates.find(t => {
            if (t.id !== initialPosterWithLanguages.id) return false;
            // Must have a valid thumbnail/background
            const tThumbnail = t.thumbnail || (t as any).content?.background || '';
            return tThumbnail && (initialPosterThumbnail || initialPosterBackground);
          });

          const matchingPosterByThumbnail = !matchingPosterById && (initialPosterThumbnail || initialPosterBackground)
            ? nextTemplates.find(t => {
              const tThumbnail = t.thumbnail || (t as any).content?.background || '';
              // Compare both thumbnail and background URLs
              return (tThumbnail && initialPosterThumbnail && tThumbnail === initialPosterThumbnail) ||
                (tThumbnail && initialPosterBackground && tThumbnail === initialPosterBackground) ||
                (initialPosterBackground && tThumbnail && tThumbnail === initialPosterBackground);
            })
            : null;
          const matchingPoster = matchingPosterById || matchingPosterByThumbnail;

          setAllTemplates(nextTemplates);

          // Set current poster and trigger language detection
          // Use the clicked poster if found, otherwise use the first one
          // IMPORTANT: Always prefer the clicked poster (posterToMatch) if it has a valid image
          // This ensures the exact clicked image is shown, even if matching fails
          let posterToSet: Template | null = matchingPoster || null;

          // If no match found OR if the matching poster is different from the clicked one,
          // use the clicked poster if it has a valid image
          if (!posterToSet || posterToSet.id !== posterToMatch.id) {
            const clickedPosterThumbnail = posterToMatch.thumbnail || (posterToMatch as any).content?.background || '';
            if (clickedPosterThumbnail) {
              // Use the clicked poster directly
              posterToSet = posterToMatch;
              console.log('✅ [POSTER PLAYER] Using clicked poster directly (not found in fetched templates):', posterToMatch.id);
            } else if (!posterToSet && nextTemplates.length > 0) {
              // Fallback to first template only if clicked poster has no image
              posterToSet = nextTemplates[0];
            }
          }

          // Ensure we have a valid poster
          if (!posterToSet) {
            console.warn('⚠️ [POSTER PLAYER] No valid poster found, skipping update');
            return;
          }

          // Ensure the poster has thumbnail set (for GreetingTemplates, use content.background if thumbnail is missing)
          if (!posterToSet.thumbnail && (posterToSet as any).content?.background) {
            posterToSet = { ...posterToSet, thumbnail: (posterToSet as any).content?.background };
          }

          const finalPoster = mergeTemplateLanguages(posterToSet);

          // Only update if the poster is actually different to avoid unnecessary re-renders
          setCurrentPoster(prevPoster => {
            if (prevPoster.id === finalPoster.id &&
              prevPoster.thumbnail === finalPoster.thumbnail) {
              return prevPoster; // No change needed
            }
            return finalPoster;
          });

          if (matchingPoster) {
            console.log('✅ [POSTER PLAYER] Using clicked greeting poster:', matchingPoster.id);
          } else if (initialPosterWithLanguages.thumbnail && posterToSet.id === initialPosterWithLanguages.id) {
            console.log('✅ [POSTER PLAYER] Using clicked greeting poster (from initialPoster):', initialPosterWithLanguages.id);
          } else {
            console.log('⚠️ [POSTER PLAYER] Clicked greeting poster not found, using first:', nextTemplates[0]?.id, 'clicked was:', initialPosterWithLanguages.id);
          }

          // Auto-detect language from the first poster's tags
          // Only auto-detect if user hasn't manually selected a language
          if (!userManuallySelectedLanguageRef.current &&
            lastAutoDetectedPosterIdRef.current !== finalPoster.id &&
            finalPoster.tags && finalPoster.tags.length > 0) {
            const languagesFromTags = extractLanguagesFromTags(finalPoster.tags);

            // Only auto-detect if we actually found language keywords
            if (languagesFromTags.length > 0) {
              const availableLanguageIds = ['hindi', 'english'];
              const detectedLanguage = availableLanguageIds.find(langId => {
                const normalizedLangId = langId.toLowerCase();
                return languagesFromTags.some(detectedLang => detectedLang.toLowerCase() === normalizedLangId);
              });

              if (detectedLanguage) {
                setSelectedLanguage(detectedLanguage);
                lastAutoDetectedPosterIdRef.current = finalPoster.id; // Track that we auto-detected for this poster
              } else {
                // If no matching language found, default to English for templates without language tags
                setSelectedLanguage('english');
                lastAutoDetectedPosterIdRef.current = finalPoster.id;
              }
            } else {
              // No language keywords found in tags, default to English
              setSelectedLanguage('english');
              lastAutoDetectedPosterIdRef.current = finalPoster.id;
            }
          }
        }
      } catch (error) {
        console.error('❌ [POSTER PLAYER] Error fetching greeting category templates:', error);
      }
    };

    fetchGreetingCategoryTemplates();
  }, [greetingCategory, convertedInitialPoster.id]);

  // DISABLED: Using original TodaysPickScreen loadTodayPosters instead
  // Fetch calendar posters when calendarDate is provided
  useEffect(() => {
    // Skip - using original TodaysPickScreen functionality
    if (true || !calendarDate) {
      return;
    }

    // Clear allTemplates immediately to prevent showing old posters in grid
    setAllTemplates([]);
    // Reset manual language selection when switching categories to allow auto-detection
    userManuallySelectedLanguageRef.current = false;

    const fetchCalendarPosters = async () => {
      try {
        console.log('📡 [POSTER PLAYER] Fetching calendar posters for date:', calendarDate);
        const response = await calendarApi.getPostersByDate(calendarDate!);

        // Print full JSON response
        console.log('═══════════════════════════════════════════════════════');
        console.log('📦 [CALENDAR API] FULL JSON RESPONSE');
        console.log('═══════════════════════════════════════════════════════');
        console.log(JSON.stringify(response, null, 2));
        console.log('═══════════════════════════════════════════════════════');

        if (response.success && response.data.posters.length > 0) {
          console.log('📋 [CALENDAR POSTERS] Raw posters from API:', response.data.posters.length);

          // Log raw poster data before conversion
          response.data.posters.forEach((poster: any, index: number) => {
            console.log(`📋 [CALENDAR POSTER ${index + 1}] Raw data:`, JSON.stringify({
              id: poster.id,
              name: poster.name,
              title: poster.title,
              tags: poster.tags,
              tagsType: typeof poster.tags,
              tagsIsArray: Array.isArray(poster.tags),
              category: poster.category,
              languages: (poster as any).languages,
            }, null, 2));
          });

          // Convert CalendarPoster to Template format
          const convertedTemplates: Template[] = response.data.posters.map((poster: any) => {
            // Normalize tags to ensure they're in the correct format
            let normalizedTags: string[] = [];
            if (Array.isArray(poster.tags)) {
              normalizedTags = poster.tags.map((tag: any) => String(tag).trim()).filter((tag: string) => tag.length > 0);
            } else if (typeof poster.tags === 'string') {
              normalizedTags = poster.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
            }

            const template: Template = {
              id: poster.id,
              name: poster.name || poster.title || 'Calendar Poster',
              thumbnail: poster.thumbnail || poster.thumbnailUrl || poster.imageUrl || '',
              category: poster.category || 'Festival',
              downloads: poster.downloads || 0,
              isDownloaded: poster.isDownloaded || false,
              tags: normalizedTags,
            };

            return template;
          });

          console.log('📋 [CALENDAR POSTERS] Converted templates (before language merge):');
          convertedTemplates.forEach((template, index) => {
            console.log(`  Template ${index + 1}:`, JSON.stringify({
              id: template.id,
              name: template.name,
              tags: template.tags || [],
              tagsLength: (template.tags || []).length,
            }, null, 2));
          });

          if (convertedTemplates.length > 0) {
            // Set first poster as current poster and others as related
            // Ensure all templates have languages extracted from tags
            const ensuredTemplates = convertedTemplates.map(t => mergeTemplateLanguages(t));

            console.log('📋 [CALENDAR POSTERS] After language merge:');
            ensuredTemplates.forEach((template, index) => {
              const languagesFromTags = extractLanguagesFromTags(template.tags);
              console.log(`  Template ${index + 1}:`, JSON.stringify({
                id: template.id,
                name: template.name,
                tags: template.tags,
                languages: template.languages,
                languagesFromTags: languagesFromTags,
                willMatchEnglish: templateContainsLanguage(template, 'english'),
                willMatchHindi: templateContainsLanguage(template, 'hindi'),
              }, null, 2));
            });

            setAllTemplates(ensuredTemplates);

            // Use the initial poster if it exists in the list, otherwise use the first one
            // Ensure the initial poster also has languages merged
            const ensuredInitialPoster = mergeTemplateLanguages(initialPoster);
            // Try to find by ID first, then by thumbnail URL
            const matchingPosterById = ensuredTemplates.find(t => t.id === ensuredInitialPoster.id && ensuredInitialPoster.thumbnail);
            const matchingPosterByThumbnail = !matchingPosterById && ensuredInitialPoster.thumbnail
              ? ensuredTemplates.find(t => t.thumbnail === ensuredInitialPoster.thumbnail)
              : null;
            const matchingPoster = matchingPosterById || matchingPosterByThumbnail;
            const posterToSet = matchingPoster || ensuredTemplates[0];

            // Ensure the selected poster has languages properly merged
            const finalPoster = mergeTemplateLanguages(posterToSet);
            setCurrentPoster(finalPoster);

            if (matchingPoster) {
              console.log('📌 [POSTER PLAYER] Using clicked calendar poster:', matchingPoster.id);
            } else {
              console.log('📌 [POSTER PLAYER] Clicked calendar poster not found, using first:', ensuredTemplates[0]?.id);
            }

            console.log('✅ [POSTER PLAYER] Loaded', ensuredTemplates.length, 'calendar posters for date:', calendarDate);
            console.log('═══════════════════════════════════════════════════════');
          }
        } else {
          console.log('⚠️ [CALENDAR POSTERS] No posters found in response:', {
            success: response.success,
            hasData: !!response.data,
            postersCount: response.data?.posters?.length || 0,
          });
        }
      } catch (error) {
        console.error('❌ [POSTER PLAYER] Error fetching calendar posters:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
      }
    };

    fetchCalendarPosters();
  }, [calendarDate, initialPoster]);

  // Sync state when route params change (only if businessCategory, greetingCategory, or calendarDate is not provided)
  useEffect(() => {
    // Skip if business category, greeting category, or calendar date is provided (handled by separate useEffects above)
    if (businessCategory || greetingCategory || calendarDate) {
      return;
    }

    // Clear allTemplates immediately when initialPoster changes to prevent showing old posters
    const initialPosterId = initialPoster.id;
    const prevId = prevInitialPosterIdRef.current;
    if (prevId !== null && prevId !== initialPosterId) {
      setAllTemplates([]);
    }

    const ensureLanguages = (template: Template): Template => mergeTemplateLanguages(template);

    // Skip if we have a loading placeholder
    if (initialPoster.id === 'loading') {
      return;
    }

    const templatesToMerge = initialRelatedPosters.find(p => p.id === initialPoster.id)
      ? initialRelatedPosters
      : [initialPoster, ...initialRelatedPosters];

    const templatesWithLanguages = templatesToMerge.map(ensureLanguages);
    const templatesMap = new Map<string, Template>();

    templatesWithLanguages.forEach((template: Template) => {
      templatesMap.set(template.id, template);
    });

    // Always include the initial poster (ensuring languages too)
    const ensuredInitialPoster = ensureLanguages(initialPoster);
    templatesMap.set(initialPoster.id, ensuredInitialPoster);

    const updatedTemplates = Array.from(templatesMap.values());
    setAllTemplates(updatedTemplates);

    // Update currentPoster when new data arrives
    // Check if initialPoster has changed (different ID means different poster was selected)
    // This handles the case when user navigates back and selects a different image
    setCurrentPoster(prevPoster => {
      // If initialPoster ID is different, it means a new poster was selected - update immediately
      if (prevPoster.id !== initialPoster.id && ensuredInitialPoster.thumbnail) {
        console.log('🔄 [POSTER PLAYER] Route params changed - updating to new poster:', initialPoster.id, 'from:', prevPoster.id);
        setImageDimensions(null); // Reset image dimensions when poster changes
        // Update the ref to track the new poster ID
        if (prevInitialPosterIdRef.current !== initialPoster.id) {
          prevInitialPosterIdRef.current = initialPoster.id;
        }
        return ensuredInitialPoster;
      }

      // If currentPoster is still the loading placeholder or has no thumbnail
      if (prevPoster.id === 'loading' || !prevPoster.thumbnail) {
        // If we have a valid poster with thumbnail, use it
        if (ensuredInitialPoster.thumbnail) {
          return ensuredInitialPoster;
        }
      }
      // Otherwise, try to find the current poster in the updated templates
      const foundPoster = updatedTemplates.find(t => t.id === prevPoster.id);
      return foundPoster || ensuredInitialPoster;
    });
  }, [initialPoster, initialRelatedPosters, selectedLanguage, businessCategory, greetingCategory, calendarDate]);

  // Detect language from initial poster on mount
  useEffect(() => {
    // Don't auto-detect if user manually selected "All" or any language
    if (userManuallySelectedLanguageRef.current) {
      return;
    }

    const initialPosterWithLanguages = mergeTemplateLanguages(initialPoster);

    // Detect the primary language from the initial poster
    const posterLanguages = Array.isArray(initialPosterWithLanguages.languages)
      ? initialPosterWithLanguages.languages.map((lang: string) => lang.toLowerCase())
      : [];

    const posterTags = Array.isArray(initialPosterWithLanguages.tags) ? initialPosterWithLanguages.tags : [];
    const languagesFromTags = extractLanguagesFromTags(posterTags);
    const allPosterLanguages = Array.from(new Set([...posterLanguages, ...languagesFromTags.map(l => l.toLowerCase())]));

    // Available language IDs that we support
    const availableLanguageIds = ['english', 'hindi'];

    // Find the first matching language from available languages
    const detectedLanguage = availableLanguageIds.find(langId => {
      const normalizedLangId = langId.toLowerCase();
      // Check if the poster's languages include this language
      if (allPosterLanguages.includes(normalizedLangId)) {
        return true;
      }
      // Check if tags contain keywords for this language
      const keywords = LANGUAGE_KEYWORDS[normalizedLangId] || [normalizedLangId];
      return keywords.some(keyword =>
        allPosterLanguages.some(posterLang => posterLang.includes(keyword)) ||
        posterTags.some((tag: unknown) =>
          typeof tag === 'string' && tag.toLowerCase().includes(keyword)
        )
      );
    });

    // If a language is detected, switch to it
    // Always auto-detect based on the current poster's language
    // Only skip if we've already detected for this poster to avoid duplicate detection
    if (detectedLanguage && lastAutoDetectedPosterIdRef.current !== initialPoster?.id) {
      setSelectedLanguage(detectedLanguage);
      lastAutoDetectedPosterIdRef.current = initialPoster?.id || null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPoster?.id]); // Run when initial poster changes

  // Detect language from current poster when business category, greeting category, or calendar posters are loaded
  // This ensures language detection works when clicking category cards or calendar posters
  useEffect(() => {
    // Don't auto-detect if user manually selected "All" or any language
    if (userManuallySelectedLanguageRef.current) {
      return;
    }

    // Skip if no currentPoster or if it's a loading placeholder
    if (!currentPoster || currentPoster.id === 'loading' || (!currentPoster.thumbnail && !(currentPoster as any).content?.background)) {
      return;
    }

    // Only run for business category, greeting category, or calendar posters
    if (!businessCategory && !greetingCategory && !calendarDate) {
      return;
    }

    const posterWithLanguages = mergeTemplateLanguages(currentPoster);

    // Detect the primary language from tags
    const posterTags = Array.isArray(posterWithLanguages.tags) ? posterWithLanguages.tags : [];

    if (posterTags.length === 0) {
      return; // No tags to detect language from
    }

    // Extract languages from tags using the helper function
    const languagesFromTags = extractLanguagesFromTags(posterTags);

    // Also check if poster has explicit languages array
    const posterLanguages = Array.isArray(posterWithLanguages.languages)
      ? posterWithLanguages.languages.map((lang: string) => lang.toLowerCase())
      : [];

    // Combine both sources
    const allDetectedLanguages = Array.from(new Set([...languagesFromTags, ...posterLanguages]));

    // Available language IDs that we support (priority order: hindi, english)
    const availableLanguageIds = ['hindi', 'english'];

    // Find the first matching language from available languages (prioritizing hindi/marathi over english)
    const detectedLanguage = availableLanguageIds.find(langId => {
      const normalizedLangId = langId.toLowerCase();
      return allDetectedLanguages.some(detectedLang => detectedLang.toLowerCase() === normalizedLangId);
    });

    // If a language is detected and it's different from current selection, switch to it
    // Always auto-detect based on the current poster's language
    // Only skip if we've already detected for this poster to avoid duplicate detection
    if (detectedLanguage && lastAutoDetectedPosterIdRef.current !== currentPoster?.id) {
      setSelectedLanguage(detectedLanguage);
      lastAutoDetectedPosterIdRef.current = currentPoster?.id || null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPoster?.id, businessCategory, greetingCategory, calendarDate]); // Run when current poster changes for category or calendar

  // Ensure poster selection respects the active language filter
  // BUT: Don't override user-selected posters (via swipe or click)
  // When "All" is selected, show ALL templates without any language filtering
  useEffect(() => {
    if (!allTemplates.length) {
      return;
    }

    // If "All" is selected, no language filtering - allow any poster to be shown
    if (selectedLanguage === 'all') {
      // Skip if user manually selected a poster - don't override their choice
      if (userSelectedPosterRef.current) {
        const userSelectedPoster = allTemplates.find(t => t.id === userSelectedPosterRef.current);
        if (userSelectedPoster) {
          // User's selection is always valid when "All" is selected
          return;
        }
        // User-selected poster not found in templates, clear ref
        userSelectedPosterRef.current = null;
      }

      // Ensure all templates have languages merged
      const templatesWithLanguages = allTemplates.map(t => mergeTemplateLanguages(t));

      setCurrentPoster(previousPoster => {
        const resolvedPrevious = previousPoster
          ? templatesWithLanguages.find(template => template.id === previousPoster.id) || previousPoster
          : null;

        // When "All" is selected, show any template (no language filtering)
        if (resolvedPrevious) {
          return resolvedPrevious;
        }
        return templatesWithLanguages[0];
      });
      return;
    }

    // Language filtering is active (not "All")
    // Skip if user manually selected a poster - don't override their choice
    if (userSelectedPosterRef.current) {
      const userSelectedPoster = allTemplates.find(t => t.id === userSelectedPosterRef.current);
      if (userSelectedPoster) {
        const posterWithLanguages = mergeTemplateLanguages(userSelectedPoster);
        // Check if the user-selected poster matches the current language filter
        if (templateContainsLanguage(posterWithLanguages, selectedLanguage)) {
          // User's selection is valid for current language, keep it
          return;
        }
        // User's selection doesn't match language filter, allow override
        userSelectedPosterRef.current = null;
      } else {
        // User-selected poster not found in templates, clear ref
        userSelectedPosterRef.current = null;
      }
    }

    // Ensure all templates have languages merged before filtering
    const templatesWithLanguages = allTemplates.map(t => mergeTemplateLanguages(t));

    setCurrentPoster(previousPoster => {
      const resolvedPrevious = previousPoster
        ? templatesWithLanguages.find(template => template.id === previousPoster.id) || previousPoster
        : null;

      // Check if current poster matches the selected language
      if (resolvedPrevious && templateContainsLanguage(resolvedPrevious, selectedLanguage)) {
        return resolvedPrevious;
      }

      // Find first template that matches the selected language
      const firstMatchingTemplate = templatesWithLanguages.find(template =>
        templateContainsLanguage(template, selectedLanguage),
      );

      if (firstMatchingTemplate) {
        return firstMatchingTemplate;
      }

      return resolvedPrevious || templatesWithLanguages[0];
    });
  }, [allTemplates, selectedLanguage, greetingCategory, businessCategory, calendarDate]);

  useEffect(() => {
    if (!isEventPlannerCategory && selectedServiceFilter) {
      setSelectedServiceFilter(null);
    }
  }, [isEventPlannerCategory, selectedServiceFilter]);

  // Get section header title and icon based on current poster category
  const sectionHeaderInfo = useMemo(() => {
    const category = currentPoster?.category || '';
    const categoryLower = category.toLowerCase();

    if (categoryLower.includes('business marketing tips') || categoryLower.includes('marketing tips')) {
      return {
        title: 'Today\'s Business Marketing Tips',
        icon: 'campaign',
      };
    } else if (categoryLower.includes('festive alerts') || categoryLower.includes('festival')) {
      return {
        title: 'Today\'s Festive Alerts',
        icon: 'celebration',
      };
    } else if (categoryLower.includes('business') && !categoryLower.includes('marketing')) {
      return {
        title: 'Today\'s Business Post',
        icon: 'business-center',
      };
    } else if (categoryLower.includes('motivational') || categoryLower.includes('motivation')) {
      return {
        title: 'Today\'s Motivation Quotes',
        icon: 'favorite',
      };
    } else {
      // Default fallback
      return {
        title: "Today's Selection",
        icon: 'collections',
      };
    }
  }, [currentPoster?.category]);

  const handlePosterSelect = useCallback((poster: Template) => {
    // Merge template languages to ensure we have all language info
    const posterWithLanguages = mergeTemplateLanguages(poster);

    // Mark this as a user-selected poster (via swipe or click)
    userSelectedPosterRef.current = posterWithLanguages.id;

    // Only auto-detect language if user hasn't manually selected a language (including "All")
    if (!userManuallySelectedLanguageRef.current) {
      // Detect the primary language from the poster
      const posterLanguages = Array.isArray(posterWithLanguages.languages)
        ? posterWithLanguages.languages.map((lang: string) => lang.toLowerCase())
        : [];

      const posterTags = Array.isArray(posterWithLanguages.tags) ? posterWithLanguages.tags : [];
      const languagesFromTags = extractLanguagesFromTags(posterTags);
      const allPosterLanguages = Array.from(new Set([...posterLanguages, ...languagesFromTags.map(l => l.toLowerCase())]));

      // Available language IDs that we support
      const availableLanguageIds = ['english', 'hindi'];

      // Find the first matching language from available languages
      const detectedLanguage = availableLanguageIds.find(langId => {
        const normalizedLangId = langId.toLowerCase();
        // Check if the poster's languages include this language
        if (allPosterLanguages.includes(normalizedLangId)) {
          return true;
        }
        // Check if tags contain keywords for this language
        const keywords = LANGUAGE_KEYWORDS[normalizedLangId] || [normalizedLangId];
        return keywords.some(keyword =>
          allPosterLanguages.some(posterLang => posterLang.includes(keyword)) ||
          posterTags.some((tag: unknown) =>
            typeof tag === 'string' && tag.toLowerCase().includes(keyword)
          )
        );
      });

      // If a language is detected and it's different from current selection, switch to it
      // Always auto-detect based on the current poster's language
      // Only skip if we've already detected for this poster to avoid duplicate detection
      if (detectedLanguage && 
          lastAutoDetectedPosterIdRef.current !== posterWithLanguages?.id &&
          detectedLanguage !== selectedLanguage) { // ADD THIS CHECK
        setSelectedLanguage(detectedLanguage);
        lastAutoDetectedPosterIdRef.current = posterWithLanguages?.id || null;
      }
    }

    // Update the current poster
    setCurrentPoster(posterWithLanguages);
  }, [selectedLanguage]);

  const currentPosterIndex = useMemo(() => {
    if (!currentPoster) {
      return -1;
    }
    return filteredPosters.findIndex(template => template.id === currentPoster.id);
  }, [filteredPosters, currentPoster]);

  const showPosterAtIndex = useCallback((index: number) => {
    if (!filteredPosters.length) {
      return;
    }

    const safeIndex = Math.max(0, Math.min(filteredPosters.length - 1, index));
    const poster = filteredPosters[safeIndex];
    if (poster) {
      handlePosterSelect(poster);
    }
  }, [filteredPosters, handlePosterSelect]);

  const goToNextPoster = useCallback(() => {
    if (currentPosterIndex === -1) {
      showPosterAtIndex(0);
      return;
    }
    const nextIndex = currentPosterIndex + 1;
    if (nextIndex < filteredPosters.length) {
      showPosterAtIndex(nextIndex);
    }
  }, [currentPosterIndex, filteredPosters.length, showPosterAtIndex]);

  const goToPreviousPoster = useCallback(() => {
    if (currentPosterIndex === -1) {
      showPosterAtIndex(0);
      return;
    }
    const previousIndex = currentPosterIndex - 1;
    if (previousIndex >= 0) {
      showPosterAtIndex(previousIndex);
    }
  }, [currentPosterIndex, showPosterAtIndex]);

  const swipeThreshold = 50;

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          // Only capture horizontal swipes (left/right)
          return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15;
        },
        onPanResponderGrant: () => {
          // Gesture started
        },
        onPanResponderMove: () => {
          // Gesture in progress
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx, vx } = gestureState;
          // Check both distance and velocity for better gesture recognition
          if (dx < -swipeThreshold || vx < -0.5) {
            goToNextPoster();
          } else if (dx > swipeThreshold || vx > 0.5) {
            goToPreviousPoster();
          }
        },
        onPanResponderTerminate: () => {
          // Gesture cancelled
        },
      }),
    [goToNextPoster, goToPreviousPoster, swipeThreshold],
  );

  const handleLanguageChange = useCallback((languageId: string) => {
    // Mark that user manually selected a language (including "All")
    // This prevents auto-detection from overriding user's choice
    userManuallySelectedLanguageRef.current = true;

    // Reset auto-detection tracking so it can work for the current poster if needed
    // But only if user selects a specific language (not "All")
    if (languageId !== 'all') {
      lastAutoDetectedPosterIdRef.current = null;
    } else {
      // When "All" is selected, clear auto-detection tracking completely
      // This prevents auto-detection from switching away from "All"
      lastAutoDetectedPosterIdRef.current = null;
    }

    setSelectedLanguage(languageId);

    /*
     * API-based language filtering has been disabled.
     * Previously, we fetched templates via:
     *   - greetingTemplatesService.searchTemplates(...)
     *   - homeApi.getProfessionalTemplates({ language: ... })
     * Language filtering is now handled locally using template tags (see templateContainsLanguage).
     */

    // If "All" is selected, show first template from all templates
    if (languageId === 'all') {
      if (allTemplates.length > 0) {
        const firstTemplate = mergeTemplateLanguages(allTemplates[0]);
        setCurrentPoster(firstTemplate);
      }
      return;
    }

    const firstMatchingTemplate = allTemplates
      .map(template => mergeTemplateLanguages(template))
      .find(template => templateContainsLanguage(template, languageId));
    if (firstMatchingTemplate) {
      setCurrentPoster(firstMatchingTemplate);
    }
  }, [allTemplates]);

  // Responsive icon sizes
  const getIconSize = useCallback((baseSize: number) => {
    const scale = screenWidth / 375;
    return Math.round(baseSize * scale);
  }, [screenWidth]);

  // Detect if fold phone is unfolded (typically width >= 900px)
  const isFoldPhoneUnfolded = useMemo(() => screenWidth >= 900, [screenWidth]);

  // Calculate number of columns: 4 for tablets or unfolded fold phones, 2 for small screens, 3 for regular phones
  const numColumns = useMemo(() => {
    if (isTabletDevice || isFoldPhoneUnfolded) {
      return 4;
    }
    // Small screen devices (width < 450px) show 2 columns
    if (screenWidth < 450) {
      return 2;
    }
    // Regular phones show 3 columns
    return 3;
  }, [isTabletDevice, isFoldPhoneUnfolded, screenWidth]);

  // Card dimensions matching HomeScreen.tsx exactly
  // Use the exact same logic as HomeScreen.tsx getCardWidth()
  // For unfolded fold phones, use standard phone width (375px) to maintain same card size as HomeScreen
  const cardWidth = useMemo(() => {
    // Safety check for valid screenWidth
    if (!screenWidth || isNaN(screenWidth) || screenWidth <= 0) {
      return 100; // Fallback width
    }

    let baseWidth: number;

    if (isTabletDevice) {
      baseWidth = screenWidth * 0.15; // 6-7 cards visible on tablet
    } else {
      // For unfolded fold phones, use standard phone width (375px) to get HomeScreen card size
      // For regular phones, use actual screen width
      const referenceWidth = isFoldPhoneUnfolded ? 375 : screenWidth;

      if (referenceWidth >= 600) {
        baseWidth = referenceWidth * 0.22; // 4 cards on medium phones
      } else if (referenceWidth >= 400) {
        baseWidth = referenceWidth * 0.28; // 3 cards on regular phones
      } else {
        baseWidth = referenceWidth * 0.32; // 3 cards on small phones with more spacing
      }
    }

    // Ensure baseWidth is valid
    if (isNaN(baseWidth) || baseWidth <= 0) {
      baseWidth = 100; // Fallback
    }

    // For all devices, calculate card width to fill available space exactly
    if (numColumns > 0 && !isNaN(numColumns)) {
      // Calculate available width: screen width minus padding and gaps
      const padding = moderateScale(8); // relatedSection paddingHorizontal
      const gap = moderateScale(3); // gap between cards

      // Validate padding and gap
      const validPadding = (isNaN(padding) || padding < 0) ? 8 : padding;
      const validGap = (isNaN(gap) || gap < 0) ? 3 : gap;

      const totalGaps = validGap * (numColumns - 1);
      const availableWidth = screenWidth - (validPadding * 2) - totalGaps;

      // Safety check for availableWidth
      if (isNaN(availableWidth) || availableWidth <= 0) {
        return baseWidth;
      }

      // Calculate optimal card width to fill the space exactly
      const optimalWidth = availableWidth / numColumns;

      // Use optimal width to fill space exactly (this eliminates empty space on the right)
      // Only validate that it's a valid number, not that it's larger than baseWidth
      if (isNaN(optimalWidth) || !isFinite(optimalWidth) || optimalWidth <= 0) {
        return baseWidth; // Fallback if calculation fails
      }

      return optimalWidth;
    }

    return baseWidth;
  }, [screenWidth, isTabletDevice, isFoldPhoneUnfolded, numColumns, moderateScale]);

  const cardHeight = useMemo(() => {
    // Make cards square by setting height equal to width
    const actualCardWidth = cardWidth;

    // Safety check - ensure cardWidth is valid
    if (!actualCardWidth || isNaN(actualCardWidth) || !isFinite(actualCardWidth) || actualCardWidth <= 0) {
      return 100; // Fallback height
    }

    // Return the same value as cardWidth to make it square
    return actualCardWidth;
  }, [cardWidth]);

  // Responsive poster height - dynamically adapts to screen size and rotation
  const posterHeight = useMemo(() => {
    if (isTabletDevice) {
      return screenHeight * 0.30; // Tablet (reduced)
    } else if (screenWidth >= 600) {
      return screenHeight * 0.26; // Large phone (reduced)
    } else if (screenWidth >= 400) {
      return screenHeight * 0.24; // Medium phone (reduced)
    } else {
      return screenHeight * 0.20; // Small phone (reduced)
    }
  }, [screenWidth, screenHeight, isTabletDevice]);

  // Derive height from image aspect ratio to fit width without stretching
  // Also ensure it doesn't take up the whole screen (especially for fold phones when unfolded)
  const computedPreviewHeight = useMemo(() => {
    if (imageDimensions && imageDimensions.width > 0 && imageDimensions.height > 0) {
      const aspectHeight = screenWidth * (imageDimensions.height / imageDimensions.width);

      // Calculate maximum allowed height to leave room for header, grid, and safe areas
      // Reserve space for: header (~80px), top spacing, grid section (~150px), and safe areas
      const headerHeight = moderateScale(80);
      const topSpacing = insets.top + moderateScale(12);
      const gridMinHeight = moderateScale(150); // Minimum space for grid
      const bottomSpacing = insets.bottom;
      const reservedSpace = headerHeight + topSpacing + gridMinHeight + bottomSpacing + moderateScale(30); // Extra buffer

      // Maximum poster height - larger limits to show better preview
      const isFoldPhoneUnfolded = screenWidth >= 900; // Fold phones typically have width >= 900px when unfolded

      // Use larger max heights for better preview
      const baseMaxPercentage = isFoldPhoneUnfolded ? 0.50 : 0.60; // 50% for fold phones, 60% for regular
      const maxPosterHeightByPercentage = screenHeight * baseMaxPercentage;
      const maxPosterHeightBySpace = screenHeight - reservedSpace;

      // Use the smaller of the two constraints to ensure grid is always visible
      const maxPosterHeight = Math.min(maxPosterHeightByPercentage, maxPosterHeightBySpace);

      // Return the smaller of aspect height or max allowed height
      return Math.min(aspectHeight, maxPosterHeight);
    }
    return posterHeight;
  }, [imageDimensions, screenWidth, screenHeight, posterHeight, insets.top, insets.bottom]);

  // Load intrinsic image size when poster changes
  useEffect(() => {
    if (!currentPoster) {
      setImageDimensions(null);
      return;
    }
    const uri = getHighQualityImageUrl(currentPoster);
    if (!uri) {
      setImageDimensions(null);
      return;
    }
    Image.getSize(
      uri,
      (width, height) => setImageDimensions({ width, height }),
      () => setImageDimensions(null)
    );
  }, [currentPoster]);

  const handleBackPress = useCallback(() => {
    if (originScreen === 'GreetingTemplates') {
      navigation.navigate('GreetingTemplates');
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  }, [navigation, originScreen]);

  const navigateToPosterEditor = useCallback(() => {
    navigation.navigate('PosterEditor', {
      selectedImage: {
        uri: getHighQualityImageUrl(currentPoster),
        title: currentPoster.name,
        description: currentPoster.category,
      },
      selectedLanguage: selectedLanguage,
      selectedTemplateId: currentPoster.id,
    });
  }, [navigation, currentPoster, selectedLanguage, getHighQualityImageUrl]);

  const handleNextPress = useCallback(() => {
    if (businessCategory) {
      setIsBusinessProfileReminderVisible(true);
      return;
    }
    navigateToPosterEditor();
  }, [businessCategory, navigateToPosterEditor]);

  const handleBusinessProfileReminderClose = useCallback(() => {
    setIsBusinessProfileReminderVisible(false);
  }, []);

  const handleBusinessProfileAddPress = useCallback(() => {
    setIsBusinessProfileReminderVisible(false);
    navigation.navigate('BusinessProfiles');
  }, [navigation]);

  const handleBusinessProfileContinue = useCallback(() => {
    setIsBusinessProfileReminderVisible(false);
    navigateToPosterEditor();
  }, [navigateToPosterEditor]);

  // Memoize current poster ID to avoid recreating render function
  const currentPosterId = useMemo(() => currentPoster?.id, [currentPoster?.id]);

  // Pre-compute image URLs and language codes for all templates to avoid recalculation during render
  const templateMetadata = useMemo(() => {
    const metadataMap = new Map<string, { imageUrl: string }>();
    filteredPosters.forEach(template => {
      metadataMap.set(template.id, {
        imageUrl: getHighQualityImageUrl(template),
      });
    });
    return metadataMap;
  }, [filteredPosters, getHighQualityImageUrl]);

  const renderRelatedPoster = useCallback(({ item }: { item: Template }) => {
    const metadata = templateMetadata.get(item.id);
    const imageUrl = metadata?.imageUrl || item.thumbnail || '';
    const isSelected = currentPosterId === item.id;

    return (
      <RelatedPosterItem
        item={item}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        imageUrl={imageUrl}
        onPress={handlePosterSelect}
        isSelected={isSelected}
        overlayColors={previewOverlayColors}
      />
    );
  }, [cardWidth, cardHeight, handlePosterSelect, currentPosterId, templateMetadata, previewOverlayColors]);


  const renderLanguageButton = useCallback((language: typeof languages[0]) => {
    const iconSize = getIconSize(12);

    return (
      <TouchableOpacity
        key={language.id}
        style={[
          styles.languageButton,
          selectedLanguage === language.id && styles.languageButtonSelected
        ]}
        onPress={() => handleLanguageChange(language.id)}
        activeOpacity={0.7}
      >
        <View style={styles.languageButtonContent}>
          <Text style={[
            styles.languageButtonText,
            selectedLanguage === language.id && styles.languageButtonTextSelected
          ]}>
            {language.name}
          </Text>
          {selectedLanguage === language.id && (
            <Icon name="check-circle" size={iconSize} color="#ffffff" />
          )}
        </View>
      </TouchableOpacity>
    );
  }, [selectedLanguage, handleLanguageChange, getIconSize, screenWidth]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.gradient[0] || '#e8e8e8' }]}>
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
        {/* Safe Area Top Spacing */}
        <View style={{ height: insets.top + moderateScale(12) }} />

        {/* Header with Back Arrow, Category Name, and Next */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backArrowButton}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[theme.colors.secondary, theme.colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.backArrowButtonGradient}
            >
              <Icon name="chevron-left" size={getIconSize(20)} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <LinearGradient
              colors={[theme.colors.secondary, theme.colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerTitleGradient}
            >
              <Text style={styles.headerCategoryTitle} numberOfLines={1} ellipsizeMode="tail">
                {loading ? 'Loading...' : "Today's Pick"}
              </Text>
            </LinearGradient>
          </View>

          <TouchableOpacity
            onPress={handleNextPress}
            style={styles.headerTextButton}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={[theme.colors.secondary, theme.colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerTextButtonGradient}
            >
              <Text style={styles.headerButtonText}>{loading ? 'Loading...' : 'Next'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Loading State - Show Skeletons */}
        {loading ? (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {/* Skeleton Section Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <SkeletonLoader width={30} height={30} style={{ marginRight: 10, borderRadius: 15 }} />
              <SkeletonLoader width={200} height={20} />
            </View>

            {/* Skeleton Main Poster */}
            <View style={{ marginBottom: 20 }}>
              <SkeletonLoader width={Dimensions.get('window').width - 32} height={200} style={{ marginBottom: 16, borderRadius: 12 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <SkeletonLoader width={120} height={16} />
                <SkeletonLoader width={80} height={16} />
              </View>
            </View>

            {/* Skeleton Related Posters Horizontal List */}
            <View style={{ marginBottom: 12 }}>
              <SkeletonLoader width={150} height={18} style={{ marginBottom: 8 }} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', paddingRight: 16 }}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <SkeletonPoster key={item} width={120} height={160} style={{ marginRight: 12 }} />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : (
          <>
            {/* Section Header */}
            <View style={styles.sectionHeaderContainer}>
              <LinearGradient
                colors={isDarkMode
                  ? [theme.colors.primary + '30', theme.colors.secondary + '20', 'transparent']
                  : [theme.colors.primary + '18', theme.colors.secondary + '10', 'transparent']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sectionHeaderGradient}
              >
                <View style={styles.sectionHeaderContent}>
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    style={styles.sectionIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon
                      name={sectionHeaderInfo.icon}
                      size={moderateScale(20)}
                      color="#ffffff"
                    />
                  </LinearGradient>
                  <View style={styles.sectionTitleContainer}>
                    <Text style={[
                      styles.sectionHeaderText,
                      {
                        color: theme.colors.text,
                        fontSize: moderateScale(14),
                        fontWeight: '700',
                        marginLeft: moderateScale(10),
                      }
                    ]}>
                      {sectionHeaderInfo.title}
                    </Text>
                    <View style={[
                      styles.sectionUnderline,
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

            {/* Compact Poster Section */}
            <View
              style={[styles.posterContainer, { height: computedPreviewHeight, width: '100%' }]}
              {...swipeResponder.panHandlers}
              collapsable={false}
            >
              <LazyFullImage
                key={`poster-${currentPoster.id}-${currentPoster.thumbnail || (currentPoster as any).content?.background || ''}`}
                thumbnailUri={currentPoster.thumbnail || (currentPoster as any).content?.background || ''}
                fullImageUri={getHighQualityImageUrl(currentPoster)}
                style={styles.posterImage}
                resizeMode="contain"
                loadOnMount={true}
                preload={true}
                quality="high"
                maxWidth={2400}
                showLoader={false}
              />
            </View>

            {/* Service filter buttons for Event Planners */}
            {isEventPlannerCategory && (
              <View style={styles.serviceFilterContainer}>
                {['generator', 'decorators', 'sound', 'mandap'].map(filterKey => {
                  const isActive = selectedServiceFilter === filterKey;
                  const labelMap: Record<string, string> = {
                    generator: 'Generator',
                    decorators: 'Decorators',
                    sound: 'Sound',
                    mandap: 'Mandap'
                  };
                  return (
                    <TouchableOpacity
                      key={filterKey}
                      style={[
                        styles.serviceFilterButton,
                        isActive && styles.serviceFilterButtonActive
                      ]}
                      onPress={() => setSelectedServiceFilter(prev => prev === filterKey ? null : filterKey)}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={[theme.colors.secondary, theme.colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.serviceFilterButtonGradient,
                          !isActive && styles.serviceFilterButtonGradientInactive
                        ]}
                      >
                        <Text style={[
                          styles.serviceFilterButtonText,
                          isActive && styles.serviceFilterButtonTextActive
                        ]}>
                          {labelMap[filterKey]}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Compact Related Posters Section */}
            <View style={styles.relatedSection}>
              {filteredPosters.length > 0 ? (
                <FlatList
                  data={filteredPosters}
                  renderItem={renderRelatedPoster}
                  keyExtractor={(item) => item.id}
                  numColumns={numColumns}
                  key={`grid-${numColumns}`}
                  columnWrapperStyle={styles.relatedGrid}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.relatedList}
                  style={styles.relatedFlatList}
                  // Enhanced performance optimizations for large lists
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={isTabletDevice ? 8 : 6}
                  initialNumToRender={isTabletDevice ? 8 : 6}
                  windowSize={isTabletDevice ? 8 : 6}
                  getItemLayout={(data, index) => ({
                    length: cardHeight,
                    offset: cardHeight * index,
                    index,
                  })}
                  updateCellsBatchingPeriod={50}
                  viewabilityConfig={{
                    itemVisiblePercentThreshold: 50,
                    minimumViewTime: 300,
                    waitForInteraction: true,
                  }}
                  // Optimized viewability callback for better performance
                  onViewableItemsChanged={onViewableItemsChanged}
                />
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    No posters available for this category
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Bottom Safe Area Spacing */}
        <View style={{ height: insets.bottom + moderateScale(20) }} />
      </LinearGradient>

      {/* Business Profile Reminder Modal */}
      <Modal
        visible={isBusinessProfileReminderVisible}
        transparent
        animationType="fade"
        onRequestClose={handleBusinessProfileReminderClose}
      >
        <View style={styles.businessProfileModalOverlay}>
          <View style={styles.businessProfileModalContent}>
            <Text style={styles.businessProfileModalTitle}>Complete Your Business Profile</Text>
            <Text style={styles.businessProfileModalSubtitle}>
              Add your business details to create personalized posters that showcase your brand effectively.
            </Text>
            <View style={styles.businessProfileModalActions}>
              <TouchableOpacity
                style={[styles.businessProfileModalButton, styles.businessProfileModalSecondary]}
                onPress={handleBusinessProfileAddPress}
              >
                <Text style={styles.businessProfileModalSecondaryText}>Add Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.businessProfileModalButton, styles.businessProfileModalPrimary]}
                onPress={handleBusinessProfileContinue}
              >
                <Text style={styles.businessProfileModalPrimaryText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Get dynamic screen dimensions (static for StyleSheet - component uses dynamic dimensions)
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive helper functions for StyleSheet (static - component has dynamic versions)
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: moderateScale(8), // Reduced padding
    paddingTop: moderateScale(4), // Reduced padding
    paddingBottom: moderateScale(4),
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(8),
    paddingBottom: moderateScale(6),
    gap: moderateScale(8),
  },
  backArrowButton: {
    borderRadius: moderateScale(6),
    overflow: 'hidden',
  },
  backArrowButtonGradient: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(8),
  },
  headerTitleGradient: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: moderateScale(100),
  },
  headerCategoryTitle: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  headerIconButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextButton: {
    borderRadius: moderateScale(6),
    overflow: 'hidden',
  },
  headerTextButtonGradient: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  headerLanguageScroll: {
    paddingHorizontal: moderateScale(6),
    alignItems: 'center',
    gap: moderateScale(6),
  },
  languageDropdownButton: {
    borderRadius: moderateScale(6),
    overflow: 'hidden',
  },
  languageDropdownButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
  },
  languageDropdownText: {
    color: '#ffffff',
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  languageDropdownMenu: {
    marginHorizontal: moderateScale(8),
    marginBottom: moderateScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: moderateScale(4),
    overflow: 'hidden',
  },
  languageDropdownMenuSmall: {
    position: 'absolute',
    top: moderateScale(8),
    alignSelf: 'center',
    minWidth: moderateScale(140),
    maxWidth: '80%',
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: moderateScale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  languageDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
  },
  languageDropdownItemSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.35)',
  },
  languageDropdownItemText: {
    color: '#ffffff',
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  languageDropdownItemTextSelected: {
    fontWeight: '700',
  },
  backButton: {
    width: moderateScale(32), // Reduced from 36-52
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1), // Reduced from 2
    },
    shadowOpacity: 0.08, // Reduced from 0.1
    shadowRadius: moderateScale(3), // Reduced from 4
    elevation: 2, // Reduced from 3
  },
  nextButton: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(3),
    elevation: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 0,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 0,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: moderateScale(6),
  },
  headerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(2),
  },
  headerMetaText: {
    fontSize: moderateScale(8),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  posterContainer: {
    position: 'relative',
    // Height is set dynamically via inline style based on screen dimensions
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 0,
    marginBottom: moderateScale(6), // Reduced margin
    borderRadius: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(4), // Reduced from 8-12
    },
    shadowOpacity: 0.2, // Reduced from 0.3-0.4
    shadowRadius: moderateScale(8), // Reduced from 16-20
    elevation: 6, // Reduced from 12-16
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterControls: {
    position: 'absolute',
    top: moderateScale(12),
    left: moderateScale(12),
  },
  zoomButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(1),
    borderColor: 'rgba(255,255,255,0.2)',
  },
  relatedSection: {
    flex: 1,
    paddingHorizontal: moderateScale(8), // Compact padding
    paddingTop: moderateScale(4),
    paddingBottom: 0,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(6), // Compact margin
  },
  relatedHeaderLeft: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: moderateScale(13), // Compact font
    fontWeight: '700',
    color: '#333333',
    letterSpacing: 0.3,
    marginBottom: 0,
  },
  relatedSubtitle: {
    fontSize: moderateScale(10),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  relatedCountBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(10),
  },
  relatedCountText: {
    color: '#ffffff',
    fontSize: moderateScale(8),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  relatedList: {
    paddingBottom: moderateScale(20), // Compact padding
    paddingTop: moderateScale(4),
  },
  relatedFlatList: {
    flex: 1,
  },
  relatedGrid: {
    justifyContent: 'flex-start', // Align to left for consistent spacing
    gap: moderateScale(3), // Equal gap between cards
  },
  relatedPosterCard: {
    // Width and height are set dynamically via inline style based on screen dimensions
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: moderateScale(8), // Smaller
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(2), // Reduced
    },
    shadowOpacity: 0.12, // Reduced
    shadowRadius: moderateScale(4), // Reduced
    elevation: 3, // Reduced
    borderWidth: moderateScale(0.5), // Thinner
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: moderateScale(6), // Compact margin
  },
  relatedPosterCardSelected: {
    borderColor: '#ffd166',
    borderWidth: moderateScale(1.2),
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(5),
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  selectedPosterGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(8),
    borderWidth: moderateScale(2),
    borderColor: 'rgba(255, 209, 102, 0.65)',
    shadowColor: '#ffd166',
    shadowOpacity: 0.9,
    shadowRadius: moderateScale(6),
    elevation: 6,
  },
  selectedPosterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  relatedPosterImage: {
    width: '100%',
    height: '100%',
  },
  selectedPosterBadge: {
    position: 'absolute',
    bottom: moderateScale(4),
    left: moderateScale(4),
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  selectedPosterBadgeText: {
    color: '#ffd166',
    fontSize: moderateScale(7),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  relatedPosterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedPosterIcon: {
    width: moderateScale(40), // Compact
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(2),
    },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(3),
    elevation: 2,
  },
  relatedPosterTitleContainer: {
    position: 'absolute',
    bottom: moderateScale(4), // Compact
    left: moderateScale(4),
    right: moderateScale(4),
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: moderateScale(6), // Compact
    paddingVertical: moderateScale(3), // Compact
    borderRadius: moderateScale(6), // Compact
  },
  relatedPosterTitle: {
    color: '#ffffff',
    fontSize: moderateScale(9), // Compact
    fontWeight: '600',
    textAlign: 'center',
  },
  serviceFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(8),
    marginBottom: moderateScale(12),
    gap: moderateScale(6),
  },
  serviceFilterButton: {
    flex: 1,
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  serviceFilterButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  serviceFilterButtonGradient: {
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceFilterButtonGradientInactive: {
    opacity: 0.75,
  },
  serviceFilterButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: moderateScale(9),
    fontWeight: '600',
  },
  serviceFilterButtonTextActive: {
    color: '#ffffff',
  },
  noPostersContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(16), // Compact
    minHeight: moderateScale(80), // Compact
  },
  noPostersText: {
    fontSize: moderateScale(12), // Compact
    color: 'rgba(51,51,51,0.8)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: moderateScale(4),
    marginBottom: moderateScale(4),
  },
  noPostersSubtext: {
    fontSize: moderateScale(10), // Compact
    color: 'rgba(102,102,102,0.8)',
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(16),
  },
  noResultsText: {
    fontSize: moderateScale(14),
    color: 'rgba(51,51,51,0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
  languageSection: {
    paddingHorizontal: moderateScale(8), // Compact
    paddingVertical: moderateScale(6), // Compact
  },
  languageSectionHeader: {
    marginBottom: moderateScale(4),
  },
  languageTitle: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 0,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  languageSubtitle: {
    fontSize: moderateScale(9),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
  languageButtonsContainer: {
    paddingHorizontal: moderateScale(4), // Compact
    gap: moderateScale(6), // Compact
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(4),
  },
  languageButton: {
    paddingVertical: moderateScale(4), // More compact
    paddingHorizontal: moderateScale(8), // More compact
    borderRadius: moderateScale(10), // Smaller
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    marginHorizontal: moderateScale(2),
    minWidth: moderateScale(65), // Smaller minimum width
  },
  languageButtonSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    shadowOpacity: 0.18,
    shadowRadius: moderateScale(4),
    elevation: 3,
    transform: [{ scale: 1.01 }],
  },
  languageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(4), // Compact
  },
  languageButtonText: {
    fontSize: moderateScale(9), // Smaller
    fontWeight: '600',
    color: '#333333',
    letterSpacing: 0.2,
    includeFontPadding: false,
    textDecorationLine: 'none',
    textAlignVertical: 'center',
  },
  languageButtonTextSelected: {
    fontWeight: '700',
  },
  languageFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(8),
    gap: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  languageFilterButton: {
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    minWidth: moderateScale(60),
  },
  languageFilterButtonSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  languageFilterButtonGradient: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageFilterButtonText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#666666',
  },
  languageFilterButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  businessProfileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
  },
  businessProfileModalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(24),
    paddingHorizontal: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  businessProfileModalTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#333333',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  businessProfileModalSubtitle: {
    fontSize: moderateScale(12),
    color: '#666666',
    textAlign: 'center',
    marginBottom: moderateScale(20),
    lineHeight: moderateScale(18),
  },
  businessProfileModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(10),
  },
  businessProfileModalButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessProfileModalSecondary: {
    borderWidth: 1,
    borderColor: '#667eea',
    backgroundColor: '#ffffff',
  },
  businessProfileModalSecondaryText: {
    color: '#667eea',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  businessProfileModalPrimary: {
    backgroundColor: '#667eea',
  },
  businessProfileModalPrimaryText: {
    color: '#ffffff',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  sectionHeaderContainer: {
    width: '100%',
    paddingHorizontal: moderateScale(8),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(6),
  },
  sectionHeaderWrapper: {
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },
  sectionHeaderGradient: {
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionHeaderText: {
    letterSpacing: 0.4,
  },
  sectionUnderline: {
    height: 2,
    width: moderateScale(32),
    borderRadius: moderateScale(1),
  },
});

export default TodaysPickScreen;

