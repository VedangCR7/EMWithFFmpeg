import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();
const router = Router();

export interface BusinessCategoryPoster {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  imageUrl: string;
  downloadUrl: string;
  likes: number;
  downloads: number;
  isPremium: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/mobile/posters/category/:category
 * Get posters for a specific business category
 */
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    console.log('🎯 Fetching posters for business category:', category);

    // For now, return mock data based on category
    // In a real implementation, this would query a posters table
    const mockPosters = getMockPostersByCategory(category);

    res.json({
      success: true,
      message: `Posters for ${category} category fetched successfully`,
      data: {
        posters: mockPosters,
        category,
        total: mockPosters.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching posters by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posters'
    });
  }
});

/**
 * GET /api/mobile/posters/user/:userId
 * Get posters for user's business category
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    console.log('🎯 Fetching posters for user:', userId);

    // Get user's business profiles to determine category
    const userProfiles = await prisma.businessProfile.findMany({
      where: { 
        mobileUserId: userId,
        isActive: true 
      },
      select: {
        category: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    let category = 'General'; // Default category
    
    if (userProfiles.length > 0) {
      category = userProfiles[0].category;
      console.log('✅ User business category found:', category);
    } else {
      console.log('⚠️ No business profiles found for user, using default category');
    }

    // Get posters for the user's category
    const posters = getMockPostersByCategory(category);

    res.json({
      success: true,
      message: `Posters for user's ${category} category fetched successfully`,
      data: {
        posters,
        category,
        total: posters.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user category posters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user category posters'
    });
  }
});

/**
 * POST /api/mobile/posters/like
 * Like a poster
 */
router.post('/like', [
  body('posterId').notEmpty().withMessage('Poster ID is required'),
  body('userId').notEmpty().withMessage('User ID is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { posterId, userId } = req.body;

    console.log('👍 Like poster request:', { posterId, userId });

    // Check if user exists
    const user = await prisma.mobileUser.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if like already exists
    const existingLike = await prisma.mobileLike.findFirst({
      where: {
        mobileUserId: userId,
        resourceType: 'POSTER',
        resourceId: posterId
      }
    });

    if (existingLike) {
      return res.json({
        success: true,
        message: 'Poster already liked',
        data: { isLiked: true }
      });
    }

    // Create new like
    const like = await prisma.mobileLike.create({
      data: {
        mobileUserId: userId,
        resourceType: 'POSTER',
        resourceId: posterId
      }
    });

    console.log('✅ Poster liked successfully:', like.id);

    res.json({
      success: true,
      message: 'Poster liked successfully',
      data: { isLiked: true }
    });

  } catch (error) {
    console.error('❌ Error liking poster:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like poster'
    });
  }
});

/**
 * DELETE /api/mobile/posters/like
 * Unlike a poster
 */
router.delete('/like', [
  body('posterId').notEmpty().withMessage('Poster ID is required'),
  body('userId').notEmpty().withMessage('User ID is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { posterId, userId } = req.body;

    console.log('👎 Unlike poster request:', { posterId, userId });

    // Find and delete the like
    const deletedLike = await prisma.mobileLike.deleteMany({
      where: {
        mobileUserId: userId,
        resourceType: 'POSTER',
        resourceId: posterId
      }
    });

    if (deletedLike.count === 0) {
      return res.status(404).json({
        success: false,
        error: 'Like not found'
      });
    }

    console.log('✅ Poster unliked successfully');

    res.json({
      success: true,
      message: 'Poster unliked successfully',
      data: { isLiked: false }
    });

  } catch (error) {
    console.error('❌ Error unliking poster:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlike poster'
    });
  }
});

/**
 * GET /api/mobile/posters/likes/:userId
 * Get user's liked posters
 */
router.get('/likes/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    console.log('❤️ Fetching liked posters for user:', userId);

    // Get user's liked posters
    const likedPosters = await prisma.mobileLike.findMany({
      where: {
        mobileUserId: userId,
        resourceType: 'POSTER'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get poster details for each liked poster
    const postersWithDetails = likedPosters.map(like => {
      // In a real implementation, this would fetch from a posters table
      // For now, return mock poster data
      return {
        id: like.resourceId,
        title: `Liked Poster ${like.resourceId}`,
        description: 'User liked poster',
        category: 'General',
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1200&fit=crop',
        downloadUrl: `https://example.com/posters/${like.resourceId}.jpg`,
        likes: Math.floor(Math.random() * 200) + 50,
        downloads: Math.floor(Math.random() * 100) + 20,
        isPremium: Math.random() > 0.7,
        tags: ['liked', 'poster'],
        createdAt: like.createdAt.toISOString(),
        updatedAt: like.createdAt.toISOString(),
        likedAt: like.createdAt.toISOString()
      };
    });

    res.json({
      success: true,
      message: 'Liked posters fetched successfully',
      data: {
        posters: postersWithDetails,
        total: postersWithDetails.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching liked posters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch liked posters'
    });
  }
});

/**
 * Get mock posters for different business categories
 */
function getMockPostersByCategory(category: string): BusinessCategoryPoster[] {
  const basePosters: BusinessCategoryPoster[] = [
    {
      id: '1',
      title: `${category} Business Poster 1`,
      description: `Professional ${category.toLowerCase()} business poster design`,
      category,
      thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1200&fit=crop',
      downloadUrl: 'https://example.com/posters/1.jpg',
      likes: Math.floor(Math.random() * 200) + 50,
      downloads: Math.floor(Math.random() * 100) + 20,
      isPremium: Math.random() > 0.7,
      tags: [category.toLowerCase(), 'business', 'professional'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      title: `${category} Marketing Poster 2`,
      description: `Creative ${category.toLowerCase()} marketing poster template`,
      category,
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=400&fit=crop',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=1200&fit=crop',
      downloadUrl: 'https://example.com/posters/2.jpg',
      likes: Math.floor(Math.random() * 150) + 30,
      downloads: Math.floor(Math.random() * 80) + 15,
      isPremium: Math.random() > 0.8,
      tags: [category.toLowerCase(), 'marketing', 'creative'],
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-18T16:45:00Z'
    },
    {
      id: '3',
      title: `${category} Event Poster 3`,
      description: `Elegant ${category.toLowerCase()} event poster design`,
      category,
      thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300&h=400&fit=crop',
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=1200&fit=crop',
      downloadUrl: 'https://example.com/posters/3.jpg',
      likes: Math.floor(Math.random() * 180) + 40,
      downloads: Math.floor(Math.random() * 90) + 25,
      isPremium: Math.random() > 0.6,
      tags: [category.toLowerCase(), 'event', 'elegant'],
      createdAt: '2024-01-05T14:30:00Z',
      updatedAt: '2024-01-22T11:20:00Z'
    },
    {
      id: '4',
      title: `${category} Promotional Poster 4`,
      description: `Modern ${category.toLowerCase()} promotional poster template`,
      category,
      thumbnail: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=300&h=400&fit=crop',
      imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=1200&fit=crop',
      downloadUrl: 'https://example.com/posters/4.jpg',
      likes: Math.floor(Math.random() * 220) + 60,
      downloads: Math.floor(Math.random() * 110) + 30,
      isPremium: Math.random() > 0.5,
      tags: [category.toLowerCase(), 'promotional', 'modern'],
      createdAt: '2024-01-12T11:15:00Z',
      updatedAt: '2024-01-25T09:30:00Z'
    },
    {
      id: '5',
      title: `${category} Brand Poster 5`,
      description: `Professional ${category.toLowerCase()} brand identity poster`,
      category,
      thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=400&fit=crop',
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=1200&fit=crop',
      downloadUrl: 'https://example.com/posters/5.jpg',
      likes: Math.floor(Math.random() * 190) + 45,
      downloads: Math.floor(Math.random() * 95) + 20,
      isPremium: Math.random() > 0.7,
      tags: [category.toLowerCase(), 'brand', 'identity'],
      createdAt: '2024-01-08T16:20:00Z',
      updatedAt: '2024-01-19T13:45:00Z'
    },
    {
      id: '6',
      title: `${category} Service Poster 6`,
      description: `Clean ${category.toLowerCase()} service poster design`,
      category,
      thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=400&fit=crop',
      imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=1200&fit=crop',
      downloadUrl: 'https://example.com/posters/6.jpg',
      likes: Math.floor(Math.random() * 160) + 35,
      downloads: Math.floor(Math.random() * 85) + 18,
      isPremium: Math.random() > 0.8,
      tags: [category.toLowerCase(), 'service', 'clean'],
      createdAt: '2024-01-14T08:30:00Z',
      updatedAt: '2024-01-21T15:10:00Z'
    }
  ];

  // Return 3-6 random posters for the category
  const shuffled = basePosters.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 4) + 3);
}

export default router;
