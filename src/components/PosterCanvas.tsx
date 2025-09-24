import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';

interface PosterCanvasProps {
  selectedImage: {
    uri: string;
    title?: string;
    description?: string;
  };
  selectedFrame?: any;
  layers: any[];
  selectedTemplate: string;
  canvasWidth: number;
  canvasHeight: number;
  posterRef: React.RefObject<ViewShot | null>;
  getFrameBackgroundSource: (frame: any) => any;
  layerAnimations?: { [key: string]: { x: any; y: any } };
  translationValues?: { [key: string]: { x: any; y: any } };
  currentPositions?: { [key: string]: { x: number; y: number } };
}

const PosterCanvas: React.FC<PosterCanvasProps> = ({
  selectedImage,
  selectedFrame,
  layers,
  selectedTemplate,
  canvasWidth,
  canvasHeight,
  posterRef,
  getFrameBackgroundSource,
  layerAnimations,
  translationValues,
  currentPositions,
}) => {
  // Debug logging for ViewShot capture
  console.log('=== POSTER CANVAS CAPTURE DEBUG ===');
  console.log('Canvas rendering with:', {
    selectedImage: selectedImage?.uri?.substring(0, 50) + '...',
    selectedFrame: selectedFrame?.id,
    layersCount: layers?.length,
    selectedTemplate,
    canvasWidth,
    canvasHeight,
    posterRefAvailable: !!posterRef?.current,
  });
  
  // Log layer details for debugging
  console.log('Layers to render:', layers.length);
  layers.forEach((layer, index) => {
    console.log(`Layer ${index}:`, {
      id: layer.id,
      type: layer.type,
      fieldType: layer.fieldType,
      position: layer.position,
      size: layer.size,
      content: layer.content?.substring(0, 50) + '...',
      visible: layer.visible !== false,
    });
  });
  console.log('=== END POSTER CANVAS DEBUG ===');
  const renderLayer = (layer: any) => {
    if (layer.type === 'text') {
      // Special handling for footer background (same as visible canvas)
      if (layer.content === '' && layer.fieldType === 'footerBackground') {
        // Apply template-specific footer styling (same as visible canvas)
        const templateStyles = {
          'business': { backgroundColor: 'rgba(102, 126, 234, 0.9)' },
          'event': { backgroundColor: 'rgba(239, 68, 68, 0.9)' },
          'restaurant': { backgroundColor: 'rgba(34, 197, 94, 0.9)' },
          'fashion': { backgroundColor: 'rgba(236, 72, 153, 0.9)' },
          'real-estate': { backgroundColor: 'rgba(245, 158, 11, 0.9)' },
          'education': { backgroundColor: 'rgba(59, 130, 246, 0.9)' },
          'healthcare': { backgroundColor: 'rgba(6, 182, 212, 0.9)' },
          'fitness': { backgroundColor: 'rgba(168, 85, 247, 0.9)' },
          'wedding': { backgroundColor: 'rgba(212, 175, 55, 0.9)' },
          'birthday': { backgroundColor: 'rgba(251, 146, 60, 0.9)' },
          'corporate': { backgroundColor: 'rgba(30, 41, 59, 0.95)' },
          'creative': { backgroundColor: 'rgba(147, 51, 234, 0.9)' },
          'minimal': { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
          'luxury': { backgroundColor: 'rgba(212, 175, 55, 0.95)' },
          'modern': { backgroundColor: 'rgba(102, 126, 234, 0.8)' },
          'vintage': { backgroundColor: 'rgba(120, 113, 108, 0.9)' },
          'retro': { backgroundColor: 'rgba(251, 146, 60, 0.9)' },
          'elegant': { backgroundColor: 'rgba(139, 69, 19, 0.9)' },
          'bold': { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
          'tech': { backgroundColor: 'rgba(30, 41, 59, 0.95)' },
          'nature': { backgroundColor: 'rgba(34, 197, 94, 0.8)' },
          'ocean': { backgroundColor: 'rgba(6, 182, 212, 0.9)' },
          'sunset': { backgroundColor: 'rgba(239, 68, 68, 0.9)' },
          'cosmic': { backgroundColor: 'rgba(30, 41, 59, 0.95)' },
          'artistic': { backgroundColor: 'rgba(168, 85, 247, 0.9)' },
          'sport': { backgroundColor: 'rgba(239, 68, 68, 0.9)' },
          'warm': { backgroundColor: 'rgba(245, 158, 11, 0.9)' },
          'cool': { backgroundColor: 'rgba(59, 130, 246, 0.9)' },
        };
        
        const templateStyle = templateStyles[selectedTemplate as keyof typeof templateStyles] || templateStyles['business'];
        
        return (
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: layer.style?.backgroundColor || templateStyle.backgroundColor,
              borderRadius: 0,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
            }}
          />
        );
      }
      
      // Apply template-specific text colors for footer elements (same as visible canvas)
      let textColor = layer.style?.color || '#FFFFFF';
      if (['footerCompanyName', 'phone', 'email', 'website', 'category', 'address', 'services'].includes(layer.fieldType || '')) {
        const textColors = {
          'business': '#ffffff',
          'event': '#ffffff',
          'restaurant': '#ffffff',
          'fashion': '#ffffff',
          'real-estate': '#ffffff',
          'education': '#ffffff',
          'healthcare': '#ffffff',
          'fitness': '#ffffff',
          'wedding': '#000000',
          'birthday': '#ffffff',
          'corporate': '#ffffff',
          'creative': '#ffffff',
          'minimal': '#1f2937',
          'luxury': '#000000',
          'modern': '#ffffff',
          'vintage': '#ffffff',
          'retro': '#ffffff',
          'elegant': '#ffffff',
          'bold': '#ffffff',
          'tech': '#00ff00',
          'nature': '#ffffff',
          'ocean': '#ffffff',
          'sunset': '#ffffff',
          'cosmic': '#ffffff',
          'artistic': '#ffffff',
          'sport': '#ffffff',
          'warm': '#ffffff',
          'cool': '#ffffff',
        };
        textColor = textColors[selectedTemplate as keyof typeof textColors] || textColors['business'];
      }
      
      return (
        <Text
          style={[
            styles.layerText,
            {
              fontSize: layer.style?.fontSize || 16,
              color: textColor,
              fontFamily: layer.style?.fontFamily || 'System',
              fontWeight: layer.style?.fontWeight || 'normal',
              textAlign: layer.style?.textAlign || 'left',
              backgroundColor: layer.style?.backgroundColor,
            },
          ]}
        >
          {layer.content}
        </Text>
      );
    } else if (layer.type === 'image' || layer.type === 'logo') {
      return (
        <Image
          source={{ uri: layer.content }}
          style={styles.layerImage}
          resizeMode="contain"
        />
      );
    }
    return null;
  };

  // Only render ViewShot if we have layers to capture
  if (layers.length === 0) {
    console.log('PosterCanvas: No layers to render, skipping ViewShot');
    return (
      <View style={[
        styles.canvas,
        selectedTemplate !== 'business' && styles.canvasWithFrame,
        selectedTemplate === 'business' && styles.businessFrame,
        selectedTemplate === 'event' && styles.eventFrame,
        selectedTemplate === 'restaurant' && styles.restaurantFrame,
        selectedTemplate === 'fashion' && styles.fashionFrame,
        selectedTemplate === 'real-estate' && styles.realEstateFrame,
        selectedTemplate === 'education' && styles.educationFrame,
        selectedTemplate === 'healthcare' && styles.healthcareFrame,
        selectedTemplate === 'fitness' && styles.fitnessFrame,
        selectedTemplate === 'wedding' && styles.weddingFrame,
        selectedTemplate === 'birthday' && styles.birthdayFrame,
        selectedTemplate === 'corporate' && styles.corporateFrame,
        selectedTemplate === 'creative' && styles.creativeFrame,
        selectedTemplate === 'minimal' && styles.minimalFrame,
        selectedTemplate === 'luxury' && styles.luxuryFrame,
        selectedTemplate === 'modern' && styles.modernFrame,
        selectedTemplate === 'vintage' && styles.vintageFrame,
        selectedTemplate === 'retro' && styles.retroFrame,
        selectedTemplate === 'elegant' && styles.elegantFrame,
        selectedTemplate === 'bold' && styles.boldFrame,
        selectedTemplate === 'tech' && styles.techFrame,
        selectedTemplate === 'nature' && styles.natureFrame,
        selectedTemplate === 'ocean' && styles.oceanFrame,
        selectedTemplate === 'sunset' && styles.sunsetFrame,
        selectedTemplate === 'cosmic' && styles.cosmicFrame,
        selectedTemplate === 'artistic' && styles.artisticFrame,
        selectedTemplate === 'sport' && styles.sportFrame,
        selectedTemplate === 'warm' && styles.warmFrame,
        selectedTemplate === 'cool' && styles.coolFrame,
      ]}>
        {/* Background Image */}
        <View style={styles.backgroundImageContainer}>
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>
      </View>
    );
  }

    return (
    <ViewShot
      ref={posterRef}
      style={[
        styles.canvas,
        selectedTemplate !== 'business' && styles.canvasWithFrame,
        selectedTemplate === 'business' && styles.businessFrame,
        selectedTemplate === 'event' && styles.eventFrame,
        selectedTemplate === 'restaurant' && styles.restaurantFrame,
        selectedTemplate === 'fashion' && styles.fashionFrame,
        selectedTemplate === 'real-estate' && styles.realEstateFrame,
        selectedTemplate === 'education' && styles.educationFrame,
        selectedTemplate === 'healthcare' && styles.healthcareFrame,
        selectedTemplate === 'fitness' && styles.fitnessFrame,
        selectedTemplate === 'wedding' && styles.weddingFrame,
        selectedTemplate === 'birthday' && styles.birthdayFrame,
        selectedTemplate === 'corporate' && styles.corporateFrame,
        selectedTemplate === 'creative' && styles.creativeFrame,
        selectedTemplate === 'minimal' && styles.minimalFrame,
        selectedTemplate === 'luxury' && styles.luxuryFrame,
        selectedTemplate === 'modern' && styles.modernFrame,
        selectedTemplate === 'vintage' && styles.vintageFrame,
        selectedTemplate === 'retro' && styles.retroFrame,
        selectedTemplate === 'elegant' && styles.elegantFrame,
        selectedTemplate === 'bold' && styles.boldFrame,
        selectedTemplate === 'tech' && styles.techFrame,
        selectedTemplate === 'nature' && styles.natureFrame,
        selectedTemplate === 'ocean' && styles.oceanFrame,
        selectedTemplate === 'sunset' && styles.sunsetFrame,
        selectedTemplate === 'cosmic' && styles.cosmicFrame,
        selectedTemplate === 'artistic' && styles.artisticFrame,
        selectedTemplate === 'sport' && styles.sportFrame,
        selectedTemplate === 'warm' && styles.warmFrame,
        selectedTemplate === 'cool' && styles.coolFrame,
        { width: canvasWidth, height: canvasHeight }
      ]}
      options={{
        format: 'png',
        quality: 1.0,
        result: 'tmpfile'
      }}
    >
      {/* Background Image */}
      <View style={styles.backgroundImageContainer}>
        <Image
          source={{ uri: selectedImage.uri }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>
      
      {/* Frame Overlay */}
      {selectedFrame && (
        <View style={styles.frameOverlayContainer}>
          <Image
            source={getFrameBackgroundSource(selectedFrame)}
            style={styles.frameOverlayImage}
            resizeMode="cover"
          />
        </View>
      )}
      
             {/* Layers */}
               {layers.map(layer => {
          // Use captured current positions if available, otherwise fall back to calculated positions
          let currentX = layer.position.x;
          let currentY = layer.position.y;
          
          if (currentPositions?.[layer.id]) {
            // Use the captured current positions
            currentX = currentPositions[layer.id].x;
            currentY = currentPositions[layer.id].y;
          } else if (layerAnimations?.[layer.id]?.x && translationValues?.[layer.id]?.x) {
            // Fallback to calculated positions
            const baseX = layerAnimations[layer.id].x._value || 0;
            const translationX = translationValues[layer.id].x._value || 0;
            currentX = baseX + translationX;
            
            const baseY = layerAnimations[layer.id].y._value || 0;
            const translationY = translationValues[layer.id].y._value || 0;
            currentY = baseY + translationY;
          }
          
          console.log(`Rendering layer in PosterCanvas: ${layer.id} (${layer.type}) - static position: ${layer.position.x},${layer.position.y} - final position: ${currentX},${currentY} - visible: ${layer.visible !== false}`);
          
          return (
            <View
              key={layer.id}
              style={[
                styles.layer,
                {
                  position: 'absolute',
                  width: layer.size.width,
                  height: layer.size.height,
                  zIndex: layer.zIndex,
                  transform: [
                    { translateX: currentX },
                    { translateY: currentY },
                    { rotate: `${layer.rotation || 0}deg` }
                  ],
                }
              ]}
            >
              {renderLayer(layer)}
            </View>
          );
        })}
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  frameOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  frameOverlayImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  layer: {
    position: 'absolute',
  },
  layerText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  layerImage: {
    width: '100%',
    height: '100%',
  },
  // Template Styles
  canvasWithFrame: {
    borderWidth: 8,
    borderColor: '#667eea',
    borderStyle: 'solid',
  },
  businessFrame: {
    borderWidth: 8,
    borderColor: '#667eea',
    borderStyle: 'solid',
  },
  eventFrame: {
    borderWidth: 6,
    borderColor: '#f97316',
    borderStyle: 'solid',
  },
  restaurantFrame: {
    borderWidth: 8,
    borderColor: '#22c55e',
    borderStyle: 'solid',
  },
  fashionFrame: {
    borderWidth: 10,
    borderColor: '#ec4899',
    borderStyle: 'solid',
  },
  realEstateFrame: {
    borderWidth: 6,
    borderColor: '#8b5cf6',
    borderStyle: 'solid',
  },
  educationFrame: {
    borderWidth: 8,
    borderColor: '#3b82f6',
    borderStyle: 'solid',
  },
  healthcareFrame: {
    borderWidth: 6,
    borderColor: '#10b981',
    borderStyle: 'solid',
  },
  fitnessFrame: {
    borderWidth: 8,
    borderColor: '#ef4444',
    borderStyle: 'solid',
  },
  weddingFrame: {
    borderWidth: 12,
    borderColor: '#fbbf24',
    borderStyle: 'solid',
  },
  birthdayFrame: {
    borderWidth: 10,
    borderColor: '#f472b6',
    borderStyle: 'solid',
  },
  corporateFrame: {
    borderWidth: 6,
    borderColor: '#374151',
    borderStyle: 'solid',
  },
  creativeFrame: {
    borderWidth: 8,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  minimalFrame: {
    borderWidth: 4,
    borderColor: '#95a5a6',
    borderStyle: 'solid',
  },
  luxuryFrame: {
    borderWidth: 12,
    borderColor: '#d4af37',
    borderStyle: 'solid',
  },
  modernFrame: {
    borderWidth: 8,
    borderColor: '#607d8b',
    borderStyle: 'solid',
  },
  vintageFrame: {
    borderWidth: 8,
    borderColor: '#78716c',
    borderStyle: 'solid',
  },
  retroFrame: {
    borderWidth: 6,
    borderColor: '#fb923c',
    borderStyle: 'solid',
  },
  elegantFrame: {
    borderWidth: 8,
    borderColor: '#795548',
    borderStyle: 'solid',
  },
  boldFrame: {
    borderWidth: 10,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  techFrame: {
    borderWidth: 8,
    borderColor: '#00ff00',
    borderStyle: 'solid',
  },
  natureFrame: {
    borderWidth: 6,
    borderColor: '#22c55e',
    borderStyle: 'solid',
  },
  oceanFrame: {
    borderWidth: 8,
    borderColor: '#06b6d4',
    borderStyle: 'solid',
  },
  sunsetFrame: {
    borderWidth: 10,
    borderColor: '#f59e0b',
    borderStyle: 'solid',
  },
  cosmicFrame: {
    borderWidth: 8,
    borderColor: '#1e293b',
    borderStyle: 'solid',
  },
  artisticFrame: {
    borderWidth: 8,
    borderColor: '#a855f7',
    borderStyle: 'solid',
  },
  sportFrame: {
    borderWidth: 6,
    borderColor: '#ef4444',
    borderStyle: 'solid',
  },
  warmFrame: {
    borderWidth: 8,
    borderColor: '#fb923c',
    borderStyle: 'solid',
  },
  coolFrame: {
    borderWidth: 8,
    borderColor: '#3b82f6',
    borderStyle: 'solid',
  },
});

export default PosterCanvas;
