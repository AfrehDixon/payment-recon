export interface Transaction {
  _id: string;
  actualAmount: number;
  amount: number;
  date: string;
  balanceAfterCredit: number;
  balanceBeforCredit: number;
  callbackUrl: string;
  channel: string;
  charge_type: string;
  charges: number;
  createdAt: string;
  currency: string;
  customerId: {
    _id: string;
    autosettle: boolean;
    debitCardOperator: string;
    debitOperator: string;
    creditOperator: string;
  };
  customerType: string;
  debitOperator: string;
  description: string;
  externalTransactionId: string;
  payment_account_issuer: string;
  payment_account_name: string;
  payment_account_number: string;
  payment_account_type: string;
  processAttempts: number;
  profitEarned: number;
  reason: string;
  recipient_account_issuer_name: string;
  recipient_account_name: string;
  recipient_account_number: string;
  recipient_account_type: string;
  status: string;
  transactionRef: string;
  transaction_type: string;
}

export interface TransactionSummary {
  totalAmount: number;
  transactionCount: number;
  successRate: number;
  failureRate: number;
}

export interface TransactionTotals {
  amount: number;
  charges: number;
  profit: number;
}

export interface ApiTransaction {
  [x: string]: any;
  _id: string;
  actualAmount: number;
  amount: number;
  charges: number;
  createdAt: string;
  currency: string;
  payment_account_issuer: string;
  payment_account_name: string;
  payment_account_number: string;
  payment_account_type: string;
  profitEarned: number;
  status: string;
  transactionRef: string;
  externalTransactionId: string;
  transaction_type: string;
  customerType: string;
  description: string;
  recipient_account_issuer_name: string;
  recipient_account_name: string;
  recipient_account_number: string;
  recipient_account_type: string;
}

export interface SetAllMerchants{
  
}