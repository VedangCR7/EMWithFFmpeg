import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Modal,
  Animated,
  Keyboard,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import loginAPIs from '../services/loginAPIs';
import ImagePickerModal from '../components/ImagePickerModal';
import businessCategoriesService, { BusinessCategory } from '../services/businessCategoriesService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;
const isTablet = screenWidth >= 768;
const isLandscape = screenWidth > screenHeight;

// Dynamic responsive helpers for modal
const getModalDimensions = () => {
  const currentWidth = Dimensions.get('window').width;
  const currentHeight = Dimensions.get('window').height;
  const isCurrentlyLandscape = currentWidth > currentHeight;
  
  return {
    width: currentWidth,
    height: currentHeight,
    isLandscape: isCurrentlyLandscape,
    isSmall: currentWidth < 375,
    isMedium: currentWidth >= 375 && currentWidth < 414,
    isLarge: currentWidth >= 414,
    isTablet: currentWidth >= 768,
  };
};

// Create a stable FloatingInput component outside the main component
const FloatingInput = React.memo(({ 
  value, 
  onChangeText, 
  field,
  placeholder, 
  focusedField,
  setFocusedField,
  theme,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  secureTextEntry = false,
  hasError = false,
  inputRef,
  returnKeyType = 'next',
  onSubmitEditing,
  blurOnSubmit = false,
}: {
  value: string;
  onChangeText: (text: string) => void;
  field: string;
  placeholder: string;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
  theme: any;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
  secureTextEntry?: boolean;
  hasError?: boolean;
  inputRef?: (ref: RNTextInput | null) => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
}) => (
    <View style={styles.inputContainer}>
    <TextInput
      ref={inputRef}
      style={[
        styles.input,
        { 
          color: theme.colors.text,
          borderColor: hasError ? theme.colors.error : (focusedField === field ? theme.colors.primary : theme.colors.border),
          backgroundColor: theme.colors.inputBackground,
        },
        multiline && styles.multilineInput
      ]}
              value={value}
      onChangeText={onChangeText}
        onFocus={() => setFocusedField(field)}
        onBlur={() => setFocusedField(null)}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textSecondary}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      blurOnSubmit={blurOnSubmit}
    />
      </View>
));

interface RegistrationScreenProps {
  navigation: any;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    address: '',
    phone: '',
    alternatePhone: '',
    email: '',
    website: '',
    companyLogo: '',
    password: '',
    confirmPassword: '',
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalAnimation] = useState(new Animated.Value(0));
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [modalDimensions, setModalDimensions] = useState(getModalDimensions());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneValidationError, setPhoneValidationError] = useState<string>('');
  const [alternatePhoneValidationError, setAlternatePhoneValidationError] = useState<string>('');
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [showCategoryErrorModal, setShowCategoryErrorModal] = useState<boolean>(false);
  const [categoryErrorModalAnimation] = useState(new Animated.Value(0));
  const inputRefs = useRef<Record<string, RNTextInput | null>>({});

  const registerInputRef = (field: string) => (ref: RNTextInput | null) => {
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

  useEffect(() => {
    const updateDimensions = () => {
      setModalDimensions(getModalDimensions());
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  // Fetch business categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        console.log('📡 [REGISTRATION] Fetching business categories...');
        const response = await businessCategoriesService.getBusinessCategories();
        
        if (response.success && response.categories && response.categories.length > 0) {
          console.log('✅ [REGISTRATION] Categories fetched successfully:', response.categories.length);
          
          // Filter to show only business categories (exclude greeting categories)
          const businessCategoriesOnly = response.categories.filter((category: any) => {
            // Exclude categories that are clearly greeting categories
            const greetingKeywords = [
              'birthday', 'wedding', 'anniversary', 'congratulations', 'thank you',
              'get well', 'sympathy', 'holiday', 'christmas', 'new year', 'valentine',
              'mother\'s day', 'father\'s day', 'easter', 'diwali', 'eid', 'halloween',
              'greeting', 'card', 'invitation', 'celebration', 'festival', 'party'
            ];
            
            const categoryName = category.name?.toLowerCase() || '';
            const isGreetingCategory = greetingKeywords.some(keyword => 
              categoryName.includes(keyword) || categoryName === keyword
            );
            
            // Also check if it has parentCategoryName that indicates it's a greeting category
            const parentCategoryName = category.parentCategoryName?.toLowerCase() || '';
            const isGreetingParent = greetingKeywords.some(keyword => 
              parentCategoryName.includes(keyword) || parentCategoryName === keyword
            );
            
            return !isGreetingCategory && !isGreetingParent;
          });
          
          console.log('✅ [REGISTRATION] Filtered business categories:', businessCategoriesOnly.length);
          setCategories(businessCategoriesOnly);
        } else {
          console.warn('⚠️ [REGISTRATION] No categories received from API');
          // Keep empty array, will show empty state in UI
          setCategories([]);
        }
      } catch (error: any) {
        console.error('❌ [REGISTRATION] Error fetching categories:', error);
        console.error('❌ [REGISTRATION] Error type:', typeof error);
        console.error('❌ [REGISTRATION] Error message:', error?.message);
        console.error('❌ [REGISTRATION] Error code:', error?.code);
        console.error('❌ [REGISTRATION] Error string:', String(error));
        
        // Check if it's a network error - handle both Error objects and string errors
        const errorMessage = error?.message || String(error) || '';
        const errorCode = error?.code || '';
        const errorString = String(error).toLowerCase();
        
        const isNetworkError = 
          errorMessage === 'NETWORK_ERROR' ||
          errorMessage.includes('NETWORK_ERROR') ||
          errorCode === 'NETWORK_ERROR' ||
          errorCode === 'ERR_NETWORK' ||
          errorCode === 'ERR_INTERNET_DISCONNECTED' ||
          errorMessage.toLowerCase().includes('network error') ||
          errorMessage.toLowerCase().includes('network') ||
          errorString.includes('network_error') ||
          errorCode === 'ENOTFOUND' ||
          errorCode === 'ECONNREFUSED' ||
          errorCode === 'ETIMEDOUT' ||
          errorCode === 'ECONNRESET' ||
          !error?.response; // No response usually means network issue
        
        console.log('🔍 [REGISTRATION] Is network error?', isNetworkError);
        
        if (isNetworkError) {
          // Show network error modal
          console.log('📱 [REGISTRATION] Showing network error modal');
          setShowCategoryErrorModal(true);
        }
        
        // On error, keep empty array - user can still register but won't see categories
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Validate phone with real-time digit count feedback (exactly 10 digits)
  const validatePhone = (phone: string): string => {
    if (!phone || !phone.trim()) return ''; // Empty is OK for optional fields
    const digits = phone.trim().replace(/\D/g, ''); // Remove non-digits
    if (digits.length === 0) return '';
    if (digits.length < 10) return `Phone must be 10 digits (currently ${digits.length})`;
    if (digits.length > 10) return `Phone must be 10 digits (currently ${digits.length})`;
    return ''; // Valid
  };

  const handleInputChange = (field: string, value: string) => {
    // Real-time phone validation with digit count
    if (field === 'phone') {
      // Only allow digits
      const digitsOnly = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [field]: digitsOnly,
      }));
      
      // Validate as user types with digit count
      const error = validatePhone(digitsOnly);
      setPhoneValidationError(error);
      
      // Clear form validation error
      if (validationErrors.phone) {
        setValidationErrors(prev => ({
          ...prev,
          phone: '',
        }));
      }
      return;
    }
    
    // Real-time alternate phone validation with digit count
    if (field === 'alternatePhone') {
      // Only allow digits
      const digitsOnly = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [field]: digitsOnly,
      }));
      
      // Validate as user types (optional field)
      if (digitsOnly.trim()) {
        const error = validatePhone(digitsOnly);
        setAlternatePhoneValidationError(error);
      } else {
        setAlternatePhoneValidationError(''); // Clear error if empty
      }
      
      // Clear form validation error
      if (validationErrors.alternatePhone) {
        setValidationErrors(prev => ({
          ...prev,
          alternatePhone: '',
        }));
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    // Company Name validation
    if (!formData.name.trim()) {
      errors.name = 'Company name is required to create your account';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Company name must be at least 2 characters long';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Company name must not exceed 100 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email address is required for your account';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address (e.g., example@email.com)';
    } else if (formData.email.length > 100) {
      errors.email = 'Email address must not exceed 100 characters';
    }

    // Phone number validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required to contact you';
    } else if (!/^\d+$/.test(formData.phone)) {
      errors.phone = 'Phone number must contain only digits (0-9)';
    } else if (formData.phone.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits (e.g., 9876543210)';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid Indian mobile number starting with 6-9';
    }

    // Alternate phone validation (optional field)
    if (formData.alternatePhone && formData.alternatePhone.trim()) {
      if (!/^\d+$/.test(formData.alternatePhone)) {
        errors.alternatePhone = 'Alternate phone must contain only digits (0-9)';
      } else if (formData.alternatePhone.length !== 10) {
        errors.alternatePhone = 'Alternate phone must be exactly 10 digits';
      } else if (!/^[6-9]\d{9}$/.test(formData.alternatePhone)) {
        errors.alternatePhone = 'Please enter a valid Indian mobile number starting with 6-9';
      } else if (formData.alternatePhone === formData.phone) {
        errors.alternatePhone = 'Alternate phone must be different from primary phone number';
      }
    }

    // Password validation
    if (!formData.password.trim()) {
      errors.password = 'Password is required to secure your account';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters for security';
    } else if (formData.password.length > 50) {
      errors.password = 'Password must not exceed 50 characters';
    } else if (!/(?=.*[a-zA-Z])/.test(formData.password)) {
      errors.password = 'Password must contain at least one letter';
    } else if (formData.password === formData.email || formData.password === formData.name) {
      errors.password = 'Password should not be the same as your email or company name';
    }

    // Category validation
    if (!formData.category.trim()) {
      errors.category = 'Business category is required to help us serve you better';
    }

    // Confirm Password validation
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match. Please enter the same password in both fields';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImagePickerPress = () => {
    setShowImagePickerModal(true);
  };

  const handleImageSelected = (imageUri: string) => {
    setLogoImage(imageUri);
    setFormData(prev => ({ ...prev, companyLogo: imageUri }));
    setShowImagePickerModal(false);
  };

  const handleCloseImagePicker = () => {
    setShowImagePickerModal(false);
  };

  const handleRegister = async () => {
    // Validate all fields using the comprehensive validation
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        email: formData.email.trim(),
        password: formData.password.trim(),
        displayName: formData.name.trim(),
        companyName: formData.name.trim(),
          companyLogo: logoImage || formData.companyLogo,
      };

      console.log('Registering user with data:', registrationData);
      
      const result = await loginAPIs.registerUser({
        email: formData.email.trim(),
        password: formData.password.trim(),
        companyName: formData.name.trim(),
        phoneNumber: formData.phone.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        address: formData.address.trim(),
        alternatePhone: formData.alternatePhone.trim(),
        website: formData.website.trim(),
        companyLogo: logoImage || formData.companyLogo,
        displayName: formData.name.trim(),
      });

      // Navigation will be handled automatically by auth state change
      // No need to show success alert as user will be redirected to home
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Extract error message from API response
      const errorMessage = error.response?.data?.message || error.message || '';
      const errorMessageLower = errorMessage.toLowerCase();
      
      // Check if error indicates email is already registered
      const isEmailAlreadyRegistered = 
        errorMessageLower.includes('already registered') ||
        errorMessageLower.includes('email already') ||
        errorMessageLower.includes('already exists') ||
        errorMessageLower.includes('user already exists') ||
        errorMessageLower.includes('email is already') ||
        errorMessageLower.includes('email address is already') ||
        errorMessageLower.includes('duplicate email') ||
        errorMessageLower.includes('email already registered') ||
        (error.response?.status === 409) || // Conflict status code often used for duplicates
        (error.response?.status === 400 && errorMessageLower.includes('email'));
      
      if (isEmailAlreadyRegistered) {
        setErrorMessage('This email is already registered. Please use a different email address or try signing in.');
      } else {
        setErrorMessage(errorMessage || 'Registration failed. Please try again.');
      }
      
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const hideModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowErrorModal(false);
    });
  };

  const showModal = () => {
    setShowErrorModal(true);
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (showErrorModal) {
      showModal();
    }
  }, [showErrorModal]);

  useEffect(() => {
    if (showCategoryErrorModal) {
      Animated.timing(categoryErrorModalAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      categoryErrorModalAnimation.setValue(0);
    }
  }, [showCategoryErrorModal]);

  const hideCategoryErrorModal = () => {
    Animated.timing(categoryErrorModalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowCategoryErrorModal(false);
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Image 
                source={require('../assets/MainLogo/main_logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.title, { color: '#ffffff' }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: '#ffffff' }]}>
                Join our community of event professionals
              </Text>
            </View>

            <View style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
              {/* Company Logo Section */}
              <View style={styles.logoSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Company Logo</Text>
                {logoImage || formData.companyLogo ? (
                  <View style={styles.logoContainer}>
                    <Image 
                      source={{ uri: logoImage || formData.companyLogo }} 
                      style={styles.logoImage}
                      resizeMode="cover"
                    />
                        <View style={styles.logoOverlay}>
                          <Icon name="photo" size={24} color="#ffffff" />
                      </View>
                      <View style={styles.logoActionButtons}>
                        <TouchableOpacity 
                          style={styles.logoActionButton}
                        onPress={handleImagePickerPress}
                        >
                          <Icon name="edit" size={16} color="#ffffff" style={styles.buttonIcon} />
                          <Text style={styles.logoActionButtonText}>Change</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.logoActionButton, styles.removeLogoButton]}
                          onPress={() => {
                            setLogoImage(null);
                            setFormData(prev => ({ ...prev, companyLogo: '' }));
                          }}
                        >
                          <Icon name="delete" size={16} color="#ffffff" style={styles.buttonIcon} />
                          <Text style={styles.logoActionButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <TouchableOpacity 
                        style={styles.uploadAreaButton}
                      onPress={handleImagePickerPress}
                      >
                        <View style={styles.logoIconContainer}>
                          <Icon name="add-a-photo" size={24} color="#667eea" />
                        </View>
                      <Text style={[styles.logoPlaceholderTitle, { color: theme.colors.text }]}>Upload Company Logo</Text>
                      <Text style={[styles.logoPlaceholderSubtext, { color: theme.colors.textSecondary }]}>Tap to select from gallery or take a photo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </View>

              {/* Company Information */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Company Information</Text>
                
                <View style={styles.inputWrapper}>
                  <FloatingInput
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                    field="name"
                    placeholder="Enter company name *"
                    focusedField={focusedField}
                    setFocusedField={setFocusedField}
                    theme={theme}
                    hasError={!!validationErrors.name}
                    inputRef={registerInputRef('name')}
                    onSubmitEditing={handleSubmitEditing('description')}
                  />
                  {validationErrors.name && (
                    <View style={styles.errorContainer}>
                      <Icon name="error" size={16} color={theme.colors.error} />
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {validationErrors.name}
                      </Text>
                    </View>
                  )}
                </View>

                <FloatingInput
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  field="description"
                  placeholder="Enter company description"
                  multiline
                  numberOfLines={3}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  theme={theme}
                  inputRef={registerInputRef('description')}
                  returnKeyType="next"
                  blurOnSubmit
                  onSubmitEditing={handleSubmitEditing('phone')}
                />

                {/* Business Category */}
                <View style={styles.categorySection}>
                  <Text style={[styles.categoryLabel, { color: theme.colors.text }]}>Business Category *</Text>
                  
                  {/* Selected Category Display */}
                  <View style={styles.selectedCategoryContainer}>
                    <TextInput
                      style={[
                        styles.selectedCategoryInput,
                        { 
                          color: theme.colors.text,
                          borderColor: validationErrors.category ? theme.colors.error : (formData.category ? theme.colors.primary : theme.colors.border),
                          backgroundColor: theme.colors.inputBackground,
                        }
                      ]}
                      value={formData.category}
                      placeholder="Select your business category *"
                      placeholderTextColor={theme.colors.textSecondary}
                      editable={false}
                      pointerEvents="none"
                    />
                  </View>
                  
                  {/* Category Validation Error */}
                  {validationErrors.category && (
                    <View style={styles.errorContainer}>
                      <Icon name="error" size={16} color={theme.colors.error} />
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {validationErrors.category}
                      </Text>
                    </View>
                  )}
                  
                  {/* Category Options */}
                  {isLoadingCategories ? (
                    <View style={styles.categoryLoadingContainer}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={[styles.categoryLoadingText, { color: theme.colors.textSecondary }]}>
                        Loading categories...
                      </Text>
                    </View>
                  ) : categories.length === 0 ? (
                    <View style={styles.categoryEmptyContainer}>
                      <Icon name="info-outline" size={20} color={theme.colors.textSecondary} />
                      <Text style={[styles.categoryEmptyText, { color: theme.colors.textSecondary }]}>
                        No categories available. Please try again later.
                      </Text>
                    </View>
                  ) : (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoryScrollContent}
                    >
                      {categories.map((category) => (
                        <TouchableOpacity
                          key={category.id || category.name}
                          style={[
                            styles.categoryOption,
                            { 
                              backgroundColor: formData.category === category.name 
                                ? theme.colors.primary 
                                : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(102,126,234,0.1)'),
                              borderColor: formData.category === category.name 
                                ? theme.colors.primary 
                                : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(102,126,234,0.3)'),
                            },
                            formData.category === category.name && {
                              shadowColor: theme.colors.primary,
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.3,
                              shadowRadius: 4,
                              elevation: 5,
                            }
                          ]}
                          onPress={() => handleInputChange('category', category.name)}
                        >
                          <Text style={[
                            styles.categoryOptionText,
                            { 
                              color: formData.category === category.name 
                                ? '#ffffff' 
                                : (isDarkMode ? '#ffffff' : theme.colors.primary)
                            }
                          ]}>
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
              </View>
              
              {/* Phone Number with Real-time Validation */}
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Phone Number *</Text>
                <TextInput
                  ref={registerInputRef('phone')}
                  style={[
                    styles.input,
                    { 
                      color: theme.colors.text,
                      borderColor: phoneValidationError ? theme.colors.error : (focusedField === 'phone' ? theme.colors.primary : theme.colors.border),
                      backgroundColor: theme.colors.inputBackground,
                    }
                  ]}
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter 10 digit phone number"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={handleSubmitEditing('alternatePhone')}
                />
                {phoneValidationError ? (
                  <View style={styles.errorContainer}>
                    <Icon name="error" size={16} color={theme.colors.error} />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {phoneValidationError}
                    </Text>
                  </View>
                ) : null}
                {!phoneValidationError && formData.phone.trim() && formData.phone.replace(/\D/g, '').length === 10 ? (
                  <View style={styles.successContainer}>
                    <Icon name="check-circle" size={16} color="#4CAF50" />
                    <Text style={[styles.successText, { color: '#4CAF50' }]}>
                      ✓ Valid phone number
                    </Text>
                  </View>
                ) : null}
                {validationErrors.phone && (
                  <View style={styles.errorContainer}>
                    <Icon name="error" size={16} color={theme.colors.error} />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {validationErrors.phone}
                    </Text>
                  </View>
                )}
              </View>

              {/* Alternate Phone Number with Real-time Validation */}
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Alternate Phone (Optional)</Text>
                <TextInput
                  ref={registerInputRef('alternatePhone')}
                  style={[
                    styles.input,
                    { 
                      color: theme.colors.text,
                      borderColor: alternatePhoneValidationError ? theme.colors.error : (focusedField === 'alternatePhone' ? theme.colors.primary : theme.colors.border),
                      backgroundColor: theme.colors.inputBackground,
                    }
                  ]}
                  value={formData.alternatePhone || ''}
                  onChangeText={(value) => handleInputChange('alternatePhone', value)}
                  onFocus={() => setFocusedField('alternatePhone')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter 10 digit alternate phone (optional)"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={handleSubmitEditing('email')}
                />
                {alternatePhoneValidationError ? (
                  <View style={styles.errorContainer}>
                    <Icon name="error" size={16} color={theme.colors.error} />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {alternatePhoneValidationError}
                    </Text>
                  </View>
                ) : null}
                {!alternatePhoneValidationError && formData.alternatePhone && formData.alternatePhone.trim() && formData.alternatePhone.replace(/\D/g, '').length === 10 ? (
                  <View style={styles.successContainer}>
                    <Icon name="check-circle" size={16} color="#4CAF50" />
                    <Text style={[styles.successText, { color: '#4CAF50' }]}>
                      ✓ Valid phone number
                    </Text>
                  </View>
                ) : null}
                {validationErrors.alternatePhone && (
                  <View style={styles.errorContainer}>
                    <Icon name="error" size={16} color={theme.colors.error} />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {validationErrors.alternatePhone}
                    </Text>
                  </View>
                )}
              </View>

                <View style={styles.inputWrapper}>
                  <FloatingInput
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    field="email"
                    placeholder="Enter email address *"
                    keyboardType="email-address"
                    focusedField={focusedField}
                    setFocusedField={setFocusedField}
                    theme={theme}
                    hasError={!!validationErrors.email}
                    inputRef={registerInputRef('email')}
                    returnKeyType="next"
                    onSubmitEditing={handleSubmitEditing('website')}
                  />
                  {validationErrors.email && (
                    <View style={styles.errorContainer}>
                      <Icon name="error" size={16} color={theme.colors.error} />
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {validationErrors.email}
                      </Text>
                    </View>
                  )}
                </View>

              <FloatingInput
                value={formData.website || ''}
                onChangeText={(value) => handleInputChange('website', value)}
                field="website"
                placeholder="Enter company website URL"
                keyboardType="url"
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                theme={theme}
                inputRef={registerInputRef('website')}
                returnKeyType="next"
                onSubmitEditing={handleSubmitEditing('address')}
              />

              <FloatingInput
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                field="address"
                placeholder="Enter company address"
                multiline
                numberOfLines={2}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                theme={theme}
                inputRef={registerInputRef('address')}
                returnKeyType="next"
                blurOnSubmit
                onSubmitEditing={handleSubmitEditing('password')}
              />
            </View>

            {/* Account Security */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Security</Text>
              
              <View style={styles.inputWrapper}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={registerInputRef('password')}
                    style={[
                      styles.passwordInput,
                      { 
                        color: theme.colors.text,
                        borderColor: validationErrors.password ? theme.colors.error : (focusedField === 'password' ? theme.colors.primary : theme.colors.border),
                        backgroundColor: theme.colors.inputBackground,
                      }
                    ]}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter password *"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    onSubmitEditing={handleSubmitEditing('confirmPassword')}
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
                {validationErrors.password && (
                  <View style={styles.errorContainer}>
                    <Icon name="error" size={16} color={theme.colors.error} />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {validationErrors.password}
                    </Text>
                  </View>
                )}
              </View>

                <View style={styles.inputWrapper}>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      ref={registerInputRef('confirmPassword')}
                      style={[
                        styles.passwordInput,
                        { 
                          color: theme.colors.text,
                          borderColor: validationErrors.confirmPassword ? theme.colors.error : (focusedField === 'confirmPassword' ? theme.colors.primary : theme.colors.border),
                          backgroundColor: theme.colors.inputBackground,
                        }
                      ]}
                      value={formData.confirmPassword}
                      onChangeText={(value) => handleInputChange('confirmPassword', value)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Confirm password *"
                      placeholderTextColor={theme.colors.textSecondary}
                      secureTextEntry={!showConfirmPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmitEditing(undefined, handleRegister)}
                    />
                    <TouchableOpacity 
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Icon 
                        name={showConfirmPassword ? "visibility" : "visibility-off"} 
                        size={22} 
                        color={theme.colors.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>
                  {validationErrors.confirmPassword && (
                    <View style={styles.errorContainer}>
                      <Icon name="error" size={16} color={theme.colors.error} />
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {validationErrors.confirmPassword}
                      </Text>
                    </View>
                  )}
                </View>
            </View>

              {/* Register Button */}
        <TouchableOpacity 
                style={[styles.registerButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
                </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginLinkContainer}>
                <Text style={[styles.loginLinkText, { color: theme.colors.textSecondary }]}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={[styles.loginLink, { color: theme.colors.primary }]}>Sign In</Text>
                  </TouchableOpacity>
                    </View>
                    
              {/* Privacy Policy Link */}
              <View style={styles.privacyFooter}>
                <Text style={[styles.privacyFooterText, { color: theme.colors.textSecondary }]}>
                  By creating an account, you agree to our{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                  <Text style={[styles.privacyFooterLink, { color: theme.colors.primary }]}>
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
              </View>
                </View>
              </ScrollView>
                   </KeyboardAvoidingView>
        </LinearGradient>

      {/* Professional Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideModal}
      >
        <View style={[
          styles.modalOverlay,
          modalDimensions.isLandscape && {
            paddingHorizontal: modalDimensions.width * 0.15,
            paddingVertical: modalDimensions.height * 0.05,
          }
        ]}>
          <Animated.View 
            style={[
              styles.modalContainer,
              { backgroundColor: theme.colors.surface },
              modalDimensions.isLandscape && {
                maxWidth: modalDimensions.width * 0.7,
                maxHeight: modalDimensions.height * 0.9,
              },
              {
                transform: [{
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                }],
                opacity: modalAnimation,
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: theme.colors.error + '20' }]}>
                <Icon name="error-outline" size={Math.min(screenWidth * 0.08, 32)} color={theme.colors.error} />
              </View>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Registration Error</Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
                {errorMessage}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={hideModal}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImagePickerModal}
        onClose={handleCloseImagePicker}
        onImageSelected={handleImageSelected}
      />

      {/* Category Network Error Modal */}
      <Modal
        visible={showCategoryErrorModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideCategoryErrorModal}
      >
        <View style={[
          styles.modalOverlay,
          modalDimensions.isLandscape && {
            paddingHorizontal: modalDimensions.width * 0.15,
            paddingVertical: modalDimensions.height * 0.05,
          }
        ]}>
          <Animated.View 
            style={[
              styles.modalContainer,
              { backgroundColor: theme.colors.surface },
              modalDimensions.isLandscape && {
                maxWidth: modalDimensions.width * 0.7,
                maxHeight: modalDimensions.height * 0.9,
              },
              {
                transform: [{
                  scale: categoryErrorModalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
                opacity: categoryErrorModalAnimation,
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: theme.colors.error + '20' }]}>
                <Icon name="wifi-off" size={Math.min(screenWidth * 0.08, 32)} color={theme.colors.error} />
              </View>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Network Error</Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
                Unable to load business categories. Please check your internet connection and try again.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={hideCategoryErrorModal}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
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
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: Math.max(8, screenHeight * 0.01),
    paddingBottom: Math.max(6, screenHeight * 0.008),
    paddingHorizontal: Math.max(14, screenWidth * 0.04),
  },
  logo: {
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
    marginBottom: Math.max(4, screenHeight * 0.005),
  },
  title: {
    fontSize: isSmallScreen ? 20 : isMediumScreen ? 22 : 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isSmallScreen ? 12 : 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    marginHorizontal: Math.max(12, screenWidth * 0.04),
    borderRadius: 16,
    padding: Math.max(12, screenWidth * 0.04),
    marginBottom: Math.max(12, screenHeight * 0.015),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  section: {
    marginBottom: Math.max(16, screenHeight * 0.02),
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    marginBottom: Math.max(10, screenHeight * 0.012),
  },
  inputContainer: {
    marginBottom: Math.max(10, screenHeight * 0.012),
  },
  inputWrapper: {
    marginBottom: Math.max(10, screenHeight * 0.012),
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Math.max(12, screenWidth * 0.035),
    paddingVertical: Math.max(10, screenHeight * 0.012),
    fontSize: isSmallScreen ? 12 : 14,
    minHeight: isSmallScreen ? 44 : 48,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Math.max(4, screenHeight * 0.005),
    paddingHorizontal: Math.max(6, screenWidth * 0.015),
  },
  errorText: {
    fontSize: isSmallScreen ? 10 : 11,
    marginLeft: 4,
    flex: 1,
    lineHeight: isSmallScreen ? 14 : 15,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Math.max(4, screenHeight * 0.005),
    paddingHorizontal: Math.max(6, screenWidth * 0.015),
  },
  successText: {
    fontSize: isSmallScreen ? 10 : 11,
    marginLeft: 4,
    flex: 1,
    lineHeight: isSmallScreen ? 14 : 15,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
    marginBottom: Math.max(6, screenHeight * 0.007),
  },
  multilineInput: {
    minHeight: isSmallScreen ? 70 : 85,
    textAlignVertical: 'top',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: Math.max(10, screenHeight * 0.012),
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Math.max(12, screenWidth * 0.035),
    paddingVertical: Math.max(10, screenHeight * 0.012),
    paddingRight: Math.max(40, screenWidth * 0.11),
    fontSize: isSmallScreen ? 12 : 14,
    minHeight: isSmallScreen ? 44 : 48,
  },
  eyeButton: {
    position: 'absolute',
    right: Math.max(10, screenWidth * 0.025),
    top: '50%',
    transform: [{ translateY: -11 }],
    padding: 4,
  },
  logoSection: {
    marginBottom: Math.max(16, screenHeight * 0.02),
  },
  logoContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  logoImage: {
    width: screenWidth * 0.22,
    height: screenWidth * 0.22,
    borderRadius: screenWidth * 0.11,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: screenWidth * 0.11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoActionButtons: {
    flexDirection: 'row',
    marginTop: Math.max(8, screenHeight * 0.008),
    gap: Math.max(6, screenWidth * 0.015),
  },
  logoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.max(10, screenWidth * 0.025),
    paddingVertical: Math.max(6, screenHeight * 0.007),
    borderRadius: 6,
    backgroundColor: '#667eea',
  },
  changeLogoButton: {
    backgroundColor: '#667eea',
  },
  removeLogoButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonIcon: {
    marginRight: 3,
  },
  logoActionButtonText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '500',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: Math.max(12, screenWidth * 0.04),
  },
  uploadAreaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: Math.max(10, screenWidth * 0.025),
  },
  logoIconContainer: {
    width: screenWidth * 0.1,
    height: screenWidth * 0.1,
    borderRadius: screenWidth * 0.05,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Math.max(8, screenHeight * 0.008),
  },
  logoPlaceholderTitle: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
    marginBottom: 3,
    textAlign: 'center',
  },
  logoPlaceholderSubtext: {
    fontSize: isSmallScreen ? 10 : 12,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: Math.max(12, screenHeight * 0.015),
  },
  categoryLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '500',
    marginBottom: Math.max(8, screenHeight * 0.008),
  },
  selectedCategoryContainer: {
    position: 'relative',
    marginBottom: Math.max(10, screenHeight * 0.012),
  },
  selectedCategoryInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Math.max(12, screenWidth * 0.035),
    paddingVertical: Math.max(10, screenHeight * 0.012),
    fontSize: isSmallScreen ? 12 : 14,
    minHeight: isSmallScreen ? 44 : 48,
  },
  categoryScrollContent: {
    paddingRight: Math.max(14, screenWidth * 0.04),
  },
  categoryOption: {
    paddingHorizontal: Math.max(10, screenWidth * 0.025),
    paddingVertical: Math.max(6, screenHeight * 0.007),
    borderRadius: 16,
    borderWidth: 1,
    marginRight: Math.max(8, screenWidth * 0.018),
  },
  categoryOptionSelected: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  categoryOptionText: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    fontWeight: '600',
  },
  categoryLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.max(16, screenHeight * 0.02),
    gap: Math.max(8, screenWidth * 0.02),
  },
  categoryLoadingText: {
    fontSize: isSmallScreen ? 12 : 14,
    marginLeft: Math.max(8, screenWidth * 0.02),
  },
  categoryEmptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.max(16, screenHeight * 0.02),
    paddingHorizontal: Math.max(12, screenWidth * 0.03),
    gap: Math.max(8, screenWidth * 0.02),
  },
  categoryEmptyText: {
    fontSize: isSmallScreen ? 12 : 14,
    textAlign: 'center',
    flex: 1,
  },
  registerButton: {
    paddingVertical: Math.max(12, screenHeight * 0.015),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Math.max(14, screenHeight * 0.017),
    marginBottom: Math.max(14, screenHeight * 0.017),
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    },
  loginLinkText: {
    fontSize: isSmallScreen ? 12 : 14,
  },
  loginLink: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
  },
  privacyFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Math.max(14, screenHeight * 0.017),
    paddingHorizontal: Math.max(14, screenWidth * 0.04),
  },
  privacyFooterText: {
    fontSize: isSmallScreen ? 10 : 12,
    textAlign: 'center',
  },
  privacyFooterLink: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.max(28, screenWidth * 0.08),
  },
  modalContainer: {
    width: '100%',
    maxWidth: screenWidth * 0.88,
    borderRadius: 16,
    padding: Math.max(18, screenWidth * 0.05),
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Math.max(14, screenHeight * 0.017),
  },
  modalIconContainer: {
    width: screenWidth * 0.13,
    height: screenWidth * 0.13,
    borderRadius: screenWidth * 0.065,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Math.max(8, screenHeight * 0.008),
  },
  modalTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: Math.max(14, screenHeight * 0.017),
  },
  modalMessage: {
    fontSize: isSmallScreen ? 12 : 14,
    textAlign: 'center',
    lineHeight: 19,
  },
  modalActions: {
    width: '100%',
  },
  modalButton: {
    paddingVertical: Math.max(11, screenHeight * 0.013),
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
  },
  // Validation Modal Styles
  validationModalContainer: {
    width: '100%',
    maxWidth: screenWidth * 0.88,
    borderRadius: 16,
    paddingHorizontal: Math.max(14, screenWidth * 0.04),
    paddingVertical: Math.max(18, screenHeight * 0.02),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  validationModalHeader: {
    alignItems: 'center',
    marginBottom: Math.max(14, screenHeight * 0.017),
  },
  validationIconContainer: {
    width: screenWidth * 0.13,
    height: screenWidth * 0.13,
    borderRadius: screenWidth * 0.065,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Math.max(10, screenHeight * 0.012),
  },
  validationModalTitle: {
    fontSize: isSmallScreen ? 17 : isTablet ? 21 : 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 5,
  },
  validationModalSubtitle: {
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  validationErrorsList: {
    maxHeight: screenHeight * 0.42,
    width: '100%',
    marginBottom: Math.max(14, screenHeight * 0.017),
  },
  validationErrorItem: {
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingHorizontal: Math.max(12, screenWidth * 0.035),
    paddingVertical: Math.max(10, screenHeight * 0.012),
    marginBottom: Math.max(8, screenHeight * 0.01),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  errorItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  errorBullet: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 7,
  },
  errorFieldName: {
    fontSize: isSmallScreen ? 12 : isTablet ? 15 : 13,
    fontWeight: '600',
    flex: 1,
  },
  errorMessage: {
    fontSize: isSmallScreen ? 11 : isTablet ? 14 : 12,
    marginLeft: 14,
    lineHeight: isSmallScreen ? 16 : isTablet ? 20 : 18,
  },
  validationModalActions: {
    width: '100%',
    marginTop: Math.max(14, screenHeight * 0.017),
  },
  validationModalButton: {
    flexDirection: 'row',
    paddingVertical: Math.max(12, screenHeight * 0.014),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  validationModalButtonText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 13 : isTablet ? 16 : 14,
    fontWeight: '600',
    marginLeft: 7,
  },
});

export default RegistrationScreen; 