import { VideoModel } from '../Video';

describe('Video Performance Analytics', () => {
  test('should track detailed view analytics over time', () => {
    const video = new VideoModel('video1', 'creator1', 'Analytics Video', 'Performance tracking', 'analytics.mp4', 'analytics');

    // Simulate views across different hours and days
    const viewData = [
      // Monday views by hour
      { hour: 9, day: 1, device: 'mobile', country: 'US', source: 'direct', duration: 120 },
      { hour: 9, day: 1, device: 'desktop', country: 'US', source: 'social', duration: 180 },
      { hour: 14, day: 1, device: 'mobile', country: 'UK', source: 'search', duration: 90 },
      { hour: 14, day: 1, device: 'tablet', country: 'CA', source: 'email', duration: 150 },

      // Tuesday views
      { hour: 10, day: 2, device: 'mobile', country: 'US', source: 'direct', duration: 200 },
      { hour: 18, day: 2, device: 'desktop', country: 'US', source: 'social', duration: 300 },
      { hour: 18, day: 2, device: 'mobile', country: 'AU', source: 'youtube', duration: 250 },

      // Wednesday views
      { hour: 12, day: 3, device: 'desktop', country: 'US', source: 'direct', duration: 180 },
      { hour: 20, day: 3, device: 'mobile', country: 'IN', source: 'facebook', duration: 120 }
    ];

    viewData.forEach(data => {
      video.recordView(data.device, data.country, data.source, data.duration, data.hour, data.day);
    });

    expect(video.views).toBe(9);

    // Check hourly distribution
    expect(video.analytics.hourlyViews[9]).toBe(2); // 2 views at 9 AM
    expect(video.analytics.hourlyViews[14]).toBe(2); // 2 views at 2 PM
    expect(video.analytics.hourlyViews[18]).toBe(2); // 2 views at 6 PM
    expect(video.analytics.hourlyViews[10]).toBe(1);
    expect(video.analytics.hourlyViews[12]).toBe(1);
    expect(video.analytics.hourlyViews[20]).toBe(1);

    // Check daily distribution
    expect(video.analytics.dailyViews[1]).toBe(4); // Monday
    expect(video.analytics.dailyViews[2]).toBe(3); // Tuesday
    expect(video.analytics.dailyViews[3]).toBe(2); // Wednesday

    // Check geographic distribution
    expect(video.analytics.geographicViews['US']).toBe(5);
    expect(video.analytics.geographicViews['UK']).toBe(1);
    expect(video.analytics.geographicViews['CA']).toBe(1);
    expect(video.analytics.geographicViews['AU']).toBe(1);
    expect(video.analytics.geographicViews['IN']).toBe(1);
  });

  test('should calculate video performance scores', () => {
    const highPerfVideo = new VideoModel('high_perf', 'creator1', 'High Performer', 'Excellent engagement', 'high.mp4', 'performance');

    // Add high engagement
    for (let i = 0; i < 10000; i++) highPerfVideo.incrementViews();
    for (let i = 0; i < 2000; i++) highPerfVideo.like();
    for (let i = 0; i < 500; i++) highPerfVideo.share();
    for (let i = 0; i < 300; i++) highPerfVideo.addComment();
    for (let i = 0; i < 400; i++) highPerfVideo.save();

    highPerfVideo.updateAnalytics({
      completionRate: 95,
      audienceRetention: [98, 95, 92, 88, 85],
      watchTime: 10000 * 180 // 3 minutes average
    });

    expect(highPerfVideo.getVideoScore()).toBeGreaterThan(80);
    expect(highPerfVideo.getEngagementRate()).toBeGreaterThan(50);

    const lowPerfVideo = new VideoModel('low_perf', 'creator1', 'Low Performer', 'Poor engagement', 'low.mp4', 'performance');

    // Add minimal engagement
    for (let i = 0; i < 100; i++) lowPerfVideo.incrementViews();
    lowPerfVideo.updateAnalytics({
      completionRate: 20,
      audienceRetention: [30, 25, 20, 15, 10]
    });

    expect(lowPerfVideo.getVideoScore()).toBeLessThan(30);
    expect(lowPerfVideo.getEngagementRate()).toBeLessThan(10);
  });

  test('should determine optimal posting times and trending potential', () => {
    const video = new VideoModel('trending_video', 'creator1', 'Trending Content', 'Viral potential', 'trending.mp4', 'trending');

    // Simulate peak viewing hours
    const peakHoursData = [
      { hour: 8, views: 10 },   // Low activity
      { hour: 12, views: 50 },  // Lunch time
      { hour: 13, views: 45 },
      { hour: 18, views: 80 },  // Evening peak
      { hour: 19, views: 85 },  // Peak hour
      { hour: 20, views: 75 },
      { hour: 21, views: 30 }   // Evening decline
    ];

    peakHoursData.forEach(data => {
      for (let i = 0; i < data.views; i++) {
        video.recordView('mobile', 'US', 'social', 120, data.hour, 1);
      }
    });

    video.calculatePeakHours();

    expect(video.analytics.peakViewingHours).toContain(19); // Should include peak hour
    expect(video.analytics.peakViewingHours).toContain(18); // Should include near-peak
    expect(video.getOptimalPostingTime()).toBe(19);

    // Test trending score
    const trendingScore = video.getTrendingScore();
    expect(trendingScore).toBeGreaterThan(0);

    // Add more engagement for higher trending score
    for (let i = 0; i < 1000; i++) video.incrementViews();
    for (let i = 0; i < 100; i++) video.share();

    const higherTrendingScore = video.getTrendingScore();
    expect(higherTrendingScore).toBeGreaterThan(trendingScore);
  });

  test('should assess monetization potential', () => {
    const highValueVideo = new VideoModel('high_value', 'creator1', 'Monetizable Content', 'High value', 'monetize.mp4', 'business');

    // Add strong performance metrics
    for (let i = 0; i < 50000; i++) highValueVideo.incrementViews();
    highValueVideo.updateAnalytics({
      completionRate: 90,
      audienceRetention: [95, 92, 88, 85, 82]
    });

    expect(highValueVideo.getMonetizationPotential()).toBe('high');

    const mediumValueVideo = new VideoModel('medium_value', 'creator1', 'Medium Value', 'Good potential', 'medium.mp4', 'tutorial');

    for (let i = 0; i < 5000; i++) mediumValueVideo.incrementViews();
    mediumValueVideo.updateAnalytics({
      completionRate: 75,
      audienceRetention: [80, 75, 70, 65, 60]
    });

    expect(mediumValueVideo.getMonetizationPotential()).toBe('medium');

    const lowValueVideo = new VideoModel('low_value', 'creator1', 'Low Value', 'Limited potential', 'low.mp4', 'personal');

    for (let i = 0; i < 500; i++) lowValueVideo.incrementViews();
    lowValueVideo.updateAnalytics({
      completionRate: 30,
      audienceRetention: [40, 35, 30, 25, 20]
    });

    expect(lowValueVideo.getMonetizationPotential()).toBe('low');
  });

  test('should predict view growth and engagement trends', () => {
    const growingVideo = new VideoModel('growing', 'creator1', 'Growing Content', 'Trending up', 'growing.mp4', 'growth');

    // Start with initial views
    for (let i = 0; i < 1000; i++) growingVideo.incrementViews();

    growingVideo.updateAnalytics({
      completionRate: 85,
      audienceRetention: [90, 85, 80, 75, 70]
    });

    const initialScore = growingVideo.getVideoScore();
    const predictedViews = growingVideo.predictViewGrowth(30);

    expect(predictedViews).toBeGreaterThan(1000);

    // Add more engagement to improve growth prediction
    for (let i = 0; i < 2000; i++) growingVideo.incrementViews();
    for (let i = 0; i < 300; i++) growingVideo.like();

    growingVideo.updateEngagementRates();

    const improvedScore = growingVideo.getVideoScore();
    const improvedPrediction = growingVideo.predictViewGrowth(30);

    expect(improvedScore).toBeGreaterThan(initialScore);
    expect(improvedPrediction).toBeGreaterThan(predictedViews);
  });

  test('should track engagement rates and bounce metrics', () => {
    const engagedVideo = new VideoModel('engaged', 'creator1', 'Highly Engaged', 'Great interaction', 'engaged.mp4', 'engagement');

    // Add views and various engagement types
    for (let i = 0; i < 1000; i++) engagedVideo.incrementViews();
    for (let i = 0; i < 150; i++) engagedVideo.like(); // 15% like rate
    for (let i = 0; i < 80; i++) engagedVideo.share(); // 8% share rate
    for (let i = 0; i < 60; i++) engagedVideo.addComment(); // 6% comment rate
    for (let i = 0; i < 40; i++) engagedVideo.save(); // 4% save rate

    engagedVideo.updateEngagementRates();

    expect(engagedVideo.getEngagementRate()).toBeCloseTo(33, 0); // ~33% engagement rate
    expect(engagedVideo.analytics.shareRate).toBe(8);
    expect(engagedVideo.analytics.saveRate).toBe(4);

    // Bounce rate = (views - engaged users) / views * 100
    // Engaged users = likes + shares + comments + saves = 150 + 80 + 60 + 40 = 330
    // Bounce rate = (1000 - 330) / 1000 * 100 = 67%
    expect(engagedVideo.analytics.bounceRate).toBe(67);

    const lowEngagementVideo = new VideoModel('low_engaged', 'creator1', 'Low Engagement', 'Poor interaction', 'low.mp4', 'low');

    for (let i = 0; i < 1000; i++) lowEngagementVideo.incrementViews();
    // Only minimal engagement
    for (let i = 0; i < 10; i++) lowEngagementVideo.like();

    lowEngagementVideo.updateEngagementRates();

    expect(lowEngagementVideo.getEngagementRate()).toBe(1);
    expect(lowEngagementVideo.analytics.bounceRate).toBe(99);
  });

  test('should handle bulk video analytics operations efficiently', () => {
    const videos = [];

    // Create 50 videos for bulk testing
    for (let i = 0; i < 50; i++) {
      const video = new VideoModel(
        `bulk_video_${i}`,
        `creator${i % 5}`,
        `Bulk Video ${i}`,
        `Performance test video ${i}`,
        `video${i}.mp4`,
        ['tutorial', 'review', 'demo', 'interview', 'vlog'][i % 5]
      );
      videos.push(video);
    }

    const startTime = Date.now();

    // Simulate bulk analytics operations
    videos.forEach((video, index) => {
      const viewCount = Math.floor(Math.random() * 10000) + 1000;
      const engagementMultiplier = Math.random() * 0.3 + 0.1; // 10-40% engagement

      // Add views
      for (let i = 0; i < viewCount; i++) {
        const hour = Math.floor(Math.random() * 24);
        const day = Math.floor(Math.random() * 7);
        const device = ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)];
        const country = ['US', 'UK', 'CA', 'AU', 'DE', 'FR'][Math.floor(Math.random() * 6)];
        const source = ['direct', 'social', 'search', 'email'][Math.floor(Math.random() * 4)];

        video.recordView(device, country, source, video.duration * 0.8, hour, day);
      }

      // Add engagement
      const likes = Math.floor(viewCount * engagementMultiplier);
      const shares = Math.floor(likes * 0.3);
      const comments = Math.floor(likes * 0.2);
      const saves = Math.floor(likes * 0.15);

      for (let i = 0; i < likes; i++) video.like();
      for (let i = 0; i < shares; i++) video.share();
      for (let i = 0; i < comments; i++) video.addComment();
      for (let i = 0; i < saves; i++) video.save();

      // Update analytics
      video.updateAnalytics({
        completionRate: Math.random() * 50 + 50, // 50-100%
        audienceRetention: Array.from({ length: 5 }, () => Math.random() * 50 + 50) // 50-100%
      });

      video.updateEngagementRates();
      video.calculatePeakHours();
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all videos have analytics data
    videos.forEach(video => {
      expect(video.views).toBeGreaterThan(1000);
      expect(video.getEngagementRate()).toBeGreaterThan(0);
      expect(video.analytics.completionRate).toBeGreaterThan(0);
      expect(video.analytics.audienceRetention.length).toBe(5);
      expect(video.analytics.peakViewingHours.length).toBeGreaterThan(0);
    });

    // Performance check: should process 50 videos with analytics in less than 5 seconds
    expect(duration).toBeLessThan(5000);
    console.log(`Processed 50 videos with analytics in ${duration}ms`);

    // Calculate aggregate metrics
    const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
    const averageEngagementRate = videos.reduce((sum, video) => sum + video.getEngagementRate(), 0) / videos.length;
    const topPerformingVideo = videos.reduce((top, current) =>
      current.getVideoScore() > top.getVideoScore() ? current : top
    );

    expect(totalViews).toBeGreaterThan(50000);
    expect(averageEngagementRate).toBeGreaterThan(10);
    expect(topPerformingVideo.getVideoScore()).toBeGreaterThan(50);
  });
});