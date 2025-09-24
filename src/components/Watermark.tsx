import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate responsive values based on screen size
const getResponsiveValues = () => {
  // Base calculations on the smaller dimension to ensure it works on all orientations
  const baseDimension = Math.min(screenWidth, screenHeight);
  
  // Calculate responsive sizes
  const fontSize = Math.max(10, Math.min(16, baseDimension * 0.03));
  const paddingHorizontal = Math.max(8, Math.min(16, baseDimension * 0.02));
  const paddingVertical = Math.max(4, Math.min(8, baseDimension * 0.015));
  const borderRadius = Math.max(6, Math.min(12, baseDimension * 0.015));
  const borderWidth = Math.max(0.5, Math.min(1.5, baseDimension * 0.002));
  
  // Position calculations - adapt to screen size
  const bottomPosition = Math.max(10, Math.min(30, screenHeight * 0.02));
  const rightPosition = Math.max(10, Math.min(25, screenWidth * 0.02));
  
  return {
    fontSize,
    paddingHorizontal,
    paddingVertical,
    borderRadius,
    borderWidth,
    bottomPosition,
    rightPosition,
  };
};

interface WatermarkProps {
  isSubscribed: boolean;
  style?: any;
}

const Watermark: React.FC<WatermarkProps> = ({ isSubscribed, style }) => {
  // Don't render watermark if user is subscribed
  if (isSubscribed) {
    return null;
  }

  const responsiveValues = getResponsiveValues();

  return (
    <View style={[
      styles.watermarkContainer, 
      {
        bottom: responsiveValues.bottomPosition,
        right: responsiveValues.rightPosition,
      },
      style
    ]}>
      {/* Text Watermark */}
      <View style={[
        styles.textWatermark,
        {
          paddingHorizontal: responsiveValues.paddingHorizontal,
          paddingVertical: responsiveValues.paddingVertical,
          borderRadius: responsiveValues.borderRadius,
          borderWidth: responsiveValues.borderWidth,
        }
      ]}>
        <Text style={[
          styles.watermarkText,
          {
            fontSize: responsiveValues.fontSize,
          }
        ]}>
          Made with EventMarketers
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  watermarkContainer: {
    position: 'absolute',
    zIndex: 1000,
    // Remove fixed positioning - will be set dynamically
  },
  textWatermark: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Remove fixed padding and border radius - will be set dynamically
  },
  watermarkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    // Remove fixed fontSize - will be set dynamically
  },
});

export default Watermark;
