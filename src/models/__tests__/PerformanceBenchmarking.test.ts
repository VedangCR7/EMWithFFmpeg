import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { BusinessModel } from '../Business';
import { TransactionModel } from '../Transaction';

describe('Performance Benchmarking Suite', () => {
  test('should benchmark user model creation performance', () => {
    const testSizes = [100, 1000, 10000];

    testSizes.forEach(size => {
      const startTime = Date.now();

      const users = [];
      for (let i = 0; i < size; i++) {
        const user = new UserModel(
          `user_${i}`,
          `User ${i}`,
          `user${i}@benchmark.com`,
          `+1${String(i).padStart(10, '0')}`,
          `business_${i % 10}`,
          `plan_${i % 5}`,
          `avatar${i}.jpg`,
          true,
          'creator',
          {
            theme: i % 2 === 0 ? 'dark' : 'light',
            notifications: true,
            language: 'en',
            emailFrequency: 'weekly'
          }
        );
        users.push(user);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all users were created correctly
      expect(users).toHaveLength(size);
      users.forEach((user, index) => {
        expect(user.id).toBe(`user_${index}`);
        expect(user.isValid()).toBe(true);
      });

      // Performance benchmarks (adjust based on environment)
      const maxDuration = size === 100 ? 100 : size === 1000 ? 1000 : 5000;
      expect(duration).toBeLessThan(maxDuration);

      console.log(`Created ${size} users in ${duration}ms (${(size / duration * 1000).toFixed(0)} users/sec)`);
    });
  });

  test('should benchmark video model operations performance', () => {
    const video = new VideoModel('benchmark_video', 'creator1', 'Benchmark Video', 'Performance test', 'benchmark.mp4');

    // Benchmark view increment operations
    const viewOperations = [1000, 10000, 100000];

    viewOperations.forEach(operationCount => {
      const startTime = Date.now();

      for (let i = 0; i < operationCount; i++) {
        video.incrementViews();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(video.views).toBe(operationCount);

      // Performance check: should handle high-frequency operations
      expect(duration).toBeLessThan(1000); // Less than 1 second for reasonable operation counts

      console.log(`Processed ${operationCount} view increments in ${duration}ms (${(operationCount / duration * 1000).toFixed(0)} ops/sec)`);
    });

    // Reset for next test
    video.views = 0;

    // Benchmark analytics updates
    const analyticsStartTime = Date.now();

    for (let i = 0; i < 10000; i++) {
      video.recordView('mobile', 'US', 'direct', 120, 14, 1); // 2 PM on Monday
    }

    const analyticsEndTime = Date.now();
    const analyticsDuration = analyticsEndTime - analyticsStartTime;

    expect(video.views).toBe(10000);
    expect(video.analytics.geographicViews['US']).toBe(10000);
    expect(video.analytics.deviceStats['mobile']).toBe(10000);
    expect(video.analytics.trafficSources['direct']).toBe(10000);

    console.log(`Processed 10000 detailed analytics records in ${analyticsDuration}ms`);
  });

  test('should benchmark bulk data processing operations', () => {
    const startTime = Date.now();

    // Create comprehensive test dataset
    const users = [];
    const videos = [];
    const businesses = [];
    const transactions = [];

    // Create 500 users
    for (let i = 0; i < 500; i++) {
      const user = new UserModel(`bulk_user_${i}`, `Bulk User ${i}`, `bulk${i}@test.com`);
      users.push(user);
    }

    // Create 1000 videos across users
    for (let i = 0; i < 1000; i++) {
      const creator = users[i % users.length];
      const video = new VideoModel(
        `bulk_video_${i}`,
        creator.id,
        `Bulk Video ${i}`,
        `Content created by ${creator.name}`,
        `video${i}.mp4`,
        ['tutorial', 'review', 'demo'][i % 3]
      );
      videos.push(video);
    }

    // Create 200 businesses
    for (let i = 0; i < 200; i++) {
      const owner = users[i % users.length];
      const business = new BusinessModel(`bulk_business_${i}`, owner.id, `Bulk Business ${i}`, 'general');
      businesses.push(business);
    }

    // Create 5000 transactions
    for (let i = 0; i < 5000; i++) {
      const user = users[i % users.length];
      const transaction = new TransactionModel(
        `bulk_txn_${i}`,
        user.id,
        'payment',
        Math.random() * 100 + 10, // Random amount between 10-110
        'USD'
      );
      transactions.push(transaction);
    }

    const dataCreationTime = Date.now() - startTime;

    // Benchmark data processing operations
    const processingStartTime = Date.now();

    // Process engagement across all videos
    videos.forEach(video => {
      const engagementCount = Math.floor(Math.random() * 1000) + 100;
      for (let i = 0; i < engagementCount; i++) {
        video.incrementViews();
        if (Math.random() < 0.1) video.like();
        if (Math.random() < 0.05) video.share();
      }
    });

    // Update user statistics
    users.forEach(user => {
      const userVideos = videos.filter(v => v.userId === user.id);
      const totalViews = userVideos.reduce((sum, v) => sum + v.views, 0);
      const totalLikes = userVideos.reduce((sum, v) => sum + v.likes, 0);

      user.incrementStats({
        totalVideos: userVideos.length,
        totalViews: totalViews,
        totalLikes: totalLikes
      });
    });

    // Calculate business metrics
    businesses.forEach(business => {
      const businessTransactions = transactions.filter(t => t.businessId === business.id);
      const revenue = businessTransactions.reduce((sum, t) => sum + t.amount, 0);
      // In a real scenario, this would update business analytics
    });

    const processingEndTime = Date.now();
    const processingDuration = processingEndTime - processingStartTime;
    const totalDuration = processingEndTime - startTime;

    // Verify data integrity
    expect(users).toHaveLength(500);
    expect(videos).toHaveLength(1000);
    expect(businesses).toHaveLength(200);
    expect(transactions).toHaveLength(5000);

    // Verify relationships
    videos.forEach(video => {
      expect(users.some(u => u.id === video.userId)).toBe(true);
    });

    businesses.forEach(business => {
      expect(users.some(u => u.id === business.userId)).toBe(true);
    });

    transactions.forEach(transaction => {
      expect(users.some(u => u.id === transaction.userId)).toBe(true);
    });

    // Performance verification
    expect(totalDuration).toBeLessThan(30000); // Should complete within 30 seconds
    expect(processingDuration).toBeLessThan(15000); // Processing should be under 15 seconds

    console.log(`Bulk data processing benchmark:
- Data creation: ${dataCreationTime}ms
- Processing operations: ${processingDuration}ms
- Total time: ${totalDuration}ms
- Users processed: ${users.length}
- Videos processed: ${videos.length}
- Businesses processed: ${businesses.length}
- Transactions processed: ${transactions.length}`);
  });

  test('should benchmark memory usage with large datasets', () => {
    const initialMemory = process.memoryUsage();

    const dataset = {
      users: [],
      videos: [],
      businesses: [],
      transactions: []
    };

    // Create progressively larger datasets to test memory scaling
    const sizes = [1000, 5000, 10000];

    sizes.forEach(size => {
      const startTime = Date.now();

      // Clear previous data
      dataset.users = [];
      dataset.videos = [];
      dataset.businesses = [];
      dataset.transactions = [];

      // Create dataset
      for (let i = 0; i < size; i++) {
        dataset.users.push(new UserModel(`mem_user_${i}`, `Memory User ${i}`, `mem${i}@test.com`));
        dataset.videos.push(new VideoModel(`mem_video_${i}`, `mem_user_${i % 100}`, `Memory Video ${i}`, 'Test content', `video${i}.mp4`));
        dataset.businesses.push(new BusinessModel(`mem_business_${i}`, `mem_user_${i % 100}`, `Memory Business ${i}`, 'tech'));
        dataset.transactions.push(new TransactionModel(`mem_txn_${i}`, `mem_user_${i % 100}`, 'payment', Math.random() * 100));
      }

      const creationTime = Date.now() - startTime;
      const currentMemory = process.memoryUsage();
      const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
      const memoryMB = memoryIncrease / (1024 * 1024);

      // Verify dataset integrity
      expect(dataset.users).toHaveLength(size);
      expect(dataset.videos).toHaveLength(size);
      expect(dataset.businesses).toHaveLength(size);
      expect(dataset.transactions).toHaveLength(size);

      // Performance checks
      expect(creationTime).toBeLessThan(10000); // Should create within 10 seconds
      expect(memoryMB).toBeLessThan(500); // Should use reasonable memory

      console.log(`Memory benchmark for ${size} items:
- Creation time: ${creationTime}ms
- Memory increase: ${memoryMB.toFixed(2)}MB
- Objects per MB: ${(size * 4 / memoryMB).toFixed(0)}`);

      // Force garbage collection if available (for more accurate measurements)
      if (global.gc) {
        global.gc();
      }
    });
  });

  test('should benchmark serialization and deserialization performance', () => {
    // Create test data
    const users = [];
    const videos = [];

    for (let i = 0; i < 1000; i++) {
      const user = new UserModel(`serial_user_${i}`, `Serial User ${i}`, `serial${i}@test.com`);
      user.incrementStats({
        totalVideos: Math.floor(Math.random() * 50),
        totalViews: Math.floor(Math.random() * 5000),
        totalLikes: Math.floor(Math.random() * 500)
      });
      users.push(user);

      const video = new VideoModel(`serial_video_${i}`, user.id, `Serial Video ${i}`, 'Test content', `video${i}.mp4`);
      for (let j = 0; j < Math.floor(Math.random() * 1000); j++) {
        video.incrementViews();
      }
      videos.push(video);
    }

    // Benchmark serialization
    const serializationStartTime = Date.now();

    const serializedUsers = users.map(user => JSON.stringify(user));
    const serializedVideos = videos.map(video => JSON.stringify(video));

    const serializationEndTime = Date.now();
    const serializationDuration = serializationEndTime - serializationStartTime;

    // Benchmark deserialization
    const deserializationStartTime = Date.now();

    const deserializedUsers = serializedUsers.map(data => {
      const obj = JSON.parse(data);
      Object.setPrototypeOf(obj, UserModel.prototype);
      return obj;
    });

    const deserializedVideos = serializedVideos.map(data => {
      const obj = JSON.parse(data);
      Object.setPrototypeOf(obj, VideoModel.prototype);
      return obj;
    });

    const deserializationEndTime = Date.now();
    const deserializationDuration = deserializationEndTime - deserializationStartTime;

    // Verify data integrity after round-trip
    expect(deserializedUsers).toHaveLength(users.length);
    expect(deserializedVideos).toHaveLength(videos.length);

    deserializedUsers.forEach((user, index) => {
      expect(user.id).toBe(users[index].id);
      expect(user.name).toBe(users[index].name);
      expect(user.stats.totalVideos).toBe(users[index].stats.totalVideos);
      expect(user.isValid()).toBe(true);
    });

    deserializedVideos.forEach((video, index) => {
      expect(video.id).toBe(videos[index].id);
      expect(video.title).toBe(videos[index].title);
      expect(video.views).toBe(videos[index].views);
      expect(video.isValid()).toBe(true);
    });

    // Performance verification
    expect(serializationDuration).toBeLessThan(5000);
    expect(deserializationDuration).toBeLessThan(5000);

    console.log(`Serialization/Deserialization benchmark:
- Serialization: ${serializationDuration}ms for ${users.length + videos.length} objects
- Deserialization: ${deserializationDuration}ms for ${users.length + videos.length} objects
- Total round-trip time: ${serializationDuration + deserializationDuration}ms`);
  });

  test('should benchmark complex query operations', () => {
    // Create comprehensive dataset
    const users = [];
    const videos = [];
    const businesses = [];

    // Create 2000 users with varied profiles
    for (let i = 0; i < 2000; i++) {
      const user = new UserModel(`query_user_${i}`, `Query User ${i}`, `query${i}@test.com`);
      user.role = ['user', 'creator', 'business'][i % 3] as any;
      user.isVerified = Math.random() > 0.7; // 30% verified
      user.stats.followerCount = Math.floor(Math.random() * 10000);
      user.stats.followingCount = Math.floor(Math.random() * 1000);
      users.push(user);
    }

    // Create 5000 videos with varied metadata
    for (let i = 0; i < 5000; i++) {
      const creator = users[Math.floor(Math.random() * users.length)];
      const video = new VideoModel(
        `query_video_${i}`,
        creator.id,
        `Query Video ${i}`,
        `Content for category ${['tech', 'business', 'entertainment', 'education'][i % 4]}`,
        `video${i}.mp4`,
        ['tech', 'business', 'entertainment', 'education'][i % 4],
        `thumb${i}.jpg`,
        180,
        'published'
      );

      // Add varied engagement
      const viewCount = Math.floor(Math.random() * 10000);
      for (let v = 0; v < viewCount; v++) video.incrementViews();

      const likeCount = Math.floor(viewCount * (0.05 + Math.random() * 0.15)); // 5-20% like rate
      for (let l = 0; l < likeCount; l++) video.like();

      videos.push(video);
    }

    // Create 500 businesses
    for (let i = 0; i < 500; i++) {
      const owner = users[Math.floor(Math.random() * users.length)];
      const business = new BusinessModel(`query_business_${i}`, owner.id, `Query Business ${i}`, ['tech', 'marketing', 'consulting'][i % 3]);
      businesses.push(business);
    }

    // Benchmark complex queries
    const queryStartTime = Date.now();

    // Query 1: Find top-performing creators
    const topCreators = users
      .filter(user => user.role === 'creator')
      .map(creator => ({
        creator,
        videoCount: videos.filter(v => v.userId === creator.id).length,
        totalViews: videos.filter(v => v.userId === creator.id).reduce((sum, v) => sum + v.views, 0),
        totalLikes: videos.filter(v => v.userId === creator.id).reduce((sum, v) => sum + v.likes, 0)
      }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 10);

    // Query 2: Find trending videos by category
    const trendingByCategory = ['tech', 'business', 'entertainment', 'education'].map(category => ({
      category,
      videos: videos
        .filter(v => v.category === category)
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
    }));

    // Query 3: Business performance analysis
    const businessPerformance = businesses.map(business => {
      const businessVideos = videos.filter(v => v.userId === business.userId);
      const totalRevenue = Math.random() * 10000; // Simulated revenue

      return {
        business,
        videoCount: businessVideos.length,
        totalViews: businessVideos.reduce((sum, v) => sum + v.views, 0),
        totalRevenue,
        averageViewsPerVideo: businessVideos.length > 0 ?
          businessVideos.reduce((sum, v) => sum + v.views, 0) / businessVideos.length : 0
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Query 4: User engagement analysis
    const userEngagement = users.map(user => {
      const userVideos = videos.filter(v => v.userId === user.id);
      const totalViews = userVideos.reduce((sum, v) => sum + v.views, 0);
      const totalLikes = userVideos.reduce((sum, v) => sum + v.likes, 0);

      return {
        user,
        videoCount: userVideos.length,
        totalViews,
        totalLikes,
        engagementRate: userVideos.length > 0 ? (totalLikes / totalViews) * 100 : 0,
        followerRatio: user.stats.followingCount > 0 ? user.stats.followerCount / user.stats.followingCount : 0
      };
    }).filter(analysis => analysis.videoCount > 0);

    const queryEndTime = Date.now();
    const queryDuration = queryEndTime - queryStartTime;

    // Verify query results
    expect(topCreators).toHaveLength(10);
    expect(trendingByCategory).toHaveLength(4);
    expect(businessPerformance).toHaveLength(500);
    expect(userEngagement.length).toBeGreaterThan(0);

    // Performance verification
    expect(queryDuration).toBeLessThan(10000); // Should complete within 10 seconds

    console.log(`Complex query benchmark:
- Dataset: ${users.length} users, ${videos.length} videos, ${businesses.length} businesses
- Query time: ${queryDuration}ms
- Top creators found: ${topCreators.length}
- Categories analyzed: ${trendingByCategory.length}
- Business performance reports: ${businessPerformance.length}
- User engagement profiles: ${userEngagement.length}`);

    // Verify data consistency in results
    topCreators.forEach(creator => {
      expect(creator.videoCount).toBeGreaterThanOrEqual(0);
      expect(creator.totalViews).toBeGreaterThanOrEqual(0);
    });

    trendingByCategory.forEach(category => {
      expect(category.videos.length).toBeLessThanOrEqual(5);
      expect(category.videos.every(v => v.category === category.category)).toBe(true);
    });
  });

  test('should benchmark concurrent operations performance', () => {
    const user = new UserModel('concurrent_user', 'Concurrent User', 'concurrent@test.com');
    const video = new VideoModel('concurrent_video', user.id, 'Concurrent Video', 'Test concurrency', 'concurrent.mp4');

    // Test concurrent stat updates
    const concurrentOperations = 1000;
    const promises = [];

    const startTime = Date.now();

    // Create concurrent operations
    for (let i = 0; i < concurrentOperations; i++) {
      promises.push(
        Promise.resolve(user.incrementStats({
          totalViews: 1,
          totalLikes: Math.random() > 0.5 ? 1 : 0,
          totalShares: Math.random() > 0.7 ? 1 : 0
        }))
      );
    }

    // Add concurrent video operations
    for (let i = 0; i < concurrentOperations; i++) {
      promises.push(
        Promise.resolve(video.recordView(
          ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)] as any,
          ['US', 'UK', 'CA', 'AU'][Math.floor(Math.random() * 4)],
          ['direct', 'social', 'search'][Math.floor(Math.random() * 3)] as any,
          120 + Math.random() * 60,
          Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 7)
        ))
      );
    }

    return Promise.all(promises).then(() => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify final state
      expect(user.stats.totalViews).toBe(concurrentOperations);
      expect(video.views).toBe(concurrentOperations);

      // User stats should be consistent
      expect(user.stats.totalLikes).toBeGreaterThanOrEqual(0);
      expect(user.stats.totalShares).toBeGreaterThanOrEqual(0);
      expect(user.stats.totalLikes + user.stats.totalShares).toBeLessThanOrEqual(concurrentOperations);

      // Video analytics should be populated
      expect(Object.keys(video.analytics.deviceStats)).toHaveLength(3); // mobile, desktop, tablet
      expect(Object.keys(video.analytics.geographicViews).length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(video.analytics.trafficSources).length).toBeGreaterThanOrEqual(1);

      // Performance check
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`Concurrent operations benchmark:
- Operations: ${concurrentOperations * 2}
- Duration: ${duration}ms
- Operations/sec: ${((concurrentOperations * 2) / duration * 1000).toFixed(0)}`);
    });
  });
});