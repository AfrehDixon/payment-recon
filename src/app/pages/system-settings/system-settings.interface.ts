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
  totalUsdtValue: number;
}

export interface BtcReserveConfig {
  lastRebalanceAt: string | null;
  lastDailyReset: string | null;
  bscRecipient: string;
  bscRouterAddr: string;
  bscVaultAddr: string;
  btcRecipient: string;
  cooldownSec: number;
  dailyUsdUsed: number;
  enabled: boolean;
  lowerPct: number;
  maxDailyUsd: number;
  maxTradeUsd: number;
  minTradeUsd: number;
  slippageBps: number;
  targetPct: number;
  upperPct: number;
  usdtTokenAddr: string;
}

export interface BtcSweepConfig {
  lastRunAt: string | null;
  enabled: boolean;
  lastInboundRef: string;
  maxSweepUsd: number;
  minSweepUsd: number;
  reserveBtc: number;
  slippageBps: number;
  sweepPctOfAvail: number;
  treasuryBep20: string;
}

export interface BtcBalances {
  activeAddresses: number;
  addressBalances: any[];
  lastBalanceUpdate: string;
  totalConfirmedBalance: number;
  totalUnconfirmedBalance: number;
  totalUsdValue: number;
  totalUtxos: number;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
  network: string;
  chainId: number;
}

export interface Bep20Balances {
  tokenInfo: TokenInfo;
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

export interface SolanaBalances {
  tokenInfo: SolanaTokenInfo;
  activeAddresses: number;
  lastBalanceUpdate: string;
  network: string;
  totalSolBalance: number;
  totalUsdValue: number;
  totalUsdtValue: number;
}

export interface P2pRate {
  price: number;
  provider: string;
  side: string;
  updatedAt: string;
  ttlSec: number;
  sampleSize: number;
}

export interface P2pRates {
  USDT_GHS_BUY: P2pRate;
  USDT_GHS_SELL: P2pRate;
  BTC_GHS_BUY: P2pRate;
  BTC_GHS_SELL: P2pRate;
}
export interface SystemSettings {
  _id: string;
  markupRate: number;
  exchangeRate: number;
  transactionFee: number;
  minTransactionAmount: number;
  trc20Balances: Trc20Balances;
  maxTransactionAmount: number;
  dynamicPricingEnabled: boolean;
  lastUpdated: string;
  marketPrice: number;
  btcNetworkFee: number;
  btcExchangeRate: number;
  usdtExchangeRate: number;
  solExchangeRate: number;
  ghsExchangeRate: number;
  bepExchangeRate: number;
  btcReserveConfig: BtcReserveConfig;
  btcSweepConfig: BtcSweepConfig;
  btcBalances: BtcBalances;
  bep20Balances: Bep20Balances;
  solanaBalances: SolanaBalances;
    p2p: P2pRates;
  __v: number;
}

export interface UpdateSystemSettingsRequest {
  markupRate?: number;
  transactionFee?: number;
  minTransactionAmount?: number;
  maxTransactionAmount?: number;
  dynamicPricingEnabled?: boolean;
  btcReserveConfig?: Partial<BtcReserveConfig>;
  btcSweepConfig?: Partial<BtcSweepConfig>;
}

export interface Trc20Balances {
  tokenInfo: {
    decimals: number;
    name: string;
    symbol: string;
  };
  lastBalanceUpdate: string;
  network: string;
  totalTokenBalance: number;
  totalTokenUsdValue: number;
  totalTrxBalance: number;
  totalTrxUsdValue: number;
  totalUsdValue: number;
}


export interface EditableSystemSettings {
  markupRate: number;
  transactionFee: number;
  minTransactionAmount: number;
  maxTransactionAmount: number;
  dynamicPricingEnabled: boolean;
  btcReserveConfig: Partial<BtcReserveConfig>;
  btcSweepConfig: Partial<BtcSweepConfig>;
}

export interface BtcBalanceData {
  total: number;
  confirmed: number;
  unconfirmed: number;
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

