import React, { useCallback } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Alert } from 'react-native';
import loginAPIs from '../services/loginAPIs';
import authService from '../services/auth';
import OtpVerificationComponent from '../components/OtpVerificationComponent';
import { RootStackParamList } from '../navigation/AppNavigator';

type EmailVerificationNavigationProp = StackNavigationProp<RootStackParamList, 'EmailVerification'>;
type EmailVerificationRouteProp = RouteProp<RootStackParamList, 'EmailVerification'>;

type Props = {
  navigation: EmailVerificationNavigationProp;
  route: EmailVerificationRouteProp;
};

const EmailVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;

  const handleVerify = useCallback(async (code: string) => {
    // Call email verification API
    const response = await loginAPIs.verifyEmailCode({ email, otpCode: code });
    
    if (response.success && response.token) {
      // Save token and user data
      await authService.saveUserToStorage(response.user, response.token);
      authService.setCurrentUser(response.user);
      
      // Notify auth state listeners to trigger navigation
      authService.notifyAuthStateListeners(response.user);
      
      // Navigation will be handled automatically by auth state change
    } else {
      throw new Error('Email verification failed');
    }
  }, [email, navigation]);

  const handleResend = useCallback(async () => {
    await loginAPIs.resendEmailVerification({ email });
  }, [email]);

  return (
    <OtpVerificationComponent
      email={email}
      onVerify={handleVerify}
      onResend={handleResend}
      title="Verify Your Email"
      subtitle="Enter the 6-digit code sent to your email"
      buttonText="Verify Email"
      resendCooldown={60}
    />
  );
};

export default EmailVerificationScreen;
