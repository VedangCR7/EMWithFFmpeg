import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Platform Administrator',
      password: hashedAdminPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create business categories
  const businessCategories = [
    { name: 'Restaurant', description: 'Food and dining business content', icon: '🍽️' },
    { name: 'Wedding Planning', description: 'Wedding and event planning content', icon: '💒' },
    { name: 'Electronics', description: 'Electronic products and gadgets', icon: '📱' },
    { name: 'Fashion', description: 'Clothing and fashion accessories', icon: '👗' },
    { name: 'Real Estate', description: 'Property and real estate content', icon: '🏠' },
    { name: 'Healthcare', description: 'Medical and healthcare services', icon: '🏥' },
    { name: 'Education', description: 'Educational services and content', icon: '📚' },
    { name: 'Automotive', description: 'Cars and automotive services', icon: '🚗' },
  ];

  for (const category of businessCategories) {
    await prisma.businessCategory.upsert({
      where: { name: category.name },
      update: {},
      create: {
        ...category,
        createdBy: admin.id,
      },
    });
  }

  console.log('✅ Created business categories');

  // Create sample subadmins
  const subadmins = [
    {
      email: 'priya@marketbrand.com',
      name: 'Priya Sharma',
      password: 'Priya@123',
      role: 'Content Manager',
      permissions: ['Images', 'Videos', 'Categories'],
      assignedBusinessCategories: ['Restaurant', 'Food'],
    },
    {
      email: 'raj@marketbrand.com',
      name: 'Raj Patel',
      password: 'Raj@456',
      role: 'Customer Support',
      permissions: ['Customers', 'Installed Users'],
      assignedBusinessCategories: ['Wedding Planning'],
    },
    {
      email: 'sneha@marketbrand.com',
      name: 'Sneha Gupta',
      password: 'Sneha@789',
      role: 'Marketing Manager',
      permissions: ['Images', 'Videos', 'Customers'],
      assignedBusinessCategories: ['Electronics', 'Fashion'],
    },
  ];

  for (const subadminData of subadmins) {
    const hashedPassword = await bcrypt.hash(subadminData.password, 12);
    await prisma.subadmin.upsert({
      where: { email: subadminData.email },
      update: {},
      create: {
        email: subadminData.email,
        name: subadminData.name,
        password: hashedPassword,
        role: subadminData.role,
        permissions: JSON.stringify(subadminData.permissions),
        assignedCategories: JSON.stringify(subadminData.assignedBusinessCategories),
        createdBy: admin.id,
      },
    });
  }

  console.log('✅ Created subadmin users');

  // Create sample customers
  const customers = [
    {
      email: 'john@restaurant.com',
      name: 'John Smith',
      phone: '+1-555-0101',
      selectedCategory: 'Restaurant',
    },
    {
      email: 'sarah@weddings.com',
      name: 'Sarah Johnson',
      phone: '+1-555-0102',
      selectedCategory: 'Wedding Planning',
    },
    {
      email: 'mike@electronics.com',
      name: 'Mike Chen',
      phone: '+1-555-0103',
      selectedCategory: 'Electronics',
    },
  ];

  for (const customerData of customers) {
    const businessCategory = await prisma.businessCategory.findUnique({
      where: { name: customerData.selectedCategory },
    });

    await prisma.customer.upsert({
      where: { email: customerData.email },
      update: {},
      create: {
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        selectedBusinessCategoryId: businessCategory?.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        subscriptionAmount: 99.99,
        paymentMethod: 'card',
      },
    });
  }

  console.log('✅ Created sample customers');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
