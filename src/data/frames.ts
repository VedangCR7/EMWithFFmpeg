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
  console.log('🔍 [FRAME LAYOUT DEBUG] Starting frame layout application:', {
    frameId,
    totalLayers: layers.length,
    canvasSize: { width: canvasWidth, height: canvasHeight }
  });

  const layout = FRAME_LAYOUTS[frameId];
  if (!layout) {
    console.log('❌ [FRAME LAYOUT DEBUG] No layout found for frame:', frameId);
    return layers;
  }

  console.log('✅ [FRAME LAYOUT DEBUG] Found layout for frame:', {
    frameId,
    layoutElements: layout.length,
    layoutConfig: layout
  });

  const updatedLayers = layers.map(layer => {
    console.log('🔍 [FRAME LAYOUT DEBUG] Processing layer:', {
      layerId: layer.id,
      fieldType: layer.fieldType,
      currentPosition: layer.position,
      content: layer.content?.substring(0, 20) + '...'
    });

    // Find the layout configuration for this layer type
    const layoutConfig = layout.find((l: FrameLayoutElement) => l.key === layer.fieldType);
    
    // If no layout config for this layer type, return unchanged
    if (!layoutConfig) {
      console.log('⚠️ [FRAME LAYOUT DEBUG] No layout config for layer type:', layer.fieldType);
      return layer;
    }

    console.log('✅ [FRAME LAYOUT DEBUG] Found layout config for layer:', {
      fieldType: layer.fieldType,
      referencePosition: { x: layoutConfig.x, y: layoutConfig.y }
    });

    // Convert reference coordinates to canvas coordinates
    const canvasPosition = convertReferenceToCanvas(
      layoutConfig.x,
      layoutConfig.y,
      canvasWidth,
      canvasHeight
    );

    console.log('📍 [FRAME LAYOUT DEBUG] Converted to canvas coordinates:', {
      fieldType: layer.fieldType,
      from: { x: layoutConfig.x, y: layoutConfig.y },
      to: { x: canvasPosition.x, y: canvasPosition.y },
      canvasSize: { width: canvasWidth, height: canvasHeight },
      calculation: {
        scaleX: canvasWidth / 720,
        scaleY: canvasHeight / 487.2,
        calcX: `${layoutConfig.x} × (${canvasWidth} / 720) = ${canvasPosition.x}`,
        calcY: `${layoutConfig.y} × (${canvasHeight} / 487.2) = ${canvasPosition.y}`
      }
    });

    // ✅ SPECIAL DEBUGGING FOR EMAIL ELEMENT
    if (layer.fieldType === 'email' && frameId === 'frame1') {
      console.log('🎯🎯🎯 [EMAIL FRAME1 DEBUG] Email positioning details:');
      console.log(`📐 [EMAIL] Reference coordinates: x: ${layoutConfig.x}, y: ${layoutConfig.y}`);
      console.log(`📏 [EMAIL] Canvas size: ${canvasWidth} x ${canvasHeight}`);
      console.log(`🔄 [EMAIL] Scale factors: X=${(canvasWidth / 720).toFixed(4)}, Y=${(canvasHeight / 487.2).toFixed(4)}`);
      console.log(`📍 [EMAIL] Final canvas position: x: ${canvasPosition.x.toFixed(2)}, y: ${canvasPosition.y.toFixed(2)}`);
      console.log(`🎯 [EMAIL] Rounded position: x: ${Math.round(canvasPosition.x)}, y: ${Math.round(canvasPosition.y)}`);
      console.log('🎯🎯🎯 [EMAIL FRAME1 DEBUG] End of email positioning details');
    }

    // Return updated layer with new position
    const updatedLayer = {
      ...layer,
      position: {
        ...layer.position,
        x: canvasPosition.x,
        y: canvasPosition.y,
      },
    };

    console.log('🔄 [FRAME LAYOUT DEBUG] Updated layer position:', {
      layerId: layer.id,
      fieldType: layer.fieldType,
      oldPosition: layer.position,
      newPosition: updatedLayer.position,
      positionChanged: layer.position.x !== canvasPosition.x || layer.position.y !== canvasPosition.y,
      finalPosition: {
        x: updatedLayer.position.x,
        y: updatedLayer.position.y,
        roundedX: Math.round(updatedLayer.position.x),
        roundedY: Math.round(updatedLayer.position.y)
      }
    });

    // ✅ SPECIAL LOG FOR EMAIL ELEMENT UPDATE
    if (layer.fieldType === 'email' && frameId === 'frame1') {
      console.log('🎯🎯🎯 [EMAIL UPDATE] Email layer position set in state:');
      console.log(`📍 [EMAIL SET] Position being stored: x: ${updatedLayer.position.x.toFixed(2)}, y: ${updatedLayer.position.y.toFixed(2)}`);
      console.log(`🎯 [EMAIL SET] Rounded stored position: x: ${Math.round(updatedLayer.position.x)}, y: ${Math.round(updatedLayer.position.y)}`);
      console.log('🎯🎯🎯 [EMAIL UPDATE] End of email layer position update');
    }

    return updatedLayer;
  });

  console.log('🎯 [FRAME LAYOUT DEBUG] Frame layout application complete:', {
    frameId,
    totalLayersProcessed: layers.length,
    layersUpdated: updatedLayers.filter((layer, index) => 
      layers[index].position.x !== layer.position.x || layers[index].position.y !== layer.position.y
    ).length,
    finalLayers: updatedLayers.map(l => ({
      id: l.id,
      fieldType: l.fieldType,
      position: l.position
    }))
  });

  // ✅ SPECIAL LOG FOR FRAME1 - SHOW ELEMENT POSITIONS
  if (frameId === 'frame1') {
    console.log('🎯🎯🎯 [FRAME1 APPLIED] Frame1 layout applied! Element positions:');
    updatedLayers.forEach(layer => {
      console.log(`📍 [FRAME1] ${layer.fieldType}: x: ${Math.round(layer.position.x)}, y: ${Math.round(layer.position.y)} | Content: ${layer.content?.substring(0, 20)}...`);
    });
    console.log('🎯🎯🎯 [FRAME1 APPLIED] End of Frame1 element positions');
  }

  return updatedLayers;
};
