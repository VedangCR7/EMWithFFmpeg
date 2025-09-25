import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@eventmarketers.com' },
      update: {},
      create: {
        email: 'admin@eventmarketers.com',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    });
    console.log('✅ Admin user created:', admin.email);

    // Create subadmin user
    const subadminPassword = await bcrypt.hash('subadmin123', 12);
    const subadmin = await prisma.subadmin.upsert({
      where: { email: 'subadmin@eventmarketers.com' },
      update: {},
      create: {
        email: 'subadmin@eventmarketers.com',
        name: 'Content Manager',
        password: subadminPassword,
        role: 'Content Manager',
        permissions: JSON.stringify(['Images', 'Videos', 'Categories']),
        assignedCategories: JSON.stringify(['Event Planners', 'Decorators']),
        status: 'ACTIVE',
        createdBy: admin.id
      }
    });
    console.log('✅ Subadmin user created:', subadmin.email);

    // Create business categories
    const categories = [
      {
        name: 'Event Planners',
        description: 'Event planning and coordination services',
        icon: '🎉',
        sortOrder: 1
      },
      {
        name: 'Decorators',
        description: 'Event decoration and design services',
        icon: '🎨',
        sortOrder: 2
      },
      {
        name: 'Sound Suppliers',
        description: 'Audio equipment and sound services',
        icon: '🔊',
        sortOrder: 3
      },
      {
        name: 'Light Suppliers',
        description: 'Lighting equipment and services',
        icon: '💡',
        sortOrder: 4
      },
      {
        name: 'General',
        description: 'General business services and content',
        icon: '🏢',
        sortOrder: 5
      }
    ];

    for (const categoryData of categories) {
      const category = await prisma.businessCategory.upsert({
        where: { name: categoryData.name },
        update: {},
        create: {
          ...categoryData,
          createdBy: admin.id
        }
      });
      console.log('✅ Business category created:', category.name);
    }

    // Create sample images
    const sampleImages = [
      {
        title: 'Restaurant Interior Design',
        description: 'Modern restaurant interior with warm lighting',
        url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        category: 'BUSINESS',
        tags: JSON.stringify(['restaurant', 'interior', 'design', 'modern']),
        fileSize: 1024000,
        dimensions: '1920x1080',
        format: 'jpg',
        adminUploaderId: admin.id,
        uploaderType: 'ADMIN',
        approvalStatus: 'APPROVED',
        approvedBy: admin.id,
        approvedAt: new Date()
      },
      {
        title: 'Wedding Decoration Setup',
        description: 'Beautiful wedding venue decoration',
        url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400',
        category: 'BUSINESS',
        tags: JSON.stringify(['wedding', 'decoration', 'venue', 'romantic']),
        fileSize: 1200000,
        dimensions: '1920x1080',
        format: 'jpg',
        adminUploaderId: admin.id,
        uploaderType: 'ADMIN',
        approvalStatus: 'APPROVED',
        approvedBy: admin.id,
        approvedAt: new Date()
      }
    ];

    for (const imageData of sampleImages) {
      const image = await prisma.image.create({
        data: imageData
      });
      console.log('✅ Sample image created:', image.title);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@eventmarketers.com / admin123');
    console.log('Subadmin: subadmin@eventmarketers.com / subadmin123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });