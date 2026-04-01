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

// Map each Google font to a platform-native fallback that is guaranteed to exist
const PLATFORM_FONT_MAP: Record<string, { android: string; ios: string }> = {
  OpenSans: { android: 'sans-serif-medium', ios: 'HelveticaNeue-Medium' },
  Lato: { android: 'sans-serif-light', ios: 'HelveticaNeue-Light' },
  Poppins: { android: 'sans-serif-condensed', ios: 'AvenirNext-DemiBold' },
  Montserrat: { android: 'sans-serif-black', ios: 'Avenir-Black' },
  Nunito: { android: 'sans-serif-smallcaps', ios: 'GillSans' },
  Ubuntu: { android: 'sans-serif-medium', ios: 'HelveticaNeue-Medium' },
  PlayfairDisplay: { android: 'serif', ios: 'Times New Roman' },
  Merriweather: { android: 'serif', ios: 'Georgia' },
  Lora: { android: 'serif', ios: 'Palatino' },
  SourceSerifPro: { android: 'serif', ios: 'Didot' },
  Oswald: { android: 'sans-serif-condensed', ios: 'AvenirNext-CondensedBold' },
  BebasNeue: { android: 'sans-serif-condensed', ios: 'Impact' },
  Anton: { android: 'sans-serif-black', ios: 'AvenirNext-Heavy' },
  Righteous: { android: 'sans-serif-medium', ios: 'GillSans-Bold' },
  DancingScript: { android: 'cursive', ios: 'SnellRoundhand' },
  Satisfy: { android: 'casual', ios: 'ChalkboardSE-Regular' },
  RobotoMono: { android: 'monospace', ios: 'Courier' },
  SourceCodePro: { android: 'monospace', ios: 'CourierNewPSMT' },
  FiraCode: { android: 'monospace', ios: 'Menlo-Regular' },
  JetBrainsMono: { android: 'monospace', ios: 'Courier' },
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
    const mappedFont = PLATFORM_FONT_MAP[googleFont.name];
    if (mappedFont) {
      return Platform.select(mappedFont) || SYSTEM_FONTS.default;
    }
    // Fallback to category defaults
    switch (googleFont.category) {
      case 'serif':
        return Platform.select({ android: 'serif', ios: 'Times New Roman' }) || SYSTEM_FONTS.serif;
      case 'monospace':
        return Platform.select({ android: 'monospace', ios: 'Courier' }) || SYSTEM_FONTS.monospace;
      case 'handwriting':
        return Platform.select({ android: 'cursive', ios: 'SnellRoundhand' }) || SYSTEM_FONTS.cursive;
      default:
        return Platform.select({ android: 'sans-serif', ios: 'Helvetica Neue' }) || SYSTEM_FONTS.default;
    }
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
