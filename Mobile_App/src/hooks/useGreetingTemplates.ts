import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import greetingTemplatesService, { 
  GreetingCategory, 
  GreetingTemplate 
} from '../services/greetingTemplates';

// Query keys factory for greeting templates
export const greetingTemplatesKeys = {
  all: ['greetingTemplates'] as const,
  categories: () => [...greetingTemplatesKeys.all, 'categories'] as const,
  templates: (filters?: any) => [...greetingTemplatesKeys.all, 'templates', filters] as const,
  search: (query: string, language?: string) => [...greetingTemplatesKeys.all, 'search', query, language] as const,
  byCategory: (category: string, limit?: number) => [...greetingTemplatesKeys.all, 'byCategory', category, limit] as const,
};

/**
 * Hook for fetching greeting categories
 * TTL will be configured based on user input
 */
export const useGreetingCategories = (
  options?: Omit<UseQueryOptions<GreetingCategory[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: greetingTemplatesKeys.categories(),
    queryFn: () => greetingTemplatesService.getCategories(),
    // TTL will be set based on user configuration
    ...options,
  });
};

/**
 * Hook for fetching greeting templates with filters
 * TTL will be configured based on user input
 */
export const useGreetingTemplates = (
  filters?: {
    category?: string;
    language?: string;
    isPremium?: boolean;
    search?: string;
    limit?: number;
    categoryId?: string;
  },
  options?: Omit<UseQueryOptions<GreetingTemplate[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: greetingTemplatesKeys.templates(filters),
    queryFn: () => greetingTemplatesService.getTemplates(filters),
    // TTL will be set based on user configuration
    ...options,
  });
};

/**
 * Hook for searching greeting templates
 * TTL will be configured based on user input
 */
export const useSearchGreetingTemplates = (
  query: string,
  language?: string,
  options?: Omit<UseQueryOptions<GreetingTemplate[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: greetingTemplatesKeys.search(query, language),
    queryFn: () => greetingTemplatesService.searchTemplates(query, language),
    enabled: !!query && query.trim().length > 0, // Only run if query is provided
    // TTL will be set based on user configuration
    ...options,
  });
};

/**
 * Hook for fetching templates by category
 * TTL will be configured based on user input
 */
export const useGreetingTemplatesByCategory = (
  category: string,
  limit: number = 200,
  categoryId?: string,
  options?: Omit<UseQueryOptions<GreetingTemplate[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: greetingTemplatesKeys.byCategory(category, limit),
    queryFn: () => greetingTemplatesService.getTemplatesByCategory(category, limit, categoryId),
    enabled: !!category, // Only run if category is provided
    // TTL will be set based on user configuration
    ...options,
  });
};

