import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

interface AutopayToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const AutopayToggle: React.FC<AutopayToggleProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { opacity: disabled ? 0.6 : 1 }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Enable Auto Renewal
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Never miss a payment - renew automatically
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.toggle,
            {
              backgroundColor: value ? '#667eea' : theme.colors.inputBackground,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={() => onValueChange(!value)}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.toggleThumb,
              {
                backgroundColor: value ? '#ffffff' : theme.colors.textSecondary,
                transform: [{ translateX: value ? 20 : 0 }],
              }
            ]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
  },
});

export default AutopayToggle;
