import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from 'react-native';

interface GreetingSectionsContainerProps {
  isSearching: boolean;
  searchQuery: string;
  theme: any;
  greetingSectionsLoadedRef: React.RefObject<boolean>;
  businessEthicsTemplates: any[];
  businessEthicsLoading: boolean;
  successMindsetTemplates: any[];
  successMindsetLoading: boolean;
  socialMediaGrowthTemplates: any[];
  socialMediaGrowthLoading: boolean;
  moneyAndFinanceTemplates: any[];
  moneyAndFinanceLoading: boolean;
  businessLegendQuoteTemplates: any[];
  businessLegendQuoteLoading: boolean;
  businessMarketingTipsTemplates: any[];
  businessMarketingTipsLoading: boolean;
  businessQuotesTemplates: any[];
  businessQuotesLoading: boolean;
  renderBrowseAllButton: (onPress: () => void) => React.ReactNode;
  renderBusinessEthicsCard: ({ item }: { item: any }) => React.ReactElement | null;
  renderSuccessMindsetCard: ({ item }: { item: any }) => React.ReactElement | null;
  renderSocialMediaGrowthCard: ({ item }: { item: any }) => React.ReactElement | null;
  renderMoneyAndFinanceCard: ({ item }: { item: any }) => React.ReactElement | null;
  renderBusinessLegendQuoteCard: ({ item }: { item: any }) => React.ReactElement | null;
  renderBusinessMarketingTipsCard: ({ item }: { item: any }) => React.ReactElement | null;
  renderBusinessQuotesCard: ({ item }: { item: any }) => React.ReactElement | null;
  keyExtractor: (item: any, index: number) => string;
  getItemLayout: (data: any, index: number) => { length: number; offset: number; index: number };
  loadMoreBusinessEthics: () => void;
  loadMoreSuccessMindset: () => void;
  loadMoreSocialMediaGrowth: () => void;
  loadMoreMoneyAndFinance: () => void;
  loadMoreBusinessLegendQuote: () => void;
  loadMoreBusinessMarketingTips: () => void;
  loadMoreBusinessQuotes: () => void;
  styles: any;
}

const GreetingSectionsContainer: React.FC<GreetingSectionsContainerProps> = ({
  isSearching,
  searchQuery,
  theme,
  greetingSectionsLoadedRef,
  businessEthicsTemplates,
  businessEthicsLoading,
  successMindsetTemplates,
  successMindsetLoading,
  socialMediaGrowthTemplates,
  socialMediaGrowthLoading,
  moneyAndFinanceTemplates,
  moneyAndFinanceLoading,
  businessLegendQuoteTemplates,
  businessLegendQuoteLoading,
  businessMarketingTipsTemplates,
  businessMarketingTipsLoading,
  businessQuotesTemplates,
  businessQuotesLoading,
  renderBrowseAllButton,
  renderBusinessEthicsCard,
  renderSuccessMindsetCard,
  renderSocialMediaGrowthCard,
  renderMoneyAndFinanceCard,
  renderBusinessLegendQuoteCard,
  renderBusinessMarketingTipsCard,
  renderBusinessQuotesCard,
  keyExtractor,
  getItemLayout,
  loadMoreBusinessEthics,
  loadMoreSuccessMindset,
  loadMoreSocialMediaGrowth,
  loadMoreMoneyAndFinance,
  loadMoreBusinessLegendQuote,
  loadMoreBusinessMarketingTips,
  loadMoreBusinessQuotes,
  styles,
}) => {
  if (isSearching || searchQuery.trim() !== '') {
    return null;
  }

  return (
    <>
      {/* Business Ethics Section */}
      {businessEthicsTemplates.length > 0 && (
        <View style={styles.templatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
              Business Ethics
            </Text>
            {renderBrowseAllButton(loadMoreBusinessEthics)}
          </View>
          <FlatList
            data={businessEthicsTemplates}
            renderItem={renderBusinessEthicsCard}
            keyExtractor={keyExtractor}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.horizontalList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={2}
            initialNumToRender={3}
            updateCellsBatchingPeriod={150}
            getItemLayout={getItemLayout}
            onEndReached={loadMoreBusinessEthics}
            onEndReachedThreshold={0.5}
            ListFooterComponent={businessEthicsLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
          />
        </View>
      )}

      {/* Success Mindset Section */}
      {(successMindsetTemplates.length > 0 || greetingSectionsLoadedRef.current) && successMindsetTemplates.length > 0 && (
        <View style={styles.templatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
              Success Mindset
            </Text>
            {renderBrowseAllButton(loadMoreSuccessMindset)}
          </View>
          <FlatList
            data={successMindsetTemplates}
            renderItem={renderSuccessMindsetCard}
            keyExtractor={keyExtractor}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.horizontalList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={2}
            initialNumToRender={3}
            updateCellsBatchingPeriod={150}
            getItemLayout={getItemLayout}
            onEndReached={loadMoreSuccessMindset}
            onEndReachedThreshold={0.5}
            ListFooterComponent={successMindsetLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
          />
        </View>
      )}

      {/* Social Media Growth Section */}
      {socialMediaGrowthTemplates.length > 0 && (
        <View style={styles.templatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
              Social Media Growth
            </Text>
            {renderBrowseAllButton(loadMoreSocialMediaGrowth)}
          </View>
          <FlatList
            data={socialMediaGrowthTemplates}
            renderItem={renderSocialMediaGrowthCard}
            keyExtractor={keyExtractor}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.horizontalList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={2}
            initialNumToRender={3}
            updateCellsBatchingPeriod={150}
            getItemLayout={getItemLayout}
            onEndReached={loadMoreSocialMediaGrowth}
            onEndReachedThreshold={0.5}
            ListFooterComponent={socialMediaGrowthLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
          />
        </View>
      )}

      {/* Money and Finance Section */}
      {moneyAndFinanceTemplates.length > 0 && (
        <View style={styles.templatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
              Money and Finance
            </Text>
            {renderBrowseAllButton(loadMoreMoneyAndFinance)}
          </View>
          <FlatList
            data={moneyAndFinanceTemplates}
            renderItem={renderMoneyAndFinanceCard}
            keyExtractor={keyExtractor}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.horizontalList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={2}
            initialNumToRender={3}
            updateCellsBatchingPeriod={150}
            getItemLayout={getItemLayout}
            onEndReached={loadMoreMoneyAndFinance}
            onEndReachedThreshold={0.5}
            ListFooterComponent={moneyAndFinanceLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
          />
        </View>
      )}

      {/* Business Legend Quote Section */}
      {businessLegendQuoteTemplates.length > 0 && (
        <View style={styles.templatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
              Business Legend Quote
            </Text>
            {renderBrowseAllButton(loadMoreBusinessLegendQuote)}
          </View>
          <FlatList
            data={businessLegendQuoteTemplates}
            renderItem={renderBusinessLegendQuoteCard}
            keyExtractor={keyExtractor}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.horizontalList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={2}
            initialNumToRender={3}
            updateCellsBatchingPeriod={150}
            getItemLayout={getItemLayout}
            onEndReached={loadMoreBusinessLegendQuote}
            onEndReachedThreshold={0.5}
            ListFooterComponent={businessLegendQuoteLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
          />
        </View>
      )}

      {/* Business Marketing Tips Section */}
      {businessMarketingTipsTemplates.length > 0 && (
        <View style={styles.templatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
              Business Marketing Tips
            </Text>
            {renderBrowseAllButton(loadMoreBusinessMarketingTips)}
          </View>
          <FlatList
            data={businessMarketingTipsTemplates}
            renderItem={renderBusinessMarketingTipsCard}
            keyExtractor={keyExtractor}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.horizontalList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={2}
            initialNumToRender={3}
            updateCellsBatchingPeriod={150}
            getItemLayout={getItemLayout}
            onEndReached={loadMoreBusinessMarketingTips}
            onEndReachedThreshold={0.5}
            ListFooterComponent={businessMarketingTipsLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
          />
        </View>
      )}

      {/* Business Quotes Section */}
      {businessQuotesTemplates.length > 0 && (
        <View style={styles.templatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, color: theme.colors.text, fontWeight: 'bold' }]}>
              Business Quotes
            </Text>
            {renderBrowseAllButton(loadMoreBusinessQuotes)}
          </View>
          <FlatList
            data={businessQuotesTemplates}
            renderItem={renderBusinessQuotesCard}
            keyExtractor={keyExtractor}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.horizontalList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={2}
            initialNumToRender={3}
            updateCellsBatchingPeriod={150}
            getItemLayout={getItemLayout}
            onEndReached={loadMoreBusinessQuotes}
            onEndReachedThreshold={0.5}
            ListFooterComponent={businessQuotesLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
          />
        </View>
      )}
    </>
  );
};

export default GreetingSectionsContainer;
