import { PlanModel } from '../Plan';

describe('PlanModel', () => {
  const mockFeatures = [
    { name: 'Videos', value: 50, description: 'Up to 50 videos' },
    { name: 'Storage', value: '10GB', description: '10GB storage' },
    { name: 'Premium Support', value: true, description: '24/7 support' }
  ];

  test('should create a valid plan', () => {
    const plan = new PlanModel(
      '1',
      'Pro Plan',
      'Professional plan for businesses',
      29.99,
      'USD',
      'monthly',
      mockFeatures,
      50,
      100,
      10,
      true,
      true
    );

    expect(plan.id).toBe('1');
    expect(plan.name).toBe('Pro Plan');
    expect(plan.price).toBe(29.99);
    expect(plan.isValid()).toBe(true);
    expect(plan.isPopular).toBe(true);
    expect(plan.maxVideos).toBe(50);
  });

  test('should validate plan correctly', () => {
    const invalidPlan = new PlanModel('', '', '', -10);
    expect(invalidPlan.isValid()).toBe(false);

    const validPlan = new PlanModel('1', 'Basic Plan', 'Basic features', 9.99);
    expect(validPlan.isValid()).toBe(true);
  });

  test('should handle plan status operations', () => {
    const plan = new PlanModel('1', 'Test Plan', 'Test', 9.99);

    expect(plan.isActive).toBe(true);
    expect(plan.isPopular).toBe(false);

    plan.deactivate();
    expect(plan.isActive).toBe(false);

    plan.activate();
    expect(plan.isActive).toBe(true);

    plan.markAsPopular();
    expect(plan.isPopular).toBe(true);

    plan.unmarkAsPopular();
    expect(plan.isPopular).toBe(false);
  });

  test('should calculate pricing correctly', () => {
    const monthlyPlan = new PlanModel('1', 'Monthly', 'Monthly plan', 29.99, 'USD', 'monthly');
    const yearlyPlan = new PlanModel('2', 'Yearly', 'Yearly plan', 299.99, 'USD', 'yearly');

    expect(monthlyPlan.getMonthlyPrice()).toBe(29.99);
    expect(monthlyPlan.getYearlyPrice()).toBe(29.99 * 12);

    expect(yearlyPlan.getYearlyPrice()).toBe(299.99);
    expect(yearlyPlan.getMonthlyPrice()).toBe(299.99 / 12);
  });

  test('should check limits correctly', () => {
    const limitedPlan = new PlanModel('1', 'Limited', 'Limited plan', 9.99, 'USD', 'monthly', [], 10, 20, 5);
    const unlimitedPlan = new PlanModel('2', 'Unlimited', 'Unlimited plan', 99.99, 'USD', 'monthly', [], 0, 0, 0);

    // Limited plan checks
    expect(limitedPlan.canCreateVideo(5)).toBe(true);
    expect(limitedPlan.canCreateVideo(10)).toBe(false);

    expect(limitedPlan.canCreateGreeting(15)).toBe(true);
    expect(limitedPlan.canCreateGreeting(20)).toBe(false);

    expect(limitedPlan.hasStorageSpace(3)).toBe(true);
    expect(limitedPlan.hasStorageSpace(5)).toBe(false);

    // Unlimited plan checks
    expect(unlimitedPlan.canCreateVideo(1000)).toBe(true);
    expect(unlimitedPlan.canCreateGreeting(1000)).toBe(true);
    expect(unlimitedPlan.hasStorageSpace(1000)).toBe(true);
  });

  test('should have default values', () => {
    const plan = new PlanModel('1', 'Basic', 'Basic plan', 9.99);

    expect(plan.currency).toBe('USD');
    expect(plan.interval).toBe('monthly');
    expect(plan.features).toEqual([]);
    expect(plan.maxVideos).toBe(0);
    expect(plan.maxGreetings).toBe(0);
    expect(plan.maxStorage).toBe(0);
    expect(plan.isPopular).toBe(false);
    expect(plan.isActive).toBe(true);
  });
});