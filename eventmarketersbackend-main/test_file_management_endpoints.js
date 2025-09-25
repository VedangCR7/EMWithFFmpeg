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

async function testFileManagementEndpoint(name, url, method = 'GET', body = null, token) {
  try {
    const headers = {
      'Authorization': `Bearer ${token}`
    };

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
      if (data.status) {
        console.log(`   📊 Status: ${JSON.stringify(data.status, null, 2).substring(0, 200)}...`);
      } else if (data.fileTypes) {
        console.log(`   📄 File Types: ${JSON.stringify(data.fileTypes, null, 2).substring(0, 200)}...`);
      } else if (data.cleanup) {
        console.log(`   🧹 Cleanup: ${JSON.stringify(data.cleanup, null, 2).substring(0, 200)}...`);
      } else if (data.stats) {
        console.log(`   📈 Stats: ${JSON.stringify(data.stats, null, 2).substring(0, 200)}...`);
      } else if (data.setup) {
        console.log(`   ⚙️ Setup: ${JSON.stringify(data.setup, null, 2).substring(0, 200)}...`);
      } else if (data.file) {
        console.log(`   📁 File: ${JSON.stringify(data.file, null, 2).substring(0, 200)}...`);
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

async function runFileManagementTests() {
  console.log('📁 Testing File Management Endpoints...\n');
  
  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Could not get admin token');
    return;
  }
  console.log('✅ Admin token obtained\n');

  const results = [];

  // Test 1: Get upload directory status
  console.log('📋 Test 1: Get Upload Directory Status:');
  results.push(await testFileManagementEndpoint('Upload Directory Status', `${BASE_URL}/api/file-management/status`, 'GET', null, adminToken));
  console.log('');

  // Test 2: Get supported file types
  console.log('📋 Test 2: Get Supported File Types:');
  results.push(await testFileManagementEndpoint('Supported File Types', `${BASE_URL}/api/file-management/types`, 'GET', null, adminToken));
  console.log('');

  // Test 3: Get file statistics
  console.log('📋 Test 3: Get File Statistics:');
  results.push(await testFileManagementEndpoint('File Statistics', `${BASE_URL}/api/file-management/stats`, 'GET', null, adminToken));
  console.log('');

  // Test 4: Setup upload directories
  console.log('📋 Test 4: Setup Upload Directories:');
  results.push(await testFileManagementEndpoint('Setup Directories', `${BASE_URL}/api/file-management/setup`, 'POST', null, adminToken));
  console.log('');

  // Test 5: Clean up orphaned files
  console.log('📋 Test 5: Clean Up Orphaned Files:');
  results.push(await testFileManagementEndpoint('Cleanup Files', `${BASE_URL}/api/file-management/cleanup`, 'POST', null, adminToken));
  console.log('');

  // Test 6: Get file information (test with a common filename)
  console.log('📋 Test 6: Get File Information:');
  results.push(await testFileManagementEndpoint('File Information', `${BASE_URL}/api/file-management/info/test-file.jpg`, 'GET', null, adminToken));
  console.log('');

  // Test 7: Test without authentication (should fail)
  console.log('📋 Test 7: File Management Without Authentication (Should Fail):');
  try {
    const response = await fetch(`${BASE_URL}/api/file-management/status`, {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log(`❌ File Management Without Auth: ${response.status} - Should have failed`);
      results.push({ name: 'File Management Without Auth', status: response.status, success: false, error: 'Should have failed' });
    } else {
      console.log(`✅ File Management Without Auth: ${response.status} - Correctly rejected`);
      results.push({ name: 'File Management Without Auth', status: response.status, success: true, data: 'Correctly rejected' });
    }
  } catch (error) {
    console.log(`❌ File Management Without Auth: ERROR - ${error.message}`);
    results.push({ name: 'File Management Without Auth', status: 'ERROR', success: false, error: error.message });
  }
  console.log('');

  // Test 8: Test with subadmin token (should work)
  console.log('📋 Test 8: File Management with Subadmin Token:');
  try {
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
      const subadminToken = subadminData.token;
      
      results.push(await testFileManagementEndpoint('File Management (Subadmin)', `${BASE_URL}/api/file-management/status`, 'GET', null, subadminToken));
    } else {
      console.log('❌ Could not get subadmin token');
      results.push({ name: 'File Management (Subadmin)', status: 'ERROR', success: false, error: 'Could not get subadmin token' });
    }
  } catch (error) {
    console.log(`❌ Subadmin Test: ERROR - ${error.message}`);
    results.push({ name: 'File Management (Subadmin)', status: 'ERROR', success: false, error: error.message });
  }
  console.log('');

  // Summary
  console.log('📊 File Management Test Summary:');
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
  const workingAPIs = results.filter(r => r.success).map(r => r.name);
  const failedAPIs = results.filter(r => !r.success).map(r => r.name);
  
  console.log(`\n✅ Working File Management APIs (${workingAPIs.length}):`);
  workingAPIs.forEach(api => console.log(`   - ${api}`));
  
  console.log(`\n❌ Failed File Management APIs (${failedAPIs.length}):`);
  failedAPIs.forEach(api => console.log(`   - ${api}`));

  console.log('\n📋 File Management Endpoints Implemented:');
  console.log('1. GET /api/file-management/status - Get upload directory status and health');
  console.log('2. GET /api/file-management/types - Get supported file types and limits');
  console.log('3. GET /api/file-management/stats - Get comprehensive file statistics');
  console.log('4. POST /api/file-management/setup - Create upload directories');
  console.log('5. POST /api/file-management/cleanup - Clean up orphaned files');
  console.log('6. GET /api/file-management/info/:filename - Get specific file information');
  console.log('\n🔧 File Management Features:');
  console.log('- Upload directory status checking');
  console.log('- File type validation and limits');
  console.log('- Directory size and file count tracking');
  console.log('- Orphaned file cleanup');
  console.log('- Database vs disk file comparison');
  console.log('- File information retrieval');
  console.log('- Directory setup and management');
  console.log('\n🔐 All endpoints require staff authentication (Admin/Subadmin)');
}

runFileManagementTests();
