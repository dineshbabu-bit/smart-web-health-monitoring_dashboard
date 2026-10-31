export type HealthStatus = 'Healthy' | 'Degraded' | 'Down' | 'Unknown';

export interface Application {
  id: string;
  name: string;
  url: string;
  description?: string;
  checkInterval: number; // in seconds
  timeoutThreshold: number; // in ms
  warningThreshold: number; // in ms
  criticalThreshold: number; // in ms
  status: HealthStatus;
  lastResponseTime: number | null; // in ms
  uptime: number; // percentage 0-100
  lastChecked: string | null; // ISO string
  createdAt: string;
}

export interface HealthCheck {
  id: string;
  applicationId: string;
  timestamp: string;
  statusCode: number;
  responseTime: number;
  status: HealthStatus;
}

export interface Alert {
  id: string;
  applicationId: string;
  applicationName: string;
  type: 'Performance' | 'Availability' | 'Anomaly';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface SystemHealthScore {
  total: number;
  availability: number; // out of 40
  performance: number; // out of 25
  reliability: number; // out of 20
  errorRate: number; // out of 15
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
}
