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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/types';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import existing components and services
import LazyFullImage from '../components/LazyFullImage';
import { useTheme } from '../context/ThemeContext';
import businessCategoryPostersApi from '../services/businessCategoryPostersApi';
import { Template } from '../services/dashboard';


// Import RelatedPosterItem component from PosterPlayerScreen
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

interface IndustryCategoryProps {
  industry?: string;
  _navigation?: StackNavigationProp<MainStackParamList>;
  posters?: Template[];
}

const IndustryCategory: React.FC<IndustryCategoryProps> = ({
  industry,
  _navigation,
  posters: initialPosters = []
}) => {
  const { theme } = useTheme();
  const { insets } = useSafeAreaInsets();
  const navigationProp = useNavigation<StackNavigationProp<MainStackParamList>>();

  // Screen dimensions
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;
  const isTabletDevice = screenWidth >= 768;
  const isSmallScreen = screenWidth < 380;
  const isFoldPhoneUnfolded = screenWidth >= 900;

  const moderateScale = useCallback((size: number, factor = 0.5) => size + (size * (screenWidth / 375 - 1) * factor), [screenWidth]);

  // State management - Software Company Industry Category
  const [posters, setPosters] = useState<Template[]>(initialPosters);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<Template | null>(null);
  const [selectedCategory, _setSelectedCategory] = useState<string>('CustomDev');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'english' | 'hindi'>('all');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Calculate preview overlay colors
  const previewOverlayColors = useMemo(() => {
    const primaryColor = theme.colors.primary || '#764ba2';
    const secondaryColor = theme.colors.secondary || theme.colors.primary || '#667eea';
    
    const startColor = secondaryColor || primaryColor;
    const endColor = primaryColor;
    return [
      `rgba(${parseInt(startColor.slice(1, 3), 16)}, ${parseInt(startColor.slice(3, 5), 16)}, ${parseInt(startColor.slice(5, 7), 16)}, 0.95)`,
      `rgba(${parseInt(endColor.slice(1, 3), 16)}, ${parseInt(endColor.slice(3, 5), 16)}, ${parseInt(endColor.slice(5, 7), 16)}, 0.85)`,
    ];
  }, [theme.colors]);

  // Languages array
  const languages = useMemo(() => [
    { id: 'all', name: 'All' },
    { id: 'english', name: 'English' },
    { id: 'hindi', name: 'हिंदी' },
  ], []);

  // Fetch posters for selected category
  const fetchPosters = useCallback(async () => {
    if (!selectedCategory) {
      console.log('📋 [SOFTWARE COMPANY] No category available for fetching posters');
      setPosters([]);
      setLoading(false);
      return;
    }

    console.log('📋 [SOFTWARE COMPANY] Fetching posters for category:', selectedCategory);
    setLoading(true);

    try {
      const response = await businessCategoryPostersApi.getPostersByCategory(selectedCategory, 200);

      if (response?.success && Array.isArray(response.data?.posters)) {
        const businessPosters = response.data.posters;

        // Convert BusinessCategoryPoster to Template format
        const templates: Template[] = businessPosters
          .map(poster => ({
            id: poster.id,
            name: poster.title || 'Software Company Poster',
            thumbnail: poster.thumbnail || poster.imageUrl,
            thumbnailUrl: poster.thumbnail || poster.imageUrl,
            category: poster.category || selectedCategory,
            downloads: poster.downloads || 0,
            isDownloaded: false,
            languages: poster.tags || [],
            tags: poster.tags || [],
            description: poster.description,
          }))
          .filter(template => template.thumbnail);

        console.log(`✅ [SOFTWARE COMPANY] Loaded ${templates.length} posters for category: ${selectedCategory}`);
        setPosters(templates);

        // Set first poster as selected if none selected
        if (templates.length > 0 && !selectedPoster) {
          setSelectedPoster(templates[0]);
        }
      } else {
        console.warn('⚠️ [SOFTWARE COMPANY] No posters found for category:', selectedCategory);
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
  }, [selectedCategory, selectedPoster]);

  // Filter posters based on language
  const filteredPosters = useMemo(() => {
    if (!posters || posters.length === 0) return [];

    let basePosters = posters;

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
  }, [posters, selectedLanguage]);

  // Calculate card dimensions
  const numColumns = useMemo(() => {
    return screenWidth >= 768 ? 4 : 3;
  }, [screenWidth]);

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

  // Get high quality image URL
  const getHighQualityImageUrl = useCallback((poster: Template) => {
    if (poster.thumbnailUrl && poster.thumbnailUrl.includes('unsplash')) {
      return poster.thumbnailUrl.replace(/w=\d+/, 'w=1600').replace(/h=\d+/, 'h=1200');
    }
    return poster.thumbnailUrl || poster.thumbnail || '';
  }, []);

  // Handle poster selection
  const handlePosterSelect = useCallback((poster: Template) => {
    console.log('🖼️ [SOFTWARE COMPANY] Poster selected:', poster.name);
    setSelectedPoster(poster);
  }, []);

  // Navigate to poster editor
  const navigateToPosterEditor = useCallback(() => {
    if (!selectedPoster) return;

    console.log('✏️ [SOFTWARE COMPANY] Navigating to poster editor with:', {
      posterId: selectedPoster.id,
      posterName: selectedPoster.name,
      category: selectedCategory
    });

    navigationProp.navigate('PosterEditor', {
      selectedImage: {
        uri: getHighQualityImageUrl(selectedPoster),
        title: selectedPoster.name,
        description: selectedPoster.category,
      },
      selectedLanguage: selectedLanguage,
      selectedTemplateId: selectedPoster.id,
      selectedTemplate: selectedPoster.name,
      posterCategory: selectedCategory,
      type: 'business',
      categoryName: selectedCategory,
    });
  }, [selectedPoster, selectedLanguage, selectedCategory, navigationProp, getHighQualityImageUrl]);

  // Handle back press
  const handleBackPress = useCallback(() => {
    console.log('🔙 [SOFTWARE COMPANY] Going back');
    navigationProp.goBack();
  }, [navigationProp]);

  // Get icon size based on screen dimensions
  const getIconSize = useCallback((size: number) => {
    return moderateScale(size);
  }, [moderateScale]);

  // Render related poster item
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
  }, [selectedPoster, cardWidth, cardHeight, handlePosterSelect, previewOverlayColors]);

  // Render skeleton item
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
      />
    );
  }, [cardWidth, cardHeight, theme.colors]);

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

    const imageUrl = getHighQualityImageUrl(selectedPoster);
    if (!imageUrl) {
      setImageDimensions(null);
      return;
    }

    Image.getSize(
      imageUrl,
      (width, height) => {
        console.log('📐 [SOFTWARE COMPANY] Image dimensions loaded:', { width, height });
        setImageDimensions({ width, height });
      },
      (error) => {
        console.warn('⚠️ [SOFTWARE COMPANY] Failed to load image dimensions:', error);
        setImageDimensions(null);
      }
    );
  }, [selectedPoster, getHighQualityImageUrl]);

  // Fetch posters when category changes
  useEffect(() => {
    fetchPosters();
  }, [fetchPosters]);

  // Update selected poster when posters array changes
  useEffect(() => {
    if (posters && posters.length > 0 && !selectedPoster) {
      setSelectedPoster(posters[0]);
    }
  }, [posters]);

  // Calculate preview height based on image dimensions
  const computedPreviewHeight = useMemo(() => {
    if (!imageDimensions) {
      return moderateScale(300);
    }

    const { width, height } = imageDimensions;
    const maxWidth = screenWidth - moderateScale(32);
    const aspectRatio = height / width;
    const calculatedHeight = Math.min(maxWidth * aspectRatio, screenHeight * 0.4);

    return Math.max(calculatedHeight, moderateScale(200));
  }, [imageDimensions, screenWidth, screenHeight, moderateScale]);

  // Only render if industry is "Software Company" or not specified (for backward compatibility)
  if (industry && industry !== 'Software Company') {
    return null;
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
        <View style={{ height: (insets?.top || 0) + moderateScale(12) }} />

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
                {selectedCategory}
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
              maxWidth={1200}
              showLoader={true}
            />
          ) : (
            <View style={styles.noPosterContainer}>
              <Text style={styles.noPosterText}>No poster selected</Text>
            </View>
          )}
        </View>

        {/* Language Filter */}
        <View style={styles.languageFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languageFilterScrollContent}
          >
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
          </ScrollView>
        </View>

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
                {selectedLanguage === 'all' ? 'Try refreshing or changing your category' : 'Try selecting "All" or a different language'}
              </Text>
            </View>
          )}
        </View>

        {/* Safe Area Bottom Spacing */}
        <View style={{ height: insets?.bottom || 0 }} />
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
  categorySelectorContainer: {
    marginVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
  },
  categoryButton: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    minWidth: moderateScale(80),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: moderateScale(4),
  },
  categoryButtonSelected: {
    borderWidth: 0,
  },
  categoryButtonGradient: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(80),
  },
  categoryButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
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
  },
  noPosterText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#666',
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
  languageFilterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFilterButton: {
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    minWidth: moderateScale(60),
  },
  languageFilterButtonSelected: {
    borderWidth: 0,
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
  relatedGrid: {
    justifyContent: 'flex-start',
    gap: moderateScale(3),
  },
  relatedList: {
    paddingBottom: moderateScale(20),
    paddingTop: moderateScale(4),
  },
  relatedFlatList: {
    flex: 1,
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
  relatedPosterImage: {
    width: '100%',
    height: '100%',
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
});

export default IndustryCategory;
