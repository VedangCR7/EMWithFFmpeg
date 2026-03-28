import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { GreetingTemplate } from '../services/greetingTemplates';
import { useTheme } from '../context/ThemeContext';
import OptimizedImage from './OptimizedImage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers (matching HomeScreen)
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isTablet = screenWidth >= 768;

// Responsive helper functions (matching HomeScreen)
const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive value getter (matching HomeScreen)
const getResponsiveValue = (small: number, medium: number, large: number) => {
  if (screenWidth < 400) return small;
  if (screenWidth < 768) return medium;
  return large;
};

// Calculate proper card width for grid with equal spacing (matching HomeScreen style)
export const getCardDimensions = () => {
  // Determine visible cards based on screen size
  // Larger screens: max 6 cards visible
  // Smaller screens: min 3 cards visible
  const visibleCards = getResponsiveValue(3, 4, 6); // 3 for small, 4 for medium, 6 for large/tablet
  
  // Horizontal padding for the entire row
  const horizontalPadding = moderateScale(8);
  
  // Gap between cards
  const cardGap = moderateScale(3);
  
  // Calculate available width (total screen width minus padding and gaps)
  const totalGaps = (visibleCards - 1) * cardGap;
  const availableWidth = screenWidth - (horizontalPadding * 2) - totalGaps;
  
  // Calculate card width to fit evenly
  const cardWidth = Math.floor(availableWidth / visibleCards);
  
  // Make cards square by setting height equal to width (like HomeScreen)
  const cardHeight = cardWidth;
  
  return { cardWidth, cardHeight, visibleCards, cardGap };
};

const { cardWidth, cardHeight } = getCardDimensions();

interface GreetingTemplateCardProps {
  template: GreetingTemplate;
  onPress: (template: GreetingTemplate) => void;
}

const GreetingTemplateCard: React.FC<GreetingTemplateCardProps> = React.memo(({
  template,
  onPress,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [scaleValue] = useState(() => new Animated.Value(1));
  const [_isHovered, setIsHovered] = useState(false);
  const gradientBorderOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start();
    
    // Handle hover effect for dark mode
    if (isDarkMode) {
      setIsHovered(true);
      Animated.timing(gradientBorderOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
    
    // Handle hover effect for dark mode - delay the fade out
    if (isDarkMode) {
      // Keep the border visible for a moment after press out
      setTimeout(() => {
        setIsHovered(false);
        Animated.timing(gradientBorderOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }).start();
      }, 100);
    }
  };

  const handlePress = () => {
    // Always call the parent's onPress function - let the parent handle premium logic
    onPress(template);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      {/* Gradient Border Container - Only visible in dark mode on hover */}
      {isDarkMode && (
        <Animated.View
          style={[
            styles.gradientBorderContainer,
            {
              opacity: gradientBorderOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['#FFD700', '#FF69B4', '#4169E1']} // Yellow to Pink to Blue
            style={styles.gradientBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}

      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.cardBackground,
            shadowColor: theme.colors.shadow,
            borderColor: theme.colors.border,
            borderWidth: 0.5, // Thinner border for compact look
            shadowOpacity: isDarkMode ? 0.15 : 0.08, // Lighter shadows
            shadowRadius: isDarkMode ? 4 : 2, // Smaller shadow radius
            elevation: isDarkMode ? 3 : 2, // Lower elevation
          }
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
      {/* Premium Badge */}
      {template.isPremium && (
                 <View style={styles.premiumBadge}>
           <Icon name="star" size={moderateScale(8)} color="#FFD700" />
           <Text style={styles.premiumText}>Premium</Text>
         </View>
      )}

      {/* Template Image */}
      <View style={styles.imageContainer}>
        <OptimizedImage
          uri={template.thumbnail}
          style={styles.image}
          resizeMode="cover"
          showLoader={true}
          loaderColor={theme.colors.primary}
          loaderSize="small"
          mode="thumbnail"
          cacheKey={`greeting_card_${template.id}`}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
          pointerEvents="none"
        />
      </View>
     </TouchableOpacity>
   </Animated.View>
    );
}, (prevProps, nextProps) => {
  // Only re-render if template ID or premium status changes
  return prevProps.template.id === nextProps.template.id &&
         prevProps.template.thumbnail === nextProps.template.thumbnail &&
         prevProps.template.isPremium === nextProps.template.isPremium;
});

GreetingTemplateCard.displayName = 'GreetingTemplateCard';

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardHeight,
    marginBottom: moderateScale(4), // Spacing between rows
    position: 'relative',
  },
  gradientBorderContainer: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: moderateScale(8),
    zIndex: 1,
  },
  gradientBorder: {
    flex: 1,
    borderRadius: moderateScale(8),
    padding: 1,
  },
  card: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: moderateScale(8), // Compact border radius
    overflow: 'hidden',
    borderWidth: 0.5, // Thinner border
    position: 'relative',
    zIndex: 2,
  },
  premiumBadge: {
    position: 'absolute',
    top: moderateScale(4), // Compact positioning
    right: moderateScale(4),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: moderateScale(4), // Compact padding
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    zIndex: 3,
  },
  premiumText: {
    color: '#FFD700',
    fontSize: moderateScale(7), // Smaller text
    fontWeight: '600',
    marginLeft: moderateScale(2),
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: moderateScale(30), // Much smaller overlay
  },
});

export default GreetingTemplateCard;
