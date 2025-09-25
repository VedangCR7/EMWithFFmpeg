const { PrismaClient } = require('@prisma/client');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://eventmarketers_user:XMgWHtXJeE9G6tvUvvmbTIOumSD33w9G@dpg-d38ecjumcj7s7388sk60-a.oregon-postgres.render.com/eventmarketers_db'
    }
  }
});

async function getAdminToken() {
  try {
    const response = await fetch('https://eventmarketersbackend.onrender.com/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@eventmarketers.com',
        password: 'EventMarketers2024!'
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

async function testContentSync() {
  console.log('🧪 Testing Content Sync Functionality...\n');
  
  try {
    // 1. Check current sync status
    console.log('📊 Checking current sync status...');
    const [totalImages, syncedImages, pendingImages, totalVideos, syncedVideos, pendingVideos] = await Promise.all([
      prisma.image.count(),
      prisma.image.count({ where: { isMobileSynced: true } }),
      prisma.image.count({ where: { approvalStatus: 'APPROVED', isMobileSynced: false } }),
      prisma.video.count(),
      prisma.video.count({ where: { isMobileSynced: true } }),
      prisma.video.count({ where: { approvalStatus: 'APPROVED', isMobileSynced: false } })
    ]);

    console.log(`📸 Images: ${totalImages} total, ${syncedImages} synced, ${pendingImages} pending`);
    console.log(`🎥 Videos: ${totalVideos} total, ${syncedVideos} synced, ${pendingVideos} pending`);

    // 2. Check mobile tables
    console.log('\n📱 Checking mobile tables...');
    const [mobileTemplates, mobileVideos, featuredContent, subscriptionPlans] = await Promise.all([
      prisma.mobileTemplate.count(),
      prisma.mobileVideo.count(),
      prisma.featuredContent.count(),
      prisma.mobileSubscriptionPlan.count()
    ]);

    console.log(`📋 Mobile Templates: ${mobileTemplates}`);
    console.log(`🎬 Mobile Videos: ${mobileVideos}`);
    console.log(`⭐ Featured Content: ${featuredContent}`);
    console.log(`💳 Subscription Plans: ${subscriptionPlans}`);

    // 3. Test content sync API
    console.log('\n🔄 Testing content sync API...');
    const adminToken = await getAdminToken();
    if (!adminToken) {
      console.log('❌ Could not get admin token');
      return;
    }

    // Test sync status endpoint
    const statusResponse = await fetch('https://eventmarketersbackend.onrender.com/api/content-sync/status', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Sync status API working:', JSON.stringify(statusData.data, null, 2));
    } else {
      console.log('❌ Sync status API failed:', statusResponse.status);
    }

    // 4. Test sync all content
    console.log('\n🚀 Testing sync all content...');
    const syncResponse = await fetch('https://eventmarketersbackend.onrender.com/api/content-sync/sync-all', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      console.log('✅ Content sync API working:', JSON.stringify(syncData.data, null, 2));
    } else {
      console.log('❌ Content sync API failed:', syncResponse.status);
    }

    // 5. Check sync results
    console.log('\n📊 Checking sync results...');
    const [newSyncedImages, newSyncedVideos, newMobileTemplates, newMobileVideos] = await Promise.all([
      prisma.image.count({ where: { isMobileSynced: true } }),
      prisma.video.count({ where: { isMobileSynced: true } }),
      prisma.mobileTemplate.count(),
      prisma.mobileVideo.count()
    ]);

    console.log(`📸 Images synced: ${newSyncedImages} (was ${syncedImages})`);
    console.log(`🎥 Videos synced: ${newSyncedVideos} (was ${syncedVideos})`);
    console.log(`📋 Mobile Templates: ${newMobileTemplates} (was ${mobileTemplates})`);
    console.log(`🎬 Mobile Videos: ${newMobileVideos} (was ${mobileVideos})`);

    // 6. Test mobile data
    console.log('\n📱 Testing mobile data...');
    const [sampleTemplate, sampleVideo, samplePlan] = await Promise.all([
      prisma.mobileTemplate.findFirst(),
      prisma.mobileVideo.findFirst(),
      prisma.mobileSubscriptionPlan.findFirst()
    ]);

    if (sampleTemplate) {
      console.log('✅ Sample Mobile Template:', {
        id: sampleTemplate.id,
        title: sampleTemplate.title,
        category: sampleTemplate.category,
        sourceImageId: sampleTemplate.sourceImageId
      });
    }

    if (sampleVideo) {
      console.log('✅ Sample Mobile Video:', {
        id: sampleVideo.id,
        title: sampleVideo.title,
        category: sampleVideo.category,
        sourceVideoId: sampleVideo.sourceVideoId
      });
    }

    if (samplePlan) {
      console.log('✅ Sample Subscription Plan:', {
        id: samplePlan.id,
        name: samplePlan.name,
        price: samplePlan.price,
        period: samplePlan.period
      });
    }

    console.log('\n🎉 Content sync test completed successfully!');

  } catch (error) {
    console.error('❌ Content sync test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testContentSync();
