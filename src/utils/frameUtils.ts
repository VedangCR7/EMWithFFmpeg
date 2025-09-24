import { Frame, FramePlaceholder } from '../data/frames';
import { BusinessProfile } from '../services/businessProfile';

export interface FrameContent {
  [key: string]: string;
}

export const mapBusinessProfileToFrameContent = (profile: BusinessProfile): FrameContent => {
  return {
    companyName: profile.name || '',
    tagline: profile.description || '',
    logo: profile.companyLogo || profile.logo || '',
    contact: [
      profile.name ? `${profile.name}` : '',
      profile.phone ? `📞 ${profile.phone}` : '',
      profile.email ? `📧 ${profile.email}` : '',
      profile.website ? `🌐 ${profile.website}` : '',
      profile.address ? `📍 ${profile.address}` : '',
    ].filter(Boolean).join('\n'),
    brandName: profile.name || '',
    slogan: profile.description || '',
    name: profile.name || '',
    title: profile.category || '',
    profileImage: profile.companyLogo || profile.logo || '',
    eventTitle: profile.name || '',
    eventDate: new Date().toLocaleDateString(),
    organizer: profile.name || '',
    // Add more specific mappings for better content placement
    companyLogo: profile.companyLogo || profile.logo || '',
    companyDescription: profile.description || '',
    companyPhone: profile.phone || '',
    companyEmail: profile.email || '',
    companyWebsite: profile.website || '',
    companyAddress: profile.address || '',
  };
};

export const generateLayersFromFrame = (
  frame: Frame,
  content: FrameContent,
  canvasWidth: number,
  canvasHeight: number
) => {
  const layers: any[] = [];
  let zIndex = 1;

  frame.placeholders.forEach((placeholder) => {
    const contentValue = content[placeholder.key];
    
    if (!contentValue) return;

    if (placeholder.type === 'text') {
      layers.push({
        id: `frame-${placeholder.key}`,
        type: 'text',
        content: contentValue,
        position: {
          x: placeholder.x,
          y: placeholder.y,
        },
        size: {
          width: placeholder.maxWidth || 300,
          height: 50,
        },
        rotation: 0,
        zIndex: zIndex++,
        fieldType: placeholder.key,
        style: {
          fontSize: placeholder.fontSize || 16,
          color: placeholder.color || '#FFFFFF',
          fontFamily: placeholder.fontFamily || 'System',
          fontWeight: placeholder.fontWeight || 'normal',
          textAlign: placeholder.textAlign || 'left',
        },
      });
    } else if (placeholder.type === 'image') {
      layers.push({
        id: `frame-${placeholder.key}`,
        type: 'image',
        content: contentValue,
        position: {
          x: placeholder.x,
          y: placeholder.y,
        },
        size: {
          width: placeholder.width || 80,
          height: placeholder.height || 80,
        },
        rotation: 0,
        zIndex: zIndex++,
        fieldType: placeholder.key,
      });
    }
  });

  return layers;
};

export const getFrameBackgroundStyle = (frame: Frame) => {
  return {
    width: '100%',
    height: '100%',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };
};

export const getFrameBackgroundSource = (frame: Frame) => {
  return frame.background;
};
