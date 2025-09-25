const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://eventmarketers_user:XMgWHtXJeE9G6tvUvvmbTIOumSD33w9G@dpg-d38ecjumcj7s7388sk60-a.oregon-postgres.render.com/eventmarketers_db'
    }
  }
});

async function createSubadminUser() {
  try {
    console.log('👥 Creating new subadmin user...');
    
    // Subadmin credentials
    const subadminEmail = 'subadmin@eventmarketers.com';
    const subadminPassword = 'SubAdmin2024!';
    const subadminName = 'EventMarketers Subadmin';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(subadminPassword, 12);
    
    // Get admin ID for createdBy field
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      throw new Error('No admin found. Please create admin first.');
    }
    
    // Create or update subadmin user
    const subadmin = await prisma.subadmin.upsert({
      where: { email: subadminEmail },
      update: {
        password: hashedPassword,
        name: subadminName,
        role: 'Content Manager',
        permissions: JSON.stringify(['manage_content', 'view_analytics', 'approve_content']),
        assignedCategories: JSON.stringify(['Restaurant', 'Wedding Planning', 'Event Management']),
        status: 'ACTIVE',
        createdBy: admin.id
      },
      create: {
        email: subadminEmail,
        name: subadminName,
        password: hashedPassword,
        role: 'Content Manager',
        permissions: JSON.stringify(['manage_content', 'view_analytics', 'approve_content']),
        assignedCategories: JSON.stringify(['Restaurant', 'Wedding Planning', 'Event Management']),
        status: 'ACTIVE',
        createdBy: admin.id
      }
    });
    
    console.log('✅ Subadmin user created/updated successfully!');
    console.log('📧 Email:', subadmin.email);
    console.log('👤 Name:', subadmin.name);
    console.log('🔑 Password:', subadminPassword);
    console.log('🆔 ID:', subadmin.id);
    console.log('📅 Created:', subadmin.createdAt);
    console.log('🔐 Permissions:', JSON.parse(subadmin.permissions));
    console.log('📂 Assigned Categories:', JSON.parse(subadmin.assignedCategories));
    
    // Test login
    console.log('\n🧪 Testing subadmin login...');
    const loginResponse = await fetch('https://eventmarketersbackend.onrender.com/api/auth/subadmin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: subadminEmail,
        password: subadminPassword
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
    console.error('❌ Error creating subadmin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSubadminUser();
