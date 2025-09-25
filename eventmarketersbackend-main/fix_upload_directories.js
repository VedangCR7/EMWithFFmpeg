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

async function setupUploadDirectories() {
  try {
    console.log('🔧 Setting up upload directories...');
    
    const adminToken = await getAdminToken();
    if (!adminToken) {
      console.log('❌ Could not get admin token');
      return;
    }

    // Call the file management setup endpoint
    const response = await fetch('https://eventmarketersbackend.onrender.com/api/file-management/setup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload directories setup response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Failed to setup directories:', response.status, response.statusText);
    }

    // Check directory status
    const statusResponse = await fetch('https://eventmarketersbackend.onrender.com/api/file-management/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📊 Directory status:', JSON.stringify(statusData.status, null, 2));
    }

  } catch (error) {
    console.error('❌ Error setting up directories:', error);
  }
}

async function testSimpleUpload() {
  try {
    console.log('\n🧪 Testing simple upload after directory setup...');
    
    const adminToken = await getAdminToken();
    if (!adminToken) {
      console.log('❌ Could not get admin token');
      return;
    }

    // Create a simple test file
    const testContent = 'This is a test file for upload';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('image', testFile, 'test.txt');
    formData.append('title', 'Test Upload');
    formData.append('category', 'GENERAL');

    const response = await fetch('https://eventmarketersbackend.onrender.com/api/content/images/upload-simple', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: formData
    });

    console.log(`Upload test status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('Upload test response:', responseText);

    if (response.ok) {
      console.log('✅ Upload test successful!');
    } else {
      console.log('❌ Upload test failed');
    }

  } catch (error) {
    console.error('❌ Upload test error:', error);
  }
}

async function main() {
  console.log('🚀 Upload Directory Fix Script\n');
  
  await setupUploadDirectories();
  await testSimpleUpload();
  
  console.log('\n✅ Script completed');
}

main().catch(console.error);
