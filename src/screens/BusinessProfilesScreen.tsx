import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  Dimensions,
  Alert,
  Image,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import businessProfileService from '../services/businessProfile';
import userBusinessProfilesService from '../services/userBusinessProfiles';
import authService from '../services/auth';
import BusinessProfileForm from '../components/BusinessProfileForm';
import BottomSheet from '../components/BottomSheet';
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

// Responsive design helpers - using imported utilities

const BusinessProfilesScreen: React.FC = () => {
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  // Memoized mock data for immediate loading
  const mockProfiles = useMemo(() => [
    {
      id: '1',
      name: 'Creative Events Studio',
      category: 'Event Planning',
      description: 'Professional event planning and management services for all occasions.',
      phone: '+1 (555) 123-4567',
      email: 'info@creativeevents.com',
      address: '123 Main Street, City, State 12345',
      services: ['Wedding Planning', 'Corporate Events', 'Birthday Parties', 'Anniversary Celebrations'],
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=200&fit=crop',
    },
    {
      id: '2',
      name: 'Elite Marketing Solutions',
      category: 'Marketing',
      description: 'Comprehensive marketing solutions for businesses of all sizes.',
      phone: '+1 (555) 987-6543',
      email: 'contact@elitemarketing.com',
      address: '456 Business Ave, Downtown, State 54321',
      services: ['Digital Marketing', 'Social Media Management', 'Content Creation', 'Brand Strategy'],
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
    },
    {
      id: '3',
      name: 'Premier Catering Services',
      category: 'Catering',
      description: 'Exquisite catering services for weddings, corporate events, and special occasions.',
      phone: '+1 (555) 456-7890',
      email: 'info@premiercatering.com',
      address: '789 Food Court, Culinary District, State 67890',
      services: ['Wedding Catering', 'Corporate Catering', 'Private Parties', 'Menu Planning'],
      imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=200&fit=crop',
    },
  ], []);

  const loadBusinessProfiles = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user ID
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      console.log('🔍 BusinessProfilesScreen - Current User:', JSON.stringify(currentUser, null, 2));
      console.log('🔍 BusinessProfilesScreen - User ID:', userId);
      
      if (!userId) {
        console.log('⚠️ No user ID available, using mock business profiles');
        const mockProfiles = businessProfileService.getMockProfiles();
        setProfiles(mockProfiles);
        return;
      }
      
      console.log('🔍 Loading user-specific business profiles for user:', userId);
      
      // Try to get user-specific profiles from API first
      const apiProfiles = await businessProfileService.getUserBusinessProfiles(userId);
      
      if (apiProfiles.length > 0) {
        setProfiles(apiProfiles);
        console.log('✅ Loaded user-specific business profiles from API:', apiProfiles.length);
        console.log('🔍 Loaded profiles:', JSON.stringify(apiProfiles, null, 2));
      } else {
        // Fallback to mock data
        const mockProfiles = businessProfileService.getMockProfiles();
        setProfiles(mockProfiles);
        console.log('📋 Using mock business profiles');
      }
    } catch (error) {
      console.error('Error loading business profiles:', error);
      // Fallback to mock data
      const mockProfiles = businessProfileService.getMockProfiles();
      setProfiles(mockProfiles);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBusinessProfiles();
  }, [loadBusinessProfiles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBusinessProfiles();
    setRefreshing(false);
  }, [loadBusinessProfiles]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      loadBusinessProfiles();
      return;
    }

    try {
      console.log('🔍 Searching business profiles:', searchQuery);
      
      // Search using API
      const results = await businessProfileService.searchBusinessProfiles(searchQuery);
      setProfiles(results);
      console.log('✅ Search results:', results.length, 'profiles found');
    } catch (error) {
      console.error('Error searching profiles:', error);
      // Fallback to mock data search
      const mockProfiles = businessProfileService.getMockProfiles();
      const filtered = mockProfiles.filter(profile => 
        profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setProfiles(filtered);
    }
  }, [searchQuery, loadBusinessProfiles]);

  const handleDeleteProfile = useCallback((profileId: string) => {
    setProfileToDelete(profileId);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteProfile = useCallback(async () => {
    if (!profileToDelete) return;
    
    try {
      await businessProfileService.deleteBusinessProfile(profileToDelete);
      setProfiles(prev => prev.filter(p => p.id !== profileToDelete));
      setSuccessMessage('Business profile deleted successfully');
      setShowSuccessModal(true);
      console.log('✅ Business profile deleted:', profileToDelete);
      
      // Refresh the profiles list to ensure consistency
      setTimeout(() => {
        loadBusinessProfiles();
      }, 1000);
    } catch (error) {
      console.error('Error deleting profile:', error);
      Alert.alert('Error', 'Failed to delete profile');
    } finally {
      setShowDeleteModal(false);
      setProfileToDelete(null);
    }
  }, [profileToDelete]);

  const handleEditProfile = useCallback((profile: any) => {
    setEditingProfile(profile);
    setShowForm(true);
  }, []);

  const handleAddProfile = useCallback(() => {
    setEditingProfile(null);
    setShowBottomSheet(true);
  }, []);

  const handleFormSubmit = useCallback(async (formData: any) => {
    setFormLoading(true);
    try {
      if (editingProfile) {
        // Update existing profile
        console.log('🔄 Updating profile with ID:', editingProfile.id);
        console.log('📤 Form data being sent:', formData);
        
        const updatedProfile = await businessProfileService.updateBusinessProfile(editingProfile.id, formData);
        console.log('✅ Updated profile received:', updatedProfile);
        
        setProfiles(prev => {
          const newProfiles = prev.map(p => p.id === editingProfile.id ? updatedProfile : p);
          console.log('📋 Updated profiles list:', newProfiles);
          return newProfiles;
        });
        
        setSuccessMessage('Business profile updated successfully');
        setShowSuccessModal(true);
        console.log('✅ Business profile updated:', editingProfile.id);
        
        // Refresh the profiles list to ensure consistency
        setTimeout(() => {
          console.log('🔄 Refreshing profiles list after update...');
          loadBusinessProfiles();
        }, 1000);
      } else {
        // Create new profile
        const newProfile = await businessProfileService.createBusinessProfile(formData);
        setProfiles(prev => [...prev, newProfile]);
        setSuccessMessage('Business profile created successfully');
        setShowSuccessModal(true);
        console.log('✅ Business profile created:', newProfile.id);
        
        // Refresh the profiles list to ensure consistency
        setTimeout(() => {
          loadBusinessProfiles();
        }, 1000);
      }
      
      setShowForm(false);
      setShowBottomSheet(false);
      setEditingProfile(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setFormLoading(false);
    }
  }, [editingProfile]);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setShowBottomSheet(false);
    setEditingProfile(null);
  }, []);

  const renderBusinessCard = useCallback(({ item }: { item: any }) => (
    <View style={[styles.businessCard, { backgroundColor: theme.colors.cardBackground }]}>
      <View style={styles.cardHeader}>
        <View style={styles.businessInfoWithLogo}>
          {/* Business Logo */}
          <View style={styles.logoContainer}>
            {item.companyLogo || item.logo ? (
              <Image
                source={{ uri: item.companyLogo || item.logo }}
                style={styles.businessLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Icon name="business" size={24} color={theme.colors.primary} />
              </View>
            )}
          </View>
          
          <View style={styles.businessInfo}>
            <Text style={[styles.businessName, { color: theme.colors.text }]}>
              {item.name || 'Business Name'}
            </Text>
            {item.category && (
              <Text style={[styles.businessCategory, { color: theme.colors.primary }]}>
                {item.category}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}20` }]}
            onPress={() => handleEditProfile(item)}
          >
            <Icon name="edit" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${theme.colors.error}20` }]}
            onPress={() => handleDeleteProfile(item.id)}
          >
            <Icon name="delete" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {item.description && (
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {item.description}
        </Text>
      )}

      <View style={styles.contactInfo}>
        {item.phone && (
          <View style={styles.contactItem}>
            <Icon name="phone" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
              {item.phone}
            </Text>
          </View>
        )}
        {item.email && (
          <View style={styles.contactItem}>
            <Icon name="email" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
              {item.email}
            </Text>
          </View>
        )}
        {item.address && (
          <View style={styles.contactItem}>
            <Icon name="location-on" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
              {item.address}
            </Text>
          </View>
        )}
        {item.website && (
          <View style={styles.contactItem}>
            <Icon name="language" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
              {item.website}
            </Text>
          </View>
        )}
      </View>

      {item.services && item.services.length > 0 && (
        <View style={styles.servicesContainer}>
          <Text style={[styles.servicesTitle, { color: theme.colors.text }]}>Services:</Text>
          <View style={styles.servicesList}>
            {item.services.slice(0, 3).map((service: string, index: number) => (
              <View key={`${item.id}-service-${index}-${service}`} style={[styles.serviceTag, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Text style={[styles.serviceText, { color: theme.colors.primary }]}>{service}</Text>
              </View>
            ))}
            {item.services.length > 3 && (
              <View key={`${item.id}-more-services`} style={[styles.serviceTag, { backgroundColor: `${theme.colors.textSecondary}20` }]}>
                <Text style={[styles.serviceText, { color: theme.colors.textSecondary }]}>
                  +{item.services.length - 3} more
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  ), [theme, handleEditProfile, handleDeleteProfile]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent" 
        translucent={true}
      />
      
      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + responsiveSpacing.sm }]}>
          <Text style={styles.headerTitle}>Business Profiles</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.cardBackground }]}
            onPress={handleAddProfile}
          >
            <Icon name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.cardBackground }]}>
            <Icon name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search business profiles..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="clear" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Business Profiles List */}
        <FlatList
          data={profiles}
          renderItem={renderBusinessCard}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={10}
        />

        {/* Business Profile Form Modal */}
        <BusinessProfileForm
          visible={showForm}
          profile={editingProfile}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          loading={formLoading}
        />

        {/* Bottom Sheet for Add Profile */}
        <BottomSheet
          title="Add Business Profile"
          visible={showBottomSheet}
          onClose={handleFormClose}
        >
          <BusinessProfileForm
            visible={showBottomSheet}
            profile={null}
            onSubmit={handleFormSubmit}
            onClose={handleFormClose}
            loading={formLoading}
          />
        </BottomSheet>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
          statusBarTranslucent={true}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSuccessModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => {}} // Prevent closing when tapping inside modal
            >
              <View style={[styles.successModalContainer, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.successModalHeader}>
                  <View style={[styles.successIconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
                    <Icon name="check-circle" size={Math.min(screenWidth * 0.08, 32)} color={theme.colors.primary} />
                  </View>
                  <Text 
                    style={[styles.successModalTitle, { color: theme.colors.text }]}
                  >
                    Success
                  </Text>
                  <TouchableOpacity 
                    style={[styles.closeModalButton, { backgroundColor: theme.colors.inputBackground }]}
                    onPress={() => setShowSuccessModal(false)}
                    activeOpacity={0.7}
                  >
                    <Icon name="close" size={Math.min(screenWidth * 0.06, 24)} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.successModalContent}>
                  <Text style={[styles.successModalMessage, { color: theme.colors.text }]}>
                    {successMessage}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.successModalButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setShowSuccessModal(false)}
                >
                  <Text style={styles.successModalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
          statusBarTranslucent={true}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDeleteModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => {}} // Prevent closing when tapping inside modal
            >
              <View style={[styles.deleteModalContainer, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.deleteModalHeader}>
                  <View style={[styles.deleteIconContainer, { backgroundColor: `${theme.colors.error}20` }]}>
                    <Icon name="warning" size={Math.min(screenWidth * 0.08, 32)} color={theme.colors.error} />
                  </View>
                  <Text 
                    style={[styles.deleteModalTitle, { color: theme.colors.text }]}
                  >
                    Delete Profile
                  </Text>
                  <TouchableOpacity 
                    style={[styles.closeModalButton, { backgroundColor: theme.colors.inputBackground }]}
                    onPress={() => setShowDeleteModal(false)}
                    activeOpacity={0.7}
                  >
                    <Icon name="close" size={Math.min(screenWidth * 0.06, 24)} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.deleteModalContent}>
                  <Text style={[styles.deleteModalMessage, { color: theme.colors.text }]}>
                    Are you sure you want to delete this business profile? This action cannot be undone.
                  </Text>
                </View>
                
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity 
                    style={[styles.deleteModalCancelButton, { backgroundColor: theme.colors.inputBackground }]}
                    onPress={() => setShowDeleteModal(false)}
                  >
                    <Text style={[styles.deleteModalCancelText, { color: theme.colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.deleteModalDeleteButton, { backgroundColor: theme.colors.error }]}
                    onPress={confirmDeleteProfile}
                  >
                    <Text style={styles.deleteModalDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveLayout.headerPaddingHorizontal,
    paddingTop: Math.max(responsiveSpacing.md, screenHeight * 0.02),
    paddingBottom: Math.max(responsiveSpacing.md, screenHeight * 0.02),
  },
  headerTitle: {
    fontSize: responsiveText.heading,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    width: Math.max(44, screenWidth * 0.1),
    height: Math.max(44, screenWidth * 0.1),
    borderRadius: Math.max(22, screenWidth * 0.05),
    justifyContent: 'center',
    alignItems: 'center',
    ...responsiveShadow.medium,
  },
  searchContainer: {
    paddingHorizontal: responsiveLayout.containerPaddingHorizontal,
    marginBottom: Math.max(responsiveSpacing.md, screenHeight * 0.02),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Math.max(25, screenWidth * 0.06),
    paddingHorizontal: Math.max(responsiveSpacing.md, screenWidth * 0.04),
    paddingVertical: Math.max(responsiveSpacing.sm, screenHeight * 0.012),
    ...responsiveShadow.medium,
  },
  searchInput: {
    flex: 1,
    marginLeft: Math.max(responsiveSpacing.sm, screenWidth * 0.03),
    fontSize: responsiveText.body,
  },
  listContainer: {
    paddingHorizontal: responsiveLayout.containerPaddingHorizontal,
    paddingBottom: 100, // Add padding to account for tab bar
  },
  businessCard: {
    borderRadius: responsiveSize.cardBorderRadius,
    padding: responsiveSize.cardPadding,
    marginBottom: responsiveSize.cardMarginBottom,
    ...responsiveShadow.large,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: screenHeight * 0.015,
  },
  businessInfoWithLogo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  logoContainer: {
    marginRight: screenWidth * 0.03,
  },
  businessLogo: {
    width: screenWidth * 0.12,
    height: screenWidth * 0.12,
    borderRadius: screenWidth * 0.06,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoPlaceholder: {
    width: screenWidth * 0.12,
    height: screenWidth * 0.12,
    borderRadius: screenWidth * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: 'bold',
    marginBottom: screenHeight * 0.005,
  },
  businessCategory: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: '600',
    marginBottom: screenHeight * 0.005,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: screenWidth * 0.02,
  },
  description: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    lineHeight: 20,
    marginBottom: screenHeight * 0.015,
  },
  contactInfo: {
    marginBottom: screenHeight * 0.015,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenHeight * 0.005,
  },
  contactText: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    marginLeft: screenWidth * 0.02,
  },
  servicesContainer: {
    marginTop: screenHeight * 0.01,
  },
  servicesTitle: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: '600',
    marginBottom: screenHeight * 0.008,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceTag: {
    paddingHorizontal: screenWidth * 0.03,
    paddingVertical: screenHeight * 0.005,
    borderRadius: 15,
    marginRight: screenWidth * 0.02,
    marginBottom: screenHeight * 0.005,
  },
  serviceText: {
    fontSize: Math.min(screenWidth * 0.025, 10),
    fontWeight: '500',
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.min(screenWidth * 0.05, 20),
  },
  successModalContainer: {
    borderRadius: Math.min(screenWidth * 0.06, 24),
    padding: Math.min(screenWidth * 0.05, 20),
    width: '100%',
    maxWidth: Math.min(screenWidth * 0.9, 400),
    minWidth: Math.min(screenWidth * 0.8, 320),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 25,
    alignSelf: 'center',
  },
  successModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.min(screenHeight * 0.02, 16),
    paddingBottom: Math.min(screenHeight * 0.015, 12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: Math.min(screenWidth * 0.12, 48),
  },
  successIconContainer: {
    width: Math.min(screenWidth * 0.12, 48),
    height: Math.min(screenWidth * 0.12, 48),
    borderRadius: Math.min(screenWidth * 0.06, 24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Math.min(screenWidth * 0.04, 16),
  },
  successModalTitle: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: '700',
    flex: 1,
    marginHorizontal: Math.min(screenWidth * 0.02, 8),
    textAlign: 'center',
  },
  successModalContent: {
    paddingVertical: Math.min(screenHeight * 0.01, 8),
    marginBottom: Math.min(screenHeight * 0.02, 16),
  },
  successModalMessage: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    lineHeight: Math.min(screenWidth * 0.05, 20),
    textAlign: 'center',
    opacity: 0.9,
  },
  successModalButton: {
    borderRadius: Math.min(screenWidth * 0.03, 12),
    paddingVertical: Math.min(screenHeight * 0.018, 14),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successModalButtonText: {
    fontSize: Math.min(screenWidth * 0.042, 17),
    fontWeight: '600',
    color: '#ffffff',
  },
  // Delete Modal Styles
  deleteModalContainer: {
    borderRadius: Math.min(screenWidth * 0.06, 24),
    padding: Math.min(screenWidth * 0.05, 20),
    width: '100%',
    maxWidth: Math.min(screenWidth * 0.9, 400),
    minWidth: Math.min(screenWidth * 0.8, 320),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 25,
    alignSelf: 'center',
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.min(screenHeight * 0.02, 16),
    paddingBottom: Math.min(screenHeight * 0.015, 12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: Math.min(screenWidth * 0.12, 48),
  },
  deleteIconContainer: {
    width: Math.min(screenWidth * 0.12, 48),
    height: Math.min(screenWidth * 0.12, 48),
    borderRadius: Math.min(screenWidth * 0.06, 24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Math.min(screenWidth * 0.04, 16),
  },
  deleteModalTitle: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: '700',
    flex: 1,
    marginHorizontal: Math.min(screenWidth * 0.02, 8),
    textAlign: 'center',
  },
  deleteModalContent: {
    paddingVertical: Math.min(screenHeight * 0.01, 8),
    marginBottom: Math.min(screenHeight * 0.02, 16),
  },
  deleteModalMessage: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    lineHeight: Math.min(screenWidth * 0.05, 20),
    textAlign: 'center',
    opacity: 0.9,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: Math.min(screenWidth * 0.03, 12),
  },
  deleteModalCancelButton: {
    flex: 1,
    borderRadius: Math.min(screenWidth * 0.03, 12),
    paddingVertical: Math.min(screenHeight * 0.018, 14),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteModalCancelText: {
    fontSize: Math.min(screenWidth * 0.042, 17),
    fontWeight: '600',
  },
  deleteModalDeleteButton: {
    flex: 1,
    borderRadius: Math.min(screenWidth * 0.03, 12),
    paddingVertical: Math.min(screenHeight * 0.018, 14),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteModalDeleteText: {
    fontSize: Math.min(screenWidth * 0.042, 17),
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default BusinessProfilesScreen; 