import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Responsive design helpers
const moderateScale = (size: number) => size; // Simplified scaling for consistency

interface SuccessModalProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  message,
  onClose,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => {}} // Prevent closing when tapping inside modal
        >
          <View style={[styles.successModalContainer, { 
            backgroundColor: theme.colors.surface,
            borderRadius: moderateScale(16),
            padding: moderateScale(16),
          }]}>
            <View style={[styles.successModalHeader, {
              marginBottom: moderateScale(10),
            }]}>
              <View style={[styles.successIconContainer, { 
                backgroundColor: `${theme.colors.primary}20`,
                width: moderateScale(42),
                height: moderateScale(42),
                borderRadius: moderateScale(21),
                marginBottom: moderateScale(6),
              }]}>
                <Icon name="check-circle" size={22} color={theme.colors.primary} />
              </View>
              <Text 
                style={[styles.successModalTitle, { 
                  color: theme.colors.text,
                  fontSize: moderateScale(14),
                }]}
              >
                Success
              </Text>
              <TouchableOpacity 
                style={[styles.closeModalButton, { 
                  backgroundColor: theme.colors.inputBackground,
                  width: moderateScale(24),
                  height: moderateScale(24),
                  borderRadius: moderateScale(12),
                  top: moderateScale(-5),
                  right: moderateScale(-5),
                }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Icon name="close" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.successModalContent, {
              marginBottom: moderateScale(12),
            }]}>
              <Text style={[styles.successModalMessage, { 
                color: theme.colors.text,
                fontSize: moderateScale(12),
                lineHeight: moderateScale(16),
              }]}>
                {message}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.successModalButton, { 
                backgroundColor: theme.colors.primary,
                paddingVertical: moderateScale(9),
                borderRadius: moderateScale(10),
              }]}
              onPress={onClose}
            >
              <Text style={[styles.successModalButtonText, {
                fontSize: moderateScale(12),
              }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContainer: {
    width: screenWidth * 0.88,
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(3),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(6),
    elevation: moderateScale(6),
  },
  successModalHeader: {
    alignItems: 'center',
    marginBottom: moderateScale(12),
    position: 'relative',
  },
  successIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  successModalTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    marginBottom: moderateScale(14),
  },
  successModalMessage: {
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  successModalButton: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(3),
    elevation: moderateScale(2),
  },
  successModalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default SuccessModal;
