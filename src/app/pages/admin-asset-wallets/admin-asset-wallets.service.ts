// admin-asset-wallets.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AssetWallet,
  AssetWalletFilters,
  AssetWalletListResponse,
  AssetWalletDetailsResponse,
  UpdateAssetWalletStatusPayload
} from './admin-asset-wallets.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminAssetWalletsService {
  private baseUrl = 'https://doronpay.com/api/custody/asset-wallets';

  constructor(private http: HttpClient) {}

  /**
   * List asset wallets with filters
   */
  listAssetWallets(filters?: AssetWalletFilters): Observable<AssetWalletListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<AssetWalletListResponse>(`${this.baseUrl}`, { params });
  }

  /**
   * Get asset wallet by ID
   */
  getAssetWalletById(assetWalletId: string): Observable<AssetWalletDetailsResponse> {
    return this.http.get<AssetWalletDetailsResponse>(`${this.baseUrl}/${assetWalletId}`);
  }

  /**
   * Update asset wallet status
   */
  updateAssetWalletStatus(assetWalletId: string, payload: UpdateAssetWalletStatusPayload): Observable<AssetWalletDetailsResponse> {
    return this.http.patch<AssetWalletDetailsResponse>(`${this.baseUrl}/${assetWalletId}/status`, payload);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: Partial<AssetWalletFilters>): HttpParams {
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