/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate API calls by caching in-flight requests
 * Improves performance and reduces server load
 */

interface CachedRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  expiresAt: number;
}

class RequestDeduplication {
  private cache: Map<string, CachedRequest<any>> = new Map();
  private readonly DEFAULT_TTL = 5000; // 5 seconds default TTL

  /**
   * Execute a request with deduplication
   * If the same request is made within TTL, returns the cached promise
   */
  async deduplicate<T>(
    key: string,
    request: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Check if we have a valid cached request
    if (cached && now < cached.expiresAt) {
      if (__DEV__) {
        console.log(`✅ Request deduplicated: ${key}`);
      }
      return cached.promise;
    }

    // Create new request
    const promise = request()
      .then(result => {
        // Remove from cache after completion
        this.cache.delete(key);
        return result;
      })
      .catch(error => {
        // Remove from cache on error
        this.cache.delete(key);
        throw error;
      });

    // Cache the promise
    this.cache.set(key, {
      promise,
      timestamp: now,
      expiresAt: now + ttl,
    });

    return promise;
  }

  /**
   * Clear expired cache entries
   */
  clearExpired() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now >= cached.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Generate cache key from request parameters
   */
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${prefix}?${sortedParams}`;
  }
}

// Export the class for static method access
export { RequestDeduplication };

// Singleton instance
export const requestDeduplication = new RequestDeduplication();

// Auto-cleanup expired entries every 10 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    requestDeduplication.clearExpired();
  }, 10000);
}

