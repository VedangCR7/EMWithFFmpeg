import React, { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useBusinessProfile } from '../context/BusinessProfileContext';
import { downloadService, DownloadContentParams } from '../services/downloadService';
import { isDailyDownloadLimitError } from '../utils/errorHandler';

interface UseCentralizedDownloadReturn {
  downloadContent: (
    params: Omit<DownloadContentParams, 'businessProfileId'>
  ) => Promise<boolean>;
  isDownloading: boolean;
  downloadCount: number;
  isLimitReached: boolean;
}

/**
 * CENTRALIZED DOWNLOAD HOOK
 * 
 * This hook provides a single interface for all downloads in the app.
 * It ensures:
 * 1. businessProfileId is always included
 * 2. Download limits are enforced
 * 3. Error handling is consistent
 * 4. UI state is managed properly
 */
export const useCentralizedDownload = (): UseCentralizedDownloadReturn => {
  const { selectedBusinessProfileId } = useBusinessProfile();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);

  const downloadContent = useCallback(async (
    params: Omit<DownloadContentParams, 'businessProfileId'>
  ): Promise<boolean> => {
    // CRITICAL: businessProfileId is required
    if (!selectedBusinessProfileId) {
      Alert.alert('Error', 'Please select a business profile first');
      return false;
    }

    // Frontend guard: Check if limit is already reached
    if (isLimitReached) {
      Alert.alert(
        'Download Limit Reached',
        'You have reached your daily download limit. Please try again tomorrow.'
      );
      return false;
    }

    // Prevent multiple simultaneous downloads
    if (isDownloading) {
      console.log('🔄 [CENTRALIZED DOWNLOAD] Download already in progress, ignoring request');
      return false;
    }

    setIsDownloading(true);

    try {
      console.log('🔥 [CENTRALIZED DOWNLOAD] Starting download with businessProfileId:', selectedBusinessProfileId);

      const response = await downloadService.downloadContent({
        ...params,
        businessProfileId: selectedBusinessProfileId
      });

      console.log('✅ [CENTRALIZED DOWNLOAD] Download successful:', response);

      // Update download count
      setDownloadCount(prev => prev + 1);

      // Check if we've reached the limit after this download
      if (downloadCount + 1 >= 5) {
        setIsLimitReached(true);
        console.log('🚫 [CENTRALIZED DOWNLOAD] Download limit reached (5 downloads)');
      }

      return true;

    } catch (error: any) {
      console.error('❌ [CENTRALIZED DOWNLOAD] Download failed:', error);

      // Check if this is the daily download limit error
      if (isDailyDownloadLimitError(error)) {
        console.log('🚫 [CENTRALIZED DOWNLOAD] Daily download limit reached');
        setIsLimitReached(true);
        
        Alert.alert(
          'Download Limit Reached',
          'You have reached your daily download limit. Please try again tomorrow.'
        );
        
        return false;
      }

      // Handle other errors
      const errorMessage = error.response?.data?.message || error.message || 'Download failed';
      Alert.alert('Download Error', errorMessage);
      
      return false;

    } finally {
      setIsDownloading(false);
    }
  }, [selectedBusinessProfileId, isDownloading, isLimitReached, downloadCount]);

  // Reset download count when business profile changes
  const resetDownloadCount = useCallback(() => {
    setDownloadCount(0);
    setIsLimitReached(false);
    console.log('🔄 [CENTRALIZED DOWNLOAD] Download count reset for new business profile');
  }, []);

  // Auto-reset when business profile changes
  React.useEffect(() => {
    resetDownloadCount();
  }, [selectedBusinessProfileId, resetDownloadCount]);

  return {
    downloadContent,
    isDownloading,
    downloadCount,
    isLimitReached
  };
};

export default useCentralizedDownload;
