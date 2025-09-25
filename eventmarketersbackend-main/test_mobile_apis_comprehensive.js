const fetch = require('node-fetch');

const BASE_URL = 'https://eventmarketers-backend.onrender.com';

// Test data
const testData = {
  deviceId: `test_device_${Date.now()}`,
  mobileUserId: null,
  adminToken: null,
  customerToken: null
};

// Helper function to make API calls
async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return {
      status: response.status,
      success: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to log test results
function logTest(testName, result, expectedStatus = 200) {
  testResults.total++;
  const passed = result.success && result.status === expectedStatus;
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName} - PASSED (${result.status})`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - FAILED (${result.status})`);
    if (result.error) console.log(`   Error: ${result.error}`);
    if (result.data?.error) console.log(`   Response: ${result.data.error}`);
  }
  
  testResults.details.push({
    test: testName,
    passed,
    status: result.status,
    error: result.error || result.data?.error
  });
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Comprehensive Mobile API Tests...\n');

  // ============================================
  // 1. MOBILE AUTHENTICATION TESTS
  // ============================================
  console.log('📱 Testing Mobile Authentication APIs...');
  
  // Register mobile user
  const registerResult = await makeRequest('/api/mobile/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: testData.deviceId,
      name: 'Test Mobile User',
      email: `test${Date.now()}@example.com`,
      phone: '+1234567890',
      appVersion: '1.0.0',
      platform: 'android',
      fcmToken: 'test_fcm_token'
    })
  });
  logTest('Register Mobile User', registerResult, 201);
  
  if (registerResult.success) {
    testData.mobileUserId = registerResult.data.data.user.id;
    testData.mobileToken = registerResult.data.data.token;
  }

  // Login mobile user
  const loginResult = await makeRequest('/api/mobile/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: testData.deviceId
    })
  });
  logTest('Login Mobile User', loginResult);

  // Get user info
  const userInfoResult = await makeRequest('/api/mobile/auth/me', {
    headers: {
      'Authorization': `Bearer ${testData.mobileToken}`
    }
  });
  logTest('Get Mobile User Info', userInfoResult);

  // ============================================
  // 2. HOME SCREEN APIs
  // ============================================
  console.log('\n🏠 Testing Home Screen APIs...');
  
  const featuredResult = await makeRequest('/api/mobile/home/featured');
  logTest('Get Featured Content', featuredResult);

  const eventsResult = await makeRequest('/api/mobile/home/upcoming-events');
  logTest('Get Upcoming Events', eventsResult);

  const templatesResult = await makeRequest('/api/mobile/home/templates');
  logTest('Get Home Templates', templatesResult);

  const videosResult = await makeRequest('/api/mobile/home/video-content');
  logTest('Get Home Videos', videosResult);

  const searchResult = await makeRequest('/api/mobile/home/search?q=test');
  logTest('Home Search', searchResult);

  // ============================================
  // 3. TEMPLATE MANAGEMENT APIs
  // ============================================
  console.log('\n📄 Testing Template Management APIs...');
  
  const templatesListResult = await makeRequest('/api/mobile/templates');
  logTest('Get Templates List', templatesListResult);

  const templateCategoriesResult = await makeRequest('/api/mobile/templates/categories');
  logTest('Get Template Categories', templateCategoriesResult);

  const templateLanguagesResult = await makeRequest('/api/mobile/templates/languages');
  logTest('Get Template Languages', templateLanguagesResult);

  const templateSearchResult = await makeRequest('/api/mobile/templates/search?q=business');
  logTest('Search Templates', templateSearchResult);

  // Test template like (if we have a template)
  if (templatesListResult.success && templatesListResult.data.data.templates.length > 0) {
    const templateId = templatesListResult.data.data.templates[0].id;
    
    const likeResult = await makeRequest(`/api/mobile/templates/${templateId}/like`, {
      method: 'POST',
      body: JSON.stringify({
        mobileUserId: testData.mobileUserId
      })
    });
    logTest('Like Template', likeResult);

    const downloadResult = await makeRequest(`/api/mobile/templates/${templateId}/download`, {
      method: 'POST',
      body: JSON.stringify({
        mobileUserId: testData.mobileUserId
      })
    });
    logTest('Download Template', downloadResult);
  }

  // ============================================
  // 4. GREETING TEMPLATES APIs
  // ============================================
  console.log('\n🎉 Testing Greeting Templates APIs...');
  
  const greetingCategoriesResult = await makeRequest('/api/mobile/greetings/categories');
  logTest('Get Greeting Categories', greetingCategoriesResult);

  const greetingTemplatesResult = await makeRequest('/api/mobile/greetings/templates');
  logTest('Get Greeting Templates', greetingTemplatesResult);

  const stickersResult = await makeRequest('/api/mobile/greetings/stickers');
  logTest('Get Stickers', stickersResult);

  const emojisResult = await makeRequest('/api/mobile/greetings/emojis');
  logTest('Get Emojis', emojisResult);

  // Test greeting like (if we have a greeting template)
  if (greetingTemplatesResult.success && greetingTemplatesResult.data.data.templates.length > 0) {
    const greetingId = greetingTemplatesResult.data.data.templates[0].id;
    
    const greetingLikeResult = await makeRequest(`/api/mobile/greetings/templates/${greetingId}/like`, {
      method: 'POST',
      body: JSON.stringify({
        mobileUserId: testData.mobileUserId
      })
    });
    logTest('Like Greeting Template', greetingLikeResult);
  }

  // ============================================
  // 5. SUBSCRIPTION MANAGEMENT APIs
  // ============================================
  console.log('\n💳 Testing Subscription Management APIs...');
  
  const subscriptionPlansResult = await makeRequest('/api/mobile/subscriptions/plans');
  logTest('Get Subscription Plans', subscriptionPlansResult);

  // Test subscription creation (if we have a plan)
  if (subscriptionPlansResult.success && subscriptionPlansResult.data.data.length > 0) {
    const planId = subscriptionPlansResult.data.data[0].id;
    
    const createSubscriptionResult = await makeRequest('/api/mobile/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        mobileUserId: testData.mobileUserId,
        planId: planId,
        amount: 99.99,
        paymentId: 'test_payment_123',
        paymentMethod: 'razorpay'
      })
    });
    logTest('Create Subscription', createSubscriptionResult, 201);
  }

  const userSubscriptionsResult = await makeRequest(`/api/mobile/subscriptions/user/${testData.mobileUserId}`);
  logTest('Get User Subscriptions', userSubscriptionsResult);

  // ============================================
  // 6. BUSINESS PROFILE APIs
  // ============================================
  console.log('\n🏢 Testing Business Profile APIs...');
  
  const createBusinessProfileResult = await makeRequest('/api/mobile/business-profile', {
    method: 'POST',
    body: JSON.stringify({
      mobileUserId: testData.mobileUserId,
      businessName: 'Test Business',
      ownerName: 'Test Owner',
      email: 'business@test.com',
      phone: '+1234567890',
      category: 'Restaurant',
      description: 'Test business description'
    })
  });
  logTest('Create Business Profile', createBusinessProfileResult, 201);

  const getBusinessProfileResult = await makeRequest(`/api/mobile/business-profile/${testData.mobileUserId}`);
  logTest('Get Business Profile', getBusinessProfileResult);

  // ============================================
  // 7. CONTENT MANAGEMENT APIs
  // ============================================
  console.log('\n🎬 Testing Content Management APIs...');
  
  const videosListResult = await makeRequest('/api/mobile/content/videos');
  logTest('Get Videos List', videosListResult);

  const videoSearchResult = await makeRequest('/api/mobile/content/videos/search?q=tutorial');
  logTest('Search Videos', videoSearchResult);

  // Test video like (if we have a video)
  if (videosListResult.success && videosListResult.data.data.videos.length > 0) {
    const videoId = videosListResult.data.data.videos[0].id;
    
    const videoLikeResult = await makeRequest(`/api/mobile/content/videos/${videoId}/like`, {
      method: 'POST',
      body: JSON.stringify({
        mobileUserId: testData.mobileUserId
      })
    });
    logTest('Like Video', videoLikeResult);
  }

  // ============================================
  // 8. USER MANAGEMENT APIs
  // ============================================
  console.log('\n👤 Testing User Management APIs...');
  
  const userProfileResult = await makeRequest(`/api/mobile/users/${testData.mobileUserId}`);
  logTest('Get User Profile', userProfileResult);

  const updateUserResult = await makeRequest(`/api/mobile/users/${testData.mobileUserId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Updated Test User',
      email: `updated${Date.now()}@example.com`
    })
  });
  logTest('Update User Profile', updateUserResult);

  const userActivitiesResult = await makeRequest(`/api/mobile/users/${testData.mobileUserId}/activities`);
  logTest('Get User Activities', userActivitiesResult);

  const userLikesResult = await makeRequest(`/api/mobile/users/${testData.mobileUserId}/likes`);
  logTest('Get User Likes', userLikesResult);

  const userDownloadsResult = await makeRequest(`/api/mobile/users/${testData.mobileUserId}/downloads`);
  logTest('Get User Downloads', userDownloadsResult);

  // ============================================
  // 9. TRANSACTION HISTORY APIs
  // ============================================
  console.log('\n💰 Testing Transaction History APIs...');
  
  const createTransactionResult = await makeRequest('/api/mobile/transactions', {
    method: 'POST',
    body: JSON.stringify({
      mobileUserId: testData.mobileUserId,
      transactionId: `txn_${Date.now()}`,
      amount: 99.99,
      plan: 'monthly',
      planName: 'Monthly Plan',
      description: 'Test transaction',
      paymentMethod: 'razorpay'
    })
  });
  logTest('Create Transaction', createTransactionResult, 201);

  const userTransactionsResult = await makeRequest(`/api/mobile/transactions/user/${testData.mobileUserId}`);
  logTest('Get User Transactions', userTransactionsResult);

  const transactionSummaryResult = await makeRequest(`/api/mobile/transactions/user/${testData.mobileUserId}/summary`);
  logTest('Get Transaction Summary', transactionSummaryResult);

  const recentTransactionsResult = await makeRequest(`/api/mobile/transactions/user/${testData.mobileUserId}/recent`);
  logTest('Get Recent Transactions', recentTransactionsResult);

  // ============================================
  // 10. CONTENT SYNC APIs (Admin)
  // ============================================
  console.log('\n🔄 Testing Content Sync APIs...');
  
  const syncStatusResult = await makeRequest('/api/content-sync/status');
  logTest('Get Sync Status', syncStatusResult);

  // ============================================
  // FINAL RESULTS
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE MOBILE API TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.total}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.test}: ${test.error || 'Unknown error'}`);
      });
  }
  
  console.log('\n🎉 Mobile API testing completed!');
}

// Run the tests
runTests().catch(console.error);
