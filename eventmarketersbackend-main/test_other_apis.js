const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

// Get admin token for authenticated requests
let adminToken = null;
let subadminToken = null;

async function getAuthTokens() {
  console.log('🔐 Getting authentication tokens...');
  
  try {
    // Admin login
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
      console.log('✅ Admin token obtained');
    }
    
    // Subadmin login
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
      console.log('✅ Subadmin token obtained');
    }
  } catch (error) {
    console.log('❌ Error getting auth tokens:', error.message);
  }
}

async function testEndpoint(name, url, method = 'GET', body = null, headers = {}) {
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
      if (data.data && Array.isArray(data.data)) {
        console.log(`   📊 Returned ${data.data.length} items`);
      } else if (data.categories && Array.isArray(data.categories)) {
        console.log(`   📊 Returned ${data.categories.length} categories`);
      }
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

async function runOtherAPITests() {
  console.log('🚀 Testing Other APIs (Non-User CRUD)...\n');
  
  // Get authentication tokens first
  await getAuthTokens();
  console.log('');

  const results = [];

  // 1. Business Categories & Content APIs
  console.log('📂 Testing Business Categories & Content APIs:');
  results.push(await testEndpoint('Business Categories', `${BASE_URL}/api/mobile/business-categories`));
  results.push(await testEndpoint('All Images', `${BASE_URL}/api/content/images`));
  results.push(await testEndpoint('All Videos', `${BASE_URL}/api/content/videos`));
  results.push(await testEndpoint('Pending Approvals', `${BASE_URL}/api/content/pending-approvals`, 'GET', null, { 'Authorization': `Bearer ${adminToken}` }));
  console.log('');

  // 2. Admin Management APIs
  console.log('👑 Testing Admin Management APIs:');
  results.push(await testEndpoint('Get Subadmins', `${BASE_URL}/api/admin/subadmins`, 'GET', null, { 'Authorization': `Bearer ${adminToken}` }));
  results.push(await testEndpoint('Get Admins', `${BASE_URL}/api/admin/admins`, 'GET', null, { 'Authorization': `Bearer ${adminToken}` }));
  results.push(await testEndpoint('Admin Dashboard Stats', `${BASE_URL}/api/admin/dashboard/stats`, 'GET', null, { 'Authorization': `Bearer ${adminToken}` }));
  results.push(await testEndpoint('Admin Analytics', `${BASE_URL}/api/admin/analytics`, 'GET', null, { 'Authorization': `Bearer ${adminToken}` }));
  console.log('');

  // 3. Content Management APIs
  console.log('📸 Testing Content Management APIs:');
  const imageData = {
    title: 'Test Image via API',
    description: 'Testing image upload via API',
    url: 'https://example.com/test-image.jpg',
    category: 'GENERAL',
    tags: JSON.stringify(['test', 'api']),
    fileSize: 1024000,
    format: 'jpeg'
  };
  results.push(await testEndpoint('Upload Image', `${BASE_URL}/api/content/images`, 'POST', imageData, { 'Authorization': `Bearer ${adminToken}` }));
  
  const videoData = {
    title: 'Test Video via API',
    description: 'Testing video upload via API',
    url: 'https://example.com/test-video.mp4',
    category: 'GENERAL',
    tags: JSON.stringify(['test', 'api']),
    fileSize: 10240000,
    format: 'mp4'
  };
  results.push(await testEndpoint('Upload Video', `${BASE_URL}/api/content/videos`, 'POST', videoData, { 'Authorization': `Bearer ${adminToken}` }));
  console.log('');

  // 4. Subadmin Management APIs
  console.log('👥 Testing Subadmin Management APIs:');
  const newSubadminData = {
    name: 'Test Subadmin',
    email: `test-subadmin-${Date.now()}@example.com`,
    password: 'password123',
    role: 'SUBADMIN',
    permissions: JSON.stringify(['read', 'upload']),
    assignedCategories: JSON.stringify(['Restaurant']),
    mobileNumber: '+1234567890'
  };
  results.push(await testEndpoint('Create Subadmin', `${BASE_URL}/api/admin/subadmins`, 'POST', newSubadminData, { 'Authorization': `Bearer ${adminToken}` }));
  console.log('');

  // 5. Business Profile APIs
  console.log('🏢 Testing Business Profile APIs:');
  const businessProfileData = {
    businessName: 'Test Business',
    businessEmail: 'business@example.com',
    businessPhone: '+1987654321',
    businessCategory: 'Restaurant',
    businessAddress: '123 Test Street',
    businessDescription: 'A test business for API testing'
  };
  results.push(await testEndpoint('Create Business Profile', `${BASE_URL}/api/business-profile/profile`, 'POST', businessProfileData, { 'Authorization': `Bearer ${adminToken}` }));
  results.push(await testEndpoint('Get Business Profiles', `${BASE_URL}/api/business-profile/profiles`, 'GET', null, { 'Authorization': `Bearer ${adminToken}` }));
  console.log('');

  // 6. Analytics & Reporting APIs
  console.log('📊 Testing Analytics & Reporting APIs:');
  results.push(await testEndpoint('User Analytics', `${BASE_URL}/api/analytics/users`));
  results.push(await testEndpoint('Content Analytics', `${BASE_URL}/api/analytics/content`));
  results.push(await testEndpoint('Download Analytics', `${BASE_URL}/api/analytics/downloads`));
  results.push(await testEndpoint('Dashboard Metrics', `${BASE_URL}/api/dashboard/metrics`));
  console.log('');

  // 7. Marketing Campaign APIs (Legacy)
  console.log('📈 Testing Marketing Campaign APIs:');
  results.push(await testEndpoint('Get Campaigns', `${BASE_URL}/api/campaigns`));
  results.push(await testEndpoint('Get Marketing Metrics', `${BASE_URL}/api/marketing-metrics`));
  console.log('');

  // 8. System & Utility APIs
  console.log('⚙️ Testing System & Utility APIs:');
  results.push(await testEndpoint('System Health', `${BASE_URL}/health`));
  results.push(await testEndpoint('API Status', `${BASE_URL}/api/status`));
  results.push(await testEndpoint('Server Info', `${BASE_URL}/api/info`));
  console.log('');

  // 9. File Upload APIs (if available)
  console.log('📁 Testing File Upload APIs:');
  results.push(await testEndpoint('Upload Directory Check', `${BASE_URL}/api/upload/status`));
  results.push(await testEndpoint('File Types Info', `${BASE_URL}/api/upload/types`));
  console.log('');

  // 10. Search & Filter APIs
  console.log('🔍 Testing Search & Filter APIs:');
  results.push(await testEndpoint('Search Images', `${BASE_URL}/api/search/images?q=test`));
  results.push(await testEndpoint('Search Videos', `${BASE_URL}/api/search/videos?q=test`));
  results.push(await testEndpoint('Filter by Category', `${BASE_URL}/api/content/images?category=Restaurant`));
  console.log('');

  // Summary
  console.log('📊 Test Summary:');
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
    console.log('\n✅ Working APIs:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   ${r.name}: ${r.status}`);
    });
  }

  console.log('\n🎯 Key Findings:');
  const workingAPIs = results.filter(r => r.success).map(r => r.name);
  const failedAPIs = results.filter(r => !r.success).map(r => r.name);
  
  console.log(`\n✅ Working APIs (${workingAPIs.length}):`);
  workingAPIs.forEach(api => console.log(`   - ${api}`));
  
  console.log(`\n❌ Failed APIs (${failedAPIs.length}):`);
  failedAPIs.forEach(api => console.log(`   - ${api}`));
}

runOtherAPITests();
