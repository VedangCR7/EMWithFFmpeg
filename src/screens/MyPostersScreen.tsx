import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Dimensions,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Share } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import downloadedPostersService, { DownloadedPoster } from '../services/downloadedPosters';
import downloadTrackingService, { DownloadedContent } from '../services/downloadTracking';
import authService from '../services/auth';
import cacheService from '../services/cacheService';
import { MainStackParamList } from '../navigation/types';
import { Template } from '../services/dashboard';
import logger from '../utils/logger';
import DownloadedImagePreview from '../components/DownloadedImagePreview';

type MyPostersScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MyPosters'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;
const isTablet = screenWidth >= 768;

// Responsive helper functions
const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive value getter
const getResponsiveValue = (small: number, medium: number, large: number) => {
  if (screenWidth < 400) return small;
  if (screenWidth < 768) return medium;
  return large;
};

// Calculate poster card dimensions for horizontal scrolling
const getPosterCardDimensions = () => {
  // Determine visible cards based on screen size
  // Smaller screens: min 3 cards visible
  // Larger screens: max 6 cards visible
  const visibleCards = getResponsiveValue(3, 4, 6); // 3 for small, 4 for medium, 6 for large/tablet
  
  // Compact padding and gaps
  const padding = moderateScale(3);
  const gap = moderateScale(3);
  
  const totalGap = (visibleCards - 1) * gap;
  const availableWidth = screenWidth - (padding * 2) - totalGap;
  const cardWidth = Math.floor(availableWidth / visibleCards);
  const cardHeight = verticalScale(60); // Compact height
  
  return { cardWidth, cardHeight, visibleCards, gap };
};

const MyPostersScreen: React.FC = () => {
  const [posters, setPosters] = useState<DownloadedPoster[]>([]);
  const [filteredPosters, setFilteredPosters] = useState<DownloadedPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<DownloadedPoster | null>(null);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MyPostersScreenNavigationProp>();
  
  // Cache TTL configuration
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Get card dimensions for horizontal scrolling
  const { cardWidth, cardHeight, visibleCards, gap } = getPosterCardDimensions();

  // Safe Image Resolver - Core Fix for Calendar Images
  const getImageUrl = (item: DownloadedPoster): string => {
    // Try all possible image field names
    const possibleFields = [
      'imageUri',
      'thumbnailUri', 
      'image',
      'imageUrl',
      'calendarImage',
      'poster',
      'filePath',
      'url',
      'fileUrl',
      'thumbnail'
    ];
    
    let rawUrl = '';
    let foundField = '';
    
    // Find the first non-empty field
    for (const field of possibleFields) {
      const value = (item as any)[field];
      if (value && typeof value === 'string' && value.trim() !== '') {
        rawUrl = value.trim();
        foundField = field;
        break;
      }
    }
    
    // Debug logging for calendar items
    if ((item.category || '').toLowerCase() === 'festival') {
      console.log("🔧 [IMAGE_RESOLVER] Calendar item image resolution:", {
        itemId: item.id,
        foundField,
        rawUrl: rawUrl.substring(0, 100) + (rawUrl.length > 100 ? '...' : ''),
        rawUrlLength: rawUrl.length,
        allFields: possibleFields.map(field => ({
          field,
          value: (item as any)[field],
          hasValue: !!(item as any)[field],
          valueType: typeof (item as any)[field]
        }))
      });
    }
    
    if (!rawUrl) {
      console.warn("⚠️ [IMAGE_RESOLVER] No image URL found for item:", item.id);
      return '';
    }
    
    // Handle different URL formats
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      // Full URL - return as-is
      return rawUrl;
    }
    
    if (rawUrl.startsWith('/')) {
      // Relative path - prepend base URL
      const BASE_URL = 'https://eventmarketersbackend.onrender.com';
      const fullUrl = BASE_URL + rawUrl;
      
      if ((item.category || '').toLowerCase() === 'festival') {
        console.log("🔧 [IMAGE_RESOLVER] Converted relative URL:", {
          relative: rawUrl,
          full: fullUrl
        });
      }
      
      return fullUrl;
    }
    
    if (rawUrl.startsWith('file://')) {
      // Local file URL - return as-is
      return rawUrl;
    }
    
    // Assume it's a relative path without leading slash
    const BASE_URL = 'https://eventmarketersbackend.onrender.com';
    const fullUrl = `${BASE_URL}/${rawUrl}`;
    
    if ((item.category || '').toLowerCase() === 'festival') {
      console.log("🔧 [IMAGE_RESOLVER] Converted partial relative URL:", {
        partial: rawUrl,
        full: fullUrl
      });
    }
    
    return fullUrl;
  };

  // Load posters on component mount - REMOVED to prevent double API calls

  // Refresh posters when screen comes into focus (e.g., after downloading a new poster)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [MY POSTERS] Screen focused - refreshing posters...');
      loadPosters();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Filter posters when search query or category changes
  useEffect(() => {
    filterPosters();
  }, [posters, searchQuery, selectedCategory]);

  const loadPosters = async () => {
    try {
      console.log('🔄 [MY POSTERS] Starting to load posters...');
      setLoading(true);
      setError(null);

      // Get current user ID from auth
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      console.log('👤 [MY POSTERS] User ID:', userId);

      if (!userId) {
        console.log('⚠️ [MY POSTERS] No user ID found, showing empty state');
        setPosters([]);
        setLoading(false);
        return;
      }

      // Get downloaded posters using the updated service
      const downloadedPosters = await downloadedPostersService.getDownloadedPosters(userId);
      console.log('📊 [MY POSTERS] Loaded posters:', downloadedPosters.length);
      
      // Debug: Check for calendar items specifically
      const calendarItems = downloadedPosters.filter(p => 
        (p.category || '').toLowerCase() === 'festival' || 
        (p.category || '').toLowerCase() === 'calendar'
      );
      console.log('🎯 [MY POSTERS] Calendar items found:', calendarItems.length);
      
      if (calendarItems.length > 0) {
        console.log('🎯 [MY POSTERS] Sample calendar item:', JSON.stringify(calendarItems[0], null, 2));
      }

      setPosters(downloadedPosters);
      
    } catch (err) {
      console.error('Error loading posters:', err);
      setError('Failed to load downloaded posters. Please check your internet connection.');
      Alert.alert('Error', 'Failed to load downloaded posters. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to process downloads data (used for both cached and fresh data)
  const processDownloadsData = async (downloads: DownloadedContent[], userId: string) => {
    // Convert DownloadedContent to DownloadedPoster format
    console.log('📥 [MY POSTERS] Raw downloads data:', JSON.stringify(downloads.slice(0, 2), null, 2));
    console.log(`📊 [MY POSTERS] Total downloads received: ${downloads.length}`);
    
    // Debug: Find calendar and working category items for comparison
    const calendarItems = downloads.filter(d => 
      (d.category || '').toLowerCase() === 'calendar' || 
      (d.category || '').toLowerCase() === 'festival'
    );
    const workingItems = downloads.filter(d => 
      (d.category || '').toLowerCase() === 'templates' || 
      d.resourceType === 'TEMPLATE'
    );
    
    console.log('🔍 [DEBUG] Calendar items found:', calendarItems.length);
    console.log('🔍 [DEBUG] Working items found:', workingItems.length);
    
    if (calendarItems.length > 0) {
      console.log('🔍 [DEBUG] Sample calendar item:', JSON.stringify(calendarItems[0], null, 2));
    }
    if (workingItems.length > 0) {
      console.log('🔍 [DEBUG] Sample working item:', JSON.stringify(workingItems[0], null, 2));
    }
    
    // Step 1: Filter out downloads without valid image URLs
    // Accept both HTTP/HTTPS URLs and file:// URLs (for local images)
    const validDownloads = downloads.filter((download: DownloadedContent) => {
      const hasValidUrl = download.fileUrl || download.thumbnail;
        const isValidUrl = hasValidUrl && 
          typeof hasValidUrl === 'string' && 
          hasValidUrl.trim() !== '' && 
          (hasValidUrl.startsWith('http://') || 
           hasValidUrl.startsWith('https://') || 
           hasValidUrl.startsWith('file://')); // Accept file:// URLs for local images
        
        if (!isValidUrl) {
          console.warn(`⚠️ [MY POSTERS] Skipping download ${download.id} - no valid URL:`, {
            fileUrl: download.fileUrl,
            thumbnail: download.thumbnail,
            resourceId: download.resourceId,
            resourceType: download.resourceType,
          });
        }
        
        return isValidUrl;
      });
      
      console.log(`✅ [MY POSTERS] Valid downloads after URL filtering: ${validDownloads.length}`);
      
      // Step 2: Deduplicate by resourceId only (POSTER and TEMPLATE with same resourceId should be single item)
      const uniqueDownloadsMap = new Map<string, DownloadedContent>();
      
      validDownloads.forEach((download: DownloadedContent) => {
        // Create a unique key from resourceId only (not resourceId + resourceType)
        const uniqueKey = download.resourceId;
        
        const existing = uniqueDownloadsMap.get(uniqueKey);
        
        if (!existing) {
          // First occurrence, add it
          uniqueDownloadsMap.set(uniqueKey, download);
        } else {
          // Duplicate found, keep one with the most recent createdAt date
          const existingDate = new Date(existing.createdAt || 0);
          const currentDate = new Date(download.createdAt || 0);
          
          if (currentDate > existingDate) {
            console.log(`🔄 [MY POSTERS] Replacing duplicate for ${uniqueKey} (resourceType: ${download.resourceType}):`, {
              oldId: existing.id,
              newId: download.id,
              oldDate: existing.createdAt,
              newDate: download.createdAt,
              oldResourceType: existing.resourceType,
              newResourceType: download.resourceType,
            });
            uniqueDownloadsMap.set(uniqueKey, download);
          } else {
            console.log(`⏭️ [MY POSTERS] Skipping duplicate for ${uniqueKey} (resourceType: ${download.resourceType}) (keeping older):`, {
              keptId: existing.id,
              skippedId: download.id,
              keptResourceType: existing.resourceType,
              skippedResourceType: download.resourceType,
            });
          }
        }
      });
      
      const uniqueDownloads = Array.from(uniqueDownloadsMap.values());
      console.log(`🎯 [MY POSTERS] Unique downloads after deduplication: ${uniqueDownloads.length} (removed ${validDownloads.length - uniqueDownloads.length} duplicates)`);
      
      // Step 3: Safe data normalization layer
      const normalizeDownloadItem = (download: DownloadedContent): DownloadedContent => {
        // Normalize image fields - handle various possible field names
        const normalizedImage = 
          download.fileUrl || 
          download.thumbnail || 
          (download as any).image || 
          (download as any).imageUrl || 
          (download as any).calendarImage || 
          (download as any).images?.poster || 
          '';
          
        // Normalize category - handle case insensitivity and different field names
        const normalizedCategory = 
          (download.category || (download as any).type || download.resourceType || 'Uncategorized')
            .toString()
            .toLowerCase()
            .trim();
            
        // Log normalization for calendar items specifically
        if (normalizedCategory === 'calendar' || normalizedCategory === 'festival') {
          console.log('🔧 [NORMALIZE] Calendar item normalization:', {
            originalCategory: download.category,
            originalType: (download as any).type,
            originalResourceType: download.resourceType,
            normalizedCategory,
            originalFileUrl: download.fileUrl,
            originalThumbnail: download.thumbnail,
            otherImageFields: {
              image: (download as any).image,
              imageUrl: (download as any).imageUrl,
              calendarImage: (download as any).calendarImage,
              imagesPoster: (download as any).images?.poster,
            },
            finalImageUrl: normalizedImage
          });
        }
        
        return {
          ...download,
          fileUrl: normalizedImage,
          category: normalizedCategory,
        };
      };
      
      // Apply normalization to all downloads
      const normalizedDownloads = uniqueDownloads.map(normalizeDownloadItem);
      
      // Step 4: Map to DownloadedPoster format
      const downloadedPosters: DownloadedPoster[] = normalizedDownloads.map((download: DownloadedContent) => {
        // Use title from download, fallback to resource type
        const posterTitle = download.title || download.resourceType || 'Downloaded Poster';
        
        // Use normalized category with proper capitalization for display
        const getDisplayCategory = (category: string) => {
          const lowerCategory = category.toLowerCase();
          if (lowerCategory === 'calendar' || lowerCategory === 'festival') {
            return 'Festival'; // Standardize calendar/festival to "Festival"
          }
          if (lowerCategory === 'templates') {
            return 'Templates';
          }
          if (lowerCategory === 'videos') {
            return 'Videos';
          }
          if (lowerCategory === 'greetings') {
            return 'Greetings';
          }
          return category.charAt(0).toUpperCase() + category.slice(1); // Capitalize first letter
        };
        
        const posterCategory = getDisplayCategory(download.category || download.resourceType || 'Uncategorized');
        
        // Use normalized image URLs
        const imageUrl = download.fileUrl || '';
        const thumbnailUrl = download.thumbnail || imageUrl || '';
        
        console.log(`✅ [MY POSTERS] Processing download ${download.id}:`, {
          title: posterTitle,
          category: posterCategory,
          originalCategory: download.category,
          resourceId: download.resourceId,
          resourceType: download.resourceType,
          hasFileUrl: !!download.fileUrl,
          hasThumbnail: !!download.thumbnail,
          imageUrl: imageUrl.substring(0, 50) + '...',
          thumbnailUrl: thumbnailUrl.substring(0, 50) + '...',
        });
        
        return {
          id: download.id,
          title: posterTitle,
          description: posterCategory,
          imageUri: imageUrl,
          thumbnailUri: thumbnailUrl,
          category: posterCategory,
          downloadDate: download.createdAt,
          tags: [],
          templateId: download.resourceId, // Store resource ID for reference
        };
      });
      
      setPosters(downloadedPosters);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(downloadedPosters.map(poster => poster.category || 'Uncategorized'))
      );
      setCategories(uniqueCategories);
  };

  const filterPosters = () => {
    let filtered = [...posters];

    // Debug: Log filtering process for calendar items
    const calendarItems = posters.filter(p => 
      (p.category || '').toLowerCase() === 'festival' || 
      (p.category || '').toLowerCase() === 'calendar'
    );
    console.log("🔍 [FILTER] Calendar items before filtering:", calendarItems.length);
    console.log("🔍 [FILTER] Selected category:", selectedCategory);
    
    if (calendarItems.length > 0) {
      console.log("🔍 [FILTER] Sample calendar item before filtering:", JSON.stringify(calendarItems[0], null, 2));
    }

    // Filter by category (case-insensitive)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(poster => 
        (poster.category || 'Uncategorized').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Debug: Log filtered calendar items
    const filteredCalendarItems = filtered.filter(p => 
      (p.category || '').toLowerCase() === 'festival' || 
      (p.category || '').toLowerCase() === 'calendar'
    );
    console.log("🔍 [FILTER] Calendar items after filtering:", filteredCalendarItems.length);
    console.log("🔍 [FILTER] FILTERED DATA =>", JSON.stringify(filtered, null, 2));

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(poster =>
        poster.title.toLowerCase().includes(query) ||
        (poster.description && poster.description.toLowerCase().includes(query)) ||
        (poster.tags && poster.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    setFilteredPosters(filtered);
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Get current user ID
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (userId) {
        console.log('🔄 [MY POSTERS] Manual refresh - clearing cache and fetching fresh data');
        
        // Clear cache and fetch fresh data
        await cacheService.clearPattern(`user_downloads_${userId}_`);
        await loadPosters();
      }
    } catch (error) {
      console.error('Error refreshing posters:', error);
      Alert.alert('Error', 'Failed to refresh posters. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSharePoster = async (poster: DownloadedPoster) => {
    try {
      await Share.share({
        url: poster.imageUri,
        title: poster.title,
      });
    } catch (error) {
      console.error('Error sharing poster:', error);
      Alert.alert('Error', 'Failed to share poster');
    }
  };

  const handleDeletePoster = (poster: DownloadedPoster) => {
    Alert.alert(
      'Delete Poster',
      `Are you sure you want to delete "${poster.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get current user ID for user-specific deletion
              const currentUser = authService.getCurrentUser();
              const userId = currentUser?.id;
              
              const success = await downloadedPostersService.deletePoster(poster.id, userId);
              if (success) {
                setPosters(prev => prev.filter(p => p.id !== poster.id));
                Alert.alert('Success', 'Poster deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete poster');
              }
            } catch (error) {
              logger.error('Error deleting poster:', error);
              Alert.alert('Error', 'Failed to delete poster');
            }
          },
        },
      ]
    );
  };

  const handleViewPoster = (poster: DownloadedPoster) => {
    logger.log('📱 [MY POSTERS] Opening preview modal for downloaded poster:', poster.id);
    setSelectedPoster(poster);
    setPreviewModalVisible(true);
  };

  const renderPosterItem = useCallback(({ item, index }: { item: DownloadedPoster; index: number }) => {
    // Calculate if this card is the last in its row
    const isLastInRow = (index + 1) % visibleCards === 0;
    
    return (
      <View style={{ marginRight: isLastInRow ? 0 : gap }}>
        <TouchableOpacity
          style={[
            styles.posterItem, 
            { 
              backgroundColor: theme.colors.cardBackground,
              width: cardWidth,
              height: cardHeight,
            }
          ]}
          onPress={() => handleViewPoster(item)}
          activeOpacity={0.7}
        >
          {/* Deep debugging: Log complete item data */}
          {(() => {
            console.log("🔍 [RENDER] ITEM DATA =>", JSON.stringify(item, null, 2));
            
            // Log specifically for calendar items
            if ((item.category || '').toLowerCase() === 'festival') {
              console.log("🎯 [CALENDAR] Calendar item rendering:", {
                id: item.id,
                title: item.title,
                category: item.category,
                imageUri: item.imageUri,
                thumbnailUri: item.thumbnailUri,
                hasImageUri: !!item.imageUri,
                hasThumbnailUri: !!item.thumbnailUri,
                imageUriLength: item.imageUri?.length || 0,
                thumbnailUriLength: item.thumbnailUri?.length || 0
              });
            }
            return null;
          })()}
          
          {(() => {
            const imageUrl = getImageUrl(item);
            return imageUrl ? (
              <>
                {/* Temporary debug UI - remove after fix */}
                {(item.category || '').toLowerCase() === 'festival' && (
                  <Text style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    fontSize: 8, 
                    color: 'red', 
                    backgroundColor: 'yellow',
                    zIndex: 1000
                  }}>
                    URL: {imageUrl.substring(0, 30)}...
                  </Text>
                )}
                <Image
                  source={{ 
                    uri: imageUrl,
                    cache: 'force-cache'
                  }}
                  style={styles.posterImage}
                  resizeMode="cover"
                  onError={() => {
                    console.log("🖼️ [MY POSTERS] Image load error for item:", item.id, "URL:", imageUrl);
                  }}
                  onLoad={() => {
                    console.log(`✅ [MY POSTERS] Image loaded for ${item.id}:`, imageUrl);
                  }}
                />
              </>
            ) : (
              <View style={[styles.posterImage, { backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }]}>
                <Icon name="image" size={moderateScale(24)} color="#999" />
                <Text style={{ color: '#666', fontSize: moderateScale(8), marginTop: moderateScale(4) }}>No Image</Text>
                {/* Show debug info for calendar items */}
                {(item.category || '').toLowerCase() === 'festival' && (
                  <Text style={{ color: 'red', fontSize: moderateScale(6), marginTop: moderateScale(2) }}>
                    NO URL FOUND
                  </Text>
                )}
              </View>
            );
          })()}
        </TouchableOpacity>
      </View>
    );
  }, [theme, cardWidth, cardHeight, gap, visibleCards, handleViewPoster]);

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'all' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryButtonText,
            { color: selectedCategory === 'all' ? '#ffffff' : theme.colors.text }
          ]}>
            All ({posters.length})
          </Text>
        </TouchableOpacity>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              { color: selectedCategory === category ? '#ffffff' : theme.colors.text }
            ]}>
              {category} ({posters.filter(p => (p.category || 'Uncategorized') === category).length})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="image" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
        No Downloaded Posters
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>
        Your downloaded posters will appear here
      </Text>
      <TouchableOpacity
        style={[styles.browseButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.browseButtonText}>Browse Templates</Text>
      </TouchableOpacity>
    </View>
  );



  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.gradient[0] || '#e8e8e8' }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle="light-content"
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
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Posters</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.cardBackground }]}>
          <Icon name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search posters..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        {categories.length > 0 && renderCategoryFilter()}

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading posters...
            </Text>
          </View>
        ) : (
          <FlatList
            key={`posters-${visibleCards}`}
            data={filteredPosters}
            renderItem={renderPosterItem}
            keyExtractor={(item) => item.id}
            numColumns={visibleCards}
            columnWrapperStyle={[
              styles.posterRow,
              {
                paddingHorizontal: moderateScale(8),
                marginBottom: moderateScale(4),
              }
            ]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.contentContainer,
              { 
                paddingBottom: 120 + insets.bottom,
                paddingTop: moderateScale(4),
              }
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
            // Enhanced performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={isTablet ? 12 : 8}
            windowSize={isTablet ? 10 : 8}
            initialNumToRender={isTablet ? 12 : 8}
            updateCellsBatchingPeriod={50}
          />
        )}
      </LinearGradient>
      
      {/* Preview Modal */}
      <DownloadedImagePreview
        visible={previewModalVisible}
        selectedPoster={selectedPoster}
        onClose={() => setPreviewModalVisible(false)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
  },
  categoryFilter: {
    marginBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  contentContainer: {
    paddingTop: moderateScale(4),
  },
  posterRow: {
    justifyContent: 'flex-start',
  },
  posterItem: {
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 80,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },
  browseButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  // Preview Modal Styles
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  previewImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlaceholderText: {
    color: '#999',
    fontSize: 16,
    marginTop: 16,
  },
});

export default MyPostersScreen;
