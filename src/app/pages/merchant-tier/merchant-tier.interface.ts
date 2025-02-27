export interface Merchant {
  _id: string;
  merchant_tradeName: string;
  tierEnabled: boolean;
  tierLevel?: ETierLevel;
  email: string;
  phone: string;
  active: boolean;
  [key: string]: any; // Additional properties
}

export interface TransactionLimit {
  dailyLimit: number;
  monthlyLimit: number;
  maxSingleTransactionAmount: number;
}

export interface TransactionLimits {
  debit: TransactionLimit;
  credit: TransactionLimit;
}

export interface MerchantTier {
  _id?: string;
  name: string;
  level: ETierLevel;
  scope: ETierScope;
  status: ETierStatus;
  transactionLimits: TransactionLimits;
  features: string[];
  monthlyFee: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TierSearchParams {
  merchantId?: string;
  scope?: ETierScope;
  level?: ETierLevel;
  feature?: string;
}

export interface TierAssignmentPayload {
  merchantId: string;
  feature?: string;
  preferredLevel?: ETierLevel;
}

export interface TierCreationPayload {
  merchantId: string;
  tierData: MerchantTier;
}

export enum ETierScope {
  GLOBAL = 'global',
  MERCHANT_SPECIFIC = 'merchant_specific',
}

export enum ETierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum ETierLevel {
  BASIC = 1,
  STANDARD = 2,
  PREMIUM = 3,
  ENTERPRISE = 4,
}

export enum EOperator {
    DORON = "DORON",
    PEOPLESPAY = "PEOPLESPAY",
    FIDELITY = "FIDELITY",
    SOLANA = "SOLANA",
    GTCARD = "GTCARD", // GTBank card payment
    MOOLRE = "MOOLRE",
    PCARD = "PCARD", // Peoplespay Card payment
    TRC20 = "TRC20",
    ERC20 = "ERC20",
    GTB = "GTB",
    FAB = "FAB",
    BTC = "BTC",
    GIP = "GIP",
  }
