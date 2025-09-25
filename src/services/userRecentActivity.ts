import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentActivity {
  id: string;
  userId: string;
  action: 'login' | 'logout' | 'view_template' | 'like_template' | 'download_poster' | 'create_business_profile' | 'update_profile' | 'search' | 'share_content' | 'subscribe' | 'unsubscribe';
  resourceType: 'template' | 'poster' | 'video' | 'greeting' | 'business-profile' | 'profile' | 'subscription' | 'general';
  resourceId?: string;
  resourceName?: string;
  description: string;
  timestamp: string;
  metadata?: {
    category?: string;
    source?: string;
    deviceType?: string;
    duration?: number;
    [key: string]: any;
  };
}

export interface ActivitySummary {
  userId: string;
  totalActivities: number;
  activitiesToday: number;
  activitiesThisWeek: number;
  activitiesThisMonth: number;
  mostFrequentAction: string;
  recentActions: RecentActivity[];
  activityByType: Record<string, number>;
  activityByResource: Record<string, number>;
}

class UserRecentActivityService {
  private readonly STORAGE_KEY = 'user_recent_activity';
  private readonly MAX_ACTIVITIES_PER_USER = 1000;
  private readonly MAX_RECENT_DISPLAY = 50;

  // Add activity
  async addActivity(
    userId: string,
    action: RecentActivity['action'],
    resourceType: RecentActivity['resourceType'],
    description: string,
    resourceId?: string,
    resourceName?: string,
    metadata?: RecentActivity['metadata']
  ): Promise<RecentActivity> {
    try {
      const allActivities = await this.getAllActivities();
      
      const activity: RecentActivity = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        userId,
        action,
        resourceType,
        resourceId,
        resourceName,
        description,
        timestamp: new Date().toISOString(),
        metadata,
      };

      // Add new activity
      const updatedActivities = [activity, ...allActivities];
      
      // Maintain limit per user
      const userActivities = updatedActivities.filter(a => a.userId === userId);
      const otherUserActivities = updatedActivities.filter(a => a.userId !== userId);
      
      const limitedUserActivities = userActivities.slice(0, this.MAX_ACTIVITIES_PER_USER);
      const finalActivities = [...limitedUserActivities, ...otherUserActivities];
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(finalActivities));
      
      console.log('✅ Activity added for user:', userId, 'Action:', action);
      return activity;
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  }

  // Get user's recent activities
  async getUserRecentActivities(userId: string, limit: number = this.MAX_RECENT_DISPLAY): Promise<RecentActivity[]> {
    try {
      const allActivities = await this.getAllActivities();
      
      const userActivities = allActivities
        .filter(activity => activity.userId === userId)
        .slice(0, limit);
      
      return userActivities;
    } catch (error) {
      console.error('Error getting user recent activities:', error);
      return [];
    }
  }

  // Get activity summary for user
  async getActivitySummary(userId: string): Promise<ActivitySummary> {
    try {
      const allActivities = await this.getAllActivities();
      const userActivities = allActivities.filter(activity => activity.userId === userId);
      
      if (userActivities.length === 0) {
        return {
          userId,
          totalActivities: 0,
          activitiesToday: 0,
          activitiesThisWeek: 0,
          activitiesThisMonth: 0,
          mostFrequentAction: '',
          recentActions: [],
          activityByType: {},
          activityByResource: {},
        };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalActivities = userActivities.length;
      const activitiesToday = userActivities.filter(a => new Date(a.timestamp) >= today).length;
      const activitiesThisWeek = userActivities.filter(a => new Date(a.timestamp) >= weekAgo).length;
      const activitiesThisMonth = userActivities.filter(a => new Date(a.timestamp) >= monthAgo).length;

      // Most frequent action
      const actionCounts = new Map<string, number>();
      userActivities.forEach(activity => {
        actionCounts.set(activity.action, (actionCounts.get(activity.action) || 0) + 1);
      });
      const mostFrequentAction = Array.from(actionCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      // Recent actions
      const recentActions = userActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      // Activity by type
      const activityByType = {};
      userActivities.forEach(activity => {
        activityByType[activity.action] = (activityByType[activity.action] || 0) + 1;
      });

      // Activity by resource
      const activityByResource = {};
      userActivities.forEach(activity => {
        activityByResource[activity.resourceType] = (activityByResource[activity.resourceType] || 0) + 1;
      });

      return {
        userId,
        totalActivities,
        activitiesToday,
        activitiesThisWeek,
        activitiesThisMonth,
        mostFrequentAction,
        recentActions,
        activityByType,
        activityByResource,
      };
    } catch (error) {
      console.error('Error getting activity summary:', error);
      throw error;
    }
  }

  // Get activities by date range
  async getActivitiesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RecentActivity[]> {
    try {
      const allActivities = await this.getAllActivities();
      
      const userActivities = allActivities.filter(activity => {
        if (activity.userId !== userId) return false;
        
        const activityDate = new Date(activity.timestamp);
        return activityDate >= startDate && activityDate <= endDate;
      });
      
      return userActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting activities by date range:', error);
      return [];
    }
  }

  // Get activities by action type
  async getActivitiesByAction(
    userId: string,
    action: RecentActivity['action'],
    limit: number = 20
  ): Promise<RecentActivity[]> {
    try {
      const allActivities = await this.getAllActivities();
      
      const userActivities = allActivities
        .filter(activity => activity.userId === userId && activity.action === action)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
      
      return userActivities;
    } catch (error) {
      console.error('Error getting activities by action:', error);
      return [];
    }
  }

  // Clear user's activity history
  async clearUserActivities(userId: string): Promise<boolean> {
    try {
      const allActivities = await this.getAllActivities();
      const filteredActivities = allActivities.filter(activity => activity.userId !== userId);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredActivities));
      console.log('✅ Cleared activities for user:', userId);
      return true;
    } catch (error) {
      console.error('Error clearing user activities:', error);
      return false;
    }
  }

  // Remove specific activity
  async removeActivity(activityId: string, userId: string): Promise<boolean> {
    try {
      const allActivities = await this.getAllActivities();
      const filteredActivities = allActivities.filter(activity => 
        !(activity.id === activityId && activity.userId === userId)
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredActivities));
      console.log('✅ Removed activity:', activityId);
      return true;
    } catch (error) {
      console.error('Error removing activity:', error);
      return false;
    }
  }

  // Get all activities (internal method)
  private async getAllActivities(): Promise<RecentActivity[]> {
    try {
      const activitiesJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!activitiesJson) {
        return [];
      }
      return JSON.parse(activitiesJson);
    } catch (error) {
      console.error('Error getting all activities:', error);
      return [];
    }
  }

  // Helper methods for common activities
  async recordLogin(userId: string, metadata?: RecentActivity['metadata']): Promise<RecentActivity> {
    return this.addActivity(
      userId,
      'login',
      'general',
      'User logged into the app',
      undefined,
      undefined,
      metadata
    );
  }

  async recordLogout(userId: string, metadata?: RecentActivity['metadata']): Promise<RecentActivity> {
    return this.addActivity(
      userId,
      'logout',
      'general',
      'User logged out of the app',
      undefined,
      undefined,
      metadata
    );
  }

  async recordTemplateView(
    userId: string,
    templateId: string,
    templateName: string,
    templateType: RecentActivity['resourceType'],
    metadata?: RecentActivity['metadata']
  ): Promise<RecentActivity> {
    return this.addActivity(
      userId,
      'view_template',
      templateType,
      `Viewed template: ${templateName}`,
      templateId,
      templateName,
      metadata
    );
  }

  async recordTemplateLike(
    userId: string,
    templateId: string,
    templateName: string,
    templateType: RecentActivity['resourceType'],
    metadata?: RecentActivity['metadata']
  ): Promise<RecentActivity> {
    return this.addActivity(
      userId,
      'like_template',
      templateType,
      `Liked template: ${templateName}`,
      templateId,
      templateName,
      metadata
    );
  }

  async recordPosterDownload(
    userId: string,
    posterId: string,
    posterName: string,
    metadata?: RecentActivity['metadata']
  ): Promise<RecentActivity> {
    return this.addActivity(
      userId,
      'download_poster',
      'poster',
      `Downloaded poster: ${posterName}`,
      posterId,
      posterName,
      metadata
    );
  }

  async recordBusinessProfileCreation(
    userId: string,
    profileId: string,
    profileName: string,
    metadata?: RecentActivity['metadata']
  ): Promise<RecentActivity> {
    return this.addActivity(
      userId,
      'create_business_profile',
      'business-profile',
      `Created business profile: ${profileName}`,
      profileId,
      profileName,
      metadata
    );
  }

  async recordProfileUpdate(
    userId: string,
    metadata?: RecentActivity['metadata']
  ): Promise<RecentActivity> {
    return this.addActivity(
      userId,
      'update_profile',
      'profile',
      'Updated user profile',
      userId,
      'Profile',
      metadata
    );
  }

  async recordSearch(
    userId: string,
    query: string,
    resultCount: number,
    metadata?: RecentActivity['metadata']
  ): Promise<RecentActivity> {
    return this.addActivity(
      userId,
      'search',
      'general',
      `Searched for: "${query}" (${resultCount} results)`,
      undefined,
      query,
      { ...metadata, resultCount }
    );
  }

  async recordShare(
    userId: string,
    resourceId: string,
    resourceName: string,
    resourceType: RecentActivity['resourceType'],
    metadata?: RecentActivity['metadata']
  ): Promise<RecentActivity> {
    return this.addActivity(
      userId,
      'share_content',
      resourceType,
      `Shared: ${resourceName}`,
      resourceId,
      resourceName,
      metadata
    );
  }

  // Export user's activity data
  async exportUserActivities(userId: string): Promise<string> {
    try {
      const allActivities = await this.getAllActivities();
      const userActivities = allActivities.filter(activity => activity.userId === userId);
      
      const exportData = {
        userId,
        exportDate: new Date().toISOString(),
        totalRecords: userActivities.length,
        data: userActivities,
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting user activities:', error);
      throw error;
    }
  }
}

export default new UserRecentActivityService();
