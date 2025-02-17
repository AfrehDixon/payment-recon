export interface Tier {
    threshold: number;
    rate: number;
  }
  
  export interface ChargeConfig {
    _id?: string;
    name: string;
    merchantId?: string | null;
    accountIssuers: string[];
    transactionTypes: ETransactionType[];
    calculationMethod: EChargeCalculationMethod;
    baseRate: number;
    maxCharge?: number;
    minCharge?: number;
    tiers?: Tier[];
  }
  
  export enum ETransactionType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT'
  }
  
  export enum EChargeCalculationMethod {
    PERCENTAGE = 'PERCENTAGE',
    FIXED = 'FIXED'
  }
  
  export enum EAccountIssuer {
    MTN = 'mtn',
    VODAFONE = 'vodafone',
    AIRTELTIGO = 'airteltigo',
    VISA = 'visa',
    MASTERCARD = 'mastercard',
    CARD = 'card',
    TRC20 = 'trc20',
    BTC = 'btc',
    SOLANA = 'solana',
    ERC20 = 'erc20',
    BANKTRF = 'banktrf',
    BANKTRFNRT = 'banktrfnrt',
    MOMO = 'momo'
  }