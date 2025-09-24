import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { authApi, subscriptionApi, templatesBannersApi, mediaApi, dashboardApi } from '../services';
import BackendIntegrationTest from '../components/BackendIntegrationTest';

interface ApiTestResult {
  name: string;
  status: 'working' | 'not_working' | 'testing';
  message: string;
  response?: any;
}

const ApiTestScreen: React.FC = () => {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (result: ApiTestResult) => {
    setResults(prev => [...prev, result]);
  };

  const testApi = async (name: string, testFunction: () => Promise<any>) => {
    addResult({ name, status: 'testing', message: 'Testing...' });
    
    try {
      const response = await testFunction();
      addResult({ 
        name, 
        status: 'working', 
        message: 'API is working', 
        response 
      });
    } catch (error: any) {
      addResult({ 
        name, 
        status: 'not_working', 
        message: `Failed: ${error.message || error}`, 
        response: error 
      });
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setResults([]);

    // Authentication APIs
    await testApi('Auth - Register', () => 
      authApi.register({
        email: 'test@example.com',
        password: 'testpassword123',
        companyName: 'Test Company',
        phoneNumber: '+1234567890'
      })
    );

    await testApi('Auth - Login', () => 
      authApi.login({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    );

    await testApi('Auth - Get Profile', () => 
      authApi.getProfile()
    );

    await testApi('Auth - Update Profile', () => 
      authApi.updateProfile({ companyName: 'Updated Test Company' })
    );

    await testApi('Auth - Logout', () => 
      authApi.logout()
    );

    // Subscription APIs
    await testApi('Subscription - Get Plans', () => 
      subscriptionApi.getPlans()
    );

    await testApi('Subscription - Get Status', () => 
      subscriptionApi.getStatus()
    );

    await testApi('Subscription - Get History', () => 
      subscriptionApi.getHistory()
    );

    // Template APIs
    await testApi('Templates - Get Templates', () => 
      templatesBannersApi.getTemplates()
    );

    await testApi('Templates - Get Languages', () => 
      templatesBannersApi.getLanguages()
    );

    await testApi('Templates - Get Categories', () => 
      templatesBannersApi.getTemplateCategories()
    );

    await testApi('Banners - Get User Banners', () => 
      templatesBannersApi.getUserBanners()
    );

    // Media APIs
    await testApi('Media - Get Assets', () => 
      mediaApi.getMediaAssets()
    );

    await testApi('Media - Get Stats', () => 
      mediaApi.getMediaStats()
    );

    // Dashboard APIs
    await testApi('Dashboard - Get Data', () => 
      dashboardApi.getDashboardData()
    );

    await testApi('Dashboard - Get Banner Stats', () => 
      dashboardApi.getBannerStats()
    );

    await testApi('Dashboard - Get Template Usage', () => 
      dashboardApi.getTemplateUsage()
    );

    await testApi('Dashboard - Get Activity', () => 
      dashboardApi.getRecentActivity()
    );

    setIsTesting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return '#4CAF50';
      case 'not_working': return '#F44336';
      case 'testing': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return '✅';
      case 'not_working': return '❌';
      case 'testing': return '⏳';
      default: return '❓';
    }
  };

  const workingCount = results.filter(r => r.status === 'working').length;
  const notWorkingCount = results.filter(r => r.status === 'not_working').length;
  const totalCount = results.length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Test Results</Text>
        <Text style={styles.subtitle}>Testing EventMarketers Backend APIs</Text>
      </View>

      {/* Backend Integration Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔗 Backend Integration Test</Text>
        <BackendIntegrationTest />
      </View>

      {/* Legacy API Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📡 Legacy API Tests</Text>
        
        <TouchableOpacity 
          style={[styles.testButton, isTesting && styles.testButtonDisabled]} 
          onPress={runAllTests}
          disabled={isTesting}
        >
          <Text style={styles.testButtonText}>
            {isTesting ? 'Testing APIs...' : 'Run Legacy API Tests'}
          </Text>
        </TouchableOpacity>

      {totalCount > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.summaryText}>
            Working: {workingCount} | Not Working: {notWorkingCount} | Total: {totalCount}
          </Text>
          <Text style={styles.summaryText}>
            Success Rate: {totalCount > 0 ? ((workingCount / totalCount) * 100).toFixed(1) : 0}%
          </Text>
        </View>
      )}

      {notWorkingCount > 0 && (
        <View style={styles.notWorkingSection}>
          <Text style={styles.notWorkingTitle}>❌ APIs NOT WORKING:</Text>
          {results
            .filter(r => r.status === 'not_working')
            .map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultName}>{result.name}</Text>
                <Text style={styles.resultMessage}>{result.message}</Text>
              </View>
            ))
          }
        </View>
      )}

      <View style={styles.resultsSection}>
        <Text style={styles.resultsTitle}>All Results</Text>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
              <Text style={styles.resultName}>{result.name}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(result.status) }]} />
            </View>
            <Text style={styles.resultMessage}>{result.message}</Text>
          </View>
        ))}
      </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  testButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#ccc',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summary: {
    margin: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notWorkingSection: {
    margin: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  notWorkingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  resultsSection: {
    margin: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  resultMessage: {
    fontSize: 14,
    color: '#666',
    marginLeft: 26,
  },
  section: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
});

export default ApiTestScreen;
