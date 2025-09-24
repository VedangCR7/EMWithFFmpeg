import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import greetingTemplatesService from '../services/greetingTemplates';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

const itemSize = isSmallScreen ? 40 : isMediumScreen ? 44 : 48;

interface StickerEmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: string, type: 'sticker' | 'emoji') => void;
}

const StickerEmojiPicker: React.FC<StickerEmojiPickerProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'stickers' | 'emojis'>('stickers');
  const [stickers, setStickers] = useState<string[]>([]);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStickers, setFilteredStickers] = useState<string[]>([]);
  const [filteredEmojis, setFilteredEmojis] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      loadStickersAndEmojis();
    }
  }, [visible]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, stickers, emojis]);

  const loadStickersAndEmojis = async () => {
    try {
      const [stickersData, emojisData] = await Promise.all([
        greetingTemplatesService.getStickers(),
        greetingTemplatesService.getEmojis(),
      ]);
      setStickers(stickersData);
      setEmojis(emojisData);
    } catch (error) {
      console.error('Error loading stickers and emojis:', error);
    }
  };

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredStickers(stickers);
      setFilteredEmojis(emojis);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredStickers(stickers.filter(sticker => sticker.includes(query)));
    setFilteredEmojis(emojis.filter(emoji => emoji.includes(query)));
  };

  const handleSelect = (item: string) => {
    onSelect(item, activeTab === 'stickers' ? 'sticker' : 'emoji');
  };

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.item,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }
      ]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.itemText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderTabButton = (tab: 'stickers' | 'emojis', label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        {
          backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.surface,
          borderColor: theme.colors.border,
        }
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Icon
        name={icon}
        size={20}
        color={activeTab === tab ? '#FFFFFF' : theme.colors.text}
      />
      <Text
        style={[
          styles.tabButtonText,
          {
            color: activeTab === tab ? '#FFFFFF' : theme.colors.text,
          }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={theme.colors.gradient}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Stickers & Emojis</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
          <Icon name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[
              styles.searchInput,
              { color: theme.colors.text }
            ]}
            placeholder="Search stickers and emojis..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          {renderTabButton('stickers', 'Stickers', 'stars')}
          {renderTabButton('emojis', 'Emojis', 'emoji-emotions')}
        </View>

        {/* Content */}
        <FlatList
          data={activeTab === 'stickers' ? filteredStickers : filteredEmojis}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${activeTab}-${item}-${index}`}
          numColumns={8}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name={activeTab === 'stickers' ? 'stars' : 'emoji-emotions'}
                size={48}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No {activeTab} found
              </Text>
            </View>
          }
        />

        {/* Recent Section */}
        <View style={[styles.recentContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.recentTitle, { color: theme.colors.text }]}>
            Recently Used
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.recentItems}>
              {/* Add recently used items here */}
              <TouchableOpacity
                style={[styles.recentItem, { backgroundColor: theme.colors.background }]}
                onPress={() => handleSelect('🌟')}
              >
                <Text style={styles.recentItemText}>🌟</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.recentItem, { backgroundColor: theme.colors.background }]}
                onPress={() => handleSelect('😊')}
              >
                <Text style={styles.recentItemText}>😊</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.recentItem, { backgroundColor: theme.colors.background }]}
                onPress={() => handleSelect('💖')}
              >
                <Text style={styles.recentItemText}>💖</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  item: {
    width: itemSize,
    height: itemSize,
    borderRadius: itemSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 1,
  },
  itemText: {
    fontSize: itemSize * 0.4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  recentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recentItems: {
    flexDirection: 'row',
    gap: 12,
  },
  recentItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  recentItemText: {
    fontSize: 20,
  },
});

export default StickerEmojiPicker;
