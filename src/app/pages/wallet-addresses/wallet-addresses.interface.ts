// wallet-addresses.interface.ts
export type Network = 'BEP20' | 'TRC20' | 'SOLANA' | 'POLYGON';
export type Asset = 'USDT' | 'USDC';
export type AddressState = 'FRESH' | 'WARM' | 'ASSIGNED' | 'COOLING' | 'LOCKED' | 'RETIRED';
export type LeaseKind = 'NONE' | 'TXN' | 'DEPOSIT_INTENT' | 'RECONCILER';

export interface Lease {
  kind: LeaseKind;
  refId?: string | null;
  refCode?: string | null;
  amount?: number;
  leasedAt?: string | null;
  expiresAt?: string | null;
}

export interface SweepPolicy {
  mode: string;
  destination: string;
  minUsdThreshold?: number;
  windowHours?: number;
  sweepWhileLeased?: boolean;
  keepAliveAfterSweep?: boolean;
}

export interface WalletAddress {
  _id: string;
  network?: Network;
  asset?: Asset;
  tokenContract?: string;
  address: string;
  index: number;
  derivationPath?: string;
  isActive?: boolean;
  state?: AddressState;
  openTransactionId?: string | null;
  lastTransactionId?: string | null;
  currentBalance?: number;
  totalReceived?: number;
  reuseCount?: number;
  hasTokens?: boolean;
  nativeBalance?: number;
  nativeDust?: number;
  minConsolidateUsd?: number;
  maxAddressAgeHours?: number;
  lastBalanceUpdate?: string | null;
  lastTransactionCheck?: string | null;
  firstTransactionAt?: string | null;
  lastTransactionAt?: string | null;
  lease: Lease;
  addressLocked?: boolean;
  addressLockedAt?: string | null;
  addressLockedBy?: string | null;
  isSweepLocked?: boolean;
  pendingConsolidation?: boolean;
  consolidatedTransactionId?: string | null;
  consolidationError?: any;
  consolidationData?: any;
  consolidationStatus?: string;
  sweepPolicy?: SweepPolicy;
  consolidatedAt?: string | null;
  consolidationAttempts?: number;
  retiredAt?: string | null;
  retiredReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletAddressFilters {
  page?: number;
  limit?: number;
  network?: string;
  asset?: string;
  state?: string;
  isActive?: boolean | string;
  leaseKind?: string;
  leased?: boolean | string;
  hasTokens?: boolean | string;
  pendingConsolidation?: boolean | string;
  isSweepLocked?: boolean | string;
  minBalance?: number;
  maxBalance?: number;
  q?: string;
  sort?: string;
}

export interface ByNetworkSummary {
  total: number;
  balance: number;
  pendingConsolidation: number;
  network: string | null;
}

export interface ByAssetSummary {
  total: number;
  balance: number;
  network?: string;
  asset?: string | null;
}

export interface ByStateSummary {
  total: number;
  state: string | null;
}

export interface ByLeaseKindSummary {
  total: number;
  kind: string | null;
}

export interface WalletAddressSummary {
  totals: {
    total: number;
    active: number;
    inactive: number;
    leased: number;
    leaseExpired: number;
    pendingConsolidation: number;
    sweepLocked: number;
    openTxn: number;
    staleAddrLocks: number;
    totalBalance: number;
    totalReceived: number;
  };
  byNetwork: ByNetworkSummary[];
  byAsset: ByAssetSummary[];
  byState: ByStateSummary[];
  byLeaseKind: ByLeaseKindSummary[];
  topBalances: any[];
}

export interface WalletAddressListResponse {
  success: boolean;
  data: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    items: WalletAddress[];
  };
}

export interface WalletAddressSummaryResponse {
  success: boolean;
  data: WalletAddressSummary;
}