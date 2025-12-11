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
  Animated,
  Easing,
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
  
  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const sectionAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;
  const cardAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;
  const loadingScale = useRef(new Animated.Value(0.8)).current;
  const loadingRotation = useRef(new Animated.Value(0)).current;
  
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
    return moderateScale(isCurrentlySmall ? 28 : isCurrentlyMedium ? 32 : 36);
  }, [isCurrentlySmall, isCurrentlyMedium]);

  // Responsive icon sizes (matching PosterPlayerScreen.tsx)
  const getIconSize = useCallback((baseSize: number) => {
    const scale = currentScreenWidth / 375;
    return Math.round(baseSize * scale);
  }, [currentScreenWidth]);

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
    
    // Animate header on mount
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate loading indicator
  useEffect(() => {
    if (loading) {
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(loadingScale, {
              toValue: 1.1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(loadingScale, {
              toValue: 0.8,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.timing(loadingRotation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [loading]);

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

  // Get icon for section type
  const getSectionIcon = useCallback((title: string) => {
    if (title.includes('Festival')) return 'celebration';
    if (title.includes('Motivation')) return 'favorite';
    if (title.includes('Business')) return 'business-center';
    return 'collections';
  }, []);

  // Animate sections when they appear
  useEffect(() => {
    if (sections.length > 0 && !loading) {
      sections.forEach((_, sectionIndex) => {
        const sectionKey = `section-${sectionIndex}`;
        if (!sectionAnimations.has(sectionKey)) {
          sectionAnimations.set(sectionKey, new Animated.Value(0));
        }
        if (!sectionAnimations.has(`${sectionKey}-translate`)) {
          sectionAnimations.set(`${sectionKey}-translate`, new Animated.Value(30));
        }
        
        const opacity = sectionAnimations.get(sectionKey)!;
        const translateAnim = sectionAnimations.get(`${sectionKey}-translate`)!;
        
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            delay: sectionIndex * 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateAnim, {
            toValue: 0,
            duration: 500,
            delay: sectionIndex * 100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [sections, loading, sectionAnimations]);

  // Render section header
  const renderSectionHeader = useCallback((title: string, sectionIndex: number) => {
    const iconName = getSectionIcon(title);
    const sectionKey = `section-${sectionIndex}`;
    const opacity = sectionAnimations.get(sectionKey) || new Animated.Value(1);
    const translateY = sectionAnimations.get(`${sectionKey}-translate`) || new Animated.Value(0);

    return (
      <Animated.View
        style={[
          styles.sectionHeaderContainer,
          {
            paddingHorizontal: moderateScale(isCurrentlySmall ? 12 : isCurrentlyMedium ? 16 : 20),
            paddingTop: moderateVerticalScale(isCurrentlySmall ? 12 : isCurrentlyMedium ? 14 : 16),
            paddingBottom: moderateVerticalScale(isCurrentlySmall ? 8 : isCurrentlyMedium ? 10 : 12),
            marginBottom: moderateVerticalScale(isCurrentlySmall ? 8 : isCurrentlyMedium ? 10 : 12),
            opacity,
            transform: [{ translateY }],
          }
        ]}
      >
        <View style={styles.sectionHeaderWrapper}>
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
                  name={iconName}
                  size={moderateScale(isCurrentlySmall ? 18 : isCurrentlyMedium ? 20 : 22)}
                  color="#ffffff"
                />
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={[
                  styles.sectionHeaderText,
                  {
                    color: theme.colors.text,
                    fontSize: responsiveFontSize.lg,
                    fontWeight: '700',
                    marginLeft: moderateScale(10),
                  }
                ]}>
                  {title}
                </Text>
                <View style={[
                  styles.sectionUnderline,
                  {
                    backgroundColor: theme.colors.primary,
                    marginLeft: moderateScale(10),
                    marginTop: moderateVerticalScale(2),
                  }
                ]} />
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    );
  }, [theme, isDarkMode, isCurrentlySmall, isCurrentlyMedium, responsiveFontSize, getSectionIcon, sectionAnimations]);

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

  // Animate cards when they appear
  useEffect(() => {
    if (todayPosters.length > 0 && !loading) {
      todayPosters.forEach((item, index) => {
        const cardKey = `card-${item.id}`;
        if (!cardAnimations.has(cardKey)) {
          cardAnimations.set(cardKey, new Animated.Value(0));
        }
        if (!cardAnimations.has(`${cardKey}-scale`)) {
          cardAnimations.set(`${cardKey}-scale`, new Animated.Value(1));
        }
        if (!cardAnimations.has(`${cardKey}-translate`)) {
          cardAnimations.set(`${cardKey}-translate`, new Animated.Value(30));
        }
        
        const opacity = cardAnimations.get(cardKey)!;
        const translateAnim = cardAnimations.get(`${cardKey}-translate`)!;
        const delay = index * 50;
        
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateAnim, {
            toValue: 0,
            duration: 400,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [todayPosters, loading, cardAnimations]);

  // Calculate card dimensions to match image aspect ratio (square-ish to landscape orientation)
  const getCardDimensions = useCallback((index: number, totalInSection: number) => {
    const isFirst = index === 0;
    const isFeatured = isFirst && totalInSection > 2;
    
    // Use a wider aspect ratio (more square/landscape) to match typical image formats
    // This reduces height and eliminates top/bottom spacing
    const posterAspectRatio = isTablet ? 1.0 : 0.9; // Closer to square/landscape format
    
    if (isFeatured && numColumns === 2) {
      // Featured card spans full width
      const featuredWidth = currentScreenWidth - moderateScale(isCurrentlySmall ? 24 : isCurrentlyMedium ? 32 : 40);
      return {
        width: featuredWidth,
        height: featuredWidth / posterAspectRatio,
        isFeatured: true,
      };
    }
    
    // Regular cards - height matches image aspect ratio
    return {
      width: cardWidth,
      height: cardWidth / posterAspectRatio,
      isFeatured: false,
    };
  }, [cardWidth, currentScreenWidth, numColumns, isCurrentlySmall, isCurrentlyMedium, isTablet]);

  // Memoized poster card component for better performance
  const renderPosterCard = useCallback(({ item, index, localIndex }: { item: Template; index: number; localIndex: number }, sectionData: Template[]) => {
    // Enhance URI for motivational quotes to improve quality
    // ThumbnailImage will still apply its own width constraint, so no cropping
    const isMotivational = item.category === 'Motivational';
    const imageUri = isMotivational ? getEnhancedUri(item.thumbnail, item.category) : item.thumbnail;
    
    const cardKey = `card-${item.id}`;
    const opacity = cardAnimations.get(cardKey) || new Animated.Value(1);
    const scale = cardAnimations.get(`${cardKey}-scale`) || new Animated.Value(1);
    const translateY = cardAnimations.get(`${cardKey}-translate`) || new Animated.Value(0);
    
    const { width, height, isFeatured } = getCardDimensions(localIndex, sectionData.length);

    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };
    
    return (
      <Animated.View
        style={[
          styles.posterCard,
          isFeatured && styles.featuredCard,
          {
            width,
            height,
            opacity,
            transform: [
              { scale },
              { translateY },
            ],
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => handlePosterPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.posterTouchable}
        >
          <View style={[styles.posterImageContainer, { height: '100%' }]}>
            <OptimizedImage
              uri={imageUri}
              style={[styles.posterImage, { height: '100%' }]}
              resizeMode="cover"
              mode="thumbnail"
              showLoader={false}
            />
            <LinearGradient
              colors={isFeatured 
                ? ['transparent', 'rgba(0,0,0,0.2)']
                : ['transparent', 'rgba(0,0,0,0.05)']
              }
              style={styles.posterGradientOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            {isFeatured && (
              <View style={styles.featuredBadge}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.featuredBadgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name="star" size={moderateScale(14)} color="#ffffff" />
                  <Text style={styles.featuredBadgeText}>Featured</Text>
                </LinearGradient>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handlePosterPress, getEnhancedUri, cardAnimations, getCardDimensions, theme, isCurrentlySmall, isCurrentlyMedium, responsiveFontSize]);

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
    <View style={[styles.container, { backgroundColor: theme.colors.gradient[0] || '#e8e8e8' }]}>
      <LinearGradient
        colors={theme.colors.gradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
        />
      
      {/* Header */}
      <Animated.View
        style={{
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        <LinearGradient
          colors={isDarkMode 
            ? [theme.colors.surface, theme.colors.surface, theme.colors.background + '80']
            : ['#ffffff', '#ffffff', theme.colors.background + '40']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.header,
            {
              paddingHorizontal: responsiveLayout.headerPaddingHorizontal,
              paddingVertical: moderateVerticalScale(isCurrentlySmall ? 8 : isCurrentlyMedium ? 10 : 12),
              minHeight: moderateVerticalScale(isCurrentlySmall ? 48 : isCurrentlyMedium ? 52 : 56),
              borderBottomWidth: 1,
              borderBottomColor: isDarkMode 
                ? theme.colors.border + '20'
                : theme.colors.border + '30',
              ...responsiveShadow.small,
            }
          ]}
        >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
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
          <View style={styles.headerTitleRow}>
            <Text style={[
              styles.headerTitle,
              {
                color: theme.colors.text,
              fontSize: responsiveFontSize.lg,
              fontWeight: '700',
            }
          ]}>
            Today's Pick
          </Text>
          <View style={[
            styles.headerTitleDot,
            {
              backgroundColor: theme.colors.primary,
              width: moderateScale(6),
              height: moderateScale(6),
              borderRadius: moderateScale(3),
              marginLeft: moderateScale(6),
            }
          ]} />
        </View>
        <Text style={[
          styles.headerSubtitle,
          {
            color: theme.colors.textSecondary,
            fontSize: responsiveFontSize.xs,
            marginTop: moderateVerticalScale(2),
          }
        ]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <View style={[styles.headerRight, { width: avatarSize + moderateScale(8) }]}>
          {avatarUri && !avatarErrored ? (
            <View style={[
              styles.avatarContainer,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                borderWidth: 3,
                borderColor: isDarkMode 
                  ? theme.colors.primary + '60'
                  : theme.colors.primary + '40',
                backgroundColor: '#eaeaea',
                overflow: 'hidden',
                ...responsiveShadow.small,
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
                  ...responsiveShadow.small,
                }
              ]}
            >
              <Text style={[
                styles.avatarText,
                {
                  fontSize: moderateScale(isCurrentlySmall ? 14 : isCurrentlyMedium ? 16 : 18),
                  color: '#ffffff',
                  fontWeight: '700',
                }
              ]}>
                {(currentUser?.companyName || currentUser?.displayName)?.charAt(0)?.toUpperCase() || 
                 currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
          )}
        </View>
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconWrapper}>
            <Animated.View
              style={{
                transform: [
                  { scale: loadingScale },
                  {
                    rotate: loadingRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={[
                  styles.loadingIconContainer,
                  {
                    width: moderateScale(70),
                    height: moderateScale(70),
                    borderRadius: moderateScale(35),
                  }
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ActivityIndicator
                  size={isCurrentlyTablet ? 'large' : 'large'}
                  color="#ffffff"
                />
              </LinearGradient>
            </Animated.View>
          </View>
          <Text style={[
            styles.loadingText,
            {
              color: theme.colors.text,
              fontSize: responsiveFontSize.md,
              marginTop: responsiveSpacing.lg,
              fontWeight: '600',
            }
          ]}>
            Loading today's picks...
          </Text>
          <Text style={[
            styles.loadingSubtext,
            {
              color: theme.colors.textSecondary,
              fontSize: responsiveFontSize.xs,
              marginTop: responsiveSpacing.xs,
            }
          ]}>
            Curating the best content for you
          </Text>
        </View>
      ) : sections.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: Math.max(
                moderateVerticalScale(12),
                insets.bottom + moderateVerticalScale(12)
              ),
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, sectionIndex) => (
            <View key={`section-${sectionIndex}`}>
              {renderSectionHeader(section.title, sectionIndex)}
              <View style={styles.sectionContent}>
                {section.data.map((item, index) => {
                  const globalIndex = sectionIndex * 100 + index;
                  const isFeatured = index === 0 && section.data.length > 2 && numColumns === 2;
                  
                  // Featured card should be full width
                  if (isFeatured) {
                    return (
                      <View 
                        key={item.id}
                        style={[
                          styles.featuredCardWrapper,
                          {
                            paddingHorizontal: moderateScale(isCurrentlySmall ? 12 : isCurrentlyMedium ? 16 : 20),
                            marginBottom: moderateVerticalScale(isCurrentlySmall ? 12 : isCurrentlyMedium ? 14 : 16),
                          }
                        ]}
                      >
                        {renderPosterCard({ item, index: globalIndex, localIndex: index }, section.data)}
                      </View>
                    );
                  }
                  
                  // Regular grid items - adjust index for featured card
                  const adjustedIndex = isFeatured ? index - 1 : index;
                  const rowIndex = Math.floor(adjustedIndex / numColumns);
                  const colIndex = adjustedIndex % numColumns;
                  const isFirstInRow = colIndex === 0;
                  const isLastInRow = colIndex === numColumns - 1;
                  
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.gridItemWrapper,
                        {
                          marginLeft: isFirstInRow ? moderateScale(isCurrentlySmall ? 12 : isCurrentlyMedium ? 16 : 20) : moderateScale(isCurrentlySmall ? 5 : isCurrentlyMedium ? 6 : 7),
                          marginRight: isLastInRow ? moderateScale(isCurrentlySmall ? 12 : isCurrentlyMedium ? 16 : 20) : moderateScale(isCurrentlySmall ? 5 : isCurrentlyMedium ? 6 : 7),
                          marginBottom: moderateVerticalScale(isCurrentlySmall ? 10 : isCurrentlyMedium ? 12 : 14),
                        }
                      ]}
                    >
                      {renderPosterCard({ item, index: globalIndex, localIndex: index }, section.data)}
                    </View>
                  );
                })}
              </View>
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
          <View style={styles.emptyIconWrapper}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={[
                styles.emptyIconOuter,
              {
                width: moderateScale(100),
                height: moderateScale(100),
                borderRadius: moderateScale(50),
              }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[
              styles.emptyIconInner,
              {
                width: moderateScale(85),
                height: moderateScale(85),
                borderRadius: moderateScale(42.5),
                backgroundColor: isDarkMode ? theme.colors.background : '#ffffff',
              }
            ]}>
              <Icon
                name="today"
                size={moderateScale(45)}
                color={theme.colors.primary}
              />
              </View>
            </LinearGradient>
          </View>
          <Text style={[
            styles.emptyText,
            {
              color: theme.colors.text,
              fontSize: responsiveFontSize.lg,
              marginTop: responsiveSpacing.lg,
              fontWeight: '700',
            }
          ]}>
            No picks available for today
          </Text>
          <Text style={[
            styles.emptySubtext,
            {
              color: theme.colors.textSecondary,
              fontSize: responsiveFontSize.sm,
              marginTop: responsiveSpacing.sm,
              textAlign: 'center',
              lineHeight: moderateVerticalScale(18),
            }
          ]}>
            Check back tomorrow for fresh picks!{'\n'}We're preparing something special for you.
          </Text>
        </View>
      )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...responsiveShadow.small,
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
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerTitleDot: {
    ...responsiveShadow.small,
  },
  headerSubtitle: {
    textAlign: 'center',
    letterSpacing: 0.3,
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
    textAlign: 'center',
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
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    ...responsiveShadow.large,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  featuredCard: {
    ...responsiveShadow.large,
    elevation: 8,
  },
  posterTouchable: {
    width: '100%',
    height: '100%',
  },
  posterImageContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: moderateScale(14),
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(14),
  },
  posterGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    pointerEvents: 'none',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: moderateScale(12),
    pointerEvents: 'none',
  },
  cardOverlayContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.3,
  },
  featuredBadge: {
    position: 'absolute',
    top: moderateScale(12),
    right: moderateScale(12),
    ...responsiveShadow.small,
  },
  featuredBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateVerticalScale(6),
    borderRadius: moderateScale(20),
    gap: moderateScale(4),
  },
  featuredBadgeText: {
    color: '#ffffff',
    fontSize: moderateScale(11),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gridItemWrapper: {
    // Wrapper for grid items
  },
  featuredCardWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveLayout.containerPaddingHorizontal,
  },
  loadingIconWrapper: {
    ...responsiveShadow.large,
  },
  loadingIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  loadingSubtext: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveLayout.containerPaddingHorizontal,
  },
  emptyIconWrapper: {
    ...responsiveShadow.large,
  },
  emptyIconOuter: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(10),
  },
  emptyIconInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptySubtext: {
    maxWidth: moderateScale(280),
  },
  sectionHeaderContainer: {
    width: '100%',
  },
  sectionHeaderWrapper: {
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },
  sectionHeaderGradient: {
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateVerticalScale(10),
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
    ...responsiveShadow.small,
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
