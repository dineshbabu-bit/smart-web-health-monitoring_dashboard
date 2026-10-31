import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration - support Vite dev servers, localhost, 127.0.0.1, and custom CORS_ORIGIN
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const customOrigins = config.corsOrigin && config.corsOrigin !== '*'
  ? config.corsOrigin.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

const allowedOrigins = new Set([...defaultAllowedOrigins, ...customOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Vite proxy, curl, server-to-server, or local tools)
      if (!origin || config.corsOrigin === '*') {
        return callback(null, true);
      }
      if (allowedOrigins.has(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Request body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// HTTP request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// Base welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Smart Web Application Health Monitoring API',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      analyze: 'POST /api/audit/analyze'
    },
    version: '1.0.0'
  });
});

// Root /health endpoint alias
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Smart Web Application Health Monitoring API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes (supports /api and handles duplicate /api/api gracefully)
app.use('/api', apiRouter);
app.use('/api/api', apiRouter);

// 404 handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
