import { NativeModules, NativeEventEmitter, EmitterSubscription, Platform } from 'react-native';

const LINKING_ERROR =
  "The native module 'Media3VideoProcessor' is not linked. Make sure to rebuild the app after installing dependencies.";

type OverlayPosition = {
  x: number;
  y: number;
};

export type OverlayPayload =
  | {
      type: 'text';
      text: string;
      position: OverlayPosition;
      fontSize?: number;
      color?: string;
      backgroundColor?: string | null;
      fontFamily?: string | null;
      width?: number | null;
      height?: number | null;
      opacity?: number;
    }
  | {
      type: 'image';
      uri: string;
      position: OverlayPosition;
      width?: number | null;
      height?: number | null;
      opacity?: number;
    };

export type Media3ProgressEvent = {
  progressMs: number;
  durationMs: number;
};

type NativeModuleShape = {
  applyOverlays: (
    inputUri: string,
    overlays: OverlayPayload[],
    options?: { fileName?: string }
  ) => Promise<string>;
};

const Media3VideoProcessor: NativeModuleShape | undefined =
  NativeModules.Media3VideoProcessor;

const emitter = Media3VideoProcessor
  ? new NativeEventEmitter(NativeModules.Media3VideoProcessor)
  : undefined;

const applyOverlays = async (
  inputUri: string,
  overlays: OverlayPayload[],
  options?: { fileName?: string }
): Promise<string> => {
  if (Platform.OS !== 'android') {
    throw new Error('Media3 overlays are only supported on Android.');
  }

  if (!Media3VideoProcessor) {
    throw new Error(LINKING_ERROR);
  }

  if (!overlays.length) {
    throw new Error('At least one overlay layer is required.');
  }

  return Media3VideoProcessor.applyOverlays(inputUri, overlays, options ?? {});
};

const addProgressListener = (
  listener: (event: Media3ProgressEvent) => void
): EmitterSubscription | undefined => {
  if (!emitter) {
    return undefined;
  }

  return emitter.addListener('Media3VideoProcessorProgress', listener);
};

export default {
  applyOverlays,
  addProgressListener,
};

