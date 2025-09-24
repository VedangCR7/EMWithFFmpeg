import { VideoCanvas, VideoLayer } from '../services/enhancedVideoProcessingService';

// Interface for current video editor elements (adjust based on your actual implementation)
interface CurrentVideoElement {
  id: string;
  type: 'text' | 'image' | 'logo';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  duration?: number;
  startTime?: number;
}

interface CurrentVideoCanvas {
  id: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  elements: CurrentVideoElement[];
  backgroundVideo?: string;
  backgroundImage?: string;
  backgroundColor?: string;
}

/**
 * Convert current video editor canvas to enhanced video processing format
 */
export const convertCanvasToVideoFormat = (currentCanvas: CurrentVideoCanvas): VideoCanvas => {
  const layers: VideoLayer[] = currentCanvas.elements.map((element): VideoLayer => ({
    id: element.id,
    type: element.type,
    content: element.content,
    position: {
      x: element.x,
      y: element.y,
    },
    size: {
      width: element.width,
      height: element.height,
    },
    rotation: element.rotation,
    opacity: element.opacity,
    duration: element.duration,
    startTime: element.startTime,
  }));

  return {
    id: currentCanvas.id,
    name: currentCanvas.name,
    duration: currentCanvas.duration,
    width: currentCanvas.width,
    height: currentCanvas.height,
    fps: currentCanvas.fps,
    layers,
    backgroundVideo: currentCanvas.backgroundVideo,
    backgroundImage: currentCanvas.backgroundImage,
    backgroundColor: currentCanvas.backgroundColor,
  };
};

/**
 * Create a sample video canvas for testing
 */
export const createSampleVideoCanvas = (): VideoCanvas => {
  return {
    id: 'sample_canvas_1',
    name: 'Sample Video Canvas',
    duration: 10,
    width: 1920,
    height: 1080,
    fps: 30,
    layers: [
      {
        id: 'text_layer_1',
        type: 'text',
        content: 'Welcome to Event Marketers',
        position: { x: 100, y: 100 },
        size: { width: 400, height: 100 },
        opacity: 1,
        duration: 10,
        startTime: 0,
      },
      {
        id: 'logo_layer_1',
        type: 'logo',
        content: 'path/to/logo.png',
        position: { x: 50, y: 50 },
        size: { width: 200, height: 200 },
        opacity: 0.8,
        duration: 10,
        startTime: 0,
      },
      {
        id: 'image_layer_1',
        type: 'image',
        content: 'path/to/background.jpg',
        position: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 },
        opacity: 0.5,
        duration: 10,
        startTime: 0,
      },
    ],
    backgroundColor: '#000000',
  };
};

/**
 * Validate video canvas data
 */
export const validateVideoCanvas = (canvas: VideoCanvas): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  if (!canvas.id) errors.push('Canvas ID is required');
  if (!canvas.name) errors.push('Canvas name is required');
  if (canvas.duration <= 0) errors.push('Duration must be greater than 0');
  if (canvas.width <= 0) errors.push('Width must be greater than 0');
  if (canvas.height <= 0) errors.push('Height must be greater than 0');
  if (canvas.fps <= 0) errors.push('FPS must be greater than 0');

  // Check layers
  if (!canvas.layers || canvas.layers.length === 0) {
    errors.push('At least one layer is required');
  } else {
    canvas.layers.forEach((layer, index) => {
      if (!layer.id) errors.push(`Layer ${index + 1}: ID is required`);
      if (!layer.type) errors.push(`Layer ${index + 1}: Type is required`);
      if (!layer.content) errors.push(`Layer ${index + 1}: Content is required`);
      if (layer.position.x < 0) errors.push(`Layer ${index + 1}: X position cannot be negative`);
      if (layer.position.y < 0) errors.push(`Layer ${index + 1}: Y position cannot be negative`);
      if (layer.size.width <= 0) errors.push(`Layer ${index + 1}: Width must be greater than 0`);
      if (layer.size.height <= 0) errors.push(`Layer ${index + 1}: Height must be greater than 0`);
      if (layer.opacity && (layer.opacity < 0 || layer.opacity > 1)) {
        errors.push(`Layer ${index + 1}: Opacity must be between 0 and 1`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get recommended processing options based on canvas
 */
export const getRecommendedProcessingOptions = (canvas: VideoCanvas) => {
  const totalLayers = canvas.layers.length;
  const canvasSize = canvas.width * canvas.height;
  
  // Determine quality based on canvas complexity
  let quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium';
  if (totalLayers > 10 || canvasSize > 2073600) { // More than 1080p
    quality = 'high';
  } else if (totalLayers > 5) {
    quality = 'medium';
  } else {
    quality = 'low';
  }

  // Determine resolution based on canvas size
  let resolution: '720p' | '1080p' | '4k' = '1080p';
  if (canvasSize >= 8294400) { // 4K
    resolution = '4k';
  } else if (canvasSize >= 2073600) { // 1080p
    resolution = '1080p';
  } else {
    resolution = '720p';
  }

  // Determine bitrate based on quality and resolution
  let bitrate = 1000;
  if (quality === 'ultra') bitrate = 4000;
  else if (quality === 'high') bitrate = 2000;
  else if (quality === 'medium') bitrate = 1500;
  else bitrate = 1000;

  return {
    outputFormat: 'mp4' as const,
    quality,
    resolution,
    bitrate,
    audioBitrate: 128,
  };
};

/**
 * Estimate processing time based on canvas complexity
 */
export const estimateProcessingTime = (canvas: VideoCanvas): number => {
  const totalLayers = canvas.layers.length;
  const canvasSize = canvas.width * canvas.height;
  const duration = canvas.duration;
  
  // Base time in seconds
  let baseTime = 30;
  
  // Add time for each layer
  baseTime += totalLayers * 5;
  
  // Add time for canvas size
  if (canvasSize > 2073600) baseTime += 20; // 1080p+
  if (canvasSize > 8294400) baseTime += 40; // 4K
  
  // Add time for duration
  baseTime += duration * 2;
  
  return Math.max(30, baseTime); // Minimum 30 seconds
};

export default {
  convertCanvasToVideoFormat,
  createSampleVideoCanvas,
  validateVideoCanvas,
  getRecommendedProcessingOptions,
  estimateProcessingTime,
};
