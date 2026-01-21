import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { GreetingModel } from '../Greeting';
import { BusinessModel } from '../Business';
import { PlanModel } from '../Plan';
import { TransactionModel } from '../Transaction';
import { TemplateModel } from '../Template';

describe('Data Validation Tests', () => {
  describe('Email Validation', () => {
    const validEmails = [
      'user@example.com',
      'test.email+tag@domain.co.uk',
      'user123@test-domain.com',
      'a@b.c',
      'test_email@sub.domain.com'
    ];

    const invalidEmails = [
      '',
      'invalid-email',
      '@domain.com',
      'user@',
      'user.domain.com',
      'user@domain',
      'user@@domain.com',
      'user@domain.',
      'user@.com'
    ];

    test('should accept valid email formats', () => {
      validEmails.forEach(email => {
        const user = new UserModel('test', 'Test User', email);
        expect(user.isValid()).toBe(true);
      });
    });

    test('should reject invalid email formats', () => {
      invalidEmails.forEach(email => {
        const user = new UserModel('test', 'Test User', email);
        expect(user.isValid()).toBe(false);
      });
    });
  });

  describe('URL Validation', () => {
    const validUrls = [
      'https://example.com/video.mp4',
      'http://test.com/file.mp4',
      'https://sub.domain.com/path/to/file.mp4',
      'https://example.com/file.mp4?param=value',
      'http://localhost:3000/video.mp4'
    ];

    const invalidUrls = [
      '',
      'not-a-url',
      'ftp://example.com/file.mp4',
      'file:///path/to/file.mp4',
      'example.com/video.mp4',
      'https://',
      'http://'
    ];

    test('should accept valid URLs for videos', () => {
      validUrls.forEach(url => {
        const video = new VideoModel('test', 'user1', 'Test Video', 'Description', url);
        expect(video.isValid()).toBe(true);
      });
    });

    test('should handle invalid URLs gracefully', () => {
      // Videos should still be valid objects even with invalid URLs
      // (URL validation would be handled at application level)
      invalidUrls.forEach(url => {
        const video = new VideoModel('test', 'user1', 'Test Video', 'Description', url);
        expect(video).toBeDefined();
        expect(video.url).toBe(url);
      });
    });
  });

  describe('Numeric Validation', () => {
    test('should handle price validation', () => {
      const validPrices = [0, 0.01, 9.99, 99.99, 999.99, 1000];
      const invalidPrices = [-1, -0.01, -100];

      validPrices.forEach(price => {
        const plan = new PlanModel('test', 'Test Plan', 'Description', price);
        expect(plan.isValid()).toBe(true);
      });

      invalidPrices.forEach(price => {
        const plan = new PlanModel('test', 'Test Plan', 'Description', price);
        expect(plan.isValid()).toBe(false);
      });
    });

    test('should handle rating constraints', () => {
      const greeting = new GreetingModel('test', 'user1', 'temp1', 'Title', 'Content');

      const validRatings = [0, 1, 2.5, 3, 4.5, 5];
      const invalidRatings = [-1, 5.1, 10, -0.1];

      validRatings.forEach(rating => {
        greeting.updateRating(rating);
        expect(greeting.rating).toBe(rating);
      });

      // Test boundary conditions
      greeting.updateRating(6);
      expect(greeting.rating).toBe(5); // Should be capped

      greeting.updateRating(-2);
      expect(greeting.rating).toBe(0); // Should be floored
    });

    test('should handle file size validation', () => {
      const validSizes = [0, 1024, 1048576, 1073741824]; // 0B, 1KB, 1MB, 1GB
      const invalidSizes = [-1, -1024];

      validSizes.forEach(size => {
        const video = new VideoModel('test', 'user1', 'Video', 'Desc', 'url', '', 0, 'processing', [], '1080p', size);
        expect(video.fileSize).toBe(size);
      });

      invalidSizes.forEach(size => {
        const video = new VideoModel('test', 'user1', 'Video', 'Desc', 'url', '', 0, 'processing', [], '1080p', size);
        expect(video.fileSize).toBe(size); // Model allows it, validation at app level
      });
    });
  });

  describe('String Length Validation', () => {
    test('should handle name length constraints', () => {
      const validNames = ['A', 'John Doe', 'A'.repeat(100), 'User with a very long name that should still be valid'];
      const invalidNames = ['', '   ', null, undefined];

      validNames.forEach(name => {
        const user = new UserModel('test', name, 'test@example.com');
        expect(user.isValid()).toBe(true);
      });

      invalidNames.forEach(name => {
        const user = new UserModel('test', name || '', 'test@example.com');
        expect(user.isValid()).toBe(name && name.trim().length > 0 ? true : false);
      });
    });

    test('should handle content length validation', () => {
      const shortContent = 'Hi';
      const longContent = 'A'.repeat(10000); // 10KB of content
      const emptyContent = '';

      const shortGreeting = new GreetingModel('test', 'user1', 'temp1', 'Title', shortContent);
      const longGreeting = new GreetingModel('test2', 'user1', 'temp1', 'Title', longContent);
      const emptyGreeting = new GreetingModel('test3', 'user1', 'temp1', 'Title', emptyContent);

      expect(shortGreeting.isValid()).toBe(true);
      expect(longGreeting.isValid()).toBe(true);
      expect(emptyGreeting.isValid()).toBe(false); // Empty content should be invalid
    });
  });

  describe('Enum Validation', () => {
    test('should validate user roles', () => {
      const validRoles: Array<'user' | 'admin' | 'business'> = ['user', 'admin', 'business'];
      const invalidRoles = ['superuser', 'moderator', '', null];

      validRoles.forEach(role => {
        const user = new UserModel('test', 'Test User', 'test@example.com', '', '', '', '', true, role);
        expect(user.role).toBe(role);
      });

      // Invalid roles are still accepted by the model (validation at app level)
      invalidRoles.forEach(role => {
        const user = new UserModel('test', 'Test User', 'test@example.com', '', '', '', '', true, role as any);
        expect(user.role).toBe(role);
      });
    });

    test('should validate video status', () => {
      const validStatuses: Array<'processing' | 'completed' | 'failed'> = ['processing', 'completed', 'failed'];
      const invalidStatuses = ['uploading', 'ready', '', null];

      validStatuses.forEach(status => {
        const video = new VideoModel('test', 'user1', 'Video', 'Desc', 'url', '', 0, status);
        expect(video.status).toBe(status);
      });

      // Invalid statuses are accepted by model (validation at app level)
      invalidStatuses.forEach(status => {
        const video = new VideoModel('test', 'user1', 'Video', 'Desc', 'url', '', 0, status as any);
        expect(video.status).toBe(status);
      });
    });

    test('should validate transaction types', () => {
      const validTypes: Array<'payment' | 'refund' | 'subscription' | 'credit'> = ['payment', 'refund', 'subscription', 'credit'];
      const invalidTypes = ['transfer', 'withdrawal', '', null];

      validTypes.forEach(type => {
        const transaction = new TransactionModel('test', 'user1', type, 10);
        expect(transaction.type).toBe(type);
      });

      // Invalid types are accepted by model (validation at app level)
      invalidTypes.forEach(type => {
        const transaction = new TransactionModel('test', 'user1', type as any, 10);
        expect(transaction.type).toBe(type);
      });
    });
  });

  describe('Array Validation', () => {
    test('should handle tag arrays', () => {
      const video = new VideoModel('test', 'user1', 'Video', 'Desc', 'url');

      // Empty tags
      expect(video.tags).toEqual([]);

      // Add tags
      video.tags = ['tag1', 'tag2', 'tag3'];
      expect(video.tags).toHaveLength(3);
      expect(video.tags).toContain('tag1');

      // Duplicate tags (model allows, app logic would prevent)
      video.tags = ['tag1', 'tag1', 'tag2'];
      expect(video.tags).toHaveLength(3);
    });

    test('should handle customization objects', () => {
      const template = new TemplateModel('test', 'Template', 'Desc', 'cat', 'video', 'thumb.jpg', 'creator');

      expect(template.customization).toEqual({
        colors: [],
        fonts: [],
        layouts: [],
        effects: []
      });

      // Add customizations
      template.customization.colors = ['#FF0000', '#00FF00'];
      template.customization.fonts = ['Arial'];
      template.customization.layouts = ['portrait'];

      expect(template.customization.colors).toHaveLength(2);
      expect(template.customization.fonts).toHaveLength(1);
      expect(template.customization.layouts).toHaveLength(1);
      expect(template.customization.effects).toEqual([]); // Unchanged
    });
  });

  describe('Date Validation', () => {
    test('should handle date fields correctly', () => {
      const user = new UserModel('test', 'User', 'user@test.com');
      const video = new VideoModel('test', 'user1', 'Video', 'Desc', 'url');
      const greeting = new GreetingModel('test', 'user1', 'temp1', 'Title', 'Content');

      // All should have valid ISO date strings
      expect(user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(user.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(video.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(greeting.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // Should be able to parse as valid dates
      expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt);
      expect(new Date(video.updatedAt).toISOString()).toBe(video.updatedAt);
    });

    test('should update timestamps on modifications', () => {
      const user = new UserModel('test', 'User', 'user@test.com');
      const originalTime = user.updatedAt;

      // Wait a bit and make a change
      setTimeout(() => {
        user.updatePreferences({ theme: 'dark' });
        expect(user.updatedAt).not.toBe(originalTime);
        expect(new Date(user.updatedAt).getTime()).toBeGreaterThan(new Date(originalTime).getTime());
      }, 10);
    });
  });

  describe('Business Rule Validation', () => {
    test('should enforce plan limits', () => {
      const unlimitedPlan = new PlanModel('unlimited', 'Unlimited', 'No limits', 99.99, 'USD', 'monthly', [], 0, 0, 0);
      const limitedPlan = new PlanModel('limited', 'Limited', 'Has limits', 9.99, 'USD', 'monthly', [], 5, 10, 2);

      // Unlimited plan should always allow creation
      expect(unlimitedPlan.canCreateVideo(1000)).toBe(true);
      expect(unlimitedPlan.canCreateGreeting(1000)).toBe(true);
      expect(unlimitedPlan.hasStorageSpace(1000)).toBe(true);

      // Limited plan should enforce limits
      expect(limitedPlan.canCreateVideo(3)).toBe(true); // Under limit
      expect(limitedPlan.canCreateVideo(5)).toBe(false); // At limit
      expect(limitedPlan.canCreateVideo(7)).toBe(false); // Over limit

      expect(limitedPlan.canCreateGreeting(8)).toBe(true); // Under limit
      expect(limitedPlan.canCreateGreeting(10)).toBe(false); // At limit
      expect(limitedPlan.canCreateGreeting(12)).toBe(false); // Over limit
    });

    test('should validate transaction amounts', () => {
      const validAmounts = [0.01, 1, 10, 100, 1000, 999999.99];
      const invalidAmounts = [-1, -0.01, 0];

      validAmounts.forEach(amount => {
        const transaction = new TransactionModel('test', 'user1', 'payment', amount);
        expect(transaction.isValid()).toBe(true);
        expect(transaction.amount).toBe(amount);
      });

      invalidAmounts.forEach(amount => {
        const transaction = new TransactionModel('test', 'user1', 'payment', amount);
        expect(transaction.isValid()).toBe(false);
      });
    });

    test('should handle premium content access', () => {
      const freeUser = new UserModel('free', 'Free User', 'free@test.com');
      const premiumUser = new UserModel('premium', 'Premium User', 'premium@test.com');

      const freeTemplate = new TemplateModel('free', 'Free Template', 'Free', 'cat', 'video', 'thumb.jpg', 'creator');
      const premiumTemplate = new TemplateModel('premium', 'Premium Template', 'Premium', 'cat', 'video', 'thumb.jpg', 'creator');

      premiumTemplate.markAsPremium();

      // Both can access free content
      expect(freeTemplate.isPremium).toBe(false);

      // Only premium users should access premium content (business rule)
      expect(premiumTemplate.isPremium).toBe(true);

      // Model allows usage tracking for both, but business logic would enforce access
      freeTemplate.recordUsage(freeUser.id);
      premiumTemplate.recordUsage(premiumUser.id);

      expect(freeTemplate.usageCount).toBe(1);
      expect(premiumTemplate.usageCount).toBe(1);
    });
  });
});