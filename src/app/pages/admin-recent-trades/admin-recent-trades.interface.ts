// admin-recent-trades.interface.ts
export interface RecentTrade {
  _id: string;
  pairCode: string;
  baseAsset: string;
  quoteAsset: string;
  minTradeAmount: number;
  maxTradeAmount: number | null;
  pricePrecision: number;
  amountPrecision: number;
  feeBps: number;
  status: 'ACTIVE' | 'INACTIVE';
  metadata: {
    pricingSource: 'KRAKEN' | 'INTERNAL';
    krakenPair: string | null;
    buySpreadBps: number;
    sellSpreadBps: number;
    swapSpreadBps: number;
    _id?: string;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface RecentTradesResponse {
  success: boolean;
  message?: string;
  data: RecentTrade[];
}

export interface TradeStats {
  label: string;
  value: number;
  icon: string;
  color: string;
  prefix?: string;
  suffix?: string;
}