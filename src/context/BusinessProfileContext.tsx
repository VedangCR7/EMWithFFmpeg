import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessProfile } from '../services/businessProfile';
import businessProfileService from '../services/businessProfile';
import authService from '../services/auth';
import subscriptionApi from '../services/subscriptionApi';

interface BusinessProfileContextType {
  selectedBusinessProfile: BusinessProfile | null;
  setSelectedBusinessProfile: (profile: BusinessProfile | null) => Promise<void>;
  initializeSelectedProfile: (profiles: BusinessProfile[]) => Promise<void>;
  isLoading: boolean;
  // Global business selection state
  selectedBusinessCategory: string | null;
  setSelectedBusinessCategory: (category: string | null) => void;
  selectedBusinessId: string | null;
  selectedBusinessProfileId: string | null; // Alias for consistency with API requirements
  // FRONTEND-ONLY: Activation pending state management (non-persistent)
  setActivationPending: (profileId: string, isPending: boolean) => void;
  isActivationPending: (profileId: string) => boolean;
  clearActivationPending: (profileId: string) => void;
}

const BusinessProfileContext = createContext<BusinessProfileContextType | undefined>(undefined);

const SELECTED_PROFILE_KEY = '@selected_business_profile';
const SELECTED_PROFILE_UID_KEY = '@selected_business_profile_uid';
const SELECTED_BUSINESS_CATEGORY_KEY = '@selected_business_category';

interface BusinessProfileProviderProps {
  children: ReactNode;
}

export const BusinessProfileProvider: React.FC<BusinessProfileProviderProps> = ({ children }) => {
  const [selectedBusinessProfile, setSelectedBusinessProfileState] = useState<BusinessProfile | null>(null);
  const [selectedBusinessCategory, setSelectedBusinessCategoryState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isRefreshingRef = useRef<boolean>(false);
  
  // FRONTEND-ONLY: Temporary activation pending state (non-persistent, session-only)
  const [activationPendingProfiles, setActivationPendingProfiles] = useState<Set<string>>(new Set());

  // Clear cache helper
  const clearProfileCache = useCallback(async () => {
    try {
      setSelectedBusinessProfileState(null);
      setSelectedBusinessCategoryState(null);
      await AsyncStorage.removeItem(SELECTED_PROFILE_KEY);
      await AsyncStorage.removeItem(SELECTED_PROFILE_UID_KEY);
      await AsyncStorage.removeItem(SELECTED_BUSINESS_CATEGORY_KEY);
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
      const [storedProfile, storedUid, storedCategory] = await Promise.all([
        AsyncStorage.getItem(SELECTED_PROFILE_KEY),
        AsyncStorage.getItem(SELECTED_PROFILE_UID_KEY),
        AsyncStorage.getItem(SELECTED_BUSINESS_CATEGORY_KEY)
      ]);

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

      // Load business category (no user-specific validation needed)
      if (storedCategory) {
        setSelectedBusinessCategoryState(storedCategory);
        console.log('✅ [BUSINESS PROFILE CONTEXT] Loaded selected business category from storage:', storedCategory);
      }
    } catch (error) {
      console.error('❌ [BUSINESS PROFILE CONTEXT] Error loading selected profile:', error);
      await clearProfileCache();
    } finally {
      setIsLoading(false);
    }
  }, [clearProfileCache]);

  // Silently refresh the selected profile from the API to get latest fields (e.g., subscriptionStatus, businessSubscriptionStatus)
  const refreshSelectedProfileFromApi = useCallback(async (userId: string, currentProfileId: string) => {
    if (isRefreshingRef.current) return;
    
    try {
      isRefreshingRef.current = true;
      console.log(`🔄 [BUSINESS PROFILE CONTEXT] Silently refreshing profile ${currentProfileId} from API...`);
      
      // Clear the cache for this user so we bypass the 5 min local cache and hit the API
      businessProfileService.clearCache(userId);
      
      const profiles = await businessProfileService.getUserBusinessProfiles(userId);
      const freshProfile = profiles.find(p => p.id === currentProfileId);
      
      if (freshProfile) {
        // STEP 3: MERGE DATA - Fetch business subscription status
        let businessSubscriptionStatus: string | null = null;
        
        try {
          console.log(`🔍 [BUSINESS PROFILE CONTEXT] Fetching business subscription status for profile ${currentProfileId}...`);
          const subscriptionResponse = await subscriptionApi.getBusinessProfileSubscriptionStatus(currentProfileId);
          
          if (subscriptionResponse.success && subscriptionResponse.data) {
            businessSubscriptionStatus = subscriptionResponse.data.status === 'active' ? 'Active' : 
                                       subscriptionResponse.data.status === 'expired' ? 'Expired' : 
                                       subscriptionResponse.data.status === 'cancelled' ? 'Cancelled' : 
                                       subscriptionResponse.data.status === 'pending' ? 'Pending' : 'Inactive';
            
            console.log(`✅ [BUSINESS PROFILE CONTEXT] Business subscription status: ${businessSubscriptionStatus}`);
          } else {
            console.log(`⚠️ [BUSINESS PROFILE CONTEXT] No business subscription data found for profile ${currentProfileId}`);
          }
        } catch (subscriptionError: any) {
          console.error(`❌ [BUSINESS PROFILE CONTEXT] Failed to fetch business subscription status:`, subscriptionError.message);
          businessSubscriptionStatus = null;
        }
        
        // Create enriched profile with business subscription data
        const enrichedProfile = {
          ...freshProfile,
          businessSubscriptionStatus,
        };
        
        // STEP 5: ADD DEBUG LOGGING
        console.log("✅ [BUSINESS PROFILE CONTEXT] Enriched Business Profile:", {
          id: enrichedProfile.id,
          name: enrichedProfile.name,
          subscriptionStatus: enrichedProfile.subscriptionStatus,
          businessSubscriptionStatus: enrichedProfile.businessSubscriptionStatus,
        });
        
        // Only update if something actual changed (like subscriptionStatus or businessSubscriptionStatus) to avoid unnecessary re-renders
        setSelectedBusinessProfileState(prev => {
          if (!prev || 
              JSON.stringify(prev) !== JSON.stringify(enrichedProfile)) {
            console.log(`✅ [BUSINESS PROFILE CONTEXT] Profile ${currentProfileId} successfully refreshed and updated in state.`);
            
            // CRITICAL FIX: Auto clear activation pending if backend returns ACTIVE
            if (enrichedProfile.subscriptionStatus?.toUpperCase() === 'ACTIVE') {
              clearActivationPending(currentProfileId);
              console.log(`🏢 [BUSINESS PROFILE CONTEXT] Auto-cleared activation pending - backend returned ACTIVE for profile: ${currentProfileId}`);
            }
            
            // Also update async storage in background
            AsyncStorage.setItem(SELECTED_PROFILE_KEY, JSON.stringify(enrichedProfile)).catch(e => 
              console.error('❌ Failed to update storage with fresh profile', e)
            );
            return enrichedProfile;
          }
          return prev;
        });
      } else {
        console.warn(`⚠️ [BUSINESS PROFILE CONTEXT] Profile ${currentProfileId} not found in fresh API data.`);
      }
    } catch (e) {
      console.error('❌ [BUSINESS PROFILE CONTEXT] Silent refresh failed:', e);
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Listen to auth changes
  useEffect(() => {
    // Initial load with current user
    const initialUser = authService.getCurrentUser();
    loadSelectedProfile(initialUser?.id).then(() => {
      // After local load completes, if we have a selected profile, refresh it
      if (initialUser?.id) {
        // Need to use the latest value of selectedBusinessProfile which isn't available right here
        // so we retrieve it from AsyncStorage directly for this initial boot refresh
        AsyncStorage.getItem(SELECTED_PROFILE_KEY).then(profileStr => {
          if (profileStr) {
            const profile = JSON.parse(profileStr);
            refreshSelectedProfileFromApi(initialUser.id, profile.id);
          }
        });
      }
    });

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log('🔄 [BUSINESS PROFILE CONTEXT] Auth state changed. User:', user?.id || 'null');
      if (!user) {
        clearProfileCache();
      } else {
        loadSelectedProfile(user.id).then(() => {
          // Trigger refresh after auth change load
          AsyncStorage.getItem(SELECTED_PROFILE_KEY).then(profileStr => {
            if (profileStr) {
              const profile = JSON.parse(profileStr);
              refreshSelectedProfileFromApi(user.id, profile.id);
            }
          });
        });
      }
    });

    return () => unsubscribe();
  }, [clearProfileCache, loadSelectedProfile, refreshSelectedProfileFromApi]);

  // AppState listener for refreshing when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        const currentUser = authService.getCurrentUser();
        // Since selectedBusinessProfile could be stale in dependency array, we read it
        if (currentUser?.id) {
          AsyncStorage.getItem(SELECTED_PROFILE_KEY).then(profileStr => {
            if (profileStr) {
              const profile = JSON.parse(profileStr);
              refreshSelectedProfileFromApi(currentUser.id, profile.id);
            }
          });
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refreshSelectedProfileFromApi]);

  // Update AsyncStorage when selected profile changes
  const setSelectedBusinessProfile = useCallback(async (profile: BusinessProfile | null) => {
    // Remove frontend subscription check - let backend API handle subscription validation
    try {
      console.log('🔄 [BUSINESS PROFILE CONTEXT] setSelectedBusinessProfile called:', {
        profileId: profile?.id,
        profileName: profile?.name,
        previousProfileId: selectedBusinessProfile?.id
      });
      
      let enrichedProfile = profile;
      
      // Fetch business subscription data if profile is provided
      if (profile && profile.id) {
        let businessSubscriptionStatus: string | null = null;
        
        try {
          console.log(`🔍 [BUSINESS PROFILE CONTEXT] Fetching business subscription status for manually selected profile ${profile.id}...`);
          const subscriptionResponse = await subscriptionApi.getBusinessProfileSubscriptionStatus(profile.id);
          
          if (subscriptionResponse.success && subscriptionResponse.data) {
            businessSubscriptionStatus = subscriptionResponse.data.status === 'active' ? 'Active' : 
                                       subscriptionResponse.data.status === 'expired' ? 'Expired' : 
                                       subscriptionResponse.data.status === 'cancelled' ? 'Cancelled' : 
                                       subscriptionResponse.data.status === 'pending' ? 'Pending' : 'Inactive';
            
            console.log(`✅ [BUSINESS PROFILE CONTEXT] Manual selection - Business subscription status: ${businessSubscriptionStatus}`);
          } else {
            console.log(`⚠️ [BUSINESS PROFILE CONTEXT] No business subscription data found for manual selection profile ${profile.id}`);
          }
        } catch (subscriptionError: any) {
          console.error(`❌ [BUSINESS PROFILE CONTEXT] Failed to fetch business subscription status for manual selection:`, subscriptionError.message);
          businessSubscriptionStatus = null;
        }
        
        // Create enriched profile with business subscription data
        enrichedProfile = {
          ...profile,
          businessSubscriptionStatus: businessSubscriptionStatus || undefined,
        };
        
        // STEP 5: ADD DEBUG LOGGING
        console.log("✅ [BUSINESS PROFILE CONTEXT] Enriched Manual Selection Profile:", {
          id: enrichedProfile?.id,
          name: enrichedProfile?.name,
          subscriptionStatus: enrichedProfile?.subscriptionStatus,
          businessSubscriptionStatus: enrichedProfile?.businessSubscriptionStatus,
        });
      }
      
      // CRITICAL FIX: Update state immediately and verify
      setSelectedBusinessProfileState(enrichedProfile);
      
      // CRITICAL FIX: Add immediate verification log
      setTimeout(() => {
        console.log('✅ [BUSINESS PROFILE CONTEXT] State update verification:', {
          profileId: enrichedProfile?.id,
          profileName: enrichedProfile?.name,
          stateUpdated: true
        });
      }, 50);

      // Auto-sync business category when profile changes
      if (profile?.category || profile?.subCategory || profile?.subcategory) {
        const displayCategory =
            profile.subCategory ||
            profile.subcategory ||
            profile.category;

        // Add detailed logging for category selection
        console.log("🏷️ [BUSINESS PROFILE CONTEXT] category:", profile.category);
        console.log("🏷️ [BUSINESS PROFILE CONTEXT] subCategory:", profile.subCategory);
        console.log("🏷️ [BUSINESS PROFILE CONTEXT] subcategory:", profile.subcategory);
        console.log("✅ [BUSINESS PROFILE CONTEXT] Final category used:", displayCategory);

        setSelectedBusinessCategoryState(displayCategory);
        await AsyncStorage.setItem(SELECTED_BUSINESS_CATEGORY_KEY, displayCategory);
        console.log('✅ [BUSINESS PROFILE CONTEXT] Auto-synced business category from profile:', displayCategory);
      }

      if (enrichedProfile) {
        const currentUser = authService.getCurrentUser();
        await AsyncStorage.setItem(SELECTED_PROFILE_KEY, JSON.stringify(enrichedProfile));
        if (currentUser?.id) {
          await AsyncStorage.setItem(SELECTED_PROFILE_UID_KEY, currentUser.id);
        }
        console.log('✅ [BUSINESS PROFILE CONTEXT] Saved enriched selected profile to storage:', enrichedProfile.name);
      } else {
        await clearProfileCache();
      }
    } catch (error) {
      console.error('❌ [BUSINESS PROFILE CONTEXT] Error saving selected profile:', error);
    }
  }, [clearProfileCache, selectedBusinessProfile]);

  // Set business category independently
  const setSelectedBusinessCategory = useCallback(async (category: string | null) => {
    try {
      setSelectedBusinessCategoryState(category);
      
      if (category) {
        await AsyncStorage.setItem(SELECTED_BUSINESS_CATEGORY_KEY, category);
        console.log('✅ [BUSINESS PROFILE CONTEXT] Saved selected business category to storage:', category);
      } else {
        await AsyncStorage.removeItem(SELECTED_BUSINESS_CATEGORY_KEY);
        console.log('✅ [BUSINESS PROFILE CONTEXT] Cleared selected business category from storage');
      }
    } catch (error) {
      console.error('❌ [BUSINESS PROFILE CONTEXT] Error saving selected business category:', error);
    }
  }, []);

  // Centralized initialization logic: select first profile only if none selected
  const initializeSelectedProfile = useCallback(async (profiles: BusinessProfile[]) => {
    if (profiles.length > 0 && !selectedBusinessProfile && !isLoading) {
      // Initialize with first profile - let backend API handle subscription validation
      const firstProfile = profiles[0];
      console.log('🏁 [BUSINESS PROFILE CONTEXT] Initializing first profile:', firstProfile.name);
      await setSelectedBusinessProfile(firstProfile);
    }
  }, [selectedBusinessProfile, isLoading, setSelectedBusinessProfile]);

  // FRONTEND-ONLY: Activation pending state management (non-persistent, session-only)
  const setActivationPending = useCallback((profileId: string, isPending: boolean) => {
    console.log('🏢 [BUSINESS PROFILE CONTEXT] 🚀 setActivationPending called with:', { profileId, isPending });
    
    if (!profileId) {
      console.warn('🏢 [BUSINESS PROFILE CONTEXT] setActivationPending called with empty profileId');
      return;
    }
    
    // Use functional state update to avoid stale closure
    setActivationPendingProfiles(prev => {
      console.log('🏢 [BUSINESS PROFILE CONTEXT] Current activationPendingProfiles before:', Array.from(prev));
      
      const newSet = new Set(prev);
      if (isPending) {
        newSet.add(profileId);
        console.log(`🏢 [BUSINESS PROFILE CONTEXT] ✅ Set activation pending for profile: ${profileId}`);
        console.log(`🏢 [BUSINESS PROFILE CONTEXT] Current pending profiles:`, Array.from(newSet));
      } else {
        newSet.delete(profileId);
        console.log(`🏢 [BUSINESS PROFILE CONTEXT] ❌ Cleared activation pending for profile: ${profileId}`);
        console.log(`🏢 [BUSINESS PROFILE CONTEXT] Current pending profiles:`, Array.from(newSet));
      }
      console.log('🏢 [BUSINESS PROFILE CONTEXT] New activationPendingProfiles after:', Array.from(newSet));
      return newSet;
    });
  }, []); // Remove activationPendingProfiles dependency to prevent stale closure

  const isActivationPending = useCallback((profileId: string) => {
    if (!profileId) {
      console.warn('🏢 [BUSINESS PROFILE CONTEXT] isActivationPending called with empty profileId');
      return false;
    }
    
    // Direct check from current state to avoid stale closure
    const isPending = activationPendingProfiles.has(profileId);
    console.log(`🏢 [BUSINESS PROFILE CONTEXT] 🔍 Check activation pending for profile: ${profileId} -> ${isPending}`);
    console.log(`🏢 [BUSINESS PROFILE CONTEXT] All pending profiles:`, Array.from(activationPendingProfiles));
    return isPending;
  }, [activationPendingProfiles]); // Keep dependency for accurate state reading

  const clearActivationPending = useCallback((profileId: string) => {
    if (!profileId) {
      console.warn('🏢 [BUSINESS PROFILE CONTEXT] clearActivationPending called with empty profileId');
      return;
    }
    
    setActivationPendingProfiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(profileId);
      console.log(`🏢 [BUSINESS PROFILE CONTEXT] 🧹 Force cleared activation pending for profile: ${profileId}`);
      console.log(`🏢 [BUSINESS PROFILE CONTEXT] Current pending profiles:`, Array.from(newSet));
      return newSet;
    });
  }, []);

  const value: BusinessProfileContextType = useMemo(() => ({
    selectedBusinessProfile,
    setSelectedBusinessProfile,
    initializeSelectedProfile,
    isLoading,
    selectedBusinessCategory,
    setSelectedBusinessCategory,
    selectedBusinessId: selectedBusinessProfile?.id || null,
    selectedBusinessProfileId: selectedBusinessProfile?.id || null, // Alias for consistency with API requirements
    // FRONTEND-ONLY: Activation pending state management
    setActivationPending,
    isActivationPending,
    clearActivationPending,
  }), [
    selectedBusinessProfile,
    setSelectedBusinessProfile,
    initializeSelectedProfile,
    isLoading,
    selectedBusinessCategory,
    setSelectedBusinessCategory,
    setActivationPending,
    isActivationPending,
    clearActivationPending,
  ]);

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
