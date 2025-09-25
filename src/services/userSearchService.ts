import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  searchType: 'template' | 'poster' | 'video' | 'greeting' | 'business-profile' | 'general';
  resultCount?: number;
  timestamp: string;
}

export interface SearchSuggestion {
  query: string;
  count: number;
  lastSearched: string;
}

export interface SearchStats {
  totalSearches: number;
  uniqueQueries: number;
  mostSearched: string[];
  recentSearches: SearchHistoryItem[];
  searchByType: {
    template: number;
    poster: number;
    video: number;
    greeting: number;
    businessProfile: number;
    general: number;
  };
}

class UserSearchService {
  private readonly STORAGE_KEY = 'user_search_history';
  private readonly MAX_HISTORY_ITEMS = 100;
  private readonly MAX_SUGGESTIONS = 10;

  // Add search to history
  async addSearchHistory(
    userId: string, 
    query: string, 
    searchType: SearchHistoryItem['searchType'] = 'general',
    resultCount?: number
  ): Promise<SearchHistoryItem> {
    try {
      if (!query.trim()) {
        throw new Error('Search query cannot be empty');
      }

      const allHistory = await this.getAllSearchHistory();
      
      // Create new search item
      const searchItem: SearchHistoryItem = {
        id: Date.now().toString(),
        userId,
        query: query.trim(),
        searchType,
        resultCount,
        timestamp: new Date().toISOString(),
      };

      // Remove duplicate searches (same query, same user, within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const filteredHistory = allHistory.filter(item => 
        !(item.userId === userId && 
          item.query.toLowerCase() === query.toLowerCase() && 
          item.searchType === searchType &&
          item.timestamp > fiveMinutesAgo)
      );

      // Add new search and maintain limit
      const updatedHistory = [searchItem, ...filteredHistory].slice(0, this.MAX_HISTORY_ITEMS);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
      
      console.log('✅ Search history added for user:', userId, 'Query:', query);
      return searchItem;
    } catch (error) {
      console.error('Error adding search history:', error);
      throw error;
    }
  }

  // Get user's search history
  async getUserSearchHistory(userId: string, limit: number = 20): Promise<SearchHistoryItem[]> {
    try {
      const allHistory = await this.getAllSearchHistory();
      
      const userHistory = allHistory
        .filter(item => item.userId === userId)
        .slice(0, limit);
      
      return userHistory;
    } catch (error) {
      console.error('Error getting user search history:', error);
      return [];
    }
  }

  // Get search suggestions based on user's history
  async getSearchSuggestions(userId: string, currentQuery: string = ''): Promise<SearchSuggestion[]> {
    try {
      const allHistory = await this.getAllSearchHistory();
      
      // Get user's search history
      const userHistory = allHistory.filter(item => item.userId === userId);
      
      // Group by query and count occurrences
      const queryCounts = new Map<string, { count: number; lastSearched: string }>();
      
      userHistory.forEach(item => {
        const query = item.query.toLowerCase();
        const existing = queryCounts.get(query);
        if (existing) {
          existing.count++;
          if (item.timestamp > existing.lastSearched) {
            existing.lastSearched = item.timestamp;
          }
        } else {
          queryCounts.set(query, {
            count: 1,
            lastSearched: item.timestamp,
          });
        }
      });

      // Convert to suggestions and filter by current query
      let suggestions: SearchSuggestion[] = Array.from(queryCounts.entries())
        .map(([query, data]) => ({
          query,
          count: data.count,
          lastSearched: data.lastSearched,
        }))
        .sort((a, b) => b.count - a.count); // Sort by frequency

      // Filter by current query if provided
      if (currentQuery.trim()) {
        const query = currentQuery.toLowerCase();
        suggestions = suggestions.filter(suggestion => 
          suggestion.query.includes(query) && suggestion.query !== query
        );
      }

      return suggestions.slice(0, this.MAX_SUGGESTIONS);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Get search statistics for user
  async getUserSearchStats(userId: string): Promise<SearchStats> {
    try {
      const allHistory = await this.getAllSearchHistory();
      const userHistory = allHistory.filter(item => item.userId === userId);
      
      // Calculate stats
      const totalSearches = userHistory.length;
      const uniqueQueries = new Set(userHistory.map(item => item.query.toLowerCase())).size;
      
      // Most searched queries
      const queryCounts = new Map<string, number>();
      userHistory.forEach(item => {
        const query = item.query.toLowerCase();
        queryCounts.set(query, (queryCounts.get(query) || 0) + 1);
      });
      
      const mostSearched = Array.from(queryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([query]) => query);

      // Recent searches
      const recentSearches = userHistory.slice(0, 10);

      // Search by type
      const searchByType = {
        template: 0,
        poster: 0,
        video: 0,
        greeting: 0,
        businessProfile: 0,
        general: 0,
      };

      userHistory.forEach(item => {
        searchByType[item.searchType]++;
      });

      return {
        totalSearches,
        uniqueQueries,
        mostSearched,
        recentSearches,
        searchByType,
      };
    } catch (error) {
      console.error('Error getting search stats:', error);
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        mostSearched: [],
        recentSearches: [],
        searchByType: {
          template: 0,
          poster: 0,
          video: 0,
          greeting: 0,
          businessProfile: 0,
          general: 0,
        },
      };
    }
  }

  // Clear user's search history
  async clearUserSearchHistory(userId: string): Promise<boolean> {
    try {
      const allHistory = await this.getAllSearchHistory();
      const filteredHistory = allHistory.filter(item => item.userId !== userId);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
      console.log('✅ Cleared search history for user:', userId);
      return true;
    } catch (error) {
      console.error('Error clearing search history:', error);
      return false;
    }
  }

  // Remove specific search from history
  async removeSearchFromHistory(searchId: string, userId: string): Promise<boolean> {
    try {
      const allHistory = await this.getAllSearchHistory();
      const filteredHistory = allHistory.filter(item => 
        !(item.id === searchId && item.userId === userId)
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
      console.log('✅ Removed search from history:', searchId);
      return true;
    } catch (error) {
      console.error('Error removing search from history:', error);
      return false;
    }
  }

  // Get all search history (internal method)
  private async getAllSearchHistory(): Promise<SearchHistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!historyJson) {
        return [];
      }
      return JSON.parse(historyJson);
    } catch (error) {
      console.error('Error getting all search history:', error);
      return [];
    }
  }

  // Get trending searches (across all users)
  async getTrendingSearches(limit: number = 10): Promise<SearchSuggestion[]> {
    try {
      const allHistory = await this.getAllSearchHistory();
      
      // Group by query and count occurrences
      const queryCounts = new Map<string, { count: number; lastSearched: string }>();
      
      allHistory.forEach(item => {
        const query = item.query.toLowerCase();
        const existing = queryCounts.get(query);
        if (existing) {
          existing.count++;
          if (item.timestamp > existing.lastSearched) {
            existing.lastSearched = item.timestamp;
          }
        } else {
          queryCounts.set(query, {
            count: 1,
            lastSearched: item.timestamp,
          });
        }
      });

      // Convert to suggestions and sort by count
      const trending = Array.from(queryCounts.entries())
        .map(([query, data]) => ({
          query,
          count: data.count,
          lastSearched: data.lastSearched,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return trending;
    } catch (error) {
      console.error('Error getting trending searches:', error);
      return [];
    }
  }

  // Export user's search history
  async exportUserSearchHistory(userId: string): Promise<string> {
    try {
      const userHistory = await this.getUserSearchHistory(userId, 1000); // Get all history
      return JSON.stringify(userHistory, null, 2);
    } catch (error) {
      console.error('Error exporting search history:', error);
      throw error;
    }
  }
}

export default new UserSearchService();
