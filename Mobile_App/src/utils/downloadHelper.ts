import downloadTrackingService from '../services/downloadTracking';
import authService from '../services/auth';

/**
 * Helper function to track downloads across the app
 * Call this function whenever a user downloads any content
 */
export const trackDownload = async (
  resourceType: 'TEMPLATE' | 'VIDEO' | 'GREETING' | 'POSTER' | 'CONTENT',
  resourceId: string,
  fileUrl: string,
  additionalData?: {
    title?: string;
    thumbnail?: string;
    category?: string;
  }
): Promise<boolean> => {
  try {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id;

    if (!userId) {
      console.log('⚠️ [DOWNLOAD HELPER] No user ID available, cannot track download');
      return false;
    }

    console.log('📥 [DOWNLOAD HELPER] Tracking download:', {
      userId,
      resourceType,
      resourceId,
      ...additionalData
    });

    const success = await downloadTrackingService.trackDownload(
      userId,
      resourceType,
      resourceId,
      fileUrl,
      additionalData
    );

    if (success) {
      console.log('✅ [DOWNLOAD HELPER] Download tracked successfully');
    } else {
      console.log('⚠️ [DOWNLOAD HELPER] Failed to track download');
    }

    return success;
  } catch (error) {
    console.error('❌ [DOWNLOAD HELPER] Error tracking download:', error);
    return false;
  }
};

/**
 * Track poster download
 */
export const trackPosterDownload = async (
  posterId: string,
  posterUrl: string,
  title: string,
  thumbnail?: string,
  category?: string
): Promise<boolean> => {
  return trackDownload('POSTER', posterId, posterUrl, { title, thumbnail, category });
};

/**
 * Track template download
 */
export const trackTemplateDownload = async (
  templateId: string,
  templateUrl: string,
  title: string,
  thumbnail?: string,
  category?: string
): Promise<boolean> => {
  return trackDownload('TEMPLATE', templateId, templateUrl, { title, thumbnail, category });
};

/**
 * Track video download
 */
export const trackVideoDownload = async (
  videoId: string,
  videoUrl: string,
  title: string,
  thumbnail?: string,
  category?: string
): Promise<boolean> => {
  return trackDownload('VIDEO', videoId, videoUrl, { title, thumbnail, category });
};

/**
 * Track greeting download
 */
export const trackGreetingDownload = async (
  greetingId: string,
  greetingUrl: string,
  title: string,
  thumbnail?: string,
  category?: string
): Promise<boolean> => {
  return trackDownload('GREETING', greetingId, greetingUrl, { title, thumbnail, category });
};

export default {
  trackDownload,
  trackPosterDownload,
  trackTemplateDownload,
  trackVideoDownload,
  trackGreetingDownload,
};

