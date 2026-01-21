import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackParamList } from '../navigation/AppNavigator';
import { Template } from '../services/dashboard';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isTablet = screenWidth >= 768;
const isLandscape = screenWidth > screenHeight;

// Responsive spacing and sizing
const responsiveSpacing = {
  xs: isSmallScreen ? 6 : isMediumScreen ? 8 : 12,
  sm: isSmallScreen ? 8 : isMediumScreen ? 12 : 16,
  md: isSmallScreen ? 12 : isMediumScreen ? 16 : 20,
  lg: isSmallScreen ? 16 : isMediumScreen ? 20 : 24,
  xl: isSmallScreen ? 20 : isMediumScreen ? 24 : 32,
  xxl: isSmallScreen ? 24 : isMediumScreen ? 32 : 40,
};

const responsiveFontSize = {
  xs: isSmallScreen ? 8 : isMediumScreen ? 10 : 12,
  sm: isSmallScreen ? 10 : isMediumScreen ? 12 : 14,
  md: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
  lg: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
  xl: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
  xxl: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  xxxl: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
};

// Responsive poster container height
const getPosterContainerHeight = () => {
  if (isTablet) return screenHeight * 0.35;
  if (isLandscape) return screenHeight * 0.3;
  if (isSmallScreen) return screenHeight * 0.25;
  if (isMediumScreen) return screenHeight * 0.28;
  return screenHeight * 0.3;
};

type PosterPlayerScreenRouteProp = RouteProp<MainStackParamList, 'PosterPlayer'>;
type PosterPlayerScreenNavigationProp = StackNavigationProp<MainStackParamList, 'PosterPlayer'>;

const PosterPlayerScreen: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<PosterPlayerScreenNavigationProp>();
  const route = useRoute<PosterPlayerScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  const { selectedPoster, relatedPosters } = route.params;
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<string[]>([]);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // Language options
  const languages = useMemo(() => [
    { id: 'english', name: 'English', code: 'EN' },
    { id: 'marathi', name: 'Marathi', code: 'MR' },
    { id: 'hindi', name: 'Hindi', code: 'HI' },
  ], []);

  // Filter posters by selected language
  const filteredPosters = useMemo(() => {
    return relatedPosters.filter(poster => {
      // For demo purposes, we'll simulate language filtering
      // In real app, this would be based on actual poster language metadata
      const posterLanguages = poster.languages || ['english'];
      return posterLanguages.includes(selectedLanguage);
    });
  }, [relatedPosters, selectedLanguage]);

  // Debounced navigation to prevent multiple rapid clicks
  const debouncedNavigate = useCallback((callback: () => void, delay: number = 300) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    setTimeout(() => {
      callback();
      setIsNavigating(false);
    }, delay);
  }, [isNavigating]);

  const handleBackPress = useCallback(() => {
    debouncedNavigate(() => navigation.goBack());
  }, [navigation, debouncedNavigate]);

  const handlePosterSelect = useCallback((poster: Template) => {
    if (isNavigating) return;
    
    debouncedNavigate(() => {
      navigation.replace('PosterPlayer', {
        selectedPoster: poster,
        relatedPosters: relatedPosters.filter(p => p.id !== poster.id),
      });
    });
  }, [navigation, relatedPosters, debouncedNavigate, isNavigating]);

  const handleLanguageChange = useCallback((languageId: string) => {
    setSelectedLanguage(languageId);
  }, []);

  const handleNextPress = useCallback(() => {
    if (isNavigating) return;
    
    setIsLoading(true);
    
    // Simulate validation and preparation
    setTimeout(() => {
      debouncedNavigate(() => {
        navigation.navigate('PosterEditor', {
          selectedImage: {
            uri: selectedPoster.thumbnail,
            title: selectedPoster.name,
            description: selectedPoster.category,
          },
          selectedLanguage: selectedLanguage,
          selectedTemplateId: selectedPoster.id,
        });
      });
      setIsLoading(false);
    }, 500);
  }, [navigation, selectedPoster, selectedLanguage, debouncedNavigate, isNavigating]);

  // Handle image load errors
  const handleImageError = useCallback((imageId: string) => {
    setImageLoadErrors(prev => prev.includes(imageId) ? prev : [...prev, imageId]);
  }, []);

  const handleImageLoad = useCallback((imageId: string) => {
    setImageLoadErrors(prev => prev.filter(id => id !== imageId));
  }, []);

  const renderRelatedPoster = useCallback(({ item }: { item: Template }) => {
    const hasError = imageLoadErrors.includes(item.id);
    
    return (
      <TouchableOpacity
        style={styles.relatedPosterCard}
        onPress={() => handlePosterSelect(item)}
        activeOpacity={0.8}
        testID={`related-poster-${item.id}`}
        accessibilityLabel={`Related poster: ${item.name}`}
      >
        {hasError ? (
          <View style={[styles.relatedPosterImage, styles.imageErrorPlaceholder]}>
            <Icon name="image-not-supported" size={32} color="rgba(255,255,255,0.5)" />
            <Text style={styles.imageErrorText}>Image not available</Text>
          </View>
        ) : (
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.relatedPosterImage}
            resizeMode="cover"
            onError={() => handleImageError(item.id)}
            onLoad={() => handleImageLoad(item.id)}
          />
        )}
        
        <View style={styles.relatedPosterLanguageBadge}>
          <Text style={styles.relatedPosterLanguageText}>
            {languages.find(lang => lang.id === selectedLanguage)?.code || 'EN'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handlePosterSelect, selectedLanguage, languages, imageLoadErrors, handleImageError, handleImageLoad]);

  const renderLanguageButton = useCallback((language: typeof languages[0]) => (
    <TouchableOpacity
      key={language.id}
      style={[
        styles.languageButton,
        selectedLanguage === language.id && styles.languageButtonSelected
      ]}
      onPress={() => handleLanguageChange(language.id)}
      activeOpacity={0.7}
      testID={`language-button-${language.id}`}
      accessibilityLabel={`Select ${language.name} language`}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedLanguage === language.id }}
    >
      <View style={styles.languageButtonContent}>
        <Text style={[
          styles.languageButtonText,
          selectedLanguage === language.id && styles.languageButtonTextSelected
        ]}>
          {language.name}
        </Text>
        {selectedLanguage === language.id && (
          <Icon name="check-circle" size={isSmallScreen ? 14 : 16} color="#ffffff" />
        )}
      </View>
    </TouchableOpacity>
  ), [selectedLanguage, handleLanguageChange]);

     return (
     <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
       <StatusBar 
         barStyle={isDarkMode ? 'light-content' : 'dark-content'}
         backgroundColor="transparent" 
         translucent={true}
       />
       
       <LinearGradient
         colors={theme.colors.gradient}
         style={styles.gradientBackground}
         start={{ x: 0, y: 0 }}
         end={{ x: 1, y: 1 }}
       >
         {/* Safe Area Top Spacing */}
         <View style={{ height: insets.top }} />
         
         {/* Enhanced Header */}
         <View style={styles.header}>
           <TouchableOpacity
             style={styles.backButton}
             onPress={handleBackPress}
             activeOpacity={0.7}
             testID="back-button"
             accessibilityLabel="Go back"
             accessibilityRole="button"
           >
             <Icon name="arrow-back" size={isSmallScreen ? 20 : 24} color="#ffffff" />
           </TouchableOpacity>
           <View style={styles.headerContent}>
             <Text style={styles.headerTitle} testID="poster-title">{selectedPoster.name}</Text>
             <Text style={styles.headerSubtitle} testID="poster-category">{selectedPoster.category}</Text>
             <View style={styles.headerMeta}>
               <View style={styles.headerMetaItem}>
                 <Icon name="high-quality" size={isSmallScreen ? 12 : 14} color="rgba(255,255,255,0.7)" />
                 <Text style={styles.headerMetaText}>High Resolution</Text>
               </View>
               <View style={styles.headerMetaItem}>
                 <Icon name="format-paint" size={isSmallScreen ? 12 : 14} color="rgba(255,255,255,0.7)" />
                 <Text style={styles.headerMetaText}>Customizable</Text>
               </View>
             </View>
           </View>
         </View>

         {/* Enhanced Poster Section */}
         <View style={styles.posterContainer}>
           {imageLoadErrors.includes(selectedPoster.id) ? (
             <View style={[styles.posterImage, styles.imageErrorPlaceholder]}>
               <Icon name="image-not-supported" size={48} color="rgba(255,255,255,0.5)" />
               <Text style={styles.imageErrorText}>Poster image not available</Text>
             </View>
           ) : (
             <Image
               source={{ uri: selectedPoster.thumbnail }}
               style={styles.posterImage}
               resizeMode="contain"
               testID="main-poster-image"
               accessibilityLabel={`Poster: ${selectedPoster.name}`}
               onError={() => handleImageError(selectedPoster.id)}
               onLoad={() => handleImageLoad(selectedPoster.id)}
             />
           )}
           <View style={styles.posterOverlay}>
             <View style={styles.languageBadge}>
               <Text style={styles.languageBadgeText}>
                 {selectedLanguage.toUpperCase()}
               </Text>
             </View>
           </View>
         </View>

         {/* Enhanced Language Selection Section */}
         <View style={styles.languageSection}>
           <View style={styles.languageSectionHeader}>
             <Text style={styles.languageTitle} testID="language-selection-title">
               Select Language
             </Text>
             <Text style={styles.languageSubtitle} testID="language-selection-subtitle">
               Select language variant for poster content
             </Text>
           </View>

           <ScrollView 
             horizontal 
             showsHorizontalScrollIndicator={false}
             contentContainerStyle={styles.languageButtonsContainer}
             testID="language-scroll-view"
           >
             {languages.map(renderLanguageButton)}
           </ScrollView>
         </View>

         {/* Next Button Section */}
         <View style={styles.nextButtonSection}>
           <TouchableOpacity
             style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
             onPress={handleNextPress}
             activeOpacity={0.8}
             disabled={isLoading || isNavigating}
             testID="continue-to-editor-button"
             accessibilityLabel="Continue to editor"
             accessibilityRole="button"
             accessibilityState={{ disabled: isLoading || isNavigating }}
           >
             <View style={styles.nextButtonContent}>
               {isLoading ? (
                 <ActivityIndicator size="small" color="#ffffff" testID="next-button-loading" />
               ) : (
                 <>
                   <Text style={styles.nextButtonText}>Continue to Editor</Text>
                   <Icon name="arrow-forward" size={isSmallScreen ? 18 : 20} color="#ffffff" />
                 </>
               )}
             </View>
           </TouchableOpacity>
         </View>

         {/* Enhanced Related Posters Section - Using FlatList as main scrollable container */}
         <View style={styles.relatedSection}>
           <View style={styles.relatedHeader}>
             <View style={styles.relatedHeaderLeft}>
               <Text style={styles.relatedTitle} testID="related-posters-title">
                 Related Templates
               </Text>
               <Text style={styles.relatedSubtitle} testID="related-posters-subtitle">
                 In {languages.find(lang => lang.id === selectedLanguage)?.name}
               </Text>
             </View>
             <View style={styles.relatedCountBadge}>
               <Text style={styles.relatedCountText} testID="related-posters-count">
                 {filteredPosters.length} ITEMS
               </Text>
             </View>
           </View>
           
           {filteredPosters.length > 0 ? (
             <FlatList
               data={filteredPosters}
               renderItem={renderRelatedPoster}
               keyExtractor={(item) => item.id}
               numColumns={2}
               columnWrapperStyle={styles.relatedGrid}
               showsVerticalScrollIndicator={true}
               contentContainerStyle={styles.relatedList}
               style={styles.relatedFlatList}
               testID="related-posters-list"
             />
           ) : (
             <View style={styles.noPostersContainer} testID="no-posters-container">
               <Icon name="image-not-supported" size={48} color="rgba(255,255,255,0.3)" />
               <Text style={styles.noPostersText}>
                 No templates available in {languages.find(lang => lang.id === selectedLanguage)?.name}
               </Text>
               <Text style={styles.noPostersSubtext}>
                 Try selecting a different language
               </Text>
             </View>
           )}
         </View>

         {/* Safe Area Bottom Spacing */}
         <View style={{ height: insets.bottom }} />
       </LinearGradient>
     </View>
   );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: responsiveSpacing.md,
    paddingTop: responsiveSpacing.sm,
    paddingBottom: responsiveSpacing.md,
  },
  backButton: {
    width: isSmallScreen ? 40 : 44,
    height: isSmallScreen ? 40 : 44,
    borderRadius: isSmallScreen ? 20 : 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: responsiveFontSize.xl,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.5,
    lineHeight: responsiveFontSize.xl * 1.2,
  },
  headerSubtitle: {
    fontSize: responsiveFontSize.md,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: responsiveSpacing.xs,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: responsiveSpacing.md,
  },
  headerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerMetaText: {
    fontSize: responsiveFontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  posterContainer: {
    position: 'relative',
    height: getPosterContainerHeight(),
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: responsiveSpacing.md,
    borderRadius: isSmallScreen ? 16 : 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterControls: {
    position: 'absolute',
    top: responsiveSpacing.md,
    left: responsiveSpacing.md,
  },
  zoomButton: {
    width: isSmallScreen ? 40 : 50,
    height: isSmallScreen ? 40 : 50,
    borderRadius: isSmallScreen ? 20 : 25,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  languageBadge: {
    position: 'absolute',
    top: responsiveSpacing.md,
    right: responsiveSpacing.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  languageBadgeText: {
    color: '#ffffff',
    fontSize: responsiveFontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  relatedSection: {
    paddingHorizontal: responsiveSpacing.md,
    paddingTop: responsiveSpacing.sm,
    paddingBottom: responsiveSpacing.md,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsiveSpacing.md,
  },
  relatedHeaderLeft: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: responsiveFontSize.lg,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  relatedSubtitle: {
    fontSize: responsiveFontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  relatedCountBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },
  relatedCountText: {
    color: '#ffffff',
    fontSize: responsiveFontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  relatedList: {
    paddingBottom: responsiveSpacing.md,
    paddingTop: responsiveSpacing.sm,
  },
  relatedFlatList: {
    maxHeight: 200,
  },
  relatedGrid: {
    justifyContent: 'space-between',
    gap: responsiveSpacing.lg,
  },
  relatedPosterCard: {
    width: (screenWidth - responsiveSpacing.md * 3) / 2,
    height: (screenWidth - responsiveSpacing.md * 3) / 2 * 0.7,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: isSmallScreen ? 14 : 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: responsiveSpacing.md,
  },
  relatedPosterImage: {
    width: '100%',
    height: '100%',
  },
  relatedPosterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedPosterIcon: {
    width: isSmallScreen ? 40 : 48,
    height: isSmallScreen ? 40 : 48,
    borderRadius: isSmallScreen ? 20 : 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  relatedPosterTitleContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  relatedPosterTitle: {
    color: '#ffffff',
    fontSize: responsiveFontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  relatedPosterLanguageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  relatedPosterLanguageText: {
    color: '#ffffff',
    fontSize: responsiveFontSize.xs - 2,
    fontWeight: '600',
  },
  noPostersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveSpacing.xl,
  },
  noPostersText: {
    fontSize: responsiveFontSize.md,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: responsiveSpacing.md,
    marginBottom: responsiveSpacing.xs,
  },
  noPostersSubtext: {
    fontSize: responsiveFontSize.sm,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  languageSection: {
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.md,
  },
  languageSectionHeader: {
    marginBottom: responsiveSpacing.md,
  },
  languageTitle: {
    fontSize: responsiveFontSize.lg,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  languageSubtitle: {
    fontSize: responsiveFontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
  languageButtonsContainer: {
    paddingHorizontal: responsiveSpacing.sm,
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: responsiveSpacing.sm,
  },
  languageButton: {
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.lg,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: responsiveSpacing.xs,
    minWidth: 120,
    minHeight: 50,
  },
  languageButtonSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  languageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  languageButtonText: {
    fontSize: responsiveFontSize.md,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  languageButtonTextSelected: {
    fontWeight: '700',
  },
  nextButtonSection: {
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.md,
    paddingBottom: responsiveSpacing.xl,
  },
  nextButton: {
    backgroundColor: '#667eea',
    borderRadius: isSmallScreen ? 16 : 20,
    paddingVertical: responsiveSpacing.lg,
    paddingHorizontal: responsiveSpacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    minHeight: 60,
    borderWidth: 3,
    borderColor: '#5a67d8',
  },
  nextButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSpacing.sm,
  },
  nextButtonText: {
    fontSize: responsiveFontSize.lg,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  nextButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#a0a0a0',
    borderColor: '#808080',
  },
  imageErrorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  imageErrorText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: responsiveFontSize.sm,
    fontWeight: '500',
    marginTop: responsiveSpacing.xs,
    textAlign: 'center',
  },
});

export default PosterPlayerScreen;
