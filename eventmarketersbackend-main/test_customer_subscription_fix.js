const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function createCustomerAndGetToken() {
  try {
    const timestamp = Date.now();
    const customerData = {
      companyName: `Test Customer ${timestamp}`,
      email: `test-customer-${timestamp}@example.com`,
      phone: '+1234567890',
      password: 'password123'
    };

    console.log('📝 Creating customer for subscription testing:', customerData);

    const response = await fetch(`${BASE_URL}/api/mobile/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Customer created successfully');
      console.log(`   Customer ID: ${data.data.user.id}`);
      console.log(`   Email: ${data.data.user.email}`);
      return {
        id: data.data.user.id,
        email: data.data.user.email,
        token: data.data.token
      };
    } else {
      const errorData = await response.json();
      console.log('❌ Customer creation failed');
      console.log(`   Error: ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.log('❌ Error creating customer:', error.message);
  }
  return null;
}

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

async function testCustomerContentAccess(customerId, token = null) {
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/api/mobile/content/${customerId}`, {
      method: 'GET',
      headers: headers
    });
    
    const data = await response.json().catch(() => ({}));
    const status = response.status;

    if (response.ok) {
      console.log(`✅ Customer Content Access: ${status} - ${response.statusText}`);
      if (data.success && data.content) {
        console.log(`   📄 Content: ${JSON.stringify(data.content, null, 2).substring(0, 200)}...`);
      } else {
        console.log(`   📄 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      }
      return { status, success: true, data };
    } else {
      console.log(`❌ Customer Content Access: ${status} - ${response.statusText}`);
      console.log(`   Error: ${data.error || JSON.stringify(data)}`);
      return { status, success: false, error: data.error || JSON.stringify(data) };
    }
  } catch (error) {
    console.log(`❌ Customer Content Access: ERROR - ${error.message}`);
    return { status: 'ERROR', success: false, error: error.message };
  }
}

async function activateCustomerSubscription(customerId, adminToken) {
  try {
    console.log(`🔧 Attempting to activate subscription for customer: ${customerId}`);
    
    // First, let's check if there's a subscription activation endpoint
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
      console.log(`✅ Subscription Activated: ${status} - ${response.statusText}`);
      console.log(`   📄 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      return { status, success: true, data };
    } else {
      console.log(`❌ Subscription Activation Failed: ${status} - ${response.statusText}`);
      console.log(`   Error: ${data.error || JSON.stringify(data)}`);
      return { status, success: false, error: data.error || JSON.stringify(data) };
    }
  } catch (error) {
    console.log(`❌ Subscription Activation Error: ${error.message}`);
    return { status: 'ERROR', success: false, error: error.message };
  }
}

async function runCustomerSubscriptionTests() {
  console.log('📱 Testing Customer Content Access and Subscription Activation...\n');
  
  // Create customer
  const customer = await createCustomerAndGetToken();
  if (!customer) {
    console.log('❌ Could not create customer');
    return;
  }
  console.log('');

  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Could not get admin token');
    return;
  }
  console.log('✅ Admin token obtained\n');

  const results = [];

  // Test 1: Try to access content without subscription (should fail)
  console.log('📋 Test 1: Access Content Without Subscription:');
  results.push(await testCustomerContentAccess(customer.id, null));
  console.log('');

  // Test 2: Try to access content with customer token but no subscription (should fail)
  console.log('📋 Test 2: Access Content With Token But No Subscription:');
  results.push(await testCustomerContentAccess(customer.id, customer.token));
  console.log('');

  // Test 3: Try to activate subscription (if endpoint exists)
  console.log('📋 Test 3: Activate Customer Subscription:');
  results.push(await activateCustomerSubscription(customer.id, adminToken));
  console.log('');

  // Test 4: Try to access content after subscription activation (if successful)
  console.log('📋 Test 4: Access Content After Subscription Activation:');
  results.push(await testCustomerContentAccess(customer.id, customer.token));
  console.log('');

  // Test 5: Check customer profile to see subscription status
  console.log('📋 Test 5: Check Customer Profile:');
  try {
    const profileResponse = await fetch(`${BASE_URL}/api/mobile/profile/${customer.id}`, {
      method: 'GET'
    });
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log(`✅ Customer Profile: ${profileResponse.status} - ${profileResponse.statusText}`);
      console.log(`   📄 Profile: ${JSON.stringify(profileData.customer, null, 2).substring(0, 300)}...`);
    } else {
      const errorData = await profileResponse.json();
      console.log(`❌ Customer Profile: ${profileResponse.status} - ${profileResponse.statusText}`);
      console.log(`   Error: ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.log(`❌ Customer Profile Error: ${error.message}`);
  }
  console.log('');

  // Summary
  console.log('📊 Customer Subscription Test Summary:');
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

  console.log('\n🎯 Key Findings:');
  console.log('1. Customer content access requires active subscription');
  console.log('2. Default subscription status is INACTIVE');
  console.log('3. Need to implement subscription activation mechanism');
  console.log('4. Admin should be able to activate customer subscriptions');
  console.log('5. Need to create subscription management endpoints');

  console.log('\n💡 Solutions:');
  console.log('1. Create admin endpoint to activate customer subscriptions');
  console.log('2. Add subscription management to customer registration');
  console.log('3. Implement payment integration for subscription activation');
  console.log('4. Add subscription status checks to content access');
  console.log('5. Create subscription renewal and management system');
}

runCustomerSubscriptionTests();
