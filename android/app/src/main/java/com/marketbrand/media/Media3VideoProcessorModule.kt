package com.marketbrand.media

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.media3.common.MediaItem
import androidx.media3.effect.BitmapOverlay
import androidx.media3.effect.OverlayEffect
import androidx.media3.effect.TextureOverlay
import androidx.media3.transformer.Composition
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.Transformer
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.google.common.collect.ImmutableList
import android.media.MediaMetadataRetriever
import java.io.File
import java.io.IOException
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Native module that uses AndroidX Media3 Transformer to apply bitmap/text overlays to an input video.
 *
 * NOTE: This is an initial implementation. More overlay types (animations, templates, etc.)
 * can be layered on top of the current data model.
 */
class Media3VideoProcessorModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val mainHandler = Handler(Looper.getMainLooper())
  private val executor: ExecutorService = Executors.newSingleThreadExecutor()

  override fun getName(): String = NAME

  @ReactMethod
  fun applyOverlays(
    inputUriString: String,
    overlaysArray: ReadableArray,
    options: ReadableMap?,
    promise: Promise
  ) {
    executor.execute {
      try {
        val inputUri = Uri.parse(inputUriString)
        val appContext = reactApplicationContext ?: throw IllegalStateException("Context unavailable")
        val cacheDir = appContext.cacheDir ?: throw IOException("Cache directory unavailable")
        val outputFile = createOutputFile(cacheDir, options)

        Log.d(TAG, "Preparing overlays: $overlaysArray")
        val layers = parseOverlayLayers(overlaysArray)
        val (videoWidth, videoHeight) = getVideoDimensions(appContext, inputUri)
        val compositeBitmap = buildCompositeOverlayBitmap(appContext, layers, videoWidth, videoHeight)

        val textureOverlays: ImmutableList<TextureOverlay> = if (compositeBitmap != null) {
          ImmutableList.of<TextureOverlay>(BitmapOverlay.createStaticBitmapOverlay(compositeBitmap))
        } else {
          ImmutableList.of()
        }

        mainHandler.post {
          try {
            startTransformation(appContext, inputUri, textureOverlays, outputFile, promise)
          } catch (error: Exception) {
            Log.e(TAG, "Media3 transformation failed on main thread", error)
            promise.reject("MEDIA3_PROCESS_ERROR", error)
          }
        }
      } catch (error: Exception) {
        Log.e(TAG, "Media3 transformation failed", error)
        promise.reject("MEDIA3_PROCESS_ERROR", error)
      }
    }
  }

  private fun startTransformation(
    context: Context,
    inputUri: Uri,
    textureOverlays: ImmutableList<TextureOverlay>,
    outputFile: File,
    promise: Promise,
  ) {
    val editedMediaItemBuilder = EditedMediaItem.Builder(MediaItem.fromUri(inputUri))

    if (textureOverlays.isNotEmpty()) {
      val overlayEffect = OverlayEffect(textureOverlays)
      val effects = Effects(emptyList(), listOf(overlayEffect))
      editedMediaItemBuilder.setEffects(effects)
    }

    val editedMediaItem = editedMediaItemBuilder.build()

    val transformer = Transformer.Builder(context)
      .addListener(object : Transformer.Listener {
        override fun onCompleted(composition: Composition, exportResult: ExportResult) {
          promise.resolve(outputFile.absolutePath)
        }

        override fun onError(
          composition: Composition,
          exportResult: ExportResult,
          exportException: ExportException,
        ) {
          promise.reject("MEDIA3_EXPORT_ERROR", exportException)
        }
      })
      .build()

    transformer.start(editedMediaItem, outputFile.absolutePath)
  }

  private fun parseOverlayLayers(array: ReadableArray): List<OverlayLayer> {
    val layers = mutableListOf<OverlayLayer>()
    for (i in 0 until array.size()) {
      val map = array.getMap(i) ?: continue
      val type = map.getString("type") ?: continue
      val position = map.getMap("position")
      val x = position?.getDouble("x") ?: 0.0
      val y = position?.getDouble("y") ?: 0.0
      val width = map.getDoubleOrNull("width")
      val height = map.getDoubleOrNull("height")
      val opacity = map.getDoubleOrNull("opacity") ?: 1.0

      when (type) {
        "image" -> {
          val uri = map.getString("uri") ?: continue
          layers.add(
            OverlayLayer.ImageLayer(
              uri = uri,
              normalizedX = x,
              normalizedY = y,
              normalizedWidth = width,
              normalizedHeight = height,
              opacity = opacity,
            )
          )
        }

        "text" -> {
          val text = map.getString("text") ?: continue
          val fontSize = map.getDoubleOrNull("fontSize") ?: 18.0
          val color = map.getString("color") ?: "#FFFFFFFF"
          val backgroundColor = map.getString("backgroundColor")
          val fontFamily = map.getString("fontFamily")
          layers.add(
            OverlayLayer.TextLayer(
              text = text,
              normalizedX = x,
              normalizedY = y,
              fontSize = fontSize.toFloat(),
              color = color,
              backgroundColor = backgroundColor,
              fontFamily = fontFamily,
              normalizedWidth = width,
              normalizedHeight = height,
              opacity = opacity.toFloat(),
            )
          )
        }

        else -> Log.w(TAG, "Unsupported overlay type: $type")
      }
    }
    return layers
  }

  private fun getVideoDimensions(context: Context, uri: Uri): Pair<Int, Int> {
    var retriever: MediaMetadataRetriever? = null
    return try {
      retriever = MediaMetadataRetriever().apply {
        setDataSource(context, uri)
      }
      val width = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull()
      val height = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull()
      Pair(width ?: DEFAULT_VIDEO_WIDTH, height ?: DEFAULT_VIDEO_HEIGHT)
    } catch (error: Exception) {
      Log.w(TAG, "Failed to read video metadata, using defaults", error)
      Pair(DEFAULT_VIDEO_WIDTH, DEFAULT_VIDEO_HEIGHT)
    } finally {
      retriever?.release()
    }
  }

  private fun buildCompositeOverlayBitmap(
    context: Context,
    layers: List<OverlayLayer>,
    videoWidth: Int,
    videoHeight: Int,
  ): Bitmap? {
    if (layers.isEmpty()) {
      return null
    }

    val width = videoWidth.coerceAtLeast(1)
    val height = videoHeight.coerceAtLeast(1)
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    canvas.drawColor(Color.TRANSPARENT)

    layers.forEach { layer ->
      when (layer) {
        is OverlayLayer.ImageLayer -> {
          val source = loadBitmap(context, layer.uri) ?: return@forEach
          val targetWidth = layer.normalizedWidth?.let { (it * width).toInt().coerceAtLeast(1) } ?: source.width
          val targetHeight = layer.normalizedHeight?.let { (it * height).toInt().coerceAtLeast(1) } ?: source.height
          val scaled = if (targetWidth != source.width || targetHeight != source.height) {
            Bitmap.createScaledBitmap(source, targetWidth, targetHeight, true)
          } else {
            source
          }

          val (left, top) = computeLayerPosition(layer, targetWidth, targetHeight, width, height)
          val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            alpha = (layer.opacity.coerceIn(0.0, 1.0) * 255).toInt()
          }
          canvas.drawBitmap(scaled, left, top, paint)
          if (scaled != source) {
            scaled.recycle()
          }
          source.recycle()
        }

        is OverlayLayer.TextLayer -> {
          val textBitmap = createTextBitmap(layer)
          val targetWidth = layer.normalizedWidth?.let { (it * width).toInt().coerceAtLeast(1) } ?: textBitmap.width
          val targetHeight = layer.normalizedHeight?.let { (it * height).toInt().coerceAtLeast(1) } ?: textBitmap.height
          val scaled = if (targetWidth != textBitmap.width || targetHeight != textBitmap.height) {
            Bitmap.createScaledBitmap(textBitmap, targetWidth, targetHeight, true)
          } else {
            textBitmap
          }

          val (left, top) = computeLayerPosition(layer, targetWidth, targetHeight, width, height)
          val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            alpha = (layer.opacity.coerceIn(0.0, 1.0) * 255).toInt()
          }
          canvas.drawBitmap(scaled, left, top, paint)
          if (scaled != textBitmap) {
            scaled.recycle()
          }
          textBitmap.recycle()
        }
      }
    }

    return bitmap
  }

  private fun computeLayerPosition(
    layer: OverlayLayer,
    layerWidth: Int,
    layerHeight: Int,
    videoWidth: Int,
    videoHeight: Int,
  ): Pair<Float, Float> {
    val centerX = (layer.normalizedX.coerceIn(0.0, 1.0) * videoWidth).toFloat()
    val centerY = (layer.normalizedY.coerceIn(0.0, 1.0) * videoHeight).toFloat()
    val left = centerX - layerWidth / 2f
    val top = centerY - layerHeight / 2f
    val maxLeft = (videoWidth - layerWidth).coerceAtLeast(0).toFloat()
    val maxTop = (videoHeight - layerHeight).coerceAtLeast(0).toFloat()
    return Pair(left.coerceIn(0f, maxLeft), top.coerceIn(0f, maxTop))
  }

  private fun createTextBitmap(layer: OverlayLayer.TextLayer): Bitmap {
    val fontSizePx = layer.fontSize.coerceAtLeast(12f)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = parseColor(layer.color)
      textSize = fontSizePx
      typeface = when {
        layer.fontFamily.isNullOrEmpty() -> Typeface.DEFAULT_BOLD
        else -> Typeface.create(layer.fontFamily, Typeface.BOLD)
      }
      alpha = (layer.opacity.toDouble().coerceIn(0.0, 1.0) * 255).toInt()
    }

    val text = layer.text
    val textWidth = paint.measureText(text)
    val fontMetrics = paint.fontMetrics
    val textHeight = fontMetrics.bottom - fontMetrics.top

    val padding = fontSizePx / 3
    val bitmapWidth = (textWidth + padding * 2).toInt().coerceAtLeast(1)
    val bitmapHeight = (textHeight + padding * 2).toInt().coerceAtLeast(1)

    val bitmap = Bitmap.createBitmap(bitmapWidth, bitmapHeight, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    layer.backgroundColor?.let { bgColor ->
      val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = parseColor(bgColor)
      }
      canvas.drawRoundRect(
        0f,
        0f,
        bitmapWidth.toFloat(),
        bitmapHeight.toFloat(),
        padding / 2,
        padding / 2,
        bgPaint,
      )
    }

    canvas.drawText(text, padding, padding - fontMetrics.top, paint)

    return bitmap
  }

  private fun loadBitmap(context: Context, uriString: String): Bitmap? {
    return try {
      when {
        uriString.startsWith("file://") -> BitmapFactory.decodeFile(uriString.removePrefix("file://"))
        uriString.startsWith("/") -> BitmapFactory.decodeFile(uriString)
        uriString.startsWith("content://") -> {
          context.contentResolver.openInputStream(Uri.parse(uriString)).use { stream ->
            BitmapFactory.decodeStream(stream)
          }
        }

        uriString.startsWith("http") || uriString.startsWith("https") -> {
          val connection = java.net.URL(uriString).openConnection()
          connection.connect()
          connection.getInputStream().use { stream ->
            BitmapFactory.decodeStream(stream)
          }
        }

        else -> BitmapFactory.decodeFile(uriString)
      }
    } catch (error: Exception) {
      Log.e(TAG, "Failed to load bitmap from $uriString", error)
      null
    }
  }

  private fun parseColor(colorString: String?): Int {
    if (colorString.isNullOrBlank()) {
      return Color.WHITE
    }

    val trimmed = colorString.trim()

    return try {
      when {
        trimmed.startsWith("rgba", ignoreCase = true) -> {
          val parts = trimmed
            .removePrefix("rgba")
            .removePrefix("(")
            .removeSuffix(")")
            .split(",")
            .map { it.trim() }
          val r = parts.getOrNull(0)?.toFloatOrNull()?.coerceIn(0f, 255f) ?: 0f
          val g = parts.getOrNull(1)?.toFloatOrNull()?.coerceIn(0f, 255f) ?: 0f
          val b = parts.getOrNull(2)?.toFloatOrNull()?.coerceIn(0f, 255f) ?: 0f
          val a = parts.getOrNull(3)?.toFloatOrNull()?.coerceIn(0f, 1f) ?: 1f
          Color.argb((a * 255).toInt(), r.toInt(), g.toInt(), b.toInt())
        }

        trimmed.startsWith("rgb", ignoreCase = true) -> {
          val parts = trimmed
            .removePrefix("rgb")
            .removePrefix("(")
            .removeSuffix(")")
            .split(",")
            .map { it.trim() }
          val r = parts.getOrNull(0)?.toFloatOrNull()?.coerceIn(0f, 255f) ?: 0f
          val g = parts.getOrNull(1)?.toFloatOrNull()?.coerceIn(0f, 255f) ?: 0f
          val b = parts.getOrNull(2)?.toFloatOrNull()?.coerceIn(0f, 255f) ?: 0f
          Color.rgb(r.toInt(), g.toInt(), b.toInt())
        }

        trimmed.equals("transparent", ignoreCase = true) -> Color.TRANSPARENT
        else -> Color.parseColor(trimmed)
      }
    } catch (error: IllegalArgumentException) {
      Log.w(TAG, "Invalid color string $colorString, defaulting to white", error)
      Color.WHITE
    }
  }

  private fun ReadableMap.getDoubleOrNull(key: String): Double? =
    if (hasKey(key) && !isNull(key)) getDouble(key) else null

  private fun createOutputFile(cacheDir: File, options: ReadableMap?): File {
    val fileName = options?.getStringOrNull("fileName") ?: "overlay_${System.currentTimeMillis()}.mp4"
    return File(cacheDir, fileName)
  }

  private fun ReadableMap.getStringOrNull(key: String): String? =
    if (hasKey(key) && !isNull(key)) getString(key) else null

  companion object {
    private const val NAME = "Media3VideoProcessor"
    private const val TAG = "Media3VideoProcessor"
    private const val DEFAULT_VIDEO_WIDTH = 720
    private const val DEFAULT_VIDEO_HEIGHT = 1280
  }

  private sealed class OverlayLayer(
    val normalizedX: Double,
    val normalizedY: Double,
    val normalizedWidth: Double?,
    val normalizedHeight: Double?,
    val opacity: Double,
  ) {
    class ImageLayer(
      val uri: String,
      normalizedX: Double,
      normalizedY: Double,
      normalizedWidth: Double?,
      normalizedHeight: Double?,
      opacity: Double,
    ) : OverlayLayer(normalizedX, normalizedY, normalizedWidth, normalizedHeight, opacity)

    class TextLayer(
      val text: String,
      normalizedX: Double,
      normalizedY: Double,
      val fontSize: Float,
      val color: String,
      val backgroundColor: String?,
      val fontFamily: String?,
      normalizedWidth: Double?,
      normalizedHeight: Double?,
      opacity: Float,
    ) : OverlayLayer(normalizedX, normalizedY, normalizedWidth, normalizedHeight, opacity.toDouble())
  }
}

