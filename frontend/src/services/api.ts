import axios, { AxiosError } from 'axios';

// Canonical API Base URL - defaults to Vite proxy path '/api' in dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ApiErrorResponse {
  success: boolean;
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
    details?: unknown;
  };
  timestamp?: string;
}

export class AppApiError extends Error {
  code: string;
  statusCode: number;
  retryable: boolean;
  details?: unknown;

  constructor(message: string, code = 'UNKNOWN_ERROR', statusCode = 500, retryable = true, details?: unknown) {
    super(message);
    this.name = 'AppApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.details = details;
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 240000, // 240s gives the backend time to finish its 180s Lighthouse watchdog and return a response
});

// Request interceptor to prevent duplicate /api segments
api.interceptors.request.use((config) => {
  const baseURL = config.baseURL || '';
  if (baseURL.endsWith('/api') && config.url?.startsWith('/api/')) {
    config.url = config.url.replace(/^\/api/, '');
  } else if (baseURL.endsWith('/api/') && config.url?.startsWith('/api/')) {
    config.url = config.url.replace(/^\/api\//, '');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    // 1. Request cancelled
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(
        new AppApiError('Audit request was cancelled.', 'REQUEST_CANCELLED', 0, true)
      );
    }

    // 2. Client-side or gateway timeout (180s)
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(
        new AppApiError(
          'The Lighthouse audit timed out. Please try again.',
          'LIGHTHOUSE_TIMEOUT',
          504,
          true
        )
      );
    }

    // 3. Response received from backend API (HTTP 4xx / 5xx)
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data?.error;
      const backendCode = errorData?.code || 'UNKNOWN_ERROR';
      const backendMsg = errorData?.message;
      const retryable = errorData?.retryable ?? (status >= 500 || status === 422);

      // Prioritize explicit error messages from backend or map standard codes
      let message = backendMsg;

      if (!message) {
        switch (backendCode) {
          case 'INVALID_URL':
            message = 'Invalid website URL provided. Please enter a valid web address.';
            break;
          case 'DNS_ERROR':
            message = 'Unable to resolve this website domain. Please check the URL or try again.';
            break;
          case 'TARGET_UNREACHABLE':
            message = 'The website could not be reached from the audit server.';
            break;
          case 'TARGET_TIMEOUT':
            message = 'The website took too long to respond.';
            break;
          case 'LIGHTHOUSE_TIMEOUT':
            message = 'The Lighthouse audit timed out. Please try again.';
            break;
          case 'CHROME_ERROR':
            message = 'The browser engine could not start the audit. Ensure Google Chrome is installed on the host.';
            break;
          case 'BACKEND_ERROR':
            message = 'The audit server is unavailable.';
            break;
          case 'LIGHTHOUSE_ERROR':
            message = 'The audit could not be completed for this page.';
            break;
          default:
            if (status === 400) message = 'Invalid audit request parameters or website URL provided.';
            else if (status === 404) message = 'Requested API endpoint was not found on the server.';
            else if (status === 422) message = 'The target page could not be audited or navigation failed.';
            else if (status === 502) message = 'The audit server encountered a gateway or connection error. Please try again.';
            else if (status === 503) message = 'The browser engine could not start the audit.';
            else if (status === 504) message = 'The website took too long to respond.';
            else message = 'The audit could not be completed. Please try again.';
        }
      }

      return Promise.reject(
        new AppApiError(message, backendCode, status, retryable, errorData?.details)
      );
    }

    // 4. True network failure (Vite proxy disconnected or backend offline)
    return Promise.reject(
      new AppApiError(
        'Cannot connect to the Audit Engine. Please verify the backend service is running on port 5000 (run "npm run dev").',
        'BACKEND_ERROR',
        0,
        true
      )
    );
  }
);
