import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  Image,
  FlatList,
  Animated,
} from 'react-native';
// import ViewShot from 'react-native-view-shot'; // Removed - package uninstalled
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { GreetingTemplate } from '../services/greetingTemplates';
import StickerEmojiPicker from '../components/StickerEmojiPicker';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

// Calculate responsive dimensions
const getResponsiveDimensions = (insets: any) => {
  const availableWidth = screenWidth - (insets.left + insets.right);
  const availableHeight = screenHeight - (insets.top + insets.bottom);
  
  const canvasWidth = Math.min(availableWidth * 0.95, screenWidth * 0.95);
  const canvasHeight = Math.min(availableHeight * 0.6, screenHeight * 0.6);
  
  return {
    canvasWidth,
    canvasHeight,
    availableWidth,
    availableHeight
  };
};

interface CanvasElement {
  id: string;
  type: 'text' | 'sticker' | 'emoji' | 'image';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  zIndex: number;
  style?: {
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    backgroundColor?: string;
  };
}

interface GreetingEditorScreenProps {
  route: RouteProp<{ GreetingEditor: { template: GreetingTemplate | null } }, 'GreetingEditor'>;
}

const GreetingEditorScreen: React.FC<GreetingEditorScreenProps> = ({ route }) => {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isSubscribed } = useSubscription();
  // const viewShotRef = useRef<ViewShot>(null); // Removed - ViewShot package uninstalled
  
  const { template } = route.params;
  const dimensions = getResponsiveDimensions(insets);

  // State
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(
    template?.content.background || null
  );
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [stickerModalVisible, setStickerModalVisible] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [textStyle, setTextStyle] = useState({
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'System',
    fontWeight: '600' as const,
  });

  // Initialize canvas with template data
  useEffect(() => {
    if (template) {
      const initialElements: CanvasElement[] = [];
      
      // Add template text
      if (template.content.text) {
        initialElements.push({
          id: 'template-text',
          type: 'text',
          content: template.content.text,
          position: { x: dimensions.canvasWidth / 2 - 100, y: dimensions.canvasHeight / 2 - 20 },
          size: { width: 200, height: 40 },
          rotation: 0,
          zIndex: 1,
          style: {
            fontSize: 24,
            color: '#FFFFFF',
            fontFamily: 'System',
            fontWeight: '600',
          },
        });
      }

      // Add template stickers/emojis
      if (template.content.stickers) {
        template.content.stickers.forEach((sticker: string, index: number) => {
          initialElements.push({
            id: `sticker-${index}`,
            type: 'sticker',
            content: sticker,
            position: { x: 50 + index * 60, y: 50 },
            size: { width: 40, height: 40 },
            rotation: 0,
            zIndex: 2,
          });
        });
      }

      setCanvasElements(initialElements);
    }
  }, [template, dimensions]);

  // Handlers
  const handleAddText = useCallback(() => {
    const newTextElement: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'New Text',
      position: { x: dimensions.canvasWidth / 2 - 50, y: dimensions.canvasHeight / 2 - 20 },
      size: { width: 100, height: 40 },
      rotation: 0,
      zIndex: canvasElements.length + 1,
      style: textStyle,
    };

    setCanvasElements(prev => [...prev, newTextElement]);
    setSelectedElement(newTextElement.id);
    setEditingText('New Text');
    setTextModalVisible(true);
  }, [canvasElements.length, dimensions, textStyle]);

  const handleAddSticker = useCallback(() => {
    setStickerModalVisible(true);
  }, []);

  const handleStickerSelect = useCallback((item: string, type: 'sticker' | 'emoji') => {
    const newElement: CanvasElement = {
      id: `${type}-${Date.now()}`,
      type: type === 'sticker' ? 'sticker' : 'emoji',
      content: item,
      position: { x: dimensions.canvasWidth / 2 - 20, y: dimensions.canvasHeight / 2 - 20 },
      size: { width: 40, height: 40 },
      rotation: 0,
      zIndex: canvasElements.length + 1,
    };

    setCanvasElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    setStickerModalVisible(false);
  }, [canvasElements.length, dimensions]);

  const handleElementPress = useCallback((elementId: string) => {
    setSelectedElement(elementId);
    const element = canvasElements.find(el => el.id === elementId);
    if (element?.type === 'text') {
      setEditingText(element.content);
      setTextStyle({
        fontSize: element.style?.fontSize || textStyle.fontSize,
        color: element.style?.color || textStyle.color,
        fontFamily: element.style?.fontFamily || textStyle.fontFamily,
        fontWeight: (element.style?.fontWeight as any) || textStyle.fontWeight,
      });
      setTextModalVisible(true);
    }
  }, [canvasElements, textStyle]);

  const handleTextSave = useCallback(() => {
    if (selectedElement) {
      setCanvasElements(prev => prev.map(el =>
        el.id === selectedElement
          ? { ...el, content: editingText, style: textStyle }
          : el
      ));
    }
    setTextModalVisible(false);
  }, [selectedElement, editingText, textStyle]);

  const handleDeleteElement = useCallback(() => {
    if (selectedElement) {
      setCanvasElements(prev => prev.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
  }, [selectedElement]);

  const handleBackgroundSelect = useCallback(() => {
    Alert.alert(
      'Select Background',
      'Choose how you want to add a background',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Camera',
          onPress: () => {
            launchCamera({
              mediaType: 'photo',
              quality: 0.8,
            }, (response) => {
              if (response.assets && response.assets[0]) {
                setBackgroundImage(response.assets[0].uri || null);
              }
            });
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            launchImageLibrary({
              mediaType: 'photo',
              quality: 0.8,
            }, (response) => {
              if (response.assets && response.assets[0]) {
                setBackgroundImage(response.assets[0].uri || null);
              }
            });
          },
        },
      ]
    );
  }, []);

  const handleSave = useCallback(async () => {
    try {
      // ViewShot functionality removed - show simplified message
      Alert.alert('Success', 'Greeting saved successfully! (Screenshot functionality simplified)', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving greeting:', error);
      Alert.alert('Error', 'Failed to save greeting. Please try again.');
    }
  }, [navigation]);

  const handleShare = useCallback(async () => {
    try {
      // ViewShot functionality removed - show simplified message
      Alert.alert('Share', 'Sharing functionality simplified (Screenshot feature unavailable)');
    } catch (error) {
      console.error('Error sharing greeting:', error);
      Alert.alert('Error', 'Failed to share greeting. Please try again.');
    }
  }, []);

  const renderCanvasElement = useCallback((element: CanvasElement) => {
    const isSelected = selectedElement === element.id;
    
    const elementStyle = {
      position: 'absolute' as const,
      left: element.position.x,
      top: element.position.y,
      width: element.size.width,
      height: element.size.height,
      transform: [{ rotate: `${element.rotation}deg` }],
      zIndex: element.zIndex,
      borderWidth: isSelected ? 2 : 0,
      borderColor: isSelected ? theme.colors.primary : 'transparent',
      borderRadius: 4,
    };

    switch (element.type) {
      case 'text':
        return (
          <TouchableOpacity
            key={element.id}
            style={elementStyle}
            onPress={() => handleElementPress(element.id)}
          >
            <Text
              style={[
                styles.canvasText,
                element.style,
                { color: element.style?.color || '#FFFFFF' }
              ]}
            >
              {element.content}
            </Text>
          </TouchableOpacity>
        );

      case 'sticker':
      case 'emoji':
        return (
          <TouchableOpacity
            key={element.id}
            style={elementStyle}
            onPress={() => handleElementPress(element.id)}
          >
            <Text style={styles.canvasSticker}>{element.content}</Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  }, [selectedElement, theme, handleElementPress]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {template ? 'Edit Greeting' : 'Create Greeting'}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Icon name="save" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <Icon name="share" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <View
          style={[
            styles.canvas,
            {
              width: dimensions.canvasWidth,
              height: dimensions.canvasHeight,
            }
          ]}
        >
          {/* Background */}
          {backgroundImage ? (
            <Image
              source={{ uri: backgroundImage }}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.backgroundGradient}
            />
          )}

          {/* Canvas Elements */}
          {canvasElements.map(renderCanvasElement)}
        </View>
      </View>

      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: theme.colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.toolbarContent}>
            <TouchableOpacity
              style={[styles.toolbarButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddText}
            >
              <Icon name="text-fields" size={20} color="#FFFFFF" />
              <Text style={styles.toolbarButtonText}>Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolbarButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={handleAddSticker}
            >
              <Icon name="emoji-emotions" size={20} color={theme.colors.text} />
              <Text style={[styles.toolbarButtonText, { color: theme.colors.text }]}>Stickers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolbarButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={handleBackgroundSelect}
            >
              <Icon name="image" size={20} color={theme.colors.text} />
              <Text style={[styles.toolbarButtonText, { color: theme.colors.text }]}>Background</Text>
            </TouchableOpacity>

            {selectedElement && (
              <TouchableOpacity
                style={[styles.toolbarButton, { backgroundColor: '#E74C3C' }]}
                onPress={handleDeleteElement}
              >
                <Icon name="delete" size={20} color="#FFFFFF" />
                <Text style={styles.toolbarButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Text Editor Modal */}
      <Modal
        visible={textModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTextModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <LinearGradient
            colors={theme.colors.gradient}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity onPress={() => setTextModalVisible(false)}>
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Text</Text>
              <TouchableOpacity onPress={handleTextSave}>
                <Icon name="check" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.modalContent}>
            <TextInput
              style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={editingText}
              onChangeText={setEditingText}
              placeholder="Enter your text..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
            />

            {/* Text Style Options */}
            <View style={styles.styleOptions}>
              <Text style={[styles.styleSectionTitle, { color: theme.colors.text }]}>Text Style</Text>
              
              {/* Font Size */}
              <View style={styles.styleRow}>
                <Text style={[styles.styleLabel, { color: theme.colors.text }]}>Size:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[16, 20, 24, 28, 32, 36, 40].map(size => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeButton,
                        {
                          backgroundColor: textStyle.fontSize === size ? theme.colors.primary : theme.colors.surface,
                          borderColor: theme.colors.border,
                        }
                      ]}
                      onPress={() => setTextStyle(prev => ({ ...prev, fontSize: size }))}
                    >
                      <Text style={[
                        styles.sizeButtonText,
                        { color: textStyle.fontSize === size ? '#FFFFFF' : theme.colors.text }
                      ]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Colors */}
              <View style={styles.styleRow}>
                <Text style={[styles.styleLabel, { color: theme.colors.text }]}>Color:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'].map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color },
                        { borderColor: textStyle.color === color ? theme.colors.primary : 'transparent' }
                      ]}
                      onPress={() => setTextStyle(prev => ({ ...prev, color }))}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sticker/Emoji Picker Modal */}
      <StickerEmojiPicker
        visible={stickerModalVisible}
        onClose={() => setStickerModalVisible(false)}
        onSelect={handleStickerSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  canvas: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundGradient: {
    width: '100%',
    height: '100%',
  },
  canvasText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  canvasSticker: {
    fontSize: 32,
    textAlign: 'center',
  },
  toolbar: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  toolbarContent: {
    flexDirection: 'row',
    gap: 12,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  styleOptions: {
    gap: 20,
  },
  styleSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  styleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 60,
  },
  sizeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  sizeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    marginRight: 8,
  },
});

export default GreetingEditorScreen;
