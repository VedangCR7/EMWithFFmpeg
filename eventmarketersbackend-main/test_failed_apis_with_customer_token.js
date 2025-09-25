const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

// Store tokens
let adminToken = null;
let subadminToken = null;
let customerToken = null;
let customerId = null;

async function createAllTokens() {
  console.log('🔐 Creating All Authentication Tokens...\n');
  
  try {
    // Create Admin Token
    console.log('👑 Creating Admin Token...');
    const adminResponse = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@eventmarketers.com',
        password: 'admin123'
      })
    });
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      adminToken = adminData.token;
      console.log('✅ Admin Token Created');
    }
    
    // Create Subadmin Token
    console.log('👥 Creating Subadmin Token...');
    const subadminResponse = await fetch(`${BASE_URL}/api/auth/subadmin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'subadmin@eventmarketers.com',
        password: 'subadmin123'
      })
    });
    
    if (subadminResponse.ok) {
      const subadminData = await subadminResponse.json();
      subadminToken = subadminData.token;
      console.log('✅ Subadmin Token Created');
    }
    
    // Create Customer Token
    console.log('🏢 Creating Customer Token...');
    const timestamp = Date.now();
    const customerData = {
      companyName: `Test Customer ${timestamp}`,
      email: `test-customer-${timestamp}@example.com`,
      phone: '+1234567890',
      password: 'password123'
    };
    
    const customerResponse = await fetch(`${BASE_URL}/api/mobile/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    
    if (customerResponse.ok) {
      const customerData = await customerResponse.json();
      customerToken = customerData.data.token;
      customerId = customerData.data.user.id;
      console.log('✅ Customer Token Created');
      console.log(`   Customer ID: ${customerId}`);
    }
    
  } catch (error) {
    console.log('❌ Error creating tokens:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

async function testFailedEndpoint(name, url, method = 'GET', body = null, token = null, tokenType = 'None') {
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    const status = response.status;

    if (response.ok) {
      console.log(`✅ ${name} (${tokenType}): ${status} - ${response.statusText}`);
      if (data.success && data.data) {
        console.log(`   📊 Data: ${JSON.stringify(data.data, null, 2).substring(0, 150)}...`);
      } else if (data.success && data.customer) {
        console.log(`   📊 Customer: ${JSON.stringify(data.customer, null, 2).substring(0, 150)}...`);
      } else if (data.success && data.profile) {
        console.log(`   📊 Profile: ${JSON.stringify(data.profile, null, 2).substring(0, 150)}...`);
      } else {
        console.log(`   📄 Response: ${JSON.stringify(data, null, 2).substring(0, 150)}...`);
      }
      return { name, status, success: true, data, tokenType };
    } else {
      console.log(`❌ ${name} (${tokenType}): ${status} - ${response.statusText}`);
      console.log(`   Error: ${data.error ? JSON.stringify(data.error) : JSON.stringify(data)}`);
      return { name, status, success: false, error: data.error || JSON.stringify(data), tokenType };
    }
  } catch (error) {
    console.log(`❌ ${name} (${tokenType}): ERROR - ${error.message}`);
    return { name, status: 'ERROR', success: false, error: error.message, tokenType };
  }
}

async function runFailedAPITests() {
  console.log('🚀 Testing Previously Failed APIs with Customer Token...\n');
  
  // Create all tokens
  await createAllTokens();
  
  if (!adminToken || !subadminToken || !customerToken) {
    console.log('❌ Could not create all required tokens');
    return;
  }
  
  const results = [];
  
  // Test 1: Content Upload APIs (Previously 404)
  console.log('📤 Testing Content Upload APIs:');
  const imageData = {
    title: 'Test Image via Customer',
    description: 'Testing image upload via customer API',
    category: 'GENERAL',
    tags: 'test,customer'
  };
  results.push(await testFailedEndpoint('Upload Image (Customer)', `${BASE_URL}/api/content/images/upload`, 'POST', imageData, customerToken, 'Customer'));
  results.push(await testFailedEndpoint('Upload Image (Admin)', `${BASE_URL}/api/content/images/upload`, 'POST', imageData, adminToken, 'Admin'));
  results.push(await testFailedEndpoint('Upload Image (Subadmin)', `${BASE_URL}/api/content/images/upload`, 'POST', imageData, subadminToken, 'Subadmin'));
  console.log('');
  
  // Test 2: Subadmin Creation (Previously 400)
  console.log('👥 Testing Subadmin Creation:');
  const correctSubadminData = {
    name: 'Test Subadmin Customer',
    email: `test-subadmin-customer-${Date.now()}@example.com`,
    password: 'password123',
    role: 'SUBADMIN',
    permissions: ['read', 'upload'], // Array format
    assignedBusinessCategories: ['Restaurant'], // Correct field name
    mobileNumber: '+1234567890'
  };
  results.push(await testFailedEndpoint('Create Subadmin (Admin)', `${BASE_URL}/api/admin/subadmins`, 'POST', correctSubadminData, adminToken, 'Admin'));
  results.push(await testFailedEndpoint('Create Subadmin (Customer)', `${BASE_URL}/api/admin/subadmins`, 'POST', correctSubadminData, customerToken, 'Customer'));
  console.log('');
  
  // Test 3: Business Profile APIs (Previously 403)
  console.log('🏢 Testing Business Profile APIs:');
  const businessProfileData = {
    businessName: 'Test Business Customer',
    businessEmail: 'business-customer@example.com',
    businessPhone: '+1987654321',
    businessCategory: 'Restaurant',
    businessAddress: '123 Customer Street',
    businessDescription: 'A test business created via customer API'
  };
  results.push(await testFailedEndpoint('Create Business Profile (Customer)', `${BASE_URL}/api/business-profile/profile`, 'POST', businessProfileData, customerToken, 'Customer'));
  results.push(await testFailedEndpoint('Get Business Profile (Customer)', `${BASE_URL}/api/business-profile/profile`, 'GET', null, customerToken, 'Customer'));
  results.push(await testFailedEndpoint('Create Business Profile (Admin)', `${BASE_URL}/api/business-profile/profile`, 'POST', businessProfileData, adminToken, 'Admin'));
  console.log('');
  
  // Test 4: Mobile Customer APIs (Previously 404)
  console.log('📱 Testing Mobile Customer APIs:');
  results.push(await testFailedEndpoint('Get Customer Content (Real ID)', `${BASE_URL}/api/mobile/content/${customerId}`, 'GET', null, null, 'None'));
  results.push(await testFailedEndpoint('Get Customer Profile (Real ID)', `${BASE_URL}/api/mobile/profile/${customerId}`, 'GET', null, null, 'None'));
  results.push(await testFailedEndpoint('Get Customer Content (With Auth)', `${BASE_URL}/api/mobile/content/${customerId}`, 'GET', null, customerToken, 'Customer'));
  results.push(await testFailedEndpoint('Get Customer Profile (With Auth)', `${BASE_URL}/api/mobile/profile/${customerId}`, 'GET', null, customerToken, 'Customer'));
  console.log('');
  
  // Test 5: Analytics APIs (Previously 404)
  console.log('📊 Testing Analytics APIs:');
  results.push(await testFailedEndpoint('User Analytics (Admin)', `${BASE_URL}/api/analytics/users`, 'GET', null, adminToken, 'Admin'));
  results.push(await testFailedEndpoint('Content Analytics (Admin)', `${BASE_URL}/api/analytics/content`, 'GET', null, adminToken, 'Admin'));
  results.push(await testFailedEndpoint('Download Analytics (Admin)', `${BASE_URL}/api/analytics/downloads`, 'GET', null, adminToken, 'Admin'));
  results.push(await testFailedEndpoint('Dashboard Metrics (Admin)', `${BASE_URL}/api/dashboard/metrics`, 'GET', null, adminToken, 'Admin'));
  console.log('');
  
  // Test 6: Search & Filter APIs (Previously 404)
  console.log('🔍 Testing Search & Filter APIs:');
  results.push(await testFailedEndpoint('Search Images (Admin)', `${BASE_URL}/api/search/images?q=test`, 'GET', null, adminToken, 'Admin'));
  results.push(await testFailedEndpoint('Search Videos (Admin)', `${BASE_URL}/api/search/videos?q=test`, 'GET', null, adminToken, 'Admin'));
  results.push(await testFailedEndpoint('Filter Images by Category (Admin)', `${BASE_URL}/api/content/images?category=Restaurant`, 'GET', null, adminToken, 'Admin'));
  console.log('');
  
  // Test 7: File Upload Management APIs (Previously 404)
  console.log('📁 Testing File Upload Management APIs:');
  results.push(await testFailedEndpoint('Upload Directory Check (Admin)', `${BASE_URL}/api/upload/status`, 'GET', null, adminToken, 'Admin'));
  results.push(await testFailedEndpoint('File Types Info (Admin)', `${BASE_URL}/api/upload/types`, 'GET', null, adminToken, 'Admin'));
  console.log('');
  
  // Test 8: Additional Customer-specific APIs
  console.log('👤 Testing Additional Customer APIs:');
  results.push(await testFailedEndpoint('Get Auth Customer Profile', `${BASE_URL}/api/mobile/auth/profile`, 'GET', null, customerToken, 'Customer'));
  results.push(await testFailedEndpoint('Update Customer Profile', `${BASE_URL}/api/mobile/auth/profile`, 'PUT', { companyName: 'Updated Customer Name' }, customerToken, 'Customer'));
  console.log('');
  
  // Summary
  console.log('📊 Failed APIs Test Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  const successRate = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${successRate}%`);

  // Group results by token type
  const adminResults = results.filter(r => r.tokenType === 'Admin');
  const subadminResults = results.filter(r => r.tokenType === 'Subadmin');
  const customerResults = results.filter(r => r.tokenType === 'Customer');
  const noAuthResults = results.filter(r => r.tokenType === 'None');
  
  console.log(`\n👑 Admin Token Tests: ${adminResults.filter(r => r.success).length}/${adminResults.length} passed`);
  console.log(`👥 Subadmin Token Tests: ${subadminResults.filter(r => r.success).length}/${subadminResults.length} passed`);
  console.log(`🏢 Customer Token Tests: ${customerResults.filter(r => r.success).length}/${customerResults.length} passed`);
  console.log(`🔓 No Auth Tests: ${noAuthResults.filter(r => r.success).length}/${noAuthResults.length} passed`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.name} (${r.tokenType}): ${r.status} - ${r.error || 'Unknown error'}`);
    });
  }

  if (passed > 0) {
    console.log('\n✅ Working Tests:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   ${r.name} (${r.tokenType}): ${r.status}`);
    });
  }

  console.log('\n🎯 Key Findings:');
  const workingAPIs = results.filter(r => r.success).map(r => r.name);
  const failedAPIs = results.filter(r => !r.success).map(r => r.name);
  
  console.log(`\n✅ Now Working APIs (${workingAPIs.length}):`);
  workingAPIs.forEach(api => console.log(`   - ${api}`));
  
  console.log(`\n❌ Still Failed APIs (${failedAPIs.length}):`);
  failedAPIs.forEach(api => console.log(`   - ${api}`));
  
  console.log('\n🔑 Token Information:');
  if (adminToken) {
    console.log(`   Admin Token: ${adminToken.substring(0, 50)}...`);
  }
  if (subadminToken) {
    console.log(`   Subadmin Token: ${subadminToken.substring(0, 50)}...`);
  }
  if (customerToken) {
    console.log(`   Customer Token: ${customerToken.substring(0, 50)}...`);
  }
  if (customerId) {
    console.log(`   Customer ID: ${customerId}`);
  }
}

runFailedAPITests();
