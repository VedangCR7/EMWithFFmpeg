export interface FramePlaceholder {
  type: 'text' | 'image';
  key: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  maxWidth?: number;
  maxHeight?: number;
}

export interface Frame {
  id: string;
  name: string;
  background: any; // Image source
  placeholders: FramePlaceholder[];
  category: 'business' | 'event' | 'personal' | 'creative';
  description: string;
}

export const frames: Frame[] = [
  {
    id: 'frame1',
    name: 'Frame 1',
    background: require('../assets/frames/frame1.png'),
    placeholders: [
      {
        type: 'text',
        key: 'companyName',
        x: 50,
        y: 50,
        fontSize: 28,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'bold',
        textAlign: 'left',
        maxWidth: 300
      },
      {
        type: 'text',
        key: 'tagline',
        x: 50,
        y: 90,
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'normal',
        textAlign: 'left',
        maxWidth: 300
      },
      {
        type: 'image',
        key: 'logo',
        x: 320,
        y: 50,
        width: 80,
        height: 80
      },
      {
        type: 'text',
        key: 'contact',
        x: 50,
        y: 500,
        fontSize: 14,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'normal',
        textAlign: 'left',
        maxWidth: 350
      }
    ],
    category: 'business',
    description: 'Professional business template with clean layout'
  },
  {
    id: 'frame2',
    name: 'Frame 2',
    background: require('../assets/frames/frame2.jpg'),
    placeholders: [
      {
        type: 'text',
        key: 'eventTitle',
        x: 100,
        y: 150,
        fontSize: 28,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'bold',
        textAlign: 'center',
        maxWidth: 400
      },
      {
        type: 'text',
        key: 'eventDate',
        x: 100,
        y: 200,
        fontSize: 18,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'normal',
        textAlign: 'center',
        maxWidth: 400
      },
      {
        type: 'image',
        key: 'logo',
        x: 150,
        y: 250,
        width: 100,
        height: 100
      },
      {
        type: 'text',
        key: 'organizer',
        x: 100,
        y: 380,
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'normal',
        textAlign: 'center',
        maxWidth: 400
      }
    ],
    category: 'event',
    description: 'Modern event template with centered layout'
  },
  {
    id: 'frame3',
    name: 'Frame 3',
    background: require('../assets/frames/Frame3.png'),
    placeholders: [
      {
        type: 'text',
        key: 'name',
        x: 80,
        y: 120,
        fontSize: 32,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'bold',
        textAlign: 'left',
        maxWidth: 350
      },
      {
        type: 'text',
        key: 'title',
        x: 80,
        y: 170,
        fontSize: 18,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'normal',
        textAlign: 'left',
        maxWidth: 350
      },
      {
        type: 'image',
        key: 'profileImage',
        x: 80,
        y: 220,
        width: 120,
        height: 120
      },
      {
        type: 'text',
        key: 'contact',
        x: 80,
        y: 370,
        fontSize: 14,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'normal',
        textAlign: 'left',
        maxWidth: 350
      }
    ],
    category: 'personal',
    description: 'Elegant personal template with sophisticated layout'
  },
  {
    id: 'frame4',
    name: 'Frame 4',
    background: require('../assets/frames/frame4.png'),
    placeholders: [
      {
        type: 'text',
        key: 'brandName',
        x: 60,
        y: 80,
        fontSize: 26,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'bold',
        textAlign: 'left',
        maxWidth: 320
      },
      {
        type: 'image',
        key: 'logo',
        x: 60,
        y: 130,
        width: 90,
        height: 90
      },
      {
        type: 'text',
        key: 'slogan',
        x: 60,
        y: 240,
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'normal',
        textAlign: 'left',
        maxWidth: 320
      },
      {
        type: 'text',
        key: 'contact',
        x: 60,
        y: 280,
        fontSize: 14,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'normal',
        textAlign: 'left',
        maxWidth: 320
      }
    ],
    category: 'creative',
    description: 'Bold creative template with dynamic positioning'
  },
  {
    id: 'f3',
    name: 'Frame F3',
    background: require('../assets/frames/f3.png'),
    placeholders: [
      {
        type: 'text',
        key: 'companyName',
        x: 60,
        y: 120,
        fontSize: 28,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'bold',
        textAlign: 'center',
        maxWidth: 320
      },
      {
        type: 'image',
        key: 'logo',
        x: 150,
        y: 180,
        width: 100,
        height: 100
      },
      {
        type: 'text',
        key: 'tagline',
        x: 60,
        y: 300,
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'normal',
        textAlign: 'center',
        maxWidth: 320
      },
      {
        type: 'text',
        key: 'contact',
        x: 60,
        y: 350,
        fontSize: 14,
        color: '#FFFFFF',
        fontFamily: 'System',
        fontWeight: 'normal',
        textAlign: 'center',
        maxWidth: 320
      }
    ],
    category: 'business',
    description: 'Modern business frame with centered layout'
  }
];

export const getFramesByCategory = (category: string): Frame[] => {
  return frames.filter(frame => frame.category === category);
};

export const getFrameById = (id: string): Frame | undefined => {
  return frames.find(frame => frame.id === id);
};
