import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    price: number;
    duration?: string;
    features?: string[];
    popular?: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
  isSinglePlan?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isSelected, onSelect, isSinglePlan = false }) => {
  const { theme } = useTheme();
  
  // BUSINESS API VERIFICATION: Log plan data received by UI component
  console.log('🏢 BUSINESS API VERIFICATION - PlanCard:');
  console.log('📋 Plan data received:', {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    duration: plan.duration,
    featuresCount: plan.features?.length || 0,
    popular: plan.popular,
    isSelected
  });

  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        isSinglePlan && styles.singlePlanCard,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: isSelected ? '#667eea' : theme.colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {plan.popular && (
        <View style={[styles.popularBadge, { backgroundColor: '#667eea' }]}>
          <Text style={styles.popularBadgeText}>POPULAR</Text>
        </View>
      )}
      
      <View style={styles.planHeader}>
        <Text style={[styles.planName, { color: theme.colors.text }]}>
          {plan.name}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: '#667eea' }]}>
            ₹{plan.price}
          </Text>
          {plan.duration && (
            <Text style={[styles.duration, { color: theme.colors.textSecondary }]}>
              /{plan.duration}
            </Text>
          )}
        </View>
      </View>

      {plan.features && plan.features.length > 0 && (
        <View style={styles.featuresList}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Icon name="check-circle" size={16} color="#28a745" />
              <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      )}

      {isSelected && (
        <View style={[styles.selectedIndicator, { backgroundColor: '#667eea' }]}>
          <Icon name="check" size={16} color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  planCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
    minHeight: 120,
  },
  singlePlanCard: {
    maxWidth: '90%',
    width: '90%',
    alignSelf: 'center',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planHeader: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 14,
    marginLeft: 2,
  },
  featuresList: {
    flex: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PlanCard;
