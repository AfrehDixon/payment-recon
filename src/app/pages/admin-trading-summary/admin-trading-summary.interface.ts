// admin-trading-summary.interface.ts
export interface TradingRange {
  from: string;
  to: string;
}

export interface TradingTotals {
  totalCount: number;
  totalAmount: number;
  totalProfit: number;
}

export interface TradingByStatus {
  _id: string;
  count: number;
  totalAmount: number;
}

export interface TopPair {
  _id: string;
  count: number;
  totalAmount: number;
}

export interface TradingSummary {
  range: TradingRange;
  totals: TradingTotals;
  byStatus: TradingByStatus[];
  topPairs: TopPair[];
}

export interface TradingSummaryResponse {
  success: boolean;
  message?: string;
  data: TradingSummary;
}

export interface TradingStats {
  label: string;
  value: number;
  icon: string;
  color: string;
  prefix?: string;
  suffix?: string;
}