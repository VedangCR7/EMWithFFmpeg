import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { VideoComposerComponent } from '../components/VideoComposerComponent';
import Video from 'react-native-video';

interface VideoEditorWithComposerProps {
  selectedVideo: {
    uri: string;
    title?: string;
    description?: string;
  };
}

export const VideoEditorWithComposer: React.FC<VideoEditorWithComposerProps> = ({
  selectedVideo,
}) => {
  const [composedVideoPath, setComposedVideoPath] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleVideoComposed = useCallback((outputPath: string) => {
    console.log('✅ Video composed successfully:', outputPath);
    setComposedVideoPath(outputPath);
    setShowPreview(true);
    Alert.alert('Success', 'Video has been processed successfully!');
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('❌ Video composition error:', error);
    Alert.alert('Error', `Video processing failed: ${error}`);
  }, []);

  const handleBackToEditor = useCallback(() => {
    setShowPreview(false);
    setComposedVideoPath(null);
  }, []);

  if (showPreview && composedVideoPath) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToEditor}>
            <Text style={styles.backButtonText}>← Back to Editor</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Processed Video Preview</Text>
        </View>
        
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: `file://${composedVideoPath}` }}
            style={styles.video}
            resizeMode="cover"
            controls={true}
            repeat={true}
            onError={(error) => {
              console.error('Video playback error:', error);
              Alert.alert('Playback Error', 'Failed to play the processed video');
            }}
            onLoad={() => {
              console.log('✅ Processed video loaded successfully');
            }}
          />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>✅ Video processed with native compositing</Text>
          <Text style={styles.infoText}>📁 Output: {composedVideoPath}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Video Editor</Text>
        <Text style={styles.subtitle}>Apply effects and overlays</Text>
      </View>
      
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>Selected Video:</Text>
        <Text style={styles.videoPath}>{selectedVideo.title || 'Untitled'}</Text>
        <Text style={styles.videoUri}>{selectedVideo.uri}</Text>
      </View>
      
      <VideoComposerComponent
        sourceVideoPath={selectedVideo.uri}
        onVideoComposed={handleVideoComposed}
        onError={handleError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 4,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  videoInfo: {
    padding: 16,
    backgroundColor: '#ffffff',
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  videoPath: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 2,
  },
  videoUri: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  videoContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#d4edda',
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  infoText: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 4,
  },
});

