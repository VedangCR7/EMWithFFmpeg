import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import VideoOverlay, { VideoOverlayConfig, OverlayPosition } from '../services/VideoOverlay';

const VideoOverlayTest: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [overlayConfig, setOverlayConfig] = useState<VideoOverlayConfig>({
    type: 'text',
    value: 'Sample Text',
    position: { x: 960, y: 540 }, // Center of 1920x1080
    color: '#FFFFFF',
    size: 24,
  });
  const [customText, setCustomText] = useState('Sample Text');
  const [customColor, setCustomColor] = useState('#FFFFFF');
  const [customSize, setCustomSize] = useState('24');

  const testVideoOverlay = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('🧪 Testing VideoOverlay...');
      console.log('📹 Overlay config:', overlayConfig);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await VideoOverlay.addOverlay('demo_video', overlayConfig);

      clearInterval(progressInterval);
      setProgress(100);

      console.log('✅ VideoOverlay test successful:', result);
      Alert.alert(
        'Success!',
        `Video overlay processing completed!\nOutput: ${result}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('❌ VideoOverlay test failed:', error);
      Alert.alert(
        'Test Failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const changeOverlayType = (type: VideoOverlayConfig['type']) => {
    setOverlayConfig(prev => ({ ...prev, type }));
  };

  const changeColor = (color: string) => {
    setCustomColor(color);
    setOverlayConfig(prev => ({ ...prev, color }));
  };

  const changeSize = (size: string) => {
    setCustomSize(size);
    const sizeNum = parseInt(size) || 24;
    setOverlayConfig(prev => ({ ...prev, size: sizeNum }));
  };

  const changeText = (text: string) => {
    setCustomText(text);
    setOverlayConfig(prev => ({ ...prev, value: text }));
  };

  const changePosition = (field: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0;
    setOverlayConfig(prev => ({
      ...prev,
      position: {
        ...prev.position!,
        [field]: numValue,
      },
    }));
  };

  const presetPositions = [
    { name: 'Top Left', x: 100, y: 100 },
    { name: 'Top Right', x: 1820, y: 100 },
    { name: 'Center', x: 960, y: 540 },
    { name: 'Bottom Left', x: 100, y: 980 },
    { name: 'Bottom Right', x: 1820, y: 980 },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>VideoOverlay Test</Text>
      <Text style={styles.subtitle}>Test the native video overlay module</Text>

      <View style={styles.configContainer}>
        <Text style={styles.configTitle}>Overlay Configuration:</Text>
        
        {/* Overlay Type */}
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Type:</Text>
          <View style={styles.buttonRow}>
            {(['text', 'image', 'shape'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  overlayConfig.type === type && styles.optionButtonActive,
                ]}
                onPress={() => changeOverlayType(type)}
              >
                <Text style={[
                  styles.optionButtonText,
                  overlayConfig.type === type && styles.optionButtonTextActive,
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Text Input for Text Overlay */}
        {overlayConfig.type === 'text' && (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Text:</Text>
            <TextInput
              style={styles.textInput}
              value={customText}
              onChangeText={changeText}
              placeholder="Enter text"
            />
          </View>
        )}

        {/* Shape Type for Shape Overlay */}
        {overlayConfig.type === 'shape' && (
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Shape:</Text>
            <View style={styles.buttonRow}>
              {(['circle', 'rectangle', 'triangle'] as const).map((shape) => (
                <TouchableOpacity
                  key={shape}
                  style={[
                    styles.optionButton,
                    overlayConfig.value === shape && styles.optionButtonActive,
                  ]}
                  onPress={() => setOverlayConfig(prev => ({ ...prev, value: shape }))}
                >
                  <Text style={[
                    styles.optionButtonText,
                    overlayConfig.value === shape && styles.optionButtonTextActive,
                  ]}>
                    {shape.charAt(0).toUpperCase() + shape.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Color Selection */}
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Color:</Text>
          <View style={styles.buttonRow}>
            {['#FFFFFF', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FF9800'].map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  customColor === color && styles.colorButtonActive,
                  { backgroundColor: color }
                ]}
                onPress={() => changeColor(color)}
              />
            ))}
          </View>
        </View>

        {/* Size Input */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Size:</Text>
          <TextInput
            style={styles.textInput}
            value={customSize}
            onChangeText={changeSize}
            placeholder="24"
            keyboardType="numeric"
          />
        </View>

        {/* Position Presets */}
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Position Presets:</Text>
          <View style={styles.buttonRow}>
            {presetPositions.map((preset) => (
              <TouchableOpacity
                key={preset.name}
                style={styles.presetButton}
                onPress={() => setOverlayConfig(prev => ({
                  ...prev,
                  position: { x: preset.x, y: preset.y }
                }))}
              >
                <Text style={styles.presetButtonText}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Position */}
        <View style={styles.positionRow}>
          <View style={styles.positionInput}>
            <Text style={styles.inputLabel}>X:</Text>
            <TextInput
              style={styles.positionTextInput}
              value={overlayConfig.position?.x.toString() || '960'}
              onChangeText={(value) => changePosition('x', value)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.positionInput}>
            <Text style={styles.inputLabel}>Y:</Text>
            <TextInput
              style={styles.positionTextInput}
              value={overlayConfig.position?.y.toString() || '540'}
              onChangeText={(value) => changePosition('y', value)}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {isProcessing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>Processing Video...</Text>
          <Text style={styles.progressText}>{progress}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.testButton} onPress={testVideoOverlay}>
          <Text style={styles.testButtonText}>Test Video Overlay</Text>
        </TouchableOpacity>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Current Configuration:</Text>
        <Text style={styles.infoText}>Type: {overlayConfig.type}</Text>
        <Text style={styles.infoText}>Value: {overlayConfig.value}</Text>
        <Text style={styles.infoText}>Color: {overlayConfig.color}</Text>
        <Text style={styles.infoText}>Size: {overlayConfig.size}</Text>
        <Text style={styles.infoText}>Position: ({overlayConfig.position?.x}, {overlayConfig.position?.y})</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
  },
  configContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 16,
  },
  optionRow: {
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  colorButtonActive: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
    marginRight: 12,
    minWidth: 60,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  positionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  positionInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  presetButtonText: {
    fontSize: 11,
    color: '#495057',
    fontWeight: '500',
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginTop: 12,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 4,
  },
});

export default VideoOverlayTest;
