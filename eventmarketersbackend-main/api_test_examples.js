// EventMarketers API Testing Examples
// Use these examples to test the API endpoints

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

// Example 1: Health Check
async function testHealthCheck() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('Health Check:', data);
    return data;
  } catch (error) {
    console.error('Health Check Error:', error);
  }
}

// Example 2: Get Business Categories
async function getBusinessCategories() {
  try {
    const response = await fetch(`${BASE_URL}/api/mobile/business-categories`);
    const data = await response.json();
    console.log('Business Categories:', data);
    return data;
  } catch (error) {
    console.error('Business Categories Error:', error);
  }
}

// Example 3: Register User
async function registerUser(deviceId, name, email, phone) {
  try {
    const response = await fetch(`${BASE_URL}/api/installed-users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: deviceId,
        name: name,
        email: email,
        phone: phone,
        appVersion: '1.0.0'
      })
    });
    const data = await response.json();
    console.log('User Registration:', data);
    return data;
  } catch (error) {
    console.error('User Registration Error:', error);
  }
}

// Example 4: Get User Profile
async function getUserProfile(deviceId) {
  try {
    const response = await fetch(`${BASE_URL}/api/installed-users/profile/${deviceId}`);
    const data = await response.json();
    console.log('User Profile:', data);
    return data;
  } catch (error) {
    console.error('User Profile Error:', error);
  }
}

// Example 5: Record User Activity
async function recordUserActivity(deviceId, action, resourceType, resourceId) {
  try {
    const response = await fetch(`${BASE_URL}/api/installed-users/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: deviceId,
        action: action,
        resourceType: resourceType,
        resourceId: resourceId,
        metadata: {
          category: 'Restaurant',
          duration: 30
        }
      })
    });
    const data = await response.json();
    console.log('User Activity:', data);
    return data;
  } catch (error) {
    console.error('User Activity Error:', error);
  }
}

// Example 6: Get Customer Content
async function getCustomerContent(customerId, category = null, page = 1, limit = 20) {
  try {
    let url = `${BASE_URL}/api/mobile/content/${customerId}?page=${page}&limit=${limit}`;
    if (category) {
      url += `&category=${category}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    console.log('Customer Content:', data);
    return data;
  } catch (error) {
    console.error('Customer Content Error:', error);
  }
}

// Example 7: Create Business Profile
async function createBusinessProfile(businessData) {
  try {
    const response = await fetch(`${BASE_URL}/api/business-profile/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessData)
    });
    const data = await response.json();
    console.log('Business Profile:', data);
    return data;
  } catch (error) {
    console.error('Business Profile Error:', error);
  }
}

// Example 8: Admin Login
async function adminLogin(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    const data = await response.json();
    console.log('Admin Login:', data);
    return data;
  } catch (error) {
    console.error('Admin Login Error:', error);
  }
}

// Example 9: Upload Image (with authentication)
async function uploadImage(token, imageFile, title, description, category, businessCategoryId, tags) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('businessCategoryId', businessCategoryId);
    formData.append('tags', tags);

    const response = await fetch(`${BASE_URL}/api/content/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await response.json();
    console.log('Image Upload:', data);
    return data;
  } catch (error) {
    console.error('Image Upload Error:', error);
  }
}

// Example 10: Get Current User (with authentication)
async function getCurrentUser(token) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    console.log('Current User:', data);
    return data;
  } catch (error) {
    console.error('Current User Error:', error);
  }
}

// Test Suite - Run all examples
async function runTestSuite() {
  console.log('🚀 Starting EventMarketers API Test Suite...\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  await testHealthCheck();
  console.log('');

  // Test 2: Get Business Categories
  console.log('2. Testing Business Categories...');
  await getBusinessCategories();
  console.log('');

  // Test 3: Register User
  console.log('3. Testing User Registration...');
  const deviceId = 'test-device-' + Date.now();
  const userData = await registerUser(deviceId, 'Test User', 'test@example.com', '+1234567890');
  console.log('');

  // Test 4: Get User Profile
  console.log('4. Testing User Profile...');
  await getUserProfile(deviceId);
  console.log('');

  // Test 5: Record User Activity
  console.log('5. Testing User Activity...');
  await recordUserActivity(deviceId, 'view', 'image', 'test-content-id');
  console.log('');

  // Test 6: Get Customer Content (will fail if no customer exists)
  console.log('6. Testing Customer Content...');
  await getCustomerContent('test-customer-id');
  console.log('');

  // Test 7: Create Business Profile
  console.log('7. Testing Business Profile Creation...');
  const businessData = {
    businessName: 'Test Restaurant',
    businessEmail: 'test@restaurant.com',
    businessPhone: '+1234567890',
    businessWebsite: 'https://testrestaurant.com',
    businessAddress: '123 Test St, Test City, Test State',
    businessDescription: 'Test restaurant description',
    businessCategory: 'Restaurant'
  };
  await createBusinessProfile(businessData);
  console.log('');

  console.log('✅ Test Suite Complete!');
}

// React Native / Mobile App Integration Examples
const MobileAPI = {
  // Initialize API with base URL
  init: (baseUrl = BASE_URL) => {
    this.baseUrl = baseUrl;
  },

  // Generic API call method
  apiCall: async (endpoint, options = {}) => {
    try {
      const url = `${this.baseUrl || BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Call Error:', error);
      throw error;
    }
  },

  // Mobile-specific methods
  getCategories: () => this.apiCall('/api/mobile/business-categories'),
  
  registerUser: (userData) => this.apiCall('/api/installed-users/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),

  getUserProfile: (deviceId) => this.apiCall(`/api/installed-users/profile/${deviceId}`),

  recordActivity: (activityData) => this.apiCall('/api/installed-users/activity', {
    method: 'POST',
    body: JSON.stringify(activityData)
  }),

  getContent: (customerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/api/mobile/content/${customerId}?${queryString}`);
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testHealthCheck,
    getBusinessCategories,
    registerUser,
    getUserProfile,
    recordUserActivity,
    getCustomerContent,
    createBusinessProfile,
    adminLogin,
    uploadImage,
    getCurrentUser,
    runTestSuite,
    MobileAPI
  };
}

// Run test suite if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.EventMarketersAPI = {
    testHealthCheck,
    getBusinessCategories,
    registerUser,
    getUserProfile,
    recordUserActivity,
    getCustomerContent,
    createBusinessProfile,
    adminLogin,
    uploadImage,
    getCurrentUser,
    runTestSuite,
    MobileAPI
  };
}
