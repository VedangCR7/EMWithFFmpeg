import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import contentRoutes from './routes/content';
import mobileRoutes from './routes/mobile';
// import mobileAuthRoutes from './routes/mobileAuth'; // Removed - using new mobile auth routes
import mobileContentRoutesOld from './routes/mobileContent';
import mobileSubscriptionRoutes from './routes/mobileSubscription';
import installedUsersRoutes from './routes/installedUsers';
import businessProfileRoutes from './routes/businessProfile';
import mobileApiAliases from './routes/mobileApiAliases';
import analyticsRoutes from './routes/analytics';
import searchRoutes from './routes/search';
import fileManagementRoutes from './routes/fileManagement';
import contentSyncRoutes from './routes/contentSync';

// Import mobile app routes
import mobileHomeRoutes from './routes/mobile/home';
import mobileAuthRoutesNew from './routes/mobile/auth';
import mobileTemplatesRoutes from './routes/mobile/templates';
import mobileGreetingsRoutes from './routes/mobile/greetings';
import mobileSubscriptionsRoutes from './routes/mobile/subscriptions';
import mobileBusinessProfileRoutes from './routes/mobile/businessProfile';
import mobileContentRoutes from './routes/mobile/content';
import mobileUsersRoutes from './routes/mobile/users';
import mobileTransactionsRoutes from './routes/mobile/transactions';
import mobileDownloadsRoutes from './routes/mobile/downloads';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://your-frontend-domain.com',
      process.env.CORS_ORIGIN
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
app.use(morgan('combined'));

// Compression middleware
app.use(compression());

// Serve static files (uploaded content)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/mobile', mobileRoutes);

// Mobile app specific routes (old) - REMOVED to avoid conflicts
// app.use('/api/mobile/auth', mobileAuthRoutes); // Removed - using new mobile auth routes
app.use('/api/mobile/content', mobileContentRoutes);
app.use('/api/mobile/subscription', mobileSubscriptionRoutes);

// New user flow routes
app.use('/api/installed-users', installedUsersRoutes);
app.use('/api/business-profile', businessProfileRoutes);

    // Analytics routes
    app.use('/api/analytics', analyticsRoutes);

    // Search routes
    app.use('/api/search', searchRoutes);

    // File management routes
    app.use('/api/file-management', fileManagementRoutes);

    // Content sync routes
    app.use('/api/content-sync', contentSyncRoutes);

    // Mobile app routes
    app.use('/api/mobile/home', mobileHomeRoutes);
    app.use('/api/mobile/auth', mobileAuthRoutesNew);
    app.use('/api/mobile/templates', mobileTemplatesRoutes);
    app.use('/api/mobile/greetings', mobileGreetingsRoutes);
    app.use('/api/mobile/subscriptions', mobileSubscriptionsRoutes);
    app.use('/api/mobile/business-profile', mobileBusinessProfileRoutes);
    app.use('/api/mobile/business-profiles', mobileBusinessProfileRoutes); // Alias for plural form
    app.use('/api/mobile/content', mobileContentRoutes);
    app.use('/api/mobile/users', mobileUsersRoutes);
    app.use('/api/mobile/transactions', mobileTransactionsRoutes);
    app.use('/api/mobile/downloads', mobileDownloadsRoutes);

// Mobile API aliases (cleaner paths for mobile app)
app.use('/api/v1', mobileApiAliases);

// Temporary API endpoints for testing
app.get('/api/admin/subadmins', (req, res) => {
  res.json({
    success: true,
    subadmins: [
      {
        id: '1',
        name: 'Priya Sharma',
        email: 'priya@marketbrand.com',
        password: 'Priya@123',
        role: 'Content Manager',
        status: 'active',
        permissions: ['Images', 'Videos', 'Categories'],
        assignedCategories: ['Restaurant'],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/mobile/business-categories', (req, res) => {
  res.json({
    success: true,
    categories: [
      { id: '1', name: 'Restaurant', description: 'Food and dining business content', icon: '🍽️' },
      { id: '2', name: 'Wedding Planning', description: 'Wedding and event planning content', icon: '💒' },
      { id: '3', name: 'Electronics', description: 'Electronic products and gadgets', icon: '📱' }
    ]
  });
});

// Legacy routes (for compatibility)
app.get('/api/marketing/campaigns', (req, res) => {
  res.json({
    campaigns: [
      {
        id: 1,
        name: 'Summer Sale 2024',
        description: 'Promotional campaign for summer products',
        status: 'active',
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        budget: 10000,
        targetAudience: 'Adults 25-45',
        impressions: 50000,
        clicks: 1200,
        conversions: 60,
        revenue: 15000
      }
    ]
  });
});

app.get('/api/dashboard/metrics', (req, res) => {
  res.json({
    totalCampaigns: 12,
    activeCampaigns: 8,
    totalImpressions: 125000,
    totalClicks: 3200,
    totalConversions: 180,
    totalRevenue: 45000
  });
});

app.get('/api/analytics', (req, res) => {
  const { range } = req.query;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  
  const analytics = {
    impressions: [] as number[],
    clicks: [] as number[],
    conversions: [] as number[],
    revenue: [] as number[],
    labels: [] as string[]
  };

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    analytics.labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    analytics.impressions.push(Math.floor(Math.random() * 5000) + 2000);
    analytics.clicks.push(Math.floor(Math.random() * 200) + 50);
    analytics.conversions.push(Math.floor(Math.random() * 20) + 5);
    analytics.revenue.push(Math.floor(Math.random() * 2000) + 500);
  }

  res.json(analytics);
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Business Marketing Platform API`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
  console.log(`📱 Android access: http://192.168.0.106:${PORT}/api`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🔐 Admin Login: POST /api/auth/admin/login`);
    console.log(`👥 Subadmin Login: POST /api/auth/subadmin/login`);
    console.log(`📱 Mobile Registration: POST /api/mobile/register`);
    console.log(`📄 API Documentation: http://localhost:${PORT}/api`);
  }
});

export default app;