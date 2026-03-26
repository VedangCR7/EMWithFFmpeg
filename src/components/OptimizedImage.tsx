import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle, ImageStyle, Image, Text, Dimensions, StyleProp, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ThumbnailImage from './ThumbnailImage';
import LazyFullImage from './LazyFullImage';

// Type-safe ResizeMode
type ImageResizeMode = 'cover' | 'contain' | 'stretch' | 'center';

const defaultFallbackSource = require('../assets/MainLogo/MB.png');

interface OptimizedImageProps {
  uri?: string | null;
  style?: StyleProp<ViewStyle | ImageStyle>;
  resizeMode?: ImageResizeMode;
  showLoader?: boolean;
  loaderColor?: string;
  loaderSize?: 'small' | 'large';
  fallbackSource?: any;
  // New props for thumbnail/full image mode
  mode?: 'thumbnail' | 'full' | 'auto'; // 'auto' uses thumbnail in lists, full in detail views
  fullImageUri?: string | null; // Full resolution image URL (for lazy loading)
  cacheKey?: string; // Cache key for thumbnail caching
}

const ensureImageUri = (input: string): string => {
  if (!input) {
    return input;
  }

  try {
    const [path, query] = input.split('?');
    const hasImageExtension = /\.(png|jpe?g|gif|webp|bmp|avif|heic)$/i.test(path);
    const hasVideoExtension = /\.(mp4|mov|webm|mkv|avi)$/i.test(path);

    if (hasImageExtension) {
      return input;
    }

    let transformedPath = path;

    if (hasVideoExtension) {
      transformedPath = path.replace(/\.[^/.]+$/, '.jpg');
    } else if (path.includes('/video/')) {
      transformedPath = `${path}.jpg`;
    }

    if (transformedPath === path) {
      return input;
    }

    return query ? `${transformedPath}?${query}` : transformedPath;
  } catch (error) {
    return input;
  }
};

const CLOUDINARY_UPLOAD_SEGMENT = '/upload/';
const CLOUDINARY_MIN_WIDTH = 320;
const CLOUDINARY_MAX_WIDTH = 1200;
const CLOUDINARY_DEFAULT_WIDTH = Math.min(
  CLOUDINARY_MAX_WIDTH,
  Math.max(CLOUDINARY_MIN_WIDTH, Math.round(Dimensions.get('window').width || CLOUDINARY_MIN_WIDTH)),
);
const CLOUDINARY_BASE_TRANSFORM = 'f_auto,q_auto:eco,c_limit';

const clampWidth = (value?: number | null): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return CLOUDINARY_DEFAULT_WIDTH;
  }
  return Math.min(CLOUDINARY_MAX_WIDTH, Math.max(CLOUDINARY_MIN_WIDTH, Math.round(value)));
};

const getTargetWidth = (style?: StyleProp<ViewStyle | ImageStyle>): number => {
  if (!style) {
    return CLOUDINARY_DEFAULT_WIDTH;
  }

  const flattened = StyleSheet.flatten(style);
  const { width, height } = flattened || {};

  if (typeof width === 'number') {
    return clampWidth(width);
  }

  if (typeof height === 'number') {
    // Fall back to height to avoid downloading far larger bitmaps than necessary
    return clampWidth(height);
  }

  return CLOUDINARY_DEFAULT_WIDTH;
};

const applyCloudinaryTransform = (input: string, targetWidth: number, highQuality: boolean = false): string => {
  if (!input || !input.includes('res.cloudinary.com') || !input.includes(CLOUDINARY_UPLOAD_SEGMENT)) {
    return input;
  }

  try {
    const [prefix, remainder] = input.split(CLOUDINARY_UPLOAD_SEGMENT);
    if (!remainder) {
      return input;
    }

    // For high quality, always apply our transform (override existing)
    if (highQuality) {
      // Find the version and image path
      const parts = remainder.split('/');
      let versionIndex = -1;
      for (let i = 0; i < parts.length; i++) {
        if (/^v\d+/.test(parts[i])) {
          versionIndex = i;
          break;
        }
      }
      
      if (versionIndex >= 0) {
        // Reconstruct with high quality transform
        const version = parts[versionIndex];
        const imagePath = parts.slice(versionIndex + 1).join('/');
        const transform = `f_auto,q_auto:best,c_limit,w_${targetWidth}`;
        return `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}${transform}/${version}/${imagePath}`;
      }
    }

    const [firstSegment, ...restSegments] = remainder.split('/');

    // If the first segment is not a version string, we assume a transform already exists
    if (firstSegment && !/^v\d+/.test(firstSegment)) {
      return input;
    }

    const restPath = [firstSegment, ...restSegments].join('/');
    // Use high quality for carousel images
    const qualityTransform = highQuality ? 'f_auto,q_auto:best,c_limit' : CLOUDINARY_BASE_TRANSFORM;
    const transform = `${qualityTransform},w_${targetWidth}`;
    return `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}${transform}/${restPath}`;
  } catch (error) {
    return input;
  }
};

/**
 * OptimizedImage Component
 * 
 * Smart image component that automatically chooses between thumbnail and full image
 * Features:
 * - Automatic thumbnail caching for lists
 * - Lazy loading of full images for detail views
 * - Loading indicators
 * - Fallback support
 * - Error handling
 * 
 * Usage:
 * - Lists/Grids: Use mode="thumbnail" or mode="auto" (default)
 * - Detail views: Use mode="full" with fullImageUri prop
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  style,
  resizeMode = 'cover',
  showLoader = true,
  loaderColor = '#667eea',
  loaderSize = 'small',
  fallbackSource = defaultFallbackSource,
  mode = 'auto',
  fullImageUri,
  cacheKey,
}) => {
  const processedUri = useMemo(() => ensureImageUri(uri || ''), [uri]);
  
  const sanitizedUri = useMemo(() => (typeof processedUri === 'string' ? processedUri.trim() : ''), [processedUri]);
  const sanitizedFullImageUri = useMemo(() => (typeof fullImageUri === 'string' ? fullImageUri.trim() : ''), [fullImageUri]);
  
  // Determine which mode to use
  const actualMode = useMemo(() => {
    if (mode !== 'auto') return mode;
    // Auto mode: use thumbnail if no fullImageUri, otherwise use full
    return sanitizedFullImageUri ? 'full' : 'thumbnail';
  }, [mode, sanitizedFullImageUri]);

  // Use ThumbnailImage for thumbnail mode
  if (actualMode === 'thumbnail') {
    return (
      <ThumbnailImage
        uri={sanitizedUri}
        style={style}
        resizeMode={resizeMode}
        showLoader={showLoader}
        loaderColor={loaderColor}
        loaderSize={loaderSize}
        fallbackSource={fallbackSource}
        cacheKey={cacheKey}
      />
    );
  }

  // Use LazyFullImage for full mode
  if (actualMode === 'full' && sanitizedFullImageUri) {
    return (
      <LazyFullImage
        thumbnailUri={sanitizedUri}
        fullImageUri={sanitizedFullImageUri}
        style={style}
        resizeMode={resizeMode}
        showLoader={showLoader}
        loaderColor={loaderColor}
        loaderSize={loaderSize}
        fallbackSource={fallbackSource}
        loadOnMount={true} // Load full image immediately in full mode
        preload={true}
      />
    );
  }

  // Fallback to original behavior for backward compatibility
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const baseTargetWidth = useMemo(() => getTargetWidth(style), [style]);
  // For high quality mode, request 2x resolution for retina displays
  const targetWidth = useMemo(() => {
    if (actualMode === 'full') {
      // Request 2x width for high quality on retina displays
      return Math.min(2400, Math.max(baseTargetWidth, baseTargetWidth * 2));
    }
    return baseTargetWidth;
  }, [baseTargetWidth, actualMode]);
  const displayUri = useMemo(() => (sanitizedUri ? ensureImageUri(sanitizedUri) : ''), [sanitizedUri]);
  // Use high quality when mode is 'full'
  const useHighQuality = actualMode === 'full';
  const optimizedUri = useMemo(
    () => (displayUri ? applyCloudinaryTransform(displayUri, targetWidth, useHighQuality) : ''),
    [displayUri, targetWidth, useHighQuality],
  );

  // Shimmer animation effect
  useEffect(() => {
    if (loading && sanitizedUri && !error) {
      // Start shimmer animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animation when not loading
      shimmerAnim.setValue(0);
    }
  }, [loading, sanitizedUri, error, shimmerAnim]);

  const handleLoadStart = () => {
    if (!sanitizedUri) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (err?: any) => {
    setLoading(false);
    setError(true);
    
    // Extract meaningful error information
    const errorMessage = err?.message || err?.toString() || 'Unknown error';
    const errorCode = err?.nativeEvent?.error?.code || err?.code || 'N/A';
    const errorDescription = err?.nativeEvent?.error?.description || err?.description || 'N/A';
    
    // Only log error if it's not a network timeout or similar transient error
    if (!errorMessage.includes('network') && !errorMessage.includes('timeout')) {
      console.warn('⚠️ [IMAGE LOAD ERROR]');
      console.warn('  - Requested URI:', uri);
      console.warn('  - Loaded URI   :', displayUri);
      if (optimizedUri && optimizedUri !== displayUri) {
        console.warn('  - Optimized URI:', optimizedUri);
        console.warn('  - Target Width :', targetWidth);
      }
      console.warn('  - Error Code   :', errorCode);
      console.warn('  - Error Message:', errorMessage);
      console.warn('  - Error Details:', errorDescription);
      if (err?.nativeEvent) {
        console.warn('  - Native Event :', JSON.stringify(err.nativeEvent, null, 2));
      }
    }
  };

  const shouldShowFallback = error || !sanitizedUri;

  // Shimmer opacity interpolation
  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={style}>
      {/* Show skeleton placeholder with shimmer effect while loading */}
      {loading && sanitizedUri && !error && (
        <View style={[StyleSheet.absoluteFill, styles.placeholderContainer]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: shimmerOpacity,
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
              },
            ]}
          />
        </View>
      )}
      
      {shouldShowFallback ? (
        fallbackSource ? (
          <Image
            source={fallbackSource}
            style={StyleSheet.absoluteFill}
            resizeMode={resizeMode}
          />
        ) : (
          // Show placeholder when error occurs and no fallback is provided
          <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
            <Icon name="image" size={40} color="#999999" />
            <Text style={styles.errorText}>Image unavailable</Text>
          </View>
        )
      ) : (
        <Image
          source={{ uri: optimizedUri }}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      )}
      {loading && showLoader && !error && sanitizedUri && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size={loaderSize} color={loaderColor} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
});

export default OptimizedImage;

