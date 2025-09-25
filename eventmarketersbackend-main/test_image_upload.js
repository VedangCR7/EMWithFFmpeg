/**
 * Test Image Upload API
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function testImageUploadWithoutAuth() {
  console.log('🧪 Testing Image Upload WITHOUT Authentication...');
  
  try {
    // Create a simple test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    formData.append('title', 'Test Image Upload');
    formData.append('category', 'BUSINESS');
    formData.append('description', 'Test image upload from web frontend');

    const response = await fetch(`${BASE_URL}/api/content/images/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Expected: Authentication required');
      return { success: true, needsAuth: true, data };
    } else if (response.ok) {
      console.log('❌ Unexpected: Upload succeeded without auth');
      return { success: false, needsAuth: false, data };
    } else {
      console.log('❌ Upload failed with other error');
      return { success: false, needsAuth: true, data };
    }
  } catch (error) {
    console.log('❌ Upload ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function testImageUploadWithAuth() {
  console.log('\n🧪 Testing Image Upload WITH Authentication...');
  
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
    formData.append('title', 'Test Image Upload with Auth');
    formData.append('category', 'BUSINESS');
    formData.append('description', 'Test image upload with authentication');

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
      console.log('✅ Upload SUCCESS with authentication!');
      console.log(`🖼️ Image ID: ${data.image?.id || 'N/A'}`);
      console.log(`📁 File URL: ${data.image?.url || 'N/A'}`);
      return { success: true, data };
    } else {
      console.log('❌ Upload FAILED even with authentication');
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Upload ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function runImageUploadTests() {
  console.log('🚀 Testing Image Upload API');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('=' .repeat(60));

  const results = {
    withoutAuth: await testImageUploadWithoutAuth(),
    withAuth: await testImageUploadWithAuth()
  };

  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Without Auth: ${results.withoutAuth.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ With Auth: ${results.withAuth.success ? 'PASSED' : 'FAILED'}`);
  
  if (results.withoutAuth.needsAuth && results.withAuth.success) {
    console.log('\n🎉 IMAGE UPLOAD API IS WORKING! Authentication is required as expected.');
    console.log('💡 Web frontend needs to include Authorization header with JWT token.');
  } else if (!results.withoutAuth.needsAuth) {
    console.log('\n⚠️ Security Issue: Image upload works without authentication!');
  } else if (!results.withAuth.success) {
    console.log('\n❌ Image upload is failing even with authentication. Check server logs.');
  }

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runImageUploadTests().catch(console.error);
}

module.exports = { runImageUploadTests };
