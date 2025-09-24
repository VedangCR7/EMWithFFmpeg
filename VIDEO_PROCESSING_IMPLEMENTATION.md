# Video Processing Implementation Guide

This guide explains how to implement video processing with overlays in the EventMarketers app.

## Current Implementation

The current implementation provides a foundation for video processing with the following features:

### 1. Video Canvas Capture
- Uses `react-native-view-shot` to capture the video canvas with overlays
- Captures the entire video player area including all text, image, and logo layers
- Generates a high-quality JPEG image of the canvas

### 2. Video Processing Service
- `VideoProcessingService` handles all video processing operations
- Supports both canvas-based and layer-based processing
- Includes permission handling for storage access
- Provides progress tracking and error handling

### 3. Video Preview Integration
- `VideoPreviewScreen` displays the processed video
- Falls back to layer rendering if no processed video is available
- Supports both processed video playback and real-time layer rendering

## How It Works

### Step 1: Video Editor Screen
1. User adds text, images, and logos to the video
2. User clicks "Next" button
3. System captures the video canvas with all overlays
4. Video processing service processes the canvas image

### Step 2: Video Processing
1. Canvas image is captured using `ViewShot`
2. Video processing service creates a video from the canvas
3. In a full implementation, FFmpeg would be used to:
   - Create a video from the canvas image
   - Set the duration to match the original video
   - Apply any additional effects

### Step 3: Video Preview
1. Processed video is passed to the preview screen
2. Preview screen plays the processed video
3. If no processed video is available, layers are rendered in real-time

## Implementation Details

### Canvas Capture
```typescript
// Capture the canvas with overlays
const canvasImageUri = await canvasRef.current.capture({
  format: 'jpg',
  quality: 0.9,
  width: videoCanvasWidth,
  height: videoCanvasHeight,
});
```

### Video Processing
```typescript
// Process video with overlays
const processedVideoPath = await videoProcessingService.processVideoWithOverlays(
  selectedVideo.uri,
  layers,
  { 
    addWatermark: !isSubscribed,
    canvasImage: canvasImageUri
  }
);
```

### Navigation to Preview
```typescript
navigation.navigate('VideoPreview', {
  selectedVideo: {
    ...selectedVideo,
    uri: processedVideoPath,
  },
  layers,
  selectedProfile,
  processedVideoPath,
  canvasData: {
    width: videoCanvasWidth,
    height: videoCanvasHeight,
    layers: layers,
  },
});
```

## Full Implementation Requirements

### 1. FFmpeg Integration
To implement actual video processing, you'll need to integrate FFmpeg:

```bash
# Install FFmpeg for React Native
npm install react-native-ffmpeg
```

### 2. Video Processing Commands
Example FFmpeg commands for video processing:

```bash
# Create video from canvas image
ffmpeg -loop 1 -i canvas_image.jpg -c:v libx264 -t 10 -pix_fmt yuv420p output.mp4

# Overlay image on video
ffmpeg -i input_video.mp4 -i overlay_image.png -filter_complex "overlay=10:10" output.mp4

# Add text overlay
ffmpeg -i input_video.mp4 -vf "drawtext=text='Hello World':fontcolor=white:fontsize=24:x=10:y=10" output.mp4
```

### 3. Enhanced Video Processing Service
```typescript
import { FFmpegKit } from 'react-native-ffmpeg';

class EnhancedVideoProcessingService {
  async createVideoFromCanvas(canvasImageUri: string, duration: number): Promise<string> {
    const outputPath = `${this.getOutputDirectory()}/canvas_video_${Date.now()}.mp4`;
    
    const command = `-loop 1 -i ${canvasImageUri} -c:v libx264 -t ${duration} -pix_fmt yuv420p ${outputPath}`;
    
    const result = await FFmpegKit.execute(command);
    
    if (result.getReturnCode().isValueSuccess()) {
      return outputPath;
    } else {
      throw new Error('FFmpeg processing failed');
    }
  }
  
  async overlayImageOnVideo(videoUri: string, overlayImageUri: string, position: {x: number, y: number}): Promise<string> {
    const outputPath = `${this.getOutputDirectory()}/overlay_video_${Date.now()}.mp4`;
    
    const command = `-i ${videoUri} -i ${overlayImageUri} -filter_complex "overlay=${position.x}:${position.y}" ${outputPath}`;
    
    const result = await FFmpegKit.execute(command);
    
    if (result.getReturnCode().isValueSuccess()) {
      return outputPath;
    } else {
      throw new Error('FFmpeg overlay failed');
    }
  }
}
```

## Current Limitations

1. **Simulated Processing**: The current implementation simulates video processing
2. **No FFmpeg Integration**: Actual video processing requires FFmpeg library
3. **Limited Overlay Support**: Only basic text and image overlays are supported
4. **No Video Compression**: No optimization for file size or quality

## Next Steps

1. **Integrate FFmpeg**: Add react-native-ffmpeg for actual video processing
2. **Implement Real Processing**: Replace simulation with actual FFmpeg commands
3. **Add Video Compression**: Implement quality and size optimization
4. **Enhance Overlay Support**: Add more overlay types and effects
5. **Add Progress Tracking**: Real-time progress updates during processing
6. **Optimize Performance**: Improve processing speed and memory usage

## Testing

To test the current implementation:

1. Open the VideoEditorScreen
2. Add some text, images, or logos
3. Click the "Next" button
4. Observe the processing progress
5. Check the VideoPreviewScreen for the result

The current implementation will show the original video with layers rendered in real-time, which provides a good foundation for the full video processing implementation.
