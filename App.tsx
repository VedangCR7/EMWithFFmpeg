/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { LogBox, Text, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import FFmpegRuntimeDebugger from './src/services/FFmpegRuntimeDebugger';
import FFmpegVerificationService from './src/services/FFmpegVerificationService';

// Enable detailed logging for debugging
LogBox.ignoreAllLogs(false);

// Custom Error Boundary to catch JS crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.log("🔥 RN Crash Caught in getDerivedStateFromError:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.log("🔥 RN Crash Caught in componentDidCatch:", error, errorInfo);
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>🚨 App Crashed</Text>
          <Text style={styles.errorText}>
            Error: {this.state.error?.message || 'Unknown error'}
          </Text>
          <Text style={styles.errorDetails}>
            {this.state.error?.stack || 'No stack trace available'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  // Run FFmpeg verification on app startup
  useEffect(() => {
    const runFFmpegVerification = async () => {
      try {
        console.log("🚀 App started - Running FFmpeg 6.1.1 verification...");
        
        // First run the runtime debugger
        const debugResult = await FFmpegRuntimeDebugger.debugFFmpegRuntime();
        console.log("🎯 FFmpeg Runtime Debug Result:", debugResult);
        
        // Then run the verification service
        const verificationResult = await FFmpegVerificationService.verifyCustomFFmpeg();
        console.log("🎯 FFmpeg Verification Result:", verificationResult);
        
        // Log final status
        if (verificationResult.version.includes('6.1.1') && verificationResult.hasDrawtext) {
          console.log("🎉 SUCCESS: Custom FFmpeg 6.1.1 with drawtext is working!");
        } else {
          console.log("❌ FAILURE: Custom FFmpeg 6.1.1 is NOT working properly");
          console.log("❌ Current version:", verificationResult.version);
          console.log("❌ Drawtext available:", verificationResult.hasDrawtext);
        }
        
      } catch (error) {
        console.error("❌ FFmpeg verification failed on startup:", error);
      }
    };

    // Run verification after a short delay to ensure app is fully loaded
    const timer = setTimeout(runFFmpegVerification, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <SubscriptionProvider>
            <AppNavigator />
          </SubscriptionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 12,
    color: '#666',
    textAlign: 'left',
    fontFamily: 'monospace',
  },
});

export default App;
