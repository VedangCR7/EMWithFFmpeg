import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import authService from '../services/auth';
import { useSubscription } from '../contexts/SubscriptionContext';
import { navigationRef } from './NavigationService';
import logger from '../utils/logger';
import { RootStackParamList } from './types';
import TabNavigator from './TabNavigator';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyResetCodeScreen from '../screens/VerifyResetCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { refreshSubscription, refreshTransactions } = useSubscription();

  useEffect(() => {
    logger.log('🚀 AppNavigator: Starting initialization');
    let authStateReceived = false;
    let authUser: any = null;
    const startTime = Date.now();
    const MIN_SPLASH_TIME = 4000;

    const timeout = setTimeout(() => {
      if (!authStateReceived) {
        logger.warn('⚠️ AppNavigator: Timeout reached without auth state - showing login');
        setIsLoading(false);
        setIsAuthenticated(false);
      }
    }, 5000);

    const unsubscribe = authService.onAuthStateChanged((user) => {
      authStateReceived = true;
      authUser = user;
      clearTimeout(timeout);

      logger.log('AppNavigator: Auth state changed:', user ? ' User logged in' : ' User logged out');

      // NAVIGATION SAFETY: Only consider user authenticated if they have valid data
      const isValidUser = user && user.email && user.id;

      if (isValidUser) {
        refreshSubscription().catch(e => logger.error(' Error preloading subscription:', e));
        refreshTransactions().catch(e => logger.error(' Error preloading transactions:', e));
      }

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_SPLASH_TIME - elapsedTime);

      setTimeout(() => {
        setIsAuthenticated(!!isValidUser);
        setIsLoading(false);
      }, remainingTime);
    });

    authService.initialize().catch((error) => {
      logger.error(' AppNavigator: Error initializing auth service:', error);
      authStateReceived = true;
      clearTimeout(timeout);
      setTimeout(() => {
        setIsLoading(false);
        setIsAuthenticated(false);
      }, 2000);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator>
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        {isAuthenticated ? (
          <Stack.Screen name="MainApp" component={TabNavigator} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Registration" component={RegistrationScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="VerifyResetCode" component={VerifyResetCodeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} options={{ headerShown: false }} />
          </>
        )}
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;