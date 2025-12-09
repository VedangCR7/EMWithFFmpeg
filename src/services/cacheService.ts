import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

/**
 * Cache Entry Interface
 * Stores data with metadata for expiration and tracking
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Centralized Cache Service
 * Provides multi-layer caching with in-memory and persistent storage
 * Supports stale-while-revalidate pattern for optimal performance
 */
class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default
  private readonly MAX_CACHE_SIZE = 50; // Max entries in memory cache
  private readonly STORAGE_PREFIX = '@cache_';

  /**
   * Get data from cache (checks memory first, then AsyncStorage)
   * Returns null if cache miss or expired
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first (fastest)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && Date.now() < memoryEntry.expiresAt) {
      return memoryEntry.data as T;
    }

    // Remove expired memory entry
    if (memoryEntry && Date.now() >= memoryEntry.expiresAt) {
      this.memoryCache.delete(key);
    }

    // Check AsyncStorage (persistent cache)
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        const now = Date.now();
        
        if (now < entry.expiresAt) {
          // Valid cache, restore to memory for faster access
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          // Expired, remove it
          await AsyncStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
        }
      }
    } catch (error) {
      logger.error(`[CACHE] Error reading from AsyncStorage for key ${key}:`, error);
    }

    return null;
  }

  /**
   * Set data in cache (stores in both memory and AsyncStorage)
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const expiresAt = Date.now() + (ttl || this.DEFAULT_TTL);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt,
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Manage memory cache size (LRU-like eviction)
    if (this.memoryCache.size > this.MAX_CACHE_SIZE) {
      // Remove oldest entry (first in map)
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    // Store in AsyncStorage for persistence
    try {
      await AsyncStorage.setItem(
        `${this.STORAGE_PREFIX}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      logger.error(`[CACHE] Error writing to AsyncStorage for key ${key}:`, error);
      // If AsyncStorage fails, we still have memory cache
    }
  }

  /**
   * Stale-while-revalidate pattern
   * Returns cached data immediately (even if stale), then fetches fresh data in background
   * This provides instant UI updates while ensuring data freshness
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
    allowStale: boolean = true
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached) {
      // Check if cache is stale
      const entry = this.memoryCache.get(key);
      if (entry && Date.now() >= entry.expiresAt && allowStale) {
        // Cache is stale but we allow stale data
        // Fetch fresh data in background (don't await)
        fetchFn()
          .then(freshData => {
            this.set(key, freshData, ttl);
          })
          .catch(err => {
            logger.error(`[CACHE] Background refresh failed for ${key}:`, err);
            // Keep stale data if refresh fails
          });
      }
      return cached;
    }

    // No cache, fetch fresh data
    try {
      const freshData = await fetchFn();
      await this.set(key, freshData, ttl);
      return freshData;
    } catch (error) {
      // If fetch fails and we have stale cache, return it
      if (cached && allowStale) {
        logger.warn(`[CACHE] Fetch failed, returning stale cache: ${key}`);
        return cached;
      }
      throw error;
    }
  }

  /**
   * Check if a key exists in cache and is valid
   */
  async has(key: string): Promise<boolean> {
    const cached = await this.get(key);
    return cached !== null;
  }

  /**
   * Clear specific cache entry
   */
  async clear(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
    } catch (error) {
      logger.error(`[CACHE] Error clearing key ${key}:`, error);
    }
  }

  /**
   * Clear multiple cache entries by pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    const keysToRemove: string[] = [];

    // Clear from memory
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
        keysToRemove.push(key);
      }
    }

    // Clear from AsyncStorage
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(k => 
        k.startsWith(this.STORAGE_PREFIX) && 
        k.includes(pattern)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      logger.error(`[CACHE] Error clearing pattern ${pattern}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.STORAGE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      logger.error('[CACHE] Error clearing all cache:', error);
    }
  }

  /**
   * Clear expired entries from both memory and AsyncStorage
   * Should be called periodically (e.g., on app start)
   */
  async clearExpired(): Promise<void> {
    const now = Date.now();
    let expiredCount = 0;

    // Clear from memory
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now >= entry.expiresAt) {
        this.memoryCache.delete(key);
        expiredCount++;
      }
    }

    // Clear from AsyncStorage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.STORAGE_PREFIX));

      const expiredKeys: string[] = [];
      for (const key of cacheKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          try {
            const entry: CacheEntry<any> = JSON.parse(stored);
            if (now >= entry.expiresAt) {
              expiredKeys.push(key);
            }
          } catch (parseError) {
            // Invalid entry, remove it
            expiredKeys.push(key);
          }
        }
      }

      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
        expiredCount += expiredKeys.length;
      }
    } catch (error) {
      logger.error('[CACHE] Error clearing expired cache:', error);
    }
  }

  /**
   * Get cache statistics (useful for debugging)
   */
  getStats(): { memorySize: number; memoryKeys: string[] } {
    return {
      memorySize: this.memoryCache.size,
      memoryKeys: Array.from(this.memoryCache.keys()),
    };
  }
}

export default new CacheService();

