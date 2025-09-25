const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function testAPIEndpoint(name, url, method = 'GET', body = null, headers = {}) {
  try {
    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    const status = response.status;

    if (response.ok) {
      console.log(`✅ ${name}: ${status} - ${response.statusText}`);
      return { name, status, success: true, data };
    } else {
      console.log(`❌ ${name}: ${status} - ${response.statusText}`);
      console.log(`   Error: ${data.error || JSON.stringify(data)}`);
      return { name, status, success: false, error: data.error || JSON.stringify(data) };
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return { name, status: 'ERROR', success: false, error: error.message };
  }
}

async function testAPICollection() {
  console.log('🧪 Testing API Collection Endpoints...\n');
  
  const results = [];

  // Test 1: Health Check
  console.log('📋 Test 1: Health Check:');
  results.push(await testAPIEndpoint('Health Check', `${BASE_URL}/health`));
  console.log('');

  // Test 2: Admin Login
  console.log('📋 Test 2: Admin Login:');
  const adminLoginBody = { email: 'admin@eventmarketers.com', password: 'admin123' };
  const adminResult = await testAPIEndpoint('Admin Login', `${BASE_URL}/api/auth/admin/login`, 'POST', adminLoginBody);
  results.push(adminResult);
  
  let adminToken = null;
  if (adminResult.success && adminResult.data.token) {
    adminToken = adminResult.data.token;
    console.log('✅ Admin token obtained');
  }
  console.log('');

  // Test 3: Analytics Dashboard
  if (adminToken) {
    console.log('📋 Test 3: Analytics Dashboard:');
    results.push(await testAPIEndpoint('Analytics Dashboard', `${BASE_URL}/api/analytics/dashboard`, 'GET', null, { 'Authorization': `Bearer ${adminToken}` }));
    console.log('');
  }

  // Test 4: File Management Status
  if (adminToken) {
    console.log('📋 Test 4: File Management Status:');
    results.push(await testAPIEndpoint('File Management Status', `${BASE_URL}/api/file-management/status`, 'GET', null, { 'Authorization': `Bearer ${adminToken}` }));
    console.log('');
  }

  // Test 5: Search Statistics
  if (adminToken) {
    console.log('📋 Test 5: Search Statistics:');
    results.push(await testAPIEndpoint('Search Statistics', `${BASE_URL}/api/search/stats`, 'GET', null, { 'Authorization': `Bearer ${adminToken}` }));
    console.log('');
  }

  // Test 6: Business Categories
  if (adminToken) {
    console.log('📋 Test 6: Business Categories:');
    results.push(await testAPIEndpoint('Business Categories', `${BASE_URL}/api/mobile/business-categories`, 'GET', null, { 'Authorization': `Bearer ${adminToken}` }));
    console.log('');
  }

  // Test 7: Get Subadmins
  if (adminToken) {
    console.log('📋 Test 7: Get Subadmins:');
    results.push(await testAPIEndpoint('Get Subadmins', `${BASE_URL}/api/admin/subadmins`, 'GET', null, { 'Authorization': `Bearer ${adminToken}` }));
    console.log('');
  }

  // Test 8: Customer Registration
  console.log('📋 Test 8: Customer Registration:');
  const customerBody = {
    name: 'Test Customer',
    email: `test.customer.${Date.now()}@example.com`,
    password: 'password123',
    phone: '+1234567890',
    businessName: 'Test Business',
    businessType: 'Restaurant'
  };
  results.push(await testAPIEndpoint('Customer Registration', `${BASE_URL}/api/mobile/auth/register`, 'POST', customerBody));
  console.log('');

  // Summary
  console.log('📊 API Collection Test Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  const successRate = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${successRate}%`);

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

  console.log('\n🎯 API Collection Status:');
  if (successRate >= 80) {
    console.log('✅ API Collection is working well!');
  } else if (successRate >= 60) {
    console.log('⚠️ API Collection has some issues');
  } else {
    console.log('❌ API Collection needs attention');
  }

  console.log('\n📋 Available API Collections:');
  console.log('1. EventMarketers_Complete_API_Collection.postman_collection.json - Complete Postman collection');
  console.log('2. COMPLETE_API_DOCUMENTATION.md - Comprehensive API documentation');
  console.log('3. API_QUICK_REFERENCE.md - Quick reference guide');
  console.log('\n🔗 Import the Postman collection to start testing all endpoints!');
}

testAPICollection();

