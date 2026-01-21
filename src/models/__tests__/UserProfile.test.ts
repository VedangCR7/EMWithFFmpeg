import { UserModel } from '../User';

describe('User Profile Management', () => {
  const baseUser = {
    id: 'user1',
    name: 'John Doe',
    email: 'john@test.com'
  };

  test('should create user with comprehensive profile', () => {
    const user = new UserModel(
      baseUser.id,
      baseUser.name,
      baseUser.email,
      '+1234567890',
      'business1',
      'plan1',
      'avatar.jpg',
      'banner.jpg',
      'Creative video maker specializing in business content',
      'https://johndoe.com',
      {
        twitter: '@johndoe',
        linkedin: 'john-doe-business',
        instagram: 'john_doe_videos',
        youtube: 'JohnDoeBusiness'
      },
      true,
      true,
      'creator',
      {
        theme: 'dark',
        notifications: true,
        language: 'en',
        timezone: 'America/New_York',
        emailFrequency: 'daily'
      }
    );

    expect(user.id).toBe(baseUser.id);
    expect(user.name).toBe(baseUser.name);
    expect(user.email).toBe(baseUser.email);
    expect(user.phone).toBe('+1234567890');
    expect(user.businessId).toBe('business1');
    expect(user.planId).toBe('plan1');
    expect(user.avatar).toBe('avatar.jpg');
    expect(user.banner).toBe('banner.jpg');
    expect(user.bio).toContain('Creative video maker');
    expect(user.website).toBe('https://johndoe.com');
    expect(user.socialLinks.twitter).toBe('@johndoe');
    expect(user.socialLinks.linkedin).toBe('john-doe-business');
    expect(user.isActive).toBe(true);
    expect(user.isVerified).toBe(true);
    expect(user.role).toBe('creator');
    expect(user.preferences.theme).toBe('dark');
    expect(user.preferences.timezone).toBe('America/New_York');
  });

  test('should update user profile information', () => {
    const user = new UserModel(baseUser.id, baseUser.name, baseUser.email);

    user.updateProfile({
      name: 'John Smith',
      bio: 'Updated bio with new information',
      website: 'https://johnsmith.com',
      avatar: 'new-avatar.jpg'
    });

    expect(user.name).toBe('John Smith');
    expect(user.bio).toBe('Updated bio with new information');
    expect(user.website).toBe('https://johnsmith.com');
    expect(user.avatar).toBe('new-avatar.jpg');
  });

  test('should manage social media links', () => {
    const user = new UserModel(baseUser.id, baseUser.name, baseUser.email);

    user.updateSocialLinks({
      twitter: '@newhandle',
      instagram: 'new_instagram'
    });

    expect(user.socialLinks.twitter).toBe('@newhandle');
    expect(user.socialLinks.instagram).toBe('new_instagram');

    // Update existing links
    user.updateSocialLinks({
      twitter: '@updatedhandle',
      youtube: 'NewYouTubeChannel'
    });

    expect(user.socialLinks.twitter).toBe('@updatedhandle');
    expect(user.socialLinks.youtube).toBe('NewYouTubeChannel');
    expect(user.socialLinks.instagram).toBe('new_instagram'); // Should be preserved
  });

  test('should track user statistics', () => {
    const user = new UserModel(baseUser.id, baseUser.name, baseUser.email);

    expect(user.stats.totalVideos).toBe(0);
    expect(user.stats.totalGreetings).toBe(0);
    expect(user.stats.totalViews).toBe(0);

    user.incrementStats({
      totalVideos: 5,
      totalGreetings: 10,
      totalViews: 1500,
      totalLikes: 300,
      totalDownloads: 75
    });

    expect(user.stats.totalVideos).toBe(5);
    expect(user.stats.totalGreetings).toBe(10);
    expect(user.stats.totalViews).toBe(1500);
    expect(user.stats.totalLikes).toBe(300);
    expect(user.stats.totalDownloads).toBe(75);

    // Increment again
    user.incrementStats({
      totalVideos: 3,
      totalViews: 500
    });

    expect(user.stats.totalVideos).toBe(8);
    expect(user.stats.totalViews).toBe(2000);
  });

  test('should track last login', () => {
    const user = new UserModel(baseUser.id, baseUser.name, baseUser.email);

    expect(user.stats.lastLoginDate).toBeUndefined();

    user.updateLastLogin();
    expect(user.stats.lastLoginDate).toBeDefined();
    expect(typeof user.stats.lastLoginDate).toBe('string');

    const firstLogin = user.stats.lastLoginDate;
    user.updateLastLogin();
    expect(user.stats.lastLoginDate).toBeDefined();
    expect(user.stats.lastLoginDate).not.toBe(firstLogin);
  });

  test('should manage badges and achievements', () => {
    const user = new UserModel(baseUser.id, baseUser.name, baseUser.email);

    expect(user.badges).toEqual([]);
    expect(user.achievements).toEqual([]);

    user.addBadge('First Video');
    user.addBadge('Verified Creator');
    user.addBadge('First Video'); // Duplicate should not be added

    user.addAchievement('100 Views');
    user.addAchievement('Top Creator');
    user.addAchievement('100 Views'); // Duplicate should not be added

    expect(user.badges).toEqual(['First Video', 'Verified Creator']);
    expect(user.achievements).toEqual(['100 Views', 'Top Creator']);
  });

  test('should calculate profile completion percentage', () => {
    let user = new UserModel(baseUser.id, baseUser.name, baseUser.email);

    // Empty profile
    expect(user.getProfileCompletion()).toBe(0);

    // Add avatar
    user.updateProfile({ avatar: 'avatar.jpg' });
    expect(user.getProfileCompletion()).toBeGreaterThan(0);

    // Add bio and website
    user.updateProfile({ bio: 'My bio', website: 'https://site.com' });
    const completionAfterBio = user.getProfileCompletion();

    // Add banner
    user.updateProfile({ banner: 'banner.jpg' });
    expect(user.getProfileCompletion()).toBeGreaterThan(completionAfterBio);

    // Add social links
    user.updateSocialLinks({ twitter: '@handle' });
    const finalCompletion = user.getProfileCompletion();
    expect(finalCompletion).toBeGreaterThan(completionAfterBio);
  });

  test('should calculate engagement score', () => {
    const user = new UserModel(baseUser.id, baseUser.name, baseUser.email);

    // No engagement
    expect(user.getEngagementScore()).toBe(0);

    // Add some stats
    user.incrementStats({
      totalViews: 1000,
      totalLikes: 100,
      totalDownloads: 50
    });

    // Score = views * 1 + likes * 2 + downloads * 3
    const expectedScore = 1000 * 1 + 100 * 2 + 50 * 3;
    expect(user.getEngagementScore()).toBe(expectedScore);
  });

  test('should handle different user roles', () => {
    const regularUser = new UserModel('user1', 'Regular', 'regular@test.com', '', '', '', '', true, 'user');
    const creatorUser = new UserModel('user2', 'Creator', 'creator@test.com', '', '', '', '', true, 'creator');
    const businessUser = new UserModel('user3', 'Business', 'business@test.com', '', '', '', '', true, 'business');
    const adminUser = new UserModel('user4', 'Admin', 'admin@test.com', '', '', '', '', true, 'admin');

    expect(regularUser.role).toBe('user');
    expect(creatorUser.role).toBe('creator');
    expect(businessUser.role).toBe('business');
    expect(adminUser.role).toBe('admin');

    expect(regularUser.isAdmin()).toBe(false);
    expect(creatorUser.isCreator()).toBe(true);
    expect(businessUser.isBusiness()).toBe(true);
    expect(adminUser.isAdmin()).toBe(true);
  });
});