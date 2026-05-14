// admin-executions.interface.ts
export interface Execution {
  _id: string;
  merchantId: string;
  endCustomerId: string;
  custodyWalletId: string;
  fromAssetWalletId: string;
  toAssetWalletId: string;
  quoteId: string;
  quoteRef: string;
  pairCode: string;
  side: 'BUY' | 'SELL' | 'SWAP';
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  price: number;
  grossToAmount: number;
  feeAmount: number;
  netToAmount: number;
  status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'RECONCILED' | 'SETTLED';
  executionRef: string;
  idempotencyKey: string;
  debitLedgerEntryId: string;
  creditLedgerEntryId: string;
  failureReason: string | null;
  metadata: {
    debitApplied: boolean;
    creditApplied: boolean;
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