const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

// Store tokens
let adminToken = null;
let subadminToken = null;

async function createTokens() {
  console.log('🔐 Creating Authentication Tokens...\n');
  
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
      console.log('✅ Admin Token Created Successfully');
      console.log(`   Token: ${adminToken.substring(0, 50)}...`);
      console.log(`   User: ${adminData.user?.name || 'Admin User'}`);
      console.log(`   Email: ${adminData.user?.email || 'admin@eventmarketers.com'}`);
    } else {
      const errorData = await adminResponse.json();
      console.log('❌ Admin Token Creation Failed');
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
    }
    
    console.log('');
    
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
      console.log('✅ Subadmin Token Created Successfully');
      console.log(`   Token: ${subadminToken.substring(0, 50)}...`);
      console.log(`   User: ${subadminData.user?.name || 'Subadmin User'}`);
      console.log(`   Email: ${subadminData.user?.email || 'subadmin@eventmarketers.com'}`);
    } else {
      const errorData = await subadminResponse.json();
      console.log('❌ Subadmin Token Creation Failed');
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log('❌ Token Creation Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

async function testAuthenticatedEndpoint(name, url, method = 'GET', body = null, token = null, tokenType = 'None') {
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
      
      // Show data details
      if (data.data && Array.isArray(data.data)) {
        console.log(`   📊 Data: ${data.data.length} items`);
        if (data.data.length > 0) {
          console.log(`   📋 Sample: ${JSON.stringify(data.data[0], null, 2).substring(0, 100)}...`);
        }
      } else if (data.categories && Array.isArray(data.categories)) {
        console.log(`   📊 Categories: ${data.categories.length} items`);
        data.categories.forEach(cat => {
          console.log(`   📂 ${cat.name} (${cat.icon}) - ${cat.description}`);
        });
      } else if (data.subadmins && Array.isArray(data.subadmins)) {
        console.log(`   📊 Subadmins: ${data.subadmins.length} items`);
        data.subadmins.forEach(sub => {
          console.log(`   👤 ${sub.name} (${sub.email}) - ${sub.role}`);
        });
      } else if (data.images && Array.isArray(data.images)) {
        console.log(`   📊 Images: ${data.images.length} items`);
        data.images.forEach(img => {
          console.log(`   🖼️ ${img.title} - ${img.category} - ${img.approvalStatus}`);
        });
      } else if (data.videos && Array.isArray(data.videos)) {
        console.log(`   📊 Videos: ${data.videos.length} items`);
        data.videos.forEach(vid => {
          console.log(`   🎥 ${vid.title} - ${vid.category} - ${vid.approvalStatus}`);
        });
      } else if (data.user) {
        console.log(`   👤 User: ${data.user.name} (${data.user.email}) - ${data.user.role}`);
      } else if (data.token) {
        console.log(`   🔑 Token: ${data.token.substring(0, 30)}...`);
      } else {
        console.log(`   📄 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      }
      
      return { name, status, success: true, data, tokenType };
    } else {
      console.log(`❌ ${name} (${tokenType}): ${status} - ${response.statusText}`);
      console.log(`   Error: ${data.error || JSON.stringify(data)}`);
      return { name, status, success: false, error: data.error || JSON.stringify(data), tokenType };
    }
  } catch (error) {
    console.log(`❌ ${name} (${tokenType}): ERROR - ${error.message}`);
    return { name, status: 'ERROR', success: false, error: error.message, tokenType };
  }
}

async function runAuthenticatedTests() {
  console.log('🚀 Testing Authenticated APIs with Token Creation...\n');
  
  // Step 1: Create tokens
  await createTokens();
  
  if (!adminToken && !subadminToken) {
    console.log('❌ No tokens available. Cannot proceed with authenticated tests.');
    return;
  }
  
  const results = [];
  
  // Step 2: Test Authentication Endpoints
  console.log('🔐 Testing Authentication Endpoints:');
  results.push(await testAuthenticatedEndpoint('Get Current Admin', `${BASE_URL}/api/auth/me`, 'GET', null, adminToken, 'Admin'));
  results.push(await testAuthenticatedEndpoint('Get Current Subadmin', `${BASE_URL}/api/auth/me`, 'GET', null, subadminToken, 'Subadmin'));
  console.log('');
  
  // Step 3: Test Admin Management
  console.log('👑 Testing Admin Management APIs:');
  results.push(await testAuthenticatedEndpoint('Get Subadmins', `${BASE_URL}/api/admin/subadmins`, 'GET', null, adminToken, 'Admin'));
  results.push(await testAuthenticatedEndpoint('Get Pending Approvals', `${BASE_URL}/api/content/pending-approvals`, 'GET', null, adminToken, 'Admin'));
  console.log('');
  
  // Step 4: Test Content Management
  console.log('📸 Testing Content Management APIs:');
  results.push(await testAuthenticatedEndpoint('Get All Images (Admin)', `${BASE_URL}/api/content/images`, 'GET', null, adminToken, 'Admin'));
  results.push(await testAuthenticatedEndpoint('Get All Videos (Admin)', `${BASE_URL}/api/content/videos`, 'GET', null, adminToken, 'Admin'));
  results.push(await testAuthenticatedEndpoint('Get All Images (Subadmin)', `${BASE_URL}/api/content/images`, 'GET', null, subadminToken, 'Subadmin'));
  results.push(await testAuthenticatedEndpoint('Get All Videos (Subadmin)', `${BASE_URL}/api/content/videos`, 'GET', null, subadminToken, 'Subadmin'));
  console.log('');
  
  // Step 5: Test Content Filtering
  console.log('🔍 Testing Content Filtering:');
  results.push(await testAuthenticatedEndpoint('Filter Images by Restaurant', `${BASE_URL}/api/content/images?category=Restaurant`, 'GET', null, adminToken, 'Admin'));
  results.push(await testAuthenticatedEndpoint('Filter Videos by Restaurant', `${BASE_URL}/api/content/videos?category=Restaurant`, 'GET', null, adminToken, 'Admin'));
  results.push(await testAuthenticatedEndpoint('Filter Images by Wedding', `${BASE_URL}/api/content/images?category=Wedding Planning`, 'GET', null, adminToken, 'Admin'));
  console.log('');
  
  // Step 6: Test Content Upload (Admin only)
  console.log('📤 Testing Content Upload (Admin Only):');
  const imageData = {
    title: 'API Test Image',
    description: 'Testing image upload via authenticated API',
    url: 'https://example.com/api-test-image.jpg',
    category: 'GENERAL',
    tags: JSON.stringify(['api', 'test', 'upload']),
    fileSize: 1024000,
    format: 'jpeg'
  };
  results.push(await testAuthenticatedEndpoint('Upload Image', `${BASE_URL}/api/content/images`, 'POST', imageData, adminToken, 'Admin'));
  
  const videoData = {
    title: 'API Test Video',
    description: 'Testing video upload via authenticated API',
    url: 'https://example.com/api-test-video.mp4',
    category: 'GENERAL',
    tags: JSON.stringify(['api', 'test', 'upload']),
    fileSize: 10240000,
    format: 'mp4'
  };
  results.push(await testAuthenticatedEndpoint('Upload Video', `${BASE_URL}/api/content/videos`, 'POST', videoData, adminToken, 'Admin'));
  console.log('');
  
  // Step 7: Test Subadmin Creation
  console.log('👥 Testing Subadmin Creation:');
  const newSubadminData = {
    name: 'API Test Subadmin',
    email: `api-test-subadmin-${Date.now()}@example.com`,
    password: 'password123',
    role: 'SUBADMIN',
    permissions: JSON.stringify(['read', 'upload']),
    assignedCategories: JSON.stringify(['Restaurant']),
    mobileNumber: '+1234567890'
  };
  results.push(await testAuthenticatedEndpoint('Create Subadmin', `${BASE_URL}/api/admin/subadmins`, 'POST', newSubadminData, adminToken, 'Admin'));
  console.log('');
  
  // Step 8: Test Business Profile APIs
  console.log('🏢 Testing Business Profile APIs:');
  const businessProfileData = {
    businessName: 'API Test Business',
    businessEmail: `api-test-business-${Date.now()}@example.com`,
    businessPhone: '+1987654321',
    businessCategory: 'Restaurant',
    businessAddress: '123 API Test Street',
    businessDescription: 'A test business created via authenticated API'
  };
  results.push(await testAuthenticatedEndpoint('Create Business Profile', `${BASE_URL}/api/business-profile/profile`, 'POST', businessProfileData, adminToken, 'Admin'));
  results.push(await testAuthenticatedEndpoint('Get Business Profiles', `${BASE_URL}/api/business-profile/profiles`, 'GET', null, adminToken, 'Admin'));
  console.log('');
  
  // Step 9: Test Analytics APIs
  console.log('📊 Testing Analytics APIs:');
  results.push(await testAuthenticatedEndpoint('Dashboard Metrics', `${BASE_URL}/api/dashboard/metrics`, 'GET', null, adminToken, 'Admin'));
  results.push(await testAuthenticatedEndpoint('User Analytics', `${BASE_URL}/api/analytics/users`, 'GET', null, adminToken, 'Admin'));
  results.push(await testAuthenticatedEndpoint('Content Analytics', `${BASE_URL}/api/analytics/content`, 'GET', null, adminToken, 'Admin'));
  console.log('');
  
  // Step 10: Test Mobile APIs with Authentication
  console.log('📱 Testing Mobile APIs with Authentication:');
  results.push(await testAuthenticatedEndpoint('Get Customer Content (Test)', `${BASE_URL}/api/mobile/content/test-customer-id`, 'GET', null, adminToken, 'Admin'));
  results.push(await testAuthenticatedEndpoint('Get Customer Profile (Test)', `${BASE_URL}/api/mobile/profile/test-customer-id`, 'GET', null, adminToken, 'Admin'));
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

  // Group results by token type
  const adminResults = results.filter(r => r.tokenType === 'Admin');
  const subadminResults = results.filter(r => r.tokenType === 'Subadmin');
  
  console.log(`\n👑 Admin Token Tests: ${adminResults.filter(r => r.success).length}/${adminResults.length} passed`);
  console.log(`👥 Subadmin Token Tests: ${subadminResults.filter(r => r.success).length}/${subadminResults.length} passed`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.name} (${r.tokenType}): ${r.status} - ${r.error || 'Unknown error'}`);
    });
  }

  if (passed > 0) {
    console.log('\n✅ Working Authenticated APIs:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   ${r.name} (${r.tokenType}): ${r.status}`);
    });
  }

  console.log('\n🎯 Key Findings:');
  const workingAPIs = results.filter(r => r.success).map(r => r.name);
  const failedAPIs = results.filter(r => !r.success).map(r => r.name);
  
  console.log(`\n✅ Working APIs (${workingAPIs.length}):`);
  workingAPIs.forEach(api => console.log(`   - ${api}`));
  
  console.log(`\n❌ Failed APIs (${failedAPIs.length}):`);
  failedAPIs.forEach(api => console.log(`   - ${api}`));
  
  console.log('\n🔑 Token Information:');
  if (adminToken) {
    console.log(`   Admin Token: ${adminToken.substring(0, 50)}...`);
  }
  if (subadminToken) {
    console.log(`   Subadmin Token: ${subadminToken.substring(0, 50)}...`);
  }
}

runAuthenticatedTests();
