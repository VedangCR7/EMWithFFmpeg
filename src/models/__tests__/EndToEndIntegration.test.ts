import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { GreetingModel } from '../Greeting';
import { BusinessModel } from '../Business';
import { PlanModel } from '../Plan';
import { TransactionModel } from '../Transaction';
import { TemplateModel } from '../Template';

describe('End-to-End Integration Tests', () => {
  test('should complete full user journey from signup to monetization', () => {
    // Phase 1: User Registration and Profile Setup
    const user = new UserModel('journey_user', 'Journey User', 'journey@test.com', '+1234567890');
    expect(user.isValid()).toBe(true);
    expect(user.role).toBe('user');
    expect(user.isVerified).toBe(false);

    // Complete profile setup
    user.updateProfile({
      bio: 'Content creator passionate about video marketing',
      website: 'https://journeyuser.com',
      avatar: 'avatar.jpg',
      banner: 'banner.jpg'
    });

    user.updateSocialLinks({
      twitter: '@journeyuser',
      linkedin: 'journey-user-business',
      youtube: 'JourneyUserChannel'
    });

    user.verify();
    expect(user.isVerified).toBe(true);
    expect(user.getProfileCompletion()).toBeGreaterThan(50);

    // Phase 2: Business Creation and Subscription
    const business = new BusinessModel('journey_biz', user.id, 'Journey Creative Studio', 'marketing');
    business.verify();

    const plan = new PlanModel('premium_plan', 'Premium Plan', 'Full-featured plan', 49.99, 'USD', 'monthly', [], 100, 200, 50, true);
    user.planId = plan.id;
    user.role = 'business';
    business.activate();

    expect(business.isVerified).toBe(true);
    expect(business.subscriptionStatus).toBe('active');
    expect(user.isBusiness()).toBe(true);

    // Phase 3: Content Creation and Template Usage
    const templates = [
      new TemplateModel('promo_temp', 'Video Promo', 'Professional promo template', 'marketing', 'video', 'promo.jpg', 'admin'),
      new TemplateModel('welcome_temp', 'Welcome Message', 'Business welcome template', 'business', 'greeting', 'welcome.jpg', 'admin')
    ];

    templates.forEach(template => template.activate());

    // Create content using templates
    const video = new VideoModel(
      'journey_video',
      user.id,
      'Our Services Promo',
      'Professional service introduction',
      'promo_video.mp4',
      'marketing',
      'promo_thumb.jpg',
      180,
      'processing'
    );

    const greeting = new GreetingModel(
      'journey_greeting',
      user.id,
      templates[1].id,
      'Welcome to Our Studio',
      'Thank you for choosing our services',
      'welcome_video.mp4'
    );

    // Process video
    video.updateProgress(100);
    video.publish();

    // Publish greeting
    greeting.publish();

    expect(video.isPublished()).toBe(true);
    expect(greeting.status).toBe('published');

    // Phase 4: Content Distribution and Engagement
    // Simulate audience engagement
    for (let i = 0; i < 1500; i++) video.incrementViews();
    for (let i = 0; i < 120; i++) video.like();
    for (let i = 0; i < 45; i++) video.share();
    for (let i = 0; i < 23; i++) video.addComment();

    for (let i = 0; i < 300; i++) greeting.incrementViews();
    for (let i = 0; i < 15; i++) greeting.incrementDownloads();
    greeting.updateRating(4.8);

    // Update analytics
    video.updateAnalytics({
      watchTime: 1500 * 120, // 2 minutes average watch time
      completionRate: 87.5,
      audienceRetention: [95, 92, 88, 85, 82]
    });

    // Phase 5: Monetization and Revenue Generation
    const videoLicenseTxn = new TransactionModel(
      'video_license_txn',
      'customer1',
      'payment',
      29.99,
      'USD',
      [{
        id: 'video_license',
        type: 'video',
        description: 'Video licensing fee',
        amount: 29.99,
        quantity: 1
      }],
      'completed',
      business.id
    );

    const greetingLicenseTxn = new TransactionModel(
      'greeting_license_txn',
      'customer2',
      'payment',
      19.99,
      'USD',
      [{
        id: 'greeting_license',
        type: 'greeting',
        description: 'Greeting customization fee',
        amount: 19.99,
        quantity: 1
      }],
      'completed',
      business.id
    );

    // Phase 6: Analytics and Performance Tracking
    user.incrementStats({
      totalVideos: 1,
      totalGreetings: 1,
      totalViews: video.views + greeting.views,
      totalLikes: video.likes,
      totalDownloads: greeting.downloads
    });

    // Phase 7: Business Scaling and Expansion
    // Add team member
    const teamMember = new UserModel('team_member', 'Team Member', 'team@journeystudio.com', '', business.id);
    teamMember.role = 'creator';

    // Team member creates content
    const teamVideo = new VideoModel(
      'team_video',
      teamMember.id,
      'Team Project Video',
      'Collaborative team content',
      'team_video.mp4',
      'marketing'
    );

    teamVideo.updateProgress(100);
    teamVideo.publish();

    // Update business and user stats
    user.incrementStats({ totalVideos: 1 });
    teamMember.incrementStats({ totalVideos: 1 });

    // Phase 8: Subscription Management
    const monthlyRenewalTxn = new TransactionModel(
      'monthly_renewal',
      user.id,
      'subscription',
      49.99,
      'USD',
      [{
        id: 'monthly_subscription',
        type: 'subscription',
        description: 'Monthly premium subscription',
        amount: 49.99,
        quantity: 1
      }],
      'completed',
      business.id
    );

    // Final Verification: Complete Business Ecosystem
    expect(user.isVerified).toBe(true);
    expect(user.isBusiness()).toBe(true);
    expect(business.isVerified).toBe(true);
    expect(business.subscriptionStatus).toBe('active');

    expect(video.isPublished()).toBe(true);
    expect(greeting.status).toBe('published');
    expect(teamVideo.isPublished()).toBe(true);

    expect(video.views).toBe(1500);
    expect(video.likes).toBe(120);
    expect(greeting.views).toBe(300);
    expect(greeting.downloads).toBe(15);

    expect(videoLicenseTxn.isCompleted()).toBe(true);
    expect(greetingLicenseTxn.isCompleted()).toBe(true);
    expect(monthlyRenewalTxn.isCompleted()).toBe(true);

    const totalRevenue = [videoLicenseTxn, greetingLicenseTxn, monthlyRenewalTxn]
      .reduce((sum, txn) => sum + txn.amount, 0);
    expect(totalRevenue).toBe(99.97);

    expect(user.stats.totalVideos).toBe(2); // User's video + team video
    expect(teamMember.stats.totalVideos).toBe(1);

    expect(user.getEngagementScore()).toBeGreaterThan(10000);
    expect(user.getProfileCompletion()).toBeGreaterThan(75);
  });

  test('should handle multi-tenant platform operations', () => {
    // Create multiple businesses on the platform
    const businesses = [];
    const businessOwners = [];
    const plans = [];

    // Create different plan tiers
    const starterPlan = new PlanModel('starter', 'Starter', 'Basic features', 9.99, 'USD', 'monthly', [], 10, 25, 5);
    const proPlan = new PlanModel('pro', 'Professional', 'Advanced features', 29.99, 'USD', 'monthly', [], 50, 100, 25);
    const enterprisePlan = new PlanModel('enterprise', 'Enterprise', 'All features', 99.99, 'USD', 'monthly', [], 0, 0, 0);

    plans.push(starterPlan, proPlan, enterprisePlan);

    // Create 20 businesses with different scales
    for (let i = 0; i < 20; i++) {
      const owner = new UserModel(`owner${i}`, `Business Owner ${i}`, `owner${i}@business.com`);
      owner.role = 'business';

      // Assign different plans based on business size
      let assignedPlan;
      if (i < 10) assignedPlan = starterPlan; // 50% starter
      else if (i < 17) assignedPlan = proPlan; // 35% pro
      else assignedPlan = enterprisePlan; // 15% enterprise

      owner.planId = assignedPlan.id;

      const business = new BusinessModel(`business${i}`, owner.id, `Business ${i}`, 'general');
      business.activate();

      // Create content based on plan limits
      const maxVideos = assignedPlan.maxVideos || 1000; // Unlimited = 1000 for testing
      const contentCount = Math.min(maxVideos, Math.floor(Math.random() * maxVideos) + 1);

      for (let j = 0; j < contentCount; j++) {
        const video = new VideoModel(
          `biz${i}_video${j}`,
          owner.id,
          `Business ${i} Content ${j}`,
          'Professional content',
          `video${i}_${j}.mp4`,
          'business'
        );
        video.updateProgress(100);
        video.publish();

        // Simulate engagement
        const views = Math.floor(Math.random() * 1000) + 50;
        for (let v = 0; v < views; v++) video.incrementViews();

        owner.incrementStats({ totalVideos: 1, totalViews: views });
      }

      businesses.push(business);
      businessOwners.push(owner);
    }

    // Platform-wide analytics
    const totalBusinesses = businesses.length;
    const activeBusinesses = businesses.filter(b => b.subscriptionStatus === 'active').length;
    const totalVideos = businessOwners.reduce((sum, owner) => sum + owner.stats.totalVideos, 0);
    const totalViews = businessOwners.reduce((sum, owner) => sum + owner.stats.totalViews, 0);

    const planDistribution = {
      starter: businessOwners.filter(o => o.planId === starterPlan.id).length,
      pro: businessOwners.filter(o => o.planId === proPlan.id).length,
      enterprise: businessOwners.filter(o => o.planId === enterprisePlan.id).length
    };

    // Verify platform metrics
    expect(totalBusinesses).toBe(20);
    expect(activeBusinesses).toBe(20); // All businesses are active
    expect(totalVideos).toBeGreaterThan(100); // Substantial content created
    expect(totalViews).toBeGreaterThan(10000); // Significant engagement

    expect(planDistribution.starter).toBe(10);
    expect(planDistribution.pro).toBe(7);
    expect(planDistribution.enterprise).toBe(3);

    // Revenue calculations
    const monthlyRevenue = businessOwners.reduce((sum, owner) => {
      const plan = plans.find(p => p.id === owner.planId);
      return sum + (plan?.price || 0);
    }, 0);

    expect(monthlyRevenue).toBeGreaterThan(400); // Substantial monthly recurring revenue

    // Content distribution by plan
    const starterContent = businessOwners
      .filter(o => o.planId === starterPlan.id)
      .reduce((sum, o) => sum + o.stats.totalVideos, 0);

    const proContent = businessOwners
      .filter(o => o.planId === proPlan.id)
      .reduce((sum, o) => sum + o.stats.totalVideos, 0);

    const enterpriseContent = businessOwners
      .filter(o => o.planId === enterprisePlan.id)
      .reduce((sum, o) => sum + o.stats.totalVideos, 0);

    // Enterprise should have more content due to unlimited plans
    expect(enterpriseContent).toBeGreaterThanOrEqual(proContent);
    expect(proContent).toBeGreaterThanOrEqual(starterContent);
  });

  test('should manage platform-wide content marketplace', () => {
    // Create template creators and marketplace
    const templateCreators = [];
    const templates = [];
    const contentConsumers = [];

    // Create 5 template creators
    for (let i = 0; i < 5; i++) {
      const creator = new UserModel(`template_creator${i}`, `Template Creator ${i}`, `creator${i}@templates.com`);
      creator.role = 'creator';
      templateCreators.push(creator);
    }

    // Create 50 templates across different categories
    const categories = ['business', 'birthday', 'wedding', 'marketing', 'educational'];
    const types: Array<'video' | 'greeting'> = ['video', 'greeting'];

    for (let i = 0; i < 50; i++) {
      const creator = templateCreators[i % templateCreators.length];
      const category = categories[i % categories.length];
      const type = types[i % types.length];
      const isPremium = Math.random() > 0.6; // 40% premium

      const template = new TemplateModel(
        `template${i}`,
        `Template ${i}`,
        `Professional ${category} ${type} template`,
        category,
        type,
        `thumb${i}.jpg`,
        creator.id
      );

      if (isPremium) template.markAsPremium();
      template.activate();

      templates.push(template);
      creator.incrementStats({ totalVideos: type === 'video' ? 1 : 0, totalGreetings: type === 'greeting' ? 1 : 0 });
    }

    // Create 100 content consumers
    for (let i = 0; i < 100; i++) {
      const consumer = new UserModel(`consumer${i}`, `Consumer ${i}`, `consumer${i}@email.com`);
      contentConsumers.push(consumer);
    }

    // Simulate marketplace activity
    const transactions = [];
    let totalUsage = 0;

    contentConsumers.forEach((consumer, consumerIndex) => {
      // Each consumer uses 5-15 templates
      const templatesToUse = Math.floor(Math.random() * 11) + 5; // 5-15 templates

      for (let i = 0; i < templatesToUse; i++) {
        const template = templates[Math.floor(Math.random() * templates.length)];

        // Record template usage
        template.recordUsage(consumer.id);
        totalUsage++;

        // Create transaction if premium
        if (template.isPremium) {
          const transaction = new TransactionModel(
            `usage_txn_${consumerIndex}_${i}`,
            consumer.id,
            'payment',
            4.99,
            'USD',
            [{
              id: `template_usage_${template.id}`,
              type: template.type,
              description: `Premium ${template.name} usage`,
              amount: 4.99,
              quantity: 1
            }],
            'completed'
          );
          transactions.push(transaction);
        }

        // Consumer creates content using template
        if (template.type === 'video') {
          const video = new VideoModel(
            `consumer_video_${consumerIndex}_${i}`,
            consumer.id,
            `My ${template.category} Video`,
            `Created using ${template.name}`,
            `consumer_video_${consumerIndex}_${i}.mp4`,
            template.category
          );
          video.updateProgress(100);
          video.publish();

          // Simulate engagement
          const views = Math.floor(Math.random() * 500) + 50;
          for (let v = 0; v < views; v++) video.incrementViews();

          consumer.incrementStats({ totalVideos: 1, totalViews: views });
        } else {
          const greeting = new GreetingModel(
            `consumer_greeting_${consumerIndex}_${i}`,
            consumer.id,
            template.id,
            `My ${template.category} Greeting`,
            `Created using ${template.name}`
          );
          greeting.publish();

          consumer.incrementStats({ totalGreetings: 1 });
        }
      }
    });

    // Marketplace analytics
    const totalTemplates = templates.length;
    const premiumTemplates = templates.filter(t => t.isPremium).length;
    const freeTemplates = templates.filter(t => !t.isPremium).length;
    const totalConsumers = contentConsumers.length;
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, txn) => sum + txn.amount, 0);

    const averageTemplatesPerConsumer = totalUsage / totalConsumers;
    const premiumConversionRate = totalTransactions / totalUsage * 100;

    const mostUsedTemplate = templates.reduce((most, current) =>
      current.usageCount > most.usageCount ? current : most
    );

    // Verify marketplace performance
    expect(totalTemplates).toBe(50);
    expect(premiumTemplates + freeTemplates).toBe(50);
    expect(totalConsumers).toBe(100);
    expect(totalUsage).toBeGreaterThan(500); // Substantial usage
    expect(averageTemplatesPerConsumer).toBeGreaterThan(5);
    expect(premiumConversionRate).toBeGreaterThan(0); // Some premium usage
    expect(totalRevenue).toBe(totalTransactions * 4.99);
    expect(mostUsedTemplate.usageCount).toBeGreaterThan(0);

    // Template creators should have created content
    templateCreators.forEach(creator => {
      expect(creator.stats.totalVideos + creator.stats.totalGreetings).toBeGreaterThan(0);
    });

    // Consumers should have created content
    const totalConsumerVideos = contentConsumers.reduce((sum, c) => sum + c.stats.totalVideos, 0);
    const totalConsumerGreetings = contentConsumers.reduce((sum, c) => sum + c.stats.totalGreetings, 0);

    expect(totalConsumerVideos).toBeGreaterThan(0);
    expect(totalConsumerGreetings).toBeGreaterThan(0);
    expect(totalConsumerVideos + totalConsumerGreetings).toBeGreaterThan(totalUsage);
  });
});