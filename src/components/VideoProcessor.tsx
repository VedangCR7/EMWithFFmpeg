import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import videoProcessingService, { VideoLayer, VideoProcessingOptions } from '../services/videoProcessingService';

interface VideoProcessorProps {
  visible: boolean;
  onComplete: (processedVideoPath: string) => void;
  onClose: () => void;
  layers: VideoLayer[];
  selectedVideoUri: any;
  selectedLanguage?: string;
  canvasData?: {
    width: number;
    height: number;
    layers: VideoLayer[];
  };
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({
  visible,
  onComplete,
  onClose,
  layers,
  selectedVideoUri,
  selectedLanguage,
  canvasData,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ffmpegVersion, setFFmpegVersion] = useState<string>('Unknown');

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (visible) {
      // Test FFmpeg when modal opens
      testFFmpeg();
    }
  }, [visible]);

  const testFFmpeg = async () => {
    try {
      const version = await videoProcessingService.getFFmpegVersion();
      setFFmpegVersion(version);
      console.log('✅ FFmpeg version:', version);
    } catch (error) {
      console.error('❌ FFmpeg test failed:', error);
      setError('FFmpeg is not available. Please check your installation.');
    }
  };

  const handleProcessVideo = async () => {
    if (!selectedVideoUri?.uri) {
      Alert.alert('Error', 'No video selected for processing');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setCurrentStage('Preparing video...');

    try {
      console.log('🎬 Starting FFmpeg video processing...');
      console.log('📁 Video URI:', selectedVideoUri.uri);
      console.log('🎨 Layers count:', layers.length);

      // Update progress
      setProgress(10);
      setCurrentStage('Processing video with overlays...');

      // Process video with FFmpeg
      const processedVideoPath = await videoProcessingService.processVideo(
        selectedVideoUri.uri,
        layers,
        {
          width: canvasData?.width || 1080,
          height: canvasData?.height || 1920,
          quality: 'high',
          frameRate: 30,
        }
      );

      setProgress(90);
      setCurrentStage('Finalizing...');

      // Simulate final processing step
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(100);
      setCurrentStage('Complete!');

      console.log('✅ Video processing completed successfully');
      console.log('📁 Output path:', processedVideoPath);

      // Complete processing
      setTimeout(() => {
        onComplete(processedVideoPath);
        setIsProcessing(false);
        setProgress(0);
        setCurrentStage('');
      }, 1000);

    } catch (error) {
      console.error('❌ Video processing failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsProcessing(false);
      setProgress(0);
      setCurrentStage('');
    }
  };

  const handleClose = () => {
    if (isProcessing) {
      Alert.alert(
        'Processing in Progress',
        'Video processing is currently in progress. Are you sure you want to cancel?',
        [
          { text: 'Continue Processing', style: 'cancel' },
          { text: 'Cancel', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.gradient}>
            <View style={styles.header}>
              <Text style={styles.title}>Video Processing</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                disabled={isProcessing}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {/* FFmpeg Status */}
              <View style={styles.statusSection}>
                <Text style={styles.statusTitle}>FFmpeg Status</Text>
                <Text style={styles.statusText}>
                  Version: {ffmpegVersion}
                </Text>
                <Text style={styles.statusText}>
                  Status: {error ? '❌ Error' : '✅ Ready'}
                </Text>
              </View>

              {/* Processing Info */}
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Processing Details</Text>
                <Text style={styles.infoText}>Video: {selectedVideoUri?.uri ? 'Selected' : 'None'}</Text>
                <Text style={styles.infoText}>Layers: {layers.length}</Text>
                <Text style={styles.infoText}>Language: {selectedLanguage || 'Default'}</Text>
              </View>

              {/* Error Display */}
              {error && (
                <View style={styles.errorSection}>
                  <Text style={styles.errorTitle}>Error</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Progress Section */}
              {isProcessing && (
                <View style={styles.progressSection}>
                  <Text style={styles.progressTitle}>Processing Progress</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>{progress}%</Text>
                  </View>
                  <Text style={styles.stageText}>{currentStage}</Text>
                  <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {!isProcessing ? (
                  <>
                    <TouchableOpacity
                      style={[styles.button, styles.processButton]}
                      onPress={handleProcessVideo}
                      disabled={!!error || !selectedVideoUri?.uri}
                    >
                      <Text style={styles.buttonText}>Start Processing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={handleClose}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                  >
                    <Text style={styles.buttonText}>Cancel Processing</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    padding: 0,
    backgroundColor: '#667eea',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  statusSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  errorSection: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.5)',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
  },
  progressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    minWidth: 40,
  },
  stageText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  spinner: {
    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  processButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default VideoProcessor;