const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function getAdminToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@eventmarketers.com',
        password: 'EventMarketers2024!'
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

async function createTestImageFile() {
  // Create a simple test image file (1x1 pixel PNG)
  const testImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
  
  const testImagePath = 'test-image.png';
  fs.writeFileSync(testImagePath, testImageBuffer);
  return testImagePath;
}

async function testUploadEndpoint(endpoint, token, testImagePath) {
  try {
    console.log(`\n🔍 Testing ${endpoint}...`);
    
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    formData.append('title', 'Test Image Debug');
    formData.append('description', 'Testing image upload for debugging');
    formData.append('category', 'GENERAL');
    formData.append('tags', 'test,debug,upload');

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const responseText = await response.text();
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    try {
      const responseData = JSON.parse(responseText);
      console.log(`Response Body:`, JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log(`Response Body (raw):`, responseText);
    }

    if (response.ok) {
      console.log(`✅ ${endpoint} - SUCCESS`);
      return { success: true, status: response.status, data: responseText };
    } else {
      console.log(`❌ ${endpoint} - FAILED`);
      return { success: false, status: response.status, error: responseText };
    }

  } catch (error) {
    console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
    return { success: false, status: 'ERROR', error: error.message };
  }
}

async function debugUploadIssue() {
  console.log('🐛 Debugging Upload Issue...\n');
  
  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Could not get admin token');
    return;
  }
  console.log('✅ Admin token obtained');

  // Create test image
  const testImagePath = await createTestImageFile();
  console.log(`✅ Test image created: ${testImagePath}`);

  const results = [];

  // Test both upload endpoints
  results.push(await testUploadEndpoint('/api/content/images/upload', adminToken, testImagePath));
  results.push(await testUploadEndpoint('/api/content/images/upload-simple', adminToken, testImagePath));

  // Test health check
  console.log('\n🔍 Testing health check...');
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`Health Status: ${healthResponse.status} - ${JSON.stringify(healthData)}`);
  } catch (error) {
    console.log(`Health Check Error: ${error.message}`);
  }

  // Test file management status
  console.log('\n🔍 Testing file management status...');
  try {
    const fmResponse = await fetch(`${BASE_URL}/api/file-management/status`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const fmData = await fmResponse.json();
    console.log(`File Management Status: ${fmResponse.status}`);
    if (fmData.status && fmData.status.health) {
      console.log(`Directory Health: ${fmData.status.health.status}`);
    }
  } catch (error) {
    console.log(`File Management Error: ${error.message}`);
  }

  // Cleanup
  try {
    fs.unlinkSync(testImagePath);
    console.log(`✅ Test image cleaned up`);
  } catch (error) {
    console.log(`⚠️ Could not clean up test image`);
  }

  // Summary
  console.log('\n📊 Debug Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   Status: ${r.status}`);
      console.log(`   Error: ${r.error}`);
    });
  }

  console.log('\n🔧 Recommendations:');
  if (failed > 0) {
    console.log('1. Check server logs for detailed error information');
    console.log('2. Verify file upload directory permissions');
    console.log('3. Check if Sharp library is causing issues');
    console.log('4. Try using the simple upload endpoint instead');
  } else {
    console.log('✅ All upload endpoints are working correctly');
  }
}

debugUploadIssue();
