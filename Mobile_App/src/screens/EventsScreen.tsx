import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

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

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: 'active' | 'upcoming' | 'planning' | 'completed';
  attendees: number;
  maxAttendees: number;
  imageUrl: string;
  category: string;
  description: string;
}

const EventsScreen: React.FC = React.memo(() => {
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Memoized mock data
  const mockEvents: Event[] = useMemo(() => [
    {
      id: '1',
      title: 'Tech Conference 2024',
      date: 'Dec 15, 2024',
      time: '9:00 AM - 5:00 PM',
      location: 'Convention Center, Downtown',
      status: 'active',
      attendees: 150,
      maxAttendees: 200,
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
      category: 'Technology',
      description: 'Join us for the biggest tech conference of the year featuring industry leaders and innovative solutions.',
    },
    {
      id: '2',
      title: 'Marketing Workshop',
      date: 'Dec 20, 2024',
      time: '2:00 PM - 6:00 PM',
      location: 'Business Hub, Midtown',
      status: 'upcoming',
      attendees: 75,
      maxAttendees: 100,
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=200&fit=crop',
      category: 'Marketing',
      description: 'Learn advanced marketing strategies and techniques from expert practitioners.',
    },
    {
      id: '3',
      title: 'Product Launch Event',
      date: 'Dec 25, 2024',
      time: '7:00 PM - 10:00 PM',
      location: 'Grand Hotel Ballroom',
      status: 'planning',
      attendees: 0,
      maxAttendees: 300,
      imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=200&fit=crop',
      category: 'Product',
      description: 'Exclusive launch event for our revolutionary new product line.',
    },
    {
      id: '4',
      title: 'Networking Mixer',
      date: 'Dec 10, 2024',
      time: '6:00 PM - 9:00 PM',
      location: 'Rooftop Lounge, Downtown',
      status: 'completed',
      attendees: 120,
      maxAttendees: 150,
      imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=200&fit=crop',
      category: 'Networking',
      description: 'Professional networking event for entrepreneurs and business leaders.',
    },
    {
      id: '5',
      title: 'Design Workshop',
      date: 'Dec 28, 2024',
      time: '10:00 AM - 4:00 PM',
      location: 'Creative Studio, Arts District',
      status: 'upcoming',
      attendees: 45,
      maxAttendees: 60,
      imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=200&fit=crop',
      category: 'Design',
      description: 'Hands-on design workshop covering UI/UX principles and modern design trends.',
    },
  ], []);

  const filters = [
    { id: 'all', label: 'All Events', icon: 'event' },
    { id: 'active', label: 'Active', icon: 'play-circle' },
    { id: 'upcoming', label: 'Upcoming', icon: 'schedule' },
    { id: 'planning', label: 'Planning', icon: 'edit' },
    { id: 'completed', label: 'Completed', icon: 'check-circle' },
  ];

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Use mock data immediately for better performance
      setEvents(mockEvents);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [mockEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'upcoming':
        return '#2196F3';
      case 'planning':
        return '#FF9800';
      case 'completed':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'upcoming':
        return 'UPCOMING';
      case 'planning':
        return 'PLANNING';
      case 'completed':
        return 'COMPLETED';
      default:
        return status.toUpperCase();
    }
  };

  const filteredEvents = events.filter(event => 
    selectedFilter === 'all' || event.status === selectedFilter
  );

  const renderFilterChip = useCallback(({ item }: { item: typeof filters[0] }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        {
          backgroundColor: selectedFilter === item.id 
            ? theme.colors.cardBackground 
            : 'rgba(255,255,255,0.2)',
        }
      ]}
      onPress={() => setSelectedFilter(item.id)}
    >
      <Icon 
        name={item.icon as any} 
        size={16} 
        color={selectedFilter === item.id ? theme.colors.primary : '#ffffff'} 
      />
      <Text style={[
        styles.filterChipText,
        { color: selectedFilter === item.id ? theme.colors.primary : '#ffffff' }
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  ), [selectedFilter, theme]);

  const renderEventCard = useCallback(({ item }: { item: Event }) => {
    const scaleAnim = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    };

    const attendancePercentage = (item.attendees / item.maxAttendees) * 100;

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.eventCardWrapper}
      >
        <Animated.View 
          style={[
            styles.eventCard,
            { 
              backgroundColor: theme.colors.cardBackground,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <View style={styles.eventImageContainer}>
            <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.eventImageOverlay}
            />
            <View style={styles.eventStatusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
              </View>
            </View>
            <View style={styles.eventCategoryContainer}>
              <Text style={styles.eventCategory}>{item.category}</Text>
            </View>
          </View>
          
          <View style={styles.eventContent}>
            <Text style={[styles.eventTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            
            <Text style={[styles.eventDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
            
            <View style={styles.eventDetails}>
              <View style={styles.eventDetail}>
                <Icon name="event" size={16} color={theme.colors.primary} />
                <Text style={[styles.eventDetailText, { color: theme.colors.textSecondary }]}>
                  {item.date}
                </Text>
              </View>
              
              <View style={styles.eventDetail}>
                <Icon name="access-time" size={16} color={theme.colors.primary} />
                <Text style={[styles.eventDetailText, { color: theme.colors.textSecondary }]}>
                  {item.time}
                </Text>
              </View>
              
              <View style={styles.eventDetail}>
                <Icon name="location-on" size={16} color={theme.colors.primary} />
                <Text style={[styles.eventDetailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            </View>
            
            <View style={styles.eventAttendance}>
              <View style={styles.attendanceInfo}>
                <Text style={[styles.attendanceText, { color: theme.colors.textSecondary }]}>
                  {item.attendees}/{item.maxAttendees} attendees
                </Text>
                <Text style={[styles.attendancePercentage, { color: theme.colors.primary }]}>
                  {Math.round(attendancePercentage)}%
                </Text>
              </View>
              <View style={styles.attendanceBar}>
                <View 
                  style={[
                    styles.attendanceProgress, 
                    { 
                      width: `${attendancePercentage}%`,
                      backgroundColor: theme.colors.primary 
                    }
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.eventActions}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>VIEW DETAILS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.cardBackground, borderWidth: 1, borderColor: theme.colors.border }]}>
                <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>EDIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }, [theme]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={theme.colors.gradient}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
        <View style={[styles.header, { paddingTop: insets.top + responsiveSpacing.sm }]}>
          <View style={styles.headerTop}>
            <View style={styles.greeting}>
              <Text style={styles.greetingText}>Events Management</Text>
              <Text style={styles.userName}>Manage Your Events</Text>
            </View>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Icon name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          nestedScrollEnabled={true}
        >
          {/* Filters */}
          <View style={styles.filtersSection}>
            <FlatList
              data={filters}
              renderItem={renderFilterChip}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersList}
              nestedScrollEnabled={true}
            />
          </View>

          {/* Events List */}
          <View style={styles.eventsSection}>
            <Text style={styles.sectionTitle}>
              {selectedFilter === 'all' ? 'All Events' : filters.find(f => f.id === selectedFilter)?.label}
              {' '}({filteredEvents.length})
            </Text>
            <FlatList
              data={filteredEvents}
              renderItem={renderEventCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.eventsList}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
});

EventsScreen.displayName = 'EventsScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
  header: {
    paddingTop: 0,
    paddingHorizontal: screenWidth * 0.05,
    paddingBottom: screenHeight * 0.02,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    color: '#ffffff',
    opacity: 0.8,
  },
  userName: {
    fontSize: Math.min(screenWidth * 0.06, 24),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  filtersSection: {
    marginBottom: screenHeight * 0.02,
  },
  filtersList: {
    paddingHorizontal: screenWidth * 0.05,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.008,
    borderRadius: 20,
    marginRight: screenWidth * 0.02,
  },
  filterChipText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: '500',
    marginLeft: 6,
  },
  eventsSection: {
    paddingBottom: screenHeight * 0.05,
  },
  sectionTitle: {
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
  },
  eventsList: {
    paddingHorizontal: screenWidth * 0.05,
  },
  eventCardWrapper: {
    marginBottom: screenHeight * 0.02,
  },
  eventCard: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  eventImageContainer: {
    height: screenHeight * 0.15,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  eventStatusContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: Math.min(screenWidth * 0.025, 10),
    fontWeight: '600',
  },
  eventCategoryContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  eventCategory: {
    color: '#ffffff',
    fontSize: Math.min(screenWidth * 0.03, 12),
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventContent: {
    padding: screenWidth * 0.04,
  },
  eventTitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: 'bold',
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    marginBottom: screenHeight * 0.015,
    lineHeight: 20,
  },
  eventDetails: {
    marginBottom: screenHeight * 0.015,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventDetailText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    marginLeft: 8,
    flex: 1,
  },
  eventAttendance: {
    marginBottom: screenHeight * 0.015,
  },
  attendanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  attendanceText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
  },
  attendancePercentage: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: '600',
  },
  attendanceBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
  },
  attendanceProgress: {
    height: '100%',
    borderRadius: 2,
  },
  eventActions: {
    flexDirection: 'row',
    gap: screenWidth * 0.02,
  },
  actionButton: {
    flex: 1,
    paddingVertical: screenHeight * 0.012,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: '600',
  },
});

export default EventsScreen; 