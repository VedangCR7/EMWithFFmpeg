import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import loginAPIs from '../services/loginAPIs';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getUserFriendlyError } from '../utils/errorHandler';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;
type ForgotPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ForgotPassword'>;

type Props = {
  navigation: ForgotPasswordScreenNavigationProp;
  route: ForgotPasswordScreenRouteProp;
};

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'invalid_email' | 'success' | 'error'>('error');
  const [modalMessage, setModalMessage] = useState('');

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const isEmailValid = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email]);

  // Centralized modal content mapping
  const getModalContent = useCallback((type: typeof modalType, customMessage?: string) => {
    switch (type) {
      case 'invalid_email':
        return {
          title: 'Invalid Email',
          message: 'Please enter a valid email address.',
          icon: 'error' as const
        };
      case 'success':
        return {
          title: 'Code Sent',
          message: customMessage || 'We have sent a 6-digit verification code to your registered email.',
          icon: 'check-circle' as const
        };
      case 'error':
      default:
        return {
          title: 'Request Failed',
          message: customMessage || 'An error occurred. Please try again.',
          icon: 'error' as const
        };
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isEmailValid) {
      setModalType('invalid_email');
      setModalMessage('');
      setShowModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await loginAPIs.requestPasswordReset({ email: email.trim() });
      setModalType('success');
      setModalMessage('We have sent a 6-digit verification code to your registered email.');
      setShowModal(true);
    } catch (error: any) {
      const message = getUserFriendlyError(error);
      setModalType('error');
      setModalMessage(message);
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, isEmailValid, navigation]);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    if (modalType === 'success') {
      navigation.navigate('VerifyResetCode', { email: email.trim() });
    }
  }, [modalType, navigation, email]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={theme.colors.gradient} style={styles.gradient}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Forgot Password</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter your registered email address. We'll send you a 6-digit verification code.
            </Text>

            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.label,
                  {
                    color: (isFocused || email) ? theme.colors.primary : theme.colors.textSecondary,
                    top: (isFocused || email) ? 4 : 18,
                    fontSize: (isFocused || email) ? 12 : 14,
                    backgroundColor: theme.colors.cardBackground,
                  },
                ]}
              >
                Email Address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: (isFocused || email) ? theme.colors.primary : theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.text,
                  },
                ]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder=" "
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isEmailValid ? theme.colors.buttonPrimary : theme.colors.border,
                  opacity: isSubmitting ? 0.7 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={!isEmailValid || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
              <Text style={[styles.backLinkText, { color: theme.colors.primary }]}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Custom Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
        statusBarTranslucent={true}
      >
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={handleModalClose}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when tapping inside modal
          >
            <View style={{
              width: screenWidth * 0.85,
              maxWidth: 400,
              borderRadius: 20,
              padding: screenWidth * 0.06,
              backgroundColor: theme.colors.surface,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 8,
            }}>
              {/* Header with icon and close button */}
              <View style={{
                alignItems: 'flex-end',
                marginBottom: screenHeight * 0.01,
                height: Math.min(screenWidth * 0.08, 32),
              }}>
                {/* Close button (X) positioned top-right */}
                <TouchableOpacity 
                  style={{
                    width: Math.min(screenWidth * 0.08, 32),
                    height: Math.min(screenWidth * 0.08, 32),
                    borderRadius: Math.min(screenWidth * 0.04, 16),
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: theme.colors.inputBackground,
                  }}
                  onPress={handleModalClose}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={Math.min(screenWidth * 0.06, 24)} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              {/* Icon */}
              <Icon 
                name={getModalContent(modalType, modalMessage).icon} 
                size={Math.min(screenWidth * 0.12, 48)} 
                color={modalType === 'success' ? '#4CAF50' : theme.colors.primary} 
                style={{
                  alignSelf: 'center',
                  marginBottom: screenHeight * 0.02,
                }}
              />
              
              {/* Title */}
              <Text 
                style={{
                  fontSize: Math.min(screenWidth * 0.055, 22),
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: screenHeight * 0.015,
                  color: theme.colors.text,
                }}
              >
                {getModalContent(modalType, modalMessage).title}
              </Text>
              
              {/* Message */}
              <View style={{
                marginBottom: screenHeight * 0.03,
                paddingHorizontal: screenWidth * 0.02,
              }}>
                <Text style={{
                  fontSize: Math.min(screenWidth * 0.038, 15),
                  textAlign: 'center',
                  lineHeight: Math.min(screenWidth * 0.055, 22),
                  color: theme.colors.textSecondary,
                }}>
                  {getModalContent(modalType, modalMessage).message}
                </Text>
              </View>
              
              {/* Button */}
              <View style={{ justifyContent: 'center' }}>
                <TouchableOpacity 
                  style={{
                    paddingVertical: screenHeight * 0.018,
                    borderRadius: 12,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    backgroundColor: modalType === 'success' ? '#4CAF50' : theme.colors.primary,
                    paddingHorizontal: screenWidth * 0.08,
                  }}
                  onPress={handleModalClose}
                >
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: Math.min(screenWidth * 0.042, 17),
                    fontWeight: '600',
                  }}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;

