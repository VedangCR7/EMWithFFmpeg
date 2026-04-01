import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import OptimizedImage from '../../../components/OptimizedImage';

// Import types
import { BusinessProfile } from '../../../services/businessProfile';
import authService from '../../../services/auth';
type User = ReturnType<typeof authService.getCurrentUser>;

interface HomeHeaderSectionProps {
  theme: any;
  isDarkMode: boolean;
  userProfile: User | null;
  selectedBusinessProfile: BusinessProfile | null;
  userName: string;
  userInitials: string;
  userAvatarUri: string | null;
  apiLoading: boolean;
  apiError: string | null;
  isSearchBarVisible: boolean;
  searchQuery: string;
  searchIconSize: number;
  statusIconSize: number;
  moderateScale: (size: number) => number;
  userProfileSectionRef: React.RefObject<any>;
  businessProfileDropdown: React.ReactNode;
  toggleBusinessProfileDropdown: () => void;
  toggleSearchBar: () => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (searching: boolean) => void;
  setDisableBackgroundUpdates: (disabled: boolean) => void;
  setTemplates: (templates: any[]) => void;
  openCustomerSupportModal: () => void;
  styles: any;
}

const HomeHeaderSection: React.FC<HomeHeaderSectionProps> = ({
  theme,
  isDarkMode,
  userProfile,
  selectedBusinessProfile,
  userName,
  userInitials,
  userAvatarUri,
  apiLoading,
  apiError,
  isSearchBarVisible,
  searchQuery,
  searchIconSize,
  statusIconSize,
  moderateScale,
  userProfileSectionRef,
  businessProfileDropdown,
  toggleBusinessProfileDropdown,
  toggleSearchBar,
  setSearchQuery,
  setIsSearching,
  setDisableBackgroundUpdates,
  setTemplates,
  openCustomerSupportModal,
  styles,
}) => {
  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.gradient[0] || '#e8e8e8' }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />

        <LinearGradient
          colors={theme.colors.gradient}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              {/* User Profile Info */}
              <View
                style={styles.userProfileSection}
              >
                <TouchableOpacity
                  ref={userProfileSectionRef}
                  style={styles.userAvatarContainer}
                  onPress={toggleBusinessProfileDropdown}
                  activeOpacity={0.7}
                >
                  <View style={[styles.userAvatar, { backgroundColor: theme.colors.primary }]}>
                    {userAvatarUri ? (
                      <OptimizedImage
                        uri={userAvatarUri}
                        style={styles.userAvatarImage}
                        resizeMode="cover"
                        cacheKey={`user_avatar_${selectedBusinessProfile?.id || 'personal'}_${userAvatarUri?.slice(-20) || 'default'}`}
                        key={`avatar_${selectedBusinessProfile?.id || 'personal'}_${userAvatarUri?.slice(-20) || 'default'}`}
                      />
                    ) : (
                      <Text style={styles.userAvatarText}>{userInitials}</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.userInfoContainer}>
                  <Text style={[styles.userName, { color: theme.colors.text }]} numberOfLines={1}>
                    {userName}
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                    Post, Promote, Grow
                  </Text>
                  {apiError && (
                    <View style={styles.apiStatusIndicator}>
                      <Icon name="wifi-off" size={statusIconSize} color="#ff9800" />
                      <Text style={styles.apiStatusText}>Offline Mode</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Header Actions */}
              <View style={styles.headerActions}>
                {apiLoading && (
                  <View style={styles.apiLoadingIndicator}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                    <Text style={styles.apiLoadingText}>Loading...</Text>
                  </View>
                )}

                {/* Search Button */}
                <TouchableOpacity
                  style={[styles.headerActionButton, { backgroundColor: theme.colors.cardBackground }]}
                  onPress={toggleSearchBar}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={isSearchBarVisible ? "close" : "search"}
                    size={moderateScale(20)}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>

                {/* Customer Support Button */}
                <TouchableOpacity
                  style={[styles.headerActionButton, { backgroundColor: theme.colors.cardBackground }]}
                  onPress={openCustomerSupportModal}
                  activeOpacity={0.7}
                >
                  <Icon name="support-agent" size={moderateScale(20)} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {businessProfileDropdown}

          {/* Search Bar */}
          {isSearchBarVisible && (
            <View style={styles.searchContainer}>
              <View style={[styles.searchBar, { backgroundColor: theme.colors.cardBackground }]}>
                <Icon name="search" size={searchIconSize} color={theme.colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.text }]}
                  placeholder="Search"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setIsSearching(false);
                      setDisableBackgroundUpdates(false);
                      setTemplates([]);
                    }}
                    style={styles.clearIcon}
                  >
                    <Icon name="close" size={searchIconSize} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </LinearGradient>
      </SafeAreaView>
    </>
  );
};

export default HomeHeaderSection;
