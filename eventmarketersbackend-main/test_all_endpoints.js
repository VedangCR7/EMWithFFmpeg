// Comprehensive API Endpoint Testing Script
// Run this in Node.js or browser console to test all endpoints

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  total: 0
};

// Helper function to make API calls
async function testEndpoint(name, method, endpoint, body = null, headers = {}) {
  testResults.total++;
  try {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    const result = {
      name,
      endpoint,
      method,
      status: response.status,
      success: response.ok,
      data: data
    };
    
    if (response.ok) {
      testResults.passed.push(result);
      console.log(`✅ ${name}: ${response.status} - ${response.statusText}`);
    } else {
      testResults.failed.push(result);
      console.log(`❌ ${name}: ${response.status} - ${response.statusText}`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
    }
    
    return result;
  } catch (error) {
    const result = {
      name,
      endpoint,
      method,
      status: 'ERROR',
      success: false,
      error: error.message
    };
    
    testResults.failed.push(result);
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return result;
  }
}

// Test all endpoints
async function runAllTests() {
  console.log('🚀 Starting comprehensive API endpoint testing...\n');
  
  // 1. Health Check
  await testEndpoint('Health Check', 'GET', '/health');
  
  // 2. Business Categories
  await testEndpoint('Business Categories', 'GET', '/api/mobile/business-categories');
  
  // 3. User Registration
  const deviceId = 'test-device-' + Date.now();
  await testEndpoint('User Registration', 'POST', '/api/installed-users/register', {
    deviceId: deviceId,
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    appVersion: '1.0.0'
  });
  
  // 4. Get User Profile
  await testEndpoint('Get User Profile', 'GET', `/api/installed-users/profile/${deviceId}`);
  
  // 5. Update User Profile
  await testEndpoint('Update User Profile', 'PUT', `/api/installed-users/profile/${deviceId}`, {
    name: 'Updated Test User',
    email: 'updated@example.com',
    phone: '+1234567890'
  });
  
  // 6. User Activity (might not exist)
  await testEndpoint('User Activity', 'POST', '/api/installed-users/activity', {
    deviceId: deviceId,
    action: 'view',
    resourceType: 'image',
    resourceId: 'test-content-id',
    metadata: {
      category: 'Restaurant',
      duration: 30
    }
  });
  
  // 7. Customer Content
  await testEndpoint('Customer Content', 'GET', '/api/mobile/content/test-customer-id');
  
  // 8. Customer Profile
  await testEndpoint('Customer Profile', 'GET', '/api/mobile/profile/test-customer-id');
  
  // 9. Business Profile Creation
  await testEndpoint('Business Profile Creation', 'POST', '/api/business-profile/profile', {
    businessName: 'Test Restaurant',
    businessEmail: 'test@restaurant.com',
    businessPhone: '+1234567890',
    businessWebsite: 'https://testrestaurant.com',
    businessAddress: '123 Test St, Test City, Test State',
    businessDescription: 'Test restaurant description',
    businessCategory: 'Restaurant'
  });
  
  // 10. Admin Login
  await testEndpoint('Admin Login', 'POST', '/api/auth/admin/login', {
    email: 'admin@example.com',
    password: 'adminpassword'
  });
  
  // 11. Subadmin Login
  await testEndpoint('Subadmin Login', 'POST', '/api/auth/subadmin/login', {
    email: 'subadmin@example.com',
    password: 'subadminpassword'
  });
  
  // 12. Get Current User (without token)
  await testEndpoint('Get Current User (No Token)', 'GET', '/api/auth/me');
  
  // 13. Get Subadmins (without token)
  await testEndpoint('Get Subadmins (No Token)', 'GET', '/api/admin/subadmins');
  
  // 14. Create Subadmin (without token)
  await testEndpoint('Create Subadmin (No Token)', 'POST', '/api/admin/subadmins', {
    name: 'New Subadmin',
    email: 'newsubadmin@example.com',
    password: 'password123',
    role: 'Content Manager',
    permissions: ['Images', 'Videos'],
    assignedCategories: ['Restaurant']
  });
  
  // 15. Get Pending Approvals (without token)
  await testEndpoint('Get Pending Approvals (No Token)', 'GET', '/api/content/pending-approvals');
  
  // 16. Upload Image (without token)
  await testEndpoint('Upload Image (No Token)', 'POST', '/api/content/images', {
    title: 'Test Image',
    description: 'Test Description',
    category: 'BUSINESS',
    businessCategoryId: '1',
    tags: 'test,image'
  });
  
  // 17. Upload Video (without token)
  await testEndpoint('Upload Video (No Token)', 'POST', '/api/content/videos', {
    title: 'Test Video',
    description: 'Test Description',
    category: 'BUSINESS',
    businessCategoryId: '1',
    tags: 'test,video'
  });
  
  // 18. Mobile API Aliases
  await testEndpoint('Categories Alias', 'GET', '/api/v1/categories');
  await testEndpoint('Content Alias', 'GET', '/api/v1/content/test-customer-id');
  await testEndpoint('Profile Alias', 'GET', '/api/v1/profile/test-customer-id');
  
  // 19. Legacy endpoints
  await testEndpoint('Marketing Campaigns', 'GET', '/api/marketing/campaigns');
  await testEndpoint('Dashboard Metrics', 'GET', '/api/dashboard/metrics');
  await testEndpoint('Analytics', 'GET', '/api/analytics?range=7d');
  
  // 20. 404 Test
  await testEndpoint('Non-existent Endpoint', 'GET', '/api/non-existent-endpoint');
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`Success Rate: ${((testResults.passed.length / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.failed.forEach(test => {
      console.log(`   ${test.name}: ${test.status} - ${test.error || 'Unknown error'}`);
    });
  }
  
  if (testResults.passed.length > 0) {
    console.log('\n✅ Working Endpoints:');
    testResults.passed.forEach(test => {
      console.log(`   ${test.name}: ${test.status}`);
    });
  }
  
  return testResults;
}

// Export for use in other environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testEndpoint, testResults };
}

// Run tests if in browser
if (typeof window !== 'undefined') {
  window.APITester = { runAllTests, testEndpoint, testResults };
  console.log('API Tester loaded. Run runAllTests() to start testing.');
}

// Auto-run if this is the main module
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}
