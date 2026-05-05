// admin-liquidity-summary.interface.ts
export interface LiquidityByProviderAndAsset {
  _id: {
    provider?: string;
    asset?: string;
  };
  totalBalance: number;
  availableBalance: number;
  lockedBalance: number;
}

export interface LiquidityByProvider {
  _id: string | null;
  totalBalance: number;
  availableBalance: number;
  lockedBalance: number;
}

export interface LiquiditySummary {
  byProviderAndAsset: LiquidityByProviderAndAsset[];
  byProvider: LiquidityByProvider[];
}

export interface LiquiditySummaryResponse {
  success: boolean;
  message?: string;
  data: LiquiditySummary;
}

export interface LiquidityStats {
  label: string;
  value: number;
  icon: string;
  color: string;
  prefix?: string;
  suffix?: string;
  subtext?: string;
}