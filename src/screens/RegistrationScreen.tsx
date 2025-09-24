import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import authService from '../services/auth';
import ImagePickerModal from '../components/ImagePickerModal';

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
  showValidationSummary = false
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
  showValidationSummary?: boolean;
}) => (
    <View style={styles.inputContainer}>
    <TextInput
      style={[
        styles.input,
        { 
          color: theme.theme.colors.text,
          borderColor: focusedField === field ? theme.theme.colors.primary : theme.theme.colors.border,
          backgroundColor: theme.theme.colors.inputBackground,
        },
        multiline && styles.multilineInput
      ]}
              value={value}
      onChangeText={onChangeText}
        onFocus={() => setFocusedField(field)}
        onBlur={() => setFocusedField(null)}
      placeholder={placeholder}
      placeholderTextColor={theme.theme.colors.textSecondary}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
    />
      </View>
));

interface RegistrationScreenProps {
  navigation: any;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => {
  const theme = useTheme();
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
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [modalDimensions, setModalDimensions] = useState(getModalDimensions());

  const categories = [
    'Event Planners',
    'Decorators',
    'Sound Suppliers',
    'Light Suppliers',
  ];

  useEffect(() => {
    const updateDimensions = () => {
      setModalDimensions(getModalDimensions());
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  const handleInputChange = (field: string, value: string) => {
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

    if (!formData.name.trim()) {
      errors.name = 'Company name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
    // Validate basic field requirements first
    const basicValidationErrors: {[key: string]: string} = {};
    let hasBasicErrors = false;

    // Check only basic required field validation
    if (!formData.name.trim()) {
      basicValidationErrors.name = 'Company name is required';
      hasBasicErrors = true;
    }
    if (!formData.email.trim()) {
      basicValidationErrors.email = 'Email is required';
      hasBasicErrors = true;
    }
    if (!formData.phone.trim()) {
      basicValidationErrors.phone = 'Phone number is required';
      hasBasicErrors = true;
    }
    if (!formData.password.trim()) {
      basicValidationErrors.password = 'Password is required';
      hasBasicErrors = true;
    }
    if (formData.password !== formData.confirmPassword) {
      basicValidationErrors.confirmPassword = 'Passwords do not match';
      hasBasicErrors = true;
    }

    if (hasBasicErrors) {
      setValidationErrors(basicValidationErrors);
      setShowValidationSummary(true);
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
      
      const result = await authService.registerUser({
        email: formData.email.trim(),
        password: formData.password.trim(),
        displayName: formData.name.trim(),
            companyName: formData.name.trim(),
        photoURL: logoImage || formData.companyLogo,
            logo: logoImage || formData.companyLogo,
            // Additional profile fields
            description: formData.description.trim(),
            category: formData.category.trim(),
            address: formData.address.trim(),
            alternatePhone: formData.alternatePhone.trim(),
            website: formData.website.trim(),
        phone: formData.phone.trim(),
        bio: formData.description.trim(),
          });

      if (result.success) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        setErrorMessage(result.error || 'Registration failed. Please try again.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage('Registration failed. Please try again.');
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
      setShowValidationSummary(false);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.theme.colors.background }]}>
      <LinearGradient
        colors={[theme.theme.colors.primary, theme.theme.colors.secondary]}
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

            <View style={[styles.formContainer, { backgroundColor: theme.theme.colors.surface }]}>
              {/* Company Logo Section */}
              <View style={styles.logoSection}>
                <Text style={[styles.sectionTitle, { color: theme.theme.colors.text }]}>Company Logo</Text>
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
                      <Text style={[styles.logoPlaceholderTitle, { color: theme.theme.colors.text }]}>Upload Company Logo</Text>
                      <Text style={[styles.logoPlaceholderSubtext, { color: theme.theme.colors.textSecondary }]}>Tap to select from gallery or take a photo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </View>

              {/* Company Information */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.theme.colors.text }]}>Company Information</Text>
                
                <FloatingInput
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  field="name"
                  placeholder="Enter company name"
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  theme={theme}
                />

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
                />

                {/* Business Category */}
                <View style={styles.categorySection}>
                  <Text style={[styles.categoryLabel, { color: theme.theme.colors.text }]}>Business Category</Text>
                  
                  {/* Selected Category Display */}
                  <View style={styles.selectedCategoryContainer}>
                    <TextInput
                      style={[
                        styles.selectedCategoryInput,
                        { 
                          color: theme.theme.colors.text,
                          borderColor: theme.theme.colors.border,
                          backgroundColor: theme.theme.colors.inputBackground,
                        }
                      ]}
                      value={formData.category}
                      placeholder="Select your business category"
                      placeholderTextColor={theme.theme.colors.textSecondary}
                      editable={false}
                      pointerEvents="none"
                    />
                    <Icon 
                      name="keyboard-arrow-down" 
                      size={24} 
                      color={theme.theme.colors.textSecondary}
                      style={styles.dropdownIcon}
                    />
                </View>
                  
                  {/* Category Options */}
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScrollContent}
                  >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                          { borderColor: theme.theme.colors.border },
                          formData.category === category && [styles.categoryOptionSelected, { backgroundColor: theme.theme.colors.primary }]
                      ]}
                      onPress={() => handleInputChange('category', category)}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                          { color: formData.category === category ? '#ffffff' : theme.theme.colors.text },
                        formData.category === category && [styles.categoryOptionTextSelected, { color: '#ffffff' }]
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  </ScrollView>
              </View>
              
              <FloatingInput
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                field="phone"
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                theme={theme}
              />

                <FloatingInput
                value={formData.alternatePhone || ''}
                onChangeText={(value) => handleInputChange('alternatePhone', value)}
                field="alternatePhone"
                placeholder="Enter alternate phone number"
                keyboardType="phone-pad"
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  theme={theme}
                />

                <FloatingInput
                  value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                  field="email"
                placeholder="Enter email address"
                keyboardType="email-address"
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                theme={theme}
              />

              <FloatingInput
                value={formData.website || ''}
                onChangeText={(value) => handleInputChange('website', value)}
                field="website"
                placeholder="Enter company website URL"
                keyboardType="url"
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                theme={theme}
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
              />
            </View>

            {/* Account Security */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.theme.colors.text }]}>Account Security</Text>
              
              <FloatingInput
                  value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                  field="password"
                placeholder="Enter password"
                secureTextEntry={true}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  theme={theme}
                />

                <FloatingInput
                  value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  field="confirmPassword"
                placeholder="Confirm password"
                secureTextEntry={true}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  theme={theme}
                />
            </View>

              {/* Register Button */}
        <TouchableOpacity 
                style={[styles.registerButton, { backgroundColor: theme.theme.colors.primary }]}
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
                <Text style={[styles.loginLinkText, { color: theme.theme.colors.textSecondary }]}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={[styles.loginLink, { color: theme.theme.colors.primary }]}>Sign In</Text>
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
              { backgroundColor: theme.theme.colors.surface },
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
              <View style={[styles.modalIconContainer, { backgroundColor: theme.theme.colors.error + '20' }]}>
                <Icon name="error-outline" size={Math.min(screenWidth * 0.08, 32)} color={theme.theme.colors.error} />
              </View>
              <Text style={[styles.modalTitle, { color: theme.theme.colors.text }]}>Registration Error</Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.modalMessage, { color: theme.theme.colors.textSecondary }]}>
                {errorMessage}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.theme.colors.primary }]}
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
    paddingTop: screenHeight * 0.02,
    paddingBottom: screenHeight * 0.03,
    paddingHorizontal: screenWidth * 0.05,
  },
  logo: {
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
    marginBottom: screenHeight * 0.02,
  },
  title: {
    fontSize: isSmallScreen ? 24 : isMediumScreen ? 26 : 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    marginHorizontal: screenWidth * 0.05,
    borderRadius: 20,
    padding: screenWidth * 0.05,
    marginBottom: screenHeight * 0.02,
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
    marginBottom: screenHeight * 0.03,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    marginBottom: screenHeight * 0.015,
  },
  inputContainer: {
    marginBottom: screenHeight * 0.015,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    fontSize: isSmallScreen ? 14 : 16,
    minHeight: isSmallScreen ? 48 : 52,
  },
  multilineInput: {
    minHeight: isSmallScreen ? 80 : 100,
    textAlignVertical: 'top',
  },
  logoSection: {
    marginBottom: screenHeight * 0.03,
  },
  logoContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  logoImage: {
    width: screenWidth * 0.25,
    height: screenWidth * 0.25,
    borderRadius: screenWidth * 0.125,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: screenWidth * 0.125,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoActionButtons: {
    flexDirection: 'row',
    marginTop: screenHeight * 0.01,
    gap: screenWidth * 0.02,
  },
  logoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.03,
    paddingVertical: screenHeight * 0.008,
    borderRadius: 8,
    backgroundColor: '#667eea',
  },
  changeLogoButton: {
    backgroundColor: '#667eea',
  },
  removeLogoButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonIcon: {
    marginRight: 4,
  },
  logoActionButtonText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '500',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: screenWidth * 0.05,
  },
  uploadAreaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: screenWidth * 0.03,
  },
  logoIconContainer: {
    width: screenWidth * 0.12,
    height: screenWidth * 0.12,
    borderRadius: screenWidth * 0.06,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: screenHeight * 0.01,
  },
  logoPlaceholderTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  logoPlaceholderSubtext: {
    fontSize: isSmallScreen ? 12 : 14,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: screenHeight * 0.02,
  },
  categoryLabel: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '500',
    marginBottom: screenHeight * 0.01,
  },
  selectedCategoryContainer: {
    position: 'relative',
    marginBottom: screenHeight * 0.015,
  },
  selectedCategoryInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    paddingRight: screenWidth * 0.12,
    fontSize: isSmallScreen ? 14 : 16,
    minHeight: isSmallScreen ? 48 : 52,
  },
  dropdownIcon: {
    position: 'absolute',
    right: screenWidth * 0.04,
    top: screenHeight * 0.015,
  },
  categoryScrollContent: {
    paddingRight: screenWidth * 0.05,
  },
  categoryOption: {
    paddingHorizontal: screenWidth * 0.03,
    paddingVertical: screenHeight * 0.008,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: screenWidth * 0.02,
    backgroundColor: '#667eea',
  },
  categoryOptionSelected: {
    backgroundColor: '#667eea',
  },
  categoryOptionText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  registerButton: {
    paddingVertical: screenHeight * 0.018,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: screenHeight * 0.02,
    marginBottom: screenHeight * 0.02,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    },
  loginLinkText: {
    fontSize: isSmallScreen ? 14 : 16,
  },
  loginLink: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.1,
  },
  modalContainer: {
    width: '100%',
    maxWidth: screenWidth * 0.9,
    borderRadius: 20,
    padding: screenWidth * 0.06,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: screenHeight * 0.02,
  },
  modalIconContainer: {
    width: screenWidth * 0.15,
    height: screenWidth * 0.15,
    borderRadius: screenWidth * 0.075,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: screenHeight * 0.01,
  },
  modalTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: screenHeight * 0.02,
  },
  modalMessage: {
    fontSize: isSmallScreen ? 14 : 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalActions: {
    width: '100%',
  },
  modalButton: {
    paddingVertical: screenHeight * 0.015,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
  },
});

export default RegistrationScreen; 