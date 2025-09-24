import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import authService from '../services/auth';

interface DebugInfoProps {
  isAuthenticated: boolean | null;
  isLoading: boolean;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ isAuthenticated, isLoading }) => {
  const currentUser = authService.getCurrentUser();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Info</Text>
      <Text style={styles.text}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>Current User: {currentUser ? currentUser.uid : 'None'}</Text>
      <Text style={styles.text}>User Email: {currentUser?.email || 'None'}</Text>
      <Text style={styles.text}>Expected Route: {isAuthenticated ? 'MainApp' : 'Login'}</Text>
      <Text style={styles.text}>Time: {new Date().toLocaleTimeString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
});

export default DebugInfo; 