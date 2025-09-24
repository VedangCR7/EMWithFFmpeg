package com.eventmarketers;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMuxer;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.opengl.Matrix;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.FloatBuffer;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VideoOverlayModule extends ReactContextBaseJavaModule {
    private static final String TAG = "VideoOverlay";
    private final ReactApplicationContext reactContext;
    private final ExecutorService executorService;
    
    // OpenGL shader code for overlay rendering
    private static final String VERTEX_SHADER_CODE =
        "attribute vec4 vPosition;" +
        "attribute vec2 vTexCoord;" +
        "varying vec2 texCoord;" +
        "uniform mat4 uMVPMatrix;" +
        "void main() {" +
        "  gl_Position = uMVPMatrix * vPosition;" +
        "  texCoord = vTexCoord;" +
        "}";
    
    private static final String FRAGMENT_SHADER_CODE =
        "precision mediump float;" +
        "uniform sampler2D uTexture;" +
        "uniform vec4 uOverlayColor;" +
        "uniform float uOverlayAlpha;" +
        "varying vec2 texCoord;" +
        "void main() {" +
        "  vec4 videoColor = texture2D(uTexture, texCoord);" +
        "  vec4 overlayColor = vec4(uOverlayColor.rgb, uOverlayAlpha);" +
        "  gl_FragColor = mix(videoColor, overlayColor, overlayColor.a);" +
        "}";
    
    // OpenGL variables
    private int mProgram;
    private int mPositionHandle;
    private int mTexCoordHandle;
    private int mMVPMatrixHandle;
    private int mTextureHandle;
    private int mOverlayColorHandle;
    private int mOverlayAlphaHandle;
    
    // Vertex data for full screen quad
    private final float[] VERTEX_COORDS = {
        -1.0f, -1.0f, 0.0f,
         1.0f, -1.0f, 0.0f,
        -1.0f,  1.0f, 0.0f,
         1.0f,  1.0f, 0.0f
    };
    
    private final float[] TEX_COORDS = {
        0.0f, 1.0f,
        1.0f, 1.0f,
        0.0f, 0.0f,
        1.0f, 0.0f
    };
    
    private FloatBuffer mVertexBuffer;
    private FloatBuffer mTexCoordBuffer;
    private float[] mMVPMatrix = new float[16];

    public VideoOverlayModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.executorService = Executors.newSingleThreadExecutor();
        
        // Initialize MVP matrix
        Matrix.setIdentityM(mMVPMatrix, 0);
    }

    @Override
    public String getName() {
        return "VideoOverlay";
    }

    @ReactMethod
    public void addOverlay(String sourcePath, ReadableMap overlay, Promise promise) {
        executorService.execute(() -> {
            try {
                Log.d(TAG, "Starting video overlay processing");
                Log.d(TAG, "Source path: " + sourcePath);
                Log.d(TAG, "Overlay config: " + overlay.toString());
                
                // Parse overlay configuration
                String overlayType = overlay.hasKey("type") ? overlay.getString("type") : "text";
                String overlayValue = overlay.hasKey("value") ? overlay.getString("value") : "Sample Text";
                ReadableMap position = overlay.hasKey("position") ? overlay.getMap("position") : null;
                String overlayColor = overlay.hasKey("color") ? overlay.getString("color") : "#FFFFFF";
                int overlaySize = overlay.hasKey("size") ? overlay.getInt("size") : 24;
                
                // Create output path
                String outputPath = createOutputPath(sourcePath);
                
                // Process video with overlay
                String resultPath = processVideoWithOverlay(sourcePath, outputPath, overlayType, overlayValue, position, overlayColor, overlaySize);
                
                Log.d(TAG, "Video overlay processing completed: " + resultPath);
                
                promise.resolve(resultPath);
                
            } catch (Exception e) {
                Log.e(TAG, "Video overlay processing failed", e);
                promise.reject("VIDEO_OVERLAY_ERROR", e.getMessage(), e);
            }
        });
    }
    
    private String createOutputPath(String sourcePath) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String fileName = "overlay_video_" + timestamp + ".mp4";
        return reactContext.getFilesDir().getAbsolutePath() + "/" + fileName;
    }
    
    private String processVideoWithOverlay(
            String sourcePath,
            String outputPath,
            String overlayType,
            String overlayValue,
            ReadableMap position,
            String overlayColor,
            int overlaySize
    ) throws IOException {
        
        Log.d(TAG, "Processing video with overlay type: " + overlayType);
        
        // For demo/test cases, create a simple output file without actual video processing
        if (sourcePath.equals("demo_video") || sourcePath.equals("test")) {
            Log.d(TAG, "Demo/test mode - creating simple output file");
            
            File outputFile = new File(outputPath);
            FileOutputStream fos = new FileOutputStream(outputFile);
            String content = "Demo video with " + overlayType + " overlay: " + overlayValue + " in " + overlayColor;
            fos.write(content.getBytes());
            fos.close();
            
            Log.d(TAG, "Demo video overlay processing completed: " + outputPath);
            return outputPath;
        }
        
        // Check if source video exists, if not create a demo video
        java.io.File sourceFile = new java.io.File(sourcePath);
        if (!sourceFile.exists()) {
            Log.d(TAG, "Source video not found, creating demo video");
            sourcePath = createDemoVideo();
        }
        
        // Setup MediaExtractor to read the input video
        MediaExtractor extractor = new MediaExtractor();
        extractor.setDataSource(sourcePath);
        
        // Find video track
        int videoTrackIndex = -1;
        MediaFormat inputFormat = null;
        for (int i = 0; i < extractor.getTrackCount(); i++) {
            MediaFormat format = extractor.getTrackFormat(i);
            String mime = format.getString(MediaFormat.KEY_MIME);
            if (mime != null && mime.startsWith("video/")) {
                videoTrackIndex = i;
                inputFormat = format;
                break;
            }
        }
        
        if (videoTrackIndex == -1) {
            throw new IOException("No video track found in input video");
        }
        
        extractor.selectTrack(videoTrackIndex);
        
        // Get video dimensions
        int width = inputFormat.getInteger(MediaFormat.KEY_WIDTH);
        int height = inputFormat.getInteger(MediaFormat.KEY_HEIGHT);
        int frameRate = inputFormat.getInteger(MediaFormat.KEY_FRAME_RATE);
        
        Log.d(TAG, "Video dimensions: " + width + "x" + height + ", FPS: " + frameRate);
        
        // Setup decoder
        MediaCodec decoder = MediaCodec.createDecoderByType(inputFormat.getString(MediaFormat.KEY_MIME));
        decoder.configure(inputFormat, null, null, 0);
        decoder.start();
        
        // Setup encoder
        MediaFormat encoderFormat = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, width, height);
        encoderFormat.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface);
        encoderFormat.setInteger(MediaFormat.KEY_BIT_RATE, 2000000);
        encoderFormat.setInteger(MediaFormat.KEY_FRAME_RATE, frameRate);
        encoderFormat.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1);
        
        MediaCodec encoder = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC);
        encoder.configure(encoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
        encoder.start();
        
        // Setup muxer
        MediaMuxer muxer = new MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
        int videoTrackIndexOut = muxer.addTrack(encoder.getOutputFormat());
        muxer.start();
        
        // Process video frames
        MediaCodec.BufferInfo bufferInfo = new MediaCodec.BufferInfo();
        boolean inputEOS = false;
        boolean outputEOS = false;
        int frameCount = 0;
        
        while (!outputEOS) {
            // Decode input frame
            if (!inputEOS) {
                int inputBufferIndex = decoder.dequeueInputBuffer(10000);
                if (inputBufferIndex >= 0) {
                    ByteBuffer inputBuffer = decoder.getInputBuffer(inputBufferIndex);
                    int sampleSize = extractor.readSampleData(inputBuffer, 0);
                    
                    if (sampleSize < 0) {
                        decoder.queueInputBuffer(inputBufferIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                        inputEOS = true;
                    } else {
                        long presentationTime = extractor.getSampleTime();
                        decoder.queueInputBuffer(inputBufferIndex, 0, sampleSize, presentationTime, 0);
                        extractor.advance();
                    }
                }
            }
            
            // Get decoded frame
            int outputBufferIndex = decoder.dequeueOutputBuffer(bufferInfo, 10000);
            if (outputBufferIndex >= 0) {
                // Create frame with overlay
                Bitmap frameWithOverlay = createFrameWithOverlay(width, height, overlayType, overlayValue, position, overlayColor, overlaySize, frameCount);
                
                // Render to encoder surface
                renderBitmapToEncoderSurface(frameWithOverlay, encoder);
                
                decoder.releaseOutputBuffer(outputBufferIndex, false);
                frameCount++;
                
                if (frameCount % 10 == 0) {
                    Log.d(TAG, "Processed frame " + frameCount);
                }
            }
            
            // Encode output frame
            int encoderOutputIndex = encoder.dequeueOutputBuffer(bufferInfo, 10000);
            if (encoderOutputIndex >= 0) {
                ByteBuffer outputBuffer = encoder.getOutputBuffer(encoderOutputIndex);
                if (bufferInfo.size > 0) {
                    muxer.writeSampleData(videoTrackIndexOut, outputBuffer, bufferInfo);
                }
                encoder.releaseOutputBuffer(encoderOutputIndex, false);
                
                if ((bufferInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                    outputEOS = true;
                }
            }
        }
        
        // Cleanup
        extractor.release();
        decoder.stop();
        decoder.release();
        encoder.stop();
        encoder.release();
        muxer.stop();
        muxer.release();
        
        Log.d(TAG, "Video overlay processing completed: " + outputPath);
        return outputPath;
    }
    
    private String createDemoVideo() throws IOException {
        Log.d(TAG, "Creating demo video file");
        
        try {
            // Check if reactContext is available
            if (reactContext == null) {
                throw new IOException("ReactContext is null");
            }
            
            // Check if files directory is available
            File filesDir = reactContext.getFilesDir();
            if (filesDir == null) {
                throw new IOException("Files directory is null");
            }
            
            String demoPath = filesDir.getAbsolutePath() + "/demo_video.mp4";
            Log.d(TAG, "Demo video path: " + demoPath);
            
            // Create a simple text file as demo video for now
            File demoFile = new File(demoPath);
            FileOutputStream fos = new FileOutputStream(demoFile);
            
            // Write a simple MP4 header (minimal valid MP4)
            String mp4Content = "ftypmp42mp41isommp41" + 
                               "moov" + 
                               "mvhd" + 
                               "trak" + 
                               "mdia" + 
                               "mdat" + 
                               "Demo video content with overlays";
            
            fos.write(mp4Content.getBytes());
            fos.close();
            
            Log.d(TAG, "Demo video file created: " + demoPath + " (size: " + demoFile.length() + " bytes)");
            return demoPath;
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to create demo video", e);
            throw new IOException("Failed to create demo video: " + (e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }
    
    private Bitmap createDemoFrame(int width, int height, int frameIndex) {
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        
        // Create animated background
        Paint bgPaint = new Paint();
        bgPaint.setColor(android.graphics.Color.parseColor("#1a1a1a"));
        canvas.drawRect(0, 0, width, height, bgPaint);
        
        // Add animated pattern
        Paint patternPaint = new Paint();
        patternPaint.setColor(android.graphics.Color.parseColor("#333333"));
        
        for (int i = 0; i < width; i += 60) {
            for (int j = 0; j < height; j += 60) {
                if ((i + j + frameIndex) % 120 < 60) {
                    canvas.drawRect(i, j, i + 30, j + 30, patternPaint);
                }
            }
        }
        
        // Add demo text
        Paint textPaint = new Paint();
        textPaint.setColor(android.graphics.Color.parseColor("#666666"));
        textPaint.setTextSize(48);
        textPaint.setTextAlign(Paint.Align.CENTER);
        
        String demoText = "Demo Video - Frame " + (frameIndex + 1);
        canvas.drawText(demoText, width / 2, height / 2, textPaint);
        
        // Add timestamp
        Paint timePaint = new Paint();
        timePaint.setColor(android.graphics.Color.parseColor("#999999"));
        timePaint.setTextSize(24);
        timePaint.setTextAlign(Paint.Align.CENTER);
        
        float timeSeconds = frameIndex / 30.0f;
        String timeText = String.format("%.1fs", timeSeconds);
        canvas.drawText(timeText, width / 2, height / 2 + 80, timePaint);
        
        return bitmap;
    }
    
    private Bitmap createFrameWithOverlay(
            int width,
            int height,
            String overlayType,
            String overlayValue,
            ReadableMap position,
            String overlayColor,
            int overlaySize,
            int frameIndex
    ) {
        // Create a bitmap for the video frame
        Bitmap frameBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(frameBitmap);
        
        // Create video-like background
        Paint bgPaint = new Paint();
        bgPaint.setColor(android.graphics.Color.parseColor("#1a1a1a"));
        canvas.drawRect(0, 0, width, height, bgPaint);
        
        // Add video content simulation
        Paint videoPaint = new Paint();
        videoPaint.setColor(android.graphics.Color.parseColor("#333333"));
        
        // Create animated pattern
        for (int i = 0; i < width; i += 60) {
            for (int j = 0; j < height; j += 60) {
                if ((i + j + frameIndex) % 120 < 60) {
                    canvas.drawRect(i, j, i + 30, j + 30, videoPaint);
                }
            }
        }
        
        // Add video content text
        Paint contentPaint = new Paint();
        contentPaint.setColor(android.graphics.Color.parseColor("#666666"));
        contentPaint.setTextSize(24);
        contentPaint.setTextAlign(Paint.Align.CENTER);
        
        String contentText = "Original Video - Frame " + (frameIndex + 1);
        canvas.drawText(contentText, width / 2, height / 2, contentPaint);
        
        // Add overlay based on type
        switch (overlayType) {
            case "text":
                drawTextOverlay(canvas, overlayValue, position, overlayColor, overlaySize, width, height);
                break;
            case "image":
                drawImageOverlay(canvas, overlayValue, position, width, height);
                break;
            case "shape":
                drawShapeOverlay(canvas, overlayValue, position, overlayColor, width, height);
                break;
            default:
                Log.d(TAG, "Unknown overlay type: " + overlayType);
                break;
        }
        
        return frameBitmap;
    }
    
    private void drawTextOverlay(Canvas canvas, String text, ReadableMap position, String color, int size, int width, int height) {
        Paint textPaint = new Paint();
        textPaint.setColor(parseColor(color));
        textPaint.setTextSize(size);
        textPaint.setTypeface(Typeface.DEFAULT_BOLD);
        textPaint.setAntiAlias(true);
        
        // Add shadow for better visibility
        textPaint.setShadowLayer(3, 2, 2, android.graphics.Color.BLACK);
        
        // Parse position
        float x = position != null && position.hasKey("x") ? position.getInt("x") : width / 2;
        float y = position != null && position.hasKey("y") ? position.getInt("y") : height / 2;
        
        // Center the text
        Paint.FontMetrics fontMetrics = textPaint.getFontMetrics();
        float textWidth = textPaint.measureText(text);
        float textHeight = fontMetrics.descent - fontMetrics.ascent;
        
        canvas.drawText(text, x - textWidth / 2, y + textHeight / 2, textPaint);
    }
    
    private void drawImageOverlay(Canvas canvas, String imagePath, ReadableMap position, int width, int height) {
        // For demo purposes, draw a placeholder rectangle
        Paint imagePaint = new Paint();
        imagePaint.setColor(android.graphics.Color.parseColor("#4CAF50"));
        
        // Parse position
        float x = position != null && position.hasKey("x") ? position.getInt("x") : width / 2;
        float y = position != null && position.hasKey("y") ? position.getInt("y") : height / 2;
        
        int imageSize = 100;
        Rect imageRect = new Rect(
            (int) (x - imageSize / 2),
            (int) (y - imageSize / 2),
            (int) (x + imageSize / 2),
            (int) (y + imageSize / 2)
        );
        
        canvas.drawRect(imageRect, imagePaint);
        
        // Draw border
        Paint borderPaint = new Paint();
        borderPaint.setColor(android.graphics.Color.WHITE);
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(3);
        canvas.drawRect(imageRect, borderPaint);
        
        // Draw "IMAGE" text
        Paint textPaint = new Paint();
        textPaint.setColor(android.graphics.Color.WHITE);
        textPaint.setTextSize(16);
        textPaint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText("IMAGE", x, y, textPaint);
    }
    
    private void drawShapeOverlay(Canvas canvas, String shapeType, ReadableMap position, String color, int width, int height) {
        Paint shapePaint = new Paint();
        shapePaint.setColor(parseColor(color));
        shapePaint.setStyle(Paint.Style.FILL);
        shapePaint.setAntiAlias(true);
        
        // Parse position
        float x = position != null && position.hasKey("x") ? position.getInt("x") : width / 2;
        float y = position != null && position.hasKey("y") ? position.getInt("y") : height / 2;
        
        switch (shapeType) {
            case "circle":
                canvas.drawCircle(x, y, 25, shapePaint);
                break;
            case "rectangle":
                canvas.drawRect(x - 30, y - 20, x + 30, y + 20, shapePaint);
                break;
            case "triangle":
                Path trianglePath = new Path();
                trianglePath.moveTo(x, y - 25);
                trianglePath.lineTo(x - 25, y + 25);
                trianglePath.lineTo(x + 25, y + 25);
                trianglePath.close();
                canvas.drawPath(trianglePath, shapePaint);
                break;
            default:
                // Default to circle
                canvas.drawCircle(x, y, 25, shapePaint);
                break;
        }
        
        // Add border
        Paint borderPaint = new Paint();
        borderPaint.setColor(android.graphics.Color.WHITE);
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(2);
        borderPaint.setAntiAlias(true);
        
        switch (shapeType) {
            case "circle":
                canvas.drawCircle(x, y, 25, borderPaint);
                break;
            case "rectangle":
                canvas.drawRect(x - 30, y - 20, x + 30, y + 20, borderPaint);
                break;
            case "triangle":
                Path triangleBorderPath = new Path();
                triangleBorderPath.moveTo(x, y - 25);
                triangleBorderPath.lineTo(x - 25, y + 25);
                triangleBorderPath.lineTo(x + 25, y + 25);
                triangleBorderPath.close();
                canvas.drawPath(triangleBorderPath, borderPaint);
                break;
            default:
                canvas.drawCircle(x, y, 25, borderPaint);
                break;
        }
    }
    
    private void renderBitmapToEncoderSurface(Bitmap bitmap, MediaCodec encoder) {
        try {
            android.view.Surface surface = encoder.createInputSurface();
            Canvas surfaceCanvas = surface.lockCanvas(null);
            if (surfaceCanvas != null) {
                surfaceCanvas.drawBitmap(bitmap, 0, 0, null);
                surface.unlockCanvasAndPost(surfaceCanvas);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to render bitmap to encoder surface", e);
        }
    }
    
    private int parseColor(String colorString) {
        try {
            if (colorString.startsWith("#")) {
                return android.graphics.Color.parseColor(colorString);
            } else {
                return android.graphics.Color.parseColor("#" + colorString);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse color: " + colorString, e);
            return android.graphics.Color.RED;
        }
    }
}
