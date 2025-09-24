import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Market Brand API - Ultra Simple Version',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Market Brand API Documentation',
    version: '1.0.0',
    endpoints: [
      'GET / - API status',
      'GET /health - Health check',
      'GET /api - API documentation'
    ]
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 API docs: http://localhost:${PORT}/api`);
  console.log(`✅ Server started successfully!`);
});

// Handle server errors
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('Please kill the process using this port and try again.');
  } else {
    console.error('❌ Server error:', err);
  }
});

export default app;
