import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSubscription } from '../contexts/SubscriptionContext';
import Watermark from './Watermark';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate responsive values for demo
const getResponsiveValues = () => {
  const baseDimension = Math.min(screenWidth, screenHeight);
  
  return {
    headerPaddingTop: Math.max(40, Math.min(60, screenHeight * 0.06)),
    headerTitleSize: Math.max(18, Math.min(24, baseDimension * 0.045)),
    statusTitleSize: Math.max(16, Math.min(20, baseDimension * 0.04)),
    statusTextSize: Math.max(14, Math.min(18, baseDimension * 0.035)),
    posterWidth: Math.max(screenWidth * 0.7, Math.min(screenWidth * 0.9, screenWidth * 0.8)),
    posterHeight: Math.max(screenHeight * 0.3, Math.min(screenHeight * 0.5, screenHeight * 0.4)),
    posterTitleSize: Math.max(24, Math.min(32, baseDimension * 0.05)),
    posterSubtitleSize: Math.max(16, Math.min(20, baseDimension * 0.035)),
    posterDescriptionSize: Math.max(12, Math.min(16, baseDimension * 0.03)),
    instructionTitleSize: Math.max(14, Math.min(18, baseDimension * 0.035)),
    instructionTextSize: Math.max(12, Math.min(16, baseDimension * 0.03)),
    toggleButtonTextSize: Math.max(14, Math.min(18, baseDimension * 0.035)),
  };
};

const WatermarkDemo: React.FC = () => {
  const { isSubscribed, setIsSubscribed } = useSubscription();
  const responsiveValues = getResponsiveValues();

  const toggleSubscription = () => {
    setIsSubscribed(!isSubscribed);
    Alert.alert(
      isSubscribed ? 'Subscription Removed' : 'Subscription Added',
      isSubscribed 
        ? 'Watermark will now appear on your posters.' 
        : 'Watermark has been removed from your posters.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={[styles.header, { paddingTop: responsiveValues.headerPaddingTop }]}>
        <Text style={[styles.headerTitle, { fontSize: responsiveValues.headerTitleSize }]}>Watermark Demo</Text>
        <TouchableOpacity style={styles.subscriptionToggle} onPress={toggleSubscription}>
          <Icon 
            name={isSubscribed ? "verified" : "remove-circle"} 
            size={Math.max(20, Math.min(28, screenWidth * 0.06))} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* Subscription Status */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusTitle, { fontSize: responsiveValues.statusTitleSize }]}>Subscription Status</Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { fontSize: responsiveValues.statusTextSize }]}>Active:</Text>
          <Text style={[styles.statusValue, { fontSize: responsiveValues.statusTextSize, color: isSubscribed ? '#22c55e' : '#ef4444' }]}>
            {isSubscribed ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { fontSize: responsiveValues.statusTextSize }]}>Watermark:</Text>
          <Text style={[styles.statusValue, { fontSize: responsiveValues.statusTextSize, color: isSubscribed ? '#ef4444' : '#22c55e' }]}>
            {isSubscribed ? 'Hidden' : 'Visible'}
          </Text>
        </View>
      </View>

      {/* Demo Poster */}
      <View style={styles.posterContainer}>
        <View style={[styles.poster, { width: responsiveValues.posterWidth, height: responsiveValues.posterHeight }]}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.posterBackground}
          >
            <Text style={[styles.posterTitle, { fontSize: responsiveValues.posterTitleSize }]}>Sample Event</Text>
            <Text style={[styles.posterSubtitle, { fontSize: responsiveValues.posterSubtitleSize }]}>December 25, 2024</Text>
            <Text style={[styles.posterDescription, { fontSize: responsiveValues.posterDescriptionSize }]}>
              Join us for an amazing event with great speakers and networking opportunities.
            </Text>
            
            {/* Watermark Component */}
            <Watermark isSubscribed={isSubscribed} />
          </LinearGradient>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={[styles.instructionsTitle, { fontSize: responsiveValues.instructionTitleSize }]}>How it works:</Text>
        <Text style={[styles.instructionText, { fontSize: responsiveValues.instructionTextSize }]}>
          • When subscription is <Text style={styles.highlight}>inactive</Text>, watermark appears
        </Text>
        <Text style={[styles.instructionText, { fontSize: responsiveValues.instructionTextSize }]}>
          • When subscription is <Text style={styles.highlight}>active</Text>, watermark is hidden
        </Text>
        <Text style={[styles.instructionText, { fontSize: responsiveValues.instructionTextSize }]}>
          • Watermark is included in exported images
        </Text>
        <Text style={[styles.instructionText, { fontSize: responsiveValues.instructionTextSize }]}>
          • Responsive design adapts to screen size
        </Text>
      </View>

      {/* Toggle Button */}
      <TouchableOpacity style={styles.toggleButton} onPress={toggleSubscription}>
        <LinearGradient
          colors={isSubscribed ? ['#ef4444', '#dc2626'] : ['#22c55e', '#16a34a']}
          style={styles.toggleButtonGradient}
        >
          <Icon 
            name={isSubscribed ? "remove-circle" : "verified"} 
            size={Math.max(18, Math.min(24, screenWidth * 0.05))} 
            color="#ffffff" 
          />
          <Text style={[styles.toggleButtonText, { fontSize: responsiveValues.toggleButtonTextSize }]}>
            {isSubscribed ? 'Remove Subscription' : 'Activate Subscription'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    // paddingTop will be set dynamically
  },
  headerTitle: {
    fontWeight: '700',
    color: '#ffffff',
    // fontSize will be set dynamically
  },
  subscriptionToggle: {
    padding: 8,
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    // fontSize will be set dynamically
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#666666',
    // fontSize will be set dynamically
  },
  statusValue: {
    fontWeight: '600',
    // fontSize will be set dynamically
  },
  posterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  poster: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    // width and height will be set dynamically
  },
  posterBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  posterTitle: {
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    // fontSize will be set dynamically
  },
  posterSubtitle: {
    color: '#ffffff',
    marginBottom: 16,
    opacity: 0.9,
    // fontSize will be set dynamically
  },
  posterDescription: {
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
    // fontSize will be set dynamically
  },
  instructionsContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    // fontSize will be set dynamically
  },
  instructionText: {
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
    // fontSize will be set dynamically
  },
  highlight: {
    fontWeight: '600',
    color: '#667eea',
  },
  toggleButton: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  toggleButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
    // fontSize will be set dynamically
  },
});

export default WatermarkDemo;
