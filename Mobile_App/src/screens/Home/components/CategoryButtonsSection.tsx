import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Animated } from 'react-native';

interface CategoryButtonsSectionProps {
  isSearching: boolean;
  searchQuery: string;
  selectedCategory: 'business' | 'general';
  businessCategoryButtonLabel: string;
  greetingCategoryButtonLabel: string;
  businessCategoryFadeAnim: Animated.Value;
  categoryFadeAnim: Animated.Value;
  moderateScale: (size: number) => number;
  handleBusinessButtonPress: () => void;
  onGreetingTemplatesPress: () => void;
  styles: any;
}

const CategoryButtonsSection: React.FC<CategoryButtonsSectionProps> = ({
  isSearching,
  searchQuery,
  selectedCategory,
  businessCategoryButtonLabel,
  greetingCategoryButtonLabel,
  businessCategoryFadeAnim,
  categoryFadeAnim,
  moderateScale,
  handleBusinessButtonPress,
  onGreetingTemplatesPress,
  styles,
}) => {
  if (isSearching || searchQuery.trim() !== '') {
    return null;
  }

  return (
    <View style={styles.categoryButtonsContainer}>
      <TouchableOpacity
        style={[
          styles.categoryButton,
          styles.categoryButtonBusiness,
          selectedCategory === 'business' && styles.categoryButtonActive,
        ]}
        onPress={handleBusinessButtonPress}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={selectedCategory === 'business'
            ? ['#667eea', '#764ba2']
            : ['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.05)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.categoryButtonGradient}
        >
          <View style={styles.categoryButtonContent}>
            <Icon
              name="business"
              size={moderateScale(14)}
              color={selectedCategory === 'business' ? '#ffffff' : '#667eea'}
              style={styles.categoryButtonIcon}
            />
            <Animated.Text style={[
              styles.categoryButtonText,
              styles.categoryButtonTextBusiness,
              {
                color: selectedCategory === 'business' ? '#ffffff' : '#667eea',
                opacity: businessCategoryFadeAnim,
              }
            ]}>
              {businessCategoryButtonLabel}
            </Animated.Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.categoryButton,
          styles.categoryButtonRotating,
          selectedCategory === 'general' && styles.categoryButtonActive,
        ]}
        onPress={onGreetingTemplatesPress}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#f093fb', '#f5576c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.categoryButtonGradient}
        >
          <View style={styles.categoryButtonContent}>
            <Icon
              name="auto-awesome"
              size={moderateScale(14)}
              color="#ffffff"
              style={styles.categoryButtonIcon}
            />
            <Animated.Text
              style={[
                styles.categoryButtonText,
                styles.categoryButtonRotatingText,
                {
                  color: '#ffffff',
                  opacity: categoryFadeAnim,
                  flexShrink: 1,
                  minWidth: 0,
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {greetingCategoryButtonLabel}
            </Animated.Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default CategoryButtonsSection;
