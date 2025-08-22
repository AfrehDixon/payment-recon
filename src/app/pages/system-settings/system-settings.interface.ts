export interface BtcBalanceInfo {
  activeAddresses: number;
  addressBalances: any[];
  lastBalanceUpdate: string;
  totalConfirmedBalance: number;
  totalUnconfirmedBalance: number;
  totalUsdValue: number;
  totalUtxos: number;
}

export interface Bep20TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
  network: string;
  chainId: number;
}

export interface Bep20BalanceInfo {
  tokenInfo: Bep20TokenInfo;
  activeAddresses: number;
  addressBalances: any[];
  lastBalanceUpdate: string;
  totalBnbBalance: number;
  totalBnbUsdValue: number;
  totalTokenBalance: number;
  totalTokenUsdValue: number;
  totalUsdValue: number;
}

export interface SolanaTokenInfo {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
}

export interface SolanaBalanceInfo {
  tokenInfo: SolanaTokenInfo;
  activeAddresses: number;
  lastBalanceUpdate: string;
  network: string;
  totalSolBalance: number;
  totalUsdValue: number;
}

export interface SystemSettings {
  _id: string;
  markupRate: number;
  exchangeRate: number;
  transactionFee: number;
  minTransactionAmount: number;
  maxTransactionAmount: number;
  dynamicPricingEnabled: boolean;
  lastUpdated: string;
  __v: number;
  marketPrice: number;
  btcNetworkFee: number;
  btcExchangeRate: number;
  usdtExchangeRate: number;
  solExchangeRate: number;
  ghsExchangeRate: number;
  bepExchangeRate: number;
  btcBalances: BtcBalanceInfo;
  bep20Balances: Bep20BalanceInfo;
  solanaBalances: SolanaBalanceInfo;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: SystemSettings;
}

export interface BtcBalanceData {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

export interface BtcBalanceResponse {
  success: boolean;
  message: string;
  data: BtcBalanceData;
}

export type EditableSystemSettings = Omit<SystemSettings, 'exchangeRate' | 'lastUpdated' | '__v' | '_id' | 'btcBalances' | 'bep20Balances' | 'solanaBalances'>;