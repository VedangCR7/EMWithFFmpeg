import { NativeModules } from 'react-native';

export interface VideoLayer {
  id: string;
  type: 'text' | 'image' | 'logo';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: any;
  fieldType?: string;
}

export interface OverlayConfig {
  layers: VideoLayer[];
  canvasImageUri?: string; // Optional canvas image URI for colored overlays
}

interface VideoComposerInterface {
  prepareSource(sourceUri: string): Promise<string>; // Prepare asset:// URIs to file:// paths
  composeVideo(
    sourcePath: string,
    overlayConfig: OverlayConfig
  ): Promise<string>; // Returns direct URI string
}

const { VideoComposer } = NativeModules;

// Add debugging to check if module is available
console.log('🔍 VideoComposer module check:', {
  available: !!VideoComposer,
  module: VideoComposer,
  nativeModules: Object.keys(NativeModules),
});

export default VideoComposer as VideoComposerInterface;

