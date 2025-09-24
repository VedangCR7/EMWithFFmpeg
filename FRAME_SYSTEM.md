# Frame System Implementation

## Overview

The frame system allows users to select predefined poster frames with automatic content positioning. When a frame is selected, the user's business profile data (name, logo, contact info) is automatically positioned according to the frame's metadata.

## Architecture

### 1. Frame Data Structure (`src/data/frames.ts`)

```typescript
interface FramePlaceholder {
  type: 'text' | 'image';
  key: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  maxWidth?: number;
  maxHeight?: number;
}

interface Frame {
  id: string;
  name: string;
  background: any; // Image source
  placeholders: FramePlaceholder[];
  category: 'business' | 'event' | 'personal' | 'creative';
  description: string;
}
```

### 2. Frame Selector Component (`src/components/FrameSelector.tsx`)

- Horizontal FlatList displaying available frames
- Shows frame preview with placeholder indicators
- Handles frame selection
- Displays frame name and category

### 3. Frame Utilities (`src/utils/frameUtils.ts`)

- `mapBusinessProfileToFrameContent()`: Maps business profile data to frame content keys
- `generateLayersFromFrame()`: Creates layers from frame metadata and content
- `getFrameBackgroundSource()`: Returns frame background image source

## Usage

### 1. Adding a New Frame

1. Add frame data to `src/data/frames.ts`:
```typescript
{
  id: 'my-custom-frame',
  name: 'My Custom Frame',
  background: { uri: 'path/to/frame/image.png' },
  placeholders: [
    {
      type: 'text',
      key: 'companyName',
      x: 50,
      y: 100,
      fontSize: 24,
      color: '#FFFFFF',
      fontFamily: 'System',
      fontWeight: 'bold',
      textAlign: 'left',
      maxWidth: 300
    },
    {
      type: 'image',
      key: 'logo',
      x: 50,
      y: 200,
      width: 80,
      height: 80
    }
  ],
  category: 'business',
  description: 'Custom business frame'
}
```

2. Add frame image to `src/assets/frames/` directory

### 2. Content Mapping

The system automatically maps business profile fields to frame placeholders:

- `companyName` → Business name
- `tagline` → Business description
- `logo` → Company logo
- `contact` → Formatted contact information
- `brandName` → Business name (alternative)
- `slogan` → Business description (alternative)
- `name` → Business name (personal frames)
- `title` → Business category
- `profileImage` → Company logo (personal frames)
- `eventTitle` → Business name (event frames)
- `eventDate` → Current date
- `organizer` → Business name (event frames)

### 3. Frame Selection Flow

1. User taps "Frame" button in toolbar
2. FrameSelector component displays available frames
3. User selects a frame
4. `applyFrame()` function is called
5. Business profile data is mapped to frame content
6. Layers are generated from frame metadata
7. Canvas is updated with new background and positioned content

## Features

### Automatic Positioning
- Content is positioned using absolute coordinates from frame metadata
- Text and images are placed at predefined x, y coordinates
- Font styles, colors, and sizes are applied automatically

### Frame Categories
- **Business**: Professional templates for companies
- **Event**: Templates for events and celebrations
- **Personal**: Templates for personal branding
- **Creative**: Artistic and bold designs

### Content Types
- **Text**: Company names, descriptions, contact info
- **Images**: Logos, profile pictures

### Styling Options
- Font size, family, weight
- Text color and alignment
- Image dimensions
- Maximum width/height constraints

## Integration with Poster Editor

The frame system integrates seamlessly with the existing poster editor:

- Frames can be selected and applied at any time
- Existing layers are replaced when a frame is applied
- Frame content respects the existing layer system
- Users can still manually edit positioned content
- Field visibility toggles work with frame-generated layers

## Future Enhancements

1. **Frame Categories**: Filter frames by category
2. **Custom Frames**: Allow users to create custom frames
3. **Frame Preview**: Show live preview of content placement
4. **Frame Templates**: Save frame configurations as templates
5. **Responsive Frames**: Frames that adapt to different aspect ratios
6. **Frame Animation**: Animated frame transitions
7. **Frame Sharing**: Share custom frames between users
