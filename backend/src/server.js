/**
 * Expense Manager Backend Server
 * Main server file for the expense splitting app API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

// Import database
const databaseFactory = require('./database/DatabaseFactory');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'Rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await databaseFactory.getHealthStatus();
    
    res.status(200).json({
      success: true,
      message: 'Expense Manager API is running',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Expense Manager API is running but database is unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: { status: 'error', message: error.message }
    });
  }
});

// API routes
app.use(`/api/${API_VERSION}/groups`, groupRoutes);
app.use(`/api/${API_VERSION}/expenses`, expenseRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Expense Manager API',
    version: API_VERSION,
    endpoints: {
      health: '/health',
      groups: `/api/${API_VERSION}/groups`,
      expenses: `/api/${API_VERSION}/expenses`,
      documentation: 'https://github.com/mbsachidanand/ExpenseManager'
    }
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    console.log('🔌 Initializing database connection...');
    await databaseFactory.getAdapter();
    console.log('✅ Database connection established');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Expense Manager API server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

const server = startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await databaseFactory.disconnect();
  server.then(s => s.close(() => {
    console.log('Process terminated');
  }));
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await databaseFactory.disconnect();
  server.then(s => s.close(() => {
    console.log('Process terminated');
  }));
});

module.exports = app;
