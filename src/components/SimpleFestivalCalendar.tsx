import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import OptimizedImage from './OptimizedImage';

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

// Poster data structures
interface DatePoster {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
}

interface DatePosters {
  [date: string]: DatePoster[];
}

// Festival data with correct dates from Google Calendar 2025
const festivalDays: FestivalDays = {
  // January 2025
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
  
  // February 2025
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
  
  // March 2025
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
  
  // April 2025
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
  
  // May 2025
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
  
  // June 2025
  '2025-06-21': {
    name: 'International Yoga Day',
    emoji: '🧘',
    description: 'Celebration of yoga and wellness',
    color: '#FFB6C1',
  },
  '2025-06-29': {
    name: 'Guru Purnima',
    emoji: '👨‍🏫',
    description: 'Honoring spiritual teachers',
    color: '#DDA0DD',
  },
  
  // July 2025
  '2025-07-04': {
    name: 'Independence Day (US)',
    emoji: '🇺🇸',
    description: 'American Independence Day',
    color: '#FF6B6B',
  },
  '2025-07-13': {
    name: 'Guru Purnima',
    emoji: '👨‍🏫',
    description: 'Honoring spiritual teachers',
    color: '#DDA0DD',
  },
  
  // August 2025
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
  
  // September 2025
  '2025-09-07': {
    name: 'Ganesh Chaturthi',
    emoji: '🐘',
    description: 'Birth of Lord Ganesha',
    color: '#FF8C00',
  },
  '2025-09-17': {
    name: 'Ganesh Visarjan',
    emoji: '🌊',
    description: 'Immersion of Lord Ganesha',
    color: '#4ECDC4',
  },
  
  // October 2025
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
  
  // November 2025
  '2025-11-01': {
    name: 'Kartik Purnima',
    emoji: '🌕',
    description: 'Sacred full moon celebration',
    color: '#6BCF7F',
  },
  '2025-11-27': {
    name: 'Thanksgiving',
    emoji: '🦃',
    description: 'Day of gratitude and feasting',
    color: '#8B4513',
  },
  
  // December 2025
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

// Mock poster data for demonstration
const datePosters: DatePosters = {
  '2025-01-01': [
    {
      id: '1',
      title: 'New Year Celebration',
      thumbnail: 'https://picsum.photos/300/400?random=1',
      category: 'New Year',
45,
    },
    {
      id: '2',
      title: 'Happy New Year 2025',
      thumbnail: 'https://picsum.photos/300/400?random=2',
      category: 'Celebration',
32,
    },
  ],
  '2025-01-14': [
    {
      id: '3',
      title: 'Makar Sankranti Wishes',
      thumbnail: 'https://picsum.photos/300/400?random=3',
      category: 'Festival',
28,
    },
  ],
  '2025-01-26': [
    {
      id: '4',
      title: 'Republic Day Pride',
      thumbnail: 'https://picsum.photos/300/400?random=4',
      category: 'National',
67,
    },
    {
      id: '5',
      title: 'Jai Hind',
      thumbnail: 'https://picsum.photos/300/400?random=5',
      category: 'Patriotic',
41,
    },
  ],
  '2025-03-02': [
    {
      id: '6',
      title: 'Holi Colors',
      thumbnail: 'https://picsum.photos/300/400?random=6',
      category: 'Festival',
89,
    },
    {
      id: '7',
      title: 'Festival of Colors',
      thumbnail: 'https://picsum.photos/300/400?random=7',
      category: 'Holi',
56,
    },
  ],
  '2025-10-20': [
    {
      id: '8',
      title: 'Diwali Lights',
      thumbnail: 'https://picsum.photos/300/400?random=8',
      category: 'Festival',
92,
    },
    {
      id: '9',
      title: 'Festival of Lights',
      thumbnail: 'https://picsum.photos/300/400?random=9',
      category: 'Diwali',
78,
    },
  ],
  '2025-12-25': [
    {
      id: '10',
      title: 'Merry Christmas',
      thumbnail: 'https://picsum.photos/300/400?random=10',
      category: 'Christmas',
85,
    },
  ],
};

// Custom animated gradient border component for festival dates
const AnimatedGradientBorder: React.FC<{ 
  children: React.ReactNode; 
  festivalColor: string;
  isSelected: boolean;
  isCurrentDay: boolean;
  dynamicStyles: any;
}> = ({ children, festivalColor, isSelected, isCurrentDay, dynamicStyles }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 4000, // Slower, more elegant animation
          useNativeDriver: false,
        })
      ).start();
    };

    startAnimation();
  }, [animatedValue]);

  // Create professional gradient animation with sophisticated colors
  const gradientColors = animatedValue.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [
      '#667eea', // Professional Blue
      '#764ba2', // Deep Purple
      '#f093fb', // Soft Pink
      '#f5576c', // Coral Red
      '#4facfe', // Sky Blue
      '#667eea'  // Back to Professional Blue
    ],
    extrapolate: 'clamp',
  });

  return (
    <View style={dynamicStyles.movingBorderContainer}>
      {/* Outer glow effect */}
      <Animated.View
        style={[
          dynamicStyles.outerGlow,
          {
            borderColor: gradientColors,
            shadowColor: gradientColors,
            shadowOpacity: 0.3,
          },
        ]}
      />
      {/* Main border */}
      <Animated.View
        style={[
          dynamicStyles.gradientBorder,
          {
            borderColor: gradientColors,
            borderWidth: isSelected ? 3 : 2.5,
            shadowColor: gradientColors,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: 6,
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const SimpleFestivalCalendar: React.FC = () => {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedFestival, setSelectedFestival] = useState<FestivalData | null>(null);
  const [selectedDatePosters, setSelectedDatePosters] = useState<DatePoster[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Get current screen dimensions
  const { width: currentScreenWidth, height: currentScreenHeight } = Dimensions.get('window');

  // Enhanced responsive design helpers with more granular breakpoints
  const isUltraSmallScreen = currentScreenWidth < 360;
  const isSmallScreen = currentScreenWidth >= 360 && currentScreenWidth < 375;
  const isMediumScreen = currentScreenWidth >= 375 && currentScreenWidth < 414;
  const isLargeScreen = currentScreenWidth >= 414 && currentScreenWidth < 480;
  const isXLargeScreen = currentScreenWidth >= 480;

  // Orientation detection
  const isPortrait = currentScreenHeight > currentScreenWidth;
  const isLandscape = currentScreenWidth > currentScreenHeight;

  // Device type detection
  const isTablet = Math.min(currentScreenWidth, currentScreenHeight) >= 768;
  const isPhone = !isTablet;

  // Enhanced responsive spacing and sizing system
  const responsiveSpacing = {
    xs: isUltraSmallScreen ? 2 : isSmallScreen ? 4 : isMediumScreen ? 6 : isLargeScreen ? 8 : 10,
    sm: isUltraSmallScreen ? 4 : isSmallScreen ? 6 : isMediumScreen ? 8 : isLargeScreen ? 10 : 12,
    md: isUltraSmallScreen ? 6 : isSmallScreen ? 8 : isMediumScreen ? 10 : isLargeScreen ? 12 : 14,
    lg: isUltraSmallScreen ? 8 : isSmallScreen ? 10 : isMediumScreen ? 12 : isLargeScreen ? 14 : 16,
    xl: isUltraSmallScreen ? 10 : isSmallScreen ? 12 : isMediumScreen ? 14 : isLargeScreen ? 16 : 18,
    xxl: isUltraSmallScreen ? 12 : isSmallScreen ? 14 : isMediumScreen ? 16 : isLargeScreen ? 18 : 20,
    xxxl: isUltraSmallScreen ? 14 : isSmallScreen ? 16 : isMediumScreen ? 18 : isLargeScreen ? 20 : 24,
  };

  const responsiveFontSize = {
    xs: isUltraSmallScreen ? 8 : isSmallScreen ? 9 : isMediumScreen ? 10 : isLargeScreen ? 11 : 12,
    sm: isUltraSmallScreen ? 9 : isSmallScreen ? 10 : isMediumScreen ? 11 : isLargeScreen ? 12 : 13,
    md: isUltraSmallScreen ? 10 : isSmallScreen ? 11 : isMediumScreen ? 12 : isLargeScreen ? 13 : 14,
    lg: isUltraSmallScreen ? 11 : isSmallScreen ? 12 : isMediumScreen ? 13 : isLargeScreen ? 14 : 15,
    xl: isUltraSmallScreen ? 12 : isSmallScreen ? 13 : isMediumScreen ? 14 : isLargeScreen ? 15 : 16,
    xxl: isUltraSmallScreen ? 13 : isSmallScreen ? 14 : isMediumScreen ? 15 : isLargeScreen ? 16 : 17,
    xxxl: isUltraSmallScreen ? 14 : isSmallScreen ? 15 : isMediumScreen ? 16 : isLargeScreen ? 17 : 18,
    xxxxl: isUltraSmallScreen ? 15 : isSmallScreen ? 16 : isMediumScreen ? 17 : isLargeScreen ? 18 : 20,
    xxxxxl: isUltraSmallScreen ? 16 : isSmallScreen ? 17 : isMediumScreen ? 18 : isLargeScreen ? 19 : 22,
  };

  // Create styles with current screen dimensions
  const dynamicStyles = StyleSheet.create({
    container: {
      // Match HomeScreen section styling - transparent background
    },
    header: {
      marginBottom: currentScreenHeight * 0.02,
    },
    sectionTitle: {
      fontSize: currentScreenWidth < 480 ? 14 : currentScreenWidth < 768 ? 16 : Math.min(currentScreenWidth * 0.045, 18),
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: currentScreenWidth < 480 ? 6 : currentScreenWidth < 768 ? 8 : currentScreenHeight * 0.015,
      paddingHorizontal: currentScreenWidth < 480 ? 16 : currentScreenWidth < 768 ? 20 : 24,
    },
    subtitle: {
      fontSize: Math.min(currentScreenWidth * 0.04, 16),
      color: '#ffffff',
      textAlign: 'center',
      opacity: 0.8,
      marginBottom: currentScreenHeight * 0.01,
    },
    calendarContainer: {
      marginBottom: currentScreenHeight * 0.02,
      paddingHorizontal: currentScreenWidth < 480 ? 8 : currentScreenWidth < 768 ? 12 : currentScreenWidth * 0.05,
    },
    horizontalCalendarScroll: {
      maxHeight: isTablet ? 120 : 100,
    },
    horizontalCalendarContainer: {
      paddingHorizontal: currentScreenWidth * 0.02,
      alignItems: 'center',
    },
    horizontalDayCell: {
      width: isTablet ? 70 : 60,
      height: isTablet ? 90 : 80,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: isTablet ? 14 : 12,
      marginHorizontal: isTablet ? 6 : 4,
      position: 'relative',
      paddingVertical: isTablet ? 10 : 8,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    movingBorderContainer: {
      position: 'relative',
      width: isTablet ? 70 : 60,
      height: isTablet ? 90 : 80,
      marginHorizontal: isTablet ? 6 : 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    outerGlow: {
      position: 'absolute',
      width: isTablet ? 76 : 66,
      height: isTablet ? 96 : 86,
      borderRadius: isTablet ? 17 : 15,
      borderWidth: 1,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 12,
      elevation: 8,
      zIndex: 1,
    },
    gradientBorder: {
      width: isTablet ? 70 : 60,
      height: isTablet ? 90 : 80,
      borderRadius: isTablet ? 14 : 12,
      borderWidth: 2.5,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
      zIndex: 2,
    },
    dayNameText: {
      fontSize: Math.min(currentScreenWidth * 0.03, 12),
      fontWeight: '500',
      marginBottom: 2,
      color: '#ffffff',
      opacity: 0.8,
    },
    horizontalDayText: {
      fontSize: Math.min(currentScreenWidth * 0.04, 16),
      fontWeight: '600',
      color: '#ffffff',
    },
    festivalDot: {
      position: 'absolute',
      bottom: 2,
      width: isTablet ? 8 : 6,
      height: isTablet ? 8 : 6,
      borderRadius: isTablet ? 4 : 3,
    },
    infoContainer: {
      borderRadius: isTablet ? 16 : 12,
      padding: currentScreenWidth * 0.04,
      marginBottom: currentScreenHeight * 0.02,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      marginHorizontal: currentScreenWidth < 480 ? 8 : currentScreenWidth < 768 ? 12 : currentScreenWidth * 0.05,
    },
    selectedDateText: {
      fontSize: Math.min(currentScreenWidth * 0.045, 18),
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: currentScreenHeight * 0.015,
      color: '#ffffff',
    },
    festivalInfo: {
      alignItems: 'center',
    },
    festivalEmojiContainer: {
      marginBottom: currentScreenHeight * 0.01,
    },
    festivalEmoji: {
      fontSize: currentScreenWidth * 0.12,
    },
    festivalDetails: {
      alignItems: 'center',
    },
    festivalName: {
      fontSize: Math.min(currentScreenWidth * 0.05, 20),
      fontWeight: 'bold',
      marginBottom: currentScreenHeight * 0.005,
      textAlign: 'center',
      color: '#ffffff',
    },
    festivalDescription: {
      fontSize: Math.min(currentScreenWidth * 0.035, 14),
      textAlign: 'center',
      lineHeight: Math.min(currentScreenWidth * 0.05, 20),
      color: '#ffffff',
      opacity: 0.8,
    },
    noFestivalContainer: {
      alignItems: 'center',
      paddingVertical: currentScreenHeight * 0.02,
    },
    noFestivalText: {
      fontSize: Math.min(currentScreenWidth * 0.045, 18),
      fontWeight: '600',
      marginBottom: currentScreenHeight * 0.005,
      color: '#ffffff',
    },
    noFestivalSubtext: {
      fontSize: Math.min(currentScreenWidth * 0.035, 14),
      textAlign: 'center',
      color: '#ffffff',
      opacity: 0.8,
    },
    // Poster section styles
    postersSection: {
      marginTop: currentScreenHeight * 0.02,
      paddingHorizontal: currentScreenWidth < 480 ? 8 : currentScreenWidth < 768 ? 12 : currentScreenWidth * 0.05,
    },
    postersHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsiveSpacing.md,
    },
    postersSectionTitle: {
      fontSize: responsiveFontSize.lg,
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: 0.5,
    },
    postersCount: {
      fontSize: responsiveFontSize.sm,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '500',
    },
    postersList: {
      paddingVertical: responsiveSpacing.sm,
    },
    postersFlatList: {
      maxHeight: isTablet ? 250 : 200,
    },
    posterCard: {
      width: isTablet ? 140 : 120,
      height: isTablet ? 180 : 160,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: isTablet ? 16 : 12,
      marginRight: responsiveSpacing.md,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    posterImage: {
      width: '100%',
      height: '70%',
      resizeMode: 'cover',
    },
    posterOverlay: {
      position: 'absolute',
      top: responsiveSpacing.sm,
      right: responsiveSpacing.sm,
    },
    posterLikeButton: {
      width: isTablet ? 32 : 28,
      height: isTablet ? 32 : 28,
      borderRadius: isTablet ? 16 : 14,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    posterInfo: {
      padding: responsiveSpacing.sm,
      height: '30%',
      justifyContent: 'space-between',
    },
    posterTitle: {
      fontSize: responsiveFontSize.sm,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 2,
    },
    posterCategory: {
      fontSize: responsiveFontSize.xs,
      color: 'rgba(255,255,255,0.7)',
      marginBottom: responsiveSpacing.xs,
    },
    posterStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    posterLikes: {
      fontSize: responsiveFontSize.xs,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '500',
    },
  });

  // Get month name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Debug: Log current month and year
  console.log(`📅 Calendar showing: ${monthNames[currentMonth]} ${currentYear}`);

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Handle date selection
  const handleDateSelect = useCallback((day: number) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateString);
    
    // Check if selected date has a festival
    const festival = festivalDays[dateString];
    setSelectedFestival(festival || null);
    
    // Get posters for the selected date
    const posters = datePosters[dateString] || [];
    setSelectedDatePosters(posters);
  }, [currentMonth, currentYear]);

  // Render poster card
  const renderPosterCard = useCallback(({ item }: { item: DatePoster }) => (
    <TouchableOpacity
      style={dynamicStyles.posterCard}
      activeOpacity={0.8}
    >
      <OptimizedImage 
        uri={getHighQualityThumbnailUrl(item.thumbnail)} 
        style={dynamicStyles.posterImage} 
        resizeMode="cover" 
      />
      <View style={dynamicStyles.posterInfo}>
        <Text style={dynamicStyles.posterTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={dynamicStyles.posterCategory} numberOfLines={1}>
          {item.category}
        </Text>
      </View>
    </TouchableOpacity>
  ), [dynamicStyles, isTablet]);

  // Check if date is today
  const isToday = useCallback((day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  }, [currentMonth, currentYear]);

  // Check if date has festival
  const hasFestival = useCallback((day: number) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const festival = festivalDays[dateString];
    if (festival) {
      console.log(`🎉 Festival found for ${dateString}:`, festival.name);
    }
    return festival;
  }, [currentMonth, currentYear]);

  // Auto-scroll to today's date on component mount
  useEffect(() => {
    const today = new Date().getDate();
    const scrollToToday = () => {
      if (scrollViewRef.current) {
        const itemWidth = isTablet ? 82 : 68; // width + margin
        const scrollPosition = (today - 1) * itemWidth - currentScreenWidth / 2 + itemWidth / 2;
        scrollViewRef.current.scrollTo({
          x: Math.max(0, scrollPosition),
          animated: true,
        });
      }
    };
    
    // Delay to ensure the component is fully rendered
    setTimeout(scrollToToday, 100);
  }, [currentScreenWidth, isTablet]);

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.sectionTitle}>
          Festival Calendar
        </Text>
        <Text style={dynamicStyles.subtitle}>
          {monthNames[currentMonth]} {currentYear}
        </Text>
      </View>

      {/* Horizontal Scrollable Calendar */}
      <View style={dynamicStyles.calendarContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.horizontalCalendarContainer}
          style={dynamicStyles.horizontalCalendarScroll}
        >
          {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
            const isSelected = selectedDate === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isCurrentDay = isToday(day);
            const festival = hasFestival(day);
            const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            return (
              <View key={day}>
                {festival ? (
                  <AnimatedGradientBorder
                    festivalColor={festival.color}
                    isSelected={isSelected}
                    isCurrentDay={isCurrentDay}
                    dynamicStyles={dynamicStyles}
                  >
                    <TouchableOpacity
                      style={[
                        dynamicStyles.horizontalDayCell,
                        isSelected && { backgroundColor: '#007AFF' },
                        isCurrentDay && !isSelected && { backgroundColor: 'rgba(0, 122, 255, 0.2)' },
                      ]}
                      onPress={() => handleDateSelect(day)}
                    >
                      <Text style={dynamicStyles.dayNameText}>
                        {dayNames[dayOfWeek]}
                      </Text>
                      <Text
                        style={[
                          dynamicStyles.horizontalDayText,
                          isSelected && { color: '#FFFFFF', fontWeight: 'bold' },
                          isCurrentDay && !isSelected && { color: '#FFD700', fontWeight: 'bold' },
                          { fontWeight: 'bold' },
                        ]}
                      >
                        {day}
                      </Text>
                      <View style={[dynamicStyles.festivalDot, { backgroundColor: festival.color }]} />
                    </TouchableOpacity>
                  </AnimatedGradientBorder>
                ) : (
                  <TouchableOpacity
                    style={[
                      dynamicStyles.horizontalDayCell,
                      isSelected && { backgroundColor: '#007AFF' },
                      isCurrentDay && !isSelected && { backgroundColor: 'rgba(0, 122, 255, 0.2)' },
                    ]}
                    onPress={() => handleDateSelect(day)}
                  >
                    <Text style={dynamicStyles.dayNameText}>
                      {dayNames[dayOfWeek]}
                    </Text>
                    <Text
                      style={[
                        dynamicStyles.horizontalDayText,
                        isSelected && { color: '#FFFFFF', fontWeight: 'bold' },
                        isCurrentDay && !isSelected && { color: '#FFD700', fontWeight: 'bold' },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Selected Date Information */}
      {selectedDate && (
        <View style={dynamicStyles.infoContainer}>
          <Text style={dynamicStyles.selectedDateText}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          {selectedFestival ? (
            <View style={dynamicStyles.festivalInfo}>
              <View style={dynamicStyles.festivalEmojiContainer}>
                <Text style={dynamicStyles.festivalEmoji}>{selectedFestival.emoji}</Text>
              </View>
              <View style={dynamicStyles.festivalDetails}>
                <Text style={dynamicStyles.festivalName}>
                  {selectedFestival.name}
                </Text>
                <Text style={dynamicStyles.festivalDescription}>
                  {selectedFestival.description}
                </Text>
              </View>
            </View>
          ) : (
            <View style={dynamicStyles.noFestivalContainer}>
              <Text style={dynamicStyles.noFestivalText}>
                No festival today 🎉
              </Text>
              <Text style={dynamicStyles.noFestivalSubtext}>
                Enjoy a peaceful day!
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Horizontal Scrollable Posters Section */}
      {selectedDate && selectedDatePosters.length > 0 && (
        <View style={dynamicStyles.postersSection}>
          <View style={dynamicStyles.postersHeader}>
            <Text style={dynamicStyles.postersSectionTitle}>
              Posters for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <Text style={dynamicStyles.postersCount}>
              {selectedDatePosters.length} poster{selectedDatePosters.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <FlatList
            data={selectedDatePosters}
            renderItem={renderPosterCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={dynamicStyles.postersList}
            style={dynamicStyles.postersFlatList}
          />
        </View>
      )}

    </View>
  );
};

export default SimpleFestivalCalendar;
