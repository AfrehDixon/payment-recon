// admin-recent-withdrawals.interface.ts
export interface ProcessingLock {
  isLocked: boolean;
  lockedAt: string | null;
  lockedBy: string | null;
}

export interface OrchestrationMeta {
  enabled: boolean;
  payoutTransactionId: string | null;
  payoutExternalTransactionId: string | null;
  payoutProviderStatus: string | null;
  submittedToDisburserAt: string | null;
  payoutLastCheckedAt: string | null;
  payoutFailureReason: string | null;
}

export interface AdminActionMeta {
  action: string | null;
  performedBy: string | null;
  reason: string | null;
  metadata: any | null;
  at: string | null;
}

export interface RecentWithdrawal {
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
  processingLock: ProcessingLock;
  orchestrationMeta: OrchestrationMeta;
  adminActionMeta: AdminActionMeta;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface RecentWithdrawalsResponse {
  success: boolean;
  message?: string;
  data: RecentWithdrawal[];
}

export interface WithdrawalStats {
  label: string;
  value: number;
  icon: string;
  color: string;
  prefix?: string;
  suffix?: string;
}