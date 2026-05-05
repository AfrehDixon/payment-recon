// admin-recent-transactions.interface.ts
export interface RecentTransaction {
  _id: string;
  transactionRef: string;
  externalTransactionId: string;
  walletType: string;
  operator: string;
  channel: string;
  merchantId: string;
  appId: string;
  payment_account_name: string;
  payment_account_number: string;
  payment_account_issuer: string;
  payment_account_type: string;
  amount: number;
  actualAmount: number;
  charges: number;
  profitEarned: number;
  recipient_account_name: string;
  recipient_account_number: string;
  recipient_account_issuer: string;
  recipient_account_type: string;
  transaction_type: 'CREDIT' | 'DEBIT';
  serviceType: string;
  status: 'PAID' | 'FAILED' | 'PENDING' | 'PROCESSING';
  charge_type: string;
  description: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  reason?: string;
  partnerTransactionId?: string;
  balanceBeforDebit?: number;
  balanceAfterDebit?: number;
  balanceBeforeCredit?: number;
  balanceAfterCredit?: number;
  profitDetails?: {
    charge: number;
    partnerCharge: number;
    profit: number;
  };
  callbackResponse?: {
    Status: string;
    Message: string;
    GTBTransId?: string;
    ProviderTransId?: string;
  };
}

export interface RecentTransactionsResponse {
  success: boolean;
  message?: string;
  data: RecentTransaction[];
}

export interface TransactionStats {
  label: string;
  value: number;
  icon: string;
  color: string;
  prefix?: string;
}