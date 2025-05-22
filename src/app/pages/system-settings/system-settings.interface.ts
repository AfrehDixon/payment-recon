export interface SystemSettings {
  _id: string;
  markupRate: number;
  exchangeRate: number;
  transactionFee: number;
  minTransactionAmount: number;
  maxTransactionAmount: number;
  dynamicPricingEnabled: boolean;
  lastUpdated: string;
  marketPrice: number;
  btcNetworkFee: number;
  btcExchangeRate: number;
  usdtExchangeRate: number;
  solExchangeRate: number;
  ghsExchangeRate: number;
}
  
  export interface ApiResponse {
    success: boolean;
    message: string;
    data: SystemSettings;
  }

  export interface SystemSettings {
    markupRate: number;
    exchangeRate: number;
    transactionFee: number;
    minTransactionAmount: number;
    maxTransactionAmount: number;
    dynamicPricingEnabled: boolean;
    lastUpdated: string;
  }

  export interface BtcBalanceData {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

export interface BtcBalanceResponse {
  success: boolean;
  message: string;
  data: BtcBalanceData;
}
  
  export type EditableSystemSettings = Omit<SystemSettings, 'exchangeRate' | 'lastUpdated'>;