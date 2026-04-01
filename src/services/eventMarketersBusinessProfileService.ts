import api from './api';

export interface BusinessProfileRequest {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessWebsite?: string;
  businessAddress: string;
  businessDescription: string;
  businessCategory: string;
}

export interface BusinessProfileResponse {
  success: boolean;
  profile: {
    id: string;
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    businessWebsite?: string;
    businessAddress: string;
    businessDescription: string;
    businessCategory: string;
    createdAt: string;
  };
}

export interface LogoUploadResponse {
  success: boolean;
  logoUrl: string;
}

class BusinessProfileService {
  private profileCache: Map<string, BusinessProfileResponse['profile']> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

  // Create business profile
  async createBusinessProfile(profileData: BusinessProfileRequest): Promise<BusinessProfileResponse> {
    try {
      console.log('Creating business profile:', profileData.businessName);
      const response = await api.post('/api/business-profile/profile', profileData);
      
      if (response.data.success) {
        console.log('✅ Business profile created:', response.data.profile.id);
        
        // Cache the profile
        this.profileCache.set(response.data.profile.id, response.data.profile);
        
        return response.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to create business profile:', error);
      throw error;
    }
  }

  // Upload business logo
  async uploadBusinessLogo(logoFile: any): Promise<LogoUploadResponse> {
    try {
      console.log('Uploading business logo...');
      
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await api.post('/api/business-profile/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        console.log('✅ Business logo uploaded:', response.data.logoUrl);
        return response.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to upload business logo:', error);
      throw error;
    }
  }

  // Get business profile by ID
  async getBusinessProfile(profileId: string): Promise<BusinessProfileResponse['profile'] | null> {
    try {
      // Check cache first
      const cached = this.profileCache.get(profileId);
      if (cached && this.isCacheValid(profileId)) {
        console.log('✅ Returning cached business profile');
        return cached;
      }

      // This endpoint doesn't exist in the API collection, but we can implement it
      // For now, return cached data or null
      if (cached) {
        console.log('⚠️ Using cached business profile');
        return cached;
      }
      
      console.log('⚠️ Business profile not found');
      return null;
    } catch (error) {
      console.error('Failed to get business profile:', error);
      return null;
    }
  }

  // Update business profile
  async updateBusinessProfile(profileId: string, profileData: Partial<BusinessProfileRequest>): Promise<BusinessProfileResponse> {
    try {
      console.log('Updating business profile:', profileId);
      
      // This endpoint doesn't exist in the API collection, but we can implement it
      // For now, return a mock response
      const updatedProfile: BusinessProfileResponse['profile'] = {
        id: profileId,
        businessName: profileData.businessName || 'Updated Business',
        businessEmail: profileData.businessEmail || 'updated@example.com',
        businessPhone: profileData.businessPhone || '+1234567890',
        businessWebsite: profileData.businessWebsite,
        businessAddress: profileData.businessAddress || 'Updated Address',
        businessDescription: profileData.businessDescription || 'Updated Description',
        businessCategory: profileData.businessCategory || 'Updated Category',
        createdAt: new Date().toISOString()
      };

      // Update cache
      this.profileCache.set(profileId, updatedProfile);
      
      console.log('✅ Business profile updated (mock)');
      return {
        success: true,
        profile: updatedProfile
      };
    } catch (error) {
      console.error('❌ Failed to update business profile:', error);
      throw error;
    }
  }

  // Delete business profile
  async deleteBusinessProfile(profileId: string): Promise<boolean> {
    try {
      console.log('Deleting business profile:', profileId);
      
      // This endpoint doesn't exist in the API collection, but we can implement it
      // For now, just remove from cache
      this.profileCache.delete(profileId);
      
      console.log('✅ Business profile deleted (mock)');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete business profile:', error);
      return false;
    }
  }

  // Validate business profile data - Only company name, business category, phone number, and email are required
  validateBusinessProfileData(profileData: BusinessProfileRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!profileData.businessName?.trim()) {
      errors.push('Business name is required');
    }

    if (!profileData.businessEmail?.trim()) {
      errors.push('Business email is required');
    } else if (!this.isValidEmail(profileData.businessEmail)) {
      errors.push('Invalid email format');
    }

    if (!profileData.businessPhone?.trim()) {
      errors.push('Business phone is required');
    }

    if (!profileData.businessCategory?.trim()) {
      errors.push('Business category is required');
    }

    if (profileData.businessWebsite && !this.isValidUrl(profileData.businessWebsite)) {
      errors.push('Invalid website URL format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get all cached profiles
  getAllCachedProfiles(): BusinessProfileResponse['profile'][] {
    return Array.from(this.profileCache.values());
  }

  // Clear cache
  clearCache(): void {
    this.profileCache.clear();
    console.log('Business profile cache cleared');
  }

  // Check if cache is valid
  private isCacheValid(profileId: string): boolean {
    const timestamp = this.getCacheTimestamp(profileId);
    return timestamp && (Date.now() - timestamp) < this.CACHE_DURATION;
  }

  // Get cache timestamp
  private getCacheTimestamp(profileId: string): number {
    return parseInt(localStorage.getItem(`business_profile_cache_${profileId}`) || '0');
  }

  // Set cache timestamp
  private setCacheTimestamp(profileId: string): void {
    localStorage.setItem(`business_profile_cache_${profileId}`, Date.now().toString());
  }

  // Validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate URL format
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Get business categories for dropdown (this would typically come from another service)
  getBusinessCategories(): string[] {
    return [
      'Restaurant',
      'Wedding Planning',
      'Electronics',
      'Fashion',
      'Health & Fitness',
      'Education',
      'Automotive',
      'Real Estate',
      'Technology',
      'Entertainment',
      'Sports',
      'Travel',
      'Beauty',
      'Home & Garden',
      'Finance',
      'Legal',
      'Consulting',
      'Manufacturing',
      'Retail',
      'Other'
    ];
  }

  // Create business profile with validation
  async createBusinessProfileWithValidation(profileData: BusinessProfileRequest): Promise<BusinessProfileResponse> {
    const validation = this.validateBusinessProfileData(profileData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return await this.createBusinessProfile(profileData);
  }

  // Upload logo with validation
  async uploadBusinessLogoWithValidation(logoFile: any): Promise<LogoUploadResponse> {
    if (!logoFile) {
      throw new Error('Logo file is required');
    }

    // Check file size (assuming it's a file object with size property)
    if (logoFile.size && logoFile.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Logo file size must be less than 5MB');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (logoFile.type && !allowedTypes.includes(logoFile.type)) {
      throw new Error('Logo must be a JPEG, PNG, or GIF image');
    }

    return await this.uploadBusinessLogo(logoFile);
  }
}

export default new BusinessProfileService();
