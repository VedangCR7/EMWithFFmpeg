import { DeviceEventEmitter } from 'react-native';

export const DOWNLOAD_LIMIT_REACHED_EVENT = 'DOWNLOAD_LIMIT_REACHED';

export interface DownloadLimitEventData {
  message: string;
  businessProfileId?: string;
}

/**
 * Emit download limit reached event
 */
export const emitDownloadLimitReached = (data: DownloadLimitEventData) => {
  DeviceEventEmitter.emit(DOWNLOAD_LIMIT_REACHED_EVENT, data);
};

/**
 * Subscribe to download limit reached events
 */
export const subscribeToDownloadLimitReached = (
  callback: (data: DownloadLimitEventData) => void
) => {
  return DeviceEventEmitter.addListener(DOWNLOAD_LIMIT_REACHED_EVENT, callback);
};
