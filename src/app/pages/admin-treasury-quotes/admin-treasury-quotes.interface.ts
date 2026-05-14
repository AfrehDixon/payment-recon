export enum ETreasuryQuotePurpose {
  TRADE = 'TRADE',
  REMITTANCE = 'REMITTANCE',
  REMITTANCE_TERMINATION = 'REMITTANCE_TERMINATION',
  PAYMENT = 'PAYMENT',
  SETTLEMENT = 'SETTLEMENT'
}

export enum ETreasuryQuoteStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  USED = 'USED',
  CANCELLED = 'CANCELLED'
}

export enum ETreasuryQuoteProvider {
  BANK_FX_ENGINE = 'BANK_FX_ENGINE',
  T24 = 'T24',
  FLEXCUBE = 'FLEXCUBE',
  CUSTOM_BANK_API = 'CUSTOM_BANK_API',
  INTERNAL = 'INTERNAL'
}

export enum ETreasuryQuoteSource {
  INTERNAL = 'INTERNAL',
  BANK_EXTERNAL = 'BANK_EXTERNAL',
  CRYPTO_EXTERNAL = 'CRYPTO_EXTERNAL'
}

export interface CreateTreasuryQuotePayload {
  merchantId?: string;
  appId?: string;
  purpose?: ETreasuryQuotePurpose;
  sourceRail: string;
  sourceAsset: string;
  sourceAmount: number;
  destinationRail: string;
  destinationCurrency: string;
  treasuryRate: number;
  customerRate?: number;
  spread?: number;
  ttlSeconds?: number;
  metadata?: any;
}

export interface RequestExternalQuotePayload {
  merchantId?: string;
  appId?: string;
  provider?: ETreasuryQuoteProvider | string;
  purpose?: ETreasuryQuotePurpose;
  sourceRail: string;
  sourceAsset: string;
  sourceAmount: number;
  destinationRail: string;
  destinationCurrency: string;
  ttlSeconds?: number;
  metadata?: any;
}

export interface TreasuryQuote {
  _id: string;
  quoteRef: string;
  merchantId?: string;
  appId?: string;
  purpose?: ETreasuryQuotePurpose | string;
  sourceRail: string;
  sourceAsset: string;
  sourceAmount: number;
  destinationRail: string;
  destinationCurrency: string;
  destinationAmount: number;
  treasuryRate: number;
  customerRate?: number;
  spread: number;
  status: ETreasuryQuoteStatus | string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
  externalQuoteRef?: string;
  provider?: string;
  source?: string;
  providerQuoteId?: string;
  providerQuoteRef?: string;
  providerStatus?: string;
  providerRequestPayload?: any;
  providerResponsePayload?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface TreasuryQuoteResponse {
  success: boolean;
  code?: string;
  message?: string;
  data: TreasuryQuote;
  requestId?: string;
}

export interface ExternalQuoteResponse {
  success: boolean;
  code?: string;
  message?: string;
  data: {
    quoteRef: string;
    sourceAsset: string;
    sourceAmount: number;
    destinationCurrency: string;
    destinationAmount: number;
    rate: number;
    expiresAt: string;
    provider: string;
  };
  requestId?: string;
}

export interface GetTreasuryQuoteResponse {
  success: boolean;
  code?: string;
  message?: string;
  data: TreasuryQuote;
  requestId?: string;
}

export interface ListTreasuryQuotesParams {
  status?: string;
  quoteRef?: string;
  merchantId?: string;
  fromCurrency?: string;
  toCurrency?: string;
  provider?: string;
  externalProvider?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface ListTreasuryQuotesResponse {
  success: boolean;
  code?: string;
  message?: string;
  data: TreasuryQuote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  requestId?: string;
}