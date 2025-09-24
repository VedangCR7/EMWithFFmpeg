import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BusinessProfile, CreateBusinessProfileData } from '../services/businessProfile';
import { useTheme } from '../context/ThemeContext';
import ImagePickerModal from './ImagePickerModal';

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
}) => (
  <View style={styles.inputContainer}>
    <TextInput
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
      blurOnSubmit={false}
      returnKeyType="next"
      autoCorrect={false}
      spellCheck={false}
      textContentType="none"
    />
  </View>
));

interface BusinessProfileFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBusinessProfileData) => void;
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

  const categories = [
    'Event Planners',
    'Decorators',
    'Sound Suppliers',
    'Light Suppliers',
  ];

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        description: profile.description,
        category: profile.category,
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
        address: '',
        phone: '',
        email: '',
        website: '',
      });
    }
  }, [profile, visible]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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


  const handleSubmit = () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Company name is required');
      return;
    }
    if (!formData.category.trim()) {
      Alert.alert('Error', 'Business category is required');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Address is required');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    onSubmit(formData);
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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {profile ? 'Edit Business Profile' : 'Business Registration'}
            </Text>
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>{profile ? 'SAVE' : 'REGISTER'}</Text>
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
              <Text style={styles.sectionTitle}>Company Information</Text>
              
                             <FloatingInput
                 value={formData.name}
                 onChangeText={(value) => handleInputChange('name', value)}
                 field="name"
                 placeholder="Enter company name"
                 focusedField={focusedField}
                 setFocusedField={setFocusedField}
                 theme={theme}
               />

              {/* Company Logo Upload */}
              <View style={styles.inputContainer}>
                <Text style={styles.sectionTitle}>
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
                        <View style={styles.logoOverlay}>
                          <Icon name="photo" size={24} color="#ffffff" />
                        </View>
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
                <Text style={styles.sectionTitle}>
                  Business Category *
                </Text>
                <View style={[
                  styles.pickerContainer,
                  { 
                    backgroundColor: theme.colors.inputBackground,
                    borderColor: theme.colors.border
                  },
                  focusedField === 'category' && [styles.inputFocused, { borderColor: theme.colors.primary }]
                ]}>
                  <Text style={[styles.pickerText, { color: formData.category ? theme.colors.text : theme.colors.textSecondary }]}>
                    {formData.category || 'Select business category'}
                  </Text>
                </View>
                <View style={styles.categoryOptions}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        { backgroundColor: 'rgba(255,255,255,0.2)' },
                        formData.category === category && [styles.categoryOptionSelected, { backgroundColor: theme.colors.primary }]
                      ]}
                      onPress={() => handleInputChange('category', category)}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        { color: formData.category === category ? '#ffffff' : '#ffffff' },
                        formData.category === category && [styles.categoryOptionTextSelected, { color: '#ffffff' }]
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
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
          onPress={() => {}} // Prevent closing when tapping inside modal
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.01,
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.01,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: Math.min(screenWidth * 0.03, 12),
  },
  content: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.05,
  },
  section: {
    marginBottom: screenHeight * 0.03,
  },
  sectionTitle: {
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: screenHeight * 0.02,
  },
  inputContainer: {
    marginBottom: screenHeight * 0.02,
  },

  input: {
    borderRadius: 12,
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    fontSize: Math.min(screenWidth * 0.04, 16),
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
    minHeight: screenHeight * 0.08,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderRadius: 12,
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    paddingTop: screenHeight * 0.025,
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
  pickerText: {
    fontSize: Math.min(screenWidth * 0.04, 16),
  },
  categoryOptions: {
    marginTop: screenHeight * 0.01,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    paddingHorizontal: screenWidth * 0.03,
    paddingVertical: screenHeight * 0.006,
    borderRadius: 15,
    marginRight: screenWidth * 0.02,
    marginBottom: screenHeight * 0.008,
  },
  categoryOptionSelected: {
    // backgroundColor will be set dynamically
  },
  categoryOptionText: {
    fontSize: Math.min(screenWidth * 0.035, 14),
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
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
    marginBottom: screenHeight * 0.005,
    textAlign: 'center',
  },
  logoPlaceholderSubtext: {
    fontSize: Math.min(screenWidth * 0.032, 13),
    marginBottom: 0,
    textAlign: 'center',
    lineHeight: 16,
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
});

export default BusinessProfileForm; 