import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { GreetingModel } from '../Greeting';
import { BusinessModel } from '../Business';
import { PlanModel } from '../Plan';
import { TransactionModel } from '../Transaction';
import { TemplateModel } from '../Template';

describe('Model Performance Tests', () => {
  test('should handle bulk user creation efficiently', () => {
    const startTime = Date.now();
    const users = [];

    // Create 1000 users
    for (let i = 0; i < 1000; i++) {
      users.push(new UserModel(
        `user${i}`,
        `User ${i}`,
        `user${i}@test.com`,
        `+1234567${String(i).padStart(3, '0')}`,
        `business${i % 10}`,
        `plan${i % 5}`
      ));
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all users are valid
    expect(users.every(u => u.isValid())).toBe(true);
    expect(users).toHaveLength(1000);

    // Performance check: should create 1000 users in less than 1 second
    expect(duration).toBeLessThan(1000);
    console.log(`Created 1000 users in ${duration}ms`);
  });

  test('should handle bulk video processing efficiently', () => {
    const user = new UserModel('user1', 'Test User', 'test@test.com');
    const startTime = Date.now();
    const videos = [];

    // Create 500 videos
    for (let i = 0; i < 500; i++) {
      const video = new VideoModel(
        `video${i}`,
        user.id,
        `Video ${i}`,
        `Description for video ${i}`,
        `video${i}.mp4`,
        `thumb${i}.jpg`,
        Math.floor(Math.random() * 300) + 30, // Random duration 30-330 seconds
        ['processing', 'completed', 'failed'][Math.floor(Math.random() * 3)] as 'processing' | 'completed' | 'failed',
        [`tag${i % 10}`, `category${i % 5}`],
        ['720p', '1080p', '4K'][Math.floor(Math.random() * 3)],
        Math.floor(Math.random() * 1000000), // Random file size
        Math.floor(Math.random() * 1000), // Random views
        Math.floor(Math.random() * 100), // Random likes
        Math.floor(Math.random() * 50) // Random shares
      );
      videos.push(video);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all videos are valid
    expect(videos.every(v => v.isValid())).toBe(true);
    expect(videos).toHaveLength(500);

    // Performance check: should create 500 videos in less than 500ms
    expect(duration).toBeLessThan(500);
    console.log(`Created 500 videos in ${duration}ms`);

    // Test bulk operations
    const completedVideos = videos.filter(v => v.status === 'completed');
    completedVideos.forEach(video => {
      video.incrementViews();
      video.like();
    });

    expect(completedVideos.every(v => v.views > 0 && v.likes > 0)).toBe(true);
  });

  test('should handle concurrent greeting operations efficiently', () => {
    const user = new UserModel('user1', 'Test User', 'test@test.com');
    const template = new TemplateModel('temp1', 'Test Template', 'Test template', 'general', 'greeting', 'temp.jpg', user.id);

    const startTime = Date.now();
    const greetings = [];

    // Create 1000 greetings
    for (let i = 0; i < 1000; i++) {
      const greeting = new GreetingModel(
        `greeting${i}`,
        user.id,
        template.id,
        `Greeting ${i}`,
        `Content for greeting ${i}`,
        `media${i}.mp4`,
        { color: ['#FF0000', '#00FF00', '#0000FF'][i % 3] },
        ['draft', 'published', 'archived'][Math.floor(Math.random() * 3)] as 'draft' | 'published' | 'archived',
        ['birthday', 'business', 'wedding', 'general'][i % 4],
        [`tag${i % 20}`],
        Math.random() > 0.5,
        Math.floor(Math.random() * 500), // Random views
        Math.floor(Math.random() * 200), // Random downloads
        Math.random() * 2 + 3 // Random rating 3.0-5.0
      );
      greetings.push(greeting);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all greetings are valid
    expect(greetings.every(g => g.isValid())).toBe(true);
    expect(greetings).toHaveLength(1000);

    // Performance check: should create 1000 greetings in less than 1 second
    expect(duration).toBeLessThan(1000);
    console.log(`Created 1000 greetings in ${duration}ms`);

    // Test bulk engagement operations
    const publishedGreetings = greetings.filter(g => g.status === 'published');
    publishedGreetings.forEach(greeting => {
      greeting.incrementViews();
      greeting.incrementDownloads();
      greeting.addComment(`Comment ${Math.random()}`);
    });

    expect(publishedGreetings.every(g => g.views > 0 && g.downloads > 0 && g.comments.length > 0)).toBe(true);
  });

  test('should handle transaction processing at scale', () => {
    const startTime = Date.now();
    const transactions = [];
    const users = [];
    const businesses = [];

    // Create test data
    for (let i = 0; i < 100; i++) {
      users.push(new UserModel(`user${i}`, `User ${i}`, `user${i}@test.com`));
      businesses.push(new BusinessModel(`business${i}`, `user${i}`, `Business ${i}`, 'technology'));
    }

    // Create 1000 transactions
    for (let i = 0; i < 1000; i++) {
      const user = users[i % users.length];
      const business = businesses[i % businesses.length];

      const items = [];
      const numItems = Math.floor(Math.random() * 5) + 1;

      for (let j = 0; j < numItems; j++) {
        items.push({
          id: `item${i}_${j}`,
          type: ['video', 'greeting', 'download'][Math.floor(Math.random() * 3)] as 'video' | 'greeting' | 'download',
          description: `Item ${j} for transaction ${i}`,
          amount: Math.random() * 50 + 5, // Random amount 5-55
          quantity: Math.floor(Math.random() * 3) + 1 // Random quantity 1-3
        });
      }

      const totalAmount = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);

      const transaction = new TransactionModel(
        `txn${i}`,
        user.id,
        'payment',
        totalAmount,
        'USD',
        items,
        ['pending', 'completed', 'failed'][Math.floor(Math.random() * 3)] as 'pending' | 'completed' | 'failed',
        business.id,
        'credit_card',
        `txn_ext_${i}`
      );

      transactions.push(transaction);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all transactions are valid
    expect(transactions.every(t => t.isValid())).toBe(true);
    expect(transactions).toHaveLength(1000);

    // Performance check: should create 1000 transactions in less than 2 seconds
    expect(duration).toBeLessThan(2000);
    console.log(`Created 1000 transactions in ${duration}ms`);

    // Test bulk completion operations
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    pendingTransactions.forEach(txn => {
      if (txn.amount > 10) { // Complete high-value transactions
        txn.complete();
      }
    });

    const completedCount = transactions.filter(t => t.isCompleted()).length;
    expect(completedCount).toBeGreaterThan(0);
  });

  test('should handle template marketplace performance', () => {
    const startTime = Date.now();
    const creators = [];
    const templates = [];
    const usageRecords = [];

    // Create 50 creators
    for (let i = 0; i < 50; i++) {
      creators.push(new UserModel(`creator${i}`, `Creator ${i}`, `creator${i}@templates.com`));
    }

    // Create 500 templates
    for (let i = 0; i < 500; i++) {
      const creator = creators[i % creators.length];
      const template = new TemplateModel(
        `template${i}`,
        `Template ${i}`,
        `Description for template ${i}`,
        ['birthday', 'wedding', 'business', 'general'][i % 4],
        ['video', 'greeting', 'poster'][i % 3] as 'video' | 'greeting' | 'poster',
        `thumb${i}.jpg`,
        creator.id,
        {
          colors: [`#${Math.floor(Math.random()*16777215).toString(16)}`],
          fonts: ['Arial', 'Helvetica', 'Times'][i % 3],
          layouts: ['portrait', 'landscape'][i % 2],
          effects: ['fade', 'zoom', 'rotate'][i % 3]
        },
        [`tag${i % 25}`, `category${i % 10}`],
        Math.random() > 0.7, // 30% premium
        Math.random() > 0.1, // 90% active
        Math.floor(Math.random() * 1000) // Random usage count
      );
      templates.push(template);
    }

    // Simulate usage (create 5000 usage records)
    for (let i = 0; i < 5000; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const userId = `user${Math.floor(Math.random() * 1000)}`;

      usageRecords.push({
        templateId: template.id,
        userId,
        timestamp: new Date().toISOString()
      });

      template.recordUsage(userId);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all templates are valid
    expect(templates.every(t => t.isValid())).toBe(true);
    expect(templates).toHaveLength(500);

    // Performance check: should create 500 templates and process 5000 usage records in less than 3 seconds
    expect(duration).toBeLessThan(3000);
    console.log(`Created 500 templates and processed 5000 usage records in ${duration}ms`);

    // Verify usage statistics
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    expect(totalUsage).toBeGreaterThan(5000); // Should be more due to initial random usage counts

    const premiumTemplates = templates.filter(t => t.isPremium);
    const freeTemplates = templates.filter(t => !t.isPremium);

    expect(premiumTemplates.length).toBeGreaterThan(0);
    expect(freeTemplates.length).toBeGreaterThan(0);
    expect(premiumTemplates.length + freeTemplates.length).toBe(500);
  });

  test('should handle memory efficiently with large datasets', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Create large dataset
    const users = [];
    const videos = [];
    const greetings = [];
    const transactions = [];

    for (let i = 0; i < 1000; i++) {
      users.push(new UserModel(`user${i}`, `User ${i}`, `user${i}@test.com`));
      videos.push(new VideoModel(`video${i}`, `user${i}`, `Video ${i}`, `Desc ${i}`, `url${i}`));
      greetings.push(new GreetingModel(`greeting${i}`, `user${i}`, 'temp1', `Greeting ${i}`, `Content ${i}`));
      transactions.push(new TransactionModel(`txn${i}`, `user${i}`, 'payment', Math.random() * 100));
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Verify all data is created
    expect(users).toHaveLength(1000);
    expect(videos).toHaveLength(1000);
    expect(greetings).toHaveLength(1000);
    expect(transactions).toHaveLength(1000);

    // Memory check: should not exceed 50MB increase for 4000 objects
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
    expect(memoryIncreaseMB).toBeLessThan(50);
    console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB for 4000 objects`);
  });
});