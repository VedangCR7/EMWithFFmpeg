import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { loginAPIs } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation rules
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
};

// Input sanitization function
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, '');
};

// Create a stable FloatingInput component outside the main component
const FloatingInput = React.memo(({ 
  label, 
  value, 
  onChangeText, 
  onFocus, 
  onBlur, 
  isFocused, 
  theme,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  testID,
  error = false
}: any) => (
  <View style={styles.inputContainer}>
         <Text style={[
       styles.floatingLabel, 
       { color: (isFocused || value) ? theme.colors.primary : theme.colors.textSecondary },
       (isFocused || value) && styles.floatingLabelFocused,
       error && styles.floatingLabelError
     ]}>
       {label}
     </Text>
           <TextInput
         style={[
           styles.input, 
           { 
             borderColor: error ? theme.colors.error : (isFocused || value) ? theme.colors.primary : theme.colors.border,
             backgroundColor: theme.colors.inputBackground,
             color: theme.colors.text
           },
           (isFocused || value) && styles.inputFocused
         ]}
              value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={theme.colors.textSecondary}
        blurOnSubmit={false}
        returnKeyType="next"
        autoCorrect={false}
        spellCheck={false}
        textContentType="none"
        testID={testID}
        accessibilityLabel={label}
    />
  </View>
));

const LoginScreen: React.FC = ({ navigation }: any) => {
  const { isDarkMode, theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Email validation function
  const validateEmail = useCallback((email: string): boolean => {
    const sanitizedEmail = sanitizeInput(email);
    if (!sanitizedEmail) {
      setEmailError('Email is required');
      return false;
    }
    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  }, []);

  // Password validation function
  const validatePassword = useCallback((password: string): boolean => {
    const sanitizedPassword = sanitizeInput(password);
    if (!sanitizedPassword) {
      setPasswordError('Password is required');
      return false;
    }
    if (sanitizedPassword.length < PASSWORD_MIN_LENGTH) {
      setPasswordError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      return false;
    }
    setPasswordError('');
    return true;
  }, []);

  const handleSignIn = useCallback(async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    
    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      setErrorMessage('Please fix the validation errors');
      setShowErrorModal(true);
      return;
    }

    console.log('🔐 Attempting login with:', { email: email.trim(), passwordLength: password.length });
    setIsLoading(true);
    try {
      const result = await loginAPIs.loginUser({
        email: sanitizeInput(email.trim()),
        password: sanitizeInput(password.trim()),
        rememberMe,
      });
      
      console.log('✅ Login successful:', result);
      // Navigation will be handled automatically by auth state change
      // No need to show success alert as user will be redirected
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      const errorMsg = error.response?.data?.message || error.message || 'Sign in failed. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [email, password, rememberMe]);

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent" 
        translucent 
      />
      
      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Image 
                source={require('../assets/MainLogo/main_logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue your journey</Text>
            </View>

            {/* Form */}
            <View style={[styles.formContainer, { backgroundColor: theme.colors.cardBackground }]}>
              <FloatingInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => {
                  setEmailFocused(false);
                  validateEmail(email);
                }}
                isFocused={emailFocused}
                theme={theme}
                keyboardType="email-address"
                testID="email-input"
                error={!!emailError}
              />
              {emailError ? (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {emailError}
                </Text>
              ) : null}

              {/* Password Input with Eye Button */}
              <View style={styles.inputContainer}>
                <Text style={[
                  styles.floatingLabel, 
                  { color: (passwordFocused || password) ? theme.colors.primary : theme.colors.textSecondary },
                  (passwordFocused || password) && styles.floatingLabelFocused
                ]}>
                  Password
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput, 
                      { 
                        borderColor: passwordError ? theme.colors.error : (passwordFocused || password) ? theme.colors.primary : theme.colors.border,
                        backgroundColor: theme.colors.inputBackground,
                        color: theme.colors.text
                      },
                      (passwordFocused || password) && styles.inputFocused
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => {
                      setPasswordFocused(false);
                      validatePassword(password);
                    }}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={theme.colors.textSecondary}
                    blurOnSubmit={false}
                    returnKeyType="next"
                    autoCorrect={false}
                    autoCapitalize="none"
                    testID="password-input"
                    accessibilityLabel="Password"
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    testID="password-visibility-toggle"
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <Icon 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={22} 
                      color={theme.colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {passwordError ? (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {passwordError}
                </Text>
              ) : null}

              {/* Remember Me Checkbox */}
              <TouchableOpacity 
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
                testID="remember-me-checkbox"
              >
                <View style={[
                  styles.checkbox,
                  { 
                    borderColor: theme.colors.border,
                    backgroundColor: rememberMe ? theme.colors.primary : theme.colors.inputBackground
                  }
                ]}>
                  {rememberMe && (
                    <Icon name="check" size={16} color="#ffffff" />
                  )}
                </View>
                <Text style={[styles.rememberMeText, { color: theme.colors.text }]}>
                  Remember me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.signInButton, 
                  { backgroundColor: theme.colors.buttonPrimary },
                  isLoading && styles.buttonDisabled
                ]} 
                onPress={handleSignIn}
                disabled={isLoading}
                testID="sign-in-button"
                accessibilityLabel="Sign in button"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" testID="loading-indicator" />
                ) : (
                  <Text style={[styles.signInButtonText, { color: '#ffffff' }]}>
                    SIGN IN
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Registration')}
                  testID="sign-up-link"
                  accessibilityLabel="Sign up"
                >
                  <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Privacy Policy Link */}
              <View style={styles.privacyFooter}>
                <Text style={[styles.privacyFooterText, { color: theme.colors.textSecondary }]}>
                  By signing in, you agree to our{' '}
                </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('PrivacyPolicy')}
                  testID="privacy-policy-link"
                  accessibilityLabel="Privacy policy"
                >
                  <Text style={[styles.privacyFooterLink, { color: theme.colors.primary }]}>
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

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
          testID="error-modal-overlay"
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
                  testID="close-error-modal"
                  accessibilityLabel="Close error modal"
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
                testID="error-modal-ok-button"
                accessibilityLabel="OK"
              >
                <Text style={styles.errorModalButtonText}>OK</Text>
              </TouchableOpacity>
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
  gradientBackground: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: screenHeight * 0.05,
    paddingBottom: screenHeight * 0.05,
  },
  header: {
    alignItems: 'center',
    marginBottom: screenHeight * 0.05,
  },
  logo: {
    width: screenWidth * 0.5,
    height: screenWidth * 0.5,
    marginBottom: screenHeight * 0.0,
  },
  title: {
    fontSize: Math.min(screenWidth * 0.08, 32),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: screenHeight * 0.01,
  },
  subtitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 20,
    padding: screenWidth * 0.05,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: screenHeight * 0.02,
  },
  floatingLabel: {
    position: 'absolute',
    left: screenWidth * 0.02,
    top: screenHeight * 0.015,
    fontSize: Math.min(screenWidth * 0.04, 16),
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  floatingLabelFocused: {
    top: screenHeight * 0.005,
    fontSize: Math.min(screenWidth * 0.03, 12),
    fontWeight: '600',
  },
  floatingLabelError: {
    color: '#ff4444',
  },
  errorText: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    marginTop: screenHeight * 0.005,
    marginLeft: screenWidth * 0.02,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenHeight * 0.02,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: screenWidth * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
  },
  input: {
    borderWidth: 1,
    borderRadius: responsiveSize.inputBorderRadius,
    paddingHorizontal: responsiveSize.inputPaddingHorizontal,
    paddingVertical: responsiveSize.buttonPaddingVertical,
    fontSize: responsiveText.body,
    fontWeight: '500',
  },
  inputFocused: {
    borderWidth: 2,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: responsiveSize.inputBorderRadius,
    paddingHorizontal: responsiveSize.inputPaddingHorizontal,
    paddingVertical: responsiveSize.buttonPaddingVertical,
    paddingRight: screenWidth * 0.12,
    fontSize: responsiveText.body,
    fontWeight: '500',
  },
  eyeButton: {
    position: 'absolute',
    right: screenWidth * 0.03,
    top: '50%',
    transform: [{ translateY: -11 }],
    padding: 5,
  },
  signInButton: {
    borderRadius: responsiveSize.buttonBorderRadius,
    paddingVertical: responsiveSize.buttonPaddingVertical,
    alignItems: 'center',
    marginBottom: Math.max(responsiveSpacing.md, screenHeight * 0.015),
    ...responsiveShadow.large,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
  },
  footerLink: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: '600',
  },
  privacyFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: screenHeight * 0.02,
    paddingHorizontal: screenWidth * 0.05,
  },
  privacyFooterText: {
    fontSize: Math.min(screenWidth * 0.032, 12),
    textAlign: 'center',
  },
  privacyFooterLink: {
    fontSize: Math.min(screenWidth * 0.032, 12),
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Error Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContainer: {
    width: screenWidth * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    padding: screenWidth * 0.06,
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
    marginBottom: screenHeight * 0.02,
    position: 'relative',
  },
  errorIconContainer: {
    width: Math.min(screenWidth * 0.18, 72),
    height: Math.min(screenWidth * 0.18, 72),
    borderRadius: Math.min(screenWidth * 0.09, 36),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: screenHeight * 0.015,
  },
  errorModalTitle: {
    fontSize: Math.min(screenWidth * 0.06, 24),
    fontWeight: '700',
    textAlign: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: -screenHeight * 0.01,
    right: -screenWidth * 0.02,
    width: Math.min(screenWidth * 0.08, 32),
    height: Math.min(screenWidth * 0.08, 32),
    borderRadius: Math.min(screenWidth * 0.04, 16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContent: {
    marginBottom: screenHeight * 0.025,
  },
  errorModalMessage: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.06, 24),
  },
  errorModalButton: {
    paddingVertical: screenHeight * 0.018,
    borderRadius: 12,
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
    fontSize: Math.min(screenWidth * 0.042, 17),
    fontWeight: '600',
  },
});

export default LoginScreen; 