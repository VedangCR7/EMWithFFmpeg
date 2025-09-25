/**
 * Test Admin Login for Web Frontend
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login for Web Frontend...');
  
  const loginData = {
    email: "admin@eventmarketers.com",
    password: "admin123"
  };

  try {
    const response = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Admin Login SUCCESS!');
      console.log(`👤 User ID: ${data.user?.id || 'N/A'}`);
      console.log(`📧 Email: ${data.user?.email || 'N/A'}`);
      console.log(`👑 Role: ${data.user?.role || 'N/A'}`);
      console.log(`🔑 Token: ${data.token ? 'Generated' : 'Not Generated'}`);
      console.log(`⏰ Expires In: ${data.expiresIn || 'N/A'}`);
      
      // Store token for further testing
      global.adminToken = data.token;
      global.adminUser = data.user;
      
      return { success: true, data };
    } else {
      console.log('❌ Admin Login FAILED!');
      console.log(`❌ Error: ${data.error || data.message || 'Unknown error'}`);
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Admin Login ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function testAdminSubadmins() {
  console.log('\n🧪 Testing Admin Subadmins Access...');
  
  if (!global.adminToken) {
    console.log('❌ No admin token available');
    return { success: false, error: 'No admin token available' };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/admin/subadmins`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${global.adminToken}`
      }
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Admin Subadmins Access SUCCESS!');
      console.log(`👥 Subadmins Count: ${data.subadmins?.length || 0}`);
      console.log(`📊 Total: ${data.total || 'N/A'}`);
      
      return { success: true, data };
    } else {
      console.log('❌ Admin Subadmins Access FAILED!');
      console.log(`❌ Error: ${data.error || data.message || 'Unknown error'}`);
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Admin Subadmins Access ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function testAdminBusinessCategories() {
  console.log('\n🧪 Testing Admin Business Categories Access...');
  
  if (!global.adminToken) {
    console.log('❌ No admin token available');
    return { success: false, error: 'No admin token available' };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/admin/business-categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${global.adminToken}`
      }
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Admin Business Categories Access SUCCESS!');
      console.log(`📊 Categories Count: ${data.categories?.length || 0}`);
      console.log(`📊 Total: ${data.total || 'N/A'}`);
      
      return { success: true, data };
    } else {
      console.log('❌ Admin Business Categories Access FAILED!');
      console.log(`❌ Error: ${data.error || data.message || 'Unknown error'}`);
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Admin Business Categories Access ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function runAdminTests() {
  console.log('🚀 Testing Admin Login for Web Frontend');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`📧 Email: admin@eventmarketers.com`);
  console.log(`🔑 Password: admin123`);
  console.log('=' .repeat(60));

  const results = {
    login: await testAdminLogin(),
    subadmins: await testAdminSubadmins(),
    businessCategories: await testAdminBusinessCategories()
  };

  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Login: ${results.login.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Subadmins: ${results.subadmins.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Business Categories: ${results.businessCategories.success ? 'PASSED' : 'FAILED'}`);
  
  const passed = Object.values(results).filter(r => r.success).length;
  const total = Object.keys(results).length;
  
  console.log(`🎯 Success Rate: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
  
  if (results.login.success) {
    console.log('\n🎉 ADMIN LOGIN IS WORKING! Web frontend can authenticate successfully!');
  } else {
    console.log('\n⚠️ Admin login failed. Check the credentials or admin user setup.');
  }

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAdminTests().catch(console.error);
}

module.exports = { runAdminTests };
