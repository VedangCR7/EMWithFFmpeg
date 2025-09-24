import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { getSafeAreaEdges, useNotchAwareInsets } from '../utils/notchUtils';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  backgroundColor?: string;
  useSafeArea?: boolean;
  screenType?: 'full' | 'top' | 'bottom' | 'none';
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  edges,
  style,
  backgroundColor,
  useSafeArea = true,
  screenType = 'full',
}) => {
  const insets = useNotchAwareInsets();
  
  // Use provided edges or get from screen type
  const safeAreaEdges = edges || getSafeAreaEdges(screenType);

  if (!useSafeArea) {
    return (
      <View style={[style, { backgroundColor }]}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={safeAreaEdges}
      style={[
        {
          flex: 1,
          backgroundColor,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
};

export default SafeAreaWrapper; 