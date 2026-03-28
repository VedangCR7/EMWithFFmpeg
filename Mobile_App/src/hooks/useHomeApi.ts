import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import homeApi, { 
  FeaturedContentResponse, 
  UpcomingEventsResponse, 
  ProfessionalTemplatesResponse, 
  VideoContentResponse 
} from '../services/homeApi';
import { API_CACHE_CONFIG } from '../config/apiCacheConfig';

// Query keys factory for home API
export const homeApiKeys = {
  all: ['home'] as const,
  featured: (params?: any) => [...homeApiKeys.all, 'featured', params] as const,
  events: (params?: any) => [...homeApiKeys.all, 'events', params] as const,
  templates: (params?: any) => [...homeApiKeys.all, 'templates', params] as const,
  videos: (params?: any) => [...homeApiKeys.all, 'videos', params] as const,
};

/**
 * Hook for fetching featured content
 * TTL will be configured based on user input
 */
export const useFeaturedContent = (
  params?: { 
    limit?: number; 
    type?: 'banner' | 'promotion' | 'highlight' | 'all'; 
    active?: boolean 
  },
  options?: Omit<UseQueryOptions<FeaturedContentResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: homeApiKeys.featured(params),
    queryFn: () => homeApi.getFeaturedContent(params),
    staleTime: API_CACHE_CONFIG.home.featured.staleTime,
    gcTime: API_CACHE_CONFIG.home.featured.gcTime,
    ...options,
  });
};

/**
 * Hook for fetching upcoming events
 * TTL will be configured based on user input
 */
export const useUpcomingEvents = (
  params?: { 
    limit?: number; 
    category?: string; 
    location?: string; 
    dateFrom?: string; 
    dateTo?: string; 
    isFree?: boolean 
  },
  options?: Omit<UseQueryOptions<UpcomingEventsResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: homeApiKeys.events(params),
    queryFn: () => homeApi.getUpcomingEvents(params),
    staleTime: API_CACHE_CONFIG.home.events.staleTime,
    gcTime: API_CACHE_CONFIG.home.events.gcTime,
    ...options,
  });
};

/**
 * Hook for fetching professional templates
 * TTL will be configured based on user input
 */
export const useProfessionalTemplates = (
  params?: { 
    limit?: number; 
    category?: string; 
    subcategory?: string; 
    isPremium?: boolean; 
    sortBy?: 'popular' | 'recent' | 'likes' | 'downloads'; 
    tags?: string[]; 
    language?: string 
  },
  options?: Omit<UseQueryOptions<ProfessionalTemplatesResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: homeApiKeys.templates(params),
    queryFn: () => homeApi.getProfessionalTemplates(params),
    staleTime: API_CACHE_CONFIG.home.templates.staleTime,
    gcTime: API_CACHE_CONFIG.home.templates.gcTime,
    ...options,
  });
};

/**
 * Hook for fetching video content
 * TTL will be configured based on user input
 */
export const useVideoContent = (
  params?: { 
    limit?: number; 
    category?: string; 
    language?: string; 
    isPremium?: boolean; 
    sortBy?: 'popular' | 'recent' | 'likes' | 'views' | 'downloads'; 
    duration?: 'short' | 'medium' | 'long'; 
    tags?: string[] 
  },
  options?: Omit<UseQueryOptions<VideoContentResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: homeApiKeys.videos(params),
    queryFn: () => homeApi.getVideoContent(params),
    staleTime: API_CACHE_CONFIG.home.videos.staleTime,
    gcTime: API_CACHE_CONFIG.home.videos.gcTime,
    ...options,
  });
};

