export interface Transaction {
  _id: string;
  channel: string;
  customerId: string;
  customerType: string;
  payment_account_name: string;
  payment_account_number: string;
  payment_account_issuer: string;
  payment_account_type: string;
  actualAmount: number;
  amount: number;
  charges: number;
  profitEarned: number;
  recipient_account_name: string;
  recipient_account_number: string;
  recipient_account_issuer_name: string;
  recipient_account_type: string;
  transaction_type: string;
  transactionRef: string;
  appId: string;
  externalTransactionId: string;
  status: string;
  description: string;
  callbackUrl: string;
  currency: string;
  debitOperator?: string;
  createdAt: string;
  updatedAt: string;
  lastProcessedAt?: string;
  statusCheckResponse?: string;
  balanceAfterCredit?: number;
  balanceBeforCredit?: number;
  recipient_account_issuer?: string;
  transaction?: {
    GTBTransId: string;
    PartnerTransId: string;
    Status: string;
    Message: string;
  };
  payload?: {
    ref: string;
    data: {
      ServiceName: string;
      ServiceNumber: string;
      Amount: string;
      Remarks: string;
      PaidBy: string;
      PayeeName: string;
    };
  };
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  data: Transaction[];
}