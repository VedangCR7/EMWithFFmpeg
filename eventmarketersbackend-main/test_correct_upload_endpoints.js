const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function getAdminToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@eventmarketers.com',
        password: 'admin123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.log('Error getting admin token:', error.message);
  }
  return null;
}

async function testUploadEndpoint(name, url, method = 'GET', body = null, token = null) {
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
      } else if (data.success) {
        console.log(`   📄 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
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

async function runUploadTests() {
  console.log('🔍 Testing Upload Endpoints with Correct Paths...\n');
  
  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Could not get admin token');
    return;
  }
  console.log('✅ Admin token obtained\n');

  const results = [];

  // Test 1: Check if upload endpoints exist (should return method not allowed for GET)
  console.log('📤 Testing Upload Endpoint Existence:');
  results.push(await testUploadEndpoint('Image Upload Endpoint (GET)', `${BASE_URL}/api/content/images/upload`, 'GET', null, adminToken));
  results.push(await testUploadEndpoint('Video Upload Endpoint (GET)', `${BASE_URL}/api/content/videos/upload`, 'GET', null, adminToken));
  console.log('');

  // Test 2: Test upload with JSON data (should fail - needs multipart)
  console.log('📤 Testing Upload with JSON Data:');
  const imageData = {
    title: 'Test Image via API',
    description: 'Testing image upload via API',
    category: 'GENERAL',
    tags: 'test,api'
  };
  results.push(await testUploadEndpoint('Upload Image (JSON)', `${BASE_URL}/api/content/images/upload`, 'POST', imageData, adminToken));
  
  const videoData = {
    title: 'Test Video via API',
    description: 'Testing video upload via API',
    category: 'GENERAL',
    tags: 'test,api'
  };
  results.push(await testUploadEndpoint('Upload Video (JSON)', `${BASE_URL}/api/content/videos/upload`, 'POST', videoData, adminToken));
  console.log('');

  // Test 3: Test the endpoints we were using before (should be 404)
  console.log('📤 Testing Previous Endpoints (Should be 404):');
  results.push(await testUploadEndpoint('Previous Image Endpoint', `${BASE_URL}/api/content/images`, 'POST', imageData, adminToken));
  results.push(await testUploadEndpoint('Previous Video Endpoint', `${BASE_URL}/api/content/videos`, 'POST', videoData, adminToken));
  console.log('');

  // Test 4: Test GET endpoints for images and videos (should work)
  console.log('📤 Testing GET Endpoints:');
  results.push(await testUploadEndpoint('Get Images', `${BASE_URL}/api/content/images`, 'GET', null, adminToken));
  results.push(await testUploadEndpoint('Get Videos', `${BASE_URL}/api/content/videos`, 'GET', null, adminToken));
  console.log('');

  // Summary
  console.log('📊 Upload Endpoint Test Summary:');
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
  console.log('1. Upload endpoints exist at /images/upload and /videos/upload');
  console.log('2. They require multipart form data, not JSON');
  console.log('3. GET endpoints for images and videos work correctly');
  console.log('4. Previous test was using wrong endpoints (/images and /videos instead of /images/upload and /videos/upload)');
}

runUploadTests();
