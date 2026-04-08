import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import FeedbackModal from '../components/FeedbackModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

// Responsive helper functions
const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive spacing
const responsiveSpacing = {
  xs: isSmallScreen ? 8 : isMediumScreen ? 12 : 16,
  sm: isSmallScreen ? 12 : isMediumScreen ? 16 : 20,
  md: isSmallScreen ? 16 : isMediumScreen ? 20 : 24,
  lg: isSmallScreen ? 20 : isMediumScreen ? 24 : 32,
  xl: isSmallScreen ? 24 : isMediumScreen ? 32 : 40,
};

// Responsive font sizes
const responsiveFontSize = {
  xs: isSmallScreen ? 10 : isMediumScreen ? 12 : 14,
  sm: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
  md: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
  lg: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
  xl: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  xxl: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
  xxxl: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
};

// Feedback categories
const FEEDBACK_CATEGORIES = [
  { label: 'Bug Report', value: 'BUG_REPORT' },
  { label: 'Feature Request', value: 'FEATURE_REQUEST' },
  { label: 'User Experience', value: 'USER_EXPERIENCE' },
  { label: 'General Feedback', value: 'GENERAL_FEEDBACK' },
];

type FeedbackScreenNavigationProp = any;

const FeedbackScreen: React.FC = () => {
  const navigation = useNavigation<FeedbackScreenNavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Form state
  const [rating, setRating] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  
  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalMessage, setModalMessage] = useState<string>('');

  // Helper function to show modal
  const showModalMessage = (type: 'success' | 'error', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  // Validation
  const validateForm = (): boolean => {
    if (rating === 0) {
      showModalMessage('error', 'Rating Required', 'Please tap on the stars to rate your experience');
      return false;
    }
    
    if (!selectedCategory) {
      showModalMessage('error', 'Category Required', 'Please select a category that best describes your feedback');
      return false;
    }
    
    if (!feedbackText.trim()) {
      showModalMessage('error', 'Feedback Required', 'Please share your thoughts in the feedback section');
      return false;
    }
    
    if (feedbackText.length > 2000) {
      showModalMessage('error', 'Too Long', 'Your feedback is a bit lengthy! Please keep it under 2000 characters');
      return false;
    }
    
    return true;
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/api/mobile/feedback', {
        resourceType: 'APP_GENERAL',
        rating,
        feedbackText: feedbackText.trim(),
        feedbackCategory: selectedCategory,
      });
      
      if (response.data.success) {
        showModalMessage('success', 'Thank You!', 'Thank you for your feedback! We appreciate your input.');
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      showModalMessage(
        'error',
        'Submission Failed',
        error.response?.data?.message || error.message || 'Failed to submit feedback. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render star rating
  const renderStarRating = () => {
    return (
      <View style={styles.starRatingContainer}>
        <Text style={[styles.sectionLabel, { color: theme.colors.text, fontSize: responsiveFontSize.md }]}>
          Rate Your Experience
        </Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
              activeOpacity={0.7}
            >
              <Icon
                name={star <= rating ? 'star' : 'star-border'}
                size={scale(32)}
                color={star <= rating ? '#FFD700' : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render category dropdown
  const renderCategoryDropdown = () => {
    const selectedCategoryLabel = FEEDBACK_CATEGORIES.find(cat => cat.value === selectedCategory)?.label || 'Select Category';
    
    return (
      <View style={styles.categoryContainer}>
        <Text style={[styles.sectionLabel, { color: theme.colors.text, fontSize: responsiveFontSize.md }]}>
          Feedback Category
        </Text>
        <TouchableOpacity
          style={[styles.dropdownButton, { 
            backgroundColor: theme.colors.cardBackground,
            borderColor: theme.colors.border,
          }]}
          onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          activeOpacity={0.7}
        >
          <Text style={[styles.dropdownText, { color: theme.colors.text, fontSize: responsiveFontSize.sm }]}>
            {selectedCategoryLabel}
          </Text>
          <Icon
            name={showCategoryDropdown ? 'arrow-drop-up' : 'arrow-drop-down'}
            size={scale(24)}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
        
        {showCategoryDropdown && (
          <View style={[styles.dropdownList, { 
            backgroundColor: theme.colors.cardBackground,
            borderColor: theme.colors.border,
          }]}>
            {FEEDBACK_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedCategory(category.value);
                  setShowCategoryDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownItemText, { 
                  color: theme.colors.text,
                  fontSize: responsiveFontSize.sm,
                }]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={scale(24)} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: responsiveFontSize.lg }]}>
          Submit Feedback
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Star Rating */}
        {renderStarRating()}

        {/* Category Dropdown */}
        {renderCategoryDropdown()}

        {/* Feedback Text Input */}
        <View style={styles.textInputContainer}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text, fontSize: responsiveFontSize.md }]}>
            Your Feedback
          </Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.border,
              color: theme.colors.text,
              fontSize: responsiveFontSize.sm,
            }]}
            placeholder="Tell us about your experience..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={feedbackText}
            onChangeText={setFeedbackText}
            maxLength={2000}
          />
          <Text style={[styles.characterCount, { color: theme.colors.textSecondary, fontSize: responsiveFontSize.xs }]}>
            {feedbackText.length}/2000 characters
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, {
            backgroundColor: isSubmitting ? theme.colors.border : theme.colors.primary,
            opacity: isSubmitting ? 0.6 : 1,
          }]}
          onPress={handleSubmitFeedback}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.submitButtonText, { fontSize: responsiveFontSize.md }]}>
              Submit Feedback
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onConfirm={() => {
          if (modalType === 'success') {
            // Clear form and go back
            setRating(0);
            setSelectedCategory('');
            setFeedbackText('');
            navigation.goBack();
          }
        }}
      />
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
    paddingVertical: responsiveSpacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: responsiveSpacing.xs,
  },
  headerTitle: {
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: scale(40),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: responsiveSpacing.md,
    paddingBottom: responsiveSpacing.xxl,
  },
  starRatingContainer: {
    marginBottom: responsiveSpacing.lg,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: responsiveSpacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: responsiveSpacing.sm,
  },
  starButton: {
    padding: responsiveSpacing.xs,
  },
  categoryContainer: {
    marginBottom: responsiveSpacing.lg,
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
  },
  dropdownText: {
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: scale(8),
    marginTop: responsiveSpacing.xs,
    zIndex: 1000,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownItemText: {
    fontWeight: '500',
  },
  textInputContainer: {
    marginBottom: responsiveSpacing.xl,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    minHeight: verticalScale(120),
  },
  characterCount: {
    textAlign: 'right',
    marginTop: responsiveSpacing.xs,
  },
  submitButton: {
    borderRadius: scale(8),
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveSpacing.md,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default FeedbackScreen;
