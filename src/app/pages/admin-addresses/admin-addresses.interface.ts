// admin-addresses.interface.ts
export interface CustodyAddress {
  _id: string;
  network: string;
  asset: string;
  address: string;
  index: number;
  derivationPath: string;
  isActive: boolean;
  state: 'ASSIGNED' | 'WARM' | 'RETIRED' | 'LOCKED';
  currentBalance: number;
  totalReceived: number;
  reuseCount: number;
  hasTokens: boolean;
  nativeBalance: number;
  nativeDust: number;
  minConsolidateUsd: number;
  maxAddressAgeHours: number;
  lastBalanceUpdate?: string;
  lastTransactionCheck?: string;
  firstTransactionAt?: string;
  lastTransactionAt?: string;
  addressLocked: boolean;
  addressLockedAt?: string;
  addressLockedBy?: string;
  isSweepLocked: boolean;
  pendingConsolidation: boolean;
  consolidatedTransactionId?: string;
  consolidationError?: string;
  consolidationData?: any;
  consolidationAttempts: number;
  consolidationStatus?: string;
  retiredAt?: string;
  retiredReason?: string;
  lease?: {
    kind: string;
    refId: string;
    refCode: string;
    amount: number;
    leasedAt: string;
    expiresAt: string;
    _id?: string;
  };
  sweepPolicy: {
    mode: 'THRESHOLD' | 'IMMEDIATE';
    minUsdThreshold: number;
    destination: string;
    autoRules: any[];
    sweepWhileLeased: boolean;
    keepAliveAfterSweep: boolean;
    windowHours: number;
  };
  tokenContract?: string;
  label?: string;
  used?: boolean;
  hasUnspent?: boolean;
  lastScannedBlock?: number;
  lastScannedAt?: string;
  confirmedTransactions?: number;
  unconfirmedTransactions?: number;
  hdPath?: string;
  watchOnly?: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface AddressFilters {
  merchantId?: string;
  endCustomerId?: string;
  custodyWalletId?: string;
  assetWalletId?: string;
  network?: string;
  asset?: string;
  isActive?: boolean;
  role?: string;
  hasBalance?: boolean;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AddressListResponse {
  success: boolean;
  message?: string;
  data: {
    items: CustodyAddress[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AddressDetailsResponse {
  success: boolean;
  message?: string;
  data: CustodyAddress;
}

export interface AddressActionPayload {
  reason?: string;
  performedBy: string;
  metadata?: any;
}

export interface AddressActionResponse {
  success: boolean;
  message: string;
  data: CustodyAddress;
}