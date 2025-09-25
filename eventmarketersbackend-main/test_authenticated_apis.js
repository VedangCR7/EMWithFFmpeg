const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function testAuthenticatedEndpoint(name, url, method = 'GET', body = null, token = null) {
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
      if (data.data && Array.isArray(data.data)) {
        console.log(`   📊 Returned ${data.data.length} items`);
      } else if (data.categories && Array.isArray(data.categories)) {
        console.log(`   📊 Returned ${data.categories.length} categories`);
      } else if (data.subadmins && Array.isArray(data.subadmins)) {
        console.log(`   📊 Returned ${data.subadmins.length} subadmins`);
      } else if (data.images && Array.isArray(data.images)) {
        console.log(`   📊 Returned ${data.images.length} images`);
      } else if (data.videos && Array.isArray(data.videos)) {
        console.log(`   📊 Returned ${data.videos.length} videos`);
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

async function runAuthenticatedTests() {
  console.log('🔐 Testing Authenticated APIs...\n');
  
  // Get authentication tokens
  let adminToken = null;
  let subadminToken = null;
  
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
    return;
  }
  
  console.log('');

  const results = [];

  // 1. Test Content APIs with Authentication
  console.log('📸 Testing Content APIs with Authentication:');
  results.push(await testAuthenticatedEndpoint('Get All Images (Admin)', `${BASE_URL}/api/content/images`, 'GET', null, adminToken));
  results.push(await testAuthenticatedEndpoint('Get All Videos (Admin)', `${BASE_URL}/api/content/videos`, 'GET', null, adminToken));
  results.push(await testAuthenticatedEndpoint('Get All Images (Subadmin)', `${BASE_URL}/api/content/images`, 'GET', null, subadminToken));
  results.push(await testAuthenticatedEndpoint('Get All Videos (Subadmin)', `${BASE_URL}/api/content/videos`, 'GET', null, subadminToken));
  console.log('');

  // 2. Test Content Filtering
  console.log('🔍 Testing Content Filtering:');
  results.push(await testAuthenticatedEndpoint('Filter Images by Category (Admin)', `${BASE_URL}/api/content/images?category=Restaurant`, 'GET', null, adminToken));
  results.push(await testAuthenticatedEndpoint('Filter Videos by Category (Admin)', `${BASE_URL}/api/content/videos?category=Restaurant`, 'GET', null, adminToken));
  console.log('');

  // 3. Test Content Upload (Admin only)
  console.log('📤 Testing Content Upload (Admin):');
  const imageData = {
    title: 'Test Image via API',
    description: 'Testing image upload via API',
    url: 'https://example.com/test-image.jpg',
    category: 'GENERAL',
    tags: JSON.stringify(['test', 'api']),
    fileSize: 1024000,
    format: 'jpeg'
  };
  results.push(await testAuthenticatedEndpoint('Upload Image (Admin)', `${BASE_URL}/api/content/images`, 'POST', imageData, adminToken));
  
  const videoData = {
    title: 'Test Video via API',
    description: 'Testing video upload via API',
    url: 'https://example.com/test-video.mp4',
    category: 'GENERAL',
    tags: JSON.stringify(['test', 'api']),
    fileSize: 10240000,
    format: 'mp4'
  };
  results.push(await testAuthenticatedEndpoint('Upload Video (Admin)', `${BASE_URL}/api/content/videos`, 'POST', videoData, adminToken));
  console.log('');

  // 4. Test Subadmin Management
  console.log('👥 Testing Subadmin Management:');
  const newSubadminData = {
    name: 'Test Subadmin API',
    email: `test-subadmin-${Date.now()}@example.com`,
    password: 'password123',
    role: 'SUBADMIN',
    permissions: JSON.stringify(['read', 'upload']),
    assignedCategories: JSON.stringify(['Restaurant']),
    mobileNumber: '+1234567890'
  };
  results.push(await testAuthenticatedEndpoint('Create Subadmin (Admin)', `${BASE_URL}/api/admin/subadmins`, 'POST', newSubadminData, adminToken));
  console.log('');

  // 5. Test Business Profile APIs
  console.log('🏢 Testing Business Profile APIs:');
  const businessProfileData = {
    businessName: 'Test Business API',
    businessEmail: 'business-api@example.com',
    businessPhone: '+1987654321',
    businessCategory: 'Restaurant',
    businessAddress: '123 Test Street',
    businessDescription: 'A test business for API testing'
  };
  results.push(await testAuthenticatedEndpoint('Create Business Profile (Admin)', `${BASE_URL}/api/business-profile/profile`, 'POST', businessProfileData, adminToken));
  results.push(await testAuthenticatedEndpoint('Get Business Profiles (Admin)', `${BASE_URL}/api/business-profile/profiles`, 'GET', null, adminToken));
  console.log('');

  // 6. Test Current User Info
  console.log('👤 Testing Current User Info:');
  results.push(await testAuthenticatedEndpoint('Get Current Admin', `${BASE_URL}/api/auth/me`, 'GET', null, adminToken));
  results.push(await testAuthenticatedEndpoint('Get Current Subadmin', `${BASE_URL}/api/auth/me`, 'GET', null, subadminToken));
  console.log('');

  // 7. Test Mobile Content APIs with Customer ID
  console.log('📱 Testing Mobile Content APIs:');
  // First, let's try to get a customer ID from the database or use a test one
  results.push(await testAuthenticatedEndpoint('Get Customer Content (Test ID)', `${BASE_URL}/api/mobile/content/test-customer-id`, 'GET', null, null));
  results.push(await testAuthenticatedEndpoint('Get Customer Profile (Test ID)', `${BASE_URL}/api/mobile/profile/test-customer-id`, 'GET', null, null));
  console.log('');

  // Summary
  console.log('📊 Authenticated API Test Summary:');
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
    console.log('\n✅ Working Authenticated APIs:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   ${r.name}: ${r.status}`);
    });
  }

  console.log('\n🎯 Key Findings:');
  const workingAPIs = results.filter(r => r.success).map(r => r.name);
  const failedAPIs = results.filter(r => !r.success).map(r => r.name);
  
  console.log(`\n✅ Working Authenticated APIs (${workingAPIs.length}):`);
  workingAPIs.forEach(api => console.log(`   - ${api}`));
  
  console.log(`\n❌ Failed Authenticated APIs (${failedAPIs.length}):`);
  failedAPIs.forEach(api => console.log(`   - ${api}`));
}

runAuthenticatedTests();
