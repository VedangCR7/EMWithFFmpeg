const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProfiles() {
  try {
    console.log('Checking business profiles...');
    
    const profiles = await prisma.businessProfile.findMany({
      include: {
        mobileUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('Found', profiles.length, 'business profiles:');
    profiles.forEach((profile, index) => {
      console.log(`\nProfile ${index + 1}:`);
      console.log('  ID:', profile.id);
      console.log('  Business Name:', profile.businessName);
      console.log('  Category:', profile.category);
      console.log('  Owner:', profile.ownerName);
      console.log('  User ID:', profile.mobileUserId);
      console.log('  User Name:', profile.mobileUser?.name);
      console.log('  User Email:', profile.mobileUser?.email);
    });
    
    if (profiles.length === 0) {
      console.log('\nNo business profiles found in database.');
      
      // Check mobile users
      const users = await prisma.mobileUser.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          deviceId: true
        }
      });
      
      console.log('\nFound', users.length, 'mobile users:');
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log('  ID:', user.id);
        console.log('  Name:', user.name);
        console.log('  Email:', user.email);
        console.log('  Device ID:', user.deviceId);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfiles();
