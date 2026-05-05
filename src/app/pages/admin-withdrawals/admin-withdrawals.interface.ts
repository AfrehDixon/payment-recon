// admin-withdrawals.interface.ts
export interface Withdrawal {
  _id: string;
  custodyWalletId: string;
  assetWalletId: string;
  merchantId: string;
  endCustomerId?: string;
  network: string;
  asset: string;
  destinationAddress: string;
  amount: number;
  feeAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'SENT' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  txHash?: string | null;
  clientReference: string;
  idempotencyKey: string;
  approvedBy?: string | null;
  failureReason?: string | null;
  metadata: {
    source?: string;
    appId?: string;
    callbackUrl?: string;
    accountName?: string;
    accountIssuer?: string;
    accountType?: string;
    serviceType?: string;
    description?: string;
  };
  processingLock: {
    isLocked: boolean;
    lockedAt: string | null;
    lockedBy: string | null;
  };
  orchestrationMeta: {
    enabled: boolean;
    payoutTransactionId: string | null;
    payoutExternalTransactionId: string | null;
    payoutProviderStatus: string | null;
    submittedToDisburserAt: string | null;
    payoutLastCheckedAt: string | null;
    payoutFailureReason: string | null;
  };
  adminActionMeta: {
    action: string | null;
    performedBy: string | null;
    reason: string | null;
    metadata: any | null;
    at: string | null;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface WithdrawalFilters {
  merchantId?: string;
  endCustomerId?: string;
  assetWalletId?: string;
  network?: string;
  asset?: string;
  status?: string;
  destinationAddress?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface WithdrawalListResponse {
  success: boolean;
  message?: string;
  data: {
    items: Withdrawal[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface WithdrawalDetailsResponse {
  success: boolean;
  message?: string;
  data: Withdrawal;
}

export interface WithdrawalActionPayload {
  performedBy: string;
  reason?: string;
  txHash?: string;
  refund?: boolean;
  metadata?: any;
}

export interface WithdrawalActionResponse {
  success: boolean;
  message: string;
  data: Withdrawal;
}