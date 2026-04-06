import { DeviceEventEmitter } from 'react-native';

export const DOWNLOAD_LIMIT_REACHED_EVENT = 'DOWNLOAD_LIMIT_REACHED';
export const SHOW_DOWNLOAD_LIMIT_MODAL_EVENT = 'SHOW_DOWNLOAD_LIMIT_MODAL';

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
 * Emit show download limit modal event
 */
export const emitShowDownloadLimitModal = () => {
  DeviceEventEmitter.emit(SHOW_DOWNLOAD_LIMIT_MODAL_EVENT);
};

/**
 * Subscribe to download limit reached events
 */
export const subscribeToDownloadLimitReached = (
  callback: (data: DownloadLimitEventData) => void
) => {
  return DeviceEventEmitter.addListener(DOWNLOAD_LIMIT_REACHED_EVENT, callback);
};

/**
 * Subscribe to show download limit modal events
 */
export const subscribeToShowDownloadLimitModal = (
  callback: () => void
) => {
  return DeviceEventEmitter.addListener(SHOW_DOWNLOAD_LIMIT_MODAL_EVENT, callback);
};
