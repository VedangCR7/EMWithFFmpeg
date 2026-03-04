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
  ActivityIndicator,
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

type TestScreenRouteProp = RouteProp<MainStackParamList, 'TestScreen'>;
type TestScreenNavigationProp = StackNavigationProp<MainStackParamList, 'TestScreen'>;

const TestScreen: React.FC = () => {
  const { theme } = useTheme();
  const themeColors = theme.colors || {};
  const primaryColor = themeColors.primary || '#764ba2';
  const secondaryColor = themeColors.secondary || themeColors.primary || '#667eea';
  const navigation = useNavigation<TestScreenNavigationProp>();
  const route = useRoute<TestScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  const { selectedCategory } = route.params;
  
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
  
  // Responsive scaling functions with safety checks
  const scale = useCallback((size: number) => {
    if (!screenWidth || isNaN(screenWidth) || screenWidth <= 0) {
      return size;
    }
    return (screenWidth / 375) * size;
  }, [screenWidth]);
  
  const moderateScale = useCallback((size: number, factor = 0.5) => {
    const scaled = scale(size);
    if (isNaN(scaled) || !isFinite(scaled)) {
      return size;
    }
    return size + (scaled - size) * factor;
  }, [scale]);

  const getIconSize = useCallback((size: number) => {
    return moderateScale(size);
  }, [moderateScale]);

  // State for posters and loading
  const [posters, setPosters] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Convert BusinessCategoryPoster to Template format
  const convertPosterToTemplate = useCallback((poster: any): Template => {
    return {
      id: poster.id,
      name: poster.title || poster.name,
      thumbnail: poster.thumbnail,
      category: poster.category,
      downloads: poster.downloads || 0,
      isDownloaded: poster.isDownloaded || false,
      tags: poster.tags || [],
      languages: [],
    };
  }, []);

  // Fetch posters for the selected category
  const fetchPosters = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      
      const response = await businessCategoryPostersApi.getPostersByCategory(selectedCategory, 1000, isRefresh);
      
      if (response.success && response.data.posters) {
        const templates: Template[] = response.data.posters.map(convertPosterToTemplate);
        setPosters(templates);
      } else {
        setPosters([]);
      }
    } catch (error) {
      console.error('Error fetching posters for TestScreen:', error);
      setPosters([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, convertPosterToTemplate]);

  // Initial fetch
  useEffect(() => {
    fetchPosters();
  }, [fetchPosters]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosters(true);
  }, [fetchPosters]);

  // Handle back press
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Handle poster press
  const handlePosterPress = useCallback((poster: Template) => {
    const relatedPosters = posters.filter(p => p.id !== poster.id);
    
    navigation.navigate('PosterPlayer', {
      selectedPoster: poster,
      relatedPosters: relatedPosters,
      businessCategory: selectedCategory,
      originScreen: 'TestScreen',
    });
  }, [navigation, posters, selectedCategory]);

  // Memoized poster item component
  const PosterItem = React.memo(({ item }: { item: Template }) => {
    const handlePress = useCallback(() => {
      handlePosterPress(item);
    }, [item, handlePosterPress]);

    const cardWidth = moderateScale(180);
    const cardHeight = moderateScale(240);

    return (
      <TouchableOpacity
        style={[
          styles.posterCard,
          { 
            width: cardWidth, 
            height: cardHeight,
            backgroundColor: theme.colors.cardBackground 
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[styles.posterImageContainer, { height: cardHeight * 0.75 }]}>
          {item.thumbnail ? (
            <OptimizedImage
              uri={item.thumbnail}
              style={styles.posterImage}
              resizeMode="cover"
              mode="full"
            />
          ) : (
            <View style={[styles.posterImage, styles.posterPlaceholder]}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.posterInfo}>
          <Text 
            style={[styles.posterName, { color: theme.colors.text }]} 
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text 
            style={[styles.posterCategory, { color: theme.colors.textSecondary }]} 
            numberOfLines={1}
          >
            {item.category}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, (prevProps, nextProps) => {
    return prevProps.item.id === nextProps.item.id;
  });

  // Render poster item
  const renderPosterItem = useCallback(({ item }: { item: Template }) => {
    return <PosterItem item={item} />;
  }, []);

  // Get computed dimensions for layout
  const cardWidth = moderateScale(180);
  const cardGap = moderateScale(12);
  const containerPadding = moderateScale(16);

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

        {/* Header with Back Arrow and Category Name */}
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
                {selectedCategory} (Test) {!loading && posters.length > 0 && `(${posters.length} images)`}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                Loading all posters for "{selectedCategory}"...
              </Text>
              <Text style={[styles.loadingSubText, { color: theme.colors.textSecondary }]}>
                This may take a moment for HD images
              </Text>
            </View>
          ) : posters.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="image-not-supported" size={moderateScale(48)} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                No posters found for "{selectedCategory}"
              </Text>
              <Text style={[styles.loadingSubText, { color: theme.colors.textSecondary }]}>
                Try refreshing or selecting a different category
              </Text>
            </View>
          ) : (
            <FlatList
              data={posters}
              renderItem={renderPosterItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={[
                styles.postersContainer,
                { 
                  paddingHorizontal: containerPadding,
                  paddingBottom: insets.bottom + moderateScale(100)
                }
              ]}
              columnWrapperStyle={styles.row}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={8}
              windowSize={10}
              initialNumToRender={8}
              updateCellsBatchingPeriod={50}
              getItemLayout={(data, index) => ({
                length: cardWidth + cardGap,
                offset: (cardWidth + cardGap) * index,
                index,
              })}
            />
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backArrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backArrowButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  contentArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingSubText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  postersContainer: {
    paddingTop: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  posterCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  posterImageContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  posterInfo: {
    padding: 8,
  },
  posterName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  posterCategory: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default TestScreen;
