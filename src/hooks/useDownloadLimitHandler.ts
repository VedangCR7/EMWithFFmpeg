import { useState, useEffect } from 'react';
import { subscribeToDownloadLimitReached, emitShowDownloadLimitModal, DownloadLimitEventData, DOWNLOAD_LIMIT_REACHED_EVENT } from '../utils/downloadLimitEvents';

export interface UseDownloadLimitHandlerOptions {
  onLimitReached?: (data: DownloadLimitEventData) => void;
  showAlert?: boolean;
  customAlertMessage?: string;
}

/**
 * Hook to handle daily download limit errors globally
 */
export const useDownloadLimitHandler = (options: UseDownloadLimitHandlerOptions = {}) => {
  const { onLimitReached, showAlert = true, customAlertMessage } = options;
  const [limitReached, setLimitReached] = useState(false);
  const [limitData, setLimitData] = useState<DownloadLimitEventData | null>(null);

  useEffect(() => {
    const subscription = subscribeToDownloadLimitReached((data: DownloadLimitEventData) => {
      console.log('🚫 [DOWNLOAD LIMIT] Daily download limit reached:', data);
      
      setLimitReached(true);
      setLimitData(data);
      
      // Call custom callback if provided
      if (onLimitReached) {
        onLimitReached(data);
      }
      
      // Show alert by default
      if (showAlert) {
        emitShowDownloadLimitModal();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onLimitReached, showAlert, customAlertMessage]);

  const resetLimitState = () => {
    setLimitReached(false);
    setLimitData(null);
  };

  return {
    limitReached,
    limitData,
    resetLimitState
  };
};
