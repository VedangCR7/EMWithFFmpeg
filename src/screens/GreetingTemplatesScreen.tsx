import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import greetingTemplatesService, { GreetingCategory, GreetingTemplate } from '../services/greetingTemplates';
import { Template } from '../services/dashboard';
import OptimizedImage from '../components/OptimizedImage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

const addOpacityToColor = (color: string = '#667eea', opacity: number): string => {
  if (!color) {
    return `rgba(102, 126, 234, ${opacity})`;
  }

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      const expanded = hex
        .split('')
        .map(char => char + char)
        .join('');
      return addOpacityToColor(`#${expanded}`, opacity);
    }

    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }

  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`);
  }

  return color;
};

const CATEGORIES_CACHE_KEY = 'greeting_categories_cache_v1';
const CATEGORY_PREVIEWS_CACHE_KEY = 'greeting_category_previews_cache_v1';

const createPlaceholderPoster = (category: GreetingCategory): Template => ({
  id: `loading-${category.id}`,
  name: `${category.name} Posters`,
  thumbnail: '',
  category: category.name,
  downloads: 0,
  isDownloaded: false,
  tags: [category.name],
});

const SMALL_SCREEN_WIDTH_THRESHOLD = 450;

const GreetingTemplatesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();

  const isSmallScreen = screenWidth <= SMALL_SCREEN_WIDTH_THRESHOLD;
  const [categories, setCategories] = useState<GreetingCategory[]>([]);
  const safeAreaEdges = useMemo<Edge[]>(() => (isSmallScreen ? ['left', 'right'] : ['top', 'left', 'right']), [isSmallScreen]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [categoryPreviewImages, setCategoryPreviewImages] = useState<Record<string, string | null>>({});
  const isMountedRef = useRef(true);
  const previewCacheRef = useRef<Record<string, string | null>>({});

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const loadCachedData = async () => {
      try {
        const [cachedCategories, cachedPreviews] = await Promise.all([
          AsyncStorage.getItem(CATEGORIES_CACHE_KEY),
          AsyncStorage.getItem(CATEGORY_PREVIEWS_CACHE_KEY),
        ]);

        if (cachedCategories && isActive) {
          const parsedCategories: GreetingCategory[] = JSON.parse(cachedCategories);
          if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
            setCategories(parsedCategories);
            setInitialLoading(false);
          }
        }

        if (cachedPreviews && isActive) {
          const parsedPreviews: Record<string, string | null> = JSON.parse(cachedPreviews);
          if (parsedPreviews && typeof parsedPreviews === 'object') {
            previewCacheRef.current = parsedPreviews;
            setCategoryPreviewImages(parsedPreviews);
          }
        }
      } catch (error) {
        console.warn('[GreetingTemplatesScreen] Failed to load cache:', error);
      }
    };

    loadCachedData();

    return () => {
      isActive = false;
    };
  }, []);

  const fetchCategories = useCallback(async (isRefresh: boolean = false) => {
    try {
      const data = await greetingTemplatesService.getCategories();
      if (isMountedRef.current) {
        setCategories(data);
        setInitialLoading(false);
        AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(data)).catch(() => {});
      }
    } catch (error) {
      console.error('Error fetching greeting categories:', error);
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to load greeting categories. Please try again.');
      }
      if (isMountedRef.current) {
      setInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const extractTemplatePreview = useCallback((template?: GreetingTemplate | Template | null) => {
    if (!template) {
      return null;
    }
    const templateAny = template as any;
    return (
      template.thumbnail ||
      templateAny.imageUrl ||
      templateAny.url ||
      templateAny.content?.background ||
      templateAny.thumbnailUrl ||
      templateAny.banner ||
      templateAny.image ||
      null
    );
  }, []);

  const fetchCategoryPreview = useCallback(
    async (category: GreetingCategory): Promise<string | null> => {
      try {
        const directImage =
          (category as any).imageUrl ||
          (category as any).image ||
          (category as any).thumbnail ||
          (category as any).banner;
        if (directImage) {
          return directImage;
        }

        const normalizedName = category.name?.trim();
        let selectedTemplate: GreetingTemplate | Template | null = null;

        if (normalizedName) {
          try {
            const searchResults = await greetingTemplatesService.searchTemplates(normalizedName);
            if (Array.isArray(searchResults) && searchResults.length > 0) {
              const match = searchResults.find(result => {
                const templateAny = result as any;
                const tags: string[] = Array.isArray(templateAny.tags) ? templateAny.tags : [];
                const tagMatch = tags.some(tag => tag?.toLowerCase().includes(normalizedName.toLowerCase()));
                const categoryMatch = result.category?.toLowerCase().includes(normalizedName.toLowerCase());
                return tagMatch || categoryMatch;
              });
              selectedTemplate = match || searchResults[0];
            }
          } catch (searchError) {
            console.warn(`[GreetingTemplatesScreen] searchTemplates failed for ${normalizedName}:`, searchError);
          }
        }

        if (!selectedTemplate && normalizedName) {
          const byName = await greetingTemplatesService.getTemplates({ category: normalizedName, limit: 1 });
          selectedTemplate = byName?.[0] || null;
        }

        if (!selectedTemplate && category.id) {
          const byId = await greetingTemplatesService.getTemplates({ category: category.id, limit: 1 });
          selectedTemplate = byId?.[0] || null;
        }

        if (!selectedTemplate && normalizedName) {
          const byCategory = await greetingTemplatesService.getTemplatesByCategory(normalizedName, 1);
          selectedTemplate = byCategory?.[0] || null;
        }

        if (!selectedTemplate && normalizedName) {
          const bySearchFallback = await greetingTemplatesService.searchTemplates(`${normalizedName} greeting`);
          selectedTemplate = bySearchFallback?.[0] || null;
        }

        return extractTemplatePreview(selectedTemplate);
      } catch (error) {
        console.warn(`Error fetching preview for category ${category.name}:`, error);
        return null;
      }
    },
    [extractTemplatePreview],
  );

  useEffect(() => {
    if (categories.length === 0) {
      previewCacheRef.current = {};
      setCategoryPreviewImages({});
      return;
    }

    const activeIds = new Set(categories.map(category => category.id));
    previewCacheRef.current = Object.fromEntries(
      Object.entries(previewCacheRef.current).filter(([id]) => activeIds.has(id)),
    );
    setCategoryPreviewImages(prev => {
      const nextEntries = Object.entries(prev).filter(([id]) => activeIds.has(id));
      if (nextEntries.length === Object.keys(prev).length) {
        return prev;
      }
      return Object.fromEntries(nextEntries);
    });

    const pending = categories.filter(category => previewCacheRef.current[category.id] === undefined);
    if (pending.length === 0) {
      return;
    }

    let isActive = true;
    const concurrency = 4;

    const fetchBatch = async (batch: GreetingCategory[]) => {
      const results = await Promise.allSettled(
        batch.map(async category => {
          const uri = await fetchCategoryPreview(category);
          return { id: category.id, uri };
        }),
      );

      if (!isActive) {
        return;
      }

      const updates: Record<string, string | null> = {};
      results.forEach((result, index) => {
        const category = batch[index];
        if (result.status === 'fulfilled') {
          previewCacheRef.current[result.value.id] = result.value.uri;
          updates[result.value.id] = result.value.uri;
        } else {
          previewCacheRef.current[category.id] = null;
          updates[category.id] = null;
        }
      });

      setCategoryPreviewImages(prev => {
        let changed = false;
        const next = { ...prev };
        Object.entries(updates).forEach(([id, uri]) => {
          if (next[id] !== uri) {
            next[id] = uri;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    };

    const loadPreviews = async () => {
      for (let i = 0; i < pending.length && isActive; i += concurrency) {
        const batch = pending.slice(i, i + concurrency);
        await fetchBatch(batch);
      }
    };

    loadPreviews();

    return () => {
      isActive = false;
    };
  }, [categories, fetchCategoryPreview]);

  useEffect(() => {
    AsyncStorage.setItem(CATEGORY_PREVIEWS_CACHE_KEY, JSON.stringify(previewCacheRef.current)).catch(
      () => {},
    );
  }, [categoryPreviewImages]);

  const normalizedSearchQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filteredCategories = useMemo(() => {
    if (!normalizedSearchQuery) {
      return categories;
    }
    const lowerQuery = normalizedSearchQuery;
    return categories.filter(category => category.name?.toLowerCase().includes(lowerQuery));
  }, [categories, normalizedSearchQuery]);
  const isSearching = normalizedSearchQuery.length > 0;

  const toggleSearchBar = useCallback(() => {
    setIsSearchVisible(prev => !prev);
  }, []);

  useEffect(() => {
    if (!isSearchVisible && searchQuery) {
      setSearchQuery('');
    }
  }, [isSearchVisible, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      greetingTemplatesService.clearCache();
      const data = await greetingTemplatesService.refreshCategories();
      if (isMountedRef.current) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error refreshing greeting categories:', error);
      Alert.alert('Error', 'Unable to refresh categories right now.');
    } finally {
      if (isMountedRef.current) {
      setRefreshing(false);
      }
    }
  }, []);

  const handleCategoryPress = useCallback((category: GreetingCategory) => {
    const placeholderPoster = createPlaceholderPoster(category);

    navigation.navigate('PosterPlayer', {
      selectedPoster: placeholderPoster,
      relatedPosters: [],
      greetingCategory: category.name,
      originScreen: 'GreetingTemplates',
      posterLimit: 200,
    });
  }, [navigation]);

  const categoryColumns = useMemo(() => {
    if (screenWidth >= 768) {
      return 4;
    }
    if (screenWidth >= 480) {
      return 3;
    }
    return 2;
  }, [screenWidth]);

  const categoryCardGap = moderateScale(8);

  const categoryCardSize = useMemo(() => {
    const minSize = moderateScale(110);
    const maxSize = moderateScale(200);
    const horizontalPadding = moderateScale(16);
    const totalGap = categoryCardGap * Math.max(categoryColumns - 1, 0);
    const availableWidth = screenWidth - horizontalPadding * 2 - totalGap;
    if (availableWidth <= 0 || categoryColumns <= 0) {
      return minSize;
    }
    const rawSize = availableWidth / categoryColumns;
    return Math.max(minSize, Math.min(rawSize, maxSize));
  }, [categoryColumns, categoryCardGap, screenWidth]);

  const renderCategoryCard = useCallback(({ item, index }: { item: GreetingCategory; index: number }) => {
    const cardColor = item.color || '#667eea';
    const isLastInRow = (index + 1) % categoryColumns === 0;
    const isEmoji = Boolean(item.icon && EMOJI_REGEX.test(item.icon));
    const initials = item.name?.slice(0, 2).toUpperCase() || 'GC';
    const previewUri = categoryPreviewImages[item.id];
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          {
            width: categoryCardSize,
            height: categoryCardSize,
            marginRight: isLastInRow ? 0 : categoryCardGap,
            backgroundColor: addOpacityToColor(cardColor, 0.08),
            borderColor: addOpacityToColor(cardColor, 0.2),
          },
        ]}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.85}
      >
        {previewUri ? (
          <OptimizedImage uri={previewUri} style={styles.categoryImage} resizeMode="cover" />
        ) : (
          <View style={[styles.categoryFallback, { backgroundColor: addOpacityToColor(cardColor, 0.15) }]}>
            <Text style={[styles.categoryFallbackText, { color: cardColor }]}>
              {isEmoji ? item.icon : initials}
            </Text>
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
          style={styles.categoryGradient}
          pointerEvents="none"
        />
        <View style={styles.categoryLabelContainer}>
          <Text style={styles.categoryLabelText} numberOfLines={2}>
          {item.name}
        </Text>
        </View>
      </TouchableOpacity>
    );
  }, [categoryCardGap, categoryCardSize, categoryColumns, categoryPreviewImages, handleCategoryPress]);

  const keyExtractor = useCallback((item: GreetingCategory) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => {
      // Calculate row height including card size, gap, and row margin
      const rowMargin = categoryColumns > 1 ? moderateScale(8) : 0;
      const rowHeight = categoryCardSize + categoryCardGap + rowMargin;
      const rowIndex = Math.floor(index / categoryColumns);
      return {
        length: rowHeight,
        offset: rowIndex * rowHeight,
        index,
      };
    },
    [categoryCardGap, categoryCardSize, categoryColumns],
  );

  const flatListPerfConfig = useMemo(
    () => ({
      initialNumToRender: Math.max(categoryColumns * 2, 8),
      maxToRenderPerBatch: Math.max(categoryColumns * 2, 8),
      windowSize: 5,
      updateCellsBatchingPeriod: 80,
      removeClippedSubviews: true,
    }),
    [categoryColumns],
  );

  const listEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      {initialLoading ? (
        <>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading categories...
          </Text>
        </>
      ) : isSearching ? (
        <>
          <Icon name="search-off" size={moderateScale(40)} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No matching categories</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Try a different search term.
          </Text>
        </>
      ) : (
        <>
          <Icon name="category" size={moderateScale(40)} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No categories found</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Pull to refresh or try again later.
          </Text>
        </>
      )}
    </View>
  ), [initialLoading, isSearching, theme.colors.primary, theme.colors.text, theme.colors.textSecondary]);

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={safeAreaEdges}
    >
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
        <View
          style={[
          styles.header, 
          { 
            paddingTop: isSmallScreen ? moderateScale(57) : insets.top + moderateScale(2),
            paddingBottom: isSmallScreen ? moderateScale(2) : moderateScale(3),
            paddingHorizontal: moderateScale(4),
            },
          ]}
        >
          <View style={[styles.headerContent, { paddingHorizontal: moderateScale(2) }]}>
            <Text
              style={[
              styles.headerTitle,
              { 
                fontSize: isSmallScreen ? Math.max(moderateScale(16), 18) : Math.max(moderateScale(12), 14),
                color: theme.colors.text,
                },
              ]}
            >
              General Categories
            </Text>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={toggleSearchBar}
              activeOpacity={0.7}
            >
              <Icon
                name={isSearchVisible ? 'close' : 'search'}
                size={isSmallScreen ? moderateScale(20) : moderateScale(14)}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {isSearchVisible && (
          <View
            style={[
          styles.searchContainer, 
          { 
            marginHorizontal: moderateScale(8),
            marginVertical: moderateScale(3),
              },
            ]}
          >
            <View
              style={[
            styles.searchBar, 
            { 
              backgroundColor: theme.colors.cardBackground,
                },
              ]}
            >
              <Icon
                name="search"
                size={moderateScale(14)}
                color={theme.colors.textSecondary}
                style={{ marginLeft: moderateScale(2), marginRight: moderateScale(4) }}
              />
            <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Search categories..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
                autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon
                    name="clear"
                    size={moderateScale(14)}
                    color={theme.colors.textSecondary}
                    style={{
                      marginLeft: moderateScale(4),
                      marginRight: moderateScale(4),
                      padding: moderateScale(2),
                    }}
                  />
              </TouchableOpacity>
            )}
          </View>
        </View>
        )}

        <FlatList
          data={filteredCategories}
          keyExtractor={keyExtractor}
          numColumns={categoryColumns}
          key={`category-grid-${categoryColumns}`}
          renderItem={renderCategoryCard}
          columnWrapperStyle={categoryColumns > 1 ? styles.categoryRow : undefined}
            contentContainerStyle={[
            styles.categoriesList,
            {
              paddingBottom: Math.max(insets.bottom, moderateScale(12)),
              // Prevent bounce-back on small screens by ensuring content fills screen when empty
              flexGrow: filteredCategories.length === 0 ? 1 : undefined,
              // Ensure minimum content height to prevent bounce-back
              minHeight: filteredCategories.length > 0 ? screenHeight * 0.5 : undefined,
            },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={listEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          getItemLayout={getItemLayout}
          {...flatListPerfConfig}
        />
      </LinearGradient>
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
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(2),
  },
  headerTitle: {
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  headerIconButton: {
    padding: moderateScale(4),
    borderRadius: moderateScale(8),
  },
  searchContainer: {
    marginHorizontal: moderateScale(8),
    marginVertical: moderateScale(3),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(14),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: moderateScale(4),
    fontSize: moderateScale(10),
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: moderateScale(8),
    paddingTop: moderateScale(6),
  },
  categoryCard: {
    borderRadius: moderateScale(16),
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  categoryRow: {
    marginBottom: moderateScale(8),
    justifyContent: 'flex-start',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryFallbackText: {
    fontSize: moderateScale(28),
    fontWeight: '700',
  },
  categoryGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  categoryLabelContainer: {
    position: 'absolute',
    left: moderateScale(10),
    right: moderateScale(10),
    bottom: moderateScale(10),
  },
  categoryLabelText: {
    color: '#ffffff',
    fontSize: moderateScale(11),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  emptyTitle: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginTop: moderateScale(8),
  },
  emptySubtitle: {
    fontSize: moderateScale(10),
    textAlign: 'center',
    marginTop: moderateScale(4),
  },
  loadingText: {
    marginTop: moderateScale(8),
    fontSize: moderateScale(10),
  },
});

export default GreetingTemplatesScreen;
