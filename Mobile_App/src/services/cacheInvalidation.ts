import cacheService from './cacheService';

/**
 * Cache Invalidation Service
 * Provides centralized cache invalidation logic for related data
 * When one piece of data changes, related caches should be invalidated
 */
class CacheInvalidationService {
  /**
   * Invalidate business profile related caches
   * Call this when business profile is created, updated, or deleted
   */
  invalidateBusinessProfile(userId?: string): void {
    if (userId) {
      cacheService.clear(`business_profile_${userId}`);
    }
    // Clear all business profile related caches
    cacheService.clearPattern('business_profile_');
    // Business categories might have changed
    cacheService.clear('business_categories');
    cacheService.clear('business_categories_v1');
    if (__DEV__) {
      console.log('🗑️ [CACHE INVALIDATION] Cleared business profile caches');
    }
  }

  /**
   * Invalidate home screen content caches
   * Call this when featured content, events, templates, or videos are updated
   */
  invalidateHomeContent(): void {
    cacheService.clearPattern('home_');
    if (__DEV__) {
      console.log('🗑️ [CACHE INVALIDATION] Cleared home screen content caches');
    }
  }

  /**
   * Invalidate specific home content type
   */
  invalidateHomeContentType(type: 'featured' | 'events' | 'templates' | 'videos'): void {
    cacheService.clearPattern(`home_${type}_`);
    if (__DEV__) {
      console.log(`🗑️ [CACHE INVALIDATION] Cleared home ${type} cache`);
    }
  }

  /**
   * Invalidate user data caches
   * Call this when user profile, preferences, or settings change
   */
  invalidateUserData(userId?: string): void {
    if (userId) {
      cacheService.clear(`user_profile_${userId}`);
      cacheService.clear(`user_preferences_${userId}`);
    }
    cacheService.clearPattern('user_profile_');
    cacheService.clearPattern('user_preferences_');
    if (__DEV__) {
      console.log('🗑️ [CACHE INVALIDATION] Cleared user data caches');
    }
  }

  /**
   * Invalidate greeting templates and categories
   * Call this when greeting templates or categories are updated
   */
  invalidateGreetingContent(): void {
    cacheService.clear('greeting_categories');
    cacheService.clearPattern('greeting_templates_');
    if (__DEV__) {
      console.log('🗑️ [CACHE INVALIDATION] Cleared greeting content caches');
    }
  }

  /**
   * Invalidate subscription related caches
   * Call this when subscription plans or user subscription status changes
   */
  invalidateSubscriptionData(): void {
    cacheService.clear('subscription_plans');
    cacheService.clearPattern('subscription_');
    if (__DEV__) {
      console.log('🗑️ [CACHE INVALIDATION] Cleared subscription caches');
    }
  }

  /**
   * Invalidate calendar poster caches
   * Call this when calendar posters are updated
   */
  invalidateCalendarPosters(): void {
    cacheService.clearPattern('calendar_posters');
    if (__DEV__) {
      console.log('🗑️ [CACHE INVALIDATION] Cleared calendar poster caches');
    }
  }

  /**
   * Invalidate template and banner caches
   * Call this when templates or banners are updated
   */
  invalidateTemplatesAndBanners(): void {
    cacheService.clearPattern('templates_');
    cacheService.clearPattern('banners_');
    // Also invalidate home templates since they might be related
    cacheService.clearPattern('home_templates_');
    if (__DEV__) {
      console.log('🗑️ [CACHE INVALIDATION] Cleared template and banner caches');
    }
  }

  /**
   * Invalidate all caches
   * Use with caution - this clears everything
   */
  invalidateAll(): void {
    cacheService.clearAll();
    if (__DEV__) {
      console.log('🗑️ [CACHE INVALIDATION] Cleared all caches');
    }
  }

  /**
   * Invalidate caches on user logout
   * Clears user-specific data but keeps general content
   */
  invalidateOnLogout(): void {
    // Clear user-specific caches
    this.invalidateUserData();
    this.invalidateBusinessProfile();
    // Keep general content caches (home, categories, etc.) for faster login
    if (__DEV__) {
      console.log('🗑️ [CACHE INVALIDATION] Cleared user-specific caches on logout');
    }
  }

  /**
   * Invalidate caches on user login
   * Clears potentially stale user-specific data
   */
  invalidateOnLogin(userId: string): void {
    // Clear user-specific caches to ensure fresh data
    this.invalidateUserData(userId);
    this.invalidateBusinessProfile(userId);
    if (__DEV__) {
      console.log(`🗑️ [CACHE INVALIDATION] Cleared user-specific caches on login for user ${userId}`);
    }
  }
}

export default new CacheInvalidationService();

