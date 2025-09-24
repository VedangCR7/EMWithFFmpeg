# Watermark Feature Implementation

This document describes the complete watermark feature implementation for the EventMarketers app.

## Overview

The watermark feature provides a way to add branded watermarks to posters based on the user's subscription status. When users don't have an active subscription, a watermark appears on the **preview screen** of their posters. When they have an active subscription, the watermark is hidden. The watermark is **only added during the capture process** when the user clicks the "Next" button - it does not appear during editing, ensuring a clean editing experience while still being included in the final exported poster.

## Features

### ✅ **Core Functionality**
1. **Subscription-based Display**: Watermark only shows when user is NOT subscribed
2. **Semi-transparent Design**: Professional, non-intrusive appearance
3. **Bottom-right Positioning**: Standard watermark placement
4. **Advanced Responsive Design**: Adapts to any mobile screen size (phones, tablets, different orientations)
5. **Export Integration**: Included in final image capture
6. **Context API State Management**: Centralized subscription state

### ✅ **Components Created**

#### 1. **SubscriptionContext** (`src/contexts/SubscriptionContext.tsx`)
- Manages subscription status across the app
- Provides `isSubscribed` boolean and `setIsSubscribed` function
- Uses React Context API for global state management

#### 2. **Watermark Component** (`src/components/Watermark.tsx`)
- Reusable watermark component
- Conditional rendering based on subscription status
- Advanced responsive design with dynamic sizing for all screen sizes
- Supports both text and image watermarks
- Professional styling with shadows and transparency
- Adaptive positioning and scaling for phones, tablets, and different orientations

#### 3. **PosterPreviewScreen** (`src/screens/PosterPreviewScreen.tsx`)
- **Preview screen displaying captured image with watermark** (watermark is part of captured image)
- Receives subscription status from editor screen
- Export simulation
- Displays final poster with embedded watermark

#### 4. **WatermarkDemo** (`src/components/WatermarkDemo.tsx`)
- Complete demo component showcasing the feature
- Interactive subscription toggle
- Visual status indicators
- Instructions and examples

## Implementation Details

### **State Management**
```typescript
// Using Context API for global subscription state
const { isSubscribed, setIsSubscribed } = useSubscription();
```

### **Watermark Logic**
```typescript
// Watermark only renders when user is NOT subscribed
if (isSubscribed) {
  return null;
}
```

### **Advanced Responsive Design**
```typescript
// Calculate responsive values based on screen size
const getResponsiveValues = () => {
  const baseDimension = Math.min(screenWidth, screenHeight);
  
  const fontSize = Math.max(10, Math.min(16, baseDimension * 0.03));
  const paddingHorizontal = Math.max(8, Math.min(16, baseDimension * 0.02));
  const bottomPosition = Math.max(10, Math.min(30, screenHeight * 0.02));
  const rightPosition = Math.max(10, Math.min(25, screenWidth * 0.02));
  
  return { fontSize, paddingHorizontal, bottomPosition, rightPosition };
};
```

### **Professional Styling**
```typescript
// Semi-transparent background with border
backgroundColor: 'rgba(0, 0, 0, 0.3)',
borderColor: 'rgba(255, 255, 255, 0.2)',
textShadowColor: 'rgba(0, 0, 0, 0.5)',
```

## Usage Examples

### **Basic Usage**
```typescript
import Watermark from '../components/Watermark';
import { useSubscription } from '../contexts/SubscriptionContext';

const MyComponent = () => {
  const { isSubscribed } = useSubscription();
  
  return (
    <View style={styles.container}>
      {/* Your poster content */}
      <Watermark isSubscribed={isSubscribed} />
    </View>
  );
};
```

### **With Custom Styling**
```typescript
<Watermark 
  isSubscribed={isSubscribed} 
  style={{ bottom: 30, right: 30 }} 
/>
```

### **Integration in Preview Screen**
```typescript
// Added to PosterPreviewScreen.tsx
<View style={styles.posterBackground}>
  {/* Poster content */}
  <Watermark isSubscribed={isSubscribed} />
</View>
```

## Setup Instructions

### **1. Wrap App with SubscriptionProvider**
```typescript
// In your main App.tsx or navigation setup
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';

const App = () => {
  return (
    <SubscriptionProvider>
      {/* Your app components */}
    </SubscriptionProvider>
  );
};
```

### **2. Use in Components**
```typescript
import { useSubscription } from '../contexts/SubscriptionContext';
import Watermark from '../components/Watermark';

const MyScreen = () => {
  const { isSubscribed } = useSubscription();
  
  return (
    <View>
      {/* Your content */}
      <Watermark isSubscribed={isSubscribed} />
    </View>
  );
};
```

### **3. Test Subscription Toggle**
```typescript
const { isSubscribed, setIsSubscribed } = useSubscription();

const toggleSubscription = () => {
  setIsSubscribed(!isSubscribed);
};
```

## Customization Options

### **Text Watermark**
- Change text: `"Made with EventMarketers"`
- Modify colors, fonts, and opacity
- Adjust positioning and size

### **Image Watermark**
- Uncomment image watermark code in Watermark component
- Add your logo image to assets
- Customize size and opacity

### **Styling**
- Modify `watermarkContainer` for positioning
- Adjust `textWatermark` for background styling
- Change `watermarkText` for text appearance

## Export Integration

The watermark is automatically included in exported images because it's rendered as part of the poster canvas. When using ViewShot or similar capture methods, the watermark will be included in the final image.

## Testing

### **Manual Testing**
1. Use the WatermarkDemo component to test functionality
2. Toggle subscription status to see watermark appear/disappear
3. Test on different screen sizes (phones, tablets, different orientations)
4. Verify watermark appears in exported images
5. Test responsive scaling on various device sizes

### **Subscription States**
- **isSubscribed: false** → Watermark visible
- **isSubscribed: true** → Watermark hidden

## Future Enhancements

### **Possible Improvements**
1. **Multiple Watermark Styles**: Different designs for different subscription tiers
2. **Custom Watermark Text**: Allow users to customize watermark text
3. **Watermark Positioning**: Let users choose watermark position
4. **Watermark Opacity Control**: Adjustable transparency levels
5. **Watermark Animation**: Subtle animations for premium users
6. **Watermark Templates**: Pre-designed watermark templates

### **Advanced Features**
1. **Watermark Analytics**: Track watermark impressions
2. **A/B Testing**: Test different watermark designs
3. **Dynamic Watermarks**: Personalized watermarks per user
4. **Watermark Scheduling**: Time-based watermark display

## Dependencies

### **Required Packages**
- `react-native-vector-icons` (for icons)
- `react-native-linear-gradient` (for gradients)
- `react-native-view-shot` (for export functionality)

### **Optional Packages**
- `react-native-image-picker` (for logo uploads)
- `@react-native-async-storage/async-storage` (for persistent subscription state)

## Troubleshooting

### **Common Issues**
1. **Watermark not showing**: Check if `isSubscribed` is false
2. **Watermark too large/small**: The responsive system automatically adjusts - check screen dimensions
3. **Watermark not in export**: Ensure watermark is inside ViewShot container
4. **Context not working**: Verify SubscriptionProvider is wrapping your app
5. **Responsive issues**: Ensure device supports the minimum/maximum size constraints

### **Debug Tips**
```typescript
// Add console logs to debug subscription state
console.log('Subscription status:', isSubscribed);
console.log('Watermark should be visible:', !isSubscribed);
```

## Conclusion

The watermark feature provides a professional way to encourage subscriptions while maintaining a good user experience. The implementation is modular, reusable, and easily customizable for future needs.

The feature successfully demonstrates:
- ✅ Conditional rendering based on subscription status
- ✅ Professional, semi-transparent design
- ✅ Advanced responsive layout for all mobile screen sizes
- ✅ Integration with export functionality
- ✅ Clean state management with Context API
- ✅ Complete demo and documentation
- ✅ Adaptive scaling for phones, tablets, and different orientations
