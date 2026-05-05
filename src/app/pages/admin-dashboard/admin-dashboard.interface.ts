// admin-dashboard.interface.ts
export interface DashboardRange {
  from: string;
  to: string;
}

export interface TransactionSummary {
  _id: string | null;
  totalCount: number;
  totalAmount: number;
  totalActualAmount: number;
  totalCharges: number;
  totalProfit: number;
}

export interface StatusBreakdown {
  count: number;
  totalAmount: number;
}

export interface TodaySummary {
  volume: number;
  count: number;
  profit: number;
}

export interface DashboardSummary {
  range: DashboardRange;
  totalTransactions: number;
  credits: TransactionSummary;
  debits: TransactionSummary;
  statuses: {
    INITIATED: StatusBreakdown;
    PAID: StatusBreakdown;
    FAILED: StatusBreakdown;
  };
  today: TodaySummary;
}

export interface DashboardStats {
  label: string;
  value: number;
  change: number;
  icon: string;
  color: string;
  prefix?: string;
  suffix?: string;
}

export interface DashboardSummaryResponse {
  success: boolean;
  message?: string;
  data: DashboardSummary;
}