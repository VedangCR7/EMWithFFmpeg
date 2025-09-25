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

async function testUploadWithDetailedLogging(endpoint, token, testImagePath) {
  try {
    console.log(`\n🔍 Testing ${endpoint} with detailed logging...`);
    
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    formData.append('title', 'Test Image Debug');
    formData.append('description', 'Testing image upload for debugging');
    formData.append('category', 'GENERAL');
    formData.append('tags', 'test,debug,upload');

    console.log('📤 Sending request...');
    console.log('📁 Form data fields:', formData.getHeaders());

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`📄 Response body:`, responseText);

    if (response.ok) {
      console.log(`✅ ${endpoint} - SUCCESS`);
      return { success: true, status: response.status, data: responseText };
    } else {
      console.log(`❌ ${endpoint} - FAILED`);
      return { success: false, status: response.status, error: responseText };
    }

  } catch (error) {
    console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
    console.log(`❌ Error stack:`, error.stack);
    return { success: false, status: 'ERROR', error: error.message };
  }
}

async function testWithoutFile(endpoint, token) {
  try {
    console.log(`\n🔍 Testing ${endpoint} without file...`);
    
    const formData = new FormData();
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
    console.log(`📊 No file test status: ${response.status}`);
    console.log(`📄 No file test response:`, responseText);

    return { success: response.ok, status: response.status, data: responseText };

  } catch (error) {
    console.log(`❌ No file test error: ${error.message}`);
    return { success: false, status: 'ERROR', error: error.message };
  }
}

async function main() {
  console.log('🧪 Final Upload Test with Detailed Logging...\n');
  
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

  // Test without file first
  results.push(await testWithoutFile('/api/content/images/upload-simple', adminToken));

  // Test with file
  results.push(await testUploadWithDetailedLogging('/api/content/images/upload-simple', adminToken, testImagePath));

  // Cleanup
  try {
    fs.unlinkSync(testImagePath);
    console.log(`✅ Test image cleaned up`);
  } catch (error) {
    console.log(`⚠️ Could not clean up test image`);
  }

  // Summary
  console.log('\n📊 Final Test Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach((r, index) => {
      console.log(`   Test ${index + 1}: Status ${r.status} - ${r.error || r.data}`);
    });
  }

  console.log('\n🎯 Analysis:');
  if (successful > 0) {
    console.log('✅ Upload functionality is working!');
    console.log('🔧 The issue might be in your frontend request format');
    console.log('📋 Check that your frontend is sending:');
    console.log('   - Correct Content-Type header (multipart/form-data)');
    console.log('   - Proper file field name ("image")');
    console.log('   - Valid authentication token');
    console.log('   - Required form fields (title, category)');
  } else {
    console.log('❌ Upload functionality is not working');
    console.log('🔧 The issue is on the server side');
    console.log('📋 Check server logs for detailed error information');
  }
}

main();
