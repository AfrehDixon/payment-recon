// admin-quotes.interface.ts
export interface Quote {
  _id: string;
  quoteRef: string;
  merchantId: string;
  endCustomerId: string;
  pairCode: string;
  baseAsset: string;
  quoteAsset: string;
  side: 'BUY' | 'SELL' | 'SWAP';
  baseAmount: number;
  quoteAmount: number;
  rate: number;
  fee: number;
  feeBps: number;
  totalAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  expiredAt?: string;
  cancelledAt?: string;
  metadata: {
    source?: string;
    ipAddress?: string;
    userAgent?: string;
    notes?: string;
    rejectionReason?: string;
    cancellationReason?: string;
  };
  executionId?: string;
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