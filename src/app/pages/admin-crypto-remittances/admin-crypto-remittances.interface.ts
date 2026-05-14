// admin-crypto-remittances.interface.ts
export interface SourceDetails {
  rail: string;
  network: string;
  asset: string;
  expectedAmount: number;
}

export interface DestinationDetails {
  rail: string;
  currency: string;
  amount: number;
  type: string;
  provider: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  serviceType: string;
}

export interface RatesDetails {
  sourceUsdRate: number;
  conversionRate: number;
  providerRate: number;
  spread: number;
}

export interface FeesDetails {
  platformFee: number;
  networkFee: number;
  payoutFee: number;
  totalFee: number;
}

export interface SenderDetails {
  name: string;
  email: string;
  phone: string;
  country: string;
}

export interface ReconciliationDetails {
  attempts: number;
  lastCheckedAt: string;
  lastError: string;
}

export interface WebhookDetails {
  attempts: number;
  lastAttemptAt: string;
  lastError: string;
  lastWebhookDeliveryId: string;
}

export interface TreasuryDetails {
  quoteRef: string;
  sourceRail: string;
  sourceAsset: string;
  sourceAmount: number;
  destinationRail: string;
  destinationCurrency: string;
  destinationAmount: number;
  treasuryRate: number;
  customerRate: number;
  spread: number;
}

export interface TerminationDetails {
  status: string;
}

export interface ProcessingLock {
  isLocked: boolean;
}

export interface CollectionLegResponse {
  success: boolean;
  code: string;
  message: string;
  externalTransactionId: string;
  date: string;
  transactionId: string | null;
}

export interface CollectionLeg {
  createdAt: string;
  externalTransactionId: string;
  response: CollectionLegResponse;
  status: string;
}

export interface CryptoRemittance {
  _id: string;
  externalReference: string;
  merchantId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  source: SourceDetails;
  destination: DestinationDetails;
  rates: RatesDetails;
  fees: FeesDetails;
  sender: SenderDetails;
  reconciliation: ReconciliationDetails;
  callbackUrl: string;
  webhook: WebhookDetails;
  treasury: TreasuryDetails;
  termination: TerminationDetails;
  processingLock: ProcessingLock;
  webhookLock: ProcessingLock;
  metadata: {
    purpose: string;
    channel: string;
    remittanceType: string;
    quoteOnly: boolean;
    requestId: string;
    treasuryQuoteRef: string;
    quoteId: string;
    quoteExecutedAt: string;
    executedFromQuote: boolean;
    collectionPayload?: any;
  };
  collectionLeg: CollectionLeg;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface CryptoRemittanceFilters {
  merchantId?: string;
  endCustomerId?: string;
  status?: string;
  externalReference?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface CryptoRemittanceListResponse {
  success: boolean;
  code?: string;
  message?: string;
  data: CryptoRemittance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  requestId?: string;
}

export interface CryptoRemittanceSummary {
  totals: {
    _id: null;
    count: number;
    sourceAmount: number;
    receivedAmount: number;
    destinationAmount: number;
  };
  byStatus: Array<{
    _id: string;
    count: number;
    sourceAmount: number;
    destinationAmount: number;
  }>;
}

export interface CryptoRemittanceSummaryResponse {
  success: boolean;
  code?: string;
  message?: string;
  data: CryptoRemittanceSummary;
  requestId?: string;
}

export interface CryptoRemittanceDetailsResponse {
  success: boolean;
  code?: string;
  message?: string;
  data: CryptoRemittance;
  requestId?: string;
}