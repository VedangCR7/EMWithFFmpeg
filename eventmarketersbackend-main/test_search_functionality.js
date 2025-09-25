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

async function testSearchEndpoint(name, url, token) {
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
      if (data.data) {
        if (data.data.images) {
          console.log(`   📊 Found ${data.data.images.length} images`);
        }
        if (data.data.videos) {
          console.log(`   📊 Found ${data.data.videos.length} videos`);
        }
        if (data.data.content) {
          console.log(`   📊 Found ${data.data.content.length} content items`);
        }
        if (data.data.pagination) {
          console.log(`   📄 Total: ${data.data.pagination.totalCount}, Page: ${data.data.pagination.currentPage}/${data.data.pagination.totalPages}`);
        }
        if (data.suggestions) {
          console.log(`   💡 Found ${data.suggestions.length} suggestions`);
        }
        if (data.stats) {
          console.log(`   📈 Stats: ${JSON.stringify(data.stats, null, 2).substring(0, 200)}...`);
        }
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

async function runSearchTests() {
  console.log('🔍 Testing Search Functionality...\n');
  
  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Could not get admin token');
    return;
  }
  console.log('✅ Admin token obtained\n');

  const results = [];

  // Test 1: Search Images - Basic search
  console.log('📋 Test 1: Search Images - Basic Search:');
  results.push(await testSearchEndpoint('Search Images (Basic)', `${BASE_URL}/api/search/images?q=test`, adminToken));
  console.log('');

  // Test 2: Search Images - With filters
  console.log('📋 Test 2: Search Images - With Filters:');
  results.push(await testSearchEndpoint('Search Images (Filtered)', `${BASE_URL}/api/search/images?category=GENERAL&approvalStatus=APPROVED&sortBy=createdAt&sortOrder=desc`, adminToken));
  console.log('');

  // Test 3: Search Videos - Basic search
  console.log('📋 Test 3: Search Videos - Basic Search:');
  results.push(await testSearchEndpoint('Search Videos (Basic)', `${BASE_URL}/api/search/videos?q=video`, adminToken));
  console.log('');

  // Test 4: Search Videos - With filters
  console.log('📋 Test 4: Search Videos - With Filters:');
  results.push(await testSearchEndpoint('Search Videos (Filtered)', `${BASE_URL}/api/search/videos?category=BUSINESS&uploaderType=ADMIN&sortBy=downloads&sortOrder=desc`, adminToken));
  console.log('');

  // Test 5: Search All Content
  console.log('📋 Test 5: Search All Content:');
  results.push(await testSearchEndpoint('Search All Content', `${BASE_URL}/api/search/content?q=test&contentType=all&sortBy=title&sortOrder=asc`, adminToken));
  console.log('');

  // Test 6: Search with pagination
  console.log('📋 Test 6: Search with Pagination:');
  results.push(await testSearchEndpoint('Search with Pagination', `${BASE_URL}/api/search/images?page=1&limit=5`, adminToken));
  console.log('');

  // Test 7: Search suggestions
  console.log('📋 Test 7: Search Suggestions:');
  results.push(await testSearchEndpoint('Search Suggestions', `${BASE_URL}/api/search/suggestions?q=test`, adminToken));
  console.log('');

  // Test 8: Search statistics
  console.log('📋 Test 8: Search Statistics:');
  results.push(await testSearchEndpoint('Search Statistics', `${BASE_URL}/api/search/stats`, adminToken));
  console.log('');

  // Test 9: Search with tags
  console.log('📋 Test 9: Search with Tags:');
  results.push(await testSearchEndpoint('Search with Tags', `${BASE_URL}/api/search/content?tags=test,business&contentType=all`, adminToken));
  console.log('');

  // Test 10: Search without authentication (should fail)
  console.log('📋 Test 10: Search Without Authentication (Should Fail):');
  try {
    const response = await fetch(`${BASE_URL}/api/search/images?q=test`, {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log(`❌ Search Without Auth: ${response.status} - Should have failed`);
      results.push({ name: 'Search Without Auth', status: response.status, success: false, error: 'Should have failed' });
    } else {
      console.log(`✅ Search Without Auth: ${response.status} - Correctly rejected`);
      results.push({ name: 'Search Without Auth', status: response.status, success: true, data: 'Correctly rejected' });
    }
  } catch (error) {
    console.log(`❌ Search Without Auth: ERROR - ${error.message}`);
    results.push({ name: 'Search Without Auth', status: 'ERROR', success: false, error: error.message });
  }
  console.log('');

  // Test 11: Advanced search with multiple filters
  console.log('📋 Test 11: Advanced Search with Multiple Filters:');
  results.push(await testSearchEndpoint('Advanced Search', `${BASE_URL}/api/search/content?q=business&category=BUSINESS&approvalStatus=APPROVED&uploaderType=ADMIN&sortBy=downloads&sortOrder=desc&page=1&limit=10`, adminToken));
  console.log('');

  // Test 12: Search with business category
  console.log('📋 Test 12: Search with Business Category:');
  results.push(await testSearchEndpoint('Search with Business Category', `${BASE_URL}/api/search/images?businessCategoryId=cmfw47iiy00045yh2pq3lqyu7`, adminToken));
  console.log('');

  // Summary
  console.log('📊 Search Functionality Test Summary:');
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
  
  console.log(`\n✅ Working Search APIs (${workingAPIs.length}):`);
  workingAPIs.forEach(api => console.log(`   - ${api}`));
  
  console.log(`\n❌ Failed Search APIs (${failedAPIs.length}):`);
  failedAPIs.forEach(api => console.log(`   - ${api}`));

  console.log('\n📋 Search Endpoints Implemented:');
  console.log('1. GET /api/search/images - Search images with filters and pagination');
  console.log('2. GET /api/search/videos - Search videos with filters and pagination');
  console.log('3. GET /api/search/content - Search all content with advanced filtering');
  console.log('4. GET /api/search/suggestions - Get search suggestions');
  console.log('5. GET /api/search/stats - Get search statistics');
  console.log('\n🔍 Search Features:');
  console.log('- Text search in title, description, and tags');
  console.log('- Category filtering (BUSINESS, FESTIVAL, GENERAL)');
  console.log('- Business category filtering');
  console.log('- Tag-based filtering');
  console.log('- Approval status filtering');
  console.log('- Uploader type filtering');
  console.log('- Sorting by multiple fields');
  console.log('- Pagination support');
  console.log('- Search suggestions');
  console.log('- Search statistics');
  console.log('\n🔐 All endpoints require staff authentication (Admin/Subadmin)');
}

runSearchTests();
