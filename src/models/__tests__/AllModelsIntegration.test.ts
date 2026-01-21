import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { GreetingModel } from '../Greeting';
import { BusinessModel } from '../Business';
import { PlanModel } from '../Plan';
import { TransactionModel } from '../Transaction';
import { TemplateModel } from '../Template';

describe('All Models Integration Tests', () => {
  test('should create a complete user ecosystem', () => {
    // Create user
    const user = new UserModel('user1', 'John Business', 'john@business.com', '+1234567890', 'business1', 'plan1');

    // Create business for user
    const business = new BusinessModel('business1', user.id, 'John\'s Tech Solutions', 'technology', {
      phone: user.phone,
      email: user.email,
      website: 'https://johnstech.com'
    });

    // Create plan
    const plan = new PlanModel('plan1', 'Business Pro', 'Professional plan', 49.99, 'USD', 'monthly', [], 100, 200, 50);

    // Create template
    const template = new TemplateModel('template1', 'Business Greeting', 'Professional greeting template', 'business', 'greeting', 'template.jpg', 'admin');

    // Create video using template
    const video = new VideoModel('video1', user.id, 'Business Introduction', 'Company intro video', 'video.mp4', 'thumb.jpg', 120, 'completed', ['business', 'introduction'], '1080p', 500, 25, 10, 5);

    // Create greeting using template
    const greeting = new GreetingModel('greeting1', user.id, template.id, 'Welcome Message', 'Welcome to our company!', 'greeting.mp4', { color: '#007bff' }, 'published', 'business', ['welcome', 'professional'], true, 50, 20, 4.8);

    // Create transaction for services
    const transaction = new TransactionModel('txn1', user.id, 'payment', 49.99, 'USD', [
      { id: 'item1', type: 'video', description: 'Business video creation', amount: 29.99, quantity: 1 },
      { id: 'item2', type: 'greeting', description: 'Professional greeting', amount: 20.00, quantity: 1 }
    ], 'completed', business.id, 'credit_card', 'txn_123');

    // Verify all relationships
    expect(user.id).toBe('user1');
    expect(business.userId).toBe(user.id);
    expect(plan.id).toBe('plan1');
    expect(user.planId).toBe(plan.id);
    expect(video.userId).toBe(user.id);
    expect(greeting.userId).toBe(user.id);
    expect(greeting.templateId).toBe(template.id);
    expect(transaction.userId).toBe(user.id);
    expect(transaction.businessId).toBe(business.id);

    // Verify all entities are valid
    expect(user.isValid()).toBe(true);
    expect(business.isValid()).toBe(true);
    expect(plan.isValid()).toBe(true);
    expect(template.isValid()).toBe(true);
    expect(video.isValid()).toBe(true);
    expect(greeting.isValid()).toBe(true);
    expect(transaction.isValid()).toBe(true);
  });

  test('should handle business workflow from creation to monetization', () => {
    // Create business owner
    const owner = new UserModel('owner1', 'Sarah Entrepreneur', 'sarah@startup.com');

    // Create business
    const business = new BusinessModel('biz1', owner.id, 'Sarah\'s Startup', 'technology');

    // Subscribe to plan
    const plan = new PlanModel('plan_pro', 'Startup Pro', 'Perfect for startups', 29.99, 'USD', 'monthly', [], 50, 100, 25);

    // Business subscribes
    business.activate();
    owner.planId = plan.id;

    // Create templates
    const template1 = new TemplateModel('temp1', 'Startup Pitch', 'Pitch deck template', 'business', 'video', 'pitch.jpg', owner.id);
    const template2 = new TemplateModel('temp2', 'Welcome Email', 'Email greeting template', 'business', 'greeting', 'email.jpg', owner.id);

    // Templates get used by customers
    template1.recordUsage('customer1');
    template1.recordUsage('customer2');
    template2.recordUsage('customer1');

    // Create paid content
    const video = new VideoModel('vid1', owner.id, 'Product Demo', 'Demo video', 'demo.mp4', 'demo_thumb.jpg', 300, 'completed', ['product', 'demo'], '4K', 2000, 150, 45, 12);
    const greeting = new GreetingModel('greet1', owner.id, template2.id, 'Thank You', 'Thanks for your business!', 'thanks.mp4', {}, 'published', 'business', ['thank you'], true, 75, 30, 4.9);

    // Transactions occur
    const transaction1 = new TransactionModel('txn1', 'customer1', 'payment', 49.99, 'USD', [
      { id: 'item1', type: 'video', description: 'Custom video', amount: 29.99, quantity: 1 },
      { id: 'item2', type: 'greeting', description: 'Custom greeting', amount: 20.00, quantity: 1 }
    ], 'completed', business.id);

    const transaction2 = new TransactionModel('txn2', 'customer2', 'subscription', 29.99, 'USD', [], 'completed', business.id);

    // Verify business growth metrics
    expect(business.subscriptionStatus).toBe('active');
    expect(template1.usageCount).toBe(2);
    expect(template2.usageCount).toBe(1);
    expect(video.views).toBe(150);
    expect(greeting.downloads).toBe(30);
    expect(transaction1.getTotalAmount()).toBe(49.99);
    expect(transaction2.amount).toBe(29.99);
  });

  test('should handle user plan upgrades and content limits', () => {
    // Create user with basic plan
    const user = new UserModel('user1', 'Basic User', 'user@basic.com');
    const basicPlan = new PlanModel('basic', 'Basic', 'Basic plan', 9.99, 'USD', 'monthly', [], 5, 10, 1);

    user.planId = basicPlan.id;

    // Create content within limits
    const videos = [];
    const greetings = [];

    for (let i = 0; i < 5; i++) {
      videos.push(new VideoModel(`vid${i}`, user.id, `Video ${i}`, `Description ${i}`, `video${i}.mp4`));
    }

    for (let i = 0; i < 10; i++) {
      greetings.push(new GreetingModel(`greet${i}`, user.id, 'temp1', `Greeting ${i}`, `Content ${i}`));
    }

    // Check that user can create content within limits
    expect(basicPlan.canCreateVideo(videos.length)).toBe(false); // At limit
    expect(basicPlan.canCreateGreeting(greetings.length)).toBe(false); // At limit

    // Upgrade to pro plan
    const proPlan = new PlanModel('pro', 'Pro', 'Pro plan', 29.99, 'USD', 'monthly', [], 50, 100, 10);
    user.planId = proPlan.id;

    // Now user can create more content
    expect(proPlan.canCreateVideo(videos.length)).toBe(true);
    expect(proPlan.canCreateGreeting(greetings.length)).toBe(true);

    // Create transaction for upgrade
    const upgradeTransaction = new TransactionModel('upgrade_txn', user.id, 'subscription', 29.99, 'USD', [
      { id: 'upgrade', type: 'subscription', description: 'Plan upgrade to Pro', amount: 29.99, quantity: 1 }
    ], 'completed');

    expect(upgradeTransaction.isCompleted()).toBe(true);
    expect(upgradeTransaction.getTotalAmount()).toBe(29.99);
  });

  test('should handle template marketplace workflow', () => {
    // Create template creator
    const creator = new UserModel('creator1', 'Template Designer', 'designer@templates.com');

    // Create various templates
    const templates = [
      new TemplateModel('temp1', 'Wedding Template', 'Beautiful wedding template', 'wedding', 'video', 'wedding.jpg', creator.id, {
        colors: ['#FFFFFF', '#FFD700'],
        fonts: ['Script', 'Serif'],
        layouts: ['landscape'],
        effects: ['sparkle']
      }, ['wedding', 'romantic'], true),

      new TemplateModel('temp2', 'Birthday Party', 'Fun birthday template', 'birthday', 'greeting', 'birthday.jpg', creator.id, {
        colors: ['#FF69B4', '#FFD700'],
        fonts: ['Comic Sans'],
        layouts: ['portrait'],
        effects: ['confetti']
      }, ['birthday', 'party'], false),

      new TemplateModel('temp3', 'Corporate Intro', 'Professional intro template', 'business', 'video', 'corporate.jpg', creator.id, {
        colors: ['#000000', '#0066CC'],
        fonts: ['Arial', 'Helvetica'],
        layouts: ['landscape'],
        effects: ['fade']
      }, ['corporate', 'professional'], true)
    ];

    // Templates get discovered and used
    templates[0].recordUsage('user1');
    templates[0].recordUsage('user2');
    templates[1].recordUsage('user3');
    templates[1].recordUsage('user4');
    templates[1].recordUsage('user4'); // Multiple uses
    templates[2].recordUsage('user5');

    // Premium templates generate revenue
    const transactions = templates
      .filter(t => t.isPremium)
      .map((template, index) => new TransactionModel(
        `txn${index}`,
        `user${index + 1}`,
        'payment',
        9.99,
        'USD',
        [{
          id: `purchase_${template.id}`,
          type: 'video',
          description: `Purchase ${template.name}`,
          amount: 9.99,
          quantity: 1
        }],
        'completed'
      ));

    // Verify marketplace metrics
    expect(templates.filter(t => t.isPremium)).toHaveLength(2);
    expect(templates[0].usageCount).toBe(2);
    expect(templates[1].usageCount).toBe(3); // user4 used it twice
    expect(templates[2].usageCount).toBe(1);

    expect(transactions).toHaveLength(2);
    expect(transactions.every(t => t.isCompleted())).toBe(true);
    expect(transactions.reduce((sum, t) => sum + t.amount, 0)).toBe(19.98);
  });

  test('should handle complex multi-user content creation workflow', () => {
    // Create multiple users with different roles
    const admin = new UserModel('admin1', 'Admin User', 'admin@platform.com', '', '', '', '', true, 'admin');
    const businessOwner = new UserModel('biz1', 'Business Owner', 'owner@business.com', '', '', '', '', true, 'business');
    const contentCreator = new UserModel('creator1', 'Content Creator', 'creator@content.com');
    const customer = new UserModel('customer1', 'Happy Customer', 'customer@email.com');

    // Admin creates premium plan
    const premiumPlan = new PlanModel('premium', 'Premium Plan', 'All features included', 99.99, 'USD', 'monthly', [], 0, 0, 0, true);
    premiumPlan.markAsPopular();

    // Business owner subscribes to premium plan
    businessOwner.planId = premiumPlan.id;
    const subscriptionTxn = new TransactionModel('sub_txn', businessOwner.id, 'subscription', 99.99, 'USD', [], 'completed');

    // Content creator creates template
    const template = new TemplateModel('pro_template', 'Professional Template', 'High-quality template', 'business', 'video', 'pro_template.jpg', contentCreator.id);
    template.markAsPremium();

    // Admin approves template
    template.activate();

    // Business owner uses template to create content
    const businessVideo = new VideoModel('biz_video', businessOwner.id, 'Company Video', 'Corporate presentation', 'company.mp4', 'company_thumb.jpg', 180, 'completed', ['corporate', 'presentation'], '4K', 1500, 200, 75, 25);
    const businessGreeting = new GreetingModel('biz_greeting', businessOwner.id, template.id, 'Welcome Aboard', 'Welcome to our team!', 'welcome.mp4', { color: '#0066CC' }, 'published', 'business', ['welcome', 'corporate'], true, 100, 50, 4.9);

    // Customer purchases business content
    const purchaseTxn = new TransactionModel('purchase_txn', customer.id, 'payment', 49.99, 'USD', [
      { id: 'video_purchase', type: 'video', description: 'Business video license', amount: 29.99, quantity: 1 },
      { id: 'greeting_purchase', type: 'greeting', description: 'Custom greeting', amount: 20.00, quantity: 1 }
    ], 'completed', 'biz1');

    // Content gets engagement
    businessVideo.incrementViews();
    businessVideo.incrementViews();
    businessVideo.like();
    businessVideo.share();

    businessGreeting.incrementViews();
    businessGreeting.incrementDownloads();
    businessGreeting.updateRating(5);

    template.recordUsage(businessOwner.id);

    // Verify complex relationships and metrics
    expect(admin.isAdmin()).toBe(true);
    expect(businessOwner.role).toBe('business');
    expect(contentCreator.role).toBe('user');

    expect(premiumPlan.isPopular).toBe(true);
    expect(subscriptionTxn.isCompleted()).toBe(true);

    expect(template.isPremium).toBe(true);
    expect(template.isActive).toBe(true);
    expect(template.usageCount).toBe(1);

    expect(businessVideo.isProcessed()).toBe(true);
    expect(businessVideo.views).toBe(2);
    expect(businessVideo.likes).toBe(1);

    expect(businessGreeting.isPublic).toBe(true);
    expect(businessGreeting.views).toBe(1);
    expect(businessGreeting.downloads).toBe(1);

    expect(purchaseTxn.getTotalAmount()).toBe(49.99);
    expect(purchaseTxn.getItemCount()).toBe(2);
  });
});