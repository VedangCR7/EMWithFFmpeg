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
    await loginAPIs.verifyResetCode({ email, code });
    navigation.navigate('ResetPassword', { email, code });
  }, [email, navigation]);

  const handleResend = useCallback(async () => {
    await loginAPIs.requestPasswordReset({ email });
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

