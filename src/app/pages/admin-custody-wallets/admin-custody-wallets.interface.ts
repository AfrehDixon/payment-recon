// admin-custody-wallets.interface.ts
export interface CustodyWallet {
  _id: string;
  merchantId: string;
  endCustomerId: string;
  walletRef: string;
  label: string;
  custodyMode: 'SEGREGATED' | 'OMNIBUS';
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED' | 'MAINTENANCE';
  metadata: {
    source: string;
  };
  lastDepositAt?: string;
  lastWithdrawalAt?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface WalletFilters {
  merchantId?: string;
  endCustomerId?: string;
  status?: string;
  custodyMode?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface WalletListResponse {
  success: boolean;
  message?: string;
  data: {
    items: CustodyWallet[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface WalletDetailsResponse {
  success: boolean;
  message?: string;
  data: CustodyWallet;
}

export interface UpdateWalletStatusPayload {
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED' | 'MAINTENANCE';
  reason: string;
  performedBy: string;
}

export interface UpdateWalletLimitsPayload {
  dailyLimit?: number;
  monthlyLimit?: number;
  perTransactionLimit?: number;
  performedBy: string;
  reason?: string;
}