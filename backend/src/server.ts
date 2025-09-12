/**
 * Expense Manager Backend Server
 * Main server file for the expense splitting app API
 *
 * @fileoverview TypeScript implementation of the main server with full type safety
 */

import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes
import expenseRoutes from '@/routes/expenseRoutes';
import groupRoutes from '@/routes/groupRoutes';

// Import database
import DatabaseFactory from '@/database/DatabaseFactory';

// Import middleware
import { errorHandler, notFound } from '@/middleware/errorHandler';
import requestIdMiddleware from '@/middleware/requestId';

// Load environment variables
dotenv.config();

/**
 * Main Application Class
 *
 * This class initializes and configures the Express application
 * with all necessary middleware, routes, and error handling.
 */
class App {
  public app: Application;
  private port: number;
  private apiVersion: string;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001', 10);
    this.apiVersion = process.env.API_VERSION || 'v1';

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize all middleware
   *
   * @private
   */
  private initializeMiddleware(): void {
    // Request ID middleware (should be first)
    this.app.use(requestIdMiddleware);

    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    const corsOptions: cors.CorsOptions = {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      optionsSuccessStatus: 200
    };
    this.app.use(cors(corsOptions));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        error: 'Rate limit exceeded'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        requestId: (req as any).id
      });
    });

    // API info endpoint
    this.app.get('/api', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Expense Manager API',
        version: this.apiVersion,
        documentation: '/api/docs',
        endpoints: {
          groups: `/api/${this.apiVersion}/groups`,
          expenses: `/api/${this.apiVersion}/expenses`,
          health: '/health'
        },
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      });
    });
  }

  /**
   * Initialize all routes
   *
   * @private
   */
  private initializeRoutes(): void {
    // API routes
    this.app.use(`/api/${this.apiVersion}/groups`, groupRoutes);
    this.app.use(`/api/${this.apiVersion}/expenses`, expenseRoutes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to Expense Manager API',
        version: this.apiVersion,
        documentation: '/api/docs',
        health: '/health',
        timestamp: new Date().toISOString(),
        requestId: (req as any).id
      });
    });
  }

  /**
   * Initialize error handling
   *
   * @private
   */
  private initializeErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   *
   * @public
   */
  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await this.initializeDatabase();

      // Start the server
      this.app.listen(this.port, () => {
        console.log(`🚀 Server running on port ${this.port}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API Version: ${this.apiVersion}`);
        console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
        console.log(`📝 Health Check: http://localhost:${this.port}/health`);
        console.log(`📚 API Info: http://localhost:${this.port}/api`);
        console.log(`👥 Groups API: http://localhost:${this.port}/api/${this.apiVersion}/groups`);
        console.log(`💰 Expenses API: http://localhost:${this.port}/api/${this.apiVersion}/expenses`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize database connection
   *
   * @private
   */
  private async initializeDatabase(): Promise<void> {
    try {
      const db = DatabaseFactory.createDatabase();
      await db.connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   *
   * @public
   */
  public async shutdown(): Promise<void> {
    try {
      console.log('🔄 Shutting down server gracefully...');

      // Close database connections
      const db = DatabaseFactory.createDatabase();
      await db.disconnect();
      console.log('✅ Database disconnected');

      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

/**
 * Create and start the application
 */
const app = new App();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  app.shutdown();
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  app.shutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
app.start().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});

export default app;
