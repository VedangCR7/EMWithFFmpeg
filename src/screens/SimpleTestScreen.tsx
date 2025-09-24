import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SimpleTestScreen: React.FC = () => {
  console.log('SimpleTestScreen: Rendering test screen');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>SIMPLE TEST SCREEN</Text>
      <Text style={styles.subtext}>If you can see this, navigation is working!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: 'white',
  },
});

export default SimpleTestScreen; 