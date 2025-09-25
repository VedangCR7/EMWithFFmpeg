import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with the EventMarketers backend URL
const api = axios.create({
  baseURL: 'http://localhost:3001', // Local development server
  // baseURL: 'https://eventmarketersbackend.onrender.com', // Production backend server
  timeout: 30000, // 30 seconds timeout for better reliability
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log('API request timed out');
      return Promise.reject(new Error('TIMEOUT'));
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('Authentication failed, clearing tokens');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      // You can add navigation logic here to redirect to login
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.data);
      return Promise.reject(new Error('SERVER_ERROR'));
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('NETWORK_ERROR'));
    }
    
    return Promise.reject(error);
  }
);

export default api; 