import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import dashboardService, { Template } from '../services/dashboard';

// Query keys factory for dashboard
export const dashboardKeys = {
  all: ['dashboard'] as const,
  templates: (tab?: string) => [...dashboardKeys.all, 'templates', tab] as const,
  search: (query: string) => [...dashboardKeys.all, 'search', query] as const,
};

/**
 * Hook for fetching templates by tab
 * TTL will be configured based on user input
 */
export const useTemplatesByTab = (
  tab: string = 'trending',
  options?: Omit<UseQueryOptions<Template[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: dashboardKeys.templates(tab),
    queryFn: () => dashboardService.getTemplatesByTab(tab),
    // TTL will be set based on user configuration
    ...options,
  });
};

/**
 * Hook for searching templates
 * TTL will be configured based on user input
 */
export const useSearchTemplates = (
  query: string,
  options?: Omit<UseQueryOptions<Template[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: dashboardKeys.search(query),
    queryFn: () => dashboardService.searchTemplates(query),
    enabled: !!query && query.trim().length > 0, // Only run if query is provided
    // TTL will be set based on user configuration
    ...options,
  });
};

/**
 * Hook for downloading a template (mutation)
 */
export const useDownloadTemplate = (
  options?: Omit<UseMutationOptions<any, Error, string>, 'mutationFn'>
) => {
  return useMutation({
    mutationFn: (templateId: string) => dashboardService.downloadTemplate(templateId),
    ...options,
  });
};

