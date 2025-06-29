import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { initializeDatabase } from './database/connection';
import authRoutes from './routes/auth';
import deployRoutes from './routes/deploy';
import tokensRoutes from './routes/tokens';

// Load environment variables
dotenv.config();

// Validate environment variables early
import { env } from './utils/validateEnv';

const app = express();
const PORT = env.PORT;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const deployLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour  
  max: 5, // Limit deployments to 5 per hour per IP
  message: {
    error: 'Too many deployment attempts. Please wait an hour before trying again.',
  },
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Required for some wallet connections
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Next.js and wallet connections
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:", "data:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Rate limiting
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allowed?: boolean) => void) => {
    const allowedOrigins = [
      env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for signature verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/deploy', deployLimiter, deployRoutes); // Apply deployment rate limiting
app.use('/api/tokens', tokensRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 ZCORP Backend Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${env.FRONTEND_URL}`);
      console.log(`⛓️  Chain: ${env.CHAIN_ID} (Base)`);
      console.log(`🛡️  Security: Rate limiting, Helmet, CORS enabled`);
      console.log(`🔐 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;