import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
  InteractionManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import greetingTemplatesService, { GreetingCategory, GreetingTemplate } from '../services/greetingTemplates';
import api from '../services/api';
import { Template } from '../services/dashboard';
import OptimizedImage from '../components/OptimizedImage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

// Initial dimensions for module-level scale functions (used in styles)
const { width: INITIAL_SCREEN_WIDTH, height: INITIAL_SCREEN_HEIGHT } = Dimensions.get('window');

const scale = (size: number) => (INITIAL_SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) => (INITIAL_SCREEN_HEIGHT / 667) * size;
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
const MIN_GENERAL_CATEGORY_COUNT = 8;
const PREVIEW_TIMEOUT_MS = 6500;

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
  const { isDarkMode, theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();

  // Dynamic dimensions for responsive layout (matches HomeScreen pattern)
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

  // Scale functions using reactive dimensions
  const scale = useCallback((size: number) => (screenWidth / 375) * size, [screenWidth]);
  const verticalScale = useCallback((size: number) => (screenHeight / 667) * size, [screenHeight]);
  const moderateScale = useCallback((size: number, factor = 0.5) => {
    const scaled = scale(size);
    return size + (scaled - size) * factor;
  }, [scale]);

  const isSmallScreen = screenWidth <= SMALL_SCREEN_WIDTH_THRESHOLD;
  const [categories, setCategories] = useState<GreetingCategory[]>([]);
  const safeAreaEdges = useMemo<Edge[]>(() => (isSmallScreen ? ['left', 'right'] : ['top', 'left', 'right']), [isSmallScreen]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [categoryPreviewImages, setCategoryPreviewImages] = useState<Record<string, string | null>>({});
  const [visibleCategoryIds, setVisibleCategoryIds] = useState<Set<string>>(new Set());
  const isMountedRef = useRef(true);
  const previewCacheRef = useRef<Record<string, string | null>>({});
  const previewRefreshKeyRef = useRef(0); // Force preview re-fetch on refresh
  const sectionAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;
  const animatedSectionsRef = useRef<Set<string>>(new Set());
  const previewFetchQueueRef = useRef<Set<string>>(new Set()); // Track categories queued for preview fetching
  const previewFetchWorkersRef = useRef<Set<Promise<void>>>(new Set()); // Track active workers

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
        logger.warn('[GreetingTemplatesScreen] Failed to load cache:', error);
      }
    };

    loadCachedData();

    return () => {
      isActive = false;
    };
  }, []);

  const ensureAllGeneralCategories = useCallback(async (initialCategories: GreetingCategory[] = [], deferFallback: boolean = false) => {
    // Build a map so we can merge primary and fallback results without duplicates
    const categoryMap = new Map<string, GreetingCategory>();
    initialCategories.forEach(category => {
      if (!category?.name) {
        return;
      }
      const key = (category.id || category.name).toString();
      categoryMap.set(key, category);
    });

    // If we already have a reasonable number of categories, skip the fallback fetch
    if (categoryMap.size >= MIN_GENERAL_CATEGORY_COUNT) {
      return Array.from(categoryMap.values());
    }

    // Defer fallback fetch to not block initial load
    const fetchFallback = async () => {
      try {
        // Fallback to the dedicated greeting categories endpoint to make sure we have every general category
        const response = await api.get('/api/mobile/greeting-categories');
        const fallbackCategories = response?.data?.data?.categories || response?.data?.categories || [];

        const newCategories: GreetingCategory[] = [];
        fallbackCategories.forEach((category: any) => {
          const name = category?.name || category?.category;
          if (!name) {
            return;
          }
          const key = category?.id || name;
          if (categoryMap.has(key)) {
            return;
          }

          const newCategory: GreetingCategory = {
            id: key,
            name,
            icon: category.icon || '📄',
            color: category.color || '#4A90E2',
            parentCategoryName:
              category.parentCategoryName ||
              category.parentCategory ||
              category.mainCategory ||
              'General',
          };
          categoryMap.set(key, newCategory);
          newCategories.push(newCategory);
        });

        // Update categories if new ones were found
        if (newCategories.length > 0 && isMountedRef.current) {
          setCategories(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const merged = [...prev, ...newCategories.filter(c => !existingIds.has(c.id))];
            return merged;
          });
        }
      } catch (fallbackError) {
        logger.warn('[GreetingTemplatesScreen] Fallback fetch for general categories failed:', fallbackError);
      }
    };

    if (deferFallback) {
      // Defer to after interactions complete
      InteractionManager.runAfterInteractions(() => {
        fetchFallback();
      });
    } else {
      await fetchFallback();
    }

    return Array.from(categoryMap.values());
  }, []);

  const fetchCategories = useCallback(async (isRefresh: boolean = false) => {
    try {
      const data = await greetingTemplatesService.getCategories();
      // Defer fallback fetch to not block initial load
      const mergedCategories = await ensureAllGeneralCategories(data || [], !isRefresh);
      if (isMountedRef.current) {
        setCategories(mergedCategories || []);
        setInitialLoading(false);
        if (mergedCategories && mergedCategories.length > 0) {
          AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(mergedCategories)).catch(() => {});
        }
      }
    } catch (error) {
      logger.error('Error fetching greeting categories:', error);
      if (__DEV__) {
        console.error('[GreetingTemplatesScreen] Error details:', error);
      }
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to load greeting categories. Please try again.');
      }
      if (isMountedRef.current) {
        setInitialLoading(false);
      }
    }
  }, [ensureAllGeneralCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const withTimeout = useCallback(
    async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
      return new Promise(resolve => {
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve(fallback);
          }
        }, timeoutMs);

        promise
          .then(result => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve(result);
            }
          })
          .catch(() => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve(fallback);
            }
          });
      });
    },
    [],
  );

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
    async (category: GreetingCategory, usedPreviewUris?: Set<string>): Promise<string | null> => {
      try {
        // Check for direct image first (same as HomeScreen)
        const directImage =
          (category as any).imageUrl ||
          (category as any).image ||
          (category as any).thumbnail ||
          (category as any).banner;
        if (directImage) {
          return directImage;
        }

        const usedUris = usedPreviewUris || new Set<string>();
        let selectedTemplate: GreetingTemplate | Template | null = null;

        // Generate search variations for better matching (handle special characters, spaces, etc.)
        const categoryName = category.name || '';
        const normalizedCategory = categoryName.toLowerCase()
          .replace(/[&]/g, 'and')
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        const categoryWords = normalizedCategory.split(/\s+/).filter(word => word.length > 0);
        const searchVariations = [
          categoryName.toLowerCase(),
          normalizedCategory,
          ...categoryWords, // Individual words
          categoryWords.join(' '), // Combined words
        ].filter((v, i, arr) => arr.indexOf(v) === i && v.length > 0); // Remove duplicates and empty

        // Prefer a direct category query first (faster than search)
        try {
          const directTemplates =
            (await withTimeout(
              greetingTemplatesService.getTemplates({ category: categoryName, limit: 12 }),
              PREVIEW_TIMEOUT_MS,
              [],
            )) || [];

          const categoryNameLower = categoryName.toLowerCase();
          const matchingDirect = directTemplates.find(template => {
            const previewUri = extractTemplatePreview(template);
            if (!previewUri || usedUris.has(previewUri)) {
              return false;
            }
            const templateAny = template as any;
            const templateTags = Array.isArray(templateAny.tags) ? templateAny.tags : [];
            
            // More lenient matching - check category and tags against variations
            const templateCategoryLower = template.category?.toLowerCase() || '';
            const categoryMatch = templateCategoryLower.includes(categoryNameLower) ||
                                 templateCategoryLower.includes(normalizedCategory) ||
                                 categoryWords.some(word => templateCategoryLower.includes(word));
            
            const tagMatch = templateTags.some((tag: string) => {
              if (typeof tag !== 'string') return false;
              const tagLower = tag.toLowerCase();
              return tagLower.includes(categoryNameLower) ||
                     tagLower.includes(normalizedCategory) ||
                     categoryWords.some(word => tagLower.includes(word) || word.includes(tagLower));
            });
            
            return categoryMatch || tagMatch;
          });

          selectedTemplate = matchingDirect || directTemplates?.[0] || null;
        } catch (error) {
          if (__DEV__) {
            console.warn(`⚠️ Direct preview fetch failed for ${categoryName}:`, error);
          }
        }

        // If direct fetch failed, try search with multiple variations
        if (!selectedTemplate) {
          // Try searches with different variations in parallel
          const searchPromises = searchVariations.slice(0, 3).map(variation =>
            withTimeout(
              greetingTemplatesService.searchTemplates(variation, undefined, 12),
              PREVIEW_TIMEOUT_MS,
              []
            )
          );

          try {
            const searchResults = await Promise.all(searchPromises);
            const allTemplates = searchResults.flat().filter(Boolean);

            const categoryNameLower = categoryName.toLowerCase();
            const matchingTemplate = allTemplates.find(template => {
              const previewUri = extractTemplatePreview(template);
              if (!previewUri || usedUris.has(previewUri)) {
                return false;
              }

              const templateAny = template as any;
              const templateTags = Array.isArray(templateAny.tags) ? templateAny.tags : [];
              
              // More lenient matching
              const templateCategoryLower = template.category?.toLowerCase() || '';
              const categoryMatch = templateCategoryLower.includes(categoryNameLower) ||
                                   templateCategoryLower.includes(normalizedCategory) ||
                                   categoryWords.some(word => templateCategoryLower.includes(word));

              const tagMatch = templateTags.some((tag: string) => {
                if (typeof tag !== 'string') return false;
                const tagLower = tag.toLowerCase();
                return tagLower.includes(categoryNameLower) ||
                       tagLower.includes(normalizedCategory) ||
                       categoryWords.some(word => tagLower.includes(word) || word.includes(tagLower));
              });

              return categoryMatch || tagMatch;
            });

            selectedTemplate = matchingTemplate || allTemplates?.[0] || null;
          } catch (error) {
            if (__DEV__) {
              console.warn(`⚠️ Failed to fetch preview for greeting category ${categoryName}:`, error);
            }
          }
        }

        // Final fallback: if still no template, try a broader search with just the first word
        if (!selectedTemplate && categoryWords.length > 0) {
          try {
            const firstWord = categoryWords[0];
            if (firstWord.length >= 3) { // Only if word is meaningful
              const fallbackTemplates = await withTimeout(
                greetingTemplatesService.searchTemplates(firstWord, undefined, 20),
                PREVIEW_TIMEOUT_MS,
                []
              );
              
              if (fallbackTemplates && fallbackTemplates.length > 0) {
                // Find any template with a valid preview that's not already used
                selectedTemplate = fallbackTemplates.find(template => {
                  const previewUri = extractTemplatePreview(template);
                  return previewUri && !usedUris.has(previewUri);
                }) || fallbackTemplates[0] || null;
              }
            }
          } catch (error) {
            // Silently fail - we've tried our best
          }
        }

        const previewUri = extractTemplatePreview(selectedTemplate);
        
        // Track this preview URI as used if we have a set to track
        if (previewUri && usedPreviewUris) {
          usedPreviewUris.add(previewUri);
        }
        
        return previewUri;
      } catch (error) {
        console.warn(`Error fetching preview for category ${category.name}:`, error);
        return null;
      }
    },
    [extractTemplatePreview, withTimeout],
  );

  // Function to fetch previews for specific category IDs
  const fetchPreviewsForCategories = useCallback(
    async (categoryIds: string[], priority: 'high' | 'low' = 'low') => {
      if (!isMountedRef.current || categoryIds.length === 0) return;

      const categoriesToFetch = categories.filter(category => {
        const cached = previewCacheRef.current[category.id];
        const isQueued = previewFetchQueueRef.current.has(category.id);
        return categoryIds.includes(category.id) && cached === undefined && !isQueued;
      });

      if (categoriesToFetch.length === 0) return;

      // Mark as queued
      categoriesToFetch.forEach(category => {
        previewFetchQueueRef.current.add(category.id);
      });

      const concurrency = priority === 'high' ? 6 : 2; // Higher concurrency for visible items
      const usedPreviewUris = new Set<string>(
        Object.values(previewCacheRef.current).filter((uri): uri is string => uri !== null),
      );

      // Batch updates to reduce re-renders
      const batchedUpdates: Record<string, string | null> = {};
      let batchTimer: NodeJS.Timeout | null = null;

      const flushBatch = () => {
        if (Object.keys(batchedUpdates).length > 0 && isMountedRef.current) {
          const updates = { ...batchedUpdates };
          Object.keys(batchedUpdates).length = 0; // Clear batch

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
        }
        batchTimer = null;
      };

      const scheduleBatchUpdate = (id: string, uri: string | null) => {
        batchedUpdates[id] = uri;
        if (!batchTimer) {
          batchTimer = setTimeout(flushBatch, 100); // Batch updates every 100ms
        }
      };

      const queue: GreetingCategory[] = [...categoriesToFetch];
      const worker = async () => {
        while (queue.length > 0 && isMountedRef.current) {
          const category = queue.shift();
          if (!category) {
            break;
          }

          try {
            const uri = await fetchCategoryPreview(category, usedPreviewUris);
            if (uri) {
              usedPreviewUris.add(uri);
            }
            previewCacheRef.current[category.id] = uri;
            scheduleBatchUpdate(category.id, uri);
          } catch (error) {
            previewCacheRef.current[category.id] = null;
            scheduleBatchUpdate(category.id, null);
          } finally {
            previewFetchQueueRef.current.delete(category.id);
          }
        }
      };

      const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
      const workersPromise = Promise.all(workers).finally(() => {
        if (batchTimer) {
          clearTimeout(batchTimer);
        }
        flushBatch();
      });

      previewFetchWorkersRef.current.add(workersPromise);
      workersPromise.finally(() => {
        previewFetchWorkersRef.current.delete(workersPromise);
      });
    },
    [categories, fetchCategoryPreview],
  );

  // Fetch previews for visible categories immediately
  useEffect(() => {
    if (visibleCategoryIds.size === 0 || categories.length === 0) return;

    const visibleIds = Array.from(visibleCategoryIds);
    fetchPreviewsForCategories(visibleIds, 'high');
  }, [visibleCategoryIds, categories, fetchPreviewsForCategories]);

  // Fetch previews for initially visible items after initial render
  useEffect(() => {
    if (initialLoading || categories.length === 0 || groupedCategories.length === 0) return;

    // Calculate initial visible items (first 2-3 rows worth of categories)
    // This ensures thumbnails for visible items load immediately
    const initialVisibleCount = Math.min(categoryColumns * 3, categories.length);
    const initialVisibleIds = categories.slice(0, initialVisibleCount).map(c => c.id);

    // Fetch previews for initial visible items (onViewableItemsChanged will handle tracking)
    if (initialVisibleIds.length > 0) {
      fetchPreviewsForCategories(initialVisibleIds, 'high');
    }
  }, [initialLoading, categories, groupedCategories, categoryColumns, fetchPreviewsForCategories]);

  // Initial cleanup and cache management
  useEffect(() => {
    if (categories.length === 0) {
      previewCacheRef.current = {};
      setCategoryPreviewImages({});
      previewFetchQueueRef.current.clear();
      return;
    }

    const activeIds = new Set(categories.map(category => category.id));

    // Clean up preview cache to only include active category IDs
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

    // Clean up queue
    previewFetchQueueRef.current.forEach(id => {
      if (!activeIds.has(id)) {
        previewFetchQueueRef.current.delete(id);
      }
    });
  }, [categories]);

  // Debounce AsyncStorage writes to avoid excessive I/O
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current && Object.keys(previewCacheRef.current).length > 0) {
        AsyncStorage.setItem(CATEGORY_PREVIEWS_CACHE_KEY, JSON.stringify(previewCacheRef.current)).catch(
          () => {},
        );
      }
    }, 1000); // Debounce by 1 second

    return () => clearTimeout(timer);
  }, [categoryPreviewImages]);

  const normalizedSearchQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filteredCategories = useMemo(() => {
    if (!normalizedSearchQuery) {
      return categories;
    }
    const lowerQuery = normalizedSearchQuery;
    return categories.filter(category => {
      const nameMatch = category.name?.toLowerCase().includes(lowerQuery);
      const parentCategoryMatch = category.parentCategoryName?.toLowerCase().includes(lowerQuery);
      return nameMatch || parentCategoryMatch;
    });
  }, [categories, normalizedSearchQuery]);
  const isSearching = normalizedSearchQuery.length > 0;

  // Group categories by parentCategoryName for sectioned display (matching HomeScreen structure)
  const groupedCategories = useMemo(() => {
    if (filteredCategories.length === 0) {
      return [];
    }
    
    // Recalculate columns here to ensure we always use the current screenWidth
    // This prevents stale closure issues
    const cols = screenWidth >= 768 ? 4 : 2;
    
    const groups: Record<string, GreetingCategory[]> = {};
    
    filteredCategories.forEach(category => {
      // Use 'General' for categories without parentCategoryName (null, undefined, or empty string)
      const parentName = (category.parentCategoryName && category.parentCategoryName.trim()) || 'General';
      if (!groups[parentName]) {
        groups[parentName] = [];
      }
      groups[parentName].push(category);
    });
    
    // Convert to SectionList format with rows for proper grid layout
    const sections = Object.keys(groups)
      .sort((a, b) => {
        // Sort: "General" first, then alphabetically
        if (a === 'General') return -1;
        if (b === 'General') return 1;
        return a.localeCompare(b);
      })
      .map(parentName => {
        const categories = groups[parentName];
        // Group categories into rows based on cols
        const rows: GreetingCategory[][] = [];
        for (let i = 0; i < categories.length; i += cols) {
          const row = categories.slice(i, i + cols);
          rows.push(row);
        }
        return {
          title: parentName,
          data: rows, // Each row is an array of categories
        };
      })
      .filter(section => section.data.length > 0); // Filter out empty sections
    
    return sections;
  }, [filteredCategories, screenWidth]);

  // Animate sections when they appear (only once per section)
  useEffect(() => {
    if (groupedCategories.length > 0 && !initialLoading) {
      const animationRefs: Animated.CompositeAnimation[] = [];
      
      // Clean up animations for sections that no longer exist
      const currentSectionKeys = new Set(
        groupedCategories.map((_, index) => [`section-${index}`, `section-${index}-translate`]).flat()
      );
      const keysToRemove: string[] = [];
      sectionAnimations.forEach((_, key) => {
        if (!currentSectionKeys.has(key)) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach(key => {
        const animValue = sectionAnimations.get(key);
        if (animValue) {
          animValue.stopAnimation();
          sectionAnimations.delete(key);
        }
      });
      
      groupedCategories.forEach((section, sectionIndex) => {
        const sectionKey = `section-${sectionIndex}`;
        const fullSectionKey = `${section.title}-${sectionIndex}`;
        
        // Only animate if this section hasn't been animated before
        if (animatedSectionsRef.current.has(fullSectionKey)) {
          // Section already animated, just ensure values are set
          if (sectionAnimations.has(sectionKey)) {
            const opacity = sectionAnimations.get(sectionKey)!;
            opacity.setValue(1);
          }
          if (sectionAnimations.has(`${sectionKey}-translate`)) {
            const translateAnim = sectionAnimations.get(`${sectionKey}-translate`)!;
            translateAnim.setValue(0);
          }
          return;
        }
        
        // Create animation values if they don't exist
        if (!sectionAnimations.has(sectionKey)) {
          sectionAnimations.set(sectionKey, new Animated.Value(0));
        }
        if (!sectionAnimations.has(`${sectionKey}-translate`)) {
          sectionAnimations.set(`${sectionKey}-translate`, new Animated.Value(30));
        }
        
        const opacity = sectionAnimations.get(sectionKey)!;
        const translateAnim = sectionAnimations.get(`${sectionKey}-translate`)!;
        
        // Stop any existing animations first
        opacity.stopAnimation();
        translateAnim.stopAnimation();
        
        const animation = Animated.parallel([
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
        ]);
        
        animationRefs.push(animation);
        animation.start(() => {
          // Mark as animated after completion
          animatedSectionsRef.current.add(fullSectionKey);
        });
      });
      
      // Cleanup: stop all animations when component unmounts or dependencies change
      return () => {
        animationRefs.forEach(anim => {
          anim.stop();
        });
      };
    }
  }, [groupedCategories, initialLoading]);

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
      // Clear ALL caches (in-memory + AsyncStorage) before fetching fresh data
      // This ensures a complete refresh with no stale data
      greetingTemplatesService.clearCache();
      
      // Clear AsyncStorage caches
      await AsyncStorage.multiRemove([CATEGORIES_CACHE_KEY, CATEGORY_PREVIEWS_CACHE_KEY]).catch(() => {});

      // Reset all in-memory preview caches BEFORE fetching new categories
      // This ensures all categories will be marked as pending for preview fetching
      previewCacheRef.current = {};
      setCategoryPreviewImages({});
      
      // Increment refresh key to force preview re-fetching
      previewRefreshKeyRef.current += 1;

      // Fetch fresh categories (this will bypass cache due to clearCache call)
      const data = await greetingTemplatesService.refreshCategories();
      const mergedCategories = await ensureAllGeneralCategories(data || []);

      if (isMountedRef.current) {
        // Update state with fresh categories (create new array reference to trigger useEffect)
        setCategories([...mergedCategories]);

        // Persist fresh categories to AsyncStorage for faster next load
        if (mergedCategories && mergedCategories.length > 0) {
          AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(mergedCategories)).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Error refreshing greeting categories:', error);
      Alert.alert('Error', 'Unable to refresh categories right now.');
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [ensureAllGeneralCategories]);

  const handleCategoryPress = useCallback(async (category: GreetingCategory) => {
    // Get the preview image for this category if available
    const previewUri = categoryPreviewImages[category.id] || null;
    
    let selectedPoster: Template = createPlaceholderPoster(category);
    
    // If we have a preview image, try to find the actual template that matches it
    if (previewUri) {
      try {
        const normalizedName = category.name?.trim();
        if (normalizedName) {
          // Search for templates in this category
          const searchResults = await greetingTemplatesService.searchTemplates(normalizedName);
          if (Array.isArray(searchResults) && searchResults.length > 0) {
            // Try to find a template that matches the preview image URL
            const matchingTemplate = searchResults.find(template => {
              const templatePreview = extractTemplatePreview(template);
              return templatePreview === previewUri;
            });
            
            if (matchingTemplate) {
              // Convert GreetingTemplate to Template format
              const templateAny = matchingTemplate as any;
              selectedPoster = {
                id: matchingTemplate.id,
                name: matchingTemplate.name || category.name,
                thumbnail: matchingTemplate.thumbnail || templateAny.content?.background || previewUri,
                category: matchingTemplate.category || category.name,
                downloads: matchingTemplate.downloads || 0,
                isDownloaded: matchingTemplate.isDownloaded || false,
                tags: Array.isArray(templateAny.tags) ? templateAny.tags : [category.name],
              };
            } else {
              // If no exact match, use the preview image with the first template's ID
              const firstTemplate = searchResults[0];
              const templateAny = firstTemplate as any;
              selectedPoster = {
                id: firstTemplate.id,
                name: firstTemplate.name || category.name,
                thumbnail: previewUri,
                category: firstTemplate.category || category.name,
                downloads: firstTemplate.downloads || 0,
                isDownloaded: firstTemplate.isDownloaded || false,
                tags: Array.isArray(templateAny.tags) ? templateAny.tags : [category.name],
              };
            }
          } else {
            // No search results, create poster with preview image
            selectedPoster = {
              id: `preview-${category.id}`,
              name: category.name,
              thumbnail: previewUri,
              category: category.name,
              downloads: 0,
              isDownloaded: false,
              tags: [category.name],
            };
          }
        } else {
          // No category name, create poster with preview image
          selectedPoster = {
            id: `preview-${category.id}`,
            name: category.name,
            thumbnail: previewUri,
            category: category.name,
            downloads: 0,
            isDownloaded: false,
            tags: [category.name],
          };
        }
      } catch (error) {
        console.warn('[GreetingTemplatesScreen] Error finding template for preview:', error);
        // Fallback to preview image poster
        selectedPoster = {
          id: `preview-${category.id}`,
          name: category.name,
          thumbnail: previewUri,
          category: category.name,
          downloads: 0,
          isDownloaded: false,
          tags: [category.name],
        };
      }
    }

    navigation.navigate('PosterPlayer', {
      selectedPoster: selectedPoster,
      relatedPosters: [],
      greetingCategory: category.name,
      originScreen: 'GreetingTemplates',
      posterLimit: 200,
    });
  }, [navigation, categoryPreviewImages, extractTemplatePreview]);

  const categoryColumns = useMemo(() => {
    // Tablets and bigger screens: 4 columns
    // Small screens: 2 columns
    return screenWidth >= 768 ? 4 : 2;
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

  // Memoized CategoryCard component for better performance
  const CategoryCard = React.memo<{
    item: GreetingCategory;
    index: number;
    categoryCardSize: number;
    categoryCardGap: number;
    categoryColumns: number;
    previewUri: string | null;
    isLastInRow?: boolean;
    onPress: (item: GreetingCategory) => void;
  }>(({ item, index, categoryCardSize, categoryCardGap, categoryColumns, previewUri, isLastInRow: isLastInRowProp, onPress }) => {
    const cardColor = item.color || '#667eea';
    const isLastInRow = isLastInRowProp !== undefined ? isLastInRowProp : (index + 1) % categoryColumns === 0;
    const isEmoji = Boolean(item.icon && EMOJI_REGEX.test(item.icon));
    const initials = item.name?.slice(0, 2).toUpperCase() || 'GC';
    
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
        onPress={() => onPress(item)}
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
  }, (prevProps, nextProps) => {
    // Only re-render if item ID, preview image, or position changes
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.color === nextProps.item.color &&
      prevProps.item.icon === nextProps.item.icon &&
      prevProps.previewUri === nextProps.previewUri &&
      prevProps.index === nextProps.index &&
      prevProps.categoryCardSize === nextProps.categoryCardSize &&
      prevProps.categoryCardGap === nextProps.categoryCardGap &&
      prevProps.categoryColumns === nextProps.categoryColumns
    );
  });

  // Get icon for section type
  const getSectionIcon = useCallback((title: string) => {
    if (title.includes('General') || title.toLowerCase().includes('general')) return 'category';
    return 'collections';
  }, []);

  // Render section header for grouped categories (matching TodaysPickScreen style)
  const renderSectionHeader = useCallback((info: { section: { title: string; data: GreetingCategory[][] } }) => {
    const iconName = getSectionIcon(info.section.title);
    const sectionIndex = groupedCategories.findIndex(s => s.title === info.section.title);
    const sectionKey = `section-${sectionIndex}`;
    const opacity = sectionAnimations.get(sectionKey) || new Animated.Value(1);
    const translateY = sectionAnimations.get(`${sectionKey}-translate`) || new Animated.Value(0);

    return (
      <Animated.View
        style={[
          styles.categorySectionHeaderContainer,
          {
            paddingTop: moderateScale(isSmallScreen ? 12 : 16),
            paddingBottom: moderateScale(isSmallScreen ? 8 : 12),
            marginBottom: moderateScale(isSmallScreen ? 8 : 12),
            opacity,
            transform: [{ translateY }],
          }
        ]}
      >
        <View style={styles.categorySectionHeaderWrapper}>
          <LinearGradient
            colors={isDarkMode 
              ? [theme.colors.primary + '30', theme.colors.secondary + '20', 'transparent']
              : [theme.colors.primary + '18', theme.colors.secondary + '10', 'transparent']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.categorySectionHeaderGradient}
          >
            <View style={[styles.categorySectionHeaderContent, { paddingLeft: moderateScale(12), paddingRight: moderateScale(16) }]}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.categorySectionIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon
                  name={iconName}
                  size={moderateScale(isSmallScreen ? 18 : 22)}
                  color="#ffffff"
                />
              </LinearGradient>
              <View style={styles.categorySectionTitleContainer}>
                <Text style={[
                  styles.categorySectionHeaderText,
                  {
                    color: theme.colors.text,
                    fontSize: moderateScale(isSmallScreen ? 14 : 16),
                    fontWeight: '700',
                    marginLeft: moderateScale(10),
                  }
                ]}>
                  {info.section.title}
                </Text>
                <View style={[
                  styles.categorySectionUnderline,
                  {
                    backgroundColor: theme.colors.primary,
                    marginLeft: moderateScale(10),
                    marginTop: moderateScale(2),
                  }
                ]} />
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    );
  }, [groupedCategories, isDarkMode, theme, isSmallScreen, getSectionIcon, sectionAnimations, moderateScale]);

  const renderCategoryCard = useCallback(({ item, index, section }: { item: GreetingCategory[]; index: number; section: { title: string; data: GreetingCategory[][] } }) => {
    // item is now a row (array of categories)
    // Each row should only contain up to categoryColumns items
    if (__DEV__ && index === 0) {
      console.log('[GreetingTemplatesScreen] renderCategoryCard:', {
        sectionTitle: section.title,
        rowIndex: index,
        categoriesInRow: item.length,
        categoryIds: item.map(c => c.id),
      });
    }
    
    if (!item || item.length === 0) {
      return null;
    }
    
    return (
      <View style={[styles.categoryRow, { 
        flexDirection: 'row', 
        flexWrap: 'nowrap',
        width: '100%',
      }]}>
        {item.map((category, categoryIndex) => {
          const previewUri = categoryPreviewImages[category.id] || null;
          const isLastInRow = categoryIndex === item.length - 1;
          
          return (
            <CategoryCard
              key={category.id}
              item={category}
              index={categoryIndex}
              categoryCardSize={categoryCardSize}
              categoryCardGap={categoryCardGap}
              categoryColumns={categoryColumns}
              previewUri={previewUri}
              isLastInRow={isLastInRow}
              onPress={handleCategoryPress}
            />
          );
        })}
      </View>
    );
  }, [categoryCardSize, categoryCardGap, categoryColumns, categoryPreviewImages, handleCategoryPress]);

  // Track visible items for lazy loading
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (!viewableItems || !Array.isArray(viewableItems) || viewableItems.length === 0) {
        return;
      }

      const newVisibleIds = new Set<string>();

      viewableItems.forEach((viewableItem: any) => {
        // Safely check if viewableItem and item exist
        if (!viewableItem || !viewableItem.item) {
          return;
        }

        // item is a row (array of categories) in our SectionList structure
        if (Array.isArray(viewableItem.item)) {
          viewableItem.item.forEach((category: GreetingCategory) => {
            if (category && category.id) {
              newVisibleIds.add(category.id);
            }
          });
        }
      });

      // Update visible category IDs and fetch previews for newly visible items
      if (newVisibleIds.size > 0) {
        setVisibleCategoryIds(prev => {
          const newlyVisible = Array.from(newVisibleIds).filter(id => !prev.has(id));
          if (newlyVisible.length > 0) {
            // Fetch previews for newly visible items
            fetchPreviewsForCategories(newlyVisible, 'high');
          }
          return newVisibleIds;
        });
      }
    },
    [fetchPreviewsForCategories],
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 30, // Item is considered visible when 30% is shown
    minimumViewTime: 100,
    waitForInteraction: false,
  }).current;


  // Removed flatListPerfConfig - using inline props for better control

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
      style={[styles.container, { backgroundColor: theme.colors.gradient[0] || '#e8e8e8' }]}
      edges={safeAreaEdges}
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

        <SectionList
          sections={groupedCategories}
          keyExtractor={(item, index) => {
            // item is a row (array of categories), create a unique key from all category IDs in the row
            if (!item || !Array.isArray(item)) {
              return `row-${index}-empty`;
            }
            return `row-${index}-${item.map(c => c?.id || '').filter(Boolean).join('-')}`;
          }}
          key={`category-grid-${categoryColumns}`}
          renderItem={renderCategoryCard}
          renderSectionHeader={renderSectionHeader}
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
          stickySectionHeadersEnabled={false}
          // Enhanced performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={Math.max(categoryColumns * 2, 8)}
          windowSize={5}
          initialNumToRender={Math.max(categoryColumns * 2, 8)}
          updateCellsBatchingPeriod={80}
          // Lazy loading for thumbnails
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
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
    paddingHorizontal: moderateScale(16),
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
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: moderateScale(6),
    width: '100%',
  },
  categorySectionHeaderContainer: {
    width: '100%',
  },
  categorySectionHeaderWrapper: {
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },
  categorySectionHeaderGradient: {
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  categorySectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categorySectionIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categorySectionTitleContainer: {
    flex: 1,
  },
  categorySectionHeaderText: {
    letterSpacing: 0.4,
  },
  categorySectionUnderline: {
    height: 2,
    width: moderateScale(32),
    borderRadius: moderateScale(1),
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
