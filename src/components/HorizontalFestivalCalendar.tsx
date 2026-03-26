import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useBusinessProfile } from '../context/BusinessProfileContext';
import OptimizedImage from './OptimizedImage';
import { Template } from '../services/dashboard';
import calendarApi from '../services/calendarApi';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/AppNavigator';

// Festival data structure
interface FestivalData {
  name: string;
  emoji: string;
  description: string;
  color: string;
}

interface FestivalDays {
  [date: string]: FestivalData;
}

interface DatePosters {
  [date: string]: Template[];
}

interface PosterWithDate extends Template {
  dateString: string;
  date: Date;
}

// Festival data with correct dates from Google Calendar 2025
const festivalDays: FestivalDays = {
  '2025-01-01': {
    name: 'New Year\'s Day',
    emoji: '🎊',
    description: 'Welcome the new year with celebration',
    color: '#FF6B6B',
  },
  '2025-01-14': {
    name: 'Makar Sankranti',
    emoji: '🪁',
    description: 'Harvest festival and kite flying',
    color: '#45B7D1',
  },
  '2025-01-26': {
    name: 'Republic Day',
    emoji: '🇮🇳',
    description: 'Celebrating India\'s constitution',
    color: '#FFD93D',
  },
  '2025-02-14': {
    name: 'Valentine\'s Day',
    emoji: '💕',
    description: 'Day of love and romance',
    color: '#FF9FF3',
  },
  '2025-02-18': {
    name: 'Maha Shivaratri',
    emoji: '🕉️',
    description: 'Great night of Lord Shiva',
    color: '#6BCF7F',
  },
  '2025-03-01': {
    name: 'Holi Dahan',
    emoji: '🔥',
    description: 'Bonfire celebration before Holi',
    color: '#FF8C00',
  },
  '2025-03-02': {
    name: 'Holi',
    emoji: '🎨',
    description: 'Festival of colors and joy',
    color: '#FF6B9D',
  },
  '2025-03-30': {
    name: 'Ram Navami',
    emoji: '🕉️',
    description: 'Birth of Lord Rama',
    color: '#4ECDC4',
  },
  '2025-04-13': {
    name: 'Baisakhi',
    emoji: '🌾',
    description: 'Spring harvest festival',
    color: '#96CEB4',
  },
  '2025-04-14': {
    name: 'Ambedkar Jayanti',
    emoji: '📚',
    description: 'Birth anniversary of Dr. B.R. Ambedkar',
    color: '#9370DB',
  },
  '2025-05-01': {
    name: 'Labour Day',
    emoji: '👷',
    description: 'International Workers\' Day',
    color: '#FF6B6B',
  },
  '2025-05-12': {
    name: 'Eid al-Fitr',
    emoji: '🌙',
    description: 'Festival of breaking the fast',
    color: '#A8E6CF',
  },
  '2025-05-13': {
    name: 'Buddha Purnima',
    emoji: '🧘',
    description: 'Birth of Lord Buddha',
    color: '#FFB6C1',
  },
  '2025-06-21': {
    name: 'International Yoga Day',
    emoji: '🧘',
    description: 'Celebration of yoga and wellness',
    color: '#FFB6C1',
  },
  '2025-08-15': {
    name: 'Independence Day',
    emoji: '🇮🇳',
    description: 'India\'s Independence Day',
    color: '#FFD93D',
  },
  '2025-08-26': {
    name: 'Raksha Bandhan',
    emoji: '🎀',
    description: 'Bond of protection between siblings',
    color: '#FF69B4',
  },
  '2025-08-30': {
    name: 'Janmashtami',
    emoji: '🕉️',
    description: 'Birth of Lord Krishna',
    color: '#9370DB',
  },
  '2025-09-07': {
    name: 'Ganesh Chaturthi',
    emoji: '🐘',
    description: 'Birth of Lord Ganesha',
    color: '#FF8C00',
  },
  '2025-10-02': {
    name: 'Gandhi Jayanti',
    emoji: '🕊️',
    description: 'Birth anniversary of Mahatma Gandhi',
    color: '#32CD32',
  },
  '2025-10-03': {
    name: 'Navratri Starts',
    emoji: '🕉️',
    description: 'Nine nights of dance, devotion, and celebration',
    color: '#FF6B6B',
  },
  '2025-10-12': {
    name: 'Dussehra',
    emoji: '⚔️',
    description: 'Victory of good over evil',
    color: '#FF8C00',
  },
  '2025-10-20': {
    name: 'Diwali',
    emoji: '🪔',
    description: 'Festival of lights and prosperity',
    color: '#FFD93D',
  },
  '2025-10-21': {
    name: 'Govardhan Puja',
    emoji: '🏔️',
    description: 'Worship of Govardhan Hill',
    color: '#6BCF7F',
  },
  '2025-10-22': {
    name: 'Bhai Dooj',
    emoji: '👫',
    description: 'Brother-sister bond celebration',
    color: '#FF9FF3',
  },
  '2025-12-25': {
    name: 'Christmas',
    emoji: '🎄',
    description: 'Celebration of joy and giving',
    color: '#4ECDC4',
  },
  '2025-12-31': {
    name: 'New Year\'s Eve',
    emoji: '🎊',
    description: 'Ring in the new year',
    color: '#FF6B6B',
  },
};

// Mock poster data - in production, this would come from an API
const datePosters: DatePosters = {
  '2025-01-01': [
    {
      id: '1',
      name: 'New Year Celebration',
      thumbnail: 'https://picsum.photos/300/400?random=1',
      category: 'New Year',
      downloads: 0,
      isDownloaded: false,
      tags: [],
    },
    {
      id: '2',
      name: 'Happy New Year 2025',
      thumbnail: 'https://picsum.photos/300/400?random=2',
      category: 'Celebration',
      downloads: 0,
      isDownloaded: false,
      tags: [],
    },
  ],
  '2025-01-14': [
    {
      id: '3',
      name: 'Makar Sankranti Wishes',
      thumbnail: 'https://picsum.photos/300/400?random=3',
      category: 'Festival',
      downloads: 0,
      isDownloaded: false,
      tags: [],
    },
  ],
  '2025-01-26': [
    {
      id: '4',
      name: 'Republic Day Pride',
      thumbnail: 'https://picsum.photos/300/400?random=4',
      category: 'National',
      downloads: 0,
      isDownloaded: false,
      tags: [],
    },
  ],
  '2025-03-02': [
    {
      id: '6',
      name: 'Holi Colors',
      thumbnail: 'https://picsum.photos/300/400?random=6',
      category: 'Festival',
      downloads: 0,
      isDownloaded: false,
      tags: [],
    },
  ],
  '2025-10-20': [
    {
      id: '8',
      name: 'Diwali Lights',
      thumbnail: 'https://picsum.photos/300/400?random=8',
      category: 'Festival',
      downloads: 0,
      isDownloaded: false,
      tags: [],
    },
  ],
  '2025-12-25': [
    {
      id: '10',
      name: 'Merry Christmas',
      thumbnail: 'https://picsum.photos/300/400?random=10',
      category: 'Christmas',
      downloads: 0,
      isDownloaded: false,
      tags: [],
    },
  ],
};

// Get screen dimensions and helper functions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

const getGeneralCategoryCardWidth = () => {
  if (SCREEN_WIDTH >= 768) {
    return SCREEN_WIDTH * 0.15;
  }
  if (SCREEN_WIDTH >= 600) {
    return SCREEN_WIDTH * 0.22;
  }
  if (SCREEN_WIDTH >= 400) {
    return SCREEN_WIDTH * 0.28;
  }
  return SCREEN_WIDTH * 0.32;
};

const moderateScale = (size: number, factor = 0.5) => {
  const scale = (s: number) => (SCREEN_WIDTH / 375) * s;
  return size + (scale(size) - size) * factor;
};

// Helper function to enhance thumbnail URL for high quality
const getHighQualityThumbnailUrl = (thumbnailUrl: string): string => {
  if (!thumbnailUrl) return thumbnailUrl;
  
  // For Cloudinary URLs, enhance to high quality
  if (thumbnailUrl.includes('res.cloudinary.com') && thumbnailUrl.includes('/upload/')) {
    try {
      const [prefix, remainder] = thumbnailUrl.split('/upload/');
      if (!remainder) {
        return thumbnailUrl;
      }
      
      const parts = remainder.split('/');
      
      // Find the version number (starts with 'v' followed by digits)
      let versionIndex = -1;
      for (let i = 0; i < parts.length; i++) {
        if (/^v\d+/.test(parts[i])) {
          versionIndex = i;
          break;
        }
      }
      
      if (versionIndex >= 0) {
        // Extract everything from version onwards
        const versionAndPath = parts.slice(versionIndex).join('/');
        
        // Use ultra high quality transform for thumbnails (w_1200 for HD displays)
        const highQualityTransform = 'f_auto,q_auto:best,c_limit,w_1200,dpr_2.0';
        const highQualityUrl = `${prefix}/upload/${highQualityTransform}/${versionAndPath}`;
        
        return highQualityUrl;
      }
    } catch (error) {
      // Fall through to return original URL
    }
  }
  
  return thumbnailUrl;
};

interface HorizontalFestivalCalendarProps {
  refreshKey?: number;
}

const HorizontalFestivalCalendar: React.FC<HorizontalFestivalCalendarProps> = ({ refreshKey = 0 }) => {
  const { theme } = useTheme();
  const { selectedBusinessProfile } = useBusinessProfile();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDatePosters, setSelectedDatePosters] = useState<Template[]>([]);
  const [isViewMoreModalVisible, setIsViewMoreModalVisible] = useState(false);
  const [allPostersWithDates, setAllPostersWithDates] = useState<PosterWithDate[]>([]);
  const [isLoadingAllPosters, setIsLoadingAllPosters] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const borderAnimation = useRef(new Animated.Value(0)).current;
  const festiveAlertScale = useRef(new Animated.Value(1)).current;
  const festiveAlertOpacity = useRef(new Animated.Value(1)).current;
  const festiveAlertTranslateY = useRef(new Animated.Value(0)).current;

  const gradientColors = [theme.colors.secondary, theme.colors.primary];
  const borderThickness = 2.5;
  const borderInset = borderThickness + 1.2;

  const rotation = borderAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(borderAnimation, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    borderAnimation.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [borderAnimation]);

  // Enhanced attractive animation for "Festive alerts" text
  // Combines scale bounce, opacity pulse, and vertical bounce (all use native driver for performance)
  useEffect(() => {
    // Create a combined parallel animation for smoother effect
    const combinedAnimation = Animated.loop(
      Animated.parallel([
        // Scale bounce animation
        Animated.sequence([
          Animated.spring(festiveAlertScale, {
            toValue: 1.2,
            tension: 40,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(festiveAlertScale, {
            toValue: 1,
            tension: 40,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.delay(400),
        ]),
        // Opacity pulse animation
        Animated.sequence([
          Animated.timing(festiveAlertOpacity, {
            toValue: 0.6,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(festiveAlertOpacity, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(300),
        ]),
        // Vertical bounce animation
        Animated.sequence([
          Animated.spring(festiveAlertTranslateY, {
            toValue: -4,
            tension: 120,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(festiveAlertTranslateY, {
            toValue: 0,
            tension: 120,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.delay(200),
        ]),
      ])
    );

    combinedAnimation.start();

    return () => {
      combinedAnimation.stop();
    };
  }, [festiveAlertScale, festiveAlertOpacity, festiveAlertTranslateY]);

  // Use state for current date so it updates automatically
  const [currentDateState, setCurrentDateState] = useState(() => new Date());
  const autoSelectRef = useRef<string | null>(null);
  const generalCategoryCardWidth = useMemo(() => getGeneralCategoryCardWidth(), []);
  
  // Generate dates from today to 15 days forward
  const upcomingDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    const dates: Date[] = [];
    for (let i = 0; i <= 15; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDateState]);

  const formatDateKey = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }, []);

  // Update current date periodically to handle month changes
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setCurrentDateState(now);
    };

    // Update immediately
    updateDate();

    // Check every hour if the date has changed (handles day/month changes)
    const interval = setInterval(() => {
      updateDate();
    }, 3600000); // Check every hour (3600000ms)

    return () => clearInterval(interval);
  }, []);

  // Handle date selection
  const handleDateSelect = useCallback(async (date: Date) => {
    const dateString = formatDateKey(date);
    let resolvedPosters: Template[] = [];
    
    // Fetch posters from API (force refresh if refreshKey > 0)
    try {
      const forceRefresh = refreshKey > 0;
      const response = await calendarApi.getPostersByDate(dateString, forceRefresh);
      if (response.success && response.data.posters.length > 0) {
        // Convert CalendarPoster to Template format
        const templates: Template[] = response.data.posters.map((poster) => ({
          id: poster.id,
          name: poster.name || poster.title || 'Calendar Poster',
          thumbnail: poster.thumbnail,
          category: poster.category || 'Festival',
          downloads: poster.downloads || 0,
          isDownloaded: poster.isDownloaded || false,
          tags: poster.tags || [],
        }));
        resolvedPosters = templates;
      } else if (response.success && response.data.posters.length === 0) {
        // API returned successfully but no posters - use empty array (don't show mock data)
        resolvedPosters = [];
      }
    } catch (error) {
      console.error('❌ [CALENDAR] Error fetching calendar posters:', error);
      // Only use mock data if API actually fails (not if it returns empty)
      // For production, we should not show mock data when API fails
      // const mockPosters = datePosters[dateString] || [];
      // if (mockPosters.length > 0) {
      //   resolvedPosters = mockPosters;
      // }
      resolvedPosters = [];
    }
    
    setSelectedDate(dateString);
    setSelectedDatePosters(resolvedPosters);
  }, [formatDateKey, refreshKey]);

  // Check if date is today
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  }, []);

  // Check if date has festival
  const hasFestival = useCallback((date: Date) => {
    const dateString = formatDateKey(date);
    return festivalDays[dateString];
  }, [formatDateKey]);

  // Auto-scroll to today's date on component mount
  useEffect(() => {
    const scrollToToday = () => {
      if (scrollViewRef.current) {
        const itemWidth = isTablet ? 76 : 65;
        // Today is always the first item (index 0)
        const scrollPosition = 0 * itemWidth - SCREEN_WIDTH / 2 + itemWidth / 2;
        scrollViewRef.current.scrollTo({
          x: Math.max(0, scrollPosition),
          animated: true,
        });
      }
    };
    
    setTimeout(scrollToToday, 100);
  }, [SCREEN_WIDTH, isTablet]);

  // Pre-load posters for upcoming dates (optional - improves performance)
  // Also refresh when refreshKey changes (parent refresh)
  useEffect(() => {
    const loadUpcomingPosters = async (forceRefresh: boolean = false) => {
      try {
        // Pre-load posters for all upcoming dates
        const loadPromises = upcomingDates.map(async (date) => {
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          try {
            await calendarApi.getPostersByDate(dateString, forceRefresh);
          } catch (error) {
            // Silently fail for individual dates
          }
        });
        await Promise.allSettled(loadPromises);
      } catch (error) {
        // Silently fail - this is just a performance optimization
        if (__DEV__) {
          console.log('⚠️ [CALENDAR] Could not pre-load upcoming posters (this is okay)');
        }
      }
    };
    
    // If refreshKey changed, force refresh; otherwise normal pre-load
    const forceRefresh = refreshKey > 0;
    loadUpcomingPosters(forceRefresh);
    
    // If refreshKey changed, also refresh the currently selected date
    if (forceRefresh) {
      if (selectedDate) {
        // Parse the selected date string and refresh it
        const [year, month, day] = selectedDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        // Use setTimeout to ensure cache is cleared first
        setTimeout(() => {
          handleDateSelect(date);
        }, 100);
      } else {
        // If no date is selected, select today's date to show refreshed data
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setTimeout(() => {
          handleDateSelect(today);
        }, 100);
      }
    }
  }, [upcomingDates, refreshKey, selectedDate, handleDateSelect]);

  useEffect(() => {
    if (upcomingDates.length === 0) {
      return;
    }
    const todayDate = upcomingDates[0];
    const todayKey = formatDateKey(todayDate);
    if (autoSelectRef.current === todayKey) {
      return;
    }
    autoSelectRef.current = todayKey;
    handleDateSelect(todayDate);
  }, [upcomingDates, handleDateSelect, formatDateKey]);

  const handlePosterPress = useCallback(async (poster: Template, dateString: string) => {
    // Use global business profile for consistent branding
    navigation.navigate('PosterPlayer', {
      selectedPoster: poster,
      relatedPosters: selectedDatePosters.filter(p => p.id !== poster.id),
      calendarDate: dateString,
      originScreen: 'Calendar',
      selectedBusinessProfile: selectedBusinessProfile,
      selectedBusinessProfileId: selectedBusinessProfile?.id,
      businessCategory: selectedBusinessProfile?.category,
    });
  }, [navigation, selectedDatePosters, selectedBusinessProfile]);

  const renderPosterCard = useCallback(({ item }: { item: Template }) => {
    return (
      <TouchableOpacity
        style={[
          styles.posterCard,
          { width: generalCategoryCardWidth, height: generalCategoryCardWidth },
        ]}
        onPress={() => handlePosterPress(item, selectedDate)}
        activeOpacity={0.8}
      >
        <OptimizedImage 
          uri={getHighQualityThumbnailUrl(item.thumbnail)} 
          style={styles.posterImage} 
          resizeMode="cover" 
        />
      </TouchableOpacity>
    );
  }, [generalCategoryCardWidth, handlePosterPress, selectedDate]);

  // Format date as "1 Nov"
  const formatDateShort = useCallback((date: Date) => {
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    return `${day} ${month}`;
  }, []);

  // Fetch all posters from all dates
  const fetchAllPosters = useCallback(async () => {
    setIsLoadingAllPosters(true);
    try {
      const allPosters: PosterWithDate[] = [];
      
      // Fetch posters for all upcoming dates
      const fetchPromises = upcomingDates.map(async (date) => {
        const dateString = formatDateKey(date);
        try {
          const response = await calendarApi.getPostersByDate(dateString, false);
          if (response.success && response.data.posters.length > 0) {
            const templates: PosterWithDate[] = response.data.posters.map((poster) => ({
              id: poster.id,
              name: poster.name || poster.title || 'Calendar Poster',
              thumbnail: poster.thumbnail,
              category: poster.category || 'Festival',
              downloads: poster.downloads || 0,
              isDownloaded: poster.isDownloaded || false,
              tags: poster.tags || [],
              dateString: dateString,
              date: date,
            }));
            allPosters.push(...templates);
          }
          // If API returns successfully but no posters, don't add anything (don't show mock data)
        } catch (error) {
          // Silently fail for individual dates - don't show mock data on API errors
          // For production, we should not show mock data when API fails
        }
      });
      
      await Promise.allSettled(fetchPromises);
      setAllPostersWithDates(allPosters);
    } catch (error) {
      console.error('❌ [CALENDAR] Error fetching all posters:', error);
    } finally {
      setIsLoadingAllPosters(false);
    }
  }, [upcomingDates, formatDateKey]);

  // Handle view more button press
  const handleViewMore = useCallback(() => {
    fetchAllPosters();
    setIsViewMoreModalVisible(true);
  }, [fetchAllPosters]);

  // Render poster card for modal (2 columns)
  const renderModalPosterCard = useCallback(({ item }: { item: PosterWithDate }) => {
    const modalWidth = SCREEN_WIDTH * 0.95;
    const maxModalWidth = 600;
    const actualModalWidth = Math.min(modalWidth, maxModalWidth);
    const padding = moderateScale(24); // 12 padding on each side
    const gap = moderateScale(8); // Gap between cards
    const cardWidth = (actualModalWidth - padding - gap) / 2;
    const highQualityThumbnail = getHighQualityThumbnailUrl(item.thumbnail);
    
    return (
      <TouchableOpacity
        style={[
          styles.modalPosterCard,
          { 
            width: cardWidth,
            marginBottom: moderateScale(12),
          },
        ]}
        onPress={() => {
          setIsViewMoreModalVisible(false);
          handlePosterPress(item, item.dateString);
        }}
        activeOpacity={0.8}
      >
        <OptimizedImage 
          uri={highQualityThumbnail} 
          style={styles.modalPosterImage} 
          resizeMode="cover"
          mode="thumbnail"
        />
        <View style={styles.modalPosterDateContainer}>
          <Text style={[styles.modalPosterDateText, { color: theme.colors.text }]}>
            {formatDateShort(item.date)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handlePosterPress, formatDateShort, theme]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <TouchableOpacity
          onPress={handleViewMore}
          activeOpacity={0.7}
        >
          <Animated.View
            style={{
              transform: [
                { scale: festiveAlertScale },
                { translateY: festiveAlertTranslateY }
              ],
              opacity: festiveAlertOpacity,
            }}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: moderateScale(12),
                paddingVertical: moderateScale(6),
                borderRadius: moderateScale(20),
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text 
                style={[
                  styles.sectionTitle, 
                  { 
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    textAlign: 'center',
                  }
                ]}
              >
                Festive alerts
              </Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Horizontal Scrollable Calendar */}
      <View style={styles.calendarContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarScrollContent}
        >
          {upcomingDates.map((date) => {
            const day = date.getDate();
            const dateString = formatDateKey(date);
            const isSelected = selectedDate === dateString;
            const isCurrentDay = isToday(date);
            const festival = hasFestival(date);
            const dayOfWeek = date.getDay();

            const dayCellStyles = [
              styles.dayCell,
              { backgroundColor: theme.colors.cardBackground },
            ];

            if (isCurrentDay) {
              dayCellStyles.push(styles.currentDayCell);
            }

            if (isSelected) {
              dayCellStyles.push(isCurrentDay ? styles.selectedCurrentDayCell : styles.selectedDayCell);
            }

            const dayContent = (
              <View
                style={dayCellStyles}
              >
                <Text style={[styles.dayNameText, { color: theme.colors.textSecondary }]}>
                  {dayNames[dayOfWeek]}
                </Text>
                <Text
                  style={[
                    styles.dayNumberText,
                    { color: theme.colors.text },
                    isSelected && { color: theme.colors.primary, fontWeight: 'bold' },
                    isCurrentDay && !isSelected && { color: theme.colors.primary },
                  ]}
                >
                  {day}
                </Text>
                {festival && (
                  <View style={[styles.festivalDot, { backgroundColor: festival.color }]} />
                )}
              </View>
            );

            return (
              <TouchableOpacity
                key={dateString}
                onPress={() => handleDateSelect(date)}
                activeOpacity={0.7}
                style={styles.dayTouchable}
              >
                {isCurrentDay ? (
                  <View style={styles.gradientBorderWrapper}>
                    <Animated.View
                      style={[
                        styles.runningBorderOverlay,
                        {
                          transform: [{ rotate: rotation }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={[
                          gradientColors[0],
                          '#ffffff',
                          gradientColors[1],
                          'rgba(255,255,255,0.6)',
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBorderFill}
                      />
                    </Animated.View>
                    <View
                      style={[
                        styles.gradientBorderInner,
                        {
                          backgroundColor: theme.colors.cardBackground,
                          top: borderInset,
                          bottom: borderInset,
                          left: borderInset,
                          right: borderInset,
                        },
                      ]}
                    >
                      {dayContent}
                    </View>
                  </View>
                ) : (
                  dayContent
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Selected Date Posters Section */}
      {selectedDate && selectedDatePosters.length > 0 && (
        <View style={styles.postersSection}>
          <FlatList
            data={selectedDatePosters}
            renderItem={renderPosterCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.postersList}
          />
        </View>
      )}

      {/* View More Modal */}
      <Modal
        visible={isViewMoreModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsViewMoreModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#f5f5f5', '#ffffff']}
              style={styles.modalGradient}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>
                    All Festive Alert Posters
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsViewMoreModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Modal Content */}
            <View style={styles.modalBody}>
              {isLoadingAllPosters ? (
                <View style={styles.modalLoadingContainer}>
                  <Text style={[styles.modalLoadingText, { color: theme.colors.textSecondary }]}>
                    Loading posters...
                  </Text>
                </View>
              ) : allPostersWithDates.length > 0 ? (
                <FlatList
                  data={allPostersWithDates}
                  renderItem={renderModalPosterCard}
                  keyExtractor={(item) => `${item.id}-${item.dateString}`}
                  numColumns={2}
                  columnWrapperStyle={styles.modalRow}
                  contentContainerStyle={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.modalEmptyContainer}>
                  <Text style={[styles.modalEmptyText, { color: theme.colors.textSecondary }]}>
                    No posters available
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(15),
    paddingHorizontal: moderateScale(8),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    paddingHorizontal: moderateScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  calendarContainer: {
    marginBottom: moderateScale(10),
  },
  calendarScrollContent: {
    paddingHorizontal: moderateScale(3),
  },
  dayTouchable: {
    marginRight: moderateScale(4),
  },
  dayCell: {
    width: isTablet ? 66 : 55,
    height: isTablet ? 66 : 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: isTablet ? 33 : 28,
    paddingVertical: moderateScale(6),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  currentDayCell: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  dayCellFill: {
    width: '100%',
    height: '100%',
  },
  selectedDayCell: {
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  selectedCurrentDayCell: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  dayNameText: {
    fontSize: moderateScale(9),
    fontWeight: '500',
    marginBottom: moderateScale(2),
  },
  dayNumberText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  festivalDot: {
    position: 'absolute',
    bottom: moderateScale(4),
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  gradientBorderWrapper: {
    width: isTablet ? 66 : 55,
    height: isTablet ? 66 : 55,
    borderRadius: isTablet ? 33 : 28,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradientBorderInner: {
    position: 'absolute',
    borderRadius: isTablet ? 33 : 28,
    overflow: 'hidden',
  },
  runningBorderOverlay: {
    position: 'absolute',
    width: isTablet ? 66 : 55,
    height: isTablet ? 66 : 55,
    borderRadius: isTablet ? 33 : 28,
    overflow: 'hidden',
  },
  gradientBorderFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: isTablet ? 33 : 28,
  },
  postersSection: {
    marginTop: moderateScale(10),
    paddingHorizontal: moderateScale(3),
  },
  postersList: {
    paddingVertical: moderateScale(5),
  },
  posterCard: {
    marginRight: moderateScale(3),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(8),
  },
  viewMoreButton: {
    paddingHorizontal: moderateScale(2),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  viewMoreButtonGradient: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: moderateScale(2),
  },
  viewMoreButtonText: {
    fontSize: SCREEN_WIDTH < 360 ? moderateScale(10) : moderateScale(9),
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH >= 768 ? SCREEN_WIDTH * 0.90 : SCREEN_WIDTH * 0.96,
    maxWidth: SCREEN_WIDTH >= 768 ? 900 : SCREEN_WIDTH * 0.96,
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(8),
    },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(12),
    elevation: 10,
  },
  modalGradient: {
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(4),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: moderateScale(6),
  },
  modalTitle: {
    fontSize: SCREEN_WIDTH >= 768 ? moderateScale(15) : moderateScale(13),
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 0,
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 2,
  },
  modalCloseButton: {
    width: SCREEN_WIDTH >= 768 ? moderateScale(28) : moderateScale(26),
    height: SCREEN_WIDTH >= 768 ? moderateScale(28) : moderateScale(26),
    borderRadius: SCREEN_WIDTH >= 768 ? moderateScale(14) : moderateScale(13),
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalCloseButtonText: {
    fontSize: SCREEN_WIDTH >= 768 ? moderateScale(15) : moderateScale(14),
    color: '#333333',
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalContent: {
    paddingHorizontal: 0,
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(12),
  },
  modalRow: {
    justifyContent: 'flex-start',
    marginBottom: moderateScale(6),
    paddingLeft: moderateScale(8),
    paddingRight: moderateScale(8),
  },
  modalPosterCard: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  modalPosterImage: {
    width: '100%',
    aspectRatio: SCREEN_WIDTH >= 768 ? 1 : 0.9,
    borderRadius: moderateScale(8),
  },
  modalPosterDateContainer: {
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  modalPosterDateText: {
    fontSize: moderateScale(11),
    fontWeight: '500',
    color: '#666666',
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  modalLoadingText: {
    fontSize: moderateScale(14),
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  modalEmptyText: {
    fontSize: moderateScale(14),
  },
});

export default HorizontalFestivalCalendar;

