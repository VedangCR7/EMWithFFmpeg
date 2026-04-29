import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { DefaultTheme } from '@react-navigation/native';
import { MainStackParamList } from './types';
import MainTabNavigator from './MainTabNavigator';
import PosterEditorScreen from '../screens/PosterEditorScreen';
import PosterPlayerScreen from '../screens/PosterPlayerScreen';
import MyBusinessPosterPlayerScreen from '../screens/MyBusinessPosterPlayerScreen';
import PosterPreviewScreen from '../screens/PosterPreviewScreen';
import VideoEditorScreen from '../screens/VideoEditorScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import VideoPreviewScreen from '../screens/VideoPreviewScreen';
import BusinessProfilesScreen from '../screens/BusinessProfilesScreen';
import EventsScreen from '../screens/EventsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import GreetingTemplatesScreen from '../screens/GreetingTemplatesScreen';
import GreetingEditorScreen from '../screens/GreetingEditorScreen';
import MyPostersScreen from '../screens/MyPostersScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import TodaysPickScreen from '../screens/TodaysPickScreen';
import { useTheme } from '../context/ThemeContext';

const MainStack = createStackNavigator<MainStackParamList>();

const TabNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <MainStack.Navigator
      screenOptions={{
        cardStyle: { backgroundColor: theme.colors.gradient[0] || theme.colors.background },
      }}
    >
      <MainStack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <MainStack.Screen name="PosterEditor" component={PosterEditorScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="PosterPlayer" component={PosterPlayerScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="MyBusinessPosterPlayer" component={MyBusinessPosterPlayerScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="PosterPreview" component={PosterPreviewScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="VideoEditor" component={VideoEditorScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="VideoPreview" component={VideoPreviewScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="BusinessProfiles" component={BusinessProfilesScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="Events" component={EventsScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="Subscription" component={SubscriptionScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="GreetingTemplates" component={GreetingTemplatesScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="GreetingEditor" component={GreetingEditorScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="MyPosters" component={MyPostersScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="AboutUs" component={AboutUsScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="FeedbackScreen" component={FeedbackScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="TodaysPick" component={TodaysPickScreen} options={{ headerShown: false }} />
    </MainStack.Navigator>
  );
};

export default TabNavigator;
