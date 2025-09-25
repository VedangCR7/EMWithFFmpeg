// Test user registration directly
const { PrismaClient } = require('@prisma/client');

async function testUserRegistration() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://eventmarketers_user:XMgWHtXJeE9G6tvUvvmbTIOumSD33w9G@dpg-d38ecjumcj7s7388sk60-a.oregon-postgres.render.com/eventmarketers_db'
      }
    }
  });

  try {
    console.log('🔍 Testing user registration...');
    
    const deviceId = 'test-device-' + Date.now();
    const userData = {
      deviceId: deviceId,
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      appVersion: '1.0.0'
    };
    
    console.log('📝 Creating user with data:', userData);
    
    // Check if user already exists
    const existingUser = await prisma.installedUser.findUnique({
      where: { deviceId: deviceId }
    });
    
    if (existingUser) {
      console.log('⚠️ User already exists:', existingUser);
      return existingUser;
    }
    
    // Create new user
    const newUser = await prisma.installedUser.create({
      data: userData
    });
    
    console.log('✅ User created successfully:', newUser);
    
    // Test getting the user
    const retrievedUser = await prisma.installedUser.findUnique({
      where: { deviceId: deviceId }
    });
    
    console.log('✅ User retrieved successfully:', retrievedUser);
    
    return newUser;
    
  } catch (error) {
    console.error('❌ User registration failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserRegistration();
