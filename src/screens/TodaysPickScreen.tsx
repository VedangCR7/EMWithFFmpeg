import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import OptimizedImage from '../components/OptimizedImage';
import calendarApi from '../services/calendarApi';
import { Template } from '../services/dashboard';
import authService from '../services/auth';
import greetingTemplatesService from '../services/greetingTemplates';
import businessCategoryPostersApi from '../services/businessCategoryPostersApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import responsiveUtils, {
  responsiveSpacing,
  responsiveFontSize,
  responsiveSize,
  responsiveLayout,
  responsiveShadow,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  isTablet,
  moderateScale,
  moderateVerticalScale,
} from '../utils/responsiveUtils';

const TodaysPickScreen: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const [todayPosters, setTodayPosters] = useState<Template[]>([]);
  const [sections, setSections] = useState<Array<{ title: string; data: Template[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [avatarErrored, setAvatarErrored] = useState(false);
  const preloadedImagesRef = useRef<Set<string>>(new Set());
  
  const currentUser = authService.getCurrentUser();

  // Dynamic dimensions for screen rotation/resize support
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

  // Calculate responsive values based on current dimensions
  const currentScreenWidth = dimensions.width;
  const currentScreenHeight = dimensions.height;
  const isCurrentlyTablet = currentScreenWidth >= 768;
  const isCurrentlySmall = currentScreenWidth < 375;
  const isCurrentlyMedium = currentScreenWidth >= 375 && currentScreenWidth < 414;
  const isCurrentlyLarge = currentScreenWidth >= 414;

  // Calculate number of columns based on screen size
  const numColumns = useMemo(() => {
    if (isCurrentlyTablet) {
      return currentScreenWidth >= 1024 ? 4 : 3;
    }
    return 2;
  }, [isCurrentlyTablet, currentScreenWidth]);

  // Calculate card width based on screen size and columns
  const cardWidth = useMemo(() => {
    const horizontalPadding = moderateScale(isCurrentlySmall ? 12 : isCurrentlyMedium ? 16 : 20);
    const gap = moderateScale(isCurrentlySmall ? 8 : isCurrentlyMedium ? 12 : 16);
    return (currentScreenWidth - (horizontalPadding * 2) - (gap * (numColumns - 1))) / numColumns;
  }, [currentScreenWidth, numColumns, isCurrentlySmall, isCurrentlyMedium]);

  // Avatar size for header
  const avatarSize = useMemo(() => {
    return moderateScale(isCurrentlySmall ? 32 : isCurrentlyMedium ? 36 : 40);
  }, [isCurrentlySmall, isCurrentlyMedium]);

  // Normalize possibly relative image URLs to absolute
  const toAbsoluteUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const lower = url.toLowerCase();
    if (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('data:') ||
      lower.startsWith('file:') ||
      lower.startsWith('content:') ||
      lower.startsWith('asset:') ||
      lower.startsWith('blob:')
    ) {
      return url;
    }
    if (lower.startsWith('/storage') || lower.startsWith('/sdcard') || lower.startsWith('/data')) {
      return `file://${url}`;
    }
    const normalized = url.startsWith('/') ? url : `/${url}`;
    const REMOTE_BASE = 'https://eventmarketersbackend.onrender.com';
    return `${REMOTE_BASE}${normalized}`;
  };

  // Sanitize raw URLs
  const sanitizeUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const trimmed = url.trim().replace(/\\\\/g, '/');
    return trimmed.replace(/\s/g, '%20');
  };

  // Enforce HTTPS
  const ensureHttps = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http://')) {
      return 'https://' + url.substring('http://'.length);
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    return url;
  };

  // Get avatar URI
  const avatarUri = useMemo(() => {
    const rawRaw = currentUser?.logo || currentUser?.companyLogo || currentUser?.photoURL || currentUser?.profileImage || null;
    const rawUri = sanitizeUrl(rawRaw);
    return ensureHttps(toAbsoluteUrl(rawUri));
  }, [currentUser?.logo, currentUser?.companyLogo, currentUser?.photoURL, currentUser?.profileImage]);

  // Generate cache key for avatar
  const avatarCacheKey = useMemo(() => {
    if (!currentUser?.id) return null;
    return `user_avatar_${currentUser.id}`;
  }, [currentUser?.id]);

  // Reset avatar error state when URI changes
  useEffect(() => {
    if (avatarUri) {
      setAvatarErrored(false);
    } else {
      setAvatarErrored(true);
    }
  }, [avatarUri]);

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
    const randomIndex = Math.floor(seededRandom(seed + typeSeed) * items.length);
    return items[randomIndex];
  }, [seededRandom]);

  // Preload images for faster rendering
  const preloadImages = useCallback((posters: Template[], startIndex: number = 0, count: number = 6) => {
    const imagesToPreload = posters.slice(startIndex, startIndex + count);
    imagesToPreload.forEach(poster => {
      const imageUrl = poster.thumbnail;
      if (imageUrl && !preloadedImagesRef.current.has(imageUrl)) {
        preloadedImagesRef.current.add(imageUrl);
        // Prefetch in background
        Image.prefetch(imageUrl).catch(() => {
          // Silently fail - prefetch is best effort
        });
      }
    });
  }, []);

  useEffect(() => {
    loadTodayPosters();
  }, []);

  // Preload images when posters are loaded
  useEffect(() => {
    if (todayPosters.length > 0 && !loading) {
      // Preload first batch immediately
      preloadImages(todayPosters, 0, Math.min(8, todayPosters.length));
      
      // Preload next batch after a short delay
      const timeoutId = setTimeout(() => {
        if (todayPosters.length > 8) {
          preloadImages(todayPosters, 8, 6);
        }
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [todayPosters, loading, preloadImages]);

  // Render section header
  const renderSectionHeader = useCallback((title: string) => {
    return (
      <View style={[
        styles.sectionHeader,
        {
          backgroundColor: '#f5f5f5',
          paddingHorizontal: moderateScale(isCurrentlySmall ? 12 : isCurrentlyMedium ? 16 : 20),
          paddingVertical: moderateVerticalScale(isCurrentlySmall ? 12 : isCurrentlyMedium ? 14 : 16),
          marginTop: moderateVerticalScale(isCurrentlySmall ? 8 : isCurrentlyMedium ? 10 : 12),
          marginBottom: moderateVerticalScale(isCurrentlySmall ? 8 : isCurrentlyMedium ? 10 : 12),
        }
      ]}>
        <Text style={[
          styles.sectionHeaderText,
          {
            color: theme.colors.text,
            fontSize: responsiveFontSize.lg,
            fontWeight: 'bold',
          }
        ]}>
          {title}
        </Text>
      </View>
    );
  }, [theme, isCurrentlySmall, isCurrentlyMedium, responsiveFontSize]);

  const loadTodayPosters = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const dailySeed = getDailySeed();
      const allPosters: Template[] = [];

      // 1. Fetch calendar posters for today
      try {
        const calendarResponse = await calendarApi.getPostersByDate(dateString, false);
        if (calendarResponse.success && calendarResponse.data.posters.length > 0) {
          const calendarTemplates: Template[] = calendarResponse.data.posters.map((poster) => ({
            id: poster.id,
            name: poster.name || poster.title || 'Today\'s Pick',
            thumbnail: poster.thumbnail,
            category: poster.category || 'Festival',
            downloads: poster.downloads || 0,
            isDownloaded: poster.isDownloaded || false,
            tags: poster.tags || [],
          }));
          allPosters.push(...calendarTemplates);
        }
      } catch (error) {
        console.error('Error loading calendar posters:', error);
      }

      // 2. Fetch 1 motivational quote (daily shuffled)
      try {
        const motivationalTemplates = await greetingTemplatesService.searchTemplates('motivational');
        if (motivationalTemplates && motivationalTemplates.length > 0) {
          // Get previously shown IDs for the last few days to avoid immediate repeats
          const recentDays: string[] = [];
          for (let i = 0; i < 7; i++) {
            const pastDate = new Date(today);
            pastDate.setDate(today.getDate() - i);
            const pastDateString = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`;
            const pastKey = `daily_motivational_${pastDateString}`;
            const pastId = await AsyncStorage.getItem(pastKey);
            if (pastId) recentDays.push(pastId);
          }
          
          // Filter out recently shown items
          const availableTemplates = motivationalTemplates.filter(t => !recentDays.includes(t.id));
          
          // If all items were shown recently, use all (reset cycle)
          const templatesToSelect = availableTemplates.length > 0 ? availableTemplates : motivationalTemplates;
          
          const selectedMotivational = selectDailyItem(templatesToSelect, dailySeed, 'motivational');
          if (selectedMotivational) {
            // Save selected ID for today
            const storageKey = `daily_motivational_${dateString}`;
            await AsyncStorage.setItem(storageKey, selectedMotivational.id);
            
            const motivationalTemplate: Template = {
              id: selectedMotivational.id,
              name: selectedMotivational.name || 'Motivational Quote',
              thumbnail: selectedMotivational.thumbnail,
              category: 'Motivational',
              downloads: selectedMotivational.downloads || 0,
              isDownloaded: selectedMotivational.isDownloaded || false,
              tags: [],
            };
            allPosters.push(motivationalTemplate);
          }
        }
      } catch (error) {
        console.error('Error loading motivational quotes:', error);
      }

      // 3. Fetch 1 business category poster (daily shuffled)
      try {
        const businessResponse = await businessCategoryPostersApi.getUserCategoryPosters();
        if (businessResponse.success && businessResponse.data.posters.length > 0) {
          const businessPosters = businessResponse.data.posters;
          
          // Get previously shown IDs for the last few days to avoid immediate repeats
          const recentDays: string[] = [];
          for (let i = 0; i < 7; i++) {
            const pastDate = new Date(today);
            pastDate.setDate(today.getDate() - i);
            const pastDateString = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`;
            const pastKey = `daily_business_${pastDateString}`;
            const pastId = await AsyncStorage.getItem(pastKey);
            if (pastId) recentDays.push(pastId);
          }
          
          // Filter out recently shown items
          const availablePosters = businessPosters.filter(p => !recentDays.includes(p.id));
          
          // If all items were shown recently, use all (reset cycle)
          const postersToSelect = availablePosters.length > 0 ? availablePosters : businessPosters;
          
          const selectedBusiness = selectDailyItem(postersToSelect, dailySeed, 'business');
          if (selectedBusiness) {
            // Save selected ID for today
            const storageKey = `daily_business_${dateString}`;
            await AsyncStorage.setItem(storageKey, selectedBusiness.id);
            
            const businessTemplate: Template = {
              id: selectedBusiness.id,
              name: selectedBusiness.title || 'Business Poster',
              thumbnail: selectedBusiness.imageUrl || selectedBusiness.thumbnail,
              category: 'Business', // Use 'Business' as category marker for filtering
              downloads: selectedBusiness.downloads || 0,
              isDownloaded: false,
              tags: selectedBusiness.tags || [],
            };
            allPosters.push(businessTemplate);
          }
        }
      } catch (error) {
        console.error('Error loading business category posters:', error);
      }

      // Organize posters into sections
      const calendarPosters = allPosters.filter(p => p.category !== 'Motivational' && p.category !== 'Business');
      const motivationalPosters = allPosters.filter(p => p.category === 'Motivational');
      const businessPosters = allPosters.filter(p => p.category === 'Business');

      const sectionsData: Array<{ title: string; data: Template[] }> = [];
      
      // Add calendar section if there are calendar posters
      if (calendarPosters.length > 0) {
        sectionsData.push({
          title: "Today's Festivals",
          data: calendarPosters,
        });
      }
      
      // Add motivational section
      if (motivationalPosters.length > 0) {
        sectionsData.push({
          title: 'Daily Motivation Quotes',
          data: motivationalPosters,
        });
      }
      
      // Add business section
      if (businessPosters.length > 0) {
        sectionsData.push({
          title: 'Daily Business Post',
          data: businessPosters,
        });
      }

      setSections(sectionsData);
      
      // Keep flat list for preloading
      const shuffledPosters = [...allPosters].sort(() => seededRandom(dailySeed, allPosters.length) - 0.5);
      setTodayPosters(shuffledPosters);
    } catch (error) {
      console.error('Error loading today\'s posters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert thumbnail URL to high-quality full image URL
  const getFullQualityImageUrl = useCallback((thumbnailUrl: string): string => {
    if (!thumbnailUrl) return thumbnailUrl;
    
    // For Cloudinary URLs, strip existing transforms and add high-quality ones
    if (thumbnailUrl.includes('res.cloudinary.com') && thumbnailUrl.includes('/upload/')) {
      try {
        const [prefix, remainder] = thumbnailUrl.split('/upload/');
        if (!remainder) {
          return thumbnailUrl; // Can't parse, return original
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
          
          // Use maximum quality for editor (q_100 for best quality, w_2400 for high resolution)
          const highQualityTransform = 'f_auto,q_100,c_limit,w_2400';
          const highQualityUrl = `${prefix}/upload/${highQualityTransform}/${versionAndPath}`;
          
          return highQualityUrl;
        } else {
          // No version found - try to extract the image path from the end
          const lastSegment = parts[parts.length - 1];
          if (lastSegment && (lastSegment.includes('.') || parts.length === 1)) {
            // Might be the image path directly
            const imagePath = lastSegment;
            const highQualityTransform = 'f_auto,q_100,c_limit,w_2400';
            return `${prefix}/upload/${highQualityTransform}/${imagePath}`;
          }
        }
      } catch (error) {
        // Fallback to original if transformation fails
        return thumbnailUrl;
      }
    }
    
    // For non-Cloudinary URLs, try to enhance with quality parameters
    // Remove existing quality/size parameters first
    let url = thumbnailUrl.replace(/[?&](quality|width|height|w|h|size)=[^&]*/gi, '');
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}quality=high&width=2400`;
  }, []);

  const handlePosterPress = useCallback((poster: Template) => {
    // Convert thumbnail to high-quality full image URL
    const fullQualityImageUrl = getFullQualityImageUrl(poster.thumbnail);
    
    // Navigate directly to PosterEditor with the selected poster
    navigation.navigate('PosterEditor', {
      selectedImage: {
        uri: fullQualityImageUrl,
        title: poster.name || 'Today\'s Pick',
        description: poster.category || '',
      },
      selectedLanguage: 'english',
      selectedTemplateId: poster.id,
    });
  }, [navigation, getFullQualityImageUrl]);

  // Helper to strip existing transforms from motivational URIs
  // This allows ThumbnailImage to add its own high-quality transform (w_800, q_auto:best)
  const getEnhancedUri = useCallback((uri: string, category: string): string => {
    if (category !== 'Motivational') return uri;
    
    // For motivational quotes, strip existing low-quality transforms
    // Extract clean path so ThumbnailImage can add f_auto,q_auto:best,c_limit,w_800
    if (uri.includes('res.cloudinary.com') && uri.includes('/upload/')) {
      try {
        const [prefix, remainder] = uri.split('/upload/');
        
        if (remainder) {
          // Split by '/' to find the version number and image path
          const parts = remainder.split('/');
          
          // Find version number (v1, v1760929487, etc.) - it's the key to the clean path
          let versionIndex = -1;
          for (let i = 0; i < parts.length; i++) {
            if (/^v\d+/.test(parts[i])) {
              versionIndex = i;
              break;
            }
          }
          
          if (versionIndex >= 0) {
            // Extract everything from version onwards (this is the clean image path)
            const cleanPath = parts.slice(versionIndex).join('/');
            return `${prefix}/upload/${cleanPath}`;
          }
          
          // Fallback: if no version found, try to find the last part that looks like an image ID
          const lastPart = parts[parts.length - 1];
          if (lastPart && !lastPart.includes('_') && !lastPart.includes(',')) {
            // Might be the image identifier, but we need version
            // Try to reconstruct: assume v1 is the version
            return `${prefix}/upload/v1/${parts.slice(-2).join('/')}`;
          }
        }
      } catch (error) {
        // Return original if transformation fails
        return uri;
      }
    }
    
    // For non-Cloudinary URLs, return as-is (ThumbnailImage will handle it)
    return uri;
  }, []);

  // Memoized poster card component for better performance
  const renderPosterCard = useCallback(({ item }: { item: Template }) => {
    // Enhance URI for motivational quotes to improve quality
    // ThumbnailImage will still apply its own width constraint, so no cropping
    const isMotivational = item.category === 'Motivational';
    const imageUri = isMotivational ? getEnhancedUri(item.thumbnail, item.category) : item.thumbnail;
    
    return (
      <TouchableOpacity
        style={[styles.posterCard, { width: cardWidth }]}
        onPress={() => handlePosterPress(item)}
        activeOpacity={0.8}
      >
        <OptimizedImage
          uri={imageUri}
          style={styles.posterImage}
          resizeMode="cover"
          mode="thumbnail"
          showLoader={false}
        />
      </TouchableOpacity>
    );
  }, [cardWidth, handlePosterPress, getEnhancedUri]);

  // Preload next batch when scrolling
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && todayPosters.length > 0) {
      const lastItem = viewableItems[viewableItems.length - 1];
      if (lastItem) {
        // Calculate approximate index in flat list
        let flatIndex = 0;
        sections.forEach((section, sectionIndex) => {
          if (sectionIndex < lastItem.section) {
            flatIndex += section.data.length;
          } else if (sectionIndex === lastItem.section) {
            flatIndex += lastItem.index;
          }
        });
        
        // Preload next 6 images when user scrolls
        if (flatIndex >= todayPosters.length - 3) {
          preloadImages(todayPosters, flatIndex + 1, 6);
        }
      }
    }
  }, [todayPosters, preloadImages, sections]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      
      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          paddingHorizontal: responsiveLayout.headerPaddingHorizontal,
          paddingVertical: moderateVerticalScale(isCurrentlySmall ? 10 : isCurrentlyMedium ? 12 : 14),
          minHeight: responsiveLayout.headerHeight,
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon
            name="arrow-back"
            size={responsiveSize.iconLarge}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          {
            color: theme.colors.text,
            fontSize: responsiveFontSize.lg,
          }
        ]}>
          Today's Pick
        </Text>
        <View style={[styles.headerRight, { width: avatarSize + moderateScale(8) }]}>
          {avatarUri && !avatarErrored ? (
            <View style={[
              styles.avatarContainer,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                borderWidth: 2,
                borderColor: theme.colors.border || '#e0e0e0',
                backgroundColor: '#eaeaea',
                overflow: 'hidden',
              }
            ]}>
              <OptimizedImage
                uri={avatarUri}
                style={styles.avatarImage}
                resizeMode="cover"
                mode="thumbnail"
                cacheKey={avatarCacheKey || undefined}
                showLoader={false}
                fallbackSource={null}
              />
            </View>
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={[
                styles.avatarGradient,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                }
              ]}
            >
              <Text style={[
                styles.avatarText,
                {
                  fontSize: moderateScale(isCurrentlySmall ? 14 : isCurrentlyMedium ? 16 : 18),
                  color: '#ffffff',
                }
              ]}>
                {(currentUser?.companyName || currentUser?.displayName)?.charAt(0)?.toUpperCase() || 
                 currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size={isCurrentlyTablet ? 'large' : 'large'}
            color={theme.colors.primary}
          />
          <Text style={[
            styles.loadingText,
            {
              color: theme.colors.textSecondary,
              fontSize: responsiveFontSize.md,
              marginTop: responsiveSpacing.md,
            }
          ]}>
            Loading today's picks...
          </Text>
        </View>
      ) : sections.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: Math.max(
                moderateVerticalScale(20),
                insets.bottom + moderateVerticalScale(20)
              ),
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, sectionIndex) => (
            <View key={`section-${sectionIndex}`}>
              {renderSectionHeader(section.title)}
              <FlatList
                data={section.data}
                renderItem={renderPosterCard}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                columnWrapperStyle={numColumns > 1 ? [
                  styles.row,
                  {
                    paddingHorizontal: moderateScale(isCurrentlySmall ? 12 : isCurrentlyMedium ? 16 : 20),
                    marginBottom: moderateVerticalScale(isCurrentlySmall ? 8 : isCurrentlyMedium ? 10 : 12),
                    gap: moderateScale(isCurrentlySmall ? 8 : isCurrentlyMedium ? 12 : 16),
                  }
                ] : undefined}
                scrollEnabled={false}
                key={`section-grid-${sectionIndex}-${numColumns}-${currentScreenWidth}`}
                // Performance optimizations
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                updateCellsBatchingPeriod={50}
                windowSize={5}
                initialNumToRender={6}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={[
          styles.emptyContainer,
          {
            paddingHorizontal: responsiveLayout.containerPaddingHorizontal,
          }
        ]}>
          <Icon
            name="today"
            size={responsiveSize.avatarXLarge}
            color={theme.colors.textSecondary}
          />
          <Text style={[
            styles.emptyText,
            {
              color: theme.colors.textSecondary,
              fontSize: responsiveFontSize.lg,
              marginTop: responsiveSpacing.lg,
            }
          ]}>
            No picks available for today
          </Text>
          <Text style={[
            styles.emptySubtext,
            {
              color: theme.colors.textSecondary,
              fontSize: responsiveFontSize.md,
              marginTop: responsiveSpacing.sm,
            }
          ]}>
            Check back tomorrow for new picks!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: moderateScale(4),
    minWidth: responsiveSize.iconLarge + moderateScale(8),
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  posterCard: {
    borderRadius: moderateScale(6),
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    ...responsiveShadow.medium,
  },
  posterImage: {
    width: '100%',
    aspectRatio: isTablet ? 0.8 : 0.75,
    borderRadius: moderateScale(6),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveLayout.containerPaddingHorizontal,
  },
  loadingText: {
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
  },
  sectionHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  sectionHeaderText: {
    fontWeight: 'bold',
  },
});

export default TodaysPickScreen;
