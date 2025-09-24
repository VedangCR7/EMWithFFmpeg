# Video Processing Feature

## Overview

The Video Processing feature integrates `react-native-video-processing` library to enable full video editing capabilities with overlays, text, images, logos, and watermarks. This feature allows users to create professional videos with custom elements and export them with high quality.

## Features

### Core Capabilities
- **Video Overlay Processing**: Add text, images, and logos to videos
- **Watermark Integration**: Automatic watermark for non-subscribed users
- **High-Quality Export**: Support for multiple quality levels and formats
- **Real-time Preview**: See overlays in real-time during editing
- **Gallery Integration**: Save processed videos to device gallery
- **Progress Tracking**: Visual feedback during processing

### Advanced Features
- **Video Compression**: Optimize file size while maintaining quality
- **Video Trimming**: Cut videos to specific time ranges
- **Audio Integration**: Add custom audio tracks to videos
- **Format Support**: MP4 and MOV output formats
- **Cross-Platform**: Works on both Android and iOS

## Implementation

### Dependencies

```json
{
  "react-native-video-processing": "^2.0.0",
  "react-native-fs": "^2.20.0",
  "react-native-video": "^5.2.1"
}
```

### Service Architecture

#### VideoProcessingService (`src/services/videoProcessingService.ts`)

The core service that handles all video processing operations:

```typescript
class VideoProcessingService {
  // Process video with overlays
  async processVideoWithOverlays(options: VideoProcessingOptions): Promise<string>
  
  // Compress video
  async compressVideo(inputPath: string, quality: 'low' | 'medium' | 'high'): Promise<string>
  
  // Trim video
  async trimVideo(inputPath: string, startTime: number, endTime: number): Promise<string>
  
  // Add audio to video
  async addAudioToVideo(videoPath: string, audioPath: string): Promise<string>
  
  // Save to gallery
  async saveToGallery(videoPath: string): Promise<boolean>
}
```

### Key Components

#### VideoEditorScreen
- **Real-time Preview**: Shows video with overlays during editing
- **Processing UI**: Progress indicators and loading states
- **Layer Management**: Add, edit, and remove text, image, and logo layers
- **Watermark Integration**: Conditional watermark based on subscription status

#### VideoPreviewScreen
- **Processed Video Display**: Shows final video with all overlays
- **Download Functionality**: Save to device gallery with proper permissions
- **Share Integration**: Native sharing capabilities
- **Quality Assurance**: Verify processed video before sharing

## Usage Flow

### 1. Video Selection
```typescript
// User selects video from gallery or camera
const selectedVideo = {
  uri: 'file://path/to/video.mp4',
  title: 'My Event Video',
  description: 'Custom video with overlays'
};
```

### 2. Layer Addition
```typescript
// Add text overlay
const textLayer: VideoLayer = {
  id: 'text-1',
  type: 'text',
  content: 'Event Title',
  position: { x: 50, y: 50 },
  size: { width: 200, height: 40 },
  rotation: 0,
  zIndex: 1,
  style: {
    fontSize: 24,
    color: '#ffffff',
    fontFamily: 'System',
    fontWeight: 'bold'
  }
};

// Add image overlay
const imageLayer: VideoLayer = {
  id: 'image-1',
  type: 'image',
  content: 'file://path/to/image.jpg',
  position: { x: 100, y: 100 },
  size: { width: 150, height: 150 },
  rotation: 0,
  zIndex: 2
};
```

### 3. Video Processing
```typescript
// Process video with overlays
const processedVideoPath = await videoProcessingService.processVideoWithOverlays({
  inputPath: selectedVideo.uri,
  outputPath: '', // Auto-generated
  layers: [textLayer, imageLayer],
  watermark: !isSubscribed,
  quality: 'high',
  format: 'mp4'
});
```

### 4. Export and Share
```typescript
// Save to gallery
const success = await videoProcessingService.saveToGallery(processedVideoPath);

// Share video
await Share.share({
  message: 'Check out my custom video!',
  url: processedVideoPath
});
```

## Configuration

### Android Permissions
```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

### iOS Permissions
```xml
<!-- Info.plist -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>This app needs access to save videos to your photo library.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to your photo library to select videos.</string>
```

## Quality Settings

### Processing Quality Levels
- **Low**: Faster processing, smaller file size, reduced quality
- **Medium**: Balanced processing speed and quality (default)
- **High**: Slower processing, larger file size, best quality

### Output Formats
- **MP4**: Widely compatible, good compression
- **MOV**: Apple ecosystem optimized, higher quality

## Error Handling

### Common Issues and Solutions

#### Permission Denied
```typescript
// Request storage permission
const hasPermission = await videoProcessingService.requestStoragePermission();
if (!hasPermission) {
  Alert.alert('Permission Required', 'Storage permission is required to process videos.');
  return;
}
```

#### Processing Failure
```typescript
try {
  const result = await videoProcessingService.processVideoWithOverlays(options);
  // Handle success
} catch (error) {
  console.error('Video processing error:', error);
  Alert.alert('Processing Error', 'Failed to process video. Please try again.');
}
```

#### Storage Space
```typescript
// Check available storage before processing
const availableSpace = await RNFS.getFSInfo();
if (availableSpace.freeSpace < requiredSpace) {
  Alert.alert('Storage Full', 'Please free up some space before processing videos.');
  return;
}
```

## Performance Optimization

### Memory Management
- **Temporary File Cleanup**: Automatic cleanup of old processed files
- **Progress Tracking**: Real-time progress updates to prevent UI freezing
- **Batch Processing**: Process multiple videos efficiently

### Processing Optimization
```typescript
// Optimize for different device capabilities
const processingOptions = {
  quality: deviceCapabilities.isHighEnd ? 'high' : 'medium',
  format: Platform.OS === 'ios' ? 'mov' : 'mp4',
  // Additional optimization parameters
};
```

## Testing

### Test Scenarios
1. **Basic Processing**: Add text overlay to video
2. **Complex Overlays**: Multiple layers with different types
3. **Watermark Testing**: Verify watermark appears for non-subscribed users
4. **Quality Testing**: Test different quality settings
5. **Error Handling**: Test with invalid inputs and permissions
6. **Performance Testing**: Test with large video files

### Test Data
```typescript
const testVideo = {
  uri: 'file://test-video.mp4',
  duration: 30, // seconds
  size: '10MB',
  format: 'mp4'
};

const testLayers = [
  // Text layer
  { type: 'text', content: 'Test Text', position: { x: 50, y: 50 } },
  // Image layer
  { type: 'image', content: 'file://test-image.jpg', position: { x: 100, y: 100 } },
  // Logo layer
  { type: 'logo', content: 'file://test-logo.png', position: { x: 200, y: 50 } }
];
```

## Future Enhancements

### Planned Features
- **Video Filters**: Apply color filters and effects
- **Transitions**: Smooth transitions between video segments
- **Audio Editing**: Trim and adjust audio tracks
- **Templates**: Pre-designed video templates
- **Cloud Processing**: Server-side video processing for heavy tasks
- **Batch Export**: Process multiple videos simultaneously

### Performance Improvements
- **Hardware Acceleration**: GPU-accelerated video processing
- **Background Processing**: Process videos in background threads
- **Caching**: Cache processed videos for faster access
- **Compression Algorithms**: Advanced compression for better quality/size ratio

## Troubleshooting

### Common Issues

#### Video Not Playing
- Check video format compatibility
- Verify file path is correct
- Ensure video file is not corrupted

#### Processing Takes Too Long
- Reduce quality setting
- Check device performance
- Close other resource-intensive apps

#### Overlays Not Visible
- Check layer z-index values
- Verify overlay positions are within video bounds
- Ensure overlay content is valid

#### Gallery Save Fails
- Check storage permissions
- Verify sufficient storage space
- Ensure file path is accessible

## Support

For technical support or feature requests related to video processing:
- Check the `react-native-video-processing` documentation
- Review error logs in development console
- Test with different video formats and sizes
- Verify device compatibility and permissions
