import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TemplateUsage {
  id: string;
  userId: string;
  templateId: string;
  templateType: 'poster' | 'video' | 'greeting' | 'business-profile';
  action: 'view' | 'like' | 'download' | 'use' | 'share' | 'edit';
  templateName?: string;
  templateCategory?: string;
  usageDuration?: number; // in seconds, for views
  timestamp: string;
  metadata?: {
    source?: string; // where the template was accessed from
    deviceType?: string;
    screenSize?: string;
    [key: string]: any;
  };
}

export interface TemplateUsageStats {
  templateId: string;
  templateName?: string;
  templateType: string;
  totalViews: number;
  totalLikes: number;
  totalDownloads: number;
  totalUses: number;
  totalShares: number;
  uniqueUsers: number;
  averageUsageDuration: number;
  lastUsed: string;
  userSpecificStats?: {
    views: number;
    likes: number;
    downloads: number;
    uses: number;
    shares: number;
    lastUsed: string;
  };
}

export interface UserTemplateStats {
  userId: string;
  totalTemplatesViewed: number;
  totalTemplatesLiked: number;
  totalTemplatesDownloaded: number;
  totalTemplatesUsed: number;
  totalTemplatesShared: number;
  favoriteCategories: string[];
  mostUsedTemplates: string[];
  averageSessionDuration: number;
  recentActivity: TemplateUsage[];
}

class UserTemplateUsageService {
  private readonly STORAGE_KEY = 'user_template_usage';

  // Record template usage
  async recordTemplateUsage(
    userId: string,
    templateId: string,
    action: TemplateUsage['action'],
    templateType: TemplateUsage['templateType'],
    metadata?: TemplateUsage['metadata']
  ): Promise<TemplateUsage> {
    try {
      const allUsage = await this.getAllTemplateUsage();
      
      const usage: TemplateUsage = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        userId,
        templateId,
        templateType,
        action,
        timestamp: new Date().toISOString(),
        metadata,
      };

      const updatedUsage = [...allUsage, usage];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUsage));
      
      console.log('✅ Template usage recorded:', action, 'for template:', templateId, 'by user:', userId);
      return usage;
    } catch (error) {
      console.error('Error recording template usage:', error);
      throw error;
    }
  }

  // Get template usage statistics for a specific template
  async getTemplateUsageStats(templateId: string, userId?: string): Promise<TemplateUsageStats> {
    try {
      const allUsage = await this.getAllTemplateUsage();
      const templateUsage = allUsage.filter(usage => usage.templateId === templateId);
      
      if (templateUsage.length === 0) {
        return {
          templateId,
          templateType: 'unknown',
          totalViews: 0,
          totalLikes: 0,
          totalDownloads: 0,
          totalUses: 0,
          totalShares: 0,
          uniqueUsers: 0,
          averageUsageDuration: 0,
          lastUsed: '',
        };
      }

      // Calculate global stats
      const totalViews = templateUsage.filter(u => u.action === 'view').length;
      const totalLikes = templateUsage.filter(u => u.action === 'like').length;
      const totalDownloads = templateUsage.filter(u => u.action === 'download').length;
      const totalUses = templateUsage.filter(u => u.action === 'use').length;
      const totalShares = templateUsage.filter(u => u.action === 'share').length;
      
      const uniqueUsers = new Set(templateUsage.map(u => u.userId)).size;
      
      const viewDurations = templateUsage
        .filter(u => u.action === 'view' && u.usageDuration)
        .map(u => u.usageDuration!);
      const averageUsageDuration = viewDurations.length > 0 
        ? viewDurations.reduce((sum, duration) => sum + duration, 0) / viewDurations.length 
        : 0;

      const lastUsed = templateUsage
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        .timestamp;

      const templateName = templateUsage[0]?.templateName;
      const templateType = templateUsage[0]?.templateType || 'unknown';

      let userSpecificStats;
      if (userId) {
        const userUsage = templateUsage.filter(u => u.userId === userId);
        const userViews = userUsage.filter(u => u.action === 'view').length;
        const userLikes = userUsage.filter(u => u.action === 'like').length;
        const userDownloads = userUsage.filter(u => u.action === 'download').length;
        const userUses = userUsage.filter(u => u.action === 'use').length;
        const userShares = userUsage.filter(u => u.action === 'share').length;
        
        const userLastUsed = userUsage.length > 0
          ? userUsage.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
          : '';

        userSpecificStats = {
          views: userViews,
          likes: userLikes,
          downloads: userDownloads,
          uses: userUses,
          shares: userShares,
          lastUsed: userLastUsed,
        };
      }

      return {
        templateId,
        templateName,
        templateType,
        totalViews,
        totalLikes,
        totalDownloads,
        totalUses,
        totalShares,
        uniqueUsers,
        averageUsageDuration,
        lastUsed,
        userSpecificStats,
      };
    } catch (error) {
      console.error('Error getting template usage stats:', error);
      throw error;
    }
  }

  // Get user's template usage statistics
  async getUserTemplateStats(userId: string): Promise<UserTemplateStats> {
    try {
      const allUsage = await this.getAllTemplateUsage();
      const userUsage = allUsage.filter(usage => usage.userId === userId);
      
      if (userUsage.length === 0) {
        return {
          userId,
          totalTemplatesViewed: 0,
          totalTemplatesLiked: 0,
          totalTemplatesDownloaded: 0,
          totalTemplatesUsed: 0,
          totalTemplatesShared: 0,
          favoriteCategories: [],
          mostUsedTemplates: [],
          averageSessionDuration: 0,
          recentActivity: [],
        };
      }

      const totalTemplatesViewed = userUsage.filter(u => u.action === 'view').length;
      const totalTemplatesLiked = userUsage.filter(u => u.action === 'like').length;
      const totalTemplatesDownloaded = userUsage.filter(u => u.action === 'download').length;
      const totalTemplatesUsed = userUsage.filter(u => u.action === 'use').length;
      const totalTemplatesShared = userUsage.filter(u => u.action === 'share').length;

      // Favorite categories
      const categoryCounts = new Map<string, number>();
      userUsage.forEach(usage => {
        if (usage.templateCategory) {
          categoryCounts.set(usage.templateCategory, (categoryCounts.get(usage.templateCategory) || 0) + 1);
        }
      });
      const favoriteCategories = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category]) => category);

      // Most used templates
      const templateCounts = new Map<string, number>();
      userUsage.forEach(usage => {
        if (usage.action === 'use') {
          templateCounts.set(usage.templateId, (templateCounts.get(usage.templateId) || 0) + 1);
        }
      });
      const mostUsedTemplates = Array.from(templateCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([templateId]) => templateId);

      // Average session duration
      const viewDurations = userUsage
        .filter(u => u.action === 'view' && u.usageDuration)
        .map(u => u.usageDuration!);
      const averageSessionDuration = viewDurations.length > 0 
        ? viewDurations.reduce((sum, duration) => sum + duration, 0) / viewDurations.length 
        : 0;

      // Recent activity
      const recentActivity = userUsage
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);

      return {
        userId,
        totalTemplatesViewed,
        totalTemplatesLiked,
        totalTemplatesDownloaded,
        totalTemplatesUsed,
        totalTemplatesShared,
        favoriteCategories,
        mostUsedTemplates,
        averageSessionDuration,
        recentActivity,
      };
    } catch (error) {
      console.error('Error getting user template stats:', error);
      throw error;
    }
  }

  // Get popular templates across all users
  async getPopularTemplates(limit: number = 20): Promise<TemplateUsageStats[]> {
    try {
      const allUsage = await this.getAllTemplateUsage();
      
      // Group by template ID
      const templateGroups = new Map<string, TemplateUsage[]>();
      allUsage.forEach(usage => {
        const existing = templateGroups.get(usage.templateId) || [];
        existing.push(usage);
        templateGroups.set(usage.templateId, existing);
      });

      // Calculate stats for each template
      const templateStats: TemplateUsageStats[] = [];
      for (const [templateId, usages] of templateGroups.entries()) {
        const stats = await this.getTemplateUsageStats(templateId);
        templateStats.push(stats);
      }

      // Sort by total usage (views + likes + downloads + uses + shares)
      templateStats.sort((a, b) => {
        const aTotal = a.totalViews + a.totalLikes + a.totalDownloads + a.totalUses + a.totalShares;
        const bTotal = b.totalViews + b.totalLikes + b.totalDownloads + b.totalUses + b.totalShares;
        return bTotal - aTotal;
      });

      return templateStats.slice(0, limit);
    } catch (error) {
      console.error('Error getting popular templates:', error);
      return [];
    }
  }

  // Clear user's template usage data
  async clearUserTemplateUsage(userId: string): Promise<boolean> {
    try {
      const allUsage = await this.getAllTemplateUsage();
      const filteredUsage = allUsage.filter(usage => usage.userId !== userId);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredUsage));
      console.log('✅ Cleared template usage for user:', userId);
      return true;
    } catch (error) {
      console.error('Error clearing template usage:', error);
      return false;
    }
  }

  // Get all template usage (internal method)
  private async getAllTemplateUsage(): Promise<TemplateUsage[]> {
    try {
      const usageJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!usageJson) {
        return [];
      }
      return JSON.parse(usageJson);
    } catch (error) {
      console.error('Error getting all template usage:', error);
      return [];
    }
  }

  // Export user's template usage data
  async exportUserTemplateUsage(userId: string): Promise<string> {
    try {
      const allUsage = await this.getAllTemplateUsage();
      const userUsage = allUsage.filter(usage => usage.userId === userId);
      
      const exportData = {
        userId,
        exportDate: new Date().toISOString(),
        totalRecords: userUsage.length,
        data: userUsage,
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting template usage:', error);
      throw error;
    }
  }

  // Get usage analytics for admin/dashboard
  async getUsageAnalytics(): Promise<{
    totalUsers: number;
    totalTemplates: number;
    totalUsageEvents: number;
    mostPopularTemplates: TemplateUsageStats[];
    usageByType: Record<string, number>;
    usageByCategory: Record<string, number>;
  }> {
    try {
      const allUsage = await this.getAllTemplateUsage();
      
      const uniqueUsers = new Set(allUsage.map(u => u.userId)).size;
      const uniqueTemplates = new Set(allUsage.map(u => u.templateId)).size;
      
      const mostPopularTemplates = await this.getPopularTemplates(10);
      
      const usageByType = {
        view: 0,
        like: 0,
        download: 0,
        use: 0,
        share: 0,
        edit: 0,
      };
      
      allUsage.forEach(usage => {
        usageByType[usage.action]++;
      });
      
      const usageByCategory = {};
      allUsage.forEach(usage => {
        if (usage.templateCategory) {
          usageByCategory[usage.templateCategory] = (usageByCategory[usage.templateCategory] || 0) + 1;
        }
      });
      
      return {
        totalUsers: uniqueUsers,
        totalTemplates: uniqueTemplates,
        totalUsageEvents: allUsage.length,
        mostPopularTemplates,
        usageByType,
        usageByCategory,
      };
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      throw error;
    }
  }
}

export default new UserTemplateUsageService();
