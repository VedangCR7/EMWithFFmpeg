const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://eventmarketers_user:XMgWHtXJeE9G6tvUvvmbTIOumSD33w9G@dpg-d38ecjumcj7s7388sk60-a.oregon-postgres.render.com/eventmarketers_db'
    }
  }
});

async function createAdminUser() {
  try {
    console.log('🔐 Creating new admin user...');
    
    // Admin credentials
    const adminEmail = 'admin@eventmarketers.com';
    const adminPassword = 'EventMarketers2024!';
    const adminName = 'EventMarketers Admin';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Create or update admin user
    const admin = await prisma.admin.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        name: adminName,
        role: 'ADMIN',
        isActive: true
      },
      create: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    });
    
    console.log('✅ Admin user created/updated successfully!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.name);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 ID:', admin.id);
    console.log('📅 Created:', admin.createdAt);
    
    // Test login
    console.log('\n🧪 Testing admin login...');
    const loginResponse = await fetch('https://eventmarketersbackend.onrender.com/api/auth/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login test successful!');
      console.log('🎫 Token received:', loginData.token ? 'Yes' : 'No');
    } else {
      console.log('❌ Login test failed:', loginResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
