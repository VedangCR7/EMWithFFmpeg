// Frame-specific element positioning configurations
// All coordinates are based on reference canvas size: 720x487.2

interface FrameLayoutElement {
  key: string;
  x: number;
  y: number;
}

interface FrameLayouts {
  [key: string]: FrameLayoutElement[];
}

export const FRAME_LAYOUTS: FrameLayouts = {
  frame1: [
    { key: 'companyName', x: 61, y: 27 }, // Updated to position companyName at (x: 30.6, y: 20.0) on canvas
    { key: 'phone', x: 100, y: 447 }, // Updated to position phone at (x: 50.1, y: 330.8) on canvas
    { key: 'email', x: 255, y: 447 }, // Updated to position email at (x: 127.8, y: 331.5) on canvas
    { key: 'website', x: 442, y: 447 }, // Updated to position website at (x: 221.8, y: 331.5) on canvas
    { key: 'address', x: 17, y: 460 },
    { key: 'category', x: 200, y: 462 },
  ],
  frame2: [
    { key: 'companyName', x: 50, y: 380 },
    { key: 'phone', x: 40, y: 420 },
    { key: 'email', x: 180, y: 430 },
    { key: 'website', x: 320, y: 425 },
    { key: 'address', x: 40, y: 445 },
    { key: 'category', x: 200, y: 445 },
  ],
  frame3: [
    { key: 'companyName', x: 50, y: 395 },
    { key: 'phone', x: 25, y: 435 },
    { key: 'email', x: 150, y: 435 },
    { key: 'website', x: 275, y: 435 },
    { key: 'address', x: 25, y: 455 },
    { key: 'category', x: 150, y: 455 },
  ],
  frame4: [
    { key: 'companyName', x: 50, y: 385 },
    { key: 'phone', x: 30, y: 425 },
    { key: 'email', x: 160, y: 425 },
    { key: 'website', x: 290, y: 425 },
    { key: 'address', x: 30, y: 445 },
    { key: 'category', x: 160, y: 445 },
  ],
  frame5: [
    { key: 'companyName', x: 50, y: 390 },
    { key: 'phone', x: 20, y: 430 },
    { key: 'email', x: 140, y: 430 },
    { key: 'website', x: 260, y: 430 },
    { key: 'address', x: 20, y: 450 },
    { key: 'category', x: 140, y: 450 },
  ],
  // Add more frame layouts as needed
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

    // Return updated layer with new position
    const updatedLayer = {
      ...layer,
      position: {
        ...layer.position,
        x: canvasPosition.x,
        y: canvasPosition.y,
      },
    };

    return updatedLayer;
  });

  return updatedLayers;
};
