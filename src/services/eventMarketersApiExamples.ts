/**
 * EventMarketers API Integration Usage Examples
 * 
 * This file demonstrates how to use all the integrated EventMarketers APIs
 * in your React Native application.
 */

import {
  healthService,
  businessCategoriesService,
  installedUsersService,
  userActivityService,
  customerContentService,
  eventMarketersBusinessProfileService,
  eventMarketersAuthService,
  adminManagementService,
  contentManagementService,
} from './eventMarketersServices';

// ============================================================================
// 1. HEALTH CHECK EXAMPLES
// ============================================================================

export const healthCheckExamples = {
  // Check if backend is healthy
  async checkBackendHealth() {
    try {
      const health = await healthService.getHealthCheck();
      console.log('Backend Status:', health.status);
      console.log('Version:', health.version);
      console.log('Environment:', health.environment);
      return health;
    } catch (error) {
      console.error('Health check failed:', error);
      return null;
    }
  },

  // Check if backend is reachable
  async isBackendReachable() {
    const isReachable = await healthService.isBackendReachable();
    console.log('Backend reachable:', isReachable);
    return isReachable;
  }
};

// ============================================================================
// 2. BUSINESS CATEGORIES EXAMPLES
// ============================================================================

export const businessCategoriesExamples = {
  // Get all business categories
  async getAllCategories() {
    try {
      const response = await businessCategoriesService.getBusinessCategories();
      console.log('Categories loaded:', response.categories.length);
      return response.categories;
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [];
    }
  },

  // Search categories
  async searchCategories(query: string) {
    try {
      const categories = await businessCategoriesService.searchCategories(query);
      console.log('Search results:', categories.length);
      return categories;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  },

  // Get category by ID
  async getCategoryById(categoryId: string) {
    try {
      const category = await businessCategoriesService.getCategoryById(categoryId);
      return category;
    } catch (error) {
      console.error('Failed to get category:', error);
      return null;
    }
  }
};

// ============================================================================
// 3. INSTALLED USERS EXAMPLES
// ============================================================================

export const installedUsersExamples = {
  // Register a new user
  async registerNewUser(userInfo: {
    name: string;
    email: string;
    phone: string;
  }) {
    try {
      const response = await installedUsersService.registerCurrentDeviceUser(userInfo);
      console.log('User registered:', response.user.id);
      return response.user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const user = await installedUsersService.getCurrentUser();
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },

  // Update user profile
  async updateUserProfile(updates: {
    name?: string;
    email?: string;
    phone?: string;
  }) {
    try {
      const response = await installedUsersService.updateCurrentUserProfile(updates);
      console.log('Profile updated:', response.user.name);
      return response.user;
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  },

  // Check if user is registered
  async isUserRegistered() {
    const isRegistered = await installedUsersService.isUserRegistered();
    console.log('User registered:', isRegistered);
    return isRegistered;
  }
};

// ============================================================================
// 4. USER ACTIVITY TRACKING EXAMPLES
// ============================================================================

export const userActivityExamples = {
  // Record view activity
  async recordView(deviceId: string, resourceType: string, resourceId: string) {
    try {
      await userActivityService.recordView(deviceId, resourceType, resourceId);
      console.log('View recorded');
    } catch (error) {
      console.error('Failed to record view:', error);
    }
  },

  // Record download activity
  async recordDownload(deviceId: string, resourceType: string, resourceId: string) {
    try {
      await userActivityService.recordDownload(deviceId, resourceType, resourceId);
      console.log('Download recorded');
    } catch (error) {
      console.error('Failed to record download:', error);
    }
  },

  // Record time spent
  async recordTimeSpent(deviceId: string, resourceType: string, resourceId: string, duration: number) {
    try {
      await userActivityService.recordTimeSpent(deviceId, resourceType, resourceId, duration);
      console.log('Time spent recorded:', duration, 'seconds');
    } catch (error) {
      console.error('Failed to record time spent:', error);
    }
  },

  // Record search activity
  async recordSearch(deviceId: string, searchQuery: string, resultsCount: number) {
    try {
      await userActivityService.recordSearch(deviceId, searchQuery, resultsCount);
      console.log('Search recorded:', searchQuery);
    } catch (error) {
      console.error('Failed to record search:', error);
    }
  },

  // Get activity analytics
  async getActivityAnalytics(deviceId: string) {
    try {
      const analytics = await userActivityService.getActivityAnalytics(deviceId);
      console.log('Analytics:', analytics);
      return analytics;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return null;
    }
  }
};

// ============================================================================
// 5. CUSTOMER CONTENT EXAMPLES
// ============================================================================

export const customerContentExamples = {
  // Get customer content
  async getCustomerContent(customerId: string, filters?: {
    category?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const response = await customerContentService.getCustomerContent(customerId, filters);
      console.log('Content loaded:', response.content.images.length, 'images,', response.content.videos.length, 'videos');
      return response;
    } catch (error) {
      console.error('Failed to get content:', error);
      return null;
    }
  },

  // Get customer profile
  async getCustomerProfile(customerId: string) {
    try {
      const response = await customerContentService.getCustomerProfile(customerId);
      console.log('Profile loaded:', response.customer.name);
      return response.customer;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  },

  // Search content
  async searchContent(customerId: string, query: string) {
    try {
      const response = await customerContentService.searchContent(customerId, query);
      console.log('Search results:', response.content.images.length + response.content.videos.length, 'items');
      return response;
    } catch (error) {
      console.error('Search failed:', error);
      return null;
    }
  },

  // Get content by category
  async getContentByCategory(customerId: string, category: string) {
    try {
      const response = await customerContentService.getContentByCategory(customerId, category);
      console.log('Category content:', response.content.images.length + response.content.videos.length, 'items');
      return response;
    } catch (error) {
      console.error('Failed to get category content:', error);
      return null;
    }
  }
};

// ============================================================================
// 6. BUSINESS PROFILE EXAMPLES
// ============================================================================

export const businessProfileExamples = {
  // Create business profile
  async createBusinessProfile(profileData: {
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    businessWebsite?: string;
    businessAddress: string;
    businessDescription: string;
    businessCategory: string;
  }) {
    try {
      const response = await eventMarketersBusinessProfileService.createBusinessProfileWithValidation(profileData);
      console.log('Business profile created:', response.profile.id);
      return response.profile;
    } catch (error) {
      console.error('Failed to create business profile:', error);
      throw error;
    }
  },

  // Upload business logo
  async uploadBusinessLogo(logoFile: any) {
    try {
      const response = await eventMarketersBusinessProfileService.uploadBusinessLogoWithValidation(logoFile);
      console.log('Logo uploaded:', response.logoUrl);
      return response.logoUrl;
    } catch (error) {
      console.error('Failed to upload logo:', error);
      throw error;
    }
  },

  // Get business categories
  async getBusinessCategories() {
    const categories = eventMarketersBusinessProfileService.getBusinessCategories();
    console.log('Available categories:', categories.length);
    return categories;
  }
};

// ============================================================================
// 7. AUTHENTICATION EXAMPLES
// ============================================================================

export const authExamples = {
  // Admin login
  async adminLogin(email: string, password: string) {
    try {
      const response = await eventMarketersAuthService.adminLoginWithValidation({ email, password });
      console.log('Admin login successful:', response.user.name);
      return response.user;
    } catch (error) {
      console.error('Admin login failed:', error);
      throw error;
    }
  },

  // Subadmin login
  async subadminLogin(email: string, password: string) {
    try {
      const response = await eventMarketersAuthService.subadminLoginWithValidation({ email, password });
      console.log('Subadmin login successful:', response.user.name);
      return response.user;
    } catch (error) {
      console.error('Subadmin login failed:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await eventMarketersAuthService.getCurrentUser();
      console.log('Current user:', response.user.name);
      return response.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },

  // Check permissions
  async checkPermissions() {
    const user = eventMarketersAuthService.getCurrentUserFromMemory();
    if (!user) return null;

    return {
      isAdmin: eventMarketersAuthService.isAdmin(),
      isSubadmin: eventMarketersAuthService.isSubadmin(),
      hasImagePermission: eventMarketersAuthService.hasPermission('Images'),
      hasVideoPermission: eventMarketersAuthService.hasPermission('Videos'),
      hasCategoryAccess: eventMarketersAuthService.hasCategoryAccess('Restaurant'),
    };
  },

  // Logout
  async logout() {
    try {
      await eventMarketersAuthService.logout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
};

// ============================================================================
// 8. ADMIN MANAGEMENT EXAMPLES
// ============================================================================

export const adminManagementExamples = {
  // Get all subadmins
  async getSubadmins() {
    try {
      const response = await adminManagementService.getSubadmins();
      console.log('Subadmins loaded:', response.subadmins.length);
      return response.subadmins;
    } catch (error) {
      console.error('Failed to get subadmins:', error);
      return [];
    }
  },

  // Create subadmin
  async createSubadmin(subadminData: {
    name: string;
    email: string;
    password: string;
    role: string;
    permissions: string[];
    assignedCategories: string[];
  }) {
    try {
      const response = await adminManagementService.createSubadminWithValidation(subadminData);
      console.log('Subadmin created:', response.subadmin.id);
      return response.subadmin;
    } catch (error) {
      console.error('Failed to create subadmin:', error);
      throw error;
    }
  },

  // Search subadmins
  async searchSubadmins(query: string) {
    try {
      const subadmins = await adminManagementService.searchSubadmins(query);
      console.log('Search results:', subadmins.length);
      return subadmins;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  },

  // Get available roles and permissions
  async getAvailableOptions() {
    return {
      roles: adminManagementService.getAvailableRoles(),
      permissions: adminManagementService.getAvailablePermissions(),
      categories: adminManagementService.getAvailableCategories(),
    };
  }
};

// ============================================================================
// 9. CONTENT MANAGEMENT EXAMPLES
// ============================================================================

export const contentManagementExamples = {
  // Get pending approvals
  async getPendingApprovals() {
    try {
      const response = await contentManagementService.getPendingApprovals();
      console.log('Pending approvals:', response.pendingApprovals.length);
      return response.pendingApprovals;
    } catch (error) {
      console.error('Failed to get pending approvals:', error);
      return [];
    }
  },

  // Upload image
  async uploadImage(imageData: {
    image: any;
    title: string;
    description: string;
    category: string;
    businessCategoryId: string;
    tags: string;
  }) {
    try {
      const response = await contentManagementService.uploadImageWithValidation(imageData);
      console.log('Image uploaded:', response.image?.id);
      return response.image;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  },

  // Upload video
  async uploadVideo(videoData: {
    video: any;
    title: string;
    description: string;
    category: string;
    businessCategoryId: string;
    tags: string;
  }) {
    try {
      const response = await contentManagementService.uploadVideoWithValidation(videoData);
      console.log('Video uploaded:', response.video?.id);
      return response.video;
    } catch (error) {
      console.error('Failed to upload video:', error);
      throw error;
    }
  },

  // Approve content
  async approveContent(contentId: string, contentType: 'image' | 'video') {
    try {
      const success = await contentManagementService.approveContent(contentId, contentType);
      console.log('Content approved:', success);
      return success;
    } catch (error) {
      console.error('Failed to approve content:', error);
      return false;
    }
  },

  // Reject content
  async rejectContent(contentId: string, contentType: 'image' | 'video', reason?: string) {
    try {
      const success = await contentManagementService.rejectContent(contentId, contentType, reason);
      console.log('Content rejected:', success);
      return success;
    } catch (error) {
      console.error('Failed to reject content:', error);
      return false;
    }
  },

  // Get available categories
  async getAvailableCategories() {
    return {
      contentCategories: contentManagementService.getAvailableCategories(),
      businessCategories: contentManagementService.getAvailableBusinessCategories(),
    };
  }
};

// ============================================================================
// 10. COMPLETE WORKFLOW EXAMPLES
// ============================================================================

export const completeWorkflowExamples = {
  // Complete user onboarding workflow
  async userOnboardingWorkflow(userInfo: {
    name: string;
    email: string;
    phone: string;
  }) {
    try {
      console.log('Starting user onboarding workflow...');
      
      // 1. Check backend health
      const isHealthy = await healthService.isBackendReachable();
      if (!isHealthy) {
        throw new Error('Backend is not reachable');
      }
      
      // 2. Register user
      const user = await installedUsersService.registerCurrentDeviceUser(userInfo);
      console.log('User registered:', user.id);
      
      // 3. Record registration activity
      const deviceId = await installedUsersService.getDeviceId();
      await userActivityService.recordActivity({
        deviceId,
        action: 'register',
        resourceType: 'user',
        resourceId: user.id,
        metadata: { registrationMethod: 'email' }
      });
      
      // 4. Load business categories for user selection
      const categories = await businessCategoriesService.getBusinessCategories();
      console.log('Categories loaded for user:', categories.categories.length);
      
      return {
        user,
        categories: categories.categories,
        deviceId
      };
    } catch (error) {
      console.error('Onboarding workflow failed:', error);
      throw error;
    }
  },

  // Complete business profile creation workflow
  async businessProfileCreationWorkflow(profileData: {
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    businessWebsite?: string;
    businessAddress: string;
    businessDescription: string;
    businessCategory: string;
  }, logoFile?: any) {
    try {
      console.log('Starting business profile creation workflow...');
      
      // 1. Create business profile
      const profile = await eventMarketersBusinessProfileService.createBusinessProfileWithValidation(profileData);
      console.log('Business profile created:', profile.id);
      
      // 2. Upload logo if provided
      let logoUrl = '';
      if (logoFile) {
        const logoResponse = await eventMarketersBusinessProfileService.uploadBusinessLogoWithValidation(logoFile);
        logoUrl = logoResponse.logoUrl;
        console.log('Logo uploaded:', logoUrl);
      }
      
      // 3. Record business profile creation activity
      const deviceId = await installedUsersService.getDeviceId();
      await userActivityService.recordActivity({
        deviceId,
        action: 'create_business_profile',
        resourceType: 'business_profile',
        resourceId: profile.id,
        metadata: { 
          businessName: profile.businessName,
          category: profile.businessCategory,
          hasLogo: !!logoUrl
        }
      });
      
      return {
        profile,
        logoUrl
      };
    } catch (error) {
      console.error('Business profile creation workflow failed:', error);
      throw error;
    }
  },

  // Complete content browsing workflow
  async contentBrowsingWorkflow(customerId: string, filters?: {
    category?: string;
    search?: string;
  }) {
    try {
      console.log('Starting content browsing workflow...');
      
      // 1. Get customer profile
      const profile = await customerContentService.getCustomerProfile(customerId);
      console.log('Customer profile loaded:', profile.customer.name);
      
      // 2. Get content based on filters
      const content = await customerContentService.getCustomerContent(customerId, filters);
      console.log('Content loaded:', content.content.images.length + content.content.videos.length, 'items');
      
      // 3. Record browsing activity
      const deviceId = await installedUsersService.getDeviceId();
      await userActivityService.recordActivity({
        deviceId,
        action: 'browse_content',
        resourceType: 'content',
        resourceId: 'browse_session',
        metadata: { 
          filters: filters || {},
          contentCount: content.content.images.length + content.content.videos.length
        }
      });
      
      return {
        profile: profile.customer,
        content: content.content,
        pagination: content.pagination
      };
    } catch (error) {
      console.error('Content browsing workflow failed:', error);
      throw error;
    }
  }
};

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export default {
  healthCheck: healthCheckExamples,
  businessCategories: businessCategoriesExamples,
  installedUsers: installedUsersExamples,
  userActivity: userActivityExamples,
  customerContent: customerContentExamples,
  businessProfile: businessProfileExamples,
  auth: authExamples,
  adminManagement: adminManagementExamples,
  contentManagement: contentManagementExamples,
  completeWorkflows: completeWorkflowExamples,
};
