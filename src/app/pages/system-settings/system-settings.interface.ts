export interface SystemSettings {
    _id: string;
    markupRate: number;
    exchangeRate: number;
    transactionFee: number;
    minTransactionAmount: number;
    maxTransactionAmount: number;
    dynamicPricingEnabled: boolean;
    lastUpdated: string;
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
  
  export type EditableSystemSettings = Omit<SystemSettings, 'exchangeRate' | 'lastUpdated'>;