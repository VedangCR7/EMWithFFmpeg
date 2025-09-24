# Greeting Templates Feature

## Overview
A comprehensive greeting templates feature has been implemented that allows users to browse, edit, and create personalized greeting cards with text, stickers, and emojis.

## Features Implemented

### 1. Backend Service (`src/services/greetingTemplates.ts`)
- **API Integration**: Connects to backend endpoints for greeting templates
- **Mock Data**: Provides fallback mock data when API is unavailable
- **Categories**: Good Morning, Good Night, Quotes, Birthday, Anniversary, Congratulations, Thank You, Festival
- **Template Management**: Like, download, and search functionality
- **Stickers & Emojis**: Comprehensive collection of stickers and emojis

### 2. Template Gallery (`src/screens/GreetingTemplatesScreen.tsx`)
- **Category Tabs**: Horizontal scrolling tabs for different greeting categories
- **Search Functionality**: Real-time search with debouncing
- **Template Cards**: Beautiful cards with preview, stats, and action buttons
- **Premium Support**: Premium template restrictions with upgrade prompts
- **Pull-to-Refresh**: Refresh templates from backend
- **Responsive Design**: Adapts to different screen sizes

### 3. Template Cards (`src/components/GreetingTemplateCard.tsx`)
- **Visual Design**: Modern card design with gradients and shadows
- **Interactive Elements**: Like, download, and edit buttons
- **Premium Badges**: Clear indication of premium templates
- **Stats Display**: Shows likes and downloads
- **Responsive Layout**: Adapts to different screen sizes

### 4. Sticker & Emoji Picker (`src/components/StickerEmojiPicker.tsx`)
- **Dual Tabs**: Separate tabs for stickers and emojis
- **Search Functionality**: Search within stickers and emojis
- **Recent Items**: Quick access to recently used items
- **Grid Layout**: Organized grid display
- **Modal Interface**: Full-screen modal for easy selection

### 5. Greeting Editor (`src/screens/GreetingEditorScreen.tsx`)
- **Canvas Editor**: Editable canvas similar to main poster editor
- **Text Editing**: Add, edit, and style text elements
- **Sticker/Emoji Support**: Add stickers and emojis to canvas
- **Background Customization**: Upload custom backgrounds
- **Element Management**: Select, move, and delete elements
- **Save & Share**: Export and share functionality
- **Responsive Canvas**: Adapts to different screen sizes

### 6. Navigation Integration
- **Route Configuration**: Added to main navigation stack
- **Home Screen Integration**: Quick access section on home screen
- **Type Safety**: Proper TypeScript interfaces for navigation

## Category Structure

### Greeting Categories
1. **Good Morning** - Sunrise and coffee-themed greetings
2. **Good Night** - Evening and bedtime greetings  
3. **Quotes** - Inspirational and motivational quotes
4. **Birthday** - Birthday celebration templates
5. **Anniversary** - Love and celebration templates
6. **Congratulations** - Achievement and success templates
7. **Thank You** - Gratitude and appreciation templates
8. **Festival** - Cultural and holiday templates

### Template Features
- **Text Content**: Editable text with multiple fonts and colors
- **Background Images**: Custom background support
- **Stickers**: Decorative elements and symbols
- **Emojis**: Expressive emoji support
- **Layout Options**: Vertical, horizontal, and square layouts
- **Premium Content**: Premium templates with subscription requirements

## Technical Implementation

### State Management
- **Template State**: Manages template data and filtering
- **Editor State**: Handles canvas elements and editing
- **UI State**: Manages modals, loading states, and selections

### API Endpoints
- `GET /greeting-categories` - Fetch all categories
- `GET /greeting-templates` - Fetch templates with filters
- `GET /greeting-templates?category={id}` - Fetch by category
- `GET /greeting-templates/search?q={query}` - Search templates
- `POST /greeting-templates/{id}/like` - Like/unlike template
- `POST /greeting-templates/{id}/download` - Download template
- `GET /stickers` - Fetch available stickers
- `GET /emojis` - Fetch available emojis

### Responsive Design
- **Screen Size Detection**: Automatic detection of small, medium, and large screens
- **Responsive Spacing**: Dynamic spacing based on screen size
- **Responsive Fonts**: Font sizes that adapt to screen size
- **Flexible Layouts**: Grid layouts that adjust to available space

### Performance Optimizations
- **Memoization**: React.memo and useCallback for performance
- **Lazy Loading**: Templates load as needed
- **Image Optimization**: Optimized image loading and caching
- **Debounced Search**: Prevents excessive API calls during typing

## Usage Flow

1. **Browse Templates**: Users can browse templates by category on the home screen
2. **Select Template**: Tap on a template card to view details
3. **Edit Template**: Open the editor to customize the template
4. **Add Elements**: Add text, stickers, and emojis to the canvas
5. **Customize**: Edit text styles, colors, and positioning
6. **Save & Share**: Save the greeting and share it with others

## Future Enhancements

### Potential Additions
- **Template Creation**: Allow users to create and share their own templates
- **Advanced Editing**: More text effects, filters, and editing tools
- **Collaboration**: Share templates with team members
- **Analytics**: Track template usage and popularity
- **AI Integration**: AI-powered template suggestions
- **Social Features**: Like, comment, and share templates
- **Offline Support**: Download templates for offline use

### Technical Improvements
- **Caching**: Implement template caching for better performance
- **Progressive Loading**: Load templates progressively
- **Image Compression**: Optimize image sizes for faster loading
- **Background Sync**: Sync changes when connection is restored

## File Structure

```
src/
├── services/
│   └── greetingTemplates.ts          # Backend service
├── components/
│   ├── GreetingTemplateCard.tsx      # Template card component
│   └── StickerEmojiPicker.tsx        # Sticker/emoji picker
├── screens/
│   ├── GreetingTemplatesScreen.tsx   # Template gallery
│   └── GreetingEditorScreen.tsx      # Template editor
└── navigation/
    └── AppNavigator.tsx              # Navigation configuration
```

## Integration Points

### Home Screen
- Added greeting templates section with category previews
- Quick navigation to template gallery
- Visual category cards with icons and descriptions

### Navigation
- Integrated into main navigation stack
- Proper route typing and parameter passing
- Seamless navigation between screens

### Theme System
- Fully integrated with existing theme system
- Dark/light mode support
- Consistent styling across all components

This implementation provides a complete greeting templates solution that integrates seamlessly with the existing EventMarketers application while maintaining high performance and user experience standards.
