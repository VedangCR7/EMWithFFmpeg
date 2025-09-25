/**
 * Test Mobile Register and Login APIs
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function testMobileRegister() {
  console.log('🧪 Testing Mobile Registration...');
  
  const uniqueId = `test_device_${Date.now()}`;
  const registrationData = {
    deviceId: uniqueId,
    name: "Test User",
    email: `test.user.${Date.now()}@example.com`,
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

  try {
    const response = await fetch(`${BASE_URL}/api/mobile/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Registration SUCCESS!');
      console.log(`👤 User ID: ${data.data.user.id}`);
      console.log(`🏢 Business Profile: ${data.data.user.businessProfile ? 'Created' : 'Not Created'}`);
      console.log(`🔑 Token: ${data.data.token ? 'Generated' : 'Not Generated'}`);
      
      // Store for login test
      global.testDeviceId = uniqueId;
      global.testToken = data.data.token;
      
      return { success: true, data };
    } else {
      console.log('❌ Registration FAILED!');
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Registration ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function testMobileLogin() {
  console.log('\n🧪 Testing Mobile Login...');
  
  if (!global.testDeviceId) {
    console.log('❌ No device ID from registration test');
    return { success: false, error: 'No device ID available' };
  }

  const loginData = {
    deviceId: global.testDeviceId
  };

  try {
    const response = await fetch(`${BASE_URL}/api/mobile/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Login SUCCESS!');
      console.log(`👤 User ID: ${data.data.user.id}`);
      console.log(`📱 Device ID: ${data.data.user.deviceId}`);
      console.log(`🔑 Token: ${data.data.token ? 'Generated' : 'Not Generated'}`);
      console.log(`⏰ Last Active: ${data.data.user.lastActiveAt}`);
      
      return { success: true, data };
    } else {
      console.log('❌ Login FAILED!');
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Login ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function testGetUserInfo() {
  console.log('\n🧪 Testing Get User Info...');
  
  if (!global.testToken) {
    console.log('❌ No token available');
    return { success: false, error: 'No token available' };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/mobile/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${global.testToken}`
      }
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Get User Info SUCCESS!');
      console.log(`👤 User ID: ${data.data.user.id}`);
      console.log(`🏢 Business Profiles: ${data.data.user.businessProfiles?.length || 0}`);
      console.log(`💳 Subscriptions: ${data.data.user.subscriptions?.length || 0}`);
      
      return { success: true, data };
    } else {
      console.log('❌ Get User Info FAILED!');
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Get User Info ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Mobile Register and Login APIs');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('=' .repeat(60));

  const results = {
    register: await testMobileRegister(),
    login: await testMobileLogin(),
    getUserInfo: await testGetUserInfo()
  };

  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Register: ${results.register.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Login: ${results.login.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Get User Info: ${results.getUserInfo.success ? 'PASSED' : 'FAILED'}`);
  
  const passed = Object.values(results).filter(r => r.success).length;
  const total = Object.keys(results).length;
  
  console.log(`🎯 Success Rate: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Mobile Register and Login APIs are working perfectly!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the details above.');
  }

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
