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

// Feedback categories with icons for card design
const FEEDBACK_CATEGORIES = [
  { label: 'Report a problem', value: 'BUG_REPORT', icon: '⚠️' },
  { label: 'Share an idea', value: 'FEATURE_REQUEST', icon: '💡' },
  { label: 'User Experience', value: 'USER_EXPERIENCE', icon: '📈' },
  { label: 'General Feedback', value: 'GENERAL_FEEDBACK', icon: '💬' },
];

type FeedbackScreenNavigationProp = any;

// Header Section Component
const HeaderSection: React.FC<{ navigation: any; theme: any }> = ({ navigation, theme }) => (
  <View style={styles.headerSection}>
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.backButton}
      activeOpacity={0.7}
    >
      <Icon name="arrow-back" size={24} color={theme.colors.text} />
    </TouchableOpacity>
    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
      Help us improve
    </Text>
    <View style={styles.headerSpacer} />
  </View>
);

// Rating Section Component
const RatingSection: React.FC<{ rating: number; setRating: (rating: number) => void; theme: any }> = ({ rating, setRating, theme }) => (
  <View style={styles.ratingSection}>
    <Text style={[styles.ratingTitle, { color: theme.colors.textSecondary }]}>
      How was your experience?
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
            size={32}
            color={star <= rating ? theme.colors.primary : theme.colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// Category Grid Component
const CategoryGrid: React.FC<{ 
  selectedCategory: string; 
  setSelectedCategory: (category: string) => void; 
  theme: any 
}> = ({ selectedCategory, setSelectedCategory, theme }) => (
  <View style={styles.categorySection}>
    <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
      Choose a category:
    </Text>
    <View style={styles.categoryGrid}>
      {FEEDBACK_CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category.value}
          style={[
            styles.categoryCard,
            {
              backgroundColor: selectedCategory === category.value ? `${theme.colors.primary}15` : theme.colors.cardBackground,
              borderColor: selectedCategory === category.value ? theme.colors.primary : 'transparent',
              borderWidth: selectedCategory === category.value ? 2 : 0,
            }
          ]}
          onPress={() => setSelectedCategory(category.value)}
          activeOpacity={0.7}
        >
          {selectedCategory === category.value && (
            <View style={[
              styles.checkmarkBadge,
              { backgroundColor: theme.colors.cardBackground }
            ]}>
              <Icon name="check" size={16} color={theme.colors.primary} />
            </View>
          )}
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={[styles.categoryLabel, { color: theme.colors.text }]}>
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// Feedback Input Component
const FeedbackInput: React.FC<{ 
  feedbackText: string; 
  setFeedbackText: (text: string) => void; 
  theme: any 
}> = ({ feedbackText, setFeedbackText, theme }) => (
  <View style={styles.inputSection}>
    <TextInput
      style={[
        styles.feedbackInput,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.border,
          color: theme.colors.text,
        }
      ]}
      placeholder="Describe the problem..."
      placeholderTextColor={theme.colors.textSecondary}
      multiline
      textAlignVertical="top"
      value={feedbackText}
      onChangeText={setFeedbackText}
      maxLength={2000}
    />
    <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
      {feedbackText.length}/2000 characters
    </Text>
  </View>
);

// Submit Button Component
const SubmitButton: React.FC<{ 
  isSubmitting: boolean; 
  handleSubmitFeedback: () => void 
}> = ({ isSubmitting, handleSubmitFeedback }) => (
  <TouchableOpacity
    style={styles.submitButton}
    onPress={handleSubmitFeedback}
    disabled={isSubmitting}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={['#2196F3', '#1976D2']}
      style={styles.submitButtonGradient}
    >
      {isSubmitting ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.submitButtonText}>Send Feedback</Text>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

const FeedbackScreen: React.FC = () => {
  const navigation = useNavigation<FeedbackScreenNavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Form state
  const [rating, setRating] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <HeaderSection navigation={navigation} theme={theme} />

        {/* Rating Section */}
        <RatingSection rating={rating} setRating={setRating} theme={theme} />

        {/* Category Grid */}
        <CategoryGrid selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} theme={theme} />

        {/* Feedback Input */}
        <FeedbackInput feedbackText={feedbackText} setFeedbackText={setFeedbackText} theme={theme} />

        {/* Submit Button */}
        <SubmitButton isSubmitting={isSubmitting} handleSubmitFeedback={handleSubmitFeedback} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  
  // Header Section
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  
  // Rating Section
  ratingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  starButton: {
    padding: 4,
  },
  
  // Category Section
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Input Section
  inputSection: {
    marginBottom: 20,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
  },
  
  // Submit Button
  submitButton: {
    borderRadius: 12,
    height: 52,
    marginTop: 20,
  },
  submitButtonGradient: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeedbackScreen;
