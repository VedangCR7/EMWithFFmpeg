import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { frames } from '../data/frames';
import { mapBusinessProfileToFrameContent, generateLayersFromFrame } from '../utils/frameUtils';

// Mock business profile for testing
const mockBusinessProfile = {
  id: 'test-profile',
  name: 'Test Company',
  description: 'A test company for frame demonstration',
  phone: '+1 (555) 123-4567',
  email: 'contact@testcompany.com',
  website: 'www.testcompany.com',
  address: '123 Test Street, Test City, TC 12345',
  category: 'Technology',
  services: ['Web Development', 'Mobile Apps', 'Consulting'],
  companyLogo: 'https://via.placeholder.com/100x100/667eea/ffffff?text=LOGO',
  logo: 'https://via.placeholder.com/100x100/667eea/ffffff?text=LOGO',
  workingHours: {
    monday: { open: '09:00', close: '17:00', isOpen: true },
    tuesday: { open: '09:00', close: '17:00', isOpen: true },
    wednesday: { open: '09:00', close: '17:00', isOpen: true },
    thursday: { open: '09:00', close: '17:00', isOpen: true },
    friday: { open: '09:00', close: '17:00', isOpen: true },
    saturday: { open: '10:00', close: '15:00', isOpen: true },
    sunday: { open: '00:00', close: '00:00', isOpen: false },
  },
  rating: 4.5,
  reviewCount: 25,
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const FrameTestComponent: React.FC = () => {
  const [selectedFrame, setSelectedFrame] = useState<string>('');
  const [generatedLayers, setGeneratedLayers] = useState<any[]>([]);

  const testFrameApplication = (frameId: string) => {
    const frame = frames.find(f => f.id === frameId);
    if (!frame) {
      Alert.alert('Error', 'Frame not found');
      return;
    }

    // Map business profile to frame content
    const content = mapBusinessProfileToFrameContent(mockBusinessProfile);
    
    // Generate layers from frame
    const layers = generateLayersFromFrame(frame, content, 400, 600);
    
    setSelectedFrame(frameId);
    setGeneratedLayers(layers);
    
    Alert.alert(
      'Frame Applied Successfully!',
      `Frame: ${frame.name}\nGenerated ${layers.length} layers:\n${layers.map(layer => `- ${layer.fieldType}: ${layer.content.substring(0, 20)}...`).join('\n')}`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Frame System Test</Text>
      <Text style={styles.subtitle}>Tap a frame to test the system</Text>
      
      <View style={styles.frameGrid}>
        {frames.map((frame) => (
          <TouchableOpacity
            key={frame.id}
            style={[
              styles.frameButton,
              selectedFrame === frame.id && styles.frameButtonSelected
            ]}
            onPress={() => testFrameApplication(frame.id)}
          >
            <Text style={styles.frameButtonText}>{frame.name}</Text>
            <Text style={styles.frameButtonCategory}>{frame.category}</Text>
            <Text style={styles.frameButtonPlaceholders}>
              {frame.placeholders.length} placeholders
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {selectedFrame && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>Last Applied Frame: {selectedFrame}</Text>
          <Text style={styles.resultSubtitle}>
            Generated {generatedLayers.length} layers
          </Text>
          <View style={styles.layerList}>
            {generatedLayers.map((layer, index) => (
              <View key={index} style={styles.layerItem}>
                <Text style={styles.layerType}>{layer.type}</Text>
                <Text style={styles.layerField}>{layer.fieldType}</Text>
                <Text style={styles.layerContent} numberOfLines={1}>
                  {layer.content}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  frameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  frameButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  frameButtonSelected: {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  frameButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  frameButtonCategory: {
    fontSize: 12,
    color: '#667eea',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  frameButtonPlaceholders: {
    fontSize: 10,
    color: '#666',
  },
  resultSection: {
    marginTop: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  layerList: {
    maxHeight: 200,
  },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  layerType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    width: 50,
  },
  layerField: {
    fontSize: 12,
    color: '#666',
    width: 80,
    marginLeft: 8,
  },
  layerContent: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
});

export default FrameTestComponent;
