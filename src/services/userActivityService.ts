import eventMarketersApi from './eventMarketersApi';

export interface UserActivityRequest {
  deviceId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: {
    category?: string;
    duration?: number;
    [key: string]: any;
  };
}

export interface UserActivityResponse {
  success: boolean;
  activity: {
    id: string;
    deviceId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    timestamp: string;
  };
}

export interface ActivityAnalytics {
  totalViews: number;
  totalDownloads: number;
  totalTimeSpent: number;
  mostViewedCategory: string;
  recentActivities: Array<{
    action: string;
    resourceType: string;
    timestamp: string;
  }>;
}

class UserActivityService {
  private activityQueue: UserActivityRequest[] = [];
  private isProcessingQueue = false;

  // Record user activity
  async recordActivity(activityData: UserActivityRequest): Promise<UserActivityResponse> {
    try {
      console.log('Recording user activity:', activityData.action, 'on', activityData.resourceType);
      const response = await eventMarketersApi.post('/api/installed-users/activity', activityData);
      
      if (response.data.success) {
        console.log('✅ Activity recorded successfully:', response.data.activity.id);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to record activity:', error);
      
      // Add to queue for retry
      this.addToQueue(activityData);
      throw error;
    }
  }

  // Record view activity
  async recordView(deviceId: string, resourceType: string, resourceId: string, metadata?: any): Promise<void> {
    try {
      await this.recordActivity({
        deviceId,
        action: 'view',
        resourceType,
        resourceId,
        metadata
      });
    } catch (error) {
      console.error('Failed to record view:', error);
    }
  }

  // Record download activity
  async recordDownload(deviceId: string, resourceType: string, resourceId: string, metadata?: any): Promise<void> {
    try {
      await this.recordActivity({
        deviceId,
        action: 'download',
        resourceType,
        resourceId,
        metadata
      });
    } catch (error) {
      console.error('Failed to record download:', error);
    }
  }

  // Record share activity
  async recordShare(deviceId: string, resourceType: string, resourceId: string, metadata?: any): Promise<void> {
    try {
      await this.recordActivity({
        deviceId,
        action: 'share',
        resourceType,
        resourceId,
        metadata
      });
    } catch (error) {
      console.error('Failed to record share:', error);
    }
  }

  // Record like/favorite activity
  async recordLike(deviceId: string, resourceType: string, resourceId: string, metadata?: any): Promise<void> {
    try {
      await this.recordActivity({
        deviceId,
        action: 'like',
        resourceType,
        resourceId,
        metadata
      });
    } catch (error) {
      console.error('Failed to record like:', error);
    }
  }

  // Record search activity
  async recordSearch(deviceId: string, searchQuery: string, resultsCount: number): Promise<void> {
    try {
      await this.recordActivity({
        deviceId,
        action: 'search',
        resourceType: 'search',
        resourceId: searchQuery,
        metadata: {
          query: searchQuery,
          resultsCount
        }
      });
    } catch (error) {
      console.error('Failed to record search:', error);
    }
  }

  // Record time spent on content
  async recordTimeSpent(deviceId: string, resourceType: string, resourceId: string, duration: number): Promise<void> {
    try {
      await this.recordActivity({
        deviceId,
        action: 'time_spent',
        resourceType,
        resourceId,
        metadata: {
          duration
        }
      });
    } catch (error) {
      console.error('Failed to record time spent:', error);
    }
  }

  // Add activity to retry queue
  private addToQueue(activityData: UserActivityRequest): void {
    this.activityQueue.push(activityData);
    console.log('Activity added to retry queue. Queue size:', this.activityQueue.length);
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  // Process activity queue
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.activityQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log('Processing activity queue...');

    while (this.activityQueue.length > 0) {
      const activityData = this.activityQueue.shift();
      if (activityData) {
        try {
          await this.recordActivity(activityData);
          console.log('✅ Queued activity recorded successfully');
        } catch (error) {
          console.error('❌ Failed to record queued activity:', error);
          // Re-add to queue for retry (with limit)
          if (this.activityQueue.length < 50) { // Prevent infinite queue growth
            this.activityQueue.push(activityData);
          }
        }
      }
    }

    this.isProcessingQueue = false;
    console.log('Activity queue processing completed');
  }

  // Get activity analytics (mock implementation - would need backend support)
  async getActivityAnalytics(deviceId: string): Promise<ActivityAnalytics> {
    try {
      // This would need a backend endpoint to get analytics
      // For now, return mock data
      return {
        totalViews: 150,
        totalDownloads: 25,
        totalTimeSpent: 3600, // 1 hour in seconds
        mostViewedCategory: 'Restaurant',
        recentActivities: [
          {
            action: 'view',
            resourceType: 'image',
            timestamp: new Date().toISOString()
          },
          {
            action: 'download',
            resourceType: 'video',
            timestamp: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
          }
        ]
      };
    } catch (error) {
      console.error('Failed to get activity analytics:', error);
      throw error;
    }
  }

  // Clear activity queue
  clearQueue(): void {
    this.activityQueue = [];
    console.log('Activity queue cleared');
  }

  // Get queue size
  getQueueSize(): number {
    return this.activityQueue.length;
  }

  // Batch record multiple activities
  async recordBatchActivities(activities: UserActivityRequest[]): Promise<void> {
    try {
      console.log('Recording batch activities:', activities.length);
      
      const promises = activities.map(activity => this.recordActivity(activity));
      await Promise.allSettled(promises);
      
      console.log('✅ Batch activities recorded');
    } catch (error) {
      console.error('❌ Failed to record batch activities:', error);
      throw error;
    }
  }
}

export default new UserActivityService();
