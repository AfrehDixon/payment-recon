// admin-rate-health.interface.ts
export interface RateHealthMetric {
  provider: string | null;
  pair: string | null;
  rate: number;
  createdAt: string;
  ageMs: number;
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'STALE';
}

export interface RateHealthResponse {
  success: boolean;
  message?: string;
  data: RateHealthMetric[];
}

export interface HealthStats {
  label: string;
  value: number;
  icon: string;
  color: string;
  suffix?: string;
}

export interface RateHealthSummary {
  totalSources: number;
  upCount: number;
  downCount: number;
  degradedCount: number;
  staleCount: number;
  averageAgeMs: number;
  oldestAgeMs: number;
  newestAgeMs: number;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'POOR';
}