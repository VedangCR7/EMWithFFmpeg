import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
  InteractionManager,
  Image,
  PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import existing components and services
import LazyFullImage from '../components/LazyFullImage';
import { useTheme } from '../context/ThemeContext';
import { useBusinessProfile } from '../context/BusinessProfileContext';
import businessCategoryPostersApi, { BusinessCategoryPoster } from '../services/businessCategoryPostersApi';
import { Template } from '../services/dashboard';
import authService from '../services/auth';

// Import the RelatedPosterItem component from PosterPlayerScreen
// We'll recreate it here to avoid importing from a screen file
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
  overlayColors,
}) => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.relatedPosterCard,
        {
          width: cardWidth,
          height: cardHeight,
        },
        isSelected && styles.relatedPosterCardSelected,
      ]}
      onPress={handlePress}
    >
      {/* Selected Glow Effect */}
      {isSelected && (
        <View style={styles.selectedPosterGlow} />
      )}
      
      {/* Poster Image */}
      <LazyFullImage
        thumbnailUri={imageUrl}
        fullImageUri={imageUrl}
        style={styles.relatedPosterImage}
        resizeMode="cover"
        loadOnMount={true}
        preload={true}
        quality="medium"
        maxWidth={800}
        showLoader={false}
      />
      
      {/* Selected Overlay */}
      {isSelected && (
        <LinearGradient
          colors={overlayColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          style={styles.selectedPosterOverlay}
        >
          <View style={styles.selectedPosterBadge}>
            <Text style={styles.selectedPosterBadgeText}>Previewing</Text>
          </View>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
});

RelatedPosterItem.displayName = 'RelatedPosterItem';

type MyBusinessPosterPlayerScreenNavigationProp = StackNavigationProp<MainStackParamList, 'PosterPlayer'>;

const MyBusinessPosterPlayerScreen: React.FC = () => {
  const navigation = useNavigation<MyBusinessPosterPlayerScreenNavigationProp>();
  const { theme } = useTheme();
  const { selectedBusinessProfile } = useBusinessProfile();
  const insets = useSafeAreaInsets();

  // Helper function to convert hex to rgba
  const hexToRgba = (hexColor: string, alpha: number): string => {
    if (!hexColor || typeof hexColor !== 'string') {
      return `rgba(0,0,0,${alpha})`;
    }

    let hex = hexColor.replace('#', '');

    if (hex.length === 3) {
      hex = hex
        .split('')
        .map(char => char + char)
        .join('');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r},${g},${b},${alpha})`;
  };

  // Get high quality image URL for preview (full quality, maximum resolution)
  const getHighQualityImageUrl = (poster: Template | null): string => {
    if (!poster) return '';

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
    let url = poster.thumbnail || poster.thumbnailUrl || '';

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
          const maxWidth = Math.max(Math.round(screenWidth * 2.5), 2400); // 2.5x for very high quality
          const highQualityTransform = `q_100,c_limit,w_${maxWidth}`;
          const highQualityUrl = `${prefix}/upload/${highQualityTransform}/${versionAndPath}`;

          return highQualityUrl;
        }
      } catch (error) {
        console.warn('⚠️ Error parsing Cloudinary URL for high quality:', error);
      }
    }

    // If URL already contains 'thumbnailUrl' or 'thumbnail' in path, try to get full URL
    if (url.includes('/thumbnailUrl/') || url.includes('/thumbnail/')) {
      const fullUrl = url.replace(/\/thumbnailUrl\//g, '/url/').replace(/\/thumbnail\//g, '/images/');
      url = fullUrl;
    }

    // For non-Cloudinary URLs, try to enhance quality
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

  // Extract theme colors for gradient overlay
  const themeColors = theme.colors || {};
  const primaryColor = themeColors.primary || '#764ba2';
  const secondaryColor = themeColors.secondary || themeColors.primary || '#667eea';

  // Calculate preview overlay colors
  const previewOverlayColors = useMemo(() => {
    const startColor = secondaryColor || primaryColor;
    const endColor = primaryColor;
    return [
      hexToRgba(startColor, 0.95),
      hexToRgba(endColor, 0.85),
    ];
  }, [primaryColor, secondaryColor]);

  // Screen dimensions
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // State management
  const [posters, setPosters] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<Template | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'english' | 'hindi'>('all');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string | null>(null);
  const [serviceFilterTemplates, setServiceFilterTemplates] = useState<Record<string, Template[]>>({});
  const [isLoadingServiceFilter, setIsLoadingServiceFilter] = useState<Record<string, boolean>>({});

  const { width: screenWidth, height: screenHeight } = dimensions;

  // Responsive design helpers
  const isTabletDevice = screenWidth >= 768;
  const isFoldPhoneUnfolded = screenWidth >= 900;
  const moderateScale = (size: number, factor = 0.5) => size + (size * (screenWidth / 375 - 1) * factor);

  // Get business category from selected profile
  const businessCategory = useMemo(() => {
    if (!selectedBusinessProfile) {
      return null;
    }
    // Use subcategory if available, otherwise use main category
    return selectedBusinessProfile.subCategory || selectedBusinessProfile.subcategory || selectedBusinessProfile.category;
  }, [selectedBusinessProfile]);

  // Check if current category is Event Planner
  const isEventPlannerCategory = useMemo(() => {
    const category = (businessCategory || '').trim().toLowerCase();
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

    console.log('🔍 [EVENT PLANNER DETECTION]', {
      businessCategory,
      normalizedCategory: category,
      isEventPlanner: result,
      variations: eventPlannerVariations
    });

    return result;
  }, [businessCategory]);

  // Service filter keywords for Event Planner category
  const serviceFilterKeywords: Record<string, string[]> = useMemo(() => ({
    generator: ['generator'],
    decorators: ['decor', 'decorator', 'stage'],
    sound: ['sound', 'audio', 'dj'],
    mandap: ['mandap']
  }), []);

  // Fetch posters for business category
  const fetchPosters = useCallback(async () => {
    if (!businessCategory) {
      console.log('📋 [MY BUSINESS] No business category available');
      setPosters([]);
      setLoading(false);
      return;
    }

    console.log('📋 [MY BUSINESS] Fetching posters for category:', businessCategory);
    setLoading(true);

    try {
      const response = await businessCategoryPostersApi.getPostersByCategory(businessCategory, 200);

      if (response?.success && Array.isArray(response.data?.posters)) {
        const businessPosters = response.data.posters;

        // Convert BusinessCategoryPoster to Template format
        const templates: Template[] = businessPosters
          .map(poster => ({
            id: poster.id,
            name: poster.title || 'Business Poster',
            thumbnail: poster.thumbnail || poster.imageUrl,
            thumbnailUrl: poster.thumbnail || poster.imageUrl,
            category: poster.category || businessCategory,
            downloads: poster.downloads || 0,
            isDownloaded: false,
            languages: poster.tags || [],
            tags: poster.tags || [],
            description: poster.description,
          }))
          .filter(template => template.thumbnail);

        console.log(`✅ [MY BUSINESS] Loaded ${templates.length} posters for category: ${businessCategory}`);
        setPosters(templates);

        // Set first poster as selected if none selected
        if (templates.length > 0 && !selectedPoster) {
          setSelectedPoster(templates[0]);
        }
      } else {
        console.warn('⚠️ [MY BUSINESS] No posters found for category:', businessCategory);
        setPosters([]);
        setSelectedPoster(null);
      }
    } catch (error) {
      console.error('❌ [MY BUSINESS] Error fetching posters:', error);
      setPosters([]);
      setSelectedPoster(null);
    } finally {
      setLoading(false);
    }
  }, [businessCategory]);

  // Function to fetch Event Planner templates
  const fetchEventPlannerTemplates = useCallback(async () => {
    if (!isEventPlannerCategory) return;

    // Check if we already have cached EventPlanner templates
    if (serviceFilterTemplates['eventplanner'] && serviceFilterTemplates['eventplanner'].length > 0) {
      console.log('📦 [EVENT PLANNER] Using cached EventPlanner templates');
      return;
    }

    console.log('📡 [EVENT PLANNER] Fetching all EventPlanner templates');
    setIsLoadingServiceFilter(prev => ({ ...prev, eventplanner: true }));

    try {
      const response = await businessCategoryPostersApi.getPostersByCategory('eventplanner', 500);

      console.log('🔍 [EVENT PLANNER] API Response:', {
        success: response.success,
        message: response.message,
        posterCount: response.data?.posters?.length || 0
      });

      if (response?.success && Array.isArray(response.data?.posters)) {
        const businessPosters = response.data.posters;

        // Convert BusinessCategoryPoster to Template format
        const templates: Template[] = businessPosters
          .map(poster => ({
            id: poster.id,
            name: poster.title || 'Event Planner Poster',
            thumbnail: poster.thumbnail || poster.imageUrl,
            thumbnailUrl: poster.thumbnail || poster.imageUrl,
            category: poster.category || 'eventplanner',
            downloads: poster.downloads || 0,
            isDownloaded: false,
            languages: poster.tags || [],
            tags: poster.tags || [],
            description: poster.description,
            previewUrl: poster.imageUrl || poster.downloadUrl,
          }))
          .filter(template => template.thumbnail);

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
      } else {
        console.warn('⚠️ [EVENT PLANNER] No templates found for EventPlanner category');
        setServiceFilterTemplates(prev => ({
          ...prev,
          eventplanner: []
        }));
      }
    } catch (error) {
      console.error('❌ [EVENT PLANNER] Error fetching templates:', error);
      setServiceFilterTemplates(prev => ({
        ...prev,
        eventplanner: []
      }));
    } finally {
      setIsLoadingServiceFilter(prev => ({ ...prev, eventplanner: false }));
    }
  }, [isEventPlannerCategory, serviceFilterTemplates]);

  // Fetch EventPlanner templates when EventPlanner category is detected
  useEffect(() => {
    if (isEventPlannerCategory && !serviceFilterTemplates['eventplanner']) {
      console.log('🎯 [EVENT PLANNER] EventPlanner category detected, fetching templates...');
      fetchEventPlannerTemplates();
    }
  }, [isEventPlannerCategory, fetchEventPlannerTemplates, serviceFilterTemplates]);

  // Reset service filter when not Event Planner category
  useEffect(() => {
    if (!isEventPlannerCategory && selectedServiceFilter) {
      setSelectedServiceFilter(null);
    }
  }, [isEventPlannerCategory, selectedServiceFilter]);

  // Fetch posters when category changes
  useEffect(() => {
    fetchPosters();
  }, [fetchPosters]);

  // Update selected poster when posters array changes
  useEffect(() => {
    if (posters && posters.length > 0) {
      setSelectedPoster(posters[0]);
    }
  }, [posters]);

  // Update dimensions on change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Load image dimensions when poster changes
  useEffect(() => {
    if (!selectedPoster) {
      setImageDimensions(null);
      return;
    }

    const imageUrl = selectedPoster.thumbnail || selectedPoster.thumbnailUrl || '';
    if (!imageUrl) {
      setImageDimensions(null);
      return;
    }

    Image.getSize(
      imageUrl,
      (width, height) => setImageDimensions({ width, height }),
      () => setImageDimensions(null)
    );
  }, [selectedPoster]);

  // Calculate card dimensions
  const numColumns = useMemo(() => {
    return (isTabletDevice || isFoldPhoneUnfolded) ? 4 : 3;
  }, [isTabletDevice, isFoldPhoneUnfolded]);

  const cardWidth = useMemo(() => {
    if (!screenWidth || screenWidth <= 0) {
      return 100;
    }

    const padding = moderateScale(8);
    const gap = moderateScale(3);
    const totalGaps = gap * (numColumns - 1);
    const availableWidth = screenWidth - (padding * 2) - totalGaps;
    const optimalWidth = availableWidth / numColumns;

    return optimalWidth > 0 ? optimalWidth : 100;
  }, [screenWidth, numColumns, moderateScale]);

  const cardHeight = cardWidth; // Square cards

  // Calculate poster preview height
  const computedPreviewHeight = useMemo(() => {
    if (imageDimensions && imageDimensions.width > 0 && imageDimensions.height > 0) {
      const aspectHeight = screenWidth * (imageDimensions.height / imageDimensions.width);
      
      const headerHeight = moderateScale(80);
      const topSpacing = insets.top + moderateScale(12);
      const gridMinHeight = moderateScale(150);
      const bottomSpacing = insets.bottom;
      const reservedSpace = headerHeight + topSpacing + gridMinHeight + bottomSpacing + moderateScale(30);

      const baseMaxPercentage = isFoldPhoneUnfolded ? 0.50 : 0.60;
      const maxPosterHeightByPercentage = screenHeight * baseMaxPercentage;
      const maxPosterHeightBySpace = screenHeight - reservedSpace;

      return Math.min(aspectHeight, maxPosterHeightByPercentage);
    }
    return screenHeight * 0.30;
  }, [imageDimensions, screenWidth, screenHeight, isFoldPhoneUnfolded, insets]);

  // Handle poster selection
  const handlePosterSelect = useCallback((poster: Template) => {
    setSelectedPoster(poster);
  }, []);

  // Handle back navigation
  const handleBackPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  }, [navigation]);

  // Navigate to poster editor
  const navigateToPosterEditor = useCallback(() => {
    if (!selectedPoster) return;

    navigation.navigate('PosterEditor', {
      selectedImage: {
        uri: selectedPoster.thumbnail || selectedPoster.thumbnailUrl || '',
        title: selectedPoster.name,
        description: selectedPoster.category,
      },
      selectedLanguage: selectedLanguage,
      selectedTemplateId: selectedPoster.id,
      selectedBusinessProfile: selectedBusinessProfile,
    });
  }, [navigation, selectedPoster, selectedLanguage, selectedBusinessProfile]);

  // Language options
  const languages = [
    { id: 'all', name: 'All' },
    { id: 'english', name: 'English' },
    { id: 'hindi', name: 'Hindi' },
  ];

  // Filter posters by language and service filter
  const filteredPosters = useMemo(() => {
    let basePosters = posters;

    // If we have EventPlanner templates and a service filter selected, filter by tags
    if (isEventPlannerCategory && selectedServiceFilter && serviceFilterTemplates['eventplanner']) {
      const eventPlannerTemplates = serviceFilterTemplates['eventplanner'];
      
      // Filter by service keywords (tags)
      const keywords = serviceFilterKeywords[selectedServiceFilter] || [];
      basePosters = eventPlannerTemplates.filter(template => {
        const templateTags = Array.isArray(template.tags)
          ? template.tags.map(tag => tag.toLowerCase())
          : [];
        return keywords.some(keyword => templateTags.some(tag => tag.includes(keyword)));
      });
    }

    // Apply language filtering
    if (selectedLanguage === 'all') {
      return basePosters;
    }
    
    return basePosters.filter(poster => {
      const posterLanguages = poster.languages || [];
      const posterTags = poster.tags || [];
      
      if (selectedLanguage === 'english') {
        return posterLanguages.includes('english') || 
               posterTags.some(tag => tag.toLowerCase().includes('english'));
      }
      
      if (selectedLanguage === 'hindi') {
        return posterLanguages.includes('hindi') || 
               posterTags.some(tag => tag.toLowerCase().includes('hindi'));
      }
      
      return false;
    });
  }, [posters, selectedLanguage, isEventPlannerCategory, selectedServiceFilter, serviceFilterTemplates, serviceFilterKeywords]);

  // Calculate current poster index in filtered posters
  const currentPosterIndex = useMemo(() => {
    if (!selectedPoster || !filteredPosters.length) {
      return -1;
    }
    return filteredPosters.findIndex(poster => poster.id === selectedPoster.id);
  }, [filteredPosters, selectedPoster]);

  // Show poster at specific index
  const showPosterAtIndex = useCallback((index: number) => {
    if (!filteredPosters.length) {
      return;
    }

    const safeIndex = Math.max(0, Math.min(filteredPosters.length - 1, index));
    const poster = filteredPosters[safeIndex];
    if (poster) {
      setSelectedPoster(poster);
    }
  }, [filteredPosters]);

  // Navigate to next poster
  const goToNextPoster = useCallback(() => {
    if (currentPosterIndex === -1) {
      // If current poster not found in filteredPosters, check if it matches the first poster
      if (selectedPoster && filteredPosters.length > 0 && filteredPosters[0].id === selectedPoster.id) {
        if (filteredPosters.length > 1) {
          showPosterAtIndex(1);
        }
        return;
      }
      showPosterAtIndex(0);
      return;
    }
    const nextIndex = currentPosterIndex + 1;
    if (nextIndex < filteredPosters.length) {
      showPosterAtIndex(nextIndex);
    }
  }, [currentPosterIndex, filteredPosters.length, showPosterAtIndex, selectedPoster, filteredPosters]);

  // Navigate to previous poster
  const goToPreviousPoster = useCallback(() => {
    if (currentPosterIndex === -1) {
      // If current poster not found in filteredPosters, check if it matches the first poster
      if (selectedPoster && filteredPosters.length > 0 && filteredPosters[0].id === selectedPoster.id) {
        return; // Already at first poster
      }
      showPosterAtIndex(0);
      return;
    }
    const previousIndex = currentPosterIndex - 1;
    if (previousIndex >= 0) {
      showPosterAtIndex(previousIndex);
    }
  }, [currentPosterIndex, showPosterAtIndex, selectedPoster, filteredPosters]);

  // Swipe gesture configuration
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

  // Render functions
  const renderRelatedPoster = useCallback(({ item }: { item: Template }) => {
    const imageUrl = item.thumbnailUrl || item.thumbnail || '';
    const isSelected = selectedPoster?.id === item.id;

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
  }, [cardWidth, cardHeight, handlePosterSelect, selectedPoster, previewOverlayColors]);

  const renderSkeletonItem = useCallback(() => {
    return (
      <View
        style={[
          styles.relatedPosterCard,
          {
            width: cardWidth,
            height: cardHeight,
            backgroundColor: '#f0f0f0',
          },
        ]}
      />
    );
  }, [cardWidth, cardHeight]);

  const getIconSize = useCallback((baseSize: number) => {
    const scale = screenWidth / 375;
    return Math.round(baseSize * scale);
  }, [screenWidth]);

  if (!businessCategory) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.gradient[0] || '#e8e8e8' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
        <View style={styles.noPostersContainer}>
          <Text style={styles.noPostersText}>No Business Category Selected</Text>
          <Text style={styles.noPostersSubtext}>Please select a business profile to view posters</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.gradient[0] || '#e8e8e8' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Safe Area Top Spacing */}
        <View style={{ height: insets.top + moderateScale(12) }} />

        {/* Header */}
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
                {businessCategory}
              </Text>
            </LinearGradient>
          </View>

          <TouchableOpacity
            onPress={navigateToPosterEditor}
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

        {/* Poster Preview */}
        <View
          style={[styles.posterContainer, { height: computedPreviewHeight, width: '100%' }]}
          {...swipeResponder.panHandlers}
          collapsable={false}
        >
          {selectedPoster ? (
            <LazyFullImage
              thumbnailUri={selectedPoster.thumbnail || selectedPoster.thumbnailUrl || ''}
              fullImageUri={getHighQualityImageUrl(selectedPoster)}
              style={styles.posterImage}
              resizeMode="contain"
              loadOnMount={true}
              preload={true}
              quality="high"
              maxWidth={2400}
              showLoader={false}
            />
          ) : (
            <View style={styles.noPosterContainer}>
              <Text style={styles.noPosterText}>No poster selected</Text>
            </View>
          )}
        </View>

        {/* Language Filter */}
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
                onPress={() => setSelectedLanguage(language.id as any)}
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
                  onPress={() => {
                    const newFilter = selectedServiceFilter === filterKey ? null : filterKey;
                    setSelectedServiceFilter(newFilter);
                    
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
                      isActive && styles.serviceFilterButtonTextActive,
                      !isActive && styles.serviceFilterButtonTextInactive
                    ]}>
                      {isLoadingServiceFilter[filterKey] ? 'Loading...' : labelMap[filterKey]}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Related Posters Grid */}
        <View style={styles.relatedSection}>
          {loading ? (
            <FlatList
              data={Array.from({ length: 6 }, (_, index) => ({ id: `skeleton-${index}` }))}
              renderItem={renderSkeletonItem}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
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
              columnWrapperStyle={styles.relatedGrid}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.relatedList}
              style={styles.relatedFlatList}
              removeClippedSubviews={true}
              maxToRenderPerBatch={isTabletDevice ? 8 : 6}
              windowSize={5}
              initialNumToRender={isTabletDevice ? 8 : 6}
              updateCellsBatchingPeriod={100}
            />
          ) : (
            <View style={styles.noPostersContainer}>
              <Text style={styles.noPostersText}>
                {selectedLanguage === 'all' ? 'No posters available' : `No posters in ${languages.find(lang => lang.id === selectedLanguage)?.name}`}
              </Text>
              <Text style={styles.noPostersSubtext}>
                {selectedLanguage === 'all' ? 'Try refreshing or changing your business category' : 'Try selecting "All" or a different language'}
              </Text>
            </View>
          )}
        </View>

        {/* Safe Area Bottom Spacing */}
        <View style={{ height: insets.bottom }} />
      </LinearGradient>
    </View>
  );
};

// Responsive helper functions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
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
  posterContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 0,
    marginBottom: moderateScale(6),
    borderRadius: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(4),
    },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(8),
    elevation: 6,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  noPosterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  noPosterText: {
    fontSize: moderateScale(14),
    color: '#666666',
    fontWeight: '500',
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
    color: '#FFFFFF',
  },
  relatedSection: {
    flex: 1,
    paddingHorizontal: moderateScale(8),
    paddingTop: moderateScale(4),
    paddingBottom: 0,
  },
  relatedList: {
    paddingBottom: moderateScale(20),
    paddingTop: moderateScale(4),
  },
  relatedFlatList: {
    flex: 1,
  },
  relatedGrid: {
    justifyContent: 'flex-start',
    gap: moderateScale(3),
  },
  relatedPosterCard: {
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
    justifyContent: 'center',
    alignItems: 'center',
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
  noPostersContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(16),
    minHeight: moderateScale(80),
  },
  noPostersText: {
    fontSize: moderateScale(12),
    color: 'rgba(51,51,51,0.8)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: moderateScale(4),
    marginBottom: moderateScale(4),
  },
  noPostersSubtext: {
    fontSize: moderateScale(10),
    color: 'rgba(102,102,102,0.8)',
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
  serviceFilterButtonTextInactive: {
    color: 'rgba(255,255,255,0.7)',
  },
});

export default MyBusinessPosterPlayerScreen;
