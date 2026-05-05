// admin-custody-summary.interface.ts
export interface CustodyRange {
  from: string;
  to: string;
}

export interface BalanceByAsset {
  _id: string;
  totalAvailable: number;
  totalLocked: number;
  walletCount: number;
}

export interface CustodySummary {
  range: CustodyRange;
  walletCount: number;
  balancesByAsset: BalanceByAsset[];
  withdrawalsByStatus: any[];
  tradesByStatus: any[];
}

export interface CustodySummaryResponse {
  success: boolean;
  message?: string;
  data: CustodySummary;
}