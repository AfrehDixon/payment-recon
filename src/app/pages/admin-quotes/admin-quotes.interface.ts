// admin-quotes.interface.ts
export interface Quote {
  _id: string;
  merchantId: string;
  endCustomerId: string;
  custodyWalletId: string;
  fromAssetWalletId: string;
  toAssetWalletId: string;
  pairCode: string;
  side: 'BUY' | 'SELL' | 'SWAP';
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  quotedPrice: number;
  grossToAmount: number;
  feeBps: number;
  feeAmount: number;
  netToAmount: number;
  expiresAt: string;
  status: 'PENDING' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  quoteRef: string;
  provider: string;
  metadata: {
    sourceNetwork?: string;
    destinationNetwork?: string;
    pricingSource: string;
    cachedPairCode: string;
    providerPairCode: string;
    cachedRate: number;
    fetchedAt: string;
    rateStatus: string;
    buySpreadBps: number;
    sellSpreadBps: number;
    swapSpreadBps: number;
    baseAsset: string;
    quoteAsset: string;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface QuoteFilters {
  merchantId?: string;
  endCustomerId?: string;
  pairCode?: string;
  side?: 'BUY' | 'SELL' | 'SWAP';
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface QuoteListResponse {
  success: boolean;
  message?: string;
  data: {
    items: Quote[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ExpireQuotePayload {
  performedBy: string;
  reason?: string;
}

export interface ExpireQuoteResponse {
  success: boolean;
  message: string;
  data: Quote;
}