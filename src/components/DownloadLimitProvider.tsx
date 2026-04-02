import React from 'react';
import { useDownloadLimitHandler } from '../hooks/useDownloadLimitHandler';

interface DownloadLimitProviderProps {
  children: React.ReactNode;
  showAlert?: boolean;
  customAlertMessage?: string;
  onLimitReached?: (data: any) => void;
}

/**
 * Provider component to handle download limit errors globally
 * Wrap your app with this component to enable download limit handling
 */
export const DownloadLimitProvider: React.FC<DownloadLimitProviderProps> = ({
  children,
  showAlert = true,
  customAlertMessage,
  onLimitReached
}) => {
  useDownloadLimitHandler({
    showAlert,
    customAlertMessage,
    onLimitReached
  });

  return <>{children}</>;
};
