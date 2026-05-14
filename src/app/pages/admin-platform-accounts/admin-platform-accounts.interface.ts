// admin-platform-accounts.interface.ts
export enum EPlatformAccountCode {
  SETTLEMENT = 'SETTLEMENT',
  ESCROW = 'ESCROW',
  FEE_REVENUE = 'FEE_REVENUE',
  VAT_PAYABLE = 'VAT_PAYABLE',
  WITHHOLDING_TAX = 'WITHHOLDING_TAX',
  COMMISSION = 'COMMISSION',
  RESERVE = 'RESERVE',
  OPERATING = 'OPERATING'
}

export enum EPlatformAccountCategory {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export enum EPlatformAccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED'
}

export enum EPlatformAccountLedgerDirection {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

export interface SettlementAccount {
  type: string | null;
  accountName: string | null;
  accountNumber: string | null;
  issuer: string | null;
  currency: string | null;
}

export interface PlatformAccount {
  _id: string;
  code: EPlatformAccountCode;
  category: EPlatformAccountCategory;
  name: string;
  description: string | null;
  currency: string;
  balance: number;
  totalCredits: number;
  totalDebits: number;
  status: EPlatformAccountStatus;
  settlementAccount: SettlementAccount;
  metadata: {
    source?: string;
    notes?: string;
    createdBy?: string;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface PlatformAccountListResponse {
  success: boolean;
  message?: string;
  data: PlatformAccount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PlatformAccountResponse {
  success: boolean;
  message?: string;
  data: PlatformAccount;
}

export interface SeedDefaultsPayload {
  currency?: string;
  createdBy?: string;
}

export interface CreatePlatformAccountPayload {
  code: EPlatformAccountCode;
  category: EPlatformAccountCategory;
  name: string;
  description?: string;
  currency: string;
  settlementAccount?: {
    type?: string;
    accountName?: string;
    accountNumber?: string;
    issuer?: string;
    currency?: string;
  };
  metadata?: any;
}

export interface UpdatePlatformAccountPayload {
  name?: string;
  description?: string;
  status?: EPlatformAccountStatus;
  settlementAccount?: {
    type?: string;
    accountName?: string;
    accountNumber?: string;
    issuer?: string;
    currency?: string;
  };
  metadata?: any;
}

export interface ManualAdjustmentPayload {
  accountCode: EPlatformAccountCode;
  currency: string;
  direction: EPlatformAccountLedgerDirection;
  amount: number;
  reference?: string;
  description?: string;
  transactionId?: string;
  merchantId?: string;
  idempotencyKey?: string;
  metadata?: any;
}

export interface VatRemittancePayload {
  currency: string;
  amount: number;
  reference: string;
  description?: string;
  idempotencyKey?: string;
  metadata?: any;
}

export interface AdjustmentResponse {
  success: boolean;
  message?: string;
  data: {
    account: PlatformAccount;
    ledgerEntryId: string;
    transactionId?: string;
  };
}

export interface PlatformAccountFilters {
  code?: EPlatformAccountCode;
  category?: EPlatformAccountCategory;
  currency?: string;
  status?: EPlatformAccountStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}