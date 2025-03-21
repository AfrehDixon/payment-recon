export interface TransactionLimits {
  minAmount?: number;
  maxAmount?: number;
  dailyLimit?: number;
}

export interface OperatorConfig {
  _id?: string;
  name: string;
  merchantId?: string | null;
  accountTypes: EAccountType[];
  accountIssuers: string[];
  transactionTypes: string[];
  operator: EOperator;
  isActive: boolean;
  priority: number;
  supportedCurrencies?: string[];
  transactionLimits?: TransactionLimits;
  __v?: number;
}

export enum EAccountType {
  MOMO = 'momo',
  BANK = 'bank',
  CARD = 'card',
  BTC = 'btc',
  TRC20 = 'trc20',
  ERC20 = 'erc20',
  SOLANA = 'solana'
}

export enum EOperator {
  PEOPLESPAY = "PEOPLESPAY",
  FIDELITY = "FIDELITY",
  SOLANA = "SOLANA",
  GTCARD = "GTCARD",
  MOOLRE = "MOOLRE",
  PCARD = "PCARD",
  TRC20 = "TRC20",
  ERC20 = "ERC20",
  GTB = "GTB",
  FAB = "FAB",
  BTC = "BTC"
}

export enum EAccountIssuer {
  MTN = 'mtn',
  VODAFONE = 'vodafone',
  AIRTELTIGO = 'airteltigo'
}

export enum ETransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}