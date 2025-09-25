package com.eventmarketers;

import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class FFmpegLibraryDebugger extends ReactContextBaseJavaModule {
    private static final String TAG = "FFmpegLibraryDebugger";

    public FFmpegLibraryDebugger(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "FFmpegLibraryDebugger";
    }

    @ReactMethod
    public void getLoadedLibraries(Promise promise) {
        try {
            Log.d(TAG, "=== FFmpeg Library Debugger Starting ===");
            
            WritableMap result = Arguments.createMap();
            WritableArray libraries = Arguments.createArray();
            
            // Get system library paths
            String[] libraryPaths = {
                "/system/lib",
                "/system/lib64",
                "/vendor/lib",
                "/vendor/lib64",
                "/data/app/" + getReactApplicationContext().getPackageName() + "/lib",
                "/data/data/" + getReactApplicationContext().getPackageName() + "/lib"
            };
            
            // FFmpeg library names to look for
            String[] ffmpegLibraries = {
                "libavcodec.so",
                "libavfilter.so", 
                "libavformat.so",
                "libavutil.so",
                "libpostproc.so",
                "libswresample.so",
                "libswscale.so",
                "libavdevice.so"
            };
            
            int totalFound = 0;
            int customFound = 0;
            int prebuiltFound = 0;
            
            for (String libraryPath : libraryPaths) {
                File path = new File(libraryPath);
                if (path.exists() && path.isDirectory()) {
                    Log.d(TAG, "Checking path: " + libraryPath);
                    
                    for (String libName : ffmpegLibraries) {
                        File libFile = new File(path, libName);
                        if (libFile.exists()) {
                            WritableMap libInfo = Arguments.createMap();
                            libInfo.putString("name", libName);
                            libInfo.putString("path", libFile.getAbsolutePath());
                            libInfo.putDouble("size", libFile.length());
                            libInfo.putString("modified", new java.util.Date(libFile.lastModified()).toString());
                            
                            // Determine if it's custom or prebuilt
                            boolean isCustom = isCustomLibrary(libFile);
                            libInfo.putBoolean("isCustom", isCustom);
                            
                            libraries.pushMap(libInfo);
                            totalFound++;
                            
                            if (isCustom) {
                                customFound++;
                                Log.d(TAG, "✅ CUSTOM library found: " + libFile.getAbsolutePath());
                            } else {
                                prebuiltFound++;
                                Log.d(TAG, "⚠️ PREBUILT library found: " + libFile.getAbsolutePath());
                            }
                        }
                    }
                }
            }
            
            result.putArray("libraries", libraries);
            result.putInt("totalFound", totalFound);
            result.putInt("customFound", customFound);
            result.putInt("prebuiltFound", prebuiltFound);
            
            Log.d(TAG, "=== Library Debug Summary ===");
            Log.d(TAG, "Total FFmpeg libraries found: " + totalFound);
            Log.d(TAG, "Custom libraries: " + customFound);
            Log.d(TAG, "Prebuilt libraries: " + prebuiltFound);
            
            promise.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting loaded libraries", e);
            promise.reject("LIBRARY_DEBUG_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getSystemInfo(Promise promise) {
        try {
            WritableMap result = Arguments.createMap();
            
            // Get system information
            result.putString("packageName", getReactApplicationContext().getPackageName());
            result.putString("dataDir", getReactApplicationContext().getFilesDir().getAbsolutePath());
            result.putString("nativeLibDir", getReactApplicationContext().getApplicationInfo().nativeLibraryDir);
            
            // Get app-specific library directory
            File appLibDir = new File(getReactApplicationContext().getApplicationInfo().nativeLibraryDir);
            if (appLibDir.exists()) {
                result.putString("appLibDir", appLibDir.getAbsolutePath());
                result.putBoolean("appLibDirExists", true);
                
                // List all .so files in app lib directory
                WritableArray appLibraries = Arguments.createArray();
                File[] files = appLibDir.listFiles();
                if (files != null) {
                    for (File file : files) {
                        if (file.getName().endsWith(".so")) {
                            WritableMap libInfo = Arguments.createMap();
                            libInfo.putString("name", file.getName());
                            libInfo.putString("path", file.getAbsolutePath());
                            libInfo.putDouble("size", file.length());
                            libInfo.putString("modified", new java.util.Date(file.lastModified()).toString());
                            libInfo.putBoolean("isCustom", isCustomLibrary(file));
                            appLibraries.pushMap(libInfo);
                        }
                    }
                }
                result.putArray("appLibraries", appLibraries);
            } else {
                result.putBoolean("appLibDirExists", false);
            }
            
            Log.d(TAG, "System Info: " + result.toString());
            promise.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting system info", e);
            promise.reject("SYSTEM_INFO_ERROR", e.getMessage());
        }
    }

    /**
     * Determine if a library is custom (our FFmpeg 6.1.1) or prebuilt
     */
    private boolean isCustomLibrary(File libFile) {
        try {
            // Check file size - custom libraries should be larger
            long fileSize = libFile.length();
            
            // Check modification date - custom libraries should be newer
            long lastModified = libFile.lastModified();
            long currentTime = System.currentTimeMillis();
            long daysSinceModified = (currentTime - lastModified) / (1000 * 60 * 60 * 24);
            
            // Check path - custom libraries should be in app-specific directories
            String path = libFile.getAbsolutePath();
            boolean isInAppDir = path.contains(getReactApplicationContext().getPackageName()) ||
                               path.contains("/data/app/") ||
                               path.contains("/data/data/");
            
            Log.d(TAG, "Library analysis for " + libFile.getName() + ":");
            Log.d(TAG, "  Size: " + fileSize + " bytes");
            Log.d(TAG, "  Modified: " + daysSinceModified + " days ago");
            Log.d(TAG, "  Path: " + path);
            Log.d(TAG, "  In app dir: " + isInAppDir);
            
            // Heuristic: Custom libraries are likely to be:
            // 1. In app-specific directories
            // 2. Recently modified (within last 30 days)
            // 3. Larger in size (our custom build is larger)
            
            boolean isCustom = isInAppDir && daysSinceModified < 30 && fileSize > 1000000; // > 1MB
            
            Log.d(TAG, "  Determined as: " + (isCustom ? "CUSTOM" : "PREBUILT"));
            
            return isCustom;
            
        } catch (Exception e) {
            Log.e(TAG, "Error analyzing library", e);
            return false;
        }
    }
}

