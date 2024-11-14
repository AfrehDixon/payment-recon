export enum TransactionStatus {
  'PAID' = 'paid',
  'FAILED' = 'failed',
  'PENDING' = 'pending',
}

export enum EnumTransactionTypes {
  'DEBIT' = 'DEBIT',
  'CREDIT' = 'CREDIT',
  'SETTLEMENT' = 'SETTLEMENT',
}

export interface ISmPayload {
  [index: string]: string | boolean;
  customerId: string;
  payment_account_name: string;
  payment_account_number: string;
  payment_account_issuer: 'provider';
  payment_account_issuer_name: 'LAZYPAY';
  payment_account_type: 'wallet';
  recipient_account_name: string;
  recipient_account_number: string;
  recipient_account_issuer: string;
  recipient_account_issuer_name: string;
  recipient_account_type: string;
  transaction_type: 'SM';
  amount: string;
  description: string;
  customerType: 'merchants';
  account_name: string;
}

export enum EnumPaymentTransactionStatus {
  'PENDING' = 'PENDING',
  'REVERSAL' = 'REVERSAL',
  'PAID' = 'PAID',
  'FAILED' = 'FAILED',
  'INITIATED' = 'INITIATED',
  'PENDINGPAYMENT' = 'PENDING PAYMENT',
  'PENDINGCREDIT' = 'PENDING CREDIT',
  'COMPLETED' = 'COMPLETED',
  'UNCONFIRMED' = 'UNCONFIRMED',
  'CONFIRMED' = 'CONFIRMED',
}

