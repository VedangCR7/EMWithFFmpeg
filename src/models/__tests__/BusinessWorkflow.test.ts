import { UserModel } from '../User';
import { BusinessModel } from '../Business';
import { PlanModel } from '../Plan';
import { VideoModel } from '../Video';
import { TransactionModel } from '../Transaction';

describe('Business Workflow Integration', () => {
  test('should handle complete business onboarding flow', () => {
    // Step 1: User signs up
    const user = new UserModel('user1', 'Jane Entrepreneur', 'jane@startup.com', '+1987654321');

    expect(user.isValid()).toBe(true);
    expect(user.role).toBe('user');
    expect(user.isVerified).toBe(false);

    // Step 2: User creates business profile
    const business = new BusinessModel(
      'business1',
      user.id,
      'Jane\'s Creative Studio',
      'marketing',
      {
        email: user.email,
        phone: user.phone,
        website: 'https://janesstudio.com'
      },
      'Full-service creative agency specializing in video marketing',
      'logo.png',
      'banner.jpg'
    );

    expect(business.isValid()).toBe(true);
    expect(business.userId).toBe(user.id);
    expect(business.isVerified).toBe(false);
    expect(business.subscriptionStatus).toBe('inactive');

    // Step 3: User gets verified
    user.verify();
    business.verify();

    expect(user.isVerified).toBe(true);
    expect(business.isVerified).toBe(true);

    // Step 4: Business subscribes to a plan
    const proPlan = new PlanModel(
      'plan_pro',
      'Professional Plan',
      'Perfect for growing businesses',
      99.99,
      'USD',
      'monthly',
      [
        { name: 'Videos', value: 100, description: 'Up to 100 videos' },
        { name: 'Storage', value: '500GB', description: '500GB storage' },
        { name: 'Priority Support', value: true, description: '24/7 priority support' }
      ],
      100,
      200,
      500 * 1024 * 1024 * 1024, // 500GB in bytes
      true // popular
    );

    user.planId = proPlan.id;
    user.role = 'business';

    // Step 5: Business activates subscription
    business.activate();
    business.planId = proPlan.id;

    expect(business.subscriptionStatus).toBe('active');
    expect(user.role).toBe('business');
    expect(user.isBusiness()).toBe(true);

    // Step 6: Business creates content within plan limits
    const videos = [];
    for (let i = 0; i < 10; i++) {
      const video = new VideoModel(
        `video${i}`,
        user.id,
        `Business Video ${i}`,
        `Professional content ${i}`,
        `https://cdn.example.com/video${i}.mp4`,
        'business',
        `https://cdn.example.com/thumb${i}.jpg`,
        180 + i * 30, // Different durations
        'published'
      );
      videos.push(video);
    }

    // Verify plan limits
    expect(proPlan.canCreateVideo(videos.length)).toBe(true);
    expect(videos.every(v => v.isValid())).toBe(true);

    // Step 7: Content gets engagement
    videos.forEach((video, index) => {
      const views = (index + 1) * 100; // Video 0: 100 views, Video 1: 200 views, etc.
      for (let v = 0; v < views; v++) video.incrementViews();

      const likes = Math.floor(views * 0.1); // 10% like rate
      for (let l = 0; l < likes; l++) video.like();

      // Record analytics
      video.updateAnalytics({
        watchTime: views * 120, // 2 minutes average watch time
        completionRate: 85 + (index * 2) // Increasing completion rates
      });
    });

    // Step 8: Business generates revenue
    const transactions = videos.map((video, index) =>
      new TransactionModel(
        `txn_${index}`,
        user.id,
        'payment',
        49.99,
        'USD',
        [{
          id: `license_${video.id}`,
          type: 'video',
          description: `License for ${video.title}`,
          amount: 49.99,
          quantity: 1
        }],
        'completed',
        business.id
      )
    );

    // Step 9: Update user and business stats
    const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
    const totalRevenue = transactions.reduce((sum, txn) => sum + txn.amount, 0);

    user.incrementStats({
      totalVideos: videos.length,
      totalViews: totalViews
    });

    // Verify complete business metrics
    expect(user.stats.totalVideos).toBe(10);
    expect(user.stats.totalViews).toBe(totalViews);
    expect(business.subscriptionStatus).toBe('active');
    expect(transactions.every(t => t.isCompleted())).toBe(true);
    expect(totalRevenue).toBe(499.90); // 10 videos * $49.99
    expect(proPlan.isPopular).toBe(true);
  });

  test('should handle business scaling and plan upgrades', () => {
    // Start with small business
    const user = new UserModel('user1', 'Growing Business', 'grow@business.com');
    const business = new BusinessModel('biz1', user.id, 'Growing Co', 'ecommerce');

    // Start with basic plan
    const basicPlan = new PlanModel('basic', 'Basic', 'Starter plan', 29.99, 'USD', 'monthly', [], 25, 50, 50 * 1024 * 1024 * 1024); // 50GB
    user.planId = basicPlan.id;
    business.activate();

    // Create initial content
    const initialVideos = [];
    for (let i = 0; i < 20; i++) {
      const video = new VideoModel(`video${i}`, user.id, `Product Video ${i}`, 'Product showcase', `url${i}`, 'ecommerce');
      initialVideos.push(video);
    }

    expect(basicPlan.canCreateVideo(initialVideos.length)).toBe(true);

    // Business grows - hits limits
    const moreVideos = [];
    for (let i = 20; i < 30; i++) {
      const video = new VideoModel(`video${i}`, user.id, `Product Video ${i}`, 'Product showcase', `url${i}`, 'ecommerce');
      moreVideos.push(video);
    }

    // Should not be able to create more under basic plan
    expect(basicPlan.canCreateVideo(initialVideos.length + moreVideos.length)).toBe(false);

    // Upgrade to professional plan
    const proPlan = new PlanModel('pro', 'Professional', 'Advanced plan', 79.99, 'USD', 'monthly', [], 100, 200, 200 * 1024 * 1024 * 1024); // 200GB

    // Process upgrade transaction
    const upgradeTxn = new TransactionModel('upgrade_txn', user.id, 'subscription', 79.99, 'USD', [
      { id: 'plan_upgrade', type: 'subscription', description: 'Upgrade to Professional Plan', amount: 79.99, quantity: 1 }
    ], 'completed', business.id);

    user.planId = proPlan.id;

    // Now can create more content
    expect(proPlan.canCreateVideo(initialVideos.length + moreVideos.length)).toBe(true);
    expect(upgradeTxn.isCompleted()).toBe(true);

    // Business continues to scale
    const allVideos = [...initialVideos, ...moreVideos];
    allVideos.forEach(video => video.publish());

    user.incrementStats({
      totalVideos: allVideos.length,
      totalViews: allVideos.length * 1000 // Assume 1000 views per video
    });

    expect(user.stats.totalVideos).toBe(30);
    expect(user.stats.totalViews).toBe(30000);
  });

  test('should manage business team collaboration', () => {
    // Create business owner
    const owner = new UserModel('owner1', 'Business Owner', 'owner@company.com');
    owner.role = 'business';

    // Create business
    const business = new BusinessModel('biz1', owner.id, 'Team Company', 'marketing');
    business.activate();

    // Add team members
    const teamMembers = [
      new UserModel('member1', 'Designer', 'designer@company.com', '', business.id),
      new UserModel('member2', 'Editor', 'editor@company.com', '', business.id),
      new UserModel('member3', 'Marketer', 'marketer@company.com', '', business.id)
    ];

    // All team members should be linked to the business
    teamMembers.forEach(member => {
      expect(member.businessId).toBe(business.id);
    });

    // Team creates collaborative content
    const collaborativeVideos = teamMembers.map((member, index) =>
      new VideoModel(
        `collab_video${index}`,
        member.id,
        `Team Project ${index + 1}`,
        `Collaborative content by ${member.name}`,
        `https://cdn.company.com/video${index}.mp4`,
        'marketing',
        `https://cdn.company.com/thumb${index}.jpg`,
        240,
        'published'
      )
    );

    // Owner oversees all content
    owner.incrementStats({
      totalVideos: collaborativeVideos.length,
      totalViews: collaborativeVideos.length * 500
    });

    // Business tracks team performance
    teamMembers.forEach(member => {
      member.incrementStats({
        totalVideos: 1,
        totalViews: 500
      });
    });

    // Verify team collaboration metrics
    expect(owner.stats.totalVideos).toBe(3);
    expect(owner.stats.totalViews).toBe(1500);
    expect(teamMembers.every(member => member.stats.totalVideos === 1)).toBe(true);
    expect(teamMembers.every(member => member.stats.totalViews === 500)).toBe(true);
    expect(collaborativeVideos.every(video => video.isPublished())).toBe(true);
  });

  test('should handle business subscription lifecycle', () => {
    const user = new UserModel('user1', 'Subscriber', 'sub@test.com');
    const business = new BusinessModel('biz1', user.id, 'Sub Biz', 'consulting');

    // Initial state
    expect(business.subscriptionStatus).toBe('inactive');

    // Subscribe to plan
    const plan = new PlanModel('plan1', 'Monthly Plan', 'Monthly subscription', 49.99, 'USD', 'monthly');
    const subscriptionTxn = new TransactionModel('sub_txn', user.id, 'subscription', 49.99, 'USD', [], 'completed', business.id);

    business.activate();
    expect(business.subscriptionStatus).toBe('active');
    expect(subscriptionTxn.isCompleted()).toBe(true);

    // Monthly billing cycle
    const monthlyBillings = [];
    for (let month = 1; month <= 12; month++) {
      const billingTxn = new TransactionModel(
        `billing_${month}`,
        user.id,
        'subscription',
        49.99,
        'USD',
        [{
          id: `billing_${month}`,
          type: 'subscription',
          description: `Monthly billing - Month ${month}`,
          amount: 49.99,
          quantity: 1
        }],
        'completed',
        business.id
      );
      monthlyBillings.push(billingTxn);
    }

    // Business creates content during subscription
    const videos = [];
    for (let i = 0; i < 50; i++) {
      const video = new VideoModel(`video${i}`, user.id, `Content ${i}`, 'Business content', `url${i}`, 'consulting');
      videos.push(video);
    }

    // Subscription renewal
    const renewalTxn = new TransactionModel('renewal_txn', user.id, 'subscription', 49.99, 'USD', [
      { id: 'renewal', type: 'subscription', description: 'Annual subscription renewal', amount: 49.99, quantity: 1 }
    ], 'completed', business.id);

    // Calculate total subscription revenue
    const totalSubscriptionRevenue = [
      subscriptionTxn,
      ...monthlyBillings,
      renewalTxn
    ].reduce((sum, txn) => sum + txn.amount, 0);

    expect(totalSubscriptionRevenue).toBe(49.99 * 14); // Initial + 12 months + renewal
    expect(monthlyBillings.every(txn => txn.isCompleted())).toBe(true);
    expect(business.subscriptionStatus).toBe('active');
    expect(plan.canCreateVideo(videos.length)).toBe(true);
  });

  test('should handle business payment failures and retries', () => {
    const user = new UserModel('user1', 'Payment User', 'payment@test.com');
    const business = new BusinessModel('biz1', user.id, 'Payment Biz', 'services');

    // Successful initial subscription
    const initialTxn = new TransactionModel('initial_sub', user.id, 'subscription', 99.99, 'USD', [], 'completed', business.id);
    business.activate();

    expect(initialTxn.isCompleted()).toBe(true);
    expect(business.subscriptionStatus).toBe('active');

    // Payment failure scenario
    const failedTxn = new TransactionModel('failed_billing', user.id, 'subscription', 99.99, 'USD', [], 'failed', business.id);

    expect(failedTxn.isFailed()).toBe(true);

    // Business gets suspended due to failed payment
    business.suspend();
    expect(business.subscriptionStatus).toBe('suspended');

    // Retry payment successfully
    const retryTxn = new TransactionModel('retry_billing', user.id, 'subscription', 99.99, 'USD', [], 'completed', business.id);

    business.activate();
    expect(business.subscriptionStatus).toBe('active');
    expect(retryTxn.isCompleted()).toBe(true);

    // User can continue creating content
    const video = new VideoModel('recovery_video', user.id, 'Recovery Content', 'Content after payment recovery', 'url', 'services');
    expect(video.isValid()).toBe(true);
  });
});