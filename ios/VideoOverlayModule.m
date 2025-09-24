#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreGraphics/CoreGraphics.h>
#import <UIKit/UIKit.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>

@interface VideoOverlayModule : NSObject <RCTBridgeModule>
@end

@implementation VideoOverlayModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(addOverlay:(NSString *)sourcePath
                  overlay:(NSDictionary *)overlay
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            RCTLogInfo(@"Starting video overlay processing");
            RCTLogInfo(@"Source path: %@", sourcePath);
            RCTLogInfo(@"Overlay config: %@", overlay);
            
            // Parse overlay configuration
            NSString *overlayType = overlay[@"type"] ?: @"text";
            NSString *overlayValue = overlay[@"value"] ?: @"Sample Text";
            NSDictionary *position = overlay[@"position"];
            NSString *overlayColor = overlay[@"color"] ?: @"#FFFFFF";
            NSNumber *overlaySize = overlay[@"size"] ?: @(24);
            
            // Create output path
            NSString *outputPath = [self createOutputPath:sourcePath];
            
            // Process video with overlay
            NSString *resultPath = [self processVideoWithOverlay:sourcePath
                                                       outputPath:outputPath
                                                      overlayType:overlayType
                                                     overlayValue:overlayValue
                                                        position:position
                                                           color:overlayColor
                                                            size:overlaySize];
            
            RCTLogInfo(@"Video overlay processing completed: %@", resultPath);
            
            resolve(resultPath);
            
        } @catch (NSException *exception) {
            RCTLogError(@"Video overlay processing failed: %@", exception.reason);
            reject(@"VIDEO_OVERLAY_ERROR", exception.reason, nil);
        }
    });
}

- (NSString *)createOutputPath:(NSString *)sourcePath {
    NSString *timestamp = [NSString stringWithFormat:@"%ld", (long)[[NSDate date] timeIntervalSince1970] * 1000];
    NSString *fileName = [NSString stringWithFormat:@"overlay_video_%@.mp4", timestamp];
    
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *documentsDirectory = [paths objectAtIndex:0];
    return [documentsDirectory stringByAppendingPathComponent:fileName];
}

- (NSString *)processVideoWithOverlay:(NSString *)sourcePath
                          outputPath:(NSString *)outputPath
                         overlayType:(NSString *)overlayType
                        overlayValue:(NSString *)overlayValue
                            position:(NSDictionary *)position
                               color:(NSString *)color
                                size:(NSNumber *)size {
    
    RCTLogInfo(@"Processing video with overlay type: %@", overlayType);
    
    // Load source video
    NSURL *sourceURL = [NSURL fileURLWithPath:sourcePath];
    AVAsset *sourceAsset = [AVAsset assetWithURL:sourceURL];
    
    if (!sourceAsset) {
        @throw [NSException exceptionWithName:@"VideoOverlayError"
                                       reason:@"Failed to load source video"
                                     userInfo:nil];
    }
    
    // Get video track
    AVAssetTrack *videoTrack = [[sourceAsset tracksWithMediaType:AVMediaTypeVideo] firstObject];
    if (!videoTrack) {
        @throw [NSException exceptionWithName:@"VideoOverlayError"
                                       reason:@"No video track found"
                                     userInfo:nil];
    }
    
    // Get video dimensions
    CGSize videoSize = videoTrack.naturalSize;
    RCTLogInfo(@"Video dimensions: %.0fx%.0f", videoSize.width, videoSize.height);
    
    // Create composition
    AVMutableComposition *composition = [AVMutableComposition composition];
    AVMutableCompositionTrack *compositionVideoTrack = [composition addMutableTrackWithMediaType:AVMediaTypeVideo
                                                                                 preferredTrackID:kCMPersistentTrackID_Invalid];
    
    NSError *error;
    [compositionVideoTrack insertTimeRange:CMTimeRangeMake(kCMTimeZero, sourceAsset.duration)
                                   ofTrack:videoTrack
                                    atTime:kCMTimeZero
                                     error:&error];
    
    if (error) {
        @throw [NSException exceptionWithName:@"VideoOverlayError"
                                       reason:[NSString stringWithFormat:@"Failed to insert video track: %@", error.localizedDescription]
                                     userInfo:nil];
    }
    
    // Create video composition
    AVMutableVideoComposition *videoComposition = [AVMutableVideoComposition videoComposition];
    videoComposition.frameDuration = CMTimeMake(1, 30); // 30 FPS
    videoComposition.renderSize = videoSize;
    
    // Create instruction
    AVMutableVideoCompositionInstruction *instruction = [AVMutableVideoCompositionInstruction videoCompositionInstruction];
    instruction.timeRange = CMTimeRangeMake(kCMTimeZero, sourceAsset.duration);
    
    AVMutableVideoCompositionLayerInstruction *layerInstruction = [AVMutableVideoCompositionLayerInstruction videoCompositionLayerInstructionWithAssetTrack:compositionVideoTrack];
    instruction.layerInstructions = @[layerInstruction];
    
    videoComposition.instructions = @[instruction];
    
    // Create overlay layer
    CALayer *overlayLayer = [self createOverlayLayer:overlayType
                                         overlayValue:overlayValue
                                             position:position
                                                color:color
                                                 size:size
                                            videoSize:videoSize];
    
    if (overlayLayer) {
        // Create parent layer
        CALayer *parentLayer = [CALayer layer];
        parentLayer.frame = CGRectMake(0, 0, videoSize.width, videoSize.height);
        
        CALayer *videoLayer = [CALayer layer];
        videoLayer.frame = CGRectMake(0, 0, videoSize.width, videoSize.height);
        
        [parentLayer addSublayer:videoLayer];
        [parentLayer addSublayer:overlayLayer];
        
        // Set up core animation tool
        videoComposition.animationTool = [AVVideoCompositionCoreAnimationTool videoCompositionCoreAnimationToolWithPostProcessingAsVideoLayer:videoLayer
                                                                                                                                    inLayer:parentLayer];
    }
    
    // Export video
    AVAssetExportSession *exportSession = [[AVAssetExportSession alloc] initWithAsset:composition
                                                                           presetName:AVAssetExportPresetHighestQuality];
    exportSession.outputURL = [NSURL fileURLWithPath:outputPath];
    exportSession.outputFileType = AVFileTypeMPEG4;
    exportSession.videoComposition = videoComposition;
    
    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
    __block NSError *exportError = nil;
    
    [exportSession exportAsynchronouslyWithCompletionHandler:^{
        if (exportSession.status == AVAssetExportSessionStatusFailed) {
            exportError = exportSession.error;
        }
        dispatch_semaphore_signal(semaphore);
    }];
    
    dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
    
    if (exportError) {
        @throw [NSException exceptionWithName:@"VideoOverlayError"
                                       reason:[NSString stringWithFormat:@"Export failed: %@", exportError.localizedDescription]
                                     userInfo:nil];
    }
    
    RCTLogInfo(@"Video overlay processing completed: %@", outputPath);
    return outputPath;
}

- (CALayer *)createOverlayLayer:(NSString *)overlayType
                   overlayValue:(NSString *)overlayValue
                       position:(NSDictionary *)position
                          color:(NSString *)color
                           size:(NSNumber *)size
                      videoSize:(CGSize)videoSize {
    
    CALayer *overlayLayer = [CALayer layer];
    overlayLayer.frame = CGRectMake(0, 0, videoSize.width, videoSize.height);
    
    // Parse position
    CGFloat x = position[@"x"] ? [position[@"x"] floatValue] : videoSize.width / 2;
    CGFloat y = position[@"y"] ? [position[@"y"] floatValue] : videoSize.height / 2;
    
    if ([overlayType isEqualToString:@"text"]) {
        [self addTextOverlay:overlayLayer
                        text:overlayValue
                        color:color
                        size:[size floatValue]
                        position:CGPointMake(x, y)];
    } else if ([overlayType isEqualToString:@"image"]) {
        [self addImageOverlay:overlayLayer
                      imagePath:overlayValue
                      position:CGPointMake(x, y)];
    } else if ([overlayType isEqualToString:@"shape"]) {
        [self addShapeOverlay:overlayLayer
                      shapeType:overlayValue
                        color:color
                      position:CGPointMake(x, y)];
    }
    
    return overlayLayer;
}

- (void)addTextOverlay:(CALayer *)layer
                  text:(NSString *)text
                 color:(NSString *)color
                  size:(CGFloat)size
              position:(CGPoint)position {
    
    CATextLayer *textLayer = [CATextLayer layer];
    textLayer.string = text;
    textLayer.fontSize = size;
    textLayer.foregroundColor = [self colorFromHexString:color].CGColor;
    textLayer.alignmentMode = kCAAlignmentCenter;
    textLayer.frame = CGRectMake(position.x - 100, position.y - size/2, 200, size + 10);
    textLayer.opacity = 0.9;
    
    // Add shadow for better visibility
    textLayer.shadowColor = [UIColor blackColor].CGColor;
    textLayer.shadowOffset = CGSizeMake(2, 2);
    textLayer.shadowOpacity = 0.8;
    textLayer.shadowRadius = 3;
    
    [layer addSublayer:textLayer];
}

- (void)addImageOverlay:(CALayer *)layer
              imagePath:(NSString *)imagePath
              position:(CGPoint)position {
    
    // Load image
    UIImage *image = [UIImage imageWithContentsOfFile:imagePath];
    if (!image) {
        RCTLogWarn(@"Failed to load image from path: %@", imagePath);
        return;
    }
    
    CALayer *imageLayer = [CALayer layer];
    imageLayer.contents = (__bridge id)image.CGImage;
    imageLayer.frame = CGRectMake(position.x - 50, position.y - 50, 100, 100);
    imageLayer.contentsGravity = kCAGravityResizeAspect;
    imageLayer.opacity = 0.9;
    
    // Add border
    imageLayer.borderWidth = 2;
    imageLayer.borderColor = [UIColor whiteColor].CGColor;
    imageLayer.cornerRadius = 5;
    
    [layer addSublayer:imageLayer];
}

- (void)addShapeOverlay:(CALayer *)layer
              shapeType:(NSString *)shapeType
                  color:(NSString *)color
              position:(CGPoint)position {
    
    CAShapeLayer *shapeLayer = [CAShapeLayer layer];
    shapeLayer.fillColor = [self colorFromHexString:color].CGColor;
    shapeLayer.strokeColor = [UIColor whiteColor].CGColor;
    shapeLayer.lineWidth = 2;
    shapeLayer.opacity = 0.8;
    
    UIBezierPath *path;
    
    if ([shapeType isEqualToString:@"circle"]) {
        path = [UIBezierPath bezierPathWithOvalInRect:CGRectMake(position.x - 25, position.y - 25, 50, 50)];
    } else if ([shapeType isEqualToString:@"rectangle"]) {
        path = [UIBezierPath bezierPathWithRect:CGRectMake(position.x - 30, position.y - 20, 60, 40)];
    } else if ([shapeType isEqualToString:@"triangle"]) {
        path = [UIBezierPath bezierPath];
        [path moveToPoint:CGPointMake(position.x, position.y - 25)];
        [path addLineToPoint:CGPointMake(position.x - 25, position.y + 25)];
        [path addLineToPoint:CGPointMake(position.x + 25, position.y + 25)];
        [path closePath];
    } else {
        // Default to circle
        path = [UIBezierPath bezierPathWithOvalInRect:CGRectMake(position.x - 25, position.y - 25, 50, 50)];
    }
    
    shapeLayer.path = path.CGPath;
    [layer addSublayer:shapeLayer];
}

- (UIColor *)colorFromHexString:(NSString *)hexString {
    NSString *cleanString = [hexString stringByReplacingOccurrencesOfString:@"#" withString:@""];
    if ([cleanString length] == 3) {
        cleanString = [NSString stringWithFormat:@"%@%@%@%@%@%@",
                       [cleanString substringWithRange:NSMakeRange(0, 1)],[cleanString substringWithRange:NSMakeRange(0,  1)],
                       [cleanString substringWithRange:NSMakeRange(1, 1)],[cleanString substringWithRange:NSMakeRange(1, 1)],
                       [cleanString substringWithRange:NSMakeRange(2, 1)],[cleanString substringWithRange:NSMakeRange(2, 1)]];
    }
    if ([cleanString length] == 6) {
        cleanString = [cleanString stringByAppendingString:@"ff"];
    }
    
    unsigned int baseValue;
    [[NSScanner scannerWithString:cleanString] scanHexInt:&baseValue];
    
    float red = ((baseValue >> 24) & 0xFF)/255.0f;
    float green = ((baseValue >> 16) & 0xFF)/255.0f;
    float blue = ((baseValue >> 8) & 0xFF)/255.0f;
    float alpha = ((baseValue >> 0) & 0xFF)/255.0f;
    
    return [UIColor colorWithRed:red green:green blue:blue alpha:alpha];
}

@end

