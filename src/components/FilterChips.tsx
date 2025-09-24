import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface FilterChip {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  selectedFilters: string[];
  onFilterChange: (filterId: string) => void;
  title?: string;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  selectedFilters,
  onFilterChange,
  title,
}) => {
  const renderChip = (filter: FilterChip) => {
    const isSelected = selectedFilters.includes(filter.value);
    
    return (
      <TouchableOpacity
        key={filter.id}
        style={[
          styles.chip,
          isSelected ? styles.chipSelected : styles.chipUnselected,
        ]}
        onPress={() => onFilterChange(filter.value)}
        activeOpacity={0.8}
      >
        {filter.icon && (
          <Icon
            name={filter.icon}
            size={16}
            color={isSelected ? '#ffffff' : '#667eea'}
            style={styles.chipIcon}
          />
        )}
        <Text
          style={[
            styles.chipText,
            isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
          ]}
        >
          {filter.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.titleUnderline} />
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map(renderChip)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  titleContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    minHeight: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  chipUnselected: {
    backgroundColor: '#ffffff',
    borderColor: '#e1e5e9',
  },
  chipIcon: {
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  chipTextUnselected: {
    color: '#667eea',
  },
});

export default FilterChips; 