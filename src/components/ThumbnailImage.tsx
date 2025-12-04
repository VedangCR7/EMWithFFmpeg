import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle, ImageStyle, Image, Text, StyleProp, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const defaultFallbackSource = require('../assets/MainLogo/MB.png');

type ImageResizeMode = 'cover' | 'contain' | 'stretch' | 'center';

interface ThumbnailImageProps {
  uri?: string | null;
  style?: StyleProp<ViewStyle | ImageStyle>;
  resizeMode?: ImageResizeMode;
  showLoader?: boolean;
  loaderColor?: string;
  loaderSize?: 'small' | 'large';
  fallbackSource?: any;
  // Cache configuration
  cacheKey?: string; // Optional custom cache key
  cacheEnabled?: boolean; // Enable/disable caching (default: true)
}

const THUMBNAIL_CACHE_PREFIX = '@thumbnail_cache_';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  uri: string;
  cachedAt: number;
  expiresAt: number;
}

/**
 * ThumbnailImage Component
 * 
 * Optimized for caching thumbnails (small images)
 * - Aggressively caches thumbnails in AsyncStorage
 * - Fast loading from cache
 * - Small file size optimized
 * - Used in lists/grids where thumbnails are displayed
 */
const ThumbnailImage: React.FC<ThumbnailImageProps> = ({
  uri = '',
  style,
  resizeMode = 'cover',
  showLoader = true,
  loaderColor = '#667eea',
  loaderSize = 'small',
  fallbackSource = defaultFallbackSource,
  cacheKey,
  cacheEnabled = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [uriVariant, setUriVariant] = useState<'optimized' | 'low' | 'original'>('optimized');
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  const sanitizedUri = useMemo(() => (typeof uri === 'string' ? uri.trim() : ''), [uri]);
  const storageKey = useMemo(() => {
    if (cacheKey) return `${THUMBNAIL_CACHE_PREFIX}${cacheKey}`;
    return sanitizedUri ? `${THUMBNAIL_CACHE_PREFIX}${sanitizedUri}` : null;
  }, [cacheKey, sanitizedUri]);

  // Optimize thumbnail URL for high quality but optimized size
  const optimizedThumbnailUri = useMemo(() => {
    if (!sanitizedUri) return '';
    
    // For Cloudinary URLs, add high-quality thumbnail transformation
    if (sanitizedUri.includes('res.cloudinary.com') && sanitizedUri.includes('/upload/')) {
      try {
        const [prefix, remainder] = sanitizedUri.split('/upload/');
        if (remainder && !remainder.includes('w_')) {
          const transform = 'f_auto,q_auto:best,c_limit,w_800';
          return `${prefix}/upload/${transform}/${remainder}`;
        }
      } catch (error) {
        // Fallback to original
      }
    }
    
    // For other URLs, add high quality size parameters if possible
    if (sanitizedUri.includes('?')) {
      return `${sanitizedUri}&w=800&q=90`;
    } else if (!sanitizedUri.includes('width=') && !sanitizedUri.includes('w=')) {
      return `${sanitizedUri}?w=800&q=90`;
    }
    
    return sanitizedUri;
  }, [sanitizedUri]);

  const lowResThumbnailUri = useMemo(() => {
    if (!sanitizedUri) return '';

    if (sanitizedUri.includes('res.cloudinary.com') && sanitizedUri.includes('/upload/')) {
      try {
        const [prefix, remainder] = sanitizedUri.split('/upload/');
        if (remainder) {
          const transform = 'f_auto,q_auto:eco,c_limit,w_400';
          return `${prefix}/upload/${transform}/${remainder}`;
        }
      } catch (error) {
        // ignore
      }
    }

    if (sanitizedUri.includes('?')) {
      return `${sanitizedUri}&w=400&q=70`;
    }

    return `${sanitizedUri}?w=400&q=70`;
  }, [sanitizedUri]);

  // Reset retry flag whenever the incoming URI changes
  useEffect(() => {
    setUriVariant('optimized');
    setError(false);
    setCachedUri(null);
  }, [sanitizedUri, optimizedThumbnailUri]);

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

  const targetUri = useMemo(() => {
    if (uriVariant === 'low') {
      return lowResThumbnailUri || optimizedThumbnailUri || sanitizedUri;
    }
    if (uriVariant === 'original') {
      return sanitizedUri;
    }
    return optimizedThumbnailUri || sanitizedUri;
  }, [uriVariant, optimizedThumbnailUri, lowResThumbnailUri, sanitizedUri]);

  // Check cache on mount
  useEffect(() => {
    if (!cacheEnabled || !storageKey || !targetUri) {
      setCachedUri(targetUri || null);
      return;
    }

    const checkCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(storageKey);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          const now = Date.now();
          
          // Check if cache is still valid
          if (now < entry.expiresAt && entry.uri === targetUri) {
            // Cache hit - use cached URI
            setCachedUri(entry.uri);
            setLoading(false);
            return;
          } else {
            // Cache expired or URI changed - remove old cache
            await AsyncStorage.removeItem(storageKey);
          }
        }
        
        // Cache miss - use optimized URI
        setCachedUri(targetUri);
      } catch (error) {
        console.warn('Error checking thumbnail cache:', error);
        setCachedUri(targetUri);
      }
    };

    checkCache();
  }, [storageKey, targetUri, cacheEnabled]);

  // Save to cache on successful load
  const handleLoadEnd = () => {
    setLoading(false);
    
    const uriToCache = targetUri;
    
    if (cacheEnabled && storageKey && uriToCache) {
      // Save to cache in background
      const cacheEntry: CacheEntry = {
        uri: uriToCache,
        cachedAt: Date.now(),
        expiresAt: Date.now() + CACHE_EXPIRY,
      };
      
      AsyncStorage.setItem(storageKey, JSON.stringify(cacheEntry))
        .catch(err => console.warn('Error saving thumbnail cache:', err));
    }
  };

  const handleLoadStart = () => {
    if (!sanitizedUri) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
  };

  const handleError = (err?: any) => {
    const nativeError = err?.nativeEvent?.error || err?.message || 'Unknown error';

    if (uriVariant === 'optimized' && lowResThumbnailUri && lowResThumbnailUri !== optimizedThumbnailUri) {
      setUriVariant('low');
      setLoading(true);
      setError(false);
      setCachedUri(null);
      return;
    }

    if (uriVariant !== 'original' && sanitizedUri && targetUri !== sanitizedUri) {
      setUriVariant('original');
      setLoading(true);
      setError(false);
      setCachedUri(null);
      return;
    }

    setLoading(false);
    setError(true);
    
    if (__DEV__ && !nativeError.toLowerCase().includes('network') && !nativeError.toLowerCase().includes('timeout')) {
      console.warn('⚠️ [THUMBNAIL IMAGE ERROR]', {
        uri: sanitizedUri,
        optimizedUri: optimizedThumbnailUri,
        retriedWithOriginal: uriVariant === 'original',
        downgradedQuality: uriVariant === 'low',
        error: nativeError,
      });
    }
  };

  const displayUri = cachedUri || targetUri || sanitizedUri;
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
          <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
            <Icon name="image" size={24} color="#999999" />
            <Text style={styles.errorText}>Image unavailable</Text>
          </View>
        )
      ) : (
        <Image
          source={{ uri: displayUri }}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      )}
      {/* Optional: Show spinner only if showLoader is true (shimmer is usually enough) */}
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
    fontSize: 10,
    color: '#999999',
    fontWeight: '500',
  },
});

export default ThumbnailImage;

