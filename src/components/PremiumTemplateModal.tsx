import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;

export interface PremiumTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  selectedTemplate?: { thumbnail: string; name: string; category: string } | null;
}

const PremiumTemplateModal: React.FC<PremiumTemplateModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  selectedTemplate,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ScrollView 
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.upgradeModalContent, { backgroundColor: '#ffffff' }]}> 
            <View style={styles.premiumBadge}>
              <Icon name="star" size={isSmallScreen ? 14 : 16} color="#DAA520" />
              <Text style={[styles.premiumBadgeText, { color: '#B8860B' }]}>PREMIUM</Text>
            </View>

            <View style={styles.upgradeModalHeader}>
              <Text style={[styles.upgradeModalTitle, { color: '#1a1a1a' }]}>Unlock Premium Template</Text>
              <Text style={[styles.upgradeModalSubtitle, { color: '#666666' }]}>Get access to this exclusive template and all premium features</Text>
            </View>

            {selectedTemplate && (
              <View style={styles.templatePreview}>
                <Image 
                  source={{ uri: selectedTemplate.thumbnail }} 
                  style={styles.templatePreviewImage}
                  resizeMode="cover"
                />
                <View style={styles.templatePreviewOverlay}>
                  <Text style={styles.templatePreviewTitle}>{selectedTemplate.name}</Text>
                  <Text style={styles.templatePreviewDescription}>{selectedTemplate.category}</Text>
                </View>
              </View>
            )}

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={isSmallScreen ? 14 : 16} color="#4CAF50" />
                <Text style={[styles.featureText, { color: '#1a1a1a' }]}>Access to all premium templates</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={isSmallScreen ? 14 : 16} color="#4CAF50" />
                <Text style={[styles.featureText, { color: '#1a1a1a' }]}>No watermarks on final designs</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={isSmallScreen ? 14 : 16} color="#4CAF50" />
                <Text style={[styles.featureText, { color: '#1a1a1a' }]}>Priority customer support</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={isSmallScreen ? 14 : 16} color="#4CAF50" />
                <Text style={[styles.featureText, { color: '#1a1a1a' }]}>Advanced editing features</Text>
              </View>
            </View>

            <View style={styles.upgradeModalFooter}>
              <TouchableOpacity 
                style={[styles.cancelButton, { borderColor: '#cccccc' }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: '#666666' }]}>Maybe Later</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={onUpgrade}
              >
                <LinearGradient
                  colors={[ '#FF6B6B', '#FF8E53' ]}
                  style={styles.upgradeButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name="star" size={isSmallScreen ? 12 : 14} color="#ffffff" style={styles.upgradeButtonIcon} />
                  <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default PremiumTemplateModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    maxHeight: screenHeight * 0.85,
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  upgradeModalContent: {
    margin: isSmallScreen ? 10 : 16,
    borderRadius: 16,
    padding: isSmallScreen ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 16,
    maxHeight: screenHeight * 0.75,
    minHeight: screenHeight * 0.35,
    width: '100%',
    maxWidth: screenWidth - (isSmallScreen ? 20 : 32),
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: isSmallScreen ? 8 : 12,
    paddingVertical: isSmallScreen ? 4 : 6,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: isSmallScreen ? 10 : 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumBadgeText: {
    fontSize: isSmallScreen ? 8 : 10,
    fontWeight: '700',
    color: '#B8860B',
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  upgradeModalHeader: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  upgradeModalTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: isSmallScreen ? 4 : 6,
    paddingHorizontal: isSmallScreen ? 4 : 0,
    color: '#1a1a1a',
  },
  upgradeModalSubtitle: {
    fontSize: isSmallScreen ? 11 : 13,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 16 : 18,
    paddingHorizontal: isSmallScreen ? 4 : 0,
    color: '#666666',
  },
  templatePreview: {
    height: isSmallScreen ? 80 : 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: isSmallScreen ? 12 : 16,
    position: 'relative',
  },
  templatePreviewImage: {
    width: '100%',
    height: '100%',
  },
  templatePreviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: isSmallScreen ? 8 : 10,
  },
  templatePreviewTitle: {
    fontSize: isSmallScreen ? 11 : 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  templatePreviewDescription: {
    fontSize: isSmallScreen ? 9 : 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuresList: {
    marginBottom: isSmallScreen ? 12 : 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 6 : 8,
  },
  featureText: {
    fontSize: isSmallScreen ? 11 : 13,
    marginLeft: isSmallScreen ? 8 : 10,
    flex: 1,
    lineHeight: isSmallScreen ? 16 : 18,
    color: '#1a1a1a',
  },
  upgradeModalFooter: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: isSmallScreen ? 8 : 10,
    alignItems: 'stretch',
    width: '100%',
  },
  cancelButton: {
    flex: isSmallScreen ? undefined : 1,
    paddingVertical: isSmallScreen ? 10 : 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    maxWidth: '100%',
    borderColor: '#cccccc',
  },
  cancelButtonText: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
    color: '#666666',
  },
  upgradeButton: {
    flex: isSmallScreen ? undefined : 1,
    borderRadius: 10,
    overflow: 'hidden',
    minHeight: 40,
    maxWidth: '100%',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 10 : 12,
    minHeight: 40,
  },
  upgradeButtonIcon: {
    marginRight: isSmallScreen ? 4 : 6,
  },
  upgradeButtonText: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});

