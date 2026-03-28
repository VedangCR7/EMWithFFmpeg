import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { getUserFriendlyError } from '../utils/errorHandler';

interface OtpVerificationComponentProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  title: string;
  subtitle: string;
  buttonText: string;
  resendCooldown?: number;
}

const OtpVerificationComponent: React.FC<OtpVerificationComponentProps> = ({
  email,
  onVerify,
  onResend,
  title,
  subtitle,
  buttonText,
  resendCooldown = 60,
}) => {
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // OTP expiry timer state
  const OTP_EXPIRY_DURATION = 300; // 5 minutes
  const [otpExpiryTimer, setOtpExpiryTimer] = useState(OTP_EXPIRY_DURATION);
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const backgroundTimestampRef = useRef<number | null>(null);

  const isCodeValid = useMemo(() => /^\d{6}$/.test(code), [code]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // OTP expiry timer with background/foreground handling
  useEffect(() => {
    // Handle OTP expiry
    if (otpExpiryTimer <= 0) {
      setIsOtpExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setOtpExpiryTimer((prev) => {
        if (prev <= 1) {
          setIsOtpExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiryTimer]);

  // Background/foreground handling for OTP expiry timer
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        // Store timestamp when app goes to background
        backgroundTimestampRef.current = Date.now();
      } else if (nextAppState === 'active' && backgroundTimestampRef.current) {
        // Calculate elapsed time when app returns to foreground
        const elapsedSeconds = Math.floor((Date.now() - backgroundTimestampRef.current) / 1000);
        backgroundTimestampRef.current = null;

        // Adjust OTP expiry timer
        setOtpExpiryTimer((prev) => {
          const newTimer = Math.max(0, prev - elapsedSeconds);
          if (newTimer <= 0) {
            setIsOtpExpired(true);
          }
          return newTimer;
        });

        // Adjust resend timer as well
        setResendTimer((prev) => Math.max(0, prev - elapsedSeconds));
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, []);

  const handleVerify = useCallback(async () => {
    if (!isCodeValid) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your email.');
      return;
    }

    if (isOtpExpired) {
      Alert.alert('Code Expired', 'Verification code expired. Please request a new code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onVerify(code);
    } catch (error: any) {
      const message = getUserFriendlyError(error);
      Alert.alert('Verification Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [code, isCodeValid, isOtpExpired, onVerify]);

  const handleResend = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onResend();
      Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
      setResendTimer(resendCooldown);
      // Reset OTP expiry timer
      setOtpExpiryTimer(OTP_EXPIRY_DURATION);
      setIsOtpExpired(false);
    } catch (error: any) {
      const message = getUserFriendlyError(error);
      Alert.alert('Resend Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [onResend, resendCooldown]);

  const formatResendTimer = useCallback(() => {
    const minutes = Math.floor(resendTimer / 60);
    const seconds = resendTimer % 60;
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  }, [resendTimer]);

  // Format time for OTP expiry timer
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={theme.colors.gradient} style={styles.gradient}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
              {'\n'}
              <Text style={styles.boldText}>{email}</Text>
            </Text>

            {/* OTP expiry timer */}
            {otpExpiryTimer > 0 && (
              <View style={styles.timerContainer}>
                <Text style={[styles.timerText, { color: theme.colors.textSecondary }]}>
                  Code expires in {formatTime(otpExpiryTimer)}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.codeInput,
                  {
                    borderColor: (isFocused || code) ? theme.colors.primary : theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.text,
                  },
                ]}
                keyboardType="numeric"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="000000"
                placeholderTextColor={theme.colors.textSecondary}
                textAlign="center"
                autoFocus
                editable={!isSubmitting}
              />
            </View>

            {/* Expiry message */}
            {isOtpExpired && (
              <View style={styles.expiryMessageContainer}>
                <Text style={[styles.expiryMessageText, { color: theme.colors.error }]}>
                  Verification code expired. Please request a new code.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.verifyButton,
                {
                  backgroundColor: isCodeValid && !isSubmitting && !isOtpExpired ? theme.colors.primary : theme.colors.textSecondary,
                },
              ]}
              onPress={handleVerify}
              disabled={!isCodeValid || isSubmitting || isOtpExpired}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>{buttonText}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
                Didn't receive the code?
              </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendTimer > 0 || isSubmitting}
              >
                <Text
                  style={[
                    styles.resendButton,
                    {
                      color: resendTimer > 0 || isSubmitting ? theme.colors.textSecondary : theme.colors.primary,
                    },
                  ]}
                >
                  {resendTimer > 0 ? `Resend in ${formatResendTimer()}` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  expiryMessageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  expiryMessageText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  codeInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 8,
    textAlign: 'center',
  },
  verifyButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    marginBottom: 4,
  },
  resendButton: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OtpVerificationComponent;
