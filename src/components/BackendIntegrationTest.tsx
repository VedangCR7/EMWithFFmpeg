import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { checkAPIHealth, getBusinessCategories } from '../services/eventMarketersApi';
import userService from '../services/userService';
import contentService from '../services/contentService';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

const BackendIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (name: string, status: 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => 
      prev.map(test => 
        test.name === name 
          ? { ...test, status, message, data }
          : test
      )
    );
  };

  const addTestResult = (name: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => [...prev, { name, status, message, data }]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: API Health Check
    addTestResult('API Health Check', 'pending', 'Checking API health...');
    try {
      const healthResponse = await checkAPIHealth();
      updateTestResult('API Health Check', 'success', `API is ${healthResponse.status}`, healthResponse);
    } catch (error) {
      updateTestResult('API Health Check', 'error', `Health check failed: ${error}`, error);
    }

    // Test 2: Business Categories
    addTestResult('Business Categories', 'pending', 'Fetching business categories...');
    try {
      const categoriesResponse = await getBusinessCategories();
      if (categoriesResponse.success) {
        updateTestResult('Business Categories', 'success', `Found ${categoriesResponse.categories.length} categories`, categoriesResponse.categories);
      } else {
        updateTestResult('Business Categories', 'error', categoriesResponse.error || 'Failed to fetch categories');
      }
    } catch (error) {
      updateTestResult('Business Categories', 'error', `Categories fetch failed: ${error}`, error);
    }

    // Test 3: User Service Initialization
    addTestResult('User Service Init', 'pending', 'Initializing user service...');
    try {
      const deviceId = await userService.initialize();
      updateTestResult('User Service Init', 'success', `Device ID: ${deviceId}`, { deviceId });
    } catch (error) {
      updateTestResult('User Service Init', 'error', `User service init failed: ${error}`, error);
    }

    // Test 4: Content Service Health Check
    addTestResult('Content Service Health', 'pending', 'Checking content service...');
    try {
      const isHealthy = await contentService.checkHealth();
      updateTestResult('Content Service Health', 'success', `Content service is ${isHealthy ? 'healthy' : 'unhealthy'}`, { isHealthy });
    } catch (error) {
      updateTestResult('Content Service Health', 'error', `Content service check failed: ${error}`, error);
    }

    // Test 5: User Registration (Test)
    addTestResult('User Registration', 'pending', 'Testing user registration...');
    try {
      const testUser = await userService.registerUser({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
      });
      updateTestResult('User Registration', 'success', `User registered: ${testUser.name}`, testUser);
    } catch (error) {
      updateTestResult('User Registration', 'error', `Registration failed: ${error}`, error);
    }

    // Test 6: User Profile Fetch
    addTestResult('User Profile', 'pending', 'Fetching user profile...');
    try {
      const userProfile = await userService.getUserProfile();
      if (userProfile) {
        updateTestResult('User Profile', 'success', `Profile loaded: ${userProfile.name}`, userProfile);
      } else {
        updateTestResult('User Profile', 'error', 'No user profile found');
      }
    } catch (error) {
      updateTestResult('User Profile', 'error', `Profile fetch failed: ${error}`, error);
    }

    // Test 7: Activity Tracking
    addTestResult('Activity Tracking', 'pending', 'Testing activity tracking...');
    try {
      await userService.trackContentView('test-content-1', 'image', { category: 'test' });
      updateTestResult('Activity Tracking', 'success', 'Activity tracked successfully');
    } catch (error) {
      updateTestResult('Activity Tracking', 'error', `Activity tracking failed: ${error}`, error);
    }

    setIsRunning(false);
  };

  const runSingleTest = async (testName: string) => {
    switch (testName) {
      case 'API Health Check':
        addTestResult('API Health Check', 'pending', 'Checking API health...');
        try {
          const healthResponse = await checkAPIHealth();
          updateTestResult('API Health Check', 'success', `API is ${healthResponse.status}`, healthResponse);
        } catch (error) {
          updateTestResult('API Health Check', 'error', `Health check failed: ${error}`, error);
        }
        break;
      
      case 'Business Categories':
        addTestResult('Business Categories', 'pending', 'Fetching business categories...');
        try {
          const categoriesResponse = await getBusinessCategories();
          if (categoriesResponse.success) {
            updateTestResult('Business Categories', 'success', `Found ${categoriesResponse.categories.length} categories`, categoriesResponse.categories);
          } else {
            updateTestResult('Business Categories', 'error', categoriesResponse.error || 'Failed to fetch categories');
          }
        } catch (error) {
          updateTestResult('Business Categories', 'error', `Categories fetch failed: ${error}`, error);
        }
        break;
      
      default:
        Alert.alert('Test Not Found', `Test "${testName}" is not implemented yet.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Backend Integration Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, isRunning && styles.buttonDisabled]} 
        onPress={runAllTests}
        disabled={isRunning}
      >
        {isRunning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run All Tests</Text>
        )}
      </TouchableOpacity>

      <View style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <View key={index} style={styles.testResult}>
            <View style={styles.testHeader}>
              <Text style={styles.testIcon}>{getStatusIcon(result.status)}</Text>
              <Text style={styles.testName}>{result.name}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => runSingleTest(result.name)}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.testMessage, { color: getStatusColor(result.status) }]}>
              {result.message}
            </Text>
            {result.data && (
              <Text style={styles.testData}>
                {JSON.stringify(result.data, null, 2)}
              </Text>
            )}
          </View>
        ))}
      </View>

      {testResults.length === 0 && (
        <Text style={styles.placeholder}>
          Click "Run All Tests" to test backend integration
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    marginTop: 10,
  },
  testResult: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#333',
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  testData: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  placeholder: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 50,
  },
});

export default BackendIntegrationTest;

