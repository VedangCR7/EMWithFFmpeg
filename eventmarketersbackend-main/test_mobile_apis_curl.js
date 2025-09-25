const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const BASE_URL = 'https://eventmarketers-backend.onrender.com';

async function testAPI(endpoint, description) {
  try {
    console.log(`Testing: ${description}`);
    const { stdout, stderr } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}"`);
    const statusCode = stdout.trim();
    
    if (statusCode === '200') {
      console.log(`   ✅ ${description} - PASSED (${statusCode})`);
      return true;
    } else {
      console.log(`   ❌ ${description} - FAILED (${statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${description} - ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Mobile APIs with curl...\n');

  const tests = [
    ['/api/mobile/subscriptions/plans', 'Subscription Plans'],
    ['/api/mobile/templates/categories', 'Template Categories'],
    ['/api/mobile/greetings/categories', 'Greeting Categories'],
    ['/api/mobile/home/featured', 'Featured Content'],
    ['/api/mobile/home/upcoming-events', 'Upcoming Events'],
    ['/api/mobile/templates', 'Templates List'],
    ['/api/mobile/content/videos', 'Videos List'],
    ['/api/mobile/greetings/stickers', 'Stickers'],
    ['/api/mobile/greetings/emojis', 'Emojis'],
    ['/api/content-sync/status', 'Content Sync Status']
  ];

  let passed = 0;
  let total = tests.length;

  for (const [endpoint, description] of tests) {
    const result = await testAPI(endpoint, description);
    if (result) passed++;
  }

  console.log(`\n📊 Results: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);
  
  if (passed === total) {
    console.log('🎉 All mobile APIs are working!');
  } else {
    console.log('⚠️ Some APIs need attention.');
  }
}

runTests().catch(console.error);
