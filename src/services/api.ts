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
  // baseURL: 'http://192.168.1.43:3001', // Local development server (Android compatible)
  // baseURL: 'http://localhost:3001', // Local development server (Web only)
  baseURL: 'https://eventmarketersbackend.onrender.com', // Production backend server
  timeout: 30000, // 30 seconds timeout for slower connections and server cold starts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Let axios handle compression automatically - it should decompress gzip responses
    // Removing Accept-Encoding: identity to allow server to send compressed data
    // Axios should automatically decompress if Content-Encoding header is present
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
    // Let axios handle response parsing automatically (same as calendarApi pattern)
    
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
    // Enhanced error logging for debugging
    console.log('❌ API Error occurred:', error.config?.url);
    console.log('📊 Error status:', error.response?.status);
    console.log('📋 Error response:', error.response?.data);
    console.log('🌐 Error URL:', error.config?.baseURL + error.config?.url);
    console.log('🔍 Error code:', error.code);
    console.log('🔍 Error message:', error.message);
    console.log('🔍 Error name:', error.name);
    
    // Handle timeout errors first
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
      console.log('⏱️ API request timed out');
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
      return Promise.reject(error);
    }

    // Handle server errors (5xx)
    if (error.response?.status >= 500) {
      console.error('🔴 Server error:', error.response?.data);
      return Promise.reject(new Error('SERVER_ERROR'));
    }

    // Handle client errors (4xx) - these are not network errors
    if (error.response?.status >= 400 && error.response?.status < 500) {
      console.log('⚠️ Client error (4xx):', error.response?.status, error.response?.data);
      return Promise.reject(error);
    }

    // Handle errors without response - need to distinguish between actual network issues and other problems
    if (!error.response) {
      const errorCode = error.code || '';
      const errorMessage = (error.message || '').toLowerCase();
      
      // Check for actual network connectivity issues
      const isNetworkError = 
        errorCode === 'NETWORK_ERROR' ||
        errorCode === 'ERR_NETWORK' ||
        errorCode === 'ERR_INTERNET_DISCONNECTED' ||
        errorCode === 'ENOTFOUND' || // DNS resolution failed
        errorCode === 'ECONNREFUSED' || // Connection refused (server down)
        errorCode === 'ETIMEDOUT' || // Connection timeout
        errorCode === 'ECONNRESET' || // Connection reset
        errorMessage.includes('network request failed') ||
        errorMessage.includes('networkerror') ||
        errorMessage.includes('failed to connect') ||
        errorMessage.includes('connection refused') ||
        errorMessage.includes('dns') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound');
      
      // Check for SSL/certificate issues
      const isSSLError = 
        errorCode === 'CERT_HAS_EXPIRED' ||
        errorCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
        errorCode === 'SELF_SIGNED_CERT_IN_CHAIN' ||
        errorCode === 'ERR_CERT_AUTHORITY_INVALID' ||
        errorMessage.includes('certificate') ||
        errorMessage.includes('ssl') ||
        errorMessage.includes('tls');
      
      if (isSSLError) {
        console.error('🔒 SSL/Certificate error:', error.message || error.code);
        return Promise.reject(new Error('SSL_ERROR'));
      }
      
      if (isNetworkError) {
        console.error('🌐 Network connectivity error:', error.message || error.code);
        return Promise.reject(new Error('NETWORK_ERROR'));
      }
      
      // For other errors without response, log more details and return original error
      // This could be server down, DNS issues, or other configuration problems
      console.error('⚠️ Request failed without response:', {
        code: error.code,
        message: error.message,
        name: error.name,
        url: error.config?.baseURL + error.config?.url,
      });
      
      // Return original error instead of generic NETWORK_ERROR
      // This allows callers to handle it appropriately
      return Promise.reject(error);
    }
    
    // For any other errors with response, return as-is
    return Promise.reject(error);
  }
);

export default api; 