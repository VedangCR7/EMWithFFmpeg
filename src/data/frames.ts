// Frame-specific element positioning configurations
// All coordinates are based on reference canvas size: 720x487.2

interface FrameLayoutElement {
  key: string;
  x: number;
  y: number;
  circular?: boolean; // Optional property to make logo circular
  size?: { width: number; height: number }; // Optional property to control element size
}

interface FrameLayouts {
  [key: string]: FrameLayoutElement[];
}

interface FrameAssets {
  [key: string]: string;
}

export const FRAME_LAYOUTS: FrameLayouts = {
  frame1: [
    { key: 'companyName', x: 61, y: 27 }, // Updated to position companyName at (x: 30.6, y: 20.0) on canvas
    { key: 'phone', x: 100, y: 447 }, // Updated to position phone at (x: 50.1, y: 330.8) on canvas
    { key: 'email', x: 255, y: 447 }, // Updated to position email at (x: 127.8, y: 331.5) on canvas
    { key: 'website', x: 442, y: 447 }, // Updated to position website at (x: 221.8, y: 331.5) on canvas
    { key: 'address', x: 17, y: 460 },
    { key: 'category', x: 200, y: 462 },
    { key: 'logo', x: 580, y: 25 }, // Logo positioned in top-right corner
  ],
  frame2: [
    { key: 'companyName', x: 61, y: 27 },
    { key: 'phone', x: 100, y: 447 },
    { key: 'email', x: 290, y: 447 },
    { key: 'website', x: 490, y: 447 },
    { key: 'address', x: 40, y: 445 },
    { key: 'category', x: 200, y: 445 },
    { key: 'logo', x: 600, y: 15 }, // Logo positioned slightly more to the right
  ],
  frame3: [
    { key: 'companyName', x: 61, y: 27 },
    { key: 'phone', x: 50, y: 445 },
    { key: 'email', x: 250, y: 445 },
    { key: 'website', x: 450, y: 445 },
    { key: 'address', x: 25, y: 455 },
    { key: 'category', x: 150, y: 455 },
    { key: 'logo', x: 550, y: 30 }, // Logo positioned with different alignment
  ],
  frame4: [
    { key: 'companyName', x: 61, y: 27 },
    { key: 'phone', x: 30, y: 425 },
    { key: 'email', x: 160, y: 425 },
    { key: 'website', x: 290, y: 425 },
    { key: 'address', x: 30, y: 445 },
    { key: 'category', x: 160, y: 445 },
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
    { key: 'companyName', x: 50, y: 30 },
    { key: 'phone', x: 30, y: 430 },
    { key: 'email', x: 180, y: 430 },
    { key: 'website', x: 330, y: 430 },
    { key: 'address', x: 30, y: 450 },
    { key: 'category', x: 180, y: 450 },
    { key: 'logo', x: 600, y: 20 },
  ],
  frame7: [
    { key: 'companyName', x: 60, y: 25 },
    { key: 'phone', x: 40, y: 420 },
    { key: 'email', x: 200, y: 420 },
    { key: 'website', x: 360, y: 420 },
    { key: 'address', x: 40, y: 440 },
    { key: 'category', x: 200, y: 440 },
    { key: 'logo', x: 580, y: 25 },
  ],
  frame8: [
    { key: 'companyName', x: 55, y: 35 },
    { key: 'phone', x: 35, y: 425 },
    { key: 'email', x: 190, y: 425 },
    { key: 'website', x: 345, y: 425 },
    { key: 'address', x: 35, y: 445 },
    { key: 'category', x: 190, y: 445 },
    { key: 'logo', x: 590, y: 30 },
  ],
  frame9: [
    { key: 'companyName', x: 45, y: 40 },
    { key: 'phone', x: 25, y: 435 },
    { key: 'email', x: 175, y: 435 },
    { key: 'website', x: 325, y: 435 },
    { key: 'address', x: 25, y: 455 },
    { key: 'category', x: 175, y: 455 },
    { key: 'logo', x: 570, y: 35 },
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
  
  return { x: canvasX, y: canvasY };
};

// Helper function to apply frame layout to layers
export const applyFrameLayoutToLayers = (
  layers: any[],
  frameId: string,
  canvasWidth: number,
  canvasHeight: number
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
      // Apply circular property if specified in layout config
      ...(layoutConfig.circular && { isCircular: layoutConfig.circular }),
      // Apply size property if specified in layout config
      ...(layoutConfig.size && { size: layoutConfig.size }),
    };

    // ✅ DEBUG: Check if logo circular property is being applied
    if (layer.fieldType === 'logo' && frameId === 'frame5') {
      console.log('🔍 [LOGO DEBUG] Frame5 logo processing:', {
        fieldType: layer.fieldType,
        layoutConfigCircular: layoutConfig.circular,
        layerIsCircular: layer.isCircular,
        updatedLayerIsCircular: updatedLayer.isCircular,
        finalCircularProperty: layoutConfig.circular ? layoutConfig.circular : layer.isCircular
      });
    }

    return updatedLayer;
  });

  return updatedLayers;
};
