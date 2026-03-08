import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessProfile } from '../services/businessProfile';
import authService from '../services/auth';

interface BusinessProfileContextType {
  selectedBusinessProfile: BusinessProfile | null;
  setSelectedBusinessProfile: (profile: BusinessProfile | null) => void;
  isLoading: boolean;
}

const BusinessProfileContext = createContext<BusinessProfileContextType | undefined>(undefined);

const SELECTED_PROFILE_KEY = '@selected_business_profile';

interface BusinessProfileProviderProps {
  children: ReactNode;
}

export const BusinessProfileProvider: React.FC<BusinessProfileProviderProps> = ({ children }) => {
  const [selectedBusinessProfile, setSelectedBusinessProfileState] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load selected profile from AsyncStorage on mount
  useEffect(() => {
    const loadSelectedProfile = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          setSelectedBusinessProfileState(profile);
          console.log('✅ [BUSINESS PROFILE CONTEXT] Loaded selected profile from storage:', profile.name);
        }
      } catch (error) {
        console.error('❌ [BUSINESS PROFILE CONTEXT] Error loading selected profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSelectedProfile();
  }, []);

  // Update AsyncStorage when selected profile changes
  const setSelectedBusinessProfile = async (profile: BusinessProfile | null) => {
    try {
      setSelectedBusinessProfileState(profile);
      
      if (profile) {
        await AsyncStorage.setItem(SELECTED_PROFILE_KEY, JSON.stringify(profile));
        console.log('✅ [BUSINESS PROFILE CONTEXT] Saved selected profile to storage:', profile.name);
      } else {
        await AsyncStorage.removeItem(SELECTED_PROFILE_KEY);
        console.log('✅ [BUSINESS PROFILE CONTEXT] Cleared selected profile from storage');
      }
    } catch (error) {
      console.error('❌ [BUSINESS PROFILE CONTEXT] Error saving selected profile:', error);
    }
  };

  const value: BusinessProfileContextType = {
    selectedBusinessProfile,
    setSelectedBusinessProfile,
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
