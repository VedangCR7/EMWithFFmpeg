import authApi from '../services/authApi';
import authService from '../services/auth';
import logger from './logger';

/**
 * Controlled subscription status polling mechanism after successful Razorpay payment.
 * Polls the profile API to check for subscription activation with a max duration of 5 minutes.
 * 
 * @param onActive Callback when subscriptionStatus becomes "Active"
 * @param onTimeout Callback when the 5-minute polling window expires
 * @returns A cleanup function to immediately stop polling
 */
export const startSubscriptionPolling = (
  onActive?: () => void,
  onTimeout?: () => void
): (() => void) => {
  const MAX_DURATION = 300000; // 5 minutes (300,000 ms)
  const INITIAL_DELAY = 15000; // 15 seconds initial delay
  const POLL_INTERVAL = 20000; // 20 seconds between retries
  
  let timerId: NodeJS.Timeout | null = null;
  const startTime = Date.now();
  let isStopped = false;

  const stopPolling = () => {
    isStopped = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const poll = async () => {
    if (isStopped) return;

    const elapsed = Date.now() - startTime;
    if (elapsed >= MAX_DURATION) {
      logger.log('⏱️ Subscription status polling timed out (5m limit reached)');
      if (onTimeout) onTimeout();
      stopPolling();
      return;
    }

    try {
      logger.log(`🔄 Polling subscription status... (${Math.round(elapsed / 1000)}s elapsed)`);
      
      // Call the profile API as requested
      const response = await authApi.getProfile();
      
      if (response && response.success && response.data) {
        const profileData = response.data as any;
        // Check for subscriptionStatus directly as requested
        const status = profileData.subscriptionStatus;
        
        logger.log(`📊 Current subscriptionStatus: ${status}`);

        if (status === 'Active' || status === 'ACTIVE') {
          logger.log('✅ Subscription activated! Stopping polling.');
          
          // Keep internal state updated via authService
          authService.setCurrentUser(profileData);
          
          if (onActive) onActive();
          stopPolling();
          return;
        }
      }
    } catch (error) {
      // Handle API failures gracefully without breaking the loop
      logger.error('⚠️ Polling error (retrying):', error);
    }

    // Schedule next poll using recursive setTimeout for better control
    if (!isStopped) {
      timerId = setTimeout(poll, POLL_INTERVAL);
    }
  };

  // Start initial polling after a short delay since activation takes some time
  timerId = setTimeout(poll, INITIAL_DELAY);

  return stopPolling;
};
