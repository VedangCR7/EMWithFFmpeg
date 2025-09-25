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

async function testFileUpload(name, url, formData, token, tokenType) {
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
      console.log(`✅ ${name} (${tokenType}): ${status} - ${response.statusText}`);
      if (data.success && data.image) {
        console.log(`   📄 Image: ${JSON.stringify(data.image, null, 2).substring(0, 200)}...`);
      } else if (data.success && data.video) {
        console.log(`   📄 Video: ${JSON.stringify(data.video, null, 2).substring(0, 200)}...`);
      } else {
        console.log(`   📄 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      }
      return { name, status, success: true, data, tokenType };
    } else {
      console.log(`❌ ${name} (${tokenType}): ${status} - ${response.statusText}`);
      console.log(`   Error: ${data.error ? JSON.stringify(data.error) : JSON.stringify(data)}`);
      return { name, status, success: false, error: data.error || JSON.stringify(data), tokenType };
    }
  } catch (error) {
    console.log(`❌ ${name} (${tokenType}): ERROR - ${error.message}`);
    return { name, status: 'ERROR', success: false, error: error.message, tokenType };
  }
}

async function runFileUploadTests() {
  console.log('📤 Testing File Upload APIs with Multipart Form Data...\n');
  
  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Could not get admin token');
    return;
  }
  console.log('✅ Admin token obtained\n');

  const results = [];

  // Create test image file
  console.log('🖼️ Creating test image file...');
  const testImagePath = await createTestImageFile();
  console.log(`✅ Test image created: ${testImagePath}\n`);

  // Test 1: Image upload with proper multipart form data
  console.log('📤 Test 1: Image Upload with Multipart Form Data:');
  const imageFormData = new FormData();
  imageFormData.append('image', fs.createReadStream(testImagePath));
  imageFormData.append('title', 'Test Image Upload');
  imageFormData.append('description', 'Testing image upload with multipart form data');
  imageFormData.append('category', 'GENERAL');
  imageFormData.append('tags', 'test,upload,multipart');
  
  results.push(await testFileUpload('Upload Image (Multipart)', `${BASE_URL}/api/content/images/upload`, imageFormData, adminToken, 'Admin'));
  console.log('');

  // Test 2: Image upload with business category
  console.log('📤 Test 2: Image Upload with Business Category:');
  const businessImageFormData = new FormData();
  businessImageFormData.append('image', fs.createReadStream(testImagePath));
  businessImageFormData.append('title', 'Test Business Image');
  businessImageFormData.append('description', 'Testing business image upload');
  businessImageFormData.append('category', 'BUSINESS');
  businessImageFormData.append('businessCategoryId', 'cmfw47iiy00045yh2pq3lqyu7'); // Restaurant category ID
  businessImageFormData.append('tags', 'business,restaurant,test');
  
  results.push(await testFileUpload('Upload Business Image', `${BASE_URL}/api/content/images/upload`, businessImageFormData, adminToken, 'Admin'));
  console.log('');

  // Test 3: Video upload (we'll create a simple test video file)
  console.log('📤 Test 3: Video Upload with Multipart Form Data:');
  
  // Create a simple test video file (minimal MP4 header)
  const testVideoBuffer = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
    0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
  ]);
  
  const testVideoPath = path.join(__dirname, 'test-video.mp4');
  fs.writeFileSync(testVideoPath, testVideoBuffer);
  
  const videoFormData = new FormData();
  videoFormData.append('video', fs.createReadStream(testVideoPath));
  videoFormData.append('title', 'Test Video Upload');
  videoFormData.append('description', 'Testing video upload with multipart form data');
  videoFormData.append('category', 'GENERAL');
  videoFormData.append('tags', 'test,video,upload');
  videoFormData.append('duration', '30');
  
  results.push(await testFileUpload('Upload Video (Multipart)', `${BASE_URL}/api/content/videos/upload`, videoFormData, adminToken, 'Admin'));
  console.log('');

  // Test 4: Test with missing required fields
  console.log('📤 Test 4: Image Upload with Missing Required Fields:');
  const incompleteFormData = new FormData();
  incompleteFormData.append('image', fs.createReadStream(testImagePath));
  // Missing title and category
  
  results.push(await testFileUpload('Upload Image (Incomplete)', `${BASE_URL}/api/content/images/upload`, incompleteFormData, adminToken, 'Admin'));
  console.log('');

  // Test 5: Test with invalid file type
  console.log('📤 Test 5: Upload with Invalid File Type:');
  const textFile = path.join(__dirname, 'test-file.txt');
  fs.writeFileSync(textFile, 'This is a test text file');
  
  const invalidFormData = new FormData();
  invalidFormData.append('image', fs.createReadStream(textFile));
  invalidFormData.append('title', 'Test Invalid File');
  invalidFormData.append('category', 'GENERAL');
  
  results.push(await testFileUpload('Upload Invalid File', `${BASE_URL}/api/content/images/upload`, invalidFormData, adminToken, 'Admin'));
  console.log('');

  // Cleanup test files
  console.log('🧹 Cleaning up test files...');
  try {
    fs.unlinkSync(testImagePath);
    fs.unlinkSync(testVideoPath);
    fs.unlinkSync(textFile);
    console.log('✅ Test files cleaned up\n');
  } catch (error) {
    console.log('⚠️ Could not clean up all test files\n');
  }

  // Summary
  console.log('📊 File Upload Test Summary:');
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
      console.log(`   ${r.name} (${r.tokenType}): ${r.status} - ${r.error || 'Unknown error'}`);
    });
  }

  if (passed > 0) {
    console.log('\n✅ Working Tests:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   ${r.name} (${r.tokenType}): ${r.status}`);
    });
  }

  console.log('\n🎯 Key Findings:');
  const workingAPIs = results.filter(r => r.success).map(r => r.name);
  const failedAPIs = results.filter(r => !r.success).map(r => r.name);
  
  console.log(`\n✅ Working File Upload APIs (${workingAPIs.length}):`);
  workingAPIs.forEach(api => console.log(`   - ${api}`));
  
  console.log(`\n❌ Failed File Upload APIs (${failedAPIs.length}):`);
  failedAPIs.forEach(api => console.log(`   - ${api}`));

  console.log('\n📋 File Upload Requirements:');
  console.log('1. Use multipart/form-data, not application/json');
  console.log('2. Include file in form data with correct field name (image/video)');
  console.log('3. Include required metadata fields (title, category)');
  console.log('4. Use valid file types (images: jpg, png, webp, gif; videos: mp4, mov, avi, mkv)');
  console.log('5. Admin authentication required for uploads');
}

runFileUploadTests();
