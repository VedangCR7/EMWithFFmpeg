import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserBusinessProfile {
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
  userId?: string; // Add user ID to make profiles user-specific
}

export interface CreateUserBusinessProfileData {
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
}

class UserBusinessProfilesService {
  private readonly STORAGE_KEY = 'user_business_profiles';

  // Save business profile with user ID
  async saveBusinessProfile(profile: Omit<UserBusinessProfile, 'id' | 'createdAt' | 'updatedAt' | 'userId'>, userId?: string): Promise<UserBusinessProfile> {
    try {
      const existingProfiles = await this.getAllBusinessProfiles();
      
      const newProfile: UserBusinessProfile = {
        ...profile,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: userId || 'anonymous', // Add user ID
      };

      const updatedProfiles = [...existingProfiles, newProfile];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedProfiles));

      console.log('✅ Business profile saved for user:', userId);
      return newProfile;
    } catch (error) {
      console.error('Error saving business profile:', error);
      throw new Error('Failed to save business profile');
    }
  }

  // Get all business profiles (internal method - no filtering)
  private async getAllBusinessProfiles(): Promise<UserBusinessProfile[]> {
    try {
      const profilesJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!profilesJson) {
        return [];
      }
      return JSON.parse(profilesJson);
    } catch (error) {
      console.error('Error getting all business profiles:', error);
      return [];
    }
  }

  // Get business profiles for specific user
  async getBusinessProfiles(userId?: string): Promise<UserBusinessProfile[]> {
    try {
      const allProfiles = await this.getAllBusinessProfiles();
      
      // Filter by user ID if provided
      const userProfiles = userId 
        ? allProfiles.filter(profile => profile.userId === userId)
        : allProfiles.filter(profile => !profile.userId || profile.userId === 'anonymous');
      
      // Sort by creation date (newest first)
      return userProfiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting business profiles for user:', error);
      return [];
    }
  }

  // Get business profile by ID for specific user
  async getBusinessProfile(id: string, userId?: string): Promise<UserBusinessProfile | null> {
    try {
      const profiles = await this.getBusinessProfiles(userId);
      return profiles.find(profile => profile.id === id) || null;
    } catch (error) {
      console.error('Error getting business profile by ID:', error);
      return null;
    }
  }

  // Update business profile for specific user
  async updateBusinessProfile(id: string, updates: Partial<UserBusinessProfile>, userId?: string): Promise<UserBusinessProfile | null> {
    try {
      const allProfiles = await this.getAllBusinessProfiles();
      
      const profileIndex = allProfiles.findIndex(profile => 
        profile.id === id && profile.userId === userId
      );
      
      if (profileIndex === -1) {
        return null;
      }
      
      const updatedProfile = {
        ...allProfiles[profileIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      allProfiles[profileIndex] = updatedProfile;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(allProfiles));
      
      console.log('✅ Business profile updated for user:', userId);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating business profile:', error);
      return null;
    }
  }

  // Delete business profile by ID for specific user
  async deleteBusinessProfile(id: string, userId?: string): Promise<boolean> {
    try {
      const allProfiles = await this.getAllBusinessProfiles();
      
      // Remove only the profile that belongs to the current user
      const updatedProfiles = allProfiles.filter(profile => 
        !(profile.id === id && profile.userId === userId)
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedProfiles));
      console.log('✅ Business profile deleted for user:', userId);
      return true;
    } catch (error) {
      console.error('Error deleting business profile:', error);
      return false;
    }
  }

  // Search business profiles by name or description for specific user
  async searchBusinessProfiles(query: string, userId?: string): Promise<UserBusinessProfile[]> {
    try {
      const profiles = await this.getBusinessProfiles(userId);
      const lowercaseQuery = query.toLowerCase();
      
      return profiles.filter(profile => 
        profile.name.toLowerCase().includes(lowercaseQuery) ||
        profile.description.toLowerCase().includes(lowercaseQuery) ||
        profile.category.toLowerCase().includes(lowercaseQuery) ||
        profile.services.some(service => service.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('Error searching business profiles:', error);
      return [];
    }
  }

  // Get business profiles by category for specific user
  async getBusinessProfilesByCategory(category: string, userId?: string): Promise<UserBusinessProfile[]> {
    try {
      const profiles = await this.getBusinessProfiles(userId);
      return profiles.filter(profile => profile.category === category);
    } catch (error) {
      console.error('Error getting business profiles by category:', error);
      return [];
    }
  }

  // Get recent business profiles (last N) for specific user
  async getRecentBusinessProfiles(limit: number = 10, userId?: string): Promise<UserBusinessProfile[]> {
    try {
      const profiles = await this.getBusinessProfiles(userId);
      return profiles
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent business profiles:', error);
      return [];
    }
  }

  // Get business profile statistics for specific user
  async getBusinessProfileStats(userId?: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    recentCount: number;
  }> {
    try {
      const profiles = await this.getBusinessProfiles(userId);
      const byCategory: Record<string, number> = {};
      
      profiles.forEach(profile => {
        const category = profile.category || 'Uncategorized';
        byCategory[category] = (byCategory[category] || 0) + 1;
      });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentCount = profiles.filter(profile => 
        new Date(profile.createdAt) > oneWeekAgo
      ).length;

      return {
        total: profiles.length,
        byCategory,
        recentCount,
      };
    } catch (error) {
      console.error('Error getting business profile stats:', error);
      return {
        total: 0,
        byCategory: {},
        recentCount: 0,
      };
    }
  }

  // Check if business profile exists for specific user
  async isBusinessProfileExists(id: string, userId?: string): Promise<boolean> {
    try {
      const profiles = await this.getBusinessProfiles(userId);
      return profiles.some(profile => profile.id === id);
    } catch (error) {
      console.error('Error checking if business profile exists:', error);
      return false;
    }
  }

  // Clear all business profiles for specific user
  async clearAllBusinessProfiles(userId?: string): Promise<boolean> {
    try {
      if (userId) {
        // Clear only user-specific profiles
        const allProfiles = await this.getAllBusinessProfiles();
        const otherUsersProfiles = allProfiles.filter(profile => profile.userId !== userId);
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(otherUsersProfiles));
        console.log('✅ Cleared all business profiles for user:', userId);
      } else {
        // Clear all profiles (for anonymous users)
        const allProfiles = await this.getAllBusinessProfiles();
        const nonAnonymousProfiles = allProfiles.filter(profile => profile.userId && profile.userId !== 'anonymous');
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(nonAnonymousProfiles));
        console.log('✅ Cleared all anonymous business profiles');
      }
      return true;
    } catch (error) {
      console.error('Error clearing all business profiles:', error);
      return false;
    }
  }

  // Get mock business profiles for demo purposes
  getMockBusinessProfiles(userId?: string): UserBusinessProfile[] {
    const mockProfiles: UserBusinessProfile[] = [
      {
        id: 'mock-1',
        name: 'Elite Event Planning',
        description: 'Premium event planning services for weddings, corporate events, and special occasions.',
        category: 'Event Planning',
        address: '123 Event Street, Celebration City, State 12345',
        phone: '+1 (555) 123-4567',
        email: 'info@eliteevents.com',
        website: 'https://eliteevents.com',
        logo: 'https://images.unsplash.com/photo-1519167758481-83f7d6b4a8f6?w=400&h=200&fit=crop',
        services: ['Wedding Planning', 'Corporate Events', 'Birthday Parties', 'Anniversary Celebrations'],
        workingHours: {
          monday: { open: '09:00', close: '18:00', isOpen: true },
          tuesday: { open: '09:00', close: '18:00', isOpen: true },
          wednesday: { open: '09:00', close: '18:00', isOpen: true },
          thursday: { open: '09:00', close: '18:00', isOpen: true },
          friday: { open: '09:00', close: '18:00', isOpen: true },
          saturday: { open: '10:00', close: '16:00', isOpen: true },
          sunday: { open: '10:00', close: '16:00', isOpen: true },
        },
        rating: 4.8,
        reviewCount: 156,
        isVerified: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        userId: userId || 'demo-user',
      },
      {
        id: 'mock-2',
        name: 'Gourmet Catering Co.',
        description: 'Exquisite catering services for weddings, corporate events, and special occasions.',
        category: 'Catering',
        address: '456 Food Avenue, Culinary District, State 67890',
        phone: '+1 (555) 987-6543',
        email: 'orders@gourmetcatering.com',
        website: 'https://gourmetcatering.com',
        logo: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=200&fit=crop',
        services: ['Wedding Catering', 'Corporate Catering', 'Private Parties', 'Menu Planning'],
        workingHours: {
          monday: { open: '08:00', close: '20:00', isOpen: true },
          tuesday: { open: '08:00', close: '20:00', isOpen: true },
          wednesday: { open: '08:00', close: '20:00', isOpen: true },
          thursday: { open: '08:00', close: '20:00', isOpen: true },
          friday: { open: '08:00', close: '20:00', isOpen: true },
          saturday: { open: '09:00', close: '22:00', isOpen: true },
          sunday: { open: '09:00', close: '22:00', isOpen: true },
        },
        rating: 4.9,
        reviewCount: 89,
        isVerified: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        userId: userId || 'demo-user',
      },
    ];

    return mockProfiles;
  }
}

export default new UserBusinessProfilesService();
