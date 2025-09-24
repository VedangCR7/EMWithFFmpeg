import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import GreetingTemplateCard, { getCardDimensions } from '../components/GreetingTemplateCard';
import greetingTemplatesService, { GreetingTemplate, GreetingCategory } from '../services/greetingTemplates';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import responsiveUtils, { 
  responsiveSpacing, 
  responsiveFontSize, 
  responsiveSize, 
  responsiveLayout, 
  responsiveShadow, 
  responsiveText, 
  responsiveGrid, 
  responsiveButton, 
  responsiveInput, 
  responsiveCard,
  isTablet,
  isLandscape 
} from '../utils/responsiveUtils';

// Using centralized responsive utilities
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers for modal
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

const GreetingTemplatesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { isSubscribed } = useSubscription();
  const insets = useSafeAreaInsets();

  // Get responsive values - memoized to prevent unnecessary re-renders
  const { columns: gridColumns } = getCardDimensions();

  // State
  const [categories, setCategories] = useState<GreetingCategory[]>([]);
  const [allTemplates, setAllTemplates] = useState<GreetingTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<GreetingTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [selectedPremiumTemplate, setSelectedPremiumTemplate] = useState<GreetingTemplate | null>(null);

  // Memoized data fetching functions
  const fetchData = useCallback(async () => {
    try {
      const [categoriesData, templatesData] = await Promise.all([
        greetingTemplatesService.getCategories(),
        greetingTemplatesService.getTemplates(),
      ]);
      setCategories(categoriesData);
      setAllTemplates(templatesData);
      setFilteredTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load greeting templates. Please try again.');
    }
  }, []);

  // Client-side filtering for instant category switching
  const filterTemplatesByCategory = useCallback((categoryFilter: string, templates: GreetingTemplate[]) => {
    if (categoryFilter === 'all') {
      return templates;
    }
    // Filter by category name for better matching
    return templates.filter(template => 
      template.category?.toLowerCase().includes(categoryFilter.toLowerCase())
    );
  }, []);

  // Optimized search functionality with debouncing
  const searchTemplates = useCallback(async (query: string) => {
    if (!query.trim()) {
      // If no search query, show templates filtered by current category
      const categoryFiltered = filterTemplatesByCategory(selectedCategory, allTemplates);
      setFilteredTemplates(categoryFiltered);
      return;
    }

    try {
      const results = await greetingTemplatesService.searchTemplates(query);
      setFilteredTemplates(results);
    } catch (error) {
      console.error('Error searching templates:', error);
    }
  }, [allTemplates, selectedCategory, filterTemplatesByCategory]);

  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);



  // Optimized search effect with better debouncing
  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        searchTemplates(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      // If no search query, filter by current category
      const categoryFiltered = filterTemplatesByCategory(selectedCategory, allTemplates);
      setFilteredTemplates(categoryFiltered);
    }
  }, [searchQuery, searchTemplates, selectedCategory, allTemplates, filterTemplatesByCategory]);

  // Instant category switching - no API calls
  const handleCategorySelect = useCallback((categoryFilter: string) => {
    setSelectedCategory(categoryFilter);
    setSearchQuery('');
    
    // Instant client-side filtering
    const categoryFiltered = filterTemplatesByCategory(categoryFilter, allTemplates);
    setFilteredTemplates(categoryFiltered);
  }, [filterTemplatesByCategory, allTemplates]);

  const handleTemplatePress = useCallback((template: GreetingTemplate) => {
    if (template.isPremium && !isSubscribed) {
      setSelectedPremiumTemplate(template);
      setUpgradeModalVisible(true);
      return;
    }

    navigation.navigate('PosterEditor', {
      selectedImage: {
        uri: template.thumbnail,
        title: template.name,
        description: `${template.category} • ${template.likes} likes`,
      },
      selectedLanguage: 'English',
      selectedTemplateId: template.id,
    });
  }, [isSubscribed, navigation]);

  const handleLike = useCallback(async (templateId: string) => {
    try {
      const isLiked = await greetingTemplatesService.toggleLike(templateId);
      
      // Update both allTemplates and filteredTemplates
      const updateTemplate = (template: GreetingTemplate) => 
        template.id === templateId 
          ? { ...template, isLiked, likes: isLiked ? template.likes + 1 : template.likes - 1 }
          : template;

      setAllTemplates(prev => prev.map(updateTemplate));
      setFilteredTemplates(prev => prev.map(updateTemplate));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Memoized render functions with optimized dependencies
  const renderCategoryTab = useCallback(({ item }: { item: GreetingCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        {
          backgroundColor: selectedCategory === item.id ? item.color : theme.colors.surface,
          borderColor: theme.colors.border,
          paddingVertical: responsiveSpacing.sm,
          paddingHorizontal: responsiveSpacing.md,
          borderRadius: isTablet ? 28 : 24,
          gap: responsiveSpacing.xs,
          minWidth: isTablet ? (isLandscape ? 120 : 100) : 80,
          minHeight: isTablet ? 52 : 44,
        }
      ]}
      onPress={() => handleCategorySelect(item.id)}
      activeOpacity={0.7}
    >
      <Icon
        name={item.icon}
        size={isTablet ? 24 : 20}
        color={selectedCategory === item.id ? '#FFFFFF' : theme.colors.text}
      />
      <Text
        style={[
          styles.categoryTabText,
          {
            color: selectedCategory === item.id ? '#FFFFFF' : theme.colors.text,
            fontSize: responsiveText.caption,
          }
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  ), [selectedCategory, theme.colors.surface, theme.colors.border, theme.colors.text, handleCategorySelect, responsiveSpacing, isTablet, isLandscape, responsiveText.caption]);

  // Optimized template card renderer with proper spacing
  const renderTemplateCard = useCallback(({ item, index }: { item: GreetingTemplate; index: number }) => {
    const { cardWidth } = getCardDimensions();
    const isLastInRow = (index + 1) % gridColumns === 0;
    
    return (
      <View style={{
        width: cardWidth,
        marginRight: isLastInRow ? 0 : 8, // 8px gap between cards, no margin on last card in row
      }}>
        <GreetingTemplateCard
          template={item}
          onPress={handleTemplatePress}
          onLike={handleLike}
        />
      </View>
    );
  }, [handleTemplatePress, handleLike, gridColumns]);

  const renderEmptyState = useCallback(() => (
    <View style={[styles.emptyContainer, { paddingHorizontal: responsiveSpacing.lg }]}>
      <Icon name="sentiment-dissatisfied" size={isTablet ? 80 : 64} color={theme.colors.textSecondary} />
      <Text style={[
        styles.emptyTitle, 
        { 
          color: theme.colors.text,
          fontSize: responsiveText.subheading,
          marginTop: responsiveSpacing.md,
          marginBottom: responsiveSpacing.sm,
        }
      ]}>
        No templates found
      </Text>
      <Text style={[
        styles.emptySubtitle, 
        { 
          color: theme.colors.textSecondary,
          fontSize: responsiveText.body,
          lineHeight: isTablet ? 24 : 20,
        }
      ]}>
        {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new templates'}
      </Text>
    </View>
  ), [searchQuery, theme.colors.text, theme.colors.textSecondary, responsiveSpacing, isTablet, responsiveText]);

  // Memoized key extractors and other optimizations
  const keyExtractor = useCallback((item: GreetingTemplate) => item.id, []);
  const categoryKeyExtractor = useCallback((item: GreetingCategory) => item.id, []);

  // Memoized FlatList props for better performance
  const flatListProps = useMemo(() => {
    const padding = 16;
    const gap = 8;
    
    return {
      data: filteredTemplates,
      renderItem: renderTemplateCard,
      keyExtractor,
      numColumns: gridColumns,
      columnWrapperStyle: gridColumns > 1 ? {
        justifyContent: 'flex-start' as const,
        paddingHorizontal: padding,
        marginBottom: gap,
      } : undefined,
      contentContainerStyle: {
        paddingBottom: responsiveSpacing.lg,
        ...(gridColumns === 1 && { paddingHorizontal: padding }),
      },
      showsVerticalScrollIndicator: false,
      removeClippedSubviews: true,
      maxToRenderPerBatch: isTablet ? 8 : 6,
      windowSize: isTablet ? 10 : 8,
      initialNumToRender: isTablet ? 8 : 6,
      updateCellsBatchingPeriod: 50,
      getItemLayout: undefined,
    };
  }, [filteredTemplates, renderTemplateCard, keyExtractor, gridColumns, responsiveSpacing, isTablet]);

  // Render upgrade modal
  const renderUpgradeModal = () => {
    return (
    <Modal
      visible={upgradeModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setUpgradeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <ScrollView 
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.upgradeModalContent, { backgroundColor: '#ffffff' }]}>
            {/* Premium Badge */}
            <View style={styles.premiumBadge}>
              <Icon name="star" size={isSmallScreen ? 20 : isTablet ? 28 : 24} color="#DAA520" />
              <Text style={[styles.premiumBadgeText, { color: '#B8860B' }]}>PREMIUM</Text>
            </View>

            {/* Modal Header */}
            <View style={styles.upgradeModalHeader}>
              <Text style={[styles.upgradeModalTitle, { color: '#1a1a1a' }]}>
                Unlock Premium Template
              </Text>
              <Text style={[styles.upgradeModalSubtitle, { color: '#666666' }]}>
                Get access to this exclusive template and all premium features
              </Text>
            </View>

            {/* Template Preview */}
            {selectedPremiumTemplate && (
              <View style={styles.templatePreview}>
                <Image 
                  source={{ uri: selectedPremiumTemplate.thumbnail }} 
                  style={styles.templatePreviewImage}
                  resizeMode="cover"
                />
                <View style={styles.templatePreviewOverlay}>
                  <Text style={styles.templatePreviewTitle}>{selectedPremiumTemplate.name}</Text>
                  <Text style={styles.templatePreviewDescription}>{selectedPremiumTemplate.category}</Text>
                </View>
              </View>
            )}

            {/* Features List */}
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={isSmallScreen ? 18 : isTablet ? 24 : 20} color="#4CAF50" />
                <Text style={[styles.featureText, { color: '#1a1a1a' }]}>
                  Access to all premium templates
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={isSmallScreen ? 18 : isTablet ? 24 : 20} color="#4CAF50" />
                <Text style={[styles.featureText, { color: '#1a1a1a' }]}>
                  No watermarks on final designs
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={isSmallScreen ? 18 : isTablet ? 24 : 20} color="#4CAF50" />
                <Text style={[styles.featureText, { color: '#1a1a1a' }]}>
                  Priority customer support
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={isSmallScreen ? 18 : isTablet ? 24 : 20} color="#4CAF50" />
                <Text style={[styles.featureText, { color: '#1a1a1a' }]}>
                  Advanced editing features
                </Text>
              </View>
            </View>

            {/* Modal Footer */}
            <View style={styles.upgradeModalFooter}>
              <TouchableOpacity 
                style={[styles.cancelButton, { borderColor: '#cccccc' }]}
                onPress={() => setUpgradeModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: '#666666' }]}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={() => {
                  setUpgradeModalVisible(false);
                  navigation.navigate('Subscription');
                }}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.upgradeButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name="star" size={isSmallScreen ? 14 : isTablet ? 20 : 16} color="#ffffff" style={styles.upgradeButtonIcon} />
                  <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
      </Modal>
    );
  };

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
        <View style={[
          styles.header, 
          { 
            paddingTop: insets.top + responsiveSpacing.sm,
            paddingBottom: responsiveSpacing.md,
            paddingHorizontal: responsiveSpacing.md,
          }
        ]}>
          <View style={[
            styles.headerContent, 
            { paddingHorizontal: responsiveSpacing.sm }
          ]}>
            <Text style={[
              styles.headerTitle,
              { fontSize: responsiveText.subheading }
            ]}>Greeting Templates</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[
          styles.searchContainer, 
          { 
            marginHorizontal: responsiveSpacing.md,
            marginVertical: responsiveSpacing.sm,
          }
        ]}>
          <View style={[
            styles.searchBar, 
            { 
              backgroundColor: theme.colors.cardBackground,
              paddingHorizontal: responsiveSpacing.md,
              paddingVertical: responsiveSpacing.sm,
              borderRadius: isTablet ? 20 : 16,
              minHeight: isTablet ? 56 : 48,
            }
          ]}>
            <Icon name="search" size={isTablet ? 24 : 20} color={theme.colors.textSecondary} />
            <TextInput
              style={[
                styles.searchInput, 
                { 
                  color: theme.colors.text,
                  marginLeft: responsiveSpacing.sm,
                  fontSize: responsiveText.body,
                  minHeight: isTablet ? 48 : 40,
                }
              ]}
              placeholder="Search greeting templates..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="clear" size={isTablet ? 24 : 20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Tabs */}
        <View style={[styles.categoriesContainer, { marginBottom: responsiveSpacing.sm }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.categoriesScroll, 
              { paddingHorizontal: responsiveSpacing.md, gap: responsiveSpacing.sm }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.categoryTab,
                {
                  backgroundColor: selectedCategory === 'all' ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                  paddingVertical: responsiveSpacing.sm,
                  paddingHorizontal: responsiveSpacing.md,
                  borderRadius: isTablet ? 28 : 24,
                  gap: responsiveSpacing.xs,
                  minWidth: isTablet ? (isLandscape ? 120 : 100) : 80,
                  minHeight: isTablet ? 52 : 44,
                }
              ]}
              onPress={() => handleCategorySelect('all')}
              activeOpacity={0.7}
            >
              <Icon
                name="apps"
                size={isTablet ? 24 : 20}
                color={selectedCategory === 'all' ? '#FFFFFF' : theme.colors.text}
              />
              <Text
                style={[
                  styles.categoryTabText,
                  {
                    color: selectedCategory === 'all' ? '#FFFFFF' : theme.colors.text,
                    fontSize: responsiveText.caption,
                  }
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <View key={category.id}>
                {renderCategoryTab({ item: category })}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Templates Grid - Optimized FlatList */}
        <FlatList
          {...flatListProps}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </LinearGradient>
      
      {/* Premium Modal */}
      {renderUpgradeModal()}
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
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    minHeight: 40,
  },
  categoriesContainer: {
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    minWidth: 80,
    justifyContent: 'center',
    minHeight: 44,
  },
  categoryTabText: {
    fontWeight: '600',
  },
  templatesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  templateRow: {
    justifyContent: 'flex-start',
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Premium Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isSmallScreen ? 16 : isTablet ? 32 : 20,
  },
  modalScrollView: {
    maxHeight: screenHeight * 0.9,
    width: '100%',
    maxWidth: isTablet ? 500 : screenWidth - 32,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  upgradeModalContent: {
    borderRadius: isTablet ? 32 : isSmallScreen ? 20 : 24,
    padding: isSmallScreen ? 20 : isTablet ? 32 : 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: isTablet ? 12 : 8,
    },
    shadowOpacity: isTablet ? 0.3 : 0.25,
    shadowRadius: isTablet ? 20 : 16,
    elevation: isTablet ? 25 : 20,
    width: '100%',
    minHeight: isSmallScreen ? screenHeight * 0.35 : screenHeight * 0.4,
    maxHeight: screenHeight * 0.85,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: isSmallScreen ? 12 : isTablet ? 20 : 16,
    paddingVertical: isSmallScreen ? 6 : isTablet ? 10 : 8,
    borderRadius: isTablet ? 24 : 20,
    alignSelf: 'center',
    marginBottom: isSmallScreen ? 16 : isTablet ? 24 : 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumBadgeText: {
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    fontWeight: '700',
    color: '#B8860B',
    marginLeft: isTablet ? 8 : 6,
    letterSpacing: 1,
  },
  upgradeModalHeader: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 20 : isTablet ? 32 : 24,
  },
  upgradeModalTitle: {
    fontSize: isSmallScreen ? 20 : isTablet ? 28 : 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: isSmallScreen ? 6 : isTablet ? 12 : 8,
    paddingHorizontal: isSmallScreen ? 8 : 0,
    color: '#1a1a1a',
    lineHeight: isSmallScreen ? 24 : isTablet ? 36 : 30,
  },
  upgradeModalSubtitle: {
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 20 : isTablet ? 26 : 22,
    paddingHorizontal: isSmallScreen ? 8 : isTablet ? 16 : 0,
    color: '#666666',
  },
  templatePreview: {
    height: isSmallScreen ? 100 : isTablet ? 140 : 120,
    borderRadius: isTablet ? 20 : 16,
    overflow: 'hidden',
    marginBottom: isSmallScreen ? 20 : isTablet ? 28 : 24,
    position: 'relative',
  },
  templatePreviewImage: {
    width: '100%',
    height: '100%',
  },
  templatePreviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: isSmallScreen ? 12 : isTablet ? 20 : 16,
  },
  templatePreviewTitle: {
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: isTablet ? 6 : 4,
  },
  templatePreviewDescription: {
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuresList: {
    marginBottom: isSmallScreen ? 20 : isTablet ? 28 : 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 10 : isTablet ? 16 : 12,
  },
  featureText: {
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    marginLeft: isSmallScreen ? 10 : isTablet ? 16 : 12,
    flex: 1,
    lineHeight: isSmallScreen ? 20 : isTablet ? 26 : 22,
    color: '#1a1a1a',
  },
  upgradeModalFooter: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: isSmallScreen ? 12 : isTablet ? 20 : 16,
    alignItems: 'stretch',
    width: '100%',
    marginTop: isTablet ? 8 : 0,
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: isSmallScreen ? 14 : isTablet ? 18 : 16,
    paddingHorizontal: isSmallScreen ? 16 : isTablet ? 24 : 20,
    borderRadius: isTablet ? 16 : 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isSmallScreen ? 48 : isTablet ? 56 : 48,
    maxWidth: '100%',
    minWidth: isSmallScreen ? 140 : isTablet ? 180 : 160,
    borderColor: '#cccccc',
  },
  cancelButtonText: {
    fontSize: isSmallScreen ? 14 : isTablet ? 17 : 16,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
    flexShrink: 0,
  },
  upgradeButton: {
    flex: 1,
    borderRadius: isTablet ? 16 : 12,
    overflow: 'hidden',
    minHeight: isSmallScreen ? 48 : isTablet ? 56 : 48,
    maxWidth: '100%',
    minWidth: isSmallScreen ? 140 : isTablet ? 180 : 160,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 14 : isTablet ? 18 : 16,
    paddingHorizontal: isSmallScreen ? 12 : isTablet ? 20 : 16,
    minHeight: isSmallScreen ? 48 : isTablet ? 56 : 48,
  },
  upgradeButtonIcon: {
    marginRight: isSmallScreen ? 4 : isTablet ? 8 : 6,
  },
  upgradeButtonText: {
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    flexShrink: 0,
    numberOfLines: 1,
  },
});

export default GreetingTemplatesScreen;
