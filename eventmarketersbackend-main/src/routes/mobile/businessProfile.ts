import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Extend Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/business-profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware to extract user ID from JWT token
const extractUserId = (req: Request, res: Response, next: any) => {
  try {
    console.log('🔐 extractUserId middleware - Processing request');
    console.log('📥 Authorization header:', req.headers.authorization);
    console.log('📥 X-User-ID header:', req.headers['x-user-id']);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header found');
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const token = authHeader.substring(7);
    console.log('🔑 Token extracted:', token.substring(0, 20) + '...');
    
    // Try to verify JWT token
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'business-marketing-platform-super-secret-jwt-key-2024');
      console.log('🔍 JWT decoded:', decoded);
      
      // Extract user ID from token - check for mobile user type
      let userId;
      if (decoded.userType === 'MOBILE_USER' && decoded.id) {
        userId = decoded.id;
        req.userId = userId;
        console.log('✅ Mobile user ID extracted from JWT:', userId);
      } else {
        // Fallback to header-based user ID
        userId = req.headers['x-user-id'] as string || 'demo-user-id';
        req.userId = userId;
        console.log('⚠️ Using fallback user ID:', userId);
      }
      
      console.log('✅ User ID set from JWT:', userId);
      next();
    } catch (jwtError) {
      console.log('⚠️ JWT verification failed, using fallback:', jwtError.message);
      
      // Fallback to header-based user ID
      const userId = req.headers['x-user-id'] as string || 'demo-user-id';
      req.userId = userId;
      
      console.log('✅ User ID set from header fallback:', userId);
      next();
    }
  } catch (error) {
    console.log('❌ Error in extractUserId middleware:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid authorization token'
    });
  }
};

/**
 * POST /api/mobile/business-profile
 * Create business profile
 */
router.post('/', extractUserId, async (req: Request, res: Response) => {
  try {
    const {
      businessName,
      ownerName,
      email,
      phone,
      address,
      category,
      logo,
      description,
      website,
      socialMedia
    } = req.body;

    const mobileUserId = req.userId;

    if (!businessName || !ownerName || !email || !phone || !category) {
      return res.status(400).json({
        success: false,
        error: 'Business name, owner name, email, phone, and category are required'
      });
    }

    // Check if user exists
    const user = await prisma.mobileUser.findUnique({
      where: { id: mobileUserId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Mobile user not found'
      });
    }

    // Allow users to create multiple business profiles
    // No restriction on existing profiles

    // Create business profile
    const businessProfile = await prisma.businessProfile.create({
      data: {
        mobileUserId,
        businessName,
        ownerName,
        email,
        phone,
        address,
        category,
        logo,
        description,
        website,
        socialMedia: socialMedia ? JSON.stringify(socialMedia) : null,
        isActive: true
      },
      include: {
        mobileUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Business profile created successfully',
      data: businessProfile
    });

  } catch (error) {
    console.error('Create business profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create business profile'
    });
  }
});

/**
 * GET /api/mobile/business-profile
 * Get all business profiles (with pagination and search)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause: any = { isActive: true };
    
    if (search) {
      whereClause.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category) {
      whereClause.category = { contains: category, mode: 'insensitive' };
    }

    const [businessProfiles, totalCount] = await Promise.all([
      prisma.businessProfile.findMany({
        where: whereClause,
        include: {
          mobileUser: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.businessProfile.count({
        where: whereClause
      })
    ]);

    // Parse social media for each profile
    const profilesWithParsedSocialMedia = businessProfiles.map(profile => {
      let socialMedia = null;
      if (profile.socialMedia) {
        try {
          socialMedia = JSON.parse(profile.socialMedia);
        } catch (e) {
          console.warn('Failed to parse social media JSON:', e);
        }
      }

      return {
        ...profile,
        socialMedia
      };
    });

    res.json({
      success: true,
      message: 'Business profiles fetched successfully',
      data: {
        profiles: profilesWithParsedSocialMedia,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all business profiles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business profiles'
    });
  }
});

/**
 * GET /api/mobile/business-profile/:userId
 * Get business profile by user ID
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const businessProfile = await prisma.businessProfile.findFirst({
      where: { 
        mobileUserId: userId,
        isActive: true 
      },
      include: {
        mobileUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Parse social media if it exists
    let socialMedia = null;
    if (businessProfile.socialMedia) {
      try {
        socialMedia = JSON.parse(businessProfile.socialMedia);
      } catch (e) {
        console.warn('Failed to parse social media JSON:', e);
      }
    }

    const profileData = {
      ...businessProfile,
      socialMedia
    };

    res.json({
      success: true,
      message: 'Business profile fetched successfully',
      data: profileData
    });

  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business profile'
    });
  }
});

/**
 * PUT /api/mobile/business-profile/:id
 * Update business profile
 */
router.put('/:id', extractUserId, async (req: Request, res: Response) => {
  try {
    console.log('🔍 PUT /api/mobile/business-profile/:id - Request received');
    console.log('📥 Request params:', req.params);
    console.log('📥 Request body:', req.body);
    console.log('📥 Request headers:', req.headers);
    
    const { id } = req.params;
    const mobileUserId = req.userId;
    
    console.log('👤 User ID from token:', mobileUserId);
    const {
      businessName,
      ownerName,
      email,
      phone,
      address,
      category,
      logo,
      description,
      website,
      socialMedia
    } = req.body;

    // Check if business profile exists and belongs to the user
    const existingProfile = await prisma.businessProfile.findFirst({
      where: { 
        id,
        mobileUserId 
      }
    });

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found or access denied'
      });
    }

    // Update business profile
    const updatedProfile = await prisma.businessProfile.update({
      where: { id },
      data: {
        businessName,
        ownerName,
        email,
        phone,
        address,
        category,
        logo,
        description,
        website,
        socialMedia: socialMedia ? JSON.stringify(socialMedia) : existingProfile.socialMedia
      },
      include: {
        mobileUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Parse social media if it exists
    let socialMediaParsed = null;
    if (updatedProfile.socialMedia) {
      try {
        socialMediaParsed = JSON.parse(updatedProfile.socialMedia);
      } catch (e) {
        console.warn('Failed to parse social media JSON:', e);
      }
    }

    const profileData = {
      ...updatedProfile,
      socialMedia: socialMediaParsed
    };

    res.json({
      success: true,
      message: 'Business profile updated successfully',
      data: profileData
    });

  } catch (error) {
    console.error('Update business profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update business profile'
    });
  }
});

/**
 * DELETE /api/mobile/business-profile/:id
 * Delete business profile
 */
router.delete('/:id', extractUserId, async (req: Request, res: Response) => {
  try {
    console.log('🔍 DELETE /api/mobile/business-profile/:id - Request received');
    console.log('📥 Request params:', req.params);
    console.log('📥 Request headers:', req.headers);
    
    const { id } = req.params;
    const mobileUserId = req.userId;
    
    console.log('👤 User ID from token:', mobileUserId);
    console.log('🆔 Profile ID to delete:', id);

    // Check if business profile exists and belongs to the user
    console.log('🔍 Searching for profile with ID:', id, 'and user ID:', mobileUserId);
    
    const existingProfile = await prisma.businessProfile.findFirst({
      where: { 
        id,
        mobileUserId 
      }
    });

    console.log('🔍 Profile search result:', existingProfile ? 'Found' : 'Not found');
    
    if (!existingProfile) {
      // Let's also check if the profile exists at all (regardless of ownership)
      const anyProfile = await prisma.businessProfile.findUnique({
        where: { id }
      });
      
      console.log('🔍 Profile exists in database:', anyProfile ? 'Yes' : 'No');
      if (anyProfile) {
        console.log('🔍 Profile owner:', anyProfile.mobileUserId);
        console.log('🔍 Requesting user:', mobileUserId);
        console.log('🔍 Ownership match:', anyProfile.mobileUserId === mobileUserId);
      }
      
      return res.status(404).json({
        success: false,
        error: 'Business profile not found or access denied'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.businessProfile.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Business profile deleted successfully'
    });

  } catch (error) {
    console.error('Delete business profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete business profile'
    });
  }
});

/**
 * POST /api/mobile/business-profile/:id/upload
 * Upload business profile image (logo)
 */
router.post('/:id/upload', extractUserId, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mobileUserId = req.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Check if business profile exists and belongs to the user
    const existingProfile = await prisma.businessProfile.findFirst({
      where: { 
        id,
        mobileUserId 
      }
    });

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found or access denied'
      });
    }

    // Update the profile with the new logo URL
    const logoUrl = `/uploads/business-profiles/${req.file.filename}`;
    
    const updatedProfile = await prisma.businessProfile.update({
      where: { id },
      data: { logo: logoUrl },
      include: {
        mobileUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: logoUrl,
        profile: updatedProfile
      }
    });

  } catch (error) {
    console.error('Upload business profile image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

export default router;
