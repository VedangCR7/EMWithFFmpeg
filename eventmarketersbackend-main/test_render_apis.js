const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const BASE_URL = 'https://eventmarketersbackend.onrender.com';

async function testAPI(endpoint, description) {
  try {
    console.log(`Testing: ${description}`);
    const { stdout, stderr } = await execAsync(`curl -s -w "%{http_code}" "${BASE_URL}${endpoint}"`);
    const lines = stdout.trim().split('\n');
    const statusCode = lines[lines.length - 1];
    const response = lines.slice(0, -1).join('\n');
    
    if (statusCode === '200') {
      console.log(`   ✅ ${description} - PASSED (${statusCode})`);
      if (response) {
        try {
          const data = JSON.parse(response);
          console.log(`   📊 Data: ${data.success ? 'Success' : 'Failed'} - ${data.message || data.error || 'No message'}`);
        } catch (e) {
          console.log(`   📊 Response: ${response.substring(0, 100)}...`);
        }
      }
      return true;
    } else if (statusCode === '404') {
      console.log(`   ❌ ${description} - NOT FOUND (${statusCode})`);
      return false;
    } else if (statusCode === '403') {
      console.log(`   🔒 ${description} - UNAUTHORIZED (${statusCode}) - Expected for protected endpoints`);
      return true; // This is expected for protected endpoints
    } else {
      console.log(`   ⚠️ ${description} - ${statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${description} - ERROR: ${error.message}`);
    return false;
  }
}

async function runRenderTests() {
  console.log('🚀 Testing Render Deployed APIs...\n');

  const tests = [
    ['/health', 'Health Check'],
    ['/api/mobile/subscriptions/plans', 'Subscription Plans'],
    ['/api/mobile/home/featured', 'Featured Content'],
    ['/api/mobile/templates', 'Templates List'],
    ['/api/mobile/templates/categories', 'Template Categories'],
    ['/api/mobile/greetings/categories', 'Greeting Categories'],
    ['/api/mobile/greetings/stickers', 'Stickers'],
    ['/api/mobile/greetings/emojis', 'Emojis'],
    ['/api/content-sync/status', 'Content Sync Status (Protected)'],
    ['/api/auth/admin/login', 'Admin Login Endpoint'],
    ['/api/mobile/auth/register', 'Mobile Registration Endpoint']
  ];

  let passed = 0;
  let total = tests.length;

  for (const [endpoint, description] of tests) {
    const result = await testAPI(endpoint, description);
    if (result) passed++;
    console.log(''); // Add spacing
  }

  console.log(`📊 Render API Test Results: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);
  
  if (passed === total) {
    console.log('🎉 All Render APIs are working perfectly!');
  } else if (passed > total * 0.7) {
    console.log('✅ Most Render APIs are working!');
  } else {
    console.log('⚠️ Some Render APIs need attention.');
  }

  console.log('\n🔍 Detailed Analysis:');
  console.log('- Health Check: Should return 200 with server status');
  console.log('- Mobile APIs: Should return 200 with data or empty arrays');
  console.log('- Protected APIs: Should return 403 (unauthorized) - this is correct');
  console.log('- 404 errors: Indicate deployment or routing issues');
}

runRenderTests().catch(console.error);
