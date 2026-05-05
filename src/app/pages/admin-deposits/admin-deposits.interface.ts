// admin-deposits.interface.ts
export interface Deposit {
  _id: string;
  intentId: string;
  intentCode: string;
  merchantId: string;
  referenceId: string;
  asset: string;
  network: string;
  txHash: string;
  logIndex: number;
  from: string;
  to: string;
  amount: number;
  blockNumber: number;
  confirmations: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REPROCESSING' | 'COMPLETED';
  idempotencyKey: string;
  raw: {
    log: any;
    block: any;
    receipt: any;
  };
  meta?: {
    custody?: {
      creditError?: {
        message: string;
        at: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface DepositFilters {
  merchantId?: string;
  endCustomerId?: string;
  network?: string;
  asset?: string;
  status?: string;
  intentCode?: string;
  txHash?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface DepositListResponse {
  success: boolean;
  message?: string;
  data: {
    items: Deposit[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface DepositDetailsResponse {
  success: boolean;
  message?: string;
  data: Deposit;
}

export interface ReprocessDepositPayload {
  performedBy: string;
  reason?: string;
}

export interface ReprocessDepositResponse {
  success: boolean;
  message: string;
  data: Deposit;
}