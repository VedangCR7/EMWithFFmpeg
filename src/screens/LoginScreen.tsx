import React, { useState, useCallback, useMemo, useRef } from 'react';
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
  Keyboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import loginAPIs from '../services/loginAPIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserFriendlyError } from '../utils/errorHandler';
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
  inputRef,
  returnKeyType = 'next',
  onSubmitEditing,
  blurOnSubmit = false,
}: any) => (
  <View style={styles.inputContainer}>
         <Text style={[
       styles.floatingLabel, 
       { color: (isFocused || value) ? theme.colors.primary : theme.colors.textSecondary },
       (isFocused || value) && styles.floatingLabelFocused
     ]}>
       {label}
     </Text>
           <TextInput
        ref={inputRef}
         style={[
           styles.input, 
           { 
             borderColor: (isFocused || value) ? theme.colors.primary : theme.colors.border,
             backgroundColor: theme.colors.inputBackground,
             color: theme.colors.text
           },
           (isFocused || value) && styles.inputFocused
         ]}
              value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder=" "
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={theme.colors.textSecondary}
        blurOnSubmit={blurOnSubmit}
        returnKeyType={returnKeyType}
        autoCorrect={false}
        spellCheck={false}
        textContentType="none"
        onSubmitEditing={onSubmitEditing}
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
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const registerInputRef = (field: string) => (ref: TextInput | null) => {
    inputRefs.current[field] = ref;
  };

  const focusField = (field: string) => {
    const ref = inputRefs.current[field];
    if (ref) {
      ref.focus();
    }
  };

  const handleSubmitEditing = (nextField?: string, action?: () => void) => () => {
    if (nextField) {
      focusField(nextField);
    } else if (action) {
      action();
    } else {
      Keyboard.dismiss();
    }
  };

  const handleSignIn = useCallback(async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      setShowErrorModal(true);
      return;
    }

    console.log('🔐 Attempting login with:', { email: email.trim(), passwordLength: password.length });
    setIsLoading(true);
    try {
      const result = await loginAPIs.loginUser({
        email: email.trim(),
        password: password.trim(),
      });
      
      // Handle verification requirement
      if (result.requiresVerification) {
        // Navigate to email verification screen without storing token
        navigation.navigate('EmailVerification', { email: email.trim() });
        return;
      }
      
      console.log('✅ Login successful:', result);
      // Navigation will be handled automatically by auth state change
      // No need to show success alert as user will be redirected
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      const message = getUserFriendlyError(error);
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);






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
              <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Sign in to continue your journey</Text>
            </View>

            {/* Form */}
            <View style={[styles.formContainer, { backgroundColor: theme.colors.cardBackground }]}>
              <FloatingInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                isFocused={emailFocused}
                theme={theme}
                keyboardType="email-address"
                inputRef={registerInputRef('email')}
                returnKeyType="next"
                onSubmitEditing={handleSubmitEditing('password')}
              />

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
                    ref={registerInputRef('password')}
                    style={[
                      styles.passwordInput, 
                      { 
                        borderColor: (passwordFocused || password) ? theme.colors.primary : theme.colors.border,
                        backgroundColor: theme.colors.inputBackground,
                        color: theme.colors.text
                      },
                      (passwordFocused || password) && styles.inputFocused
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={theme.colors.textSecondary}
                    blurOnSubmit={false}
                    returnKeyType="done"
                    autoCorrect={false}
                    autoCapitalize="none"
                    onSubmitEditing={handleSubmitEditing(undefined, handleSignIn)}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Icon 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={22} 
                      color={theme.colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.forgotPasswordWrapper}
                onPress={() => navigation.navigate('ForgotPassword')}
                activeOpacity={0.8}
              >
                <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                  Forgot Password?
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
              >
                <Text style={[styles.signInButtonText, { color: '#ffffff' }]}>
                  {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
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
                <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
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
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when tapping inside modal
          >
            <View style={[styles.errorModalContainer, { backgroundColor: theme.colors.surface }]}>
              {/* Header with warning icon and close button */}
              <View style={styles.errorModalHeader}>
                {/* Close button (X) positioned top-right */}
                <TouchableOpacity 
                  style={[styles.closeModalButton, { backgroundColor: theme.colors.inputBackground }]}
                  onPress={() => setShowErrorModal(false)}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={Math.min(screenWidth * 0.06, 24)} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              {/* Warning icon centered at top */}
              <View style={[styles.errorIconContainer, { backgroundColor: '#ffaa0030' }]}>
                <Icon name="warning-amber" size={Math.min(screenWidth * 0.08, 32)} color="#ffaa00" />
              </View>
              
              {/* Title */}
              <Text 
                style={[styles.errorModalTitle, { color: theme.colors.text }]}
              >
                {errorMessage.includes('registration') || errorMessage.includes('register') || errorMessage.includes('resource') && errorMessage.includes('not found') ? 'Registration Required' : 'Error'}
              </Text>
              
              {/* Message */}
              <View style={styles.errorModalContent}>
                <Text style={[styles.errorModalMessage, { color: theme.colors.textSecondary }]}>
                  {errorMessage.includes('registration') || errorMessage.includes('register') || errorMessage.includes('resource') && errorMessage.includes('not found') ? 'Please register first to continue.' : errorMessage}
                </Text>
              </View>
              
              {/* Buttons Layout - Two buttons horizontally aligned */}
              <View style={styles.errorModalButtonsContainer}>
                {/* Cancel Button */}
                <TouchableOpacity 
                  style={[styles.errorModalCancelButton, { backgroundColor: theme.colors.inputBackground }]}
                  onPress={() => setShowErrorModal(false)}
                >
                  <Text style={[styles.errorModalCancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                
                {/* Register Now Button - shown for registration errors and resource not found errors */}
                {(errorMessage.includes('registration') || errorMessage.includes('register') || (errorMessage.includes('resource') && errorMessage.includes('not found'))) && (
                  <TouchableOpacity 
                    style={[styles.errorModalRegisterButton]}
                    onPress={() => {
                      setShowErrorModal(false);
                      navigation.navigate('Registration');
                    }}
                  >
                    <LinearGradient
                      colors={['#4A90E2', '#357ABD']}
                      style={styles.errorModalRegisterButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.errorModalRegisterButtonText}>Register Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                
                {/* OK Button - shown for non-registration errors */}
                {!(errorMessage.includes('registration') || errorMessage.includes('register') || (errorMessage.includes('resource') && errorMessage.includes('not found'))) && (
                  <TouchableOpacity 
                    style={[styles.errorModalButton, { backgroundColor: '#ff4444' }]}
                    onPress={() => setShowErrorModal(false)}
                  >
                    <Text style={styles.errorModalButtonText}>OK</Text>
                  </TouchableOpacity>
                )}
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
    marginBottom: screenHeight * 0.01,
  },
  subtitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
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
    paddingTop: screenWidth * 0.04,
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
    alignItems: 'flex-end',
    marginBottom: screenHeight * 0.01,
    height: Math.min(screenWidth * 0.08, 32),
  },
  errorIconContainer: {
    width: Math.min(screenWidth * 0.16, 64),
    height: Math.min(screenWidth * 0.16, 64),
    borderRadius: Math.min(screenWidth * 0.08, 32),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: screenHeight * 0.02,
  },
  errorModalTitle: {
    fontSize: Math.min(screenWidth * 0.055, 22),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: screenHeight * 0.015,
  },
  closeModalButton: {
    width: Math.min(screenWidth * 0.08, 32),
    height: Math.min(screenWidth * 0.08, 32),
    borderRadius: Math.min(screenWidth * 0.04, 16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContent: {
    marginBottom: screenHeight * 0.03,
    paddingHorizontal: screenWidth * 0.02,
  },
  errorModalMessage: {
    fontSize: Math.min(screenWidth * 0.038, 15),
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.055, 22),
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
  forgotPasswordWrapper: {
    alignSelf: 'flex-end',
    marginBottom: screenHeight * 0.02,
  },
  forgotPasswordText: {
    fontSize: Math.min(screenWidth * 0.032, 12),
    fontWeight: '600',
  },

  // Updated Error Modal Styles
  errorModalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: screenHeight * 0.02,
    gap: screenWidth * 0.03,
  },
  errorModalCancelButton: {
    flex: 1,
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
  errorModalCancelButtonText: {
    fontSize: Math.min(screenWidth * 0.042, 17),
    fontWeight: '600',
  },
  errorModalRegisterButton: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  errorModalRegisterButtonGradient: {
    flex: 1,
    paddingVertical: screenHeight * 0.018,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorModalRegisterButtonText: {
    color: '#FFFFFF',
    fontSize: Math.min(screenWidth * 0.042, 17),
    fontWeight: '600',
  },
});

export default LoginScreen; 