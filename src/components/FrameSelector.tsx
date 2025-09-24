import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Frame } from '../data/frames';

const { width: screenWidth } = Dimensions.get('window');

interface FrameSelectorProps {
  frames: Frame[];
  selectedFrameId: string;
  onFrameSelect: (frame: Frame) => void;
}

const FrameSelector: React.FC<FrameSelectorProps> = ({
  frames,
  selectedFrameId,
  onFrameSelect,
}) => {


  const renderFrameItem = ({ item }: { item: Frame }) => {
    const isSelected = selectedFrameId === item.id;

    return (
      <TouchableOpacity
        style={[styles.frameItem, isSelected && styles.frameItemSelected]}
        onPress={() => onFrameSelect(item)}
      >
        <View style={styles.framePreview}>
          {/* Sample background for preview */}
          <View style={styles.framePreviewBackground} />
          {/* Frame image preview */}
          <Image
            source={item.background}
            style={styles.frameImagePreview}
            resizeMode="cover"
          />
          <View style={styles.frameOverlay}>
            {/* Show placeholder indicators */}
            {item.placeholders.map((placeholder, index) => (
              <View
                key={index}
                style={[
                  styles.placeholderIndicator,
                  {
                    left: placeholder.x * 0.3, // Scale down for preview
                    top: placeholder.y * 0.3,
                    width: placeholder.width ? placeholder.width * 0.3 : 20,
                    height: placeholder.height ? placeholder.height * 0.3 : 20,
                  },
                ]}
              />
            ))}
          </View>
        </View>
        <Text style={[styles.frameName, isSelected && styles.frameNameSelected]}>
          {item.name}
        </Text>
        <Text style={styles.frameCategory}>{item.category}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Frame</Text>
        <Text style={styles.subtitle}>Select a frame for your poster</Text>
      </View>
      
      {/* Frames List */}
      <FlatList
        data={frames}
        renderItem={renderFrameItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
  },
  listContent: {
    paddingHorizontal: 4,
  },
  frameItem: {
    alignItems: 'center',
    minWidth: 120,
    padding: 8,
    borderRadius: 12,
  },
  frameItemSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  framePreview: {
    width: 100,
    height: 140,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
    backgroundColor: '#f8f9fa',
  },
  framePreviewBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
  },
  frameImagePreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
  },
  frameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholderIndicator: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
  },
  frameName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 2,
  },
  frameNameSelected: {
    color: '#667eea',
    fontWeight: '700',
  },
  frameCategory: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  separator: {
    width: 12,
  },
});

export default FrameSelector;
