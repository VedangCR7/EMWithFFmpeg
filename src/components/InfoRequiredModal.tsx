import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface InfoRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  fieldName: string;
}

const InfoRequiredModal: React.FC<InfoRequiredModalProps> = ({ visible, onClose, fieldName }) => {
  const { theme, isDarkMode } = useTheme();

  const getResponsiveStyles = () => {
    const isSmallScreen = screenWidth < 375;
    const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
    const isLargeScreen = screenWidth >= 414;

    const modalWidth = isSmallScreen ? '90%' : isMediumScreen ? '85%' : '80%';
    const padding = isSmallScreen ? 16 : isMediumScreen ? 20 : 24;
    const titleSize = isSmallScreen ? 16 : isMediumScreen ? 17 : 18;
    const messageSize = isSmallScreen ? 13 : isMediumScreen ? 14 : 15;
    const buttonPadding = isSmallScreen ? 10 : isMediumScreen ? 12 : 14;
    const buttonHorizontalPadding = isSmallScreen ? 14 : isMediumScreen ? 16 : 18;

    return {
      modalWidth,
      padding,
      titleSize,
      messageSize,
      buttonPadding,
      buttonHorizontalPadding,
    };
  };

  const responsive = getResponsiveStyles();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: responsive.modalWidth === '90%' ? screenWidth * 0.9 : 
             responsive.modalWidth === '85%' ? screenWidth * 0.85 : 
             responsive.modalWidth === '80%' ? screenWidth * 0.8 : 340,
      maxWidth: 400,
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: 12,
      padding: responsive.padding,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: isDarkMode ? 0.3 : 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    title: {
      fontSize: responsive.titleSize,
      fontWeight: '600',
      color: theme?.colors?.text || '#333333',
      marginBottom: 10,
      textAlign: 'center',
    },
    message: {
      fontSize: responsive.messageSize,
      color: theme?.colors?.textSecondary || '#555555',
      marginBottom: 20,
      lineHeight: responsive.messageSize * 1.4,
      textAlign: 'center',
    },
    buttonContainer: {
      alignItems: 'center',
    },
    button: {
      backgroundColor: theme?.colors?.primary || '#667eea',
      paddingVertical: responsive.buttonPadding,
      paddingHorizontal: responsive.buttonHorizontalPadding,
      borderRadius: 8,
      minWidth: 80,
    },
    buttonText: {
      color: '#ffffff',
      fontWeight: '500',
      fontSize: responsive.messageSize,
      textAlign: 'center',
    },
  });

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Information Required</Text>
          
          <Text style={styles.message}>
            Please update {fieldName} from your Business Profile to use this feature.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InfoRequiredModal;
