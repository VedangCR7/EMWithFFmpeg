import { authApi, subscriptionApi, templatesBannersApi, mediaApi, dashboardApi } from './index';

// API Testing Service
class ApiTestService {
  private results: { [key: string]: { status: 'working' | 'not_working' | 'error'; message: string; response?: any } } = {};

  // Test Authentication APIs
  async testAuthApis() {
    console.log('🔐 Testing Authentication APIs...');
    
    // Test 1: User Registration
    try {
      const testUser = {
        email: 'test@example.com',
        password: 'testpassword123',
        companyName: 'Test Company',
        phoneNumber: '+1234567890'
      };
      
      const response = await authApi.register(testUser);
      this.results['auth_register'] = {
        status: 'working',
        message: 'Registration API is working',
        response: response
      };
      console.log('✅ Registration API: Working');
    } catch (error: any) {
      this.results['auth_register'] = {
        status: 'not_working',
        message: `Registration API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Registration API: Not Working -', error.message);
    }

    // Test 2: User Login
    try {
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
      };
      
      const response = await authApi.login(loginData);
      this.results['auth_login'] = {
        status: 'working',
        message: 'Login API is working',
        response: response
      };
      console.log('✅ Login API: Working');
    } catch (error: any) {
      this.results['auth_login'] = {
        status: 'not_working',
        message: `Login API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Login API: Not Working -', error.message);
    }

    // Test 3: Get Profile
    try {
      const response = await authApi.getProfile();
      this.results['auth_profile'] = {
        status: 'working',
        message: 'Get Profile API is working',
        response: response
      };
      console.log('✅ Get Profile API: Working');
    } catch (error: any) {
      this.results['auth_profile'] = {
        status: 'not_working',
        message: `Get Profile API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Profile API: Not Working -', error.message);
    }

    // Test 4: Update Profile
    try {
      const updateData = {
        companyName: 'Updated Test Company'
      };
      
      const response = await authApi.updateProfile(updateData);
      this.results['auth_update_profile'] = {
        status: 'working',
        message: 'Update Profile API is working',
        response: response
      };
      console.log('✅ Update Profile API: Working');
    } catch (error: any) {
      this.results['auth_update_profile'] = {
        status: 'not_working',
        message: `Update Profile API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Update Profile API: Not Working -', error.message);
    }

    // Test 5: Logout
    try {
      const response = await authApi.logout();
      this.results['auth_logout'] = {
        status: 'working',
        message: 'Logout API is working',
        response: response
      };
      console.log('✅ Logout API: Working');
    } catch (error: any) {
      this.results['auth_logout'] = {
        status: 'not_working',
        message: `Logout API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Logout API: Not Working -', error.message);
    }
  }

  // Test Subscription APIs
  async testSubscriptionApis() {
    console.log('💳 Testing Subscription APIs...');
    
    // Test 1: Get Plans
    try {
      const response = await subscriptionApi.getPlans();
      this.results['subscription_plans'] = {
        status: 'working',
        message: 'Get Plans API is working',
        response: response
      };
      console.log('✅ Get Plans API: Working');
    } catch (error: any) {
      this.results['subscription_plans'] = {
        status: 'not_working',
        message: `Get Plans API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Plans API: Not Working -', error.message);
    }

    // Test 2: Get Status
    try {
      const response = await subscriptionApi.getStatus();
      this.results['subscription_status'] = {
        status: 'working',
        message: 'Get Status API is working',
        response: response
      };
      console.log('✅ Get Status API: Working');
    } catch (error: any) {
      this.results['subscription_status'] = {
        status: 'not_working',
        message: `Get Status API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Status API: Not Working -', error.message);
    }

    // Test 3: Get History
    try {
      const response = await subscriptionApi.getHistory();
      this.results['subscription_history'] = {
        status: 'working',
        message: 'Get History API is working',
        response: response
      };
      console.log('✅ Get History API: Working');
    } catch (error: any) {
      this.results['subscription_history'] = {
        status: 'not_working',
        message: `Get History API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get History API: Not Working -', error.message);
    }
  }

  // Test Template and Banner APIs
  async testTemplateBannerApis() {
    console.log('🎨 Testing Template and Banner APIs...');
    
    // Test 1: Get Templates
    try {
      const response = await templatesBannersApi.getTemplates();
      this.results['templates_get'] = {
        status: 'working',
        message: 'Get Templates API is working',
        response: response
      };
      console.log('✅ Get Templates API: Working');
    } catch (error: any) {
      this.results['templates_get'] = {
        status: 'not_working',
        message: `Get Templates API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Templates API: Not Working -', error.message);
    }

    // Test 2: Get Languages
    try {
      const response = await templatesBannersApi.getLanguages();
      this.results['templates_languages'] = {
        status: 'working',
        message: 'Get Languages API is working',
        response: response
      };
      console.log('✅ Get Languages API: Working');
    } catch (error: any) {
      this.results['templates_languages'] = {
        status: 'not_working',
        message: `Get Languages API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Languages API: Not Working -', error.message);
    }

    // Test 3: Get Template Categories
    try {
      const response = await templatesBannersApi.getTemplateCategories();
      this.results['templates_categories'] = {
        status: 'working',
        message: 'Get Template Categories API is working',
        response: response
      };
      console.log('✅ Get Template Categories API: Working');
    } catch (error: any) {
      this.results['templates_categories'] = {
        status: 'not_working',
        message: `Get Template Categories API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Template Categories API: Not Working -', error.message);
    }

    // Test 4: Get User Banners
    try {
      const response = await templatesBannersApi.getUserBanners();
      this.results['banners_get_user'] = {
        status: 'working',
        message: 'Get User Banners API is working',
        response: response
      };
      console.log('✅ Get User Banners API: Working');
    } catch (error: any) {
      this.results['banners_get_user'] = {
        status: 'not_working',
        message: `Get User Banners API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get User Banners API: Not Working -', error.message);
    }
  }

  // Test Media APIs
  async testMediaApis() {
    console.log('📁 Testing Media APIs...');
    
    // Test 1: Get Media Assets
    try {
      const response = await mediaApi.getMediaAssets();
      this.results['media_get'] = {
        status: 'working',
        message: 'Get Media Assets API is working',
        response: response
      };
      console.log('✅ Get Media Assets API: Working');
    } catch (error: any) {
      this.results['media_get'] = {
        status: 'not_working',
        message: `Get Media Assets API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Media Assets API: Not Working -', error.message);
    }

    // Test 2: Get Media Stats
    try {
      const response = await mediaApi.getMediaStats();
      this.results['media_stats'] = {
        status: 'working',
        message: 'Get Media Stats API is working',
        response: response
      };
      console.log('✅ Get Media Stats API: Working');
    } catch (error: any) {
      this.results['media_stats'] = {
        status: 'not_working',
        message: `Get Media Stats API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Media Stats API: Not Working -', error.message);
    }
  }

  // Test Dashboard APIs
  async testDashboardApis() {
    console.log('📊 Testing Dashboard APIs...');
    
    // Test 1: Get Dashboard Data
    try {
      const response = await dashboardApi.getDashboardData();
      this.results['dashboard_data'] = {
        status: 'working',
        message: 'Get Dashboard Data API is working',
        response: response
      };
      console.log('✅ Get Dashboard Data API: Working');
    } catch (error: any) {
      this.results['dashboard_data'] = {
        status: 'not_working',
        message: `Get Dashboard Data API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Dashboard Data API: Not Working -', error.message);
    }

    // Test 2: Get Banner Stats
    try {
      const response = await dashboardApi.getBannerStats();
      this.results['dashboard_banner_stats'] = {
        status: 'working',
        message: 'Get Banner Stats API is working',
        response: response
      };
      console.log('✅ Get Banner Stats API: Working');
    } catch (error: any) {
      this.results['dashboard_banner_stats'] = {
        status: 'not_working',
        message: `Get Banner Stats API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Banner Stats API: Not Working -', error.message);
    }

    // Test 3: Get Template Usage
    try {
      const response = await dashboardApi.getTemplateUsage();
      this.results['dashboard_template_usage'] = {
        status: 'working',
        message: 'Get Template Usage API is working',
        response: response
      };
      console.log('✅ Get Template Usage API: Working');
    } catch (error: any) {
      this.results['dashboard_template_usage'] = {
        status: 'not_working',
        message: `Get Template Usage API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Template Usage API: Not Working -', error.message);
    }

    // Test 4: Get Recent Activity
    try {
      const response = await dashboardApi.getRecentActivity();
      this.results['dashboard_activity'] = {
        status: 'working',
        message: 'Get Recent Activity API is working',
        response: response
      };
      console.log('✅ Get Recent Activity API: Working');
    } catch (error: any) {
      this.results['dashboard_activity'] = {
        status: 'not_working',
        message: `Get Recent Activity API failed: ${error.message}`,
        response: error
      };
      console.log('❌ Get Recent Activity API: Not Working -', error.message);
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting API Tests...\n');
    
    await this.testAuthApis();
    console.log('');
    
    await this.testSubscriptionApis();
    console.log('');
    
    await this.testTemplateBannerApis();
    console.log('');
    
    await this.testMediaApis();
    console.log('');
    
    await this.testDashboardApis();
    console.log('');
    
    return this.generateReport();
  }

  // Generate test report
  generateReport() {
    console.log('📋 API Test Report');
    console.log('==================');
    
    const workingApis = Object.entries(this.results).filter(([_, result]) => result.status === 'working');
    const notWorkingApis = Object.entries(this.results).filter(([_, result]) => result.status === 'not_working');
    
    console.log(`\n✅ Working APIs: ${workingApis.length}`);
    workingApis.forEach(([name, result]) => {
      console.log(`  - ${name}: ${result.message}`);
    });
    
    console.log(`\n❌ Not Working APIs: ${notWorkingApis.length}`);
    notWorkingApis.forEach(([name, result]) => {
      console.log(`  - ${name}: ${result.message}`);
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total APIs Tested: ${Object.keys(this.results).length}`);
    console.log(`  Working: ${workingApis.length}`);
    console.log(`  Not Working: ${notWorkingApis.length}`);
    console.log(`  Success Rate: ${((workingApis.length / Object.keys(this.results).length) * 100).toFixed(1)}%`);
    
    return {
      working: workingApis.map(([name, result]) => ({ name, ...result })),
      notWorking: notWorkingApis.map(([name, result]) => ({ name, ...result })),
      summary: {
        total: Object.keys(this.results).length,
        working: workingApis.length,
        notWorking: notWorkingApis.length,
        successRate: ((workingApis.length / Object.keys(this.results).length) * 100).toFixed(1)
      }
    };
  }
}

export default new ApiTestService();
