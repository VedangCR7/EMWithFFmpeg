// Frame-specific element positioning configurations
// All coordinates are based on reference canvas size: 720x487.2

interface FrameLayoutElement {
  key: string;
  x: number;
  y: number;
  circular?: boolean; // Optional property to make logo circular
  size?: { width: number; height: number }; // Optional property to control element size
  color?: string; // Optional property to set text color
}

interface FrameLayouts {
  [key: string]: FrameLayoutElement[];
}

interface FrameAssets {
  [key: string]: string;
}

export const FRAME_LAYOUTS: FrameLayouts = {
  frame1: [
    { key: 'companyName', x: 50, y: 40 }, // Default position - no manual position provided
    { key: 'phone', x: 96, y: 454, color: 'black' }, // Updated to position phone at (x: 45.8, y: 315.1) on canvas
    { key: 'email', x: 96, y: 432, color: 'black' }, // Updated to position email at (x: 45.8, y: 307.1) on canvas
    { key: 'website', x: 449, y: 454, color: 'black' }, // Updated to position website at (x: 214.2, y: 315.1) on canvas
    { key: 'address', x: 449, y: 436, color: 'black' }, // Updated to position address at (x: 176.7, y: 307.1) on canvas
    { key: 'category', x: 245, y: 447, color: 'black' }, // Updated to position category at (x: 112.0, y: 315.1) on canvas
    { key: 'logo', x: 580, y: 40 }, // Default position - no manual position provided
  ],
  frame2: [
    { key: 'companyName', x: 61, y: 27 }, // Default position - no manual position provided
    { key: 'phone', x: 80, y: 459,  }, // Updated to position phone at (x: 38.1, y: 323.1) on canvas
    { key: 'email', x: 290, y: 459 }, // Default position - no manual position provided
    { key: 'website', x: 490, y: 459 }, // Default position - no manual position provided
    { key: 'address', x: 290, y: 445 }, // Default position - no manual position provided
    { key: 'category', x: 80, y: 445 }, // Default position - no manual position provided
    { key: 'logo', x: 600, y: 15 }, // Default position - no manual position provided
  ],
  frame3: [
    { key: 'companyName', x: 61, y: 27 }, // Default position - no manual position provided
    { key: 'phone', x: 50, y: 445 }, // Default position - no manual position provided
    { key: 'email', x: 250, y: 445 }, // Default position - no manual position provided
    { key: 'website', x: 450, y: 445 }, // Default position - no manual position provided
    { key: 'address', x: 61, y: 422, color:'black' }, // Updated to position address at (x: 29.1, y: 297.6) on canvas
    { key: 'category', x: 250, y: 422, color:'black' }, // Updated to position category at (x: 119.2, y: 297.6) on canvas
    { key: 'logo', x: 550, y: 30 }, // Default position - no manual position provided
  ],
  frame4: [
    { key: 'companyName', x: 30, y: 30 }, // Will be positioned based on current canvas position
    { key: 'phone', x: 84, y: 432 }, // Updated to position phone at (x: 40.2, y: 304.3) on canvas
    { key: 'email', x: 84, y: 451 }, // Updated to position email at (x: 40.2, y: 317.8) on canvas
    { key: 'website', x: 456, y: 432 }, // Updated to position website at (x: 217.7, y: 304.3) on canvas
    { key: 'address', x: 447, y: 456 }, // Updated to position address at (x: 212.5, y: 321.6) on canvas
    { key: 'category', x: 253, y: 434 }, // Updated to position category at (x: 120.2, y: 305.6) on canvas
    { key: 'logo', x: 570, y: 20 }, // Logo positioned with moderate right alignment
  ],
  frame5: [
    { key: 'companyName', x: 32, y: 40 }, // Updated to position companyName at (x: 15.1, y: 27.9) on canvas
    { key: 'phone', x: 140, y: 420 }, // Updated to position phone at (x: 66.8, y: 295.2) on canvas
    { key: 'email', x: 140, y: 440 }, // Updated to position email at (x: 66.8, y: 312.4) on canvas
    { key: 'website', x: 450, y: 404 }, // Updated to position website at (x: 214.1, y: 288.0) on canvas
    { key: 'address', x: 449, y: 421 }, // Updated to position address at (x: 213.5, y: 296.4) on canvas
    { key: 'category', x: 449, y: 444 }, // Updated to position category at (x: 213.5, y: 312.4) on canvas
    { key: 'logo', x: 15, y: 391, circular: true, size: { width: 60, height: 61 } }, // Updated to position logo at (x: 15.3, y: 279.0) on canvas - CIRCULAR - LARGER SIZE
  ],
  frame6: [
    { key: 'companyName', x: 50, y: 30 }, // Default position - no manual position provided
    { key: 'phone', x: 50, y: 440 }, // Default position - no manual position provided
    { key: 'email', x: 50, y: 409 }, // Default position - no manual position provided
    { key: 'website', x: 441, y: 409 }, // Default position - no manual position provided
    { key: 'address', x: 441, y: 440 }, // Default position - no manual position provided
    { key: 'category', x: 69, y: 364, color:'black' }, // Updated to position category at (x: 33.1, y: 256.2) on canvas
    { key: 'logo', x: 580, y: 20 }, // Default position - no manual position provided
  ],
  frame7: [
    { key: 'companyName', x: 60, y: 25 },
    { key: 'phone', x: 22, y: 385 }, // Updated to position phone at (x: 10.4, y: 271.2) on canvas
    { key: 'email', x: 22, y: 431 }, // Updated to position email at (x: 10.4, y: 304.0) on canvas
    { key: 'website', x: 262, y: 431 }, // Updated to position website at (x: 124.9, y: 304.0) on canvas
    { key: 'address', x: 273, y: 385 }, // Updated to position address at (x: 130.3, y: 271.2) on canvas
    { key: 'category', x: 432, y: 431 }, // Updated to position category at (x: 206.2, y: 304.0) on canvas
    { key: 'logo', x: 580, y: 25 },
  ],
  frame8: [
    { key: 'companyName', x: 55, y: 35 },
    { key: 'phone', x: 190, y: 441 }, // Updated to position phone at (x: 90.6, y: 310.4) on canvas
    { key: 'email', x: 190, y: 402 }, // Updated to position email at (x: 90.6, y: 283.5) on canvas
    { key: 'website', x: 402, y: 402 }, // Updated to position website at (x: 191.7, y: 283.5) on canvas
    { key: 'address', x: 402, y: 441 }, // Updated to position address at (x: 191.7, y: 310.4) on canvas
    { key: 'category', x: 402, y: 417 }, // Updated to position category at (x: 191.7, y: 294.4) on canvas
    { key: 'logo', x: 37, y: 388,  size: { width: 53, height: 51 } }, // Updated to position logo at (x: 15.3, y: 273.7) on canvas
  ],
  frame9: [
    { key: 'companyName', x: 45, y: 40 },
    { key: 'phone', x: 7, y: 435 }, // Updated to position phone at (x: 3.3, y: 306.6) on canvas
    { key: 'email', x: 175, y: 435 },
    { key: 'website', x: 363, y: 435 }, // Updated to position website at (x: 173.2, y: 306.6) on canvas
    { key: 'address', x: 493, y: 435 }, // Updated to position address at (x: 249.0, y: 306.6) on canvas (final position)
    { key: 'category', x: 255, y: 465 }, // Updated to position category at (x: 111.6, y: 327.5) on canvas
    { key: 'logo', x: 570, y: 35 },
  ],
  frame10: [
    { key: 'companyName', x: 50, y: 30 },
    { key: 'phone', x: 82, y: 376, color: 'black' }, // Updated to position phone at (x: 39.1, y: 265.1) on canvas
    { key: 'email', x: 82, y: 409, color: 'black' }, // Updated to position email at (x: 39.1, y: 288.0) on canvas
    { key: 'website', x: 316, y: 376, color: 'black' }, // Updated to position website at (x: 150.7, y: 265.1) on canvas
    { key: 'address', x: 82, y: 432, color: 'black' }, // Updated to position address at (x: 39.1, y: 304.0) on canvas
    { key: 'category', x: 316, y: 409, color: 'black' }, // Updated to position category at (x: 150.7, y: 288.0) on canvas
    { key: 'logo', x: 588, y: 25 },
  ],
  frame11: [
    { key: 'companyName', x: 40, y: 35 },
    { key: 'phone', x: 148, y: 433 }, // Updated to position phone at (x: 70.6, y: 305.0) on canvas
    { key: 'email', x: 149, y: 465 }, // Updated to position email at (x: 70.8, y: 327.4) on canvas
    { key: 'website', x: 342, y: 465 }, // Updated to position website at (x: 162.9, y: 327.4) on canvas
    { key: 'address', x: 339, y: 442 }, // Updated to position address at (x: 161.7, y: 311.4) on canvas
    { key: 'category', x: 527, y: 465 }, // Updated to position category at (x: 251.3, y: 327.4) on canvas
    { key: 'logo', x: 28, y: 352, circular: true, size: { width: 59, height: 60 } }, // Updated to position logo at (x: 19.1, y: 245.6) on canvas
  ],
  frame12: [
    { key: 'companyName', x: 55, y: 25 }, // Default position - no manual position provided
    { key: 'phone', x: 164, y: 68 , color: 'black'}, // Updated to position phone at (x: 78.1, y: 47.7) on canvas
    { key: 'email', x: 323, y: 68 , color: 'black'}, // Updated to position email at (x: 153.9, y: 47.7) on canvas
    { key: 'website', x: 482, y: 460 }, // Updated to position website at (x: 229.8, y: 324.2) on canvas
    { key: 'address', x: 5, y: 460 }, // Updated to position address at (x: 2.2, y: 324.2) on canvas
    { key: 'category', x: 365, y: 40 }, // Updated to position category at (x: 174.3, y: 31.6) on canvas
    { key: 'logo', x: 564, y: 19, circular: true, size: { width: 61, height: 60 } }, // Updated to position logo at (x: 267.0, y: 17.6) on canvas
  ],
  frame13: [
    { key: 'companyName', x: 521, y: 12 }, // Updated to position companyName at (x: 248.6, y: 8.5) on canvas
    { key: 'phone', x: 164, y: 75 }, // Updated to position phone at (x: 78.3, y: 52.8) on canvas
    { key: 'email', x: 323, y: 75 }, // Updated to position email at (x: 154.1, y: 52.7) on canvas
    { key: 'website', x: 521, y: 453 }, // Updated to position website at (x: 248.6, y: 319.1) on canvas
    { key: 'address', x: 25, y: 453 }, // Updated to position address at (x: 11.8, y: 319.3) on canvas
    { key: 'category', x: 184, y: 43 }, // Updated to position category at (x: 87.7, y: 30.5) on canvas
    { key: 'logo', x: 41, y: 23, circular: true, size: { width: 61, height: 60 } }, // Updated to position logo at (x: 19.3, y: 16.5) on canvas
  ],
  // Add more frame layouts as needed
};

// Frame image assets mapping
export const FRAME_ASSETS: FrameAssets = {
  frame1: require('../assets/frames/f1.png'),
  frame2: require('../assets/frames/f2.png'),
  frame3: require('../assets/frames/f3.png'),
  frame4: require('../assets/frames/f4.png'),
  frame5: require('../assets/frames/f5.png'),
  frame6: require('../assets/frames/f6.png'),
  frame7: require('../assets/frames/f7.png'),
  frame8: require('../assets/frames/f8.png'),
  frame9: require('../assets/frames/f9.png'),
  frame10: require('../assets/frames/f10.png'),
  frame11: require('../assets/frames/f11.png'),
  frame12: require('../assets/frames/f12.png'),
  frame13: require('../assets/frames/f13.png'),
  // Add more frame assets as needed
};

// Helper function to convert reference coordinates to canvas coordinates
export const convertReferenceToCanvas = (
  referenceX: number,
  referenceY: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  // Convert from reference (720x487.2) to actual canvas size
  const canvasX = referenceX * (canvasWidth / 720);
  const canvasY = referenceY * (canvasHeight / 487.2);
  
  // ✅ DEBUG: Log coordinate conversion details
  console.log('🔍 [COORDINATE CONVERSION] Debug:', {
    referenceX,
    referenceY,
    canvasWidth,
    canvasHeight,
    xScaleFactor: canvasWidth / 720,
    yScaleFactor: canvasHeight / 487.2,
    calculatedCanvasX: canvasX,
    calculatedCanvasY: canvasY,
    roundedCanvasX: Math.round(canvasX),
    roundedCanvasY: Math.round(canvasY)
  });
  
  return { x: canvasX, y: canvasY };
};

// Helper function to apply frame layout to layers
export const applyFrameLayoutToLayers = (
  layers: any[],
  frameId: string,
  canvasWidth: number,
  canvasHeight: number,
  originalLayers?: any[] // Optional parameter to access original layer colors
) => {
  const layout = FRAME_LAYOUTS[frameId];
  if (!layout) {
    return layers;
  }

  const updatedLayers = layers.map(layer => {
    // Find the layout configuration for this layer type
    const layoutConfig = layout.find((l: FrameLayoutElement) => l.key === layer.fieldType);
    
    // If no layout config for this layer type, return unchanged
    if (!layoutConfig) {
      return layer;
    }

    // Convert reference coordinates to canvas coordinates
    const canvasPosition = convertReferenceToCanvas(
      layoutConfig.x,
      layoutConfig.y,
      canvasWidth,
      canvasHeight
    );

    // Return updated layer with new position and properties
    const updatedLayer = {
      ...layer,
      position: {
        ...layer.position,
        x: canvasPosition.x,
        y: canvasPosition.y,
      },
      // Apply circular property if specified in layout config, otherwise reset to original
      ...(layoutConfig.circular !== undefined ? { isCircular: layoutConfig.circular } : { isCircular: originalLayers?.find((l: any) => l.id === layer.id)?.isCircular || false }),
      // Apply size property if specified in layout config, otherwise reset to original
      ...(layoutConfig.size !== undefined ? { size: layoutConfig.size } : { size: originalLayers?.find((l: any) => l.id === layer.id)?.size || layer.size }),
      // Apply color property if specified in layout config to the style object
      // If no color specified, preserve original style color (don't override with black)
      ...(layoutConfig.color && { 
        style: { 
          ...layer.style, 
          color: layoutConfig.color 
        } 
      }),
      // If no color specified, restore original style color (remove any frame-applied color)
      ...(!layoutConfig.color && originalLayers && layer.style?.color && layer.style.color !== originalLayers.find((l: any) => l.id === layer.id)?.style?.color && {
        style: { 
          ...layer.style, 
          color: originalLayers.find((l: any) => l.id === layer.id)?.style?.color || undefined
        } 
      }),
    };

    // ✅ DEBUG: Check if logo circular property is being applied/reset
    if (layer.fieldType === 'logo') {
      console.log(`🔍 [LOGO DEBUG] ${frameId} logo processing:`, {
        fieldType: layer.fieldType,
        layoutConfigCircular: layoutConfig.circular,
        layerIsCircular: layer.isCircular,
        originalIsCircular: originalLayers?.find((l: any) => l.id === layer.id)?.isCircular,
        updatedLayerIsCircular: updatedLayer.isCircular,
        finalCircularProperty: updatedLayer.isCircular
      });
    }
    
    // ✅ DEBUG: Check if phone/email X coordinates are being applied correctly for frame4
    if ((layer.fieldType === 'phone' || layer.fieldType === 'email') && frameId === 'frame4') {
      console.log(`🔍 [FRAME4 ${layer.fieldType.toUpperCase()} DEBUG]:`, {
        fieldType: layer.fieldType,
        layoutConfigX: layoutConfig.x,
        layoutConfigY: layoutConfig.y,
        canvasPositionX: canvasPosition.x,
        canvasPositionY: canvasPosition.y,
        expectedCanvasX: layer.fieldType === 'phone' ? 40.2 : 40.2,
        expectedCanvasY: layer.fieldType === 'phone' ? 304.3 : 317.8,
        xDifference: Math.abs(canvasPosition.x - (layer.fieldType === 'phone' ? 40.2 : 40.2)),
        yDifference: Math.abs(canvasPosition.y - (layer.fieldType === 'phone' ? 304.3 : 317.8))
      });
    }

    // ✅ DEBUG: Check if color property is being applied for frame10
    if (frameId === 'frame10' && layoutConfig.color) {
      console.log(`🎨 [FRAME10 COLOR DEBUG] Applying color to ${layer.fieldType}:`, {
        fieldType: layer.fieldType,
        layoutConfigColor: layoutConfig.color,
        originalStyleColor: layer.style?.color,
        newStyleColor: layoutConfig.color
      });
    }

    // ✅ DEBUG: Check if color is being reset when switching away from frame10
    if (frameId !== 'frame10' && !layoutConfig.color && originalLayers && layer.style?.color) {
      const originalColor = originalLayers.find((l: any) => l.id === layer.id)?.style?.color;
      if (originalColor && layer.style.color !== originalColor) {
        console.log(`🔄 [COLOR RESET DEBUG] Resetting color for ${layer.fieldType}:`, {
          fieldType: layer.fieldType,
          frameId,
          currentColor: layer.style.color,
          originalColor: originalColor
        });
      }
    }

    return updatedLayer;
  });

  return updatedLayers;
};
