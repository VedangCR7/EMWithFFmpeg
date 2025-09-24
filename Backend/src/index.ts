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
import mobileAuthRoutes from './routes/mobileAuth';
import mobileContentRoutes from './routes/mobileContent';
import mobileSubscriptionRoutes from './routes/mobileSubscription';
import installedUsersRoutes from './routes/installedUsers';
import businessProfileRoutes from './routes/businessProfile';
import mobileApiAliases from './routes/mobileApiAliases';
import homeRoutes from './routes/home';
import templatesRoutes from './routes/templates';
import greetingsRoutes from './routes/greetings';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
app.use('/api/home', homeRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api', greetingsRoutes);

// Mobile app specific routes
app.use('/api/mobile/auth', mobileAuthRoutes);
app.use('/api/mobile/content', mobileContentRoutes);
app.use('/api/mobile/subscription', mobileSubscriptionRoutes);

// New user flow routes
app.use('/api/installed-users', installedUsersRoutes);
app.use('/api/business-profile', businessProfileRoutes);

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

app.listen(PORT, () => {
  console.log(`🚀 Business Marketing Platform API`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🔐 Admin Login: POST /api/auth/admin/login`);
    console.log(`👥 Subadmin Login: POST /api/auth/subadmin/login`);
    console.log(`📱 Mobile Registration: POST /api/mobile/register`);
    console.log(`📄 API Documentation: http://localhost:${PORT}/api`);
  }
});

export default app;