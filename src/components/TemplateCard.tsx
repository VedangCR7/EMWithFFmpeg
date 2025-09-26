import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Template } from '../services/templates';
import { useTheme } from '../context/ThemeContext';
import templatesBannersApi from '../services/templatesBannersApi';
import genericLikesApi from '../services/genericLikesApi';

interface TemplateCardProps {
  template: Template;
  onPress: (template: Template) => void;
  onLikeChange?: (templateId: string, isLiked: boolean) => void;
  width?: number;
}

const { width, height } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // Default for 2 columns, can be overridden

const TemplateCard: React.FC<TemplateCardProps> = React.memo(({ template, onPress, onLikeChange, width: customWidth }) => {
  const { theme, isDarkMode } = useTheme();
  const [scaleValue] = useState(() => new Animated.Value(1));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewImageLoaded, setPreviewImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(template.isLiked || false);
  const [isLiking, setIsLiking] = useState(false);
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
        duration: 200, // Faster fade in
        useNativeDriver: false, // Keep gradient border on JS thread
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
          duration: 400, // Slower fade out for better UX
          useNativeDriver: false, // Keep gradient border on JS thread
        }).start();
      }, 100); // 100ms delay before starting fade out
    }
  };

  const getCategoryColor = () => {
    return template.category === 'premium' 
      ? ['#ff6b6b', '#ee5a52'] 
      : ['#4ecdc4', '#44a08d'];
  };

  const getCategoryIcon = () => {
    return template.category === 'premium' ? 'star' : 'favorite';
  };

  const handleLikePress = async (e: any) => {
    e.stopPropagation();
    
    if (isLiking) return; // Prevent multiple rapid clicks
    
    try {
      setIsLiking(true);
      
      // Use generic likes API
      const newLikeStatus = await genericLikesApi.toggleLike('TEMPLATE', template.id);
      setIsLiked(newLikeStatus);
      onLikeChange?.(template.id, newLikeStatus);
      
      console.log('✅ Template like toggled:', template.id, 'isLiked:', newLikeStatus);
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert(
        'Error',
        'Failed to update like status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLiking(false);
    }
  };

  const renderPreviewModal = () => (
    <Modal
      visible={previewModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setPreviewModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.modalHeaderLeft}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{template.title}</Text>
              <View style={styles.modalBadges}>
                <LinearGradient
                  colors={getCategoryColor()}
                  style={styles.modalCategoryBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name={getCategoryIcon()} size={14} color="#ffffff" />
                  <Text style={styles.modalCategoryText}>
                    {template.category.toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={styles.modalLanguageBadge}>
                  <Icon name="translate" size={12} color="#ffffff" />
                  <Text style={styles.modalLanguageText}>{template.language}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setPreviewModalVisible(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Image Section */}
          <View style={[styles.modalImageContainer, { backgroundColor: theme.colors.inputBackground }]}>
            <Image
              source={{ 
                uri: template.imageUrl,
                cache: 'force-cache'
              }}
              style={styles.modalImage}
              resizeMode="contain"
              onLoad={() => setPreviewImageLoaded(true)}
              onLoadStart={() => setPreviewImageLoaded(false)}
            />
            
            {/* Loading Overlay */}
            {!previewImageLoaded && (
              <View style={[styles.modalLoadingOverlay, { backgroundColor: theme.colors.inputBackground }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.modalLoadingText, { color: theme.colors.primary }]}>Loading preview...</Text>
              </View>
            )}
          </View>

          {/* Template Details */}
          <ScrollView style={styles.modalDetails} showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>{template.description}</Text>
            
            {/* Tags */}
            <View style={styles.modalTagsContainer}>
              <Text style={[styles.modalTagsTitle, { color: theme.colors.text }]}>Tags:</Text>
              <View style={styles.modalTagsList}>
                {template.tags.map((tag, index) => (
                  <View key={index} style={[styles.modalTag, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
                    <Text style={[styles.modalTagText, { color: theme.colors.primary }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Template Info */}
            <View style={styles.modalInfoContainer}>
              <View style={styles.modalInfoRow}>
                <Icon name="schedule" size={16} color={theme.colors.primary} />
                <Text style={[styles.modalInfoText, { color: theme.colors.textSecondary }]}>
                  Created: {new Date(template.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Icon name="update" size={16} color={theme.colors.primary} />
                <Text style={[styles.modalInfoText, { color: theme.colors.textSecondary }]}>
                  Updated: {new Date(template.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.modalActions, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity 
              style={styles.modalUseButton}
              onPress={() => {
                setPreviewModalVisible(false);
                onPress(template);
              }}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.modalUseButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="check" size={18} color="#ffffff" />
                <Text style={styles.modalUseButtonText}>Use Template</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleValue }],
            width: customWidth || cardWidth,
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
              borderColor: theme.colors.border,
              borderWidth: isDarkMode ? 1.5 : 1,
              shadowColor: theme.colors.shadow,
              shadowOpacity: isDarkMode ? 0.4 : 0.1,
              shadowRadius: isDarkMode ? 12 : 8,
              elevation: isDarkMode ? 8 : 6,
            }
          ]}
          onPress={() => setPreviewModalVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {/* Image Container */}
          <View style={styles.imageContainer}>
            <Image
              source={{ 
                uri: template.imageUrl,
                cache: 'force-cache'
              }}
              style={styles.image}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
              onLoadStart={() => setImageLoaded(false)}
              fadeDuration={0}
            />
            
            {/* Loading Overlay */}
            {!imageLoaded && (
              <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.inputBackground }]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
            
            {/* Category Badge */}
            <LinearGradient
              colors={getCategoryColor()}
              style={styles.categoryBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name={getCategoryIcon()} size={12} color="#ffffff" />
              <Text style={styles.categoryText}>
                {template.category.toUpperCase()}
              </Text>
            </LinearGradient>

            {/* Language Badge */}
            <View style={styles.languageBadge}>
              <Icon name="translate" size={10} color="#ffffff" />
              <Text style={styles.languageText}>{template.language}</Text>
            </View>

            {/* Like Button */}
            <TouchableOpacity
              style={styles.likeButton}
              onPress={handleLikePress}
              disabled={isLiking}
              activeOpacity={0.7}
            >
              {isLiking ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Icon 
                  name={isLiked ? "favorite" : "favorite-border"} 
                  size={16} 
                  color={isLiked ? "#ff4757" : "#ffffff"} 
                />
              )}
            </TouchableOpacity>

            {/* Overlay Gradient */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)']}
              style={styles.imageOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
              {template.title}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {template.description}
            </Text>
            
            {/* Tags */}
            <View style={styles.tagsContainer}>
              {template.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
                  <Text style={[styles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
                </View>
              ))}
              {template.tags.length > 2 && (
                <Text style={[styles.moreTags, { color: theme.colors.textSecondary }]}>+{template.tags.length - 2}</Text>
              )}
            </View>

            {/* Action Button */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setPreviewModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.actionButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name="visibility" size={14} color="#ffffff" />
                  <Text style={styles.actionText}>Preview</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Preview Modal */}
      {renderPreviewModal()}
    </>
  );
});

TemplateCard.displayName = 'TemplateCard';

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginBottom: 24,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  gradientBorderContainer: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22, // Slightly larger than card border radius
    zIndex: 1,
  },
  gradientBorder: {
    flex: 1,
    borderRadius: 22,
    padding: 2, // Creates the border thickness
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginHorizontal: 6,
    position: 'relative',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  languageBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  languageText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  likeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreTags: {
    fontSize: 10,
    fontWeight: '500',
  },
  actionContainer: {
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 22,
  },
  modalBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  modalCategoryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalLanguageBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalLanguageText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalImageContainer: {
    position: 'relative',
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  modalDetails: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    maxHeight: height * 0.25,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  modalTagsContainer: {
    marginBottom: 15,
  },
  modalTagsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalInfoContainer: {
    gap: 8,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
  },
  modalUseButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalUseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modalUseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TemplateCard; 