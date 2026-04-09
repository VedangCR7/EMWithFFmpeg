import api from './api';

export interface DownloadContentParams {
  resourceId: string;
  resourceType: 'POSTER';
  businessProfileId: string;
}

export interface DownloadResponse {
  success: boolean;
  message: string;
  downloadUrl?: string;
}

/**
 * CENTRALIZED DOWNLOAD SERVICE
 * 
 * This is the ONLY place where download APIs should be called.
 * All downloads must go through this service to ensure:
 * 1. businessProfileId is always included
 * 2. Limit enforcement is respected
 * 3. Error handling is consistent
 * 4. Download tracking is done AFTER successful download
 */
class DownloadService {
  private static instance: DownloadService;

  static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  /**
   * MAIN DOWNLOAD FUNCTION - ALL downloads must go through this
   */
  async downloadContent(params: DownloadContentParams): Promise<DownloadResponse> {
    const {
      resourceId,
      resourceType,
      businessProfileId
    } = params;

    // 🔍 STEP 1: TRACE DOWNLOAD REQUEST
    console.log('📥 [DOWNLOAD REQUEST] Starting:', {
      resourceId,
      resourceType,
      businessProfileId,
      timestamp: new Date().toISOString()
    });

    // CRITICAL: businessProfileId is REQUIRED
    if (!businessProfileId) {
      console.error('❌ [DOWNLOAD SERVICE] businessProfileId is required');
      throw new Error('Business profile ID is required for downloads');
    }

    try {
      // 🔥 CRITICAL: Call EXACT API endpoint with EXACT payload
      const payload = {
        resourceId,
        resourceType,
        businessProfileId
      };
      
      console.log('🚀 [API CALL] POST /api/mobile/download:', {
        url: '/api/mobile/download',
        method: 'POST',
        payload
      });
      
      const response = await api.post('/api/mobile/download', payload);
      console.log('✅ [DOWNLOAD SERVICE] Download API response:', response.status, response.data);

      // Check if backend returned daily limit reached response
      if (response.data?.success === false && response.data?.message === 'Daily download limit reached') {
        console.log('🚫 [DOWNLOAD SERVICE] Backend daily limit reached');
        // Return failure response to trigger limit handling
        return {
          success: false,
          message: 'Daily download limit reached'
        };
      }

      // Return downloadUrl from response
      return {
        success: response.data?.success || true,
        message: response.data?.message || 'Download successful',
        downloadUrl: response.data?.downloadUrl
      };

    } catch (error: any) {
      console.error('❌ [DOWNLOAD SERVICE] Download failed:', {
        resourceId,
        resourceType,
        businessProfileId,
        error: error.response?.data || error.message
      });

      // Handle specific error cases
      if (error.response?.status === 429) {
        throw new Error('Daily download limit reached. Please try again tomorrow.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Resource not found.');
      }

      // Re-throw for proper error handling in UI
      throw error;
    }
  }

  /**
   * GET BUSINESS DOWNLOADS
   * Fetches downloads for a specific business profile
   */
  async getBusinessDownloads(businessProfileId: string): Promise<any[]> {
    try {
      console.log('📥 [DOWNLOAD SERVICE] Fetching business downloads:', businessProfileId);
      
      const response = await api.get(`/api/mobile/downloads/business/${businessProfileId}`);
      
      if (response.data?.success) {
        console.log('✅ [DOWNLOAD SERVICE] Business downloads loaded:', response.data.downloads?.length || 0);
        return response.data.downloads || [];
      }
      
      console.warn('⚠️ [DOWNLOAD SERVICE] No downloads found for business:', businessProfileId);
      return [];
    } catch (error) {
      console.error('❌ [DOWNLOAD SERVICE] Error fetching business downloads:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const downloadService = DownloadService.getInstance();
export default downloadService;
