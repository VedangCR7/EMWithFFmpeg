import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helper functions (matching HomeScreen)
const moderateScale = (size: number, factor = 0.5) => size + ((screenWidth / 375) * size - size) * factor;

interface FAQItem {
  question: string;
  answer: string;
}

interface ContactOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
}

type HelpSupportScreenRouteProp = RouteProp<MainStackParamList, 'HelpSupport'>;

const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const route = useRoute<HelpSupportScreenRouteProp>();
  const { theme } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const faqSectionRef = useRef<View>(null);
  
  // Dynamic dimensions for responsive layout (matching HomeScreen)
  const [dimensions, setDimensions] = useState(() => {
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

  // Scroll to FAQ section when navigated from FAQ button
  const [faqSectionY, setFaqSectionY] = useState<number>(0);

  useEffect(() => {
    if (route.params?.scrollToFAQ && faqSectionY > 0 && scrollViewRef.current) {
      // Delay to ensure the view is rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: faqSectionY - 20, animated: true });
      }, 500);
    }
  }, [route.params?.scrollToFAQ, faqSectionY]);

  const currentScreenWidth = dimensions.width;
  
  // Dynamic responsive scaling functions
  const dynamicScale = (size: number) => (currentScreenWidth / 375) * size;
  const dynamicModerateScale = (size: number, factor = 0.5) => size + (dynamicScale(size) - size) * factor;
  
  // Responsive icon sizes (compact - 60% of original, slightly larger for small screens)
  const getIconSize = (baseSize: number) => {
    const isCurrentlySmall = currentScreenWidth < 375;
    const multiplier = isCurrentlySmall ? 0.75 : 0.6; // Increased from 0.7 to 0.75 for small screens
    return Math.max(10, Math.round(baseSize * (currentScreenWidth / 375) * multiplier));
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

  const faqs: FAQItem[] = [
    {
      question: 'How do I create a custom template?',
      answer: 'Navigate to the Template screen, then upload an image or video. After uploading, you can apply templates, add text, and customize your content as needed.',
    },
    {
      question: 'How do I download my created content?',
      answer: 'After creating or customizing your content, tap the "Download" button. Your content will be saved to your device gallery. You can access all your downloads from the Profile > Downloads section.',
    },
    {
      question: 'What subscription plans are available?',
      answer: 'We offer multiple subscription plans including Quarterly and Annual plans. Each plan provides access to premium templates, unlimited downloads, and exclusive features. Visit the Subscription section to view all available plans.',
    },
    {
      question: 'Can I cancel my subscription?',
      answer: 'Subscriptions cannot be cancelled once activated. Your subscription will remain active for the entire billing period you selected. Please contact our support team for any concerns regarding your subscription.',
    },
    {
      question: 'How do I add my business profile?',
      answer: 'Go to Profile > Business Profiles and tap the "Add Business" button. Fill in your business details including name, logo, contact information, and category. This information will be automatically applied to your templates.',
    },
    {
      question: 'Are my designs saved automatically?',
      answer: 'No, designs are not saved automatically. Please manually save your work before closing the app or navigating away. It is recommended to download your completed designs to your device gallery to ensure they are preserved.',
    },
    {
      question: 'How do I share my content?',
      answer: 'After creating your content, tap the "Share" button. You can share directly to social media platforms, send via messaging apps, or copy the link to share anywhere.',
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support multiple formats including JPG, PNG for images, and MP4 for videos. Premium users also get access to high-resolution exports and additional format options.',
    },
  ];

  const handleWhatsAppPress = useCallback(async () => {
    try {
      const phoneNumber = '918551941415'; // Phone number without + sign for WhatsApp (8551941415 with country code 91)
      const message = 'Hello, I need support';
      const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      
      // Try to open WhatsApp app
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web WhatsApp if app is not installed
        const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      // Try direct web fallback on error
      try {
        const phoneNumber = '918551941415';
        const message = 'Hello, I need support';
        const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      } catch (fallbackError) {
        console.error('Error opening WhatsApp fallback:', fallbackError);
      }
    }
  }, []);

  const contactOptions: ContactOption[] = [
    {
      id: 'email',
      title: 'Email Support',
      description: 'support@marketbrand.ai',
      icon: 'email',
      action: () => {
        Linking.openURL('mailto:support@marketbrand.ai?subject=Help Request from MarketBrand App');
      },
    },
    {
      id: 'phone',
      title: 'Call Us',
      description: '8551941415',
      icon: 'phone',
      action: () => {
        Linking.openURL('tel:8551941415');
      },
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Click to send message',
      icon: 'chat',
      action: () => {
        handleWhatsAppPress();
      },
    },
    {
      id: 'website',
      title: 'Visit Website',
      description: 'www.marketbrand.ai',
      icon: 'language',
      action: () => {
        Linking.openURL('https://www.marketbrand.ai');
      },
    },
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const renderContactOption = (option: ContactOption) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.contactCard, { 
        backgroundColor: theme.colors.cardBackground,
        padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
        borderRadius: dynamicModerateScale(10),
        marginBottom: dynamicModerateScale(6),
      }]}
      onPress={option.action}
      activeOpacity={0.7}
    >
      <View style={[styles.contactIconContainer, { 
        backgroundColor: option.id === 'whatsapp' ? '#00968820' : theme.colors.primary + '20',
        width: isTabletDevice ? dynamicModerateScale(44) : dynamicModerateScale(38),
        height: isTabletDevice ? dynamicModerateScale(44) : dynamicModerateScale(38),
        borderRadius: isTabletDevice ? dynamicModerateScale(22) : dynamicModerateScale(19),
        marginRight: dynamicModerateScale(10),
      }]}>
        {option.id === 'whatsapp' ? (
          <MaterialCommunityIcons 
            name="whatsapp" 
            size={isTabletDevice ? getIconSize(20) : getIconSize(18)} 
            color="#009688" 
          />
        ) : (
          <Icon 
            name={option.icon} 
            size={isTabletDevice ? getIconSize(20) : getIconSize(18)} 
            color={theme.colors.primary} 
          />
        )}
      </View>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactTitle, { 
          color: theme.colors.text,
          fontSize: isTabletDevice ? getFontSize(11) : getFontSize(10),
          marginBottom: dynamicModerateScale(1),
        }]}>{option.title}</Text>
        <Text style={[styles.contactDescription, { 
          color: theme.colors.textSecondary,
          fontSize: isTabletDevice ? getFontSize(9) : getFontSize(8),
        }]}>
          {option.description}
        </Text>
      </View>
      <Icon name="chevron-right" size={isTabletDevice ? getIconSize(18) : getIconSize(16)} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderFAQItem = (item: FAQItem, index: number) => {
    const isExpanded = expandedFAQ === index;

    return (
      <TouchableOpacity
        key={index}
        style={[styles.faqItem, { 
          backgroundColor: theme.colors.cardBackground,
          borderRadius: dynamicModerateScale(10),
          padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
          marginBottom: dynamicModerateScale(6),
        }]}
        onPress={() => toggleFAQ(index)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={[styles.faqQuestion, { 
            color: theme.colors.text,
            fontSize: isTabletDevice ? getFontSize(10) : getFontSize(9),
            marginRight: dynamicModerateScale(8),
            lineHeight: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(15),
            includeFontPadding: true,
            paddingBottom: moderateScale(1),
          }]}>{item.question}</Text>
          <Icon
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={isTabletDevice ? getIconSize(20) : getIconSize(18)}
            color={theme.colors.textSecondary}
          />
        </View>
        {isExpanded && (
          <Text style={[styles.faqAnswer, { 
            color: theme.colors.textSecondary,
            fontSize: isTabletDevice ? getFontSize(9) : getFontSize(8),
            marginTop: dynamicModerateScale(8),
            lineHeight: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(15),
            includeFontPadding: true,
            paddingBottom: moderateScale(1),
          }]}>{item.answer}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, {
          paddingHorizontal: isTabletDevice ? dynamicModerateScale(10) : dynamicModerateScale(6),
          paddingVertical: isTabletDevice ? dynamicModerateScale(5) : dynamicModerateScale(4),
        }]}>
          <TouchableOpacity
            style={[styles.backButton, {
              width: isTabletDevice ? dynamicModerateScale(30) : (currentScreenWidth < 375 ? dynamicModerateScale(30) : dynamicModerateScale(24)),
              height: isTabletDevice ? dynamicModerateScale(30) : (currentScreenWidth < 375 ? dynamicModerateScale(30) : dynamicModerateScale(24)),
            }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={isTabletDevice ? getIconSize(18) : (currentScreenWidth < 375 ? getIconSize(20) : getIconSize(16))} color="#333333" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {
            fontSize: isTabletDevice ? getFontSize(12) : getFontSize(10),
          }]}>Help & Support</Text>
          <View style={[styles.backButton, {
            width: isTabletDevice ? dynamicModerateScale(26) : dynamicModerateScale(22),
            height: isTabletDevice ? dynamicModerateScale(26) : dynamicModerateScale(22),
          }]} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, {
            paddingHorizontal: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(8),
            paddingBottom: dynamicModerateScale(20),
          }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <View style={[styles.welcomeCard, { 
            backgroundColor: theme.colors.cardBackground,
            borderRadius: dynamicModerateScale(12),
            padding: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(12),
            marginBottom: dynamicModerateScale(12),
          }]}>
            <View style={[styles.welcomeIconContainer, { 
              backgroundColor: theme.colors.primary + '15',
              width: isTabletDevice ? dynamicModerateScale(60) : dynamicModerateScale(48),
              height: isTabletDevice ? dynamicModerateScale(60) : dynamicModerateScale(48),
              borderRadius: isTabletDevice ? dynamicModerateScale(30) : dynamicModerateScale(24),
              marginBottom: dynamicModerateScale(10),
            }]}>
              <Icon name="support-agent" size={isTabletDevice ? getIconSize(28) : getIconSize(24)} color={theme.colors.primary} />
            </View>
            <Text style={[styles.welcomeTitle, { 
              color: theme.colors.text,
              fontSize: isTabletDevice ? getFontSize(14) : getFontSize(12),
              marginBottom: dynamicModerateScale(6),
            }]}>
              How can we help you?
            </Text>
            <Text style={[styles.welcomeSubtitle, { 
              color: theme.colors.textSecondary,
              fontSize: isTabletDevice ? getFontSize(9) : getFontSize(8),
              lineHeight: isTabletDevice ? dynamicModerateScale(16) : dynamicModerateScale(14),
              includeFontPadding: true,
              paddingBottom: moderateScale(1),
            }]}>
              We're here to assist you with any questions or issues you may have
            </Text>
          </View>

          {/* Contact Options */}
          <View style={[styles.section, {
            marginBottom: dynamicModerateScale(12),
          }]}>
            <Text style={[styles.sectionTitle, { 
              color: '#333333',
              fontSize: isTabletDevice ? getFontSize(12) : getFontSize(11),
              marginBottom: dynamicModerateScale(8),
            }]}>Contact Us</Text>
            <View style={[styles.contactGrid, {
              gap: dynamicModerateScale(6),
            }]}>
              {contactOptions.map(renderContactOption)}
            </View>
          </View>

          {/* FAQs */}
          <View 
            ref={faqSectionRef}
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;
              setFaqSectionY(y);
            }}
            style={[styles.section, {
              marginBottom: dynamicModerateScale(12),
            }]}>
            <Text style={[styles.sectionTitle, { 
              color: '#333333',
              fontSize: isTabletDevice ? getFontSize(12) : getFontSize(11),
              marginBottom: dynamicModerateScale(8),
            }]}>
              Frequently Asked Questions
            </Text>
            <View style={[styles.faqContainer, {
              gap: dynamicModerateScale(6),
            }]}>
              {faqs.map(renderFAQItem)}
            </View>
          </View>

          {/* Quick Links */}
          <View style={[styles.section, {
            marginBottom: dynamicModerateScale(12),
          }]}>
            <Text style={[styles.sectionTitle, { 
              color: '#333333',
              fontSize: isTabletDevice ? getFontSize(12) : getFontSize(11),
              marginBottom: dynamicModerateScale(8),
            }]}>Quick Links</Text>
            <TouchableOpacity
              style={[styles.quickLinkCard, { 
                backgroundColor: theme.colors.cardBackground,
                padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
                borderRadius: dynamicModerateScale(10),
                marginBottom: dynamicModerateScale(6),
              }]}
              onPress={() => navigation.navigate('PrivacyPolicy' as never)}
              activeOpacity={0.7}
            >
              <Icon name="privacy-tip" size={isTabletDevice ? getIconSize(18) : getIconSize(16)} color={theme.colors.primary} />
              <Text style={[styles.quickLinkText, { 
                color: theme.colors.text,
                fontSize: isTabletDevice ? getFontSize(10) : getFontSize(9),
                marginLeft: dynamicModerateScale(10),
              }]}>Privacy Policy</Text>
              <Icon name="chevron-right" size={isTabletDevice ? getIconSize(18) : getIconSize(16)} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickLinkCard, { 
                backgroundColor: theme.colors.cardBackground,
                padding: isTabletDevice ? dynamicModerateScale(12) : dynamicModerateScale(10),
                borderRadius: dynamicModerateScale(10),
                marginBottom: dynamicModerateScale(6),
              }]}
              onPress={() => navigation.navigate('Subscription' as never)}
              activeOpacity={0.7}
            >
              <Icon name="card-membership" size={isTabletDevice ? getIconSize(18) : getIconSize(16)} color={theme.colors.primary} />
              <Text style={[styles.quickLinkText, { 
                color: theme.colors.text,
                fontSize: isTabletDevice ? getFontSize(10) : getFontSize(9),
                marginLeft: dynamicModerateScale(10),
              }]}>Subscription Plans</Text>
              <Icon name="chevron-right" size={isTabletDevice ? getIconSize(18) : getIconSize(16)} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={[styles.footer, {
            paddingVertical: dynamicModerateScale(12),
            marginTop: dynamicModerateScale(8),
          }]}>
            <Text style={[styles.footerText, { 
              color: 'rgba(51, 51, 51, 0.7)',
              fontSize: isTabletDevice ? getFontSize(9) : getFontSize(8),
              marginBottom: dynamicModerateScale(2),
            }]}>
              Powered by RSL Solution Private Limited
            </Text>
            <Text style={[styles.footerVersion, { 
              color: 'rgba(102, 102, 102, 0.8)',
              fontSize: isTabletDevice ? getFontSize(7.5) : getFontSize(7),
            }]}>
              Version 1.0.0
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) * 0.3 : 0,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
    headerTitle: {
    fontWeight: 'bold',
    color: '#333333',
    includeFontPadding: false,
    paddingBottom: moderateScale(2),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Inline styles used
  },
  welcomeCard: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.06,
    shadowRadius: moderateScale(4),
    elevation: 2,
  },
  welcomeIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    paddingBottom: moderateScale(2),
  },
  welcomeSubtitle: {
    textAlign: 'center',
    includeFontPadding: false,
    paddingBottom: moderateScale(2),
  },
  section: {
    // Inline styles used
  },
  sectionTitle: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    includeFontPadding: false,
    paddingBottom: moderateScale(2),
  },
  contactGrid: {
    // Inline styles used
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(1) },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(2),
    elevation: 1,
  },
  contactIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontWeight: '600',
    includeFontPadding: false,
    paddingBottom: moderateScale(2),
  },
  contactDescription: {
    // Inline styles used
  },
  faqContainer: {
    // Inline styles used
  },
  faqItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(1) },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(2),
    elevation: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontWeight: '600',
    includeFontPadding: false,
    paddingBottom: moderateScale(2),
  },
  faqAnswer: {
    // Inline styles used
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(1) },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(2),
    elevation: 1,
  },
  quickLinkText: {
    flex: 1,
    fontWeight: '500',
    includeFontPadding: false,
    paddingBottom: moderateScale(2),
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    includeFontPadding: false,
    paddingBottom: moderateScale(2),
  },
  footerVersion: {
    textAlign: 'center',
    includeFontPadding: false,
    paddingBottom: moderateScale(2),
  },
});

export default HelpSupportScreen;

