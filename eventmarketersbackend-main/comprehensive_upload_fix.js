const { PrismaClient } = require('@prisma/client');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://eventmarketers_user:XMgWHtXJeE9G6tvUvvmbTIOumSD33w9G@dpg-d38ecjumcj7s7388sk60-a.oregon-postgres.render.com/eventmarketers_db'
    }
  }
});

async function checkAdminUser() {
  try {
    console.log('🔍 Checking admin user...');
    
    const admin = await prisma.admin.findFirst({
      where: { email: 'admin@eventmarketers.com' }
    });
    
    if (admin) {
      console.log('✅ Admin user found:', {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        isActive: admin.isActive,
        createdAt: admin.createdAt
      });
      return admin;
    } else {
      console.log('❌ Admin user not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    return null;
  }
}

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('EventMarketers2024!', 12);
    
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@eventmarketers.com' },
      update: {
        password: hashedPassword,
        name: 'EventMarketers Admin',
        role: 'ADMIN',
        isActive: true
      },
      create: {
        email: 'admin@eventmarketers.com',
        name: 'EventMarketers Admin',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    });
    
    console.log('✅ Admin user created/updated:', admin.email);
    return admin;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return null;
  }
}

async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login...');
    
    const response = await fetch('https://eventmarketersbackend.onrender.com/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@eventmarketers.com',
        password: 'EventMarketers2024!'
      })
    });
    
    console.log(`Login status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful');
      console.log('Token received:', data.token ? 'Yes' : 'No');
      return data.token;
    } else {
      const errorData = await response.text();
      console.log('❌ Login failed:', errorData);
      return null;
    }
  } catch (error) {
    console.error('❌ Login test error:', error);
    return null;
  }
}

async function testHealthCheck() {
  try {
    console.log('🏥 Testing health check...');
    
    const response = await fetch('https://eventmarketersbackend.onrender.com/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check passed:', data);
      return true;
    } else {
      console.log('❌ Health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Health check error:', error);
    return false;
  }
}

async function testFileManagement(token) {
  try {
    console.log('📁 Testing file management...');
    
    const response = await fetch('https://eventmarketersbackend.onrender.com/api/file-management/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ File management status:', JSON.stringify(data.status, null, 2));
      return true;
    } else {
      console.log('❌ File management failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ File management error:', error);
    return false;
  }
}

async function setupDirectories(token) {
  try {
    console.log('🔧 Setting up directories...');
    
    const response = await fetch('https://eventmarketersbackend.onrender.com/api/file-management/setup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Directory setup successful:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('❌ Directory setup failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Directory setup error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Comprehensive Upload Fix Script\n');
  
  // Step 1: Check health
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('❌ Server is not healthy, stopping...');
    return;
  }
  
  // Step 2: Check admin user
  let admin = await checkAdminUser();
  if (!admin) {
    admin = await createAdminUser();
    if (!admin) {
      console.log('❌ Could not create admin user, stopping...');
      return;
    }
  }
  
  // Step 3: Test login
  const token = await testAdminLogin();
  if (!token) {
    console.log('❌ Could not get admin token, stopping...');
    return;
  }
  
  // Step 4: Test file management
  const fmOk = await testFileManagement(token);
  if (!fmOk) {
    console.log('❌ File management not working, stopping...');
    return;
  }
  
  // Step 5: Setup directories
  const dirOk = await setupDirectories(token);
  if (!dirOk) {
    console.log('❌ Directory setup failed, stopping...');
    return;
  }
  
  console.log('\n✅ All checks passed! Upload should now work.');
  console.log('\n📋 Next steps:');
  console.log('1. Try uploading from your frontend again');
  console.log('2. Use the admin credentials: admin@eventmarketers.com / EventMarketers2024!');
  console.log('3. If still failing, check the server logs for detailed error messages');
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
});
