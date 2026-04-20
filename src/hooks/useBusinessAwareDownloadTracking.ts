import { useBusinessProfile } from '../context/BusinessProfileContext';
import { 
  trackDownload, 
  trackPosterDownload, 
  trackTemplateDownload, 
  trackVideoDownload, 
  trackGreetingDownload 
} from '../utils/downloadHelper';

/**
 * Enhanced download tracking hook that automatically includes business profile ID
 */
export const useBusinessAwareDownloadTracking = () => {
  const { selectedBusinessProfileId } = useBusinessProfile();

  const trackDownloadWithBusiness = async (
    resourceType: 'TEMPLATE' | 'VIDEO' | 'GREETING' | 'POSTER' | 'CONTENT',
    resourceId: string,
    fileUrl: string,
    additionalData?: {
      title?: string;
      thumbnail?: string;
      category?: string;
    }
  ) => {
    return trackDownload(resourceType, resourceId, fileUrl, {
      ...additionalData,
      businessProfileId: selectedBusinessProfileId || undefined
    });
  };

  const trackPosterDownloadWithBusiness = async (
    posterId: string,
    posterUrl: string,
    title: string,
    thumbnail?: string,
    category?: string
  ) => {
    return trackPosterDownload(posterId, posterUrl, title, thumbnail, category, selectedBusinessProfileId || undefined);
  };

  const trackTemplateDownloadWithBusiness = async (
    templateId: string,
    templateUrl: string,
    title: string,
    thumbnail?: string,
    category?: string
  ) => {
    return trackTemplateDownload(templateId, templateUrl, title, thumbnail, category, selectedBusinessProfileId || undefined);
  };

  const trackVideoDownloadWithBusiness = async (
    videoId: string,
    videoUrl: string,
    title: string,
    thumbnail?: string,
    category?: string
  ) => {
    return trackVideoDownload(videoId, videoUrl, title, thumbnail, category, selectedBusinessProfileId || undefined);
  };

  const trackGreetingDownloadWithBusiness = async (
    greetingId: string,
    greetingUrl: string,
    title: string,
    thumbnail?: string,
    category?: string
  ) => {
    return trackGreetingDownload(greetingId, greetingUrl, title, thumbnail, category, selectedBusinessProfileId || undefined);
  };

  return {
    selectedBusinessProfileId,
    trackDownload: trackDownloadWithBusiness,
    trackPosterDownload: trackPosterDownloadWithBusiness,
    trackTemplateDownload: trackTemplateDownloadWithBusiness,
    trackVideoDownload: trackVideoDownloadWithBusiness,
    trackGreetingDownload: trackGreetingDownloadWithBusiness,
  };
};
