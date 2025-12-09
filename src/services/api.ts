import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import cacheService from './cacheService';
import logger from '../utils/logger';

// Event name for token expiration
export const TOKEN_EXPIRED_EVENT = 'TOKEN_EXPIRED';

// Flag to prevent multiple token expiration events
let hasEmittedTokenExpiration = false;

// Function to reset the token expiration flag (call this after successful login)
export const resetTokenExpirationFlag = () => {
  hasEmittedTokenExpiration = false;
};

// Cache configuration for different API endpoints
// Maps URL patterns to cache keys and TTL (Time To Live) in milliseconds
const CACHE_CONFIG: Array<{
  pattern: string;
  key: string;
  ttl: number;
  enabled: boolean;
}> = [
  // Business Categories - rarely change, cache longer
  {
    pattern: '/api/mobile/business-categories/business',
    key: 'business_categories',
    ttl: 10 * 60 * 1000, // 10 minutes
    enabled: true,
  },
  {
    pattern: '/api/v1/categories',
    key: 'business_categories_v1',
    ttl: 10 * 60 * 1000, // 10 minutes
    enabled: true,
  },
  // Greeting Categories
  {
    pattern: '/api/mobile/greetings/categories',
    key: 'greeting_categories',
    ttl: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
  // Home Screen Content
  {
    pattern: '/api/mobile/home/featured',
    key: 'home_featured',
    ttl: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
  {
    pattern: '/api/mobile/home/events',
    key: 'home_events',
    ttl: 2 * 60 * 1000, // 2 minutes (time-sensitive)
    enabled: true,
  },
  {
    pattern: '/api/mobile/home/templates',
    key: 'home_templates',
    ttl: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
  {
    pattern: '/api/mobile/home/videos',
    key: 'home_videos',
    ttl: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
  // Subscription Plans - change infrequently
  {
    pattern: '/api/mobile/subscriptions/plans',
    key: 'subscription_plans',
    ttl: 15 * 60 * 1000, // 15 minutes
    enabled: true,
  },
  // Calendar Posters
  {
    pattern: '/api/mobile/calendar/posters',
    key: 'calendar_posters',
    ttl: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
  // Templates
  {
    pattern: '/api/mobile/templates',
    key: 'templates',
    ttl: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
  {
    pattern: '/api/mobile/greetings/templates',
    key: 'greeting_templates',
    ttl: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },
];

/**
 * Get cache configuration for a given URL
 */
function getCacheConfig(url: string | undefined): { key: string; ttl: number } | null {
  if (!url) return null;

  for (const config of CACHE_CONFIG) {
    if (config.enabled && url.includes(config.pattern)) {
      // Generate cache key with query params for unique requests
      // Extract query string manually (React Native compatible)
      const queryIndex = url.indexOf('?');
      const queryString = queryIndex !== -1 ? url.substring(queryIndex) : '';
      const cacheKey = queryString ? `${config.key}_${queryString}` : config.key;
      
      return {
        key: cacheKey,
        ttl: config.ttl,
      };
    }
  }
  return null;
}

// Create axios instance with the EventMarketers backend URL
const api = axios.create({
  //baseURL: 'http://192.168.0.106:3001', // Local development server (Android compatible)
  // baseURL: 'http://localhost:3001', // Local development server (Web only)
  baseURL: 'https://eventmarketersbackend.onrender.com', // Production backend server
  timeout: 20000, // 20 seconds timeout for slower connections and server cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle caching and errors
api.interceptors.response.use(
  async (response) => {
    // Removed verbose response logging - use logger for essential logs only
    
    // Cache successful GET responses
    if (response.config.method?.toLowerCase() === 'get' && response.status === 200) {
      const cacheConfig = getCacheConfig(response.config.url);
      if (cacheConfig) {
        // Cache the response data
        cacheService.set(cacheConfig.key, response.data, cacheConfig.ttl).catch(err => {
          console.error('[API] Error caching response:', err);
        });
      }
    }
    
    // Category-related endpoints logging removed for cleaner console
    
    return response;
  },
  async (error) => {
    console.log('❌ API Error occurred:', error.config?.url);
    console.log('📊 Error status:', error.response?.status);
    console.log('📋 Error response:', error.response?.data);
    console.log('🌐 Error URL:', error.config?.baseURL + error.config?.url);
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log('API request timed out');
      return Promise.reject(new Error('TIMEOUT'));
    }
    
    // Handle authentication errors (token expired or invalid)
    if (error.response?.status === 401) {
      // Check if this is a login/register endpoint (don't show modal for login failures)
      const isLoginEndpoint = error.config?.url?.includes('/auth/login') || 
                             error.config?.url?.includes('/auth/register') ||
                             error.config?.url?.includes('/auth/google');
      
      // Only show token expiration modal if NOT a login endpoint and user was authenticated
      if (!isLoginEndpoint) {
        const hasToken = await AsyncStorage.getItem('authToken');
        
        // Only emit once to prevent multiple modals, and only if user had a token
        // IMPORTANT: Do NOT clear auth data here - let user stay logged in until they explicitly sign out
        // The TokenExpirationHandler will handle logout only when user confirms
        if (!hasEmittedTokenExpiration && hasToken) {
          hasEmittedTokenExpiration = true;
          console.log('🔴 Token expired or invalid - showing modal but keeping user logged in');
          console.log('ℹ️ User will remain logged in until they explicitly sign out');
          
          // Emit token expiration event using React Native's DeviceEventEmitter
          // This will show a modal, but won't automatically log the user out
          DeviceEventEmitter.emit(TOKEN_EXPIRED_EVENT);
        }
      }
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.data);
      return Promise.reject(new Error('SERVER_ERROR'));
    }

    // Handle network errors (no response means network issue)
    if (!error.response) {
      // Check for specific network error codes
      if (error.code === 'NETWORK_ERROR' || 
          error.code === 'ERR_NETWORK' || 
          error.code === 'ERR_INTERNET_DISCONNECTED' ||
          error.message?.includes('Network Error') ||
          error.message?.includes('network')) {
        console.error('Network error:', error.message || error.code);
        return Promise.reject(new Error('NETWORK_ERROR'));
      }
      // Generic no response error
      console.error('Network error (no response):', error.message || error.code);
      return Promise.reject(new Error('NETWORK_ERROR'));
    }
    
    return Promise.reject(error);
  }
);

export default api; 