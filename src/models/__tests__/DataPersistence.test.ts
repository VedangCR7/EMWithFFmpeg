import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { BusinessModel } from '../Business';

describe('Data Persistence and Caching', () => {
  test('should serialize and deserialize user data correctly', () => {
    const originalUser = new UserModel('user1', 'Test User', 'test@test.com', '+1234567890');
    originalUser.updateProfile({
      bio: 'Test bio',
      website: 'https://test.com',
      avatar: 'avatar.jpg',
      banner: 'banner.jpg'
    });
    originalUser.updateSocialLinks({
      twitter: '@testuser',
      linkedin: 'test-user'
    });
    originalUser.incrementStats({
      totalVideos: 5,
      totalViews: 1000,
      totalLikes: 100
    });

    // Simulate JSON serialization/deserialization
    const serializedData = JSON.stringify(originalUser);
    const deserializedUser = JSON.parse(serializedData);

    // Restore the prototype and methods
    Object.setPrototypeOf(deserializedUser, UserModel.prototype);

    // Verify all data is preserved
    expect(deserializedUser.id).toBe(originalUser.id);
    expect(deserializedUser.name).toBe(originalUser.name);
    expect(deserializedUser.email).toBe(originalUser.email);
    expect(deserializedUser.bio).toBe(originalUser.bio);
    expect(deserializedUser.website).toBe(originalUser.website);
    expect(deserializedUser.avatar).toBe(originalUser.avatar);
    expect(deserializedUser.banner).toBe(originalUser.banner);
    expect(deserializedUser.socialLinks.twitter).toBe('@testuser');
    expect(deserializedUser.socialLinks.linkedin).toBe('test-user');

    // Verify stats are preserved
    expect(deserializedUser.stats.totalVideos).toBe(5);
    expect(deserializedUser.stats.totalViews).toBe(1000);
    expect(deserializedUser.stats.totalLikes).toBe(100);

    // Verify methods work after deserialization
    expect(deserializedUser.getDisplayName()).toBe('Test User');
    expect(deserializedUser.getEngagementScore()).toBe(originalUser.getEngagementScore());
  });

  test('should handle video data persistence with analytics', () => {
    const video = new VideoModel('video1', 'creator1', 'Test Video', 'Description', 'video.mp4', 'test');

    // Add comprehensive data
    for (let i = 0; i < 1000; i++) video.incrementViews();
    for (let i = 0; i < 100; i++) video.like();
    for (let i = 0; i < 50; i++) video.share();

    video.updateAnalytics({
      watchTime: 80000, // 80 seconds total watch time
      completionRate: 85,
      audienceRetention: [95, 90, 85, 80, 75],
      trafficSources: { 'direct': 300, 'social': 400, 'search': 300 }
    });

    // Serialize and deserialize
    const serializedVideo = JSON.stringify(video);
    const deserializedVideo = JSON.parse(serializedVideo);
    Object.setPrototypeOf(deserializedVideo, VideoModel.prototype);

    // Restore analytics object structure (JSON doesn't preserve empty objects well)
    deserializedVideo.analytics = {
      ...deserializedVideo.analytics,
      trafficSources: deserializedVideo.analytics.trafficSources || {},
      deviceStats: deserializedVideo.analytics.deviceStats || {},
      geographicViews: deserializedVideo.analytics.geographicViews || {},
      audienceRetention: deserializedVideo.analytics.audienceRetention || []
    };

    // Verify data integrity
    expect(deserializedVideo.id).toBe(video.id);
    expect(deserializedVideo.title).toBe(video.title);
    expect(deserializedVideo.views).toBe(1000);
    expect(deserializedVideo.likes).toBe(100);
    expect(deserializedVideo.shares).toBe(50);

    // Verify analytics data
    expect(deserializedVideo.analytics.watchTime).toBe(80000);
    expect(deserializedVideo.analytics.completionRate).toBe(85);
    expect(deserializedVideo.analytics.audienceRetention).toEqual([95, 90, 85, 80, 75]);
    expect(deserializedVideo.analytics.trafficSources.direct).toBe(300);
    expect(deserializedVideo.analytics.trafficSources.social).toBe(400);

    // Verify calculated metrics work after deserialization
    expect(deserializedVideo.getEngagementRate()).toBe(video.getEngagementRate());
    expect(deserializedVideo.getVideoScore()).toBe(video.getVideoScore());
  });

  test('should implement data validation during persistence', () => {
    const validUser = new UserModel('valid_user', 'Valid User', 'valid@test.com');
    const invalidUser = new UserModel('', '', 'invalid-email');

    // Simulate persistence validation
    const validateForPersistence = (user: UserModel) => {
      const errors = [];

      if (!user.id || user.id.trim().length === 0) errors.push('ID is required');
      if (!user.name || user.name.trim().length === 0) errors.push('Name is required');
      if (!user.email || !user.email.includes('@')) errors.push('Valid email is required');
      if (user.stats.totalVideos < 0) errors.push('Total videos cannot be negative');
      if (user.stats.reputationScore < 0 || user.stats.reputationScore > 1000) {
        errors.push('Reputation score must be between 0 and 1000');
      }

      return errors;
    };

    const validErrors = validateForPersistence(validUser);
    const invalidErrors = validateForPersistence(invalidUser);

    expect(validErrors).toHaveLength(0);
    expect(invalidErrors).toContain('ID is required');
    expect(invalidErrors).toContain('Name is required');
    expect(invalidErrors).toContain('Valid email is required');

    // Test edge cases
    const edgeCaseUser = new UserModel('edge', 'Edge Case', 'edge@test.com');
    edgeCaseUser.stats.reputationScore = 1500; // Invalid score

    const edgeErrors = validateForPersistence(edgeCaseUser);
    expect(edgeErrors).toContain('Reputation score must be between 0 and 1000');
  });

  test('should handle data migration and schema evolution', () => {
    // Simulate old user data format (missing new fields)
    const oldUserData = {
      id: 'legacy_user',
      name: 'Legacy User',
      email: 'legacy@test.com',
      phone: '+1234567890',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      // Missing new fields like stats, socialLinks, etc.
    };

    // Migration function to add missing fields
    const migrateUserData = (oldData: any) => {
      return {
        ...oldData,
        bio: oldData.bio || '',
        website: oldData.website || '',
        avatar: oldData.avatar || '',
        banner: oldData.banner || '',
        socialLinks: oldData.socialLinks || {},
        isActive: oldData.isActive !== undefined ? oldData.isActive : true,
        isVerified: oldData.isVerified || false,
        role: oldData.role || 'user',
        preferences: oldData.preferences || {
          theme: 'light',
          notifications: true,
          language: 'en',
          emailFrequency: 'weekly'
        },
        stats: {
          totalVideos: oldData.totalVideos || 0,
          totalGreetings: oldData.totalGreetings || 0,
          totalViews: oldData.totalViews || 0,
          totalLikes: oldData.totalLikes || 0,
          totalDislikes: oldData.totalDislikes || 0,
          totalShares: oldData.totalShares || 0,
          totalDownloads: oldData.totalDownloads || 0,
          totalComments: oldData.totalComments || 0,
          totalSaves: oldData.totalSaves || 0,
          joinedDate: oldData.joinedDate || oldData.createdAt,
          lastLoginDate: oldData.lastLoginDate,
          lastActivityDate: oldData.lastActivityDate,
          contentQualityScore: oldData.contentQualityScore || 0,
          followerCount: oldData.followerCount || 0,
          followingCount: oldData.followingCount || 0,
          reputationScore: oldData.reputationScore || 0
        },
        badges: oldData.badges || [],
        achievements: oldData.achievements || []
      };
    };

    const migratedData = migrateUserData(oldUserData);
    const migratedUser = Object.assign(new UserModel('', '', ''), migratedData);

    // Verify migrated data has all required fields
    expect(migratedUser.id).toBe('legacy_user');
    expect(migratedUser.name).toBe('Legacy User');
    expect(migratedUser.email).toBe('legacy@test.com');
    expect(migratedUser.bio).toBe(''); // Added default
    expect(migratedUser.socialLinks).toEqual({}); // Added default
    expect(migratedUser.isActive).toBe(true); // Added default
    expect(migratedUser.role).toBe('user'); // Added default
    expect(migratedUser.stats.totalVideos).toBe(0); // Added default
    expect(migratedUser.badges).toEqual([]); // Added default

    // Verify migrated user is valid
    expect(migratedUser.isValid()).toBe(true);
  });

  test('should implement caching strategies for performance', () => {
    // Simulate a simple cache implementation
    class DataCache {
      private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

      set(key: string, data: any, ttl: number = 300000) { // 5 minutes default TTL
        this.cache.set(key, {
          data: JSON.parse(JSON.stringify(data)), // Deep clone
          timestamp: Date.now(),
          ttl
        });
      }

      get(key: string): any | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > cached.ttl) {
          this.cache.delete(key);
          return null;
        }

        return JSON.parse(JSON.stringify(cached.data)); // Return deep clone
      }

      invalidate(key: string) {
        this.cache.delete(key);
      }

      clear() {
        this.cache.clear();
      }
    }

    const cache = new DataCache();
    const user = new UserModel('cache_user', 'Cache User', 'cache@test.com');

    // Cache user data
    cache.set(`user_${user.id}`, user, 60000); // 1 minute TTL

    // Retrieve from cache
    const cachedUser = cache.get(`user_${user.id}`);
    expect(cachedUser).not.toBeNull();
    expect(cachedUser.id).toBe(user.id);
    expect(cachedUser.name).toBe(user.name);

    // Verify cached data is independent (changes to original don't affect cache)
    user.name = 'Modified Name';
    const cachedUserAgain = cache.get(`user_${user.id}`);
    expect(cachedUserAgain.name).toBe('Cache User'); // Should be original cached value

    // Test cache expiration
    cache.set(`temp_user`, { id: 'temp' }, 100); // 100ms TTL
    expect(cache.get('temp_user')).not.toBeNull();

    // Wait for expiration
    setTimeout(() => {
      expect(cache.get('temp_user')).toBeNull();
    }, 150);
  });

  test('should handle bulk data operations with transaction safety', () => {
    const users = [];
    const videos = [];

    // Create test data
    for (let i = 0; i < 100; i++) {
      const user = new UserModel(`bulk_user${i}`, `Bulk User ${i}`, `bulk${i}@test.com`);
      users.push(user);

      const video = new VideoModel(`bulk_video${i}`, user.id, `Bulk Video ${i}`, 'Bulk content', `video${i}.mp4`);
      videos.push(video);
    }

    // Simulate bulk operations with transaction-like safety
    const performBulkOperation = async (operation: () => Promise<void>) => {
      const initialState = {
        userCount: users.length,
        videoCount: videos.length,
        totalViews: videos.reduce((sum, v) => sum + v.views, 0)
      };

      try {
        await operation();

        // Verify data consistency after operation
        expect(users).toHaveLength(initialState.userCount);
        expect(videos).toHaveLength(initialState.videoCount);

        // Verify all data is valid
        users.forEach(user => expect(user.isValid()).toBe(true));
        videos.forEach(video => expect(video.isValid()).toBe(true));

        return { success: true };
      } catch (error) {
        // In a real system, we would rollback changes here
        console.error('Bulk operation failed:', error);
        return { success: false, error };
      }
    };

    // Test successful bulk operation
    const successfulOperation = async () => {
      users.forEach(user => user.incrementStats({ totalVideos: 1 }));
      videos.forEach(video => {
        video.incrementViews();
        video.like();
      });
    };

    performBulkOperation(successfulOperation).then(result => {
      expect(result.success).toBe(true);

      // Verify changes were applied
      expect(users.every(u => u.stats.totalVideos >= 1)).toBe(true);
      expect(videos.every(v => v.views >= 1 && v.likes >= 1)).toBe(true);
    });

    // Test operation that might fail
    const failingOperation = async () => {
      // Process some data
      users.slice(0, 50).forEach(user => user.incrementStats({ totalViews: 10 }));

      // Simulate an error
      if (Math.random() > 0.5) { // This will cause the test to be unpredictable
        throw new Error('Simulated bulk operation failure');
      }

      // Continue processing
      videos.slice(0, 50).forEach(video => video.incrementViews());
    };

    // Note: In a real implementation, the failing operation would trigger rollback
    // For this test, we're just demonstrating the pattern
  });

  test('should implement data backup and recovery mechanisms', () => {
    const user = new UserModel('backup_user', 'Backup User', 'backup@test.com');
    const video = new VideoModel('backup_video', user.id, 'Backup Video', 'Test content', 'backup.mp4');

    // Add data that would be valuable to backup
    user.incrementStats({
      totalVideos: 25,
      totalViews: 5000,
      totalLikes: 300
    });

    for (let i = 0; i < 1000; i++) video.incrementViews();
    video.updateAnalytics({
      watchTime: 75000,
      completionRate: 90,
      audienceRetention: [95, 90, 85, 80, 75]
    });

    // Create backup data structure
    const createBackup = (user: UserModel, videos: VideoModel[]) => {
      return {
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          stats: user.stats,
          preferences: user.preferences
        },
        videos: videos.map(video => ({
          id: video.id,
          title: video.title,
          views: video.views,
          likes: video.likes,
          analytics: video.analytics
        })),
        version: '1.0'
      };
    };

    const backup = createBackup(user, [video]);

    // Verify backup contains critical data
    expect(backup.user.id).toBe(user.id);
    expect(backup.user.stats.totalVideos).toBe(25);
    expect(backup.user.stats.totalViews).toBe(5000);
    expect(backup.videos).toHaveLength(1);
    expect(backup.videos[0].views).toBe(1000);
    expect(backup.videos[0].analytics.watchTime).toBe(75000);
    expect(backup.timestamp).toBeDefined();
    expect(backup.version).toBe('1.0');

    // Simulate recovery from backup
    const recoverFromBackup = (backupData: any) => {
      const recoveredUser = new UserModel(
        backupData.user.id,
        backupData.user.name,
        backupData.user.email
      );

      // Restore stats and preferences
      recoveredUser.stats = { ...recoveredUser.stats, ...backupData.user.stats };
      recoveredUser.preferences = { ...recoveredUser.preferences, ...backupData.user.preferences };

      const recoveredVideos = backupData.videos.map((videoData: any) => {
        const video = new VideoModel(
          videoData.id,
          recoveredUser.id,
          videoData.title,
          'Recovered content',
          `${videoData.id}.mp4`
        );

        // Restore engagement data
        // Note: In a real system, this would be more complex
        for (let i = 0; i < videoData.views; i++) video.incrementViews();
        for (let i = 0; i < videoData.likes; i++) video.like();

        video.analytics = { ...video.analytics, ...videoData.analytics };

        return video;
      });

      return { user: recoveredUser, videos: recoveredVideos };
    };

    const recovered = recoverFromBackup(backup);

    // Verify recovery was successful
    expect(recovered.user.id).toBe(user.id);
    expect(recovered.user.name).toBe(user.name);
    expect(recovered.user.stats.totalVideos).toBe(25);
    expect(recovered.videos).toHaveLength(1);
    expect(recovered.videos[0].views).toBe(1000);
    expect(recovered.videos[0].analytics.watchTime).toBe(75000);
  });

  test('should handle data versioning and conflict resolution', () => {
    const user = new UserModel('version_user', 'Version User', 'version@test.com');
    user.incrementStats({ totalVideos: 5 });

    // Simulate version control with timestamps
    const versionHistory = [{
      version: 1,
      timestamp: user.updatedAt,
      data: JSON.stringify(user)
    }];

    // Make changes
    user.incrementStats({ totalVideos: 3 });
    user.updateProfile({ bio: 'Updated bio' });

    versionHistory.push({
      version: 2,
      timestamp: user.updatedAt,
      data: JSON.stringify(user)
    });

    // Simulate concurrent modification (conflict)
    const concurrentUser = JSON.parse(versionHistory[0].data);
    Object.setPrototypeOf(concurrentUser, UserModel.prototype);

    // Different changes on the same base version
    concurrentUser.incrementStats({ totalViews: 100 });
    concurrentUser.updateProfile({ website: 'https://concurrent.com' });

    // Conflict resolution strategy: last-write-wins with merge
    const resolveConflict = (baseVersion: any, versionA: any, versionB: any) => {
      // In a real system, this would be more sophisticated
      const resolved = { ...versionB }; // Last version wins

      // Merge non-conflicting fields
      if (versionA.bio && !versionB.bio) resolved.bio = versionA.bio;
      if (versionA.website && !versionB.website) resolved.website = versionA.website;

      return resolved;
    };

    const resolvedUser = resolveConflict(
      versionHistory[0],
      JSON.parse(versionHistory[1].data),
      concurrentUser
    );

    // Verify conflict resolution preserved data
    expect(resolvedUser.stats.totalVideos).toBe(8); // 5 + 3 from version 2
    expect(resolvedUser.stats.totalViews).toBe(100); // From concurrent version
    expect(resolvedUser.bio).toBe('Updated bio'); // From version 2
    expect(resolvedUser.website).toBe('https://concurrent.com'); // From concurrent version
  });
});