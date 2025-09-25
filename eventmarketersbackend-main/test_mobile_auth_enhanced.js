/**
 * Test Enhanced Mobile Authentication APIs
 * Tests all 7 mobile authentication endpoints with business category support
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';
// const BASE_URL = 'http://localhost:3001'; // Uncomment for local testing

const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to make API calls
async function makeRequest(endpoint, method = 'GET', body = null, headers = {}) {
  try {
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

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    return {
      status: response.status,
      data,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

// Test function
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 Testing: ${testName}`);
  
  try {
    const result = await testFunction();
    if (result.success) {
      testResults.passed++;
      console.log(`✅ PASSED: ${testName}`);
      testResults.details.push({ test: testName, status: 'PASSED', result });
    } else {
      testResults.failed++;
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${JSON.stringify(result.data, null, 2)}`);
      testResults.details.push({ test: testName, status: 'FAILED', result });
    }
  } catch (error) {
    testResults.failed++;
    console.log(`❌ ERROR: ${testName} - ${error.message}`);
    testResults.details.push({ test: testName, status: 'ERROR', error: error.message });
  }
}

// Test 1: Mobile User Registration with Business Info
async function testMobileRegistration() {
  const uniqueId = `test_device_${Date.now()}`;
  const registrationData = {
    deviceId: uniqueId,
    name: "John Doe",
    email: `john.doe.${Date.now()}@example.com`,
    phone: "+1234567890",
    appVersion: "1.0.0",
    platform: "android",
    fcmToken: "test_fcm_token",
    // Business Information
    companyName: "Test Event Company",
    description: "Professional event planning services",
    category: "Event Planners",
    address: "123 Main St, City, State",
    alternatePhone: "+0987654321",
    website: "https://testcompany.com",
    companyLogo: "https://example.com/logo.png",
    displayName: "Test Event Company"
  };

  const result = await makeRequest('/api/mobile/auth/register', 'POST', registrationData);
  
  if (result.success && result.data.success) {
    // Store token and user ID for other tests
    global.testToken = result.data.data.token;
    global.testUserId = result.data.data.user.id;
    global.testDeviceId = uniqueId;
    global.testEmail = registrationData.email;
  }

  return result;
}

// Test 2: Mobile User Login
async function testMobileLogin() {
  if (!global.testDeviceId) {
    return { success: false, data: { error: 'No device ID from registration test' } };
  }

  const loginData = {
    deviceId: global.testDeviceId
  };

  return await makeRequest('/api/mobile/auth/login', 'POST', loginData);
}

// Test 3: Get Mobile User Info
async function testGetUserInfo() {
  if (!global.testToken) {
    return { success: false, data: { error: 'No token from registration test' } };
  }

  return await makeRequest('/api/mobile/auth/me', 'GET', null, {
    'Authorization': `Bearer ${global.testToken}`
  });
}

// Test 4: Forgot Password
async function testForgotPassword() {
  if (!global.testEmail) {
    return { success: false, data: { error: 'No email from registration test' } };
  }

  const forgotPasswordData = {
    email: global.testEmail
  };

  return await makeRequest('/api/mobile/auth/forgot-password', 'POST', forgotPasswordData);
}

// Test 5: Reset Password (using token from forgot password)
async function testResetPassword() {
  if (!global.testToken) {
    return { success: false, data: { error: 'No token available' } };
  }

  // Generate a reset token (in real app, this would come from email)
  const resetToken = global.testToken; // Using existing token for testing

  const resetPasswordData = {
    token: resetToken,
    newPassword: "NewSecurePassword123",
    confirmPassword: "NewSecurePassword123"
  };

  return await makeRequest('/api/mobile/auth/reset-password', 'POST', resetPasswordData);
}

// Test 6: Verify Email
async function testVerifyEmail() {
  if (!global.testToken) {
    return { success: false, data: { error: 'No token available' } };
  }

  // Generate a verification token (in real app, this would come from email)
  const verificationToken = global.testToken; // Using existing token for testing

  const verifyEmailData = {
    token: verificationToken
  };

  return await makeRequest('/api/mobile/auth/verify-email', 'POST', verifyEmailData);
}

// Test 7: Logout
async function testLogout() {
  if (!global.testToken) {
    return { success: false, data: { error: 'No token available' } };
  }

  return await makeRequest('/api/mobile/auth/logout', 'POST', null, {
    'Authorization': `Bearer ${global.testToken}`
  });
}

// Test 8: Test Business Categories
async function testBusinessCategories() {
  const categories = ["Event Planners", "Decorators", "Sound Suppliers", "Light Suppliers", "General"];
  const results = [];

  for (const category of categories) {
    const uniqueId = `test_device_${Date.now()}_${category.replace(/\s+/g, '_')}`;
    const registrationData = {
      deviceId: uniqueId,
      name: `Test User ${category}`,
      email: `test.${category.replace(/\s+/g, '_').toLowerCase()}.${Date.now()}@example.com`,
      phone: "+1234567890",
      appVersion: "1.0.0",
      platform: "android",
      companyName: `Test ${category} Company`,
      category: category
    };

    const result = await makeRequest('/api/mobile/auth/register', 'POST', registrationData);
    results.push({
      category,
      success: result.success && result.data.success,
      hasBusinessProfile: result.data?.data?.user?.businessProfile ? true : false
    });
  }

  return {
    success: results.every(r => r.success),
    data: { results }
  };
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Enhanced Mobile Authentication API Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('=' .repeat(60));

  // Core Authentication Tests
  await runTest('Mobile User Registration with Business Info', testMobileRegistration);
  await runTest('Mobile User Login', testMobileLogin);
  await runTest('Get Mobile User Info', testGetUserInfo);
  await runTest('Forgot Password', testForgotPassword);
  await runTest('Reset Password', testResetPassword);
  await runTest('Verify Email', testVerifyEmail);
  await runTest('Logout', testLogout);

  // Business Category Tests
  await runTest('Business Categories Registration', testBusinessCategories);

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.total}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => test.status === 'FAILED' || test.status === 'ERROR')
      .forEach(test => {
        console.log(`   - ${test.test}: ${test.status}`);
      });
  }

  console.log('\n🎉 Enhanced Mobile Authentication API Testing Complete!');
  
  return testResults;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testResults };
