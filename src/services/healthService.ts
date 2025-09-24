import eventMarketersApi from './eventMarketersApi';

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
}

class HealthService {
  // Health Check endpoint
  async getHealthCheck(): Promise<HealthCheckResponse> {
    try {
      console.log('Checking EventMarketers backend health...');
      const response = await eventMarketersApi.get('/health');
      console.log('✅ Health check successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  // Check if backend is reachable
  async isBackendReachable(): Promise<boolean> {
    try {
      await this.getHealthCheck();
      return true;
    } catch (error) {
      console.error('Backend is not reachable:', error);
      return false;
    }
  }
}

export default new HealthService();
