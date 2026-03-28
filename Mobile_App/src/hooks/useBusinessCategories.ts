import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import businessCategoriesService, { 
  BusinessCategoriesResponse 
} from '../services/businessCategoriesService';
import { API_CACHE_CONFIG } from '../config/apiCacheConfig';

// Query keys factory for business categories
export const businessCategoriesKeys = {
  all: ['businessCategories'] as const,
  list: () => [...businessCategoriesKeys.all, 'list'] as const,
  byId: (id: string) => [...businessCategoriesKeys.all, id] as const,
  search: (query: string) => [...businessCategoriesKeys.all, 'search', query] as const,
};

/**
 * Hook for fetching business categories
 * TTL will be configured based on user input
 */
export const useBusinessCategories = (
  options?: Omit<UseQueryOptions<BusinessCategoriesResponse>, 'queryKey' | 'queryFn'>
) => {
  const cacheConfig = API_CACHE_CONFIG.businessCategories.list;

  return useQuery({
    queryKey: businessCategoriesKeys.list(),
    queryFn: () => businessCategoriesService.getBusinessCategories(),
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    ...options,
  });
};

/**
 * Hook for fetching business category by ID
 * TTL will be configured based on user input
 */
export const useBusinessCategoryById = (
  categoryId: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: businessCategoriesKeys.byId(categoryId),
    queryFn: () => businessCategoriesService.getCategoryById(categoryId),
    enabled: !!categoryId, // Only run if categoryId is provided
    // TTL will be set based on user configuration
    ...options,
  });
};

/**
 * Hook for searching business categories
 * TTL will be configured based on user input
 */
export const useSearchBusinessCategories = (
  query: string,
  options?: Omit<UseQueryOptions<any[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: businessCategoriesKeys.search(query),
    queryFn: () => businessCategoriesService.searchCategories(query),
    enabled: !!query && query.trim().length > 0, // Only run if query is provided
    // TTL will be set based on user configuration
    ...options,
  });
};

