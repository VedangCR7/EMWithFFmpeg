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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Share } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import downloadedPostersService, { DownloadedPoster } from '../services/downloadedPosters';
import authService from '../services/auth';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

const MyPostersScreen: React.FC = () => {
  const [posters, setPosters] = useState<DownloadedPoster[]>([]);
  const [filteredPosters, setFilteredPosters] = useState<DownloadedPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

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
      
      const downloadedPosters = await downloadedPostersService.getDownloadedPosters(userId);
      setPosters(downloadedPosters);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(downloadedPosters.map(poster => poster.category || 'Uncategorized'))
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading posters:', error);
      Alert.alert('Error', 'Failed to load downloaded posters');
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
              console.error('Error deleting poster:', error);
              Alert.alert('Error', 'Failed to delete poster');
            }
          },
        },
      ]
    );
  };

  const handleViewPoster = (poster: DownloadedPoster) => {
    // Navigate to poster preview or open in full screen
    Alert.alert(
      poster.title,
      poster.description || 'No description available',
      [
        { text: 'Share', onPress: () => handleSharePoster(poster) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeletePoster(poster) },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const renderPosterItem = ({ item }: { item: DownloadedPoster }) => (
    <TouchableOpacity
      style={[styles.posterItem, { backgroundColor: theme.colors.cardBackground }]}
      onPress={() => handleViewPoster(item)}
      activeOpacity={0.7}
    >
      <View style={styles.posterImageContainer}>
        <Image
          source={{ uri: item.thumbnailUri || item.imageUri }}
          style={styles.posterImage}
          resizeMode="cover"
        />
        <View style={styles.posterOverlay}>
          <View style={styles.posterActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
              onPress={() => handleSharePoster(item)}
            >
              <Icon name="share" size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: 'rgba(255,0,0,0.7)' }]}
              onPress={() => handleDeletePoster(item)}
            >
              <Icon name="delete" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.posterInfo}>
        <Text style={[styles.posterTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.posterDate, { color: theme.colors.textSecondary }]}>
          {new Date(item.downloadDate).toLocaleDateString()}
        </Text>
        {item.category && (
          <View style={[styles.categoryTag, { backgroundColor: `${theme.colors.primary}20` }]}>
            <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
              {item.category}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
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
            <Icon name="arrow-back" size={24} color="#ffffff" />
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
            data={filteredPosters}
            renderItem={renderPosterItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.posterRow}
            contentContainerStyle={[
              styles.contentContainer,
              { paddingBottom: 120 + insets.bottom }
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  posterRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  posterItem: {
    width: (screenWidth - 60) / 2,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  posterImageContainer: {
    position: 'relative',
    height: 120,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    opacity: 0,
  },
  posterActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterInfo: {
    padding: 12,
  },
  posterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  posterDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyPostersScreen;
