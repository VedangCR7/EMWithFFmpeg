import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
  Image,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackParamList } from '../navigation/types';
import { VideoContent } from '../services/homeApi';
import { useTheme } from '../context/ThemeContext';

type VideoPlayerScreenRouteProp = RouteProp<MainStackParamList, 'VideoPlayer'>;
type VideoPlayerScreenNavigationProp = StackNavigationProp<MainStackParamList, 'VideoPlayer'>;

interface LanguageOption {
  id: string;
  name: string;
  code: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'en', name: 'English', code: 'EN' },
  { id: 'hi', name: 'Hindi', code: 'HI' },
  { id: 'mr', name: 'Marathi', code: 'MR' },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 667) * size;
const responsiveFont = (size: number) => moderateScale(size);
const getIconSize = (baseSize: number) => Math.round(baseSize * (SCREEN_WIDTH / 375));
const NUM_COLUMNS = SCREEN_WIDTH >= 768 ? 4 : 3;
const CARD_GAP = moderateScale(3);
const CARD_PADDING = moderateScale(16);
const CARD_WIDTH =
  (SCREEN_WIDTH - CARD_PADDING - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = verticalScale(80);

const getVideoContainerHeight = () => {
  if (SCREEN_WIDTH < 360) return SCREEN_HEIGHT * 0.3;
  if (SCREEN_WIDTH < 414) return SCREEN_HEIGHT * 0.33;
  return SCREEN_HEIGHT * 0.35;
};

const normalizeLanguageId = (value?: string) => {
  if (!value) return 'en';
  const lower = value.toLowerCase();
  if (lower === 'english' || lower === 'en') return 'en';
  if (lower === 'hindi' || lower === 'hi') return 'hi';
  if (lower === 'marathi' || lower === 'mr') return 'mr';
  return lower;
};

const VideoPlayerScreen: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<VideoPlayerScreenNavigationProp>();
  const route = useRoute<VideoPlayerScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const { selectedVideo, relatedVideos } = route.params;
  const textColor = theme.colors?.text ?? '#000000';
  const secondaryTextColor = theme.colors?.textSecondary ?? '#666666';

  const availableLanguages = useMemo(() => {
    const languages = (selectedVideo as any).languages;
    if (Array.isArray(languages) && languages.length > 0) {
      return languages.map((lang: string) => normalizeLanguageId(lang));
    }
    return [normalizeLanguageId(selectedVideo.language)];
  }, [selectedVideo]);

  const [selectedLanguage, setSelectedLanguage] = useState<string>(availableLanguages[0] || 'en');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);

  useEffect(() => {
    if (!availableLanguages.includes(selectedLanguage)) {
      setSelectedLanguage(availableLanguages[0] || 'en');
    }
  }, [availableLanguages, selectedLanguage]);

  const filteredRelatedVideos = useMemo(() => {
    return relatedVideos.filter(video => {
      const langs = (video as any).languages;
      if (Array.isArray(langs) && langs.length > 0) {
        return langs.map((lang: string) => lang.toLowerCase()).includes(selectedLanguage);
      }
      return video.language?.toLowerCase() === selectedLanguage;
    });
  }, [relatedVideos, selectedLanguage]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleLanguageChange = useCallback((languageId: string) => {
    setSelectedLanguage(languageId);
    setLanguageMenuVisible(false);
  }, []);

  const handleVideoSelect = useCallback((video: VideoContent) => {
    navigation.replace('VideoPlayer', {
      selectedVideo: video,
      relatedVideos: relatedVideos.filter(v => v.id !== video.id),
    });
  }, [navigation, relatedVideos]);

  const handleContinue = useCallback(() => {
    setLanguageMenuVisible(false);
    navigation.navigate('VideoEditor', {
      selectedVideo: {
        uri: selectedVideo.videoUrl,
        title: selectedVideo.title,
        description: selectedVideo.description,
      },
      selectedLanguage,
      selectedTemplateId: selectedVideo.id,
    });
  }, [navigation, selectedVideo, selectedLanguage]);

  const togglePlayback = useCallback(() => setIsPlaying(prev => !prev), []);

  const renderRelatedVideo = useCallback(
    ({ item }: { item: VideoContent }) => (
      <TouchableOpacity
        style={[styles.relatedCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
        activeOpacity={0.85}
        onPress={() => handleVideoSelect(item)}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.relatedThumbnail}
          resizeMode="cover"
        />
        <View style={styles.relatedOverlay}>
          <Icon name="play-arrow" size={28} color="#333" />
        </View>
        <View style={styles.relatedMeta}>
          <Text style={[styles.relatedTitle, { color: textColor }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.relatedBadge}>
            <Text style={[styles.relatedBadgeText, { color: secondaryTextColor }]}>
              {item.language?.toUpperCase() || 'EN'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleVideoSelect, textColor, secondaryTextColor],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={{ height: insets.top + moderateScale(12) }} />

        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.headerTextButton}
            activeOpacity={0.7}
          >
            <Text style={styles.headerButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerLanguageButton}
            activeOpacity={0.8}
            onPress={() => setLanguageMenuVisible(prev => !prev)}
          >
            <Text style={[styles.headerLanguageText, { color: textColor }]}>
              {LANGUAGE_OPTIONS.find(option => option.id === selectedLanguage)?.name || selectedLanguage.toUpperCase()}
            </Text>
            <Icon
              name={languageMenuVisible ? 'expand-less' : 'expand-more'}
              size={getIconSize(14)}
              color="#000000"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinue}
            style={styles.headerTextButton}
            activeOpacity={0.7}
          >
            <Text style={styles.headerButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.videoContainer}>
          {selectedVideo.videoUrl ? (
            <>
              <Video
                source={{ uri: selectedVideo.videoUrl }}
                style={styles.videoPlayer}
                resizeMode="contain"
                repeat
                muted
                paused={!isPlaying}
              />
              <TouchableOpacity
                style={styles.playPause}
                activeOpacity={0.8}
                onPress={togglePlayback}
              >
                <Icon
                  name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
                  size={60}
                  color="#ffffff"
                />
              </TouchableOpacity>

              {languageMenuVisible && (
                <View style={styles.languageDropdownMenuSmall}>
                  {LANGUAGE_OPTIONS.map(option => {
                    const isAvailable = availableLanguages.includes(option.id);
                    const isSelected = option.id === selectedLanguage;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.languageDropdownItem,
                          isSelected && styles.languageDropdownItemSelected,
                          !isAvailable && styles.languageDropdownItemDisabled,
                        ]}
                        onPress={() => isAvailable && handleLanguageChange(option.id)}
                        activeOpacity={isAvailable ? 0.8 : 1}
                        disabled={!isAvailable}
                      >
                        <Text
                          style={[
                            styles.languageDropdownItemText,
                            isSelected && styles.languageDropdownItemTextSelected,
                            !isAvailable && styles.languageDropdownItemTextDisabled,
                          ]}
                        >
                          {option.name}
                        </Text>
                        {isSelected && (
                          <Icon name="check" size={getIconSize(12)} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Icon name="videocam-off" size={36} color="#ffffffaa" />
              <Text style={[styles.videoPlaceholderText, { color: secondaryTextColor }]}>
                Video unavailable
              </Text>
            </View>
          )}
        </View>

        <View style={styles.relatedSection}>
          <View style={styles.relatedHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Related Videos</Text>
              <Text style={[styles.sectionSubtitle, { color: secondaryTextColor }]}>
                In {selectedLanguage.toUpperCase()}
              </Text>
            </View>
            <View style={styles.relatedCountBadge}>
              <Text style={[styles.relatedCountText, { color: secondaryTextColor }]}>
                {filteredRelatedVideos.length} ITEMS
              </Text>
            </View>
          </View>

          {filteredRelatedVideos.length > 0 ? (
            <FlatList
              data={filteredRelatedVideos}
              keyExtractor={item => item.id}
              renderItem={renderRelatedVideo}
              numColumns={NUM_COLUMNS}
              columnWrapperStyle={styles.relatedColumns}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.relatedList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="video-library" size={48} color="#ffffff55" />
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                No videos found in {selectedLanguage.toUpperCase()}
              </Text>
              <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
                Try a different language.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: insets.bottom }} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(8),
    paddingBottom: moderateScale(6),
  },
  headerTextButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#000000',
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  headerLanguageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  headerLanguageText: {
    color: '#000000',
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  videoContainer: {
    height: getVideoContainerHeight(),
    marginHorizontal: moderateScale(8),
    borderRadius: moderateScale(18),
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  playPause: {
    position: 'absolute',
    alignSelf: 'center',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    marginTop: moderateScale(6),
    color: '#ffffffaa',
    fontSize: moderateScale(10),
  },
  languageSection: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(6),
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: moderateScale(4),
  },
  sectionSubtitle: {
    fontSize: moderateScale(10),
    color: 'rgba(255,255,255,0.65)',
  },
  languageScroll: {
    paddingVertical: moderateScale(4),
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: moderateScale(18),
    marginRight: moderateScale(6),
  },
  languageChipActive: {
    backgroundColor: '#667eea',
  },
  languageChipDisabled: {
    opacity: 0.4,
  },
  languageChipText: {
    color: '#ffffff',
    fontSize: moderateScale(9),
    fontWeight: '600',
  },
  languageChipTextActive: {
    color: '#ffffff',
  },
  languageChipTextDisabled: {
    color: 'rgba(255,255,255,0.6)',
  },
  languageDropdownMenuSmall: {
    position: 'absolute',
    top: moderateScale(8),
    alignSelf: 'center',
    minWidth: moderateScale(140),
    maxWidth: '80%',
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: moderateScale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  languageDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
  },
  languageDropdownItemSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.35)',
  },
  languageDropdownItemDisabled: {
    opacity: 0.4,
  },
  languageDropdownItemText: {
    color: '#ffffff',
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  languageDropdownItemTextSelected: {
    fontWeight: '700',
  },
  languageDropdownItemTextDisabled: {
    color: 'rgba(255,255,255,0.6)',
  },
  relatedSection: {
    flex: 1,
    paddingHorizontal: moderateScale(8),
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(6),
  },
  relatedCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(10),
  },
  relatedCountText: {
    color: '#ffffff',
    fontSize: moderateScale(8),
    fontWeight: '600',
  },
  relatedList: {
    paddingBottom: moderateScale(20),
    paddingTop: moderateScale(4),
  },
  relatedColumns: {
    justifyContent: 'flex-start',
    marginBottom: moderateScale(6),
    gap: CARD_GAP,
  },
  relatedCard: {
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: moderateScale(0.5),
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: moderateScale(6),
  },
  relatedThumbnail: {
    width: '100%',
    height: '100%',
  },
  relatedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  relatedMeta: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
  },
  relatedTitle: {
    color: '#ffffff',
    fontSize: moderateScale(9),
    fontWeight: '600',
  },
  relatedBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: moderateScale(3),
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  relatedBadgeText: {
    color: '#ffffff',
    fontSize: moderateScale(8),
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(24),
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: moderateScale(10),
    marginTop: 6,
  },
});

export default VideoPlayerScreen;

