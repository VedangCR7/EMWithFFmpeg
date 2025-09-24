import { Platform } from 'react-native';

// Google Fonts that work well with React Native
export interface GoogleFont {
  name: string;
  displayName: string;
  webFont: string;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
}

export const GOOGLE_FONTS: GoogleFont[] = [
  // Sans-serif fonts
  {
    name: 'Roboto',
    displayName: 'Roboto',
    webFont: 'Roboto',
    category: 'sans-serif'
  },
  {
    name: 'OpenSans',
    displayName: 'Open Sans',
    webFont: 'Open Sans',
    category: 'sans-serif'
  },
  {
    name: 'Lato',
    displayName: 'Lato',
    webFont: 'Lato',
    category: 'sans-serif'
  },
  {
    name: 'Poppins',
    displayName: 'Poppins',
    webFont: 'Poppins',
    category: 'sans-serif'
  },
  {
    name: 'Montserrat',
    displayName: 'Montserrat',
    webFont: 'Montserrat',
    category: 'sans-serif'
  },
  {
    name: 'Inter',
    displayName: 'Inter',
    webFont: 'Inter',
    category: 'sans-serif'
  },
  {
    name: 'Nunito',
    displayName: 'Nunito',
    webFont: 'Nunito',
    category: 'sans-serif'
  },
  {
    name: 'Ubuntu',
    displayName: 'Ubuntu',
    webFont: 'Ubuntu',
    category: 'sans-serif'
  },
  
  // Serif fonts
  {
    name: 'PlayfairDisplay',
    displayName: 'Playfair Display',
    webFont: 'Playfair Display',
    category: 'serif'
  },
  {
    name: 'Merriweather',
    displayName: 'Merriweather',
    webFont: 'Merriweather',
    category: 'serif'
  },
  {
    name: 'Lora',
    displayName: 'Lora',
    webFont: 'Lora',
    category: 'serif'
  },
  {
    name: 'SourceSerifPro',
    displayName: 'Source Serif Pro',
    webFont: 'Source Serif Pro',
    category: 'serif'
  },
  
  // Display fonts
  {
    name: 'Oswald',
    displayName: 'Oswald',
    webFont: 'Oswald',
    category: 'display'
  },
  {
    name: 'BebasNeue',
    displayName: 'Bebas Neue',
    webFont: 'Bebas Neue',
    category: 'display'
  },
  {
    name: 'Anton',
    displayName: 'Anton',
    webFont: 'Anton',
    category: 'display'
  },
  {
    name: 'Righteous',
    displayName: 'Righteous',
    webFont: 'Righteous',
    category: 'display'
  },
  
  // Handwriting fonts
  {
    name: 'DancingScript',
    displayName: 'Dancing Script',
    webFont: 'Dancing Script',
    category: 'handwriting'
  },
  {
    name: 'Pacifico',
    displayName: 'Pacifico',
    webFont: 'Pacifico',
    category: 'handwriting'
  },
  {
    name: 'GreatVibes',
    displayName: 'Great Vibes',
    webFont: 'Great Vibes',
    category: 'handwriting'
  },
  {
    name: 'Satisfy',
    displayName: 'Satisfy',
    webFont: 'Satisfy',
    category: 'handwriting'
  },
  
  // Monospace fonts
  {
    name: 'RobotoMono',
    displayName: 'Roboto Mono',
    webFont: 'Roboto Mono',
    category: 'monospace'
  },
  {
    name: 'SourceCodePro',
    displayName: 'Source Code Pro',
    webFont: 'Source Code Pro',
    category: 'monospace'
  },
  {
    name: 'FiraCode',
    displayName: 'Fira Code',
    webFont: 'Fira Code',
    category: 'monospace'
  },
  {
    name: 'JetBrainsMono',
    displayName: 'JetBrains Mono',
    webFont: 'JetBrains Mono',
    category: 'monospace'
  }
];

// System fonts as fallback
export const SYSTEM_FONTS = {
  default: 'System',
  serif: 'serif',
  monospace: 'monospace',
  cursive: 'cursive',
  fantasy: 'fantasy'
};

// Get font family name for React Native
export const getFontFamily = (fontName: string): string => {
  // Check if it's a system font
  if (Object.values(SYSTEM_FONTS).includes(fontName)) {
    return fontName;
  }
  
  // Check if it's a Google Font
  const googleFont = GOOGLE_FONTS.find(font => font.name === fontName);
  if (googleFont) {
    // For React Native, we'll use the web font name
    // In a real implementation, you'd need to link the actual font files
    return googleFont.webFont;
  }
  
  // Fallback to system font
  return SYSTEM_FONTS.default;
};

// Get fonts by category
export const getFontsByCategory = (category: GoogleFont['category']) => {
  return GOOGLE_FONTS.filter(font => font.category === category);
};

// Get font by name
export const getFontByName = (name: string) => {
  return GOOGLE_FONTS.find(font => font.name === name);
};

// Get all available fonts (system + Google)
export const getAllFonts = () => {
  return [
    ...Object.entries(SYSTEM_FONTS).map(([key, value]) => ({
      name: value,
      displayName: key.charAt(0).toUpperCase() + key.slice(1),
      webFont: value,
      category: 'system' as const
    })),
    ...GOOGLE_FONTS
  ];
};
