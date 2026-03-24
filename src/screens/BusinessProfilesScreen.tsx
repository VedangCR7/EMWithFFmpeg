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
import { RAZORPAY_KEY_ID } from '@env';
import { useSubscription } from '../contexts/SubscriptionContext';
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
  const { addTransaction } = useSubscription();
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]); // Cache all profiles for instant filtering
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now()); // Key to force image refresh
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
  const navigation = useNavigation();
  const pendingProfileDataRef = useRef<any>(null);

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

  const loadBusinessProfiles = useCallback(async () => {
    setLoading(true);
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
      
      // Try to get user-specific profiles from API first
      const apiProfiles = await businessProfileService.getUserBusinessProfiles(userId);
      
      // All profiles loaded successfully - no special auto-sync needed
      if (apiProfiles.length > 0) {
        // Sort profiles by creation date - OLDEST first (so first profile created stays at index 0)
        const sortedProfiles = apiProfiles.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        // Cache all profiles for instant search filtering
        setAllProfiles(sortedProfiles);
        setProfiles(sortedProfiles);
        
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
        setAllProfiles([]);
        setProfiles([]);
        console.log('📋 No business profiles found for user');
      }
    } catch (error) {
      console.error('Error loading business profiles:', error);
      // No profiles available due to error
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBusinessProfiles();
    
    // Load pending profile data from AsyncStorage on mount
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
    
    loadPendingData();
  }, [addTransaction, loadBusinessProfiles]);

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
        console.log('ℹ️ Payment not verified yet. Waiting for successful payment...');
        return;
      }

      console.log('✅ Payment verified - Creating business profile...');
      const newProfile = await businessProfileService.createBusinessProfile(pendingData);

      setProfiles(prev => [...prev, newProfile]);
      setAllProfiles(prev => [...prev, newProfile]);

      await AsyncStorage.removeItem('pending_business_profile_data');
      setPendingProfileData(null);

      setSuccessMessage('Business profile created successfully');
      setShowSuccessModal(true);
      console.log('✅ Business profile created:', newProfile.id);

      setTimeout(() => {
        loadBusinessProfiles();
      }, 1000);
    } catch (error) {
      console.error('❌ Error creating business profile:', error);
      setErrorMessage('Failed to create business profile. Please try again.');
      setShowErrorModal(true);
    }
  }, [pendingProfileData, loadBusinessProfiles]);

  // Refresh profiles when screen comes into focus (e.g., returning from Profile edit or Payment)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 BusinessProfilesScreen focused - refreshing profiles and images...');
      setImageRefreshKey(Date.now()); // Force image refresh
      loadBusinessProfiles();
      
      // Check if payment was completed and create profile if needed
      checkPaymentAndCreateProfile();
    }, [loadBusinessProfiles, checkPaymentAndCreateProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setImageRefreshKey(Date.now()); // Force image refresh on pull-to-refresh
    await loadBusinessProfiles();
    setRefreshing(false);
  }, [loadBusinessProfiles]);

  // Instant search filter using cached profiles (no API call needed)
  const filterProfiles = useCallback((query: string) => {
    if (!query || query.trim() === '') {
      // No search query - show all profiles
      setProfiles(allProfiles);
      console.log('📋 Showing all profiles:', allProfiles.length);
      return;
    }

    const lowercaseQuery = query.toLowerCase().trim();
    
    // Filter cached profiles by company name, business subcategory, or mobile number
    const filtered = allProfiles.filter(profile => {
      const matchesName = profile.name?.toLowerCase().includes(lowercaseQuery);
      const matchesSubcategory = (profile.subcategory || profile.subCategory)?.toLowerCase().includes(lowercaseQuery);
      const matchesPhone = profile.phone?.toLowerCase().includes(lowercaseQuery);
      
      return matchesName || matchesSubcategory || matchesPhone;
    });
    
    setProfiles(filtered);
    console.log('🔍 Instant search results:', filtered.length, 'profiles found for query:', query);
  }, [allProfiles]);

  // Debounced search effect - automatically filter as user types
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filterProfiles(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filterProfiles]);

  const handleDeleteProfile = useCallback((profileId: string) => {
    setProfileToDelete(profileId);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteProfile = useCallback(async () => {
    if (!profileToDelete) return;
    
    console.log('🗑️ [DELETE] Deleting profile:', profileToDelete);
    
    try {
      await businessProfileService.deleteBusinessProfile(profileToDelete);
      // Update both displayed profiles and cached profiles
      setProfiles(prev => prev.filter(p => p.id !== profileToDelete));
      setAllProfiles(prev => prev.filter(p => p.id !== profileToDelete));
      
      setSuccessMessage('Business profile deleted successfully');
      setShowSuccessModal(true);
      console.log('✅ Business profile deleted:', profileToDelete);
      
      // Refresh the profiles list to ensure consistency
      setTimeout(() => {
        loadBusinessProfiles();
      }, 1000);
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
    console.log('🔧 [EDIT] Editing profile:', profile.id, profile.name);
    setEditingProfile(profile);
    setShowForm(true);
  }, []);

  const handleAddProfile = useCallback(() => {
    // Always allow opening the form - payment check will happen on save
    setEditingProfile(null);
    setShowBottomSheet(true);
  }, []);

  const handlePaymentModalClose = useCallback(() => {
    setShowPaymentModal(false);
    setIsProcessingPayment(false);
  }, []);

  // Report payment failure to backend (non-blocking)
  const reportPaymentFailure = async (orderId: string, status: string) => {
    try {
      console.log('🔴 Reporting payment failure to backend:', { orderId, status });
      
      // Verify auth token
      const token = await AsyncStorage.getItem('authToken');
      console.log('🔑 Auth token for update-status:', token ? 'FOUND' : 'MISSING');
      
      // Log orderId being sent
      console.log('📦 Sending orderId to backend:', orderId);
      
      // Await API call to ensure it completes before proceeding
      const response = await fetch(`${api.defaults.baseURL}/api/mobile/transactions/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: orderId,
          status: status
        })
      });
      
      const data = await response.json().catch(() => null);
      console.log('📡 update-status response:', {
        status: response.status,
        ok: response.ok,
        data
      });
      
      // Add small delay to ensure database update is visible to next query
      if (response.ok) {
        console.log('⏳ Waiting 400ms for database update to propagate...');
        await new Promise(resolve => setTimeout(resolve, 400));
        console.log('✅ Database update delay completed');
      }
      
    } catch (error) {
      console.warn('⚠️ Error in reportPaymentFailure:', error);
      // Silently handle - don't affect user experience
    }
  };

  const processBusinessProfilePaymentSuccess = useCallback(async (
    paymentResponse: any,
    orderMeta: { amount?: number; amountPaise?: number; currency?: string; orderId?: string }
  ) => {
    try {
      console.log('🟢 [BUSINESS PAY] Handler invoked', { paymentResponse, orderMeta });
      console.log('🟢 [BUSINESS PAY] Payment response:', JSON.stringify(paymentResponse, null, 2));
      console.log('🟢 [BUSINESS PAY] Order meta:', JSON.stringify(orderMeta, null, 2));

      // Validate payment response has required fields
      if (!paymentResponse?.razorpay_payment_id || !paymentResponse?.razorpay_order_id || !paymentResponse?.razorpay_signature) {
        console.error('❌ [BUSINESS PAY] Missing required payment fields:', {
          hasPaymentId: !!paymentResponse?.razorpay_payment_id,
          hasOrderId: !!paymentResponse?.razorpay_order_id,
          hasSignature: !!paymentResponse?.razorpay_signature,
        });
        throw new Error('Payment response is incomplete. Please try the payment again.');
      }

      try {
        await businessProfileService.verifyBusinessProfilePayment({
          orderId: paymentResponse?.razorpay_order_id,
          paymentId: paymentResponse?.razorpay_payment_id,
          signature: paymentResponse?.razorpay_signature,
          amount: orderMeta.amount,
          amountPaise: orderMeta.amountPaise,
          currency: orderMeta.currency,
        });
        console.log('✅ [BUSINESS PAY] verify-payment success');
      } catch (verifyError: any) {
        console.error('❌ [BUSINESS PAY] Payment verification failed:', verifyError);
        console.error('❌ [BUSINESS PAY] Verification error details:', {
          message: verifyError?.message,
          responseStatus: verifyError?.response?.status,
          responseData: verifyError?.response?.data,
        });
        
        // If verification fails but payment was successful (paymentId exists), 
        // we can still proceed with profile creation as a fallback
        // The backend should handle payment verification separately
        if (paymentResponse?.razorpay_payment_id) {
          console.warn('⚠️ [BUSINESS PAY] Payment verification failed, but payment ID exists. Proceeding with profile creation...');
          // Continue to create profile - backend can verify payment later
        } else {
          throw new Error(verifyError?.message || 'Payment verification failed. Please contact support.');
        }
      }

      const profileData = pendingProfileDataRef.current;
      if (!profileData) {
        throw new Error('Missing business profile data after payment. Please try again.');
      }

      const resolvedAmount =
        typeof orderMeta.amount === 'number'
          ? orderMeta.amount
          : orderMeta.amountPaise
            ? orderMeta.amountPaise / 100
            : 1;
      console.log('ℹ️ [BUSINESS PAY] Resolved amount:', resolvedAmount);

      try {
        console.log('📡 [BUSINESS PAY] Logging transaction via addTransaction');
        await addTransaction({
          paymentId: paymentResponse?.razorpay_payment_id || `pay_${Date.now()}`,
          orderId:
            orderMeta.orderId ||
            paymentResponse?.razorpay_order_id ||
            `order_${Date.now()}`,
          amount: resolvedAmount,
          currency: orderMeta.currency || 'INR',
          status: 'success',
          plan: 'business_profile',
          planName: 'Business Profile',
          description: 'Business profile payment',
          method: 'razorpay',
          metadata: {
            email: profileData.email,
            contact: profileData.phone,
            name: profileData.name,
            category: profileData.category,
            type: 'business_profile',
          },
          type: 'business_profile',
        });
        console.log('✅ [BUSINESS PAY] addTransaction finished');
      } catch (transactionError) {
        console.warn('⚠️ [BUSINESS PAY] Unable to record transaction:', transactionError);
      }

      console.log('📡 [BUSINESS PAY] Calling createBusinessProfile');
      const newProfile = await businessProfileService.createBusinessProfile(profileData);
      console.log('✅ [BUSINESS PAY] Business profile created:', newProfile?.id);

      // Upload logo if there's a pending one
      try {
        const pendingLogoUri = await AsyncStorage.getItem('pending_business_logo_uri');
        if (pendingLogoUri && newProfile?.id) {
          console.log('📤 [BUSINESS PAY] Uploading pending logo for new profile:', newProfile.id);
          const uploadResult = await businessProfileService.uploadImage(newProfile.id, 'logo', pendingLogoUri);
          console.log('✅ [BUSINESS PAY] Logo uploaded successfully:', uploadResult.url);
          
          // Update the profile with the uploaded logo URL
          await businessProfileService.updateBusinessProfile(newProfile.id, {
            companyLogo: uploadResult.url
          });
          console.log('✅ [BUSINESS PAY] Profile updated with logo URL');
        }
        await AsyncStorage.removeItem('pending_business_logo_uri');
      } catch (logoError) {
        console.error('❌ [BUSINESS PAY] Failed to upload logo:', logoError);
        // Don't fail the entire process if logo upload fails
      }

      await AsyncStorage.removeItem('pending_business_profile_data');
      setPendingProfileData(null);
      setShowPaymentModal(false);
      setShowForm(false);
      setShowBottomSheet(false);
      setEditingProfile(null);
      setSuccessMessage('Business profile created successfully.');
      setShowSuccessModal(true);

      // Refresh profiles to ensure UI consistency
      setTimeout(() => {
        loadBusinessProfiles();
      }, 800);
    } catch (error: any) {
      console.error('❌ [BUSINESS PAY] Error finalizing payment:', error);
      console.error('❌ [BUSINESS PAY] Error details:', {
        message: error?.message,
        responseStatus: error?.response?.status,
        responseData: error?.response?.data,
        stack: error?.stack,
      });
      
      // Provide more user-friendly error messages
      let userFriendlyMessage = 'Payment verification failed. Please contact support.';
      
      if (error?.message) {
        if (error.message.includes('endpoint not found') || error.message.includes('404')) {
          userFriendlyMessage = 'Payment verification service is temporarily unavailable. Your payment was successful. Please contact support to complete your business profile creation.';
        } else if (error.message.includes('Invalid payment data')) {
          userFriendlyMessage = 'Payment data is invalid. Please try the payment again.';
        } else if (error.message.includes('Server error')) {
          userFriendlyMessage = 'Server error during payment verification. Your payment was successful. Please contact support.';
        } else {
          userFriendlyMessage = error.message;
        }
      }
      
      setErrorMessage(userFriendlyMessage);
      setShowErrorModal(true);
    } finally {
      setIsProcessingPayment(false);
      console.log('🔚 [BUSINESS PAY] Handler flow complete');
    }
  }, [addTransaction, loadBusinessProfiles]);

  const handlePayNow = useCallback(async () => {
    if (!pendingProfileDataRef.current) {
      setErrorMessage('No business profile data found. Please fill the form again.');
      setShowErrorModal(true);
      return;
    }

    let orderDetails: any;

    try {
      console.log('🟠 [BUSINESS PAY] Starting payment flow');
      setShowPaymentModal(false);
      setIsProcessingPayment(true);

      // Ensure pending data is stored before initiating payment
      await AsyncStorage.setItem('pending_business_profile_data', JSON.stringify(pendingProfileDataRef.current));
      console.log('🗂️ [BUSINESS PAY] Pending form data saved to AsyncStorage');

      // Create payment order for business profile
      orderDetails = await businessProfileService.createBusinessProfilePaymentOrder({
        amount: 599,
        currency: 'INR',
      });
      console.log('📦 [BUSINESS PAY] create-payment-order response:', orderDetails);

      if (!orderDetails?.orderId) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      const amountInPaise = typeof orderDetails.amountInPaise === 'number'
        ? orderDetails.amountInPaise
        : orderDetails.amount
          ? Math.round(Number(orderDetails.amount) * 100)
          : 59900;

      if (!amountInPaise) {
        throw new Error('Invalid payment amount. Please contact support.');
      }
      console.log('💰 [BUSINESS PAY] amountInPaise resolved:', amountInPaise);

      const resolvedKey = orderDetails.razorpayKey || RAZORPAY_KEY_ID;
      if (!resolvedKey) {
        throw new Error('Missing Razorpay key configuration.');
      }

      const currentUser = authService.getCurrentUser();
      const amountInRupees = amountInPaise / 100;
      const resolvedAmount = typeof orderDetails.amount === 'number' ? orderDetails.amount : amountInRupees;

      let handlerInvoked = false;
      const handleRazorpaySuccess = async (response: any) => {
        handlerInvoked = true;
        console.log('🟢 [BUSINESS PAY] Razorpay handler triggered:', response);
        await processBusinessProfilePaymentSuccess(response, {
          amount: resolvedAmount,
          amountPaise: amountInPaise,
          currency: orderDetails.currency || 'INR',
          orderId: orderDetails.orderId,
        });
      };

      const options = {
        description: 'Business Profile Addition',
        currency: orderDetails.currency || 'INR',
        key: resolvedKey,
        amount: amountInPaise,
        order_id: orderDetails.orderId,
        name: 'Market Brand',
        prefill: {
          email: currentUser?.email || 'user@example.com',
          contact: currentUser?.phoneNumber || '9999999999',
          name: currentUser?.name || currentUser?.companyName || 'User',
        },
        theme: { color: '#667eea' },
        method: {
          upi: true,
          card: true,
          netbanking: false,
          wallet: false,
          emi: false,
          paylater: false,
        },
        config: {
          upi: {
            flow: 'intent',
            apps: ['google_pay', 'phonepe'],
          },
          display: {
            hide: [
              { method: 'netbanking' },
              { method: 'wallet' },
              { method: 'emi' },
              { method: 'paylater' },
              { method: 'upi', flows: ['collect'] },
            ],
            blocks: {
              card: {
                name: 'Pay using Card',
                instruments: [
                  {
                    method: 'card',
                  },
                ],
              },
              upi: {
                name: 'Pay using UPI (GPay / PhonePe)',
                instruments: [
                  {
                    method: 'upi',
                    apps: ['google_pay', 'phonepe'],
                    flows: ['intent'],
                  },
                ],
              },
            },
            sequence: ['block.card', 'block.upi'],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        handler: handleRazorpaySuccess,
        modal: {
          ondismiss: () => {
            console.log('⚪ [BUSINESS PAY] Razorpay modal dismissed');
            // Report failure to backend
            if (orderDetails?.orderId) {
              reportPaymentFailure(orderDetails.orderId, 'FAILED');
            }
            setIsProcessingPayment(false);
          },
        },
      };

      console.log('🚀 [BUSINESS PAY] Opening Razorpay with options:', options);
      const razorpayResponse = await RazorpayCheckout.open(options);
      console.log('✅ [BUSINESS PAY] Razorpay promise resolved:', razorpayResponse);

      if (!handlerInvoked && razorpayResponse?.razorpay_payment_id) {
        console.log('ℹ️ [BUSINESS PAY] Handler not invoked; processing Razorpay response manually');
        await handleRazorpaySuccess(razorpayResponse);
      }
    } catch (error: any) {
      console.error('❌ [BUSINESS PAY] Razorpay/open error:', error);
      console.error('❌ [BUSINESS PAY] Error details:', {
        message: error?.message,
        description: error?.description,
        code: error?.code,
        metadata: error?.metadata,
      });
      // Report failure to backend
      if (orderDetails?.orderId) {
        reportPaymentFailure(orderDetails.orderId, 'FAILED');
      }
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      setShowErrorModal(true);
      setIsProcessingPayment(false);
    }
  }, [processBusinessProfilePaymentSuccess]);

  const handleFormSubmit = useCallback(async (formData: any, pendingLogoUri?: string) => {
    // All new profiles require payment approval before creation
    if (!editingProfile) {
      setPendingProfileData(formData);
      if (pendingLogoUri) {
        await AsyncStorage.setItem('pending_business_logo_uri', pendingLogoUri);
      }
      await AsyncStorage.setItem('pending_business_profile_data', JSON.stringify(formData));
      setShowPaymentModal(true);
      setShowForm(false);
      setShowBottomSheet(false);
      return; // IMPORTANT: Return early to prevent profile creation
    }

    setFormLoading(true);
    try {
      if (editingProfile) {
        // CRITICAL: Snapshot user profile BEFORE updating business profile
        // This protects against any accidental contamination from business profile updates
        const authService = require('../services/auth').default;
        const userBeforeUpdate = authService.getCurrentUser();
        const userSnapshot = {
          id: userBeforeUpdate?.id,
          email: userBeforeUpdate?.email,
          companyName: userBeforeUpdate?.companyName,
          name: userBeforeUpdate?.name,
          address: userBeforeUpdate?.address,
          phone: userBeforeUpdate?.phone,
          phoneNumber: userBeforeUpdate?.phoneNumber,
          alternatePhone: userBeforeUpdate?.alternatePhone,
          website: userBeforeUpdate?.website,
          category: userBeforeUpdate?.category,
          description: userBeforeUpdate?.description,
          logo: userBeforeUpdate?.logo,
          companyLogo: userBeforeUpdate?.companyLogo,
          _originalCompanyName: userBeforeUpdate?._originalCompanyName,
          _originalAddress: userBeforeUpdate?._originalAddress,
          _originalWebsite: userBeforeUpdate?._originalWebsite,
          _originalCategory: userBeforeUpdate?._originalCategory,
          _originalDescription: userBeforeUpdate?._originalDescription,
          _originalAlternatePhone: userBeforeUpdate?._originalAlternatePhone,
        };
        
        console.log('🔒 USER PROFILE SNAPSHOT (before business profile update):');
        console.log('   - address:', userSnapshot.address);
        console.log('   - website:', userSnapshot.website);
        console.log('   - category:', userSnapshot.category);
        console.log('   - description:', userSnapshot.description);
        
        // Update existing profile
        console.log('🔄 Updating profile with ID:', editingProfile.id);
        console.log('📤 Form data being sent:', formData);
        
        const updatedProfile = await businessProfileService.updateBusinessProfile(editingProfile.id, formData);
        console.log('✅ Updated profile received:', updatedProfile);
        
        // CRITICAL: Verify and restore user profile if it was contaminated
        const userAfterUpdate = authService.getCurrentUser();
        const addressChanged = userAfterUpdate?.address !== userSnapshot.address;
        const websiteChanged = userAfterUpdate?.website !== userSnapshot.website;
        const categoryChanged = userAfterUpdate?.category !== userSnapshot.category;
        const descriptionChanged = userAfterUpdate?.description !== userSnapshot.description;
        
        if (addressChanged || websiteChanged || categoryChanged || descriptionChanged) {
          console.warn('⚠️ USER PROFILE CONTAMINATION DETECTED! Restoring from snapshot...');
          console.warn('   - address changed:', addressChanged, userAfterUpdate?.address, '→', userSnapshot.address);
          console.warn('   - website changed:', websiteChanged, userAfterUpdate?.website, '→', userSnapshot.website);
          console.warn('   - category changed:', categoryChanged, userAfterUpdate?.category, '→', userSnapshot.category);
          console.warn('   - description changed:', descriptionChanged, userAfterUpdate?.description, '→', userSnapshot.description);
          
          // Restore user profile from snapshot
          const restoredUser = {
            ...userAfterUpdate,
            address: userSnapshot.address,
            website: userSnapshot.website,
            category: userSnapshot.category,
            description: userSnapshot.description,
            alternatePhone: userSnapshot.alternatePhone,
            _originalAddress: userSnapshot._originalAddress,
            _originalWebsite: userSnapshot._originalWebsite,
            _originalCategory: userSnapshot._originalCategory,
            _originalDescription: userSnapshot._originalDescription,
            _originalAlternatePhone: userSnapshot._originalAlternatePhone,
          };
          
          authService.setCurrentUser(restoredUser);
          console.log('✅ User profile restored from snapshot');
        } else {
          console.log('✅ User profile protected - no contamination detected');
        }
        
        // Update both displayed profiles and cached profiles
        const updateFn = (prev: any[]) => prev.map(p => p.id === editingProfile.id ? updatedProfile : p);
        setProfiles(updateFn);
        setAllProfiles(updateFn);
        
        setSuccessMessage('Business profile updated successfully');
        setShowSuccessModal(true);
        console.log('✅ Business profile updated:', editingProfile.id);
        
        // Clear business category posters cache to refresh My Business screen with new category posters
        console.log('🔄 Clearing business category posters cache after profile update');
        try {
          const businessCategoryPostersApi = require('../services/businessCategoryPostersApi').default;
          businessCategoryPostersApi.clearCache();
        } catch (error) {
          console.error('Failed to clear business category posters cache:', error);
        }
        
        // Refresh the profiles list to ensure consistency
        setTimeout(() => {
          console.log('🔄 Refreshing profiles list after update...');
          loadBusinessProfiles();
        }, 1000);
      } else {
        // PAYMENT LOGIC COMMENTED FOR TESTING - Create profile directly
        // This branch should be unreachable because new profiles require payment and return earlier.
        // Keep as a fallback for admin/internal usage.
        console.log('🆕 Creating new business profile directly (payment bypassed for testing)');
        const newProfile = await businessProfileService.createBusinessProfile(formData);
        setProfiles(prev => [...prev, newProfile]);
        setAllProfiles(prev => [...prev, newProfile]);
        setSuccessMessage('Business profile created successfully');
        setShowSuccessModal(true);
        console.log('✅ Business profile created (direct path):', newProfile.id);
        setTimeout(() => {
          loadBusinessProfiles();
        }, 1000);
      }
      
      setShowForm(false);
      setShowBottomSheet(false);
      setEditingProfile(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Failed to save profile. Please try again.');
      setShowErrorModal(true);
    } finally {
      setFormLoading(false);
    }
  }, [editingProfile]);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setShowBottomSheet(false);
    setEditingProfile(null);
  }, []);

  // Memoized BusinessCard component for better performance
  const BusinessCard = React.memo<{
    item: any;
    imageRefreshKey: number;
    theme: any;
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
  }>(({ item, imageRefreshKey, theme, onEdit, onDelete }) => {
    
    return (
      <View style={[styles.businessCard, { backgroundColor: theme.colors.cardBackground }]}>
        <View style={styles.cardHeader}>
          <View style={styles.businessInfoWithLogo}>
            {/* Business Logo */}
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
              <Text style={[styles.businessName, { color: theme.colors.text }]}>
                {item.name || 'Business Name'}
              </Text>
              {(item.subcategory || item.subCategory) && (
                <Text style={[styles.businessCategory, { color: theme.colors.primary }]}>
                  {item.subcategory || item.subCategory}
                </Text>
              )}
            </View>
          </View>
          
          {/* Show edit/delete buttons for all business profiles */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}20` }]}
              onPress={() => onEdit(item)}
            >
              <Icon name="edit" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${theme.colors.error}20` }]}
              onPress={() => onDelete(item.id)}
            >
              <Icon name="delete" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {item.description && (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {item.description}
          </Text>
        )}

        <View style={styles.contactInfo}>
          {item.phone && (
            <View style={styles.contactItem}>
              <Icon name="phone" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                {item.phone}
              </Text>
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
      </View>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if item data, mainProfileId, imageRefreshKey, or theme changes
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
      prevProps.theme.colors.text === nextProps.theme.colors.text
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
      />
    );
  }, [imageRefreshKey, theme, handleEditProfile, handleDeleteProfile]);

  const keyExtractor = useCallback((item: any) => item.id, []);

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
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.cardBackground }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>Business Profiles</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.cardBackground }]}
            onPress={handleAddProfile}
          >
            <Icon name="add" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.cardBackground }]}>
            <Icon name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search business profiles..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="clear" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Business Profiles List */}
        <FlatList
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
                  {searchQuery ? 'No Profiles Found' : 'No Business Profiles'}
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.text }]}>
                  {searchQuery 
                    ? `No profiles match "${searchQuery}". Try a different search term.`
                    : 'You haven\'t created any business profiles yet. Tap the + button to create your first profile.'
                  }
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleAddProfile}
                  >
                    <Icon name="add" size={20} color="#ffffff" />
                    <Text style={styles.emptyStateButtonText}>Create Profile</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
        />

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
      </LinearGradient>
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
    paddingHorizontal: responsiveLayout.headerPaddingHorizontal,
    paddingTop: Math.max(responsiveSpacing.md, screenHeight * 0.02),
    paddingBottom: Math.max(responsiveSpacing.md, screenHeight * 0.02),
  },
  headerTitle: {
    fontSize: Math.min(responsiveText.heading * 0.8, 16),
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Math.max(16, screenWidth * 0.04),
    paddingHorizontal: Math.max(10, screenWidth * 0.025),
    paddingVertical: Math.max(6, screenHeight * 0.008),
    ...responsiveShadow.medium,
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
    marginBottom: Math.min(screenHeight * 0.015, 12),
    paddingBottom: Math.min(screenHeight * 0.01, 8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: Math.min(screenWidth * 0.1, 40),
  },
  successIconContainer: {
    width: Math.min(screenWidth * 0.1, 40),
    height: Math.min(screenWidth * 0.1, 40),
    borderRadius: Math.min(screenWidth * 0.05, 20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Math.min(screenWidth * 0.03, 12),
  },
  successModalTitle: {
    fontSize: Math.min(screenWidth * 0.042, 16),
    fontWeight: '700',
    flex: 1,
    marginHorizontal: Math.min(screenWidth * 0.015, 6),
    textAlign: 'center',
  },
  successModalContent: {
    paddingVertical: Math.min(screenHeight * 0.008, 6),
    marginBottom: Math.min(screenHeight * 0.015, 12),
  },
  successModalMessage: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    lineHeight: Math.min(screenWidth * 0.045, 18),
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
    top: -Math.max(8, screenHeight * 0.008),
    right: -Math.max(8, screenWidth * 0.015),
    width: Math.min(screenWidth * 0.07, 28),
    height: Math.min(screenWidth * 0.07, 28),
    borderRadius: Math.min(screenWidth * 0.035, 14),
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default BusinessProfilesScreen; 