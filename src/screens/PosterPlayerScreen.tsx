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
  InteractionManager,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackParamList } from '../navigation/types';
import { Template } from '../services/dashboard';
import { useTheme } from '../context/ThemeContext';
import { useBusinessProfile } from '../context/BusinessProfileContext';
import businessProfileService, { BusinessProfile } from '../services/businessProfile';
import authService from '../services/auth';
import OptimizedImage from '../components/OptimizedImage';
import LazyFullImage from '../components/LazyFullImage';
import businessCategoryPostersApi from '../services/businessCategoryPostersApi';
import greetingTemplatesService from '../services/greetingTemplates';
import calendarApi from '../services/calendarApi';

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

  // Only treat as language-agnostic if no language info exists AND we're on default language (English)
  // This prevents templates without language info from showing for all languages
  if (templateLanguages.length === 0 && tags.length === 0) {
    // Show only for English (default language) if template has no language info
    return normalizedLanguage === 'english';
  }

  // If we have language info but it doesn't match, return false
  return false;
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

// Global deduplication utility function
const deduplicateTemplates = (templates: Template[]): Template[] => {
  const idMap = new Map<string, Template>();
  const thumbnailMap = new Map<string, Template>();
  const duplicatesRemoved: string[] = [];

  templates.forEach(template => {
    // Skip loading placeholders entirely
    if (template.id === 'loading' || !template.thumbnail) {
      if (template.id !== 'loading') {
        // Only add non-loading templates without thumbnails to idMap
        const key = template.id || `${template.name}-${template.category}`;
        if (!idMap.has(key)) {
          idMap.set(key, template);
        } else {
          duplicatesRemoved.push(key);
          console.log('🔄 [DEDUPLICATION] Duplicate poster removed by ID:', {
            id: template.id,
            name: template.name,
            key
          });
        }
      }
      return;
    }

    // Primary deduplication by ID
    if (template.id && template.id !== 'loading') {
      if (!idMap.has(template.id)) {
        idMap.set(template.id, template);
      } else {
        duplicatesRemoved.push(template.id);
        console.log('🔄 [DEDUPLICATION] Duplicate poster removed by ID:', {
          id: template.id,
          name: template.name,
          key: template.id
        });
        return;
      }
    }

    // Secondary deduplication by thumbnail (catch same images with different IDs)
    const thumbnailKey = template.thumbnail || (template as any).content?.background;
    if (thumbnailKey) {
      if (!thumbnailMap.has(thumbnailKey)) {
        thumbnailMap.set(thumbnailKey, template);
      } else {
        const existingTemplate = thumbnailMap.get(thumbnailKey);
        if (existingTemplate) {
          // Prefer the template with a real ID over 'loading' or empty ID
          const shouldReplace = (!existingTemplate.id || existingTemplate.id === 'loading') && 
                               (template.id && template.id !== 'loading');
          
          if (shouldReplace) {
            // Replace the loading placeholder with the real template
            thumbnailMap.set(thumbnailKey, template);
            if (existingTemplate.id && existingTemplate.id !== template.id) {
              duplicatesRemoved.push(existingTemplate.id);
              console.log('🔄 [DEDUPLICATION] Loading placeholder replaced by real template:', {
                removedId: existingTemplate.id,
                keptId: template.id,
                thumbnail: thumbnailKey
              });
            }
          } else if (existingTemplate.id !== template.id) {
            // This is a true duplicate (same thumbnail, different real IDs)
            duplicatesRemoved.push(template.id);
            console.log('🔄 [DEDUPLICATION] Duplicate poster removed by thumbnail:', {
              id: template.id,
              name: template.name,
              thumbnail: thumbnailKey,
              existingId: existingTemplate.id
            });
          }
        }
      }
    }
  });

  // Combine unique templates, preferring thumbnail map results (real templates over loading)
  const uniqueTemplates = new Map<string, Template>();
  
  // Add all templates from thumbnail map (these are the preferred versions)
  thumbnailMap.forEach(template => {
    const key = template.id || `${template.name}-${template.category}`;
    uniqueTemplates.set(key, template);
  });
  
  // Add any remaining templates from idMap that weren't in thumbnailMap
  idMap.forEach(template => {
    const key = template.id || `${template.name}-${template.category}`;
    if (!uniqueTemplates.has(key)) {
      uniqueTemplates.set(key, template);
    }
  });

  if (duplicatesRemoved.length > 0) {
    console.log('🔄 [DEDUPLICATION] Summary:', {
      originalCount: templates.length,
      uniqueCount: uniqueTemplates.size,
      duplicatesRemoved: duplicatesRemoved.length,
      duplicateKeys: duplicatesRemoved
    });
  }

  return Array.from(uniqueTemplates.values());
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
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

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
      {imageUrl ? (
        <OptimizedImage
          uri={imageUrl}
          style={styles.relatedPosterImage}
          resizeMode="cover"
          mode="thumbnail"
        />
      ) : (
        <View style={[styles.relatedPosterImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' }]}>
          <ActivityIndicator
            size="small"
            color="#667eea"
            style={styles.relatedPosterLoadingIndicator}
          />
        </View>
      )}
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

  // Check imageUrl (includes thumbnailUrl priority)
  if (prevProps.imageUrl !== nextProps.imageUrl) return false;

  // Check thumbnailUrl if available (for better cache invalidation)
  const prevThumbnailUrl = (prevProps.item as any).thumbnailUrl || prevProps.item.thumbnail;
  const nextThumbnailUrl = (nextProps.item as any).thumbnailUrl || nextProps.item.thumbnail;
  if (prevThumbnailUrl !== nextThumbnailUrl) return false;

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

type PosterPlayerScreenRouteProp = RouteProp<MainStackParamList, 'PosterPlayer'>;
type PosterPlayerScreenNavigationProp = StackNavigationProp<MainStackParamList, 'PosterPlayer'>;

import { useSubscription } from '../contexts/SubscriptionContext';

const PosterPlayerScreen: React.FC = () => {
  const { isSubscribed, checkPremiumAccess, refreshSubscription, isSubscriptionActive } = useSubscription();
  const { theme } = useTheme();
  const themeColors = theme.colors || {};
  const primaryColor = themeColors.primary || '#764ba2';
  const secondaryColor = themeColors.secondary || themeColors.primary || '#667eea';
  const navigation = useNavigation<PosterPlayerScreenNavigationProp>();
  const route = useRoute<PosterPlayerScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const {
    selectedPoster: initialPoster,
    selectedTemplateId: initialTemplateId,  // ✅ PRIMARY DATA - ID as source of truth
    relatedPosters: initialRelatedPosters,
    greetingCategory,
    originScreen,
    posterLimit,
    calendarDate,
    templateSource,
    type,
    categoryName,
  } = route.params;

  // Add debug log for received parameters
  console.log("📥 PosterPlayerScreen received params:", {
    type,
    categoryName,
    templateSource
  });

  // Use global state for business data instead of route parameters
  const { 
    selectedBusinessCategory: globalBusinessCategory,
    selectedBusinessProfile: globalBusinessProfile,
    selectedBusinessId: globalBusinessId,
    isLoading: isContextLoading
  } = useBusinessProfile();

  // Track previous initialPoster ID to detect when a different poster is selected
  const prevInitialPosterIdRef = useRef<string | null>(null);
  const prevProfileRef = useRef<any>(null); // CRITICAL FIX: Track previous profile for change detection
  const activeCategoryRef = useRef<{ type: 'business' | 'greeting' | 'calendar' | null; value: string | null }>({ type: null, value: null });
  // Ref to prevent multiple initial poster insertions
  const initialPosterAddedRef = useRef<boolean>(false);
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

  const moderateScale = useCallback((size: number, factor = 0.5) => {
    const scaled = scale(size);
    if (isNaN(scaled) || !isFinite(scaled)) {
      return size; // Fallback to original size if scale returns invalid value
    }
    return size + (scaled - size) * factor;
  }, [scale]);

  // Convert initialPoster to Template format if it's a GreetingTemplate
  // GreetingTemplates have content.background which should be used as thumbnail if thumbnail is missing
  const convertedInitialPoster = useMemo(() => {
    // If it's a GreetingTemplate (has content.background), ensure thumbnail is set
    if ((initialPoster as any).content?.background) {
      return {
        ...initialPoster,
        thumbnail: initialPoster.thumbnail || (initialPoster as any).content.background,
      } as Template;
    }
    return initialPoster;
  }, [initialPoster]);

  const [currentPoster, setCurrentPoster] = useState<Template>(convertedInitialPoster);
  const [currentId, setCurrentId] = useState<string>(initialTemplateId || initialPoster?.id || '');  // ✅ PRIMARY DATA - ID as source of truth
  const [allTemplates, setAllTemplatesState] = useState<Template[]>([]);
  const allTemplatesRef = useRef<Template[]>([]);

  // Wrapper to log all setAllTemplates calls
  const setAllTemplates = useCallback((templates: Template[] | ((prev: Template[]) => Template[])) => {
    const previousTemplates = allTemplatesRef.current;
    const newTemplates = typeof templates === 'function' ? templates(previousTemplates) : templates;
    
    // Apply deduplication before updating state
    const uniqueTemplates = deduplicateTemplates(newTemplates);
    
    allTemplatesRef.current = uniqueTemplates;

    console.log('🔴 [SET ALL TEMPLATES] Called:', {
      newTemplatesCount: Array.isArray(newTemplates) ? newTemplates.length : 'unknown',
      uniqueTemplatesCount: Array.isArray(uniqueTemplates) ? uniqueTemplates.length : 'unknown',
      duplicatesRemoved: Array.isArray(newTemplates) && Array.isArray(uniqueTemplates) ? newTemplates.length - uniqueTemplates.length : 'unknown',
      newTemplateIds: Array.isArray(uniqueTemplates) ? uniqueTemplates.map(t => t.id).slice(0, 10) : 'unknown',
      previousCount: previousTemplates.length,
      previousIds: previousTemplates.map(t => t.id).slice(0, 10),
      globalBusinessCategory,
      greetingCategory,
      calendarDate,
      activeCategoryRef: activeCategoryRef.current,
      stackTrace: new Error().stack?.split('\n').slice(1, 6).join('\n')
    });
    setAllTemplatesState(uniqueTemplates);
  }, [globalBusinessCategory, greetingCategory, calendarDate]);

  // Update ref when state changes
  useEffect(() => {
    allTemplatesRef.current = allTemplates;
  }, [allTemplates]);

  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [isBusinessCategoryLoading, setIsBusinessCategoryLoading] = useState(false);
  const [isGreetingCategoryLoading, setIsGreetingCategoryLoading] = useState(false);
  const [isTemplateLoading, setIsTemplateLoading] = useState<boolean>(
    convertedInitialPoster?.id === 'loading'
  );
  const lastAutoDetectedPosterIdRef = useRef<string | null>(null); // Track which poster triggered auto-detection to prevent duplicate detection
  const userSelectedPosterRef = useRef<string | null>(null); // Track user-selected poster (via swipe or click) to prevent reset
  const userManuallySelectedLanguageRef = useRef<boolean>(false); // Track if user manually selected a language (including "All")
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string | null>(null);
  const [selectedSoftwareCategory, setSelectedSoftwareCategory] = useState<string | null>(null);

  // Auto-set language to "All" when navigating from MyBusiness tab
  useEffect(() => {
    console.log("PosterPlayer origin:", originScreen);

    const cameFromTab = originScreen === "MainTabs";

    if (
      cameFromTab &&
      !userManuallySelectedLanguageRef.current
    ) {
      console.log("🌐 MyBusiness tab opened → default language ALL");
      setSelectedLanguage("all");
    }
  }, [originScreen]);

  // Update loading state when poster changes
  useEffect(() => {
    setIsTemplateLoading(currentPoster?.id === 'loading' || !currentPoster?.thumbnail);
  }, [currentPoster]);

  // Reset language to "All" whenever PosterPlayerScreen becomes active
  useFocusEffect(
    React.useCallback(() => {
      console.log('PosterPlayerScreen focused → resetting language to ALL');

      userManuallySelectedLanguageRef.current = false;
      // Reset initial poster added flag when screen becomes focused (new navigation)
      initialPosterAddedRef.current = false;

      setSelectedLanguage('all');
    }, [])
  );

  // Business profile state
  const [userBusinessProfiles, setUserBusinessProfiles] = useState<BusinessProfile[]>([]);

  // Use global state for business profile
  const activeBusinessProfile = globalBusinessProfile;

  // Determine if we should show subscription message instead of language buttons
  // Only for business categories coming from HomeScreen (templateSource: 'professional' and global business category available)
  const shouldShowSubscriptionMessage = useMemo(() => {
    return templateSource === 'professional' && !!globalBusinessCategory;
  }, [templateSource, globalBusinessCategory]);
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  // State for service filter specific templates
  const [serviceFilterTemplates, setServiceFilterTemplates] = useState<Record<string, Template[]>>({});
  const [isLoadingServiceFilter, setIsLoadingServiceFilter] = useState<Record<string, boolean>>({});

  // Business profile logic is handled by useBusinessProfile context
  
  // CRITICAL FIX: Add effect to handle profile changes and trigger UI updates
  useEffect(() => {
    console.log('🔄 [POSTER PLAYER] Business profile changed:', {
      profileId: globalBusinessProfile?.id,
      profileName: globalBusinessProfile?.name,
      previousProfileId: prevProfileRef.current?.id
    });
    
    // Force refresh templates when profile changes
    if (globalBusinessProfile?.id !== prevProfileRef.current?.id) {
      console.log('🔄 [POSTER PLAYER] Profile changed, forcing template refresh...');
      
      // Reset template state to trigger re-fetch
      setAllTemplatesState([]);
      allTemplatesRef.current = [];
      
      // Update previous profile reference
      prevProfileRef.current = globalBusinessProfile;
      
      // Re-trigger template loading based on current category
      if (activeCategoryRef.current?.type === 'business' && activeCategoryRef.current?.value) {
        console.log('🔄 [POSTER PLAYER] Re-loading business templates for new profile');
        // The existing category loading logic will pick up the new profile
      }
    }
  }, [globalBusinessProfile]);

  // Load business profiles - simplified since context handles AsyncStorage
  useEffect(() => {
    const loadBusinessProfileData = async () => {
      try {
        const currentUserId = authService.getCurrentUser()?.id;
        if (!currentUserId) return;

        // Load user business profiles
        const profiles = await businessProfileService.getUserBusinessProfiles(currentUserId);
        setUserBusinessProfiles(profiles);

        // Context will handle profile selection and AsyncStorage
        // No need to manually apply profiles here
      } catch (error) {
        console.error('Error loading business profile data:', error);
      }
    };

    loadBusinessProfileData();
  }, []);

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

  // Software Company category buttons configuration
  const softwareCategoryButtons = useMemo(() => [
    { id: 'website-dev', name: 'Website Development', tags: ['website', 'web', 'development', 'design'] },
    { id: 'mobile-app-dev', name: 'Mobile App Development', tags: ['mobile', 'app', 'android', 'ios'] },
    { id: 'custom-software', name: 'Custom Software Solutions', tags: ['software', 'custom', 'solution', 'application'] },
    { id: 'ai-automation', name: 'AI & Automation', tags: ['ai', 'automation', 'machine learning', 'ml'] },
    { id: 'it-consulting', name: 'IT Consulting & Support', tags: ['it', 'consulting', 'support', 'technical'] },
    { id: 'software-dev', name: 'Software Development', tags: ['software', 'development', 'programming', 'coding'] },
  ], []);

  const isEventPlannerCategory = useMemo(() => {
    const category = (currentPoster?.category || initialPoster?.category || '').trim().toLowerCase();
    if (!category) return false;

    // Check for multiple variations of "event planner"
    const eventPlannerVariations = [
      'event planners',
      'event planner',
      'event-planners',
      'event-planner',
      'eventplanners',
      'eventplanner'
    ];

    const result = eventPlannerVariations.some(variation => category.includes(variation));

    // Debug logging for category detection
    console.log('🔍 [EVENT PLANNER DETECTION]', {
      currentPosterCategory: currentPoster?.category,
      initialPosterCategory: initialPoster?.category,
      normalizedCategory: category,
      isEventPlanner: result,
      variations: eventPlannerVariations
    });

    return result;
  }, [currentPoster, initialPoster]);

  // Check if current category is Software Company
  const isSoftwareCompanyCategory = useMemo(() => {
    const category = (currentPoster?.category || initialPoster?.category || '').trim().toLowerCase();
    if (!category) return false;

    // Check for multiple variations of "software company"
    const softwareCompanyVariations = [
      'software companies',
      'software company',
      'software-companies',
      'software-company',
      'softwarecompanies',
      'softwarecompany'
    ];

    const result = softwareCompanyVariations.some(variation => category.includes(variation));

    // Debug logging for category detection
    console.log('🔍 [SOFTWARE COMPANY DETECTION]', {
      currentPosterCategory: currentPoster?.category,
      initialPosterCategory: initialPoster?.category,
      normalizedCategory: category,
      isSoftwareCompany: result,
      variations: softwareCompanyVariations
    });

    return result;
  }, [currentPoster, initialPoster]);

  const templateMatchesServiceFilter = useCallback((template: Template) => {
    if (!isEventPlannerCategory || !selectedServiceFilter) return true;
    const keywords = serviceFilterKeywords[selectedServiceFilter] || [];
    const templateTags = Array.isArray(template.tags)
      ? template.tags
        .filter((tag): tag is string => typeof tag === 'string')
        .map(tag => tag.toLowerCase())
      : [];

    const matches = keywords.some(keyword => templateTags.some(tag => tag.includes(keyword)));

    return matches;
  }, [isEventPlannerCategory, selectedServiceFilter, serviceFilterKeywords]);

  // Function to fetch templates for a specific service filter
  const fetchEventPlannerTemplates = useCallback(async () => {
    if (!isEventPlannerCategory) return;

    // Check if we already have cached EventPlanner templates
    if (serviceFilterTemplates['eventplanner'] && serviceFilterTemplates['eventplanner'].length > 0) {
      console.log('📦 [EVENT PLANNER] Using cached EventPlanner templates');
      return;
    }

    const apiEndpoint = `/api/mobile/posters/category/eventplanner?limit=500`;
    console.log(`📡 [EVENT PLANNER] Fetching all EventPlanner templates from endpoint: ${apiEndpoint}`);
    setIsLoadingServiceFilter(prev => ({ ...prev, eventplanner: true }));

    try {
      const response = await businessCategoryPostersApi.getPostersByCategory('eventplanner', 500);

      console.log(`🔍 [EVENT PLANNER] API Response for ${apiEndpoint}:`, {
        endpoint: apiEndpoint,
        success: response.success,
        message: response.message,
        data: response.data,
        fullResponse: JSON.stringify(response, null, 2)
      });

      if (response.success && response.data.posters) {
        // Convert BusinessCategoryPoster to Template format
        const templates: Template[] = response.data.posters.map((poster: any) => ({
          id: poster.id,
          name: poster.title || poster.name,
          thumbnail: poster.thumbnail,
          category: poster.category,
          downloads: poster.downloads || 0,
          isDownloaded: poster.isDownloaded || false,
          tags: poster.tags || [],
          languages: [], // Will be populated if needed
          previewUrl: poster.imageUrl || poster.downloadUrl,
        }));

        // Cache all EventPlanner templates
        setServiceFilterTemplates(prev => ({
          ...prev,
          eventplanner: templates
        }));

        console.log(`✅ [EVENT PLANNER] Successfully fetched ${templates.length} EventPlanner templates`);

        // Log template tags for debugging
        const allTags = templates.flatMap(t => t.tags || []);
        const uniqueTags = [...new Set(allTags)];
        console.log(`🏷️ [EVENT PLANNER] All unique tags found:`, uniqueTags);

        // Log samples for each service filter
        const serviceKeywords = serviceFilterKeywords;
        Object.keys(serviceKeywords).forEach(service => {
          const keywords = serviceKeywords[service];
          const matchingTemplates = templates.filter(template => {
            const templateTags = Array.isArray(template.tags)
              ? template.tags.map(tag => tag.toLowerCase())
              : [];
            return keywords.some(keyword => templateTags.some(tag => tag.includes(keyword)));
          });
          console.log(`📋 [EVENT PLANNER] ${service}: ${matchingTemplates.length} templates found`);
        });
      } else {
        console.warn(`⚠️ [EVENT PLANNER] No templates found for EventPlanner category`);
        setServiceFilterTemplates(prev => ({
          ...prev,
          eventplanner: []
        }));
      }
    } catch (error) {
      console.error(`❌ [EVENT PLANNER] Error fetching templates:`, error);
      setServiceFilterTemplates(prev => ({
        ...prev,
        eventplanner: []
      }));
    } finally {
      setIsLoadingServiceFilter(prev => ({ ...prev, eventplanner: false }));
    }
  }, [isEventPlannerCategory, serviceFilterTemplates, serviceFilterKeywords]);

  // Fetch EventPlanner templates when EventPlanner category is detected
  useEffect(() => {
    if (isEventPlannerCategory && !serviceFilterTemplates['eventplanner']) {
      console.log('🎯 [EVENT PLANNER] EventPlanner category detected, fetching templates...');
      fetchEventPlannerTemplates();
    }
  }, [isEventPlannerCategory, fetchEventPlannerTemplates, serviceFilterTemplates]);

  const filteredPosters = useMemo(() => {
    // If we have EventPlanner templates and a service filter selected, filter by tags
    if (isEventPlannerCategory && selectedServiceFilter && serviceFilterTemplates['eventplanner']) {
      const eventPlannerTemplates = serviceFilterTemplates['eventplanner'];
      const templatesWithLanguages = eventPlannerTemplates.map(t => mergeTemplateLanguages(t));

      // Filter by service keywords (tags)
      const keywords = serviceFilterKeywords[selectedServiceFilter] || [];
      const filteredByTags = templatesWithLanguages.filter(template => {
        const templateTags = Array.isArray(template.tags)
          ? template.tags.map(tag => tag.toLowerCase())
          : [];
        return keywords.some(keyword => templateTags.some(tag => tag.includes(keyword)));
      });

      // If "All" is selected, return filtered templates with 6-image limit
      if (selectedLanguage === 'all') {
        const limitedTemplates = filteredByTags.slice(0, 6);
        console.log(`[EVENT PLANNER] Total: ${filteredByTags.length}, Showing: ${Math.min(filteredByTags.length, 6)} templates (All language)`);
        return limitedTemplates;
      }

      // Filter by language for service filter templates
      const languageFiltered = filteredByTags.filter(template => {
        const matches = templateContainsLanguage(template, selectedLanguage);
        return matches;
      });

      const limitedTemplates = languageFiltered.slice(0, 6);
      console.log(`[EVENT PLANNER] After language filter: ${languageFiltered.length}, Showing: ${Math.min(languageFiltered.length, 6)} templates (language: ${selectedLanguage})`);
      return limitedTemplates;
    }

    // If we have Software Company category and a category selected, filter by tags
    if (isSoftwareCompanyCategory && selectedSoftwareCategory) {
      const selectedCategoryButton = softwareCategoryButtons.find(btn => btn.id === selectedSoftwareCategory);
      if (selectedCategoryButton && selectedCategoryButton.tags.length > 0) {
        const templatesWithLanguages = allTemplates.map(t => mergeTemplateLanguages(t));
        
        const filteredByCategory = templatesWithLanguages.filter(template => {
          const templateTags = Array.isArray(template.tags)
            ? template.tags.map(tag => tag.toLowerCase())
            : [];
          const templateName = (template.name || '').toLowerCase();
          const templateDescription = (template.description || '').toLowerCase();
          
          return selectedCategoryButton.tags.some(tag => 
            templateTags.some(posterTag => posterTag.includes(tag.toLowerCase())) ||
            templateName.includes(tag.toLowerCase()) ||
            templateDescription.includes(tag.toLowerCase())
          );
        });

        console.log(`[SOFTWARE COMPANY] Filtered ${filteredByCategory.length} templates for category: ${selectedSoftwareCategory}`);

        // If "All" is selected, return ALL filtered templates without language filtering (max 6)
        if (selectedLanguage === 'all') {
          const result = filteredByCategory.slice(0, 6);
          console.log(`[SOFTWARE COMPANY] Returning ${result.length} templates (All language)`);
          return result;
        }

        // Filter by language for software company category templates
        const languageFilteredForSoftware = filteredByCategory.filter(template => {
          const matches = templateContainsLanguage(template, selectedLanguage);
          return matches;
        });

        if (languageFilteredForSoftware.length === 0) {
          console.log(`[SOFTWARE COMPANY] No templates found for language: ${selectedLanguage}`);
          return [];
        }

        // Limit to 6 images after language filtering
        const result = languageFilteredForSoftware.slice(0, 6);
        console.log(`[SOFTWARE COMPANY] Returning ${result.length} templates (language: ${selectedLanguage})`);
        return result;
      }
    }

    // Ensure all templates have languages merged before filtering
    const templatesWithLanguages = allTemplates.map(t => mergeTemplateLanguages(t));

    // If "All" is selected, return ALL templates without any language filtering
    if (selectedLanguage === 'all') {
      const filtered = templatesWithLanguages.filter(templateMatchesServiceFilter);

      return filtered;
    }

    // Filter by language - if no matches, return empty array
    const languageFiltered = templatesWithLanguages.filter(template => {
      const matches = templateContainsLanguage(template, selectedLanguage);
      return matches;
    });

    // If no language matches, show nothing
    if (languageFiltered.length === 0) {
      return [];
    }

    // Then apply service filter if applicable
    const serviceFiltered = languageFiltered.filter(templateMatchesServiceFilter);

    // Return service-filtered results (even if empty, don't fallback to all templates)
    return serviceFiltered;
  }, [allTemplates, selectedLanguage, templateMatchesServiceFilter, calendarDate, greetingCategory, globalBusinessCategory, selectedServiceFilter, serviceFilterTemplates, isSoftwareCompanyCategory, selectedSoftwareCategory, softwareCategoryButtons]);

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

    // CRITICAL: Don't reset if user has manually selected a poster (via swipe or click)
    // Check this FIRST before any other logic that might reset the poster
    if (userSelectedPosterRef.current !== null) {
      return;
    }

    // Skip if we have a loading placeholder with no image
    // BUT allow loading placeholder if it has a thumbnail (for greeting category preview)
    if (initialPosterToUse.id === 'loading' && !initialPosterImage) {
      return;
    }

    // If it's a loading placeholder but has a thumbnail, display it immediately
    // This handles the case when clicking a greeting category - show the category image while templates load
    if (initialPosterToUse.id === 'loading' && initialPosterImage) {
      React.startTransition(() => {
        setCurrentPoster({
          ...initialPosterToUse,
          thumbnail: initialPosterImage,
        } as Template);
      });
      return;
    }

    // Check if initialPoster has changed (different ID means different poster was selected)
    // This handles the case when user navigates back and selects a different image
    const initialPosterId = initialPosterToUse.id;
    const prevId = prevInitialPosterIdRef.current;

    // If initialPoster ID changed, it means a different poster was selected
    // Reset auto-detection tracking so it can work for new poster
    // Also allow auto-detection again when navigating to a new category/poster
    if (prevId !== null && prevId !== initialPosterId) {
      lastAutoDetectedPosterIdRef.current = null; // Reset auto-detection tracking for new poster
      userSelectedPosterRef.current = null; // Clear user selection when navigating from different screen
      // Reset the initial poster added flag when navigating to a different poster
      initialPosterAddedRef.current = false;
      // Only reset manual language selection if it's a completely different poster (not just language change)
      // This preserves user's language choice when navigating within the same category
      if (!userManuallySelectedLanguageRef.current) {
        userManuallySelectedLanguageRef.current = false; // Allow auto-detection for new category/poster
        console.log('⚠️ [LANGUAGE RESET] Reset manual language selection - new category/poster navigation');
      }
      // Clear allTemplates immediately to prevent showing old posters in grid
      // setAllTemplates([]); // REMOVED - This was causing templates to be cleared when switching categories
    }

    // If initialPoster ID changed, update immediately regardless of category type
    // BUT: Don't override if user has manually selected a poster (unless navigating from different screen)
    if (prevId !== null && prevId !== initialPosterId) {
      // Only update if user hasn't manually selected a poster, OR if navigating from different screen
      // (When navigating from different screen, prevId !== initialPosterId means new navigation)
      if (userSelectedPosterRef.current !== null && userSelectedPosterRef.current !== initialPosterId) {
        return;
      }

      // Ensure thumbnail is set from content.background if needed
      let newPoster = mergeTemplateLanguages(initialPosterToUse);
      if (!newPoster.thumbnail && (newPoster as any).content?.background) {
        newPoster = { ...newPoster, thumbnail: (newPoster as any).content.background };
      }

      if (newPoster.thumbnail || (newPoster as any).content?.background) {
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
    // Check userSelectedPosterRef directly - don't compare to currentPoster.id which might be stale
    const hasUserSelection = userSelectedPosterRef.current !== null;

    // Don't reset if user has manually selected a poster (check ref directly, not state)
    // This prevents the useEffect from overriding user selections
    if (hasUserSelection) {
      return;
    }

    // Only reset if currentPoster needs updating and user hasn't selected anything
    if (currentPoster.id === 'loading' ||
      currentPoster.id !== initialPosterId ||
      (!currentPoster.thumbnail && !(currentPoster as any).content?.background)) {
      // Ensure thumbnail is set from content.background if needed
      let newPoster = mergeTemplateLanguages(initialPosterToUse);
      if (!newPoster.thumbnail && (newPoster as any).content?.background) {
        newPoster = { ...newPoster, thumbnail: (newPoster as any).content.background };
      }

      if (newPoster.thumbnail || (newPoster as any).content?.background) {
        setCurrentPoster(newPoster);
        // Clear user selection ref when resetting to initial poster
        userSelectedPosterRef.current = null;
      }
    }
  }, [convertedInitialPoster, currentPoster.id, initialPoster]);

  // Fetch business category posters when global business category is provided
  useEffect(() => {
    if (!globalBusinessCategory) {
      return;
    }

    // FIX #3: If calendarDate is also active, calendar context takes priority.
    // Do NOT fetch business category posters when the user is browsing a specific
    // calendar date — doing so would overwrite the date-scoped allTemplates state.
    if (calendarDate) {
      console.log('🚫 [BUSINESS FETCH] Skipped — calendarDate context is active:', calendarDate);
      return;
    }

    // Track active category to prevent other useEffects from overwriting templates
    let categoryName: string;
    if (typeof globalBusinessCategory === 'string') {
      categoryName = globalBusinessCategory;
    } else {
      categoryName = 'Event Planner'; // fallback
    }

    // Reset language to "All" when switching to different business category
    if (activeCategoryRef.current.type !== 'business' || activeCategoryRef.current.value !== categoryName) {
      console.log('🔄 Business category changed → resetting language to ALL');
      userManuallySelectedLanguageRef.current = false;
      setSelectedLanguage('all');
    }

    activeCategoryRef.current = { type: 'business', value: categoryName };

    const fetchBusinessCategoryPosters = async () => {
      try {
        // Show loading state when starting to fetch
        setIsBusinessCategoryLoading(true);

        const limit = posterLimit || 1000; // Default to 1000 for "My Business", use 5 for other cases
        const apiUrl = `/api/mobile/posters/category/${encodeURIComponent(categoryName)}?limit=${limit}`;
        console.log(`🔍 [MY BUSINESS API] Fetching: ${apiUrl} (limit: ${limit})`);

        // Clear cache for "My Business" to ensure fresh data with new limit
        businessCategoryPostersApi.clearCategoryCache(categoryName);

        const response = await businessCategoryPostersApi.getPostersByCategory(categoryName, limit);

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
              category: poster.category || globalBusinessCategory,
              downloads: poster.downloads || 0,
              isDownloaded: false,
              tags: normalizedTags,
            };


            return template;
          });

          if (convertedTemplates.length > 0) {
            // Set first poster as current poster and others as related
            const ensuredTemplates = convertedTemplates.map(t => mergeTemplateLanguages(t));

            console.log('🔍 [BUSINESS FETCH] Loaded templates:', {
              category: globalBusinessCategory,
              templateCount: ensuredTemplates.length,
              templateIds: ensuredTemplates.map(t => t.id),
              initialPosterId: initialPoster?.id,
              initialPosterThumbnail: initialPoster?.thumbnail
            });

            // Ensure we're still on the same category (prevent race conditions)
            if (activeCategoryRef.current.type !== 'business' || activeCategoryRef.current.value !== categoryName) {
              console.warn('⚠️ [BUSINESS FETCH] Category changed, skipping setAllTemplates:', {
                expectedCategory: globalBusinessCategory,
                activeCategoryType: activeCategoryRef.current.type,
                activeCategoryValue: activeCategoryRef.current.value
              });
              return;
            }

            setAllTemplates(ensuredTemplates);

            // Try to find the initialPoster (the one that was clicked) in the loaded templates
            // Use the clicked poster if it exists, otherwise use the first one
            const ensuredInitialPoster = mergeTemplateLanguages(initialPoster);
            const matchingPoster = ensuredTemplates.find(t => t.id === ensuredInitialPoster.id && ensuredInitialPoster.thumbnail);
            const posterToSet = matchingPoster || ensuredTemplates[0];

            console.log('🔍 [BUSINESS FETCH] Poster selection:', {
              matchingPosterFound: !!matchingPoster,
              matchingPosterId: matchingPoster?.id,
              posterToSetId: posterToSet.id,
              posterToSetTags: posterToSet.tags,
              posterToSetName: posterToSet.name
            });

            setCurrentPoster(posterToSet);

            // ✅ CRITICAL: Update currentId to real template ID when available
            if (posterToSet.id !== 'loading' && !posterToSet.id.startsWith('category_')) {
              setCurrentId(posterToSet.id);
              console.log('🔍 [BUSINESS FETCH] Updated currentId to real template ID:', posterToSet.id);
            }

            // Auto-detect language from the selected poster
            if (!userManuallySelectedLanguageRef.current &&
              lastAutoDetectedPosterIdRef.current !== posterToSet.id &&
              posterToSet.tags && posterToSet.tags.length > 0) {
              const languagesFromTags = extractLanguagesFromTags(posterToSet.tags);
              const availableLanguageIds = ['hindi', 'english'];
              const detectedLanguage = availableLanguageIds.find(langId => {
                const normalizedLangId = langId.toLowerCase();
                return languagesFromTags.some(detectedLang => detectedLang.toLowerCase() === normalizedLangId);
              });

              console.log('🔍 [BUSINESS FETCH] Language detection:', {
                posterId: posterToSet.id,
                tags: posterToSet.tags,
                languagesFromTags,
                detectedLanguage,
                currentLanguage: selectedLanguage
              });

              // Only auto-detect if user hasn't manually selected a language AND language is not "all"
              if (!userManuallySelectedLanguageRef.current && selectedLanguage !== 'all') {
                if (detectedLanguage) {
                  console.log('✅ [BUSINESS FETCH] Setting language to:', detectedLanguage);
                  setSelectedLanguage(detectedLanguage);
                  lastAutoDetectedPosterIdRef.current = posterToSet.id;
                }
              } else {
                // User manually selected language - keep their choice
                console.log('ℹ️ [BUSINESS FETCH] User manually selected language, keeping:', selectedLanguage);
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ [POSTER PLAYER] Error fetching business category posters:', error);
      } finally {
        // Hide loading state regardless of success or error
        setIsBusinessCategoryLoading(false);
      }
    };

    fetchBusinessCategoryPosters();
  // FIX #2: selectedLanguage intentionally removed from deps.
  // Language filtering is done in-memory by the filteredPosters useMemo and
  // does NOT require a new API call. Having selectedLanguage here caused the
  // business-category API to re-fire every time the user pressed a language
  // button, overwriting the date-scoped allTemplates with business posters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalBusinessCategory, posterLimit, initialPoster, setAllTemplates, calendarDate]);

  // Fetch greeting category templates when greetingCategory is provided
  useEffect(() => {
    if (!greetingCategory) {
      return;
    }

    // Clear allTemplates immediately to prevent showing old posters in grid
    setAllTemplates([]);

    // Reset language to "All" when switching to different greeting category
    if (activeCategoryRef.current.type !== 'greeting' || activeCategoryRef.current.value !== greetingCategory) {
      console.log('🔄 Greeting category changed → resetting language to ALL');
      userManuallySelectedLanguageRef.current = false;
      setSelectedLanguage('all');
    }

    // Reset manual language selection when switching categories to allow auto-detection
    // Only reset if user hasn't manually selected a language
    if (!userManuallySelectedLanguageRef.current) {
      userManuallySelectedLanguageRef.current = false;
    }

    // Track active category to prevent other useEffects from overwriting templates
    activeCategoryRef.current = { type: 'greeting', value: greetingCategory };

    const fetchGreetingCategoryTemplates = async () => {
      // Use convertedInitialPoster which has thumbnail properly set for GreetingTemplates
      const posterToMatch = convertedInitialPoster;

      if (!posterToMatch) {
        console.warn('⚠️ [GREETING FETCH] No poster to match, skipping fetch');
        return;
      }

      try {
        // Show loading state when starting to fetch
        setIsGreetingCategoryLoading(true);

        // Normalize category name for search (like HomeScreen does)
        // Convert "Money & Finance" to "money and finance" to match how templates are tagged
        const normalizedCategory = greetingCategory.toLowerCase()
          .replace(/[&]/g, 'and')
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Generate search variations for better matching (e.g., "hiring/vacancy" -> ["hiring", "vacancy", "hiring vacancy"])
        const categoryWords = normalizedCategory.split(/\s+/).filter(word => word.length > 0);
        const searchVariations = [
          greetingCategory.toLowerCase(),
          normalizedCategory,
          ...categoryWords, // Individual words
          categoryWords.join(' '), // Combined words
        ].filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

        // Search with multiple variations to catch all related templates
        // Optimized fetching: Use fast search with limits for initial load, then load more progressively
        // First, get initial batch quickly (50 items) for fast initial render
        const initialLimit = 50;

        const searchPromises = [
          greetingTemplatesService.getTemplates({ category: greetingCategory, limit: initialLimit }),
          greetingTemplatesService.searchTemplates(greetingCategory, undefined, initialLimit),
          greetingTemplatesService.searchTemplates(normalizedCategory, undefined, initialLimit),
          // Also search with individual words for better matching
          ...searchVariations.slice(0, 3).map(variation =>
            greetingTemplatesService.searchTemplates(variation, undefined, initialLimit)
          ),
        ];

        const searchResults = await Promise.all(searchPromises);
        const [categoryTemplates, searchTemplatesOriginal, searchTemplatesNormalized, ...variationResults] = searchResults;

        // Log raw API responses for ALL greeting categories
        const apiResponseData = {
          getTemplatesResponse: {
            count: categoryTemplates.length,
            allTemplates: categoryTemplates.map((t: any) => ({
              id: t.id,
              name: t.name,
              category: t.category,
              tags: t.tags,
              thumbnail: t.thumbnail || t.content?.background
            })),
            allCategories: [...new Set(categoryTemplates.map((t: any) => t.category).filter(Boolean))],
            categoryBreakdown: [...new Set(categoryTemplates.map((t: any) => t.category).filter(Boolean))].map(cat => ({
              category: cat,
              count: categoryTemplates.filter((t: any) => t.category === cat).length,
              templateIds: categoryTemplates.filter((t: any) => t.category === cat).map((t: any) => t.id)
            }))
          },
          searchOriginalResponse: {
            count: searchTemplatesOriginal.length,
            allTemplates: searchTemplatesOriginal.map((t: any) => ({
              id: t.id,
              name: t.name,
              category: t.category,
              tags: t.tags,
              thumbnail: t.thumbnail || t.content?.background
            })),
            allCategories: [...new Set(searchTemplatesOriginal.map((t: any) => t.category).filter(Boolean))],
            categoryBreakdown: [...new Set(searchTemplatesOriginal.map((t: any) => t.category).filter(Boolean))].map(cat => ({
              category: cat,
              count: searchTemplatesOriginal.filter((t: any) => t.category === cat).length,
              templateIds: searchTemplatesOriginal.filter((t: any) => t.category === cat).map((t: any) => t.id)
            }))
          },
          searchNormalizedResponse: {
            count: searchTemplatesNormalized.length,
            allTemplates: searchTemplatesNormalized.map((t: any) => ({
              id: t.id,
              name: t.name,
              category: t.category,
              tags: t.tags,
              thumbnail: t.thumbnail || t.content?.background
            })),
            allCategories: [...new Set(searchTemplatesNormalized.map((t: any) => t.category).filter(Boolean))],
            categoryBreakdown: [...new Set(searchTemplatesNormalized.map((t: any) => t.category).filter(Boolean))].map(cat => ({
              category: cat,
              count: searchTemplatesNormalized.filter((t: any) => t.category === cat).length,
              templateIds: searchTemplatesNormalized.filter((t: any) => t.category === cat).map((t: any) => t.id)
            }))
          },
          variationResponses: variationResults.map((variationResults: any[], index: number) => ({
            variation: searchVariations[index],
            count: variationResults.length,
            allTemplates: variationResults.map((t: any) => ({
              id: t.id,
              name: t.name,
              category: t.category,
              tags: t.tags,
              thumbnail: t.thumbnail || t.content?.background
            })),
            allCategories: [...new Set(variationResults.map((t: any) => t.category).filter(Boolean))],
            categoryBreakdown: [...new Set(variationResults.map((t: any) => t.category).filter(Boolean))].map(cat => ({
              category: cat,
              count: variationResults.filter((t: any) => t.category === cat).length,
              templateIds: variationResults.filter((t: any) => t.category === cat).map((t: any) => t.id)
            }))
          }))
        };

        // Combine all search results and remove duplicates efficiently
        const allSearchResults = [
          ...searchTemplatesOriginal,
          ...searchTemplatesNormalized,
          ...variationResults.flat() // Flatten variation results
        ];
        const combinedTemplates = [...categoryTemplates, ...allSearchResults];

        // Use Set for faster duplicate removal
        const uniqueTemplatesMap = new Map<string, any>();
        combinedTemplates.forEach(template => {
          if (template?.id && !uniqueTemplatesMap.has(template.id)) {
            uniqueTemplatesMap.set(template.id, template);
          }
        });
        const allTemplates = Array.from(uniqueTemplatesMap.values());

        // Log combined results for ALL greeting categories
        const combinedCategories = new Set(allTemplates.map((t: any) => t.category).filter(Boolean));
        const combinedData = {
          totalTemplates: allTemplates.length,
          uniqueCategories: Array.from(combinedCategories),
          categoryBreakdown: Array.from(combinedCategories).map(cat => ({
            category: cat,
            count: allTemplates.filter((t: any) => t.category === cat).length,
            templateIds: allTemplates.filter((t: any) => t.category === cat).map((t: any) => t.id)
          })),
          allTemplates: allTemplates.map((t: any) => ({
            id: t.id,
            name: t.name,
            category: t.category,
            categoryLower: (t.category || '').toLowerCase().trim(),
            expectedCategoryLower: greetingCategory.toLowerCase().trim(),
            matches: (t.category || '').toLowerCase().trim() === greetingCategory.toLowerCase().trim(),
            tags: t.tags,
            thumbnail: t.thumbnail || t.content?.background
          }))
        };

        // Pre-compute normalized category and variations for efficient filtering
        const normalizedCategoryLower = normalizedCategory.toLowerCase();
        const greetingCategoryLower = greetingCategory.toLowerCase();
        const categoryWordsLower = categoryWords.map(w => w.toLowerCase());

        // Optimized filtering: be more lenient to catch all related templates
        const filteredTemplates = allTemplates.filter(template => {
          const templateAny = template as any;
          const templateTags = Array.isArray(templateAny.tags) ? templateAny.tags : [];

          // Quick category match check first (fastest)
          if (template.category) {
            const templateCategoryLower = template.category.toLowerCase();
            // Check if category matches original, normalized, or any word
            if (templateCategoryLower.includes(greetingCategoryLower) ||
              templateCategoryLower.includes(normalizedCategoryLower) ||
              categoryWordsLower.some(word => templateCategoryLower.includes(word))) {
              return true;
            }
          }

          // Then check tags (only if category didn't match)
          if (templateTags.length > 0) {
            return templateTags.some((tag: string) => {
              if (typeof tag !== 'string') return false;
              const tagLower = tag.toLowerCase();
              // Check if tag matches original, normalized, or any word
              return tagLower.includes(greetingCategoryLower) ||
                tagLower.includes(normalizedCategoryLower) ||
                categoryWordsLower.some(word => tagLower.includes(word) || word.includes(tagLower));
            });
          }

          return false;
        });

        // Use filtered templates if available, otherwise fall back to all templates
        // This ensures we always show results even if filtering is too strict
        // Limit to initial batch for fast render
        const templatesToUse = filteredTemplates.length > 0
          ? filteredTemplates.slice(0, initialLimit)
          : allTemplates.slice(0, initialLimit);

        // Load remaining templates in background after initial render (progressive loading)
        if (templatesToUse.length >= initialLimit) {
          InteractionManager.runAfterInteractions(async () => {
            try {
              // Capture values for closure
              const currentCategory = greetingCategory;
              const currentNormalized = normalizedCategory;
              const currentCategoryLower = greetingCategoryLower;
              const currentNormalizedLower = normalizedCategoryLower;
              const currentPoster = posterToMatch;
              const currentVariations = searchVariations;

              // Use same variation search for background loading
              const moreSearchPromises = [
                greetingTemplatesService.getTemplates({ category: currentCategory, limit: 200 }),
                greetingTemplatesService.searchTemplates(currentCategory, undefined, 200),
                greetingTemplatesService.searchTemplates(currentNormalized, undefined, 200),
                ...currentVariations.slice(0, 3).map(variation =>
                  greetingTemplatesService.searchTemplates(variation, undefined, 200)
                ),
              ];

              const moreSearchResults = await Promise.all(moreSearchPromises);
              const [moreCategoryTemplates, moreSearchOriginal, moreSearchNormalized, ...moreVariationResults] = moreSearchResults;

              // Log raw API responses for ALL categories
              const backgroundApiResponseData = {
                getTemplatesResponse: {
                  count: moreCategoryTemplates.length,
                  allTemplates: moreCategoryTemplates.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    category: t.category,
                    tags: t.tags,
                    thumbnail: t.thumbnail || t.content?.background
                  })),
                  allCategories: [...new Set(moreCategoryTemplates.map((t: any) => t.category).filter(Boolean))],
                  categoryBreakdown: [...new Set(moreCategoryTemplates.map((t: any) => t.category).filter(Boolean))].map(cat => ({
                    category: cat,
                    count: moreCategoryTemplates.filter((t: any) => t.category === cat).length,
                    templateIds: moreCategoryTemplates.filter((t: any) => t.category === cat).map((t: any) => t.id)
                  }))
                },
                searchOriginalResponse: {
                  count: moreSearchOriginal.length,
                  allTemplates: moreSearchOriginal.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    category: t.category,
                    tags: t.tags,
                    thumbnail: t.thumbnail || t.content?.background
                  })),
                  allCategories: [...new Set(moreSearchOriginal.map((t: any) => t.category).filter(Boolean))],
                  categoryBreakdown: [...new Set(moreSearchOriginal.map((t: any) => t.category).filter(Boolean))].map(cat => ({
                    category: cat,
                    count: moreSearchOriginal.filter((t: any) => t.category === cat).length,
                    templateIds: moreSearchOriginal.filter((t: any) => t.category === cat).map((t: any) => t.id)
                  }))
                },
                searchNormalizedResponse: {
                  count: moreSearchNormalized.length,
                  allTemplates: moreSearchNormalized.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    category: t.category,
                    tags: t.tags,
                    thumbnail: t.thumbnail || t.content?.background
                  })),
                  allCategories: [...new Set(moreSearchNormalized.map((t: any) => t.category).filter(Boolean))],
                  categoryBreakdown: [...new Set(moreSearchNormalized.map((t: any) => t.category).filter(Boolean))].map(cat => ({
                    category: cat,
                    count: moreSearchNormalized.filter((t: any) => t.category === cat).length,
                    templateIds: moreSearchNormalized.filter((t: any) => t.category === cat).map((t: any) => t.id)
                  }))
                },
                variationResponses: moreVariationResults.map((variationResults: any[], index: number) => ({
                  variation: currentVariations[index],
                  count: variationResults.length,
                  allTemplates: variationResults.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    category: t.category,
                    tags: t.tags,
                    thumbnail: t.thumbnail || t.content?.background
                  })),
                  allCategories: [...new Set(variationResults.map((t: any) => t.category).filter(Boolean))],
                  categoryBreakdown: [...new Set(variationResults.map((t: any) => t.category).filter(Boolean))].map(cat => ({
                    category: cat,
                    count: variationResults.filter((t: any) => t.category === cat).length,
                    templateIds: variationResults.filter((t: any) => t.category === cat).map((t: any) => t.id)
                  }))
                }))
              };
              console.log('📡 [API RESPONSE] Raw API responses (BACKGROUND LOAD) for category:', currentCategory);
              console.log('📡 [API RESPONSE] Background Load Full JSON:', JSON.stringify(backgroundApiResponseData, null, 2));

              const moreSearchTemplates = [
                ...moreSearchOriginal,
                ...moreSearchNormalized,
                ...moreVariationResults.flat()
              ];
              const moreCombined = [...moreCategoryTemplates, ...moreSearchTemplates];

              // Use Set for faster duplicate removal
              const moreUniqueMap = new Map<string, any>();
              moreCombined.forEach(template => {
                if (template?.id && !moreUniqueMap.has(template.id)) {
                  moreUniqueMap.set(template.id, template);
                }
              });

              const allMoreTemplates = Array.from(moreUniqueMap.values());

              // Log backend response to check for category issues
              const categoriesFromBackend = new Set(allMoreTemplates.map((t: any) => t.category).filter(Boolean));

              // STRICT filtering: Only allow templates that EXACTLY match the category
              // For templates with "GENERAL" or empty category, check tags to see if they match
              const moreFiltered = allMoreTemplates.filter(template => {
                const templateCategory = template.category || '';
                const templateCategoryLower = templateCategory.toLowerCase().trim();
                const currentCategoryLowerTrimmed = currentCategoryLower.trim();
                const currentNormalizedLowerTrimmed = currentNormalizedLower.trim();

                // STRICT: Only allow exact match or category that starts with current category + space
                // This prevents "Political" or "Awareness" from matching "Political Awareness"
                // Only "Political Awareness" or "Political Awareness English" will match
                if (templateCategoryLower === currentCategoryLowerTrimmed) {
                  return true; // Exact match: "Political Awareness" === "Political Awareness"
                }

                // Allow if category starts with current category + space (e.g., "Political Awareness English")
                // This allows variations like "Political Awareness Hindi" but NOT "Political" or "Awareness"
                if (templateCategoryLower.startsWith(currentCategoryLowerTrimmed + ' ') ||
                  templateCategoryLower.startsWith(currentNormalizedLowerTrimmed + ' ')) {
                  return true;
                }

                // If category is "GENERAL" or empty, check tags to see if they match the expected category
                // This handles cases where backend returns templates with category="GENERAL" but tags=["Political Awareness"]
                if (!templateCategory || templateCategoryLower === 'general') {
                  const templateTags = Array.isArray(template.tags) ? template.tags : [];
                  const tagsLower = templateTags.map((tag: any) => String(tag).toLowerCase().trim());

                  // Check if any tag exactly matches the expected category
                  if (tagsLower.includes(currentCategoryLowerTrimmed) ||
                    tagsLower.includes(currentNormalizedLowerTrimmed)) {
                    // Set category to expected category so it passes later filter checks
                    template.category = currentCategory;
                    return true;
                  }

                  // Check if any tag contains the expected category (for tags like "Political Awareness English")
                  if (tagsLower.some((tag: string) => tag === currentCategoryLowerTrimmed || tag.startsWith(currentCategoryLowerTrimmed + ' '))) {
                    // Set category to expected category so it passes later filter checks
                    template.category = currentCategory;
                    return true;
                  }

                  // If tags don't match, exclude this template
                  return false;
                }

                // Exclude all other templates - they're from different categories
                // This includes "Political", "Awareness", "Political Campaign", etc.
                return false;
              });

              // Debug: Log sample categories to see what we're comparing
              if (allMoreTemplates.length > 0 && moreFiltered.length === 0) {
                const sampleCategories = allMoreTemplates.slice(0, 10).map((t: any) => ({
                  id: t.id,
                  name: t.name,
                  category: t.category,
                  categoryLower: (t.category || '').toLowerCase().trim(),
                  expected: currentCategoryLower.trim(),
                  matches: (t.category || '').toLowerCase().trim() === currentCategoryLower.trim()
                }));
                const filterDebugData = {
                  sampleCategories,
                  currentCategoryLower: currentCategoryLower.trim(),
                  currentNormalizedLower: currentNormalizedLower.trim(),
                  allCategoriesFromBackend: [...new Set(allMoreTemplates.map((t: any) => t.category).filter(Boolean))]
                };
                console.log('🔍 [GREETING BACKGROUND LOAD] Filter debug - no matches found:');
                console.log('🔍 [GREETING BACKGROUND LOAD] Filter debug Full JSON:', JSON.stringify(filterDebugData, null, 2));
              }

              // Log filtering results
              const categoriesAfterFilter = new Set(moreFiltered.map((t: any) => t.category).filter(Boolean));
              console.log('🔍 [GREETING BACKGROUND LOAD] After filtering:', {
                filteredCount: moreFiltered.length,
                totalCount: allMoreTemplates.length,
                filteredCategories: Array.from(categoriesAfterFilter),
                willUseFiltered: moreFiltered.length > 0,
                willUseAll: moreFiltered.length === 0
              });

              // If filter filtered out everything, don't use all templates as fallback
              // This means none of the templates match the category, so we shouldn't show them
              const finalTemplates = moreFiltered.length > 0
                ? moreFiltered.slice(0, 200)
                : []; // Don't use allMoreTemplates - if filter rejected everything, they're wrong category

              // Update templates if we got more results
              if (finalTemplates.length > initialLimit) {
                const convertedFinal = finalTemplates.map((template: any) => {
                  let normalizedTags: string[] = [];
                  if (Array.isArray(template.tags)) {
                    normalizedTags = template.tags.map((tag: any) => String(tag).trim()).filter((tag: string) => tag.length > 0);
                  } else if (typeof template.tags === 'string') {
                    normalizedTags = template.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
                  }

                  return {
                    id: template.id,
                    name: template.name || 'Greeting Template',
                    thumbnail: template.thumbnail || template.content?.background || '',
                    category: template.category || currentCategory,
                    downloads: template.downloads || 0,
                    isDownloaded: template.isDownloaded || false,
                    tags: normalizedTags,
                  };
                });

                const ensuredFinal = convertedFinal.map(t => {
                  const merged = mergeTemplateLanguages(t);
                  // Only normalize "GENERAL" or empty category if tags match the expected category
                  if (!merged.category || merged.category.toUpperCase() === 'GENERAL') {
                    const templateTags = Array.isArray(merged.tags) ? merged.tags : [];
                    const tagsLower = templateTags.map((tag: any) => String(tag).toLowerCase().trim());
                    const currentCategoryLowerTrimmed = currentCategoryLower.trim();
                    const currentNormalizedLowerTrimmed = currentNormalizedLower.trim();

                    // Check if tags match the expected category
                    if (tagsLower.includes(currentCategoryLowerTrimmed) ||
                      tagsLower.includes(currentNormalizedLowerTrimmed) ||
                      tagsLower.some(tag => tag === currentCategoryLowerTrimmed || tag.startsWith(currentCategoryLowerTrimmed + ' '))) {
                      merged.category = currentCategory;
                    }
                    // If tags don't match, keep category as "GENERAL" or empty - it will be filtered out
                  }
                  return merged;
                });

                // Filter to only include templates that EXACTLY match the current category
                // This is strict to prevent templates from other categories from showing up
                const categoryFilteredFinal = ensuredFinal.filter((template: any) => {
                  const templateCategory = template.category || '';
                  const templateCategoryLower = templateCategory.toLowerCase().trim();
                  const currentCategoryLowerTrimmed = currentCategoryLower.trim();
                  const currentNormalizedLowerTrimmed = currentNormalizedLower.trim();

                  // STRICT: Only allow exact match or category that starts with current category + space
                  // This prevents "Political" or "Awareness" from matching "Political Awareness"
                  // Only "Political Awareness" or "Political Awareness English" will match
                  if (templateCategoryLower === currentCategoryLowerTrimmed) {
                    return true; // Exact match: "Political Awareness" === "Political Awareness"
                  }

                  // Allow if category starts with current category + space (e.g., "Political Awareness English")
                  // This allows variations like "Political Awareness Hindi" but NOT "Political" or "Awareness"
                  if (templateCategoryLower.startsWith(currentCategoryLowerTrimmed + ' ') ||
                    templateCategoryLower.startsWith(currentNormalizedLowerTrimmed + ' ')) {
                    return true;
                  }

                  // Exclude all other templates - they're from different categories
                  // This includes "Political", "Awareness", "Political Campaign", "GENERAL" without matching tags, etc.
                  return false;
                });

                const initialPosterWithLanguages = mergeTemplateLanguages(currentPoster);
                // Ensure the initial poster's category matches the current category
                if (initialPosterWithLanguages.category !== currentCategory) {
                  initialPosterWithLanguages.category = currentCategory;
                }
                
                // Check if initial poster should be added (only once per category)
                const existingIndex = categoryFilteredFinal.findIndex(t => t.id === initialPosterWithLanguages.id);
                let nextTemplates = categoryFilteredFinal;
                
                // Only add initial poster if it hasn't been added yet and doesn't exist in templates
                if (existingIndex === -1 && initialPosterWithLanguages.thumbnail && !initialPosterAddedRef.current) {
                  nextTemplates = [initialPosterWithLanguages, ...categoryFilteredFinal];
                  initialPosterAddedRef.current = true; // Mark as added
                  console.log('➕ [GREETING BACKGROUND] Initial poster added to background load:', {
                    posterId: initialPosterWithLanguages.id,
                    categoryName: currentCategory,
                    templateCount: nextTemplates.length
                  });
                }

                // Log what we're about to set
                const categoriesToSet = new Set(nextTemplates.map((t: any) => t.category).filter(Boolean));
                const categoriesBeforeFilter = new Set(ensuredFinal.map((t: any) => t.category).filter(Boolean));
                console.log('🔍 [GREETING BACKGROUND LOAD] About to set templates:', {
                  templateCountBeforeFilter: ensuredFinal.length,
                  templateCountAfterFilter: categoryFilteredFinal.length,
                  templateCountFinal: nextTemplates.length,
                  categoriesBeforeFilter: Array.from(categoriesBeforeFilter),
                  categoriesAfterFilter: Array.from(categoriesToSet),
                  categoryBreakdown: Array.from(categoriesToSet).map(cat => ({
                    category: cat,
                    count: nextTemplates.filter((t: any) => t.category === cat).length
                  })),
                  filteredOutCount: ensuredFinal.length - categoryFilteredFinal.length,
                  filteredOutCategories: Array.from(categoriesBeforeFilter).filter(cat => !categoriesToSet.has(cat)),
                  currentCategory,
                  activeCategoryRef: activeCategoryRef.current
                });

                // Only set templates if this category is still active
                if (activeCategoryRef.current.type === 'greeting' && activeCategoryRef.current.value === currentCategory) {
                  setAllTemplates(nextTemplates);
                } else {
                  console.log('⚠️ [GREETING BACKGROUND LOAD] Skipped setting allTemplates - category changed during background load.');
                }
              }
            } catch (error) {
              // Silently fail background load - initial templates are already shown
            }
          });
        }

        if (templatesToUse.length > 0) {
          // Log what backend returned BEFORE conversion
          const backendCategories = new Set(templatesToUse.map((t: any) => t.category).filter(Boolean));
          console.log('🔍 [GREETING FETCH] Backend returned templates:', {
            totalTemplates: templatesToUse.length,
            uniqueCategories: Array.from(backendCategories),
            expectedCategory: greetingCategory,
            categoryBreakdown: Array.from(backendCategories).map(cat => ({
              category: cat,
              count: templatesToUse.filter((t: any) => t.category === cat).length,
              sampleIds: templatesToUse.filter((t: any) => t.category === cat).map((t: any) => t.id).slice(0, 3)
            })),
            templatesWithoutCategory: templatesToUse.filter((t: any) => !t.category).length
          });

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
              // Keep original category - don't default to greetingCategory as it might mask wrong categories
              category: template.category || '',
              downloads: template.downloads || 0,
              isDownloaded: template.isDownloaded || false,
              tags: normalizedTags,
            };

            return convertedTemplate;
          });

          // Set first template as current poster and others as related
          // Ensure all templates have languages extracted from tags
          const ensuredTemplates = convertedTemplates.map(t => mergeTemplateLanguages(t));

          // Filter to only include templates that EXACTLY match the current category
          // This is strict to prevent templates from other categories from showing up
          const categoryFilteredTemplates = ensuredTemplates.filter((template: any) => {
            const templateCategory = template.category || '';
            const templateCategoryLower = templateCategory.toLowerCase().trim();
            const greetingCategoryLowerTrimmed = greetingCategoryLower.trim();
            const normalizedCategoryLowerTrimmed = normalizedCategoryLower.trim();

            // STRICT: Only allow exact match or category that starts with current category + space
            // This prevents "Political" or "Awareness" from matching "Political Awareness"
            // Only "Political Awareness" or "Political Awareness English" will match
            if (templateCategoryLower === greetingCategoryLowerTrimmed) {
              return true; // Exact match: "Political Awareness" === "Political Awareness"
            }

            // Allow if category starts with current category + space (e.g., "Political Awareness English")
            // This allows variations like "Political Awareness Hindi" but NOT "Political" or "Awareness"
            if (templateCategoryLower.startsWith(greetingCategoryLowerTrimmed + ' ') ||
              templateCategoryLower.startsWith(normalizedCategoryLowerTrimmed + ' ')) {
              return true;
            }

            // If category is "GENERAL" or empty, check tags to see if they match the expected category
            // This handles cases where backend returns templates with category="GENERAL" but tags=["Political Awareness"]
            if (!templateCategory || templateCategoryLower === 'general') {
              const templateTags = Array.isArray(template.tags) ? template.tags : [];
              const tagsLower = templateTags.map((tag: any) => String(tag).toLowerCase().trim());

              // Check if any tag exactly matches the expected category
              if (tagsLower.includes(greetingCategoryLowerTrimmed) ||
                tagsLower.includes(normalizedCategoryLowerTrimmed)) {
                // Set category to expected category for consistency
                template.category = greetingCategory;
                return true;
              }

              // Check if any tag contains the expected category (for tags like "Political Awareness English")
              if (tagsLower.some((tag: string) => tag === greetingCategoryLowerTrimmed || tag.startsWith(greetingCategoryLowerTrimmed + ' '))) {
                template.category = greetingCategory;
                return true;
              }

              // If tags don't match, exclude this template
              return false;
            }

            // Exclude all other templates - they're from different categories
            // This includes "Political", "Awareness", "Political Campaign", etc.
            return false;
          });

          // Ensure the initially selected poster is present
          // Use convertedInitialPoster which has thumbnail properly set
          const initialPosterWithLanguages = mergeTemplateLanguages(posterToMatch);
          // Ensure initial poster's category matches
          if (initialPosterWithLanguages.category !== greetingCategory) {
            initialPosterWithLanguages.category = greetingCategory;
          }

          // Try to find the initialPoster (the one that was clicked) in the loaded templates
          // First check by ID, then also check by thumbnail URL to handle cases where IDs might differ
          // For GreetingTemplates, also check content.background as it might be the actual image URL
          const initialPosterThumbnail = initialPosterWithLanguages.thumbnail || (initialPosterWithLanguages as any).content?.background || '';
          const initialPosterBackground = (initialPosterWithLanguages as any).content?.background || '';

          const matchingPosterById = categoryFilteredTemplates.find(t => {
            if (t.id !== initialPosterWithLanguages.id) return false;
            // Must have a valid thumbnail/background
            const tThumbnail = t.thumbnail || (t as any).content?.background || '';
            return tThumbnail && (initialPosterThumbnail || initialPosterBackground);
          });

          const matchingPosterByThumbnail = !matchingPosterById && (initialPosterThumbnail || initialPosterBackground)
            ? categoryFilteredTemplates.find(t => {
              const tThumbnail = t.thumbnail || (t as any).content?.background || '';
              // Compare both thumbnail and background URLs
              return (tThumbnail && initialPosterThumbnail && tThumbnail === initialPosterThumbnail) ||
                (tThumbnail && initialPosterBackground && tThumbnail === initialPosterBackground) ||
                (initialPosterBackground && tThumbnail && tThumbnail === initialPosterBackground);
            })
            : null;
          const matchingPoster = matchingPosterById || matchingPosterByThumbnail;

          // Check if matching poster is already in the list
          if (matchingPoster) {
            const matchingPosterIndex = categoryFilteredTemplates.findIndex(t => t.id === matchingPoster.id);
            console.log('🔍 [GREETING FETCH] Matching poster check:', {
              matchingPosterId: matchingPoster.id,
              matchingPosterIndex,
              matchingPosterThumbnail: matchingPoster.thumbnail || (matchingPoster as any).content?.background,
              initialPosterThumbnail,
              initialPosterBackground,
              matchType: matchingPosterById ? 'byId' : matchingPosterByThumbnail ? 'byThumbnail' : 'none'
            });
          }

          // Only add initial poster to list if it's not found in fetched templates AND no match found by thumbnail
          // AND it hasn't been added already (prevent multiple insertions)
          let nextTemplates = categoryFilteredTemplates;
          const existingIndex = categoryFilteredTemplates.findIndex(t => t.id === initialPosterWithLanguages.id);

          console.log('🔍 [GREETING FETCH] Duplicate check:', {
            category: greetingCategory,
            ensuredTemplatesCount: ensuredTemplates.length,
            categoryFilteredTemplatesCount: categoryFilteredTemplates.length,
            ensuredTemplateIds: ensuredTemplates.map(t => t.id).slice(0, 10),
            categoryFilteredTemplateIds: categoryFilteredTemplates.map(t => t.id).slice(0, 10),
            initialPosterId: initialPosterWithLanguages.id,
            initialPosterThumbnail: initialPosterWithLanguages.thumbnail,
            existingIndex,
            matchingPosterFound: !!matchingPoster,
            matchingPosterId: matchingPoster?.id,
            initialPosterAlreadyAdded: initialPosterAddedRef.current,
            willAddInitialPoster: existingIndex === -1 && !matchingPoster && initialPosterWithLanguages.thumbnail && !initialPosterAddedRef.current
          });

          if (existingIndex === -1 && !matchingPoster && initialPosterWithLanguages.thumbnail && !initialPosterAddedRef.current) {
            nextTemplates = [initialPosterWithLanguages, ...categoryFilteredTemplates];
            initialPosterAddedRef.current = true; // Mark as added
            console.log('➕ [GREETING FETCH] Initial poster added to templates (not found in fetched):', {
              initialPosterId: initialPosterWithLanguages.id,
              finalTemplateCount: nextTemplates.length,
              finalTemplateIds: nextTemplates.map(t => t.id)
            });
          }

          // Check for duplicates by ID
          const duplicateIds = nextTemplates.filter((t, index, arr) => arr.findIndex(t2 => t2.id === t.id) !== index).map(t => t.id);

          // Also check for duplicates by thumbnail (same image, different IDs)
          const thumbnailMap = new Map<string, Template[]>();
          nextTemplates.forEach(t => {
            const thumbnail = t.thumbnail || (t as any).content?.background || '';
            if (thumbnail) {
              if (!thumbnailMap.has(thumbnail)) {
                thumbnailMap.set(thumbnail, []);
              }
              thumbnailMap.get(thumbnail)!.push(t);
            }
          });

          const duplicateThumbnails = Array.from(thumbnailMap.entries())
            .filter(([_thumb, templates]) => templates.length > 1)
            .map(([thumb, templates]) => ({ thumbnail: thumb, ids: templates.map(t => t.id) }));

          console.log('🔍 [GREETING FETCH] Final templates:', {
            templateCount: nextTemplates.length,
            templateIds: nextTemplates.map(t => t.id),
            templateThumbnails: nextTemplates.map(t => t.thumbnail || (t as any).content?.background || 'no-thumbnail'),
            duplicateIds,
            duplicateThumbnails,
            matchingPosterId: matchingPoster?.id,
            matchingPosterAppearsCount: matchingPoster ? nextTemplates.filter(t => t.id === matchingPoster.id).length : 0,
            matchingPosterThumbnailAppearsCount: matchingPoster ? nextTemplates.filter(t => {
              const tThumb = t.thumbnail || (t as any).content?.background || '';
              const mThumb = matchingPoster.thumbnail || (matchingPoster as any).content?.background || '';
              return tThumb && mThumb && tThumb === mThumb;
            }).length : 0
          });

          // Check for duplicates before setting
          const uniqueTemplates = Array.from(new Map(nextTemplates.map(t => [t.id, t])).values());
          if (uniqueTemplates.length !== nextTemplates.length) {
            console.warn('⚠️ [GREETING FETCH] Duplicates by ID detected!', {
              originalCount: nextTemplates.length,
              uniqueCount: uniqueTemplates.length,
              duplicateIds
            });
          }

          if (duplicateThumbnails.length > 0) {
            console.warn('⚠️ [GREETING FETCH] Duplicates by thumbnail detected!', {
              duplicateThumbnails
            });
          }

          // Ensure we're still on the same category (prevent race conditions)
          if (activeCategoryRef.current.type !== 'greeting' || activeCategoryRef.current.value !== greetingCategory) {
            console.warn('⚠️ [GREETING FETCH] Category changed, skipping setAllTemplates:', {
              expectedCategory: greetingCategory,
              activeCategoryType: activeCategoryRef.current.type,
              activeCategoryValue: activeCategoryRef.current.value
            });
            return;
          }

          console.log('🔍 [GREETING FETCH] About to set allTemplates:', {
            uniqueTemplatesCount: uniqueTemplates.length,
            uniqueTemplateIds: uniqueTemplates.map(t => t.id),
            greetingCategory: greetingCategory,
            previousAllTemplatesCount: allTemplates.length,
            previousAllTemplatesIds: allTemplates.map(t => t.id),
            activeCategoryRef: activeCategoryRef.current
          });

          // Completely replace allTemplates (don't merge)
          setAllTemplates([...uniqueTemplates]);

          // Set current poster and trigger language detection
          // Use the matching poster if found, otherwise use the first real template
          // IMPORTANT: Don't use posterToMatch if it's the loading placeholder
          let posterToSet: Template | null = matchingPoster || null;

          // If no match found, use the clicked poster ONLY if it's NOT the loading placeholder
          if (!posterToSet) {
            const clickedPosterThumbnail = posterToMatch.thumbnail || (posterToMatch as any).content?.background || '';
            // Only use clicked poster if it has a valid image AND is not the loading placeholder
            if (clickedPosterThumbnail && posterToMatch.id !== 'loading') {
              // Use the clicked poster directly
              posterToSet = posterToMatch;
            } else if (nextTemplates.length > 0) {
              // Fallback to first template if clicked poster is loading placeholder or has no image
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
            posterToSet = { ...posterToSet, thumbnail: (posterToSet as any).content.background };
          }

          const finalPoster = mergeTemplateLanguages(posterToSet);

          console.log('🔍 [GREETING FETCH] Poster selection:', {
            matchingPosterFound: !!matchingPoster,
            matchingPosterId: matchingPoster?.id,
            posterToSetId: posterToSet.id,
            finalPosterId: finalPoster.id,
            finalPosterTags: finalPoster.tags,
            finalPosterName: finalPoster.name,
            isLoadingPlaceholder: finalPoster.id === 'loading'
          });

          // Only update if the poster is actually different to avoid unnecessary re-renders
          setCurrentPoster(prevPoster => {
            if (prevPoster.id === finalPoster.id &&
              prevPoster.thumbnail === finalPoster.thumbnail) {
              return prevPoster; // No change needed
            }
            
            // ✅ CRITICAL: Update currentId to real template ID when available
            if (finalPoster.id !== 'loading' && !finalPoster.id.startsWith('category_')) {
              setCurrentId(finalPoster.id);
              console.log('🔍 [GREETING FETCH] Updated currentId to real template ID:', finalPoster.id);
            }
            
            console.log('🔍 [GREETING FETCH] Setting currentPoster:', {
              prevPosterId: prevPoster.id,
              newPosterId: finalPoster.id,
              newPosterName: finalPoster.name,
              newPosterThumbnail: finalPoster.thumbnail
            });
            return finalPoster;
          });

          // Auto-detect language from the first REAL loaded poster (not the loading placeholder)
          // Use matching poster or first template if finalPoster is still the loading placeholder
          const posterForLanguageDetection = finalPoster.id === 'loading'
            ? (matchingPoster || (nextTemplates.length > 0 ? nextTemplates[0] : null))
            : finalPoster;

          // Skip language detection if we don't have a real poster
          if (!posterForLanguageDetection || posterForLanguageDetection.id === 'loading') {
            console.log('🔍 [GREETING FETCH] Language detection skipped - no real poster available');
          } else {
            const posterForLangWithLanguages = mergeTemplateLanguages(posterForLanguageDetection);

            console.log('🔍 [GREETING FETCH] Language detection check:', {
              category: greetingCategory,
              userManuallySelected: userManuallySelectedLanguageRef.current,
              lastAutoDetectedPosterId: lastAutoDetectedPosterIdRef.current,
              posterId: posterForLangWithLanguages.id,
              posterTags: posterForLangWithLanguages.tags,
              posterName: posterForLangWithLanguages.name,
              posterCategory: posterForLangWithLanguages.category,
              hasTags: !!(posterForLangWithLanguages.tags && posterForLangWithLanguages.tags.length > 0),
              finalPosterId: finalPoster.id,
              usingRealPoster: posterForLanguageDetection.id !== 'loading',
              willDetect: !userManuallySelectedLanguageRef.current &&
                lastAutoDetectedPosterIdRef.current !== posterForLangWithLanguages.id &&
                posterForLangWithLanguages.tags && posterForLangWithLanguages.tags.length > 0
            });

            if (!userManuallySelectedLanguageRef.current &&
              lastAutoDetectedPosterIdRef.current !== posterForLangWithLanguages.id &&
              posterForLangWithLanguages.tags && posterForLangWithLanguages.tags.length > 0) {
              const languagesFromTags = extractLanguagesFromTags(posterForLangWithLanguages.tags);

              console.log('🔍 [GREETING FETCH] Languages from tags:', {
                tags: posterForLangWithLanguages.tags,
                languagesFromTags
              });

              // Only auto-detect if we actually found language keywords
              if (languagesFromTags.length > 0) {
                const availableLanguageIds = ['hindi', 'english'];
                const detectedLanguage = availableLanguageIds.find(langId => {
                  const normalizedLangId = langId.toLowerCase();
                  return languagesFromTags.some(detectedLang => detectedLang.toLowerCase() === normalizedLangId);
                });

                console.log('🔍 [GREETING FETCH] Detection result:', {
                  detectedLanguage,
                  currentLanguage: selectedLanguage,
                  willUpdate: detectedLanguage && detectedLanguage !== selectedLanguage
                });

                if (!userManuallySelectedLanguageRef.current && selectedLanguage !== 'all') {
                  if (detectedLanguage) {
                    console.log('✅ [GREETING FETCH] Setting language to:', detectedLanguage);
                    setSelectedLanguage(detectedLanguage);
                    lastAutoDetectedPosterIdRef.current = posterForLangWithLanguages.id; // Track that we auto-detected for this poster
                  } else {
                    // If no matching language found, default to English for templates without language tags
                    console.log('⚠️ [GREETING FETCH] No matching language found, defaulting to English');
                    setSelectedLanguage('english');
                    lastAutoDetectedPosterIdRef.current = posterForLangWithLanguages.id;
                  }
                } else {
                  // User manually selected language - keep their choice
                  console.log('ℹ️ [GREETING FETCH] User manually selected language, keeping:', selectedLanguage);
                }
              } else {
                // No language keywords found, default to English only if user hasn't manually selected
                if (!userManuallySelectedLanguageRef.current) {
                  console.log('⚠️ [GREETING FETCH] No language keywords in tags, defaulting to English');
                  setSelectedLanguage('english');
                  lastAutoDetectedPosterIdRef.current = posterForLangWithLanguages.id;
                } else {
                  console.log('ℹ️ [GREETING FETCH] User manually selected language, keeping:', selectedLanguage);
                }
              }
            } else {
              console.log('🔍 [GREETING FETCH] Language detection skipped:', {
                reason: userManuallySelectedLanguageRef.current ? 'user manually selected' :
                  lastAutoDetectedPosterIdRef.current === posterForLangWithLanguages.id ? 'already detected for this poster' :
                    !(posterForLangWithLanguages.tags && posterForLangWithLanguages.tags.length > 0) ? 'no tags' : 'unknown'
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ [POSTER PLAYER] Error fetching greeting category templates:', error);
      } finally {
        // Hide loading state regardless of success or error
        setIsGreetingCategoryLoading(false);
      }
    };

    fetchGreetingCategoryTemplates();
  }, [greetingCategory, convertedInitialPoster.id, selectedLanguage, setAllTemplates]);

  // Fetch calendar posters when calendarDate is provided
  useEffect(() => {
    if (!calendarDate) {
      return;
    }

    // Clear allTemplates immediately to prevent showing old posters in grid
    setAllTemplates([]);
    // Reset language to "All" when switching to different calendar date
    if (activeCategoryRef.current.type !== 'calendar' || activeCategoryRef.current.value !== calendarDate) {
      console.log('🔄 Calendar date changed → resetting language to ALL');
      userManuallySelectedLanguageRef.current = false;
      setSelectedLanguage('all');
    }

    // Reset manual language selection when switching categories to allow auto-detection
    // Only reset if user hasn't manually selected a language
    if (!userManuallySelectedLanguageRef.current) {
      userManuallySelectedLanguageRef.current = false;
    }

    // Track active category to prevent other useEffects from overwriting templates
    activeCategoryRef.current = { type: 'calendar', value: calendarDate };

    const fetchCalendarPosters = async () => {
      try {
        const response = await calendarApi.getPostersByDate(calendarDate);

        // Print full JSON response for today's date
        console.log('📅 [CALENDAR API] Full JSON response for date:', calendarDate, JSON.stringify(response, null, 2));

        if (response.success && response.data.posters.length > 0) {

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

          if (convertedTemplates.length > 0) {
            // Set first poster as current poster and others as related
            // Ensure all templates have languages extracted from tags
            const ensuredTemplates = convertedTemplates.map(t => mergeTemplateLanguages(t));

            // Ensure we're still on the same category (prevent race conditions)
            if (activeCategoryRef.current.type !== 'calendar' || activeCategoryRef.current.value !== calendarDate) {
              console.warn('⚠️ [CALENDAR FETCH] Category changed, skipping setAllTemplates:', {
                expectedDate: calendarDate,
                activeCategoryType: activeCategoryRef.current.type,
                activeCategoryValue: activeCategoryRef.current.value
              });
              return;
            }

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
            
            // ✅ CRITICAL: Update currentId to real template ID when available
            if (finalPoster.id !== 'loading' && !finalPoster.id.startsWith('category_')) {
              setCurrentId(finalPoster.id);
              console.log('🔍 [GREETING FETCH] Updated currentId to real template ID:', finalPoster.id);
            }
          }
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

  // Sync state when route params change (only if global business category, greetingCategory, or calendarDate is not provided)
  useEffect(() => {
    // Skip if business category, greeting category, or calendar date is provided (handled by separate useEffects above)
    // IMPORTANT: This check must be FIRST to prevent setting allTemplates when categories are active
    // Also check activeCategoryRef to handle race conditions
    const hasActiveCategory = !!(globalBusinessCategory || greetingCategory || calendarDate);
    const hasActiveCategoryRef = activeCategoryRef.current.type !== null;

    if (hasActiveCategory || hasActiveCategoryRef) {
      console.log('🔍 [INITIAL POSTER SYNC] Skipped - category/calendar provided:', {
        globalBusinessCategory,
        greetingCategory,
        calendarDate,
        hasActiveCategory,
        activeCategoryRef: activeCategoryRef.current,
        hasActiveCategoryRef,
        initialPosterId: initialPoster.id,
        initialRelatedPostersCount: initialRelatedPosters.length
      });
      return;
    }

    console.log('🔍 [INITIAL POSTER SYNC] Running - no category/calendar:', {
      initialPosterId: initialPoster.id,
      initialRelatedPostersCount: initialRelatedPosters.length
    });

    // Clear active category ref since we're not in a category mode
    activeCategoryRef.current = { type: null, value: null };

    // Clear allTemplates immediately when initialPoster changes to prevent showing old posters
    const initialPosterId = initialPoster.id;
    const prevId = prevInitialPosterIdRef.current;
    if (prevId !== null && prevId !== initialPosterId) {
      // setAllTemplates([]); // REMOVED - This was causing templates to be cleared when language detection changes initial poster
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

    templatesWithLanguages.forEach(template => {
      templatesMap.set(template.id, template);
    });

    // Always include the initial poster (ensuring languages too)
    const ensuredInitialPoster = ensureLanguages(initialPoster);
    templatesMap.set(initialPoster.id, ensuredInitialPoster);

    const updatedTemplates = Array.from(templatesMap.values());

    console.warn('⚠️ [INITIAL POSTER SYNC] About to set allTemplates - THIS SHOULD NOT HAPPEN WHEN CATEGORY IS ACTIVE!', {
      updatedTemplatesCount: updatedTemplates.length,
      updatedTemplateIds: updatedTemplates.map(t => t.id),
      globalBusinessCategory,
      greetingCategory,
      calendarDate,
      activeCategoryRef: activeCategoryRef.current,
      stackTrace: new Error().stack?.split('\n').slice(1, 5).join('\n')
    });

    setAllTemplates(updatedTemplates);

    // Update currentPoster when new data arrives
    // Check if initialPoster has changed (different ID means different poster was selected)
    // This handles the case when user navigates back and selects a different image
    setCurrentPoster(prevPoster => {
      // If initialPoster ID is different, it means a new poster was selected - update immediately
      if (prevPoster.id !== initialPoster.id && ensuredInitialPoster.thumbnail) {
        setImageDimensions(null); // Reset image dimensions when poster changes
        // Update the ref to track the new poster ID
        if (prevInitialPosterIdRef.current !== initialPoster.id) {
          prevInitialPosterIdRef.current = initialPoster.id;
        }
        
        // ✅ CRITICAL: Update currentId to real template ID when available
        if (ensuredInitialPoster.id !== 'loading' && !ensuredInitialPoster.id.startsWith('category_')) {
          setCurrentId(ensuredInitialPoster.id);
          console.log('🔍 [INITIAL POSTER CHANGE] Updated currentId to real template ID:', ensuredInitialPoster.id);
        }
        
        return ensuredInitialPoster;
      }

      // If currentPoster is still the loading placeholder or has no thumbnail
      if (prevPoster.id === 'loading' || !prevPoster.thumbnail) {
        // If we have a valid poster with thumbnail, use it
        if (ensuredInitialPoster.thumbnail) {
          // ✅ CRITICAL: Update currentId to real template ID when available
          if (ensuredInitialPoster.id !== 'loading' && !ensuredInitialPoster.id.startsWith('category_')) {
            setCurrentId(ensuredInitialPoster.id);
            console.log('🔍 [INITIAL POSTER CHANGE] Updated currentId to real template ID:', ensuredInitialPoster.id);
          }
          return ensuredInitialPoster;
        }
      }
      // Otherwise, try to find the current poster in the updated templates
      const foundPoster = updatedTemplates.find(t => t.id === prevPoster.id);
      return foundPoster || ensuredInitialPoster;
    });
  }, [initialPoster, initialRelatedPosters, selectedLanguage, globalBusinessCategory, greetingCategory, calendarDate]);

  // Detect language from initial poster on mount
  useEffect(() => {
    // Don't auto-detect if user manually selected "All" or any language
    if (userManuallySelectedLanguageRef.current) {
      console.log('🔍 [INITIAL LANG DETECT] Skipped - user manually selected language');
      return;
    }

    const initialPosterWithLanguages = mergeTemplateLanguages(initialPoster);

    console.log('🔍 [INITIAL LANG DETECT] Starting detection:', {
      posterId: initialPosterWithLanguages.id,
      posterName: initialPosterWithLanguages.name,
      posterTags: initialPosterWithLanguages.tags,
      category: initialPosterWithLanguages.category,
      globalBusinessCategory,
      greetingCategory,
      calendarDate
    });

    // Detect the primary language from the initial poster
    const posterLanguages = Array.isArray(initialPosterWithLanguages.languages)
      ? initialPosterWithLanguages.languages.map((lang: string) => lang.toLowerCase())
      : [];

    const posterTags = Array.isArray(initialPosterWithLanguages.tags) ? initialPosterWithLanguages.tags : [];
    const languagesFromTags = extractLanguagesFromTags(posterTags);
    const allPosterLanguages = Array.from(new Set([...posterLanguages, ...languagesFromTags.map(l => l.toLowerCase())]));

    console.log('🔍 [INITIAL LANG DETECT] Detection data:', {
      posterLanguages,
      posterTags,
      languagesFromTags,
      allPosterLanguages
    });

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

    console.log('🔍 [INITIAL LANG DETECT] Detection result:', {
      detectedLanguage,
      currentLanguage: selectedLanguage,
      lastAutoDetectedPosterId: lastAutoDetectedPosterIdRef.current,
      willUpdate: detectedLanguage && lastAutoDetectedPosterIdRef.current !== initialPoster?.id
    });

    // If a language is detected, switch to it only if user hasn't manually selected
    // Always auto-detect based on the current poster's language
    // Only skip if we've already detected for this poster to avoid duplicate detection
    if (detectedLanguage && lastAutoDetectedPosterIdRef.current !== initialPoster?.id && !userManuallySelectedLanguageRef.current && selectedLanguage !== 'all') {
      console.log('✅ [INITIAL LANG DETECT] Setting language to:', detectedLanguage);
      setSelectedLanguage(detectedLanguage);
      lastAutoDetectedPosterIdRef.current = initialPoster?.id || null;
    } else if (!detectedLanguage) {
      console.log('❌ [INITIAL LANG DETECT] No language detected - keeping current:', selectedLanguage);
    } else if (userManuallySelectedLanguageRef.current) {
      console.log('ℹ️ [INITIAL LANG DETECT] User manually selected language, keeping:', selectedLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPoster?.id]); // Run when initial poster changes

  // Detect language from current poster when business category, greeting category, or calendar posters are loaded
  // This ensures language detection works when clicking category cards or calendar posters
  useEffect(() => {
    // Don't auto-detect if user manually selected "All" or any language
    if (userManuallySelectedLanguageRef.current || selectedLanguage === 'all') {
      console.log('🔍 [CURRENT LANG DETECT] Skipped - language is ALL or user manually selected');
      return;
    }

    // Skip if no currentPoster or if it's a loading placeholder
    if (!currentPoster || currentPoster.id === 'loading' || (!currentPoster.thumbnail && !(currentPoster as any).content?.background)) {
      console.log('🔍 [CURRENT LANG DETECT] Skipped - invalid currentPoster:', {
        hasCurrentPoster: !!currentPoster,
        posterId: currentPoster?.id,
        hasThumbnail: !!currentPoster?.thumbnail
      });
      return;
    }

    // Only run for business category, greeting category, or calendar posters
    if (!globalBusinessCategory && !greetingCategory && !calendarDate) {
      console.log('🔍 [CURRENT LANG DETECT] Skipped - not a category/calendar poster');
      return;
    }

    console.log('🔍 [CURRENT LANG DETECT] Starting detection:', {
      posterId: currentPoster.id,
      posterName: currentPoster.name,
      category: currentPoster.category,
      globalBusinessCategory,
      greetingCategory,
      calendarDate
    });

    const posterWithLanguages = mergeTemplateLanguages(currentPoster);

    // Detect the primary language from tags
    const posterTags = Array.isArray(posterWithLanguages.tags) ? posterWithLanguages.tags : [];

    if (posterTags.length === 0) {
      console.log('🔍 [CURRENT LANG DETECT] Skipped - no tags');
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

    console.log('🔍 [CURRENT LANG DETECT] Detection data:', {
      posterTags,
      languagesFromTags,
      posterLanguages,
      allDetectedLanguages
    });

    // Available language IDs that we support (priority order: hindi, english)
    const availableLanguageIds = ['hindi', 'english'];

    // Find the first matching language from available languages (prioritizing hindi/marathi over english)
    const detectedLanguage = availableLanguageIds.find(langId => {
      const normalizedLangId = langId.toLowerCase();
      return allDetectedLanguages.some(detectedLang => detectedLang.toLowerCase() === normalizedLangId);
    });

    console.log('🔍 [CURRENT LANG DETECT] Detection result:', {
      detectedLanguage,
      currentLanguage: selectedLanguage,
      lastAutoDetectedPosterId: lastAutoDetectedPosterIdRef.current,
      willUpdate: detectedLanguage && lastAutoDetectedPosterIdRef.current !== currentPoster?.id
    });

    // If a language is detected and it's different from current selection, switch to it only if user hasn't manually selected
    // Always auto-detect based on the current poster's language
    // Only skip if we've already detected for this poster to avoid duplicate detection
    if (detectedLanguage && lastAutoDetectedPosterIdRef.current !== currentPoster?.id && !userManuallySelectedLanguageRef.current && selectedLanguage !== 'all') {
      console.log('✅ [CURRENT LANG DETECT] Setting language to:', detectedLanguage);
      setSelectedLanguage(detectedLanguage);
      lastAutoDetectedPosterIdRef.current = currentPoster?.id || null;
    } else if (!detectedLanguage) {
      console.log('❌ [CURRENT LANG DETECT] No language detected');
    } else if (userManuallySelectedLanguageRef.current) {
      console.log('ℹ️ [CURRENT LANG DETECT] User manually selected language, keeping:', selectedLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPoster?.id, globalBusinessCategory, greetingCategory, calendarDate]); // Run when current poster changes for category or calendar

  // Log whenever allTemplates changes to track duplicates
  useEffect(() => {
    if (allTemplates.length > 0) {
      const duplicateIds = allTemplates.filter((t, index, arr) => arr.findIndex(t2 => t2.id === t.id) !== index).map(t => t.id);
      const thumbnailMap = new Map<string, Template[]>();
      allTemplates.forEach(t => {
        const thumbnail = t.thumbnail || (t as any).content?.background || '';
        if (thumbnail) {
          if (!thumbnailMap.has(thumbnail)) {
            thumbnailMap.set(thumbnail, []);
          }
          thumbnailMap.get(thumbnail)!.push(t);
        }
      });
      const duplicateThumbnails = Array.from(thumbnailMap.entries())
        .filter(([_thumb, templates]) => templates.length > 1)
        .map(([thumb, templates]) => ({ thumbnail: thumb, ids: templates.map(t => t.id) }));

      console.log('🔍 [ALL TEMPLATES CHANGED]', {
        templateCount: allTemplates.length,
        templateIds: allTemplates.map(t => t.id),
        templateCategories: allTemplates.map(t => t.category),
        templateNames: allTemplates.map(t => t.name).slice(0, 5), // First 5 names
        duplicateIds,
        duplicateThumbnails,
        globalBusinessCategory,
        greetingCategory,
        calendarDate,
        stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n') // First 3 stack frames
      });

      if (duplicateIds.length > 0 || duplicateThumbnails.length > 0) {
        console.warn('⚠️ [ALL TEMPLATES CHANGED] Duplicates detected!', {
          duplicateIds,
          duplicateThumbnails
        });
      }
    }
  }, [allTemplates]); // Only run when allTemplates changes, not when category changes

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
  }, [allTemplates, selectedLanguage, greetingCategory, globalBusinessCategory, calendarDate]);

  useEffect(() => {
    if (!isEventPlannerCategory && selectedServiceFilter) {
      setSelectedServiceFilter(null);
    }
  }, [isEventPlannerCategory, selectedServiceFilter]);

  // Reset software category when not Software Company category
  useEffect(() => {
    if (!isSoftwareCompanyCategory && selectedSoftwareCategory) {
      setSelectedSoftwareCategory(null);
    }
  }, [isSoftwareCompanyCategory, selectedSoftwareCategory]);

  // Auto-select first filtered image for Software Company category
  useEffect(() => {
    if (
      isSoftwareCompanyCategory &&
      filteredPosters &&
      filteredPosters.length > 0
    ) {
      const firstFilteredPoster = filteredPosters[0];
      
      // Only update if the first filtered poster is different from current selection
      if (currentPoster?.id !== firstFilteredPoster?.id) {
        console.log('[SOFTWARE COMPANY] Auto-selecting first filtered image:', {
          firstPosterId: firstFilteredPoster.id,
          firstPosterName: firstFilteredPoster.name,
          currentPosterId: currentPoster?.id,
          selectedSoftwareCategory
        });
        
        handlePosterSelect(firstFilteredPoster);
      }
    }
  }, [filteredPosters, isSoftwareCompanyCategory, selectedSoftwareCategory, currentPoster?.id, handlePosterSelect]);

  useEffect(() => {
    console.log('🔍 [SERVICE FILTER RENDER CHECK]', { isEventPlannerCategory });
  }, [isEventPlannerCategory]);

  const handlePosterSelect = useCallback((poster: Template) => {
    // Merge template languages to ensure we have all language info
    const posterWithLanguages = mergeTemplateLanguages(poster);

    console.log('🔍 [HANDLE POSTER SELECT] Poster selected:', {
      posterId: posterWithLanguages.id,
      posterName: posterWithLanguages.name,
      posterTags: posterWithLanguages.tags,
      category: posterWithLanguages.category,
      globalBusinessCategory,
      greetingCategory,
      calendarDate
    });

    // Skip update if it's the same poster to prevent unnecessary re-renders
    setCurrentPoster(prevPoster => {
      if (prevPoster?.id === posterWithLanguages.id) {
        return prevPoster;
      }

      return posterWithLanguages;
    });

    // Mark this as a user-selected poster (via swipe or click)
    userSelectedPosterRef.current = posterWithLanguages.id;

    // Always detect language from the selected poster and update filter to show matching posters in grid
    // This ensures the preview grid shows posters matching the selected poster's language
    // Detect the primary language from the poster
    const posterLanguages = Array.isArray(posterWithLanguages.languages)
      ? posterWithLanguages.languages.map((lang: string) => lang.toLowerCase())
      : [];

    const posterTags = Array.isArray(posterWithLanguages.tags) ? posterWithLanguages.tags : [];
    const languagesFromTags = extractLanguagesFromTags(posterTags);
    const allPosterLanguages = Array.from(new Set([...posterLanguages, ...languagesFromTags.map(l => l.toLowerCase())]));

    console.log('🔍 [HANDLE POSTER SELECT] Language detection:', {
      posterTags,
      languagesFromTags,
      posterLanguages,
      allPosterLanguages
    });

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

    console.log('🔍 [HANDLE POSTER SELECT] Detection result:', {
      detectedLanguage,
      currentLanguage: selectedLanguage,
      willUpdate: detectedLanguage && detectedLanguage !== selectedLanguage
    });

    // Update filter to show posters matching the detected language only if user hasn't manually selected
    // This ensures the grid shows posters matching the selected poster's language
    if (detectedLanguage) {
      if (detectedLanguage !== selectedLanguage && !userManuallySelectedLanguageRef.current && selectedLanguage !== 'all') {
        console.log('✅ [HANDLE POSTER SELECT] Setting language to:', detectedLanguage);
        setSelectedLanguage(detectedLanguage);
      } else if (userManuallySelectedLanguageRef.current) {
        console.log('ℹ️ [HANDLE POSTER SELECT] User manually selected language, keeping:', selectedLanguage);
      } else {
        console.log('ℹ️ [HANDLE POSTER SELECT] Language already set to:', detectedLanguage);
      }
      lastAutoDetectedPosterIdRef.current = posterWithLanguages?.id || null;
      // Only reset manual language selection if user hasn't manually selected a language
      // This preserves user's language choice when switching between posters
      if (!userManuallySelectedLanguageRef.current) {
        userManuallySelectedLanguageRef.current = false;
      }
    } else {
      // No language detected in poster - keep current filter
      // If "All" is selected, keep it; otherwise keep current language filter
      console.log('❌ [HANDLE POSTER SELECT] No language detected - keeping current:', selectedLanguage);
      lastAutoDetectedPosterIdRef.current = posterWithLanguages?.id || null;
    }
  }, [selectedLanguage, globalBusinessCategory, greetingCategory, calendarDate]);

  const currentPosterIndex = useMemo(() => {
    if (!currentPoster || !filteredPosters.length) {
      return -1;
    }
    // Try to find by ID first
    let index = filteredPosters.findIndex(template => template.id === currentPoster.id);

    // If not found by ID, try to find by thumbnail URL (for cases where IDs might differ)
    if (index === -1) {
      const currentThumbnail = currentPoster.thumbnail || (currentPoster as any).content?.background || '';
      if (currentThumbnail) {
        index = filteredPosters.findIndex(template => {
          const templateThumbnail = template.thumbnail || (template as any).content?.background || '';
          return templateThumbnail === currentThumbnail;
        });
      }
    }

    return index;
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
      // If current poster not found in filteredPosters, check if it matches the first poster
      // If it does, treat it as index 0 and go to index 1
      if (currentPoster && filteredPosters.length > 0 && filteredPosters[0].id === currentPoster.id) {
        if (filteredPosters.length > 1) {
          showPosterAtIndex(1);
        }
        return;
      }
      // Otherwise, go to first poster
      showPosterAtIndex(0);
      return;
    }
    const nextIndex = currentPosterIndex + 1;
    if (nextIndex < filteredPosters.length) {
      showPosterAtIndex(nextIndex);
    }
  }, [currentPosterIndex, filteredPosters.length, showPosterAtIndex, currentPoster, filteredPosters]);

  const goToPreviousPoster = useCallback(() => {
    if (currentPosterIndex === -1) {
      // If current poster not found in filteredPosters, check if it matches the first poster
      // If it does, we're already at the first, so don't go anywhere
      if (currentPoster && filteredPosters.length > 0 && filteredPosters[0].id === currentPoster.id) {
        return; // Already at first poster
      }
      // Otherwise, go to first poster
      showPosterAtIndex(0);
      return;
    }
    const previousIndex = currentPosterIndex - 1;
    if (previousIndex >= 0) {
      showPosterAtIndex(previousIndex);
    }
  }, [currentPosterIndex, showPosterAtIndex, currentPoster, filteredPosters]);

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

  // Calculate number of columns: 4 for tablets or unfolded fold phones, 3 for regular phones
  const numColumns = useMemo(() => {
    const columns = (isTabletDevice || isFoldPhoneUnfolded) ? 4 : 3;
    // Ensure numColumns is always a valid number
    return isNaN(columns) || columns <= 0 ? 3 : columns;
  }, [isTabletDevice, isFoldPhoneUnfolded]);

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
    // ✅ SAFETY: Use ID as primary source of truth
    if (!currentId || currentId === 'loading') {
      console.error('❌ Cannot navigate - invalid template ID');
      return;
    }

    console.log("➡️ Navigating to PosterEditorScreen with type:", type);

    navigation.navigate('PosterEditor', {
      selectedImage: {
        uri: getHighQualityImageUrl(currentPoster),
        title: currentPoster.name,
        description: currentPoster.category,
      },
      selectedLanguage: selectedLanguage,
      selectedTemplateId: currentId,  // ✅ PRIMARY DATA - ID flows unchanged
      selectedTemplate: JSON.stringify(currentPoster),
      posterCategory: currentPoster.category,
      type: type,
      categoryName: categoryName
    });
  }, [navigation, currentPoster, selectedLanguage, getHighQualityImageUrl, type, categoryName, currentId]);

  const handleNextPress = useCallback(() => {
    // ✅ SAFETY: Use ID as primary validation
    if (!currentId || currentId === 'loading' || isTemplateLoading || !currentPoster?.thumbnail) {
      console.log('❌ Cannot navigate - invalid template ID or still loading');
      return;
    }
    
    navigateToPosterEditor();
  }, [navigateToPosterEditor, isTemplateLoading, currentPoster, currentId]);

  // Compute image props
  const imageProps = useMemo(() => {
    const thumbnailUri = currentPoster?.thumbnail || (currentPoster as any)?.content?.background || '';
    const fullImageUri = getHighQualityImageUrl(currentPoster);
    const imageKey = `poster-${currentPoster?.id || 'none'}-${fullImageUri || thumbnailUri || ''}`;

    return {
      key: imageKey,
      thumbnailUri,
      fullImageUri
    };
  }, [currentPoster?.id, currentPoster, getHighQualityImageUrl]);

  const renderRelatedPoster = useCallback(({ item }: { item: Template }) => {
    // Prioritize thumbnailUrl for grid preview performance (smaller, optimized images)
    // Fallback to thumbnail, then imageUrl for compatibility
    const thumbnailUrl = (item as any).thumbnailUrl || item.thumbnail || '';

    // Check if this item is selected - compare by ID first, then by thumbnail URL as fallback
    // Use currentPoster directly for more reliable comparison
    let isSelected = false;
    if (currentPoster) {
      // First check by ID
      isSelected = currentPoster.id === item.id;

      // If IDs don't match, check by thumbnail URL as fallback
      if (!isSelected) {
        const currentThumbnail = currentPoster.thumbnail || (currentPoster as any).content?.background || '';
        const itemThumbnail = item.thumbnail || (item as any).content?.background || '';
        if (currentThumbnail && itemThumbnail && currentThumbnail === itemThumbnail) {
          isSelected = true;
        }
      }
    }

    return (
      <RelatedPosterItem
        item={item}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        imageUrl={thumbnailUrl}
        onPress={handlePosterSelect}
        isSelected={isSelected}
        overlayColors={previewOverlayColors}
      />
    );
  }, [cardWidth, cardHeight, handlePosterSelect, currentPoster, previewOverlayColors]);


  // Animated skeleton component for loading state
  const SkeletonItem = useCallback(() => {
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
    }, [shimmerAnim]);

    const shimmerTranslateX = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-cardWidth * 1.5, cardWidth * 1.5],
    });

    return (
      <View
        style={[
          styles.relatedPosterItem,
          {
            width: cardWidth,
            height: cardHeight,
            backgroundColor: '#f0f0f0',
            borderRadius: moderateScale(8),
            overflow: 'hidden',
          }
        ]}
      >
        {/* Shimmer animation overlay */}
        <Animated.View
          style={[
            styles.skeletonShimmer,
            {
              transform: [{ translateX: shimmerTranslateX }],
            },
          ]}
        />
        {/* Placeholder content structure */}
        <View style={styles.skeletonContent}>
          {/* Main image area */}
          <View style={styles.skeletonImage} />
          {/* Text placeholder at bottom */}
          <View style={styles.skeletonTextContainer}>
            <View style={[styles.skeletonTextLine, { width: '70%' }]} />
            <View style={[styles.skeletonTextLine, { width: '50%', marginTop: 4 }]} />
          </View>
        </View>
      </View>
    );
  }, [cardWidth, cardHeight]);

  // Generate skeleton data for loading state
  const skeletonData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => ({ id: `skeleton-${index}` }));
  }, []);

  // Render skeleton item for FlatList
  const renderSkeletonItem = useCallback(() => {
    return <SkeletonItem />;
  }, [SkeletonItem]);

  const isNextDisabled = isTemplateLoading || !currentPoster?.thumbnail || !currentId || currentId === 'loading';

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
                {calendarDate
                  ? (() => {
                    const date = new Date(calendarDate);
                    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                  })()
                  : currentPoster?.category || greetingCategory || globalBusinessCategory || 'Templates'}
              </Text>
            </LinearGradient>
          </View>

          <TouchableOpacity
            onPress={handleNextPress}
            disabled={isNextDisabled}
            style={[
              styles.headerTextButton,
              isNextDisabled && { opacity: 0.5 }
            ]}
            activeOpacity={isNextDisabled ? 1 : 0.85}
          >
            <LinearGradient
              colors={isNextDisabled ? ['#ccc', '#999'] : [theme.colors.secondary, theme.colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerTextButtonGradient}
            >
              <Text style={styles.headerButtonText}>
                {isNextDisabled ? 'Loading...' : 'Next'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Compact Poster Section */}
        <View
          style={[styles.posterContainer, { height: computedPreviewHeight, width: '100%' }]}
          {...swipeResponder.panHandlers}
          collapsable={false}
        >
          <LazyFullImage
            key={imageProps.key}
            thumbnailUri={imageProps.thumbnailUri}
            fullImageUri={imageProps.fullImageUri}
            style={styles.posterImage}
            resizeMode="contain"
            loadOnMount={true}
            preload={true}
            quality="high"
            maxWidth={2400}
            showLoader={false}
          />
        </View>

        {/* Language Filter Buttons or Subscription Message - Horizontal below preview */}
        {shouldShowSubscriptionMessage ? (
          // Show subscription message for business categories from HomeScreen
          <View style={styles.subscriptionMessageContainer}>
            <Text style={styles.subscriptionMessageTitle}>For Premium images — Subscribe Now.</Text>
          </View>
        ) : (
          // Show language filter buttons for all other cases
          <View style={styles.languageFilterContainer}>
            {languages.map((language) => {
              const isSelected = selectedLanguage === language.id;
              return (
                <TouchableOpacity
                  key={language.id}
                  style={[
                    styles.languageFilterButton,
                    isSelected && styles.languageFilterButtonSelected
                  ]}
                  onPress={() => handleLanguageChange(language.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isSelected
                      ? [theme.colors.secondary, theme.colors.primary]
                      : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.05)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.languageFilterButtonGradient}
                  >
                    <Text style={[
                      styles.languageFilterButtonText,
                      isSelected && styles.languageFilterButtonTextSelected
                    ]}>
                      {language.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Category buttons for Software Company */}
        {isSoftwareCompanyCategory && (
          <View style={styles.serviceFilterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryButtonsScrollContent}
              nestedScrollEnabled={true}
            >
              {softwareCategoryButtons.map((category) => {
                const isCategoryActive = selectedSoftwareCategory === category.id;
                
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.softwareCategoryButton,
                      isCategoryActive && styles.serviceFilterButtonActive
                    ]}
                    onPress={() => {
                      const newCategory = selectedSoftwareCategory === category.id ? null : category.id;
                      setSelectedSoftwareCategory(newCategory);
                      
                      if (newCategory) {
                        console.log(`[SOFTWARE COMPANY] Category selected: ${newCategory}`);
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[theme.colors.secondary, theme.colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.serviceFilterButtonGradient,
                        !isCategoryActive && styles.serviceFilterButtonGradientInactive
                      ]}
                    >
                      <Text style={[
                        styles.serviceFilterButtonText,
                        isCategoryActive && styles.serviceFilterButtonTextActive,
                        !isCategoryActive && styles.serviceFilterButtonTextInactive
                      ]} numberOfLines={2} ellipsizeMode="tail">
                        {category.name}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

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
                  onPress={() => {
                    const newFilter = selectedServiceFilter === filterKey ? null : filterKey;
                    setSelectedServiceFilter(newFilter);

                    // Fetch templates if a filter is selected (no need to call API, templates are already fetched)
                    if (newFilter) {
                      console.log(`🎯 [EVENT PLANNER] Service filter selected: ${newFilter}`);
                    }
                  }}
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
                      {isLoadingServiceFilter[filterKey] ? 'Loading...' : labelMap[filterKey]}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Compact Related Posters Section */}
        <View style={styles.relatedSection}>
          {isBusinessCategoryLoading || isGreetingCategoryLoading ? (
            <FlatList
              data={skeletonData}
              renderItem={renderSkeletonItem}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              key={`skeleton-grid-${numColumns}`}
              columnWrapperStyle={styles.relatedGrid}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.relatedList}
              style={styles.relatedFlatList}
              removeClippedSubviews={true}
              maxToRenderPerBatch={6}
              windowSize={3}
              initialNumToRender={6}
            />
          ) : filteredPosters.length > 0 ? (
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
              windowSize={5}
              initialNumToRender={isTabletDevice ? 8 : 6}
              updateCellsBatchingPeriod={100}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig.current}
            />
          ) : (
            <View style={styles.noPostersContainer}>
              {selectedLanguage === 'all' ? (
                <>
                  <Text style={styles.noPostersText}>
                    No templates available
                  </Text>
                  <Text style={styles.noPostersSubtext}>
                    Try refreshing or selecting a different category
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.noPostersText}>
                    No templates available in {languages.find(lang => lang.id === selectedLanguage)?.name}
                  </Text>
                  <Text style={styles.noPostersSubtext}>
                    Try selecting "All" or a different language
                  </Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Safe Area Bottom Spacing */}
        <View style={{ height: insets.bottom }} />
      </LinearGradient>
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
  relatedPosterLoadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  relatedPosterItem: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(2),
    },
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(4),
    elevation: 3,
    borderWidth: moderateScale(0.5),
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: moderateScale(6),
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
  softwareCategoryButton: {
    alignSelf: 'flex-start',
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
    paddingHorizontal: moderateScale(12),
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
  serviceFilterButtonTextInactive: {
    color: 'rgba(255,255,255,0.7)',
  },
  categoryButtonsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    gap: moderateScale(10),
    flexGrow: 1,
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
  subscriptionMessageContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    marginHorizontal: moderateScale(16),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(4),
  },
  subscriptionMessageTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
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
    overflow: 'hidden',
    borderRadius: moderateScale(8),
  },
  languageFilterButtonTextSelected: {
    color: '#FFFFFF',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  skeletonContent: {
    flex: 1,
    padding: moderateScale(4),
  },
  skeletonImage: {
    flex: 1,
    backgroundColor: '#e8e8e8',
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  skeletonTextContainer: {
    paddingHorizontal: moderateScale(2),
  },
  skeletonTextLine: {
    height: moderateScale(8),
    backgroundColor: '#e0e0e0',
    borderRadius: moderateScale(4),
    marginBottom: moderateScale(2),
  },
});

export default PosterPlayerScreen;

