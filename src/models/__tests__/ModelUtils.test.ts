import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { GreetingModel } from '../Greeting';

describe('Model Utility Tests', () => {
  describe('User Utilities', () => {
    test('should handle preferences merging', () => {
      const user = new UserModel('1', 'John', 'john@test.com');
      user.updatePreferences({ theme: 'dark', notifications: true });

      expect(user.preferences.theme).toBe('dark');
      expect(user.preferences.notifications).toBe(true);

      // Update existing preferences
      user.updatePreferences({ theme: 'light', language: 'en' });
      expect(user.preferences.theme).toBe('light');
      expect(user.preferences.language).toBe('en');
      expect(user.preferences.notifications).toBe(true); // Should be preserved
    });

    test('should update timestamps on changes', () => {
      const user = new UserModel('1', 'John', 'john@test.com', '', '', '', '', true, 'user', {}, '2024-01-01T00:00:00Z');
      const originalTime = user.updatedAt;

      // Simulate time passing
      setTimeout(() => {
        user.updatePreferences({ theme: 'dark' });
        expect(user.updatedAt).not.toBe(originalTime);
      }, 1);
    });
  });

  describe('Video Utilities', () => {
    test('should handle progress boundaries', () => {
      const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url');

      video.updateProgress(-10);
      expect(video.processingProgress).toBe(0);

      video.updateProgress(150);
      expect(video.processingProgress).toBe(100);
      expect(video.status).toBe('completed');
    });

    test('should accumulate engagement metrics', () => {
      const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url');

      for (let i = 0; i < 5; i++) {
        video.incrementViews();
        video.like();
      }

      for (let i = 0; i < 3; i++) {
        video.share();
      }

      expect(video.views).toBe(5);
      expect(video.likes).toBe(5);
      expect(video.shares).toBe(3);
    });
  });

  describe('Greeting Utilities', () => {
    test('should manage comments properly', () => {
      const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content');

      greeting.addComment('First comment');
      greeting.addComment('Second comment');

      expect(greeting.comments).toHaveLength(2);
      expect(greeting.comments[0].text).toBe('First comment');
      expect(greeting.comments[1].text).toBe('Second comment');

      // Check comment structure
      expect(greeting.comments[0]).toHaveProperty('id');
      expect(greeting.comments[0]).toHaveProperty('createdAt');
    });

    test('should handle rating constraints', () => {
      const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content');

      greeting.updateRating(3.5);
      expect(greeting.rating).toBe(3.5);

      greeting.updateRating(6);
      expect(greeting.rating).toBe(5); // Capped at 5

      greeting.updateRating(-1);
      expect(greeting.rating).toBe(0); // Floored at 0
    });

    test('should accumulate statistics', () => {
      const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content');

      for (let i = 0; i < 10; i++) {
        greeting.incrementViews();
      }

      for (let i = 0; i < 5; i++) {
        greeting.incrementDownloads();
      }

      expect(greeting.views).toBe(10);
      expect(greeting.downloads).toBe(5);
    });
  });

  describe('Model Serialization', () => {
    test('should serialize user data correctly', () => {
      const user = new UserModel('1', 'John', 'john@test.com', '+1234567890', 'b1', 'p1', 'avatar.jpg', true, 'admin');
      const displayName = user.getDisplayName();

      expect(displayName).toBe('John');
      expect(typeof user.preferences).toBe('object');
    });

    test('should serialize video metadata correctly', () => {
      const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url', 'thumb', 120, 'completed', ['tag1', 'tag2'], '4K', 1000000, 100, 25, 5);
      const metadata = video.getMetadata();

      expect(metadata).toHaveProperty('id', '1');
      expect(metadata).toHaveProperty('title', 'Title');
      expect(metadata).toHaveProperty('tags');
      expect(metadata.tags).toEqual(['tag1', 'tag2']);
      expect(metadata).toHaveProperty('views', 100);
    });

    test('should serialize greeting data correctly', () => {
      const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content', 'media', { color: 'red' }, 'published', 'birthday', ['tag'], true, 50, 10, 4.5);
      const data = greeting.getGreetingData();

      expect(data).toHaveProperty('id', '1');
      expect(data).toHaveProperty('title', 'Title');
      expect(data).toHaveProperty('category', 'birthday');
      expect(data).toHaveProperty('isPublic', true);
      expect(data).toHaveProperty('customization');
      expect(data.customization).toEqual({ color: 'red' });
    });
  });

  describe('Model Performance', () => {
    test('should handle bulk operations efficiently', () => {
      const users = [];
      const videos = [];
      const greetings = [];

      // Create multiple instances
      for (let i = 0; i < 100; i++) {
        users.push(new UserModel(`user${i}`, `User ${i}`, `user${i}@test.com`));
        videos.push(new VideoModel(`video${i}`, `user${i}`, `Video ${i}`, `Description ${i}`, `url${i}`));
        greetings.push(new GreetingModel(`greeting${i}`, `user${i}`, `template${i}`, `Greeting ${i}`, `Content ${i}`));
      }

      // Verify all are valid
      expect(users.every(u => u.isValid())).toBe(true);
      expect(videos.every(v => v.isValid())).toBe(true);
      expect(greetings.every(g => g.isValid())).toBe(true);

      expect(users).toHaveLength(100);
      expect(videos).toHaveLength(100);
      expect(greetings).toHaveLength(100);
    });
  });
});