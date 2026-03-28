import React from 'react';
import { View, Modal, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DownloadedPoster } from '../services/downloadedPosters';

interface DownloadedImagePreviewProps {
  visible: boolean;
  selectedPoster: DownloadedPoster | null;
  onClose: () => void;
}

const DownloadedImagePreview: React.FC<DownloadedImagePreviewProps> = ({
  visible,
  selectedPoster,
  onClose,
}) => {
  if (!selectedPoster) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.previewModalOverlay}>
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Icon name="close" size={28} color="#ffffff" />
        </TouchableOpacity>

        {/* Image Preview */}
        <View style={styles.previewImageContainer}>
          {(selectedPoster.thumbnailUri || selectedPoster.imageUri) ? (
            <Image
              source={{ uri: selectedPoster.thumbnailUri || selectedPoster.imageUri }}
              style={styles.previewImage}
              resizeMode="contain"
              onError={() => {
                console.log("🖼️ [PREVIEW] Image cache missing, trying fallback");
                // Fallbacks can be handled internally via state if needed, but for now we maintain the original logic hook format.
              }}
              onLoad={() => {
                console.log(`✅ [PREVIEW] Image loaded for ${selectedPoster.id}`);
              }}
            />
          ) : (
            <View style={styles.previewImagePlaceholder}>
              <Icon name="image" size={80} color="#999" />
              <Text style={styles.previewPlaceholderText}>No Image Available</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
  },
  previewImageContainer: {
    width: '95%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlaceholderText: {
    color: '#999',
    marginTop: 10,
    fontSize: 16,
  },
});

export default DownloadedImagePreview;
