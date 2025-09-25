package com.eventmarketers;

import android.util.Log;
import java.io.File;

public class CustomFFmpegLoader {
    private static final String TAG = "CustomFFmpegLoader";
    private static boolean librariesLoaded = false;

    /**
     * Load custom FFmpeg 6.1.1 libraries in the correct order
     */
    public static synchronized void loadCustomFFmpegLibraries() {
        if (librariesLoaded) {
            Log.d(TAG, "Custom FFmpeg libraries already loaded");
            return;
        }

        try {
            Log.d(TAG, "=== Loading Custom FFmpeg 6.1.1 Libraries ===");
            
            // Load libraries in dependency order
            String[] libraries = {
                "avutil",      // Base utility library
                "swscale",     // Video scaling
                "swresample",  // Audio resampling
                "avcodec",     // Audio/video codecs
                "avformat",    // Container formats
                "avfilter",    // Audio/video filters (includes drawtext)
                "postproc",    // Post-processing (required for drawtext)
                "avdevice"     // Device access
            };

            for (String lib : libraries) {
                try {
                    System.loadLibrary(lib);
                    Log.d(TAG, "✅ Loaded custom library: lib" + lib + ".so");
                } catch (UnsatisfiedLinkError e) {
                    Log.e(TAG, "❌ Failed to load lib" + lib + ".so: " + e.getMessage());
                    // Continue loading other libraries
                }
            }

            librariesLoaded = true;
            Log.d(TAG, "=== Custom FFmpeg 6.1.1 Libraries Loading Complete ===");
            
        } catch (Exception e) {
            Log.e(TAG, "Error loading custom FFmpeg libraries", e);
        }
    }

    /**
     * Check if custom libraries are loaded
     */
    public static boolean areCustomLibrariesLoaded() {
        return librariesLoaded;
    }

    /**
     * Get library information for debugging
     */
    public static void logLibraryInfo() {
        Log.d(TAG, "=== Custom FFmpeg Library Info ===");
        Log.d(TAG, "Libraries loaded: " + librariesLoaded);
        
        // Log system library paths
        String[] libraryPaths = {
            System.getProperty("java.library.path"),
            "/system/lib",
            "/system/lib64",
            "/vendor/lib",
            "/vendor/lib64"
        };
        
        for (String path : libraryPaths) {
            if (path != null) {
                Log.d(TAG, "Library path: " + path);
            }
        }
    }
}

