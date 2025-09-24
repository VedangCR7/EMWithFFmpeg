import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

class NotificationService {
  // Request permission for notifications
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }

      return enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Get FCM token
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Listen to token refresh
  onTokenRefresh(callback: (token: string) => void) {
    return messaging().onTokenRefresh(callback);
  }

  // Handle foreground messages
  onMessage(callback: (message: any) => void) {
    return messaging().onMessage(callback);
  }

  // Handle background messages
  setBackgroundMessageHandler(handler: (message: any) => Promise<void>) {
    messaging().setBackgroundMessageHandler(handler);
  }

  // Handle notification open
  onNotificationOpenedApp(callback: (message: any) => void) {
    return messaging().onNotificationOpenedApp(callback);
  }

  // Get initial notification
  async getInitialNotification(): Promise<any> {
    try {
      const message = await messaging().getInitialNotification();
      return message;
    } catch (error) {
      console.error('Error getting initial notification:', error);
      return null;
    }
  }

  // Subscribe to topic
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  }

  // Unsubscribe from topic
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
    }
  }
}

export default new NotificationService(); 