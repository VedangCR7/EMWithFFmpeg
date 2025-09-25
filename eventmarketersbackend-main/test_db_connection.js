// Test database connection
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://eventmarketers_user:XMgWHtXJeE9G6tvUvvmbTIOumSD33w9G@dpg-d38ecjumcj7s7388sk60-a.oregon-postgres.render.com/eventmarketers_db'
      }
    }
  });

  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📊 Existing tables:', tables);
    
    // Check installed users table specifically
    try {
      const userCount = await prisma.installedUser.count();
      console.log('👥 Installed users count:', userCount);
    } catch (error) {
      console.log('❌ Installed users table error:', error.message);
    }
    
    // Check business categories table
    try {
      const categoryCount = await prisma.businessCategory.count();
      console.log('📂 Business categories count:', categoryCount);
    } catch (error) {
      console.log('❌ Business categories table error:', error.message);
    }
    
    // Check admin table
    try {
      const adminCount = await prisma.admin.count();
      console.log('👑 Admin users count:', adminCount);
    } catch (error) {
      console.log('❌ Admin table error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
