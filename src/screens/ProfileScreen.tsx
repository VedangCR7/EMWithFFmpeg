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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import authService from '../services/auth';
import authApi from '../services/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userBusinessProfilesService from '../services/userBusinessProfiles';
import userLikesService from '../services/userLikes';
import userPreferencesService from '../services/userPreferences';
import userProfileService from '../services/userProfile';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import downloadedPostersService from '../services/downloadedPosters';
import ImagePickerModal from '../components/ImagePickerModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

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
  
  // Debug: Log current user data to see what fields are available
  console.log('🔍 ProfileScreen - Current User Data:', JSON.stringify(currentUser, null, 2));
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: currentUser?.displayName || currentUser?.companyName || currentUser?.name || currentUser?.businessName || currentUser?.businessProfiles?.[0]?.businessName || '',
    description: currentUser?.description || currentUser?.bio || currentUser?.businessDescription || currentUser?.businessProfiles?.[0]?.description || '',
    category: currentUser?.category || currentUser?.businessCategory || currentUser?.businessProfiles?.[0]?.category || '',
    address: currentUser?.address || currentUser?.businessAddress || currentUser?.businessProfiles?.[0]?.address || '',
    phone: currentUser?.phoneNumber || currentUser?.phone || currentUser?.businessPhone || currentUser?.businessProfiles?.[0]?.phone || '',
    alternatePhone: currentUser?.alternatePhone || currentUser?.alternateBusinessPhone || '',
    email: currentUser?.email || currentUser?.businessEmail || currentUser?.businessProfiles?.[0]?.email || '',
    website: currentUser?.website || currentUser?.businessWebsite || currentUser?.businessProfiles?.[0]?.website || '',
    companyLogo: currentUser?.companyLogo || currentUser?.businessLogo || currentUser?.logo || currentUser?.businessProfiles?.[0]?.logo || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [posterStats, setPosterStats] = useState({ total: 0, recentCount: 0 });
  const [businessProfileStats, setBusinessProfileStats] = useState({ total: 0, recentCount: 0 });
  const [likeStats, setLikeStats] = useState({ total: 0, recentCount: 0, byType: { template: 0, video: 0, poster: 0, businessProfile: 0 } });
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(
    currentUser?.companyLogo || currentUser?.businessLogo || currentUser?.logo || null
  );
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const { isDarkMode, toggleDarkMode, theme } = useTheme();
  const { isSubscribed, transactionStats } = useSubscription();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

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

  // Load user profile data and stats when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadUserProfileData = async () => {
        try {
          // Get current user ID for user-specific data
          const currentUser = authService.getCurrentUser();
          const userId = currentUser?.id;
          
          if (!userId) {
            console.log('⚠️ No user ID available for loading profile data');
            return;
          }

          console.log('🔍 Loading complete user profile data for user:', userId);

          // Load complete user profile from backend
          try {
            const profileResponse = await authApi.getProfile(currentUser?.deviceId, userId);
            const completeUserData = profileResponse.data;
            
            console.log('🔍 Complete Profile Data from API:', JSON.stringify(completeUserData, null, 2));
            
            // Update current user with complete profile data
            const updatedUserData = {
              ...currentUser,
              ...completeUserData,
            };
            
            // Update auth service with complete data
            authService.setCurrentUser(updatedUserData);
            
            // Update profile image from companyLogo
            if (completeUserData?.companyLogo || completeUserData?.logo) {
              setProfileImageUri(completeUserData?.companyLogo || completeUserData?.logo);
            }
            
            console.log('✅ User profile data loaded and updated');
          } catch (error) {
            console.log('⚠️ Failed to load profile data from API:', error);
            // Continue with existing user data
          }
          
          // Load poster stats
          const posterStats = await downloadedPostersService.getPosterStats(userId);
          setPosterStats({
            total: posterStats.total,
            recentCount: posterStats.recentCount,
          });
          
          // Load business profile stats from backend
          const businessStats = await userProfileService.getBusinessProfileStats(userId);
          setBusinessProfileStats({
            total: businessStats.total,
            recentCount: businessStats.recentCount,
          });
          
          // Load like stats from backend
          const likeStats = await userProfileService.getLikeStats(userId);
          setLikeStats({
            total: likeStats.total,
            recentCount: likeStats.recentCount,
            byType: likeStats.byType,
          });
          
          // Load user preferences from backend
          const preferences = await userProfileService.getUserPreferences(userId);
          setUserPreferences(preferences);
          
          // Set preferences state
          if (preferences) {
            setNotificationsEnabled(preferences.notificationsEnabled);
          }
          
          console.log('📊 Loaded stats for user:', userId, 'Posters:', posterStats.total, 'Business Profiles:', businessStats.total, 'Likes:', likeStats.total, 'Preferences:', preferences?.notificationsEnabled);
        } catch (error) {
          console.error('Error loading user profile data:', error);
        }
      };

      loadUserProfileData();
    }, [])
  );

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? This will clear all your local data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('ProfileScreen: Starting sign out process...');
              
              // Show loading state or disable UI during signout
              // You could add a loading spinner here if needed
              
              await authService.signOut();
              
              console.log('ProfileScreen: Sign out completed successfully');
              
              // Navigate to login screen or show success message
              // The navigation will be handled by the auth state change listener
              
            } catch (error) {
              console.error('ProfileScreen: Sign out error:', error);
              Alert.alert(
                'Sign Out Error', 
                'There was an issue signing out. Your local data has been cleared, but you may need to sign in again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
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

  const handleDarkModeToggle = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      const newValue = !isDarkMode;
      toggleDarkMode();
      
      // Save to user preferences via backend
      if (userId) {
        await userProfileService.updatePreference(userId, 'darkModeEnabled', newValue);
        console.log('✅ Dark mode preference updated for user:', userId, 'Value:', newValue);
      }
      
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

  const handleLikedItems = () => {
    navigation.navigate('LikedItems' as never);
  };

  const handleBackendTest = () => {
    navigation.navigate('ApiTest' as never);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out EventMarketers - Create amazing event posters and marketing materials! Download now and start creating professional posters for your events.',
        title: 'EventMarketers - Event Poster Creator',
        url: 'https://eventmarketers.app', // Replace with actual app store URL
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
      
      // Check if we already have complete user data from registration
      if (currentUser && currentUser.email && currentUser.phone && currentUser.name) {
        console.log('✅ User data already complete from registration, skipping API call');
        
        // Update edit form with existing data
        setEditFormData({
          name: currentUser?.displayName || currentUser?.companyName || currentUser?.name || currentUser?.businessName || currentUser?.businessProfiles?.[0]?.businessName || '',
          description: currentUser?.description || currentUser?.bio || currentUser?.businessDescription || currentUser?.businessProfiles?.[0]?.description || '',
          category: currentUser?.category || currentUser?.businessCategory || currentUser?.businessProfiles?.[0]?.category || '',
          address: currentUser?.address || currentUser?.businessAddress || currentUser?.businessProfiles?.[0]?.address || '',
          phone: currentUser?.phoneNumber || currentUser?.businessPhone || currentUser?.phone || currentUser?.businessProfiles?.[0]?.phone || '',
          alternatePhone: currentUser?.alternateBusinessPhone || currentUser?.alternatePhone || '',
          email: currentUser?.email || currentUser?.businessEmail || currentUser?.businessProfiles?.[0]?.email || '',
          website: currentUser?.website || currentUser?.businessWebsite || currentUser?.businessProfiles?.[0]?.website || '',
          companyLogo: currentUser?.companyLogo || currentUser?.businessLogo || currentUser?.logo || currentUser?.businessProfiles?.[0]?.logo || '',
        });
        
        // Update profile image if available
        if (currentUser?.companyLogo || currentUser?.businessLogo || currentUser?.logo) {
          setProfileImageUri(currentUser?.companyLogo || currentUser?.businessLogo || currentUser?.logo);
        }
        
        setShowEditProfileModal(true);
        return;
      }
      
      // Only fetch from API if we don't have complete data
      console.log('🔍 Fetching complete profile data from API...');
      
      const deviceId = currentUser?.deviceId;
      const userId = currentUser?.id;
      
      if (!deviceId && !userId) {
        throw new Error('No user identifiers available');
      }
      
      console.log('🔍 Fetching profile using deviceId:', deviceId, 'userId:', userId);
      
      const profileResponse = await authApi.getProfile(deviceId, userId);
      const completeUserData = profileResponse.data;
      
      console.log('🔍 Complete Profile Data from API:', JSON.stringify(completeUserData, null, 2));
      
      // Update current user with complete profile data
      const updatedUserData = {
        ...currentUser,
        ...completeUserData,
      };
      
      // Update auth service with complete data
      authService.setCurrentUser(updatedUserData);
      
      setEditFormData({
        name: completeUserData?.displayName || completeUserData?.companyName || completeUserData?.name || completeUserData?.businessName || completeUserData?.businessProfiles?.[0]?.businessName || '',
        description: completeUserData?.description || completeUserData?.bio || completeUserData?.businessDescription || completeUserData?.businessProfiles?.[0]?.description || '',
        category: completeUserData?.category || completeUserData?.businessCategory || completeUserData?.businessProfiles?.[0]?.category || '',
        address: completeUserData?.address || completeUserData?.businessAddress || completeUserData?.businessProfiles?.[0]?.address || '',
        phone: completeUserData?.phoneNumber || completeUserData?.phone || completeUserData?.businessPhone || completeUserData?.businessProfiles?.[0]?.phone || '',
        alternatePhone: completeUserData?.alternatePhone || completeUserData?.alternateBusinessPhone || '',
        email: completeUserData?.email || completeUserData?.businessEmail || completeUserData?.businessProfiles?.[0]?.email || '',
        website: completeUserData?.website || completeUserData?.businessWebsite || completeUserData?.businessProfiles?.[0]?.website || '',
        companyLogo: completeUserData?.companyLogo || completeUserData?.businessLogo || completeUserData?.logo || completeUserData?.businessProfiles?.[0]?.logo || '',
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

      // Update profile via backend API
      const updateData = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        description: editFormData.description.trim(),
        category: editFormData.category.trim(),
        address: editFormData.address.trim(),
        alternatePhone: editFormData.alternatePhone.trim(),
        website: editFormData.website.trim(),
        companyLogo: editFormData.companyLogo.trim()
      };

      const response = await authApi.updateProfile(updateData, userId);
      
      if (response.success) {
        // Update the current user object with the response
        const updatedUser = {
          ...currentUser,
          ...response.data,
          displayName: response.data.name,
          companyName: response.data.name,
          phoneNumber: response.data.phone,
          bio: response.data.description,
          businessName: response.data.name,
          businessEmail: response.data.email,
          businessPhone: response.data.phone,
          businessDescription: response.data.description,
          businessCategory: response.data.category,
          businessAddress: response.data.address,
          alternateBusinessPhone: response.data.alternatePhone,
          businessWebsite: response.data.website,
          businessLogo: response.data.companyLogo,
        };
        
        authService.setCurrentUser(updatedUser);
        
        setShowEditProfileModal(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    const user = authService.getCurrentUser();
    setShowEditProfileModal(false);
    setEditFormData({
      name: user?.displayName || user?.companyName || user?.name || user?.businessName || user?.businessProfiles?.[0]?.businessName || '',
      description: user?.description || user?.bio || user?.businessDescription || user?.businessProfiles?.[0]?.description || '',
      category: user?.category || user?.businessCategory || user?.businessProfiles?.[0]?.category || '',
      address: user?.address || user?.businessAddress || user?.businessProfiles?.[0]?.address || '',
      phone: user?.phoneNumber || user?.phone || user?.businessPhone || user?.businessProfiles?.[0]?.phone || '',
      alternatePhone: user?.alternatePhone || user?.alternateBusinessPhone || '',
      email: user?.email || user?.businessEmail || user?.businessProfiles?.[0]?.email || '',
      website: user?.website || user?.businessWebsite || user?.businessProfiles?.[0]?.website || '',
      companyLogo: user?.companyLogo || user?.businessLogo || user?.logo || user?.businessProfiles?.[0]?.logo || '',
    });
  };

  const handleImagePickerPress = () => {
    setShowImagePickerModal(true);
  };

  const handleImageSelected = (imageUri: string) => {
    setProfileImageUri(imageUri);
    // Update the current user's profile picture and company logo
    if (currentUser) {
      currentUser.photoURL = imageUri;
      currentUser.profileImage = imageUri;
      currentUser.companyLogo = imageUri; // Also update companyLogo field
    }
    Alert.alert('Success', 'Profile picture updated successfully!');
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
      style={[styles.menuItem, { backgroundColor: theme.colors.cardBackground }]} 
      onPress={onPress} 
      disabled={showToggle}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuItemIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
          <Icon name={icon} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.menuItemSubtext, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
             {showToggle ? (
          <TouchableOpacity
            style={[
              styles.toggle, 
              { 
                backgroundColor: toggleValue ? theme.colors.primary : theme.colors.border,
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
                  transform: [{
                    translateX: animationValue ? animationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, screenWidth * 0.06] // Move from left to right
                    }) : 0
                  }]
                }
              ]} 
            />
          </TouchableOpacity>
        ) : (
          <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
        )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle="light-content"
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
        <View style={[styles.header, { paddingTop: insets.top + responsiveSpacing.sm }]}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 + insets.bottom }]}
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {profileImageUri || currentUser?.companyLogo || currentUser?.businessLogo || currentUser?.logo || currentUser?.photoURL || currentUser?.profileImage ? (
                  <View style={styles.avatarImageContainer}>
                    <Image
                      source={{ uri: profileImageUri || currentUser?.companyLogo || currentUser?.businessLogo || currentUser?.logo || currentUser?.photoURL || currentUser?.profileImage }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarText}>
                      {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                    </Text>
                  </LinearGradient>
                )}
                <TouchableOpacity 
                  style={[styles.editAvatarButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleImagePickerPress}
                >
                  <Icon name="camera-alt" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {currentUser?.displayName || currentUser?.companyName || currentUser?.name || 'MarketBrand'}
                </Text>
                <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                  {currentUser?.email || 'eventmarketer@example.com'}
                </Text>
                {currentUser?.bio && (
                  <Text style={[styles.userBio, { color: theme.colors.textSecondary }]}>
                    {currentUser.bio}
                  </Text>
                )}
                <View style={styles.profileStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.colors.primary }]}>24</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Templates</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{posterStats.total}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Downloads</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{businessProfileStats.total}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Business</Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.editProfileButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleEditProfile}
            >
              <Icon name="edit" size={16} color="#ffffff" />
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Account Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            {renderMenuItem('business', 'Business Profiles', `${businessProfileStats.total} profiles • ${businessProfileStats.recentCount} recent`, handleBusinessProfiles)}
            {renderMenuItem('notifications', 'Notifications', 'Manage notification preferences', undefined, true, notificationsEnabled, handleNotificationToggle, notificationsAnimation)}
          </View>

          {/* My Posters Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Posters</Text>
            <TouchableOpacity 
              style={[styles.myPostersCard, { backgroundColor: theme.colors.cardBackground }]}
              onPress={handleMyPosters}
            >
              <View style={styles.myPostersContent}>
                <View style={styles.myPostersLeft}>
                  <View style={[styles.myPostersIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                    <Icon name="image" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.myPostersInfo}>
                    <Text style={[styles.myPostersTitle, { color: theme.colors.text }]}>
                      Downloaded Posters
                    </Text>
                    <Text style={[styles.myPostersSubtitle, { color: theme.colors.textSecondary }]}>
                      {posterStats.total} posters • {posterStats.recentCount} recent
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Liked Items Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liked Items</Text>
            <TouchableOpacity 
              style={[styles.likedItemsCard, { backgroundColor: theme.colors.cardBackground }]}
              onPress={handleLikedItems}
            >
              <View style={styles.likedItemsContent}>
                <View style={styles.likedItemsLeft}>
                  <View style={[styles.likedItemsIcon, { backgroundColor: '#E74C3C20' }]}>
                    <Icon name="favorite" size={24} color="#E74C3C" />
                  </View>
                  <View style={styles.likedItemsInfo}>
                    <Text style={[styles.likedItemsTitle, { color: theme.colors.text }]}>
                      Liked Content
                    </Text>
                    <Text style={[styles.likedItemsSubtitle, { color: theme.colors.textSecondary }]}>
                      {likeStats.total} liked items • {likeStats.recentCount} recent
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Backend Test Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Backend Integration</Text>
            <TouchableOpacity 
              style={[styles.backendTestCard, { backgroundColor: theme.colors.cardBackground }]}
              onPress={handleBackendTest}
            >
              <View style={styles.backendTestContent}>
                <View style={styles.backendTestLeft}>
                  <View style={[styles.backendTestIcon, { backgroundColor: '#2196F320' }]}>
                    <Icon name="api" size={24} color="#2196F3" />
                  </View>
                  <View style={styles.backendTestInfo}>
                    <Text style={[styles.backendTestTitle, { color: theme.colors.text }]}>
                      Backend API Test
                    </Text>
                    <Text style={[styles.backendTestSubtitle, { color: theme.colors.textSecondary }]}>
                      Test all backend endpoints and integration
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Subscription Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <TouchableOpacity 
              style={[styles.subscriptionCard, { backgroundColor: theme.colors.cardBackground }]}
              onPress={handleSubscription}
            >
              <View style={styles.subscriptionContent}>
                <View style={styles.subscriptionLeft}>
                  <View style={[styles.subscriptionIcon, { backgroundColor: isSubscribed ? '#28a745' : '#667eea' }]}>
                    <Icon 
                      name={isSubscribed ? 'check-circle' : 'star'} 
                      size={24} 
                      color="#ffffff" 
                    />
                  </View>
                  <View style={styles.subscriptionInfo}>
                    <Text style={[styles.subscriptionTitle, { color: theme.colors.text }]}>
                      {isSubscribed ? 'Pro Subscription' : 'Upgrade to Pro'}
                    </Text>
                    <Text style={[styles.subscriptionSubtitle, { color: theme.colors.textSecondary }]}>
                      {isSubscribed ? 'Active • Unlimited features' : 'Unlock unlimited possibilities'}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
            
            {/* Transaction History Button */}
            <TouchableOpacity 
              style={[styles.transactionHistoryCard, { backgroundColor: theme.colors.cardBackground }]}
              onPress={handleTransactionHistory}
            >
              <View style={styles.transactionHistoryContent}>
                <View style={styles.transactionHistoryLeft}>
                  <View style={[styles.transactionHistoryIcon, { backgroundColor: '#667eea20' }]}>
                    <Icon name="receipt-long" size={24} color="#667eea" />
                  </View>
                  <View style={styles.transactionHistoryInfo}>
                    <Text style={[styles.transactionHistoryTitle, { color: theme.colors.text }]}>
                      Transaction History
                    </Text>
                    <Text style={[styles.transactionHistorySubtitle, { color: theme.colors.textSecondary }]}>
                      {transactionStats.total} transactions • View payment history
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

                     {/* App Settings */}
           <View style={styles.section}>
             <Text style={styles.sectionTitle}>App Settings</Text>
             {renderMenuItem('dark-mode', 'Dark Mode', 'Switch to dark theme', undefined, true, isDarkMode, handleDarkModeToggle, darkModeAnimation)}
           </View>

          {/* Support & Legal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support & Legal</Text>
            {renderMenuItem('help', 'Help & Support', 'Get help and contact support', () => Alert.alert('Help', 'Help center will be implemented soon.'))}
            {renderMenuItem('privacy-tip', 'Privacy Policy', 'Read our privacy policy', () => Alert.alert('Privacy Policy', 'Privacy policy will be implemented soon.'))}
            {renderMenuItem('info', 'About App', 'Version 1.0.0', () => Alert.alert('About', 'About app information will be implemented soon.'))}
          </View>

          {/* Share App Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Share & Support</Text>
            <TouchableOpacity 
              style={[styles.shareAppCard, { backgroundColor: theme.colors.cardBackground }]}
              onPress={handleShareApp}
            >
              <View style={styles.shareAppContent}>
                <View style={styles.shareAppLeft}>
                  <View style={[styles.shareAppIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                    <Icon name="share" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.shareAppInfo}>
                    <Text style={[styles.shareAppTitle, { color: theme.colors.text }]}>
                      Share EventMarketers
                    </Text>
                    <Text style={[styles.shareAppSubtitle, { color: theme.colors.textSecondary }]}>
                      Help others discover amazing event posters
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity 
            style={[styles.signOutButton, { 
              backgroundColor: '#ff4444',
              borderColor: '#ff4444'
            }]} 
            onPress={handleSignOut}
          >
            <Icon name="logout" size={20} color="#ffffff" style={styles.signOutIcon} />
            <Text style={[styles.signOutText, { color: '#ffffff' }]}>Sign Out</Text>
          </TouchableOpacity>

          {/* App Version */}
          <Text style={[styles.versionText, { color: 'rgba(255,255,255,0.6)' }]}>Version 1.0.0</Text>
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
          <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.modalCloseButton}>
                <Icon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Company Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Company Name *</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={editFormData.name}
                  onChangeText={(text) => setEditFormData({...editFormData, name: text})}
                  placeholder="Enter your company name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Description</Text>
                <TextInput
                  style={[styles.textArea, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={editFormData.description}
                  onChangeText={(text) => setEditFormData({...editFormData, description: text})}
                  placeholder="Describe your business..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Business Category */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Business Category *</Text>
                
                {/* Selected Category Display */}
                <View style={styles.selectedCategoryContainer}>
                  <TextInput
                    style={[
                      styles.selectedCategoryInput,
                      { 
                        color: theme.colors.text,
                        borderColor: editFormData.category ? theme.colors.primary : theme.colors.border,
                        backgroundColor: theme.colors.surface,
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
                  contentContainerStyle={styles.categoryScrollContent}
                >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      { borderColor: theme.colors.border },
                      editFormData.category === category && [
                        styles.categoryOptionSelected, 
                        { 
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                          shadowColor: theme.colors.primary,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 5,
                        }
                      ]
                    ]}
                    onPress={() => setEditFormData({...editFormData, category})}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      { color: theme.colors.text },
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

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Phone Number *</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={editFormData.phone}
                  onChangeText={(text) => setEditFormData({...editFormData, phone: text})}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Alternate Phone */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Alternate Phone</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={editFormData.alternatePhone}
                  onChangeText={(text) => setEditFormData({...editFormData, alternatePhone: text})}
                  placeholder="Enter alternate phone number"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email *</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={editFormData.email}
                  onChangeText={(text) => setEditFormData({...editFormData, email: text})}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Website */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Website</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={editFormData.website}
                  onChangeText={(text) => setEditFormData({...editFormData, website: text})}
                  placeholder="Enter your website URL"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Address</Text>
                <TextInput
                  style={[styles.textArea, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={editFormData.address}
                  onChangeText={(text) => setEditFormData({...editFormData, address: text})}
                  placeholder="Enter your business address"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton, { borderColor: theme.colors.border }]}
                onPress={handleCancelEdit}
                disabled={isUpdating}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveModalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Text style={styles.modalButtonText}>Updating...</Text>
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    paddingTop: screenHeight * 0.02,
    paddingHorizontal: screenWidth * 0.05,
    paddingBottom: screenHeight * 0.02,
  },
  headerTitle: {
    fontSize: Math.min(screenWidth * 0.06, 24),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Add padding to account for tab bar
  },
  profileCard: {
    marginHorizontal: screenWidth * 0.05,
    marginBottom: screenHeight * 0.03,
    borderRadius: 20,
    padding: screenWidth * 0.05,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: screenHeight * 0.02,
  },
  avatarGradient: {
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
    borderRadius: screenWidth * 0.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImageContainer: {
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
    borderRadius: screenWidth * 0.1,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: Math.min(screenWidth * 0.08, 32),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: screenWidth * 0.06,
    height: screenWidth * 0.06,
    borderRadius: screenWidth * 0.03,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: screenHeight * 0.012,
    paddingHorizontal: screenWidth * 0.04,
    borderRadius: 12,
    marginTop: screenHeight * 0.02,
    gap: 8,
  },
  editProfileButtonText: {
    color: '#ffffff',
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: '600',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: 'bold',
    marginBottom: screenHeight * 0.005,
  },
  userEmail: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    marginBottom: screenHeight * 0.01,
  },
  userBio: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    textAlign: 'center',
    marginBottom: screenHeight * 0.015,
    lineHeight: 16,
    paddingHorizontal: screenWidth * 0.05,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.03,
  },
  statNumber: {
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: Math.min(screenWidth * 0.025, 10),
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: screenHeight * 0.02,
    marginHorizontal: screenWidth * 0.02,
  },
  section: {
    marginBottom: screenHeight * 0.03,
  },
  sectionTitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: screenWidth * 0.05,
    marginBottom: screenHeight * 0.01,
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth * 0.04,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '500',
  },
  menuItemSubtext: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    marginTop: 2,
  },
     toggle: {
      width: screenWidth * 0.1,
      height: screenHeight * 0.025,
      borderRadius: screenHeight * 0.0125,
      justifyContent: 'flex-start',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 2,
    },
    toggleThumb: {
      width: screenHeight * 0.02,
      height: screenHeight * 0.02,
      borderRadius: screenHeight * 0.01,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: screenWidth * 0.05,
    marginTop: screenHeight * 0.02,
    paddingVertical: screenHeight * 0.015,
    borderRadius: 15,
    borderWidth: 1,
  },
  signOutIcon: {
    marginRight: screenWidth * 0.02,
  },
  signOutText: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
  },
  subscriptionCard: {
    marginHorizontal: screenWidth * 0.05,
    marginBottom: screenHeight * 0.01,
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
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
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth * 0.04,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
  },
  subscriptionSubtitle: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    marginTop: 2,
  },
  // Transaction History Section Styles
  transactionHistoryCard: {
    marginHorizontal: screenWidth * 0.05,
    marginBottom: screenHeight * 0.01,
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
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
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth * 0.04,
  },
  transactionHistoryInfo: {
    flex: 1,
  },
  transactionHistoryTitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
  },
  transactionHistorySubtitle: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    marginTop: 2,
  },
  // My Posters Section Styles
  myPostersCard: {
    marginHorizontal: screenWidth * 0.05,
    marginBottom: screenHeight * 0.01,
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
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
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth * 0.04,
  },
  myPostersInfo: {
    flex: 1,
  },
  myPostersTitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
  },
  myPostersSubtitle: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    marginTop: 2,
  },
  // Liked Items Section Styles
  likedItemsCard: {
    marginHorizontal: screenWidth * 0.05,
    marginBottom: screenHeight * 0.01,
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  likedItemsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likedItemsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  likedItemsIcon: {
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth * 0.04,
  },
  likedItemsInfo: {
    flex: 1,
  },
  likedItemsTitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
  },
  likedItemsSubtitle: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    marginTop: 2,
  },
  // Backend Test Section Styles
  backendTestCard: {
    marginHorizontal: screenWidth * 0.05,
    marginBottom: screenHeight * 0.01,
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backendTestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backendTestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backendTestIcon: {
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth * 0.04,
  },
  backendTestInfo: {
    flex: 1,
  },
  backendTestTitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
  },
  backendTestSubtitle: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    marginTop: 2,
  },
  // Share App Section Styles
  shareAppCard: {
    marginHorizontal: screenWidth * 0.05,
    marginBottom: screenHeight * 0.01,
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
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
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth * 0.04,
  },
  shareAppInfo: {
    flex: 1,
  },
  shareAppTitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
  },
  shareAppSubtitle: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    marginTop: 2,
  },
  versionText: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    textAlign: 'center',
    marginTop: screenHeight * 0.03,
  },
  // Edit Profile Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenHeight * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: screenHeight * 0.5,
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenHeight * 0.02,
  },
  inputGroup: {
    marginBottom: screenHeight * 0.02,
  },
  inputLabel: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: '600',
    marginBottom: screenHeight * 0.008,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.012,
    fontSize: Math.min(screenWidth * 0.04, 16),
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.012,
    fontSize: Math.min(screenWidth * 0.04, 16),
    minHeight: screenHeight * 0.08,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenHeight * 0.02,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: screenWidth * 0.03,
  },
  modalButton: {
    flex: 1,
    paddingVertical: screenHeight * 0.015,
    borderRadius: 12,
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
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonText: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
  },
  // Category Picker Styles
  categoryPicker: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.012,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPickerText: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    flex: 1,
  },
  categoryOptions: {
    marginTop: screenHeight * 0.01,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Horizontal category selection styles
  selectedCategoryContainer: {
    marginBottom: screenHeight * 0.015,
  },
  selectedCategoryInput: {
    borderWidth: 1,
    borderRadius: screenWidth * 0.03,
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    fontSize: Math.min(screenWidth * 0.04, 16),
  },
  categoryScrollContent: {
    paddingVertical: screenHeight * 0.01,
    gap: screenWidth * 0.03,
  },
  categoryOption: {
    paddingVertical: screenHeight * 0.012,
    paddingHorizontal: screenWidth * 0.04,
    borderRadius: screenWidth * 0.02,
    borderWidth: 1,
    marginRight: screenWidth * 0.02,
  },
  categoryOptionSelected: {
    // Selected state styling handled inline
  },
  categoryOptionText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    fontWeight: '600',
  },
});

export default ProfileScreen; 