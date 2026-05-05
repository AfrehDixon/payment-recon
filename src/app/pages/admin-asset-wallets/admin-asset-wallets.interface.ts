// admin-asset-wallets.interface.ts
export interface AssetWallet {
  _id: string;
  custodyWalletId: string;
  merchantId: string;
  endCustomerId: string;
  network: string;
  asset: string;
  assetWalletRef: string;
  status: 'ACTIVE' | 'FROZEN' | 'MAINTENANCE' | 'CLOSED';
  availableBalance: number;
  ledgerBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  lastDepositAt?: string;
  lastWithdrawalAt?: string;
  metadata: {
    source: string;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface AssetWalletFilters {
  merchantId?: string;
  endCustomerId?: string;
  custodyWalletId?: string;
  network?: string;
  asset?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AssetWalletListResponse {
  success: boolean;
  message?: string;
  data: {
    items: AssetWallet[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AssetWalletDetailsResponse {
  success: boolean;
  message?: string;
  data: AssetWallet;
}

export interface UpdateAssetWalletStatusPayload {
  status: 'ACTIVE' | 'FROZEN' | 'MAINTENANCE' | 'CLOSED';
  reason: string;
  performedBy: string;
}