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

async function testAnalyticsEndpoint(name, url, token) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json().catch(() => ({}));
    const status = response.status;

    if (response.ok) {
      console.log(`✅ ${name}: ${status} - ${response.statusText}`);
      if (data.analytics) {
        console.log(`   📊 Analytics data received`);
        if (data.analytics.totalUsers) {
          console.log(`   👥 Total Users: ${data.analytics.totalUsers.total || 'N/A'}`);
        }
        if (data.analytics.totalContent) {
          console.log(`   📄 Total Content: ${data.analytics.totalContent.total || 'N/A'}`);
        }
        if (data.analytics.totalDownloads) {
          console.log(`   📥 Total Downloads: ${data.analytics.totalDownloads.total || 'N/A'}`);
        }
        if (data.analytics.overview) {
          console.log(`   📈 Overview: ${JSON.stringify(data.analytics.overview, null, 2).substring(0, 200)}...`);
        }
      } else if (data.dashboard) {
        console.log(`   📊 Dashboard data received`);
        console.log(`   📈 Overview: ${JSON.stringify(data.dashboard.overview, null, 2).substring(0, 200)}...`);
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

async function runAnalyticsTests() {
  console.log('📊 Testing Analytics Endpoints...\n');
  
  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Could not get admin token');
    return;
  }
  console.log('✅ Admin token obtained\n');

  const results = [];

  // Test 1: User Analytics
  console.log('📋 Test 1: User Analytics:');
  results.push(await testAnalyticsEndpoint('User Analytics', `${BASE_URL}/api/analytics/users`, adminToken));
  console.log('');

  // Test 2: Content Analytics
  console.log('📋 Test 2: Content Analytics:');
  results.push(await testAnalyticsEndpoint('Content Analytics', `${BASE_URL}/api/analytics/content`, adminToken));
  console.log('');

  // Test 3: Download Analytics
  console.log('📋 Test 3: Download Analytics:');
  results.push(await testAnalyticsEndpoint('Download Analytics', `${BASE_URL}/api/analytics/downloads`, adminToken));
  console.log('');

  // Test 4: Dashboard Analytics
  console.log('📋 Test 4: Dashboard Analytics:');
  results.push(await testAnalyticsEndpoint('Dashboard Analytics', `${BASE_URL}/api/analytics/dashboard`, adminToken));
  console.log('');

  // Test 5: Test without authentication (should fail)
  console.log('📋 Test 5: Analytics Without Authentication (Should Fail):');
  try {
    const response = await fetch(`${BASE_URL}/api/analytics/users`, {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log(`❌ Analytics Without Auth: ${response.status} - Should have failed`);
      results.push({ name: 'Analytics Without Auth', status: response.status, success: false, error: 'Should have failed' });
    } else {
      console.log(`✅ Analytics Without Auth: ${response.status} - Correctly rejected`);
      results.push({ name: 'Analytics Without Auth', status: response.status, success: true, data: 'Correctly rejected' });
    }
  } catch (error) {
    console.log(`❌ Analytics Without Auth: ERROR - ${error.message}`);
    results.push({ name: 'Analytics Without Auth', status: 'ERROR', success: false, error: error.message });
  }
  console.log('');

  // Summary
  console.log('📊 Analytics Test Summary:');
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
  
  console.log(`\n✅ Working Analytics APIs (${workingAPIs.length}):`);
  workingAPIs.forEach(api => console.log(`   - ${api}`));
  
  console.log(`\n❌ Failed Analytics APIs (${failedAPIs.length}):`);
  failedAPIs.forEach(api => console.log(`   - ${api}`));

  console.log('\n📋 Analytics Endpoints Implemented:');
  console.log('1. GET /api/analytics/users - User analytics and conversion rates');
  console.log('2. GET /api/analytics/content - Content analytics and approval status');
  console.log('3. GET /api/analytics/downloads - Download analytics and trends');
  console.log('4. GET /api/analytics/dashboard - Comprehensive dashboard analytics');
  console.log('\n🔐 All endpoints require admin authentication');
}

runAnalyticsTests();
