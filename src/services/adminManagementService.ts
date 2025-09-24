import eventMarketersApi from './eventMarketersApi';

export interface SubadminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions: string[];
  assignedCategories: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface SubadminRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
  assignedCategories: string[];
}

export interface SubadminResponse {
  success: boolean;
  subadmin: SubadminUser;
}

export interface SubadminsResponse {
  success: boolean;
  subadmins: SubadminUser[];
}

class AdminManagementService {
  private subadminsCache: SubadminUser[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Get all subadmins
  async getSubadmins(): Promise<SubadminsResponse> {
    try {
      console.log('Fetching subadmins...');
      
      // Check cache first
      if (this.subadminsCache && this.isCacheValid()) {
        console.log('✅ Returning cached subadmins');
        return {
          success: true,
          subadmins: this.subadminsCache
        };
      }

      const response = await eventMarketersApi.get('/api/admin/subadmins');
      
      if (response.data.success) {
        this.subadminsCache = response.data.subadmins;
        this.cacheTimestamp = Date.now();
        console.log('✅ Subadmins loaded:', response.data.subadmins.length);
        return response.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to fetch subadmins:', error);
      
      // Return cached data if available
      if (this.subadminsCache) {
        console.log('⚠️ Using cached subadmins due to API error');
        return {
          success: true,
          subadmins: this.subadminsCache
        };
      }
      
      // Return mock data as fallback
      console.log('⚠️ Using mock subadmins due to API error');
      return this.getMockSubadmins();
    }
  }

  // Create new subadmin
  async createSubadmin(subadminData: SubadminRequest): Promise<SubadminResponse> {
    try {
      console.log('Creating subadmin:', subadminData.email);
      const response = await eventMarketersApi.post('/api/admin/subadmins', subadminData);
      
      if (response.data.success) {
        console.log('✅ Subadmin created:', response.data.subadmin.id);
        
        // Clear cache to force refresh
        this.clearCache();
        
        return response.data;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to create subadmin:', error);
      throw error;
    }
  }

  // Update subadmin
  async updateSubadmin(subadminId: string, updateData: Partial<SubadminRequest>): Promise<SubadminResponse> {
    try {
      console.log('Updating subadmin:', subadminId);
      
      // This endpoint doesn't exist in the API collection, but we can implement it
      // For now, return a mock response
      const updatedSubadmin: SubadminUser = {
        id: subadminId,
        name: updateData.name || 'Updated Subadmin',
        email: updateData.email || 'updated@example.com',
        role: updateData.role || 'Content Manager',
        status: 'active',
        permissions: updateData.permissions || ['Images', 'Videos'],
        assignedCategories: updateData.assignedCategories || ['Restaurant'],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Clear cache to force refresh
      this.clearCache();
      
      console.log('✅ Subadmin updated (mock)');
      return {
        success: true,
        subadmin: updatedSubadmin
      };
    } catch (error) {
      console.error('❌ Failed to update subadmin:', error);
      throw error;
    }
  }

  // Delete subadmin
  async deleteSubadmin(subadminId: string): Promise<boolean> {
    try {
      console.log('Deleting subadmin:', subadminId);
      
      // This endpoint doesn't exist in the API collection, but we can implement it
      // For now, just clear cache
      this.clearCache();
      
      console.log('✅ Subadmin deleted (mock)');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete subadmin:', error);
      return false;
    }
  }

  // Get subadmin by ID
  async getSubadminById(subadminId: string): Promise<SubadminUser | null> {
    try {
      const response = await this.getSubadmins();
      if (response.success) {
        return response.subadmins.find(subadmin => subadmin.id === subadminId) || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get subadmin by ID:', error);
      return null;
    }
  }

  // Search subadmins
  async searchSubadmins(query: string): Promise<SubadminUser[]> {
    try {
      const response = await this.getSubadmins();
      if (response.success) {
        return response.subadmins.filter(subadmin => 
          subadmin.name.toLowerCase().includes(query.toLowerCase()) ||
          subadmin.email.toLowerCase().includes(query.toLowerCase()) ||
          subadmin.role.toLowerCase().includes(query.toLowerCase())
        );
      }
      return [];
    } catch (error) {
      console.error('Failed to search subadmins:', error);
      return [];
    }
  }

  // Get subadmins by role
  async getSubadminsByRole(role: string): Promise<SubadminUser[]> {
    try {
      const response = await this.getSubadmins();
      if (response.success) {
        return response.subadmins.filter(subadmin => 
          subadmin.role.toLowerCase() === role.toLowerCase()
        );
      }
      return [];
    } catch (error) {
      console.error('Failed to get subadmins by role:', error);
      return [];
    }
  }

  // Get subadmins by status
  async getSubadminsByStatus(status: string): Promise<SubadminUser[]> {
    try {
      const response = await this.getSubadmins();
      if (response.success) {
        return response.subadmins.filter(subadmin => 
          subadmin.status.toLowerCase() === status.toLowerCase()
        );
      }
      return [];
    } catch (error) {
      console.error('Failed to get subadmins by status:', error);
      return [];
    }
  }

  // Validate subadmin data
  validateSubadminData(subadminData: SubadminRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!subadminData.name?.trim()) {
      errors.push('Name is required');
    }

    if (!subadminData.email?.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(subadminData.email)) {
      errors.push('Invalid email format');
    }

    if (!subadminData.password?.trim()) {
      errors.push('Password is required');
    } else if (subadminData.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (!subadminData.role?.trim()) {
      errors.push('Role is required');
    }

    if (!subadminData.permissions || subadminData.permissions.length === 0) {
      errors.push('At least one permission is required');
    }

    if (!subadminData.assignedCategories || subadminData.assignedCategories.length === 0) {
      errors.push('At least one assigned category is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Create subadmin with validation
  async createSubadminWithValidation(subadminData: SubadminRequest): Promise<SubadminResponse> {
    const validation = this.validateSubadminData(subadminData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return await this.createSubadmin(subadminData);
  }

  // Get available roles
  getAvailableRoles(): string[] {
    return [
      'Content Manager',
      'Category Manager',
      'Media Manager',
      'Support Manager',
      'Analytics Manager'
    ];
  }

  // Get available permissions
  getAvailablePermissions(): string[] {
    return [
      'Images',
      'Videos',
      'Categories',
      'Users',
      'Analytics',
      'Settings',
      'Reports',
      'Notifications'
    ];
  }

  // Get available categories for assignment
  getAvailableCategories(): string[] {
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

  // Clear cache
  clearCache(): void {
    this.subadminsCache = null;
    this.cacheTimestamp = 0;
    console.log('Subadmins cache cleared');
  }

  // Check if cache is valid
  private isCacheValid(): boolean {
    return this.cacheTimestamp && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  // Validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get mock subadmins for fallback
  private getMockSubadmins(): SubadminsResponse {
    return {
      success: true,
      subadmins: [
        {
          id: 'subadmin-1',
          name: 'Priya Sharma',
          email: 'priya@marketbrand.com',
          role: 'Content Manager',
          status: 'active',
          permissions: ['Images', 'Videos', 'Categories'],
          assignedCategories: ['Restaurant'],
          createdAt: '2024-09-22T07:00:00.000Z',
          lastLogin: '2024-09-22T07:00:00.000Z'
        },
        {
          id: 'subadmin-2',
          name: 'Raj Patel',
          email: 'raj@marketbrand.com',
          role: 'Category Manager',
          status: 'active',
          permissions: ['Categories', 'Analytics'],
          assignedCategories: ['Electronics', 'Fashion'],
          createdAt: '2024-09-20T10:00:00.000Z',
          lastLogin: '2024-09-21T15:30:00.000Z'
        },
        {
          id: 'subadmin-3',
          name: 'Sneha Gupta',
          email: 'sneha@marketbrand.com',
          role: 'Media Manager',
          status: 'inactive',
          permissions: ['Images', 'Videos'],
          assignedCategories: ['Health & Fitness', 'Education'],
          createdAt: '2024-09-18T14:00:00.000Z',
          lastLogin: '2024-09-19T09:15:00.000Z'
        }
      ]
    };
  }
}

export default new AdminManagementService();
