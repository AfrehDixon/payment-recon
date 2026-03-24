// credit-queue.interface.ts

export interface CreditQueueItem {
lockedAt: any;
retryCount: any;
maxRetries: any;
  _id: string;
  transactionId: string;
  accountId: string;
  accountType: string;
  actualAmount: number;
  amount: number;
  attempts: number;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  currency: string;
  externalTransactionId: string;
  failedAt: string | null;
  idempotencyKey: string;
  lastError: {
    message: string;
    code: string | null;
    stack: string | null;
    raw: string | null;
    at: string;
  } | null;
  lockAcquiredAt: string | null;
  lockExpiresAt: string | null;
  lockedBy: string | null;
  maxAttempts: number;
  merchantId: string;
  meta: Record<string, any>;
  nextRetryAt: string | null;
  operator: string;
  priority: number;
  processingEndedAt: string | null;
  processingStartedAt: string | null;
  providerMessage: string | null;
  providerReference: string | null;
  providerStatus: string;
  queuedAt: string;
  reconciledAt: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  transactionRef: string;
  updatedAt: string;
}

export interface CreditQueueFilters {
  page?: number;
  limit?: number;
  status?: string;
  operator?: string;
  merchantId?: string;
  transactionRef?: string;
  externalTransactionId?: string;
  lockedOnly?: boolean;
}

export interface CreditQueueListResponse {
  success: boolean;
  data: CreditQueueItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreditQueueStatsResponse {
  success: boolean;
  data: {
    byStatus: Record<string, number>;
    lockedCount: number;
    retryPendingCount: number;
  };
}

export interface CreditQueueItemResponse {
  success: boolean;
  data: CreditQueueItem;
}

export interface QueueActionResponse {
  success: boolean;
  message: string;
  data: CreditQueueItem;
}

export interface QueueActionPayload {
  reason?: string;
}