/**
 * GeneralCategoriesSection Component
 * 
 * Extracted from HomeScreen for better performance and maintainability
 * Displays horizontal list of general/greeting category cards
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import OptimizedImage from '../OptimizedImage';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale } from '../../utils/responsiveUtils';

// Memoized Greeting Category Card Component
interface GreetingCategoryCardProps {
  item: { id: string; name: string; icon: string; color?: string; imageUrl?: string };
  cardWidth: number;
  theme: any;
  categoryImage: string | null;
  onPress: (item: { id: string; name: string; icon: string; color?: string }) => void;
}

const GreetingCategoryCard: React.FC<GreetingCategoryCardProps> = React.memo(({ item, cardWidth, theme, categoryImage, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.businessCategoryCard, { width: cardWidth }]}
      onPress={handlePress}
    >
      <View style={[
        styles.businessCategoryCardContent, 
        { 
          backgroundColor: theme.colors.cardBackground,
          height: cardWidth,
        }
      ]}>
        <View style={styles.businessCategoryImageSection}>
          {categoryImage ? (
            <OptimizedImage 
              uri={categoryImage} 
              style={styles.businessCategoryImage}
              resizeMode="cover"
              mode="thumbnail"
              cacheKey={`greeting_category_${item.id}`}
            />
          ) : (
            <View
              style={[
                styles.businessCategoryImage,
                { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
              ]}
            >
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { justifyContent: 'flex-end', padding: 6 },
            ]}
            pointerEvents="none"
          >
            <Text 
              style={[styles.businessCategoryName, { color: '#ffffff', textAlign: 'left' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Fast path: if references are the same, skip re-render
  if (prevProps === nextProps) return true;
  
  // Check primitive props first (fastest)
  if (prevProps.cardWidth !== nextProps.cardWidth) return false;
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.categoryImage !== nextProps.categoryImage) return false;
  if (prevProps.theme?.colors?.cardBackground !== nextProps.theme?.colors?.cardBackground) return false;
  
  // Check item properties (only if item reference changed)
  if (prevProps.item !== nextProps.item) {
    if (prevProps.item.name !== nextProps.item.name) return false;
    if (prevProps.item.icon !== nextProps.item.icon) return false;
  }
  
  return true;
});

GreetingCategoryCard.displayName = 'GreetingCategoryCard';

interface GeneralCategory {
  id: string;
  name: string;
  icon: string;
  color?: string;
  imageUrl?: string;
}

interface GeneralCategoriesSectionProps {
  greetingCategoriesList: GeneralCategory[];
  greetingCategoryImages: Record<string, string>;
  cardWidth: number;
  theme: any;
  getItemLayout: (data: any, index: number) => { length: number; offset: number; index: number };
  onCategoryPress: (category: GeneralCategory) => void;
  onViewAllPress: () => void;
  renderBrowseAllButton: (onPress: () => void) => React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const GeneralCategoriesSection: React.FC<GeneralCategoriesSectionProps> = React.memo(({
  greetingCategoriesList,
  greetingCategoryImages,
  cardWidth,
  theme,
  getItemLayout,
  onCategoryPress,
  onViewAllPress,
  renderBrowseAllButton,
  onLoadMore,
  hasMore = false,
}) => {
  // Memoize category images lookup to prevent unnecessary re-renders
  const categoryImagesMap = useMemo(() => {
    return greetingCategoryImages;
  }, [greetingCategoryImages]);

  const renderGreetingCategoryCard = useCallback(({ item }: { item: GeneralCategory }) => {
    const categoryImage = categoryImagesMap[item.id] || item.imageUrl || null;
    
    return (
      <GreetingCategoryCard
        item={item}
        cardWidth={cardWidth}
        theme={theme}
        categoryImage={categoryImage}
        onPress={onCategoryPress}
      />
    );
  }, [categoryImagesMap, cardWidth, theme, onCategoryPress]);

  const keyExtractor = useCallback((item: GeneralCategory) => item.id, []);

  // Handle scroll to detect when user is near the end and load more
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (!onLoadMore || !hasMore) return;
    
    // Check if user has scrolled to near the end (within last 2 items)
    if (viewableItems.length > 0) {
      const lastVisibleIndex = Math.max(...viewableItems.map((item: any) => item.index || 0));
      const totalItems = greetingCategoriesList.length;
      
      // Load more when user scrolls to within 2 items of the end
      if (lastVisibleIndex >= totalItems - 2) {
        onLoadMore();
      }
    }
  }, [onLoadMore, hasMore, greetingCategoriesList.length]);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  if (greetingCategoriesList.length === 0) {
    return null;
  }

  return (
    <View style={styles.businessCategoriesSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
          General Categories
        </Text>
        {renderBrowseAllButton(onViewAllPress)}
      </View>
      <FlatList
        data={greetingCategoriesList}
        renderItem={renderGreetingCategoryCard}
        keyExtractor={keyExtractor}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        windowSize={3}
        initialNumToRender={5}
        updateCellsBatchingPeriod={100}
        getItemLayout={getItemLayout}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        contentContainerStyle={styles.horizontalList}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization - check array reference first for performance
  if (prevProps.greetingCategoriesList !== nextProps.greetingCategoriesList) {
    // If array reference changed, check if length or items changed
    if (prevProps.greetingCategoriesList.length !== nextProps.greetingCategoriesList.length) return false;
    // Check if any item IDs changed
    const prevIds = prevProps.greetingCategoriesList.map(c => c.id).join(',');
    const nextIds = nextProps.greetingCategoriesList.map(c => c.id).join(',');
    if (prevIds !== nextIds) return false;
  }
  if (prevProps.cardWidth !== nextProps.cardWidth) return false;
  if (prevProps.theme?.colors?.text !== nextProps.theme?.colors?.text) return false;
  if (prevProps.theme?.colors?.cardBackground !== nextProps.theme?.colors?.cardBackground) return false;
  // Check if greetingCategoryImages object reference changed (shallow check)
  if (prevProps.greetingCategoryImages !== nextProps.greetingCategoryImages) {
    // If reference changed, check if keys changed
    const prevKeys = Object.keys(prevProps.greetingCategoryImages).sort().join(',');
    const nextKeys = Object.keys(nextProps.greetingCategoryImages).sort().join(',');
    if (prevKeys !== nextKeys) return false;
  }
  // Check new props for lazy loading
  if (prevProps.hasMore !== nextProps.hasMore) return false;
  if (prevProps.onLoadMore !== nextProps.onLoadMore) return false;
  return true;
});

GeneralCategoriesSection.displayName = 'GeneralCategoriesSection';

const styles = StyleSheet.create({
  businessCategoriesSection: {
    paddingBottom: moderateScale(15),
    paddingHorizontal: moderateScale(8),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    marginBottom: moderateScale(4),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    marginBottom: moderateScale(4),
    paddingHorizontal: moderateScale(10),
  },
  horizontalList: {
    paddingHorizontal: moderateScale(3),
  },
  businessCategoryCard: {
    marginRight: moderateScale(3),
  },
  businessCategoryCardContent: {
    width: '100%',
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  businessCategoryImageSection: {
    flex: 1,
    width: '100%',
  },
  businessCategoryImage: {
    width: '100%',
    height: '100%',
  },
  businessCategoryIcon: {
    fontSize: moderateScale(32),
    color: '#555',
  },
  businessCategoryName: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    textAlign: 'left',
    letterSpacing: 0.2,
  },
});

export default GeneralCategoriesSection;

