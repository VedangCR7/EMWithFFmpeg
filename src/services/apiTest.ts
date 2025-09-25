import api from './api';
import authService from './auth';
import subscriptionService from './payment';
import templatesService from './templates';
import bannerService from './bannerService';
import mediaService from './mediaService';

class APITestService {
  private testResults: { [key: string]: { success: boolean; error?: string; data?: any } } = {};

  // Test API connectivity
  async testAPIConnectivity(): Promise<boolean> {
    try {
      console.log('Testing API connectivity...');
      const response = await api.get('/api/mobile/health');
      this.testResults.connectivity = { success: true, data: response.data };
      console.log('✅ API connectivity test passed');
      return true;
    } catch (error: any) {
      this.testResults.connectivity = { success: false, error: error.message };
      console.log('❌ API connectivity test failed:', error.message);
      return false;
    }
  }

  // Test authentication endpoints
  async testAuthentication(): Promise<boolean> {
    try {
      console.log('Testing authentication endpoints...');
      
      // Test registration
      const testUser = {
        email: `test${Date.now()}@example.com`,
        password: 'testpassword123',
        companyName: 'Test Company',
        phoneNumber: '+1234567890',
      };

      const registerResponse = await api.post('/api/mobile/auth/register', testUser);
      this.testResults.registration = { success: true, data: registerResponse.data };

      // Test login
      const loginResponse = await api.post('/api/mobile/auth/login', {
        email: testUser.email,
        password: testUser.password,
      });
      this.testResults.login = { success: true, data: loginResponse.data };

      console.log('✅ Authentication test passed');
      return true;
    } catch (error: any) {
      this.testResults.authentication = { success: false, error: error.message };
      console.log('❌ Authentication test failed:', error.message);
      return false;
    }
  }

  // Test subscription endpoints
  async testSubscription(): Promise<boolean> {
    try {
      console.log('Testing subscription endpoints...');
      
      // Test getting subscription plans
      const plansResponse = await api.get('/api/mobile/subscription/plans');
      this.testResults.subscriptionPlans = { success: true, data: plansResponse.data };

      // Test getting subscription status
      const statusResponse = await api.get('/api/mobile/subscription/status');
      this.testResults.subscriptionStatus = { success: true, data: statusResponse.data };

      console.log('✅ Subscription test passed');
      return true;
    } catch (error: any) {
      this.testResults.subscription = { success: false, error: error.message };
      console.log('❌ Subscription test failed:', error.message);
      return false;
    }
  }

  // Test template endpoints
  async testTemplates(): Promise<boolean> {
    try {
      console.log('Testing template endpoints...');
      
      // Test getting templates
      const templatesResponse = await api.get('/api/mobile/templates');
      this.testResults.templates = { success: true, data: templatesResponse.data };

      // Test getting template by ID (if templates exist)
      if (templatesResponse.data && templatesResponse.data.length > 0) {
        const templateId = templatesResponse.data[0].id;
        const templateResponse = await api.get(`/api/mobile/templates/${templateId}`);
        this.testResults.templateById = { success: true, data: templateResponse.data };
      }

      console.log('✅ Templates test passed');
      return true;
    } catch (error: any) {
      this.testResults.templates = { success: false, error: error.message };
      console.log('❌ Templates test failed:', error.message);
      return false;
    }
  }

  // Test banner endpoints
  async testBanners(): Promise<boolean> {
    try {
      console.log('Testing banner endpoints...');
      
      // Test getting user banners
      const bannersResponse = await api.get('/api/mobile/banners/my');
      this.testResults.userBanners = { success: true, data: bannersResponse.data };

      console.log('✅ Banners test passed');
      return true;
    } catch (error: any) {
      this.testResults.banners = { success: false, error: error.message };
      console.log('❌ Banners test failed:', error.message);
      return false;
    }
  }

  // Test media endpoints
  async testMedia(): Promise<boolean> {
    try {
      console.log('Testing media endpoints...');
      
      // Test getting media assets
      const mediaResponse = await api.get('/api/mobile/media');
      this.testResults.media = { success: true, data: mediaResponse.data };

      console.log('✅ Media test passed');
      return true;
    } catch (error: any) {
      this.testResults.media = { success: false, error: error.message };
      console.log('❌ Media test failed:', error.message);
      return false;
    }
  }

  // Test user profile endpoints
  async testUserProfile(): Promise<boolean> {
    try {
      console.log('Testing user profile endpoints...');
      
      // Test getting user profile
      const profileResponse = await api.get('/api/mobile/auth/profile');
      this.testResults.userProfile = { success: true, data: profileResponse.data };

      console.log('✅ User profile test passed');
      return true;
    } catch (error: any) {
      this.testResults.userProfile = { success: false, error: error.message };
      console.log('❌ User profile test failed:', error.message);
      return false;
    }
  }

  // Run all tests
  async runAllTests(): Promise<{ [key: string]: { success: boolean; error?: string; data?: any } }> {
    console.log('🚀 Starting API integration tests...\n');

    // Test API connectivity first
    const isConnected = await this.testAPIConnectivity();
    if (!isConnected) {
      console.log('❌ API is not accessible. Stopping tests.');
      return this.testResults;
    }

    // Run all other tests
    await Promise.all([
      this.testAuthentication(),
      this.testSubscription(),
      this.testTemplates(),
      this.testBanners(),
      this.testMedia(),
      this.testUserProfile(),
    ]);

    // Print summary
    this.printTestSummary();

    return this.testResults;
  }

  // Print test summary
  printTestSummary(): void {
    console.log('\n📊 API Integration Test Summary:');
    console.log('================================');

    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(result => result.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      Object.entries(this.testResults).forEach(([testName, result]) => {
        if (!result.success) {
          console.log(`  - ${testName}: ${result.error}`);
        }
      });
    }

    console.log('\n✅ All tests completed!');
  }

  // Test service methods
  async testServiceMethods(): Promise<void> {
    console.log('\n🔧 Testing service methods...');

    try {
      // Test auth service
      console.log('Testing auth service...');
      const currentUser = authService.getCurrentUser();
      console.log('Current user:', currentUser ? 'Found' : 'Not found');

      // Test subscription service
      console.log('Testing subscription service...');
      const hasSubscription = await subscriptionService.hasActiveSubscription();
      console.log('Has active subscription:', hasSubscription);

      // Test templates service
      console.log('Testing templates service...');
      const templates = await templatesService.getTemplates({ type: 'daily' });
      console.log('Daily templates found:', templates.length);

      // Test banner service
      console.log('Testing banner service...');
      const userBanners = await bannerService.getUserBanners();
      console.log('User banners found:', userBanners.length);

      // Test media service
      console.log('Testing media service...');
      const mediaAssets = await mediaService.getMediaAssets();
      console.log('Media assets found:', mediaAssets.length);

      console.log('✅ Service methods test completed!');
    } catch (error: any) {
      console.log('❌ Service methods test failed:', error.message);
    }
  }
}

export default new APITestService();
