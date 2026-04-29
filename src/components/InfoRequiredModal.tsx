import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

interface InfoRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  fieldName: string;
  onUpdate?: () => void; // Optional custom update handler
}

const InfoRequiredModal: React.FC<InfoRequiredModalProps> = ({ visible, onClose, fieldName, onUpdate }) => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();

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
      backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
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
      shadowColor: isDarkMode ? 'rgba(0,0,0,0.8)' : '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: isDarkMode ? 0.4 : 0.2,
      shadowRadius: 8,
      elevation: isDarkMode ? 12 : 8,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: theme?.colors?.border || 'rgba(255,255,255,0.1)',
    },
    title: {
      fontSize: responsive.titleSize,
      fontWeight: '600',
      color: theme?.colors?.text || (isDarkMode ? '#ffffff' : '#333333'),
      marginBottom: 10,
      textAlign: 'center',
    },
    message: {
      fontSize: responsive.messageSize,
      color: theme?.colors?.textSecondary || (isDarkMode ? '#cccccc' : '#555555'),
      marginBottom: 20,
      lineHeight: responsive.messageSize * 1.4,
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    buttonWrapper: {
      flex: 1,
    },
    button: {
      backgroundColor: theme?.colors?.primary || (isDarkMode ? '#7c3aed' : '#667eea'),
      paddingVertical: responsive.buttonPadding,
      paddingHorizontal: responsive.buttonHorizontalPadding,
      borderRadius: 8,
      shadowColor: isDarkMode ? 'rgba(124,58,237,0.3)' : 'rgba(102,126,234,0.3)',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    updateButton: {
      backgroundColor: isDarkMode ? '#10b981' : '#059669',
      paddingVertical: responsive.buttonPadding,
      paddingHorizontal: responsive.buttonHorizontalPadding,
      borderRadius: 8,
      shadowColor: isDarkMode ? 'rgba(16,185,129,0.3)' : 'rgba(5,150,105,0.3)',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
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
            <View style={styles.buttonWrapper}>
              <TouchableOpacity style={styles.button} onPress={onClose}>
                <Text style={styles.buttonText}>Got it</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonWrapper}>
              <TouchableOpacity 
                style={styles.updateButton} 
                onPress={() => {
                  // Close modal first
                  onClose();
                  // Navigate to BusinessProfilesScreen
                  if (onUpdate) {
                    onUpdate();
                  } else {
                    navigation.navigate('BusinessProfiles' as any);
                  }
                }}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InfoRequiredModal;
