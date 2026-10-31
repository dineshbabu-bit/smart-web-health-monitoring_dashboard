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
      let originHostname = '';
      try {
        originHostname = new URL(origin).hostname;
      } catch {
        originHostname = origin;
      }

      // Check allowed origins set, localhost regex, Vercel/Render subdomains, or wildcard patterns
      const isAllowed =
        allowedOrigins.has(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        originHostname.endsWith('.vercel.app') ||
        originHostname.endsWith('.onrender.com') ||
        customOrigins.some((pattern) => {
          if (pattern.startsWith('*.')) {
            const baseDomain = pattern.slice(2);
            return originHostname === baseDomain || originHostname.endsWith(`.${baseDomain}`);
          }
          return pattern === origin;
        });

      if (isAllowed) {
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

// Root /health endpoint alias (mirrors /api/health)
app.use('/health', (req, res, next) => {
  req.url = '/health';
  apiRouter(req, res, next);
});

// API Routes (supports /api, /api/api, and direct root routing)
app.use('/api', apiRouter);
app.use('/api/api', apiRouter);
app.use('/audit', (req, res, next) => {
  req.url = `/audit${req.url}`;
  apiRouter(req, res, next);
});
app.use('/ai', (req, res, next) => {
  req.url = `/ai${req.url}`;
  apiRouter(req, res, next);
});

// 404 handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
