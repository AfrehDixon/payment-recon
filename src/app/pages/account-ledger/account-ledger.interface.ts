// account-ledger.interface.ts
export type LedgerBalanceType = 'CONFIRMED' | 'UNCONFIRMED' | 'BLOCKED' | 'AVAILABLE';
export type LedgerDirection = 'CREDIT' | 'DEBIT';
export type LedgerEntryType = 
  | 'DEPOSIT' 
  | 'WITHDRAWAL' 
  | 'TRANSFER' 
  | 'FEE' 
  | 'REFUND' 
  | 'ADJUSTMENT' 
  | 'HOLD' 
  | 'RELEASE'
  | 'FUNDING'
  | 'SETTLEMENT'
  | 'REVERSAL';

export interface AccountLedgerEntry {
  _id: string;
  accountId: string;
  merchantId?: string;
  walletType?: string;
  currency: string;
  balanceType: LedgerBalanceType;
  direction: LedgerDirection;
  entryType: LedgerEntryType;
  amount: number;
  transactionId?: string;
  externalTransactionId?: string;
  idempotencyKey?: string;
  provider?: string;
  providerRef?: string;
  meta?: Record<string, any>;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  __v?: number;
}

export interface LedgerFilters {
  page?: number;
  limit?: number;
  
  // Account filters
  accountId?: string;
  merchantId?: string;
  walletId?: string;
  customerId?: string;
  
  // Entry filters
  balanceType?: LedgerBalanceType;
  direction?: LedgerDirection;
  entryType?: LedgerEntryType;
  
  // Reference filters
  transactionId?: string;
  externalTransactionId?: string;
  provider?: string;
  operator?: string;
  currency?: string;
  
  // Date range
  from?: string;
  to?: string;
  
  // Sorting
  sortBy?: 'createdAt' | 'amount';
  sortDir?: 'asc' | 'desc';
}

export interface LedgerListResponse {
  success: boolean;
  data: {
    items: AccountLedgerEntry[];
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// New interfaces for summary data
export interface SummaryDirection {
  direction: LedgerDirection;
  totalAmount: number;
  count: number;
}

export interface SummaryGroup {
  _id: {
    balanceType: LedgerBalanceType;
    currency: string;
  };
  byDirection: SummaryDirection[];
  totalCount: number;
  totalAmount: number;
}

export type LedgerSummary = SummaryGroup[];

export interface LedgerSummaryResponse {
  success: boolean;
  data: LedgerSummary;
}