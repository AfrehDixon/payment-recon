// admin-crypto-rates.interface.ts
export interface CryptoRate {
  _id: string;
  pairCode: string;
  baseAsset: string;
  quoteAsset: string;
  bid: number;
  ask: number;
  mid: number;
  rate: number;
  lastTradePrice: number;
  spread?: number;
  spreadBps?: number;
  source: 'KRAKEN' | 'INTERNAL';
  status: 'ACTIVE' | 'STALE' | 'ERROR';
  providerPairCode: string;
  fetchedAt: string;
  expiresAt: string;
  failureReason: string | null;
  raw: any;
  metadata: {
    source: string;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface CryptoRateFilters {
  pairCode?: string;
  baseAsset?: string;
  quoteAsset?: string;
  source?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CryptoRateListResponse {
  success: boolean;
  message?: string;
  data: {
    items: CryptoRate[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface RefreshRatesPayload {
  performedBy: string;
  force?: boolean;
}

export interface RefreshRateResponse {
  success: boolean;
  message: string;
  data: {
    updatedCount?: number;
    rates?: CryptoRate[];
    rate?: CryptoRate;
  };
}