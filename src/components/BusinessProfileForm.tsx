import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
  TextInput as RNTextInput,
  ReturnKeyTypeOptions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BusinessProfile, CreateBusinessProfileData } from '../services/businessProfile';
import businessProfileService from '../services/businessProfile';
import { useTheme } from '../context/ThemeContext';
import ImagePickerModal from './ImagePickerModal';
import businessCategoriesService from '../services/businessCategoriesService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  inputRef?: (ref: RNTextInput | null) => void;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
}) => (
  <View style={styles.inputContainer}>
    <TextInput
      ref={inputRef}
      style={[
        styles.input,
        {
          backgroundColor: theme.colors.inputBackground,
          color: theme.colors.text,
          borderColor: theme.colors.border
        },
        focusedField === field && [styles.inputFocused, { borderColor: theme.colors.primary }],
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
      autoCapitalize={field === 'email' ? 'none' : 'words'}
      blurOnSubmit={blurOnSubmit}
      returnKeyType={returnKeyType}
      autoCorrect={false}
      spellCheck={false}
      textContentType="none"
      onSubmitEditing={onSubmitEditing}
    />
  </View>
));

interface BusinessProfileFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBusinessProfileData, pendingLogoUri?: string) => void;
  profile?: BusinessProfile | null;
  loading?: boolean;
}

const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({
  visible,
  onClose,
  onSubmit,
  profile,
  loading = false,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [formData, setFormData] = useState<CreateBusinessProfileData>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    address: '',
    phone: '',
    alternatePhone: '',
    email: '',
    website: '',
    companyLogo: '',
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [newService, setNewService] = useState('');
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [phoneValidationError, setPhoneValidationError] = useState<string>('');
  const [alternatePhoneValidationError, setAlternatePhoneValidationError] = useState<string>('');
  const [businessCategories, setBusinessCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [allCategoriesData, setAllCategoriesData] = useState<any[]>([]);
  const inputRefs = useRef<Record<string, RNTextInput | null>>({});

  const focusField = (field: string) => {
    const ref = inputRefs.current[field];
    if (ref) {
      ref.focus();
    }
  };

  const registerInputRef = (field: string) => (ref: RNTextInput | null) => {
    inputRefs.current[field] = ref;
  };

  const handleSubmitEditing = (nextField?: string) => () => {
    if (nextField) {
      focusField(nextField);
    } else {
      Keyboard.dismiss();
    }
  };


  // Fetch business categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      if (!visible) return; // Only fetch when form is visible

      setLoadingCategories(true);
      try {
        console.log('📡 [BUSINESS PROFILE FORM] Fetching business categories...');
        const response = await businessCategoriesService.getBusinessCategories();

        if (response.success && response.categories && response.categories.length > 0) {
          // Store all categories data for filtering
          setAllCategoriesData(response.categories);

          // Extract unique parentCategoryName values for Business Category dropdown
          const parentCategoryNames: string[] = [];
          response.categories.forEach(cat => {
            if (cat.parentCategoryName && cat.parentCategoryName.trim() !== '') {
              parentCategoryNames.push(cat.parentCategoryName.trim());
            }
          });
          const uniqueParentCategories = [...new Set(parentCategoryNames)].sort();

          setBusinessCategories(uniqueParentCategories);
          console.log('✅ [BUSINESS PROFILE FORM] Business categories loaded:', uniqueParentCategories.length);
          console.log('📋 [BUSINESS PROFILE FORM] Business categories:', uniqueParentCategories);
        } else {
          console.warn('⚠️ [BUSINESS PROFILE FORM] No categories received from API');
          setAllCategoriesData([]);
          setBusinessCategories([]);
        }
      } catch (error) {
        console.error('❌ [BUSINESS PROFILE FORM] Error fetching categories:', error);
        // Fallback to empty array on error
        setBusinessCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [visible]);

  // Filter subcategories based on selected business category
  const fetchSubcategories = (selectedBusinessCategory: string) => {
    console.log('📡 [BUSINESS PROFILE FORM] Filtering subcategories for business category:', selectedBusinessCategory);

    // Filter categories where parentCategoryName matches the selected business category
    const filteredSubcategories = allCategoriesData.filter(category => {
      return category.parentCategoryName === selectedBusinessCategory;
    });

    console.log('📋 [BUSINESS PROFILE FORM] Found subcategories:', filteredSubcategories.length);

    // Map to the expected format for the dropdown
    const subcategoryOptions = filteredSubcategories.map(category => ({
      id: category.id,
      name: category.name,
      parentCategoryName: category.parentCategoryName,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      color: category.color
    }));

    setSubcategories(subcategoryOptions);
    setLoadingSubcategories(false);
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        description: profile.description,
        category: profile.category,
        subcategory: profile.subCategory || profile.subcategory || '',
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        website: profile.website || '',
      });
    } else {
      // Reset form for new profile
      setFormData({
        name: '',
        description: '',
        category: '',
        subcategory: '',
        address: '',
        phone: '',
        email: '',
        website: '',
      });
    }
  }, [profile, visible]);

  const handleInputChange = (field: string, value: string) => {
    console.log('🔍 [BUSINESS FORM] Field changed:', { field, value });

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
      return;
    }

    // Handle business category selection - filter subcategories
    if (field === 'category') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        subcategory: '', // Reset subcategory when business category changes
      }));

      // Filter subcategories for the selected business category
      if (value) {
        setLoadingSubcategories(true);
        fetchSubcategories(value);
      } else {
        setSubcategories([]); // Clear subcategories if no business category selected
        setLoadingSubcategories(false);
      }
    } else {
      // Handle all other fields normally
      if (field === 'subcategory') {
        console.log('🔍 [BUSINESS FORM] Subcategory specifically changed to:', value);
      }
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };



  const handleImagePickerPress = () => {
    setShowImagePickerModal(true);
  };

  const handleImageSelected = async (imageUri: string) => {
    setLogoImage(imageUri);
    setShowImagePickerModal(false);

    // For new profile creation, we'll upload during form submission
    // For existing profile editing, upload immediately
    if (profile?.id) {
      try {
        setUploadingImage(true);
        console.log('📤 Uploading logo for existing profile:', profile.id);
        const uploadResult = await businessProfileService.uploadImage(profile.id, 'logo', imageUri);
        console.log('✅ Logo uploaded successfully:', uploadResult.url);
        setFormData(prev => ({ ...prev, companyLogo: uploadResult.url }));
      } catch (error) {
        console.error('❌ Failed to upload logo:', error);
        Alert.alert('Upload Failed', 'Failed to upload logo. Please try again.');
        // Reset logo on upload failure
        setLogoImage(null);
        setFormData(prev => ({ ...prev, companyLogo: '' }));
      } finally {
        setUploadingImage(false);
      }
    } else {
      // For new profiles, store the local URI temporarily
      // It will be uploaded during profile creation
      setFormData(prev => ({ ...prev, companyLogo: imageUri }));
    }
  };

  const handleCloseImagePicker = () => {
    setShowImagePickerModal(false);
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Upload Company Logo',
      'Choose how you want to add your company logo',
      [
        {
          text: 'Take Photo',
          onPress: handleImagePickerPress,
        },
        {
          text: 'Choose from Gallery',
          onPress: handleImagePickerPress,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleUploadAreaClick = () => {
    setShowImagePickerModal(true);
  };


  // Validation functions
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters and check if exactly 10 digits remain
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length === 10;
  };

  // Validate phone with real-time digit count feedback (exactly 10 digits)
  const validatePhone = (phone: string): string => {
    if (!phone || !phone.trim()) return ''; // Empty is OK for optional fields
    const digits = phone.trim().replace(/\D/g, ''); // Remove non-digits
    if (digits.length === 0) return '';
    if (digits.length < 10) return `Phone must be 10 digits (currently ${digits.length})`;
    if (digits.length > 10) return `Phone must be 10 digits (currently ${digits.length})`;
    return ''; // Valid
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Company name validation
    if (!formData.name.trim()) {
      errors.push('Company name is required');
    }

    // Business category validation (only required for new profiles, not when editing)
    if (!profile && !formData.category.trim()) {
      errors.push('Business category is required');
    }

    // Subcategory validation (only if subcategories exist for the selected category)
    if (!profile && formData.category && subcategories.length > 0 && (!formData.subcategory || !formData.subcategory.trim())) {
      errors.push('Business subcategory is required');
    }

    // Phone number validation
    if (!formData.phone.trim()) {
      errors.push('Phone number is required');
    } else if (!validatePhoneNumber(formData.phone.trim())) {
      errors.push('Phone number must be exactly 10 digits');
    }

    // Alternate phone number validation (if provided)
    if (formData.alternatePhone && formData.alternatePhone.trim()) {
      if (!validatePhoneNumber(formData.alternatePhone.trim())) {
        errors.push('Alternate phone number must be exactly 10 digits');
      }
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!validateEmail(formData.email.trim())) {
      errors.push('Please enter a valid email address');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async () => {
    console.log('🔍 [BUSINESS FORM] Register button clicked');
    console.log('🔍 [BUSINESS FORM] Form data being submitted:', formData);

    const validation = validateForm();

    if (!validation.isValid) {
      console.log('⚠️ [BUSINESS FORM] Validation failed:', validation.errors);
      setValidationErrors(validation.errors);
      setShowValidationModal(true);
      return;
    }

    // For new profiles, upload image if it's a local file path
    if (!profile && formData.companyLogo && businessProfileService.isLocalFilePath(formData.companyLogo)) {
      try {
        setUploadingImage(true);
        console.log('📤 [BUSINESS FORM] Uploading logo for new profile creation...');

        // For new profiles, we need to create the profile first, then upload the image
        // So we'll submit the form without the logo, then upload it after getting the profile ID
        const formDataWithoutLogo = { ...formData, companyLogo: '', logo: '' };

        console.log('✅ [BUSINESS FORM] Form validation passed, submitting to parent (without logo)');
        onSubmit(formDataWithoutLogo, formData.companyLogo); // Pass original logo URI separately

      } catch (error) {
        console.error('❌ [BUSINESS FORM] Failed to prepare logo upload:', error);
        Alert.alert('Upload Failed', 'Failed to prepare logo upload. Please try again.');
      } finally {
        setUploadingImage(false);
      }
    } else {
      console.log('✅ [BUSINESS FORM] Form validation passed, submitting to parent');
      onSubmit(formData);
    }
  };



  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <LinearGradient
            colors={theme.colors.gradient}
            style={styles.gradientBackground}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
              >
                <Text style={[styles.closeButtonText, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>CLOSE</Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>
                {profile ? 'Edit Business Profile' : 'Business Registration'}
              </Text>
              <TouchableOpacity
                onPress={handleSubmit}
                style={[
                  styles.saveButton,
                  { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(102,126,234,0.15)' },
                  (loading || uploadingImage) && styles.saveButtonDisabled
                ]}
                disabled={loading || uploadingImage}
              >
                {(loading || uploadingImage) ? (
                  <ActivityIndicator size="small" color={isDarkMode ? '#ffffff' : '#667eea'} />
                ) : (
                  <Text style={[styles.saveButtonText, { color: isDarkMode ? '#ffffff' : '#667eea' }]}>{profile ? 'SAVE' : 'REGISTER'}</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
            >
              {/* Company Information */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>Company Information *</Text>

                <FloatingInput
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  field="name"
                  placeholder="Enter company name *"
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  theme={theme}
                  inputRef={registerInputRef('name')}
                  onSubmitEditing={handleSubmitEditing('phone')}
                />

                {/* Company Logo Upload */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>
                    Company Logo
                  </Text>
                  <View style={[
                    styles.logoUploadContainer,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.border
                    },
                    focusedField === 'logo' && [styles.inputFocused, { borderColor: theme.colors.primary }]
                  ]}>
                    {logoImage ? (
                      <View style={styles.logoPreviewContainer}>
                        <View style={styles.logoPreviewWrapper}>
                          <Image source={{ uri: logoImage }} style={styles.logoPreview} />
                          {uploadingImage && (
                            <View style={styles.logoUploadOverlay}>
                              <ActivityIndicator size="small" color="#ffffff" />
                              <Text style={styles.uploadingText}>Uploading...</Text>
                            </View>
                          )}
                          <View style={styles.logoOverlay}>
                            <Icon name="photo" size={24} color="#ffffff" />
                          </View>
                        </View>
                        <View style={styles.logoActionButtons}>
                          <TouchableOpacity
                            style={styles.logoActionButton}
                            onPress={handleImagePickerPress}
                            disabled={uploadingImage}
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
                            disabled={uploadingImage}
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
                          onPress={handleUploadAreaClick}
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
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>
                    Business Category {profile ? '' : '*'}
                  </Text>
                  {profile ? (
                    // Edit mode: Show category as read-only
                    <View style={[
                      styles.pickerContainer,
                      styles.pickerContainerDisabled,
                      {
                        backgroundColor: theme.colors.inputBackground,
                        borderColor: theme.colors.border,
                        opacity: 0.6
                      }
                    ]}>
                      <Text style={[styles.pickerText, { color: theme.colors.textSecondary }]}>
                        {formData.category || 'No category'}
                      </Text>
                      <Icon name="lock" size={16} color={theme.colors.textSecondary} style={{ marginLeft: 8 }} />
                    </View>
                  ) : (
                    // New profile mode: Allow category selection
                    <>
                      {/* Selected Category Display */}
                      <View style={styles.selectedCategoryContainer}>
                        <TextInput
                          style={[
                            styles.selectedCategoryInput,
                            {
                              color: theme.colors.text,
                              borderColor: formData.category ? theme.colors.primary : theme.colors.border,
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

                      {/* Category Options */}
                      {loadingCategories ? (
                        <View style={styles.categoryLoadingContainer}>
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                          <Text style={[styles.categoryLoadingText, { color: theme.colors.textSecondary }]}>
                            Loading categories...
                          </Text>
                        </View>
                      ) : businessCategories.length === 0 ? (
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
                          {businessCategories.map((category) => (
                            <TouchableOpacity
                              key={category}
                              style={[
                                styles.categoryOption,
                                {
                                  backgroundColor: formData.category === category
                                    ? theme.colors.primary
                                    : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(102,126,234,0.1)'),
                                  borderColor: formData.category === category
                                    ? theme.colors.primary
                                    : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(102,126,234,0.3)'),
                                },
                                formData.category === category && {
                                  shadowColor: theme.colors.primary,
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.3,
                                  shadowRadius: 4,
                                  elevation: 5,
                                }
                              ]}
                              onPress={() => handleInputChange('category', category)}
                            >
                              <Text style={[
                                styles.categoryOptionText,
                                {
                                  color: formData.category === category
                                    ? '#ffffff'
                                    : (isDarkMode ? '#ffffff' : theme.colors.primary)
                                },
                                formData.category === category && styles.categoryOptionTextSelected
                              ]}>
                                {category}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </>
                  )}
                  {profile && (
                    <Text style={[styles.categoryDisabledHint, { color: theme.colors.textSecondary }]}>
                      Business category cannot be changed after creation
                    </Text>
                  )}
                </View>
              </View>

              {/* Subcategory Field - Only show if category is selected and subcategories exist */}
              {!profile && formData.category && subcategories.length > 0 && (
                <View style={styles.inputContainer}>
                  <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>
                    Business Subcategory *
                  </Text>

                  {/* Selected Subcategory Display */}
                  <View style={[
                    styles.pickerContainer,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.border
                    },
                    focusedField === 'subcategory' && [styles.inputFocused, { borderColor: theme.colors.primary }]
                  ]}>
                    {loadingSubcategories ? (
                      <View style={styles.categoryLoadingContainer}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text style={[styles.pickerText, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
                          Loading subcategories...
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.pickerText, { color: formData.subcategory ? theme.colors.text : theme.colors.textSecondary }]}>
                        {formData.subcategory || 'Select business subcategory'}
                      </Text>
                    )}
                  </View>

                  {/* Subcategory Options */}
                  {loadingSubcategories ? (
                    <View style={styles.categoryOptions}>
                      <Text style={[styles.categoryLoadingText, { color: theme.colors.textSecondary }]}>
                        Loading subcategories...
                      </Text>
                    </View>
                  ) : subcategories.length === 0 ? (
                    <View style={styles.categoryOptions}>
                      <Text style={[styles.categoryLoadingText, { color: theme.colors.textSecondary }]}>
                        No subcategories available for this category.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.categoryOptions}>
                      {subcategories.map((subcategory) => (
                        <TouchableOpacity
                          key={subcategory.id || subcategory.name}
                          style={[
                            styles.categoryOption,
                            {
                              backgroundColor: formData.subcategory === subcategory.name
                                ? theme.colors.primary
                                : (isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(102,126,234,0.1)'),
                              borderWidth: 1,
                              borderColor: formData.subcategory === subcategory.name
                                ? theme.colors.primary
                                : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(102,126,234,0.2)')
                            }
                          ]}
                          onPress={() => handleInputChange('subcategory', subcategory.name)}
                        >
                          <Text style={[
                            styles.categoryOptionText,
                            {
                              color: formData.subcategory === subcategory.name
                                ? '#ffffff'
                                : (isDarkMode ? '#ffffff' : theme.colors.primary)
                            },
                            formData.subcategory === subcategory.name && styles.categoryOptionTextSelected
                          ]}>
                            {subcategory.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Contact Information */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>Contact Information</Text>

                {/* Phone Number with Validation */}
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={registerInputRef('phone')}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.inputBackground,
                        color: theme.colors.text,
                        borderColor: phoneValidationError ? '#ff4444' : theme.colors.border
                      },
                      focusedField === 'phone' && [styles.inputFocused, { borderColor: phoneValidationError ? '#ff4444' : theme.colors.primary }]
                    ]}
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter 10 digit phone number *"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoCapitalize="none"
                    blurOnSubmit={false}
                    returnKeyType="next"
                    autoCorrect={false}
                    spellCheck={false}
                    textContentType="none"
                    onSubmitEditing={handleSubmitEditing('alternatePhone')}
                  />
                  {phoneValidationError ? (
                    <Text style={[styles.validationError, { color: '#ff4444' }]}>
                      {phoneValidationError}
                    </Text>
                  ) : null}
                  {!phoneValidationError && formData.phone.trim() && formData.phone.replace(/\D/g, '').length === 10 ? (
                    <Text style={[styles.validationSuccess, { color: '#4CAF50' }]}>
                      ✓ Valid phone number
                    </Text>
                  ) : null}
                </View>

                {/* Alternate Phone Number with Validation */}
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={registerInputRef('alternatePhone')}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.inputBackground,
                        color: theme.colors.text,
                        borderColor: alternatePhoneValidationError ? '#ff4444' : theme.colors.border
                      },
                      focusedField === 'alternatePhone' && [styles.inputFocused, { borderColor: alternatePhoneValidationError ? '#ff4444' : theme.colors.primary }]
                    ]}
                    value={formData.alternatePhone || ''}
                    onChangeText={(value) => handleInputChange('alternatePhone', value)}
                    onFocus={() => setFocusedField('alternatePhone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter 10 digit alternate phone (optional)"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoCapitalize="none"
                    blurOnSubmit={false}
                    returnKeyType="next"
                    autoCorrect={false}
                    spellCheck={false}
                    textContentType="none"
                    onSubmitEditing={handleSubmitEditing('email')}
                  />
                  {alternatePhoneValidationError ? (
                    <Text style={[styles.validationError, { color: '#ff4444' }]}>
                      {alternatePhoneValidationError}
                    </Text>
                  ) : null}
                  {!alternatePhoneValidationError && formData.alternatePhone && formData.alternatePhone.trim() && formData.alternatePhone.replace(/\D/g, '').length === 10 ? (
                    <Text style={[styles.validationSuccess, { color: '#4CAF50' }]}>
                      ✓ Valid phone number
                    </Text>
                  ) : null}
                </View>

                <FloatingInput
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  field="email"
                  placeholder="Enter email address *"
                  keyboardType="email-address"
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  theme={theme}
                  inputRef={registerInputRef('email')}
                  onSubmitEditing={handleSubmitEditing('website')}
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
                  inputRef={registerInputRef('website')}
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
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={handleSubmitEditing()}
                />
              </View>
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
      </Modal>

      {/* Upload Options Modal */}
      <Modal
        visible={showUploadModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUploadModal(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUploadModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { }} // Prevent closing when tapping inside modal
          >
            <View style={[styles.uploadModalContainer, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.uploadModalHeader}>
                <Text style={[styles.uploadModalTitle, { color: theme.colors.text }]}>Upload Company Logo</Text>
                <TouchableOpacity
                  style={[styles.closeModalButton, { backgroundColor: theme.colors.inputBackground }]}
                  onPress={() => setShowUploadModal(false)}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={Math.min(screenWidth * 0.06, 24)} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.uploadModalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.uploadModalSubtitle, { color: theme.colors.textSecondary }]}>
                  Choose how you want to add your company logo
                </Text>

                <View style={styles.uploadModalOptions}>
                  <TouchableOpacity
                    style={[styles.uploadModalOption, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
                    onPress={handleImagePickerPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.uploadModalOptionIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <Icon name="photo-library" size={Math.min(screenWidth * 0.07, 28)} color={theme.colors.primary} />
                    </View>
                    <View style={styles.uploadModalOptionContent}>
                      <Text style={[styles.uploadModalOptionTitle, { color: theme.colors.text }]}>Gallery</Text>
                      <Text style={[styles.uploadModalOptionSubtitle, { color: theme.colors.textSecondary }]}>Choose from your photos</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.uploadModalOption, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
                    onPress={handleImagePickerPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.uploadModalOptionIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <Icon name="camera-alt" size={Math.min(screenWidth * 0.07, 28)} color={theme.colors.primary} />
                    </View>
                    <View style={styles.uploadModalOptionContent}>
                      <Text style={[styles.uploadModalOptionTitle, { color: theme.colors.text }]}>Camera</Text>
                      <Text style={[styles.uploadModalOptionSubtitle, { color: theme.colors.textSecondary }]}>Take a new photo</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.cancelModalButton, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
                onPress={() => setShowUploadModal(false)}
              >
                <Text style={[styles.cancelModalText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImagePickerModal}
        onClose={handleCloseImagePicker}
        onImageSelected={handleImageSelected}
      />

      {/* Validation Error Modal */}
      <Modal
        visible={showValidationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowValidationModal(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowValidationModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { }} // Prevent closing when tapping inside modal
          >
            <View style={[styles.validationModalContainer, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.validationModalHeader}>
                <View style={[styles.validationIconContainer, { backgroundColor: `${theme.colors.error}20` }]}>
                  <Icon name="error-outline" size={Math.min(screenWidth * 0.08, 32)} color={theme.colors.error} />
                </View>
                <Text
                  style={[styles.validationModalTitle, { color: theme.colors.text }]}
                >
                  Validation Error
                </Text>
                <TouchableOpacity
                  style={[styles.closeModalButton, { backgroundColor: theme.colors.inputBackground }]}
                  onPress={() => setShowValidationModal(false)}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={Math.min(screenWidth * 0.06, 24)} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.validationModalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.validationModalSubtitle, { color: theme.colors.textSecondary }]}>
                  Please fix the following errors:
                </Text>

                <View style={styles.validationErrorsList}>
                  {validationErrors.map((error, index) => (
                    <View key={index} style={styles.validationErrorItem}>
                      <Icon name="error" size={Math.min(screenWidth * 0.04, 16)} color={theme.colors.error} />
                      <Text style={[styles.validationErrorText, { color: theme.colors.text }]}>{error}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.validationModalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowValidationModal(false)}
              >
                <Text style={styles.validationModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: screenHeight * 0.06,
    paddingHorizontal: screenWidth * 0.05,
    paddingBottom: screenHeight * 0.02,
  },
  closeButton: {
    paddingHorizontal: Math.max(12, screenWidth * 0.035),
    paddingVertical: Math.max(6, screenHeight * 0.008),
    borderRadius: 16,
  },
  closeButtonText: {
    fontSize: Math.min(screenWidth * 0.028, 11),
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Math.min(screenWidth * 0.042, 16),
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: Math.max(12, screenWidth * 0.035),
    paddingVertical: Math.max(6, screenHeight * 0.008),
    borderRadius: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontWeight: '600',
    fontSize: Math.min(screenWidth * 0.028, 11),
  },
  content: {
    flex: 1,
    paddingHorizontal: Math.max(12, screenWidth * 0.04),
  },
  section: {
    marginBottom: Math.max(12, screenHeight * 0.015),
  },
  sectionTitle: {
    fontSize: Math.min(screenWidth * 0.038, 14),
    fontWeight: 'bold',
    marginBottom: Math.max(10, screenHeight * 0.015),
  },
  inputContainer: {
    marginBottom: Math.max(12, screenHeight * 0.015),
  },

  input: {
    borderRadius: 10,
    paddingHorizontal: Math.max(12, screenWidth * 0.035),
    paddingVertical: Math.max(10, screenHeight * 0.012),
    fontSize: Math.min(screenWidth * 0.035, 14),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  inputFocused: {
    borderWidth: 2,
  },
  multilineInput: {
    minHeight: Math.max(60, screenHeight * 0.07),
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderRadius: 10,
    paddingHorizontal: Math.max(12, screenWidth * 0.035),
    paddingVertical: Math.max(10, screenHeight * 0.012),
    paddingTop: Math.max(14, screenHeight * 0.018),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  pickerContainerDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
  },
  categoryOptions: {
    marginTop: Math.max(8, screenHeight * 0.008),
    marginBottom: Math.max(4, screenHeight * 0.002),
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    paddingHorizontal: Math.max(10, screenWidth * 0.025),
    paddingVertical: Math.max(4, screenHeight * 0.005),
    borderRadius: 12,
    marginRight: Math.max(6, screenWidth * 0.015),
    marginBottom: Math.max(4, screenHeight * 0.002),
  },
  categoryOptionSelected: {
    // backgroundColor will be set dynamically
  },
  categoryOptionText: {
    fontSize: Math.min(screenWidth * 0.03, 12),
  },
  categoryOptionTextSelected: {
    fontWeight: '600',
  },
  servicesInput: {
    flexDirection: 'row',
    marginBottom: screenHeight * 0.015,
  },
  serviceInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.012,
    fontSize: Math.min(screenWidth * 0.04, 16),
    color: '#333333',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginRight: screenWidth * 0.025,
  },
  addServiceButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.012,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addServiceButtonText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    color: '#ffffff',
    fontWeight: 'bold',
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceTag: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.03,
    paddingVertical: screenHeight * 0.006,
    borderRadius: 15,
    marginRight: screenWidth * 0.02,
    marginBottom: screenHeight * 0.008,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  serviceTagText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    color: '#333',
    marginRight: screenWidth * 0.015,
  },
  removeServiceText: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    color: '#ff4444',
    fontWeight: 'bold',
  },
  logoUploadContainer: {
    borderRadius: 16,
    padding: screenWidth * 0.04,
    borderWidth: 2,
    borderStyle: 'dashed',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: screenHeight * 0.12,
    position: 'relative',
  },
  logoPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: screenWidth * 0.02,
  },
  logoPreviewWrapper: {
    position: 'relative',
    marginBottom: screenHeight * 0.02,
  },
  logoPreview: {
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoUploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  logoActionButtons: {
    flexDirection: 'row',
    gap: screenWidth * 0.025,
  },
  logoActionButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.01,
    borderRadius: 25,
    minWidth: screenWidth * 0.14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoActionButtonText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: screenWidth * 0.015,
  },
  removeLogoButton: {
    backgroundColor: '#ff4757',
    shadowColor: '#ff4757',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: screenWidth * 0.04,
    width: '100%',
  },
  logoIconContainer: {
    width: screenWidth * 0.1,
    height: screenWidth * 0.1,
    borderRadius: screenWidth * 0.05,
    backgroundColor: '#f8faff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: screenHeight * 0.015,
    borderWidth: 2,
    borderColor: '#e8f2ff',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoPlaceholderTitle: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: '600',
    marginBottom: Math.max(3, screenHeight * 0.004),
    textAlign: 'center',
  },
  logoPlaceholderSubtext: {
    fontSize: Math.min(screenWidth * 0.028, 11),
    marginBottom: 0,
    textAlign: 'center',
    lineHeight: 14,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: screenWidth * 0.04,
    marginTop: screenHeight * 0.01,
  },
  uploadOption: {
    backgroundColor: '#ffffff',
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenHeight * 0.015,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: screenWidth * 0.18,
    borderWidth: 2,
    borderColor: '#e8f2ff',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadOptionIconContainer: {
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.04,
    backgroundColor: '#f8faff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: screenHeight * 0.008,
    borderWidth: 1,
    borderColor: '#e8f2ff',
  },
  uploadOptionText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    color: '#2c3e50',
    fontWeight: '600',
  },
  uploadAreaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: screenWidth * 0.03,
  },
  cancelUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.008,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: screenHeight * 0.015,
  },
  cancelUploadText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    color: '#7f8c8d',
    fontWeight: '500',
    marginLeft: screenWidth * 0.01,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.min(screenWidth * 0.05, 20),
  },
  uploadModalContainer: {
    borderRadius: Math.min(screenWidth * 0.06, 24),
    padding: Math.min(screenWidth * 0.06, 24),
    width: '100%',
    maxWidth: Math.min(screenWidth * 0.9, 420),
    minWidth: Math.min(screenWidth * 0.8, 320),
    maxHeight: screenHeight * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 25,
    position: 'relative',
  },
  uploadModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.min(screenHeight * 0.025, 20),
    paddingBottom: Math.min(screenHeight * 0.015, 12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  uploadModalTitle: {
    fontSize: Math.min(screenWidth * 0.055, 22),
    fontWeight: '700',
    flex: 1,
    marginRight: Math.min(screenWidth * 0.03, 12),
  },
  closeModalButton: {
    width: Math.min(screenWidth * 0.08, 32),
    height: Math.min(screenWidth * 0.08, 32),
    borderRadius: Math.min(screenWidth * 0.04, 16),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadModalSubtitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    marginBottom: Math.min(screenHeight * 0.035, 28),
    lineHeight: Math.min(screenWidth * 0.05, 20),
    opacity: 0.8,
  },
  uploadModalScrollContent: {
    paddingBottom: Math.min(screenHeight * 0.02, 16),
  },
  uploadModalOptions: {
    gap: Math.min(screenHeight * 0.025, 20),
    marginBottom: Math.min(screenHeight * 0.035, 28),
  },
  uploadModalOption: {
    borderRadius: Math.min(screenWidth * 0.04, 16),
    padding: Math.min(screenWidth * 0.05, 20),
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: Math.min(screenHeight * 0.08, 64),
    transform: [{ scale: 1 }],
  },
  uploadModalOptionIcon: {
    width: Math.min(screenWidth * 0.12, 48),
    height: Math.min(screenWidth * 0.12, 48),
    borderRadius: Math.min(screenWidth * 0.06, 24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Math.min(screenWidth * 0.04, 16),
    borderWidth: 1,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadModalOptionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  uploadModalOptionTitle: {
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: '600',
    marginBottom: Math.min(screenHeight * 0.005, 4),
  },
  uploadModalOptionSubtitle: {
    fontSize: Math.min(screenWidth * 0.038, 15),
    opacity: 0.7,
    lineHeight: Math.min(screenWidth * 0.045, 18),
  },
  cancelModalButton: {
    borderRadius: Math.min(screenWidth * 0.03, 12),
    paddingVertical: Math.min(screenHeight * 0.018, 14),
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelModalText: {
    fontSize: Math.min(screenWidth * 0.042, 17),
    fontWeight: '600',
  },
  // Validation Modal Styles
  validationModalContainer: {
    borderRadius: Math.min(screenWidth * 0.06, 24),
    padding: Math.min(screenWidth * 0.05, 20),
    width: '100%',
    maxWidth: Math.min(screenWidth * 0.95, 450),
    minWidth: Math.min(screenWidth * 0.85, 340),
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 25,
    position: 'relative',
  },
  validationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.min(screenHeight * 0.025, 20),
    paddingBottom: Math.min(screenHeight * 0.015, 12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: Math.min(screenWidth * 0.12, 48),
  },
  validationIconContainer: {
    width: Math.min(screenWidth * 0.12, 48),
    height: Math.min(screenWidth * 0.12, 48),
    borderRadius: Math.min(screenWidth * 0.06, 24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Math.min(screenWidth * 0.04, 16),
  },
  validationModalTitle: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: '700',
    flex: 1,
    marginHorizontal: Math.min(screenWidth * 0.02, 8),
    textAlign: 'center',
  },
  validationModalScrollContent: {
    paddingBottom: Math.min(screenHeight * 0.02, 16),
  },
  validationModalSubtitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    marginBottom: Math.min(screenHeight * 0.02, 16),
    lineHeight: Math.min(screenWidth * 0.05, 20),
    opacity: 0.8,
  },
  validationErrorsList: {
    gap: Math.min(screenHeight * 0.015, 12),
  },
  validationErrorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Math.min(screenWidth * 0.03, 12),
    paddingVertical: Math.min(screenHeight * 0.01, 8),
    borderRadius: Math.min(screenWidth * 0.02, 8),
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
  },
  validationErrorText: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    lineHeight: Math.min(screenWidth * 0.05, 20),
    marginLeft: Math.min(screenWidth * 0.03, 12),
    flex: 1,
  },
  validationModalButton: {
    borderRadius: Math.min(screenWidth * 0.03, 12),
    paddingVertical: Math.min(screenHeight * 0.018, 14),
    alignItems: 'center',
    marginTop: Math.min(screenHeight * 0.02, 16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  validationModalButtonText: {
    fontSize: Math.min(screenWidth * 0.042, 17),
    fontWeight: '600',
    color: '#ffffff',
  },
  inputLabel: {
    fontSize: Math.min(screenWidth * 0.033, 13),
    fontWeight: '600',
    marginBottom: Math.max(6, screenHeight * 0.006),
  },
  validationError: {
    fontSize: Math.min(screenWidth * 0.028, 11),
    marginTop: Math.max(3, screenHeight * 0.004),
    marginLeft: Math.max(6, screenWidth * 0.008),
    fontWeight: '500',
  },
  validationSuccess: {
    fontSize: Math.min(screenWidth * 0.028, 11),
    marginTop: Math.max(3, screenHeight * 0.004),
    marginLeft: Math.max(6, screenWidth * 0.008),
    fontWeight: '500',
  },
  categoryLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLoadingText: {
    fontSize: Math.min(screenWidth * 0.033, 13),
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Math.max(8, screenHeight * 0.01),
  },
  categoryDisabledHint: {
    fontSize: Math.min(screenWidth * 0.028, 11),
    marginTop: Math.max(4, screenHeight * 0.005),
    fontStyle: 'italic',
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
    fontSize: Math.min(screenWidth * 0.038, 15),
    minHeight: Math.min(screenWidth * 0.12, 48),
  },
  categoryScrollContent: {
    paddingRight: Math.max(14, screenWidth * 0.04),
  },
  categoryEmptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    paddingVertical: Math.max(12, screenHeight * 0.015),
    paddingHorizontal: Math.max(12, screenWidth * 0.03),
    gap: Math.max(8, screenWidth * 0.02),
  },
  categoryEmptyText: {
    fontSize: Math.min(screenWidth * 0.033, 13),
    textAlign: 'center',
    flex: 1,
  },
});

export default BusinessProfileForm; 