import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  DeviceEventEmitter,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TOKEN_EXPIRED_EVENT } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import authService from '../services/auth';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../navigation/NavigationService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TokenExpirationHandler: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const handleTokenExpiration = () => {
      console.log('🔴 Token expiration detected, showing modal');
      setShowModal(true);
    };

    // Listen for token expiration events using DeviceEventEmitter
    const subscription = DeviceEventEmitter.addListener(
      TOKEN_EXPIRED_EVENT,
      handleTokenExpiration
    );

    // Cleanup listener on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  const handleSignOut = async () => {
    setShowModal(false);
    
    // Sign out user only when they explicitly choose to
    await authService.signOut();
    
    // Navigate to login screen using navigation ref
    if (navigationRef.current) {
      navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    }
  };

  const handleContinue = () => {
    // Just dismiss the modal - user stays logged in
    // They can continue using the app, but may need to sign in again for API calls
    setShowModal(false);
  };

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleContinue}
      statusBarTranslucent={true}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleContinue}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => {}} // Prevent closing when tapping inside modal
        >
          <View style={[styles.errorModalContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.errorModalHeader}>
              <View style={[styles.errorIconContainer, { backgroundColor: '#ff980020' }]}>
                <Icon name="info-outline" size={Math.min(screenWidth * 0.08, 32)} color="#ff9800" />
              </View>
              <Text 
                style={[styles.errorModalTitle, { color: theme.colors.text }]}
              >
                Session Expired
              </Text>
            </View>
            
            <View style={styles.errorModalContent}>
              <Text style={[styles.errorModalMessage, { color: theme.colors.text }]}>
                Your session has expired. You can continue using the app, but you may need to sign in again for some features.
              </Text>
            </View>
            
            <View style={styles.errorModalButtons}>
              <TouchableOpacity 
                style={[styles.errorModalButton, styles.errorModalButtonSecondary, { 
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border || '#e0e0e0',
                }]}
                onPress={handleContinue}
              >
                <Text style={[styles.errorModalButtonText, { color: theme.colors.text }]}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.errorModalButton, { backgroundColor: '#ff4444' }]}
                onPress={handleSignOut}
              >
                <Text style={styles.errorModalButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
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
  },
  errorModalHeader: {
    alignItems: 'center',
    marginBottom: screenHeight * 0.02,
    position: 'relative',
  },
  errorIconContainer: {
    width: Math.min(screenWidth * 0.18, 72),
    height: Math.min(screenWidth * 0.18, 72),
    borderRadius: Math.min(screenWidth * 0.09, 36),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: screenHeight * 0.015,
  },
  errorModalTitle: {
    fontSize: Math.min(screenWidth * 0.06, 24),
    fontWeight: '700',
    textAlign: 'center',
  },
  errorModalContent: {
    marginBottom: screenHeight * 0.025,
  },
  errorModalMessage: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.06, 24),
  },
  errorModalButtons: {
    flexDirection: 'row',
    gap: screenWidth * 0.03,
  },
  errorModalButton: {
    flex: 1,
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
  },
  errorModalButtonSecondary: {
    borderWidth: 1,
  },
  errorModalButtonText: {
    color: '#FFFFFF',
    fontSize: Math.min(screenWidth * 0.042, 17),
    fontWeight: '600',
  },
});

export default TokenExpirationHandler;

