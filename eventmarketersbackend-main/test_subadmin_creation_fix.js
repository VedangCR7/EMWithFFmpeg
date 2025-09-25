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

async function testSubadminCreation(name, data, token) {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/subadmins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    const responseData = await response.json().catch(() => ({}));
    const status = response.status;

    if (response.ok) {
      console.log(`✅ ${name}: ${status} - ${response.statusText}`);
      console.log(`   📄 Response: ${JSON.stringify(responseData, null, 2).substring(0, 300)}...`);
      return { name, status, success: true, data: responseData };
    } else {
      console.log(`❌ ${name}: ${status} - ${response.statusText}`);
      console.log(`   Error: ${responseData.error || JSON.stringify(responseData)}`);
      if (responseData.details) {
        console.log(`   Validation Details: ${JSON.stringify(responseData.details, null, 2)}`);
      }
      return { name, status, success: false, error: responseData.error || JSON.stringify(responseData) };
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return { name, status: 'ERROR', success: false, error: error.message };
  }
}

async function runSubadminCreationTests() {
  console.log('👥 Testing Subadmin Creation with Correct Format...\n');
  
  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Could not get admin token');
    return;
  }
  console.log('✅ Admin token obtained\n');

  const results = [];

  // Test 1: Correct format with array permissions
  console.log('📝 Test 1: Correct Format (Array Permissions):');
  const correctData = {
    name: 'Test Subadmin API',
    email: `test-subadmin-${Date.now()}@example.com`,
    password: 'password123',
    role: 'SUBADMIN',
    permissions: ['read', 'upload'], // Array format
    assignedBusinessCategories: ['Restaurant'], // Correct field name
    mobileNumber: '+1234567890'
  };
  results.push(await testSubadminCreation('Correct Format', correctData, adminToken));
  console.log('');

  // Test 2: Wrong format with JSON string permissions (what we used before)
  console.log('📝 Test 2: Wrong Format (JSON String Permissions):');
  const wrongData = {
    name: 'Test Subadmin Wrong',
    email: `test-subadmin-wrong-${Date.now()}@example.com`,
    password: 'password123',
    role: 'SUBADMIN',
    permissions: JSON.stringify(['read', 'upload']), // JSON string format (wrong)
    assignedCategories: ['Restaurant'], // Wrong field name
    mobileNumber: '+1234567890'
  };
  results.push(await testSubadminCreation('Wrong Format', wrongData, adminToken));
  console.log('');

  // Test 3: Missing required fields
  console.log('📝 Test 3: Missing Required Fields:');
  const incompleteData = {
    name: 'Test Subadmin Incomplete',
    email: `test-subadmin-incomplete-${Date.now()}@example.com`,
    password: 'password123',
    role: 'SUBADMIN'
    // Missing permissions and assignedBusinessCategories
  };
  results.push(await testSubadminCreation('Incomplete Data', incompleteData, adminToken));
  console.log('');

  // Test 4: Invalid email format
  console.log('📝 Test 4: Invalid Email Format:');
  const invalidEmailData = {
    name: 'Test Subadmin Invalid Email',
    email: 'invalid-email-format', // Invalid email
    password: 'password123',
    role: 'SUBADMIN',
    permissions: ['read', 'upload'],
    assignedBusinessCategories: ['Restaurant'],
    mobileNumber: '+1234567890'
  };
  results.push(await testSubadminCreation('Invalid Email', invalidEmailData, adminToken));
  console.log('');

  // Test 5: Short password
  console.log('📝 Test 5: Short Password:');
  const shortPasswordData = {
    name: 'Test Subadmin Short Password',
    email: `test-subadmin-short-${Date.now()}@example.com`,
    password: '123', // Too short
    role: 'SUBADMIN',
    permissions: ['read', 'upload'],
    assignedBusinessCategories: ['Restaurant'],
    mobileNumber: '+1234567890'
  };
  results.push(await testSubadminCreation('Short Password', shortPasswordData, adminToken));
  console.log('');

  // Summary
  console.log('📊 Subadmin Creation Test Summary:');
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
  console.log('1. Permissions must be an array, not a JSON string');
  console.log('2. Field name should be "assignedBusinessCategories", not "assignedCategories"');
  console.log('3. Email must be valid format');
  console.log('4. Password must be at least 8 characters');
  console.log('5. All required fields must be provided');
}

runSubadminCreationTests();
