/**
 * Diagnose Web Frontend Image Upload Issue
 * This script will help identify what's causing the 400 error
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function diagnoseIssue() {
  console.log('🔍 Diagnosing Web Frontend Image Upload Issue');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('=' .repeat(60));

  // Test 1: Check if endpoint exists
  console.log('\n🧪 Test 1: Check if endpoint exists (without auth)');
  try {
    const response = await fetch(`${BASE_URL}/api/content/images/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log(`📊 Status: ${response.status}`);
    const data = await response.json();
    console.log(`📝 Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists and requires authentication');
    } else {
      console.log('⚠️ Unexpected response from endpoint');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Check authentication endpoint
  console.log('\n🧪 Test 2: Check admin authentication');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@eventmarketers.com',
        password: 'admin123'
      })
    });
    
    console.log(`📊 Status: ${response.status}`);
    const data = await response.json();
    console.log(`📝 Response:`, JSON.stringify(data, null, 2));
    
    if (data.success && data.token) {
      console.log('✅ Admin authentication working');
      global.testToken = data.token;
    } else {
      console.log('❌ Admin authentication failed');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Test with invalid token
  console.log('\n🧪 Test 3: Test with invalid token');
  try {
    const response = await fetch(`${BASE_URL}/api/content/images/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({})
    });
    
    console.log(`📊 Status: ${response.status}`);
    const data = await response.json();
    console.log(`📝 Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Invalid token properly rejected');
    } else {
      console.log('⚠️ Unexpected response for invalid token');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Test with valid token but no data
  console.log('\n🧪 Test 4: Test with valid token but no form data');
  if (global.testToken) {
    try {
      const response = await fetch(`${BASE_URL}/api/content/images/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${global.testToken}`
        },
        body: JSON.stringify({})
      });
      
      console.log(`📊 Status: ${response.status}`);
      const data = await response.json();
      console.log(`📝 Response:`, JSON.stringify(data, null, 2));
      
      if (response.status === 400) {
        console.log('✅ Valid token accepted, but validation failed (expected)');
        if (data.details) {
          console.log('📋 Validation errors:', data.details);
        }
      } else {
        console.log('⚠️ Unexpected response');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 5: Check CORS headers
  console.log('\n🧪 Test 5: Check CORS headers');
  try {
    const response = await fetch(`${BASE_URL}/api/content/images/upload`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 CORS Headers:`);
    console.log(`  - Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`  - Access-Control-Allow-Methods: ${response.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`  - Access-Control-Allow-Headers: ${response.headers.get('Access-Control-Allow-Headers')}`);
    
    if (response.status === 200) {
      console.log('✅ CORS preflight successful');
    } else {
      console.log('⚠️ CORS preflight failed');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 DIAGNOSIS SUMMARY');
  console.log('=' .repeat(60));
  console.log('💡 Based on the tests above, check:');
  console.log('1. Is the web frontend sending the Authorization header?');
  console.log('2. Is the JWT token valid and not expired?');
  console.log('3. Is the Content-Type set to multipart/form-data?');
  console.log('4. Are all required fields (image, title, category) being sent?');
  console.log('5. Is the form data being constructed properly?');
  console.log('\n🔧 Common web frontend issues:');
  console.log('- Missing Authorization header');
  console.log('- Wrong Content-Type (should be multipart/form-data, not application/json)');
  console.log('- Invalid or expired JWT token');
  console.log('- Missing required form fields');
  console.log('- FormData not being sent properly');
}

// Run diagnosis if this file is executed directly
if (require.main === module) {
  diagnoseIssue().catch(console.error);
}

module.exports = { diagnoseIssue };
