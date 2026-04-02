import React, { useMemo, useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle, ImageStyle, Image, Text, StyleProp } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const defaultFallbackSource = require('../assets/MainLogo/MB.png');

type ImageResizeMode = 'cover' | 'contain' | 'stretch' | 'center';

interface LazyFullImageProps {
  thumbnailUri?: string | null; // Thumbnail to show while loading
  fullImageUri?: string | null; // Full resolution image to load
  style?: StyleProp<ViewStyle | ImageStyle>;
  resizeMode?: ImageResizeMode;
  showLoader?: boolean;
  loaderColor?: string;
  loaderSize?: 'small' | 'large';
  fallbackSource?: any;
  // Loading behavior
  loadOnMount?: boolean; // Load immediately on mount (default: false)
  preload?: boolean; // Preload in background (default: true)
  // Quality settings
  maxWidth?: number; // Maximum width for full image (default: 2400)
  quality?: 'low' | 'medium' | 'high' | 'original'; // Image quality
}

/**
 * LazyFullImage Component
 * 
 * Loads full resolution images on demand
 * - Shows thumbnail while loading
 * - Fetches full image only when needed
 * - Smooth transition from thumbnail to full image
 * - Used in detail views (PosterPlayer, modals, etc.)
 */
const LazyFullImage: React.FC<LazyFullImageProps> = ({
  thumbnailUri = '',
  fullImageUri = '',
  style,
  resizeMode = 'cover',
  showLoader = true,
  loaderColor = '#667eea',
  loaderSize = 'small',
  fallbackSource = defaultFallbackSource,
  loadOnMount = false,
  preload = true,
  maxWidth = 2400,
  quality = 'high',
}) => {
  const [loading, setLoading] = useState(!loadOnMount);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(loadOnMount);
  const [shouldLoad, setShouldLoad] = useState(loadOnMount);

  const sanitizedThumbnail = useMemo(() => (typeof thumbnailUri === 'string' ? thumbnailUri.trim() : ''), [thumbnailUri]);
  const sanitizedFullImage = useMemo(() => (typeof fullImageUri === 'string' ? fullImageUri.trim() : ''), [fullImageUri]);

  // Optimize full image URL
  const optimizedFullImageUri = useMemo(() => {
    if (!sanitizedFullImage) return sanitizedFullImage;
    
    // For Cloudinary URLs, add quality transformation
    if (sanitizedFullImage.includes('res.cloudinary.com') && sanitizedFullImage.includes('/upload/')) {
      try {
        const [prefix, remainder] = sanitizedFullImage.split('/upload/');
        if (remainder) {
          let transform = 'f_auto';
          
          // Add quality based on prop
          switch (quality) {
            case 'low':
              transform += ',q_auto:low';
              break;
            case 'medium':
              transform += ',q_auto:good';
              break;
            case 'high':
              transform += ',q_auto:best';
              break;
            case 'original':
              transform += ',q_auto';
              break;
          }
          
          // Add width limit
          transform += `,c_limit,w_${maxWidth}`;
          
          // Check if transform already exists
          if (!remainder.includes('w_') && !remainder.includes('q_')) {
            return `${prefix}/upload/${transform}/${remainder}`;
          }
        }
      } catch (error) {
        // Fallback to original
      }
    }
    
    // For other URLs, add quality parameters
    if (sanitizedFullImage.includes('?')) {
      return `${sanitizedFullImage}&w=${maxWidth}&q=${quality === 'high' ? 90 : quality === 'medium' ? 75 : 60}`;
    } else if (!sanitizedFullImage.includes('width=') && !sanitizedFullImage.includes('w=')) {
      return `${sanitizedFullImage}?w=${maxWidth}&q=${quality === 'high' ? 90 : quality === 'medium' ? 75 : 60}`;
    }
    
    return sanitizedFullImage;
  }, [sanitizedFullImage, maxWidth, quality]);

  // Preload full image in background if enabled
  useEffect(() => {
    if (preload && sanitizedFullImage && !shouldLoad && !imageLoaded) {
      // Preload in background using React Native Image prefetch
      Image.prefetch(optimizedFullImageUri).catch(() => {
        // Silently fail - prefetch is best effort
      });
    }
  }, [preload, sanitizedFullImage, optimizedFullImageUri, shouldLoad, imageLoaded]);

  // Load full image when shouldLoad becomes true
  useEffect(() => {
    if (shouldLoad && sanitizedFullImage && !imageLoaded) {
      setLoading(true);
      setError(false);
    }
  }, [shouldLoad, sanitizedFullImage, imageLoaded]);

  const handleLoadStart = () => {
    if (!sanitizedFullImage) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    setImageLoaded(true);
  };

  const handleError = (err?: any) => {
    setLoading(false);
    setError(true);
    setImageLoaded(false);
    
    if (__DEV__) {
      console.warn('⚠️ [FULL IMAGE ERROR]', {
        thumbnailUri: sanitizedThumbnail,
        fullImageUri: sanitizedFullImage,
        optimizedUri: optimizedFullImageUri,
        error: err?.message || 'Unknown error',
      });
    }
  };

  // Determine which image to show
  const displayUri = imageLoaded && optimizedFullImageUri ? optimizedFullImageUri : sanitizedThumbnail;
  const shouldShowFallback = error && !sanitizedThumbnail;

  // Expose load function for manual triggering
  const loadFullImage = () => {
    if (!shouldLoad && sanitizedFullImage) {
      setShouldLoad(true);
    }
  };

  // Auto-load on mount if enabled
  useEffect(() => {
    if (loadOnMount && sanitizedFullImage) {
      setShouldLoad(true);
    }
  }, [loadOnMount, sanitizedFullImage]);

  return (
    <View style={style}>
      {shouldShowFallback ? (
        fallbackSource ? (
          <Image
            source={fallbackSource}
            style={StyleSheet.absoluteFill}
            resizeMode={resizeMode}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
            <Icon name="image" size={40} color="#999999" />
            <Text style={styles.errorText}>Image unavailable</Text>
          </View>
        )
      ) : (
        <>
          {/* Show thumbnail while loading full image */}
          {!imageLoaded && sanitizedThumbnail && (
            <Image
              source={{ uri: sanitizedThumbnail }}
              style={StyleSheet.absoluteFill}
              resizeMode={resizeMode}
            />
          )}
          
          {/* Show full image when loaded */}
          {shouldLoad && sanitizedFullImage && (
            <Image
              source={{ uri: optimizedFullImageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode={resizeMode}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
            />
          )}
        </>
      )}
      
      {loading && showLoader && !error && sanitizedFullImage && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size={loaderSize} color={loaderColor} />
          <Text style={styles.loadingText}>Loading high quality...</Text>
        </View>
      )}
    </View>
  );
};

// Export load function for external use
LazyFullImage.loadFullImage = (componentRef: any) => {
  if (componentRef?.current?.loadFullImage) {
    componentRef.current.loadFullImage();
  }
};

const styles = StyleSheet.create({
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
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

export default LazyFullImage;

