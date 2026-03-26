import api from './api';
import eventMarketersBusinessProfileService from './eventMarketersBusinessProfileService';
import authService from './auth';
import cacheService from './cacheService';

export interface BusinessProfile {
  id: string;
  name: string;
  description: string;
  category: string;
  subCategory?: string; // User's selected subcategory during registration
  subcategory?: string; // Alternative field name for consistency
  address: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  website?: string;
  logo?: string;
  companyLogo?: string;
  profileLogo?: string; // Additional possible logo field from backend
  businessLogo?: string; // Additional possible logo field from backend
  image?: string; // Additional possible logo field from backend
  photo?: string; // Additional possible logo field from backend
  banner?: string;
  coverImage?: string; // Additional possible banner field from backend
  services: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessProfileData {
  name: string;                    // Company Name (required)
  description?: string;            // Company Description (optional)
  category: string;                // Business Category (required) - Event Planners, Decorators, Sound Suppliers, Light Suppliers, Video Services
  subCategory?: string;            // User's selected subcategory during registration
  subcategory?: string;            // Alternative field name for consistency
  address: string;                 // Company Address (required)
  phone: string;                   // Mobile Number (required)
  alternatePhone?: string;         // Alternative Mobile Number (optional)
  email: string;                   // Email ID (required)
  website?: string;                // Company Website URL (optional)
  companyLogo?: string;           // Company Logo (optional)
  logo?: string;                   // Alternative logo field name
}

export interface BusinessProfileTransaction {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  createdAt: string;
  verifiedAt?: string;
}

class BusinessProfileService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  // Get user-specific business profiles (with centralized caching)
  async getUserBusinessProfiles(userId: string): Promise<BusinessProfile[]> {
    const cacheKey = `business_profiles_user_${userId}`;

    return await cacheService.getOrFetch(
      cacheKey,
      async () => {
        // First check if backend is available with a quick health check
        try {
          await api.get('/health', { timeout: 5000 });
        } catch (healthError: any) {
          throw new Error('Backend server not available');
        }
        
        const response = await api.get(`/api/mobile/business-profile/${userId}`);
    
    if (response.data.success) {
          const profiles = response.data.data.profiles;
          
          if (profiles && profiles.length > 0) {
            // Convert backend profiles to frontend format
            const businessProfiles: BusinessProfile[] = profiles.map((profile: any) => {
              // Enhanced logo field mapping with detailed logging
              const logoMapping = {
                logo: profile.logo,
                companyLogo: profile.companyLogo,
                profileLogo: profile.profileLogo,
                businessLogo: profile.businessLogo,
                image: profile.image,
                photo: profile.photo,
              };
              
              // Find the first non-empty logo field
              const foundLogo = Object.values(logoMapping).find(url => url && url.trim() !== '') || '';
              
              console.log('🔍 [BUSINESS PROFILE] Profile logo mapping:', {
                id: profile.id,
                name: profile.name || profile.businessName,
                logoFields: logoMapping,
                selectedLogo: foundLogo,
                hasLogo: !!foundLogo
              });

              return {
                id: profile.id,
                name: profile.name || profile.businessName,
                description: profile.description || '',
                category: profile.category,
                subCategory: profile.subCategory || profile.subcategory,
                subcategory: profile.subCategory || profile.subcategory,
                address: profile.address || '',
                phone: profile.phone || '',
                alternatePhone: profile.alternatePhone || '',
                email: profile.email || '',
                website: profile.website || '',
                // Use the found logo for both fields
                logo: foundLogo,
                companyLogo: foundLogo,
                banner: profile.banner || profile.coverImage || '',
                services: [],
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt,
              };
            });
            
            console.log(`✅ [BUSINESS PROFILES] Fetched ${businessProfiles.length} profiles`);
            return businessProfiles;
          }
          return [];
        } else {
          return [];
        }
      },
      this.CACHE_TTL,
      true // Allow stale data
    ).catch((error: any) => {
      console.error('Error fetching business profiles:', error);
      
      // If it's a network/timeout error, throw it so the calling code can handle it
      if (error instanceof Error && (
        error.message === 'Backend server not available' ||
        error.message === 'TIMEOUT' ||
        error.message === 'NETWORK_ERROR' ||
        error.message.includes('timeout')
      )) {
        throw error;
      }
      
      return [];
    });
  }

  // Get all business profiles with centralized caching
  async getBusinessProfiles(): Promise<BusinessProfile[]> {
    const cacheKey = 'business_profiles_all';

    return await cacheService.getOrFetch(
      cacheKey,
      async () => {
        console.log('Fetching business profiles from API...');
        const response = await api.get('/api/mobile/business-profile');
        
        if (response.data.success) {
          const profiles = response.data.data.profiles.map((profile: any) => ({
            id: profile.id,
            name: profile.businessName,
            description: profile.description || '',
            category: profile.category,
            subCategory: profile.subCategory || profile.subcategory,
            subcategory: profile.subCategory || profile.subcategory,
            address: profile.address || '',
            phone: profile.phone || '',
            alternatePhone: profile.alternatePhone || '',
            email: profile.email || '',
            website: profile.website || '',
            logo: profile.logo || '',
            companyLogo: profile.logo || '',
            banner: '',
            services: [],
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }));
          console.log('✅ Business profiles loaded from API:', profiles.length, 'profiles');
          return profiles;
        } else {
          throw new Error('API returned unsuccessful response');
        }
      },
      this.CACHE_TTL,
      true // Allow stale data
    ).catch((error) => {
      console.error('❌ Error fetching business profiles from API:', error);
      console.log('⚠️ No profiles available due to API error');
      return [];
    });
  }

  // Get single business profile (with caching)
  async getBusinessProfile(id: string): Promise<BusinessProfile> {
    const cacheKey = `business_profile_${id}`;

    return await cacheService.getOrFetch(
      cacheKey,
      async () => {
        console.log('Fetching business profile by ID:', id);
        const response = await api.get(`/api/mobile/business-profile/${id}`);
        
        if (response.data.success) {
          const profile = response.data.data;
          const mappedProfile = {
            id: profile.id,
            name: profile.businessName,
            description: profile.description || '',
            category: profile.category,
            subCategory: profile.subCategory || profile.subcategory,
            subcategory: profile.subCategory || profile.subcategory,
            address: profile.address || '',
            phone: profile.phone || '',
            alternatePhone: profile.alternatePhone || '',
            email: profile.email || '',
            website: profile.website || '',
            logo: profile.logo || '',
            companyLogo: profile.logo || '',
            banner: '',
            services: [],
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          };
          console.log('✅ Business profile loaded from API:', mappedProfile.name);
          return mappedProfile;
        } else {
          throw new Error('API returned unsuccessful response');
        }
      },
      this.CACHE_TTL,
      true // Allow stale data
    ).catch((error) => {
      console.error('❌ Error fetching business profile from API:', error);
      console.log('⚠️ No profile available due to API error');
      // Throw error instead of returning mock data
      throw new Error(`Business profile with ID ${id} not found`);
    });
  }

  // Create new business profile
  async createBusinessProfile(data: CreateBusinessProfileData): Promise<BusinessProfile> {
    try {
      console.log('Creating business profile via API:', data.name);
      
      // Get current user for owner name
      const currentUser = authService.getCurrentUser();
      const ownerNameFromUser = currentUser?.name || currentUser?.companyName || currentUser?.displayName || currentUser?.firstName;
      const ownerNameFallback = currentUser?.email
        ? currentUser.email.split('@')[0]
        : (data.name ? `${data.name} Owner` : 'Business Owner');
      const ownerName = (ownerNameFromUser && ownerNameFromUser.trim()) || ownerNameFallback;

      const businessName = (data.name || '').trim();
      const email = (data.email || '').trim();
      const phone = (data.phone || '').trim();
      const category = (data.category || '').trim();
      const address = (data.address || '').trim();

      if (!businessName || !ownerName || !email || !phone || !category) {
        console.error('❌ [CREATE] Missing required fields:', {
          businessName,
          ownerName,
          email,
          phone,
          category,
        });
        throw new Error('Business name, owner name, email, phone, and category are required.');
      }
      
      // Handle logo upload if it's a local file path
      let logoUrl = data.companyLogo || '';
      if (logoUrl && this.isLocalFilePath(logoUrl)) {
        console.log('⚠️ [CREATE] Logo is a local file path, will send as-is (API should handle upload)');
        // Note: If API doesn't handle local paths, we'd need to upload first
        // For now, send it and let the API handle it
      }
      
      // Map frontend data to backend format
      const backendData = {
        businessName,
        ownerName,
        email,
        phone,
        address,
        category,
        subCategory: data.subCategory || data.subcategory,
        // Send both logo and companyLogo to ensure backend receives the logo
        logo: logoUrl,
        companyLogo: logoUrl,
        description: data.description || '',
        website: data.website || ''
      };
      
      console.log('📤 Sending business profile data:', JSON.stringify(backendData, null, 2));
      console.log('🖼️ Logo URL being sent:', logoUrl || '(empty)');
      
      const response = await api.post('/api/mobile/business-profile', backendData);
      
      if (response.data.success) {
        console.log('✅ Business profile created via API:', response.data.data.id);
        // Clear cache to force refresh
        const currentUser = authService.getCurrentUser();
        this.clearCache(currentUser?.id);
        
        // Map backend response to frontend format
        const backendProfile = response.data.data;
        const returnedLogo = backendProfile.logo || '';
        console.log('🖼️ Logo URL returned from API:', returnedLogo || '(empty)');
        
        const newProfile: BusinessProfile = {
          id: backendProfile.id,
          name: backendProfile.businessName,
          description: backendProfile.description || '',
          category: backendProfile.category,
          subCategory: backendProfile.subCategory || backendProfile.subcategory,
          subcategory: backendProfile.subCategory || backendProfile.subcategory,
          address: backendProfile.address || '',
          phone: backendProfile.phone || '',
          alternatePhone: backendProfile.alternatePhone || '',
          email: backendProfile.email || '',
          website: backendProfile.website || '',
          // Enhanced logo field mapping for created profiles
          companyLogo: returnedLogo || backendProfile.companyLogo || backendProfile.profileLogo || backendProfile.businessLogo || backendProfile.image || backendProfile.photo || '',
          logo: returnedLogo || backendProfile.companyLogo || backendProfile.profileLogo || backendProfile.businessLogo || backendProfile.image || backendProfile.photo || '',
          banner: '',
          services: [],
          createdAt: backendProfile.createdAt,
          updatedAt: backendProfile.updatedAt,
        };
        return newProfile;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error creating business profile via API:', error);
      console.log('⚠️ Business profile creation failed due to API error');
      // Throw error instead of creating mock profile
      throw new Error('Failed to create business profile');
    }
  }

  // Update business profile
  async updateBusinessProfile(id: string, data: Partial<CreateBusinessProfileData>): Promise<BusinessProfile> {
    try {
      console.log('Updating business profile via API:', id);
      
      // Validate logo URLs before sending to backend
      if (data.logo && this.isLocalFilePath(data.logo)) {
        console.error('❌ [UPDATE] Attempting to save local file path as logo:', data.logo);
        throw new Error(
          'Cannot save local file path as logo. Please use uploadImage() to upload the image file first.'
        );
      }
      if (data.companyLogo && this.isLocalFilePath(data.companyLogo)) {
        console.error('❌ [UPDATE] Attempting to save local file path as companyLogo:', data.companyLogo);
        throw new Error(
          'Cannot save local file path as logo. Please use uploadImage() to upload the image file first.'
        );
      }
      
      // SAFETY GUARD: Prevent accidental logo updates from user profile sync
      // Only allow logo updates if they come from explicit business profile operations
      if (data.logo !== undefined || data.companyLogo !== undefined) {
        console.warn('⚠️ [SAFETY] Logo update detected in business profile update');
        console.warn('⚠️ [SAFETY] This should only happen from explicit business profile operations, not user profile sync');
        // Allow the update but log warning for debugging - remove this block if you want to block completely
      }
      
      // Map frontend data to backend format - only include fields that are provided
      const backendData: any = {};
      
      if (data.name !== undefined) backendData.businessName = data.name;
      if (data.email !== undefined) backendData.email = data.email;
      if (data.phone !== undefined) backendData.phone = data.phone;
      if (data.address !== undefined) backendData.address = data.address;
      if (data.category !== undefined) backendData.category = data.category;
      if (data.subCategory !== undefined) backendData.subCategory = data.subCategory;
      if (data.subcategory !== undefined) backendData.subCategory = data.subcategory;
      // Use 'logo' field if provided, otherwise use 'companyLogo'
      if (data.logo !== undefined) backendData.logo = data.logo;
      else if (data.companyLogo !== undefined) backendData.logo = data.companyLogo;
      if (data.description !== undefined) backendData.description = data.description;
      if (data.website !== undefined) backendData.website = data.website;
      
      console.log('🔍 Making PUT request to:', `/api/mobile/business-profile/${id}`);
      console.log('📤 Request data (partial update):', backendData);
      
      const response = await api.put(`/api/mobile/business-profile/${id}`, backendData);
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📡 UPDATE BUSINESS PROFILE - BACKEND RESPONSE');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🆔 Profile ID:', id);
      console.log('📤 Data we sent:', JSON.stringify(backendData, null, 2));
      console.log('📥 Backend response:', JSON.stringify(response.data, null, 2));
      console.log('═══════════════════════════════════════════════════════════');
      
      if (response.data.success) {
        console.log('✅ Business profile updated via API:', response.data.data.businessName);
        // Clear cache to force refresh
        const currentUser = authService.getCurrentUser();
        this.clearCache(currentUser?.id);
        // Also clear the specific profile cache
        cacheService.clear(`business_profile_${id}`);
        
        // Map backend response to frontend format
        const backendProfile = response.data.data;
        
        console.log('📋 Backend returned profile fields:');
        console.log('   🏢 businessName:', backendProfile.businessName);
        console.log('   📍 address:', backendProfile.address || '(empty)');
        console.log('   🌐 website:', backendProfile.website || '(empty)');
        console.log('   🏷️ category:', backendProfile.category || '(empty)');
        console.log('   📝 description:', backendProfile.description || '(empty)');
        console.log('   📱 phone:', backendProfile.phone || '(empty)');
        console.log('   📱 alternatePhone:', backendProfile.alternatePhone || '(empty)');
        console.log('   📧 email:', backendProfile.email || '(empty)');
        console.log('   🖼️ logo:', backendProfile.logo || '(empty)');
        
        const updatedProfile: BusinessProfile = {
          id: backendProfile.id,
          name: backendProfile.businessName,
          description: backendProfile.description || '',
          category: backendProfile.category,
          subCategory: backendProfile.subCategory || backendProfile.subcategory,
          subcategory: backendProfile.subCategory || backendProfile.subcategory,
          address: backendProfile.address || '',
          phone: backendProfile.phone || '',
          alternatePhone: backendProfile.alternatePhone || '',
          email: backendProfile.email || '',
          website: backendProfile.website || '',
          companyLogo: backendProfile.logo || '',
          logo: backendProfile.logo || '',
          banner: '',
          services: [],
          createdAt: backendProfile.createdAt,
          updatedAt: backendProfile.updatedAt,
        };
        return updatedProfile;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error updating business profile via API:', error);
      console.log('⚠️ Business profile update failed due to API error');
      // Throw error instead of returning mock profile
      throw new Error('Failed to update business profile');
    }
  }

  // Delete business profile
  async deleteBusinessProfile(id: string): Promise<void> {
    try {
      console.log('Deleting business profile via API:', id);
      console.log('🔍 Making DELETE request to:', `/api/mobile/business-profile/${id}`);
      const response = await api.delete(`/api/mobile/business-profile/${id}`);
      
      if (response.data.success) {
        console.log('✅ Business profile deleted via API:', id);
        // Clear cache to force refresh
        const currentUser = authService.getCurrentUser();
        this.clearCache(currentUser?.id);
        // Also clear the specific profile cache
        cacheService.clear(`business_profile_${id}`);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error: any) {
      console.error('❌ Error deleting business profile via API:', error);
      
      // If endpoint doesn't exist (404), handle gracefully
      if (error.response?.status === 404) {
        console.log('⚠️ Delete endpoint not implemented on backend (404)');
        console.log('⚠️ Clearing cache to allow frontend-only removal');
        // Clear cache so the profile list can be refreshed
        this.clearCache();
        // Don't throw - allow the deletion to succeed on frontend only
        return;
      }
      
      console.log('⚠️ Business profile deletion failed due to API error');
      // Throw error for other types of failures
      throw new Error('Failed to delete business profile');
    }
  }

  // Upload image (logo or banner) using business profile upload endpoint
  async uploadImage(profileId: string, imageType: 'logo' | 'banner', imageUri: string): Promise<{ url: string }> {
    try {
      console.log('📤 [UPLOAD] Uploading business profile image:', imageType, 'for profile:', profileId);
      console.log('📍 [UPLOAD] Image URI:', imageUri);
      
      // Validate that it's not a local file path
      if (this.isLocalFilePath(imageUri)) {
        console.log('⚠️ [UPLOAD] Local file path detected, will upload to server');
      }
      
      // Extract filename and determine MIME type
      const filename = imageUri.split('/').pop() || `${imageType}.jpg`;
      const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';
      
      let mimeType = 'image/jpeg';
      if (fileExtension === 'png') mimeType = 'image/png';
      else if (fileExtension === 'gif') mimeType = 'image/gif';
      else if (fileExtension === 'webp') mimeType = 'image/webp';
      
      console.log('📋 [UPLOAD] File info:', { filename, fileExtension, mimeType });
      
      const formData = new FormData();
      formData.append('logo', {
        uri: imageUri,
        type: mimeType,
        name: filename,
      } as any);

      console.log('📡 [UPLOAD] Uploading to:', `/api/mobile/business-profile/${profileId}/upload`);
      console.log('📋 [UPLOAD] FormData details:', {
        fieldName: 'logo',
        fileName: filename,
        mimeType,
        profileId,
      });
      
      try {
        const response = await api.post(`/api/mobile/business-profile/${profileId}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        });
        
        console.log('📡 [UPLOAD] Upload response:', response.data);
        
        if (response.data.success) {
          const uploadedUrl = response.data.data?.url || response.data.url;
          console.log('✅ [UPLOAD] Business profile image uploaded successfully:', uploadedUrl);
          // Clear cache to force refresh
          const currentUser = authService.getCurrentUser();
          this.clearCache(currentUser?.id);
          // Also clear the specific profile cache
          cacheService.clear(`business_profile_${profileId}`);
          return { url: uploadedUrl };
        } else {
          const apiError = response.data.error || response.data.message || 'Unknown API error';
          console.error('❌ [UPLOAD] API returned unsuccessful response:', apiError);
          throw new Error(`API error: ${apiError}`);
        }
      } catch (uploadError: any) {
        const status = uploadError.response?.status;
        const errorMessage = uploadError.response?.data?.message || uploadError.response?.data?.error || uploadError.message;
        const errorData = uploadError.response?.data;
        
        console.error('❌ [UPLOAD] Upload failed:', {
          status,
          errorMessage,
          errorData,
          profileId,
          originalError: uploadError
        });
        
        // If endpoint doesn't exist (404), provide helpful error
        if (status === 404) {
          throw new Error(
            'Backend upload endpoint not implemented yet. ' +
            'Please ask the backend team to implement POST /api/mobile/business-profile/:profileId/upload. ' +
            'See BACKEND_LOGO_UPLOAD_FIX_REQUIRED.txt for implementation guide.'
          );
        }
        
        // If server error (500), provide more specific guidance
        if (status === 500) {
          throw new Error(
            'Backend server error during upload. This is likely a backend configuration issue. ' +
            'Please contact the backend team to check the upload endpoint implementation. ' +
            'Error: ' + (errorMessage || 'Internal server error')
          );
        }
        
        // Re-throw other errors with more context
        throw new Error(`Upload failed: ${errorMessage || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('❌ [UPLOAD] Error uploading business profile image:', error);
      throw error;
    }
  }

  // Helper: Check if a URL is a local file path
  isLocalFilePath(url: string): boolean {
    if (!url) return false;
    return (
      url.startsWith('file://') ||
      url.startsWith('content://') ||
      url.startsWith('/storage/') ||
      url.startsWith('/data/') ||
      url.includes('\\') // Windows paths
    );
  }

  // Search business profiles (API endpoint removed - use client-side filtering)
  // Searches by: Company Name, Business Category, Mobile Number
  // If userId is provided, searches only that user's profiles
  async searchBusinessProfiles(query: string, userId?: string): Promise<BusinessProfile[]> {
    console.log('⚠️ searchBusinessProfiles - API endpoint removed');
    console.log('⚠️ GET /api/mobile/business-profile?search={query} is no longer supported');
    console.log('🔍 Performing client-side search on query:', query);
    console.log('🔍 User ID:', userId || 'ALL PROFILES');
    console.log('🔍 Search fields: Company Name, Business Category, Mobile Number');
    
    try {
      // Get profiles (user-specific or all)
      let profilesToSearch: BusinessProfile[];
      
      if (userId) {
        console.log('📋 Fetching profiles for user:', userId);
        profilesToSearch = await this.getUserBusinessProfiles(userId);
      } else {
        console.log('📋 Fetching all profiles (no userId provided)');
        profilesToSearch = await this.getBusinessProfiles();
      }
      
      if (!query || query.trim() === '') {
        console.log('📋 Empty query - returning all fetched profiles:', profilesToSearch.length);
        return profilesToSearch;
      }
      
      const lowercaseQuery = query.toLowerCase().trim();
      
      // Filter profiles by company name, business category, or mobile number
      const filtered = profilesToSearch.filter(profile => {
        const matchesName = profile.name.toLowerCase().includes(lowercaseQuery);
        const matchesCategory = profile.category.toLowerCase().includes(lowercaseQuery);
        const matchesPhone = profile.phone.toLowerCase().includes(lowercaseQuery);
        
        return matchesName || matchesCategory || matchesPhone;
      });
      
      console.log('✅ Client-side search completed:', filtered.length, 'results found');
      console.log('📊 Search breakdown:');
      console.log('   - By Company Name:', filtered.filter(p => p.name.toLowerCase().includes(lowercaseQuery)).length);
      console.log('   - By Category:', filtered.filter(p => p.category.toLowerCase().includes(lowercaseQuery)).length);
      console.log('   - By Mobile:', filtered.filter(p => p.phone.toLowerCase().includes(lowercaseQuery)).length);
      
      return filtered;
    } catch (error) {
      console.error('❌ Error during client-side search:', error);
      return [];
    }
  }

  // Get business profiles by category
  async getBusinessProfilesByCategory(category: string): Promise<BusinessProfile[]> {
    try {
      console.log('Fetching business profiles by category via API:', category);
      const response = await api.get(`/api/mobile/business-profile?category=${encodeURIComponent(category)}`);
      
      if (response.data.success) {
        const backendProfiles = response.data.data.profiles;
        
        // Map backend profiles to frontend format
        const profiles = backendProfiles.map((profile: any) => ({
          id: profile.id,
          name: profile.businessName,
          description: profile.description || '',
          category: profile.category,
          subCategory: profile.subCategory || profile.subcategory,
          subcategory: profile.subCategory || profile.subcategory,
          address: profile.address || '',
          phone: profile.phone || '',
          alternatePhone: profile.alternatePhone || '',
          email: profile.email || '',
          website: profile.website || '',
          logo: profile.logo || '',
          companyLogo: profile.logo || '',
          banner: '',
          services: [],
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        }));
        
        console.log('✅ Business profiles by category loaded via API:', profiles.length, 'profiles');
        return profiles;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching business profiles by category via API:', error);
      console.log('⚠️ No profiles available for category due to API error');
      // Return empty array instead of mock data
      return [];
    }
  }

  // Verify business profile
  async verifyBusinessProfile(id: string): Promise<BusinessProfile> {
    try {
      // This would need a specific verification endpoint
      console.log('⚠️ Business profile verification not implemented - API endpoint needed');
      throw new Error('Business profile verification not available');
    } catch (error) {
      console.error('Error verifying business profile:', error);
      throw error;
    }
  }

  // Create payment order for business profile purchase
  /** @deprecated Use subscriptionApi.createBusinessProfileAutopay instead */
  async createBusinessProfilePaymentOrder(params?: { amount?: number; currency?: string }) {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const payload = {
        amount: params?.amount ?? 599,
        currency: params?.currency ?? 'INR',
      };

      console.log('🧾 Creating business profile payment order:', payload);
      const response = await api.post('/api/mobile/business-profile/create-payment-order', payload);

      if (response.data?.success) {
        console.log('✅ Business profile payment order created:', response.data.data);
        return response.data.data;
      }

      console.warn('⚠️ Business profile payment order API returned unsuccessful response');
      throw new Error(response.data?.message || 'Failed to create payment order');
    } catch (error) {
      console.error('❌ Error creating business profile payment order:', error);
      throw error;
    }
  }

  // Verify payment for business profile creation
  /** @deprecated Subscription mandates are verified via webhooks; use subscriptionApi.getBusinessProfileSubscriptionStatus for status checks */
  async verifyBusinessProfilePayment(paymentData: {
    orderId: string;
    paymentId: string;
    signature: string;
    amount?: number;
    amountPaise?: number;
    currency?: string;
    email?: string;
    contact?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Verifying business profile payment with backend:', {
        orderId: paymentData.orderId,
        paymentId: paymentData.paymentId,
      });
      
      const payload: Record<string, any> = {
        orderId: paymentData.orderId,
        paymentId: paymentData.paymentId,
        signature: paymentData.signature,
        type: 'business_profile', // Indicate this is for business profile payment
      };

      if (typeof paymentData.amount === 'number') {
        payload.amount = paymentData.amount;
      }

      if (typeof paymentData.amountPaise === 'number') {
        payload.amountPaise = paymentData.amountPaise;
      }

      if (paymentData.currency) {
        payload.currency = paymentData.currency;
      }

      if (paymentData.email) {
        payload.email = paymentData.email;
      }

      if (paymentData.contact) {
        payload.contact = paymentData.contact;
      }

      console.log('📨 Sending business profile payment verification payload:', payload);

      const response = await api.post('/api/mobile/business-profile/verify-payment', payload);
      
      console.log('✅ Business profile payment verified successfully:', response.data);
      
      if (response.data.success) {
        return response.data;
      } else {
        // If API returns unsuccessful response, throw error with message
        const errorMessage = response.data.message || 'Payment verification failed';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Business profile payment verification error:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // Provide more detailed error message
      let errorMessage = 'Payment verification failed';
      
      if (error.response?.status === 404) {
        errorMessage = 'Payment verification endpoint not found. Please contact support.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid payment data. Please try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error during payment verification. Please contact support.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  // Check if user has paid for additional business profile creation
  /** @deprecated Use subscriptionApi.getBusinessProfileSubscriptionStatus instead */
  async checkBusinessProfilePaymentStatus(): Promise<{ hasPaid: boolean; message?: string }> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Checking business profile payment status for user:', userId);
      
      const response = await api.get('/api/mobile/business-profile/payment-status');
      
      if (response.data.success) {
        const hasPaid = response.data.data?.hasPaid || response.data.data?.paymentVerified || false;
        console.log('✅ Payment status checked:', hasPaid ? 'Payment verified' : 'Payment not verified');
        return {
          hasPaid,
          message: response.data.message
        };
      } else {
        console.log('⚠️ Payment status check returned unsuccessful response');
        return { hasPaid: false, message: response.data.message || 'Payment verification required' };
      }
    } catch (error: any) {
      console.error('❌ Error checking business profile payment status:', error);
      
      // If endpoint doesn't exist (404), assume payment is required
      if (error.response?.status === 404) {
        console.log('⚠️ Payment status endpoint not found, assuming payment required');
        return { hasPaid: false, message: 'Payment verification required' };
      }
      
      // For other errors, assume payment is required for safety
      return { hasPaid: false, message: 'Unable to verify payment status' };
    }
  }

  // Get business profile transaction history
  async getTransactionHistory(page = 1, limit = 10): Promise<{
    success: boolean;
    data: BusinessProfileTransaction[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id;

      if (!userId) {
        console.log('⚠️ No user ID available, cannot fetch business profile transactions');
        return {
          success: false,
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
        };
      }

      console.log('🔍 Fetching business profile transaction history for user:', userId);

      const response = await api.get('/api/mobile/business-profile/transactions', {
        params: { page, limit },
      });

      if (response.data.success) {
        const transactions = response.data.data || [];
        const pagination = response.data.pagination || {
          total: transactions.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        };

        console.log('✅ Retrieved business profile transactions:', transactions.length);
        return {
          success: true,
          data: transactions,
          pagination,
        };
      } else {
        console.log('⚠️ Business profile transactions API returned unsuccessful response');
        return {
          success: false,
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
        };
      }
    } catch (error: any) {
      console.error('❌ Error fetching business profile transaction history:', error);

      // If it's a 401 error, return empty history instead of throwing
      if (error.response?.status === 401) {
        console.log('⚠️ Business profile transaction history requires authentication, returning empty history');
        return {
          success: false,
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
        };
      }

      throw error;
    }
  }

  // Clear cache (useful for testing or when data needs to be refreshed)
  clearCache(userId?: string): void {
    if (userId) {
      // Clear user-specific cache
      cacheService.clear(`business_profiles_user_${userId}`);
      // Also clear individual profile caches for this user's profiles
      cacheService.clearPattern(`business_profile_`);
    } else {
      // Clear all business profile caches
      cacheService.clearPattern('business_profiles_');
      cacheService.clearPattern('business_profile_');
    }
    console.log('🗑️ [BUSINESS PROFILES] Cache cleared');
  }

  // Mock data method removed - using only API data
}

export default new BusinessProfileService(); 