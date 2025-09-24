import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  theme: Theme;
}

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
    gradient: string[];
    cardBackground: string;
    inputBackground: string;
    buttonPrimary: string;
    buttonSecondary: string;
    error: string;
    success: string;
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#f8f9ff',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e1e5e9',
    shadow: '#000000',
    gradient: ['#667eea', '#764ba2', '#f093fb'],
    cardBackground: 'rgba(255,255,255,0.95)',
    inputBackground: '#ffffff',
    buttonPrimary: '#667eea',
    buttonSecondary: '#ffffff',
    error: '#FF3B30',
    success: '#34C759',
  },
};

const darkTheme: Theme = {
  colors: {
    primary: '#8B9DFF',
    secondary: '#9B6BFF',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#505050',
    shadow: '#000000',
    gradient: ['#0f0f0f', '#1a1a1a', '#0f0f0f'],
    cardBackground: '#333333',
    inputBackground: '#404040',
    buttonPrimary: '#8B9DFF',
    buttonSecondary: '#404040',
    error: '#FF6B6B',
    success: '#51CF66',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 