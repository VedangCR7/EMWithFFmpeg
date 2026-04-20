import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import ComingSoonModal from '../../../components/ComingSoonModal';

interface ModalManagerProps {
  // Modal visibility states
  isModalVisible: boolean;
  isBusinessCategoriesModalVisible: boolean;
  isVideosModalVisible: boolean;
  showVideoComingSoonModal: boolean;
  isCustomerSupportModalVisible: boolean;
  isBusinessEthicsModalVisible: boolean;
  isSuccessMindsetModalVisible: boolean;
  isSocialMediaGrowthModalVisible: boolean;
  isMoneyAndFinanceModalVisible: boolean;
  isBusinessLegendQuoteModalVisible: boolean;
  isBusinessMarketingTipsModalVisible: boolean;
  isBusinessQuotesModalVisible: boolean;
  isFeaturedContentModalVisible: boolean;
  isGeneralCategoriesModalVisible: boolean;
  isBusinessCategoriesModalClosing: boolean;

  // Data for modals
  selectedTemplate: any;

  // Handlers
  closeModal: () => void;
  closeBusinessCategoriesModal: () => void;
  closeVideosModal: () => void;
  closeCustomerSupportModal: () => void;
  closeBusinessEthicsModal: () => void;
  closeSuccessMindsetModal: () => void;
  closeSocialMediaGrowthModal: () => void;
  closeMoneyAndFinanceModal: () => void;
  closeBusinessLegendQuoteModal: () => void;
  closeBusinessMarketingTipsModal: () => void;
  closeBusinessQuotesModal: () => void;
  closeFeaturedContentModal: () => void;

  // Theme and styles
  theme: any;
  styles: any;
}

const ModalManager: React.FC<ModalManagerProps> = ({
  isModalVisible,
  isBusinessCategoriesModalVisible,
  isVideosModalVisible,
  showVideoComingSoonModal,
  isCustomerSupportModalVisible,
  isBusinessEthicsModalVisible,
  isSuccessMindsetModalVisible,
  isSocialMediaGrowthModalVisible,
  isMoneyAndFinanceModalVisible,
  isBusinessLegendQuoteModalVisible,
  isBusinessMarketingTipsModalVisible,
  isBusinessQuotesModalVisible,
  isFeaturedContentModalVisible,
  isGeneralCategoriesModalVisible,
  isBusinessCategoriesModalClosing,
  selectedTemplate,
  closeModal,
  closeBusinessCategoriesModal,
  closeVideosModal,
  closeCustomerSupportModal,
  closeBusinessEthicsModal,
  closeSuccessMindsetModal,
  closeSocialMediaGrowthModal,
  closeMoneyAndFinanceModal,
  closeBusinessLegendQuoteModal,
  closeBusinessMarketingTipsModal,
  closeBusinessQuotesModal,
  closeFeaturedContentModal,
  theme,
  styles,
}) => {
  return (
    <>
      {/* Template Preview Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeModal}
          >
            <View style={styles.modalContent}>
              {selectedTemplate && (
                <View style={styles.modalImage} />
              )}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeModal}
              >
                <Icon name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Business Categories Modal */}
      <Modal
        visible={isBusinessCategoriesModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeBusinessCategoriesModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeBusinessCategoriesModal}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>Business Categories</Text>
                  <TouchableOpacity onPress={closeBusinessCategoriesModal}>
                    <Icon name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {!isBusinessCategoriesModalClosing && (
                  <View style={styles.upcomingEventsModalBody}>
                    <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                      Business categories content will be displayed here
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* General Categories Modal */}
      <Modal
        visible={isGeneralCategoriesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>General Categories</Text>
                  <TouchableOpacity onPress={() => {}}>
                    <Icon name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.upcomingEventsModalBody}>
                  <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                    General categories content will be displayed here
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Video Content Modal */}
      <Modal
        visible={isVideosModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeVideosModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeVideosModal}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>Video Content</Text>
                  <TouchableOpacity onPress={closeVideosModal}>
                    <Icon name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.upcomingEventsModalBody}>
                  <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                    Video content will be displayed here
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Customer Support Modal */}
      <Modal
        visible={isCustomerSupportModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeCustomerSupportModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeCustomerSupportModal}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>Customer Support</Text>
                  <TouchableOpacity 
                    onPress={closeCustomerSupportModal}
                    style={{
                      width: 24,
                      height: 24,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 12,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Text style={{ 
                      fontSize: 18, 
                      color: theme.colors.textSecondary, 
                      fontWeight: 'bold',
                      lineHeight: 20,
                    }}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.upcomingEventsModalBody}>
                  <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                    Need help? Contact our customer support team for assistance with any issues or questions.
                  </Text>
                  <TouchableOpacity
                    style={[styles.upcomingEventsModalButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => {
                      // Handle customer support action
                      closeCustomerSupportModal();
                    }}
                  >
                    <Text style={styles.upcomingEventsModalButtonText}>Contact Support</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      <ComingSoonModal
        visible={showVideoComingSoonModal}
        onClose={() => {}}
      />

      {/* Business Ethics Modal */}
      <Modal
        visible={isBusinessEthicsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeBusinessEthicsModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeBusinessEthicsModal}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>Business Ethics</Text>
                  <TouchableOpacity onPress={closeBusinessEthicsModal}>
                    <Icon name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.upcomingEventsModalBody}>
                  <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                    Business ethics content will be displayed here
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Success Mindset Modal */}
      <Modal
        visible={isSuccessMindsetModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSuccessMindsetModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeSuccessMindsetModal}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>Success Mindset</Text>
                  <TouchableOpacity onPress={closeSuccessMindsetModal}>
                    <Icon name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.upcomingEventsModalBody}>
                  <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                    Success mindset content will be displayed here
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Social Media Growth Modal */}
      <Modal
        visible={isSocialMediaGrowthModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSocialMediaGrowthModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeSocialMediaGrowthModal}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>Social Media Growth</Text>
                  <TouchableOpacity onPress={closeSocialMediaGrowthModal}>
                    <Icon name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.upcomingEventsModalBody}>
                  <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                    Social media growth content will be displayed here
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Money and Finance Modal */}
      <Modal
        visible={isMoneyAndFinanceModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeMoneyAndFinanceModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeMoneyAndFinanceModal}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>Money and Finance</Text>
                  <TouchableOpacity onPress={closeMoneyAndFinanceModal}>
                    <Icon name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.upcomingEventsModalBody}>
                  <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                    Money and finance content will be displayed here
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Business Legend Quote Modal */}
      <Modal
        visible={isBusinessLegendQuoteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeBusinessLegendQuoteModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeBusinessLegendQuoteModal}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>Business Legend Quote</Text>
                  <TouchableOpacity onPress={closeBusinessLegendQuoteModal}>
                    <Icon name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.upcomingEventsModalBody}>
                  <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                    Business legend quote content will be displayed here
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Business Marketing Tips Modal */}
      <Modal
        visible={isBusinessMarketingTipsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeBusinessMarketingTipsModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeBusinessMarketingTipsModal}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>Business Marketing Tips</Text>
                  <TouchableOpacity onPress={closeBusinessMarketingTipsModal}>
                    <Icon name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.upcomingEventsModalBody}>
                  <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                    Business marketing tips content will be displayed here
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Business Quotes Modal */}
      <Modal
        visible={isBusinessQuotesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeBusinessQuotesModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeBusinessQuotesModal}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>Business Quotes</Text>
                  <TouchableOpacity onPress={closeBusinessQuotesModal}>
                    <Icon name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.upcomingEventsModalBody}>
                  <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                    Business quotes content will be displayed here
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Featured Content Modal */}
      <Modal visible={isFeaturedContentModalVisible} transparent={true} animationType="slide" onRequestClose={closeFeaturedContentModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={closeFeaturedContentModal}
          >
            <View style={styles.upcomingEventsModalContent}>
              <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.upcomingEventsModalGradient}>
                <View style={styles.upcomingEventsModalHeader}>
                  <Text style={styles.upcomingEventsModalTitle}>Featured Content</Text>
                  <TouchableOpacity onPress={closeFeaturedContentModal}>
                    <Icon name="close" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.upcomingEventsModalBody}>
                  <Text style={[styles.upcomingEventsModalDescription, { textAlign: 'center', color: theme.colors.text }]}>
                    Featured content will be displayed here
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

export default ModalManager;
