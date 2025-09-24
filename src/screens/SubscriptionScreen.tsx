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
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RazorpayCheckout from 'react-native-razorpay';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';
import subscriptionApi, { SubscriptionPlan, SubscriptionStatus } from '../services/subscriptionApi';

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

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isSubscribed, setIsSubscribed, addTransaction, transactionStats } = useSubscription();
  const { theme } = useTheme();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [apiPlans, setApiPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Subscription plans configuration
  const plans = {
    monthly: {
      name: 'Monthly Pro',
      price: '₹299',
      originalPrice: '₹499',
      savings: '40% OFF',
      period: 'month',
      features: [
        'Unlimited poster creation',
        'Premium templates',
        'No watermarks',
        'High-resolution exports',
        'Priority support',
        'Custom branding',
        'Advanced editing tools',
        'Cloud storage',
      ],
    },
    yearly: {
      name: 'Yearly Pro',
      price: '₹1,999',
      originalPrice: '₹5,988',
      savings: '67% OFF',
      period: 'year',
      features: [
        'Everything in Monthly Pro',
        '2 months free',
        'Early access to new features',
        'Exclusive templates',
        'API access',
        'White-label solution',
        'Team collaboration',
        'Analytics dashboard',
      ],
    },
  };

  const currentPlan = plans[selectedPlan];

  // Load subscription data from API
  const loadSubscriptionData = useCallback(async () => {
    setApiLoading(true);
    setApiError(null);
    
    try {
      console.log('Loading subscription data from API...');
      
      // Load subscription plans and status in parallel
      const [plansResponse, statusResponse] = await Promise.allSettled([
        subscriptionApi.getPlans(),
        subscriptionApi.getStatus(),
      ]);
      
      // Handle plans response
      if (plansResponse.status === 'fulfilled') {
        console.log('✅ Subscription plans loaded from API:', plansResponse.value.data);
        setApiPlans(plansResponse.value.data);
      } else {
        console.log('❌ Failed to load plans from API, using mock data');
        setApiError('Failed to load subscription plans');
      }
      
      // Handle status response
      if (statusResponse.status === 'fulfilled') {
        console.log('✅ Subscription status loaded from API:', statusResponse.value.data);
        setSubscriptionStatus(statusResponse.value.data);
        setIsSubscribed(statusResponse.value.data.isActive);
      } else {
        console.log('❌ Failed to load status from API, using local state');
        setApiError('Failed to load subscription status');
      }
      
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setApiError('Network error - using offline mode');
    } finally {
      setApiLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  // Handle payment with Razorpay
  const handlePayment = async () => {
    if (isSubscribed) {
      Alert.alert('Already Subscribed', 'You are already a Pro subscriber!');
      return;
    }

    setIsProcessing(true);

    try {
      // Demo mode for testing (when using quick demo access)
      const isDemoMode = true; // Set to false for real payments
      
      if (isDemoMode) {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate successful payment
        const mockResponse = {
          razorpay_payment_id: 'pay_demo_' + Date.now(),
          razorpay_order_id: 'order_demo_' + Date.now(),
          razorpay_signature: 'demo_signature_' + Date.now(),
        };
        
        console.log('Demo payment success:', mockResponse);
        
        // Record transaction
        await addTransaction({
          paymentId: mockResponse.razorpay_payment_id,
          orderId: mockResponse.razorpay_order_id,
          amount: selectedPlan === 'monthly' ? 299 : 1999,
          currency: 'INR',
          status: 'success',
          plan: selectedPlan,
          planName: currentPlan.name,
          description: `${currentPlan.name} Subscription`,
          method: 'demo',
          metadata: {
            email: 'user@example.com',
            contact: '9999999999',
            name: 'Demo User',
          },
        });
        
        // Update subscription status via API
        await updateSubscriptionStatus(mockResponse.razorpay_payment_id);
        
        if (Platform.OS === 'android') {
          ToastAndroid.show('Demo Payment successful! Welcome to Pro!', ToastAndroid.LONG);
        } else {
          Alert.alert('Demo Success', 'Demo payment successful! Welcome to Pro!');
        }
        
        setIsSubscribed(true);
        navigation.goBack();
        return;
      }

      // Real Razorpay integration (when not in demo mode)
      const options = {
        description: `${currentPlan.name} Subscription`,
        image: 'https://your-app-logo.png',
        currency: 'INR',
        key: 'rzp_test_cB8TVykpqqbxSn', // Your Razorpay test key
        amount: selectedPlan === 'monthly' ? 29900 : 199900, // Amount in paise
        name: 'EventMarketers Pro',
        prefill: {
          email: 'user@example.com',
          contact: '9999999999',
          name: 'User Name',
        },
        theme: { color: '#667eea' },
        handler: async (response: any) => {
          console.log('Payment success:', response);
          
          // Record transaction
          await addTransaction({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            amount: selectedPlan === 'monthly' ? 299 : 1999,
            currency: 'INR',
            status: 'success',
            plan: selectedPlan,
            planName: currentPlan.name,
            description: `${currentPlan.name} Subscription`,
            method: 'razorpay',
            metadata: {
              email: 'user@example.com',
              contact: '9999999999',
              name: 'User Name',
            },
          });
          
          // Call subscription API to verify payment and update subscription
          await updateSubscriptionStatus(response.razorpay_payment_id);
          
          if (Platform.OS === 'android') {
            ToastAndroid.show('Payment successful! Welcome to Pro!', ToastAndroid.LONG);
          } else {
            Alert.alert('Success', 'Payment successful! Welcome to Pro!');
          }
          
          setIsSubscribed(true);
          navigation.goBack();
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const data = await RazorpayCheckout.open(options);
      console.log('Payment data:', data);
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Record failed transaction
      try {
        await addTransaction({
          paymentId: 'pay_failed_' + Date.now(),
          orderId: 'order_failed_' + Date.now(),
          amount: selectedPlan === 'monthly' ? 299 : 1999,
          currency: 'INR',
          status: 'failed',
          plan: selectedPlan,
          planName: currentPlan.name,
          description: `${currentPlan.name} Subscription - Failed`,
          method: 'razorpay',
          metadata: {
            email: 'user@example.com',
            contact: '9999999999',
            name: 'User Name',
          },
        });
      } catch (txnError) {
        console.error('Error recording failed transaction:', txnError);
      }
      
      if (error.code === 'PAYMENT_CANCELLED') {
        Alert.alert('Payment Cancelled', 'Payment was cancelled by user.');
      } else {
        Alert.alert('Payment Failed', 'Something went wrong with the payment. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Update subscription status via API
  const updateSubscriptionStatus = async (paymentId: string) => {
    try {
      console.log('Updating subscription status via API:', { paymentId, plan: selectedPlan });
      
      // Call subscription API to activate subscription
      const response = await subscriptionApi.subscribe({
        planId: selectedPlan === 'monthly' ? 'monthly_pro' : 'yearly_pro',
        paymentMethod: 'razorpay',
        autoRenew: true,
      });
      
      console.log('✅ Subscription activated via API:', response.data);
      
      // Refresh subscription status
      await loadSubscriptionData();
      
    } catch (error) {
      console.error('❌ Error updating subscription via API:', error);
      
      // Fallback: Update local state even if API fails
      console.log('Using fallback: updating local subscription state');
      setIsSubscribed(true);
    }
  };

  const FeatureItem = ({ text, included = true }: { text: string; included?: boolean }) => (
    <View style={styles.featureItem}>
      <Icon 
        name={included ? 'check-circle' : 'remove-circle'} 
        size={20} 
        color={included ? '#28a745' : '#dc3545'} 
      />
      <Text style={[
        styles.featureText, 
        { color: theme.colors.text },
        !included && { color: theme.colors.textSecondary }
      ]}>
        {text}
      </Text>
    </View>
  );

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
       <LinearGradient
         colors={['#667eea', '#764ba2']}
         style={[styles.header, { paddingTop: insets.top + responsiveSpacing.sm }]}
       >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
                 <View style={styles.headerContent}>
           <Text style={styles.headerTitle}>Upgrade to Pro</Text>
           <Text style={styles.headerSubtitle}>
             Unlock unlimited possibilities
           </Text>
           <View style={styles.statusContainer}>
             {apiLoading ? (
               <View style={styles.loadingBadge}>
                 <ActivityIndicator size="small" color="#ffffff" />
                 <Text style={styles.loadingBadgeText}>Loading...</Text>
               </View>
             ) : apiError ? (
               <View style={styles.errorBadge}>
                 <Text style={styles.errorBadgeText}>OFFLINE MODE</Text>
               </View>
             ) : (
               <View style={styles.demoBadge}>
                 <Text style={styles.demoBadgeText}>DEMO MODE</Text>
               </View>
             )}
           </View>
         </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Plan Selector */}
        <View style={[styles.planSelector, { backgroundColor: theme.colors.cardBackground }]}>
          <TouchableOpacity
            style={[
              styles.planOption,
              selectedPlan === 'monthly' && styles.planOptionSelected
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text style={[
              styles.planOptionText,
              { color: theme.colors.textSecondary },
              selectedPlan === 'monthly' && styles.planOptionTextSelected
            ]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.planOption,
              selectedPlan === 'yearly' && styles.planOptionSelected
            ]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <View style={styles.yearlyBadge}>
              <Text style={styles.yearlyBadgeText}>BEST VALUE</Text>
            </View>
            <Text style={[
              styles.planOptionText,
              { color: theme.colors.textSecondary },
              selectedPlan === 'yearly' && styles.planOptionTextSelected
            ]}>
              Yearly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comparison Cards */}
        <View style={styles.comparisonContainer}>
          {/* Free Plan Card */}
          <View style={[styles.planCard, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: theme.colors.text }]}>Free</Text>
              <Text style={styles.planPrice}>₹0</Text>
              <Text style={[styles.planPeriod, { color: theme.colors.textSecondary }]}>forever</Text>
            </View>
            
            <View style={styles.featuresList}>
              <FeatureItem text="5 posters per month" included={true} />
              <FeatureItem text="Basic templates" included={true} />
              <FeatureItem text="Standard resolution" included={true} />
              <FeatureItem text="Community support" included={true} />
              <FeatureItem text="Premium templates" included={false} />
              <FeatureItem text="No watermarks" included={false} />
              <FeatureItem text="High-resolution exports" included={false} />
              <FeatureItem text="Priority support" included={false} />
            </View>
          </View>

          {/* Pro Plan Card */}
          <View style={[styles.proCard, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: theme.colors.text }]}>Pro</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.planPrice}>{currentPlan.price}</Text>
                <Text style={[styles.originalPrice, { color: theme.colors.textSecondary }]}>{currentPlan.originalPrice}</Text>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{currentPlan.savings}</Text>
                </View>
              </View>
              <Text style={[styles.planPeriod, { color: theme.colors.textSecondary }]}>per {currentPlan.period}</Text>
            </View>
            
            <View style={styles.featuresList}>
              {currentPlan.features.map((feature, index) => (
                <FeatureItem key={index} text={feature} included={true} />
              ))}
            </View>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={[styles.benefitsSection, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.benefitsTitle, { color: theme.colors.text }]}>Why Upgrade to Pro?</Text>
          <View style={styles.benefitsGrid}>
                         <View style={[styles.benefitItem, { backgroundColor: theme.colors.inputBackground }]}>
               <Icon name="infinity" size={isSmallScreen ? 28 : isMediumScreen ? 30 : 32} color="#667eea" />
               <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>Unlimited</Text>
               <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>Create unlimited posters</Text>
             </View>
             <View style={[styles.benefitItem, { backgroundColor: theme.colors.inputBackground }]}>
               <Icon name="star" size={isSmallScreen ? 28 : isMediumScreen ? 30 : 32} color="#667eea" />
               <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>Premium</Text>
               <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>Access premium templates</Text>
             </View>
             <View style={[styles.benefitItem, { backgroundColor: theme.colors.inputBackground }]}>
               <Icon name="hd" size={isSmallScreen ? 28 : isMediumScreen ? 30 : 32} color="#667eea" />
               <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>HD Quality</Text>
               <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>High-resolution exports</Text>
             </View>
             <View style={[styles.benefitItem, { backgroundColor: theme.colors.inputBackground }]}>
               <Icon name="support-agent" size={isSmallScreen ? 28 : isMediumScreen ? 30 : 32} color="#667eea" />
               <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>Priority</Text>
               <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>Priority customer support</Text>
             </View>
          </View>
        </View>

                 {/* Bottom Spacer for Sticky Button */}
         <View style={{ height: 140 }} />
      </ScrollView>

             {/* Sticky Upgrade Button */}
       <View style={[
         styles.stickyButtonContainer, 
         { 
           backgroundColor: theme.colors.cardBackground,
           borderTopColor: theme.colors.border,
           paddingBottom: Math.max(insets.bottom + responsiveSpacing.md, responsiveSpacing.lg)
         }
       ]}>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handlePayment}
          disabled={isProcessing || isSubscribed}
        >
          <LinearGradient
            colors={isSubscribed 
              ? ['#28a745', '#20c997'] 
              : isProcessing 
                ? ['#cccccc', '#999999'] 
                : ['#667eea', '#764ba2']
            }
            style={styles.upgradeButtonGradient}
          >
            <Icon 
              name={isSubscribed ? 'check-circle' : 'upgrade'} 
              size={24} 
              color="#ffffff" 
            />
                         <Text style={styles.upgradeButtonText}>
               {isSubscribed 
                 ? 'Already Pro' 
                 : isProcessing 
                   ? 'Processing...' 
                   : `Demo: Upgrade to Pro - ${currentPlan.price}`
               }
             </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {!isSubscribed && (
          <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
            By upgrading, you agree to our Terms of Service and Privacy Policy
          </Text>
        )}
        
        {/* Transaction History Button */}
        <TouchableOpacity
          style={[styles.transactionHistoryButton, { backgroundColor: theme.colors.inputBackground }]}
          onPress={() => navigation.navigate('TransactionHistory' as never)}
        >
          <Icon name="receipt-long" size={20} color={theme.colors.text} />
          <Text style={[styles.transactionHistoryButtonText, { color: theme.colors.text }]}>
            View Transaction History ({transactionStats.total})
          </Text>
          <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: responsiveSpacing.md,
    paddingBottom: responsiveSpacing.sm,
    borderBottomWidth: 0,
    zIndex: 1000,
    elevation: 10,
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize.xxl,
    fontWeight: '700',
    color: '#ffffff',
  },
     headerSubtitle: {
     fontSize: responsiveFontSize.sm,
     color: 'rgba(255, 255, 255, 0.8)',
     marginTop: 2,
   },
   statusContainer: {
     marginTop: 8,
   },
   demoBadge: {
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     paddingHorizontal: 12,
     paddingVertical: 4,
     borderRadius: 12,
   },
   demoBadgeText: {
     fontSize: responsiveFontSize.xs,
     fontWeight: '700',
     color: '#ffffff',
     textAlign: 'center',
   },
   loadingBadge: {
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     paddingHorizontal: 12,
     paddingVertical: 4,
     borderRadius: 12,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
   },
   loadingBadgeText: {
     fontSize: responsiveFontSize.xs,
     fontWeight: '700',
     color: '#ffffff',
     marginLeft: 4,
   },
   errorBadge: {
     backgroundColor: 'rgba(220, 53, 69, 0.8)',
     paddingHorizontal: 12,
     paddingVertical: 4,
     borderRadius: 12,
   },
   errorBadgeText: {
     fontSize: responsiveFontSize.xs,
     fontWeight: '700',
     color: '#ffffff',
     textAlign: 'center',
   },
   headerSpacer: {
     width: 44,
   },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: responsiveSpacing.md,
  },
  planSelector: {
    flexDirection: 'row',
    borderRadius: responsiveSpacing.md,
    padding: 4,
    marginBottom: responsiveSpacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planOption: {
    flex: 1,
    paddingVertical: responsiveSpacing.sm,
    paddingHorizontal: responsiveSpacing.md,
    borderRadius: responsiveSpacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  planOptionSelected: {
    backgroundColor: '#667eea',
  },
  planOptionText: {
    fontSize: responsiveFontSize.md,
    fontWeight: '600',
  },
  planOptionTextSelected: {
    color: '#ffffff',
  },
  yearlyBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  yearlyBadgeText: {
    fontSize: responsiveFontSize.xs,
    fontWeight: '700',
    color: '#ffffff',
  },
  comparisonContainer: {
    flexDirection: screenWidth < 600 ? 'column' : 'row',
    gap: responsiveSpacing.md,
    marginBottom: responsiveSpacing.xl,
  },
  planCard: {
    flex: 1,
    borderRadius: responsiveSpacing.lg,
    padding: responsiveSpacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    minHeight: isSmallScreen ? 400 : isMediumScreen ? 450 : 500,
  },
  proCard: {
    flex: 1,
    borderRadius: responsiveSpacing.lg,
    padding: responsiveSpacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    position: 'relative',
    minHeight: isSmallScreen ? 400 : isMediumScreen ? 450 : 500,
  },
  proBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -30,
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  proBadgeText: {
    fontSize: responsiveFontSize.sm,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: responsiveSpacing.lg,
  },
  planName: {
    fontSize: responsiveFontSize.xxl,
    fontWeight: '700',
    marginBottom: responsiveSpacing.xs,
  },
  priceContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  planPrice: {
    fontSize: responsiveFontSize.xxxl,
    fontWeight: '700',
    color: '#667eea',
  },
  originalPrice: {
    fontSize: responsiveFontSize.md,
    fontWeight: '400',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  savingsBadge: {
    position: 'absolute',
    top: -12,
    right: -35,
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: responsiveFontSize.xs,
    fontWeight: '700',
    color: '#ffffff',
  },
  planPeriod: {
    fontSize: responsiveFontSize.sm,
    marginTop: 4,
  },
  featuresList: {
    gap: responsiveSpacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
  },
  featureText: {
    fontSize: responsiveFontSize.sm,
    flex: 1,
  },
  benefitsSection: {
    borderRadius: responsiveSpacing.lg,
    padding: responsiveSpacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitsTitle: {
    fontSize: responsiveFontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: responsiveSpacing.lg,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveSpacing.md,
    justifyContent: 'center',
  },
  benefitItem: {
    width: screenWidth < 600 ? screenWidth - (responsiveSpacing.md * 4) : (screenWidth - 88) / 2,
    alignItems: 'center',
    padding: responsiveSpacing.md,
    borderRadius: responsiveSpacing.md,
    minHeight: isSmallScreen ? 100 : isMediumScreen ? 110 : 120,
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: responsiveFontSize.md,
    fontWeight: '600',
    marginTop: responsiveSpacing.xs,
    marginBottom: 4,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: responsiveFontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: responsiveSpacing.md,
    paddingTop: responsiveSpacing.md,
    borderTopWidth: 1,
  },
  upgradeButton: {
    borderRadius: responsiveSpacing.md,
    overflow: 'hidden',
    marginBottom: responsiveSpacing.sm,
  },
  upgradeButtonGradient: {
    paddingVertical: responsiveSpacing.sm,
    paddingHorizontal: responsiveSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: responsiveFontSize.lg,
    fontWeight: '700',
    marginLeft: responsiveSpacing.sm,
  },
  termsText: {
    fontSize: responsiveFontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  transactionHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
    borderRadius: responsiveSpacing.md,
    marginTop: responsiveSpacing.sm,
  },
  transactionHistoryButtonText: {
    fontSize: responsiveFontSize.sm,
    fontWeight: '600',
    flex: 1,
    marginLeft: responsiveSpacing.sm,
  },
});

export default SubscriptionScreen;
