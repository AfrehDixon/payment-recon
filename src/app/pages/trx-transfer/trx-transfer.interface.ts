export interface TrxTransferRequest {
  fromAddress: string;
  toAddress: string;
  amountTrx: number;
  waitConfirm: boolean;
  allowAccountActivation: boolean;
}

export interface TrxTransferResponse {
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    fromAddress: string;
    toAddress: string;
    amountTrx: number;
    feeTrx: number;
    netAmountTrx: number;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    timestamp: string;
    confirmations?: number;
    blockHeight?: number;
  };
  error?: string;
}

export interface AddressBalance {
  address: string;
  balanceTrx: number;
  balanceUsd: number;
  isActivated: boolean;
  lastUpdated: string;
}

export interface TransactionHistory {
  transactionId: string;
  fromAddress: string;
  toAddress: string;
  amountTrx: number;
  feeTrx: number;
  status: string;
  timestamp: string;
  confirmations: number;
}