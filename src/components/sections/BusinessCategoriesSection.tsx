/**
 * BusinessCategoriesSection Component
 * 
 * Extracted from HomeScreen for better performance and maintainability
 * Displays horizontal list of business category cards
 */

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BusinessCategory } from '../../services/businessCategoriesService';
import OptimizedImage from '../OptimizedImage';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale } from '../../utils/responsiveUtils';
import { Template } from '../../services/dashboard';

// Memoized Business Category Card Item Component
interface BusinessCategoryCardItemProps {
  item: BusinessCategory;
  cardWidth: number;
  theme: any;
  previewTemplates?: Template[];
  onPress: (category: BusinessCategory) => void;
}

const BusinessCategoryCardItem: React.FC<BusinessCategoryCardItemProps> = React.memo(
  ({ item, cardWidth, theme, previewTemplates, onPress }) => {
    const handlePress = useCallback(() => {
      onPress(item);
    }, [item, onPress]);

    const displayImage = useMemo(() => {
      // First try to get preview template thumbnails
      const thumbnails =
        previewTemplates
          ?.map((template: Template) => template.thumbnail)
          .filter((uri): uri is string => typeof uri === 'string' && uri.length > 0) ?? [];

      if (thumbnails.length > 0) {
        console.log(`BusinessCategoriesSection: Using preview template for ${item.name}:`, thumbnails[0]);
        return thumbnails[0]; // Use preview template if available
      }

      // Fallback to category default image
      const fallbackImage = item.imageUrl || (item as any).image;
      if (fallbackImage) {
        console.log(`BusinessCategoriesSection: Using fallback image for ${item.name}:`, fallbackImage);
        return fallbackImage;
      }

      // Final fallback - no image available
      console.log(`BusinessCategoriesSection: No image available for ${item.name}`);
      return null;
    }, [previewTemplates, item]);

    // Determine if images are still loading for this category
    const isImageLoading = useMemo(() => {
      // If previewTemplates is undefined, it means images are still being fetched
      // If previewTemplates is an empty array, it means fetch completed but no images found
      return previewTemplates === undefined;
    }, [previewTemplates]);

    // Skeleton loader component for loading state
    const SkeletonLoader = useCallback(() => {
      const shimmerAnim = useRef(new Animated.Value(0)).current;

      useEffect(() => {
        const shimmerAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(shimmerAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
        shimmerAnimation.start();

        return () => shimmerAnimation.stop();
      }, [shimmerAnim]);

      const shimmerTranslateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-cardWidth * 1.5, cardWidth * 1.5],
      });

      return (
        <View
          style={[
            styles.businessCategoryImage,
            {
              backgroundColor: '#f0f0f0',
              borderRadius: moderateScale(8),
              overflow: 'hidden',
            }
          ]}
        >
          {/* Shimmer animation overlay */}
          <Animated.View
            style={[
              styles.skeletonShimmer,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          />
        </View>
      );
    }, [cardWidth]);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.businessCategoryCard, { width: cardWidth }]}
        onPress={handlePress}
      >
        <View
          style={[
            styles.businessCategoryCardContent,
            {
              backgroundColor: theme.colors.cardBackground,
              height: cardWidth,
            },
          ]}
        >
          <View style={styles.businessCategoryImageSection}>
            {displayImage ? (
              <OptimizedImage
                uri={displayImage}
                style={styles.businessCategoryImage}
                resizeMode="cover"
                mode="thumbnail"
                cacheKey={`category_${item.id}`}
              />
            ) : isImageLoading ? (
              <SkeletonLoader />
            ) : (
              <View
                style={[
                  styles.businessCategoryImage,
                  styles.fallbackImageContainer,
                  {
                    backgroundColor: theme.colors.primary + '15',
                  },
                ]}
              >
                <Text style={[styles.fallbackIcon, { color: theme.colors.primary }]}>
                  {item.icon || 'business'}
                </Text>
                <Text style={[styles.fallbackText, { color: theme.colors.textSecondary }]}>
                  {item.name}
                </Text>
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
                { justifyContent: 'flex-end', padding: moderateScale(6) },
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
  },
  (prev, next) => {
    // Fast path: if references are the same, skip re-render
    if (prev === next) return true;
    
    // Check primitive props first (fastest)
    if (prev.cardWidth !== next.cardWidth) return false;
    if (prev.item.id !== next.item.id) return false;
    if (prev.theme?.colors?.cardBackground !== next.theme?.colors?.cardBackground) return false;
    
    // Check preview templates array reference
    if (prev.previewTemplates !== next.previewTemplates) {
      // If reference changed, check if content is actually different
      if (!prev.previewTemplates || !next.previewTemplates) {
        // One is null/undefined, the other isn't
        if (prev.previewTemplates?.length !== next.previewTemplates?.length) return false;
      } else if (prev.previewTemplates.length !== next.previewTemplates.length) {
        return false;
      } else {
        // Same length, check if any template IDs changed
        const prevIds = prev.previewTemplates.map(t => t.id).join(',');
        const nextIds = next.previewTemplates.map(t => t.id).join(',');
        if (prevIds !== nextIds) return false;
      }
    }
    
    return true;
  }
);

BusinessCategoryCardItem.displayName = 'BusinessCategoryCardItem';

interface BusinessCategoriesSectionProps {
  businessCategories: BusinessCategory[];
  businessCategoryPreviews: Record<string, any[]>;
  isHighlighted: boolean;
  cardWidth: number;
  theme: any;
  getItemLayout: (data: any, index: number) => { length: number; offset: number; index: number };
  onCategoryPress: (category: BusinessCategory) => void;
  onViewAllPress: () => void;
  renderBrowseAllButton: (onPress: () => void) => React.ReactNode;
  sectionRef?: React.RefObject<View | null>;
  onLayout?: () => void;
}

const BusinessCategoriesSection: React.FC<BusinessCategoriesSectionProps> = React.memo(({
  businessCategories,
  businessCategoryPreviews,
  isHighlighted,
  cardWidth,
  theme,
  getItemLayout,
  onCategoryPress,
  onViewAllPress,
  renderBrowseAllButton,
  sectionRef,
  onLayout,
}) => {
  // Memoize preview templates lookup to prevent unnecessary re-renders
  const previewTemplatesMap = useMemo(() => {
    return businessCategoryPreviews;
  }, [businessCategoryPreviews]);

  const renderBusinessCategoryCard = useCallback(
    ({ item }: { item: BusinessCategory }) => {
      const previewTemplates = previewTemplatesMap[item.id];
      return (
        <BusinessCategoryCardItem
          item={item}
          cardWidth={cardWidth}
          theme={theme}
          previewTemplates={previewTemplates}
          onPress={onCategoryPress}
        />
      );
    },
    [previewTemplatesMap, cardWidth, theme, onCategoryPress]
  );

  const keyExtractor = useCallback((item: BusinessCategory) => item.id, []);

  if (businessCategories.length === 0) {
    return null;
  }

  return (
    <View
      ref={sectionRef}
      style={[
        styles.businessCategoriesSection,
        isHighlighted && styles.businessCategoriesSectionHighlighted,
      ]}
      onLayout={onLayout}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
          Business Categories
        </Text>
        {renderBrowseAllButton(onViewAllPress)}
      </View>
      <FlatList
        data={businessCategories}
        renderItem={renderBusinessCategoryCard}
        keyExtractor={keyExtractor}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        windowSize={3}
        initialNumToRender={6}
        updateCellsBatchingPeriod={100}
        getItemLayout={getItemLayout}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        contentContainerStyle={styles.horizontalList}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization - check array reference first for performance
  if (prevProps.businessCategories !== nextProps.businessCategories) {
    // If array reference changed, check if length or items changed
    if (prevProps.businessCategories.length !== nextProps.businessCategories.length) return false;
    // Check if any item IDs changed
    const prevIds = prevProps.businessCategories.map(c => c.id).join(',');
    const nextIds = nextProps.businessCategories.map(c => c.id).join(',');
    if (prevIds !== nextIds) return false;
  }
  if (prevProps.isHighlighted !== nextProps.isHighlighted) return false;
  if (prevProps.cardWidth !== nextProps.cardWidth) return false;
  if (prevProps.theme?.colors?.text !== nextProps.theme?.colors?.text) return false;
  if (prevProps.theme?.colors?.cardBackground !== nextProps.theme?.colors?.cardBackground) return false;
  // Check if businessCategoryPreviews object reference changed (shallow check)
  if (prevProps.businessCategoryPreviews !== nextProps.businessCategoryPreviews) {
    // If reference changed, check if keys changed
    const prevKeys = Object.keys(prevProps.businessCategoryPreviews).sort().join(',');
    const nextKeys = Object.keys(nextProps.businessCategoryPreviews).sort().join(',');
    if (prevKeys !== nextKeys) return false;
  }
  return true;
});

BusinessCategoriesSection.displayName = 'BusinessCategoriesSection';

const styles = StyleSheet.create({
  businessCategoriesSection: {
    paddingBottom: moderateScale(15),
    paddingHorizontal: moderateScale(8),
  },
  businessCategoriesSectionHighlighted: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    marginVertical: moderateScale(4),
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
  businessCategoryImageGrid: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  businessCategoryImageCell: {
    width: '50%',
    height: '50%',
    padding: 1,
  },
  businessCategoryImageCellFull: {
    width: '100%',
  },
  businessCategoryImageCellImage: {
    width: '100%',
    height: '100%',
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
  fallbackImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(8),
  },
  fallbackIcon: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    marginBottom: moderateScale(4),
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: moderateScale(8),
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default BusinessCategoriesSection;

