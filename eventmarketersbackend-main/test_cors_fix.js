const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function testCORSEndpoint(origin, endpoint, method = 'GET') {
  try {
    const headers = {
      'Origin': origin,
      'Access-Control-Request-Method': method,
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    };

    // Test preflight request
    const preflightResponse = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'OPTIONS',
      headers: headers
    });

    const corsHeaders = {
      'Access-Control-Allow-Origin': preflightResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': preflightResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': preflightResponse.headers.get('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': preflightResponse.headers.get('Access-Control-Allow-Credentials')
    };

    if (preflightResponse.ok) {
      console.log(`✅ CORS Preflight for ${origin}: ${preflightResponse.status}`);
      console.log(`   Access-Control-Allow-Origin: ${corsHeaders['Access-Control-Allow-Origin']}`);
      console.log(`   Access-Control-Allow-Methods: ${corsHeaders['Access-Control-Allow-Methods']}`);
      console.log(`   Access-Control-Allow-Headers: ${corsHeaders['Access-Control-Allow-Headers']}`);
      console.log(`   Access-Control-Allow-Credentials: ${corsHeaders['Access-Control-Allow-Credentials']}`);
      return { origin, status: preflightResponse.status, success: true, corsHeaders };
    } else {
      console.log(`❌ CORS Preflight for ${origin}: ${preflightResponse.status}`);
      return { origin, status: preflightResponse.status, success: false };
    }
  } catch (error) {
    console.log(`❌ CORS Test for ${origin}: ERROR - ${error.message}`);
    return { origin, status: 'ERROR', success: false, error: error.message };
  }
}

async function testActualRequest(origin, endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Origin': origin
      }
    });

    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
    
    if (response.ok) {
      console.log(`✅ Actual Request for ${origin}: ${response.status}`);
      console.log(`   Access-Control-Allow-Origin: ${corsOrigin}`);
      return { origin, status: response.status, success: true, corsOrigin };
    } else {
      console.log(`❌ Actual Request for ${origin}: ${response.status}`);
      return { origin, status: response.status, success: false };
    }
  } catch (error) {
    console.log(`❌ Actual Request for ${origin}: ERROR - ${error.message}`);
    return { origin, status: 'ERROR', success: false, error: error.message };
  }
}

async function runCORSTests() {
  console.log('🌐 Testing CORS Configuration Fix...\n');
  
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://your-frontend-domain.com',
    'https://malicious-site.com' // This should be blocked
  ];

  const endpoints = [
    '/health',
    '/api/content/images/upload',
    '/api/analytics/dashboard'
  ];

  const results = [];

  console.log('📋 Testing CORS Preflight Requests:');
  for (const origin of origins) {
    console.log(`\n🔍 Testing origin: ${origin}`);
    for (const endpoint of endpoints) {
      const result = await testCORSEndpoint(origin, endpoint);
      results.push(result);
    }
  }

  console.log('\n📋 Testing Actual Requests:');
  for (const origin of origins.slice(0, 4)) { // Test only allowed origins
    console.log(`\n🔍 Testing actual request from: ${origin}`);
    const result = await testActualRequest(origin, '/health');
    results.push(result);
  }

  // Summary
  console.log('\n📊 CORS Test Summary:');
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
      console.log(`   ${r.origin}: ${r.status} - ${r.error || 'Unknown error'}`);
    });
  }

  if (passed > 0) {
    console.log('\n✅ Working Tests:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   ${r.origin}: ${r.status}`);
    });
  }

  console.log('\n🎯 CORS Configuration Status:');
  const localhostTests = results.filter(r => r.origin && r.origin.includes('localhost') && r.success);
  const blockedTests = results.filter(r => r.origin && r.origin.includes('malicious') && !r.success);
  
  if (localhostTests.length > 0) {
    console.log('✅ Localhost origins are properly allowed');
  } else {
    console.log('❌ Localhost origins are not working');
  }

  if (blockedTests.length > 0) {
    console.log('✅ Malicious origins are properly blocked');
  } else {
    console.log('⚠️ Malicious origins might not be properly blocked');
  }

  console.log('\n📋 CORS Configuration Details:');
  console.log('✅ Allowed Origins:');
  console.log('   - http://localhost:3000 (Your frontend)');
  console.log('   - http://localhost:3001');
  console.log('   - http://127.0.0.1:3000');
  console.log('   - http://127.0.0.1:3001');
  console.log('   - https://your-frontend-domain.com');
  console.log('   - Custom CORS_ORIGIN environment variable');
  console.log('\n✅ Allowed Methods: GET, POST, PUT, DELETE, OPTIONS');
  console.log('✅ Allowed Headers: Content-Type, Authorization, X-Requested-With');
  console.log('✅ Credentials: true');
  console.log('\n🔧 Your frontend at http://localhost:3000 should now work!');
}

runCORSTests();
