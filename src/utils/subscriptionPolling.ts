import authApi from '../services/authApi';
import authService from '../services/auth';
import subscriptionApi from '../services/subscriptionApi';
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
      
      // Call the backend subscription status API as requested
      const response = await subscriptionApi.getStatus();
      
      if (response && response.success && response.data) {
        const subscriptionData = response.data;
        // Check for subscriptionStatus or isActive field as requested
        const status = subscriptionData.status;
        const isActive = subscriptionData.isActive;
        
        logger.log(`📊 Current subscription status: ${status}, isActive: ${isActive}`);

        // Check if subscription is ACTIVE via backend confirmation
        if (status === 'active' || isActive === true) {
          logger.log('✅ Subscription activated via backend! Stopping polling.');
          
          // Update authService with latest user data
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            currentUser.subscriptionStatus = status;
            authService.setCurrentUser(currentUser);
          }
          
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
