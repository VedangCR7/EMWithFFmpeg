import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { GreetingModel } from '../Greeting';
import { TemplateModel } from '../Template';

describe('Content Management System', () => {
  test('should manage content creation workflow', () => {
    const creator = new UserModel('creator1', 'Content Creator', 'creator@test.com');
    creator.role = 'creator';

    // Creator plans content
    const contentPlan = {
      videos: [
        { title: 'Product Demo', category: 'product', duration: 180 },
        { title: 'Tutorial Series', category: 'education', duration: 600 },
        { title: 'Customer Testimonial', category: 'testimonial', duration: 120 }
      ],
      greetings: [
        { title: 'Welcome Message', category: 'business', template: 'welcome' },
        { title: 'Thank You Note', category: 'gratitude', template: 'thanks' }
      ]
    };

    // Create videos according to plan
    const videos = contentPlan.videos.map((plan, index) =>
      new VideoModel(
        `video${index}`,
        creator.id,
        plan.title,
        `Professional ${plan.category} content`,
        `https://cdn.example.com/video${index}.mp4`,
        plan.category,
        `https://cdn.example.com/thumb${index}.jpg`,
        plan.duration,
        'processing'
      )
    );

    // Create greetings
    const greetings = contentPlan.greetings.map((plan, index) =>
      new GreetingModel(
        `greeting${index}`,
        creator.id,
        plan.template,
        plan.title,
        `Professional ${plan.category} message`,
        `https://cdn.example.com/greeting${index}.mp4`
      )
    );

    // Verify all content is created
    expect(videos).toHaveLength(3);
    expect(greetings).toHaveLength(2);
    expect(videos.every(v => v.isValid())).toBe(true);
    expect(greetings.every(g => g.isValid())).toBe(true);

    // Process videos
    videos.forEach(video => {
      video.updateProgress(100);
      expect(video.isProcessed()).toBe(true);
    });

    // Publish all content
    [...videos, ...greetings].forEach(content => {
      if (content instanceof VideoModel) {
        content.publish();
        expect(content.isPublished()).toBe(true);
      } else if (content instanceof GreetingModel) {
        content.publish();
        expect(content.status).toBe('published');
      }
    });

    // Update creator stats
    creator.incrementStats({
      totalVideos: videos.length,
      totalGreetings: greetings.length
    });

    expect(creator.stats.totalVideos).toBe(3);
    expect(creator.stats.totalGreetings).toBe(2);
  });

  test('should handle content approval and moderation', () => {
    const admin = new UserModel('admin1', 'Admin', 'admin@test.com');
    admin.role = 'admin';

    const creator = new UserModel('creator1', 'Creator', 'creator@test.com');
    const contentModerator = new UserModel('mod1', 'Moderator', 'mod@test.com');

    // Creator submits content for review
    const video = new VideoModel(
      'pending_video',
      creator.id,
      'Content Needing Review',
      'This content requires moderation',
      'video.mp4',
      'general',
      'thumb.jpg',
      300,
      'completed' // Ready for review
    );

    const greeting = new GreetingModel(
      'pending_greeting',
      creator.id,
      'template1',
      'Greeting Needing Review',
      'This greeting requires moderation'
    );

    // Content is initially public but flagged for review
    expect(video.isPublic).toBe(true);
    expect(greeting.isPublic).toBe(false); // Greetings default to private

    // Moderator reviews and approves
    video.makePublic();
    greeting.publish();

    expect(video.isPublic).toBe(true);
    expect(greeting.isPublic).toBe(true);
    expect(greeting.status).toBe('published');

    // Content gets engagement after approval
    video.incrementViews();
    greeting.incrementViews();

    expect(video.views).toBe(1);
    expect(greeting.views).toBe(1);
  });

  test('should manage content templates and reuse', () => {
    const templateCreator = new UserModel('template_creator', 'Template Designer', 'templates@test.com');

    // Create base templates
    const videoTemplates = [
      new TemplateModel('promo_template', 'Product Promo', 'Standard product promotion template', 'product', 'video', 'promo_thumb.jpg', templateCreator.id),
      new TemplateModel('tutorial_template', 'Tutorial Format', 'Educational content template', 'education', 'video', 'tutorial_thumb.jpg', templateCreator.id),
      new TemplateModel('testimonial_template', 'Customer Testimonial', 'Client feedback template', 'testimonial', 'video', 'testimonial_thumb.jpg', templateCreator.id)
    ];

    const greetingTemplates = [
      new TemplateModel('welcome_template', 'Welcome Message', 'Business welcome template', 'business', 'greeting', 'welcome_thumb.jpg', templateCreator.id),
      new TemplateModel('thanks_template', 'Thank You Note', 'Gratitude expression template', 'gratitude', 'greeting', 'thanks_thumb.jpg', templateCreator.id)
    ];

    // Templates are approved and activated
    [...videoTemplates, ...greetingTemplates].forEach(template => {
      template.activate();
      expect(template.isActive).toBe(true);
    });

    // Multiple creators use templates
    const creators = [];
    for (let i = 0; i < 5; i++) {
      creators.push(new UserModel(`creator${i}`, `Creator ${i}`, `creator${i}@test.com`));
    }

    // Each creator uses different templates
    const createdContent = [];
    creators.forEach((creator, creatorIndex) => {
      // Each creator makes 2 videos and 1 greeting
      for (let i = 0; i < 2; i++) {
        const template = videoTemplates[(creatorIndex + i) % videoTemplates.length];
        const video = new VideoModel(
          `video_${creatorIndex}_${i}`,
          creator.id,
          `Content using ${template.name}`,
          `Created with ${template.name} template`,
          `video_${creatorIndex}_${i}.mp4`,
          template.category
        );
        createdContent.push({ type: 'video', content: video, template });

        // Record template usage
        template.recordUsage(creator.id);
      }

      const greetingTemplate = greetingTemplates[creatorIndex % greetingTemplates.length];
      const greeting = new GreetingModel(
        `greeting_${creatorIndex}`,
        creator.id,
        greetingTemplate.id,
        `Greeting using ${greetingTemplate.name}`,
        `Created with ${greetingTemplate.name} template`
      );
      createdContent.push({ type: 'greeting', content: greeting, template: greetingTemplate });

      greetingTemplate.recordUsage(creator.id);
    });

    // Verify template usage statistics
    videoTemplates.forEach(template => {
      expect(template.usageCount).toBeGreaterThan(0);
    });

    greetingTemplates.forEach(template => {
      expect(template.usageCount).toBeGreaterThan(0);
    });

    // Total content created: 5 creators * (2 videos + 1 greeting) = 15 pieces
    expect(createdContent).toHaveLength(15);
    expect(createdContent.filter(c => c.type === 'video')).toHaveLength(10);
    expect(createdContent.filter(c => c.type === 'greeting')).toHaveLength(5);
  });

  test('should handle content versioning and updates', () => {
    const creator = new UserModel('creator1', 'Versioning Creator', 'version@test.com');

    // Create initial video
    const video = new VideoModel(
      'versioned_video',
      creator.id,
      'Initial Version',
      'First version of the content',
      'video_v1.mp4',
      'tutorial',
      'thumb_v1.jpg',
      300,
      'published'
    );

    // Content gets engagement on first version
    for (let i = 0; i < 100; i++) video.incrementViews();
    for (let i = 0; i < 20; i++) video.like();

    const initialViews = video.views;
    const initialLikes = video.likes;

    // Creator updates the content
    video.title = 'Updated Version - Better Quality';
    video.description = 'Improved version with better production quality';
    video.url = 'video_v2.mp4'; // New file
    video.thumbnailUrl = 'thumb_v2.jpg'; // New thumbnail
    video.updatedAt = new Date().toISOString();

    // Content continues to get engagement after update
    for (let i = 0; i < 200; i++) video.incrementViews();
    for (let i = 0; i < 50; i++) video.like();

    expect(video.views).toBe(initialViews + 200);
    expect(video.likes).toBe(initialLikes + 50);
    expect(video.title).toContain('Updated Version');

    // Verify update timestamp is recent
    const updateTime = new Date(video.updatedAt);
    const now = new Date();
    expect(now.getTime() - updateTime.getTime()).toBeLessThan(60000); // Within last minute
  });

  test('should manage content access control', () => {
    const premiumCreator = new UserModel('premium_creator', 'Premium Creator', 'premium@test.com');
    const freeUser = new UserModel('free_user', 'Free User', 'free@test.com');
    const premiumUser = new UserModel('premium_user', 'Premium User', 'premium@test.com');

    // Creator makes both free and premium content
    const freeVideo = new VideoModel(
      'free_video',
      premiumCreator.id,
      'Free Tutorial',
      'Basic tutorial available to all',
      'free_tutorial.mp4',
      'education'
    );
    freeVideo.makePublic();
    freeVideo.disableMonetization();

    const premiumVideo = new VideoModel(
      'premium_video',
      premiumCreator.id,
      'Premium Course',
      'Advanced course for premium users only',
      'premium_course.mp4',
      'education'
    );
    premiumVideo.makePublic();
    premiumVideo.enableMonetization();

    const privateVideo = new VideoModel(
      'private_video',
      premiumCreator.id,
      'Private Content',
      'Exclusive content for specific users',
      'private_content.mp4',
      'exclusive'
    );
    privateVideo.makePrivate();

    // Verify access control
    expect(freeVideo.isPublic).toBe(true);
    expect(freeVideo.isMonetized).toBe(false);

    expect(premiumVideo.isPublic).toBe(true);
    expect(premiumVideo.isMonetized).toBe(true);

    expect(privateVideo.isPublic).toBe(false);
    expect(privateVideo.isMonetized).toBe(false); // Private content typically not monetized

    // Simulate access patterns
    // Free content accessible to all
    freeVideo.recordView('mobile', 'US', 'search');
    freeVideo.recordView('desktop', 'UK', 'direct');

    // Premium content (would require payment/subscription check in real app)
    premiumVideo.recordView('mobile', 'US', 'subscription');

    // Private content (would require specific access check)
    // privateVideo.recordView('desktop', 'US', 'invite'); // Would be restricted

    expect(freeVideo.views).toBe(2);
    expect(premiumVideo.views).toBe(1);
    expect(privateVideo.views).toBe(0);
  });

  test('should handle content archiving and cleanup', () => {
    const creator = new UserModel('creator1', 'Archive Creator', 'archive@test.com');

    // Create various content over time
    const content = [];
    const categories = ['tutorial', 'review', 'demo', 'interview'];

    for (let i = 0; i < 20; i++) {
      const video = new VideoModel(
        `archive_video${i}`,
        creator.id,
        `Archive Content ${i}`,
        `Content in ${categories[i % categories.length]} category`,
        `archive${i}.mp4`,
        categories[i % categories.length],
        `thumb${i}.jpg`,
        180,
        'published'
      );

      // Some content gets engagement, some doesn't
      const engagement = Math.random();
      if (engagement > 0.7) { // 30% get high engagement
        for (let v = 0; v < Math.floor(Math.random() * 1000) + 100; v++) {
          video.incrementViews();
        }
      } else if (engagement > 0.4) { // 30% get medium engagement
        for (let v = 0; v < Math.floor(Math.random() * 100) + 10; v++) {
          video.incrementViews();
        }
      } // 40% get low or no engagement

      content.push(video);
    }

    // Identify content for archiving (low engagement)
    const lowEngagementContent = content.filter(video => video.views < 50);
    const activeContent = content.filter(video => video.views >= 50);

    // Archive low engagement content
    lowEngagementContent.forEach(video => {
      video.archive();
      expect(video.isArchived()).toBe(true);
    });

    // Keep active content published
    activeContent.forEach(video => {
      expect(video.isPublished()).toBe(true);
    });

    // Update creator stats to reflect active content only
    creator.incrementStats({
      totalVideos: activeContent.length,
      totalViews: activeContent.reduce((sum, video) => sum + video.views, 0)
    });

    expect(creator.stats.totalVideos).toBe(activeContent.length);
    expect(content.filter(v => v.isArchived()).length).toBe(lowEngagementContent.length);
    expect(content.filter(v => v.isPublished()).length).toBe(activeContent.length);
  });
});