import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  Image,
  PanResponder,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/types';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

import LazyFullImage from '../components/LazyFullImage';
import { useTheme } from '../context/ThemeContext';
import { useBusinessProfile } from '../context/BusinessProfileContext';
import businessCategoryPostersApi from '../services/businessCategoryPostersApi';
import businessProfileService, { BusinessProfile } from '../services/businessProfile';
import authService from '../services/auth';
import { Template } from '../services/dashboard';

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
      {isSelected && (
        <View style={styles.selectedPosterGlow} />
      )}
      
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

type IndustryCategoryScreenNavigationProp = StackNavigationProp<MainStackParamList, 'PosterPlayer'>;

const IndustryCategoryScreen: React.FC = () => {
  const navigation = useNavigation<IndustryCategoryScreenNavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { selectedBusinessProfile } = useBusinessProfile();
  
  // Business profile state
  const [userBusinessProfiles, setUserBusinessProfiles] = useState<BusinessProfile[]>([]);

  // Load user business profiles
  useEffect(() => {
    const loadBusinessProfiles = async () => {
      try {
        const currentUserId = authService.getCurrentUser()?.id;
        if (!currentUserId) return;

        const profiles = await businessProfileService.getUserBusinessProfiles(currentUserId);
        setUserBusinessProfiles(profiles);
      } catch (error) {
        console.error('Error loading business profiles:', error);
      }
    };

    loadBusinessProfiles();
  }, []);

  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  const { width: screenWidth, height: screenHeight } = dimensions;

  const isTabletDevice = screenWidth >= 768;
  const isFoldPhoneUnfolded = screenWidth >= 900;
  const moderateScale = useCallback((size: number, factor = 0.5) => size + (size * (screenWidth / 375 - 1) * factor), [screenWidth]);

  const [posters, setPosters] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<Template | null>(null);
  const [selectedIndustry, _setSelectedIndustry] = useState<string>('Software Company');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'english' | 'hindi'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('website-dev');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

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
    
    return () => {
      shimmerAnimation.stop();
    };
  }, [shimmerAnim]);

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

  const getHighQualityImageUrl = useCallback((poster: Template | null): string => {
    if (!poster) return '';

    const previewUrl = (poster as any).previewUrl;
    if (previewUrl) {
      return previewUrl;
    }

    const contentBackground = (poster as any).content?.background;
    if (contentBackground) {
      return contentBackground;
    }

    let url = poster.thumbnail || poster.thumbnailUrl || '';

    if (!url) {
      return '';
    }

    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      try {
        const [prefix, remainder] = url.split('/upload/');
        if (!remainder) {
          return url;
        }

        const parts = remainder.split('/');

        let versionIndex = -1;
        for (let i = 0; i < parts.length; i++) {
          if (/^v\d+/.test(parts[i])) {
            versionIndex = i;
            break;
          }
        }

        if (versionIndex >= 0) {
          const versionAndPath = parts.slice(versionIndex).join('/');
          const maxWidth = Math.max(Math.round(screenWidth * 2.5), 2400);
          const highQualityTransform = `q_100,c_limit,w_${maxWidth}`;
          const highQualityUrl = `${prefix}/upload/${highQualityTransform}/${versionAndPath}`;

          return highQualityUrl;
        }
      } catch (error) {
        console.warn('⚠️ Error parsing Cloudinary URL for high quality:', error);
      }
    }

    if (url.includes('/thumbnailUrl/') || url.includes('/thumbnail/')) {
      const fullUrl = url.replace(/\/thumbnailUrl\//g, '/url/').replace(/\/thumbnail\//g, '/images/');
      url = fullUrl;
    }

    const urlWithoutParams = url.split('?')[0];
    const existingParams = url.includes('?') ? url.split('?')[1] : '';
    const params = new URLSearchParams(existingParams);

    params.delete('quality');
    params.delete('width');
    params.delete('height');
    params.delete('w');
    params.delete('h');
    params.delete('size');

    params.set('quality', '100');
    params.set('width', '2400');

    const paramString = params.toString();
    return paramString ? `${urlWithoutParams}?${paramString}` : urlWithoutParams;
  }, [screenWidth]);

  const themeColors = theme.colors || {};
  const primaryColor = themeColors.primary || '#764ba2';
  const secondaryColor = themeColors.secondary || themeColors.primary || '#667eea';

  const previewOverlayColors = useMemo(() => {
    const startColor = secondaryColor || primaryColor;
    const endColor = primaryColor;
    return [
      hexToRgba(startColor, 0.95),
      hexToRgba(endColor, 0.85),
    ];
  }, [primaryColor, secondaryColor]);


  const categoryButtons = useMemo(() => [
    // { id: 'all', name: 'All', tags: [] },
    { id: 'website-dev', name: 'Website Development', tags: ['website'] },
    { id: 'mobile-app-dev', name: 'Mobile App Development', tags: [ 'mobile'] },
    { id: 'custom-software', name: 'Custom Software Solutions', tags: ['software'] },
    { id: 'ai-automation', name: 'AI & Automation', tags: ['ai'] },
    { id: 'it-consulting', name: 'IT Consulting & Support', tags: ['consulting'] },
    { id: 'software-dev', name: 'Software Development', tags: ['coding'] },
  ], []);

  const fetchPosters = useCallback(async () => {
    if (!selectedIndustry) {
      console.log('📋 [INDUSTRY] No industry available');
      setPosters([]);
      setLoading(false);
      return;
    }

    console.log('📋 [SOFTWARE COMPANY] Fetching posters for category: software company');
    setLoading(true);

    try {
      const response = await businessCategoryPostersApi.getPostersByCategory('software company', 200);

      if (response?.success && Array.isArray(response.data?.posters)) {
        const businessPosters = response.data.posters;

        const templates: Template[] = businessPosters
          .map(poster => ({
            id: poster.id,
            name: poster.title || 'Industry Poster',
            thumbnail: poster.thumbnail || poster.imageUrl,
            thumbnailUrl: poster.thumbnail || poster.imageUrl,
            category: poster.category || selectedIndustry,
            downloads: poster.downloads || 0,
            isDownloaded: false,
            languages: poster.tags || [],
            tags: poster.tags || [],
            description: poster.description,
          }))
          .filter(template => template.thumbnail);

        console.log(`✅ [SOFTWARE COMPANY] Loaded ${templates.length} posters for category: software company`);
        setPosters(templates);

        if (templates.length > 0) {
          setSelectedPoster(templates[0]);
        }
      } else {
        console.warn('⚠️ [SOFTWARE COMPANY] No posters found for category: software company');
        setPosters([]);
        setSelectedPoster(null);
      }
    } catch (error) {
      console.error('❌ [SOFTWARE COMPANY] Error fetching posters:', error);
      setPosters([]);
      setSelectedPoster(null);
    } finally {
      setLoading(false);
    }
  }, [selectedIndustry]);

  useEffect(() => {
    fetchPosters();
  }, []);

  useEffect(() => {
    if (posters && posters.length > 0 && !selectedPoster) {
      setSelectedPoster(posters[0]);
    }
  }, [posters, selectedPoster]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

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

  const cardHeight = cardWidth;

  const computedPreviewHeight = useMemo(() => {
    if (imageDimensions && imageDimensions.width > 0 && imageDimensions.height > 0) {
      const aspectHeight = screenWidth * (imageDimensions.height / imageDimensions.width);

      const baseMaxPercentage = isFoldPhoneUnfolded ? 0.50 : 0.60;
      const maxPosterHeightByPercentage = screenHeight * baseMaxPercentage;

      return Math.min(aspectHeight, maxPosterHeightByPercentage);
    }
    return screenHeight * 0.30;
  }, [imageDimensions, screenWidth, screenHeight, isFoldPhoneUnfolded]);

  const handlePosterSelect = useCallback((poster: Template) => {
    setSelectedPoster(poster);
  }, []);

  const handleBackPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  }, [navigation]);

  const navigateToPosterEditor = useCallback(() => {
    if (!selectedPoster) return;

    // ✅ Safe fallback values for required parameters
    const finalCategoryName = selectedPoster.category || "INDUSTRY";
    const finalPosterCategory = selectedPoster.category || "BUSINESS";

    // ✅ GET USER BUSINESS PROFILES
    const profiles = userBusinessProfiles || [];
    
    // ✅ SELECT DEFAULT PROFILE
    let profileToUse = selectedBusinessProfile;
    let categoryToUse = selectedBusinessProfile?.category || null;
    
    if (!profileToUse && profiles.length > 0) {
      profileToUse = profiles[0]; // default
      categoryToUse = profiles[0]?.category || null;
    }

    console.log('🔧 [INDUSTRY CATEGORY] Navigation params:', {
      finalCategoryName,
      finalPosterCategory,
      posterName: selectedPoster.name,
      hasProfile: !!profileToUse,
      profileName: profileToUse?.name,
      profilesCount: profiles.length
    });

    navigation.navigate('PosterEditor', {
      selectedImage: {
        uri: getHighQualityImageUrl(selectedPoster),
        title: selectedPoster.name,
        description: selectedPoster.category,
      },
      selectedLanguage: selectedLanguage,
      selectedTemplateId: selectedPoster.id,
      posterCategory: finalPosterCategory,
      type: "business",
      categoryName: finalCategoryName,
      source: "IndustryCategoryScreen", // ✅ ADD SOURCE IDENTIFIER

      // ✅ CRITICAL FIX
      businessProfile: profileToUse,
      businessCategory: categoryToUse || undefined,
    });
  }, [navigation, selectedPoster, selectedLanguage, getHighQualityImageUrl, selectedBusinessProfile, userBusinessProfiles]);

  const languages = [
    { id: 'all', name: 'All' },
    { id: 'english', name: 'English' },
    { id: 'hindi', name: 'Hindi' },
  ];

  const filteredPosters = useMemo(() => {
    console.log('🏷️ [FILTERING] Starting image filtering process');
    console.log(`📊 [FILTERING] Total posters before filtering: ${posters.length}`);
    console.log(`🎯 [FILTERING] Selected category: ${selectedCategory}`);
    console.log(`🌐 [FILTERING] Selected language: ${selectedLanguage}`);
    
    let basePosters = posters;

    // Apply category filtering first
    if (selectedCategory !== 'all') {
      const selectedCategoryButton = categoryButtons.find(btn => btn.id === selectedCategory);
      if (selectedCategoryButton && selectedCategoryButton.tags.length > 0) {
        console.log(`🏷️ [CATEGORY FILTER] Filtering by category: ${selectedCategoryButton.name}`);
        console.log(`🏷️ [CATEGORY FILTER] Category tags: [${selectedCategoryButton.tags.join(', ')}]`);
        
        const postersBeforeCategoryFilter = basePosters.length;
        basePosters = basePosters.filter(poster => {
          const posterTags = poster.tags || [];
          
          const matchesTag = selectedCategoryButton.tags.some(tag => {
            const exactTagMatch = posterTags.some(posterTag => posterTag.toLowerCase() === tag.toLowerCase());
            
            if (exactTagMatch) {
              console.log(`🔍 [MATCH DEBUG] Tag "${tag}" matched for poster "${poster.name}":`);
              console.log(`   - Exact tag match: ${exactTagMatch}`);
              console.log(`   - Poster tags: [${posterTags.join(', ')}]`);
              return true;
            }
            return false;
          });
          
          if (matchesTag) {
            console.log(`✅ [CATEGORY FILTER] Poster "${poster.name}" matched - Tags: [${posterTags.join(', ')}]`);
          } else {
            console.log(`❌ [CATEGORY FILTER] Poster "${poster.name}" did NOT match - Tags: [${posterTags.join(', ')}]`);
          }
          
          return matchesTag;
        });
        
        console.log(`📊 [CATEGORY FILTER] Posters after category filtering: ${basePosters.length} (removed ${postersBeforeCategoryFilter - basePosters.length})`);
      }
    } else {
      console.log(`🏷️ [CATEGORY FILTER] No category filter applied (selected: 'all')`);
    }

    // Apply language filtering
    if (selectedLanguage === 'all') {
      console.log(`🌐 [LANGUAGE FILTER] No language filter applied (selected: 'all')`);
      console.log(`🎉 [FILTERING COMPLETE] Final filtered posters count: ${basePosters.length}`);
      return basePosters;
    }
    
    console.log(`🌐 [LANGUAGE FILTER] Applying language filter: ${selectedLanguage}`);
    const postersBeforeLanguageFilter = basePosters.length;
    
    const finalPosters = basePosters.filter(poster => {
      const posterTags = poster.tags || [];
      
      let matchesLanguage = false;
      
      if (selectedLanguage === 'english') {
        matchesLanguage = posterTags.some(tag => tag.toLowerCase() === 'english');
      } else if (selectedLanguage === 'hindi') {
        matchesLanguage = posterTags.some(tag => tag.toLowerCase() === 'hindi');
      }
      
      if (matchesLanguage) {
        console.log(`✅ [LANGUAGE FILTER] Poster "${poster.name}" matched language: ${selectedLanguage} - Tags: [${posterTags.join(', ')}]`);
      }
      
      return matchesLanguage;
    });
    
    console.log(`📊 [LANGUAGE FILTER] Posters after language filtering: ${finalPosters.length} (removed ${postersBeforeLanguageFilter - finalPosters.length})`);
    console.log(`🎉 [FILTERING COMPLETE] Final filtered posters count: ${finalPosters.length}`);
    
    return finalPosters;
  }, [posters, selectedCategory, selectedLanguage, categoryButtons]);

  useEffect(() => {
    if (filteredPosters.length > 0 && (!selectedPoster || !filteredPosters.find(p => p.id === selectedPoster.id))) {
      setSelectedPoster(filteredPosters[0]);
    }
  }, [filteredPosters, selectedPoster]);

  const currentPosterIndex = useMemo(() => {
    if (!selectedPoster || !filteredPosters.length) {
      return -1;
    }
    return filteredPosters.findIndex(poster => poster.id === selectedPoster.id);
  }, [filteredPosters, selectedPoster]);

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

  const goToNextPoster = useCallback(() => {
    if (currentPosterIndex === -1) {
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
  }, [currentPosterIndex, showPosterAtIndex, selectedPoster, filteredPosters]);

  const goToPreviousPoster = useCallback(() => {
    if (currentPosterIndex === -1) {
      if (selectedPoster && filteredPosters.length > 0 && filteredPosters[0].id === selectedPoster.id) {
        return;
      }
      showPosterAtIndex(0);
      return;
    }
    const previousIndex = currentPosterIndex - 1;
    if (previousIndex >= 0) {
      showPosterAtIndex(previousIndex);
    }
  }, [currentPosterIndex, showPosterAtIndex, selectedPoster, filteredPosters]);

  const swipeThreshold = 50;
  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15;
        },
        onPanResponderGrant: () => {
        },
        onPanResponderMove: () => {
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx, vx } = gestureState;
          if (dx < -swipeThreshold || vx < -0.5) {
            goToNextPoster();
          } else if (dx > swipeThreshold || vx > 0.5) {
            goToPreviousPoster();
          }
        },
        onPanResponderTerminate: () => {
        },
      }),
    [goToNextPoster, goToPreviousPoster, swipeThreshold],
  );

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
            backgroundColor: theme.colors.inputBackground || '#f0f0f0',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.skeletonShimmer,
            {
              backgroundColor: theme.colors.primary + '20' || 'rgba(102, 126, 234, 0.2)',
              opacity: shimmerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.7],
              }),
              transform: [
                {
                  translateX: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-cardWidth, cardWidth],
                  }),
                },
              ],
            }
          ]}
        />
        <View style={styles.skeletonContent}>
          <View style={[
            styles.skeletonImage,
            { backgroundColor: theme.colors.border + '40' || 'rgba(0,0,0,0.1)' }
          ]} />
          <View style={styles.skeletonTextContainer}>
            <View style={[
              styles.skeletonTextLine,
              { backgroundColor: theme.colors.border + '60' || 'rgba(0,0,0,0.15)' }
            ]} />
            <View style={[
              styles.skeletonTextLine,
              styles.skeletonTextLineSmall,
              { backgroundColor: theme.colors.border + '40' || 'rgba(0,0,0,0.1)' }
            ]} />
          </View>
        </View>
      </View>
    );
  }, [cardWidth, cardHeight, theme.colors, shimmerAnim]);

  const getIconSize = useCallback((baseSize: number) => {
    const scale = screenWidth / 375;
    return Math.round(baseSize * scale);
  }, [screenWidth]);

  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.gradient[0] || '#e8e8e8' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={{ height: (insets?.top || 0) + moderateScale(12) }} />

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
                {selectedIndustry}
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

        <View
          style={[styles.posterContainer, { height: computedPreviewHeight }]}
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

        {/* Category Buttons - Horizontal Scroll */}
        <View style={styles.serviceFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryButtonsScrollContent}
            nestedScrollEnabled={true}
          >
            {categoryButtons.map((category) => {
              const isCategoryActive = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.softwareCategoryButton,
                    isCategoryActive && styles.serviceFilterButtonActive
                  ]}
                  onPress={() => {
                    const newCategory = selectedCategory === category.id ? null : category.id;
                    
                    // Log button click details
                    console.log(`🔘 [BUTTON CLICK] ${category.name} button clicked`);
                    console.log(`🏷️ [BUTTON DETAILS] Category ID: ${category.id}`);
                    console.log(`🏷️ [BUTTON DETAILS] Category tags: [${category.tags.join(', ')}]`);
                    console.log(`🔄 [BUTTON DETAILS] Previous selected category: ${selectedCategory}`);
                    console.log(`🔄 [BUTTON DETAILS] New selected category: ${newCategory || 'none (deselected)'}`);
                    
                    if (newCategory) {
                      console.log(`✅ [CATEGORY SELECTION] Activating category: ${category.name}`);
                      console.log(`🎯 [CATEGORY SELECTION] Will filter posters with tags: [${category.tags.join(', ')}]`);
                    } else {
                      console.log(`❌ [CATEGORY SELECTION] Deactivating category: ${category.name}`);
                      console.log(`🔄 [CATEGORY SELECTION] Will show all posters (no category filter)`);
                    }
                    
                    setSelectedCategory(newCategory);
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
                {selectedLanguage === 'all' ? 'Try refreshing or changing your industry' : 'Try selecting "All" or a different language'}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: insets.bottom }} />
      </LinearGradient>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
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
    minHeight: moderateScale(36),
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(11),
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
  categoryButtonsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    gap: moderateScale(10),
    flexGrow: 1,
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
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
    alignSelf: 'center',
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
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  skeletonContent: {
    flex: 1,
    padding: moderateScale(8),
  },
  skeletonImage: {
    flex: 1,
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(8),
  },
  skeletonTextContainer: {
    gap: moderateScale(4),
  },
  skeletonTextLine: {
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    width: '80%',
  },
  skeletonTextLineSmall: {
    width: '60%',
  },
});

export default IndustryCategoryScreen;
