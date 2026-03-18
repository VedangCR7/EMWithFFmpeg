import React from 'react';
import {
  View,
  Text,
  FlatList,
} from 'react-native';

interface SearchResultItem {
  type: 'category' | 'template';
  data: any;
}

interface SearchResultsSectionProps {
  isSearching: boolean;
  searchQuery: string;
  filteredGreetingCategoriesList: Array<{ name: string }>;
  templates: SearchResultItem[];
  theme: any;
  renderSearchCategoryItem: ({ item }: { item: any }) => React.ReactElement | null;
  renderTemplate: ({ item }: { item: SearchResultItem }) => React.ReactElement | null;
  keyExtractorCategory: (item: any, index: number) => string;
  styles: any;
}

const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  isSearching,
  searchQuery,
  filteredGreetingCategoriesList,
  templates,
  theme,
  renderSearchCategoryItem,
  renderTemplate,
  keyExtractorCategory,
  styles,
}) => {
  if (!isSearching || searchQuery.trim() === '') {
    return null;
  }

  const searchLower = searchQuery.toLowerCase();
  const matchingCategories = filteredGreetingCategoriesList.filter(category =>
    category.name.toLowerCase().includes(searchLower) ||
    searchLower.includes(category.name.toLowerCase())
  );

  return (
    <>
      {/* Show matching General Categories */}
      {matchingCategories.length > 0 && (
        <View style={styles.templatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
              Categories
            </Text>
          </View>
          <FlatList
            data={matchingCategories}
            renderItem={renderSearchCategoryItem}
            keyExtractor={keyExtractorCategory}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {/* Show matching Templates */}
      <View style={styles.templatesSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
            {matchingCategories.length > 0 ? 'Templates' : 'Search Results'}
          </Text>
        </View>
        {templates.length > 0 ? (
          <FlatList
            key={`search-results-${templates.length}`}
            data={templates}
            renderItem={renderTemplate}
            keyExtractor={(item, index) => 
              item.type === 'category' 
                ? `category-${item.data.name}-${index}` 
                : `template-${item.data.id}`
            }
            horizontal={false}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={5}
            initialNumToRender={3}
            updateCellsBatchingPeriod={150}
            contentContainerStyle={styles.verticalSearchList}
          />
        ) : matchingCategories.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
              No results found for "{searchQuery}"
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );
};

export default SearchResultsSection;
