/**
 * Test Web Frontend Image Upload - Simulate exact request from browser
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function testWebFrontendUpload() {
  console.log('🧪 Testing Web Frontend Image Upload (simulating browser request)...');
  
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
    
    // Simulate web frontend request - these are the exact fields the frontend might send
    formData.append('image', testImageBuffer, {
      filename: 'business-image.png',
      contentType: 'image/png'
    });
    formData.append('title', 'My Business Image');
    formData.append('category', 'BUSINESS');
    formData.append('description', 'Business image upload from web frontend');
    // Add optional fields that might be sent
    formData.append('businessCategoryId', '');
    formData.append('tags', '');

    console.log('📤 Sending request with form data...');
    console.log('📝 Form fields:');
    console.log('  - image: [file] business-image.png');
    console.log('  - title: My Business Image');
    console.log('  - category: BUSINESS');
    console.log('  - description: Business image upload from web frontend');
    console.log('  - businessCategoryId: (empty)');
    console.log('  - tags: (empty)');

    const response = await fetch(`${BASE_URL}/api/content/images/upload`, {
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
      console.log('✅ Web Frontend Upload SUCCESS!');
      console.log(`🖼️ Image ID: ${data.image?.id || 'N/A'}`);
      console.log(`📁 File URL: ${data.image?.url || 'N/A'}`);
      return { success: true, data };
    } else {
      console.log('❌ Web Frontend Upload FAILED');
      console.log(`❌ Status: ${response.status}`);
      console.log(`❌ Error: ${data.error || data.message || 'Unknown error'}`);
      if (data.details) {
        console.log(`❌ Validation Details:`, data.details);
      }
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Web Frontend Upload ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function testMinimalUpload() {
  console.log('\n🧪 Testing Minimal Upload (only required fields)...');
  
  // Get admin token
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

  try {
    // Create a simple test image file
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    
    // Only required fields
    formData.append('image', testImageBuffer, {
      filename: 'minimal-test.png',
      contentType: 'image/png'
    });
    formData.append('title', 'Minimal Test');
    formData.append('category', 'BUSINESS');

    console.log('📤 Sending minimal request...');
    console.log('📝 Form fields:');
    console.log('  - image: [file] minimal-test.png');
    console.log('  - title: Minimal Test');
    console.log('  - category: BUSINESS');

    const response = await fetch(`${BASE_URL}/api/content/images/upload`, {
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
      console.log('✅ Minimal Upload SUCCESS!');
      return { success: true, data };
    } else {
      console.log('❌ Minimal Upload FAILED');
      console.log(`❌ Error: ${data.error || data.message || 'Unknown error'}`);
      if (data.details) {
        console.log(`❌ Validation Details:`, data.details);
      }
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Minimal Upload ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function runWebFrontendTests() {
  console.log('🚀 Testing Web Frontend Image Upload');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('=' .repeat(60));

  const results = {
    webFrontend: await testWebFrontendUpload(),
    minimal: await testMinimalUpload()
  };

  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Web Frontend Upload: ${results.webFrontend.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Minimal Upload: ${results.minimal.success ? 'PASSED' : 'FAILED'}`);
  
  if (results.webFrontend.success) {
    console.log('\n🎉 WEB FRONTEND UPLOAD IS WORKING!');
  } else if (results.minimal.success) {
    console.log('\n⚠️ Minimal upload works, but web frontend request has validation issues.');
    console.log('💡 Check the validation details above to see what fields are causing issues.');
  } else {
    console.log('\n❌ Both uploads are failing. Check server configuration.');
  }

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runWebFrontendTests().catch(console.error);
}

module.exports = { runWebFrontendTests };
