import { api } from './api';
import type { AuditApiResponse, DeviceType } from '../types/audit';

export interface AuditRequestPayload {
  url: string;
  device?: DeviceType;
  categories?: string[];
}

/**
 * Executes a full Google Lighthouse audit via the backend API.
 * POST /api/audit/analyze
 */
export async function analyzeWebsite(
  url: string,
  device: DeviceType = 'desktop',
  categories?: string[]
): Promise<AuditApiResponse> {
  const payload: AuditRequestPayload = {
    url: url.trim(),
    device,
    ...(categories && categories.length > 0 ? { categories } : {})
  };

  const response = await api.post<AuditApiResponse>('/audit/analyze', payload);
  return response.data;
}

export interface SystemHealthResponse {
  status: 'online' | 'offline';
  service?: string;
  version?: string;
  backend?: {
    status: string;
    uptimeSec: number;
    environment: string;
  };
  auditEngine?: {
    status: 'ready' | 'busy' | 'missing_chrome' | 'unavailable';
    chromeInstalled: boolean;
    chromePath?: string | null;
    activeAudits: number;
    queueLength: number;
    maxConcurrent: number;
  };
  gemini?: {
    status: string;
    provider: 'gemini' | 'rules-fallback';
    apiKeyConfigured: boolean;
    model: string;
  };
  timestamp?: string;
}

/**
 * Checks backend audit service operational status.
 * GET /api/health through canonical API client
 */
export async function checkAuditHealth(): Promise<SystemHealthResponse> {
  const response = await api.get<SystemHealthResponse>('/health', { timeout: 8000 });
  return response.data;
}
