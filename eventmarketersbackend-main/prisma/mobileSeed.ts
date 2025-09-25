import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMobileData() {
  console.log('🌱 Seeding mobile app data...');

  try {
    // 1. Create Template Categories
    console.log('📋 Creating template categories...');
    const templateCategories = [
      { name: 'Business', description: 'Professional business templates', icon: '💼', sortOrder: 1 },
      { name: 'Festival', description: 'Festival and celebration templates', icon: '🎉', sortOrder: 2 },
      { name: 'Daily', description: 'Daily use templates', icon: '📅', sortOrder: 3 },
      { name: 'Wedding', description: 'Wedding and marriage templates', icon: '💒', sortOrder: 4 },
      { name: 'Birthday', description: 'Birthday celebration templates', icon: '🎂', sortOrder: 5 }
    ];

    for (const category of templateCategories) {
      await prisma.templateCategory.upsert({
        where: { name: category.name },
        update: category,
        create: category
      });
    }

    // 2. Create Template Languages
    console.log('🌍 Creating template languages...');
    const templateLanguages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' }
    ];

    for (const language of templateLanguages) {
      await prisma.templateLanguage.upsert({
        where: { code: language.code },
        update: language,
        create: language
      });
    }

    // 3. Create Greeting Categories
    console.log('💬 Creating greeting categories...');
    const greetingCategories = [
      { name: 'Good Morning', description: 'Good morning greetings', icon: '🌅', sortOrder: 1 },
      { name: 'Good Evening', description: 'Good evening greetings', icon: '🌆', sortOrder: 2 },
      { name: 'Festival', description: 'Festival greetings', icon: '🎊', sortOrder: 3 },
      { name: 'Birthday', description: 'Birthday wishes', icon: '🎂', sortOrder: 4 },
      { name: 'Wedding', description: 'Wedding wishes', icon: '💒', sortOrder: 5 },
      { name: 'Thank You', description: 'Thank you messages', icon: '🙏', sortOrder: 6 },
      { name: 'Congratulations', description: 'Congratulations messages', icon: '🎉', sortOrder: 7 }
    ];

    for (const category of greetingCategories) {
      await prisma.greetingCategory.upsert({
        where: { name: category.name },
        update: category,
        create: category
      });
    }

    // 4. Create Mobile Subscription Plans
    console.log('💳 Creating subscription plans...');
    const subscriptionPlans = [
      {
        name: 'Monthly Pro',
        description: 'Monthly subscription with premium features',
        price: 299,
        originalPrice: 499,
        currency: 'INR',
        period: 'month',
        features: JSON.stringify([
          'Access to all premium business templates',
          'Unlimited downloads',
          'High-resolution content',
          'Priority customer support',
          'Advanced customization tools'
        ]),
        sortOrder: 1
      },
      {
        name: 'Yearly Pro',
        description: 'Yearly subscription with maximum savings',
        price: 2999,
        originalPrice: 5988,
        currency: 'INR',
        period: 'year',
        features: JSON.stringify([
          'Access to all premium business templates',
          'Unlimited downloads',
          'High-resolution content',
          'Priority customer support',
          'Advanced customization tools',
          'Exclusive yearly content',
          'Free updates and new features'
        ]),
        sortOrder: 2
      },
      {
        name: 'Lifetime Pro',
        description: 'One-time payment for lifetime access',
        price: 9999,
        originalPrice: 19999,
        currency: 'INR',
        period: 'lifetime',
        features: JSON.stringify([
          'Lifetime access to all premium content',
          'Unlimited downloads forever',
          'All future updates included',
          'Premium customer support',
          'Exclusive lifetime member content',
          'No recurring payments'
        ]),
        sortOrder: 3
      }
    ];

    for (const plan of subscriptionPlans) {
      await prisma.mobileSubscriptionPlan.upsert({
        where: { name: plan.name },
        update: plan,
        create: plan
      });
    }

    // 5. Create Featured Content
    console.log('⭐ Creating featured content...');
    const featuredContent = [
      {
        title: 'Business Templates Collection',
        description: 'Professional templates for your business needs',
        imageUrl: '/uploads/featured/business-collection.jpg',
        type: 'banner',
        category: 'business',
        priority: 1,
        isActive: true
      },
      {
        title: 'Festival Special',
        description: 'Celebrate festivals with our special templates',
        imageUrl: '/uploads/featured/festival-special.jpg',
        type: 'banner',
        category: 'festival',
        priority: 2,
        isActive: true
      },
      {
        title: 'Wedding Season',
        description: 'Beautiful templates for wedding celebrations',
        imageUrl: '/uploads/featured/wedding-season.jpg',
        type: 'banner',
        category: 'wedding',
        priority: 3,
        isActive: true
      }
    ];

    for (const content of featuredContent) {
      await prisma.featuredContent.upsert({
        where: { title: content.title },
        update: content,
        create: content
      });
    }

    // 6. Create Upcoming Events
    console.log('📅 Creating upcoming events...');
    const upcomingEvents = [
      {
        title: 'Diwali Festival',
        description: 'Celebrate Diwali with our special templates',
        imageUrl: '/uploads/events/diwali.jpg',
        date: new Date('2024-11-01'),
        location: 'All India',
        category: 'festival',
        isActive: true
      },
      {
        title: 'Wedding Season 2024',
        description: 'Beautiful wedding templates for the season',
        imageUrl: '/uploads/events/wedding-season.jpg',
        date: new Date('2024-12-01'),
        location: 'All India',
        category: 'wedding',
        isActive: true
      },
      {
        title: 'New Year 2025',
        description: 'Ring in the new year with our templates',
        imageUrl: '/uploads/events/new-year.jpg',
        date: new Date('2025-01-01'),
        location: 'Global',
        category: 'celebration',
        isActive: true
      }
    ];

    for (const event of upcomingEvents) {
      await prisma.upcomingEvent.upsert({
        where: { title: event.title },
        update: event,
        create: event
      });
    }

    // 7. Create Sample Stickers
    console.log('😊 Creating sample stickers...');
    const stickers = [
      { name: 'Happy Face', imageUrl: '/uploads/stickers/happy-face.png', category: 'emotions' },
      { name: 'Thumbs Up', imageUrl: '/uploads/stickers/thumbs-up.png', category: 'gestures' },
      { name: 'Heart', imageUrl: '/uploads/stickers/heart.png', category: 'emotions' },
      { name: 'Star', imageUrl: '/uploads/stickers/star.png', category: 'symbols' },
      { name: 'Fire', imageUrl: '/uploads/stickers/fire.png', category: 'symbols' }
    ];

    for (const sticker of stickers) {
      await prisma.sticker.upsert({
        where: { name: sticker.name },
        update: sticker,
        create: sticker
      });
    }

    // 8. Create Sample Emojis
    console.log('😀 Creating sample emojis...');
    const emojis = [
      { name: 'Grinning Face', unicode: '😀', imageUrl: '/uploads/emojis/grinning-face.png', category: 'faces' },
      { name: 'Heart Eyes', unicode: '😍', imageUrl: '/uploads/emojis/heart-eyes.png', category: 'faces' },
      { name: 'Thumbs Up', unicode: '👍', imageUrl: '/uploads/emojis/thumbs-up.png', category: 'gestures' },
      { name: 'Red Heart', unicode: '❤️', imageUrl: '/uploads/emojis/red-heart.png', category: 'symbols' },
      { name: 'Party Popper', unicode: '🎉', imageUrl: '/uploads/emojis/party-popper.png', category: 'celebration' }
    ];

    for (const emoji of emojis) {
      await prisma.emoji.upsert({
        where: { name: emoji.name },
        update: emoji,
        create: emoji
      });
    }

    console.log('✅ Mobile app data seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding mobile data:', error);
    throw error;
  }
}

// Run the seed function
seedMobileData()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export default seedMobileData;
