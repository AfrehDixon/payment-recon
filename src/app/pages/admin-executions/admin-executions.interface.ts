// admin-executions.interface.ts
export interface Execution {
  _id: string;
  executionRef: string;
  quoteRef: string;
  merchantId: string;
  endCustomerId: string;
  pairCode: string;
  baseAsset: string;
  quoteAsset: string;
  side: 'BUY' | 'SELL' | 'SWAP';
  baseAmount: number;
  quoteAmount: number;
  rate: number;
  fee: number;
  feeBps: number;
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'RECONCILED' | 'SETTLED';
  quoteId: string;
  settlementTxId?: string;
  settlementAddress?: string;
  settlementNetwork?: string;
  failureReason?: string;
  reconciledAt?: string;
  reconciledBy?: string;
  settledAt?: string;
  metadata: {
    source?: string;
    ipAddress?: string;
    userAgent?: string;
    notes?: string;
    reconciliationNotes?: string;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ExecutionFilters {
  merchantId?: string;
  endCustomerId?: string;
  pairCode?: string;
  status?: string;
  quoteRef?: string;
  executionRef?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface ExecutionListResponse {
  success: boolean;
  message?: string;
  data: {
    items: Execution[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ReconcileExecutionPayload {
  performedBy: string;
  reason?: string;
  force?: boolean;
}

export interface ReconcileExecutionResponse {
  success: boolean;
  message: string;
  data: Execution;
}