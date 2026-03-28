/**
 * API Cache Configuration
 * 
 * This file contains TTL (Time To Live) configurations for all APIs.
 * TTL values are in milliseconds.
 * 
 * staleTime: How long data is considered fresh (won't refetch during this time)
 * gcTime: How long unused data stays in cache (previously called cacheTime)
 * 
 * Usage: Import this config and use it in React Query hooks
 */

export const API_CACHE_CONFIG = {
  // Home API
  home: {
    featured: {
      staleTime: minutesToMs(10), // 10 minutes - featured content changes frequently
      gcTime: minutesToMs(30), // 30 minutes
    },
    events: {
      staleTime: minutesToMs(15), // 15 minutes - events update periodically
      gcTime: hoursToMs(2), // 2 hours
    },
    templates: {
      staleTime: minutesToMs(30), // 30 minutes - templates are relatively static
      gcTime: hoursToMs(4), // 4 hours
    },
    videos: {
      staleTime: minutesToMs(30), // 30 minutes - videos are relatively static
      gcTime: hoursToMs(4), // 4 hours
    },
  },
  
  // Greeting Templates
  greetingTemplates: {
    categories: {
      staleTime: hoursToMs(24), // 24 hours - categories rarely change
      gcTime: hoursToMs(72), // 72 hours
    },
    templates: {
      staleTime: minutesToMs(30), // 30 minutes - templates update occasionally
      gcTime: hoursToMs(4), // 4 hours
    },
    search: {
      staleTime: minutesToMs(5), // 5 minutes - search results should be fresh
      gcTime: minutesToMs(30), // 30 minutes
    },
    byCategory: {
      staleTime: minutesToMs(30), // 30 minutes
      gcTime: hoursToMs(4), // 4 hours
    },
  },
  
  // Business Categories
  businessCategories: {
    list: {
      staleTime: hoursToMs(30 * 24), // 30 days - categories rarely change
      gcTime: hoursToMs(60 * 24), // 60 days
    },
    byId: {
      staleTime: hoursToMs(24), // 24 hours
      gcTime: hoursToMs(72), // 72 hours
    },
    search: {
      staleTime: minutesToMs(10), // 10 minutes - search should be fresh
      gcTime: hoursToMs(2), // 2 hours
    },
  },
  
  // Business Category Posters
  businessCategoryPosters: {
    byCategory: {
      staleTime: hoursToMs(24), // 24 hours - posters update daily
      gcTime: hoursToMs(72), // 72 hours
    },
  },
  
  // Dashboard
  dashboard: {
    templates: {
      staleTime: minutesToMs(15), // 15 minutes - dashboard should be relatively fresh
      gcTime: hoursToMs(2), // 2 hours
    },
    search: {
      staleTime: minutesToMs(5), // 5 minutes - search should be fresh
      gcTime: minutesToMs(30), // 30 minutes
    },
  },
};

/**
 * Helper function to convert minutes to milliseconds
 */
export const minutesToMs = (minutes: number): number => minutes * 60 * 1000;

/**
 * Helper function to convert hours to milliseconds
 */
export const hoursToMs = (hours: number): number => hours * 60 * 60 * 1000;

/**
 * Update TTL for a specific API
 * 
 * Example:
 * updateApiTTL('home', 'featured', { staleTime: minutesToMs(5), gcTime: minutesToMs(10) });
 */
export const updateApiTTL = (
  service: keyof typeof API_CACHE_CONFIG,
  endpoint: string,
  config: { staleTime: number; gcTime: number }
) => {
  const serviceConfig = API_CACHE_CONFIG[service] as any;
  if (serviceConfig && serviceConfig[endpoint]) {
    serviceConfig[endpoint] = config;
  }
};

