const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

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
  
  const testImagePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(testImagePath, testImageBuffer);
  return testImagePath;
}

async function createTestVideoFile() {
  // Create a simple test video file (minimal MP4 header)
  const testVideoBuffer = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
    0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
  ]);
  
  const testVideoPath = path.join(__dirname, 'test-video.mp4');
  fs.writeFileSync(testVideoPath, testVideoBuffer);
  return testVideoPath;
}

async function testUploadEndpoint(name, url, formData, token) {
  try {
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    const data = await response.json().catch(() => ({}));
    const status = response.status;

    if (response.ok) {
      console.log(`✅ ${name}: ${status} - ${response.statusText}`);
      if (data.image) {
        console.log(`   📄 Image: ${JSON.stringify(data.image, null, 2).substring(0, 200)}...`);
      } else if (data.video) {
        console.log(`   📄 Video: ${JSON.stringify(data.video, null, 2).substring(0, 200)}...`);
      } else {
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
  console.log('📤 Testing Upload Endpoints with Sharp Library Fix...\n');
  
  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Could not get admin token');
    return;
  }
  console.log('✅ Admin token obtained\n');

  const results = [];

  // Create test files
  console.log('🖼️ Creating test files...');
  const testImagePath = await createTestImageFile();
  const testVideoPath = await createTestVideoFile();
  console.log(`✅ Test files created: ${testImagePath}, ${testVideoPath}\n`);

  // Test 1: Original image upload with Sharp processing
  console.log('📋 Test 1: Original Image Upload (with Sharp processing):');
  const imageFormData = new FormData();
  imageFormData.append('image', fs.createReadStream(testImagePath));
  imageFormData.append('title', 'Test Image with Sharp');
  imageFormData.append('description', 'Testing image upload with Sharp processing');
  imageFormData.append('category', 'GENERAL');
  imageFormData.append('tags', 'test,sharp,processing');
  
  results.push(await testUploadEndpoint('Original Image Upload', `${BASE_URL}/api/content/images/upload`, imageFormData, adminToken));
  console.log('');

  // Test 2: Simple image upload without processing
  console.log('📋 Test 2: Simple Image Upload (without processing):');
  const simpleImageFormData = new FormData();
  simpleImageFormData.append('image', fs.createReadStream(testImagePath));
  simpleImageFormData.append('title', 'Test Image Simple');
  simpleImageFormData.append('description', 'Testing simple image upload');
  simpleImageFormData.append('category', 'GENERAL');
  simpleImageFormData.append('tags', 'test,simple,upload');
  
  results.push(await testUploadEndpoint('Simple Image Upload', `${BASE_URL}/api/content/images/upload-simple`, simpleImageFormData, adminToken));
  console.log('');

  // Test 3: Original video upload
  console.log('📋 Test 3: Original Video Upload:');
  const videoFormData = new FormData();
  videoFormData.append('video', fs.createReadStream(testVideoPath));
  videoFormData.append('title', 'Test Video Original');
  videoFormData.append('description', 'Testing original video upload');
  videoFormData.append('category', 'GENERAL');
  videoFormData.append('tags', 'test,video,original');
  videoFormData.append('duration', '30');
  
  results.push(await testUploadEndpoint('Original Video Upload', `${BASE_URL}/api/content/videos/upload`, videoFormData, adminToken));
  console.log('');

  // Test 4: Simple video upload
  console.log('📋 Test 4: Simple Video Upload:');
  const simpleVideoFormData = new FormData();
  simpleVideoFormData.append('video', fs.createReadStream(testVideoPath));
  simpleVideoFormData.append('title', 'Test Video Simple');
  simpleVideoFormData.append('description', 'Testing simple video upload');
  simpleVideoFormData.append('category', 'GENERAL');
  simpleVideoFormData.append('tags', 'test,video,simple');
  simpleVideoFormData.append('duration', '30');
  
  results.push(await testUploadEndpoint('Simple Video Upload', `${BASE_URL}/api/content/videos/upload-simple`, simpleVideoFormData, adminToken));
  console.log('');

  // Test 5: Image upload with business category
  console.log('📋 Test 5: Image Upload with Business Category:');
  const businessImageFormData = new FormData();
  businessImageFormData.append('image', fs.createReadStream(testImagePath));
  businessImageFormData.append('title', 'Test Business Image');
  businessImageFormData.append('description', 'Testing business image upload');
  businessImageFormData.append('category', 'BUSINESS');
  businessImageFormData.append('businessCategoryId', 'cmfw47iiy00045yh2pq3lqyu7'); // Restaurant category ID
  businessImageFormData.append('tags', 'business,restaurant,test');
  
  results.push(await testUploadEndpoint('Business Image Upload', `${BASE_URL}/api/content/images/upload-simple`, businessImageFormData, adminToken));
  console.log('');

  // Test 6: Test with missing required fields (should fail)
  console.log('📋 Test 6: Upload with Missing Required Fields (Should Fail):');
  const incompleteFormData = new FormData();
  incompleteFormData.append('image', fs.createReadStream(testImagePath));
  // Missing title and category
  
  results.push(await testUploadEndpoint('Incomplete Upload', `${BASE_URL}/api/content/images/upload-simple`, incompleteFormData, adminToken));
  console.log('');

  // Test 7: Test without authentication (should fail)
  console.log('📋 Test 7: Upload Without Authentication (Should Fail):');
  try {
    const response = await fetch(`${BASE_URL}/api/content/images/upload-simple`, {
      method: 'POST',
      body: imageFormData
    });
    
    if (response.ok) {
      console.log(`❌ Upload Without Auth: ${response.status} - Should have failed`);
      results.push({ name: 'Upload Without Auth', status: response.status, success: false, error: 'Should have failed' });
    } else {
      console.log(`✅ Upload Without Auth: ${response.status} - Correctly rejected`);
      results.push({ name: 'Upload Without Auth', status: response.status, success: true, data: 'Correctly rejected' });
    }
  } catch (error) {
    console.log(`❌ Upload Without Auth: ERROR - ${error.message}`);
    results.push({ name: 'Upload Without Auth', status: 'ERROR', success: false, error: error.message });
  }
  console.log('');

  // Cleanup test files
  console.log('🧹 Cleaning up test files...');
  try {
    fs.unlinkSync(testImagePath);
    fs.unlinkSync(testVideoPath);
    console.log('✅ Test files cleaned up\n');
  } catch (error) {
    console.log('⚠️ Could not clean up all test files\n');
  }

  // Summary
  console.log('📊 Upload Test Summary:');
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

  console.log('\n🎯 Key Findings:');
  const workingAPIs = results.filter(r => r.success).map(r => r.name);
  const failedAPIs = results.filter(r => !r.success).map(r => r.name);
  
  console.log(`\n✅ Working Upload APIs (${workingAPIs.length}):`);
  workingAPIs.forEach(api => console.log(`   - ${api}`));
  
  console.log(`\n❌ Failed Upload APIs (${failedAPIs.length}):`);
  failedAPIs.forEach(api => console.log(`   - ${api}`));

  console.log('\n📋 Upload Endpoints Available:');
  console.log('1. POST /api/content/images/upload - Original image upload with Sharp processing');
  console.log('2. POST /api/content/images/upload-simple - Simple image upload without processing');
  console.log('3. POST /api/content/videos/upload - Original video upload');
  console.log('4. POST /api/content/videos/upload-simple - Simple video upload');
  console.log('\n🔧 Upload Features:');
  console.log('- Fallback image processing (Sharp or simple)');
  console.log('- Business category support');
  console.log('- Tag and metadata support');
  console.log('- Proper validation and error handling');
  console.log('- Authentication required');
  console.log('- Audit logging');
  console.log('\n🔐 All endpoints require staff authentication (Admin/Subadmin)');
}

runUploadTests();

