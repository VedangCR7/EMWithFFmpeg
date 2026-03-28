import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Note: For now, we'll use QueryClient without persistence wrapper
// React Query's built-in cache will work with AsyncStorage through the hooks
// We can add persistence later if needed

// Create QueryClient with optimized default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time: 5 minutes (data is fresh for 5 min, won't refetch during this time)
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Default cache time: 30 minutes (how long unused data stays in cache)
      gcTime: 30 * 60 * 1000, // 30 minutes (previously called cacheTime)
      // Retry failed requests
      retry: 2,
      // Refetch on window focus (disabled for React Native)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Only refetch on mount if data is stale (not always)
      refetchOnMount: false,
      // Network mode
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
    },
  },
});

