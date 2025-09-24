import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import VideoComposer, { OverlayConfig, ComposeVideoResult } from '../services/VideoComposer';

interface VideoComposerComponentProps {
  sourceVideoPath: string;
  onVideoComposed: (outputPath: string) => void;
  onError: (error: string) => void;
}

export const VideoComposerComponent: React.FC<VideoComposerComponentProps> = ({
  sourceVideoPath,
  onVideoComposed,
  onError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const composeVideo = useCallback(async (overlayConfig: OverlayConfig) => {
    if (!sourceVideoPath) {
      onError('No source video selected');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('🎬 Starting video composition...');
      console.log('📹 Source path:', sourceVideoPath);
      console.log('🎨 Overlay config:', overlayConfig);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result: ComposeVideoResult = await VideoComposer.composeVideo(
        sourceVideoPath,
        overlayConfig
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        console.log('✅ Video composition completed:', result.outputPath);
        onVideoComposed(result.outputPath);
      } else {
        throw new Error('Video composition failed');
      }

    } catch (error) {
      console.error('❌ Video composition error:', error);
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [sourceVideoPath, onVideoComposed, onError]);

  const handleWatermark = useCallback(() => {
    composeVideo({
      type: 'watermark',
      color: '#FFFFFF',
    });
  }, [composeVideo]);

  const handleFrame = useCallback(() => {
    composeVideo({
      type: 'frame',
      color: '#FFD700',
    });
  }, [composeVideo]);

  const handleFilter = useCallback(() => {
    composeVideo({
      type: 'filter',
      color: '#FF6B6B',
    });
  }, [composeVideo]);

  const handleImageOverlay = useCallback(() => {
    composeVideo({
      type: 'image',
      imagePath: 'path/to/image.png', // In a real app, this would come from image picker
    });
  }, [composeVideo]);

  if (isProcessing) {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.processingText}>Processing Video...</Text>
        <Text style={styles.progressText}>{progress}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Effects</Text>
      <Text style={styles.subtitle}>Apply overlays and effects to your video</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleWatermark}>
          <Text style={styles.buttonText}>Add Watermark</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleFrame}>
          <Text style={styles.buttonText}>Add Frame</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleFilter}>
          <Text style={styles.buttonText}>Apply Filter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleImageOverlay}>
          <Text style={styles.buttonText}>Add Image Overlay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  processingContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
});

