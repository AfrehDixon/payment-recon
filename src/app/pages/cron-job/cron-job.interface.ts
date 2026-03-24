// cron-job.interface.ts

export interface CronJob {
  name: string;
  description: string | null;
  
  // Runtime status
  running: boolean;
  runtimeStatus: 'idle' | 'running' | 'stopped' | 'error';
  runnerInstanceId: string | null;
  heartbeatAt: string | null;
  pid: number | null;
  host: string | null;
  
  // Control commands
  controlCommand: 'start' | 'stop' | 'restart' | null;
  controlRequestedAt: string | null;
  controlRequestedBy: string | null;
  
  // Lease information
  leaseOwner: string | null;
  leaseAcquiredAt: string | null;
  leaseExpiresAt: string | null;
  
  // Configuration
  enabled: boolean;
  autoStart: boolean;
  autoRestartOnFailure: boolean;
  allowManualRun: boolean;
  
  // Timestamps
  lastStartedAt: string | null;
  lastStoppedAt: string | null;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  updatedAt: string | null;
}

export interface CronJobListResponse {
  success: boolean;
  data: CronJob[];
}

export interface CronJobActionResponse {
  success: boolean;
  message: string;
  data?: CronJob;
}

export interface CronJobConfigUpdate {
  enabled?: boolean;
  autoStart?: boolean;
  autoRestartOnFailure?: boolean;
  allowManualRun?: boolean;
  updatedBy?: string;
}

export interface CronJobCommandRequest {
  name: string;
  command: 'start' | 'stop' | 'restart';
  requestedBy?: string;
}