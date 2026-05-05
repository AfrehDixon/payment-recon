// admin-custody-wallets.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CustodyWallet,
  WalletFilters,
  WalletListResponse,
  WalletDetailsResponse,
  UpdateWalletStatusPayload,
  UpdateWalletLimitsPayload
} from './admin-custody-wallets.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminCustodyWalletsService {
  private baseUrl = 'https://doronpay.com/api/custody/wallets';

  constructor(private http: HttpClient) {}

  /**
   * List wallets with filters
   */
  listWallets(filters?: WalletFilters): Observable<WalletListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<WalletListResponse>(`${this.baseUrl}`, { params });
  }

  /**
   * Get wallet by ID
   */
  getWalletById(walletId: string): Observable<WalletDetailsResponse> {
    return this.http.get<WalletDetailsResponse>(`${this.baseUrl}/${walletId}`);
  }

  /**
   * Update wallet status
   */
  updateWalletStatus(walletId: string, payload: UpdateWalletStatusPayload): Observable<WalletDetailsResponse> {
    return this.http.patch<WalletDetailsResponse>(`${this.baseUrl}/${walletId}/status`, payload);
  }

  /**
   * Update wallet limits
   */
  updateWalletLimits(walletId: string, payload: UpdateWalletLimitsPayload): Observable<WalletDetailsResponse> {
    return this.http.patch<WalletDetailsResponse>(`${this.baseUrl}/${walletId}/limits`, payload);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: Partial<WalletFilters>): HttpParams {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    
    return params;
  }
}