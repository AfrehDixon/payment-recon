// admin-platform-account-ledgers.interface.ts
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

export enum EPlatformAccountLedgerEntryType {
  FEE_REVENUE_CREDIT = 'FEE_REVENUE_CREDIT',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  TRANSACTION_FEE = 'TRANSACTION_FEE',
  VAT_REMITTANCE = 'VAT_REMITTANCE',
  SETTLEMENT = 'SETTLEMENT',
  DISBURSEMENT = 'DISBURSEMENT'
}

export enum EPlatformAccountLedgerDirection {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

export interface PlatformAccountRef {
  _id: string;
  code: EPlatformAccountCode;
  category: EPlatformAccountCategory;
  name: string;
  description: string | null;
  currency: string;
  balance: number;
  totalCredits: number;
  totalDebits: number;
  status: string;
  settlementAccount: any;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRef {
  _id: string;
  transactionRef: string;
  externalTransactionId: string;
  amount: number;
  actualAmount: number;
  charges: number;
  profitEarned: number;
  status: string;
  description: string;
  transaction_type: string;
  currency?: string;
  createdAt: string;
}

export interface PlatformAccountLedger {
  _id: string;
  platformAccountId: PlatformAccountRef;
  accountCode: EPlatformAccountCode;
  accountCategory: EPlatformAccountCategory;
  transactionId: TransactionRef;
  merchantId: string | null;
  entryType: EPlatformAccountLedgerEntryType;
  direction: EPlatformAccountLedgerDirection;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  idempotencyKey: string;
  reference: string;
  description: string;
  metadata: {
    source: string;
    externalTransactionId?: string;
    transactionRef?: string;
    operator?: string | null;
    rail?: string | null;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface PlatformAccountLedgerFilters {
  platformAccountId?: string;
  accountCode?: EPlatformAccountCode;
  accountCategory?: EPlatformAccountCategory;
  entryType?: EPlatformAccountLedgerEntryType;
  direction?: EPlatformAccountLedgerDirection;
  currency?: string;
  transactionId?: string;
  merchantId?: string;
  reference?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PlatformAccountLedgerListResponse {
  success: boolean;
  message?: string;
  data: PlatformAccountLedger[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PlatformAccountLedgerResponse {
  success: boolean;
  message?: string;
  data: PlatformAccountLedger;
}