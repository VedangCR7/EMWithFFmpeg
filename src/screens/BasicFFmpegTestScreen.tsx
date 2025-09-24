import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

const BasicFFmpegTestScreen: React.FC = () => {
  const [importStatus, setImportStatus] = useState<string>('Not tested');
  const [isLoading, setIsLoading] = useState(false);

  const testImport = async () => {
    setIsLoading(true);
    setImportStatus('Testing import...');
    
    try {
      // Try to import FFmpeg Kit
      const ffmpegModule = await import('ffmpeg-kit-react-native');
      console.log('FFmpeg module:', ffmpegModule);
      
      if (ffmpegModule.FFmpegKit) {
        setImportStatus('✅ FFmpeg Kit imported successfully');
      } else {
        setImportStatus('❌ FFmpeg Kit import failed - no FFmpegKit export');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus(`❌ Import failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Basic FFmpeg Import Test</Text>
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testImport}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Import'}
          </Text>
        </TouchableOpacity>

        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Import Status:</Text>
          <Text style={styles.statusText}>{importStatus}</Text>
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
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default BasicFFmpegTestScreen;
