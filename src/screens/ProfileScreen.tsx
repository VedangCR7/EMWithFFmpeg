import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  Modal,
  TextInput,
  Share,
  RefreshControl,
  Keyboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import authService from '../services/auth';
import authApi, { ProfileResponse, UserProfile } from '../services/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userBusinessProfilesService from '../services/userBusinessProfiles';
import businessProfileService from '../services/businessProfile';
import userPreferencesService from '../services/userPreferences';
import userProfileService from '../services/userProfile';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { MainStackParamList } from '../navigation/AppNavigator';

type ProfileScreenNavigationProp = StackNavigationProp<MainStackParamList>;
import downloadedPostersService from '../services/downloadedPosters';
import downloadTrackingService from '../services/downloadTracking';
import ImagePickerModal from '../components/ImagePickerModal';
import ComingSoonModal from '../components/ComingSoonModal';
import { API_CONFIG } from '../constants/api';

// Compact spacing multiplier to reduce all spacing (matching HomeScreen)
const COMPACT_MULTIPLIER = 0.5;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

// Responsive helper functions (matching HomeScreen)
const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive spacing and sizing
const responsiveSpacing = {
  xs: isSmallScreen ? 8 : isMediumScreen ? 12 : 16,
  sm: isSmallScreen ? 12 : isMediumScreen ? 16 : 20,
  md: isSmallScreen ? 16 : isMediumScreen ? 20 : 24,
  lg: isSmallScreen ? 20 : isMediumScreen ? 24 : 32,
  xl: isSmallScreen ? 24 : isMediumScreen ? 32 : 40,
};

const responsiveFontSize = {
  xs: isSmallScreen ? 10 : isMediumScreen ? 12 : 14,
  sm: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
  md: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
  lg: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
  xl: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  xxl: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
  xxxl: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
};

const ProfileScreen: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  
  // Dynamic dimensions for responsive layout (matching HomeScreen)
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Update dimensions on screen rotation/resize
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const currentScreenWidth = dimensions.width;
  const currentScreenHeight = dimensions.height;
  
  // DEBUG: Log screen dimensions on mount and when they change
  useEffect(() => {
    console.log('📐 [ProfileScreen] Screen Dimensions:', {
      width: currentScreenWidth,
      height: currentScreenHeight,
      isSmallScreen: currentScreenWidth < 450,
      threshold: 450,
      deviceType: currentScreenWidth < 450 ? 'SMALL/MEDIUM' : 'LARGE/TABLET',
    });
  }, [currentScreenWidth, currentScreenHeight]);
  
  // Dynamic responsive scaling functions
  const dynamicScale = (size: number) => (currentScreenWidth / 375) * size;
  const dynamicVerticalScale = (size: number) => (currentScreenHeight / 667) * size;
  const dynamicModerateScale = (size: number, factor = 0.5) => size + (dynamicScale(size) - size) * factor;
  
  // Ensure avatar remains visible on small screens
  const avatarSize = Math.max(64, dynamicModerateScale(60));
  
  // Normalize possibly relative image URLs to absolute (prefer HTTPS backend)
  const toAbsoluteUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const lower = url.toLowerCase();
    if (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('data:') ||
      lower.startsWith('file:') ||
      lower.startsWith('content:') ||
      lower.startsWith('asset:') ||
      lower.startsWith('blob:')
    ) {
      return url;
    }
    if (lower.startsWith('/storage') || lower.startsWith('/sdcard') || lower.startsWith('/data')) {
      return `file://${url}`;
    }
    const normalized = url.startsWith('/') ? url : `/${url}`;
    const REMOTE_BASE = 'https://eventmarketersbackend.onrender.com';
    return `${REMOTE_BASE}${normalized}`;
  };

  // Sanitize raw URLs (trim, unify slashes, encode spaces)
  const sanitizeUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const trimmed = url.trim().replace(/\\\\/g, '/');
    return trimmed.replace(/\s/g, '%20');
  };

  // Enforce HTTPS to avoid cleartext blocking on some devices
  const ensureHttps = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http://')) {
      return 'https://' + url.substring('http://'.length);
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    return url;
  };
  
  // Responsive icon sizes (compact - 60% of original, slightly larger for small screens)
  const getIconSize = (baseSize: number) => {
    const isCurrentlySmall = currentScreenWidth < 375;
    const multiplier = isCurrentlySmall ? 0.75 : 0.6; // Increased from 0.7 to 0.75 for small screens
    return Math.max(10, Math.round(baseSize * (currentScreenWidth / 375) * multiplier));
  };
  
  // Track logged base sizes to reduce console noise
  const loggedBaseSizes = useRef<Set<number>>(new Set());
  const hasLoggedScreenInfo = useRef(false);
  
  // Responsive text size helper (much larger for small screens)
  const getFontSize = (baseSize: number) => {
    // Increased threshold to 450px to catch more devices including medium phones
    // True small screens are typically < 375px, but we extend to 450px for better coverage
    const isCurrentlySmall = currentScreenWidth < 450;
    
    // DEBUG: Log screen info once
    if (!hasLoggedScreenInfo.current) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔍 [getFontSize] SCREEN DETECTION:');
      console.log('   Screen Width:', currentScreenWidth);
      console.log('   Screen Height:', currentScreenHeight);
      console.log('   Is Small Screen (< 450px):', isCurrentlySmall);
      console.log('   Threshold:', 450);
      console.log('   Device Type:', isCurrentlySmall ? 'SMALL/MEDIUM' : 'LARGE/TABLET');
      console.log('═══════════════════════════════════════════════════════════');
      hasLoggedScreenInfo.current = true;
    }
    
    if (isCurrentlySmall) {
      // For small screens, use a moderate multiplier approach
      // Apply a reasonable boost to make text more readable without being too large
      // Using 1.3x multiplier + 3px for a balanced increase
      const boostedSize = baseSize * 1.3 + 3;
      const finalSize = Math.round(boostedSize);
      
      // DEBUG: Log each unique baseSize calculation (only once per unique size)
      if (!loggedBaseSizes.current.has(baseSize)) {
        console.log('📱 [getFontSize] SMALL SCREEN CALCULATION:', {
          baseSize,
          multiplier: '1.3x',
          boost: '+3px',
          calculation: `${baseSize} × 1.3 + 3`,
          boostedSize: boostedSize.toFixed(2),
          finalSize,
        });
        loggedBaseSizes.current.add(baseSize);
      }
      
      return finalSize;
    }
    
    // For medium and large screens, use normal scaling
    const baseFontSize = dynamicModerateScale(baseSize);
    
    // DEBUG: Log each unique baseSize for normal screens (only once per unique size)
    if (!loggedBaseSizes.current.has(baseSize)) {
      console.log('💻 [getFontSize] NORMAL SCREEN CALCULATION:', {
        baseSize,
        screenWidth: currentScreenWidth,
        baseFontSize: baseFontSize.toFixed(2),
        scaling: 'dynamicModerateScale',
      });
      loggedBaseSizes.current.add(baseSize);
    }
    
    return baseFontSize;
  };
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: currentUser?.companyName || currentUser?.name || '',
    description: currentUser?.description || '',
    category: currentUser?.category || '',
    address: currentUser?.address || '',
    phone: currentUser?.phoneNumber || currentUser?.phone || '',
    alternatePhone: currentUser?.alternatePhone || '',
    email: currentUser?.email || '',
    website: currentUser?.website || '',
    companyLogo: currentUser?.logo || currentUser?.companyLogo || '',
  });
  const editInputRefs = useRef<Record<string, TextInput | null>>({});
  const [phoneValidationError, setPhoneValidationError] = useState<string>('');
  const [alternatePhoneValidationError, setAlternatePhoneValidationError] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [posterStats, setPosterStats] = useState({ total: 0, recentCount: 0 });
  const [businessProfileStats, setBusinessProfileStats] = useState({ total: 0, recentCount: 0 });
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(
    currentUser?.logo || currentUser?.companyLogo || null
  );
  const [avatarErrored, setAvatarErrored] = useState(false);

  // Reset avatar error state whenever the underlying URI changes
  useEffect(() => {
    setAvatarErrored(false);
  }, [profileImageUri, currentUser?.logo, currentUser?.companyLogo, currentUser?.photoURL, currentUser?.profileImage]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState('');
  const [comingSoonSubtitle, setComingSoonSubtitle] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCacheUpdate, setLastCacheUpdate] = useState<number>(0);
  const { isDarkMode, toggleDarkMode, theme } = useTheme();
  const { isSubscribed, subscriptionStatus, transactionStats, clearSubscriptionData } = useSubscription();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const CACHE_KEYS = {
    PROFILE_DATA: 'profile_cache_data',
    DOWNLOAD_STATS: 'profile_cache_download_stats',
    BUSINESS_STATS: 'profile_cache_business_stats',
    LAST_UPDATE: 'profile_cache_last_update',
    CACHED_USER_ID: 'profile_cache_user_id', // Track which user's data is cached
  };

  // Business categories (same as registration)
  const categories = [
    'Event Planners',
    'Decorators',
    'Sound Suppliers',
    'Light Suppliers',
    'Video Services',
  ];

  // Animation values for toggles
  const notificationsAnimation = useRef(new Animated.Value(notificationsEnabled ? 1 : 0)).current;
  const darkModeAnimation = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  // Sync animation values with state changes
  useEffect(() => {
    notificationsAnimation.setValue(notificationsEnabled ? 1 : 0);
  }, [notificationsEnabled]);

  useEffect(() => {
    darkModeAnimation.setValue(isDarkMode ? 1 : 0);
  }, [isDarkMode]);

  // Clear state when user changes to prevent data leakage between users
  useEffect(() => {
    return () => {
      // Cleanup function called when component unmounts or user changes
      console.log('🧹 ProfileScreen unmounting, clearing local state');
      setPosterStats({ total: 0, recentCount: 0 });
      setBusinessProfileStats({ total: 0, recentCount: 0 });
      setProfileImageUri(null);
    };
  }, [currentUser?.id]);

  // Cache utility functions
  const isCacheValid = async (currentUserId: string): Promise<boolean> => {
    try {
      // Check if cache belongs to current user
      const cachedUserId = await AsyncStorage.getItem(CACHE_KEYS.CACHED_USER_ID);
      if (cachedUserId !== currentUserId) {
        console.log('🔄 Different user detected, invalidating cache');
        console.log('   - Cached user ID:', cachedUserId);
        console.log('   - Current user ID:', currentUserId);
        return false;
      }
      
      const lastUpdate = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);
      if (!lastUpdate) return false;
      
      const timeSinceUpdate = Date.now() - parseInt(lastUpdate, 10);
      return timeSinceUpdate < CACHE_DURATION;
    } catch (error) {
      console.error('❌ Error checking cache validity:', error);
      return false;
    }
  };

  const getCachedData = async <T,>(key: string): Promise<T | null> => {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      if (!cachedData) return null;
      return JSON.parse(cachedData) as T;
    } catch (error) {
      console.error(`❌ Error reading cache for ${key}:`, error);
      return null;
    }
  };

  const setCachedData = async (key: string, data: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`❌ Error writing cache for ${key}:`, error);
    }
  };

  const invalidateCache = async (): Promise<void> => {
    try {
      console.log('🗑️ Invalidating profile cache');
      await AsyncStorage.multiRemove([
        CACHE_KEYS.PROFILE_DATA,
        CACHE_KEYS.DOWNLOAD_STATS,
        CACHE_KEYS.BUSINESS_STATS,
        CACHE_KEYS.LAST_UPDATE,
        CACHE_KEYS.CACHED_USER_ID,
      ]);
      setLastCacheUpdate(0);
    } catch (error) {
      console.error('❌ Error invalidating cache:', error);
    }
  };

  const updateCacheTimestamp = async (userId: string): Promise<void> => {
    try {
      const now = Date.now();
      await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, now.toString());
      await AsyncStorage.setItem(CACHE_KEYS.CACHED_USER_ID, userId);
      setLastCacheUpdate(now);
    } catch (error) {
      console.error('❌ Error updating cache timestamp:', error);
    }
  };

  // Load user profile data and stats when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadUserProfileData = async (forceRefresh: boolean = false) => {
        try {
          // Get current user ID for user-specific data
          let currentUser = authService.getCurrentUser();
          const userId = currentUser?.id;
          
          if (!userId) {
            console.log('⚠️ No user ID available for loading profile data');
            return;
          }

          // Check cache validity unless force refresh
          if (!forceRefresh) {
            const cacheValid = await isCacheValid(userId);
            if (cacheValid) {
              console.log('📦 Loading profile data from cache for user:', userId);
              
              // Load from cache
              const cachedProfile = await getCachedData<any>(CACHE_KEYS.PROFILE_DATA);
              const cachedDownloadStats = await getCachedData<any>(CACHE_KEYS.DOWNLOAD_STATS);
              const cachedBusinessStats = await getCachedData<any>(CACHE_KEYS.BUSINESS_STATS);
              
              // Verify cached profile belongs to current user
              if (cachedProfile && cachedProfile.id === userId) {
                authService.setCurrentUser(cachedProfile);
                currentUser = cachedProfile;
                if (cachedProfile?.logo || cachedProfile?.companyLogo) {
                  setProfileImageUri(cachedProfile?.logo || cachedProfile?.companyLogo || null);
                }
                console.log('✅ Profile data loaded from cache');
              } else if (cachedProfile) {
                console.log('⚠️ Cached profile belongs to different user, invalidating cache');
                await invalidateCache();
              }
              
              if (cachedDownloadStats) {
                setPosterStats(cachedDownloadStats);
                console.log('✅ Download stats loaded from cache');
              }
              
              if (cachedBusinessStats) {
                setBusinessProfileStats(cachedBusinessStats);
                console.log('✅ Business stats loaded from cache');
              }
              
              // If all cache data is available and belongs to correct user, return early
              if (cachedProfile && cachedProfile.id === userId && cachedDownloadStats && cachedBusinessStats) {
                console.log('✅ All data loaded from cache, skipping API calls');
                return;
              }
            } else {
              console.log('⏰ Cache expired, invalid, or different user - fetching fresh data');
              // Invalidate cache to be safe
              await invalidateCache();
            }
          } else {
            console.log('🔄 Force refresh requested, fetching fresh data');
          }

          // IMMEDIATE FIX: Check AsyncStorage for original registered company name
          try {
            const storedUser = await AsyncStorage.getItem('currentUser');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              // If we find an original company name in storage, use it immediately
              if (!currentUser?._originalCompanyName && parsedUser?.companyName) {
                console.log('🔍 Found companyName in AsyncStorage:', parsedUser.companyName);
                console.log('🔧 Restoring original company name from storage');
                const fixedUser = {
                  ...currentUser,
                  _originalCompanyName: parsedUser.companyName,
                  companyName: parsedUser.companyName,
                };
                authService.setCurrentUser(fixedUser);
                currentUser = fixedUser;
                console.log('✅ Company name restored from AsyncStorage');
              }
            }
          } catch (storageError) {
            console.log('⚠️ Could not check AsyncStorage:', storageError);
          }

          // Wait for token to be available in AsyncStorage (with retry)
          let token = await AsyncStorage.getItem('authToken');
          if (!token) {
            console.log('⏳ Token not yet in storage, waiting...');
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
            token = await AsyncStorage.getItem('authToken');
            if (!token) {
              console.log('⚠️ Token still not available after wait, API calls may fail');
            } else {
              console.log('✅ Token now available in storage');
            }
          }

          console.log('🔍 Loading complete user profile data for user:', userId);

          // Load complete user profile from backend
          try {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('📡 FETCHING USER PROFILE DATA FROM API');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🔍 User ID:', userId);
            console.log('📡 Calling authApi.getProfile()...');
            
            const profileResponse = await authApi.getProfile(userId);
            
            console.log('═══════════════════════════════════════════════════════════');
            console.log('📥 GET PROFILE API RESPONSE - FULL RESPONSE');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('📦 Full profileResponse Object:');
            console.log(JSON.stringify(profileResponse, null, 2));
            console.log('─────────────────────────────────────────────────────────');
            console.log('✅ Response Success:', profileResponse?.success);
            console.log('✅ Response Message:', profileResponse?.message || 'N/A');
            console.log('─────────────────────────────────────────────────────────');
            
            const completeUserData = profileResponse.data;
            
            console.log('📋 Complete User Data Object:');
            console.log(JSON.stringify(completeUserData, null, 2));
            console.log('─────────────────────────────────────────────────────────');
            console.log('📊 Individual User Data Fields:');
            console.log('   🆔 id:', completeUserData?.id || '(not set)');
            console.log('   📧 email:', completeUserData?.email || '(not set)');
            console.log('   🏢 companyName:', (completeUserData as any)?.companyName || '(not set)');
            console.log('   🏢 name:', (completeUserData as any)?.name || '(not set)');
            console.log('   📱 phone:', (completeUserData as any)?.phone || '(not set)');
            console.log('   📱 phoneNumber:', (completeUserData as any)?.phoneNumber || '(not set)');
            console.log('   📱 alternatePhone:', (completeUserData as any)?.alternatePhone || '(not set)');
            console.log('   📍 address:', (completeUserData as any)?.address || '(not set)');
            console.log('   🌐 website:', (completeUserData as any)?.website || '(not set)');
            console.log('   🏷️ category:', (completeUserData as any)?.category || '(not set)');
            console.log('   📝 description:', (completeUserData as any)?.description || '(not set)');
            console.log('─────────────────────────────────────────────────────────');
            console.log('🖼️ PROFILE PHOTO/LOGO FIELDS:');
            console.log('   🖼️ logo:', (completeUserData as any)?.logo || '(not set)');
            console.log('   🖼️ companyLogo:', (completeUserData as any)?.companyLogo || '(not set)');
            console.log('   🖼️ photo:', (completeUserData as any)?.photo || '(not set)');
            console.log('   🖼️ photoURL:', (completeUserData as any)?.photoURL || '(not set)');
            console.log('   🖼️ profileImage:', (completeUserData as any)?.profileImage || '(not set)');
            console.log('─────────────────────────────────────────────────────────');
            console.log('📅 Timestamps:');
            console.log('   📅 createdAt:', (completeUserData as any)?.createdAt || '(not set)');
            console.log('   📅 updatedAt:', (completeUserData as any)?.updatedAt || '(not set)');
            console.log('─────────────────────────────────────────────────────────');
            console.log('⚠️ Business Profiles Check:');
            console.log('   🏢 businessProfiles present?', !!(completeUserData as any)?.businessProfiles);
            if ((completeUserData as any)?.businessProfiles) {
              console.log('   🏢 businessProfiles count:', (completeUserData as any).businessProfiles.length);
              console.log('   🏢 businessProfiles data:', JSON.stringify((completeUserData as any).businessProfiles, null, 2));
            }
            console.log('═══════════════════════════════════════════════════════════');
            console.log('📥 GET PROFILE API RESPONSE - END');
            console.log('═══════════════════════════════════════════════════════════');
            
            // Update current user with complete profile data
            // CRITICAL: Exclude businessProfiles from API to prevent contamination
            const { businessProfiles, ...cleanUserData } = completeUserData as any;
            
            // Use the name/companyName from API response (this is the user's actual current name)
            const apiCompanyName = cleanUserData.name || cleanUserData.companyName || currentUser?.companyName;
            
            // Sync logo from API response (prefer 'logo' field, fallback to 'companyLogo')
            const apiLogo = cleanUserData.logo || cleanUserData.companyLogo || currentUser?.logo || currentUser?.companyLogo;
            
            // CRITICAL: If we have _original values, use them instead of potentially contaminated API data
            // This protects against backend bugs where business profile data leaks into user profile
            const protectedAddress = currentUser?._originalAddress !== undefined ? currentUser._originalAddress : cleanUserData.address;
            const protectedWebsite = currentUser?._originalWebsite !== undefined ? currentUser._originalWebsite : cleanUserData.website;
            const protectedCategory = currentUser?._originalCategory !== undefined ? currentUser._originalCategory : cleanUserData.category;
            const protectedDescription = currentUser?._originalDescription !== undefined ? currentUser._originalDescription : cleanUserData.description;
            const protectedAlternatePhone = currentUser?._originalAlternatePhone !== undefined ? currentUser._originalAlternatePhone : cleanUserData.alternatePhone;
            
            console.log('🛡️ BACKEND CONTAMINATION PROTECTION (on load):');
            console.log('   - Using _originalAddress:', currentUser?._originalAddress !== undefined ? 'YES' : 'NO (using API)');
            console.log('   - Protected address:', protectedAddress);
            console.log('   - API returned address:', cleanUserData.address);
            if (currentUser?._originalAddress !== undefined && protectedAddress !== cleanUserData.address) {
              console.warn('   ⚠️ CONTAMINATION DETECTED: API address differs from _original!');
            }
            
            const updatedUserData = {
              ...currentUser,
              ...cleanUserData,
              // Use the name from API (this is the user's actual registered/updated name)
              companyName: apiCompanyName,
              displayName: apiCompanyName,
              name: apiCompanyName,
              // Use protected values (prefer _original over potentially contaminated API data)
              address: protectedAddress,
              website: protectedWebsite,
              category: protectedCategory,
              description: protectedDescription,
              alternatePhone: protectedAlternatePhone,
              // Update _originalCompanyName to the current name from API
              _originalCompanyName: apiCompanyName,
              // Keep _original values unchanged (they are the source of truth)
              _originalAddress: currentUser?._originalAddress !== undefined ? currentUser._originalAddress : cleanUserData.address,
              _originalWebsite: currentUser?._originalWebsite !== undefined ? currentUser._originalWebsite : cleanUserData.website,
              _originalCategory: currentUser?._originalCategory !== undefined ? currentUser._originalCategory : cleanUserData.category,
              _originalDescription: currentUser?._originalDescription !== undefined ? currentUser._originalDescription : cleanUserData.description,
              _originalAlternatePhone: currentUser?._originalAlternatePhone !== undefined ? currentUser._originalAlternatePhone : cleanUserData.alternatePhone,
              // Sync all logo fields
              logo: apiLogo,
              companyLogo: apiLogo,
              photoURL: apiLogo,
              profileImage: apiLogo,
            };
            
            // Update auth service with complete data (without business profiles)
            authService.setCurrentUser(updatedUserData);
            
            // Cache the updated profile data
            await setCachedData(CACHE_KEYS.PROFILE_DATA, updatedUserData);
            
            console.log('✅ User data updated (business profiles excluded from API)');
            console.log('✅ Company name from API:', updatedUserData.companyName);
            console.log('🖼️ Logo from API:', updatedUserData.logo);
            console.log('💾 Profile data cached');
            
            // Update profile image from logo field
            if (apiLogo) {
              console.log('🖼️ Setting profile image URI from API:', apiLogo);
              setProfileImageUri(apiLogo);
            } else {
              console.log('⚠️ No profile image/logo found in API response');
            }
            
            console.log('✅ User profile data loaded and updated');
          } catch (error) {
            console.log('⚠️ Failed to load profile data from API:', error);
            // Continue with existing user data
          }
          
          // Load download stats from backend API
          try {
            const downloadsResponse = await downloadTrackingService.getUserDownloads(userId);
            const posterStatsData = {
              total: downloadsResponse.downloads?.length || 0,
              recentCount: downloadsResponse.downloads?.filter((d: any) => {
                const downloadDate = new Date(d.createdAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return downloadDate >= weekAgo;
              }).length || 0,
            };
            setPosterStats(posterStatsData);
            
            // Cache download stats
            await setCachedData(CACHE_KEYS.DOWNLOAD_STATS, posterStatsData);
            
            console.log('✅ [PROFILE] Download stats loaded:', posterStatsData);
            console.log('💾 Download stats cached');
          } catch (error) {
            console.log('⚠️ [PROFILE] Failed to load download stats:', error);
            setPosterStats({ total: 0, recentCount: 0 });
          }
          
          // Load business profile stats by fetching actual profiles from backend
          let businessStats = { total: 0, recentCount: 0 };
          try {
            const profiles = await businessProfileService.getUserBusinessProfiles(userId);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const recentCount = profiles.filter(profile => 
              new Date(profile.createdAt) > oneWeekAgo
            ).length;
            
            businessStats = {
              total: profiles.length,
              recentCount: recentCount,
            };
            
            setBusinessProfileStats(businessStats);
            
            // Cache business stats
            await setCachedData(CACHE_KEYS.BUSINESS_STATS, businessStats);
            
            console.log('📊 Business profile stats loaded:', businessStats);
            console.log('💾 Business stats cached');
          } catch (error) {
            console.log('⚠️ Failed to load business profile stats:', error);
            setBusinessProfileStats({ total: 0, recentCount: 0 });
          }
          
          // Update cache timestamp after successful data load
          await updateCacheTimestamp(userId);
          
          console.log('📊 Loaded stats for user:', userId, 'Posters:', posterStats?.total || 0, 'Business Profiles:', businessStats?.total || 0);
          console.log('✅ All profile data cached successfully');
        } catch (error) {
          console.error('Error loading user profile data:', error);
        }
      };

      loadUserProfileData();
    }, [])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered');
      
      // Get current user
      let currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        console.log('⚠️ No user ID available for refresh');
        setIsRefreshing(false);
        return;
      }
      
      // Invalidate cache first
      await invalidateCache();
      
      // Fetch fresh profile data
      try {
        const profileResponse = await authApi.getProfile(userId);
        const completeUserData = profileResponse.data;
        
        const { businessProfiles, ...cleanUserData } = completeUserData as any;
        
        // Use the name from API (this is the user's actual current name)
        const apiCompanyName = cleanUserData.name || cleanUserData.companyName || currentUser?.companyName;
        
        // CRITICAL: Protect against backend contamination during refresh too
        const protectedAddress = currentUser?._originalAddress !== undefined ? currentUser._originalAddress : cleanUserData.address;
        const protectedWebsite = currentUser?._originalWebsite !== undefined ? currentUser._originalWebsite : cleanUserData.website;
        const protectedCategory = currentUser?._originalCategory !== undefined ? currentUser._originalCategory : cleanUserData.category;
        const protectedDescription = currentUser?._originalDescription !== undefined ? currentUser._originalDescription : cleanUserData.description;
        const protectedAlternatePhone = currentUser?._originalAlternatePhone !== undefined ? currentUser._originalAlternatePhone : cleanUserData.alternatePhone;
        
        console.log('🛡️ BACKEND CONTAMINATION PROTECTION (on refresh):');
        console.log('   - Protected address:', protectedAddress);
        console.log('   - API returned address:', cleanUserData.address);
        if (currentUser?._originalAddress !== undefined && protectedAddress !== cleanUserData.address) {
          console.warn('   ⚠️ CONTAMINATION DETECTED on refresh: API address differs from _original!');
        }
        
        const updatedUserData = {
          ...currentUser,
          ...cleanUserData,
          companyName: apiCompanyName,
          displayName: apiCompanyName,
          name: apiCompanyName,
          // Use protected values
          address: protectedAddress,
          website: protectedWebsite,
          category: protectedCategory,
          description: protectedDescription,
          alternatePhone: protectedAlternatePhone,
          // Update _originalCompanyName to match the current name from API
          _originalCompanyName: apiCompanyName,
          // Keep _original values unchanged (source of truth)
          _originalAddress: currentUser?._originalAddress !== undefined ? currentUser._originalAddress : cleanUserData.address,
          _originalWebsite: currentUser?._originalWebsite !== undefined ? currentUser._originalWebsite : cleanUserData.website,
          _originalCategory: currentUser?._originalCategory !== undefined ? currentUser._originalCategory : cleanUserData.category,
          _originalDescription: currentUser?._originalDescription !== undefined ? currentUser._originalDescription : cleanUserData.description,
          _originalAlternatePhone: currentUser?._originalAlternatePhone !== undefined ? currentUser._originalAlternatePhone : cleanUserData.alternatePhone,
        };
        
        authService.setCurrentUser(updatedUserData);
        await setCachedData(CACHE_KEYS.PROFILE_DATA, updatedUserData);
        
        if (completeUserData?.logo || completeUserData?.companyLogo) {
          setProfileImageUri(completeUserData?.logo || completeUserData?.companyLogo || null);
        }
      } catch (error) {
        console.log('⚠️ Failed to refresh profile data:', error);
      }
      
      // Fetch fresh download stats
      try {
        const downloadsResponse = await downloadTrackingService.getUserDownloads(userId);
        const posterStatsData = {
          total: downloadsResponse.downloads?.length || 0,
          recentCount: downloadsResponse.downloads?.filter((d: any) => {
            const downloadDate = new Date(d.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return downloadDate >= weekAgo;
          }).length || 0,
        };
        setPosterStats(posterStatsData);
        await setCachedData(CACHE_KEYS.DOWNLOAD_STATS, posterStatsData);
      } catch (error) {
        console.log('⚠️ Failed to refresh download stats:', error);
      }
      
      // Fetch fresh business stats
      try {
        const profiles = await businessProfileService.getUserBusinessProfiles(userId);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentCount = profiles.filter(profile => 
          new Date(profile.createdAt) > oneWeekAgo
        ).length;
        
        const businessStats = {
          total: profiles.length,
          recentCount: recentCount,
        };
        
        setBusinessProfileStats(businessStats);
        await setCachedData(CACHE_KEYS.BUSINESS_STATS, businessStats);
      } catch (error) {
        console.log('⚠️ Failed to refresh business stats:', error);
      }
      
      // Update cache timestamp
      await updateCacheTimestamp(userId);
      
      console.log('✅ Profile data refreshed successfully');
    } catch (error) {
      console.error('❌ Error during refresh:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    try {
      setShowSignOutModal(false);
      
      // Clear subscription data immediately
      clearSubscriptionData();
      
      // Call signOut (this will handle all cache clearing internally)
      await authService.signOut();
      
      // Navigation will be handled by the auth state change listener
              
            } catch (error) {
              console.error('ProfileScreen: Sign out error:', error);
              Alert.alert(
                'Sign Out Error', 
                'There was an issue signing out. Your local data has been cleared, but you may need to sign in again.',
                [{ text: 'OK' }]
              );
            }
  };



  const handleNotificationToggle = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        console.warn('No user ID available for notification toggle');
        return;
      }
      
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      
      // Save to user preferences via backend
      await userProfileService.updatePreference(userId, 'notificationsEnabled', newValue);
      
      // Animate the toggle
      Animated.timing(notificationsAnimation, {
        toValue: newValue ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      
      console.log('✅ Notification preference updated for user:', userId, 'Value:', newValue);
    } catch (error) {
      console.error('❌ Error updating notification preference:', error);
    }
  };


  const handleBusinessProfiles = () => {
    navigation.navigate('BusinessProfiles' as never);
  };

  const registerEditInputRef = (field: string) => (ref: TextInput | null) => {
    editInputRefs.current[field] = ref;
  };

  const focusEditField = (field: string) => {
    const ref = editInputRefs.current[field];
    if (ref) {
      ref.focus();
    }
  };

  const handleEditSubmitEditing = (nextField?: string, action?: () => void) => () => {
    if (nextField) {
      focusEditField(nextField);
    } else if (action) {
      action();
    } else {
      Keyboard.dismiss();
    }
  };

  const handleDarkModeToggle = async () => {
    try {
      const newValue = !isDarkMode;
      toggleDarkMode();
      
      // Dark mode is now stored locally per device, not synced with backend
      console.log('✅ Dark mode toggled locally:', newValue);
      
      // Animate the toggle
      Animated.timing(darkModeAnimation, {
        toValue: newValue ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.error('❌ Error updating dark mode preference:', error);
    }
  };

  const handleSubscription = () => {
    navigation.navigate('Subscription' as never);
  };

  const handleTransactionHistory = () => {
    navigation.navigate('TransactionHistory' as never);
  };

  const handleMyPosters = () => {
    navigation.navigate('MyPosters' as never);
  };


  const handleShareApp = async () => {
    try {
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.marketbrand';
      await Share.share({
        message: `Check out MarketBrand - Create amazing event posters and marketing materials! Download now and start creating professional posters for your events.\n\n${playStoreUrl}`,
        title: 'MarketBrand - Event Poster Creator',
        url: playStoreUrl,
      });
    } catch (error) {
      console.error('Error sharing app:', error);
      Alert.alert('Error', 'Failed to share app');
    }
  };

  const handleEditProfile = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        console.log('⚠️ No current user available');
        throw new Error('No user data available');
      }
      
      // Always fetch from backend API
      console.log('🔍 Fetching profile data from backend API...');
      
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('No user ID available');
      }
      
      // Wait for token to be available before fetching profile
      let token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('⏳ Token not yet in storage, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
        token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.log('⚠️ Token still not available, skipping API fetch and using current user data');
          // Use current user data instead of failing
          // Convert null to empty string for form fields
          setEditFormData({
            name: currentUser?.companyName || currentUser?.name || '',
            description: currentUser?.description ?? '',
            category: currentUser?.category ?? '',
            address: currentUser?.address ?? '',
            phone: currentUser?.phoneNumber || currentUser?.phone || '',
            alternatePhone: currentUser?.alternatePhone ?? '',
            email: currentUser?.email || '',
            website: currentUser?.website ?? '',
            companyLogo: currentUser?.logo || currentUser?.companyLogo || '',
          });
          setShowEditProfileModal(true);
          return;
        } else {
          console.log('✅ Token now available in storage');
        }
      }
      
      console.log('🔍 Fetching profile using userId:', userId);
      console.log('📡 Making GET request to profile API...');
      
      const profileResponse = await authApi.getProfile(userId);
      
      console.log('═══════════════════════════════════════════════');
      console.log('📥 GET PROFILE RESPONSE - START');
      console.log('═══════════════════════════════════════════════');
      console.log('📦 Full Response Object:', JSON.stringify(profileResponse, null, 2));
      console.log('───────────────────────────────────────────────');
      console.log('✅ Response Status:', (profileResponse as any)?.status || 'N/A');
      console.log('✅ Response Success:', profileResponse?.success || 'N/A');
      console.log('───────────────────────────────────────────────');
      
      const apiResponse = profileResponse.data as any;
      
      console.log('═══════════════════════════════════════════════');
      console.log('📥 API RESPONSE FROM /api/mobile/auth/me');
      console.log('═══════════════════════════════════════════════');
      console.log(JSON.stringify(apiResponse, null, 2));
      console.log('═══════════════════════════════════════════════');
      
      // Remove business profiles from API response to prevent contamination
      const { businessProfiles, ...cleanApiData } = apiResponse;
      
      // Update current user with API data
      const updatedUser = {
        ...currentUser,
        ...cleanApiData,
      };
      
      authService.setCurrentUser(updatedUser);
      
      console.log('✅ Updated currentUser with API data');
      console.log('📋 Populating Edit Form DIRECTLY from API response:');
      console.log('   - name/companyName:', apiResponse.companyName || apiResponse.name);
      console.log('   - description:', apiResponse.description);
      console.log('   - category:', apiResponse.category);
      console.log('   - address:', apiResponse.address);
      console.log('   - phone:', apiResponse.phoneNumber || apiResponse.phone);
      console.log('   - alternatePhone:', apiResponse.alternatePhone);
      console.log('   - email:', apiResponse.email);
      console.log('   - website:', apiResponse.website);
      
      // Populate edit form DIRECTLY from API response (no merging, no fallbacks)
      setEditFormData({
        name: apiResponse.companyName || apiResponse.name || '',
        description: apiResponse.description ?? '',
        category: apiResponse.category ?? '',
        address: apiResponse.address ?? '',
        phone: apiResponse.phoneNumber || apiResponse.phone || '',
        alternatePhone: apiResponse.alternatePhone ?? '',
        email: apiResponse.email || '',
        website: apiResponse.website ?? '',
        companyLogo: apiResponse.logo || apiResponse.companyLogo || '',
      });
      
      setShowEditProfileModal(true);
      
    } catch (error) {
      console.log('⚠️ Failed to fetch complete profile data from API:', error);
      
      // No local storage fallback - API only
      console.log('❌ All profile API endpoints failed, showing error to user');
      
      // Show error to user instead of using local data
      Alert.alert(
        'Error', 
        'Failed to load profile data from server. Please check your internet connection and try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Edit profile cancelled due to API error');
            }
          }
        ]
      );
    }
  };

  const handleSaveProfile = async () => {
    // Only validate the essential fields
    if (!editFormData.name.trim()) {
      Alert.alert('Error', 'Company name is required');
      return;
    }

    if (!editFormData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    if (!editFormData.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    // Validate phone number - must be exactly 10 digits
    const phoneDigits = editFormData.phone.trim().replace(/\D/g, ''); // Remove non-digit characters
    if (phoneDigits.length !== 10) {
      setPhoneValidationError('Phone number must be exactly 10 digits');
      Alert.alert(
        'Invalid Phone Number',
        'Phone number must be exactly 10 digits. Please enter a valid phone number.',
        [{ text: 'OK' }]
      );
      return;
    } else {
      setPhoneValidationError(''); // Clear error if valid
    }

    // Validate alternate phone - if provided, must be exactly 10 digits
    if (editFormData.alternatePhone.trim()) {
      const alternatePhoneDigits = editFormData.alternatePhone.trim().replace(/\D/g, '');
      if (alternatePhoneDigits.length !== 10) {
        setAlternatePhoneValidationError('Alternate phone must be exactly 10 digits');
        Alert.alert(
          'Invalid Alternate Phone',
          'Alternate phone number must be exactly 10 digits. Please enter a valid phone number or leave it empty.',
          [{ text: 'OK' }]
        );
        return;
      } else {
        setAlternatePhoneValidationError(''); // Clear error if valid
      }
    } else {
      setAlternatePhoneValidationError(''); // Clear error if empty (optional field)
    }

    if (!editFormData.category.trim()) {
      Alert.alert('Error', 'Business category is required');
      return;
    }

    setIsUpdating(true);
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      // Wait for token to be available before updating profile
      let token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('⏳ Token not yet in storage, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
        token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.log('⚠️ Token still not available, cannot update profile');
          Alert.alert('Error', 'Authentication token not available. Please try again.');
          setIsUpdating(false);
          return;
        } else {
          console.log('✅ Token now available in storage');
        }
      }

      // Update profile via backend API
      // Send null for empty fields to allow clearing them
      const logoValue = editFormData.companyLogo.trim() || null;
      const updateData = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        description: editFormData.description.trim() || null,
        category: editFormData.category.trim(),
        address: editFormData.address.trim() || null,
        alternatePhone: editFormData.alternatePhone.trim() || null, // Send null to clear
        website: editFormData.website.trim() || null,
        companyLogo: logoValue,
        logo: logoValue, // Sync both logo fields to ensure API stores correctly
      };

      const response = await authApi.updateProfile(updateData, userId);
      
      console.log('📥 API Update Response:', JSON.stringify(response, null, 2));
      console.log('📥 Response data fields:', Object.keys(response.data || {}));
      
      if (response.success) {
        // API returns user data nested under response.data.user (or directly in response.data)
        const responseData: any = response.data;
        const apiUserData = responseData.user || response.data;
        
        // CRITICAL WORKAROUND FOR BACKEND BUG:
        // Backend sometimes returns contaminated data from business profiles
        // We MUST use what WE SENT (updateData) as the source of truth for fields we updated
        console.log('🛡️ BACKEND BUG PROTECTION: Using sent data as source of truth');
        console.log('   - address (sent):', updateData.address);
        console.log('   - address (backend returned):', apiUserData.address);
        console.log('   - website (sent):', updateData.website);
        console.log('   - website (backend returned):', apiUserData.website);
        console.log('   - category (sent):', updateData.category);
        console.log('   - category (backend returned):', apiUserData.category);
        
        console.log('📥 Extracted user data:', JSON.stringify(apiUserData, null, 2));
        console.log('📤 What we sent (updateData):', JSON.stringify(updateData, null, 2));
        console.log('🔍 Checking which fields API returned:');
        console.log('   - category in API?', 'category' in apiUserData, apiUserData.category);
        console.log('   - description in API?', 'description' in apiUserData, apiUserData.description);
        console.log('   - address in API?', 'address' in apiUserData, apiUserData.address);
        console.log('   - website in API?', 'website' in apiUserData, apiUserData.website);
        
        // Update the current user object with the response
        // CRITICAL WORKAROUND: Backend has a bug where it returns contaminated data
        // We MUST use what WE SENT (updateData) as the source of truth
        const updatedCompanyName = apiUserData.name || apiUserData.companyName || updateData.name;
        
        // Sync logo from API response (prefer 'logo' field, fallback to 'companyLogo')
        const updatedLogo = apiUserData.logo || apiUserData.companyLogo || (updateData as any).logo || (updateData as any).companyLogo || currentUser?.logo || currentUser?.companyLogo;
        
        const updatedUser = {
          ...currentUser,
          ...apiUserData,
          // User profile fields - map API fields to local fields
          displayName: updatedCompanyName,
          companyName: updatedCompanyName,
          name: updatedCompanyName,
          phoneNumber: apiUserData.phone || apiUserData.phoneNumber || currentUser?.phoneNumber,
          phone: apiUserData.phone || apiUserData.phoneNumber || currentUser?.phoneNumber,
          bio: apiUserData.description !== undefined ? apiUserData.description : (updateData.description ?? ''),
          // CRITICAL: Use what WE SENT as source of truth (backend may return contaminated data)
          address: updateData.address ?? '',
          website: updateData.website ?? '',
          category: updateData.category ?? '',
          description: updateData.description ?? '',
          alternatePhone: updateData.alternatePhone ?? '',
          // Logo fields - sync from API response
          logo: updatedLogo,
          companyLogo: updatedLogo,
          photoURL: updatedLogo,
          profileImage: updatedLogo,
          // Update _original fields with what we SENT (user's intended values)
          _originalCompanyName: updatedCompanyName,
          _originalAddress: updateData.address ?? '',
          _originalWebsite: updateData.website ?? '',
          _originalCategory: updateData.category ?? '',
          _originalDescription: updateData.description ?? '',
          _originalAlternatePhone: updateData.alternatePhone ?? '',
        };
        
        console.log('✅ Updated user object (USER FIELDS ONLY):');
        console.log('   - companyName:', updatedUser.companyName);
        console.log('   - address:', updatedUser.address);
        console.log('   - website:', updatedUser.website);
        console.log('   - category:', updatedUser.category);
        console.log('   - description:', updatedUser.description);
        console.log('   - alternatePhone:', updatedUser.alternatePhone);
        console.log('✅ Protected original values:');
        console.log('   - _originalCompanyName:', updatedUser._originalCompanyName);
        console.log('   - _originalAddress:', updatedUser._originalAddress);
        console.log('   - _originalWebsite:', updatedUser._originalWebsite);
        console.log('   - _originalCategory:', updatedUser._originalCategory);
        console.log('   - _originalDescription:', updatedUser._originalDescription);
        console.log('   - _originalAlternatePhone:', updatedUser._originalAlternatePhone);
        
        authService.setCurrentUser(updatedUser);
        
        // Update profile image URI if logo changed
        if (updatedLogo && updatedLogo !== profileImageUri) {
          console.log('🖼️ Updating profile image URI to:', updatedLogo);
          setProfileImageUri(updatedLogo);
        }
        
        console.log('✅ Profile updated in memory');
        console.log('   - address:', updatedUser.address);
        console.log('   - website:', updatedUser.website);
        console.log('   - category:', updatedUser.category);
        console.log('   - description:', updatedUser.description);
        console.log('   - logo:', updatedUser.logo)
        
        // Invalidate profile cache to force fresh data on next load
        console.log('🗑️ Invalidating profile cache after update');
        await invalidateCache();
        
        // Cache the newly updated profile data
        await setCachedData(CACHE_KEYS.PROFILE_DATA, authService.getCurrentUser());
        await updateCacheTimestamp(userId);
        console.log('💾 Updated profile data cached');
        
        // Clear business profile cache to force refresh on next visit
        console.log('🔄 Clearing business profile cache after profile update');
        try {
          const businessProfileService = require('../services/businessProfile').default;
          businessProfileService.clearCache();
        } catch (error) {
          console.error('Failed to clear business profile cache:', error);
        }
        
        // Clear business category posters cache to refresh My Business screen with new category posters
        console.log('🔄 Clearing business category posters cache after profile update');
        try {
          const businessCategoryPostersApi = require('../services/businessCategoryPostersApi').default;
          businessCategoryPostersApi.clearCache();
        } catch (error) {
          console.error('Failed to clear business category posters cache:', error);
        }
        
        setShowEditProfileModal(false);
        setSuccessMessage('Profile updated successfully!');
        setShowSuccessModal(true);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrorModalMessage('Failed to update profile. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    const user = authService.getCurrentUser();
    setShowEditProfileModal(false);
    // Convert null to empty string for form fields
    setEditFormData({
      name: user?.companyName || user?.name || '',
      description: user?.description ?? '',
      category: user?.category ?? '',
      address: user?.address ?? '',
      phone: user?.phoneNumber || user?.phone || '',
      alternatePhone: user?.alternatePhone ?? '',
      email: user?.email || '',
      website: user?.website ?? '',
      companyLogo: user?.logo || user?.companyLogo || '',
    });
  };

  // Validate phone number (exactly 10 digits)
  const validatePhone = (phone: string): string => {
    if (!phone || !phone.trim()) return ''; // Empty is OK for optional fields
    const digits = phone.trim().replace(/\D/g, ''); // Remove non-digits
    if (digits.length === 0) return '';
    if (digits.length < 10) return `Phone must be 10 digits (currently ${digits.length})`;
    if (digits.length > 10) return `Phone must be 10 digits (currently ${digits.length})`;
    return ''; // Valid
  };

  const handleImagePickerPress = () => {
    setShowImagePickerModal(true);
  };

  const handleImageSelected = async (imageUri: string) => {
    console.log('🖼️ [START] handleImageSelected called with:', imageUri);
    
    try {
      // Validate image URI first
      if (!imageUri || imageUri.trim() === '') {
        console.error('❌ Invalid image URI received');
        Alert.alert('Error', 'Invalid image. Please try again.');
        return;
      }
      
      // Get current user at the start
      const currentUser = authService.getCurrentUser();
      console.log('📍 Current user info:', {
        id: currentUser?.id,
        logo: currentUser?.logo,
        companyLogo: currentUser?.companyLogo,
      });
      
      if (!currentUser) {
        console.error('❌ No current user available');
        Alert.alert('Error', 'User session not found. Please try again.');
        return;
      }
      
      const userId = currentUser?.id;
      if (!userId) {
        console.error('❌ No user ID available');
        Alert.alert('Error', 'User ID not found. Please try again.');
        return;
      }
      
      // Step 1: Update UI state immediately (optimistic update)
      try {
        console.log('✅ Step 1: Setting profile image URI (optimistic)...');
        setProfileImageUri(imageUri);
        console.log('✅ Step 1 complete');
      } catch (error) {
        console.error('❌ Step 1 failed:', error);
        throw error;
      }
      
      // Step 2: Upload image file to server using FormData
      let uploadedLogoUrl: string;
      try {
        console.log('✅ Step 2: Uploading image file to server...');
        console.log('📤 [STEP 2] Using proper file upload (FormData)');
        
        const response = await authApi.uploadProfileImage(userId, imageUri);
        
        // Extract the logo URL from response (handle multiple response shapes)
        const responsePayload: Partial<UserProfile> | undefined =
          (response as ProfileResponse)?.data ??
          (response as any)?.data ??
          (response as any);

        uploadedLogoUrl =
          responsePayload?.logo ||
          responsePayload?.companyLogo ||
          (response as any)?.data?.data?.logo ||
          (response as any)?.logo;
        
        if (!uploadedLogoUrl) {
          console.error('❌ [STEP 2] No logo URL in response:', response);
          throw new Error('Server did not return a logo URL');
        }
        
        console.log('✅ Step 2 complete - Uploaded logo URL:', uploadedLogoUrl);
        console.log('🔗 [STEP 2] Image now available at:', uploadedLogoUrl);
      } catch (error: any) {
        console.error('❌ Step 2 file upload failed:', error);
        
        // Check if backend endpoint doesn't exist
        if (error.message?.includes('Backend upload endpoint not implemented')) {
          Alert.alert(
            'Feature Not Ready',
            'The image upload feature requires backend updates.\n\n' +
            'Please contact the development team to implement the upload endpoint.\n\n' +
            'Details: POST /api/mobile/users/:userId/upload-logo',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Upload Failed',
            error.message || 'Failed to upload profile picture. Please try again.',
            [{ text: 'OK' }]
          );
        }
        
        // Revert UI state
        setProfileImageUri(currentUser?.logo || currentUser?.companyLogo || null);
        return;
      }
      
      // Step 3: Update user object locally with the uploaded URL
      let updatedUser;
      try {
        console.log('✅ Step 3: Creating updated user object with uploaded URL...');
        updatedUser = {
          ...currentUser,
          logo: uploadedLogoUrl, // Use the HTTPS URL from server
          photoURL: uploadedLogoUrl,
          profileImage: uploadedLogoUrl,
          companyLogo: uploadedLogoUrl, // Keep for backward compatibility
        };
        
        // Update in auth service
        authService.setCurrentUser(updatedUser);
        
        // Update UI with the server URL
        setProfileImageUri(uploadedLogoUrl);
        
        console.log('✅ Step 3 complete');
        console.log('🔗 [STEP 3] Profile now uses server URL:', uploadedLogoUrl);
      } catch (error) {
        console.error('❌ Step 3 failed:', error);
        throw error;
      }
      
      // Step 4: Save to storage
      try {
        console.log('✅ Step 4: Saving to storage...');
        const authToken = await AsyncStorage.getItem('authToken');
        await authService.saveUserToStorage(updatedUser, authToken || '');
        console.log('✅ Step 4 complete');
      } catch (error) {
        console.error('❌ Step 4 failed:', error);
        // Continue anyway - this is not critical
      }
      
      // Step 5: Update cache
      try {
        console.log('✅ Step 5: Updating cache...');
        await setCachedData(CACHE_KEYS.PROFILE_DATA, updatedUser);
        await updateCacheTimestamp(currentUser.id);
        console.log('✅ Step 5 complete');
      } catch (error) {
        console.error('❌ Step 5 failed:', error);
        // Continue anyway - this is not critical
      }
      
      console.log('✅ Profile picture updated in storage');
      console.log('💾 Profile picture cached');
      
      // Step 6: Update ONLY the MAIN business profile (first profile from registration) with the new logo
      try {
        console.log('✅ Step 6: Updating MAIN business profile with new logo...');
        console.log('🔗 [STEP 6] Using uploaded URL:', uploadedLogoUrl);
        
        if (!userId) {
          console.log('⚠️ No user ID available for business profile update, skipping');
        } else {
          console.log('🔍 User ID for business profile update:', userId);
          const businessProfileService = require('../services/businessProfile').default;
          
          const profiles = await businessProfileService.getUserBusinessProfiles(userId);
          console.log(`📋 Found ${profiles.length} business profiles`);
          
          if (profiles.length > 0) {
            // Sort to get the FIRST/MAIN profile (created during registration)
            const sortedByDate = [...profiles].sort((a: any, b: any) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            
            const mainProfile = sortedByDate[0]; // First profile = user's main profile
            const otherProfiles = sortedByDate.slice(1); // All other profiles
            
            console.log(`📍 MAIN profile identified: ${mainProfile.name} (created: ${mainProfile.createdAt})`);
            
            // Update MAIN profile with new logo (using uploaded URL, not local path)
            try {
              await businessProfileService.updateBusinessProfile(mainProfile.id, {
                logo: uploadedLogoUrl, // Use HTTPS URL from server
              });
              console.log(`✅ Logo updated for MAIN profile: ${mainProfile.name}`);
              console.log(`🔗 [STEP 6] Main profile now uses: ${uploadedLogoUrl}`);
            } catch (error) {
              console.error(`❌ Failed to update logo for main profile:`, error);
            }
            
            // REMOVE user's logo FROM other business profiles
            console.log(`📋 Checking ${otherProfiles.length} other profiles for cleanup...`);
            let removedCount = 0;
            for (const profile of otherProfiles) {
              const profileLogo = profile.logo || profile.companyLogo;
              const oldUserLogo = currentUser?.logo || currentUser?.companyLogo;
              if (profileLogo && (profileLogo === oldUserLogo || profileLogo === imageUri || profileLogo === uploadedLogoUrl)) {
                try {
                  await businessProfileService.updateBusinessProfile(profile.id, {
                    logo: '', // Clear logo from non-main profiles
                  });
                  removedCount++;
                } catch (error) {
                  console.error(`❌ Failed to remove logo from ${profile.name}:`, error);
                }
              }
            }
            
            if (removedCount > 0) {
              console.log(`✅ Removed user logo from ${removedCount} other profiles`);
            }
            
            businessProfileService.clearCache();
          } else {
            console.log('ℹ️ No business profiles found, skipping logo sync');
          }
        }
        console.log('✅ Step 6 complete');
      } catch (error) {
        console.error('❌ Step 6 failed:', error);
        // Don't fail the user profile update if business profile update fails
      }
      
      // Step 7: Show success message
      try {
        console.log('✅ Step 7: Showing success message...');
        setSuccessMessage('Profile picture updated successfully!');
        setShowSuccessModal(true);
        console.log('✅ Step 7 complete');
      } catch (error) {
        console.error('❌ Step 7 failed:', error);
      }
      
      console.log('✅ [COMPLETE] Profile picture update complete');
    } catch (error) {
      console.error('❌ [ERROR] Fatal error in handleImageSelected:', error);
      console.error('❌ [ERROR] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❌ [ERROR] Error message:', error instanceof Error ? error.message : String(error));
      
      Alert.alert(
        'Update Error',
        'Failed to update profile picture. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCloseImagePicker = () => {
    setShowImagePickerModal(false);
  };

  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    showToggle?: boolean,
    toggleValue?: boolean,
    onToggle?: () => void,
    animationValue?: Animated.Value
  ) => (
    <TouchableOpacity 
      style={[styles.menuItem, { 
        backgroundColor: theme.colors.cardBackground,
        marginHorizontal: dynamicModerateScale(8),
        marginBottom: dynamicModerateScale(6),
        paddingVertical: dynamicModerateScale(10),
        paddingHorizontal: dynamicModerateScale(12),
        borderRadius: dynamicModerateScale(12),
      }]} 
      onPress={onPress} 
      disabled={showToggle}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuItemIcon, { 
          backgroundColor: `${theme.colors.primary}20`,
          width: dynamicModerateScale(32),
          height: dynamicModerateScale(32),
          borderRadius: dynamicModerateScale(16),
          marginRight: dynamicModerateScale(10),
        }]}>
          <Icon name={icon} size={getIconSize(16)} color={theme.colors.primary} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemText, { 
            color: theme.colors.text,
            fontSize: getFontSize(10),
          }]}>{title}</Text>
          {subtitle && <Text style={[styles.menuItemSubtext, { 
            color: theme.colors.textSecondary,
            fontSize: getFontSize(8),
            marginTop: dynamicModerateScale(0.5),
          }]}>{subtitle}</Text>}
        </View>
      </View>
             {showToggle ? (
          <TouchableOpacity
            style={[
              styles.toggle, 
              { 
                backgroundColor: toggleValue ? theme.colors.primary : theme.colors.border,
                width: dynamicModerateScale(40),
                height: dynamicModerateScale(20),
                borderRadius: dynamicModerateScale(10),
              }
            ]}
            onPress={onToggle}
            activeOpacity={0.7}
          >
            <Animated.View 
              style={[
                styles.toggleThumb, 
                { 
                  backgroundColor: theme.colors.surface,
                  width: dynamicModerateScale(16),
                  height: dynamicModerateScale(16),
                  borderRadius: dynamicModerateScale(8),
                  transform: [{
                    translateX: animationValue ? animationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, dynamicModerateScale(20)] // Move from left to right
                    }) : 0
                  }]
                }
              ]} 
            />
          </TouchableOpacity>
        ) : (
          <Icon name="chevron-right" size={getIconSize(20)} color={theme.colors.textSecondary} />
        )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.gradient[0] || '#e8e8e8' }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent" 
        translucent={true}
      />
      
      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { 
          paddingTop: dynamicModerateScale(10),
          paddingHorizontal: dynamicModerateScale(2),
          paddingBottom: dynamicModerateScale(1),
        }]}> 
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: 80 + insets.bottom }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#333333"
              colors={['#667eea', '#764ba2']}
              title="Pull to refresh"
              titleColor="#333333"
            />
          }
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { 
            backgroundColor: theme.colors.cardBackground,
            marginHorizontal: dynamicModerateScale(8),
            marginBottom: dynamicModerateScale(12),
            borderRadius: dynamicModerateScale(16),
            padding: dynamicModerateScale(12),
          }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarContainer, {
                marginBottom: dynamicModerateScale(10),
                zIndex: 1,
              }]}>
                {(() => {
                  const rawRaw = profileImageUri || currentUser?.logo || currentUser?.companyLogo || currentUser?.photoURL || currentUser?.profileImage || null;
                  const rawUri = sanitizeUrl(rawRaw);
                  const avatarUri = ensureHttps(toAbsoluteUrl(rawUri));
                  if (avatarUri) {
                    console.log('🖼️ [PROFILE] Avatar URI:', { raw: rawUri, normalized: avatarUri });
                  } else {
                    console.log('🖼️ [PROFILE] No avatar URI available');
                  }
                  return avatarUri && !avatarErrored ? (
                  <View style={[styles.avatarImageContainer, {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    borderWidth: 2,
                    backgroundColor: '#eaeaea',
                  }]}>
                    <Image
                      key={avatarUri}
                      source={{ uri: avatarUri }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                      onError={() => {
                        console.log('🖼️ [PROFILE] Avatar failed to load:', avatarUri);
                        setAvatarErrored(true);
                      }}
                    />
                  </View>
                  ) : (
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    style={[styles.avatarGradient, {
                      width: avatarSize,
                      height: avatarSize,
                      borderRadius: avatarSize / 2,
                    }]}
                  >
                    <Text style={[styles.avatarText, {
                      fontSize: getFontSize(24),
                    }]}>
                      {(currentUser?.companyName || currentUser?.displayName)?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                    </Text>
                  </LinearGradient>
                  );
                })()}
                <TouchableOpacity 
                  style={[styles.editAvatarButton, { 
                    backgroundColor: theme.colors.primary,
                    width: dynamicModerateScale(24),
                    height: dynamicModerateScale(24),
                    borderRadius: dynamicModerateScale(12),
                    borderWidth: 2,
                  }]}
                  onPress={handleImagePickerPress}
                >
                  <Icon name="camera-alt" size={getIconSize(12)} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.userName, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(10),
                  marginBottom: dynamicModerateScale(2),
                }]}>
                  {currentUser?.companyName || currentUser?.displayName || currentUser?.name || 'MarketBrand'}
                </Text>
                <Text style={[styles.userEmail, { 
                  color: theme.colors.textSecondary,
                  fontSize: getFontSize(8),
                  marginBottom: dynamicModerateScale(4),
                }]}>
                  {currentUser?.email || 'eventmarketer@example.com'}
                </Text>
                <View style={styles.profileStats}>
                  <View style={[styles.statItem, {
                    paddingHorizontal: dynamicModerateScale(8),
                  }]}>
                    <Text style={[styles.statNumber, { 
                      color: theme.colors.primary,
                      fontSize: getFontSize(12),
                    }]}>{posterStats.total}</Text>
                    <Text style={[styles.statLabel, { 
                      color: theme.colors.textSecondary,
                      fontSize: getFontSize(7),
                      marginTop: dynamicModerateScale(0.5),
                    }]}>Downloads</Text>
                  </View>
                  <View style={[styles.statDivider, { 
                    backgroundColor: theme.colors.border,
                    width: 1,
                    height: dynamicModerateScale(16),
                    marginHorizontal: dynamicModerateScale(5),
                  }]} />
                  <View style={[styles.statItem, {
                    paddingHorizontal: dynamicModerateScale(8),
                  }]}>
                    <Text style={[styles.statNumber, { 
                      color: theme.colors.primary,
                      fontSize: getFontSize(12),
                    }]}>{businessProfileStats.total}</Text>
                    <Text style={[styles.statLabel, { 
                      color: theme.colors.textSecondary,
                      fontSize: getFontSize(7),
                      marginTop: dynamicModerateScale(0.5),
                    }]}>Business</Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.editProfileButton, { 
                backgroundColor: theme.colors.primary,
                paddingVertical: dynamicModerateScale(8),
                paddingHorizontal: dynamicModerateScale(12),
                borderRadius: dynamicModerateScale(10),
                marginTop: dynamicModerateScale(10),
                gap: dynamicModerateScale(4),
              }]}
              onPress={handleEditProfile}
            >
              <Icon name="edit" size={getIconSize(12)} color="#ffffff" />
              <Text style={[styles.editProfileButtonText, {
                fontSize: getFontSize(9),
              }]}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Account Settings */}
          <View style={[styles.section, {
            marginBottom: dynamicModerateScale(12),
          }]}>
            <Text style={[styles.sectionTitle, {
              fontSize: getFontSize(10),
              marginBottom: dynamicModerateScale(5),
              paddingHorizontal: dynamicModerateScale(8),
              color: theme.colors.text,
            }]}>Account Settings</Text>
            {renderMenuItem('business', 'Business Profiles', `${businessProfileStats.total} profiles • ${businessProfileStats.recentCount} recent`, handleBusinessProfiles)}
            {/* Notifications temporarily hidden */}
            {/* {renderMenuItem('notifications', 'Notifications', 'Manage notification preferences', undefined, true, notificationsEnabled, handleNotificationToggle, notificationsAnimation)} */}
          </View>

          {/* My Posters Section */}
          <View style={[styles.section, {
            marginBottom: dynamicModerateScale(12),
          }]}>
            <Text style={[styles.sectionTitle, {
              fontSize: getFontSize(10),
              marginBottom: dynamicModerateScale(5),
              paddingHorizontal: dynamicModerateScale(8),
              color: theme.colors.text,
            }]}>My Posters</Text>
            <TouchableOpacity 
              style={[styles.myPostersCard, { 
                backgroundColor: theme.colors.cardBackground,
                marginHorizontal: dynamicModerateScale(8),
                marginBottom: dynamicModerateScale(6),
                paddingVertical: dynamicModerateScale(10),
                paddingHorizontal: dynamicModerateScale(12),
                borderRadius: dynamicModerateScale(12),
              }]}
              onPress={handleMyPosters}
            >
              <View style={styles.myPostersContent}>
                <View style={styles.myPostersLeft}>
                  <View style={[styles.myPostersIcon, { 
                    backgroundColor: `${theme.colors.primary}20`,
                    width: dynamicModerateScale(32),
                    height: dynamicModerateScale(32),
                    borderRadius: dynamicModerateScale(16),
                    marginRight: dynamicModerateScale(10),
                  }]}>
                    <Icon name="image" size={getIconSize(16)} color={theme.colors.primary} />
                  </View>
                  <View style={styles.myPostersInfo}>
                    <Text style={[styles.myPostersTitle, { 
                      color: theme.colors.text,
                      fontSize: getFontSize(10),
                    }]}>
                      Downloaded Posters
                    </Text>
                    <Text style={[styles.myPostersSubtitle, { 
                      color: theme.colors.textSecondary,
                      fontSize: getFontSize(8),
                      marginTop: dynamicModerateScale(0.5),
                    }]}>
                      {posterStats.total} posters • {posterStats.recentCount} recent
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={getIconSize(20)} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>


          {/* Subscription Section */}
          <View style={[styles.section, {
            marginBottom: dynamicModerateScale(12),
          }]}>
            <Text style={[styles.sectionTitle, {
              fontSize: getFontSize(10),
              marginBottom: dynamicModerateScale(5),
              paddingHorizontal: dynamicModerateScale(8),
              color: theme.colors.text,
            }]}>Subscription</Text>
            <TouchableOpacity 
              style={[styles.subscriptionCard, { 
                backgroundColor: theme.colors.cardBackground,
                marginHorizontal: dynamicModerateScale(8),
                marginBottom: dynamicModerateScale(6),
                paddingVertical: dynamicModerateScale(10),
                paddingHorizontal: dynamicModerateScale(12),
                borderRadius: dynamicModerateScale(12),
              }]}
              onPress={handleSubscription}
            >
              <View style={styles.subscriptionContent}>
                <View style={styles.subscriptionLeft}>
                  <View style={[styles.subscriptionIcon, { 
                    backgroundColor: isSubscribed ? '#28a745' : '#667eea',
                    width: dynamicModerateScale(32),
                    height: dynamicModerateScale(32),
                    borderRadius: dynamicModerateScale(16),
                    marginRight: dynamicModerateScale(10),
                  }]}>
                    <Icon 
                      name={isSubscribed ? 'check-circle' : 'star'} 
                      size={getIconSize(16)} 
                      color="#ffffff" 
                    />
                  </View>
                  <View style={styles.subscriptionInfo}>
                    <Text style={[styles.subscriptionTitle, { 
                      color: theme.colors.text,
                      fontSize: getFontSize(10),
                    }]}>
                      {isSubscribed 
                        ? (subscriptionStatus?.planName || 'Pro Subscription')
                        : 'Upgrade to Pro'}
                    </Text>
                    <Text style={[styles.subscriptionSubtitle, { 
                      color: theme.colors.textSecondary,
                      fontSize: getFontSize(8),
                      marginTop: dynamicModerateScale(0.5),
                    }]}>
                      {isSubscribed 
                        ? (() => {
                            const expiryDate = subscriptionStatus?.expiryDate || subscriptionStatus?.endDate;
                            if (expiryDate) {
                              const daysRemaining = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                              return `Active • ${daysRemaining} days remaining`;
                            }
                            return 'Active • Unlimited features';
                          })()
                        : 'Unlock unlimited possibilities'}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={getIconSize(20)} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
            
            {/* Transaction History Button */}
            <TouchableOpacity 
              style={[styles.transactionHistoryCard, { 
                backgroundColor: theme.colors.cardBackground,
                marginHorizontal: dynamicModerateScale(8),
                marginBottom: dynamicModerateScale(6),
                paddingVertical: dynamicModerateScale(10),
                paddingHorizontal: dynamicModerateScale(12),
                borderRadius: dynamicModerateScale(12),
              }]}
              onPress={handleTransactionHistory}
            >
              <View style={styles.transactionHistoryContent}>
                <View style={styles.transactionHistoryLeft}>
                  <View style={[styles.transactionHistoryIcon, { 
                    backgroundColor: '#667eea20',
                    width: dynamicModerateScale(32),
                    height: dynamicModerateScale(32),
                    borderRadius: dynamicModerateScale(16),
                    marginRight: dynamicModerateScale(10),
                  }]}>
                    <Icon name="receipt-long" size={getIconSize(16)} color="#667eea" />
                  </View>
                  <View style={styles.transactionHistoryInfo}>
                    <Text style={[styles.transactionHistoryTitle, { 
                      color: theme.colors.text,
                      fontSize: getFontSize(10),
                    }]}>
                      Transaction History
                    </Text>
                    <Text style={[styles.transactionHistorySubtitle, { 
                      color: theme.colors.textSecondary,
                      fontSize: getFontSize(8),
                      marginTop: dynamicModerateScale(0.5),
                    }]}>
                      {transactionStats.total} transactions • View payment history
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={getIconSize(20)} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

                     {/* App Settings */}
           <View style={[styles.section, {
             marginBottom: dynamicModerateScale(12),
           }]}>
             <Text style={[styles.sectionTitle, {
               fontSize: getFontSize(10),
               marginBottom: dynamicModerateScale(5),
               paddingHorizontal: dynamicModerateScale(8),
               color: theme.colors.text,
             }]}>App Settings</Text>
             {renderMenuItem('dark-mode', 'Dark Mode', 'Switch to dark theme', undefined, true, isDarkMode, handleDarkModeToggle, darkModeAnimation)}
           </View>

          {/* Support & Legal */}
          <View style={[styles.section, {
            marginBottom: dynamicModerateScale(12),
          }]}>
            <Text style={[styles.sectionTitle, {
              fontSize: getFontSize(10),
              marginBottom: dynamicModerateScale(5),
              paddingHorizontal: dynamicModerateScale(8),
              color: theme.colors.text,
            }]}>Support & Legal</Text>
            {renderMenuItem('help', 'Help & Support', 'Get help and contact support', () => navigation.navigate('HelpSupport' as never))}
            {renderMenuItem('privacy-tip', 'Privacy Policy', 'Read our privacy policy', () => navigation.navigate('PrivacyPolicy' as never))}
            {renderMenuItem('info', 'About App', 'Version 1.0.0', () => navigation.navigate('AboutUs'))}
          </View>

          {/* Share App Section */}
          <View style={[styles.section, {
            marginBottom: dynamicModerateScale(12),
          }]}>
            <Text style={[styles.sectionTitle, {
              fontSize: getFontSize(10),
              marginBottom: dynamicModerateScale(5),
              paddingHorizontal: dynamicModerateScale(8),
              color: theme.colors.text,
            }]}>Share & Support</Text>
            <TouchableOpacity 
              style={[styles.shareAppCard, { 
                backgroundColor: theme.colors.cardBackground,
                marginHorizontal: dynamicModerateScale(8),
                marginBottom: dynamicModerateScale(6),
                paddingVertical: dynamicModerateScale(10),
                paddingHorizontal: dynamicModerateScale(12),
                borderRadius: dynamicModerateScale(12),
              }]}
              onPress={handleShareApp}
            >
              <View style={styles.shareAppContent}>
                <View style={styles.shareAppLeft}>
                  <View style={[styles.shareAppIcon, { 
                    backgroundColor: `${theme.colors.primary}20`,
                    width: dynamicModerateScale(32),
                    height: dynamicModerateScale(32),
                    borderRadius: dynamicModerateScale(16),
                    marginRight: dynamicModerateScale(10),
                  }]}>
                    <Icon name="share" size={getIconSize(16)} color={theme.colors.primary} />
                  </View>
                  <View style={styles.shareAppInfo}>
                    <Text style={[styles.shareAppTitle, { 
                      color: theme.colors.text,
                      fontSize: getFontSize(10),
                    }]}>
                      Share MarketBrand
                    </Text>
                    <Text style={[styles.shareAppSubtitle, { 
                      color: theme.colors.textSecondary,
                      fontSize: getFontSize(8),
                      marginTop: dynamicModerateScale(0.5),
                    }]}>
                      Help others discover amazing event posters
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={getIconSize(20)} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity 
            style={[styles.signOutButton, { 
              backgroundColor: '#ff4444',
              borderColor: '#ff4444',
              marginHorizontal: dynamicModerateScale(8),
              marginTop: dynamicModerateScale(12),
              paddingVertical: dynamicModerateScale(10),
              borderRadius: dynamicModerateScale(12),
            }]} 
            onPress={handleSignOut}
          >
            <Icon name="logout" size={getIconSize(14)} color="#ffffff" style={[styles.signOutIcon, {
              marginRight: dynamicModerateScale(5),
            }]} />
            <Text style={[styles.signOutText, { 
              color: '#ffffff',
              fontSize: getFontSize(10),
            }]}>Sign Out</Text>
          </TouchableOpacity>

          {/* App Version */}
            <Text style={[styles.versionText, { 
            color: theme.colors.textSecondary,
            fontSize: getFontSize(8),
            marginTop: dynamicModerateScale(14),
          }]}>Version 1.0.0</Text>
        </ScrollView>
      </LinearGradient>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.colors.cardBackground,
            borderRadius: dynamicModerateScale(16),
          }]}>
            <View style={[styles.modalHeader, {
              paddingHorizontal: dynamicModerateScale(12),
              paddingVertical: dynamicModerateScale(12),
              borderBottomWidth: 0.5,
            }]}>
              <Text style={[styles.modalTitle, { 
                color: theme.colors.text,
                fontSize: getFontSize(12),
              }]}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCancelEdit} style={[styles.modalCloseButton, {
                padding: dynamicModerateScale(3),
              }]}>
                <Icon name="close" size={getIconSize(20)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={[styles.modalBody, {
              paddingHorizontal: dynamicModerateScale(12),
              paddingVertical: dynamicModerateScale(12),
            }]} showsVerticalScrollIndicator={false}>
              {/* Company Name */}
              <View style={[styles.inputGroup, {
                marginBottom: dynamicModerateScale(12),
              }]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(9),
                  marginBottom: dynamicModerateScale(3),
                }]}>Company Name *</Text>
                <TextInput
                  ref={registerEditInputRef('editName')}
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    paddingHorizontal: dynamicModerateScale(10),
                    paddingVertical: dynamicModerateScale(7),
                    fontSize: getFontSize(10),
                    borderRadius: dynamicModerateScale(10),
                  }]}
                  value={editFormData.name}
                  onChangeText={(text) => setEditFormData({...editFormData, name: text})}
                  placeholder="Enter your company name"
                  placeholderTextColor={theme.colors.textSecondary}
                  returnKeyType="next"
                  onSubmitEditing={handleEditSubmitEditing('editDescription')}
                />
              </View>

              {/* Description */}
              <View style={[styles.inputGroup, {
                marginBottom: dynamicModerateScale(12),
              }]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(9),
                  marginBottom: dynamicModerateScale(3),
                }]}>Description</Text>
                <TextInput
                  ref={registerEditInputRef('editDescription')}
                  style={[styles.textArea, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    paddingHorizontal: dynamicModerateScale(10),
                    paddingVertical: dynamicModerateScale(7),
                    fontSize: getFontSize(10),
                    borderRadius: dynamicModerateScale(10),
                    minHeight: dynamicModerateScale(55),
                  }]}
                  value={editFormData.description}
                  onChangeText={(text) => setEditFormData({...editFormData, description: text})}
                  placeholder="Describe your business..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="next"
                  blurOnSubmit
                  onSubmitEditing={handleEditSubmitEditing('editPhone')}
                />
              </View>

              {/* Business Category section hidden */}
              {false && (
              <View style={[styles.inputGroup, {
                marginBottom: dynamicModerateScale(12),
              }]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(9),
                  marginBottom: dynamicModerateScale(3),
                }]}>Business Category *</Text>
                
                {/* Selected Category Display */}
                <View style={[styles.selectedCategoryContainer, {
                  marginBottom: dynamicModerateScale(8),
                }]}>
                  <TextInput
                    style={[
                      styles.selectedCategoryInput,
                      { 
                        color: theme.colors.text,
                        borderColor: editFormData.category ? theme.colors.primary : theme.colors.border,
                        backgroundColor: theme.colors.surface,
                        paddingHorizontal: dynamicModerateScale(10),
                        paddingVertical: dynamicModerateScale(8),
                        fontSize: getFontSize(10),
                        borderRadius: dynamicModerateScale(10),
                      }
                    ]}
                    value={editFormData.category}
                    placeholder="Select your business category"
                    placeholderTextColor={theme.colors.textSecondary}
                    editable={false}
                    pointerEvents="none"
                  />
                </View>
                
                {/* Category Options */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.categoryScrollContent, {
                    paddingVertical: dynamicModerateScale(6),
                    gap: dynamicModerateScale(6),
                  }]}
                >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      { 
                        borderColor: theme.colors.border,
                        paddingVertical: dynamicModerateScale(8),
                        paddingHorizontal: dynamicModerateScale(10),
                        borderRadius: dynamicModerateScale(8),
                        marginRight: dynamicModerateScale(4),
                      },
                      editFormData.category === category && [
                        styles.categoryOptionSelected, 
                        { 
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                          shadowColor: theme.colors.primary,
                          shadowOffset: { width: 0, height: moderateScale(1) },
                          shadowOpacity: 0.25,
                          shadowRadius: moderateScale(3),
                          elevation: moderateScale(3),
                        }
                      ]
                    ]}
                    onPress={() => setEditFormData({...editFormData, category})}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      { 
                        color: theme.colors.text,
                        fontSize: getFontSize(9),
                      },
                      editFormData.category === category && [
                        styles.categoryOptionTextSelected, 
                        { color: '#ffffff' }
                      ]
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
                </ScrollView>
              </View>
              )}

              {/* Phone Number */}
              <View style={[styles.inputGroup, {
                marginBottom: dynamicModerateScale(12),
              }]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(9),
                  marginBottom: dynamicModerateScale(3),
                }]}>Phone Number *</Text>
                <TextInput
                  ref={registerEditInputRef('editPhone')}
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: phoneValidationError ? '#ff4444' : theme.colors.border,
                    color: theme.colors.text,
                    paddingHorizontal: dynamicModerateScale(10),
                    paddingVertical: dynamicModerateScale(7),
                    fontSize: getFontSize(10),
                    borderRadius: dynamicModerateScale(10),
                  }]}
                  value={editFormData.phone}
                  onChangeText={(text) => {
                    // Only allow digits
                    const digitsOnly = text.replace(/\D/g, '');
                    setEditFormData({...editFormData, phone: digitsOnly});
                    
                    // Validate as user types
                    const error = validatePhone(digitsOnly);
                    setPhoneValidationError(error);
                  }}
                  placeholder="Enter 10 digit phone number"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={handleEditSubmitEditing('editAlternatePhone')}
                />
                {phoneValidationError ? (
                  <Text style={[styles.validationError, { 
                    color: '#ff4444',
                    fontSize: getFontSize(8),
                    marginTop: dynamicModerateScale(2),
                    marginLeft: dynamicModerateScale(2),
                  }]}>
                    {phoneValidationError}
                  </Text>
                ) : null}
                {!phoneValidationError && editFormData.phone.trim() && editFormData.phone.replace(/\D/g, '').length === 10 ? (
                  <Text style={[styles.validationSuccess, { 
                    color: '#4CAF50',
                    fontSize: getFontSize(8),
                    marginTop: dynamicModerateScale(2),
                    marginLeft: dynamicModerateScale(2),
                  }]}>
                    ✓ Valid phone number
                  </Text>
                ) : null}
              </View>

              {/* Alternate Phone */}
              <View style={[styles.inputGroup, {
                marginBottom: dynamicModerateScale(12),
              }]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(9),
                  marginBottom: dynamicModerateScale(3),
                }]}>Alternate Phone</Text>
                <TextInput
                  ref={registerEditInputRef('editAlternatePhone')}
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: alternatePhoneValidationError ? '#ff4444' : theme.colors.border,
                    color: theme.colors.text,
                    paddingHorizontal: dynamicModerateScale(10),
                    paddingVertical: dynamicModerateScale(7),
                    fontSize: getFontSize(10),
                    borderRadius: dynamicModerateScale(10),
                  }]}
                  value={editFormData.alternatePhone}
                  onChangeText={(text) => {
                    // Only allow digits
                    const digitsOnly = text.replace(/\D/g, '');
                    setEditFormData({...editFormData, alternatePhone: digitsOnly});
                    
                    // Validate as user types (optional field)
                    if (digitsOnly.trim()) {
                      const error = validatePhone(digitsOnly);
                      setAlternatePhoneValidationError(error);
                    } else {
                      setAlternatePhoneValidationError(''); // Clear error if empty
                    }
                  }}
                  placeholder="Enter 10 digit alternate phone (optional)"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={handleEditSubmitEditing('editEmail')}
                />
                {alternatePhoneValidationError ? (
                  <Text style={[styles.validationError, { 
                    color: '#ff4444',
                    fontSize: getFontSize(8),
                    marginTop: dynamicModerateScale(2),
                    marginLeft: dynamicModerateScale(2),
                  }]}>
                    {alternatePhoneValidationError}
                  </Text>
                ) : null}
                {!alternatePhoneValidationError && editFormData.alternatePhone.trim() && editFormData.alternatePhone.replace(/\D/g, '').length === 10 ? (
                  <Text style={[styles.validationSuccess, { 
                    color: '#4CAF50',
                    fontSize: getFontSize(8),
                    marginTop: dynamicModerateScale(2),
                    marginLeft: dynamicModerateScale(2),
                  }]}>
                    ✓ Valid phone number
                  </Text>
                ) : null}
              </View>

              {/* Email */}
              <View style={[styles.inputGroup, {
                marginBottom: dynamicModerateScale(12),
              }]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(9),
                  marginBottom: dynamicModerateScale(3),
                }]}>Email *</Text>
                <TextInput
                ref={registerEditInputRef('editEmail')}
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    paddingHorizontal: dynamicModerateScale(10),
                    paddingVertical: dynamicModerateScale(7),
                    fontSize: getFontSize(10),
                    borderRadius: dynamicModerateScale(10),
                  }]}
                  value={editFormData.email}
                  onChangeText={(text) => setEditFormData({...editFormData, email: text})}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={handleEditSubmitEditing('editWebsite')}
                />
              </View>

              {/* Website */}
              <View style={[styles.inputGroup, {
                marginBottom: dynamicModerateScale(12),
              }]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(9),
                  marginBottom: dynamicModerateScale(3),
                }]}>Website</Text>
                <TextInput
                ref={registerEditInputRef('editWebsite')}
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    paddingHorizontal: dynamicModerateScale(10),
                    paddingVertical: dynamicModerateScale(7),
                    fontSize: getFontSize(10),
                    borderRadius: dynamicModerateScale(10),
                  }]}
                  value={editFormData.website}
                  onChangeText={(text) => setEditFormData({...editFormData, website: text})}
                  placeholder="Enter your website URL"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={handleEditSubmitEditing('editAddress')}
                />
              </View>

              {/* Address */}
              <View style={[styles.inputGroup, {
                marginBottom: dynamicModerateScale(12),
              }]}>
                <Text style={[styles.inputLabel, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(9),
                  marginBottom: dynamicModerateScale(3),
                }]}>Address</Text>
                <TextInput
                ref={registerEditInputRef('editAddress')}
                  style={[styles.textArea, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    paddingHorizontal: dynamicModerateScale(10),
                    paddingVertical: dynamicModerateScale(7),
                    fontSize: getFontSize(10),
                    borderRadius: dynamicModerateScale(10),
                    minHeight: dynamicModerateScale(55),
                  }]}
                  value={editFormData.address}
                  onChangeText={(text) => setEditFormData({...editFormData, address: text})}
                  placeholder="Enter your business address"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={handleEditSubmitEditing()}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, {
              paddingHorizontal: dynamicModerateScale(12),
              paddingVertical: dynamicModerateScale(12),
              borderTopWidth: 0.5,
              gap: dynamicModerateScale(8),
            }]}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton, { 
                  borderColor: theme.colors.border,
                  paddingVertical: dynamicModerateScale(10),
                  borderRadius: dynamicModerateScale(10),
                }]}
                onPress={handleCancelEdit}
                disabled={isUpdating}
              >
                <Text style={[styles.modalButtonText, { 
                  color: theme.colors.textSecondary,
                  fontSize: getFontSize(10),
                }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveModalButton, { 
                  backgroundColor: theme.colors.primary,
                  paddingVertical: dynamicModerateScale(10),
                  borderRadius: dynamicModerateScale(10),
                }]}
                onPress={handleSaveProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Text style={[styles.modalButtonText, {
                    fontSize: getFontSize(10),
                  }]}>Updating...</Text>
                ) : (
                  <Text style={[styles.modalButtonText, { 
                    color: '#ffffff',
                    fontSize: getFontSize(10),
                  }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuccessModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when tapping inside modal
          >
            <View style={[styles.successModalContainer, { 
              backgroundColor: theme.colors.surface,
              borderRadius: dynamicModerateScale(16),
              padding: dynamicModerateScale(16),
            }]}>
              <View style={[styles.successModalHeader, {
                marginBottom: dynamicModerateScale(10),
              }]}>
                <View style={[styles.successIconContainer, { 
                  backgroundColor: `${theme.colors.primary}20`,
                  width: dynamicModerateScale(42),
                  height: dynamicModerateScale(42),
                  borderRadius: dynamicModerateScale(21),
                  marginBottom: dynamicModerateScale(6),
                }]}>
                  <Icon name="check-circle" size={getIconSize(22)} color={theme.colors.primary} />
                </View>
                <Text 
                  style={[styles.successModalTitle, { 
                    color: theme.colors.text,
                    fontSize: getFontSize(14),
                  }]}
                >
                  Success
                </Text>
                <TouchableOpacity 
                  style={[styles.closeModalButton, { 
                    backgroundColor: theme.colors.inputBackground,
                    width: dynamicModerateScale(24),
                    height: dynamicModerateScale(24),
                    borderRadius: dynamicModerateScale(12),
                    top: dynamicModerateScale(-5),
                    right: dynamicModerateScale(-5),
                  }]}
                  onPress={() => setShowSuccessModal(false)}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={getIconSize(16)} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.successModalContent, {
                marginBottom: dynamicModerateScale(12),
              }]}>
                <Text style={[styles.successModalMessage, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(10),
                  lineHeight: dynamicModerateScale(16),
                }]}>
                  {successMessage}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.successModalButton, { 
                  backgroundColor: theme.colors.primary,
                  paddingVertical: dynamicModerateScale(9),
                  borderRadius: dynamicModerateScale(10),
                }]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={[styles.successModalButtonText, {
                  fontSize: getFontSize(10),
                }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={showSignOutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSignOutModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when tapping inside modal
          >
            <View style={[styles.signOutModalContainer, { 
              backgroundColor: theme.colors.surface,
              borderRadius: dynamicModerateScale(16),
              padding: dynamicModerateScale(16),
            }]}>
              <View style={[styles.signOutModalHeader, {
                marginBottom: dynamicModerateScale(10),
              }]}>
                <View style={[styles.signOutIconContainer, { 
                  backgroundColor: '#ff444420',
                  width: dynamicModerateScale(42),
                  height: dynamicModerateScale(42),
                  borderRadius: dynamicModerateScale(21),
                  marginBottom: dynamicModerateScale(6),
                }]}>
                  <Icon name="logout" size={getIconSize(22)} color="#ff4444" />
                </View>
                <Text 
                  style={[styles.signOutModalTitle, { 
                    color: theme.colors.text,
                    fontSize: getFontSize(14),
                  }]}
                >
                  Sign Out
                </Text>
                <TouchableOpacity 
                  style={[styles.closeModalButton, { 
                    backgroundColor: theme.colors.inputBackground,
                    width: dynamicModerateScale(24),
                    height: dynamicModerateScale(24),
                    borderRadius: dynamicModerateScale(12),
                    top: dynamicModerateScale(-5),
                    right: dynamicModerateScale(-5),
                  }]}
                  onPress={() => setShowSignOutModal(false)}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={getIconSize(16)} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.signOutModalContent, {
                marginBottom: dynamicModerateScale(12),
              }]}>
                <Text style={[styles.signOutModalMessage, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(10),
                  lineHeight: dynamicModerateScale(16),
                }]}>
                  Are you sure you want to sign out? This will clear all your local data.
                </Text>
              </View>
              
              <View style={[styles.signOutModalButtons, {
                gap: dynamicModerateScale(8),
              }]}>
                <TouchableOpacity 
                  style={[styles.signOutCancelButton, { 
                    backgroundColor: theme.colors.inputBackground,
                    paddingVertical: dynamicModerateScale(9),
                    borderRadius: dynamicModerateScale(10),
                  }]}
                  onPress={() => setShowSignOutModal(false)}
                >
                  <Text style={[styles.signOutCancelButtonText, { 
                    color: theme.colors.text,
                    fontSize: getFontSize(10),
                  }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.signOutConfirmButton, { 
                    backgroundColor: '#ff4444',
                    paddingVertical: dynamicModerateScale(9),
                    borderRadius: dynamicModerateScale(10),
                  }]}
                  onPress={confirmSignOut}
                >
                  <Text style={[styles.signOutConfirmButtonText, {
                    fontSize: getFontSize(10),
                  }]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowErrorModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when tapping inside modal
          >
            <View style={[styles.errorModalContainer, { 
              backgroundColor: theme.colors.surface,
              borderRadius: dynamicModerateScale(16),
              padding: dynamicModerateScale(16),
            }]}>
              <View style={[styles.errorModalHeader, {
                marginBottom: dynamicModerateScale(10),
              }]}>
                <View style={[styles.errorIconContainer, { 
                  backgroundColor: '#ff444420',
                  width: dynamicModerateScale(42),
                  height: dynamicModerateScale(42),
                  borderRadius: dynamicModerateScale(21),
                  marginBottom: dynamicModerateScale(6),
                }]}>
                  <Icon name="error-outline" size={getIconSize(22)} color="#ff4444" />
                </View>
                <Text 
                  style={[styles.errorModalTitle, { 
                    color: theme.colors.text,
                    fontSize: getFontSize(14),
                  }]}
                >
                  Error
                </Text>
                <TouchableOpacity 
                  style={[styles.closeModalButton, { 
                    backgroundColor: theme.colors.inputBackground,
                    width: dynamicModerateScale(24),
                    height: dynamicModerateScale(24),
                    borderRadius: dynamicModerateScale(12),
                    top: dynamicModerateScale(-5),
                    right: dynamicModerateScale(-5),
                  }]}
                  onPress={() => setShowErrorModal(false)}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={getIconSize(16)} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.errorModalContent, {
                marginBottom: dynamicModerateScale(12),
              }]}>
                <Text style={[styles.errorModalMessage, { 
                  color: theme.colors.text,
                  fontSize: getFontSize(10),
                  lineHeight: dynamicModerateScale(16),
                }]}>
                  {errorModalMessage}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.errorModalButton, { 
                  backgroundColor: '#ff4444',
                  paddingVertical: dynamicModerateScale(9),
                  borderRadius: dynamicModerateScale(10),
                }]}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={[styles.errorModalButtonText, {
                  fontSize: getFontSize(10),
                }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Coming Soon Modal */}
      <ComingSoonModal
        visible={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
        title={comingSoonTitle}
        subtitle={comingSoonSubtitle}
      />

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImagePickerModal}
        onClose={handleCloseImagePicker}
        onImageSelected={handleImageSelected}
      />
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
    paddingTop: 0,
    paddingHorizontal: moderateScale(4),
    paddingBottom: moderateScale(3),
  },
  headerTitle: {
    fontSize: moderateScale(12),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  profileCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(2),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(6),
    elevation: moderateScale(4),
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImageContainer: {
    overflow: 'hidden',
    borderColor: '#ffffff',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#ffffff', // Keep white for gradient avatar background
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#ffffff',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontWeight: 'bold',
  },
  userEmail: {
  },
  userBio: {
    textAlign: 'center',
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
  },
  statLabel: {
  },
  statDivider: {
  },
  section: {
  },
  sectionTitle: {
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontWeight: '500',
  },
  menuItemSubtext: {
  },
     toggle: {
      justifyContent: 'flex-start',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 2,
    },
    toggleThumb: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  signOutIcon: {
  },
  signOutText: {
    fontWeight: '600',
  },
  subscriptionCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subscriptionIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontWeight: '600',
  },
  subscriptionSubtitle: {
  },
  // Transaction History Section Styles
  transactionHistoryCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  transactionHistoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionHistoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionHistoryIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionHistoryInfo: {
    flex: 1,
  },
  transactionHistoryTitle: {
    fontWeight: '600',
  },
  transactionHistorySubtitle: {
  },
  // My Posters Section Styles
  myPostersCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  myPostersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myPostersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  myPostersIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  myPostersInfo: {
    flex: 1,
  },
  myPostersTitle: {
    fontWeight: '600',
  },
  myPostersSubtitle: {
  },
  // Share App Section Styles
  shareAppCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  shareAppContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareAppLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shareAppIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareAppInfo: {
    flex: 1,
  },
  shareAppTitle: {
    fontWeight: '600',
  },
  shareAppSubtitle: {
  },
  versionText: {
    textAlign: 'center',
  },
  // Edit Profile Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth * 0.92,
    maxHeight: screenHeight * 0.8,
    borderRadius: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(6),
    },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(12),
    elevation: moderateScale(12),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  modalTitle: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: moderateScale(3),
  },
  modalBody: {
    maxHeight: screenHeight * 0.5,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
  },
  inputGroup: {
    marginBottom: moderateScale(12),
  },
  inputLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    marginBottom: moderateScale(4),
  },
  textInput: {
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    fontSize: moderateScale(11),
  },
  validationError: {
    fontSize: moderateScale(9),
    marginTop: moderateScale(3),
    marginLeft: moderateScale(3),
    fontWeight: '500',
  },
  validationSuccess: {
    fontSize: moderateScale(9),
    marginTop: moderateScale(3),
    marginLeft: moderateScale(3),
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    fontSize: moderateScale(11),
    minHeight: moderateScale(60),
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: moderateScale(8),
  },
  modalButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  saveModalButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  modalButtonText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  // Category Picker Styles
  categoryPicker: {
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPickerText: {
    fontSize: moderateScale(11),
    flex: 1,
  },
  categoryOptions: {
    marginTop: moderateScale(6),
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  // Horizontal category selection styles
  selectedCategoryContainer: {
    marginBottom: moderateScale(10),
  },
  selectedCategoryInput: {
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    fontSize: moderateScale(11),
  },
  categoryScrollContent: {
    paddingVertical: moderateScale(6),
    gap: moderateScale(6),
  },
  categoryOption: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    marginRight: moderateScale(4),
  },
  categoryOptionSelected: {
    // Selected state styling handled inline
  },
  categoryOptionText: {
    fontSize: moderateScale(10),
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    fontWeight: '600',
  },
  // Success Modal Styles
  successModalContainer: {
    width: screenWidth * 0.88,
    maxWidth: 380,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(3),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(6),
    elevation: moderateScale(6),
  },
  successModalHeader: {
    alignItems: 'center',
    marginBottom: moderateScale(12),
    position: 'relative',
  },
  successIconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  successModalTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    textAlign: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: moderateScale(-6),
    right: moderateScale(-6),
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    marginBottom: moderateScale(14),
  },
  successModalMessage: {
    fontSize: moderateScale(12),
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  successModalButton: {
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  successModalButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  
  // Sign Out Modal Styles
  signOutModalContainer: {
    width: screenWidth * 0.88,
    maxWidth: 380,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(3),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(6),
    elevation: moderateScale(6),
  },
  signOutModalHeader: {
    alignItems: 'center',
    marginBottom: moderateScale(12),
    position: 'relative',
  },
  signOutIconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  signOutModalTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    textAlign: 'center',
  },
  signOutModalContent: {
    marginBottom: moderateScale(14),
  },
  signOutModalMessage: {
    fontSize: moderateScale(12),
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  signOutModalButtons: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  signOutCancelButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  signOutCancelButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  signOutConfirmButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  signOutConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  // Error Modal Styles
  errorModalContainer: {
    width: screenWidth * 0.88,
    maxWidth: 380,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(3),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(6),
    elevation: moderateScale(6),
  },
  errorModalHeader: {
    alignItems: 'center',
    marginBottom: moderateScale(12),
    position: 'relative',
  },
  errorIconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  errorModalTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    textAlign: 'center',
  },
  errorModalContent: {
    marginBottom: moderateScale(14),
  },
  errorModalMessage: {
    fontSize: moderateScale(12),
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  errorModalButton: {
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  errorModalButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
});

export default ProfileScreen; 