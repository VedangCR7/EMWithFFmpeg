import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useTheme } from '../context/ThemeContext';
import BusinessProfilesScreen from '../../src/screens/BusinessProfilesScreen';

// Mock dependencies
jest.mock('../context/ThemeContext');
jest.mock('../services/businessProfile');
jest.mock('../services/userBusinessProfiles');
jest.mock('../services/auth');
jest.mock('../components/BusinessProfileForm');
jest.mock('../components/BottomSheet');

const mockTheme = {
  colors: {
    background: '#ffffff',
    cardBackground: '#f8f9fa',
    primary: '#007bff',
    text: '#333333',
    textSecondary: '#666666',
    error: '#dc3545',
    surface: '#ffffff',
    inputBackground: '#e9ecef',
    border: '#dee2e6',
    gradient: ['#007bff', '#0056b3']
  }
};

describe('BusinessProfilesScreen', () => {
  beforeEach(() => {
    (useTheme as jest.Mock).mockReturnValue({
      isDarkMode: false,
      theme: mockTheme
    });
  });

  test('renders correctly with empty state', () => {
    const { getByText } = render(<BusinessProfilesScreen />);
    expect(getByText('Business Profiles')).toBeTruthy();
  });

  test('displays search functionality', () => {
    const { getByPlaceholderText } = render(<BusinessProfilesScreen />);
    expect(getByPlaceholderText('Search business profiles...')).toBeTruthy();
  });

  test('shows add button in header', () => {
    const { getByTestId } = render(<BusinessProfilesScreen />);
    // Add button should be present
    const addButton = getByTestId('add-button');
    expect(addButton).toBeTruthy();
  });
});
