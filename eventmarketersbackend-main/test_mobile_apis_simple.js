const fetch = require('node-fetch');

const BASE_URL = 'https://eventmarketers-backend.onrender.com';

async function testMobileAPIs() {
  console.log('🚀 Testing Mobile APIs...\n');

  try {
    // Test 1: Get subscription plans
    console.log('1. Testing Subscription Plans...');
    const plansResponse = await fetch(`${BASE_URL}/api/mobile/subscriptions/plans`);
    const plansData = await plansResponse.json();
    console.log(`   Status: ${plansResponse.status}`);
    console.log(`   Success: ${plansData.success}`);
    console.log(`   Plans Count: ${plansData.data?.length || 0}\n`);

    // Test 2: Get template categories
    console.log('2. Testing Template Categories...');
    const categoriesResponse = await fetch(`${BASE_URL}/api/mobile/templates/categories`);
    const categoriesData = await categoriesResponse.json();
    console.log(`   Status: ${categoriesResponse.status}`);
    console.log(`   Success: ${categoriesData.success}`);
    console.log(`   Categories Count: ${categoriesData.data?.length || 0}\n`);

    // Test 3: Get greeting categories
    console.log('3. Testing Greeting Categories...');
    const greetingCategoriesResponse = await fetch(`${BASE_URL}/api/mobile/greetings/categories`);
    const greetingCategoriesData = await greetingCategoriesResponse.json();
    console.log(`   Status: ${greetingCategoriesResponse.status}`);
    console.log(`   Success: ${greetingCategoriesData.success}`);
    console.log(`   Categories Count: ${greetingCategoriesData.data?.length || 0}\n`);

    // Test 4: Get featured content
    console.log('4. Testing Featured Content...');
    const featuredResponse = await fetch(`${BASE_URL}/api/mobile/home/featured`);
    const featuredData = await featuredResponse.json();
    console.log(`   Status: ${featuredResponse.status}`);
    console.log(`   Success: ${featuredData.success}`);
    console.log(`   Featured Count: ${featuredData.data?.length || 0}\n`);

    // Test 5: Get templates
    console.log('5. Testing Templates...');
    const templatesResponse = await fetch(`${BASE_URL}/api/mobile/templates`);
    const templatesData = await templatesResponse.json();
    console.log(`   Status: ${templatesResponse.status}`);
    console.log(`   Success: ${templatesData.success}`);
    console.log(`   Templates Count: ${templatesData.data?.templates?.length || 0}\n`);

    // Test 6: Get videos
    console.log('6. Testing Videos...');
    const videosResponse = await fetch(`${BASE_URL}/api/mobile/content/videos`);
    const videosData = await videosResponse.json();
    console.log(`   Status: ${videosResponse.status}`);
    console.log(`   Success: ${videosData.success}`);
    console.log(`   Videos Count: ${videosData.data?.videos?.length || 0}\n`);

    // Test 7: Get stickers
    console.log('7. Testing Stickers...');
    const stickersResponse = await fetch(`${BASE_URL}/api/mobile/greetings/stickers`);
    const stickersData = await stickersResponse.json();
    console.log(`   Status: ${stickersResponse.status}`);
    console.log(`   Success: ${stickersData.success}`);
    console.log(`   Stickers Count: ${stickersData.data?.stickers?.length || 0}\n`);

    // Test 8: Get emojis
    console.log('8. Testing Emojis...');
    const emojisResponse = await fetch(`${BASE_URL}/api/mobile/greetings/emojis`);
    const emojisData = await emojisResponse.json();
    console.log(`   Status: ${emojisResponse.status}`);
    console.log(`   Success: ${emojisData.success}`);
    console.log(`   Emojis Count: ${emojisData.data?.emojis?.length || 0}\n`);

    // Test 9: Content sync status
    console.log('9. Testing Content Sync Status...');
    const syncResponse = await fetch(`${BASE_URL}/api/content-sync/status`);
    const syncData = await syncResponse.json();
    console.log(`   Status: ${syncResponse.status}`);
    console.log(`   Success: ${syncData.success}`);
    console.log(`   Sync Status: ${syncData.data?.status || 'Unknown'}\n`);

    console.log('✅ Mobile API testing completed successfully!');

  } catch (error) {
    console.error('❌ Error testing mobile APIs:', error.message);
  }
}

testMobileAPIs();
