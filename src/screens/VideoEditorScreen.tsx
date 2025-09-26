// VideoEditorScreen - Metro cache fix - VideoProcessor import commented out
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  Image,
  FlatList,
  Animated,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  NativeModules,
} from 'react-native';
import Video from 'react-native-video';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PanGestureHandler, State, PinchGestureHandler } from 'react-native-gesture-handler';
import businessProfileService, { BusinessProfile } from '../services/businessProfile';
import authService from '../services/auth';
import { frames, Frame, getFramesByCategory } from '../data/frames';
import { mapBusinessProfileToFrameContent, generateLayersFromFrame, getFrameBackgroundSource } from '../utils/frameUtils';
import FrameSelector from '../components/FrameSelector';
import { GOOGLE_FONTS, getFontsByCategory, SYSTEM_FONTS, getFontFamily } from '../services/fontService';
import { useSubscription } from '../contexts/SubscriptionContext';
import Watermark from '../components/Watermark';
import videoProcessingService, { VideoLayer } from '../services/videoProcessingService';
import { useTheme } from '../context/ThemeContext';
import ViewShot from 'react-native-view-shot';
import VideoProcessor from '../components/VideoProcessor';
import { convertCanvasToVideoFormat, createSampleVideoCanvas } from '../utils/videoCanvasConverter';
import VideoComposer, { OverlayConfig, VideoLayer as ComposerVideoLayer } from '../services/VideoComposer';
import { getVideoAssetSource, getAvailableVideoNames, getRandomVideoFromAssets } from '../utils/videoAssets';
import { getVideoSource, getVideoComponentSource, getNativeVideoSource, VideoSourceConfig, clearVideoCache, getVideoCacheInfo } from '../utils/videoSourceHelper';
import { testVideoSourceHelper, debugVideoSource } from '../utils/videoSourceTest';
import VideoCompositionService, { Overlay } from '../services/CloudVideoCompositionService';
import RNFS from 'react-native-fs';
import responsiveUtils, { 
  responsiveSpacing as responsiveSpacingUtils, 
  responsiveFontSize as responsiveFontSizeUtils, 
  responsiveSize, 
  responsiveLayout, 
  responsiveShadow, 
  responsiveText, 
  responsiveGrid, 
  responsiveButton, 
  responsiveInput, 
  responsiveCard,
  isTablet,
  isLandscape 
} from '../utils/responsiveUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate video canvas dimensions - increased size with responsive design and safe area consideration
const videoCanvasWidth = Math.min(screenWidth - 24, screenWidth * 0.92); // Increased width for better visibility
const videoCanvasHeight = Math.min(screenHeight - 300, screenHeight * 0.45); // Further reduced height to account for tab bar

// Responsive design helpers - using centralized utilities

interface VideoEditorScreenProps {
  route: {
    params: {
      selectedVideo: {
        uri: string;
        title?: string;
        description?: string;
      };
      selectedLanguage: string;
      selectedTemplateId: string;
    };
  };
}

const VideoEditorScreen: React.FC<VideoEditorScreenProps> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const { selectedLanguage, selectedTemplateId, selectedVideo } = route.params;
  
  const { isSubscribed, checkPremiumAccess, refreshSubscription } = useSubscription();
  const { isDarkMode, theme } = useTheme();

  // Video refs
  const videoRef = useRef<any>(null);
  const visibleVideoRef = useRef<any>(null);
  const canvasRef = useRef<ViewShot>(null);
  const overlaysRef = useRef<ViewShot>(null);
  const lastGenerateTimeRef = useRef<number>(0);
  const [overlayImageUri, setOverlayImageUri] = useState<string | null>(null);

  // State for video layers
  const [layers, setLayers] = useState<VideoLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showFontStyleModal, setShowFontStyleModal] = useState(false);
  const [showLogoSelectionModal, setShowLogoSelectionModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [showLogoModal, setShowLogoModal] = useState(false);

  // Video state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCloudComposer, setShowCloudComposer] = useState(false);
  const [showProcessingOptions, setShowProcessingOptions] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showVideoProcessor, setShowVideoProcessor] = useState(false);
  const [generatedVideoPath, setGeneratedVideoPath] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoSource, setVideoSource] = useState<any>(null);

  // Video assets state
  const [currentVideoFromAssets, setCurrentVideoFromAssets] = useState<string>('test');
  const [availableVideos, setAvailableVideos] = useState<string[]>([]);

  // Business profiles
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<BusinessProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileSelectionModal, setShowProfileSelectionModal] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Template and frame state
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [showFrameSelector, setShowFrameSelector] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);
  const [visibleFields, setVisibleFields] = useState<{[key: string]: boolean}>({
    logo: true,
    companyName: true,
    footerCompanyName: true,
    footerBackground: true,
    phone: true,
    email: true,
    website: true,
    category: true,
    address: true,
    services: true,
  });
  const [selectedFont, setSelectedFont] = useState('System');
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('business');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Create theme-aware styles
  const getThemeStyles = () => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    modalContent: {
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: 20,
      padding: 20,
      width: screenWidth * 0.9,
      maxHeight: screenHeight * 0.95,
      shadowColor: theme?.colors?.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: isDarkMode ? 0.4 : 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginBottom: 10,
    },
    modalSubtitle: {
      fontSize: 15,
      color: theme?.colors?.textSecondary || '#666666',
      marginBottom: 20,
      fontWeight: '500' as const,
    },
    cancelButton: {
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      borderWidth: 2,
      borderColor: theme?.colors?.border || '#e9ecef',
    },
    cancelButtonText: {
      color: theme?.colors?.textSecondary || '#666666',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    profileItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: theme?.colors?.surface || '#f8f9fa',
      borderRadius: 12,
      marginBottom: 12,
    },
    profileLogoPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme?.colors?.border || '#e9ecef',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 16,
    },
    profileLogo: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginRight: 16,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: theme?.colors?.text || '#333333',
      marginBottom: 4,
    },
    profileCategory: {
      fontSize: 13,
      color: theme?.colors?.textSecondary || '#666666',
      marginBottom: 2,
    },
    profileDescription: {
      fontSize: 13,
      color: theme?.colors?.textSecondary || '#666666',
      lineHeight: 18,
    },
  });

  const themeStyles = getThemeStyles();

  // Fetch business profiles with optimized loading - now user-specific
  const fetchBusinessProfiles = async () => {
    try {
      console.log('🎬 VideoEditorScreen: Starting to fetch business profiles...');
      // Show loading state immediately
      setLoadingProfiles(true);
      
      // Get current user ID
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      console.log('🎬 VideoEditorScreen: Current user:', currentUser);
      console.log('🎬 VideoEditorScreen: User ID:', userId);
      
      if (!userId) {
        console.log('⚠️ No user ID available, using fallback business profiles');
        // Use mock data if no user ID
        const mockProfiles = [
          {
            id: '1',
            name: 'Tech Solutions Inc.',
            description: 'Leading technology solutions provider',
            category: 'Technology',
            address: '123 Innovation Drive, Tech City',
            phone: '+1 (555) 123-4567',
            email: 'contact@techsolutions.com',
            services: ['Custom Software Development', 'Web Development'],
            workingHours: {},
            rating: 4.8,
            reviewCount: 156,
            isVerified: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T14:30:00Z',
          },
          {
            id: '2',
            name: 'Creative Design Studio',
            description: 'Professional design and branding services',
            category: 'Design',
            address: '456 Creative Avenue, Design District',
            phone: '+1 (555) 987-6543',
            email: 'hello@creativedesign.com',
            services: ['Logo Design', 'Brand Identity', 'Web Design'],
            workingHours: {},
            rating: 4.9,
            reviewCount: 89,
            isVerified: true,
            createdAt: '2024-01-10T09:00:00Z',
            updatedAt: '2024-01-18T16:45:00Z',
          },
          {
            id: '3',
            name: 'Marketing Pro Agency',
            description: 'Full-service digital marketing solutions',
            category: 'Marketing',
            address: '789 Business Plaza, Downtown',
            phone: '+1 (555) 456-7890',
            email: 'info@marketingpro.com',
            services: ['Digital Marketing', 'Social Media', 'SEO'],
            workingHours: {},
            rating: 4.7,
            reviewCount: 203,
            isVerified: true,
            createdAt: '2024-01-05T14:30:00Z',
            updatedAt: '2024-01-22T11:20:00Z',
          }
        ];
        setBusinessProfiles(mockProfiles);
        console.log('🎬 VideoEditorScreen: Set mock profiles:', mockProfiles.length, 'profiles');
        
        // Show selection modal for multiple profiles
        if (mockProfiles.length > 1) {
          console.log('🎬 VideoEditorScreen: Showing profile selection modal (multiple profiles)');
          setShowProfileSelectionModal(true);
        } else {
          console.log('🎬 VideoEditorScreen: Auto-selecting single profile');
          setSelectedProfile(mockProfiles[0]);
          applyBusinessProfileToVideo(mockProfiles[0]);
        }
        return;
      }
      
      console.log('🔍 Fetching user-specific business profiles for user:', userId);
      
      // Use Promise.race to timeout quickly if API is slow
      const profilesPromise = businessProfileService.getUserBusinessProfiles(userId);
      const timeoutPromise = new Promise<BusinessProfile[]>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 8000) // 8 second timeout
      );
      
      const profiles = await Promise.race([profilesPromise, timeoutPromise]);
      
      if (profiles.length > 0) {
        setBusinessProfiles(profiles);
        console.log('🎬 VideoEditorScreen: ✅ Loaded user-specific business profiles:', profiles.length);
        console.log('🎬 VideoEditorScreen: Profile names:', profiles.map(p => p.name));
        
        if (profiles.length === 1) {
          // If only one profile, auto-select it
          console.log('🎬 VideoEditorScreen: Auto-selecting single profile:', profiles[0].name);
          setSelectedProfile(profiles[0]);
          applyBusinessProfileToVideo(profiles[0]);
        } else if (profiles.length > 1) {
          // If multiple profiles, show selection modal
          console.log('🎬 VideoEditorScreen: Showing profile selection modal (multiple profiles)');
          setShowProfileSelectionModal(true);
        }
      } else {
        console.log('⚠️ No user-specific business profiles found, using fallback');
        // Use mock data if no user profiles found
        const mockProfiles = [
          {
            id: '1',
            name: 'Tech Solutions Inc.',
            description: 'Leading technology solutions provider',
            category: 'Technology',
            address: '123 Innovation Drive, Tech City',
            phone: '+1 (555) 123-4567',
            email: 'contact@techsolutions.com',
            services: ['Custom Software Development', 'Web Development'],
            workingHours: {},
            rating: 4.8,
            reviewCount: 156,
            isVerified: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T14:30:00Z',
          },
          {
            id: '2',
            name: 'Creative Design Studio',
            description: 'Professional design and branding services',
            category: 'Design',
            address: '456 Creative Avenue, Design District',
            phone: '+1 (555) 987-6543',
            email: 'hello@creativedesign.com',
            services: ['Logo Design', 'Brand Identity', 'Web Design'],
            workingHours: {},
            rating: 4.9,
            reviewCount: 89,
            isVerified: true,
            createdAt: '2024-01-10T09:00:00Z',
            updatedAt: '2024-01-18T16:45:00Z',
          },
          {
            id: '3',
            name: 'Marketing Pro Agency',
            description: 'Full-service digital marketing solutions',
            category: 'Marketing',
            address: '789 Business Plaza, Downtown',
            phone: '+1 (555) 456-7890',
            email: 'info@marketingpro.com',
            services: ['Digital Marketing', 'Social Media', 'SEO'],
            workingHours: {},
            rating: 4.7,
            reviewCount: 203,
            isVerified: true,
            createdAt: '2024-01-05T14:30:00Z',
            updatedAt: '2024-01-22T11:20:00Z',
          }
        ];
        setBusinessProfiles(mockProfiles);
        console.log('🎬 VideoEditorScreen: Set fallback mock profiles:', mockProfiles.length, 'profiles');
        
        // Show selection modal for multiple profiles
        if (mockProfiles.length > 1) {
          console.log('🎬 VideoEditorScreen: Showing profile selection modal (fallback multiple profiles)');
          setShowProfileSelectionModal(true);
        } else {
          console.log('🎬 VideoEditorScreen: Auto-selecting fallback single profile');
          setSelectedProfile(mockProfiles[0]);
          applyBusinessProfileToVideo(mockProfiles[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching user-specific business profiles:', error);
      
      // Check if it's a timeout or network error
      if (error instanceof Error && (error.message === 'Timeout' || error.message === 'TIMEOUT' || error.message === 'NETWORK_ERROR' || error.message === 'Backend server not available')) {
        console.log('⚠️ Backend server not available, using mock data');
        console.log('⚠️ This is normal if the backend server is not running or not accessible from Android device');
      } else {
        console.log('⚠️ API error, using mock data:', error);
      }
      
      // Use mock data immediately on error
      const mockProfiles = [
        {
          id: '1',
          name: 'Tech Solutions Inc.',
          description: 'Leading technology solutions provider',
          category: 'Technology',
          address: '123 Innovation Drive, Tech City',
          phone: '+1 (555) 123-4567',
          email: 'contact@techsolutions.com',
          services: ['Custom Software Development', 'Web Development'],
          workingHours: {},
          rating: 4.8,
          reviewCount: 156,
          isVerified: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T14:30:00Z',
        },
        {
          id: '2',
          name: 'Creative Design Studio',
          description: 'Professional design and branding services',
          category: 'Design',
          address: '456 Creative Avenue, Design District',
          phone: '+1 (555) 987-6543',
          email: 'hello@creativedesign.com',
          services: ['Logo Design', 'Brand Identity', 'Web Design'],
          workingHours: {},
          rating: 4.9,
          reviewCount: 89,
          isVerified: true,
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-18T16:45:00Z',
        },
        {
          id: '3',
          name: 'Marketing Pro Agency',
          description: 'Full-service digital marketing solutions',
          category: 'Marketing',
          address: '789 Business Plaza, Downtown',
          phone: '+1 (555) 456-7890',
          email: 'info@marketingpro.com',
          services: ['Digital Marketing', 'Social Media', 'SEO'],
          workingHours: {},
          rating: 4.7,
          reviewCount: 203,
          isVerified: true,
          createdAt: '2024-01-05T14:30:00Z',
          updatedAt: '2024-01-22T11:20:00Z',
        }
      ];
      setBusinessProfiles(mockProfiles);
      console.log('🎬 VideoEditorScreen: Set error fallback mock profiles:', mockProfiles.length, 'profiles');
      
      // Show selection modal for multiple profiles
      if (mockProfiles.length > 1) {
        console.log('🎬 VideoEditorScreen: Showing profile selection modal (error fallback multiple profiles)');
        setShowProfileSelectionModal(true);
      } else {
        console.log('🎬 VideoEditorScreen: Auto-selecting error fallback single profile');
        setSelectedProfile(mockProfiles[0]);
        applyBusinessProfileToVideo(mockProfiles[0]);
      }
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    console.log('🎬 VideoEditorScreen: useEffect triggered, businessProfiles.length:', businessProfiles.length);
    // Only fetch profiles if we don't have any cached data
    if (businessProfiles.length === 0) {
      console.log('🎬 VideoEditorScreen: No cached profiles, calling fetchBusinessProfiles()');
      fetchBusinessProfiles();
    } else {
      console.log('🎬 VideoEditorScreen: Using cached profiles, skipping fetch');
    }
  }, []);

  // Load available videos from assets
  useEffect(() => {
    const loadAvailableVideos = () => {
      try {
        const videoNames = getAvailableVideoNames();
        setAvailableVideos(videoNames);
        console.log('📹 Available videos loaded:', videoNames);
        
        // Set default video if none selected
        if (videoNames.length > 0 && !currentVideoFromAssets) {
          setCurrentVideoFromAssets(videoNames[0]);
        }
      } catch (error) {
        console.error('❌ Failed to load available videos:', error);
      }
    };
    
    loadAvailableVideos();
  }, []);

  // Debug native modules availability
  useEffect(() => {
    console.log('🔍 Debugging native modules availability:');
    console.log('- VideoComposer available:', !!VideoComposer);
    console.log('- VideoComposer module:', VideoComposer);
    console.log('- All native modules:', Object.keys(NativeModules));
    console.log('- NativeModules object:', NativeModules);
  }, []);

  // Apply default template when component loads
  useEffect(() => {
    console.log('useEffect triggered - selectedProfile:', selectedProfile?.name, 'selectedTemplate:', selectedTemplate); // Debug log
    if (selectedProfile) {
      applyTemplate(selectedTemplate);
    } else {
      // Apply template even without profile to test
      console.log('No profile selected, applying template with defaults'); // Debug log
      applyTemplate(selectedTemplate);
    }
  }, [selectedProfile, selectedTemplate]);

  // Force apply template on mount
  useEffect(() => {
    console.log('Component mounted, applying business template'); // Debug log
    setTimeout(() => {
      applyTemplate('business');
    }, 1000); // Apply after 1 second
  }, []);

  // Apply business profile to video
  const applyBusinessProfileToVideo = (profile: BusinessProfile) => {
    setSelectedProfile(profile);
    setShowProfileModal(false);
    setShowProfileSelectionModal(false);
    
    // Apply the current template with the new profile
    applyTemplate(selectedTemplate);
  };

  const applyFrame = useCallback((frame: Frame) => {
    setSelectedFrame(frame);
    setShowFrameSelector(false);
    if (selectedProfile) {
      const content = mapBusinessProfileToFrameContent(selectedProfile);
      const frameLayers = generateLayersFromFrame(frame, content, screenWidth, screenHeight);
      // Map to VideoLayer with fieldType preserved
      const converted = frameLayers.map(fl => ({
        id: fl.id,
        type: fl.type as 'text' | 'image' | 'logo',
        content: fl.content,
        position: fl.position,
        size: fl.size,
        style: fl.style,
        fieldType: (fl as any).fieldType,
      })) as VideoLayer[];
      setLayers(converted);
    }
  }, [selectedProfile]);

  const toggleFieldVisibility = useCallback((field: string) => {
    setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Video Processing Functions
  const handleVideoGenerated = useCallback((videoPath: string) => {
    setGeneratedVideoPath(videoPath);
    console.log('✅ Video generated successfully:', videoPath);
    
    // Show success message
    Alert.alert(
      'Video Generated!',
      'Your video has been created successfully. You can now share or download it.',
      [
        {
          text: 'View Video',
          onPress: () => {
            // Navigate to video viewer or open video player
            console.log('Opening video:', videoPath);
          },
        },
        {
          text: 'OK',
          onPress: () => {
            console.log('Video generation completed');
          },
        },
      ]
    );
  }, []);

  // Get current video source for React Native Video component
  const getCurrentVideoSource = useCallback(() => {
    // Use the selected video from route params
    console.log('📹 Getting video component source from selectedVideo:', selectedVideo);
    return selectedVideo;
  }, [selectedVideo]);

  // Load video source on component mount
  useEffect(() => {
    const source = getCurrentVideoSource();
    setVideoSource(source);
    console.log('📹 Video source loaded:', source);
  }, [getCurrentVideoSource]);

  // Helper function to copy asset to local file and return file:// path
  const copyAssetToLocalFile = useCallback(async (assetPath: string, fileName: string = 'test.mp4'): Promise<string> => {
    try {
      console.log('📁 copyAssetToLocalFile: Starting asset copy process...');
      console.log('📁 Asset path:', assetPath);
      console.log('📁 Target filename:', fileName);
      
      // Resolve the asset using Image.resolveAssetSource
      const resolvedAsset = Image.resolveAssetSource(require('../assets/video/test.mp4'));
      console.log('📁 Resolved asset source:', resolvedAsset);
      
      if (!resolvedAsset?.uri) {
        throw new Error('Could not resolve asset URI from require()');
      }
      
      const originalUri = resolvedAsset.uri;
      console.log('📁 Original asset URI:', originalUri);
      
      // Create local storage path
      const localPath = RNFS.DocumentDirectoryPath + '/' + fileName;
      console.log('📁 Target local path:', localPath);
      
      // Always overwrite the file to ensure fresh MP4 each time
      console.log('📁 Copying asset to local storage (overwriting if exists)...');
      
      // Determine if it's a Metro URL or local file
      const isMetroUrl = originalUri.startsWith('http://localhost:8081') || originalUri.startsWith('https://localhost:8081');
      console.log('📁 Is Metro URL:', isMetroUrl);
      
      if (isMetroUrl) {
        console.log('📁 Downloading from Metro server...');
        
        // Download from Metro server (this will overwrite existing file)
        const downloadResult = await RNFS.downloadFile({
          fromUrl: originalUri,
          toFile: localPath,
        }).promise;
        
        console.log('📁 Download result:', downloadResult);
        
        if (downloadResult.statusCode === 200) {
          console.log('✅ Video downloaded successfully from Metro server');
        } else {
          throw new Error(`Metro download failed with status: ${downloadResult.statusCode}`);
        }
      } else {
        console.log('📁 Copying from local bundled asset...');
        
        // Copy from local bundled asset (this will overwrite existing file)
        await RNFS.copyFile(originalUri, localPath);
        console.log('✅ Video file copied successfully from bundled asset');
      }
      
      // Validate the copied file
      const fileStats = await RNFS.stat(localPath);
      console.log('📁 Copied file stats:', fileStats);
      
      if (fileStats.size === 0) {
        throw new Error('Copied video file is empty');
      }
      
      // Return file:// URI
      const fileUri = 'file://' + localPath;
      console.log('📁 Returning file:// URI:', fileUri);
      console.log('📁 File size:', fileStats.size, 'bytes');
      
      return fileUri;
    } catch (error) {
      console.error('🚨 copyAssetToLocalFile failed:', error);
      throw new Error(`Failed to copy asset to local file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Get current video URI for native module - USES NEW HELPER FOR PLATFORM-SPECIFIC SOURCES
  const getCurrentVideoUri = useCallback(async () => {
    try {
      console.log('🎬 Starting video source resolution...');
      
      // Use new video source helper for platform-specific sources
      const videoUri = await getNativeVideoSource({
        fileName: 'test',
        useRemote: false, // Use local files first
      });
      
      console.log('✅ Video source resolution completed');
      console.log('📁 Final video URI:', videoUri);
      
      return videoUri;
    } catch (error) {
      console.error('🚨 Failed to get current video URI:', error);
      throw new Error(`Failed to get video URI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // New direct video generation function
  const handleGenerateVideo = useCallback(async () => {
    if (layers.length === 0) {
      Alert.alert('No Content', 'Please add some content to your video before generating.');
      return;
    }
    
    // FFmpeg-based processing doesn't require VideoComposer module
    console.log('🎬 Using FFmpeg-based video processing service');

    // Prevent multiple simultaneous calls
    if (isProcessing) {
      console.log('⚠️ Video generation already in progress, skipping...');
      return;
    }

    // Debounce: prevent rapid successive calls (minimum 2 seconds between calls)
    const now = Date.now();
    const timeSinceLastCall = now - lastGenerateTimeRef.current;
    if (timeSinceLastCall < 2000) {
      console.log('⚠️ Video generation called too soon, debouncing...');
      return;
    }
    lastGenerateTimeRef.current = now;

    try {
      setIsProcessing(true);
      setProcessingProgress(0);

      console.log('🎬 Starting direct video generation...');
      console.log('- Layers count:', layers.length);
      
      // Get video source once and store it - now async
      console.log('📁 Preparing local video file for VideoComposer...');
      const currentVideoSource = await getCurrentVideoUri();
      console.log('📁 Current video source (file:// path):', currentVideoSource);
      console.log('📁 Path type:', typeof currentVideoSource);
      console.log('📁 Path length:', currentVideoSource.length);
      console.log('📁 Path starts with file://:', currentVideoSource.startsWith('file://'));

      // Capture canvas content if available
      let canvasImageUri: string | undefined;
      if (canvasRef.current && canvasRef.current.capture) {
        try {
          console.log('📸 Capturing canvas content...');
          const canvasImage = await canvasRef.current.capture();
          canvasImageUri = canvasImage;
          console.log('✅ Canvas captured:', canvasImageUri);
        } catch (error) {
          console.warn('⚠️ Canvas capture failed:', error);
        }
      }

      // FFmpeg processing uses layers directly, no need for overlay config

      // Validate file existence before calling FFmpeg service
      const filePath = currentVideoSource.replace('file://', '');
      console.log('📁 Checking file existence at:', filePath);
      
      const fileExists = await RNFS.exists(filePath);
      console.log('📁 File exists:', fileExists);
      
      if (!fileExists) {
        throw new Error(`Source video file does not exist: ${filePath}`);
      }
      
      // Get file stats for additional validation
      const fileStats = await RNFS.stat(filePath);
      console.log('📁 File stats:', fileStats);
      
      if (fileStats.size === 0) {
        throw new Error(`Source video file is empty: ${filePath}`);
      }
      
      console.log('✅ File validation passed, proceeding with FFmpeg processing...');
      console.log('🎯 Calling videoProcessingService.processVideo...');
      console.log('📁 Source path (file:// URI):', currentVideoSource);
      console.log('📁 Source path type:', typeof currentVideoSource);
      console.log('📁 Source path starts with file://:', currentVideoSource.startsWith('file://'));
      console.log('📁 Layers count:', layers.length);

      // Call FFmpeg-based video processing service
      const processedVideoPath = await videoProcessingService.processVideo(
        currentVideoSource,
        layers,
        {
          width: videoCanvasWidth,
          height: videoCanvasHeight,
          quality: 'high',
          frameRate: 30,
        }
      );

      console.log('✅ Video generation completed!');
      console.log('- Processed video path:', processedVideoPath);

      // Navigate to video preview
    navigation.navigate('VideoPreview', {
        selectedVideo: { uri: currentVideoSource },
        selectedLanguage: 'en',
        selectedTemplateId: 'custom',
      layers: layers,
        selectedProfile: selectedProfile,
        processedVideoPath: processedVideoPath,
        canvasData: {
          width: videoCanvasWidth,
          height: videoCanvasHeight,
          layers: layers,
        },
      });

    } catch (error) {
      console.error('🚨 Video generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Generation Failed', `Video generation failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [layers, isProcessing, videoCanvasWidth, videoCanvasHeight, selectedProfile, navigation]);

  // Cloud processing function
  const handleCloudProcessing = useCallback(async () => {
    console.log('🔍 DEBUG: ===== CLOUD PROCESSING BUTTON CLICKED =====');
    console.log('🔍 DEBUG: handleCloudProcessing function started');
    console.log('🔍 DEBUG: Current timestamp:', new Date().toISOString());
    
    // Show immediate feedback that button was clicked
    Alert.alert('Debug', 'Cloud processing button clicked! Check console logs.');
    
    console.log('🚀 handleCloudProcessing called!');
    console.log('🔍 Current layers state:', layers);
    console.log('🔍 Layers length:', layers.length);
    
      // Add timeout to prevent hanging (reduced to 5 minutes for smaller video)
      const timeoutId = setTimeout(() => {
        console.log('🔍 DEBUG: Processing timeout reached (5 minutes)');
        setIsProcessing(false);
        setProcessingProgress(0);
        Alert.alert('Timeout', 'Processing took too long. The video may still be processing in the background. Please check again later.');
      }, 300000); // 5 minute timeout (300 seconds)
    
    try {
      if (layers.length === 0) {
        console.log('⚠️ No layers found, but continuing with test overlay...');
        // Don't return early - let's test with a fallback overlay
      }

      if (isProcessing) {
        console.log('⚠️ Video generation already in progress, skipping...');
        return;
      }
      setIsProcessing(true);
      setProcessingProgress(0);

      console.log('🌐 Starting cloud video composition...');
      console.log('- Video source: Using selected video from route params');
      console.log('- CSS Overlays: These are rendered in frontend, not sent to backend');

      console.log('🔍 DEBUG: About to initialize VideoCompositionService...');
      console.log('🔍 DEBUG: Service URL will be: http://localhost:8000');
      
      const compositionService = new VideoCompositionService('http://localhost:8000');
      
      console.log('🔍 DEBUG: VideoCompositionService initialized successfully');
      console.log('🔍 DEBUG: About to check server health...');
      
      // Skip server health check for now - server is working
      console.log('🔍 Skipping server health check - server is working');
      console.log('✅ Proceeding directly to video processing...');
      
      // Force bypass health check
      const isHealthy = true; // Force true to bypass check
      console.log('🔍 Forced health check result:', isHealthy);

      // Debug layers array
      console.log('🔍 DEBUGGING LAYERS ARRAY:');
      console.log('- Raw layers array:', JSON.stringify(layers, null, 2));
      console.log('- Layers length:', layers.length);
      
      // Check each layer individually
      layers.forEach((layer, index) => {
        console.log(`- Layer ${index}:`, {
          type: layer.type,
          content: layer.content,
          hasContent: !!layer.content,
          contentType: typeof layer.content
        });
      });

      // Convert CSS layers to Django API overlay format
      const overlays: Overlay[] = [];
      
      console.log('🔍 Converting CSS layers to Django overlays:');
      console.log('- Total layers:', layers.length);
      
      layers.forEach((layer, index) => {
        console.log(`- Processing layer ${index + 1}:`, {
          id: layer.id,
          type: layer.type,
          content: layer.content,
          hasContent: !!layer.content,
          hasBackgroundColor: !!layer.style?.backgroundColor,
          position: layer.position,
          style: layer.style,
          fieldType: layer.fieldType,
          size: layer.size
        });
        
        if (layer.type === 'text') {
          // Handle background layers (they have backgroundColor but no text content)
          if (layer.style?.backgroundColor && !layer.content) {
            console.log(`- Processing background layer ${index + 1}: has backgroundColor`);
            overlays.push({
              type: 'text',
              text: '', // Empty text for background
              x: Math.round(layer.position.x),
              y: Math.round(layer.position.y),
              start: 0,
              end: 5
            });
            return;
          }
          
          // Only process layers with actual text content
          if (layer.content && layer.content.trim()) {
            // Extract actual styling from layer
            const fontSize = layer.style?.fontSize || 18;
            const color = layer.style?.color || '#ffffff';
            const fontWeight = layer.style?.fontWeight || 'normal';
            
            overlays.push({
              type: 'text',
              text: layer.content.trim(),
              x: Math.round(layer.position.x),
              y: Math.round(layer.position.y),
              fontsize: fontSize,
              color: color.replace('#', ''), // Remove # for FFmpeg
              start: 0, // Show from start
              end: 5 // Show for 5 seconds
            });
            console.log(`- Text overlay ${index + 1}: "${layer.content}" at (${layer.position.x}, ${layer.position.y}) with color ${color} and size ${fontSize}`);
          } else {
            console.log(`- Skipping text layer ${index + 1}: no content or empty content`);
          }
        } else if (layer.type === 'image' || layer.type === 'logo') {
          // For image overlays, use the actual logo content/URL from the layer
          const logoPath = layer.content || 'src/assets/images/9.png'; // Use actual logo content
          overlays.push({
            type: 'image',
            path: logoPath, // Use actual logo content instead of hardcoded path
            x: Math.round(layer.position.x),
            y: Math.round(layer.position.y),
            start: 0, // Show from start
            end: 5 // Show for 5 seconds
          });
          console.log(`- Image overlay ${index + 1}: "${logoPath}" at (${layer.position.x}, ${layer.position.y})`);
          console.log(`- Logo layer content: "${layer.content}"`);
        }
      });
      
      console.log('- Converted overlays:', overlays.length);
      console.log('- Overlay details:', overlays.map((overlay, index) => ({
        index: index + 1,
        type: overlay.type,
        x: overlay.x,
        y: overlay.y
      })));

        // Get the proper video URI for cloud processing
        // Use the selected video from route params
        const videoUri = selectedVideo.uri;
      
      console.log('🚀 Starting cloud composition with:', {
        videoUri: videoUri,
        overlayCount: overlays.length,
        overlays: overlays,
        note: 'Using local video file for Django backend processing'
      });

      console.log('📤 About to call composeVideo with:');
      console.log('- videoPath:', videoUri);
      console.log('- overlays:', overlays);
      console.log('- overlays.length:', overlays.length);
      console.log('🔍 DEBUG: About to call compositionService.composeVideo...');
      console.log('🔍 DEBUG: Service instance:', compositionService);

      const result = await compositionService.composeVideo(
        videoUri,
        overlays,
        {
          outputName: `result_${Date.now()}.mp4`
        },
        (progressUpdate) => {
          setProcessingProgress(progressUpdate.progress);
          console.log(`📊 Progress: ${progressUpdate.stage} - ${progressUpdate.progress}%`);
        }
      );

      if (result.success && result.videoPath) {
        console.log('✅ Cloud composition completed!');
        console.log('📁 Processed video path:', result.videoPath);
        console.log('📁 Original video path:', videoUri);
        console.log('📝 Note: CSS overlays will be applied in VideoPreviewScreen');
        
        // Navigate to video preview
        navigation.navigate('VideoPreview', {
          selectedVideo: { uri: videoUri }, // Keep original video as selectedVideo
          selectedLanguage: 'en',
          selectedTemplateId: 'custom',
          layers: layers,
          selectedProfile: selectedProfile,
          processedVideoPath: result.videoPath, // Pass processed video as processedVideoPath
          canvasData: {
            width: videoCanvasWidth,
            height: videoCanvasHeight,
            layers: layers,
          },
        });
      } else {
        throw new Error(result.error || 'Cloud composition failed');
      }

    } catch (error) {
      console.error('❌ Cloud processing failed:', (error as Error).message);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Cloud Processing Failed', `Cloud processing failed: ${errorMessage}`);
    } finally {
      console.log('🔍 DEBUG: Cleaning up - clearing timeout and resetting state');
      clearTimeout(timeoutId);
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [layers, selectedVideo, isProcessing, videoCanvasWidth, videoCanvasHeight, selectedProfile, navigation]);

  const createVideoCanvas = useCallback(() => {
    // Convert current layers to video canvas format
    const videoCanvas = {
      id: `canvas_${Date.now()}`,
      name: selectedProfile ? `${selectedProfile.name} Video` : 'My Video',
      duration: videoDuration || 10,
      width: 1920,
      height: 1080,
      fps: 30,
      layers: layers.map((layer, index) => ({
        id: layer.id || `layer_${index}`,
        type: layer.type as 'text' | 'image' | 'logo',
        content: layer.content || '',
        position: { x: layer.position?.x || 0, y: layer.position?.y || 0 },
        size: { width: layer.size?.width || 100, height: layer.size?.height || 100 },
        style: layer.style,
        fieldType: layer.fieldType,
      })),
      backgroundColor: '#000000',
    };

    return videoCanvas;
  }, [layers, selectedProfile, videoDuration]);

  // Apply template function
  const applyTemplate = (template: string) => {
    setSelectedTemplate(template);
    console.log('Applying template:', template); // Debug log
    
    // Apply different styling based on template
    const newLayers: VideoLayer[] = [];
    
    if (selectedProfile) {
      console.log('Selected profile:', selectedProfile.name); // Debug log
      
      // Add company name on top left corner with responsive positioning
      if (selectedProfile.name) {
        const companyNameWidth = Math.min(videoCanvasWidth - 120, 300); // Responsive width
        const companyNameFontSize = template === 'business' ? 18 : template === 'event' ? 22 : 16;
        
        newLayers.push({
          id: generateId(),
          type: 'text',
          content: selectedProfile.name,
          position: { x: 20, y: 20 },
          size: { width: companyNameWidth, height: 40 },
          style: {
            fontSize: companyNameFontSize,
            color: template === 'business' ? '#ffffff' : template === 'event' ? '#ff6b6b' : '#333333',
            fontFamily: 'System',
            fontWeight: 'bold',
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 3,
          },
          fieldType: 'companyName',
        });
      }

      // Add logo on top right corner with responsive positioning
      if (selectedProfile.logo) {
        const logoSize = Math.min(60, videoCanvasWidth * 0.15); // Responsive logo size
        newLayers.push({
          id: generateId(),
          type: 'logo',
          content: selectedProfile.logo,
          position: { x: videoCanvasWidth - logoSize - 20, y: 20 },
          size: { width: logoSize, height: logoSize },
          fieldType: 'logo',
        });
      } else {
        // Add a test logo if no logo is available
        const logoSize = Math.min(60, videoCanvasWidth * 0.15);
        newLayers.push({
          id: generateId(),
          type: 'logo',
          content: 'https://picsum.photos/100/100.jpg',
          position: { x: videoCanvasWidth - logoSize - 20, y: 20 },
          size: { width: logoSize, height: logoSize },
          fieldType: 'logo',
        });
      }

      // Create professional footer with contact information - always at bottom
      const footerHeight = Math.max(80, videoCanvasHeight * 0.12); // Reduced footer height to reasonable size
      const footerY = videoCanvasHeight - footerHeight - Math.max(10, videoCanvasHeight * 0.02); // Always at bottom with small margin
      
      console.log('Footer positioning debug:', {
        screenHeight,
        videoCanvasHeight,
        footerHeight,
        footerY,
        videoCanvasWidth
      });
      

      

      
      // Footer background overlay for better readability
      newLayers.push({
        id: generateId(),
        type: 'text',
        content: '',
        position: { x: 0, y: footerY },
        size: { width: videoCanvasWidth, height: footerHeight },
        style: {
          backgroundColor: template === 'business' ? 'rgba(102, 126, 234, 0.9)' : 
                          template === 'event' ? 'rgba(255, 107, 107, 0.9)' : 
                          template === 'restaurant' ? 'rgba(255, 167, 38, 0.9)' : 
                          'rgba(236, 64, 122, 0.9)',
        },
        fieldType: 'footerBackground',
      });

      // Company name in footer
      if (selectedProfile.name) {
        newLayers.push({
          id: generateId(),
          type: 'text',
          content: selectedProfile.name,
          position: { x: 20, y: footerY + 10 },
          size: { width: videoCanvasWidth - 40, height: 20 },
          style: {
            fontSize: 16,
            color: '#ffffff',
            fontFamily: 'System',
            fontWeight: '600',
          },
          fieldType: 'footerCompanyName',
        });
      }

      // Contact information in two columns
      const leftColumnX = 20;
      const rightColumnX = videoCanvasWidth / 2 + 10;
      const contactStartY = footerY + 35;
      const contactLineHeight = 14;

      // Left column - Phone and Email
      if (selectedProfile.phone) {
        newLayers.push({
          id: generateId(),
          type: 'text',
          content: `📞 ${selectedProfile.phone}`,
          position: { x: leftColumnX, y: contactStartY },
          size: { width: (videoCanvasWidth - 40) / 2, height: contactLineHeight },
          style: {
            fontSize: 12,
            color: '#ffffff',
            fontFamily: 'System',
            fontWeight: '500',
          },
          fieldType: 'phone',
        });
      }

      if (selectedProfile.email) {
        newLayers.push({
          id: generateId(),
          type: 'text',
          content: `✉️ ${selectedProfile.email}`,
          position: { x: leftColumnX, y: contactStartY + contactLineHeight },
          size: { width: (videoCanvasWidth - 40) / 2, height: contactLineHeight },
          style: {
            fontSize: 12,
            color: '#ffffff',
            fontFamily: 'System',
            fontWeight: '500',
          },
          fieldType: 'email',
        });
      }

      // Right column - Website and Category
      if (selectedProfile.website) {
        newLayers.push({
          id: generateId(),
          type: 'text',
          content: `🌐 ${selectedProfile.website}`,
          position: { x: rightColumnX, y: contactStartY },
          size: { width: (videoCanvasWidth - 40) / 2, height: contactLineHeight },
          style: {
            fontSize: 12,
            color: '#ffffff',
            fontFamily: 'System',
            fontWeight: '500',
          },
          fieldType: 'website',
        });
      }

      if (selectedProfile.category) {
        newLayers.push({
          id: generateId(),
          type: 'text',
          content: `🏢 ${selectedProfile.category}`,
          position: { x: rightColumnX, y: contactStartY + contactLineHeight },
          size: { width: (videoCanvasWidth - 40) / 2, height: contactLineHeight },
          style: {
            fontSize: 12,
            color: '#ffffff',
            fontFamily: 'System',
            fontWeight: '500',
          },
          fieldType: 'category',
        });
      }

      // Address on a separate line (full width)
      if (selectedProfile.address) {
        newLayers.push({
          id: generateId(),
          type: 'text',
          content: `📍 ${selectedProfile.address}`,
          position: { x: 20, y: contactStartY + contactLineHeight * 2 + 5 },
          size: { width: videoCanvasWidth - 40, height: contactLineHeight },
          style: {
            fontSize: 12,
            color: '#ffffff',
            fontFamily: 'System',
            fontWeight: '500',
          },
          fieldType: 'address',
        });
      }

      // Services as a tag line
      if (selectedProfile.services && selectedProfile.services.length > 0) {
        const servicesText = selectedProfile.services.slice(0, 3).join(' • ');
        newLayers.push({
          id: generateId(),
          type: 'text',
          content: `🛠️ ${servicesText}${selectedProfile.services.length > 3 ? '...' : ''}`,
          position: { x: 20, y: contactStartY + contactLineHeight * 3 + 10 },
          size: { width: videoCanvasWidth - 40, height: contactLineHeight },
          style: {
            fontSize: 11,
            color: '#ffffff',
            fontFamily: 'System',
            fontWeight: '500',
          },
          fieldType: 'services',
        });
      }
    } else {
      // If no profile is selected, create default layers for the template
      newLayers.push({
        id: generateId(),
        type: 'text',
        content: 'Company Name',
        position: { x: 20, y: 20 },
        size: { width: videoCanvasWidth - 100, height: 40 },
        style: {
          fontSize: template === 'business' ? 20 : template === 'event' ? 24 : 18,
          color: template === 'business' ? '#ffffff' : template === 'event' ? '#ff6b6b' : '#333333',
          fontFamily: 'System',
          fontWeight: 'bold',
          textShadowColor: 'rgba(0, 0, 0, 0.8)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 3,
        },
        fieldType: 'companyName',
      });

      // Create professional footer with contact information (default) - always at bottom
      const footerHeight = Math.max(80, videoCanvasHeight * 0.12); // Reduced footer height to reasonable size
      const footerY = videoCanvasHeight - footerHeight - Math.max(10, videoCanvasHeight * 0.02); // Always at bottom with small margin
      

      
      // Footer background overlay for better readability
      newLayers.push({
        id: generateId(),
        type: 'text',
        content: '',
        position: { x: 0, y: footerY },
        size: { width: videoCanvasWidth, height: footerHeight },
        style: {
          backgroundColor: template === 'business' ? 'rgba(102, 126, 234, 0.9)' : 
                          template === 'event' ? 'rgba(255, 107, 107, 0.9)' : 
                          template === 'restaurant' ? 'rgba(255, 167, 38, 0.9)' : 
                          'rgba(236, 64, 122, 0.9)',
        },
        fieldType: 'footerBackground',
      });

      // Company name in footer
      newLayers.push({
        id: generateId(),
        type: 'text',
        content: 'Company Name',
        position: { x: 20, y: footerY + 10 },
        size: { width: videoCanvasWidth - 40, height: 20 },
        style: {
          fontSize: 16,
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '600',
        },
        fieldType: 'footerCompanyName',
      });

      // Contact information in two columns
      const leftColumnX = 20;
      const rightColumnX = videoCanvasWidth / 2 + 10;
      const contactStartY = footerY + 35;
      const contactLineHeight = 14;

      // Left column - Phone and Email
      newLayers.push({
        id: generateId(),
        type: 'text',
        content: '📞 +1 (555) 123-4567',
        position: { x: leftColumnX, y: contactStartY },
        size: { width: (videoCanvasWidth - 40) / 2, height: contactLineHeight },
        style: {
          fontSize: 11,
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
        fieldType: 'phone',
      });

      newLayers.push({
        id: generateId(),
        type: 'text',
        content: '✉️ info@company.com',
        position: { x: leftColumnX, y: contactStartY + contactLineHeight },
        size: { width: (videoCanvasWidth - 40) / 2, height: contactLineHeight },
        style: {
          fontSize: 11,
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
        fieldType: 'email',
      });

      // Right column - Website and Category
      newLayers.push({
        id: generateId(),
        type: 'text',
        content: '🌐 www.company.com',
        position: { x: rightColumnX, y: contactStartY },
        size: { width: (videoCanvasWidth - 40) / 2, height: contactLineHeight },
        style: {
          fontSize: 11,
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
        fieldType: 'website',
      });

      newLayers.push({
        id: generateId(),
        type: 'text',
        content: '🏢 Business Category',
        position: { x: rightColumnX, y: contactStartY + contactLineHeight },
        size: { width: (videoCanvasWidth - 40) / 2, height: contactLineHeight },
        style: {
          fontSize: 11,
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
        fieldType: 'category',
      });

      // Address on a separate line (full width)
      newLayers.push({
        id: generateId(),
        type: 'text',
        content: '📍 123 Business Street, City, State 12345',
        position: { x: 20, y: contactStartY + contactLineHeight * 2 + 5 },
        size: { width: videoCanvasWidth - 40, height: contactLineHeight },
        style: {
          fontSize: 11,
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
        fieldType: 'address',
      });

      // Services as a tag line
      newLayers.push({
        id: generateId(),
        type: 'text',
        content: '🛠️ Service 1 • Service 2 • Service 3...',
        position: { x: 20, y: contactStartY + contactLineHeight * 3 + 10 },
        size: { width: videoCanvasWidth - 40, height: contactLineHeight },
        style: {
          fontSize: 10,
          color: '#ffffff',
          fontFamily: 'System',
          fontWeight: '400',
        },
        fieldType: 'services',
      });
    }
    
    // Footer positioning issue resolved
    
    // Test layers removed - footer is working correctly
    
    // Footer is now working correctly - test layer removed

    console.log('New layers:', newLayers.length); // Debug log
    console.log('Layer details:', newLayers.map(l => ({ id: l.id, type: l.type, fieldType: l.fieldType, content: l.content?.substring(0, 20) })));
    setLayers(newLayers);
  };

  const onVideoProgress = (data: any) => {
    setCurrentTime(data.currentTime);
  };

  const onVideoError = (error: any) => {
    console.error('🚨 Video playback error:', error);
    Alert.alert('Video Error', `Video playback failed: ${error.error?.errorString || 'Unknown error'}`);
  };

  const onVideoLoadStart = () => {
    console.log('📹 Video load started');
  };

  const onVideoLoad = (data: any) => {
    console.log('📹 Video loaded successfully:', data);
    setVideoDuration(data.duration);
  };

  // Layer management
  const addTextLayer = () => {
    const newLayer: VideoLayer = {
      id: generateId(),
      type: 'text',
      content: 'New Text',
      position: { x: screenWidth / 2 - 50, y: screenHeight / 2 - 20 },
      size: { width: 100, height: 40 },
      style: {
        fontSize: 20,
        color: '#ffffff',
        fontFamily: selectedFont,
        fontWeight: 'normal',
      },
    };
    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
    setShowTextModal(false);
  };

  const addImageLayer = () => {
    const newLayer: VideoLayer = {
      id: generateId(),
      type: 'image',
      content: newImageUrl,
      position: { x: 50, y: 100 },
      size: { width: 150, height: 150 },
    };
    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
    setShowImageModal(false);
    setNewImageUrl('');
  };

  const addLogoLayer = () => {
    const newLayer: VideoLayer = {
      id: generateId(),
      type: 'logo',
      content: newLogoUrl,
      position: { x: screenWidth - 100, y: 50 },
      size: { width: 80, height: 80 },
    };
    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
    setShowLogoModal(false);
    setNewLogoUrl('');
  };

  const updateLayer = (layerId: string, updates: Partial<VideoLayer>) => {
    setLayers(layers.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ));
  };

  const deleteLayer = (layerId: string) => {
    setLayers(layers.filter(layer => layer.id !== layerId));
    if (selectedLayer === layerId) {
      setSelectedLayer(null);
    }
  };

  // Camera and gallery access
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleCameraAccess = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets[0]) {
        setNewImageUrl(result.assets[0].uri || '');
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const handleGalleryAccess = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets[0]) {
        setNewImageUrl(result.assets[0].uri || '');
      }
    } catch (error) {
      console.error('Gallery error:', error);
    }
  };

  // Font handling
  const handleFontSelect = (fontFamily: string) => {
    setSelectedFont(fontFamily);
    if (selectedLayer) {
      updateLayer(selectedLayer, {
        style: { ...layers.find(l => l.id === selectedLayer)?.style, fontFamily }
      });
    }
    setShowFontModal(false);
  };

  // Navigation
  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = async () => {
    if (layers.length === 0) {
      Alert.alert('No Content', 'Please add at least one text, image, or logo layer to your video.');
      return;
    }

    // Capture overlays-only transparent PNG for processing
    try {
      if (overlaysRef.current && (overlaysRef.current as any).capture) {
        const uri = await (overlaysRef.current as any).capture?.();
        if (uri) {
          setOverlayImageUri(uri);
          console.log('Overlay PNG captured at:', uri);
        }
      }
    } catch (e) {
      console.warn('Overlay capture failed, continuing without overlay PNG', e);
      setOverlayImageUri(null);
    }

    // Show the video processor modal
    setShowVideoProcessor(true);
  };

  const handleVideoProcessingComplete = (processedVideoPath: string) => {
    console.log('Video processing completed. Processed video path:', processedVideoPath);

    // Navigate to video preview screen with processed video and layer data
    navigation.navigate('VideoPreview', {
      selectedVideo: {
        ...selectedVideo,
        uri: processedVideoPath, // Use processed video path
      },
      selectedLanguage,
      selectedTemplateId,
      layers, // Pass layers for rendering in preview
      selectedProfile,
      processedVideoPath: processedVideoPath, // Pass the processed video path
      canvasData: {
        width: videoCanvasWidth,
        height: videoCanvasHeight,
        layers: layers,
      },
    });

    // Close the video processor modal
    setShowVideoProcessor(false);
  };

  const handleVideoProcessingClose = () => {
    setShowVideoProcessor(false);
  };

  // Render functions
  const renderLayer = (layer: VideoLayer) => {
    const isSelected = selectedLayer === layer.id;
    
    const handleLayerPress = () => {
      setSelectedLayer(layer.id);
    };

    console.log('Rendering layer:', layer.type, layer.content, layer.style); // Debug log

    return (
      <TouchableOpacity
        key={layer.id}
        style={[
          styles.layer,
          {
            position: 'absolute',
            left: layer.position.x,
            top: layer.position.y,
            width: layer.size.width,
            height: layer.size.height,
            zIndex: layers.indexOf(layer) + 1, // Use array index for zIndex
          },
          isSelected && styles.selectedLayer,
        ]}
        onPress={handleLayerPress}
      >
        {layer.type === 'text' && (
          layer.style?.backgroundColor ? (
            // Background layer (footer background)
            <View
              style={[
                {
                  width: '100%',
                  height: '100%',
                  backgroundColor: layer.style.backgroundColor,
                },
              ]}
            />
          ) : (
            // Text layer
            <Text
              style={[
                styles.layerText,
                layer.style,
              ]}
            >
              {layer.content}
            </Text>
          )
        )}
        {layer.type === 'image' && (
          <Image
            source={{ uri: layer.content }}
            style={styles.layerImage}
            resizeMode="cover"
          />
        )}
        {layer.type === 'logo' && (
          <Image
            source={{ uri: layer.content }}
            style={styles.layerLogo}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderProfileItem = ({ item }: { item: BusinessProfile }) => (
    <TouchableOpacity
      style={themeStyles.profileItem}
      onPress={() => applyBusinessProfileToVideo(item)}
    >
      {item.logo ? (
        <Image source={{ uri: item.logo }} style={themeStyles.profileLogo} />
      ) : (
        <View style={themeStyles.profileLogoPlaceholder}>
          <Icon name="business" size={24} color={theme?.colors?.textSecondary || '#666666'} />
        </View>
      )}
      <View style={themeStyles.profileInfo}>
        <Text style={themeStyles.profileName}>{item.name}</Text>
        {item.category && (
          <Text style={themeStyles.profileCategory}>{item.category}</Text>
        )}
        {item.description && (
          <Text style={themeStyles.profileDescription}>{item.description}</Text>
        )}
      </View>
      <Icon name="chevron-right" size={24} color={theme?.colors?.textSecondary || '#666666'} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + responsiveSpacingUtils.sm }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Editor</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => setShowProfileModal(true)}
            >
              <Icon name="business" size={20} color="#ffffff" />
              <Text style={styles.profileButtonText}>
                {selectedProfile ? selectedProfile.name : 'Select Profile'}
              </Text>
            </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.generateVideoButton, isProcessing && styles.generateVideoButtonDisabled]} 
          onPress={() => {
            setShowProcessingOptions(true);
          }}
          disabled={layers.length === 0 || isProcessing}
        >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
              <Icon name="videocam" size={20} color="#ffffff" />
              )}
              <Text style={styles.generateVideoButtonText}>
                {isProcessing ? 'Generating...' : 'Generate Video'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Canvas Container */}
        <View style={styles.videoCanvasContainer}>
          <ViewShot
            ref={canvasRef}
            style={styles.videoCanvas}
            options={{
              format: 'jpg',
              quality: 0.9,
              width: videoCanvasWidth,
              height: videoCanvasHeight,
            }}
          >
          <Video
            ref={videoRef}
            source={videoSource}
            style={styles.video}
            resizeMode="stretch"
            paused={!isVideoPlaying}
            onLoad={onVideoLoad}
            onLoadStart={onVideoLoadStart}
            onProgress={onVideoProgress}
            onError={onVideoError}
            repeat={true}
          />
          
          {/* Video Layers */}
          {layers.map(l => {
            console.log('Processing layer:', l.id, l.type, l.fieldType, l.fieldType ? visibleFields[l.fieldType] : 'no fieldType'); // Debug log
            if (l.fieldType && !visibleFields[l.fieldType]) {
              console.log('Layer filtered out:', l.id); // Debug log
              return null;
            }
            console.log('Rendering layer:', l.id, l.type, l.position, l.size); // Debug log
            return renderLayer(l);
          })}
          
          {/* Play/Pause Button Overlay */}
          <TouchableOpacity 
            style={styles.playButtonOverlay} 
            onPress={() => setIsVideoPlaying(!isVideoPlaying)}
            activeOpacity={0.8}
          >
            <View style={styles.playButton}>
              <Icon 
                name={isVideoPlaying ? 'pause' : 'play-arrow'} 
                size={48} 
                color="#ffffff" 
              />
            </View>
          </TouchableOpacity>
          
          {/* Footer layers are working correctly - test layer removed */}
          



          
          {/* Overlays-only transparent PNG capture */}
          <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} pointerEvents="none">
            <ViewShot
              ref={overlaysRef}
              style={{ flex: 1, backgroundColor: 'transparent' }}
              options={{ format: 'png', quality: 1, result: 'tmpfile', width: videoCanvasWidth, height: videoCanvasHeight }}
            >
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                {layers.map(l => {
                  if (l.fieldType && !visibleFields[l.fieldType]) return null;
                  return renderLayer(l);
                })}
                {isCapturing && <Watermark isSubscribed={checkPremiumAccess('video_export')} />}
              </View>
            </ViewShot>
          </View>

          {/* Processing Overlay */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <View style={styles.processingModal}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.processingTitle}>Processing Video</Text>
                <Text style={styles.processingSubtitle}>
                  Adding overlays and effects...
                </Text>
                <Text style={styles.processingSubtitle}>
                  DEBUG: Processing state is TRUE
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${processingProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{processingProgress}%</Text>
              </View>
            </View>
          )}
        </ViewShot>
        </View>

        {/* Controls Container */}
        <View style={[
          styles.controlsContainer,
          { paddingBottom: Math.max(insets.bottom + responsiveSpacingUtils.xxl + 60, responsiveSpacingUtils.xxl + 80) }
        ]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + responsiveSpacingUtils.xxl + 40, responsiveSpacingUtils.xxl + 60) }}
        >
        
        {/* Field Toggle Buttons */}
        <View style={styles.fieldToggleSection}>
          <View style={styles.fieldToggleHeader}>
            <Text style={styles.fieldToggleTitle}>Toggle Elements</Text>
            <Text style={styles.fieldToggleSubtitle}>Show or hide video elements</Text>
          </View>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fieldToggleScrollContent}
          >
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.logo && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('logo')}
            >
              <Icon name="account-balance" size={20} color={visibleFields.logo ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.logo && styles.fieldToggleButtonTextActive]}>
                Logo
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.companyName && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('companyName')}
            >
              <Icon name="title" size={20} color={visibleFields.companyName ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.companyName && styles.fieldToggleButtonTextActive]}>
                Company Name
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.footerCompanyName && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('footerCompanyName')}
            >
              <Icon name="subtitles" size={20} color={visibleFields.footerCompanyName ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.footerCompanyName && styles.fieldToggleButtonTextActive]}>
                Footer Name
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.footerBackground && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('footerBackground')}
            >
              <Icon name="format-color-fill" size={20} color={visibleFields.footerBackground ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.footerBackground && styles.fieldToggleButtonTextActive]}>
                Footer BG
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.phone && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('phone')}
            >
              <Icon name="call" size={20} color={visibleFields.phone ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.phone && styles.fieldToggleButtonTextActive]}>
                Phone
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.email && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('email')}
            >
              <Icon name="mail" size={20} color={visibleFields.email ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.email && styles.fieldToggleButtonTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.website && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('website')}
            >
              <Icon name="public" size={20} color={visibleFields.website ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.website && styles.fieldToggleButtonTextActive]}>
                Website
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.category && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('category')}
            >
              <Icon name="business-center" size={20} color={visibleFields.category ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.category && styles.fieldToggleButtonTextActive]}>
                Category
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.address && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('address')}
            >
              <Icon name="place" size={20} color={visibleFields.address ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.address && styles.fieldToggleButtonTextActive]}>
                Address
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.fieldToggleButton, visibleFields.services && styles.fieldToggleButtonActive]}
              onPress={() => toggleFieldVisibility('services')}
            >
              <Icon name="handyman" size={20} color={visibleFields.services ? "#ffffff" : "#667eea"} />
              <Text style={[styles.fieldToggleButtonText, visibleFields.services && styles.fieldToggleButtonTextActive]}>
                Services
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Templates Section */}
        <View style={styles.templatesSection}>
          <View style={styles.templatesHeader}>
            <Text style={styles.templatesTitle}>Video Templates</Text>
            <Text style={styles.templatesSubtitle}>Choose a professional template design</Text>
          </View>
          <View 
            style={styles.templatesContent}
          >
            <View style={styles.templatesScrollContent}>
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'business' && styles.templateButtonActive]}
              onPress={() => applyTemplate('business')}
            >
              <View style={[styles.templatePreview, styles.businessTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.businessTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'business' && styles.templateTextActive]}>
                Business
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'event' && styles.templateButtonActive]}
              onPress={() => applyTemplate('event')}
            >
              <View style={[styles.templatePreview, styles.eventTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.eventTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'event' && styles.templateTextActive]}>
                Event
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'restaurant' && styles.templateButtonActive]}
              onPress={() => applyTemplate('restaurant')}
            >
              <View style={[styles.templatePreview, styles.restaurantTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.restaurantTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'restaurant' && styles.templateTextActive]}>
                Restaurant
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.templateButton, selectedTemplate === 'fashion' && styles.templateButtonActive]}
              onPress={() => applyTemplate('fashion')}
            >
              <View style={[styles.templatePreview, styles.fashionTemplatePreview]}>
                <View style={styles.templatePreviewContent}>
                  <View style={[styles.templatePreviewFooter, styles.fashionTemplateStyle]} />
                </View>
              </View>
              <Text style={[styles.templateText, selectedTemplate === 'fashion' && styles.templateTextActive]}>
                Fashion
              </Text>
            </TouchableOpacity>
            </View>
          </View>
        </View>
        </ScrollView>
        </View>
      </LinearGradient>
      {/* Frame Selector */}
      {showFrameSelector && (
        <FrameSelector
          frames={frames}
          selectedFrameId={selectedFrame?.id || ''}
          onFrameSelect={applyFrame}
        />
      )}

      {/* Text Modal */}
      <Modal visible={showTextModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Text</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter text..."
              value={newText}
              onChangeText={setNewText}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => setShowTextModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]} 
                onPress={addTextLayer}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Modal */}
      <Modal visible={showImageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Image</Text>
            <View style={styles.imageOptions}>
              <TouchableOpacity style={styles.imageOption} onPress={handleCameraAccess}>
                <Icon name="camera-alt" size={32} color="#667eea" />
                <Text style={styles.imageOptionText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageOption} onPress={handleGalleryAccess}>
                <Icon name="photo-library" size={32} color="#667eea" />
                <Text style={styles.imageOptionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            {newImageUrl ? (
              <Image source={{ uri: newImageUrl }} style={styles.previewImage} />
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => setShowImageModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]} 
                onPress={addImageLayer}
                disabled={!newImageUrl}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logo Modal */}
      <Modal visible={showLogoModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Logo</Text>
            <View style={styles.imageOptions}>
              <TouchableOpacity style={styles.imageOption} onPress={handleCameraAccess}>
                <Icon name="camera-alt" size={32} color="#667eea" />
                <Text style={styles.imageOptionText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageOption} onPress={handleGalleryAccess}>
                <Icon name="photo-library" size={32} color="#667eea" />
                <Text style={styles.imageOptionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            {newLogoUrl ? (
              <Image source={{ uri: newLogoUrl }} style={styles.previewLogo} />
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => setShowLogoModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]} 
                onPress={addLogoLayer}
                disabled={!newLogoUrl}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Font Modal */}
      <Modal visible={showFontModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Font</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search fonts..."
              value={fontSearchQuery}
              onChangeText={setFontSearchQuery}
            />
            <ScrollView style={styles.fontList}>
              {Object.entries(SYSTEM_FONTS).map(([key, font]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.fontItem}
                  onPress={() => handleFontSelect(font)}
                >
                  <Text style={[styles.fontItemText, { fontFamily: getFontFamily(font) }]}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setShowFontModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Business Profile Selection Modal */}
      <Modal
        visible={showProfileSelectionModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // Prevent closing without selection - user must select a profile or go back
          Alert.alert(
            'Selection Required',
            'You must select a business profile to continue. If you want to go back, use the Cancel button.',
            [{ text: 'OK' }]
          );
        }}
      >
        <View style={themeStyles.modalOverlay}>
          <View style={themeStyles.modalContent}>
            <Text style={themeStyles.modalTitle}>Select Business Profile</Text>
            <Text style={themeStyles.modalSubtitle}>
              Choose which business profile to use for your video. You must select one to continue.
            </Text>
            {loadingProfiles ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme?.colors?.primary || '#007AFF'} />
                <Text style={themeStyles.modalSubtitle}>Loading profiles...</Text>
              </View>
            ) : (
              <FlatList
                data={businessProfiles}
                renderItem={renderProfileItem}
                keyExtractor={(item) => item.id}
                style={styles.profileList}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={5}
                windowSize={10}
                initialNumToRender={3}
              />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, themeStyles.cancelButton]}
                onPress={() => {
                  setShowProfileSelectionModal(false);
                  navigation.goBack(); // Go back to previous screen if user cancels
                }}
              >
                <Text style={themeStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Modal (for manual selection later) */}
      <Modal visible={showProfileModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Business Profile</Text>
            <FlatList
              data={businessProfiles}
              renderItem={renderProfileItem}
              keyExtractor={(item) => item.id}
              style={styles.profileList}
            />
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

             {/* Video Processor Modal */}
       <VideoProcessor
         visible={showVideoProcessor}
         onComplete={handleVideoProcessingComplete}
         onClose={handleVideoProcessingClose}
         layers={layers}
         selectedVideoUri={selectedVideo}
         selectedLanguage={selectedLanguage}
         canvasData={{
           width: videoCanvasWidth,
           height: videoCanvasHeight,
           layers: layers,
         }}
       />

      {/* Video Processing Modal - Removed, using direct generation */}

      {/* Processing Options Modal */}
      {showProcessingOptions && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎬 Choose Processing Method</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowProcessingOptions(false)}
              >
                <Icon name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.processingOptionsContainer}>
              <Text style={styles.processingOptionsSubtitle}>
                Select how you want to process your video:
              </Text>
              
        <TouchableOpacity
          style={styles.processingOptionButton}
          onPress={() => {
            setShowProcessingOptions(false);
            handleGenerateVideo(); // Local processing
          }}
        >
                <Icon name="phone-android" size={24} color="#ffffff" />
                <View style={styles.processingOptionText}>
                  <Text style={styles.processingOptionTitle}>Local Processing</Text>
                  <Text style={styles.processingOptionDescription}>
                    Process video on your device using native modules
                  </Text>
                </View>
              </TouchableOpacity>

        <TouchableOpacity
          style={styles.processingOptionButton}
          onPress={async () => {
            try {
              console.log('🎯 Cloud Processing button clicked!');
              console.log('🔍 DEBUG: Closing modal and starting processing...');
              
              // Close modal first
              setShowProcessingOptions(false);
              
              // Set processing state immediately
              setIsProcessing(true);
              setProcessingProgress(0);
              
              console.log('🔍 DEBUG: Modal closed, processing state set to true');
              
              // Start cloud processing directly
              await handleCloudProcessing();
            } catch (error) {
              console.error('❌ Error in cloud processing button:', error);
              Alert.alert('Error', `Cloud processing failed: ${(error as Error).message}`);
              // Reset processing state on error
              setIsProcessing(false);
              setProcessingProgress(0);
            }
          }}
        >
                <Icon name="cloud-upload" size={24} color="#ffffff" />
                <View style={styles.processingOptionText}>
                  <Text style={styles.processingOptionTitle}>Cloud Processing</Text>
                  <Text style={styles.processingOptionDescription}>
                    Upload and process video on cloud servers
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.max(16, screenWidth * 0.04),
    paddingTop: Math.max(40, screenHeight * 0.05),
    paddingBottom: Math.max(16, screenHeight * 0.02),
    marginBottom: Math.max(8, screenHeight * 0.01),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Math.max(12, screenWidth * 0.03),
    marginHorizontal: Math.max(8, screenWidth * 0.02),
  },
  backButton: {
    padding: Math.max(12, screenWidth * 0.03),
    marginRight: Math.max(8, screenWidth * 0.02),
  },
  headerTitle: {
    fontSize: responsiveText.subheading,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  videoCanvasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.max(8, screenHeight * 0.01),
    flex: 0,
    marginBottom: Math.max(12, screenHeight * 0.015), // Added margin to push controls down
  },
  videoCanvas: {
    width: videoCanvasWidth,
    height: videoCanvasHeight,
    alignSelf: 'center',
    marginVertical: Math.max(8, screenHeight * 0.01), // Increased vertical margins
    marginHorizontal: Math.max(8, screenWidth * 0.02), // Reduced horizontal margins for more width
    borderRadius: Math.max(16, screenWidth * 0.04),
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: Math.max(2, screenWidth * 0.005),
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...responsiveShadow.large,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Math.max(20, screenWidth * 0.05),
    paddingVertical: Math.max(15, screenHeight * 0.018),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toolbarButton: {
    alignItems: 'center',
  },
  toolbarButtonText: {
    color: '#ffffff',
    fontSize: responsiveText.caption,
    marginTop: Math.max(5, screenHeight * 0.006),
  },
  layer: {
    position: 'absolute',
  },
  selectedLayer: {
    borderWidth: Math.max(2, screenWidth * 0.005),
    borderColor: '#667eea',
  },
  layerText: {
    fontSize: responsiveText.subheading,
    color: '#ffffff',
  },
  layerImage: {
    width: '100%',
    height: '100%',
  },
  layerLogo: {
    width: '100%',
    height: '100%',
  },

  textInput: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    minHeight: 100,
  },
  profileList: {
    maxHeight: 400,
    marginBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingModal: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    minWidth: 250,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 15,
    marginBottom: 5,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  // Image and logo modal styles
  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  imageOption: {
    alignItems: 'center',
    padding: 20,
  },
  imageOptionText: {
    marginTop: 10,
    fontSize: 16,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 15,
  },
  previewLogo: {
    width: 80,
    height: 80,
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 15,
  },
  // Font modal styles
  searchInput: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  fontList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  fontItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  fontItemText: {
    fontSize: 16,
  },
  // Controls Container
  controlsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: Math.max(20, screenWidth * 0.05),
    borderTopRightRadius: Math.max(20, screenWidth * 0.05),
    paddingTop: Math.max(16, screenHeight * 0.02), // Increased top padding
    paddingHorizontal: Math.max(8, screenWidth * 0.02),
    paddingBottom: Math.max(8, screenHeight * 0.01),
    borderTopWidth: Math.max(1, screenWidth * 0.002),
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    ...responsiveShadow.large,
    marginTop: Math.max(8, screenHeight * 0.01), // Added top margin to push controls down
  },
  // Field Toggle Section
  fieldToggleSection: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: Math.max(12, screenWidth * 0.03),
    padding: Math.max(8, screenWidth * 0.02),
    ...responsiveShadow.medium,
    borderWidth: Math.max(1, screenWidth * 0.002),
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: Math.max(12, screenHeight * 0.015), // Increased margin to push templates down
    marginHorizontal: Math.max(2, screenWidth * 0.005),
  },
  fieldToggleHeader: {
    alignItems: 'center',
    marginBottom: Math.max(4, screenHeight * 0.005),
  },
  fieldToggleTitle: {
    fontSize: Math.max(10, screenWidth * 0.025),
    fontWeight: '700',
    color: '#333333',
  },
  fieldToggleSubtitle: {
    fontSize: Math.max(8, screenWidth * 0.02),
    color: '#666666',
    marginTop: Math.max(1, screenHeight * 0.001),
  },
  fieldToggleContent: {
    // Removed maxHeight and flexWrap for horizontal scrolling
  },
  fieldToggleScrollContent: {
    paddingHorizontal: Math.max(8, screenWidth * 0.02),
    alignItems: 'center',
    gap: Math.max(8, screenWidth * 0.02),
    flexDirection: 'row',
  },
  fieldToggleButton: {
    alignItems: 'center',
    paddingVertical: Math.max(4, screenHeight * 0.005),
    paddingHorizontal: Math.max(6, screenWidth * 0.015),
    borderRadius: Math.max(8, screenWidth * 0.02),
    backgroundColor: '#f8f9fa',
    marginHorizontal: Math.max(1, screenWidth * 0.002),
    marginVertical: Math.max(1, screenHeight * 0.001),
    flexDirection: 'row',
    minWidth: Math.max(50, screenWidth * 0.1),
    justifyContent: 'center',
    borderWidth: Math.max(1, screenWidth * 0.002),
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  fieldToggleButtonActive: {
    backgroundColor: '#667eea',
  },
  fieldToggleButtonText: {
    fontSize: Math.max(8, screenWidth * 0.02),
    color: '#666666',
    marginLeft: Math.max(2, screenWidth * 0.005),
    fontWeight: '500',
  },
  fieldToggleButtonTextActive: {
    color: '#ffffff',
  },
  // Templates Section
  templatesSection: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: Math.max(12, screenWidth * 0.03),
    padding: Math.max(8, screenWidth * 0.02),
    ...responsiveShadow.medium,
    borderWidth: Math.max(1, screenWidth * 0.002),
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: Math.max(8, screenHeight * 0.01), // Increased margin for better spacing
    marginHorizontal: Math.max(2, screenWidth * 0.005),
  },
  templatesHeader: {
    alignItems: 'center',
    marginBottom: Math.max(4, screenHeight * 0.005),
  },
  templatesTitle: {
    fontSize: Math.max(10, screenWidth * 0.025),
    fontWeight: '700',
    color: '#333333',
  },
  templatesSubtitle: {
    fontSize: Math.max(8, screenWidth * 0.02),
    color: '#666666',
    marginTop: Math.max(1, screenHeight * 0.001),
  },
  templatesContent: {
    maxHeight: Math.max(80, screenHeight * 0.1),
    flexWrap: 'wrap',
  },
  templatesScrollContent: {
    paddingHorizontal: Math.max(8, screenWidth * 0.02),
    alignItems: 'center',
    gap: Math.max(8, screenWidth * 0.02),
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  templateButton: {
    alignItems: 'center',
    marginHorizontal: Math.max(2, screenWidth * 0.005),
    marginVertical: Math.max(1, screenHeight * 0.001),
    minWidth: Math.max(60, screenWidth * 0.12),
  },
  templateButtonActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: Math.max(12, screenWidth * 0.03),
    padding: Math.max(8, screenWidth * 0.02),
  },
  templatePreview: {
    width: Math.max(50, screenWidth * 0.12),
    height: Math.max(50, screenWidth * 0.12),
    borderRadius: Math.max(8, screenWidth * 0.02),
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Math.max(4, screenHeight * 0.005),
    borderWidth: Math.max(2, screenWidth * 0.005),
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    ...responsiveShadow.small,
  },
  templatePreviewContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  templatePreviewFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  templateText: {
    fontSize: Math.max(8, screenWidth * 0.02),
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: Math.max(8, screenHeight * 0.01),
  },
  templateTextActive: {
    color: '#667eea',
    fontWeight: '700',
  },
  // Template Preview Styles
  businessTemplatePreview: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  businessTemplateStyle: {
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
  },
  eventTemplatePreview: {
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  eventTemplateStyle: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
  },
  restaurantTemplatePreview: {
    borderWidth: 2,
    borderColor: '#ffa726',
  },
  restaurantTemplateStyle: {
    backgroundColor: 'rgba(255, 167, 38, 0.8)',
  },
  fashionTemplatePreview: {
    borderWidth: 2,
    borderColor: '#ec407a',
  },
  fashionTemplateStyle: {
    backgroundColor: 'rgba(236, 64, 122, 0.8)',
  },


  // Header Button Styles
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.max(8, screenWidth * 0.02),
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Math.max(14, screenWidth * 0.035),
    paddingVertical: Math.max(8, screenHeight * 0.01),
    borderRadius: Math.max(18, screenWidth * 0.045),
    gap: Math.max(6, screenWidth * 0.015),
    borderWidth: Math.max(1, screenWidth * 0.002),
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileButtonText: {
    color: '#ffffff',
    fontSize: responsiveText.caption,
    fontWeight: '500',
  },
  generateVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Math.max(10, screenWidth * 0.025),
    paddingVertical: Math.max(6, screenHeight * 0.008),
    borderRadius: Math.max(15, screenWidth * 0.035),
    gap: Math.max(4, screenWidth * 0.01),
    borderWidth: Math.max(1, screenWidth * 0.002),
    borderColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 1,
    minWidth: 60,
  },
  generateVideoButtonText: {
    color: '#ffffff',
    fontSize: responsiveText.caption,
    fontWeight: '500',
  },
  generateVideoButtonDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 20,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#667eea',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Processing Options Modal Styles
  processingOptionsContainer: {
    padding: 20,
  },
  processingOptionsSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  processingOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  processingOptionText: {
    marginLeft: 15,
    flex: 1,
  },
  processingOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  processingOptionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },

});

export default VideoEditorScreen;

