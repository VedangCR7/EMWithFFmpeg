// Razorpay Configuration Validation for Production
import { RAZORPAY_KEY_ID } from '@env';

export interface RazorpayConfig {
  key: string;
  isValid: boolean;
  isTestMode: boolean;
  environment: 'production' | 'test' | 'invalid';
}

export const validateRazorpayConfig = (): RazorpayConfig => {
  const key = RAZORPAY_KEY_ID;
  
  // Check if key exists
  if (!key) {
    return {
      key: '',
      isValid: false,
      isTestMode: false,
      environment: 'invalid'
    };
  }

  // Check if it's a test key
  const isTestKey = key.startsWith('rzp_test_');
  
  // Basic validation for key format
  const isValidFormat = key.startsWith('rzp_') && key.length > 20;
  
  // Determine environment
  if (!isValidFormat) {
    return {
      key,
      isValid: false,
      isTestMode: false,
      environment: 'invalid'
    };
  }

  return {
    key,
    isValid: true,
    isTestMode: isTestKey,
    environment: isTestKey ? 'test' : 'production'
  };
};

export const getProductionRazorpayKey = (): string => {
  const config = validateRazorpayConfig();
  
  if (!config.isValid) {
    throw new Error('Razorpay configuration is invalid. Please check your environment variables.');
  }
  
  if (config.isTestMode) {
    console.warn('⚠️ Using Razorpay test keys in production is not recommended.');
  }
  
  return config.key;
};

export const RAZORPAY_CONFIG = validateRazorpayConfig();
