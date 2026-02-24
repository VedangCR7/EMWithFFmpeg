import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import businessCategoryPostersApi from '../services/businessCategoryPostersApi';
import { API_CACHE_CONFIG } from '../config/apiCacheConfig';

// Query keys factory for business category posters
export const businessCategoryPostersKeys = {
  all: ['businessCategoryPosters'] as const,
  byCategory: (category: string, limit?: number) => [...businessCategoryPostersKeys.all, 'byCategory', category, limit] as const,
};

/**
 * Hook for fetching posters by business category
 * TTL will be configured based on user input
 */
export const useBusinessCategoryPosters = (
  category: string,
  limit: number = 5,
  categoryId?: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) => {
  const cacheConfig = API_CACHE_CONFIG.businessCategoryPosters.byCategory;

  return useQuery({
    queryKey: businessCategoryPostersKeys.byCategory(category, limit),
    queryFn: () => businessCategoryPostersApi.getPostersByCategory(category, limit, false, categoryId),
    enabled: !!category, // Only run if category is provided
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    ...options,
  });
};

