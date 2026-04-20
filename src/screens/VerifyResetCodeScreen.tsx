import React, { useCallback } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import loginAPIs from '../services/loginAPIs';
import OtpVerificationComponent from '../components/OtpVerificationComponent';
import { RootStackParamList } from '../navigation/AppNavigator';

type VerifyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VerifyResetCode'>;
type VerifyScreenRouteProp = RouteProp<RootStackParamList, 'VerifyResetCode'>;

type Props = {
  navigation: VerifyScreenNavigationProp;
  route: VerifyScreenRouteProp;
};

const VerifyResetCodeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;

  const handleVerify = useCallback(async (code: string) => {
    console.log('api', { email, code });
    
    await loginAPIs.verifyResetCode({ email, code });
    
    console.log('Response', 'Code verified');
    
    navigation.navigate('ResetPassword', { email, code });
  }, [email, navigation]);

  const handleResend = useCallback(async () => {
    console.log('api', { email });
    
    await loginAPIs.requestPasswordReset({ email });
    
    console.log('Response', 'Reset requested');
  }, [email]);

  return (
    <OtpVerificationComponent
      email={email}
      onVerify={handleVerify}
      onResend={handleResend}
      title="Verify Code"
      subtitle="Enter the 6-digit code we sent to"
      buttonText="Verify Code"
      resendCooldown={60}
    />
  );
};

export default VerifyResetCodeScreen;

