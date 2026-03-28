import React from 'react';
import {
  View,
  FlatList,
} from 'react-native';
import { FeaturedContent } from '../../../services/homeApi';

interface FeaturedCarouselSectionProps {
  isSearching: boolean;
  searchQuery: string;
  featuredContent: FeaturedContent[];
  featuredCarouselRef: React.RefObject<FlatList<FeaturedContent>>;
  featuredCarouselIndex: number;
  featuredCarouselSnapInterval: number;
  SIDE_PADDING: number;
  renderFeaturedCarouselItem: (info: { item: FeaturedContent; index: number }) => React.ReactElement | null;
  keyExtractorIdString: (item: any, index: number) => string;
  getFeaturedCarouselItemLayout: (data: any, index: number) => { length: number; offset: number; index: number };
  renderItemSeparator: () => React.ReactNode;
  handleFeaturedCarouselScrollFailure: (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => void;
  handleFeaturedCarouselScrollBeginDrag: () => void;
  handleFeaturedCarouselScrollEndDrag: () => void;
  handleFeaturedCarouselMomentumScrollEnd: (event: any) => void;
  handleViewableItemsChanged: (info: { viewableItems: any[]; changed: any[] }) => void;
  viewabilityConfig: any;
  styles: any;
}

const FeaturedCarouselSection: React.FC<FeaturedCarouselSectionProps> = ({
  isSearching,
  searchQuery,
  featuredContent,
  featuredCarouselRef,
  featuredCarouselIndex,
  featuredCarouselSnapInterval,
  SIDE_PADDING,
  renderFeaturedCarouselItem,
  keyExtractorIdString,
  getFeaturedCarouselItemLayout,
  renderItemSeparator,
  handleFeaturedCarouselScrollFailure,
  handleFeaturedCarouselScrollBeginDrag,
  handleFeaturedCarouselScrollEndDrag,
  handleFeaturedCarouselMomentumScrollEnd,
  handleViewableItemsChanged,
  viewabilityConfig,
  styles,
}) => {
  if (isSearching || searchQuery.trim() !== '' || featuredContent.length === 0) {
    return null;
  }

  return (
    <View style={styles.featuredCarouselWrapper}>
      <View style={styles.featuredCarouselContainer}>
        <FlatList
          ref={featuredCarouselRef}
          data={featuredContent}
          renderItem={renderFeaturedCarouselItem}
          keyExtractor={keyExtractorIdString}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled={false}
          snapToInterval={featuredCarouselSnapInterval}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={getFeaturedCarouselItemLayout}
          ItemSeparatorComponent={renderItemSeparator}
          onScrollToIndexFailed={handleFeaturedCarouselScrollFailure}
          onScrollBeginDrag={handleFeaturedCarouselScrollBeginDrag}
          onScrollEndDrag={handleFeaturedCarouselScrollEndDrag}
          onMomentumScrollEnd={handleFeaturedCarouselMomentumScrollEnd}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
        />
        <View style={styles.featuredCarouselIndicators}>
          {featuredContent.map((_, index) => (
            <View
              key={index}
              style={[
                styles.featuredCarouselDot,
                index === featuredCarouselIndex && styles.featuredCarouselDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default FeaturedCarouselSection;
