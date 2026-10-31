import { config } from '../config/index.js';

/**
 * Global Express error handling middleware.
 * Returns structured JSON with standardized error codes and retryable status.
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Handle invalid JSON body syntax errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_URL',
        message: 'Malformed JSON payload provided in request body.',
        retryable: false,
        details: err.message
      },
      timestamp: new Date().toISOString()
    });
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'UNKNOWN_ERROR';
  const retryable =
    typeof err.retryable === 'boolean'
      ? err.retryable
      : statusCode >= 500 || statusCode === 422 || statusCode === 504;

  const isOperational = err.isOperational || false;

  // Log unhandled non-operational errors
  if (!isOperational) {
    console.error('[System Error] Unhandled Exception:', err);
  }

  const response = {
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred on the server.',
      retryable,
      ...(err.details ? { details: err.details } : {})
    },
    timestamp: new Date().toISOString()
  };

  if (config.nodeEnv === 'development' && err.stack && !isOperational) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 Route Not Found middleware.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'BACKEND_ERROR',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
      retryable: false
    },
    timestamp: new Date().toISOString()
  });
}
