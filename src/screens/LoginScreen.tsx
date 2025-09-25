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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { loginAPIs } from '../services';
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
  autoCapitalize = 'none'
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
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={theme.colors.textSecondary}
        blurOnSubmit={false}
        returnKeyType="next"
        autoCorrect={false}
        spellCheck={false}
        textContentType="none"
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

  const handleSignIn = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginAPIs.loginUser({
        email: email.trim(),
        password: password.trim(),
      });
      
      // Navigation will be handled automatically by auth state change
      // No need to show success alert as user will be redirected
    } catch (error: any) {
      console.error('Sign in error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Sign in failed. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);



  const handleDevelopmentSignIn = useCallback(async () => {
    console.log('Development sign in clicked');
    setIsLoading(true);
    try {
      // Anonymous sign-in is disabled in API-only mode
      Alert.alert('Info', 'Anonymous sign-in is not supported. Please use email/password or Google sign-in.');
    } catch (error) {
      console.error('Development sign in error:', error);
      Alert.alert('Error', 'Development sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);



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
                onBlur={() => setEmailFocused(false)}
                isFocused={emailFocused}
                theme={theme}
                keyboardType="email-address"
              />

              <FloatingInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                isFocused={passwordFocused}
                theme={theme}
                secureTextEntry={true}
              />

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



              <TouchableOpacity 
                style={[
                  styles.developmentButton, 
                  { 
                    backgroundColor: `${theme.colors.primary}20`,
                    borderColor: `${theme.colors.primary}30`
                  },
                  isLoading && styles.buttonDisabled
                ]} 
                onPress={handleDevelopmentSignIn}
                disabled={isLoading}
              >
                <Text style={[styles.developmentButtonText, { color: theme.colors.primary }]}>
                  QUICK DEMO ACCESS
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

  developmentButton: {
    borderRadius: 12,
    paddingVertical: screenHeight * 0.015,
    alignItems: 'center',
    marginBottom: screenHeight * 0.02,
    borderWidth: 1,
  },
  developmentButtonText: {
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
});

export default LoginScreen; 