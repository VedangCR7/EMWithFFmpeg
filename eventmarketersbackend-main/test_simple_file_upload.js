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

async function createSimpleTestFile() {
  // Create a very simple test file
  const testContent = 'This is a test file for upload testing';
  const testFilePath = path.join(__dirname, 'test-simple.txt');
  fs.writeFileSync(testFilePath, testContent);
  return testFilePath;
}

async function testSimpleUpload(name, url, formData, token) {
  try {
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    console.log(`🔍 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    console.log(`   Headers: ${JSON.stringify(headers)}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response: ${responseText.substring(0, 500)}...`);
    
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    if (response.ok) {
      console.log(`✅ ${name}: SUCCESS`);
      return { name, status: response.status, success: true, data };
    } else {
      console.log(`❌ ${name}: FAILED`);
      return { name, status: response.status, success: false, error: data.error || responseText };
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return { name, status: 'ERROR', success: false, error: error.message };
  }
}

async function runSimpleUploadTest() {
  console.log('📤 Testing Simple File Upload...\n');
  
  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Could not get admin token');
    return;
  }
  console.log('✅ Admin token obtained\n');

  // Create simple test file
  const testFilePath = await createSimpleTestFile();
  console.log(`✅ Test file created: ${testFilePath}\n`);

  // Test 1: Try to upload a simple text file as image (should fail with validation)
  console.log('📤 Test 1: Upload Text File as Image (Should Fail):');
  const formData1 = new FormData();
  formData1.append('image', fs.createReadStream(testFilePath));
  formData1.append('title', 'Test Upload');
  formData1.append('category', 'GENERAL');
  
  await testSimpleUpload('Upload Text as Image', `${BASE_URL}/api/content/images/upload`, formData1, adminToken);
  console.log('');

  // Test 2: Try to upload without file (should fail with validation)
  console.log('📤 Test 2: Upload Without File (Should Fail):');
  const formData2 = new FormData();
  formData2.append('title', 'Test Upload No File');
  formData2.append('category', 'GENERAL');
  
  await testSimpleUpload('Upload No File', `${BASE_URL}/api/content/images/upload`, formData2, adminToken);
  console.log('');

  // Test 3: Try to upload with missing required fields (should fail with validation)
  console.log('📤 Test 3: Upload with Missing Fields (Should Fail):');
  const formData3 = new FormData();
  formData3.append('image', fs.createReadStream(testFilePath));
  // Missing title and category
  
  await testSimpleUpload('Upload Missing Fields', `${BASE_URL}/api/content/images/upload`, formData3, adminToken);
  console.log('');

  // Test 4: Check if upload directories exist
  console.log('📁 Test 4: Check Upload Directory Status:');
  try {
    const dirResponse = await fetch(`${BASE_URL}/api/upload/status`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`   Directory Status: ${dirResponse.status} ${dirResponse.statusText}`);
    const dirText = await dirResponse.text();
    console.log(`   Response: ${dirText}`);
  } catch (error) {
    console.log(`   Directory Check Error: ${error.message}`);
  }
  console.log('');

  // Test 5: Check server health
  console.log('🏥 Test 5: Check Server Health:');
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`);
    console.log(`   Health Status: ${healthResponse.status} ${healthResponse.statusText}`);
    const healthText = await healthResponse.text();
    console.log(`   Response: ${healthText}`);
  } catch (error) {
    console.log(`   Health Check Error: ${error.message}`);
  }
  console.log('');

  // Cleanup
  try {
    fs.unlinkSync(testFilePath);
    console.log('✅ Test file cleaned up\n');
  } catch (error) {
    console.log('⚠️ Could not clean up test file\n');
  }

  console.log('🎯 Analysis:');
  console.log('1. If all tests fail with 500 errors, there might be a server-side issue');
  console.log('2. If validation tests fail with 400 errors, the validation is working');
  console.log('3. Check if Sharp library is properly installed on the server');
  console.log('4. Check if upload directories have proper permissions');
  console.log('5. Check server logs for detailed error information');
}

runSimpleUploadTest();
