import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// Compact spacing multiplier to reduce all spacing (matching PrivacyPolicyScreen)
const COMPACT_MULTIPLIER = 0.5;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive helper functions (matching PrivacyPolicyScreen)
const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 667) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414 && screenWidth < 768;
const isTablet = screenWidth >= 768;
const isLandscape = screenWidth > screenHeight;

type RootStackParamList = {
  AboutUs: undefined;
};

type AboutUsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AboutUs'>;

const AboutUsScreen: React.FC = () => {
  const navigation = useNavigation<AboutUsScreenNavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Dynamic dimensions for responsive layout (matching PrivacyPolicyScreen)
  const [dimensions, setDimensions] = React.useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Update dimensions on screen rotation/resize
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const currentScreenWidth = dimensions.width;
  const currentScreenHeight = dimensions.height;
  
  // Dynamic responsive scaling functions
  const dynamicScale = (size: number) => (currentScreenWidth / 375) * size;
  const dynamicVerticalScale = (size: number) => (currentScreenHeight / 667) * size;
  const dynamicModerateScale = (size: number, factor = 0.5) => size + (dynamicScale(size) - size) * factor;
  
  // Responsive icon sizes (compact - 60% of original)
  const getIconSize = (baseSize: number) => {
    return Math.max(10, Math.round(baseSize * (currentScreenWidth / 375) * 0.6));
  };
  
  // Responsive text size helper (larger for small screens)
  const getFontSize = (baseSize: number) => {
    // Increased threshold to 450px to catch more devices including medium phones
    const isCurrentlySmall = currentScreenWidth < 450;
    
    if (isCurrentlySmall) {
      // For small screens, use a moderate multiplier approach
      // Apply a reasonable boost to make text more readable without being too large
      // Using 1.3x multiplier + 3px for a balanced increase
      const boostedSize = baseSize * 1.3 + 3;
      return Math.round(boostedSize);
    }
    
    // For medium and large screens, use normal scaling
    const baseFontSize = dynamicModerateScale(baseSize);
    return baseFontSize;
  };
  
  // Device size detection
  const isTabletDevice = currentScreenWidth >= 768;
  const isSmallScreenDevice = currentScreenWidth < 375;

  const handleGoBack = () => {
    navigation.goBack();
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    backgroundGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: moderateScale(1) },
      shadowOpacity: 0.05,
      shadowRadius: moderateScale(2),
      elevation: 1,
    },
    backButton: {
      backgroundColor: theme.colors.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: moderateScale(1) },
      shadowOpacity: 0.05,
      shadowRadius: moderateScale(2),
      elevation: 1,
    },
    headerTitle: {
      fontSize: isTabletDevice ? getFontSize(12) : getFontSize(11),
      fontWeight: '700',
      color: theme.colors.text,
      flex: 1,
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      backgroundColor: 'transparent',
      maxWidth: isTablet ? 900 : currentScreenWidth,
      alignSelf: 'center',
      width: '100%',
    },
    heroSection: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: moderateScale(2) },
      shadowOpacity: 0.1,
      shadowRadius: moderateScale(4),
      elevation: 2,
    },
    logoContainer: {
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    heroTitle: {
      fontSize: isTabletDevice ? getFontSize(16) : getFontSize(14),
      fontWeight: '900',
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: moderateScale(isTablet ? 22 : 20),
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    heroSubtitle: {
      fontSize: isTabletDevice ? getFontSize(8) : getFontSize(7.5),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: moderateScale(isTablet ? 16 : 15),
      fontWeight: '500',
      maxWidth: isTablet ? 600 : currentScreenWidth - 80,
      includeFontPadding: true,
      paddingBottom: moderateScale(2),
    },
    statsSection: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}10`,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: moderateScale(2) },
      shadowOpacity: 0.1,
      shadowRadius: moderateScale(4),
      elevation: 2,
    },
    statsTitle: {
      fontSize: isTabletDevice ? getFontSize(12) : getFontSize(11),
      fontWeight: '800',
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: moderateScale(isTablet ? 20 : 18),
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      includeFontPadding: true,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statItem: {
      width: isTablet ? '48%' : '47%',
      alignItems: 'center',
      backgroundColor: `${theme.colors.primary}08`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      overflow: 'visible',
    },
    statNumber: {
      fontSize: isTabletDevice ? getFontSize(16) : getFontSize(14),
      fontWeight: '900',
      color: theme.colors.primary,
      lineHeight: moderateScale(isTablet ? 20 : 18),
      textShadowColor: `${theme.colors.primary}30`,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    statLabel: {
      fontSize: isTabletDevice ? getFontSize(8) : getFontSize(7.5),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: moderateScale(isTablet ? 16 : 15),
      fontWeight: '600',
      paddingBottom: moderateScale(4),
      includeFontPadding: true,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}08`,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: moderateScale(2) },
      shadowOpacity: 0.1,
      shadowRadius: moderateScale(4),
      elevation: 2,
    },
    sectionTitle: {
      fontSize: isTabletDevice ? getFontSize(11) : getFontSize(10),
      fontWeight: '800',
      color: theme.colors.text,
      lineHeight: moderateScale(isTablet ? 15 : 14),
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    sectionText: {
      fontSize: isTabletDevice ? getFontSize(8) : getFontSize(6.5),
      color: theme.colors.textSecondary,
      lineHeight: moderateScale(isTablet ? 14 : 13),
      fontWeight: '400',
    },
    featureList: {
      // Inline styles used
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: `${theme.colors.primary}05`,
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.primary,
    },
    featureIcon: {
      // Inline styles used
    },
    featureText: {
      fontSize: isTabletDevice ? getFontSize(8) : getFontSize(6.5),
      color: theme.colors.textSecondary,
      lineHeight: moderateScale(isTablet ? 12 : 14),
      flex: 1,
      fontWeight: '500',
      flexWrap: 'wrap',
    },
    trialSection: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: `${theme.colors.primary}40`,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: moderateScale(2) },
      shadowOpacity: 0.1,
      shadowRadius: moderateScale(4),
      elevation: 2,
    },
    trialTitle: {
      fontSize: isTabletDevice ? getFontSize(12) : getFontSize(11),
      fontWeight: '800',
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: moderateScale(isTablet ? 16 : 15),
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    trialFeatures: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    trialFeature: {
      width: isTablet ? '48%' : '100%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${theme.colors.primary}15`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
    },
    trialFeatureText: {
      fontSize: isTabletDevice ? getFontSize(8) : getFontSize(6.5),
      color: theme.colors.textSecondary,
      lineHeight: moderateScale(isTablet ? 14 : 13),
      fontWeight: '600',
      flex: 1,
    },
    versionSection: {
      alignItems: 'center',
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    versionText: {
      fontSize: isTabletDevice ? getFontSize(7) : getFontSize(6.5),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: moderateScale(isTablet ? 13 : 12),
    },
    privacyLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: moderateScale(2) },
      shadowOpacity: 0.1,
      shadowRadius: moderateScale(4),
      elevation: 2,
    },
    privacyLinkText: {
      fontSize: isTabletDevice ? getFontSize(10) : getFontSize(9),
      color: '#ffffff',
      fontWeight: '700',
      letterSpacing: 0.5,
      lineHeight: moderateScale(isTablet ? 14 : 13),
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={theme.colors.gradient}
        style={dynamicStyles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Header */}
      <View style={[dynamicStyles.header, {
        paddingHorizontal: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
        paddingTop: insets.top + dynamicModerateScale(4),
        paddingBottom: dynamicModerateScale(6),
      }]}>
        <TouchableOpacity
          style={[dynamicStyles.backButton, {
            width: isTabletDevice ? dynamicModerateScale(32) : dynamicModerateScale(28),
            height: isTabletDevice ? dynamicModerateScale(32) : dynamicModerateScale(28),
            borderRadius: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(14),
            marginRight: dynamicModerateScale(8),
          }]}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={isTabletDevice ? getIconSize(20) : getIconSize(18)} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>About Us</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={dynamicStyles.scrollContainer}
        contentContainerStyle={[dynamicStyles.content, {
          paddingHorizontal: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
          paddingVertical: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
          paddingBottom: isTabletDevice ? dynamicModerateScale(40) : dynamicModerateScale(60),
        }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Hero Section */}
        <View style={[dynamicStyles.heroSection, {
          marginBottom: dynamicModerateScale(12),
          paddingTop: dynamicModerateScale(12),
          paddingBottom: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(18),
          paddingHorizontal: dynamicModerateScale(8),
          borderRadius: dynamicModerateScale(12),
          marginHorizontal: dynamicModerateScale(2),
        }]}>
          <View style={[dynamicStyles.logoContainer, {
            width: isTabletDevice ? dynamicModerateScale(80) : dynamicModerateScale(60),
            height: isTabletDevice ? dynamicModerateScale(80) : dynamicModerateScale(60),
            borderRadius: 1000,
            marginBottom: dynamicModerateScale(8),
          }]}>
            <Image
              source={require('../assets/MainLogo/MB.png')}
              style={[dynamicStyles.logo, {
                borderRadius: 1000,
              }]}
              resizeMode="cover"
            />
          </View>
          <Text style={[dynamicStyles.heroTitle, {
            marginBottom: dynamicModerateScale(6),
          }]}>MarketBrand.ai</Text>
          <Text style={[dynamicStyles.heroSubtitle, {
            paddingHorizontal: dynamicModerateScale(8),
            paddingBottom: dynamicModerateScale(2),
          }]}>
            Empowering businesses with professional marketing materials in minutes, not days
          </Text>
        </View>

        {/* Stats Section */}
        <View style={[dynamicStyles.statsSection, {
          borderRadius: dynamicModerateScale(12),
          padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
          marginBottom: dynamicModerateScale(12),
          marginHorizontal: dynamicModerateScale(2),
        }]}>
          <Text style={[dynamicStyles.statsTitle, {
            marginBottom: dynamicModerateScale(12),
            paddingBottom: dynamicModerateScale(4),
          }]}>Our Impact</Text>
          <View style={[dynamicStyles.statsGrid, {
            gap: dynamicModerateScale(6),
          }]}>
            <View style={[dynamicStyles.statItem, {
              paddingTop: dynamicModerateScale(12),
              paddingBottom: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(18),
              paddingHorizontal: dynamicModerateScale(6),
              borderRadius: dynamicModerateScale(10),
              minHeight: isTabletDevice ? dynamicModerateScale(90) : dynamicModerateScale(85),
            }]}>
              <Text style={[dynamicStyles.statNumber, {
                marginBottom: dynamicModerateScale(5),
              }]}>10,000+</Text>
              <Text style={dynamicStyles.statLabel}>Happy Businesses</Text>
            </View>
            <View style={[dynamicStyles.statItem, {
              paddingTop: dynamicModerateScale(12),
              paddingBottom: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(18),
              paddingHorizontal: dynamicModerateScale(6),
              borderRadius: dynamicModerateScale(10),
              minHeight: isTabletDevice ? dynamicModerateScale(90) : dynamicModerateScale(85),
            }]}>
              <Text style={[dynamicStyles.statNumber, {
                marginBottom: dynamicModerateScale(5),
              }]}>1,000+</Text>
              <Text style={dynamicStyles.statLabel}>Professional Templates</Text>
            </View>
            <View style={[dynamicStyles.statItem, {
              paddingTop: dynamicModerateScale(12),
              paddingBottom: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(18),
              paddingHorizontal: dynamicModerateScale(6),
              borderRadius: dynamicModerateScale(10),
              minHeight: isTabletDevice ? dynamicModerateScale(90) : dynamicModerateScale(85),
            }]}>
              <Text style={[dynamicStyles.statNumber, {
                marginBottom: dynamicModerateScale(5),
              }]}>6</Text>
              <Text style={dynamicStyles.statLabel}>Business Categories</Text>
            </View>
            <View style={[dynamicStyles.statItem, {
              paddingTop: dynamicModerateScale(12),
              paddingBottom: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(18),
              paddingHorizontal: dynamicModerateScale(6),
              borderRadius: dynamicModerateScale(10),
              minHeight: isTabletDevice ? dynamicModerateScale(90) : dynamicModerateScale(85),
            }]}>
              <Text style={[dynamicStyles.statNumber, {
                marginBottom: dynamicModerateScale(5),
              }]}>1-Min</Text>
              <Text style={dynamicStyles.statLabel}>Creation Time</Text>
            </View>
          </View>
        </View>

        {/* Mission Section */}
        <View style={[dynamicStyles.section, {
          marginBottom: dynamicModerateScale(12),
          borderRadius: dynamicModerateScale(12),
          padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
          marginHorizontal: dynamicModerateScale(2),
        }]}>
          <Text style={[dynamicStyles.sectionTitle, {
            marginBottom: dynamicModerateScale(8),
          }]}>Our Mission</Text>
          <Text style={[dynamicStyles.sectionText, {
            marginBottom: dynamicModerateScale(4),
          }]}>
            To make professional marketing easy, affordable, and accessible for every business.
          </Text>
        </View>

        {/* Vision Section */}
        <View style={[dynamicStyles.section, {
          marginBottom: dynamicModerateScale(12),
          borderRadius: dynamicModerateScale(12),
          padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
          marginHorizontal: dynamicModerateScale(2),
        }]}>
          <Text style={[dynamicStyles.sectionTitle, {
            marginBottom: dynamicModerateScale(8),
          }]}>Our Vision</Text>
          <Text style={[dynamicStyles.sectionText, {
            marginBottom: dynamicModerateScale(8),
          }]}>
            Building a world where every business creates big-brand marketing with ease.
          </Text>
          <Text style={[dynamicStyles.sectionText, {
            marginBottom: dynamicModerateScale(4),
          }]}>
            To empower 1 million businesses worldwide with effortless, professional marketing.
          </Text>
        </View>

        {/* Why We Built This Section */}
        <View style={[dynamicStyles.section, {
          marginBottom: dynamicModerateScale(12),
          borderRadius: dynamicModerateScale(12),
          padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
          marginHorizontal: dynamicModerateScale(2),
        }]}>
          <Text style={[dynamicStyles.sectionTitle, {
            marginBottom: dynamicModerateScale(8),
          }]}>Why We Built This</Text>
          <Text style={[dynamicStyles.sectionText, {
            marginBottom: dynamicModerateScale(8),
          }]}>
            Marketing shouldn't be slow or expensive.
          </Text>
          <Text style={[dynamicStyles.sectionText, {
            marginBottom: dynamicModerateScale(4),
          }]}>
            We built MarketBrand.ai to deliver professional designs in minutes, not weeks.
          </Text>
        </View>

        {/* Key Features Section */}
        <View style={[dynamicStyles.section, {
          marginBottom: dynamicModerateScale(12),
          borderRadius: dynamicModerateScale(12),
          padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
          paddingBottom: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(16),
          marginHorizontal: dynamicModerateScale(2),
        }]}>
          <Text style={[dynamicStyles.sectionTitle, {
            marginBottom: dynamicModerateScale(8),
          }]}>What Makes Us Different</Text>
          <View style={[dynamicStyles.featureList, {
            marginTop: dynamicModerateScale(4),
          }]}>
            <View style={[dynamicStyles.featureItem, {
              marginBottom: dynamicModerateScale(8),
              paddingVertical: isTabletDevice ? dynamicModerateScale(6) : dynamicModerateScale(8),
              paddingHorizontal: dynamicModerateScale(6),
              paddingBottom: isTabletDevice ? dynamicModerateScale(6) : dynamicModerateScale(10),
              borderRadius: dynamicModerateScale(8),
            }]}>
              <Icon name="check-circle" size={isTabletDevice ? getIconSize(18) : getIconSize(16)} color={theme.colors.primary} style={{
                marginRight: dynamicModerateScale(6),
                marginTop: dynamicModerateScale(2),
              }} />
              <Text style={dynamicStyles.featureText}>
                <Text style={{ fontWeight: '600', color: theme.colors.text }}>No Design Skills Required</Text> - Our intuitive platform makes professional design accessible to everyone
              </Text>
            </View>
            <View style={[dynamicStyles.featureItem, {
              marginBottom: dynamicModerateScale(8),
              paddingVertical: isTabletDevice ? dynamicModerateScale(6) : dynamicModerateScale(8),
              paddingHorizontal: dynamicModerateScale(6),
              paddingBottom: isTabletDevice ? dynamicModerateScale(6) : dynamicModerateScale(10),
              borderRadius: dynamicModerateScale(8),
            }]}>
              <Icon name="check-circle" size={isTabletDevice ? getIconSize(18) : getIconSize(16)} color={theme.colors.primary} style={{
                marginRight: dynamicModerateScale(6),
                marginTop: dynamicModerateScale(2),
              }} />
              <Text style={dynamicStyles.featureText}>
                <Text style={{ fontWeight: '600', color: theme.colors.text }}>Affordable for Every Business</Text> - Professional results at a fraction of traditional agency costs
              </Text>
            </View>
            <View style={[dynamicStyles.featureItem, {
              marginBottom: dynamicModerateScale(8),
              paddingVertical: isTabletDevice ? dynamicModerateScale(6) : dynamicModerateScale(8),
              paddingHorizontal: dynamicModerateScale(6),
              paddingBottom: isTabletDevice ? dynamicModerateScale(6) : dynamicModerateScale(10),
              borderRadius: dynamicModerateScale(8),
            }]}>
              <Icon name="check-circle" size={isTabletDevice ? getIconSize(18) : getIconSize(16)} color={theme.colors.primary} style={{
                marginRight: dynamicModerateScale(6),
                marginTop: dynamicModerateScale(2),
              }} />
              <Text style={dynamicStyles.featureText}>
                <Text style={{ fontWeight: '600', color: theme.colors.text }}>Results in Minutes, Not Days</Text> - From concept to finished design in under 60 seconds
              </Text>
            </View>
            <View style={[dynamicStyles.featureItem, {
              marginBottom: 0,
              paddingVertical: isTabletDevice ? dynamicModerateScale(6) : dynamicModerateScale(8),
              paddingHorizontal: dynamicModerateScale(6),
              paddingBottom: isTabletDevice ? dynamicModerateScale(6) : dynamicModerateScale(10),
              borderRadius: dynamicModerateScale(8),
            }]}>
              <Icon name="check-circle" size={isTabletDevice ? getIconSize(18) : getIconSize(16)} color={theme.colors.primary} style={{
                marginRight: dynamicModerateScale(6),
                marginTop: dynamicModerateScale(2),
              }} />
              <Text style={dynamicStyles.featureText}>
                <Text style={{ fontWeight: '600', color: theme.colors.text }}>Industry-Specific Templates</Text> - Tailored designs for 6 major business categories
              </Text>
            </View>
          </View>
        </View>

        {/* Trial Section */}
        <View style={[dynamicStyles.trialSection, {
          borderRadius: dynamicModerateScale(12),
          padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
          marginBottom: dynamicModerateScale(12),
          marginHorizontal: dynamicModerateScale(2),
        }]}>
          <Text style={[dynamicStyles.trialTitle, {
            marginBottom: dynamicModerateScale(10),
          }]}>Start Your Journey Today</Text>
          <View style={[dynamicStyles.trialFeatures, {
            gap: dynamicModerateScale(6),
          }]}>
            <View style={[dynamicStyles.trialFeature, {
              paddingVertical: dynamicModerateScale(6),
              paddingHorizontal: dynamicModerateScale(8),
              borderRadius: dynamicModerateScale(8),
              minHeight: isTabletDevice ? dynamicModerateScale(40) : dynamicModerateScale(35),
            }]}>
              <Icon name="check-circle" size={isTabletDevice ? getIconSize(16) : getIconSize(14)} color={theme.colors.primary} />
              <Text style={[dynamicStyles.trialFeatureText, {
                marginLeft: dynamicModerateScale(6),
              }]}>7-Day Free Trial</Text>
            </View>
            <View style={[dynamicStyles.trialFeature, {
              paddingVertical: dynamicModerateScale(6),
              paddingHorizontal: dynamicModerateScale(8),
              borderRadius: dynamicModerateScale(8),
              minHeight: isTabletDevice ? dynamicModerateScale(40) : dynamicModerateScale(35),
            }]}>
              <Icon name="check-circle" size={isTabletDevice ? getIconSize(16) : getIconSize(14)} color={theme.colors.primary} />
              <Text style={[dynamicStyles.trialFeatureText, {
                marginLeft: dynamicModerateScale(6),
              }]}>No Credit Card Required</Text>
            </View>
            <View style={[dynamicStyles.trialFeature, {
              paddingVertical: dynamicModerateScale(6),
              paddingHorizontal: dynamicModerateScale(8),
              borderRadius: dynamicModerateScale(8),
              minHeight: isTabletDevice ? dynamicModerateScale(40) : dynamicModerateScale(35),
            }]}>
              <Icon name="check-circle" size={isTabletDevice ? getIconSize(16) : getIconSize(14)} color={theme.colors.primary} />
              <Text style={[dynamicStyles.trialFeatureText, {
                marginLeft: dynamicModerateScale(6),
              }]}>Cancel Anytime</Text>
            </View>
            <View style={[dynamicStyles.trialFeature, {
              paddingVertical: dynamicModerateScale(6),
              paddingHorizontal: dynamicModerateScale(8),
              borderRadius: dynamicModerateScale(8),
              minHeight: isTabletDevice ? dynamicModerateScale(40) : dynamicModerateScale(35),
            }]}>
              <Icon name="check-circle" size={isTabletDevice ? getIconSize(16) : getIconSize(14)} color={theme.colors.primary} />
              <Text style={[dynamicStyles.trialFeatureText, {
                marginLeft: dynamicModerateScale(6),
              }]}>Instant Access</Text>
            </View>
          </View>
        </View>

        {/* Version Info */}
        <View style={[dynamicStyles.versionSection, {
          paddingVertical: dynamicModerateScale(12),
          marginTop: dynamicModerateScale(8),
        }]}>
          <Text style={[dynamicStyles.versionText, {
            marginBottom: dynamicModerateScale(6),
          }]}>
            Version 1.0.0 • Founded 2024
          </Text>
          
          {/* Privacy Policy Link */}
          <TouchableOpacity
            style={[dynamicStyles.privacyLink, {
              paddingVertical: dynamicModerateScale(8),
              paddingHorizontal: dynamicModerateScale(12),
              borderRadius: dynamicModerateScale(10),
              marginTop: dynamicModerateScale(6),
            }]}
            onPress={() => navigation.navigate('PrivacyPolicy' as never)}
            activeOpacity={0.7}
          >
            <Icon name="privacy-tip" size={isTabletDevice ? getIconSize(14) : getIconSize(12)} color="#ffffff" />
            <Text style={[dynamicStyles.privacyLinkText, {
              marginHorizontal: dynamicModerateScale(6),
            }]}>Privacy Policy</Text>
            <Icon name="chevron-right" size={isTabletDevice ? getIconSize(14) : getIconSize(12)} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutUsScreen;
