import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
  Platform,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';
import { Transaction } from '../services/transactionHistory';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

// Responsive spacing and sizing
const responsiveSpacing = {
  xs: isSmallScreen ? 8 : isMediumScreen ? 12 : 16,
  sm: isSmallScreen ? 12 : isMediumScreen ? 16 : 20,
  md: isSmallScreen ? 16 : isMediumScreen ? 20 : 24,
  lg: isSmallScreen ? 20 : isMediumScreen ? 24 : 32,
  xl: isSmallScreen ? 24 : isMediumScreen ? 32 : 40,
};

const responsiveFontSize = {
  xs: isSmallScreen ? 10 : isMediumScreen ? 12 : 14,
  sm: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
  md: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
  lg: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
  xl: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  xxl: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
  xxxl: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
};

type FilterType = 'all' | 'success' | 'failed' | 'pending';

const TransactionHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { transactions, transactionStats, refreshTransactions, generateDemoTransactions, clearTransactions } = useSubscription();
  const { theme } = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showStats, setShowStats] = useState(true);

  // Filter transactions based on selected filter
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.status === filter;
  });

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTransactions();
    setRefreshing(false);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return '#28a745';
      case 'failed':
        return '#dc3545';
      case 'pending':
        return '#ffc107';
      case 'cancelled':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  // Get status icon
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return 'check-circle';
      case 'failed':
        return 'error';
      case 'pending':
        return 'schedule';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help';
    }
  };

  // Handle demo data generation
  const handleGenerateDemoData = () => {
    Alert.alert(
      'Generate Demo Data',
      'This will add sample transactions for testing. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: async () => {
            await generateDemoTransactions();
            Alert.alert('Success', 'Demo transactions generated successfully!');
          }
        },
      ]
    );
  };

  // Handle clear transactions
  const handleClearTransactions = () => {
    Alert.alert(
      'Clear All Transactions',
      'This will permanently delete all transaction history. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            await clearTransactions();
            Alert.alert('Success', 'All transactions cleared successfully!');
          }
        },
      ]
    );
  };

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={[styles.transactionCard, { backgroundColor: theme.colors.cardBackground }]}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionPlan, { color: theme.colors.text }]}>
            {item.planName}
          </Text>
          <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[styles.amountText, { color: theme.colors.text }]}>
            ₹{item.amount}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Icon name={getStatusIcon(item.status)} size={16} color="#ffffff" />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Payment ID:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{item.paymentId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Order ID:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{item.orderId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Method:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{item.method}</Text>
        </View>
        {item.metadata?.email && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Email:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{item.metadata.email}</Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render filter chips
  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['all', 'success', 'failed', 'pending'] as FilterType[]).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterChip,
              filter === filterType && styles.filterChipActive,
              { backgroundColor: filter === filterType ? '#667eea' : theme.colors.inputBackground }
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[
              styles.filterChipText,
              { color: filter === filterType ? '#ffffff' : theme.colors.text }
            ]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render statistics
  const renderStats = () => (
    <View style={[styles.statsContainer, { backgroundColor: theme.colors.cardBackground }]}>
      <View style={styles.statsHeader}>
        <Text style={[styles.statsTitle, { color: theme.colors.text }]}>Transaction Statistics</Text>
        <TouchableOpacity onPress={() => setShowStats(!showStats)}>
          <Icon 
            name={showStats ? 'expand-less' : 'expand-more'} 
            size={24} 
            color={theme.colors.text} 
          />
        </TouchableOpacity>
      </View>
      
      {showStats && (
        <View style={styles.statsGrid}>
          <View style={[styles.statItem, { backgroundColor: theme.colors.inputBackground }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{transactionStats.total}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.inputBackground }]}>
            <Text style={[styles.statValue, { color: '#28a745' }]}>{transactionStats.successful}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Successful</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.inputBackground }]}>
            <Text style={[styles.statValue, { color: '#dc3545' }]}>{transactionStats.failed}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Failed</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.inputBackground }]}>
            <Text style={[styles.statValue, { color: '#ffc107' }]}>{transactionStats.pending}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Pending</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.inputBackground }]}>
            <Text style={[styles.statValue, { color: '#667eea' }]}>₹{transactionStats.totalAmount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Amount</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.inputBackground }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {transactionStats.monthlySubscriptions + transactionStats.yearlySubscriptions}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Active Subscriptions</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.header, { paddingTop: insets.top + responsiveSpacing.sm }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <Text style={styles.headerSubtitle}>
            {filteredTransactions.length} transactions found
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleGenerateDemoData}
          >
            <Icon name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleClearTransactions}
          >
            <Icon name="delete" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Section */}
        {renderStats()}

        {/* Filter Chips */}
        {renderFilterChips()}

        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="receipt-long" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
                No transactions found
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textSecondary }]}>
                {filter === 'all' 
                  ? 'You haven\'t made any transactions yet.' 
                  : `No ${filter} transactions found.`
                }
              </Text>
              {filter === 'all' && (
                <TouchableOpacity
                  style={[styles.generateDemoButton, { backgroundColor: '#667eea' }]}
                  onPress={handleGenerateDemoData}
                >
                  <Text style={styles.generateDemoButtonText}>Generate Demo Data</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.transactionsList}
            />
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.md,
    paddingBottom: responsiveSpacing.sm,
    borderBottomWidth: 0,
    zIndex: 1000,
    elevation: 10,
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize.xxl,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: responsiveFontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: responsiveSpacing.xs,
  },
  headerActionButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    margin: responsiveSpacing.md,
    borderRadius: responsiveSpacing.lg,
    padding: responsiveSpacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
  },
  statsTitle: {
    fontSize: responsiveFontSize.lg,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveSpacing.sm,
  },
  statItem: {
    flex: 1,
    minWidth: (screenWidth - (responsiveSpacing.md * 4) - (responsiveSpacing.sm * 2)) / 3,
    alignItems: 'center',
    padding: responsiveSpacing.md,
    borderRadius: responsiveSpacing.md,
  },
  statValue: {
    fontSize: responsiveFontSize.xl,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: responsiveFontSize.xs,
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: responsiveSpacing.md,
    marginBottom: responsiveSpacing.md,
  },
  filterChip: {
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    borderRadius: responsiveSpacing.md,
    marginRight: responsiveSpacing.sm,
  },
  filterChipActive: {
    backgroundColor: '#667eea',
  },
  filterChipText: {
    fontSize: responsiveFontSize.sm,
    fontWeight: '600',
  },
  transactionsContainer: {
    paddingHorizontal: responsiveSpacing.md,
  },
  transactionsList: {
    gap: responsiveSpacing.md,
  },
  transactionCard: {
    borderRadius: responsiveSpacing.lg,
    padding: responsiveSpacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: responsiveSpacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionPlan: {
    fontSize: responsiveFontSize.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: responsiveFontSize.sm,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: responsiveFontSize.xl,
    fontWeight: '700',
    marginBottom: responsiveSpacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: 4,
    borderRadius: responsiveSpacing.sm,
    gap: 4,
  },
  statusText: {
    fontSize: responsiveFontSize.xs,
    fontWeight: '700',
    color: '#ffffff',
  },
  transactionDetails: {
    gap: responsiveSpacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: responsiveFontSize.sm,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: responsiveFontSize.sm,
    flex: 1,
    textAlign: 'right',
    marginLeft: responsiveSpacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: responsiveSpacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: responsiveFontSize.lg,
    fontWeight: '700',
    marginTop: responsiveSpacing.md,
    marginBottom: responsiveSpacing.xs,
  },
  emptyStateSubtitle: {
    fontSize: responsiveFontSize.sm,
    textAlign: 'center',
    marginBottom: responsiveSpacing.lg,
  },
  generateDemoButton: {
    paddingHorizontal: responsiveSpacing.lg,
    paddingVertical: responsiveSpacing.sm,
    borderRadius: responsiveSpacing.md,
  },
  generateDemoButtonText: {
    color: '#ffffff',
    fontSize: responsiveFontSize.sm,
    fontWeight: '600',
  },
});

export default TransactionHistoryScreen;
