// types.ts
export interface Transaction {
  id: string;
  transactionNumber: string;
  date: Date;
  amount: number;
  status: 'success' | 'bounced' | 'cancelled' | 'dropped';
  paymentMethod: string;
  bankFee: number;
  profit: number;
}

// // Add this new interface for the transaction history modal
// export interface TransactionHistory {
// successRate: string|number;
// totalAmount: string|number;
// transactionCount: any;
//   timestamp: Date;
//   action: string;
//   description: string;
//   performedBy: string;
// }

export interface TransactionSummary {
  totalAmount: number;
  transactionCount: number;
  successRate: number;
  failureRate: number;
}