import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  Dimensions,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import businessProfileService from '../services/businessProfile';
import userBusinessProfilesService from '../services/userBusinessProfiles';
import authService from '../services/auth';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BusinessProfileForm from '../components/BusinessProfileForm';
import BottomSheet from '../components/BottomSheet';
import RazorpayCheckout from 'react-native-razorpay';
import { getProductionRazorpayKey, RAZORPAY_CONFIG } from '../config/razorpayConfig';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useBusinessProfile } from '../context/BusinessProfileContext';
import subscriptionApi from '../services/subscriptionApi';
import responsiveUtils, { 
  responsiveSpacing, 
  responsiveFontSize, 
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
import logger from '../utils/logger';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers - using imported utilities

const BusinessProfilesScreen: React.FC = () => {
  const { isDarkMode, theme } = useTheme();
  const { 
    addTransaction, 
    businessProfileSubscriptions, 
    getBusinessProfileSubscription, 
    refreshBusinessProfileSubscription 
  } = useSubscription();
  const { 
    setSelectedBusinessProfile, 
    selectedBusinessProfile,
    setActivationPending,
    isActivationPending,
    clearActivationPending
  } = useBusinessProfile();
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState<any[]>([]);
    const [imageRefreshKey, setImageRefreshKey] = useState(Date.now()); // Key to force image refresh
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false); // PERFORMANCE: Background refresh state
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0); // PERFORMANCE: Track last refresh time
    const [showForm, setShowForm] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState<any>(null); // Store form data while user pays
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingProfiles, setProcessingProfiles] = useState<Set<string>>(new Set());
  const navigation = useNavigation();
  const pendingProfileDataRef = useRef<any>(null);
  const pollingCleanupRef = useRef<(() => void) | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Stop polling function
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current as any);
      pollingRef.current = null;
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingCleanupRef.current) {
        pollingCleanupRef.current();
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Memoized mock data for immediate loading
  const mockProfiles = useMemo(() => [
    {
      id: '1',
      name: 'Creative Events Studio',
      category: 'Event Planning',
      description: 'Professional event planning and management services for all occasions.',
      phone: '+1 (555) 123-4567',
      email: 'info@creativeevents.com',
      address: '123 Main Street, City, State 12345',
      services: ['Wedding Planning', 'Corporate Events', 'Birthday Parties', 'Anniversary Celebrations'],
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=200&fit=crop',
    },
    {
      id: '2',
      name: 'Elite Marketing Solutions',
      category: 'Marketing',
      description: 'Comprehensive marketing solutions for businesses of all sizes.',
      phone: '+1 (555) 987-6543',
      email: 'contact@elitemarketing.com',
      address: '456 Business Ave, Downtown, State 54321',
      services: ['Digital Marketing', 'Social Media Management', 'Content Creation', 'Brand Strategy'],
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
    },
    {
      id: '3',
      name: 'Premier Catering Services',
      category: 'Catering',
      description: 'Exquisite catering services for weddings, corporate events, and special occasions.',
      phone: '+1 (555) 456-7890',
      email: 'info@premiercatering.com',
      address: '789 Food Court, Culinary District, State 67890',
      services: ['Wedding Catering', 'Corporate Catering', 'Private Parties', 'Menu Planning'],
      imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=200&fit=crop',
    },
  ], []);

  const loadBusinessProfiles = useCallback(async (showLoading: boolean = true, forceRefresh: boolean = false) => {
    // PERFORMANCE: Only show loading spinner on force refresh or initial load
    if (showLoading || forceRefresh) {
      setLoading(true);
    } else {
      // Background refresh - show subtle indicator but don't block UI
      setBackgroundRefreshing(true);
    }
    
    try {
      // Get current user ID
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      console.log('🔍 BusinessProfilesScreen - User ID:', userId);
      console.log('🖼️ Current user logo:', currentUser?.logo || '(empty)');
      console.log('🖼️ Current user companyLogo:', currentUser?.companyLogo || '(empty)');
      
      if (!userId) {
        console.log('⚠️ No user ID available, no profiles to load');
        setProfiles([]);
        return;
      }
      
      console.log('🔍 Loading user-specific business profiles for user:', userId);
      
      // PERFORMANCE: Try to load from cache first for instant display
      if (!forceRefresh && profiles.length === 0) {
        try {
          const cacheKey = `business_profiles_user_${userId}`;
          const cachedData = await AsyncStorage.getItem(`@cache_${cacheKey}`);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (parsed.data && Date.now() < parsed.expiresAt) {
              console.log('📦 PERFORMANCE: Loading profiles from cache for instant display');
              const cachedProfiles = parsed.data;
              if (cachedProfiles.length > 0) {
                // Sort cached profiles
                const sortedProfiles = cachedProfiles.sort((a: any, b: any) => {
                  const aActive = a.subscriptionStatus?.toUpperCase() === "ACTIVE";
                  const bActive = b.subscriptionStatus?.toUpperCase() === "ACTIVE";
                  if (aActive === bActive) {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  }
                  return aActive ? -1 : 1;
                });
                setProfiles(sortedProfiles);
                setLoading(false); // Hide loading since we have cached data
              }
            }
          }
        } catch (cacheError) {
          console.log('⚠️ Cache read failed, will fetch from API:', cacheError);
        }
      }
      
      // Fetch from API (this will use cacheService.getOrFetch which handles stale-while-revalidate)
      console.log('🔍 [BUSINESS PROFILES SCREEN] Fetching profiles from API...');
      console.log('🔍 [BUSINESS PROFILES SCREEN] User ID:', userId);
      
      const apiProfiles = await businessProfileService.getUserBusinessProfiles(userId);
      
      console.log('========== BUSINESS PROFILE API RESPONSE ==========');
      console.log('📊 Profiles Count:', apiProfiles.length);
      console.log('📋 Profiles Data:', JSON.stringify(apiProfiles, null, 2));
      console.log('==================================================');
      
      console.log('🔍 [DEBUG] API Response Profiles:', apiProfiles.map(p => ({
        id: p.id,
        name: p.name,
        subscriptionStatus: p.subscriptionStatus,
        isSubscriptionActive: p.isSubscriptionActive,
        fullProfile: p
      })));
      
      console.log('🔍 [DEBUG] First Profile Full Data:', apiProfiles[0]);
      
      // All profiles loaded successfully - no special auto-sync needed
      if (apiProfiles.length > 0) {
        // Sort profiles by subscription status (ACTIVE first), then by creation date - OLDEST first within each group
        const sortedProfiles = apiProfiles.sort((a, b) => {
          const aActive = a.subscriptionStatus?.toUpperCase() === "ACTIVE";
          const bActive = b.subscriptionStatus?.toUpperCase() === "ACTIVE";

          // If both have same subscription status, sort by creation date
          if (aActive === bActive) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }

          // Active profiles come first
          return aActive ? -1 : 1;
        });
        
        setProfiles(sortedProfiles);
        setLastRefreshTime(Date.now()); // PERFORMANCE: Track refresh time
        
        console.log('✅ Loaded user-specific business profiles from API:', sortedProfiles.length);
        console.log('🔍 Total profiles loaded:', sortedProfiles.length);
        
        // Log logo URLs for debugging
        sortedProfiles.forEach((profile, index) => {
          console.log(`🖼️ Profile ${index + 1} - ${profile.name}:`);
          console.log(`   - Logo: ${profile.logo || '(empty)'}`);
          console.log(`   - CompanyLogo: ${profile.companyLogo || '(empty)'}`);
        });
      } else {
        // No profiles found from API
        setProfiles([]);
        console.log('📋 No business profiles found for user');
      }
    } catch (error) {
      console.error('Error loading business profiles:', error);
      // If we have cached profiles, keep them on error
      if (profiles.length === 0) {
        setProfiles([]);
      }
    } finally {
      setLoading(false);
      setBackgroundRefreshing(false);
    }
  }, [profiles.length]);

  // 5-minute polling logic for business profile subscription status
  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      return; // prevent duplicate polling
    }

    pollingRef.current = setInterval(async () => {
      console.log("Checking business profile subscription status...");

      try {
        // Refresh profiles to get latest status
        await loadBusinessProfiles(false, false); // Background refresh in polling
        
        // Check if any profile has ACTIVE status
        const hasActiveProfile = profiles.some(profile => 
          profile?.subscriptionStatus?.toUpperCase() === "ACTIVE"
        );
        
        if (hasActiveProfile) {
          console.log("Business profile subscription activated");
          
          if (pollingRef.current) {
            clearInterval(pollingRef.current as any);
            pollingRef.current = null;
          }
          
          // Clear processing profiles set when profiles are refreshed
          setProcessingProfiles(new Set());
        }
      } catch (error) {
        console.error("Error checking business profile status:", error);
      }
    }, 300000); // 5 minutes
  }, [loadBusinessProfiles, profiles]);

  // Initial load of business profiles
  useEffect(() => {
    loadBusinessProfiles(true, false); // Show loading on initial mount, but don't force refresh
  }, [loadBusinessProfiles]);

  // Handled by the consolidated useFocusEffect below
  /*
  useFocusEffect(
    useCallback(() => {
      // ...
    }, [profiles.length, refreshBusinessProfileSubscription])
  ); 
  */    // Load pending profile data from AsyncStorage on mount
    const loadPendingData = async () => {
      try {
        const storedPendingData = await AsyncStorage.getItem('pending_business_profile_data');
        if (storedPendingData) {
          const pendingData = JSON.parse(storedPendingData);
          setPendingProfileData(pendingData);
          console.log('📋 Loaded pending business profile data from storage');
        }
      } catch (error) {
        console.error('❌ Error loading pending profile data:', error);
      }
    };
    
    // Load pending data on mount
    useEffect(() => {
      loadPendingData();
    }, []); // Empty dependency array to run once on mount

  useEffect(() => {
    pendingProfileDataRef.current = pendingProfileData;
  }, [pendingProfileData]);

  // Check payment status and create profile if payment was successful
  const checkPaymentAndCreateProfile = useCallback(async () => {
    try {
      // Determine pending data (state or stored)
      let pendingData = pendingProfileData;

      if (!pendingData) {
        const storedPendingData = await AsyncStorage.getItem('pending_business_profile_data');
        if (!storedPendingData) {
          return; // No pending profile data
        }
        pendingData = JSON.parse(storedPendingData);
        setPendingProfileData(pendingData);
      }

      console.log('🔍 Checking payment status for business profile creation...');
      const paymentStatus = await businessProfileService.checkBusinessProfilePaymentStatus();

      if (!paymentStatus.hasPaid) {
        console.log('Payment not verified yet. Starting 5-minute polling...');

        startPolling();

        return;
      }

      console.log('✅ Payment verified - Creating business profile...');
      const newProfile = await businessProfileService.createBusinessProfile(pendingData);

      setProfiles(prev => [...prev, newProfile]);

      await AsyncStorage.removeItem('pending_business_profile_data');
      setPendingProfileData(null);
      
      // CRITICAL FIX: Clear activation pending state after successful profile creation
      clearActivationPending(newProfile.id);

      setSuccessMessage('Business profile created successfully');
      setShowSuccessModal(true);
      console.log('✅ Business profile created:', newProfile.id);

      setTimeout(() => {
        loadBusinessProfiles(true, true); // Force refresh after profile creation
      }, 1000);
    } catch (error) {
      console.error('❌ Error creating business profile:', error);
      setErrorMessage('Failed to create business profile. Please try again.');
      setShowErrorModal(true);
    }
  }, [pendingProfileData, loadBusinessProfiles, startPolling, clearActivationPending]);

  // Consolidated useFocusEffect for refreshing profiles
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 BusinessProfilesScreen focused');
      setImageRefreshKey(Date.now());
      
      // PERFORMANCE: Only refresh if data is stale (older than 30 seconds) or empty
      const STALE_THRESHOLD = 30 * 1000; // 30 seconds
      const timeSinceRefresh = Date.now() - lastRefreshTime;
      const isDataStale = timeSinceRefresh > STALE_THRESHOLD || profiles.length === 0;
      
      if (isDataStale) {
        console.log(`🔄 Data is stale (${Math.round(timeSinceRefresh / 1000)}s old) or empty, refreshing...`);
        loadBusinessProfiles(false, false); // Don't show loading, use background refresh
      } else {
        console.log(`✅ Data is fresh (${Math.round(timeSinceRefresh / 1000)}s old), skipping refresh`);
      }
      
      // CRITICAL FIX: Clear processing state when returning from subscription screen
      // This prevents loader on "Activate Now" button after navigation
      setProcessingProfiles(new Set());
      
      // CRITICAL FIX: Force UI refresh to pick up activation pending state
      // This ensures BusinessCard components re-render with latest context state
      setTimeout(() => {
        console.log('🔄 BusinessProfilesScreen - Force refresh for activation pending state');
        setImageRefreshKey(prev => prev + 1); // Force re-render
      }, 100);
      
      // Check if payment was completed and create profile if needed
      checkPaymentAndCreateProfile();
      
      // Start polling if any profile has PENDING or PROCESSING status
      const hasPendingOrProcessing = profiles.some(profile => {
        const status = profile?.subscriptionStatus?.toUpperCase();
        return status === 'PENDING' || status === 'PROCESSING';
      });
      
      if (hasPendingOrProcessing && !pollingRef.current) {
        console.log('🔄 Starting 5-minute subscription polling for PENDING/PROCESSING profiles');
        startPolling();
      }
      
      return () => {
        if (pollingCleanupRef.current) {
          pollingCleanupRef.current();
          pollingCleanupRef.current = null;
        }
      };
    }, [loadBusinessProfiles, checkPaymentAndCreateProfile, profiles, startPolling, lastRefreshTime])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setImageRefreshKey(Date.now());
    await loadBusinessProfiles(true, true); // Force refresh on pull-to-refresh
    setRefreshing(false);
  }, [loadBusinessProfiles]);

  
  const handlePayNow = useCallback(async () => {
    if (!pendingProfileDataRef.current) {
      setErrorMessage('No business profile data found.');
      setShowErrorModal(true);
      return;
    }
    const businessProfileId = pendingProfileDataRef.current.id;

    // Close the payment modal before navigation
    setShowPaymentModal(false);

    // NAVIGATE TO SUBSCRIPTION SCREEN INSTEAD OF DIRECT RAZORPAY
    console.log('🔍 BUSINESS PROFILES - Navigating to Subscription screen for profile:', businessProfileId);

    navigation.navigate('Subscription' as any, {
      source: 'BUSINESS_PROFILE',
      businessProfileId: businessProfileId
    });
  }, [navigation]);

  const handleProfileSelect = useCallback(async (profile: any) => {
    // CRITICAL FIX: Enhanced debugging for profile selection
    console.log('🔍 [PROFILE SELECTION] Starting profile selection:', {
      profileId: profile.id,
      profileName: profile.name,
      subscriptionStatus: profile.subscriptionStatus,
      isSubscriptionActive: profile.isSubscriptionActive,
      subscriptionContext: getBusinessProfileSubscription(profile.id)?.status,
      currentSelectedProfile: selectedBusinessProfile?.id
    });
    
    const isActive = profile?.subscriptionStatus?.toUpperCase() === "ACTIVE";
    
    console.log('🔍 [PROFILE SELECTION] Profile active check:', { profileId: profile.id, isActive });
    
    if (!isActive) {
      const message = "This business profile is locked until the subscription is activated.";
      setErrorMessage(message);
      
      // Store this profile as the pending one so handlePayNow can use its ID
      setPendingProfileData(profile);
      pendingProfileDataRef.current = profile;
      
      setShowPaymentModal(true);
      return;
    }

    try {
      console.log('🔄 [PROFILE SELECTION] Setting selected profile:', profile.name);
      await setSelectedBusinessProfile(profile);
      
      // CRITICAL FIX: Add immediate state verification
      setTimeout(() => {
        console.log('✅ [PROFILE SELECTION] Profile selection completed:', {
          profileId: profile.id,
          profileName: profile.name,
          success: true
        });
      }, 100);
    } catch (error: any) {
      console.error('❌ [PROFILE SELECTION] Selection failed:', error);
      setErrorMessage(error.message || 'Failed to select business profile');
      setShowErrorModal(true);
    }
  }, [getBusinessProfileSubscription, setSelectedBusinessProfile, selectedBusinessProfile]);

  const initiatePaymentForProfile = useCallback((profile: any) => {
    // Prevent multiple payment attempts
    if (processingProfiles.has(profile.id)) {
      console.log('🔍 Payment already in progress for profile:', profile.id);
      return;
    }
    
    setProcessingProfiles(prev => new Set(prev).add(profile.id));
    setPendingProfileData(profile);
    pendingProfileDataRef.current = profile;
    handlePayNow();
  }, [processingProfiles, handlePayNow]);

  const handleDeleteProfile = useCallback((profileId: string) => {
    setProfileToDelete(profileId);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteProfile = useCallback(async () => {
    if (!profileToDelete) return;
    try {
      await businessProfileService.deleteBusinessProfile(profileToDelete);
      setProfiles(prev => prev.filter(p => p.id !== profileToDelete));
      setSuccessMessage('Business profile deleted successfully');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting profile:', error);
      setErrorMessage('Failed to delete profile. Please try again.');
      setShowErrorModal(true);
    } finally {
      setShowDeleteModal(false);
      setProfileToDelete(null);
    }
  }, [profileToDelete]);

  const handleEditProfile = useCallback((profile: any) => {
    setEditingProfile(profile);
    setShowForm(true);
  }, []);

  const handleAddProfile = useCallback(() => {
    setEditingProfile(null);
    setShowBottomSheet(true);
  }, []);

  const handlePaymentModalClose = useCallback(() => {
    setShowPaymentModal(false);
    setIsProcessingPayment(false);
    // Clear processing state when modal is closed
    setProcessingProfiles(new Set());
  }, []);

  const reportPaymentFailure = useCallback(async (orderId: string, status: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${api.defaults.baseURL}/api/mobile/transactions/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status })
      });
    } catch (error) {
      console.warn('⚠️ reportPaymentFailure error:', error);
    }
  }, []);

  const SubscriptionStatusBadge = React.memo<{
    status: any;
    theme: any;
    profileData?: any;
  }>(({ status, theme, profileData }) => {
    // Use only subscriptionStatus for logic as per requirements
    const backendStatus = profileData?.subscriptionStatus;
    const isActive = backendStatus?.toUpperCase() === "ACTIVE";
    
    if (!backendStatus) return null;
    
    const getStatusColor = () => {
      if (isActive) return '#4CAF50';
      const normalizedStatus = backendStatus?.toLowerCase();
      switch (normalizedStatus) {
        case 'pending': return '#FF9800';
        case 'expired': return '#F44336';
        case 'cancelled': return '#9E9E9E';
        default: return theme.colors.textSecondary;
      }
    };
    
    const statusLabel = backendStatus?.toUpperCase() || 'UNKNOWN';
    const backgroundColor = `${getStatusColor()}20`;
    const textColor = getStatusColor();
    
    return (
      <View style={[styles.statusBadge, { backgroundColor, borderColor: textColor, borderWidth: 1 }]}>
        <Text style={[styles.statusBadgeText, { color: textColor }]}>{statusLabel}</Text>
      </View>
    );
  });

  const handleFormSubmit = useCallback(async (formData: any) => {
    if (!editingProfile) {
      setFormLoading(true);
      try {
        const newProfile = await businessProfileService.createBusinessProfile(formData);
        const profileWithId = { ...formData, id: newProfile.id };
        setPendingProfileData(profileWithId);
        pendingProfileDataRef.current = profileWithId;
        await AsyncStorage.setItem('pending_business_profile_data', JSON.stringify(profileWithId));
        setShowPaymentModal(true);
        setShowForm(false);
        setShowBottomSheet(false);
        loadBusinessProfiles(true, true); // Force refresh after form submission
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to create business profile.');
        setShowErrorModal(true);
      } finally {
        setFormLoading(false);
      }
      return;
    }

    setFormLoading(true);
    try {
      const updatedProfile = await businessProfileService.updateBusinessProfile(editingProfile.id, formData);
      const updateFn = (prev: any[]) => prev.map(p => p.id === editingProfile.id ? updatedProfile : p);
      setProfiles(updateFn);
      setSuccessMessage('Business profile updated successfully');
      setShowSuccessModal(true);
      setShowForm(false);
      setShowBottomSheet(false);
      setEditingProfile(null);
      setTimeout(() => loadBusinessProfiles(true, true), 1000); // Force refresh after profile update
    } catch (error) {
      setErrorMessage('Failed to update profile.');
      setShowErrorModal(true);
    } finally {
      setFormLoading(false);
    }
  }, [editingProfile, loadBusinessProfiles]);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setShowBottomSheet(false);
    setEditingProfile(null);
  }, []);

  const BusinessCard = React.memo<{
    item: any;
    imageRefreshKey: number;
    theme: any;
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
    onSelect: (item: any) => void;
    onPay: (item: any) => void;
    subscription: any;
    isActivationPending: (profileId: string) => boolean;
  }>(({ item, imageRefreshKey, theme, onEdit, onDelete, onSelect, onPay, subscription, isActivationPending }) => {
    // Debug logging to identify the issue
    console.log('🔍 [DEBUG] Profile Subscription Status:', {
      profileId: item.id,
      profileName: item.name,
      subscriptionStatus: item.subscriptionStatus,
      isSubscriptionActive: item.isSubscriptionActive,
      subscriptionContext: subscription?.status
    });
    
    const isActive = item?.subscriptionStatus?.toUpperCase() === "ACTIVE";
    const isProcessing = item?.subscriptionStatus?.toUpperCase() === "PROCESSING";
    
    // CRITICAL FIX: Check activation pending state from context with enhanced debugging
    const isPendingActivation = isActivationPending(item.id);
    console.log('🔍 [DEBUG] Activation Pending State:', {
      profileId: item.id,
      profileName: item.name,
      isPendingActivation,
      imageRefreshKey
    });
    
    // Effective active state: backend says active AND not pending activation
    const isEffectivelyActive = isActive && !isPendingActivation;
    
    const isLocked = !isEffectivelyActive;
    
    console.log('🔍 [DEBUG] Final UI State:', {
      profileId: item.id,
      profileName: item.name,
      isActive,
      isPendingActivation,
      isEffectivelyActive,
      isLocked,
      willShowMessage: isPendingActivation ? 'Activation in 24 hours' : (isProcessing ? 'Payment processing' : 'Subscription required')
    });
    
    const isSelected = item.id === selectedBusinessProfile?.id;

    return (
      <TouchableOpacity 
        style={[
          styles.businessCard, 
          { backgroundColor: theme.colors.cardBackground },
          isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
        ]}
        onPress={() => onSelect(item)}
        disabled={isLocked}
        activeOpacity={isLocked ? 1 : 0.7}
      >
        {isLocked && (
          <View style={styles.lockOverlay}>
            <View style={[styles.lockBadge, { backgroundColor: theme.colors.surface }]}>
              {/* Delete button top-right inside lock badge */}
              <TouchableOpacity 
                style={[styles.lockBadgeTopDeleteButton, { backgroundColor: 'rgba(255, 80, 80, 0.35)', opacity: 0.85 }]}
                onPress={() => onDelete(item.id)}
              >
                <Icon name="delete" size={10} color="#ff4444" />
              </TouchableOpacity>
              {isProcessing ? (
                <>
                  <Text style={[styles.lockBusinessInfo, { color: theme.colors.text }]} numberOfLines={1}>
                    <Text style={{ color: theme.colors.text }}>{item.businessName || item.name || 'Business'}</Text>
                    {(item.businessSubcategory || item.subcategory) && (
                      <>
                        <Text style={{ color: theme.colors.text }}> • </Text>
                        <Text style={{ color: theme.colors.primary }}>{item.businessSubcategory || item.subcategory}</Text>
                      </>
                    )}
                  </Text>
                  <Icon name="hourglass-empty" size={20} color={theme.colors.warning} />
                  <Text style={[styles.lockText, { color: theme.colors.text }]}>
                    Payment is processing
                  </Text>
                  <Text style={[styles.lockSubText, { color: theme.colors.textSecondary }]}>
                    It will be processed within 24 hours
                  </Text>
                </>
              ) : isPendingActivation ? (
                <>
                  <Text style={[styles.lockBusinessInfo, { color: theme.colors.text }]} numberOfLines={1}>
                    <Text style={{ color: theme.colors.text }}>{item.businessName || item.name || 'Business'}</Text>
                    {(item.businessSubcategory || item.subcategory) && (
                      <>
                        <Text style={{ color: theme.colors.text }}> • </Text>
                        <Text style={{ color: theme.colors.primary }}>{item.businessSubcategory || item.subcategory}</Text>
                      </>
                    )}
                  </Text>
                  <Icon name="hourglass-empty" size={20} color={theme.colors.warning} />
                  <Text style={[styles.lockText, { color: theme.colors.text }]}>
                    Your business profile will be activated within 24 hours
                  </Text>
                  <Text style={[styles.lockSubText, { color: theme.colors.textSecondary }]}>
                    Payment successful - Activation in progress
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.lockBusinessInfo, { color: theme.colors.text }]} numberOfLines={1}>
                    <Text style={{ color: theme.colors.text }}>{item.businessName || item.name || 'Business'}</Text>
                    {(item.businessSubcategory || item.subcategory) && (
                      <>
                        <Text style={{ color: theme.colors.text }}> • </Text>
                        <Text style={{ color: theme.colors.primary }}>{item.businessSubcategory || item.subcategory}</Text>
                      </>
                    )}
                  </Text>
                  <Icon name="lock" size={20} color={theme.colors.error} />
                  <Text style={[styles.lockText, { color: theme.colors.text }]}>Subscription Required</Text>
                  <TouchableOpacity 
                    style={[styles.activateButton, { backgroundColor: theme.colors.primary, opacity: 0.9 }]}
                    onPress={() => onPay(item)}
                    disabled={processingProfiles.has(item.id)}
                  >
                    {processingProfiles.has(item.id) ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.activateButtonText}>Activate Now</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
        <View style={styles.cardHeader}>
          <View style={styles.businessInfoWithLogo}>
            <View style={styles.logoContainer}>
              {(() => {
                const logoUrl = item.companyLogo || item.logo;
                const isValidUrl = logoUrl && 
                  typeof logoUrl === 'string' && 
                  logoUrl.trim() !== '' && 
                  (logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('file://'));
                
                if (isValidUrl) {
                  const imageUri = logoUrl.includes('?') 
                    ? `${logoUrl}&t=${imageRefreshKey}` 
                    : `${logoUrl}?t=${imageRefreshKey}`;
                  
                  return (
                    <Image
                      source={{ 
                        uri: imageUri,
                        cache: 'reload' // Force reload from network, not cache
                      }}
                      style={styles.businessLogo}
                      resizeMode="cover"
                      key={`${item.id}-logo-${imageRefreshKey}`} // Force re-render with refresh key
                      onError={(error) => {
                        logger.log(`❌ Failed to load logo for ${item.name}:`, {
                          logoUrl,
                          error: error.nativeEvent,
                          imageUri
                        });
                      }}
                      onLoad={() => {
                        logger.log(`✅ Logo loaded for ${item.name}:`, logoUrl);
                      }}
                    />
                  );
                } else {
                  logger.log(`⚠️ No valid logo URL for ${item.name}:`, { 
                    companyLogo: item.companyLogo, 
                    logo: item.logo 
                  });
                  return (
                    <View style={[styles.logoPlaceholder, { backgroundColor: `${theme.colors.primary}20` }]}>
                      <Icon name="business" size={24} color={theme.colors.primary} />
                    </View>
                  );
                }
              })()}
            </View>
            <View style={styles.businessInfo}>
              <View style={styles.nameAndStatus}>
                <Text style={[styles.businessName, { color: theme.colors.text }]}>{item.name || 'Business Name'}</Text>
                <SubscriptionStatusBadge 
                  status={getBusinessProfileSubscription(item.id)} 
                  theme={theme} 
                  profileData={item}
                />
              </View>
              {(item.subcategory || item.subCategory) && (
                <Text style={[styles.businessCategory, { color: theme.colors.primary }]}>{item.subcategory || item.subCategory}</Text>
              )}
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}20` }]} 
              onPress={() => onEdit(item)}
              disabled={isLocked}
            >
              <Icon name="edit" size={16} color={isLocked ? theme.colors.textSecondary : theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: `${theme.colors.error}20` }]} 
              onPress={() => onDelete(item.id)}
              disabled={isLocked}
            >
              <Icon name="delete" size={16} color={isLocked ? theme.colors.textSecondary : theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        {item.description && <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{item.description}</Text>}
        <View style={styles.contactInfo}>
          {item.phone && (
            <View style={styles.contactItem}>
              <Icon name="phone" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>{item.phone}</Text>
            </View>
          )}
          {item.alternatePhone && (
            <View style={styles.contactItem}>
              <Icon name="phone-in-talk" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                {item.alternatePhone} (Alt)
              </Text>
            </View>
          )}
          {item.email && (
            <View style={styles.contactItem}>
              <Icon name="email" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                {item.email}
              </Text>
            </View>
          )}
          {item.address && (
            <View style={styles.contactItem}>
              <Icon name="location-on" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                {item.address}
              </Text>
            </View>
          )}
          {item.website && (
            <View style={styles.contactItem}>
              <Icon name="language" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                {item.website}
              </Text>
            </View>
          )}
        </View>

        {item.services && item.services.length > 0 && (
          <View style={styles.servicesContainer}>
            <Text style={[styles.servicesTitle, { color: theme.colors.text }]}>Services:</Text>
            <View style={styles.servicesList}>
              {item.services.slice(0, 3).map((service: string, index: number) => (
                <View key={`${item.id}-service-${index}-${service}`} style={[styles.serviceTag, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Text style={[styles.serviceText, { color: theme.colors.primary }]}>{service}</Text>
                </View>
              ))}
              {item.services.length > 3 && (
                <View key={`${item.id}-more-services`} style={[styles.serviceTag, { backgroundColor: `${theme.colors.textSecondary}20` }]}>
                  <Text style={[styles.serviceText, { color: theme.colors.textSecondary }]}>
                    +{item.services.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if item data, mainProfileId, imageRefreshKey, theme, or activation pending state changes
    const prevActivationPending = prevProps.isActivationPending(prevProps.item.id);
    const nextActivationPending = nextProps.isActivationPending(nextProps.item.id);
    
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.category === nextProps.item.category &&
      prevProps.item.description === nextProps.item.description &&
      prevProps.item.companyLogo === nextProps.item.companyLogo &&
      prevProps.item.logo === nextProps.item.logo &&
      prevProps.item.phone === nextProps.item.phone &&
      prevProps.item.email === nextProps.item.email &&
      prevProps.item.address === nextProps.item.address &&
      prevProps.item.website === nextProps.item.website &&
      JSON.stringify(prevProps.item.services) === JSON.stringify(nextProps.item.services) &&
      prevProps.imageRefreshKey === nextProps.imageRefreshKey &&
      prevProps.theme.colors.primary === nextProps.theme.colors.primary &&
      prevProps.theme.colors.text === nextProps.theme.colors.text &&
      prevActivationPending === nextActivationPending
    );
  });

  const renderBusinessCard = useCallback(({ item, index }: { item: any; index: number }) => {
    return (
      <BusinessCard
        item={item}
        imageRefreshKey={imageRefreshKey}
        theme={theme}
        onEdit={handleEditProfile}
        onDelete={handleDeleteProfile}
        onSelect={handleProfileSelect}
        onPay={initiatePaymentForProfile}
        subscription={getBusinessProfileSubscription(item.id)}
        isActivationPending={isActivationPending}
      />
    );
  }, [imageRefreshKey, theme, handleEditProfile, handleDeleteProfile, handleProfileSelect, initiatePaymentForProfile, getBusinessProfileSubscription, isActivationPending]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['left', 'right']}
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
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.cardBackground }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>Business Profiles</Text>
            {/* PERFORMANCE: Subtle background refresh indicator */}
            {backgroundRefreshing && (
              <ActivityIndicator size="small" color={theme.colors.primary} style={styles.backgroundRefreshIndicator} />
            )}
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.cardBackground }]}
            onPress={handleAddProfile}
          >
            <Icon name="add" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        
        {/* Business Profiles Container */}
        <View>
          {/* Skeleton Loading */}
          {loading && (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((index) => (
                <View key={index} style={[styles.skeletonCard, { backgroundColor: theme.colors.cardBackground }]}>
                  {/* Profile Image Skeleton */}
                  <View style={[styles.skeletonImage, { backgroundColor: theme.colors.border }]} />
                  
                  {/* Profile Content Skeleton */}
                  <View style={styles.skeletonContent}>
                    {/* Title Skeleton */}
                    <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
                    
                    {/* Subtitle Skeleton */}
                    <View style={[styles.skeletonSubtitle, { backgroundColor: theme.colors.border }]} />
                    
                    {/* Action Buttons Skeleton */}
                    <View style={styles.skeletonActions}>
                      <View style={[styles.skeletonButton, { backgroundColor: theme.colors.border }]} />
                      <View style={[styles.skeletonButton, { backgroundColor: theme.colors.border, marginLeft: 8 }]} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Business Profiles List */}
          {!loading && <FlatList
          data={profiles}
          renderItem={renderBusinessCard}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContainer, 
            { paddingBottom: 120 + insets.bottom },
            profiles.length === 0 && styles.emptyListContainer
          ]}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          // Enhanced performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={10}
          initialNumToRender={5}
          updateCellsBatchingPeriod={50}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyStateContainer}>
                <Icon name="business-center" size={80} color={theme.colors.primary} style={styles.emptyStateIcon} />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
                  No Business Profiles
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.text }]}>
                  You haven't created any business profiles yet. Tap the + button to create your first profile.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleAddProfile}
                >
                  <Icon name="add" size={20} color="#ffffff" />
                  <Text style={styles.emptyStateButtonText}>Create Profile</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />}
        
        {/* Business Profile Form Modal */}
        <BusinessProfileForm
          visible={showForm}
          profile={editingProfile}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          loading={formLoading}
        />

        {/* Bottom Sheet for Add Profile */}
        <BottomSheet
          title="Add Business Profile"
          visible={showBottomSheet}
          onClose={handleFormClose}
        >
          <BusinessProfileForm
            visible={showBottomSheet}
            profile={null}
            onSubmit={handleFormSubmit}
            onClose={handleFormClose}
            loading={formLoading}
          />
        </BottomSheet>

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
              <View style={[styles.successModalContainer, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.successModalHeader}>
                  <View style={[styles.successIconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
                    <Icon name="check-circle" size={Math.min(screenWidth * 0.08, 32)} color={theme.colors.primary} />
                  </View>
                  <Text 
                    style={[styles.successModalTitle, { color: theme.colors.text }]}
                  >
                    Success
                  </Text>
                  <TouchableOpacity 
                    style={[styles.closeModalButton, { backgroundColor: theme.colors.inputBackground }]}
                    onPress={() => setShowSuccessModal(false)}
                    activeOpacity={0.7}
                  >
                    <Icon name="close" size={Math.min(screenWidth * 0.06, 24)} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.successModalContent}>
                  <Text style={[styles.successModalMessage, { color: theme.colors.text }]}>
                    {successMessage}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.successModalButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setShowSuccessModal(false)}
                >
                  <Text style={styles.successModalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
          statusBarTranslucent={true}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDeleteModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => {}} // Prevent closing when tapping inside modal
            >
              <View style={[styles.deleteModalContainer, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.deleteModalHeader}>
                  <View style={[styles.deleteIconContainer, { backgroundColor: '#ff444420' }]}>
                    <Icon name="warning" size={Math.min(screenWidth * 0.08, 32)} color="#ff4444" />
                  </View>
                  <Text 
                    style={[styles.deleteModalTitle, { color: theme.colors.text }]}
                  >
                    Delete Profile
                  </Text>
                  <TouchableOpacity 
                    style={[styles.closeModalButton, { backgroundColor: theme.colors.inputBackground }]}
                    onPress={() => setShowDeleteModal(false)}
                    activeOpacity={0.7}
                  >
                    <Icon name="close" size={Math.min(screenWidth * 0.06, 24)} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.deleteModalContent}>
                  <Text style={[styles.deleteModalMessage, { color: theme.colors.text }]}>
                    Are you sure you want to delete this business profile? This action cannot be undone.
                  </Text>
                </View>
                
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity 
                    style={[styles.deleteModalCancelButton, { backgroundColor: theme.colors.inputBackground }]}
                    onPress={() => setShowDeleteModal(false)}
                  >
                    <Text style={[styles.deleteModalCancelText, { color: theme.colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.deleteModalDeleteButton, { backgroundColor: '#ff4444' }]}
                    onPress={confirmDeleteProfile}
                  >
                    <Text style={styles.deleteModalDeleteText}>Delete</Text>
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
              <View style={[styles.errorModalContainer, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.errorModalHeader}>
                  <View style={[styles.errorIconContainer, { backgroundColor: '#ff444420' }]}>
                    <Icon name="error-outline" size={Math.min(screenWidth * 0.08, 32)} color="#ff4444" />
                  </View>
                  <Text 
                    style={[styles.errorModalTitle, { color: theme.colors.text }]}
                  >
                    Error
                  </Text>
                  <TouchableOpacity 
                    style={[styles.closeModalButton, { backgroundColor: theme.colors.inputBackground }]}
                    onPress={() => setShowErrorModal(false)}
                    activeOpacity={0.7}
                  >
                    <Icon name="close" size={Math.min(screenWidth * 0.06, 24)} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.errorModalContent}>
                  <Text style={[styles.errorModalMessage, { color: theme.colors.text }]}>
                    {errorMessage}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.errorModalButton, { backgroundColor: '#ff4444' }]}
                  onPress={() => setShowErrorModal(false)}
                >
                  <Text style={styles.errorModalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Payment Required Modal */}
        <Modal
          visible={showPaymentModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handlePaymentModalClose}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.paymentModalContainer, { backgroundColor: theme.colors.surface }]}>
              {/* Premium Badge */}
              <View style={styles.paymentPremiumBadge}>
                <Icon name="star" size={Math.min(screenWidth * 0.04, 16)} color="#DAA520" />
                <Text style={styles.paymentPremiumBadgeText}>PREMIUM</Text>
              </View>

              {/* Modal Header */}
              <View style={styles.paymentModalHeader}>
                <Text style={[styles.paymentModalTitle, { color: theme.colors.text }]}>
                  Payment Required
                </Text>
                <Text style={[styles.paymentModalSubtitle, { color: theme.colors.textSecondary }]}>
                  You already have a business profile. To add additional business profiles, payment is required for each new profile.
                </Text>
              </View>

              {/* Features List */}
              <View style={styles.paymentFeaturesList}>
                <View style={styles.paymentFeatureItem}>
                  <Icon name="check-circle" size={Math.min(screenWidth * 0.04, 16)} color="#4CAF50" />
                  <Text style={[styles.paymentFeatureText, { color: theme.colors.text }]}>
                    Add an additional business profile
                  </Text>
                </View>
                <View style={styles.paymentFeatureItem}>
                  <Icon name="check-circle" size={Math.min(screenWidth * 0.04, 16)} color="#4CAF50" />
                  <Text style={[styles.paymentFeatureText, { color: theme.colors.text }]}>
                    Manage multiple business profiles
                  </Text>
                </View>
                <View style={styles.paymentFeatureItem}>
                  <Icon name="check-circle" size={Math.min(screenWidth * 0.04, 16)} color="#4CAF50" />
                  <Text style={[styles.paymentFeatureText, { color: theme.colors.text }]}>
                    Each additional profile requires payment
                  </Text>
                </View>
              </View>

              {/* Modal Footer */}
              <View style={styles.paymentModalFooter}>
                <TouchableOpacity 
                  style={[styles.paymentCancelButton, { borderColor: theme.colors.border || '#cccccc' }]}
                  onPress={handlePaymentModalClose}
                >
                  <Text style={[styles.paymentCancelButtonText, { color: theme.colors.textSecondary }]}>
                    Maybe Later
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.paymentButton}
                  onPress={handlePayNow}
                  disabled={isProcessingPayment}
                  activeOpacity={isProcessingPayment ? 0.8 : 0.9}
                >
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53']}
                    style={styles.paymentButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isProcessingPayment ? (
                      <>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.paymentButtonText}>Processing...</Text>
                      </>
                    ) : (
                      <>
                        <Icon name="payment" size={Math.min(screenWidth * 0.035, 14)} color="#ffffff" style={styles.paymentButtonIcon} />
                        <Text style={styles.paymentButtonText}>Pay Now</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Skeleton Loading Styles
  skeletonContainer: {
    padding: Math.max(12, responsiveLayout.containerPaddingHorizontal * 0.7),
  },
  skeletonCard: {
    flexDirection: 'row',
    padding: Math.max(12, responsiveLayout.containerPaddingHorizontal * 0.7),
    marginBottom: Math.max(8, screenHeight * 0.015),
    borderRadius: Math.max(12, screenWidth * 0.03),
    ...responsiveShadow.medium,
  },
  skeletonImage: {
    width: Math.max(48, screenWidth * 0.12),
    height: Math.max(48, screenWidth * 0.12),
    borderRadius: Math.max(8, screenWidth * 0.02),
  },
  skeletonContent: {
    flex: 1,
    marginLeft: Math.max(12, screenWidth * 0.03),
  },
  skeletonTitle: {
    width: '60%',
    height: Math.max(12, screenWidth * 0.03),
    borderRadius: Math.max(4, screenWidth * 0.01),
    marginBottom: Math.max(4, screenHeight * 0.008),
  },
  skeletonSubtitle: {
    width: '40%',
    height: Math.max(10, screenWidth * 0.025),
    borderRadius: Math.max(4, screenWidth * 0.01),
    marginBottom: Math.max(8, screenHeight * 0.015),
  },
  skeletonActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonButton: {
    width: Math.max(60, screenWidth * 0.15),
    height: Math.max(24, screenHeight * 0.03),
    borderRadius: Math.max(4, screenWidth * 0.01),
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveLayout.headerPaddingHorizontal,
    paddingBottom: Math.max(responsiveSpacing.md, screenHeight * 0.02),
  },
  headerTitle: {
    fontSize: Math.min(responsiveText.heading * 0.8, 16),
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  backgroundRefreshIndicator: {
    marginLeft: 8,
  },
  backButton: {
    width: Math.min(40, screenWidth * 0.09),
    height: Math.min(40, screenWidth * 0.09),
    borderRadius: Math.min(20, screenWidth * 0.045),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.min(12, screenWidth * 0.03),
    ...responsiveShadow.small,
  },
  addButton: {
    width: Math.max(32, screenWidth * 0.08),
    height: Math.max(32, screenWidth * 0.08),
    borderRadius: Math.max(16, screenWidth * 0.04),
    justifyContent: 'center',
    alignItems: 'center',
    ...responsiveShadow.medium,
  },
  searchContainer: {
    paddingHorizontal: Math.max(12, responsiveLayout.containerPaddingHorizontal * 0.7),
    marginBottom: Math.max(6, screenHeight * 0.01),
  },
  infoMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.max(12, responsiveLayout.containerPaddingHorizontal * 0.7),
    paddingVertical: Math.max(8, screenHeight * 0.01),
    marginHorizontal: Math.max(12, responsiveLayout.containerPaddingHorizontal * 0.7),
    marginBottom: Math.max(8, screenHeight * 0.01),
    borderRadius: Math.max(8, screenWidth * 0.02),
    borderWidth: 1,
    ...responsiveShadow.small,
  },
  infoMessageText: {
    fontSize: Math.min(responsiveText.body * 0.85, 12),
    lineHeight: Math.min(responsiveText.body * 1.2, 16),
    marginLeft: Math.max(8, screenWidth * 0.02),
    flex: 1,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Math.max(16, screenWidth * 0.04),
    paddingHorizontal: Math.max(10, screenWidth * 0.025),
    paddingVertical: Math.max(6, screenHeight * 0.008),
    ...responsiveShadow.medium,
  },
  nameAndStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Math.max(3, screenHeight * 0.004),
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  searchInput: {
    flex: 1,
    marginLeft: Math.max(6, screenWidth * 0.015),
    fontSize: Math.min(responsiveText.body * 0.75, 12),
  },
  listContainer: {
    paddingHorizontal: Math.max(12, responsiveLayout.containerPaddingHorizontal * 0.7),
    paddingBottom: 100,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.max(20, responsiveSpacing.xl * 0.7),
    paddingVertical: screenHeight * 0.08,
  },
  emptyStateIcon: {
    opacity: 0.5,
    marginBottom: Math.max(12, responsiveSpacing.lg * 0.7),
  },
  emptyStateTitle: {
    fontSize: Math.min(responsiveText.title * 0.85, 16),
    fontWeight: '700',
    marginBottom: Math.max(8, responsiveSpacing.sm * 0.7),
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: Math.min(responsiveText.body * 0.85, 13),
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Math.max(20, responsiveSpacing.xl * 0.7),
    opacity: 0.85,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.max(20, responsiveSpacing.xl * 0.7),
    paddingVertical: Math.max(10, responsiveSpacing.md * 0.7),
    borderRadius: 20,
    ...responsiveShadow.medium,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: Math.min(responsiveText.body * 0.85, 13),
    fontWeight: '600',
    marginLeft: Math.max(6, responsiveSpacing.sm * 0.7),
  },
  businessCard: {
    borderRadius: Math.max(10, responsiveSize.cardBorderRadius * 0.8),
    padding: Math.max(10, responsiveSize.cardPadding * 0.7),
    marginBottom: Math.max(10, responsiveSize.cardMarginBottom * 0.7),
    ...responsiveShadow.large,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Math.max(8, screenHeight * 0.01),
  },
  businessInfoWithLogo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  logoContainer: {
    marginRight: Math.max(8, screenWidth * 0.025),
  },
  businessLogo: {
    width: Math.max(40, screenWidth * 0.1),
    height: Math.max(40, screenWidth * 0.1),
    borderRadius: Math.max(20, screenWidth * 0.05),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoPlaceholder: {
    width: Math.max(40, screenWidth * 0.1),
    height: Math.max(40, screenWidth * 0.1),
    borderRadius: Math.max(20, screenWidth * 0.05),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: Math.min(screenWidth * 0.038, 14),
    fontWeight: 'bold',
    marginBottom: Math.max(3, screenHeight * 0.004),
  },
  userBadge: {
    fontSize: Math.min(screenWidth * 0.025, 10),
    fontWeight: '500',
    fontStyle: 'italic',
  },
  businessCategory: {
    fontSize: Math.min(screenWidth * 0.03, 11),
    fontWeight: '600',
    marginBottom: Math.max(3, screenHeight * 0.004),
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: Math.max(28, screenWidth * 0.07),
    height: Math.max(28, screenWidth * 0.07),
    borderRadius: Math.max(14, screenWidth * 0.035),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Math.max(6, screenWidth * 0.015),
  },
  description: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    lineHeight: 16,
    marginBottom: Math.max(8, screenHeight * 0.01),
  },
  contactInfo: {
    marginBottom: Math.max(8, screenHeight * 0.01),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.max(3, screenHeight * 0.004),
  },
  contactText: {
    fontSize: Math.min(screenWidth * 0.028, 11),
    marginLeft: Math.max(6, screenWidth * 0.015),
  },
  servicesContainer: {
    marginTop: Math.max(6, screenHeight * 0.008),
  },
  servicesTitle: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    fontWeight: '600',
    marginBottom: Math.max(4, screenHeight * 0.006),
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceTag: {
    paddingHorizontal: Math.max(8, screenWidth * 0.025),
    paddingVertical: Math.max(3, screenHeight * 0.004),
    borderRadius: 12,
    marginRight: Math.max(6, screenWidth * 0.015),
    marginBottom: Math.max(3, screenHeight * 0.004),
  },
  serviceText: {
    fontSize: Math.min(screenWidth * 0.023, 9),
    fontWeight: '500',
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContainer: {
    borderRadius: Math.min(screenWidth * 0.05, 20),
    padding: Math.min(screenWidth * 0.04, 16),
    width: '100%',
    maxWidth: Math.min(screenWidth * 0.88, 380),
    minWidth: Math.min(screenWidth * 0.78, 300),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 25,
    alignSelf: 'center',
  },
  successModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Math.min(screenHeight * 0.015, 12),
    paddingBottom: Math.min(screenHeight * 0.01, 8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: Math.min(screenWidth * 0.1, 40),
    position: 'relative',
  },
  successIconContainer: {
    width: Math.min(screenWidth * 0.1, 40),
    height: Math.min(screenWidth * 0.1, 40),
    borderRadius: Math.min(screenWidth * 0.05, 20),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  successModalTitle: {
    fontSize: Math.min(screenWidth * 0.042, 16),
    fontWeight: '700',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 0,
  },
  successModalContent: {
    paddingVertical: Math.min(screenHeight * 0.02, 16),
    marginBottom: Math.min(screenHeight * 0.02, 16),
    paddingHorizontal: Math.min(screenWidth * 0.02, 16),
  },
  successModalMessage: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    lineHeight: Math.min(screenWidth * 0.05, 20),
    textAlign: 'center',
    opacity: 0.9,
  },
  successModalButton: {
    borderRadius: Math.min(screenWidth * 0.025, 10),
    paddingVertical: Math.min(screenHeight * 0.015, 12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successModalButtonText: {
    fontSize: Math.min(screenWidth * 0.038, 15),
    fontWeight: '600',
    color: '#ffffff',
  },
  // Delete Modal Styles (matching login screen error modal)
  deleteModalContainer: {
    width: Math.min(screenWidth * 0.85, 380),
    maxWidth: 380,
    borderRadius: 18,
    padding: Math.max(16, screenWidth * 0.05),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: Math.max(12, screenHeight * 0.015),
    position: 'relative',
  },
  deleteIconContainer: {
    width: Math.min(screenWidth * 0.15, 60),
    height: Math.min(screenWidth * 0.15, 60),
    borderRadius: Math.min(screenWidth * 0.075, 30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Math.max(10, screenHeight * 0.012),
  },
  deleteModalTitle: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: '700',
    textAlign: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: Math.min(screenHeight * 0.01, 8),
    right: 0,
    width: Math.min(screenWidth * 0.07, 28),
    height: Math.min(screenWidth * 0.07, 28),
    borderRadius: Math.min(screenWidth * 0.035, 14),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteModalContent: {
    marginBottom: Math.max(16, screenHeight * 0.02),
  },
  deleteModalMessage: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.05, 20),
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: Math.min(screenWidth * 0.025, 10),
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: Math.max(12, screenHeight * 0.015),
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteModalCancelText: {
    fontSize: Math.min(screenWidth * 0.037, 15),
    fontWeight: '600',
  },
  deleteModalDeleteButton: {
    flex: 1,
    paddingVertical: Math.max(12, screenHeight * 0.015),
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteModalDeleteText: {
    fontSize: Math.min(screenWidth * 0.037, 15),
    fontWeight: '600',
    color: '#ffffff',
  },
  // Error Modal Styles (matching login screen)
  errorModalContainer: {
    width: Math.min(screenWidth * 0.85, 380),
    maxWidth: 380,
    borderRadius: 18,
    padding: Math.max(16, screenWidth * 0.05),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorModalHeader: {
    alignItems: 'center',
    marginBottom: Math.max(12, screenHeight * 0.015),
    position: 'relative',
  },
  errorIconContainer: {
    width: Math.min(screenWidth * 0.15, 60),
    height: Math.min(screenWidth * 0.15, 60),
    borderRadius: Math.min(screenWidth * 0.075, 30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Math.max(10, screenHeight * 0.012),
  },
  errorModalTitle: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: '700',
    textAlign: 'center',
  },
  errorModalContent: {
    marginBottom: Math.max(16, screenHeight * 0.02),
  },
  errorModalMessage: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.05, 20),
  },
  errorModalButton: {
    paddingVertical: Math.max(12, screenHeight * 0.015),
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorModalButtonText: {
    color: '#FFFFFF',
    fontSize: Math.min(screenWidth * 0.037, 15),
    fontWeight: '600',
  },
  // Payment Modal Styles
  paymentModalContainer: {
    width: Math.min(screenWidth * 0.88, 380),
    maxWidth: 380,
    borderRadius: 18,
    padding: Math.max(20, screenWidth * 0.05),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignSelf: 'center',
  },
  paymentPremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: Math.min(screenWidth * 0.03, 12),
    paddingVertical: Math.min(screenHeight * 0.008, 6),
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: Math.min(screenHeight * 0.015, 12),
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  paymentPremiumBadgeText: {
    fontSize: Math.min(screenWidth * 0.025, 10),
    fontWeight: '700',
    color: '#B8860B',
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  paymentModalHeader: {
    alignItems: 'center',
    marginBottom: Math.min(screenHeight * 0.02, 16),
  },
  paymentModalTitle: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Math.min(screenHeight * 0.008, 6),
  },
  paymentModalSubtitle: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.05, 20),
    paddingHorizontal: Math.min(screenWidth * 0.02, 8),
  },
  paymentFeaturesList: {
    marginBottom: Math.min(screenHeight * 0.02, 16),
  },
  paymentFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.min(screenHeight * 0.01, 8),
  },
  paymentFeatureText: {
    fontSize: Math.min(screenWidth * 0.033, 13),
    marginLeft: Math.min(screenWidth * 0.025, 10),
    flex: 1,
    lineHeight: Math.min(screenWidth * 0.045, 18),
  },
  paymentModalFooter: {
    flexDirection: 'row',
    gap: Math.min(screenWidth * 0.025, 10),
    alignItems: 'stretch',
    width: '100%',
  },
  paymentCancelButton: {
    flex: 1,
    paddingVertical: Math.min(screenHeight * 0.015, 12),
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  paymentCancelButtonText: {
    fontSize: Math.min(screenWidth * 0.033, 13),
    fontWeight: '600',
  },
  paymentButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    minHeight: 44,
  },
  paymentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.min(screenHeight * 0.015, 12),
    minHeight: 44,
  },
  paymentButtonIcon: {
    marginRight: Math.min(screenWidth * 0.015, 6),
  },
  paymentButtonText: {
    fontSize: Math.min(screenWidth * 0.033, 13),
    fontWeight: '700',
    color: '#ffffff',
  },
  // Lock UI Styles
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
    borderRadius: Math.max(10, responsiveSize.cardBorderRadius * 0.8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    width: '90%',
    height: '100%',
  },
  lockBusinessInfo: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
    color: '#ffffff',
  },
  lockSubText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
    color: 'rgba(255,255,255,0.85)',
  },
  activateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  activateButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  lockBadgeTopDeleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 80, 80, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 80, 80, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default BusinessProfilesScreen;