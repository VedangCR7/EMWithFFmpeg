import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
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

// Compact spacing multiplier to reduce all spacing (matching HomeScreen)
const COMPACT_MULTIPLIER = 0.5;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

// Responsive helper functions (matching HomeScreen)
const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive spacing and sizing (Compact - reduced by 50%)
const responsiveSpacing = {
  xs: moderateScale(isSmallScreen ? 4 : isMediumScreen ? 6 : 8),
  sm: moderateScale(isSmallScreen ? 6 : isMediumScreen ? 8 : 10),
  md: moderateScale(isSmallScreen ? 8 : isMediumScreen ? 10 : 12),
  lg: moderateScale(isSmallScreen ? 10 : isMediumScreen ? 12 : 16),
  xl: moderateScale(isSmallScreen ? 12 : isMediumScreen ? 16 : 20),
};

const responsiveFontSize = {
  xs: moderateScale(isSmallScreen ? 7 : isMediumScreen ? 8 : 9),
  sm: moderateScale(isSmallScreen ? 8 : isMediumScreen ? 9 : 10),
  md: moderateScale(isSmallScreen ? 9 : isMediumScreen ? 10 : 11),
  lg: moderateScale(isSmallScreen ? 10 : isMediumScreen ? 11 : 12),
  xl: moderateScale(isSmallScreen ? 11 : isMediumScreen ? 12 : 13),
  xxl: moderateScale(isSmallScreen ? 12 : isMediumScreen ? 13 : 14),
  xxxl: moderateScale(isSmallScreen ? 14 : isMediumScreen ? 16 : 18),
};

type FilterType = 'all' | 'success' | 'failed' | 'pending';

const TransactionHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { transactions, transactionStats, refreshTransactions } = useSubscription();
  const { theme, isDarkMode } = useTheme();
  
  // Dynamic dimensions for responsive layout (matching HomeScreen)
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Update dimensions on screen rotation/resize
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const currentScreenWidth = dimensions.width;
  const currentScreenHeight = dimensions.height;
  
  // Dynamic responsive scaling functions
  const dynamicScale = (size: number) => (currentScreenWidth / 375) * size;
  const dynamicVerticalScale = (size: number) => (currentScreenHeight / 667) * size;
  const dynamicModerateScale = (size: number, factor = 0.5) => size + (dynamicScale(size) - size) * factor;
  
  // Responsive icon sizes (compact - 60% of original)
  const getIconSize = (baseSize: number) => {
    return Math.max(10, Math.round(baseSize * (currentScreenWidth / 375) * 0.6));
  };
  
  // Device size detection (matching HomeScreen)
  const isUltraSmallScreen = currentScreenWidth < 350;
  const isSmallScreenDevice = currentScreenWidth < 400;
  const isMediumScreenDevice = currentScreenWidth >= 400 && currentScreenWidth < 768;
  const isTabletDevice = currentScreenWidth >= 768;
  const isLandscapeMode = currentScreenWidth > currentScreenHeight;
  
  // Adaptive grid columns for stats - Always 2 columns, 3 rows
  const getStatsColumns = () => {
    return 2; // 2 columns for all screen sizes (3 rows total)
  };
  
  const statsColumns = getStatsColumns();
  
  // Calculate stat item width based on columns - Fixed for 2 columns
  const getStatItemWidth = () => {
    const horizontalPadding = isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8);
    const containerPadding = isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(12);
    const containerWidth = currentScreenWidth - (horizontalPadding * 2) - (containerPadding * 2);
    const gap = dynamicModerateScale(6);
    // For 2 columns: calculate width to fit exactly 2 items per row
    // Using Math.floor to prevent rounding issues that could break wrapping
    return Math.floor((containerWidth - gap) / 2);
  };
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showStats, setShowStats] = useState(true);

  // Debug logging on mount and when transactions change
  useEffect(() => {
    console.log('🏦 TransactionHistoryScreen - Mounted');
    console.log('🏦 Transactions from context:', transactions.length);
    console.log('🏦 Transactions data:', JSON.stringify(transactions, null, 2));
    console.log('🏦 Stats from context:', transactionStats);
    
    // Auto-refresh transactions on mount
    if (transactions.length === 0) {
      console.log('🔄 No transactions found, triggering refresh...');
      refreshTransactions();
    }
  }, []);

  // Filter transactions based on selected filter
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.status === filter;
  });

  // Handle refresh
  const onRefresh = async () => {
    console.log('================================================================================');
    console.log('🔄🔄🔄 MANUAL REFRESH TRIGGERED BY USER - TRANSACTION HISTORY 🔄🔄🔄');
    console.log('================================================================================');
    console.log('⏰ Refresh Time:', new Date().toISOString());
    setRefreshing(true);
    await refreshTransactions();
    setRefreshing(false);
    console.log('================================================================================');
    console.log('✅✅✅ MANUAL REFRESH COMPLETED - TRANSACTION HISTORY ✅✅✅');
    console.log('================================================================================');
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



  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={[styles.transactionCard, { 
      backgroundColor: theme.colors.cardBackground,
      borderRadius: dynamicModerateScale(12),
      padding: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(12),
      marginBottom: dynamicModerateScale(8),
    }]}>
      <View style={[styles.transactionHeader, {
        marginBottom: dynamicModerateScale(8),
      }]}>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionPlan, { 
            color: theme.colors.text,
            fontSize: isTabletDevice ? dynamicModerateScale(11) : dynamicModerateScale(10),
            marginBottom: dynamicModerateScale(2),
          }]}>
            {item.planName}
          </Text>
          <Text style={[styles.transactionDate, { 
            color: theme.colors.textSecondary,
            fontSize: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(7.5),
          }]}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[styles.amountText, { 
            color: theme.colors.text,
            fontSize: isTabletDevice ? dynamicModerateScale(13) : dynamicModerateScale(12),
            marginBottom: dynamicModerateScale(4),
          }]}>
            ₹{item.amount}
          </Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: getStatusColor(item.status),
            paddingHorizontal: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(6),
            paddingVertical: isTabletDevice ? dynamicModerateScale(3) : dynamicModerateScale(2),
            borderRadius: dynamicModerateScale(8),
            gap: dynamicModerateScale(2),
          }]}>
            <Icon name={getStatusIcon(item.status)} size={isTabletDevice ? getIconSize(14) : getIconSize(12)} color="#ffffff" />
            <Text style={[styles.statusText, {
              fontSize: isTabletDevice ? dynamicModerateScale(6.5) : dynamicModerateScale(6),
            }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.transactionDetails, {
        gap: isTabletDevice ? dynamicModerateScale(5) : dynamicModerateScale(4),
      }]}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { 
            color: theme.colors.textSecondary,
            fontSize: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(7.5),
          }]}>Payment ID:</Text>
          <Text style={[styles.detailValue, { 
            color: theme.colors.text,
            fontSize: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(7.5),
            marginLeft: dynamicModerateScale(6),
          }]}>{item.paymentId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { 
            color: theme.colors.textSecondary,
            fontSize: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(7.5),
          }]}>Order ID:</Text>
          <Text style={[styles.detailValue, { 
            color: theme.colors.text,
            fontSize: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(7.5),
            marginLeft: dynamicModerateScale(6),
          }]}>{item.orderId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { 
            color: theme.colors.textSecondary,
            fontSize: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(7.5),
          }]}>Method:</Text>
          <Text style={[styles.detailValue, { 
            color: theme.colors.text,
            fontSize: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(7.5),
            marginLeft: dynamicModerateScale(6),
          }]}>{item.method}</Text>
        </View>
        {item.metadata?.email && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { 
              color: theme.colors.textSecondary,
              fontSize: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(7.5),
            }]}>Email:</Text>
            <Text style={[styles.detailValue, { 
              color: theme.colors.text,
              fontSize: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(7.5),
              marginLeft: dynamicModerateScale(6),
            }]}>{item.metadata.email}</Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render filter chips
  const renderFilterChips = () => (
    <View style={[styles.filterContainer, {
      paddingHorizontal: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
      marginBottom: dynamicModerateScale(8),
    }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['all', 'success', 'failed', 'pending'] as FilterType[]).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterChip,
              filter === filterType && styles.filterChipActive,
              { 
                backgroundColor: filter === filterType ? '#667eea' : theme.colors.inputBackground,
                paddingHorizontal: isTabletDevice ? dynamicModerateScale(14) : dynamicModerateScale(10),
                paddingVertical: isTabletDevice ? dynamicModerateScale(7) : dynamicModerateScale(5),
                borderRadius: dynamicModerateScale(10),
                marginRight: dynamicModerateScale(6),
              }
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[
              styles.filterChipText,
              { 
                color: filter === filterType ? '#ffffff' : theme.colors.text,
                fontSize: isTabletDevice ? dynamicModerateScale(9) : dynamicModerateScale(8),
              }
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
    <View style={[styles.statsContainer, { 
      backgroundColor: theme.colors.cardBackground,
      marginHorizontal: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
      marginVertical: dynamicModerateScale(8),
      borderRadius: dynamicModerateScale(12),
      padding: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(12),
    }]}>
      <View style={[styles.statsHeader, {
        marginBottom: isTabletDevice ? dynamicModerateScale(10) : dynamicModerateScale(8),
      }]}>
        <Text style={[styles.statsTitle, { 
          color: theme.colors.text,
          fontSize: isTabletDevice ? dynamicModerateScale(11) : dynamicModerateScale(10),
        }]}>Transaction Statistics</Text>
        <TouchableOpacity onPress={() => setShowStats(!showStats)}>
          <Icon 
            name={showStats ? 'expand-less' : 'expand-more'} 
            size={isTabletDevice ? getIconSize(24) : getIconSize(20)} 
            color={theme.colors.text} 
          />
        </TouchableOpacity>
      </View>
      
      {showStats && (
        <View style={[styles.statsGrid, {
          gap: dynamicModerateScale(6),
        }]}>
          <View style={[styles.statItem, { 
            width: getStatItemWidth(),
            backgroundColor: theme.colors.inputBackground,
            padding: isTabletDevice ? dynamicModerateScale(10) : dynamicModerateScale(8),
            borderRadius: dynamicModerateScale(8),
            minHeight: isTabletDevice ? dynamicModerateScale(60) : dynamicModerateScale(55),
            justifyContent: 'center',
          }]}>
            <Text style={[styles.statValue, { 
              color: theme.colors.text,
              fontSize: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(11),
              marginBottom: dynamicModerateScale(2),
            }]}>{transactionStats.total}</Text>
            <Text style={[styles.statLabel, { 
              color: theme.colors.textSecondary,
              fontSize: isTabletDevice ? dynamicModerateScale(7) : dynamicModerateScale(6.5),
            }]}>Total</Text>
          </View>
          <View style={[styles.statItem, { 
            width: getStatItemWidth(),
            backgroundColor: theme.colors.inputBackground,
            padding: isTabletDevice ? dynamicModerateScale(10) : dynamicModerateScale(8),
            borderRadius: dynamicModerateScale(8),
            minHeight: isTabletDevice ? dynamicModerateScale(60) : dynamicModerateScale(55),
            justifyContent: 'center',
          }]}>
            <Text style={[styles.statValue, { 
              color: '#28a745',
              fontSize: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(11),
              marginBottom: dynamicModerateScale(2),
            }]}>{transactionStats.successful}</Text>
            <Text style={[styles.statLabel, { 
              color: theme.colors.textSecondary,
              fontSize: isTabletDevice ? dynamicModerateScale(7) : dynamicModerateScale(6.5),
            }]}>Successful</Text>
          </View>
          <View style={[styles.statItem, { 
            width: getStatItemWidth(),
            backgroundColor: theme.colors.inputBackground,
            padding: isTabletDevice ? dynamicModerateScale(10) : dynamicModerateScale(8),
            borderRadius: dynamicModerateScale(8),
            minHeight: isTabletDevice ? dynamicModerateScale(60) : dynamicModerateScale(55),
            justifyContent: 'center',
          }]}>
            <Text style={[styles.statValue, { 
              color: '#dc3545',
              fontSize: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(11),
              marginBottom: dynamicModerateScale(2),
            }]}>{transactionStats.failed}</Text>
            <Text style={[styles.statLabel, { 
              color: theme.colors.textSecondary,
              fontSize: isTabletDevice ? dynamicModerateScale(7) : dynamicModerateScale(6.5),
            }]}>Failed</Text>
          </View>
          <View style={[styles.statItem, { 
            width: getStatItemWidth(),
            backgroundColor: theme.colors.inputBackground,
            padding: isTabletDevice ? dynamicModerateScale(10) : dynamicModerateScale(8),
            borderRadius: dynamicModerateScale(8),
            minHeight: isTabletDevice ? dynamicModerateScale(60) : dynamicModerateScale(55),
            justifyContent: 'center',
          }]}>
            <Text style={[styles.statValue, { 
              color: '#ffc107',
              fontSize: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(11),
              marginBottom: dynamicModerateScale(2),
            }]}>{transactionStats.pending}</Text>
            <Text style={[styles.statLabel, { 
              color: theme.colors.textSecondary,
              fontSize: isTabletDevice ? dynamicModerateScale(7) : dynamicModerateScale(6.5),
            }]}>Pending</Text>
          </View>
          <View style={[styles.statItem, { 
            width: getStatItemWidth(),
            backgroundColor: theme.colors.inputBackground,
            padding: isTabletDevice ? dynamicModerateScale(10) : dynamicModerateScale(8),
            borderRadius: dynamicModerateScale(8),
            minHeight: isTabletDevice ? dynamicModerateScale(60) : dynamicModerateScale(55),
            justifyContent: 'center',
          }]}>
            <Text style={[styles.statValue, { 
              color: '#667eea',
              fontSize: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(11),
              marginBottom: dynamicModerateScale(2),
            }]}>₹{transactionStats.totalAmount}</Text>
            <Text style={[styles.statLabel, { 
              color: theme.colors.textSecondary,
              fontSize: isTabletDevice ? dynamicModerateScale(7) : dynamicModerateScale(6.5),
            }]}>Total Amount</Text>
          </View>
          <View style={[styles.statItem, { 
            width: getStatItemWidth(),
            backgroundColor: theme.colors.inputBackground,
            padding: isTabletDevice ? dynamicModerateScale(10) : dynamicModerateScale(8),
            borderRadius: dynamicModerateScale(8),
            minHeight: isTabletDevice ? dynamicModerateScale(60) : dynamicModerateScale(55),
            justifyContent: 'center',
          }]}>
            <Text style={[styles.statValue, { 
              color: theme.colors.text,
              fontSize: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(11),
              marginBottom: dynamicModerateScale(2),
            }]}>
              {(transactionStats.quarterlySubscriptions || 0) + (transactionStats.yearlySubscriptions || 0)}
            </Text>
            <Text style={[styles.statLabel, { 
              color: theme.colors.textSecondary,
              fontSize: isTabletDevice ? dynamicModerateScale(7) : dynamicModerateScale(6.5),
            }]}>Active Subscriptions</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent={true}
      />
      
      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient}
        style={[styles.header, { 
          paddingTop: insets.top + (isTabletDevice ? dynamicModerateScale(4) : dynamicModerateScale(2)),
          paddingHorizontal: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
          paddingBottom: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(6),
        }]}
      >
        <TouchableOpacity
          style={[styles.backButton, {
            padding: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(6),
            borderRadius: dynamicModerateScale(10),
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
          }]}
          onPress={() => navigation.goBack()}
        >
          <Icon 
            name="arrow-back" 
            size={isTabletDevice ? getIconSize(20) : getIconSize(18)} 
            color={isDarkMode ? '#ffffff' : '#1a1a1a'} 
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, {
            fontSize: isTabletDevice ? dynamicModerateScale(14) : dynamicModerateScale(12),
            color: isDarkMode ? '#ffffff' : '#1a1a1a',
          }]}>Transaction History</Text>
          <Text style={[styles.headerSubtitle, {
            fontSize: isTabletDevice ? dynamicModerateScale(8.5) : dynamicModerateScale(7.5),
            marginTop: dynamicModerateScale(1),
            color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
          }]}>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, {
            padding: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(6),
            borderRadius: dynamicModerateScale(10),
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
          }]}
          onPress={onRefresh}
        >
          <Icon 
            name="refresh" 
            size={isTabletDevice ? getIconSize(20) : getIconSize(18)} 
            color={isDarkMode ? '#ffffff' : '#1a1a1a'} 
          />
        </TouchableOpacity>
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
        <View style={[styles.transactionsContainer, {
          paddingHorizontal: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
        }]}>
          {filteredTransactions.length === 0 ? (
            <View style={[styles.emptyState, {
              paddingVertical: isTabletDevice ? dynamicModerateScale(80) : dynamicModerateScale(50),
            }]}>
              <Icon 
                name="receipt-long" 
                size={isTabletDevice ? getIconSize(64) : getIconSize(48)} 
                color={theme.colors.textSecondary} 
              />
              <Text style={[styles.emptyStateTitle, { 
                color: theme.colors.text,
                fontSize: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
                marginTop: isTabletDevice ? dynamicModerateScale(14) : dynamicModerateScale(10),
                marginBottom: dynamicModerateScale(4),
              }]}>
                No transactions found
              </Text>
              <Text style={[styles.emptyStateSubtitle, { 
                color: theme.colors.textSecondary,
                fontSize: isTabletDevice ? dynamicModerateScale(9) : dynamicModerateScale(8),
                marginBottom: dynamicModerateScale(12),
                paddingHorizontal: dynamicModerateScale(20),
              }]}>
                {filter === 'all' 
                  ? 'You haven\'t made any transactions yet.' 
                  : `No ${filter} transactions found.`
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.transactionsList, {
                gap: 0, // Already handled in renderTransactionItem
              }]}
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
    borderBottomWidth: 0,
    zIndex: 1000,
    elevation: 10,
  },
  backButton: {
    // backgroundColor is set inline based on theme
  },
  refreshButton: {
    // backgroundColor is set inline based on theme
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    // color is set inline based on theme
  },
  headerSubtitle: {
    // color is set inline based on theme
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.06,
    shadowRadius: moderateScale(4),
    elevation: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsTitle: {
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    // Width calculated dynamically based on columns
  },
  statValue: {
    fontWeight: '700',
  },
  statLabel: {
    textAlign: 'center',
    lineHeight: moderateScale(10),
  },
  filterContainer: {
    // Inline styles used
  },
  filterChip: {
    // Inline styles used
  },
  filterChipActive: {
    backgroundColor: '#667eea',
  },
  filterChipText: {
    fontWeight: '600',
  },
  transactionsContainer: {
    // Inline styles used
  },
  transactionsList: {
    // Inline styles used
  },
  transactionCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.06,
    shadowRadius: moderateScale(4),
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionPlan: {
    fontWeight: '700',
  },
  transactionDate: {
    // Inline styles used
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: '700',
    color: '#ffffff',
  },
  transactionDetails: {
    // Inline styles used
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontWeight: '700',
  },
  emptyStateSubtitle: {
    textAlign: 'center',
  },
});

export default TransactionHistoryScreen;
