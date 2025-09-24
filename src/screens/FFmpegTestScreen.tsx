import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

const FFmpegTestScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const testFFmpegImport = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Try to import FFmpeg Kit
      setTestResults(prev => [...prev, 'Testing FFmpeg Kit import...']);
      
      const { FFmpegKit } = await import('ffmpeg-kit-react-native');
      setTestResults(prev => [...prev, '✅ FFmpeg Kit imported successfully']);
      
      // Test 2: Try to get version
      setTestResults(prev => [...prev, 'Testing FFmpeg version...']);
      const session = await FFmpegKit.execute('-version');
      const returnCode = await session.getReturnCode();
      const output = await session.getOutput();
      
      if (returnCode.isSuccess()) {
        setTestResults(prev => [...prev, '✅ FFmpeg version test successful']);
        setTestResults(prev => [...prev, `Version output: ${output.substring(0, 100)}...`]);
      } else {
        setTestResults(prev => [...prev, '❌ FFmpeg version test failed']);
        setTestResults(prev => [...prev, `Error: ${output}`]);
      }
      
      // Test 3: Test video processing service
      setTestResults(prev => [...prev, 'Testing video processing service...']);
      const videoProcessingService = await import('../services/videoProcessingService');
      const service = videoProcessingService.default;
      
      const basicTest = await service.testFFmpeg();
      if (basicTest) {
        setTestResults(prev => [...prev, '✅ Basic FFmpeg test successful']);
      } else {
        setTestResults(prev => [...prev, '❌ Basic FFmpeg test failed']);
      }
      
      // Test 4: Test drawtext filter
      setTestResults(prev => [...prev, 'Testing drawtext filter...']);
      const drawtextTest = await service.testFFmpegDrawtext();
      if (drawtextTest) {
        setTestResults(prev => [...prev, '✅ Drawtext filter test successful']);
      } else {
        setTestResults(prev => [...prev, '❌ Drawtext filter test failed']);
      }
      
    } catch (error) {
      setTestResults(prev => [...prev, `❌ Error: ${error}`]);
      console.error('FFmpeg test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>FFmpeg Integration Test</Text>
        <Text style={styles.subtitle}>Testing local FFmpeg library integration</Text>
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testFFmpegImport}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Test FFmpeg Import</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>

        {testResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Test Results:</Text>
            {testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
    fontFamily: 'monospace',
  },
});

export default FFmpegTestScreen;