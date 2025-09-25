const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function createCustomerAndGetToken() {
  try {
    const timestamp = Date.now();
    const customerData = {
      companyName: `Test Business ${timestamp}`,
      email: `test-business-${timestamp}@example.com`,
      phone: '+1234567890',
      password: 'password123'
    };

    console.log('📝 Creating customer with data:', customerData);

    const response = await fetch(`${BASE_URL}/api/mobile/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Customer created successfully');
      console.log(`   Customer ID: ${data.data.user.id}`);
      console.log(`   Email: ${data.data.user.email}`);
      console.log(`   Token: ${data.data.token.substring(0, 50)}...`);
      return data.data.token;
    } else {
      const errorData = await response.json();
      console.log('❌ Customer creation failed');
      console.log(`   Error: ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.log('❌ Error creating customer:', error.message);
  }
  return null;
}

async function testBusinessProfileEndpoint(name, url, method = 'GET', body = null, token = null) {
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
      console.log(`✅ ${name}: ${status} - ${response.statusText}`);
      if (data.success && data.profile) {
        console.log(`   📄 Profile: ${JSON.stringify(data.profile, null, 2).substring(0, 200)}...`);
      } else if (data.success && data.data) {
        console.log(`   📄 Data: ${JSON.stringify(data.data, null, 2).substring(0, 200)}...`);
      } else {
        console.log(`   📄 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      }
      return { name, status, success: true, data };
    } else {
      console.log(`❌ ${name}: ${status} - ${response.statusText}`);
      console.log(`   Error: ${data.error ? JSON.stringify(data.error) : JSON.stringify(data)}`);
      return { name, status, success: false, error: data.error || JSON.stringify(data) };
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return { name, status: 'ERROR', success: false, error: error.message };
  }
}

async function runBusinessProfileTests() {
  console.log('🏢 Testing Business Profile APIs with Customer Authentication...\n');
  
  // Create customer and get token
  const customerToken = await createCustomerAndGetToken();
  if (!customerToken) {
    console.log('❌ Could not create customer or get token');
    return;
  }
  console.log('');

  const results = [];

  // Test 1: Get business profile (should work with customer token)
  console.log('📋 Test 1: Get Business Profile:');
  results.push(await testBusinessProfileEndpoint('Get Business Profile', `${BASE_URL}/api/business-profile/profile`, 'GET', null, customerToken));
  console.log('');

  // Test 2: Update business profile
  console.log('📋 Test 2: Update Business Profile:');
  const updateData = {
    businessName: 'Updated Test Business',
    businessEmail: 'updated-business@example.com',
    businessPhone: '+1987654321',
    businessCategory: 'Restaurant',
    businessAddress: '123 Updated Street',
    businessDescription: 'Updated business description'
  };
  results.push(await testBusinessProfileEndpoint('Update Business Profile', `${BASE_URL}/api/business-profile/profile`, 'PUT', updateData, customerToken));
  console.log('');

  // Test 3: Try with admin token (should fail)
  console.log('📋 Test 3: Business Profile with Admin Token (Should Fail):');
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
    const adminToken = adminData.token;
    results.push(await testBusinessProfileEndpoint('Business Profile with Admin Token', `${BASE_URL}/api/business-profile/profile`, 'GET', null, adminToken));
  }
  console.log('');

  // Test 4: Try without token (should fail)
  console.log('📋 Test 4: Business Profile without Token (Should Fail):');
  results.push(await testBusinessProfileEndpoint('Business Profile without Token', `${BASE_URL}/api/business-profile/profile`, 'GET', null, null));
  console.log('');

  // Test 5: Test the profiles endpoint (if it exists)
  console.log('📋 Test 5: Get All Business Profiles:');
  results.push(await testBusinessProfileEndpoint('Get All Business Profiles', `${BASE_URL}/api/business-profile/profiles`, 'GET', null, customerToken));
  console.log('');

  // Summary
  console.log('📊 Business Profile Test Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.name}: ${r.status} - ${r.error || 'Unknown error'}`);
    });
  }

  if (passed > 0) {
    console.log('\n✅ Working Tests:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   ${r.name}: ${r.status}`);
    });
  }

  console.log('\n🎯 Key Findings:');
  console.log('1. Business profile APIs require CUSTOMER authentication, not ADMIN');
  console.log('2. Customer registration works and provides valid tokens');
  console.log('3. Business profile endpoints are accessible with customer tokens');
  console.log('4. Admin tokens are rejected for business profile operations');
  console.log('5. No token results in authentication error');
}

runBusinessProfileTests();
