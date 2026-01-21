import { BusinessModel } from '../Business';

describe('BusinessModel', () => {
  test('should create a valid business', () => {
    const business = new BusinessModel(
      '1',
      'user1',
      'Tech Solutions Inc',
      'technology',
      {
        phone: '+1234567890',
        email: 'contact@techsolutions.com',
        website: 'https://techsolutions.com',
        address: '123 Tech Street'
      },
      'Leading technology solutions provider',
      'logo.jpg',
      'banner.jpg',
      true,
      true,
      'active'
    );

    expect(business.id).toBe('1');
    expect(business.name).toBe('Tech Solutions Inc');
    expect(business.category).toBe('technology');
    expect(business.isValid()).toBe(true);
    expect(business.isVerified).toBe(true);
    expect(business.subscriptionStatus).toBe('active');
  });

  test('should validate business correctly', () => {
    const invalidBusiness = new BusinessModel('', '', '', '');
    expect(invalidBusiness.isValid()).toBe(false);

    const validBusiness = new BusinessModel('1', 'user1', 'Business Name', 'category');
    expect(validBusiness.isValid()).toBe(true);
  });

  test('should handle business operations', () => {
    const business = new BusinessModel('1', 'user1', 'Business', 'category');

    expect(business.isVerified).toBe(false);
    expect(business.subscriptionStatus).toBe('inactive');

    business.verify();
    expect(business.isVerified).toBe(true);

    business.activate();
    expect(business.subscriptionStatus).toBe('active');
    expect(business.isActive).toBe(true);

    business.suspend();
    expect(business.subscriptionStatus).toBe('suspended');

    business.deactivate();
    expect(business.subscriptionStatus).toBe('inactive');
    expect(business.isActive).toBe(false);
  });

  test('should update contact information', () => {
    const business = new BusinessModel('1', 'user1', 'Business', 'category', {
      phone: '123',
      email: 'old@email.com'
    });

    expect(business.contact.phone).toBe('123');
    expect(business.contact.email).toBe('old@email.com');

    business.updateContact({
      phone: '456',
      website: 'https://newwebsite.com'
    });

    expect(business.contact.phone).toBe('456');
    expect(business.contact.email).toBe('old@email.com'); // Should be preserved
    expect(business.contact.website).toBe('https://newwebsite.com');
  });

  test('should have default values', () => {
    const business = new BusinessModel('1', 'user1', 'Business', 'category');

    expect(business.isVerified).toBe(false);
    expect(business.isActive).toBe(true);
    expect(business.subscriptionStatus).toBe('inactive');
    expect(business.contact).toEqual({});
  });
});