// operator-switch.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import url from '../../constants/api.constant';

export enum EPaymentAccountTypes {
  BANK = "bank",
  MOMO = "momo",
  CARD = "card",
  WALLET = "wallet",
  TOKEN = "token",
  BTC = "btc",
  TRC20 = "trc20",
  ERC20 = "erc20",
  SOLANA = "solana",
}

export enum EOperator {
  DORON = "DORON",
  PEOPLESPAY = "PEOPLESPAY",
  FIDELITY = "FIDELITY",
  SOLANA = "SOLANA",
  GTCARD = "GTCARD", // GTBank card payment
  MOOLRE = "MOOLRE",
  PCARD = "PCARD", // Peoplespay Card payment
  TRC20 = "TRC20",
  ERC20 = "ERC20",
  GTB = "GTB",
  FAB = "FAB",
  BTC = "BTC",
  GIP = "GIP",
}

interface OperatorStats {
  operator: EOperator;
  successRate: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageResponseTime: number;
  isActive: boolean;
}

interface SwitchHistoryItem {
  _id: string;
  accountType: EPaymentAccountTypes;
  previousOperator: EOperator;
  newOperator: EOperator;
  reason: string;
  merchantId?: string;
  timestamp: Date;
  triggeredBy: string; // 'AUTO' or 'MANUAL'
}

interface Threshold {
  successRateThreshold: number;
  minTransactionsRequired: number;
  cooldownPeriod: number;
}

@Injectable({
  providedIn: 'root'
})
export class OperatorSwitchService {
  private apiUrl = url; // Adjust as needed for your API base URL

  constructor(private http: HttpClient) {}

  // Get current stats for an account type
  getCurrentStats(accountType: EPaymentAccountTypes, merchantId?: string): Observable<any> {
    let url = `${this.apiUrl}/operator-switch/stats/${accountType}`;
    if (merchantId) {
      url += `?merchantId=${merchantId}`;
    }
    return this.http.get(url);
  }

  // Get switch history for an account type
  getSwitchHistory(accountType: EPaymentAccountTypes, merchantId?: string, limit: number = 20): Observable<any> {
    let url = `${this.apiUrl}/operator-switch/history/${accountType}?limit=${limit}`;
    if (merchantId) {
      url += `&merchantId=${merchantId}`;
    }
    return this.http.get(url);
  }

  // Force a manual operator switch
  manualSwitch(accountType: EPaymentAccountTypes, newOperator: EOperator, reason: string, merchantId?: string): Observable<any> {
    const payload = {
      accountType,
      newOperator,
      reason,
      merchantId
    };
    return this.http.post(`${this.apiUrl}/operator-switch/manual-switch`, payload);
  }

  // Reset stats for an account type
  resetStats(accountType: EPaymentAccountTypes, merchantId?: string): Observable<any> {
    const payload = {
      accountType,
      merchantId
    };
    return this.http.post(`${this.apiUrl}/operator-switch/reset-stats`, payload);
  }

  // Run immediate operator switch analysis
  runAnalysis(): Observable<any> {
    return this.http.post(`${this.apiUrl}/operator-switch/run-analysis`, {});
  }

  // Get all account types with their thresholds
  getThresholds(): Observable<any> {
    return this.http.get(`${this.apiUrl}/operator-switch/thresholds`);
  }

  // Start the auto-switch service
  startService(): Observable<any> {
    return this.http.post(`${this.apiUrl}/operator-switch/start`, {});
  }

  // Stop the auto-switch service
  stopService(): Observable<any> {
    return this.http.post(`${this.apiUrl}/operator-switch/stop`, {});
  }

  // Helper methods to get display names
  getAccountTypeName(type: EPaymentAccountTypes): string {
    const names = {
      [EPaymentAccountTypes.BANK]: 'Bank Transfer',
      [EPaymentAccountTypes.MOMO]: 'Mobile Money',
      [EPaymentAccountTypes.CARD]: 'Card Payment',
      [EPaymentAccountTypes.WALLET]: 'Wallet',
      [EPaymentAccountTypes.TOKEN]: 'Token',
      [EPaymentAccountTypes.BTC]: 'Bitcoin',
      [EPaymentAccountTypes.TRC20]: 'TRC20',
      [EPaymentAccountTypes.ERC20]: 'ERC20',
      [EPaymentAccountTypes.SOLANA]: 'Solana',
    };
    return names[type] || type;
  }

  getOperatorName(operator: EOperator): string {
    const names = {
      [EOperator.DORON]: 'Doron',
      [EOperator.PEOPLESPAY]: 'PeoplesPay',
      [EOperator.FIDELITY]: 'Fidelity',
      [EOperator.SOLANA]: 'Solana Network',
      [EOperator.GTCARD]: 'GT Bank Card',
      [EOperator.MOOLRE]: 'Moolre',
      [EOperator.PCARD]: 'PeoplesPay Card',
      [EOperator.TRC20]: 'TRC20 Network',
      [EOperator.ERC20]: 'ERC20 Network',
      [EOperator.GTB]: 'GTBank',
      [EOperator.FAB]: 'First Atlantic Bank',
      [EOperator.BTC]: 'Bitcoin Network',
      [EOperator.GIP]: 'GIP',
    };
    return names[operator] || operator;
  }
}