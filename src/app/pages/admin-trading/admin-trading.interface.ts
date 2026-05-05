// admin-trading.interface.ts
export interface TradingPair {
  _id: string;
  pairCode: string;  // Added this field
  baseAsset: string;
  quoteAsset: string;
  minTradeAmount: number;
  maxTradeAmount: number | null;
  pricePrecision: number;
  amountPrecision: number;
  feeBps: number;
  status: 'ACTIVE' | 'DISABLED';
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

export interface CreatePairPayload {
  baseAsset: string;
  quoteAsset: string;
  minTradeAmount?: number;
  maxTradeAmount?: number | null;
  pricePrecision?: number;
  amountPrecision?: number;
  feeBps?: number;
  metadata?: {
    pricingSource?: 'KRAKEN' | 'INTERNAL';
    krakenPair?: string | null;
    buySpreadBps?: number;
    sellSpreadBps?: number;
    swapSpreadBps?: number;
  };
}

export interface UpdatePairPayload {
  minTradeAmount?: number;
  maxTradeAmount?: number | null;
  pricePrecision?: number;
  amountPrecision?: number;
  feeBps?: number;
  status?: 'ACTIVE' | 'DISABLED';
  metadata?: {
    pricingSource?: 'KRAKEN' | 'INTERNAL';
    krakenPair?: string | null;
    buySpreadBps?: number;
    sellSpreadBps?: number;
    swapSpreadBps?: number;
  };
}

export interface PairFilters {
  baseAsset?: string;
  quoteAsset?: string;
  status?: string;
  pricingSource?: string;
  page?: number;
  limit?: number;
}

export interface PairListResponse {
  success: boolean;
  message?: string;
  data: {
    items: TradingPair[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PairActionPayload {
  performedBy: string;
  reason?: string;
}