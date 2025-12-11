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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Share } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import downloadedPostersService, { DownloadedPoster } from '../services/downloadedPosters';
import downloadTrackingService, { DownloadedContent } from '../services/downloadTracking';
import authService from '../services/auth';
import { MainStackParamList } from '../navigation/AppNavigator';
import { Template } from '../services/dashboard';
import logger from '../utils/logger';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<DownloadedPoster | null>(null);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MyPostersScreenNavigationProp>();
  
  // Get card dimensions for horizontal scrolling
  const { cardWidth, cardHeight, visibleCards, gap } = getPosterCardDimensions();

  // Load posters on component mount
  useEffect(() => {
    loadPosters();
  }, []);

  // Filter posters when search query or category changes
  useEffect(() => {
    filterPosters();
  }, [posters, searchQuery, selectedCategory]);

  const loadPosters = async () => {
    try {
      setLoading(true);
      
      // Get current user ID for user-specific downloads
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        setLoading(false);
        return;
      }

      // Fetch downloads from backend API
      const downloadsResponse = await downloadTrackingService.getUserDownloads(userId);
      
      // Convert DownloadedContent to DownloadedPoster format
      const downloadedPosters: DownloadedPoster[] = downloadsResponse.downloads.map((download: DownloadedContent) => {
        
        return {
          id: download.id,
          title: download.resourceType, // Show resource type as title
          description: download.thumbnail || download.fileUrl || 'No thumbnail', // Show thumbnail URL as description
          imageUri: download.fileUrl,
          thumbnailUri: download.thumbnail,
          category: download.resourceType, // Group by resource type
          downloadDate: download.createdAt,
          tags: []
        };
      });
      
      setPosters(downloadedPosters);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(downloadedPosters.map(poster => poster.category || 'Uncategorized'))
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading posters:', error);
      Alert.alert('Error', 'Failed to load downloaded posters. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const filterPosters = () => {
    let filtered = [...posters];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(poster => 
        (poster.category || 'Uncategorized') === selectedCategory
      );
    }

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
    setRefreshing(true);
    await loadPosters();
    setRefreshing(false);
  }, []);

  const handleSharePoster = async (poster: DownloadedPoster) => {
    try {
      await Share.share({
        url: poster.imageUri,
        title: poster.title,
        message: `Check out my poster: ${poster.title}`,
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
    // Convert DownloadedPoster to Template format
    // Use imageUri (full image) for main display, not thumbnailUri
    const selectedTemplate: Template = {
      id: poster.id,
      name: poster.name || poster.title || 'Downloaded Poster',
      thumbnail: poster.imageUri || poster.thumbnailUri || '', // Use main image first
      category: poster.category || 'Uncategorized',
      downloads: 0,
      isDownloaded: true,
    };

    // Get other posters as related posters (exclude the selected one)
    const relatedTemplates: Template[] = posters
      .filter(p => p.id !== poster.id)
      .map(p => ({
        id: p.id,
        name: p.name || p.title || 'Downloaded Poster',
        thumbnail: p.imageUri || p.thumbnailUri || '', // Use main image first
        category: p.category || 'Uncategorized',
        downloads: 0,
        isDownloaded: true,
      }));

    logger.log('📱 [MY POSTERS] Navigating to PosterPlayer');
    logger.log('Selected Poster:', selectedTemplate);
    logger.log('Using imageUri:', poster.imageUri);
    logger.log('Related Posters Count:', relatedTemplates.length);

    // Navigate to PosterPlayerScreen
    navigation.navigate('PosterPlayer', {
      selectedPoster: selectedTemplate,
      relatedPosters: relatedTemplates,
      searchQuery: '',
      templateSource: 'professional',
    });
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
          {(item.thumbnailUri || item.imageUri) ? (
            <Image
              source={{ uri: item.thumbnailUri || item.imageUri }}
              style={styles.posterImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.posterImage, { backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }]}>
              <Icon name="image" size={moderateScale(24)} color="#999" />
              <Text style={{ color: '#666', fontSize: moderateScale(8), marginTop: moderateScale(4) }}>No Image</Text>
            </View>
          )}
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

  const renderPreviewModal = () => {
    if (!selectedPoster) return null;

    return (
      <Modal
        visible={previewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.previewModalOverlay}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setPreviewModalVisible(false)}
          >
            <Icon name="close" size={28} color="#ffffff" />
          </TouchableOpacity>

          {/* Image Preview */}
          <View style={styles.previewImageContainer}>
            {(selectedPoster.thumbnailUri || selectedPoster.imageUri) ? (
              <Image
                source={{ uri: selectedPoster.thumbnailUri || selectedPoster.imageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.previewImagePlaceholder}>
                <Icon name="image" size={80} color="#999" />
                <Text style={styles.previewPlaceholderText}>No Image Available</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

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
      {renderPreviewModal()}
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
