import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;

export interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
  onConfirm?: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  type,
  title,
  message,
  onConfirm,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

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
          <View style={[styles.modalContent, { backgroundColor: '#ffffff' }]}>
            {/* Icon and Badge */}
            <View style={styles.iconContainer}>
              <View style={[styles.iconBadge, { 
                backgroundColor: type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' 
              }]}>
                <Icon 
                  name={type === 'success' ? 'check-circle' : 'error'} 
                  size={isSmallScreen ? 32 : 40} 
                  color={type === 'success' ? '#4CAF50' : '#F44336'} 
                />
              </View>
              <Text style={[styles.statusText, { 
                color: type === 'success' ? '#4CAF50' : '#F44336' 
              }]}>
                {type === 'success' ? 'SUCCESS' : 'ERROR'}
              </Text>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              <Text style={[styles.title, { color: '#1a1a1a' }]}>{title}</Text>
              <Text style={[styles.message, { color: '#666666' }]}>{message}</Text>
            </View>

            {/* Action Button */}
            <View style={styles.footerContainer}>
              <TouchableOpacity 
                style={[styles.confirmButton, type === 'success' ? styles.successButton : styles.errorButton]}
                onPress={handleConfirm}
              >
                <LinearGradient
                  colors={type === 'success' ? ['#4CAF50', '#45A049'] : ['#F44336', '#E53935']}
                  style={styles.confirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon 
                    name={type === 'success' ? 'check' : 'refresh'} 
                    size={isSmallScreen ? 16 : 18} 
                    color="#ffffff" 
                    style={styles.buttonIcon} 
                  />
                  <Text style={styles.confirmButtonText}>
                    {type === 'success' ? 'OK' : 'Try Again'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default FeedbackModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    maxHeight: screenHeight * 0.5,
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    margin: isSmallScreen ? 20 : 24,
    borderRadius: 16,
    padding: isSmallScreen ? 20 : 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 16,
    maxHeight: screenHeight * 0.4,
    minHeight: screenHeight * 0.2,
    width: '100%',
    maxWidth: screenWidth - (isSmallScreen ? 40 : 48),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 16 : 20,
  },
  iconBadge: {
    width: isSmallScreen ? 64 : 80,
    height: isSmallScreen ? 64 : 80,
    borderRadius: isSmallScreen ? 32 : 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  statusText: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 20 : 24,
  },
  title: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: isSmallScreen ? 8 : 12,
    paddingHorizontal: isSmallScreen ? 8 : 0,
  },
  message: {
    fontSize: isSmallScreen ? 12 : 14,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 20,
    paddingHorizontal: isSmallScreen ? 8 : 0,
  },
  footerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 200,
  },
  successButton: {
    // Additional success-specific styling if needed
  },
  errorButton: {
    // Additional error-specific styling if needed
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 12 : 14,
    paddingHorizontal: isSmallScreen ? 20 : 24,
  },
  buttonIcon: {
    marginRight: isSmallScreen ? 6 : 8,
  },
  confirmButtonText: {
    fontSize: isSmallScreen ? 13 : 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
