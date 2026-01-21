import { VideoModel } from '../Video';

describe('Video Analytics and Engagement', () => {
  const baseVideo = {
    id: 'video1',
    userId: 'user1',
    title: 'Test Video',
    description: 'A test video for analytics',
    url: 'https://example.com/video.mp4',
    category: 'tutorial'
  };

  test('should create video with comprehensive analytics', () => {
    const video = new VideoModel(
      baseVideo.id,
      baseVideo.userId,
      baseVideo.title,
      baseVideo.description,
      baseVideo.url,
      baseVideo.category,
      'https://example.com/thumbnail.jpg',
      300, // 5 minutes
      'published',
      ['tutorial', 'education', 'beginner'],
      '1080p',
      52428800, // 50MB
      2500000, // 2.5 Mbps
      'h264',
      '16:9',
      1500, // views
      120, // likes
      5, // dislikes
      45, // shares
      23, // comments
      67, // saves
      100, // processing progress
      true, // isPublic
      true, // isMonetized
      true, // allowComments
      false, // allowDownloads
      {
        watchTime: 15000, // 15 seconds average watch time per view
        completionRate: 85.5,
        audienceRetention: [95, 90, 85, 80, 75],
        trafficSources: { 'direct': 40, 'social': 35, 'search': 25 },
        deviceStats: { 'mobile': 60, 'desktop': 30, 'tablet': 10 },
        geographicViews: { 'US': 500, 'UK': 300, 'CA': 200 }
      }
    );

    expect(video.id).toBe(baseVideo.id);
    expect(video.userId).toBe(baseVideo.userId);
    expect(video.title).toBe(baseVideo.title);
    expect(video.category).toBe(baseVideo.category);
    expect(video.duration).toBe(300);
    expect(video.status).toBe('published');
    expect(video.resolution).toBe('1080p');
    expect(video.codec).toBe('h264');
    expect(video.aspectRatio).toBe('16:9');
    expect(video.views).toBe(1500);
    expect(video.likes).toBe(120);
    expect(video.dislikes).toBe(5);
    expect(video.comments).toBe(23);
    expect(video.saves).toBe(67);
    expect(video.isPublic).toBe(true);
    expect(video.isMonetized).toBe(true);
    expect(video.allowComments).toBe(true);
    expect(video.allowDownloads).toBe(false);
  });

  test('should track video engagement metrics', () => {
    const video = new VideoModel(baseVideo.id, baseVideo.userId, baseVideo.title, baseVideo.description, baseVideo.url);

    expect(video.views).toBe(0);
    expect(video.likes).toBe(0);
    expect(video.dislikes).toBe(0);
    expect(video.shares).toBe(0);
    expect(video.comments).toBe(0);
    expect(video.saves).toBe(0);

    // Simulate engagement
    for (let i = 0; i < 100; i++) video.incrementViews();
    for (let i = 0; i < 25; i++) video.like();
    for (let i = 0; i < 3; i++) video.dislike();
    for (let i = 0; i < 15; i++) video.share();
    for (let i = 0; i < 8; i++) video.addComment();
    for (let i = 0; i < 12; i++) video.save();

    expect(video.views).toBe(100);
    expect(video.likes).toBe(25);
    expect(video.dislikes).toBe(3);
    expect(video.shares).toBe(15);
    expect(video.comments).toBe(8);
    expect(video.saves).toBe(12);
  });

  test('should calculate engagement rate and ratios', () => {
    const video = new VideoModel(baseVideo.id, baseVideo.userId, baseVideo.title, baseVideo.description, baseVideo.url);

    // No engagement
    expect(video.getEngagementRate()).toBe(0);
    expect(video.getLikeRatio()).toBe(0);

    // Add views and engagement
    for (let i = 0; i < 1000; i++) video.incrementViews();
    for (let i = 0; i < 50; i++) video.like();
    for (let i = 0; i < 10; i++) video.dislike();
    for (let i = 0; i < 25; i++) video.share();
    for (let i = 0; i < 15; i++) video.addComment();
    for (let i = 0; i < 20; i++) video.save();

    // Engagement rate = (likes + shares + comments + saves) / views * 100
    const expectedEngagementRate = ((50 + 25 + 15 + 20) / 1000) * 100;
    expect(video.getEngagementRate()).toBe(expectedEngagementRate);

    // Like ratio = likes / (likes + dislikes) * 100
    const expectedLikeRatio = (50 / (50 + 10)) * 100;
    expect(video.getLikeRatio()).toBe(expectedLikeRatio);
  });

  test('should manage video privacy settings', () => {
    const video = new VideoModel(baseVideo.id, baseVideo.userId, baseVideo.title, baseVideo.description, baseVideo.url);

    expect(video.isPublic).toBe(true);
    expect(video.allowComments).toBe(true);
    expect(video.allowDownloads).toBe(false);

    // Make private
    video.makePrivate();
    expect(video.isPublic).toBe(false);

    // Make public again
    video.makePublic();
    expect(video.isPublic).toBe(true);

    // Update settings
    video.updateSettings({
      allowComments: false,
      allowDownloads: true,
      isMonetized: true
    });

    expect(video.allowComments).toBe(false);
    expect(video.allowDownloads).toBe(true);
    expect(video.isMonetized).toBe(true);
  });

  test('should handle monetization settings', () => {
    const video = new VideoModel(baseVideo.id, baseVideo.userId, baseVideo.title, baseVideo.description, baseVideo.url);

    expect(video.isMonetized).toBe(false);

    video.enableMonetization();
    expect(video.isMonetized).toBe(true);

    video.disableMonetization();
    expect(video.isMonetized).toBe(false);
  });

  test('should track detailed analytics', () => {
    const video = new VideoModel(baseVideo.id, baseVideo.userId, baseVideo.title, baseVideo.description, baseVideo.url);

    // Initial analytics
    expect(video.analytics.watchTime).toBe(0);
    expect(video.analytics.completionRate).toBe(0);
    expect(video.analytics.audienceRetention).toEqual([]);
    expect(video.analytics.trafficSources).toEqual({});
    expect(video.analytics.deviceStats).toEqual({});
    expect(video.analytics.geographicViews).toEqual({});

    // Update analytics
    video.updateAnalytics({
      watchTime: 25000,
      completionRate: 92.5,
      audienceRetention: [98, 95, 92, 88, 85],
      trafficSources: { 'youtube': 50, 'facebook': 30, 'twitter': 20 },
      deviceStats: { 'mobile': 70, 'desktop': 25, 'tablet': 5 },
      geographicViews: { 'US': 400, 'IN': 300, 'UK': 200 }
    });

    expect(video.analytics.watchTime).toBe(25000);
    expect(video.analytics.completionRate).toBe(92.5);
    expect(video.analytics.audienceRetention).toEqual([98, 95, 92, 88, 85]);
    expect(video.analytics.trafficSources).toEqual({ 'youtube': 50, 'facebook': 30, 'twitter': 20 });
    expect(video.analytics.deviceStats).toEqual({ 'mobile': 70, 'desktop': 25, 'tablet': 5 });
    expect(video.analytics.geographicViews).toEqual({ 'US': 400, 'IN': 300, 'UK': 200 });
  });

  test('should record view analytics with metadata', () => {
    const video = new VideoModel(baseVideo.id, baseVideo.userId, baseVideo.title, baseVideo.description, baseVideo.url);

    // Record views with different metadata
    video.recordView('mobile', 'US', 'youtube');
    video.recordView('desktop', 'US', 'direct');
    video.recordView('mobile', 'UK', 'facebook');
    video.recordView('tablet', 'US', 'youtube');
    video.recordView('mobile', 'CA', 'twitter');

    expect(video.views).toBe(5);

    expect(video.analytics.deviceStats).toEqual({
      'mobile': 3,
      'desktop': 1,
      'tablet': 1
    });

    expect(video.analytics.geographicViews).toEqual({
      'US': 3,
      'UK': 1,
      'CA': 1
    });

    expect(video.analytics.trafficSources).toEqual({
      'youtube': 2,
      'direct': 1,
      'facebook': 1,
      'twitter': 1
    });
  });

  test('should provide utility formatting methods', () => {
    const video = new VideoModel(
      baseVideo.id,
      baseVideo.userId,
      baseVideo.title,
      baseVideo.description,
      baseVideo.url,
      baseVideo.category,
      undefined,
      367, // 6 minutes 7 seconds
      'published',
      [],
      '4K',
      2147483648, // 2GB
      5000000,
      'h265',
      '21:9'
    );

    expect(video.getDurationFormatted()).toBe('6:07');
    expect(video.getFileSizeMB()).toBe(2048); // 2GB = 2048MB
  });

  test('should manage video lifecycle states', () => {
    const video = new VideoModel(baseVideo.id, baseVideo.userId, baseVideo.title, baseVideo.description, baseVideo.url);

    // Initial state
    expect(video.status).toBe('processing');
    expect(video.isProcessed()).toBe(false);
    expect(video.isPublished()).toBe(false);
    expect(video.isArchived()).toBe(false);

    // Process video
    video.updateProgress(100);
    expect(video.status).toBe('completed');
    expect(video.isProcessed()).toBe(true);

    // Publish video
    video.publish();
    expect(video.status).toBe('published');
    expect(video.isPublished()).toBe(true);
    expect(video.publishedAt).toBeDefined();

    // Archive video
    video.archive();
    expect(video.status).toBe('archived');
    expect(video.isArchived()).toBe(true);

    // Can still fail processing
    const processingVideo = new VideoModel('video2', 'user1', 'Processing', 'Desc', 'url');
    processingVideo.fail();
    expect(processingVideo.status).toBe('failed');
  });
});