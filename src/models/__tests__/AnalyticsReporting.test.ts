import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { BusinessModel } from '../Business';
import { TransactionModel } from '../Transaction';

describe('Analytics and Reporting System', () => {
  test('should generate comprehensive user analytics', () => {
    const user = new UserModel('user1', 'Analytics User', 'analytics@test.com');

    // Simulate user activity over time
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    months.forEach((month, index) => {
      // Add videos created each month
      const videosThisMonth = 5 + index; // Increasing productivity
      user.incrementStats({
        totalVideos: videosThisMonth,
        totalViews: videosThisMonth * 1000 * (index + 1), // More views over time
        totalLikes: videosThisMonth * 100 * (index + 1),
        totalDownloads: videosThisMonth * 50 * (index + 1)
      });
    });

    // Calculate growth metrics
    const totalVideos = user.stats.totalVideos;
    const totalViews = user.stats.totalViews;
    const totalLikes = user.stats.totalLikes;
    const totalDownloads = user.stats.totalDownloads;

    // Growth rate calculations
    const videoGrowthRate = ((totalVideos - 5) / 5) * 100; // Percentage growth from first month
    const viewGrowthRate = ((totalViews - 5000) / 5000) * 100;

    expect(totalVideos).toBe(5 + 6 + 7 + 8 + 9 + 10); // 45 total videos
    expect(videoGrowthRate).toBeGreaterThan(100); // More than doubled
    expect(viewGrowthRate).toBeGreaterThan(500); // Significant view growth

    // Engagement metrics
    const totalEngagement = user.getEngagementScore();
    const engagementPerVideo = totalEngagement / totalVideos;

    expect(totalEngagement).toBe(totalViews + totalLikes * 2 + totalDownloads * 3);
    expect(engagementPerVideo).toBeGreaterThan(1000);
  });

  test('should track video performance analytics', () => {
    const creator = new UserModel('creator1', 'Analytics Creator', 'creator@test.com');
    const videos = [];

    // Create videos with different performance levels
    const videoConfigs = [
      { title: 'Viral Video', views: 10000, likes: 1000, shares: 500, watchTime: 150 },
      { title: 'Popular Video', views: 5000, likes: 400, shares: 150, watchTime: 120 },
      { title: 'Average Video', views: 1000, likes: 80, shares: 30, watchTime: 90 },
      { title: 'Low Performer', views: 100, likes: 5, shares: 2, watchTime: 60 }
    ];

    videoConfigs.forEach((config, index) => {
      const video = new VideoModel(
        `video${index}`,
        creator.id,
        config.title,
        `${config.title} description`,
        `video${index}.mp4`,
        'content',
        `thumb${index}.jpg`,
        180,
        'published'
      );

      // Simulate engagement
      for (let i = 0; i < config.views; i++) video.incrementViews();
      for (let i = 0; i < config.likes; i++) video.like();
      for (let i = 0; i < config.shares; i++) video.share();

      // Update analytics
      video.updateAnalytics({
        watchTime: config.views * config.watchTime,
        completionRate: 85 - (index * 10), // Decreasing completion rates
        audienceRetention: [95, 90, 85, 80, 70].slice(0, 5 - index)
      });

      videos.push(video);
    });

    // Calculate performance metrics
    const topPerformer = videos.reduce((top, video) =>
      video.views > top.views ? video : top
    );

    const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
    const totalLikes = videos.reduce((sum, video) => sum + video.likes, 0);
    const totalShares = videos.reduce((sum, video) => sum + video.shares, 0);

    const averageEngagementRate = videos.reduce((sum, video) => sum + video.getEngagementRate(), 0) / videos.length;
    const averageLikeRatio = videos.reduce((sum, video) => sum + video.getLikeRatio(), 0) / videos.length;

    // Verify analytics calculations
    expect(topPerformer.title).toBe('Viral Video');
    expect(totalViews).toBe(16100);
    expect(totalLikes).toBe(1485);
    expect(totalShares).toBe(682);
    expect(averageEngagementRate).toBeGreaterThan(50);
    expect(averageLikeRatio).toBeGreaterThan(8);
  });

  test('should generate business intelligence reports', () => {
    const business = new BusinessModel('biz1', 'user1', 'Analytics Corp', 'analytics');
    const owner = new UserModel('user1', 'Business Owner', 'owner@analytics.com');

    business.activate();

    // Simulate quarterly business performance
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const quarterlyMetrics = quarters.map((quarter, index) => ({
      quarter,
      videos: 25 * (index + 1),
      revenue: 5000 * (index + 1),
      customers: 100 * (index + 1),
      growth: (index + 1) * 25 // Percentage growth
    }));

    // Create transactions for each quarter
    const transactions = [];
    quarterlyMetrics.forEach((metrics, quarterIndex) => {
      for (let i = 0; i < metrics.customers; i++) {
        const transaction = new TransactionModel(
          `txn_q${quarterIndex}_${i}`,
          `customer${i}`,
          'payment',
          metrics.revenue / metrics.customers, // Average transaction value
          'USD',
          [{
            id: `service_${quarterIndex}_${i}`,
            type: 'video',
            description: `${quarter} service`,
            amount: metrics.revenue / metrics.customers,
            quantity: 1
          }],
          'completed',
          business.id
        );
        transactions.push(transaction);
      }
    });

    // Calculate business KPIs
    const totalRevenue = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    const totalTransactions = transactions.length;
    const averageTransactionValue = totalRevenue / totalTransactions;

    const quarterlyRevenue = quarterlyMetrics.map(m => m.revenue);
    const revenueGrowth = quarterlyRevenue.map((revenue, index) =>
      index === 0 ? 0 : ((revenue - quarterlyRevenue[index - 1]) / quarterlyRevenue[index - 1]) * 100
    );

    // Customer acquisition cost (simplified)
    const totalCustomers = quarterlyMetrics.reduce((sum, m) => sum + m.customers, 0);
    const customerAcquisitionCost = totalRevenue / totalCustomers;

    // Verify business metrics
    expect(totalRevenue).toBe(50000); // 5,000 + 10,000 + 15,000 + 20,000
    expect(totalTransactions).toBe(1000); // 100 + 200 + 300 + 400 customers
    expect(averageTransactionValue).toBe(50); // $50 per transaction
    expect(customerAcquisitionCost).toBe(50); // $50 per customer
    expect(revenueGrowth.slice(1)).toEqual([100, 50, 33.33]); // Growth percentages
  });

  test('should track geographic and device analytics', () => {
    const video = new VideoModel('analytics_video', 'creator1', 'Global Video', 'Content with worldwide appeal', 'global.mp4');

    // Simulate views from different countries and devices
    const viewData = [
      { country: 'US', device: 'mobile', source: 'youtube', count: 500 },
      { country: 'US', device: 'desktop', source: 'direct', count: 300 },
      { country: 'UK', device: 'mobile', source: 'facebook', count: 200 },
      { country: 'UK', device: 'tablet', source: 'twitter', count: 100 },
      { country: 'CA', device: 'desktop', source: 'youtube', count: 150 },
      { country: 'CA', device: 'mobile', source: 'instagram', count: 250 },
      { country: 'AU', device: 'mobile', source: 'tiktok', count: 180 },
      { country: 'DE', device: 'desktop', source: 'search', count: 120 }
    ];

    // Record all the views
    viewData.forEach(data => {
      for (let i = 0; i < data.count; i++) {
        video.recordView(data.device as any, data.country, data.source);
      }
    });

    const totalViews = viewData.reduce((sum, data) => sum + data.count, 0);
    expect(video.views).toBe(totalViews);

    // Verify geographic distribution
    expect(video.analytics.geographicViews['US']).toBe(800); // 500 + 300
    expect(video.analytics.geographicViews['UK']).toBe(300); // 200 + 100
    expect(video.analytics.geographicViews['CA']).toBe(400); // 150 + 250
    expect(video.analytics.geographicViews['AU']).toBe(180);
    expect(video.analytics.geographicViews['DE']).toBe(120);

    // Verify device distribution
    expect(video.analytics.deviceStats['mobile']).toBe(1130); // 500 + 200 + 250 + 180
    expect(video.analytics.deviceStats['desktop']).toBe(570); // 300 + 150 + 120
    expect(video.analytics.deviceStats['tablet']).toBe(100);

    // Verify traffic sources
    expect(video.analytics.trafficSources['youtube']).toBe(650); // 500 + 150
    expect(video.analytics.trafficSources['direct']).toBe(300);
    expect(video.analytics.trafficSources['facebook']).toBe(200);
    expect(video.analytics.trafficSources['twitter']).toBe(100);
    expect(video.analytics.trafficSources['instagram']).toBe(250);
    expect(video.analytics.trafficSources['tiktok']).toBe(180);
    expect(video.analytics.trafficSources['search']).toBe(120);
  });

  test('should generate content performance reports', () => {
    const creator = new UserModel('creator1', 'Report Creator', 'reports@test.com');
    const content = [];

    // Create diverse content portfolio
    const contentTypes = [
      { type: 'tutorial', count: 10 },
      { type: 'review', count: 8 },
      { type: 'entertainment', count: 12 },
      { type: 'educational', count: 6 }
    ];

    let contentIndex = 0;
    contentTypes.forEach(contentType => {
      for (let i = 0; i < contentType.count; i++) {
        const video = new VideoModel(
          `content${contentIndex}`,
          creator.id,
          `${contentType.type} Content ${i}`,
          `A ${contentType.type} video`,
          `video${contentIndex}.mp4`,
          contentType.type,
          `thumb${contentIndex}.jpg`,
          180,
          'published'
        );

        // Simulate realistic engagement based on content type
        const baseEngagement = { tutorial: 1000, review: 800, entertainment: 2000, educational: 600 };
        const views = Math.floor(baseEngagement[contentType.type as keyof typeof baseEngagement] * (0.5 + Math.random()));

        for (let v = 0; v < views; v++) video.incrementViews();
        for (let l = 0; l < Math.floor(views * 0.08); l++) video.like();
        for (let s = 0; s < Math.floor(views * 0.03); s++) video.share();

        content.push(video);
        contentIndex++;
      }
    });

    // Generate performance report
    const totalViews = content.reduce((sum, video) => sum + video.views, 0);
    const totalLikes = content.reduce((sum, video) => sum + video.likes, 0);
    const totalShares = content.reduce((sum, video) => sum + video.shares, 0);

    const averageViewsPerVideo = totalViews / content.length;
    const averageEngagementRate = content.reduce((sum, video) => sum + video.getEngagementRate(), 0) / content.length;

    // Content type performance
    const performanceByType = contentTypes.map(type => {
      const typeContent = content.filter(c => c.category === type.type);
      const typeViews = typeContent.reduce((sum, c) => sum + c.views, 0);
      const typeEngagement = typeContent.reduce((sum, c) => sum + c.getEngagementRate(), 0) / typeContent.length;

      return {
        type: type.type,
        contentCount: typeContent.length,
        totalViews: typeViews,
        averageViews: typeViews / typeContent.length,
        averageEngagement: typeEngagement
      };
    });

    // Top performing content
    const topContent = content
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Verify report data
    expect(content).toHaveLength(36); // 10 + 8 + 12 + 6
    expect(totalViews).toBeGreaterThan(30000);
    expect(averageViewsPerVideo).toBeGreaterThan(800);
    expect(averageEngagementRate).toBeGreaterThan(10);

    // Entertainment content should perform best
    const entertainmentPerf = performanceByType.find(p => p.type === 'entertainment');
    expect(entertainmentPerf?.averageViews).toBeGreaterThan(1000);

    // Top content should have highest views
    expect(topContent[0].views).toBeGreaterThan(topContent[4].views);
    expect(topContent.every(c => c.isPublished())).toBe(true);
  });

  test('should track user engagement patterns over time', () => {
    const user = new UserModel('user1', 'Engagement User', 'engagement@test.com');

    // Simulate engagement over 30 days
    const dailyEngagement = [];
    for (let day = 1; day <= 30; day++) {
      const dayEngagement = {
        day,
        videosWatched: Math.floor(Math.random() * 10) + 1,
        likesGiven: Math.floor(Math.random() * 5),
        commentsMade: Math.floor(Math.random() * 3),
        sharesMade: Math.floor(Math.random() * 2),
        contentCreated: day % 3 === 0 ? 1 : 0 // Create content every 3 days
      };
      dailyEngagement.push(dayEngagement);

      // Update user stats
      user.incrementStats({
        totalViews: dayEngagement.videosWatched,
        totalLikes: dayEngagement.likesGiven,
        totalVideos: dayEngagement.contentCreated
      });
    }

    // Calculate engagement patterns
    const totalEngagementDays = dailyEngagement.length;
    const activeDays = dailyEngagement.filter(d => d.videosWatched > 0).length;
    const contentCreationDays = dailyEngagement.filter(d => d.contentCreated > 0).length;

    const averageDailyViews = dailyEngagement.reduce((sum, d) => sum + d.videosWatched, 0) / totalEngagementDays;
    const averageDailyLikes = dailyEngagement.reduce((sum, d) => sum + d.likesGiven, 0) / totalEngagementDays;
    const averageDailyComments = dailyEngagement.reduce((sum, d) => sum + d.commentsMade, 0) / totalEngagementDays;

    const engagementConsistency = activeDays / totalEngagementDays * 100;
    const contentCreationFrequency = contentCreationDays / totalEngagementDays * 100;

    // Verify engagement metrics
    expect(totalEngagementDays).toBe(30);
    expect(activeDays).toBe(30); // All days have some activity
    expect(averageDailyViews).toBeGreaterThan(1);
    expect(averageDailyViews).toBeLessThan(10);
    expect(engagementConsistency).toBe(100);
    expect(contentCreationFrequency).toBeCloseTo(33.33, 1); // Every 3rd day

    // Overall user stats should reflect cumulative engagement
    expect(user.stats.totalViews).toBe(dailyEngagement.reduce((sum, d) => sum + d.videosWatched, 0));
    expect(user.stats.totalLikes).toBe(dailyEngagement.reduce((sum, d) => sum + d.likesGiven, 0));
    expect(user.stats.totalVideos).toBe(dailyEngagement.reduce((sum, d) => sum + d.contentCreated, 0));
  });
});