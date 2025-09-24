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

const { width: screenWidth } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isTablet = screenWidth >= 768;

// Calculate proper card width with even spacing
export const getCardDimensions = () => {
  const padding = 16; // Total horizontal padding for FlatList
  const gap = 8; // Gap between cards
  
  // Always use 3 columns for consistent layout
  const columns = 3;
  
  const totalGap = (columns - 1) * gap;
  const availableWidth = screenWidth - (padding * 2) - totalGap;
  const cardWidth = Math.floor(availableWidth / columns);
  const cardHeight = cardWidth * 1.3;
  
  return { cardWidth, cardHeight, columns };
};

const { cardWidth, cardHeight } = getCardDimensions();

interface GreetingTemplateCardProps {
  template: GreetingTemplate;
  onPress: (template: GreetingTemplate) => void;
  onLike: (templateId: string) => void;
}

const GreetingTemplateCard: React.FC<GreetingTemplateCardProps> = ({
  template,
  onPress,
  onLike,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isLiked, setIsLiked] = useState(template.isLiked);
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

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(template.id);
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
            borderWidth: isDarkMode ? 1.5 : 1,
            shadowOpacity: isDarkMode ? 0.4 : 0.1,
            shadowRadius: isDarkMode ? 12 : 8,
            elevation: isDarkMode ? 8 : 6,
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
           <Icon name="star" size={10} color="#FFD700" />
           <Text style={styles.premiumText}>Premium</Text>
         </View>
      )}

      {/* Template Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: template.thumbnail }}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        />
      </View>

             {/* Like Button */}
       <TouchableOpacity
         style={[
           styles.likeButton,
           styles.likeButtonBackground,
           isLiked && styles.likeButtonActive
         ]}
         onPress={handleLike}
         activeOpacity={0.8}
       >
         <Icon
           name={isLiked ? 'favorite' : 'favorite-border'}
           size={14}
           color={isLiked ? '#FFFFFF' : '#E74C3C'}
         />
       </TouchableOpacity>
     </TouchableOpacity>
   </Animated.View>
    );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardHeight,
    marginBottom: isSmallScreen ? 8 : 12,
    position: 'relative',
  },
  gradientBorderContainer: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: isSmallScreen ? 10 : 14,
    zIndex: 1,
  },
  gradientBorder: {
    flex: 1,
    borderRadius: isSmallScreen ? 10 : 14,
    padding: 2,
  },
  card: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: isSmallScreen ? 8 : 12,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    zIndex: 2,
  },
  premiumBadge: {
    position: 'absolute',
    top: isSmallScreen ? 4 : 6,
    right: isSmallScreen ? 4 : 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: isSmallScreen ? 4 : 6,
    paddingVertical: isSmallScreen ? 2 : 3,
    borderRadius: isSmallScreen ? 8 : 10,
    zIndex: 1,
  },
  premiumText: {
    color: '#FFD700',
    fontSize: isSmallScreen ? 8 : 9,
    fontWeight: '600',
    marginLeft: 2,
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
    height: isSmallScreen ? 50 : 60,
  },
  likeButton: {
    position: 'absolute',
    top: isSmallScreen ? 6 : 8,
    right: isSmallScreen ? 6 : 8,
    width: isSmallScreen ? 28 : 32,
    height: isSmallScreen ? 28 : 32,
    borderRadius: isSmallScreen ? 14 : 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  likeButtonBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  likeButtonActive: {
    backgroundColor: '#E74C3C',
  },

});

export default GreetingTemplateCard;
