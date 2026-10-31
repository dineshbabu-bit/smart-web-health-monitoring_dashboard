/**
 * Standardized application error hierarchy with error codes and retryable flags.
 */

export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error description
   * @param {number} statusCode - HTTP status code
   * @param {string} errorCode - Machine-readable error code
   * @param {boolean} retryable - Whether client retry is recommended
   * @param {any} [details=null] - Additional error context
   */
  constructor(message, statusCode = 500, errorCode = 'BACKEND_ERROR', retryable = false, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errorCode = errorCode;
    this.retryable = retryable;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request: Malformed or disallowed URL.
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message || 'Invalid website URL or request parameters provided.', 400, 'INVALID_URL', false, details);
  }
}

/**
 * 400/502: Domain name could not be resolved via DNS.
 */
export class DnsResolutionError extends AppError {
  constructor(message, isTransient = false, details = null) {
    super(
      message || 'Unable to resolve this website domain. Please check the URL or try again.',
      isTransient ? 502 : 400,
      'DNS_ERROR',
      isTransient,
      details
    );
  }
}

/**
 * 502 Bad Gateway: Target host refused connection or is unreachable.
 */
export class TargetUnreachableError extends AppError {
  constructor(message, details = null) {
    super(
      message || 'The website could not be reached from the audit server.',
      502,
      'TARGET_UNREACHABLE',
      true,
      details
    );
  }
}

/**
 * 504 Gateway Timeout: Target server was too slow to respond.
 */
export class TargetTimeoutError extends AppError {
  constructor(message, details = null) {
    super(
      message || 'The website took too long to respond.',
      504,
      'TARGET_TIMEOUT',
      true,
      details
    );
  }
}

/**
 * 504 Gateway Timeout: Lighthouse audit run exceeded max execution time.
 */
export class LighthouseTimeoutError extends AppError {
  constructor(message, details = null) {
    super(
      message || 'The Lighthouse audit timed out. Please try again.',
      504,
      'LIGHTHOUSE_TIMEOUT',
      true,
      details
    );
  }
}

/**
 * 422 Unprocessable Entity: Page failed navigation or Lighthouse gatherer error.
 */
export class LighthouseExecutionError extends AppError {
  constructor(message, details = null, statusCode = 422) {
    super(
      message || 'The audit could not be completed for this page.',
      statusCode,
      'LIGHTHOUSE_ERROR',
      true,
      details
    );
  }
}

/**
 * 503 Service Unavailable: Headless Chrome launch failure.
 */
export class ChromeLaunchError extends AppError {
  constructor(message, details = null) {
    super(
      message || 'The browser engine could not start the audit.',
      503,
      'CHROME_ERROR',
      true,
      details
    );
  }
}

/**
 * 500 Internal Server Error: Generic backend failure.
 */
export class BackendError extends AppError {
  constructor(message, details = null) {
    super(
      message || 'The audit server is unavailable.',
      500,
      'BACKEND_ERROR',
      true,
      details
    );
  }
}

// Backward compatibility alias for legacy imports
export { TargetUnreachableError as NetworkError };
export { LighthouseExecutionError as LighthouseError };
