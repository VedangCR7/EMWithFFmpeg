import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { GreetingModel } from '../Greeting';

describe('Model Validation Tests', () => {
  describe('User Validation', () => {
    test('should reject empty user', () => {
      const user = new UserModel('', '', '');
      expect(user.isValid()).toBe(false);
    });

    test('should reject user without email', () => {
      const user = new UserModel('1', 'John Doe', '');
      expect(user.isValid()).toBe(false);
    });

    test('should reject user with invalid email', () => {
      const user = new UserModel('1', 'John Doe', 'invalid-email');
      expect(user.isValid()).toBe(false);
    });

    test('should reject user without name', () => {
      const user = new UserModel('1', '', 'john@example.com');
      expect(user.isValid()).toBe(false);
    });

    test('should accept valid user', () => {
      const user = new UserModel('1', 'John Doe', 'john@example.com');
      expect(user.isValid()).toBe(true);
    });
  });

  describe('Video Validation', () => {
    test('should reject empty video', () => {
      const video = new VideoModel('', '', '', '', '');
      expect(video.isValid()).toBe(false);
    });

    test('should reject video without title', () => {
      const video = new VideoModel('1', 'user1', '', 'Description', 'url');
      expect(video.isValid()).toBe(false);
    });

    test('should reject video without URL', () => {
      const video = new VideoModel('1', 'user1', 'Title', 'Description', '');
      expect(video.isValid()).toBe(false);
    });

    test('should accept video with minimal required fields', () => {
      const video = new VideoModel('1', 'user1', 'Title', 'Description', 'https://example.com/video.mp4');
      expect(video.isValid()).toBe(true);
    });

    test('should accept video with all fields', () => {
      const video = new VideoModel('1', 'user1', 'Title', 'Description', 'url', 'thumb', 120, 'completed', ['tag'], '1080p', 100, 10, 5, 2, 100);
      expect(video.isValid()).toBe(true);
    });
  });

  describe('Greeting Validation', () => {
    test('should reject empty greeting', () => {
      const greeting = new GreetingModel('', '', '', '', '', {});
      expect(greeting.isValid()).toBe(false);
    });

    test('should reject greeting without title', () => {
      const greeting = new GreetingModel('1', 'user1', 'template1', '', 'Content');
      expect(greeting.isValid()).toBe(false);
    });

    test('should reject greeting without content', () => {
      const greeting = new GreetingModel('1', 'user1', 'template1', 'Title', '');
      expect(greeting.isValid()).toBe(false);
    });

    test('should accept greeting with minimal required fields', () => {
      const greeting = new GreetingModel('1', 'user1', 'template1', 'Title', 'Content');
      expect(greeting.isValid()).toBe(true);
    });

    test('should accept greeting with all fields', () => {
      const greeting = new GreetingModel('1', 'user1', 'template1', 'Title', 'Content', 'media', {}, 'published', 'birthday', ['tag'], true, 10, 5, 4, []);
      expect(greeting.isValid()).toBe(true);
    });
  });

  describe('Cross-Model Validation', () => {
    test('should validate user-video relationship', () => {
      const user = new UserModel('1', 'John', 'john@test.com');
      const video = new VideoModel('v1', '1', 'Video', 'Desc', 'url');

      expect(user.isValid()).toBe(true);
      expect(video.isValid()).toBe(true);
      expect(video.userId).toBe(user.id);
    });

    test('should validate user-greeting relationship', () => {
      const user = new UserModel('1', 'John', 'john@test.com');
      const greeting = new GreetingModel('g1', '1', 't1', 'Greeting', 'Content');

      expect(user.isValid()).toBe(true);
      expect(greeting.isValid()).toBe(true);
      expect(greeting.userId).toBe(user.id);
    });

    test('should handle invalid relationships gracefully', () => {
      const user = new UserModel('', '', '');
      const video = new VideoModel('v1', '', 'Video', 'Desc', 'url');
      const greeting = new GreetingModel('g1', '', 't1', 'Greeting', 'Content');

      expect(user.isValid()).toBe(false);
      expect(video.isValid()).toBe(true); // Video can be valid even if user is invalid
      expect(greeting.isValid()).toBe(true);
    });
  });

  describe('Data Type Validation', () => {
    test('should handle numeric fields correctly', () => {
      const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url', '', 120, 'completed', [], '4K', 1000000, 100, 25, 5);
      expect(typeof video.duration).toBe('number');
      expect(typeof video.fileSize).toBe('number');
      expect(typeof video.views).toBe('number');
      expect(typeof video.likes).toBe('number');
      expect(typeof video.shares).toBe('number');
    });

    test('should handle boolean fields correctly', () => {
      const user = new UserModel('1', 'John', 'john@test.com', '', '', '', '', true, 'user');
      const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content', '', {}, 'published', 'general', [], true);

      expect(typeof user.isActive).toBe('boolean');
      expect(typeof greeting.isPublic).toBe('boolean');
    });

    test('should handle array fields correctly', () => {
      const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url', '', 0, 'processing', ['tag1', 'tag2']);
      const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content', '', {}, 'draft', 'general', ['tag1']);

      expect(Array.isArray(video.tags)).toBe(true);
      expect(Array.isArray(greeting.tags)).toBe(true);
      expect(Array.isArray(greeting.comments)).toBe(true);
    });
  });
});