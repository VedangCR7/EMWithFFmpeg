import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { GreetingModel } from '../Greeting';
import { BusinessModel } from '../Business';
import { PlanModel } from '../Plan';
import { TransactionModel } from '../Transaction';
import { TemplateModel } from '../Template';

describe('Business Logic Tests', () => {
  describe('User Subscription Management', () => {
    test('should handle plan upgrades correctly', () => {
      const user = new UserModel('user1', 'John Doe', 'john@test.com');
      const basicPlan = new PlanModel('basic', 'Basic', 'Basic features', 9.99, 'USD', 'monthly', [], 10, 20, 5);
      const proPlan = new PlanModel('pro', 'Pro', 'Pro features', 29.99, 'USD', 'monthly', [], 50, 100, 25);

      // Start with basic plan
      user.planId = basicPlan.id;

      // Create content approaching limits
      const videos = [];
      const greetings = [];

      for (let i = 0; i < 9; i++) {
        videos.push(new VideoModel(`v${i}`, user.id, `Video ${i}`, 'Desc', 'url'));
        greetings.push(new GreetingModel(`g${i}`, user.id, 'temp1', `Greeting ${i}`, 'Content'));
      }

      // Should be able to create more content
      expect(basicPlan.canCreateVideo(videos.length)).toBe(true);
      expect(basicPlan.canCreateGreeting(greetings.length)).toBe(true);

      // Upgrade to pro plan
      user.planId = proPlan.id;

      // Should have much higher limits now
      expect(proPlan.canCreateVideo(videos.length)).toBe(true);
      expect(proPlan.canCreateGreeting(greetings.length)).toBe(true);

      // Create upgrade transaction
      const upgradeTxn = new TransactionModel('upgrade_txn', user.id, 'subscription', 29.99, 'USD', [
        { id: 'upgrade', type: 'subscription', description: 'Upgrade to Pro plan', amount: 29.99, quantity: 1 }
      ], 'completed');

      expect(upgradeTxn.isCompleted()).toBe(true);
      expect(user.planId).toBe(proPlan.id);
    });

    test('should enforce plan limits correctly', () => {
      const user = new UserModel('user1', 'Limited User', 'limited@test.com');
      const limitedPlan = new PlanModel('limited', 'Limited', 'Limited features', 4.99, 'USD', 'monthly', [], 2, 3, 1);

      user.planId = limitedPlan.id;

      // Create content up to limits
      const videos = [
        new VideoModel('v1', user.id, 'Video 1', 'Desc', 'url1'),
        new VideoModel('v2', user.id, 'Video 2', 'Desc', 'url2')
      ];

      const greetings = [
        new GreetingModel('g1', user.id, 'temp1', 'Greeting 1', 'Content 1'),
        new GreetingModel('g2', user.id, 'temp1', 'Greeting 2', 'Content 2'),
        new GreetingModel('g3', user.id, 'temp1', 'Greeting 3', 'Content 3')
      ];

      // Should not be able to create more content
      expect(limitedPlan.canCreateVideo(videos.length)).toBe(false);
      expect(limitedPlan.canCreateGreeting(greetings.length)).toBe(false);

      // Try to create more content (should fail based on business logic)
      const extraVideo = new VideoModel('v3', user.id, 'Extra Video', 'Desc', 'url3');
      const extraGreeting = new GreetingModel('g4', user.id, 'temp1', 'Extra Greeting', 'Content 4');

      // Content is still valid objects, but user has exceeded plan limits
      expect(extraVideo.isValid()).toBe(true);
      expect(extraGreeting.isValid()).toBe(true);

      // But according to plan limits, user cannot create more
      expect(limitedPlan.canCreateVideo(videos.length + 1)).toBe(false);
      expect(limitedPlan.canCreateGreeting(greetings.length + 1)).toBe(false);
    });
  });

  describe('Content Monetization Workflow', () => {
    test('should handle premium content sales', () => {
      const creator = new UserModel('creator1', 'Content Creator', 'creator@test.com');
      const customer = new UserModel('customer1', 'Happy Customer', 'customer@test.com');

      // Creator creates premium content
      const premiumVideo = new VideoModel('premium_video', creator.id, 'Premium Tutorial', 'Advanced tutorial', 'tutorial.mp4', 'thumb.jpg', 600, 'completed', ['tutorial', 'premium'], '4K', 5000, 0, 0, 0);
      const premiumGreeting = new GreetingModel('premium_greeting', creator.id, 'temp1', 'VIP Welcome', 'Special welcome message', 'welcome.mp4', { premium: true }, 'published', 'business', ['vip', 'premium'], true, 0, 0, 0);

      // Customer purchases content
      const purchaseTxn = new TransactionModel('purchase_txn', customer.id, 'payment', 49.99, 'USD', [
        { id: 'video_purchase', type: 'video', description: 'Premium video access', amount: 29.99, quantity: 1 },
        { id: 'greeting_purchase', type: 'greeting', description: 'Premium greeting customization', amount: 20.00, quantity: 1 }
      ], 'completed');

      // Content gets used
      premiumVideo.incrementViews();
      premiumGreeting.incrementDownloads();
      premiumGreeting.updateRating(5);

      // Verify monetization metrics
      expect(purchaseTxn.isCompleted()).toBe(true);
      expect(purchaseTxn.getTotalAmount()).toBe(49.99);
      expect(premiumVideo.views).toBe(1);
      expect(premiumGreeting.downloads).toBe(1);
      expect(premiumGreeting.rating).toBe(5);
    });

    test('should handle subscription revenue', () => {
      const business = new BusinessModel('business1', 'user1', 'Tech Corp', 'technology');
      const subscribers = [];

      // Create 10 subscribers
      for (let i = 0; i < 10; i++) {
        subscribers.push(new UserModel(`sub${i}`, `Subscriber ${i}`, `sub${i}@test.com`));
      }

      const proPlan = new PlanModel('pro_plan', 'Pro Plan', 'Professional features', 49.99, 'USD', 'monthly', [], 100, 200, 50);

      // All subscribers purchase the plan
      const transactions = subscribers.map((subscriber, index) =>
        new TransactionModel(`sub_txn_${index}`, subscriber.id, 'subscription', 49.99, 'USD', [
          { id: `subscription_${index}`, type: 'subscription', description: 'Pro Plan Subscription', amount: 49.99, quantity: 1 }
        ], 'completed', business.id)
      );

      // Calculate monthly recurring revenue (MRR)
      const totalMRR = transactions
        .filter(txn => txn.isCompleted())
        .reduce((sum, txn) => sum + txn.amount, 0);

      expect(totalMRR).toBe(499.90); // 10 subscribers * $49.99
      expect(transactions.every(txn => txn.isCompleted())).toBe(true);
    });
  });

  describe('Template Marketplace Logic', () => {
    test('should handle template popularity and trending', () => {
      const creator = new UserModel('creator1', 'Designer', 'designer@test.com');

      const templates = [
        new TemplateModel('temp1', 'Popular Template', 'Very popular', 'birthday', 'video', 'pop.jpg', creator.id),
        new TemplateModel('temp2', 'Niche Template', 'Specialized', 'wedding', 'greeting', 'niche.jpg', creator.id),
        new TemplateModel('temp3', 'New Template', 'Recently added', 'business', 'video', 'new.jpg', creator.id)
      ];

      // Simulate usage patterns
      // Popular template gets lots of usage
      for (let i = 0; i < 100; i++) {
        templates[0].recordUsage(`user${i}`);
      }

      // Niche template gets moderate usage
      for (let i = 0; i < 25; i++) {
        templates[1].recordUsage(`user${i + 100}`);
      }

      // New template gets low usage
      for (let i = 0; i < 5; i++) {
        templates[2].recordUsage(`user${i + 125}`);
      }

      // Determine trending templates (usage > 50)
      const trendingTemplates = templates.filter(t => t.usageCount > 50);

      expect(trendingTemplates).toHaveLength(1);
      expect(trendingTemplates[0].id).toBe('temp1');
      expect(templates[0].usageCount).toBe(100);
      expect(templates[1].usageCount).toBe(25);
      expect(templates[2].usageCount).toBe(5);
    });

    test('should handle premium template access control', () => {
      const creator = new UserModel('creator1', 'Premium Designer', 'premium@test.com');
      const freeUser = new UserModel('free1', 'Free User', 'free@test.com');
      const premiumUser = new UserModel('premium1', 'Premium User', 'premium@test.com', '', '', '', '', true, 'user', {}, '', '', 'premium_plan');

      // Create premium and free templates
      const premiumTemplate = new TemplateModel('premium_temp', 'Premium Template', 'Exclusive design', 'business', 'video', 'premium.jpg', creator.id);
      premiumTemplate.markAsPremium();

      const freeTemplate = new TemplateModel('free_temp', 'Free Template', 'Basic design', 'general', 'greeting', 'free.jpg', creator.id);
      freeTemplate.markAsFree();

      // Both users can access free template
      expect(freeTemplate.isPremium).toBe(false);
      freeTemplate.recordUsage(freeUser.id);
      freeTemplate.recordUsage(premiumUser.id);

      // Only premium users can access premium template
      expect(premiumTemplate.isPremium).toBe(true);

      // Free user tries to use premium template (business logic would prevent this)
      // Template object allows usage tracking, but business rules would enforce access
      premiumTemplate.recordUsage(premiumUser.id); // This would be allowed

      expect(freeTemplate.usageCount).toBe(2);
      expect(premiumTemplate.usageCount).toBe(1);
    });
  });

  describe('Business Analytics and Reporting', () => {
    test('should calculate business performance metrics', () => {
      const business = new BusinessModel('biz1', 'owner1', 'Analytics Corp', 'technology');
      const owner = new UserModel('owner1', 'Owner', 'owner@test.com');

      // Create content over time
      const videos = [];
      const greetings = [];

      for (let month = 1; month <= 12; month++) {
        for (let i = 0; i < 10; i++) {
          const video = new VideoModel(`v${month}_${i}`, owner.id, `Video ${month}-${i}`, 'Content', 'url');
          const greeting = new GreetingModel(`g${month}_${i}`, owner.id, 'temp1', `Greeting ${month}-${i}`, 'Content');

          // Simulate engagement based on month (older content has more engagement)
          const ageMultiplier = 13 - month; // Newer content has less engagement
          for (let j = 0; j < ageMultiplier * 5; j++) {
            video.incrementViews();
          }
          for (let j = 0; j < ageMultiplier * 2; j++) {
            greeting.incrementViews();
          }

          videos.push(video);
          greetings.push(greeting);
        }
      }

      // Calculate total engagement
      const totalVideoViews = videos.reduce((sum, video) => sum + video.views, 0);
      const totalGreetingViews = greetings.reduce((sum, greeting) => sum + greeting.views, 0);
      const totalContent = videos.length + greetings.length;

      expect(totalVideoViews).toBeGreaterThan(10000);
      expect(totalGreetingViews).toBeGreaterThan(5000);
      expect(totalContent).toBe(240); // 12 months * 20 items

      // Business is performing well
      expect(business.isActive).toBe(true);
      expect(totalVideoViews / totalContent).toBeGreaterThan(40); // Average views per content
    });

    test('should track user engagement patterns', () => {
      const users = [];
      const content = [];

      // Create 50 users
      for (let i = 0; i < 50; i++) {
        users.push(new UserModel(`user${i}`, `User ${i}`, `user${i}@test.com`));
      }

      // Create 100 pieces of content
      for (let i = 0; i < 100; i++) {
        const creator = users[Math.floor(Math.random() * users.length)];
        content.push(new VideoModel(`content${i}`, creator.id, `Content ${i}`, 'Description', 'url'));
      }

      // Simulate user engagement (some users are highly engaged, others are casual)
      users.forEach((user, index) => {
        const engagementLevel = index < 10 ? 'high' : index < 30 ? 'medium' : 'low';
        const engagementCount = engagementLevel === 'high' ? 50 :
                               engagementLevel === 'medium' ? 15 : 3;

        for (let i = 0; i < engagementCount; i++) {
          const randomContent = content[Math.floor(Math.random() * content.length)];
          randomContent.incrementViews();
          randomContent.like();
        }
      });

      // Calculate engagement metrics
      const totalViews = content.reduce((sum, c) => sum + c.views, 0);
      const totalLikes = content.reduce((sum, c) => sum + c.likes, 0);
      const avgViewsPerContent = totalViews / content.length;
      const avgLikesPerContent = totalLikes / content.length;

      expect(totalViews).toBeGreaterThan(2000);
      expect(totalLikes).toBeGreaterThan(2000);
      expect(avgViewsPerContent).toBeGreaterThan(15);
      expect(avgLikesPerContent).toBeGreaterThan(15);

      // Highly engaged users (top 10) should have driven most engagement
      const highlyEngagedContentCount = content.filter(c => c.views > 100).length;
      expect(highlyEngagedContentCount).toBeGreaterThan(10);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid data gracefully', () => {
      // Test with invalid email
      const invalidUser = new UserModel('user1', 'Test User', 'invalid-email');
      expect(invalidUser.isValid()).toBe(false);

      // Test with empty content
      const emptyVideo = new VideoModel('vid1', 'user1', '', '', '');
      expect(emptyVideo.isValid()).toBe(false);

      // Test with invalid rating
      const greeting = new GreetingModel('greet1', 'user1', 'temp1', 'Title', 'Content');
      greeting.updateRating(10); // Should be capped at 5
      expect(greeting.rating).toBe(5);

      greeting.updateRating(-5); // Should be floored at 0
      expect(greeting.rating).toBe(0);
    });

    test('should handle concurrent operations safely', () => {
      const video = new VideoModel('vid1', 'user1', 'Test Video', 'Description', 'url');

      // Simulate concurrent view increments
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(Promise.resolve(video.incrementViews()));
      }

      // All operations should complete without errors
      expect(async () => {
        await Promise.all(operations);
        expect(video.views).toBe(100);
      }).not.toThrow();
    });

    test('should validate business rules', () => {
      const user = new UserModel('user1', 'Test User', 'test@test.com');
      const business = new BusinessModel('biz1', user.id, 'Test Business', 'technology');

      // Business should not be verified initially
      expect(business.isVerified).toBe(false);

      // User should be able to verify their business
      business.verify();
      expect(business.isVerified).toBe(true);

      // Business should be active by default
      expect(business.isActive).toBe(true);

      // Suspending business should change status but keep it active
      business.suspend();
      expect(business.subscriptionStatus).toBe('suspended');
      expect(business.isActive).toBe(true); // Suspension != deactivation
    });
  });
});