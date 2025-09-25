/**
 * Test Simple Image Upload API (without Sharp processing)
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function testSimpleImageUpload() {
  console.log('🧪 Testing Simple Image Upload (without Sharp processing)...');
  
  // First, get admin token
  const loginResponse = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@eventmarketers.com',
      password: 'admin123'
    })
  });

  const loginData = await loginResponse.json();
  
  if (!loginData.success || !loginData.token) {
    console.log('❌ Failed to get admin token');
    return { success: false, error: 'Failed to authenticate' };
  }

  console.log('✅ Got admin token');

  try {
    // Create a simple test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    formData.append('title', 'Test Simple Upload');
    formData.append('category', 'BUSINESS');
    formData.append('description', 'Test simple image upload without Sharp processing');

    const response = await fetch(`${BASE_URL}/api/content/images/upload-simple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      },
      body: formData
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Simple Upload SUCCESS!');
      console.log(`🖼️ Image ID: ${data.image?.id || 'N/A'}`);
      console.log(`📁 File URL: ${data.image?.url || 'N/A'}`);
      console.log(`📝 Title: ${data.image?.title || 'N/A'}`);
      console.log(`📂 Category: ${data.image?.category || 'N/A'}`);
      return { success: true, data };
    } else {
      console.log('❌ Simple Upload FAILED');
      console.log(`❌ Error: ${data.error || data.message || 'Unknown error'}`);
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Simple Upload ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function runSimpleUploadTest() {
  console.log('🚀 Testing Simple Image Upload API');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('=' .repeat(60));

  const result = await testSimpleImageUpload();

  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Simple Upload: ${result.success ? 'PASSED' : 'FAILED'}`);
  
  if (result.success) {
    console.log('\n🎉 SIMPLE IMAGE UPLOAD IS WORKING!');
    console.log('💡 The issue is likely with Sharp image processing in the main upload endpoint.');
    console.log('💡 Web frontend can use the simple upload endpoint for now.');
  } else {
    console.log('\n❌ Simple upload is also failing. Check server configuration.');
  }

  return result;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSimpleUploadTest().catch(console.error);
}

module.exports = { runSimpleUploadTest };
