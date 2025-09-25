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
      console.log('✅ Admin token obtained');
      return data.token;
    } else {
      const errorData = await response.json();
      console.log('❌ Admin login failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Error getting admin token:', error.message);
  }
  return null;
}

async function createCustomer() {
  try {
    const timestamp = Date.now();
    const customerData = {
      companyName: `Test Customer ${timestamp}`,
      email: `test-customer-${timestamp}@example.com`,
      phone: '+1234567890',
      password: 'password123'
    };

    const response = await fetch(`${BASE_URL}/api/mobile/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Customer created:', data.data.user.id);
      return data.data.user.id;
    } else {
      const errorData = await response.json();
      console.log('❌ Customer creation failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Error creating customer:', error.message);
  }
  return null;
}

async function testSubscriptionActivation(customerId, adminToken) {
  try {
    console.log(`🔧 Testing subscription activation for customer: ${customerId}`);
    
    const response = await fetch(`${BASE_URL}/api/admin/customers/${customerId}/activate-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        plan: 'YEARLY',
        amount: 99.99,
        currency: 'USD'
      })
    });
    
    const data = await response.json().catch(() => ({}));
    const status = response.status;

    if (response.ok) {
      console.log(`✅ Subscription Activation: ${status} - ${response.statusText}`);
      console.log(`   📄 Response: ${JSON.stringify(data, null, 2).substring(0, 300)}...`);
      return { status, success: true, data };
    } else {
      console.log(`❌ Subscription Activation: ${status} - ${response.statusText}`);
      console.log(`   Error: ${data.error || JSON.stringify(data)}`);
      return { status, success: false, error: data.error || JSON.stringify(data) };
    }
  } catch (error) {
    console.log(`❌ Subscription Activation Error: ${error.message}`);
    return { status: 'ERROR', success: false, error: error.message };
  }
}

async function testCustomerContentAccess(customerId) {
  try {
    console.log(`📱 Testing customer content access for: ${customerId}`);
    
    const response = await fetch(`${BASE_URL}/api/mobile/content/${customerId}`, {
      method: 'GET'
    });
    
    const data = await response.json().catch(() => ({}));
    const status = response.status;

    if (response.ok) {
      console.log(`✅ Customer Content Access: ${status} - ${response.statusText}`);
      console.log(`   📄 Response: ${JSON.stringify(data, null, 2).substring(0, 300)}...`);
      return { status, success: true, data };
    } else {
      console.log(`❌ Customer Content Access: ${status} - ${response.statusText}`);
      console.log(`   Error: ${data.error || JSON.stringify(data)}`);
      return { status, success: false, error: data.error || JSON.stringify(data) };
    }
  } catch (error) {
    console.log(`❌ Customer Content Access Error: ${error.message}`);
    return { status: 'ERROR', success: false, error: error.message };
  }
}

async function runSubscriptionTest() {
  console.log('🚀 Testing Customer Subscription Activation...\n');
  
  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Could not get admin token');
    return;
  }
  console.log('');

  // Create customer
  const customerId = await createCustomer();
  if (!customerId) {
    console.log('❌ Could not create customer');
    return;
  }
  console.log('');

  const results = [];

  // Test 1: Try to access content before subscription activation (should fail)
  console.log('📋 Test 1: Access Content Before Subscription Activation:');
  results.push(await testCustomerContentAccess(customerId));
  console.log('');

  // Test 2: Activate subscription
  console.log('📋 Test 2: Activate Customer Subscription:');
  results.push(await testSubscriptionActivation(customerId, adminToken));
  console.log('');

  // Test 3: Try to access content after subscription activation (should work)
  console.log('📋 Test 3: Access Content After Subscription Activation:');
  results.push(await testCustomerContentAccess(customerId));
  console.log('');

  // Summary
  console.log('📊 Subscription Test Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach((r, index) => {
      console.log(`   Test ${index + 1}: ${r.status} - ${r.error || 'Unknown error'}`);
    });
  }

  if (passed > 0) {
    console.log('\n✅ Working Tests:');
    results.filter(r => r.success).forEach((r, index) => {
      console.log(`   Test ${index + 1}: ${r.status}`);
    });
  }

  console.log('\n🎯 Results:');
  if (results[1] && results[1].success) {
    console.log('✅ Subscription activation is working!');
  } else {
    console.log('❌ Subscription activation needs more work');
  }
  
  if (results[2] && results[2].success) {
    console.log('✅ Customer content access is working after subscription activation!');
  } else {
    console.log('❌ Customer content access still has issues');
  }
}

runSubscriptionTest();
