import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { GreetingModel } from '../Greeting';

describe('Model Integration Tests', () => {
  test('should create user with associated videos and greetings', () => {
    // Create a user
    const user = new UserModel('1', 'John Doe', 'john@example.com', '+1234567890', 'business1', 'plan1');

    // Create videos for the user
    const video1 = new VideoModel('v1', user.id, 'Birthday Video', 'Happy birthday!', 'url1', 'thumb1', 60);
    const video2 = new VideoModel('v2', user.id, 'Wedding Video', 'Congratulations!', 'url2', 'thumb2', 120);

    // Create greetings for the user
    const greeting1 = new GreetingModel('g1', user.id, 't1', 'Birthday Greeting', 'Happy birthday John!', 'media1');
    const greeting2 = new GreetingModel('g2', user.id, 't2', 'Wedding Greeting', 'Best wishes!', 'media2');

    // Verify relationships
    expect(video1.userId).toBe(user.id);
    expect(video2.userId).toBe(user.id);
    expect(greeting1.userId).toBe(user.id);
    expect(greeting2.userId).toBe(user.id);

    // Verify all entities are valid
    expect(user.isValid()).toBe(true);
    expect(video1.isValid()).toBe(true);
    expect(video2.isValid()).toBe(true);
    expect(greeting1.isValid()).toBe(true);
    expect(greeting2.isValid()).toBe(true);
  });

  test('should handle user deactivation and its impact on content', () => {
    const user = new UserModel('1', 'John Doe', 'john@example.com');
    const video = new VideoModel('v1', user.id, 'Test Video', 'Description', 'url', 'thumb', 60);
    const greeting = new GreetingModel('g1', user.id, 't1', 'Test Greeting', 'Content', 'media');

    expect(user.isActive).toBe(true);

    // Deactivate user
    user.deactivate();
    expect(user.isActive).toBe(false);

    // Content should still be valid but user is inactive
    expect(video.isValid()).toBe(true);
    expect(greeting.isValid()).toBe(true);
    expect(user.isActive).toBe(false);
  });

  test('should track engagement metrics across models', () => {
    const user = new UserModel('1', 'Content Creator', 'creator@example.com');
    const video = new VideoModel('v1', user.id, 'Popular Video', 'Great content', 'url', 'thumb', 60);
    const greeting = new GreetingModel('g1', user.id, 't1', 'Popular Greeting', 'Amazing greeting', 'media');

    // Simulate engagement
    video.incrementViews();
    video.incrementViews();
    video.like();
    video.share();

    greeting.incrementViews();
    greeting.incrementDownloads();
    greeting.updateRating(5);

    // Verify metrics
    expect(video.views).toBe(2);
    expect(video.likes).toBe(1);
    expect(video.shares).toBe(1);

    expect(greeting.views).toBe(1);
    expect(greeting.downloads).toBe(1);
    expect(greeting.rating).toBe(5);
  });

  test('should handle video processing workflow', () => {
    const user = new UserModel('1', 'Video Maker', 'maker@example.com');
    const video = new VideoModel('v1', user.id, 'Processing Video', 'Being processed', 'url');

    expect(video.status).toBe('processing');
    expect(video.processingProgress).toBe(0);

    // Simulate processing steps
    video.updateProgress(25);
    expect(video.processingProgress).toBe(25);
    expect(video.status).toBe('processing');

    video.updateProgress(75);
    expect(video.processingProgress).toBe(75);

    video.updateProgress(100);
    expect(video.processingProgress).toBe(100);
    expect(video.status).toBe('completed');
    expect(video.isProcessed()).toBe(true);
  });

  test('should manage greeting publication workflow', () => {
    const user = new UserModel('1', 'Greeting Designer', 'designer@example.com');
    const greeting = new GreetingModel('g1', user.id, 't1', 'Draft Greeting', 'Work in progress', 'media');

    expect(greeting.status).toBe('draft');
    expect(greeting.isPublic).toBe(false);

    // Add some content and publish
    greeting.addComment('Looking good!');
    greeting.incrementViews();
    greeting.publish();

    expect(greeting.status).toBe('published');
    expect(greeting.isPublic).toBe(true);
    expect(greeting.comments).toHaveLength(1);
    expect(greeting.views).toBe(1);
  });

  test('should handle admin user capabilities', () => {
    const adminUser = new UserModel('1', 'Admin User', 'admin@test.com', '', '', '', '', true, 'admin');
    const regularUser = new UserModel('2', 'Regular User', 'user@test.com');

    const adminVideo = new VideoModel('v1', adminUser.id, 'Admin Video', 'Admin content', 'url');
    const adminGreeting = new GreetingModel('g1', adminUser.id, 't1', 'Admin Greeting', 'Admin message', 'media');

    expect(adminUser.isAdmin()).toBe(true);
    expect(regularUser.isAdmin()).toBe(false);

    // Admin can access both content types
    expect(adminVideo.userId).toBe(adminUser.id);
    expect(adminGreeting.userId).toBe(adminUser.id);
  });
});