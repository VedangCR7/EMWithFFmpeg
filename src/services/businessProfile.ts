import api from './api';
import eventMarketersBusinessProfileService from './eventMarketersBusinessProfileService';

export interface BusinessProfile {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  website?: string;
  logo?: string;
  companyLogo?: string;
  banner?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  services: string[];
  workingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessProfileData {
  name: string;                    // Company Name (required)
  description?: string;            // Company Description (optional)
  category: string;                // Business Category (required) - Event Planners, Decorators, Sound Suppliers, Light Suppliers, Video Services
  address: string;                 // Company Address (required)
  phone: string;                   // Mobile Number (required)
  alternatePhone?: string;         // Alternative Mobile Number (optional)
  email: string;                   // Email ID (required)
  website?: string;                // Company Website URL (optional)
  companyLogo?: string;           // Company Logo (optional)
}

class BusinessProfileService {
  private profilesCache: BusinessProfile[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Get all business profiles with caching
  async getBusinessProfiles(): Promise<BusinessProfile[]> {
    // Check if cache is valid
    if (this.profilesCache && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('Returning cached business profiles');
      return this.profilesCache;
    }

    try {
      console.log('Fetching business profiles from API...');
      const response = await api.get('/business-profiles');
      
      if (response.data.success) {
        const profiles = response.data.data.profiles;
        this.profilesCache = profiles;
        this.cacheTimestamp = Date.now();
        console.log('✅ Business profiles loaded from API:', profiles.length, 'profiles');
        return profiles;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching business profiles from API:', error);
      // Return cached data if available, otherwise mock data
      if (this.profilesCache) {
        console.log('⚠️ Using cached profiles due to API error');
        return this.profilesCache;
      }
      console.log('⚠️ Using mock profiles due to API error');
      return this.getMockProfiles();
    }
  }

  // Get single business profile
  async getBusinessProfile(id: string): Promise<BusinessProfile> {
    try {
      console.log('Fetching business profile by ID:', id);
      const response = await api.get(`/business-profiles/${id}`);
      
      if (response.data.success) {
        console.log('✅ Business profile loaded from API:', response.data.data.name);
        return response.data.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching business profile from API:', error);
      console.log('⚠️ Using mock profile due to API error');
      // Fallback to mock data
      const mockProfiles = this.getMockProfiles();
      return mockProfiles.find(p => p.id === id) || mockProfiles[0];
    }
  }

  // Create new business profile
  async createBusinessProfile(data: CreateBusinessProfileData): Promise<BusinessProfile> {
    try {
      console.log('Creating business profile via EventMarketers API:', data.name);
      
      // Try EventMarketers API first
      const eventMarketersData = {
        businessName: data.name,
        businessEmail: data.email,
        businessPhone: data.phone,
        businessWebsite: data.website,
        businessAddress: data.address,
        businessDescription: data.description || '',
        businessCategory: data.category
      };
      
      const response = await eventMarketersBusinessProfileService.createBusinessProfile(eventMarketersData);
      
      if (response.success) {
        console.log('✅ Business profile created via EventMarketers API:', response.profile.id);
        // Clear cache to force refresh
        this.clearCache();
        
        // Convert EventMarketers response to our format
        const newProfile: BusinessProfile = {
          id: response.profile.id,
          name: response.profile.businessName,
          description: response.profile.businessDescription,
          category: response.profile.businessCategory,
          address: response.profile.businessAddress,
          phone: response.profile.businessPhone,
          alternatePhone: '',
          email: response.profile.businessEmail,
          website: response.profile.businessWebsite || '',
          companyLogo: '',
          logo: '',
          banner: '',
          socialMedia: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: '',
          },
          services: [],
          workingHours: {
            monday: { open: '09:00', close: '18:00', isOpen: true },
            tuesday: { open: '09:00', close: '18:00', isOpen: true },
            wednesday: { open: '09:00', close: '18:00', isOpen: true },
            thursday: { open: '09:00', close: '18:00', isOpen: true },
            friday: { open: '09:00', close: '18:00', isOpen: true },
            saturday: { open: '10:00', close: '16:00', isOpen: true },
            sunday: { open: '00:00', close: '00:00', isOpen: false },
          },
          rating: 0,
          reviewCount: 0,
          isVerified: false,
          createdAt: response.profile.createdAt,
          updatedAt: response.profile.createdAt,
        };
        return newProfile;
      } else {
        throw new Error('EventMarketers API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error creating business profile via EventMarketers API:', error);
      console.log('⚠️ Falling back to original API');
      
      // Fallback to original API
      try {
        const response = await api.post('/business-profiles', data);
        
        if (response.data.success) {
          console.log('✅ Business profile created via original API:', response.data.data.name);
          this.clearCache();
          return response.data.data;
        } else {
          throw new Error('Original API returned unsuccessful response');
        }
      } catch (fallbackError) {
        console.error('❌ Error creating business profile via original API:', fallbackError);
        console.log('⚠️ Creating mock business profile due to API error');
        
        // Fallback to mock creation
        const newProfile: BusinessProfile = {
          id: Date.now().toString(),
          name: data.name,
          description: data.description || '',
          category: data.category,
          address: data.address,
          phone: data.phone,
          alternatePhone: data.alternatePhone || '',
          email: data.email,
          website: data.website || '',
          companyLogo: data.companyLogo || '',
          logo: data.companyLogo || '',
          banner: '',
          socialMedia: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: '',
          },
          services: [],
          workingHours: {
            monday: { open: '09:00', close: '18:00', isOpen: true },
            tuesday: { open: '09:00', close: '18:00', isOpen: true },
            wednesday: { open: '09:00', close: '18:00', isOpen: true },
            thursday: { open: '09:00', close: '18:00', isOpen: true },
            friday: { open: '09:00', close: '18:00', isOpen: true },
            saturday: { open: '10:00', close: '16:00', isOpen: true },
            sunday: { open: '00:00', close: '00:00', isOpen: false },
          },
          rating: 0,
          reviewCount: 0,
          isVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return newProfile;
      }
    }
  }

  // Update business profile
  async updateBusinessProfile(id: string, data: Partial<CreateBusinessProfileData>): Promise<BusinessProfile> {
    try {
      console.log('Updating business profile via API:', id);
      const response = await api.put(`/business-profiles/${id}`, data);
      
      if (response.data.success) {
        console.log('✅ Business profile updated via API:', response.data.data.name);
        // Clear cache to force refresh
        this.clearCache();
        return response.data.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error updating business profile via API:', error);
      console.log('⚠️ Creating mock updated profile due to API error');
      // Fallback to mock update
      const updatedProfile: BusinessProfile = {
        id,
        name: data.name || '',
        description: data.description || '',
        category: data.category || '',
        address: data.address || '',
        phone: data.phone || '',
        alternatePhone: data.alternatePhone || '',
        email: data.email || '',
        website: data.website || '',
        companyLogo: data.companyLogo || '',
        logo: data.companyLogo || '',
        banner: '',
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
        },
        services: [],
        workingHours: {
          monday: { open: '09:00', close: '18:00', isOpen: true },
          tuesday: { open: '09:00', close: '18:00', isOpen: true },
          wednesday: { open: '09:00', close: '18:00', isOpen: true },
          thursday: { open: '09:00', close: '18:00', isOpen: true },
          friday: { open: '09:00', close: '18:00', isOpen: true },
          saturday: { open: '10:00', close: '16:00', isOpen: true },
          sunday: { open: '00:00', close: '00:00', isOpen: false },
        },
        rating: 0,
        reviewCount: 0,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return updatedProfile;
    }
  }

  // Delete business profile
  async deleteBusinessProfile(id: string): Promise<void> {
    try {
      console.log('Deleting business profile via API:', id);
      const response = await api.delete(`/business-profiles/${id}`);
      
      if (response.data.success) {
        console.log('✅ Business profile deleted via API:', id);
        // Clear cache to force refresh
        this.clearCache();
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error deleting business profile via API:', error);
      console.log('⚠️ Mock deletion completed due to API error');
      // Clear cache anyway for consistency
      this.clearCache();
    }
  }

  // Upload image (logo or banner) using business profile upload endpoint
  async uploadImage(profileId: string, imageType: 'logo' | 'banner', imageUri: string): Promise<{ url: string }> {
    try {
      console.log('Uploading business profile image via API:', imageType, 'for profile:', profileId);
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `${imageType}_${Date.now()}.jpg`,
      } as any);
      formData.append('type', imageType);

      const response = await api.post(`/business-profiles/${profileId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        console.log('✅ Business profile image uploaded via API:', response.data.data.url);
        // Clear cache to force refresh
        this.clearCache();
        return { url: response.data.data.url };
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error uploading business profile image via API:', error);
      console.log('⚠️ Returning mock URL due to API error');
      // Fallback to mock URL
      return { url: `https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=200&fit=crop` };
    }
  }

  // Search business profiles
  async searchBusinessProfiles(query: string): Promise<BusinessProfile[]> {
    try {
      console.log('Searching business profiles via API:', query);
      const response = await api.get(`/business-profiles?search=${encodeURIComponent(query)}`);
      
      if (response.data.success) {
        const profiles = response.data.data.profiles;
        console.log('✅ Business profiles search completed via API:', profiles.length, 'results');
        return profiles;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error searching business profiles via API:', error);
      console.log('⚠️ Using mock search results due to API error');
      // Fallback to mock data search
      const mockProfiles = this.getMockProfiles();
      return mockProfiles.filter(profile => 
        profile.name.toLowerCase().includes(query.toLowerCase()) ||
        profile.category.toLowerCase().includes(query.toLowerCase()) ||
        profile.description.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  // Get business profiles by category
  async getBusinessProfilesByCategory(category: string): Promise<BusinessProfile[]> {
    try {
      console.log('Fetching business profiles by category via API:', category);
      const response = await api.get(`/business-profiles?category=${encodeURIComponent(category)}`);
      
      if (response.data.success) {
        const profiles = response.data.data.profiles;
        console.log('✅ Business profiles by category loaded via API:', profiles.length, 'profiles');
        return profiles;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching business profiles by category via API:', error);
      console.log('⚠️ Using mock profiles by category due to API error');
      // Fallback to mock data filtering
      const mockProfiles = this.getMockProfiles();
      return mockProfiles.filter(profile => 
        profile.category.toLowerCase() === category.toLowerCase()
      );
    }
  }

  // Verify business profile
  async verifyBusinessProfile(id: string): Promise<BusinessProfile> {
    try {
      // This would need a specific verification endpoint
      const mockProfiles = this.getMockProfiles();
      const profile = mockProfiles.find(p => p.id === id);
      if (profile) {
        profile.isVerified = true;
        profile.updatedAt = new Date().toISOString();
      }
      return profile || mockProfiles[0];
    } catch (error) {
      console.error('Error verifying business profile:', error);
      throw error;
    }
  }

  // Clear cache (useful for testing or when data needs to be refreshed)
  clearCache(): void {
    this.profilesCache = null;
    this.cacheTimestamp = 0;
  }

  // Get mock profiles for development
  private getMockProfiles(): BusinessProfile[] {
    return [
      {
        id: '1',
        name: 'Tech Solutions Inc.',
        description: 'Leading technology solutions provider specializing in custom software development and digital transformation.',
        category: 'Technology',
        address: '123 Innovation Drive, Tech City, TC 12345',
        phone: '+1 (555) 123-4567',
        email: 'contact@techsolutions.com',
        website: 'https://techsolutions.com',
        logo: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=200&fit=crop',
        banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
        socialMedia: {
          facebook: 'https://facebook.com/techsolutions',
          instagram: 'https://instagram.com/techsolutions',
          linkedin: 'https://linkedin.com/company/techsolutions',
        },
        services: ['Custom Software Development', 'Web Development', 'Mobile Apps', 'Cloud Solutions'],
        workingHours: {
          monday: { open: '09:00', close: '18:00', isOpen: true },
          tuesday: { open: '09:00', close: '18:00', isOpen: true },
          wednesday: { open: '09:00', close: '18:00', isOpen: true },
          thursday: { open: '09:00', close: '18:00', isOpen: true },
          friday: { open: '09:00', close: '18:00', isOpen: true },
          saturday: { open: '10:00', close: '16:00', isOpen: true },
          sunday: { open: '00:00', close: '00:00', isOpen: false },
        },
        rating: 4.8,
        reviewCount: 156,
        isVerified: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
      },
      {
        id: '2',
        name: 'Creative Design Studio',
        description: 'Award-winning design studio creating stunning visual experiences for brands worldwide.',
        category: 'Design',
        address: '456 Creative Avenue, Design District, DD 67890',
        phone: '+1 (555) 987-6543',
        email: 'hello@creativedesign.com',
        website: 'https://creativedesign.com',
        logo: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=200&h=200&fit=crop',
        banner: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=200&fit=crop',
        socialMedia: {
          instagram: 'https://instagram.com/creativedesign',
          twitter: 'https://twitter.com/creativedesign',
          linkedin: 'https://linkedin.com/company/creativedesign',
        },
        services: ['Brand Identity', 'UI/UX Design', 'Print Design', 'Digital Marketing'],
        workingHours: {
          monday: { open: '10:00', close: '19:00', isOpen: true },
          tuesday: { open: '10:00', close: '19:00', isOpen: true },
          wednesday: { open: '10:00', close: '19:00', isOpen: true },
          thursday: { open: '10:00', close: '19:00', isOpen: true },
          friday: { open: '10:00', close: '19:00', isOpen: true },
          saturday: { open: '11:00', close: '17:00', isOpen: true },
          sunday: { open: '00:00', close: '00:00', isOpen: false },
        },
        rating: 4.9,
        reviewCount: 89,
        isVerified: true,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T16:45:00Z',
      },
      {
        id: '3',
        name: 'Green Earth Restaurant',
        description: 'Sustainable dining experience with farm-to-table organic ingredients and eco-friendly practices.',
        category: 'Restaurant',
        address: '789 Organic Street, Food District, FD 11111',
        phone: '+1 (555) 456-7890',
        email: 'info@greenearth.com',
        website: 'https://greenearth.com',
        logo: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=200&h=200&fit=crop',
        banner: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=200&fit=crop',
        socialMedia: {
          facebook: 'https://facebook.com/greenearth',
          instagram: 'https://instagram.com/greenearth',
        },
        services: ['Fine Dining', 'Catering', 'Private Events', 'Cooking Classes'],
        workingHours: {
          monday: { open: '11:00', close: '22:00', isOpen: true },
          tuesday: { open: '11:00', close: '22:00', isOpen: true },
          wednesday: { open: '11:00', close: '22:00', isOpen: true },
          thursday: { open: '11:00', close: '22:00', isOpen: true },
          friday: { open: '11:00', close: '23:00', isOpen: true },
          saturday: { open: '10:00', close: '23:00', isOpen: true },
          sunday: { open: '10:00', close: '21:00', isOpen: true },
        },
        rating: 4.7,
        reviewCount: 234,
        isVerified: false,
        createdAt: '2024-01-05T12:00:00Z',
        updatedAt: '2024-01-22T11:20:00Z',
      },
    ];
  }
}

export default new BusinessProfileService(); 