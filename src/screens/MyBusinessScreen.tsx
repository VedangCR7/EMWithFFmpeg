import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import businessCategoryPostersApi, { BusinessCategoryPoster } from '../services/businessCategoryPostersApi';
import ComingSoonModal from '../components/ComingSoonModal';
import OptimizedImage from '../components/OptimizedImage';

// Compact spacing multiplier to reduce all spacing (matching HomeScreen)
const COMPACT_MULTIPLIER = 0.5;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced responsive design helpers with more granular breakpoints
const isUltraSmallScreen = screenWidth < 360;
const isSmallScreen = screenWidth >= 360 && screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414 && screenWidth < 480;
const isXLargeScreen = screenWidth >= 480;

// Orientation detection
const isPortrait = screenHeight > screenWidth;
const isLandscape = screenWidth > screenHeight;

// Device type detection
const isTablet = Math.min(screenWidth, screenHeight) >= 768;
const isPhone = !isTablet;

// Responsive helper functions (matching HomeScreen)
const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Enhanced responsive spacing and sizing system
const responsiveSpacing = {
  xs: isUltraSmallScreen ? 2 : isSmallScreen ? 4 : isMediumScreen ? 6 : isLargeScreen ? 8 : 10,
  sm: isUltraSmallScreen ? 4 : isSmallScreen ? 6 : isMediumScreen ? 8 : isLargeScreen ? 10 : 12,
  md: isUltraSmallScreen ? 6 : isSmallScreen ? 8 : isMediumScreen ? 10 : isLargeScreen ? 12 : 14,
  lg: isUltraSmallScreen ? 8 : isSmallScreen ? 10 : isMediumScreen ? 12 : isLargeScreen ? 14 : 16,
  xl: isUltraSmallScreen ? 10 : isSmallScreen ? 12 : isMediumScreen ? 14 : isLargeScreen ? 16 : 18,
  xxl: isUltraSmallScreen ? 12 : isSmallScreen ? 14 : isMediumScreen ? 16 : isLargeScreen ? 18 : 20,
  xxxl: isUltraSmallScreen ? 14 : isSmallScreen ? 16 : isMediumScreen ? 18 : isLargeScreen ? 20 : 24,
};

const responsiveFontSize = {
  xs: isUltraSmallScreen ? 8 : isSmallScreen ? 9 : isMediumScreen ? 10 : isLargeScreen ? 11 : 12,
  sm: isUltraSmallScreen ? 9 : isSmallScreen ? 10 : isMediumScreen ? 11 : isLargeScreen ? 12 : 13,
  md: isUltraSmallScreen ? 10 : isSmallScreen ? 11 : isMediumScreen ? 12 : isLargeScreen ? 13 : 14,
  lg: isUltraSmallScreen ? 11 : isSmallScreen ? 12 : isMediumScreen ? 13 : isLargeScreen ? 14 : 15,
  xl: isUltraSmallScreen ? 12 : isSmallScreen ? 13 : isMediumScreen ? 14 : isLargeScreen ? 15 : 16,
  xxl: isUltraSmallScreen ? 13 : isSmallScreen ? 14 : isMediumScreen ? 15 : isLargeScreen ? 16 : 17,
  xxxl: isUltraSmallScreen ? 14 : isSmallScreen ? 15 : isMediumScreen ? 16 : isLargeScreen ? 17 : 18,
  xxxxl: isUltraSmallScreen ? 15 : isSmallScreen ? 16 : isMediumScreen ? 17 : isLargeScreen ? 18 : 20,
  xxxxxl: isUltraSmallScreen ? 16 : isSmallScreen ? 17 : isMediumScreen ? 18 : isLargeScreen ? 19 : 22,
};

// Responsive value getter (matching GreetingTemplatesScreen)
const getResponsiveValue = (small: number, medium: number, large: number) => {
  if (screenWidth < 400) return small;
  if (screenWidth < 768) return medium;
  return large;
};

// Dynamic poster card dimensions for responsive grid layout (matching GreetingTemplatesScreen)
const getPosterCardDimensions = (currentWidth: number, currentHeight?: number) => {
  // Responsive columns: 3-6 based on screen size
  const columns = getResponsiveValue(3, 4, 6); // 3 for small, 4 for medium, 6 for large/tablet
  
  const dynamicScale = (size: number) => (currentWidth / 375) * size;
  const dynamicModerateScale = (size: number, factor = 0.5) => size + (dynamicScale(size) - size) * factor;
  const dynamicVerticalScale = (size: number) => ((currentHeight || screenHeight) / 667) * size;
  
  // Horizontal padding for the entire row
  const horizontalPadding = dynamicModerateScale(8);
  
  // Gap between cards
  const gap = dynamicModerateScale(3);
  
  // Calculate available width (total screen width minus padding and gaps)
  const totalGaps = (columns - 1) * gap;
  const availableWidth = currentWidth - (horizontalPadding * 2) - totalGaps;
  
  // Calculate card width to fit evenly
  const cardWidth = Math.floor(availableWidth / columns);
  
  // More compact height (matching GreetingTemplatesScreen)
  const cardHeight = dynamicVerticalScale(60);
  
  return { cardWidth, cardHeight, columns, gap };
};

const MyBusinessScreen: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  // Business category posters state
  const [businessCategoryPosters, setBusinessCategoryPosters] = useState<BusinessCategoryPoster[]>([]);
  const [postersLoading, setPostersLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userBusinessCategory, setUserBusinessCategory] = useState<string>('General');
  const [refreshing, setRefreshing] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  
  // Dynamic dimensions for responsive layout (matching HomeScreen)
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

  const currentScreenWidth = dimensions.width;
  const currentScreenHeight = dimensions.height;
  
  // Dynamic responsive scaling functions
  const dynamicScale = (size: number) => (currentScreenWidth / 375) * size;
  const dynamicVerticalScale = (size: number) => (currentScreenHeight / 667) * size;
  const dynamicModerateScale = (size: number, factor = 0.5) => size + (dynamicScale(size) - size) * factor;
  
  // Responsive icon sizes (compact - 60% of original)
  const getIconSize = (baseSize: number) => {
    return Math.max(10, Math.round(baseSize * (currentScreenWidth / 375) * 0.6));
  };
  
  // Consistent button sizing across devices (clamped for small/big screens)
  const buttonSize = Math.max(26, Math.min(34, dynamicModerateScale(30)));
  const iconSize = Math.max(14, Math.min(20, getIconSize(18)));
  const buttonPadding = Math.max(4, Math.min(8, dynamicModerateScale(4)));
  
  // Get dynamic dimensions with responsive columns
  const { cardWidth, cardHeight, columns, gap } = getPosterCardDimensions(currentScreenWidth, currentScreenHeight);

  // Optimized load with cache support
  const loadBusinessCategoryPosters = useCallback(async (isRefresh: boolean = false) => {
    setPostersLoading(true);
    try {
      // Cache will make this instant on subsequent loads
      const response = await businessCategoryPostersApi.getUserCategoryPosters();
      console.log('📦 [MY BUSINESS] Business poster endpoint response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        setBusinessCategoryPosters(response.data.posters);
        setUserBusinessCategory(response.data.category);
      } else {
        setBusinessCategoryPosters([]);
      }
      
      // Hide initial loading after first fetch
      if (initialLoading) {
        setInitialLoading(false);
      }
    } catch (error) {
      console.error('Error loading business category posters:', error);
      setBusinessCategoryPosters([]);
      if (initialLoading) {
        setInitialLoading(false);
      }
    } finally {
      setPostersLoading(false);
    }
  }, [initialLoading]);

  useEffect(() => {
    loadBusinessCategoryPosters();
  }, [loadBusinessCategoryPosters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear cache before refreshing
      businessCategoryPostersApi.clearCache();
      await loadBusinessCategoryPosters(true);
    } catch (error) {
      console.error('Error refreshing posters:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadBusinessCategoryPosters]);

  const handlePosterPress = (poster: BusinessCategoryPoster) => {
    // Convert BusinessCategoryPoster to Template format
    // Use imageUrl for main display, thumbnail for preview
    const selectedTemplate = {
      id: poster.id,
      name: poster.title,
      thumbnail: poster.imageUrl || poster.thumbnail, // Use main image URL
      category: poster.category,
      downloads: poster.downloads || 0,
      isDownloaded: false,
      tags: poster.tags || [],
    };

    // Get other posters as related posters (exclude the selected one)
    const relatedTemplates = businessCategoryPosters
      .filter(p => p.id !== poster.id)
      .map(p => ({
        id: p.id,
        name: p.title,
        thumbnail: p.imageUrl || p.thumbnail, // Use main image URL
        category: p.category,
        downloads: p.downloads || 0,
        isDownloaded: false,
        tags: p.tags || [],
      }));

    console.log('📱 [MY BUSINESS] Navigating to PosterPlayer');
    console.log('Selected Poster:', selectedTemplate);
    console.log('Using imageUrl:', poster.imageUrl);

    navigation.navigate('PosterPlayer', {
      selectedPoster: selectedTemplate,
      relatedPosters: relatedTemplates,
      searchQuery: '',
      templateSource: 'professional',
    });
  };

  // Memoized PosterItem component for better performance
  const PosterItem = React.memo<{
    item: BusinessCategoryPoster;
    index: number;
    cardWidth: number;
    cardHeight: number;
    columns: number;
    gap: number;
    onPress: (item: BusinessCategoryPoster) => void;
    theme: any;
  }>(({ item, index, cardWidth, cardHeight, columns, gap, onPress, theme }) => {
    const isLastInRow = (index + 1) % columns === 0;
    
    return (
      <View style={{ marginRight: isLastInRow ? 0 : gap }}>
        <TouchableOpacity
          style={[
            styles.posterCard,
            {
              width: cardWidth,
              height: cardHeight,
              borderRadius: dynamicModerateScale(10),
            }
          ]}
          onPress={() => onPress(item)}
          activeOpacity={0.8}
        >
          <OptimizedImage 
            uri={item.thumbnail} 
            style={styles.posterImage}
            resizeMode="cover"
            showLoader={true}
            loaderColor={theme.colors.primary}
            loaderSize="small"
          />
        </TouchableOpacity>
      </View>
    );
  }, (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.thumbnail === nextProps.item.thumbnail &&
      prevProps.index === nextProps.index &&
      prevProps.cardWidth === nextProps.cardWidth &&
      prevProps.cardHeight === nextProps.cardHeight &&
      prevProps.columns === nextProps.columns &&
      prevProps.gap === nextProps.gap &&
      prevProps.theme.colors.primary === nextProps.theme.colors.primary
    );
  });

  const renderPoster = useCallback(({ item, index }: { item: BusinessCategoryPoster; index: number }) => {
    return (
      <PosterItem
        item={item}
        index={index}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        columns={columns}
        gap={gap}
        onPress={handlePosterPress}
        theme={theme}
      />
    );
  }, [cardWidth, cardHeight, columns, gap, handlePosterPress, theme]);

  const keyExtractor = useCallback((item: BusinessCategoryPoster) => item.id, []);

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.gradient[0] || theme.colors.background }]}
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
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={[styles.backButton, {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                padding: buttonPadding,
              }]}
              onPress={() => navigation.goBack()}
            >
              <Icon 
                name="arrow-back" 
                size={iconSize} 
                color={theme.colors.text} 
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, {
              fontSize: dynamicModerateScale(10),
              color: theme.colors.text,
            }]}>
              My Business Posters
            </Text>
            <View style={[styles.headerSpacer, { width: dynamicModerateScale(30) }]} />
          </View>
        </View>

        {/* Posters Section */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
          bounces={true}
        >
          <View style={[styles.postersHeader, {
            marginHorizontal: dynamicModerateScale(8),
            marginTop: dynamicModerateScale(6),
            marginBottom: dynamicModerateScale(6),
          }]}>
            <Text style={[styles.sectionTitle, {
              fontSize: dynamicModerateScale(10),
              color: theme.colors.text,
            }]}>
              {userBusinessCategory} Posters
            </Text>
            {postersLoading && (
              <ActivityIndicator 
                size="small" 
                color={theme.colors.primary} 
                style={[styles.loadingIndicator, { marginLeft: dynamicModerateScale(4) }]}
              />
            )}
          </View>
          
          {businessCategoryPosters.length > 0 ? (
            <FlatList
              key={`posters-${columns}-${currentScreenWidth}-${currentScreenHeight}`}
              data={businessCategoryPosters}
              renderItem={renderPoster}
              keyExtractor={keyExtractor}
              numColumns={columns}
              columnWrapperStyle={[styles.posterRow, {
                marginBottom: dynamicModerateScale(4),
              }]}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={[styles.postersList, {
                paddingHorizontal: dynamicModerateScale(8),
                paddingBottom: dynamicModerateScale(12),
              }]}
              // Performance optimizations for large lists
              removeClippedSubviews={true}
              maxToRenderPerBatch={isTablet ? 12 : 8}
              windowSize={10}
              initialNumToRender={isTablet ? 12 : 8}
              updateCellsBatchingPeriod={50}
            />
          ) : (
            <View style={[styles.emptyPostersContainer, {
              paddingVertical: dynamicModerateScale(20),
            }]}>
              <Icon 
                name="image" 
                size={getIconSize(40)} 
                color={isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(51,51,51,0.7)'} 
              />
              <Text style={[styles.emptyPostersText, {
                fontSize: dynamicModerateScale(9),
                marginTop: dynamicModerateScale(6),
                marginBottom: dynamicModerateScale(10),
                lineHeight: dynamicModerateScale(14),
                color: theme.colors.textSecondary,
              }]}>
                No posters available for {userBusinessCategory} category
              </Text>
              <TouchableOpacity
                style={[styles.refreshButton, {
                  paddingHorizontal: dynamicModerateScale(12),
                  paddingVertical: dynamicModerateScale(8),
                  borderRadius: dynamicModerateScale(8),
                  alignItems: 'center',
                  justifyContent: 'center',
                }]}
                onPress={loadBusinessCategoryPosters}
              >
                <Text style={[styles.refreshButtonText, {
                  fontSize: dynamicModerateScale(9),
                  color: theme.colors.text,
                }]}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
      
      {/* Coming Soon Modal for Like Feature */}
      <ComingSoonModal
        visible={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
        title="Like Feature"
        subtitle="The like feature is under development and will be available soon!"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    paddingBottom: moderateScale(3),
    paddingHorizontal: moderateScale(4),
    paddingTop: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: moderateScale(4),
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 0,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: moderateScale(10),
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: moderateScale(30),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  postersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: moderateScale(8),
    marginTop: moderateScale(6),
    marginBottom: moderateScale(6),
  },
  sectionTitle: {
    fontSize: moderateScale(10),
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  loadingIndicator: {
    marginLeft: moderateScale(4),
  },
  postersList: {
    paddingHorizontal: moderateScale(8),
    paddingBottom: moderateScale(12),
  },
  posterRow: {
    justifyContent: 'flex-start',
    marginBottom: moderateScale(4),
    paddingHorizontal: 0,
  },
  posterCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  emptyPostersContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(20),
  },
  emptyPostersText: {
    fontSize: moderateScale(9),
    textAlign: 'center',
    marginTop: moderateScale(6),
    marginBottom: moderateScale(10),
    lineHeight: moderateScale(14),
    fontWeight: '500',
  },
  refreshButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  refreshButtonText: {
    fontSize: moderateScale(9),
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default MyBusinessScreen;

