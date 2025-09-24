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
} from 'react-native';
import Video from 'react-native-video';
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

// Responsive video container height
const getVideoContainerHeight = () => {
  if (isSmallScreen) return screenHeight * 0.3;
  if (isMediumScreen) return screenHeight * 0.32;
  return screenHeight * 0.35;
};

type VideoPlayerScreenRouteProp = RouteProp<MainStackParamList, 'VideoPlayer'>;
type VideoPlayerScreenNavigationProp = StackNavigationProp<MainStackParamList, 'VideoPlayer'>;

const VideoPlayerScreen: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<VideoPlayerScreenNavigationProp>();
  const route = useRoute<VideoPlayerScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  const { selectedVideo, relatedVideos } = route.params;
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);

  // Language options
  const languages = useMemo(() => [
    { id: 'english', name: 'English', code: 'EN' },
    { id: 'marathi', name: 'Marathi', code: 'MR' },
    { id: 'hindi', name: 'Hindi', code: 'HI' },
  ], []);

  // Filter videos by selected language
  const filteredVideos = useMemo(() => {
    return relatedVideos.filter(video => {
      // For demo purposes, we'll simulate language filtering
      // In real app, this would be based on actual video language metadata
      const videoLanguages = video.languages || ['english'];
      return videoLanguages.includes(selectedLanguage);
    });
  }, [relatedVideos, selectedLanguage]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleVideoSelect = useCallback((video: Template) => {
    navigation.replace('VideoPlayer', {
      selectedVideo: video,
      relatedVideos: relatedVideos.filter(v => v.id !== video.id),
    });
  }, [navigation, relatedVideos]);

  const handleLanguageChange = useCallback((languageId: string) => {
    setSelectedLanguage(languageId);
    setIsVideoPlaying(true); // Restart video when language changes
  }, []);

  const toggleVideoPlayback = useCallback(() => {
    setIsVideoPlaying(!isVideoPlaying);
  }, [isVideoPlaying]);

  const handleNextPress = useCallback(() => {
    navigation.navigate('VideoEditor', {
      selectedVideo: {
        uri: selectedVideo.videoUrl || '',
        title: selectedVideo.name,
        description: selectedVideo.category,
      },
      selectedLanguage: selectedLanguage,
      selectedTemplateId: selectedVideo.id,
    });
  }, [navigation, selectedVideo, selectedLanguage]);

  const renderRelatedVideo = useCallback(({ item }: { item: Template }) => (
    <TouchableOpacity
      style={styles.relatedVideoCard}
      onPress={() => handleVideoSelect(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.relatedVideoImage}
        resizeMode="cover"
      />
      <View style={styles.relatedVideoOverlay}>
        <View style={styles.relatedVideoPlayIcon}>
          <Icon name="play-arrow" size={isSmallScreen ? 18 : 22} color="#333333" />
        </View>
      </View>
      <View style={styles.relatedVideoTitleContainer}>
        <Text style={styles.relatedVideoTitle} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <View style={styles.relatedVideoLanguageBadge}>
        <Text style={styles.relatedVideoLanguageText}>
          {languages.find(lang => lang.id === selectedLanguage)?.code || 'EN'}
        </Text>
      </View>
    </TouchableOpacity>
  ), [handleVideoSelect, selectedLanguage, languages]);

  const renderLanguageButton = useCallback((language: typeof languages[0]) => (
    <TouchableOpacity
      key={language.id}
      style={[
        styles.languageButton,
        selectedLanguage === language.id && styles.languageButtonSelected
      ]}
      onPress={() => handleLanguageChange(language.id)}
      activeOpacity={0.7}
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
          >
            <Icon name="arrow-back" size={isSmallScreen ? 20 : 24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{selectedVideo.name}</Text>
            <Text style={styles.headerSubtitle}>{selectedVideo.category}</Text>
            <View style={styles.headerMeta}>
              <View style={styles.headerMetaItem}>
                <Icon name="visibility" size={isSmallScreen ? 12 : 14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.headerMetaText}>High Definition</Text>
              </View>
              <View style={styles.headerMetaItem}>
                <Icon name="schedule" size={isSmallScreen ? 12 : 14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.headerMetaText}>Auto-Play</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Video Section */}
        <View style={styles.videoContainer}>
          {selectedVideo.videoUrl && (
            <>
              <Video
                source={{ uri: selectedVideo.videoUrl }}
                style={styles.videoPlayer}
                resizeMode="contain"
                repeat={true}
                paused={!isVideoPlaying}
                muted={true}
              />
              <View style={styles.videoOverlay}>
                <View style={styles.videoControls}>
                  <TouchableOpacity
                    style={styles.playPauseButton}
                    onPress={toggleVideoPlayback}
                    activeOpacity={0.8}
                  >
                    <Icon 
                      name={isVideoPlaying ? "pause" : "play-arrow"} 
                      size={isSmallScreen ? 24 : 28} 
                      color="#ffffff" 
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.languageBadge}>
                  <Text style={styles.languageBadgeText}>
                    {selectedLanguage.toUpperCase()}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Enhanced Language Selection Section */}
        <View style={styles.languageSection}>
          <View style={styles.languageSectionHeader}>
            <Text style={styles.languageTitle}>
              Select Language
            </Text>
            <Text style={styles.languageSubtitle}>
              Select language variant for content
            </Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languageButtonsContainer}
          >
            {languages.map(renderLanguageButton)}
          </ScrollView>
        </View>

        {/* Next Button Section */}
        <View style={styles.nextButtonSection}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextPress}
            activeOpacity={0.8}
          >
            <View style={styles.nextButtonContent}>
              <Text style={styles.nextButtonText}>Continue to Editor</Text>
              <Icon name="arrow-forward" size={isSmallScreen ? 18 : 20} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Enhanced Related Videos Section */}
        <View style={styles.relatedSection}>
          <View style={styles.relatedHeader}>
            <View style={styles.relatedHeaderLeft}>
              <Text style={styles.relatedTitle}>
                Related Content
              </Text>
              <Text style={styles.relatedSubtitle}>
                In {languages.find(lang => lang.id === selectedLanguage)?.name}
              </Text>
            </View>
            <View style={styles.relatedCountBadge}>
              <Text style={styles.relatedCountText}>
                {filteredVideos.length} ITEMS
              </Text>
            </View>
          </View>
          
          {filteredVideos.length > 0 ? (
            <FlatList
              data={filteredVideos.slice(0, isSmallScreen ? 4 : 6)}
              renderItem={renderRelatedVideo}
              keyExtractor={(item) => item.id}
              numColumns={isSmallScreen ? 2 : 2}
              columnWrapperStyle={styles.relatedGrid}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.relatedList, { paddingBottom: insets.bottom + responsiveSpacing.xl }]}
            />
          ) : (
            <View style={styles.noVideosContainer}>
              <Icon name="video-library" size={isSmallScreen ? 40 : 48} color="rgba(255,255,255,0.5)" />
              <Text style={styles.noVideosText}>
                No content available in {languages.find(lang => lang.id === selectedLanguage)?.name}
              </Text>
              <Text style={styles.noVideosSubtext}>
                Try selecting a different language
              </Text>
            </View>
          )}
        </View>
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
  videoContainer: {
    position: 'relative',
    height: getVideoContainerHeight(),
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
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoControls: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: isSmallScreen ? -20 : -25 }, { translateY: isSmallScreen ? -20 : -25 }],
  },
  playPauseButton: {
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
  languageSection: {
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.lg,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: responsiveSpacing.xs,
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
  },
  nextButton: {
    backgroundColor: '#667eea',
    borderRadius: isSmallScreen ? 16 : 20,
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
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
  relatedSection: {
    flex: 1,
    paddingHorizontal: responsiveSpacing.md,
    paddingTop: responsiveSpacing.sm,
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
    paddingBottom: responsiveSpacing.xl,
  },
  relatedGrid: {
    justifyContent: 'space-between',
    gap: responsiveSpacing.sm,
  },
  relatedVideoCard: {
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
  },
  relatedVideoImage: {
    width: '100%',
    height: '100%',
  },
  relatedVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedVideoPlayIcon: {
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
  relatedVideoTitleContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  relatedVideoTitle: {
    color: '#ffffff',
    fontSize: responsiveFontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  relatedVideoLanguageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  relatedVideoLanguageText: {
    color: '#ffffff',
    fontSize: responsiveFontSize.xs - 2,
    fontWeight: '600',
  },
  noVideosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveSpacing.xl,
  },
  noVideosText: {
    fontSize: responsiveFontSize.md,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: responsiveSpacing.md,
    marginBottom: responsiveSpacing.xs,
  },
  noVideosSubtext: {
    fontSize: responsiveFontSize.sm,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});

export default VideoPlayerScreen;
