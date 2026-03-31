import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PaymentErrorModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const PaymentErrorModal: React.FC<PaymentErrorModalProps> = ({
  visible,
  onClose,
  title,
  message,
}) => {
  const { theme } = useTheme();

  // Responsive design helpers
  const isUltraSmallScreen = screenWidth < 320;
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth < 414;
  const isLargeScreen = screenWidth < 768;
  const isXLargeScreen = screenWidth >= 768;
  const isTablet = screenWidth >= 768;
  const isPhone = screenWidth < 768;

  // Responsive spacing
  const responsiveSpacing = (base: number) => {
    if (isUltraSmallScreen) return base * 0.7;
    if (isSmallScreen) return base * 0.85;
    if (isMediumScreen) return base * 0.95;
    if (isLargeScreen) return base;
    if (isXLargeScreen) return base * 1.1;
    return base;
  };

  // Responsive font size
  const responsiveFontSize = (base: number) => {
    if (isUltraSmallScreen) return base * 0.8;
    if (isSmallScreen) return base * 0.9;
    if (isMediumScreen) return base * 0.95;
    if (isLargeScreen) return base;
    if (isXLargeScreen) return base * 1.1;
    return base;
  };


  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorModalContainer: {
      width: screenWidth * 0.85,
      maxWidth: 400,
      borderRadius: 20,
      padding: screenWidth * 0.06,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      backgroundColor: theme.colors.surface,
    },
    errorModalHeader: {
      alignItems: 'center',
      marginBottom: screenHeight * 0.02,
      position: 'relative',
    },
    errorModalTitle: {
      fontSize: Math.min(screenWidth * 0.06, 24),
      fontWeight: '700',
      textAlign: 'center',
      color: theme.colors.text,
    },
    closeModalButton: {
      position: 'absolute',
      top: -screenHeight * 0.01,
      right: -screenWidth * 0.02,
      width: Math.min(screenWidth * 0.08, 32),
      height: Math.min(screenWidth * 0.08, 32),
      borderRadius: Math.min(screenWidth * 0.04, 16),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
    },
    errorModalContent: {
      marginBottom: screenHeight * 0.025,
    },
    errorModalMessage: {
      fontSize: Math.min(screenWidth * 0.04, 16),
      textAlign: 'center',
      lineHeight: Math.min(screenWidth * 0.06, 24),
      color: theme.colors.text,
    },
    errorModalButton: {
      paddingVertical: screenHeight * 0.018,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      backgroundColor: '#ff4444',
    },
    errorModalButtonText: {
      color: '#FFFFFF',
      fontSize: Math.min(screenWidth * 0.042, 17),
      fontWeight: '600',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <TouchableOpacity 
        style={dynamicStyles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => {}} // Prevent closing when tapping inside modal
        >
          <View style={dynamicStyles.errorModalContainer}>
            <View style={dynamicStyles.errorModalHeader}>
              <Text style={dynamicStyles.errorModalTitle}>
                {title}
              </Text>
              <TouchableOpacity 
                style={dynamicStyles.closeModalButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Icon 
                  name="close" 
                  size={Math.min(screenWidth * 0.06, 24)} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={dynamicStyles.errorModalContent}>
              <Text style={dynamicStyles.errorModalMessage}>
                {message}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={dynamicStyles.errorModalButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={dynamicStyles.errorModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default PaymentErrorModal;
