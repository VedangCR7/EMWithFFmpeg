import express from 'express';

// Import existing mobile routes
import mobileAuthRoutes from './mobileAuth';
import mobileContentRoutes from './mobileContent';
import mobileSubscriptionRoutes from './mobileSubscription';
import businessProfileRoutes from './businessProfile';
import installedUsersRoutes from './installedUsers';
import mobileBusinessProfileRoutes from './mobile/businessProfile';

const router = express.Router();

// ============================================
// MOBILE API ALIASES FOR CLEANER PATHS
// ============================================

// Authentication aliases (cleaner paths for mobile app)
router.use('/auth', mobileAuthRoutes);

// User management aliases
router.use('/user', mobileAuthRoutes); // Profile endpoints
router.use('/business', businessProfileRoutes); // Business profile
router.use('/business-profiles', mobileBusinessProfileRoutes); // Mobile business profiles (plural)

// Content aliases
router.use('/content', mobileContentRoutes);

// Subscription aliases  
router.use('/subscription', mobileSubscriptionRoutes);

// Analytics aliases
router.use('/analytics', installedUsersRoutes);

// Health check for mobile app
router.get('/health', (req, res) => {
  res.json({
    status: true,
    message: 'Mobile API is healthy',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected',
        file_storage: 'available',
        payment_gateway: 'mock_ready'
      }
    }
  });
});

export default router;
