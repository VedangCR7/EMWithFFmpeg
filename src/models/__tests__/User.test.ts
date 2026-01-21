import { UserModel } from '../User';

describe('UserModel', () => {
  test('should create a valid user', () => {
    const user = new UserModel(
      '1',
      'John Doe',
      'john@example.com',
      '+1234567890',
      'business1',
      'plan1',
      'avatar.jpg',
      true,
      'user',
      { theme: 'dark', notifications: true, language: 'en' }
    );

    expect(user.id).toBe('1');
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
    expect(user.isValid()).toBe(true);
    expect(user.getDisplayName()).toBe('John Doe');
  });

  test('should validate user correctly', () => {
    const invalidUser = new UserModel('', '', 'invalid-email', '', '', '');
    expect(invalidUser.isValid()).toBe(false);

    const validUser = new UserModel('1', 'John', 'john@test.com');
    expect(validUser.isValid()).toBe(true);
  });

  test('should handle admin role', () => {
    const adminUser = new UserModel('1', 'Admin', 'admin@test.com', '', '', '', '', true, 'admin');
    const regularUser = new UserModel('2', 'User', 'user@test.com', '', '', '', '', true, 'user');

    expect(adminUser.isAdmin()).toBe(true);
    expect(regularUser.isAdmin()).toBe(false);
  });

  test('should update preferences', () => {
    const user = new UserModel('1', 'John', 'john@test.com');
    user.updatePreferences({ theme: 'light', language: 'fr' });

    expect(user.preferences.theme).toBe('light');
    expect(user.preferences.language).toBe('fr');
    expect(user.preferences.notifications).toBe(true); // Should be preserved
  });

  test('should activate and deactivate user', () => {
    const user = new UserModel('1', 'John', 'john@test.com');
    expect(user.isActive).toBe(true);

    user.deactivate();
    expect(user.isActive).toBe(false);

    user.activate();
    expect(user.isActive).toBe(true);
  });

  test('should use email as display name when name is empty', () => {
    const user = new UserModel('1', '', 'john@test.com');
    expect(user.getDisplayName()).toBe('john@test.com');
  });

  test('should have default values', () => {
    const user = new UserModel('1', 'Test', 'test@test.com');
    expect(user.isActive).toBe(true);
    expect(user.role).toBe('user');
    expect(user.preferences.theme).toBe('light');
    expect(user.preferences.notifications).toBe(true);
    expect(user.preferences.language).toBe('en');
  });
});