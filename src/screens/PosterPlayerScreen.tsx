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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackParamList } from '../navigation/AppNavigator';
import { Template } from '../services/dashboard';
import { useTheme } from '../context/ThemeContext';
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

type PosterPlayerScreenRouteProp = RouteProp<MainStackParamList, 'PosterPlayer'>;
type PosterPlayerScreenNavigationProp = StackNavigationProp<MainStackParamList, 'PosterPlayer'>;

const PosterPlayerScreen: React.FC = () => {
  const { theme } = useTheme();
  const themeColors = theme.colors || {};
  const primaryColor = themeColors.primary || '#764ba2';
  const secondaryColor = themeColors.secondary || themeColors.primary || '#667eea';
  const navigation = useNavigation<PosterPlayerScreenNavigationProp>();
  const route = useRoute<PosterPlayerScreenRouteProp>();
  const insets = useSafeAreaInsets();
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
  
  const { 
    selectedPoster: initialPoster, 
    relatedPosters: initialRelatedPosters,
    businessCategory,
    greetingCategory,
    originScreen,
    posterLimit,
    calendarDate,
  } = route.params;
  const [currentPoster, setCurrentPoster] = useState<Template>(initialPoster);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
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
      console.warn('⚠️ No thumbnail URL found for poster:', poster.id);
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


  const filteredPosters = useMemo(() => {
    // Ensure all templates have languages merged before filtering
    const templatesWithLanguages = allTemplates.map(t => mergeTemplateLanguages(t));
    
    // Debug logging for all category types
    if (calendarDate || greetingCategory || businessCategory) {
      const categoryType = calendarDate ? 'calendar' : greetingCategory ? 'greeting' : 'business';
      console.log(`🔍 [LANGUAGE FILTER] Filtering ${categoryType} posters:`, {
        selectedLanguage,
        totalTemplates: templatesWithLanguages.length,
        sampleTemplates: templatesWithLanguages.slice(0, 3).map(t => ({
          id: t.id,
          name: t.name,
          tags: t.tags,
          languages: t.languages,
          willMatchEnglish: templateContainsLanguage(t, 'english'),
          willMatchHindi: templateContainsLanguage(t, 'hindi'),
        }))
      });
    }
    
    // If "All" is selected, skip language filtering
    let languageFiltered: Template[];
    if (selectedLanguage === 'all') {
      languageFiltered = templatesWithLanguages;
    } else {
      // Filter by language - if no matches, return empty array
      languageFiltered = templatesWithLanguages.filter(template => {
        const matches = templateContainsLanguage(template, selectedLanguage);
        if ((calendarDate || greetingCategory || businessCategory) && !matches) {
          // Debug logging for filtered out posters
          const categoryType = calendarDate ? 'calendar' : greetingCategory ? 'greeting' : 'business';
          console.log(`🔍 [LANGUAGE FILTER] ${categoryType} poster "${template.name}" (${template.id}) filtered out:`, {
            tags: template.tags,
            languages: template.languages,
            selectedLanguage,
            matches,
            matchDetails: {
              hasLanguagesArray: Array.isArray(template.languages) && template.languages.length > 0,
              languagesArray: template.languages,
              tagsLength: template.tags.length,
              extractedLanguages: extractLanguagesFromTags(template.tags),
            }
          });
        }
        return matches;
      });
      
      // If no language matches, show nothing
      if (languageFiltered.length === 0) {
        const categoryType = calendarDate ? 'calendar' : greetingCategory ? 'greeting' : businessCategory ? 'business' : 'unknown';
        console.log(`⚠️ [LANGUAGE FILTER] No ${categoryType} posters match language:`, selectedLanguage, {
          totalTemplates: templatesWithLanguages.length,
          allTemplatesDetails: templatesWithLanguages.map(t => ({
            id: t.id,
            name: t.name,
            tags: t.tags,
            languages: t.languages,
            extractedLanguages: extractLanguagesFromTags(t.tags),
          }))
        });
        return [];
      }
      
      const categoryType = calendarDate ? 'calendar' : greetingCategory ? 'greeting' : businessCategory ? 'business' : 'unknown';
      console.log(`✅ [LANGUAGE FILTER] ${languageFiltered.length} ${categoryType} posters match language "${selectedLanguage}"`);
    }
    
    // Then apply service filter if applicable
    const serviceFiltered = languageFiltered.filter(templateMatchesServiceFilter);

    // Return service-filtered results (even if empty, don't fallback to all templates)
    return serviceFiltered;
  }, [allTemplates, selectedLanguage, templateMatchesServiceFilter, calendarDate, greetingCategory, businessCategory]);

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

  // Watch for route param changes and update currentPoster when real data arrives
  useEffect(() => {
    // Skip if we have a loading placeholder
    if (initialPoster.id === 'loading' || !initialPoster.thumbnail) {
      return;
    }

    // If currentPoster is still the loading placeholder, update it
    if (currentPoster.id === 'loading' || !currentPoster.thumbnail) {
      const newPoster = mergeTemplateLanguages(initialPoster);
      if (newPoster.thumbnail) {
        console.log('🔄 [POSTER PLAYER] Updating currentPoster with loaded data:', newPoster.id);
        setCurrentPoster(newPoster);
      }
    }
  }, [initialPoster, currentPoster]);

  // Fetch business category posters when businessCategory is provided
  useEffect(() => {
    if (!businessCategory) {
      return;
    }

    const fetchBusinessCategoryPosters = async () => {
      try {
        const limit = posterLimit || 5; // Default to 5 if not specified, use 200 for "My Business"
        console.log('📡 [POSTER PLAYER] Fetching business category posters for:', businessCategory, 'with limit:', limit);
        const response = await businessCategoryPostersApi.getPostersByCategory(businessCategory, limit);
        
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
            setCurrentPoster(ensuredTemplates[0]);
            
            console.log('✅ [POSTER PLAYER] Loaded', ensuredTemplates.length, 'business category posters');
            if (__DEV__ && ensuredTemplates[0]?.tags) {
              console.log('📋 [POSTER PLAYER] First poster tags:', ensuredTemplates[0].tags);
            }
          }
        }
      } catch (error) {
        console.error('❌ [POSTER PLAYER] Error fetching business category posters:', error);
      }
    };

    fetchBusinessCategoryPosters();
  }, [businessCategory, posterLimit]);

  // Fetch greeting category templates when greetingCategory is provided
  useEffect(() => {
    if (!greetingCategory) {
      return;
    }

    const fetchGreetingCategoryTemplates = async () => {
      try {
        console.log('📡 [POSTER PLAYER] Fetching greeting category templates for:', greetingCategory);
        
        // Use getTemplates with category filter and limit of 200 to get templates
        // Also use searchTemplates to ensure we get templates with matching tags
        const [categoryTemplates, searchTemplates] = await Promise.all([
          greetingTemplatesService.getTemplates({ category: greetingCategory, limit: 200 }),
          greetingTemplatesService.searchTemplates(greetingCategory)
        ]);
        
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
        const filteredTemplates = allTemplates.filter(template => {
          const templateAny = template as any;
          const templateTags = Array.isArray(templateAny.tags) ? templateAny.tags : [];
          // Check if any tag contains the category name (case-insensitive)
          const hasMatchingTag = templateTags.some((tag: string) => 
            typeof tag === 'string' && tag.toLowerCase().includes(greetingCategory.toLowerCase())
          );
          // Also check if category matches
          const categoryMatch = template.category?.toLowerCase().includes(greetingCategory.toLowerCase());
          return hasMatchingTag || categoryMatch;
        });
        
        // Use filtered templates if available, otherwise use all templates
        // Limit to 200 templates (as requested by user for general categories)
        const templatesToUse = filteredTemplates.length > 0 
          ? filteredTemplates.slice(0, 200)
          : allTemplates.slice(0, 200);
        
        console.log(`✅ [POSTER PLAYER] Loaded ${templatesToUse.length} templates for greeting category: ${greetingCategory}`);
        
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

            if (__DEV__ && normalizedTags.length > 0) {
              console.log(`📋 [GREETING CONVERSION] Template ${convertedTemplate.id} tags:`, normalizedTags);
            }

            return convertedTemplate;
          });

          // Set first template as current poster and others as related
          // Ensure all templates have languages extracted from tags
          const ensuredTemplates = convertedTemplates.map(t => mergeTemplateLanguages(t));

          // Log language extraction for debugging
          if (__DEV__) {
            console.log('📋 [GREETING TEMPLATES] Language extraction results:');
            ensuredTemplates.slice(0, 5).forEach((template, index) => {
              const languagesFromTags = extractLanguagesFromTags(template.tags);
              console.log(`  Template ${index + 1} (${template.name}):`, {
                tags: template.tags,
                languages: template.languages,
                languagesFromTags: languagesFromTags,
                willMatchEnglish: templateContainsLanguage(template, 'english'),
                willMatchHindi: templateContainsLanguage(template, 'hindi'),
              });
            });
          }

          // Ensure the initially selected poster is present
          const initialPosterWithLanguages = mergeTemplateLanguages(initialPoster);
          const existingIndex = ensuredTemplates.findIndex(t => t.id === initialPosterWithLanguages.id);
          let nextTemplates = ensuredTemplates;
          if (existingIndex === -1 && initialPosterWithLanguages.thumbnail) {
            nextTemplates = [initialPosterWithLanguages, ...ensuredTemplates];
          }

          const matchingPoster = nextTemplates.find(t => t.id === initialPosterWithLanguages.id && initialPosterWithLanguages.thumbnail);
          setAllTemplates(nextTemplates);
          
          // Set current poster and trigger language detection
          const posterToSet = matchingPoster || nextTemplates[0];
          const finalPoster = mergeTemplateLanguages(posterToSet);
          setCurrentPoster(finalPoster);
          
          // Auto-detect language from the first poster's tags if language is "all"
          // Only auto-detect if we actually find language keywords in tags
          if (selectedLanguage === 'all' && finalPoster.tags && finalPoster.tags.length > 0) {
            const languagesFromTags = extractLanguagesFromTags(finalPoster.tags);
            
            // Only auto-detect if we actually found language keywords
            if (languagesFromTags.length > 0) {
              const availableLanguageIds = ['hindi', 'english'];
              const detectedLanguage = availableLanguageIds.find(langId => {
                const normalizedLangId = langId.toLowerCase();
                return languagesFromTags.some(detectedLang => detectedLang.toLowerCase() === normalizedLangId);
              });
              
              if (detectedLanguage) {
                console.log(`🔄 [GREETING TEMPLATES] Auto-detecting language: ${detectedLanguage} from tags:`, finalPoster.tags);
                setSelectedLanguage(detectedLanguage);
              } else {
                // If no matching language found, default to English for templates without language tags
                console.log(`ℹ️ [GREETING TEMPLATES] No language detected from tags, defaulting to English. Tags:`, finalPoster.tags);
                setSelectedLanguage('english');
              }
            } else {
              // No language keywords found in tags, default to English
              console.log(`ℹ️ [GREETING TEMPLATES] No language keywords found in tags, defaulting to English. Tags:`, finalPoster.tags);
              setSelectedLanguage('english');
            }
          }
          
          console.log('✅ [POSTER PLAYER] Loaded', ensuredTemplates.length, 'greeting category templates');
          if (__DEV__ && ensuredTemplates[0]?.tags) {
            console.log('📋 [POSTER PLAYER] First greeting template tags:', ensuredTemplates[0].tags);
            console.log('📋 [POSTER PLAYER] All templates tags:', ensuredTemplates.map(t => ({ id: t.id, tags: t.tags })));
          }
        }
      } catch (error) {
        console.error('❌ [POSTER PLAYER] Error fetching greeting category templates:', error);
      }
    };

    fetchGreetingCategoryTemplates();
  }, [greetingCategory]);

  // Fetch calendar posters when calendarDate is provided
  useEffect(() => {
    if (!calendarDate) {
      return;
    }

    const fetchCalendarPosters = async () => {
      try {
        console.log('📡 [POSTER PLAYER] Fetching calendar posters for date:', calendarDate);
        const response = await calendarApi.getPostersByDate(calendarDate);
        
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
              tags: template.tags,
              tagsLength: template.tags.length,
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
            const matchingPoster = ensuredTemplates.find(t => t.id === ensuredInitialPoster.id);
            const posterToSet = matchingPoster || ensuredTemplates[0];
            
            // Ensure the selected poster has languages properly merged
            const finalPoster = mergeTemplateLanguages(posterToSet);
            setCurrentPoster(finalPoster);
            
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
    setAllTemplates(updatedTemplates);

    // Update currentPoster when new data arrives (when initialPoster changes from loading to real data)
    // Check if currentPoster is still the loading placeholder or has no thumbnail
    setCurrentPoster(prevPoster => {
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
    // Only auto-detect if currently on "All" to avoid overriding user's manual selection
    if (detectedLanguage && selectedLanguage === 'all') {
      setSelectedLanguage(detectedLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPoster?.id]); // Run when initial poster changes

  // Detect language from current poster when business category, greeting category, or calendar posters are loaded
  // This ensures language detection works when clicking category cards or calendar posters
  useEffect(() => {
    // Skip if no currentPoster or if it's a loading placeholder
    if (!currentPoster || currentPoster.id === 'loading' || !currentPoster.thumbnail) {
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

    console.log('🔍 [LANGUAGE DETECTION] Detecting language for poster:', {
      posterId: currentPoster.id,
      tags: posterTags,
      businessCategory,
      greetingCategory,
      calendarDate
    });

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
    // Only auto-detect if currently on "All" to avoid overriding user's manual selection
    if (detectedLanguage) {
      if (detectedLanguage !== selectedLanguage && selectedLanguage === 'all') {
        console.log(`🔄 [LANGUAGE DETECTION] Switching language from ${selectedLanguage} to ${detectedLanguage}`, {
          detectedLanguages: allDetectedLanguages,
          tags: posterTags
        });
        setSelectedLanguage(detectedLanguage);
      } else {
        console.log(`✅ [LANGUAGE DETECTION] Language already set to ${detectedLanguage}`);
      }
    } else {
      console.log('⚠️ [LANGUAGE DETECTION] No language detected from tags:', posterTags);
      // Keep current selection, don't auto-switch
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPoster?.id, businessCategory, greetingCategory, calendarDate]); // Run when current poster changes for category or calendar

  // Ensure poster selection respects the active language filter
  useEffect(() => {
    if (!allTemplates.length) {
      return;
    }

    // Ensure all templates have languages merged before filtering
    const templatesWithLanguages = allTemplates.map(t => mergeTemplateLanguages(t));

    setCurrentPoster(previousPoster => {
      const resolvedPrevious = previousPoster
        ? templatesWithLanguages.find(template => template.id === previousPoster.id) || previousPoster
        : null;

      // If "All" is selected, show any template
      if (selectedLanguage === 'all') {
        if (resolvedPrevious) {
          return resolvedPrevious;
        }
        return templatesWithLanguages[0];
      }

      // Check if current poster matches the selected language
      if (resolvedPrevious && templateContainsLanguage(resolvedPrevious, selectedLanguage)) {
        return resolvedPrevious;
      }

      // Find first template that matches the selected language
      const firstMatchingTemplate = templatesWithLanguages.find(template =>
        templateContainsLanguage(template, selectedLanguage),
      );

      if (firstMatchingTemplate) {
        if (__DEV__ && (greetingCategory || businessCategory || calendarDate)) {
          console.log(`🔄 [LANGUAGE FILTER] Switching to matching template:`, {
            templateId: firstMatchingTemplate.id,
            templateName: firstMatchingTemplate.name,
            selectedLanguage,
            tags: firstMatchingTemplate.tags,
            languages: firstMatchingTemplate.languages,
          });
        }
        return firstMatchingTemplate;
      }

      // If no match found, keep current poster or use first one
      // But log a warning if we're filtering by language
      if (selectedLanguage !== 'all' && (greetingCategory || businessCategory || calendarDate)) {
        console.warn(`⚠️ [LANGUAGE FILTER] No templates match language "${selectedLanguage}"`, {
          totalTemplates: templatesWithLanguages.length,
          sampleTags: templatesWithLanguages.slice(0, 3).map(t => ({ id: t.id, tags: t.tags })),
        });
      }

      return resolvedPrevious || templatesWithLanguages[0];
    });
  }, [allTemplates, selectedLanguage, greetingCategory, businessCategory, calendarDate]);

  useEffect(() => {
    if (!isEventPlannerCategory && selectedServiceFilter) {
      setSelectedServiceFilter(null);
    }
  }, [isEventPlannerCategory, selectedServiceFilter]);

  const handlePosterSelect = useCallback((poster: Template) => {
    // Merge template languages to ensure we have all language info
    const posterWithLanguages = mergeTemplateLanguages(poster);
    
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
    // Only auto-detect if currently on "All" to avoid overriding user's manual selection
    if (detectedLanguage && detectedLanguage !== selectedLanguage && selectedLanguage === 'all') {
      setSelectedLanguage(detectedLanguage);
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

  const swipeThreshold = 30;

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx } = gestureState;
          if (dx < -swipeThreshold) {
            goToNextPoster();
          } else if (dx > swipeThreshold) {
            goToPreviousPoster();
          }
        },
      }),
    [goToNextPoster, goToPreviousPoster, swipeThreshold],
  );

  const handleLanguageChange = useCallback((languageId: string) => {
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
                {calendarDate 
                  ? (() => {
                      const date = new Date(calendarDate);
                      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                    })()
                  : businessCategory || greetingCategory || currentPoster?.category || 'Templates'}
              </Text>
            </LinearGradient>
          </View>

          <TouchableOpacity
            onPress={handleNextPress}
            style={styles.headerTextButton}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[theme.colors.secondary, theme.colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerTextButtonGradient}
          >
            <Text style={styles.headerButtonText}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

         {/* Compact Poster Section */}
         <View
           style={[styles.posterContainer, { height: computedPreviewHeight, width: '100%' }]}
           {...swipeResponder.panHandlers}
         >
         <LazyFullImage
           thumbnailUri={currentPoster.thumbnail}
           fullImageUri={getHighQualityImageUrl(currentPoster)}
           style={styles.posterImage}
           resizeMode="contain"
           loadOnMount={true}
           preload={true}
           quality="high"
           maxWidth={2400}
         />
         </View>

         {/* Language Filter Buttons - Horizontal below preview */}
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
               // Performance optimizations for large lists
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

      <Modal
        visible={isBusinessProfileReminderVisible}
        transparent
        animationType="fade"
        onRequestClose={handleBusinessProfileReminderClose}
      >
        <View style={styles.businessProfileModalOverlay}>
          <View style={styles.businessProfileModalContent}>
            <Text style={styles.businessProfileModalTitle}>Add More Business Profiles</Text>
            <Text style={styles.businessProfileModalSubtitle}>
              Create additional business profiles to unlock more tailored poster suggestions.
            </Text>
            <View style={styles.businessProfileModalActions}>
              <TouchableOpacity
                style={[styles.businessProfileModalButton, styles.businessProfileModalSecondary]}
                onPress={handleBusinessProfileAddPress}
                activeOpacity={0.8}
              >
                <Text style={styles.businessProfileModalSecondaryText}>Add Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.businessProfileModalButton, styles.businessProfileModalPrimary]}
                onPress={handleBusinessProfileContinue}
                activeOpacity={0.85}
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
});

export default PosterPlayerScreen;

