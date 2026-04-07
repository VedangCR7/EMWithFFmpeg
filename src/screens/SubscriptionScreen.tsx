import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
  Platform,
  ToastAndroid,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY_ID } from '@env';
import { getProductionRazorpayKey, RAZORPAY_CONFIG } from '../config/razorpayConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentErrorModal from '../components/PaymentErrorModal';
import PlanCard from '../components/PlanCard';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useBusinessProfile } from '../context/BusinessProfileContext';
import subscriptionApi, { SubscriptionPlan, SubscriptionStatus } from '../services/subscriptionApi';
import authService from '../services/auth';
import api from '../services/api';
import cacheService from '../services/cacheService';
import { startSubscriptionPolling } from '../utils/subscriptionPolling';
import { getAccessState, isAccessGranted, getAccessStateMessage, isTransitionalState } from '../utils/subscriptionAccess';

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

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // DYNAMIC TITLE: Check if navigation is from business profile lock screen
  const source = (route.params as any)?.source;
  const businessProfileId = (route.params as any)?.businessProfileId;
  console.log('🔍 SUBSCRIPTION SCREEN - Route params:', route.params);
  console.log('🔍 SUBSCRIPTION SCREEN - Source:', source);
  console.log('🔍 SUBSCRIPTION SCREEN - Business Profile ID:', businessProfileId);
  const screenTitle = source === 'BUSINESS_PROFILE_REQUIRED' ? 'Activate Business Plan' : 'Upgrade to Pro';
  console.log('🔍 SUBSCRIPTION SCREEN - Screen title:', screenTitle);
  
  const { isSubscribed, subscriptionStatus: contextSubscriptionStatus, plans: contextPlans, refreshSubscription, refreshPlans, addTransaction, setIsSubscribed, transactionStats, isLoading, autopayState, enableAutopay, disableAutopay, refreshAutopayStatus, setPaymentInProgress } = useSubscription();
  const { setActivationPending, clearActivationPending, isActivationPending: isProfileActivationPending } = useBusinessProfile();
  
  // Business profile subscription state
  const [businessSubscriptionStatus, setBusinessSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isBusinessSubscriptionLoading, setIsBusinessSubscriptionLoading] = useState(false);
  
  // FRONTEND-ONLY: Remove local activation pending state - use only context
  // const [isActivationPending, setIsActivationPending] = useState(false); // REMOVED
  
  // Determine if we're in business profile mode - OPTIMIZED (removed heavy logging)
  const isBusinessProfileMode = !!businessProfileId;
  
  // Memoize business profile object to prevent re-renders
  const effectiveBusinessProfile = useMemo(() => businessProfileId 
    ? { id: businessProfileId, name: 'Business Profile', subscriptionStatus: businessSubscriptionStatus?.status || 'INACTIVE' }
    : null, [businessProfileId, businessSubscriptionStatus?.status]);
  
  const { theme } = useTheme();

  // BUSINESS PROFILE SUBSCRIPTION LOGIC: Use unified access state - OPTIMIZED
  const accessState = getAccessState({
    businessProfile: effectiveBusinessProfile,
    isSubscribed,
  });
  const hasAccess = isAccessGranted(accessState);
  const effectiveSubscriptionStatus = isBusinessProfileMode ? businessSubscriptionStatus : contextSubscriptionStatus;
  const effectiveIsLoading = isBusinessProfileMode ? isBusinessSubscriptionLoading : isLoading;

  // Detect payment success from multiple sources
  const isPaymentSuccess = (route.params as any)?.paymentSuccess === true;
  const isActivationPendingState = isProfileActivationPending(businessProfileId);
  
  // Strong trigger: Show message if any payment completion indicator is true
  const shouldShowProcessingMessage = isPaymentSuccess || isActivationPendingState;
  
  // ULTIMATE TRIGGER: Also show if screen loads with PENDING status (strong payment indicator)
  const [hasLoadedWithPending, setHasLoadedWithPending] = useState(false);

  // Detect when screen loads with PENDING status - OPTIMIZED
  useEffect(() => {
    if (effectiveSubscriptionStatus?.status?.toUpperCase() === "PENDING") {
      setHasLoadedWithPending(true);
    } else {
      setHasLoadedWithPending(false);
    }
  }, [effectiveSubscriptionStatus?.status]);

  // FAILSAFE: Force show for business profiles with PENDING status
  const isBusinessProfileWithPending = useMemo(() => 
    isBusinessProfileMode && effectiveSubscriptionStatus?.status?.toUpperCase() === "PENDING",
    [isBusinessProfileMode, effectiveSubscriptionStatus?.status]
  );

  // Memoize computed states to prevent re-renders
  const ultimateTrigger = useMemo(() => {
    const trigger = shouldShowProcessingMessage || hasLoadedWithPending || isBusinessProfileWithPending;
    return trigger;
  }, [shouldShowProcessingMessage, hasLoadedWithPending, isBusinessProfileWithPending]);

  const finalTrigger = useMemo(() => {
    const trigger = isPaymentSuccess || isActivationPendingState || hasLoadedWithPending;
    return trigger;
  }, [isPaymentSuccess, isActivationPendingState, hasLoadedWithPending]);

  // Validate with backend - OPTIMIZED (removed heavy logging)
  useEffect(() => {
    if (!ultimateTrigger) {
      setShowProcessingMessage(false);
      setDisableSubscribeButton(false);
      return;
    }

    if (effectiveSubscriptionStatus?.status?.toUpperCase() === "PENDING") {
      setShowProcessingMessage(true);
      setDisableSubscribeButton(true);
    } else {
      setShowProcessingMessage(false);
      setDisableSubscribeButton(false);
    }
  }, [effectiveSubscriptionStatus?.status, ultimateTrigger, businessProfileId, isPaymentSuccess, isActivationPendingState, hasLoadedWithPending, shouldShowProcessingMessage, finalTrigger, isBusinessProfileWithPending]);

  // Dynamic dimensions for responsive layout (matching HomeScreen)
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Update dimensions on screen rotation/resize - OPTIMIZED
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    dimensionsSubscriptionRef.current = subscription;

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const currentScreenWidth = dimensions.width;
  const currentScreenHeight = dimensions.height;

  // Dynamic responsive scaling functions
  const dynamicScale = (size: number) => (currentScreenWidth / 375) * size;
  const dynamicVerticalScale = (size: number) => (currentScreenHeight / 667) * size;
  const dynamicModerateScale = (size: number, factor = 0.5) => size + (dynamicScale(size) - size) * factor;

  // Responsive icon sizes (compact - 60% of original, slightly larger for small screens)
  const getIconSize = (baseSize: number) => {
    const isCurrentlySmall = currentScreenWidth < 375;
    const multiplier = isCurrentlySmall ? 0.75 : 0.6; // Increased from 0.6 to 0.75 for small screens
    return Math.max(10, Math.round(baseSize * (currentScreenWidth / 375) * multiplier));
  };

  // Device size detection (matching TransactionHistoryScreen)
  const isUltraSmallScreen = currentScreenWidth < 350;
  const isSmallScreenDevice = currentScreenWidth < 400;
  const isMediumScreenDevice = currentScreenWidth >= 400 && currentScreenWidth < 768;
  const isTabletDevice = currentScreenWidth >= 768;
  const isLandscapeMode = currentScreenWidth > currentScreenHeight;

  // Responsive layout configurations
  const getComparisonCardLayout = () => {
    if (isTabletDevice) return 'row'; // Side by side on tablets
    if (isLandscapeMode && isMediumScreenDevice) return 'row'; // Side by side in landscape on medium devices
    return 'column'; // Stack vertically on phones
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorModalData, setErrorModalData] = useState({
    title: '',
    message: '',
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentInProgress, setPaymentInProgressState] = useState(false);
  
  // Enhanced payment states for better UX
  const [isAuthenticating, setIsAuthenticating] = useState(false); // During Razorpay checkout
  const [isTransactionPending, setIsTransactionPending] = useState(false); // Post-payment, pre-activation
  const [pollingAttempts, setPollingAttempts] = useState(0);
  
  // TEMPORARY DEBUG: Force show message for testing
  const [debugForceShow, setDebugForceShow] = useState(false);

  // State for showing processing message after successful payment
  const [showProcessingMessage, setShowProcessingMessage] = useState(false);
  const [disableSubscribeButton, setDisableSubscribeButton] = useState(false);
  
  // Performance optimization: Flag to control post-payment flow
  const [isReturningFromPayment, setIsReturningFromPayment] = useState(false);

  // Cleanup polling and event listeners on unmount
  useEffect(() => {
    return () => {
      // Cleanup polling
      if (pollingCleanupRef.current) {
        pollingCleanupRef.current();
        pollingCleanupRef.current = null;
      }
      
      // Cleanup any pending timers
      if (dimensionsSubscriptionRef.current) {
        dimensionsSubscriptionRef.current.remove();
        dimensionsSubscriptionRef.current = null;
      }
    };
  }, []);

  // Ref for dimensions subscription
  const dimensionsSubscriptionRef = useRef<any>(null);

  const pollingCleanupRef = useRef<(() => void) | null>(null);

  // Wrapper to update both local and context payment states
  const updatePaymentInProgress = useCallback((inProgress: boolean) => {
    setPaymentInProgressState(inProgress);
    setPaymentInProgress(inProgress);
    console.log(`🔒 PAYMENT LOCK: ${inProgress ? 'ENGAGED' : 'RELEASED'}`);
    
    // Reset all enhanced states when payment is not in progress
    if (!inProgress) {
      setIsAuthenticating(false);
      setIsTransactionPending(false);
      setPollingAttempts(0);
    }
  }, [setPaymentInProgress]);

  // Memoize purchasable plans to prevent recalculation
  const purchasablePlans = useMemo(() => 
    contextPlans.filter(plan => plan.name !== "PROMO"), 
    [contextPlans]
  );

  // Detect number of plans for layout adjustments
  const planCount = purchasablePlans.length;
  const isSinglePlan = planCount === 1;

  // Use API plan data from context, always render plans regardless of subscription status
  const getSelectedPlan = () => {
    if (!selectedPlanId) return null;
    return purchasablePlans.find(plan => plan.id === selectedPlanId);
  };

  const selectedPlan = getSelectedPlan();
  const defaultPlan = purchasablePlans.length > 0 ? purchasablePlans[0] : null;

  const isStatusActive = (status: any) => {
    if (!status) {
      console.log('[APP] ❌ Status is null');
      return false;
    }

    console.log('[APP] 🔍 Raw status object:', status);

    // PRIMARY condition: Use subscriptionStatus field
    const subscriptionStatus = status.subscriptionStatus || status.status;
    if (subscriptionStatus?.toUpperCase() === 'ACTIVE') {
      console.log('[APP] ✅ Active via subscriptionStatus');
      return true;
    }

    console.log('[APP] ❌ Not active');
    return false;
  };

  // Fetch business profile subscription status - OPTIMIZED
  const fetchBusinessSubscriptionStatus = useCallback(async () => {
    if (!businessProfileId) return;
    
    setIsBusinessSubscriptionLoading(true);
    try {
      const response = await subscriptionApi.getBusinessProfileSubscriptionStatus(businessProfileId);
      
      if (response.success && response.data) {
        setBusinessSubscriptionStatus(response.data);
      } else {
        setBusinessSubscriptionStatus({
          isActive: false,
          status: 'inactive',
          planId: undefined,
          planName: undefined,
          expiryDate: undefined,
          autoRenew: false,
        });
      }
    } catch (error) {
      console.error('❌ Error fetching business subscription status:', error);
      setBusinessSubscriptionStatus({
        isActive: false,
        status: 'inactive',
        planId: undefined,
        planName: undefined,
        expiryDate: undefined,
        autoRenew: false,
      });
    } finally {
      setIsBusinessSubscriptionLoading(false);
    }
  }, [businessProfileId]);

  // Optimized useFocusEffect with single source of truth and payment return guard
  useFocusEffect(
    useCallback(() => {
      // Don't refresh subscription if payment is in progress
      if (paymentInProgress) {
        return;
      }

      // Skip API calls when returning from payment to prevent duplicates
      if (isReturningFromPayment) {
        setIsReturningFromPayment(false); // Reset flag after skipping once
        return;
      }

      // Reset states when business profile changes
      if (isBusinessProfileMode && businessProfileId) {
        setBusinessSubscriptionStatus(null);
        setIsBusinessSubscriptionLoading(false);
      }

      // SINGLE SOURCE OF TRUTH: Only call fetchBusinessSubscriptionStatus
      if (isBusinessProfileMode) {
        fetchBusinessSubscriptionStatus();
        
        // Only load plans if they're empty
        if (contextPlans.length === 0) {
          refreshPlans();
        }
      } else {
        // User mode: Minimal API calls
        // NOTE: refreshSubscription() disabled to prevent duplicate calls
        // Only call plans if empty
        if (contextPlans.length === 0) {
          refreshPlans();
        }
      }

      // Set default selected plan when plans load
      if (!selectedPlanId && purchasablePlans.length > 0) {
        setSelectedPlanId(purchasablePlans[0].id);
      }
    }, [isBusinessProfileMode, businessProfileId, fetchBusinessSubscriptionStatus, refreshPlans, selectedPlanId, purchasablePlans, paymentInProgress, isReturningFromPayment])
  );

  // Helper function to show error modal - OPTIMIZED with useCallback
  const showErrorModal = useCallback((title: string, message: string) => {
    setErrorModalData({ title, message });
    setIsErrorModalVisible(true);
  }, []);

  // Handle plan selection
  const handlePlanSelect = (plan: any) => {
    setSelectedPlanId(plan.id);
  };

  // Report payment failure to backend (non-blocking)
  const reportPaymentFailure = async (orderId: string, status: string) => {
    try {
      console.log('🔴 Reporting payment failure to backend:', { orderId, status });

      // Verify auth token
      const token = await AsyncStorage.getItem('authToken');
      console.log('🔑 Auth token for update-status:', token ? 'FOUND' : 'MISSING');

      // Log orderId being sent
      console.log('📦 Sending orderId to backend:', orderId);

      // Await the API call to ensure it completes before proceeding
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

  // Optimized polling mechanism for transaction pending state (5-6 minutes interval)
  const pollSubscriptionStatus = useCallback(async (maxAttempts = 3, interval = 300000) => {
    console.log(`⏳ Starting optimized subscription polling - max attempts: ${maxAttempts}, interval: ${interval}ms (${interval/60000} minutes)`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 Polling attempt ${attempt}/${maxAttempts}`);
        setPollingAttempts(attempt);
        
        // SINGLE SOURCE OF TRUTH: Only call fetchBusinessSubscriptionStatus
        if (isBusinessProfileMode) {
          await fetchBusinessSubscriptionStatus();
        } else {
          // For user mode, minimal refresh
          await refreshSubscription(true);
        }
        
        // Check if subscription is now active
        const currentUser = authService.getCurrentUser();
        if (currentUser?.id) {
          const isActive = isStatusActive(effectiveSubscriptionStatus);
          
          console.log(`📊 Polling result - Attempt ${attempt}: isActive=${isActive}`);
          
          if (isActive) {
            console.log('✅ Subscription activated! Stopping polling.');
            setIsSubscribed(true);
            setIsTransactionPending(false);
            updatePaymentInProgress(false);
            
            // Show success message
            if (Platform.OS === 'android') {
              ToastAndroid.show('🎉 Payment successful! Welcome to Pro!', ToastAndroid.LONG);
            } else {
              Alert.alert('🎉 Success', 'Payment successful! Welcome to Pro!');
            }
            
            return true; // Success
          }
        }
        
        // Wait before next attempt (except for last attempt)
        if (attempt < maxAttempts) {
          console.log(`⏳ Waiting ${interval}ms (${interval/60000} minutes) before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, interval));
        }
        
      } catch (error) {
        console.error(`❌ Polling attempt ${attempt} failed:`, error);
      }
    }
    
    console.log(`⏱️ Optimized polling completed after ${maxAttempts} attempts - subscription not activated`);
    return false; // Failed to activate
  }, [refreshSubscription, setIsSubscribed, updatePaymentInProgress, isBusinessProfileMode, fetchBusinessSubscriptionStatus, effectiveSubscriptionStatus]);

  // Handle payment with Razorpay
  const handlePayment = async () => {
    if (paymentInProgress) {
      console.log('Payment already in progress, ignoring duplicate click');
      return;
    }

    if (isSubscribed) {
      showErrorModal('Already Subscribed', 'You are already a Pro subscriber!');
      return;
    }

    // Stop existing polling before starting a new payment flow
    if (pollingCleanupRef.current) {
      pollingCleanupRef.current();
      pollingCleanupRef.current = null;
    }

    updatePaymentInProgress(true);
    setIsProcessing(true);
    setIsAuthenticating(true); // Start authenticating state

    const currentUser = authService.getCurrentUser();
    let amountInPaise = 100;
    let amountInRupees = 1;
    let orderDetails: any;

    try {
      // Validate Razorpay configuration
      if (!selectedPlan) {
        throw new Error('No plan selected');
      }

      // Validate plan ID exists and is from API
      if (!selectedPlan.id) {
        throw new Error('Invalid plan selected - missing plan ID');
      }

      // Verify plan exists in purchasable plans list
      const isValidPlan = purchasablePlans.some(plan => plan.id === selectedPlan.id);
      if (!isValidPlan) {
        throw new Error('Invalid plan selected - plan not found in available plans');
      }

      console.log('🚀 Starting payment process...');
      console.log('📋 Selected plan:', selectedPlan);
      console.log('👤 Current user:', currentUser);
      console.log('✅ Plan validation passed - Plan ID:', selectedPlan.id);

      const planPriceFromApi = selectedPlan.price;
      const uiPriceCandidateRaw = Number(String(selectedPlan.price).replace(/[^\d.]/g, ''));
      const uiPriceCandidate =
        Number.isFinite(uiPriceCandidateRaw) && uiPriceCandidateRaw > 0 ? uiPriceCandidateRaw : NaN;

      // Use actual plan price from API
      const normalizedPlanAmountRupees = planPriceFromApi;

      // Create payment order with backend to obtain order ID and amount
      orderDetails = await subscriptionApi.createPaymentOrder({
        planId: selectedPlan.id,
        currency: 'INR',
        ...(isBusinessProfileMode && businessProfileId && { businessProfileId }),
      });

      if (!orderDetails?.orderId) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      console.log('📦 Order details from backend:', {
        orderId: orderDetails.orderId,
        amount: orderDetails.amount,
        amountInPaise: orderDetails.amountInPaise,
        currency: orderDetails.currency,
        razorpayKey: orderDetails.razorpayKey,
        fallbackKey: RAZORPAY_KEY_ID,
      });

      const backendAmountInPaise =
        typeof orderDetails.amountInPaise === 'number'
          ? orderDetails.amountInPaise
          : typeof orderDetails.amountInPaise === 'string'
            ? Number(orderDetails.amountInPaise)
            : NaN;

      if (Number.isFinite(backendAmountInPaise) && backendAmountInPaise > 0) {
        amountInPaise = Math.round(backendAmountInPaise);
        amountInRupees = amountInPaise / 100;
      } else {
        const orderAmountRaw =
          typeof orderDetails.amount === 'number'
            ? orderDetails.amount
            : typeof orderDetails.amount === 'string'
              ? Number(orderDetails.amount)
              : NaN;

        const normalizedOrderAmount =
          Number.isFinite(orderAmountRaw) && orderAmountRaw > 0
            ? orderAmountRaw
            : normalizedPlanAmountRupees;

        amountInRupees = normalizedOrderAmount;
        amountInPaise = Math.round(amountInRupees * 100);
      }

      const resolvedKey = orderDetails.razorpayKey || getProductionRazorpayKey();

      if (!resolvedKey) {
        console.error('❌ Razorpay configuration is invalid. Please check your environment variables.');
        throw new Error('Payment service configuration error. Please contact support.');
      }

      // Log configuration status for debugging
      console.log('💳 Razorpay Config:', {
        environment: RAZORPAY_CONFIG.environment,
        isValid: RAZORPAY_CONFIG.isValid,
        isTestMode: RAZORPAY_CONFIG.isTestMode
      });

      // Real Razorpay integration
      const options = {
        description: `${selectedPlan.name} Subscription`,
        currency: 'INR',
        key: resolvedKey,
        amount: amountInPaise,
        order_id: orderDetails.orderId,
        name: 'Market Brand',
        // TO DISPLAY LOGO: Razorpay requires a publicly accessible URL
        // Option 1: Upload MB.png to your website/server and use:
        // image: 'https://your-domain.com/MB.png',
        // 
        // Option 2: Use a CDN (Cloudinary, AWS S3, Firebase Storage)
        // Example: image: 'https://res.cloudinary.com/your-account/image/upload/v1/MB.png',
        // 
        // Option 3: Use base64 data URL (may have size limits):
        // image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        prefill: {
          email: currentUser?.email || 'user@example.com',
          contact: currentUser?.phoneNumber || '9999999999',
          name: currentUser?.name || 'User Name',
        },
        theme: { color: '#667eea' },
        // Restrict payment methods to GPay and PhonePe (UPI intent apps only)
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
              { method: 'card' },
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
                name: 'Pay using UPI Apps',
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
        handler: async (response: any) => {
          console.log('💳 Payment success response:', response);

          try {
            // Transition to transaction pending state immediately after payment success
            setIsTransactionPending(true);
            setIsAuthenticating(false);
            
            // Get current user for transaction metadata
            const currentUserForTransaction = authService.getCurrentUser();

            // Backend creates transactions during verify-payment
            console.log('📝 Backend will create transaction during verify-payment...');

            // Verify payment with backend and activate subscription
            console.log('🔄 Activating subscription...');

            const currency = 'INR';

            // Step 1: Verify payment first
            console.log('🔍 DEBUG: About to verify payment with params:', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              amountInRupees,
              amountInPaise,
              planId: selectedPlan.id,
              isBusinessProfileMode,
              businessProfileId
            });
            
            const verifyResult = await subscriptionApi.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: amountInRupees,
              amountPaise: amountInPaise,
              currency,
              planId: selectedPlan.id,
              email: currentUserForTransaction?.email,
              contact: currentUserForTransaction?.phoneNumber,
              ...(isBusinessProfileMode && businessProfileId && { businessProfileId }),
            });
            console.log('✅ PAYMENT_SUCCESS - Payment verified:', verifyResult);
            console.log('🔍 DEBUG: verifyResult.success =', verifyResult?.success);

            // Step 2: Clear subscription cache immediately
            const currentUserForCache = authService.getCurrentUser();
            const userId = currentUserForCache?.id;
            if (userId) {
              await cacheService.clear(`subscription_status_${userId}`);
              console.log('🗑️ Subscription cache cleared for user:', userId);
            }

            // Step 2.5: Refresh business profile after payment success
            if (isBusinessProfileMode && businessProfileId) {
              console.log('🔄 Refreshing business profile after payment success:', businessProfileId);
              try {
                // Use business profile service to refresh the specific profile
                const refreshedProfile = await businessProfileService.getBusinessProfileById(businessProfileId);
                if (refreshedProfile) {
                  console.log('✅ Business profile refreshed with new status:', refreshedProfile.subscriptionStatus);
                }
              } catch (error) {
                console.error('❌ Error refreshing business profile after payment:', error);
              }
            }

            // Step 3: Start polling for subscription activation instead of immediate check
            if (verifyResult?.success) {
              console.log('[APP] ✅ Payment verified, setting activation pending state (24-hour window)');
              console.log('🔍 DEBUG: isBusinessProfileMode:', isBusinessProfileMode);
              console.log('🔍 DEBUG: businessProfileId:', businessProfileId);
              console.log('🔍 DEBUG: verifyResult:', verifyResult);
              
              // CRITICAL FIX: Set activation pending instead of immediate activation
              if (isBusinessProfileMode && businessProfileId) {
                // Use only context state - remove local state
                console.log('🔍 DEBUG: About to set activation pending for:', businessProfileId);
                setActivationPending(businessProfileId, true);
                console.log('🏢 Business profile activation pending for 24 hours:', businessProfileId);
                
                // Show appropriate message for business profile
                Alert.alert(
                  'Payment Successful',
                  'Your business profile will be activated within 24 hours.',
                  [{ text: 'OK', onPress: () => {} }] // Remove immediate navigation
                );
                
                // Clear payment states
                setIsTransactionPending(false);
                updatePaymentInProgress(false);
                
                // CRITICAL FIX: Add delay to ensure context state propagates before navigation
                setTimeout(() => {
                  console.log('🔍 DEBUG: Navigation after delay, checking activation pending state...');
                  const isStillPending = isProfileActivationPending(businessProfileId);
                  console.log('🔍 DEBUG: Activation pending state before navigation:', isStillPending);
                  console.log('[NAVIGATION FLOW]', {
                    source: (route.params as any)?.source,
                    action: 'POST_PAYMENT_REDIRECT',
                    isBusinessProfileMode,
                    businessProfileId
                  });

                  // Navigate based on source
                  if ((route.params as any)?.source === 'BUSINESS_PROFILE') {
                    console.log('✅ [NAVIGATION FLOW] Redirecting to BusinessProfilesScreen after payment success');
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'BusinessProfiles' as any }],
                    });
                  } else {
                    console.log('✅ [NAVIGATION FLOW] Staying on SubscriptionScreen for regular subscription');
                    (navigation as any).navigate('SubscriptionScreen', { paymentSuccess: true });
                  }
                }, 300); // Increased delay for better reliability
              } else {
                console.log('🔍 DEBUG: Not in business profile mode or missing businessProfileId');
                console.log('🔍 DEBUG: isBusinessProfileMode =', isBusinessProfileMode);
                console.log('🔍 DEBUG: businessProfileId =', businessProfileId);
                
                // User subscription: Use existing polling logic
                pollingCleanupRef.current = startSubscriptionPolling(
                  () => {
                    // onActive: Subscription is now active!
                    console.log('✅ User subscription activated via polling!');
                    setIsSubscribed(true);
                    setIsTransactionPending(false);
                    updatePaymentInProgress(false);
                    
                    if (Platform.OS === 'android') {
                      ToastAndroid.show('🎉 Subscription activated! Welcome to Pro!', ToastAndroid.LONG);
                    }
                    
                    // Final refresh of context to ensure everything is updated
                    refreshSubscription(true);
                    
                    // Close screen once active
                    navigation.goBack();
                  },
                  () => {
                    // onTimeout: 5 minutes passed
                    console.warn('⚠️ Polling timed out - subscription not yet activated');
                    setIsTransactionPending(false);
                    updatePaymentInProgress(false);
                    
                    Alert.alert(
                      'Processing Payment',
                      'Your payment was successful! Subscription activation may take a few moments. Please check your status after a short while.',
                      [{ text: 'OK', onPress: () => navigation.goBack() }]
                    );
                  }
                );
              }
            } else {
              console.warn('[APP] ⚠️ Payment verification failed');
              setIsTransactionPending(false);
              updatePaymentInProgress(false);
              showErrorModal('Payment Verification Failed', 'Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('❌ Error processing successful payment:', error);
            updatePaymentInProgress(false);
            showErrorModal('Payment Processing Error', 'Payment was successful but there was an error activating your subscription. Please contact support or refresh the app.');
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            updatePaymentInProgress(false);
            // CRITICAL FIX: Clear activation pending state on modal dismiss
            if (isBusinessProfileMode) {
              clearActivationPending(businessProfileId);
            }
          },
        },
      };

      console.log('💳 Opening Razorpay with options:', options);
      console.log('🧾 Razorpay checkout payload:', JSON.stringify(options, null, 2));
      
      // Transition from authenticating to normal processing during checkout
      setIsAuthenticating(false);
      
      const data = await RazorpayCheckout.open(options);
      console.log('📦 Payment data received:', JSON.stringify(data, null, 2));

      // If payment succeeds but handler wasn't called (uncommon scenario)
      // Only activate if we have a valid payment_id AND it's a successful payment
      if (data && data.razorpay_payment_id && data.razorpay_order_id && !isSubscribed) {
        console.log('⚠️ Payment succeeded but handler not called, activating manually...');
        try {
          await options.handler?.(data);
        } catch (handlerError) {
          console.error('❌ Handler error:', handlerError);
          throw handlerError; // Re-throw to ensure error is handled properly
        }
      }
    } catch (error: any) {
      console.error('Payment error object (raw):', error);
      try {
        const parsed = typeof error.description === 'string' ? JSON.parse(error.description) : null;
        if (parsed?.error) {
          console.error('🔍 Parsed Razorpay error:', parsed.error);
        }
      } catch (parseErr) {
        console.warn('Unable to parse Razorpay error description:', parseErr);
      }
      console.error('Error details:', {
        code: error.code,
        description: error.description,
        source: error.source,
        step: error.step,
        reason: error.reason
      });
      // Report failure to backend for analytics
      if (orderDetails?.orderId) {
        reportPaymentFailure(orderDetails.orderId, 'FAILED');
      }

      if (error.code === 'PAYMENT_CANCELLED') {
        // CRITICAL FIX: Clear activation pending state on payment cancellation
        if (isBusinessProfileMode) {
          clearActivationPending(businessProfileId);
        }
        showErrorModal('Payment Cancelled', 'Payment was cancelled by user.');
      } else if (error.code === 'NETWORK_ERROR') {
        // CRITICAL FIX: Clear activation pending state on network error
        if (isBusinessProfileMode) {
          clearActivationPending(businessProfileId);
        }
        showErrorModal('Network Error', 'Please check your internet connection and try again.');
      } else if (error.code === 'INVALID_OPTIONS') {
        // CRITICAL FIX: Clear activation pending state on configuration error
        if (isBusinessProfileMode) {
          clearActivationPending(businessProfileId);
        }
        showErrorModal('Configuration Error', 'Payment configuration is invalid. Please contact support.');
      } else {
        // CRITICAL FIX: Clear activation pending state on general payment failure
        if (isBusinessProfileMode) {
          clearActivationPending(businessProfileId);
        }
        showErrorModal('Payment Failed', 'Something went wrong with the payment. Please try again.');
      }
    } finally {
      setIsProcessing(false);
      updatePaymentInProgress(false);
    }
  };

  // Memoize Razorpay options creation to prevent performance issues
  const createRazorpayOptions = useCallback((razorpayKey: string, subscriptionId: string, selectedPlan: any, currentUser: any, isBusinessProfileMode: boolean, businessProfileId?: string) => {
    return {
      key: razorpayKey,
      subscription_id: subscriptionId,
      recurring: true,
      amount: (selectedPlan.price || selectedPlan.amount || 99) * 100,
      currency: 'INR',
      name: 'Market Brand',
      description: `${selectedPlan.name} Subscription`,
      prefill: {
        email: currentUser?.email || 'user@example.com',
        contact: currentUser?.phoneNumber || '9999999999',
        name: currentUser?.name || 'User Name',
      },
      theme: { color: '#667eea' },
      handler: async (response: any) => {
        // Payment success handler - OPTIMIZED
        try {
          setIsTransactionPending(true);
          setIsAuthenticating(false);
          
          if (!response.razorpay_payment_id || !response.razorpay_subscription_id) {
            throw new Error('Invalid payment response');
          }

          const currentUserForTransaction = authService.getCurrentUser();

          // Step 1: Verify payment with backend first
          const verifyResult = await subscriptionApi.verifyPayment({
            orderId: response.razorpay_order_id || response.razorpay_subscription_id,
            subscriptionId: response.razorpay_subscription_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            amount: selectedPlan.price || selectedPlan.amount || 99,
            amountPaise: (selectedPlan.price || selectedPlan.amount || 99) * 100,
            currency: 'INR',
            planId: selectedPlan.id,
            email: currentUserForTransaction?.email,
            contact: currentUserForTransaction?.phoneNumber,
            isAutopay: true
          });

          // Step 2: Clear subscription cache immediately
          const currentUserForCache = authService.getCurrentUser();
          const userId = currentUserForCache?.id;
          if (userId) {
            if (isBusinessProfileMode && businessProfileId) {
              await cacheService.clear(`subscription_status_profile_${businessProfileId}`);
            } else {
              await cacheService.clear(`subscription_status_${userId}`);
            }
          }

          // Step 3: Handle activation based on verification result
          if (verifyResult?.success) {
            if (isBusinessProfileMode && businessProfileId) {
              setActivationPending(businessProfileId, true);
              
              Alert.alert(
                'Payment Successful',
                'Your business profile will be activated within 24 hours.',
                [{ text: 'OK', onPress: () => {} }]
              );
              
              setIsTransactionPending(false);
              updatePaymentInProgress(false);
              
              // NON-BLOCKING: Navigate after delay
              setTimeout(() => {
                setIsReturningFromPayment(true); // Set flag to prevent duplicate API calls
                console.log('[NAVIGATION FLOW]', {
                  source: (route.params as any)?.source,
                  action: 'POST_PAYMENT_REDIRECT',
                  isBusinessProfileMode,
                  businessProfileId
                });

                // Navigate based on source
                if ((route.params as any)?.source === 'BUSINESS_PROFILE') {
                  console.log('✅ [NAVIGATION FLOW] Redirecting to BusinessProfilesScreen after autopay success');
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'BusinessProfiles' as any }],
                  });
                } else {
                  console.log('✅ [NAVIGATION FLOW] Staying on SubscriptionScreen for autopay');
                  (navigation as any).navigate('SubscriptionScreen', { paymentSuccess: true });
                }
              }, 300);
            } else {
              // User subscription: Use optimized polling
              pollingCleanupRef.current = startSubscriptionPolling(
                () => {
                  setIsSubscribed(true);
                  setIsTransactionPending(false);
                  updatePaymentInProgress(false);
                  
                  if (Platform.OS === 'android') {
                    ToastAndroid.show('🎉 Mandate approved! Welcome to Pro!', ToastAndroid.LONG);
                  }
                  
                  // NON-BLOCKING: Close screen
                  InteractionManager.runAfterInteractions(() => {
                    navigation.goBack();
                  });
                },
                () => {
                  setIsTransactionPending(false);
                  updatePaymentInProgress(false);
                  
                  Alert.alert(
                    'Processing Mandate',
                    'Your mandate was approved! Subscription activation may take a few moments.',
                    [{ text: 'OK', onPress: () => InteractionManager.runAfterInteractions(() => navigation.goBack()) }]
                  );
                }
              );
            }
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error) {
          console.error('❌ Error processing Autopay response:', error);
          if (isBusinessProfileMode && businessProfileId) {
            clearActivationPending(businessProfileId!);
          }
          updatePaymentInProgress(false);
          showErrorModal('Payment Processing Error', 'Payment was successful but there was an error activating your subscription.');
        }
      },
      modal: {
        ondismiss: () => {
          console.log('🚪 Razorpay modal dismissed');
          setIsProcessing(false);
          updatePaymentInProgress(false);
          if (isBusinessProfileMode && businessProfileId) {
            clearActivationPending(businessProfileId!);
          }
        },
      },
    };
  }, [setIsTransactionPending, setIsAuthenticating, setIsSubscribed, updatePaymentInProgress, setActivationPending, clearActivationPending, navigation, setIsReturningFromPayment, showErrorModal]);

  // Handle Autopay payment - OPTIMIZED for instant response
  const handleAutopayPayment = useCallback(async () => {
    // Double safety check - prevent action if button is disabled
    if (disableSubscribeButton) {
      console.log('� Button disabled due to processing state, ignoring click');
      return;
    }
    
    // IMMEDIATE: Show loader without any blocking operations
    if (paymentInProgress) {
      console.log('Payment already in progress, ignoring duplicate click');
      return;
    }

    if (hasAccess) {
      const errorMessage = isBusinessProfileMode 
        ? 'This business profile already has an active subscription!'
        : 'You are already a Pro subscriber!';
      showErrorModal('Already Subscribed', errorMessage);
      return;
    }

    // CRITICAL: Check if plan is selected before proceeding
    if (!selectedPlan) {
      showErrorModal('No Plan Selected', 'Please select a subscription plan first.');
      return;
    }

    // IMMEDIATE: Set payment states to show loader instantly
    updatePaymentInProgress(true);
    setIsProcessing(true);
    setIsAuthenticating(true);

    // NON-BLOCKING: Defer heavy operations using InteractionManager
    InteractionManager.runAfterInteractions(async () => {
      try {
        // Stop existing polling before starting a new payment flow
        if (pollingCleanupRef.current) {
          pollingCleanupRef.current();
          pollingCleanupRef.current = null;
        }

        const currentUser = authService.getCurrentUser();

        // REMOVED: Heavy console logging that blocks UI
        // console.log statements removed for performance

        // Create Autopay subscription with backend (now non-blocking)
        let autopayDetails: any;
        if (isBusinessProfileMode && businessProfileId) {
          autopayDetails = await subscriptionApi.createBusinessProfileAutopay({
            planId: selectedPlan.id,
            businessProfileId: businessProfileId,
            subscriptionCategory: 'BUSINESS_PROFILE',
            customerEmail: currentUser?.email,
            customerPhone: currentUser?.phoneNumber || currentUser?.phone,
          });
        } else {
          autopayDetails = await enableAutopay(selectedPlan.id);
        }

        // Safely extract subscription_id from response
        const subscriptionId =
          autopayDetails?.razorpaySubscriptionId ||
          autopayDetails?.data?.razorpaySubscription?.subscriptionId;

        if (!subscriptionId) {
          throw new Error("Invalid subscription ID");
        }

        // PRODUCTION VALIDATION: Use validated Razorpay key
        const razorpayKey = getProductionRazorpayKey();

        // MEMOIZED: Razorpay options created efficiently
        const safeOptions = createRazorpayOptions(razorpayKey, subscriptionId, selectedPlan, currentUser, isBusinessProfileMode, businessProfileId);

        // Transition from authenticating to normal processing during checkout
        setIsAuthenticating(false);

        // Open Razorpay with memoized options
        const result = await RazorpayCheckout.open(safeOptions);
        console.log('📦 Razorpay checkout completed - handler will process result:', result);

      } catch (error: any) {
        console.error('💥 Autopay payment error:', error);

        // Clear any potentially cached subscription status
        const currentUser = authService.getCurrentUser();
        if (currentUser?.id) {
          await cacheService.clear(`subscription_status_${currentUser.id}`);
        }

        // Explicitly set subscription to false on payment failure
        setIsSubscribed(false);

        // Show user-friendly error
        if (error.message === "Razorpay module not loaded") {
          Alert.alert("Payment Error", "Payment service is not available. Please restart the app and try again.");
        } else if (error.message === "Invalid Razorpay key") {
          Alert.alert("Configuration Error", "Payment configuration is invalid. Please contact support.");
        } else if (error.message === "Invalid subscription ID") {
          Alert.alert("Subscription Error", "Unable to setup subscription. Please try again.");
        } else if (error.code === 'PAYMENT_CANCELLED') {
          if (isBusinessProfileMode) {
            clearActivationPending(businessProfileId);
          }
          showErrorModal('Subscription Cancelled', 'Subscription setup was cancelled by user.');
        } else if (error.code === 'NETWORK_ERROR') {
          showErrorModal('Network Error', 'Please check your internet connection and try again.');
        } else if (error.code === 'INVALID_OPTIONS') {
          showErrorModal('Configuration Error', 'Subscription configuration is invalid. Please contact support.');
        } else {
          showErrorModal('Subscription Failed', 'Something went wrong with subscription setup. Please try again.');
        }
      } finally {
        setIsProcessing(false);
        updatePaymentInProgress(false);
      }
    });
  }, [disableSubscribeButton, paymentInProgress, hasAccess, isBusinessProfileMode, selectedPlan, updatePaymentInProgress, setIsAuthenticating, enableAutopay, businessProfileId, setIsSubscribed, createRazorpayOptions, clearActivationPending, showErrorModal]);

  // Verify payment with backend and activate subscription
  const verifyPaymentAndActivateSubscription = async (
    paymentResponse: any,
    {
      planId,
      amount,
      amountPaise,
      currency,
      user,
    }: {
      planId: string;
      amount: number;
      amountPaise?: number;
      currency: string;
      user?: any;
    }
  ): Promise<SubscriptionStatus> => {
    try {
      console.log('🔍 Verifying payment and activating subscription:', paymentResponse);

      // IMPORTANT: First verify the payment with backend before activating subscription
      // This ensures we don't activate subscription for failed payments
      let paymentVerified = false;

      try {
        // Use the subscriptionApi service for payment verification
        const verifyData = await subscriptionApi.verifyPayment({
          orderId: paymentResponse.razorpay_order_id,
          paymentId: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature,
          amount,
          amountPaise,
          currency,
          planId,
          email: user?.email,
          contact: user?.phoneNumber,
        });

        console.log('✅ Payment verified with backend:', verifyData);
        paymentVerified = true;
      } catch (backendError: any) {
        console.error('❌ Backend payment verification error:', backendError);
        throw new Error('Payment verification failed: ' + (backendError.message || 'Unable to verify payment'));
      }

      // Only proceed with subscription activation if payment is verified
      if (!paymentVerified) {
        throw new Error('Payment verification failed - subscription not activated');
      }

      // Call subscription API to activate subscription
      const subscriptionResponse = await subscriptionApi.subscribe({
        planId,  // Use the actual plan ID from backend
        paymentMethod: 'razorpay',
        autoRenew: true,
      });

      console.log('✅ Subscription activated via API:', subscriptionResponse.data);

      // Refresh subscription status from backend
      const statusResponse = await subscriptionApi.getStatus();
      const latestStatus = statusResponse.data;
      const active = isStatusActive(latestStatus);
      setIsSubscribed(active);

      // Ensure shared context is refreshed without cache
      await refreshSubscription(true);

      return latestStatus;

    } catch (error) {
      console.error('❌ Payment verification and subscription activation failed:', error);

      // Return a failure status
      return {
        isActive: false,
        status: 'inactive',
        plan: null,
        expiryDate: null,
        autoRenew: false,
      };
    }
  };

  return (
    <View style={[styles.container, {
      backgroundColor: theme.colors.background
    }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header */}
      <View
        style={[styles.header, {
          paddingTop: insets.top + (isTabletDevice ? dynamicModerateScale(4) : dynamicModerateScale(2)),
          paddingHorizontal: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
          paddingBottom: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(6),
          backgroundColor: theme.colors.cardBackground,
        }]}
      >
        <TouchableOpacity
          style={[styles.backButton, {
            padding: isTabletDevice ? dynamicModerateScale(10) : (currentScreenWidth < 375 ? dynamicModerateScale(9) : dynamicModerateScale(7)),
            borderRadius: dynamicModerateScale(10),
          }]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={isTabletDevice ? getIconSize(22) : (currentScreenWidth < 375 ? getIconSize(22) : getIconSize(18))} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, {
            fontSize: dynamicModerateScale(14),
            color: theme.colors.text,
          }]}>{screenTitle}</Text>
          <Text style={[styles.headerSubtitle, {
            fontSize: dynamicModerateScale(9),
            marginTop: dynamicModerateScale(1),
            color: theme.colors.textSecondary,
          }]}>
            Unlock unlimited possibilities
          </Text>
          <View style={[styles.statusContainer, {
            marginTop: dynamicModerateScale(4),
          }]}>
            {effectiveIsLoading ? (
              <View style={[styles.loadingBadge, {
                paddingHorizontal: isTabletDevice ? dynamicModerateScale(10) : dynamicModerateScale(8),
                paddingVertical: isTabletDevice ? dynamicModerateScale(3) : dynamicModerateScale(2),
                borderRadius: dynamicModerateScale(8),
              }]}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={[styles.loadingBadgeText, {
                  fontSize: dynamicModerateScale(7),
                  marginLeft: dynamicModerateScale(3),
                }]}>Loading...</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={[styles.headerSpacer, { width: dynamicModerateScale(36) }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, {
          padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
        }]}
      >
        <>
        {/* Processing Message - Show only when payment success confirmed AND backend confirms PROCESSING status */}
        {(() => {
          console.log('🔍 UI RENDER DEBUG:', {
            showProcessingMessage,
            debugForceShow,
            ultimateTrigger,
            isPaymentSuccess,
            isActivationPendingState,
            hasLoadedWithPending,
            isBusinessProfileWithPending,
            subscriptionStatus: effectiveSubscriptionStatus?.status?.toUpperCase(),
            businessProfileId,
            isBusinessProfileMode
          });
          return showProcessingMessage || debugForceShow;
        })() && (
          <View style={{
            backgroundColor: "#E8F5E9",
            padding: dynamicModerateScale(12),
            margin: dynamicModerateScale(10),
            borderRadius: dynamicModerateScale(8),
            borderWidth: 1,
            borderColor: "#4CAF50",
          }}>
            <Text style={{ 
              fontWeight: "bold", 
              color: "#2E7D32",
              fontSize: dynamicModerateScale(11),
              marginBottom: dynamicModerateScale(4),
            }}>
              {debugForceShow ? 'DEBUG: Test Message' : 'Payment Successful'}
            </Text>
            <Text style={{ 
              color: "#2E7D32",
              fontSize: dynamicModerateScale(9),
              lineHeight: dynamicModerateScale(12),
            }}>
              {debugForceShow ? 'This is a test message to verify UI works' : 'Your business profile will be activated within 24 hours'}
            </Text>
          </View>
        )}
        

        {/* Current Subscription Status (if subscribed) */}
        {effectiveSubscriptionStatus?.status?.toUpperCase() === 'ACTIVE' && (
          <View style={[styles.currentSubscriptionCard, {
            backgroundColor: theme.colors.cardBackground,
            marginBottom: dynamicModerateScale(12),
            padding: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(12),
            borderRadius: dynamicModerateScale(12),
            borderWidth: 1.5,
          }]}>
            <View style={[styles.currentSubscriptionHeader, {
              marginBottom: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(6),
            }]}>
              <Icon name="check-circle" size={isTabletDevice ? getIconSize(28) : getIconSize(24)} color="#28a745" />
              <View style={[styles.currentSubscriptionInfo, {
                marginLeft: dynamicModerateScale(10),
              }]}>
                <Text style={[styles.currentSubscriptionTitle, {
                  color: theme.colors.text,
                  fontSize: dynamicModerateScale(12),
                  marginBottom: dynamicModerateScale(2),
                }]}>
                  {effectiveSubscriptionStatus?.planName || (isBusinessProfileMode ? 'Business Plan' : 'Pro Subscription')}
                </Text>
                <Text style={[styles.currentSubscriptionSubtitle, {
                  color: theme.colors.textSecondary,
                  fontSize: dynamicModerateScale(9),
                  lineHeight: dynamicModerateScale(14),
                }]}>
                  {(() => {
                    const expiryDate = effectiveSubscriptionStatus?.expiryDate || effectiveSubscriptionStatus?.endDate;
                    if (expiryDate) {
                      const daysRemaining = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const expiryDateFormatted = new Date(expiryDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                      return `${daysRemaining} days remaining • Expires ${expiryDateFormatted}`;
                    }
                    return 'Active subscription';
                  })()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Autopay Status Display */}
        {autopayState.isAutopayActive && (
          <View style={[styles.autopayStatusCard, {
            backgroundColor: theme.colors.cardBackground,
            marginBottom: dynamicModerateScale(12),
            padding: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(12),
            borderRadius: dynamicModerateScale(12),
            borderWidth: 1.5,
            borderColor: '#28a745',
          }]}>
            <View style={[styles.autopayStatusHeader, {
              marginBottom: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(6),
            }]}>
              <Icon name="autorenew" size={isTabletDevice ? getIconSize(28) : getIconSize(24)} color="#28a745" />
              <View style={[styles.autopayStatusInfo, {
                marginLeft: dynamicModerateScale(10),
              }]}>
                <Text style={[styles.autopayStatusTitle, {
                  color: theme.colors.text,
                  fontSize: dynamicModerateScale(12),
                  marginBottom: dynamicModerateScale(2),
                }]}>
                  Auto-Renewal Active
                </Text>
                <Text style={[styles.autopayStatusSubtitle, {
                  color: theme.colors.textSecondary,
                  fontSize: dynamicModerateScale(9),
                  lineHeight: dynamicModerateScale(14),
                }]}>
                  {autopayState.nextBillingDate ? `Next billing: ${new Date(autopayState.nextBillingDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}` : 'Auto-renewal enabled'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.cancelAutopayButton, {
                backgroundColor: '#ff4444',
                paddingVertical: dynamicModerateScale(8),
                paddingHorizontal: dynamicModerateScale(12),
                borderRadius: dynamicModerateScale(8),
                alignItems: 'center',
              }]}
              onPress={disableAutopay}
              disabled={autopayState.autopayLoading}
            >
              <Text style={[styles.cancelAutopayButtonText, {
                color: '#ffffff',
                fontSize: dynamicModerateScale(10),
                fontWeight: '600',
              }]}>
                {autopayState.autopayLoading ? 'Cancelling...' : 'Cancel Subscription'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comparison Cards */}
        <View style={[
          styles.comparisonContainer,
          isSinglePlan && styles.singlePlanContainer,
          {
            flexDirection: getComparisonCardLayout() as 'row' | 'column',
            gap: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
            marginBottom: dynamicModerateScale(16),
          }
        ]}>
          {purchasablePlans.map((plan: any) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlanId === plan.id}
              onSelect={() => setSelectedPlanId(plan.id)}
              isSinglePlan={isSinglePlan}
            />
          ))}
        </View>

        {/* Benefits Section */}
        <View style={[styles.benefitsSection, {
          backgroundColor: theme.colors.cardBackground,
          borderRadius: dynamicModerateScale(12),
          padding: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(12),
        }]}>
          <Text style={[styles.benefitsTitle, {
            color: theme.colors.text,
            fontSize: dynamicModerateScale(12),
            marginBottom: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
          }]}>Why Upgrade to Pro?</Text>
          <View style={[styles.benefitsGrid]}>
            <View style={[styles.benefitItem, {
              backgroundColor: theme.colors.inputBackground,
              width: isTabletDevice
                ? `${(100 - 3 * 2.5) / 4}%` // 4 items with 3 gaps
                : `${(100 - 1 * 2.5) / 2}%`, // 2 items with 1 gap
              marginRight: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(8),
              marginBottom: dynamicModerateScale(8),
              padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
              borderRadius: dynamicModerateScale(10),
              minHeight: isTabletDevice ? dynamicModerateScale(90) : dynamicModerateScale(70),
            }]}>
              <Text style={[styles.infinityIcon, {
                fontSize: getIconSize(20),
                color: '#667eea',
                marginBottom: dynamicModerateScale(4),
              }]}>∞</Text>
              <Text style={[styles.benefitTitle, {
                color: theme.colors.text,
                fontSize: dynamicModerateScale(10),
                marginTop: dynamicModerateScale(4),
                marginBottom: dynamicModerateScale(2),
              }]}>Unlimited</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                ellipsizeMode="tail"
                style={[styles.benefitText, {
                  color: theme.colors.textSecondary,
                  fontSize: dynamicModerateScale(7.5),
                  lineHeight: dynamicModerateScale(12),
                }]}
              >Priority support</Text>
            </View>
            <View style={[styles.benefitItem, {
              backgroundColor: theme.colors.inputBackground,
              width: isTabletDevice
                ? `${(100 - 3 * 2.5) / 4}%`
                : `${(100 - 1 * 2.5) / 2}%`,
              marginRight: isTabletDevice ? dynamicModerateScale(8) : 0, // No right margin for 2nd item in phone row
              marginBottom: dynamicModerateScale(8),
              padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
              borderRadius: dynamicModerateScale(10),
              minHeight: isTabletDevice ? dynamicModerateScale(90) : dynamicModerateScale(70),
            }]}>
              <Icon name="star" size={getIconSize(20)} color="#667eea" />
              <Text style={[styles.benefitTitle, {
                color: theme.colors.text,
                fontSize: dynamicModerateScale(10),
                marginTop: dynamicModerateScale(4),
                marginBottom: dynamicModerateScale(2),
              }]}>Premium</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                ellipsizeMode="tail"
                style={[styles.benefitText, {
                  color: theme.colors.textSecondary,
                  fontSize: dynamicModerateScale(7.5),
                  lineHeight: dynamicModerateScale(12),
                }]}
              >Priority support</Text>
            </View>
            <View style={[styles.benefitItem, {
              backgroundColor: theme.colors.inputBackground,
              width: isTabletDevice
                ? `${(100 - 3 * 2.5) / 4}%`
                : `${(100 - 1 * 2.5) / 2}%`,
              marginRight: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(8),
              marginBottom: dynamicModerateScale(8),
              padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
              borderRadius: dynamicModerateScale(10),
              minHeight: isTabletDevice ? dynamicModerateScale(90) : dynamicModerateScale(70),
            }]}>
              <Icon name="hd" size={getIconSize(20)} color="#667eea" />
              <Text style={[styles.benefitTitle, {
                color: theme.colors.text,
                fontSize: dynamicModerateScale(10),
                marginTop: dynamicModerateScale(4),
                marginBottom: dynamicModerateScale(2),
              }]}>HD Quality</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                ellipsizeMode="tail"
                style={[styles.benefitText, {
                  color: theme.colors.textSecondary,
                  fontSize: dynamicModerateScale(7.5),
                  lineHeight: dynamicModerateScale(12),
                }]}
              >Priority support</Text>
            </View>
            <View style={[styles.benefitItem, {
              backgroundColor: theme.colors.inputBackground,
              width: isTabletDevice
                ? `${(100 - 3 * 2.5) / 4}%`
                : `${(100 - 1 * 2.5) / 2}%`,
              marginRight: isTabletDevice ? dynamicModerateScale(8) : 0, // No right margin for last item in row
              marginBottom: dynamicModerateScale(8),
              padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
              borderRadius: dynamicModerateScale(10),
              minHeight: isTabletDevice ? dynamicModerateScale(90) : dynamicModerateScale(70),
            }]}>
              <Icon name="support-agent" size={getIconSize(20)} color="#667eea" />
              <Text style={[styles.benefitTitle, {
                color: theme.colors.text,
                fontSize: dynamicModerateScale(10),
                marginTop: dynamicModerateScale(4),
                marginBottom: dynamicModerateScale(2),
              }]}>Priority</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                ellipsizeMode="tail"
                style={[styles.benefitText, {
                  color: theme.colors.textSecondary,
                  fontSize: dynamicModerateScale(7.5),
                  lineHeight: dynamicModerateScale(12),
                }]}
              >Priority support</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacer for Sticky Button */}
        <View style={{ height: dynamicModerateScale(200) }} />
        </>
      </ScrollView>

      {/* Sticky Upgrade Button */}
      <View style={[
        styles.stickyButtonContainer,
        {
          backgroundColor: theme.colors.cardBackground,
          borderTopColor: theme.colors.border,
          paddingHorizontal: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
          paddingTop: isTabletDevice ? dynamicModerateScale(10) : dynamicModerateScale(8),
          paddingBottom: Math.max(insets.bottom + dynamicModerateScale(8), isTabletDevice ? dynamicModerateScale(14) : dynamicModerateScale(12)),
          borderTopWidth: 0.5,
        }
      ]}>
        <TouchableOpacity
          style={[styles.upgradeButton, {
            borderRadius: dynamicModerateScale(10),
            marginBottom: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(6),
            opacity: disableSubscribeButton ? 0.6 : 1,
          }]}
          onPress={handleAutopayPayment}
          disabled={disableSubscribeButton || isProcessing || effectiveSubscriptionStatus?.status?.toUpperCase() === 'ACTIVE' || paymentInProgress || isAuthenticating || isTransactionPending}
        >
          <LinearGradient
            colors={effectiveSubscriptionStatus?.status?.toUpperCase() === 'ACTIVE'
              ? ['#28a745', '#20c997']
              : isAuthenticating
                ? ['#ff9800', '#f57c00'] // Orange for authenticating
                : isTransactionPending
                  ? ['#2196f3', '#1976d2'] // Blue for transaction pending
                  : isProcessing || paymentInProgress
                    ? ['#cccccc', '#999999']
                    : ['#667eea', '#764ba2']
            }
            style={[styles.upgradeButtonGradient, {
              paddingVertical: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
              paddingHorizontal: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(12),
            }]}
          >
            <Text style={[styles.upgradeButtonText, {
              fontSize: dynamicModerateScale(11),
            }]}>
              {effectiveSubscriptionStatus?.status?.toUpperCase() === 'ACTIVE'
                ? 'Already Pro'
                : disableSubscribeButton
                  ? 'Processing...'
                  : isAuthenticating
                    ? 'Authenticating...'
                    : isTransactionPending
                      ? `Transaction Pending...${pollingAttempts > 0 ? ` (${pollingAttempts}/5)` : ''}`
                      : isProcessing || paymentInProgress
                        ? 'Processing...'
                        : selectedPlan
                          ? `Subscribe - ₹${selectedPlan.price || selectedPlan.amount || 99}`
                          : 'Select a Plan'
              }
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {effectiveSubscriptionStatus?.status?.toUpperCase() !== 'ACTIVE' && (
          <Text style={[styles.termsText, {
            color: theme.colors.textSecondary,
            fontSize: dynamicModerateScale(7.5),
            lineHeight: dynamicModerateScale(12),
          }]}>
            By upgrading, you agree to our Terms of Service and Privacy Policy
          </Text>
        )}

        {/* Transaction History Button */}
        <TouchableOpacity
          style={[styles.transactionHistoryButton, {
            backgroundColor: theme.colors.inputBackground,
            paddingHorizontal: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
            paddingVertical: isTabletDevice ? dynamicModerateScale(10) : dynamicModerateScale(8),
            borderRadius: dynamicModerateScale(10),
            marginTop: isTabletDevice ? dynamicModerateScale(8) : dynamicModerateScale(6),
          }]}
          onPress={() => navigation.navigate('TransactionHistory' as never)}
        >
          <Icon name="receipt-long" size={isTabletDevice ? getIconSize(18) : getIconSize(16)} color={theme.colors.text} />
          <Text style={[styles.transactionHistoryButtonText, {
            color: theme.colors.text,
            fontSize: dynamicModerateScale(9),
            marginLeft: dynamicModerateScale(6),
          }]}>
            View Transaction History ({transactionStats.total})
          </Text>
          <Icon name="chevron-right" size={isTabletDevice ? getIconSize(18) : getIconSize(16)} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Payment Error Modal */}
      <PaymentErrorModal
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        title={errorModalData.title}
        message={errorModalData.message}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0,
    zIndex: 1000,
    elevation: moderateScale(6),
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerSubtitle: {
  },
  statusContainer: {
  },
  loadingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBadgeText: {
    fontWeight: '700',
    color: '#ffffff',
  },
  errorBadge: {
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
  },
  errorBadgeText: {
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSpacer: {
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
  },
  currentSubscriptionCard: {
    borderColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(6),
    elevation: moderateScale(3),
  },
  currentSubscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentSubscriptionInfo: {
    flex: 1,
  },
  currentSubscriptionTitle: {
    fontWeight: '700',
  },
  currentSubscriptionSubtitle: {
  },
  comparisonContainer: {
  },
  singlePlanContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCard: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(10),
    elevation: moderateScale(6),
  },
  proCard: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(12),
    elevation: moderateScale(8),
    borderColor: '#667eea',
    position: 'relative',
  },
  proBadge: {
    position: 'absolute',
    left: '50%',
    marginLeft: moderateScale(-25),
    backgroundColor: '#667eea',
  },
  proBadgeText: {
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  planHeader: {
    alignItems: 'center',
  },
  planName: {
    fontWeight: '700',
  },
  priceContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  planPrice: {
    fontWeight: '700',
    color: '#667eea',
  },
  originalPrice: {
    fontWeight: '400',
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    position: 'absolute',
    backgroundColor: '#28a745',
  },
  savingsText: {
    fontWeight: '700',
    color: '#ffffff',
  },
  planPeriod: {
  },
  featuresList: {
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  // Autopay specific styles
  autopayStatusCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  autopayStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autopayStatusInfo: {
    flex: 1,
  },
  autopayStatusTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  autopayStatusSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  cancelAutopayButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  cancelAutopayButtonText: {
    fontSize: 12,
  },
  benefitsSection: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(6),
    elevation: moderateScale(3),
  },
  benefitsTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  benefitItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infinityIcon: {
    fontWeight: '400',
    textAlign: 'center',
  },
  benefitTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  benefitText: {
    textAlign: 'center',
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  upgradeButton: {
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  termsText: {
    textAlign: 'center',
  },
  transactionHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionHistoryButtonText: {
    fontWeight: '600',
    flex: 1,
  },
});

export default SubscriptionScreen;
