import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY_ID } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscription } from '../contexts/SubscriptionContext';
import PaymentErrorModal from '../components/PaymentErrorModal';
import PlanCard from '../components/PlanCard';
import { useTheme } from '../context/ThemeContext';
import subscriptionApi, { SubscriptionPlan, SubscriptionStatus } from '../services/subscriptionApi';
import authService from '../services/auth';
import api from '../services/api';
import cacheService from '../services/cacheService';

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
  const insets = useSafeAreaInsets();
  const { isSubscribed, subscriptionStatus: contextSubscriptionStatus, plans: contextPlans, refreshSubscription, refreshPlans, addTransaction, setIsSubscribed, transactionStats, isLoading, autopayState, enableAutopay, disableAutopay, refreshAutopayStatus, setPaymentInProgress } = useSubscription();
  const { theme } = useTheme();

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

  // Wrapper to update both local and context payment states
  const updatePaymentInProgress = (inProgress: boolean) => {
    setPaymentInProgressState(inProgress);
    setPaymentInProgress(inProgress);
    console.log(`🔒 PAYMENT LOCK: ${inProgress ? 'ENGAGED' : 'RELEASED'}`);
    
    // Reset all enhanced states when payment is not in progress
    if (!inProgress) {
      setIsAuthenticating(false);
      setIsTransactionPending(false);
      setPollingAttempts(0);
    }
  };

  // Filter out promo plans from purchasable plans
  const purchasablePlans = contextPlans.filter(plan => plan.name !== "PROMO");

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

    // Normalize status
    const normalizedStatus = status.status?.toLowerCase();

    // PRIMARY condition (MOST IMPORTANT)
    if (status.isActive === true) {
      console.log('[APP] ✅ Active via isActive');
      return true;
    }

    // FALLBACK condition
    if (normalizedStatus === 'active') {
      console.log('[APP] ✅ Active via status field');
      return true;
    }

    // OPTIONAL fallback (if expiry exists)
    const expiryDate = status.expiryDate || status.endDate;
    if (expiryDate && new Date(expiryDate) > new Date()) {
      console.log('[APP] ✅ Active via expiry date');
      return true;
    }

    console.log('[APP] ❌ Not active');
    return false;
  };

  // Refresh subscription when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Don't refresh subscription if payment is in progress
      if (paymentInProgress) {
        console.log('🔄 Payment in progress, skipping subscription refresh');
        return;
      }

      // CRITICAL: Only refresh if not in payment flow to prevent false activation
      console.log('🔄 SUBSCRIPTION_STATUS_FETCH - SubscriptionScreen focused, refreshing subscription');
      refreshSubscription();
      refreshPlans();
      refreshAutopayStatus();

      // Set default selected plan when plans load
      if (!selectedPlanId && purchasablePlans.length > 0) {
        setSelectedPlanId(purchasablePlans[0].id);
      }
    }, [refreshSubscription, refreshPlans, refreshAutopayStatus, selectedPlanId, purchasablePlans.length, paymentInProgress])
  );

  // Helper function to show error modal
  const showErrorModal = (title: string, message: string) => {
    setErrorModalData({ title, message });
    setIsErrorModalVisible(true);
  };

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

  // Polling mechanism for transaction pending state
  const pollSubscriptionStatus = useCallback(async (maxAttempts = 5, interval = 3000) => {
    console.log(`⏳ Starting subscription polling - max attempts: ${maxAttempts}, interval: ${interval}ms`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 Polling attempt ${attempt}/${maxAttempts}`);
        setPollingAttempts(attempt);
        
        // Force refresh subscription status
        await refreshSubscription(true);
        
        // Check if subscription is now active
        const currentUser = authService.getCurrentUser();
        if (currentUser?.id) {
          const statusResponse = await subscriptionApi.getStatus();
          const subscriptionData = (statusResponse.data as any)?.subscription || (statusResponse.data as any)?.data || statusResponse.data;
          const isActive = isStatusActive(subscriptionData);
          
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
          console.log(`⏳ Waiting ${interval}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, interval));
        }
        
      } catch (error) {
        console.error(`❌ Polling attempt ${attempt} failed:`, error);
      }
    }
    
    console.log(`⏱️ Polling completed after ${maxAttempts} attempts - subscription not activated`);
    return false; // Failed to activate
  }, [refreshSubscription, setIsSubscribed, updatePaymentInProgress]);

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

      const resolvedKey = orderDetails.razorpayKey || RAZORPAY_KEY_ID; // || 'rzp_test_RQ5lTAzm7AyNN9';

      if (!orderDetails.razorpayKey && !RAZORPAY_KEY_ID) {
        console.warn('⚠️ RAZORPAY_KEY_ID missing from environment. Using fallback test key.');
      }

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
            });
            console.log('✅ PAYMENT_SUCCESS - Payment verified:', verifyResult);

            // Step 2: Clear subscription cache immediately
            const currentUserForCache = authService.getCurrentUser();
            const userId = currentUserForCache?.id;
            if (userId) {
              await cacheService.clear(`subscription_status_${userId}`);
              console.log('🗑️ Subscription cache cleared for user:', userId);
            }

            // Step 3: Start polling for subscription activation instead of immediate check
            if (verifyResult?.success) {
              console.log('[APP] ✅ Payment verified, starting polling for activation');
              
              // Start polling for subscription activation
              const activationSuccess = await pollSubscriptionStatus();
              
              if (activationSuccess) {
                console.log('✅ Payment processing complete, navigating back');
                navigation.goBack();
              } else {
                // Polling failed - show user-friendly message
                console.warn('⚠️ Polling completed - subscription not yet activated');
                setIsTransactionPending(false);
                updatePaymentInProgress(false);
                
                Alert.alert(
                  'Processing Payment',
                  'Your payment was successful! Subscription activation may take a few moments. Please check your status after a short while.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
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
        showErrorModal('Payment Cancelled', 'Payment was cancelled by user.');
      } else if (error.code === 'NETWORK_ERROR') {
        showErrorModal('Network Error', 'Please check your internet connection and try again.');
      } else if (error.code === 'INVALID_OPTIONS') {
        showErrorModal('Configuration Error', 'Payment configuration is invalid. Please contact support.');
      } else {
        showErrorModal('Payment Failed', 'Something went wrong with the payment. Please try again.');
      }
    } finally {
      setIsProcessing(false);
      updatePaymentInProgress(false);
    }
  };

  // Handle Autopay payment
  const handleAutopayPayment = async () => {
    if (paymentInProgress) {
      console.log('Payment already in progress, ignoring duplicate click');
      return;
    }

    if (isSubscribed) {
      showErrorModal('Already Subscribed', 'You are already a Pro subscriber!');
      return;
    }

    // CRITICAL: Check if plan is selected before proceeding
    if (!selectedPlan) {
      showErrorModal('No Plan Selected', 'Please select a subscription plan first.');
      return;
    }

    updatePaymentInProgress(true);
    setIsProcessing(true);
    setIsAuthenticating(true); // Start authenticating state

    const currentUser = authService.getCurrentUser();

    try {
      // === DEBUG LOGGING ===
      console.log("🚀 Starting Autopay payment process...");
      console.log("📋 Selected plan:", selectedPlan);
      console.log("👤 Current user:", currentUser);
      console.log("🧾 RazorpayCheckout module:", RazorpayCheckout);
      console.log("🔑 RAZORPAY_KEY_ID:", RAZORPAY_KEY_ID);
      console.log("📱 Platform:", Platform.OS);

      // Create Autopay subscription with backend
      const autopayDetails: any = await enableAutopay(selectedPlan.id);
      console.log("📦 API Response:", JSON.stringify(autopayDetails, null, 2));

      // Safely extract subscription_id from response
      const subscriptionId =
        autopayDetails?.razorpaySubscriptionId ||
        autopayDetails?.data?.razorpaySubscription?.subscriptionId;

      console.log("🆔 Subscription ID:", subscriptionId);
      console.log("🔍 Subscription ID type:", typeof subscriptionId);
      console.log("🔍 Subscription ID length:", subscriptionId?.length);

      if (!subscriptionId) {
        console.error("Subscription ID missing", autopayDetails);
        return;
      }

      console.log('📦 Autopay details from backend:', {
        subscriptionId: subscriptionId,
        fullResponse: autopayDetails,
      });

      // === SAFE VALIDATION ===
      if (!RazorpayCheckout) {
        throw new Error("Razorpay module not loaded");
      }

      // FALLBACK: Use test key if environment variable is missing
      const razorpayKey = RAZORPAY_KEY_ID || 'rzp_test_RQ5lTAzm7AyNN9';

      if (!razorpayKey || typeof razorpayKey !== 'string') {
        console.error('❌ Invalid Razorpay key:', { key: razorpayKey, type: typeof razorpayKey });
        throw new Error("Invalid Razorpay key");
      }

      if (!subscriptionId || typeof subscriptionId !== 'string') {
        console.error('❌ Invalid subscription ID:', { subscriptionId, type: typeof subscriptionId });
        throw new Error("Invalid subscription ID");
      }

      // Safe Razorpay options
      const safeOptions = {
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
        // CRITICAL: Add handler to verify payment before subscription activation
        handler: async (response: any) => {
          console.log('💳 Autopay success response:', response);

          try {
            // Transition to transaction pending state immediately after payment success
            setIsTransactionPending(true);
            setIsAuthenticating(false);
            
            // CRITICAL: Verify payment before activating subscription
            if (!response.razorpay_payment_id || !response.razorpay_subscription_id) {
              console.error('❌ Invalid payment response:', response);
              throw new Error('Invalid payment response');
            }

            // Get current user for transaction metadata
            const currentUserForTransaction = authService.getCurrentUser();

            console.log('🔄 Verifying autopay payment...');

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

            console.log('✅ Autopay payment verified:', verifyResult);

            // Step 2: Only after payment verification, handle subscription activation
            if (response.razorpay_subscription_id) {
              console.log('✅ Autopay mandate approved:', response.razorpay_subscription_id);

              // Refresh Autopay status from backend
              await refreshAutopayStatus();

              // Step 2: Clear subscription cache immediately
              const currentUserForCache = authService.getCurrentUser();
              const userId = currentUserForCache?.id;
              if (userId) {
                await cacheService.clear(`subscription_status_${userId}`);
                console.log('🗑️ Subscription cache cleared for user:', userId);
              }

              // Step 3: Start polling for subscription activation instead of immediate check
              if (verifyResult?.success) {
                console.log('[APP] ✅ Payment verified, starting polling for activation');
                
                // Start polling for subscription activation
                const activationSuccess = await pollSubscriptionStatus();
                
                if (activationSuccess) {
                  console.log('✅ Autopay processing complete, navigating back');
                  navigation.goBack();
                } else {
                  // Polling failed - show user-friendly message for Autopay
                  console.warn('⚠️ Polling completed - subscription not yet activated');
                  setIsTransactionPending(false);
                  updatePaymentInProgress(false);
                  
                  Alert.alert(
                    'Processing Mandate',
                    'Your mandate was approved! Subscription activation may take a few moments. Pro features will unlock once the payment is processed.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                  );
                }
              } else {
                console.warn('[APP] ⚠️ Payment verification failed');
                setIsTransactionPending(false);
                updatePaymentInProgress(false);
                showErrorModal('Payment Verification Failed', 'Mandate verification failed. Please contact support.');
              }
            } else {
              console.warn('⚠️ Autopay response missing razorpay_subscription_id');
              updatePaymentInProgress(false);
              showErrorModal('Subscription Activation Failed', 'Payment was successful but subscription could not be activated. Please contact support.');
            }
          } catch (error) {
            console.error('❌ Error processing Autopay response:', error);
            updatePaymentInProgress(false);
            showErrorModal('Payment Processing Error', 'Payment was successful but there was an error activating your subscription. Please contact support or refresh the app.');
          }
        },
        modal: {
          ondismiss: () => {
            console.log('🚪 Razorpay modal dismissed');
            setIsProcessing(false);
            updatePaymentInProgress(false);
          },
        },
      };

      console.log('🚪 Opening Razorpay with safe options:', safeOptions);

      // Transition from authenticating to normal processing during checkout
      setIsAuthenticating(false);

      // SAFE Razorpay checkout execution
      const result = await RazorpayCheckout.open(safeOptions);
      console.log('📦 Razorpay checkout completed - handler will process result:', result);

    } catch (error: any) {
      console.error('💥 Autopay payment error:', error);
      console.error('💥 Error details:', {
        message: error.message,
        code: error.code,
        description: error.description,
        stack: error.stack
      });

      // CRITICAL: Ensure subscription is NEVER activated on payment failure
      // Clear any potentially cached subscription status
      const currentUser = authService.getCurrentUser();
      if (currentUser?.id) {
        await cacheService.clear(`subscription_status_${currentUser.id}`);
        console.log('🗑️ Subscription cache cleared due to payment failure');
      }

      // DANGEROUS: Do NOT refresh subscription on failure - backend might return active due to webhook
      // await refreshSubscription(true); // ❌ REMOVED - Prevents false activation

      // CRITICAL: Explicitly set subscription to false on payment failure
      setIsSubscribed(false);
      console.log('🚫 Payment failed - subscription explicitly set to false');

      // PREVENT APP CRASH - Show user-friendly error
      if (error.message === "Razorpay module not loaded") {
        Alert.alert(
          "Payment Error",
          "Payment service is not available. Please restart the app and try again."
        );
      } else if (error.message === "Invalid Razorpay key") {
        Alert.alert(
          "Configuration Error",
          "Payment configuration is invalid. Please contact support."
        );
      } else if (error.message === "Invalid subscription ID") {
        Alert.alert(
          "Subscription Error",
          "Unable to setup subscription. Please try again."
        );
      } else if (error.code === 'PAYMENT_CANCELLED') {
        console.log('🚫 User cancelled payment - no subscription activated');
        showErrorModal('Subscription Cancelled', 'Subscription setup was cancelled by user.');
      } else if (error.code === 'NETWORK_ERROR') {
        console.log('🌐 Network error - no subscription activated');
        showErrorModal('Network Error', 'Please check your internet connection and try again.');
      } else if (error.code === 'INVALID_OPTIONS') {
        console.log('⚙️ Invalid options - no subscription activated');
        showErrorModal('Configuration Error', 'Subscription configuration is invalid. Please contact support.');
      } else {
        console.log('❌ Payment failed - no subscription activated');
        showErrorModal('Subscription Failed', 'Something went wrong with subscription setup. Please try again.');
      }
    } finally {
      setIsProcessing(false);
      updatePaymentInProgress(false);
    }
  };

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
        plan: null,
        expiryDate: null,
        autoRenew: false,
        status: 'inactive' as const
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
          }]}>Upgrade to Pro</Text>
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
            {isLoading ? (
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

        {/* Current Subscription Status (if subscribed) */}
        {isSubscribed && contextSubscriptionStatus && (
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
                  {contextSubscriptionStatus.planName || 'Pro Subscription'}
                </Text>
                <Text style={[styles.currentSubscriptionSubtitle, {
                  color: theme.colors.textSecondary,
                  fontSize: dynamicModerateScale(9),
                  lineHeight: dynamicModerateScale(14),
                }]}>
                  {(() => {
                    const expiryDate = contextSubscriptionStatus.expiryDate || contextSubscriptionStatus.endDate;
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
          }]}
          onPress={handleAutopayPayment}
          disabled={isProcessing || isSubscribed || paymentInProgress || isAuthenticating || isTransactionPending}
        >
          <LinearGradient
            colors={isSubscribed
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
              {isSubscribed
                ? 'Already Pro'
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

        {!isSubscribed && (
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
