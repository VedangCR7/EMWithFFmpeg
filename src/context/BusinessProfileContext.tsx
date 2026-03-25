import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessProfile } from '../services/businessProfile';
import authService from '../services/auth';
import { useSubscription } from '../contexts/SubscriptionContext';

interface BusinessProfileContextType {
  selectedBusinessProfile: BusinessProfile | null;
  setSelectedBusinessProfile: (profile: BusinessProfile | null) => Promise<void>;
  initializeSelectedProfile: (profiles: BusinessProfile[]) => Promise<void>;
  isSubscriptionActive: boolean;
  isLoading: boolean;
}

const BusinessProfileContext = createContext<BusinessProfileContextType | undefined>(undefined);

const SELECTED_PROFILE_KEY = '@selected_business_profile';
const SELECTED_PROFILE_UID_KEY = '@selected_business_profile_uid';

interface BusinessProfileProviderProps {
  children: ReactNode;
}

export const BusinessProfileProvider: React.FC<BusinessProfileProviderProps> = ({ children }) => {
  const [selectedBusinessProfile, setSelectedBusinessProfileState] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getBusinessProfileSubscription } = useSubscription();

  const isSubscriptionActive = useCallback((profileId: string | undefined): boolean => {
    if (!profileId) return false;
    const subscription = getBusinessProfileSubscription(profileId);
    return subscription?.status?.toLowerCase() === 'active';
  }, [getBusinessProfileSubscription]);

  // Clear cache helper
  const clearProfileCache = useCallback(async () => {
    try {
      setSelectedBusinessProfileState(null);
      await AsyncStorage.removeItem(SELECTED_PROFILE_KEY);
      await AsyncStorage.removeItem(SELECTED_PROFILE_UID_KEY);
      console.log('✅ [BUSINESS PROFILE CONTEXT] Cleared selected profile cache');
    } catch (e) {
      console.error('❌ [BUSINESS PROFILE CONTEXT] Error clearing cache:', e);
    }
  }, []);

  // Load selected profile from AsyncStorage
  const loadSelectedProfile = useCallback(async (currentUserId: string | undefined) => {
    if (!currentUserId) {
      await clearProfileCache();
      setIsLoading(false);
      return;
    }

    try {
      const storedProfile = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
      const storedUid = await AsyncStorage.getItem(SELECTED_PROFILE_UID_KEY);

      if (storedProfile) {
        // Cross-user cache safety guard
        if (storedUid === currentUserId) {
          const profile = JSON.parse(storedProfile);
          setSelectedBusinessProfileState(profile);
          console.log('✅ [BUSINESS PROFILE CONTEXT] Loaded selected profile from storage:', profile.name);
        } else {
          console.log('⚠️ [BUSINESS PROFILE CONTEXT] Cache mismatch or missing UID. Clearing stale cache.');
          await clearProfileCache();
        }
      } else {
        await clearProfileCache();
      }
    } catch (error) {
      console.error('❌ [BUSINESS PROFILE CONTEXT] Error loading selected profile:', error);
      await clearProfileCache();
    } finally {
      setIsLoading(false);
    }
  }, [clearProfileCache]);

  // Listen to auth changes
  useEffect(() => {
    // Initial load with current user
    const initialUser = authService.getCurrentUser();
    loadSelectedProfile(initialUser?.id);

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log('🔄 [BUSINESS PROFILE CONTEXT] Auth state changed. User:', user?.id || 'null');
      if (!user) {
        clearProfileCache();
      } else {
        loadSelectedProfile(user.id);
      }
    });

    return () => unsubscribe();
  }, [clearProfileCache, loadSelectedProfile]);

  // Update AsyncStorage when selected profile changes
  const setSelectedBusinessProfile = useCallback(async (profile: BusinessProfile | null) => {
    if (profile && !isSubscriptionActive(profile.id)) {
      console.warn('🚫 [BUSINESS PROFILE CONTEXT] Cannot select profile without active subscription:', profile.name);
      return;
    }

    try {
      setSelectedBusinessProfileState(profile);

      if (profile) {
        const currentUser = authService.getCurrentUser();
        await AsyncStorage.setItem(SELECTED_PROFILE_KEY, JSON.stringify(profile));
        if (currentUser?.id) {
          await AsyncStorage.setItem(SELECTED_PROFILE_UID_KEY, currentUser.id);
        }
        console.log('✅ [BUSINESS PROFILE CONTEXT] Saved selected profile to storage:', profile.name);
      } else {
        await clearProfileCache();
      }
    } catch (error) {
      console.error('❌ [BUSINESS PROFILE CONTEXT] Error saving selected profile:', error);
    }
  }, [clearProfileCache, isSubscriptionActive]);

  // Centralized initialization logic: select first profile only if none selected
  const initializeSelectedProfile = useCallback(async (profiles: BusinessProfile[]) => {
    if (profiles.length > 0 && !selectedBusinessProfile && !isLoading) {
      // Find the first profile that has an active subscription
      const firstActiveProfile = profiles.find(p => isSubscriptionActive(p.id));
      if (firstActiveProfile) {
        console.log('🏁 [BUSINESS PROFILE CONTEXT] Initializing first active profile:', firstActiveProfile.name);
        await setSelectedBusinessProfile(firstActiveProfile);
      } else {
        console.log('🏁 [BUSINESS PROFILE CONTEXT] No active profiles found to initialize');
      }
    }
  }, [selectedBusinessProfile, isLoading, setSelectedBusinessProfile, isSubscriptionActive]);

  const value: BusinessProfileContextType = {
    selectedBusinessProfile,
    setSelectedBusinessProfile,
    initializeSelectedProfile,
    isSubscriptionActive: isSubscriptionActive(selectedBusinessProfile?.id),
    isLoading,
  };

  return (
    <BusinessProfileContext.Provider value={value}>
      {children}
    </BusinessProfileContext.Provider>
  );
};

export const useBusinessProfile = (): BusinessProfileContextType => {
  const context = useContext(BusinessProfileContext);
  if (context === undefined) {
    throw new Error('useBusinessProfile must be used within a BusinessProfileProvider');
  }
  return context;
};
