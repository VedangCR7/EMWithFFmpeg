import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface RecentSearchListProps {
  searchHistory: string[];
  onItemPress: (query: string) => void;
  onClear: () => void;
}

const RecentSearchList: React.FC<RecentSearchListProps> = ({
  searchHistory,
  onItemPress,
  onClear,
}) => {
  if (searchHistory.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Searches</Text>
        </View>
        <View style={styles.emptyState}>
          <Icon name="time-outline" size={24} color="#999" />
          <Text style={styles.emptyText}>No recent searches</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recent Searches</Text>
        <TouchableOpacity onPress={onClear} activeOpacity={0.7}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.listContainer}
      >
        {searchHistory.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.item,
              index === searchHistory.length - 1 && styles.lastItem
            ]}
            onPress={() => onItemPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.left}>
              <Icon name="time-outline" size={18} color="#666" />
              <Text style={styles.itemText}>{item}</Text>
            </View>

            <Icon name="arrow-forward" size={18} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clearText: {
    color: '#FF3B30',
    fontWeight: '500',
    fontSize: 14,
  },
  scrollView: {
    maxHeight: 250,
  },
  listContainer: {
    paddingBottom: 0,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default RecentSearchList;
