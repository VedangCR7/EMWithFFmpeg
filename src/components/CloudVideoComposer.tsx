import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import VideoCompositionService, { CompositionProgress, CompositionResult } from '../services/CloudVideoCompositionService';
import { useTheme } from '../context/ThemeContext';

interface CloudVideoComposerProps {
  videoPath: string; // Current video from VideoEditorScreen
  overlayPaths: string[]; // Current overlays from VideoEditorScreen
  onCompositionComplete?: (result: CompositionResult) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

const CloudVideoComposer: React.FC<CloudVideoComposerProps> = ({
  videoPath,
  overlayPaths,
  onCompositionComplete,
  onError,
  onClose,
}) => {
  const { theme } = useTheme();
  const [isComposing, setIsComposing] = useState(false);
  const [progress, setProgress] = useState<CompositionProgress | null>(null);
  const [serverHealth, setServerHealth] = useState<boolean | null>(null);

      const compositionService = new VideoCompositionService('http://192.168.1.18:8000');

  // Check server health on component mount
  React.useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const isHealthy = await compositionService.checkServerHealth();
      setServerHealth(isHealthy);
      
      if (!isHealthy) {
        Alert.alert(
          'Server Unavailable',
          'The video composition server is not available. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Server health check failed:', error);
      setServerHealth(false);
    }
  };

  const composeVideo = useCallback(async () => {
    if (!videoPath) {
      Alert.alert('Error', 'No video provided.');
      return;
    }

    if (serverHealth === false) {
      Alert.alert('Error', 'Server is not available. Please check your connection.');
      return;
    }

    console.log('🎬 Starting composition with:');
    console.log('- Video:', videoPath);
    console.log('- Overlays:', overlayPaths.length);
    console.log('- Server Health:', serverHealth);

    setIsComposing(true);
    setProgress({
      stage: 'uploading',
      progress: 0,
      message: 'Preparing composition...'
    });

    try {
      console.log('🌐 Starting cloud video composition...');
      
      const result = await compositionService.composeVideo(
        videoPath,
        overlayPaths,
        {
          quality: 'high',
          outputFormat: 'mp4',
          overlayPositions: overlayPaths.map((_, index) => ({
            x: 50 + (index * 100),
            y: 50 + (index * 100)
          }))
        },
        (progressUpdate) => {
          setProgress(progressUpdate);
          console.log(`📊 Progress: ${progressUpdate.stage} - ${progressUpdate.progress}%`);
        }
      );

      if (result.success) {
        Alert.alert(
          'Success!',
          `Video composition completed successfully!\nProcessing time: ${result.processingTime}ms`,
          [
            {
              text: 'OK',
              onPress: () => {
                onCompositionComplete?.(result);
              }
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Composition failed');
      }

    } catch (error) {
      console.error('❌ Composition error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      Alert.alert('Composition Failed', errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsComposing(false);
      setProgress(null);
    }
  }, [videoPath, overlayPaths, serverHealth, compositionService, onCompositionComplete, onError]);

  const renderProgress = () => {
    if (!progress) return null;

    const getStageIcon = (stage: string) => {
      switch (stage) {
        case 'uploading': return '📤';
        case 'processing': return '⚙️';
        case 'downloading': return '📥';
        case 'complete': return '✅';
        default: return '🔄';
      }
    };

    return (
      <View style={[styles.progressContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.progressText, { color: theme.colors.text }]}>
          {getStageIcon(progress.stage)} {progress.message}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: theme.colors.primary,
                width: `${progress.progress}%`
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressPercent, { color: theme.colors.text }]}>
          {Math.round(progress.progress)}%
        </Text>
      </View>
    );
  };

  const renderServerStatus = () => {
    if (serverHealth === null) return null;

    return (
      <View style={styles.serverStatus}>
        <Text style={[
          styles.serverStatusText,
          { color: serverHealth ? theme.colors.success : theme.colors.error }
        ]}>
          {serverHealth ? '🟢 Server Online' : '🔴 Server Offline'}
        </Text>
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
          onPress={checkServerHealth}
        >
          <Text style={[styles.refreshButtonText, { color: theme.colors.onPrimary }]}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          🌐 Cloud Video Composition
        </Text>
        {onClose && (
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {renderServerStatus()}

      {/* Video Information */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          📹 Current Video
        </Text>
        
        <Text style={[styles.fileInfo, { color: theme.colors.text }]}>
          ✅ Video: {videoPath.split('/').pop()}
        </Text>
      </View>

      {/* Overlay Information */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          🖼️ Current Overlays ({overlayPaths.length})
        </Text>
        
        {overlayPaths.length > 0 ? (
          <View style={styles.overlayList}>
            {overlayPaths.map((overlayPath, index) => (
              <View key={index} style={styles.overlayItem}>
                <Image source={{ uri: overlayPath }} style={styles.overlayThumbnail} />
                <Text style={[styles.overlayText, { color: theme.colors.text }]}>
                  Overlay {index + 1}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.fileInfo, { color: theme.colors.text }]}>
            No overlays selected
          </Text>
        )}
      </View>

      {/* Progress */}
      {renderProgress()}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[
            styles.composeButton, 
            { 
              backgroundColor: isComposing ? theme.colors.disabled : theme.colors.primary,
              opacity: isComposing ? 0.6 : 1
            }
          ]}
          onPress={composeVideo}
          disabled={isComposing || !videoPath || serverHealth === false}
        >
          {isComposing ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
              🎬 Compose Video
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  serverStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
  },
  serverStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fileInfo: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  overlayList: {
    marginTop: 12,
  },
  overlayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  overlayThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  overlayText: {
    flex: 1,
    fontSize: 14,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  composeButton: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default CloudVideoComposer;
