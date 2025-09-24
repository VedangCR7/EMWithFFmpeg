import { NativeModules } from 'react-native';

export interface OverlayPosition {
  x: number;
  y: number;
}

export interface VideoOverlayConfig {
  type: 'image' | 'text' | 'shape';
  value: string;
  position?: OverlayPosition;
  color?: string;
  size?: number;
}

interface VideoOverlayInterface {
  addOverlay(
    sourcePath: string,
    overlay: VideoOverlayConfig
  ): Promise<string>;
}

const { VideoOverlay } = NativeModules;

export default VideoOverlay as VideoOverlayInterface;

