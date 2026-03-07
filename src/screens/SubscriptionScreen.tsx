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
  const { isSubscribed, subscriptionStatus: contextSubscriptionStatus, plans: contextPlans, refreshSubscription, refreshPlans, addTransaction, setIsSubscribed, transactionStats, isLoading } = useSubscription();
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
  const [paymentInProgress, setPaymentInProgress] = useState(false);

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

  const isStatusActive = (status: SubscriptionStatus | null) => {
    if (!status) {
      return false;
    }

    const normalizedStatus = status.status?.toLowerCase();
    const hasValidPlan = Boolean(status.planId || status.plan || status.planName);
    const expiryDate = status.expiryDate || status.endDate;
    const isNotExpired = expiryDate ? new Date(expiryDate) > new Date() : true;

    // Ensure both isActive === true AND status === 'active' AND not expired
    return status.isActive === true && normalizedStatus === 'active' && hasValidPlan && isNotExpired;
  };

  // Refresh subscription when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 SUBSCRIPTION_STATUS_FETCH - SubscriptionScreen focused, refreshing subscription');
      refreshSubscription();
      refreshPlans();
      
      // Set default selected plan when plans load
      if (!selectedPlanId && purchasablePlans.length > 0) {
        setSelectedPlanId(purchasablePlans[0].id);
      }
    }, [refreshSubscription, refreshPlans, selectedPlanId, purchasablePlans.length])
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

    setPaymentInProgress(true);
    setIsProcessing(true);

    const currentUser = authService.getCurrentUser();
    let amountInPaise = 100;
    let amountInRupees = 1;
    let orderDetails: any;

    try {
      // Validate Razorpay configuration
      if (!selectedPlan) {
        throw new Error('No plan selected');
      }
      
      console.log('🚀 Starting payment process...');
      console.log('📋 Selected plan:', selectedPlan);
      console.log('👤 Current user:', currentUser);

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
            // Get current user for transaction metadata
            const currentUserForTransaction = authService.getCurrentUser();
            
            // Record transaction first
            console.log('📝 Recording transaction...');
            await addTransaction({
              paymentId: response.razorpay_payment_id || 'pay_' + Date.now(),
              orderId: response.razorpay_order_id || 'order_' + Date.now(),
              amount: amountInRupees,
              currency: 'INR',
              status: 'success',
              plan: selectedPlan,
              planName: selectedPlan.name,
              description: `${selectedPlan.name} Subscription`,
              method: 'razorpay',
              metadata: {
                email: currentUserForTransaction?.email || 'user@example.com',
                contact: currentUserForTransaction?.phoneNumber || '9999999999',
                name: currentUserForTransaction?.name || 'User Name',
              },
            });
            console.log('✅ Transaction recorded');
            
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
            
            // Step 3: Fetch updated subscription status
            const statusResponse = await subscriptionApi.getStatus();
            const latestStatus = statusResponse.data;
            console.log('✅ SUBSCRIPTION_UPDATED - Latest status:', latestStatus);
            
            // Step 4: Update context (context handles state updates)
            const active = isStatusActive(latestStatus);
            setIsSubscribed(active);

            // Step 5: Ensure shared context is refreshed without cache
            await refreshSubscription(true);
            
            // Step 6: Show success message and navigate
            if (active) {
              if (Platform.OS === 'android') {
                ToastAndroid.show('🎉 Payment successful! Welcome to Pro!', ToastAndroid.LONG);
              } else {
                Alert.alert('🎉 Success', 'Payment successful! Welcome to Pro!');
              }
              console.log('✅ Payment processing complete, navigating back');
              setPaymentInProgress(false);
              navigation.goBack();
            } else {
              // Subscription verification failed
              console.warn('⚠️ Payment successful but subscription not activated');
              setPaymentInProgress(false);
              showErrorModal('Subscription Activation Failed', 'Payment was successful but subscription could not be activated. Please contact support or check your subscription status.');
            }
          } catch (error) {
            console.error('❌ Error processing successful payment:', error);
            setPaymentInProgress(false);
            showErrorModal('Payment Processing Error', 'Payment was successful but there was an error activating your subscription. Please contact support or refresh the app.');
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentInProgress(false);
          },
        },
      };

      console.log('💳 Opening Razorpay with options:', options);
      console.log('🧾 Razorpay checkout payload:', JSON.stringify(options, null, 2));
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
      // Record failed transaction only for actual errors, not cancellation
      if (error.code === 'PAYMENT_CANCELLED') {
        // Do not record transaction for user cancellation
        // Report failure to backend for analytics
        if (orderDetails?.orderId) {
          reportPaymentFailure(orderDetails.orderId, 'FAILED');
        }
      } else {
        try {
          await addTransaction({
            paymentId: 'pay_failed_' + Date.now(),
            orderId: 'order_failed_' + Date.now(),
            amount: amountInRupees,
            currency: 'INR',
            status: 'failed',
            plan: selectedPlan,
            planName: selectedPlan.name,
            description: `${selectedPlan.name} Subscription - Failed`,
            method: 'razorpay',
            metadata: {
              email: currentUser?.email || 'user@example.com',
              contact: currentUser?.phoneNumber || '9999999999',
              name: currentUser?.name || 'User Name',
            },
          });
          // Report failure to backend
          if (orderDetails?.orderId) {
            reportPaymentFailure(orderDetails.orderId, 'FAILED');
          }
        } catch (txnError) {
          console.error('Error recording failed transaction:', txnError);
        }
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
      setPaymentInProgress(false);
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
          onPress={handlePayment}
          disabled={isProcessing || isSubscribed || paymentInProgress}
        >
          <LinearGradient
            colors={isSubscribed 
              ? ['#28a745', '#20c997'] 
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
                 : isProcessing || paymentInProgress
                   ? 'Processing...' 
                   : selectedPlan 
                     ? `Upgrade to Pro - ₹${selectedPlan.price}`
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
